# progress Specification (진도·경험치·코디 진화)

## Purpose
규칙은 `public/js/domain/progress-rules.js` 한 곳에 있고 서버와 화면이 같이 쓴다.

## Requirements

### Requirement: Solve time limit
Each problem SHALL have a solve time limit (★ 10 min, ★★ 20 min, ★★★ 30 min) counted only while the problem page is visible, shown as a timeline that turns yellow at 80% and red after the limit.

#### Scenario: Keep solving after the limit
- **WHEN** the limit has passed
- **THEN** the member can keep solving and the timeline shows the overtime

### Requirement: Experience points
The first correct submission SHALL give 10/20/30 XP by difficulty, or 20% (2/4/6) if the limit was exceeded. A quiz score of 4 or more SHALL give 10 XP once and a perfect score 10 XP more. Every 100 XP SHALL be one level.

#### Scenario: Exactly on time
- **WHEN** a ★★ problem is solved at exactly 20:00
- **THEN** 20 XP

#### Scenario: One second late
- **WHEN** it is solved at 20:01
- **THEN** 4 XP

#### Scenario: Server recalculation
- **WHEN** the browser sends `xp: 99999`
- **THEN** the server ignores it and recalculates XP from the solved records and quiz scores

### Requirement: Model solution unlock
The model solution SHALL open only after the problem is solved, or after the time limit has passed and at least 2 submissions with self-written code (not the default template) were made.

#### Scenario: Empty template submissions
- **WHEN** a member submits the default template twice
- **THEN** the solution stays locked and shows the remaining conditions

### Requirement: Chapter clear and evolution
A chapter SHALL be cleared when all 4 problems are solved and the best quiz score is at least 4. Cody SHALL evolve when stage 1, 2 and 3 are cleared and become C 마스터 when all 18 chapters are cleared, showing the evolution once.

#### Scenario: Stage 1 cleared
- **WHEN** chapters 1-4 become cleared
- **THEN** Cody becomes 초딩 코더 with the evolution animation and sound

### Requirement: Saving progress
Progress SHALL be saved to the server shortly after each change and when the tab is hidden. The server SHALL reject bodies over 512 KB and clean every field through the progress mapper.

#### Scenario: Another device
- **WHEN** a member logs in on another device
- **THEN** the same progress, code and settings are restored
