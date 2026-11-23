const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const assert = require('node:assert/strict');
const test = require('node:test');

const browser = { window: {} };
runInNewContext(readFileSync(require.resolve('../port-campaign.js'), 'utf8'), browser);
const at = (x, y = 0) => ({ x, y, z: 0 });
const archive = at(-10);
const beacon = at(10);
const extraction = { pos: at(25), radius: 2.5 };
const player = pos => ({ alive: true, pos });
const start = options => browser.window.createPortCampaign({ archive, beacon, extraction, ...options });

test('the dispatch archive requires cutting all relays and a continuous nearby interaction', () => {
  const mission = start();
  mission.update(20, player(archive), true);
  assert.equal(mission.phase, 'relays');
  assert.equal(mission.relaysCut(), true);
  assert.equal(mission.relaysCut(), false);
  assert.equal(mission.update(2, player(archive), true).progress, 2 / 3);
  assert.equal(mission.update(1, player(archive), false).progress, 0);
  mission.update(2, player(archive), true);
  mission.update(2, player(at(archive.x, 3)), true);
  assert.equal(mission.update(1, player(archive), true).progress, 1 / 3);
  mission.update(2, player(archive), true);
  assert.equal(mission.phase, 'beacon');
});

test('upload requires activation and only counts living players within beacon range', () => {
  const mission = start();
  mission.relaysCut();
  mission.update(3, player(archive), true);
  assert.equal(mission.update(30, player(beacon), false).prompt, 'start');
  mission.update(30, player(extraction.pos), true);
  assert.equal(mission.phase, 'beacon');
  mission.update(1, player(beacon), true);
  assert.equal(mission.phase, 'defend');
  assert.equal(mission.update(6, player(beacon), false).seconds, 12);
  const disconnected = mission.update(25, player(at(beacon.x, 4)), false);
  assert.equal(disconnected.uploading, false);
  assert.equal(disconnected.seconds, 12);
  mission.update(30, { alive: false, pos: beacon }, false);
  assert.equal(mission.phase, 'defend');
  mission.update(12, player(beacon), false);
  assert.equal(mission.phase, 'extract');
});

test('the boat completes the campaign only after upload and within boarding range', () => {
  const mission = start();
  mission.relaysCut();
  mission.update(999, player(extraction.pos), true);
  assert.equal(mission.phase, 'archive');
  mission.update(3, player(archive), true);
  mission.update(1, player(beacon), true);
  mission.update(18, player(beacon), false);
  mission.update(1, player(at(extraction.pos.x, 5)), true);
  assert.equal(mission.phase, 'extract');
  mission.update(1, player(extraction.pos), false);
  assert.equal(mission.phase, 'complete');
  assert.equal(mission.relaysCut(), false);
  assert.equal(start().phase, 'relays');
});

test('chapters can set their recovery and upload durations', () => {
  const mission = start({ recoverySeconds: 5, uploadSeconds: 12 });
  assert.equal(mission.uploadSeconds, 12);
  mission.relaysCut();
  assert.equal(mission.update(3, player(archive), true).progress, 3 / 5);
  mission.update(2, player(archive), true);
  assert.equal(mission.phase, 'beacon');
  mission.update(1, player(beacon), true);
  assert.equal(mission.update(6, player(beacon), false).seconds, 6);
  mission.update(6, player(beacon), false);
  assert.equal(mission.phase, 'extract');
});

test('occlusion resets archive recovery and prevents initiating the upload', () => {
  const mission = start();
  const occluded = { canInteract: false };
  mission.relaysCut();
  mission.update(2, player(archive), true);
  assert.equal(mission.update(2, player(archive), true, occluded), null);
  assert.equal(mission.update(2, player(archive), true).progress, 2 / 3);
  mission.update(1, player(archive), true);
  assert.equal(mission.update(1, player(beacon), true, occluded), null);
  assert.equal(mission.phase, 'beacon');
  mission.update(1, player(beacon), true);
  mission.update(18, player(beacon), false, occluded);
  assert.equal(mission.phase, 'extract');
});

