// Repository: 회원 데이터를 골라 주고, DB 행(DTO)을 User 모델로 바꾼다. 실패는 Result로 알린다.
import { Result } from '../../public/js/core/result.js';
import { AppError } from '../../public/js/core/app-error.js';

/**
 * @typedef {Object} User   서버 안에서만 쓰는 회원 모델
 * @property {number} id
 * @property {string} username
 * @property {string} nickname
 * @property {string} passwordHash
 * @property {string} recoveryHash
 * @property {number} createdAt
 */

export function userFromRow(row) {
    return Object.freeze({
        id: Number(row.id),
        username: String(row.username),
        nickname: String(row.nickname),
        passwordHash: String(row.password_hash),
        recoveryHash: String(row.recovery_hash),
        createdAt: Number(row.created_at),
    });
}

const isUniqueViolation = (e) => /UNIQUE/i.test(String(e && e.message));

export class UserRepository {
    #dataSource;

    constructor(dataSource) {
        this.#dataSource = dataSource;
    }

    async findByUsernameAsync(username) {
        try {
            const row = await this.#dataSource.findByUsernameAsync(username);
            return row ? Result.success(userFromRow(row)) : Result.failure(AppError.NOT_FOUND);
        } catch (e) {
            return Result.failure(AppError.SERVER);
        }
    }

    async findByIdAsync(id) {
        try {
            const row = await this.#dataSource.findByIdAsync(id);
            return row ? Result.success(userFromRow(row)) : Result.failure(AppError.NOT_FOUND);
        } catch (e) {
            return Result.failure(AppError.SERVER);
        }
    }

    async findByRecoveryHashAsync(recoveryHash) {
        try {
            const rows = await this.#dataSource.findByRecoveryHashAsync(recoveryHash);
            return Result.success(rows.map(userFromRow));
        } catch (e) {
            return Result.failure(AppError.SERVER);
        }
    }

    /** 성공하면 새 회원 id */
    async createAsync(newUser) {
        try {
            return Result.success(await this.#dataSource.insertAsync(newUser));
        } catch (e) {
            return Result.failure(isUniqueViolation(e) ? AppError.USERNAME_TAKEN : AppError.SERVER);
        }
    }

    async updatePasswordAsync(id, passwordHash, recoveryHash) {
        return this.#runAsync(() => this.#dataSource.updatePasswordAsync(id, passwordHash, recoveryHash));
    }

    async updateRecoveryHashAsync(id, recoveryHash) {
        return this.#runAsync(() => this.#dataSource.updateRecoveryHashAsync(id, recoveryHash));
    }

    async updateNicknameAsync(id, nickname) {
        return this.#runAsync(() => this.#dataSource.updateNicknameAsync(id, nickname));
    }

    async #runAsync(work) {
        try {
            await work();
            return Result.success(true);
        } catch (e) {
            return Result.failure(AppError.SERVER);
        }
    }
}
