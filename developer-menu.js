(() => {
  const t = (en, zh) => window.SaltlineLocale?.t(en, zh) ?? en;
  const toggles = [
    ['flight', 'Flight', '飞行'],
    ['godMode', 'Invulnerability', '无敌'],
    ['noEnemies', 'Disable enemies', '禁用敌人'],
    ['infiniteAmmo', 'Infinite magazine', '无限弹匣'],
  ];

  window.createDeveloperMenu = ({ world, canOpen, isCampaign, onOpen, onClose, onEnemies, onSpawn, onCut }) => {
    const flags = { flight: false, godMode: false, noEnemies: false, infiniteAmmo: false };
    const panel = document.createElement('dialog');
    panel.className = 'developer-menu';
    panel.setAttribute('aria-labelledby', 'developer-title');
    panel.innerHTML = `
      <header><h2 id="developer-title"></h2><button type="button" data-close autofocus></button></header>
      <div class="developer-toggles"></div>
      <p data-flight-help></p>
      <div class="developer-actions"></div>
      <p class="developer-status"></p>`;
    const controls = panel.querySelector('.developer-toggles');
    const actions = panel.querySelector('.developer-actions');
    const closeButton = panel.querySelector('[data-close]');
    const status = panel.querySelector('.developer-status');
    const indicator = document.createElement('div');
    indicator.className = 'developer-indicator';
    indicator.hidden = true;
    document.getElementById('app').append(panel, indicator);
    const refill = () => (world.weapon.refill || world.weapon.reset).call(world.weapon);

    function setFlag(key, enabled) {
      if (flags[key] === enabled) return;
      flags[key] = enabled;
      if (key === 'flight') world.player.vel.set(0, 0, 0);
      if (key === 'infiniteAmmo' && enabled && world.weapon.ammo === 0) refill();
      if (key === 'noEnemies') onEnemies(enabled);
    }

    const switches = toggles.map(([key, en, zh]) => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      const caption = document.createElement('span');
      input.type = 'checkbox';
      label.append(input, caption);
      controls.append(label);
      input.addEventListener('change', () => {
        setFlag(key, input.checked);
        refresh();
      });
      return { key, en, zh, input, caption };
    });

    function addAction(en, zh, run) {
      const button = document.createElement('button');
      button.type = 'button';
      button.addEventListener('click', () => {
        run();
        refresh();
      });
      actions.append(button);
      return { button, en, zh };
    }

    const heal = addAction('Restore health', '恢复生命', () => world.player.heal(world.player.maxHealth));
    const ammo = addAction('Refill ammunition', '补满弹药', refill);
    const gull = addAction('Spawn Gull', '生成海鸥', () => onSpawn('gull'));
    const hound = addAction('Spawn Hound', '生成猎犬', () => onSpawn('hound'));
    const cut = addAction('Cut next relay', '切断下一个中继站', onCut);
    const clear = addAction('Reset switches', '重置开关', () => {
      for (const { key } of switches) setFlag(key, false);
    });

    function refresh() {
      panel.querySelector('h2').textContent = t('Developer menu', '开发者菜单');
      closeButton.textContent = t('Resume', '继续游戏');
      panel.querySelector('[data-flight-help]').textContent = t(
        'Flight · WASD to move, Space to ascend, C to descend, Shift to boost.',
        '飞行 · WASD 移动，空格上升，C 下降，Shift 加速。');
      for (const { key, en, zh, input, caption } of switches) {
        caption.textContent = t(en, zh);
        input.checked = flags[key];
      }
      for (const { button, en, zh } of [heal, ammo, gull, hound, cut, clear]) {
        button.textContent = t(en, zh);
      }
      gull.button.disabled = hound.button.disabled = flags.noEnemies;
      cut.button.hidden = !isCampaign();
      const { x, y, z } = world.player.pos;
      const coords = [x, y, z].map(value => value.toFixed(1)).join(' / ');
      const health = Math.ceil(world.player.health);
      const { ammo: rounds, reserve } = world.weapon;
      const enemies = world.enemies.aliveCount();
      status.textContent = t(
        `XYZ ${coords} · HP ${health} · Ammo ${rounds}/${reserve} · Enemies ${enemies}`,
        `XYZ ${coords} · 生命 ${health} · 弹药 ${rounds}/${reserve} · 敌人 ${enemies}`);
      const active = switches.filter(({ key }) => flags[key]).map(({ en, zh }) => t(en, zh));
      indicator.textContent = active.length ? `${t('Debug', '调试')} · ${active.join(' / ')}` : '';
      indicator.hidden = !canOpen() || !active.length;
    }

    let recapture = false;
    function open() {
      if (!canOpen() || panel.open) return;
      recapture = world.input.locked;
      refresh();
      panel.showModal();
      onOpen();
    }

    function close() {
      if (!panel.open) return;
      panel.close();
      onClose(recapture && canOpen());
    }

    closeButton.addEventListener('click', close);
    panel.addEventListener('cancel', event => {
      event.preventDefault();
      close();
    });
    document.addEventListener('saltline:localechange', refresh, { signal: world.chapterSignal });
    window.addEventListener('keydown', event => {
      const shortcut = (event.code === 'Backquote' || event.key === '`' || event.key === '~' || event.key === '～') &&
        !event.altKey && !event.ctrlKey && !event.metaKey && !event.isComposing &&
        !event.target?.closest?.('input:not([type=checkbox]), select, textarea, [contenteditable=true]');
      if (shortcut && (panel.open || canOpen())) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!event.repeat) panel.open ? close() : open();
      } else if (panel.open) {
        event.stopImmediatePropagation();
        if (event.code === 'Escape') {
          event.preventDefault();
          if (!event.repeat) close();
        }
      }
    }, world.chapterSignal ? { capture: true, signal: world.chapterSignal } : true);

    return {
      flags,
      get open() { return panel.open; },
      refresh,
      reset() {
        for (const { key } of switches) flags[key] = false;
        refresh();
      },
    };
  };
})();
