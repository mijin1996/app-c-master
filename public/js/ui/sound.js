// 소리: 미리 만들어 둔 짧은 효과음(mp3)을 정답 · 오답 때만 재생한다. 배경음악은 쓰지 않는다.
// 브라우저는 사용자가 한 번 눌러야 소리를 허락하므로 unlock()은 누를 때 부른다.
const SOUND_FILES = Object.freeze({ correct: 'correct', wrong: 'wrong' });
const SFX_GAIN = 0.9;

export class SoundPlayer {
    #baseUrl;
    #settings;
    #ctx = null;
    #buffers = {};
    #gain = null;
    #loading = null;

    /** @param {() => {sfx: boolean}} settingsProvider */
    constructor(baseUrl, settingsProvider) {
        this.#baseUrl = baseUrl;
        this.#settings = settingsProvider;
    }

    unlock() {
        if (this.#ctx) {
            if (this.#ctx.state === 'suspended') {
                this.#ctx.resume();
            }
            return this.#loading;
        }
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
            return Promise.resolve();
        }
        this.#ctx = new AudioContextClass();
        this.#gain = this.#ctx.createGain();
        this.#gain.gain.value = SFX_GAIN;
        this.#gain.connect(this.#ctx.destination);
        this.#loading = Promise.all(Object.entries(SOUND_FILES).map(async ([key, file]) => {
            try {
                const response = await fetch(this.#baseUrl + file + '.mp3');
                this.#buffers[key] = await this.#ctx.decodeAudioData(await response.arrayBuffer());
            } catch (e) {
                // 이 기기에서 못 읽는 소리는 건너뛴다
            }
        }));
        return this.#loading;
    }

    /** name: correct(맞았을 때) | wrong(틀렸을 때). 효과음을 끈 사람에게는 소리를 내지 않는다 */
    play(name) {
        if (!this.#ctx || !this.#settings().sfx || !this.#buffers[name]) {
            return;
        }
        const source = this.#ctx.createBufferSource();
        source.buffer = this.#buffers[name];
        source.connect(this.#gain);
        source.start();
    }
}
