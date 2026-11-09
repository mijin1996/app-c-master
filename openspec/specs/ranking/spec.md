# ranking Specification (친구 랭킹)

## Purpose
참여한 사람만 경험치 순으로 보여 준다.

## Requirements

### Requirement: Ranking list
The system SHALL list members who opted in, ordered by XP then solved count, up to 100 entries, marking the viewer's own row. Members SHALL be able to opt out in settings.

#### Scenario: Opt out
- **WHEN** a member turns off 랭킹 참여
- **THEN** the member disappears from the ranking on the next save
