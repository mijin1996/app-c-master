import { t } from '../i18n/index.js';
// 코드 에디터: 투명한 textarea 위에 색칠한 코드를 겹쳐 보여 준다(줄 번호, 자동 들여쓰기, 탭).
import { $, esc } from './dom.js';
import { smartEnter } from './editor-rules.js';
import { CodeStyle } from '../domain/brace-style.js';
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
/** styleOf(): 지금 언어의 스타일 ('allman' | 'knr' | 'pep8') — 토글로 바꾸면 바로 따라간다 */
export function mountEditor(host, initial, onChange, onSubmit, languageLabel = 'C (C11)', styleOf = () => CodeStyle.ALLMAN) {
    host.innerHTML = '<div class="editor"><div class="gutter" aria-hidden="true"></div><div class="edarea"><pre aria-hidden="true"><code></code></pre><textarea id="code-input" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" aria-label="코드 입력"></textarea></div></div>';
    const ta = $('textarea', host), pre = $('pre', host), code = $('code', host), gut = $('.gutter', host);
    ta.value = initial;
    ta.setAttribute('aria-label', t('editor.aria', { lang: languageLabel }));
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
        if (e.key === 'Enter' && !e.isComposing && !(e.ctrlKey || e.metaKey)) {
            // 언어 스타일대로 { 자리 · 들여쓰기 · 닫는 } 를 맞춘다 (editor-rules.js)
            e.preventDefault();
            const r = smartEnter(v, s, en, styleOf());
            ta.setRangeText(r.text, r.from, r.to, 'end');
            ta.selectionStart = ta.selectionEnd = r.caret;
            ta.dispatchEvent(new Event('input'));
            return;
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
