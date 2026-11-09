// Service(화면 쪽): 지금 로그인한 사람의 진도를 들고 있고, 학습 규칙대로 바꾼다.
// 저장은 Repository에 맡기고(조금 모았다가 한 번에), 변화는 구독자에게 알린다(옵저버).
import { Result, Failure } from '../core/result.js';
import { progressFromDto } from '../mappers/progress-mapper.js';
import {
    xpForSolve, summarize, problemLevelMap, isChapterCleared, formOf, levelOf, nextStreak,
    SOLVE_LIMIT_SEC, QUIZ_PASS_SCORE, QUIZ_SIZE, QUIZ_PASS_XP, QUIZ_PERFECT_XP, HISTORY_LIMIT,
} from '../domain/progress-rules.js';

export const DEFAULT_CODE = '#include <stdio.h>\n\nint main() {\n    \n    return 0;\n}\n';
export const REAL_TRY_MIN_EXTRA_CHARS = 8; // 기본 틀보다 이만큼은 더 써야 "직접 쓴 코드"
export const SOLUTION_MIN_REAL_TRIES = 2;
const SAVE_DELAY_MS = 1500;

const squash = (text) => String(text).replace(/\s+/g, '');

export class ProgressService {
    #repository;
    #curriculum;
    #calendar;
    #timer;
    #progress = null;
    #levels = new Map();
    #listeners = new Set();
    #saveHandle = null;

    /**
     * @param {{loadAsync: Function, saveAsync: Function}} repository
     * @param {Array} curriculum
     * @param {{today: () => string, yesterday: () => string, now: () => number}} calendar
     * @param {{setTimeout: Function, clearTimeout: Function}} timer
     */
    constructor(repository, curriculum, calendar, timer = globalThis) {
        this.#repository = repository;
        this.#curriculum = curriculum;
        this.#calendar = calendar;
        this.#timer = timer;
        this.#levels = problemLevelMap(curriculum);
    }

