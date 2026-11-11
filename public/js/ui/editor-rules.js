// 에디터 Enter 규칙 (순수 함수): 언어 스타일에 맞게 중괄호 자리 · 들여쓰기 · 닫는 } 를 맞춘다.
//   allman: { 를 다음 줄로 (C · C++ 기본)   knr: { 를 그 줄 끝에 (Java 기본)   pep8: : 뒤 4칸 (Python)
import { CodeStyle } from '../domain/brace-style.js';

const INDENT = '    ';

/** 줄에서 문자열 · 문자 · // 주석을 지운 "코드만" (안에 있는 { 를 세지 않으려고) */
function codeOnly(line) {
    return line.replace(/"(?:\\.|[^"\\])*"?|'(?:\\.|[^'\\])*'?/g, '""').replace(/\/\/.*$/, '');
}

/** 코드 전체에서 아직 닫히지 않은 { 개수 */
function openBraces(text) {
    let depth = 0;
    for (const line of text.split('\n')) {
        for (const ch of codeOnly(line)) {
            if (ch === '{') {
                depth++;
            } else if (ch === '}') {
                depth--;
            }
        }
    }
    return depth;
}

/**
 * @returns {{ from: number, to: number, text: string, caret: number }} value 의 [from, to) 를 text 로 바꾸고, 커서는 caret
 */
export function smartEnter(value, start, end, style) {
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const before = value.slice(lineStart, start);
    const indent = (before.match(/^[ \t]*/) ?? [''])[0];
    const code = codeOnly(before).trimEnd();
    const plain = { from: start, to: end, text: '\n' + indent, caret: start + 1 + indent.length };

    if (style === CodeStyle.PEP8) {
        return code.endsWith(':') ? { from: start, to: end, text: '\n' + indent + INDENT, caret: start + 1 + indent.length + INDENT.length } : plain;
    }
    if (!code.endsWith('{')) {
        return plain;
    }

    const head = before.trimEnd().slice(0, -1).trimEnd(); // { 앞의 글 (예: "int main()")
    const moveBrace = style === CodeStyle.ALLMAN && head.trim() !== '';
    const opening = moveBrace ? head + '\n' + indent + '{' : before.trimEnd();
    const inner = '\n' + indent + INDENT;
    const after = value.slice(end);
    const closesRightAfter = /^[ \t]*\}/.test(after);
    const needClose = !closesRightAfter && openBraces(value) > 0;
    const rest = closesRightAfter ? after.replace(/^[ \t]*/, '') : after;
    const closing = closesRightAfter || needClose ? '\n' + indent + (needClose ? '}' : '') : '';

    const text = opening + inner + closing;
    const caret = lineStart + opening.length + inner.length;
    // 바로 뒤의 } 를 아랫줄로 보낼 때는 그 앞 공백까지 바꾼다
    const to = closesRightAfter ? end + (after.length - rest.length) : end;
    return { from: lineStart, to, text, caret };
}
