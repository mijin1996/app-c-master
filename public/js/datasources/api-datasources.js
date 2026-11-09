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

/** 문제·퀴즈 콘텐츠 (정적 파일) */
export class StaticContentDataSource {
    #http;

    constructor(http) {
        this.#http = http;
    }

    loadAsync() {
        return this.#http.requestAsync('GET', '/data/content.json');
    }
}
