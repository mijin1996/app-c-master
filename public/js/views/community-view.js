// 커뮤니티 화면: 회원이 낸 문제 목록, 문제 내기, 문제 풀기 + 토론(댓글 · 좋아요 · 채택 · 신고)
import { $, $$, esc, toast } from '../ui/dom.js';
import { mountEditor } from '../ui/editor.js';
import { makeFuseUndoButton } from '../ui/effects.js';
import { Failure } from '../core/result.js';
import { messageOf } from '../core/app-error.js';
import { renderShell } from './shell.js';
import { levelBadge } from './problem-view.js';
import { COMMUNITY_LIMITS, DIFFICULTY_LEVELS } from '../domain/community-rules.js';
import { TIER_NAMES } from '../domain/progress-rules.js';
import { LANGUAGES, LanguageId, languageOf, isLanguageAvailable } from '../domain/languages.js';
import { Verdict, normalizeOutput } from '../services/judge-service.js';
import { judgeableOf } from '../services/learning-services.js';

const listState = { sort: 'new', page: 0 };

const failText = (result) => esc(result.detail || messageOf(result.error));

function dateOf(ms) {
    const d = new Date(ms);
    return (d.getMonth() + 1) + '/' + d.getDate();
}

/** 여러 줄 글을 안전하게 보여 준다. ``` 로 감싼 부분은 코드 상자로 */
function richText(text) {
    return String(text).split(/```/).map((part, i) => (i % 2 === 1
        ? '<pre class="codeblock small">' + esc(part.replace(/^\w*\n/, '')) + '</pre>'
        : '<p class="pre-wrap">' + esc(part.trim()) + '</p>')).join('');
}

// ---------- 목록 ----------
export async function renderCommunityList(app) {
    renderShell(app, 'community',
        '<div class="view-title"><h1>커뮤니티</h1><a class="btn primary" href="#community-new">문제 내기</a></div>' +
        '<section class="panel pad comm-intro">친구들이 직접 낸 문제를 풀고, 맞고 틀림을 댓글로 함께 의논해요. 좋은 문제와 답변에는 좋아요를, 문제 낸 사람은 가장 도움이 된 답변을 <b>채택</b>할 수 있어요. ' +
        '<span class="muted">문제를 풀어도 XP는 오르지 않아요 (내 문제로 점수 올리기 방지).</span></section>' +
        '<div class="tabs comm-tabs" role="tablist"><button type="button" data-sort="new">최신</button><button type="button" data-sort="popular">인기</button></div>' +
        '<section class="panel" id="comm-list"><div class="pad muted">불러오는 중이에요…</div></section>' +
        '<div class="pager"><button class="btn" id="pg-prev">이전</button><span id="pg-no"></span><button class="btn" id="pg-next">다음</button></div>');
    $$('[data-sort]').forEach((button) => {
        button.classList.toggle('on', button.dataset.sort === listState.sort);
        button.onclick = () => {
            listState.sort = button.dataset.sort;
            listState.page = 0;
            renderCommunityList(app);
        };
    });
    $('#pg-prev').onclick = () => {
        listState.page = Math.max(0, listState.page - 1);
        renderCommunityList(app);
    };
    $('#pg-next').onclick = () => {
        listState.page++;
        renderCommunityList(app);
    };
    $('#pg-no').textContent = (listState.page + 1) + '쪽';
    $('#pg-prev').disabled = listState.page === 0;

    const listed = await app.community.listAsync(listState.sort, listState.page);
    const box = $('#comm-list');
    if (!box) {
        return;
    }
    if (listed instanceof Failure) {
        box.innerHTML = '<div class="pad">' + failText(listed) + '</div>';
        return;
    }
    $('#pg-next').disabled = listed.data.length < COMMUNITY_LIMITS.pageSize;
    if (listed.data.length === 0) {
        box.innerHTML = '<div class="pad">' + (listState.page === 0 ? '아직 올라온 문제가 없어요. 첫 문제를 내 볼까요?' : '더 이상 문제가 없어요.') + '</div>';
        return;
    }
    box.innerHTML = '<div class="tbl-wrap"><table class="comm-table"><thead><tr><th>제목</th><th>단계</th><th>낸 사람</th><th class="num">좋아요</th><th class="num">댓글</th><th>날짜</th></tr></thead><tbody>' +
        listed.data.map((p) => '<tr class="' + (p.hidden ? 'is-hidden' : '') + '"><td><a href="#c' + p.id + '">' + esc(p.title) + '</a>' +
            (p.hidden ? ' <span class="chip bad">숨김</span>' : '') + (p.mine ? ' <span class="chip accent">내 문제</span>' : '') + '</td>' +
            '<td>' + levelBadge(p.difficulty) + '</td><td>' + esc(p.author) + '</td>' +
            '<td class="num">' + (p.liked ? '♥ ' : '♡ ') + p.likes + '</td><td class="num">' + p.comments + '</td><td class="muted">' + dateOf(p.createdAt) + '</td></tr>').join('') +
        '</tbody></table></div>';
}

// ---------- 문제 내기 ----------
function testRow(index, test = { input: '', output: '' }) {
    return '<div class="test-row" data-index="' + index + '"><div class="test-head"><b>테스트 ' + (index + 1) + '</b>' +
        '<button type="button" class="btn ghost small" data-remove>지우기</button></div>' +
        '<div class="test-grid"><label class="f">입력<textarea class="plain" data-in>' + esc(test.input) + '</textarea></label>' +
        '<label class="f">정답 출력<textarea class="plain" data-out>' + esc(test.output) + '</textarea></label></div></div>';
}

export function renderCommunityNew(app) {
    const L = COMMUNITY_LIMITS;
    renderShell(app, 'community',
        '<div class="crumbs"><a href="#community">커뮤니티</a> › 문제 내기</div>' +
        '<form class="panel pad comm-form" id="new-form" novalidate><h1>문제 내기</h1>' +
        '<p class="muted">직접 만든 문제만 올려 주세요. 책·대회·다른 사이트의 문제를 그대로 옮기면 저작권 문제가 생길 수 있어요.</p>' +
        '<label class="f">제목<input type="text" id="n-title" maxlength="' + L.titleMax + '" placeholder="예: 두 수의 차"></label>' +
        '<label class="f">단계<select id="n-diff">' + DIFFICULTY_LEVELS.map((lv) => '<option value="' + lv + '">' + TIER_NAMES[lv] + '</option>').join('') + '</select></label>' +
        '<label class="f">문제 설명<textarea class="plain" id="n-body" maxlength="' + L.bodyMax + '" rows="6"></textarea></label>' +
        '<label class="f">입력 설명<textarea class="plain" id="n-in" maxlength="' + L.specMax + '" rows="2"></textarea></label>' +
        '<label class="f">출력 설명<textarea class="plain" id="n-out" maxlength="' + L.specMax + '" rows="2"></textarea></label>' +
        '<div class="sec"><h3>테스트</h3><p class="muted small">채점에 쓰는 입력과 정답 출력이에요 (최대 ' + L.testsMax + '개). 앞의 몇 개는 예제로 보여 줘요. 줄 끝 공백은 무시하고 채점해요.</p>' +
        '<div id="tests">' + testRow(0) + '</div><button type="button" class="btn" id="add-test">테스트 추가</button>' +
        '<label class="f" style="margin-top:10px">예제로 보여 줄 개수<select id="n-examples"><option>1</option><option>2</option><option>3</option></select></label></div>' +
        '<div class="err" id="n-err" role="alert"></div>' +
        '<button class="btn primary" type="submit" id="n-submit">올리기</button></form>');

    const renumber = () => {
        $$('.test-row').forEach((row, i) => {
            row.dataset.index = i;
            $('b', row).textContent = '테스트 ' + (i + 1);
        });
        $('#add-test').disabled = $$('.test-row').length >= L.testsMax;
    };
    const bindRemove = () => {
        $$('[data-remove]').forEach((button) => {
            button.onclick = () => {
                if ($$('.test-row').length > 1) {
                    button.closest('.test-row').remove();
                    renumber();
                }
            };
        });
    };
    bindRemove();
    $('#add-test').onclick = () => {
        $('#tests').insertAdjacentHTML('beforeend', testRow($$('.test-row').length));
        bindRemove();
        renumber();
    };
    $('#new-form').onsubmit = async (event) => {
        event.preventDefault();
        const draft = {
            title: $('#n-title').value,
            difficulty: Number($('#n-diff').value),
            body: $('#n-body').value,
            inputSpec: $('#n-in').value,
            outputSpec: $('#n-out').value,
            exampleCount: Number($('#n-examples').value),
            tests: $$('.test-row').map((row) => ({ input: $('[data-in]', row).value, output: $('[data-out]', row).value })),
        };
        const button = $('#n-submit');
        button.disabled = true;
        const created = await app.community.createAsync(draft);
        button.disabled = false;
        if (created instanceof Failure) {
            $('#n-err').textContent = created.detail || messageOf(created.error);
            return;
        }
        toast('문제를 올렸어요!');
        app.router.go('c' + created.data);
    };
}

// ---------- 문제 풀기 + 토론 ----------
export async function renderCommunityProblem(app, id) {
    renderShell(app, 'community', '<div class="crumbs"><a href="#community">커뮤니티</a> › 문제</div><section class="panel pad muted" id="cp">불러오는 중이에요…</section>');
    const loaded = await app.community.getAsync(id);
    if (!$('#cp')) {
        return;
    }
    if (loaded instanceof Failure) {
        $('#cp').outerHTML = '<section class="panel pad">' + failText(loaded) + ' <a href="#community">목록으로</a></section>';
        return;
    }
    const problem = loaded.data;
    const examples = problem.tests.slice(0, problem.exampleCount);
    const features = app.auth.serverFeatures;
    const saved = app.progress.progress.settings.algoLang;
    const ctx = {
        app, problem, judgeable: judgeableOf(problem),
        language: [LanguageId.C, LanguageId.PYTHON].includes(saved) ? saved : LanguageId.C,
        code: {},
        editor: null,
    };

    renderShell(app, 'community',
        '<div class="crumbs"><a href="#community">커뮤니티</a> › #' + problem.id + '</div>' +
        '<div class="prob"><article class="panel statement">' +
        '<div><div class="muted code-text" style="font-size:13px">#' + problem.id + ' · ' + levelBadge(problem.difficulty) + ' · ' + esc(problem.author) + ' · ' + dateOf(problem.createdAt) + '</div>' +
        '<h1>' + esc(problem.title) + '</h1>' +
        '<div class="chips">' + (problem.hidden ? '<span class="chip bad">숨김 상태</span>' : '') +
        '<button class="chip like-btn' + (problem.liked ? ' on' : '') + '" id="like-problem" ' + (problem.mine ? 'disabled title="내 문제에는 누를 수 없어요"' : '') + '>' + (problem.liked ? '♥' : '♡') + ' 좋아요 <b>' + problem.likes + '</b></button>' +
        '<span class="chip">채점: 화면 출력</span></div></div>' +
        '<div class="sec"><h3>문제</h3>' + richText(problem.body) + '</div>' +
        '<div class="sec"><h3>입력</h3>' + richText(problem.inputSpec || '입력은 없습니다.') + '</div>' +
        '<div class="sec"><h3>출력</h3>' + richText(problem.outputSpec) + '</div>' +
        '<div class="sec">' + examples.map((t, i) => '<div class="sample"><div><div class="muted label">예제 입력 ' + (i + 1) + '</div><pre>' + esc(t.input || '(입력 없음)') + '</pre></div>' +
            '<div><div class="muted label">예제 출력 ' + (i + 1) + '</div><pre>' + esc(t.output) + '</pre></div></div>').join('') + '</div>' +
        '<div class="row-buttons mod-row">' +
        '<button class="btn ghost small" id="report-problem">신고</button>' +
        (problem.canModerate ? '<button class="btn ghost small" id="hide-problem">' + (problem.hidden ? '다시 보이기' : '숨기기') + ' (선생님)</button>' : '') +
        (problem.mine || problem.canModerate ? '<button class="btn ghost small" id="delete-problem">문제 지우기</button>' : '') + '</div>' +
        '</article><aside class="side">' +
        '<section class="panel editor-panel"><div class="ed-bar"><label class="lang lang-pick">언어 <select id="lang-select" aria-label="풀이 언어">' +
        LANGUAGES.map((lang) => {
            const usable = isLanguageAvailable(lang.id, features) && app.judge.supports(lang.id);
            return '<option value="' + lang.id + '"' + (lang.id === ctx.language ? ' selected' : '') + (usable ? '' : ' disabled') + '>' +
                esc(lang.label + (lang.paid ? (usable ? ' · 유료' : ' · 유료 준비 중') : '')) + '</option>';
        }).join('') + '</select></label>' +
        '<button class="btn" id="btn-run">예제 실행</button><button class="btn primary" id="btn-submit">제출</button></div><div id="ed"></div></section>' +
        '<section class="panel run-panel"><div id="result" aria-live="polite"><div class="muted small">제출하면 낸 사람이 넣은 테스트로 채점해요.</div></div></section>' +
        '</aside></div>' +
        '<section class="panel pad discuss"><h2>토론 <span class="muted small">' + problem.comments.length + '개</span></h2>' +
        '<p class="muted small">채점 결과가 이상하면 여기서 함께 의논해요. 코드는 ``` 로 앞뒤를 감싸면 코드 상자로 보여요. 정답 코드를 통째로 올리기보다 생각하는 방법을 나눠 주세요.</p>' +
        '<div id="comments">' + commentsHtml(problem) + '</div>' +
        '<form id="comment-form" class="comment-form"><textarea class="plain" id="comment-body" maxlength="' + COMMUNITY_LIMITS.commentMax + '" rows="3" placeholder="질문이나 의견을 남겨요"></textarea>' +
        '<div class="err" id="c-err" role="alert"></div><button class="btn primary" type="submit">댓글 달기</button></form></section>');

    mountSolveEditor(ctx);
    $('#lang-select').onchange = async (e) => {
        ctx.code[ctx.language] = ctx.editor.get();
        ctx.language = e.target.value;
        app.progress.updateSettings({ algoLang: ctx.language });
        mountSolveEditor(ctx);
        if (ctx.language === LanguageId.PYTHON) {
            showSolve('<div class="result info"><div class="head">Python 실행기를 준비하고 있어요…</div></div>');
            try {
                await app.judge.prepareAsync(LanguageId.PYTHON);
                showSolve('<div class="result info"><div class="head">Python 준비 완료</div></div>');
            } catch (err) {
                showSolve('<div class="result wa"><div class="head">Python 실행기를 받아 오지 못했어요</div></div>');
            }
        }
    };
    $('#btn-run').onclick = () => runExampleAsync(ctx);
    $('#btn-submit').onclick = () => submitCommunityAsync(ctx);
    bindDiscussion(ctx);
}

