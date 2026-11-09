// Repository: 접속 수 DataSource 결과를 Result 로. DB 오류는 SERVER 실패로 바꿔 예외가 새지 않게 한다.
import { Result } from '../../public/js/core/result.js';
import { AppError } from '../../public/js/core/app-error.js';

export class VisitRepository {
    #dataSource;

    constructor(dataSource) {
        this.#dataSource = dataSource;
    }

    async incrementAsync(day) {
        try {
            return Result.success(await this.#dataSource.incrementAsync(day));
        } catch (e) {
            return Result.failure(AppError.SERVER);
        }
    }

    async countAsync(day) {
        try {
            return Result.success(await this.#dataSource.countAsync(day));
        } catch (e) {
            return Result.failure(AppError.SERVER);
        }
    }
}
