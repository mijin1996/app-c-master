// 언어마다 코드 스타일: C · C++ Allman, Java K&R, Python PEP 8 (토글로 C · C++ · Java 는 바꿀 수 있고 언어마다 기억)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Result } from '../../public/js/core/result.js';
import { DEFAULT_SETTINGS } from '../../public/js/domain/progress-model.js';
import { progressFromDto } from '../../public/js/mappers/progress-mapper.js';
import { ProgressService } from '../../public/js/services/progress-service.js';
import { CURRICULUM } from '../../public/js/domain/curriculum.js';
import { codeStyleFor, LANGUAGE_CODE_STYLES, fenceLanguageOf } from '../../public/js/domain/brace-style.js';

const repo = (initial) => ({
    async loadAsync() {
        return Result.success({ progress: structuredClone(initial) });
    },
    async saveAsync() {
        return Result.success({ summary: {} });
    },
});
const calendar = { today: () => '2026-11-12', yesterday: () => '2026-11-11', now: () => 1 };
const noTimer = { setTimeout: () => 0, clearTimeout: () => {} };

async function serviceWith(initial = {}) {
    const service = new ProgressService(repo(initial), CURRICULUM, calendar, noTimer);
    await service.loadAsync();
    return service;
}

test('언어마다 기본 스타일: C · C++ Allman, Java K&R, Python PEP 8', () => {
    // Given / When / Then
    assert.deepEqual(LANGUAGE_CODE_STYLES, { c: 'allman', cpp: 'allman', java: 'knr', python: 'pep8' });
    assert.deepEqual(DEFAULT_SETTINGS.codeStyles, {});
    assert.equal(codeStyleFor({}, 'c'), 'allman');
    assert.equal(codeStyleFor({}, 'java'), 'knr');
    assert.equal(codeStyleFor({ python: 'allman' }, 'python'), 'pep8');
    assert.equal(codeStyleFor({ java: 'allman' }, 'java'), 'allman');
    assert.equal(codeStyleFor({ c: 'gnu' }, 'c'), 'allman');
});

test('mapper: 언어별 값은 allman · knr 만 남기고, 예전 한 가지 값(codeStyle)은 C · C++ 로 옮긴다', () => {
    // Given / When / Then
    assert.deepEqual(progressFromDto({}).settings.codeStyles, {});
    assert.deepEqual(progressFromDto({ settings: { codeStyles: { c: 'knr', java: 'allman', python: 'knr', go: 'knr' } } }).settings.codeStyles, { c: 'knr', java: 'allman' });
    assert.deepEqual(progressFromDto({ settings: { codeStyle: 'knr' } }).settings.codeStyles, { c: 'knr', cpp: 'knr' });
    assert.deepEqual(progressFromDto({ settings: { codeStyles: 'x', codeStyle: 42 } }).settings.codeStyles, {});
});

test('처음 틀은 그 언어의 스타일로 나온다 (C 는 Allman, 고른 사람은 K&R)', async () => {
    // Given
    const allman = await serviceWith();
    const knr = await serviceWith({ settings: { codeStyles: { c: 'knr' } } });

    // When / Then
    assert.match(allman.codeOf(1001), /int main\(\)\n\{/);
    assert.match(knr.codeOf(1001), /int main\(\) \{/);
});

test('직접 쓴 코드는 스타일 설정과 상관없이 쓴 그대로 돌려준다', async () => {
    // Given
    const service = await serviceWith({ code: { 1001: 'int main() {\n    return 0;\n}' } });

    // When / Then
    assert.equal(service.codeOf(1001), 'int main() {\n    return 0;\n}');
});

test('fenceLanguageOf: 글 속 ``` 코드 상자 꼬리표로 언어를 고른다 (꼬리표 없으면 C, 모르는 건 null = 그대로)', () => {
    // Given / When / Then
    assert.equal(fenceLanguageOf(''), 'c');
    assert.equal(fenceLanguageOf('C'), 'c');
    assert.equal(fenceLanguageOf('c++'), 'cpp');
    assert.equal(fenceLanguageOf('cpp'), 'cpp');
    assert.equal(fenceLanguageOf('java'), 'java');
    assert.equal(fenceLanguageOf('python'), 'python');
    assert.equal(fenceLanguageOf('py'), 'python');
    assert.equal(fenceLanguageOf('text'), null);
    assert.equal(fenceLanguageOf(undefined), 'c');
});

test('손대지 않은 처음 틀이 예전 K&R 모양으로 저장돼 있으면 지금 스타일(Allman) 틀로 보여 준다', async () => {
    // Given: 예전 기본 틀 그대로 저장된 상태 (글자는 하나도 안 씀)
    const oldTemplate = '#include <stdio.h>\n\nint main() {\n    \n    return 0;\n}\n';
    const service = await serviceWith({ code: { 1001: oldTemplate } });

    // When
    const code = service.codeOf(1001);

    // Then
    assert.match(code, /int main\(\)\n\{/);
    assert.equal(code, service.templateOf('c'));
});

test('styleSnippet: 설명 · 퀴즈 예시 코드는 C 스타일로, Python 은 그대로', async () => {
    // Given
    const allman = await serviceWith();
    const knr = await serviceWith({ settings: { codeStyles: { c: 'knr' } } });
    const sample = 'int main() {\n    if (1) {\n        return 0;\n    }\n}';

    // When / Then
    assert.equal(allman.styleSnippet(sample), 'int main()\n{\n    if (1)\n    {\n        return 0;\n    }\n}');
    assert.equal(knr.styleSnippet(sample), sample);
    assert.equal(allman.styleSnippet('d = {1: 2}', 'python'), 'd = {1: 2}');
    assert.equal(allman.styleSnippet(''), '');
});

test('applyCodeStyle: 그 언어 스타일만 바꿔 기억한다 (다른 언어는 그대로)', async () => {
    // Given
    const service = await serviceWith();

    // When
    const styled = service.applyCodeStyle('class A {\n}', 'allman', 'java');

    // Then
    assert.equal(styled, 'class A\n{\n}');
    assert.equal(service.styleOf('java'), 'allman');
    assert.equal(service.styleOf('c'), 'allman');
    assert.equal(service.styleOf('cpp'), 'allman');
    assert.equal(service.styleOf('python'), 'pep8');
});

test('restyleCode: 지금 코드를 고른 스타일로 바꿔 저장하고, 그 언어 설정도 바꾼다', async () => {
    // Given
    const service = await serviceWith({ code: { 1001: 'int main()\n{\n    return 0;\n}' } });

    // When
    const styled = service.restyleCode(1001, 'int main()\n{\n    return 0;\n}', 'knr');

    // Then
    assert.equal(styled, 'int main() {\n    return 0;\n}');
    assert.equal(service.codeOf(1001), styled);
    assert.equal(service.styleOf('c'), 'knr');
});
