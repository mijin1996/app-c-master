// 문제 풀이 화면: 문제(정올·백준 형식) + 풀이 타임라인 + 에디터 + 채점 결과 (글자는 사전 · 지금 언어의 콘텐츠에서)
import { $, $$, esc, fmtMS, copyText, toast } from '../ui/dom.js';
import { cody, codyNameOf, CHEER, pick } from '../ui/cody.js';
import { mountEditor, highlight } from '../ui/editor.js';
import { Failure } from '../core/result.js';
import { messageOf } from '../core/app-error.js';
import { renderShell } from './shell.js';
import { celebrateAsync } from './celebrate.js';
import { starStr } from './map-views.js';
import { SOLUTION_MIN_REAL_TRIES } from '../services/progress-service.js';
import { LANGUAGES, LanguageId, languageOf, isLanguageAvailable } from '../domain/languages.js';
import { Verdict, normalizeOutput, testCaseOf } from '../services/judge-service.js';
import { SOLVE_LIMIT_SEC, XP_BY_LEVEL, LATE_XP_RATE, xpForSolve, isAlgorithmLevel } from '../domain/progress-rules.js';
import { t, getLocale } from '../i18n/index.js';
import { translateRunMessage } from '../i18n/run-messages.js';

const MAX_SAMPLES = 2;
const WARN_RATIO = 0.8;
const SEC_PER_MIN = 60;
const ERROR_KINDS = new Set(['compile', 'runtime', 'tle', 'ole']);

const runText = (message) => esc(translateRunMessage(message, getLocale()));
const lineNear = (line) => (line ? t('common.lineNear', { line }) : '');
const verdictLabel = (verdict) => esc(t('verdict.' + verdict));

function copyButton(text) {
    return '<button class="copy" data-copy="' + esc(text) + '">' + esc(t('common.copy')) + '</button>';
}

function sampleBlocks(problem) {
    let html = '';
    for (let i = 0; i < Math.min(MAX_SAMPLES, problem.tests.length); i++) {
        const testCase = testCaseOf(problem.tests[i]);
        const expected = problem.expected[i];
        const fileIn = Object.keys(testCase.files)[0];
        const inText = fileIn ? testCase.files[fileIn] : testCase.input;
        const hasInput = Boolean(fileIn) || testCase.input !== '';
        const inLabel = fileIn ? t('prob.sampleFile', { file: fileIn, n: i + 1 }) : t('prob.sampleInput', { n: i + 1 });
        const inBlock = hasInput
            ? '<div class="sample"><div class="lab">' + esc(inLabel) + copyButton(inText) + '</div><pre>' + esc(inText) + '</pre></div>'
            : '<div class="sample"><div class="lab">' + esc(t('prob.sampleInput', { n: i + 1 })) + '</div><pre class="muted">' + esc(t('common.noInput')) + '</pre></div>';
        const outLabel = problem.judge ? t('prob.sampleFile', { file: problem.judge, n: i + 1 }) : t('prob.sampleOutput', { n: i + 1 });
        html += '<div class="samples">' + inBlock +
            '<div class="sample"><div class="lab">' + esc(outLabel) + copyButton(expected.out) + '</div><pre>' + esc(expected.out) + '</pre></div></div>';
        if (!hasInput) {
            break; // 입력이 없는 문제는 예제가 하나뿐
        }
    }
    return html;
}

