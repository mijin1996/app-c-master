# Tasks: web-release

## 1. 기반
- [x] 1.1 인터프리터를 ES 모듈로 변환
- [x] 1.2 콘텐츠 빌드 도구 (gcc 대조, curriculum.js 생성)
- [x] 1.3 core: Result, AppError

## 2. 도메인 (테스트 먼저)
- [x] 2.1 progress-rules 테스트 → 구현 (경험치, 레벨, 클리어, 진화, 요약)
- [x] 2.2 account-rules, progress-mapper 테스트 → 구현

## 3. 서버
- [x] 3.1 D1 마이그레이션
- [x] 3.2 security: PBKDF2, 비밀값 생성
- [x] 3.3 datasources / repositories / services (auth, progress, ranking, teacher, hint)
- [x] 3.4 http 도우미, endpoints, functions 연결 파일
- [x] 3.5 서버 테스트 (가짜 D1, 가짜 fetch), 엔드포인트 테스트

## 4. 화면
- [x] 4.1 datasources / repositories / services (클라이언트 ProgressService 테스트 먼저)
- [x] 4.2 judge runner + JudgeService, 72문제 모범답안 테스트
- [x] 4.3 ui 모듈 (하늘, 코디, 소리, 에디터) 옮기기
- [x] 4.4 views, router, main.js 조립
- [x] 4.5 로컬 개발 서버로 브라우저 전체 흐름 확인

## 5. 문서·배포
- [x] 5.1 README, AGENTS.md, architecture, deploy 안내
- [x] 5.2 OpenSpec specs, superpowers 설계·계획 문서
- [ ] 5.3 GitHub 푸시, Cloudflare 연결 (사용자 진행)
- [ ] 5.4 픽셀아트 코디 이미지로 교체 (Gemini 이미지 준비 후)
