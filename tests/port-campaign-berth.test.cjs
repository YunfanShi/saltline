const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { performance } = require('node:perf_hooks');
const { before, beforeEach, test } = require('node:test');
const vm = require('node:vm');

let world, layout, extendedLayout, campaign, vector, createBerth;
const alarms = [];
const dt = 1 / 30;

before(() => {
  const html = readFileSync(require.resolve('../index.html'), 'utf8');
  const start = html.indexOf('var _M=Object.defineProperty');
  const end = html.indexOf('var gM=', start);
  assert.ok(start >= 0 && end > start);
  const scope = vm.createContext({ window: {}, performance, AbortController, console });
  vm.runInContext(html.slice(start, end) + '\nwindow.engine = { d3, il, lt, ob, Yg, hR, fR, ab, cb };', scope);
  for (const source of ['../port-expansion.js', '../port-campaign-berth.js']) {
    vm.runInContext(readFileSync(require.resolve(source), 'utf8'), scope);
  }
  const { d3, il, lt, ob, Yg, hR, fR, ab, cb } = scope.window.engine;
  const materials = new Map();
  function material(name) {
    if (!materials.has(name)) materials.set(name, new lt.MeshStandardMaterial());
    return materials.get(name);
  }
  const mark = name => ({ material: material(name), aspect: 2 });
  world = {
    THREE: lt, params: {}, rng: il(4207),
    mats: { get: material, label: mark, decal: mark, emissive: material },
  };
  vector = (x, y, z) => new lt.Vector3(x, y, z);
  world.physics = d3(world);
  world.props = Yg(world);
  const builder = ob(world);
  const expansion = scope.window.createPortExpansion(builder, vector, { rail: false });
  hR(builder);
  fR(builder);
  ab(builder);
  const quay = cb(builder);
  layout = scope.window.createPortBerthLayout(builder, vector, { extraction: { pos: quay.extraction, radius: 2.5 } });
  extendedLayout = scope.window.createPortBerthLayout(builder, vector, {
    extraction: layout.extraction, dispatchPoint: expansion.campaignPoints.archive,
  });
  world.physics.build();
  createBerth = scope.window.createPortBerthChapter;
  campaign = createBerth(world, layout, { onAlarm: event => alarms.push(event) });
});

beforeEach(() => {
  alarms.length = 0;
  campaign.show(true);
  campaign.reset(null);
});

function playerAt(position) {
  const pos = position.clone();
  return { alive: true, pos, eye: pos.clone().add(vector(0, 1.23, 0)) };
}

function update(player, interact = false) {
  player.eye.copy(player.pos).y += 1.23;
  return campaign.update(dt, player, interact);
}

function walk(player, route, { verifyArrival = true } = {}) {
  for (const waypoint of route) {
    for (let frame = 0; frame < 240; frame++) {
      const velocity = waypoint.clone().sub(player.pos);
      velocity.y = 0;
      if (velocity.length() < .045) break;
      velocity.multiplyScalar(10).clampLength(0, 3);
      velocity.y = -.33;
      world.physics.moveCapsule(player.pos, velocity, dt);
      update(player);
    }
    if (verifyArrival) assert.ok(player.pos.distanceTo(waypoint) < .1, `Reached waypoint ${waypoint.toArray()}`);
  }
}

function recover(player) {
  for (let frame = 0; frame < 38; frame++) update(player, true);
  assert.equal(campaign.phase, 'extract');
}

function southLadderPath() {
  return [[28.02, 0, -6.4], [27.93, 0, -2.1], [27.79, 0, .5],
    [28.42, 0, 5.9], [28.4, 0, 15], [28.7, 0, 19]].map(point => vector(...point));
}

test('the waterside maintenance route reaches the dossier and boat with the gate shut', () => {
  const player = playerAt(layout.playerStart.pos);
  assert.deepEqual(Array.from(campaign.markers(), marker => marker.id), ['road', 'water', 'archive']);
  assert.equal(layout.supplies.length, 2);
  assert.ok(layout.supplies.every(cache => cache.pos.distanceTo(player.pos) > 1.7), 'Neither cache is collected at spawn');
  walk(player, layout.routes.water.path);
  recover(player);
  assert.equal(layout.dossier.visible, false);
  assert.equal(campaign.checkpoint.alarm, false);
  assert.equal(campaign.checkpoint.gateOpen, false);
  walk(player, southLadderPath());
  assert.equal(campaign.phase, 'complete');
  assert.equal(alarms.length, 0);
});

