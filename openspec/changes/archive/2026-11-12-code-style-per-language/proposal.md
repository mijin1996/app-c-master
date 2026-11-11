# 언어마다 코드 스타일 · 화면 정리 (2026-11-12, 끝남)

## 왜
- 몇몇 곳의 예시 코드 틀이 아직 K&R 이었다 (예전에 저장된 손대지 않은 틀, 커뮤니티 글 속 코드 상자).
- 언어마다 많이 쓰는 스타일이 다르다: C · C++ Allman(이 사이트 기본), Java K&R, Python PEP 8.
- 선택 깜빡임이 초록이라 사이트 색(주황 · 노랑)과 어울리지 않았다.
- 내 기록 · 커뮤니티 목록의 글 색이 다른 글과 달랐다.
- 코드 스타일 고르기 창의 "코드 스타일" 글 · 설명, 언어 토글 옆 지구본, 밀기 안내 글은 필요 없었다.
- 폰에서 첫 화면 · 단원 화면이 옆으로 치우쳤다 (작은 입력칸 확대, 긴 예시 코드가 격자 칸을 밀어냄).

## 무엇을
- `domain/brace-style.js`: `LANGUAGE_CODE_STYLES`, `codeStyleFor`, `fenceLanguageOf`, `CodeStyle.PEP8`
- 설정 `codeStyles` (언어마다 기억, 예전 `codeStyle` 은 C · C++ 로 옮김) — `progress-mapper.js`
- `ui/editor-rules.js` `smartEnter`: Enter 를 누르면 그 언어 스타일로 { 자리 · 들여쓰기 · 닫는 } 를 맞춘다
- `ProgressService.codeOf`: 글자 안 쓴 예전 틀은 지금 스타일 틀로
- 커뮤니티 ``` 코드 상자도 꼬리표 언어 스타일로
- 포커스 색 `--focus` 주황 → 노랑 깜빡임, 목록 링크 · Swipe Row 글 색을 사이트 색 변수로
- 고르기 창 `data-picker-quiet`: 제목을 화면에서 숨김 (화면 읽기 프로그램만)
- 폰: 입력칸 16px, `.ch-layout` · `.concept` · `.prob` · `.map-grid` 칸을 `minmax(0, 1fr)`

## 테스트
- `tests/unit/editor-rules.test.js` (8개), `tests/unit/code-style-setting.test.js` (9개) — 전체 392개 통과

## 바뀐 명세
- `openspec/specs/languages/spec.md`, `openspec/specs/ambience/spec.md`, `openspec/specs/i18n/spec.md`
