const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const assert = require('node:assert/strict');
const test = require('node:test');

const browser = { window: {} };
runInNewContext(readFileSync(require.resolve('../port-campaign.js'), 'utf8'), browser);
const at = (x, y = 0) => ({ x, y, z: 0 });
const archive = at(-10);
const player = pos => ({ alive: true, pos });

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
  assert.equal(secondTab.next, 'drydock');
  for (const { id } of browser.window.SaltlineCampaign.chapters.slice(2)) {
    assert.equal(continued.finish(id), true);
  }
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

function campaignStorage(initial = []) {
  const saved = new Map(initial);
  return {
    getItem: key => saved.get(key),
    setItem: (key, value) => saved.set(key, value),
    removeItem: key => saved.delete(key),
  };
}

test('berth retry restores the alarm, gate and reinforcement state at archive recovery', () => {
  const storage = campaignStorage();
  const createProgress = () => browser.window.createPortCampaignProgress(storage);
  const progress = createProgress();
  const extract = { phase: 'extract', alarm: true, gateOpen: false, reinforcementCalled: true };
  assert.equal(progress.saveCheckpoint('rail', { phase: 'search' }), false);
  assert.equal(progress.saveCheckpoint('berth', { phase: 'archive' }), false);
  assert.equal(progress.saveCheckpoint('berth', { ...extract, alarm: false }), false);
  assert.equal(progress.saveCheckpoint('berth', extract), true);
  assert.equal(progress.saveCheckpoint('berth', { ...extract, gateOpen: true }), false);
  assert.deepEqual({ ...createProgress().checkpoint('berth') }, extract);
  assert.equal(Object.isFrozen(progress.checkpoint('berth')), true);
  progress.clearCheckpoint('berth');
  assert.equal(createProgress().checkpoint('berth'), null);
  assert.equal(progress.saveCheckpoint('berth', extract), true);
  assert.equal(progress.finish('berth'), true);
  assert.equal(createProgress().checkpoint('berth'), null);
  assert.equal(createProgress().saveCheckpoint('berth', extract), false);
  assert.equal(progress.next, 'rail');
});

test('rail checkpoint advances once per authored stage and preserves the selected route', () => {
  const storage = campaignStorage();
  const createProgress = () => browser.window.createPortCampaignProgress(storage);
  const progress = createProgress();
  progress.finish('berth');
  for (const phase of ['lookout', 'search', 'locate', 'choose']) {
    assert.equal(progress.saveCheckpoint('rail', { phase }), true);
  }
  assert.equal(progress.saveCheckpoint('rail', { phase: 'search' }), false);
  assert.equal(progress.saveCheckpoint('rail', { phase: 'escort', route: 'unknown' }), false);
  assert.equal(progress.saveCheckpoint('rail', { phase: 'escort', route: 'maintenance' }), true);
  const reopened = createProgress();
  assert.equal(reopened.saveCheckpoint('rail', { phase: 'escort', route: 'ramp' }), false);
  assert.deepEqual({ ...reopened.checkpoint('rail') }, { phase: 'escort', route: 'maintenance' });
  assert.equal(reopened.finish('rail'), true);
  assert.equal(createProgress().checkpoint('rail'), null);
  assert.equal(createProgress().status('rail'), 'complete');
});

test('legacy completed chapters stay unlocked and unfinished chapters restart from entry', () => {
  const oldRailKey = 'saltline.campaign.checkpoint.rail';
  const storage = campaignStorage([
    ['saltline.campaign.completed.berth', '1'],
    ['saltline.campaign.checkpoint.berth', 'extract'],
    [oldRailKey, 'detour'],
  ]);
  const createProgress = () => browser.window.createPortCampaignProgress(storage);
  const progress = createProgress();
  assert.equal(progress.status('berth'), 'complete');
  assert.equal(progress.legacyRestart('berth'), false);
  assert.equal(progress.next, 'rail');
  assert.equal(progress.legacyRestart('rail'), true);
  assert.equal(progress.checkpoint('rail'), null);
  const prelude = browser.window.createRailCampaignPrelude({ archive, initialCheckpoint: progress.checkpoint('rail') });
  assert.equal(prelude.phase, 'archive');
  assert.equal(progress.saveCheckpoint('rail', { phase: 'lookout' }), true);
  assert.equal(createProgress().legacyRestart('rail'), false);
  progress.clearCheckpoint('rail');
  assert.equal(storage.getItem(oldRailKey), undefined);
  assert.equal(createProgress().legacyRestart('rail'), false);
});