test('the truck console raises one alarm and retracts the physical gate', () => {
  const player = playerAt(layout.playerStart.pos);
  const [approach, console, threshold, ...inside] = layout.routes.road.path;
  walk(player, [approach, console, threshold], { verifyArrival: false });
  assert.ok(player.pos.x < threshold.x - .35, 'Closed shutter stops the capsule');
  walk(player, [console]);
  assert.match(update(player).prompt[0], /triggers alarm/);
  for (let frame = 0; frame < 21; frame++) update(player, true);
  assert.equal(campaign.gateOpen, true);
  assert.equal(campaign.alarmed, true);
  assert.equal(campaign.alert(), false);
  assert.equal(alarms.length, 1);
  assert.equal(alarms[0].target, layout.extraction.pos);
  assert.equal(alarms[0].reinforcement, layout.reinforcement);
  for (let frame = 0; frame < 38; frame++) update(player);
  assert.equal(layout.gate.visible, false);
  walk(player, [threshold, ...inside]);
  recover(player);
  assert.equal(campaign.checkpoint.reinforcementCalled, true);
  assert.deepEqual(Array.from(campaign.markers(), marker => marker.id), ['road', 'water', 'extract']);
  walk(player, southLadderPath());
  assert.equal(campaign.phase, 'complete');
  assert.equal(alarms.length, 1);
});

test('an alerted dossier checkpoint restores the route and alarm without calling reinforcement again', () => {
  const west = vector(20.1, 1.2, -7.05), east = vector(22, 1.2, -7.05);
  assert.equal(world.physics.lineOfSight(west, east), false);
  campaign.reset({ phase: 'extract', alarm: true, gateOpen: true, reinforcementCalled: true });
  assert.equal(campaign.resumePosition, layout.archive);
  assert.equal(world.physics.lineOfSight(west, east), true);
  assert.equal(campaign.alert(), false);
  assert.equal(alarms.length, 0);

  campaign.reset(null);
  assert.equal(world.physics.lineOfSight(west, east), false);
  campaign.show(false);
  assert.equal(layout.model.visible, false);
  assert.equal(world.physics.lineOfSight(west, east), true);
  assert.equal(campaign.update(1, playerAt(layout.archive), true), null);
});

test('the story dossier must be verified before the quay can conclude the chapter', () => {
  campaign.show(false);
  const chapter = createBerth(world, layout, { requiresEvidence: true });
  chapter.show(true);
  try {
    const player = playerAt(layout.archive);
    for (let frame = 0; frame < 38; frame++) chapter.update(dt, player, true);
    assert.equal(chapter.phase, 'verify');
    assert.equal(chapter.checkpoint.phase, 'verify');
    const snapshot = chapter.checkpoint;
    const ladder = playerAt(layout.extraction.pos);
    chapter.update(dt, ladder, false);
    assert.equal(chapter.phase, 'verify');
    chapter.reset(snapshot);
    assert.equal(chapter.resumePosition, layout.archive);
    assert.equal(chapter.confirmEvidence(), true);
    assert.equal(chapter.confirmEvidence(), false);
    chapter.update(dt, ladder, false);
    assert.equal(chapter.phase, 'complete');
  } finally {
    chapter.show(false);
  }
});

test('the expanded first chapter keeps the landing entrance and collects the originals across the yard', () => {
  campaign.show(false);
  const chapter = createBerth(world, extendedLayout, { requiresEvidence: true });
  chapter.show(true);
  try {
    const start = playerAt(extendedLayout.playerStart.pos);
    assert.equal(start.pos.x, -32);
    assert.equal(chapter.phase, 'entry');
    assert.equal(chapter.gateOpen, true);
    assert.equal(extendedLayout.gate.visible, false);
    assert.equal(chapter.markers()[0].id, 'entry');
    assert.equal(chapter.markers().some(marker => marker.id === 'range'), false);
    const dispatch = playerAt(extendedLayout.dispatchPoint);
    const board = playerAt(extendedLayout.archive);
    assert.ok(board.pos.distanceTo(dispatch.pos) > 100);
    for (let frame = 0; frame < 40; frame++) chapter.update(dt, board, true);
    assert.equal(chapter.phase, 'archive');
    for (let frame = 0; frame < 40; frame++) chapter.update(dt, dispatch, true);
    assert.equal(chapter.phase, 'verify');
    assert.equal(chapter.confirmEvidence(), true);
    chapter.update(dt, playerAt(extendedLayout.extraction.pos), false);
    assert.equal(chapter.phase, 'complete');
  } finally {
    chapter.show(false);
  }
});
