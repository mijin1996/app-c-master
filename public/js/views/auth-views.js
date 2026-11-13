// 로그인 · 회원가입 · 계정 찾기 화면, 복구 코드 안내 창 (글자는 모두 사전에서, 지금 언어로)
import { $, esc, toast } from '../ui/dom.js';
import { cody, formName } from '../ui/cody.js';
import { TechText } from '../ui/tech-text.js';
import { CREDITS_BUTTON, bindCreditsButtons } from './credits-modal.js';
import { INSTALL_BUTTON, bindInstallButtons } from './install-guide.js';
import { VISIT_SLOT, bindVisits } from './visit-count.js';
import { langSwitchHtml, bindLangSwitch } from './lang-switch.js';
import { skySwitchHtml, bindSkySwitch } from './sky-switch.js';
import { Failure } from '../core/result.js';
import { messageOf } from '../core/app-error.js';
import { FORM_NAMES } from '../domain/progress-rules.js';
import { t } from '../i18n/index.js';

export function showRecoveryCodeAsync(code, isNew) {
    return new Promise((resolve) => {
        const bg = document.createElement('div');
        bg.className = 'modal-bg';
        bg.innerHTML = '<div class="panel modal" role="dialog" aria-modal="true" aria-labelledby="rec-t"><h2 id="rec-t">' + esc(t('auth.recoveryTitle')) + '</h2>' +
            '<p style="margin:0">' + (isNew ? esc(t('auth.recoveryWelcome')) : '') + t('auth.recoveryDesc') + '</p>' +
            '<div class="rec-code" id="rec-code">' + esc(code) + '</div>' +
            '<button class="btn" id="rec-copy">' + esc(t('auth.recoveryCopy')) + '</button>' +
            '<label class="check"><input type="checkbox" id="rec-ok"> ' + esc(t('auth.recoveryCheck')) + '</label>' +
            '<button class="btn primary" id="rec-done" disabled>' + esc(t('auth.recoveryContinue')) + '</button></div>';
        document.body.appendChild(bg);
        $('#rec-copy').onclick = () => {
            navigator.clipboard.writeText(code).then(() => toast(t('auth.recoveryCopied')), () => {
                const range = document.createRange();
                range.selectNodeContents($('#rec-code'));
                getSelection().removeAllRanges();
                getSelection().addRange(range);
                toast(t('auth.recoverySelected'));
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
    document.title = t('app.title');
    app.loginMode = mode; // 언어를 바꿔 다시 그릴 때 같은 탭으로
    const isJoin = mode === 'join';
    app.root.innerHTML =
        '<div class="wrap login">' +
        '<div class="login-lang">' + skySwitchHtml() + langSwitchHtml() + '</div>' +
        '<section class="tech-hero"><div class="tech" id="tech"></div>' +
        '<p class="tech-tag">' + t('auth.heroTag') + '</p></section>' +
        '<div class="panel login-card">' +
        '<div class="login-hero"><h1>' + t('auth.heroTitle') + '</h1><p class="muted" style="margin:0">' + esc(t('auth.heroDesc')) + '</p>' +
        '<div class="cody-big">' + cody(0, 'happy') + '</div>' +
        '<div class="muted" style="font-size:12.5px;font-weight:600">' + esc(t('auth.grows')) + '</div>' +
        '<div class="evo-strip">' + FORM_NAMES.map((_, i) => '<div>' + cody(i, 'normal') + '<span>' + esc(formName(i)) + '</span></div>').join('') + '</div></div>' +
        '<form class="login-form" id="login-form" novalidate>' +
        '<div class="tabs" role="tablist"><button type="button" role="tab" id="tab-login" class="' + (isJoin ? '' : 'on') + '" aria-selected="' + !isJoin + '">' + esc(t('auth.login')) + '</button>' +
        '<button type="button" role="tab" id="tab-join" class="' + (isJoin ? 'on' : '') + '" aria-selected="' + isJoin + '">' + esc(t('auth.join')) + '</button></div>' +
        '<label class="f">' + esc(t('auth.username')) + '<input type="text" id="f-user" autocomplete="username" placeholder="' + esc(t('auth.usernameHint')) + '" maxlength="16"></label>' +
        (isJoin ? '<label class="f">' + esc(t('auth.nickname')) + '<input type="text" id="f-nick" placeholder="' + esc(t('auth.nicknameHint')) + '" maxlength="12"></label>' : '') +
        '<label class="f">' + esc(t('auth.password')) + '<input type="password" id="f-pw" autocomplete="' + (isJoin ? 'new-password' : 'current-password') + '" placeholder="' + esc(t('auth.passwordHint')) + '"></label>' +
        '<div class="err" id="f-err" role="alert"></div>' +
        (isJoin ? '' : '<button type="button" class="btn ghost link-btn" id="f-forgot">' + esc(t('auth.forgot')) + '</button>') +
        '<button class="btn primary" id="f-submit" type="submit">' + esc(isJoin ? t('auth.joinSubmit') : t('auth.login')) + '</button>' +
        (isJoin ? '' : '<div class="login-install">' + INSTALL_BUTTON() + '</div>') + // 회원가입 탭에서는 안 보여 준다
        '</form></div><div class="login-foot">' + CREDITS_BUTTON() + VISIT_SLOT + '</div></div>';

    new TechText($('#tech'), { text: 'c-master' }).mountAsync();
    bindCreditsButtons(app.root);
    bindInstallButtons(app.root);
    bindVisits(app.visits, app.root);
    bindLangSwitch(app, app.root);
    bindSkySwitch(app, app.root);

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
    app.loginMode = 'recover-' + mode;
    app.root.innerHTML = '<div class="wrap login"><div class="login-lang">' + skySwitchHtml() + langSwitchHtml() + '</div>' +
        '<form class="panel login-form" id="rc-form" novalidate style="width:min(460px,100%)">' +
        '<h1 style="font-size:28px">' + esc(t('auth.findTitle')) + '</h1>' +
        '<div class="tabs" role="tablist"><button type="button" role="tab" id="rt-id" class="' + (isReset ? '' : 'on') + '" aria-selected="' + !isReset + '">' + esc(t('auth.findId')) + '</button>' +
        '<button type="button" role="tab" id="rt-pw" class="' + (isReset ? 'on' : '') + '" aria-selected="' + isReset + '">' + esc(t('auth.resetPw')) + '</button></div>' +
        (isReset ? '<label class="f">' + esc(t('auth.username')) + '<input type="text" id="r-user" autocomplete="username" maxlength="16" value="' + esc(presetUser) + '"></label>' : '') +
        '<label class="f">' + esc(t('auth.recoveryCode')) + '<input type="text" id="r-code" placeholder="' + esc(t('auth.recoveryCodeHint')) + '" maxlength="12" autocomplete="off" class="code-input" value="' + esc(presetCode) + '"></label>' +
        (isReset ? '<label class="f">' + esc(t('auth.newPassword')) + '<input type="password" id="r-pw" autocomplete="new-password" placeholder="' + esc(t('auth.passwordHint')) + '"></label>' : '') +
        '<div class="err" id="r-err" role="alert"></div><div id="r-msg"></div>' +
        '<button class="btn primary" type="submit" id="r-submit">' + esc(isReset ? t('auth.changePw') : t('auth.findId')) + '</button>' +
        '<button type="button" class="btn ghost" id="r-back">' + esc(t('auth.backToLogin')) + '</button>' +
        '<div class="notice">' + esc(t('auth.findNotice')) + '</div></form></div>';

    bindLangSwitch(app, app.root);
    bindSkySwitch(app, app.root);
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
            $('#r-msg').innerHTML = '<div class="result ac"><div>' + esc(t('auth.foundIds')) + '<b class="code-text">' + found.data.map(esc).join(', ') + '</b></div>' +
                '<button type="button" class="btn" id="r-to-pw">' + esc(t('auth.changeThisPw')) + '</button></div>';
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
        toast(t('auth.pwChanged'));
        await showRecoveryCodeAsync(reset.data.recoveryCode, false);
        renderLogin(app, 'login');
        $('#f-user').value = username.trim().toLowerCase();
    };
}
