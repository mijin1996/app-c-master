// 언어 규칙과 번역 함수: 언어 고르기, {자리} 채우기, 없는 키는 한국어로
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LOCALES, normalizeLocale, pickLocale, interpolate } from '../../public/js/i18n/locale-rules.js';
import { createTranslator } from '../../public/js/i18n/i18n.js';

test('지원 언어는 한국어 · 영어 · 중국어 세 개', () => {
    // Given / When / Then
    assert.deepEqual(LOCALES, ['ko', 'en', 'zh']);
});

test('언어 이름 정리: en-US → en, zh-TW → zh, 모르는 말 · 빈 값 → null', () => {
    // Given / When / Then
    assert.equal(normalizeLocale('en-US'), 'en');
    assert.equal(normalizeLocale('ZH-tw'), 'zh');
    assert.equal(normalizeLocale('ko'), 'ko');
    assert.equal(normalizeLocale('fr'), null);
    assert.equal(normalizeLocale(''), null);
    assert.equal(normalizeLocale(undefined), null);
});

test('처음 고르기: 저장한 언어가 먼저, 없으면 브라우저 언어 목록에서 아는 것, 그것도 없으면 한국어', () => {
    // Given / When / Then
    assert.equal(pickLocale('zh', ['en-US']), 'zh');
    assert.equal(pickLocale(null, ['fr-FR', 'en-GB']), 'en');
    assert.equal(pickLocale(null, ['zh-CN']), 'zh');
    assert.equal(pickLocale('xx', ['de']), 'ko');
    assert.equal(pickLocale(null, null), 'ko');
});

test('{자리} 채우기: 있는 값만 바꾸고, 없는 자리는 그대로 둔다', () => {
    // Given / When / Then
    assert.equal(interpolate('{n}문제 · {xp} XP', { n: 3, xp: 40 }), '3문제 · 40 XP');
    assert.equal(interpolate('남은 {left}', {}), '남은 {left}');
    assert.equal(interpolate('그대로', undefined), '그대로');
});

test('번역: 지금 언어 사전에서 찾고, 없으면 한국어, 그것도 없으면 키를 그대로 보여 준다', () => {
    // Given
    const t = createTranslator({ ko: { hi: '안녕', only: '한국어만' }, en: { hi: 'Hello {name}' }, zh: {} });

    // When / Then
    t.setLocale('en');
    assert.equal(t.t('hi', { name: 'Cody' }), 'Hello Cody');
    assert.equal(t.t('only'), '한국어만');
    assert.equal(t.t('missing.key'), 'missing.key');
});

test('언어를 바꾸면 구독자에게 알리고, 모르는 언어로는 바뀌지 않는다', () => {
    // Given
    const t = createTranslator({ ko: {}, en: {}, zh: {} });
    const heard = [];
    const off = t.onLocaleChange((locale) => heard.push(locale));

    // When
    t.setLocale('zh');
    t.setLocale('zh');   // 같은 언어면 알리지 않음
    t.setLocale('fr');   // 모르는 언어는 무시
    off();
    t.setLocale('en');   // 구독을 끊은 뒤

    // Then
    assert.deepEqual(heard, ['zh']);
    assert.equal(t.getLocale(), 'en');
});
