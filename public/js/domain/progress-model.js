// 진도(Progress) 모델의 모양과 기본값.
// 서버와 화면이 같은 모양을 쓴다. 값 정리(검증)는 progress-mapper.js가 맡는다.

export const DEFAULT_SETTINGS = Object.freeze({
    sfx: true,          // 효과음
    city: 'seoul',      // 해 뜨고 지는 시각 기준 도시
    sky: 'auto',        // auto | day | night
    rankOptIn: true,    // 친구 랭킹 참여
    codyName: '코디',   // 캐릭터 이름
    algoLang: 'c',      // 알고리즘 문제를 풀 때 고른 언어
});

/**
 * @typedef {Object} SolvedRecord
 * @property {number} at      맞힌 시각(ms)
 * @property {number} tries   맞힐 때까지 제출 횟수
 * @property {number} time    걸린 시간(초)
 * @property {boolean} late   제한 시간을 넘겼는지
 */

/**
 * @typedef {Object} Progress
 * @property {Object<string, SolvedRecord>} solved
 * @property {Object<string, number>} tries        문제별 제출 횟수
 * @property {Object<string, number>} realTries    기본 틀이 아닌 코드로 낸 제출 횟수
 * @property {Object<string, number>} wrong        문제별 오답 횟수
 * @property {Object<string, number>} spent        문제별 풀이 시간(초)
 * @property {Object<string, string>} code         문제별 마지막 코드
 * @property {Object<string, number>} hintsOpen    문제별 열어 본 힌트 단계
 * @property {Object<string, number>} quiz         단원별 퀴즈 최고 점수
 * @property {Object<string, number>} oopQuiz      객체지향 레슨별 퀴즈 최고 점수
 * @property {Array<{id:number,res:string,at:number}>} history 최근 제출 기록
 * @property {{last: string|null, count: number}} streak 연속 학습일
 * @property {number} formSeen                      마지막으로 보여 준 코디 단계
 * @property {typeof DEFAULT_SETTINGS} settings
 */

/** @returns {Progress} */
export function createEmptyProgress() {
    return {
        solved: {},
        tries: {},
        realTries: {},
        wrong: {},
        spent: {},
        code: {},
        hintsOpen: {},
        quiz: {},
        oopQuiz: {},
        history: [],
        streak: { last: null, count: 0 },
        formSeen: 0,
        settings: { ...DEFAULT_SETTINGS },
    };
}
