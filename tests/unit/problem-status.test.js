// 문제 상태: 맞힘 · 도전 중 · 안 냄 (지도 · 문제 목록 · 알고리즘 화면이 같은 규칙을 쓴다)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ProblemStatus, problemStatusOf } from '../../public/js/domain/progress-rules.js';

test('problemStatusOf: 맞힌 기록이 있으면 맞힘 (틀린 적이 있어도)', () => {
    // Given
    const progress = { solved: { 1001: { at: 1 } }, tries: { 1001: 3 } };
    // When / Then
    assert.equal(problemStatusOf(progress, 1001), ProblemStatus.SOLVED);
});

test('problemStatusOf: 낸 적만 있으면 도전 중, 아무것도 없으면 안 냄', () => {
    // Given
    const progress = { solved: {}, tries: { 1002: 1 } };
    // When / Then
    assert.equal(problemStatusOf(progress, 1002), ProblemStatus.TRYING);
    assert.equal(problemStatusOf(progress, 1003), ProblemStatus.NONE);
});

test('problemStatusOf: 낸 횟수 0 은 안 낸 것으로', () => {
    // Given / When / Then
    assert.equal(problemStatusOf({ solved: {}, tries: { 1004: 0 } }, 1004), ProblemStatus.NONE);
});
