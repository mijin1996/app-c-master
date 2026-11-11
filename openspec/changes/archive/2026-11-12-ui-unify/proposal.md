# 화면 통일과 커뮤니티 손보기 (2026-11-12, 끝남)

## 왜
- 배경 · 토글 · 좋아요 · 목록 모양이 화면마다 달라 한 사이트처럼 보이지 않았다.
- 설명창의 C 예시 코드가 K&R 이라 Allman 으로 통일한 문제 틀과 달랐다.
- 위 시계에 해 뜨고 지는 시각까지 있어 복잡했고, 한국 도시만 고를 수 있었다.

## 무엇을
- 배경: 글자 글리치 (사이트 색) — `ui/letter-glitch.js`
- 시계: 24시간제 시간만, 기본은 이 기기 시간대, 설정에서 나라 고르기 — `domain/time-zones.js`, `ui/sky.js`
- 모든 토글: 흰 글자 버튼 + "앱처럼 써 봐요" 카드 창 — `ui/picker.js`, `ui/scroll-stack.js`
- 좋아요: Peek Rating 스타일 하트 — `ui/like-heart.js`
- 커뮤니티 목록: Swipe Row 스타일 줄 (보관함 없음, 지우기는 4초 되돌리기) — `ui/swipe-row.js`
- 예시 코드: 고른 중괄호 스타일로 — `ProgressService.styleSnippet`
- 정리: 겹친 코드를 한곳으로 (`views/view-helpers.js`, `mappers/mapper-utils.js`, `server/http/outbound-failures.js`, `problemStatusOf`, `applyCodeStyle`)

## 바뀐 명세
- `openspec/specs/ambience/spec.md`, `openspec/specs/community/spec.md`, `openspec/specs/i18n/spec.md`
