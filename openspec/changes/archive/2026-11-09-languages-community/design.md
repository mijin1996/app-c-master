# 설계

- `domain/languages.js`: 언어 목록·기본 틀·유료 여부. 진도 code 칸은 C는 `번호`, 다른 언어는 `번호:언어`.
- `JudgeService({ c, python, cpp, java })`: 언어별 실행기를 주입 (OCP). `PythonWorkerRunner`(Pyodide Worker, 준비 후 10초 제한), `ServerJudgeRunner`(→ `/api/run` → `CodeRunService` → `Judge0JudgeProvider`, 기본은 `DisabledJudgeProvider`).
- Python 채점 도우미 `judge/python-harness.py`: stdin/stdout 바꾸기, 문법 오류 줄 번호, 출력 초과. 테스트는 python3 로 같은 파일을 돌려 확인.
- 빌드: Python 모범답안을 python3 로 돌려 gcc 출력과 대조 (490개 테스트 일치).
- 커뮤니티: `migrations/0002_community.sql` (problems, comments, likes, reports). `domain/community-rules.js` 를 화면·서버가 함께 써서 검사. 서버 `CommunityService` 가 권한(채택은 문제 낸 사람, 숨기기는 선생님)과 제한(하루 10문제, 시간당 30댓글, 신고 3번 자동 숨김)을 판단.
- 커뮤니티 문제는 XP를 주지 않는다 (자기 문제로 점수 올리기 방지).
