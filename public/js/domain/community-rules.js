// 커뮤니티 규칙: 글자 수 제한, 문제 형식 검사, 자동 숨김 기준. 화면(미리 검사)과 서버(진짜 검사)가 함께 쓴다.

export const COMMUNITY_LIMITS = Object.freeze({
    titleMax: 40,
    bodyMax: 3000,
    specMax: 1000,
    testsMin: 1,
    testsMax: 10,
    testInputMax: 20000,
    testOutputMax: 20000,
    examplesMax: 3,
    commentMax: 2000,
    reasonMax: 200,
    problemsPerDay: 10,     // 한 사람이 하루에 낼 수 있는 문제 수
    commentsPerHour: 30,    // 한 사람이 한 시간에 쓸 수 있는 댓글 수
    autoHideReports: 3,     // 신고가 이만큼 쌓이면 자동으로 숨김
    pageSize: 20,
});

export const DIFFICULTY_LEVELS = Object.freeze([4, 5, 6, 7]); // 알고리즘 단계와 같은 이름(브론즈~플래티넘)을 쓴다

const textOf = (value) => (typeof value === 'string' ? value.replace(/\r/g, '') : '');

/**
 * 문제 내기 요청을 검사하고 정리한다.
 * @returns {{ ok: true, problem: object } | { ok: false, field: string, message: string }}
 */
export function validateProblemDraft(draft) {
    const L = COMMUNITY_LIMITS;
    const title = textOf(draft?.title).trim();
    const body = textOf(draft?.body).trim();
    const inputSpec = textOf(draft?.inputSpec).trim();
    const outputSpec = textOf(draft?.outputSpec).trim();
    if (title.length < 2 || title.length > L.titleMax) {
        return { ok: false, field: 'title', message: '제목은 2~' + L.titleMax + '자로 써 주세요.' };
    }
    if (body.length < 10 || body.length > L.bodyMax) {
        return { ok: false, field: 'body', message: '문제 설명은 10~' + L.bodyMax + '자로 써 주세요.' };
    }
    if (inputSpec.length > L.specMax || outputSpec.length < 1 || outputSpec.length > L.specMax) {
        return { ok: false, field: 'spec', message: '입력·출력 설명을 ' + L.specMax + '자 안으로 써 주세요. 출력 설명은 꼭 필요해요.' };
    }
    const rawTests = Array.isArray(draft?.tests) ? draft.tests : [];
    if (rawTests.length < L.testsMin || rawTests.length > L.testsMax) {
        return { ok: false, field: 'tests', message: '테스트는 ' + L.testsMin + '~' + L.testsMax + '개 넣어 주세요.' };
    }
    const tests = [];
    for (const raw of rawTests) {
        const input = textOf(raw?.input);
        const output = textOf(raw?.output);
        if (input.length > L.testInputMax || output.length > L.testOutputMax) {
            return { ok: false, field: 'tests', message: '테스트 하나의 입력·출력은 ' + L.testInputMax + '자까지예요.' };
        }
        if (output.trim() === '') {
            return { ok: false, field: 'tests', message: '모든 테스트에 정답 출력을 넣어 주세요.' };
        }
        tests.push({ input, output });
    }
    const exampleCount = Math.min(Math.max(1, Math.floor(Number(draft?.exampleCount) || 1)), L.examplesMax, tests.length);
    const difficulty = DIFFICULTY_LEVELS.includes(Number(draft?.difficulty)) ? Number(draft.difficulty) : DIFFICULTY_LEVELS[0];
    return { ok: true, problem: { title, body, inputSpec, outputSpec, tests, exampleCount, difficulty } };
}

export function validateComment(text) {
    const body = textOf(text).trim();
    if (body.length < 1 || body.length > COMMUNITY_LIMITS.commentMax) {
        return { ok: false, message: '댓글은 1~' + COMMUNITY_LIMITS.commentMax + '자로 써 주세요.' };
    }
    return { ok: true, body };
}

export function shouldAutoHide(reports) {
    return reports >= COMMUNITY_LIMITS.autoHideReports;
}
