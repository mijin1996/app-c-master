-- 커뮤니티: 회원이 직접 낸 문제, 문제별 토론 댓글, 좋아요, 신고

-- 회원이 낸 문제 (테스트는 입력·정답 출력 묶음 JSON)
CREATE TABLE community_problems (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id   INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title       TEXT    NOT NULL,
    body        TEXT    NOT NULL,
    input_spec  TEXT    NOT NULL,
    output_spec TEXT    NOT NULL,
    tests       TEXT    NOT NULL,              -- [{"input": "...", "output": "..."}] 앞의 example_count 개는 예제로 보여 줌
    example_count INTEGER NOT NULL DEFAULT 1,
    difficulty  INTEGER NOT NULL DEFAULT 4,     -- 4 브론즈 · 5 실버 · 6 골드 · 7 플래티넘
    likes       INTEGER NOT NULL DEFAULT 0,
    comments    INTEGER NOT NULL DEFAULT 0,
    reports     INTEGER NOT NULL DEFAULT 0,
    hidden      INTEGER NOT NULL DEFAULT 0,     -- 1이면 목록에서 숨김 (신고 누적 또는 선생님)
    created_at  INTEGER NOT NULL
);
CREATE INDEX idx_cp_list ON community_problems (hidden, created_at DESC);
CREATE INDEX idx_cp_author ON community_problems (author_id, created_at);

-- 문제별 토론 댓글 (맞고 틀림 의논, 풀이 설명)
CREATE TABLE community_comments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    problem_id INTEGER NOT NULL REFERENCES community_problems (id) ON DELETE CASCADE,
    author_id  INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    body       TEXT    NOT NULL,
    likes      INTEGER NOT NULL DEFAULT 0,
    reports    INTEGER NOT NULL DEFAULT 0,
    accepted   INTEGER NOT NULL DEFAULT 0,      -- 문제 낸 사람이 채택한 답변
    hidden     INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
);
CREATE INDEX idx_cc_problem ON community_comments (problem_id, created_at);
CREATE INDEX idx_cc_author ON community_comments (author_id, created_at);

-- 좋아요 (한 사람이 한 번만)
CREATE TABLE community_likes (
    target_type TEXT    NOT NULL,               -- 'problem' | 'comment'
    target_id   INTEGER NOT NULL,
    user_id     INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    PRIMARY KEY (target_type, target_id, user_id)
);

-- 신고 (한 사람이 한 번만, 쌓이면 자동으로 숨김)
CREATE TABLE community_reports (
    target_type TEXT    NOT NULL,
    target_id   INTEGER NOT NULL,
    user_id     INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    reason      TEXT    NOT NULL,
    created_at  INTEGER NOT NULL,
    PRIMARY KEY (target_type, target_id, user_id)
);
