# 설계
- `ui/effects.js`: `installClickSpark` (화면 전체 캔버스 1장, 누를 때만 그림), `installFuseButtons` (문서 전체 pointerdown 위임 → 버튼에 SVG 테두리를 잠깐 붙임), `makeFuseUndoButton`, `showLevelUpOverlay`.
- 초록 빛은 CSS `:focus-within` 만 사용 (자바스크립트 없음). 움직임 줄이기 설정이면 깜빡임 없이 고정된 빛.
- Vue Bits 코드는 쓰지 않고 효과만 참고, 출처 창에 기록.
