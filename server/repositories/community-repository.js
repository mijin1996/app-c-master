// Repository: 커뮤니티 행 → 모델 (+ 실패는 Result로). 규칙 판단은 Service가 한다.
import { Result, Failure } from '../../public/js/core/result.js';
import { AppError } from '../../public/js/core/app-error.js';

function parseTests(text) {
    try {
        const tests = JSON.parse(text);
        return Array.isArray(tests) ? tests.map((t) => ({ input: String(t.input ?? ''), output: String(t.output ?? '') })) : [];
    } catch (e) {
        return [];
    }
}

function problemSummary(row) {
    return {
        id: Number(row.id),
        authorId: Number(row.author_id),
        author: String(row.author_nickname ?? ''),
        title: String(row.title),
        difficulty: Number(row.difficulty),
        likes: Number(row.likes),
        comments: Number(row.comments),
        reports: Number(row.reports),
        hidden: Number(row.hidden) === 1,
        createdAt: Number(row.created_at),
    };
}

function commentOf(row) {
    return {
        id: Number(row.id),
        problemId: Number(row.problem_id),
        authorId: Number(row.author_id),
        author: String(row.author_nickname ?? ''),
        body: String(row.body),
        likes: Number(row.likes),
        reports: Number(row.reports),
        accepted: Number(row.accepted) === 1,
        hidden: Number(row.hidden) === 1,
        createdAt: Number(row.created_at),
    };
}

/** 예상 못 한 DB 오류는 SERVER 실패로 바꿔 준다 */
async function attempt(work) {
    try {
        return Result.success(await work());
    } catch (e) {
        return Result.failure(AppError.SERVER);
    }
}

export class CommunityRepository {
    #source;

    constructor(source) {
        this.#source = source;
    }

    listProblemsAsync(query) {
        return attempt(async () => (await this.#source.listProblemsAsync(query)).map(problemSummary));
    }

    async getProblemAsync(id) {
        const found = await attempt(() => this.#source.findProblemAsync(id));
        if (found instanceof Failure) {
            return found;
        }
        const row = found.data;
        if (!row) {
            return Result.failure(AppError.NOT_FOUND);
        }
        return Result.success({
            ...problemSummary(row),
            body: String(row.body),
            inputSpec: String(row.input_spec),
            outputSpec: String(row.output_spec),
            tests: parseTests(row.tests),
            exampleCount: Number(row.example_count),
        });
    }

    countProblemsSinceAsync(authorId, since) {
        return attempt(() => this.#source.countProblemsSinceAsync(authorId, since));
    }

    createProblemAsync(authorId, problem, at) {
        return attempt(() => this.#source.insertProblemAsync({
            author_id: authorId,
            title: problem.title,
            body: problem.body,
            input_spec: problem.inputSpec,
            output_spec: problem.outputSpec,
            tests: JSON.stringify(problem.tests),
            example_count: problem.exampleCount,
            difficulty: problem.difficulty,
            created_at: at,
        }));
    }

    deleteProblemAsync(id) {
        return attempt(() => this.#source.deleteProblemAsync(id));
    }

    listCommentsAsync(problemId) {
        return attempt(async () => (await this.#source.listCommentsAsync(problemId)).map(commentOf));
    }

    async getCommentAsync(id) {
        const found = await attempt(() => this.#source.findCommentAsync(id));
        if (found instanceof Failure) {
            return found;
        }
        return found.data ? Result.success(commentOf(found.data)) : Result.failure(AppError.NOT_FOUND);
    }

    countCommentsSinceAsync(authorId, since) {
        return attempt(() => this.#source.countCommentsSinceAsync(authorId, since));
    }

    createCommentAsync(problemId, authorId, body, at) {
        return attempt(() => this.#source.insertCommentAsync({ problem_id: problemId, author_id: authorId, body, created_at: at }));
    }

    acceptCommentAsync(problemId, commentId) {
        return attempt(() => this.#source.acceptCommentAsync(problemId, commentId));
    }

    likedIdsAsync(userId, targetType, ids) {
        return attempt(() => this.#source.listLikedAsync(userId, targetType, ids));
    }

    toggleLikeAsync(targetType, targetId, userId) {
        return attempt(() => this.#source.toggleLikeAsync(targetType, targetId, userId));
    }

    reportAsync(targetType, targetId, userId, reason, at) {
        return attempt(() => this.#source.reportAsync(targetType, targetId, userId, reason, at));
    }

    setHiddenAsync(targetType, targetId, hidden) {
        return attempt(() => this.#source.setHiddenAsync(targetType, targetId, hidden));
    }
}
