// Service: 회원가입·로그인·계정 찾기 규칙
// 입력을 검사하고, 여러 Repository를 조합한다. 규칙 실패는 Failure로 돌려준다.
import { Result, Failure, Success } from '../../public/js/core/result.js';
import { AppError } from '../../public/js/core/app-error.js';
import {
    isValidUsername, isValidPassword, normalizeNickname, normalizeRecoveryCode, formatRecoveryCode,
} from '../../public/js/domain/account-rules.js';
import { sha256Hex, hashRecoveryCodeAsync } from '../security/secret-generator.js';

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30일

/** 화면에 보내도 되는 회원 정보만 */
export function publicUser(user, isTeacher) {
    return { username: user.username, nickname: user.nickname, isTeacher: Boolean(isTeacher) };
}

export class AuthService {
    #users;
    #sessions;
    #hasher;
    #secrets;
    #clock;
    #teacherUsernames;

    /**
     * @param {import('../repositories/user-repository.js').UserRepository} users
     * @param {import('../repositories/session-repository.js').SessionRepository} sessions
     * @param {{hashAsync: Function, verifyAsync: Function}} hasher
     * @param {{newSessionToken: Function, newRecoveryCode: Function}} secrets
     * @param {() => number} clock 현재 시각(ms)
     * @param {Set<string>} teacherUsernames 선생님 아이디 목록
     */
    constructor(users, sessions, hasher, secrets, clock, teacherUsernames) {
        this.#users = users;
        this.#sessions = sessions;
        this.#hasher = hasher;
        this.#secrets = secrets;
        this.#clock = clock;
        this.#teacherUsernames = teacherUsernames;
    }

    isTeacher(user) {
        return this.#teacherUsernames.has(user.username);
    }

