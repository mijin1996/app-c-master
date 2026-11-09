// Cloudflare Worker 입구. 지금 사이트(app-c-master.*.workers.dev)는 Pages 가 아니라 Worker 로 배포돼서
// functions/ 폴더(Pages Functions)를 Cloudflare 가 알아서 실행해 주지 않는다.
// 그래서 여기서 /api/** 주소를 functions/ 의 처리기로 직접 안내하고, 나머지 주소는 정적 파일(public/)로 보낸다.
// 처리기 코드는 그대로 쓰므로 Pages 로 옮겨도, Worker 로 두어도 똑같이 동작한다.
import * as authFindUsername from '../functions/api/auth/find-username.js';
import * as authLogin from '../functions/api/auth/login.js';
import * as authLogout from '../functions/api/auth/logout.js';
import * as authMe from '../functions/api/auth/me.js';
import * as authNickname from '../functions/api/auth/nickname.js';
import * as authRecoveryCode from '../functions/api/auth/recovery-code.js';
import * as authResetPassword from '../functions/api/auth/reset-password.js';
import * as authSignup from '../functions/api/auth/signup.js';
import * as communityAccept from '../functions/api/community/accept.js';
import * as communityComment from '../functions/api/community/comment.js';
import * as communityDelete from '../functions/api/community/delete.js';
import * as communityHide from '../functions/api/community/hide.js';
import * as communityLike from '../functions/api/community/like.js';
import * as communityProblem from '../functions/api/community/problem.js';
import * as communityProblems from '../functions/api/community/problems.js';
import * as communityReport from '../functions/api/community/report.js';
import * as hint from '../functions/api/hint.js';
import * as progress from '../functions/api/progress.js';
import * as ranking from '../functions/api/ranking.js';
import * as run from '../functions/api/run.js';
import * as teacherStudents from '../functions/api/teacher/students.js';
import * as visits from '../functions/api/visits.js';
import { json } from './http/http.js';

// 주소 → 처리기 모듈 (functions/api 에 파일을 추가하면 여기에도 한 줄. 빠지면 테스트가 알려 준다)
export const API_ROUTES = Object.freeze({
    '/api/auth/find-username': authFindUsername,
    '/api/auth/login': authLogin,
    '/api/auth/logout': authLogout,
    '/api/auth/me': authMe,
    '/api/auth/nickname': authNickname,
    '/api/auth/recovery-code': authRecoveryCode,
    '/api/auth/reset-password': authResetPassword,
    '/api/auth/signup': authSignup,
    '/api/community/accept': communityAccept,
    '/api/community/comment': communityComment,
    '/api/community/delete': communityDelete,
    '/api/community/hide': communityHide,
    '/api/community/like': communityLike,
    '/api/community/problem': communityProblem,
    '/api/community/problems': communityProblems,
    '/api/community/report': communityReport,
    '/api/hint': hint,
    '/api/progress': progress,
    '/api/ranking': ranking,
    '/api/run': run,
    '/api/teacher/students': teacherStudents,
    '/api/visits': visits,
});

const METHODS = Object.freeze(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
const handlerName = (method) => 'onRequest' + method[0] + method.slice(1).toLowerCase(); // POST → onRequestPost

/** Pages Functions 가 주던 context 모양을 똑같이 만들어 준다 */
function contextOf(request, env, ctx) {
    return { request, env, params: {}, data: {}, waitUntil: (p) => ctx?.waitUntil?.(p), next: () => env.ASSETS.fetch(request) };
}

async function handleApiAsync(request, env, ctx, module) {
    const handler = module[handlerName(request.method)] ?? module.onRequest;
    if (!handler) {
        const allow = METHODS.filter((m) => module[handlerName(m)]).join(', ');
        return json({ error: 'METHOD_NOT_ALLOWED' }, 405, { allow });
    }
    if (!env.DB) {
        // 대시보드에서 D1 을 연결(binding 이름 DB)하지 않았을 때: 원인을 바로 알 수 있게
        return json({ error: 'DB_NOT_BOUND', message: '데이터베이스가 연결되지 않았어요. Cloudflare 설정에서 D1(DB)을 연결해 주세요.' }, 503);
    }
    return handler(contextOf(request, env, ctx));
}

export default {
    async fetch(request, env, ctx) {
        const { pathname } = new URL(request.url);
        if (pathname === '/api' || pathname.startsWith('/api/')) {
            const module = API_ROUTES[pathname.replace(/\/+$/, '')];
            return module ? handleApiAsync(request, env, ctx, module) : json({ error: 'NOT_FOUND' }, 404);
        }
        return env.ASSETS.fetch(request);
    },
};
