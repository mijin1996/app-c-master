// 커뮤니티: 문제 내기, 하루 제한, 댓글, 채택 권한, 좋아요, 신고 자동 숨김, 선생님 숨기기
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Success, Failure } from '../../public/js/core/result.js';
import { AppError } from '../../public/js/core/app-error.js';
import { COMMUNITY_LIMITS, validateProblemDraft } from '../../public/js/domain/community-rules.js';
import { createContainer } from '../../server/container.js';
import { Pbkdf2PasswordHasher } from '../../server/security/password-hasher.js';
import { SqliteD1, BrokenD1 } from '../fakes/sqlite-d1.js';

const FAST_HASHER = new Pbkdf2PasswordHasher(1000);
const DRAFT = Object.freeze({
    title: '두 수의 차',
    body: '두 정수 a와 b가 주어질 때 a - b 를 출력하세요.',
    inputSpec: '첫째 줄에 a와 b',
    outputSpec: 'a - b',
    tests: [{ input: '5 3\n', output: '2\n' }, { input: '1 4\n', output: '-3\n' }],
    exampleCount: 1,
    difficulty: 4,
});

async function setup() {
    let now = 1_000_000;
    const c = createContainer({ DB: new SqliteD1(), TEACHER_USERNAMES: 'teach' }, { hasher: FAST_HASHER, clock: () => now });
    const users = {};
    for (const name of ['kim', 'lee', 'park', 'choi', 'teach']) {
        const s = await c.auth.signupAsync({ username: name, nickname: name.toUpperCase(), password: 'abcd' });
        users[name] = (await c.auth.currentUserAsync(s.data.token)).data;
    }
    return { c, users, advance: (ms) => {
        now += ms;
    } };
}

test('문제 초안 검사: 제목·설명·테스트 정답이 없으면 거절, 예제 수는 범위로 맞춘다', () => {
    assert.equal(validateProblemDraft({ ...DRAFT, title: 'a' }).ok, false);
    assert.equal(validateProblemDraft({ ...DRAFT, tests: [] }).ok, false);
    assert.equal(validateProblemDraft({ ...DRAFT, tests: [{ input: '1', output: '  ' }] }).ok, false);
    const fixed = validateProblemDraft({ ...DRAFT, exampleCount: 99, difficulty: 42 });
    assert.equal(fixed.problem.exampleCount, 2);
    assert.equal(fixed.problem.difficulty, 4);
});

test('문제를 내면 목록과 상세에 보이고, 테스트는 그대로 저장된다', async () => {
    // Given
    const { c, users } = await setup();

    // When
    const created = await c.community.createProblemAsync(users.kim, DRAFT);
    const listed = await c.community.listProblemsAsync(users.lee);
    const detail = await c.community.getProblemAsync(users.lee, created.data);

    // Then
    assert.ok(created instanceof Success);
    assert.deepEqual(listed.data.map((p) => [p.title, p.author, p.mine]), [['두 수의 차', 'KIM', false]]);
    assert.deepEqual(detail.data.tests, DRAFT.tests);
    assert.equal(detail.data.exampleCount, 1);
});

test('하루에 낼 수 있는 문제 수를 넘으면 TOO_MANY_POSTS, 하루가 지나면 다시 된다', async () => {
    // Given
    const { c, users, advance } = await setup();
    for (let i = 0; i < COMMUNITY_LIMITS.problemsPerDay; i++) {
        await c.community.createProblemAsync(users.kim, DRAFT);
    }

    // When
    const blocked = await c.community.createProblemAsync(users.kim, DRAFT);
    advance(24 * 60 * 60 * 1000 + 1);
    const later = await c.community.createProblemAsync(users.kim, DRAFT);

    // Then
    assert.equal(blocked.error, AppError.TOO_MANY_POSTS);
    assert.ok(later instanceof Success);
});

