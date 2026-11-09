// DataSource: D1(SQLite)의 users 테이블과 직접 통신한다. 행(DTO)을 그대로 돌려준다.

/**
 * @typedef {Object} UserRow
 * @property {number} id
 * @property {string} username
 * @property {string} nickname
 * @property {string} password_hash
 * @property {string} recovery_hash
 * @property {number} created_at
 */

export class D1UserDataSource {
    #db;

    constructor(db) {
        this.#db = db;
    }

    /** @returns {Promise<UserRow|null>} */
    async findByUsernameAsync(username) {
        return await this.#db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
    }

    /** @returns {Promise<UserRow|null>} */
    async findByIdAsync(id) {
        return await this.#db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
    }

    /** @returns {Promise<UserRow[]>} */
    async findByRecoveryHashAsync(recoveryHash) {
        const { results } = await this.#db.prepare('SELECT * FROM users WHERE recovery_hash = ?').bind(recoveryHash).all();
        return results ?? [];
    }

    /** 새 회원을 넣고 id를 돌려준다. 아이디가 겹치면 DB가 UNIQUE 오류를 던진다 */
    async insertAsync({ username, nickname, passwordHash, recoveryHash, createdAt }) {
        const result = await this.#db
            .prepare('INSERT INTO users (username, nickname, password_hash, recovery_hash, created_at) VALUES (?, ?, ?, ?, ?)')
            .bind(username, nickname, passwordHash, recoveryHash, createdAt)
            .run();
        return Number(result.meta.last_row_id);
    }

    async updatePasswordAsync(id, passwordHash, recoveryHash) {
        await this.#db.prepare('UPDATE users SET password_hash = ?, recovery_hash = ? WHERE id = ?')
            .bind(passwordHash, recoveryHash, id).run();
    }

    async updateRecoveryHashAsync(id, recoveryHash) {
        await this.#db.prepare('UPDATE users SET recovery_hash = ? WHERE id = ?').bind(recoveryHash, id).run();
    }

    /** 이 닉네임을 쓰는 다른 회원 (영어는 대소문자 무시). exceptId 는 나 자신이라 빼고 찾는다 */
    async findNicknameOwnerAsync(nickname, exceptId) {
        return await this.#db.prepare('SELECT id FROM users WHERE lower(nickname) = lower(?) AND id != ? LIMIT 1')
            .bind(nickname, exceptId).first();
    }

    async updateNicknameAsync(id, nickname) {
        await this.#db.prepare('UPDATE users SET nickname = ? WHERE id = ?').bind(nickname, id).run();
    }
}
