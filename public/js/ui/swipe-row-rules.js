// 밀어서 고르는 줄 규칙 (순수 함수). Vue Bits "Swipe Row" 의 움직임을 따르되, 보관함(archive) 버튼은 쓰지 않는다.

export const SWIPE = Object.freeze({
    START_PX: 10,         // 이만큼 넘게 움직여야 끌기 시작
    RESISTANCE: 0.55,     // 서랍보다 더 밀면 이 비율만큼만 따라온다
    ACTION_WIDTH: 80,     // 버튼 하나의 폭
    COMMIT_RATIO: 0.6,    // 줄 폭의 60% 를 넘게 밀면 첫 버튼을 바로 실행
    FLICK_SPEED: 110,     // px/s, 이보다 빠르면 튕긴 방향대로
});

export function shouldStartDrag(dx, dy) {
    return Math.abs(dx) > SWIPE.START_PX && Math.abs(dx) > Math.abs(dy);
}

/** 왼쪽(음수)으로만 열린다. 서랍 폭을 넘으면 고무줄처럼 */
export function resist(offset, drawerWidth) {
    if (offset >= 0) {
        return 0;
    }
    const pulled = -offset;
    if (pulled <= drawerWidth) {
        return offset;
    }
    return -(drawerWidth + (pulled - drawerWidth) * SWIPE.RESISTANCE);
}

export function commitPoint(rowWidth, drawerWidth) {
    return Math.max(rowWidth * SWIPE.COMMIT_RATIO, drawerWidth + SWIPE.ACTION_WIDTH / 2);
}

/** 놓았을 때: 'commit'(첫 버튼 실행) | 'open' | 'closed'. velocity 는 px/s (왼쪽이 음수) */
export function settle(offset, velocity, drawerWidth, commitAt) {
    if (-offset >= commitAt) {
        return 'commit';
    }
    if (Math.abs(velocity) > SWIPE.FLICK_SPEED) {
        return velocity < 0 ? 'open' : 'closed';
    }
    return -offset > drawerWidth / 2 ? 'open' : 'closed';
}

/** 줄마다 보일 버튼. 첫 번째가 주 버튼(끝까지 밀면 실행). 보관함은 없다 */
export function rowActions({ mine, canModerate, liked, hidden = false }) {
    const actions = [];
    if (mine) {
        actions.push({ id: 'delete', labelKey: 'comm.deleteProblem', icon: '🗑', tone: 'danger', dismiss: true });
    } else {
        actions.push({ id: 'like', labelKey: liked ? 'comm.unlike' : 'comm.like', icon: liked ? '♥' : '♡', tone: 'like', dismiss: false });
    }
    if (canModerate) {
        actions.push({ id: 'hide', labelKey: hidden ? 'comm.show' : 'comm.hide', icon: hidden ? '👁' : '🙈', tone: 'plain', dismiss: false });
    }
    return actions;
}
