// 앱에서 생길 수 있는 실패 종류 (enum 역할)
// 데이터 실패는 Repository가, 규칙 실패는 Service가 만든다.
export const AppError = Object.freeze({
    // 데이터·통신 실패 (Repository)
    NOT_FOUND: 'NOT_FOUND',
    NETWORK: 'NETWORK',
    TIMEOUT: 'TIMEOUT',
    SERVER: 'SERVER',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',

    // 입력·규칙 실패 (Service)
    INVALID_USERNAME: 'INVALID_USERNAME',
    INVALID_PASSWORD: 'INVALID_PASSWORD',
    INVALID_NICKNAME: 'INVALID_NICKNAME',
    USERNAME_TAKEN: 'USERNAME_TAKEN',
    NICKNAME_TAKEN: 'NICKNAME_TAKEN',
    WRONG_CREDENTIALS: 'WRONG_CREDENTIALS',
    INVALID_RECOVERY_CODE: 'INVALID_RECOVERY_CODE',
    RECOVERY_MISMATCH: 'RECOVERY_MISMATCH',
    INVALID_PROGRESS: 'INVALID_PROGRESS',
    PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
    FEATURE_DISABLED: 'FEATURE_DISABLED',
    INVALID_HINT_REQUEST: 'INVALID_HINT_REQUEST',
    INVALID_RUN_REQUEST: 'INVALID_RUN_REQUEST',
    INVALID_POST: 'INVALID_POST',
    TOO_MANY_POSTS: 'TOO_MANY_POSTS',
});

// 화면에 보여 줄 쉬운 한국어 문장
export const AppErrorMessage = Object.freeze({
    NOT_FOUND: '찾는 정보가 없어요.',
    NETWORK: '인터넷 연결을 확인해 주세요.',
    TIMEOUT: '서버 응답이 너무 늦어요. 잠시 뒤 다시 시도해 주세요.',
    SERVER: '서버에 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.',
    UNAUTHORIZED: '로그인이 필요해요.',
    FORBIDDEN: '이 화면을 볼 권한이 없어요.',
    INVALID_USERNAME: '아이디는 영문 소문자·숫자·_ 3~16자로 입력하세요.',
    INVALID_PASSWORD: '비밀번호는 4자 이상 64자 이하로 입력하세요.',
    INVALID_NICKNAME: '닉네임은 1~12자로 입력하세요.',
    USERNAME_TAKEN: '이미 있는 아이디예요. 다른 아이디를 써 주세요.',
    NICKNAME_TAKEN: '다른 사람이 쓰고 있는 닉네임이에요. 다른 닉네임을 써 주세요.',
    WRONG_CREDENTIALS: '아이디나 비밀번호가 맞지 않아요.',
    INVALID_RECOVERY_CODE: '복구 코드 8자리를 정확히 입력하세요.',
    RECOVERY_MISMATCH: '아이디와 복구 코드가 맞지 않아요.',
    INVALID_PROGRESS: '저장할 진도 정보가 올바르지 않아요.',
    PAYLOAD_TOO_LARGE: '저장할 내용이 너무 커요.',
    FEATURE_DISABLED: '아직 준비 중인 기능이에요.',
    INVALID_HINT_REQUEST: '힌트를 요청할 정보가 부족해요.',
    INVALID_RUN_REQUEST: '실행할 코드나 언어가 올바르지 않아요.',
    INVALID_POST: '글 내용이 올바르지 않아요.',
    TOO_MANY_POSTS: '너무 많이 올렸어요. 잠시 뒤에 다시 올려 주세요.',
});

export function messageOf(error) {
    return AppErrorMessage[error] ?? '알 수 없는 문제가 생겼어요.';
}