test('the rail chapter starts at the manifest and restores power without a relay or defense phase', () => {
  const mission = start({ mission: 'rail', recoverySeconds: 1, breakerSeconds: 2 });
  assert.equal(mission.phase, 'archive');
  assert.equal(mission.relaysCut(), false);
  mission.update(3, player(beacon), true);
  assert.equal(mission.phase, 'archive');
  assert.equal(mission.update(.5, player(archive), true).progress, .5);
  mission.update(.5, player(archive), true);
  assert.equal(mission.phase, 'beacon');
  assert.equal(mission.update(1, player(beacon), true).progress, .5);
  mission.update(1, player(beacon), true, { canInteract: false });
  assert.equal(mission.update(1, player(beacon), true).progress, .5);
  mission.update(1, player(beacon), true);
  assert.equal(mission.phase, 'extract');
  mission.update(.1, player(extraction.pos), false);
  assert.equal(mission.phase, 'complete');
});

test('rail checkpoints still restore the manifest, breaker or extraction stage', () => {
  for (const phase of ['archive', 'beacon', 'extract']) {
    assert.equal(start({ mission: 'rail', initialPhase: phase }).phase, phase);
  }
});

test('ammo caches top up reserve once and remain available if approached with a full reserve', () => {
  const sites = [{ id: 'supply-one', pos: at(0), rounds: 60 }, { id: 'supply-two', pos: at(8), rounds: 30 }];
  const newSupplies = () => browser.window.createCampaignSupplies(sites, { reserveCap: 100 });
  const supplies = newSupplies();
  assert.equal(supplies.collect(player(at(0)), 100), null);
  assert.equal(supplies.caches[0].used, false);
  assert.equal(supplies.collect(player(at(0, 2)), 75), null);
  assert.equal(supplies.collect({ alive: false, pos: at(0) }, 75), null);
  assert.equal(supplies.collect(player(at(0)), 75, { canCollect: () => false }), null);
  const first = supplies.collect(player(at(0)), 75);
  assert.equal(first.id, 'supply-one');
  assert.equal(first.rounds, 25);
  assert.equal(supplies.caches[0].used, true);
  assert.equal(supplies.collect(player(at(0)), 0), null);
  assert.equal(supplies.collect(player(at(8)), 0).rounds, 30);
  assert.equal(supplies.collect(player(at(8)), 0), null);
  assert.equal(newSupplies().collect(player(at(0)), 0).rounds, 60);
});

test('campaign progress unlocks chapters in order and survives a reload', () => {
  const saved = new Map();
  const storage = {
    getItem: key => saved.get(key),
    setItem: (key, value) => saved.set(key, value),
  };
  const createProgress = () => browser.window.createPortCampaignProgress(storage);
  const fresh = createProgress();
  const secondTab = createProgress();
  assert.equal(secondTab.next, 'berth');
  assert.equal(fresh.next, 'berth');
  assert.equal(fresh.status('rail'), 'locked');
  assert.equal(fresh.finish('rail'), false);
  assert.equal(fresh.finish('berth'), true);
  assert.equal(fresh.next, 'rail');
  assert.equal(fresh.finish('berth'), false);

  const continued = createProgress();
  assert.equal(continued.status('berth'), 'complete');
  assert.equal(continued.status('rail'), 'next');
  assert.equal(continued.finish('rail'), true);
  assert.equal(continued.finish(undefined), false);
  assert.equal(secondTab.finish('berth'), false);
  assert.equal(secondTab.next, null);
  const completed = createProgress();
  assert.equal(completed.next, null);
  assert.equal(completed.status('rail'), 'complete');
  assert.equal(completed.status('unknown'), 'locked');
});

test('invalid campaign saves reset to chapter one and storage errors preserve in-page progress', () => {
  const corrupted = browser.window.createPortCampaignProgress({ getItem: () => '99' });
  assert.equal(corrupted.next, 'berth');
  const unavailable = browser.window.createPortCampaignProgress({
    getItem() { throw new Error('denied'); },
    setItem() { throw new Error('denied'); },
  });
  assert.equal(unavailable.finish('berth'), true);
  assert.equal(unavailable.next, 'rail');
});

