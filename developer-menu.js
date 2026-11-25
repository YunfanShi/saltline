(() => {
  const t = (en, zh) => window.SaltlineLocale?.t(en, zh) ?? en;
  const toggles = [
    ['flight', 'Flight', '飞行'],
    ['godMode', 'Invulnerability', '无敌'],
    ['noEnemies', 'Disable enemies', '禁用敌人'],
    ['infiniteAmmo', 'Infinite magazine', '无限弹匣'],
  ];
  const chapterList = [
    ['prologue', '00 Prologue · HQ', '00 序章 · 总部与停机坪'],
    ['berth', '01 Saltline Open World (7 Districts)', '01 盐线市大地图（7 大连通区 · 8 幕战役）'],
  ];
  const humanRoles = [
    ['pilot', 'SAR Pilot', '飞行员'],
    ['operator', 'Tactical Operator', '战术特勤'],
    ['engineer', 'Port Engineer', '港务工程师'],
    ['medic', 'Field Medic', '医护人员'],
    ['worker', 'Dock Worker', '港口工人'],
  ];
  const humanPoses = [
    ['stand', 'Stand', '站姿'],
    ['crouch', 'Crouch', '蹲姿'],
    ['seated', 'Seated', '坐姿'],
    ['parachute', 'Parachute', '跳伞姿'],
  ];

  window.createDeveloperMenu = ({
    world, canOpen, isCampaign, onOpen, onClose, onEnemies, onSpawn, onCut,
    onSwitchChapter, onTriggerCrash, onTriggerBerthClimax, onTriggerTsunami, getWaypoints,
  }) => {
    const flags = { flight: false, godMode: false, noEnemies: false, infiniteAmmo: false };
    const panel = document.createElement('dialog');
    panel.className = 'developer-menu';
    panel.setAttribute('aria-labelledby', 'developer-title');
    panel.innerHTML = `
      <header>
        <h2 id="developer-title"></h2>
        <button type="button" data-close autofocus></button>
      </header>
      <nav class="developer-tabs" role="tablist"></nav>
      <section class="developer-pane" data-pane="controls">
        <div class="developer-toggles"></div>
        <p data-flight-help></p>
        <div class="developer-actions"></div>
      </section>
      <section class="developer-pane" data-pane="events" hidden>
        <p class="developer-hint" data-events-hint></p>
        <div class="developer-actions" data-events-list></div>
        <div class="developer-sublabel" data-stages-label></div>
        <div class="developer-grid" data-stages-grid></div>
      </section>
      <section class="developer-pane" data-pane="maps" hidden>
        <p class="developer-hint" data-maps-hint></p>
        <div class="developer-grid" data-maps-grid></div>
      </section>
      <section class="developer-pane" data-pane="models" hidden>
        <p class="developer-hint" data-models-hint></p>
        <div class="developer-actions" data-models-primary></div>
        <div class="developer-sublabel" data-pose-label></div>
        <div class="developer-actions" data-models-poses></div>
        <div class="developer-sublabel" data-roles-label></div>
        <div class="developer-actions" data-models-roles></div>
      </section>
      <section class="developer-pane" data-pane="teleport" hidden>
        <p class="developer-hint" data-tp-hint></p>
        <div class="developer-grid" data-tp-grid></div>
      </section>
      <p class="developer-status"></p>`;

    const tabBar = panel.querySelector('.developer-tabs');
    const controls = panel.querySelector('.developer-toggles');
    const actions = panel.querySelector('.developer-actions');
    const eventsList = panel.querySelector('[data-events-list]');
    const stagesGrid = panel.querySelector('[data-stages-grid]');
    const mapsGrid = panel.querySelector('[data-maps-grid]');
    const modelsPrimary = panel.querySelector('[data-models-primary]');
    const modelsPoses = panel.querySelector('[data-models-poses]');
    const modelsRoles = panel.querySelector('[data-models-roles]');
    const tpGrid = panel.querySelector('[data-tp-grid]');
    const closeButton = panel.querySelector('[data-close]');
    const status = panel.querySelector('.developer-status');
    const indicator = document.createElement('div');
    indicator.className = 'developer-indicator';
    indicator.hidden = true;
    document.getElementById('app').append(panel, indicator);

    const panes = {
      controls: panel.querySelector('[data-pane="controls"]'),
      events: panel.querySelector('[data-pane="events"]'),
      maps: panel.querySelector('[data-pane="maps"]'),
      models: panel.querySelector('[data-pane="models"]'),
      teleport: panel.querySelector('[data-pane="teleport"]'),
    };
    let activeTab = 'controls';
    const tabDefs = [
      ['controls', 'Controls', '常用调试'],
      ['events', 'Set Pieces', '大事件测试'],
      ['maps', 'Maps (2)', '一键切图'],
      ['models', 'Models', '人物与载具展台'],
      ['teleport', 'Teleport', '快速传送'],
    ];
    const tabButtons = tabDefs.map(([id, en, zh]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'developer-tab';
      btn.addEventListener('click', () => {
        activeTab = id;
        refresh();
      });
      tabBar.append(btn);
      return { id, en, zh, btn };
    });

    const refill = () => (world.weapon.refill || world.weapon.reset).call(world.weapon);

    // Showcase sandbox root for spawned preview characters & vehicles
    let showcaseRoot = null;
    const spawnedHumans = [];
    let currentPose = 'stand';
    let showcaseHeli = null;
    let heliDoorOpen = 1;

    function ensureShowcaseRoot() {
      if (showcaseRoot && showcaseRoot.parent === world.scene) return showcaseRoot;
      if (!world.THREE || !world.scene) return null;
      showcaseRoot = new world.THREE.Group();
      showcaseRoot.name = 'developer-model-showcase';
      world.scene.add(showcaseRoot);
      return showcaseRoot;
    }

    function clearShowcase() {
      if (showcaseRoot && showcaseRoot.parent) showcaseRoot.parent.remove(showcaseRoot);
      showcaseRoot = null;
      spawnedHumans.length = 0;
      showcaseHeli = null;
    }

    function forwardBasis() {
      const yaw = world.player?.yaw ?? 0;
      const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
      const rx = Math.cos(yaw), rz = -Math.sin(yaw);
      return { fx, fz, rx, rz, yaw };
    }

    function groundAt(x, z, fallbackY) {
      if (typeof world.physics?.groundHeight === 'function') {
        return world.physics.groundHeight(x, z, .45);
      }
      return fallbackY;
    }

    function spawnHumanAt(role, offsetRight, dist = 3.2, variation = 0) {
      const root = ensureShowcaseRoot();
      if (!root || !window.createSaltlineHuman) return null;
      const { fx, fz, rx, rz, yaw } = forwardBasis();
      const base = world.player.pos;
      const x = base.x + fx * dist + rx * offsetRight;
      const z = base.z + fz * dist + rz * offsetRight;
      const y = groundAt(x, z, base.y);
      const h = window.createSaltlineHuman(world.THREE, {
        name: `dev-showcase-${role}`, role, variation,
      });
      h.actor.position.set(x, y, z);
      h.actor.rotation.y = yaw + Math.PI;
      h.pose(currentPose, 0, 0, false);
      root.add(h.actor);
      spawnedHumans.push(h);
      return h;
    }

    function spawnAllHumansLineup() {
      clearShowcase();
      humanRoles.forEach(([role], index) => {
        const offset = (index - 2) * 1.15;
        spawnHumanAt(role, offset, 3.4, index);
      });
      close();
    }

    function spawnShowcaseHelicopter() {
      const root = ensureShowcaseRoot();
      if (!root || !window.createPortTransportVisual) return;
      if (showcaseHeli?.root?.parent) showcaseHeli.root.parent.remove(showcaseHeli.root);
      const { fx, fz, yaw } = forwardBasis();
      const base = world.player.pos;
      const x = base.x + fx * 9.5;
      const z = base.z + fz * 9.5;
      const y = groundAt(x, z, base.y);
      showcaseHeli = window.createPortTransportVisual({ THREE: world.THREE, mats: world.mats }, root);
      showcaseHeli.root.position.set(x, y, z);
      showcaseHeli.root.rotation.y = yaw + Math.PI / 2;
      heliDoorOpen = 1;
      showcaseHeli.setDoor(1);
      close();
    }

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

    function addAction(container, en, zh, run, accent = false) {
      const button = document.createElement('button');
      button.type = 'button';
      if (accent) button.className = 'is-accent';
      button.addEventListener('click', () => {
        run();
        refresh();
      });
      container.append(button);
      return { button, en, zh };
    }

    const inspector = addAction(actions, 'Inspector mode (Fly+God+Peace)', '一键审查模式（飞行+无敌+禁敌）', () => {
      setFlag('flight', true);
      setFlag('godMode', true);
      setFlag('noEnemies', true);
      close();
    }, true);
    const heal = addAction(actions, 'Restore health', '恢复生命', () => world.player.heal(world.player.maxHealth));
    const ammo = addAction(actions, 'Refill ammunition', '补满弹药', refill);
    const gull = addAction(actions, 'Spawn Gull', '生成海鸥', () => onSpawn('gull'));
    const hound = addAction(actions, 'Spawn Hound', '生成猎犬', () => onSpawn('hound'));
    const cut = addAction(actions, 'Cut next relay', '切断下一个中继站', onCut);
    const crashBtn = addAction(actions, 'Trigger Rail Crash', '立即触发坠机过场', () => {
      close();
      onTriggerCrash?.();
    });
    const berthClimaxBtn = addAction(actions, 'Trigger Berth 4 Gunship & Crane Collapse', '🎬 触发四号泊位大场面（炮艇空袭+龙门吊倒塌）', () => {
      close();
      onTriggerBerthClimax?.();
    }, true);
    const tsunamiBtn = addAction(actions, 'Trigger 12m Tsunami Storm Surge', '🌊 触发 12 米超强海啸袭港（高地避险大事件）', () => {
      close();
      onTriggerTsunami?.();
    }, true);
    const clear = addAction(actions, 'Reset switches', '重置开关', () => {
      for (const { key } of switches) setFlag(key, false);
    });

    // Tab 2: Dedicated Set Pieces & Random Disaster Events Tester (ALL major events testable!)
    const evRandomBtn = addAction(eventsList, '🎲 Trigger Random Major Event Now', '🎲 立即随机触发一个大事件', () => {
      close();
      world.disasters?.triggerRandomEvent?.();
    }, true);
    const evAutoRandomBtn = addAction(eventsList, 'Auto-Random Events: ON', '🔄 自动随机大事件（探索定时触发）：开', () => {
      const cur = world.disasters?.autoRandom ?? true;
      world.disasters?.setAutoRandom?.(!cur);
    });
    const evGunshipBtn = addAction(eventsList, '🚁 Gunship Sweep & 18m Crane Collapse', '🚁 铁砧武装炮艇空袭 + 18米龙门吊倒塌', () => {
      close();
      (onTriggerBerthClimax || world.berthSlice?.triggerClimaxSetPiece)?.();
    }, true);
    const evTsunamiBtn = addAction(eventsList, '🌊 12m Tsunami Storm Surge (Fixed)', '🌊 12 米超强海啸风暴潮（高地避险）', () => {
      close();
      (onTriggerTsunami || world.disasters?.triggerTsunami)?.();
    }, true);
    const evStormBtn = addAction(eventsList, '⛈️ Coastal Lightning Storm & Squall', '⛈️ 沿海强雷暴与港区闪电暴雨', () => {
      close();
      world.disasters?.triggerLightningStorm?.();
    }, true);
    const evBarrageBtn = addAction(eventsList, '💥 Anvil Artillery Barrage (All 7 Zones)', '💥 铁砧重炮齐射覆盖轰炸（全岛 7 区可用）', () => {
      close();
      world.disasters?.triggerArtilleryBarrage?.();
    }, true);
    const evFuelChainBtn = addAction(eventsList, '🔥 Harbor Fuel-Tank Chain Explosion', '🔥 港区油罐连锁大爆炸（6 连爆冲击波）', () => {
      close();
      world.disasters?.triggerFuelChainBlast?.();
    }, true);
    const evCrashBtn = addAction(eventsList, '✈️ Rail Yard Transport Crash Cutscene', '✈️ 铁路货场运输机坠毁过场（货场章）', () => {
      close();
      onTriggerCrash?.();
    });
    const evModeToggleBtn = addAction(eventsList, '🌏 Toggle Open World Free-Roam / Campaign', '🌏 切换模式：开放世界漫游 / 全城战役', () => {
      const cur = !!world.openWorld?.freeRoam;
      world.openWorld?.setFreeRoam?.(!cur, true);
    }, true);
    const evSkyBtn = addAction(eventsList, '🌤️ Cycle Sky & Lighting (Dawn/Noon/Sunset/Night)', '🌤️ 切换全岛天色光影（晨曦/晴昼/晚霞/港夜 · T 键）', () => {
      world.openWorld?.cycleSky?.();
    });
    const evWorldMapBtn = addAction(eventsList, '🗺️ Open 520m GTA Island Map (M)', '🗺️ 打开 520m 全岛战术大地图（M 键）', () => {
      close(false);
      world.openWorld?.toggleMap?.(true);
    });
    const evStopAllBtn = addAction(eventsList, '🛑 Stop & Reset All Active Events', '🛑 立即停止并复位所有进行中的大事件', () => {
      world.disasters?.stopAllEvents?.();
    });

    // Tab 3: All 10 maps / chapters one-click switcher
    const mapButtons = chapterList.map(([id, en, zh]) => addAction(mapsGrid, en, zh, () => {
      close();
      onSwitchChapter?.(id);
    }));

    // Tab 4: Model showcase buttons (5-character lineup, helicopter, poses, individual roles)
    const lineupBtn = addAction(modelsPrimary, 'Spawn all 5 humans in front', '一键召唤全部 5 套高精度人物到面前', spawnAllHumansLineup, true);
    const truckBtn = addAction(modelsPrimary, 'Summon Drivable 4x4 Truck (Press F)', '🚙 召唤可驾驶 SAR 战术四驱车到面前（按 F 驾驶）', () => {
      world.vehicle?.summonNear?.(world.player);
      close();
    }, true);
    const heliBtn = addAction(modelsPrimary, 'Spawn SAR-07 Helicopter', '一键召唤 SAR-07 直升机到面前', spawnShowcaseHelicopter);
    const expoBtn = addAction(modelsPrimary, 'Spawn All-Chapter Multi-Story Buildings', '一键生成全章节多层建筑展台（2-3层）', () => {
      world.architecture?.spawnAllChaptersExpo?.(world.player?.pos);
      close();
    }, true);
    const streamBtn = addAction(modelsPrimary, 'Cycle Sector Streaming (Compact/Std/Full)', '切换大地图分区流式加载范围', () => {
      const order = ['compact', 'standard', 'full'];
      const cur = world.architecture?.streamingMode ?? 'standard';
      const next = order[(order.indexOf(cur) + 1) % order.length];
      world.architecture?.setStreamingMode?.(next);
      world.architecture?.update?.(0, world.player?.pos);
    });
    const doorBtn = addAction(modelsPrimary, 'Toggle Heli Door / Rope', '切换直升机舱门与垂绳', () => {
      if (!showcaseHeli) return;
      heliDoorOpen = heliDoorOpen > .5 ? 0 : 1;
      showcaseHeli.setDoor(heliDoorOpen);
      showcaseHeli.setCable(heliDoorOpen ? 6 : 0);
    });
    const clearModelsBtn = addAction(modelsPrimary, 'Clear Showcase Models', '清除所有展台模型', clearShowcase);

    const poseButtons = humanPoses.map(([mode, en, zh]) => addAction(modelsPoses, en, zh, () => {
      currentPose = mode;
      for (const h of spawnedHumans) h.pose(mode, 0, 0, false);
    }));
    const roleButtons = humanRoles.map(([role, en, zh], idx) => addAction(modelsRoles, `+ ${en}`, `+ 生成${zh}`, () => {
      spawnHumanAt(role, 0, 3.0, idx);
      close();
    }));

    function rebuildStages() {
      if (!stagesGrid) return;
      stagesGrid.innerHTML = '';
      const list = world.openWorld?.stageStarts;
      if (!Array.isArray(list)) return;
      list.forEach((st, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        if (world.openWorld?.stage === idx) btn.className = 'is-accent';
        btn.textContent = t(st.en, st.zh);
        btn.addEventListener('click', () => {
          world.openWorld?.jumpToStage?.(idx);
          close();
        });
        stagesGrid.append(btn);
      });
    }

    function rebuildWaypoints() {
      if (!tpGrid) return;
      tpGrid.innerHTML = '';
      const pts = typeof getWaypoints === 'function' ? getWaypoints() : [];
      for (const { labelEn, labelZh, pos } of pts) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = t(labelEn, labelZh);
        btn.addEventListener('click', () => {
          if (world.player?.pos && pos) {
            world.player.pos.set(pos.x, pos.y + .1, pos.z);
            world.player.vel?.set?.(0, 0, 0);
          }
          close();
        });
        tpGrid.append(btn);
      }
    }

    function refresh() {
      panel.querySelector('h2').textContent = t('Developer menu', '开发者菜单');
      closeButton.textContent = t('Resume', '继续游戏');
      for (const { id, en, zh, btn } of tabButtons) {
        btn.textContent = t(en, zh);
        btn.className = id === activeTab ? 'developer-tab is-active' : 'developer-tab';
        if (panes[id]) panes[id].hidden = id !== activeTab;
      }
      panel.querySelector('[data-flight-help]').textContent = t(
        'Flight · WASD to move, Space to ascend, C to descend, Shift to boost.',
        '飞行 · WASD 移动，空格上升，C 下降，Shift 加速。');
      panel.querySelector('[data-events-hint]').textContent = t(
        'Trigger any major cinematic set piece or disaster immediately, or toggle random open-world events:',
        '所有大场面与灾害事件均可在此一键测试，也可开启「自动随机大事件」在探索大世界时随机触发：');
      const stagesLbl = panel.querySelector('[data-stages-label]');
      if (stagesLbl) {
        const hasStages = Array.isArray(world.openWorld?.stageStarts);
        stagesLbl.hidden = !hasStages;
        stagesLbl.textContent = t('Jump to Any City Campaign Stage (1–8):', '一键跳关测试·盐线市 8 关全城串联战役（自动传送+重置本关目标）：');
      }
      panel.querySelector('[data-maps-hint]').textContent = t(
        'Click any chapter to jump directly into that map:',
        '点击任意章节即可一键直接跳转对应地图：');
      panel.querySelector('[data-models-hint]').textContent = t(
        'Spawn upgraded characters or vehicles directly in front of you for close-up inspection:',
        '直接将升级后的人物或载具召唤到你正前方，方便近距离检查建模细节：');
      panel.querySelector('[data-pose-label]').textContent = t('Switch Pose (for spawned humans):', '切换已召唤人物姿态：');
      panel.querySelector('[data-roles-label]').textContent = t('Spawn Individual Character:', '单独召唤某个角色：');
      panel.querySelector('[data-tp-hint]').textContent = t(
        'Teleport to key landmarks in the current chapter:',
        '一键传送到当前地图的关键场景点位：');

      for (const { key, en, zh, input, caption } of switches) {
        caption.textContent = t(en, zh);
        input.checked = flags[key];
      }
      for (const { button, en, zh } of [
        inspector, heal, ammo, gull, hound, cut, crashBtn, berthClimaxBtn, tsunamiBtn, clear,
        evRandomBtn, evAutoRandomBtn, evGunshipBtn, evTsunamiBtn, evStormBtn, evBarrageBtn,
        evFuelChainBtn, evCrashBtn, evModeToggleBtn, evSkyBtn, evWorldMapBtn, evStopAllBtn,
        ...mapButtons, lineupBtn, truckBtn, heliBtn, expoBtn, streamBtn, doorBtn, clearModelsBtn,
        ...poseButtons, ...roleButtons,
      ]) {
        button.textContent = t(en, zh);
      }
      const autoOn = world.disasters?.autoRandom ?? true;
      evAutoRandomBtn.button.textContent = autoOn
        ? t('🔄 Auto-Random Events: ON', '🔄 自动随机大事件（探索定时触发）：开')
        : t('🔄 Auto-Random Events: OFF', '🔄 自动随机大事件（探索定时触发）：关');
      const st = world.architecture?.getStats?.();
      if (st) {
        const modeZh = { compact: '省电 80m', standard: '标准 145m', full: '全图常驻' }[st.mode] ?? st.mode;
        streamBtn.button.textContent = t(`Streaming: ${st.mode} (${st.loaded}/${st.total})`, `流式加载：${modeZh}（已载入 ${st.loaded}/${st.total} 区）`);
      }
      gull.button.disabled = hound.button.disabled = flags.noEnemies;
      cut.button.hidden = !isCampaign();
      crashBtn.button.hidden = !onTriggerCrash;
      berthClimaxBtn.button.hidden = !onTriggerBerthClimax;
      tsunamiBtn.button.hidden = !onTriggerTsunami;
      evGunshipBtn.button.hidden = !(onTriggerBerthClimax || world.berthSlice?.triggerClimaxSetPiece);
      evCrashBtn.button.hidden = !onTriggerCrash;
      evWorldMapBtn.button.hidden = !world.openWorld?.toggleMap || Boolean(world.game?.conquest);
      doorBtn.button.disabled = !showcaseHeli;
      if (activeTab === 'events') rebuildStages();
      if (activeTab === 'teleport') rebuildWaypoints();

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

    function close(restorePointer = true) {
      if (!panel.open) return;
      panel.close();
      onClose(restorePointer && recapture && canOpen());
    }

    closeButton.addEventListener('click', () => close());
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
        clearShowcase();
        refresh();
      },
    };
  };
})();
