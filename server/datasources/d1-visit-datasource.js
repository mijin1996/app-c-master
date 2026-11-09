// DataSource: daily_visits 표 (날짜별 접속 수). 숫자만 다루고 누가 왔는지는 저장하지 않는다.
const CREATE_SQL = 'CREATE TABLE IF NOT EXISTS daily_visits (day TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 0)';

export class D1VisitDataSource {
    #db;
    #ready = null;

    constructor(db) {
        this.#db = db;
    }

    /** 표가 없으면 만든다 (실제 D1 에 마이그레이션을 안 돌렸어도 동작하게). 한 번만 */
    #ensureAsync() {
        this.#ready ??= this.#db.prepare(CREATE_SQL).run().catch((e) => {
            this.#ready = null; // 실패하면 다음에 다시 시도
            throw e;
        });
        return this.#ready;
    }

    /** 1 늘리고 늘린 뒤의 숫자 */
    async incrementAsync(day) {
        await this.#ensureAsync();
        const row = await this.#db.prepare(
            'INSERT INTO daily_visits (day, count) VALUES (?, 1) ON CONFLICT (day) DO UPDATE SET count = count + 1 RETURNING count',
        ).bind(day).first();
        return Number(row?.count ?? 0);
    }

    /** 그날 숫자 (없으면 0) */
    async countAsync(day) {
        await this.#ensureAsync();
        const row = await this.#db.prepare('SELECT count FROM daily_visits WHERE day = ?').bind(day).first();
        return Number(row?.count ?? 0);
    }
}
