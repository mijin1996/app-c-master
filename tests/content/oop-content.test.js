// 객체지향 레슨 원본 검사기 · DTO mapper · 실제 콘텐츠를 확인한다
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { validateLessons } from '../../tools/oop-validate.mjs';
import { oopLessonsFromDto } from '../../public/js/mappers/oop-content-mapper.js';
import { OOP_LESSONS } from '../../public/js/domain/oop-curriculum.js';
import { OOP_QUIZ_SIZE } from '../../public/js/domain/oop-rules.js';
import { checkPractice } from '../../public/js/domain/oop-practice-rules.js';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const question = (answer = 0) => ({ q: '질문', options: ['가', '나', '다', '라'], answer, explain: '쉬운 해설' });
const blankPractice = () => ({ kind: 'blank', prompt: '빈칸을 채워요', code: 'public [[1]] int Hp { get; [[2]]; }', blanks: [{ answers: ['int'] }, { answers: ['set'] }], explain: '해설' });
const outputPractice = () => ({ kind: 'output', prompt: '무엇이 나올까요?', code: 'Console.WriteLine(2);', answers: ['2'], explain: '해설' });
const lesson = (no) => ({ no, title: '레슨', story: ['쉽게 말하면'], points: ['핵심'], quiz: [0, 1, 2, 3, 0].map(question), practice: [blankPractice(), outputPractice()] });

test('검사기: 올바른 레슨은 문제 없음', () => {
    // Given / When
    const errors = validateLessons([lesson(1), lesson(2)]);

    // Then
    assert.deepEqual(errors, []);
});

test('검사기: 번호가 1부터 이어지지 않으면 알려 준다', () => {
    // Given / When
    const errors = validateLessons([lesson(1), lesson(3)]);

    // Then
    assert.ok(errors.some((e) => e.includes('번호')));
});

test('검사기: 문항이 4개(5-1)거나 6개(5+1)면 알려 준다', () => {
    // Given
    const short = lesson(1);
    short.quiz.pop();
    const long = lesson(1);
    long.quiz.push(question());

    // When / Then
    assert.ok(validateLessons([short]).some((e) => e.includes('문항')));
    assert.ok(validateLessons([long]).some((e) => e.includes('문항')));
});

test('검사기: 정답 번호가 보기 밖이거나, 해설 · 설명이 비면 알려 준다', () => {
    // Given
    const bad = lesson(1);
    bad.quiz[0].answer = 4;
    bad.quiz[1].explain = ' ';
    bad.story = [];

    // When
    const errors = validateLessons([bad]);

    // Then
    assert.ok(errors.some((e) => e.includes('정답')));
    assert.ok(errors.some((e) => e.includes('해설')));
    assert.ok(errors.some((e) => e.includes('설명')));
});

test('검사기: 코드 실습은 레슨마다 빈칸 1개 + 결과 맞히기 1개', () => {
    // Given
    const none = lesson(1);
    none.practice = [];
    const twoBlanks = lesson(1);
    twoBlanks.practice = [blankPractice(), blankPractice()];

    // When / Then
    assert.ok(validateLessons([none]).some((e) => e.includes('실습')));
    assert.ok(validateLessons([twoBlanks]).some((e) => e.includes('실습')));
});

test('검사기: 빈칸 표시 [[n]] 개수와 정답 칸 수가 다르거나, 정답 · 해설이 비면 알려 준다', () => {
    // Given
    const mismatch = lesson(1);
    mismatch.practice[0].blanks.pop();
    const empty = lesson(1);
    empty.practice[1].answers = [' '];
    empty.practice[1].explain = '';

    // When / Then
    assert.ok(validateLessons([mismatch]).some((e) => e.includes('빈칸')));
    const errors = validateLessons([empty]);
    assert.ok(errors.some((e) => e.includes('정답')));
    assert.ok(errors.some((e) => e.includes('해설')));
});

test('검사기: 빈칸 번호는 1부터 차례대로 ([[2]] 만 있으면 안 됨)', () => {
    // Given
    const skipped = lesson(1);
    skipped.practice[0].code = 'a [[2]] b [[3]]';

    // When / Then
    assert.ok(validateLessons([skipped]).some((e) => e.includes('빈칸')));
});

