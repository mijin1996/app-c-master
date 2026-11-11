// 바깥 서비스(AI 힌트 · 채점 서버)를 부르다 실패했을 때의 Result. 힌트 · 채점 연결이 같은 규칙을 쓴다.
import { Result } from '../../public/js/core/result.js';
import { AppError } from '../../public/js/core/app-error.js';

const SERVER_ERROR_FROM = 500;

/** 응답은 왔지만 성공이 아님: 5xx 는 상대 서버 고장, 나머지는 통신 문제 */
export function failedResponse(response) {
    return Result.failure(response.status >= SERVER_ERROR_FROM ? AppError.SERVER : AppError.NETWORK);
}

/** 응답이 오기 전에 실패: 시간 초과(AbortError)는 TIMEOUT, 나머지는 NETWORK */
export function failedRequest(error) {
    return Result.failure(error && error.name === 'AbortError' ? AppError.TIMEOUT : AppError.NETWORK);
}
