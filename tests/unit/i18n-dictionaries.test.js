// 화면 글자 사전 세 개가 서로 맞는지: 키, {자리}, HTML 태그, 한글 남김 여부
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MESSAGES_KO } from '../../public/js/i18n/messages-ko.js';
import { MESSAGES_EN } from '../../public/js/i18n/messages-en.js';
import { MESSAGES_ZH } from '../../public/js/i18n/messages-zh.js';

const HANGUL = /[가-힣]/;
const slots = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const tags = (text) => [...String(text).matchAll(/<\/?([a-z]+)[^>]*>/g)].map((m) => m[0].startsWith('</') ? '/' + m[1] : m[1]).sort();
const others = { en: MESSAGES_EN, zh: MESSAGES_ZH };

for (const [name, dict] of Object.entries(others)) {
    test(name + ' 사전: 한국어 사전의 키를 하나도 빠뜨리지 않고, 없는 키도 없다', () => {
        // Given / When
        const missing = Object.keys(MESSAGES_KO).filter((k) => !(k in dict));
        const extra = Object.keys(dict).filter((k) => !(k in MESSAGES_KO));

        // Then
        assert.deepEqual(missing, []);
        assert.deepEqual(extra, []);
    });

    test(name + ' 사전: {자리} 이름이 한국어와 같다 (값이 빠지거나 엉뚱하게 채워지지 않게)', () => {
        // Given / When
        const wrong = Object.keys(MESSAGES_KO).filter((k) => JSON.stringify(slots(MESSAGES_KO[k])) !== JSON.stringify(slots(dict[k])));

        // Then
        assert.deepEqual(wrong, []);
    });

    test(name + ' 사전: HTML 태그(<b>, <span> …)가 한국어와 같다 (화면 모양이 깨지지 않게)', () => {
        // Given / When
        const wrong = Object.keys(MESSAGES_KO).filter((k) => JSON.stringify(tags(MESSAGES_KO[k])) !== JSON.stringify(tags(dict[k])));

        // Then
        assert.deepEqual(wrong, []);
    });

    test(name + ' 사전: 한글이 남아 있지 않고, 빈 문장도 없다', () => {
        // Given / When
        const hangul = Object.entries(dict).filter(([, v]) => HANGUL.test(v)).map(([k]) => k);
        const empty = Object.entries(dict).filter(([, v]) => String(v).trim() === '').map(([k]) => k);

        // Then
        assert.deepEqual(hangul, []);
        assert.deepEqual(empty, []);
    });
}
