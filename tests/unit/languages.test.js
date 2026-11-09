// 풀이 언어 규칙, 언어별 코드 저장, 언어별 채점기 고르기, Python 채점 도우미
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { LANGUAGES, LanguageId, isLanguageAvailable, codeKey, languageOf } from '../../public/js/domain/languages.js';
import { progressFromDto } from '../../public/js/mappers/progress-mapper.js';
import { JudgeService, Verdict } from '../../public/js/services/judge-service.js';
import { DirectJudgeRunner, ServerJudgeRunner } from '../../public/js/judge/judge-runners.js';
import { Result } from '../../public/js/core/result.js';
import { AppError } from '../../public/js/core/app-error.js';

test('C·Python은 무료로 바로 쓰고, C++·Java는 유료 언어가 켜졌을 때만 쓴다', () => {
    // Given
    const off = { paidLanguages: false };
    const on = { paidLanguages: true };

    // When / Then
    assert.deepEqual(LANGUAGES.map((l) => l.id), ['c', 'python', 'cpp', 'java']);
    assert.equal(isLanguageAvailable('python', off), true);
    assert.equal(isLanguageAvailable('cpp', off), false);
    assert.equal(isLanguageAvailable('java', on), true);
    assert.equal(isLanguageAvailable('ruby', on), false);
});

test('코드 저장 칸: C는 예전처럼 번호만, 다른 언어는 "번호:언어"', () => {
    assert.equal(codeKey(5101, LanguageId.C), '5101');
    assert.equal(codeKey(5101, LanguageId.PYTHON), '5101:python');
});

test('진도 정리기는 언어별 코드와 고른 언어를 남기고, 이상한 값은 버린다', () => {
    // Given
    const dto = {
        code: { '5101': 'int main(){}', '5101:python': 'print(1)', '5101:ruby': 'puts 1', 'abc': 'x' },
        settings: { algoLang: 'python' },
    };

    // When
    const progress = progressFromDto(dto);
    const bad = progressFromDto({ settings: { algoLang: 'ruby' } });

    // Then
    assert.deepEqual(Object.keys(progress.code).sort(), ['5101', '5101:python']);
    assert.equal(progress.settings.algoLang, 'python');
    assert.equal(bad.settings.algoLang, 'c');
});

test('채점 서비스는 언어에 맞는 실행기를 고르고, 없는 언어는 거절한다', async () => {
    // Given
    const calls = [];
    const fake = (name) => ({ runAsync: async (src) => {
        calls.push(name);
        return { ok: true, output: src };
    } });
    const judge = new JudgeService({ c: fake('c'), python: fake('python') });
    const problem = { tests: ['', ''], expected: [{ out: 'hi' }, { out: 'hi' }] };

    // When
    const result = await judge.judgeAsync(problem, 'hi', 'python');

    // Then
    assert.equal(result.verdict, Verdict.AC);
    assert.deepEqual(calls, ['python', 'python']);
    assert.equal(judge.supports('java'), false);
    await assert.rejects(() => judge.judgeAsync(problem, 'hi', 'java'));
});

test('실행기 하나만 주면 예전처럼 C 실행기로 쓴다', async () => {
    // Given
    const judge = new JudgeService(new DirectJudgeRunner());

    // When
    const run = await judge.runAsync('#include <stdio.h>\nint main() {\n    printf("ok");\n    return 0;\n}', '', {});

    // Then
    assert.equal(run.output, 'ok');
});

test('서버 채점기는 서버가 꺼져 있으면 "준비 중" 안내를 실행 실패로 돌려준다', async () => {
    // Given
    const repository = { runAsync: async () => Result.failure(AppError.FEATURE_DISABLED) };
    const runner = new ServerJudgeRunner(repository, 'cpp');

    // When
    const run = await runner.runAsync('int main(){}', '');

    // Then
    assert.equal(run.ok, false);
    assert.match(run.message, /준비 중/);
});

function hasPython() {
    try {
        execFileSync('python3', ['--version']);
        return true;
    } catch (e) {
        return false;
    }
}

const HARNESS = fs.readFileSync(new URL('../../public/js/judge/python-harness.py', import.meta.url), 'utf8');

/** 브라우저 속 Pyodide 대신 python3 로 같은 채점 도우미를 돌려 본다 */
function runHarness(src, input) {
    const script = HARNESS + '\nimport json, sys as _s\n_src = _s.argv[1]\n_inp = _s.stdin.read()\nprint(json.dumps(cm_run(_src, _inp)))\n';
    return JSON.parse(execFileSync('python3', ['-c', script, src], { input }).toString());
}

test('Python 채점 도우미: 입력을 읽고 출력을 모은다', { skip: !hasPython() && 'python3 없음' }, () => {
    const result = runHarness('a, b = map(int, input().split())\nprint(a + b)\n', '3 4\n');
    assert.deepEqual([result.ok, result.output], [true, '7\n']);
});

test('Python 채점 도우미: 문법 오류는 줄 번호와 함께 컴파일 에러', { skip: !hasPython() && 'python3 없음' }, () => {
    const result = runHarness('x = 1\nif x\n    print(x)\n', '');
    assert.equal(result.kind, 'compile');
    assert.equal(result.line, 2);
});

test('Python 채점 도우미: 실행 중 오류는 학생 코드의 줄 번호를 알려 준다', { skip: !hasPython() && 'python3 없음' }, () => {
    const result = runHarness('a = [1, 2]\n\nprint(a[5])\n', '');
    assert.equal(result.kind, 'runtime');
    assert.equal(result.line, 3);
    assert.match(result.message, /IndexError/);
});

test('Python 채점 도우미: 너무 많이 출력하면 출력 초과', { skip: !hasPython() && 'python3 없음' }, () => {
    const result = runHarness('while True:\n    print("x" * 1000)\n', '');
    assert.equal(result.kind, 'ole');
});

test('Python 기본 틀은 입력 읽기 한 줄을 미리 넣어 둔다', () => {
    assert.match(languageOf('python').template, /sys\.stdin\.readline/);
});
