// 객체지향 퀴즈 점수가 진도에 안전하게 저장되고 경험치에 더해지는지 확인한다
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { progressFromDto } from '../../public/js/mappers/progress-mapper.js';
import { createEmptyProgress } from '../../public/js/domain/progress-model.js';
import { computeXp, summarize } from '../../public/js/domain/progress-rules.js';

const curriculum = [{ chapter: 1, stage: 0, title: '출력', problems: [{ id: 1001, level: 1 }] }];
const oopLessons = [{ no: 1 }, { no: 2 }];

test('빈 진도에는 객체지향 점수 칸(oopQuiz)이 비어 있다', () => {
    // Given / When
    const progress = createEmptyProgress();

    // Then
    assert.deepEqual(progress.oopQuiz, {});
});

test('mapper는 레슨 번호 1~99와 점수 0~5만 남기고, 범위를 넘으면 맞춘다', () => {
    // Given
    const dto = { oopQuiz: { 1: 5, 2: 9, 3: -2, 4: 3.7, 0: 5, 100: 5, abc: 5, 5: 'x' } };

    // When
    const progress = progressFromDto(dto);

    // Then
    assert.deepEqual(progress.oopQuiz, { 1: 5, 2: 5, 3: 0, 4: 3 });
});

test('mapper: oopQuiz 가 없거나 배열 · null 이면 빈 칸', () => {
    // Given / When / Then
    assert.deepEqual(progressFromDto({}).oopQuiz, {});
    assert.deepEqual(progressFromDto({ oopQuiz: [5, 5] }).oopQuiz, {});
    assert.deepEqual(progressFromDto({ oopQuiz: null }).oopQuiz, {});
});

test('전체 경험치 = 단원 문제 + 객체지향 퀴즈 (있는 레슨만)', () => {
    // Given
    const progress = createEmptyProgress();
    progress.solved['1001'] = { at: 1, tries: 1, time: 5, late: false };
    progress.oopQuiz = { 1: 5, 2: 4, 50: 5 };

    // When
    const xp = computeXp(progress, curriculum, oopLessons);

    // Then
    assert.equal(xp, 10 + 20 + 10);
});

test('객체지향 퀴즈는 단원 클리어 · 코디 진화에 영향을 주지 않는다', () => {
    // Given
    const progress = createEmptyProgress();
    progress.oopQuiz = { 1: 5, 2: 5 };

    // When
    const summary = summarize(progress, curriculum, oopLessons);

    // Then
    assert.equal(summary.xp, 40);
    assert.equal(summary.clearedCount, 0);
    assert.equal(summary.form, 0);
    assert.equal(summary.oopPassedCount, 2);
});
