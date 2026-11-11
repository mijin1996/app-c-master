// 고르기 창 규칙 (순수 함수): 제목, 키보드 움직임, 카드가 붙는 높이

export const PICKER_STICKY = Object.freeze({
    TOP_PX: 8,     // 첫 카드가 붙는 높이
    STEP_PX: 10,   // 뒤 카드는 이만큼씩 아래에 붙어 앞 카드 윗부분이 보인다
    MAX_STEPS: 6,  // 목록이 길어도 이 이상은 내려가지 않는다 (나라 목록처럼 30개가 넘어도 화면이 안 막히게)
});

/** 창 제목: 감싼 라벨 글자 → aria-label → 기본 글자 */
export function pickerTitle({ label = '', ariaLabel = '', fallback = '' } = {}) {
    return label.trim() || ariaLabel.trim() || fallback;
}

/** 키보드로 카드 사이를 움직일 때 다음 위치 (끝에서는 멈춤) */
export function nextIndex(current, count, key) {
    if (count <= 0) {
        return -1;
    }
    const moves = {
        ArrowDown: Math.min(count - 1, current + 1),
        ArrowUp: Math.max(0, current - 1),
        Home: 0,
        End: count - 1,
    };
    return moves[key] ?? current;
}

export function stickyTopOf(index) {
    return PICKER_STICKY.TOP_PX + Math.min(index, PICKER_STICKY.MAX_STEPS) * PICKER_STICKY.STEP_PX;
}
