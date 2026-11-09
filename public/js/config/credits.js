// 출처 · 라이선스 목록. 출처 창(views/credits-modal.js)이 이 목록을 그대로 보여 준다.
// 새 글꼴·그림·코드·참고 자료를 넣으면 여기에 한 줄 추가한다.
export const CREDITS = Object.freeze([
    {
        group: '글꼴',
        items: [
            { name: '레벨업 (LevelUp)', by: 'Hada Type Foundry', license: 'SIL Open Font License 1.1', url: 'https://hada-type.com/levelup',
                note: '제목·첫 화면 워드마크. 파일을 사이트에 직접 올려 씀 (public/fonts/LevelUp, LICENSE.txt 동봉)' },
            { name: 'IBM Plex Sans KR', by: 'IBM', license: 'SIL Open Font License 1.1', url: 'https://fonts.google.com/specimen/IBM+Plex+Sans+KR', note: '본문 글꼴 (Google Fonts)' },
            { name: 'JetBrains Mono', by: 'JetBrains', license: 'SIL Open Font License 1.1', url: 'https://fonts.google.com/specimen/JetBrains+Mono', note: '코드 글꼴 (Consolas가 없는 기기에서 대신 씀)' },
        ],
    },
    {
        group: '화면 효과',
        items: [
            { name: 'Tech Text', by: 'Vue Bits (React Bits의 Vue 버전, davidhaz)', license: '효과 아이디어 참고 · 코드는 쓰지 않음', url: 'https://vue-bits.dev/text-animations/tech-text',
                note: '첫 화면 c-master 글자 효과. Vue Bits 코드를 가져오지 않고 같은 느낌을 바닐라 자바스크립트로 새로 만들었어요 (public/js/ui/tech-text.js)' },
            { name: 'Click Spark', by: 'Vue Bits', license: '효과 아이디어 참고 · 코드는 쓰지 않음', url: 'https://vue-bits.dev/animations/click-spark',
                note: '화면을 누를 때마다 튀는 불꽃 (public/js/ui/effects.js)' },
            { name: 'Rotating Text', by: 'Vue Bits', license: '효과 아이디어 참고 · 코드는 쓰지 않음', url: 'https://vue-bits.dev/text-animations/rotating-text',
                note: '레벨 업 때 화면 전체를 덮는 회전 글자 (public/js/ui/effects.js)' },
            { name: 'Fuse Button', by: 'Vue Bits', license: '효과 아이디어 참고 · 코드는 쓰지 않음', url: 'https://vue-bits.dev/micro/fuse-button',
                note: '버튼을 누르면 테두리를 따라 도화선이 타는 효과, 문제 지우기의 4초 되돌리기 (public/js/ui/effects.js)' },
        ],
    },
    {
        group: '채점 도구',
        items: [
            { name: 'Pyodide', by: 'Pyodide 프로젝트', license: 'Mozilla Public License 2.0', url: 'https://pyodide.org/',
                note: 'Python 문제를 학생 브라우저 안에서 실행 (jsDelivr에서 불러옴, 코드를 고치지 않고 그대로 사용)' },
            { name: 'Judge0 (연결 준비만)', by: 'Judge0', license: 'GPL-3.0 · 설치 시 별도 서버', url: 'https://judge0.com/',
                note: 'C++ · Java 유료 채점용으로 연결 자리만 만들어 둠. 지금은 꺼져 있어요' },
        ],
    },
    {
        group: '알고리즘 문제',
        items: [
            { name: 'USA Computing Olympiad (USACO)', by: 'USACO', license: '단계 구분 방식 참고 · 문제는 옮기지 않음', url: 'https://usaco.org/index.php',
                note: '브론즈 · 실버 · 골드 · 플래티넘 단계 나누기와, 단계마다 다루는 알고리즘 주제(완전 탐색, 누적 합, DP, 세그먼트 트리 등)를 참고했어요. c-master 알고리즘 32문제의 지문 · 테스트 · 모범답안(C · Python)은 특정 대회 문제를 옮기지 않고 새로 만든 것이고, USACO 원래 문제는 각 단계의 링크에서 풀 수 있어요' },
            { name: 'USACO Guide', by: 'Competitive Programming Initiative', license: '링크만 연결', url: 'https://usaco.guide/', note: '단계별로 더 공부할 곳 안내' },
        ],
    },
    {
        group: '그림 · 소리 · 교재',
        items: [
            { name: '캐릭터 코디 픽셀 아트', by: 'c-master (Google Gemini로 생성)', license: '오리지널 그림', url: 'https://gemini.google.com/', note: '아기 코더 → 초딩 → 중딩 → 고딩 → C 마스터 15장' },
            { name: '효과음 (맞았을 때 · 틀렸을 때)', by: 'c-master', license: '오리지널', url: '', note: '피아노 소리를 직접 합성해 만든 짧은 mp3 두 개' },
            { name: '《자기주도 C언어 프로그래밍》', by: '김동규', license: '단원 순서 · 개념만 참고', url: '', note: '문제 · 퀴즈 · 해설은 모두 새로 썼어요' },
        ],
    },
]);
