// 실제 번역 파일 검사: 영어 · 중국어 번역이 빠짐없이 맞고, 빌드된 파일이 번역과 같으며, 채점 정보는 한국어 원본과 같다
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { overlayContent, overlayOop } from '../../tools/i18n-overlay.mjs';

const require = createRequire(import.meta.url);
const TRANSLATED_LOCALES = ['en', 'zh'];
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const load = (locale, name) => require('../../content/i18n/' + locale + '/' + name + '.cjs');

const content = readJson('public/data/content.json');
const oop = readJson('public/data/oop.json');

/** 채점에 쓰는 값만 모은 것 — 언어가 달라도 같아야 한다 */
const gradingOf = (data) => [...data.chapters.flatMap((c) => c.problems), ...data.tracks.flatMap((t) => t.problems)]
    .map((p) => ({ id: p.id, tests: p.tests, expected: p.expected, solution: p.solution, judge: p.judge }));

for (const locale of TRANSLATED_LOCALES) {
    test(locale + ' 학습 내용 번역에 문제가 하나도 없다', () => {
        // Given 한국어 원본과 번역 파일
        // When 번역을 덮어쓰면
        const built = overlayContent(content, { chapters: load(locale, 'chapters'), tracks: load(locale, 'algorithm') });
        const lessons = overlayOop(oop.lessons, load(locale, 'oop'));
        // Then 빠짐 · 남은 한글 · 코드 변경 오류가 없다
        assert.deepEqual([...built.errors, ...lessons.errors], []);
    });

    test(locale + ' 빌드된 파일이 번역 결과와 같다 (build-i18n 을 다시 돌렸는지)', () => {
        // Given 번역 결과
        const built = overlayContent(content, { chapters: load(locale, 'chapters'), tracks: load(locale, 'algorithm') });
        const lessons = overlayOop(oop.lessons, load(locale, 'oop'));
        // When 배포용 파일을 읽으면
        const shippedContent = readJson('public/data/content.' + locale + '.json');
        const shippedOop = readJson('public/data/oop.' + locale + '.json');
        // Then 내용이 같다
        assert.deepEqual(shippedContent, built.result);
        assert.deepEqual(shippedOop, { lessons: lessons.result });
    });

    test(locale + ' 채점 정보(테스트 · 정답 출력 · 풀이)는 한국어 원본과 같다', () => {
        // Given 배포용 번역 파일
        const shipped = readJson('public/data/content.' + locale + '.json');
        // When / Then 채점 값이 원본과 같다
        assert.deepEqual(gradingOf(shipped), gradingOf(content));
    });
}
