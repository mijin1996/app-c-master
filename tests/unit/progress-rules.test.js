// 진도 규칙(경험치·레벨·단원 클리어·코디 진화) 테스트
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    xpForSolve, levelOf, computeXp, isChapterCleared, chapterState, formOf, summarize,
    SOLVE_LIMIT_SEC, XP_BY_LEVEL,
} from '../../public/js/domain/progress-rules.js';
import { CURRICULUM } from '../../public/js/domain/curriculum.js';
import { createEmptyProgress } from '../../public/js/domain/progress-model.js';

function solveChapter(progress, chapterNo, quizScore) {
    const chapter = CURRICULUM.find((c) => c.chapter === chapterNo);
    for (const p of chapter.problems) {
        progress.solved[p.id] = { at: 1, tries: 1, time: 10, late: false };
    }
    progress.quiz[chapterNo] = quizScore;
}

test('제한 시간 안에 풀면 경험치를 모두 받는다', () => {
    // Given: ★★ 문제를 제한 시간 딱 맞게 풀었다 (경계값)
    const spent = SOLVE_LIMIT_SEC[2];

    // When
    const xp = xpForSolve(2, spent);

    // Then
    assert.equal(xp, XP_BY_LEVEL[2]);
});

test('제한 시간을 1초라도 넘기면 20%만 받는다', () => {
    assert.equal(xpForSolve(1, SOLVE_LIMIT_SEC[1] + 1), 2);
    assert.equal(xpForSolve(2, SOLVE_LIMIT_SEC[2] + 1), 4);
    assert.equal(xpForSolve(3, SOLVE_LIMIT_SEC[3] + 1), 6);
});

test('레벨은 100XP마다 1씩 오른다', () => {
    assert.equal(levelOf(0), 1);
    assert.equal(levelOf(99), 1);
    assert.equal(levelOf(100), 2);
    assert.equal(levelOf(-5), 1);
});

test('경험치는 푼 문제와 퀴즈 기록으로 다시 계산된다', () => {
    // Given: ★문제 1개(제시간), ★★★문제 1개(늦음), 퀴즈 통과(4점) 1개와 만점 1개
    const progress = createEmptyProgress();
    progress.solved[1001] = { at: 1, tries: 1, time: 30, late: false };
    progress.solved[1032] = { at: 1, tries: 3, time: 9999, late: true };
    progress.quiz[1] = 4;
    progress.quiz[2] = 5;

    // When
    const xp = computeXp(progress, CURRICULUM);

    // Then: 10 + 6 + 10 + 20
    assert.equal(xp, 46);
});

test('없는 문제 번호는 경험치에 포함하지 않는다', () => {
    const progress = createEmptyProgress();
    progress.solved[9999] = { at: 1, tries: 1, time: 1, late: false };

    assert.equal(computeXp(progress, CURRICULUM), 0);
});

test('문제를 다 풀어도 퀴즈가 3점이면 클리어가 아니다', () => {
    const progress = createEmptyProgress();
    solveChapter(progress, 1, 3);

    assert.equal(isChapterCleared(progress, CURRICULUM[0]), false);
    assert.equal(chapterState(progress, CURRICULUM[0]), 'inProgress');
});

test('문제를 다 풀고 퀴즈 4점 이상이면 클리어', () => {
    const progress = createEmptyProgress();
    solveChapter(progress, 1, 4);

    assert.equal(isChapterCleared(progress, CURRICULUM[0]), true);
    assert.equal(chapterState(progress, CURRICULUM[0]), 'cleared');
});

test('아무것도 안 했으면 시작 전', () => {
    assert.equal(chapterState(createEmptyProgress(), CURRICULUM[0]), 'notStarted');
});

test('기초 스테이지(1~4단원)를 클리어하면 코디가 초딩 코더(1단계)가 된다', () => {
    const progress = createEmptyProgress();
    for (let ch = 1; ch <= 4; ch++) {
        solveChapter(progress, ch, 5);
    }

    assert.equal(formOf(progress, CURRICULUM), 1);
});

test('18단원을 모두 클리어하면 C 마스터(4단계)', () => {
    const progress = createEmptyProgress();
    for (const c of CURRICULUM) {
        solveChapter(progress, c.chapter, 5);
    }

    assert.equal(formOf(progress, CURRICULUM), 4);
});

test('요약에는 랭킹과 선생님 화면에 필요한 값만 들어간다', () => {
    // Given
    const progress = createEmptyProgress();
    solveChapter(progress, 1, 5);
    progress.code[1001] = 'int main() { }';

    // When
    const s = summarize(progress, CURRICULUM);

    // Then
    assert.equal(s.solvedCount, 4);
    assert.equal(s.clearedCount, 1);
    assert.equal(s.chapterStates.length, 18);
    assert.equal(s.chapterStates[0], 'cleared');
    assert.equal('code' in s, false);
});
