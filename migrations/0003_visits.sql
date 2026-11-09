-- 하루 접속 수 (한국 시간 날짜별로 한 줄). 개인 정보는 남기지 않고 숫자만 센다.
-- 서버도 처음 쓸 때 CREATE TABLE IF NOT EXISTS 로 스스로 만들어서, 이 파일을 실행하지 않아도 동작한다.
CREATE TABLE IF NOT EXISTS daily_visits (
    day   TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0
);
