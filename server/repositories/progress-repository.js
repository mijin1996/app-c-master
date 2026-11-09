// Repository: 진도 저장·조회 + 랭킹/선생님 화면용 목록
import { Result } from '../../public/js/core/result.js';
import { AppError } from '../../public/js/core/app-error.js';
import { createEmptyProgress } from '../../public/js/domain/progress-model.js';
import { progressFromDto, progressToDto } from '../../public/js/mappers/progress-mapper.js';

function parseJson(text, fallback) {
    try {
        return JSON.parse(text);
    } catch (e) {
        return fallback;
    }
}

export class ProgressRepository {
    #dataSource;

    constructor(dataSource) {
        this.#dataSource = dataSource;
    }

    /** 저장된 진도. 아직 없으면 빈 진도 */
    async getAsync(userId) {
        try {
            const row = await this.#dataSource.findAsync(userId);
            if (!row) {
                return Result.success({ progress: createEmptyProgress(), updatedAt: 0 });
            }
            return Result.success({ progress: progressFromDto(parseJson(row.data, {})), updatedAt: Number(row.updated_at) });
        } catch (e) {
            return Result.failure(AppError.SERVER);
        }
    }

    async saveAsync(userId, progress, summary, updatedAt) {
        try {
            await this.#dataSource.upsertAsync({
                user_id: userId,
                data: JSON.stringify(progressToDto(progress)),
                xp: summary.xp,
                level: summary.level,
                form: summary.form,
                solved_count: summary.solvedCount,
                cleared_count: summary.clearedCount,
                summary: JSON.stringify(summary),
                rank_opt_in: progress.settings.rankOptIn ? 1 : 0,
                updated_at: updatedAt,
            });
            return Result.success(true);
        } catch (e) {
            return Result.failure(AppError.SERVER);
        }
    }

    async listRankingAsync(limit) {
        try {
            const rows = await this.#dataSource.listRankingAsync(limit);
            return Result.success(rows.map((r) => Object.freeze({
                userId: Number(r.user_id),
                nickname: String(r.nickname),
                xp: Number(r.xp),
                level: Number(r.level),
                form: Number(r.form),
                solvedCount: Number(r.solved_count),
                clearedCount: Number(r.cleared_count),
            })));
        } catch (e) {
            return Result.failure(AppError.SERVER);
        }
    }

    async listStudentSummariesAsync() {
        try {
            const rows = await this.#dataSource.listSummariesAsync();
            return Result.success(rows.map((r) => {
                const summary = parseJson(r.summary ?? '{}', {});
                return Object.freeze({
                    userId: Number(r.user_id),
                    username: String(r.username),
                    nickname: String(r.nickname),
                    xp: Number(r.xp ?? 0),
                    level: Number(r.level ?? 1),
                    form: Number(r.form ?? 0),
                    solvedCount: Number(r.solved_count ?? 0),
                    clearedCount: Number(r.cleared_count ?? 0),
                    chapterStates: Array.isArray(summary.chapterStates) ? summary.chapterStates : [],
                    quizAvg: summary.quizAvg ?? null,
                    lastStudyDay: summary.lastStudyDay ?? null,
                    wrong: summary.wrong ?? {},
                });
            }));
        } catch (e) {
            return Result.failure(AppError.SERVER);
        }
    }
}
