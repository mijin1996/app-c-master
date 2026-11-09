// 코드 에디터: 투명한 textarea 위에 색칠한 코드를 겹쳐 보여 준다(줄 번호, 자동 들여쓰기, 탭).
import { $, esc } from './dom.js';
const KWS = new Set(['if', 'else', 'while', 'do', 'for', 'return', 'break', 'continue', 'switch', 'case', 'default', 'sizeof', 'typedef', 'struct', 'const', 'static', 'enum', 'unsigned', 'signed', 'NULL', 'EOF', 'true', 'false']);
const TYPES = new Set(['int', 'char', 'double', 'float', 'long', 'short', 'void', 'bool', 'FILE', 'size_t']);
export function highlight(code) {
    const re = /(\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))|("(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)|(^[ \t]*#[^\n]*)|(\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?[uUlLfF]*\b)|([A-Za-z_]\w*)/gm;
    let out = '', last = 0, m;
    while ((m = re.exec(code))) {
        out += esc(code.slice(last, m.index));
        const s = esc(m[0]);
        if (m[1]) out += '<span class="tk-c">' + s + '</span>';
        else if (m[2]) out += '<span class="tk-s">' + s + '</span>';
        else if (m[3]) out += '<span class="tk-p">' + s + '</span>';
        else if (m[4]) out += '<span class="tk-n">' + s + '</span>';
        else if (TYPES.has(m[5])) out += '<span class="tk-t">' + s + '</span>';
        else if (KWS.has(m[5])) out += '<span class="tk-k">' + s + '</span>';
        else out += s;
        last = m.index + m[0].length;
    }
    return out + esc(code.slice(last)) + '\n';
}
export function mountEditor(host, initial, onChange, onSubmit, languageLabel = 'C (C11)') {
    host.innerHTML = '<div class="editor"><div class="gutter" aria-hidden="true"></div><div class="edarea"><pre aria-hidden="true"><code></code></pre><textarea id="code-input" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" aria-label="코드 입력"></textarea></div></div>';
    const ta = $('textarea', host), pre = $('pre', host), code = $('code', host), gut = $('.gutter', host);
    ta.value = initial;
    ta.setAttribute('aria-label', languageLabel + ' 코드 입력');
    const sync = () => {
        code.innerHTML = highlight(ta.value);
        const n = ta.value.split('\n').length; let g = ''; for (let i = 1; i <= n; i++) g += i + '\n'; gut.textContent = g;
        pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; gut.scrollTop = ta.scrollTop;
    };
    ta.addEventListener('input', () => { sync(); onChange && onChange(ta.value); });
    ta.addEventListener('scroll', () => { pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; gut.scrollTop = ta.scrollTop; });
    const insert = (txt, selStart, selEnd) => {
        ta.setRangeText(txt, selStart, selEnd, 'end'); ta.dispatchEvent(new Event('input'));
    };
    ta.addEventListener('keydown', (e) => {
        const s = ta.selectionStart, en = ta.selectionEnd, v = ta.value;
        if (e.key === 'Tab') {
            e.preventDefault();
            if (s !== en && v.slice(s, en).includes('\n')) {
                const ls = v.lastIndexOf('\n', s - 1) + 1; const block = v.slice(ls, en);
                const nb = e.shiftKey ? block.replace(/^ {1,4}/gm, '') : block.replace(/^/gm, '    ');
                ta.setRangeText(nb, ls, en, 'select'); ta.dispatchEvent(new Event('input'));
            } else if (!e.shiftKey) insert('    ', s, en);
            return;
        }
        if (e.key === 'Enter' && !e.isComposing) {
            e.preventDefault();
            const ls = v.lastIndexOf('\n', s - 1) + 1; const line = v.slice(ls, s);
            let ind = (line.match(/^[ \t]*/) || [''])[0];
            const prevCh = v.slice(0, s).trimEnd().slice(-1);
            if (prevCh === '{') ind += '    ';
            if (prevCh === '{' && v[en] === '}') { insert('\n' + ind + '\n' + ind.slice(4), s, en); ta.selectionStart = ta.selectionEnd = s + 1 + ind.length; return; }
            insert('\n' + ind, s, en); return;
        }
        if (e.key === '}' && s === en) {
            const ls = v.lastIndexOf('\n', s - 1) + 1; const line = v.slice(ls, s);
            if (/^ {4,}$/.test(line)) { e.preventDefault(); insert(line.slice(4) + '}', ls, s); return; }
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); if (onSubmit) onSubmit(); }
    });
    sync();
    return { get: () => ta.value, set: (v) => { ta.value = v; sync(); onChange && onChange(v); } };
}
