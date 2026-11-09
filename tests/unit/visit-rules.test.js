// 하루 접속 수 규칙: 한국 시간으로 날짜 나누기, 화면에 보이는 글
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kstDayKey, visitLabel, isDayKey } from '../../public/js/domain/visit-rules.js';

test('한국 시간 자정이 날짜 경계: 2026-11-10 14:59:59 UTC 는 10일, 15:00 UTC 는 11일', () => {
    // Given
    const before = Date.UTC(2026, 10, 10, 14, 59, 59);
    const at = Date.UTC(2026, 10, 10, 15, 0, 0);

    // When / Then
    assert.equal(kstDayKey(before), '2026-11-10');
    assert.equal(kstDayKey(at), '2026-11-11');
});

test('날짜 글자는 YYYY-MM-DD 모양만', () => {
    // Given / When / Then
    assert.equal(isDayKey('2026-11-10'), true);
    assert.equal(isDayKey('2026-1-10'), false);
    assert.equal(isDayKey(''), false);
    assert.equal(isDayKey(null), false);
});

test('보이는 글은 "하루동안 누적 접속 수: N" 하나 (천 단위 쉼표)', () => {
    // Given / When / Then
    assert.equal(visitLabel(0), '하루동안 누적 접속 수: 0');
    assert.equal(visitLabel(1234), '하루동안 누적 접속 수: 1,234');
});

test('이상한 숫자는 0 으로 (음수 · 글자 · 소수)', () => {
    // Given / When / Then
    assert.equal(visitLabel(-5), '하루동안 누적 접속 수: 0');
    assert.equal(visitLabel('x'), '하루동안 누적 접속 수: 0');
    assert.equal(visitLabel(3.7), '하루동안 누적 접속 수: 3');
});
