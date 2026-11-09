// 비밀번호 해시 (PBKDF2-SHA256). 원래 비밀번호는 어디에도 저장하지 않는다.
// 저장 형식: pbkdf2$반복횟수$소금(hex)$해시(hex)
// Cloudflare Workers의 PBKDF2는 반복 횟수 100,000이 최대다.

const ITERATIONS = 100000;
const SALT_BYTES = 16;
const HASH_BITS = 256;

export function toHex(bytes) {
    return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex) {
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) {
        out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return out;
}

/** 길이가 같은 두 문자열을 시간 차이 없이 비교 */
export function safeEqual(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
        diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
}

export class Pbkdf2PasswordHasher {
    #iterations;

    constructor(iterations = ITERATIONS) {
        this.#iterations = iterations;
    }

    async #deriveAsync(password, salt, iterations) {
        const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
        const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, HASH_BITS);
        return toHex(bits);
    }

    async hashAsync(password) {
        const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
        const hash = await this.#deriveAsync(password, salt, this.#iterations);
        return ['pbkdf2', this.#iterations, toHex(salt), hash].join('$');
    }

    async verifyAsync(password, stored) {
        const parts = String(stored).split('$');
        if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
            return false;
        }
        const hash = await this.#deriveAsync(password, fromHex(parts[2]), Number(parts[1]));
        return safeEqual(hash, parts[3]);
    }
}
