// 테크 텍스트: 큰 글자(워드마크) 위로 손가락·마우스를 올리면 그 글자가 점선 윤곽선으로 바뀌고,
// 선택 틀과 크기 표시, 깜빡이는 작은 네모가 따라다닌다. 가만히 두면 왼쪽에서 오른쪽으로 저절로 훑는다.
// vue-bits 의 Tech Text 를 보고 효과만 참고해 새로 짠 코드다 (원본 코드를 옮기지 않음).
const SVG_NS = 'http://www.w3.org/2000/svg';
const SWEEP_STEP_MS = 650;   // 저절로 훑을 때 한 글자에 머무는 시간
const IDLE_AFTER_MS = 2200;  // 손을 뗀 뒤 이만큼 지나면 다시 저절로 훑는다
const SPECK_SIZE = 4;
const SPECK_LIFE_MS = 900;

export const TECH_TEXT_DEFAULTS = Object.freeze({
    text: 'c-master',
    fontFamily: 'LevelUp',
    fontWeight: 700,
    fontSize: 150,
    letterSpacing: -0.03,
    dashLength: 4,
    dashGap: 2,
    strokeWidth: 1.5,
    specks: 12,
    speed: 1,
    labels: true,
    sweep: true,
});

function el(name, attrs = {}) {
    const node = document.createElementNS(SVG_NS, name);
    for (const [key, value] of Object.entries(attrs)) {
        node.setAttribute(key, String(value));
    }
    return node;
}

