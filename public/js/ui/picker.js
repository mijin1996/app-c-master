// 모든 토글(고르기 목록)을 "앱처럼 써 봐요" 안내창과 같은 모양으로 바꾼다.
// 화면 코드는 그대로 <select> 를 쓰고, 여기서 select 를 숨긴 뒤 버튼을 붙인다.
// 버튼을 누르면 카드가 쌓이는 창이 뜨고, 카드를 고르면 select 값을 바꾸고 change 를 알려 준다 (기존 onchange 가 그대로 동작).
import { esc } from './dom.js';
import { t } from '../i18n/index.js';
import { bindScrollStack } from './scroll-stack.js';
import { pickerTitle, nextIndex, stickyTopOf } from './picker-rules.js';

const ENHANCED = 'pickerReady';
const STACK_FROM = 5;          // 카드가 이만큼 이상이면 쌓이는 움직임을 켠다 (적으면 한눈에 다 보이게)
const CLOSE_ANIMATION_MS = 200;

const optionsOf = (select) => [...select.options].filter((o) => !o.disabled && !o.hidden);
const selectedText = (select) => select.options[select.selectedIndex]?.textContent ?? '';

function titleOf(select) {
    const label = select.closest('label');
    const ownText = label ? [...label.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent).join(' ') : '';
    return pickerTitle({ label: ownText, ariaLabel: select.getAttribute('aria-label') ?? '', fallback: t('picker.title') });
}

function syncTrigger(select) {
    const trigger = select.nextElementSibling;
    const value = trigger?.classList.contains('picker-trigger') ? trigger.querySelector('.picker-value') : null;
    // 글자가 같으면 건드리지 않는다 (건드리면 아래 MutationObserver 가 또 깨어나 끝없이 돈다)
    if (value && value.textContent !== selectedText(select)) {
        value.textContent = selectedText(select);
    }
}

function openPicker(select) {
    if (document.querySelector('.picker-bg')) {
        return;
    }
    const options = optionsOf(select);
    const stacked = options.length >= STACK_FROM;
    const title = titleOf(select);
    const bg = document.createElement('div');
    bg.className = 'modal-bg install-bg picker-bg';
    bg.innerHTML = '<div class="panel modal install-guide picker' + (stacked ? ' stacked' : '') + '" role="dialog" aria-modal="true" aria-labelledby="pk-title">' +
        '<button class="iconbtn ig-close" data-pk-close aria-label="' + esc(t('common.close')) + '">✕</button>' +
        '<div class="ig-top"><h2 id="pk-title">' + esc(title) + '</h2></div>' +
        '<div class="stack-scroller" role="listbox" aria-labelledby="pk-title">' +
        options.map((o, i) => '<button type="button" role="option" class="stack-card pick-card' + (o.selected ? ' on' : '') + '" aria-selected="' + o.selected + '" data-value="' + esc(o.value) + '"' +
            (o.lang ? ' lang="' + esc(o.lang) + '"' : '') + (stacked ? ' style="top:' + stickyTopOf(i) + 'px"' : '') + '>' +
            '<span class="pick-label">' + esc(o.textContent) + '</span>' + (o.selected ? '<span class="chip accent" aria-hidden="true">✓</span>' : '') + '</button>').join('') +
        (stacked ? '<div class="stack-end" aria-hidden="true"></div>' : '') + '</div></div>';
    document.body.appendChild(bg);

    const trigger = select.nextElementSibling;
    const cards = [...bg.querySelectorAll('.pick-card')];
    const close = () => {
        document.removeEventListener('keydown', onKey, true);
        bg.classList.add('out');
        setTimeout(() => bg.remove(), CLOSE_ANIMATION_MS);
        trigger?.focus();
    };
    const pick = (value) => {
        if (select.value !== value) {
            select.value = value;
            syncTrigger(select);
            select.dispatchEvent(new Event('change', { bubbles: true }));
        }
        close();
    };
    function onKey(event) {
        if (event.key === 'Escape') {
            event.preventDefault();
            close();
            return;
        }
        const at = cards.indexOf(document.activeElement);
        const to = nextIndex(at < 0 ? 0 : at, cards.length, event.key);
        if (to !== at && to >= 0 && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
            event.preventDefault();
            cards[to].focus();
        }
    }
    cards.forEach((card) => {
        card.onclick = () => pick(card.dataset.value);
    });
    bg.querySelector('[data-pk-close]').onclick = close;
    bg.addEventListener('click', (event) => {
        if (event.target === bg) {
            close();
        }
    });
    document.addEventListener('keydown', onKey, true);
    if (stacked) {
        bindScrollStack(bg.querySelector('.stack-scroller'), stickyTopOf);
    }
    (cards.find((c) => c.classList.contains('on')) ?? cards[0])?.focus({ preventScroll: true });
}

function enhance(select) {
    if (select.dataset[ENHANCED] || select.hasAttribute('data-native') || select.closest('.picker-bg')) {
        return;
    }
    select.dataset[ENHANCED] = '1';
    select.classList.add('picker-native');
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'picker-trigger';
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-label', titleOf(select));
    trigger.innerHTML = '<span class="picker-value"></span><span class="picker-caret" aria-hidden="true">▾</span>';
    trigger.onclick = (event) => {
        event.preventDefault();
        syncTrigger(select);
        openPicker(select);
    };
    select.after(trigger);
    select.addEventListener('change', () => syncTrigger(select));
    syncTrigger(select);
}

/** 지금 있는 select 와 앞으로 그려질 select 모두 바꾼다 (main.js 에서 한 번 부른다) */
export function installPickers(root = document.body) {
    const scan = () => root.querySelectorAll('select').forEach(enhance);
    scan();
    // 화면 코드가 값을 바꾼 뒤(같은 순간) 버튼 글자가 맞도록, 새로 그려진 다음 차례에 맞춘다
    const fromPicker = (m) => m.target.closest?.('.picker-trigger, .picker-bg') || [...m.addedNodes].every((n) => n.classList?.contains('picker-trigger') || n.classList?.contains('picker-bg'));
    new MutationObserver((mutations) => {
        if (mutations.every(fromPicker)) {
            return; // 고르기 버튼 · 창이 스스로 바꾼 것이면 무시
        }
        queueMicrotask(() => {
            scan();
            root.querySelectorAll('select.picker-native').forEach(syncTrigger);
        });
    }).observe(root, { childList: true, subtree: true });
}
