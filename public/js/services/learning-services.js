// Service(화면 쪽): 랭킹, 선생님 화면, AI 힌트
import { Result } from '../core/result.js';
import { AppError } from '../core/app-error.js';
import { validateProblemDraft, validateComment } from '../domain/community-rules.js';

export class RankingService {
    #repository;

    constructor(repository) {
        this.#repository = repository;
    }

    listAsync() {
        return this.#repository.listAsync();
    }
}

export class TeacherService {
    #repository;
    #authService;

    constructor(repository, authService) {
        this.#repository = repository;
        this.#authService = authService;
    }

    get isTeacher() {
        return this.#authService.user?.isTeacher === true;
    }

    async listStudentsAsync() {
        if (!this.isTeacher) {
            return Result.failure(AppError.FORBIDDEN);
        }
        return this.#repository.listStudentsAsync();
    }
}

/**
 * AI 힌트. 화면 설정(FEATURES.aiHint)과 서버 설정(features.aiHint)이 둘 다 켜져야 보인다.
 * 지금은 FEATURES.aiHint = false 라서 버튼이 숨겨져 있다.
 */
export class HintService {
    #repository;
    #clientEnabled;
    #authService;

    constructor(repository, clientEnabled, authService) {
        this.#repository = repository;
        this.#clientEnabled = clientEnabled;
        this.#authService = authService;
    }

    get enabled() {
        return this.#clientEnabled && this.#authService.serverFeatures.aiHint === true;
    }

    async requestHintAsync(problem, code, judgeResultText, tutorName) {
        if (!this.enabled) {
            return Result.failure(AppError.FEATURE_DISABLED);
        }
        return this.#repository.requestAsync({
            title: problem.title,
            description: problem.desc,
            inputSpec: problem.input,
            outputSpec: problem.output,
            code,
            judgeResult: judgeResultText,
            tutorName,
        });
    }
}

/** 커뮤니티 (화면 쪽): 보내기 전에 같은 규칙으로 먼저 검사해서 바로 알려 준다. 진짜 검사는 서버가 다시 한다 */
export class CommunityService {
    #repository;

    constructor(repository) {
        this.#repository = repository;
    }

    listAsync(sort = 'new', page = 0) {
        return this.#repository.listAsync(sort, page);
    }

    getAsync(id) {
        return this.#repository.getAsync(id);
    }

    createAsync(draft) {
        const checked = validateProblemDraft(draft);
        if (!checked.ok) {
            return Promise.resolve(Result.failure(AppError.INVALID_POST, checked.message));
        }
        return this.#repository.createAsync(checked.problem);
    }

    commentAsync(problemId, body) {
        const checked = validateComment(body);
        if (!checked.ok) {
            return Promise.resolve(Result.failure(AppError.INVALID_POST, checked.message));
        }
        return this.#repository.actAsync('comment', { problemId, body: checked.body });
    }

    likeAsync(targetType, targetId) {
        return this.#repository.actAsync('like', { targetType, targetId });
    }

    acceptAsync(commentId) {
        return this.#repository.actAsync('accept', { commentId });
    }

    reportAsync(targetType, targetId, reason) {
        return this.#repository.actAsync('report', { targetType, targetId, reason });
    }

    hideAsync(targetType, targetId, hidden) {
        return this.#repository.actAsync('hide', { targetType, targetId, hidden });
    }

    deleteAsync(id) {
        return this.#repository.actAsync('delete', { id });
    }
}

/** 회원이 낸 문제를 채점기가 쓰는 문제 모양으로 바꾼다 (tests: 입력, expected: 정답 출력) */
export function judgeableOf(problem) {
    return {
        tests: problem.tests.map((t) => t.input),
        expected: problem.tests.map((t) => ({ out: t.output })),
    };
}
