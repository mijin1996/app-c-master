# languages

### Requirement: Language choice for algorithm problems
Algorithm problems SHALL be solvable in C and Python in the browser. C++ and Java SHALL appear as paid languages that stay disabled until PAID_LANGUAGES_ENABLED and JUDGE0_URL are set. Chapter problems SHALL stay C only.

### Requirement: Code style per language (2026-11-12)
Each language SHALL have its usual style: C and C++ Allman (site default), Java K&R, Python PEP 8. The Allman/K&R toggle SHALL change only the current brace language and be remembered per language; Python SHALL always use PEP 8 and show no toggle. An old single `codeStyle` setting SHALL carry over to C and C++.

#### Scenario: Pressing Enter in the editor
- GIVEN Allman and the line `int main() {`
- WHEN the learner presses Enter
- THEN `{` moves to its own line, the caret is indented 4 spaces, and a matching `}` is added if none is open
- AND with K&R `{` stays on the line; with PEP 8 a line ending in `:` indents the next line 4 spaces

#### Scenario: Untouched old template
- GIVEN a saved code that is only the old K&R starter template (no letters added)
- WHEN the problem opens
- THEN the starter template is shown in the current style