export function renderProblem(app, problemId) {
    const problem = app.content.byProblem.get(problemId);
    if (!problem) {
        app.router.go('problems');
        return null;
    }
    const firstCase = testCaseOf(problem.tests[0]);
    const fileName = Object.keys(firstCase.files)[0];
    const solved = app.progress.progress.solved[problemId];
    // 알고리즘 문제만 언어를 고를 수 있다. 단원 문제는 C 학습이 목적이라 C로 고정
    const features = app.auth.serverFeatures;
    const savedLang = app.progress.progress.settings.algoLang;
    const language = problem.track && app.judge.supports(savedLang) && isLanguageAvailable(savedLang, features) ? savedLang : LanguageId.C;

    renderShell(app, problem.track ? 'algo' : 'problems',
        crumbsOf(app, problem) +
        '<div class="prob"><article class="panel statement">' +
        '<div><div class="muted code-text" style="font-size:13px">#' + problem.id + ' · ' + levelBadge(problem.level) + '</div><h1>' + esc(problem.title) + '</h1>' +
        '<div class="chips">' + (solved ? '<span class="chip good">' + esc(t('common.solved')) + '</span>' : '') +
        '<span class="chip" title="' + esc(t('prob.timeLimitTitle')) + '">' + esc(t('prob.timeLimit')) + '</span>' +
        '<span class="chip">' + esc(problem.judge ? t('prob.judgeFile', { file: problem.judge }) : t('prob.judgeScreen')) + '</span></div></div>' +
        '<div class="timeline" id="timeline"></div>' +
        '<div class="sec"><h3>' + esc(t('prob.statement')) + '</h3><p>' + esc(problem.desc) + '</p></div>' +
        '<div class="sec"><h3>' + esc(t('prob.input')) + '</h3><p>' + esc(problem.input) + '</p></div>' +
        '<div class="sec"><h3>' + esc(t('prob.output')) + '</h3><p>' + esc(problem.output) + '</p></div>' +
        '<div class="sec">' + sampleBlocks(problem) + '</div>' +
        '<div class="sec"><h3>' + esc(t('prob.hints')) + '</h3><div class="hints" id="hints"></div></div>' +
        '</article><aside class="side">' +
        '<section class="panel editor-panel"><div class="ed-bar">' + languagePicker(problem, language, features) +
        '<button class="btn ghost" id="btn-reset" title="' + esc(t('prob.resetTitle')) + '">' + esc(t('prob.reset')) + '</button>' +
        '<button class="btn" id="btn-run">' + esc(t('prob.runSample')) + '</button>' +
        '<button class="btn primary" id="btn-submit" title="Ctrl+Enter">' + esc(t('prob.submit')) + '</button></div>' +
        '<div id="ed"></div></section>' +
        '<section class="panel run-panel"><details class="custom"><summary>' + esc(t('prob.customSummary')) + '</summary>' +
        '<label class="f" style="margin-top:8px">' + esc(t('prob.customInput')) + '<textarea class="plain" id="custom-in"></textarea></label>' +
        (fileName ? '<label class="f" style="margin-top:8px">' + esc(t('prob.customFile', { file: fileName })) + '<textarea class="plain" id="custom-file">' + esc(firstCase.files[fileName]) + '</textarea></label>' : '') +
        '<button class="btn" id="btn-custom" style="margin-top:8px">' + esc(t('prob.customRun')) + '</button></details>' +
        '<div id="result" aria-live="polite"></div></section></aside></div>');

    const ctx = { app, problem, editor: null, fileName, language };
    mountCodeEditor(ctx);
    if (language !== LanguageId.C) {
        prepareLanguageAsync(ctx);
    }
    if ($('#lang-select')) {
        $('#lang-select').onchange = (e) => switchLanguage(ctx, e.target.value);
    }

    renderTimeline(ctx);
    renderHints(ctx);
    $$('.copy').forEach((button) => {
        button.onclick = () => copyText(button.dataset.copy);
    });
    $('#btn-reset').onclick = () => {
        ctx.editor.set(languageOf(ctx.language).template);
        toast(t('prob.resetDone'));
    };
    $('#btn-run').onclick = () => runSampleAsync(ctx);
    $('#btn-custom').onclick = () => runCustomAsync(ctx);
    $('#btn-submit').onclick = () => submitAsync(ctx);

    // 풀이 시간: 이 화면이 보이는 동안 1초씩 센다
    const timer = setInterval(() => {
        if (document.visibilityState !== 'visible' || app.progress.progress.solved[problemId]) {
            return;
        }
        const spent = app.progress.addSolveSecond(problemId);
        renderTimeline(ctx);
        if (spent === SOLVE_LIMIT_SEC[problem.level]) {
            renderHints(ctx);
        }
    }, 1000);
    return () => {
        clearInterval(timer);
        app.progress.flushAsync();
    };
}

