// 객체지향 화면: 레슨 목록(#oop) → 레슨(#oop3): 쉬운 설명 → 코드 실습 → 5문항 퀴즈 → 결과
// 규칙 계산은 ProgressService(recordOopQuiz · answerOopPractice)가 하고, 여기서는 그리기와 입력만 맡는다.
// 글자는 사전에서, 레슨 내용은 지금 언어의 oop.<언어>.json 에서.
import { $, $$, esc, toast } from '../ui/dom.js';
import { cody, codyNameOf } from '../ui/cody.js';
import { highlight } from '../ui/editor.js';
import { renderShell } from './shell.js';
import { celebrateAsync } from './celebrate.js';
import { Failure } from '../core/result.js';
import { messageOf } from '../core/app-error.js';
import { OOP_PASS_SCORE, OOP_QUIZ_SIZE, OOP_PASS_XP, OOP_PERFECT_XP } from '../domain/oop-rules.js';
import { t, getLocale } from '../i18n/index.js';

const OPTION_KEYS = 'ABCD';
const SHOW_ANSWER_AFTER = 2; // 두 번 틀리면 "정답 보기" 버튼을 보여 준다
const BLANK_SPLIT = /\[\[(\d+)\]\]/;

/** 레슨을 불러온다 (지금 언어). 실패하면 안내를 그리고 null */
async function lessonsOrNullAsync(app) {
    const loaded = await app.contentRepository.loadOopAsync(getLocale());
    if (loaded instanceof Failure || loaded.data.length === 0) {
        const message = loaded instanceof Failure ? messageOf(loaded.error) : t('oop.empty');
        renderShell(app, 'oop', '<div class="panel pad">' + esc(t('oop.loadFailed', { msg: message })) + ' <button class="btn" id="oop-retry">' + esc(t('common.retry')) + '</button></div>');
        $('#oop-retry').onclick = () => app.router.refresh();
        return null;
    }
    return loaded.data;
}

function bestChip(best) {
    if (best === undefined) {
        return '<span class="chip">' + esc(t('oop.notTaken')) + '</span>';
    }
    const cls = best === OOP_QUIZ_SIZE ? 'good' : best >= OOP_PASS_SCORE ? 'accent' : 'bad';
    return '<span class="chip ' + cls + '">' + esc(t('oop.best', { n: best, total: OOP_QUIZ_SIZE })) + '</span>';
}

export async function renderOopList(app) {
    const lessons = await lessonsOrNullAsync(app);
    if (!lessons) {
        return;
    }
    const scores = app.progress.progress.oopQuiz;
    const passed = lessons.filter((l) => (scores[l.no] ?? 0) >= OOP_PASS_SCORE).length;
    const cards = lessons.map((l) => {
        const solved = l.practice.filter((_, i) => app.progress.isPracticeSolved(l.no, i)).length;
        return '<a class="lesson-card panel" href="#oop' + l.no + '">' +
            '<span class="lesson-no">' + String(l.no).padStart(2, '0') + '</span>' +
            '<b class="lesson-title">' + esc(l.title) + '</b>' +
            '<span class="muted small">' + esc(l.tag) + '</span>' +
            '<span class="chips">' + bestChip(scores[l.no]) + '<span class="chip' + (solved === l.practice.length && solved > 0 ? ' good' : '') + '">' + esc(t('oop.practiceCount', { n: solved, total: l.practice.length })) + '</span></span></a>';
    }).join('');
    renderShell(app, 'oop',
        '<div class="view-title"><h1>' + esc(t('oop.title')) + '</h1><span class="on-sky muted">' + esc(t('oop.subtitle')) + '</span></div>' +
        '<div class="panel pad oop-intro">' +
        '<p style="margin:0">' + t('oop.intro') + '</p>' +
        '<p class="muted small" style="margin:6px 0 0">' + esc(t('oop.rule', { pass: OOP_PASS_SCORE, passXp: OOP_PASS_XP, perfectXp: OOP_PERFECT_XP, passed, total: lessons.length })) + '</p></div>' +
        '<div class="lesson-grid">' + cards + '</div>');
}

/** 빈칸 표시 [[n]] 자리에 입력칸을 끼워 넣은 코드 (나머지 조각만 색칠한다) */
function blankCodeHtml(practice, key) {
    const parts = practice.code.split(BLANK_SPLIT); // [코드, 번호, 코드, 번호, …]
    return parts.map((part, i) => {
        if (i % 2 === 0) {
            return highlight(part).replace(/\n$/, ''); // highlight 는 끝에 줄바꿈을 붙여서, 조각 사이에서는 떼어 낸다
        }
        const k = Number(part) - 1;
        const width = Math.max(4, ...practice.blanks[k].answers.map((a) => a.length)) + 1;
        return '<input class="blank" data-key="' + key + '" data-i="' + k + '" style="width:' + width + 'ch" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="' + esc(t('oop.blankAria', { n: k + 1 })) + '">';
    }).join('');
}

