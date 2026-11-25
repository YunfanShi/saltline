const { createHash, randomBytes, randomUUID } = require('node:crypto');
const { readFile } = require('node:fs/promises');
const { createServer } = require('node:http');
const { networkInterfaces } = require('node:os');
const path = require('node:path');

const DEFAULT_MAX_PLAYERS = 4;
const HARD_MAX_PLAYERS = 8;
const MIN_PLAYERS = 2;
const MAX_ROOMS = 32;
const HEARTBEAT_MS = 6000;
const RESERVATION_MS = 30_000;
const COUNTDOWN_MS = 3000;
const MAX_BODY_BYTES = 2048;
const WS_MAGIC = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const ROOT = path.resolve(__dirname, '..');
const ASSETS = new Set([
  'index.html', 'zh.js',
  'port-campaign.js', 'port-commander.js', 'port-conquest.js', 'port-rail-yard.js', 'port-expansion.js', 'port-campaign-events.js',
  'port-campaign-ui.js', 'port-campaign-ui.css', 'port-campaign-runtime.js',
  'port-campaign-continuation-layout.js', 'port-campaign-continuation.js',
  'port-prologue.js', 'port-prologue-layout.js', 'port-prologue-flight.js',
  'port-campaign-berth.js', 'port-campaign-rail.js',
  'port-lan.js', 'port-mp-squad.js', 'port-mp-gadgets.js', 'port-mp-sync.js',
  'port-loadout.js', 'port-loadout.css', 'port-sidearm.js',
  'port-operations.js', 'port-operations.css',
  'port-tactical-sandbox.js', 'port-chapter-architecture.js', 'port-cinematic-sequencer.js',
  'port-companion-ai.js', 'port-berth-vertical-slice.js',
  'WorldEngine/Materials/MaterialLibrary.js', 'WorldEngine/Assets/BuildingGenerator.js', 'WorldEngine/Assets/UrbanPlanningSystem.js',
  'WorldEngine/Assets/IndustrialGenerator.js', 'WorldEngine/Environment/AtmosphereSystem.js',
  'WorldEngine/Performance/ChunkManager.js',
  'WorldEngine/Terrain/TerrainGenerator.js', 'WorldEngine/Rendering/LightingSystem.js',
  'port-external-assets.js', 'port-open-world-district.js', 'port-drivable-vehicle.js', 'port-disaster-events.js',
  'developer-menu.js', 'developer-menu.css',
  'art/campaign-prologue.jpg', 'art/campaign-berth.jpg', 'art/campaign-rail.jpg', 'art/campaign-drydock.jpg', 'art/campaign-tidegate.jpg',
  'art/campaign-anchorage.jpg', 'art/campaign-return-harbor.jpg', 'art/campaign-night-record.jpg',
  'art/campaign-last-pilot.jpg', 'art/campaign-reopen.jpg',
  'art/port-conquest.jpg', 'art/port-breakthrough.jpg', 'art/port-lan.jpg',
]);
const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
};

const VALID_ROLES = new Set(['medic', 'support', 'recon', 'engineer', 'assault']);
const VALID_TEAMS = new Set(['blue', 'red']);

class RequestError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
  }
}

function json(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(data));
}

function lanAddresses(port) {
  const entries = Object.entries(networkInterfaces())
    .filter(([name]) => !/^(utun|tun|docker|veth|br-|bridge|tailscale|vmnet)/i.test(name))
    .flatMap(([, list]) => list || []);
  return [...new Set(
    entries.filter(n => n.family === 'IPv4' && !n.internal).map(n => `http://${n.address}:${port}`)
  )];
}

async function readJSON(request) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes <= MAX_BODY_BYTES) chunks.push(chunk);
  }
  if (bytes > MAX_BODY_BYTES) throw new RequestError(413, 'body_too_large');
  if (bytes === 0) return {};
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers['content-type'] ?? '')) {
    throw new RequestError(415, 'invalid_content_type');
  }
  let body;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new RequestError(400, 'bad_json');
  }
  if (!body || Array.isArray(body) || typeof body !== 'object') throw new RequestError(400, 'bad_json');
  return body;
}

function playerName(value) {
  const name = typeof value === 'string' ? value.trim() : '';
  if (!name || [...name].length > 24 || /[\p{Cc}\p{Bidi_Control}]/u.test(name)) {
    throw new RequestError(400, 'invalid_name');
  }
  return name;
}

