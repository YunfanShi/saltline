const assert = require('node:assert/strict');
const { once } = require('node:events');
const test = require('node:test');
const { createLanServer } = require('../server/lan.cjs');

async function launch(t) {
  let time = 0;
  const server = createLanServer({ clock: () => time });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
    server.closeAllConnections();
  }));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const rooms = '/api/lan/rooms';

  async function request(url, { method = 'GET', token, body, raw, contentType = 'application/json' } = {}) {
    const headers = {};
    if (token) headers.Authorization = 'Bearer ' + token;
    const payload = raw ?? (body === undefined ? undefined : JSON.stringify(body));
    if (payload !== undefined) headers['Content-Type'] = contentType;
    const res = await fetch(origin + url, { method, headers, body: payload });
    return { status: res.status, body: await res.json() };
  }

  return {
    origin, request, rooms,
    advance(ms) { time += ms; },
    async create(name = 'Host') {
      const result = await request(rooms, { method: 'POST', body: { name } });
      assert.equal(result.status, 201);
      return result.body;
    },
    async join(code, name = 'Guest') {
      const result = await request(rooms + '/' + code + '/join', { method: 'POST', body: { name } });
      assert.equal(result.status, 201);
      return result.body;
    },
    room(code, token) { return request(rooms + '/' + code, { token }); },
    action(code, action, token, body) {
      return request(rooms + '/' + code + '/' + action, { method: 'POST', token, body });
    },
  };
}

test('LAN serves Saltline assets without exposing repository or server files', async t => {
  const { origin } = await launch(t);
  const page = await fetch(origin + '/?room=ABC123');
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /<title>Saltline<\/title>/);
  const assetTypes = { script: 'text/javascript; charset=utf-8', link: 'text/css; charset=utf-8', img: 'image/jpeg' };
  const assets = [...html.matchAll(/<(script|link|img)\b[^>]*?\b(?:src|href)="([^"]+)"/g)].map(([, tag, src]) => ({
    expectedType: assetTypes[tag],
    url: new URL(src, page.url),
  })).filter(asset => asset.url.origin === origin);
  assert.ok(assets.length > 0);
  await Promise.all(assets.map(async ({ url, expectedType }) => {
    const asset = await fetch(url, { method: 'HEAD' });
    assert.equal(asset.status, 200, url.pathname);
    assert.equal(asset.headers.get('content-type'), expectedType, url.pathname);
    assert.equal(await asset.text(), '');
  }));
  for (const name of ['/server/lan.cjs', '/.git/config', '/README.md', '/%2e%2e%2fserver/lan.cjs']) {
    assert.equal((await fetch(origin + name)).status, 404);
  }
});

test('only the host can start a 2–4 player ready room', async t => {
  const lan = await launch(t);
  const { token: host, room: created } = await lan.create(' Host ');
  const { code } = created;
  assert.match(code, /^[A-F0-9]{6}$/);
  assert.equal(created.phase, 'lobby');
  assert.equal(created.players[0].name, 'Host');
  assert.equal(created.hostId, created.yourId);
  const { token: guest, room: joined } = await lan.join(code.toLowerCase(), '队员');
  assert.equal(joined.players.length, 2);
  assert.notEqual(joined.yourId, created.yourId);
  assert.notEqual(host, guest);
  assert.ok(!JSON.stringify(joined).includes(host));
  assert.deepEqual(await lan.action(code, 'start', guest), { status: 403, body: { error: 'host_only' } });
  assert.deepEqual(await lan.action(code, 'start', host), { status: 409, body: { error: 'players_not_ready' } });
  await lan.action(code, 'ready', host, { ready: true });
  await lan.action(code, 'ready', guest, { ready: true });
  assert.equal((await lan.room(code, host)).body.room.players[1].ready, true);
  const { body: { room: countdown } } = await lan.action(code, 'start', host);
  assert.equal(countdown.phase, 'countdown');
  assert.equal(countdown.countdownMs, 3000);
  lan.advance(1750);
  assert.equal((await lan.action(code, 'start', host)).body.room.countdownMs, 1250);
  assert.deepEqual(await lan.action(code, 'join', null, { name: 'Another' }), {
    status: 409, body: { error: 'room_countdown' },
  });
  lan.advance(1249);
  assert.equal((await lan.room(code, guest)).body.room.countdownMs, 1);
  lan.advance(1);
  const { body: { room: locked } } = await lan.room(code, guest);
  assert.equal(locked.phase, 'started');
  assert.equal(locked.countdownMs, null);
  assert.deepEqual(await lan.action(code, 'join', null, { name: 'Another' }), {
    status: 409, body: { error: 'room_started' },
  });
});

test('rooms enforce capacity and reassign the host after a deliberate departure', async t => {
  const lan = await launch(t);
  const { token: host, room: { code } } = await lan.create();
  const { token: first, room: guestRoom } = await lan.join(code, 'First');
  await lan.join(code, 'Second');
  await lan.join(code, 'Third');
  assert.deepEqual(await lan.action(code, 'join', null, { name: 'Full' }), {
    status: 409, body: { error: 'room_full' },
  });
  assert.deepEqual(await lan.action(code, 'leave', host), { status: 200, body: { ok: true } });
  assert.equal((await lan.room(code, host)).status, 401);
  const { body: { room } } = await lan.room(code, first);
  assert.equal(room.hostId, guestRoom.yourId);
  assert.equal(room.players.length, 3);
  await lan.join(code, 'Fourth');
});

