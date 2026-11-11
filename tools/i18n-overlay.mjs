// 학습 내용 번역 덮어쓰기 (순수 함수). 한국어 원본(빌드된 content.json · oop.json) 위에 번역 글자만 덮는다.
// 코드 · 테스트 · 정답 출력 · 정답 번호 · 난이도는 절대 바꾸지 않는다 → 채점이 언어와 상관없이 같다.
// 검사: 빠진 번역, 배열 길이 다름, 원본에 없는 번호, 남은 한글(그 문제의 코드 · 정답에 실제로 있는 글자만 허용),
//       예시 코드는 주석 · 문자열 글자만 바꿀 수 있음.
const HANGUL_RUN = /[가-힣]+/g;

const isText = (v) => typeof v === 'string' && v.trim() !== '';

/** 주석을 지우고 문자열 안을 비운 "코드 뼈대" — 예시 코드 번역이 뜻을 바꾸지 않았는지 비교용 */
function codeSkeleton(code) {
    return String(code ?? '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '')
        .replace(/"(?:\\.|[^"\\\n])*"/g, '""')
        .replace(/'(?:\\.|[^'\\\n])*'/g, "''")
        .replace(/\s+/g, ' ')
        .trim();
}

/** 한글 조각이 모두 corpus(코드 · 정답 글자 모음) 안에 있는지 */
function leftoverHangul(text, corpus) {
    return (String(text).match(HANGUL_RUN) ?? []).filter((run) => !corpus.includes(run));
}

function checker(errors) {
    return {
        /** 글자 하나: 있어야 하고, 남은 한글은 corpus 에만 */
        text(where, field, value, corpus) {
            if (!isText(value)) {
                errors.push(where + ': ' + field + ' 번역이 없어요');
                return false;
            }
            const left = leftoverHangul(value, corpus);
            if (left.length) {
                errors.push(where + ': ' + field + ' 에 한글이 남았어요 (' + left.join(', ') + ')');
            }
            return true;
        },
        /** 글자 배열: 길이가 같아야 하고, 하나하나 위 규칙 */
        list(where, field, values, original, corpus) {
            if (!Array.isArray(values) || values.length !== original.length) {
                errors.push(where + ': ' + field + ' 개수가 원본(' + original.length + ')과 달라요 (' + (Array.isArray(values) ? values.length : '없음') + ')');
                return false;
            }
            values.forEach((v, i) => this.text(where, field + '[' + i + ']', v, corpus));
            return true;
        },
        /** 원본에 없는 번호로 적은 번역 */
        extraKeys(where, given, knownKeys) {
            for (const key of Object.keys(given ?? {})) {
                if (!knownKeys.includes(String(key))) {
                    errors.push(where + ': 원본에 없는 번호 ' + key);
                }
            }
        },
        code(where, field, translated, original) {
            if (translated === undefined) {
                return original;
            }
            if (codeSkeleton(translated) !== codeSkeleton(original)) {
                errors.push(where + ': ' + field + ' 는 주석 · 문자열만 바꿀 수 있어요 (코드가 달라졌어요)');
                return original;
            }
            return translated;
        },
    };
}

/** 문제 하나의 코드 · 테스트 · 정답 글자 모음 */
function problemCorpus(p) {
    const tests = (p.tests ?? []).map((t) => (typeof t === 'string' ? t : (t.input ?? '') + '\n' + Object.values(t.files ?? {}).join('\n')));
    return [p.solution, ...Object.values(p.solutions ?? {}), ...tests, ...(p.expected ?? []).map((e) => (e.out ?? '') + '\n' + (e.screen ?? '')), p.judge ?? ''].join('\n');
}

function overlayProblem(where, p, tr, check) {
    if (!tr) {
        check.text(where, '문제 ' + p.id, undefined, '');
        return p;
    }
    const corpus = problemCorpus(p);
    const at = where + ' 문제 ' + p.id;
    check.text(at, 'title', tr.title, corpus);
    check.text(at, 'desc', tr.desc, corpus);
    check.text(at, 'input', tr.input, corpus);
    check.text(at, 'output', tr.output, corpus);
    check.list(at, 'hints', tr.hints, p.hints ?? [], corpus);
    return { ...p, title: tr.title ?? p.title, desc: tr.desc ?? p.desc, input: tr.input ?? p.input, output: tr.output ?? p.output, hints: Array.isArray(tr.hints) && tr.hints.length === (p.hints ?? []).length ? tr.hints : p.hints };
}

function overlayQuiz(where, quiz, trQuiz, check) {
    if (!Array.isArray(trQuiz) || trQuiz.length !== quiz.length) {
        check.list(where, 'quiz', trQuiz, quiz, '');
        return quiz;
    }
    return quiz.map((q, i) => {
        const tr = trQuiz[i] ?? {};
        const at = where + ' quiz[' + i + ']';
        const corpus = (q.code ?? '') + '\n' + q.options.join('\n');
        check.text(at, 'q', tr.q, corpus);
        const okOptions = check.list(at, 'options', tr.options, q.options, corpus);
        check.text(at, 'explain', tr.explain, corpus);
        return { ...q, q: tr.q ?? q.q, options: okOptions ? tr.options : q.options, explain: tr.explain ?? q.explain };
    });
}

/**
 * @param {{chapters: object[], tracks: object[]}} base 한국어 원본 (빌드된 content.json)
 * @param {{chapters: object, tracks: object}} translation  { chapters: { [ch]: … }, tracks: { [track]: … } }
 * @returns {{ result: object, errors: string[] }}
 */
