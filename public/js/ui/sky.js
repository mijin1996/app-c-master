// 시계와 낮 · 밤: 위에 고른 나라 시간을 24시간제로 보여 주고,
// 그 나라 수도의 해 높이(태양 고도)로 화면을 낮 모드 / 밤 모드로 바꾼다(data-mode). 배경 그림은 letter-glitch.js 가 그린다.
import { $ } from './dom.js';
import { resolveZone, formatClock, hourIn, isDaytimeHour } from '../domain/time-zones.js';

const CLOCK_TICK_MS = 15000;            // 시계를 15초마다 고쳐 써서 분이 바뀌면 바로 보이게
const LATER_MS = 600000;                // 10분 뒤 해 높이와 비교해 아침 · 저녁을 가린다
const SKY_FIXED_ALT = { day: 35, night: -20 };
const DAY_PHASES = ['day', 'morning', 'sunset'];

export function sunPos(date, lat, lon) {
    const rad = Math.PI / 180;
    const jd = date.getTime() / 86400000 + 2440587.5;
    const n = jd - 2451545.0;
    const L = (280.46 + 0.9856474 * n) % 360;
    const g = ((357.528 + 0.9856003 * n) % 360) * rad;
    const lam = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad;
    const eps = (23.439 - 0.0000004 * n) * rad;
    const ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam));
    const dec = Math.asin(Math.sin(eps) * Math.sin(lam));
    const gmst = (18.697374558 + 24.06570982441908 * n) % 24;
    const ha = ((gmst * 15 + lon) * rad) - ra;
    const la = lat * rad;
    const alt = Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(ha));
    return { alt: alt / rad };
}

export function phaseName(alt, morning) {
    if (alt < -6) {
        return 'night';
    }
    if (alt < 0) {
        return morning ? 'dawn' : 'evening';
    }
    if (alt < 10) {
        return morning ? 'morning' : 'sunset';
    }
    return 'day';
}

const deviceZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export const Sky = {
    settings: () => ({ timeZone: 'auto', sky: 'auto' }),
    info: null,
    init(settingsProvider) {
        this.settings = settingsProvider;
        this.compute();
        setInterval(() => {
            this.compute();
        }, CLOCK_TICK_MS);
    },
    compute() {
        const st = this.settings();
        const place = resolveZone(st.timeZone, deviceZone());
        const now = new Date();
        let alt;
        let morning;
        if (place.lat === null) {
            // 위치를 모르면 그 시간대의 시각으로만 낮 · 밤을 정한다
            const hour = hourIn(now, place.zone);
            alt = isDaytimeHour(hour) ? SKY_FIXED_ALT.day : SKY_FIXED_ALT.night;
            morning = hour < 12;
        } else {
            alt = sunPos(now, place.lat, place.lon).alt;
            morning = sunPos(new Date(now.getTime() + LATER_MS), place.lat, place.lon).alt > alt;
        }
        alt = SKY_FIXED_ALT[st.sky] ?? alt;
        const phase = phaseName(alt, morning);
        this.info = { alt, phase, zone: place.zone };
        document.documentElement.setAttribute('data-mode', DAY_PHASES.includes(phase) ? 'day' : 'night');
        const chip = $('.skychip');
        if (chip) {
            chip.textContent = formatClock(now, place.zone);
        }
    },
};
