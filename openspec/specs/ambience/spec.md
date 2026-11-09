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