function renderTimeline({ app, problem }) {
    const el = $('#timeline');
    if (!el) {
        return;
    }
    const limit = SOLVE_LIMIT_SEC[problem.level];
    const min = limit / SEC_PER_MIN;
    const spent = app.progress.spentOf(problem.id);
    const solved = app.progress.progress.solved[problem.id];
    const full = XP_BY_LEVEL[problem.level];
    const lateXp = xpForSolve(problem.level, Infinity);
    if (solved) {
        el.className = 'timeline done';
        el.innerHTML = '<div class="tl-head"><span>' + esc(t('prob.solveTime')) + '</span><b>' + fmtMS(solved.time) + '</b></div>' +
            '<div class="tl-note">' + esc(t(solved.late ? 'prob.solvedLate' : 'prob.solvedInTime', { min })) + '</div>';
        return;
    }
    const over = spent > limit;
    const ratio = Math.min(1, spent / limit);
    el.className = 'timeline ' + (over ? 'over' : ratio >= WARN_RATIO ? 'warn' : 'ok');
    el.innerHTML = '<div class="tl-head"><span>' + esc(t('prob.timeHead', { min })) + '</span><b>' + esc(over ? t('prob.over', { t: fmtMS(spent - limit) }) : t('prob.left', { t: fmtMS(limit - spent) })) + '</b></div>' +
        '<div class="tl-bar" role="progressbar" aria-label="' + esc(t('prob.solveTime')) + '" aria-valuemin="0" aria-valuemax="' + limit + '" aria-valuenow="' + Math.min(spent, limit) + '"><i style="width:' + (ratio * 100) + '%"></i><span class="tl-mark" style="left:' + WARN_RATIO * 100 + '%"></span></div>' +
        '<div class="tl-note">' + (over
            ? t('prob.lateNote', { late: lateXp, full })
            : t('prob.inTimeNote', { full, late: lateXp, rate: Math.round(LATE_XP_RATE * 100) })) + '</div>';
}

function renderHints(ctx) {
    const { app, problem } = ctx;
    const box = $('#hints');
    if (!box) {
        return;
    }
    const opened = app.progress.hintLevel(problem.id);
    let html = '';
    for (let i = 0; i < Math.min(opened, problem.hints.length); i++) {
        html += '<div class="hint"><b>' + esc(t('prob.hintN', { n: i + 1 })) + '</b> ' + esc(problem.hints[i]) + '</div>';
    }
    if (opened > problem.hints.length) {
        const lang = ctx.language ?? LanguageId.C;
        const answer = problem.solutions?.[lang] ?? problem.solution;
        const shown = problem.solutions?.[lang] ? languageOf(lang).label : languageOf(LanguageId.C).label;
        html += '<div><div class="muted label">' + esc(t('prob.solutionLabel', { lang: shown })) + '</div><pre class="codeblock">' + highlight(answer) + '</pre></div>';
    } else if (opened < problem.hints.length) {
        html += '<button class="btn" id="btn-hint">' + esc(t('prob.showHint', { n: opened + 1 })) + '</button>';
    } else {
        const can = app.progress.canSeeSolution(problem.id);
        const limit = SOLVE_LIMIT_SEC[problem.level];
        const realTries = app.progress.progress.realTries[problem.id] ?? 0;
        html += '<button class="btn" id="btn-hint" ' + (can ? '' : 'disabled') + '>' + esc(t(can ? 'prob.showSolution' : 'prob.solutionLocked')) + '</button>';
        if (!can) {
            // "2번만 내면 열린다"로 오해하지 않게, 두 조건을 모두 채워야 한다는 것을 나눠서 보여 준다
            const spent = Math.min(app.progress.spentOf(problem.id), limit);
            const mark = (ok) => (ok ? '✔' : '○');
            html += '<div class="sol-lock muted">' + t('prob.lockIntro') +
                '<ul><li>' + mark(spent >= limit) + ' ' + esc(t('prob.lockTime', { min: limit / SEC_PER_MIN, spent: fmtMS(spent), limit: fmtMS(limit) })) + '</li>' +
                '<li>' + mark(realTries >= SOLUTION_MIN_REAL_TRIES) + ' ' + esc(t('prob.lockTries', { need: SOLUTION_MIN_REAL_TRIES, now: Math.min(realTries, SOLUTION_MIN_REAL_TRIES) })) + '</li></ul>' +
                esc(t('prob.lockNote')) + '</div>';
        }
    }
    box.innerHTML = html;
    const button = $('#btn-hint');
    if (button) {
        button.onclick = () => {
            app.progress.openNextHint(problem.id);
            renderHints(ctx);
        };
    }
}

