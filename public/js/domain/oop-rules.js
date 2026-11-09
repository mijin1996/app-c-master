// 객체지향 레슨 퀴즈 규칙: 경험치만 준다 (단원 클리어 · 코디 진화와는 상관없음).
// 화면과 서버가 똑같이 쓰는 순수 함수라 저장소나 화면을 모른다.
import { OOP_LESSONS } from './oop-curriculum.js';

export const OOP_QUIZ_SIZE = 5;
export const OOP_PASS_SCORE = 4;
export const OOP_PASS_XP = 10;
export const OOP_PERFECT_XP = 10;
export const OOP_LESSON_MAX = 99;

// 1~99 (앞에 0을 붙인 "01" 같은 건 다른 키가 되니 막는다)
const LESSON_NO = /^[1-9]\d?$/;

export function isOopLessonNo(key) {
    return LESSON_NO.test(String(key));
}

/** 최고 점수 하나로 받는 경험치: 통과 10 + 만점 10 */
export function oopXpForBest(best) {
    if (typeof best !== 'number') {
        return 0;
    }
    let xp = 0;
    if (best >= OOP_PASS_SCORE) {
        xp += OOP_PASS_XP;
    }
    if (best >= OOP_QUIZ_SIZE) {
        xp += OOP_PERFECT_XP;
    }
    return xp;
}

/** 예전 최고 점수 → 이번 점수로 바뀔 때 새로 얻는 경험치 (낮아져도 빼지 않는다) */
export function oopGainedXp(prevBest, score) {
    return Math.max(0, oopXpForBest(Math.max(prevBest ?? 0, score)) - oopXpForBest(prevBest));
}

/** 저장된 최고 점수로 경험치를 다시 계산한다. 목록에 있는 레슨만 센다 */
export function computeOopXp(oopQuiz, lessons = OOP_LESSONS) {
    if (oopQuiz === null || typeof oopQuiz !== 'object') {
        return 0;
    }
    return lessons.reduce((sum, lesson) => sum + oopXpForBest(oopQuiz[lesson.no]), 0);
}
