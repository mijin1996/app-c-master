// DataSource: sessions 테이블
export class D1SessionDataSource {
    #db;

    constructor(db) {
        this.#db = db;
    }

    async insertAsync(tokenHash, userId, expiresAt) {
        await this.#db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
            .bind(tokenHash, userId, expiresAt).run();
    }

    /** 만료되지 않은 세션의 user_id, 없으면 null */
    async findUserIdAsync(tokenHash, now) {
        const row = await this.#db.prepare('SELECT user_id FROM sessions WHERE token_hash = ? AND expires_at > ?')
            .bind(tokenHash, now).first();
        return row ? Number(row.user_id) : null;
    }

    async deleteAsync(tokenHash) {
        await this.#db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
    }

    async deleteByUserAsync(userId) {
        await this.#db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();
    }

    async deleteExpiredAsync(now) {
        await this.#db.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(now).run();
    }
}