function normalizeSettings(body = {}) {
  return {
    mode: body.mode === 'breakthrough' ? 'breakthrough' : 'conquest',
    difficulty: ['easy', 'normal', 'hard'].includes(body.difficulty) ? body.difficulty : 'normal',
    startingTickets: [25, 40, 70].includes(Number(body.startingTickets)) ? Number(body.startingTickets) : 40,
    duration: [180, 240, 360].includes(Number(body.duration)) ? Number(body.duration) : 240,
    aiEnabled: body.aiEnabled !== false,
    joinTeam: ['blue', 'red', 'alternate'].includes(body.joinTeam) ? body.joinTeam : 'blue',
  };
}

function assignTeam(room, isHost) {
  if (isHost) return 'blue';
  const mode = room.settings.joinTeam;
  if (mode === 'red') return 'red';
  if (mode === 'alternate') {
    let blue = 0, red = 0;
    for (const p of room.players.values()) {
      if (p.team === 'red') red++;
      else blue++;
    }
    return blue > red ? 'red' : 'blue';
  }
  return 'blue';
}

function addPlayer(room, name, now, role = 'medic') {
  const token = randomBytes(24).toString('hex');
  const isHost = !room.hostId;
  const team = assignTeam(room, isHost);
  const player = {
    id: randomUUID(),
    name,
    ready: false,
    lastSeen: now,
    team,
    role: VALID_ROLES.has(role) ? role : 'medic',
    state: {
      pos: [0, 0, 0],
      yaw: 0,
      pitch: 0,
      hp: 100,
      alive: true,
      downed: false,
      weapon: 'rifle',
      crouch: false,
      driving: false,
      kills: 0,
      deaths: 0,
      captures: 0,
    },
  };
  room.players.set(token, player);
  if (isHost) room.hostId = player.id;
  return { token, player };
}

function connected(player, now) {
  return now - player.lastSeen < HEARTBEAT_MS;
}

function migrateHost(room, now) {
  const players = [...room.players.values()];
  if (players.some(player => player.id === room.hostId)) return;
  room.hostId = (players.find(player => connected(player, now)) ?? players[0])?.id;
}

function readyToLock(room, now) {
  return room.players.size >= MIN_PLAYERS &&
    [...room.players.values()].every(member => member.ready && connected(member, now));
}

function advanceCountdown(room, now) {
  if (room.phase !== 'countdown') return;
  if (!readyToLock(room, Math.min(now, room.lockAt))) {
    room.phase = 'lobby';
    room.lockAt = null;
  } else if (now >= room.lockAt) {
    room.phase = 'started';
    room.lockAt = null;
  }
}

function snapshot(room, player, now) {
  return {
    code: room.code,
    phase: room.phase,
    countdownMs: room.phase === 'countdown' ? room.lockAt - now : null,
    hostId: room.hostId,
    yourId: player.id,
    maxPlayers: room.maxPlayers,
    settings: room.settings,
    players: [...room.players.values()].map(member => ({
      id: member.id,
      name: member.name,
      ready: member.ready,
      connected: connected(member, now),
      team: member.team,
      role: member.role,
    })),
  };
}

/** Minimal zero-dependency RFC 6455 WebSocket frame encoder & parser */
function encodeWsFrame(payloadText) {
  const data = Buffer.from(payloadText, 'utf8');
  const len = data.length;
  let header;
  if (len < 126) {
    header = Buffer.from([0x81, len]);
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, data]);
}

function createWsParser(onMessage, onClose) {
  let buffer = Buffer.alloc(0);
  return chunk => {
    buffer = Buffer.concat([buffer, chunk]);
    while (buffer.length >= 2) {
      const b0 = buffer[0];
      const b1 = buffer[1];
      const opcode = b0 & 0x0f;
      const masked = (b1 & 0x80) !== 0;
      let payloadLen = b1 & 0x7f;
      let offset = 2;
      if (payloadLen === 126) {
        if (buffer.length < 4) return;
        payloadLen = buffer.readUInt16BE(2);
        offset = 4;
      } else if (payloadLen === 127) {
        if (buffer.length < 10) return;
        payloadLen = Number(buffer.readBigUInt64BE(2));
        offset = 10;
      }
      if (payloadLen > 16384) {
        onClose();
        return;
      }
      const maskSize = masked ? 4 : 0;
      if (buffer.length < offset + maskSize + payloadLen) return;
      const mask = masked ? buffer.subarray(offset, offset + 4) : null;
      const payload = Buffer.from(buffer.subarray(offset + maskSize, offset + maskSize + payloadLen));
      if (mask) {
        for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3];
      }
      buffer = buffer.subarray(offset + maskSize + payloadLen);
      if (opcode === 0x8) {
        onClose();
        return;
      }
      if (opcode === 0x9) {
        // Ping -> ignore or let caller handle
        continue;
      }
      if (opcode === 0x1) {
        onMessage(payload.toString('utf8'));
      }
    }
  };
}

