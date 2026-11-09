// 로그인 · 회원가입 · 계정 찾기 화면, 복구 코드 안내 창
import { $, esc, toast } from '../ui/dom.js';
import { cody } from '../ui/cody.js';
import { TechText } from '../ui/tech-text.js';
import { CREDITS_BUTTON, bindCreditsButtons } from './credits-modal.js';
import { Failure } from '../core/result.js';
import { messageOf } from '../core/app-error.js';
import { FORM_NAMES } from '../domain/progress-rules.js';

export function showRecoveryCodeAsync(code, isNew) {
    return new Promise((resolve) => {
        const bg = document.createElement('div');
        bg.className = 'modal-bg';
        bg.innerHTML = '<div class="panel modal" role="dialog" aria-modal="true" aria-labelledby="rec-t"><h2 id="rec-t">복구 코드를 적어 두세요</h2>' +
            '<p style="margin:0">' + (isNew ? '가입을 축하해요! ' : '') + '아이디나 비밀번호를 잊었을 때 이 코드로 찾을 수 있어요. <b>지금 한 번만 보여요.</b></p>' +
            '<div class="rec-code" id="rec-code">' + esc(code) + '</div>' +
            '<button class="btn" id="rec-copy">복사하기</button>' +
            '<label class="check"><input type="checkbox" id="rec-ok"> 코드를 안전한 곳에 적어 두었어요</label>' +
            '<button class="btn primary" id="rec-done" disabled>계속하기</button></div>';
        document.body.appendChild(bg);
        $('#rec-copy').onclick = () => {
            navigator.clipboard.writeText(code).then(() => toast('복구 코드를 복사했어요.'), () => {
                const range = document.createRange();
                range.selectNodeContents($('#rec-code'));
                getSelection().removeAllRanges();
                getSelection().addRange(range);
                toast('코드를 선택했어요. Ctrl+C로 복사하세요.');
            });
        };
        $('#rec-ok').onchange = (e) => {
            $('#rec-done').disabled = !e.target.checked;
        };
        $('#rec-done').onclick = () => {
            bg.remove();
            resolve();
        };
    });
}

export function renderLogin(app, mode = 'login') {
    document.title = 'code.ai · C언어 학습';
    const isJoin = mode === 'join';
    app.root.innerHTML =
        '<div class="wrap login">' +
        '<section class="tech-hero"><div class="tech" id="tech"></div>' +
        '<p class="tech-tag">C언어, 한 문제씩 풀다 보면 <b>C 마스터</b>까지</p></section>' +
        '<div class="panel login-card">' +
        '<div class="login-hero"><h1>코디와 <b>C언어</b></h1><p class="muted" style="margin:0">교재 18단원을 따라 문제를 풀고 퀴즈를 통과하며, 코딩 친구 코디와 함께 C언어 마스터가 되어 보세요.</p>' +
        '<div class="cody-big">' + cody(0, 'happy') + '</div>' +
        '<div class="muted" style="font-size:12.5px;font-weight:600">단계를 클리어할 때마다 코디가 자라요</div>' +
        '<div class="evo-strip">' + FORM_NAMES.map((name, i) => '<div>' + cody(i, 'normal') + '<span>' + name + '</span></div>').join('') + '</div></div>' +
        '<form class="login-form" id="login-form" novalidate>' +
        '<div class="tabs" role="tablist"><button type="button" role="tab" id="tab-login" class="' + (isJoin ? '' : 'on') + '" aria-selected="' + !isJoin + '">로그인</button>' +
        '<button type="button" role="tab" id="tab-join" class="' + (isJoin ? 'on' : '') + '" aria-selected="' + isJoin + '">회원가입</button></div>' +
        '<label class="f">아이디<input type="text" id="f-user" autocomplete="username" placeholder="영문 소문자·숫자 3~16자" maxlength="16"></label>' +
        (isJoin ? '<label class="f">닉네임<input type="text" id="f-nick" placeholder="랭킹에 보일 이름 (비우면 아이디)" maxlength="12"></label>' : '') +
        '<label class="f">비밀번호<input type="password" id="f-pw" autocomplete="' + (isJoin ? 'new-password' : 'current-password') + '" placeholder="4자 이상"></label>' +
        '<div class="err" id="f-err" role="alert"></div>' +
        (isJoin ? '' : '<button type="button" class="btn ghost link-btn" id="f-forgot">아이디·비밀번호를 잊었어요</button>') +
        '<button class="btn primary" id="f-submit" type="submit">' + (isJoin ? '가입하고 시작하기' : '로그인') + '</button>' +
        '<div class="notice">진도는 서버에 저장돼서 어느 기기에서든 로그인하면 이어서 할 수 있어요. 다른 사이트에서 쓰는 비밀번호는 쓰지 마세요.</div>' +
        '</form></div>' + CREDITS_BUTTON + '</div>';

    new TechText($('#tech'), { text: 'code.ai' }).mountAsync();
    bindCreditsButtons(app.root);

    $('#tab-login').onclick = () => renderLogin(app, 'login');
    $('#tab-join').onclick = () => renderLogin(app, 'join');
    if ($('#f-forgot')) {
        $('#f-forgot').onclick = () => renderRecover(app, 'id');
    }
    $('#login-form').onsubmit = async (e) => {
        e.preventDefault();
        app.sound.unlock();
        const submit = $('#f-submit');
        submit.disabled = true;
        const username = $('#f-user').value;
        const password = $('#f-pw').value;
        const result = isJoin
            ? await app.auth.signupAsync(username, $('#f-nick').value, password)
            : await app.auth.loginAsync(username, password);
        if (result instanceof Failure) {
            submit.disabled = false;
            $('#f-err').textContent = messageOf(result.error);
            return;
        }
        if (isJoin) {
            await showRecoveryCodeAsync(result.data.recoveryCode, true);
        }
        await app.afterLoginAsync();
    };
}

