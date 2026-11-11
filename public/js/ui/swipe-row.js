// 밀어서 고르는 줄 (Vue Bits "Swipe Row" 스타일을 바닐라 JS 로 다시 만든 것, 보관함 버튼은 뺌).
// 줄을 왼쪽으로 밀면 뒤의 서랍에서 버튼이 나온다. 끝까지 밀면 첫 버튼을 바로 실행한다.
// 그냥 누르면 원래 링크(문제 열기)로 간다. 키보드: ← 열기, → · Esc 닫기, Delete 첫 버튼(지우기) 실행.
import { esc } from './dom.js';
import { t } from '../i18n/index.js';
import { SWIPE, shouldStartDrag, resist, commitPoint, settle } from './swipe-row-rules.js';

const SNAP_MS = 300;
const COLLAPSE_MS = 200;
let openRow = null; // 한 번에 하나만 열어 둔다

export function swipeRowHtml({ id, href, contentHtml, actions }) {
    return '<div class="swipe-row" data-id="' + esc(id) + '" style="--drawer:' + actions.length * SWIPE.ACTION_WIDTH + 'px">' +
        '<div class="swipe-drawer">' + actions.map((a, i) => '<button type="button" class="swipe-action ' + a.tone + (i === 0 ? ' primary' : '') + '" data-action="' + a.id + '" tabindex="-1">' +
            '<span class="swipe-icon" aria-hidden="true">' + a.icon + '</span><span class="swipe-label">' + esc(t(a.labelKey)) + '</span></button>').join('') + '</div>' +
        '<a class="swipe-front" href="' + esc(href) + '" draggable="false">' + contentHtml + '</a></div>';
}

/**
 * @param {HTMLElement} row .swipe-row
 * @param {{ actions: {id:string, dismiss:boolean}[], onAction: (id: string) => void }} options
 */
export function bindSwipeRow(row, { actions, onAction }) {
    const front = row.querySelector('.swipe-front');
    const drawerWidth = actions.length * SWIPE.ACTION_WIDTH;
    let offset = 0;
    let start = null;
    let dragging = false;
    let moved = false;

    const place = (x, animate) => {
        offset = x;
        front.style.transition = animate ? 'transform ' + SNAP_MS + 'ms cubic-bezier(.2,.9,.3,1)' : 'none';
        front.style.transform = 'translateX(' + x + 'px)';
        row.style.setProperty('--pulled', Math.max(0, -x) + 'px');
        row.classList.toggle('committing', -x >= commitPoint(row.clientWidth, drawerWidth));
    };
    const close = () => {
        place(0, true);
        row.classList.remove('open');
        if (openRow === row) {
            openRow = null;
        }
    };
    const open = () => {
        if (openRow && openRow !== row) {
            openRow.dispatchEvent(new Event('swipe-close'));
        }
        openRow = row;
        row.classList.add('open');
        place(-drawerWidth, true);
    };
    const run = (action) => {
        if (action.dismiss) {
            // 줄을 화면 밖으로 밀고, 높이를 접은 뒤 실행
            place(-row.clientWidth, true);
            setTimeout(() => {
                row.style.height = row.offsetHeight + 'px';
                void row.offsetHeight;
                row.classList.add('collapsing');
                row.style.height = '0px';
                setTimeout(() => onAction(action.id, row), COLLAPSE_MS);
            }, SNAP_MS);
            return;
        }
        close();
        onAction(action.id, row);
    };

    row.addEventListener('swipe-close', close);
    row.querySelectorAll('[data-action]').forEach((button) => {
        button.onclick = () => run(actions.find((a) => a.id === button.dataset.action));
    });

    front.addEventListener('pointerdown', (event) => {
        start = { x: event.clientX, y: event.clientY, time: performance.now(), base: offset };
        dragging = false;
        moved = false;
    });
    front.addEventListener('pointermove', (event) => {
        if (!start) {
            return;
        }
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (!dragging && shouldStartDrag(dx, dy)) {
            dragging = true;
            moved = true;
            front.setPointerCapture(event.pointerId);
        }
        if (dragging) {
            event.preventDefault();
            place(resist(start.base + dx, drawerWidth), false);
        }
    });
    const release = (event) => {
        if (!start) {
            return;
        }
        if (dragging) {
            const seconds = Math.max(0.001, (performance.now() - start.time) / 1000);
            const velocity = (event.clientX - start.x) / seconds;
            const state = settle(offset, velocity, drawerWidth, commitPoint(row.clientWidth, drawerWidth));
            if (state === 'commit') {
                run(actions[0]);
            } else if (state === 'open') {
                open();
            } else {
                close();
            }
        }
        start = null;
        dragging = false;
    };
    front.addEventListener('pointerup', release);
    front.addEventListener('pointercancel', release);
    // 밀었을 때는 링크로 넘어가지 않게, 열려 있을 때 누르면 닫기만
    front.addEventListener('click', (event) => {
        if (moved || row.classList.contains('open')) {
            event.preventDefault();
            if (!moved) {
                close();
            }
        }
        moved = false;
    });
    front.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            open();
        } else if (event.key === 'ArrowRight' || event.key === 'Escape') {
            close();
        } else if ((event.key === 'Delete' || event.key === 'Backspace') && row.classList.contains('open') && actions[0].dismiss) {
            event.preventDefault();
            run(actions[0]);
        }
    });
}
