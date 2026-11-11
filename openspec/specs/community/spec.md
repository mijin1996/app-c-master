# community

### Requirement: Community problems and discussion
Signed-in users SHALL be able to post problems with tests, solve them in C or Python, comment, like others' posts, and report posts. The author SHALL be able to accept one comment. Posts with 3 reports from different users SHALL be hidden automatically; teachers SHALL be able to hide or restore posts. Community problems SHALL NOT grant XP.

### Requirement: Like heart (2026-11-12)
Inside a community problem, the problem and every comment SHALL show one heart in the Peek Rating style next to its like count: hovering lifts and enlarges the heart and shows a small pill (좋아요 / 좋아요 취소, or why it can't be pressed on your own post), pressing pops it and updates the count without reloading the page. The list SHALL keep one small heart plus the number.

### Requirement: Swipe rows in the list (2026-11-12)
The community list SHALL show each problem as a rounded dark row (title and badges, tier · author · date, heart count · comment count). Swiping a row left SHALL reveal its actions — Like for other people's problems, Delete for your own, Hide/Show as well for teachers — and swiping all the way SHALL run the first action. There SHALL be no archive action. Deleting from the list SHALL offer 4 seconds to undo before it happens. A plain tap SHALL open the problem.

#### Scenario: Swiping your own problem away
- **GIVEN** the learner's own problem in the list
- **WHEN** they swipe it all the way left
- **THEN** the row slides out and collapses, an undo notice shows for 4 seconds, and only then is the problem deleted
