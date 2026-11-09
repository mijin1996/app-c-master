// 하루 접속 수: 서버 Service(가짜 D1 · 고정 시계)와 Worker 를 거친 API
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Success, Failure } from '../../public/js/core/result.js';
import { AppError } from '../../public/js/core/app-error.js';
import { createContainer } from '../../server/container.js';
import worker from '../../server/worker.js';
import { SqliteD1, BrokenD1 } from '../fakes/sqlite-d1.js';
import { D1VisitDataSource } from '../../server/datasources/d1-visit-datasource.js';

const NOV_10_NOON_KST = Date.UTC(2026, 10, 10, 3, 0, 0);
const NOV_11_0001_KST = Date.UTC(2026, 10, 10, 15, 1, 0);

function setup(db = new SqliteD1()) {
    let now = NOV_10_NOON_KST;
    const c = createContainer({ DB: db }, { clock: () => now });
    return { c, db, setNow: (t) => { now = t; } };
}

test('처음 접속 1, 두 번째 2, 오늘 숫자 보기는 늘리지 않는다', async () => {
    // Given
    const { c } = setup();

    // When
    const first = await c.visits.recordAsync();
    const second = await c.visits.recordAsync();
    const peek = await c.visits.todayAsync();

    // Then
    assert.ok(first instanceof Success);
    assert.deepEqual(first.data, { day: '2026-11-10', count: 1 });
    assert.equal(second.data.count, 2);
    assert.deepEqual(peek.data, { day: '2026-11-10', count: 2 });
});

test('한국 시간으로 다음 날(자정 1분 뒤)이 되면 0 부터 다시 센다', async () => {
    // Given
    const { c, setNow } = setup();
    await c.visits.recordAsync();
    await c.visits.recordAsync();

    // When
    setNow(NOV_11_0001_KST);
    const peek = await c.visits.todayAsync();
    const first = await c.visits.recordAsync();

    // Then
    assert.deepEqual(peek.data, { day: '2026-11-11', count: 0 });
    assert.equal(first.data.count, 1);
});

test('아무도 안 온 날 보기는 0', async () => {
    // Given / When
    const peek = await setup().c.visits.todayAsync();

    // Then
    assert.equal(peek.data.count, 0);
});

test('표가 아직 없는 실제 D1 이어도 처음 쓸 때 스스로 만든다 (마이그레이션을 깜빡해도 동작)', async () => {
    // Given: daily_visits 표를 지운 DB
    const db = new SqliteD1();
    await db.prepare('DROP TABLE daily_visits').run();
    const source = new D1VisitDataSource(db);

    // When
    const count = await source.incrementAsync('2026-11-10');

    // Then
    assert.equal(count, 1);
});

test('DB 가 고장 나면 SERVER 실패 (예외가 새지 않는다)', async () => {
    // Given
    const { c } = setup(new BrokenD1());

    // When
    const recorded = await c.visits.recordAsync();
    const peek = await c.visits.todayAsync();

    // Then
    assert.ok(recorded instanceof Failure);
    assert.equal(recorded.error, AppError.SERVER);
    assert.equal(peek.error, AppError.SERVER);
});

test('Worker: POST /api/visits 는 1 늘리고, GET 은 보기만 (로그인 없이도 됨)', async () => {
    // Given
    const env = { DB: new SqliteD1(), ASSETS: { fetch: async () => new Response('') } };
    const base = 'https://c.example.workers.dev/api/visits';

    // When
    const posted = await worker.fetch(new Request(base, { method: 'POST' }), env, {});
    const got = await worker.fetch(new Request(base), env, {});

    // Then
    assert.equal(posted.status, 200);
    assert.equal((await posted.json()).count, 1);
    assert.equal(got.status, 200);
    assert.equal((await got.json()).count, 1);
});
