# i18n

### Requirement: Language switcher
The site SHALL offer 한국어, English and 中文 from a switcher in the top bar (after login) and on the first screen (before login). Switching SHALL re-render the current screen in place without losing progress, and the choice SHALL be remembered in this browser. A first visit SHALL follow the browser language (zh* → 中文, en* → English, otherwise 한국어).

#### Scenario: Switching while solving
- **GIVEN** a learner on problem 1001 in 한국어 with code typed
- **WHEN** they pick English
- **THEN** the statement, hints and buttons are in English and their code is unchanged

### Requirement: Full content translation
All learning content (C chapters, algorithm problems, OOP lessons) SHALL be available in English and Chinese. Code, tests and expected outputs SHALL NOT change; when an expected output contains Korean text, the translated statement SHALL quote that Korean text verbatim.

### Requirement: No missing translations
Builds SHALL fail when any translatable field is missing, an array length differs from the Korean original, or Korean text remains in a translation that does not appear in that item's own code, tests or expected output.