function showResult(html) {
    const el = $('#result');
    if (el) {
        el.innerHTML = html;
    }
}

function codyLine(app, mood, text) {
    const settings = app.progress.progress.settings;
    const motion = mood === 'happy' ? 'bounce' : mood === 'think' ? 'shake' : '';
    return '<div class="cody-react"><div class="c ' + motion + '">' + cody(app.progress.currentForm(), mood, { name: codyNameOf(settings) }) + '</div><div class="bubble">' + esc(text) + '</div></div>';
}

function errorBox(run) {
    const title = t('runError.' + (ERROR_KINDS.has(run.kind) ? run.kind : 'other'));
    return '<div class="result wa"><div class="head">' + esc(title) + '</div><div>' + lineNear(run.line) + runText(run.message) + '</div>' +
        (run.output ? '<div class="muted label">' + esc(t('prob.outputBeforeStop')) + '</div><pre class="outbox">' + esc(run.output) + '</pre>' : '') + '</div>';
}

function showRun({ problem }, run, expected) {
    if (!run.ok) {
        showResult(errorBox(run));
        return;
    }
    const out = problem.judge ? (run.files[problem.judge] ?? t('prob.noFile')) : run.output;
    const same = expected
        ? (normalizeOutput(out) === normalizeOutput(expected.out) ? '<span class="chip good">' + esc(t('prob.sameAsSample')) + '</span>' : '<span class="chip bad">' + esc(t('prob.diffFromSample')) + '</span>')
        : '';
    showResult('<div class="result info"><div class="head">' + esc(t('prob.runResult')) + same + '</div>' +
        (problem.judge ? '<div class="muted label">' + esc(t('prob.fileContent', { file: problem.judge })) + '</div>' : '') + '<pre class="outbox">' + esc(out || t('common.noOutput')) + '</pre>' +
        (problem.judge && run.output ? '<div class="muted label">' + esc(t('prob.screenOutput')) + '</div><pre class="outbox">' + esc(run.output) + '</pre>' : '') +
        '<div class="muted" style="font-size:12.5px">' + esc(t('prob.runNotRecorded')) + '</div></div>');
}

async function runSampleAsync(ctx) {
    showResult('<div class="result info"><div class="head">' + esc(t('prob.runningSample')) + '</div></div>');
    const testCase = testCaseOf(ctx.problem.tests[0]);
    const run = await ctx.app.judge.runAsync(ctx.editor.get(), testCase.input, testCase.files, ctx.language);
    showRun(ctx, run, ctx.problem.expected[0]);
}

async function runCustomAsync(ctx) {
    const files = {};
    if (ctx.fileName) {
        files[ctx.fileName] = $('#custom-file').value;
    }
    showResult('<div class="result info"><div class="head">' + esc(t('prob.running')) + '</div></div>');
    const run = await ctx.app.judge.runAsync(ctx.editor.get(), $('#custom-in').value, files, ctx.language);
    showRun(ctx, run, null);
}

function languagePicker(problem, language, features) {
    if (!problem.track) {
        return '<span class="lang" title="' + esc(t('prob.langFixedTitle')) + '">' + esc(t('prob.langFixed')) + '</span>';
    }
    const options = LANGUAGES.map((lang) => {
        const available = isLanguageAvailable(lang.id, features);
        const note = lang.paid ? t(available ? 'prob.paid' : 'prob.paidSoon') : '';
        return '<option value="' + lang.id + '"' + (lang.id === language ? ' selected' : '') + (available ? '' : ' disabled') + '>' + esc(lang.label + note) + '</option>';
    }).join('');
    return '<label class="lang lang-pick">' + esc(t('lang.label')) + ' <select id="lang-select" aria-label="' + esc(t('prob.langAria')) + '">' + options + '</select></label>';
}

function mountCodeEditor(ctx) {
    const { app, problem } = ctx;
    const language = ctx.language;
    ctx.editor = mountEditor($('#ed'), app.progress.codeOf(problem.id, language),
        (code) => app.progress.saveCode(problem.id, code, language), () => $('#btn-submit').click(), languageOf(language).label);
}