function mountSolveEditor(ctx) {
    const lang = languageOf(ctx.language);
    ctx.editor = mountEditor($('#ed'), ctx.code[ctx.language] ?? lang.template, (code) => {
        ctx.code[ctx.language] = code;
    }, () => $('#btn-submit').click(), lang.label);
}

function showSolve(html) {
    const box = $('#result');
    if (box) {
        box.innerHTML = html;
    }
}

async function runExampleAsync(ctx) {
    showSolve('<div class="result info"><div class="head">예제 실행 중…</div></div>');
    const first = ctx.problem.tests[0];
    const run = await ctx.app.judge.runAsync(ctx.editor.get(), first.input, {}, ctx.language);
    if (!run.ok) {
        showSolve('<div class="result wa"><div class="head">실행 중 문제가 생겼어요</div><div>' + (run.line ? '<b>' + run.line + '번째 줄</b> 근처: ' : '') + esc(run.message) + '</div></div>');
        return;
    }
    const same = normalizeOutput(run.output) === normalizeOutput(first.output);
    showSolve('<div class="result info"><div class="head">실행 결과 <span class="chip ' + (same ? 'good">예제 출력과 같아요' : 'bad">예제 출력과 달라요') + '</span></div><pre class="outbox">' + esc(run.output || '(출력 없음)') + '</pre></div>');
}

