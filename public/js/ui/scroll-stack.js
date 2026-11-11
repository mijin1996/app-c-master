// 카드가 스크롤하면 위에 차곡차곡 쌓이는 움직임 (Scroll Stack 느낌). "앱처럼 써 봐요" 안내창과 모든 고르기 창이 같이 쓴다.
// 카드(.stack-card)는 CSS sticky 로 붙고, 여기서는 뒤 카드가 덮은 만큼 앞 카드를 살짝 작고 어둡게 만든다.
import { stackScale, endSpace } from './install-guide-rules.js';

/**
 * @param {HTMLElement} scroller .stack-scroller (안에 .stack-card 들과 맨 끝 .stack-end)
 * @param {(index: number) => number} stickyTopOf 카드마다 붙는 높이(px)
 */
export function bindScrollStack(scroller, stickyTopOf) {
    const cards = [...scroller.querySelectorAll('.stack-card')];
    if (cards.length === 0) {
        return;
    }
    const update = () => {
        const box = scroller.getBoundingClientRect();
        cards.forEach((card, i) => {
            const rect = card.getBoundingClientRect();
            let covered = 0;
            for (let j = i + 1; j < cards.length; j++) {
                const next = cards[j].getBoundingClientRect();
                covered += Math.min(1, Math.max(0, (rect.bottom - next.top) / rect.height));
            }
            const scale = stackScale(covered);
            card.style.transform = 'scale(' + scale + ')';
            card.style.filter = 'brightness(' + (1 - (1 - scale) * 1.5) + ')';
            card.dataset.stuck = rect.top - box.top <= stickyTopOf(i) + 1 ? '1' : '0';
        });
    };
    // 마지막 카드도 위로 올라가 쌓이게, 끝에 빈 자리를 둔다 (화면 크기 · 글 길이에 맞게 저절로)
    const spacer = scroller.querySelector('.stack-end');
    const fitEnd = () => {
        if (!scroller.isConnected) {
            return;
        }
        const last = cards[cards.length - 1];
        const padding = parseFloat(getComputedStyle(scroller).paddingBottom) || 0;
        if (spacer) {
            spacer.style.height = endSpace(scroller.clientHeight - padding, last.offsetHeight, stickyTopOf(cards.length - 1)) + 'px';
        }
        update();
    };
    scroller.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    addEventListener('resize', fitEnd);
    // 글꼴이 늦게 들어와 카드 높이가 바뀌어도 다시 잰다
    if (typeof ResizeObserver === 'function') {
        const watcher = new ResizeObserver(() => fitEnd());
        cards.forEach((card) => watcher.observe(card));
        watcher.observe(scroller);
    }
    fitEnd();
}
