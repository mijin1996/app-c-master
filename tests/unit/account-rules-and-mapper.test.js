// 계정 입력 규칙과 진도 Mapper 테스트
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    isValidUsername, isValidPassword, normalizeNickname, normalizeRecoveryCode, formatRecoveryCode,
} from '../../public/js/domain/account-rules.js';
import { progressFromDto, progressToDto } from '../../public/js/mappers/progress-mapper.js';

test('아이디는 영문 소문자·숫자·_ 3~16자', () => {
    assert.equal(isValidUsername('abc'), true);
    assert.equal(isValidUsername('a_1234567890bcde'), true);   // 16자 경계
    assert.equal(isValidUsername('ab'), false);                 // 2자
    assert.equal(isValidUsername('a_1234567890bcdef'), false);  // 17자
    assert.equal(isValidUsername('Kim'), false);                // 대문자
    assert.equal(isValidUsername('김철수'), false);
    assert.equal(isValidUsername(null), false);
});

test('비밀번호는 4~64자', () => {
    assert.equal(isValidPassword('abcd'), true);
    assert.equal(isValidPassword('abc'), false);
    assert.equal(isValidPassword('a'.repeat(64)), true);
    assert.equal(isValidPassword('a'.repeat(65)), false);
    assert.equal(isValidPassword(undefined), false);
});

test('닉네임은 앞뒤 공백을 지우고, 비면 아이디를 쓴다', () => {
    assert.equal(normalizeNickname('  코디  ', 'cody'), '코디');
    assert.equal(normalizeNickname('   ', 'cody'), 'cody');
    assert.equal(normalizeNickname('가'.repeat(13), 'cody'), null);
});

test('복구 코드는 대소문자·하이픈·공백을 무시하고 8자리만 인정한다', () => {
    assert.equal(normalizeRecoveryCode('k7q2-9mxa'), 'K7Q29MXA');
    assert.equal(normalizeRecoveryCode(' K7Q2 9MXA '), 'K7Q29MXA');
    assert.equal(normalizeRecoveryCode('K7Q2-9MX'), null);
    assert.equal(formatRecoveryCode('K7Q29MXA'), 'K7Q2-9MXA');
});

test('Mapper: 비어 있는 DTO는 기본값으로 채운 진도가 된다', () => {
    // When
    const progress = progressFromDto({});

    // Then
    assert.deepEqual(progress.solved, {});
    assert.equal(progress.settings.codyName, '코디');
    assert.equal(progress.formSeen, 0);
});

test('Mapper: 잘못된 값은 걸러 내고 범위를 맞춘다', () => {
    // Given: 이상한 값이 섞인 DTO
    const dto = {
        solved: { 1001: { at: 5, tries: 2, time: 30, late: false }, hack: { at: 1 }, 1002: 'x' },
        quiz: { 1: 7, 2: -3, 3: 4, 99: 5 },
        spent: { 1001: -50, 1002: 120.7 },
        code: { 1001: 'int main() { }', 1002: 12 },
        settings: { volume: 9, sky: 'rainbow', codyName: '', sfx: 'yes' },
        formSeen: 10,
        history: Array.from({ length: 300 }, (_, i) => ({ id: 1001, res: 'AC', at: i })),
    };

    // When
    const p = progressFromDto(dto);

    // Then
    assert.deepEqual(Object.keys(p.solved), ['1001']);
    assert.deepEqual(p.quiz, { 1: 5, 2: 0, 3: 4 });
    assert.deepEqual(p.spent, { 1001: 0, 1002: 120 });
    assert.deepEqual(p.code, { 1001: 'int main() { }' });
    assert.equal(p.settings.volume, 1);
    assert.equal(p.settings.sky, 'auto');
    assert.equal(p.settings.codyName, '코디');
    assert.equal(p.settings.sfx, true);
    assert.equal(p.formSeen, 4);
    assert.equal(p.history.length, 200);
});

test('Mapper: 진도 → DTO → 진도로 바꿔도 내용이 같다', () => {
    const p = progressFromDto({ solved: { 1001: { at: 1, tries: 1, time: 3, late: true } }, quiz: { 1: 5 } });

    const again = progressFromDto(progressToDto(p));

    assert.deepEqual(again, p);
});
