// 채점기 오류 문장 번역표: 모든 줄이 맞고, 영·중에 한글이 없고, 인터프리터의 문장을 하나도 빠뜨리지 않는다
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RUN_MESSAGE_TABLE } from '../../public/js/i18n/run-message-table.js';
import { translateRunMessage } from '../../public/js/i18n/run-messages.js';
import { execute } from '../../public/js/judge/c-interpreter.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const HANGUL = /[가-힣]/;

test('표의 모든 줄: 예시 문장이 자기 모양에 맞고, 영어 · 중국어로 바꾸면 한글이 없다', () => {
    // Given / When
    const bad = [];
    for (const row of RUN_MESSAGE_TABLE) {
        if (!row.re.test(row.sample)) {
            bad.push('모양 안 맞음: ' + row.sample);
            continue;
        }
        for (const locale of ['en', 'zh']) {
            const out = translateRunMessage(row.sample, locale);
            if (HANGUL.test(out) || out === row.sample) {
                bad.push(locale + ': ' + row.sample + ' → ' + out);
            }
        }
    }

    // Then
    assert.deepEqual(bad, []);
});

test('한국어로 고르면 그대로, 표에 없는 문장도 그대로 (버리지 않는다)', () => {
    // Given / When / Then
    assert.equal(translateRunMessage('세미콜론(;)이 빠진 것 같아요.', 'ko'), '세미콜론(;)이 빠진 것 같아요.');
    assert.equal(translateRunMessage('totally unknown', 'en'), 'totally unknown');
    assert.equal(translateRunMessage('', 'en'), '');
    assert.equal(translateRunMessage(undefined, 'zh'), '');
});

test('글자 안의 값(이름 · 숫자 · 연산자)은 그대로 옮겨 준다', () => {
    // Given
    const message = '배열 범위를 벗어났어요. 크기가 5인 배열에 인덱스 7 로 접근했어요. (사용 가능한 인덱스: 0 ~ 4)';

    // When
    const en = translateRunMessage(message, 'en');
    const zh = translateRunMessage(message, 'zh');

    // Then
    for (const out of [en, zh]) {
        assert.ok(out.includes('5') && out.includes('7') && out.includes('0') && out.includes('4'), out);
    }
});

test('인터프리터 · 실행기 소스의 한국어 오류 문장을 하나도 빠뜨리지 않는다 (새 문장을 넣으면 표에도 넣어야 함)', () => {
    // Given: cerr / rerr / CError / message: 로 던지는 줄의 첫 한글 조각들
    const files = ['public/js/judge/c-interpreter.js', 'public/js/judge/judge-runners.js', 'public/js/judge/python-worker.js'];
    const samples = RUN_MESSAGE_TABLE.map((row) => row.sample).join('\n');
    const missing = [];

    // When
    for (const file of files) {
        const lines = fs.readFileSync(path.join(root, file), 'utf8').split('\n');
        lines.forEach((line, i) => {
            if (/^\s*(\/\/|\*)/.test(line) || !/(cerr|rerr|CError|message:)/.test(line)) {
                return;
            }
            for (const literal of line.matchAll(/(['"])((?:\\.|(?!\1).)*[가-힣](?:\\.|(?!\1).)*)\1/g)) {
                const piece = literal[2].match(/[가-힣][가-힣\s()·,.:]*[가-힣]/)?.[0];
                if (piece && piece.length >= 2 && !samples.includes(piece)) {
                    missing.push(file.split('/').pop() + ':' + (i + 1) + ' ' + piece);
                }
            }
        });
    }

    // Then
    assert.deepEqual(missing, []);
});

test('실제로 틀린 C 코드를 돌려 나온 오류도 영어 · 중국어에 한글이 남지 않는다', () => {
    // Given
    const broken = [
        'int main() { int a = 1 return 0; }',
        'int main() { printf("%d\\n", x); return 0; }',
        'int main() { int a[3]; a[5] = 1; return 0; }',
        'int main() { int a; scanf("%d", a); return 0; }',
        'int main() { while (1) {} return 0; }',
        'int main() { int z = 0; return 1 / z; }',
        'int f(int n) { return f(n + 1); } int main() { return f(0); }',
        'int main() { foo(); return 0; }',
        'int main() { return 0;',
        'int x;',
    ];

    // When
    const leftovers = [];
    for (const code of broken) {
        const run = execute(code, { input: '', timeLimit: 300 });
        assert.equal(run.ok, false, code);
        for (const locale of ['en', 'zh']) {
            const out = translateRunMessage(run.message, locale);
            if (HANGUL.test(out)) {
                leftovers.push(locale + ': ' + run.message);
            }
        }
    }

    // Then
    assert.deepEqual(leftovers, []);
});
