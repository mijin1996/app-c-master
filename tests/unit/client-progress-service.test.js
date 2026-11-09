// 화면 쪽 진도 Service 테스트 (가짜 Repository로 서버 없이 검사)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Result } from '../../public/js/core/result.js';
import { AppError } from '../../public/js/core/app-error.js';
import { ProgressService, DEFAULT_CODE } from '../../public/js/services/progress-service.js';
import { CURRICULUM } from '../../public/js/domain/curriculum.js';
import { SOLVE_LIMIT_SEC } from '../../public/js/domain/progress-rules.js';

// Mock: 저장 요청을 기록만 하는 가짜 Repository
class MockProgressRepository {
    constructor(initial = {}, failSave = false) {
        this.initial = initial;
        this.failSave = failSave;
        this.saved = [];
    }

    async loadAsync() {
        return Result.success({ progress: structuredClone(this.initial) });
    }

    async saveAsync(progress) {
        this.saved.push(structuredClone(progress));
        return this.failSave ? Result.failure(AppError.NETWORK) : Result.success({ summary: {} });
    }
}

const noTimer = { setTimeout: () => 0, clearTimeout: () => {} };
const DAY = '2026-11-09';

async function createService(initial, repo = new MockProgressRepository(initial)) {
    const service = new ProgressService(repo, CURRICULUM, { today: () => DAY, yesterday: () => '2026-11-08', now: () => 123 }, noTimer);
    await service.loadAsync();
    return { service, repo };
}

test('처음 맞히면 난이도만큼 경험치를 얻는다', async () => {
    // Given
    const { service } = await createService({});

    // When
    const result = service.recordSubmission(1001, 'AC', 'int main() { return 0; }');

    // Then
    assert.equal(result.gainedXp, 10);
    assert.equal(result.late, false);
    assert.equal(service.summary.xp, 10);
});

test('같은 문제를 또 맞히면 경험치를 더 받지 않는다', async () => {
    const { service } = await createService({});
    service.recordSubmission(1001, 'AC', 'code a');

    const again = service.recordSubmission(1001, 'AC', 'code b');

    assert.equal(again.gainedXp, 0);
    assert.equal(service.summary.xp, 10);
});

test('제한 시간을 넘겨 맞히면 20%만 받고 late로 기록된다', async () => {
    const { service } = await createService({ spent: { 1003: SOLVE_LIMIT_SEC[2] + 1 } });

    const result = service.recordSubmission(1003, 'AC', 'code');

    assert.deepEqual([result.gainedXp, result.late], [4, true]);
    assert.equal(service.progress.solved[1003].late, true);
});

test('기본 틀 그대로 낸 제출은 "직접 쓴 제출"로 세지 않는다', async () => {
    const { service } = await createService({});

    service.recordSubmission(1005, 'WA', DEFAULT_CODE);
    service.recordSubmission(1005, 'WA', DEFAULT_CODE.replace('    \n', '    printf("hi");\n'));

    assert.equal(service.progress.tries[1005], 2);
    assert.equal(service.progress.realTries[1005], 1);
    assert.equal(service.progress.wrong[1005], 2);
});

test('모범 답안: 맞혔거나, 시간이 지나고 직접 쓴 코드로 2번 이상 제출해야 열린다', async () => {
    const { service } = await createService({ spent: { 1005: 100 }, realTries: { 1005: 2 } });
    assert.equal(service.canSeeSolution(1005), false);           // 시간이 남음

    service.progress.spent[1005] = SOLVE_LIMIT_SEC[1];           // 경계값: 딱 제한 시간
    assert.equal(service.canSeeSolution(1005), true);

    const { service: s2 } = await createService({ solved: { 1006: { at: 1 } } });
    assert.equal(s2.canSeeSolution(1006), true);                  // 이미 맞힘
});

test('퀴즈: 통과하면 10, 만점이면 10을 더 받고, 낮은 점수는 최고 기록을 덮지 않는다', async () => {
    const { service } = await createService({});

    assert.equal(service.recordQuiz(1, 4).gainedXp, 10);
    assert.equal(service.recordQuiz(1, 5).gainedXp, 10);
    assert.equal(service.recordQuiz(1, 2).gainedXp, 0);
    assert.equal(service.progress.quiz[1], 5);
});

test('단원을 클리어하면 chapterCleared 이벤트, 기초 스테이지를 다 하면 evolvedTo 이벤트', async () => {
    // Given: 1~4단원 문제를 다 풀고 1~3단원 퀴즈만 통과한 상태
    const solved = {};
    for (const c of CURRICULUM.slice(0, 4)) {
        for (const p of c.problems) {
            solved[p.id] = { at: 1, tries: 1, time: 1, late: false };
        }
    }
    const { service } = await createService({ solved, quiz: { 1: 5, 2: 5, 3: 5 } });

    // When: 4단원 퀴즈 통과
    const result = service.recordQuiz(4, 4);

    // Then
    assert.equal(result.events.chapterCleared, 4);
    assert.equal(result.events.evolvedTo, 1);
    service.markFormSeen(1);
    assert.equal(service.recordQuiz(4, 5).events.evolvedTo, null);
});

test('연속 학습일: 어제 했으면 +1, 아니면 1부터', async () => {
    const { service } = await createService({ streak: { last: '2026-11-08', count: 3 } });
    service.recordSubmission(1001, 'WA', 'x');
    assert.deepEqual(service.progress.streak, { last: DAY, count: 4 });

    const { service: s2 } = await createService({ streak: { last: '2026-10-01', count: 9 } });
    s2.recordQuiz(1, 1);
    assert.deepEqual(s2.progress.streak, { last: DAY, count: 1 });
});

test('지금 저장하면 Repository에 진도가 넘어가고, 실패하면 Failure를 돌려준다', async () => {
    const { service, repo } = await createService({});
    service.recordSubmission(1001, 'AC', 'code');

    const ok = await service.flushAsync();
    assert.equal(ok.constructor.name, 'Success');
    assert.equal(repo.saved.length, 1);
    assert.ok(repo.saved[0].solved[1001]);

    const broken = new MockProgressRepository({}, true);
    const { service: s2 } = await createService({}, broken);
    s2.recordQuiz(1, 3);
    assert.equal((await s2.flushAsync()).error, AppError.NETWORK);
});

test('설정을 바꾸면 이상한 값은 정리된다', async () => {
    const { service } = await createService({});

    service.updateSettings({ bgm: true, codyName: '  ', sky: 'night' });

    assert.equal('bgm' in service.progress.settings, false); // 배경음악 설정은 더 이상 없다
    assert.equal(service.progress.settings.codyName, '코디');
    assert.equal(service.progress.settings.sky, 'night');
});
