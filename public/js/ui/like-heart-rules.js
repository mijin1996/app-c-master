// 좋아요 하트 규칙 (순수 함수)

/** 하트 위 말풍선에 보일 사전 키 */
export function likeTipKey({ liked, disabled }) {
    if (disabled) {
        return 'comm.cantLikeOwn';
    }
    return liked ? 'comm.unlike' : 'comm.like';
}

/** 좋아요 수: 0 이상의 정수만 */
export function likedCount(value) {
    const n = Math.floor(Number(value));
    return Number.isFinite(n) && n > 0 ? n : 0;
}
