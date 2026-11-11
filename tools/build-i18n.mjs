// 학습 내용 번역 파일 만들기 (gcc 필요 없음). 한국어 원본(이미 빌드된 content.json · oop.json) 위에
// content/i18n/<언어>/{chapters,algorithm,oop}.cjs 의 번역 글자를 덮어 아래 파일을 만든다.
//   public/data/content.<언어>.json , public/data/oop.<언어>.json
// 사용법: node tools/build-i18n.mjs   (문제가 있으면 목록을 보여 주고 실패로 끝난다)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { overlayContent, overlayOop } from './i18n-overlay.mjs';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES = ['en', 'zh'];
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const load = (locale, name) => {
    const file = path.join(root, 'content/i18n', locale, name + '.cjs');
    return fs.existsSync(file) ? require(file) : {};
};

const content = readJson('public/data/content.json');
const oop = readJson('public/data/oop.json');
let failed = false;
for (const locale of LOCALES) {
    const built = overlayContent(content, { chapters: load(locale, 'chapters'), tracks: load(locale, 'algorithm') });
    const lessons = overlayOop(oop.lessons, load(locale, 'oop'));
    const errors = [...built.errors, ...lessons.errors];
    if (errors.length) {
        failed = true;
        console.error('[' + locale + '] 문제 ' + errors.length + '개');
        errors.slice(0, 60).forEach((e) => console.error('  ' + e));
        continue;
    }
    fs.writeFileSync(path.join(root, 'public/data/content.' + locale + '.json'), JSON.stringify(built.result));
    fs.writeFileSync(path.join(root, 'public/data/oop.' + locale + '.json'), JSON.stringify({ lessons: lessons.result }));
    console.log('[' + locale + '] 단원 ' + built.result.chapters.length + ' · 알고리즘 ' + built.result.tracks.length + '단계 · 객체지향 ' + lessons.result.length + '레슨 완료');
}
if (failed) {
    process.exit(1);
}
