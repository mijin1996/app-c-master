// 객체지향 화면: 레슨 목록(#oop) → 레슨(#oop3): 쉬운 설명 → 5문항 퀴즈 → 결과
// 규칙 계산은 ProgressService(recordOopQuiz)가 하고, 여기서는 그리기와 입력만 맡는다.
import { $, $$, esc, toast } from '../ui/dom.js';
import { cody } from '../ui/cody.js';
import { highlight } from '../ui/editor.js';
import { renderShell } from './shell.js';
import { celebrateAsync } from './celebrate.js';
import { Failure } from '../core/result.js';
import { messageOf } from '../core/app-error.js';
import { OOP_PASS_SCORE, OOP_QUIZ_SIZE, OOP_PASS_XP, OOP_PERFECT_XP } from '../domain/oop-rules.js';

const OPTION_KEYS = 'ABCD';

/** 레슨을 불러온다. 실패하면 안내를 그리고 null */
async function lessonsOrNullAsync(app) {
    const loaded = await app.contentRepository.loadOopAsync();
    if (loaded instanceof Failure || loaded.data.length === 0) {
        const message = loaded instanceof Failure ? messageOf(loaded.error) : '레슨이 비어 있어요.';
        renderShell(app, 'oop', '<div class="panel pad">객체지향 레슨을 불러오지 못했어요. ' + esc(message) + ' <button class="btn" id="oop-retry">다시 시도</button></div>');
        $('#oop-retry').onclick = () => app.router.refresh();
        return null;
    }
    return loaded.data;
}

function bestChip(best) {
    if (best === undefined) {
        return '<span class="chip">아직 안 풂</span>';
    }
    const cls = best === OOP_QUIZ_SIZE ? 'good' : best >= OOP_PASS_SCORE ? 'accent' : 'bad';
    return '<span class="chip ' + cls + '">최고 ' + best + ' / ' + OOP_QUIZ_SIZE + '</span>';
}

export async function renderOopList(app) {
    const lessons = await lessonsOrNullAsync(app);
    if (!lessons) {
        return;
    }
    const scores = app.progress.progress.oopQuiz;
    const passed = lessons.filter((l) => (scores[l.no] ?? 0) >= OOP_PASS_SCORE).length;
    const cards = lessons.map((l) => '<a class="lesson-card panel" href="#oop' + l.no + '">' +
        '<span class="lesson-no">' + String(l.no).padStart(2, '0') + '</span>' +
        '<b class="lesson-title">' + esc(l.title) + '</b>' +
        '<span class="muted small">' + esc(l.tag) + '</span>' + bestChip(scores[l.no]) + '</a>').join('');
    renderShell(app, 'oop',
        '<div class="view-title"><h1>객체지향</h1><span class="on-sky muted">Java · C# 수업 내용을 쉬운 말로 풀고 바로 문제로 확인해요</span></div>' +
        '<div class="panel pad oop-intro">' +
        '<p style="margin:0">레슨마다 <b>"쉽게 말하면"</b> 설명을 먼저 읽고, <b>5문항 퀴즈</b>를 풀어요. 틀려도 해설이 바로 나오니 걱정 말아요!</p>' +
        '<p class="muted small" style="margin:6px 0 0">' + OOP_PASS_SCORE + '문항 이상 맞히면 +' + OOP_PASS_XP + ' XP, 만점이면 +' + OOP_PERFECT_XP + ' XP 더 · 지금까지 ' + passed + ' / ' + lessons.length + ' 레슨 통과 · 단원 클리어 · 코디 진화와는 따로예요</p></div>' +
        '<div class="lesson-grid">' + cards + '</div>');
}

function explainStep(app, lesson, total, onStart) {
    const example = lesson.example
        ? '<h3>코드로 보면</h3><div class="muted small">' + esc(lesson.example.title) + '</div><pre class="codeblock">' + highlight(lesson.example.code) + '</pre>'
        : '';
    renderShell(app, 'oop', '<div class="crumbs"><a href="#oop">객체지향</a> › ' + lesson.no + '. ' + esc(lesson.title) + '</div>' +
        '<section class="panel pad lesson">' +
        '<div class="lesson-head"><span class="lesson-no big">' + String(lesson.no).padStart(2, '0') + '</span><div><h1>' + esc(lesson.title) + '</h1><span class="muted">' + esc(lesson.tag) + '</span></div></div>' +
        '<div class="easy"><div class="easy-cody">' + cody(app.progress.currentForm(), 'happy', { name: app.progress.progress.settings.codyName }) + '</div>' +
        '<div><h3>쉽게 말하면</h3>' + lesson.story.map((p) => '<p>' + esc(p) + '</p>').join('') + '</div></div>' +
        '<h3>핵심 정리</h3><ul class="points">' + lesson.points.map((p) => '<li>' + esc(p) + '</li>').join('') + '</ul>' + example +
        '<div class="row-buttons"><a class="btn" href="#oop">목록으로</a><button class="btn primary" id="oop-start">퀴즈 풀기 (' + lesson.quiz.length + '문항)</button>' +
        (lesson.no < total ? '<a class="btn" href="#oop' + (lesson.no + 1) + '">다음 레슨 →</a>' : '') + '</div></section>');
    $('#oop-start').onclick = onStart;
}

