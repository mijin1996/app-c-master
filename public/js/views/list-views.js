// 목록 화면들: 전체 문제, 친구 랭킹, 내 기록, 선생님 화면
import { $, esc, pad2 } from '../ui/dom.js';
import { Failure } from '../core/result.js';
import { messageOf } from '../core/app-error.js';
import { renderShell } from './shell.js';
import { starStr } from './map-views.js';
import { FORM_NAMES, chapterState, solvedCountIn } from '../domain/progress-rules.js';
import { VerdictLabel } from '../services/judge-service.js';

const filters = { chapter: 'all', status: 'all' };

export function renderProblems(app) {
    const p = app.progress.progress;
    const all = app.content.problems;
    const statusOf = (problem) => (p.solved[problem.id] ? 'ok' : p.tries[problem.id] ? 'try' : 'none');
    const draw = () => {
        const rows = all
            .filter((problem) => (filters.chapter === 'all' || problem.ch === Number(filters.chapter)) && (filters.status === 'all' || statusOf(problem) === filters.status))
            .map((problem) => {
                const status = { ok: '<span class="chip good">정답</span>', try: '<span class="chip bad">도전 중</span>', none: '<span class="chip">미제출</span>' }[statusOf(problem)];
                return '<tr><td class="num code-text">' + problem.id + '</td><td><a href="#p' + problem.id + '">' + esc(problem.title) + '</a></td><td>' + problem.ch + '. ' + esc(app.content.byChapter.get(problem.ch).title) + '</td>' +
                    '<td class="stars">' + starStr(problem.level) + '</td><td>' + status + '</td><td class="num">' + (p.tries[problem.id] ?? 0) + '</td></tr>';
            }).join('');
        $('#ptable').innerHTML = rows || '<tr><td colspan="6" class="muted">조건에 맞는 문제가 없어요.</td></tr>';
    };
    renderShell(app, 'problems', '<div class="view-title"><h1>문제</h1><span class="on-sky muted">전체 ' + all.length + '문제 중 ' + app.progress.summary.solvedCount + '문제 정답</span></div>' +
        '<section class="panel"><div class="filters"><select id="flt-ch" aria-label="단원"><option value="all">전체 단원</option>' +
        app.content.chapters.map((c) => '<option value="' + c.ch + '">' + c.ch + '. ' + esc(c.title) + '</option>').join('') + '</select>' +
        '<select id="flt-st" aria-label="상태"><option value="all">모든 상태</option><option value="ok">정답</option><option value="try">도전 중</option><option value="none">미제출</option></select></div>' +
        '<div class="tbl-wrap"><table><thead><tr><th>번호</th><th>제목</th><th>단원</th><th>난이도</th><th>상태</th><th class="num">제출</th></tr></thead><tbody id="ptable"></tbody></table></div></section>');
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
    renderShell(app, 'ranking', '<div class="view-title"><h1>친구 랭킹</h1><button class="btn" id="rk-refresh">새로고침</button></div><section class="panel" id="rk"><div class="pad muted">랭킹을 불러오는 중이에요…</div></section>');
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
        box.innerHTML = '<div class="pad">아직 랭킹에 아무도 없어요. 문제를 풀면 내가 첫 번째로 올라가요!</div>';
        return;
    }
    box.innerHTML = '<div class="tbl-wrap"><table><thead><tr><th>순위</th><th>닉네임</th><th>코디</th><th class="num">레벨</th><th class="num">XP</th><th class="num">푼 문제</th><th class="num">클리어 단원</th></tr></thead><tbody>' +
        listed.data.map((r) => '<tr class="' + (r.isMe ? 'me' : '') + '"><td>' + (r.rank <= 3 ? '<span class="medal m' + r.rank + '">' + r.rank + '</span>' : r.rank) + '</td>' +
            '<td>' + esc(r.nickname) + (r.isMe ? ' <span class="chip accent">나</span>' : '') + '</td><td>' + FORM_NAMES[r.form] + '</td>' +
            '<td class="num">' + r.level + '</td><td class="num">' + r.xp + '</td><td class="num">' + r.solvedCount + '</td><td class="num">' + r.clearedCount + ' / 18</td></tr>').join('') +
        '</tbody></table></div><div class="muted pad small">설정에서 랭킹 참여를 끌 수 있어요.</div>';
}

