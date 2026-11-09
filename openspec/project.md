# Project Context

## Purpose
C 마스터: C언어를 어려워하는 학습자가 18단원 문제 풀이와 단원 퀴즈로 개념을 익히는 웹사이트.
《자기주도 C언어 프로그래밍》의 단원 순서·개념만 참고하고 콘텐츠는 모두 새로 만든다.

## Tech Stack
- Cloudflare Pages (정적 화면 `public/`) + Pages Functions (`functions/` → `server/`) + D1 (SQLite)
- 바닐라 자바스크립트 ES 모듈, 빌드 도구·외부 라이브러리 없음
- 테스트: Node.js 22.13+ 내장 `node:test`, 가짜 D1은 `node:sqlite`
- 채점: 브라우저용 C11 학습용 인터프리터 (`public/js/judge/c-interpreter.js`)

## Project Conventions
코딩 규칙은 [AGENTS.md](../AGENTS.md)를 따른다: K&R 중괄호, 4칸 들여쓰기, DataSource → Repository → Service → View,
생성자 주입, Result 패턴, Given-When-Then 테스트, 커밋 머리말(feat/fix/refactor/test/docs).

## Domain Context
- 난이도 ★1~3, 풀이 제한 10/20/30분, 늦으면 경험치 20%
- 단원 클리어 = 문제 4개 정답 + 퀴즈 4점 이상
- 코디 진화 0~4단계: 스테이지 1·2·3 클리어, 18단원 전부 클리어

## Important Constraints
- 저작권: 교재 문장·문제·코드를 옮기지 않는다
- 사용자는 중학생 포함: 화면 문장과 오류 메시지는 쉬운 한국어
- 비밀값은 Cloudflare Secret으로만

## External Dependencies
- Google Fonts (Jua, IBM Plex Sans KR, JetBrains Mono)
- (선택) Claude API: AI 힌트를 켤 때만
