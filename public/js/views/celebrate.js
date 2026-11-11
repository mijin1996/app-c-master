// 축하 연출: 단원 클리어, 레벨 업, 코디 진화 (옵저버처럼 Service가 알려 준 events를 받아 처리)
import { $, esc, toast } from '../ui/dom.js';
import { cody, formName, codyNameOf } from '../ui/cody.js';
import { FORM_NAMES } from '../domain/progress-rules.js';
import { showLevelUpOverlay } from '../ui/effects.js';
import { t } from '../i18n/index.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const CELEBRATE_DELAY_MS = 900;
const EVOLVE_DELAY_MS = 1300;
const LEVEL_AFTER_CLEAR_MS = 1200;
const LEVEL_OVERLAY_MS = 3000; // 레벨 업 화면이 끝난 뒤 진화 창을 띄운다
const LAST_CHAPTER = 18;

function showEvolution(app, from, to) {
    const name = codyNameOf(app.progress.progress.settings);
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = '<div class="panel modal evo" role="dialog" aria-modal="true" aria-labelledby="evo-t"><h2 id="evo-t">' + esc(t('celebrate.evolved', { name })) + '</h2>' +
        '<div class="pair"><div>' + cody(from, 'normal', { name }) + '<div class="muted">' + esc(formName(from)) + '</div></div><div class="arrow">→</div>' +
        '<div class="glow">' + cody(to, 'happy', { name }) + '<div style="font-weight:700">' + esc(formName(to)) + '</div></div></div>' +
        '<p style="margin:0">' + esc(t(to === FORM_NAMES.length - 1 ? 'celebrate.master' : 'celebrate.stage')) + '</p>' +
        '<button class="btn primary" id="evo-ok">' + esc(t('celebrate.ok')) + '</button></div>';
    document.body.appendChild(bg);
    $('#evo-ok').focus();
    $('#evo-ok').onclick = () => {
        bg.remove();
        if (location.hash === '#map') {
            app.router.refresh();
        }
    };
}

export async function celebrateAsync(app, events) {
    if (events.chapterCleared) {
        await wait(CELEBRATE_DELAY_MS);
        const next = events.chapterCleared + 1;
        toast(next <= LAST_CHAPTER ? t('celebrate.chapterNext', { n: events.chapterCleared, next }) : t('celebrate.chapterAll', { n: events.chapterCleared }));
    }
    if (events.levelUp) {
        // 레벨이 오를 때마다 화면 전체를 잠깐 덮는 회전 글자
        await wait(events.chapterCleared ? LEVEL_AFTER_CLEAR_MS : CELEBRATE_DELAY_MS);
        showLevelUpOverlay(events.levelUp);
        await wait(LEVEL_OVERLAY_MS);
    }
    if (events.evolvedTo !== null && events.evolvedTo !== undefined) {
        await wait(EVOLVE_DELAY_MS);
        const from = app.progress.progress.formSeen;
        app.progress.markFormSeen(events.evolvedTo);
        showEvolution(app, from, events.evolvedTo);
    }
}
