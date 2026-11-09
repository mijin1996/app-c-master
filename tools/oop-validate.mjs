// 객체지향 레슨 원본(content/oop.cjs)을 검사한다. 문제가 있으면 한국어 문장 목록을 돌려준다.
export const QUIZ_SIZE = 5;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 4;

const filled = (s) => typeof s === 'string' && s.trim().length > 0;

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
