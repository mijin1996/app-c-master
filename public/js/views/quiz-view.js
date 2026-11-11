// 단원 퀴즈 화면: 한 문항씩, 고르면 바로 정답·해설 (글자는 사전 · 지금 언어의 콘텐츠에서)
import { $, $$, esc } from '../ui/dom.js';
import { cody, codyNameOf } from '../ui/cody.js';
import { highlight } from '../ui/editor.js';
import { renderShell } from './shell.js';
import { celebrateAsync } from './celebrate.js';
import { QUIZ_PASS_SCORE, solvedCountIn } from '../domain/progress-rules.js';
import { t } from '../i18n/index.js';

const OPTION_KEYS = 'ABCD';
const LAST_CHAPTER = 18;

export function renderQuiz(app, chapterNo) {
    const chapter = app.content.byChapter.get(chapterNo);
    if (!chapter) {
        app.router.go('map');
        return;
    }
    const state = { index: 0, correct: [], picked: null };
    const crumbs = (last) => '<div class="crumbs"><a href="#map">' + esc(t('nav.map')) + '</a> › <a href="#ch' + chapterNo + '">' + esc(t('prob.crumbChapter', { n: chapterNo, title: chapter.title })) + '</a> › ' + esc(t(last)) + '</div>';

    const draw = () => {
        const q = chapter.quiz[state.index];
        const progressBar = chapter.quiz.map((_, k) => '<i class="' + (k < state.index ? (state.correct[k] ? 'ok' : 'no') : k === state.index ? 'cur' : '') + '"></i>').join('');
        const options = q.options.map((text, k) => {
            let cls = '';
            if (state.picked !== null) {
                cls = k === q.answer ? 'right' : k === state.picked ? 'wrong' : '';
            }
            return '<button class="opt ' + cls + '" data-k="' + k + '" ' + (state.picked !== null ? 'disabled' : '') + '><span class="k">' + OPTION_KEYS[k] + '</span><span>' + esc(text) + '</span></button>';
        }).join('');
        const isLast = state.index === chapter.quiz.length - 1;
        const feedback = state.picked === null ? '' :
            '<div class="explain"><b class="' + (state.picked === q.answer ? 'good-text' : 'bad-text') + '">' + esc(t(state.picked === q.answer ? 'quiz.correct' : 'quiz.wrong')) + '</b> ' + esc(q.explain) + '</div>' +
            '<button class="btn primary" id="q-next">' + esc(t(isLast ? 'quiz.result' : 'quiz.next')) + '</button>';

        renderShell(app, 'map', crumbs('quiz.crumb') +
            '<section class="panel quiz"><div class="qprog">' + progressBar + '</div><div class="muted" style="font-weight:600">' + esc(t('quiz.progress', { n: chapterNo, i: state.index + 1, total: chapter.quiz.length })) + '</div>' +
            '<div class="qtext">' + esc(q.q) + '</div>' + (q.code ? '<pre class="codeblock">' + highlight(app.progress.styleSnippet(q.code)) + '</pre>' : '') +
            '<div class="opts">' + options + '</div>' + feedback + '</section>');

        $$('.opt').forEach((button) => {
            button.onclick = () => {
                state.picked = Number(button.dataset.k);
                state.correct[state.index] = state.picked === q.answer;
                app.sound.play(state.correct[state.index] ? 'correct' : 'wrong');
                draw();
            };
        });
        const next = $('#q-next');
        if (next) {
            next.focus();
            next.onclick = () => {
                if (isLast) {
                    finish();
                    return;
                }
                state.index++;
                state.picked = null;
                draw();
            };
        }
    };

    const finish = () => {
        const score = state.correct.filter(Boolean).length;
        const recorded = app.progress.recordQuiz(chapterNo, score);
        const pass = score >= QUIZ_PASS_SCORE;
        const c = app.progress.curriculum.find((x) => x.chapter === chapterNo);
        const allSolved = solvedCountIn(app.progress.progress, c) === c.problems.length;
        const settings = app.progress.progress.settings;
        renderShell(app, 'map', crumbs('quiz.crumbResult') +
            '<section class="panel quiz" style="text-align:center"><h2 style="font-size:28px">' + score + ' / 5 ' + esc(t(pass ? 'quiz.pass' : 'quiz.almost')) + '</h2>' +
            '<div style="max-width:220px;margin:0 auto">' + cody(app.progress.currentForm(), pass ? 'happy' : 'think', { name: codyNameOf(settings) }) + '</div>' +
            (recorded.gainedXp ? '<div><span class="chip accent">+' + recorded.gainedXp + ' XP</span></div>' : '') +
            '<p style="margin:0">' + esc(t(pass ? (allSolved ? 'quiz.allDone' : 'quiz.passLeft') : 'quiz.failNote')) + '</p>' +
            '<div class="row-buttons center"><a class="btn" href="#ch' + chapterNo + '">' + esc(t('quiz.toChapter')) + '</a><button class="btn primary" id="q-retry">' + esc(t('quiz.retry')) + '</button>' +
            (chapterNo < LAST_CHAPTER ? '<a class="btn primary" href="#ch' + (chapterNo + 1) + '">' + esc(t('quiz.nextChapter', { n: chapterNo + 1 })) + '</a>' : '') + '</div></section>');
        $('#q-retry').onclick = () => renderQuiz(app, chapterNo);
        if (pass) {
            app.sound.play('correct');
        }
        celebrateAsync(app, recorded.events);
    };

    draw();
}
