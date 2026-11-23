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
vm.runInContext(html.slice(engineStart, bootStart) + '\nwindow.engine = { d3, il, lt, ob, pv, Eb, Yg };', scope);
for (const source of ['../port-expansion.js', '../port-rail-yard.js']) {
  vm.runInContext(readFileSync(require.resolve(source), 'utf8'), scope);
}

function buildRail() {
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
  const expansion = scope.window.createPortExpansion(builder, vector, { rail: true });
  assert.deepEqual(diagnostics, [], 'All modeled props use their authored geometry and collision');
  physics.build();
  return { physics, vector, yard, expansion };
}

test('the Rail wreck closes the pickup apron and preserves the marked service road', () => {
  const { physics, vector, yard, expansion } = buildRail();
  const { pickup, campaignPoints, supplies } = expansion;
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

test('the night-shift office has a walk-in entrance and solid glazing', () => {
  const { physics, vector, yard, expansion } = buildRail();
  const { exploration } = expansion;
  const walkSouth = x => {
    const position = vector(x, 0, 19.5);
    for (let step = 0; step < 30; step++) {
      physics.moveCapsule(position, vector(0, 0, 2.2), 1 / 30);
    }
    return position;
  };

  assert.ok(walkSouth(-103.5).z > 21.6, 'The capsule walks through the open door');
  assert.ok(walkSouth(-100.65).z < 20, 'The capsule cannot pass through the office front');
  const glass = physics.raycast(vector(-100.65, 1.6, 19.5), vector(0, 0, 1), 5);
  assert.equal(glass?.surface, 'glass', 'An eye-level ray contacts the visible window');
  assert.equal(physics.lineOfSight(vector(-100.65, 1.6, 19.5), exploration.soundPos), false);
  assert.equal(physics.lineOfSight(vector(-101.25, 1.6, 23.2), exploration.soundPos), true);
  assert.equal(physics.nav.isWalkable(exploration.pos.x, exploration.pos.z), true);
  assert.ok(physics.nav.findPath(yard.playerStart.pos, exploration.pos), 'The player can reach the records');
});

test('legacy skyline props stay beyond the playable annex perimeter in both chapters', async () => {
  const { lt, pv, Eb } = scope.window.engine;
  const material = new lt.MeshStandardMaterial({ side: lt.DoubleSide, vertexColors: true });
  const mark = () => ({ material, aspect: 2 });
  const buildBackdrop = chapter => ({
    level: { chapter }, scene: new lt.Scene(),
    mats: { get: () => material, emissive: () => material, label: mark, decal: mark },
  });
  const probes = [
    [-61.2, -2.5, -1, 27.5],  // North container rows.
    [-90.5, 12, 1, 15.5],   // South container rows.
    [-110.5, -21.8, 1, 49], // West crane leg.
    [-67.5, -21.2, -1, 6],  // North light mast.
    [-84, 23, 1, 4.5],      // South light mast.
  ];
  function hits(skyline) {
    skyline.updateMatrixWorld(true);
    return probes.map(([x, z, direction, distance]) =>
      new lt.Raycaster(new lt.Vector3(x, 1.65, z), new lt.Vector3(0, 0, direction), 0, distance)
        .intersectObject(skyline, true).length > 0);
  }

  const legacy = Eb(buildBackdrop('rail'), { only: 'sky' });
  assert.deepEqual(hits(legacy.skyline), [true, true, true, true, true], 'The probes strike old skyline triangles');
  for (const chapter of ['berth', 'rail']) {
    const gameplay = await pv(buildBackdrop(chapter));
    assert.deepEqual(hits(gameplay.skyline), [false, false, false, false, false], chapter);
  }
});