    async loadAsync() {
        const loaded = await this.#repository.loadAsync();
        if (loaded instanceof Failure) {
            return loaded;
        }
        this.#progress = progressFromDto(loaded.data.progress);
        this.#notify();
        return Result.success(this.#progress);
    }

    /** 로그아웃할 때 비운다 */
    clear() {
        this.#progress = null;
        this.#timer.clearTimeout(this.#saveHandle);
    }

    get progress() {
        return this.#progress;
    }

    get summary() {
        return summarize(this.#progress, this.#curriculum);
    }

    get curriculum() {
        return this.#curriculum;
    }

    levelOf(problemId) {
        return this.#levels.get(String(problemId)) ?? 1;
    }

    /** 변화를 구독한다. 돌려받은 함수를 부르면 구독 해제 */
    onChange(listener) {
        this.#listeners.add(listener);
        return () => this.#listeners.delete(listener);
    }

    #notify() {
        for (const listener of this.#listeners) {
            listener(this.#progress);
        }
    }

    #touchStreak() {
        this.#progress.streak = nextStreak(this.#progress.streak, this.#calendar.today(), this.#calendar.yesterday());
    }

    /** 바뀐 뒤에 생긴 일(단원 클리어, 레벨 업, 진화)을 찾는다 */
    #eventsSince(before, chapterNo) {
        const after = summarize(this.#progress, this.#curriculum);
        const chapter = this.#curriculum.find((c) => c.chapter === chapterNo);
        const form = formOf(this.#progress, this.#curriculum);
        return {
            chapterCleared: chapter && !before.cleared && isChapterCleared(this.#progress, chapter) ? chapterNo : null,
            levelUp: after.level > before.level ? after.level : null,
            evolvedTo: form > this.#progress.formSeen ? form : null,
        };
    }

    #snapshot(chapterNo) {
        const chapter = this.#curriculum.find((c) => c.chapter === chapterNo);
        const s = summarize(this.#progress, this.#curriculum);
        return { cleared: chapter ? isChapterCleared(this.#progress, chapter) : false, level: s.level };
    }

    #chapterOf(problemId) {
        const found = this.#curriculum.find((c) => c.problems.some((p) => p.id === Number(problemId)));
        return found ? found.chapter : null;
    }

    /**
     * 채점 결과를 기록한다.
     * @param {number} problemId
     * @param {'AC'|'WA'|'CE'|'RE'|'TLE'|'OLE'} verdict
     * @param {string} code 제출한 코드
     */
    recordSubmission(problemId, verdict, code) {
        const p = this.#progress;
        const id = String(problemId);
        const chapterNo = this.#chapterOf(id);
        const before = this.#snapshot(chapterNo);

        p.tries[id] = (p.tries[id] ?? 0) + 1;
        if (squash(code) !== squash(DEFAULT_CODE) && squash(code).length > squash(DEFAULT_CODE).length + REAL_TRY_MIN_EXTRA_CHARS) {
            p.realTries[id] = (p.realTries[id] ?? 0) + 1;
        }
        p.history = [{ id: Number(id), res: verdict, at: this.#calendar.now() }, ...p.history].slice(0, HISTORY_LIMIT);
        this.#touchStreak();

        let gainedXp = 0;
        let late = false;
        if (verdict === 'AC' && !p.solved[id]) {
            const spent = p.spent[id] ?? 0;
            late = spent > SOLVE_LIMIT_SEC[this.levelOf(id)];
            gainedXp = xpForSolve(this.levelOf(id), spent);
            p.solved[id] = { at: this.#calendar.now(), tries: p.tries[id], time: spent, late };
        } else if (verdict !== 'AC') {
            p.wrong[id] = (p.wrong[id] ?? 0) + 1;
        }

        const events = this.#eventsSince(before, chapterNo);
        this.#changed();
        return { gainedXp, late, firstSolve: gainedXp > 0, events };
    }

    /** 퀴즈 점수 기록 (최고 점수만 남긴다) */
    recordQuiz(chapterNo, score) {
        const p = this.#progress;
        const before = this.#snapshot(chapterNo);
        const prev = p.quiz[chapterNo];
        let gainedXp = 0;
        if (score >= QUIZ_PASS_SCORE && (prev === undefined || prev < QUIZ_PASS_SCORE)) {
            gainedXp += QUIZ_PASS_XP;
        }
        if (score === QUIZ_SIZE && prev !== QUIZ_SIZE) {
            gainedXp += QUIZ_PERFECT_XP;
        }
        if (prev === undefined || score > prev) {
            p.quiz[chapterNo] = score;
        }
        this.#touchStreak();
        const events = this.#eventsSince(before, chapterNo);
        this.#changed();
        return { gainedXp, events };
    }

    /** 문제 화면이 1초 열려 있을 때마다 부른다 */
    addSolveSecond(problemId) {
        const id = String(problemId);
        if (this.#progress.solved[id]) {
            return this.#progress.spent[id] ?? 0;
        }
        this.#progress.spent[id] = (this.#progress.spent[id] ?? 0) + 1;
        this.#changed(false);
        return this.#progress.spent[id];
    }

    spentOf(problemId) {
        return this.#progress.spent[String(problemId)] ?? 0;
    }

    canSeeSolution(problemId) {
        const id = String(problemId);
        const p = this.#progress;
        if (p.solved[id]) {
            return true;
        }
        return (p.realTries[id] ?? 0) >= SOLUTION_MIN_REAL_TRIES && (p.spent[id] ?? 0) >= SOLVE_LIMIT_SEC[this.levelOf(id)];
    }

    hintLevel(problemId) {
        return this.#progress.hintsOpen[String(problemId)] ?? 0;
    }

    openNextHint(problemId) {
        const id = String(problemId);
        this.#progress.hintsOpen[id] = this.hintLevel(id) + 1;
        this.#changed();
        return this.#progress.hintsOpen[id];
    }

    codeOf(problemId) {
        return this.#progress.code[String(problemId)] ?? DEFAULT_CODE;
    }

    saveCode(problemId, code) {
        this.#progress.code[String(problemId)] = code;
        this.#changed(false);
    }

    updateSettings(patch) {
        // Mapper를 거쳐서 이상한 값은 정리한다
        const cleaned = progressFromDto({ ...this.#progress, settings: { ...this.#progress.settings, ...patch } });
        this.#progress.settings = cleaned.settings;
        this.#changed();
    }

    markFormSeen(form) {
        this.#progress.formSeen = Math.max(this.#progress.formSeen, form);
        this.#changed();
    }

    currentForm() {
        return formOf(this.#progress, this.#curriculum);
    }

    currentLevel() {
        return levelOf(this.summary.xp);
    }

    #changed(notify = true) {
        if (notify) {
            this.#notify();
        }
        this.#timer.clearTimeout(this.#saveHandle);
        this.#saveHandle = this.#timer.setTimeout(() => this.flushAsync(), SAVE_DELAY_MS);
    }

    /** 모아 둔 변경을 지금 저장한다 */
    async flushAsync() {
        this.#timer.clearTimeout(this.#saveHandle);
        this.#saveHandle = null;
        if (!this.#progress) {
            return Result.success(false);
        }
        return this.#repository.saveAsync(this.#progress);
    }
}
