// 설정 창: 캐릭터 이름, 닉네임, 나라(시계), 배경, 소리, 랭킹 참여, 복구 코드, 로그아웃 (글자는 사전에서, 지금 언어로)
import { $, $$, esc, toast } from '../ui/dom.js';
import { AUTO_ZONE, TIME_ZONES } from '../domain/time-zones.js';
import { getLocale } from '../i18n/index.js';
import { codyNameOf } from '../ui/cody.js';
import { Failure } from '../core/result.js';
import { messageOf } from '../core/app-error.js';
import { showRecoveryCodeAsync } from './auth-views.js';
import { t } from '../i18n/index.js';

/** 나라 이름은 브라우저가 지금 언어로 알려 준다 (사전에 나라 이름을 따로 적지 않아도 됨) */
function zoneLabel(place, regionNames) {
    const name = regionNames ? regionNames.of(place.region) : place.region;
    return place.city ? name + ' (' + place.city + ')' : name;
}

function zoneOptionsHtml(selected) {
    let regionNames = null;
    try {
        regionNames = new Intl.DisplayNames([getLocale()], { type: 'region' });
    } catch {
        regionNames = null;
    }
    const option = (key, label) => '<option value="' + key + '"' + (key === selected ? ' selected' : '') + '>' + esc(label) + '</option>';
    const places = Object.entries(TIME_ZONES)
        .map(([key, place]) => [key, zoneLabel(place, regionNames)])
        .sort((a, b) => a[1].localeCompare(b[1], getLocale()));
    return option(AUTO_ZONE, t('settings.timeZoneAuto')) + places.map(([key, label]) => option(key, label)).join('');
}

export function openSettings(app) {
    const s = app.progress.progress.settings;
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = '<div class="panel modal" role="dialog" aria-modal="true" aria-labelledby="set-t"><h2 id="set-t">' + esc(t('settings.title')) + '</h2>' +
        '<div class="row2"><label class="f">' + esc(t('settings.codyName')) + '<input type="text" id="s-cody" maxlength="8" value="' + esc(codyNameOf(s)) + '"></label>' +
        '<label class="f">' + esc(t('settings.nickname')) + '<input type="text" id="s-nick" maxlength="12" value="' + esc(app.auth.user.nickname) + '"></label></div>' +
        '<div class="row2"><label class="f">' + esc(t('settings.timeZone')) + '<select id="s-zone">' + zoneOptionsHtml(s.timeZone) + '</select></label>' +
        '<label class="f">' + esc(t('settings.sky')) + '<select id="s-sky"><option value="auto">' + esc(t('settings.skyAuto')) + '</option><option value="day">' + esc(t('settings.skyDay')) + '</option><option value="night">' + esc(t('settings.skyNight')) + '</option></select></label></div>' +
        '<div class="switch"><span>' + esc(t('settings.sfx')) + '</span><input type="checkbox" id="s-sfx" ' + (s.sfx ? 'checked' : '') + '></div>' +
        '<div class="switch"><span>' + esc(t('settings.rank')) + '</span><input type="checkbox" id="s-rank" ' + (s.rankOptIn ? 'checked' : '') + '></div>' +
        '<div class="switch"><span>' + esc(t('settings.recovery')) + '</span><button class="btn" id="s-rec">' + esc(t('settings.renew')) + '</button></div>' +
        '<div class="row-buttons spread"><button class="btn" id="s-logout">' + esc(t('settings.logout')) + '</button><button class="btn primary" id="s-close">' + esc(t('common.close')) + '</button></div></div>';
    document.body.appendChild(bg);
    $('#s-sky').value = s.sky;

    const apply = async () => {
        app.progress.updateSettings({
            codyName: $('#s-cody').value,
            timeZone: $('#s-zone').value,
            sky: $('#s-sky').value,
            sfx: $('#s-sfx').checked,
            rankOptIn: $('#s-rank').checked,
        });
        app.sky.compute();
        const nickname = $('#s-nick').value.trim();
        if (nickname && nickname !== app.auth.user.nickname) {
            const changed = await app.auth.changeNicknameAsync(nickname);
            if (changed instanceof Failure) {
                toast(messageOf(changed.error));
            }
        }
    };
    const close = async () => {
        await apply();
        bg.remove();
        app.router.refresh();
    };

    $$('input[type=checkbox], select', bg).forEach((el) => {
        el.onchange = apply;
    });
    $('#s-close').onclick = close;
    bg.addEventListener('click', (e) => {
        if (e.target === bg) {
            close();
        }
    });
    $('#s-rec').onclick = async () => {
        const renewed = await app.auth.renewRecoveryCodeAsync();
        if (renewed instanceof Failure) {
            toast(messageOf(renewed.error));
            return;
        }
        bg.remove();
        await showRecoveryCodeAsync(renewed.data.recoveryCode, false);
        toast(t('settings.renewed'));
    };
    $('#s-logout').onclick = async () => {
        await apply();
        await app.progress.flushAsync();
        bg.remove();
        await app.logoutAsync();
    };
}
