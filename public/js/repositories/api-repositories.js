// Repository(화면 쪽): DataSource의 응답을 Result로 바꾸고, DTO를 Model로 바꾼다.
// 통신 실패(예외)는 여기서 NETWORK / TIMEOUT 실패로 바꿔서 위로 예외가 새지 않게 한다.
import { Result, Success, Failure } from '../core/result.js';
import { AppError } from '../core/app-error.js';
import { progressFromDto, progressToDto } from '../mappers/progress-mapper.js';
import { contentFromDto } from '../mappers/content-mapper.js';
import { oopLessonsFromDto } from '../mappers/oop-content-mapper.js';
import { isDayKey } from '../domain/visit-rules.js';

const ERROR_BY_STATUS = Object.freeze({ 401: AppError.UNAUTHORIZED, 403: AppError.FORBIDDEN, 404: AppError.NOT_FOUND, 413: AppError.PAYLOAD_TOO_LARGE, 503: AppError.FEATURE_DISABLED });

function failureOf(response) {
    const known = response.body && AppError[response.body.error];
    return Result.failure(known ?? ERROR_BY_STATUS[response.status] ?? AppError.SERVER, response.body?.detail ?? null);
}

/** 요청을 보내고, 2xx면 pick(body)를 Success로, 아니면 Failure로 */
async function call(requestAsync, pick = (body) => body) {
    try {
        const response = await requestAsync();
        if (response.status >= 200 && response.status < 300) {
            return Result.success(pick(response.body ?? {}));
        }
        return failureOf(response);
    } catch (e) {
        return Result.failure(e && e.name === 'AbortError' ? AppError.TIMEOUT : AppError.NETWORK);
    }
}

/** 회원 모델: 화면에서 쓰는 모양 */
export function userFromDto(dto) {
    return Object.freeze({
        username: String(dto?.username ?? ''),
        nickname: String(dto?.nickname ?? dto?.username ?? ''),
        isTeacher: dto?.isTeacher === true,
    });
}

export class AuthRepository {
    #source;

    constructor(source) {
        this.#source = source;
    }

    signupAsync(dto) {
        return call(() => this.#source.signupAsync(dto), (b) => ({ user: userFromDto(b.user), recoveryCode: String(b.recoveryCode ?? '') }));
    }

    loginAsync(dto) {
        return call(() => this.#source.loginAsync(dto), (b) => ({ user: userFromDto(b.user) }));
    }

    logoutAsync() {
        return call(() => this.#source.logoutAsync(), () => true);
    }

    meAsync() {
        return call(() => this.#source.meAsync(), (b) => ({ user: userFromDto(b.user), features: { aiHint: b.features?.aiHint === true, paidLanguages: b.features?.paidLanguages === true } }));
    }

    findUsernamesAsync(code) {
        return call(() => this.#source.findUsernameAsync(code), (b) => (Array.isArray(b.usernames) ? b.usernames.map(String) : []));
    }

    resetPasswordAsync(dto) {
        return call(() => this.#source.resetPasswordAsync(dto), (b) => ({ recoveryCode: String(b.recoveryCode ?? '') }));
    }

    renewRecoveryCodeAsync() {
        return call(() => this.#source.renewRecoveryCodeAsync(), (b) => ({ recoveryCode: String(b.recoveryCode ?? '') }));
    }

    changeNicknameAsync(nickname) {
        return call(() => this.#source.changeNicknameAsync(nickname), (b) => userFromDto(b));
    }
}

export class ProgressRepository {
    #source;

    constructor(source) {
        this.#source = source;
    }

    loadAsync() {
        return call(() => this.#source.getAsync(), (b) => ({ progress: progressFromDto(b.progress) }));
    }

    saveAsync(progress) {
        return call(() => this.#source.putAsync(progressToDto(progress)), (b) => ({ summary: b.summary ?? null }));
    }
}

export class RankingRepository {
    #source;

    constructor(source) {
        this.#source = source;
    }

    listAsync() {
        return call(() => this.#source.listAsync(), (b) => (Array.isArray(b.entries) ? b.entries : []));
    }

    listStudentsAsync() {
        return call(() => this.#source.listStudentsAsync(), (b) => (Array.isArray(b.students) ? b.students : []));
    }
}

export class HintRepository {
    #source;

    constructor(source) {
        this.#source = source;
    }

    requestAsync(dto) {
        return call(() => this.#source.requestAsync(dto), (b) => String(b.hint ?? ''));
    }
}

/** 커뮤니티: 응답 → Result */
export class CommunityRepository {
    #source;

    constructor(source) {
        this.#source = source;
    }

    listAsync(sort, page) {
        return call(() => this.#source.listAsync(sort, page), (b) => (Array.isArray(b.problems) ? b.problems : []));
    }

    getAsync(id) {
        return call(() => this.#source.getAsync(id));
    }

    createAsync(draft) {
        return call(() => this.#source.createAsync(draft), (b) => Number(b.id));
    }

    actAsync(action, body) {
        return call(() => this.#source.postAsync(action, body));
    }
}

/** 서버 실행 결과 → Result<{ok, output, kind?, message?}> */
export class CodeRunRepository {
    #source;

    constructor(source) {
        this.#source = source;
    }

    runAsync(language, src, input) {
        return call(() => this.#source.runAsync({ language, src, input }), (b) => ({
            ok: b.result?.ok === true,
            output: String(b.result?.output ?? ''),
            kind: b.result?.kind,
            message: b.result?.message,
            files: {},
        }));
    }
}

/** 하루 접속 수: { day, count } 모양만 믿는다 */
const visitFromDto = (b) => ({ day: isDayKey(b?.day) ? b.day : '', count: Math.max(0, Math.floor(Number(b?.count) || 0)) });

export class VisitRepository {
    #source;

    constructor(source) {
        this.#source = source;
    }

    recordAsync() {
        return call(() => this.#source.recordAsync(), visitFromDto);
    }

    todayAsync() {
        return call(() => this.#source.todayAsync(), visitFromDto);
    }
}

const BASE_LOCALE = 'ko';

export class ContentRepository {
    #source;
    #cache = new Map();     // 언어 → 단원 · 알고리즘
    #oopCache = new Map();  // 언어 → 객체지향 레슨

    constructor(source) {
        this.#source = source;
    }

    /** 그 언어 파일을 받고, 없으면(404) 한국어 원본으로 대신한다. 성공한 것은 언어별로 기억 */
    async #loadAsync(cache, locale, fetchAsync, pick, accept) {
        if (cache.has(locale)) {
            return Result.success(cache.get(locale));
        }
        let loaded = await call(() => fetchAsync(locale), pick);
        if (loaded instanceof Failure && loaded.error === AppError.NOT_FOUND && locale !== BASE_LOCALE) {
            loaded = await this.#loadAsync(cache, BASE_LOCALE, fetchAsync, pick, accept);
        }
        if (loaded instanceof Success && accept(loaded.data)) {
            cache.set(locale, loaded.data);
        }
        return loaded;
    }

    /** 단원과 알고리즘 단계 (지금 언어) */
    loadAsync(locale = BASE_LOCALE) {
        return this.#loadAsync(this.#cache, locale, (l) => this.#source.loadAsync(l), contentFromDto, () => true);
    }

    /** 객체지향 레슨 목록 (지금 언어). 처음 객체지향 화면을 열 때 받는다 */
    loadOopAsync(locale = BASE_LOCALE) {
        return this.#loadAsync(this.#oopCache, locale, (l) => this.#source.loadOopAsync(l), oopLessonsFromDto, (lessons) => lessons.length > 0);
    }
}
