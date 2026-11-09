// 객체지향 레슨 원본(content/oop.cjs)을 검사하고 아래 두 파일을 만든다. gcc 가 필요 없다.
//   public/data/oop.json               : 화면에서 쓰는 레슨 · 퀴즈 전체
//   public/js/domain/oop-curriculum.js : 서버 · 화면이 함께 쓰는 레슨 번호 · 제목 (경험치 재계산용)
// 사용법: node tools/build-oop.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { validateLessons } from './oop-validate.mjs';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lessons = require(path.join(root, 'content/oop.cjs'));

const errors = validateLessons(lessons);
if (errors.length > 0) {
    errors.forEach((e) => console.error(e));
    process.exit(1);
}

fs.writeFileSync(path.join(root, 'public/data/oop.json'), JSON.stringify({ lessons }));
fs.writeFileSync(path.join(root, 'public/js/domain/oop-curriculum.js'),
    '// tools/build-oop.mjs 가 만든 파일입니다. 직접 고치지 마세요.\n' +
    '// 서버와 화면이 함께 쓰는 객체지향 레슨 번호 목록\n' +
    'export const OOP_LESSONS = Object.freeze(' + JSON.stringify(lessons.map((l) => ({ no: l.no, title: l.title, practice: l.practice.length })), null, 4) + ');\n');

console.log('객체지향 레슨', lessons.length, '개, 문항', lessons.reduce((n, l) => n + l.quiz.length, 0), '개 확인');
