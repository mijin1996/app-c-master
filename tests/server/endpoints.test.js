// API 엔드포인트 테스트: 실제 Request/Response로 쿠키·상태 코드를 확인한다
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createContainer } from '../../server/container.js';
import { Pbkdf2PasswordHasher } from '../../server/security/password-hasher.js';
import * as api from '../../server/http/endpoints.js';
import { SqliteD1 } from '../fakes/sqlite-d1.js';

function context(container, method, body, cookie) {
    const headers = { 'content-type': 'application/json' };
    if (cookie) {
        headers.cookie = cookie;
    }
    const request = new Request('https://c-master.test/api', { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    return { request, env: {}, container };
}

function newContainer() {
    return createContainer({ DB: new SqliteD1(), TEACHER_USERNAMES: 'teach' }, { hasher: new Pbkdf2PasswordHasher(1000) });
}

const cookieOf = (response) => response.headers.get('set-cookie').split(';')[0];

test('가입 → 쿠키 발급 → 내 정보 → 진도 저장/불러오기 → 로그아웃', async () => {
    const c = newContainer();

    // 가입: 201, HttpOnly 쿠키, 복구 코드
    const signup = await api.signup(context(c, 'POST', { username: 'kim', nickname: '김', password: 'abcd' }));
    assert.equal(signup.status, 201);
    assert.match(signup.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Lax/);
    const body = await signup.json();
    assert.match(body.recoveryCode, /^.{4}-.{4}$/);
    assert.equal('token' in body, false);
    const cookie = cookieOf(signup);

    // 내 정보 (AI 힌트는 꺼져 있다고 알려 줌)
    const me = await (await api.me(context(c, 'GET', undefined, cookie))).json();
    assert.deepEqual(me, { user: { username: 'kim', nickname: '김', isTeacher: false }, features: { aiHint: false, paidLanguages: false } });

    // 진도 저장 후 다시 불러오기
    const put = await api.putProgress(context(c, 'PUT', { solved: { 1001: { at: 1, tries: 1, time: 3, late: false } } }, cookie));
    assert.equal(put.status, 200);
    const got = await (await api.getProgress(context(c, 'GET', undefined, cookie))).json();
    assert.equal(got.summary.xp, 10);

    // 로그아웃 후에는 401
    await api.logout(context(c, 'POST', {}, cookie));
    assert.equal((await api.me(context(c, 'GET', undefined, cookie))).status, 401);
});

test('로그인 없이 진도를 요청하면 401과 한국어 안내', async () => {
    const response = await api.getProgress(context(newContainer(), 'GET'));

    assert.equal(response.status, 401);
    assert.equal((await response.json()).message, '로그인이 필요해요.');
});

test('같은 아이디 가입은 409, 틀린 비밀번호는 401', async () => {
    const c = newContainer();
    await api.signup(context(c, 'POST', { username: 'kim', password: 'abcd' }));

    assert.equal((await api.signup(context(c, 'POST', { username: 'kim', password: 'abcd' }))).status, 409);
    assert.equal((await api.login(context(c, 'POST', { username: 'kim', password: 'zzzz' }))).status, 401);
});

test('학생이 선생님 API를 부르면 403', async () => {
    const c = newContainer();
    const cookie = cookieOf(await api.signup(context(c, 'POST', { username: 'kim', password: 'abcd' })));

    assert.equal((await api.teacherStudents(context(c, 'GET', undefined, cookie))).status, 403);
});

test('AI 힌트 API는 꺼져 있으면 503', async () => {
    const c = newContainer();
    const cookie = cookieOf(await api.signup(context(c, 'POST', { username: 'kim', password: 'abcd' })));

    const response = await api.hint(context(c, 'POST', { title: 'x', code: 'y' }, cookie));

    assert.equal(response.status, 503);
    assert.equal((await response.json()).error, 'FEATURE_DISABLED');
});

test('JSON이 깨진 요청은 400', async () => {
    const c = newContainer();
    const request = new Request('https://c-master.test/api', { method: 'POST', body: '{bad' });

    const response = await api.login({ request, env: {}, container: c });

    assert.equal(response.status, 400);
});
