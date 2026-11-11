// 시간대 하늘: 실제 해의 높이(태양 고도)로 밤·새벽·아침·낮·노을·저녁을 정하고 캔버스에 그린다.
// 해가 낮이면 화면을 낮 모드, 아니면 밤 모드로 바꾼다(data-mode).
import { $, pad2, dayKey, reduceMotion } from './dom.js';
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
const SKY_STOPS = [
    [-18, '#070b1d', '#141c3b'], [-8, '#121a3f', '#2c3570'], [-4, '#2b2f6b', '#7a5c9a'], [-1, '#3e4a8c', '#f08a7a'],
    [2, '#5a7fc0', '#ffb36b'], [8, '#5f9ae0', '#ffd9a0'], [18, '#4c8fe0', '#bfe2f8'], [45, '#3a80dc', '#a6d6f6'],
];
function lerpColor(a, b, t) {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)); const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return 'rgb(' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',') + ')';
}
function skyColors(alt) {
    if (alt <= SKY_STOPS[0][0]) return [SKY_STOPS[0][1], SKY_STOPS[0][2]];
    for (let i = 1; i < SKY_STOPS.length; i++) {
        if (alt <= SKY_STOPS[i][0]) {
            const [a0, t0, b0] = SKY_STOPS[i - 1], [a1, t1, b1] = SKY_STOPS[i]; const t = (alt - a0) / (a1 - a0);
            return [lerpColor(t0, t1, t), lerpColor(b0, b1, t)];
        }
    }
    const l = SKY_STOPS[SKY_STOPS.length - 1]; return [l[1], l[2]];
}
export function phaseName(alt, morning) {
    if (alt < -6) return 'night';
    if (alt < 0) return morning ? 'dawn' : 'evening';
    if (alt < 10) return morning ? 'morning' : 'sunset';
    return 'day';
}
export const Sky = {
    settings: () => ({ city: 'seoul', sky: 'auto' }),
    cv: null, ctx: null, stars: [], clouds: [], windows: [], info: null, last: 0, raf: 0,
    init(canvas, settingsProvider) {
        this.settings = settingsProvider;
        this.cv = canvas; this.ctx = this.cv.getContext('2d');
        let seed = 12345; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        for (let i = 0; i < 140; i++) this.stars.push([rnd(), rnd() * 0.7, rnd() * 1.4 + 0.3, rnd() * 6]);
        for (let i = 0; i < 6; i++) this.clouds.push([rnd(), 0.08 + rnd() * 0.3, 0.6 + rnd() * 0.9, 0.004 + rnd() * 0.006]);
        this.buildings = []; let x = 0;
        while (x < 1.05) { const w = 0.025 + rnd() * 0.05; this.buildings.push([x, w, 0.05 + rnd() * 0.16, rnd()]); x += w + rnd() * 0.004; }
        this.rnd = rnd;
        addEventListener('resize', () => this.resize()); this.resize();
        this.compute();
        setInterval(() => { this.compute(); }, 60000);
        const loop = (t) => {
            this.raf = requestAnimationFrame(loop);
            if (document.hidden) return;
            if (t - this.last < (reduceMotion() ? 60000 : 50)) return;
            this.last = t; this.draw(t / 1000);
        };
        requestAnimationFrame(loop);
    },
    resize() { const d = Math.min(devicePixelRatio || 1, 2); this.cv.width = innerWidth * d; this.cv.height = innerHeight * d; this.dpr = d; this.draw(performance.now() / 1000); },
    compute() {
        const st = this.settings();
        const c = CITIES[st.city] || CITIES.seoul;
        const now = new Date();
        const p = sunPos(now, c[1], c[2]);
        const later = sunPos(new Date(now.getTime() + 600000), c[1], c[2]);
        const morning = later.alt > p.alt;
        let alt = p.alt;
        if (st.sky === 'day') alt = 35; else if (st.sky === 'night') alt = -20;
        const times = this.timesFor === st.city + dayKey() ? this.times : (this.times = sunTimes(c[1], c[2]));
        this.timesFor = st.city + dayKey();
        const phase = phaseName(alt, morning);
        const ref = new Date('2000-01-06T18:14:00Z').getTime();
        const moon = (((now.getTime() - ref) / 86400000) % 29.530588 + 29.530588) % 29.530588 / 29.530588;
        const cityKey = CITIES[st.city] ? st.city : 'seoul';
        this.info = { alt, az: st.sky === 'auto' ? p.az : 180, phase, city: t('city.' + cityKey), times, moon, ha: p.ha };
        const mode = (phase === 'day' || phase === 'morning' || phase === 'sunset') ? 'day' : 'night';
        document.documentElement.setAttribute('data-mode', mode);
        const chip = $('.skychip');
        if (chip) chip.textContent = t('sky.chip', { city: this.info.city, phase: t('sky.phase.' + phase), rise: fmtHM(times.rise), set: fmtHM(times.set) });
        this.draw(performance.now() / 1000);
    },
    draw(t) {
        const { ctx, cv } = this; if (!ctx || !this.info) return;
        const W = cv.width, H = cv.height, d = this.dpr;
        const { alt, az, moon } = this.info;
        const [top, bot] = skyColors(alt);
        const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bot);
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        const horizon = H * 0.86;
        const starA = Math.max(0, Math.min(1, (-alt - 3) / 8));
        if (starA > 0) {
            for (const s of this.stars) {
                const tw = reduceMotion() ? 0.8 : 0.6 + 0.4 * Math.sin(t * 1.3 + s[3]);
                ctx.globalAlpha = starA * tw; ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.arc(s[0] * W, s[1] * horizon, s[2] * d, 0, 7); ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
        const posOf = (a, z) => {
            const x = ((z - 60) / 240) * W; const y = horizon - (Math.max(a, -10) / 70) * horizon * 0.9;
            return [Math.max(-80, Math.min(W + 80, x)), y];
        };
        // 해
        if (alt > -6) {
            const [sx, sy] = posOf(alt, az); const r = Math.min(W, H) * 0.045;
            const sg = ctx.createRadialGradient(sx, sy, r * 0.2, sx, sy, r * 4);
            sg.addColorStop(0, alt < 8 ? 'rgba(255,190,120,.75)' : 'rgba(255,245,200,.7)'); sg.addColorStop(1, 'rgba(255,220,150,0)');
            ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sx, sy, r * 4, 0, 7); ctx.fill();
            ctx.fillStyle = alt < 8 ? '#ffb15e' : '#fff3c4'; ctx.beginPath(); ctx.arc(sx, sy, r, 0, 7); ctx.fill();
        }
        // 달 (해의 반대편 근처, 위상 반영)
        if (alt < 4) {
            const mAz = (az + 180 - (moon - 0.5) * 300 + 360) % 360;
            const mAlt = Math.max(12, 45 - Math.abs(moon - 0.5) * 60);
            const [mx, my] = posOf(mAlt, Math.max(80, Math.min(280, mAz))); const r = Math.min(W, H) * 0.03;
            ctx.save();
            ctx.fillStyle = 'rgba(255,250,225,.12)'; ctx.beginPath(); ctx.arc(mx, my, r * 2.4, 0, 7); ctx.fill();
            ctx.fillStyle = '#f6f1d8'; ctx.beginPath(); ctx.arc(mx, my, r, 0, 7); ctx.fill();
            const k = Math.cos(moon * 2 * Math.PI);
            ctx.fillStyle = top; ctx.globalAlpha = 0.92;
            ctx.beginPath();
            if (moon < 0.5) { ctx.arc(mx, my, r, Math.PI / 2, -Math.PI / 2, false); ctx.ellipse(mx, my, Math.abs(k) * r, r, 0, -Math.PI / 2, Math.PI / 2, k < 0); }
            else { ctx.arc(mx, my, r, -Math.PI / 2, Math.PI / 2, false); ctx.ellipse(mx, my, Math.abs(k) * r, r, 0, Math.PI / 2, -Math.PI / 2, k < 0); }
            ctx.fill(); ctx.restore();
        }
        // 구름
        const cloudA = alt > -4 ? Math.min(0.85, (alt + 4) / 14) : 0.12;
        for (const c of this.clouds) {
            const x = (((c[0] + (reduceMotion() ? 0 : t * c[3] * 0.1)) % 1.3) - 0.15) * W; const y = c[1] * horizon; const s = c[2] * Math.min(W, H) * 0.06;
            ctx.fillStyle = alt > 0 ? 'rgba(255,255,255,' + cloudA + ')' : 'rgba(180,170,220,' + cloudA + ')';
            for (const [dx, dy, rx, ry] of [[0, 0, 1.6, 0.55], [0.8, -0.3, 1, 0.6], [-0.7, -0.15, 0.8, 0.5]]) { ctx.beginPath(); ctx.ellipse(x + dx * s, y + dy * s, rx * s, ry * s, 0, 0, Math.PI * 2); ctx.fill(); }
        }
        // 도시 실루엣과 불 켜진 창문
        const night = Math.max(0, Math.min(1, (2 - alt) / 8));
        ctx.fillStyle = lerpColor('#6f86b8', '#0a0f22', night);
        for (const b of this.buildings) { const bh = b[2] * H; ctx.fillRect(b[0] * W, horizon - bh, b[1] * W, bh + H); }
        if (night > 0.2) {
            ctx.fillStyle = 'rgba(255,214,120,' + (night * 0.85) + ')';
            for (const b of this.buildings) {
                const bh = b[2] * H, bx = b[0] * W, bw = b[1] * W; const ws = 4 * d, gap = 7 * d;
                for (let yy = horizon - bh + gap; yy < horizon - gap; yy += gap + ws) {
                    for (let xx = bx + gap * 0.6; xx < bx + bw - ws; xx += gap + ws) {
                        const h = Math.sin(xx * 12.9898 + yy * 78.233) * 43758.5453; if (h - Math.floor(h) < 0.35) ctx.fillRect(xx, yy, ws, ws);
                    }
                }
            }
        }
        ctx.fillStyle = lerpColor('#5a6f9c', '#070b18', night); ctx.fillRect(0, horizon, W, H - horizon);
    },
};
