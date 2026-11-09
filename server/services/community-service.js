// Service: 커뮤니티 규칙. 누가 무엇을 할 수 있는지, 하루 올리기 제한, 신고 누적 자동 숨김을 판단한다.
import { Result, Failure } from '../../public/js/core/result.js';
import { AppError } from '../../public/js/core/app-error.js';
import {
    COMMUNITY_LIMITS, validateProblemDraft, validateComment, shouldAutoHide,
} from '../../public/js/domain/community-rules.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const TARGET_TYPES = new Set(['problem', 'comment']);
const SORTS = new Set(['new', 'popular']);

const positiveId = (value) => {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : null;
};

export class CommunityService {
    #repository;
    #clock;
    #isTeacher;

    /**
     * @param {import('../repositories/community-repository.js').CommunityRepository} repository
     * @param {() => number} clock
     * @param {(user: object) => boolean} isTeacher 선생님은 숨기기·숨긴 글 보기를 할 수 있다
     */
    constructor(repository, clock, isTeacher) {
        this.#repository = repository;
        this.#clock = clock;
        this.#isTeacher = isTeacher;
    }

    async listProblemsAsync(user, query = {}) {
        const page = Math.max(0, Math.floor(Number(query.page) || 0));
        const sort = SORTS.has(query.sort) ? query.sort : 'new';
        const teacher = this.#isTeacher(user);
        const listed = await this.#repository.listProblemsAsync({
            sort, limit: COMMUNITY_LIMITS.pageSize, offset: page * COMMUNITY_LIMITS.pageSize, includeHidden: teacher,
        });
        if (listed instanceof Failure) {
            return listed;
        }
        const liked = await this.#repository.likedIdsAsync(user.id, 'problem', listed.data.map((p) => p.id));
        const likedSet = new Set(liked instanceof Failure ? [] : liked.data);
        return Result.success(listed.data.map((p) => ({ ...p, liked: likedSet.has(p.id), mine: p.authorId === user.id })));
    }

    /** 문제 + 댓글. 숨긴 글은 쓴 사람과 선생님에게만 보인다 */
    async getProblemAsync(user, rawId) {
        const id = positiveId(rawId);
        if (!id) {
            return Result.failure(AppError.NOT_FOUND);
        }
        const found = await this.#repository.getProblemAsync(id);
        if (found instanceof Failure) {
            return found;
        }
        const teacher = this.#isTeacher(user);
        const problem = found.data;
        if (problem.hidden && !teacher && problem.authorId !== user.id) {
            return Result.failure(AppError.NOT_FOUND);
        }
        const comments = await this.#repository.listCommentsAsync(id);
        if (comments instanceof Failure) {
            return comments;
        }
        const visible = comments.data.filter((c) => !c.hidden || teacher || c.authorId === user.id);
        const likedProblem = await this.#repository.likedIdsAsync(user.id, 'problem', [id]);
        const likedComments = await this.#repository.likedIdsAsync(user.id, 'comment', visible.map((c) => c.id));
        const commentLikes = new Set(likedComments instanceof Failure ? [] : likedComments.data);
        return Result.success({
            ...problem,
            mine: problem.authorId === user.id,
            liked: !(likedProblem instanceof Failure) && likedProblem.data.includes(id),
            canModerate: teacher,
            comments: visible.map((c) => ({ ...c, mine: c.authorId === user.id, liked: commentLikes.has(c.id) })),
        });
    }

    async createProblemAsync(user, draft) {
        const checked = validateProblemDraft(draft);
        if (!checked.ok) {
            return Result.failure(AppError.INVALID_POST, checked.message);
        }
        const now = this.#clock();
        const recent = await this.#repository.countProblemsSinceAsync(user.id, now - DAY_MS);
        if (recent instanceof Failure) {
            return recent;
        }
        if (recent.data >= COMMUNITY_LIMITS.problemsPerDay) {
            return Result.failure(AppError.TOO_MANY_POSTS);
        }
        return this.#repository.createProblemAsync(user.id, checked.problem, now);
    }

    /** 내가 낸 문제 지우기 (선생님은 누구 것이든) */
    async deleteProblemAsync(user, rawId) {
        const found = await this.#repository.getProblemAsync(positiveId(rawId) ?? 0);
        if (found instanceof Failure) {
            return found;
        }
        if (found.data.authorId !== user.id && !this.#isTeacher(user)) {
            return Result.failure(AppError.FORBIDDEN);
        }
        return this.#repository.deleteProblemAsync(found.data.id);
    }

    async addCommentAsync(user, request) {
        const problemId = positiveId(request?.problemId);
        const checked = validateComment(request?.body);
        if (!problemId || !checked.ok) {
            return Result.failure(AppError.INVALID_POST, checked.message);
        }
        const problem = await this.#repository.getProblemAsync(problemId);
        if (problem instanceof Failure) {
            return problem;
        }
        const now = this.#clock();
        const recent = await this.#repository.countCommentsSinceAsync(user.id, now - HOUR_MS);
        if (recent instanceof Failure) {
            return recent;
        }
        if (recent.data >= COMMUNITY_LIMITS.commentsPerHour) {
            return Result.failure(AppError.TOO_MANY_POSTS);
        }
        return this.#repository.createCommentAsync(problemId, user.id, checked.body, now);
    }

    /** 채택: 문제를 낸 사람만, 자기 문제의 다른 사람 댓글을 */
    async acceptCommentAsync(user, rawCommentId) {
        const comment = await this.#repository.getCommentAsync(positiveId(rawCommentId) ?? 0);
        if (comment instanceof Failure) {
            return comment;
        }
        const problem = await this.#repository.getProblemAsync(comment.data.problemId);
        if (problem instanceof Failure) {
            return problem;
        }
        if (problem.data.authorId !== user.id || comment.data.authorId === user.id) {
            return Result.failure(AppError.FORBIDDEN);
        }
        return this.#repository.acceptCommentAsync(problem.data.id, comment.data.id);
    }

    async toggleLikeAsync(user, request) {
        const targetId = positiveId(request?.targetId);
        if (!TARGET_TYPES.has(request?.targetType) || !targetId) {
            return Result.failure(AppError.INVALID_POST);
        }
        const exists = request.targetType === 'problem'
            ? await this.#repository.getProblemAsync(targetId)
            : await this.#repository.getCommentAsync(targetId);
        if (exists instanceof Failure) {
            return exists;
        }
        if (exists.data.authorId === user.id) {
            return Result.failure(AppError.FORBIDDEN); // 내 글에는 좋아요를 누르지 않는다
        }
        return this.#repository.toggleLikeAsync(request.targetType, targetId, user.id);
    }

    /** 신고: 쌓이면 자동으로 숨긴다 (선생님이 다시 보이게 할 수 있음) */
    async reportAsync(user, request) {
        const targetId = positiveId(request?.targetId);
        const reason = String(request?.reason ?? '').trim().slice(0, COMMUNITY_LIMITS.reasonMax);
        if (!TARGET_TYPES.has(request?.targetType) || !targetId || reason === '') {
            return Result.failure(AppError.INVALID_POST);
        }
        const reported = await this.#repository.reportAsync(request.targetType, targetId, user.id, reason, this.#clock());
        if (reported instanceof Failure) {
            return reported;
        }
        if (shouldAutoHide(reported.data)) {
            await this.#repository.setHiddenAsync(request.targetType, targetId, true);
        }
        return Result.success({ reports: reported.data, hidden: shouldAutoHide(reported.data) });
    }

    async setHiddenAsync(user, request) {
        const targetId = positiveId(request?.targetId);
        if (!this.#isTeacher(user)) {
            return Result.failure(AppError.FORBIDDEN);
        }
        if (!TARGET_TYPES.has(request?.targetType) || !targetId) {
            return Result.failure(AppError.INVALID_POST);
        }
        return this.#repository.setHiddenAsync(request.targetType, targetId, request.hidden === true);
    }
}
