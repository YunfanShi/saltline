const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const assert = require('node:assert/strict');
const test = require('node:test');

const scope = { window: {} };
for (const file of ['../port-campaign.js', '../port-prologue.js']) {
  runInNewContext(readFileSync(require.resolve(file), 'utf8'), scope);
}
const { createPortCampaignProgress, createPortPrologueProgress, createPortPrologueChapter } = scope.window;
const prologueKey = 'saltline.campaign.prologue.v1';
const campaignKey = 'saltline.campaign.progress.v3';

function storage(initial = []) {
  const data = new Map(initial);
  return {
    getItem: key => data.get(key),
    setItem: (key, value) => data.set(key, value),
  };
}

const at = (x, z = 0, y = 0) => ({ x, y, z });
const player = pos => ({ alive: true, pos });
function setup({ mode, saved = storage(), raycast = () => null } = {}) {
  const campaign = createPortCampaignProgress(saved);
  const progress = createPortPrologueProgress(campaign, saved);
  const points = {
    briefing: at(0, 9), boarding: at(24, 6), range: at(-7, -8), ammo: at(-8, -5), trainingExit: at(10, 4),
  };
  const hits = new Map();
  const targets = [
    { id: 'close', center: at(-2, -8, 1.52), setHit: value => hits.set('close', value) },
    { id: 'middle', center: at(8, -6, 1.52), radius: .44, setHit: value => hits.set('middle', value) },
  ];
  const chapter = createPortPrologueChapter({ physics: { raycast } }, { points, targets }, { progress, mode });
  return { campaign, progress, chapter, points, hits, saved, targets };
}

test('new story starts at HQ and moves to Berth only after landing is recorded', () => {
  const { campaign, progress, saved } = setup();
  const secondTab = createPortPrologueProgress(campaign, saved);
  assert.equal(campaign.next, 'berth');
  assert.equal(progress.needsPrologue, true);
  assert.equal(progress.record('boarding'), false);
  assert.equal(progress.record('briefed'), true);
  assert.equal(secondTab.phase, 'briefed');
  assert.equal(secondTab.record('briefed'), false);
  assert.equal(secondTab.record('boarding'), true);
  assert.equal(progress.needsPrologue, true);
  assert.equal(progress.phase, 'boarding');
  assert.equal(progress.record('landed'), true);
  assert.equal(secondTab.needsPrologue, false);
  assert.equal(campaign.next, 'berth');
  assert.equal(saved.getItem(campaignKey), undefined);
});

test('legacy, current, and chapter-ending saves resume directly in the campaign', () => {
  const checkpoint = { phase: 'archive', alarm: false, gateOpen: true, reinforcementCalled: false };
  for (const records of [
    [['saltline.campaign.completed.berth', '1']],
    [['saltline.campaign.checkpoint.berth', 'archive']],
    [['saltline.campaign.checkpoint.v2.berth', JSON.stringify(checkpoint)]],
    [[campaignKey, JSON.stringify({ version: 3, completed: 0, checkpoint, ending: null })]],
    [[campaignKey, JSON.stringify({ version: 3, completed: 0, checkpoint: null, ending: { id: 'berth', snapshot: null } })]],
  ]) {
    const saved = storage(records);
    const { progress } = setup({ saved });
    assert.equal(progress.needsPrologue, false);
    assert.equal(progress.record('briefed'), false);
    for (const [key, data] of records) assert.equal(saved.getItem(key), data);
    assert.equal(saved.getItem(prologueKey), undefined);
  }
});

test('malformed or unavailable saves still support in-page progress', () => {
  for (const saved of [
    storage([[prologueKey, '{broken']]),
    storage([[prologueKey, JSON.stringify({ version: 7, phase: 'landed' })]]),
    { getItem() { throw new Error('offline'); }, setItem() { throw new Error('offline'); } },
  ]) {
    const { progress } = setup({ saved });
    assert.equal(progress.phase, 'unstarted');
    assert.equal(progress.record('briefed'), true);
    assert.equal(progress.record('boarding'), true);
    assert.equal(progress.record('landed'), true);
    assert.equal(progress.needsPrologue, false);
  }
});

test('briefing is required to board, while training remains optional', () => {
  const { chapter, progress, points } = setup();
  assert.equal(chapter.update(1, player(points.boarding), true), null);
  assert.equal(chapter.update(.2, player(points.briefing), true).progress < 1, true);
  assert.equal(chapter.update(.6, player(points.briefing), false).progress, 0);
  const found = chapter.update(.65, player(points.briefing), true);
  assert.equal(found.event, 'briefed');
  assert.match(found.radio[0], /seventeen/);
  assert.equal(progress.phase, 'briefed');
  assert.equal(chapter.update(.65, player(points.boarding), true).event, 'board');
  assert.equal(progress.phase, 'boarding');
  assert.equal(chapter.update(1, player(points.boarding), true), null);
  assert.equal(chapter.training.complete, false);
});