export function renderRecover(app, mode, presetUser = '', presetCode = '') {
    const isReset = mode === 'pw';
    app.root.innerHTML = '<div class="wrap login"><form class="panel login-form" id="rc-form" novalidate style="width:min(460px,100%)">' +
        '<h1 style="font-size:28px">계정 찾기</h1>' +
        '<div class="tabs" role="tablist"><button type="button" role="tab" id="rt-id" class="' + (isReset ? '' : 'on') + '" aria-selected="' + !isReset + '">아이디 찾기</button>' +
        '<button type="button" role="tab" id="rt-pw" class="' + (isReset ? 'on' : '') + '" aria-selected="' + isReset + '">비밀번호 재설정</button></div>' +
        (isReset ? '<label class="f">아이디<input type="text" id="r-user" autocomplete="username" maxlength="16" value="' + esc(presetUser) + '"></label>' : '') +
        '<label class="f">복구 코드<input type="text" id="r-code" placeholder="예: K7Q2-9MXA" maxlength="12" autocomplete="off" class="code-input" value="' + esc(presetCode) + '"></label>' +
        (isReset ? '<label class="f">새 비밀번호<input type="password" id="r-pw" autocomplete="new-password" placeholder="4자 이상"></label>' : '') +
        '<div class="err" id="r-err" role="alert"></div><div id="r-msg"></div>' +
        '<button class="btn primary" type="submit" id="r-submit">' + (isReset ? '비밀번호 바꾸기' : '아이디 찾기') + '</button>' +
        '<button type="button" class="btn ghost" id="r-back">로그인으로 돌아가기</button>' +
        '<div class="notice">복구 코드는 가입할 때 받은 8자리 코드예요. 코드도 잃어버렸다면 새 아이디로 가입해야 해요.</div></form></div>';

    $('#rt-id').onclick = () => renderRecover(app, 'id');
    $('#rt-pw').onclick = () => renderRecover(app, 'pw');
    $('#r-back').onclick = () => renderLogin(app, 'login');
    $('#rc-form').onsubmit = async (e) => {
        e.preventDefault();
        const showError = (error) => {
            $('#r-err').textContent = messageOf(error);
        };
        const submit = $('#r-submit');
        submit.disabled = true;
        const code = $('#r-code').value;
        if (!isReset) {
            const found = await app.auth.findUsernamesAsync(code);
            submit.disabled = false;
            if (found instanceof Failure) {
                showError(found.error);
                return;
            }
            $('#r-err').textContent = '';
            $('#r-msg').innerHTML = '<div class="result ac"><div>찾은 아이디: <b class="code-text">' + found.data.map(esc).join(', ') + '</b></div>' +
                '<button type="button" class="btn" id="r-to-pw">이 아이디의 비밀번호 바꾸기</button></div>';
            $('#r-to-pw').onclick = () => renderRecover(app, 'pw', found.data[0], code);
            return;
        }
        const username = $('#r-user').value;
        const reset = await app.auth.resetPasswordAsync(username, code, $('#r-pw').value);
        submit.disabled = false;
        if (reset instanceof Failure) {
            showError(reset.error);
            return;
        }
        toast('비밀번호를 바꿨어요. 쓰던 복구 코드는 이제 쓸 수 없어요.');
        await showRecoveryCodeAsync(reset.data.recoveryCode, false);
        renderLogin(app, 'login');
        $('#f-user').value = username.trim().toLowerCase();
    };
}
