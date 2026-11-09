// 객체지향 "코드 실습" 규칙: 빈칸 채우기(blank) · 결과 맞히기(output) 채점과 경험치.
// C# 은 브라우저에서 실행할 수 없어서, 정해 둔 정답과 비교해 채점한다. 순수 함수라 화면 · 서버가 같이 쓴다.
import { OOP_LESSONS } from './oop-curriculum.js';

export const PRACTICE_XP = 5;
export const PracticeKind = Object.freeze({ BLANK: 'blank', OUTPUT: 'output' });

const BLANK_MARK = /\[\[(\d+)\]\]/g;          // 코드 속 [[1]], [[2]] 가 빈칸 자리
const PRACTICE_KEY = /^([1-9]\d?)-([1-9])$/;  // "레슨-순서" (순서는 1부터)

export function blankCount(code) {
    return (String(code).match(BLANK_MARK) ?? []).length;
}

/** 빈칸 한 칸: 앞뒤 공백만 봐준다. C# 은 대소문자가 다르면 다른 말이라 그대로 비교 */
const tidyWord = (s) => String(s ?? '').trim().replace(/\s+/g, ' ');

/** 결과 화면: 윈도우 줄바꿈 · 줄 끝 공백 · 마지막 빈 줄은 봐준다 */
const tidyOutput = (s) => String(s ?? '').replace(/\r/g, '').split('\n').map((line) => line.replace(/\s+$/, '')).join('\n').replace(/^\n+|\n+$/g, '').trim();

/**
 * @param {{kind: string, blanks?: Array<{answers: string[]}>, answers?: string[]}} practice
 * @param {string[]} inputs 빈칸이면 칸마다 하나, 결과 맞히기면 하나
 * @returns {{ correct: boolean, marks: boolean[] }}
 */
export function checkPractice(practice, inputs) {
    const given = Array.isArray(inputs) ? inputs : [];
    if (practice.kind === PracticeKind.OUTPUT) {
        const mine = tidyOutput(given[0]);
        const ok = mine !== '' && practice.answers.some((answer) => tidyOutput(answer) === mine);
        return { correct: ok, marks: [ok] };
    }
    const marks = practice.blanks.map((b, i) => {
        const mine = tidyWord(given[i]);
        return mine !== '' && b.answers.some((answer) => tidyWord(answer) === mine);
    });
    return { correct: marks.length > 0 && marks.every(Boolean), marks };
}

export function practiceKey(lessonNo, index) {
    return lessonNo + '-' + (index + 1);
}

export function isPracticeKey(key) {
    return PRACTICE_KEY.test(String(key));
}

/** 푼 실습으로 경험치를 다시 계산한다. 목록에 있는 레슨 · 순서만 센다 */
export function computePracticeXp(oopPractice, lessons = OOP_LESSONS) {
    return solvedPracticeCount(oopPractice, lessons) * PRACTICE_XP;
}

export function solvedPracticeCount(oopPractice, lessons = OOP_LESSONS) {
    if (oopPractice === null || typeof oopPractice !== 'object') {
        return 0;
    }
    let count = 0;
    for (const key of Object.keys(oopPractice)) {
        const m = PRACTICE_KEY.exec(key);
        const lesson = m && lessons.find((l) => l.no === Number(m[1]));
        if (lesson && Number(m[2]) <= (lesson.practice ?? 0) && oopPractice[key] === 1) {
            count++;
        }
    }
    return count;
}
