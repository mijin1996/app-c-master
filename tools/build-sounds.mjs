// 정답 · 오답 효과음(전자 피아노)을 만들어 public/assets/sounds/ 에 WAV 로 저장한다.
// 사용법: node tools/build-sounds.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderEpiano, encodeWav, SOUND_PRESETS } from './sound-synth.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'public/assets/sounds');
fs.mkdirSync(dir, { recursive: true });
for (const [name, preset] of Object.entries(SOUND_PRESETS)) {
    const wav = encodeWav(renderEpiano(preset));
    fs.writeFileSync(path.join(dir, 'epiano-' + name + '.wav'), wav);
    console.log('epiano-' + name + '.wav', Math.round(wav.length / 1024) + 'KB');
}
