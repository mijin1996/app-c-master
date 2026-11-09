// Repository: 로그인 세션
import { Result } from '../../public/js/core/result.js';
import { AppError } from '../../public/js/core/app-error.js';

export class SessionRepository {
    #dataSource;

    constructor(dataSource) {
        this.#dataSource = dataSource;
    }

    async saveAsync(tokenHash, userId, expiresAt) {
        try {
            await this.#dataSource.insertAsync(tokenHash, userId, expiresAt);
            return Result.success(true);
        } catch (e) {
            return Result.failure(AppError.SERVER);
        }
    }

    /** 살아 있는 세션의 회원 id. 없으면 UNAUTHORIZED */
    async findUserIdAsync(tokenHash, now) {
        try {
            const userId = await this.#dataSource.findUserIdAsync(tokenHash, now);
            return userId === null ? Result.failure(AppError.UNAUTHORIZED) : Result.success(userId);
        } catch (e) {
            return Result.failure(AppError.SERVER);
        }
    }

    async deleteAsync(tokenHash) {
        try {
            await this.#dataSource.deleteAsync(tokenHash);
            return Result.success(true);
        } catch (e) {
            return Result.failure(AppError.SERVER);
        }
    }

    async deleteAllOfUserAsync(userId) {
        try {
            await this.#dataSource.deleteByUserAsync(userId);
            return Result.success(true);
        } catch (e) {
            return Result.failure(AppError.SERVER);
        }
    }
}
