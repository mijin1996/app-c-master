// 목록 화면들: 전체 문제, 친구 랭킹, 내 기록, 선생님 화면 (글자는 사전에서, 지금 언어로)
import { $, esc, pad2 } from '../ui/dom.js';
import { formName } from '../ui/cody.js';
import { Failure } from '../core/result.js';
import { messageOf } from '../core/app-error.js';
import { renderShell } from './shell.js';
import { starStr } from './map-views.js';
import { chapterState, solvedCountIn, problemStatusOf } from '../domain/progress-rules.js';
import { statusChipHtml } from './view-helpers.js';
import { t } from '../i18n/index.js';

const filters = { chapter: 'all', status: 'all' };
const chip = (cls, key) => '<span class="chip' + (cls ? ' ' + cls : '') + '">' + esc(t(key)) + '</span>';
const chapterTitle = (app, no) => app.content.byChapter.get(no)?.title ?? '';

export function renderProblems(app) {
    const p = app.progress.progress;
    const all = app.content.problems;
    const statusOf = (problem) => problemStatusOf(p, problem.id);
    const draw = () => {
        const rows = all
            .filter((problem) => (filters.chapter === 'all' || problem.ch === Number(filters.chapter)) && (filters.status === 'all' || statusOf(problem) === filters.status))
            .map((problem) => {
                const status = statusChipHtml(statusOf(problem));
                return '<tr><td class="num code-text">' + problem.id + '</td><td><a href="#p' + problem.id + '">' + esc(problem.title) + '</a></td><td>' + problem.ch + '. ' + esc(chapterTitle(app, problem.ch)) + '</td>' +
                    '<td class="stars">' + starStr(problem.level) + '</td><td>' + status + '</td><td class="num">' + (p.tries[problem.id] ?? 0) + '</td></tr>';
            }).join('');
        $('#ptable').innerHTML = rows || '<tr><td colspan="6" class="muted">' + esc(t('list.empty')) + '</td></tr>';
    };
    renderShell(app, 'problems', '<div class="view-title"><h1>' + esc(t('list.problemsTitle')) + '</h1><span class="on-sky muted">' + esc(t('list.problemsSummary', { total: all.length, solved: app.progress.summary.solvedCount })) + '</span></div>' +
        '<section class="panel"><div class="filters"><select id="flt-ch" aria-label="' + esc(t('list.chapter')) + '"><option value="all">' + esc(t('list.allChapters')) + '</option>' +
        app.content.chapters.map((c) => '<option value="' + c.ch + '">' + c.ch + '. ' + esc(c.title) + '</option>').join('') + '</select>' +
        '<select id="flt-st" aria-label="' + esc(t('list.status')) + '"><option value="all">' + esc(t('list.allStatus')) + '</option><option value="ok">' + esc(t('common.solved')) + '</option><option value="try">' + esc(t('common.trying')) + '</option><option value="none">' + esc(t('common.notSubmitted')) + '</option></select></div>' +
        '<div class="tbl-wrap"><table><thead><tr><th>' + esc(t('list.no')) + '</th><th>' + esc(t('list.title')) + '</th><th>' + esc(t('list.chapter')) + '</th><th>' + esc(t('list.level')) + '</th><th>' + esc(t('list.status')) + '</th><th class="num">' + esc(t('list.submits')) + '</th></tr></thead><tbody id="ptable"></tbody></table></div></section>');
    $('#flt-ch').value = filters.chapter;
    $('#flt-st').value = filters.status;
    $('#flt-ch').onchange = (e) => {
        filters.chapter = e.target.value;
        draw();
    };
    $('#flt-st').onchange = (e) => {
        filters.status = e.target.value;
        draw();
    };
    draw();
}

