// DataSource: 서버 API 주소와 직접 통신하는 클래스들 (응답 DTO를 그대로 돌려준다)

export class AuthApiDataSource {
    #http;

    constructor(http) {
        this.#http = http;
    }

    signupAsync(dto) {
        return this.#http.requestAsync('POST', '/api/auth/signup', dto);
    }

    loginAsync(dto) {
        return this.#http.requestAsync('POST', '/api/auth/login', dto);
    }

    logoutAsync() {
        return this.#http.requestAsync('POST', '/api/auth/logout', {});
    }

    meAsync() {
        return this.#http.requestAsync('GET', '/api/auth/me');
    }

    findUsernameAsync(code) {
        return this.#http.requestAsync('POST', '/api/auth/find-username', { code });
    }

    resetPasswordAsync(dto) {
        return this.#http.requestAsync('POST', '/api/auth/reset-password', dto);
    }

    renewRecoveryCodeAsync() {
        return this.#http.requestAsync('POST', '/api/auth/recovery-code', {});
    }

    changeNicknameAsync(nickname) {
        return this.#http.requestAsync('POST', '/api/auth/nickname', { nickname });
    }
}

export class VisitApiDataSource {
    #http;

    constructor(http) {
        this.#http = http;
    }

    recordAsync() {
        return this.#http.requestAsync('POST', '/api/visits', {});
    }

    todayAsync() {
        return this.#http.requestAsync('GET', '/api/visits');
    }
}

export class ProgressApiDataSource {
    #http;

    constructor(http) {
        this.#http = http;
    }

    getAsync() {
        return this.#http.requestAsync('GET', '/api/progress');
    }

    putAsync(dto) {
        return this.#http.requestAsync('PUT', '/api/progress', dto);
    }
}

export class RankingApiDataSource {
    #http;

    constructor(http) {
        this.#http = http;
    }

    listAsync() {
        return this.#http.requestAsync('GET', '/api/ranking');
    }

    listStudentsAsync() {
        return this.#http.requestAsync('GET', '/api/teacher/students');
    }
}

export class HintApiDataSource {
    #http;

    constructor(http) {
        this.#http = http;
    }

    requestAsync(dto) {
        return this.#http.requestAsync('POST', '/api/hint', dto);
    }
}

/** 커뮤니티 API */
export class CommunityApiDataSource {
    #http;

    constructor(http) {
        this.#http = http;
    }

    listAsync(sort, page) {
        return this.#http.requestAsync('GET', '/api/community/problems?sort=' + encodeURIComponent(sort) + '&page=' + Number(page));
    }

    getAsync(id) {
        return this.#http.requestAsync('GET', '/api/community/problem?id=' + Number(id));
    }

    createAsync(draft) {
        return this.#http.requestAsync('POST', '/api/community/problems', draft);
    }

    postAsync(action, body) {
        return this.#http.requestAsync('POST', '/api/community/' + action, body);
    }
}

/** 유료 언어(C++ · Java) 서버 실행 */
export class CodeRunApiDataSource {
    #http;

    constructor(http) {
        this.#http = http;
    }

    runAsync(dto) {
        return this.#http.requestAsync('POST', '/api/run', dto);
    }
}

/** 문제·퀴즈 콘텐츠 (정적 파일) */
// 파일 이름에 붙는 언어 꼬리표 (모르는 값이면 한국어 원본)
const suffixOf = (locale) => (locale === 'en' || locale === 'zh' ? '.' + locale : '');

export class StaticContentDataSource {
    #http;

    constructor(http) {
        this.#http = http;
    }

    /** 한국어는 content.json, 다른 언어는 content.en.json 처럼 (tools/build-i18n.mjs 가 만든 파일) */
    loadAsync(locale = 'ko') {
        return this.#http.requestAsync('GET', '/data/content' + suffixOf(locale) + '.json');
    }

    /** 객체지향 레슨 · 퀴즈 (tools/build-oop.mjs · build-i18n.mjs 가 만든 파일) */
    loadOopAsync(locale = 'ko') {
        return this.#http.requestAsync('GET', '/data/oop' + suffixOf(locale) + '.json');
    }
}
