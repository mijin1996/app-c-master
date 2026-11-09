# Ambience (변경)

### Requirement: Sling button press effect
Every button press SHALL show a slingshot effect: dragging pulls the button a little toward the pointer (limited distance), releasing snaps it the other way with a spring return and a fan of particles in the launch direction. A plain tap SHALL launch a small burst upward. Users with reduced motion SHALL see no movement. The delete undo countdown SHALL keep working.

#### Scenario: Pulling and releasing a button
- **GIVEN** a learner presses the 제출 button and drags 40px left
- **WHEN** they release
- **THEN** the button springs right and particles fly to the right, and the click still submits
