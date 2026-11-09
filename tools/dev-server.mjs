// 설치 없이 돌려 보는 로컬 개발 서버 (Cloudflare Pages + Functions + D1 흉내)
// - public/ 정적 파일을 보여 주고
// - /api/** 요청은 functions/api/** 파일의 onRequestGet/Post/Put 으로 보낸다
// - D1 대신 Node 내장 SQLite 파일(.dev/dev.sqlite)을 쓴다
// 사용법: node tools/dev-server.mjs  →  http://localhost:8788
//        TEACHER_USERNAMES=myid node tools/dev-server.mjs   (선생님 아이디 지정)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

// fileURLToPath: 윈도우에서도 C:\... 경로가 바르게 나오게 한다 (URL.pathname 은 /C:/... 가 된다)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 8788);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };

// ---------- D1 흉내 (파일로 저장) ----------
function openDatabase(file) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const db = new DatabaseSync(file);
    db.exec('PRAGMA foreign_keys = ON;');
    // 이미 적용한 마이그레이션은 기억해 두고, 새로 생긴 파일만 적용한다 (wrangler 와 같은 방식)
    db.exec('CREATE TABLE IF NOT EXISTS d1_migrations (name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)');
    const hasUsers = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'").get();
    const applied = new Set(db.prepare('SELECT name FROM d1_migrations').all().map((r) => r.name));
    if (hasUsers && applied.size === 0) {
        applied.add('0001_init.sql'); // 예전 개발용 DB: 첫 마이그레이션은 이미 들어 있다
        db.prepare('INSERT INTO d1_migrations (name, applied_at) VALUES (?, ?)').run('0001_init.sql', Date.now());
    }
    for (const name of fs.readdirSync(path.join(root, 'migrations')).sort()) {
        if (!name.endsWith('.sql') || applied.has(name)) {
            continue;
        }
        db.exec(fs.readFileSync(path.join(root, 'migrations', name), 'utf8'));
        db.prepare('INSERT INTO d1_migrations (name, applied_at) VALUES (?, ?)').run(name, Date.now());
    }
    const bound = (stmt, params) => ({
        first: async () => stmt.get(...params) ?? null,
        all: async () => ({ results: stmt.all(...params) }),
        run: async () => {
            const info = stmt.run(...params);
            return { meta: { last_row_id: Number(info.lastInsertRowid), changes: info.changes } };
        },
    });
    return {
        prepare(sql) {
            const stmt = db.prepare(sql);
            return { bind: (...params) => bound(stmt, params), ...bound(stmt, []) };
        },
    };
}

const env = {
    DB: openDatabase(process.env.DEV_DB || path.join(root, '.dev/dev.sqlite')),
    TEACHER_USERNAMES: process.env.TEACHER_USERNAMES || '',
    AI_HINT_ENABLED: process.env.AI_HINT_ENABLED || '',
    AI_HINT_API_KEY: process.env.AI_HINT_API_KEY || '',
};

async function handleApi(req, res, url, body) {
    const file = path.join(root, 'functions', url.pathname + '.js');
    if (!file.startsWith(path.join(root, 'functions')) || !fs.existsSync(file)) {
        res.writeHead(404, { 'content-type': 'application/json' }).end('{"error":"NOT_FOUND"}');
        return;
    }
    const mod = await import(pathToFileURL(file).href); // 윈도우 경로는 file:// 주소로 바꿔야 불러올 수 있다
    const method = req.method.charAt(0) + req.method.slice(1).toLowerCase();
    const handler = mod['onRequest' + method] || mod.onRequest;
    if (!handler) {
        res.writeHead(405).end();
        return;
    }
    const request = new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body });
    const response = await handler({ request, env, params: {} });
    const headers = {};
    response.headers.forEach((value, key) => {
        headers[key] = value;
    });
    res.writeHead(response.status, headers).end(Buffer.from(await response.arrayBuffer()));
}

function handleStatic(res, url) {
    let file = path.join(root, 'public', decodeURIComponent(url.pathname));
    if (!file.startsWith(path.join(root, 'public'))) {
        res.writeHead(403).end();
        return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
        file = path.join(file, 'index.html');
    }
    if (!fs.existsSync(file)) {
        res.writeHead(404).end('not found');
        return;
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' }).end(fs.readFileSync(file));
}

http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', async () => {
        const url = new URL(req.url, 'http://localhost:' + PORT);
        try {
            if (url.pathname.startsWith('/api/')) {
                await handleApi(req, res, url, Buffer.concat(chunks));
            } else {
                handleStatic(res, url);
            }
        } catch (e) {
            console.error(e);
            res.writeHead(500).end('server error');
        }
    });
}).listen(PORT, () => {
    console.log('code.ai 개발 서버: http://localhost:' + PORT);
});