export function overlayContent(base, translation) {
    const errors = [];
    const check = checker(errors);
    const trChapters = translation?.chapters ?? {};
    const trTracks = translation?.tracks ?? {};
    check.extraKeys('단원', trChapters, base.chapters.map((c) => String(c.ch)));
    check.extraKeys('알고리즘', trTracks, base.tracks.map((t) => t.track));

    const chapters = base.chapters.map((c) => {
        const tr = trChapters[c.ch];
        const where = c.ch + '단원';
        if (!tr) {
            errors.push(where + ': 번역이 없어요');
            return c;
        }
        const exampleCorpus = c.concept.example ?? '';
        check.text(where, 'title', tr.title, '');
        check.list(where, 'points', tr.points, c.concept.points, exampleCorpus);
        check.extraKeys(where, tr.problems, c.problems.map((p) => String(p.id)));
        const example = check.code(where, 'example', tr.example, c.concept.example);
        return {
            ...c,
            title: tr.title ?? c.title,
            concept: { ...c.concept, points: Array.isArray(tr.points) && tr.points.length === c.concept.points.length ? tr.points : c.concept.points, example },
            problems: c.problems.map((p) => overlayProblem(where, p, tr.problems?.[p.id], check)),
            quiz: overlayQuiz(where, c.quiz, tr.quiz, check),
        };
    });

    const tracks = base.tracks.map((t) => {
        const tr = trTracks[t.track];
        const where = t.track;
        if (!tr) {
            errors.push(where + ': 번역이 없어요');
            return t;
        }
        check.text(where, 'name', tr.name, '');
        check.text(where, 'intro', tr.intro, '');
        check.list(where, 'topics', tr.topics, t.topics ?? [], '');
        check.extraKeys(where, tr.problems, t.problems.map((p) => String(p.id)));
        return {
            ...t,
            name: tr.name ?? t.name,
            intro: tr.intro ?? t.intro,
            topics: Array.isArray(tr.topics) && tr.topics.length === (t.topics ?? []).length ? tr.topics : t.topics,
            problems: t.problems.map((p) => overlayProblem(where, p, tr.problems?.[p.id], check)),
        };
    });
    return { result: { chapters, tracks }, errors };
}

/**
 * @param {object[]} lessons 한국어 원본 레슨 (oop.json 의 lessons)
 * @param {object} translation { [no]: { title, tag, story[], points[], exampleTitle, exampleCode?, quiz[], practice[] } }
 */
export function overlayOop(lessons, translation) {
    const errors = [];
    const check = checker(errors);
    check.extraKeys('객체지향', translation, lessons.map((l) => String(l.no)));
    const result = lessons.map((l) => {
        const tr = translation?.[l.no];
        const where = '레슨 ' + l.no;
        if (!tr) {
            errors.push(where + ': 번역이 없어요');
            return l;
        }
        const exampleCode = l.example?.code ?? '';
        const practiceCorpus = (l.practice ?? []).map((p) => p.code + '\n' + (p.answers ?? []).join('\n') + '\n' + (p.blanks ?? []).flatMap((b) => b.answers).join('\n')).join('\n');
        const corpus = exampleCode + '\n' + practiceCorpus + '\n' + l.quiz.map((q) => q.code ?? '').join('\n');
        check.text(where, 'title', tr.title, '');
        check.text(where, 'tag', tr.tag, corpus);
        check.list(where, 'story', tr.story, l.story, corpus);
        check.list(where, 'points', tr.points, l.points, corpus);
        let example = l.example;
        if (l.example) {
            check.text(where, 'exampleTitle', tr.exampleTitle, corpus);
            example = { title: tr.exampleTitle ?? l.example.title, code: check.code(where, 'exampleCode', tr.exampleCode, l.example.code) };
        }
        const practice = (l.practice ?? []).map((p, i) => {
            const t = tr.practice?.[i];
            const at = where + ' practice[' + i + ']';
            const pc = p.code + '\n' + (p.answers ?? []).join('\n') + '\n' + (p.blanks ?? []).flatMap((b) => b.answers).join('\n');
            if (!t) {
                errors.push(at + ': 번역이 없어요');
                return p;
            }
            check.text(at, 'prompt', t.prompt, pc);
            check.text(at, 'explain', t.explain, pc);
            if (p.kind === 'blank') {
                const ok = check.list(at, 'blankHints', t.blankHints, p.blanks.map((b) => b.hint), pc);
                return { ...p, prompt: t.prompt ?? p.prompt, explain: t.explain ?? p.explain, blanks: ok ? p.blanks.map((b, k) => ({ ...b, hint: t.blankHints[k] })) : p.blanks };
            }
            check.text(at, 'hint', t.hint, pc);
            return { ...p, prompt: t.prompt ?? p.prompt, explain: t.explain ?? p.explain, hint: t.hint ?? p.hint };
        });
        if ((tr.practice ?? []).length !== (l.practice ?? []).length) {
            errors.push(where + ': practice 개수가 원본(' + (l.practice ?? []).length + ')과 달라요');
        }
        return {
            ...l,
            title: tr.title ?? l.title,
            tag: tr.tag ?? l.tag,
            story: Array.isArray(tr.story) && tr.story.length === l.story.length ? tr.story : l.story,
            points: Array.isArray(tr.points) && tr.points.length === l.points.length ? tr.points : l.points,
            example,
            quiz: overlayQuiz(where, l.quiz, tr.quiz, check),
            practice,
        };
    });
    return { result, errors };
}
