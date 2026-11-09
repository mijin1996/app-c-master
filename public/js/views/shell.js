// 화면 틀: 상단 메뉴 + 본문 자리. 모든 화면이 이 틀 안에 그려진다.
import { $, esc, ICON, toast } from '../ui/dom.js';
import { cody } from '../ui/cody.js';
import { FORM_NAMES } from '../domain/progress-rules.js';

const NAV = Object.freeze([
    ['map', '학습 지도'],
    ['problems', '문제'],
    ['algo', '알고리즘'],
    ['ranking', '랭킹'],
    ['records', '내 기록'],
]);

export function renderShell(app, active, inner) {
    const settings = app.progress.progress.settings;
    const form = app.progress.currentForm();
    const nav = app.teacher.isTeacher ? [...NAV, ['teacher', '선생님']] : NAV;
    app.root.innerHTML =
        '<header class="top"><div class="wrap">' +
        '<a class="logo" href="#map"><span>code<b>.ai</b></span></a>' +
        '<nav class="nav" aria-label="메뉴">' + nav.map(([hash, title]) => '<a href="#' + hash + '" class="' + (active === hash ? 'on' : '') + '">' + title + '</a>').join('') + '</nav>' +
        '<div class="right"><span class="skychip"></span>' +
        '<button class="iconbtn ' + (settings.bgm ? 'on' : '') + '" id="btn-bgm" title="배경음악 켜기/끄기" aria-label="배경음악 켜기/끄기" aria-pressed="' + settings.bgm + '">' + ICON.music + '</button>' +
        '<button class="iconbtn" id="btn-settings" title="설정" aria-label="설정">' + ICON.gear + '</button>' +
        '<a class="mini-cody" href="#map" title="' + esc(settings.codyName) + ' · ' + FORM_NAMES[form] + '">' + cody(form, 'normal', { name: settings.codyName }) + '</a>' +
        '</div></div></header><main><div class="wrap" id="view">' + inner + '</div></main>';
    app.sky.compute();

    $('#btn-bgm').onclick = async () => {
        const on = !app.progress.progress.settings.bgm;
        app.progress.updateSettings({ bgm: on });
        const button = $('#btn-bgm');
        button.classList.toggle('on', on);
        button.setAttribute('aria-pressed', String(on));
        await app.sound.setBgmAsync(on);
        toast(on ? '배경음악을 켰어요.' : '배경음악을 껐어요.');
    };
    $('#btn-settings').onclick = () => app.openSettings();
}
