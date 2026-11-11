// 코드 스타일(중괄호 위치) 바꾸기 — 순수 함수라 화면 · 테스트가 같이 쓴다.
//   K&R   : int main() {        Allman : int main()
//               ...                     {
//           }                               ...
//                                       }
// 문자열 · 문자 · 주석 안의 { 와 배열/구조체 초기값({1, 2})은 옮기지 않는다. 기본은 Allman.
export const CodeStyle = Object.freeze({ ALLMAN: 'allman', KNR: 'knr' });
export const DEFAULT_CODE_STYLE = CodeStyle.ALLMAN;

export function isCodeStyle(value) {
    return value === CodeStyle.ALLMAN || value === CodeStyle.KNR;
}

// 이 글자로 끝나면 { 는 블록이 아니라 초기값 · 식의 일부라서 옮기지 않는다
const NOT_BLOCK_END = /(=|,|\(|\[|\{|\breturn)$/;
// 이 글자로 끝나는 윗줄에는 { 를 붙이지 않는다 (문장 끝 · 블록 끝 · 전처리 줄 등)
const NO_JOIN_END = /[;{},=]$/;

/** 문자열 · 문자 · 주석 글자를 공백으로 가린 같은 길이의 글 (줄바꿈은 그대로) — 구조만 보기 위해 */
function maskLiterals(code) {
    let out = '';
    let i = 0;
    const n = code.length;
    while (i < n) {
        const c = code[i];
        const next = code[i + 1];
        if (c === '/' && next === '/') {
            while (i < n && code[i] !== '\n') {
                out += ' ';
                i++;
            }
        } else if (c === '/' && next === '*') {
            out += '  ';
            i += 2;
            while (i < n && !(code[i] === '*' && code[i + 1] === '/')) {
                out += code[i] === '\n' ? '\n' : ' ';
                i++;
            }
            if (i < n) {
                out += '  ';
                i += 2;
            }
        } else if (c === '"' || c === '\'') {
            out += ' ';
            i++;
            while (i < n && code[i] !== c && code[i] !== '\n') {
                if (code[i] === '\\' && i + 1 < n) {
                    out += ' ';
                    i++;
                }
                out += ' ';
                i++;
            }
            if (i < n && code[i] === c) {
                out += ' ';
                i++;
            }
        } else {
            out += c;
            i++;
        }
    }
    return out;
}

function linesOf(code) {
    const text = String(code ?? '').replace(/\r\n?/g, '\n');
    return { text: text.split('\n'), mask: maskLiterals(text).split('\n') };
}

const indentOf = (line) => line.match(/^\s*/)[0];

/** K&R → Allman: 줄 끝의 블록 { 를 같은 들여쓰기로 다음 줄에. "} else {" 는 }, else, { 세 줄로 */
export function toAllman(code) {
    const { text, mask } = linesOf(code);
    const out = [];
    text.forEach((line, k) => {
        const m = mask[k];
        const trimmedMask = m.trimEnd();
        if (!trimmedMask.endsWith('{')) {
            out.push(line);
            return;
        }
        const p = trimmedMask.length - 1;          // 그 { 의 자리 (뒤에는 공백 · 주석만)
        const beforeMask = m.slice(0, p).trimEnd();
        if (beforeMask.trim() === '' || NOT_BLOCK_END.test(beforeMask.trim())) {
            out.push(line);                        // 이미 Allman 이거나 초기값
            return;
        }
        const indent = indentOf(line);
        const before = line.slice(0, p).trimEnd();
        const brace = line.slice(p).trimEnd();     // "{" 또는 "{ // 주석"
        if (beforeMask.trimStart().startsWith('}')) {
            out.push(indent + '}');
            out.push(indent + before.trimStart().slice(1).trimStart());
        } else {
            out.push(before);
        }
        out.push(indent + brace);
    });
    return out.join('\n');
}

/** Allman → K&R: 혼자 있는 { 를 윗줄 끝으로, } 다음 줄의 else 를 "} else" 로 */
export function toKnr(code) {
    const { text, mask } = linesOf(code);
    const out = [];   // { text, mask }
    text.forEach((line, k) => {
        const m = mask[k];
        const core = m.trim();
        const prev = out[out.length - 1];
        const prevCore = prev ? prev.mask.trim() : '';
        const canJoin = prev && prevCore !== '' && !prevCore.startsWith('#');
        if (core === '{' && canJoin && !NO_JOIN_END.test(prevCore)) {
            prev.text = prev.text.trimEnd() + ' ' + line.trim();
            prev.mask = prev.mask.trimEnd() + ' ' + m.trim();
            return;
        }
        if (/^else\b/.test(core) && canJoin && prevCore === '}') {
            prev.text = prev.text.trimEnd() + ' ' + line.trim();
            prev.mask = prev.mask.trimEnd() + ' ' + m.trim();
            return;
        }
        out.push({ text: line, mask: m });
    });
    return out.map((row) => row.text).join('\n');
}

/** 스타일 이름으로 바꾼다. 모르는 스타일이면 그대로 */
export function formatBraces(code, style) {
    const text = String(code ?? '');
    if (text === '') {
        return '';
    }
    if (style === CodeStyle.ALLMAN) {
        return toAllman(text);
    }
    if (style === CodeStyle.KNR) {
        return toKnr(text);
    }
    return text;
}
