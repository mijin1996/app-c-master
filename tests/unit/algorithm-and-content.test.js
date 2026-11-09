// 알고리즘 단계 규칙과 content.json 변환을 확인한다
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    xpForSolve, computeXp, summarize, problemLevelMap, isAlgorithmLevel, SOLVE_LIMIT_SEC, TIER_NAMES,
} from '../../public/js/domain/progress-rules.js';
import { createEmptyProgress } from '../../public/js/domain/progress-model.js';
import { contentFromDto, indexContent } from '../../public/js/mappers/content-mapper.js';

const curriculum = [{ chapter: 1, stage: 0, title: '출력', problems: [{ id: 1001, level: 1 }] }];
const tracks = [{ track: 'bronze', level: 4, problems: [{ id: 5101, level: 4 }] }];

test('알고리즘 단계는 브론즈 40 · 실버 60 · 골드 80 · 플래티넘 100 XP', () => {
    // Given / When
    const xp = [4, 5, 6, 7].map((level) => xpForSolve(level, 0));

    // Then
    assert.deepEqual(xp, [40, 60, 80, 100]);
    assert.deepEqual(Object.values(TIER_NAMES), ['브론즈', '실버', '골드', '플래티넘']);
});

test('알고리즘 문제도 제한 시간 딱 맞게는 전부, 1초 넘기면 20%', () => {
    // Given
    const limit = SOLVE_LIMIT_SEC[7];

    // When / Then
    assert.equal(xpForSolve(7, limit), 100);
    assert.equal(xpForSolve(7, limit + 1), 20);
});

test('문제 번호 → 난이도 표에 단원과 알고리즘 문제가 함께 들어간다', () => {
    // Given / When
    const map = problemLevelMap(curriculum, tracks);

    // Then
    assert.equal(map.get('1001'), 1);
    assert.equal(map.get('5101'), 4);
    assert.equal(isAlgorithmLevel(3), false);
    assert.equal(isAlgorithmLevel(4), true);
});

test('서버가 다시 계산하는 경험치에 실제 알고리즘 문제가 포함된다', () => {
    // Given
    const progress = createEmptyProgress();
    progress.solved['5101'] = { at: 1, tries: 1, time: 10, late: false };
    progress.solved['9999'] = { at: 1, tries: 1, time: 10, late: false }; // 없는 문제는 무시

    // When
    const xp = computeXp(progress, curriculum);
    const summary = summarize(progress, curriculum);

    // Then
    assert.equal(xp, 40);
    assert.equal(summary.algorithmSolvedCount, 1);
    assert.equal(summary.solvedCount, 1);
});

test('content.json 이 예전 배열 모양이어도, 새 모양이어도, 이상해도 받아 준다', () => {
    // Given / When / Then
    assert.deepEqual(contentFromDto([{ ch: 1 }]), { chapters: [{ ch: 1 }], tracks: [] });
    assert.deepEqual(contentFromDto({ chapters: [], tracks: [{ track: 'gold' }] }), { chapters: [], tracks: [{ track: 'gold' }] });
    assert.deepEqual(contentFromDto(null), { chapters: [], tracks: [] });
});

test('색인은 알고리즘 문제를 번호로 찾게 하고, 단원 문제 목록에는 넣지 않는다', () => {
    // Given
    const dto = {
        chapters: [{ ch: 1, problems: [{ id: 1001 }] }],
        tracks: [{ track: 'silver', problems: [{ id: 5201 }] }],
    };

    // When
    const index = indexContent(contentFromDto(dto));

    // Then
    assert.equal(index.byProblem.get(5201).track, 'silver');
    assert.equal(index.byProblem.get(1001).ch, 1);
    assert.deepEqual(index.problems.map((p) => p.id), [1001]);
    assert.ok(index.byTrack.has('silver'));
});
