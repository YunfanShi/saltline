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