export async function renderRanking(app) {
    renderShell(app, 'ranking', '<div class="view-title"><h1>' + esc(t('rank.title')) + '</h1><button class="btn" id="rk-refresh">' + esc(t('common.refresh')) + '</button></div><section class="panel" id="rk"><div class="pad muted">' + esc(t('rank.loading')) + '</div></section>');
    $('#rk-refresh').onclick = () => renderRanking(app);
    await app.progress.flushAsync(); // 내 최신 점수를 먼저 올린다
    const listed = await app.ranking.listAsync();
    const box = $('#rk');
    if (!box) {
        return;
    }
    if (listed instanceof Failure) {
        box.innerHTML = '<div class="pad">' + esc(messageOf(listed.error)) + '</div>';
        return;
    }
    if (listed.data.length === 0) {
        box.innerHTML = '<div class="pad">' + esc(t('rank.empty')) + '</div>';
        return;
    }
    box.innerHTML = '<div class="tbl-wrap"><table><thead><tr><th>' + esc(t('rank.rank')) + '</th><th>' + esc(t('rank.nickname')) + '</th><th>' + esc(t('rank.cody')) + '</th><th class="num">' + esc(t('rank.level')) + '</th><th class="num">XP</th><th class="num">' + esc(t('rank.solved')) + '</th><th class="num">' + esc(t('rank.cleared')) + '</th></tr></thead><tbody>' +
        listed.data.map((r) => '<tr class="' + (r.isMe ? 'me' : '') + '"><td>' + (r.rank <= 3 ? '<span class="medal m' + r.rank + '">' + r.rank + '</span>' : r.rank) + '</td>' +
            '<td>' + esc(r.nickname) + (r.isMe ? ' <span class="chip accent">' + esc(t('common.me')) + '</span>' : '') + '</td><td>' + esc(formName(r.form)) + '</td>' +
            '<td class="num">' + r.level + '</td><td class="num">' + r.xp + '</td><td class="num">' + r.solvedCount + '</td><td class="num">' + r.clearedCount + ' / 18</td></tr>').join('') +
        '</tbody></table></div><div class="muted pad small">' + esc(t('rank.optOut')) + '</div>';
}

export function renderRecords(app) {
    const p = app.progress.progress;
    const history = p.history.slice(0, 60).map((h) => {
        const problem = app.content.byProblem.get(h.id);
        const d = new Date(h.at);
        return '<tr><td class="code-text">' + h.id + '</td><td><a href="#p' + h.id + '">' + esc(problem ? problem.title : '') + '</a></td>' +
            '<td><span class="chip ' + (h.res === 'AC' ? 'good' : 'bad') + '">' + esc(t('verdict.' + h.res)) + '</span></td>' +
            '<td class="muted">' + (d.getMonth() + 1) + '/' + d.getDate() + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + '</td></tr>';
    }).join('');
    const chapterRows = app.progress.curriculum.map((c) => {
        const state = chapterState(p, c);
        const quiz = p.quiz[c.chapter];
        const stateChip = { cleared: chip('good', 'common.cleared'), inProgress: chip('', 'common.inProgress'), notStarted: chip('', 'common.notStarted') }[state];
        return '<tr><td>' + c.chapter + '. <a href="#ch' + c.chapter + '">' + esc(chapterTitle(app, c.chapter)) + '</a></td><td class="num">' + solvedCountIn(p, c) + ' / 4</td>' +
            '<td class="num">' + (quiz !== undefined ? quiz + ' / 5' : '-') + '</td><td>' + stateChip + '</td></tr>';
    }).join('');
    renderShell(app, 'records', '<div class="view-title"><h1>' + esc(t('records.title')) + '</h1></div><div class="ch-layout">' +
        '<section class="panel"><div class="pad-head">' + esc(t('records.byChapter')) + '</div><div class="tbl-wrap"><table><thead><tr><th>' + esc(t('list.chapter')) + '</th><th class="num">' + esc(t('records.problem')) + '</th><th class="num">' + esc(t('records.quiz')) + '</th><th>' + esc(t('list.status')) + '</th></tr></thead><tbody>' + chapterRows + '</tbody></table></div></section>' +
        '<section class="panel"><div class="pad-head">' + esc(t('records.recent')) + '</div><div class="tbl-wrap"><table><thead><tr><th>' + esc(t('list.no')) + '</th><th>' + esc(t('records.problem')) + '</th><th>' + esc(t('records.result')) + '</th><th>' + esc(t('records.time')) + '</th></tr></thead><tbody>' +
        (history || '<tr><td colspan="4" class="muted">' + esc(t('records.empty')) + '</td></tr>') + '</tbody></table></div></section></div>');
}

