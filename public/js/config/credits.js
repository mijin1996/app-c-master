// 출처 · 라이선스 목록. 출처 창(views/credits-modal.js)이 지금 언어로 보여 준다.
// 새 글꼴·그림·코드·참고 자료를 넣으면 여기에 한 줄 추가한다. 글은 { ko, en, zh } 세 가지로 쓴다 (없으면 ko).
const IDEA_ONLY = { ko: '효과 아이디어 참고 · 코드는 쓰지 않음', en: 'Effect idea only · no code used', zh: '仅参考效果创意 · 未使用代码' };
const IDEA_ONLY_MIT = {
    ko: '효과 아이디어 참고 · 코드는 쓰지 않음 (Vue Bits 라이선스: MIT + Commons Clause)',
    en: 'Effect idea only · no code used (Vue Bits license: MIT + Commons Clause)',
    zh: '仅参考效果创意 · 未使用代码（Vue Bits 许可：MIT + Commons Clause）',
};
const VUE_BITS = { ko: 'Vue Bits (React Bits의 Vue 버전, davidhaz)', en: 'Vue Bits (Vue port of React Bits, davidhaz)', zh: 'Vue Bits（React Bits 的 Vue 版，davidhaz）' };

export const CREDITS = Object.freeze([
    {
        group: { ko: '글꼴', en: 'Fonts', zh: '字体' },
        items: [
            { name: { ko: '레벨업 (LevelUp)', en: 'LevelUp', zh: 'LevelUp（레벨업）' }, by: 'Hada Type Foundry', license: 'SIL Open Font License 1.1', url: 'https://hada-type.com/levelup',
                note: { ko: '제목·첫 화면 워드마크. 파일을 사이트에 직접 올려 씀 (public/fonts/LevelUp, LICENSE.txt 동봉)', en: 'Titles and the first-screen wordmark. Self-hosted on the site (public/fonts/LevelUp, LICENSE.txt included)', zh: '标题和首页字标。字体文件直接放在网站上（public/fonts/LevelUp，附 LICENSE.txt）' } },
            { name: 'IBM Plex Sans KR', by: 'IBM', license: 'SIL Open Font License 1.1', url: 'https://fonts.google.com/specimen/IBM+Plex+Sans+KR',
                note: { ko: '본문 글꼴 (Google Fonts)', en: 'Body text font (Google Fonts)', zh: '正文字体（Google Fonts）' } },
            { name: 'JetBrains Mono', by: 'JetBrains', license: 'SIL Open Font License 1.1', url: 'https://fonts.google.com/specimen/JetBrains+Mono',
                note: { ko: '코드 글꼴 (Consolas가 없는 기기에서 대신 씀)', en: 'Code font (used on devices without Consolas)', zh: '代码字体（在没有 Consolas 的设备上使用）' } },
        ],
    },
    {
        group: { ko: '화면 효과', en: 'Visual effects', zh: '界面效果' },
        items: [
            { name: 'Tech Text', by: VUE_BITS, license: IDEA_ONLY, url: 'https://vue-bits.dev/text-animations/tech-text',
                note: { ko: '첫 화면 c-master 글자 효과. Vue Bits 코드를 가져오지 않고 같은 느낌을 바닐라 자바스크립트로 새로 만들었어요 (public/js/ui/tech-text.js)', en: 'The c-master lettering effect on the first screen, rebuilt from scratch in vanilla JavaScript without Vue Bits code (public/js/ui/tech-text.js)', zh: '首页 c-master 文字效果。没有使用 Vue Bits 的代码，用原生 JavaScript 重新实现了同样的感觉（public/js/ui/tech-text.js）' } },
            { name: 'Click Spark', by: 'Vue Bits', license: IDEA_ONLY, url: 'https://vue-bits.dev/animations/click-spark',
                note: { ko: '화면을 누를 때마다 튀는 불꽃 (public/js/ui/effects.js)', en: 'Sparks that pop wherever you click (public/js/ui/effects.js)', zh: '每次点击屏幕时迸出的火花（public/js/ui/effects.js）' } },
            { name: 'Rotating Text', by: 'Vue Bits', license: IDEA_ONLY, url: 'https://vue-bits.dev/text-animations/rotating-text',
                note: { ko: '레벨 업 때 화면 전체를 덮는 회전 글자 (public/js/ui/effects.js)', en: 'Rotating text that covers the screen on level-up (public/js/ui/effects.js)', zh: '升级时覆盖整个屏幕的旋转文字（public/js/ui/effects.js）' } },
            { name: 'Sling Button', by: VUE_BITS, license: IDEA_ONLY_MIT, url: 'https://vue-bits.dev/micro/sling-button',
                note: { ko: '모든 버튼의 누름 효과. 누른 채 끌면 고무줄처럼 끌려가고, 놓으면 반대로 튕기며 입자가 부채꼴로 날아가요. Vue Bits 코드를 가져오지 않고 바닐라 자바스크립트로 새로 만들었어요 (public/js/ui/sling-math.js, public/js/ui/effects.js)', en: 'The press effect on every button: drag it and it stretches like a rubber band, release it and it springs back while particles fly out in a fan. Rebuilt in vanilla JavaScript without Vue Bits code (public/js/ui/sling-math.js, public/js/ui/effects.js)', zh: '所有按钮的按下效果。按住拖动会像橡皮筋一样被拉动，松开后反弹，粒子呈扇形飞出。没有使用 Vue Bits 的代码，用原生 JavaScript 重新实现（public/js/ui/sling-math.js、public/js/ui/effects.js）' } },
            { name: 'Scroll Stack', by: 'Vue Bits', license: IDEA_ONLY_MIT, url: 'https://vue-bits.dev/components/scroll-stack',
                note: { ko: '들어올 때 뜨는 "앱처럼 쓰기" 안내창 안에서 카드가 차곡차곡 쌓이는 움직임 (public/js/views/install-guide.js)', en: 'Cards stacking up inside the "Use like an app" guide shown on arrival (public/js/views/install-guide.js)', zh: '进入时弹出的“像 App 一样使用”提示窗中，卡片层层堆叠的动画（public/js/views/install-guide.js）' } },
            { name: 'Fuse Button', by: 'Vue Bits', license: IDEA_ONLY, url: 'https://vue-bits.dev/micro/fuse-button',
                note: { ko: '문제 지우기의 4초 되돌리기 도화선 (public/js/ui/effects.js)', en: 'The 4-second undo fuse when deleting a problem (public/js/ui/effects.js)', zh: '删除题目时 4 秒撤销的导火线（public/js/ui/effects.js）' } },
        ],
    },
    {
        group: { ko: '채점 도구', en: 'Judging tools', zh: '判题工具' },
        items: [
            { name: 'Pyodide', by: { ko: 'Pyodide 프로젝트', en: 'The Pyodide project', zh: 'Pyodide 项目' }, license: 'Mozilla Public License 2.0', url: 'https://pyodide.org/',
                note: { ko: 'Python 문제를 학생 브라우저 안에서 실행 (jsDelivr에서 불러옴, 코드를 고치지 않고 그대로 사용)', en: "Runs Python solutions inside the learner's browser (loaded from jsDelivr, used unmodified)", zh: '在学生的浏览器中运行 Python 题目（从 jsDelivr 加载，未经修改直接使用）' } },
            { name: { ko: 'Judge0 (연결 준비만)', en: 'Judge0 (connection prepared only)', zh: 'Judge0（仅预留连接）' }, by: 'Judge0', license: { ko: 'GPL-3.0 · 설치 시 별도 서버', en: 'GPL-3.0 · separate server if installed', zh: 'GPL-3.0 · 安装时为独立服务器' }, url: 'https://judge0.com/',
                note: { ko: 'C++ · Java 유료 채점용으로 연결 자리만 만들어 둠. 지금은 꺼져 있어요', en: 'A connection point prepared for paid C++ · Java judging. It is currently off', zh: '为付费的 C++ · Java 判题预留了连接位置，目前处于关闭状态' } },
        ],
    },
    {
        group: { ko: '알고리즘 문제', en: 'Algorithm problems', zh: '算法题目' },
        items: [
            { name: 'USA Computing Olympiad (USACO)', by: 'USACO', license: { ko: '단계 구분 방식 참고 · 문제는 옮기지 않음', en: 'Tier structure referenced · no problems copied', zh: '参考段位划分方式 · 未照搬题目' }, url: 'https://usaco.org/index.php',
                note: { ko: '브론즈 · 실버 · 골드 · 플래티넘 단계 나누기와, 단계마다 다루는 알고리즘 주제(완전 탐색, 누적 합, DP, 세그먼트 트리 등)를 참고했어요. c-master 알고리즘 32문제의 지문 · 테스트 · 모범답안(C · Python)은 특정 대회 문제를 옮기지 않고 새로 만든 것이고, USACO 원래 문제는 각 단계의 링크에서 풀 수 있어요', en: 'We referenced the Bronze · Silver · Gold · Platinum tiers and the algorithm topics covered in each (brute force, prefix sums, DP, segment trees and more). The statements, tests and model solutions (C · Python) of the 32 c-master algorithm problems are newly written, not copied from any contest. Original USACO problems are linked from each tier', zh: '参考了青铜 · 白银 · 黄金 · 铂金的段位划分，以及各段位涉及的算法主题（暴力枚举、前缀和、DP、线段树等）。c-master 32 道算法题的题面 · 测试 · 参考答案（C · Python）均为新编写，没有照搬任何比赛题目。USACO 原题可通过各段位的链接练习' } },
            { name: 'USACO Guide', by: 'Competitive Programming Initiative', license: { ko: '링크만 연결', en: 'Linked only', zh: '仅提供链接' }, url: 'https://usaco.guide/',
                note: { ko: '단계별로 더 공부할 곳 안내', en: 'Where to study more for each tier', zh: '各段位的进一步学习指引' } },
        ],
    },
    {
        group: { ko: '그림 · 소리 · 교재', en: 'Art · sound · textbooks', zh: '图片 · 声音 · 教材' },
        items: [
            { name: { ko: '캐릭터 코디 픽셀 아트', en: 'Cody character pixel art', zh: '角色 Cody 像素画' }, by: { ko: 'c-master (Google Gemini로 생성)', en: 'c-master (made with Google Gemini)', zh: 'c-master（用 Google Gemini 生成）' }, license: { ko: '오리지널 그림', en: 'Original artwork', zh: '原创图片' }, url: 'https://gemini.google.com/',
                note: { ko: '아기 코더 → 초딩 → 중딩 → 고딩 → C 마스터 15장. 홈 화면 앱 아이콘은 C 마스터 코디를 픽셀 그대로 키워 만들었어요 (public/assets/icons)', en: '15 images from Baby Coder → Kid → Teen → Senior → C Master. The home-screen app icon is the C Master Cody scaled up pixel by pixel (public/assets/icons)', zh: '宝宝 → 小学生 → 初中生 → 高中生 → C 大师共 15 张。主屏幕 App 图标是把 C 大师 Cody 按像素放大制作的（public/assets/icons）' } },
            { name: { ko: '효과음 (맞았을 때 · 틀렸을 때)', en: 'Sound effects (correct · wrong)', zh: '音效（答对 · 答错）' }, by: 'c-master', license: { ko: '오리지널', en: 'Original', zh: '原创' }, url: '',
                note: { ko: '전자 피아노(FM 합성) 소리를 코드로 직접 만든 짧은 wav 두 개 (tools/sound-synth.mjs)', en: 'Two short electric-piano (FM synthesis) wav clips generated in code (tools/sound-synth.mjs)', zh: '用代码直接合成的两段电钢琴（FM 合成）短 wav 音效（tools/sound-synth.mjs）' } },
            { name: { ko: '《자기주도 C언어 프로그래밍》', en: 'Self-Directed C Programming (자기주도 C언어 프로그래밍)', zh: '《自主学习 C 语言编程》（자기주도 C언어 프로그래밍）' }, by: { ko: '김동규', en: 'Kim Dong-gyu', zh: '金东奎' }, license: { ko: '단원 순서 · 개념만 참고', en: 'Chapter order · concepts only', zh: '仅参考章节顺序 · 概念' }, url: '',
                note: { ko: '문제 · 퀴즈 · 해설은 모두 새로 썼어요', en: 'All problems, quizzes and explanations are newly written', zh: '题目 · 测验 · 解析全部为新编写' } },
            { name: { ko: 'Java vs C# 객체지향 · C# 아키텍처 수업 교안과 개인 필기', en: 'Java vs C# OOP · C# architecture class handouts and personal notes', zh: 'Java vs C# 面向对象 · C# 架构课程讲义与个人笔记' }, by: { ko: '수업 자료 · c-master 학습자 필기', en: 'Class materials · notes of a c-master learner', zh: '课程资料 · c-master 学习者笔记' }, license: { ko: '주제 순서 · 개념만 참고', en: 'Topic order · concepts only', zh: '仅参考主题顺序 · 概念' }, url: '',
                note: { ko: '객체지향 13레슨의 주제(클래스 · 캡슐화 · 상속 · 다형성 · SOLID · Result 패턴 · 데이터 계층 등)를 따랐어요. "쉽게 말하면" 설명 · 문제 · 해설은 모두 새로 썼어요', en: 'The 13 OOP lessons follow these topics (classes · encapsulation · inheritance · polymorphism · SOLID · the Result pattern · data layers and more). The "In plain words" explanations, problems and explanations are all newly written', zh: '面向对象 13 课沿用了这些主题（类 · 封装 · 继承 · 多态 · SOLID · Result 模式 · 数据分层等）。“简单来说”的讲解、题目和解析全部为新编写' } },
        ],
    },
]);

/** { ko, en, zh } 이면 그 언어(없으면 ko), 그냥 글자면 그대로 */
export function creditText(value, locale) {
    if (value === null || typeof value !== 'object') {
        return value ?? '';
    }
    return value[locale] ?? value.ko ?? '';
}
