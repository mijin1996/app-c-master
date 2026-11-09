// DataSource: progress 테이블 (+ 랭킹·선생님 화면용 조회)

/**
 * @typedef {Object} ProgressRow
 * @property {number} user_id
 * @property {string} data          진도 전체 JSON
 * @property {number} xp
 * @property {number} level
 * @property {number} form
 * @property {number} solved_count
 * @property {number} cleared_count
 * @property {string} summary       요약 JSON
 * @property {number} rank_opt_in   1이면 랭킹 참여
 * @property {number} updated_at
 */

export class D1ProgressDataSource {
    #db;

    constructor(db) {
        this.#db = db;
    }

    /** @returns {Promise<ProgressRow|null>} */
    async findAsync(userId) {
        return await this.#db.prepare('SELECT * FROM progress WHERE user_id = ?').bind(userId).first();
    }

    async upsertAsync(row) {
        await this.#db.prepare(
            'INSERT INTO progress (user_id, data, xp, level, form, solved_count, cleared_count, summary, rank_opt_in, updated_at) ' +
            'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ' +
            'ON CONFLICT (user_id) DO UPDATE SET data = excluded.data, xp = excluded.xp, level = excluded.level, ' +
            'form = excluded.form, solved_count = excluded.solved_count, cleared_count = excluded.cleared_count, ' +
            'summary = excluded.summary, rank_opt_in = excluded.rank_opt_in, updated_at = excluded.updated_at',
        ).bind(row.user_id, row.data, row.xp, row.level, row.form, row.solved_count, row.cleared_count,
            row.summary, row.rank_opt_in, row.updated_at).run();
    }

    /** 랭킹: 참여한 사람만 경험치 순으로 */
    async listRankingAsync(limit) {
        const { results } = await this.#db.prepare(
            'SELECT u.id AS user_id, u.nickname, p.xp, p.level, p.form, p.solved_count, p.cleared_count ' +
            'FROM progress p JOIN users u ON u.id = p.user_id ' +
            'WHERE p.rank_opt_in = 1 ORDER BY p.xp DESC, p.solved_count DESC, p.updated_at ASC LIMIT ?',
        ).bind(limit).all();
        return results ?? [];
    }

    /** 선생님 화면: 모든 학생의 요약 */
    async listSummariesAsync() {
        const { results } = await this.#db.prepare(
            'SELECT u.id AS user_id, u.username, u.nickname, p.xp, p.level, p.form, p.solved_count, ' +
            'p.cleared_count, p.summary, p.updated_at FROM users u LEFT JOIN progress p ON p.user_id = u.id ' +
            'ORDER BY p.cleared_count DESC, p.xp DESC',
        ).all();
        return results ?? [];
    }
}
