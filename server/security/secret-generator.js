// 무작위 비밀값 만들기: 세션 토큰, 복구 코드
import { RECOVERY_ALPHABET, RECOVERY_CODE_LENGTH } from '../../public/js/domain/account-rules.js';
import { toHex } from './password-hasher.js';

const SESSION_TOKEN_BYTES = 32;

export async function sha256Hex(text) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return toHex(digest);
}

export class SecretGenerator {
    newSessionToken() {
        return toHex(crypto.getRandomValues(new Uint8Array(SESSION_TOKEN_BYTES)));
    }

    /** 대문자·숫자 8자리 복구 코드 (예: K7Q29MXA) */
    newRecoveryCode() {
        const bytes = crypto.getRandomValues(new Uint8Array(RECOVERY_CODE_LENGTH));
        let code = '';
        for (const b of bytes) {
            code += RECOVERY_ALPHABET[b % RECOVERY_ALPHABET.length];
        }
        return code;
    }
}

/** 복구 코드는 서버 전체에서 찾아야 해서(아이디 찾기) 소금 없이 해시한다 */
export function hashRecoveryCodeAsync(normalizedCode) {
    return sha256Hex('recovery::' + normalizedCode);
}
