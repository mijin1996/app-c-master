import { t } from '../i18n/index.js';

// 앱에서 생길 수 있는 실패 종류 (enum 역할)
// 데이터 실패는 Repository가, 규칙 실패는 Service가 만든다.
export const AppError = Object.freeze({
    // 데이터·통신 실패 (Repository)
    NOT_FOUND: 'NOT_FOUND',
    NETWORK: 'NETWORK',
    TIMEOUT: 'TIMEOUT',
    SERVER: 'SERVER',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',

    // 입력·규칙 실패 (Service)
    INVALID_USERNAME: 'INVALID_USERNAME',
    INVALID_PASSWORD: 'INVALID_PASSWORD',
    INVALID_NICKNAME: 'INVALID_NICKNAME',
    USERNAME_TAKEN: 'USERNAME_TAKEN',
    NICKNAME_TAKEN: 'NICKNAME_TAKEN',
    WRONG_CREDENTIALS: 'WRONG_CREDENTIALS',
    INVALID_RECOVERY_CODE: 'INVALID_RECOVERY_CODE',
    RECOVERY_MISMATCH: 'RECOVERY_MISMATCH',
    INVALID_PROGRESS: 'INVALID_PROGRESS',
    PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
    FEATURE_DISABLED: 'FEATURE_DISABLED',
    INVALID_HINT_REQUEST: 'INVALID_HINT_REQUEST',
    INVALID_RUN_REQUEST: 'INVALID_RUN_REQUEST',
    INVALID_POST: 'INVALID_POST',
    TOO_MANY_POSTS: 'TOO_MANY_POSTS',
});

/** 지금 고른 언어의 쉬운 문장 (글은 i18n/messages-*.js 의 error.* 에 한곳에만) (서버에서는 언어를 고르지 않으니 늘 한국어) */
export function messageOf(error) {
    const key = 'error.' + error;
    const text = t(key);
    return text === key ? t('error.unknown') : text;
}
