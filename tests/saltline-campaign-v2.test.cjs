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

test('SaltlineAudioV2 + Story Consoles + Open-World Aircraft Crash + Cutscenes + Companion VFX Isolation', () => {
  const { sandbox } = makeSandbox();
  loadBrowserScript('saltline-audio-v2.js', sandbox);
  loadBrowserScript('saltline-campaign-core.js', sandbox);

  assert.ok(sandbox.SaltlineAudioV2?.createSaltlineAudioV2, 'SaltlineAudioV2 should load cleanly');
  const audioV2 = sandbox.SaltlineAudioV2.createSaltlineAudioV2();
  audioV2.setVolume(0.6);
  audioV2.setMuted(true);
  audioV2.setMuted(false);
  audioV2.setAmbience('severe_storm');
  audioV2.playButtonPress();
  audioV2.playValveTurn();
  audioV2.playBreakerThrow();
  audioV2.playRadioSquelch(true);
  audioV2.playAircraftCrash(3.2);
  audioV2.playChapterIntro(1);
  audioV2.playObjectiveComplete();
  audioV2.playChapterComplete();
  audioV2.playThunder();
  audioV2.playFootstep('metal');
  assert.equal(audioV2.weather, 'severe_storm');
  audioV2.dispose();

  class Vec3 {
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
    lerpVectors(a, b, t) { this.x = a.x + (b.x - a.x) * t; this.y = a.y + (b.y - a.y) * t; this.z = a.z + (b.z - a.z) * t; return this; }
  }
  class Obj {
    constructor() { this.children = []; this.position = new Vec3(); this.rotation = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }; this.scale = new Vec3(1, 1, 1); }
    add(...items) { this.children.push(...items); }
    remove(item) { const i = this.children.indexOf(item); if (i >= 0) this.children.splice(i, 1); }
    lookAt() {}
    updateMatrix() {}
  }
  const mockTHREE = {
    Group: Obj,
    Mesh: class extends Obj { constructor(g, m) { super(); this.geometry = g; this.material = m; } },
    BoxGeometry: class {},
    CylinderGeometry: class {},
    PlaneGeometry: class {},
    MeshStandardMaterial: class { constructor(o) { Object.assign(this, o); this.color = { setHex() {} }; } },
    MeshBasicMaterial: class { constructor(o) { Object.assign(this, o); this.color = { setHex() {} }; } },
    PointLight: class extends Obj {},
    Vector3: Vec3,
  };
  const scene = new Obj();
  const cam = { position: new Vec3(), lookAtCalls: 0, lookAt() { this.lookAtCalls++; } };
  let crashBlastCount = 0;
  let crashAudioCount = 0;
  const world = {
    THREE: mockTHREE,
    scene,
    camera: cam,
    player: { pos: new Vec3(), vel: new Vec3(), addShake() {} },
    disasters: { spawnFireballExplosion() { crashBlastCount++; } },
    fx: { smoke() {}, sparks() {} },
    audioV2: {
      setAmbience() {}, stopAmbience() {}, playButtonPress() {}, playValveTurn() {},
      playBreakerThrow() {}, playChapterIntro() {}, playObjectiveComplete() {}, playChapterComplete() {},
      playAircraftCrash() { crashAudioCount++; },
    },
  };

  const C = sandbox.SaltlineCampaignV2;
  const camp = C.createSaltlineCampaignV2(world);
  camp.startChapter('ch02');
  assert.equal(camp.cinematics.active, true, 'Chapter start should launch cinematic intro fly-in');
  camp.update(1.0);
  assert.ok(cam.lookAtCalls > 0, 'Cinematic director should drive camera lookAt during intro fly-in');
  camp.cinematics.skip();
  assert.equal(camp.cinematics.active, false, 'skip() should cleanly end active cutscene');

  camp.advanceObjective();
  const resCrash = camp.advanceObjective();
  assert.equal(resCrash.triggeredEvent, 'aircraft_crash', 'Story button interaction should trigger open-world aircraft crash without shooting pillars');
  assert.equal(crashAudioCount, 1, 'Aircraft crash should trigger SaltlineAudioV2.playAircraftCrash');
  assert.equal(camp.setPieces.state.aircraftCrashActive, true);
  assert.equal(camp.setPieces.state.aircraftImpacted, false);

  for (let i = 0; i < 40; i++) camp.update(0.1);
  assert.equal(camp.setPieces.state.aircraftImpacted, true, 'Aircraft should descend and impact ground after flight duration');
  assert.equal(crashBlastCount, 1, 'Impact should trigger fiery explosion set-piece');

  const companionSrc = fs.readFileSync(path.join(ROOT, 'port-companion-ai.js'), 'utf8');
  assert.ok(companionSrc.includes('hostile.hp > maxHp * 0.40'), 'Companion AI must never steal kills below 40% HP');
  assert.ok(!companionSrc.includes("'sidearm_shot'"), 'Companion AI must not play player-bus sidearm_shot sound');
  const htmlSrc = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(htmlSrc.includes('A!=="companion"&&s.events.emit("enemy:hit"'), 'Gull damage must isolate companion hits from player events');
  assert.ok(htmlSrc.includes('G!=="companion"&&s.events.emit("enemy:hit"'), 'Hound damage must isolate companion hits from player events');
  assert.ok(htmlSrc.includes('saltline-audio-v2.js'), 'index.html must load saltline-audio-v2.js');
});
