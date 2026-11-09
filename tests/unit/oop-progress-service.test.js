// 화면 쪽 ProgressService.recordOopQuiz 테스트 (가짜 Repository · 고정 시계)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Result, Success, Failure } from '../../public/js/core/result.js';
import { AppError } from '../../public/js/core/app-error.js';
import { ProgressService } from '../../public/js/services/progress-service.js';
import { CURRICULUM } from '../../public/js/domain/curriculum.js';

class FakeProgressRepository {
    constructor(initial = {}) {
        this.initial = initial;
        this.saved = [];
    }

    async loadAsync() {
        return Result.success({ progress: structuredClone(this.initial) });
    }

    async saveAsync(progress) {
        this.saved.push(structuredClone(progress));
        return Result.success({ summary: {} });
    }
}

const noTimer = { setTimeout: () => 0, clearTimeout: () => {} };
const calendar = { today: () => '2026-11-10', yesterday: () => '2026-11-09', now: () => 1 };
const oopLessons = [{ no: 1 }, { no: 2 }, { no: 3 }];

async function createService(initial = {}) {
    const repo = new FakeProgressRepository(initial);
    const service = new ProgressService(repo, CURRICULUM, calendar, noTimer, oopLessons);
    await service.loadAsync();
    return { service, repo };
}

test('처음 4점이면 +10 XP, 최고 점수 4가 남고 오늘 공부한 날로 센다', async () => {
    // Given
    const { service } = await createService();

    // When
    const result = service.recordOopQuiz(3, 4);

    // Then
    assert.ok(result instanceof Success);
    assert.equal(result.data.gainedXp, 10);
    assert.equal(result.data.best, 4);
    assert.equal(service.progress.oopQuiz[3], 4);
    assert.equal(service.progress.streak.last, '2026-11-10');
    assert.equal(service.summary.xp, 10);
});

test('최고 4점 → 5점이면 +10 XP 더, 다시 5점이면 0 XP', async () => {
    // Given
    const { service } = await createService({ oopQuiz: { 3: 4 } });

    // When
    const first = service.recordOopQuiz(3, 5);
    const again = service.recordOopQuiz(3, 5);

    // Then
    assert.equal(first.data.gainedXp, 10);
    assert.equal(again.data.gainedXp, 0);
    assert.equal(service.summary.xp, 20);
});

test('더 낮은 점수는 최고 점수를 지우지 않는다 (0점 경계)', async () => {
    // Given
    const { service } = await createService({ oopQuiz: { 1: 5 } });

    // When
    const result = service.recordOopQuiz(1, 0);

    // Then
    assert.equal(result.data.best, 5);
    assert.equal(service.progress.oopQuiz[1], 5);
});

test('없는 레슨이나 0~5가 아닌 점수는 INVALID_PROGRESS 로 거절하고 저장하지 않는다', async () => {
    // Given
    const { service } = await createService();

    // When
    const results = [service.recordOopQuiz(99, 3), service.recordOopQuiz(1, 6), service.recordOopQuiz(1, -1), service.recordOopQuiz(1, 2.5)];

    // Then
    for (const r of results) {
        assert.ok(r instanceof Failure);
        assert.equal(r.error, AppError.INVALID_PROGRESS);
    }
    assert.deepEqual(service.progress.oopQuiz, {});
});

test('경험치가 100을 넘기면 레벨 업 이벤트를 알려 준다', async () => {
    // Given: 이미 90 XP (단원 문제 1001·1003·1004 = 10+20+20, 레슨 1·2 만점 = 40)
    const { service } = await createService({ oopQuiz: { 1: 5, 2: 5 }, solved: { 1003: { at: 1, tries: 1, time: 1 }, 1004: { at: 1, tries: 1, time: 1 }, 1001: { at: 1, tries: 1, time: 1 } } });
    assert.equal(service.summary.xp, 90);

    // When
    const result = service.recordOopQuiz(3, 4);

    // Then
    assert.equal(result.data.events.levelUp, 2);
});