async function submitCommunityAsync(ctx) {
    const button = $('#btn-submit');
    button.disabled = true;
    showSolve('<div class="result info"><div class="head">채점 중…</div></div>');
    try {
        const judged = await ctx.app.judge.judgeAsync(ctx.judgeable, ctx.editor.get(), ctx.language);
        if (judged.verdict === Verdict.AC) {
            ctx.app.sound.play('correct');
            showSolve('<div class="result ac"><div class="head">' + judged.label + '</div><div class="small">풀었다면 토론에 생각한 방법을 짧게 나눠 볼까요?</div></div>');
            return;
        }
        ctx.app.sound.play('wrong');
        const detail = judged.verdict === Verdict.WA
            ? '<div>' + (judged.testIndex + 1) + '번째 테스트에서 틀렸어요.</div>' + (judged.testIndex < ctx.problem.exampleCount
                ? '<div class="diff"><div><div class="muted label">내 출력</div><pre>' + esc(judged.got || '(출력 없음)') + '</pre></div><div><div class="muted label">기대 출력</div><pre>' + esc(judged.expected) + '</pre></div></div>'
                : '<div class="muted small">숨은 테스트라 입력은 보여 주지 않아요. 테스트가 이상하다고 생각되면 토론에 남겨 주세요.</div>')
            : '<div>' + (judged.line ? '<b>' + judged.line + '번째 줄</b> 근처: ' : '') + esc(judged.message) + '</div>';
        showSolve('<div class="result wa"><div class="head">' + judged.label + '</div>' + detail + '</div>');
    } catch (e) {
        showSolve('<div class="result wa"><div class="head">채점 중 문제가 생겼어요</div></div>');
    } finally {
        button.disabled = false;
    }
}

