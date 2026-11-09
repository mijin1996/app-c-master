// 시작점(Composition Root): 모든 계층을 여기서 만들고 생성자로 연결한다.
// DataSource → Repository → Service → View 순서로 조립한다.
import { Failure } from './core/result.js';
import { messageOf } from './core/app-error.js';
import { FEATURES } from './config/features.js';
import { CURRICULUM } from './domain/curriculum.js';
import { DEFAULT_SETTINGS } from './domain/progress-model.js';
import { FetchHttpClient } from './datasources/http-client.js';
import {
    AuthApiDataSource, ProgressApiDataSource, RankingApiDataSource, HintApiDataSource, StaticContentDataSource, CodeRunApiDataSource, CommunityApiDataSource,
} from './datasources/api-datasources.js';
import {
    AuthRepository, ProgressRepository, RankingRepository, HintRepository, ContentRepository, CodeRunRepository, CommunityRepository,
} from './repositories/api-repositories.js';
import { AuthService } from './services/auth-service.js';
import { ProgressService } from './services/progress-service.js';
import { JudgeService } from './services/judge-service.js';
import { RankingService, TeacherService, HintService, CommunityService } from './services/learning-services.js';
import { WorkerJudgeRunner, PythonWorkerRunner, ServerJudgeRunner } from './judge/judge-runners.js';
import { Sky } from './ui/sky.js';
import { SoundPlayer } from './ui/sound.js';
import { dayKey, yesterdayKey, esc } from './ui/dom.js';
import { Router } from './router.js';
import { installClickSpark, installFuseButtons } from './ui/effects.js';
import { renderLogin } from './views/auth-views.js';
import { renderMap, renderChapter } from './views/map-views.js';
import { renderProblem } from './views/problem-view.js';
import { renderQuiz } from './views/quiz-view.js';
import { renderProblems, renderRanking, renderRecords, renderTeacher } from './views/list-views.js';
import { openSettings } from './views/settings-modal.js';
import { renderAlgorithm } from './views/algorithm-view.js';
import { renderCommunityList, renderCommunityNew, renderCommunityProblem } from './views/community-view.js';
import { indexContent } from './mappers/content-mapper.js';

// ---------- 조립 ----------
const http = new FetchHttpClient();
const rankingRepository = new RankingRepository(new RankingApiDataSource(http));
const auth = new AuthService(new AuthRepository(new AuthApiDataSource(http)));
const progress = new ProgressService(
    new ProgressRepository(new ProgressApiDataSource(http)),
    CURRICULUM,
    { today: () => dayKey(), yesterday: () => yesterdayKey(), now: () => Date.now() },
);
const contentRepository = new ContentRepository(new StaticContentDataSource(http));
const codeRunRepository = new CodeRunRepository(new CodeRunApiDataSource(http));
const currentSettings = () => progress.progress?.settings ?? DEFAULT_SETTINGS;

const app = {
    root: document.getElementById('app'),
    auth,
    progress,
    judge: new JudgeService({
        c: new WorkerJudgeRunner(new URL('./judge/judge-worker.js', import.meta.url)),
        python: new PythonWorkerRunner(new URL('./judge/python-worker.js', import.meta.url)),
        cpp: new ServerJudgeRunner(codeRunRepository, 'cpp'),
        java: new ServerJudgeRunner(codeRunRepository, 'java'),
    }),
    ranking: new RankingService(rankingRepository),
    community: new CommunityService(new CommunityRepository(new CommunityApiDataSource(http))),
    teacher: new TeacherService(rankingRepository, auth),
    hint: new HintService(new HintRepository(new HintApiDataSource(http)), FEATURES.aiHint, auth),
    sound: new SoundPlayer('/assets/sounds/', currentSettings),
    sky: Sky,
    content: null,
    router: null,
    openSettings: () => openSettings(app),
};

const requireLogin = (render) => (match) => (auth.user && progress.progress ? render(match) : renderLogin(app));

app.router = new Router([
    [/^map$/, requireLogin(() => renderMap(app))],
    [/^ch(\d+)$/, requireLogin((m) => renderChapter(app, Number(m[1])))],
    [/^p(\d+)$/, requireLogin((m) => renderProblem(app, Number(m[1])))],
    [/^quiz(\d+)$/, requireLogin((m) => renderQuiz(app, Number(m[1])))],
    [/^problems$/, requireLogin(() => renderProblems(app))],
    [/^algo(?:-(bronze|silver|gold|platinum))?$/, requireLogin((m) => renderAlgorithm(app, m[1] ?? null))],
    [/^community$/, requireLogin(() => renderCommunityList(app))],
    [/^community-new$/, requireLogin(() => renderCommunityNew(app))],
    [/^c(\d+)$/, requireLogin((m) => renderCommunityProblem(app, Number(m[1])))],
    [/^ranking$/, requireLogin(() => renderRanking(app))],
    [/^records$/, requireLogin(() => renderRecords(app))],
    [/^teacher$/, requireLogin(() => renderTeacher(app))],
], 'map');

app.afterLoginAsync = async () => {
    const loaded = await progress.loadAsync();
    if (loaded instanceof Failure) {
        renderLogin(app);
        return;
    }
    app.sky.compute();
    app.sound.unlock();
    if (progress.progress.settings.bgm) {
        app.sound.setBgmAsync(true);
    }
    app.router.refresh();
};

app.logoutAsync = async () => {
    app.sound.setBgmAsync(false);
    await auth.logoutAsync();
    progress.clear();
    history.replaceState(null, '', location.pathname);
    renderLogin(app);
};

// 탭을 닫거나 숨길 때 진도를 바로 저장
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && progress.progress) {
        progress.flushAsync();
    }
});
document.addEventListener('pointerdown', () => {
    if (auth.user) {
        app.sound.unlock();
    }
}, { passive: true });

// ---------- 시작 ----------
async function startAsync() {
    installClickSpark();
    installFuseButtons();
    Sky.init(document.getElementById('sky'), currentSettings);
    const content = await contentRepository.loadAsync();
    if (content instanceof Failure) {
        app.root.innerHTML = '<div class="wrap login"><div class="panel pad">문제를 불러오지 못했어요. ' + esc(messageOf(content.error)) + ' 새로고침해 주세요.</div></div>';
        return;
    }
    app.content = indexContent(content.data);
    const restored = await auth.restoreAsync(); // 쿠키가 살아 있으면 자동 로그인
    if (!(restored instanceof Failure)) {
        const loaded = await progress.loadAsync();
        if (!(loaded instanceof Failure) && progress.progress.settings.bgm) {
            app.sound.setBgmAsync(true);
        }
    }
    app.router.start(); // 로그인 안 했으면 requireLogin 이 로그인 화면을 보여 준다
}

startAsync();
