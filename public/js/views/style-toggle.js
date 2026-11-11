// 코드 스타일 토글 (Allman | K&R): 에디터 위 막대에 붙는다. 중괄호를 쓰는 언어(C · C++ · Java)에서만 보인다.
// 다른 토글처럼 <select> 로 그리고, 모양은 ui/picker.js 가 "앱처럼 써 봐요" 카드 창으로 바꾼다.
import { esc } from '../ui/dom.js';
import { t } from '../i18n/index.js';
import { CodeStyle } from '../domain/brace-style.js';
import { LanguageId } from '../domain/languages.js';

const STYLES = Object.freeze([CodeStyle.ALLMAN, CodeStyle.KNR]);

export const usesBraces = (languageId) => languageId !== LanguageId.PYTHON;

export function styleToggleHtml(current) {
    return '<label class="lang-pick style-toggle">' + esc(t('style.label')) + ' <select data-style-select aria-label="' + esc(t('style.label')) + '">' +
        STYLES.map((style) => '<option value="' + style + '"' + (style === current ? ' selected' : '') + ' title="' + esc(t('style.' + style + 'Title')) + '">' + esc(t('style.' + style)) + '</option>').join('') +
        '</select></label>';
}

/** 고르면 onPick(style) */
export function bindStyleToggle(root, onPick) {
    const select = root.querySelector('[data-style-select]');
    if (select) {
        select.onchange = () => onPick(select.value);
    }
}
