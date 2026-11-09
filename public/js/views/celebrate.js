// 축하 연출: 단원 클리어, 레벨 업, 코디 진화 (옵저버처럼 Service가 알려 준 events를 받아 처리)
import { $, esc, toast } from '../ui/dom.js';
import { cody } from '../ui/cody.js';
import { FORM_NAMES } from '../domain/progress-rules.js';
import { showLevelUpOverlay } from '../ui/effects.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const CELEBRATE_DELAY_MS = 900;
const EVOLVE_DELAY_MS = 1300;
const LEVEL_AFTER_CLEAR_MS = 1200;
const LEVEL_OVERLAY_MS = 3000; // 레벨 업 화면이 끝난 뒤 진화 창을 띄운다

function showEvolution(app, from, to) {
    const name = app.progress.progress.settings.codyName;
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = '<div class="panel modal evo" role="dialog" aria-modal="true" aria-labelledby="evo-t"><h2 id="evo-t">' + esc(name) + '가 진화했어요!</h2>' +
        '<div class="pair"><div>' + cody(from, 'normal', { name }) + '<div class="muted">' + FORM_NAMES[from] + '</div></div><div class="arrow">→</div>' +
        '<div class="glow">' + cody(to, 'happy', { name }) + '<div style="font-weight:700">' + FORM_NAMES[to] + '</div></div></div>' +
        '<p style="margin:0">' + (to === FORM_NAMES.length - 1 ? '18단원을 모두 클리어했어요. 이제 진짜 C 마스터예요!' : '스테이지를 클리어해서 새로운 모습이 되었어요. 다음 스테이지도 함께 가요!') + '</p>' +
        '<button class="btn primary" id="evo-ok">좋아요!</button></div>';
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
        toast(events.chapterCleared + '단원 클리어! ' + (next <= 18 ? '다음은 ' + next + '단원이에요.' : '모든 단원을 마쳤어요!'));
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
