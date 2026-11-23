const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { performance } = require('node:perf_hooks');
const test = require('node:test');
const vm = require('node:vm');

const html = readFileSync(require.resolve('../index.html'), 'utf8');
const engineStart = html.indexOf('var _M=Object.defineProperty');
const bootStart = html.indexOf('var gM=', engineStart);
assert.ok(engineStart >= 0 && bootStart > engineStart, 'Find the bundled level builder');

const diagnostics = [];
const scope = vm.createContext({
  window: {}, performance, AbortController,
  console: { ...console, error: (...message) => diagnostics.push(message.join(' ')) },
});
vm.runInContext(html.slice(engineStart, bootStart) + '\nwindow.engine = { d3, il, lt, ob, Yg };', scope);
for (const source of ['../port-expansion.js', '../port-rail-yard.js']) {
  vm.runInContext(readFileSync(require.resolve(source), 'utf8'), scope);
}

test('the Rail wreck closes the pickup apron and preserves the marked service road', () => {
  const { d3, il, lt, ob, Yg } = scope.window.engine;
  const materials = new Map();
  function material(name) {
    if (!materials.has(name)) materials.set(name, new lt.MeshStandardMaterial());
    return materials.get(name);
  }
  const mark = name => ({ material: material(name), aspect: 2 });
  const world = {
    params: {}, rng: il(4207),
    mats: { get: material, label: mark, decal: mark, emissive: material },
  };
  const vector = (x, y, z) => new lt.Vector3(x, y, z);
  const physics = world.physics = d3(world);
  world.props = Yg(world);
  const builder = ob(world);
  const yard = scope.window.createRailYardLayout(builder, vector);
  const { pickup, campaignPoints, supplies } = scope.window.createPortExpansion(builder, vector, { rail: true });
  assert.deepEqual(diagnostics, [], 'All modeled props use their authored geometry and collision');
  physics.build();

  assert.equal(physics.nav.clearLine(vector(-39, 0, -16), vector(-36, 0, -16)), false);
  for (const z of [5, 19.5]) {
    assert.equal(physics.nav.clearLine(vector(-39, 0, z), vector(-36, 0, z)), true);
  }
  assert.equal(physics.nav.clearLine(pickup.approach.west, pickup.approach.east), true);
  assert.equal(physics.nav.clearLine(pickup.diversion.west, pickup.diversion.east), true);

  const wreck = [pickup.closure, ...pickup.debris].map(({ min, max, playerOnly }) =>
    physics.addBox(min, max, { playerOnly }));
  assert.equal(physics.nav.clearLine(pickup.approach.west, pickup.approach.east), false);
  assert.equal(physics.nav.clearLine(pickup.diversion.west, pickup.diversion.east), true);
  const path = physics.nav.findPath(pickup.approach.west, pickup.approach.east);
  assert.ok(path?.some(point => point.z > 7 && point.z < 13), 'The path diverts through the service road');
  assert.equal(physics.lineOfSight(vector(-85, 1.4, .6), vector(-69, 1.4, .6)), false);
  assert.equal(physics.lineOfSight(vector(-85, 1.4, 10), vector(-69, 1.4, 10)), true);

  for (const target of [campaignPoints.archive, campaignPoints.beacon, yard.extraction.pos,
    ...supplies.map(site => site.pos)]) {
    assert.equal(physics.nav.isWalkable(target.x, target.z), true, target.toArray().join(', '));
    assert.ok(physics.nav.findPath(yard.playerStart.pos, target), target.toArray().join(', '));
  }

  for (const collider of wreck) physics.removeBox(collider);
  assert.equal(physics.nav.clearLine(pickup.approach.west, pickup.approach.east), true);
});
