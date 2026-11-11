# 설계

## 화면 글자
- `public/js/i18n/locale-rules.js` (순수): 지원 언어 `ko · en · zh`, `normalizeLocale`, `pickLocale(navigatorLanguages)`, `interpolate('{n}개', {n})`.
- `public/js/i18n/messages-ko.js · messages-en.js · messages-zh.js`: 평평한 키 → 문장 사전. 한국어가 기준(빠진 키는 한국어로 대신 보여 줌).
- `public/js/i18n/i18n.js`: 지금 언어 하나를 들고 있는 작은 모듈 — `t(key, vars)`, `setLocale`, `getLocale`, `onLocaleChange`. 고른 언어는 localStorage(`cm-lang`, 이 브라우저만)에 저장.
- `core/app-error.js` 의 `messageOf` 도 `t('error.X')` 를 쓴다 (서버는 코드만 보냄).
- 테스트: 세 사전의 키가 똑같은지, `{자리}` 표시가 똑같은지, 영어 · 중국어 사전에 한글이 없는지.

## 학습 내용
- 원본(한국어)은 그대로. 번역은 `content/i18n/<언어>/*.cjs` 에 "덮어쓸 글자만" 번호로 적는다.
  - 단원: `{ [ch]: { title, points[], problems: { [id]: { title, desc, input, output, hints[] } }, quiz: [{ q, options[], explain }] } }`
  - 알고리즘: `{ [track]: { name, intro, topics[], problems: { [id]: {...} } } }`
  - 객체지향: `{ [no]: { title, tag, story[], points[], exampleTitle, exampleCode?, quiz[], practice[{ prompt, hint, explain, blankHints[] }] } }`
- `tools/build-i18n.mjs`: 이미 만들어진 `public/data/content.json · oop.json` 위에 번역을 덮어 `content.en.json · content.zh.json · oop.en.json · oop.zh.json` 을 만든다 (gcc 필요 없음).
- 검사기(`tools/i18n-validate.mjs`): 빠진 글자 0개, 배열 길이(보기 수 · 힌트 수 · 문항 수) 같음, 번역에 남은 한글은 그 문제의 코드 · 테스트 · 정답 출력에 실제로 있는 글자만 허용.
- 화면은 지금 언어의 파일을 불러오고, 언어를 바꾸면 그 언어 파일을 (한 번만) 받아 다시 그린다.
