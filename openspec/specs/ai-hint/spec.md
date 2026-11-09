# ai-hint Specification (AI 힌트 (준비됨, 꺼져 있음))

## Purpose
코드와 서버 자리는 있으나 기본으로 꺼져 있다.

## Requirements

### Requirement: Hidden until enabled
The AI hint button SHALL be shown only when `FEATURES.aiHint` is true in the client and the server reports `features.aiHint` (requires `AI_HINT_ENABLED=true` and `AI_HINT_API_KEY`). Otherwise `/api/hint` SHALL return `FEATURE_DISABLED` (HTTP 503).

#### Scenario: Default deployment
- **WHEN** nothing is configured
- **THEN** no AI hint button is visible and the API answers 503

### Requirement: Hints without answers
When enabled, the server SHALL send the problem, the numbered code and the judge result to the configured provider with instructions to answer in 3-5 Korean sentences, point at line numbers and never give full corrected code.

#### Scenario: Provider failure
- **WHEN** the AI service returns 5xx or times out
- **THEN** the member sees a Korean message and can retry
