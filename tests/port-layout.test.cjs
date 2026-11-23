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
for (const source of ['../port-expansion.js', '../port-rail-yard.js', '../port-campaign-rail.js']) {
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

test('the runway locator, survivor, cargo ramp, and sheltered route form a playable rescue', () => {
  const { physics, vector, expansion } = buildRail();
  const { pickup } = expansion;
  const layout = pickup.rescue;
  const THREE = scope.window.engine.lt;
  const scene = new THREE.Scene();
  const effects = [];
  const alerts = [];
  const world = { THREE, scene, physics, fx: {
    dust: () => effects.push('dust'),
    sparks: () => effects.push('sparks'),
    smoke: () => effects.push('smoke'),
  }, enemies: { alert: pos => alerts.push(pos.clone()) } };
  for (const { min, max, playerOnly } of [pickup.closure, ...pickup.debris]) {
    physics.addBox(min, max, { playerOnly });
  }
  const mission = scope.window.createRailRescue(world, layout);
  const player = pos => ({ alive: true, pos, eye: pos.clone().add(vector(0, 1.6, 0)) });
  const at = (pos, dt = .1, interact = false) => mission.update(dt, player(pos), interact);
  assert.equal(mission.phase, 'inactive');
  assert.equal(mission.doorOpen, false);
  assert.equal(mission.start().length, 2);
  assert.equal(mission.markers[0].short, 'ELT');
  const cradle = scene.getObjectByName('rail-transfer-fallen-cradle');
  assert.ok(cradle.position.y > 2.5);
  at(layout.start, 1);
  at(layout.start, 2);
  assert.ok(cradle.position.y < .5);
  assert.equal(scene.getObjectByName('rail-emergency-searchlight').visible, true);
  assert.ok(physics.boxes.some(box => box.tag === 'rail-transfer-cradle'));
  for (const cue of ['dust', 'sparks', 'smoke']) assert.ok(effects.includes(cue));
  assert.equal(at(layout.survivor, 3, true).prompt, null);
  assert.equal(at(layout.locator, .3, true).progress, .5);
  at(layout.locator);
  assert.equal(at(layout.locator, .3, true).progress, .5);
  assert.equal(at(layout.locator, .3, true).radio.length, 2);
  assert.equal(mission.phase, 'locate');
  assert.equal(mission.markers[0].short, 'SOS');
  assert.equal(at(layout.survivor, 1.2, true).radio.length, 2);
  assert.equal(mission.phase, 'choose');
  assert.equal(mission.markers.length, 2);

  const fullPath = route => [layout.survivor, ...layout[route].waypoints, layout.handoff];
  const pathLength = path => path.slice(1).reduce((sum, point, index) => sum + point.distanceTo(path[index]), 0);
  assert.ok(pathLength(fullPath('maintenance')) > pathLength(fullPath('ramp')) + 8);
  const doorWest = vector(-78.4, 0, layout.handoff.z + 7.95);
  const doorEast = vector(-75.5, 0, doorWest.z);
  assert.equal(physics.nav.clearLine(doorWest, doorEast), false);
  for (const route of ['ramp', 'maintenance']) {
    mission.reset({ phase: 'choose' });
    assert.equal(at(layout[route].control, route === 'maintenance' ? 1.75 : .6, true).radio.length, 2);
    assert.equal(mission.phase, 'escort');
    assert.equal(mission.snapshot.route, route);
    assert.equal(mission.markers[0].short, route === 'ramp' ? 'RMP' : 'M04');

    const beforeWait = mission.survivor.clone();
    at(layout.handoff, 2.4);
    assert.equal(mission.status, 'waiting');
    assert.ok(mission.survivor.equals(beforeWait));
    assert.equal(at(layout.handoff, 3.1).radio.length, 2, 'a sustained wait gets a spoken reminder');
    assert.equal(mission.doorOpen, route === 'maintenance');
    assert.equal(physics.nav.clearLine(doorWest, doorEast), route === 'maintenance');

    mission.reset(mission.snapshot);
    assert.ok(mission.survivor.equals(layout.survivor));
    assert.equal(mission.doorOpen, route === 'maintenance');
    const path = fullPath(route);
    const midpoint = path[0].clone().lerp(path[1], .47);
    const obstruction = physics.addBox(midpoint.clone().add(vector(-.44, 0, -.44)),
      midpoint.clone().add(vector(.44, 1.8, .44)));
    for (let tick = 0; tick < 32; tick++) at(path[1]);
    assert.equal(mission.status, 'blocked', 'the survivor waits at a blocked route');
    const waitingPosition = mission.survivor.clone();
    for (let tick = 0; tick < 8; tick++) at(path[1]);
    assert.ok(mission.survivor.equals(waitingPosition));
    physics.removeBox(obstruction);
    at(path[1]);
    assert.equal(mission.status, 'moving', 'the survivor continues when the route clears');

    const beforeAlerts = alerts.length;
    const searchlightFootprint = scene.getObjectByName('rail-searchlight-footprint');
    for (let tick = 0; tick < 15; tick++) at(searchlightFootprint.position.clone().setY(0));
    assert.equal(alerts.length > beforeAlerts, route === 'ramp');
    mission.reset(mission.snapshot);
    for (let index = 1; index < path.length; index++) {
      const start = path[index - 1], end = path[index];
      const obstructed = Array.from({ length: 21 }, (_, sample) => start.clone().lerp(end, sample / 20))
        .filter(point => !physics.nav.isWalkable(point.x, point.z)).map(point => point.toArray().join(','));
      assert.ok(physics.nav.clearLine(start, end), `${route} segment ${index} · ${obstructed.join(' / ')}`);
      const steps = Math.ceil(start.distanceTo(end) / .22);
      for (let tick = 1; tick <= steps; tick++) at(start.clone().lerp(end, tick / steps));
      for (let tick = 0; tick < 18; tick++) at(end);
    }
    assert.equal(mission.phase, 'complete', route + ' survivor reached the protected handoff');
  }
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
