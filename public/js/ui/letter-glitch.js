// 글자 글리치 배경 (Vue Bits "Letter Glitch" 스타일을 바닐라 JS 로 다시 만든 것, MIT + Commons Clause · 크레딧에 표시).
// 화면을 글자 칸으로 나누고, 조금씩 글자와 색을 바꿔 반짝이게 한다.
// 계산 함수(격자 · 색 · 바꾸기)는 순수 함수라 테스트하고, 그리기는 LetterGlitch 클래스가 맡는다.

export const GLITCH = Object.freeze({
    CHAR_WIDTH: 10,
    CHAR_HEIGHT: 20,
    FONT_SIZE: 16,
    SPEED_MS: 50,         // 몇 ms 마다 글자를 바꿀지
    UPDATE_RATIO: 0.05,   // 한 번에 바꿀 칸 비율 (5%)
    SMOOTH_STEP: 0.05,    // 색이 목표로 다가가는 정도 (한 화면마다)
    RESIZE_DELAY_MS: 100,
    CHARACTERS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789',
});

// 사이트 색과 맞춘 색 목록: 밤은 남색 바탕에 파랑 · 주황, 낮은 밝은 회청색에 파랑 · 주황
const PALETTES = Object.freeze({
    night: ['#1f2a46', '#2b3a63', '#3a4f86', '#7da2ff', '#ff7a4f'],
    day: ['#c3cde3', '#aab8d6', '#8fa2cc', '#2d64d8', '#f0643a'],
});
const BACKGROUNDS = Object.freeze({ night: '#0f1424', day: '#e9eef7' });

export function paletteFor(mode) {
    return PALETTES[mode] ?? PALETTES.night;
}

export function gridSize(width, height) {
    return { cols: Math.ceil(width / GLITCH.CHAR_WIDTH), rows: Math.ceil(height / GLITCH.CHAR_HEIGHT) };
}

export function hexToRgb(hex) {
    if (typeof hex !== 'string') {
        return null;
    }
    const full = hex.replace(/^#([a-f\d])([a-f\d])([a-f\d])$/i, (_, r, g, b) => '#' + r + r + g + g + b + b);
    const m = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(full);
    return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
}

export function mixRgb(from, to, factor) {
    const mix = (a, b) => Math.round(a + (b - a) * factor);
    return 'rgb(' + mix(from.r, to.r) + ',' + mix(from.g, to.g) + ',' + mix(from.b, to.b) + ')';
}

const pick = (list, random) => list[Math.floor(random() * list.length) % list.length];

export function createLetters(count, palette, random) {
    return Array.from({ length: count }, () => {
        const color = pick(palette, random);
        return { char: pick(GLITCH.CHARACTERS, random), color, from: undefined, target: color, progress: 1 };
    });
}

/** 칸의 약 5%(최소 1칸)에 새 글자 · 새 목표 색을 준다. 바꾼 칸 수를 돌려준다 */
export function glitchLetters(letters, palette, random) {
    if (letters.length === 0) {
        return 0;
    }
    const count = Math.max(1, Math.floor(letters.length * GLITCH.UPDATE_RATIO));
    for (let i = 0; i < count; i++) {
        const letter = letters[Math.floor(random() * letters.length) % letters.length];
        letter.char = pick(GLITCH.CHARACTERS, random);
        letter.from = letter.target;
        letter.target = pick(palette, random);
        letter.progress = 0;
    }
    return count;
}

/** 색을 목표 쪽으로 step 만큼 다가가게 한다. 다 오면 목표 색 그대로 */
export function smoothLetters(letters, step = GLITCH.SMOOTH_STEP) {
    for (const letter of letters) {
        if (letter.progress >= 1) {
            continue;
        }
        const from = hexToRgb(letter.from ?? letter.color);
        letter.from = letter.from ?? letter.color;
        letter.progress = Math.min(1, letter.progress + step);
        if (letter.progress >= 1) {
            letter.color = letter.target;
            letter.from = undefined;
        } else {
            letter.color = mixRgb(from, hexToRgb(letter.target), letter.progress);
        }
    }
}

/** 캔버스에 글자 글리치를 그린다. getMode() 는 'day' | 'night', still() 이 참이면 움직이지 않는다 */
export class LetterGlitch {
    #canvas;
    #ctx;
    #getMode;
    #still;
    #letters = [];
    #grid = { cols: 0, rows: 0 };
    #mode = 'night';
    #lastGlitch = 0;
    #resizeTimer = 0;

    constructor(canvas, getMode, still = () => false) {
        this.#canvas = canvas;
        this.#ctx = canvas.getContext('2d');
        this.#getMode = getMode;
        this.#still = still;
    }

    start() {
        addEventListener('resize', () => {
            clearTimeout(this.#resizeTimer);
            this.#resizeTimer = setTimeout(() => this.#resize(), GLITCH.RESIZE_DELAY_MS);
        });
        this.#resize();
        const loop = (time) => {
            requestAnimationFrame(loop);
            if (document.hidden) {
                return;
            }
            this.#tick(time);
        };
        requestAnimationFrame(loop);
    }

    #resize() {
        const ratio = Math.min(devicePixelRatio || 1, 2);
        this.#canvas.width = innerWidth * ratio;
        this.#canvas.height = innerHeight * ratio;
        this.#ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        this.#grid = gridSize(innerWidth, innerHeight);
        this.#mode = this.#getMode();
        this.#letters = createLetters(this.#grid.cols * this.#grid.rows, paletteFor(this.#mode), Math.random);
        this.#draw();
    }

    #tick(time) {
        const mode = this.#getMode();
        if (mode !== this.#mode) {
            // 낮 · 밤이 바뀌면 같은 글자를 새 색 목록으로 다시 칠한다
            this.#mode = mode;
            this.#letters = createLetters(this.#letters.length, paletteFor(mode), Math.random);
            this.#draw();
        }
        if (this.#still()) {
            return;
        }
        if (time - this.#lastGlitch >= GLITCH.SPEED_MS) {
            glitchLetters(this.#letters, paletteFor(this.#mode), Math.random);
            this.#lastGlitch = time;
        }
        smoothLetters(this.#letters);
        this.#draw();
    }

    #draw() {
        const ctx = this.#ctx;
        const width = innerWidth;
        const height = innerHeight;
        const background = BACKGROUNDS[this.#mode] ?? BACKGROUNDS.night;
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, width, height);
        ctx.font = GLITCH.FONT_SIZE + 'px monospace';
        ctx.textBaseline = 'top';
        this.#letters.forEach((letter, i) => {
            const x = (i % this.#grid.cols) * GLITCH.CHAR_WIDTH;
            const y = Math.floor(i / this.#grid.cols) * GLITCH.CHAR_HEIGHT;
            ctx.fillStyle = letter.color;
            ctx.fillText(letter.char, x, y);
        });
        // 바깥쪽을 바탕색으로 어둡게(밝게) 덮어 가운데 글이 잘 보이게 한다 (outer vignette)
        const vignette = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.3, width / 2, height / 2, Math.max(width, height) * 0.75);
        vignette.addColorStop(0, background + '00');
        vignette.addColorStop(1, background);
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);
    }
}