export async function renderTeacher(app) {
    renderShell(app, 'teacher', '<div class="view-title"><h1>' + esc(t('teacher.title')) + '</h1><button class="btn" id="t-refresh">' + esc(t('common.refresh')) + '</button></div><div id="tbox"><section class="panel pad muted">' + esc(t('common.loading')) + '</section></div>');
    $('#t-refresh').onclick = () => renderTeacher(app);
    const listed = await app.teacher.listStudentsAsync();
    const box = $('#tbox');
    if (!box) {
        return;
    }
    if (listed instanceof Failure) {
        box.innerHTML = '<section class="panel pad">' + esc(messageOf(listed.error)) + '</section>';
        return;
    }
    const students = listed.data;
    const rows = students.map((s) => {
        const states = s.chapterStates.length ? s.chapterStates : app.content.chapters.map(() => 'notStarted');
        const heat = states.map((state, i) => '<i class="' + (state === 'cleared' ? 'c' : state === 'inProgress' ? 'p' : '') + '" title="' + esc(t('common.chapterN', { n: i + 1 })) + '"></i>').join('');
        return '<tr><td>' + esc(s.nickname) + ' <span class="muted small">' + esc(s.username) + '</span></td><td>' + esc(formName(s.form)) + '</td><td><div class="heat" aria-label="' + esc(t('teacher.heatAria')) + '">' + heat + '</div></td>' +
            '<td class="num">' + s.solvedCount + '</td><td class="num">' + (s.quizAvg ?? '-') + '</td><td class="num">' + s.xp + '</td><td class="muted">' + (s.lastStudyDay ?? '-') + '</td></tr>';
    }).join('');
    const summaryRows = app.content.chapters.map((c, i) => {
        const cleared = students.filter((s) => s.chapterStates[i] === 'cleared').length;
        const wrongs = {};
        for (const s of students) {
            for (const [pid, n] of Object.entries(s.wrong ?? {})) {
                const problem = app.content.byProblem.get(Number(pid));
                if (problem && problem.ch === c.ch) {
                    wrongs[pid] = (wrongs[pid] ?? 0) + n;
                }
            }
        }
        const top = Object.entries(wrongs).sort((a, b) => b[1] - a[1])[0];
        return '<tr><td>' + c.ch + '. ' + esc(c.title) + '</td><td class="num">' + cleared + ' / ' + students.length + '</td><td>' +
            (top ? '<a href="#p' + top[0] + '">' + top[0] + ' ' + esc(app.content.byProblem.get(Number(top[0])).title) + '</a> <span class="muted">' + esc(t('teacher.wrongTimes', { n: top[1] })) + '</span>' : '<span class="muted">-</span>') + '</td></tr>';
    }).join('');
    box.innerHTML = '<section class="panel" style="margin-bottom:16px"><div class="pad-head">' + esc(t('teacher.students', { n: students.length })) + ' <span class="muted small">' + esc(t('teacher.legend')) + '</span></div>' +
        '<div class="tbl-wrap"><table><thead><tr><th>' + esc(t('rank.nickname')) + '</th><th>' + esc(t('rank.cody')) + '</th><th>' + esc(t('teacher.chapters')) + '</th><th class="num">' + esc(t('rank.solved')) + '</th><th class="num">' + esc(t('teacher.quizAvg')) + '</th><th class="num">XP</th><th>' + esc(t('teacher.lastDay')) + '</th></tr></thead><tbody>' +
        (rows || '<tr><td colspan="7" class="muted">' + esc(t('teacher.noStudents')) + '</td></tr>') + '</tbody></table></div></section>' +
        '<section class="panel"><div class="pad-head">' + esc(t('teacher.summary')) + '</div><div class="tbl-wrap"><table><thead><tr><th>' + esc(t('list.chapter')) + '</th><th class="num">' + esc(t('teacher.clearedStudents')) + '</th><th>' + esc(t('teacher.mostWrong')) + '</th></tr></thead><tbody>' + summaryRows + '</tbody></table></div>' +
        '<div class="muted pad small">' + esc(t('teacher.privacy')) + '</div></section>';
}
