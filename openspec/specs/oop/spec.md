# oop Specification (객체지향 레슨)

## Purpose
수업에서 배운 Java · C# 객체지향과 아키텍처를 초등학생도 알아들을 말로 풀어 주고, 바로 문제로 확인하게 한다.

## Requirements

### Requirement: Object-oriented lesson section
The site SHALL offer an 객체지향 menu with 13 numbered lessons drawn from the class notes (클래스, 캡슐화, 상속, 다형성, 추상·인터페이스, 제네릭·컬렉션, Object 규약·문자열, 델리게이트·LINQ, 예외·메모리, 직렬화·HTTP·비동기, 데이터 계층, Result·테스트, SOLID). Each lesson SHALL show a plain-language "쉽게 말하면" explanation, key points, a code example, and a 5-question quiz where every answer shows an easy explanation. The result screen SHALL list the questions answered wrong with their explanations.

#### Scenario: Passing a lesson quiz
- **GIVEN** a signed-in learner who never took lesson 3
- **WHEN** they answer 4 of 5 questions correctly
- **THEN** they gain 10 XP and the lesson list shows 최고 4 / 5

#### Scenario: Perfect score later
- **GIVEN** a learner whose best on lesson 3 is 4
- **WHEN** they score 5
- **THEN** they gain another 10 XP only once, and chapter clears and Cody's form do not change

### Requirement: Server recomputes OOP XP
The server SHALL compute OOP XP from stored best scores of known lessons only. The mapper SHALL keep only lesson keys 1–99 and clamp scores to 0–5.

### Requirement: Content is checked before publishing
`node tools/build-oop.mjs` SHALL refuse to build when lesson numbers are not 1..N, a lesson does not have exactly 5 questions, an answer index is outside the options, or an explanation is empty. Tests SHALL fail if the built files differ from `content/oop.cjs` or one answer position holds more than 40% of answers.
