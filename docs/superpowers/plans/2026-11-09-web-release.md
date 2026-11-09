# 구현 계획: 웹사이트 정식 버전

각 작업은 테스트를 먼저 쓰고(RED) 통과시킨 뒤(GREEN) 정리(REFACTOR)한다. 작업이 끝날 때마다 `npm test`.

| # | 작업 | 파일 | 확인 방법 | 상태 |
|---|---|---|---|---|
| 1 | 인터프리터 ES 모듈화 | public/js/judge/c-interpreter.js | `1+2` 출력 | 완료 |
| 2 | 콘텐츠 빌드 | tools/build-content.mjs | gcc 대조 242/242 | 완료 |
| 3 | 진도 규칙 | public/js/domain/progress-rules.js | tests/unit/progress-rules.test.js (11) | 완료 |
| 4 | 입력 규칙·Mapper | domain/account-rules.js, mappers/progress-mapper.js | tests/unit/account-rules-and-mapper.test.js (7) | 완료 |
| 5 | D1 스키마 | migrations/0001_init.sql | 가짜 D1에 적용 | 완료 |
| 6 | 서버 계층 | server/** | tests/server/auth-service.test.js (11), progress-ranking-hint.test.js (9) | 완료 |
| 7 | API | server/http/endpoints.js, functions/api/** | tests/server/endpoints.test.js (6) | 완료 |
| 8 | 화면 진도 Service | public/js/services/progress-service.js | tests/unit/client-progress-service.test.js (10) | 완료 |
| 9 | 채점 | judge-runners.js, judge-service.js | tests/content/solutions.test.js (77) | 완료 |
| 10 | 화면 | ui/**, views/**, router.js, main.js | 개발 서버 + 브라우저 전체 흐름 | 완료 |
| 11 | 문서 | README, AGENTS.md, docs/**, openspec/** | 링크·내용 확인 | 완료 |
| 12 | 배포 | GitHub, Cloudflare | pages.dev 접속 | 사용자 진행 |
| 13 | 픽셀아트 코디 | public/assets/cody/* , ui/cody.js | 화면 확인 | 이미지 대기 |
