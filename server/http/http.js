// HTTP 도우미: JSON 응답, 실패 → 상태 코드, 세션 쿠키, 요청 본문 읽기
import { Result, Failure } from '../../public/js/core/result.js';
import { AppError, messageOf } from '../../public/js/core/app-error.js';

export const SESSION_COOKIE = 'cm_session';
const MAX_BODY_BYTES = 600 * 1024;

const STATUS_BY_ERROR = Object.freeze({
    [AppError.UNAUTHORIZED]: 401,
    [AppError.WRONG_CREDENTIALS]: 401,
    [AppError.FORBIDDEN]: 403,
    [AppError.NOT_FOUND]: 404,
    [AppError.USERNAME_TAKEN]: 409,
    [AppError.NICKNAME_TAKEN]: 409,
    [AppError.PAYLOAD_TOO_LARGE]: 413,
    [AppError.TOO_MANY_POSTS]: 429,
    [AppError.FEATURE_DISABLED]: 503,
    [AppError.SERVER]: 500,
    [AppError.NETWORK]: 502,
    [AppError.TIMEOUT]: 504,
});

export function statusOf(error) {
    return STATUS_BY_ERROR[error] ?? 400;
}

export function json(data, status = 200, headers = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
    });
}

/** Failure → {error, message} JSON 응답 */
export function failureResponse(failure) {
    return json({ error: failure.error, message: messageOf(failure.error), detail: failure.detail }, statusOf(failure.error));
}

/** Result → 성공이면 data, 실패면 오류 응답 */
export function resultResponse(result, status = 200, headers = {}) {
    return result instanceof Failure ? failureResponse(result) : json(result.data, status, headers);
}

export function readSessionToken(request) {
    const header = request.headers.get('cookie') ?? '';
    for (const part of header.split(';')) {
        const [name, ...rest] = part.trim().split('=');
        if (name === SESSION_COOKIE) {
            return rest.join('=') || null;
        }
    }
    return null;
}

export function sessionCookie(token, maxAgeSec) {
    return SESSION_COOKIE + '=' + token + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' + maxAgeSec;
}

export function clearSessionCookie() {
    return SESSION_COOKIE + '=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}

/** 본문 JSON 읽기. 크기 초과나 형식 오류는 Failure */
export async function readJsonAsync(request) {
    const text = await request.text();
    const bytes = new TextEncoder().encode(text).length;
    if (bytes > MAX_BODY_BYTES) {
        return Result.failure(AppError.PAYLOAD_TOO_LARGE);
    }
    try {
        return Result.success({ body: text ? JSON.parse(text) : {}, bytes });
    } catch (e) {
        return Result.failure(AppError.INVALID_PROGRESS);
    }
}