export function renderRecords(app) {
    const p = app.progress.progress;
    const history = p.history.slice(0, 60).map((h) => {
        const problem = app.content.byProblem.get(h.id);
        const d = new Date(h.at);
        return '<tr><td class="code-text">' + h.id + '</td><td><a href="#p' + h.id + '">' + esc(problem ? problem.title : '') + '</a></td>' +
            '<td><span class="chip ' + (h.res === 'AC' ? 'good' : 'bad') + '">' + (VerdictLabel[h.res] ?? h.res) + '</span></td>' +
            '<td class="muted">' + (d.getMonth() + 1) + '/' + d.getDate() + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + '</td></tr>';
    }).join('');
    const chapterRows = app.progress.curriculum.map((c) => {
        const state = chapterState(p, c);
        const quiz = p.quiz[c.chapter];
        const chip = { cleared: '<span class="chip good">클리어</span>', inProgress: '<span class="chip">진행 중</span>', notStarted: '<span class="chip">시작 전</span>' }[state];
        return '<tr><td>' + c.chapter + '. <a href="#ch' + c.chapter + '">' + esc(c.title) + '</a></td><td class="num">' + solvedCountIn(p, c) + ' / 4</td>' +
            '<td class="num">' + (quiz !== undefined ? quiz + ' / 5' : '-') + '</td><td>' + chip + '</td></tr>';
    }).join('');
    renderShell(app, 'records', '<div class="view-title"><h1>내 기록</h1></div><div class="ch-layout">' +
        '<section class="panel"><div class="pad-head">단원별 진도</div><div class="tbl-wrap"><table><thead><tr><th>단원</th><th class="num">문제</th><th class="num">퀴즈</th><th>상태</th></tr></thead><tbody>' + chapterRows + '</tbody></table></div></section>' +
        '<section class="panel"><div class="pad-head">최근 제출</div><div class="tbl-wrap"><table><thead><tr><th>번호</th><th>문제</th><th>결과</th><th>시각</th></tr></thead><tbody>' +
        (history || '<tr><td colspan="4" class="muted">아직 제출한 기록이 없어요.</td></tr>') + '</tbody></table></div></section></div>');
}

export async function renderTeacher(app) {
    renderShell(app, 'teacher', '<div class="view-title"><h1>선생님 · 학생 진도</h1><button class="btn" id="t-refresh">새로고침</button></div><div id="tbox"><section class="panel pad muted">불러오는 중이에요…</section></div>');
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
        const heat = states.map((state, i) => '<i class="' + (state === 'cleared' ? 'c' : state === 'inProgress' ? 'p' : '') + '" title="' + (i + 1) + '단원"></i>').join('');
        return '<tr><td>' + esc(s.nickname) + ' <span class="muted small">' + esc(s.username) + '</span></td><td>' + FORM_NAMES[s.form] + '</td><td><div class="heat" aria-label="단원 진도">' + heat + '</div></td>' +
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
            (top ? '<a href="#p' + top[0] + '">' + top[0] + ' ' + esc(app.content.byProblem.get(Number(top[0])).title) + '</a> <span class="muted">(오답 ' + top[1] + '회)</span>' : '<span class="muted">-</span>') + '</td></tr>';
    }).join('');
    box.innerHTML = '<section class="panel" style="margin-bottom:16px"><div class="pad-head">학생 ' + students.length + '명 <span class="muted small">· 초록 클리어, 주황 진행 중</span></div>' +
        '<div class="tbl-wrap"><table><thead><tr><th>닉네임</th><th>코디</th><th>단원 1~18</th><th class="num">푼 문제</th><th class="num">퀴즈 평균</th><th class="num">XP</th><th>마지막 학습일</th></tr></thead><tbody>' +
        (rows || '<tr><td colspan="7" class="muted">아직 가입한 학생이 없어요.</td></tr>') + '</tbody></table></div></section>' +
        '<section class="panel"><div class="pad-head">단원별 요약</div><div class="tbl-wrap"><table><thead><tr><th>단원</th><th class="num">클리어한 학생</th><th>가장 많이 틀린 문제</th></tr></thead><tbody>' + summaryRows + '</tbody></table></div>' +
        '<div class="muted pad small">학생이 제출한 코드는 보이지 않고, 진도 수치만 보여요.</div></section>';
}
