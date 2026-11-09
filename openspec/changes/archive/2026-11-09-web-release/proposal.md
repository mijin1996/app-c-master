# 웹사이트 정식 버전 (web-release)

## Why
처음 만든 버전은 claude.ai 아티팩트 안에서만 동작했다. 진도가 claude.ai 계정 공간에 저장돼서 Claude 계정이 없는 학생은 쓸 수 없었다.
누구나 접속하는 실제 웹사이트로 옮기고, 수업에서 배운 계층 구조·테스트 방식으로 다시 짜서 계속 고쳐 나갈 수 있게 한다.

## What Changes
- Claude 전용 저장(db/user/sample 기능)을 없애고 Cloudflare Pages + Functions + D1 서버로 옮긴다
- 자체 회원 시스템: 아이디·비밀번호, 세션 쿠키, 복구 코드로 아이디 찾기·비밀번호 재설정
- 코드를 core / domain / mappers / datasources / repositories / services / views 로 나누고 생성자 주입으로 조립
- 경험치는 서버가 기록으로 다시 계산
- AI 힌트는 코드·API 자리만 만들고 기본으로 숨김
- 단원 잠금 제거, 풀이 제한 시간·늦은 정답 20%, 모범 답안 공개 조건 강화
- node:test 테스트 131개 (72문제 모범답안 포함)

## Impact
- Affected specs: auth, learning-content, judging, progress, ranking, teacher-dashboard, ambience, ai-hint (모두 새로 추가)
- 배포: GitHub 저장소 → Cloudflare 대시보드 연결, D1 마이그레이션 1회
