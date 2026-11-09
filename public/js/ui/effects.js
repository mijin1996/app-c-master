// 화면 효과 모음. Vue Bits의 Click Spark · Rotating Text · Fuse Button을 보고 느낌만 참고해
// 바닐라 자바스크립트로 새로 만들었다 (원본 코드를 옮기지 않음). 움직임 줄이기 설정을 켠 사람에게는 조용히 보여 준다.
const SVG_NS = 'http://www.w3.org/2000/svg';

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

// ---------- 1. 클릭 불꽃 (Click Spark) ----------
const SPARK_COUNT = 8;
const SPARK_RADIUS = 18;
const SPARK_LENGTH = 9;
const SPARK_MS = 420;

/** 화면 어디를 누르든 누른 자리에서 짧은 선이 둥글게 튀어 나간다 */
export function installClickSpark(root = document) {
    const canvas = document.createElement('canvas');
    canvas.className = 'spark-layer';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const sparks = [];
    let running = false;

    const resize = () => {
        const ratio = window.devicePixelRatio || 1;
        canvas.width = Math.round(innerWidth * ratio);
        canvas.height = Math.round(innerHeight * ratio);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();
    addEventListener('resize', resize);

    const draw = (time) => {
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        for (let i = sparks.length - 1; i >= 0; i--) {
            const s = sparks[i];
            const t = (time - s.born) / SPARK_MS;
            if (t >= 1) {
                sparks.splice(i, 1);
                continue;
            }
            const ease = 1 - (1 - t) * (1 - t); // 처음엔 빠르게, 끝에서 천천히
            const dist = ease * SPARK_RADIUS;
            const len = SPARK_LENGTH * (1 - ease);
            ctx.strokeStyle = s.color;
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            for (let k = 0; k < SPARK_COUNT; k++) {
                const angle = (Math.PI * 2 * k) / SPARK_COUNT;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                ctx.beginPath();
                ctx.moveTo(s.x + cos * dist, s.y + sin * dist);
                ctx.lineTo(s.x + cos * (dist + len), s.y + sin * (dist + len));
                ctx.stroke();
            }
        }
        if (sparks.length > 0) {
            requestAnimationFrame(draw);
        } else {
            running = false;
        }
    };

    root.addEventListener('pointerdown', (event) => {
        if (event.button !== 0 || reduceMotion()) {
            return;
        }
        const color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#f0643a';
        sparks.push({ x: event.clientX, y: event.clientY, born: performance.now(), color });
        if (!running) {
            running = true;
            requestAnimationFrame(draw);
        }
    }, { passive: true });
}

// ---------- 2. 버튼 도화선 (Fuse) ----------
const FUSE_MS = 650;
const BUTTON_SELECTOR = '.btn, .iconbtn, .like-btn, .tabs button, .credits-link';

/** 둥근 테두리를 따라 불붙은 선이 한 바퀴 타들어 가는 모양을 버튼 위에 그린다 */
function burnFuse(button, durationMs, className = 'fuse-rim') {
    button.querySelector(':scope > .' + className)?.remove();
    const rect = button.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
        return null;
    }
    const radius = parseFloat(getComputedStyle(button).borderTopLeftRadius) || 8;
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', className);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('viewBox', '0 0 ' + rect.width + ' ' + rect.height);
    const rim = document.createElementNS(SVG_NS, 'rect');
    const inset = 1;
    rim.setAttribute('x', inset);
    rim.setAttribute('y', inset);
    rim.setAttribute('width', Math.max(0, rect.width - inset * 2));
    rim.setAttribute('height', Math.max(0, rect.height - inset * 2));
    rim.setAttribute('rx', Math.min(radius, rect.height / 2));
    rim.setAttribute('pathLength', '100');
    svg.appendChild(rim);
    svg.style.setProperty('--fuse-ms', durationMs + 'ms');
    button.appendChild(svg);
    return svg;
}

export function installFuseButtons(root = document) {
    root.addEventListener('pointerdown', (event) => {
        const button = event.target.closest?.(BUTTON_SELECTOR);
        if (!button || button.disabled || reduceMotion()) {
            return;
        }
        const svg = burnFuse(button, FUSE_MS);
        if (svg) {
            setTimeout(() => svg.remove(), FUSE_MS + 50);
        }
    }, { passive: true });
}

/**
 * 되돌릴 수 있는 버튼 (Fuse Button의 원래 쓰임새): 누르면 도화선이 타는 동안 "되돌리기"가 되고,
 * 다 타면 그때 실제로 실행한다. 지우기처럼 되돌릴 수 없는 일에 쓴다.
 * @param {HTMLButtonElement} button
 * @param {{ undoMs?: number, armedLabel?: string, onCommitAsync: () => Promise<void> }} options
 */
export function makeFuseUndoButton(button, { undoMs = 4000, armedLabel = '되돌리기', onCommitAsync }) {
    const idleLabel = button.textContent;
    let timer = null;
    let svg = null;
    let countdown = null;
    const reset = () => {
        clearTimeout(timer);
        clearInterval(countdown);
        timer = null;
        svg?.remove();
        button.classList.remove('armed');
        button.textContent = idleLabel;
    };
    button.addEventListener('click', () => {
        if (timer) {
            reset(); // 도화선이 타는 동안 다시 누르면 취소
            return;
        }
        let left = Math.ceil(undoMs / 1000);
        button.classList.add('armed');
        button.textContent = armedLabel + ' ' + left;
        svg = burnFuse(button, undoMs, 'fuse-rim fuse-long');
        countdown = setInterval(() => {
            left--;
            button.textContent = armedLabel + ' ' + Math.max(0, left);
            if (svg) {
                button.appendChild(svg); // 글자를 바꿔도 도화선은 남긴다
            }
        }, 1000);
        timer = setTimeout(async () => {
            clearInterval(countdown);
            svg?.remove();
            timer = null;
            await onCommitAsync();
        }, undoMs);
    });
    button.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && timer) {
            reset();
        }
    });
}

// ---------- 3. 레벨 업 회전 글자 (Rotating Text) ----------
const ROTATE_STEP_MS = 900;
const LETTER_STAGGER_MS = 35;

/** 화면 전체를 잠깐 덮고, 글자가 한 자씩 아래에서 올라오며 문구가 차례로 바뀐다 */
export function showLevelUpOverlay(level, words = ['LEVEL UP!', '레벨 ' + level, '계속 가 볼까요?']) {
    document.querySelector('.levelup-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.className = 'levelup-overlay';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.innerHTML = '<div class="lu-box"><span class="lu-label">레벨 업</span><span class="lu-word" aria-hidden="true"></span>' +
        '<span class="sr-only">레벨 ' + level + '이 되었어요</span></div>';
    document.body.appendChild(overlay);
    const wordBox = overlay.querySelector('.lu-word');
    const calm = reduceMotion();

    const showWord = (word) => {
        wordBox.innerHTML = '';
        [...word].forEach((ch, i) => {
            const span = document.createElement('span');
            span.className = 'lu-ch';
            span.textContent = ch === ' ' ? ' ' : ch;
            span.style.animationDelay = calm ? '0ms' : (i * LETTER_STAGGER_MS) + 'ms';
            wordBox.appendChild(span);
        });
    };

    const close = () => {
        overlay.classList.add('out');
        setTimeout(() => overlay.remove(), 350);
    };
    overlay.addEventListener('click', close);

    words.forEach((word, i) => {
        setTimeout(() => {
            if (overlay.isConnected) {
                showWord(word);
            }
        }, i * ROTATE_STEP_MS);
    });
    setTimeout(close, words.length * ROTATE_STEP_MS + 300);
    return overlay;
}
