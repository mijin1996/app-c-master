// 화면 틀: 상단 메뉴 + 본문 자리. 모든 화면이 이 틀 안에 그려진다.
// 코디는 학습 지도 · 문제 화면에 크게 보이니 상단에는 따로 두지 않는다.
import { $, ICON, esc } from '../ui/dom.js';
import { t } from '../i18n/index.js';
import { CREDITS_BUTTON, bindCreditsButtons } from './credits-modal.js';
import { INSTALL_ICON_BUTTON, bindInstallButtons } from './install-guide.js';
import { VISIT_SLOT, bindVisits } from './visit-count.js';
import { langSwitchHtml, bindLangSwitch } from './lang-switch.js';

const NAV = Object.freeze(['map', 'problems', 'algo', 'oop', 'community', 'ranking', 'records']);

export function renderShell(app, active, inner) {
    const nav = app.teacher.isTeacher ? [...NAV, 'teacher'] : NAV;
    document.title = t('app.title');
    app.root.innerHTML =
        '<header class="top"><div class="wrap">' +
        '<a class="logo" href="#map"><span>c-<b>master</b></span></a>' +
        '<nav class="nav" aria-label="' + esc(t('common.menu')) + '">' + nav.map((hash) => '<a href="#' + hash + '" class="' + (active === hash ? 'on' : '') + '">' + esc(t('nav.' + hash)) + '</a>').join('') + '</nav>' +
        '<div class="right"><span class="skychip"></span>' + langSwitchHtml() + INSTALL_ICON_BUTTON() +
        '<button class="iconbtn" id="btn-settings" title="' + esc(t('nav.settings')) + '" aria-label="' + esc(t('nav.settings')) + '">' + ICON.gear + '</button>' +
        '</div></div></header><main><div class="wrap visit-bar">' + VISIT_SLOT + '</div><div class="wrap" id="view">' + inner + '</div></main>' +
        '<footer class="foot"><div class="wrap">' + CREDITS_BUTTON() + '</div></footer>';
    app.sky.compute();
    bindCreditsButtons(app.root);
    bindInstallButtons(app.root);
    bindVisits(app.visits, app.root);
    bindLangSwitch(app, app.root);

    $('#btn-settings').onclick = () => app.openSettings();
}
