// 밀어서 고르는 줄 (Swipe Row 스타일): 끌기 시작, 고무줄 저항, 끝까지 밀기 지점, 놓았을 때 열림/닫힘, 줄마다 버튼(보관함 없음)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SWIPE, shouldStartDrag, resist, commitPoint, settle, rowActions } from '../../public/js/ui/swipe-row-rules.js';

test('shouldStartDrag: 10px 넘게, 가로로 더 많이 움직여야 끌기 시작 (세로 스크롤은 그대로)', () => {
    // Given / When / Then
    assert.equal(shouldStartDrag(-11, 2), true);
    assert.equal(shouldStartDrag(-10, 0), false);
    assert.equal(shouldStartDrag(-12, 30), false);
    assert.equal(shouldStartDrag(0, 0), false);
});

test('resist: 서랍 폭까지는 그대로, 넘으면 고무줄처럼 덜 움직인다, 오른쪽으로는 안 열린다', () => {
    // Given
    const drawer = 160;
    // When / Then
    assert.equal(resist(-100, drawer), -100);
    assert.equal(resist(-drawer, drawer), -drawer);
    assert.equal(resist(-260, drawer), -(drawer + 100 * SWIPE.RESISTANCE));
    assert.equal(resist(40, drawer), 0);
});

test('commitPoint: 줄 폭의 60% 와 (서랍 폭 + 버튼 반) 중 큰 쪽', () => {
    // Given / When / Then
    assert.equal(commitPoint(400, 80), 240);
    assert.equal(commitPoint(200, 160), 160 + SWIPE.ACTION_WIDTH / 2);
});

test('settle: 빠르게 튕기면 방향대로, 아니면 절반을 넘었는지로 열림 · 닫힘 · 실행', () => {
    // Given
    const drawer = 160;
    const commitAt = 240;
    // When / Then
    assert.equal(settle(-30, -200, drawer, commitAt), 'open');      // 왼쪽으로 빠르게
    assert.equal(settle(-150, 200, drawer, commitAt), 'closed');    // 오른쪽으로 빠르게
    assert.equal(settle(-90, 0, drawer, commitAt), 'open');         // 절반(80) 넘음
    assert.equal(settle(-70, 0, drawer, commitAt), 'closed');       // 절반 안 넘음
    assert.equal(settle(-250, 0, drawer, commitAt), 'commit');      // 끝까지 밀었음
});

test('rowActions: 남의 문제는 좋아요 하나, 내 문제는 삭제, 선생님은 숨기기도 — 보관함은 없다', () => {
    // Given / When
    const other = rowActions({ mine: false, canModerate: false, liked: false });
    const likedOther = rowActions({ mine: false, canModerate: false, liked: true });
    const mine = rowActions({ mine: true, canModerate: false, liked: false });
    const teacher = rowActions({ mine: false, canModerate: true, liked: false, hidden: false });
    // Then
    assert.deepEqual(other.map((a) => a.id), ['like']);
    assert.equal(likedOther[0].labelKey, 'comm.unlike');
    assert.deepEqual(mine.map((a) => a.id), ['delete']);
    assert.deepEqual(teacher.map((a) => a.id), ['like', 'hide']);
    assert.ok([...other, ...mine, ...teacher].every((a) => a.id !== 'archive'));
});