function practiceCardHtml(app, lesson, practice, index) {
    const key = lesson.no + '-' + index;
    const solved = app.progress.isPracticeSolved(lesson.no, index);
    const kindName = t(practice.kind === 'blank' ? 'oop.blank' : 'oop.output');
    const body = practice.kind === 'blank'
        ? '<pre class="codeblock practice-code">' + blankCodeHtml(practice, key) + '</pre>'
        : '<pre class="codeblock">' + highlight(practice.code) + '</pre>' +
          '<label class="f">' + esc(t('oop.outputLabel')) + '<textarea class="output-answer" data-key="' + key + '" rows="' + (practice.answers[0].split('\n').length + 1) + '" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea></label>';
    const hint = practice.kind === 'blank' ? practice.blanks.map((b, i) => t('oop.blankN', { n: i + 1, hint: b.hint })).join(' · ') : practice.hint;
    return '<div class="practice-card" id="pc-' + key + '">' +
        '<div class="practice-head"><span class="chip accent">' + esc(kindName) + '</span>' + (solved ? '<span class="chip good">' + esc(t('oop.solvedChip')) + '</span>' : '<span class="chip">+5 XP</span>') + '</div>' +
        '<p class="practice-q">' + esc(practice.prompt) + '</p>' + body +
        '<div class="row-buttons"><button class="btn primary" data-check="' + key + '">' + esc(t('oop.check')) + '</button><button class="btn" data-hint="' + key + '">' + esc(t('oop.hint')) + '</button>' +
        '<button class="btn" data-show="' + key + '" hidden>' + esc(t('oop.showAnswer')) + '</button></div>' +
        '<div class="practice-hint muted small" id="ph-' + key + '" hidden>' + esc(hint) + '</div>' +
        '<div class="practice-result" id="pr-' + key + '" aria-live="polite"></div></div>';
}

function inputsOf(practice, key) {
    if (practice.kind === 'blank') {
        return $$('input.blank[data-key="' + key + '"]').map((el) => el.value);
    }
    return [$('textarea.output-answer[data-key="' + key + '"]').value];
}

function answerText(practice) {
    return practice.kind === 'blank'
        ? practice.blanks.map((b, i) => t('oop.answerN', { n: i + 1, answer: b.answers[0] })).join(' · ')
        : practice.answers[0];
}

/** 채점 버튼 · 힌트 · 정답 보기 연결 */
function bindPractice(app, lesson) {
    const wrongCount = {};
    lesson.practice.forEach((practice, index) => {
        const key = lesson.no + '-' + index;
        const result = $('#pr-' + key);
        $('[data-hint="' + key + '"]').onclick = () => {
            $('#ph-' + key).hidden = !$('#ph-' + key).hidden;
        };
        $('[data-show="' + key + '"]').onclick = () => {
            result.innerHTML = '<div class="explain"><b>' + esc(t('oop.answer')) + '</b><pre class="codeblock small">' + esc(answerText(practice)) + '</pre>' + esc(practice.explain) + '</div>';
        };
        $('[data-check="' + key + '"]').onclick = () => {
            const answered = app.progress.answerOopPractice(lesson.no, index, practice, inputsOf(practice, key));
            if (answered instanceof Failure) {
                toast(messageOf(answered.error));
                return;
            }
            const { correct, marks, gainedXp } = answered.data;
            if (practice.kind === 'blank') {
                $$('input.blank[data-key="' + key + '"]').forEach((el, i) => {
                    el.classList.toggle('ok', marks[i]);
                    el.classList.toggle('no', !marks[i]);
                });
            } else {
                $('textarea.output-answer[data-key="' + key + '"]').classList.toggle('no', !correct);
            }
            app.sound.play(correct ? 'correct' : 'wrong');
            if (correct) {
                result.innerHTML = '<div class="explain"><b class="good-text">' + esc(t('quiz.correct')) + '</b> ' + (gainedXp ? '<span class="chip accent">+' + gainedXp + ' XP</span> ' : '') + esc(practice.explain) + '</div>';
                $('#pc-' + key + ' .practice-head').lastElementChild.outerHTML = '<span class="chip good">' + esc(t('oop.solvedChip')) + '</span>';
                celebrateAsync(app, answered.data.events);
                return;
            }
            wrongCount[key] = (wrongCount[key] ?? 0) + 1;
            result.innerHTML = '<div class="explain"><b class="bad-text">' + esc(t('quiz.wrong')) + '</b> ' +
                esc(t(practice.kind === 'blank' ? 'oop.wrongBlank' : 'oop.wrongOutput')) +
                esc(t(wrongCount[key] >= SHOW_ANSWER_AFTER ? 'oop.tryAnswer' : 'oop.tryHint')) + '</div>';
            $('[data-show="' + key + '"]').hidden = wrongCount[key] < SHOW_ANSWER_AFTER;
        };
    });
}

