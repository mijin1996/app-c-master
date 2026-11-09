// 학습 규칙: 경험치, 레벨, 단원 클리어, 코디 진화.
// 화면과 서버가 똑같이 쓰는 순수 함수 모음이라 저장소나 화면 코드를 모른다.

export const XP_BY_LEVEL = Object.freeze({ 1: 10, 2: 20, 3: 30 });   // 난이도별 경험치
export const SOLVE_LIMIT_SEC = Object.freeze({ 1: 600, 2: 1200, 3: 1800 }); // 풀이 제한 시간(초)
export const LATE_XP_RATE = 0.2;    // 시간을 넘겨 맞히면 20%만
export const XP_PER_LEVEL = 100;
export const QUIZ_SIZE = 5;
export const QUIZ_PASS_SCORE = 4;
export const QUIZ_PASS_XP = 10;
export const QUIZ_PERFECT_XP = 10;
export const HISTORY_LIMIT = 200;

export const FORM_NAMES = Object.freeze(['아기 코더', '초딩 코더', '중딩 코더', '고딩 코더', 'C 마스터']);
export const FORM_COUNT_BY_STAGE = 3; // 앞의 세 스테이지가 1~3단계 진화를 결정, 전체 클리어가 4단계

export const STAGES = Object.freeze([
    { name: '기초', reward: '클리어하면 코디가 초딩 코더로 진화' },
    { name: '제어', reward: '클리어하면 중딩 코더로 진화' },
    { name: '자료·함수', reward: '클리어하면 고딩 코더로 진화' },
    { name: '문자열·구조체', reward: '마스터까지 한 걸음' },
    { name: '포인터·파일', reward: '모두 클리어하면 C 마스터!' },
]);

/** 난이도와 걸린 시간으로 받을 경험치 */
export function xpForSolve(level, spentSec) {
    const full = XP_BY_LEVEL[level] ?? 0;
    if (spentSec <= (SOLVE_LIMIT_SEC[level] ?? Infinity)) {
        return full;
    }
    return Math.max(1, Math.round(full * LATE_XP_RATE));
}

export function levelOf(xp) {
    return Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1;
}

function problemLevelMap(curriculum) {
    const map = new Map();
    for (const chapter of curriculum) {
        for (const p of chapter.problems) {
            map.set(String(p.id), p.level);
        }
    }
    return map;
}

/** 저장된 기록으로 경험치를 다시 계산한다 (서버도 이 값만 믿는다) */
export function computeXp(progress, curriculum) {
    const levels = problemLevelMap(curriculum);
    let xp = 0;
    for (const [id, record] of Object.entries(progress.solved)) {
        const level = levels.get(String(id));
        if (level === undefined) {
            continue;
        }
        xp += record.late ? xpForSolve(level, Infinity) : XP_BY_LEVEL[level];
    }
    for (const chapter of curriculum) {
        const best = progress.quiz[chapter.chapter];
        if (best >= QUIZ_PASS_SCORE) {
            xp += QUIZ_PASS_XP;
        }
        if (best === QUIZ_SIZE) {
            xp += QUIZ_PERFECT_XP;
        }
    }
    return xp;
}

export function solvedCountIn(progress, chapter) {
    return chapter.problems.filter((p) => progress.solved[p.id]).length;
}

export function isChapterCleared(progress, chapter) {
    return solvedCountIn(progress, chapter) === chapter.problems.length
        && (progress.quiz[chapter.chapter] ?? 0) >= QUIZ_PASS_SCORE;
}

/** 'cleared' | 'inProgress' | 'notStarted' */
export function chapterState(progress, chapter) {
    if (isChapterCleared(progress, chapter)) {
        return 'cleared';
    }
    const touched = chapter.problems.some((p) => progress.solved[p.id] || progress.tries[p.id])
        || progress.quiz[chapter.chapter] !== undefined;
    return touched ? 'inProgress' : 'notStarted';
}

export function chaptersOfStage(curriculum, stageIndex) {
    return curriculum.filter((c) => c.stage === stageIndex);
}

export function isStageCleared(progress, curriculum, stageIndex) {
    const chapters = chaptersOfStage(curriculum, stageIndex);
    return chapters.length > 0 && chapters.every((c) => isChapterCleared(progress, c));
}

/** 코디 진화 단계 0~4 */
export function formOf(progress, curriculum) {
    if (curriculum.every((c) => isChapterCleared(progress, c))) {
        return FORM_NAMES.length - 1;
    }
    let form = 0;
    for (let i = 0; i < FORM_COUNT_BY_STAGE; i++) {
        if (!isStageCleared(progress, curriculum, i)) {
            break;
        }
        form = i + 1;
    }
    return form;
}

/** 오늘 날짜(YYYY-MM-DD)로 연속 학습일을 갱신한 새 값을 돌려준다 */
export function nextStreak(streak, today, yesterday) {
    if (streak.last === today) {
        return streak;
    }
    return { last: today, count: streak.last === yesterday ? streak.count + 1 : 1 };
}

/** 랭킹·선생님 화면용 요약 (코드 같은 개인 내용은 넣지 않는다) */
export function summarize(progress, curriculum) {
    const xp = computeXp(progress, curriculum);
    const states = curriculum.map((c) => chapterState(progress, c));
    const quizScores = Object.values(progress.quiz);
    const quizAvg = quizScores.length
        ? Math.round((quizScores.reduce((a, b) => a + b, 0) / quizScores.length) * 10) / 10
        : null;
    return {
        xp,
        level: levelOf(xp),
        form: formOf(progress, curriculum),
        solvedCount: Object.keys(progress.solved).filter((id) => problemLevelMap(curriculum).has(String(id))).length,
        clearedCount: states.filter((s) => s === 'cleared').length,
        chapterStates: states,
        quizAvg,
        lastStudyDay: progress.streak.last,
        streak: progress.streak.count,
        wrong: { ...progress.wrong },
    };
}