    /** 랭킹에 같은 이름이 둘 보이지 않게: 다른 사람이 쓰는 닉네임이면 NICKNAME_TAKEN */
    async #checkNicknameFreeAsync(nickname, myId) {
        const taken = await this.#users.isNicknameTakenAsync(nickname, myId);
        if (taken instanceof Failure) {
            return taken;
        }
        return taken.data ? Result.failure(AppError.NICKNAME_TAKEN) : Result.success(true);
    }

    async #openSessionAsync(userId) {
        const token = this.#secrets.newSessionToken();
        const saved = await this.#sessions.saveAsync(await sha256Hex(token), userId, this.#clock() + SESSION_TTL_MS);
        return saved instanceof Failure ? saved : Result.success(token);
    }

    async signupAsync({ username, nickname, password }) {
        const name = String(username ?? '').trim().toLowerCase();
        if (!isValidUsername(name)) {
            return Result.failure(AppError.INVALID_USERNAME);
        }
        if (!isValidPassword(password)) {
            return Result.failure(AppError.INVALID_PASSWORD);
        }
        const nick = normalizeNickname(nickname, name);
        if (nick === null) {
            return Result.failure(AppError.INVALID_NICKNAME);
        }
        // 아이디가 겹치면 그 말이 더 정확하니 닉네임보다 먼저 알려 준다
        const existing = await this.#users.findByUsernameAsync(name);
        if (existing instanceof Success) {
            return Result.failure(AppError.USERNAME_TAKEN);
        }
        if (existing.error !== AppError.NOT_FOUND) {
            return existing;
        }
        const free = await this.#checkNicknameFreeAsync(nick, 0);
        if (free instanceof Failure) {
            return free;
        }

        const recoveryCode = this.#secrets.newRecoveryCode();
        const created = await this.#users.createAsync({
            username: name,
            nickname: nick,
            passwordHash: await this.#hasher.hashAsync(password),
            recoveryHash: await hashRecoveryCodeAsync(recoveryCode),
            createdAt: this.#clock(),
        });
        if (created instanceof Failure) {
            return created;
        }

        const session = await this.#openSessionAsync(created.data);
        if (session instanceof Failure) {
            return session;
        }
        const user = { username: name, nickname: nick };
        return Result.success({
            user: publicUser(user, this.isTeacher(user)),
            token: session.data,
            recoveryCode: formatRecoveryCode(recoveryCode),
        });
    }

    async loginAsync({ username, password }) {
        const name = String(username ?? '').trim().toLowerCase();
        if (!isValidUsername(name) || typeof password !== 'string') {
            return Result.failure(AppError.WRONG_CREDENTIALS);
        }
        const found = await this.#users.findByUsernameAsync(name);
        if (found instanceof Failure) {
            return found.error === AppError.NOT_FOUND ? Result.failure(AppError.WRONG_CREDENTIALS) : found;
        }
        if (!(await this.#hasher.verifyAsync(password, found.data.passwordHash))) {
            return Result.failure(AppError.WRONG_CREDENTIALS);
        }
        const session = await this.#openSessionAsync(found.data.id);
        if (session instanceof Failure) {
            return session;
        }
        return Result.success({ user: publicUser(found.data, this.isTeacher(found.data)), token: session.data });
    }

    async logoutAsync(token) {
        if (!token) {
            return Result.success(true);
        }
        return this.#sessions.deleteAsync(await sha256Hex(token));
    }

    /** 쿠키의 토큰으로 지금 로그인한 회원 */
    async currentUserAsync(token) {
        if (!token) {
            return Result.failure(AppError.UNAUTHORIZED);
        }
        const session = await this.#sessions.findUserIdAsync(await sha256Hex(token), this.#clock());
        if (session instanceof Failure) {
            return session;
        }
        const found = await this.#users.findByIdAsync(session.data);
        return found instanceof Failure ? Result.failure(AppError.UNAUTHORIZED) : found;
    }

    /** 복구 코드로 아이디 찾기 */
    async findUsernamesAsync(code) {
        const normalized = normalizeRecoveryCode(code);
        if (normalized === null) {
            return Result.failure(AppError.INVALID_RECOVERY_CODE);
        }
        const found = await this.#users.findByRecoveryHashAsync(await hashRecoveryCodeAsync(normalized));
        if (found instanceof Failure) {
            return found;
        }
        if (found.data.length === 0) {
            return Result.failure(AppError.NOT_FOUND);
        }
        return Result.success(found.data.map((u) => u.username));
    }

    /** 아이디 + 복구 코드로 비밀번호 재설정. 쓰던 코드는 버리고 새 코드를 준다 */
    async resetPasswordAsync({ username, code, newPassword }) {
        const normalized = normalizeRecoveryCode(code);
        if (normalized === null) {
            return Result.failure(AppError.INVALID_RECOVERY_CODE);
        }
        if (!isValidPassword(newPassword)) {
            return Result.failure(AppError.INVALID_PASSWORD);
        }
        const found = await this.#users.findByUsernameAsync(String(username ?? '').trim().toLowerCase());
        if (found instanceof Failure) {
            return found.error === AppError.NOT_FOUND ? Result.failure(AppError.RECOVERY_MISMATCH) : found;
        }
        if (found.data.recoveryHash !== await hashRecoveryCodeAsync(normalized)) {
            return Result.failure(AppError.RECOVERY_MISMATCH);
        }

        const nextCode = this.#secrets.newRecoveryCode();
        const updated = await this.#users.updatePasswordAsync(
            found.data.id, await this.#hasher.hashAsync(newPassword), await hashRecoveryCodeAsync(nextCode));
        if (updated instanceof Failure) {
            return updated;
        }
        await this.#sessions.deleteAllOfUserAsync(found.data.id); // 다른 기기의 로그인도 끊는다
        return Result.success({ recoveryCode: formatRecoveryCode(nextCode) });
    }

    /** 로그인한 회원의 복구 코드를 새로 만든다 */
    async renewRecoveryCodeAsync(user) {
        const nextCode = this.#secrets.newRecoveryCode();
        const updated = await this.#users.updateRecoveryHashAsync(user.id, await hashRecoveryCodeAsync(nextCode));
        return updated instanceof Failure ? updated : Result.success({ recoveryCode: formatRecoveryCode(nextCode) });
    }

    async changeNicknameAsync(user, nickname) {
        const nick = normalizeNickname(nickname, user.username);
        if (nick === null) {
            return Result.failure(AppError.INVALID_NICKNAME);
        }
        const free = await this.#checkNicknameFreeAsync(nick, user.id);
        if (free instanceof Failure) {
            return free;
        }
        const updated = await this.#users.updateNicknameAsync(user.id, nick);
        return updated instanceof Failure ? updated : Result.success(publicUser({ ...user, nickname: nick }, this.isTeacher(user)));
    }
}
