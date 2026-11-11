// 에디터 자동 중괄호 · 들여쓰기 (언어마다 스타일: C · C++ Allman, Java K&R, Python PEP 8)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { smartEnter } from '../../public/js/ui/editor-rules.js';

/** 커서(|) 자리에서 Enter 를 누른 결과를 | 가 들어간 글로 */
const enter = (textWithCaret, style) => {
    const at = textWithCaret.indexOf('|');
    const value = textWithCaret.replace('|', '');
    const r = smartEnter(value, at, at, style);
    const out = value.slice(0, r.from) + r.text + value.slice(r.to);
    return out.slice(0, r.caret) + '|' + out.slice(r.caret);
};

test('Allman: 줄 끝에 { 를 쓰고 Enter → { 를 다음 줄로 옮기고 } 까지 닫아 준다', () => {
    // Given / When / Then
    assert.equal(enter('int main() {|', 'allman'), 'int main()\n{\n    |\n}');
    assert.equal(enter('    if (x > 0) {|', 'allman'), '    if (x > 0)\n    {\n        |\n    }');
});

test('K&R: { 는 그 줄에 두고, 안쪽을 들여쓰고 } 를 닫아 준다', () => {
    // Given / When / Then
    assert.equal(enter('public void run() {|', 'knr'), 'public void run() {\n    |\n}');
});

test('이미 { 만 있는 줄이면 스타일과 상관없이 옮기지 않는다', () => {
    // Given / When / Then
    assert.equal(enter('int main()\n{|', 'allman'), 'int main()\n{\n    |\n}');
});

test('바로 뒤에 } 가 있으면 새로 닫지 않고 그 } 를 아랫줄로 보낸다', () => {
    // Given / When / Then
    assert.equal(enter('int main() {|}', 'knr'), 'int main() {\n    |\n}');
});

test('짝이 이미 맞으면 } 를 더 만들지 않는다 (위에서 연 { 를 다시 Enter)', () => {
    // Given / When / Then
    assert.equal(enter('int main() {|\n    return 0;\n}', 'knr'), 'int main() {\n    |\n    return 0;\n}');
});

test('PEP 8: : 로 끝나면 4칸 들여쓰고, 아니면 같은 들여쓰기', () => {
    // Given / When / Then
    assert.equal(enter('for i in range(3):|', 'pep8'), 'for i in range(3):\n    |');
    assert.equal(enter('    x = 1|', 'pep8'), '    x = 1\n    |');
});

test('보통 줄은 같은 들여쓰기만 이어 간다', () => {
    // Given / When / Then
    assert.equal(enter('    printf("hi");|', 'allman'), '    printf("hi");\n    |');
    assert.equal(enter('|', 'allman'), '\n|');
});

test('문자열 · 주석 안의 { 는 무시하고 들여쓰기만', () => {
    // Given / When / Then
    assert.equal(enter('    printf("{");|', 'allman'), '    printf("{");\n    |');
    assert.equal(enter('    // {|', 'allman'), '    // {\n    |');
});
