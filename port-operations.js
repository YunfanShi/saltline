(() => {
  const SUPPORT = [
    { key: '5', type: 'mark', en: 'Recon', zh: '侦察' },
    { key: '6', type: 'reinforce', en: 'Reinforce', zh: '增援' },
    { key: '7', type: 'supply', en: 'Supply', zh: '补给' },
    { key: '8', type: 'smoke', en: 'Smoke', zh: '烟幕' },
    { key: '9', type: 'artillery', en: 'Artillery', zh: '重炮' },
  ];
  const REQUISITIONS = [...SUPPORT];
  const t = (english, chinese) => window.SaltlineLocale?.t(english, chinese) ?? english;

  window.createPortOperations = ({ world, onSupport, onOpen, onClose }) => {
    let round = null;
    const settings = document.createElement('fieldset');
    settings.className = 'port-battle-settings';
    settings.dataset.noLocalize = '';
    const config = [
      ['difficulty', ['AI', '敌人强度'], [
        ['easy', 'Easy', '简单'], ['normal', 'Normal', '普通'], ['hard', 'Hard', '困难'],
      ], 'normal'],
      ['startingTickets', ['Tickets', '兵力票'], [['25', '25', '25'], ['40', '40', '40'], ['70', '70', '70']], '40'],
      ['duration', ['Time limit', '时间上限'], [
        ['180', '3 min', '3 分钟'], ['240', '4 min', '4 分钟'], ['360', '6 min', '6 分钟'],
      ], '240'],
    ].map(([key, name, options, selected]) => {
      const field = document.createElement('label');
      const title = document.createElement('span');
      const select = document.createElement('select');
      for (const [value] of options) select.append(new Option('', value));
      select.value = selected;
      field.append(title, select);
      settings.append(field);
      return { key, name, options, title, select };
    });
    document.querySelector('#port-multiple-actions .m-actions').before(settings);

    function localizeSettings() {
      for (const { name, options, title, select } of config) {
        title.textContent = t(...name);
        for (const [index, [, en, zh]] of options.entries()) select.options[index].textContent = t(en, zh);
      }
      requisitionButton.textContent = t('Q Support', 'Q 征用');
    }

    const panel = document.createElement('section');
    panel.className = 'port-operations';
    panel.dataset.noLocalize = '';
    panel.hidden = true;
    const map = document.createElement('canvas');
    const bounds = world.physics.bounds;
    const extent = {
      minX: bounds.min.x, maxX: Math.min(bounds.max.x, 32),
      minZ: bounds.min.z, maxZ: bounds.max.z,
    };
    map.width = 700;
    map.height = 32 + Math.round((map.width - 32) * (extent.maxZ - extent.minZ) / (extent.maxX - extent.minX));
    map.className = 'port-operations-map';
    map.hidden = true;
    const bar = document.createElement('div');
    bar.className = 'port-operations-bar';
    const mapButton = document.createElement('button');
    mapButton.type = 'button';
    mapButton.setAttribute('aria-expanded', 'false');
    const buttons = new Map();
    const credits = document.createElement('span');
    const requisitionButton = document.createElement('button');
    requisitionButton.type = 'button';
    requisitionButton.setAttribute('aria-haspopup', 'dialog');
    bar.append(mapButton, requisitionButton, credits);
    function quickTargetFor(type) {
      if (!round || (type !== 'smoke' && type !== 'artillery')) return undefined;
      const available = round.points.filter(p => !p.locked && (type !== 'artillery' || p.owner !== 'blue'));
      const preferred = (round.activePoint && available.includes(round.activePoint) ? round.activePoint : null)
        ?? (round.near(world.player.pos) && available.includes(round.near(world.player.pos)) ? round.near(world.player.pos) : null)
        ?? available[0];
      return preferred?.id;
    }
    for (const support of SUPPORT) {
      const button = document.createElement('button');
      button.type = 'button';
      button.addEventListener('click', () => onSupport(support.type, quickTargetFor(support.type)));
      buttons.set(support.type, button);
      bar.append(button);
    }
    const battleEventStatus = document.createElement('span');
    battleEventStatus.hidden = true;
    bar.append(battleEventStatus);
    panel.append(map, bar);
    document.getElementById('app').append(panel);

    const requisition = document.createElement('dialog');
    requisition.className = 'developer-menu port-requisition';
    requisition.setAttribute('aria-labelledby', 'port-requisition-title');
    requisition.innerHTML = `
      <header><h2 id="port-requisition-title"></h2><button type="button" data-resume autofocus></button></header>
      <p data-rp></p>
      <label><span data-target-label></span> <select aria-describedby="port-support-help"></select></label>
      <p id="port-support-help"></p>
      <div class="developer-actions"></div>
      <p role="status" data-result></p>`;
    const target = requisition.querySelector('select');
    const requisitionActions = requisition.querySelector('.developer-actions');
    const resume = requisition.querySelector('[data-resume]');
    const message = requisition.querySelector('[data-result]');
    const score = document.createElement('section');
    score.className = 'port-scoreboard';
    score.hidden = true;
    score.innerHTML = '<h2></h2><dl></dl>';
    const scoreRows = [
      ['Remaining time', '剩余时间', game => window.portConquestLabel(game).time],
      ['Blue tickets', '蓝方兵力票', game => Math.ceil(game.tickets.blue)],
      ['Red tickets', '红方兵力票', game => Math.ceil(game.tickets.red)],
      ['Sectors remaining', '剩余区域', game => game.tickets.red],
      ['Kills', '击毁', game => game.kills],
      ['Deaths', '阵亡', game => game.deaths],
      ['Captures', '占领', game => game.captures],
      ['Support points', '支援点', game => game.supportPoints],
    ].map(([en, zh, value]) => {
      const term = document.createElement('dt');
      const detail = document.createElement('dd');
      score.querySelector('dl').append(term, detail);
      return { en, zh, value, term, detail };
    });
    document.getElementById('app').append(requisition, score);

    const requisitionButtons = REQUISITIONS.map(item => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.support = item.type;
      button.addEventListener('click', () => {
        const ok = onSupport(item.type, target.value);
        message.textContent = ok ? t('Support called', '已呼叫支援') : t('Unavailable here', '当前位置无法使用');
        renderRequisitions();
      });
      requisitionActions.append(button);
      return { ...item, button };
    });
    localizeSettings();

    function renderRequisitions() {
      requisition.querySelector('h2').textContent = t('Requisition', '征用支援');
      resume.textContent = t('Resume', '继续游戏');
      requisition.querySelector('[data-rp]').textContent = t('Support points ', '支援点 ') + round.supportPoints;
      requisition.querySelector('[data-target-label]').textContent = t('Target objective', '目标据点');
      requisition.querySelector('#port-support-help').textContent = t(
        'Smoke blocks enemy sight for 22 s. Artillery strikes a non-friendly objective four times after a 5 s warning.',
        '烟幕遮挡敌人视线 22 秒。炮击警告 5 秒后，对非友方控制据点发起四轮打击。');
      const point = round.points.find(entry => entry.id === target.value);
      for (const { type, en, zh, button } of requisitionButtons) {
        const cost = round.supportCosts[type];
        button.textContent = t(en, zh) + ' · ' + cost;
        button.disabled = round.supportPoints < cost || round.support[type + 'Until'] > round.elapsed ||
          (type === 'smoke' || type === 'artillery') && !point ||
          type === 'artillery' && point?.owner === 'blue';
      }
    }

    let recapture = false;
    function openRequisitions() {
      if (!round || !world.player.alive || world.developer?.open || requisition.open) return;
      const available = round.points.filter(point => !point.locked);
      target.replaceChildren(...available.map(point => new Option(point.short, point.id)));
      target.value = (round.activePoint ?? round.near(world.player.pos) ?? available[0])?.id ?? '';
      message.textContent = '';
      renderRequisitions();
      recapture = world.input.locked;
      requisition.showModal();
      score.hidden = true;
      onOpen();
    }
    function closeRequisitions() {
      if (!requisition.open) return;
      requisition.close();
      onClose(recapture);
    }
    target.addEventListener('change', renderRequisitions);
    resume.addEventListener('click', closeRequisitions);
    requisition.addEventListener('cancel', event => {
      event.preventDefault();
      closeRequisitions();
    });
    requisitionButton.addEventListener('click', openRequisitions);
    document.addEventListener('saltline:localechange', localizeSettings, { signal: world.chapterSignal });

    function renderScore() {
      score.querySelector('h2').textContent = t('Battle scoreboard', '战局计分板');
      const breakthrough = round.mode === 'breakthrough';
      for (const { en, zh, value, term, detail } of scoreRows) {
        term.hidden = detail.hidden = breakthrough ? en === 'Red tickets' : en === 'Sectors remaining';
        term.textContent = t(en, zh);
        detail.textContent = value(round);
      }
    }
    window.addEventListener('keydown', event => {
      if (requisition.open) {
        event.stopImmediatePropagation();
        if (event.code === 'KeyQ' || event.code === 'Escape') {
          event.preventDefault();
          if (!event.repeat) closeRequisitions();
        }
        return;
      }
      if (!round || world.developer?.open || event.ctrlKey || event.altKey || event.metaKey ||
        event.target?.closest?.('input,select,textarea,button,[contenteditable]')) return;
      if (event.code === 'KeyQ' && world.player.alive) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!event.repeat) openRequisitions();
      } else if (event.code === 'Tab' && !event.shiftKey) {
        event.preventDefault();
        if (score.hidden) {
          renderScore();
          score.hidden = false;
        }
      }
    }, { capture: true, signal: world.chapterSignal });
    window.addEventListener('keyup', event => { if (event.code === 'Tab') score.hidden = true; }, { signal: world.chapterSignal });
    window.addEventListener('blur', () => { score.hidden = true; }, { signal: world.chapterSignal });

    const context = map.getContext('2d');
    const base = document.createElement('canvas');
    base.width = map.width;
    base.height = map.height;
    const terrain = base.getContext('2d');
    const project = position => [
      16 + (position.x - extent.minX) * (map.width - 32) / (extent.maxX - extent.minX),
      16 + (position.z - extent.minZ) * (map.height - 32) / (extent.maxZ - extent.minZ),
    ];
    terrain.fillStyle = '#10191e';
    terrain.fillRect(0, 0, map.width, map.height);
    terrain.strokeStyle = '#20343c';
    terrain.lineWidth = 1;
    for (let x = Math.ceil(extent.minX / 8) * 8; x <= extent.maxX; x += 8) {
      const [a, b] = project({x, z: extent.minZ});
      terrain.beginPath();terrain.moveTo(a, b);terrain.lineTo(a, map.height - 16);terrain.stroke();
    }
    for (let z = Math.ceil(extent.minZ / 6) * 6; z <= extent.maxZ; z += 6) {
      const [a, b] = project({x: extent.minX, z});
      terrain.beginPath();terrain.moveTo(a, b);terrain.lineTo(map.width - 16, b);terrain.stroke();
    }
    terrain.fillStyle = '#31454e';
    for (const box of world.physics.boxes) {
      if (box.noNav || box.bulletOnly || box.min.y > 2 || box.max.y < .6) continue;
      const [x, y] = project(box.min);
      const [right, bottom] = project(box.max);
      if (right - x > map.width * .85 && bottom - y > map.height * .85) continue;
      terrain.fillRect(x, y, Math.max(1, right - x), Math.max(1, bottom - y));
    }

    function toggleMap() {
      if (panel.hidden) return;
      map.hidden = !map.hidden;
      mapButton.setAttribute('aria-expanded', String(!map.hidden));
      lastUpdate = -Infinity;
    }
    mapButton.addEventListener('click', toggleMap);
    panel.addEventListener('pointerdown', event => event.stopPropagation());
    let lastUpdate = -Infinity;
    let active = false;

    function keydown(event) {
      if (!active || event.repeat || event.ctrlKey || event.altKey || event.metaKey ||
          /^(INPUT|SELECT|TEXTAREA)$/.test(event.target?.tagName)) return;
      if (event.code === 'KeyM') {
        event.preventDefault();
        toggleMap();
      }
      const item = SUPPORT.find(item => 'Digit' + item.key === event.code);
      if (item) {
        event.preventDefault();
        onSupport(item.type, quickTargetFor(item.type));
      }
    }
    document.addEventListener('keydown', keydown, { signal: world.chapterSignal });

    function dot(position, color, radius) {
      const [x, y] = project(position);
      context.beginPath();context.arc(x, y, radius, 0, Math.PI * 2);
      context.fillStyle = color;context.fill();
      return [x, y];
    }

    const feed = document.createElement('div');
    feed.className = 'port-tactical-feed';
    feed.style.cssText = 'position:fixed;right:18px;top:98px;z-index:26;display:flex;flex-direction:column;gap:5px;pointer-events:none;font:700 12px/1.35 system-ui,-apple-system,sans-serif;';
    feed.hidden = true;
    document.getElementById('app').append(feed);
    let lastKills = 0, lastDeaths = 0, lastCaptures = 0, streak = 0;
    function pushFeed(text, accent = '#64d5ff') {
      const item = document.createElement('div');
      item.textContent = text;
      item.style.cssText = `background:rgba(10,16,22,.88);border:1px solid ${accent};border-left:4px solid ${accent};color:#edf7fa;padding:5px 11px;border-radius:5px;box-shadow:0 4px 14px rgba(0,0,0,.42);`;
      feed.prepend(item);
      while (feed.children.length > 4) feed.lastElementChild.remove();
      setTimeout(() => item.remove(), 4200);
    }

    return {
      get requisitionOpen() { return requisition.open; },
      battleSettings() {
        const values = Object.fromEntries(config.map(({ key, select }) => [key, select.value]));
        return { difficulty: values.difficulty, startingTickets: Number(values.startingTickets), duration: Number(values.duration) };
      },
      show(next) {
        active = Boolean(next);
        panel.hidden = !active;
        feed.hidden = !active;
        if (!active) {
          map.hidden = true;
          score.hidden = true;
          feed.replaceChildren();
          closeRequisitions();
          mapButton.setAttribute('aria-expanded', 'false');
        }
        if (round !== next) {
          lastUpdate = -Infinity;
          lastKills = next?.kills ?? 0;
          lastDeaths = next?.deaths ?? 0;
          lastCaptures = next?.captures ?? 0;
          streak = 0;
        }
        round = next;
      },
      update(game, player, enemies) {
        if (!active || game.elapsed < lastUpdate + .12) return;
        lastUpdate = game.elapsed;
        if (!score.hidden) renderScore();
        if (game.deaths > lastDeaths) { streak = 0; lastDeaths = game.deaths; }
        if (game.kills > lastKills) {
          streak += game.kills - lastKills;
          lastKills = game.kills;
          const label = streak >= 5 ? t(`🔥 UNSTOPPABLE (${streak} streak) · +RP`, `🔥 战神连杀 (${streak} 连杀) · 支援点飙升`) :
            streak >= 3 ? t(`⚡ KILLING SPREE (${streak}x) · Press 8/9 for Support`, `⚡ 三连击 (${streak}x) · 按 8 烟幕 / 9 重炮支援`) :
            streak === 2 ? t('🎯 DOUBLE KILL · +RP', '🎯 双杀连击 · 支援点 +1') : t('✓ HOSTILE ELIMINATED', '✓ 确认击杀敌方单位');
          pushFeed(label, streak >= 3 ? '#ffb347' : '#64d5ff');
        }
        if (game.captures > lastCaptures) {
          lastCaptures = game.captures;
          pushFeed(t('🚩 SECTOR CAPTURED · +RP', '🚩 据点夺控成功 · 战线推进'), '#6df5a6');
        }
        mapButton.textContent = t('M Map', 'M 地图');
        const support = game.support;
        credits.textContent = t('RP ', '支援点 ') + game.supportPoints;
        const battleEvent = world.developer?.flags.noEnemies ? null : game.majorEvent;
        battleEventStatus.hidden = !battleEvent;
        if (battleEvent) {
          const warning = Math.max(0, Math.ceil(battleEvent.warningUntil - game.elapsed));
          const name = battleEvent.kind === 'bombardment' ? t('Bombardment', '炮击') : t('Counterattack', '反攻');
          const label = name + ' · ' + battleEvent.point.short + (warning ? ' · ' + warning + 's' : '');
          if (battleEventStatus.textContent !== label) battleEventStatus.textContent = label;
        }
        for (const item of SUPPORT) {
          const button = buttons.get(item.type);
          button.textContent = item.key + ' ' + t(item.en, item.zh) + ' ' + game.supportCosts[item.type];
          button.disabled = !player.alive || game.supportPoints < game.supportCosts[item.type] ||
            (support[item.type + 'Until'] ?? 0) > game.elapsed;
        }
        if (map.hidden || !context) return;
        context.drawImage(base, 0, 0);
        if (battleEvent) {
          const [x, y] = project(battleEvent.point.pos);
          const radius = battleEvent.radius + (battleEvent.kind === 'bombardment' ? 4 : 0);
          context.save();
          context.strokeStyle = '#ff796a';
          context.lineWidth = 2;
          context.setLineDash([5, 4]);
          context.beginPath();
          context.ellipse(x, y, radius * (map.width - 32) / (extent.maxX - extent.minX),
            radius * (map.height - 32) / (extent.maxZ - extent.minZ), 0, 0, Math.PI * 2);
          context.stroke();
          context.restore();
        }
        context.font = 'bold 15px system-ui';
        for (const point of game.points) {
          const color = point.contested ? '#ffc271' : point.locked ? '#758691' :
            point.owner === 'blue' ? '#64d5ff' : point.owner === 'red' ? '#ff796a' : '#eeeeee';
          const [x, y] = dot(point.pos, color, 8);
          context.fillStyle = color;context.fillText(point.short, x + 12, y + 5);
        }
        if (support.markUntil > game.elapsed) {
          for (const enemy of enemies) if (enemy.alive && enemy.pos) dot(enemy.pos, '#ff796a', 4);
        }
        if (support.reinforceUntil > game.elapsed && support.reinforcePosition) {
          dot(support.reinforcePosition, '#9afdde', 5);
        }
        if (support.smokeUntil > game.elapsed) dot(support.smokePosition, '#cbd3d9', 10);
        if (support.artillery?.remaining) dot(support.artillery.position, '#ffb347', 10);
        const [x, y] = dot(player.pos, '#64d5ff', 5);
        const yaw = player.yaw || 0;
        context.beginPath();context.moveTo(x, y);
        context.lineTo(x - Math.sin(yaw) * 13, y - Math.cos(yaw) * 13);
        context.strokeStyle = '#edfaff';context.lineWidth = 2;context.stroke();
      },
    };
  };
})();
