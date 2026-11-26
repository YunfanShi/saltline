const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const { createPortTacticalCommander } = require('../port-mp-squad.js');
const { VEHICLE_SPECS, controlFlight, guideMissile } = require('../port-mp-vehicles.js');
const { encodeWsFrame, createWsParser, normalizeSettings, createRoomEnemies, tickRoomAI } = require('../server/lan.cjs');

test('IRONFRONT Commander evaluates objectives, honors 12s commitment window, and processes J/K responses', () => {
  const cmd = createPortTacticalCommander('blue');
  const points = [
    { id: 'sector_w', short: 'W', pos: { x: -66, y: 0, z: 5 }, owner: 'red', contested: false, locked: false },
    { id: 'relay_a', short: 'A', pos: { x: -10, y: 0, z: 0 }, owner: 'blue', contested: false, locked: false },
    { id: 'relay_b', short: 'B', pos: { x: 10, y: 0, z: 12 }, owner: null, contested: false, locked: false },
  ];
  for (const p of points) cmd.reportObjective(1, p);
  cmd.reportEnemy(1, { x: 10, z: 12 }, 'e1');

  const a1 = cmd.evaluate(1, points, { at: { x: -5, z: 0 }, members: 4, health: 1 }, 40, 40);
  assert.ok(a1);
  assert.equal(a1.mission, 'CAPTURE_OBJECTIVE');
  assert.equal(cmd.recommendation.status, 'offered');
  assert.equal(cmd.respond(true), true);
  assert.equal(cmd.recommendation.status, 'accepted');
  assert.equal(cmd.respond(false), false);

  // Within 12s commitment window, assignment remains stable
  const a2 = cmd.evaluate(6, points, { at: { x: -5, z: 0 }, members: 4, health: 1 }, 40, 40);
  assert.equal(a2.objective, a1.objective);

  // Low health / casualties forces REGROUP on friendly point after commitment window
  const a3 = cmd.evaluate(20, points, { at: { x: -5, z: 0 }, members: 1, health: 0.25 }, 30, 40);
  assert.equal(a3.mission, 'REGROUP');
});

test('IRONFRONT 8-vehicle fleet specs, jet/helicopter flight physics, and 77-deg missile seeker work accurately', () => {
  assert.deepEqual(Object.keys(VEHICLE_SPECS).sort(), ['aa', 'helicopter', 'ifv', 'jet', 'motorcycle', 'scout', 'tank', 'transport']);
  assert.equal(VEHICLE_SPECS.tank.maxHp, 820);
  assert.equal(VEHICLE_SPECS.helicopter.airborne, true);
  assert.equal(VEHICLE_SPECS.jet.airborne, true);

  const jet = { kind: 'jet', yaw: 0, roll: 0, flightPitch: 0, speed: 50 };
  const jetMove = controlFlight(jet, 1, 0.8, 0.5, undefined, 0.2, true, false);
  assert.ok(jet.speed > 50);
  assert.ok(Math.abs(jet.roll) > 0.1);
  assert.ok(Math.hypot(jetMove.dx, jetMove.dz) > 10);

  const heli = { kind: 'helicopter', yaw: 0, roll: 0, flightPitch: 0, speed: 0 };
  const heliMove = controlFlight(heli, 0, 1, 0.5, 0, 0, false, false);
  assert.ok(Math.hypot(heliMove.dx, heliMove.dz) > 5);

  // Within 77 deg cone -> guides cleanly
  const vel = { x: 0, y: 0, z: 100 };
  assert.equal(guideMissile(vel, { x: 20, y: 5, z: 80 }, 100, 0.2), true);
  assert.ok(vel.x > 0);
  // Outside 77 deg cone -> loses lock
  assert.equal(guideMissile({ x: 0, y: 0, z: 100 }, { x: 0, y: 0, z: -100 }, 100, 0.2), false);
});

test('Server-authoritative LAN AI enemies spawn, patrol, and respawn cleanly', () => {
  const room = { phase: 'started', settings: { aiEnabled: true, difficulty: 'normal' }, enemies: null };
  tickRoomAI(room, 0.05, 1000);
  assert.equal(room.enemies.length, 7);
  const beforeX = room.enemies[0].pos[0];
  const beforeZ = room.enemies[0].pos[2];
  tickRoomAI(room, 1.0, 2000);
  assert.ok(Math.hypot(room.enemies[0].pos[0] - beforeX, room.enemies[0].pos[2] - beforeZ) > 1);
  assert.equal(createRoomEnemies('hard').length, 10);
});