function commentsHtml(problem) {
    if (problem.comments.length === 0) {
        return '<div class="muted pad">아직 댓글이 없어요. 첫 의견을 남겨 보세요.</div>';
    }
    return problem.comments.map((c) => '<article class="comment' + (c.accepted ? ' accepted' : '') + (c.hidden ? ' is-hidden' : '') + '" data-id="' + c.id + '">' +
        '<div class="c-head"><b>' + esc(c.author) + '</b>' + (c.accepted ? ' <span class="chip good">채택된 답변</span>' : '') +
        (c.hidden ? ' <span class="chip bad">숨김</span>' : '') + ' <span class="muted small">' + dateOf(c.createdAt) + '</span></div>' +
        '<div class="c-body">' + richText(c.body) + '</div>' +
        '<div class="c-actions"><button class="chip like-btn' + (c.liked ? ' on' : '') + '" data-like ' + (c.mine ? 'disabled' : '') + '>' + (c.liked ? '♥' : '♡') + ' <b>' + c.likes + '</b></button>' +
        (problem.mine && !c.mine && !c.accepted ? '<button class="btn ghost small" data-accept>채택하기</button>' : '') +
        (!c.mine ? '<button class="btn ghost small" data-report>신고</button>' : '') +
        (problem.canModerate ? '<button class="btn ghost small" data-hide="' + (c.hidden ? '0' : '1') + '">' + (c.hidden ? '보이기' : '숨기기') + '</button>' : '') +
        '</div></article>').join('');
}

