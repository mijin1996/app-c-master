// 좋아요 하트 (Peek Rating 스타일): 말풍선 글자 고르기, 누른 뒤 숫자
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { likeTipKey, likedCount } from '../../public/js/ui/like-heart-rules.js';

test('likeTipKey: 내 글이면 못 누른다는 말, 누른 상태면 취소, 아니면 좋아요', () => {
    // Given / When / Then
    assert.equal(likeTipKey({ liked: false, disabled: true }), 'comm.cantLikeOwn');
    assert.equal(likeTipKey({ liked: true, disabled: false }), 'comm.unlike');
    assert.equal(likeTipKey({ liked: false, disabled: false }), 'comm.like');
});

test('likedCount: 서버가 준 숫자를 쓰고, 이상한 값이면 0 (음수도 0)', () => {
    // Given / When / Then
    assert.equal(likedCount(5), 5);
    assert.equal(likedCount(0), 0);
    assert.equal(likedCount(-3), 0);
    assert.equal(likedCount('7'), 7);
    assert.equal(likedCount(undefined), 0);
});