test('댓글을 달면 개수가 늘고, 채택은 문제 낸 사람만 남의 댓글에 할 수 있다', async () => {
    // Given
    const { c, users } = await setup();
    const id = (await c.community.createProblemAsync(users.kim, DRAFT)).data;
    const leeComment = (await c.community.addCommentAsync(users.lee, { problemId: id, body: '음수도 되나요?' })).data;
    const kimComment = (await c.community.addCommentAsync(users.kim, { problemId: id, body: '네 됩니다' })).data;

    // When
    const byOther = await c.community.acceptCommentAsync(users.park, leeComment);
    const ownComment = await c.community.acceptCommentAsync(users.kim, kimComment);
    const ok = await c.community.acceptCommentAsync(users.kim, leeComment);
    const detail = await c.community.getProblemAsync(users.park, id);

    // Then
    assert.equal(byOther.error, AppError.FORBIDDEN);
    assert.equal(ownComment.error, AppError.FORBIDDEN);
    assert.ok(ok instanceof Success);
    assert.equal(detail.data.comments.length, 2);
    assert.equal(detail.data.comments[0].accepted, true); // 채택한 댓글이 맨 위
    assert.equal((await c.community.listProblemsAsync(users.park)).data[0].comments, 2);
});

test('좋아요는 한 번 누르면 켜지고 다시 누르면 꺼진다. 내 글에는 누를 수 없다', async () => {
    // Given
    const { c, users } = await setup();
    const id = (await c.community.createProblemAsync(users.kim, DRAFT)).data;

    // When
    const on = await c.community.toggleLikeAsync(users.lee, { targetType: 'problem', targetId: id });
    const off = await c.community.toggleLikeAsync(users.lee, { targetType: 'problem', targetId: id });
    const mine = await c.community.toggleLikeAsync(users.kim, { targetType: 'problem', targetId: id });

    // Then
    assert.deepEqual(on.data, { liked: true, likes: 1 });
    assert.deepEqual(off.data, { liked: false, likes: 0 });
    assert.equal(mine.error, AppError.FORBIDDEN);
});

test('신고가 3번(서로 다른 사람) 쌓이면 자동으로 숨겨지고, 선생님은 다시 보이게 할 수 있다', async () => {
    // Given
    const { c, users } = await setup();
    const id = (await c.community.createProblemAsync(users.kim, DRAFT)).data;
    const report = (user) => c.community.reportAsync(user, { targetType: 'problem', targetId: id, reason: '장난 글' });

    // When
    await report(users.lee);
    await report(users.lee); // 같은 사람의 두 번째 신고는 세지 않는다
    await report(users.park);
    const third = await report(users.choi);
    const hiddenForOthers = await c.community.getProblemAsync(users.lee, id);
    const visibleForAuthor = await c.community.getProblemAsync(users.kim, id);
    const notTeacher = await c.community.setHiddenAsync(users.lee, { targetType: 'problem', targetId: id, hidden: false });
    await c.community.setHiddenAsync(users.teach, { targetType: 'problem', targetId: id, hidden: false });
    const restored = await c.community.getProblemAsync(users.lee, id);

    // Then
    assert.deepEqual(third.data, { reports: 3, hidden: true });
    assert.equal(hiddenForOthers.error, AppError.NOT_FOUND);
    assert.ok(visibleForAuthor instanceof Success);
    assert.equal(notTeacher.error, AppError.FORBIDDEN);
    assert.ok(restored instanceof Success);
});

test('문제는 낸 사람이나 선생님만 지울 수 있다', async () => {
    const { c, users } = await setup();
    const id = (await c.community.createProblemAsync(users.kim, DRAFT)).data;
    assert.equal((await c.community.deleteProblemAsync(users.lee, id)).error, AppError.FORBIDDEN);
    assert.ok((await c.community.deleteProblemAsync(users.teach, id)) instanceof Success);
    assert.equal((await c.community.getProblemAsync(users.kim, id)).error, AppError.NOT_FOUND);
});

test('DB가 고장 나면 SERVER 실패를 돌려준다', async () => {
    const { users } = await setup();
    const c = createContainer({ DB: new BrokenD1() }, { hasher: FAST_HASHER });
    const result = await c.community.listProblemsAsync(users.kim);
    assert.ok(result instanceof Failure);
    assert.equal(result.error, AppError.SERVER);
});
