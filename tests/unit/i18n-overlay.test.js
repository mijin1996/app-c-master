// 학습 내용 번역 덮어쓰기: 빠짐 · 길이 · 남은 한글 검사, 코드 · 채점 정보는 그대로
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { overlayContent, overlayOop } from '../../tools/i18n-overlay.mjs';

const base = () => ({
    chapters: [{
        ch: 1, title: '출력', stage: 0,
        concept: { points: ['printf 로 출력해요'], example: 'int main() { return 0; }' },
        problems: [{
            id: 1001, title: '안녕, C!', level: 1, desc: '두 줄을 출력하세요.', input: '입력은 없습니다.', output: 'C언어 첫걸음 을 출력합니다.',
            tests: [''], hints: ['printf 두 번', '줄바꿈 확인'], solution: 'printf("C언어 첫걸음\\n");', expected: [{ out: 'C언어 첫걸음' }],
        }],
        quiz: [{ q: '시작 함수는?', options: ['start', 'main'], answer: 1, explain: 'main 부터 실행돼요.', code: 'int main(){}' }],
    }],
    tracks: [{
        track: 'bronze', name: '브론즈', level: 4, intro: '반복문 연습', topics: ['완전 탐색'],
        problems: [{ id: 5101, title: '가장 긴 날', level: 4, desc: '찾으세요.', input: 'N', output: '답', tests: ['1'], hints: ['하나'], solution: 'int main(){}', expected: [{ out: '1' }] }],
    }],
});

const translation = () => ({
    chapters: {
        1: {
            title: 'Output',
            points: ['Print with printf'],
            problems: { 1001: { title: 'Hello, C!', desc: 'Print two lines.', input: 'There is no input.', output: 'Print C언어 첫걸음 exactly.', hints: ['printf twice', 'check newlines'] } },
            quiz: [{ q: 'Which function runs first?', options: ['start', 'main'], explain: 'Programs start at main.' }],
        },
    },
    tracks: {
        bronze: { name: 'Bronze', intro: 'Loop practice', topics: ['Brute force'], problems: { 5101: { title: 'Longest day', desc: 'Find it.', input: 'N', output: 'Answer', hints: ['one'] } } },
    },
});

test('덮어쓰기: 글자만 바뀌고 코드 · 테스트 · 정답 · 번호 · 난이도는 그대로', () => {
    // Given / When
    const { result, errors } = overlayContent(base(), translation());

    // Then
    assert.deepEqual(errors, []);
    const ch = result.chapters[0];
    assert.equal(ch.title, 'Output');
    assert.equal(ch.problems[0].desc, 'Print two lines.');
    assert.equal(ch.problems[0].solution, base().chapters[0].problems[0].solution);
    assert.deepEqual(ch.problems[0].expected, base().chapters[0].problems[0].expected);
    assert.equal(ch.quiz[0].answer, 1);
    assert.equal(ch.quiz[0].code, 'int main(){}');
    assert.equal(ch.concept.example, base().chapters[0].concept.example);
    assert.equal(result.tracks[0].problems[0].title, 'Longest day');
    assert.equal(result.tracks[0].level, 4);
});

test('정답 출력에 실제로 있는 한글(C언어 첫걸음)은 번역에 남아도 된다', () => {
    // Given / When
    const { errors } = overlayContent(base(), translation());

    // Then
    assert.deepEqual(errors, []);
});

test('코드 · 정답에 없는 한글이 번역에 남으면 알려 준다', () => {
    // Given
    const tr = translation();
    tr.chapters[1].problems[1001].hints[0] = 'printf 두 번';

    // When
    const { errors } = overlayContent(base(), tr);

    // Then
    assert.ok(errors.some((e) => e.includes('1001') && e.includes('한글')), errors.join('\n'));
});

