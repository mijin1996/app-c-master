# Algorithm Tracks

### Requirement: Algorithm tracks
The site SHALL offer algorithm problems grouped into 브론즈, 실버, 골드, 플래티넘 tracks (difficulty 4–7), each with its own section, XP (40/60/80/100) and solve limit (30/45/60/90 min). Solving them SHALL add XP but SHALL NOT affect chapter clears or Cody's evolution.

#### Scenario: Solving a gold problem in time
- **GIVEN** a signed-in learner on problem 5303
- **WHEN** they submit an accepted solution within 60 minutes
- **THEN** they gain 80 XP and the gold section shows the problem as solved
