# learning-content Specification (학습 콘텐츠)

## Purpose
교재의 18단원 순서와 개념만 따르고, 문제·퀴즈·해설은 모두 새로 쓴다.

## Requirements

### Requirement: Eighteen chapters in five stages
The system SHALL provide 18 chapters grouped into 5 stages (기초 1-4, 제어 5-8, 자료·함수 9-13, 문자열·구조체 14-16, 포인터·파일 17-18). Each chapter SHALL have a concept card, 4 problems (difficulty 1-3) and a 5-question quiz.

#### Scenario: Chapter page
- **WHEN** a member opens chapter 7
- **THEN** the concept points, an example program, the 4 problems with status, and the quiz entry are shown

### Requirement: All chapters open
All chapters SHALL be available from the start; the learning map only recommends an order.

#### Scenario: Jump ahead
- **WHEN** a new member opens problem 1064 in chapter 16
- **THEN** the member can read, run and submit it

### Requirement: Online-judge problem format
Each problem SHALL show number, title, difficulty, statement, input spec, output spec, up to two samples with copy buttons, and two hints.

#### Scenario: No-input problem
- **WHEN** the problem reads no input
- **THEN** only one sample is shown with input `(입력 없음)`

#### Scenario: File problem
- **WHEN** the problem reads `input.txt` or is judged on `output.txt`
- **THEN** samples show the file contents and the judge target

### Requirement: Verified answers
Every model solution SHALL be compiled with gcc to produce expected outputs, and the build SHALL fail if the browser interpreter output differs.

#### Scenario: Content build
- **WHEN** `node tools/build-content.mjs` runs
- **THEN** all 242 tests match gcc or the build exits with an error
