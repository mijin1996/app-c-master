// 언어 규칙 (순수 함수): 어떤 언어를 쓸지 고르고, 문장 속 {자리}를 채운다
export const LOCALES = Object.freeze(['ko', 'en', 'zh']);
export const DEFAULT_LOCALE = 'ko';
export const LOCALE_NAMES = Object.freeze({ ko: '한국어', en: 'English', zh: '中文' });

/** "en-US" → "en", "zh-TW" → "zh". 모르는 언어면 null */
export function normalizeLocale(value) {
    const head = String(value ?? '').trim().toLowerCase().split(/[-_]/)[0];
    return LOCALES.includes(head) ? head : null;
}

/** 저장해 둔 언어 → 브라우저 언어 목록 → 한국어 순서로 고른다 */
export function pickLocale(saved, browserLanguages) {
    const mine = normalizeLocale(saved);
    if (mine) {
        return mine;
    }
    for (const lang of Array.isArray(browserLanguages) ? browserLanguages : []) {
        const found = normalizeLocale(lang);
        if (found) {
            return found;
        }
    }
    return DEFAULT_LOCALE;
}

/** "{n}개" 의 {n} 을 vars.n 으로. 값이 없는 자리는 그대로 둔다 */
export function interpolate(text, vars) {
    if (!vars) {
        return text;
    }
    return String(text).replace(/\{(\w+)\}/g, (whole, name) => (vars[name] === undefined || vars[name] === null ? whole : String(vars[name])));
}
