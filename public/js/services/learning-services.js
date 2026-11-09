// Service(화면 쪽): 랭킹, 선생님 화면, AI 힌트
import { Result } from '../core/result.js';
import { AppError } from '../core/app-error.js';

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
