// "앱처럼 쓰기" 안내 카드 글은 핵심만: 세 언어 모두 카드마다 3줄 이하, 한 줄 길이 제한 안
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CARD_STEPS, MAX_STEPS, MAX_STEP_CHARS, cardOf } from '../../public/js/ui/install-guide-cards.js';
import { MESSAGES_KO } from '../../public/js/i18n/messages-ko.js';
import { MESSAGES_EN } from '../../public/js/i18n/messages-en.js';
import { MESSAGES_ZH } from '../../public/js/i18n/messages-zh.js';

const plain = (html) => html.replace(/<[^>]+>/g, '');
const DICTS = { ko: MESSAGES_KO, en: MESSAGES_EN, zh: MESSAGES_ZH };

test('카드는 아이폰 · 안드로이드 · 컴퓨터 세 장 (좋은 점 카드는 없음)', () => {
    // Given / When / Then
    assert.deepEqual(Object.keys(CARD_STEPS).sort(), ['android', 'desktop', 'ios']);
});

test('카드마다 1~3줄', () => {
    // Given / When / Then
    for (const [id, n] of Object.entries(CARD_STEPS)) {
        assert.ok(n >= 1 && n <= MAX_STEPS, id + ': ' + n + '줄');
    }
});

for (const [locale, dict] of Object.entries(DICTS)) {
    test(locale + ': 한 줄은 태그를 빼고 제한 글자 수 이하 (길게 설명하지 않기), 제목 · 줄이 비지 않음', () => {
        // Given
        const translate = (key) => dict[key] ?? '';

        // When / Then
        for (const id of Object.keys(CARD_STEPS)) {
            const card = cardOf(id, translate);
            assert.ok(card.title.trim().length > 0, id + ' 제목');
            for (const step of card.steps) {
                assert.ok(plain(step).trim().length > 0, id + ' 빈 줄');
                assert.ok(plain(step).length <= MAX_STEP_CHARS[locale], locale + ' ' + id + ': "' + plain(step) + '" ' + plain(step).length + '자');
            }
        }
    });
}
