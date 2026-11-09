# code.ai

C언어 학습 웹사이트. 캐릭터 코디가 아기 코더에서 **C 마스터**까지 자랍니다.

C언어를 처음 배우는 사람이 **18단원 문제 풀이 + 단원 퀴즈**로 개념을 익히는 학습 웹사이트입니다.
브라우저 안에서 C 코드를 바로 실행·자동 채점하고, 성장형 캐릭터 **코디**와 함께 C 마스터까지 올라갑니다.

- 문제 72개 (정올·백준 형식: 문제 · 입력 · 출력 · 예제 · 힌트), 퀴즈 90문항. 모두 새로 쓴 오리지널 콘텐츠
- 설치 없는 채점: 브라우저용 C11 인터프리터 (gcc 결과와 242개 테스트 전부 일치)
- 풀이 제한 시간 타임라인 (★10분 · ★★20분 · ★★★30분, 넘기면 경험치 20%)
- 회원가입 · 로그인 · 복구 코드로 아이디 찾기/비밀번호 재설정
- 친구 랭킹, 선생님용 학생 진도 화면
- 해의 위치로 바뀌는 시간대 배경, 피아노 효과음·배경음악
- 알고리즘 단계: USACO처럼 브론즈 · 실버 · 골드 · 플래티넘 16문제 (모두 오리지널)
- 제목 글꼴: [하다 타입 레벨업](https://hada-type.com/levelup) (SIL OFL 1.1, jsDelivr 분할 WOFF2)
- AI 힌트: 코드와 서버 자리는 준비됨, 지금은 꺼져 있음 ([켜는 방법](#ai-힌트-켜기))

## 바로 실행해 보기 (설치 없음)

Node.js 22.13 이상이면 됩니다.

```bash
node tools/dev-server.mjs                       # http://localhost:8788
TEACHER_USERNAMES=myid node tools/dev-server.mjs  # myid 아이디를 선생님으로
npm test                                        # 전체 테스트
```

`tools/dev-server.mjs` 는 Cloudflare Pages(정적 파일) + Functions(API) + D1(데이터베이스)을 흉내 냅니다. D1 대신 `.dev/dev.sqlite` 파일을 씁니다.
Cloudflare와 똑같은 환경으로 돌려 보려면 `npm run db:migrate:local` 후 `npm run dev` (wrangler 사용).

## 폴더 구조

```
public/                  화면 (Cloudflare Pages가 그대로 배포)
  index.html, css/, assets/ (소리·아이콘), data/content.json (문제·퀴즈)
  js/
    core/                Result 패턴, AppError
    domain/              학습 규칙 (경험치·레벨·클리어·진화), 입력 규칙, 모델 — 서버와 같이 씀
    mappers/             DTO → Model 변환 (이상한 값 정리)
    datasources/         서버 API·정적 파일과 직접 통신
    repositories/        응답 → Result, DTO → Model
    services/            화면 쪽 규칙 (진도, 채점, 로그인, 랭킹, 힌트)
    judge/               C 인터프리터, Web Worker
    ui/                  하늘, 코디, 소리, 에디터
    views/               화면 그리기
    main.js              조립(생성자 주입)
functions/api/           Cloudflare Pages Functions — 주소별 얇은 연결 파일
server/                  서버 계층: datasources(D1) → repositories → services, security, hint, http
migrations/              D1 SQL
content/                 문제·퀴즈 원본 → tools/build-content.mjs 가 content.json 생성
tests/                   node:test (Given-When-Then)
openspec/                기능 명세(specs)와 변경 기록(changes)
docs/                    아키텍처, 배포 안내, 설계·계획 문서
```

자세한 구조는 [docs/architecture.md](docs/architecture.md), 코딩 규칙은 [AGENTS.md](AGENTS.md)를 보세요.

## 배포 (Cloudflare Pages)

[docs/deploy-cloudflare.md](docs/deploy-cloudflare.md)에 대시보드에서 저장소를 연결하는 순서를 적어 두었습니다.

## 문제를 고치거나 추가할 때

1. `content/chapters-*.cjs` 를 고친다
2. `node tools/build-content.mjs` (gcc 필요) — 모범답안을 gcc로 실행해 기대 출력을 만들고, 인터프리터 결과와 다르면 실패
3. `npm test`

## AI 힌트 켜기

1. `public/js/config/features.js` 에서 `aiHint: true`
2. Cloudflare 대시보드 → 설정 → 변수 및 비밀: `AI_HINT_ENABLED=true`, `AI_HINT_API_KEY`(Secret으로)
3. 다른 AI 서비스를 쓰려면 `server/hint/hint-providers.js` 에 `getHintAsync(prompt)` 를 가진 클래스를 추가하고 `server/container.js` 에서 바꿔 끼운다

## 저작권

《자기주도 C언어 프로그래밍》의 단원 순서와 다루는 개념만 참고했습니다. 문제 지문·예제·테스트·힌트·해설·퀴즈·음악은 모두 새로 만든 것이고, 캐릭터 코디 그림은 Google Gemini로 새로 그린 오리지널 픽셀 아트입니다 (`public/assets/cody/`).
