/* C 마스터 - 브라우저용 C 인터프리터 (학습용 C11 부분집합)
  * 렉서 → 파서 → 클로저 컴파일 → 실행. 바이트 단위 가상 메모리를 쓴다.
  */
// ES 모듈 버전

class CError extends Error {
    constructor(kind, msg, line) { super(msg); this.kind = kind; this.line = line || 0; }
}
const cerr = (msg, line) => new CError('compile', msg, line);
const rerr = (msg, line) => new CError('runtime', msg, line);

/* ---------------- 타입 ---------------- */
const mk = (o) => Object.freeze(o);
const T = {
    void: mk({ k: 'void', size: 1, align: 1, name: 'void' }),
    char: mk({ k: 'int', size: 1, align: 1, sgn: true, name: 'char' }),
    uchar: mk({ k: 'int', size: 1, align: 1, sgn: false, name: 'unsigned char' }),
    short: mk({ k: 'int', size: 2, align: 2, sgn: true, name: 'short' }),
    ushort: mk({ k: 'int', size: 2, align: 2, sgn: false, name: 'unsigned short' }),
    int: mk({ k: 'int', size: 4, align: 4, sgn: true, name: 'int' }),
    uint: mk({ k: 'int', size: 4, align: 4, sgn: false, name: 'unsigned int' }),
    long: mk({ k: 'int', size: 8, align: 8, sgn: true, name: 'long' }),
    ulong: mk({ k: 'int', size: 8, align: 8, sgn: false, name: 'unsigned long' }),
    bool: mk({ k: 'int', size: 1, align: 1, sgn: false, bool: true, name: 'bool' }),
    float: mk({ k: 'float', size: 4, align: 4, name: 'float' }),
    double: mk({ k: 'float', size: 8, align: 8, name: 'double' }),
};
const ptrCache = new Map();
function ptr(t) {
    let p = ptrCache.get(t);
    if (!p) { p = { k: 'ptr', to: t, size: 8, align: 8 }; ptrCache.set(t, p); }
    return p;
}
function arr(t, n) { return { k: 'arr', of: t, len: n, size: t.size * (n || 0), align: t.align }; }
const isInt = (t) => t.k === 'int';
const isFlt = (t) => t.k === 'float';
const isArith = (t) => t.k === 'int' || t.k === 'float';
const isPtr = (t) => t.k === 'ptr';
const isScalar = (t) => isArith(t) || isPtr(t);
const FILE_T = { k: 'struct', name: 'FILE', fields: [], size: 8, align: 8, complete: true };
function typeName(t) {
    if (!t) return '?';
    if (t.k === 'ptr') return typeName(t.to) + '*';
    if (t.k === 'arr') return typeName(t.of) + '[' + (t.len ?? '') + ']';
    if (t.k === 'struct') return 'struct ' + (t.name || '');
    if (t.k === 'func') return '함수';
    return t.name;
}

/* ---------------- 렉서 + 전처리 ---------------- */
const KW = new Set(['int', 'char', 'short', 'long', 'float', 'double', 'void', 'unsigned', 'signed', 'const',
    'static', 'struct', 'typedef', 'if', 'else', 'while', 'do', 'for', 'return', 'break', 'continue', 'switch',
    'case', 'default', 'sizeof', 'bool', '_Bool', 'extern', 'register', 'volatile', 'inline', 'auto', 'enum',
    'union', 'goto']);
const PUNCT = ['<<=', '>>=', '...', '->', '++', '--', '<<', '>>', '<=', '>=', '==', '!=', '&&', '||', '+=', '-=',
    '*=', '/=', '%=', '&=', '|=', '^=', '::', '+', '-', '*', '/', '%', '<', '>', '=', '!', '~', '&', '|', '^', '?',
    ':', ';', ',', '.', '(', ')', '[', ']', '{', '}'];

function lexRaw(src, lineBase, directives) {
    const toks = [];
    let i = 0, line = lineBase || 1, atLineStart = true;
    const n = src.length;
    while (i < n) {
        const c = src[i];
        if (c === '\n') { line++; i++; atLineStart = true; continue; }
        if (c === ' ' || c === '\t' || c === '\r' || c === '\f' || c === '\v') { i++; continue; }
        if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
        if (c === '/' && src[i + 1] === '*') {
            const e = src.indexOf('*/', i + 2);
            if (e < 0) throw cerr('주석(/* */)이 닫히지 않았어요. */ 를 확인하세요.', line);
            for (let j = i; j < e; j++) if (src[j] === '\n') line++;
            i = e + 2; continue;
        }
        if (c === '#' && atLineStart && directives) {
            let s = '';
            const startLine = line;
            i++;
            while (i < n && src[i] !== '\n') {
                if (src[i] === '\\' && src[i + 1] === '\n') { i += 2; line++; s += ' '; continue; }
                if (src[i] === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; break; }
                if (src[i] === '/' && src[i + 1] === '*') {
                    const e = src.indexOf('*/', i + 2); if (e < 0) break;
                    for (let j = i; j < e; j++) if (src[j] === '\n') line++;
                    i = e + 2; s += ' '; continue;
                }
                s += src[i++];
            }
            directives(s, startLine);
            continue;
        }
        atLineStart = false;
        if (/[A-Za-z_]/.test(c)) {
            let j = i + 1; while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++;
            const w = src.slice(i, j);
            toks.push({ t: KW.has(w) ? 'kw' : 'id', v: w, line });
            i = j; continue;
        }
        if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
            let j = i, isF = false, v;
            if (c === '0' && (src[i + 1] === 'x' || src[i + 1] === 'X')) {
                j = i + 2; while (j < n && /[0-9a-fA-F]/.test(src[j])) j++;
                v = parseInt(src.slice(i + 2, j), 16);
            } else {
                while (j < n && /[0-9]/.test(src[j])) j++;
                if (src[j] === '.') { isF = true; j++; while (j < n && /[0-9]/.test(src[j])) j++; }
                if (src[j] === 'e' || src[j] === 'E') {
                    let k = j + 1; if (src[k] === '+' || src[k] === '-') k++;
                    if (/[0-9]/.test(src[k] || '')) { isF = true; j = k; while (j < n && /[0-9]/.test(src[j])) j++; }
                }
                const s = src.slice(i, j);
                if (isF) v = parseFloat(s);
                else if (s.length > 1 && s[0] === '0') v = parseInt(s, 8);
                else v = Number(s);
            }
            let suf = '';
            while (j < n && /[uUlLfF]/.test(src[j])) suf += src[j++].toLowerCase();
            let type;
            if (isF) type = suf.includes('f') ? T.float : T.double;
            else {
                const isL = suf.includes('l'), isU = suf.includes('u');
                if (isL || v > 2147483647) type = isU ? T.ulong : T.long;
                else type = isU ? T.uint : T.int;
            }
            toks.push({ t: 'num', v, type, line });
            i = j; continue;
        }
        if (c === '"' || c === "'") {
            let j = i + 1; const bytes = [];
            while (j < n && src[j] !== c) {
                if (src[j] === '\n') throw cerr((c === '"' ? '문자열' : '문자') + ' 따옴표가 닫히지 않았어요.', line);
                if (src[j] === '\\') {
                    const e = src[j + 1]; j += 2;
                    const map = { n: 10, t: 9, r: 13, '0': 0, '\\': 92, "'": 39, '"': 34, a: 7, b: 8, f: 12, v: 11, '?': 63 };
                    if (e === 'x') {
                        let h = ''; while (/[0-9a-fA-F]/.test(src[j] || '') && h.length < 2) h += src[j++];
                        bytes.push(parseInt(h || '0', 16));
                    } else if (/[0-7]/.test(e) && e !== '0' || (e === '0' && /[0-7]/.test(src[j] || ''))) {
                        let o = e; while (/[0-7]/.test(src[j] || '') && o.length < 3) o += src[j++];
                        bytes.push(parseInt(o, 8) & 255);
                    } else if (e in map) bytes.push(map[e]);
                    else bytes.push(...utf8(e));
                } else {
                    const cp = src.codePointAt(j); const ch = String.fromCodePoint(cp);
                    bytes.push(...utf8(ch)); j += ch.length;
                }
            }
            if (j >= n) throw cerr((c === '"' ? '문자열' : '문자') + ' 따옴표가 닫히지 않았어요.', line);
            if (c === '"') toks.push({ t: 'str', bytes, line });
            else {
                if (bytes.length === 0) throw cerr("빈 문자 상수 '' 는 쓸 수 없어요.", line);
                let v = bytes[0]; if (v > 127) v -= 256;
                if (bytes.length > 1) { v = 0; for (const b of bytes) v = (v << 8) | b; }
                toks.push({ t: 'num', v, type: T.int, line, isChar: true });
            }
            i = j + 1; continue;
        }
        let p = null;
        for (const q of PUNCT) if (src.startsWith(q, i)) { p = q; break; }
        if (!p) throw cerr("알 수 없는 문자 '" + c + "' 가 있어요.", line);
        toks.push({ t: 'op', v: p, line });
        i += p.length;
    }
    return toks;
}
const TE = new TextEncoder();
function utf8(s) { return Array.from(TE.encode(s)); }

const PREDEF = {
    EOF: '(-1)', NULL: '((void*)0)', INT_MAX: '2147483647', INT_MIN: '(-2147483647-1)', RAND_MAX: '2147483647',
    LLONG_MAX: '9223372036854775807LL', LLONG_MIN: '(-9223372036854775807LL-1)', UINT_MAX: '4294967295U',
    CHAR_MAX: '127', CHAR_MIN: '(-128)', SHRT_MAX: '32767', M_PI: '3.14159265358979323846', EXIT_SUCCESS: '0',
    EXIT_FAILURE: '1', true: '1', false: '0', LONG_MAX: '9223372036854775807L', FLT_MAX: '3.40282347e+38F',
    DBL_MAX: '1.7976931348623157e+308', SEEK_SET: '0', SEEK_CUR: '1', SEEK_END: '2',
};

function preprocessAndLex(src) {
    const macros = new Map();
    for (const k in PREDEF) macros.set(k, { params: null, body: lexRaw(PREDEF[k], 0, null) });
    let skipDepth = 0; const condStack = [];
    // 조건부 컴파일은 간단히: #if 0 ... #endif, #ifdef/#ifndef 지원
    const segments = []; // 줄 단위로 처리하려면 복잡하므로 지시문은 콜백에서 처리하고, 비활성 구간 토큰은 제거
    let activeMarks = []; // [line, active]
    const directive = (s, line) => {
        const m = s.trim().match(/^(\w*)\s*([\s\S]*)$/);
        const d = m ? m[1] : '', rest = m ? m[2].trim() : '';
        const active = condStack.every((x) => x);
        if (d === 'ifdef' || d === 'ifndef') {
            const has = macros.has(rest.split(/\s/)[0]);
            condStack.push(d === 'ifdef' ? has : !has); activeMarks.push([line, condStack.every((x) => x)]); return;
        }
        if (d === 'if') { condStack.push(!/^0\b/.test(rest)); activeMarks.push([line, condStack.every((x) => x)]); return; }
        if (d === 'else') { if (condStack.length) condStack.push(!condStack.pop()); activeMarks.push([line, condStack.every((x) => x)]); return; }
        if (d === 'elif') { if (condStack.length) { condStack.pop(); condStack.push(false); } activeMarks.push([line, false]); return; }
        if (d === 'endif') { condStack.pop(); activeMarks.push([line, condStack.every((x) => x)]); return; }
        if (!active) return;
        if (d === 'include' || d === 'pragma' || d === '' || d === 'line' || d === 'error' || d === 'warning') return;
        if (d === 'undef') { macros.delete(rest); return; }
        if (d === 'define') {
            const mm = rest.match(/^([A-Za-z_]\w*)(\(([^)]*)\))?\s*([\s\S]*)$/);
            if (!mm) throw cerr('#define 형식이 올바르지 않아요.', line);
            const name = mm[1];
            const params = mm[2] !== undefined ? mm[3].split(',').map((x) => x.trim()).filter((x) => x) : null;
            macros.set(name, { params, body: lexRaw(mm[4], line, null) });
            return;
        }
        throw cerr('지원하지 않는 전처리 지시문 #' + d + ' 이에요.', line);
    };
    const raw = lexRaw(src, 1, directive);
    // 비활성 구간 제거
    let toks = raw;
    if (activeMarks.length) {
        toks = raw.filter((t) => {
            let act = true;
            for (const [l, a] of activeMarks) { if (l < t.line) act = a; else break; }
            return act;
        });
    }
    return expand(toks, macros, new Set());
}

function expand(toks, macros, hide) {
    const out = [];
    for (let i = 0; i < toks.length; i++) {
        const tk = toks[i];
        if (tk.t === 'id' && macros.has(tk.v) && !hide.has(tk.v)) {
            const m = macros.get(tk.v);
            if (m.params === null) {
                const body = m.body.map((b) => ({ ...b, line: tk.line }));
                const h = new Set(hide); h.add(tk.v);
                out.push(...expand(body, macros, h));
                continue;
            }
            if (!(toks[i + 1] && toks[i + 1].v === '(')) { out.push(tk); continue; }
            let j = i + 2, depth = 0; const args = [[]];
            for (; j < toks.length; j++) {
                const x = toks[j];
                if (x.v === '(' && x.t === 'op') depth++;
                if (x.v === ')' && x.t === 'op') { if (depth === 0) break; depth--; }
                if (x.v === ',' && x.t === 'op' && depth === 0) { args.push([]); continue; }
                args[args.length - 1].push(x);
            }
            const body = [];
            for (const b of m.body) {
                const pi = b.t === 'id' ? m.params.indexOf(b.v) : -1;
                if (pi >= 0) body.push(...expand(args[pi] || [], macros, hide).map((x) => ({ ...x, line: tk.line })));
                else body.push({ ...b, line: tk.line });
            }
            const h = new Set(hide); h.add(tk.v);
            out.push(...expand(body, macros, h));
            i = j; continue;
        }
        out.push(tk);
    }
    return out;
}

