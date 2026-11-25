const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const { normalizeConquest } = require('../server/lan.cjs');
const context = { window: {} };
runInNewContext(readFileSync(require.resolve('../port-conquest.js'), 'utf8'), context);
const create = () => context.window.createPortConquest([0, 30].map((x, i) => ({ id: String(i), short: String(i), o: { pos: { x, y: 0, z: 0 } } })), { mode: 'breakthrough' });
const player = { alive: true, pos: { x: 0, y: 0, z: 0 } };

test('shared breakthrough state advances guests while retaining their own respawn clock', () => {
  const host = create();
  const guest = create();
  guest.casualty({ affectsTickets: false });
  assert.equal(guest.deaths, 1);
  assert.equal(guest.tickets.blue, host.tickets.blue);
  host.update(16, player, []);
  const state = JSON.parse(JSON.stringify(host.exportSharedState()));
  assert.ok(normalizeConquest(state));
  assert.equal(guest.applySharedState(state), true);
  assert.equal(guest.activePoint.id, '1');
  assert.equal(guest.points[0].secured, true);
  assert.equal(guest.elapsed, 16);
  assert.equal(guest.updateGuest(2.9).respawn, false);
  guest.applySharedState(state);
  assert.equal(guest.updateGuest(.1).respawn, true);
  host.update(16, { alive: true, pos: { x: 30, y: 0, z: 0 } }, []);
  guest.applySharedState(JSON.parse(JSON.stringify(host.exportSharedState())));
  assert.equal(guest.winner, 'blue');
});

test('invalid match snapshots are rejected without changing state', () => {
  const game = create();
  const state = JSON.parse(JSON.stringify(game.exportSharedState()));
  state.points[0].control = 999;
  assert.equal(normalizeConquest(state), null);
  assert.equal(game.applySharedState(state), false);
  assert.equal(game.points[0].control, -100);
});
