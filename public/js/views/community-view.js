// 커뮤니티 화면: 회원이 낸 문제 목록, 문제 내기, 문제 풀기 + 토론(댓글 · 좋아요 · 채택 · 신고)
// 글자는 사전에서, 지금 언어로. 회원이 쓴 문제 · 댓글은 쓴 언어 그대로 보여 준다.
import { $, $$, esc, toast, undoToast } from '../ui/dom.js';
import { mountEditor } from '../ui/editor.js';
import { makeFuseUndoButton } from '../ui/effects.js';
import { Failure } from '../core/result.js';
import { messageOf } from '../core/app-error.js';
import { renderShell } from './shell.js';
import { levelBadge } from './problem-view.js';
import { COMMUNITY_LIMITS, DIFFICULTY_LEVELS } from '../domain/community-rules.js';
import { LANGUAGES, LanguageId, languageOf, isLanguageAvailable } from '../domain/languages.js';
import { Verdict, normalizeOutput } from '../services/judge-service.js';
import { judgeableOf } from '../services/learning-services.js';
import { t } from '../i18n/index.js';
import { mountStyleToggle } from './style-toggle.js';
import { lineNear, runText } from './view-helpers.js';
import { likeHeartHtml, bindLikeHeart, likeBadgeHtml } from '../ui/like-heart.js';
import { swipeRowHtml, bindSwipeRow } from '../ui/swipe-row.js';
import { rowActions } from '../ui/swipe-row-rules.js';

const listState = { sort: 'new', page: 0 };

/** 실패 문장: 규칙 키(rule.*)는 지금 언어로 바꾸고, 없으면 오류 종류의 문장 */
const detailText = (result) => {
    if (typeof result.detail === 'string' && result.detail.startsWith('rule.')) {
        return t(result.detail, COMMUNITY_LIMITS);
    }
    return result.detail || messageOf(result.error);
};
const failText = (result) => esc(detailText(result));

function dateOf(ms) {
    const d = new Date(ms);
    return (d.getMonth() + 1) + '/' + d.getDate();
}

