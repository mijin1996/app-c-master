// 알고리즘 화면: USACO처럼 브론즈 → 실버 → 골드 → 플래티넘 단계별 섹션
import { esc } from '../ui/dom.js';
import { renderShell } from './shell.js';
import { XP_BY_LEVEL, SOLVE_LIMIT_SEC } from '../domain/progress-rules.js';

const SEC_PER_MIN = 60;

/** 단계의 진행 상태: 다 풀었는지, 몇 개 풀었는지 */
function trackProgress(progress, track) {
    const solved = track.problems.filter((problem) => progress.solved[problem.id]).length;
    return { solved, total: track.problems.length, done: solved === track.problems.length };
}

function trackSection(app, track, open) {
    const p = app.progress.progress;
    const state = trackProgress(p, track);
    const rows = track.problems.map((problem) => {
        const status = p.solved[problem.id]
            ? '<span class="chip good">정답</span>'
            : p.tries[problem.id] ? '<span class="chip bad">도전 중</span>' : '<span class="chip">미제출</span>';
        return '<tr><td class="code-text tier-no">' + problem.id + '</td><td><a href="#p' + problem.id + '">' + esc(problem.title) + '</a></td>' +
            '<td>' + status + '</td><td class="num">' + (p.tries[problem.id] ?? 0) + '</td></tr>';
    }).join('');
    return '<section class="panel tier-sec t' + track.level + (open ? ' focus' : '') + '" id="tier-' + track.track + '">' +
        '<div class="tier-head"><span class="tier big t' + track.level + '">' + esc(track.name) + '</span>' +
        '<div class="tier-meta"><b>' + state.solved + ' / ' + state.total + '</b> 문제 · 문제당 +' + XP_BY_LEVEL[track.level] + ' XP · 제한 ' + (SOLVE_LIMIT_SEC[track.level] / SEC_PER_MIN) + '분' +
        (state.done ? ' <span class="chip good">완료</span>' : '') + '</div></div>' +
        '<p class="tier-intro">' + esc(track.intro) + '</p>' +
        '<div class="chips">' + track.topics.map((topic) => '<span class="chip">' + esc(topic) + '</span>').join('') + '</div>' +
        '<div class="tbl-wrap"><table><thead><tr><th>번호</th><th>제목</th><th>상태</th><th class="num">제출</th></tr></thead><tbody>' + rows + '</tbody></table></div></section>';
}

export function renderAlgorithm(app, focus) {
    const tracks = app.content.tracks;
    const ladder = tracks.map((track) => {
        const state = trackProgress(app.progress.progress, track);
        return '<a class="rung t' + track.level + '" href="#algo-' + track.track + '"><span class="tier t' + track.level + '">' + esc(track.name) + '</span><small>' + state.solved + '/' + state.total + '</small></a>';
    }).join('<span class="rung-arrow" aria-hidden="true">›</span>');
    renderShell(app, 'algo',
        '<div class="view-title"><h1>알고리즘</h1><span class="on-sky muted">단원을 끝냈다면 단계별 알고리즘 문제에 도전해요</span></div>' +
        '<nav class="ladder panel" aria-label="알고리즘 단계">' + ladder + '</nav>' +
        '<div class="tier-list">' + tracks.map((track) => trackSection(app, track, track.track === focus)).join('') + '</div>' +
        '<p class="muted small on-sky" style="margin-top:12px">USACO처럼 단계를 나눴어요. 문제는 모두 code.ai 가 새로 만든 연습 문제예요.</p>');
    if (focus) {
        document.getElementById('tier-' + focus)?.scrollIntoView({ block: 'start' });
    }
}
