// 단원 퀴즈 화면: 한 문항씩, 고르면 바로 정답·해설
import { $, $$, esc } from '../ui/dom.js';
import { cody } from '../ui/cody.js';
import { highlight } from '../ui/editor.js';
import { renderShell } from './shell.js';
import { celebrateAsync } from './celebrate.js';
import { QUIZ_PASS_SCORE, solvedCountIn } from '../domain/progress-rules.js';

const OPTION_KEYS = 'ABCD';

export function renderQuiz(app, chapterNo) {
    const chapter = app.content.byChapter.get(chapterNo);
    if (!chapter) {
        app.router.go('map');
        return;
    }
    const state = { index: 0, correct: [], picked: null };

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
            '<div class="explain"><b class="' + (state.picked === q.answer ? 'good-text' : 'bad-text') + '">' + (state.picked === q.answer ? '정답이에요!' : '아쉬워요!') + '</b> ' + esc(q.explain) + '</div>' +
            '<button class="btn primary" id="q-next">' + (isLast ? '결과 보기' : '다음 문제') + '</button>';

        renderShell(app, 'map', '<div class="crumbs"><a href="#map">학습 지도</a> › <a href="#ch' + chapterNo + '">' + chapterNo + '단원 ' + esc(chapter.title) + '</a> › 퀴즈</div>' +
            '<section class="panel quiz"><div class="qprog">' + progressBar + '</div><div class="muted" style="font-weight:600">' + chapterNo + '단원 퀴즈 · ' + (state.index + 1) + ' / ' + chapter.quiz.length + '</div>' +
            '<div class="qtext">' + esc(q.q) + '</div>' + (q.code ? '<pre class="codeblock">' + highlight(q.code) + '</pre>' : '') +
            '<div class="opts">' + options + '</div>' + feedback + '</section>');

        $$('.opt').forEach((button) => {
            button.onclick = () => {
                state.picked = Number(button.dataset.k);
                state.correct[state.index] = state.picked === q.answer;
                app.sound.play(state.correct[state.index] ? 'quizOk' : 'quizNo');
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
        renderShell(app, 'map', '<div class="crumbs"><a href="#map">학습 지도</a> › <a href="#ch' + chapterNo + '">' + chapterNo + '단원</a> › 퀴즈 결과</div>' +
            '<section class="panel quiz" style="text-align:center"><h2 style="font-size:28px">' + score + ' / 5 ' + (pass ? '통과!' : '조금만 더!') + '</h2>' +
            '<div style="max-width:220px;margin:0 auto">' + cody(app.progress.currentForm(), pass ? 'happy' : 'think', { name: settings.codyName }) + '</div>' +
            (recorded.gainedXp ? '<div><span class="chip accent">+' + recorded.gainedXp + ' XP</span></div>' : '') +
            '<p style="margin:0">' + (pass ? (allSolved ? '단원의 문제와 퀴즈를 모두 마쳤어요.' : '퀴즈 통과! 남은 문제를 풀면 단원이 클리어돼요.') : '4문항 이상 맞히면 통과예요. 해설을 다시 보고 도전해 봐요.') + '</p>' +
            '<div class="row-buttons center"><a class="btn" href="#ch' + chapterNo + '">단원으로</a><button class="btn primary" id="q-retry">다시 풀기</button>' +
            (chapterNo < 18 ? '<a class="btn primary" href="#ch' + (chapterNo + 1) + '">' + (chapterNo + 1) + '단원으로</a>' : '') + '</div></section>');
        $('#q-retry').onclick = () => renderQuiz(app, chapterNo);
        if (pass) {
            app.sound.play('quizOk');
        }
        celebrateAsync(app, recorded.events);
    };

    draw();
}
