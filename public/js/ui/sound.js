// 소리: 미리 만들어 둔 피아노 음원(mp3)을 상황에 맞게 재생만 한다.
// 브라우저는 사용자가 한 번 클릭해야 소리를 허락하므로 unlock()은 클릭 때 부른다.
const SOUND_FILES = Object.freeze({
    correct: 'correct', wrong: 'wrong', quizOk: 'quiz_ok', quizNo: 'quiz_no', clear: 'clear', evolve: 'evolve', bgm: 'bgm',
});
const SFX_GAIN = 0.9;
const BGM_GAIN = 0.55;

export class SoundPlayer {
    #baseUrl;
    #settings;
    #ctx = null;
    #buffers = {};
    #sfxGain = null;
    #bgmGain = null;
    #bgmSource = null;
    #loading = null;

    /** @param {() => {sfx: boolean, bgm: boolean, volume: number}} settingsProvider */
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
        this.#sfxGain = this.#ctx.createGain();
        this.#sfxGain.connect(this.#ctx.destination);
        this.#bgmGain = this.#ctx.createGain();
        this.#bgmGain.connect(this.#ctx.destination);
        this.applyVolume();
        this.#loading = Promise.all(Object.entries(SOUND_FILES).map(async ([key, file]) => {
            try {
                const response = await fetch(this.#baseUrl + file + '.mp3');
                const data = await response.arrayBuffer();
                this.#buffers[key] = await this.#ctx.decodeAudioData(data);
            } catch (e) {
                // 이 기기에서 못 읽는 소리는 건너뛴다
            }
        }));
        return this.#loading;
    }

    applyVolume() {
        if (!this.#ctx) {
            return;
        }
        const s = this.#settings();
        this.#sfxGain.gain.value = s.sfx ? SFX_GAIN : 0;
        this.#bgmGain.gain.setTargetAtTime(s.bgm ? s.volume * BGM_GAIN : 0, this.#ctx.currentTime, 0.3);
    }

    /** name: correct | wrong | quizOk | quizNo | clear | evolve */
    play(name) {
        if (!this.#ctx || !this.#settings().sfx || !this.#buffers[name]) {
            return;
        }
        const source = this.#ctx.createBufferSource();
        source.buffer = this.#buffers[name];
        source.connect(this.#sfxGain);
        source.start();
    }

    async setBgmAsync(on) {
        await this.unlock();
        if (!this.#ctx || !this.#buffers.bgm) {
            return;
        }
        if (on && !this.#bgmSource) {
            const source = this.#ctx.createBufferSource();
            source.buffer = this.#buffers.bgm;
            source.loop = true;
            source.connect(this.#bgmGain);
            source.start();
            this.#bgmSource = source;
        }
        this.applyVolume();
        if (!on && this.#bgmSource) {
            const source = this.#bgmSource;
            this.#bgmSource = null;
            setTimeout(() => {
                try {
                    source.stop();
                } catch (e) {
                    // 이미 멈춤
                }
            }, 1200);
        }
    }
}
