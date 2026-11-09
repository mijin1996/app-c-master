// "앱처럼 쓰기" 안내 카드 글. 핵심만 짧게 (카드마다 3줄 이하, 한 줄 30자 이하 — 테스트가 지킨다)
export const MAX_STEPS = 3;
export const MAX_STEP_CHARS = 30;

export const INSTALL_CARDS = Object.freeze({
    ios: {
        title: '아이폰 · 아이패드 (Safari)',
        steps: [
            '<b>공유</b> <span class="key">□↑</span> 누르기',
            '<b>"홈 화면에 추가"</b> → <b>"추가"</b>',
        ],
    },
    android: {
        title: '안드로이드 (Chrome)',
        steps: [
            '<b>⋮ 메뉴</b> 누르기',
            '<b>"홈 화면에 추가"</b> 또는 <b>"앱 설치"</b>',
            '삼성 인터넷: <b>≡</b> → <b>"현재 페이지 추가"</b>',
        ],
    },
    desktop: {
        title: '컴퓨터 (Chrome · Edge)',
        steps: [
            '주소창 오른쪽 <b>설치 아이콘</b> <span class="key">⊕</span> 누르기',
            '<b>"설치"</b> 누르기',
        ],
    },
    why: {
        title: '앱처럼 쓰면',
        steps: [
            '주소창 없이 <b>전체 화면</b>',
            '홈 화면 아이콘으로 <b>바로 시작</b>',
        ],
    },
});
