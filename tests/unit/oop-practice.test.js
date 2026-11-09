// 객체지향 "코드 실습"(빈칸 채우기 · 결과 맞히기) 규칙 · 진도 · Service 를 확인한다
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Result, Success, Failure } from '../../public/js/core/result.js';
import { AppError } from '../../public/js/core/app-error.js';
import {
    checkPractice, blankCount, practiceKey, isPracticeKey, computePracticeXp, PRACTICE_XP,
} from '../../public/js/domain/oop-practice-rules.js';
import { progressFromDto } from '../../public/js/mappers/progress-mapper.js';
import { computeXp, summarize } from '../../public/js/domain/progress-rules.js';
import { createEmptyProgress } from '../../public/js/domain/progress-model.js';
import { ProgressService } from '../../public/js/services/progress-service.js';
import { CURRICULUM } from '../../public/js/domain/curriculum.js';

const blank = {
    kind: 'blank',
    code: 'public [[1]] void Cry() { }\nclass Dog : Animal { public [[2]] void Cry() { } }',
    blanks: [{ answers: ['virtual'] }, { answers: ['override'] }],
};
const output = { kind: 'output', code: 'Console.WriteLine(1 + 1);', answers: ['2'] };
const lessons = [{ no: 1, practice: 2 }, { no: 2, practice: 1 }];

test('빈칸 개수는 [[숫자]] 표시 개수', () => {
    // Given / When / Then
    assert.equal(blankCount(blank.code), 2);
    assert.equal(blankCount('빈칸 없음'), 0);
});

test('빈칸: 모두 맞으면 정답, 칸마다 맞았는지도 알려 준다', () => {
    // Given / When
    const right = checkPractice(blank, ['virtual', 'override']);
    const half = checkPractice(blank, ['virtual', 'new']);

    // Then
    assert.deepEqual(right, { correct: true, marks: [true, true] });
    assert.deepEqual(half, { correct: false, marks: [true, false] });
});

test('빈칸: 앞뒤 공백은 봐주지만, 대소문자는 구분한다 (C# 은 Virtual ≠ virtual)', () => {
    // Given / When / Then
    assert.equal(checkPractice(blank, ['  virtual ', 'override']).correct, true);
    assert.equal(checkPractice(blank, ['Virtual', 'override']).correct, false);
});

test('빈칸: 입력이 모자라거나 null 이면 틀림 (에러 없이)', () => {
    // Given / When / Then
    assert.equal(checkPractice(blank, ['virtual']).correct, false);
    assert.equal(checkPractice(blank, null).correct, false);
});

test('결과 맞히기: 줄 끝 공백 · 윈도우 줄바꿈 · 마지막 빈 줄은 봐준다', () => {
    // Given
    const twoLines = { kind: 'output', code: '', answers: ['Parent\n멍멍'] };

    // When / Then
    assert.equal(checkPractice(output, ['2']).correct, true);
    assert.equal(checkPractice(output, [' 2 \n\n']).correct, true);
    assert.equal(checkPractice(twoLines, ['Parent  \r\n멍멍\r\n']).correct, true);
    assert.equal(checkPractice(twoLines, ['멍멍\nParent']).correct, false);
    assert.equal(checkPractice(output, ['']).correct, false);
});

test('정답 후보가 여러 개면 그중 하나만 맞아도 된다', () => {
    // Given
    const multi = { kind: 'output', code: '', answers: ['True', 'true'] };

    // When / Then
    assert.equal(checkPractice(multi, ['true']).correct, true);
});

test('실습 번호: "레슨-순서" 모양만 받는다', () => {
    // Given / When / Then
    assert.equal(practiceKey(3, 0), '3-1');
    assert.equal(isPracticeKey('13-2'), true);
    assert.equal(isPracticeKey('0-1'), false);
    assert.equal(isPracticeKey('3-0'), false);
    assert.equal(isPracticeKey('3'), false);
});

test('실습 경험치: 있는 레슨 · 있는 순서만 문제당 5 XP', () => {
    // Given
    const solved = { '1-1': 1, '1-2': 1, '1-3': 1, '2-1': 1, '9-1': 1 };

    // When
    const xp = computePracticeXp(solved, lessons);

    // Then
    assert.equal(xp, 3 * PRACTICE_XP);
    assert.equal(computePracticeXp(null, lessons), 0);
});

test('mapper: oopPractice 는 올바른 번호와 1(풀었음)만 남긴다', () => {
    // Given
    const dto = { oopPractice: { '1-1': 1, '1-2': true, '2-1': 0, 'x-1': 1, '1-0': 1 } };

    // When
    const progress = progressFromDto(dto);

    // Then
    assert.deepEqual(progress.oopPractice, { '1-1': 1, '1-2': 1 });
    assert.deepEqual(progressFromDto({}).oopPractice, {});
});

test('전체 경험치에 실습이 더해지고, 요약에 푼 실습 개수가 나온다', () => {
    // Given
    const progress = createEmptyProgress();
    progress.oopPractice = { '1-1': 1, '2-1': 1 };

    // When / Then
    assert.equal(computeXp(progress, [], lessons), 10);
    assert.equal(summarize(progress, [], lessons).oopPracticeSolved, 2);
});

// ---------- 화면 Service ----------
class FakeProgressRepository {
    constructor(initial = {}) {
        this.initial = initial;
    }

    async loadAsync() {
        return Result.success({ progress: structuredClone(this.initial) });
    }

    async saveAsync() {
        return Result.success({ summary: {} });
    }
}

async function createService(initial = {}) {
    const calendar = { today: () => '2026-11-10', yesterday: () => '2026-11-09', now: () => 1 };
    const service = new ProgressService(new FakeProgressRepository(initial), CURRICULUM, calendar, { setTimeout: () => 0, clearTimeout: () => {} }, lessons);
    await service.loadAsync();
    return service;
}

test('Service: 처음 맞히면 +5 XP 와 풀었음 기록, 또 맞혀도 0 XP', async () => {
    // Given
    const service = await createService();

    // When
    const first = service.recordOopPractice(1, 1, true);
    const again = service.recordOopPractice(1, 1, true);

    // Then
    assert.ok(first instanceof Success);
    assert.equal(first.data.gainedXp, 5);
    assert.equal(again.data.gainedXp, 0);
    assert.deepEqual(service.progress.oopPractice, { '1-2': 1 });
    assert.equal(service.isPracticeSolved(1, 1), true);
});

test('Service: 틀리면 기록 · 경험치 없음', async () => {
    // Given
    const service = await createService();

    // When
    const result = service.recordOopPractice(2, 0, false);

    // Then
    assert.equal(result.data.gainedXp, 0);
    assert.deepEqual(service.progress.oopPractice, {});
});

test('Service: 없는 레슨 · 범위 밖 순서(개수 딱 = 2 는 밖) 는 INVALID_PROGRESS', async () => {
    // Given
    const service = await createService();

    // When
    const results = [service.recordOopPractice(9, 0, true), service.recordOopPractice(1, 2, true), service.recordOopPractice(1, -1, true)];

    // Then
    for (const r of results) {
        assert.ok(r instanceof Failure);
        assert.equal(r.error, AppError.INVALID_PROGRESS);
    }
});
