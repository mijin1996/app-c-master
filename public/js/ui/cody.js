// 성장형 캐릭터 코디 (SVG로 직접 그린 오리지널 캐릭터). form 0~4, mood normal | happy | think
import { esc } from './dom.js';
import { FORM_NAMES } from '../domain/progress-rules.js';
export function cody(form, mood, opt = {}) {
    const night = document.documentElement.getAttribute('data-mode') === 'night';
    const shirt = ['#36b5a2', '#4b5bd6', '#2f3b52', '#7a3fd1', '#d8432f'][form];
    const skin = '#ffd9b8', hair = '#3a2a22';
    const eyes = mood === 'happy'
        ? '<path d="M78 82 q6 -8 12 0" stroke="#2a1d16" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M110 82 q6 -8 12 0" stroke="#2a1d16" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
        : mood === 'think'
            ? '<circle cx="85" cy="80" r="4.2" fill="#2a1d16"/><circle cx="117" cy="80" r="4.2" fill="#2a1d16"/><path d="M76 68 l14 -3" stroke="#2a1d16" stroke-width="3" stroke-linecap="round"/><path d="M110 64 l14 4" stroke="#2a1d16" stroke-width="3" stroke-linecap="round"/>'
            : '<ellipse cx="84" cy="82" rx="4.5" ry="5.5" fill="#2a1d16"/><ellipse cx="116" cy="82" rx="4.5" ry="5.5" fill="#2a1d16"/><circle cx="85.5" cy="80" r="1.6" fill="#fff"/><circle cx="117.5" cy="80" r="1.6" fill="#fff"/>';
    const mouth = mood === 'happy'
        ? '<path d="M90 96 q10 12 20 0 z" fill="#b8423a"/>'
        : mood === 'think' ? '<path d="M93 100 q4 -3 7 0 q4 3 7 0" stroke="#2a1d16" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
            : '<path d="M92 97 q8 7 16 0" stroke="#2a1d16" stroke-width="3" fill="none" stroke-linecap="round"/>';
    let back = '', body = '', head = '', desk = '', front = '';
    if (form >= 4) back += '<path d="M58 118 q-22 50 -14 74 l112 0 q8 -24 -14 -74 z" fill="#8f1f2c"/><path d="M62 120 q-14 40 -8 70" stroke="#c23345" stroke-width="3" fill="none"/>';
    if (form >= 3) {
        back += '<g><rect x="2" y="104" width="50" height="38" rx="4" fill="#1d2438" stroke="#55607d" stroke-width="2"/><rect x="7" y="109" width="40" height="28" fill="#0e1a2e"/><path d="M11 115h18M11 121h26M11 127h14M15 133h20" stroke="#4cc98b" stroke-width="2.5" stroke-linecap="round"/><rect x="22" y="142" width="10" height="8" fill="#55607d"/></g>';
        back += '<g><rect x="148" y="104" width="50" height="38" rx="4" fill="#1d2438" stroke="#55607d" stroke-width="2"/><rect x="153" y="109" width="40" height="28" fill="#0e1a2e"/><path d="M157 115h22M161 121h14M157 127h28M157 133h10" stroke="#7dd3fc" stroke-width="2.5" stroke-linecap="round"/><rect x="168" y="142" width="10" height="8" fill="#55607d"/></g>';
    }
    if (form >= 1) back += '<path d="M62 122 q-4 -22 14 -28 q24 10 48 0 q18 6 14 28 z" fill="' + shirt + '"/><path d="M70 120 q30 10 60 0" stroke="rgba(0,0,0,.18)" stroke-width="3" fill="none"/>';
    body = '<path d="M56 162 q0 -46 44 -46 q44 0 44 46 z" fill="' + shirt + '"/>';
    if (form === 0) body += '<text x="100" y="152" text-anchor="middle" font-family="monospace" font-weight="700" font-size="15" fill="#e9fffb">{ }</text>';
    if (form >= 1) body += '<path d="M90 118 l-4 22 M110 118 l4 22" stroke="#e8ecf6" stroke-width="2.5" stroke-linecap="round"/><circle cx="86" cy="141" r="2.5" fill="#e8ecf6"/><circle cx="114" cy="141" r="2.5" fill="#e8ecf6"/>';
    if (form >= 4) body += '<path d="M92 126 l8 -6 l8 6 l-8 12 z" fill="#ffd36b"/>';
    head = '<circle cx="100" cy="82" r="36" fill="' + skin + '"/>' +
        '<path d="M64 80 q-2 -42 38 -42 q36 0 34 40 q-8 -18 -26 -20 q-6 10 -26 8 q-14 2 -20 14 z" fill="' + hair + '"/>' +
        '<circle cx="74" cy="94" r="6" fill="#ff9d8a" opacity=".55"/><circle cx="126" cy="94" r="6" fill="#ff9d8a" opacity=".55"/>' + eyes + mouth;
    if (form >= 1) head += '<g fill="none" stroke="#2a2f45" stroke-width="3"><circle cx="85" cy="82" r="10"/><circle cx="117" cy="82" r="10"/><path d="M95 82h12M75 80l-9 -3M127 80l9 -3"/></g>';
    if (form >= 2) head += '<path d="M60 84 q0 -54 40 -54 q40 0 40 54" stroke="#2a2f45" stroke-width="6" fill="none"/><rect x="52" y="76" width="14" height="24" rx="6" fill="#f0643a"/><rect x="134" y="76" width="14" height="24" rx="6" fill="#f0643a"/>';
    if (form >= 4) head += '<path d="M78 46 l8 -16 l14 12 l14 -12 l8 16 z" fill="#ffd36b" stroke="#c98510" stroke-width="2"/>';
    desk = '<rect x="0" y="160" width="200" height="40" fill="' + (night ? '#5b4636' : '#b98b62') + '"/><rect x="0" y="160" width="200" height="6" fill="' + (night ? '#6e5642' : '#cfa078') + '"/>';
    if (form < 4) front += '<path d="M66 162 l8 -26 h52 l8 26 z" fill="#c7cede"/><path d="M70 160 l6 -20 h48 l6 20 z" fill="#aab3c7"/><circle cx="100" cy="150" r="5" fill="#eef1f8"/>';
    else front += '<rect x="56" y="160" width="88" height="14" rx="4" fill="#20263b"/><g fill="#ffd36b">' + Array.from({ length: 10 }, (_, i) => '<rect x="' + (61 + i * 8.2) + '" y="163" width="6" height="3.5" rx="1"/>').join('') + Array.from({ length: 9 }, (_, i) => '<rect x="' + (65 + i * 8.2) + '" y="168" width="6" height="3.5" rx="1"/>').join('') + '</g><ellipse cx="100" cy="166" rx="56" ry="12" fill="#ffd36b" opacity=".18"/>';
    if (form >= 2) front += '<rect x="152" y="140" width="20" height="22" rx="3" fill="#f6f1e7"/><path d="M172 146 q8 0 8 6 q0 6 -8 6" stroke="#f6f1e7" stroke-width="3" fill="none"/><rect x="152" y="146" width="20" height="5" fill="#f0643a"/><path d="M158 136 q-3 -5 0 -9 M166 136 q-3 -5 0 -9" stroke="#c9cfe0" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>';
    if (night) front += '<path d="M18 160 l10 -40 h6 l-4 40 z" fill="#2a2f45"/><path d="M26 120 l22 -8 l2 10 z" fill="#ffd36b" opacity=".9"/>';
    const extra = mood === 'think' ? '<text x="150" y="52" font-family="Jua, sans-serif" font-size="30" fill="#f0643a">?</text>' : mood === 'happy' ? '<path d="M148 40 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3 z" fill="#ffd36b"/><path d="M40 52 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 z" fill="#ffd36b"/>' : '';
    return '<svg viewBox="0 0 200 200" role="img" aria-label="' + esc((opt.name || '코디') + ' - ' + FORM_NAMES[form]) + '" class="' + (opt.cls || '') + '" style="width:100%;height:auto;display:block">' + back + body + head + desk + front + extra + '</svg>';
}
export const CHEER = {
    idle: ['오늘도 한 문제씩 같이 풀어 봐요!', '막히면 힌트 버튼을 눌러 봐요.', '세미콜론(;) 잊지 않기!', '틀려도 괜찮아요. 고치면서 느는 거예요.'],
    ac: ['맞았어요! 최고예요!', '완벽해요! 다음 문제도 가 볼까요?', '와, 한 번에 해냈네요!', '코드가 아주 깔끔해요!'],
    wa: ['괜찮아요, 어디가 다른지 같이 봐요.', '출력 형식(공백, 줄바꿈)을 확인해 봐요.', '예제 말고 다른 입력도 생각해 봐요.', '조금만 고치면 될 것 같아요!'],
    night: ['밤샘 코딩은 적당히! 눈도 쉬어 줘요.', '밤이 깊었어요. 오늘 한 것도 충분히 대단해요.'],
};
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
