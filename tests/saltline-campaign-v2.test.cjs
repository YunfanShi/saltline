'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');

function loadBrowserScript(relPath, sandbox) {
  const code = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  vm.runInContext(code, sandbox, { filename: relPath });
}

function makeSandbox() {
  const storage = new Map();
  const sandbox = {
    console,
    Math,
    Date,
    JSON,
    Map,
    Set,
    Array,
    Object,
    Number,
    String,
    Boolean,
    RegExp,
    Promise,
    setTimeout,
    clearTimeout,
    localStorage: {
      getItem: (k) => (storage.has(k) ? storage.get(k) : null),
      setItem: (k, v) => storage.set(k, String(v)),
      removeItem: (k) => storage.delete(k),
      clear: () => storage.clear(),
    },
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  return { sandbox, storage };
}

test('SaltlineCampaignV2: 14 distinct chapters, >=4h playtime, 6 characters, non-repeating matrix', () => {
  const { sandbox } = makeSandbox();
  loadBrowserScript('saltline-campaign-core.js', sandbox);
  const C = sandbox.SaltlineCampaignV2;
  assert.ok(C, 'SaltlineCampaignV2 should attach to window');

  assert.equal(C.SALTLINE_CHAPTERS.length, 14, 'Should define 14 independent chapters');
  const ids = new Set(C.SALTLINE_CHAPTERS.map((c) => c.id));
  assert.equal(ids.size, 14, 'All 14 chapter IDs must be unique');

  const totalMin = C.SALTLINE_CHAPTERS.reduce((sum, ch) => sum + (Number(ch.estMinutes) || 0), 0);
  assert.ok(totalMin >= 240 && totalMin <= 360, `Total target playtime should be 240-360 min, got ${totalMin}`);

  assert.ok(C.SALTLINE_CHARACTERS.length >= 5, `Need >= 5 main characters, got ${C.SALTLINE_CHARACTERS.length}`);
  const charIds = new Set(C.SALTLINE_CHARACTERS.map((ch) => ch.id));
  for (const requiredId of ['lin', 'mara', 'harris', 'ward']) {
    assert.ok(charIds.has(requiredId), `Missing core character ${requiredId}`);
  }
  for (const ch of C.SALTLINE_CHARACTERS) {
    assert.ok(ch.nameZh && ch.nameEn, `Character ${ch.id} needs bilingual name`);
    assert.ok(ch.roleZh && ch.roleEn, `Character ${ch.id} needs bilingual role`);
    assert.ok(ch.goalZh, `Character ${ch.id} needs personal goal`);
    assert.ok(ch.arcZh, `Character ${ch.id} needs story arc`);
    assert.ok(ch.speechStyleZh && ch.signatureTraitZh, `Character ${ch.id} needs speech style & trait`);
  }

  const matrixReport = C.validateGameplayMatrix();
  assert.equal(matrixReport.valid, true, `Gameplay matrix validation failed: ${JSON.stringify(matrixReport.violations)}`);
  assert.equal(matrixReport.chapterCount, 14);
  assert.ok(matrixReport.totalEstHours >= 4.0 && matrixReport.totalEstHours <= 6.0);

  for (const ch of C.SALTLINE_CHAPTERS) {
    assert.ok(Array.isArray(ch.objectives) && ch.objectives.length >= 2, `${ch.id} needs >=2 objectives`);
    assert.ok(ch.scenePreset && ch.primaryGameplay, `${ch.id} needs scenePreset & primaryGameplay`);
    assert.ok(ch.recapZh && ch.titleZh && ch.titleEn, `${ch.id} needs titles & recap`);
  }
});

test('SaltlineCampaignV2: 3-slot save manager, difficulty presets, checkpoints, choices & story recap', () => {
  const { sandbox } = makeSandbox();
  loadBrowserScript('saltline-campaign-core.js', sandbox);
  const C = sandbox.SaltlineCampaignV2;

  for (const diff of ['story', 'tactical', 'crisis']) {
    assert.ok(C.DIFFICULTY_PRESETS[diff], `Missing difficulty preset ${diff}`);
    const d = C.DIFFICULTY_PRESETS[diff];
    assert.equal(typeof d.hintIntervalSec, 'number');
    assert.equal(typeof d.hazardMultiplier, 'number');
    assert.equal(typeof d.puzzleTolerance, 'number');
  }
  assert.ok(C.DIFFICULTY_PRESETS.crisis.hazardMultiplier > C.DIFFICULTY_PRESETS.story.hazardMultiplier);
  assert.ok(C.DIFFICULTY_PRESETS.story.puzzleTolerance > C.DIFFICULTY_PRESETS.crisis.puzzleTolerance);

  const mgr = C.createCampaignSaveManager();
  assert.equal(mgr.readAll().length, 3, 'Should provide 3 save slots');

  const s0 = mgr.startNewCampaign(0, 'crisis');
  assert.equal(s0.currentChapterId, 'ch01');
  assert.equal(s0.difficulty, 'crisis');

  for (let i = 0; i < C.SALTLINE_CHAPTERS.length; i++) {
    const ch = C.SALTLINE_CHAPTERS[i];
    mgr.saveCheckpoint(ch.id, 1, [i * 10, 1.7, -i * 5], 0);
    mgr.addPlayTime(ch.id, 300, 0);
    if (ch.id === 'ch08') mgr.recordChoice('ch08', 'public_truth', 0);
    if (ch.id === 'ch13') mgr.recordChoice('ch13', 'open_inquiry', 0);
    mgr.completeChapter(ch.id, 0);
  }

  const finalSlot = mgr.getSlot(0);
  assert.equal(finalSlot.completedChapters.length, 14, 'All 14 chapters should be completed');
  assert.equal(finalSlot.campaignCompleted, true, 'Campaign should be marked completed');
  assert.equal(finalSlot.freeRoamUnlocked, true, 'Post-campaign free roam should unlock');
  assert.equal(finalSlot.choices.ch08, 'public_truth');
  assert.equal(finalSlot.choices.ch13, 'open_inquiry');
  assert.ok(finalSlot.totalPlayTimeSec >= 14 * 300, 'Playtime should accumulate');

  const recap = mgr.buildStoryRecap(0);
  assert.equal(recap.completedCount, 14);
  assert.equal(recap.entries.length, 14, 'Story recap should cover all 14 completed chapters');

  mgr.setAccessibility({ subtitleScale: 'large', highContrastHud: true, reduceShake: true });
  const acc = mgr.getAccessibility();
  assert.equal(acc.subtitleScale, 'large');
  assert.equal(acc.highContrastHud, true);
  assert.equal(acc.reduceShake, true);

  mgr.startNewCampaign(1, 'story');
  mgr.deleteSlot(1);
  assert.equal(mgr.getSlot(1).createdAt, null);
  assert.equal(mgr.getSlot(0).completedChapters.length, 14);
});

test('SaltlineCampaignV2: 3D CharacterBehaviorController spawns cast and drives follow/wait behaviors', () => {
  const { sandbox } = makeSandbox();
  const actors = new Map();
  sandbox.createSaltlineHuman = (THREE, opts) => {
    const actor = {
      position: { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } },
      rotation: { y: 0 },
      removeFromParent() { this.removed = true; },
    };
    const human = { actor, pose() {} };
    actors.set(opts.name, human);
    return human;
  };
  loadBrowserScript('saltline-campaign-core.js', sandbox);
  const C = sandbox.SaltlineCampaignV2;

  const sceneChildren = [];
  const mockScene = { add(c) { sceneChildren.push(c); }, remove(c) { const i = sceneChildren.indexOf(c); if (i >= 0) sceneChildren.splice(i, 1); } };

  const ctrl = C.createCharacterBehaviorController({ THREE: {}, scene: mockScene });
  const ch02 = C.SALTLINE_CHAPTERS[1];
  ctrl.spawnChapterCast(ch02);
  assert.ok(ctrl.cast.length >= 1, 'Should spawn chapter NPC cast');

  const firstId = ctrl.cast[0].id;
  const actor = actors.get(`cast-${firstId}`).actor;
  const startX = actor.position.x;
  ctrl.setBehavior(firstId, 'follow');
  for (let i = 0; i < 25; i++) {
    ctrl.update(0.1, { x: startX + 20, y: 0, z: actor.position.z });
  }
  assert.ok(actor.position.x > startX + 1.0, `Character in follow mode should move toward player (start=${startX}, now=${actor.position.x})`);

  const xBeforeWait = actor.position.x;
  ctrl.setBehavior(firstId, 'wait_at_objective');
  ctrl.update(0.5, { x: xBeforeWait + 30, y: 0, z: actor.position.z });
  assert.equal(actor.position.x, xBeforeWait, 'Character in wait mode should hold position');

  ctrl.disposeCast();
  assert.equal(ctrl.cast.length, 0, 'disposeCast() should clear active cast');
});
