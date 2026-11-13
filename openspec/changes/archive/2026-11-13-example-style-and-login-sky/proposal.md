# 예시 코드는 언어 관례 스타일 · 로그인 화면 배경 밝기 (2026-11-13, 끝남)

## 왜
- 설명 예시 · 퀴즈 코드 · 모범 답안이 에디터에서 고른 스타일(K&R 등)을 따라 바뀌었다. 의도는 "설명은 언어 관례대로 고정, 풀이 창에서만 고르기".
- 커뮤니티 글 속 코드가 글쓴이가 쓴 모양과 다르게 보였다.
- 배경 밝기(자동 · 낮 · 밤)를 로그인한 뒤 설정 창에서만 고를 수 있었다.

## 무엇을
- `ProgressService.styleSnippet` → `exampleOf`: `LANGUAGE_CODE_STYLES`(C · C++ Allman, Java K&R, Python PEP 8)로 고정
- `map-views.js` · `quiz-view.js` · `problem-view.js` 가 `exampleOf` 를 쓴다
- `community-view.js` `richText`: 코드 상자를 바꾸지 않고 그대로
- `views/sky-switch.js`: 로그인 · 계정 찾기 화면 배경 버튼, 로그인 전 값은 localStorage(`cm-guest-sky`)
- `main.js`: 로그인 전 배경, 로그아웃 때 쓰던 배경 이어받기 · 바로 다시 칠하기
- 사전 `sky.*` (ko · en · zh)
- 원본 콘텐츠도 Allman 으로: `content/chapters-*.cjs`, `content/algorithm*.cjs`, `content/i18n/{en,zh}/chapters-*.cjs` 의 C 예시 · 퀴즈 코드 · 모범 답안 128개 → `build-content` (gcc 대조 490개 일치) · `build-i18n` 다시 생성

## 테스트
- `tests/unit/code-style-setting.test.js` `exampleOf` 테스트로 교체
- `tests/content/brace-style-solutions.test.js`: 원본은 Allman, Allman → K&R → Allman 왕복, K&R 로 바꿔도 같은 출력

## 바뀐 명세
- `openspec/specs/i18n/spec.md`, `openspec/specs/languages/spec.md`, `openspec/specs/ambience/spec.md`
