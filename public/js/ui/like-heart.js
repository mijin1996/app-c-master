// 좋아요 하트 (Vue Bits "Peek Rating" 스타일을 하트 하나로 바닐라 JS 로 다시 만든 것).
// 마우스를 올리면 하트가 살짝 떠오르고 커지며 위에 작은 말풍선이 뜬다. 누르면 톡 커졌다 돌아온다. 옆에는 좋아요 수.
import { esc } from './dom.js';
import { t } from '../i18n/index.js';
import { likeTipKey, likedCount } from './like-heart-rules.js';

const POP_MS = 300;
const HEART_PATH = 'M12 21s-7.5-4.6-9.6-9.1C.9 8.6 2.9 5 6.4 5c2.1 0 3.6 1.2 4.6 2.6C12 6.2 13.5 5 15.6 5c3.5 0 5.5 3.6 4 6.9C19.5 16.4 12 21 12 21z';

const heartSvg = (filled) => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + HEART_PATH + '" ' + (filled ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="2"') + '/></svg>';

/** @param {{ liked: boolean, count: number, disabled?: boolean, id?: string, attr?: string, size?: 'small' }} state */
export function likeHeartHtml({ liked, count, disabled = false, id = '', attr = '', size = '' }) {
    const tip = t(likeTipKey({ liked, disabled }));
    return '<span class="like-heart' + (size ? ' ' + size : '') + (liked ? ' on' : '') + '">' +
        '<button type="button" class="like-heart-btn"' + (id ? ' id="' + id + '"' : '') + (attr ? ' ' + attr : '') +
        ' aria-pressed="' + liked + '" aria-label="' + esc(tip) + '"' + (disabled ? ' disabled' : '') + '>' +
        '<span class="like-tip" aria-hidden="true">' + esc(tip) + '</span>' + heartSvg(liked) + '</button>' +
        '<b class="like-count">' + likedCount(count) + '</b></span>';
}

/** 누르면 onToggleAsync() → { liked, likes } 를 받아 하트 · 숫자를 바꾼다 (실패하면 null 을 돌려주게) */
export function bindLikeHeart(button, onToggleAsync) {
    if (!button) {
        return;
    }
    button.onclick = async () => {
        button.disabled = true;
        const result = await onToggleAsync();
        button.disabled = false;
        if (!result) {
            return;
        }
        const wrap = button.closest('.like-heart');
        wrap.classList.toggle('on', result.liked);
        button.setAttribute('aria-pressed', String(result.liked));
        const tip = t(likeTipKey({ liked: result.liked, disabled: false }));
        button.setAttribute('aria-label', tip);
        button.querySelector('.like-tip').textContent = tip;
        button.querySelector('svg').outerHTML = heartSvg(result.liked);
        wrap.querySelector('.like-count').textContent = likedCount(result.likes);
        wrap.classList.remove('pop');
        void wrap.offsetWidth; // 다시 눌러도 톡 움직임이 처음부터 나오게
        wrap.classList.add('pop');
        setTimeout(() => wrap.classList.remove('pop'), POP_MS);
    };
}

/** 목록용: 눌리지 않는 작은 하트 하나 + 숫자 (지금 모양 유지) */
export function likeBadgeHtml(liked, count) {
    return '<span class="like-badge' + (liked ? ' on' : '') + '">' + heartSvg(liked) + '<b>' + likedCount(count) + '</b></span>';
}
