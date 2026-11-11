// ContentRepository.loadOopAsync: 가짜 DataSource 로 성공 · 실패 · 캐시를 확인한다
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Success, Failure } from '../../public/js/core/result.js';
import { AppError } from '../../public/js/core/app-error.js';
import { ContentRepository } from '../../public/js/repositories/api-repositories.js';

const lessonDto = { no: 1, title: '클래스', story: ['붕어빵'], points: ['틀'], quiz: [{ q: '?', options: ['a', 'b'], answer: 1, explain: '해설' }] };

class FakeContentSource {
    constructor(responses) {
        this.responses = responses;
        this.calls = 0;
    }

    async loadOopAsync() {
        const next = this.responses[Math.min(this.calls, this.responses.length - 1)];
        this.calls++;
        if (next instanceof Error) {
            throw next;
        }
        return next;
    }
}

test('성공하면 DTO 를 레슨 모델로 바꿔 돌려주고, 두 번째부터는 다시 받지 않는다', async () => {
    // Given
    const source = new FakeContentSource([{ status: 200, body: { lessons: [lessonDto] } }]);
    const repo = new ContentRepository(source);

    // When
    const first = await repo.loadOopAsync();
    const second = await repo.loadOopAsync();

    // Then
    assert.ok(first instanceof Success);
    assert.equal(first.data[0].title, '클래스');
    assert.equal(first.data[0].quiz[0].answer, 1);
    assert.equal(second.data, first.data);
    assert.equal(source.calls, 1);
});

test('인터넷이 끊기면 NETWORK, 파일이 없으면 NOT_FOUND 실패', async () => {
    // Given
    const offline = new ContentRepository(new FakeContentSource([new TypeError('Failed to fetch')]));
    const missing = new ContentRepository(new FakeContentSource([{ status: 404, body: null }]));

    // When
    const a = await offline.loadOopAsync();
    const b = await missing.loadOopAsync();

    // Then
    assert.ok(a instanceof Failure);
    assert.equal(a.error, AppError.NETWORK);
    assert.equal(b.error, AppError.NOT_FOUND);
});

test('언어별로 따로 받는다: en 파일을 부르고, en 파일이 없으면(404) 한국어 원본으로 대신한다', async () => {
    // Given
    const asked = [];
    const source = {
        async loadOopAsync(locale) {
            asked.push(locale);
            return locale === 'zh' ? { status: 404, body: null } : { status: 200, body: { lessons: [{ ...lessonDto, title: locale === 'en' ? 'Classes' : '클래스' }] } };
        },
    };
    const repo = new ContentRepository(source);

    // When
    const en = await repo.loadOopAsync('en');
    const zh = await repo.loadOopAsync('zh');
    const enAgain = await repo.loadOopAsync('en');

    // Then
    assert.equal(en.data[0].title, 'Classes');
    assert.equal(zh.data[0].title, '클래스');
    assert.equal(enAgain.data, en.data);
    assert.deepEqual(asked, ['en', 'zh', 'ko']);
});

test('실패했거나 비어 있으면 기억하지 않고, 다음에 다시 받아 온다', async () => {
    // Given
    const source = new FakeContentSource([new TypeError('x'), { status: 200, body: { lessons: [lessonDto] } }]);
    const repo = new ContentRepository(source);

    // When
    await repo.loadOopAsync();
    const retry = await repo.loadOopAsync();

    // Then
    assert.ok(retry instanceof Success);
    assert.equal(source.calls, 2);
});