test('LAN RFC 6455 WebSocket frame encoder and masked client parser round-trip JSON payloads', () => {
  const sample = JSON.stringify({ type: 'state', state: { pos: [1.5, 0, -4.2], hp: 92 } });
  const serverFrame = encodeWsFrame(sample);
  assert.equal(serverFrame[0], 0x81);

  const payload = Buffer.from(sample, 'utf8');
  const mask = Buffer.from([0x37, 0xfa, 0x21, 0x3d]);
  const masked = Buffer.alloc(payload.length);
  for (let i = 0; i < payload.length; i++) masked[i] = payload[i] ^ mask[i & 3];
  const header = Buffer.from([0x81, 0x80 | payload.length]);
  const clientPacket = Buffer.concat([header, mask, masked]);

  const received = [];
  let closed = false;
  const parse = createWsParser(msg => received.push(msg), () => { closed = true; });
  parse(clientPacket.subarray(0, 10));
  parse(clientPacket.subarray(10));
  assert.equal(closed, false);
  assert.deepEqual(received, [sample]);
});

test('LAN room settings normalization supports IRONFRONT modes, maps, teams, tickets, mid-join and AI toggle', () => {
  const s = normalizeSettings({ mode: 'breakthrough', mapId: 'port_rail', difficulty: 'hard', startingTickets: 70, duration: 360, aiEnabled: false, joinTeam: 'alternate', allowMidJoin: false });
  assert.deepEqual(s, {
    mode: 'breakthrough',
    mapId: 'port_rail',
    difficulty: 'hard',
    startingTickets: 70,
    duration: 360,
    aiEnabled: false,
    joinTeam: 'alternate',
    allowMidJoin: false,
  });
  const coop = normalizeSettings({ mode: 'coop_rescue', mapId: 'mountain_forest', aiEnabled: false, joinTeam: 'red' });
  assert.equal(coop.mode, 'coop_rescue');
  assert.equal(coop.mapId, 'mountain_forest');
  assert.equal(coop.aiEnabled, true);
  assert.equal(coop.joinTeam, 'blue');
});

test('Port Conquest supports IRONFRONT heavy vehicle airdrop requisitions', () => {
  const code = fs.readFileSync(path.join(__dirname, '..', 'port-conquest.js'), 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(code, sandbox);
  const game = sandbox.window.createPortConquest([
    { id: 'relay_a', short: 'A', o: { pos: { x: 0, y: 0, z: 0 } } },
    { id: 'relay_b', short: 'B', o: { pos: { x: 20, y: 0, z: 0 } } },
  ]);
  assert.equal(game.supportCosts.tank, 8);
  assert.equal(game.supportCosts.helicopter, 8);
  assert.equal(game.supportCosts.jet, 9);
  for (let i = 0; i < 6; i++) game.killedMachine();
  assert.equal(game.supportPoints, 9);
  assert.equal(game.useSupport('jet', { x: 0, y: 0, z: 0 }), true);
  assert.equal(game.supportPoints, 0);
  assert.equal(game.support.jetUntil, 70);
});

test('All ported multiplayer modules parse cleanly as valid JavaScript and are whitelisted in server/lan.cjs', () => {
  const lanSrc = fs.readFileSync(path.join(__dirname, '..', 'server', 'lan.cjs'), 'utf8');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  for (const file of ['port-mp-squad.js', 'port-mp-gadgets.js', 'port-mp-vehicles.js', 'port-mp-sync.js', 'port-lan.js', 'port-conquest.js', 'port-operations.js']) {
    const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    new vm.Script(src, { filename: file });
    assert.ok(lanSrc.includes(`'${file}'`), `${file} missing from server/lan.cjs ASSETS`);
  }
  const refs = [...html.matchAll(/<(script|link|img)\b[^>]*?\b(?:src|href)="\.\/([^"]+)"/g)].map(m => m[2]);
  for (const r of refs) {
    assert.ok(lanSrc.includes(`'${r}'`), `${r} referenced in index.html missing from server/lan.cjs ASSETS`);
  }
});
