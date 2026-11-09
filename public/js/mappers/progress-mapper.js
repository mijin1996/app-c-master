// Mapper: 서버·브라우저에서 받은 진도 DTO(모양을 믿을 수 없는 날것의 JSON)를
// 안전한 Progress 모델로 바꾼다. 이상한 값은 버리거나 범위에 맞춘다.
import { createEmptyProgress, DEFAULT_SETTINGS } from '../domain/progress-model.js';
import { QUIZ_SIZE, HISTORY_LIMIT, FORM_NAMES } from '../domain/progress-rules.js';
import { isLanguageId } from '../domain/languages.js';

const PROBLEM_ID = /^\d{4}$/;
const CODE_KEY = /^\d{4}(?::(?:python|cpp|java))?$/; // C는 번호만, 다른 언어는 "번호:언어"
const CHAPTER_NO = /^(?:[1-9]|1[0-8])$/;
const MAX_CODE_LENGTH = 20000;
const MAX_COUNT = 100000;
const RESULTS = new Set(['AC', 'WA', 'CE', 'RE', 'TLE', 'OLE']);
const SKY_MODES = new Set(['auto', 'day', 'night']);

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

function toCount(value) {
    const n = Number(value);
    return Number.isFinite(n) ? clamp(Math.floor(n), 0, MAX_COUNT) : null;
}

/** { "1001": 숫자 } 모양만 남긴다 */
function countMap(raw) {
    const out = {};
    if (!isObject(raw)) {
        return out;
    }
    for (const [key, value] of Object.entries(raw)) {
        const n = toCount(value);
        if (PROBLEM_ID.test(key) && n !== null) {
            out[key] = n;
        }
    }
    return out;
}

function solvedMap(raw) {
    const out = {};
    if (!isObject(raw)) {
        return out;
    }
    for (const [key, value] of Object.entries(raw)) {
        if (!PROBLEM_ID.test(key) || !isObject(value)) {
            continue;
        }
        out[key] = {
            at: toCount(value.at) ?? 0,
            tries: toCount(value.tries) ?? 0,
            time: toCount(value.time) ?? 0,
            late: value.late === true,
        };
    }
    return out;
}

function codeMap(raw) {
    const out = {};
    if (!isObject(raw)) {
        return out;
    }
    for (const [key, value] of Object.entries(raw)) {
        if (CODE_KEY.test(key) && typeof value === 'string') {
            out[key] = value.slice(0, MAX_CODE_LENGTH);
        }
    }
    return out;
}

function quizMap(raw) {
    const out = {};
    if (!isObject(raw)) {
        return out;
    }
    for (const [key, value] of Object.entries(raw)) {
        const n = Number(value);
        if (CHAPTER_NO.test(key) && Number.isFinite(n)) {
            out[key] = clamp(Math.floor(n), 0, QUIZ_SIZE);
        }
    }
    return out;
}

function historyList(raw) {
    if (!Array.isArray(raw)) {
        return [];
    }
    return raw
        .filter((h) => isObject(h) && PROBLEM_ID.test(String(h.id)) && RESULTS.has(h.res))
        .slice(0, HISTORY_LIMIT)
        .map((h) => ({ id: Number(h.id), res: h.res, at: toCount(h.at) ?? 0 }));
}

function settingsOf(raw) {
    const s = isObject(raw) ? raw : {};
    const codyName = typeof s.codyName === 'string' ? s.codyName.trim().slice(0, 8) : '';
    return {
        sfx: typeof s.sfx === 'boolean' ? s.sfx : DEFAULT_SETTINGS.sfx,
        city: typeof s.city === 'string' && /^[a-z]{2,20}$/.test(s.city) ? s.city : DEFAULT_SETTINGS.city,
        sky: SKY_MODES.has(s.sky) ? s.sky : DEFAULT_SETTINGS.sky,
        rankOptIn: typeof s.rankOptIn === 'boolean' ? s.rankOptIn : DEFAULT_SETTINGS.rankOptIn,
        codyName: codyName || DEFAULT_SETTINGS.codyName,
        algoLang: isLanguageId(s.algoLang) ? s.algoLang : DEFAULT_SETTINGS.algoLang,
    };
}

function streakOf(raw) {
    const s = isObject(raw) ? raw : {};
    const last = typeof s.last === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.last) ? s.last : null;
    return { last, count: last ? (toCount(s.count) ?? 0) : 0 };
}

/** DTO → Progress 모델 */
export function progressFromDto(dto) {
    const raw = isObject(dto) ? dto : {};
    const base = createEmptyProgress();
    return {
        ...base,
        solved: solvedMap(raw.solved),
        tries: countMap(raw.tries),
        realTries: countMap(raw.realTries),
        wrong: countMap(raw.wrong),
        spent: countMap(raw.spent),
        code: codeMap(raw.code),
        hintsOpen: countMap(raw.hintsOpen),
        quiz: quizMap(raw.quiz),
        history: historyList(raw.history),
        streak: streakOf(raw.streak),
        formSeen: clamp(toCount(raw.formSeen) ?? 0, 0, FORM_NAMES.length - 1),
        settings: settingsOf(raw.settings),
    };
}

/** Progress 모델 → 저장·전송용 DTO (지금은 같은 모양의 깊은 복사본) */
export function progressToDto(progress) {
    return JSON.parse(JSON.stringify(progress));
}
