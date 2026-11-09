// 진도 저장, 랭킹, 선생님 화면, AI 힌트 테스트
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Success } from '../../public/js/core/result.js';
import { AppError } from '../../public/js/core/app-error.js';
import { createContainer } from '../../server/container.js';
import { Pbkdf2PasswordHasher } from '../../server/security/password-hasher.js';
import { MAX_PROGRESS_BYTES } from '../../server/services/progress-service.js';
import { SqliteD1 } from '../fakes/sqlite-d1.js';

const FAST_HASHER = new Pbkdf2PasswordHasher(1000);

async function setupWithUsers(env = {}, options = {}) {
    const c = createContainer({ DB: new SqliteD1(), ...env }, { hasher: FAST_HASHER, ...options });
    const users = {};
    for (const name of ['kim', 'lee', 'park']) {
        const s = await c.auth.signupAsync({ username: name, nickname: name.toUpperCase(), password: 'abcd' });
        users[name] = (await c.auth.currentUserAsync(s.data.token)).data;
    }
    return { c, users };
}

test('처음 불러오면 빈 진도', async () => {
    const { c, users } = await setupWithUsers();

    const loaded = await c.progress.loadAsync(users.kim);

    assert.deepEqual(loaded.data.progress.solved, {});
    assert.equal(loaded.data.summary.xp, 0);
});

test('경험치는 화면이 보낸 값이 아니라 기록으로 다시 계산된다', async () => {
    // Given: 화면이 xp를 99999로 속여서 보냄
    const { c, users } = await setupWithUsers();
    const dto = { xp: 99999, solved: { 1001: { at: 1, tries: 1, time: 5, late: false } } };

    // When
    const saved = await c.progress.saveAsync(users.kim, dto, 100);
    const loaded = await c.progress.loadAsync(users.kim);

    // Then
    assert.equal(saved.data.summary.xp, 10);
    assert.equal(loaded.data.summary.xp, 10);
    assert.deepEqual(Object.keys(loaded.data.progress.solved), ['1001']);
});

test('객체지향 퀴즈 경험치도 서버가 기록으로 다시 계산한다 (없는 레슨 · 범위 밖 점수는 무시 · 정리)', async () => {
    // Given: 레슨 1 만점, 레슨 2 는 9점으로 속임(→5), 없는 레슨 88
    const { c, users } = await setupWithUsers();
    const dto = { xp: 5000, oopQuiz: { 1: 5, 2: 9, 88: 5 } };

    // When
    const saved = await c.progress.saveAsync(users.kim, dto, 100);
    const loaded = await c.progress.loadAsync(users.kim);

    // Then
    assert.equal(saved.data.summary.xp, 40);
    assert.deepEqual(loaded.data.progress.oopQuiz, { 1: 5, 2: 5, 88: 5 }); // 모양만 정리, 경험치에는 안 셈
    assert.equal(loaded.data.summary.clearedCount, 0);
});

test('너무 큰 진도는 PAYLOAD_TOO_LARGE, 배열이나 null은 INVALID_PROGRESS', async () => {
    const { c, users } = await setupWithUsers();

    assert.equal((await c.progress.saveAsync(users.kim, {}, MAX_PROGRESS_BYTES + 1)).error, AppError.PAYLOAD_TOO_LARGE);
    assert.equal((await c.progress.saveAsync(users.kim, [], 2)).error, AppError.INVALID_PROGRESS);
    assert.equal((await c.progress.saveAsync(users.kim, null, 4)).error, AppError.INVALID_PROGRESS);
});

