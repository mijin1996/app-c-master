// Service: 진도 저장 규칙 (크기 제한, 값 정리, 경험치는 서버가 다시 계산)
// 그리고 랭킹·선생님 화면 규칙
import { Result, Failure } from '../../public/js/core/result.js';
import { AppError } from '../../public/js/core/app-error.js';
import { progressFromDto } from '../../public/js/mappers/progress-mapper.js';
import { summarize } from '../../public/js/domain/progress-rules.js';

export const MAX_PROGRESS_BYTES = 512 * 1024;
export const RANKING_LIMIT = 100;

export class ProgressService {
    #progress;
    #curriculum;
    #clock;

    constructor(progressRepository, curriculum, clock) {
        this.#progress = progressRepository;
        this.#curriculum = curriculum;
        this.#clock = clock;
    }

    async loadAsync(user) {
        const loaded = await this.#progress.getAsync(user.id);
        if (loaded instanceof Failure) {
            return loaded;
        }
        return Result.success({
            progress: loaded.data.progress,
            summary: summarize(loaded.data.progress, this.#curriculum),
            updatedAt: loaded.data.updatedAt,
        });
    }

    /**
     * @param {object} user
     * @param {unknown} dto  화면이 보낸 진도 JSON
     * @param {number} byteLength 요청 본문 크기
     */
    async saveAsync(user, dto, byteLength) {
        if (byteLength > MAX_PROGRESS_BYTES) {
            return Result.failure(AppError.PAYLOAD_TOO_LARGE);
        }
        if (dto === null || typeof dto !== 'object' || Array.isArray(dto)) {
            return Result.failure(AppError.INVALID_PROGRESS);
        }
        const progress = progressFromDto(dto);
        const summary = summarize(progress, this.#curriculum); // 경험치는 화면 값을 믿지 않고 다시 계산
        const now = this.#clock();
        const saved = await this.#progress.saveAsync(user.id, progress, summary, now);
        return saved instanceof Failure ? saved : Result.success({ summary, updatedAt: now });
    }
}

export class RankingService {
    #progress;

    constructor(progressRepository) {
        this.#progress = progressRepository;
    }

    async listAsync(user) {
        const listed = await this.#progress.listRankingAsync(RANKING_LIMIT);
        if (listed instanceof Failure) {
            return listed;
        }
        return Result.success(listed.data.map((entry, index) => ({
            rank: index + 1,
            nickname: entry.nickname,
            xp: entry.xp,
            level: entry.level,
            form: entry.form,
            solvedCount: entry.solvedCount,
            clearedCount: entry.clearedCount,
            isMe: entry.userId === user.id,
        })));
    }
}

export class TeacherService {
    #progress;
    #teacherUsernames;

    constructor(progressRepository, teacherUsernames) {
        this.#progress = progressRepository;
        this.#teacherUsernames = teacherUsernames;
    }

    async listStudentsAsync(user) {
        if (!this.#teacherUsernames.has(user.username)) {
            return Result.failure(AppError.FORBIDDEN);
        }
        const listed = await this.#progress.listStudentSummariesAsync();
        if (listed instanceof Failure) {
            return listed;
        }
        // 학생 코드는 보내지 않고 수치만 보낸다
        return Result.success(listed.data.map(({ userId, ...rest }) => rest));
    }
}
