// 테스트용 가짜 D1: Node 내장 SQLite(메모리)에 실제 마이그레이션 SQL을 적용한다.
// Cloudflare D1과 같은 모양(prepare → bind → first/all/run)만 흉내 낸다.
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const MIGRATIONS_DIR = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../migrations');

class BoundStatement {
    #stmt;
    #params;

    constructor(stmt, params) {
        this.#stmt = stmt;
        this.#params = params;
    }

    async first() {
        return this.#stmt.get(...this.#params) ?? null;
    }

    async all() {
        return { results: this.#stmt.all(...this.#params) };
    }

    async run() {
        const info = this.#stmt.run(...this.#params);
        return { meta: { last_row_id: Number(info.lastInsertRowid), changes: info.changes } };
    }
}

class PreparedStatement {
    #stmt;

    constructor(stmt) {
        this.#stmt = stmt;
    }

    bind(...params) {
        return new BoundStatement(this.#stmt, params);
    }

    first() {
        return this.bind().first();
    }

    all() {
        return this.bind().all();
    }

    run() {
        return this.bind().run();
    }
}

export class SqliteD1 {
    #db;

    constructor() {
        this.#db = new DatabaseSync(':memory:');
        this.#db.exec('PRAGMA foreign_keys = ON;');
        for (const file of fs.readdirSync(MIGRATIONS_DIR).sort()) {
            this.#db.exec(fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'));
        }
    }

    prepare(sql) {
        return new PreparedStatement(this.#db.prepare(sql));
    }
}

/** DB가 고장 난 상황을 흉내 내는 가짜 */
export class BrokenD1 {
    prepare() {
        throw new Error('D1 unavailable');
    }
}