/* ---------------- 파서 ---------------- */
function parse(toks) {
    let p = 0;
    const typedefs = new Map([['FILE', FILE_T], ['size_t', T.ulong], ['int64_t', T.long], ['uint64_t', T.ulong],
        ['int32_t', T.int], ['uint32_t', T.uint], ['ll', null]]);
    typedefs.delete('ll');
    const structs = new Map();
    const enumConsts = new Map();
    toks.push({ t: 'eof', v: '<끝>', line: toks.length ? toks[toks.length - 1].line : 1 });
    const peek = (o = 0) => toks[p + o];
    const prevLine = () => (p > 0 ? toks[p - 1].line : 1);
    const is = (v, o = 0) => { const t = toks[p + o]; return (t.t === 'op' || t.t === 'kw') && t.v === v; };
    const accept = (v) => { if (is(v)) { p++; return true; } return false; };
    const expect = (v, what) => {
        if (is(v)) return toks[p++];
        const t = peek();
        if (v === ';') throw cerr('세미콜론(;)이 빠진 것 같아요.', prevLine());
        if (v === ')') throw cerr("괄호 ')' 가 빠졌거나 짝이 맞지 않아요." + (what ? ' (' + what + ')' : ''), t.line);
        if (v === '}') throw cerr("중괄호 '}' 가 빠졌어요. 여는 { 와 닫는 } 의 짝을 확인하세요.", t.line);
        if (v === ']') throw cerr("대괄호 ']' 가 빠졌어요.", t.line);
        throw cerr("'" + v + "' 가 필요한데 '" + (t.v ?? t.t) + "' 가 왔어요.", t.line);
    };
    const isTypeStart = (o = 0) => {
        const t = toks[p + o];
        if (t.t === 'kw') return ['int', 'char', 'short', 'long', 'float', 'double', 'void', 'unsigned', 'signed', 'const',
            'static', 'struct', 'bool', '_Bool', 'extern', 'register', 'volatile', 'inline', 'auto', 'enum', 'union', 'typedef'].includes(t.v);
        if (t.t === 'id') return typedefs.has(t.v);
        return false;
    };

    function parseSpec() {
        let base = null, uns = null, longs = 0, short = false, storage = null, isTypedef = false, sawInt = false, isChar = false;
        const line = peek().line;
        for (;;) {
            const t = peek();
            if (t.t === 'kw') {
                switch (t.v) {
                    case 'const': case 'volatile': case 'register': case 'inline': case 'auto': case 'extern': p++; continue;
                    case 'static': storage = 'static'; p++; continue;
                    case 'typedef': isTypedef = true; p++; continue;
                    case 'unsigned': uns = true; p++; continue;
                    case 'signed': uns = false; p++; continue;
                    case 'long': longs++; p++; continue;
                    case 'short': short = true; p++; continue;
                    case 'int': sawInt = true; p++; continue;
                    case 'char': isChar = true; p++; continue;
                    case 'float': base = T.float; p++; continue;
                    case 'double': base = T.double; p++; continue;
                    case 'void': base = T.void; p++; continue;
                    case 'bool': case '_Bool': base = T.bool; p++; continue;
                    case 'struct': case 'union': base = parseStruct(); continue;
                    case 'enum': base = parseEnum(); continue;
                }
                break;
            }
            if (t.t === 'id' && typedefs.has(t.v) && !base && !sawInt && !isChar && longs === 0 && uns === null && !short) {
                base = typedefs.get(t.v); p++; continue;
            }
            break;
        }
        if (!base) {
            if (isChar) base = uns ? T.uchar : T.char;
            else if (short) base = uns ? T.ushort : T.short;
            else if (longs > 0) base = uns ? T.ulong : T.long;
            else if (sawInt || uns !== null) base = uns ? T.uint : T.int;
            else throw cerr('자료형이 필요해요.', line);
        } else if (base === T.double && longs) base = T.double;
        return { base, storage, isTypedef };
    }

    function parseStruct() {
        const line = peek().line;
        const kwd = toks[p].v; p++;
        let name = null;
        if (peek().t === 'id') { name = peek().v; p++; }
        let st = name ? structs.get(name) : null;
        if (!st) { st = { k: 'struct', name, fields: [], size: 0, align: 1, complete: false, union: kwd === 'union' }; if (name) structs.set(name, st); }
        if (accept('{')) {
            if (st.complete) throw cerr('구조체 ' + name + ' 가 두 번 정의되었어요.', line);
            let off = 0, al = 1, maxSize = 0;
            while (!accept('}')) {
                if (peek().t === 'eof') throw cerr("구조체 정의의 '}' 가 빠졌어요.", line);
                const spec = parseSpec();
                do {
                    const d = parseDeclarator(spec.base);
                    if (!d.name) throw cerr('구조체 멤버 이름이 필요해요.', prevLine());
                    const ft = d.type;
                    if (ft.k === 'struct' && !ft.complete) throw cerr('정의되지 않은 구조체를 멤버로 쓸 수 없어요.', prevLine());
                    if (st.union) { st.fields.push({ name: d.name, type: ft, off: 0 }); maxSize = Math.max(maxSize, ft.size); }
                    else {
                        off = Math.ceil(off / ft.align) * ft.align;
                        st.fields.push({ name: d.name, type: ft, off });
                        off += ft.size;
                    }
                    al = Math.max(al, ft.align);
                } while (accept(','));
                expect(';');
            }
            st.align = al;
            st.size = Math.ceil((st.union ? maxSize : off) / al) * al || al;
            st.complete = true;
        }
        return st;
    }

    function parseEnum() {
        p++;
        if (peek().t === 'id') p++;
        if (accept('{')) {
            let v = 0;
            while (!accept('}')) {
                const t = peek(); if (t.t !== 'id') throw cerr('열거형 상수 이름이 필요해요.', t.line);
                p++;
                if (accept('=')) v = constEval(parseAssign());
                enumConsts.set(t.v, v); v++;
                if (!accept(',')) { expect('}'); break; }
            }
        }
        return T.int;
    }

    function constEval(e) {
        switch (e.n) {
            case 'num': return e.v;
            case 'id': if (enumConsts.has(e.name)) return enumConsts.get(e.name); break;
            case 'un': { const a = constEval(e.a); if (e.op === '-') return -a; if (e.op === '+') return a; if (e.op === '~') return ~a; if (e.op === '!') return a ? 0 : 1; break; }
            case 'bin': {
                const a = constEval(e.a), b = constEval(e.b);
                switch (e.op) {
                    case '+': return a + b; case '-': return a - b; case '*': return a * b;
                    case '/': if (!b) throw cerr('0으로 나눌 수 없어요.', e.line); return Math.trunc(a / b);
                    case '%': return a % b; case '<<': return a << b; case '>>': return a >> b;
                    case '&': return a & b; case '|': return a | b; case '^': return a ^ b;
                }
                break;
            }
            case 'cast': return Math.trunc(constEval(e.a));
            case 'sizeof_t': return e.type.size;
            case 'sizeof_e': break;
        }
        throw cerr('배열 크기에는 상수만 쓸 수 있어요. (변수 크기 배열은 지원하지 않아요. #define 이나 숫자를 쓰세요.)', e.line);
    }

    // 선언자: 반환 {name, type}
    function parseDeclarator(base, abstract) {
        let nptr = 0;
        while (accept('*')) { nptr++; while (peek().t === 'kw' && (peek().v === 'const' || peek().v === 'volatile')) p++; }
        let inner = null, name = null;
        let line = peek().line;
        if (is('(') && (is('*', 1) || (abstract && is('(', 1)))) {
            p++; inner = parseDeclaratorRaw(abstract); expect(')');
        } else if (peek().t === 'id' && !abstract) { name = peek().v; line = peek().line; p++; }
        else if (peek().t === 'id' && abstract && !typedefs.has(peek().v)) { name = peek().v; p++; }
        // 접미사
        const suff = [];
        for (;;) {
            if (accept('[')) {
                if (accept(']')) suff.push({ a: true, len: null });
                else { const e = parseExpr(); expect(']'); suff.push({ a: true, len: constEval(e) }); }
            } else if (is('(')) {
                p++;
                const params = []; let variadic = false;
                if (is(')')) { /* () */ }
                else if (is('void') && is(')', 1)) p++;
                else {
                    do {
                        if (accept('...')) { variadic = true; break; }
                        const sp = parseSpec();
                        const d = parseDeclarator(sp.base, 'maybe');
                        let pt = d.type;
                        if (pt.k === 'arr') pt = ptr(pt.of);
                        if (pt.k === 'func') pt = ptr(pt);
                        params.push({ name: d.name, type: pt });
                    } while (accept(','));
                }
                expect(')', '함수 매개변수');
                suff.push({ f: true, params, variadic });
            } else break;
        }
        let t = base;
        for (let i = 0; i < nptr; i++) t = ptr(t);
        for (let i = suff.length - 1; i >= 0; i--) {
            const s = suff[i];
            if (s.a) {
                if (t.k === 'struct' && !t.complete) throw cerr('정의되지 않은 구조체 배열이에요.', line);
                if (s.len !== null && s.len <= 0) throw cerr('배열 크기는 1 이상이어야 해요.', line);
                t = arr(t, s.len);
            } else t = { k: 'func', ret: t, params: s.params.map((x) => x.type), pnames: s.params.map((x) => x.name), variadic: s.variadic, size: 1, align: 1 };
        }
        if (inner) { const r = inner(t); return { name: r.name, type: r.type, line }; }
        return { name, type: t, line, funcParams: suff.length && suff[0].f ? suff[0] : null };
    }
    function parseDeclaratorRaw(abstract) {
        // 괄호 안의 선언자: base 를 나중에 받는 함수로 반환
        const save = p;
        // 간단히 다시 파싱: 임시 base 로 파싱 후 경로를 기록
        const marker = { k: 'marker', size: 0, align: 1 };
        const d = parseDeclarator(marker, abstract);
        const rebuild = (t, base) => {
            if (t === marker) return base;
            if (t.k === 'ptr') return ptr(rebuild(t.to, base));
            if (t.k === 'arr') return arr(rebuild(t.of, base), t.len);
            if (t.k === 'func') return { ...t, ret: rebuild(t.ret, base) };
            return t;
        };
        void save;
        return (base) => ({ name: d.name, type: rebuild(d.type, base) });
    }

    function parseTypeName() {
        const sp = parseSpec();
        const d = parseDeclarator(sp.base, true);
        return d.type;
    }

    /* 식 */
    const BIN = { '||': 4, '&&': 5, '|': 6, '^': 7, '&': 8, '==': 9, '!=': 9, '<': 10, '>': 10, '<=': 10, '>=': 10,
        '<<': 11, '>>': 11, '+': 12, '-': 12, '*': 13, '/': 13, '%': 13 };
    const ASSIGN = new Set(['=', '+=', '-=', '*=', '/=', '%=', '<<=', '>>=', '&=', '|=', '^=']);
    function parseExpr() {
        let e = parseAssign();
        while (is(',')) { const line = peek().line; p++; e = { n: 'comma', a: e, b: parseAssign(), line }; }
        return e;
    }
    function parseAssign() {
        const lhs = parseCond();
        const t = peek();
        if (t.t === 'op' && ASSIGN.has(t.v)) { p++; return { n: 'assign', op: t.v, a: lhs, b: parseAssign(), line: t.line }; }
        return lhs;
    }
    function parseCond() {
        const c = parseBin(4);
        if (is('?')) {
            const line = peek().line; p++;
            const a = parseExpr(); expect(':'); const b = parseCond();
            return { n: 'cond', c, a, b, line };
        }
        return c;
    }
    function parseBin(minPrec) {
        let a = parseUnary();
        for (;;) {
            const t = peek();
            const pr = t.t === 'op' ? BIN[t.v] : undefined;
            if (pr === undefined || pr < minPrec) break;
            p++;
            const b = parseBin(pr + 1);
            a = { n: 'bin', op: t.v, a, b, line: t.line };
        }
        return a;
    }
    function parseUnary() {
        const t = peek();
        if (t.t === 'op') {
            if (t.v === '++' || t.v === '--') { p++; return { n: 'pre', op: t.v, a: parseUnary(), line: t.line }; }
            if (['-', '+', '!', '~', '*', '&'].includes(t.v)) { p++; return { n: 'un', op: t.v, a: parseCast(), line: t.line }; }
            if (t.v === '(' && isTypeStart(1)) return parseCast();
        }
        if (t.t === 'kw' && t.v === 'sizeof') {
            p++;
            if (is('(') && isTypeStart(1)) { p++; const ty = parseTypeName(); expect(')'); return { n: 'sizeof_t', type: ty, line: t.line }; }
            return { n: 'sizeof_e', a: parseUnary(), line: t.line };
        }
        return parsePostfix();
    }
    function parseCast() {
        if (is('(') && isTypeStart(1)) {
            const line = peek().line; p++;
            const ty = parseTypeName(); expect(')');
            if (is('{')) { const init = parseInit(); return { n: 'compound', type: ty, init, line }; }
            return { n: 'cast', type: ty, a: parseCast(), line };
        }
        return parseUnary();
    }
    function parsePostfix() {
        let e = parsePrimary();
        for (;;) {
            const t = peek();
            if (t.t !== 'op') break;
            if (t.v === '[') { p++; const i = parseExpr(); expect(']'); e = { n: 'idx', a: e, i, line: t.line }; continue; }
            if (t.v === '(') {
                p++; const args = [];
                if (!is(')')) { do args.push(parseAssign()); while (accept(',')); }
                expect(')', '함수 호출');
                e = { n: 'call', f: e, args, line: t.line }; continue;
            }
            if (t.v === '.' || t.v === '->') {
                p++; const nm = peek(); if (nm.t !== 'id') throw cerr('멤버 이름이 필요해요.', nm.line);
                p++; e = { n: 'mem', a: e, name: nm.v, arrow: t.v === '->', line: t.line }; continue;
            }
            if (t.v === '++' || t.v === '--') { p++; e = { n: 'post', op: t.v, a: e, line: t.line }; continue; }
            break;
        }
        return e;
    }
    function parsePrimary() {
        const t = peek();
        if (t.t === 'num') { p++; return { n: 'num', v: t.v, type: t.type, line: t.line }; }
        if (t.t === 'str') {
            p++; let bytes = t.bytes.slice();
            while (peek().t === 'str') { bytes = bytes.concat(peek().bytes); p++; }
            return { n: 'str', bytes, line: t.line };
        }
        if (t.t === 'id') {
            p++;
            if (enumConsts.has(t.v)) return { n: 'num', v: enumConsts.get(t.v), type: T.int, line: t.line };
            return { n: 'id', name: t.v, line: t.line };
        }
        if (t.t === 'op' && t.v === '(') { p++; const e = parseExpr(); expect(')'); return e; }
        if (t.t === 'eof') throw cerr('코드가 중간에 끝났어요. 괄호나 세미콜론을 확인하세요.', t.line);
        throw cerr("여기에 '" + t.v + "' 가 올 수 없어요.", t.line);
    }
    function parseInit() {
        if (is('{')) {
            const line = peek().line; p++;
            const items = [];
            while (!is('}')) {
                if (accept('.')) { /* 지정 초기화 미지원: 이름 건너뛰기 */ p++; expect('='); }
                items.push(parseInit());
                if (!accept(',')) break;
            }
            expect('}');
            return { n: 'init', items, line };
        }
        return parseAssign();
    }

    /* 문장 */
    function parseStmt() {
        const t = peek();
        const line = t.line;
        if (t.t === 'op' && t.v === '{') return parseBlock();
        if (t.t === 'op' && t.v === ';') { p++; return { n: 'empty', line }; }
        if (t.t === 'kw') {
            switch (t.v) {
                case 'if': {
                    p++; expect('('); const c = parseExpr(); expect(')', 'if 조건');
                    const th = parseStmt(); let el = null;
                    if (accept('else')) el = parseStmt();
                    return { n: 'if', c, t: th, f: el, line };
                }
                case 'while': { p++; expect('('); const c = parseExpr(); expect(')', 'while 조건'); return { n: 'while', c, body: parseStmt(), line }; }
                case 'do': {
                    p++; const body = parseStmt();
                    if (!accept('while')) throw cerr('do 문 뒤에 while(조건); 이 필요해요.', peek().line);
                    expect('('); const c = parseExpr(); expect(')'); expect(';');
                    return { n: 'dowhile', c, body, line };
                }
                case 'for': {
                    p++; expect('(');
                    let init = null;
                    if (isTypeStart()) init = parseDecl();
                    else { if (!is(';')) init = { n: 'expr', e: parseExpr(), line }; expect(';'); }
                    const c = is(';') ? null : parseExpr(); expect(';');
                    const step = is(')') ? null : parseExpr(); expect(')', 'for 문');
                    return { n: 'for', init, c, step, body: parseStmt(), line };
                }
                case 'return': { p++; const e = is(';') ? null : parseExpr(); expect(';'); return { n: 'return', e, line }; }
                case 'break': p++; expect(';'); return { n: 'break', line };
                case 'continue': p++; expect(';'); return { n: 'continue', line };
                case 'switch': { p++; expect('('); const e = parseExpr(); expect(')'); return { n: 'switch', e, body: parseStmt(), line }; }
                case 'case': { p++; const e = parseCond(); expect(':'); return { n: 'case', v: constEval(e), line }; }
                case 'default': p++; expect(':'); return { n: 'default', line };
                case 'goto': throw cerr('goto 문은 지원하지 않아요.', line);
            }
        }
        if (isTypeStart() && !(t.t === 'id' && is('(', 1) === false && false)) {
            if (!(t.t === 'id' && (is('=', 1) || is('[', 1) && false))) return parseDecl();
        }
        const e = parseExpr(); expect(';');
        return { n: 'expr', e, line };
    }
    function parseBlock() {
        const line = peek().line; expect('{');
        const items = [];
        while (!is('}')) {
            if (peek().t === 'eof') throw cerr("중괄호 '}' 가 빠졌어요. 여는 { 와 닫는 } 의 짝을 확인하세요.", line);
            items.push(parseStmt());
        }
        p++;
        return { n: 'block', items, line };
    }
    function parseDecl() {
        const line = peek().line;
        const spec = parseSpec();
        const decls = [];
        if (accept(';')) return { n: 'decl', decls, line };
        do {
            const d = parseDeclarator(spec.base);
            if (!d.name) throw cerr('변수 이름이 필요해요.', d.line);
            let init = null;
            if (accept('=')) init = parseInit();
            if (spec.isTypedef) typedefs.set(d.name, d.type);
            else decls.push({ name: d.name, type: d.type, init, storage: spec.storage, line: d.line });
        } while (accept(','));
        expect(';');
        return { n: 'decl', decls, line };
    }

    // 최상위
    const items = [];
    while (peek().t !== 'eof') {
        const t = peek();
        if (t.t === 'id' && t.v === 'using') { while (!is(';')) p++; p++; continue; }
        if (accept(';')) continue;
        const line = t.line;
        if (!isTypeStart()) {
            if (t.t === 'id' && is('(', 1)) throw cerr("함수 '" + t.v + "' 앞에 반환 자료형(int, void 등)이 필요해요.", line);
            throw cerr("'" + (t.v ?? t.t) + "' 는 여기에 올 수 없어요. 함수 밖에는 선언만 쓸 수 있어요.", line);
        }
        const spec = parseSpec();
        if (accept(';')) continue;
        const d = parseDeclarator(spec.base);
        if (d.type.k === 'func' && is('{')) {
            if (spec.isTypedef) throw cerr('typedef 와 함수 정의를 함께 쓸 수 없어요.', line);
            const body = parseBlock();
            items.push({ n: 'func', name: d.name, type: d.type, pnames: d.type.pnames, body, line: d.line });
            continue;
        }
        const decls = [];
        let dd = d;
        for (;;) {
            let init = null;
            if (accept('=')) init = parseInit();
            if (spec.isTypedef) typedefs.set(dd.name, dd.type);
            else if (dd.type.k === 'func') items.push({ n: 'proto', name: dd.name, type: dd.type, line: dd.line });
            else decls.push({ name: dd.name, type: dd.type, init, storage: spec.storage, line: dd.line });
            if (!accept(',')) break;
            dd = parseDeclarator(spec.base);
        }
        expect(';');
        if (decls.length) items.push({ n: 'decl', decls, line });
    }
    return items;
}

