// 유료 언어 서버 실행: 꺼져 있을 때, 잘못된 요청, Judge0 응답 바꾸기
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CodeRunService } from '../../server/services/code-run-service.js';
import { Judge0JudgeProvider, DisabledJudgeProvider } from '../../server/judge/judge-providers.js';
import { Failure, Success } from '../../public/js/core/result.js';
import { AppError } from '../../public/js/core/app-error.js';

const fakeFetch = (status, body, seen = []) => async (url, init) => {
    seen.push({ url, body: JSON.parse(init.body), headers: init.headers });
    return { ok: status >= 200 && status < 300, status, json: async () => body };
};

test('기능이 꺼져 있으면 FEATURE_DISABLED', async () => {
    const service = new CodeRunService(new DisabledJudgeProvider(), false);
    const result = await service.runAsync({ language: 'cpp', src: 'int main(){}', input: '' });
    assert.ok(result instanceof Failure);
    assert.equal(result.error, AppError.FEATURE_DISABLED);
});

test('브라우저 언어(C·Python)나 빈 코드는 서버 실행 요청으로 받지 않는다', async () => {
    const service = new CodeRunService(new DisabledJudgeProvider(), true);
    for (const request of [{ language: 'c', src: 'x' }, { language: 'python', src: 'x' }, { language: 'cpp', src: '' }, null]) {
        const result = await service.runAsync(request);
        assert.equal(result.error, AppError.INVALID_RUN_REQUEST);
    }
});

test('Judge0 성공 응답은 출력으로, 컴파일 에러는 compile 로 바꾼다', async () => {
    // Given
    const seen = [];
    const ok = new Judge0JudgeProvider('https://judge.test/', 'tok', fakeFetch(201, { status: { id: 3 }, stdout: '7\n' }, seen));
    const ce = new Judge0JudgeProvider('https://judge.test', '', fakeFetch(201, { status: { id: 6 }, compile_output: 'error: expected ;' }));

    // When
    const a = await ok.runAsync('cpp', 'src', '3 4\n');
    const b = await ce.runAsync('java', 'src', '');

    // Then
    assert.ok(a instanceof Success);
    assert.deepEqual(a.data, { ok: true, output: '7\n', files: {} });
    assert.equal(seen[0].url, 'https://judge.test/submissions?base64_encoded=false&wait=true');
    assert.equal(seen[0].body.language_id, 54);
    assert.equal(seen[0].headers['X-Auth-Token'], 'tok');
    assert.equal(b.data.kind, 'compile');
});

test('Judge0 서버 오류는 SERVER, 연결 실패는 NETWORK', async () => {
    const down = new Judge0JudgeProvider('https://judge.test', '', fakeFetch(500, {}));
    const broken = new Judge0JudgeProvider('https://judge.test', '', async () => {
        throw new Error('offline');
    });
    assert.equal((await down.runAsync('cpp', 's', '')).error, AppError.SERVER);
    assert.equal((await broken.runAsync('cpp', 's', '')).error, AppError.NETWORK);
});
