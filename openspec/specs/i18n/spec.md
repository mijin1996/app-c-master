# i18n Specification (언어: 한국어 · English · 中文)

## Purpose
누구나 자기 언어로 같은 내용을 배우고, 채점은 언어와 상관없이 같게 한다.

## Requirements

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

### Requirement: Examples follow the chosen brace style (2026-11-12)
Concept examples, chapter quiz code and model solutions in brace languages SHALL be shown in the learner's code style for that language (Allman by default, K&R when chosen). Code boxes in community posts and comments (``` with no tag, c, cpp, java) SHALL follow the same style. Python code and OOP lessons (already Allman) SHALL be shown as written.

#### Scenario: Default learner opens chapter 5
- **WHEN** a learner who never changed the style opens the chapter 5 concept
- **THEN** the example shows `{` on its own line after `if (s >= 90)`
