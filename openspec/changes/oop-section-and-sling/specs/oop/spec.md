# OOP Lessons

### Requirement: Object-oriented lesson section
The site SHALL offer an 객체지향 section with numbered lessons drawn from the class notes (클래스, 캡슐화, 상속, 다형성, 추상·인터페이스, 제네릭·컬렉션, Object 규약·문자열, 델리게이트·LINQ, 예외·메모리, 직렬화·HTTP·비동기, 데이터 계층, Result·테스트, SOLID). Each lesson SHALL show a plain-language "쉽게 말하면" explanation and a 5-question quiz where every answer shows an easy explanation.

#### Scenario: Passing a lesson quiz
- **GIVEN** a signed-in learner who never took lesson 3
- **WHEN** they answer 4 of 5 questions correctly
- **THEN** they gain 10 XP and the lesson list shows 4/5 as their best

#### Scenario: Perfect score later
- **GIVEN** a learner whose best on lesson 3 is 4
- **WHEN** they score 5
- **THEN** they gain another 10 XP only once, and chapter clears and Cody's form do not change

### Requirement: Server recomputes OOP XP
The server SHALL compute OOP XP from stored best scores of known lessons only, ignoring unknown lesson numbers and clamping scores to 0–5.
