// 서버 채점 제공자 (전략 패턴). 유료 언어(C++ · Java)는 브라우저에서 못 돌려서 채점 서버가 필요하다.
// - DisabledJudgeProvider: 지금 쓰는 것. 항상 "준비 중".
// - Judge0JudgeProvider: Judge0(오픈소스 채점 서버)를 VPS에 설치한 뒤 주소를 넣으면 켜진다.
import { Result } from '../../public/js/core/result.js';
import { AppError } from '../../public/js/core/app-error.js';

const TIMEOUT_MS = 20000;
const CPU_TIME_LIMIT_SEC = 3;
// Judge0 언어 번호 (Judge0 CE 기준). 설치한 버전에 따라 다르면 여기만 고친다.
export const JUDGE0_LANGUAGE_ID = Object.freeze({ cpp: 54, java: 62 });
// Judge0 상태 번호 → 우리 실행 결과 종류
const STATUS_KIND = Object.freeze({ 5: 'tle', 6: 'compile', 7: 'runtime', 8: 'runtime', 9: 'runtime', 10: 'runtime', 11: 'runtime', 12: 'runtime' });
const STATUS_ACCEPTED_RUN = 3;

export class DisabledJudgeProvider {
    async runAsync() {
        return Result.failure(AppError.FEATURE_DISABLED);
    }
}

export class Judge0JudgeProvider {
    #baseUrl;
    #apiKey;
    #fetch;

    constructor(baseUrl, apiKey, fetchFn = fetch) {
        this.#baseUrl = baseUrl.replace(/\/+$/, '');
        this.#apiKey = apiKey;
        this.#fetch = fetchFn;
    }

    async runAsync(language, src, input) {
        const languageId = JUDGE0_LANGUAGE_ID[language];
        if (!languageId) {
            return Result.failure(AppError.INVALID_RUN_REQUEST);
        }
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        try {
            const response = await this.#fetch(this.#baseUrl + '/submissions?base64_encoded=false&wait=true', {
                method: 'POST',
                signal: controller.signal,
                headers: { 'content-type': 'application/json', ...(this.#apiKey ? { 'X-Auth-Token': this.#apiKey } : {}) },
                body: JSON.stringify({ language_id: languageId, source_code: src, stdin: input, cpu_time_limit: CPU_TIME_LIMIT_SEC }),
            });
            if (!response.ok) {
                return Result.failure(response.status >= 500 ? AppError.SERVER : AppError.NETWORK);
            }
            const body = await response.json();
            const statusId = body.status?.id;
            if (statusId === STATUS_ACCEPTED_RUN) {
                return Result.success({ ok: true, output: body.stdout ?? '', files: {} });
            }
            const kind = STATUS_KIND[statusId] ?? 'runtime';
            const message = kind === 'compile' ? (body.compile_output ?? '컴파일 에러') : (body.stderr || body.status?.description || '실행 중 오류');
            return Result.success({ ok: false, kind, message: String(message).slice(0, 2000), output: body.stdout ?? '' });
        } catch (e) {
            return Result.failure(e && e.name === 'AbortError' ? AppError.TIMEOUT : AppError.NETWORK);
        } finally {
            clearTimeout(timer);
        }
    }
}