/** 여러 줄 글을 안전하게 보여 준다. ``` 로 감싼 부분은 코드 상자로 (글쓴이가 쓴 모양 그대로) */
function richText(text) {
    return String(text).split(/```/).map((part, i) => {
        if (i % 2 === 0) {
            return '<p class="pre-wrap">' + esc(part.trim()) + '</p>';
        }
        const tag = (part.match(/^([\w+]*)\n/) ?? ['', ''])[1];
        const code = part.slice(tag.length).replace(/^\n/, '');
        return '<pre class="codeblock small">' + esc(code) + '</pre>';
    }).join('');
}

function languageOptions(app, selected, features) {
    return LANGUAGES.map((lang) => {
        const usable = isLanguageAvailable(lang.id, features) && app.judge.supports(lang.id);
        return '<option value="' + lang.id + '"' + (lang.id === selected ? ' selected' : '') + (usable ? '' : ' disabled') + '>' +
            esc(lang.label + (lang.paid ? t(usable ? 'prob.paid' : 'prob.paidSoon') : '')) + '</option>';
    }).join('');
}

// ---------- 목록 ----------
export async function renderCommunityList(app) {
    renderShell(app, 'community',
        '<div class="view-title"><h1>' + esc(t('comm.title')) + '</h1><a class="btn primary" href="#community-new">' + esc(t('comm.new')) + '</a></div>' +
        '<section class="panel pad comm-intro">' + t('comm.intro') +
        '<span class="muted">' + esc(t('comm.noXp')) + '</span></section>' +
        '<div class="tabs comm-tabs" role="tablist"><button type="button" data-sort="new">' + esc(t('comm.sortNew')) + '</button><button type="button" data-sort="popular">' + esc(t('comm.sortPopular')) + '</button></div>' +
        '<section class="panel" id="comm-list"><div class="pad muted">' + esc(t('common.loading')) + '</div></section>' +
        '<div class="pager"><button class="btn" id="pg-prev">' + esc(t('common.prev')) + '</button><span id="pg-no"></span><button class="btn" id="pg-next">' + esc(t('common.next')) + '</button></div>');
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
    $('#pg-no').textContent = t('common.page', { n: listState.page + 1 });
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
        box.innerHTML = '<div class="pad">' + esc(t(listState.page === 0 ? 'comm.emptyFirst' : 'comm.emptyMore')) + '</div>';
        return;
    }
    const actionsOf = (p) => rowActions({ mine: p.mine, canModerate: app.teacher.isTeacher, liked: p.liked, hidden: p.hidden });
    box.innerHTML = '<div class="swipe-list">' +
        listed.data.map((p) => swipeRowHtml({ id: p.id, href: '#c' + p.id, actions: actionsOf(p), contentHtml: communityRowHtml(p) })).join('') + '</div>';
    listed.data.forEach((p) => {
        const row = box.querySelector('.swipe-row[data-id="' + p.id + '"]');
        bindSwipeRow(row, { actions: actionsOf(p), onAction: (actionId) => runRowActionAsync(app, p, actionId, row) });
    });
}

/** 한 줄 안의 글: 제목 · 표시, 난이도 · 쓴 사람 · 날짜, 좋아요(하트 하나 + 숫자) · 댓글 수 */
function communityRowHtml(p) {
    return '<span class="sr-main"><b class="sr-title">' + esc(p.title) + '</b>' +
        (p.hidden ? ' <span class="chip bad">' + esc(t('comm.hidden')) + '</span>' : '') + (p.mine ? ' <span class="chip accent">' + esc(t('comm.mine')) + '</span>' : '') + '</span>' +
        '<span class="sr-meta">' + levelBadge(p.difficulty) + '<span>' + esc(p.author) + '</span><span class="muted">' + dateOf(p.createdAt) + '</span></span>' +
        '<span class="sr-stats" data-like-badge>' + likeBadgeHtml(p.liked, p.likes) + '<span class="sr-comments" aria-label="' + esc(t('comm.colComments')) + '">💬 ' + p.comments + '</span></span>';
}

const DELETE_UNDO_MS = 4000;

async function runRowActionAsync(app, p, actionId, row) {
    const reload = () => renderCommunityList(app);
    if (actionId === 'like') {
        const liked = await app.community.likeAsync('problem', p.id);
        if (liked instanceof Failure) {
            toast(detailText(liked));
            return;
        }
        p.liked = liked.data.liked;
        p.likes = liked.data.likes;
        reload();
        return;
    }
    if (actionId === 'hide') {
        const hidden = await app.community.hideAsync('problem', p.id, !p.hidden);
        toast(hidden instanceof Failure ? detailText(hidden) : t(p.hidden ? 'comm.shown' : 'comm.hiddenDone'));
        reload();
        return;
    }
    if (actionId === 'delete') {
        // 밀어서 지우면 4초 동안 되돌릴 수 있다 (그 뒤에 진짜로 지운다)
        if (await undoToast(t('comm.deleting'), t('fuse.undo'), DELETE_UNDO_MS)) {
            reload();
            return;
        }
        const deleted = await app.community.deleteAsync(p.id);
        toast(deleted instanceof Failure ? detailText(deleted) : t('comm.deleted'));
        reload();
    }
}

// ---------- 문제 내기 ----------
function testRow(index, test = { input: '', output: '' }) {
    return '<div class="test-row" data-index="' + index + '"><div class="test-head"><b>' + esc(t('comm.testN', { n: index + 1 })) + '</b>' +
        '<button type="button" class="btn ghost small" data-remove>' + esc(t('comm.remove')) + '</button></div>' +
        '<div class="test-grid"><label class="f">' + esc(t('comm.testInput')) + '<textarea class="plain" data-in>' + esc(test.input) + '</textarea></label>' +
        '<label class="f">' + esc(t('comm.testOutput')) + '<textarea class="plain" data-out>' + esc(test.output) + '</textarea></label></div></div>';
}

export function renderCommunityNew(app) {
    const L = COMMUNITY_LIMITS;
    renderShell(app, 'community',
        '<div class="crumbs"><a href="#community">' + esc(t('comm.title')) + '</a> › ' + esc(t('comm.newCrumb')) + '</div>' +
        '<form class="panel pad comm-form" id="new-form" novalidate><h1>' + esc(t('comm.new')) + '</h1>' +
        '<p class="muted">' + esc(t('comm.copyright')) + '</p>' +
        '<label class="f">' + esc(t('comm.fTitle')) + '<input type="text" id="n-title" maxlength="' + L.titleMax + '" placeholder="' + esc(t('comm.fTitleHint')) + '"></label>' +
        '<label class="f">' + esc(t('comm.fTier')) + '<select id="n-diff">' + DIFFICULTY_LEVELS.map((lv) => '<option value="' + lv + '">' + esc(t('tier.' + lv)) + '</option>').join('') + '</select></label>' +
        '<label class="f">' + esc(t('comm.fBody')) + '<textarea class="plain" id="n-body" maxlength="' + L.bodyMax + '" rows="6"></textarea></label>' +
        '<label class="f">' + esc(t('comm.fIn')) + '<textarea class="plain" id="n-in" maxlength="' + L.specMax + '" rows="2"></textarea></label>' +
        '<label class="f">' + esc(t('comm.fOut')) + '<textarea class="plain" id="n-out" maxlength="' + L.specMax + '" rows="2"></textarea></label>' +
        '<div class="sec"><h3>' + esc(t('comm.tests')) + '</h3><p class="muted small">' + esc(t('comm.testsNote', { max: L.testsMax })) + '</p>' +
        '<div id="tests">' + testRow(0) + '</div><button type="button" class="btn" id="add-test">' + esc(t('comm.addTest')) + '</button>' +
        '<label class="f" style="margin-top:10px">' + esc(t('comm.examples')) + '<select id="n-examples"><option>1</option><option>2</option><option>3</option></select></label></div>' +
        '<div class="err" id="n-err" role="alert"></div>' +
        '<button class="btn primary" type="submit" id="n-submit">' + esc(t('comm.post')) + '</button></form>');

    const renumber = () => {
        $$('.test-row').forEach((row, i) => {
            row.dataset.index = i;
            $('b', row).textContent = t('comm.testN', { n: i + 1 });
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
            $('#n-err').textContent = detailText(created);
            return;
        }
        toast(t('comm.posted'));
        app.router.go('c' + created.data);
    };
}

// ---------- 문제 풀기 + 토론 ----------
export async function renderCommunityProblem(app, id) {
    renderShell(app, 'community', '<div class="crumbs"><a href="#community">' + esc(t('comm.title')) + '</a> › ' + esc(t('comm.problemCrumb')) + '</div><section class="panel pad muted" id="cp">' + esc(t('common.loading')) + '</section>');
    const loaded = await app.community.getAsync(id);
    if (!$('#cp')) {
        return;
    }
    if (loaded instanceof Failure) {
        $('#cp').outerHTML = '<section class="panel pad">' + failText(loaded) + ' <a href="#community">' + esc(t('common.toList')) + '</a></section>';
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
        '<div class="crumbs"><a href="#community">' + esc(t('comm.title')) + '</a> › #' + problem.id + '</div>' +
        '<div class="prob"><article class="panel statement">' +
        '<div><div class="muted code-text" style="font-size:13px">#' + problem.id + ' · ' + levelBadge(problem.difficulty) + ' · ' + esc(problem.author) + ' · ' + dateOf(problem.createdAt) + '</div>' +
        '<h1>' + esc(problem.title) + '</h1>' +
        '<div class="chips">' + (problem.hidden ? '<span class="chip bad">' + esc(t('comm.hiddenState')) + '</span>' : '') +
        likeHeartHtml({ liked: problem.liked, count: problem.likes, disabled: problem.mine, id: 'like-problem' }) +
        '<span class="chip">' + esc(t('prob.judgeScreen')) + '</span></div></div>' +
        '<div class="sec"><h3>' + esc(t('prob.statement')) + '</h3>' + richText(problem.body) + '</div>' +
        '<div class="sec"><h3>' + esc(t('prob.input')) + '</h3>' + richText(problem.inputSpec || t('comm.noInputSpec')) + '</div>' +
        '<div class="sec"><h3>' + esc(t('prob.output')) + '</h3>' + richText(problem.outputSpec) + '</div>' +
        '<div class="sec">' + examples.map((test, i) => '<div class="sample"><div><div class="muted label">' + esc(t('prob.sampleInput', { n: i + 1 })) + '</div><pre>' + esc(test.input || t('common.noInput')) + '</pre></div>' +
            '<div><div class="muted label">' + esc(t('prob.sampleOutput', { n: i + 1 })) + '</div><pre>' + esc(test.output) + '</pre></div></div>').join('') + '</div>' +
        '<div class="row-buttons mod-row">' +
        '<button class="btn ghost small" id="report-problem">' + esc(t('comm.report')) + '</button>' +
        (problem.canModerate ? '<button class="btn ghost small" id="hide-problem">' + esc(t(problem.hidden ? 'comm.show' : 'comm.hide')) + esc(t('comm.teacherTag')) + '</button>' : '') +
        (problem.mine || problem.canModerate ? '<button class="btn ghost small" id="delete-problem">' + esc(t('comm.deleteProblem')) + '</button>' : '') + '</div>' +
        '</article><aside class="side">' +
        '<section class="panel editor-panel"><div class="ed-bar"><label class="lang lang-pick">' + esc(t('lang.label')) + ' <select id="lang-select" aria-label="' + esc(t('prob.langAria')) + '">' +
        languageOptions(app, ctx.language, features) + '</select></label><span id="style-slot"></span>' +
        '<button class="btn" id="btn-run">' + esc(t('prob.runSample')) + '</button><button class="btn primary" id="btn-submit">' + esc(t('prob.submit')) + '</button></div><div id="ed"></div></section>' +
        '<section class="panel run-panel"><div id="result" aria-live="polite"><div class="muted small">' + esc(t('comm.judgeByTests')) + '</div></div></section>' +
        '</aside></div>' +
        '<section class="panel pad discuss"><h2>' + esc(t('comm.discussion')) + ' <span class="muted small">' + esc(t('comm.countN', { n: problem.comments.length })) + '</span></h2>' +
        '<p class="muted small">' + esc(t('comm.discussNote')) + '</p>' +
        '<div id="comments">' + commentsHtml(problem, app.progress) + '</div>' +
        '<form id="comment-form" class="comment-form"><textarea class="plain" id="comment-body" maxlength="' + COMMUNITY_LIMITS.commentMax + '" rows="3" placeholder="' + esc(t('comm.commentHint')) + '"></textarea>' +
        '<div class="err" id="c-err" role="alert"></div><button class="btn primary" type="submit">' + esc(t('comm.commentPost')) + '</button></form></section>');

    mountSolveEditor(ctx);
    $('#lang-select').onchange = async (e) => {
        ctx.code[ctx.language] = ctx.editor.get();
        ctx.language = e.target.value;
        app.progress.updateSettings({ algoLang: ctx.language });
        mountSolveEditor(ctx);
        if (ctx.language === LanguageId.PYTHON) {
            showSolve('<div class="result info"><div class="head">' + esc(t('prob.pyPreparing')) + '</div></div>');
            try {
                await app.judge.prepareAsync(LanguageId.PYTHON);
                showSolve('<div class="result info"><div class="head">' + esc(t('prob.pyReady')) + '</div></div>');
            } catch (err) {
                showSolve('<div class="result wa"><div class="head">' + esc(t('prob.pyFailed')) + '</div></div>');
            }
        }
    };
    $('#btn-run').onclick = () => runExampleAsync(ctx);
    $('#btn-submit').onclick = () => submitCommunityAsync(ctx);
    bindDiscussion(ctx);
}

function mountSolveEditor(ctx) {
    const lang = languageOf(ctx.language);
    ctx.editor = mountEditor($('#ed'), ctx.code[ctx.language] ?? ctx.app.progress.templateOf(ctx.language), (code) => {
        ctx.code[ctx.language] = code;
    }, () => $('#btn-submit').click(), lang.label, () => ctx.app.progress.styleOf(ctx.language));
    mountStyleToggle($('#style-slot'), {
        language: ctx.language,
        current: ctx.app.progress.styleOf(ctx.language),
        onPick: (style) => {
            const styled = ctx.app.progress.applyCodeStyle(ctx.editor.get(), style, ctx.language);
            ctx.code[ctx.language] = styled;
            ctx.editor.set(styled);
            toast(t('style.changed', { style: t('style.' + style) }));
        },
    });
}

function showSolve(html) {
    const box = $('#result');
    if (box) {
        box.innerHTML = html;
    }
}

async function runExampleAsync(ctx) {
    showSolve('<div class="result info"><div class="head">' + esc(t('prob.runningSample')) + '</div></div>');
    const first = ctx.problem.tests[0];
    const run = await ctx.app.judge.runAsync(ctx.editor.get(), first.input, {}, ctx.language);
    if (!run.ok) {
        showSolve('<div class="result wa"><div class="head">' + esc(t('comm.runFailed')) + '</div><div>' + lineNear(run.line) + runText(run.message) + '</div></div>');
        return;
    }
    const same = normalizeOutput(run.output) === normalizeOutput(first.output);
    showSolve('<div class="result info"><div class="head">' + esc(t('prob.runResult')) + '<span class="chip ' + (same ? 'good">' + esc(t('prob.sameAsSample')) : 'bad">' + esc(t('prob.diffFromSample'))) + '</span></div><pre class="outbox">' + esc(run.output || t('common.noOutput')) + '</pre></div>');
}

async function submitCommunityAsync(ctx) {
    const button = $('#btn-submit');
    button.disabled = true;
    showSolve('<div class="result info"><div class="head">' + esc(t('prob.judging')) + '</div></div>');
    try {
        const judged = await ctx.app.judge.judgeAsync(ctx.judgeable, ctx.editor.get(), ctx.language);
        const label = esc(t('verdict.' + judged.verdict));
        if (judged.verdict === Verdict.AC) {
            ctx.app.sound.play('correct');
            showSolve('<div class="result ac"><div class="head">' + label + '</div><div class="small">' + esc(t('comm.solvedShare')) + '</div></div>');
            return;
        }
        ctx.app.sound.play('wrong');
        const detail = judged.verdict === Verdict.WA
            ? '<div>' + esc(t('prob.wrongAt', { n: judged.testIndex + 1 })) + '</div>' + (judged.testIndex < ctx.problem.exampleCount
                ? '<div class="diff"><div><div class="muted label">' + esc(t('prob.myOutput')) + '</div><pre>' + esc(judged.got || t('common.noOutput')) + '</pre></div><div><div class="muted label">' + esc(t('prob.expectedOutput')) + '</div><pre>' + esc(judged.expected) + '</pre></div></div>'
                : '<div class="muted small">' + esc(t('comm.hiddenTest')) + '</div>')
            : '<div>' + lineNear(judged.line) + runText(judged.message) + '</div>';
        showSolve('<div class="result wa"><div class="head">' + label + '</div>' + detail + '</div>');
    } catch (e) {
        showSolve('<div class="result wa"><div class="head">' + esc(t('prob.judgeFailed')) + '</div></div>');
    } finally {
        button.disabled = false;
    }
}

function commentsHtml(problem, progress) {
    if (problem.comments.length === 0) {
        return '<div class="muted pad">' + esc(t('comm.noComments')) + '</div>';
    }
    return problem.comments.map((c) => '<article class="comment' + (c.accepted ? ' accepted' : '') + (c.hidden ? ' is-hidden' : '') + '" data-id="' + c.id + '">' +
        '<div class="c-head"><b>' + esc(c.author) + '</b>' + (c.accepted ? ' <span class="chip good">' + esc(t('comm.accepted')) + '</span>' : '') +
        (c.hidden ? ' <span class="chip bad">' + esc(t('comm.hidden')) + '</span>' : '') + ' <span class="muted small">' + dateOf(c.createdAt) + '</span></div>' +
        '<div class="c-body">' + richText(c.body) + '</div>' +
        '<div class="c-actions">' + likeHeartHtml({ liked: c.liked, count: c.likes, disabled: c.mine, attr: 'data-like', size: 'small' }) +
        (problem.mine && !c.mine && !c.accepted ? '<button class="btn ghost small" data-accept>' + esc(t('comm.accept')) + '</button>' : '') +
        (!c.mine ? '<button class="btn ghost small" data-report>' + esc(t('comm.report')) + '</button>' : '') +
        (problem.canModerate ? '<button class="btn ghost small" data-hide="' + (c.hidden ? '0' : '1') + '">' + esc(t(c.hidden ? 'comm.showC' : 'comm.hide')) + '</button>' : '') +
        '</div></article>').join('');
}

function askReason() {
    // 확인 창 대신 화면 안 입력칸으로 사유를 받는다
    return new Promise((resolve) => {
        const bg = document.createElement('div');
        bg.className = 'modal-bg';
        bg.innerHTML = '<form class="panel modal" id="rep-form"><h2>' + esc(t('comm.reportTitle')) + '</h2><p class="muted small">' + esc(t('comm.reportNote', { n: COMMUNITY_LIMITS.autoHideReports })) + '</p>' +
            '<label class="f">' + esc(t('comm.reason')) + '<input type="text" id="rep-reason" maxlength="' + COMMUNITY_LIMITS.reasonMax + '" placeholder="' + esc(t('comm.reasonHint')) + '"></label>' +
            '<div class="row-buttons"><button type="button" class="btn" id="rep-cancel">' + esc(t('common.cancel')) + '</button><button class="btn primary" type="submit">' + esc(t('comm.report')) + '</button></div></form>';
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
    const afterAct = (result, okKey) => {
        if (result instanceof Failure) {
            toast(detailText(result));
            return false;
        }
        if (okKey) {
            toast(t(okKey));
        }
        return true;
    };
    // 좋아요는 화면을 다시 그리지 않고 하트 · 숫자만 바꾼다 (쓰던 코드가 그대로 남게)
    const toggleLike = (targetType, targetId) => async () => {
        const liked = await app.community.likeAsync(targetType, targetId);
        return afterAct(liked) ? liked.data : null;
    };
    bindLikeHeart($('#like-problem'), toggleLike('problem', problem.id));
    $('#report-problem').onclick = async () => {
        const reason = await askReason();
        if (reason && afterAct(await app.community.reportAsync('problem', problem.id, reason), 'comm.reported')) {
            reload();
        }
    };
    if ($('#hide-problem')) {
        $('#hide-problem').onclick = async () => {
            if (afterAct(await app.community.hideAsync('problem', problem.id, !problem.hidden), problem.hidden ? 'comm.shown' : 'comm.hiddenDone')) {
                reload();
            }
        };
    }
    if ($('#delete-problem')) {
        // 누르면 도화선이 4초 동안 타고, 그 사이 다시 누르면 취소. 다 타면 지운다
        makeFuseUndoButton($('#delete-problem'), {
            armedLabel: t('comm.deleting'),
            onCommitAsync: async () => {
                if (afterAct(await app.community.deleteAsync(problem.id), 'comm.deleted')) {
                    app.router.go('community');
                }
            },
        });
    }
    $$('.comment').forEach((node) => {
        const commentId = Number(node.dataset.id);
        bindLikeHeart($('[data-like]', node), toggleLike('comment', commentId));
        const accept = $('[data-accept]', node);
        if (accept) {
            accept.onclick = async () => {
                if (afterAct(await app.community.acceptAsync(commentId), 'comm.acceptedDone')) {
                    reload();
                }
            };
        }
        const report = $('[data-report]', node);
        if (report) {
            report.onclick = async () => {
                const reason = await askReason();
                if (reason && afterAct(await app.community.reportAsync('comment', commentId, reason), 'comm.reported')) {
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
            $('#c-err').textContent = detailText(posted);
            return;
        }
        reload();
    };
}