test('a missed heartbeat reserves a seat and reconnect keeps identity and readiness', async t => {
  const lan = await launch(t);
  const { token: host, room: { code, hostId } } = await lan.create();
  const { token: guest } = await lan.join(code);
  await lan.action(code, 'ready', host, { ready: true });
  await lan.action(code, 'ready', guest, { ready: true });
  lan.advance(6000);
  const { body: { room: active } } = await lan.room(code, guest);
  assert.equal(active.hostId, hostId);
  assert.deepEqual(active.players[0], { id: hostId, name: 'Host', connected: false, ready: true });
  lan.advance(5000);
  assert.deepEqual(await lan.action(code, 'start', guest), { status: 403, body: { error: 'host_only' } });
  const { body: { room: resumed } } = await lan.room(code, host);
  assert.equal(resumed.yourId, hostId);
  assert.equal(resumed.players[0].ready, true);
  assert.equal(resumed.players[0].connected, true);
  lan.advance(36_000);
  assert.equal((await lan.room(code, guest)).status, 404);
});

test('an expired host token is refused and a remaining player can start the room', async t => {
  const lan = await launch(t);
  const { token: host, room: { code } } = await lan.create();
  const { token: guest, room: { yourId } } = await lan.join(code);
  lan.advance(6000);
  await lan.room(code, guest);
  lan.advance(30_000);
  assert.deepEqual(await lan.room(code, host), { status: 401, body: { error: 'invalid_token' } });
  const { body: { room } } = await lan.room(code, guest);
  assert.equal(room.hostId, yourId);
  assert.equal(room.players.length, 1);
  await lan.action(code, 'ready', guest, { ready: true });
  assert.equal((await lan.action(code, 'start', guest)).body.error, 'players_not_ready');
  const { token: another } = await lan.join(code);
  await lan.action(code, 'ready', another, { ready: true });
  assert.equal((await lan.action(code, 'start', guest)).body.room.phase, 'countdown');
});

test('a member unreadying or leaving cancels the countdown before lock', async t => {
  const lan = await launch(t);
  const { token: host, room: { code } } = await lan.create();
  const { token: guest, room: { yourId: guestId } } = await lan.join(code);
  const { token: third } = await lan.join(code, 'Third');
  for (const token of [host, guest, third]) await lan.action(code, 'ready', token, { ready: true });
  await lan.action(code, 'start', host);
  lan.advance(2999);
  const { body: { room: cancelled } } = await lan.action(code, 'ready', guest, { ready: false });
  assert.equal(cancelled.phase, 'lobby');
  assert.equal(cancelled.countdownMs, null);
  assert.equal(cancelled.players.find(player => player.id === guestId).ready, false);
  await lan.action(code, 'ready', guest, { ready: true });
  await lan.action(code, 'start', host);
  await lan.action(code, 'leave', third);
  assert.equal((await lan.room(code, guest)).body.room.phase, 'lobby');

  await lan.action(code, 'start', host);
  await lan.action(code, 'leave', host);
  const { body: { room: migrated } } = await lan.room(code, guest);
  assert.equal(migrated.phase, 'lobby');
  assert.equal(migrated.hostId, guestId);
});

test('the countdown cancels when a seat goes silent before the deadline', async t => {
  const lan = await launch(t);
  const { token: host, room: { code } } = await lan.create();
  const { token: guest } = await lan.join(code);
  await lan.action(code, 'ready', host, { ready: true });
  await lan.action(code, 'ready', guest, { ready: true });
  lan.advance(4000);
  assert.equal((await lan.action(code, 'start', host)).body.room.phase, 'countdown');
  lan.advance(2000);
  const { body: { room: cancelled } } = await lan.room(code, host);
  assert.equal(cancelled.phase, 'lobby');
  assert.equal(cancelled.players[1].connected, false);
  assert.equal((await lan.room(code, guest)).body.room.phase, 'lobby');
  assert.equal((await lan.action(code, 'start', host)).body.room.countdownMs, 3000);
});

test('a countdown that expired while everyone was connected stays locked on late polls', async t => {
  const lan = await launch(t);
  const { token: host, room: { code } } = await lan.create();
  const { token: guest } = await lan.join(code);
  for (const token of [host, guest]) await lan.action(code, 'ready', token, { ready: true });
  await lan.action(code, 'start', host);
  lan.advance(6000);
  const { body: { room } } = await lan.room(code, host);
  assert.equal(room.phase, 'started');
  assert.equal(room.players[1].connected, false);
});

test('LAN API validates JSON bodies, name length, ready actions and bearer tokens', async t => {
  const lan = await launch(t);
  assert.equal((await lan.request(lan.rooms, { method: 'POST', raw: '[' })).body.error, 'bad_json');
  assert.equal((await lan.request(lan.rooms, { method: 'POST', body: ['string'] })).body.error, 'bad_json');
  assert.equal((await lan.request(lan.rooms, { method: 'POST', raw: '{}', contentType: 'text/plain' })).status, 415);
  assert.equal((await lan.request(lan.rooms, { method: 'POST', body: { name: 'a'.repeat(2049) } })).status, 413);
  for (const name of [null, ' ', 'x'.repeat(25), 'Player\nTwo']) {
    assert.equal((await lan.request(lan.rooms, { method: 'POST', body: { name } })).body.error, 'invalid_name');
  }
  const { token, room: { code } } = await lan.create();
  assert.deepEqual(await lan.room(code), { status: 401, body: { error: 'invalid_token' } });
  assert.equal((await lan.action(code, 'ready', token, { ready: 'yes' })).body.error, 'invalid_ready');
  assert.equal((await lan.room(code, token)).body.room.players[0].ready, false);
});