function switchLanguage(ctx, language) {
    ctx.language = language;
    ctx.app.progress.updateSettings({ algoLang: language });
    mountCodeEditor(ctx);
    renderHints(ctx);
    showResult('');
    if (language !== LanguageId.C) {
        prepareLanguageAsync(ctx);
    }
}

/** Python은 처음에 실행기를 받아 와야 해서, 고르는 순간 미리 준비하고 상태를 보여 준다 */
async function prepareLanguageAsync(ctx) {
    const language = ctx.language;
    if (language !== LanguageId.PYTHON) {
        return;
    }
    const buttons = ['#btn-run', '#btn-submit', '#btn-custom'].map((sel) => $(sel)).filter(Boolean);
    buttons.forEach((b) => {
        b.disabled = true;
    });
    showResult('<div class="result info"><div class="head">' + esc(t('prob.pyPreparing')) + '</div><div class="muted" style="font-size:13px">' + esc(t('prob.pyFirst')) + '</div></div>');
    try {
        await ctx.app.judge.prepareAsync(language);
        if (ctx.language === language) {
            showResult('<div class="result info"><div class="head">' + esc(t('prob.pyReady')) + '</div><div class="muted" style="font-size:13px">' + esc(t('prob.pyReadyNote')) + '</div></div>');
        }
    } catch (e) {
        showResult('<div class="result wa"><div class="head">' + esc(t('prob.pyFailed')) + '</div><div>' + esc(t('prob.pyFailedNote')) + '</div></div>');
    } finally {
        buttons.forEach((b) => {
            b.disabled = false;
        });
    }
}

function crumbsOf(app, problem) {
    if (problem.track) {
        const track = app.content.byTrack.get(problem.track);
        return '<div class="crumbs"><a href="#algo">' + esc(t('nav.algo')) + '</a> › <a href="#algo-' + track.track + '">' + esc(track.name) + '</a> › ' + problem.id + '</div>';
    }
    const chapter = app.content.byChapter.get(problem.ch);
    return '<div class="crumbs"><a href="#map">' + esc(t('nav.map')) + '</a> › <a href="#ch' + problem.ch + '">' + esc(t('prob.crumbChapter', { n: problem.ch, title: chapter.title })) + '</a> › ' + problem.id + '</div>';
}

/** 단원 문제는 별, 알고리즘 문제는 단계 배지 */
export function levelBadge(level) {
    if (isAlgorithmLevel(level)) {
        return '<span class="tier t' + level + '">' + esc(t('tier.' + level)) + '</span>';
    }
    return '<span class="stars">' + starStr(level) + '</span>';
}

function nextButtons(app, problem) {
    if (problem.track) {
        const track = app.content.byTrack.get(problem.track);
        const p = app.progress.progress;
        const index = track.problems.indexOf(problem);
        const next = track.problems.slice(index + 1).find((x) => !p.solved[x.id]) ?? track.problems.find((x) => !p.solved[x.id]);
        return (next ? '<a class="btn primary" href="#p' + next.id + '">' + esc(t('prob.nextProblem', { id: next.id })) + '</a>' : '') +
            '<a class="btn" href="#algo-' + track.track + '">' + esc(t('prob.toTrack', { track: track.name })) + '</a>';
    }
    const chapter = app.content.byChapter.get(problem.ch);
    const p = app.progress.progress;
    const index = chapter.problems.indexOf(problem);
    const next = chapter.problems.slice(index + 1).find((x) => !p.solved[x.id]) ?? chapter.problems.find((x) => !p.solved[x.id]);
    return (next ? '<a class="btn primary" href="#p' + next.id + '">' + esc(t('prob.nextProblem', { id: next.id })) + '</a>' : '<a class="btn primary" href="#quiz' + problem.ch + '">' + esc(t('prob.chapterQuiz', { n: problem.ch })) + '</a>') +
        '<a class="btn" href="#ch' + problem.ch + '">' + esc(t('prob.toChapter')) + '</a>';
}

