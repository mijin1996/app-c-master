// 번역 함수: 지금 언어 하나를 들고 있다가 t('키') 로 문장을 돌려준다.
// 빠진 번역은 한국어로, 한국어에도 없으면 키를 그대로 보여 줘서 화면이 비지 않게 한다.
import { LOCALES, DEFAULT_LOCALE, interpolate } from './locale-rules.js';

/** 사전 묶음으로 번역기를 만든다 (테스트에서는 작은 가짜 사전을 넣는다) */
export function createTranslator(dictionaries) {
    let locale = DEFAULT_LOCALE;
    const listeners = new Set();
    return {
        t(key, vars) {
            const text = dictionaries[locale]?.[key] ?? dictionaries[DEFAULT_LOCALE]?.[key] ?? key;
            return interpolate(text, vars);
        },
        getLocale() {
            return locale;
        },
        /** 바뀌었을 때만 구독자에게 알린다. 모르는 언어는 무시 */
        setLocale(next) {
            if (!LOCALES.includes(next) || next === locale) {
                return false;
            }
            locale = next;
            for (const listener of listeners) {
                listener(locale);
            }
            return true;
        },
        onLocaleChange(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
    };
}
