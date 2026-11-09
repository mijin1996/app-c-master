## ADDED Requirements

### Requirement: Student progress overview
Teachers SHALL see every member's nickname, username, Cody form, an 18-cell chapter progress strip, solved count, quiz average, XP and last study day, plus per-chapter clear counts and the most-missed problem. Submitted code SHALL never be sent.

#### Scenario: Student opens the teacher API
- **WHEN** a non-teacher calls `/api/teacher/students`
- **THEN** the request fails with `FORBIDDEN` (HTTP 403)
