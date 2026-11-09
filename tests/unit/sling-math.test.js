// 새총 버튼 효과의 순수 계산(당김 · 발사 · 입자 · 스프링)을 확인한다
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    stretch, launchOf, burstParticles, springKeyframes, TAP_POWER, MAX_PULL, ARM_AT,
} from '../../public/js/ui/sling-math.js';

const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;
// 고정된 "랜덤" (테스트가 늘 같은 결과가 나오게)
const fixedRandom = (values) => {
    let i = 0;
    return () => values[i++ % values.length];
};

test('고무줄: 0만큼 당기면 0, 많이 당겨도 최대 거리를 넘지 않고, 더 당길수록 조금씩 더 늘어난다', () => {
    // Given / When
    const a = stretch(0);
    const b = stretch(20);
    const c = stretch(200);
    const d = stretch(100000);

    // Then
    assert.equal(a, 0);
    assert.ok(b < c && c <= d);
    assert.ok(d <= MAX_PULL);
});

test('그냥 탭(거의 안 끌기): 위쪽으로 약하게 쏘고, 장전(armed)은 아니다', () => {
    // Given / When
    const launch = launchOf(1, 0);

    // Then
    assert.ok(close(launch.angle, -Math.PI / 2));
    assert.equal(launch.power, TAP_POWER);
    assert.equal(launch.armed, false);
});

test('왼쪽으로 끌었다 놓으면 오른쪽(각도 0)으로 날아간다', () => {
    // Given / When
    const launch = launchOf(-40, 0);

    // Then
    assert.ok(close(launch.angle, 0));
    assert.ok(launch.pullX < 0);
    assert.equal(launch.pullY, 0);
});

test('장전 거리 딱 맞게(ARM_AT) 끌면 armed, 1 모자라면 아니다', () => {
    // Given / When / Then
    assert.equal(launchOf(0, ARM_AT).armed, true);
    assert.equal(launchOf(0, ARM_AT - 1).armed, false);
});

test('세기(power)는 0~1, 많이 당길수록 커진다', () => {
    // Given / When
    const weak = launchOf(0, 10).power;
    const strong = launchOf(0, 60).power;
    const huge = launchOf(0, 99999).power;

    // Then
    assert.ok(weak < strong);
    assert.ok(huge <= 1);
    assert.ok(weak >= TAP_POWER);
});

test('입자: 개수만큼 만들고, 모두 발사 방향 ± 퍼짐의 절반 안으로 날아간다', () => {
    // Given
    const options = { angle: 0, spread: Math.PI / 3, flight: 60, power: 1 };

    // When
    const particles = burstParticles(14, options, fixedRandom([0, 0.25, 0.5, 0.75, 0.999]));

    // Then
    assert.equal(particles.length, 14);
    for (const p of particles) {
        const angle = Math.atan2(p.dy, p.dx);
        assert.ok(Math.abs(angle) <= Math.PI / 6 + 1e-9, String(angle));
        assert.ok(p.size > 0 && p.duration > 0 && p.delay >= 0);
    }
});

test('입자: 첫 입자(선두)는 가운데 방향으로 비행 거리 × 세기만큼 간다', () => {
    // Given / When
    const [lead] = burstParticles(5, { angle: Math.PI / 2, spread: 1, flight: 100, power: 0.5 }, fixedRandom([0.3]));

    // Then
    assert.ok(close(lead.dx, 0, 1e-6));
    assert.ok(close(lead.dy, 50, 1e-6));
});

test('입자: 0개면 빈 목록, 음수 · 이상한 값도 빈 목록', () => {
    // Given / When / Then
    assert.deepEqual(burstParticles(0, { angle: 0, spread: 1, flight: 10, power: 1 }), []);
    assert.deepEqual(burstParticles(-3, { angle: 0, spread: 1, flight: 10, power: 1 }), []);
    assert.deepEqual(burstParticles(NaN, { angle: 0, spread: 1, flight: 10, power: 1 }), []);
});

test('스프링: 당긴 자리에서 시작해 반대쪽으로 튕겼다가 제자리(0,0)에서 끝난다', () => {
    // Given / When
    const frames = springKeyframes(-10, 0, 0.2);

    // Then
    assert.deepEqual([frames[0].x, frames[0].y], [-10, 0]);
    assert.deepEqual([frames.at(-1).x, frames.at(-1).y], [0, 0]);
    assert.ok(frames[1].x > 0, '반대쪽으로 넘어가야 해요');
    assert.equal(frames[0].offset, 0);
    assert.equal(frames.at(-1).offset, 1);
});

test('스프링: recoil 0 이면 넘어가지 않고 바로 멈춘다', () => {
    // Given / When
    const frames = springKeyframes(-10, 0, 0);

    // Then
    assert.ok(frames.every((f) => f.x <= 0));
});
