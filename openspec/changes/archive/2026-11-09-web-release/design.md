# Design: web-release

## Context
- 빌드 도구 없이 배포한다 (Cloudflare Pages가 public/ 을 그대로 올리고 functions/ 를 자동으로 API로 만든다)
- 학생 코드는 서버에서 돌리지 않는다 (샌드박스·비용 부담)

## Decisions
1. **채점은 브라우저 Web Worker**: 3초 실행 제한, Worker가 막힌 환경은 페이지 안에서 직접 실행으로 대체.
   - 대안: 서버 채점 → 보안 격리와 비용 때문에 보류. 채점 기록 조작 가능성은 문서화.
2. **규칙 공유**: `public/js/domain/*` 순수 함수를 서버가 import. 서버는 진도를 Mapper로 정리하고 경험치를 다시 계산해서 요약 칸에 저장.
3. **인증**: PBKDF2-SHA256 10만 회(Workers 상한), 세션 토큰 32바이트 → DB에는 SHA-256만. 쿠키 HttpOnly·Secure·SameSite=Lax, 30일.
4. **복구 코드**: 혼동 글자를 뺀 32자 알파벳 8자리(약 40비트). 아이디 찾기를 위해 소금 없이 `sha256('recovery::'+code)` 로 저장·검색. 무차별 대입은 Cloudflare Rate Limiting으로 막는 것을 운영 과제로 둔다.
5. **진도 저장 단위**: 진도 전체를 JSON 한 칸(최대 512KB)에 저장 + 랭킹용 요약 칸. 학생 1명당 1행이라 조회가 단순하다.
6. **AI 힌트**: 전략 패턴. `DisabledHintProvider`(기본) / `AnthropicHintProvider`. 화면 스위치와 서버 환경 변수가 둘 다 켜져야 보인다.
7. **테스트용 D1**: `node:sqlite` 메모리 DB에 실제 마이그레이션 SQL을 적용해 SQL까지 검증한다.

## Risks / Trade-offs
- 브라우저 채점 → 랭킹 조작 가능 (학습용으로 허용)
- 로그인 시도 제한 없음 → 배포 안내서에 Rate limiting 규칙 추가 권장
- 진도 JSON 통째 저장 → 동시에 두 기기에서 풀면 마지막 저장이 이긴다

## Migration
- 아티팩트 버전 진도는 옮기지 않는다 (새 사이트에서 새로 가입)
