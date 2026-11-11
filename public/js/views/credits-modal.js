// 출처 · 라이선스 창. 첫 화면과 모든 화면 아래쪽 "출처" 버튼에서 연다. 지금 언어로 보여 준다.
import { esc } from '../ui/dom.js';
import { CREDITS, creditText } from '../config/credits.js';
import { t, getLocale } from '../i18n/index.js';

export function openCredits() {
    const locale = getLocale();
    const text = (value) => creditText(value, locale);
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    const groups = CREDITS.map((group) => '<section class="cr-group"><h3>' + esc(text(group.group)) + '</h3><ul>' +
        group.items.map((item) => '<li><div class="cr-name">' +
            (item.url ? '<a href="' + esc(item.url) + '" target="_blank" rel="noopener noreferrer">' + esc(text(item.name)) + '</a>' : esc(text(item.name))) +
            ' <span class="muted">· ' + esc(text(item.by)) + '</span></div>' +
            '<div class="cr-license chip">' + esc(text(item.license)) + '</div>' +
            '<div class="cr-note muted">' + esc(text(item.note)) + '</div></li>').join('') + '</ul></section>').join('');
    bg.innerHTML = '<div class="panel modal credits" role="dialog" aria-modal="true" aria-labelledby="cr-t">' +
        '<h2 id="cr-t">' + esc(t('creditsModal.title')) + '</h2>' + groups +
        '<button class="btn primary" id="cr-close">' + esc(t('common.close')) + '</button></div>';
    document.body.appendChild(bg);
    const close = () => {
        bg.remove();
        document.removeEventListener('keydown', onKey);
    };
    const onKey = (event) => {
        if (event.key === 'Escape') {
            close();
        }
    };
    document.addEventListener('keydown', onKey);
    bg.addEventListener('click', (event) => {
        if (event.target === bg) {
            close();
        }
    });
    bg.querySelector('#cr-close').onclick = close;
    bg.querySelector('#cr-close').focus();
}

/** 화면 아래쪽에 붙이는 작은 출처 버튼 (그릴 때마다 지금 언어로) */
export const CREDITS_BUTTON = () => '<button type="button" class="credits-link" data-credits>' + esc(t('credits.button')) + '</button>';

export function bindCreditsButtons(root = document) {
    root.querySelectorAll('[data-credits]').forEach((button) => {
        button.onclick = openCredits;
    });
}
