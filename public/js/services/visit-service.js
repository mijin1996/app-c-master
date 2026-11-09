// Service(화면 쪽): 하루 접속 수. 이번 방문(탭)에서 처음 열 때만 +1 하고, 새로고침 · 화면 이동은 숫자만 본다.
import { Failure } from '../core/result.js';

const COUNTED_KEY = 'cm-visit-counted';

export class VisitService {
    #repository;
    #store;
    #current = null;
    #loading = null;

    /**
     * @param {{recordAsync: Function, todayAsync: Function}} repository
     * @param {{getItem: Function, setItem: Function}} store 이번 방문(탭)만 기억하는 곳 (브라우저의 sessionStorage)
     */
    constructor(repository, store) {
        this.#repository = repository;
        this.#store = store;
    }

    /** 지금 알고 있는 숫자 (아직 모르면 null) — 화면을 다시 그릴 때 바로 쓴다 */
    get current() {
        return this.#current;
    }

    #counted() {
        try {
            return this.#store.getItem(COUNTED_KEY) === '1';
        } catch (e) {
            return false;
        }
    }

    #markCounted() {
        try {
            this.#store.setItem(COUNTED_KEY, '1');
        } catch (e) {
            // 저장을 못 하는 브라우저면 이번 화면에서만 기억한다
        }
    }

    /** @returns {Promise<Result>} 성공: { day, count } */
    loadAsync() {
        this.#loading ??= (async () => {
            const counted = this.#counted();
            const result = counted ? await this.#repository.todayAsync() : await this.#repository.recordAsync();
            if (result instanceof Failure) {
                this.#loading = null; // 실패하면 다음에 다시 시도 (센 것 표시도 남기지 않음)
                return result;
            }
            if (!counted) {
                this.#markCounted();
            }
            this.#current = result.data.count;
            return result;
        })();
        return this.#loading;
    }
}
