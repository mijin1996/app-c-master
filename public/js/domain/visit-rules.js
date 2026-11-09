// 하루 접속 수 규칙 (서버 · 화면이 같이 쓰는 순수 함수)
const KST_OFFSET_MS = 9 * 60 * 60 * 1000; // 한국 시간 = UTC + 9시간
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** 한국 시간 기준 날짜 "YYYY-MM-DD" (자정에 새 날) */
export function kstDayKey(ms) {
    return new Date(ms + KST_OFFSET_MS).toISOString().slice(0, 10);
}

export function isDayKey(value) {
    return typeof value === 'string' && DAY_KEY.test(value);
}

/** 화면에 보이는 글 하나. 설명은 붙이지 않는다 */
export function visitLabel(count) {
    const n = Number(count);
    const safe = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
    return '하루동안 누적 접속 수: ' + safe.toLocaleString('en-US');
}
