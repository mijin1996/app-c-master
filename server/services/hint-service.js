// Service: AI 힌트 요청 규칙 (입력 검사 + 프롬프트 만들기)
// 기능이 꺼져 있으면 FEATURE_DISABLED. 정답 코드를 주지 않도록 프롬프트에서 막는다.
import { Result } from '../../public/js/core/result.js';
import { AppError } from '../../public/js/core/app-error.js';

const MAX_CODE_CHARS = 8000;
const MAX_FIELD_CHARS = 2000;

const cut = (value, max) => String(value ?? '').slice(0, max);

export function buildHintPrompt(request, tutorName) {
    const numbered = cut(request.code, MAX_CODE_CHARS).split('\n').map((line, i) => (i + 1) + ': ' + line).join('\n');
    return '너는 C언어를 처음 배우는 학생을 돕는 친절한 튜터 캐릭터 "' + tutorName + '"야.\n'
        + '규칙: 정답 코드나 고친 코드 전체를 절대 보여주지 마. 코드는 꼭 필요할 때 한 줄 이하만. 한국어 존댓말로 3~5문장. '
        + '문제가 있는 줄 번호를 짚고, 무엇이 왜 틀렸는지와 무엇을 확인하면 되는지 방향만 알려줘. 마크다운 기호 없이 평범한 문장으로.\n\n'
        + '[문제]\n' + cut(request.title, 200) + '\n' + cut(request.description, MAX_FIELD_CHARS)
        + '\n입력: ' + cut(request.inputSpec, MAX_FIELD_CHARS) + '\n출력: ' + cut(request.outputSpec, MAX_FIELD_CHARS)
        + '\n\n[학생 코드]\n' + numbered + '\n\n[채점 결과]\n' + cut(request.judgeResult, MAX_FIELD_CHARS);
}

export class HintService {
    #provider;
    #enabled;

    /**
     * @param {{getHintAsync: (prompt: string) => Promise<Result>}} provider
     * @param {boolean} enabled
     */
    constructor(provider, enabled) {
        this.#provider = provider;
        this.#enabled = enabled;
    }

    get enabled() {
        return this.#enabled;
    }

    async requestHintAsync(request) {
        if (!this.#enabled) {
            return Result.failure(AppError.FEATURE_DISABLED);
        }
        if (!request || typeof request.code !== 'string' || request.code.trim() === '' || !request.title) {
            return Result.failure(AppError.INVALID_HINT_REQUEST);
        }
        return this.#provider.getHintAsync(buildHintPrompt(request, cut(request.tutorName || '코디', 8)));
    }
}
