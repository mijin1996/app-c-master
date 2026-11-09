// API 엔드포인트 동작. functions/api/** 파일은 이 함수들을 그대로 연결만 한다.
// (Cloudflare Pages Functions 규칙: onRequestGet / onRequestPost 등)
import { Failure } from '../../public/js/core/result.js';
import { createContainer } from '../container.js';
import { SESSION_TTL_MS, publicUser } from '../services/auth-service.js';
import {
    json, failureResponse, resultResponse, readJsonAsync, readSessionToken, sessionCookie, clearSessionCookie,
} from './http.js';

const SESSION_MAX_AGE_SEC = Math.floor(SESSION_TTL_MS / 1000);

/** 예상 못 한 오류도 JSON으로 돌려준다 */
function guard(handler) {
    return async (context) => {
        try {
            const container = context.container ?? createContainer(context.env);
            return await handler(context, container);
        } catch (e) {
            console.error(e);
            return json({ error: 'SERVER', message: '서버에 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.' }, 500);
        }
    };
}

/** 로그인한 회원이 있어야 하는 API */
function authed(handler) {
    return guard(async (context, container) => {
        const current = await container.auth.currentUserAsync(readSessionToken(context.request));
        if (current instanceof Failure) {
            return failureResponse(current);
        }
        return handler(context, container, current.data);
    });
}

async function bodyOf(context) {
    return readJsonAsync(context.request);
}

export const signup = guard(async (context, container) => {
    const read = await bodyOf(context);
    if (read instanceof Failure) {
        return failureResponse(read);
    }
    const result = await container.auth.signupAsync(read.data.body);
    if (result instanceof Failure) {
        return failureResponse(result);
    }
    const { token, ...rest } = result.data;
    return json(rest, 201, { 'set-cookie': sessionCookie(token, SESSION_MAX_AGE_SEC) });
});

export const login = guard(async (context, container) => {
    const read = await bodyOf(context);
    if (read instanceof Failure) {
        return failureResponse(read);
    }
    const result = await container.auth.loginAsync(read.data.body);
    if (result instanceof Failure) {
        return failureResponse(result);
    }
    return json({ user: result.data.user }, 200, { 'set-cookie': sessionCookie(result.data.token, SESSION_MAX_AGE_SEC) });
});

export const logout = guard(async (context, container) => {
    await container.auth.logoutAsync(readSessionToken(context.request));
    return json({ ok: true }, 200, { 'set-cookie': clearSessionCookie() });
});

export const me = authed(async (context, container, user) => {
    return json({ user: publicUser(user, container.auth.isTeacher(user)), features: { aiHint: container.hint.enabled } });
});

export const changeNickname = authed(async (context, container, user) => {
    const read = await bodyOf(context);
    if (read instanceof Failure) {
        return failureResponse(read);
    }
    return resultResponse(await container.auth.changeNicknameAsync(user, read.data.body.nickname));
});

export const findUsernames = guard(async (context, container) => {
    const read = await bodyOf(context);
    if (read instanceof Failure) {
        return failureResponse(read);
    }
    const result = await container.auth.findUsernamesAsync(read.data.body.code);
    return result instanceof Failure ? failureResponse(result) : json({ usernames: result.data });
});

export const resetPassword = guard(async (context, container) => {
    const read = await bodyOf(context);
    if (read instanceof Failure) {
        return failureResponse(read);
    }
    return resultResponse(await container.auth.resetPasswordAsync(read.data.body));
});

export const renewRecoveryCode = authed(async (context, container, user) => {
    return resultResponse(await container.auth.renewRecoveryCodeAsync(user));
});

export const getProgress = authed(async (context, container, user) => {
    return resultResponse(await container.progress.loadAsync(user));
});

export const putProgress = authed(async (context, container, user) => {
    const read = await bodyOf(context);
    if (read instanceof Failure) {
        return failureResponse(read);
    }
    return resultResponse(await container.progress.saveAsync(user, read.data.body, read.data.bytes));
});

export const ranking = authed(async (context, container, user) => {
    const result = await container.ranking.listAsync(user);
    return result instanceof Failure ? failureResponse(result) : json({ entries: result.data });
});

export const teacherStudents = authed(async (context, container, user) => {
    const result = await container.teacher.listStudentsAsync(user);
    return result instanceof Failure ? failureResponse(result) : json({ students: result.data });
});

export const hint = authed(async (context, container) => {
    const read = await bodyOf(context);
    if (read instanceof Failure) {
        return failureResponse(read);
    }
    const result = await container.hint.requestHintAsync(read.data.body);
    return result instanceof Failure ? failureResponse(result) : json({ hint: result.data });
});
