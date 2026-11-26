const test = require('node:test');
const assert = require('node:assert/strict');
const {
  OPEN_WORLD_ACTS,
  createOpenWorldCampaignProgress,
  OPEN_WORLD_STORAGE_KEY,
} = require('../port-open-world-district.js');

function makeStorage() {
  const map = new Map();
  return {
    getItem: key => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: key => map.delete(key),
    _map: map,
  };
}

test('Open-World Battlefield Campaign exposes 12 sequential acts with cover art', () => {
  assert.equal(OPEN_WORLD_ACTS.length, 12);
  OPEN_WORLD_ACTS.forEach((act, idx) => {
    assert.equal(act.id, `ow-${idx}`);
    assert.equal(act.stage, idx);
    assert.ok(Array.isArray(act.title) && act.title.length === 2);
    assert.ok(Array.isArray(act.description) && act.description.length === 2);
    assert.ok(typeof act.art === 'string' && act.art.startsWith('./art/campaign-'));
  });
});

test('Open-World Campaign progress unlocks acts sequentially and persists across reloads', () => {
  const storage = makeStorage();
  const progress = createOpenWorldCampaignProgress(storage);

  assert.equal(progress.next, 'ow-0');
  assert.equal(progress.nextIndex, 0);
  assert.equal(progress.status('ow-0'), 'next');
  assert.equal(progress.status('ow-1'), 'locked');
  assert.equal(progress.status('ow-11'), 'locked');
  assert.equal(progress.status('invalid'), 'locked');

  progress.completeStage(0);
  assert.equal(progress.status('ow-0'), 'complete');
  assert.equal(progress.status('ow-1'), 'next');
  assert.equal(progress.status('ow-2'), 'locked');
  assert.equal(progress.next, 'ow-1');
  assert.equal(progress.completedCount, 1);
  assert.ok(storage._map.has(OPEN_WORLD_STORAGE_KEY));

  // Simulate page reload with same storage
  const reloaded = createOpenWorldCampaignProgress(storage);
  assert.equal(reloaded.status('ow-0'), 'complete');
  assert.equal(reloaded.status('ow-1'), 'next');
  assert.equal(reloaded.next, 'ow-1');

  // Complete remaining acts 1..11
  for (let i = 1; i < 12; i++) reloaded.completeStage(i);
  assert.equal(reloaded.completedCount, 12);
  assert.equal(reloaded.next, null);
  assert.equal(reloaded.nextIndex, 12);
  for (let i = 0; i < 12; i++) {
    assert.equal(reloaded.status(`ow-${i}`), 'complete');
  }

  // Reset restores initial state
  reloaded.reset();
  assert.equal(reloaded.completedCount, 0);
  assert.equal(reloaded.next, 'ow-0');
  assert.equal(reloaded.status('ow-0'), 'next');
  assert.equal(reloaded.status('ow-1'), 'locked');
});

test('open-world mission guidance covers all 12 acts and clears after completion or free roam', () => {
  const source = require('node:fs').readFileSync(require.resolve('../port-open-world-district.js'), 'utf8');
  const start = source.indexOf('    function currentObjectiveInfo() {');
  const end = source.indexOf('\n    function update(dt, playerPos)', start);
  assert.ok(start >= 0 && end > start);
  const makeInfo = require('node:vm').runInNewContext(`(freeRoam, cityCampaignActive, stage) => {
    const OPEN_WORLD_ACTS = Array.from({ length: 12 });
    const isMultiplayer = () => false;
    const shootTargets = [];
    const tsunamiSurviveClock = 0;
    class Vector3 { constructor(x, y, z) { Object.assign(this, { x, y, z }); } }
    const POS_ANCHORAGE_EVAC = new Vector3(16, 0.5, 86);
    const POS_PRECINCT = new Vector3(-10, 0.5, -56);
    const POS_HIGHWAY_CONVOY = new Vector3(-130, 0.5, -172);
    ${source.slice(start, end)}
    return currentObjectiveInfo();
  }`);
  for (let st = 0; st < 12; st++) {
    assert.ok(makeInfo(false, true, st).en, `stage ${st} should expose an objective`);
  }
  for (const [roam, active, stage] of [[true, false, 1], [false, false, 1], [false, true, 12]]) {
    const info = makeInfo(roam, active, stage);
    assert.equal(info.en, '');
    assert.equal(info.zh, '');
    assert.equal(info.pos, null);
  }
});

test('ChunkManager warmUpSync and warmUpAsync pre-build nearby sectors before entering map', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const vm = require('node:vm');
  const code = fs.readFileSync(path.join(__dirname, '..', 'WorldEngine', 'Performance', 'ChunkManager.js'), 'utf8');
  const sandbox = { window: {}, performance: { now: () => Date.now() }, setTimeout };
  vm.runInNewContext(code, sandbox);
  const makeVec = (x, y, z) => ({ x, y, z, distanceTo(o) { return Math.hypot(x - o.x, y - o.y, z - o.z); } });
  let stepsA = 0;
  let stepsB = 0;
  const secNear = {
    id: 'near', center: makeVec(10, 0, 10), streamRadius: 245, detailRadius: 190,
    shell: { visible: false }, detail: { visible: false }, loaded: false, detailed: false,
    onBuild() { stepsA++; return stepsA >= 2; },
  };
  const secFar = {
    id: 'far', center: makeVec(500, 0, 500), streamRadius: 245, detailRadius: 190,
    shell: { visible: false }, detail: { visible: false }, loaded: false, detailed: false,
    onBuild() { stepsB++; return true; },
  };
  const mgr = sandbox.window.WorldEngine.createChunkManager({ sectors: [secNear, secFar], quality: 'medium', manageResolution: false });
  const progressEvents = [];
  const res = await mgr.warmUpAsync(makeVec(0, 0, 0), { onProgress: (pct, msg) => progressEvents.push({ pct, msg }) });
  assert.equal(res.built, 1);
  assert.equal(secNear.loaded, true);
  assert.equal(secNear.detailed, true);
  assert.equal(secFar.loaded, false);
  assert.ok(progressEvents.some(e => e.pct === 1));
});
