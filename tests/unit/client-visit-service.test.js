// 화면 쪽 접속 수 Service: 탭 하나(이번 방문)에서는 한 번만 센다. 새로고침은 숫자만 본다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Result, Success, Failure } from '../../public/js/core/result.js';
import { AppError } from '../../public/js/core/app-error.js';
import { VisitService } from '../../public/js/services/visit-service.js';

class FakeVisitRepository {
    constructor(fail = false) {
        this.count = 10;
        this.calls = [];
        this.fail = fail;
    }

    async recordAsync() {
        this.calls.push('record');
        if (this.fail) {
            return Result.failure(AppError.NETWORK);
        }
        this.count++;
        return Result.success({ day: '2026-11-10', count: this.count });
    }

    async todayAsync() {
        this.calls.push('today');
        return this.fail ? Result.failure(AppError.NETWORK) : Result.success({ day: '2026-11-10', count: this.count });
    }
}

// 가짜 sessionStorage (탭 하나)
class FakeSessionStore {
    constructor() {
        this.map = new Map();
    }

    getItem(k) {
        return this.map.has(k) ? this.map.get(k) : null;
    }

    setItem(k, v) {
        this.map.set(k, String(v));
    }
}

test('이번 방문 첫 화면에서는 기록(+1)하고, 새로고침하면 보기만 한다', async () => {
    // Given
    const repo = new FakeVisitRepository();
    const store = new FakeSessionStore();

    // When
    const first = await new VisitService(repo, store).loadAsync();
    const reload = await new VisitService(repo, store).loadAsync();

    // Then
    assert.ok(first instanceof Success);
    assert.equal(first.data.count, 11);
    assert.equal(reload.data.count, 11);
    assert.deepEqual(repo.calls, ['record', 'today']);
});

test('새 탭(다른 방문)은 또 한 번 센다', async () => {
    // Given
    const repo = new FakeVisitRepository();

    // When
    await new VisitService(repo, new FakeSessionStore()).loadAsync();
    const other = await new VisitService(repo, new FakeSessionStore()).loadAsync();

    // Then
    assert.equal(other.data.count, 12);
});

test('기록에 실패하면 "센 것" 표시를 남기지 않아 다음에 다시 센다', async () => {
    // Given
    const store = new FakeSessionStore();
    const broken = new FakeVisitRepository(true);

    // When
    const failed = await new VisitService(broken, store).loadAsync();
    const retried = await new VisitService(new FakeVisitRepository(), store).loadAsync();

    // Then
    assert.ok(failed instanceof Failure);
    assert.equal(failed.error, AppError.NETWORK);
    assert.equal(retried.data.count, 11); // 다시 기록됨
});

test('저장소를 못 쓰는 브라우저(사생활 보호 모드)여도 에러 없이 센다', async () => {
    // Given
    const throwing = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };

    // When
    const result = await new VisitService(new FakeVisitRepository(), throwing).loadAsync();

    // Then
    assert.equal(result.data.count, 11);
});
