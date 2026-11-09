// 성장형 캐릭터 코디. 그림은 Gemini로 만든 오리지널 픽셀 아트 (public/assets/cody/).
// form 0~4 (아기 → 초딩 → 중딩 → 고딩 → C 마스터), mood normal | happy | think
import { esc } from './dom.js';
import { FORM_NAMES } from '../domain/progress-rules.js';

const MOODS = Object.freeze(['normal', 'happy', 'think']);
const LAST_FORM = FORM_NAMES.length - 1;

export function codySrc(form, mood) {
    const f = Math.min(LAST_FORM, Math.max(0, Math.trunc(Number(form)) || 0));
    const m = MOODS.includes(mood) ? mood : 'normal';
    return '/assets/cody/cody-' + f + '-' + m + '.png';
}

export function cody(form, mood, opt = {}) {
    const f = Math.min(LAST_FORM, Math.max(0, Math.trunc(Number(form)) || 0));
    const label = (opt.name || '코디') + ' - ' + FORM_NAMES[f];
    return '<img class="cody-img ' + esc(opt.cls || '') + '" src="' + codySrc(f, mood) + '" alt="' + esc(label) + '" width="48" height="48" draggable="false">';
}

export const CHEER = {
    idle: ['오늘도 한 문제씩 같이 풀어 봐요!', '막히면 힌트 버튼을 눌러 봐요.', '세미콜론(;) 잊지 않기!', '틀려도 괜찮아요. 고치면서 느는 거예요.'],
    ac: ['맞았어요! 최고예요!', '완벽해요! 다음 문제도 가 볼까요?', '와, 한 번에 해냈네요!', '코드가 아주 깔끔해요!'],
    wa: ['괜찮아요, 어디가 다른지 같이 봐요.', '출력 형식(공백, 줄바꿈)을 확인해 봐요.', '예제 말고 다른 입력도 생각해 봐요.', '조금만 고치면 될 것 같아요!'],
    night: ['밤샘 코딩은 적당히! 눈도 쉬어 줘요.', '밤이 깊었어요. 오늘 한 것도 충분히 대단해요.'],
};
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
