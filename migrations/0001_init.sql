-- C 마스터 초기 데이터베이스 (Cloudflare D1 = SQLite)

-- 회원
CREATE TABLE users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE,      -- 로그인 아이디 (영문 소문자·숫자·_)
    nickname      TEXT    NOT NULL,             -- 랭킹에 보이는 이름
    password_hash TEXT    NOT NULL,             -- PBKDF2 해시 (원래 비밀번호는 저장하지 않음)
    recovery_hash TEXT    NOT NULL,             -- 복구 코드의 SHA-256 해시
    created_at    INTEGER NOT NULL
);
CREATE INDEX idx_users_recovery ON users (recovery_hash);

-- 로그인 세션 (쿠키에 든 토큰의 해시만 저장)
CREATE TABLE sessions (
    token_hash TEXT    PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
);
CREATE INDEX idx_sessions_user ON sessions (user_id);

-- 학습 진도 (전체 JSON + 랭킹/선생님 화면용 요약 칸)
CREATE TABLE progress (
    user_id       INTEGER PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    data          TEXT    NOT NULL,
    xp            INTEGER NOT NULL DEFAULT 0,
    level         INTEGER NOT NULL DEFAULT 1,
    form          INTEGER NOT NULL DEFAULT 0,
    solved_count  INTEGER NOT NULL DEFAULT 0,
    cleared_count INTEGER NOT NULL DEFAULT 0,
    summary       TEXT    NOT NULL DEFAULT '{}',
    rank_opt_in   INTEGER NOT NULL DEFAULT 1,
    updated_at    INTEGER NOT NULL
);
CREATE INDEX idx_progress_rank ON progress (rank_opt_in, xp DESC);
