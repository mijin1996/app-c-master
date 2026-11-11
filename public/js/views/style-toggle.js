// 코드 스타일 토글 (Allman | K&R): 에디터 위 막대에 붙는다. 중괄호를 쓰는 언어(C · C++ · Java)에서만 보인다.
import { esc } from '../ui/dom.js';
import { t } from '../i18n/index.js';
import { CodeStyle } from '../domain/brace-style.js';
import { LanguageId } from '../domain/languages.js';

const STYLES = Object.freeze([CodeStyle.ALLMAN, CodeStyle.KNR]);

export const usesBraces = (languageId) => languageId !== LanguageId.PYTHON;

export function styleToggleHtml(current) {
    return '<div class="style-toggle" role="group" aria-label="' + esc(t('style.label')) + '">' +
        STYLES.map((style) => '<button type="button" data-style="' + style + '" aria-pressed="' + (style === current) + '" title="' + esc(t('style.' + style + 'Title')) + '">' + esc(t('style.' + style)) + '</button>').join('') +
        '</div>';
}

/** 누르면 onPick(style). 누른 버튼만 눌린 모양으로 */
export function bindStyleToggle(root, onPick) {
    const buttons = [...root.querySelectorAll('.style-toggle [data-style]')];
    buttons.forEach((button) => {
        button.onclick = () => {
            buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
            onPick(button.dataset.style);
        };
    });
}
