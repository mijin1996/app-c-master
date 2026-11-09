// Service: 서버에서 코드 실행하기 (유료 언어용). 입력을 검사하고 제공자에게 넘긴다.
// 결제 기능이 생기면 여기서 "이 회원이 유료 언어를 쓸 수 있는지"를 확인한다.
import { Result } from '../../public/js/core/result.js';
import { AppError } from '../../public/js/core/app-error.js';
import { languageOf, isLanguageId } from '../../public/js/domain/languages.js';

const MAX_SOURCE_CHARS = 20000;
const MAX_INPUT_CHARS = 2000000;

export class CodeRunService {
    #provider;
    #enabled;

    constructor(provider, enabled) {
        this.#provider = provider;
        this.#enabled = enabled;
    }

    get enabled() {
        return this.#enabled;
    }

    async runAsync(request) {
        if (!this.#enabled) {
            return Result.failure(AppError.FEATURE_DISABLED);
        }
        const language = request?.language;
        if (!isLanguageId(language) || languageOf(language).runtime !== 'server'
            || typeof request.src !== 'string' || request.src.length === 0 || request.src.length > MAX_SOURCE_CHARS
            || typeof (request.input ?? '') !== 'string' || (request.input ?? '').length > MAX_INPUT_CHARS) {
            return Result.failure(AppError.INVALID_RUN_REQUEST);
        }
        return this.#provider.runAsync(language, request.src, request.input ?? '');
    }
}