/* ---------------- 실행기 ---------------- */
const MEM = 48 << 20;
const GLOBAL_BASE = 4096, GLOBAL_END = 8 << 20;
const STACK_BASE = 8 << 20, STACK_END = 24 << 20;
const HEAP_BASE = 24 << 20, HEAP_END = MEM;
const FN_BASE = 0x7e000000;
const SIG_BREAK = 1, SIG_CONT = 2, SIG_RET = 3;

class ExitSignal { constructor(code) { this.code = code; } }

function run(src, opts) {
    opts = opts || {};
    const timeLimit = opts.timeLimit || 3000;
    const outLimit = opts.outLimit || (1 << 20);
    const t0 = Date.now();
    let steps = 0, nextCheck = 200000;
    let LINE = 0;
    const checkTime = () => {
        nextCheck = steps + 200000;
        if (Date.now() - t0 > timeLimit) throw new CError('tle', '시간 초과: 프로그램이 ' + (timeLimit / 1000) + '초 안에 끝나지 않았어요. 무한 반복이 없는지 확인하세요.', LINE);
    };

    const buf = new ArrayBuffer(MEM);
    const dv = new DataView(buf);
    const u8 = new Uint8Array(buf);
    let globalTop = GLOBAL_BASE;
    let BP = STACK_BASE, SP = STACK_BASE;
    let heapTop = HEAP_BASE;
    const heapBlocks = new Map();
    let RET = 0;
    let scratch = 0, scratchPos = 0; const SCRATCH = 1 << 16;

    const gAlloc = (size, align) => {
        globalTop = Math.ceil(globalTop / (align || 8)) * (align || 8);
        const a = globalTop; globalTop += Math.max(size, 1);
        if (globalTop > GLOBAL_END) throw rerr('전역 메모리가 부족해요. 배열 크기를 줄여보세요.', LINE);
        return a;
    };
    const badAddr = (a, n, hint) => {
        if (a === 0) throw rerr('NULL 포인터에 접근했어요.' + (hint || ''), LINE);
        throw rerr('잘못된 메모리 접근이에요(배열 범위를 벗어났거나 잘못된 포인터).' + (hint || ''), LINE);
    };
    const chk = (a, n) => { if (!(a >= GLOBAL_BASE && a + n <= MEM)) badAddr(a, n); };

    // 타입별 읽기/쓰기
    function loader(t) {
        if (t.k === 'int') {
            switch (t.size) {
                case 1: return t.sgn ? (a) => { chk(a, 1); return dv.getInt8(a); } : (a) => { chk(a, 1); return dv.getUint8(a); };
                case 2: return t.sgn ? (a) => { chk(a, 2); return dv.getInt16(a, true); } : (a) => { chk(a, 2); return dv.getUint16(a, true); };
                case 4: return t.sgn ? (a) => { chk(a, 4); return dv.getInt32(a, true); } : (a) => { chk(a, 4); return dv.getUint32(a, true); };
                case 8: return t.sgn ? (a) => { chk(a, 8); return Number(dv.getBigInt64(a, true)); } : (a) => { chk(a, 8); return Number(dv.getBigUint64(a, true)); };
            }
        }
        if (t.k === 'float') return t.size === 4 ? (a) => { chk(a, 4); return dv.getFloat32(a, true); } : (a) => { chk(a, 8); return dv.getFloat64(a, true); };
        if (t.k === 'ptr') return (a) => { chk(a, 8); return dv.getUint32(a, true); };
        throw rerr('이 자료형은 값을 읽을 수 없어요: ' + typeName(t), LINE);
    }
    function storer(t) {
        if (t.k === 'int') {
            switch (t.size) {
                case 1: return (a, v) => { chk(a, 1); dv.setUint8(a, v & 255); };
                case 2: return (a, v) => { chk(a, 2); dv.setUint16(a, v & 65535, true); };
                case 4: return (a, v) => { chk(a, 4); dv.setUint32(a, v >>> 0, true); };
                case 8: return (a, v) => { chk(a, 8); dv.setBigInt64(a, BigInt.asIntN(64, BigInt(Math.trunc(v) || 0)), true); };
            }
        }
        if (t.k === 'float') return t.size === 4 ? (a, v) => { chk(a, 4); dv.setFloat32(a, v, true); } : (a, v) => { chk(a, 8); dv.setFloat64(a, v, true); };
        if (t.k === 'ptr') return (a, v) => { chk(a, 8); dv.setUint32(a, v >>> 0, true); dv.setUint32(a + 4, 0, true); };
        throw rerr('이 자료형에는 값을 저장할 수 없어요: ' + typeName(t), LINE);
    }
    const ldCache = new Map(), stCache = new Map();
    const ld = (t) => { let f = ldCache.get(t); if (!f) { f = loader(t); ldCache.set(t, f); } return f; };
    const st = (t) => { let f = stCache.get(t); if (!f) { f = storer(t); stCache.set(t, f); } return f; };
    const memcpy = (d, s, n) => { chk(d, n); chk(s, n); u8.copyWithin(d, s, s + n); };

    function convFn(to) {
        if (to.k === 'int') {
            if (to.bool) return (v) => (v ? 1 : 0);
            switch (to.size) {
                case 1: return to.sgn ? (v) => ((Math.trunc(v) | 0) << 24) >> 24 : (v) => (Math.trunc(v) | 0) & 255;
                case 2: return to.sgn ? (v) => ((Math.trunc(v) | 0) << 16) >> 16 : (v) => (Math.trunc(v) | 0) & 65535;
                case 4: return to.sgn ? (v) => (Number.isFinite(v) ? Number(BigInt.asIntN(32, BigInt(Math.trunc(v)))) : 0) : (v) => (Number.isFinite(v) ? Number(BigInt.asUintN(32, BigInt(Math.trunc(v)))) : 0);
                case 8: return to.sgn ? (v) => (Number.isFinite(v) ? Math.trunc(v) : -9223372036854775808) : (v) => { v = Math.trunc(v); return v < 0 ? v + 18446744073709551616 : v; };
            }
        }
        if (to.k === 'float') return to.size === 4 ? Math.fround : null;
        return null;
    }
    // 빠른 int32 변환: 정수 입력일 때
    function conv(from, to) {
        if (from === to) return null;
        if (to.k === 'int' && to.size === 4 && to.sgn && from.k === 'int' && from.size <= 4) return from.size === 4 && !from.sgn ? (v) => v | 0 : null;
        if (to.k === 'int' && to.size === 4 && to.sgn && from.k === 'int') return (v) => Number(BigInt.asIntN(32, BigInt(v)));
        if (to.k === 'int' && to.size === 4 && to.sgn && from.k === 'float') return (v) => (Number.isFinite(v) ? (v >= -2147483648 && v < 2147483648 ? Math.trunc(v) | 0 : Number(BigInt.asIntN(32, BigInt(Math.trunc(v))))) : -2147483648);
        if (to.k === 'int' && from.k === 'int' && to.size >= from.size && to.sgn === from.sgn) return null;
        if (to.k === 'int' && to.size === 8 && from.k === 'int' && from.sgn && to.sgn) return null;
        if (to.k === 'float' && to.size === 8) return null;
        if (to.k === 'ptr' || to.k === 'arr') return null;
        return convFn(to);
    }
    const wrapConv = (f, c) => (c ? () => c(f()) : f);

    /* 출력 버퍼 */
    let out = new Uint8Array(1 << 14), outLen = 0;
    const emit = (b) => {
        if (outLen >= out.length) {
            if (out.length >= outLimit) throw new CError('ole', '출력 초과: 출력이 너무 많아요. 무한 반복으로 출력하고 있지 않은지 확인하세요.', LINE);
            const n = new Uint8Array(out.length * 2); n.set(out); out = n;
        }
        out[outLen++] = b;
    };
    const emitStr = (s) => { for (let i = 0; i < s.length; i++) emit(s.charCodeAt(i)); };

    /* 스트림 */
    const enc = new TextEncoder();
    const streams = new Map(); // addr -> stream
    function makeStream(bytes, writable, name) { return { buf: bytes, pos: 0, eof: false, w: writable, name, out: [] }; }
    const stdinS = makeStream(enc.encode((opts.input || '').replace(/\r\n/g, '\n')), false, 'stdin');
    const stdoutS = { w: true, stdout: true, name: 'stdout' };
    const files = {};
    for (const k in (opts.files || {})) files[k] = enc.encode(opts.files[k].replace(/\r\n/g, '\n'));
    const writtenFiles = {};
    let stdinAddr, stdoutAddr, stderrAddr;
    function streamOf(a) {
        const s = streams.get(a);
        if (!s) throw rerr(a === 0 ? '파일 포인터가 NULL이에요. 파일 열기(fopen)에 실패했는지 확인하세요.' : '잘못된 파일 포인터예요.', LINE);
        return s;
    }
    const sGet = (s) => { if (s.pos < s.buf.length) return s.buf[s.pos++]; s.eof = true; return -1; };
    const sPeek = (s) => (s.pos < s.buf.length ? s.buf[s.pos] : -1);
    function sWrite(s, bytes) {
        if (s.stdout) { for (const b of bytes) emit(b); return; }
        if (!s.w) throw rerr("읽기 모드('r')로 연 파일에는 쓸 수 없어요.", LINE);
        for (const b of bytes) s.out.push(b);
        if (s.out.length > outLimit) throw new CError('ole', '파일 출력이 너무 많아요.', LINE);
    }

    const readCStr = (a, max) => {
        const bytes = [];
        for (let i = 0; max === undefined || i < max; i++) { chk(a + i, 1); const b = u8[a + i]; if (!b) break; bytes.push(b); }
        return bytes;
    };
    const writeBytes = (a, bytes, term) => {
        chk(a, bytes.length + (term ? 1 : 0));
        for (let i = 0; i < bytes.length; i++) u8[a + i] = bytes[i];
        if (term) u8[a + bytes.length] = 0;
    };
    const strBytesCache = new Map();
    const strLit = (bytes) => {
        const key = bytes.join(',');
        let a = strBytesCache.get(key);
        if (a === undefined) { a = gAlloc(bytes.length + 1, 1); writeBytes(a, bytes, true); strBytesCache.set(key, a); }
        return a;
    };

    /* printf 포맷 */
    function fmtFixed(x, p) {
        if (!Number.isFinite(x)) return Number.isNaN(x) ? 'nan' : (x < 0 ? '-inf' : 'inf');
        const neg = x < 0 || Object.is(x, -0);
        const ax = Math.abs(x);
        let s;
        if (ax >= 1e21) { s = BigInt(ax).toString(); if (p > 0) s += '.' + '0'.repeat(p); }
        else {
            s = ax.toFixed(Math.min(p, 100));
            if (p < 100 && Number.isInteger(ax * Math.pow(2, p + 1))) {
                const s2 = ax.toFixed(p + 1);
                if (s2[s2.length - 1] === '5') {
                    let tr = s2.slice(0, -1); if (tr.endsWith('.')) tr = tr.slice(0, -1);
                    const last = tr.replace('.', '').slice(-1);
                    if ((+last) % 2 === 0) s = tr;
                }
            }
            if (p > 100) s += '0'.repeat(p - 100);
        }
        return (neg ? '-' : '') + s;
    }
    function fmtExp(x, p, upper) {
        if (!Number.isFinite(x)) return fmtFixed(x, 0);
        let s = Math.abs(x).toExponential(Math.min(p, 100));
        const m = s.match(/^([\d.]+)e([+-])(\d+)$/);
        s = m[1] + 'e' + m[2] + (m[3].length < 2 ? '0' + m[3] : m[3]);
        if (x < 0 || Object.is(x, -0)) s = '-' + s;
        return upper ? s.toUpperCase() : s;
    }
    function fmtG(x, p, upper, alt) {
        if (!Number.isFinite(x)) return fmtFixed(x, 0);
        if (p === 0) p = 1;
        if (x === 0) { let s = Object.is(x, -0) ? '-0' : '0'; if (alt) s += '.' + '0'.repeat(p - 1); return s; }
        const ex = Math.abs(x).toExponential(p - 1);
        const X = parseInt(ex.split('e')[1], 10);
        let s;
        if (p > X && X >= -4) s = fmtFixed(x, p - 1 - X);
        else s = fmtExp(x, p - 1, upper);
        if (!alt) {
            if (s.includes('e') || s.includes('E')) s = s.replace(/\.?0+([eE])/, '$1');
            else if (s.includes('.')) s = s.replace(/\.?0+$/, '');
        }
        return s;
    }
    function pad(s, width, left, zero) {
        if (s.length >= width) return s;
        if (left) return s + ' '.repeat(width - s.length);
        if (zero) {
            const m = s.match(/^([+\- ]|0[xX])?(.*)$/);
            const pre = m[1] || '';
            return pre + '0'.repeat(width - s.length) + m[2];
        }
        return ' '.repeat(width - s.length) + s;
    }
    // 바이트 배열 포맷 → 바이트 배열
    function format(fmt, args, types) {
        const res = [];
        let ai = 0;
        const next = () => { if (ai >= args.length) throw rerr('printf의 서식 문자(%d 등) 개수보다 전달한 값이 적어요.', LINE); return args[ai++]; };
        const nextT = () => types[ai];
        for (let i = 0; i < fmt.length; i++) {
            const c = fmt[i];
            if (c !== 37) { res.push(c); continue; }
            i++;
            if (fmt[i] === 37) { res.push(37); continue; }
            let left = false, plus = false, space = false, zero = false, alt = false;
            for (;; i++) {
                const f = fmt[i];
                if (f === 45) left = true; else if (f === 43) plus = true; else if (f === 32) space = true;
                else if (f === 48) zero = true; else if (f === 35) alt = true; else break;
            }
            let width = 0, prec = -1;
            if (fmt[i] === 42) { width = next(); if (width < 0) { left = true; width = -width; } i++; }
            else while (fmt[i] >= 48 && fmt[i] <= 57) width = width * 10 + fmt[i++] - 48;
            if (fmt[i] === 46) {
                i++; prec = 0;
                if (fmt[i] === 42) { prec = next(); i++; }
                else while (fmt[i] >= 48 && fmt[i] <= 57) prec = prec * 10 + fmt[i++] - 48;
            }
            let len = '';
            while ([104, 108, 76, 113, 106, 122, 116].includes(fmt[i])) len += String.fromCharCode(fmt[i++]);
            const conv = String.fromCharCode(fmt[i] || 0);
            let s;
            const isLL = len === 'll' || len === 'l' || len === 'q' || len === 'j' || len === 'z';
            switch (conv) {
                case 'd': case 'i': {
                    const t = nextT(); let v = next();
                    if (t && t.k === 'float') v = Math.trunc(v);
                    if (!isLL) v = Number(BigInt.asIntN(32, BigInt(Math.trunc(v))));
                    if (len === 'h') v = (v << 16) >> 16; if (len === 'hh') v = (v << 24) >> 24;
                    let digits = Math.abs(v).toString();
                    if (Math.abs(v) >= 2 ** 53) digits = BigInt(v < 0 ? -v : v).toString();
                    if (prec >= 0) { digits = digits.padStart(prec, '0'); if (prec === 0 && v === 0) digits = ''; zero = false; }
                    s = (v < 0 ? '-' : plus ? '+' : space ? ' ' : '') + digits;
                    s = pad(s, width, left, zero); break;
                }
                case 'u': case 'x': case 'X': case 'o': {
                    let v = Math.trunc(next());
                    let b = isLL ? BigInt.asUintN(64, BigInt(v)) : BigInt.asUintN(32, BigInt(v));
                    if (len === 'h') b = BigInt.asUintN(16, b); if (len === 'hh') b = BigInt.asUintN(8, b);
                    let digits = b.toString(conv === 'u' ? 10 : conv === 'o' ? 8 : 16);
                    if (conv === 'X') digits = digits.toUpperCase();
                    if (prec >= 0) { digits = digits.padStart(prec, '0'); zero = false; }
                    if (alt && b !== 0n) { if (conv === 'x') digits = '0x' + digits; if (conv === 'X') digits = '0X' + digits; if (conv === 'o') digits = '0' + digits; }
                    s = pad(digits, width, left, zero); break;
                }
                case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
                    const v = next();
                    const pr = prec < 0 ? 6 : prec;
                    if (conv === 'f' || conv === 'F') s = fmtFixed(v, pr);
                    else if (conv === 'e' || conv === 'E') s = fmtExp(v, pr, conv === 'E');
                    else s = fmtG(v, pr, conv === 'G', alt);
                    if (alt && (conv === 'f') && pr === 0) s += '.';
                    if (s[0] !== '-' && (plus || space)) s = (plus ? '+' : ' ') + s;
                    s = pad(s, width, left, zero && Number.isFinite(v)); break;
                }
                case 'c': { const v = next(); const bytes = [v & 255]; const padN = Math.max(0, width - 1); if (!left) for (let k = 0; k < padN; k++) res.push(32); res.push(...bytes); if (left) for (let k = 0; k < padN; k++) res.push(32); continue; }
                case 's': {
                    const a = next();
                    const bytes = a === 0 ? utf8('(null)') : readCStr(a, prec >= 0 ? prec : undefined);
                    const w = bytes.length; const padN = Math.max(0, width - w);
                    if (!left) for (let k = 0; k < padN; k++) res.push(32);
                    res.push(...bytes);
                    if (left) for (let k = 0; k < padN; k++) res.push(32);
                    continue;
                }
                case 'p': { const v = next(); s = pad(v ? '0x' + v.toString(16) : '(nil)', width, left, false); break; }
                case 'n': next(); continue;
                default: s = '%' + conv; break;
            }
            for (let k = 0; k < s.length; k++) res.push(s.charCodeAt(k));
        }
        return res;
    }

    /* scanf */
    const isWS = (b) => b === 32 || b === 9 || b === 10 || b === 13 || b === 11 || b === 12;
    function scan(fmt, addrs, src, isScanfS) {
        let count = 0, ai = 0, failed = false, anyInput = false;
        const nextAddr = () => { if (ai >= addrs.length) throw rerr('scanf의 서식 문자 개수보다 전달한 변수가 적어요.', LINE); return addrs[ai++]; };
        const sAddr = (a) => { if (!(a >= GLOBAL_BASE && a < MEM)) throw rerr('scanf로 값을 저장할 위치가 잘못됐어요. 변수 이름 앞에 & 를 빠뜨리지 않았나요? (예: scanf("%d", &a))', LINE); return a; };
        for (let i = 0; i < fmt.length && !failed; i++) {
            const c = fmt[i];
            if (isWS(c)) { while (isWS(sPeek(src))) src.pos++; continue; }
            if (c !== 37) { if (sPeek(src) === c) { src.pos++; continue; } failed = true; break; }
            i++;
            if (fmt[i] === 37) { while (isWS(sPeek(src))) src.pos++; if (sPeek(src) === 37) { src.pos++; continue; } failed = true; break; }
            let suppress = false; if (fmt[i] === 42) { suppress = true; i++; }
            let width = 0; while (fmt[i] >= 48 && fmt[i] <= 57) width = width * 10 + fmt[i++] - 48;
            let len = ''; while ([104, 108, 76, 113, 106, 122].includes(fmt[i])) len += String.fromCharCode(fmt[i++]);
            const cv = String.fromCharCode(fmt[i]);
            const W = width || Infinity;
            if (cv !== 'c' && cv !== '[' && cv !== 'n') {
                while (isWS(sPeek(src))) src.pos++;
                if (sPeek(src) === -1) { src.eof = true; failed = true; if (!anyInput && count === 0) return -1; break; }
            }
            anyInput = true;
            if (cv === 'd' || cv === 'i' || cv === 'u' || cv === 'x' || cv === 'o') {
                let s = '';
                const base = cv === 'x' ? 16 : cv === 'o' ? 8 : 10;
                const dig = base === 16 ? /[0-9a-fA-F]/ : base === 8 ? /[0-7]/ : /[0-9]/;
                if ((sPeek(src) === 45 || sPeek(src) === 43) && s.length < W) s += String.fromCharCode(sGet(src));
                if (base === 16 && sPeek(src) === 48) { s += '0'; src.pos++; if (sPeek(src) === 120 || sPeek(src) === 88) { src.pos++; } }
                while (s.length < W && sPeek(src) !== -1 && dig.test(String.fromCharCode(sPeek(src)))) s += String.fromCharCode(sGet(src));
                if (!/[0-9a-fA-F]/.test(s)) { failed = true; break; }
                let v = parseInt(s, base);
                if (!suppress) {
                    const a = sAddr(nextAddr()); if (isScanfS) {}
                    if (len === 'll' || len === 'l' || len === 'q' || len === 'j') st(T.long)(a, v);
                    else if (len === 'h') st(T.short)(a, v);
                    else if (len === 'hh') st(T.char)(a, v);
                    else st(T.int)(a, Number(BigInt.asIntN(32, BigInt(v))));
                    count++;
                }
                continue;
            }
            if (cv === 'f' || cv === 'e' || cv === 'g' || cv === 'E' || cv === 'G' || cv === 'a') {
                let s = '';
                const take = () => { s += String.fromCharCode(sGet(src)); };
                if (sPeek(src) === 45 || sPeek(src) === 43) take();
                while (s.length < W && sPeek(src) >= 48 && sPeek(src) <= 57) take();
                if (s.length < W && sPeek(src) === 46) { take(); while (s.length < W && sPeek(src) >= 48 && sPeek(src) <= 57) take(); }
                if (s.length < W && (sPeek(src) === 101 || sPeek(src) === 69)) {
                    const save = src.pos, ss = s; take();
                    if (sPeek(src) === 45 || sPeek(src) === 43) take();
                    if (sPeek(src) >= 48 && sPeek(src) <= 57) { while (sPeek(src) >= 48 && sPeek(src) <= 57) take(); } else { src.pos = save; s = ss; }
                }
                if (!/[0-9]/.test(s)) { failed = true; break; }
                if (!suppress) {
                    const a = sAddr(nextAddr());
                    if (len === 'l' || len === 'L') st(T.double)(a, parseFloat(s)); else st(T.float)(a, parseFloat(s));
                    count++;
                }
                continue;
            }
            if (cv === 'c') {
                const n = width || 1; const bytes = [];
                for (let k = 0; k < n; k++) { const b = sGet(src); if (b === -1) break; bytes.push(b); }
                if (!bytes.length) { failed = true; if (count === 0) return -1; break; }
                if (!suppress) { const a = sAddr(nextAddr()); if (isScanfS) ai++; writeBytes(a, bytes, false); count++; }
                continue;
            }
            if (cv === 's') {
                const bytes = [];
                while (bytes.length < W && sPeek(src) !== -1 && !isWS(sPeek(src))) bytes.push(sGet(src));
                if (!suppress) { const a = sAddr(nextAddr()); if (isScanfS) ai++; writeBytes(a, bytes, true); count++; }
                continue;
            }
            if (cv === '[') {
                i++; let neg = false; if (fmt[i] === 94) { neg = true; i++; }
                const set = new Set();
                if (fmt[i] === 93) { set.add(93); i++; }
                while (i < fmt.length && fmt[i] !== 93) {
                    if (fmt[i + 1] === 45 && fmt[i + 2] !== 93 && i + 2 < fmt.length) { for (let x = fmt[i]; x <= fmt[i + 2]; x++) set.add(x); i += 3; }
                    else set.add(fmt[i++]);
                }
                const bytes = [];
                while (bytes.length < W && sPeek(src) !== -1 && (set.has(sPeek(src)) !== neg)) bytes.push(sGet(src));
                if (!bytes.length) { if (sPeek(src) === -1 && count === 0) return -1; failed = true; break; }
                if (!suppress) { const a = sAddr(nextAddr()); if (isScanfS) ai++; writeBytes(a, bytes, true); count++; }
                continue;
            }
            if (cv === 'n') { if (!suppress) st(T.int)(sAddr(nextAddr()), src.pos); continue; }
            failed = true;
        }
        return count;
    }

    /* glibc rand */
    let rTbl = null, rIdx = 0;
    function srand(seed) {
        seed = seed >>> 0; if (seed === 0) seed = 1;
        const r = new Array(344 + 1000);
        r[0] = seed | 0;
        for (let i = 1; i < 31; i++) {
            const hi = Math.trunc(r[i - 1] / 127773), lo = r[i - 1] % 127773;
            let w = 16807 * lo - 2836 * hi; if (w < 0) w += 2147483647; r[i] = w;
        }
        for (let i = 31; i < 34; i++) r[i] = r[i - 31];
        rTbl = new Int32Array(34); for (let i = 0; i < 34; i++) rTbl[i] = r[i];
        const ring = Array.from(rTbl);
        rIdx = 0; rTbl = ring;
        for (let i = 34; i < 344; i++) ring.push((ring[i - 31] + ring[i - 3]) | 0);
        rTbl = ring.slice(ring.length - 34); rIdx = 0;
    }
    function rand() {
        if (!rTbl) srand(1);
        // rTbl: 마지막 34개
        const v = (rTbl[rTbl.length - 31] + rTbl[rTbl.length - 3]) | 0;
        rTbl.push(v); if (rTbl.length > 200) rTbl = rTbl.slice(rTbl.length - 34);
        return (v >>> 1);
    }

    /* 내장 함수 */
    const B = {};
    const def = (name, ret, fn, extra) => { B[name] = Object.assign({ ret, fn, builtin: true, name }, extra || {}); };
    const S = (a) => new TextDecoder().decode(new Uint8Array(readCStr(a)));
    def('printf', T.int, (a, t) => { const r = format(readCStr(a[0]), a.slice(1), t.slice(1)); for (const b of r) emit(b); return r.length; }, { variadic: true });
    def('scanf', T.int, (a) => scan(readCStr(a[0]), a.slice(1), stdinS, false), { variadic: true });
    def('scanf_s', T.int, (a) => scan(readCStr(a[0]), a.slice(1), stdinS, true), { variadic: true });
    def('sprintf', T.int, (a, t) => { const r = format(readCStr(a[1]), a.slice(2), t.slice(2)); writeBytes(a[0], r, true); return r.length; }, { variadic: true });
    def('snprintf', T.int, (a, t) => { const r = format(readCStr(a[2]), a.slice(3), t.slice(3)); if (a[1] > 0) writeBytes(a[0], r.slice(0, a[1] - 1), true); return r.length; }, { variadic: true });
    def('sscanf', T.int, (a) => scan(readCStr(a[1]), a.slice(2), makeStream(new Uint8Array(readCStr(a[0])), false), false), { variadic: true });
    def('fprintf', T.int, (a, t) => { const r = format(readCStr(a[1]), a.slice(2), t.slice(2)); sWrite(streamOf(a[0]), r); return r.length; }, { variadic: true });
    def('fscanf', T.int, (a) => { const s = streamOf(a[0]); if (s.w && !s.r) throw rerr("쓰기 모드로 연 파일에서는 읽을 수 없어요.", LINE); return scan(readCStr(a[1]), a.slice(2), s, false); }, { variadic: true });
    def('putchar', T.int, (a) => { emit(a[0] & 255); return a[0]; });
    def('puts', T.int, (a) => { for (const b of readCStr(a[0])) emit(b); emit(10); return 1; });
    def('getchar', T.int, () => sGet(stdinS));
    def('getc', T.int, (a) => sGet(streamOf(a[0])));
    def('fgetc', T.int, (a) => sGet(streamOf(a[0])));
    def('putc', T.int, (a) => { sWrite(streamOf(a[1]), [a[0] & 255]); return a[0]; });
    def('fputc', T.int, (a) => { sWrite(streamOf(a[1]), [a[0] & 255]); return a[0]; });
    def('fputs', T.int, (a) => { sWrite(streamOf(a[1]), readCStr(a[0])); return 1; });
    def('ungetc', T.int, (a) => { const s = streamOf(a[1]); if (a[0] !== -1 && s.pos > 0) { s.pos--; s.eof = false; } return a[0]; });
    const fgetsImpl = (dst, n, s) => {
        if (n <= 0) return 0;
        const bytes = [];
        while (bytes.length < n - 1) { const b = sGet(s); if (b === -1) break; bytes.push(b); if (b === 10) break; }
        if (!bytes.length) return 0;
        writeBytes(dst, bytes, true); return dst;
    };
    def('fgets', ptr(T.char), (a) => fgetsImpl(a[0], a[1], streamOf(a[2])));
    def('gets', ptr(T.char), (a) => {
        const bytes = []; let b; let any = false;
        while ((b = sGet(stdinS)) !== -1) { any = true; if (b === 10) break; bytes.push(b); }
        if (!any) return 0;
        writeBytes(a[0], bytes, true); return a[0];
    });
    def('gets_s', ptr(T.char), (a) => B.gets.fn(a));
    def('fopen', ptr(FILE_T), (a) => {
        const name = S(a[0]), mode = S(a[1]);
        const key = name.replace(/^\.\//, '');
        const h = heapAlloc(8);
        if (mode[0] === 'r') {
            const data = files[key] ?? (writtenFiles[key] !== undefined ? enc.encode(writtenFiles[key]) : undefined);
            if (data === undefined) { return 0; }
            const s = makeStream(data, mode.includes('+'), key); s.r = true; streams.set(h, s); return h;
        }
        const s = makeStream(new Uint8Array(0), true, key);
        if (mode[0] === 'a') { const prev = files[key] || (writtenFiles[key] !== undefined ? enc.encode(writtenFiles[key]) : null); if (prev) s.out = Array.from(prev); }
        s.fileOut = true; streams.set(h, s); return h;
    });
    def('freopen', ptr(FILE_T), (a) => {
        const name = S(a[0]).replace(/^\.\//, ''), mode = S(a[1]);
        const old = streamOf(a[2]);
        if (mode[0] === 'r') {
            const data = files[name]; if (data === undefined) return 0;
            const s = makeStream(data, false, name); s.r = true; streams.set(a[2], s);
            if (old === stdinS) { stdinS.buf = data; stdinS.pos = 0; stdinS.eof = false; streams.set(a[2], stdinS); }
        } else { const s = makeStream(new Uint8Array(0), true, name); s.fileOut = true; streams.set(a[2], s); if (a[2] === stdoutAddr) redirectedOut = s; }
        return a[2];
    });
    let redirectedOut = null;
    const flushFile = (s) => { if (s.fileOut) writtenFiles[s.name] = new TextDecoder().decode(new Uint8Array(s.out)); };
    def('fclose', T.int, (a) => { const s = streamOf(a[0]); flushFile(s); if (a[0] !== stdinAddr && a[0] !== stdoutAddr) streams.delete(a[0]); return 0; });
    def('feof', T.int, (a) => (streamOf(a[0]).eof ? 1 : 0));
    def('fflush', T.int, () => 0);
    def('rewind', T.void, (a) => { const s = streamOf(a[0]); s.pos = 0; s.eof = false; return 0; });
    def('system', T.int, () => 0);
    def('getch', T.int, () => sGet(stdinS)); def('_getch', T.int, () => sGet(stdinS));
    def('remove', T.int, () => 0);
    def('_mkdir', T.int, () => 0); def('mkdir', T.int, () => 0);
    // 문자열
    def('strlen', T.ulong, (a) => { let n = 0; chk(a[0], 1); while (u8[a[0] + n]) { n++; if (a[0] + n >= MEM) badAddr(a[0]); } return n; });
    def('strcpy', ptr(T.char), (a) => { writeBytes(a[0], readCStr(a[1]), true); return a[0]; });
    def('strcpy_s', T.int, (a) => { writeBytes(a[0], readCStr(a[2]), true); return 0; });
    def('strncpy', ptr(T.char), (a) => { const s = readCStr(a[1], a[2]); const n = a[2]; chk(a[0], n); for (let i = 0; i < n; i++) u8[a[0] + i] = i < s.length ? s[i] : 0; return a[0]; });
    def('strcat', ptr(T.char), (a) => { const d = readCStr(a[0]); writeBytes(a[0] + d.length, readCStr(a[1]), true); return a[0]; });
    def('strcat_s', T.int, (a) => { const d = readCStr(a[0]); writeBytes(a[0] + d.length, readCStr(a[2]), true); return 0; });
    def('strncat', ptr(T.char), (a) => { const d = readCStr(a[0]); writeBytes(a[0] + d.length, readCStr(a[1], a[2]), true); return a[0]; });
    const cmpBytes = (x, y) => { const n = Math.min(x.length, y.length); for (let i = 0; i < n; i++) if (x[i] !== y[i]) return x[i] - y[i]; return x.length - y.length; };
    def('strcmp', T.int, (a) => { const r = cmpBytes(readCStr(a[0]), readCStr(a[1])); return r < 0 ? -1 : r > 0 ? 1 : 0; });
    def('strncmp', T.int, (a) => { const r = cmpBytes(readCStr(a[0], a[2]), readCStr(a[1], a[2])); return r < 0 ? -1 : r > 0 ? 1 : 0; });
    def('strchr', ptr(T.char), (a) => { const s = readCStr(a[0]); const c = a[1] & 255; if (c === 0) return a[0] + s.length; const i = s.indexOf(c); return i < 0 ? 0 : a[0] + i; });
    def('strrchr', ptr(T.char), (a) => { const s = readCStr(a[0]); const c = a[1] & 255; if (c === 0) return a[0] + s.length; const i = s.lastIndexOf(c); return i < 0 ? 0 : a[0] + i; });
    def('strstr', ptr(T.char), (a) => {
        const s = readCStr(a[0]), q = readCStr(a[1]);
        outer: for (let i = 0; i + q.length <= s.length; i++) { for (let j = 0; j < q.length; j++) if (s[i + j] !== q[j]) continue outer; return a[0] + i; }
        return 0;
    });
    let tokPtr = 0;
    def('strtok', ptr(T.char), (a) => {
        let s = a[0] || tokPtr; if (!s) return 0;
        const del = new Set(readCStr(a[1]));
        while (u8[s] && del.has(u8[s])) s++;
        if (!u8[s]) { tokPtr = 0; return 0; }
        let e = s; while (u8[e] && !del.has(u8[e])) e++;
        if (u8[e]) { u8[e] = 0; tokPtr = e + 1; } else tokPtr = 0;
        return s;
    });
    const mapCase = (f) => (a) => { const s = readCStr(a[0]); writeBytes(a[0], s.map(f), true); return a[0]; };
    def('strupr', ptr(T.char), mapCase((b) => (b >= 97 && b <= 122 ? b - 32 : b)));
    def('strlwr', ptr(T.char), mapCase((b) => (b >= 65 && b <= 90 ? b + 32 : b)));
    def('strrev', ptr(T.char), (a) => { const s = readCStr(a[0]); writeBytes(a[0], s.reverse(), true); return a[0]; });
    def('memset', ptr(T.void), (a) => { chk(a[0], a[2]); u8.fill(a[1] & 255, a[0], a[0] + a[2]); return a[0]; });
    def('memcpy', ptr(T.void), (a) => { memcpy(a[0], a[1], a[2]); return a[0]; });
    def('memmove', ptr(T.void), (a) => { memcpy(a[0], a[1], a[2]); return a[0]; });
    def('memcmp', T.int, (a) => { chk(a[0], a[2]); chk(a[1], a[2]); for (let i = 0; i < a[2]; i++) { const d = u8[a[0] + i] - u8[a[1] + i]; if (d) return d < 0 ? -1 : 1; } return 0; });
    // 변환
    const parseIntPrefix = (s) => { const m = s.match(/^\s*([+-]?\d+)/); return m ? parseInt(m[1], 10) : 0; };
    def('atoi', T.int, (a) => Number(BigInt.asIntN(32, BigInt(parseIntPrefix(S(a[0]))))));
    def('atol', T.long, (a) => parseIntPrefix(S(a[0])));
    def('atoll', T.long, (a) => parseIntPrefix(S(a[0])));
    def('atof', T.double, (a) => { const m = S(a[0]).match(/^\s*([+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?)/); return m ? parseFloat(m[1]) : 0; });
    def('strtol', T.long, (a) => { const s = S(a[0]); const base = a[2] || 10; const m = s.match(/^\s*[+-]?[0-9a-zA-Z]+/); const v = m ? parseInt(m[0], base) : 0; if (a[1]) st(ptr(T.char))(a[1], a[0] + (m ? utf8(m[0]).length : 0)); return isNaN(v) ? 0 : v; });
    def('strtod', T.double, (a) => { const s = S(a[0]); const m = s.match(/^\s*[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/); if (a[1]) st(ptr(T.char))(a[1], a[0] + (m ? m[0].length : 0)); return m ? parseFloat(m[0]) : 0; });
    def('itoa', ptr(T.char), (a) => { writeBytes(a[1], utf8((a[0] | 0).toString(a[2] || 10)), true); return a[1]; });
    def('_itoa', ptr(T.char), (a) => B.itoa.fn(a));
    def('abs', T.int, (a) => Math.abs(a[0]) | 0);
    def('labs', T.long, (a) => Math.abs(a[0]));
    def('llabs', T.long, (a) => Math.abs(a[0]));
    def('rand', T.int, () => rand());
    def('srand', T.void, (a) => { srand(a[0]); return 0; });
    def('time', T.long, (a) => { const v = Math.floor(Date.now() / 1000); if (a[0]) st(T.long)(a[0], v); return v; });
    def('clock', T.long, () => (Date.now() - t0) * 1000);
    def('exit', T.void, (a) => { throw new ExitSignal(a[0]); });
    def('malloc', ptr(T.void), (a) => heapAlloc(a[0]));
    def('calloc', ptr(T.void), (a) => heapAlloc(a[0] * a[1]));
    def('realloc', ptr(T.void), (a) => { const n = heapAlloc(a[1]); if (a[0]) { const old = heapBlocks.get(a[0]) || 0; memcpy(n, a[0], Math.min(old, a[1])); } return n; });
    def('free', T.void, (a) => { if (a[0] && !heapBlocks.has(a[0])) throw rerr('free() 에 malloc으로 받지 않은 주소를 넘겼어요.', LINE); heapBlocks.delete(a[0]); return 0; });
    def('qsort', T.void, (a) => {
        const [base, n, size, fp] = a;
        const items = []; for (let i = 0; i < n; i++) items.push(u8.slice(base + i * size, base + (i + 1) * size));
        const t1 = heapAlloc(size), t2 = heapAlloc(size);
        items.sort((x, y) => { u8.set(x, t1); u8.set(y, t2); return callPtr(fp, [t1, t2]); });
        for (let i = 0; i < n; i++) u8.set(items[i], base + i * size);
        return 0;
    });
    // 수학
    const m1 = (n, f) => def(n, T.double, (a) => f(a[0]));
    m1('sqrt', Math.sqrt); m1('fabs', Math.abs); m1('floor', Math.floor); m1('ceil', Math.ceil);
    m1('round', (x) => (x < 0 ? -Math.round(-x) : Math.round(x))); m1('trunc', Math.trunc);
    m1('log', Math.log); m1('log10', Math.log10); m1('log2', Math.log2); m1('exp', Math.exp);
    m1('sin', Math.sin); m1('cos', Math.cos); m1('tan', Math.tan); m1('atan', Math.atan); m1('asin', Math.asin); m1('acos', Math.acos);
    m1('cbrt', Math.cbrt);
    def('pow', T.double, (a) => Math.pow(a[0], a[1]));
    def('atan2', T.double, (a) => Math.atan2(a[0], a[1]));
    def('hypot', T.double, (a) => Math.hypot(a[0], a[1]));
    def('fmod', T.double, (a) => a[0] % a[1]);
    def('fmax', T.double, (a) => Math.max(a[0], a[1]));
    def('fmin', T.double, (a) => Math.min(a[0], a[1]));
    // ctype
    const ct = (n, f) => def(n, T.int, (a) => (f(a[0]) ? 1 : 0));
    ct('isalpha', (c) => (c >= 65 && c <= 90) || (c >= 97 && c <= 122));
    ct('isdigit', (c) => c >= 48 && c <= 57);
    ct('isalnum', (c) => (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c >= 48 && c <= 57));
    ct('isupper', (c) => c >= 65 && c <= 90);
    ct('islower', (c) => c >= 97 && c <= 122);
    ct('isspace', (c) => c === 32 || (c >= 9 && c <= 13));
    ct('ispunct', (c) => c > 32 && c < 127 && !((c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c >= 48 && c <= 57)));
    ct('isxdigit', (c) => /[0-9a-fA-F]/.test(String.fromCharCode(c)));
    ct('isprint', (c) => c >= 32 && c < 127);
    def('toupper', T.int, (a) => (a[0] >= 97 && a[0] <= 122 ? a[0] - 32 : a[0]));
    def('tolower', T.int, (a) => (a[0] >= 65 && a[0] <= 90 ? a[0] + 32 : a[0]));

    function heapAlloc(n) {
        n = Math.max(1, Math.trunc(n));
        heapTop = Math.ceil(heapTop / 16) * 16;
        if (heapTop + n > HEAP_END) return 0;
        const a = heapTop; heapTop += n; u8.fill(0, a, a + n);
        heapBlocks.set(a, n);
        return a;
    }

    /* ---- 컴파일 ---- */
    const ast = parse(preprocessAndLex(src));
    const globals = new Map();
    const funcs = new Map();
    const fnList = [];
    const globalInits = [];

    // 표준 스트림
    stdinAddr = gAlloc(8, 8); stdoutAddr = gAlloc(8, 8); stderrAddr = gAlloc(8, 8);
    streams.set(stdinAddr, stdinS); streams.set(stdoutAddr, stdoutS); streams.set(stderrAddr, { w: true, stdout: false, out: [], name: 'stderr' });
    const sv = (addr) => { const a = gAlloc(8, 8); dv.setUint32(a, addr, true); return { kind: 'g', addr: a, type: ptr(FILE_T) }; };
    globals.set('stdin', sv(stdinAddr)); globals.set('stdout', sv(stdoutAddr)); globals.set('stderr', sv(stderrAddr));

    for (const it of ast) {
        if (it.n === 'func' || it.n === 'proto') {
            let f = funcs.get(it.name);
            if (!f) { f = { name: it.name, type: it.type, body: null, idx: fnList.length, line: it.line }; funcs.set(it.name, f); fnList.push(f); }
            if (it.n === 'func') {
                if (f.def) throw cerr("함수 '" + it.name + "' 가 두 번 정의되었어요.", it.line);
                f.def = it; f.type = it.type;
            }
        }
    }

    // 컴파일 컨텍스트
    let scope = null;      // {vars: Map, parent}
    let curFn = null;      // {frame, retType}
    let loopDepth = 0, switchDepth = 0;
    const lookup = (name) => {
        for (let s = scope; s; s = s.parent) if (s.vars.has(name)) return s.vars.get(name);
        if (globals.has(name)) return globals.get(name);
        return null;
    };
    const allocLocal = (type) => {
        const al = Math.max(type.align || 1, 1);
        curFn.frame = Math.ceil(curFn.frame / al) * al;
        const off = curFn.frame; curFn.frame += Math.max(type.size, 1);
        return off;
    };

    const decay = (t) => (t.k === 'arr' ? ptr(t.of) : t.k === 'func' ? ptr(t) : t);
    // E: {t, f, a?}
    function rv(e) {
        if (e.t.k === 'arr') { const a = e.a; return { t: ptr(e.t.of), f: a }; }
        if (e.t.k === 'func') return { t: ptr(e.t), f: e.f };
        return e;
    }
    const truthy = (e) => { e = rv(e); const f = e.f; return f; };

    function arithType(a, b) {
        if (isFlt(a) || isFlt(b)) {
            if ((a.k === 'float' && a.size === 8) || (b.k === 'float' && b.size === 8)) return T.double;
            return T.float;
        }
        const sz = Math.max(a.size, b.size, 4);
        if (sz === 8) return ((a.size === 8 && !a.sgn) || (b.size === 8 && !b.sgn)) ? T.ulong : T.long;
        return ((a.size === 4 && !a.sgn) || (b.size === 4 && !b.sgn)) ? T.uint : T.int;
    }
    const promote = (t) => (t.k === 'int' && t.size < 4 ? T.int : t);

    function divZero(line) { LINE = line; throw rerr('0으로 나누었어요. 나누는 수가 0이 되지 않는지 확인하세요.', line); }

    function arithOp(op, rt, fa, fb, line) {
        if (rt.k === 'float') {
            const fr = rt.size === 4;
            switch (op) {
                case '+': return fr ? () => Math.fround(fa() + fb()) : () => fa() + fb();
                case '-': return fr ? () => Math.fround(fa() - fb()) : () => fa() - fb();
                case '*': return fr ? () => Math.fround(fa() * fb()) : () => fa() * fb();
                case '/': return fr ? () => Math.fround(fa() / fb()) : () => fa() / fb();
                case '%': throw cerr("실수에는 % 연산을 쓸 수 없어요. (정수끼리만 가능)", line);
            }
        }
        if (rt.size === 4 && rt.sgn) {
            switch (op) {
                case '+': return () => (fa() + fb()) | 0;
                case '-': return () => (fa() - fb()) | 0;
                case '*': return () => Math.imul(fa(), fb());
                case '/': return () => { const a = fa(), b = fb(); if (b === 0) divZero(line); return (a / b) | 0; };
                case '%': return () => { const a = fa(), b = fb(); if (b === 0) divZero(line); return (a % b) | 0; };
                case '<<': return () => fa() << fb();
                case '>>': return () => fa() >> fb();
                case '&': return () => fa() & fb();
                case '|': return () => fa() | fb();
                case '^': return () => fa() ^ fb();
            }
        }
        if (rt.size === 4) {
            const ca = (v) => v >>> 0;
            switch (op) {
                case '+': return () => (fa() + fb()) >>> 0;
                case '-': return () => (fa() - fb()) >>> 0;
                case '*': return () => Math.imul(fa(), fb()) >>> 0;
                case '/': return () => { const a = ca(fa()), b = ca(fb()); if (b === 0) divZero(line); return Math.floor(a / b); };
                case '%': return () => { const a = ca(fa()), b = ca(fb()); if (b === 0) divZero(line); return a % b; };
                case '<<': return () => (fa() << fb()) >>> 0;
                case '>>': return () => ca(fa()) >>> fb();
                case '&': return () => (fa() & fb()) >>> 0;
                case '|': return () => (fa() | fb()) >>> 0;
                case '^': return () => (fa() ^ fb()) >>> 0;
            }
        }
        // 64비트
        const big = (f) => () => { const r = f(BigInt(Math.trunc(fa())), BigInt(Math.trunc(fb()))); return Number(rt.sgn ? BigInt.asIntN(64, r) : BigInt.asUintN(64, r)); };
        switch (op) {
            case '+': return () => fa() + fb();
            case '-': return () => fa() - fb();
            case '*': return () => { const r = fa() * fb(); return Math.abs(r) < 9007199254740992 ? r : Number(BigInt.asIntN(64, BigInt(Math.trunc(fa())) * BigInt(Math.trunc(fb())))); };
            case '/': return () => { const a = fa(), b = fb(); if (b === 0) divZero(line); return Math.trunc(a / b); };
            case '%': return () => { const a = fa(), b = fb(); if (b === 0) divZero(line); return a % b; };
            case '<<': return big((a, b) => a << b);
            case '>>': return big((a, b) => a >> b);
            case '&': return big((a, b) => a & b);
            case '|': return big((a, b) => a | b);
            case '^': return big((a, b) => a ^ b);
        }
        throw cerr('알 수 없는 연산자 ' + op, line);
    }

    function lvalueOnly(e, line, what) {
        if (!e.a) throw cerr((what || '대입') + '의 왼쪽에는 변수가 와야 해요.', line);
        if (e.t.k === 'arr') throw cerr('배열 전체에는 = 로 대입할 수 없어요. (문자열은 strcpy를 쓰세요)', line);
    }

    function cexpr(x) {
        switch (x.n) {
            case 'num': { const v = x.v; return { t: x.type, f: () => v }; }
            case 'str': { const a = strLit(x.bytes); const t = arr(T.char, x.bytes.length + 1); return { t, a: () => a, f: () => a }; }
            case 'id': {
                const v = lookup(x.name);
                if (v) {
                    if (v.kind === 'l') {
                        const off = v.off, t = v.type;
                        const a = () => BP + off;
                        if (t.k === 'arr' || t.k === 'struct') return { t, a, f: a };
                        const l = ld(t);
                        return { t, a, f: () => l(BP + off) };
                    }
                    const addr = v.addr, t = v.type;
                    const a = () => addr;
                    if (t.k === 'arr' || t.k === 'struct') return { t, a, f: a };
                    const l = ld(t);
                    return { t, a, f: () => l(addr) };
                }
                const fn = funcs.get(x.name);
                if (fn) { const h = FN_BASE + fn.idx; return { t: fn.type, f: () => h, fnRef: fn }; }
                if (B[x.name]) return { t: { k: 'func', ret: B[x.name].ret, params: [], size: 1, align: 1 }, f: () => 0, bRef: B[x.name] };
                throw cerr("'" + x.name + "' 이(가) 선언되지 않았어요. 변수 이름 철자나 선언 위치를 확인하세요.", x.line);
            }
            case 'bin': return cbin(x);
            case 'assign': return cassign(x);
            case 'un': return cunary(x);
            case 'pre': case 'post': return cincdec(x);
            case 'cond': {
                const c = rv(cexpr(x.c)).f, a = rv(cexpr(x.a)), b = rv(cexpr(x.b));
                let t;
                if (isArith(a.t) && isArith(b.t)) t = arithType(promote(a.t), promote(b.t));
                else t = isPtr(a.t) ? a.t : b.t;
                if (a.t.k === 'struct') t = a.t;
                const fa = wrapConv(a.f, isArith(t) ? conv(a.t, t) : null), fb = wrapConv(b.f, isArith(t) ? conv(b.t, t) : null);
                return { t, f: () => (c() ? fa() : fb()) };
            }
            case 'comma': { const a = rv(cexpr(x.a)).f, b = rv(cexpr(x.b)); const fb = b.f; return { t: b.t, f: () => { a(); return fb(); } }; }
            case 'cast': {
                const e = rv(cexpr(x.a));
                const t = x.type;
                if (t.k === 'void') { const f = e.f; return { t, f: () => { f(); return 0; } }; }
                if (t.k === 'struct' || t.k === 'arr') throw cerr('이 형 변환은 지원하지 않아요.', x.line);
                return { t, f: wrapConv(e.f, isArith(t) ? (conv(e.t, t) || (isFlt(e.t) && isInt(t) ? convFn(t) : null)) : null) };
            }
            case 'sizeof_t': { const s = x.type.size; return { t: T.ulong, f: () => s }; }
            case 'sizeof_e': {
                const sv = scopeSnapshot(); const e = cexpr(x.a); void sv;
                const s = e.t.size; return { t: T.ulong, f: () => s };
            }
            case 'idx': {
                const rawA = cexpr(x.a);
                let a = rv(rawA), i = rv(cexpr(x.i));
                if (!isPtr(a.t) && isPtr(i.t)) { const tmp = a; a = i; i = tmp; }
                if (!isPtr(a.t)) throw cerr('[ ] 는 배열이나 포인터에만 쓸 수 있어요.', x.line);
                if (!isInt(i.t)) throw cerr('배열 첨자(인덱스)는 정수여야 해요.', x.line);
                const et = a.t.to; const sz = et.size; const fa = a.f;
                let fi = i.f;
                if (rawA.t.k === 'arr' && rawA.t.len) {
                    const len = rawA.t.len, fi0 = i.f, ln = x.line;
                    fi = () => { const v = fi0(); if (v < 0 || v >= len) { LINE = ln; throw rerr('배열 범위를 벗어났어요. 크기가 ' + len + '인 배열에 인덱스 ' + v + ' 로 접근했어요. (사용 가능한 인덱스: 0 ~ ' + (len - 1) + ')', ln); } return v; };
                }
                const addr = () => fa() + fi() * sz;
                if (et.k === 'arr' || et.k === 'struct') return { t: et, a: addr, f: addr };
                if (et.k === 'void') throw cerr('void 포인터는 [ ] 를 쓸 수 없어요. 먼저 형 변환하세요.', x.line);
                const l = ld(et);
                return { t: et, a: addr, f: () => l(fa() + fi() * sz) };
            }
            case 'mem': {
                let base = cexpr(x.a);
                let stT, addrF;
                if (x.arrow) {
                    base = rv(base);
                    if (!isPtr(base.t) || base.t.to.k !== 'struct') throw cerr("'->' 는 구조체 포인터에만 쓸 수 있어요.", x.line);
                    stT = base.t.to; addrF = base.f;
                } else {
                    if (base.t.k !== 'struct') {
                        if (isPtr(base.t) && base.t.to.k === 'struct') throw cerr("포인터로 멤버에 접근할 때는 '.' 대신 '->' 를 쓰세요.", x.line);
                        throw cerr("'.' 는 구조체 변수에만 쓸 수 있어요.", x.line);
                    }
                    stT = base.t; addrF = base.a || base.f;
                }
                const fld = stT.fields.find((f) => f.name === x.name);
                if (!fld) throw cerr("구조체에 '" + x.name + "' 멤버가 없어요.", x.line);
                const off = fld.off, t = fld.type;
                const a = () => addrF() + off;
                if (t.k === 'arr' || t.k === 'struct') return { t, a, f: a };
                const l = ld(t);
                return { t, a, f: () => l(addrF() + off) };
            }
            case 'call': return ccall(x);
            case 'compound': {
                const off = allocLocal(x.type);
                const init = cinit(x.type, x.init, () => BP + off, x.line);
                const a = () => BP + off;
                const l = x.type.k === 'struct' || x.type.k === 'arr' ? null : ld(x.type);
                return { t: x.type, a, f: () => { init(); return l ? l(a()) : a(); } };
            }
            case 'init': throw cerr('{ } 초기화 목록은 변수 선언에서만 쓸 수 있어요.', x.line);
        }
        throw cerr('지원하지 않는 식이에요.', x.line);
    }
    function scopeSnapshot() { return null; }

    function cbin(x) {
        const op = x.op;
        if (op === '&&' || op === '||') {
            const a = rv(cexpr(x.a)).f, b = rv(cexpr(x.b)).f;
            return { t: T.int, f: op === '&&' ? () => (a() && b() ? 1 : 0) : () => (a() || b() ? 1 : 0) };
        }
        const A = rv(cexpr(x.a)), Bx = rv(cexpr(x.b));
        if (A.t.k === 'struct' || Bx.t.k === 'struct') throw cerr('구조체끼리는 ' + op + ' 연산을 할 수 없어요. 멤버끼리 비교하세요.', x.line);
        if (A.t.k === 'void' || Bx.t.k === 'void') throw cerr('void 값은 연산에 쓸 수 없어요.', x.line);
        const cmp = ['==', '!=', '<', '>', '<=', '>='].includes(op);
        if (isPtr(A.t) || isPtr(Bx.t)) {
            if (cmp) {
                const fa = A.f, fb = Bx.f;
                switch (op) {
                    case '==': return { t: T.int, f: () => (fa() === fb() ? 1 : 0) };
                    case '!=': return { t: T.int, f: () => (fa() !== fb() ? 1 : 0) };
                    case '<': return { t: T.int, f: () => (fa() < fb() ? 1 : 0) };
                    case '>': return { t: T.int, f: () => (fa() > fb() ? 1 : 0) };
                    case '<=': return { t: T.int, f: () => (fa() <= fb() ? 1 : 0) };
                    case '>=': return { t: T.int, f: () => (fa() >= fb() ? 1 : 0) };
                }
            }
            if (op === '+' || op === '-') {
                if (isPtr(A.t) && isPtr(Bx.t) && op === '-') { const sz = A.t.to.size || 1; const fa = A.f, fb = Bx.f; return { t: T.long, f: () => (fa() - fb()) / sz }; }
                let P = A, I = Bx; if (!isPtr(P.t)) { P = Bx; I = A; }
                if (!isInt(I.t)) throw cerr('포인터에는 정수만 더하거나 뺄 수 있어요.', x.line);
                const sz = P.t.to.size || 1; const fp = P.f, fi = I.f;
                if (op === '+') return { t: P.t, f: () => fp() + fi() * sz };
                if (P === Bx) throw cerr('정수에서 포인터를 뺄 수 없어요.', x.line);
                return { t: P.t, f: () => fp() - fi() * sz };
            }
            throw cerr('포인터에는 ' + op + ' 연산을 쓸 수 없어요.', x.line);
        }
        let rt = arithType(promote(A.t), promote(Bx.t));
        if (op === '<<' || op === '>>') {
            if (!isInt(A.t) || !isInt(Bx.t)) throw cerr('시프트 연산은 정수에만 쓸 수 있어요.', x.line);
            rt = promote(A.t);
            const fa = wrapConv(A.f, conv(A.t, rt)), fb = Bx.f;
            return { t: rt, f: arithOp(op, rt, fa, fb, x.line) };
        }
        if ((op === '&' || op === '|' || op === '^' || op === '%') && (isFlt(A.t) || isFlt(Bx.t))) {
            throw cerr("실수에는 " + op + " 연산을 쓸 수 없어요. (정수끼리만 가능)", x.line);
        }
        const fa = wrapConv(A.f, conv(A.t, rt)), fb = wrapConv(Bx.f, conv(Bx.t, rt));
        if (cmp) {
            if (rt.k === 'int' && rt.size === 4 && !rt.sgn) {
                const ga = (v) => v >>> 0;
                switch (op) {
                    case '<': return { t: T.int, f: () => (ga(fa()) < ga(fb()) ? 1 : 0) };
                    case '>': return { t: T.int, f: () => (ga(fa()) > ga(fb()) ? 1 : 0) };
                    case '<=': return { t: T.int, f: () => (ga(fa()) <= ga(fb()) ? 1 : 0) };
                    case '>=': return { t: T.int, f: () => (ga(fa()) >= ga(fb()) ? 1 : 0) };
                }
            }
            switch (op) {
                case '==': return { t: T.int, f: () => (fa() === fb() ? 1 : 0) };
                case '!=': return { t: T.int, f: () => (fa() !== fb() ? 1 : 0) };
                case '<': return { t: T.int, f: () => (fa() < fb() ? 1 : 0) };
                case '>': return { t: T.int, f: () => (fa() > fb() ? 1 : 0) };
                case '<=': return { t: T.int, f: () => (fa() <= fb() ? 1 : 0) };
                case '>=': return { t: T.int, f: () => (fa() >= fb() ? 1 : 0) };
            }
        }
        return { t: rt, f: arithOp(op, rt, fa, fb, x.line) };
    }

    function assignConv(fromE, toT, line, ctx) {
        const e = rv(fromE);
        if (toT.k === 'struct') {
            if (e.t !== toT) throw cerr('같은 구조체 형끼리만 대입할 수 있어요.', line);
            return e.f;
        }
        if (e.t.k === 'struct') throw cerr('구조체를 ' + typeName(toT) + ' 에 대입할 수 없어요.', line);
        if (e.t.k === 'void') throw cerr('void 함수의 결과는 값으로 쓸 수 없어요.', line);
        if (isPtr(toT) && isFlt(e.t)) throw cerr('실수를 포인터에 대입할 수 없어요.', line);
        if (isFlt(toT) && isPtr(e.t)) throw cerr('포인터를 실수에 대입할 수 없어요.' + (ctx || ''), line);
        if (isArith(toT)) {
            let c = conv(e.t, toT);
            if (!c && isFlt(e.t) && isInt(toT)) c = convFn(toT);
            if (isPtr(e.t)) c = convFn(toT);
            return wrapConv(e.f, c);
        }
        return e.f;
    }

    function cassign(x) {
        const L = cexpr(x.a);
        lvalueOnly(L, x.line);
        const t = L.t, la = L.a;
        if (t.k === 'struct') {
            if (x.op !== '=') throw cerr('구조체에는 ' + x.op + ' 를 쓸 수 없어요.', x.line);
            const r = assignConv(cexpr(x.b), t, x.line); const sz = t.size;
            return { t, a: la, f: () => { const d = la(); const s = r(); if (d !== s) memcpy(d, s, sz); return d; } };
        }
        const s = st(t), l = ld(t);
        if (x.op === '=') {
            const r = assignConv(cexpr(x.b), t, x.line);
            return { t, a: la, f: () => { const a = la(); const v = r(); s(a, v); return l(a); } };
        }
        const op = x.op.slice(0, -1);
        const R = rv(cexpr(x.b));
        if (isPtr(t)) {
            if (op !== '+' && op !== '-') throw cerr('포인터에는 ' + x.op + ' 를 쓸 수 없어요.', x.line);
            const sz = t.to.size || 1; const fr = R.f; const sg = op === '+' ? 1 : -1;
            return { t, a: la, f: () => { const a = la(); const v = l(a) + sg * fr() * sz; s(a, v); return v; } };
        }
        if ((op === '%' || op === '&' || op === '|' || op === '^' || op === '<<' || op === '>>') && (isFlt(t) || isFlt(R.t))) throw cerr('실수에는 ' + x.op + ' 를 쓸 수 없어요.', x.line);
        let rt = arithType(promote(t), promote(R.t));
        if (op === '<<' || op === '>>') rt = promote(t);
        let cur = 0;
        const fa = wrapConv(() => cur, conv(t, rt));
        const fb = (op === '<<' || op === '>>') ? R.f : wrapConv(R.f, conv(R.t, rt));
        const opf = arithOp(op, rt, fa, fb, x.line);
        let back = conv(rt, t); if (!back && isFlt(rt) && isInt(t)) back = convFn(t);
        return { t, a: la, f: () => { const a = la(); cur = l(a); const savedCur = cur; let v = opf(); void savedCur; if (back) v = back(v); s(a, v); return v; } };
    }

    function cunary(x) {
        if (x.op === '&') {
            const e = cexpr(x.a);
            if (e.fnRef) { const h = FN_BASE + e.fnRef.idx; return { t: ptr(e.t), f: () => h }; }
            if (!e.a) throw cerr("& 는 변수 앞에만 쓸 수 있어요.", x.line);
            return { t: ptr(e.t), f: e.a };
        }
        if (x.op === '*') {
            const e = rv(cexpr(x.a));
            if (!isPtr(e.t)) throw cerr("* (간접 참조)는 포인터에만 쓸 수 있어요. '" + typeName(e.t) + "' 형이에요.", x.line);
            const t = e.t.to; const fa = e.f;
            if (t.k === 'func') return { t, f: fa };
            if (t.k === 'void') throw cerr('void 포인터는 바로 * 로 읽을 수 없어요. 먼저 형 변환하세요.', x.line);
            if (t.k === 'arr' || t.k === 'struct') return { t, a: fa, f: fa };
            const l = ld(t);
            return { t, a: fa, f: () => l(fa()) };
        }
        const e = rv(cexpr(x.a));
        if (x.op === '!') { const f = e.f; return { t: T.int, f: () => (f() ? 0 : 1) }; }
        if (!isArith(e.t)) throw cerr(x.op + ' 연산은 숫자에만 쓸 수 있어요.', x.line);
        const rt = promote(e.t);
        const f = wrapConv(e.f, conv(e.t, rt));
        if (x.op === '+') return { t: rt, f };
        if (x.op === '-') return { t: rt, f: arithOp('-', rt, () => 0, f, x.line) };
        if (x.op === '~') { if (!isInt(rt)) throw cerr('~ 는 정수에만 쓸 수 있어요.', x.line); return { t: rt, f: arithOp('^', rt, f, () => -1, x.line) }; }
        throw cerr('알 수 없는 연산자', x.line);
    }

    function cincdec(x) {
        const e = cexpr(x.a);
        lvalueOnly(e, x.line, x.op);
        const t = e.t, la = e.a, l = ld(t), s = st(t);
        const d = (x.op === '++' ? 1 : -1) * (isPtr(t) ? (t.to.size || 1) : 1);
        let c = isPtr(t) ? null : convFn(t);
        if (t.k === 'float' && t.size === 8) c = null;
        if (x.n === 'pre') return { t, f: () => { const a = la(); let v = l(a) + d; if (c) v = c(v); s(a, v); return v; } };
        return { t, f: () => { const a = la(); const old = l(a); let v = old + d; if (c) v = c(v); s(a, v); return old; } };
    }

    function argPass(argExprs, ptypes, line, fname) {
        return argExprs.map((ae, i) => {
            const e = cexpr(ae);
            if (i < ptypes.length) {
                const pt = ptypes[i];
                if (pt.k === 'struct') { const f = assignConv(e, pt, line); return { f, t: pt }; }
                const r = rv(e);
                if (isPtr(pt) && isArith(r.t) && !(r.t.k === 'int' && ae.n === 'num' && ae.v === 0)) {
                    throw cerr("함수 '" + fname + "' 의 " + (i + 1) + "번째 인수는 주소(포인터)여야 해요. & 나 배열 이름을 넘겼는지 확인하세요.", line);
                }
                if (isArith(pt) && isPtr(r.t)) throw cerr("함수 '" + fname + "' 의 " + (i + 1) + "번째 인수는 값이어야 하는데 주소(배열/포인터)를 넘겼어요.", line);
                return { f: assignConv(e, pt, line), t: pt };
            }
            const r = rv(e);
            if (r.t.k === 'float' && r.t.size === 4) return { f: r.f, t: T.double };
            return { f: r.f, t: promote(r.t) };
        });
    }

    function callUser(fn, vals) {
        const def = fn.def;
        if (!def || !fn.body) throw rerr("함수 '" + fn.name + "' 의 몸체(정의)가 없어요.", LINE);
        if (++steps > nextCheck) checkTime();
        const savedBP = BP, savedSP = SP, savedLine = LINE;
        const nbp = Math.ceil(SP / 16) * 16;
        if (nbp + fn.frame > STACK_END) throw rerr('스택 오버플로: 재귀 호출이 너무 깊어요. 종료 조건(기저 사례)을 확인하세요.', LINE);
        u8.fill(0, nbp, nbp + fn.frame);
        BP = nbp; SP = nbp + fn.frame;
        const pt = fn.ptypes;
        for (let i = 0; i < pt.length; i++) {
            if (pt[i].k === 'struct') memcpy(BP + fn.poffs[i], vals[i], pt[i].size);
            else fn.pst[i](BP + fn.poffs[i], vals[i]);
        }
        RET = 0;
        const r = fn.body();
        let ret = RET;
        if (fn.retStruct && r === SIG_RET) {
            if (scratchPos + fn.type.ret.size > SCRATCH) scratchPos = 0;
            const d = scratch + scratchPos; scratchPos += Math.ceil(fn.type.ret.size / 8) * 8;
            memcpy(d, ret, fn.type.ret.size); ret = d;
        }
        BP = savedBP; SP = savedSP; LINE = savedLine;
        return ret;
    }
    function callPtr(h, vals) {
        const fn = fnList[h - FN_BASE];
        if (!fn) throw rerr('잘못된 함수 포인터를 호출했어요.', LINE);
        return callUser(fn, vals);
    }

    function ccall(x) {
        const fe = x.f;
        if (fe.n === 'id' && !lookup(fe.name)) {
            const fn = funcs.get(fe.name);
            if (fn) {
                const ft = fn.type;
                if (ft.params.length !== x.args.length && !ft.variadic && !(ft.params.length === 0 && !fn.def?.type.pnames?.length && false)) {
                    if (!(ft.params.length === 0 && x.args.length > 0 && !fn.def)) throw cerr("함수 '" + fe.name + "' 는 인수가 " + ft.params.length + "개인데 " + x.args.length + "개를 넘겼어요.", x.line);
                }
                const args = argPass(x.args, ft.params, x.line, fe.name).map((a) => a.f);
                const n = args.length;
                const rt = ft.ret;
                return { t: rt.k === 'struct' ? rt : rt, a: rt.k === 'struct' ? undefined : undefined, f: () => {
                    const vals = new Array(n); for (let i = 0; i < n; i++) vals[i] = args[i]();
                    return callUser(fn, vals);
                }, isStructRet: rt.k === 'struct' };
            }
            const b = B[fe.name];
            if (b) {
                const args = argPass(x.args, [], x.line, fe.name);
                const fs = args.map((a) => a.f), ts = args.map((a) => a.t);
                const n = fs.length, bf = b.fn;
                if (fe.name === 'scanf' || fe.name === 'scanf_s' || fe.name === 'fscanf' || fe.name === 'sscanf') {
                    // & 빠짐 검사: 서식 이후 인수는 포인터여야 함
                    const start = fe.name === 'scanf' || fe.name === 'scanf_s' ? 1 : 2;
                    for (let i = start; i < ts.length; i++) {
                        if (!isPtr(ts[i]) && !(fe.name === 'scanf_s' && isInt(ts[i]))) throw cerr(fe.name + " 의 " + (i + 1) + "번째 인수 앞에 & 를 빠뜨린 것 같아요. (예: scanf(\"%d\", &a))", x.line);
                    }
                }
                if (n > 0 && ['printf', 'puts', 'scanf', 'strlen', 'strcpy', 'strcmp', 'strcat', 'gets', 'fgets', 'atoi', 'atof'].includes(fe.name)) {
                    if (!isPtr(ts[0])) throw cerr("'" + fe.name + "' 의 첫 번째 인수는 문자열(주소)이어야 해요." + (fe.name === 'printf' ? ' 예: printf("%d", a)' : ''), x.line);
                }
                let rt = b.ret;
                return { t: rt, f: () => {
                    const vals = new Array(n); for (let i = 0; i < n; i++) vals[i] = fs[i]();
                    const r = bf(vals, ts);
                    return r === undefined ? 0 : r;
                } };
            }
            throw cerr("'" + fe.name + "' 함수를 찾을 수 없어요. 함수 이름 철자나 함수 정의를 확인하세요.", x.line);
        }
        // 함수 포인터 호출
        const e = rv(cexpr(fe));
        let ft = e.t;
        if (isPtr(ft)) ft = ft.to;
        if (!ft || ft.k !== 'func') throw cerr('함수가 아닌 것을 호출했어요.', x.line);
        const args = argPass(x.args, ft.params, x.line, '포인터').map((a) => a.f);
        const ff = e.f, n = args.length;
        return { t: ft.ret, f: () => { const vals = new Array(n); for (let i = 0; i < n; i++) vals[i] = args[i](); return callPtr(ff(), vals); } };
    }

    /* 초기화 */
    function cinit(t, init, addrF, line) {
        // 반환: 실행 시 초기화하는 함수
        if (t.k === 'arr') {
            const et = t.of;
            if (init.n === 'str' && et.k === 'int' && et.size === 1) {
                const bytes = init.bytes; const n = t.len;
                if (bytes.length > n) throw cerr('문자열이 배열 크기보다 길어요. (널 문자 \\0 자리까지 필요해요)', line);
                return () => { const a = addrF(); u8.fill(0, a, a + n); for (let i = 0; i < bytes.length; i++) u8[a + i] = bytes[i]; };
            }
            if (init.n !== 'init') throw cerr('배열은 { } 로 초기화해야 해요.', line);
            const items = init.items;
            // 평탄 초기화 지원 (int a[2][3] = {1,2,3,4,5,6})
            const parts = [];
            let idx = 0;
            if (et.k === 'arr' || et.k === 'struct') {
                const flatAll = items.every((it) => it.n !== 'init' && !(it.n === 'str' && et.k === 'arr'));
                if (flatAll && items.length && et.k === 'arr') {
                    const leaf = []; let lt = t; while (lt.k === 'arr') lt = lt.of;
                    const total = t.size / lt.size;
                    if (items.length > total) throw cerr('초기값이 배열 크기보다 많아요.', line);
                    items.forEach((it, k) => { const ae = assignConv(cexpr(it), lt, line); const s = st(lt); const off = k * lt.size; leaf.push(() => s(addrF() + off, ae())); });
                    const size = t.size;
                    return () => { const a = addrF(); u8.fill(0, a, a + size); for (const f of leaf) f(); };
                }
                if (flatAll && items.length && et.k === 'struct') {
                    // 구조체 배열 평탄 초기화: 묶어서 처리
                    const nf = et.fields.length; const groups = [];
                    for (let k = 0; k < items.length; k += nf) groups.push({ n: 'init', items: items.slice(k, k + nf), line });
                    groups.forEach((g, k) => { const off = k * et.size; parts.push(cinit(et, g, () => addrF() + off, line)); });
                    idx = groups.length;
                }
            }
            if (!parts.length) {
                for (const it of items) {
                    if (t.len !== null && idx >= t.len) throw cerr('초기값이 배열 크기(' + t.len + ')보다 많아요.', line);
                    const off = idx * et.size;
                    parts.push(cinit(et, it, () => addrF() + off, line));
                    idx++;
                }
            }
            const size = t.size;
            return () => { const a = addrF(); u8.fill(0, a, a + size); for (const f of parts) f(); };
        }
        if (t.k === 'struct') {
            if (init.n !== 'init') { const f = assignConv(cexpr(init), t, line); const sz = t.size; return () => memcpy(addrF(), f(), sz); }
            const parts = [];
            init.items.forEach((it, k) => {
                const fld = t.fields[k]; if (!fld) throw cerr('구조체 초기값이 멤버 수보다 많아요.', line);
                const off = fld.off;
                parts.push(cinit(fld.type, it, () => addrF() + off, line));
            });
            const size = t.size;
            return () => { const a = addrF(); u8.fill(0, a, a + size); for (const f of parts) f(); };
        }
        if (init.n === 'init') { if (!init.items.length) { const s = st(t); return () => s(addrF(), 0); } init = init.items[0]; }
        const f = assignConv(cexpr(init), t, line);
        const s = st(t);
        return () => s(addrF(), f());
    }
    function fixArrLen(t, init) {
        if (t.k === 'arr' && t.len === null) {
            if (!init) throw cerr('배열 크기를 정하지 않았으면 초기값이 있어야 해요.', 0);
            let n;
            if (init.n === 'str') n = init.bytes.length + 1;
            else if (init.n === 'init') {
                n = init.items.length;
                if (t.of.k === 'struct' && init.items.every((i) => i.n !== 'init')) n = Math.ceil(n / t.of.fields.length);
                else if (t.of.k === 'arr' && init.items.every((i) => i.n !== 'init' && i.n !== 'str')) n = Math.ceil(n / (t.of.size / leafOf(t.of).size));
            } else throw cerr('배열 초기값이 올바르지 않아요.', 0);
            return arr(t.of, n);
        }
        return t;
    }
    const leafOf = (t) => { while (t.k === 'arr') t = t.of; return t; };

    /* 문장 컴파일 */
    function cstmt(s) {
        const line = s.line;
        switch (s.n) {
            case 'empty': return () => 0;
            case 'expr': {
                const f = cexpr(s.e).f;
                return () => { LINE = line; f(); return 0; };
            }
            case 'decl': {
                const fs = [];
                for (const d of s.decls) {
                    let t = fixArrLen(d.type, d.init);
                    if (t.k === 'void') throw cerr("변수를 void 형으로 선언할 수 없어요.", d.line);
                    if (t.k === 'struct' && !t.complete) throw cerr('정의되지 않은 구조체 형이에요.', d.line);
                    if (scope.vars.has(d.name) && scope.vars.get(d.name).scopeTag === scope) throw cerr("변수 '" + d.name + "' 가 같은 범위에서 두 번 선언되었어요.", d.line);
                    if (d.storage === 'static') {
                        const addr = gAlloc(t.size, t.align);
                        scope.vars.set(d.name, { kind: 'g', addr, type: t, scopeTag: scope });
                        if (d.init) globalInits.push(cinit(t, d.init, () => addr, d.line));
                        continue;
                    }
                    const off = allocLocal(t);
                    const v = { kind: 'l', off, type: t, scopeTag: scope };
                    scope.vars.set(d.name, v);
                    if (d.init) {
                        const f = cinit(t, d.init, () => BP + off, d.line);
                        fs.push(() => { LINE = d.line; f(); });
                    }
                }
                if (!fs.length) return () => 0;
                return () => { for (let i = 0; i < fs.length; i++) fs[i](); return 0; };
            }
            case 'block': {
                const saved = scope; scope = { vars: new Map(), parent: saved };
                const fs = s.items.map(cstmt);
                scope = saved;
                const n = fs.length;
                return () => { for (let i = 0; i < n; i++) { const r = fs[i](); if (r) return r; } return 0; };
            }
            case 'if': {
                const c = rv(cexpr(s.c)).f; const t = cstmt(s.t); const f = s.f ? cstmt(s.f) : null;
                return () => { LINE = line; if (c()) return t(); return f ? f() : 0; };
            }
            case 'while': {
                const c = rv(cexpr(s.c)).f; loopDepth++; const b = cstmt(s.body); loopDepth--;
                return () => {
                    for (;;) {
                        LINE = line; if (!c()) break;
                        if (++steps > nextCheck) checkTime();
                        const r = b(); if (r === SIG_BREAK) break; if (r === SIG_RET) return r;
                    }
                    return 0;
                };
            }
            case 'dowhile': {
                loopDepth++; const b = cstmt(s.body); loopDepth--; const c = rv(cexpr(s.c)).f;
                return () => {
                    for (;;) {
                        if (++steps > nextCheck) checkTime();
                        const r = b(); if (r === SIG_BREAK) break; if (r === SIG_RET) return r;
                        LINE = line; if (!c()) break;
                    }
                    return 0;
                };
            }
            case 'for': {
                const saved = scope; scope = { vars: new Map(), parent: saved };
                const init = s.init ? cstmt(s.init) : null;
                const c = s.c ? rv(cexpr(s.c)).f : null;
                const step = s.step ? cexpr(s.step).f : null;
                loopDepth++; const b = cstmt(s.body); loopDepth--;
                scope = saved;
                return () => {
                    LINE = line;
                    if (init) init();
                    for (;;) {
                        if (c && !c()) break;
                        if (++steps > nextCheck) checkTime();
                        const r = b(); if (r === SIG_BREAK) break; if (r === SIG_RET) return r;
                        LINE = line;
                        if (step) step();
                    }
                    return 0;
                };
            }
            case 'return': {
                const rt = curFn.retType;
                if (!s.e) { if (rt.k !== 'void' && curFn.name !== 'main') { /* 허용 */ } return () => { RET = 0; return SIG_RET; }; }
                if (rt.k === 'void') { const f = cexpr(s.e).f; return () => { f(); RET = 0; return SIG_RET; }; }
                const f = assignConv(cexpr(s.e), rt, line, ' (반환형을 확인하세요)');
                return () => { LINE = line; RET = f(); return SIG_RET; };
            }
            case 'break': if (!loopDepth && !switchDepth) throw cerr('break 는 반복문이나 switch 안에서만 쓸 수 있어요.', line); return () => SIG_BREAK;
            case 'continue': if (!loopDepth) throw cerr('continue 는 반복문 안에서만 쓸 수 있어요.', line); return () => SIG_CONT;
            case 'case': case 'default': throw cerr((s.n === 'case' ? 'case' : 'default') + ' 는 switch 안에서만 쓸 수 있어요.', line);
            case 'switch': {
                const e = rv(cexpr(s.e));
                if (!isInt(e.t)) throw cerr('switch 의 값은 정수(또는 문자)여야 해요.', line);
                const ef = e.f;
                const body = s.body.n === 'block' ? s.body.items : [s.body];
                const saved = scope; scope = { vars: new Map(), parent: saved };
                switchDepth++;
                const labels = new Map(); let defIdx = -1; const fs = [];
                for (const it of body) {
                    if (it.n === 'case') { if (labels.has(it.v)) throw cerr('case ' + it.v + ' 가 중복되었어요.', it.line); labels.set(it.v, fs.length); continue; }
                    if (it.n === 'default') { defIdx = fs.length; continue; }
                    fs.push(cstmt(it));
                }
                switchDepth--; scope = saved;
                return () => {
                    LINE = line;
                    const v = ef();
                    let i = labels.has(v) ? labels.get(v) : defIdx;
                    if (i < 0) return 0;
                    for (; i < fs.length; i++) { const r = fs[i](); if (r === SIG_BREAK) return 0; if (r) return r; }
                    return 0;
                };
            }
        }
        throw cerr('지원하지 않는 문장이에요.', line);
    }

    // 전역 선언 처리 & 함수 컴파일 (선언 순서대로)
    scope = null;
    const pendingFns = [];
    for (const it of ast) {
        if (it.n === 'decl') {
            for (const d of it.decls) {
                const t = fixArrLen(d.type, d.init);
                if (t.k === 'void') throw cerr('변수를 void 형으로 선언할 수 없어요.', d.line);
                if (globals.has(d.name) && !['stdin', 'stdout', 'stderr'].includes(d.name)) {
                    if (!d.init) continue;
                }
                const addr = gAlloc(t.size, t.align);
                globals.set(d.name, { kind: 'g', addr, type: t });
                if (d.init) {
                    curFn = { frame: 0, name: '<global>', retType: T.void }; scope = { vars: new Map(), parent: null };
                    globalInits.push(cinit(t, d.init, () => addr, d.line));
                    scope = null; curFn = null;
                }
            }
        } else if (it.n === 'func') {
            // 함수는 전역 선언 순서와 무관하게 이후 모든 전역을 볼 수 있도록 나중에 컴파일하지 않고,
            // C 규칙대로 지금까지 선언된 전역만 보이게 하려면 즉시 컴파일. 학습용으로는 즉시 컴파일.
            compileFn(funcs.get(it.name));
        }
    }
    function compileFn(fn) {
        const d = fn.def;
        const ft = d.type;
        const retType = ft.ret;
        if (retType.k === 'arr') throw cerr('함수는 배열을 반환할 수 없어요.', d.line);
        curFn = { frame: 0, name: fn.name, retType };
        scope = { vars: new Map(), parent: null };
        fn.ptypes = ft.params; fn.poffs = []; fn.pst = [];
        ft.params.forEach((pt, i) => {
            const nm = d.pnames[i];
            const off = allocLocal(pt);
            fn.poffs.push(off); fn.pst.push(pt.k === 'struct' ? null : st(pt));
            if (nm) scope.vars.set(nm, { kind: 'l', off, type: pt, scopeTag: scope });
        });
        fn.retStruct = retType.k === 'struct';
        const body = cstmt({ n: 'block', items: d.body.items, line: d.body.line });
        fn.frame = Math.ceil(curFn.frame / 16) * 16;
        fn.body = body;
        scope = null; curFn = null;
    }

    const mainFn = funcs.get('main');
    if (!mainFn || !mainFn.def) throw cerr('main 함수가 없어요. int main() { ... } 를 만들어 주세요.', 1);
    for (const f of fnList) {
        if (!f.def) {
            // 호출되지 않는 원형은 무시. 호출되면 런타임 오류
            f.ptypes = f.type.params; f.poffs = []; f.pst = [];
        }
    }

    // 실행
    scratch = heapAlloc(SCRATCH);
    let exitCode = 0;
    const finish = () => {
        for (const [, s] of streams) if (s.fileOut) flushFile(s);
        if (redirectedOut) writtenFiles[redirectedOut.name] = new TextDecoder().decode(new Uint8Array(redirectedOut.out));
        return { output: new TextDecoder().decode(out.subarray(0, outLen)), files: writtenFiles, exitCode, time: Date.now() - t0 };
    };
    try {
        for (const g of globalInits) g();
        LINE = mainFn.line;
        const args = mainFn.type.params.length ? new Array(mainFn.type.params.length).fill(0) : [];
        exitCode = callUser(mainFn, args) | 0;
    } catch (e) {
        if (e instanceof ExitSignal) { exitCode = e.code | 0; return finish(); }
        if (e instanceof CError) { e.partial = finish(); if (!e.line) e.line = LINE; throw e; }
        if (e instanceof RangeError) { const ce = rerr('스택 오버플로: 재귀 호출이 너무 깊어요. 종료 조건을 확인하세요.', LINE); ce.partial = finish(); throw ce; }
        throw e;
    }
    return finish();
}

/* 공개 API: 결과 객체로 감싸 반환 */
function execute(src, opts) {
    try {
        const r = run(src, opts);
        return { ok: true, output: r.output, files: r.files, exitCode: r.exitCode, time: r.time };
    } catch (e) {
        if (e instanceof CError) {
            return { ok: false, kind: e.kind, message: e.message, line: e.line, output: e.partial ? e.partial.output : '', files: e.partial ? e.partial.files : {} };
        }
        return { ok: false, kind: 'internal', message: '실행기 내부 오류: ' + (e && e.message), line: 0, output: '' };
    }
}

export { execute, CError };
