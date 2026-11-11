// 학습 지도(스테이지·단원 카드)와 단원 상세(개념·문제 목록·퀴즈) 화면 (글자는 사전에서, 지금 언어로)
import { $, $$, esc, pad2 } from '../ui/dom.js';
import { cody, formName, codyNameOf, CHEER, pick } from '../ui/cody.js';
import { highlight } from '../ui/editor.js';
import { renderShell } from './shell.js';
import { t } from '../i18n/index.js';
import {
    STAGES, XP_PER_LEVEL, QUIZ_PASS_SCORE, levelOf, isChapterCleared, isStageCleared, solvedCountIn, chapterState,
} from '../domain/progress-rules.js';

export const starStr = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);

export function renderMap(app) {
    const p = app.progress.progress;
    const curriculum = app.progress.curriculum;
    const summary = app.progress.summary;
    const form = app.progress.currentForm();
    const level = levelOf(summary.xp);
    const xpIn = summary.xp % XP_PER_LEVEL;
    const isNight = app.sky.info && app.sky.info.phase === 'night';
    const message = isNight ? pick(CHEER.night) : pick(CHEER.idle);

    const stagesHtml = STAGES.map((_, si) => {
        const chapters = curriculum.filter((c) => c.stage === si);
        const cards = chapters.map((c) => {
            const chapter = app.content.byChapter.get(c.chapter);
            const cleared = isChapterCleared(p, c);
            const quiz = p.quiz[c.chapter];
            const passed = (quiz ?? 0) >= QUIZ_PASS_SCORE;
            const pips = c.problems.map((x) => '<i class="' + (p.solved[x.id] ? 'ok' : '') + '"></i>').join('') +
                '<i class="' + (passed ? 'q' : '') + '"></i>';
            const solved = solvedCountIn(p, c);
            return '<button class="ch-card ' + (cleared ? 'cleared' : '') + '" data-ch="' + c.chapter + '"><span class="no">CHAPTER ' + pad2(c.chapter) + '</span>' +
                '<span class="t">' + esc(chapter.title) + '</span>' +
                '<span class="pips" aria-label="' + esc(t('map.chapterPips', { solved, quiz: t(passed ? 'map.quizPassed' : 'map.quizNotPassed') })) + '">' + pips + '</span>' +
                '<span class="muted" style="font-size:12.5px">' + esc(cleared ? t('common.clearedBang') : t('map.cardStatus', { solved, quiz: quiz !== undefined ? quiz + '/5' : '-' })) + '</span></button>';
        }).join('');
        return '<section class="panel stage"><div class="stage-head"><h2>' + esc(t('map.stageTitle', { n: si + 1, name: t('stage.' + si + '.name') })) + '</h2>' +
            (isStageCleared(p, curriculum, si) ? '<span class="chip good">' + esc(t('common.cleared')) + '</span>' : '') +
            '<span class="reward">' + esc(t('stage.' + si + '.reward')) + '</span></div><div class="ch-grid">' + cards + '</div></section>';
    }).join('');

    renderShell(app, 'map',
        '<div class="map-grid"><aside class="panel profile">' +
        '<div class="bubble">' + esc(message) + '</div>' +
        '<div class="cody-box bounce">' + cody(form, 'normal', { name: codyNameOf(p.settings) }) + '</div>' +
        '<div><div class="form-name">' + esc(codyNameOf(p.settings)) + ' · ' + esc(formName(form)) + '</div><div class="muted" style="font-size:13px">' + esc(t('map.friendOf', { nick: app.auth.user.nickname })) + '</div></div>' +
        '<div><div class="xp-head"><span>' + esc(t('map.level', { n: level })) + '</span><span class="muted">' + xpIn + ' / ' + XP_PER_LEVEL + ' XP</span></div>' +
        '<div class="xpbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + xpIn + '"><i style="width:' + xpIn + '%"></i></div></div>' +
        '<div class="stat-row"><div><b>' + summary.solvedCount + '</b><span>' + esc(t('map.solvedCount')) + '</span></div><div><b>' + summary.clearedCount + '</b><span>' + esc(t('map.clearedCount')) + '</span></div><div><b>' + summary.streak + '</b><span>' + esc(t('map.streak')) + '</span></div></div>' +
        '<button class="btn primary" id="btn-continue">' + esc(t('map.continue')) + '</button>' +
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
        const status = p.solved[problem.id] ? '<span class="chip good">' + esc(t('common.solved')) + '</span>'
            : p.tries[problem.id] ? '<span class="chip bad">' + esc(t('common.trying')) + '</span>' : '<span class="chip">' + esc(t('common.notSubmitted')) + '</span>';
        return '<a class="prow" href="#p' + problem.id + '"><span class="pid">' + problem.id + '</span><span>' + esc(problem.title) + '</span>' +
            '<span class="stars" aria-label="' + esc(t('common.difficulty', { n: problem.level })) + '">' + starStr(problem.level) + '</span>' + status + '</a>';
    }).join('');
    const best = p.quiz[chapterNo];

    renderShell(app, 'map',
        '<div class="crumbs"><a href="#map">' + esc(t('nav.map')) + '</a> › ' + esc(t('chapter.crumbStage', { n: chapter.stage + 1 })) + '</div>' +
        '<div class="view-title"><h1>' + esc(t('chapter.title', { n: chapterNo, title: chapter.title })) + '</h1>' + (chapterState(p, c) === 'cleared' ? '<span class="chip good">' + esc(t('common.cleared')) + '</span>' : '') + '</div>' +
        '<div class="ch-layout"><section class="panel concept"><h2 style="font-size:21px">' + esc(t('chapter.concept')) + '</h2><ul>' + chapter.concept.points.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
        '<div><div class="muted label">' + esc(t('chapter.example')) + '</div><pre class="codeblock">' + highlight(app.progress.styleSnippet(chapter.concept.example)) + '</pre></div></section>' +
        '<div><section class="panel plist"><div style="padding:8px 12px 4px;font-weight:700">' + esc(t('chapter.problems', { solved: solvedCountIn(p, c), total: chapter.problems.length })) + '</div>' + rows + '</section>' +
        '<section class="panel quizbox"><div style="flex:1;min-width:180px"><div style="font-weight:700">' + esc(t('chapter.quiz')) + '</div>' +
        '<div class="muted" style="font-size:13.5px">' + esc(t('chapter.quizRule')) + (best !== undefined ? esc(t('chapter.best', { n: best })) : '') + '</div></div>' +
        '<a class="btn primary" href="#quiz' + chapterNo + '">' + esc(best !== undefined ? t('chapter.retry') : t('chapter.startQuiz')) + '</a></section></div></div>');
}
