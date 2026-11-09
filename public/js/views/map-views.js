// 학습 지도(스테이지·단원 카드)와 단원 상세(개념·문제 목록·퀴즈) 화면
import { $, $$, esc, pad2 } from '../ui/dom.js';
import { cody, CHEER, pick } from '../ui/cody.js';
import { highlight } from '../ui/editor.js';
import { renderShell } from './shell.js';
import {
    STAGES, FORM_NAMES, XP_PER_LEVEL, QUIZ_PASS_SCORE, levelOf, isChapterCleared, isStageCleared, solvedCountIn, chapterState,
} from '../domain/progress-rules.js';

export const starStr = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);

export function renderMap(app) {
    const p = app.progress.progress;
    const curriculum = app.progress.curriculum;
    const summary = app.progress.summary;
    const form = app.progress.currentForm();
    const level = levelOf(summary.xp);
    const xpIn = summary.xp % XP_PER_LEVEL;
    const isNight = app.sky.info && app.sky.info.phase === '밤';
    const message = isNight ? pick(CHEER.night) : pick(CHEER.idle);

    const stagesHtml = STAGES.map((stage, si) => {
        const chapters = curriculum.filter((c) => c.stage === si);
        const cards = chapters.map((c) => {
            const chapter = app.content.byChapter.get(c.chapter);
            const cleared = isChapterCleared(p, c);
            const quiz = p.quiz[c.chapter];
            const pips = c.problems.map((x) => '<i class="' + (p.solved[x.id] ? 'ok' : '') + '"></i>').join('') +
                '<i class="' + ((quiz ?? 0) >= QUIZ_PASS_SCORE ? 'q' : '') + '"></i>';
            return '<button class="ch-card ' + (cleared ? 'cleared' : '') + '" data-ch="' + c.chapter + '"><span class="no">CHAPTER ' + pad2(c.chapter) + '</span>' +
                '<span class="t">' + esc(chapter.title) + '</span>' +
                '<span class="pips" aria-label="문제 ' + solvedCountIn(p, c) + '/4, 퀴즈 ' + ((quiz ?? 0) >= QUIZ_PASS_SCORE ? '통과' : '미통과') + '">' + pips + '</span>' +
                '<span class="muted" style="font-size:12.5px">' + (cleared ? '클리어!' : '문제 ' + solvedCountIn(p, c) + '/4 · 퀴즈 ' + (quiz !== undefined ? quiz + '/5' : '-')) + '</span></button>';
        }).join('');
        return '<section class="panel stage"><div class="stage-head"><h2>스테이지 ' + (si + 1) + ' · ' + stage.name + '</h2>' +
            (isStageCleared(p, curriculum, si) ? '<span class="chip good">클리어</span>' : '') +
            '<span class="reward">' + stage.reward + '</span></div><div class="ch-grid">' + cards + '</div></section>';
    }).join('');

    renderShell(app, 'map',
        '<div class="map-grid"><aside class="panel profile">' +
        '<div class="bubble">' + esc(message) + '</div>' +
        '<div class="cody-box bounce">' + cody(form, 'normal', { name: p.settings.codyName }) + '</div>' +
        '<div><div class="form-name">' + esc(p.settings.codyName) + ' · ' + FORM_NAMES[form] + '</div><div class="muted" style="font-size:13px">' + esc(app.auth.user.nickname) + '님의 코딩 친구</div></div>' +
        '<div><div class="xp-head"><span>레벨 ' + level + '</span><span class="muted">' + xpIn + ' / ' + XP_PER_LEVEL + ' XP</span></div>' +
        '<div class="xpbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + xpIn + '"><i style="width:' + xpIn + '%"></i></div></div>' +
        '<div class="stat-row"><div><b>' + summary.solvedCount + '</b><span>푼 문제</span></div><div><b>' + summary.clearedCount + '</b><span>클리어 단원</span></div><div><b>' + summary.streak + '</b><span>연속 학습일</span></div></div>' +
        '<button class="btn primary" id="btn-continue">이어서 학습하기</button>' +
        '</aside><div class="stages">' + stagesHtml + '</div></div>');

    $$('.ch-card').forEach((button) => {
        button.onclick = () => app.router.go('ch' + button.dataset.ch);
    });
    $('#btn-continue').onclick = () => {
        const next = curriculum.find((c) => !isChapterCleared(p, c));
        if (!next) {
            app.router.go('records');
            return;
        }
        const problem = next.problems.find((x) => !p.solved[x.id]);
        app.router.go(problem ? 'p' + problem.id : 'quiz' + next.chapter);
    };
}

export function renderChapter(app, chapterNo) {
    const chapter = app.content.byChapter.get(chapterNo);
    if (!chapter) {
        app.router.go('map');
        return;
    }
    const p = app.progress.progress;
    const c = app.progress.curriculum.find((x) => x.chapter === chapterNo);
    const rows = chapter.problems.map((problem) => {
        const status = p.solved[problem.id] ? '<span class="chip good">정답</span>' : p.tries[problem.id] ? '<span class="chip bad">도전 중</span>' : '<span class="chip">미제출</span>';
        return '<a class="prow" href="#p' + problem.id + '"><span class="pid">' + problem.id + '</span><span>' + esc(problem.title) + '</span>' +
            '<span class="stars" aria-label="난이도 ' + problem.level + '">' + starStr(problem.level) + '</span>' + status + '</a>';
    }).join('');
    const best = p.quiz[chapterNo];

    renderShell(app, 'map',
        '<div class="crumbs"><a href="#map">학습 지도</a> › 스테이지 ' + (chapter.stage + 1) + '</div>' +
        '<div class="view-title"><h1>' + chapterNo + '단원 · ' + esc(chapter.title) + '</h1>' + (chapterState(p, c) === 'cleared' ? '<span class="chip good">클리어</span>' : '') + '</div>' +
        '<div class="ch-layout"><section class="panel concept"><h2 style="font-size:21px">개념 정리</h2><ul>' + chapter.concept.points.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
        '<div><div class="muted label">예시 코드</div><pre class="codeblock">' + highlight(chapter.concept.example) + '</pre></div></section>' +
        '<div><section class="panel plist"><div style="padding:8px 12px 4px;font-weight:700">문제 ' + solvedCountIn(p, c) + ' / ' + chapter.problems.length + '</div>' + rows + '</section>' +
        '<section class="panel quizbox"><div style="flex:1;min-width:180px"><div style="font-weight:700">단원 퀴즈 (5문항)</div>' +
        '<div class="muted" style="font-size:13.5px">4문항 이상 맞히고 문제를 모두 풀면 단원 클리어! ' + (best !== undefined ? '최고 점수 ' + best + '/5' : '') + '</div></div>' +
        '<a class="btn primary" href="#quiz' + chapterNo + '">' + (best !== undefined ? '다시 풀기' : '퀴즈 시작') + '</a></section></div></div>');
}
