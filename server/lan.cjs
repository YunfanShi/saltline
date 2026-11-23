const { randomBytes, randomUUID } = require('node:crypto');
const { readFile } = require('node:fs/promises');
const { createServer } = require('node:http');
const { networkInterfaces } = require('node:os');
const path = require('node:path');

const MAX_PLAYERS = 4;
const MIN_PLAYERS = 2;
const MAX_ROOMS = 32;
const HEARTBEAT_MS = 6000;
const RESERVATION_MS = 30_000;
const COUNTDOWN_MS = 3000;
const MAX_BODY_BYTES = 2048;
const ROOT = path.resolve(__dirname, '..');
const ASSETS = new Set([
  'index.html', 'zh.js',
  'port-campaign.js', 'port-commander.js', 'port-conquest.js', 'port-rail-yard.js', 'port-expansion.js', 'port-campaign-events.js',
  'port-lan.js',
  'port-loadout.js', 'port-loadout.css',
  'port-operations.js', 'port-operations.css',
  'developer-menu.js', 'developer-menu.css',
  'art/port-conquest.jpg', 'art/port-breakthrough.jpg', 'art/port-lan.jpg',
]);
const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.jpg': 'image/jpeg',
};

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

function addPlayer(room, name, now) {
  const token = randomBytes(24).toString('hex');
  const player = { id: randomUUID(), name, ready: false, lastSeen: now };
  room.players.set(token, player);
  if (!room.hostId) room.hostId = player.id;
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
    maxPlayers: MAX_PLAYERS,
    players: [...room.players.values()].map(member => ({
      id: member.id,
      name: member.name,
      ready: member.ready,
      connected: connected(member, now),
    })),
  };
}

function createLanServer({ clock = Date.now } = {}) {
  const rooms = new Map();

  function sweep(now) {
    for (const [code, room] of rooms) {
      advanceCountdown(room, now);
      for (const [token, player] of room.players) {
        if (now - player.lastSeen >= HEARTBEAT_MS + RESERVATION_MS) room.players.delete(token);
      }
      if (room.players.size === 0) rooms.delete(code);
      else migrateHost(room, now);
    }
  }

  async function handleAPI(request, response, pathname) {
    const method = request.method;
    const root = pathname === '/api/lan/rooms';
    const match = pathname.match(/^\/api\/lan\/rooms\/([a-fA-F0-9]{6})(?:\/(join|ready|start|leave))?$/);
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
      const room = { code, phase: 'lobby', lockAt: null, players: new Map(), hostId: null };
      const { token, player } = addPlayer(room, name, now);
      rooms.set(code, room);
      return json(response, 201, { token, room: snapshot(room, player, now) });
    }

    const room = rooms.get(rawCode.toUpperCase());
    if (!room) throw new RequestError(404, 'room_not_found');
    if (action === 'join') {
      if (room.phase === 'countdown') throw new RequestError(409, 'room_countdown');
      if (room.phase !== 'lobby') throw new RequestError(409, 'room_started');
      if (room.players.size >= MAX_PLAYERS) throw new RequestError(409, 'room_full');
      const { token, player } = addPlayer(room, playerName(body.name), now);
      return json(response, 201, { token, room: snapshot(room, player, now) });
    }

    const token = /^Bearer ([a-f0-9]{48})$/.exec(request.headers.authorization ?? '')?.[1];
    const player = room.players.get(token);
    if (!player) throw new RequestError(401, 'invalid_token');
    player.lastSeen = now;
    if (action === 'leave') {
      room.players.delete(token);
      if (room.phase === 'countdown') {
        room.phase = 'lobby';
        room.lockAt = null;
      }
      if (room.players.size === 0) rooms.delete(room.code);
      else migrateHost(room, now);
      return json(response, 200, { ok: true });
    }
    if (action && room.phase === 'started') throw new RequestError(409, 'room_started');
    if (action === 'ready') {
      if (typeof body.ready !== 'boolean') throw new RequestError(400, 'invalid_ready');
      player.ready = body.ready;
      advanceCountdown(room, now);
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

  return createServer({ requestTimeout: 15_000, headersTimeout: 10_000 }, async (request, response) => {
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
      if (!ASSETS.has(filename)) throw new RequestError(404, 'not_found');
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
      console.log(`Saltline LAN: http://localhost:${port}`);
      const adapters = Object.values(networkInterfaces()).flat();
      for (const adapter of adapters) {
        if (adapter.family === 'IPv4' && !adapter.internal) console.log(`LAN: http://${adapter.address}:${port}`);
      }
    });
  }
}

module.exports = { createLanServer };
