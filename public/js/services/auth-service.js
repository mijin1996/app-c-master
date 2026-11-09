// Service(화면 쪽): 로그인 상태를 들고 있고, 서버에 보내기 전에 입력을 먼저 검사한다.
import { Result, Failure } from '../core/result.js';
import { AppError } from '../core/app-error.js';
import { isValidUsername, isValidPassword, normalizeNickname, normalizeRecoveryCode } from '../domain/account-rules.js';

export class AuthService {
    #repository;
    #user = null;
    #features = { aiHint: false, paidLanguages: false };
    #listeners = new Set();

    constructor(repository) {
        this.#repository = repository;
    }

    get user() {
        return this.#user;
    }

    get serverFeatures() {
        return this.#features;
    }

    onChange(listener) {
        this.#listeners.add(listener);
        return () => this.#listeners.delete(listener);
    }

    #setUser(user) {
        this.#user = user;
        for (const listener of this.#listeners) {
            listener(user);
        }
    }

    /** 페이지를 처음 열 때: 쿠키가 살아 있으면 자동 로그인 */
    async restoreAsync() {
        const me = await this.#repository.meAsync();
        if (me instanceof Failure) {
            return me;
        }
        this.#features = { aiHint: me.data.features?.aiHint === true, paidLanguages: me.data.features?.paidLanguages === true };
        this.#setUser(me.data.user);
        return Result.success(me.data.user);
    }

    async signupAsync(username, nickname, password) {
        const name = String(username ?? '').trim().toLowerCase();
        if (!isValidUsername(name)) {
            return Result.failure(AppError.INVALID_USERNAME);
        }
        if (!isValidPassword(password)) {
            return Result.failure(AppError.INVALID_PASSWORD);
        }
        if (normalizeNickname(nickname, name) === null) {
            return Result.failure(AppError.INVALID_NICKNAME);
        }
        const result = await this.#repository.signupAsync({ username: name, nickname, password });
        if (result instanceof Failure) {
            return result;
        }
        await this.restoreAsync();
        return result;
    }

    async loginAsync(username, password) {
        const name = String(username ?? '').trim().toLowerCase();
        if (!isValidUsername(name) || !isValidPassword(password)) {
            return Result.failure(AppError.WRONG_CREDENTIALS);
        }
        const result = await this.#repository.loginAsync({ username: name, password });
        if (result instanceof Failure) {
            return result;
        }
        await this.restoreAsync();
        return result;
    }

    async logoutAsync() {
        await this.#repository.logoutAsync();
        this.#setUser(null);
        return Result.success(true);
    }

    async findUsernamesAsync(code) {
        if (normalizeRecoveryCode(code) === null) {
            return Result.failure(AppError.INVALID_RECOVERY_CODE);
        }
        return this.#repository.findUsernamesAsync(code);
    }

    async resetPasswordAsync(username, code, newPassword) {
        if (normalizeRecoveryCode(code) === null) {
            return Result.failure(AppError.INVALID_RECOVERY_CODE);
        }
        if (!isValidPassword(newPassword)) {
            return Result.failure(AppError.INVALID_PASSWORD);
        }
        return this.#repository.resetPasswordAsync({ username: String(username ?? '').trim().toLowerCase(), code, newPassword });
    }

    renewRecoveryCodeAsync() {
        return this.#repository.renewRecoveryCodeAsync();
    }

    async changeNicknameAsync(nickname) {
        const result = await this.#repository.changeNicknameAsync(nickname);
        if (!(result instanceof Failure)) {
            this.#setUser(result.data);
        }
        return result;
    }
}
