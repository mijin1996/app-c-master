// 실제 모범답안으로 스타일 바꾸기를 검사: 원본은 Allman, K&R 로 바꿔도 채점 결과가 같고, Allman 으로 되돌리면 원래대로
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execute } from '../../public/js/judge/c-interpreter.js';
import { toAllman, toKnr } from '../../public/js/domain/brace-style.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const content = JSON.parse(fs.readFileSync(path.join(root, 'public/data/content.json'), 'utf8'));
const problems = [...content.chapters.flatMap((c) => c.problems), ...content.tracks.flatMap((t) => t.problems)];
const normalize = (s) => String(s).replace(/\r/g, '').split('\n').map((l) => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '');

test('모범답안 전부: 원본은 Allman 이다 (Allman 으로 다시 바꿔도 그대로)', () => {
    // Given / When
    const notAllman = problems.filter((p) => toAllman(p.solution) !== p.solution.replace(/\r\n?/g, '\n')).map((p) => p.id);

    // Then
    assert.deepEqual(notAllman, []);
});

test('모범답안 전부: Allman → K&R → Allman 으로 돌리면 처음과 똑같다', () => {
    // Given / When
    const broken = problems.filter((p) => toAllman(toKnr(p.solution)) !== p.solution.replace(/\r\n?/g, '\n')).map((p) => p.id);

    // Then
    assert.deepEqual(broken, []);
});

test('모범답안 전부: K&R 로 바꾼 코드도 모든 테스트에서 같은 출력 (중괄호만 옮기고 뜻은 안 바뀜)', () => {
    // Given
    const wrong = [];

    // When
    for (const p of problems) {
        const knr = toKnr(p.solution);
        p.tests.forEach((test, i) => {
            const input = typeof test === 'string' ? test : (test.input || '');
            const files = typeof test === 'string' ? {} : (test.files || {});
            const run = execute(knr, { input, files });
            const got = run.ok ? (p.judge ? (run.files[p.judge] || '') : run.output) : 'ERR ' + run.message;
            if (normalize(got) !== normalize(p.expected[i].out)) {
                wrong.push(p.id + '#' + i);
            }
        });
    }

    // Then
    assert.deepEqual(wrong, []);
});
