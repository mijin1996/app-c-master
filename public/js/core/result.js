// Result 패턴: 성공(Success)과 실패(Failure)를 값으로 돌려준다.
// 예외는 "예상 못 한 사고"에만 쓰고, 예상 가능한 실패(아이디 중복, 비밀번호 틀림 등)는 Failure로 알린다.
// 받는 쪽은 instanceof Success / Failure 로 나눠서 처리한다.

export class Result {
    static success(data) {
        return new Success(data);
    }

    static failure(error, detail) {
        return new Failure(error, detail);
    }
}

export class Success extends Result {
    constructor(data) {
        super();
        this.data = data;
        Object.freeze(this);
    }
}

export class Failure extends Result {
    constructor(error, detail) {
        super();
        this.error = error;          // AppError 값
        this.detail = detail ?? null; // 화면에 보여 줄 추가 정보(선택)
        Object.freeze(this);
    }
}
