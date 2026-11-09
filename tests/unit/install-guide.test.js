// 홈 화면 추가 안내창: 기기 알아보기 · 보여 줄지 · 쌓이는 카드(Scroll Stack) 크기 계산
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    platformOf, shouldShowInstallGuide, stackScale, orderedCards, stackDwell, Platform, STACK_MIN_SCALE, STACK_DWELL_MIN_PX,
} from '../../public/js/ui/install-guide-rules.js';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const IPAD_DESKTOP_MODE = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const ANDROID = 'Mozilla/5.0 (Linux; Android 15; SM-S928N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

test('기기 알아보기: 아이폰 · 안드로이드 · 컴퓨터', () => {
    // Given / When / Then
    assert.equal(platformOf({ userAgent: IPHONE, maxTouchPoints: 5 }), Platform.IOS);
    assert.equal(platformOf({ userAgent: ANDROID, maxTouchPoints: 5 }), Platform.ANDROID);
    assert.equal(platformOf({ userAgent: WINDOWS, maxTouchPoints: 0 }), Platform.OTHER);
});

test('아이패드는 컴퓨터(Mac)인 척하지만 터치가 되면 iOS 로 본다', () => {
    // Given / When / Then
    assert.equal(platformOf({ userAgent: IPAD_DESKTOP_MODE, maxTouchPoints: 5 }), Platform.IOS);
    assert.equal(platformOf({ userAgent: IPAD_DESKTOP_MODE, maxTouchPoints: 0 }), Platform.OTHER);
});

test('이상한 값이 와도 에러 없이 OTHER', () => {
    // Given / When / Then
    assert.equal(platformOf({}), Platform.OTHER);
    assert.equal(platformOf(null), Platform.OTHER);
});

test('들어올 때마다 보여 주되, 이미 앱으로 설치해 열었거나 이번에 닫았으면 안 보여 준다', () => {
    // Given / When / Then
    assert.equal(shouldShowInstallGuide({ standalone: false, closedThisVisit: false }), true);
    assert.equal(shouldShowInstallGuide({ standalone: true, closedThisVisit: false }), false);
    assert.equal(shouldShowInstallGuide({ standalone: false, closedThisVisit: true }), false);
});

test('카드 순서: 내 기기 안내가 맨 앞, 컴퓨터(데스크탑)도 안내하고, 좋은 점은 맨 뒤', () => {
    // Given / When / Then
    assert.deepEqual(orderedCards(Platform.ANDROID), ['android', 'ios', 'desktop', 'why']);
    assert.deepEqual(orderedCards(Platform.IOS), ['ios', 'android', 'desktop', 'why']);
    assert.deepEqual(orderedCards(Platform.OTHER), ['desktop', 'ios', 'android', 'why']);
});

test('버튼으로 직접 열면(force) 이미 닫았거나 앱으로 열었어도 보여 준다', () => {
    // Given / When / Then
    assert.equal(shouldShowInstallGuide({ standalone: true, closedThisVisit: true, force: true }), true);
    assert.equal(shouldShowInstallGuide({ standalone: false, closedThisVisit: true, force: false }), false);
});

test('카드 사이 여유: 보이는 높이의 85% 에서 가장 긴 카드를 뺀 만큼, 최소 48px', () => {
    // Given / When / Then
    assert.equal(stackDwell(640, 228), Math.round(640 * 0.85 - 228)); // 폰: 316
    assert.equal(stackDwell(300, 280), STACK_DWELL_MIN_PX);           // 화면이 작아 여유가 없을 때도 최소만큼
    assert.equal(stackDwell(0, 0), STACK_DWELL_MIN_PX);
    assert.equal(stackDwell(NaN, 200), STACK_DWELL_MIN_PX);
});

test('여유를 두면 다음 카드가 앞 카드에 닿기 전, 앞 카드 전체가 보이는 칸 안에 들어온다', () => {
    // Given: 보이는 높이 640, 카드 228px, 앞 카드가 붙는 높이 8px
    const viewport = 640;
    const card = 228;
    const dwell = stackDwell(viewport, card);

    // When: 앞 카드가 맨 위에 붙은 순간, 다음 카드의 윗변 위치
    const nextTop = 8 + card + dwell;

    // Then: 앞 카드 아래끝(8+228)이 보이는 칸 안이고, 다음 카드는 그보다 아래에 있다
    assert.ok(8 + card <= viewport);
    assert.ok(nextTop > 8 + card);
});

test('쌓이는 카드: 위에 덮인 만큼 작아지고(0장 → 1), 아무리 덮여도 최소 크기 아래로는 안 간다', () => {
    // Given / When
    const none = stackScale(0);
    const half = stackScale(0.5);
    const one = stackScale(1);
    const many = stackScale(100);

    // Then
    assert.equal(none, 1);
    assert.ok(one < half && half < none);
    assert.equal(many, STACK_MIN_SCALE);
    assert.equal(stackScale(-1), 1);
    assert.equal(stackScale(NaN), 1);
});
