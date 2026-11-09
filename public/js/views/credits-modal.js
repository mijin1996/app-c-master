// 출처 · 라이선스 창. 첫 화면과 모든 화면 아래쪽 "출처" 버튼에서 연다.
import { esc } from '../ui/dom.js';
import { CREDITS } from '../config/credits.js';

export function openCredits() {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    const groups = CREDITS.map((group) => '<section class="cr-group"><h3>' + esc(group.group) + '</h3><ul>' +
        group.items.map((item) => '<li><div class="cr-name">' +
            (item.url ? '<a href="' + esc(item.url) + '" target="_blank" rel="noopener noreferrer">' + esc(item.name) + '</a>' : esc(item.name)) +
            ' <span class="muted">· ' + esc(item.by) + '</span></div>' +
            '<div class="cr-license chip">' + esc(item.license) + '</div>' +
            '<div class="cr-note muted">' + esc(item.note) + '</div></li>').join('') + '</ul></section>').join('');
    bg.innerHTML = '<div class="panel modal credits" role="dialog" aria-modal="true" aria-labelledby="cr-t">' +
        '<h2 id="cr-t">출처 · 라이선스</h2>' + groups +
        '<button class="btn primary" id="cr-close">닫기</button></div>';
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

/** 화면 아래쪽에 붙이는 작은 출처 버튼 */
export const CREDITS_BUTTON = '<button type="button" class="credits-link" data-credits>출처 · 라이선스</button>';

export function bindCreditsButtons(root = document) {
    root.querySelectorAll('[data-credits]').forEach((button) => {
        button.onclick = openCredits;
    });
}