test('빠진 번역(문제 · 힌트 · 퀴즈 보기)과 길이가 다른 배열을 알려 준다', () => {
    // Given
    const tr = translation();
    delete tr.chapters[1].problems[1001].desc;
    tr.chapters[1].problems[1001].hints.pop();
    tr.chapters[1].quiz[0].options.push('extra');
    delete tr.tracks.bronze.problems[5101];

    // When
    const { errors } = overlayContent(base(), tr);

    // Then
    assert.ok(errors.some((e) => e.includes('1001') && e.includes('desc')), errors.join('\n'));
    assert.ok(errors.some((e) => e.includes('1001') && e.includes('hints')), errors.join('\n'));
    assert.ok(errors.some((e) => e.includes('quiz') && e.includes('options')), errors.join('\n'));
    assert.ok(errors.some((e) => e.includes('5101')), errors.join('\n'));
});

test('원본에 없는 번호(오타)도 알려 준다', () => {
    // Given
    const tr = translation();
    tr.chapters[1].problems[9999] = { title: 'x', desc: 'x', input: 'x', output: 'x', hints: [] };

    // When
    const { errors } = overlayContent(base(), tr);

    // Then
    assert.ok(errors.some((e) => e.includes('9999')), errors.join('\n'));
});

test('객체지향: 설명 · 퀴즈 · 실습 글을 덮고, 코드 · 정답 · 빈칸 정답은 그대로', () => {
    // Given
    const lessons = [{
        no: 1, title: '클래스', tag: '붕어빵', story: ['틀이에요'], points: ['new'], example: { title: '예시', code: 'var a = new Hero(); // 만들기' },
        quiz: [{ q: '무엇?', options: ['가', '나'], answer: 0, explain: '해설' }],
        practice: [
            { kind: 'blank', prompt: '채워요', code: '[[1]] Hero', blanks: [{ answers: ['new'], hint: '주문' }], explain: '해설' },
            { kind: 'output', prompt: '무엇이 나올까요?', code: 'Console.WriteLine("슈크림");', answers: ['슈크림'], hint: '보세요', explain: '슈크림 이 나와요' },
        ],
    }];
    const tr = {
        1: {
            title: 'Classes', tag: 'Fish-bread mold', story: ['It is a mold'], points: ['new'], exampleTitle: 'Example', exampleCode: 'var a = new Hero(); // create',
            quiz: [{ q: 'What?', options: ['A', 'B'], explain: 'Because' }],
            practice: [
                { prompt: 'Fill in', blankHints: ['the order'], explain: 'Because' },
                { prompt: 'What is printed?', hint: 'Look', explain: 'It prints 슈크림' },
            ],
        },
    };

    // When
    const { result, errors } = overlayOop(lessons, tr);

    // Then
    assert.deepEqual(errors, []);
    assert.equal(result[0].title, 'Classes');
    assert.equal(result[0].example.code, 'var a = new Hero(); // create');
    assert.equal(result[0].quiz[0].answer, 0);
    assert.deepEqual(result[0].practice[0].blanks[0].answers, ['new']);
    assert.equal(result[0].practice[0].blanks[0].hint, 'the order');
    assert.deepEqual(result[0].practice[1].answers, ['슈크림']);
    assert.equal(result[0].practice[1].code, lessons[0].practice[1].code);
});

test('객체지향: 예시 코드를 바꿀 때 주석 말고 코드 줄이 달라지면 알려 준다 (뜻이 바뀌면 안 됨)', () => {
    // Given
    const lessons = [{ no: 1, title: '클래스', tag: 't', story: ['s'], points: ['p'], example: { title: 'e', code: 'int a = 1; // 하나' }, quiz: [], practice: [] }];
    const tr = { 1: { title: 'C', tag: 't', story: ['s'], points: ['p'], exampleTitle: 'e', exampleCode: 'int a = 2; // one', quiz: [], practice: [] } };

    // When
    const { errors } = overlayOop(lessons, tr);

    // Then
    assert.ok(errors.some((e) => e.includes('exampleCode')), errors.join('\n'));
});
