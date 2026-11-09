// 풀이 언어 목록과 규칙. 화면·서버가 함께 쓴다.
// runtime: browser(학생 브라우저에서 채점, 무료) | server(채점 서버 필요, 유료 예정)

export const LanguageId = Object.freeze({ C: 'c', PYTHON: 'python', CPP: 'cpp', JAVA: 'java' });

export const LANGUAGES = Object.freeze([
    { id: LanguageId.C, label: 'C (C11)', runtime: 'browser', paid: false,
        template: '#include <stdio.h>\n\nint main() {\n    \n    return 0;\n}\n' },
    { id: LanguageId.PYTHON, label: 'Python 3', runtime: 'browser', paid: false,
        template: 'import sys\n\ninput = sys.stdin.readline\n\n\n' },
    { id: LanguageId.CPP, label: 'C++17', runtime: 'server', paid: true,
        template: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n' },
    { id: LanguageId.JAVA, label: 'Java 17', runtime: 'server', paid: true,
        template: 'import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        \n    }\n}\n' },
]);

const BY_ID = new Map(LANGUAGES.map((lang) => [lang.id, lang]));

export function languageOf(id) {
    return BY_ID.get(id) ?? BY_ID.get(LanguageId.C);
}

export function isLanguageId(id) {
    return BY_ID.has(id);
}

/**
 * 이 언어를 지금 쓸 수 있는가.
 * @param {string} id
 * @param {{ paidLanguages: boolean }} features 서버 채점(유료 언어)이 켜져 있는지
 */
export function isLanguageAvailable(id, features) {
    const lang = BY_ID.get(id);
    if (!lang) {
        return false;
    }
    return !lang.paid || features.paidLanguages === true;
}

/** 진도의 code 칸 이름: C는 예전처럼 문제 번호만, 다른 언어는 "번호:언어" */
export function codeKey(problemId, languageId) {
    return languageId === LanguageId.C ? String(problemId) : String(problemId) + ':' + languageId;
}
