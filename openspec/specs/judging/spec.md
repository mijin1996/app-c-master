# judging Specification (채점)

## Purpose
채점은 학생의 브라우저에서 C11 학습용 인터프리터로 한다.

## Requirements

### Requirement: Judge a submission
The system SHALL run the code against every hidden test in order and SHALL report the first failing verdict: AC, WA, CE, RE, TLE or OLE. Trailing spaces on each line and trailing newlines SHALL be ignored.

#### Scenario: Correct
- **WHEN** every test output matches
- **THEN** the verdict is `맞았습니다!!`

#### Scenario: Wrong output
- **WHEN** test 1 output differs
- **THEN** the verdict is `틀렸습니다` with the input, my output and the expected output side by side

#### Scenario: Missing semicolon
- **WHEN** line 3 has no semicolon
- **THEN** the verdict is `컴파일 에러` with line 3 and a Korean explanation

#### Scenario: Infinite loop
- **WHEN** the program never ends
- **THEN** the verdict is `시간 초과` and the submit button works again

### Requirement: Beginner-friendly errors
Error messages SHALL be plain Korean and SHALL point at common mistakes such as a missing `&` in `scanf`, array index out of range, division by zero and deep recursion.

#### Scenario: scanf without &
- **WHEN** the code calls `scanf("%d", a)`
- **THEN** the message says the `&` seems to be missing

### Requirement: Run without recording
The system SHALL run the first sample or custom input (and custom `input.txt`) without recording a submission.

#### Scenario: Sample run
- **WHEN** a member presses 예제 실행
- **THEN** the output is shown with a chip saying whether it matches the sample

### Requirement: Execution isolation
Code SHALL run in a Web Worker with a 3-second time limit, and SHALL fall back to running in the page when workers are unavailable.

#### Scenario: No worker support
- **WHEN** the browser blocks workers
- **THEN** judging still finishes and the submit button is re-enabled
