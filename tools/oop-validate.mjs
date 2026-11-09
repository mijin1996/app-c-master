// 객체지향 레슨 원본(content/oop.cjs)을 검사한다. 문제가 있으면 한국어 문장 목록을 돌려준다.
export const QUIZ_SIZE = 5;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 4;

const filled = (s) => typeof s === 'string' && s.trim().length > 0;

const MARK = /\[\[(\d+)\]\]/g;
const answersOk = (list) => Array.isArray(list) && list.length > 0 && list.every(filled);

/** 코드 실습: 레슨마다 빈칸(blank) 1개 + 결과 맞히기(output) 1개 */
function validatePractice(practice, where, errors) {
    const list = Array.isArray(practice) ? practice : [];
    const kinds = list.map((p) => p?.kind).sort().join(',');
    if (kinds !== 'blank,output') {
        errors.push(where + ': 코드 실습은 빈칸 1개 + 결과 맞히기 1개여야 해요 (지금 ' + (kinds || '없음') + ')');
    }
    list.forEach((p, k) => {
        const at = where + ' 실습 ' + (k + 1);
        if (!filled(p?.prompt) || !filled(p?.code)) {
            errors.push(at + ': 질문 · 코드가 비었어요');
        }
        if (!filled(p?.explain)) {
            errors.push(at + ': 해설이 비었어요');
        }
        if (p?.kind === 'blank') {
            const numbers = [...String(p.code ?? '').matchAll(MARK)].map((m) => Number(m[1]));
            const blanks = Array.isArray(p.blanks) ? p.blanks : [];
            const inOrder = numbers.every((n, i) => n === i + 1);
            if (numbers.length === 0 || numbers.length !== blanks.length || !inOrder) {
                errors.push(at + ': 빈칸 표시 [[1]]..[[n]] 과 정답 칸 수가 맞지 않아요');
            }
            if (!blanks.every((b) => answersOk(b?.answers))) {
                errors.push(at + ': 빈칸 정답이 비었어요');
            }
        }
        if (p?.kind === 'output' && !answersOk(p.answers)) {
            errors.push(at + ': 결과 정답이 비었어요');
        }
    });
}

/** @returns {string[]} 빈 배열이면 문제 없음 */
export function validateLessons(lessons) {
    if (!Array.isArray(lessons) || lessons.length === 0) {
        return ['레슨이 하나도 없어요'];
    }
    const errors = [];
    lessons.forEach((lesson, i) => {
        const where = '레슨 ' + (i + 1);
        if (lesson?.no !== i + 1) {
            errors.push(where + ': 번호가 ' + (i + 1) + '이어야 해요 (지금 ' + lesson?.no + ')');
        }
        if (!filled(lesson?.title)) {
            errors.push(where + ': 제목이 비었어요');
        }
        if (!Array.isArray(lesson?.story) || lesson.story.length === 0 || !lesson.story.every(filled)) {
            errors.push(where + ': 쉬운 설명(story)이 비었어요');
        }
        if (!Array.isArray(lesson?.points) || lesson.points.length === 0 || !lesson.points.every(filled)) {
            errors.push(where + ': 핵심 정리(points)가 비었어요');
        }
        const quiz = Array.isArray(lesson?.quiz) ? lesson.quiz : [];
        if (quiz.length !== QUIZ_SIZE) {
            errors.push(where + ': 문항이 ' + QUIZ_SIZE + '개여야 해요 (지금 ' + quiz.length + '개)');
        }
        validatePractice(lesson?.practice, where, errors);
        quiz.forEach((q, k) => {
            const at = where + ' 문항 ' + (k + 1);
            if (!filled(q?.q)) {
                errors.push(at + ': 질문이 비었어요');
            }
            const options = Array.isArray(q?.options) ? q.options : [];
            if (options.length < MIN_OPTIONS || options.length > MAX_OPTIONS || !options.every(filled)) {
                errors.push(at + ': 보기는 ' + MIN_OPTIONS + '~' + MAX_OPTIONS + '개, 비면 안 돼요');
            }
            if (!Number.isInteger(q?.answer) || q.answer < 0 || q.answer >= options.length) {
                errors.push(at + ': 정답 번호가 보기 안에 없어요');
            }
            if (!filled(q?.explain)) {
                errors.push(at + ': 해설이 비었어요');
            }
        });
    });
    return errors;
}
