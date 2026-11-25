const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const { createPortTacticalCommander } = require('../port-mp-squad.js');
const { encodeWsFrame, createWsParser, normalizeSettings } = require('../server/lan.cjs');

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

test('LAN RFC 6455 WebSocket frame encoder and masked client parser round-trip JSON payloads', () => {
  const sample = JSON.stringify({ type: 'state', state: { pos: [1.5, 0, -4.2], hp: 92 } });
  const serverFrame = encodeWsFrame(sample);
  assert.equal(serverFrame[0], 0x81);

  // Simulate masked client-to-server frame
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

test('LAN room settings normalization supports IRONFRONT modes, teams, tickets and AI toggle', () => {
  const s = normalizeSettings({ mode: 'breakthrough', difficulty: 'hard', startingTickets: 70, duration: 360, aiEnabled: false, joinTeam: 'alternate' });
  assert.deepEqual(s, {
    mode: 'breakthrough',
    difficulty: 'hard',
    startingTickets: 70,
    duration: 360,
    aiEnabled: false,
    joinTeam: 'alternate',
  });
  const fallback = normalizeSettings({ mode: 'invalid', startingTickets: 999, joinTeam: 'bogus' });
  assert.deepEqual(fallback, {
    mode: 'conquest',
    difficulty: 'normal',
    startingTickets: 40,
    duration: 240,
    aiEnabled: true,
    joinTeam: 'blue',
  });
});

test('Port Conquest supports IRONFRONT vehicle airdrop requisition (6 RP, 45s cooldown)', () => {
  const code = fs.readFileSync(path.join(__dirname, '..', 'port-conquest.js'), 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(code, sandbox);
  const game = sandbox.window.createPortConquest([
    { id: 'relay_a', short: 'A', o: { pos: { x: 0, y: 0, z: 0 } } },
    { id: 'relay_b', short: 'B', o: { pos: { x: 20, y: 0, z: 0 } } },
  ]);
  assert.equal(game.supportCosts.vehicle, 6);
  // Starts with 3 RP -> not enough for vehicle airdrop
  assert.equal(game.useSupport('vehicle', { x: 0, y: 0, z: 0 }), false);
  // 3 kills -> 6 RP
  game.killedMachine();
  game.killedMachine();
  game.killedMachine();
  assert.equal(game.supportPoints, 6);
  assert.equal(game.useSupport('vehicle', { x: 0, y: 0, z: 0 }), true);
  assert.equal(game.supportPoints, 0);
  assert.equal(game.support.vehicleUntil, 45);
});

test('All ported multiplayer modules parse cleanly as valid JavaScript', () => {
  for (const file of ['port-mp-squad.js', 'port-mp-gadgets.js', 'port-mp-sync.js', 'port-lan.js', 'port-conquest.js', 'port-operations.js']) {
    const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    new vm.Script(src, { filename: file });
  }
});
