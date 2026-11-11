// 여러 화면이 같이 쓰는 작은 그리기 도우미 (같은 코드를 화면마다 따로 두지 않으려고 모았다)
import { esc } from '../ui/dom.js';
import { t, getLocale } from '../i18n/index.js';
import { translateRunMessage } from '../i18n/run-messages.js';
import { ProblemStatus } from '../domain/progress-rules.js';

const STATUS_CHIP = Object.freeze({
    [ProblemStatus.SOLVED]: ['good', 'common.solved'],
    [ProblemStatus.TRYING]: ['bad', 'common.trying'],
    [ProblemStatus.NONE]: ['', 'common.notSubmitted'],
});

/** 맞힘 · 도전 중 · 안 냄 표시 */
export function statusChipHtml(status) {
    const [cls, key] = STATUS_CHIP[status] ?? STATUS_CHIP[ProblemStatus.NONE];
    return '<span class="chip' + (cls ? ' ' + cls : '') + '">' + esc(t(key)) + '</span>';
}

/** "○번째 줄 근처" (줄을 모르면 빈 글자) */
export const lineNear = (line) => (line ? t('common.lineNear', { line }) : '');

/** 실행 · 컴파일 오류 문장을 지금 언어로 */
export const runText = (message) => esc(translateRunMessage(message, getLocale()));
