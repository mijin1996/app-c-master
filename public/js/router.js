// 주소 끝(#map, #p1001, #quiz3 …)에 맞는 화면을 그린다.
// 화면이 정리 함수(타이머 끄기 등)를 돌려주면 다음 화면으로 갈 때 불러 준다.
export class Router {
    #routes;
    #fallback;
    #cleanup = null;

    /**
     * @param {Array<[RegExp, (match: RegExpMatchArray) => (void|Function)]>} routes
     * @param {string} fallback 맞는 주소가 없을 때 갈 곳
     */
    constructor(routes, fallback) {
        this.#routes = routes;
        this.#fallback = fallback;
    }

    start() {
        window.addEventListener('hashchange', () => this.refresh());
        this.refresh();
    }

    go(name) {
        if (location.hash === '#' + name) {
            this.refresh();
        } else {
            location.hash = name;
        }
    }

    refresh() {
        if (this.#cleanup) {
            this.#cleanup();
            this.#cleanup = null;
        }
        window.scrollTo(0, 0);
        const name = location.hash.slice(1) || this.#fallback;
        for (const [pattern, render] of this.#routes) {
            const match = name.match(pattern);
            if (match) {
                const cleanup = render(match);
                this.#cleanup = typeof cleanup === 'function' ? cleanup : null;
                return;
            }
        }
        this.go(this.#fallback);
    }
}
