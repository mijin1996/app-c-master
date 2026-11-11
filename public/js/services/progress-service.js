// Service(화면 쪽): 지금 로그인한 사람의 진도를 들고 있고, 학습 규칙대로 바꾼다.
// 저장은 Repository에 맡기고(조금 모았다가 한 번에), 변화는 구독자에게 알린다(옵저버).
import { Result, Failure } from '../core/result.js';
import { AppError } from '../core/app-error.js';
import { OOP_LESSONS } from '../domain/oop-curriculum.js';
import { oopGainedXp, OOP_QUIZ_SIZE } from '../domain/oop-rules.js';
import { practiceKey, checkPractice, PRACTICE_XP } from '../domain/oop-practice-rules.js';
import { formatBraces } from '../domain/brace-style.js';
import { progressFromDto } from '../mappers/progress-mapper.js';
import { LanguageId, languageOf, codeKey } from '../domain/languages.js';
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
    #oopLessons;
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
    constructor(repository, curriculum, calendar, timer = globalThis, oopLessons = OOP_LESSONS) {
        this.#repository = repository;
        this.#curriculum = curriculum;
        this.#calendar = calendar;
        this.#timer = timer;
        this.#oopLessons = oopLessons;
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
        return summarize(this.#progress, this.#curriculum, this.#oopLessons);
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
        const after = summarize(this.#progress, this.#curriculum, this.#oopLessons);
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
        const s = summarize(this.#progress, this.#curriculum, this.#oopLessons);
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
    recordSubmission(problemId, verdict, code, languageId = LanguageId.C) {
        const template = languageId === LanguageId.C ? DEFAULT_CODE : languageOf(languageId).template;
        const p = this.#progress;
        const id = String(problemId);
        const chapterNo = this.#chapterOf(id);
        const before = this.#snapshot(chapterNo);

        p.tries[id] = (p.tries[id] ?? 0) + 1;
        if (squash(code) !== squash(template) && squash(code).length > squash(template).length + REAL_TRY_MIN_EXTRA_CHARS) {
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

    /**
     * 객체지향 레슨 퀴즈 점수 기록 (최고 점수만 남긴다). 단원 클리어 · 진화와는 상관없다
     * @returns {Result} 성공: { gainedXp, best, events } / 실패: INVALID_PROGRESS
     */
    recordOopQuiz(lessonNo, score) {
        const known = this.#oopLessons.some((lesson) => lesson.no === Number(lessonNo));
        if (!known || !Number.isInteger(score) || score < 0 || score > OOP_QUIZ_SIZE) {
            return Result.failure(AppError.INVALID_PROGRESS);
        }
        const p = this.#progress;
        const key = String(lessonNo);
        const before = this.#snapshot(null);
        const prev = p.oopQuiz[key];
        const gainedXp = oopGainedXp(prev, score);
        if (prev === undefined || score > prev) {
            p.oopQuiz[key] = score;
        }
        this.#touchStreak();
        const events = this.#eventsSince(before, null);
        this.#changed();
        return Result.success({ gainedXp, best: p.oopQuiz[key], events });
    }

    /**
     * 객체지향 코드 실습 결과 기록. 맞혔을 때 처음 한 번만 경험치를 준다 (채점은 checkPractice 가 한다)
     * @param {number} lessonNo
     * @param {number} index 레슨 안 실습 순서 (0부터)
     * @param {boolean} correct
     * @returns {Result} 성공: { gainedXp, solved, events } / 실패: INVALID_PROGRESS
     */
    recordOopPractice(lessonNo, index, correct) {
        const lesson = this.#oopLessons.find((l) => l.no === Number(lessonNo));
        if (!lesson || !Number.isInteger(index) || index < 0 || index >= (lesson.practice ?? 0)) {
            return Result.failure(AppError.INVALID_PROGRESS);
        }
        const p = this.#progress;
        const key = practiceKey(lesson.no, index);
        const before = this.#snapshot(null);
        let gainedXp = 0;
        if (correct === true && p.oopPractice[key] !== 1) {
            p.oopPractice[key] = 1;
            gainedXp = PRACTICE_XP;
        }
        this.#touchStreak();
        const events = this.#eventsSince(before, null);
        this.#changed();
        return Result.success({ gainedXp, solved: p.oopPractice[key] === 1, events });
    }

    /** 화면이 부르는 곳: 채점(checkPractice)하고 기록까지. 성공: { correct, marks, gainedXp, solved, events } */
    answerOopPractice(lessonNo, index, practice, inputs) {
        const graded = checkPractice(practice, inputs);
        const recorded = this.recordOopPractice(lessonNo, index, graded.correct);
        if (recorded instanceof Failure) {
            return recorded;
        }
        return Result.success({ ...graded, ...recorded.data });
    }

    isPracticeSolved(lessonNo, index) {
        return this.#progress.oopPractice[practiceKey(lessonNo, index)] === 1;
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

    /** 저장한 코드, 없으면 처음 틀 (중괄호를 쓰는 언어는 고른 스타일로) */
    codeOf(problemId, languageId = LanguageId.C) {
        const saved = this.#progress.code[codeKey(problemId, languageId)];
        return saved ?? this.templateOf(languageId);
    }

    /** 처음 틀: 중괄호 언어(C · C++ · Java)는 설정한 스타일로, Python 은 그대로 */
    templateOf(languageId = LanguageId.C) {
        const template = languageId === LanguageId.C ? DEFAULT_CODE : languageOf(languageId).template;
        return languageId === LanguageId.PYTHON ? template : formatBraces(template, this.#progress.settings.codeStyle);
    }

    /** 설명 · 퀴즈에 보여 주는 C 예시 코드도 고른 스타일로 (한 사이트 안에서 모양이 같도록) */
    styleSnippet(code) {
        return code ? formatBraces(code, this.#progress.settings.codeStyle) : '';
    }

    /** 스타일 토글: 지금 코드를 그 스타일로 바꿔 저장하고, 고른 스타일을 기억한다 */
    restyleCode(problemId, code, style, languageId = LanguageId.C) {
        const styled = formatBraces(code, style);
        this.updateSettings({ codeStyle: style });
        this.saveCode(problemId, styled, languageId);
        return styled;
    }

    saveCode(problemId, code, languageId = LanguageId.C) {
        this.#progress.code[codeKey(problemId, languageId)] = code;
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
