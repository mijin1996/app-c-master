// 시간대: 실제 해의 높이(태양 고도)로 밤·새벽·아침·낮·노을·저녁을 정한다.
// 해가 낮이면 화면을 낮 모드, 아니면 밤 모드로 바꾼다(data-mode). 배경 그림은 letter-glitch.js 가 그린다.
import { $, pad2, dayKey } from './dom.js';
import { t } from '../i18n/index.js';
// 도시 이름은 사전(city.키)에서, 숫자는 위도 · 경도
export const CITIES = {
    seoul: ['서울', 37.5665, 126.978], incheon: ['인천', 37.4563, 126.7052], daejeon: ['대전', 36.3504, 127.3845],
    daegu: ['대구', 35.8714, 128.6014], gwangju: ['광주', 35.1595, 126.8526], busan: ['부산', 35.1796, 129.0756],
    ulsan: ['울산', 35.5384, 129.3114], gangneung: ['강릉', 37.7519, 128.8761], jeju: ['제주', 33.4996, 126.5312],
};
export function sunPos(date, lat, lon) {
    const rad = Math.PI / 180;
    const jd = date.getTime() / 86400000 + 2440587.5; const n = jd - 2451545.0;
    const L = (280.46 + 0.9856474 * n) % 360; const g = ((357.528 + 0.9856003 * n) % 360) * rad;
    const lam = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad;
    const eps = (23.439 - 0.0000004 * n) * rad;
    const ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam));
    const dec = Math.asin(Math.sin(eps) * Math.sin(lam));
    const gmst = (18.697374558 + 24.06570982441908 * n) % 24;
    const ha = ((gmst * 15 + lon) * rad) - ra;
    const la = lat * rad;
    const alt = Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(ha));
    const az = Math.atan2(-Math.sin(ha), Math.tan(dec) * Math.cos(la) - Math.sin(la) * Math.cos(ha));
    return { alt: alt / rad, az: ((az / rad) + 360) % 360, ha: ha };
}
export function sunTimes(lat, lon) {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    let rise = null, set = null, prev = sunPos(d, lat, lon).alt;
    for (let m = 2; m <= 1440; m += 2) {
        const t = new Date(d.getTime() + m * 60000); const a = sunPos(t, lat, lon).alt;
        if (prev < -0.833 && a >= -0.833 && !rise) rise = t;
        if (prev >= -0.833 && a < -0.833) set = t;
        prev = a;
    }
    return { rise, set };
}
export const fmtHM = (d) => (d ? pad2(d.getHours()) + ':' + pad2(d.getMinutes()) : '--:--');
export function phaseName(alt, morning) {
    if (alt < -6) return 'night';
    if (alt < 0) return morning ? 'dawn' : 'evening';
    if (alt < 10) return morning ? 'morning' : 'sunset';
    return 'day';
}
const RECOMPUTE_MS = 60000; // 1분마다 해의 높이를 다시 계산
const DAY_PHASES = ['day', 'morning', 'sunset'];
const SKY_FIXED_ALT = { day: 35, night: -20 };
export const Sky = {
    settings: () => ({ city: 'seoul', sky: 'auto' }),
    info: null,
    init(settingsProvider) {
        this.settings = settingsProvider;
        this.compute();
        setInterval(() => {
            this.compute();
        }, RECOMPUTE_MS);
    },
    compute() {
        const st = this.settings();
        const c = CITIES[st.city] || CITIES.seoul;
        const now = new Date();
        const p = sunPos(now, c[1], c[2]);
        const later = sunPos(new Date(now.getTime() + 600000), c[1], c[2]);
        const morning = later.alt > p.alt;
        const alt = SKY_FIXED_ALT[st.sky] ?? p.alt;
        const times = this.timesFor === st.city + dayKey() ? this.times : (this.times = sunTimes(c[1], c[2]));
        this.timesFor = st.city + dayKey();
        const phase = phaseName(alt, morning);
        const cityKey = CITIES[st.city] ? st.city : 'seoul';
        this.info = { alt, phase, city: t('city.' + cityKey), times };
        document.documentElement.setAttribute('data-mode', DAY_PHASES.includes(phase) ? 'day' : 'night');
        const chip = $('.skychip');
        if (chip) {
            chip.textContent = t('sky.chip', { city: this.info.city, phase: t('sky.phase.' + phase), rise: fmtHM(times.rise), set: fmtHM(times.set) });
        }
    },
};
