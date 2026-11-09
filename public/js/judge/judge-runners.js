// C 코드 실행기(Runner). 같은 모양 runAsync(src, input, files)을 가진 두 가지:
// - WorkerJudgeRunner: 화면이 멈추지 않게 Web Worker에서 실행 (기본)
// - DirectJudgeRunner: 그 자리에서 바로 실행 (Worker를 못 쓰는 환경, 테스트)
import { execute } from './c-interpreter.js';
import { Failure } from '../core/result.js';
import { messageOf } from '../core/app-error.js';

const RUN_TIME_LIMIT_MS = 3000;      // 제출한 프로그램 1회 실행 제한
const WORKER_HARD_LIMIT_MS = 6000;   // 이 시간 안에 대답이 없으면 Worker를 끊는다

export class DirectJudgeRunner {
    async runAsync(src, input, files) {
        try {
            return execute(src, { input: input ?? '', files: files ?? {}, timeLimit: RUN_TIME_LIMIT_MS });
        } catch (e) {
            return { ok: false, kind: 'internal', message: '실행기를 시작하지 못했어요: ' + (e && e.message), output: '' };
        }
    }
}

export class WorkerJudgeRunner {
    #workerUrl;
    #fallback;
    #worker = null;
    #seq = 0;
    #waiting = new Map();
    #workerWorks = null; // null: 아직 모름, true/false

    constructor(workerUrl, fallback = new DirectJudgeRunner()) {
        this.#workerUrl = workerUrl;
        this.#fallback = fallback;
    }

    #start() {
        try {
            this.#worker = new Worker(this.#workerUrl, { type: 'module' });
            this.#worker.onmessage = (e) => {
                this.#workerWorks = true;
                const job = this.#waiting.get(e.data.id);
                if (job) {
                    clearTimeout(job.timer);
                    this.#waiting.delete(e.data.id);
                    job.resolve(e.data.result);
                }
            };
            this.#worker.onerror = () => {
                if (this.#workerWorks !== true) {
                    this.#giveUp();
                }
            };
        } catch (e) {
            this.#workerWorks = false;
            this.#worker = null;
        }
    }

    /** Worker를 못 쓰는 환경이면 남은 일을 바로 실행으로 넘긴다 */
    #giveUp() {
        this.#workerWorks = false;
        this.#worker?.terminate();
        this.#worker = null;
        const pending = [...this.#waiting.values()];
        this.#waiting.clear();
        for (const job of pending) {
            clearTimeout(job.timer);
            this.#fallback.runAsync(job.src, job.input, job.files).then(job.resolve);
        }
    }

    runAsync(src, input, files) {
        if (this.#workerWorks === false) {
            return this.#fallback.runAsync(src, input, files);
        }
        if (!this.#worker) {
            this.#start();
            if (!this.#worker) {
                return this.#fallback.runAsync(src, input, files);
            }
        }
        const id = ++this.#seq;
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                this.#waiting.delete(id);
                if (this.#workerWorks !== true) {
                    this.#giveUp();
                    this.#fallback.runAsync(src, input, files).then(resolve);
                    return;
                }
                this.#worker.terminate();          // 무한 반복이면 Worker째 끊는다
                this.#worker = null;
                resolve({ ok: false, kind: 'tle', message: '시간 초과: 프로그램이 끝나지 않았어요. 무한 반복이 없는지 확인하세요.', output: '' });
            }, WORKER_HARD_LIMIT_MS);
            this.#waiting.set(id, { resolve, timer, src, input, files });
            this.#worker.postMessage({ id, src, input: input ?? '', files: files ?? {} });
        });
    }
}

const PYTHON_RUN_LIMIT_MS = 10000;  // Python은 C보다 느려서 넉넉히 (채점 사이트들도 보통 더 준다)

/**
 * Python 실행기: Pyodide Worker에서 실행한다.
 * 처음에는 Pyodide를 받아 오느라 시간이 걸리므로, 준비가 끝난 뒤부터 시간을 잰다.
 */
export class PythonWorkerRunner {
    #workerUrl;
    #worker = null;
    #ready = null;
    #seq = 0;
    #waiting = new Map();

    constructor(workerUrl) {
        this.#workerUrl = workerUrl;
    }

    #start() {
        this.#worker = new Worker(this.#workerUrl, { type: 'module' });
        this.#worker.onmessage = (e) => {
            const job = this.#waiting.get(e.data.id);
            if (job) {
                this.#waiting.delete(e.data.id);
                clearTimeout(job.timer);
                job.resolve(e.data);
            }
        };
        this.#ready = this.#send({ type: 'warmup' }, 0).then((reply) => {
            if (!reply.ready) {
                throw new Error(reply.result?.message ?? 'Python 실행기 준비 실패');
            }
        });
        this.#ready.catch(() => {
            this.#reset();
        });
    }

    #send(message, limitMs) {
        const id = ++this.#seq;
        return new Promise((resolve) => {
            const timer = limitMs > 0 ? setTimeout(() => {
                this.#waiting.delete(id);
                this.#reset(); // 끝나지 않는 코드는 Worker째 끊고, 다음 실행 때 다시 준비한다
                resolve({ result: { ok: false, kind: 'tle', message: '시간 초과: 프로그램이 ' + (limitMs / 1000) + '초 안에 끝나지 않았어요.', output: '' } });
            }, limitMs) : null;
            this.#waiting.set(id, { resolve, timer });
            this.#worker.postMessage({ id, ...message });
        });
    }

    #reset() {
        this.#worker?.terminate();
        this.#worker = null;
        this.#ready = null;
    }

    /** 미리 받아 두기 (언어를 Python으로 바꾸는 순간 부른다) */
    async prepareAsync() {
        if (!this.#worker) {
            this.#start();
        }
        await this.#ready;
    }

    async runAsync(src, input) {
        try {
            await this.prepareAsync();
        } catch (e) {
            return { ok: false, kind: 'internal', message: 'Python 실행기를 받아 오지 못했어요. 인터넷 연결을 확인하고 다시 시도하세요.', output: '' };
        }
        const reply = await this.#send({ type: 'run', src, input: input ?? '' }, PYTHON_RUN_LIMIT_MS);
        return reply.result;
    }
}

/**
 * 서버 채점기 (C++ · Java 등 유료 언어). 채점 요청은 Repository에 맡긴다.
 * 지금은 서버 쪽이 꺼져 있어서 "준비 중" 메시지를 돌려준다.
 */
export class ServerJudgeRunner {
    #repository;
    #language;

    constructor(repository, language) {
        this.#repository = repository;
        this.#language = language;
    }

    async runAsync(src, input) {
        const ran = await this.#repository.runAsync(this.#language, src, input ?? '');
        if (ran instanceof Failure) {
            return { ok: false, kind: 'internal', message: messageOf(ran.error), output: '' };
        }
        return ran.data;
    }
}
