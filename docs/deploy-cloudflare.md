# Cloudflare Pages 배포 안내 (대시보드에서 저장소 연결)

처음 한 번만 하면, 그다음부터는 `git push` 할 때마다 자동으로 다시 배포됩니다. 무료 플랜으로 충분해요.

## 0. 준비

- GitHub에 이 저장소를 올려 둔다 (지금 저장소: `mijin1996/app-c-master`)
- Cloudflare 계정

> 저장소에는 `wrangler.toml` 을 올리지 않아요 (`wrangler.example.toml` 만 있음). 그래야 아래 대시보드 설정이 그대로 쓰여요.

## 1. D1 데이터베이스 만들기

1. Cloudflare 대시보드 → **Storage & Databases → D1 SQL Database → Create**
2. 이름: `c-master-db` → 만들기
3. 만든 DB의 **Console** 탭에서 아래 두 파일 내용을 **차례대로** 붙여 넣고 실행
   1. `migrations/0001_init.sql` (회원 · 로그인 · 진도)
   2. `migrations/0002_community.sql` (커뮤니티)
4. Console에서 `SELECT name FROM sqlite_master WHERE type='table';` 를 실행해 `users, sessions, progress, community_problems, community_comments, community_likes, community_reports` 가 보이면 성공

## 2. Pages 프로젝트 만들고 저장소 연결

1. **Workers & Pages → Create → Pages → Connect to Git**
2. GitHub 연결을 허락하고 저장소 선택
3. 프로젝트 이름: `c-master` (주소가 `https://c-master.pages.dev` 가 돼요. 이미 있으면 다른 이름)
4. 빌드 설정
   - Framework preset: **None**
   - Build command: **비워 두기**
   - Build output directory: **`public`**
5. **Save and Deploy** (첫 배포는 DB 연결 전이라 로그인이 안 돼요. 다음 단계 후 다시 배포)

`functions/` 폴더는 Cloudflare가 자동으로 API(`/api/...`)로 만들어 줍니다.

## 3. D1 연결과 환경 변수

프로젝트 → **Settings**

1. **Bindings → Add → D1 database**: 변수 이름 **`DB`**, 데이터베이스 **`c-master-db`**
2. **Variables and Secrets** (Production)

   | 이름 | 값 | 종류 |
   |---|---|---|
   | `TEACHER_USERNAMES` | 선생님 아이디 (여러 명이면 `teacher1,teacher2`) | Text |
   | `AI_HINT_ENABLED` | `false` | Text |
   | `PAID_LANGUAGES_ENABLED` | `false` | Text |

   나중에 켤 것 (지금은 넣지 않아도 됨)
   - AI 힌트: `AI_HINT_ENABLED=true`, `AI_HINT_API_KEY` (**Secret**), 화면 쪽 `public/js/config/features.js` 의 `aiHint: true`
   - C++ · Java: `PAID_LANGUAGES_ENABLED=true`, `JUDGE0_URL`, `JUDGE0_TOKEN` (**Secret**)
3. **Deployments** → 최신 배포 → **Retry deployment** (설정을 적용하려면 꼭 다시 배포)

## 4. 배포 후 확인 (5분)

- [ ] 첫 화면에 `c-master` 글자 효과와 레벨업 글꼴이 보인다
- [ ] 회원가입 → 복구 코드 창이 뜬다
- [ ] 문제 1001 제출 → "맞았습니다!!" → 새로고침해도 정답 표시가 남는다
- [ ] 알고리즘 문제에서 언어를 Python으로 바꾸면 "Python 준비 완료"가 뜬다
- [ ] 커뮤니티에서 문제 내기 → 다른 계정으로 풀기 · 댓글 · 좋아요가 된다
- [ ] 선생님 아이디로 가입하면 상단에 **선생님** 메뉴가 보인다
- [ ] 화면 아래 **출처 · 라이선스** 창이 열린다

## 5. 공개 전에 꼭 (권장)

- **Security → WAF → Rate limiting rules**: `/api/auth/*` 에 "1분 20회" 같은 제한 (비밀번호 · 복구 코드 무차별 대입 방지). 무료 플랜도 규칙 1개를 쓸 수 있어요.
- 도메인 연결: 프로젝트 → **Custom domains** (`.ai` 는 Cloudflare Registrar에서 연 $80, 최소 2년)

## 6. 나중에 DB를 바꿀 때

`migrations/0003_*.sql` 처럼 새 파일을 추가하고, D1 Console에서 그 파일만 실행해요. 이미 실행한 파일을 다시 실행하면 "table already exists" 오류가 나요.

wrangler(명령어)로 하고 싶다면 `wrangler.example.toml` 을 `wrangler.toml` 로 복사해 `database_id` 를 넣은 뒤 `npm run db:migrate:remote`.
