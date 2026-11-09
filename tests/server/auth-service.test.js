// 회원가입·로그인·계정 찾기 테스트 (실제 SQL을 메모리 SQLite에서 실행)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Success, Failure } from '../../public/js/core/result.js';
import { AppError } from '../../public/js/core/app-error.js';
import { createContainer } from '../../server/container.js';
import { Pbkdf2PasswordHasher } from '../../server/security/password-hasher.js';
import { SqliteD1, BrokenD1 } from '../fakes/sqlite-d1.js';

const FAST_HASHER = new Pbkdf2PasswordHasher(1000); // 테스트는 빠르게

function setup(env = {}, now = 1_000_000) {
    const clock = { now };
    const container = createContainer({ DB: new SqliteD1(), ...env }, { clock: () => clock.now, hasher: FAST_HASHER });
    return { auth: container.auth, clock };
}

test('회원가입하면 세션 토큰과 복구 코드를 받는다', async () => {
    // Given
    const { auth } = setup();

    // When
    const result = await auth.signupAsync({ username: 'Cody_01', nickname: ' 코디 ', password: 'abcd' });

    // Then
    assert.ok(result instanceof Success);
    assert.equal(result.data.user.username, 'cody_01');
    assert.equal(result.data.user.nickname, '코디');
    assert.match(result.data.recoveryCode, /^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    assert.equal(typeof result.data.token, 'string');
});

test('같은 아이디로 다시 가입하면 USERNAME_TAKEN', async () => {
    const { auth } = setup();
    await auth.signupAsync({ username: 'kim', password: 'abcd' });

    const again = await auth.signupAsync({ username: 'kim', password: 'zzzz' });

    assert.deepEqual([again instanceof Failure, again.error], [true, AppError.USERNAME_TAKEN]);
});

test('잘못된 입력은 규칙 실패로 막는다', async () => {
    const { auth } = setup();

    assert.equal((await auth.signupAsync({ username: 'ab', password: 'abcd' })).error, AppError.INVALID_USERNAME);
    assert.equal((await auth.signupAsync({ username: 'abc', password: 'abc' })).error, AppError.INVALID_PASSWORD);
    assert.equal((await auth.signupAsync({ username: 'abc', password: 'abcd', nickname: '가'.repeat(13) })).error, AppError.INVALID_NICKNAME);
});

test('비밀번호가 틀리거나 없는 아이디면 똑같이 WRONG_CREDENTIALS', async () => {
    const { auth } = setup();
    await auth.signupAsync({ username: 'kim', password: 'abcd' });

    assert.equal((await auth.loginAsync({ username: 'kim', password: 'nope' })).error, AppError.WRONG_CREDENTIALS);
    assert.equal((await auth.loginAsync({ username: 'nobody', password: 'abcd' })).error, AppError.WRONG_CREDENTIALS);
    assert.ok((await auth.loginAsync({ username: 'KIM', password: 'abcd' })) instanceof Success);
});

test('로그인 토큰으로 지금 회원을 찾고, 로그아웃하면 못 찾는다', async () => {
    // Given
    const { auth } = setup();
    await auth.signupAsync({ username: 'kim', password: 'abcd' });
    const login = await auth.loginAsync({ username: 'kim', password: 'abcd' });

    // When / Then
    const me = await auth.currentUserAsync(login.data.token);
    assert.equal(me.data.username, 'kim');

    await auth.logoutAsync(login.data.token);
    assert.equal((await auth.currentUserAsync(login.data.token)).error, AppError.UNAUTHORIZED);
});

test('세션은 30일이 지나면 끝난다', async () => {
    const { auth, clock } = setup();
    const signup = await auth.signupAsync({ username: 'kim', password: 'abcd' });

    clock.now += 30 * 24 * 60 * 60 * 1000;

    assert.equal((await auth.currentUserAsync(signup.data.token)).error, AppError.UNAUTHORIZED);
});

test('복구 코드로 아이디를 찾는다 (소문자·하이픈 없이 입력해도 됨)', async () => {
    // Given
    const { auth } = setup();
    const signup = await auth.signupAsync({ username: 'kim', password: 'abcd' });
    const typed = signup.data.recoveryCode.toLowerCase().replace('-', '');

    // When
    const found = await auth.findUsernamesAsync(typed);

    // Then
    assert.deepEqual(found.data, ['kim']);
    assert.equal((await auth.findUsernamesAsync('AAAA-AAAA')).error, AppError.NOT_FOUND);
    assert.equal((await auth.findUsernamesAsync('123')).error, AppError.INVALID_RECOVERY_CODE);
});

test('비밀번호를 재설정하면 옛 비밀번호·옛 코드·다른 기기 로그인이 모두 무효가 된다', async () => {
    // Given
    const { auth } = setup();
    const signup = await auth.signupAsync({ username: 'kim', password: 'old1' });
    const oldCode = signup.data.recoveryCode;

    // When
    const reset = await auth.resetPasswordAsync({ username: 'kim', code: oldCode, newPassword: 'new1' });

    // Then
    assert.ok(reset instanceof Success);
    assert.notEqual(reset.data.recoveryCode, oldCode);
    assert.equal((await auth.loginAsync({ username: 'kim', password: 'old1' })).error, AppError.WRONG_CREDENTIALS);
    assert.ok((await auth.loginAsync({ username: 'kim', password: 'new1' })) instanceof Success);
    assert.equal((await auth.resetPasswordAsync({ username: 'kim', code: oldCode, newPassword: 'x1x1' })).error, AppError.RECOVERY_MISMATCH);
    assert.equal((await auth.currentUserAsync(signup.data.token)).error, AppError.UNAUTHORIZED);
});

test('다른 사람의 복구 코드로는 재설정할 수 없다', async () => {
    const { auth } = setup();
    await auth.signupAsync({ username: 'kim', password: 'abcd' });
    const lee = await auth.signupAsync({ username: 'lee', password: 'abcd' });

    const result = await auth.resetPasswordAsync({ username: 'kim', code: lee.data.recoveryCode, newPassword: 'hack' });

    assert.equal(result.error, AppError.RECOVERY_MISMATCH);
});

test('TEACHER_USERNAMES에 있는 아이디는 선생님이다', async () => {
    const { auth } = setup({ TEACHER_USERNAMES: 'Teacher1, kim ' });

    const signup = await auth.signupAsync({ username: 'teacher1', password: 'abcd' });

    assert.equal(signup.data.user.isTeacher, true);
});

test('DB가 고장 나면 예외 대신 SERVER 실패를 돌려준다', async () => {
    const container = createContainer({ DB: new BrokenD1() }, { hasher: FAST_HASHER });

    const result = await container.auth.loginAsync({ username: 'kim', password: 'abcd' });

    assert.equal(result.error, AppError.SERVER);
});
