// 알고리즘 화면: USACO처럼 브론즈 → 실버 → 골드 → 플래티넘 단계별 섹션 (글자는 사전 · 지금 언어의 콘텐츠에서)
import { esc } from '../ui/dom.js';
import { renderShell } from './shell.js';
import { XP_BY_LEVEL, SOLVE_LIMIT_SEC, problemStatusOf } from '../domain/progress-rules.js';
import { statusChipHtml } from './view-helpers.js';
import { t } from '../i18n/index.js';

const SEC_PER_MIN = 60;
// 단계마다 더 공부할 곳 (USACO Guide 단계 주소)
const GUIDE_PATH = Object.freeze({ bronze: 'bronze', silver: 'silver', gold: 'gold', platinum: 'plat' });

/** 단계의 진행 상태: 다 풀었는지, 몇 개 풀었는지 */
function trackProgress(progress, track) {
    const solved = track.problems.filter((problem) => progress.solved[problem.id]).length;
    return { solved, total: track.problems.length, done: solved === track.problems.length };
}

function trackSection(app, track, open) {
    const p = app.progress.progress;
    const state = trackProgress(p, track);
    const rows = track.problems.map((problem) => {
        const status = statusChipHtml(problemStatusOf(p, problem.id));
        return '<tr><td class="code-text tier-no">' + problem.id + '</td><td><a href="#p' + problem.id + '">' + esc(problem.title) + '</a></td>' +
            '<td>' + status + '</td><td class="num">' + (p.tries[problem.id] ?? 0) + '</td></tr>';
    }).join('');
    return '<section class="panel tier-sec t' + track.level + (open ? ' focus' : '') + '" id="tier-' + track.track + '">' +
        '<div class="tier-head"><span class="tier big t' + track.level + '">' + esc(track.name) + '</span>' +
        '<div class="tier-meta">' + t('algo.meta', { solved: state.solved, total: state.total, xp: XP_BY_LEVEL[track.level], min: SOLVE_LIMIT_SEC[track.level] / SEC_PER_MIN }) +
        (state.done ? ' <span class="chip good">' + esc(t('algo.done')) + '</span>' : '') + '</div></div>' +
        '<p class="tier-intro">' + esc(track.intro) + '</p>' +
        '<div class="chips">' + track.topics.map((topic) => '<span class="chip">' + esc(topic) + '</span>').join('') + '</div>' +
        '<div class="tier-links">' + esc(t('algo.more')) + '<a href="https://usaco.org/index.php" target="_blank" rel="noopener noreferrer">' + esc(t('algo.usaco')) + '</a> · ' +
        '<a href="https://usaco.guide/' + GUIDE_PATH[track.track] + '" target="_blank" rel="noopener noreferrer">' + esc(t('algo.guide', { name: track.name })) + '</a></div>' +
        '<div class="tbl-wrap"><table><thead><tr><th>' + esc(t('list.no')) + '</th><th>' + esc(t('list.title')) + '</th><th>' + esc(t('list.status')) + '</th><th class="num">' + esc(t('list.submits')) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div></section>';
}

export function renderAlgorithm(app, focus) {
    const tracks = app.content.tracks;
    const ladder = tracks.map((track) => {
        const state = trackProgress(app.progress.progress, track);
        return '<a class="rung t' + track.level + '" href="#algo-' + track.track + '"><span class="tier t' + track.level + '">' + esc(track.name) + '</span><small>' + state.solved + '/' + state.total + '</small></a>';
    }).join('<span class="rung-arrow" aria-hidden="true">›</span>');
    renderShell(app, 'algo',
        '<div class="view-title"><h1>' + esc(t('algo.title')) + '</h1><span class="on-sky muted">' + esc(t('algo.subtitle')) + '</span></div>' +
        '<div class="panel pad lang-note">' + t('algo.langNote') + '</div>' +
        '<nav class="ladder panel" aria-label="' + esc(t('algo.ladderAria')) + '">' + ladder + '</nav>' +
        '<div class="tier-list">' + tracks.map((track) => trackSection(app, track, track.track === focus)).join('') + '</div>' +
        '<p class="muted small on-sky" style="margin-top:12px">' + esc(t('algo.footnote')) + '</p>');
    if (focus) {
        document.getElementById('tier-' + focus)?.scrollIntoView({ block: 'start' });
    }
}
