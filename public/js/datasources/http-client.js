// DataSource 공용: 서버 API와 통신하는 HTTP 클라이언트
// 응답을 해석하지 않고 {status, body} 그대로 돌려준다. 통신 자체가 실패하면 예외가 난다.
const TIMEOUT_MS = 15000;

export class FetchHttpClient {
    #baseUrl;
    #fetch;
    #timeoutMs;

    constructor(baseUrl = '', fetchFn = (...args) => globalThis.fetch(...args), timeoutMs = TIMEOUT_MS) {
        this.#baseUrl = baseUrl;
        this.#fetch = fetchFn;
        this.#timeoutMs = timeoutMs;
    }

    async requestAsync(method, path, body) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.#timeoutMs);
        try {
            const response = await this.#fetch(this.#baseUrl + path, {
                method,
                credentials: 'same-origin',
                signal: controller.signal,
                headers: body === undefined ? {} : { 'content-type': 'application/json' },
                body: body === undefined ? undefined : JSON.stringify(body),
            });
            const text = await response.text();
            let parsed = null;
            try {
                parsed = text ? JSON.parse(text) : null;
            } catch (e) {
                parsed = null;
            }
            return { status: response.status, body: parsed };
        } finally {
            clearTimeout(timer);
        }
    }
}