function explainStep(app, lesson, total, onStart) {
    const example = lesson.example
        ? '<h3>' + esc(t('oop.example')) + '</h3><div class="muted small">' + esc(lesson.example.title) + '</div><pre class="codeblock">' + highlight(lesson.example.code) + '</pre>'
        : '';
    const practice = lesson.practice.length
        ? '<h3>' + esc(t('oop.practice')) + ' <span class="muted small">' + esc(t('oop.practiceSub')) + '</span></h3><div class="practice-list">' +
          lesson.practice.map((p, i) => practiceCardHtml(app, lesson, p, i)).join('') + '</div>'
        : '';
    renderShell(app, 'oop', '<div class="crumbs"><a href="#oop">' + esc(t('oop.title')) + '</a> › ' + lesson.no + '. ' + esc(lesson.title) + '</div>' +
        '<section class="panel pad lesson">' +
        '<div class="lesson-head"><span class="lesson-no big">' + String(lesson.no).padStart(2, '0') + '</span><div><h1>' + esc(lesson.title) + '</h1><span class="muted">' + esc(lesson.tag) + '</span></div></div>' +
        '<div class="easy"><div class="easy-cody">' + cody(app.progress.currentForm(), 'happy', { name: codyNameOf(app.progress.progress.settings) }) + '</div>' +
        '<div><h3>' + esc(t('oop.easy')) + '</h3>' + lesson.story.map((p) => '<p>' + esc(p) + '</p>').join('') + '</div></div>' +
        '<h3>' + esc(t('oop.points')) + '</h3><ul class="points">' + lesson.points.map((p) => '<li>' + esc(p) + '</li>').join('') + '</ul>' + example + practice +
        '<div class="row-buttons"><a class="btn" href="#oop">' + esc(t('oop.toList')) + '</a><button class="btn primary" id="oop-start">' + esc(t('oop.startQuiz', { n: lesson.quiz.length })) + '</button>' +
        (lesson.no < total ? '<a class="btn" href="#oop' + (lesson.no + 1) + '">' + esc(t('oop.nextLesson')) + '</a>' : '') + '</div></section>');
    $('#oop-start').onclick = onStart;
    bindPractice(app, lesson);
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
    const crumbs = (last) => '<div class="crumbs"><a href="#oop">' + esc(t('oop.title')) + '</a> › <a href="#oop' + lesson.no + '">' + lesson.no + '. ' + esc(lesson.title) + '</a> › ' + esc(t(last)) + '</div>';

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
            '<div class="explain"><b class="' + (state.correct[state.index] ? 'good-text' : 'bad-text') + '">' + esc(state.correct[state.index] ? t('quiz.correct') : t('quiz.wrongAnswerIs', { key: OPTION_KEYS[q.answer] })) + '</b> ' + esc(q.explain) + '</div>' +
            '<button class="btn primary" id="q-next">' + esc(t(isLast ? 'quiz.result' : 'quiz.next')) + '</button>';
        renderShell(app, 'oop', crumbs('quiz.crumb') +
            '<section class="panel quiz"><div class="qprog">' + bar + '</div><div class="muted" style="font-weight:600">' + esc(t('oop.quizProgress', { no: lesson.no, title: lesson.title, i: state.index + 1, total: lesson.quiz.length })) + '</div>' +
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
        const wrongList = lesson.quiz.map((q, k) => (state.correct[k] ? '' : '<li><b>' + esc(t('oop.reviewNo', { n: k + 1 })) + '</b> ' + esc(q.q) + '<div class="muted small">' + esc(q.explain) + '</div></li>')).join('');
        renderShell(app, 'oop', crumbs('oop.crumbResult') +
            '<section class="panel quiz" style="text-align:center"><h2 style="font-size:28px">' + score + ' / ' + lesson.quiz.length + ' ' + esc(t(pass ? 'quiz.pass' : 'quiz.almost')) + '</h2>' +
            '<div style="max-width:200px;margin:0 auto">' + cody(app.progress.currentForm(), pass ? 'happy' : 'think', { name: codyNameOf(app.progress.progress.settings) }) + '</div>' +
            (recorded.data.gainedXp ? '<div><span class="chip accent">+' + recorded.data.gainedXp + ' XP</span></div>' : '') +
            '<p style="margin:0">' + esc(pass ? t('oop.passBest', { n: recorded.data.best, total: OOP_QUIZ_SIZE }) : t('oop.failNote', { pass: OOP_PASS_SCORE })) + '</p>' +
            (wrongList ? '<div class="review"><h3>' + esc(t('oop.review')) + '</h3><ol>' + wrongList + '</ol></div>' : '') +
            '<div class="row-buttons center"><a class="btn" href="#oop' + lesson.no + '">' + esc(t('oop.reread')) + '</a><button class="btn primary" id="q-retry">' + esc(t('quiz.retry')) + '</button>' +
            (lesson.no < lessons.length ? '<a class="btn primary" href="#oop' + (lesson.no + 1) + '">' + esc(t('oop.nextLesson')) + '</a>' : '<a class="btn" href="#oop">' + esc(t('oop.toList')) + '</a>') + '</div></section>');
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
