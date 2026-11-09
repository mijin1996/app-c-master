// Cloudflare Worker 입구(server/worker.js): /api/** 를 functions/ 의 처리기로 보내고, 나머지는 정적 파일로
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker, { API_ROUTES } from '../../server/worker.js';
import { SqliteD1 } from '../fakes/sqlite-d1.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BASE = 'https://app-c-master.example.workers.dev';

// 가짜 정적 파일 창고: 불린 주소를 기억한다
function fakeEnv() {
    const asked = [];
    return {
        asked,
        env: {
            DB: new SqliteD1(),
            ASSETS: { fetch: async (request) => { asked.push(new URL(request.url).pathname); return new Response('<html>', { status: 200 }); } },
        },
    };
}
const ctx = { waitUntil: () => {}, passThroughOnException: () => {} };
const post = (url, body, headers = {}) => new Request(BASE + url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });

/** functions/api 아래 모든 .js 파일 → "/api/..." 주소 */
function functionPaths(dir = path.join(root, 'functions/api'), prefix = '/api') {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory()
        ? functionPaths(path.join(dir, entry.name), prefix + '/' + entry.name)
        : entry.name.endsWith('.js') ? [prefix + '/' + entry.name.slice(0, -3)] : []));
}

test('functions/api 의 모든 파일이 빠짐없이 Worker 길 안내표에 들어 있다', () => {
    // Given / When
    const files = functionPaths().sort();

    // Then
    assert.deepEqual(Object.keys(API_ROUTES).sort(), files);
});

test('로그인 안 한 /api/auth/me 는 404 가 아니라 401', async () => {
    // Given
    const { env } = fakeEnv();

    // When
    const response = await worker.fetch(new Request(BASE + '/api/auth/me'), env, ctx);

    // Then
    assert.equal(response.status, 401);
});

test('가입 → 로그인 → 쿠키로 내 정보 보기가 Worker 를 거쳐서 된다', async () => {
    // Given
    const { env } = fakeEnv();
    const account = { username: 'worker_kid', nickname: '워커', password: 'abcd' };
    await worker.fetch(post('/api/auth/signup', account), env, ctx);

    // When
    const login = await worker.fetch(post('/api/auth/login', { username: account.username, password: account.password }), env, ctx);
    const cookie = login.headers.get('set-cookie')?.split(';')[0];
    const me = await worker.fetch(new Request(BASE + '/api/auth/me', { headers: { cookie } }), env, ctx);

    // Then
    assert.equal(login.status, 200);
    assert.ok(cookie, '세션 쿠키가 있어야 해요');
    assert.equal(me.status, 200);
    assert.equal((await me.json()).user.username, 'worker_kid');
});

test('비밀번호가 틀리면 WRONG_CREDENTIALS (Worker 도 같은 규칙)', async () => {
    // Given
    const { env } = fakeEnv();
    await worker.fetch(post('/api/auth/signup', { username: 'kim', nickname: 'KIM', password: 'abcd' }), env, ctx);

    // When
    const response = await worker.fetch(post('/api/auth/login', { username: 'kim', password: 'zzzz' }), env, ctx);

    // Then
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error, 'WRONG_CREDENTIALS');
});

test('없는 API 는 404, 있는 API 에 안 맞는 방법(GET 로그인)은 405', async () => {
    // Given
    const { env } = fakeEnv();

    // When
    const missing = await worker.fetch(new Request(BASE + '/api/nope'), env, ctx);
    const wrongMethod = await worker.fetch(new Request(BASE + '/api/auth/login'), env, ctx);

    // Then
    assert.equal(missing.status, 404);
    assert.equal(wrongMethod.status, 405);
    assert.equal(wrongMethod.headers.get('allow'), 'POST');
});

test('/api 가 아닌 주소는 정적 파일 창고(ASSETS)로 보낸다', async () => {
    // Given
    const { env, asked } = fakeEnv();

    // When
    const response = await worker.fetch(new Request(BASE + '/data/oop.json'), env, ctx);

    // Then
    assert.equal(response.status, 200);
    assert.deepEqual(asked, ['/data/oop.json']);
});

test('DB 가 연결 안 됐으면 500 대신 알아보기 쉬운 503 (DB_NOT_BOUND)', async () => {
    // Given
    const { env } = fakeEnv();
    delete env.DB;

    // When
    const response = await worker.fetch(post('/api/auth/login', { username: 'kim', password: 'abcd' }), env, ctx);

    // Then
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error, 'DB_NOT_BOUND');
});
