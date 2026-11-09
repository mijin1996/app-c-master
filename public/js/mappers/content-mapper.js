// DTO → Model: content.json 을 화면에서 쓰기 좋은 모양으로.
// 예전 모양(단원 배열)과 지금 모양({ chapters, tracks })을 둘 다 받아 준다.
export function contentFromDto(body) {
    if (Array.isArray(body)) {
        return { chapters: body, tracks: [] };
    }
    const chapters = Array.isArray(body?.chapters) ? body.chapters : [];
    const tracks = Array.isArray(body?.tracks) ? body.tracks : [];
    return { chapters, tracks };
}

/** 번호로 바로 찾을 수 있게 색인을 만든다. 알고리즘 문제는 ch 대신 track 을 가진다 */
export function indexContent({ chapters, tracks }) {
    const byChapter = new Map();
    const byTrack = new Map();
    const byProblem = new Map();
    const problems = [];
    for (const chapter of chapters) {
        byChapter.set(chapter.ch, chapter);
        for (const problem of chapter.problems) {
            problem.ch = chapter.ch;
            byProblem.set(problem.id, problem);
            problems.push(problem);
        }
    }
    for (const track of tracks) {
        byTrack.set(track.track, track);
        for (const problem of track.problems) {
            problem.track = track.track;
            byProblem.set(problem.id, problem);
        }
    }
    return { chapters, tracks, byChapter, byTrack, byProblem, problems };
}