test('re-entering the game restores the completed briefing or boarding checkpoint', () => {
  const { chapter, progress, points, saved } = setup();
  chapter.update(1, player(points.briefing), true);
  let reopened = setup({ saved });
  assert.equal(reopened.chapter.phase, 'briefed');
  assert.equal(reopened.chapter.resumePosition, reopened.points.briefing);
  reopened.chapter.update(1, player(reopened.points.boarding), true);
  assert.equal(progress.phase, 'boarding');
  reopened = setup({ saved });
  assert.equal(reopened.chapter.resumePosition, reopened.points.boarding);
  assert.equal(reopened.chapter.update(1, player(reopened.points.boarding), true).event, 'board');
  assert.equal(reopened.chapter.update(1, player(reopened.points.boarding), true), null);
});

test('standalone training teaches movement, targeting, weapon actions and the terminal without advancing the story', () => {
  const { chapter, saved, points, hits, targets } = setup({ mode: 'range' });
  assert.equal(chapter.resumePosition, points.range);
  assert.equal(chapter.training.step, 'move');
  chapter.update(.1, player(points.range), false);
  chapter.update(.1, player(at(-5.3, -8)), false);
  assert.equal(chapter.training.step, 'aim');
  assert.equal(chapter.note('aim'), true);
  const origin = at(-7, -8, 1.52);
  for (const { id, center } of targets) {
    const shot = { origin, dir: at(center.x - origin.x, center.z - origin.z, center.y - origin.y) };
    assert.equal(chapter.trainingHit(shot), true);
    assert.equal(hits.get(id), true);
    assert.equal(chapter.trainingHit(shot), false);
  }
  for (const item of ['switch', 'reload', 'terminal']) {
    assert.equal(chapter.training.step, item);
    assert.equal(chapter.note(item), true);
  }
  assert.equal(chapter.training.complete, true);
  assert.equal(chapter.update(1, player(points.boarding), true).event, undefined);
  assert.equal(chapter.update(1, player(points.trainingExit), true).event, 'exit');
  assert.equal(saved.getItem(prologueKey), undefined);
  chapter.reset('range');
  assert.equal(hits.get('close'), false);
  assert.equal(chapter.training.step, 'move');
});

test('a wall or a shot outside the range cannot register a training hit', () => {
  let blocker = 'wall';
  const { chapter } = setup({ mode: 'range', raycast: () => ({ box: { tag: blocker } }) });
  const shot = { origin: at(-7, -8, 1.52), dir: at(1) };
  assert.equal(chapter.trainingHit(shot), false);
  blocker = 'close';
  assert.equal(chapter.trainingHit({ ...shot, origin: at(-17, -8, 1.52) }), false);
  assert.equal(chapter.trainingHit(shot), true);
  assert.equal(chapter.training.hits, 1);
});

test('replaying the prologue starts from briefing and preserves main-campaign data', () => {
  const { chapter, progress, campaign, saved, points } = setup();
  progress.record('briefed');
  progress.record('boarding');
  progress.record('landed');
  campaign.finish('berth');
  const previous = saved.getItem(campaignKey);
  chapter.reset('replay');
  assert.equal(chapter.phase, 'briefing');
  assert.equal(chapter.resumePosition, null);
  assert.equal(chapter.update(1, player(points.briefing), true).event, 'briefed');
  assert.equal(chapter.update(1, player(points.boarding), true).event, 'board');
  assert.equal(progress.phase, 'landed');
  assert.equal(saved.getItem(campaignKey), previous);
});

test('resupply in story or range repeats only after a fresh interaction', () => {
  for (const mode of ['story', 'range']) {
    const { chapter, progress, points } = setup({ mode });
    if (mode === 'story') {
      assert.equal(chapter.update(1, player(points.ammo), true), null);
      assert.equal(chapter.update(.65, player(points.briefing), true).event, 'briefed');
    }
    const expectedPhase = mode === 'story' ? 'briefed' : 'unstarted';
    assert.equal(chapter.update(.5, player(points.ammo), true).event, 'resupply');
    assert.equal(chapter.update(1, player(points.ammo), true), null);
    chapter.update(.1, player(points.ammo), false);
    assert.equal(chapter.update(.5, player(points.ammo), true).event, 'resupply');
    assert.equal(progress.phase, expectedPhase);
  }
});