test('checkpoint parse errors use in-page snapshots and storage denial allows an in-page restart', () => {
  const extract = { phase: 'extract', alarm: false, gateOpen: true, reinforcementCalled: false };
  const berthKey = 'saltline.campaign.checkpoint.v2.berth';
  const storage = campaignStorage([[berthKey, '{']]);
  const progress = browser.window.createPortCampaignProgress(storage);
  assert.equal(progress.checkpoint('berth'), null);
  assert.equal(progress.saveCheckpoint('berth', extract), true);
  storage.setItem(berthKey, '');
  assert.deepEqual({ ...progress.checkpoint('berth') }, extract);
  storage.setItem(berthKey, JSON.stringify(extract));
  storage.removeItem = () => { throw new Error('denied'); };
  progress.clearCheckpoint('berth');
  assert.equal(progress.checkpoint('berth'), null);
  assert.equal(progress.saveCheckpoint('berth', { ...extract, gateOpen: false }), true);
  assert.equal(progress.checkpoint('berth').gateOpen, false);
});

test('the catalog orders nine chapters with a 270 minute design target', () => {
  const { chapters } = browser.window.SaltlineCampaign;
  assert.deepEqual(Array.from(chapters, item => item.id), [
    'berth', 'rail', 'drydock', 'tidegate', 'anchorage', 'return-harbor', 'night-record', 'last-pilot', 'reopen',
  ]);
  assert.equal(chapters.reduce((minutes, item) => minutes + item.minutes, 0), 270);
  for (const item of chapters) {
    assert.equal(item.title.length, 2);
    assert.equal(item.location.length, 2);
    assert.equal(item.description.length, 2);
    assert.match(item.time, /^\d{2}:\d{2}$/);
  }
});

test('an ending survives interruption and its single commit opens the next chapter without replay', () => {
  const storage = campaignStorage();
  const writes = [];
  const store = storage.setItem;
  storage.setItem = (key, value) => {
    writes.push([key, JSON.parse(value)]);
    store(key, value);
  };
  const create = () => browser.window.createPortCampaignProgress(storage);
  const progress = create();
  const initial = { phase: 'verify', alarm: true, gateOpen: true, reinforcementCalled: true };
  const savedPose = { pos: [5, 1, -3], yaw: 1.5, pitch: .1 };
  assert.equal(progress.saveCheckpoint('berth', initial), true);
  assert.equal(progress.beginEnding('rail', savedPose), false);
  assert.equal(progress.beginEnding('berth', { ...savedPose, pos: [NaN, 0, 0] }), false);
  assert.equal(progress.beginEnding('berth', savedPose), true);
  savedPose.pos[0] = 999;
  const resumed = create();
  assert.equal(resumed.next, 'berth');
  assert.equal(resumed.mode('rail'), null);
  assert.equal(resumed.mode('berth'), 'story');
  assert.equal(resumed.pendingEnding('rail'), null);
  const pending = resumed.pendingEnding('berth');
  assert.equal(pending.id, 'berth');
  assert.deepEqual(Array.from(pending.snapshot.pos), [5, 1, -3]);
  assert.equal(resumed.beginEnding('berth'), false);
  assert.equal(resumed.saveCheckpoint('berth', { ...initial, phase: 'extract' }), false);
  const before = writes.length;
  assert.equal(resumed.finish('berth'), true);
  assert.equal(writes.length, before + 1);
  assert.deepEqual(writes.at(-1), ['saltline.campaign.progress.v3', {
    version: 3, completed: 1, checkpoint: null, ending: null,
  }]);
  assert.equal(progress.next, 'rail');
  assert.equal(progress.pendingEnding(), null);
  assert.equal(progress.mode('berth'), 'replay');
  assert.equal(progress.beginEnding('berth'), false);
  assert.equal(progress.finish('berth'), false);
});

test('migrates completed chapters and newer legacy checkpoints into the single record', () => {
  const storage = campaignStorage([
    ['saltline.campaign.completed.berth', '1'],
    ['saltline.campaign.checkpoint.v2.rail', JSON.stringify({ phase: 'escort', route: 'maintenance' })],
  ]);
  const progress = browser.window.createPortCampaignProgress(storage);
  assert.equal(progress.next, 'rail');
  assert.deepEqual({ ...progress.checkpoint('rail') }, { phase: 'escort', route: 'maintenance' });
  assert.equal(progress.beginEnding('rail'), true);
  assert.equal(progress.finish('rail'), true);
  const continued = browser.window.createPortCampaignProgress(storage);
  assert.equal(continued.next, 'drydock');
  assert.equal(continued.pendingEnding(), null);
  assert.equal(continued.checkpoint('rail'), null);
});

test('continuation checkpoints restore immutable authored payloads without stage regression', () => {
  const storage = campaignStorage([
    ['saltline.campaign.completed.berth', '1'],
    ['saltline.campaign.completed.rail', '1'],
  ]);
  const create = () => browser.window.createPortCampaignProgress(storage);
  const progress = create();
  const event = { phase: 'flood', stage: 1, route: 'upper', survivors: [{ id: 'welder', saved: true }] };
  assert.equal(progress.saveCheckpoint('drydock', event), true);
  event.survivors[0].saved = false;
  assert.equal(progress.saveCheckpoint('drydock', { ...event, stage: 0 }), false);
  assert.equal(progress.saveCheckpoint('drydock', { ...event, stage: 1.5 }), false);
  const restored = create().checkpoint('drydock');
  assert.equal(restored.route, 'upper');
  assert.equal(restored.survivors[0].saved, true);
  assert.equal(Object.isFrozen(restored.survivors[0]), true);
  assert.equal(progress.saveCheckpoint('drydock', { phase: 'bridge', stage: 2 }), true);
  assert.equal(create().checkpoint('drydock').phase, 'bridge');
});

