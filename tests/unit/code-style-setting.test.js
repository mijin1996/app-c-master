// 설정의 코드 스타일: 기본 Allman, 저장 값 정리, 처음 틀(템플릿)은 고른 스타일로
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Result } from '../../public/js/core/result.js';
import { DEFAULT_SETTINGS } from '../../public/js/domain/progress-model.js';
import { progressFromDto } from '../../public/js/mappers/progress-mapper.js';
import { ProgressService } from '../../public/js/services/progress-service.js';
import { CURRICULUM } from '../../public/js/domain/curriculum.js';

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

test('기본 코드 스타일은 Allman', () => {
    // Given / When / Then
    assert.equal(DEFAULT_SETTINGS.codeStyle, 'allman');
    assert.equal(progressFromDto({}).settings.codeStyle, 'allman');
});

test('mapper: allman · knr 만 남기고, 모르는 값은 Allman 으로', () => {
    // Given / When / Then
    assert.equal(progressFromDto({ settings: { codeStyle: 'knr' } }).settings.codeStyle, 'knr');
    assert.equal(progressFromDto({ settings: { codeStyle: 'gnu' } }).settings.codeStyle, 'allman');
    assert.equal(progressFromDto({ settings: { codeStyle: 42 } }).settings.codeStyle, 'allman');
});

test('아직 코드를 저장하지 않은 문제의 처음 틀은 고른 스타일로 나온다 (Allman: int main() 다음 줄에 {)', async () => {
    // Given
    const allman = await serviceWith();
    const knr = await serviceWith({ settings: { codeStyle: 'knr' } });

    // When
    const a = allman.codeOf(1001);
    const k = knr.codeOf(1001);

    // Then
    assert.match(a, /int main\(\)\n\{/);
    assert.match(k, /int main\(\) \{/);
});

test('직접 쓴 코드는 스타일 설정과 상관없이 쓴 그대로 돌려준다', async () => {
    // Given
    const service = await serviceWith({ code: { 1001: 'int main() {\n    return 0;\n}' } });

    // When / Then
    assert.equal(service.codeOf(1001), 'int main() {\n    return 0;\n}');
});

test('restyleCode: 지금 코드를 고른 스타일로 바꿔 저장하고, 설정도 바꾼다', async () => {
    // Given
    const service = await serviceWith({ code: { 1001: 'int main() {\n    return 0;\n}' } });

    // When
    const styled = service.restyleCode(1001, 'int main() {\n    return 0;\n}', 'allman');

    // Then
    assert.equal(styled, 'int main()\n{\n    return 0;\n}');
    assert.equal(service.codeOf(1001), styled);
    assert.equal(service.progress.settings.codeStyle, 'allman');
});
