// DataSource: 커뮤니티 테이블들 (D1 SQL을 그대로 실행하고 행을 돌려준다)

const PROBLEM_COLUMNS = 'p.id, p.author_id, u.nickname AS author_nickname, p.title, p.difficulty, p.likes, p.comments, ' +
    'p.reports, p.hidden, p.created_at';

export class D1CommunityDataSource {
    #db;

    constructor(db) {
        this.#db = db;
    }

    async listProblemsAsync({ sort, limit, offset, includeHidden }) {
        const order = sort === 'popular' ? 'p.likes DESC, p.created_at DESC' : 'p.created_at DESC';
        const { results } = await this.#db.prepare(
            'SELECT ' + PROBLEM_COLUMNS + ' FROM community_problems p JOIN users u ON u.id = p.author_id ' +
            (includeHidden ? '' : 'WHERE p.hidden = 0 ') + 'ORDER BY ' + order + ' LIMIT ? OFFSET ?',
        ).bind(limit, offset).all();
        return results ?? [];
    }

    async findProblemAsync(id) {
        return await this.#db.prepare(
            'SELECT ' + PROBLEM_COLUMNS + ', p.body, p.input_spec, p.output_spec, p.tests, p.example_count ' +
            'FROM community_problems p JOIN users u ON u.id = p.author_id WHERE p.id = ?',
        ).bind(id).first();
    }

    async countProblemsSinceAsync(authorId, since) {
        const row = await this.#db.prepare('SELECT COUNT(*) AS n FROM community_problems WHERE author_id = ? AND created_at >= ?')
            .bind(authorId, since).first();
        return Number(row?.n ?? 0);
    }

    async insertProblemAsync(row) {
        const info = await this.#db.prepare(
            'INSERT INTO community_problems (author_id, title, body, input_spec, output_spec, tests, example_count, difficulty, created_at) ' +
            'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ).bind(row.author_id, row.title, row.body, row.input_spec, row.output_spec, row.tests, row.example_count, row.difficulty, row.created_at).run();
        return Number(info.meta.last_row_id);
    }

    async deleteProblemAsync(id) {
        await this.#db.prepare('DELETE FROM community_problems WHERE id = ?').bind(id).run();
        await this.#db.prepare("DELETE FROM community_likes WHERE target_type = 'problem' AND target_id = ?").bind(id).run();
        await this.#db.prepare("DELETE FROM community_reports WHERE target_type = 'problem' AND target_id = ?").bind(id).run();
    }

    async listCommentsAsync(problemId) {
        const { results } = await this.#db.prepare(
            'SELECT c.id, c.problem_id, c.author_id, u.nickname AS author_nickname, c.body, c.likes, c.reports, c.accepted, c.hidden, c.created_at ' +
            'FROM community_comments c JOIN users u ON u.id = c.author_id WHERE c.problem_id = ? ORDER BY c.accepted DESC, c.created_at ASC',
        ).bind(problemId).all();
        return results ?? [];
    }

    async findCommentAsync(id) {
        return await this.#db.prepare('SELECT * FROM community_comments WHERE id = ?').bind(id).first();
    }

    async countCommentsSinceAsync(authorId, since) {
        const row = await this.#db.prepare('SELECT COUNT(*) AS n FROM community_comments WHERE author_id = ? AND created_at >= ?')
            .bind(authorId, since).first();
        return Number(row?.n ?? 0);
    }

    async insertCommentAsync(row) {
        const info = await this.#db.prepare(
            'INSERT INTO community_comments (problem_id, author_id, body, created_at) VALUES (?, ?, ?, ?)',
        ).bind(row.problem_id, row.author_id, row.body, row.created_at).run();
        await this.#db.prepare('UPDATE community_problems SET comments = comments + 1 WHERE id = ?').bind(row.problem_id).run();
        return Number(info.meta.last_row_id);
    }

    /** 문제 하나에서 채택은 하나만: 다른 댓글의 채택을 풀고 이 댓글만 채택 */
    async acceptCommentAsync(problemId, commentId) {
        await this.#db.prepare('UPDATE community_comments SET accepted = 0 WHERE problem_id = ?').bind(problemId).run();
        await this.#db.prepare('UPDATE community_comments SET accepted = 1 WHERE id = ?').bind(commentId).run();
    }

    async listLikedAsync(userId, targetType, ids) {
        if (ids.length === 0) {
            return [];
        }
        const marks = ids.map(() => '?').join(',');
        const { results } = await this.#db.prepare(
            'SELECT target_id FROM community_likes WHERE user_id = ? AND target_type = ? AND target_id IN (' + marks + ')',
        ).bind(userId, targetType, ...ids).all();
        return (results ?? []).map((r) => Number(r.target_id));
    }

    /** 좋아요 켜기/끄기. 바뀐 뒤의 좋아요 수와 켜졌는지를 돌려준다 */
    async toggleLikeAsync(targetType, targetId, userId) {
        const table = targetType === 'problem' ? 'community_problems' : 'community_comments';
        const exists = await this.#db.prepare('SELECT 1 AS x FROM community_likes WHERE target_type = ? AND target_id = ? AND user_id = ?')
            .bind(targetType, targetId, userId).first();
        if (exists) {
            await this.#db.prepare('DELETE FROM community_likes WHERE target_type = ? AND target_id = ? AND user_id = ?')
                .bind(targetType, targetId, userId).run();
            await this.#db.prepare('UPDATE ' + table + ' SET likes = MAX(0, likes - 1) WHERE id = ?').bind(targetId).run();
        } else {
            await this.#db.prepare('INSERT INTO community_likes (target_type, target_id, user_id) VALUES (?, ?, ?)')
                .bind(targetType, targetId, userId).run();
            await this.#db.prepare('UPDATE ' + table + ' SET likes = likes + 1 WHERE id = ?').bind(targetId).run();
        }
        const row = await this.#db.prepare('SELECT likes FROM ' + table + ' WHERE id = ?').bind(targetId).first();
        return { liked: !exists, likes: Number(row?.likes ?? 0) };
    }

    /** 신고 한 번 (같은 사람이 또 하면 무시). 바뀐 뒤 신고 수를 돌려준다 */
    async reportAsync(targetType, targetId, userId, reason, at) {
        const table = targetType === 'problem' ? 'community_problems' : 'community_comments';
        const info = await this.#db.prepare(
            'INSERT OR IGNORE INTO community_reports (target_type, target_id, user_id, reason, created_at) VALUES (?, ?, ?, ?, ?)',
        ).bind(targetType, targetId, userId, reason, at).run();
        if (info.meta.changes > 0) {
            await this.#db.prepare('UPDATE ' + table + ' SET reports = reports + 1 WHERE id = ?').bind(targetId).run();
        }
        const row = await this.#db.prepare('SELECT reports FROM ' + table + ' WHERE id = ?').bind(targetId).first();
        return Number(row?.reports ?? 0);
    }

    async setHiddenAsync(targetType, targetId, hidden) {
        const table = targetType === 'problem' ? 'community_problems' : 'community_comments';
        await this.#db.prepare('UPDATE ' + table + ' SET hidden = ? WHERE id = ?').bind(hidden ? 1 : 0, targetId).run();
    }
}
