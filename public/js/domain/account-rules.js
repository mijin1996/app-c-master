// 계정 입력 규칙 (화면과 서버가 같은 규칙으로 검사한다)

export const USERNAME_PATTERN = /^[a-z0-9_]{3,16}$/;
export const PASSWORD_MIN = 4;
export const PASSWORD_MAX = 64;
export const NICKNAME_MAX = 12;
export const RECOVERY_CODE_LENGTH = 8;
// 헷갈리는 글자(0/O, 1/I/L)를 뺀 32자
export const RECOVERY_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function isValidUsername(value) {
    return typeof value === 'string' && USERNAME_PATTERN.test(value);
}

export function isValidPassword(value) {
    return typeof value === 'string' && value.length >= PASSWORD_MIN && value.length <= PASSWORD_MAX;
}

/** 공백 정리 후 닉네임. 비었으면 아이디, 너무 길면 null */
export function normalizeNickname(value, username) {
    const trimmed = String(value ?? '').trim();
    if (trimmed.length === 0) {
        return username;
    }
    return trimmed.length <= NICKNAME_MAX ? trimmed : null;
}

/** 입력한 복구 코드를 대문자 8자리로 정리. 형식이 틀리면 null */
export function normalizeRecoveryCode(value) {
    const cleaned = String(value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    return cleaned.length === RECOVERY_CODE_LENGTH ? cleaned : null;
}

/** 'K7Q29MXA' → 'K7Q2-9MXA' (보여 주기용) */
export function formatRecoveryCode(code) {
    return code.slice(0, 4) + '-' + code.slice(4);
}
