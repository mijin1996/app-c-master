// Web Worker: 화면과 따로 C 코드를 실행한다
import { execute } from './c-interpreter.js';

const RUN_TIME_LIMIT_MS = 3000;

self.onmessage = (event) => {
    const { id, src, input, files } = event.data;
    const result = execute(src, { input, files, timeLimit: RUN_TIME_LIMIT_MS });
    self.postMessage({ id, result });
};
