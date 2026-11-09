// 콘텐츠 검증: 72문제 모범답안이 모두 "맞았습니다", 흔한 실수는 알맞은 판정을 받는다
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JudgeService, Verdict } from '../../public/js/services/judge-service.js';
import { DirectJudgeRunner } from '../../public/js/judge/judge-runners.js';
import { CURRICULUM } from '../../public/js/domain/curriculum.js';

const content = JSON.parse(fs.readFileSync(new URL('../../public/data/content.json', import.meta.url), 'utf8'));
const judge = new JudgeService(new DirectJudgeRunner());
const problems = content.flatMap((c) => c.problems);
const byId = new Map(problems.map((p) => [p.id, p]));

test('18단원, 단원마다 문제 4개와 퀴즈 5문항', () => {
    assert.equal(content.length, 18);
    for (const chapter of content) {
        assert.equal(chapter.problems.length, 4, chapter.ch + '단원 문제 수');
        assert.equal(chapter.quiz.length, 5, chapter.ch + '단원 퀴즈 수');
        for (const q of chapter.quiz) {
            assert.ok(q.answer >= 0 && q.answer < q.options.length, chapter.ch + '단원 퀴즈 정답 번호');
        }
    }
});

test('curriculum.js 가 content.json 과 같은 문제·난이도를 가진다', () => {
    const fromContent = content.map((c) => c.problems.map((p) => p.id + ':' + p.level).join(','));
    const fromCurriculum = CURRICULUM.map((c) => c.problems.map((p) => p.id + ':' + p.level).join(','));
    assert.deepEqual(fromCurriculum, fromContent);
});

for (const problem of problems) {
    test(problem.id + ' ' + problem.title + ' 모범답안은 맞았습니다', async () => {
        const result = await judge.judgeAsync(problem, problem.solution);
        assert.equal(result.verdict, Verdict.AC, JSON.stringify(result).slice(0, 300));
    });
}

test('형식이 다르면 WA, 세미콜론이 빠지면 CE(줄 번호 포함), 무한 반복은 TLE', async () => {
    const p1005 = byId.get(1005);

    const wa = await judge.judgeAsync(p1005, '#include <stdio.h>\nint main() {\n    int a;\n    scanf("%d", &a);\n    printf("당신은 %d 살입니다.\\n", a);\n    return 0;\n}');
    assert.equal(wa.verdict, Verdict.WA);

    const ce = await judge.judgeAsync(p1005, '#include <stdio.h>\nint main() {\n    int a\n    scanf("%d", &a);\n}');
    assert.deepEqual([ce.verdict, ce.line], [Verdict.CE, 3]);

    const tle = await judge.judgeAsync(p1005, '#include <stdio.h>\nint main() {\n    while (1) { }\n}');
    assert.equal(tle.verdict, Verdict.TLE);
});

test('scanf 에 & 를 빠뜨리면 컴파일 단계에서 알려 준다', async () => {
    const result = await judge.judgeAsync(byId.get(1005), '#include <stdio.h>\nint main() {\n    int a;\n    scanf("%d", a);\n    return 0;\n}');

    assert.equal(result.verdict, Verdict.CE);
    assert.match(result.message, /&/);
});

test('파일 출력 문제에서 파일을 안 만들면 missingFile 로 알려 준다', async () => {
    const result = await judge.judgeAsync(byId.get(1070), '#include <stdio.h>\nint main() {\n    return 0;\n}');

    assert.equal(result.verdict, Verdict.WA);
    assert.equal(result.missingFile, true);
});
