# ambience Specification (분위기: 하늘·소리·코디)

## Purpose
공부에 방해되지 않도록 장식은 화면 가장자리에만 둔다.

## Requirements

### Requirement: Sun-based sky
The background SHALL follow the real sun altitude for the chosen Korean city: night below -6°, dawn/evening -6° to 0°, morning/sunset 0° to 10°, day above. Day phases SHALL use the light theme and night phases the dark theme. Settings SHALL allow always-day or always-night.

#### Scenario: Winter evening
- **WHEN** it is 18:00 in Seoul in December
- **THEN** the night sky with stars, moon phase and lit windows is shown in dark mode

### Requirement: Pre-rendered piano sounds
The system SHALL play pre-rendered original piano clips for correct, wrong, quiz right/wrong, clear and evolution, and an optional looping background piece that is off by default.

#### Scenario: Autoplay rules
- **WHEN** the page has not been clicked yet
- **THEN** no sound plays until the first click

### Requirement: Growing character
Cody SHALL be an original character with 5 forms and normal, happy and thinking moods, renamed freely in settings.

#### Scenario: Wrong answer
- **WHEN** a submission is wrong
- **THEN** Cody shows the thinking face with an encouraging line
### Requirement: Feedback effects
Every click outside buttons SHALL show a short spark; every button press SHALL show the slingshot effect below; the delete undo button SHALL burn a fuse along its rim while it can be undone; a level-up SHALL cover the screen briefly with rotating text; the code editor panel SHALL glow green while focused and return to normal when focus leaves. All effects SHALL respect reduced motion.

### Requirement: Sling button press effect
Every button press SHALL show a slingshot effect: dragging pulls the button a little toward the pointer (limited distance), releasing snaps it the other way with a spring return and a fan of particles in the launch direction. A plain tap SHALL launch a small burst upward. A loaded (armed) release SHALL still press the button even when the pointer ends outside it. Users with reduced motion SHALL see no movement.

#### Scenario: Pulling and releasing a button
- **GIVEN** a learner presses the 퀴즈 풀기 button and drags 80px down
- **WHEN** they release outside the button
- **THEN** the button springs up, particles fly upward, and the quiz starts

### Requirement: Install guide on every visit
When the site is opened in a browser (not as an installed home-screen app), it SHALL show a guide explaining how to add it to the home screen on iPhone/iPad (Safari) and Android (Chrome, Samsung Internet), with the visitor's own platform first. The cards SHALL stack as the guide scrolls. Tapping ✕, the backdrop, or pressing Esc SHALL close it for the rest of the visit.

### Requirement: Soft electric piano sounds (2026-11-10)
The correct and wrong sounds SHALL be soft FM electric piano clips: a rising major arpeggio for correct and two gentle falling low notes for wrong, never clipping and fading out without a click.

## MODIFIED Requirements (2026-11-09)

### Requirement: Sounds
The site SHALL play only two short sound effects: one when an answer is correct and one when it is wrong (problems, community problems and quiz answers). There SHALL be no background music. Learners SHALL be able to turn the effects off in settings.
