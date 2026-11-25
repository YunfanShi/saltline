(function () {
  'use strict';

  const roles = {
    medic: {
      name: ['Medic', '医疗兵'],
      ability: ['Field dressing', '战地包扎'],
      description: ['Restore up to 40 health. 24 s cooldown.', '最多恢复 40 点生命值。冷却 24 秒。'],
      cooldown: 24
    },
    support: {
      name: ['Support', '支援兵'],
      ability: ['Ammo refill', '补充弹药'],
      description: ['Refill up to two magazines of reserve ammo. 20 s cooldown.', '最多补充两个弹匣的备用弹药。冷却 20 秒。'],
      cooldown: 20
    },
    recon: {
      name: ['Recon', '侦察兵'],
      ability: ['Contact scan', '扫描敌情'],
      description: ['Track the nearest contact within 55 m for 8 s. 22 s cooldown.', '持续 8 秒追踪 55 米内最近的敌人。冷却 22 秒。'],
      cooldown: 22
    },
    engineer: {
      name: ['Engineer', '工兵'],
      ability: ['Reinforce armor', '加固护甲'],
      description: ['Halve incoming damage for 8 s. 26 s cooldown.', '在 8 秒内减半所受伤害。冷却 26 秒。'],
      cooldown: 26
    },
    assault: {
      name: ['Assault', '突击兵'],
      ability: ['Adrenaline surge', '肾上腺素突击'],
      description: ['Restore 20 health, +1 mag reserve, and -30% damage for 6 s. 22 s cooldown.', '立即回复 20 生命、补充 1 个弹匣备弹，并在 6 秒内减伤 30%。冷却 22 秒。'],
      cooldown: 22
    }
  };

  function createPortLoadout(game, doc = globalThis.document) {
    let selected = 'medic';
    try {
      const saved = globalThis.localStorage?.getItem('saltline-class');
      if (Object.hasOwn(roles, saved)) selected = saved;
    } catch { /* Browser storage is optional. */ }

    let role = selected;
    let cooldown = 0;
    let duration = 0;
    let notice = null;
    let noticeTime = 0;
    let picker, label, description, panel, button, status;
    const player = game.player;
    const originalDamage = player.damage;
    const isPlaying = () => game.game?.state === 'playing' && Boolean(game.game.conquest) && player.alive;
    player.damage = function (amount, ...args) {
      if (duration > 0 && isPlaying()) {
        if (role === 'engineer') amount *= 0.5;
        else if (role === 'assault') amount *= 0.7;
      }
      return originalDamage.call(this, amount, ...args);
    };

    const translate = pair => pair[doc?.documentElement.lang === 'en' ? 0 : 1];
    const setText = (element, text) => {
      if (element.textContent !== text) element.textContent = text;
    };

    function select(id) {
      if (!Object.hasOwn(roles, id) || (game.game && game.game.state !== 'title')) return false;
      selected = id;
      try { globalThis.localStorage?.setItem('saltline-class', id); } catch { /* Selection still applies to this page. */ }
      renderPicker();
      return true;
    }

    function showNotice(message) {
      notice = message;
      noticeTime = 2.5;
    }

    function scan() {
      let nearest = null;
      let closest = 55;
      let count = 0;
      for (const enemy of game.enemies.list) {
        if (!enemy.alive) continue;
        const dx = enemy.pos.x - player.pos.x;
        const dz = enemy.pos.z - player.pos.z;
        const distance = Math.hypot(dx, dz);
        if (distance > 55) continue;
        count++;
        if (distance > closest) continue;
        closest = distance;
        nearest = Math.atan2(dx, -dz) + player.yaw;
      }
      if (nearest === null) return translate(['No contacts within 55 m', '55 米内无敌人']);
      const angle = ((nearest * 180 / Math.PI) % 360 + 360) % 360;
      const direction = [
        ['front', '前方'], ['front right', '右前方'], ['right', '右侧'], ['rear right', '右后方'],
        ['rear', '后方'], ['rear left', '左后方'], ['left', '左侧'], ['front left', '左前方']
      ][Math.round(angle / 45) % 8];
      const meters = Math.round(closest);
      return translate([
        `${count} nearby · nearest ${meters} m ${direction[0]}`,
        `附近 ${count} 个敌人 · 最近在${direction[1]} ${meters} 米`
      ]);
    }

    function activate() {
      if (!isPlaying() || cooldown > 0) return false;
      switch (role) {
        case 'medic': {
          const amount = Math.min(40, player.maxHealth - player.health);
          if (amount <= 0) {
            showNotice(['Health already full', '生命值已满']);
            return false;
          }
          player.heal(amount);
          showNotice([`+${Math.round(amount)} health`, `恢复 ${Math.round(amount)} 点生命值`]);
          break;
        }
        case 'support': {
          const weapon = game.weapon;
          const amount = Math.min(weapon.magSize * 2, weapon.magSize * 5 - weapon.reserve);
          if (amount <= 0) {
            showNotice(['Reserve ammo already full', '备用弹药已满']);
            return false;
          }
          weapon.addAmmo(amount);
          showNotice([`+${amount} reserve ammo`, `补充 ${amount} 发备用弹药`]);
          break;
        }
        case 'recon':
        case 'engineer':
          duration = 8;
          break;
        case 'assault': {
          const healAmt = Math.min(20, player.maxHealth - player.health);
          if (healAmt > 0) player.heal(healAmt);
          const weapon = game.weapon;
          const ammoAmt = Math.min(weapon.magSize, weapon.magSize * 5 - weapon.reserve);
          if (ammoAmt > 0) weapon.addAmmo(ammoAmt);
          duration = 6;
          showNotice(['Adrenaline surge active!', '肾上腺素突击已激活！']);
          break;
        }
      }
      cooldown = roles[role].cooldown;
      renderHud();
      return true;
    }

    function renderPicker() {
      if (!picker) return;
      setText(label, translate(['Class', '职业']));
      picker.value = selected;
      for (const option of picker.options) setText(option, translate(roles[option.value].name));
      setText(description, translate(roles[selected].description));
    }

    function renderHud() {
      if (!panel) return;
      panel.hidden = !isPlaying();
      if (panel.hidden) return;
      const remaining = Math.ceil(cooldown);
      const key = game.input.touch ? '' : ' [X]';
      const caption = translate(roles[role].ability) + key + (remaining ? ` · ${remaining}s` : '');
      button.setAttribute('aria-disabled', String(remaining > 0));
      setText(button, caption);
      let message = noticeTime > 0 ? translate(notice) : '';
      if (duration > 0) {
        message = role === 'recon'
          ? scan()
          : role === 'assault'
            ? translate([`Adrenaline surge · ${Math.ceil(duration)}s`, `肾上腺素突击 · ${Math.ceil(duration)} 秒`])
            : translate([`Armor active · ${Math.ceil(duration)}s`, `护甲已加固 · ${Math.ceil(duration)} 秒`]);
      }
      setText(status, message);
    }

    function mount() {
      const actions = doc.querySelector('#port-multiple-actions .m-actions');
      const ui = doc.getElementById('ui');
      if (!actions || !ui) return;

      const field = doc.createElement('div');
      field.className = 'port-loadout-picker';
      field.dataset.noLocalize = '';
      const row = doc.createElement('label');
      label = doc.createElement('span');
      picker = doc.createElement('select');
      picker.setAttribute('aria-describedby', 'port-loadout-description');
      for (const id of Object.keys(roles)) {
        const option = doc.createElement('option');
        option.value = id;
        picker.append(option);
      }
      picker.addEventListener('change', () => select(picker.value));
      row.append(label, picker);
      description = doc.createElement('p');
      description.id = 'port-loadout-description';
      field.append(row, description);
      actions.before(field);
      renderPicker();

      panel = doc.createElement('div');
      panel.className = 'port-loadout-hud';
      panel.dataset.noLocalize = '';
      panel.hidden = true;
      button = doc.createElement('button');
      button.type = 'button';
      button.addEventListener('pointerdown', event => event.stopPropagation());
      button.addEventListener('click', activate);
      status = doc.createElement('span');
      panel.append(button, status);
      ui.append(panel);

      doc.addEventListener('keydown', event => {
        if (event.code !== 'KeyX' || event.repeat || event.altKey || event.ctrlKey || event.metaKey || !isPlaying()) return;
        event.preventDefault();
        activate();
      }, { signal: game.chapterSignal });
      doc.addEventListener('saltline:localechange', () => {
        renderPicker();
        renderHud();
      }, { signal: game.chapterSignal });
    }

    if (doc && !game.params?.bench && !game.params?.shot && !game.params?.autostart) mount();
    return {
      select,
      activate,
      get role() { return role; },
      get cooldown() { return cooldown; },
      reset() {
        role = selected;
        cooldown = duration = noticeTime = 0;
      },
      update(seconds) {
        if (isPlaying()) {
          cooldown = Math.max(0, cooldown - seconds);
          duration = Math.max(0, duration - seconds);
          noticeTime = Math.max(0, noticeTime - seconds);
        }
        renderHud();
      }
    };
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = createPortLoadout;
  else globalThis.createPortLoadout = createPortLoadout;
})();
