# 설계

- 난이도 숫자를 늘린다: 1~3 은 단원 문제(★), 4~7 은 알고리즘 단계. `XP_BY_LEVEL`, `SOLVE_LIMIT_SEC` 에 4~7 을 추가해 경험치·제한 시간·늦은 풀이 20% 규칙을 그대로 쓴다.
- `content/algorithm.cjs` → `tools/build-content.mjs` 가 gcc 대조 후 `content.json` 을 `{ chapters, tracks }` 로, `curriculum.js` 에 `ALGORITHM_TRACKS` 를 만든다.
- `problemLevelMap(curriculum, tracks)` 가 두 목록을 합쳐 서버가 경험치를 다시 계산할 때도 알고리즘 문제를 센다. 단원 클리어·코디 진화에는 넣지 않는다.
- `mappers/content-mapper.js`: 예전 배열 모양도 받아 주는 `contentFromDto`, 번호 색인 `indexContent`.
- 테크 텍스트는 `ui/tech-text.js` 에 직접 구현 (SVG 글자 + 점선 윤곽, 선택 틀, 크기 표시, 깜빡이는 네모, 저절로 훑기, 움직임 줄이기 설정 존중). vue-bits 코드는 쓰지 않았다.
