// 성장형 캐릭터 코디. 그림은 Gemini로 만든 오리지널 픽셀 아트 (public/assets/cody/).
// form 0~4 (아기 → 초딩 → 중딩 → 고딩 → C 마스터), mood normal | happy | think
import { esc } from './dom.js';
import { FORM_NAMES } from '../domain/progress-rules.js';
import { t } from '../i18n/index.js';
import { DEFAULT_SETTINGS } from '../domain/progress-model.js';

const MOODS = Object.freeze(['normal', 'happy', 'think']);
const LAST_FORM = FORM_NAMES.length - 1;

export function codySrc(form, mood) {
    const f = Math.min(LAST_FORM, Math.max(0, Math.trunc(Number(form)) || 0));
    const m = MOODS.includes(mood) ? mood : 'normal';
    return '/assets/cody/cody-' + f + '-' + m + '.png';
}

/** 캐릭터 이름: 기본 이름(코디)이면 지금 언어의 기본 이름(Cody), 직접 지은 이름이면 그대로 */
export const codyNameOf = (settings) => (!settings?.codyName || settings.codyName === DEFAULT_SETTINGS.codyName ? t('cody.defaultName') : settings.codyName);

/** 코디 단계 이름 (지금 언어) */
export const formName = (form) => t('form.' + Math.min(LAST_FORM, Math.max(0, Math.trunc(Number(form)) || 0)));

export function cody(form, mood, opt = {}) {
    const f = Math.min(LAST_FORM, Math.max(0, Math.trunc(Number(form)) || 0));
    const label = (opt.name || t('cody.defaultName')) + ' - ' + formName(f);
    return '<img class="cody-img ' + esc(opt.cls || '') + '" src="' + codySrc(f, mood) + '" alt="' + esc(label) + '" width="48" height="48" draggable="false">';
}

// 코디의 말: 사전 키 목록 (cheer.종류.번호)
const CHEER_COUNT = Object.freeze({ idle: 4, ac: 4, wa: 4, night: 2 });
export const CHEER = Object.freeze(Object.fromEntries(Object.entries(CHEER_COUNT)
    .map(([kind, n]) => [kind, Array.from({ length: n }, (_, i) => 'cheer.' + kind + '.' + i)])));

/** 목록에서 하나를 골라 지금 언어 문장으로 */
export const pick = (keys) => t(keys[Math.floor(Math.random() * keys.length)]);
