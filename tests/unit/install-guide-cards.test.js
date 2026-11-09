// "앱처럼 쓰기" 안내 카드 글은 핵심만: 카드마다 3줄 이하, 한 줄 30자 이하
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INSTALL_CARDS, MAX_STEPS, MAX_STEP_CHARS } from '../../public/js/ui/install-guide-cards.js';

const plain = (html) => html.replace(/<[^>]+>/g, '');

test('카드는 아이폰 · 안드로이드 · 컴퓨터 · 좋은 점 네 장', () => {
    // Given / When / Then
    assert.deepEqual(Object.keys(INSTALL_CARDS).sort(), ['android', 'desktop', 'ios', 'why']);
});

test('카드마다 1~3줄', () => {
    // Given / When / Then
    for (const [id, card] of Object.entries(INSTALL_CARDS)) {
        assert.ok(card.steps.length >= 1 && card.steps.length <= MAX_STEPS, id + ': ' + card.steps.length + '줄');
    }
});

test('한 줄은 태그를 빼고 30자 이하 (길게 설명하지 않기)', () => {
    // Given / When / Then
    assert.equal(MAX_STEP_CHARS, 30);
    for (const [id, card] of Object.entries(INSTALL_CARDS)) {
        for (const step of card.steps) {
            assert.ok(plain(step).length <= MAX_STEP_CHARS, id + ': "' + plain(step) + '" ' + plain(step).length + '자');
        }
    }
});

test('카드 제목이 비어 있지 않고, 부제는 쓰지 않는다', () => {
    // Given / When / Then
    for (const card of Object.values(INSTALL_CARDS)) {
        assert.ok(card.title.trim().length > 0);
        assert.equal(card.sub, undefined);
    }
});
