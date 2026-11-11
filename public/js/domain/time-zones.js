// 나라(시간대) 목록과 시계 규칙. 화면 위 시계는 고른 나라 시간을 24시간제로 보여 준다.
// 자동(auto)이면 이 기기가 알려 주는 시간대를 쓴다. 위도 · 경도는 낮 · 밤 화면을 정할 때 쓴다(그 나라 수도).

export const AUTO_ZONE = 'auto';

// key: { zone: IANA 시간대, region: 나라 코드(나라 이름은 Intl 이 지금 언어로 만들어 줌), city: 같은 나라에 시간대가 여럿일 때, lat, lon }
export const TIME_ZONES = Object.freeze({
    kr: { zone: 'Asia/Seoul', region: 'KR', lat: 37.57, lon: 126.98 },
    jp: { zone: 'Asia/Tokyo', region: 'JP', lat: 35.68, lon: 139.69 },
    cn: { zone: 'Asia/Shanghai', region: 'CN', lat: 39.9, lon: 116.4 },
    tw: { zone: 'Asia/Taipei', region: 'TW', lat: 25.03, lon: 121.57 },
    hk: { zone: 'Asia/Hong_Kong', region: 'HK', lat: 22.32, lon: 114.17 },
    sg: { zone: 'Asia/Singapore', region: 'SG', lat: 1.35, lon: 103.82 },
    vn: { zone: 'Asia/Ho_Chi_Minh', region: 'VN', lat: 21.03, lon: 105.85 },
    th: { zone: 'Asia/Bangkok', region: 'TH', lat: 13.76, lon: 100.5 },
    ph: { zone: 'Asia/Manila', region: 'PH', lat: 14.6, lon: 120.98 },
    id: { zone: 'Asia/Jakarta', region: 'ID', lat: -6.21, lon: 106.85 },
    in: { zone: 'Asia/Kolkata', region: 'IN', lat: 28.61, lon: 77.21 },
    ae: { zone: 'Asia/Dubai', region: 'AE', lat: 24.45, lon: 54.38 },
    tr: { zone: 'Europe/Istanbul', region: 'TR', lat: 39.93, lon: 32.86 },
    ru: { zone: 'Europe/Moscow', region: 'RU', lat: 55.76, lon: 37.62 },
    gb: { zone: 'Europe/London', region: 'GB', lat: 51.51, lon: -0.13 },
    fr: { zone: 'Europe/Paris', region: 'FR', lat: 48.86, lon: 2.35 },
    de: { zone: 'Europe/Berlin', region: 'DE', lat: 52.52, lon: 13.4 },
    es: { zone: 'Europe/Madrid', region: 'ES', lat: 40.42, lon: -3.7 },
    it: { zone: 'Europe/Rome', region: 'IT', lat: 41.9, lon: 12.5 },
    eg: { zone: 'Africa/Cairo', region: 'EG', lat: 30.04, lon: 31.24 },
    za: { zone: 'Africa/Johannesburg', region: 'ZA', lat: -25.75, lon: 28.19 },
    'us-east': { zone: 'America/New_York', region: 'US', city: 'New York', lat: 38.9, lon: -77.04 },
    'us-central': { zone: 'America/Chicago', region: 'US', city: 'Chicago', lat: 41.88, lon: -87.63 },
    'us-west': { zone: 'America/Los_Angeles', region: 'US', city: 'Los Angeles', lat: 34.05, lon: -118.24 },
    ca: { zone: 'America/Toronto', region: 'CA', lat: 45.42, lon: -75.7 },
    mx: { zone: 'America/Mexico_City', region: 'MX', lat: 19.43, lon: -99.13 },
    br: { zone: 'America/Sao_Paulo', region: 'BR', lat: -15.79, lon: -47.88 },
    ar: { zone: 'America/Argentina/Buenos_Aires', region: 'AR', lat: -34.6, lon: -58.38 },
    au: { zone: 'Australia/Sydney', region: 'AU', lat: -35.28, lon: 149.13 },
    nz: { zone: 'Pacific/Auckland', region: 'NZ', lat: -41.29, lon: 174.78 },
});

const DAY_START_HOUR = 6;  // 위치를 모를 때: 6시부터
const DAY_END_HOUR = 18;   // 18시 전까지를 낮으로 본다

export function isTimeZoneKey(key) {
    return key === AUTO_ZONE || Object.hasOwn(TIME_ZONES, String(key));
}

/** 설정 키 → { zone, lat, lon }. 자동 · 모르는 키는 기기 시간대 (목록에 있으면 위치도) */
export function resolveZone(key, deviceZone) {
    if (key !== AUTO_ZONE && Object.hasOwn(TIME_ZONES, String(key))) {
        return TIME_ZONES[key];
    }
    const known = Object.values(TIME_ZONES).find((z) => z.zone === deviceZone);
    return known ?? { zone: deviceZone, lat: null, lon: null };
}

function formatterFor(zone) {
    const options = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
    try {
        return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: zone });
    } catch {
        return new Intl.DateTimeFormat('en-GB', options); // 모르는 시간대 → 이 기기 시간
    }
}

/** 24시간제 HH:MM */
export function formatClock(date, zone) {
    return formatterFor(zone).format(date);
}

/** 그 시간대의 지금 시(0~23) */
export function hourIn(date, zone) {
    return Number(formatClock(date, zone).slice(0, 2));
}

export function isDaytimeHour(hour) {
    return hour >= DAY_START_HOUR && hour < DAY_END_HOUR;
}
