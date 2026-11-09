// Web Worker: Pyodide(브라우저에서 돌아가는 CPython)로 학생의 Python 코드를 실행한다.
// Pyodide는 처음 한 번만 받아 오고(약 10MB, 브라우저가 캐시), 그다음부터는 바로 실행한다.
const PYODIDE_VERSION = '0.27.2';
const PYODIDE_URL = 'https://cdn.jsdelivr.net/npm/pyodide@' + PYODIDE_VERSION + '/';

let readyPromise = null;
let runner = null;

function loadAsync() {
    if (!readyPromise) {
        readyPromise = (async () => {
            const { loadPyodide } = await import(PYODIDE_URL + 'pyodide.mjs');
            const pyodide = await loadPyodide({ indexURL: PYODIDE_URL });
            const harness = await (await fetch(new URL('./python-harness.py', import.meta.url))).text();
            pyodide.runPython(harness);
            runner = pyodide.globals.get('cm_run');
        })();
    }
    return readyPromise;
}

self.onmessage = async (event) => {
    const { id, type, src, input } = event.data;
    try {
        await loadAsync();
    } catch (e) {
        self.postMessage({ id, result: { ok: false, kind: 'internal', message: 'Python 실행기를 받아 오지 못했어요. 인터넷 연결을 확인하세요.', output: '' } });
        return;
    }
    if (type === 'warmup') {
        self.postMessage({ id, ready: true });
        return;
    }
    const proxy = runner(src, input ?? '');
    const result = proxy.toJs({ dict_converter: Object.fromEntries });
    proxy.destroy();
    self.postMessage({ id, result });
};