/** 글자마다 고정된 난수 (새로고침해도 네모 위치 무늬가 같게) */
function seeded(seed) {
    let s = (seed * 2654435761) >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

/** 글자 하나하나의 폭과 높이를 잰다 */
function measure(options) {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = options.fontWeight + ' ' + options.fontSize + 'px "' + options.fontFamily + '", sans-serif';
    const spacing = options.letterSpacing * options.fontSize;
    let x = 0;
    let ascent = 0;
    let descent = 0;
    const glyphs = [...options.text].map((ch) => {
        const m = ctx.measureText(ch);
        const glyph = {
            ch,
            x,
            width: m.width,
            left: m.actualBoundingBoxLeft ?? 0,
            right: m.actualBoundingBoxRight ?? m.width,
            top: m.actualBoundingBoxAscent ?? options.fontSize * 0.75,
            bottom: m.actualBoundingBoxDescent ?? 0,
        };
        ascent = Math.max(ascent, glyph.top);
        descent = Math.max(descent, glyph.bottom);
        x += m.width + spacing;
        return glyph;
    });
    return { glyphs, width: x - spacing, ascent, descent };
}

export class TechText {
    #host;
    #options;
    #svg = null;
    #letters = [];
    #frame = null;
    #label = null;
    #speckLayer = null;
    #active = -1;
    #lastPointerAt = 0;
    #sweepAt = 0;
    #sweepIndex = 0;
    #raf = 0;
    #specks = [];
    #reduceMotion = false;
    #layout = null;

    constructor(host, options = {}) {
        this.#host = host;
        this.#options = { ...TECH_TEXT_DEFAULTS, ...options };
    }

    async mountAsync() {
        const o = this.#options;
        try {
            await document.fonts.load(o.fontWeight + ' ' + o.fontSize + 'px "' + o.fontFamily + '"', o.text);
        } catch (e) {
            // 글꼴을 못 받아도 기본 글꼴로 그린다
        }
        if (!this.#host.isConnected) {
            return;
        }
        this.#reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
        this.#build();
        this.#bindPointer();
        this.#raf = requestAnimationFrame((t) => this.#tick(t));
    }

    destroy() {
        cancelAnimationFrame(this.#raf);
        this.#svg?.remove();
    }

    #build() {
        const o = this.#options;
        const layout = measure(o);
        this.#layout = layout;
        const pad = o.fontSize * 0.28;  // 틀과 글자 표시가 잘리지 않게 둘레 여백
        const height = layout.ascent + layout.descent;
        const svg = el('svg', {
            viewBox: (-pad) + ' ' + (-pad) + ' ' + (layout.width + pad * 2) + ' ' + (height + pad * 2),
            class: 'tech-svg', role: 'img', 'aria-label': o.text,
        });
        const baseline = layout.ascent;
        const word = el('g', { 'font-family': '"' + o.fontFamily + '", sans-serif', 'font-weight': o.fontWeight, 'font-size': o.fontSize, 'aria-hidden': 'true' });
        this.#letters = layout.glyphs.map((glyph) => {
            const group = el('g', { class: 'tech-letter' });
            const fill = el('text', { x: glyph.x, y: baseline, class: 'tech-fill', fill: 'currentColor' });
            fill.textContent = glyph.ch;
            const outline = el('text', {
                x: glyph.x, y: baseline, class: 'tech-outline', fill: 'none', stroke: 'currentColor',
                'stroke-width': o.strokeWidth, 'stroke-dasharray': o.dashLength + ' ' + o.dashGap, 'stroke-linejoin': 'round',
            });
            outline.textContent = glyph.ch;
            group.append(fill, outline);
            word.append(group);
            return { group, glyph, box: this.#boxOf(glyph, baseline) };
        });
        this.#frame = el('g', { class: 'tech-frame', opacity: 0 });
        const rect = el('rect', { fill: 'none', stroke: 'currentColor', 'stroke-width': 1 });
        const handles = [0, 1, 2, 3].map(() => el('rect', { width: 6, height: 6, class: 'tech-handle', fill: 'var(--tech-bg, #fff)', stroke: 'currentColor', 'stroke-width': 1 }));
        this.#frame.append(rect, ...handles);
        this.#label = el('text', { class: 'tech-label', 'font-size': Math.max(11, o.fontSize * 0.085), fill: 'currentColor' });
        this.#frame.append(this.#label);
        this.#speckLayer = el('g', { class: 'tech-specks' });
        svg.append(word, this.#speckLayer, this.#frame);
        this.#host.append(svg);
        this.#svg = svg;
    }

    #boxOf(glyph, baseline) {
        const x = glyph.x - glyph.left;
        const y = baseline - glyph.top;
        return { x, y, w: glyph.left + glyph.right, h: glyph.top + glyph.bottom };
    }

    #bindPointer() {
        const toIndex = (event) => {
            const point = this.#svg.createSVGPoint();
            point.x = event.clientX;
            point.y = event.clientY;
            const local = point.matrixTransform(this.#svg.getScreenCTM().inverse());
            let best = -1;
            let bestDist = Infinity;
            this.#letters.forEach((letter, i) => {
                const center = letter.box.x + letter.box.w / 2;
                const dist = Math.abs(local.x - center);
                if (dist < bestDist) {
                    bestDist = dist;
                    best = i;
                }
            });
            return best;
        };
        this.#svg.addEventListener('pointermove', (event) => {
            this.#lastPointerAt = performance.now();
            this.#setActive(toIndex(event));
        });
        this.#svg.addEventListener('pointerleave', () => {
            this.#lastPointerAt = performance.now();
            this.#setActive(-1);
        });
    }

    #setActive(index) {
        if (index === this.#active) {
            return;
        }
        this.#active = index;
        this.#letters.forEach((letter, i) => letter.group.classList.toggle('on', i === index));
        if (index < 0) {
            this.#frame.setAttribute('opacity', 0);
            return;
        }
        const { box, glyph } = this.#letters[index];
        const gap = this.#options.fontSize * 0.05;
        const x = box.x - gap;
        const y = box.y - gap;
        const w = box.w + gap * 2;
        const h = box.h + gap * 2;
        const [rect, ...handles] = this.#frame.querySelectorAll('rect');
        this.#frame.style.transform = 'translate(' + x + 'px,' + y + 'px)';
        rect.setAttribute('width', w);
        rect.setAttribute('height', h);
        [[0, 0], [w, 0], [0, h], [w, h]].forEach(([hx, hy], i) => {
            handles[i].setAttribute('x', hx - 3);
            handles[i].setAttribute('y', hy - 3);
        });
        if (this.#options.labels) {
            this.#label.setAttribute('x', 0);
            this.#label.setAttribute('y', -gap * 1.4);
            this.#label.textContent = glyph.ch + '  ' + Math.round(box.w) + ' × ' + Math.round(box.h);
        }
        this.#frame.setAttribute('opacity', 1);
        this.#spawnSpecks(index);
    }

    #spawnSpecks(index) {
        const count = this.#reduceMotion ? 0 : this.#options.specks;
        const random = seeded(index + 1);
        const { box } = this.#letters[index];
        const now = performance.now();
        for (let i = 0; i < count; i++) {
            const speck = el('rect', {
                width: SPECK_SIZE, height: SPECK_SIZE, fill: 'currentColor',
                x: box.x - box.w * 0.3 + random() * box.w * 1.6,
                y: box.y - box.h * 0.25 + random() * box.h * 1.5,
            });
            this.#speckLayer.append(speck);
            this.#specks.push({ node: speck, born: now + random() * 300 });
        }
    }

    #tick(time) {
        if (!this.#svg?.isConnected) {
            return; // 화면을 떠났으면 멈춘다
        }
        // 깜빡이는 네모: 생기고 사라진다
        this.#specks = this.#specks.filter((speck) => {
            const age = time - speck.born;
            if (age > SPECK_LIFE_MS) {
                speck.node.remove();
                return false;
            }
            const blink = age < 0 ? 0 : (Math.floor(age / 120) % 2 === 0 ? 1 : 0.35) * (1 - age / SPECK_LIFE_MS);
            speck.node.setAttribute('opacity', blink.toFixed(2));
            return true;
        });
        const idle = time - this.#lastPointerAt > IDLE_AFTER_MS;
        if (this.#options.sweep && !this.#reduceMotion && idle && time - this.#sweepAt > SWEEP_STEP_MS / this.#options.speed) {
            this.#sweepAt = time;
            const pauseSteps = 2; // 한 바퀴 돈 뒤 잠깐 쉰다
            const index = this.#sweepIndex % (this.#letters.length + pauseSteps);
            this.#setActive(index < this.#letters.length ? index : -1);
            this.#sweepIndex++;
        }
        this.#raf = requestAnimationFrame((t) => this.#tick(t));
    }
}
