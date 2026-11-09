# c-master 개발 규칙

사람과 AI 코딩 도구가 함께 지키는 규칙입니다. 수업에서 배운 객체지향·계층 구조 원칙을 자바스크립트에 맞게 옮겼습니다.

## 1. 작업 순서 (OpenSpec + superpowers 방식)

1. **생각 정리**: 무엇을 왜 바꾸는지 먼저 정한다. 애매하면 묻는다.
2. **명세 먼저**: `openspec/changes/<변경-이름>/` 에 `proposal.md`(왜·무엇), `design.md`(어떻게), `tasks.md`(할 일 체크리스트), `specs/<기능>/spec.md`(바뀌는 요구사항)를 만든다.
3. **계획**: 큰 작업은 `docs/superpowers/plans/` 에 2~5분 단위 작업 목록을 쓴다.
4. **테스트 먼저 (RED → GREEN → REFACTOR)**: 실패하는 테스트를 쓰고, 실패를 확인하고, 최소한의 코드로 통과시키고, 정리한다.
5. **확인 후 완료**: `npm test` 전체 통과, 화면은 직접 열어서 확인한 뒤에 "끝났다"고 말한다.
6. **기록**: 끝난 변경은 `openspec/changes/archive/날짜-이름/` 으로 옮기고 `openspec/specs/` 를 최신으로 고친다.

## 2. 코드 모양

- 중괄호는 **K&R**: 여는 `{` 는 같은 줄 끝에. `if`/`for` 는 한 줄이어도 중괄호를 쓴다.
- 들여쓰기 4칸, 세미콜론 사용, 작은따옴표 문자열.
- 이름: 클래스 `PascalCase`, 함수·변수 `camelCase`, 상수 `UPPER_SNAKE_CASE`, 비동기 함수는 끝에 `Async`.
- 숫자에 이름 붙이기: `600` 대신 `SOLVE_LIMIT_SEC[1]` (매직 넘버 금지).
- private 필드는 `#field`. 바깥에서 바꿔야 하면 메서드를 거치고, 그 안에서 값을 검사한다.
- 주석은 중학생도 이해할 짧은 한국어로, "왜"를 적는다.

## 3. 계층 구조

```
View(화면) → Service(규칙 판단) → Repository(데이터 골라 주기 + Result) → DataSource(저장소와 통신)
```

| 계층 | 할 일 | 하면 안 되는 일 |
|---|---|---|
| domain | 학습 규칙 순수 함수, 모델 모양 | 화면·네트워크·DB 접근 |
| mappers | DTO → Model, 이상한 값은 기본값·범위로 | 네트워크·DB 접근 |
| datasources | fetch, D1 SQL. 응답·행을 그대로 반환 | 규칙 판단, Model 변환 |
| repositories | DataSource 결과를 Model + Result로. 통신 예외 → NETWORK/TIMEOUT/SERVER | 규칙 판단 |
| services | 입력 검사, 규칙 적용, 여러 Repository 조합. 규칙 실패 → Result.failure | DOM, fetch 직접 호출 |
| views | 화면 그리기, 사용자 입력 받기 | 규칙 계산, fetch 직접 호출 |

- 의존하는 객체는 **생성자로 주입**한다. 조립은 `public/js/main.js`, `server/container.js` 에서만.
- 아래 계층은 위 계층을 모른다. 순환 의존 금지.
- Service는 화면이 아니라 도메인 단위로 나눈다 (`ProgressService` O, `MapScreenService` X).
- 같은 규칙을 서버와 화면이 둘 다 쓰면 `public/js/domain/` 에 두고 서버가 가져다 쓴다.

## 4. 실패 처리

- 예상 가능한 실패(아이디 중복, 비밀번호 틀림, 로그인 안 함, 네트워크 끊김)는 `Result.failure(AppError.X)` 로 돌려준다.
- 데이터 실패는 Repository가, 규칙 실패는 Service가 만든다.
- 받는 쪽은 `instanceof Failure` 로 나눠 처리하고, 사용자에게는 `messageOf(error)` 의 한국어 문장을 보여 준다.
- 예외(`throw`)는 진짜 예상 못 한 사고에만. API 입구(`server/http/endpoints.js` 의 guard)에서 500으로 바꾼다.

## 5. 테스트

- `tests/**/*.test.js`, `node:test` + `node:assert/strict`. 외부 라이브러리 없음.
- 테스트 이름은 한국어로 무엇을 확인하는지 쓴다. 본문은 `// Given` `// When` `// Then` 으로 나눈다.
- 서버·DB·시간·랜덤은 가짜로 바꾼다: `tests/fakes/sqlite-d1.js`(실제 SQL을 메모리 SQLite로), 가짜 Repository, 가짜 fetch, 고정 시계.
- 정상 값 + 경계값(0, 제한 딱 맞게, 제한+1) + 실패 상황(null, 빈 값, 고장 난 DB)을 넣는다.
- 문제·퀴즈를 바꾸면 `node tools/build-content.mjs` 로 gcc 대조 후 `npm test`.

## 6. 보안 규칙

- 비밀번호는 PBKDF2(10만 회)로만 저장, 복구 코드는 SHA-256 해시로만 저장. 원문은 어디에도 남기지 않는다.
- 세션 토큰은 HttpOnly · Secure · SameSite=Lax 쿠키. DB에는 토큰의 해시만.
- 경험치는 화면 값을 믿지 않고 서버가 기록으로 다시 계산한다.
- 선생님 화면에는 학생 코드를 보내지 않는다.
- API 키 같은 비밀값은 코드·깃에 넣지 않고 Cloudflare Secret으로만.

## 7. Git

| 머리말 | 뜻 |
|---|---|
| `feat:` | 기능 추가 |
| `fix:` | 버그 수정 |
| `refactor:` | 동작은 그대로, 코드 정리 |
| `test:` | 테스트 추가·수정 |
| `docs:` | 문서 수정 |

기록이 사라지는 명령(`reset --hard`, `push --force`)은 먼저 확인한다.
