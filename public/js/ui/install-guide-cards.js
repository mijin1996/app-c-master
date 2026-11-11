// "앱처럼 쓰기" 안내 카드: 카드마다 몇 줄인지만 여기서 정하고, 글은 사전(install.<카드>.<줄>)에 있다.
// 핵심만 짧게 — 카드마다 3줄 이하, 한 줄 길이 제한은 언어마다 (테스트가 지킨다)
export const MAX_STEPS = 3;
export const MAX_STEP_CHARS = Object.freeze({ ko: 30, zh: 30, en: 50 });
export const CARD_STEPS = Object.freeze({ ios: 2, android: 3, desktop: 2 });

/** 사전 함수(t)로 카드 하나의 제목 · 줄들을 만든다 */
export function cardOf(id, translate) {
    return {
        title: translate('install.' + id + '.title'),
        steps: Array.from({ length: CARD_STEPS[id] }, (_, i) => translate('install.' + id + '.' + i)),
    };
}