function createLanServer({ clock = Date.now, enableTick = true } = {}) {
  const rooms = new Map();

  function sweep(now) {
    for (const [code, room] of rooms) {
      advanceCountdown(room, now);
      for (const [token, player] of room.players) {
        if (now - player.lastSeen >= HEARTBEAT_MS + RESERVATION_MS) {
          room.players.delete(token);
          const sock = room.sockets.get(token);
          if (sock) {
            try { sock.destroy(); } catch {}
            room.sockets.delete(token);
          }
        }
      }
      if (room.players.size === 0) rooms.delete(code);
      else migrateHost(room, now);
    }
  }

  function sendWs(socket, data) {
    if (!socket || socket.destroyed || !socket.writable) return;
    try {
      socket.write(encodeWsFrame(JSON.stringify(data)));
    } catch {}
  }

  function broadcastRoom(room, now) {
    const events = room.pendingEvents.splice(0);
    const playersList = [...room.players.values()].map(m => ({
      id: m.id,
      name: m.name,
      team: m.team,
      role: m.role,
      ready: m.ready,
      connected: connected(m, now),
      state: m.state,
    }));
    for (const [token, socket] of room.sockets) {
      const member = room.players.get(token);
      if (!member) continue;
      sendWs(socket, {
        type: 'snapshot',
        code: room.code,
        phase: room.phase,
        countdownMs: room.phase === 'countdown' ? Math.max(0, room.lockAt - now) : null,
        hostId: room.hostId,
        yourId: member.id,
        settings: room.settings,
        players: playersList,
        conquest: room.conquest,
        events,
      });
    }
  }

  function handleWsMessage(room, token, player, raw, now) {
    player.lastSeen = now;
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'state' && msg.state && typeof msg.state === 'object') {
      const s = msg.state;
      if (Array.isArray(s.pos) && s.pos.length === 3 && s.pos.every(n => typeof n === 'number' && Number.isFinite(n))) {
        player.state.pos = [s.pos[0], s.pos[1], s.pos[2]];
      }
      if (typeof s.yaw === 'number' && Number.isFinite(s.yaw)) player.state.yaw = s.yaw;
      if (typeof s.pitch === 'number' && Number.isFinite(s.pitch)) player.state.pitch = s.pitch;
      if (typeof s.hp === 'number' && Number.isFinite(s.hp)) player.state.hp = Math.max(0, Math.min(100, s.hp));
      if (typeof s.alive === 'boolean') player.state.alive = s.alive;
      if (typeof s.downed === 'boolean') player.state.downed = s.downed;
      if (typeof s.weapon === 'string') player.state.weapon = s.weapon.slice(0, 24);
      if (typeof s.crouch === 'boolean') player.state.crouch = s.crouch;
      if (typeof s.driving === 'boolean') player.state.driving = s.driving;
      if (typeof s.kills === 'number' && Number.isFinite(s.kills)) player.state.kills = s.kills;
      if (typeof s.deaths === 'number' && Number.isFinite(s.deaths)) player.state.deaths = s.deaths;
      if (typeof s.captures === 'number' && Number.isFinite(s.captures)) player.state.captures = s.captures;
      if (VALID_ROLES.has(s.role)) player.role = s.role;
      return;
    }

    if (msg.type === 'conquest' && player.id === room.hostId && msg.conquest && typeof msg.conquest === 'object') {
      room.conquest = msg.conquest;
      return;
    }

    if (msg.type === 'event' && typeof msg.kind === 'string') {
      const ev = {
        kind: msg.kind.slice(0, 24),
        from: player.id,
        fromName: player.name,
        team: player.team,
        payload: msg.payload && typeof msg.payload === 'object' ? msg.payload : {},
        at: now,
      };
      room.pendingEvents.push(ev);
      if (room.pendingEvents.length > 64) room.pendingEvents.shift();
    }
  }

  async function handleAPI(request, response, pathname) {
    const method = request.method;
    if (pathname === '/api/lan/status') {
      if (method !== 'GET') {
        response.setHeader('Allow', 'GET');
        throw new RequestError(405, 'method_not_allowed');
      }
      const port = Number(process.env.PORT ?? 7878);
      return json(response, 200, {
        version: '0.20.0-port',
        port,
        addresses: lanAddresses(port),
        rooms: [...rooms.values()].map(r => ({ code: r.code, players: r.players.size, maxPlayers: r.maxPlayers, phase: r.phase })),
      });
    }

    const root = pathname === '/api/lan/rooms';
    const match = pathname.match(/^\/api\/lan\/rooms\/([a-fA-F0-9]{6})(?:\/(join|ready|start|leave|team|loadout))?$/);
    if (!root && !match) throw new RequestError(404, 'not_found');
    const [, rawCode, action] = match ?? [];
    const expected = root || action ? 'POST' : 'GET';
    if (method !== expected) {
      response.setHeader('Allow', expected);
      throw new RequestError(405, 'method_not_allowed');
    }
    const body = method === 'POST' ? await readJSON(request) : {};
    const now = clock();
    sweep(now);

    if (root) {
      if (rooms.size >= MAX_ROOMS) throw new RequestError(503, 'room_limit');
      const name = playerName(body.name);
      let code;
      do { code = randomBytes(3).toString('hex').toUpperCase(); } while (rooms.has(code));
      const reqMax = Number(body.maxPlayers);
      const maxPlayers = Number.isInteger(reqMax) && reqMax >= MIN_PLAYERS && reqMax <= HARD_MAX_PLAYERS
        ? reqMax : DEFAULT_MAX_PLAYERS;
      const room = {
        code,
        phase: 'lobby',
        lockAt: null,
        maxPlayers,
        settings: normalizeSettings(body.settings ?? body),
        players: new Map(),
        sockets: new Map(),
        pendingEvents: [],
        conquest: null,
        hostId: null,
      };
      const { token, player } = addPlayer(room, name, now, body.role);
      rooms.set(code, room);
      return json(response, 201, { token, room: snapshot(room, player, now) });
    }

    const room = rooms.get(rawCode.toUpperCase());
    if (!room) throw new RequestError(404, 'room_not_found');
    if (action === 'join') {
      if (room.phase === 'countdown') throw new RequestError(409, 'room_countdown');
      if (room.phase !== 'lobby') throw new RequestError(409, 'room_started');
      if (room.players.size >= room.maxPlayers) throw new RequestError(409, 'room_full');
      const { token, player } = addPlayer(room, playerName(body.name), now, body.role);
      return json(response, 201, { token, room: snapshot(room, player, now) });
    }

    const token = /^Bearer ([a-f0-9]{48})$/.exec(request.headers.authorization ?? '')?.[1];
    const player = room.players.get(token);
    if (!player) throw new RequestError(401, 'invalid_token');
    player.lastSeen = now;
    if (action === 'leave') {
      room.players.delete(token);
      const sock = room.sockets.get(token);
      if (sock) {
        try { sock.destroy(); } catch {}
        room.sockets.delete(token);
      }
      if (room.phase === 'countdown') {
        room.phase = 'lobby';
        room.lockAt = null;
      }
      if (room.players.size === 0) rooms.delete(room.code);
      else migrateHost(room, now);
      return json(response, 200, { ok: true });
    }
    if (action && action !== 'loadout' && room.phase === 'started') throw new RequestError(409, 'room_started');
    if (action === 'ready') {
      if (typeof body.ready !== 'boolean') throw new RequestError(400, 'invalid_ready');
      player.ready = body.ready;
      advanceCountdown(room, now);
    }
    if (action === 'loadout') {
      if (!VALID_ROLES.has(body.role)) throw new RequestError(400, 'invalid_role');
      player.role = body.role;
    }
    if (action === 'team') {
      if (player.id !== room.hostId) throw new RequestError(403, 'host_only');
      if (!VALID_TEAMS.has(body.team)) throw new RequestError(400, 'invalid_team');
      const target = [...room.players.values()].find(m => m.id === body.playerId);
      if (!target) throw new RequestError(404, 'player_not_found');
      target.team = body.team;
      if (room.phase === 'lobby') target.ready = false;
    }
    if (action === 'start') {
      if (player.id !== room.hostId) throw new RequestError(403, 'host_only');
      if (!readyToLock(room, now)) {
        throw new RequestError(409, 'players_not_ready');
      }
      if (room.phase === 'lobby') {
        room.phase = 'countdown';
        room.lockAt = now + COUNTDOWN_MS;
      }
    }
    return json(response, 200, { room: snapshot(room, player, now) });
  }

  const server = createServer({ requestTimeout: 15_000, headersTimeout: 10_000 }, async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    try {
      const { pathname } = new URL(request.url, 'http://localhost');
      if (pathname.startsWith('/api/')) {
        await handleAPI(request, response, pathname);
        return;
      }
      const filename = pathname === '/' ? 'index.html' : pathname.slice(1);
      if (!ASSETS.has(filename) && !/^assets\/(?:models\/[a-z0-9_]+\/(?:scene\.gltf|[a-z0-9_]+\.bin|textures\/[a-z0-9_]+\.(?:jpg|png))|surfaces\/[a-z0-9_]+\/[A-Za-z0-9_]+\.jpg)$/.test(filename)) throw new RequestError(404, 'not_found');
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.setHeader('Allow', 'GET, HEAD');
        throw new RequestError(405, 'method_not_allowed');
      }
      let content;
      try {
        content = await readFile(path.join(ROOT, filename));
      } catch (err) {
        if (err.code !== 'ENOENT') throw err;
        throw new RequestError(404, 'not_found');
      }
      response.writeHead(200, { 'Content-Type': CONTENT_TYPES[path.extname(filename)], 'Content-Length': content.length });
      response.end(request.method === 'HEAD' ? undefined : content);
    } catch (err) {
      if (response.destroyed) return;
      if (err instanceof RequestError) json(response, err.status, { error: err.message });
      else {
        console.error(err);
        json(response, 500, { error: 'server_error' });
      }
    }
  });

  // Zero-dependency WebSocket upgrade handler for real-time 20 Hz gameplay sync
  server.on('upgrade', (request, socket) => {
    try {
      const url = new URL(request.url, 'http://localhost');
      if (url.pathname !== '/api/lan/ws') {
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
        socket.destroy();
        return;
      }
      const code = (url.searchParams.get('room') || '').toUpperCase();
      const token = url.searchParams.get('token') || '';
      const key = request.headers['sec-websocket-key'];
      const now = clock();
      sweep(now);
      const room = rooms.get(code);
      const player = room?.players.get(token);
      if (!room || !player || !key) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }
      const accept = createHash('sha1').update(key + WS_MAGIC).digest('base64');
      socket.write(
        'HTTP/1.1 101 Switching Protocols\r\n' +
        'Upgrade: websocket\r\n' +
        'Connection: Upgrade\r\n' +
        `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
      );
      const existing = room.sockets.get(token);
      if (existing && existing !== socket) {
        try { existing.destroy(); } catch {}
      }
      room.sockets.set(token, socket);
      player.lastSeen = now;

      sendWs(socket, { type: 'welcome', room: snapshot(room, player, now) });

      const cleanup = () => {
        if (room.sockets.get(token) === socket) room.sockets.delete(token);
        try { socket.destroy(); } catch {}
      };
      const parser = createWsParser(
        text => handleWsMessage(room, token, player, text, clock()),
        cleanup
      );
      socket.on('data', parser);
      socket.on('close', cleanup);
      socket.on('error', cleanup);
    } catch {
      try { socket.destroy(); } catch {}
    }
  });

  let ticker = null;
  if (enableTick) {
    ticker = setInterval(() => {
      const now = clock();
      sweep(now);
      for (const room of rooms.values()) {
        if (room.sockets.size > 0) broadcastRoom(room, now);
      }
    }, 50);
    ticker.unref?.();
  }
  server.on('close', () => {
    if (ticker) clearInterval(ticker);
  });

  // Expose internal helpers for unit tests (e.g. without binding TCP ports)
  server._rooms = rooms;
  server._encodeWsFrame = encodeWsFrame;
  server._createWsParser = createWsParser;
  return server;
}

if (require.main === module) {
  const port = Number(process.env.PORT ?? 7878);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('PORT must be an integer from 1 to 65535.');
    process.exitCode = 1;
  } else {
    const server = createLanServer();
    server.once('error', err => {
      console.error(`Saltline LAN could not listen on port ${port}: ${err.message}`);
      process.exitCode = 1;
    });
    server.listen(port, '0.0.0.0', () => {
      console.log(`Saltline LAN: http://localhost:${port} · up to ${HARD_MAX_PLAYERS} players`);
      for (const url of lanAddresses(port)) {
        console.log(`LAN: ${url}`);
      }
    });
  }
}

module.exports = { createLanServer, encodeWsFrame, createWsParser, normalizeSettings };
