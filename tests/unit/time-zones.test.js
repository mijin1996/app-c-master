// 시계와 나라(시간대): 24시간제 표시, 자동(이 기기) 시간대 찾기, 설정 값 정리
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AUTO_ZONE, TIME_ZONES, isTimeZoneKey, resolveZone, formatClock, isDaytimeHour } from '../../public/js/domain/time-zones.js';
import { DEFAULT_SETTINGS } from '../../public/js/domain/progress-model.js';
import { progressFromDto } from '../../public/js/mappers/progress-mapper.js';

// 2026-11-12 15:05 UTC (한국 00:05 다음 날, 뉴욕 10:05)
const FIXED = new Date(Date.UTC(2026, 10, 12, 15, 5, 0));

test('formatClock: 그 나라 시간을 24시간제 HH:MM 으로', () => {
    // Given / When / Then
    assert.equal(formatClock(FIXED, 'Asia/Seoul'), '00:05');
    assert.equal(formatClock(FIXED, 'America/New_York'), '10:05');
    assert.equal(formatClock(FIXED, 'Europe/London'), '15:05');
});

test('formatClock: 모르는 시간대 이름이면 이 기기 시간으로 (멈추지 않음)', () => {
    // Given / When
    const text = formatClock(FIXED, 'Mars/Olympus');
    // Then
    assert.match(text, /^\d{2}:\d{2}$/);
});

test('resolveZone: 자동이면 기기 시간대를 목록에서 찾아 위치까지 준다', () => {
    // Given / When
    const seoul = resolveZone(AUTO_ZONE, 'Asia/Seoul');
    const unknown = resolveZone(AUTO_ZONE, 'Antarctica/Troll');
    // Then
    assert.equal(seoul.zone, 'Asia/Seoul');
    assert.equal(typeof seoul.lat, 'number');
    assert.equal(unknown.zone, 'Antarctica/Troll');
    assert.equal(unknown.lat, null);
});

test('resolveZone: 고른 나라 키는 그 나라 시간대, 모르는 키는 자동처럼', () => {
    // Given / When / Then
    assert.equal(resolveZone('us-east', 'Asia/Seoul').zone, 'America/New_York');
    assert.equal(resolveZone('zz', 'Europe/Paris').zone, 'Europe/Paris');
});

test('isTimeZoneKey: 자동과 목록의 키만 참', () => {
    // Given / When / Then
    assert.equal(isTimeZoneKey(AUTO_ZONE), true);
    assert.equal(isTimeZoneKey('kr'), true);
    assert.equal(isTimeZoneKey('seoul'), false);
    assert.equal(isTimeZoneKey(null), false);
    assert.ok(Object.keys(TIME_ZONES).length >= 20);
});

test('isDaytimeHour: 6시~17시는 낮, 경계 5시 · 18시는 밤', () => {
    // Given / When / Then
    assert.equal(isDaytimeHour(6), true);
    assert.equal(isDaytimeHour(17), true);
    assert.equal(isDaytimeHour(5), false);
    assert.equal(isDaytimeHour(18), false);
});

test('설정: 기본 시간대는 자동, 옛 도시 값은 버리고, 이상한 값은 자동으로', () => {
    // Given / When / Then
    assert.equal(DEFAULT_SETTINGS.timeZone, AUTO_ZONE);
    assert.equal(progressFromDto({ settings: { timeZone: 'jp' } }).settings.timeZone, 'jp');
    assert.equal(progressFromDto({ settings: { timeZone: 'nowhere' } }).settings.timeZone, AUTO_ZONE);
    assert.equal(progressFromDto({ settings: { city: 'busan' } }).settings.city, undefined);
});