test('checkpoint saves survive reload, only advance, and clear on restart or chapter completion', () => {
  const saved = new Map();
  const storage = {
    getItem: key => saved.get(key),
    setItem: (key, value) => saved.set(key, value),
    removeItem: key => saved.delete(key),
  };

  const progress = browser.window.createPortCampaignProgress(storage);
  progress.saveCheckpoint('rail', 'archive');
  assert.equal(progress.checkpoint('rail'), null);
  progress.saveCheckpoint('berth', 'beacon');
  progress.saveCheckpoint('berth', 'archive');
  progress.saveCheckpoint('berth', 'defend');
  const reopened = browser.window.createPortCampaignProgress(storage);
  assert.equal(reopened.checkpoint('berth'), 'beacon');
  const resumed = browser.window.createPortCampaign({ archive, beacon, extraction, initialPhase: reopened.checkpoint('berth') });
  assert.equal(resumed.phase, 'beacon');
  assert.equal(resumed.relaysCut(), false);
  reopened.clearCheckpoint('berth');
  assert.equal(browser.window.createPortCampaignProgress(storage).checkpoint('berth'), null);
  reopened.saveCheckpoint('berth', 'extract');
  reopened.finish('berth');
  assert.equal(reopened.checkpoint('berth'), null);
  assert.equal(reopened.checkpoint('rail'), null);
});

test('cinematic playback advances to the exact end and resolves one time', () => {
  const director = browser.window.createPortCinematicDirector();
  const frames = [];
  const finishes = [];
  const sequence = {
    id: 'transport', duration: 12.5,
    onFrame: (time, dt) => frames.push([time, dt]),
    onFinish: reason => finishes.push(reason),
  };
  assert.equal(director.play(sequence), true);
  assert.equal(director.play(sequence), false);
  assert.equal(director.id, 'transport');
  assert.equal(director.active, true);
  director.update(-1);
  director.update(4);
  director.update(20);
  assert.deepEqual(frames, [[0, 0], [4, 4], [12.5, 8.5]]);
  assert.deepEqual(finishes, ['complete']);
  assert.equal(director.active, false);
  assert.equal(director.skip(), false);
  assert.equal(director.cancel(), false);
});

test('skipping and cancelling release the director and never re-run the finished sequence', () => {
  const director = browser.window.createPortCinematicDirector();
  const frames = [];
  const finishes = [];
  const sequence = {
    id: 'transport', duration: 12,
    onFrame: time => frames.push(time),
    onFinish: reason => finishes.push(reason),
  };
  director.play(sequence);
  director.update(2);
  assert.equal(director.skip(), true);
  director.update(20);
  director.play(sequence);
  assert.equal(director.cancel(), true);
  director.update(20);
  assert.deepEqual(frames, [0, 2, 0]);
  assert.deepEqual(finishes, ['skip', 'cancel']);
});

test('the rail mission waits for the crash and routes through the diversion before allowing gate power', () => {
  const diversion = at(-30);
  const mission = start({ mission: 'rail', diversion });
  assert.equal(mission.transportCrashed(), false);
  mission.update(2, player(archive), true);
  assert.equal(mission.phase, 'lookout');
  mission.update(6, player(beacon), true);
  assert.equal(mission.phase, 'lookout');
  assert.equal(mission.transportCrashed(), true);
  assert.equal(mission.transportCrashed(), false);
  assert.equal(mission.phase, 'detour');
  mission.update(3, player(beacon), true);
  mission.update(1, player(at(-30, 3)), false);
  assert.equal(mission.phase, 'detour');
  mission.update(1, player(diversion), false);
  assert.equal(mission.phase, 'beacon');
  mission.update(3, player(beacon), true);
  assert.equal(mission.phase, 'extract');
  for (const phase of ['lookout', 'detour', 'beacon', 'extract']) {
    assert.equal(start({ mission: 'rail', diversion, initialPhase: phase }).phase, phase);
  }
});
