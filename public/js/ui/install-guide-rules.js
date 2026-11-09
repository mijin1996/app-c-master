// 홈 화면 추가 안내창의 계산만 모은 곳 (화면을 모르는 순수 함수 → 테스트하기 쉬움)
// 쌓이는 카드 움직임은 Vue Bits 의 Scroll Stack 을 보고 느낌만 참고해 새로 만들었다 (원본 코드를 옮기지 않음).

export const Platform = Object.freeze({ IOS: 'ios', ANDROID: 'android', OTHER: 'other' });
export const STACK_SCALE_STEP = 0.06;  // 카드 한 장이 다 덮을 때마다 이만큼 작아진다
export const STACK_MIN_SCALE = 0.82;

/** 어떤 기기인지: 아이폰 · 아이패드는 iOS, 안드로이드, 그 밖 */
export function platformOf(nav) {
    const ua = String(nav?.userAgent ?? '');
    if (/iPhone|iPad|iPod/.test(ua)) {
        return Platform.IOS;
    }
    // 요즘 아이패드는 "Mac 컴퓨터" 라고 자기소개를 해서, 터치가 되는지로 구분한다
    if (/Macintosh/.test(ua) && (nav?.maxTouchPoints ?? 0) > 1) {
        return Platform.IOS;
    }
    if (/Android/.test(ua)) {
        return Platform.ANDROID;
    }
    return Platform.OTHER;
}

/** 들어올 때마다 보여 준다. 단, 이미 홈 화면 앱으로 열었거나 이번 방문에 닫았으면 안 보여 준다 */
export function shouldShowInstallGuide({ standalone, closedThisVisit }) {
    return !standalone && !closedThisVisit;
}

/** 카드 순서: 지금 쓰는 기기 안내를 맨 앞에 */
export function orderedCards(platform) {
    return platform === Platform.ANDROID ? ['android', 'ios', 'why'] : ['ios', 'android', 'why'];
}

/** 위에 덮인 카드 양(0 = 안 덮임, 1 = 한 장이 다 덮음)에 따른 크기 */
export function stackScale(coveredBy) {
    if (!(coveredBy > 0)) {
        return 1;
    }
    return Math.max(STACK_MIN_SCALE, 1 - STACK_SCALE_STEP * coveredBy);
}