test('corrupt legacy checkpoint leaves legacy completion flags usable', () => {
  const storage = campaignStorage([
    ['saltline.campaign.completed.berth', '1'],
    ['saltline.campaign.checkpoint.v2.rail', '{'],
    ['saltline.campaign.progress.v3', '{'],
  ]);
  const progress = browser.window.createPortCampaignProgress(storage);
  assert.equal(progress.next, 'rail');
  assert.equal(progress.checkpoint('rail'), null);
});

test('berth evidence demands both documents and survives a verified snapshot', () => {
  const { createEvidence } = browser.window.SaltlineCampaign;
  const evidence = createEvidence('berth');
  assert.equal(evidence.collect('evacuation'), true);
  assert.equal(evidence.collect('evacuation'), false);
  assert.equal(evidence.collect('unknown'), false);
  assert.equal(evidence.verify(['shift-log', 'evacuation']), false);
  assert.equal(evidence.collect('shift-log'), true);
  assert.equal(evidence.verify(['shift-log', 'shift-log']), false);
  assert.equal(evidence.verify(['shift-log', 'evacuation']), true);
  assert.equal(createEvidence('berth', evidence.snapshot).verified, true);
  assert.equal(createEvidence('berth', { collected: ['shift-log'], verified: true }).verified, false);
  assert.deepEqual(Array.from(evidence.clues, item => item.time), ['05:31', '05:34']);
  assert.equal(evidence.clues[0].identity[0], evidence.clues[1].identity[0]);
});

test('drydock and tower evidence checks chronological order without consuming clues', () => {
  const { createEvidence } = browser.window.SaltlineCampaign;
  for (const id of ['drydock', 'night-record']) {
    const evidence = createEvidence(id);
    const assigned = Array.from(evidence.clues, item => item.id);
    assert.equal(evidence.verify(assigned), false);
    assigned.forEach(value => evidence.collect(value));
    assert.equal(evidence.verify(assigned), false);
    assert.equal(evidence.verified, false);
    const correct = [...evidence.clues].sort((a, b) => a.time.localeCompare(b.time)).map(item => item.id);
    assert.equal(evidence.verify(correct), true);
    assert.equal(evidence.verified, true);
  }
  assert.equal(createEvidence('constructor').verify([]), false);
});

test('rail prelude requires a visible manifest and triggers cinematic and rescue transitions once', () => {
  const prelude = browser.window.createRailCampaignPrelude({ archive, recoverySeconds: 1 });
  assert.equal(prelude.phase, 'archive');
  assert.equal(prelude.rescueComplete(), false);
  assert.equal(prelude.transportCrashed(), false);
  assert.equal(prelude.update(.5, player(archive), true).progress, .5);
  assert.equal(prelude.update(.5, player(archive), true, { canInteract: false }), null);
  assert.equal(prelude.update(.5, player(archive), true).progress, .5);
  assert.equal(prelude.update(.5, player(archive), true), null);
  assert.deepEqual({ ...prelude.snapshot }, { phase: 'lookout' });
  assert.equal(prelude.transportCrashed(), true);
  assert.equal(prelude.transportCrashed(), false);
  assert.equal(prelude.snapshot, null);
  assert.equal(prelude.rescueComplete(), true);
  assert.equal(prelude.rescueComplete(), false);
  assert.equal(prelude.phase, 'complete');
});

test('rail retry skips a finished crash but can resume before the first viewing', () => {
  const preludeAt = initialCheckpoint => browser.window.createRailCampaignPrelude({ archive, initialCheckpoint });
  assert.equal(preludeAt({ phase: 'lookout' }).phase, 'lookout');
  for (const phase of ['search', 'locate', 'choose', 'escort']) {
    const resumed = preludeAt({ phase, route: 'ramp' });
    assert.equal(resumed.phase, 'rescue');
    assert.equal(resumed.transportCrashed(), false);
  }
  assert.equal(preludeAt({ phase: 'escort', route: 'invalid' }).phase, 'archive');
  assert.equal(preludeAt({ phase: 'extract' }).phase, 'archive');
});

test('a new tab retains the latest valid checkpoint when another tab offers an earlier stage', () => {
  const saved = new Map();
  const storage = {
    getItem: key => saved.get(key),
    setItem: (key, value) => saved.set(key, value),
    removeItem: key => saved.delete(key),
  };

  const progress = browser.window.createPortCampaignProgress(storage);
  const secondTab = browser.window.createPortCampaignProgress(storage);
  progress.finish('berth');
  progress.saveCheckpoint('rail', { phase: 'choose' });
  assert.equal(secondTab.saveCheckpoint('rail', { phase: 'locate' }), false);
  assert.equal(secondTab.checkpoint('rail').phase, 'choose');
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
