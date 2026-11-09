// C 코드 실행기(Runner). 같은 모양 runAsync(src, input, files)을 가진 두 가지:
// - WorkerJudgeRunner: 화면이 멈추지 않게 Web Worker에서 실행 (기본)
// - DirectJudgeRunner: 그 자리에서 바로 실행 (Worker를 못 쓰는 환경, 테스트)
import { execute } from './c-interpreter.js';

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
