// 문제 풀이 화면: 문제(정올·백준 형식) + 풀이 타임라인 + 에디터 + 채점 결과
import { $, $$, esc, fmtMS, copyText, toast } from '../ui/dom.js';
import { cody, CHEER, pick } from '../ui/cody.js';
import { mountEditor, highlight } from '../ui/editor.js';
import { Failure } from '../core/result.js';
import { messageOf } from '../core/app-error.js';
import { renderShell } from './shell.js';
import { celebrateAsync } from './celebrate.js';
import { starStr } from './map-views.js';
import { DEFAULT_CODE, SOLUTION_MIN_REAL_TRIES } from '../services/progress-service.js';
import { Verdict, normalizeOutput, testCaseOf } from '../services/judge-service.js';
import { SOLVE_LIMIT_SEC, XP_BY_LEVEL, LATE_XP_RATE, xpForSolve, isAlgorithmLevel, TIER_NAMES } from '../domain/progress-rules.js';

const MAX_SAMPLES = 2;
const WARN_RATIO = 0.8;
const ERROR_TITLE = Object.freeze({ compile: '컴파일 에러', runtime: '런타임 에러', tle: '시간 초과', ole: '출력 초과' });

function sampleBlocks(problem) {
    let html = '';
    for (let i = 0; i < Math.min(MAX_SAMPLES, problem.tests.length); i++) {
        const testCase = testCaseOf(problem.tests[i]);
        const expected = problem.expected[i];
        const fileIn = Object.keys(testCase.files)[0];
        const inText = fileIn ? testCase.files[fileIn] : testCase.input;
        const hasInput = Boolean(fileIn) || testCase.input !== '';
        const inBlock = hasInput
            ? '<div class="sample"><div class="lab">' + (fileIn ? '예제 ' + fileIn + ' ' : '예제 입력 ') + (i + 1) + '<button class="copy" data-copy="' + esc(inText) + '">복사</button></div><pre>' + esc(inText) + '</pre></div>'
            : '<div class="sample"><div class="lab">예제 입력 ' + (i + 1) + '</div><pre class="muted">(입력 없음)</pre></div>';
        const outLabel = problem.judge ? '예제 ' + problem.judge + ' ' + (i + 1) : '예제 출력 ' + (i + 1);
        html += '<div class="samples">' + inBlock +
            '<div class="sample"><div class="lab">' + outLabel + '<button class="copy" data-copy="' + esc(expected.out) + '">복사</button></div><pre>' + esc(expected.out) + '</pre></div></div>';
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

    renderShell(app, problem.track ? 'algo' : 'problems',
        crumbsOf(app, problem) +
        '<div class="prob"><article class="panel statement">' +
        '<div><div class="muted code-text" style="font-size:13px">#' + problem.id + ' · ' + levelBadge(problem.level) + '</div><h1>' + esc(problem.title) + '</h1>' +
        '<div class="chips">' + (solved ? '<span class="chip good">정답</span>' : '') +
        '<span class="chip" title="제출한 프로그램이 한 번 실행될 때 3초 안에 끝나야 해요">실행 시간 3초</span>' +
        '<span class="chip">' + (problem.judge ? '채점: ' + problem.judge : '채점: 화면 출력') + '</span></div></div>' +
        '<div class="timeline" id="timeline"></div>' +
        '<div class="sec"><h3>문제</h3><p>' + esc(problem.desc) + '</p></div>' +
        '<div class="sec"><h3>입력</h3><p>' + esc(problem.input) + '</p></div>' +
        '<div class="sec"><h3>출력</h3><p>' + esc(problem.output) + '</p></div>' +
        '<div class="sec">' + sampleBlocks(problem) + '</div>' +
        '<div class="sec"><h3>힌트</h3><div class="hints" id="hints"></div></div>' +
        '</article><aside class="side">' +
        '<section class="panel editor-panel"><div class="ed-bar"><span class="lang" title="C11 표준 문법 기준으로 채점해요">언어: C (C11)</span>' +
        '<button class="btn ghost" id="btn-reset" title="처음 코드로 되돌리기">초기화</button>' +
        '<button class="btn" id="btn-run">예제 실행</button>' +
        '<button class="btn primary" id="btn-submit" title="Ctrl+Enter">제출</button></div>' +
        '<div id="ed"></div></section>' +
        '<section class="panel run-panel"><details class="custom"><summary>직접 입력해서 실행해 보기</summary>' +
        '<label class="f" style="margin-top:8px">키보드 입력<textarea class="plain" id="custom-in"></textarea></label>' +
        (fileName ? '<label class="f" style="margin-top:8px">' + fileName + ' 내용<textarea class="plain" id="custom-file">' + esc(firstCase.files[fileName]) + '</textarea></label>' : '') +
        '<button class="btn" id="btn-custom" style="margin-top:8px">이 입력으로 실행</button></details>' +
        '<div id="result" aria-live="polite"></div></section></aside></div>');

    const editor = mountEditor($('#ed'), app.progress.codeOf(problemId), (code) => app.progress.saveCode(problemId, code), () => $('#btn-submit').click());
    const ctx = { app, problem, editor, fileName };

    renderTimeline(ctx);
    renderHints(ctx);
    $$('.copy').forEach((button) => {
        button.onclick = () => copyText(button.dataset.copy);
    });
    $('#btn-reset').onclick = () => {
        editor.set(DEFAULT_CODE);
        toast('처음 코드로 되돌렸어요.');
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
    const spent = app.progress.spentOf(problem.id);
    const solved = app.progress.progress.solved[problem.id];
    const full = XP_BY_LEVEL[problem.level];
    const lateXp = xpForSolve(problem.level, Infinity);
    if (solved) {
        el.className = 'timeline done';
        el.innerHTML = '<div class="tl-head"><span>풀이 시간</span><b>' + fmtMS(solved.time) + '</b></div>' +
            '<div class="tl-note">' + (solved.late ? '제한 시간(' + limit / 60 + '분)을 넘겨 풀었어요.' : '제한 시간(' + limit / 60 + '분) 안에 풀었어요!') + '</div>';
        return;
    }
    const over = spent > limit;
    const ratio = Math.min(1, spent / limit);
    el.className = 'timeline ' + (over ? 'over' : ratio >= WARN_RATIO ? 'warn' : 'ok');
    el.innerHTML = '<div class="tl-head"><span>풀이 시간 · 제한 ' + limit / 60 + '분</span><b>' + (over ? '+' + fmtMS(spent - limit) + ' 초과' : fmtMS(limit - spent) + ' 남음') + '</b></div>' +
        '<div class="tl-bar" role="progressbar" aria-label="풀이 시간" aria-valuemin="0" aria-valuemax="' + limit + '" aria-valuenow="' + Math.min(spent, limit) + '"><i style="width:' + (ratio * 100) + '%"></i><span class="tl-mark" style="left:' + WARN_RATIO * 100 + '%"></span></div>' +
        '<div class="tl-note">' + (over
            ? '시간이 지나도 계속 풀 수 있어요. 지금 맞히면 <b>+' + lateXp + ' XP</b> (원래 ' + full + ' XP)'
            : '시간 안에 맞히면 <b>+' + full + ' XP</b>, 넘기면 +' + lateXp + ' XP (' + Math.round(LATE_XP_RATE * 100) + '%)') + '</div>';
}

function renderHints({ app, problem }) {
    const box = $('#hints');
    if (!box) {
        return;
    }
    const opened = app.progress.hintLevel(problem.id);
    let html = '';
    for (let i = 0; i < Math.min(opened, problem.hints.length); i++) {
        html += '<div class="hint"><b>힌트 ' + (i + 1) + '</b> ' + esc(problem.hints[i]) + '</div>';
    }
    if (opened > problem.hints.length) {
        html += '<div><div class="muted label">모범 답안 (먼저 스스로 고쳐 본 다음 비교해 보세요)</div><pre class="codeblock">' + highlight(problem.solution) + '</pre></div>';
    } else if (opened < problem.hints.length) {
        html += '<button class="btn" id="btn-hint">힌트 ' + (opened + 1) + ' 보기</button>';
    } else {
        const can = app.progress.canSeeSolution(problem.id);
        const limit = SOLVE_LIMIT_SEC[problem.level];
        const realTries = app.progress.progress.realTries[problem.id] ?? 0;
        html += '<button class="btn" id="btn-hint" ' + (can ? '' : 'disabled') + '>' + (can ? '모범 답안 보기' : '모범 답안은 아직 잠겨 있어요') + '</button>';
        if (!can) {
            html += '<div class="muted" style="font-size:13px">정답을 맞히거나, 제한 시간(' + limit / 60 + '분)이 지난 뒤 직접 쓴 코드로 ' + SOLUTION_MIN_REAL_TRIES + '번 이상 제출하면 열려요. ' +
                '지금: 제출 ' + Math.min(realTries, SOLUTION_MIN_REAL_TRIES) + '/' + SOLUTION_MIN_REAL_TRIES + ', 시간 ' + fmtMS(Math.min(app.progress.spentOf(problem.id), limit)) + ' / ' + fmtMS(limit) + '</div>';
        }
    }
    box.innerHTML = html;
    const button = $('#btn-hint');
    if (button) {
        button.onclick = () => {
            app.progress.openNextHint(problem.id);
            renderHints({ app, problem });
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
    return '<div class="cody-react"><div class="c ' + motion + '">' + cody(app.progress.currentForm(), mood, { name: settings.codyName }) + '</div><div class="bubble">' + esc(text) + '</div></div>';
}

function errorBox(run) {
    return '<div class="result wa"><div class="head">' + (ERROR_TITLE[run.kind] ?? '실행 오류') + '</div><div>' + (run.line ? '<b>' + run.line + '번째 줄</b> 근처: ' : '') + esc(run.message) + '</div>' +
        (run.output ? '<div class="muted label">멈추기 전까지의 출력</div><pre class="outbox">' + esc(run.output) + '</pre>' : '') + '</div>';
}

function showRun({ problem }, run, expected) {
    if (!run.ok) {
        showResult(errorBox(run));
        return;
    }
    const out = problem.judge ? (run.files[problem.judge] ?? '(파일이 만들어지지 않았어요)') : run.output;
    const same = expected
        ? (normalizeOutput(out) === normalizeOutput(expected.out) ? '<span class="chip good">예제 출력과 같아요</span>' : '<span class="chip bad">예제 출력과 달라요</span>')
        : '';
    showResult('<div class="result info"><div class="head">실행 결과 ' + same + '</div>' +
        (problem.judge ? '<div class="muted label">' + problem.judge + ' 내용</div>' : '') + '<pre class="outbox">' + esc(out || '(출력 없음)') + '</pre>' +
        (problem.judge && run.output ? '<div class="muted label">화면 출력</div><pre class="outbox">' + esc(run.output) + '</pre>' : '') +
        '<div class="muted" style="font-size:12.5px">예제 실행은 기록되지 않아요. 다 됐으면 제출하세요.</div></div>');
}

async function runSampleAsync(ctx) {
    showResult('<div class="result info"><div class="head">예제 실행 중…</div></div>');
    const testCase = testCaseOf(ctx.problem.tests[0]);
    const run = await ctx.app.judge.runAsync(ctx.editor.get(), testCase.input, testCase.files);
    showRun(ctx, run, ctx.problem.expected[0]);
}

async function runCustomAsync(ctx) {
    const files = {};
    if (ctx.fileName) {
        files[ctx.fileName] = $('#custom-file').value;
    }
    showResult('<div class="result info"><div class="head">실행 중…</div></div>');
    const run = await ctx.app.judge.runAsync(ctx.editor.get(), $('#custom-in').value, files);
    showRun(ctx, run, null);
}

function crumbsOf(app, problem) {
    if (problem.track) {
        const track = app.content.byTrack.get(problem.track);
        return '<div class="crumbs"><a href="#algo">알고리즘</a> › <a href="#algo-' + track.track + '">' + esc(track.name) + '</a> › ' + problem.id + '</div>';
    }
    const chapter = app.content.byChapter.get(problem.ch);
    return '<div class="crumbs"><a href="#map">학습 지도</a> › <a href="#ch' + problem.ch + '">' + problem.ch + '단원 ' + esc(chapter.title) + '</a> › ' + problem.id + '</div>';
}

/** 단원 문제는 별, 알고리즘 문제는 단계 배지 */
export function levelBadge(level) {
    if (isAlgorithmLevel(level)) {
        return '<span class="tier t' + level + '">' + TIER_NAMES[level] + '</span>';
    }
    return '<span class="stars">' + starStr(level) + '</span>';
}

function nextButtons(app, problem) {
    if (problem.track) {
        const track = app.content.byTrack.get(problem.track);
        const p = app.progress.progress;
        const index = track.problems.indexOf(problem);
        const next = track.problems.slice(index + 1).find((x) => !p.solved[x.id]) ?? track.problems.find((x) => !p.solved[x.id]);
        return (next ? '<a class="btn primary" href="#p' + next.id + '">다음 문제 ' + next.id + '</a>' : '') +
            '<a class="btn" href="#algo-' + track.track + '">' + esc(track.name) + ' 목록으로</a>';
    }
    const chapter = app.content.byChapter.get(problem.ch);
    const p = app.progress.progress;
    const index = chapter.problems.indexOf(problem);
    const next = chapter.problems.slice(index + 1).find((x) => !p.solved[x.id]) ?? chapter.problems.find((x) => !p.solved[x.id]);
    return (next ? '<a class="btn primary" href="#p' + next.id + '">다음 문제 ' + next.id + '</a>' : '<a class="btn primary" href="#quiz' + problem.ch + '">' + problem.ch + '단원 퀴즈 풀기</a>') +
        '<a class="btn" href="#ch' + problem.ch + '">단원으로</a>';
}

async function submitAsync(ctx) {
    const { app, problem, editor } = ctx;
    const code = editor.get();
    const button = $('#btn-submit');
    button.disabled = true;
    showResult('<div class="result info"><div class="head">채점 중…</div></div>');
    let judged;
    try {
        judged = await app.judge.judgeAsync(problem, code);
    } catch (e) {
        showResult('<div class="result wa"><div class="head">채점 중 문제가 생겼어요</div><div>잠시 뒤 다시 제출해 주세요.</div></div>');
        return;
    } finally {
        button.disabled = false;
    }

    const recorded = app.progress.recordSubmission(problem.id, judged.verdict, code);
    if (judged.verdict === Verdict.AC) {
        app.sound.play('correct');
        const spent = app.progress.spentOf(problem.id);
        const note = recorded.gainedXp
            ? (recorded.late ? '제한 시간을 넘겨서 XP를 ' + Math.round(LATE_XP_RATE * 100) + '%만 받았어요. 다음 문제는 시간 안에 도전해 봐요!' : '제한 시간 안에 풀어서 XP를 모두 받았어요! (' + fmtMS(spent) + ' 걸림)')
            : '';
        showResult('<div class="result ac"><div class="head">' + judged.label + (recorded.gainedXp ? ' <span class="chip accent">+' + recorded.gainedXp + ' XP</span>' : '') + '</div>' +
            (note ? '<div style="font-size:13.5px">' + note + '</div>' : '') + codyLine(app, 'happy', pick(CHEER.ac)) +
            '<div class="row-buttons">' + nextButtons(app, problem) + '</div></div>');
        renderTimeline(ctx);
    } else {
        app.sound.play('wrong');
        let body;
        if (judged.verdict === Verdict.WA) {
            const files = judged.testCase.files;
            const input = Object.keys(files).length ? Object.entries(files).map(([k, v]) => k + ':\n' + v).join('\n') : judged.testCase.input;
            body = '<div>' + (judged.testIndex + 1) + '번째 테스트에서 틀렸어요.' + (judged.missingFile ? ' ' + problem.judge + ' 파일이 만들어지지 않았어요. fopen 과 fclose 를 확인하세요.' : '') + '</div>' +
                '<div class="muted label">입력</div><pre class="outbox">' + esc(input || '(없음)') + '</pre>' +
                '<div class="diff"><div><div class="muted label">내 출력</div><pre>' + esc(judged.got || '(출력 없음)') + '</pre></div>' +
                '<div><div class="muted label">기대 출력</div><pre>' + esc(judged.expected) + '</pre></div></div>';
        } else {
            body = '<div>' + (judged.line ? '<b>' + judged.line + '번째 줄</b> 근처: ' : '') + esc(judged.message) + '</div>';
        }
        // AI 힌트 버튼: 기능이 켜졌을 때만 보인다 (지금은 숨김)
        const hintButton = app.hint.enabled ? '<button class="btn" id="btn-ai">코디에게 AI 힌트 받기</button><div id="ai-out"></div>' : '';
        showResult('<div class="result wa"><div class="head">' + judged.label + '</div>' + body + codyLine(app, 'think', pick(CHEER.wa)) + hintButton + '</div>');
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
    out.innerHTML = '<div class="ai-box">코디가 코드를 읽고 있어요…</div>';
    const judgeText = judged.verdict === Verdict.WA
        ? '틀린 테스트 입력:\n' + judged.testCase.input + '\n학생 출력:\n' + judged.got + '\n기대 출력:\n' + judged.expected
        : judged.label + ': ' + (judged.line ? judged.line + '번째 줄 근처, ' : '') + judged.message;
    const result = await app.hint.requestHintAsync(problem, code, judgeText, app.progress.progress.settings.codyName);
    $('.ai-box', out).textContent = result instanceof Failure ? messageOf(result.error) : result.data;
    button.disabled = false;
}
