// 전자 피아노 효과음 합성기(tools/sound-synth.mjs)를 확인한다
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderEpiano, encodeWav, SOUND_PRESETS, SAMPLE_RATE, PEAK } from '../../tools/sound-synth.mjs';

const peakOf = (samples) => samples.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
const rmsOf = (samples) => Math.sqrt(samples.reduce((s, v) => s + v * v, 0) / samples.length);

test('정답 소리는 음이 올라가고, 오답 소리는 음이 내려간다', () => {
    // Given
    const up = SOUND_PRESETS.correct.notes.map((n) => n.freq);
    const down = SOUND_PRESETS.wrong.notes.map((n) => n.freq);

    // When / Then
    assert.ok(up.every((f, i) => i === 0 || f > up[i - 1]));
    assert.ok(down.every((f, i) => i === 0 || f < down[i - 1]));
});

test('길이는 설정한 초 × 샘플 수, 값은 모두 숫자(NaN 없음)', () => {
    // Given
    const preset = SOUND_PRESETS.correct;

    // When
    const samples = renderEpiano(preset);

    // Then
    assert.equal(samples.length, Math.round(preset.duration * SAMPLE_RATE));
    assert.ok(samples.every(Number.isFinite));
});

test('부드럽게: 가장 큰 소리가 PEAK 를 넘지 않고(찢어지는 소리 없음), 시작은 0 근처에서 살살', () => {
    // Given / When
    for (const preset of Object.values(SOUND_PRESETS)) {
        const samples = renderEpiano(preset);

        // Then
        assert.ok(peakOf(samples) <= PEAK + 1e-6); // Float32 로 저장하면 0.8 이 0.80000001 이 된다
        assert.ok(peakOf(samples) > PEAK * 0.9, '너무 작으면 안 들려요');
        assert.ok(Math.abs(samples[0]) < 0.01);
    }
});

test('끝은 조용히 사라져서 "틱" 소리가 나지 않는다 (마지막 20ms 거의 0)', () => {
    // Given
    const samples = renderEpiano(SOUND_PRESETS.wrong);
    const tail = samples.slice(samples.length - Math.round(0.02 * SAMPLE_RATE));

    // When / Then
    assert.ok(rmsOf(tail) < 0.01, String(rmsOf(tail)));
    assert.equal(samples.at(-1), 0);
});

test('오답 소리는 정답 소리보다 짧고 낮다 (혼내는 느낌 X)', () => {
    // Given / When / Then
    assert.ok(SOUND_PRESETS.wrong.duration < SOUND_PRESETS.correct.duration);
    assert.ok(Math.max(...SOUND_PRESETS.wrong.notes.map((n) => n.freq)) < Math.min(...SOUND_PRESETS.correct.notes.map((n) => n.freq)));
});

test('WAV: 머리말(RIFF · WAVE · 샘플레이트)과 16비트 데이터 길이가 맞고, 1을 넘는 값은 잘라 낸다', () => {
    // Given
    const samples = new Float32Array([0, 0.5, -0.5, 2, -2]);

    // When
    const wav = encodeWav(samples, 22050);

    // Then
    assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
    assert.equal(wav.toString('ascii', 8, 12), 'WAVE');
    assert.equal(wav.readUInt32LE(24), 22050);
    assert.equal(wav.readUInt16LE(34), 16);
    assert.equal(wav.readUInt32LE(40), samples.length * 2);
    assert.equal(wav.length, 44 + samples.length * 2);
    assert.equal(wav.readInt16LE(44 + 3 * 2), 32767);
    assert.equal(wav.readInt16LE(44 + 4 * 2), -32768);
});

test('WAV: 빈 소리도 머리말만 있는 올바른 파일', () => {
    // Given / When
    const wav = encodeWav(new Float32Array(0), SAMPLE_RATE);

    // Then
    assert.equal(wav.length, 44);
    assert.equal(wav.readUInt32LE(40), 0);
});
