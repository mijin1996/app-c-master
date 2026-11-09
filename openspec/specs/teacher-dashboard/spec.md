# teacher-dashboard Specification (선생님 화면)

## Purpose
선생님은 `TEACHER_USERNAMES` 환경 변수로 정한다.

## Requirements

### Requirement: Student progress overview
Teachers SHALL see every member's nickname, username, Cody form, an 18-cell chapter progress strip, solved count, quiz average, XP and last study day, plus per-chapter clear counts and the most-missed problem. Submitted code SHALL never be sent.

#### Scenario: Student opens the teacher API
- **WHEN** a non-teacher calls `/api/teacher/students`
- **THEN** the request fails with `FORBIDDEN` (HTTP 403)
