(() => {
  const t = (en, zh) => window.SaltlineLocale?.t(en, zh) ?? en;
  const PROTOCOL_VERSION = 2;
  const key = 'saltline.lan.seat';
  const MAPS = [
    { id: 'coastal_quarter', zh: '沿海城区 · 警务04号站', en: 'Coastal Quarter', descZh: '城市主干道、可进入警务调度楼与滨海商业长廊，适合中近距离巷战与协同攻防。', descEn: 'Downtown boulevard, enterable Precinct 04 & waterfront promenade.', accent: '#38bdf8', svg: '<rect x="10" y="14" width="38" height="22" rx="2" fill="#2c4252"/><rect x="56" y="12" width="34" height="26" rx="2" fill="#3a4c59"/><rect x="10" y="44" width="38" height="26" rx="2" fill="#354652"/><rect x="56" y="46" width="34" height="24" rx="2" fill="#2b3f4e"/><line x1="52" y1="6" x2="52" y2="74" stroke="#facc15" stroke-width="2" stroke-dasharray="4 3"/><rect x="96" y="6" width="18" height="68" fill="#0f3c5c" opacity=".8"/>' },
    { id: 'port_rail', zh: '四号泊位 · 西区铁路货场', en: 'Port & Rail Yard', descZh: '集装箱堆场、动态货运列车与高架龙门吊，兼顾远程狙击与载具机动。', descEn: 'Container stacks, live freight railway & gantry cranes.', accent: '#f59e0b', svg: '<rect x="12" y="16" width="24" height="10" fill="#9a3412"/><rect x="12" y="32" width="24" height="10" fill="#0f766e"/><rect x="12" y="48" width="24" height="10" fill="#1d4ed8"/><line x1="48" y1="6" x2="48" y2="74" stroke="#94a3b8" stroke-width="3"/><line x1="56" y1="6" x2="56" y2="74" stroke="#94a3b8" stroke-width="3"/><rect x="45" y="22" width="14" height="28" rx="2" fill="#ef4444"/><rect x="74" y="12" width="34" height="56" fill="#0f3c5c" opacity=".75"/>' },
    { id: 'mountain_forest', zh: '西岸山地 · 海岸松林与卫星站', en: 'Mountain Ridge & Forest', descZh: '+14m 盘山公路与制高点雷达站，适合高低差伏击与四驱车突袭。', descEn: '+14m coastal ridge road, pine forest & summit radar.', accent: '#34d399', svg: '<path d="M6 68 Q34 18 66 36 T114 20 L114 74 L6 74 Z" fill="#1e3a2f"/><circle cx="48" cy="30" r="9" fill="#334155" stroke="#34d399" stroke-width="2"/><path d="M12 66 Q44 54 78 44" fill="none" stroke="#cbd5e1" stroke-width="2.5" stroke-dasharray="4 2"/>' },
    { id: 'old_harbor', zh: '南港旧船坞 · 防潮闸与灯塔', en: 'South Drydock & Tide Gate', descZh: '22m 岸角灯塔、防潮大闸双塔与干船坞地形，极具纵深攻防张力。', descEn: '22m headland lighthouse, tide gate & drydock basin.', accent: '#60a5fa', svg: '<rect x="14" y="28" width="18" height="24" fill="#475569"/><rect x="64" y="28" width="18" height="24" fill="#475569"/><rect x="14" y="35" width="68" height="8" fill="#cbd5e1"/><circle cx="96" cy="56" r="10" fill="#f59e0b" opacity=".85"/><circle cx="96" cy="56" r="4" fill="#fff"/>' },
    { id: 'coastal_industrial', zh: '西南冷雾库 · 海岸工业区', en: 'Coastal Industrial Zone', descZh: '低温储罐群、高架管廊与战地分诊中心，适合小队协同与合作搜救。', descEn: 'Cryo tank clusters, overhead pipelines & field clinic.', accent: '#fb7185', svg: '<circle cx="26" cy="28" r="10" fill="#64748b"/><circle cx="52" cy="28" r="10" fill="#64748b"/><circle cx="78" cy="28" r="10" fill="#64748b"/><line x1="16" y1="54" x2="104" y2="54" stroke="#f59e0b" stroke-width="4"/><rect x="34" y="46" width="40" height="20" rx="2" fill="#334155"/>' },
  ];

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
      .port-lan{width:min(760px,94vw);max-height:90vh;background:linear-gradient(160deg,#0b131b 0%,#121e2b 100%);color:#e8f1f8;border:1px solid rgba(110,185,235,.28);border-radius:10px;padding:18px 20px;box-shadow:0 24px 64px rgba(0,0,0,.65)}
      .port-lan::backdrop{background:rgba(4,9,14,.74);backdrop-filter:blur(4px)}
      .port-lan-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:14px;margin-top:10px}
      @media(max-width:680px){.port-lan-grid{grid-template-columns:1fr}}
      .port-lan-card{background:rgba(15,27,39,.78);border:1px solid rgba(130,190,235,.18);border-radius:8px;padding:12px}
      .port-lan-preview{display:flex;flex-direction:column;gap:8px}
      .port-lan-preview svg{width:100%;height:96px;background:#0a1520;border:1px solid rgba(255,255,255,.1);border-radius:6px}
      .port-lan-badge{display:inline-flex;align-items:center;gap:6px;font:700 11px/1 system-ui,sans-serif;padding:3px 8px;border-radius:99px;background:rgba(56,189,248,.16);color:#7dd3fc;letter-spacing:.04em}
      .port-lan-roster{list-style:none;margin:8px 0;padding:0;display:flex;flex-direction:column;gap:6px;max-height:210px;overflow:auto}
      .port-lan-roster li{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 10px;border-radius:6px;background:rgba(255,255,255,.04);border-left:3px solid #38bdf8;font-size:12.5px}
      .port-lan-roster li.team-red{border-left-color:#f87171}
      .port-lan-pill{font-size:11px;padding:2px 7px;border-radius:99px;background:rgba(255,255,255,.08)}
      .port-lan-pill.ready{background:rgba(52,211,153,.2);color:#6ee7b7}
      .port-lan-pill.off{background:rgba(248,113,113,.2);color:#fca5a5}
    `;
    document.head.appendChild(st);
  }

  const dialog = document.createElement('dialog');
  dialog.className = 'developer-menu port-lan';
  dialog.setAttribute('aria-labelledby', 'port-lan-title');
  dialog.innerHTML = `
    <header style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:8px">
      <div style="display:flex;align-items:center;gap:10px">
        <h2 id="port-lan-title" style="margin:0;font-size:16px"></h2>
        <span class="port-lan-badge">PROTO v${PROTOCOL_VERSION} · 20Hz</span>
      </div>
      <button type="button" data-close></button>
    </header>
    <section data-entry>
      <div class="port-lan-grid">
        <div class="port-lan-card">
          <label><span data-name-label></span><input name="name" autocomplete="nickname" maxlength="24"></label>
          <label><span data-code-label></span><input name="code" autocomplete="off" maxlength="120" spellcheck="false"></label>
          <fieldset class="port-battle-settings" data-lan-settings style="margin:.6rem 0;display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <label><span data-map-label></span><select name="mapId"></select></label>
            <label><span data-mode-label></span><select name="mode"><option value="conquest"></option><option value="breakthrough"></option><option value="coop_rescue"></option><option value="coop_campaign"></option><option value="sandbox"></option></select></label>
            <label><span data-diff-label></span><select name="difficulty"><option value="easy"></option><option value="normal" selected></option><option value="hard"></option></select></label>
            <label><span data-tickets-label></span><select name="startingTickets"><option value="25">25</option><option value="40" selected>40</option><option value="70">70</option></select></label>
            <label><span data-max-label></span><select name="maxPlayers"><option value="4">4</option><option value="8" selected>8</option></select></label>
            <label><span data-team-mode-label></span><select name="joinTeam"><option value="blue"></option><option value="alternate"></option><option value="red"></option></select></label>
            <label><span data-ai-label></span><select name="aiEnabled"><option value="true"></option><option value="false"></option></select></label>
            <label><span data-midjoin-label></span><select name="allowMidJoin"><option value="true"></option><option value="false"></option></select></label>
          </fieldset>
          <div class="developer-actions" style="margin-top:8px"><button type="button" data-create></button><button type="button" data-join></button></div>
        </div>
        <div class="port-lan-card port-lan-preview" data-map-preview>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <strong data-preview-title style="font-size:13.5px"></strong>
            <span class="port-lan-badge" data-preview-mode></span>
          </div>
          <svg viewBox="0 0 120 80" data-preview-svg></svg>
          <p data-preview-desc style="margin:0;font-size:12px;opacity:.84;line-height:1.45"></p>
          <p data-explanation style="margin:4px 0 0;font-size:11.5px;opacity:.68;line-height:1.4"></p>
        </div>
      </div>
    </section>
    <section data-lobby hidden>
      <div class="port-lan-grid">
        <div class="port-lan-card">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <h3 data-room style="margin:0;font-size:15px"></h3>
            <span class="port-lan-badge" data-phase-badge></span>
          </div>
          <p data-room-meta style="font-size:12px;opacity:.82;margin:.35rem 0 .5rem"></p>
          <ul class="port-lan-roster" data-players></ul>
          <p role="status" data-countdown hidden style="font-weight:700;color:#fbbf24;margin:.4rem 0"></p>
          <div class="developer-actions" style="flex-wrap:wrap;gap:6px">
            <button type="button" data-ready></button>
            <button type="button" data-start></button>
            <button type="button" data-rematch hidden></button>
            <button type="button" data-share></button>
            <button type="button" data-leave></button>
          </div>
        </div>
        <div class="port-lan-card port-lan-preview">
          <strong data-lobby-map-title style="font-size:13.5px"></strong>
          <svg viewBox="0 0 120 80" data-lobby-map-svg></svg>
          <p data-lobby-map-desc style="margin:0;font-size:12px;opacity:.84;line-height:1.45"></p>
        </div>
      </div>
    </section>
    <p role="status" data-status style="margin:10px 0 0;font-size:12.5px;color:#7dd3fc"></p>`;
  document.getElementById('app').append(dialog);

  const find = selector => dialog.querySelector(selector);
  const name = find('input[name="name"]');
  const code = find('input[name="code"]');
  const mapSel = find('select[name="mapId"]');
  const modeSel = find('select[name="mode"]');
  const diffSel = find('select[name="difficulty"]');
  const ticketsSel = find('select[name="startingTickets"]');
  const maxSel = find('select[name="maxPlayers"]');
  const teamSel = find('select[name="joinTeam"]');
  const aiSel = find('select[name="aiEnabled"]');
  const midJoinSel = find('select[name="allowMidJoin"]');

  for (const m of MAPS) {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.zh;
    mapSel.appendChild(opt);
  }

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
  mapSel.addEventListener('change', () => render());
  modeSel.addEventListener('change', () => render());

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

  function modeLabel(mode) {
    if (mode === 'breakthrough') return t('Port Breakthrough', '港口突破');
    if (mode === 'coop_rescue') return t('Co-op Coastal Rescue', '合作海岸搜救');
    if (mode === 'coop_campaign') return t('Co-op Campaign (2-4P)', '合作战役（2-4人）');
    if (mode === 'sandbox') return t('Open World Sandbox', '开放世界自由沙盒');
    return t('Port Conquest', '港口征服');
  }

  function mapInfo(mapId) {
    return MAPS.find(m => m.id === mapId) || MAPS[0];
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
        settings: room.settings ?? { mode: 'conquest', mapId: 'coastal_quarter', difficulty: 'normal', startingTickets: 40, duration: 240, aiEnabled: true },
        origin: location.origin,
      },
    }));
  }

  function acceptRoom(next) {
    countdownCancelled = next?.phase === 'lobby' &&
      (room?.phase === 'countdown' || countdownCancelled);
    if (next?.phase === 'lobby' && room?.phase === 'started') launchedRoomCode = null;
    room = next;
    countdownEnd = performance.now() + (room?.countdownMs ?? 0);
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
    find('h2').textContent = t('SALTLINE Multiplayer Lobby', 'SALTLINE 战术联机大厅');
    find('[data-close]').textContent = t('Close', '关闭');
    find('[data-name-label]').textContent = t('Callsign', '玩家代号');
    find('[data-code-label]').textContent = t('Room code or link', '房间码 / 分享链接');
    find('[data-map-label]').textContent = t('Map', '地图');
    for (let i = 0; i < MAPS.length; i++) mapSel.options[i].textContent = t(MAPS[i].en, MAPS[i].zh);
    find('[data-mode-label]').textContent = t('Mode', '玩法模式');
    modeSel.options[0].textContent = modeLabel('conquest');
    modeSel.options[1].textContent = modeLabel('breakthrough');
    modeSel.options[2].textContent = modeLabel('coop_rescue');
    modeSel.options[3].textContent = modeLabel('coop_campaign');
    modeSel.options[4].textContent = modeLabel('sandbox');
    find('[data-diff-label]').textContent = t('Difficulty', '难度');
    diffSel.options[0].textContent = t('Easy', '标准');
    diffSel.options[1].textContent = t('Normal', '战术');
    diffSel.options[2].textContent = t('Hard', '精英');
    find('[data-tickets-label]').textContent = t('Tickets', '兵力票');
    find('[data-max-label]').textContent = t('Slots', '人数上限');
    find('[data-team-mode-label]').textContent = t('Join team', '加入阵营');
    teamSel.options[0].textContent = t('Co-op (Blue)', '合作（全蓝方）');
    teamSel.options[1].textContent = t('Versus (Alternate)', '对抗（自动分队）');
    teamSel.options[2].textContent = t('Red side', '红方');
    find('[data-ai-label]').textContent = t('AI units', 'AI 单位');
    aiSel.options[0].textContent = t('Enabled', '开启 AI');
    aiSel.options[1].textContent = t('PvP only', '关闭 AI（纯真人）');
    find('[data-midjoin-label]').textContent = t('Mid-join', '中途加入');
    midJoinSel.options[0].textContent = t('Allowed', '允许');
    midJoinSel.options[1].textContent = t('Locked', '锁定');

    const selMap = mapInfo(mapSel.value);
    find('[data-preview-title]').textContent = t(selMap.en, selMap.zh);
    find('[data-preview-mode]').textContent = modeLabel(modeSel.value);
    find('[data-preview-svg]').innerHTML = selMap.svg;
    find('[data-preview-desc]').textContent = t(selMap.descEn, selMap.descZh);

    find('[data-create]').textContent = t('Create room', '创建联机房间');
    find('[data-join]').textContent = t('Join room', '加入房间');
    find('[data-lobby]').hidden = !room;
    find('[data-entry]').hidden = Boolean(room);
    find('[data-explanation]').textContent = t(
      'Authoritative 20Hz LAN sync: up to 8 players, 5 Saltline maps, 3 modes, host migration & 30s reconnect reservation.',
      '权威 20Hz 局域网同步：支持 2–8 人、5 张地图、3 种模式、掉线 30 秒席位保留、房主自动移交与无缝下一局。');
    find('[data-status]').textContent = status ? t(...status) : '';
    for (const btn of dialog.querySelectorAll('[data-create], [data-join], [data-leave]')) btn.disabled = busy;
    renderCountdown();
    if (!room) return;

    const rMap = mapInfo(room.settings?.mapId);
    find('[data-lobby-map-title]').textContent = t(rMap.en, rMap.zh);
    find('[data-lobby-map-svg]').innerHTML = rMap.svg;
    find('[data-lobby-map-desc]').textContent = t(rMap.descEn, rMap.descZh);
    find('[data-room]').textContent = t('Room ', '房间 ') + room.code + ` (${room.players.length}/${room.maxPlayers ?? 8})`;
    find('[data-phase-badge]').textContent = room.phase === 'started' ? t('LIVE', '进行中') : room.phase === 'countdown' ? t('DEPLOYING', '倒计时') : t('LOBBY', '大厅准备');
    const s = room.settings;
    find('[data-room-meta]').textContent = s
      ? t(
        `${modeLabel(s.mode)} · ${s.difficulty.toUpperCase()} · ${s.startingTickets} tickets · AI ${s.aiEnabled ? 'On' : 'Off'}`,
        `${modeLabel(s.mode)} · ${s.difficulty === 'hard' ? '精英' : s.difficulty === 'easy' ? '标准' : '战术'} · ${s.startingTickets} 票 · AI ${s.aiEnabled ? '开启' : '关闭'}`
      )
      : '';
    const roster = find('[data-players]');
    const own = room.players.find(player => player.id === room.yourId);
    const isHost = room.hostId === room.yourId;
    const keyState = JSON.stringify({ players: room.players, hostId: room.hostId, phase: room.phase });
    if (keyState !== roster.dataset.rendered) {
      roster.dataset.rendered = keyState;
      roster.replaceChildren(...room.players.map(player => {
        const row = document.createElement('li');
        if (player.team === 'red') row.classList.add('team-red');
        const role = player.id === room.hostId ? t('👑 Host', '👑 房主') : t('Player', '队员');
        const team = player.team === 'red' ? t('Red', '红方') : t('Blue', '蓝方');
        const left = document.createElement('span');
        left.textContent = `${player.name} · ${team} · ${role}`;
        const right = document.createElement('div');
        right.style.cssText = 'display:flex;align-items:center;gap:6px';
        const pill = document.createElement('span');
        pill.className = 'port-lan-pill ' + (!player.connected ? 'off' : player.ready ? 'ready' : '');
        pill.textContent = !player.connected ? t('Reconnecting', '重连中') : player.ready ? t('Ready', '已准备') : t('Waiting', '待准备');
        right.append(pill);
        if (isHost && room.phase === 'lobby' && room.settings?.mode !== 'coop_rescue') {
          const swap = document.createElement('button');
          swap.type = 'button';
          swap.style.cssText = 'padding:2px 7px;font-size:11px;cursor:pointer;';
          swap.textContent = t('Swap', '换边');
          swap.addEventListener('click', () => change('team', {
            playerId: player.id,
            team: player.team === 'red' ? 'blue' : 'red',
          }));
          right.append(swap);
        }
        row.append(left, right);
        return row;
      }));
    }
    const ready = find('[data-ready]');
    ready.textContent = own?.ready ? t('Cancel ready', '取消准备') : t('Ready', '准备');
    ready.disabled = busy || room.phase === 'started';
    const start = find('[data-start]');
    start.textContent = room.phase === 'started' ? t('Match live', '战斗进行中') :
      room.phase === 'countdown' ? t('Starting…', '即将开始…') : t('Start match', '开始联机战斗');
    start.hidden = !isHost;
    start.disabled = busy || room.phase !== 'lobby' || room.players.length < 2 ||
      room.players.some(player => !player.ready || !player.connected);
    const rematch = find('[data-rematch]');
    rematch.hidden = !(isHost && room.phase === 'started');
    rematch.textContent = t('Return to lobby', '结束并返回大厅');
    rematch.disabled = busy;
    find('[data-share]').textContent = t('Copy invite link', '复制邀请链接');
    find('[data-leave]').textContent = t('Leave room', '离开房间');
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

  function schedule() {
    clearTimeout(timer);
    if (seat) timer = setTimeout(poll, 1000);
  }

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
      if (pendingGeneration === generation) {
        render();
        schedule();
      }
    }
  }

  async function action(run) {
    if (busy) return;
    busy = true;
    generation++;
    clearTimeout(timer);
    status = null;
    render();
    try {
      await run();
    } catch (error) {
      status = errors[error.message] ?? errors.offline;
    } finally {
      busy = false;
      render();
      schedule();
    }
  }

  function enter(join) {
    const tokenCode = code.value.trim().toUpperCase();
    return action(async () => {
      if (join && !/^[A-F0-9]{6}$/.test(tokenCode)) throw new Error('room_not_found');
      const role = localStorage.getItem('saltline-class') || 'medic';
      const body = join
        ? { name: name.value.trim(), role, protocolVersion: PROTOCOL_VERSION }
        : {
          name: name.value.trim(),
          role,
          protocolVersion: PROTOCOL_VERSION,
          maxPlayers: Number(maxSel.value) || 8,
          settings: {
            mapId: mapSel.value,
            mode: modeSel.value,
            difficulty: diffSel.value,
            startingTickets: Number(ticketsSel.value) || 40,
            joinTeam: teamSel.value,
            aiEnabled: aiSel.value !== 'false',
            allowMidJoin: midJoinSel.value !== 'false',
          },
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
  find('[data-ready]').addEventListener('click', () => change('ready', {
    ready: !room.players.find(player => player.id === room.yourId)?.ready,
  }));
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
    try {
      await navigator.clipboard.writeText(link.href);
      status = ['Room link copied.', '房间邀请链接已复制。'];
    } catch {
      status = [link.href, link.href];
    }
    render();
  });
  find('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => clearTimeout(countdownTimer));
  document.addEventListener('click', event => {
    if (event.target.closest?.('#port-lan-open') && !dialog.open) {
      dialog.showModal();
      render();
    }
  });
  window.addEventListener('keydown', event => {
    if (!dialog.open) return;
    event.stopImmediatePropagation();
    if (event.code === 'Escape') {
      event.preventDefault();
      dialog.close();
    }
  }, true);
  document.addEventListener('saltline:localechange', render);
  if (codeFromLink && !new URL(location.href).searchParams.has('autostart')) {
    dialog.showModal();
    render();
  }
  if (seat) poll();
})();