test('mapper: 코드 실습을 남기고, 모양이 이상한 실습은 버린다', () => {
    // Given
    const dto = { lessons: [{ ...lesson(1), practice: [blankPractice(), { kind: 'magic' }, outputPractice(), null] }] };

    // When
    const [l] = oopLessonsFromDto(dto);

    // Then
    assert.deepEqual(l.practice.map((p) => p.kind), ['blank', 'output']);
    assert.deepEqual(l.practice[0].blanks[1].answers, ['set']);
});

test('실제 원본: 13레슨 모두 빈칸 1 + 결과 맞히기 1, 서버용 목록에 실습 개수가 들어 있다', () => {
    // Given
    const source = require(path.join(root, 'content/oop.cjs'));

    // When / Then
    for (const l of source) {
        assert.deepEqual(l.practice.map((p) => p.kind).sort(), ['blank', 'output'], '레슨 ' + l.no);
    }
    assert.deepEqual(OOP_LESSONS.map((l) => l.practice), source.map((l) => l.practice.length));
});

test('실제 원본: 실습 정답은 자기 자신을 채점기에 넣으면 정답이 된다', () => {
    // Given
    const source = require(path.join(root, 'content/oop.cjs'));

    // When / Then
    for (const l of source) {
        for (const p of l.practice) {
            const inputs = p.kind === 'blank' ? p.blanks.map((b) => b.answers[0]) : [p.answers[0]];
            assert.equal(checkPractice(p, inputs).correct, true, '레슨 ' + l.no + ' ' + p.kind);
        }
    }
});

test('검사기: 레슨이 하나도 없거나 배열이 아니면 알려 준다', () => {
    // Given / When / Then
    assert.ok(validateLessons([]).length > 0);
    assert.ok(validateLessons(null).length > 0);
});

test('mapper: 이상한 레슨 · 문항은 버리고 모양을 맞춘다', () => {
    // Given
    const dto = { lessons: [lesson(1), null, { no: 'x' }, { ...lesson(2), quiz: [question(), { q: '보기 없음' }] }] };

    // When
    const lessons = oopLessonsFromDto(dto);

    // Then
    assert.deepEqual(lessons.map((l) => l.no), [1, 2]);
    assert.equal(lessons[1].quiz.length, 1);
    assert.deepEqual(lessons[0].points, ['핵심']);
});

test('mapper: null · 배열 · 빈 객체는 빈 목록', () => {
    // Given / When / Then
    assert.deepEqual(oopLessonsFromDto(null), []);
    assert.deepEqual(oopLessonsFromDto([]), []);
    assert.deepEqual(oopLessonsFromDto({}), []);
});

test('실제 원본(content/oop.cjs)은 검사를 통과하고 13개 레슨, 레슨마다 5문항', () => {
    // Given
    const source = require(path.join(root, 'content/oop.cjs'));

    // When
    const errors = validateLessons(source);

    // Then
    assert.deepEqual(errors, []);
    assert.equal(source.length, 13);
    for (const l of source) {
        assert.equal(l.quiz.length, OOP_QUIZ_SIZE);
    }
});

test('정답이 한 자리(예: 늘 1번)로 몰리지 않는다', () => {
    // Given
    const source = require(path.join(root, 'content/oop.cjs'));

    // When
    const counts = [0, 0, 0, 0];
    source.flatMap((l) => l.quiz).forEach((q) => counts[q.answer]++);

    // Then: 어느 번호도 전체의 40%를 넘지 않는다
    const total = counts.reduce((a, b) => a + b, 0);
    assert.ok(Math.max(...counts) / total <= 0.4, String(counts));
});

test('만들어 둔 파일(oop.json, oop-curriculum.js)이 원본과 같다 (build-oop 을 다시 돌렸는지)', () => {
    // Given
    const source = require(path.join(root, 'content/oop.cjs'));
    const built = JSON.parse(fs.readFileSync(path.join(root, 'public/data/oop.json'), 'utf8'));

    // When / Then
    assert.deepEqual(built.lessons, source);
    assert.deepEqual(OOP_LESSONS.map((l) => l.no), source.map((l) => l.no));
    assert.deepEqual(OOP_LESSONS.map((l) => l.title), source.map((l) => l.title));
    assert.deepEqual(OOP_LESSONS.map((l) => l.practice), source.map((l) => l.practice?.length ?? 0));
});
