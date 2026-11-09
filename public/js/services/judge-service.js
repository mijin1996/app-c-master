// Service: 채점 규칙. 숨은 테스트를 차례로 돌려 기대 출력과 비교한다.
// 줄 끝 공백과 마지막 줄바꿈은 무시하고, 나머지는 정확히 같아야 한다.

export const Verdict = Object.freeze({
    AC: 'AC',   // 맞았습니다
    WA: 'WA',   // 틀렸습니다
    CE: 'CE',   // 컴파일 에러
    RE: 'RE',   // 런타임 에러
    TLE: 'TLE', // 시간 초과
    OLE: 'OLE', // 출력 초과
});

export const VerdictLabel = Object.freeze({
    AC: '맞았습니다!!',
    WA: '틀렸습니다',
    CE: '컴파일 에러',
    RE: '런타임 에러',
    TLE: '시간 초과',
    OLE: '출력 초과',
});

const VERDICT_BY_KIND = Object.freeze({ compile: 'CE', runtime: 'RE', tle: 'TLE', ole: 'OLE', internal: 'RE' });

export function normalizeOutput(text) {
    return String(text ?? '').replace(/\r/g, '').split('\n').map((l) => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '');
}

export function testCaseOf(test) {
    return typeof test === 'string' ? { input: test, files: {} } : { input: test.input ?? '', files: test.files ?? {} };
}

export class JudgeService {
    #runners;

    /**
     * @param {object} runners 언어별 실행기 { c, python, cpp, java } — 실행기 하나만 주면 C 실행기로 쓴다.
     *   실행기는 runAsync(src, input, files) => Promise<{ok, output, kind?, message?, line?}> 모양이면 된다 (OCP: 언어 추가 시 여기만 늘림)
     */
    constructor(runners) {
        this.#runners = typeof runners?.runAsync === 'function' ? { c: runners } : { ...runners };
    }

    #runnerOf(language) {
        const runner = this.#runners[language];
        if (!runner) {
            throw new Error('지원하지 않는 언어: ' + language);
        }
        return runner;
    }

    supports(language) {
        return Boolean(this.#runners[language]);
    }

    /** Python처럼 처음 준비가 필요한 실행기를 미리 깨운다 */
    async prepareAsync(language) {
        const runner = this.#runners[language];
        if (runner && typeof runner.prepareAsync === 'function') {
            await runner.prepareAsync();
        }
    }

    /** 제출: 모든 테스트를 통과해야 AC */
    async judgeAsync(problem, code, language = 'c') {
        const runner = this.#runnerOf(language);
        for (let i = 0; i < problem.tests.length; i++) {
            const testCase = testCaseOf(problem.tests[i]);
            const run = await runner.runAsync(code, testCase.input, testCase.files);
            if (!run.ok) {
                const verdict = VERDICT_BY_KIND[run.kind] ?? Verdict.RE;
                return { verdict, label: VerdictLabel[verdict], message: run.message, line: run.line ?? 0, testIndex: i, testCase, got: run.output ?? '' };
            }
            const got = problem.judge ? (run.files?.[problem.judge] ?? '') : run.output;
            const expected = problem.expected[i].out;
            if (normalizeOutput(got) !== normalizeOutput(expected)) {
                return {
                    verdict: Verdict.WA,
                    label: VerdictLabel.WA,
                    testIndex: i,
                    testCase,
                    got,
                    expected,
                    missingFile: Boolean(problem.judge) && run.files?.[problem.judge] === undefined,
                };
            }
        }
        return { verdict: Verdict.AC, label: VerdictLabel.AC };
    }

    /** 예제 실행 / 직접 입력 실행 (기록하지 않음) */
    runAsync(code, input, files, language = 'c') {
        return this.#runnerOf(language).runAsync(code, input, files);
    }
}
