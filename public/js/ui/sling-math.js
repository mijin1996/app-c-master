// 새총 버튼(Sling) 효과의 계산만 모은 곳. 화면(DOM)을 모르는 순수 함수라 테스트하기 쉽다.
// Vue Bits 의 Sling Button 을 보고 느낌만 참고해 새로 만들었다 (원본 코드를 옮기지 않음).

export const MAX_PULL = 16;        // 버튼이 끌려가는 최대 거리(px). 버튼은 작아서 원본(160px)보다 짧게
export const ARM_AT = 24;          // 손가락을 이만큼 끌면 "장전" (센 발사)
export const TAP_DIST = 4;         // 이보다 덜 끌면 그냥 탭으로 본다
export const TAP_POWER = 0.35;     // 탭일 때 발사 세기
export const FULL_POWER_AT = 80;   // 이만큼 끌면 세기 1
export const SPRING_KICK = 3;      // 놓았을 때 반대쪽으로 넘어가는 정도 (recoil 에 곱함)
const UP = -Math.PI / 2;           // 화면에서 위쪽 (y 가 아래로 커지니까 음수)

/** 고무줄처럼: 처음엔 잘 늘어나고, 많이 당길수록 덜 늘어나며 MAX_PULL 을 넘지 않는다 */
export function stretch(distance, maxPull = MAX_PULL) {
    return maxPull * (1 - Math.exp(-Math.max(0, distance) / maxPull));
}

/**
 * 누른 곳에서 손가락이 (dx, dy) 만큼 움직였을 때의 발사 정보.
 * 새총이라 당긴 쪽의 반대쪽으로 날아간다.
 * @returns {{ pullX: number, pullY: number, angle: number, power: number, armed: boolean }}
 */
export function launchOf(dx, dy) {
    const distance = Math.hypot(dx, dy);
    if (!(distance >= TAP_DIST)) {
        return { pullX: 0, pullY: 0, angle: UP, power: TAP_POWER, armed: false };
    }
    const s = stretch(distance);
    return {
        pullX: (dx / distance) * s,
        pullY: (dy / distance) * s,
        angle: Math.atan2(-dy, -dx),
        power: TAP_POWER + (1 - TAP_POWER) * Math.min(1, distance / FULL_POWER_AT),
        armed: distance >= ARM_AT,
    };
}

/**
 * 발사 방향 부채꼴 안으로 흩어지는 입자들. 첫 입자는 가운데로 가장 멀리 간다.
 * @param {number} count
 * @param {{ angle: number, spread: number, flight: number, power: number }} options spread 는 라디안
 * @param {() => number} random 0 이상 1 미만 (테스트에서 고정값으로 바꿔 끼운다)
 */
export function burstParticles(count, { angle, spread, flight, power }, random = Math.random) {
    if (!Number.isFinite(count) || count <= 0) {
        return [];
    }
    const reach = flight * power;
    const particles = [{ dx: Math.cos(angle) * reach, dy: Math.sin(angle) * reach, size: 5, delay: 0, duration: 520 }];
    for (let i = 1; i < Math.floor(count); i++) {
        const a = angle + (random() - 0.5) * spread;
        const r = reach * (0.45 + 0.55 * random());
        particles.push({
            dx: Math.cos(a) * r,
            dy: Math.sin(a) * r,
            size: 2 + 3 * random(),
            delay: 60 * random(),
            duration: 380 + 260 * random(),
        });
    }
    return particles;
}

/** 놓았을 때 버튼이 움직이는 길: 당긴 자리 → 반대쪽으로 튕김 → 살짝 되돌아옴 → 제자리 */
export function springKeyframes(pullX, pullY, recoil) {
    const kick = Math.max(0, recoil) * SPRING_KICK;
    return [
        { x: pullX, y: pullY, offset: 0 },
        { x: -pullX * kick, y: -pullY * kick, offset: 0.3 },
        { x: pullX * kick * recoil, y: pullY * kick * recoil, offset: 0.65 },
        { x: 0, y: 0, offset: 1 },
    ];
}
