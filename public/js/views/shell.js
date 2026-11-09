// 화면 틀: 상단 메뉴 + 본문 자리. 모든 화면이 이 틀 안에 그려진다.
import { $, esc, ICON, toast } from '../ui/dom.js';
import { cody } from '../ui/cody.js';
import { FORM_NAMES } from '../domain/progress-rules.js';
import { CREDITS_BUTTON, bindCreditsButtons } from './credits-modal.js';

const NAV = Object.freeze([
    ['map', '학습 지도'],
    ['problems', '문제'],
    ['algo', '알고리즘'],
    ['oop', '객체지향'],
    ['community', '커뮤니티'],
    ['ranking', '랭킹'],
    ['records', '내 기록'],
]);

export function renderShell(app, active, inner) {
    const settings = app.progress.progress.settings;
    const form = app.progress.currentForm();
    const nav = app.teacher.isTeacher ? [...NAV, ['teacher', '선생님']] : NAV;
    app.root.innerHTML =
        '<header class="top"><div class="wrap">' +
        '<a class="logo" href="#map"><span>c-<b>master</b></span></a>' +
        '<nav class="nav" aria-label="메뉴">' + nav.map(([hash, title]) => '<a href="#' + hash + '" class="' + (active === hash ? 'on' : '') + '">' + title + '</a>').join('') + '</nav>' +
        '<div class="right"><span class="skychip"></span>' +
        '<button class="iconbtn" id="btn-settings" title="설정" aria-label="설정">' + ICON.gear + '</button>' +
        '<a class="mini-cody" href="#map" title="' + esc(settings.codyName) + ' · ' + FORM_NAMES[form] + '">' + cody(form, 'normal', { name: settings.codyName }) + '</a>' +
        '</div></div></header><main><div class="wrap" id="view">' + inner + '</div></main>' +
        '<footer class="foot"><div class="wrap">' + CREDITS_BUTTON + '</div></footer>';
    app.sky.compute();
    bindCreditsButtons(app.root);

    $('#btn-settings').onclick = () => app.openSettings();
}
