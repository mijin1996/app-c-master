// 홈 화면 추가 안내창: 사이트에 들어올 때마다 "앱처럼 쓰는 법" 을 보여 준다.
// 안쪽 카드 3장(내 기기 → 다른 기기, 글은 install-guide-cards.js)은 스크롤하면 위에 차곡차곡 쌓인다 (Scroll Stack 느낌).
// ✕ 버튼을 눌러야만 닫힌다 (실수로 바깥을 눌러 놓치지 않게). 닫으면 이번 방문(탭)에서는 다시 안 뜨고,
// 홈 화면 앱으로 열었으면 처음부터 안 뜬다. "📲 홈 화면 추가" 버튼(openInstallGuide)으로는 언제든 다시 연다.
import { esc } from '../ui/dom.js';
import { cardOf } from '../ui/install-guide-cards.js';
import { t } from '../i18n/index.js';
import { platformOf, shouldShowInstallGuide, orderedCards, Platform, STACK_GAP_PX } from '../ui/install-guide-rules.js';
import { bindScrollStack } from '../ui/scroll-stack.js';

const CLOSED_KEY = 'cm-install-guide-closed';
const STICKY_TOP_PX = 8;       // 첫 카드가 붙는 높이
const STICKY_STEP_PX = 14;     // 뒤 카드는 조금씩 아래에 붙어서 앞 카드 윗부분이 보인다

const storage = {
    get() {
        try {
            return sessionStorage.getItem(CLOSED_KEY) === '1';
        } catch (e) {
            return false;
        }
    },
    set() {
        try {
            sessionStorage.setItem(CLOSED_KEY, '1');
        } catch (e) {
            // 저장을 못 하는 브라우저(사생활 보호 모드 등)면 이번 화면에서만 닫힌다
        }
    },
};

const isStandalone = () => (window.matchMedia?.('(display-mode: standalone)').matches ?? false) || navigator.standalone === true;

// 크롬(안드로이드 · 컴퓨터)은 "바로 설치" 창을 띄울 수 있게 미리 받아 둔다
let deferredPrompt = null;
addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    document.querySelector('#ig-install-row')?.removeAttribute('hidden');
});

function cardHtml(id, index, mine) {
    const card = cardOf(id, t);
    return '<section class="stack-card ' + id + '" style="top:' + (STICKY_TOP_PX + index * STICKY_STEP_PX) + 'px">' +
        '<div class="stack-head"><b>' + esc(card.title) + '</b>' + (mine ? '<span class="chip accent">' + esc(t('install.mine')) + '</span>' : '') + '</div>' +
        '<ol>' + card.steps.map((s) => '<li>' + s + '</li>').join('') + '</ol></section>';
}

/** 상단 · 첫 화면의 "홈 화면 추가" 버튼: 이미 닫았어도 언제든 다시 연다 */
export function openInstallGuide() {
    return showInstallGuideIfNeeded({ force: true });
}

// 버튼은 그릴 때마다 지금 언어로 만든다 (함수)
export const INSTALL_BUTTON = () => '<button type="button" class="btn install-btn" data-install aria-label="' + esc(t('install.buttonAria')) + '"><span aria-hidden="true">📲</span><span class="install-label">' + esc(t('install.button')) + '</span></button>';
// 로그인한 뒤 상단에는 배경 없이 📲 만 (이름은 화면 읽기 프로그램 · 마우스 올리면 보임)
export const INSTALL_ICON_BUTTON = () => '<button type="button" class="install-icon" data-install aria-label="' + esc(t('install.buttonAria')) + '" title="' + esc(t('install.button')) + '">📲</button>';

export function bindInstallButtons(root = document) {
    root.querySelectorAll('[data-install]').forEach((button) => {
        button.onclick = openInstallGuide;
    });
}

export function showInstallGuideIfNeeded({ force = false } = {}) {
    if (document.querySelector('.install-bg')) {
        return null; // 이미 열려 있으면 하나만
    }
    if (!shouldShowInstallGuide({ standalone: isStandalone(), closedThisVisit: storage.get(), force })) {
        return null;
    }
    const platform = platformOf(navigator);
    const mineOf = (id) => (id === 'ios' && platform === Platform.IOS) || (id === 'android' && platform === Platform.ANDROID) || (id === 'desktop' && platform === Platform.OTHER);
    const ids = orderedCards(platform);
    const bg = document.createElement('div');
    bg.className = 'modal-bg install-bg';
    bg.innerHTML = '<div class="panel modal install-guide" role="dialog" aria-modal="true" aria-labelledby="ig-title">' +
        '<button class="iconbtn ig-close" id="ig-close" aria-label="' + esc(t('install.close')) + '">✕</button>' +
        '<div class="ig-top"><h2 id="ig-title">' + esc(t('install.title')) + '</h2></div>' +
        '<div class="stack-scroller" tabindex="0" aria-label="' + esc(t('install.title')) + '" style="--stack-gap:' + STACK_GAP_PX + 'px">' + ids.map((id, i) => cardHtml(id, i, mineOf(id))).join('') +
        '<div class="stack-end" aria-hidden="true"></div></div>' +
        '<div class="row-buttons"' + (deferredPrompt ? '' : ' hidden') + ' id="ig-install-row"><button class="btn primary" id="ig-install">' + esc(t('install.now')) + '</button></div></div>';
    document.body.appendChild(bg);

    const close = () => {
        storage.set();
        bg.classList.add('out');
        setTimeout(() => bg.remove(), 200);
    };
    bg.querySelector('#ig-close').onclick = close; // ✕ 로만 닫는다
    bg.querySelector('#ig-install').onclick = async () => {
        if (!deferredPrompt) {
            return;
        }
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
        close();
    };
    const scroller = bg.querySelector('.stack-scroller');
    bindScrollStack(scroller, (i) => STICKY_TOP_PX + i * STICKY_STEP_PX);
    scroller.scrollTop = 0; // 언제나 첫 카드(내 기기)부터
    bg.querySelector('#ig-close').focus();
    return bg;
}