async function submitAsync(ctx) {
    const { app, problem, editor, language } = ctx;
    const code = editor.get();
    const button = $('#btn-submit');
    button.disabled = true;
    showResult('<div class="result info"><div class="head">' + esc(t('prob.judging')) + '</div></div>');
    let judged;
    try {
        judged = await app.judge.judgeAsync(problem, code, language);
    } catch (e) {
        showResult('<div class="result wa"><div class="head">' + esc(t('prob.judgeFailed')) + '</div><div>' + esc(t('prob.judgeFailedNote')) + '</div></div>');
        return;
    } finally {
        button.disabled = false;
    }

    const recorded = app.progress.recordSubmission(problem.id, judged.verdict, code, language);
    if (judged.verdict === Verdict.AC) {
        app.sound.play('correct');
        const spent = app.progress.spentOf(problem.id);
        const note = recorded.gainedXp
            ? (recorded.late ? t('prob.lateXp', { rate: Math.round(LATE_XP_RATE * 100) }) : t('prob.fullXp', { t: fmtMS(spent) }))
            : '';
        showResult('<div class="result ac"><div class="head">' + verdictLabel(judged.verdict) + (recorded.gainedXp ? ' <span class="chip accent">+' + recorded.gainedXp + ' XP</span>' : '') + '</div>' +
            (note ? '<div style="font-size:13.5px">' + esc(note) + '</div>' : '') + codyLine(app, 'happy', pick(CHEER.ac)) +
            '<div class="row-buttons">' + nextButtons(app, problem) + '</div></div>');
        renderTimeline(ctx);
    } else {
        app.sound.play('wrong');
        let body;
        if (judged.verdict === Verdict.WA) {
            const files = judged.testCase.files;
            const input = Object.keys(files).length ? Object.entries(files).map(([k, v]) => k + ':\n' + v).join('\n') : judged.testCase.input;
            body = '<div>' + esc(t('prob.wrongAt', { n: judged.testIndex + 1 }) + (judged.missingFile ? t('prob.missingFile', { file: problem.judge }) : '')) + '</div>' +
                '<div class="muted label">' + esc(t('prob.inputLabel')) + '</div><pre class="outbox">' + esc(input || t('common.none')) + '</pre>' +
                '<div class="diff"><div><div class="muted label">' + esc(t('prob.myOutput')) + '</div><pre>' + esc(judged.got || t('common.noOutput')) + '</pre></div>' +
                '<div><div class="muted label">' + esc(t('prob.expectedOutput')) + '</div><pre>' + esc(judged.expected) + '</pre></div></div>';
        } else {
            body = '<div>' + lineNear(judged.line) + runText(judged.message) + '</div>';
        }
        // AI 힌트 버튼: 기능이 켜졌을 때만 보인다 (지금은 숨김)
        const hintButton = app.hint.enabled ? '<button class="btn" id="btn-ai">' + esc(t('prob.aiHint')) + '</button><div id="ai-out"></div>' : '';
        showResult('<div class="result wa"><div class="head">' + verdictLabel(judged.verdict) + '</div>' + body + codyLine(app, 'think', pick(CHEER.wa)) + hintButton + '</div>');
        if ($('#btn-ai')) {
            $('#btn-ai').onclick = () => requestAiHintAsync(ctx, code, judged);
        }
        renderHints(ctx);
    }
    await celebrateAsync(app, recorded.events);
}

async function requestAiHintAsync({ app, problem }, code, judged) {
    const out = $('#ai-out');
    const button = $('#btn-ai');
    button.disabled = true;
    out.innerHTML = '<div class="ai-box">' + esc(t('prob.aiReading')) + '</div>';
    // AI 에게 보내는 설명은 한국어 그대로 (서버 쪽 힌트 규칙이 한국어 기준)
    const judgeText = judged.verdict === Verdict.WA
        ? '틀린 테스트 입력:\n' + judged.testCase.input + '\n학생 출력:\n' + judged.got + '\n기대 출력:\n' + judged.expected
        : judged.label + ': ' + (judged.line ? judged.line + '번째 줄 근처, ' : '') + judged.message;
    const result = await app.hint.requestHintAsync(problem, code, judgeText, app.progress.progress.settings.codyName);
    $('.ai-box', out).textContent = result instanceof Failure ? messageOf(result.error) : result.data;
    button.disabled = false;
}
