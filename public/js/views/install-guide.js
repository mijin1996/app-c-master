// 홈 화면 추가 안내창: 사이트에 들어올 때마다 "앱처럼 쓰는 법" 을 보여 준다.
// 안쪽 카드 3장(내 기기 → 다른 기기 → 좋은 점)은 스크롤하면 위에 차곡차곡 쌓인다 (Scroll Stack 느낌).
// ✕ 버튼을 눌러야만 닫힌다 (실수로 바깥을 눌러 놓치지 않게). 닫으면 이번 방문(탭)에서는 다시 안 뜨고,
// 홈 화면 앱으로 열었으면 처음부터 안 뜬다. "📲 홈 화면 추가" 버튼(openInstallGuide)으로는 언제든 다시 연다.
import { esc } from '../ui/dom.js';
import { platformOf, shouldShowInstallGuide, orderedCards, stackScale, stackDwell, Platform } from '../ui/install-guide-rules.js';

const CLOSED_KEY = 'cm-install-guide-closed';
const STICKY_TOP_PX = 8;       // 첫 카드가 붙는 높이
const STICKY_STEP_PX = 14;     // 뒤 카드는 조금씩 아래에 붙어서 앞 카드 윗부분이 보인다

const CARDS = Object.freeze({
    ios: {
        title: '아이폰 · 아이패드',
        sub: 'Safari 에서',
        steps: [
            '<b>Safari</b> 로 이 사이트를 열어요 (카카오톡 · 인스타 안에서 열었다면 <b>"Safari로 열기"</b>)',
            '화면 아래(아이패드는 위)의 <b>공유 버튼</b> <span class="key">□↑</span> 을 눌러요. 안 보이면 <span class="key">···</span> 더보기 → 공유',
            '목록을 내려서 <b>"홈 화면에 추가"</b> 를 눌러요',
            '오른쪽 위 <b>"추가"</b> 를 누르면 끝! 홈 화면에 코디 아이콘이 생겨요',
        ],
    },
    android: {
        title: '안드로이드',
        sub: 'Chrome · 삼성 인터넷에서',
        steps: [
            '<b>Chrome</b> 으로 이 사이트를 열어요',
            '오른쪽 위 <b>⋮ 메뉴</b> 를 눌러요',
            '<b>"홈 화면에 추가"</b> 또는 <b>"앱 설치"</b> 를 누르고 <b>"설치"</b>',
            '삼성 인터넷은 아래 <b>≡ 메뉴</b> → <b>"현재 페이지 추가"</b> → <b>"홈 화면"</b>',
        ],
    },
    desktop: {
        title: '컴퓨터 (Windows · Mac)',
        sub: 'Chrome · Edge · Safari 에서',
        steps: [
            '<b>Chrome</b>: 주소창 오른쪽 끝의 <b>설치 아이콘</b> <span class="key">⊕</span> 을 누르고 <b>"설치"</b>. 안 보이면 <b>⋮ 메뉴</b> → <b>"전송, 저장, 공유"</b> → <b>"페이지를 앱으로 설치"</b>',
            '<b>Edge</b>: <b>··· 메뉴</b> → <b>"앱"</b> → <b>"이 사이트를 앱으로 설치"</b>',
            '<b>Mac Safari</b>: 위 메뉴 <b>"파일"</b> → <b>"Dock에 추가"</b>',
            '설치하면 주소창 없는 <b>따로 된 창</b>으로 열리고, 바탕화면 · 시작 메뉴 · Dock 에 코디 아이콘이 생겨요',
        ],
    },
    why: {
        title: '앱처럼 쓰면 좋은 점',
        sub: '설치해도 용량은 거의 0',
        steps: [
            '주소창 없이 <b>화면 전체</b>로 문제를 풀어요',
            '홈 화면의 <b>코디 아이콘</b>을 누르면 바로 시작',
            '로그인이 그대로 남아 있어요',
            '홈 화면 아이콘으로 열면 이 안내창은 더 이상 안 떠요. 다시 보고 싶으면 위쪽 <b>"📲 홈 화면 추가"</b> 버튼',
        ],
    },
});

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
    const card = CARDS[id];
    return '<section class="stack-card ' + id + '" style="top:' + (STICKY_TOP_PX + index * STICKY_STEP_PX) + 'px">' +
        '<div class="stack-head"><b>' + esc(card.title) + '</b><span class="muted small">' + esc(card.sub) + '</span>' + (mine ? '<span class="chip accent">내 기기</span>' : '') + '</div>' +
        '<ol>' + card.steps.map((s) => '<li>' + s + '</li>').join('') + '</ol></section>';
}

/** 카드마다 뒤 카드가 얼마나 덮었는지 계산해 살짝 작게 만든다 */
function bindStack(scroller) {
    const cards = [...scroller.querySelectorAll('.stack-card')];
    const update = () => {
        const box = scroller.getBoundingClientRect();
        cards.forEach((card, i) => {
            const rect = card.getBoundingClientRect();
            let covered = 0;
            for (let j = i + 1; j < cards.length; j++) {
                const next = cards[j].getBoundingClientRect();
                covered += Math.min(1, Math.max(0, (rect.bottom - next.top) / rect.height));
            }
            const scale = stackScale(covered);
            card.style.transform = 'scale(' + scale + ')';
            card.style.filter = 'brightness(' + (1 - (1 - scale) * 1.5) + ')';
            card.dataset.stuck = rect.top - box.top <= STICKY_TOP_PX + i * STICKY_STEP_PX + 1 ? '1' : '0';
        });
    };
    // 읽을 여유: 보이는 높이에서 가장 긴 카드를 뺀 만큼 (화면 크기 · 글 길이에 맞게 저절로)
    const fitDwell = () => {
        const tallest = Math.max(...cards.map((c) => c.offsetHeight));
        scroller.style.setProperty('--stack-dwell', stackDwell(scroller.clientHeight, tallest) + 'px');
        update();
    };
    scroller.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    addEventListener('resize', fitDwell);
    fitDwell();
}

/** 상단 · 첫 화면의 "홈 화면 추가" 버튼: 이미 닫았어도 언제든 다시 연다 */
export function openInstallGuide() {
    return showInstallGuideIfNeeded({ force: true });
}

export const INSTALL_BUTTON = '<button type="button" class="btn install-btn" data-install aria-label="홈 화면 추가 방법 보기"><span aria-hidden="true">📲</span><span class="install-label">홈 화면 추가</span></button>';

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
        '<button class="iconbtn ig-close" id="ig-close" aria-label="닫기">✕</button>' +
        '<div class="ig-top"><img src="/assets/icons/icon-192.png" alt="" width="56" height="56"><div><h2 id="ig-title">c-master 를 앱처럼 써 봐요</h2>' +
        '<p class="muted small" style="margin:2px 0 0">홈 화면에 추가하면 앱처럼 바로 열려요. 아래로 밀어 보면 안내 카드가 차곡차곡 쌓여요.</p></div></div>' +
        '<div class="stack-scroller" tabindex="0" aria-label="설치 안내">' + ids.map((id, i) => cardHtml(id, i, mineOf(id))).join('') +
        '<div class="stack-end muted small">다 읽었으면 오른쪽 위 ✕ 를 눌러 닫아요</div></div>' +
        '<div class="row-buttons"' + (deferredPrompt ? '' : ' hidden') + ' id="ig-install-row"><button class="btn primary" id="ig-install">지금 바로 설치하기</button></div></div>';
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
    bindStack(bg.querySelector('.stack-scroller'));
    bg.querySelector('#ig-close').focus();
    return bg;
}
