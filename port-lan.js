(() => {
  const t = (en, zh) => window.SaltlineLocale?.t(en, zh) ?? en;
  const key = 'saltline.lan.seat';
  const errors = {
    invalid_name: ['Enter a name of 1–24 characters.', '请输入 1–24 个字符的名字。'],
    room_not_found: ['Room not found or expired.', '房间不存在或已过期。'],
    room_full: ['The room is full.', '房间已满。'],
    room_countdown: ['The roster countdown is in progress.', '阵容锁定倒计时正在进行。'],
    room_started: ['The roster is locked.', '该房间已锁定阵容。'],
    invalid_token: ['Your seat has expired.', '你的席位已过期。'],
    host_only: ['Only the host can lock the roster.', '只有房主可以执行此操作。'],
    players_not_ready: ['All players must be connected and ready, with at least two players.', '至少需要两人，且所有成员都在线并已准备。'],
    room_limit: ['The server has reached its room limit.', '服务器已达到房间上限。'],
    offline: ['Open Saltline from the LAN server address to create or join a room.', '请从局域网服务地址打开 Saltline，再创建或加入房间。'],
  };

  const dialog = document.createElement('dialog');
  dialog.className = 'developer-menu port-lan';
  dialog.setAttribute('aria-labelledby', 'port-lan-title');
  dialog.innerHTML = `
    <header><h2 id="port-lan-title"></h2><button type="button" data-close></button></header>
    <section data-entry>
      <label><span data-name-label></span><input name="name" autocomplete="nickname" maxlength="24"></label>
      <label><span data-code-label></span><input name="code" autocomplete="off" maxlength="120" spellcheck="false"></label>
      <fieldset class="port-battle-settings" data-lan-settings style="margin:.6rem 0">
        <label><span data-mode-label></span><select name="mode"><option value="conquest"></option><option value="breakthrough"></option></select></label>
        <label><span data-max-label></span><select name="maxPlayers"><option value="4">4</option><option value="8">8</option></select></label>
        <label><span data-team-mode-label></span><select name="joinTeam"><option value="blue"></option><option value="alternate"></option><option value="red"></option></select></label>
        <label><span data-ai-label></span><select name="aiEnabled"><option value="true"></option><option value="false"></option></select></label>
      </fieldset>
      <div class="developer-actions"><button type="button" data-create></button><button type="button" data-join></button></div>
    </section>
    <section data-lobby hidden>
      <h3 data-room></h3>
      <p data-room-meta style="font-size:12px;opacity:.8;margin:.2rem 0 .6rem"></p>
      <ul data-players></ul>
      <p role="status" data-countdown hidden></p>
      <div class="developer-actions">
        <button type="button" data-ready></button><button type="button" data-start></button>
        <button type="button" data-share></button><button type="button" data-leave></button>
      </div>
    </section>
    <p data-explanation></p><p role="status" data-status></p>`;
  document.getElementById('app').append(dialog);

  const find = selector => dialog.querySelector(selector);
  const name = find('input[name="name"]');
  const code = find('input[name="code"]');
  const modeSel = find('select[name="mode"]');
  const maxSel = find('select[name="maxPlayers"]');
  const teamSel = find('select[name="joinTeam"]');
  const aiSel = find('select[name="aiEnabled"]');
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

  // Support pasting a full share URL directly into the room code field (IRONFRONT UX)
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

  try {
    const saved = JSON.parse(sessionStorage.getItem(key));
    if (saved && typeof saved.token === 'string' && /^[a-f0-9]{6}$/i.test(saved.code)) seat = saved;
  } catch { /* A private browsing context can deny storage. */ }

  function remember(next) {
    seat = next;
    try {
      if (seat) sessionStorage.setItem(key, JSON.stringify(seat));
      else sessionStorage.removeItem(key);
    } catch { /* The seat remains available while this page is open. */ }
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
        settings: room.settings ?? { mode: 'conquest', difficulty: 'normal', startingTickets: 40, duration: 240, aiEnabled: true },
        origin: location.origin,
      },
    }));
  }

  function acceptRoom(next) {
    countdownCancelled = next?.phase === 'lobby' &&
      (room?.phase === 'countdown' || countdownCancelled);
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
    find('h2').textContent = t('LAN Multiplayer Room (IRONFRONT Sync)', '局域网联机房间（实时同步）');
    find('[data-close]').textContent = t('Close', '关闭');
    find('[data-name-label]').textContent = t('Player name', '玩家名字');
    find('[data-code-label]').textContent = t('Room code or share link', '房间码或分享链接');
    find('[data-mode-label]').textContent = t('Mode', '玩法模式');
    modeSel.options[0].textContent = t('Port Conquest', '港口征服');
    modeSel.options[1].textContent = t('Port Breakthrough', '港口突破');
    find('[data-max-label]').textContent = t('Slots', '人数上限');
    find('[data-team-mode-label]').textContent = t('Join team', '加入阵营');
    teamSel.options[0].textContent = t('Co-op (Blue)', '合作（全蓝方）');
    teamSel.options[1].textContent = t('Versus (Alternate)', '对抗（自动分队）');
    teamSel.options[2].textContent = t('Red side', '红方');
    find('[data-ai-label]').textContent = t('AI units', 'AI 单位');
    aiSel.options[0].textContent = t('Enabled', '开启 AI');
    aiSel.options[1].textContent = t('PvP only', '关闭 AI（纯真人）');
    find('[data-create]').textContent = t('Create room', '创建房间');
    find('[data-join]').textContent = t('Join room', '加入房间');
    find('[data-lobby]').hidden = !room;
    find('[data-entry]').hidden = Boolean(room);
    find('[data-explanation]').textContent = t(
      'Up to 8 players over LAN with real-time movement, combat, squad AI, vehicles, and 30s reconnect reservation.',
      '支持最多 8 人局域网实时联机：位置与射击同步、双阵营切换、友军小队与载具协同，掉线保留席位 30 秒。');
    find('[data-status]').textContent = status ? t(...status) : '';
    for (const btn of dialog.querySelectorAll('[data-create], [data-join], [data-leave]')) btn.disabled = busy;
    renderCountdown();
    if (!room) return;
    find('[data-room]').textContent = t('Room ', '房间 ') + room.code + ` (${room.players.length}/${room.maxPlayers ?? 4})`;
    const s = room.settings;
    find('[data-room-meta]').textContent = s
      ? t(
        `${s.mode === 'breakthrough' ? 'Breakthrough' : 'Conquest'} · ${s.startingTickets} tickets · AI ${s.aiEnabled ? 'On' : 'Off'}`,
        `${s.mode === 'breakthrough' ? '港口突破' : '港口征服'} · ${s.startingTickets} 票 · AI ${s.aiEnabled ? '开启' : '关闭'}`
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
        const role = player.id === room.hostId ? t('Host', '房主') : t('Player', '队员');
        const team = player.team === 'red' ? t('Red', '红方') : t('Blue', '蓝方');
        const state = !player.connected ? t('Reconnecting', '重连中') : player.ready ? t('Ready', '已准备') : t('Waiting', '待准备');
        const span = document.createElement('span');
        span.textContent = `${player.name} · [${team}] · ${role} · ${state} `;
        row.append(span);
        if (isHost && room.phase === 'lobby') {
          const swap = document.createElement('button');
          swap.type = 'button';
          swap.style.cssText = 'margin-left:6px;padding:1px 6px;font-size:11px;cursor:pointer;';
          swap.textContent = t('Switch team', '换边');
          swap.addEventListener('click', () => change('team', {
            playerId: player.id,
            team: player.team === 'red' ? 'blue' : 'red',
          }));
          row.append(swap);
        }
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
    find('[data-share]').textContent = t('Share room link', '分享房间链接');
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
        ? { name: name.value.trim(), role }
        : {
          name: name.value.trim(),
          role,
          maxPlayers: Number(maxSel.value) || 8,
          settings: {
            mode: modeSel.value,
            joinTeam: teamSel.value,
            aiEnabled: aiSel.value !== 'false',
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
      status = ['Room link copied.', '房间链接已复制。'];
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
