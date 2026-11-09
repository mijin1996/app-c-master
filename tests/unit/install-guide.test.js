// 홈 화면 추가 안내창: 기기 알아보기 · 보여 줄지 · 쌓이는 카드(Scroll Stack) 크기 계산
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    platformOf, shouldShowInstallGuide, stackScale, orderedCards, endSpace, Platform, STACK_MIN_SCALE, STACK_GAP_PX,
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

test('카드 순서: 내 기기 안내가 맨 앞, 컴퓨터(데스크탑)도 안내 (좋은 점 카드는 없음)', () => {
    // Given / When / Then
    assert.deepEqual(orderedCards(Platform.ANDROID), ['android', 'ios', 'desktop']);
    assert.deepEqual(orderedCards(Platform.IOS), ['ios', 'android', 'desktop']);
    assert.deepEqual(orderedCards(Platform.OTHER), ['desktop', 'ios', 'android']);
});

test('버튼으로 직접 열면(force) 이미 닫았거나 앱으로 열었어도 보여 준다', () => {
    // Given / When / Then
    assert.equal(shouldShowInstallGuide({ standalone: true, closedThisVisit: true, force: true }), true);
    assert.equal(shouldShowInstallGuide({ standalone: false, closedThisVisit: true, force: false }), false);
});

test('카드 사이 간격은 원래대로 18px 하나로 고정', () => {
    // Given / When / Then
    assert.equal(STACK_GAP_PX, 18);
});

test('마지막 카드 아래 여백: 마지막 카드도 자기 자리(위)까지 올라가 앞 카드 위에 쌓일 만큼', () => {
    // Given: 보이는 높이 518, 마지막 카드 221px, 마지막 카드가 붙는 높이 50
    const viewport = 518;
    const last = 221;
    const stickyTop = 50;

    // When
    const space = endSpace(viewport, last, stickyTop);

    // Then: 여백이 있어야 끝까지 내렸을 때 마지막 카드 윗변이 붙는 높이에 닿는다
    assert.equal(space, viewport - last - stickyTop);
    assert.ok(stickyTop + last + space >= viewport);
});

test('마지막 카드 아래 여백: 카드가 화면보다 길거나 값이 이상하면 0 (음수 여백 없음)', () => {
    // Given / When / Then
    assert.equal(endSpace(300, 400, 50), 0);
    assert.equal(endSpace(NaN, 200, 50), 0);
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
