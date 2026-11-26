const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const net = require('node:net');
const crypto = require('node:crypto');
const { createLanServer, createWsParser, encodeWsFrame } = require('../server/lan.cjs');

function apiRequest(port, method, reqPath, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { Accept: 'application/json' };
    if (data) { headers['Content-Type'] = 'application/json'; headers['Content-Length'] = Buffer.byteLength(data); }
    if (token) headers.Authorization = 'Bearer ' + token;
    const req = http.request({ hostname: '127.0.0.1', port, path: reqPath, method, headers }, res => {
      let raw = '';
      res.on('data', c => { raw += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, json: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function connectWs(port, roomCode, token) {
  return new Promise((resolve, reject) => {
    const key = crypto.randomBytes(16).toString('base64');
    const socket = net.createConnection({ host: '127.0.0.1', port }, () => {
      socket.write(
        `GET /api/lan/ws?room=${encodeURIComponent(roomCode)}&token=${encodeURIComponent(token)} HTTP/1.1\r\n` +
        `Host: 127.0.0.1:${port}\r\n` +
        `Upgrade: websocket\r\n` +
        `Connection: Upgrade\r\n` +
        `Sec-WebSocket-Key: ${key}\r\n` +
        `Sec-WebSocket-Version: 13\r\n\r\n`
      );
    });
    const messages = [];
    let upgraded = false;
    let headBuf = Buffer.alloc(0);
    const parser = createWsParser(text => {
      try { messages.push(JSON.parse(text)); } catch {}
    }, () => {});
    socket.on('data', chunk => {
      if (!upgraded) {
        headBuf = Buffer.concat([headBuf, chunk]);
        const idx = headBuf.indexOf('\r\n\r\n');
        if (idx === -1) return;
        const head = headBuf.subarray(0, idx).toString('utf8');
        if (!head.startsWith('HTTP/1.1 101')) return reject(new Error('WS upgrade failed: ' + head));
        upgraded = true;
        const rest = headBuf.subarray(idx + 4);
        if (rest.length) parser(rest);
        resolve({
          socket,
          messages,
          send(obj) {
            // Client-to-server RFC 6455 masked frame
            const payload = Buffer.from(JSON.stringify(obj), 'utf8');
            const mask = crypto.randomBytes(4);
            const masked = Buffer.alloc(payload.length);
            for (let i = 0; i < payload.length; i++) masked[i] = payload[i] ^ mask[i & 3];
            let hdr;
            if (payload.length < 126) hdr = Buffer.from([0x81, 0x80 | payload.length]);
            else { hdr = Buffer.alloc(4); hdr[0] = 0x81; hdr[1] = 0x80 | 126; hdr.writeUInt16BE(payload.length, 2); }
            socket.write(Buffer.concat([hdr, mask, masked]));
          },
          close() { try { socket.destroy(); } catch {} },
        });
      } else {
        parser(chunk);
      }
    });
    socket.on('error', reject);
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

test('Authoritative LAN Server E2E: protocol check, 5 maps, coop_rescue mode, dual-client sync, mid-join, host migration & rematch', async () => {
  let now = 1_000_000;
  const server = createLanServer({ clock: () => now, enableTick: true });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  const wsClients = [];

  try {
    // 1. Status exposes protocolVersion=2, 5 maps, 3 modes
    const st = await apiRequest(port, 'GET', '/api/lan/status');
    assert.equal(st.status, 200);
    assert.equal(st.json.protocolVersion, 2);
    assert.equal(st.json.maps.length, 5);
    assert.deepEqual(st.json.modes, ['conquest', 'breakthrough', 'coop_rescue']);

    // 2. Reject wrong protocol version
    const badProto = await apiRequest(port, 'POST', '/api/lan/rooms', { name: 'OldClient', protocolVersion: 1 });
    assert.equal(badProto.status, 426);
    assert.equal(badProto.json.error, 'protocol_mismatch');

    // 3. Host creates coop_rescue room on mountain_forest
    const p1 = await apiRequest(port, 'POST', '/api/lan/rooms', {
      name: 'AlphaHost',
      protocolVersion: 2,
      maxPlayers: 8,
      settings: { mapId: 'mountain_forest', mode: 'coop_rescue', difficulty: 'hard', allowMidJoin: true },
    });
    assert.equal(p1.status, 201);
    const code = p1.json.room.code;
    assert.equal(p1.json.room.settings.mapId, 'mountain_forest');
    assert.equal(p1.json.room.settings.mode, 'coop_rescue');
    assert.equal(p1.json.room.settings.joinTeam, 'blue');

    // 4. Player 2 joins, both ready, host starts countdown -> started
    const p2 = await apiRequest(port, 'POST', `/api/lan/rooms/${code}/join`, { name: 'BravoMate', protocolVersion: 2 });
    assert.equal(p2.status, 201);
    await apiRequest(port, 'POST', `/api/lan/rooms/${code}/ready`, { ready: true }, p1.json.token);
    await apiRequest(port, 'POST', `/api/lan/rooms/${code}/ready`, { ready: true }, p2.json.token);
    const startRes = await apiRequest(port, 'POST', `/api/lan/rooms/${code}/start`, {}, p1.json.token);
    assert.equal(startRes.json.room.phase, 'countdown');

    now += 3100; // Advance past 3s countdown
    const liveRes = await apiRequest(port, 'GET', `/api/lan/rooms/${code}`, null, p1.json.token);
    assert.equal(liveRes.json.room.phase, 'started');

    // 5. Dual-client real WebSocket 20Hz position sync
    const ws1 = await connectWs(port, code, p1.json.token);
    const ws2 = await connectWs(port, code, p2.json.token);
    wsClients.push(ws1, ws2);

    ws1.send({ type: 'state', state: { pos: [-26.5, 0.2, -55.0], yaw: 1.25, hp: 92, alive: true } });
    await sleep(140);
    const snap2 = ws2.messages.filter(m => m.type === 'snapshot').pop();
    assert.ok(snap2, 'Player 2 must receive live 20Hz snapshot');
    const syncedHost = snap2.players.find(pl => pl.id === p1.json.room.yourId);
    assert.ok(syncedHost && Math.abs(syncedHost.state.pos[0] - (-26.5)) < 0.01, 'Host position synced to Player 2');

    // 6. Mid-match join by Player 3
    const p3 = await apiRequest(port, 'POST', `/api/lan/rooms/${code}/join`, { name: 'CharlieMidJoin', protocolVersion: 2 });
    assert.equal(p3.status, 201, 'Mid-match join must succeed when allowMidJoin=true');
    assert.equal(p3.json.room.phase, 'started');

    // 7. Host leaves -> automatic host migration to BravoMate
    await apiRequest(port, 'POST', `/api/lan/rooms/${code}/leave`, {}, p1.json.token);
    const afterMig = await apiRequest(port, 'GET', `/api/lan/rooms/${code}`, null, p2.json.token);
    assert.equal(afterMig.json.room.hostId, p2.json.room.yourId, 'Host authority must migrate to BravoMate');

    // 8. New host triggers rematch -> returns cleanly to lobby for consecutive match
    const rematchRes = await apiRequest(port, 'POST', `/api/lan/rooms/${code}/rematch`, {}, p2.json.token);
    assert.equal(rematchRes.status, 200);
    assert.equal(rematchRes.json.room.phase, 'lobby');
    assert.ok(rematchRes.json.room.players.every(pl => pl.ready === false));
  } finally {
    for (const c of wsClients) c.close();
    await new Promise(r => server.close(r));
  }
});

test('Authoritative LAN Server 8-player concurrent WebSocket stress test', async () => {
  const server = createLanServer({ enableTick: true });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  const sockets = [];
  try {
    const host = await apiRequest(port, 'POST', '/api/lan/rooms', {
      name: 'StressHost', protocolVersion: 2, maxPlayers: 8,
      settings: { mapId: 'coastal_quarter', mode: 'conquest', joinTeam: 'alternate' },
    });
    const code = host.json.room.code;
    const tokens = [host.json.token];
    for (let i = 2; i <= 8; i++) {
      const joined = await apiRequest(port, 'POST', `/api/lan/rooms/${code}/join`, { name: `Player${i}`, protocolVersion: 2 });
      assert.equal(joined.status, 201);
      tokens.push(joined.json.token);
    }
    for (const tok of tokens) sockets.push(await connectWs(port, code, tok));
    for (let i = 0; i < sockets.length; i++) {
      sockets[i].send({ type: 'state', state: { pos: [-26 + i * 2, 0.2, -40 - i * 3], yaw: i * 0.4, hp: 100, alive: true } });
    }
    await sleep(220);
    for (let i = 0; i < sockets.length; i++) {
      const snaps = sockets[i].messages.filter(m => m.type === 'snapshot');
      assert.ok(snaps.length >= 2, `Player ${i + 1} should receive >=2 snapshots in 220ms`);
      assert.equal(snaps[snaps.length - 1].players.length, 8, 'All 8 players present in snapshot');
    }
  } finally {
    for (const s of sockets) s.close();
    await new Promise(r => server.close(r));
  }
});
