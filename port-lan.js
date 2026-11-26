/* SALTLINE — Redesigned 3-Column Multiplayer Lobby (IRONFRONT-inspired Product Structure)
 * Layout:
 *   Left:   5 Mode Selection Cards (Conquest, Breakthrough, Co-op Rescue, Cooperative Campaign, Sandbox)
 *   Center: Real Tactical Map Preview & Mode Rules Summary (5 Truly Independent Maps)
 *   Right:  Live Player Roster, Ready States, Host Controls, Team/Role & Connection Status
 *   Bottom: Full Host Settings (Map, Mode, Max Slots, Teams, Duration, Difficulty, AI, Weather,
 *           Time of Day, Visibility, Mid-Join, Custom Rules) + Invite, Ready, Start, Return */
(() => {
  const t = (en, zh) => window.SaltlineLocale?.t(en, zh) ?? en;
  const PROTOCOL_VERSION = 2;
  const key = 'saltline.lan.seat';

  const DEFAULT_MAPS = [
    { id: 'coastal_metropolis', legacyId: 'coastal_quarter', zh: '沿海大都市 · Coastal Metropolis', en: 'Coastal Metropolis', descZh: '独立构建的大型沿海都市：现代商业中心、高密度住宅、喷泉广场、滨海大道与多层室内大厅。', descEn: 'Modern skyline, residential towers, civic plaza & multi-level lobbies.', accent: '#38bdf8' },
    { id: 'iron_harbor', legacyId: 'port_rail', zh: '钢铁港与铁路枢纽 · Iron Harbor', en: 'Iron Harbor', descZh: '独立构建的港口与铁路编组站：双轨货运列车阵、龙门吊、货运仓库与集装箱走廊。', descEn: 'Dual-track freight railway hub, gantry cranes & container corridors.', accent: '#f59e0b' },
    { id: 'highland_passage', legacyId: 'mountain_forest', zh: '高地山谷通道 · Highland Passage', en: 'Highland Passage', descZh: '独立构建的山区与森林立体地图：盘山公路、多树种松林、高地通信站与山谷村镇。', descEn: 'Mountain valley, winding highway, pine forest & hilltop relay.', accent: '#34d399' },
    { id: 'old_saltline', legacyId: 'old_harbor', zh: '老盐线历史城区 · Old Saltline', en: 'Old Saltline', descZh: '独立构建的历史城区：密集石板巷道、红砖拱廊、历史钟楼广场与街角商铺。', descEn: 'Dense historic brick quarter, cobblestone alleys & clock plaza.', accent: '#60a5fa' },
    { id: 'industrial_coast', legacyId: 'coastal_industrial', zh: '沿海重工带 · Industrial Coast', en: 'Industrial Coast', descZh: '独立构建的沿海重工业区：低温储罐群、高架管廊平台、精炼厂房与海岸泵站。', descEn: 'Heavy refineries, elevated pipe catwalks, cryo tanks & seawall dock.', accent: '#fb7185' },
  ];

  const MODES = [
    { id: 'conquest', zh: '港口征服', en: 'Conquest', descZh: '争夺 5 处战略据点，维持多数控制持续消耗敌方兵力。', descEn: 'Capture & hold 5 objectives to bleed enemy tickets.' },
    { id: 'breakthrough', zh: '战区突破', en: 'Breakthrough', descZh: '攻方按顺序逐区推进 4 道防线，守方死守耗尽攻方兵力。', descEn: 'Sequential 4-sector assault and defense.' },
    { id: 'coop_rescue', zh: '合作应急搜救', en: 'Co-op Rescue', descZh: '医疗/工程/侦察分工协作，修复设施并护送受困市民撤离。', descEn: 'Role-based co-op repair & civilian evacuation.' },
    { id: 'coop_campaign', zh: '合作战役 (2-4人)', en: 'Co-op Campaign', descZh: '2–4 人共享 14 章《盐线危机》剧情进度、解谜与检查点。', descEn: '2–4P synchronized 14-chapter Saltline Crisis campaign.' },
    { id: 'sandbox', zh: '自由探索沙盒', en: 'Open World Sandbox', descZh: '自由探索、共享载具、房主实时触发天气与世界事件。', descEn: 'Free roam, shared vehicles & host-controlled world events.' },
  ];

  function getMaps() {
    const ext = window.SaltlineMPMaps?.MP_MAPS;
    if (Array.isArray(ext) && ext.length) {
      return ext.map(m => ({
        id: m.id, legacyId: m.legacyId, zh: m.nameZh, en: m.nameEn,
        descZh: m.descZh, descEn: m.descEn, accent: m.accent, svg: m.previewSvg,
      }));
    }
    return DEFAULT_MAPS;
  }

  const errors = {
    invalid_name: ['Enter a name of 1–24 characters.', '请输入 1–24 个字符的名字。'],
    room_not_found: ['Room not found or expired.', '房间不存在或已过期。'],
    room_full: ['The room is full.', '房间已满。'],
    room_countdown: ['The roster countdown is in progress.', '阵容锁定倒计时正在进行。'],
    room_started: ['The match is already live (mid-join disabled).', '该房间已开战（未开启中途加入）。'],
    protocol_mismatch: ['Client/Server protocol version mismatch. Refresh the page.', '客户端与服务器协议版本不一致，请刷新页面。'],
    invalid_token: ['Your seat has expired.', '你的席位已过期。'],
    host_only: ['Only the host can perform this action.', '只有房主可以执行此操作。'],
    players_not_ready: ['All players must be connected and ready, with at least two players.', '至少需要两人，且所有成员都在线并已准备。'],
    room_limit: ['The server has reached its room limit.', '服务器已达到房间上限。'],
    offline: ['Open Saltline from the LAN server address to create or join a room.', '请从局域网服务地址打开 Saltline，再创建或加入房间。'],
  };

  if (!document.getElementById('saltline-lan-lobby-style')) {
    const st = document.createElement('style');
    st.id = 'saltline-lan-lobby-style';
    st.textContent = `
      .port-lan{width:min(1080px,96vw);max-height:92vh;background:linear-gradient(160deg,#091119 0%,#111e2b 100%);color:#e8f1f8;border:1px solid rgba(110,185,235,.32);border-radius:10px;padding:16px 20px;box-shadow:0 24px 64px rgba(0,0,0,.72);overflow:auto}
      .port-lan::backdrop{background:rgba(4,9,14,.78);backdrop-filter:blur(5px)}
      .port-lan-3col{display:grid;grid-template-columns:215px 1fr 270px;gap:14px;margin-top:12px}
      @media(max-width:880px){.port-lan-3col{grid-template-columns:1fr}}
      .port-lan-card{background:rgba(13,24,35,.86);border:1px solid rgba(130,190,235,.18);border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:8px}
      .port-lan-modebtn{display:flex;flex-direction:column;gap:2px;padding:9px 10px;border-radius:6px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:#dce9f2;text-align:left;cursor:pointer;font-family:system-ui,sans-serif}
      .port-lan-modebtn:hover{border-color:#60a5fa;background:rgba(56,189,248,.1)}
      .port-lan-modebtn.active{border-color:#f2c45a;background:rgba(242,196,90,.18);color:#fff}
      .port-lan-modebtn strong{font-size:13px}
      .port-lan-modebtn span{font-size:11px;opacity:.76;line-height:1.35}
      .port-lan-preview svg{width:100%;height:142px;background:#08121b;border:1px solid rgba(255,255,255,.12);border-radius:6px}
      .port-lan-badge{display:inline-flex;align-items:center;gap:6px;font:700 11px/1 system-ui,sans-serif;padding:4px 8px;border-radius:99px;background:rgba(56,189,248,.16);color:#7dd3fc;letter-spacing:.04em}
      .port-lan-roster{list-style:none;margin:4px 0;padding:0;display:flex;flex-direction:column;gap:6px;max-height:220px;overflow:auto}
      .port-lan-roster li{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 9px;border-radius:6px;background:rgba(255,255,255,.04);border-left:3px solid #38bdf8;font-size:12px}
      .port-lan-roster li.team-red{border-left-color:#f87171}
      .port-lan-pill{font-size:10.5px;padding:2px 7px;border-radius:99px;background:rgba(255,255,255,.08)}
      .port-lan-pill.ready{background:rgba(52,211,153,.22);color:#6ee7b7}
      .port-lan-pill.off{background:rgba(248,113,113,.22);color:#fca5a5}
      .port-lan-bottom{margin-top:12px;background:rgba(13,24,35,.86);border:1px solid rgba(130,190,235,.18);border-radius:8px;padding:12px}
      .port-lan-settings-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(145px,1fr));gap:8px;margin-bottom:10px}
      .port-lan-settings-grid label{display:flex;flex-direction:column;gap:3px;font-size:11px;color:#9cc0d0}
      .port-lan-settings-grid select,.port-lan-settings-grid input{background:#0b1622;color:#e9f4fa;border:1px solid rgba(130,190,235,.28);border-radius:5px;padding:5px 7px;font-size:12px}
      .port-lan-bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.1)}
    `;
    document.head.appendChild(st);
  }

  const dialog = document.createElement('dialog');
  dialog.className = 'developer-menu port-lan';
  dialog.setAttribute('aria-labelledby', 'port-lan-title');
  dialog.innerHTML = `
    <header style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.12);padding-bottom:8px;gap:10px;flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:10px">
        <h2 id="port-lan-title" style="margin:0;font-size:16px"></h2>
        <span class="port-lan-badge">PROTO v${PROTOCOL_VERSION} · 20Hz AUTH</span>
        <span class="port-lan-badge" data-phase-badge>LOBBY</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span data-room style="font-size:13px;font-weight:700;color:#f2c45a"></span>
        <button type="button" data-close></button>
      </div>
    </header>

    <div class="port-lan-3col">
      <!-- LEFT: 5 Mode Selector -->
      <section class="port-lan-card">
        <strong style="font-size:12px;color:#9cc0d0;letter-spacing:.08em" data-col-modes></strong>
        <div data-mode-list style="display:flex;flex-direction:column;gap:6px"></div>
      </section>

      <!-- CENTER: Real Map Preview & Mode Rules -->
      <section class="port-lan-card port-lan-preview">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
          <strong data-preview-title style="font-size:14.5px"></strong>
          <span class="port-lan-badge" data-preview-mode></span>
        </div>
        <svg viewBox="0 0 160 100" data-preview-svg></svg>
        <p data-preview-desc style="margin:0;font-size:12px;color:#c2dae5;line-height:1.5"></p>
        <p data-mode-desc style="margin:0;font-size:12px;color:#94c5d8;line-height:1.45"></p>
        <div data-entry-join style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:auto;padding-top:8px;border-top:1px solid rgba(255,255,255,.08)">
          <label style="display:flex;flex-direction:column;gap:3px;font-size:11px;color:#9cc0d0"><span data-name-label></span><input name="name" autocomplete="nickname" maxlength="24" style="background:#0b1622;color:#fff;border:1px solid rgba(130,190,235,.3);border-radius:5px;padding:6px 8px"></label>
          <label style="display:flex;flex-direction:column;gap:3px;font-size:11px;color:#9cc0d0"><span data-code-label></span><input name="code" autocomplete="off" maxlength="120" spellcheck="false" style="background:#0b1622;color:#fff;border:1px solid rgba(130,190,235,.3);border-radius:5px;padding:6px 8px"></label>
        </div>
      </section>

      <!-- RIGHT: Player List, Ready Status, Host & Connection -->
      <section class="port-lan-card">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <strong style="font-size:12px;color:#9cc0d0;letter-spacing:.08em" data-col-roster></strong>
          <span data-net-state class="port-lan-pill ready"></span>
        </div>
        <p data-room-meta style="font-size:11.5px;color:#9cc0d0;margin:0"></p>
        <ul class="port-lan-roster" data-players></ul>
        <p role="status" data-countdown hidden style="font-weight:700;color:#fbbf24;margin:4px 0;font-size:12.5px"></p>
        <p data-explanation style="margin:auto 0 0;font-size:11px;opacity:.7;line-height:1.45"></p>
      </section>
    </div>

    <!-- BOTTOM: Full Host Settings & Action Bar -->
    <section class="port-lan-bottom">
      <div class="port-lan-settings-grid" data-lan-settings>
        <label><span data-map-label></span><select name="mapId"></select></label>
        <label><span data-mode-label></span><select name="mode"><option value="conquest"></option><option value="breakthrough"></option><option value="coop_rescue"></option><option value="coop_campaign"></option><option value="sandbox"></option></select></label>
        <label><span data-max-label></span><select name="maxPlayers"><option value="2">2</option><option value="4">4</option><option value="6">6</option><option value="8" selected>8</option></select></label>
        <label><span data-team-mode-label></span><select name="joinTeam"><option value="blue"></option><option value="alternate"></option><option value="red"></option></select></label>
        <label><span data-duration-label></span><select name="duration"><option value="180">3 min</option><option value="240" selected>4 min</option><option value="300">5 min</option><option value="360">6 min</option><option value="600">10 min</option></select></label>
        <label><span data-diff-label></span><select name="difficulty"><option value="easy"></option><option value="normal" selected></option><option value="hard"></option></select></label>
        <label><span data-ai-label></span><select name="aiEnabled"><option value="true"></option><option value="false"></option></select></label>
        <label><span data-weather-label></span><select name="weather"><option value="clear"></option><option value="overcast" selected></option><option value="rain"></option><option value="storm"></option></select></label>
        <label><span data-time-label></span><select name="timeOfDay"><option value="morning"></option><option value="day" selected></option><option value="sunset"></option><option value="night"></option></select></label>
        <label><span data-vis-label></span><select name="visibility"><option value="public" selected></option><option value="private"></option></select></label>
        <label><span data-midjoin-label></span><select name="allowMidJoin"><option value="true"></option><option value="false"></option></select></label>
        <label><span data-tickets-label></span><select name="startingTickets"><option value="25">25</option><option value="40" selected>40</option><option value="60">60</option><option value="70">70</option></select></label>
      </div>
      <div class="port-lan-bar">
        <div class="developer-actions" style="display:flex;flex-wrap:wrap;gap:8px">
          <button type="button" data-create></button>
          <button type="button" data-join></button>
          <button type="button" data-ready hidden></button>
          <button type="button" data-start hidden></button>
          <button type="button" data-rematch hidden></button>
          <button type="button" data-share hidden></button>
          <button type="button" data-leave hidden></button>
        </div>
        <p role="status" data-status style="margin:0;font-size:12.5px;color:#7dd3fc"></p>
      </div>
    </section>`;
  document.getElementById('app').append(dialog);

  const find = selector => dialog.querySelector(selector);
  const name = find('input[name="name"]');
  const code = find('input[name="code"]');
  const mapSel = find('select[name="mapId"]');
  const modeSel = find('select[name="mode"]');
  const diffSel = find('select[name="difficulty"]');
  const ticketsSel = find('select[name="startingTickets"]');
  const durationSel = find('select[name="duration"]');
  const maxSel = find('select[name="maxPlayers"]');
  const teamSel = find('select[name="joinTeam"]');
  const aiSel = find('select[name="aiEnabled"]');
  const weatherSel = find('select[name="weather"]');
  const timeSel = find('select[name="timeOfDay"]');
  const visSel = find('select[name="visibility"]');
  const midJoinSel = find('select[name="allowMidJoin"]');

  function populateMapOptions() {
    const maps = getMaps();
    const prev = mapSel.value;
    mapSel.innerHTML = '';
    for (const m of maps) {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = t(m.en, m.zh);
      mapSel.appendChild(opt);
    }
    if (prev && maps.some(m => m.id === prev)) mapSel.value = prev;
  }
  populateMapOptions();

  const codeFromLink = new URL(location.href).searchParams.get('room');
  code.value = codeFromLink ?? '';
  let seat = null;
  let room = null;
  let busy = false;
  let generation = 0;
  let timer;
  let status = null;
  let countdownTimer;
  let countdownEnd = 0;
  let countdownCancelled = false;
  let launchedRoomCode = null;

  code.addEventListener('input', () => {
    const raw = code.value.trim();
    if (raw.includes('room=')) {
      try {
        const parsed = new URL(raw.includes('://') ? raw : 'http://' + raw);
        const extracted = parsed.searchParams.get('room');
        if (extracted) code.value = extracted.toUpperCase();
      } catch {}
    }
  });

  function pushHostSettingsIfInLobby() {
    if (room && room.phase === 'lobby' && room.hostId === room.yourId && !busy) {
      change('settings', collectSettings());
    } else {
      render();
    }
  }
  for (const sel of [mapSel, modeSel, diffSel, ticketsSel, durationSel, teamSel, aiSel, weatherSel, timeSel, visSel, midJoinSel]) {
    sel.addEventListener('change', pushHostSettingsIfInLobby);
  }

  try {
    const saved = JSON.parse(sessionStorage.getItem(key));
    if (saved && typeof saved.token === 'string' && /^[a-f0-9]{6}$/i.test(saved.code)) seat = saved;
  } catch {}

  function remember(next) {
    seat = next;
    try {
      if (seat) sessionStorage.setItem(key, JSON.stringify(seat));
      else sessionStorage.removeItem(key);
    } catch {}
  }

  function modeInfo(modeId) {
    return MODES.find(m => m.id === modeId) || MODES[0];
  }
  function mapInfo(mapId) {
    const maps = getMaps();
    return maps.find(m => m.id === mapId || m.legacyId === mapId) || maps[0];
  }

  function collectSettings() {
    return {
      mapId: mapSel.value,
      mode: modeSel.value,
      difficulty: diffSel.value,
      startingTickets: Number(ticketsSel.value) || 40,
      duration: Number(durationSel.value) || 240,
      joinTeam: teamSel.value,
      aiEnabled: aiSel.value !== 'false',
      weather: weatherSel.value,
      timeOfDay: timeSel.value,
      visibility: visSel.value,
      allowMidJoin: midJoinSel.value !== 'false',
    };
  }

  function launchLanMatch() {
    if (!room || !seat || room.phase !== 'started' || launchedRoomCode === room.code) return;
    launchedRoomCode = room.code;
    const own = room.players.find(p => p.id === room.yourId);
    if (dialog.open) dialog.close();
    document.dispatchEvent(new CustomEvent('saltline:lan-start', {
      detail: {
        code: room.code,
        token: seat.token,
        yourId: room.yourId,
        hostId: room.hostId,
        team: own?.team ?? 'blue',
        name: own?.name ?? name.value.trim(),
        settings: room.settings ?? collectSettings(),
        origin: location.origin,
      },
    }));
  }

  function acceptRoom(next) {
    countdownCancelled = next?.phase === 'lobby' && (room?.phase === 'countdown' || countdownCancelled);
    if (next?.phase === 'lobby' && room?.phase === 'started') launchedRoomCode = null;
    room = next;
    countdownEnd = performance.now() + (room?.countdownMs ?? 0);
    if (room?.settings) {
      const s = room.settings;
      const m = mapInfo(s.mapId);
      if (m) mapSel.value = m.id;
      if (s.mode) modeSel.value = s.mode;
      if (s.difficulty) diffSel.value = s.difficulty;
      if (s.startingTickets) ticketsSel.value = String(s.startingTickets);
      if (s.duration) durationSel.value = String(s.duration);
      if (s.joinTeam) teamSel.value = s.joinTeam;
      aiSel.value = s.aiEnabled === false ? 'false' : 'true';
      if (s.weather) weatherSel.value = s.weather;
      if (s.timeOfDay) timeSel.value = s.timeOfDay;
      if (s.visibility) visSel.value = s.visibility;
      midJoinSel.value = s.allowMidJoin === false ? 'false' : 'true';
    }
    if (room?.phase === 'started') launchLanMatch();
  }

  function renderCountdown() {
    clearTimeout(countdownTimer);
    const label = find('[data-countdown]');
    let message = '';
    if (room?.phase === 'countdown') {
      const remaining = Math.max(0, countdownEnd - performance.now());
      const seconds = Math.ceil(remaining / 1000);
      message = seconds
        ? t(`Deploying match in ${seconds}…`, `${seconds} 秒后进入联机战斗…`)
        : t('Waiting for server confirmation…', '等待服务器确认…');
      if (remaining && dialog.open) countdownTimer = setTimeout(renderCountdown, remaining - (seconds - 1) * 1000 + 1);
    } else if (room?.phase === 'started') {
      message = t('Match live — connected via LAN sync.', '战斗已开始——局域网实时同步已连接。');
    } else if (countdownCancelled) {
      message = t('Roster countdown cancelled.', '倒计时已取消。');
    }
    label.hidden = !message;
    if (label.textContent !== message) label.textContent = message;
  }

  function render() {
    populateMapOptions();
    find('h2').textContent = t('SALTLINE Multiplayer Lobby', 'SALTLINE 多人联机大厅');
    find('[data-close]').textContent = t('Back', '返回');
    find('[data-col-modes]').textContent = t('GAME MODES (5)', '玩法模式选择 (5)');
    find('[data-col-roster]').textContent = t('PLAYERS & STATUS', '玩家列表与准备状态');
    find('[data-name-label]').textContent = t('Callsign', '玩家代号');
    find('[data-code-label]').textContent = t('Room code or link', '房间码 / 邀请链接');
    find('[data-map-label]').textContent = t('Independent Map (5)', '独立地图 (5)');
    find('[data-mode-label]').textContent = t('Mode', '玩法模式');
    find('[data-max-label]').textContent = t('Max Players', '最大人数');
    find('[data-team-mode-label]').textContent = t('Team Assignment', '玩家分组');
    find('[data-duration-label]').textContent = t('Match Time', '游戏时间');
    find('[data-diff-label]').textContent = t('Difficulty', '难度');
    find('[data-ai-label]').textContent = t('AI Units', 'AI 启用');
    find('[data-weather-label]').textContent = t('Weather', '天气');
    find('[data-time-label]').textContent = t('Time of Day', '时间段');
    find('[data-vis-label]').textContent = t('Visibility', '房间可见性');
    find('[data-midjoin-label]').textContent = t('Mid-Join', '中途加入');
    find('[data-tickets-label]').textContent = t('Tickets', '兵力票');

    modeSel.options[0].textContent = t('Conquest', '港口征服');
    modeSel.options[1].textContent = t('Breakthrough', '战区突破');
    modeSel.options[2].textContent = t('Co-op Rescue', '合作应急搜救');
    modeSel.options[3].textContent = t('Co-op Campaign (2-4P)', '合作战役 (2-4人)');
    modeSel.options[4].textContent = t('Open World Sandbox', '自由探索沙盒');
    diffSel.options[0].textContent = t('Easy', '标准');
    diffSel.options[1].textContent = t('Normal', '战术');
    diffSel.options[2].textContent = t('Hard', '精英');
    teamSel.options[0].textContent = t('Co-op (Blue)', '合作（全蓝方）');
    teamSel.options[1].textContent = t('Versus (Alternate)', '对抗（自动分队）');
    teamSel.options[2].textContent = t('Red Side', '红方');
    aiSel.options[0].textContent = t('Enabled', '开启 AI');
    aiSel.options[1].textContent = t('PvP Only', '关闭 AI');
    weatherSel.options[0].textContent = t('Clear', '晴朗');
    weatherSel.options[1].textContent = t('Overcast', '阴云');
    weatherSel.options[2].textContent = t('Rain', '降雨');
    weatherSel.options[3].textContent = t('Storm', '风暴');
    timeSel.options[0].textContent = t('Morning', '清晨');
    timeSel.options[1].textContent = t('Day', '白天');
    timeSel.options[2].textContent = t('Sunset', '黄昏');
    timeSel.options[3].textContent = t('Night', '夜间');
    visSel.options[0].textContent = t('Public LAN', '公开房间');
    visSel.options[1].textContent = t('Private Code', '私密（仅凭码加入）');
    midJoinSel.options[0].textContent = t('Allowed', '允许');
    midJoinSel.options[1].textContent = t('Locked', '锁定');

    const activeModeId = room?.settings?.mode || modeSel.value;
    const activeMapId = room?.settings?.mapId || mapSel.value;
    const curMode = modeInfo(activeModeId);
    const curMap = mapInfo(activeMapId);
    const isHost = !room || room.hostId === room.yourId;

    // Left Column: 5 Mode Cards
    const modeList = find('[data-mode-list]');
    modeList.innerHTML = '';
    for (const m of MODES) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'port-lan-modebtn' + (m.id === activeModeId ? ' active' : '');
      btn.disabled = Boolean(room && (!isHost || room.phase !== 'lobby'));
      btn.innerHTML = `<strong>${t(m.en, m.zh)}</strong><span>${t(m.descEn, m.descZh)}</span>`;
      btn.addEventListener('click', () => {
        modeSel.value = m.id;
        pushHostSettingsIfInLobby();
      });
      modeList.appendChild(btn);
    }

    // Center Column: Real Map Preview & Mode Summary
    find('[data-preview-title]').textContent = t(curMap.en, curMap.zh);
    find('[data-preview-mode]').textContent = t(curMode.en, curMode.zh);
    find('[data-preview-svg]').innerHTML = curMap.svg || '';
    find('[data-preview-desc]').textContent = t(curMap.descEn, curMap.descZh);
    find('[data-mode-desc]').textContent = t(curMode.descEn, curMode.descZh);
    find('[data-entry-join]').style.display = room ? 'none' : 'grid';

    // Right Column: Roster & Connection
    find('[data-net-state]').textContent = room ? t('Connected', '服务器已同步') : t('Ready to Host/Join', '待连接');
    find('[data-room]').textContent = room ? `${t('Room', '房间')} ${room.code} (${room.players.length}/${room.maxPlayers ?? 8})` : '';
    find('[data-phase-badge]').textContent = !room ? t('STANDBY', '未入房') : room.phase === 'started' ? t('LIVE', '进行中') : room.phase === 'countdown' ? t('DEPLOYING', '倒计时') : t('LOBBY', '大厅准备');
    find('[data-explanation]').textContent = t(
      'Authoritative 20Hz LAN sync: 5 modes, 5 independent maps, 2–8 players, vehicle locks, host migration & 30s reconnect reservation.',
      '权威 20Hz 局域网同步：5 种独立模式、5 张独立地图、2–8 人、载具占用锁、房主自动迁移与 30 秒掉线保留。'
    );

    const roster = find('[data-players]');
    if (!room) {
      find('[data-room-meta]').textContent = t('Create a room as host or enter a 6-character code to join.', '创建房间成为房主，或输入 6 位房间码加入好友房间。');
      roster.innerHTML = `<li style="opacity:.65;border-left-color:#64748b">${t('No active room yet', '尚未进入联机房间')}</li>`;
    } else {
      const s = room.settings;
      find('[data-room-meta]').textContent = `${t(curMode.en, curMode.zh)} · ${s.weather || 'overcast'} · ${s.timeOfDay || 'day'} · ${s.visibility || 'public'}`;
      roster.replaceChildren(...room.players.map(player => {
        const row = document.createElement('li');
        if (player.team === 'red') row.classList.add('team-red');
        const hostTag = player.id === room.hostId ? t('👑 Host', '👑 房主') : t('Member', '队员');
        const team = player.team === 'red' ? t('Red', '红方') : t('Blue', '蓝方');
        const left = document.createElement('span');
        left.textContent = `${player.name} · ${team} · ${hostTag}`;
        const right = document.createElement('div');
        right.style.cssText = 'display:flex;align-items:center;gap:6px';
        const pill = document.createElement('span');
        pill.className = 'port-lan-pill ' + (!player.connected ? 'off' : player.ready ? 'ready' : '');
        pill.textContent = !player.connected ? t('Reconnecting', '重连中') : player.ready ? t('Ready', '已准备') : t('Waiting', '待准备');
        right.append(pill);
        if (isHost && room.phase === 'lobby' && !['coop_rescue', 'coop_campaign', 'sandbox'].includes(room.settings?.mode)) {
          const swap = document.createElement('button');
          swap.type = 'button';
          swap.style.cssText = 'padding:2px 6px;font-size:10.5px;cursor:pointer;';
          swap.textContent = t('Swap', '换边');
          swap.addEventListener('click', () => change('team', { playerId: player.id, team: player.team === 'red' ? 'blue' : 'red' }));
          right.append(swap);
        }
        row.append(left, right);
        return row;
      }));
    }

    // Disable settings for non-host or live room
    for (const sel of dialog.querySelectorAll('[data-lan-settings] select')) {
      sel.disabled = Boolean(room && (!isHost || room.phase !== 'lobby'));
    }

    // Bottom Actions
    const own = room?.players?.find(p => p.id === room.yourId);
    find('[data-create]').textContent = t('Create Room', '创建联机房间');
    find('[data-join]').textContent = t('Join Room', '加入房间');
    find('[data-create]').hidden = Boolean(room);
    find('[data-join]').hidden = Boolean(room);

    const readyBtn = find('[data-ready]');
    readyBtn.hidden = !room;
    readyBtn.textContent = own?.ready ? t('Cancel Ready', '取消准备') : t('Ready', '准备');
    readyBtn.disabled = busy || !room || room.phase === 'started';

    const startBtn = find('[data-start]');
    startBtn.hidden = !(room && isHost);
    startBtn.textContent = room?.phase === 'started' ? t('Match Live', '战斗进行中') : room?.phase === 'countdown' ? t('Starting…', '即将开始…') : t('Start Match', '开始游戏');
    startBtn.disabled = busy || !room || room.phase !== 'lobby' || room.players.length < 2 || room.players.some(p => !p.ready || !p.connected);

    const rematchBtn = find('[data-rematch]');
    rematchBtn.hidden = !(room && isHost && room.phase === 'started');
    rematchBtn.textContent = t('Return to Lobby', '结束并返回大厅');
    rematchBtn.disabled = busy;

    find('[data-share]').hidden = !room;
    find('[data-share]').textContent = t('Copy Invite', '邀请好友');
    find('[data-leave]').hidden = !room;
    find('[data-leave]').textContent = t('Leave Room', '离开房间');
    find('[data-status]').textContent = status ? t(...status) : '';
    renderCountdown();
  }

  async function request(path, method = 'GET', body) {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (seat) headers.Authorization = 'Bearer ' + seat.token;
    let response;
    try {
      response = await fetch('/api/lan/rooms' + path, {
        method, headers, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store',
        signal: AbortSignal.timeout(4000),
      });
      if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('offline');
    } catch {
      throw new Error('offline');
    }
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? 'offline');
    return result;
  }

  function schedule() { clearTimeout(timer); if (seat) timer = setTimeout(poll, 1000); }

  async function poll() {
    if (!seat || busy) return;
    const current = seat;
    const pendingGeneration = generation;
    try {
      const next = await request('/' + encodeURIComponent(current.code));
      if (current !== seat || pendingGeneration !== generation) return;
      acceptRoom(next.room);
      if (status === errors.offline) status = null;
    } catch (error) {
      if (current !== seat || pendingGeneration !== generation) return;
      status = errors[error.message] ?? errors.offline;
      if (error.message === 'invalid_token' || error.message === 'room_not_found') {
        acceptRoom(null);
        remember(null);
      }
    } finally {
      if (pendingGeneration === generation) { render(); schedule(); }
    }
  }

  async function action(run) {
    if (busy) return;
    busy = true;
    generation++;
    clearTimeout(timer);
    status = null;
    render();
    try { await run(); } catch (error) { status = errors[error.message] ?? errors.offline; }
    finally { busy = false; render(); schedule(); }
  }

  function enter(join) {
    const tokenCode = code.value.trim().toUpperCase();
    return action(async () => {
      if (join && !/^[A-F0-9]{6}$/.test(tokenCode)) throw new Error('room_not_found');
      const role = localStorage.getItem('saltline-class') || 'medic';
      const body = join
        ? { name: name.value.trim(), role, protocolVersion: PROTOCOL_VERSION }
        : {
          name: name.value.trim(), role, protocolVersion: PROTOCOL_VERSION,
          maxPlayers: Number(maxSel.value) || 8,
          settings: collectSettings(),
        };
      const next = await request(join ? '/' + encodeURIComponent(tokenCode) + '/join' : '', 'POST', body);
      launchedRoomCode = null;
      acceptRoom(next.room);
      remember({ code: room.code, token: next.token });
    });
  }

  function change(operation, body) {
    return action(async () => {
      const next = await request('/' + encodeURIComponent(room.code) + '/' + operation, 'POST', body);
      acceptRoom(next.room);
    });
  }

  find('[data-create]').addEventListener('click', () => enter(false));
  find('[data-join]').addEventListener('click', () => enter(true));
  find('[data-ready]').addEventListener('click', () => change('ready', { ready: !room.players.find(p => p.id === room.yourId)?.ready }));
  find('[data-start]').addEventListener('click', () => change('start'));
  find('[data-rematch]').addEventListener('click', () => change('rematch'));
  find('[data-leave]').addEventListener('click', () => action(async () => {
    await request('/' + encodeURIComponent(room.code) + '/leave', 'POST');
    launchedRoomCode = null;
    acceptRoom(null);
    remember(null);
    document.dispatchEvent(new CustomEvent('saltline:lan-leave'));
  }));
  find('[data-share]').addEventListener('click', async () => {
    const link = new URL('./', location.href);
    link.searchParams.set('room', room.code);
    try { await navigator.clipboard.writeText(link.href); status = ['Room link copied.', '房间邀请链接已复制。']; }
    catch { status = [link.href, link.href]; }
    render();
  });
  find('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => clearTimeout(countdownTimer));
  document.addEventListener('click', event => {
    if (event.target.closest?.('#port-lan-open') && !dialog.open) { dialog.showModal(); render(); }
  });
  document.addEventListener('saltline:lan-rematch', () => {
    launchedRoomCode = null;
    if (!dialog.open) { dialog.showModal(); render(); }
  });
  window.addEventListener('keydown', event => {
    if (!dialog.open) return;
    event.stopImmediatePropagation();
    if (event.code === 'Escape') { event.preventDefault(); dialog.close(); }
  }, true);
  document.addEventListener('saltline:localechange', render);
  if (codeFromLink && !new URL(location.href).searchParams.has('autostart')) { dialog.showModal(); render(); }
  if (seat) poll();
})();
