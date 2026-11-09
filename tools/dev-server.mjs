// 설치 없이 돌려 보는 로컬 개발 서버 (Cloudflare Pages + Functions + D1 흉내)
// - public/ 정적 파일을 보여 주고
// - /api/** 요청은 functions/api/** 파일의 onRequestGet/Post/Put 으로 보낸다
// - D1 대신 Node 내장 SQLite 파일(.dev/dev.sqlite)을 쓴다
// 사용법: node tools/dev-server.mjs  →  http://localhost:8788
//        TEACHER_USERNAMES=myid node tools/dev-server.mjs   (선생님 아이디 지정)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PORT = Number(process.env.PORT || 8788);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };

// ---------- D1 흉내 (파일로 저장) ----------
function openDatabase(file) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const isNew = !fs.existsSync(file);
    const db = new DatabaseSync(file);
    db.exec('PRAGMA foreign_keys = ON;');
    if (isNew) {
        for (const name of fs.readdirSync(path.join(root, 'migrations')).sort()) {
            db.exec(fs.readFileSync(path.join(root, 'migrations', name), 'utf8'));
        }
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
    const mod = await import(file);
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
    console.log('C 마스터 개발 서버: http://localhost:' + PORT);
});
