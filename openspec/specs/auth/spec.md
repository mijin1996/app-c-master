# auth Specification (회원가입·로그인·계정 찾기)

## Purpose
code.ai 계정은 Claude 등 외부 계정과 상관없이 아이디·비밀번호로 동작한다. 비밀번호와 복구 코드는 해시로만 저장한다.

## Requirements

### Requirement: Sign up with username and password
The system SHALL create an account from a username (lowercase letters, digits, `_`, 3-16 chars), a password (4-64 chars) and an optional nickname (1-12 chars, defaults to the username), and SHALL issue an 8-character recovery code shown only once.

#### Scenario: Valid sign up
- **WHEN** a visitor submits `Cody_01`, nickname ` 코디 `, password `abcd`
- **THEN** the account `cody_01` with nickname `코디` is created, a session cookie is set, and a code like `K7Q2-9MXA` is returned once

#### Scenario: Duplicate username
- **WHEN** a visitor signs up with an existing username
- **THEN** the request fails with `USERNAME_TAKEN` (HTTP 409)

#### Scenario: Invalid input
- **WHEN** the username is 2 characters, or the password is 3 characters, or the nickname is 13 characters
- **THEN** the request fails with `INVALID_USERNAME`, `INVALID_PASSWORD` or `INVALID_NICKNAME`

### Requirement: Log in and sessions
The system SHALL start a 30-day session stored as an HttpOnly, Secure, SameSite=Lax cookie, and SHALL store only the SHA-256 hash of the session token.

#### Scenario: Correct password
- **WHEN** a member logs in with the right password (username is case-insensitive)
- **THEN** a session cookie is set and `/api/auth/me` returns the member

#### Scenario: Wrong password or unknown username
- **WHEN** the password is wrong or the username does not exist
- **THEN** both cases fail with the same `WRONG_CREDENTIALS` (HTTP 401)

#### Scenario: Expired session
- **WHEN** 30 days have passed since the session started
- **THEN** `/api/auth/me` fails with `UNAUTHORIZED`

#### Scenario: Log out
- **WHEN** a member logs out
- **THEN** the session is deleted and the cookie is cleared

### Requirement: Recover account with recovery code
The system SHALL let a member find their username from the recovery code, and reset the password with username plus recovery code. A reset SHALL replace the recovery code and end all sessions of that member.

#### Scenario: Find username
- **WHEN** a visitor enters a valid code in any case, with or without the hyphen
- **THEN** the matching username is shown

#### Scenario: Reset password
- **WHEN** a visitor enters the username, the matching code and a new password
- **THEN** the password changes, a new recovery code is shown once, the old code and old password stop working, and other devices are logged out

#### Scenario: Someone else's code
- **WHEN** a visitor enters a username with another member's code
- **THEN** the reset fails with `RECOVERY_MISMATCH`

#### Scenario: Renew code
- **WHEN** a logged-in member asks for a new recovery code in settings
- **THEN** a new code is shown once and the previous code stops working
