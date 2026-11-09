// 문제 원본(content/*.cjs) → 모범답안을 gcc로 실행해 기대 출력을 만들고,
// 브라우저용 인터프리터 결과와 대조한 뒤 아래 두 파일을 만든다.
//   public/data/content.json        : 화면에서 쓰는 전체 콘텐츠
//   public/js/domain/curriculum.js  : 서버·화면이 함께 쓰는 단원/문제 목록(난이도)
// 사용법: node tools/build-content.mjs   (gcc 필요)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { execute } from '../public/js/judge/c-interpreter.js';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const chapters = [
    ...require(path.join(root, 'content/chapters-01-09.cjs')),
    ...require(path.join(root, 'content/chapters-10-18.cjs')),
];
const tracks = require(path.join(root, 'content/algorithm.cjs'));

const normalize = (s) => s.replace(/\r/g, '').split('\n').map((l) => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-build-'));
let checked = 0;
let mismatches = 0;

const SLOW_MS = 2000; // 브라우저 인터프리터가 이보다 오래 걸리면 경고 (실제 제한은 3초)
for (const chapter of [...chapters, ...tracks]) {
    for (const problem of chapter.problems) {
        const dir = path.join(tmp, String(problem.id));
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'main.c'), problem.solution);
        execFileSync('gcc', ['-std=c11', '-O0', '-w', '-o', path.join(dir, 'main'), path.join(dir, 'main.c'), '-lm']);
        problem.expected = problem.tests.map((test, index) => {
            const input = typeof test === 'string' ? test : (test.input || '');
            const files = typeof test === 'string' ? {} : (test.files || {});
            const runDir = path.join(dir, 'run' + index);
            fs.mkdirSync(runDir, { recursive: true });
            for (const name of Object.keys(files)) {
                fs.writeFileSync(path.join(runDir, name), files[name]);
            }
            const screen = execFileSync(path.join(dir, 'main'), { cwd: runDir, input }).toString();
            const out = problem.judge ? fs.readFileSync(path.join(runDir, problem.judge), 'utf8') : screen;
            const started = Date.now();
            const mine = execute(problem.solution, { input, files });
            const took = Date.now() - started;
            if (took > SLOW_MS) {
                console.error('느림', problem.id, '테스트', index, took + 'ms');
            }
            const mineOut = mine.ok ? (problem.judge ? (mine.files[problem.judge] || '') : mine.output) : 'ERR ' + mine.message;
            checked++;
            if (normalize(mineOut) !== normalize(out)) {
                mismatches++;
                console.error('불일치', problem.id, '테스트', index);
            }
            return problem.judge ? { out, screen } : { out };
        });
    }
}

fs.writeFileSync(path.join(root, 'public/data/content.json'), JSON.stringify({ chapters, tracks }));

const curriculum = chapters.map((c) => ({
    chapter: c.ch,
    stage: c.stage,
    title: c.title,
    problems: c.problems.map((p) => ({ id: p.id, level: p.level })),
}));
fs.writeFileSync(path.join(root, 'public/js/domain/curriculum.js'),
    '// tools/build-content.mjs 가 만든 파일입니다. 직접 고치지 마세요.\n' +
    '// 서버와 화면이 함께 쓰는 단원·문제 목록 (난이도 1~3)\n' +
    'export const CURRICULUM = Object.freeze(' + JSON.stringify(curriculum, null, 4) + ');\n\n' +
    '// 알고리즘 단계 (브론즈 4 · 실버 5 · 골드 6 · 플래티넘 7). 단원 클리어·진화에는 들어가지 않는다\n' +
    'export const ALGORITHM_TRACKS = Object.freeze(' + JSON.stringify(tracks.map((t) => ({ track: t.track, name: t.name, level: t.level, problems: t.problems.map((p) => ({ id: p.id, level: p.level })) })), null, 4) + ');\n');

console.log('테스트', checked, '개 확인, 불일치', mismatches, '개');
if (mismatches > 0) {
    process.exit(1);
}
