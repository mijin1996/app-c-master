# Cloudflare Pages 배포 안내 (대시보드에서 저장소 연결)

처음 한 번만 하면, 그다음부터는 `git push` 할 때마다 자동으로 다시 배포됩니다.

## 0. 준비

- GitHub에 이 저장소를 올려 둔다 (예: `c-master`).
- Cloudflare 계정 (무료 플랜으로 충분)

## 1. D1 데이터베이스 만들기

1. Cloudflare 대시보드 → **Storage & Databases → D1 SQL Database → Create**
2. 이름: `c-master-db` → 만들기
3. 만든 DB의 **Console** 탭에서 `migrations/0001_init.sql` 내용을 통째로 붙여 넣고 실행
4. DB 화면에 보이는 **Database ID**를 복사해서 `wrangler.toml` 의 `database_id` 에 붙여 넣고 커밋·푸시

## 2. Pages 프로젝트 만들고 저장소 연결

1. **Workers & Pages → Create → Pages → Connect to Git**
2. GitHub 연결을 허락하고 `c-master` 저장소 선택
3. 빌드 설정
   - Framework preset: **None**
   - Build command: **비워 두기**
   - Build output directory: **`public`**
4. **Save and Deploy**

`functions/` 폴더는 Cloudflare가 자동으로 API로 만들어 줍니다.

## 3. D1 연결과 환경 변수

프로젝트 → **Settings**

1. **Bindings → Add → D1 database**: 변수 이름 `DB`, 데이터베이스 `c-master-db`
   (wrangler.toml 에 database_id 를 넣었다면 자동으로 잡혀 있을 수 있어요)
2. **Variables and Secrets**
   - `TEACHER_USERNAMES` = 선생님 아이디 (여러 명이면 쉼표로: `teacher1,teacher2`)
   - `AI_HINT_ENABLED` = `false` (나중에 AI 힌트를 켤 때 `true`)
   - `AI_HINT_API_KEY` = (나중에) **Secret** 으로 넣기
3. **Deployments** 에서 최신 배포를 **Retry deployment** 해서 설정을 적용

## 4. 확인

- `https://<프로젝트>.pages.dev` 에 들어가서 회원가입 → 문제 1001 제출 → 새로고침해도 진도가 남는지 확인
- 선생님 아이디로 가입하면 상단에 **선생님** 메뉴가 보이는지 확인

## 5. 나중에 할 것 (권장)

- **Security → WAF → Rate limiting rules**: `/api/auth/*` 에 1분 20회 같은 제한 추가 (비밀번호·복구 코드 무차별 대입 방지)
- 도메인 연결: 프로젝트 → **Custom domains**
- DB 스키마를 바꿀 때: `migrations/0002_*.sql` 을 추가하고 콘솔에서 실행 (또는 `npm run db:migrate:remote`)