test('랭킹은 경험치 순이고, 참여를 끈 사람은 빠지며, 내 줄을 표시한다', async () => {
    // Given
    const { c, users } = await setupWithUsers();
    await c.progress.saveAsync(users.kim, { solved: { 1001: { at: 1, tries: 1, time: 1, late: false } } }, 10);
    await c.progress.saveAsync(users.lee, { solved: { 1032: { at: 1, tries: 1, time: 1, late: false } } }, 10);
    await c.progress.saveAsync(users.park, { solved: { 1003: { at: 1 } }, settings: { rankOptIn: false } }, 10);

    // When
    const ranking = await c.ranking.listAsync(users.kim);

    // Then
    assert.deepEqual(ranking.data.map((r) => [r.rank, r.nickname, r.xp, r.isMe]), [[1, 'LEE', 30, false], [2, 'KIM', 10, true]]);
});

test('선생님이 아니면 학생 목록을 볼 수 없다', async () => {
    const { c, users } = await setupWithUsers({ TEACHER_USERNAMES: 'park' });

    assert.equal((await c.teacher.listStudentsAsync(users.kim)).error, AppError.FORBIDDEN);
});

test('선생님은 학생 요약을 보지만 코드는 받지 않는다', async () => {
    // Given
    const { c, users } = await setupWithUsers({ TEACHER_USERNAMES: 'park' });
    await c.progress.saveAsync(users.kim, { solved: { 1001: { at: 1 } }, code: { 1001: 'int main(){}' }, wrong: { 1002: 3 } }, 10);

    // When
    const listed = await c.teacher.listStudentsAsync(users.park);

    // Then
    assert.ok(listed instanceof Success);
    const kim = listed.data.find((s) => s.username === 'kim');
    assert.equal(kim.solvedCount, 1);
    assert.deepEqual(kim.wrong, { 1002: 3 });
    assert.equal(JSON.stringify(listed.data).includes('int main'), false);
    assert.equal('userId' in kim, false);
});

test('AI 힌트는 설정을 켜기 전까지 FEATURE_DISABLED', async () => {
    const { c } = await setupWithUsers();

    const result = await c.hint.requestHintAsync({ title: 'x', code: 'int main(){}' });

    assert.equal(c.hint.enabled, false);
    assert.equal(result.error, AppError.FEATURE_DISABLED);
});

test('API 키를 넣고 켜면 Claude API로 힌트를 받는다 (가짜 fetch)', async () => {
    // Given: 실제 서버 대신 정해진 대답을 하는 가짜 fetch
    let sent = null;
    const fakeFetch = async (url, init) => {
        sent = { url, headers: init.headers, body: JSON.parse(init.body) };
        return new Response(JSON.stringify({ content: [{ type: 'text', text: '3번째 줄의 세미콜론을 확인해 보세요.' }] }), { status: 200 });
    };
    const { c } = await setupWithUsers({ AI_HINT_ENABLED: 'true', AI_HINT_API_KEY: 'test-key' }, { fetchFn: fakeFetch });

    // When
    const result = await c.hint.requestHintAsync({ title: '두 수의 합', code: 'int main() {\n    return 0\n}', judgeResult: '컴파일 에러' });

    // Then
    assert.equal(result.data, '3번째 줄의 세미콜론을 확인해 보세요.');
    assert.equal(sent.url, 'https://api.anthropic.com/v1/messages');
    assert.equal(sent.headers['x-api-key'], 'test-key');
    assert.match(sent.body.messages[0].content, /2: {5}return 0/);
    assert.match(sent.body.messages[0].content, /정답 코드나 고친 코드 전체를 절대 보여주지 마/);
});

test('힌트 API가 실패하면 NETWORK / SERVER 로 알린다', async () => {
    const down = async () => new Response('busy', { status: 529 });
    const { c } = await setupWithUsers({ AI_HINT_ENABLED: 'true', AI_HINT_API_KEY: 'k' }, { fetchFn: down });

    assert.equal((await c.hint.requestHintAsync({ title: 'x', code: 'y' })).error, AppError.SERVER);
    assert.equal((await c.hint.requestHintAsync({ title: 'x', code: '   ' })).error, AppError.INVALID_HINT_REQUEST);
});
