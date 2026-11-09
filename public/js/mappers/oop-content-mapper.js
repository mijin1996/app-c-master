// DTO → Model: oop.json 을 화면에서 쓰는 레슨 목록으로. 모양이 이상한 레슨 · 문항은 버린다.
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const texts = (raw) => (Array.isArray(raw) ? raw.filter((s) => typeof s === 'string' && s.trim()) : []);

function questionFromDto(raw) {
    if (!isObject(raw) || typeof raw.q !== 'string') {
        return null;
    }
    const options = texts(raw.options);
    if (options.length < 2 || !Number.isInteger(raw.answer) || raw.answer < 0 || raw.answer >= options.length) {
        return null;
    }
    return {
        q: raw.q,
        code: typeof raw.code === 'string' ? raw.code : '',
        options,
        answer: raw.answer,
        explain: typeof raw.explain === 'string' ? raw.explain : '',
    };
}

function lessonFromDto(raw) {
    if (!isObject(raw) || !Number.isInteger(raw.no) || raw.no < 1 || typeof raw.title !== 'string') {
        return null;
    }
    return {
        no: raw.no,
        title: raw.title,
        tag: typeof raw.tag === 'string' ? raw.tag : '',
        story: texts(raw.story),
        points: texts(raw.points),
        example: isObject(raw.example) && typeof raw.example.code === 'string'
            ? { title: String(raw.example.title ?? ''), code: raw.example.code }
            : null,
        quiz: (Array.isArray(raw.quiz) ? raw.quiz : []).map(questionFromDto).filter(Boolean),
    };
}

/** @returns {Array} 레슨 번호 순서대로 */
export function oopLessonsFromDto(body) {
    if (!isObject(body) || !Array.isArray(body.lessons)) {
        return [];
    }
    return body.lessons.map(lessonFromDto).filter(Boolean).sort((a, b) => a.no - b.no);
}
