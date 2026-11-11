// 고르기 창(모든 토글 목록): 제목 고르기, 키보드로 카드 사이 움직이기, 카드가 붙는 높이
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickerTitle, nextIndex, stickyTopOf, PICKER_STICKY } from '../../public/js/ui/picker-rules.js';

test('pickerTitle: 라벨 글자 → aria-label → 기본 글자 순서로 고른다', () => {
    // Given / When / Then
    assert.equal(pickerTitle({ label: ' 배경 ', ariaLabel: 'bg', fallback: '고르기' }), '배경');
    assert.equal(pickerTitle({ label: '', ariaLabel: '언어', fallback: '고르기' }), '언어');
    assert.equal(pickerTitle({ fallback: '고르기' }), '고르기');
});

test('nextIndex: 위 · 아래 화살표는 한 칸씩, 끝에서는 멈춘다', () => {
    // Given / When / Then
    assert.equal(nextIndex(0, 3, 'ArrowDown'), 1);
    assert.equal(nextIndex(2, 3, 'ArrowDown'), 2);
    assert.equal(nextIndex(0, 3, 'ArrowUp'), 0);
    assert.equal(nextIndex(1, 3, 'ArrowUp'), 0);
});

test('nextIndex: Home 은 처음, End 는 마지막, 다른 키는 그대로, 카드가 없으면 -1', () => {
    // Given / When / Then
    assert.equal(nextIndex(2, 5, 'Home'), 0);
    assert.equal(nextIndex(0, 5, 'End'), 4);
    assert.equal(nextIndex(3, 5, 'a'), 3);
    assert.equal(nextIndex(0, 0, 'ArrowDown'), -1);
});

test('stickyTopOf: 앞 카드 윗부분이 보이도록 뒤 카드는 조금씩 아래에 붙는다 (많아도 너무 내려가지 않게)', () => {
    // Given / When / Then
    assert.equal(stickyTopOf(0), PICKER_STICKY.TOP_PX);
    assert.equal(stickyTopOf(1), PICKER_STICKY.TOP_PX + PICKER_STICKY.STEP_PX);
    assert.equal(stickyTopOf(100), PICKER_STICKY.TOP_PX + PICKER_STICKY.STEP_PX * PICKER_STICKY.MAX_STEPS);
});
