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

### Requirement: Examples use each language's convention (2026-11-13)
Concept examples, chapter quiz code and model solutions SHALL always be shown in the usual style of their language — C and C++ Allman, Java K&R (Oracle Code Conventions · Google Java Style), Python PEP 8 — whatever the learner picked in the editor. The Allman/K&R toggle SHALL affect only the editor. Code boxes in community posts and comments SHALL be shown exactly as the author wrote them. OOP lessons are C# and SHALL be shown as written (Allman, the C# convention).

#### Scenario: Default learner opens chapter 5
- **WHEN** a learner who never changed the style opens the chapter 5 concept
- **THEN** the example shows `{` on its own line after `if (s >= 90)`

#### Scenario: Learner switched the editor to K&R
- **GIVEN** a learner who chose K&R for C in the problem editor
- **WHEN** they open a chapter concept, a quiz with code, or a model solution
- **THEN** the C code is still shown in Allman, and only their editor uses K&R
