// 화면 공용 도우미: DOM 찾기, HTML 이스케이프, 토스트, 날짜
import { t } from '../i18n/index.js';
export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export const pad2 = (n) => String(n).padStart(2, '0');

export function dayKey(date = new Date()) {
    return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
}

export function yesterdayKey(date = new Date()) {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    return dayKey(d);
}

export const fmtMS = (sec) => {
    const s = Math.max(0, Math.floor(sec));
    return pad2(Math.floor(s / 60)) + ':' + pad2(s % 60);
};

export const reduceMotion = () => Boolean(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

let toastTimer = null;

/** 되돌리기 버튼이 있는 알림: ms 안에 누르면 true(되돌림), 아니면 false */
export function undoToast(message, undoLabel, ms) {
    return new Promise((resolve) => {
        const el = document.createElement('div');
        el.className = 'toast undo-toast';
        el.setAttribute('role', 'status');
        el.innerHTML = '<span>' + esc(message) + '</span> <button type="button" class="btn small">' + esc(undoLabel) + '</button>';
        document.body.appendChild(el);
        const finish = (undone) => {
            clearTimeout(timer);
            el.remove();
            resolve(undone);
        };
        const timer = setTimeout(() => finish(false), ms);
        el.querySelector('button').onclick = () => finish(true);
    });
}

export function toast(message) {
    let el = $('.toast');
    if (!el) {
        el = document.createElement('div');
        el.className = 'toast';
        el.setAttribute('role', 'status');
        document.body.appendChild(el);
    }
    el.textContent = message;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        el.hidden = true;
    }, 2600);
}

export function copyText(text) {
    return navigator.clipboard.writeText(text).then(() => toast(t('common.copied')), () => toast(t('common.copyFailed')));
}

export const ICON = {
    music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>',
};
