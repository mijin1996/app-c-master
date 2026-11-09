// 전자 피아노(로즈 피아노 느낌) 효과음 합성기. 외부 프로그램 없이 계산만으로 소리를 만든다.
// FM 합성: 사인파(반송파)를 다른 사인파(변조파)로 살짝 흔들면 "띵~" 하는 전자 피아노 소리가 난다.
// 시작할 때만 밝게 흔들고 금방 부드러워지게 해서, 귀에 거슬리지 않는 동글동글한 소리로 만든다.

export const SAMPLE_RATE = 22050;   // 효과음이라 이 정도면 충분 (파일이 작아짐)
export const PEAK = 0.8;            // 가장 큰 소리 (1이면 찢어질 수 있어서 여유를 둔다)
const ATTACK_SEC = 0.006;           // 건반을 누르는 순간 (0 이면 "틱" 소리)
const FADE_OUT_SEC = 0.15;          // 끝을 천천히 줄여서 "틱" 없이 사라지게
const TREMOLO_HZ = 4.5;             // 전자 피아노 특유의 출렁임
const TREMOLO_DEPTH = 0.07;
const LOWPASS = 0.35;               // 0~1, 작을수록 더 부드럽고 둥글게

// 음 높이(Hz): C4 261.63, Eb4 311.13, G4 392.00, C5 523.25, E5 659.25, G5 783.99
export const SOUND_PRESETS = Object.freeze({
    // 맞았을 때: 도-미-솔이 차르르 올라가는 밝은 화음
    correct: Object.freeze({
        duration: 1.1,
        notes: Object.freeze([
            { freq: 523.25, start: 0, gain: 0.8, decay: 0.7 },
            { freq: 659.25, start: 0.085, gain: 0.75, decay: 0.7 },
            { freq: 783.99, start: 0.17, gain: 0.8, decay: 0.8 },
        ]),
    }),
    // 틀렸을 때: 낮은 음 두 개가 "어라~" 하고 살짝 내려앉는 소리 (혼내지 않게 부드럽게)
    wrong: Object.freeze({
        duration: 0.8,
        notes: Object.freeze([
            { freq: 311.13, start: 0, gain: 0.7, decay: 0.45 },
            { freq: 261.63, start: 0.16, gain: 0.75, decay: 0.5 },
        ]),
    }),
});

/** 음 하나: 반송파 1배 + 변조파 1배(따뜻함) + 아주 짧은 14배 "쇳소리"(종 같은 시작) */
function noteSample(note, t) {
    if (t < 0) {
        return 0;
    }
    const w = 2 * Math.PI * note.freq;
    const index = 1.6 * Math.exp(-t / 0.12);        // 처음엔 밝게, 금방 부드럽게
    const tine = 0.25 * Math.exp(-t / 0.015);       // 눌렀을 때만 살짝 "띵"
    const modulator = index * Math.sin(w * t) + tine * Math.sin(w * 14 * t);
    const attack = Math.min(1, t / ATTACK_SEC);
    const envelope = attack * Math.exp(-t / note.decay);
    return note.gain * envelope * Math.sin(w * t + modulator);
}

/** @returns {Float32Array} -PEAK ~ PEAK 사이의 소리 값 */
export function renderEpiano({ duration, notes }, rate = SAMPLE_RATE) {
    const length = Math.round(duration * rate);
    const out = new Float32Array(length);
    let smooth = 0;
    let peak = 0;
    for (let i = 0; i < length; i++) {
        const t = i / rate;
        let v = 0;
        for (const note of notes) {
            v += noteSample(note, t - note.start);
        }
        v *= 1 - TREMOLO_DEPTH + TREMOLO_DEPTH * Math.sin(2 * Math.PI * TREMOLO_HZ * t);
        smooth += LOWPASS * (v - smooth);           // 높은 소리를 조금 깎아 둥글게
        out[i] = smooth;
        peak = Math.max(peak, Math.abs(smooth));
    }
    const fadeStart = length - Math.round(FADE_OUT_SEC * rate);
    const scale = peak > 0 ? PEAK / peak : 0;
    for (let i = 0; i < length; i++) {
        const left = i < fadeStart ? 1 : (length - 1 - i) / Math.max(1, length - 1 - fadeStart);
        const fade = left * left; // 제곱: 끝으로 갈수록 더 빨리 조용해짐
        out[i] = out[i] * scale * fade;
    }
    return out;
}

/** 소리 값 → 16비트 모노 WAV 파일 내용 */
export function encodeWav(samples, rate = SAMPLE_RATE) {
    const dataBytes = samples.length * 2;
    const wav = Buffer.alloc(44 + dataBytes);
    wav.write('RIFF', 0, 'ascii');
    wav.writeUInt32LE(36 + dataBytes, 4);
    wav.write('WAVE', 8, 'ascii');
    wav.write('fmt ', 12, 'ascii');
    wav.writeUInt32LE(16, 16);          // fmt 칸 크기
    wav.writeUInt16LE(1, 20);           // PCM
    wav.writeUInt16LE(1, 22);           // 모노
    wav.writeUInt32LE(rate, 24);
    wav.writeUInt32LE(rate * 2, 28);    // 1초에 몇 바이트
    wav.writeUInt16LE(2, 32);           // 한 샘플 바이트 수
    wav.writeUInt16LE(16, 34);          // 16비트
    wav.write('data', 36, 'ascii');
    wav.writeUInt32LE(dataBytes, 40);
    samples.forEach((v, i) => {
        const clamped = Math.max(-1, Math.min(1, v));
        wav.writeInt16LE(clamped < 0 ? Math.round(clamped * 32768) : Math.round(clamped * 32767), 44 + i * 2);
    });
    return wav;
}
