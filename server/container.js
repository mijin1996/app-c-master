// 조립 담당(Composition Root): 환경 변수(env)를 받아 모든 계층을 생성자 주입으로 연결한다.
// 다른 파일은 new로 의존 객체를 만들지 않고, 여기서 만든 것을 받아 쓴다.
import { CURRICULUM } from '../public/js/domain/curriculum.js';
import { D1UserDataSource } from './datasources/d1-user-datasource.js';
import { D1SessionDataSource } from './datasources/d1-session-datasource.js';
import { D1ProgressDataSource } from './datasources/d1-progress-datasource.js';
import { UserRepository } from './repositories/user-repository.js';
import { SessionRepository } from './repositories/session-repository.js';
import { ProgressRepository } from './repositories/progress-repository.js';
import { AuthService } from './services/auth-service.js';
import { ProgressService, RankingService, TeacherService } from './services/progress-service.js';
import { HintService } from './services/hint-service.js';
import { DisabledHintProvider, AnthropicHintProvider } from './hint/hint-providers.js';
import { CodeRunService } from './services/code-run-service.js';
import { D1CommunityDataSource } from './datasources/d1-community-datasource.js';
import { CommunityRepository } from './repositories/community-repository.js';
import { CommunityService } from './services/community-service.js';
import { DisabledJudgeProvider, Judge0JudgeProvider } from './judge/judge-providers.js';
import { Pbkdf2PasswordHasher } from './security/password-hasher.js';
import { SecretGenerator } from './security/secret-generator.js';

const DEFAULT_HINT_MODEL = 'claude-haiku-5-5';

export function parseTeacherUsernames(value) {
    return new Set(String(value ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean));
}

/**
 * @param {object} env  Cloudflare 환경 변수
 *   DB                 D1 데이터베이스 (필수)
 *   TEACHER_USERNAMES  선생님 아이디들 (쉼표로 구분)
 *   AI_HINT_ENABLED    'true'일 때만 AI 힌트 사용
 *   AI_HINT_API_KEY    Claude API 키 (비밀값으로 등록)
 *   AI_HINT_MODEL      사용할 모델 이름 (선택)
 *   PAID_LANGUAGES_ENABLED 'true'일 때만 C++ · Java 서버 채점 사용
 *   JUDGE0_URL         Judge0 채점 서버 주소 (예: https://judge.example.com)
 *   JUDGE0_TOKEN       Judge0 인증 토큰 (비밀값으로 등록, 선택)
 * @param {{clock?: () => number, hasher?: object, fetchFn?: Function}} options 테스트에서 바꿔 끼울 것들
 */
export function createContainer(env, options = {}) {
    const clock = options.clock ?? (() => Date.now());
    const teachers = parseTeacherUsernames(env.TEACHER_USERNAMES);

    const users = new UserRepository(new D1UserDataSource(env.DB));
    const sessions = new SessionRepository(new D1SessionDataSource(env.DB));
    const progress = new ProgressRepository(new D1ProgressDataSource(env.DB));

    const hintEnabled = env.AI_HINT_ENABLED === 'true' && Boolean(env.AI_HINT_API_KEY);
    const hintProvider = hintEnabled
        ? new AnthropicHintProvider(env.AI_HINT_API_KEY, env.AI_HINT_MODEL || DEFAULT_HINT_MODEL, options.fetchFn)
        : new DisabledHintProvider();

    const runEnabled = env.PAID_LANGUAGES_ENABLED === 'true' && Boolean(env.JUDGE0_URL);
    const runProvider = runEnabled
        ? new Judge0JudgeProvider(env.JUDGE0_URL, env.JUDGE0_TOKEN || '', options.fetchFn)
        : new DisabledJudgeProvider();

    const auth = new AuthService(users, sessions, options.hasher ?? new Pbkdf2PasswordHasher(), new SecretGenerator(), clock, teachers);
    const community = new CommunityRepository(new D1CommunityDataSource(env.DB));

    return {
        auth,
        community: new CommunityService(community, clock, (user) => auth.isTeacher(user)),
        progress: new ProgressService(progress, CURRICULUM, clock),
        ranking: new RankingService(progress),
        teacher: new TeacherService(progress, teachers),
        hint: new HintService(hintProvider, hintEnabled),
        codeRun: new CodeRunService(runProvider, runEnabled),
    };
}
