// 화면 효과 모음. Vue Bits의 Click Spark · Rotating Text · Sling Button · Fuse Button을 보고 느낌만 참고해
// 바닐라 자바스크립트로 새로 만들었다 (원본 코드를 옮기지 않음). 움직임 줄이기 설정을 켠 사람에게는 조용히 보여 준다.
import { launchOf, burstParticles, springKeyframes } from './sling-math.js';
import { t } from '../i18n/index.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
// 새총 효과를 받는 버튼들 (화면 클릭 불꽃은 이 위에서는 쉬어요)
const BUTTON_SELECTOR = '.btn, .iconbtn, .tabs button, .credits-link, .opt, .lesson-card';

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
        if (event.button !== 0 || reduceMotion() || event.target.closest?.(BUTTON_SELECTOR)) {
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

// ---------- 2. 새총 버튼 (Sling) ----------
const SLING_RETURN_MS = 460;
const SLING_RECOIL = 0.2;
const SLING_PARTICLES = 14;
const SLING_SPREAD = Math.PI / 3; // 60°
const SLING_FLIGHT = 70;          // 버튼용이라 원본(120px)보다 짧게
const SLING_KEY_POWER = 0.5;      // 키보드(Enter · Space)로 눌렀을 때 세기

let slingLayer = null;
function layer() {
    if (!slingLayer || !slingLayer.isConnected) {
        slingLayer = document.createElement('div');
        slingLayer.className = 'sling-layer';
        slingLayer.setAttribute('aria-hidden', 'true');
        document.body.appendChild(slingLayer);
    }
    return slingLayer;
}

/** 버튼 가장자리에서 발사 방향으로 입자를 흩뿌린다 */
function burst(button, angle, power) {
    const rect = button.getBoundingClientRect();
    if (rect.width === 0) {
        return;
    }
    const color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#f0643a';
    // 가운데에서 발사 방향으로 버튼 반지름만큼 나간 곳 (버튼 테두리 근처)
    const reach = Math.min(rect.width, rect.height) / 2;
    const ox = rect.left + rect.width / 2 + Math.cos(angle) * reach;
    const oy = rect.top + rect.height / 2 + Math.sin(angle) * reach;
    const box = layer();
    for (const p of burstParticles(SLING_PARTICLES, { angle, spread: SLING_SPREAD, flight: SLING_FLIGHT, power })) {
        const dot = document.createElement('i');
        dot.className = 'sling-dot';
        dot.style.cssText = 'left:' + ox + 'px;top:' + oy + 'px;width:' + p.size + 'px;height:' + p.size + 'px;background:' + color;
        box.appendChild(dot);
        const motion = dot.animate([
            { transform: 'translate(-50%, -50%) translate(0, 0) scale(1)', opacity: 1 },
            { transform: 'translate(-50%, -50%) translate(' + p.dx + 'px, ' + p.dy + 'px) scale(.3)', opacity: 0 },
        ], { duration: p.duration, delay: p.delay, easing: 'cubic-bezier(.15, .7, .3, 1)', fill: 'both' });
        motion.onfinish = () => dot.remove();
    }
}

/** 놓으면 스프링처럼 튕겼다가 제자리로 */
function springBack(button, pullX, pullY, recoil) {
    button.style.translate = '';
    button.classList.remove('sling-pull', 'sling-armed');
    const frames = springKeyframes(pullX, pullY, recoil).map((f) => ({ translate: f.x + 'px ' + f.y + 'px', offset: f.offset }));
    button.animate(frames, { duration: SLING_RETURN_MS, easing: 'ease-out' });
}

/**
 * 모든 버튼에 새총 효과: 누른 채로 끌면 버튼이 끈 쪽으로 살짝 끌려가고(고무줄),
 * 놓으면 반대쪽으로 튕기며 입자가 날아간다. 그냥 누르면 위쪽으로 작게 쏜다. 클릭 동작은 그대로다.
 */
export function installSlingButtons(root = document) {
    let active = null;
    let syntheticClick = false; // 새총이 대신 누른 클릭에는 키보드용 입자를 또 뿌리지 않는다

    root.addEventListener('pointerdown', (event) => {
        const button = event.target.closest?.(BUTTON_SELECTOR);
        if (!button || button.disabled || event.button !== 0 || reduceMotion()) {
            return;
        }
        active = { button, id: event.pointerId, x0: event.clientX, y0: event.clientY, launch: launchOf(0, 0) };
        button.classList.add('sling-pull');
    }, { passive: true });

    addEventListener('pointermove', (event) => {
        if (!active || event.pointerId !== active.id) {
            return;
        }
        active.launch = launchOf(event.clientX - active.x0, event.clientY - active.y0);
        active.button.style.translate = active.launch.pullX + 'px ' + active.launch.pullY + 'px';
        active.button.classList.toggle('sling-armed', active.launch.armed);
    }, { passive: true });

    const release = (fire) => (event) => {
        if (!active || event.pointerId !== active.id) {
            return;
        }
        const { button, launch } = active;
        active = null;
        springBack(button, launch.pullX, launch.pullY, SLING_RECOIL);
        if (!fire) {
            return;
        }
        burst(button, launch.angle, launch.power);
        // 장전된 새총은 손가락이 버튼 밖에서 놓여도 발사(클릭)된다. 버튼 안이면 브라우저가 알아서 클릭한다
        const under = document.elementFromPoint(event.clientX, event.clientY);
        if (launch.armed && !button.contains(under)) {
            syntheticClick = true;
            button.click();
            syntheticClick = false;
        }
    };
    addEventListener('pointerup', release(true), { passive: true });
    addEventListener('pointercancel', release(false), { passive: true }); // 스크롤 등으로 취소되면 조용히 돌아오기

    // 키보드로 누른 클릭(detail 0)도 위로 작게 쏜다
    root.addEventListener('click', (event) => {
        const button = event.target.closest?.(BUTTON_SELECTOR);
        if (event.detail === 0 && !syntheticClick && button && !reduceMotion()) {
            burst(button, -Math.PI / 2, SLING_KEY_POWER);
        }
    });
}

// ---------- 3. 되돌리기 버튼의 도화선 (Fuse) ----------
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

/**
 * 되돌릴 수 있는 버튼 (Fuse Button의 원래 쓰임새): 누르면 도화선이 타는 동안 "되돌리기"가 되고,
 * 다 타면 그때 실제로 실행한다. 지우기처럼 되돌릴 수 없는 일에 쓴다.
 * @param {HTMLButtonElement} button
 * @param {{ undoMs?: number, armedLabel?: string, onCommitAsync: () => Promise<void> }} options
 */
export function makeFuseUndoButton(button, { undoMs = 4000, armedLabel = t('fuse.undo'), onCommitAsync }) {
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

// ---------- 4. 레벨 업 회전 글자 (Rotating Text) ----------
const ROTATE_STEP_MS = 900;
const LETTER_STAGGER_MS = 35;

/** 화면 전체를 잠깐 덮고, 글자가 한 자씩 아래에서 올라오며 문구가 차례로 바뀐다 */
export function showLevelUpOverlay(level, words = ['LEVEL UP!', t('levelup.level', { n: level }), t('levelup.keepGoing')]) {
    document.querySelector('.levelup-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.className = 'levelup-overlay';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.innerHTML = '<div class="lu-box"><span class="lu-label">' + t('levelup.label') + '</span><span class="lu-word" aria-hidden="true"></span>' +
        '<span class="sr-only">' + t('levelup.sr', { n: level }) + '</span></div>';
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
