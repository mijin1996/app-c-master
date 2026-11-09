// 사이트 전체가 함께 쓰는 번역기 하나. 화면 코드는 여기서 t 를 가져다 쓴다.
// 고른 언어는 이 브라우저(localStorage 'cm-lang')만 기억한다 — 다른 기기 · 다른 사람과는 상관없음.
import { createTranslator } from './i18n.js';
import { pickLocale } from './locale-rules.js';
import { MESSAGES_KO } from './messages-ko.js';
import { MESSAGES_EN } from './messages-en.js';
import { MESSAGES_ZH } from './messages-zh.js';

const STORAGE_KEY = 'cm-lang';
const HTML_LANG = Object.freeze({ ko: 'ko', en: 'en', zh: 'zh-CN' });

const translator = createTranslator({ ko: MESSAGES_KO, en: MESSAGES_EN, zh: MESSAGES_ZH });

export const t = (key, vars) => translator.t(key, vars);
export const getLocale = () => translator.getLocale();
export const onLocaleChange = (listener) => translator.onLocaleChange(listener);

function readSaved() {
    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
        return null;
    }
}

function applyHtmlLang(locale) {
    if (typeof document !== 'undefined') {
        document.documentElement.lang = HTML_LANG[locale] ?? 'ko';
    }
}

/** 시작할 때 한 번: 저장한 언어 → 브라우저 언어 → 한국어 */
export function initLocale() {
    const languages = typeof navigator !== 'undefined' ? (navigator.languages ?? [navigator.language]) : [];
    translator.setLocale(pickLocale(readSaved(), languages));
    applyHtmlLang(translator.getLocale());
    return translator.getLocale();
}

/** 언어 버튼에서 부른다: 바꾸고, 기억하고, 구독자(화면 다시 그리기)에게 알린다 */
export function changeLocale(locale) {
    const changed = translator.setLocale(locale);
    if (changed) {
        try {
            localStorage.setItem(STORAGE_KEY, locale);
        } catch (e) {
            // 저장이 막힌 브라우저면 이번 방문에서만 바뀐다
        }
        applyHtmlLang(locale);
    }
    return changed;
}
