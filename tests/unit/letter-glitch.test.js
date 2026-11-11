// 글자 글리치 배경: 격자 크기, 색 변환, 글자 바꾸기 비율, 부드러운 색 넘어가기
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    GLITCH, gridSize, hexToRgb, mixRgb, createLetters, glitchLetters, smoothLetters, paletteFor,
} from '../../public/js/ui/letter-glitch.js';

// 늘 같은 값을 주는 가짜 랜덤 (0, 0.1, 0.2 … 순서로 돈다)
const fakeRandom = () => {
    let i = 0;
    return () => (i++ % 10) / 10;
};

test('gridSize: 화면을 글자 칸(10×20)으로 나누고, 남는 부분도 한 칸으로 센다', () => {
    // Given / When / Then
    assert.deepEqual(gridSize(100, 40), { cols: 10, rows: 2 });
    assert.deepEqual(gridSize(101, 41), { cols: 11, rows: 3 });
    assert.deepEqual(gridSize(0, 0), { cols: 0, rows: 0 });
});

test('hexToRgb: #rrggbb 를 숫자로, 이상한 값은 null', () => {
    // Given / When / Then
    assert.deepEqual(hexToRgb('#61dca3'), { r: 97, g: 220, b: 163 });
    assert.deepEqual(hexToRgb('#FFF'), { r: 255, g: 255, b: 255 });
    assert.equal(hexToRgb('red'), null);
    assert.equal(hexToRgb(null), null);
});

test('mixRgb: 0 이면 처음 색, 1 이면 목표 색, 0.5 면 가운데', () => {
    // Given
    const a = { r: 0, g: 0, b: 0 };
    const b = { r: 200, g: 100, b: 50 };
    // When / Then
    assert.equal(mixRgb(a, b, 0), 'rgb(0,0,0)');
    assert.equal(mixRgb(a, b, 1), 'rgb(200,100,50)');
    assert.equal(mixRgb(a, b, 0.5), 'rgb(100,50,25)');
});

test('createLetters: 칸 수만큼 만들고, 글자와 색은 고른 목록 안에서만', () => {
    // Given
    const palette = paletteFor('night');
    // When
    const letters = createLetters(30, palette, fakeRandom());
    // Then
    assert.equal(letters.length, 30);
    for (const letter of letters) {
        assert.ok(GLITCH.CHARACTERS.includes(letter.char));
        assert.ok(palette.includes(letter.color));
    }
    assert.deepEqual(createLetters(0, palette, fakeRandom()), []);
});

test('glitchLetters: 한 번에 약 5%만 바꾸고, 칸이 적어도 최소 1개는 바꾼다', () => {
    // Given
    const palette = paletteFor('night');
    const many = createLetters(200, palette, fakeRandom());
    const few = createLetters(3, palette, fakeRandom());
    // When / Then
    assert.equal(glitchLetters(many, palette, fakeRandom()), 10);
    assert.equal(glitchLetters(few, palette, fakeRandom()), 1);
    assert.equal(glitchLetters([], palette, fakeRandom()), 0);
});

test('smoothLetters: 색이 조금씩 목표로 다가가다가 끝나면 목표 색이 된다', () => {
    // Given
    const palette = paletteFor('night');
    const [letter] = createLetters(1, palette, fakeRandom());
    letter.color = palette[0];
    letter.target = palette[1];
    letter.progress = 0;
    // When
    smoothLetters([letter], 0.5);
    const middle = letter.color;
    smoothLetters([letter], 0.5);
    // Then
    assert.notEqual(middle, palette[0]);
    assert.equal(letter.progress, 1);
    assert.equal(letter.color, palette[1]);
});

test('paletteFor: 밤 · 낮 색 목록이 있고, 모르는 모드는 밤 색', () => {
    // Given / When / Then
    assert.ok(paletteFor('night').length >= 3);
    assert.ok(paletteFor('day').length >= 3);
    assert.deepEqual(paletteFor('unknown'), paletteFor('night'));
    assert.ok([...paletteFor('day'), ...paletteFor('night')].every((c) => hexToRgb(c) !== null));
});
