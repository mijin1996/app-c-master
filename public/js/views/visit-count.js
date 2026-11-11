// "하루동안 누적 접속 수: N" 한 줄. 숫자를 아직 모르면 비워 둔다 (설명 글은 붙이지 않음)
import { t } from '../i18n/index.js';

export const VISIT_SLOT = '<span class="visit-count" data-visits aria-live="polite"></span>';

const safeCount = (count) => {
    const n = Number(count);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};

/** 화면에 있는 자리에 지금 숫자를 채운다 (지금 언어로) */
export function paintVisits(count, root = document) {
    root.querySelectorAll('[data-visits]').forEach((el) => {
        el.textContent = count === null || count === undefined ? '' : t('visits.label', { n: safeCount(count).toLocaleString('en-US') });
    });
}

/** 화면을 그린 직전 · 직후에 부른다: 알던 숫자를 바로 쓰고, 처음이면 불러온 뒤 채운다 */
export function bindVisits(visits, root = document) {
    paintVisits(visits.current, root);
    if (visits.current === null) {
        visits.loadAsync().then(() => paintVisits(visits.current));
    }
}
