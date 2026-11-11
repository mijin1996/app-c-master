// 채점기(C 인터프리터 · Python 실행기)가 한국어로 만든 오류 문장을 지금 언어로 바꾼다.
// 채점기 코드는 그대로 두고(콘텐츠 빌드도 같은 채점기를 쓴다), 문장 모양(정규식)으로 찾아 바꾼다.
// 표에 없는 문장은 그대로 보여 준다. 표는 run-message-table.js 에 있다.
import { RUN_MESSAGE_TABLE } from './run-message-table.js';

/** @param {string} text 한국어 오류 문장 @param {'ko'|'en'|'zh'} locale */
export function translateRunMessage(text, locale) {
    const message = String(text ?? '');
    if (locale === 'ko' || message === '') {
        return message;
    }
    for (const row of RUN_MESSAGE_TABLE) {
        const m = row.re.exec(message);
        if (m) {
            const pattern = row[locale];
            return typeof pattern === 'function' ? pattern(...m.slice(1)) : pattern;
        }
    }
    return message;
}
