// AI 힌트 제공자 (전략 패턴: 같은 모양의 객체를 갈아 끼운다)
// - DisabledHintProvider: 지금 쓰는 것. 항상 "준비 중"을 돌려준다.
// - AnthropicHintProvider: 나중에 API 키를 넣으면 켜지는 Claude API 연결.
// 새 AI 서비스를 붙이려면 getHintAsync(prompt) 를 가진 클래스를 하나 더 만들면 된다.
import { Result } from '../../public/js/core/result.js';
import { AppError } from '../../public/js/core/app-error.js';
import { failedResponse, failedRequest } from '../http/outbound-failures.js';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const MAX_TOKENS = 400;
const TIMEOUT_MS = 15000;

export class DisabledHintProvider {
    async getHintAsync() {
        return Result.failure(AppError.FEATURE_DISABLED);
    }
}

export class AnthropicHintProvider {
    #apiKey;
    #model;
    #fetch;

    constructor(apiKey, model, fetchFn = fetch) {
        this.#apiKey = apiKey;
        this.#model = model;
        this.#fetch = fetchFn;
    }

    async getHintAsync(prompt) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        try {
            const response = await this.#fetch(ANTHROPIC_URL, {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    'content-type': 'application/json',
                    'x-api-key': this.#apiKey,
                    'anthropic-version': ANTHROPIC_VERSION,
                },
                body: JSON.stringify({
                    model: this.#model,
                    max_tokens: MAX_TOKENS,
                    messages: [{ role: 'user', content: prompt }],
                }),
            });
            if (!response.ok) {
                return failedResponse(response);
            }
            const body = await response.json();
            const text = (body.content ?? []).filter((c) => c.type === 'text').map((c) => c.text).join('').trim();
            return text ? Result.success(text) : Result.failure(AppError.SERVER);
        } catch (e) {
            return failedRequest(e);
        } finally {
            clearTimeout(timer);
        }
    }
}
