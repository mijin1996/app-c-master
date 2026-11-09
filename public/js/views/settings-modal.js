// 설정 창: 캐릭터 이름, 닉네임, 도시, 배경, 소리, 랭킹 참여, 복구 코드, 로그아웃
import { $, $$, esc, toast } from '../ui/dom.js';
import { CITIES } from '../ui/sky.js';
import { Failure } from '../core/result.js';
import { messageOf } from '../core/app-error.js';
import { showRecoveryCodeAsync } from './auth-views.js';

export function openSettings(app) {
    const s = app.progress.progress.settings;
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = '<div class="panel modal" role="dialog" aria-modal="true" aria-labelledby="set-t"><h2 id="set-t">설정</h2>' +
        '<div class="row2"><label class="f">캐릭터 이름<input type="text" id="s-cody" maxlength="8" value="' + esc(s.codyName) + '"></label>' +
        '<label class="f">닉네임<input type="text" id="s-nick" maxlength="12" value="' + esc(app.auth.user.nickname) + '"></label></div>' +
        '<div class="row2"><label class="f">내 도시 (해 뜨고 지는 시각 기준)<select id="s-city">' +
        Object.entries(CITIES).map(([key, city]) => '<option value="' + key + '"' + (key === s.city ? ' selected' : '') + '>' + city[0] + '</option>').join('') + '</select></label>' +
        '<label class="f">배경<select id="s-sky"><option value="auto">자동 (해의 위치)</option><option value="day">항상 낮</option><option value="night">항상 밤</option></select></label></div>' +
        '<div class="switch"><span>효과음 (정답·오답·클리어)</span><input type="checkbox" id="s-sfx" ' + (s.sfx ? 'checked' : '') + '></div>' +
        '<div class="switch"><span>배경음악 (피아노)</span><input type="checkbox" id="s-bgm" ' + (s.bgm ? 'checked' : '') + '></div>' +
        '<label class="f">배경음악 볼륨<input type="range" id="s-vol" min="0" max="1" step="0.05" value="' + s.volume + '"></label>' +
        '<div class="switch"><span>친구 랭킹에 참여하기</span><input type="checkbox" id="s-rank" ' + (s.rankOptIn ? 'checked' : '') + '></div>' +
        '<div class="switch"><span>복구 코드 (아이디·비밀번호 찾기용)</span><button class="btn" id="s-rec">새로 만들기</button></div>' +
        '<div class="row-buttons spread"><button class="btn" id="s-logout">로그아웃</button><button class="btn primary" id="s-close">닫기</button></div></div>';
    document.body.appendChild(bg);
    $('#s-sky').value = s.sky;

    const apply = async () => {
        const bgmOn = $('#s-bgm').checked;
        const bgmChanged = bgmOn !== app.progress.progress.settings.bgm;
        app.progress.updateSettings({
            codyName: $('#s-cody').value,
            city: $('#s-city').value,
            sky: $('#s-sky').value,
            sfx: $('#s-sfx').checked,
            bgm: bgmOn,
            volume: Number($('#s-vol').value),
            rankOptIn: $('#s-rank').checked,
        });
        if (bgmChanged) {
            app.sound.setBgmAsync(bgmOn);
        } else {
            app.sound.applyVolume();
        }
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
    $('#s-vol').oninput = () => {
        app.progress.updateSettings({ volume: Number($('#s-vol').value) });
        app.sound.applyVolume();
    };
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
        toast('새 복구 코드를 만들었어요. 예전 코드는 이제 쓸 수 없어요.');
    };
    $('#s-logout').onclick = async () => {
        await apply();
        await app.progress.flushAsync();
        bg.remove();
        await app.logoutAsync();
    };
}
