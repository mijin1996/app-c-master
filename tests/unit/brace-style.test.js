// 코드 스타일 바꾸기: K&R(여는 중괄호를 같은 줄 끝) ↔ Allman(여는 중괄호를 다음 줄)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toAllman, toKnr, formatBraces, CodeStyle, DEFAULT_CODE_STYLE, isCodeStyle } from '../../public/js/domain/brace-style.js';

const KNR = [
    '#include <stdio.h>',
    '',
    'int main() {',
    '    int n;',
    '    scanf("%d", &n);',
    '    if (n > 0) {',
    '        printf("plus\\n");',
    '    } else if (n < 0) {',
    '        printf("minus\\n");',
    '    } else {',
    '        printf("zero\\n");',
    '    }',
    '    for (int i = 0; i < n; i++) {',
    '        printf("%d\\n", i);',
    '    }',
    '    return 0;',
    '}',
].join('\n');

const ALLMAN = [
    '#include <stdio.h>',
    '',
    'int main()',
    '{',
    '    int n;',
    '    scanf("%d", &n);',
    '    if (n > 0)',
    '    {',
    '        printf("plus\\n");',
    '    }',
    '    else if (n < 0)',
    '    {',
    '        printf("minus\\n");',
    '    }',
    '    else',
    '    {',
    '        printf("zero\\n");',
    '    }',
    '    for (int i = 0; i < n; i++)',
    '    {',
    '        printf("%d\\n", i);',
    '    }',
    '    return 0;',
    '}',
].join('\n');

test('기본 스타일은 Allman, 아는 스타일은 allman · knr 둘', () => {
    // Given / When / Then
    assert.equal(DEFAULT_CODE_STYLE, CodeStyle.ALLMAN);
    assert.equal(isCodeStyle('allman'), true);
    assert.equal(isCodeStyle('knr'), true);
    assert.equal(isCodeStyle('gnu'), false);
    assert.equal(isCodeStyle(undefined), false);
});

test('K&R → Allman: 여는 중괄호를 같은 들여쓰기로 다음 줄에, } else 도 나눈다', () => {
    // Given / When / Then
    assert.equal(toAllman(KNR), ALLMAN);
});

test('Allman → K&R: 혼자 있는 { 를 윗줄 끝으로, } 다음 줄의 else 를 } else 로', () => {
    // Given / When / Then
    assert.equal(toKnr(ALLMAN), KNR);
});

test('두 번 바꿔도 그대로 (이미 그 스타일이면 아무것도 안 바꾼다)', () => {
    // Given / When / Then
    assert.equal(toAllman(ALLMAN), ALLMAN);
    assert.equal(toKnr(KNR), KNR);
    assert.equal(toKnr(toAllman(KNR)), KNR);
});

test('배열 · 구조체 초기값의 { } 는 옮기지 않는다', () => {
    // Given
    const code = 'int a[3] = {1, 2, 3};\nstruct P p = { 1, 2 };\nint grid[2][2] = {\n    {1, 2},\n    {3, 4}\n};';

    // When / Then
    assert.equal(toAllman(code), code);
    assert.equal(toKnr(code), code);
});

test('문자열 · 문자 · 주석 안의 { 는 건드리지 않는다', () => {
    // Given
    const code = 'int main() {\n    printf("{ not a block\\n"); // also { here\n    char c = \'{\';\n    /* { in comment */\n    return 0;\n}';

    // When
    const allman = toAllman(code);

    // Then: main 의 { 만 옮겨진다
    assert.equal(allman, 'int main()\n{\n    printf("{ not a block\\n"); // also { here\n    char c = \'{\';\n    /* { in comment */\n    return 0;\n}');
    assert.equal(toKnr(allman), code);
});

test('do-while · switch · struct 정의 · 빈 함수도 스타일대로', () => {
    // Given
    const knr = 'struct Point {\n    int x;\n};\nvoid f() {\n}\nint g(int k) {\n    do {\n        k--;\n    } while (k > 0);\n    switch (k) {\n    case 0:\n        break;\n    }\n    return k;\n}';
    const allman = 'struct Point\n{\n    int x;\n};\nvoid f()\n{\n}\nint g(int k)\n{\n    do\n    {\n        k--;\n    } while (k > 0);\n    switch (k)\n    {\n    case 0:\n        break;\n    }\n    return k;\n}';

    // When / Then
    assert.equal(toAllman(knr), allman);
    assert.equal(toKnr(allman), knr);
});

test('줄 끝 주석이 있는 { 도 옮기고 주석은 { 뒤에 남긴다', () => {
    // Given
    const knr = 'int main() { // start\n    return 0;\n}';

    // When / Then
    assert.equal(toAllman(knr), 'int main()\n{ // start\n    return 0;\n}');
    assert.equal(toKnr(toAllman(knr)), knr);
});

test('formatBraces: 스타일 이름으로 고르고, 모르는 스타일 · 빈 코드 · 이상한 값은 그대로', () => {
    // Given / When / Then
    assert.equal(formatBraces(KNR, 'allman'), ALLMAN);
    assert.equal(formatBraces(ALLMAN, 'knr'), KNR);
    assert.equal(formatBraces(KNR, 'weird'), KNR);
    assert.equal(formatBraces('', 'allman'), '');
    assert.equal(formatBraces(null, 'allman'), '');
});

test('윈도우 줄바꿈(\\r\\n)이 섞여도 깨지지 않는다', () => {
    // Given
    const crlf = KNR.replace(/\n/g, '\r\n');

    // When / Then
    assert.equal(toAllman(crlf), ALLMAN);
});