export async function renderOopLesson(app, lessonNo) {
    const lessons = await lessonsOrNullAsync(app);
    if (!lessons) {
        return;
    }
    const lesson = lessons.find((l) => l.no === lessonNo);
    if (!lesson) {
        app.router.go('oop');
        return;
    }
    const state = { index: 0, correct: [], picked: null };
    const crumbs = '<div class="crumbs"><a href="#oop">객체지향</a> › <a href="#oop' + lesson.no + '">' + lesson.no + '. ' + esc(lesson.title) + '</a> › 퀴즈</div>';

    const drawQuestion = () => {
        const q = lesson.quiz[state.index];
        const bar = lesson.quiz.map((_, k) => '<i class="' + (k < state.index ? (state.correct[k] ? 'ok' : 'no') : k === state.index ? 'cur' : '') + '"></i>').join('');
        const options = q.options.map((text, k) => {
            let cls = '';
            if (state.picked !== null) {
                cls = k === q.answer ? 'right' : k === state.picked ? 'wrong' : '';
            }
            return '<button class="opt ' + cls + '" data-k="' + k + '" ' + (state.picked !== null ? 'disabled' : '') + '><span class="k">' + OPTION_KEYS[k] + '</span><span>' + esc(text) + '</span></button>';
        }).join('');
        const isLast = state.index === lesson.quiz.length - 1;
        const feedback = state.picked === null ? '' :
            '<div class="explain"><b class="' + (state.correct[state.index] ? 'good-text' : 'bad-text') + '">' + (state.correct[state.index] ? '정답이에요!' : '아쉬워요! 정답은 ' + OPTION_KEYS[q.answer] + '예요.') + '</b> ' + esc(q.explain) + '</div>' +
            '<button class="btn primary" id="q-next">' + (isLast ? '결과 보기' : '다음 문제') + '</button>';
        renderShell(app, 'oop', crumbs +
            '<section class="panel quiz"><div class="qprog">' + bar + '</div><div class="muted" style="font-weight:600">' + lesson.no + '. ' + esc(lesson.title) + ' · ' + (state.index + 1) + ' / ' + lesson.quiz.length + '</div>' +
            '<div class="qtext">' + esc(q.q) + '</div>' + (q.code ? '<pre class="codeblock">' + highlight(q.code) + '</pre>' : '') +
            '<div class="opts">' + options + '</div>' + feedback + '</section>');
        $$('.opt').forEach((button) => {
            button.onclick = () => {
                state.picked = Number(button.dataset.k);
                state.correct[state.index] = state.picked === q.answer;
                app.sound.play(state.correct[state.index] ? 'correct' : 'wrong');
                drawQuestion();
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
                drawQuestion();
            };
        }
    };

    const finish = () => {
        const score = state.correct.filter(Boolean).length;
        const recorded = app.progress.recordOopQuiz(lesson.no, score);
        if (recorded instanceof Failure) {
            toast(messageOf(recorded.error));
            return;
        }
        const pass = score >= OOP_PASS_SCORE;
        const wrongList = lesson.quiz.map((q, k) => (state.correct[k] ? '' : '<li><b>' + (k + 1) + '번</b> ' + esc(q.q) + '<div class="muted small">' + esc(q.explain) + '</div></li>')).join('');
        renderShell(app, 'oop', crumbs.replace('› 퀴즈', '› 결과') +
            '<section class="panel quiz" style="text-align:center"><h2 style="font-size:28px">' + score + ' / ' + lesson.quiz.length + ' ' + (pass ? '통과!' : '조금만 더!') + '</h2>' +
            '<div style="max-width:200px;margin:0 auto">' + cody(app.progress.currentForm(), pass ? 'happy' : 'think', { name: app.progress.progress.settings.codyName }) + '</div>' +
            (recorded.data.gainedXp ? '<div><span class="chip accent">+' + recorded.data.gainedXp + ' XP</span></div>' : '') +
            '<p style="margin:0">' + (pass ? '최고 기록 ' + recorded.data.best + ' / ' + OOP_QUIZ_SIZE + '. 잘했어요!' : OOP_PASS_SCORE + '문항 이상 맞히면 통과예요. 설명을 한 번 더 읽고 도전해 봐요.') + '</p>' +
            (wrongList ? '<div class="review"><h3>틀린 문제 다시 보기</h3><ol>' + wrongList + '</ol></div>' : '') +
            '<div class="row-buttons center"><a class="btn" href="#oop' + lesson.no + '">설명 다시 보기</a><button class="btn primary" id="q-retry">다시 풀기</button>' +
            (lesson.no < lessons.length ? '<a class="btn primary" href="#oop' + (lesson.no + 1) + '">다음 레슨 →</a>' : '<a class="btn" href="#oop">목록으로</a>') + '</div></section>');
        $('#q-retry').onclick = () => {
            state.index = 0;
            state.correct = [];
            state.picked = null;
            drawQuestion();
        };
        if (pass) {
            app.sound.play('correct');
        }
        celebrateAsync(app, recorded.data.events);
    };

    explainStep(app, lesson, lessons.length, drawQuestion);
}
