// 언어 버튼: 한국어 · English · 中文. 어느 화면에서든 바꾸면 그 자리에서 다시 그린다 (app.setLocaleAsync).
import { esc } from '../ui/dom.js';
import { t, getLocale } from '../i18n/index.js';
import { LOCALES, LOCALE_NAMES } from '../i18n/locale-rules.js';

export function langSwitchHtml() {
    const current = getLocale();
    return '<label class="lang-switch" title="' + esc(t('lang.label')) + '"><span class="lang-globe" aria-hidden="true">🌐</span>' +
        '<select data-lang aria-label="' + esc(t('lang.label')) + '">' +
        LOCALES.map((locale) => '<option value="' + locale + '"' + (locale === current ? ' selected' : '') + ' lang="' + locale + '">' + esc(LOCALE_NAMES[locale]) + '</option>').join('') +
        '</select></label>';
}

export function bindLangSwitch(app, root = document) {
    root.querySelectorAll('[data-lang]').forEach((select) => {
        select.onchange = () => app.setLocaleAsync(select.value);
    });
}