function askReason() {
    // 확인 창 대신 화면 안 입력칸으로 사유를 받는다
    return new Promise((resolve) => {
        const bg = document.createElement('div');
        bg.className = 'modal-bg';
        bg.innerHTML = '<form class="panel modal" id="rep-form"><h2>신고하기</h2><p class="muted small">신고가 ' + COMMUNITY_LIMITS.autoHideReports + '번 쌓이면 자동으로 숨겨지고, 선생님이 확인해요.</p>' +
            '<label class="f">사유<input type="text" id="rep-reason" maxlength="' + COMMUNITY_LIMITS.reasonMax + '" placeholder="예: 장난 글, 욕설, 다른 사이트 문제 복사"></label>' +
            '<div class="row-buttons"><button type="button" class="btn" id="rep-cancel">취소</button><button class="btn primary" type="submit">신고</button></div></form>';
        document.body.appendChild(bg);
        $('#rep-reason').focus();
        $('#rep-cancel').onclick = () => {
            bg.remove();
            resolve(null);
        };
        $('#rep-form').onsubmit = (e) => {
            e.preventDefault();
            const reason = $('#rep-reason').value.trim();
            bg.remove();
            resolve(reason || null);
        };
    });
}

function bindDiscussion(ctx) {
    const { app, problem } = ctx;
    const reload = () => renderCommunityProblem(app, problem.id);
    const afterAct = (result, okMessage) => {
        if (result instanceof Failure) {
            toast(result.detail || messageOf(result.error));
            return false;
        }
        if (okMessage) {
            toast(okMessage);
        }
        return true;
    };
    $('#like-problem').onclick = async () => {
        if (afterAct(await app.community.likeAsync('problem', problem.id))) {
            reload();
        }
    };
    $('#report-problem').onclick = async () => {
        const reason = await askReason();
        if (reason && afterAct(await app.community.reportAsync('problem', problem.id, reason), '신고했어요. 고마워요.')) {
            reload();
        }
    };
    if ($('#hide-problem')) {
        $('#hide-problem').onclick = async () => {
            if (afterAct(await app.community.hideAsync('problem', problem.id, !problem.hidden), problem.hidden ? '다시 보이게 했어요.' : '숨겼어요.')) {
                reload();
            }
        };
    }
    if ($('#delete-problem')) {
        // 누르면 도화선이 4초 동안 타고, 그 사이 다시 누르면 취소. 다 타면 지운다
        makeFuseUndoButton($('#delete-problem'), {
            armedLabel: '지우는 중 · 누르면 취소',
            onCommitAsync: async () => {
                if (afterAct(await app.community.deleteAsync(problem.id), '문제를 지웠어요.')) {
                    app.router.go('community');
                }
            },
        });
    }
    $$('.comment').forEach((node) => {
        const commentId = Number(node.dataset.id);
        const like = $('[data-like]', node);
        if (like) {
            like.onclick = async () => {
                if (afterAct(await app.community.likeAsync('comment', commentId))) {
                    reload();
                }
            };
        }
        const accept = $('[data-accept]', node);
        if (accept) {
            accept.onclick = async () => {
                if (afterAct(await app.community.acceptAsync(commentId), '답변을 채택했어요.')) {
                    reload();
                }
            };
        }
        const report = $('[data-report]', node);
        if (report) {
            report.onclick = async () => {
                const reason = await askReason();
                if (reason && afterAct(await app.community.reportAsync('comment', commentId, reason), '신고했어요. 고마워요.')) {
                    reload();
                }
            };
        }
        const hide = $('[data-hide]', node);
        if (hide) {
            hide.onclick = async () => {
                if (afterAct(await app.community.hideAsync('comment', commentId, hide.dataset.hide === '1'))) {
                    reload();
                }
            };
        }
    });
    $('#comment-form').onsubmit = async (e) => {
        e.preventDefault();
        const posted = await app.community.commentAsync(problem.id, $('#comment-body').value);
        if (posted instanceof Failure) {
            $('#c-err').textContent = posted.detail || messageOf(posted.error);
            return;
        }
        reload();
    };
}
