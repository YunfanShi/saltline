(() => {
  const t = (en, zh) => window.SaltlineLocale?.t(en, zh) ?? en;
  const key = 'saltline.lan.seat';
  const errors = {
    invalid_name: ['Enter a name of 1–24 characters.', '请输入 1–24 个字符的名字。'],
    room_not_found: ['Room not found or expired.', '房间不存在或已过期。'],
    room_full: ['The room is full.', '房间已满。'],
    room_started: ['The roster is locked.', '该房间已锁定阵容。'],
    invalid_token: ['Your seat has expired.', '你的席位已过期。'],
    host_only: ['Only the host can lock the roster.', '只有房主可以锁定阵容。'],
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
      <label><span data-code-label></span><input name="code" autocomplete="off" maxlength="6" spellcheck="false"></label>
      <div class="developer-actions"><button type="button" data-create></button><button type="button" data-join></button></div>
    </section>
    <section data-lobby hidden>
      <h3 data-room></h3>
      <ul data-players></ul>
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
  const codeFromLink = new URL(location.href).searchParams.get('room');
  code.value = codeFromLink ?? '';
  let seat = null;
  let room = null;
  let busy = false;
  let generation = 0;
  let timer;
  let status = null;

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

  function render() {
    find('h2').textContent = t('LAN staging room', '局域网准备室');
    find('[data-close]').textContent = t('Close', '关闭');
    find('[data-name-label]').textContent = t('Player name', '玩家名字');
    find('[data-code-label]').textContent = t('Room code', '房间码');
    find('[data-create]').textContent = t('Create room', '创建房间');
    find('[data-join]').textContent = t('Join room', '加入房间');
    find('[data-lobby]').hidden = !room;
    find('[data-entry]').hidden = Boolean(room);
    find('[data-explanation]').textContent = t(
      'This preview supports lobby setup. Cooperative missions are still in development.',
      '当前预览支持组队与准备。合作战役仍在开发中。');
    find('[data-status]').textContent = status ? t(...status) : '';
    for (const btn of dialog.querySelectorAll('[data-create], [data-join], [data-leave]')) btn.disabled = busy;
    if (!room) return;
    find('[data-room]').textContent = t('Room ', '房间 ') + room.code;
    const roster = find('[data-players]');
    const own = room.players.find(player => player.id === room.yourId);
    const players = room.players.map(player => {
      const role = player.id === room.hostId ? t('Host', '房主') : t('Player', '队员');
      const state = !player.connected ? t('Reconnecting', '重连中') : player.ready ? t('Ready', '已准备') : t('Waiting', '待准备');
      return player.name + ' · ' + role + ' · ' + state;
    });
    if (JSON.stringify(players) !== roster.dataset.rendered) {
      roster.dataset.rendered = JSON.stringify(players);
      roster.replaceChildren(...players.map(label => {
        const row = document.createElement('li');
        row.textContent = label;
        return row;
      }));
    }
    const ready = find('[data-ready]');
    ready.textContent = own?.ready ? t('Cancel ready', '取消准备') : t('Ready', '准备');
    ready.disabled = busy || room.phase === 'started';
    const start = find('[data-start]');
    start.textContent = room.phase === 'started' ? t('Roster locked', '阵容已锁定') : t('Lock roster', '锁定阵容');
    start.hidden = room.hostId !== room.yourId;
    start.disabled = busy || room.phase === 'started' || room.players.length < 2 ||
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
      room = next.room;
      if (status === errors.offline) status = null;
    } catch (error) {
      if (current !== seat || pendingGeneration !== generation) return;
      status = errors[error.message] ?? errors.offline;
      if (error.message === 'invalid_token' || error.message === 'room_not_found') {
        room = null;
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
      const next = await request(join ? '/' + encodeURIComponent(tokenCode) + '/join' : '', 'POST', { name: name.value.trim() });
      room = next.room;
      remember({ code: room.code, token: next.token });
    });
  }

  function change(operation, body) {
    return action(async () => {
      const next = await request('/' + encodeURIComponent(room.code) + '/' + operation, 'POST', body);
      room = next.room;
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
    room = null;
    remember(null);
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
  document.addEventListener('click', event => {
    if (event.target.closest?.('#port-lan-open') && !dialog.open) {
      render();
      dialog.showModal();
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
    render();
    dialog.showModal();
  }
  if (seat) poll();
})();
