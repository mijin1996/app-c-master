# 설계

## 객체지향 섹션
- 원본: `content/oop.cjs` (레슨 배열). C 채점이 없으니 gcc 없이 `node tools/build-oop.mjs` 로 검사 · 생성한다.
  - 검사: 레슨 번호 1..N 연속, 문항 5개, 보기 2~4개, 정답 번호가 보기 안, 해설 · 설명 비어 있지 않음.
  - 생성: `public/data/oop.json`(화면용 전체), `public/js/domain/oop-curriculum.js`(서버 · 화면 공용 레슨 번호 목록).
- 계층
  - domain `oop-rules.js`: `oopQuizXp(best)`, `computeOopXp(oopQuiz, lessons)`, `isOopLessonNo` — 순수 함수.
  - domain `progress-model.js`: `oopQuiz: {}` 추가. mapper가 레슨 번호(1~99) · 점수(0~5)만 남긴다.
  - domain `progress-rules.js`: `computeXp` 가 `computeOopXp` 를 더한다 (서버도 같은 함수 → 화면 값을 믿지 않음).
  - mapper `oop-content-mapper.js`: DTO → 레슨 모델 (이상한 값 걸러 냄).
  - datasource `StaticContentDataSource.loadOopAsync()` → repository `ContentRepository.loadOopAsync()` (Result).
  - service `ProgressService.recordOopQuiz(lessonNo, score)`: 최고 점수만, 얻은 XP · 레벨 업 이벤트 돌려줌.
  - view `oop-view.js`: `#oop`(레슨 목록), `#oop3`(설명 → 퀴즈 → 결과).
- 테스트: 규칙 · mapper · service · 콘텐츠 검사기 · 서버 경험치 재계산.

## 새총 버튼
- `ui/sling-math.js`: 순수 계산 — 당긴 거리 → 발사 방향 · 세기(`launchOf`), 입자 만들기(`burstParticles`, 랜덤 주입).
- `ui/effects.js` `installSlingButtons()`: 버튼을 누르고 끌면 버튼이 끈 쪽으로 살짝 끌려가고(최대 거리 제한), 놓으면 반대쪽으로 튕기며 스프링으로 돌아오고, 발사 방향 부채꼴로 입자가 날아간다. 그냥 탭하면 위쪽으로 작은 발사. 움직임 줄이기 설정이면 아무 움직임 없음.
- 버튼 위에서는 화면 클릭 불꽃을 끄고 새총만 보인다 (겹치면 시끄러움).
- Vue Bits 코드를 옮기지 않고 바닐라 JS로 새로 만든다.
