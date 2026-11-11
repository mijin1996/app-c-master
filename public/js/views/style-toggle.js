// 코드 스타일 토글 (Allman | K&R): 에디터 위 막대에 붙는다. 중괄호를 쓰는 언어(C · C++ · Java)에서만 보인다.
// 다른 토글처럼 <select> 로 그리고, 모양은 ui/picker.js 가 "앱처럼 써 봐요" 카드 창으로 바꾼다.
import { esc } from '../ui/dom.js';
import { t } from '../i18n/index.js';
import { CodeStyle } from '../domain/brace-style.js';
import { LanguageId } from '../domain/languages.js';

const STYLES = Object.freeze([CodeStyle.ALLMAN, CodeStyle.KNR]);

export const usesBraces = (languageId) => languageId !== LanguageId.PYTHON;

export function styleToggleHtml(current) {
    // 옆에도 고르기 창 제목에도 "코드 스타일" 글은 보이지 않는다 (Allman · K&R 글자만). 이름은 화면 읽기 프로그램용으로만
    return '<span class="lang-pick style-toggle"><select data-style-select data-picker-quiet aria-label="' + esc(t('style.label')) + '">' +
        STYLES.map((style) => '<option value="' + style + '"' + (style === current ? ' selected' : '') + '>' + esc(t('style.' + style)) + '</option>').join('') +
        '</select></span>';
}

/** 에디터 막대의 자리(slot)에 토글을 그린다. Python 처럼 중괄호가 없는 언어면 비운다. 고르면 onPick(style) */
export function mountStyleToggle(slot, { language, current, onPick }) {
    if (!slot) {
        return;
    }
    if (!usesBraces(language)) {
        slot.innerHTML = '';
        return;
    }
    slot.innerHTML = styleToggleHtml(current);
    const select = slot.querySelector('[data-style-select]');
    select.onchange = () => onPick(select.value);
}
