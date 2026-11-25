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

test('Open-World Battlefield Campaign exposes 8 sequential acts with cover art', () => {
  assert.equal(OPEN_WORLD_ACTS.length, 8);
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
  assert.equal(progress.status('ow-7'), 'locked');
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

  // Complete remaining acts 1..7
  for (let i = 1; i < 8; i++) reloaded.completeStage(i);
  assert.equal(reloaded.completedCount, 8);
  assert.equal(reloaded.next, null);
  assert.equal(reloaded.nextIndex, 8);
  for (let i = 0; i < 8; i++) {
    assert.equal(reloaded.status(`ow-${i}`), 'complete');
  }

  // Reset restores initial state
  reloaded.reset();
  assert.equal(reloaded.completedCount, 0);
  assert.equal(reloaded.next, 'ow-0');
  assert.equal(reloaded.status('ow-0'), 'next');
  assert.equal(reloaded.status('ow-1'), 'locked');
});
