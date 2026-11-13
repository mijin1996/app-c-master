// 배경 밝기 버튼 (자동 · 낮 · 밤): 로그인하기 전 화면(로그인 · 계정 찾기)에서도 고를 수 있게 한다.
// 로그인 전에는 진도(서버)가 없으므로 고른 값을 이 기기(localStorage)에 기억한다.
// 로그인한 뒤에는 설정 창의 "배경" 값(진도에 저장)이 우선이다.
import { esc } from '../ui/dom.js';
import { t } from '../i18n/index.js';

const GUEST_SKY_KEY = 'cm-guest-sky';
export const SKY_CHOICES = Object.freeze(['auto', 'day', 'night']);

/** 로그인 전 화면에서 쓸 배경 값. 저장된 값이 없거나 이상하면 auto */
export function readGuestSky(storage = globalThis.localStorage) {
    try {
        const value = storage?.getItem(GUEST_SKY_KEY);
        return SKY_CHOICES.includes(value) ? value : 'auto';
    } catch (e) {
        return 'auto';
    }
}

export function saveGuestSky(value, storage = globalThis.localStorage) {
    if (!SKY_CHOICES.includes(value)) {
        return;
    }
    try {
        storage?.setItem(GUEST_SKY_KEY, value);
    } catch (e) {
        // 저장을 못 하는 브라우저(사생활 보호 모드 등)면 이번 화면에서만 바뀐다
    }
}

export function skySwitchHtml(current = readGuestSky()) {
    return '<label class="lang-switch sky-switch" title="' + esc(t('sky.label')) + '">' +
        '<select data-sky aria-label="' + esc(t('sky.label')) + '">' +
        SKY_CHOICES.map((value) => '<option value="' + value + '"' + (value === current ? ' selected' : '') + '>' + esc(t('sky.' + value)) + '</option>').join('') +
        '</select></label>';
}

export function bindSkySwitch(app, root = document) {
    root.querySelectorAll('[data-sky]').forEach((select) => {
        select.onchange = () => app.setGuestSky(select.value);
    });
}
