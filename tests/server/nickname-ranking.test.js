// 랭킹에서 같은 이름이 두 번 보이지 않게: 닉네임 겹침 금지 + 랭킹은 최대 20명
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Failure, Success } from '../../public/js/core/result.js';
import { AppError, messageOf } from '../../public/js/core/app-error.js';
import { createContainer } from '../../server/container.js';
import { RANKING_LIMIT } from '../../server/services/progress-service.js';
import { Pbkdf2PasswordHasher } from '../../server/security/password-hasher.js';
import { SqliteD1 } from '../fakes/sqlite-d1.js';

const FAST_HASHER = new Pbkdf2PasswordHasher(1000);
const setup = () => createContainer({ DB: new SqliteD1() }, { hasher: FAST_HASHER });
// undefined === undefined 로 우연히 통과하지 않게, 실패 종류가 진짜 있는지 먼저 본다
const assertTaken = (result) => {
    assert.equal(typeof AppError.NICKNAME_TAKEN, 'string');
    assert.ok(result instanceof Failure);
    assert.equal(result.error, AppError.NICKNAME_TAKEN);
};

test('이미 다른 사람이 쓰는 닉네임으로는 가입할 수 없다 (NICKNAME_TAKEN, 한국어 안내 있음)', async () => {
    // Given
    const c = setup();
    await c.auth.signupAsync({ username: 'kim', nickname: '코디왕', password: 'abcd' });

    // When
    const again = await c.auth.signupAsync({ username: 'lee', nickname: '코디왕', password: 'abcd' });

    // Then
    assert.ok(again instanceof Failure);
    assertTaken(again);
    assert.notEqual(messageOf(AppError.NICKNAME_TAKEN), '알 수 없는 문제가 생겼어요.');
});

test('영어 닉네임은 대소문자만 달라도 같은 이름으로 본다 (Cody = cody)', async () => {
    // Given
    const c = setup();
    await c.auth.signupAsync({ username: 'kim', nickname: 'Cody', password: 'abcd' });

    // When
    const again = await c.auth.signupAsync({ username: 'lee', nickname: 'cody', password: 'abcd' });

    // Then
    assertTaken(again);
});

test('닉네임을 비우면 아이디가 닉네임이 되는데, 그 이름을 다른 사람이 쓰고 있어도 막는다', async () => {
    // Given: kim 이 닉네임을 "lee" 로 씀
    const c = setup();
    await c.auth.signupAsync({ username: 'kim', nickname: 'lee', password: 'abcd' });

    // When: lee 가 닉네임 없이 가입 → 닉네임 lee
    const again = await c.auth.signupAsync({ username: 'lee', nickname: '', password: 'abcd' });

    // Then
    assertTaken(again);
});

test('닉네임 바꾸기: 남이 쓰는 이름은 거절, 내 이름 그대로(대소문자만 바꿈)는 허락', async () => {
    // Given
    const c = setup();
    await c.auth.signupAsync({ username: 'kim', nickname: 'Star', password: 'abcd' });
    const s = await c.auth.signupAsync({ username: 'lee', nickname: 'moon', password: 'abcd' });
    const lee = (await c.auth.currentUserAsync(s.data.token)).data;

    // When
    const taken = await c.auth.changeNicknameAsync(lee, 'star');
    const mine = await c.auth.changeNicknameAsync(lee, 'Moon');

    // Then
    assertTaken(taken);
    assert.ok(mine instanceof Success);
    assert.equal(mine.data.nickname, 'Moon');
});

test('랭킹은 최대 20명: 21명(제한+1)이 참여해도 20명만, 20명(딱 맞게)이면 20명', async () => {
    // Given
    assert.equal(RANKING_LIMIT, 20);
    const c = setup();
    let me = null;
    for (let i = 0; i < 21; i++) {
        const s = await c.auth.signupAsync({ username: 'user' + i, nickname: '학생' + i, password: 'abcd' });
        const user = (await c.auth.currentUserAsync(s.data.token)).data;
        me ??= user;
        await c.progress.saveAsync(user, { solved: { 1001: { at: 1, tries: 1, time: 1, late: false } } }, 10);
    }

    // When
    const ranking = await c.ranking.listAsync(me);

    // Then: 20명, 이름이 모두 다르다
    assert.equal(ranking.data.length, 20);
    assert.equal(new Set(ranking.data.map((r) => r.nickname)).size, 20);
});
