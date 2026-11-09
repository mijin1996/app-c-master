// 객체지향 레슨 퀴즈의 경험치 규칙을 확인한다
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    oopXpForBest, oopGainedXp, computeOopXp, isOopLessonNo, OOP_PASS_SCORE, OOP_QUIZ_SIZE,
} from '../../public/js/domain/oop-rules.js';

const lessons = [{ no: 1 }, { no: 2 }, { no: 3 }];

test('최고 점수가 0~3이면 0 XP, 4(통과선 딱 맞게)면 10, 5(만점)면 20', () => {
    // Given
    const scores = [undefined, 0, 3, OOP_PASS_SCORE, OOP_QUIZ_SIZE];

    // When
    const xp = scores.map((best) => oopXpForBest(best));

    // Then
    assert.deepEqual(xp, [0, 0, 0, 10, 20]);
});

test('처음 4점 → 10 XP, 그다음 5점 → 10 XP 더, 다시 5점 → 0 XP', () => {
    // Given / When / Then
    assert.equal(oopGainedXp(undefined, 4), 10);
    assert.equal(oopGainedXp(4, 5), 10);
    assert.equal(oopGainedXp(5, 5), 0);
});

test('더 낮은 점수를 받아도 경험치를 빼지 않는다', () => {
    // Given / When
    const gained = oopGainedXp(5, 2);

    // Then
    assert.equal(gained, 0);
});

test('서버 재계산: 있는 레슨만 더하고, 없는 레슨 번호는 무시한다', () => {
    // Given
    const oopQuiz = { 1: 5, 2: 4, 3: 1, 77: 5 };

    // When
    const xp = computeOopXp(oopQuiz, lessons);

    // Then
    assert.equal(xp, 30);
});

test('기록이 비었거나 이상하면 0 XP', () => {
    // Given / When / Then
    assert.equal(computeOopXp({}, lessons), 0);
    assert.equal(computeOopXp(null, lessons), 0);
    assert.equal(computeOopXp(undefined, lessons), 0);
});

test('레슨 번호는 1~99 정수 문자열만 받는다 (0, 100, 글자는 안 됨)', () => {
    // Given / When / Then
    assert.equal(isOopLessonNo('1'), true);
    assert.equal(isOopLessonNo('99'), true);
    assert.equal(isOopLessonNo('0'), false);
    assert.equal(isOopLessonNo('100'), false);
    assert.equal(isOopLessonNo('a'), false);
    assert.equal(isOopLessonNo('01'), false);
});
