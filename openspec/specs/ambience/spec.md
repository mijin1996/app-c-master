# ambience Specification (분위기: 하늘·소리·코디)

## Purpose
공부에 방해되지 않도록 장식은 화면 가장자리에만 둔다.

## Requirements

### Requirement: Letter glitch background (2026-11-12)
Every screen SHALL sit on a letter-glitch background (a grid of monospace characters where about 5% change letter and fade to a new colour every 50 ms) in the site palette — navy, blue and orange at night, pale blue-grey, blue and orange by day — with an outer vignette in the page colour so content stays readable. Reduced motion SHALL freeze it.

### Requirement: 24-hour clock and country (2026-11-12)
The top bar SHALL show only the current time as HH:MM in 24-hour format (no sunrise, sunset or phase text). The time zone SHALL follow this device by default; settings SHALL let the learner pick a country (names shown in the current language). Day/night theme SHALL follow the sun at that country's capital (or 06–18 local time when the device zone is not in the list). Settings SHALL still allow always-day or always-night.

#### Scenario: Picking the US East
- **WHEN** a learner in Seoul at 04:54 picks United States (New York)
- **THEN** the clock shows 14:54

### Requirement: One look for every toggle (2026-11-12)
Every choice list (language, country, background, problem filters, code language, Allman/K&R, community form choices) SHALL open as a button with white text and, on press, a card window that looks like the install guide: a panel with a title and ✕, one card per option, the current option highlighted, and cards stacking as they scroll when there are five or more. Arrow keys, Home/End and Esc SHALL work. The Allman/K&R picker SHALL show only the two option names: no visible "code style" label or title and no descriptions (the name stays for screen readers). The language toggle SHALL have no globe icon.

### Requirement: One focus color and text color (2026-11-12)
Every selected field, card and the solve panel SHALL pulse orange to yellow (site colors), not green. List rows and table links (records, community) SHALL use the same text color as other text, with orange on hover.

### Requirement: Phone layout stays centered (2026-11-12)
On touch devices inputs SHALL be at least 16px so iOS does not zoom, and long example code SHALL scroll inside its box instead of widening the page (grid columns `minmax(0, 1fr)`).

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
When the site is opened in a browser (not as an installed home-screen app), it SHALL show a guide explaining how to add it to the home screen on iPhone/iPad (Safari), Android (Chrome, Samsung Internet) and computers (Chrome, Edge, Mac Safari), with the visitor's own platform first. Cards SHALL grow to fit their text, sit 18px apart, and every card — including the last — SHALL stack at its sticky spot when scrolled to the end. The guide SHALL carry no extra helper sentences. Only the ✕ button SHALL close it (not the backdrop or Esc), for the rest of the visit. A "📲 홈 화면 추가" button in the top bar and on the login screen SHALL reopen it at any time.

### Requirement: Soft electric piano sounds (2026-11-10)
The correct and wrong sounds SHALL be soft FM electric piano clips: a rising major arpeggio for correct and two gentle falling low notes for wrong, never clipping and fading out without a click.

## MODIFIED Requirements (2026-11-09)

### Requirement: Sounds
The site SHALL play only two short sound effects: one when an answer is correct and one when it is wrong (problems, community problems and quiz answers). There SHALL be no background music. Learners SHALL be able to turn the effects off in settings.
