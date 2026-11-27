const test = require('node:test');
const assert = require('node:assert/strict');
const { createServiceTunnelScenario, SERVICE_TUNNEL_SAVE_KEY } = require('../port-flood-slice.js');
const storage = () => { const values = new Map(); return { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) }; };
const at = pos => ({ alive: true, pos: { ...pos } });
for (const route of ['upper', 'lower']) test(`${route} route requires pump cooperation and resumes from its own checkpoint`, () => {
  const store = storage(), game = createServiceTunnelScenario({ storage: store });
  assert.equal(game.interact(at(game.points[route])), false);
  assert.equal(game.interact(at(game.points.pump)), true);
  assert.equal(game.state.npcReady, true);
  assert.equal(game.interact(at(game.points[route])), true);
  const resumed = createServiceTunnelScenario({ storage: store });
  assert.equal(resumed.state.route, route);
  assert.deepEqual(resumed.recover(), resumed.points[route]);
  assert.equal(resumed.interact(at(resumed.points[route === 'upper' ? 'valve' : 'gate'])), true);
  assert.equal(resumed.state.phase, 'escape');
  assert.equal(resumed.interact(at(resumed.points.exit)), true);
  assert.equal(createServiceTunnelScenario({ storage: store }).state.phase, 'complete');
});
test('flood rises more slowly with NPC pump assistance and failure restores checkpoint', () => {
  const game = createServiceTunnelScenario();
  for (let i=0;i<100;i++) game.update(.1, at(game.points.start));
  const unassisted = game.state.level;
  game.interact(at(game.points.pump));
  const saved = game.state.level;
  for (let i=0;i<100;i++) game.update(.1, at(game.points.pump));
  assert.ok(unassisted > .3);
  assert.ok(game.state.level - saved < .15);
  const result = game.update(.1, { alive: false, pos: game.points.start });
  assert.equal(result.failed, true);
  assert.equal(game.state.level, saved);
  assert.deepEqual(result.respawn, game.points.pump);
});
test('malformed isolated save does not affect existing campaign storage', () => {
  const store = storage(); store.setItem('saltline.campaign.v3', 'existing'); store.setItem(SERVICE_TUNNEL_SAVE_KEY, '{');
  const game = createServiceTunnelScenario({ storage: store });
  assert.equal(game.state.phase, 'pump'); game.reset();
  assert.equal(store.getItem('saltline.campaign.v3'), 'existing');
});
test('sustained submersion returns the player to the last saved route', () => {
  const game = createServiceTunnelScenario();
  game.interact(at(game.points.pump)); game.interact(at(game.points.lower));
  const submerged = at({ x: 5, y: -2, z: -12 });
  let result;
  for (let i = 0; i < 41; i++) { result = game.update(.1, submerged); if (result.failed) break; }
  assert.equal(result.failed, true);
  assert.deepEqual(result.respawn, game.points.lower);
  assert.equal(game.state.phase, 'crossing');
});
