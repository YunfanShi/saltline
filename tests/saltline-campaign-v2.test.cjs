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
  assert.ok(htmlSrc.includes('saltline-voice-manager.js'), 'index.html must load saltline-voice-manager.js');
  assert.ok(htmlSrc.includes("ev.code==='KeyH'"), 'index.html must bind H key to NPC command panel');
});

test('SaltlineVoiceManager + [H] NPC Commands + 3D-to-2D Golden Waypoint (No Light Pillars)', () => {
  const { sandbox } = makeSandbox();
  loadBrowserScript('saltline-voice-manager.js', sandbox);
  loadBrowserScript('saltline-campaign-core.js', sandbox);

  const manifestJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'campaign-voice-manifest.json'), 'utf8'));
  assert.ok(Array.isArray(manifestJson.lines) && manifestJson.lines.length >= 33, 'Voice manifest should cover all 14 chapters + 5 NPC commands');

  const subtitles = [];
  const voiceMgr = sandbox.SaltlineVoiceManager.createSaltlineVoiceManager({
    onSubtitle: (ln) => subtitles.push(ln),
  });
  voiceMgr.indexManifest(manifestJson);
  assert.equal(voiceMgr.loaded, true);
  assert.equal(voiceMgr.listLines({ chapter: 'ch01', trigger: 'intro' }).length, 2);
  assert.equal(voiceMgr.playLine('ch01_intro_01'), true);
  assert.equal(subtitles.length, 1);
  assert.equal(subtitles[0].speaker, '玛拉');
  voiceMgr.stopCurrent();

  // Verify [H] NPC Command controller + Golden Waypoint projection + zero navigation light pillars
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
  class Vec3 {
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
    project() { this.x = 0.2; this.y = 0.1; this.z = 0.5; return this; }
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
  const cam = { position: new Vec3(), fov: 65, updateMatrixWorld() {}, updateProjectionMatrix() {}, lookAt() {} };
  const camp = sandbox.SaltlineCampaignV2.createSaltlineCampaignV2({
    THREE: mockTHREE,
    scene,
    camera: cam,
    player: { pos: new Vec3(-26, 0.25, -42), vel: new Vec3() },
    voiceMgr,
  });
  camp.startChapter('ch01', { skipCutscene: true });
  camp.update(0.1);

  // Verify waypoint reticle computes exact distance
  assert.equal(camp.waypoint.state.visible, true);
  assert.ok(camp.waypoint.state.distM > 0, `Expected positive waypoint distance, got ${camp.waypoint.state.distM}`);

  // Verify NO vertical light pillar in the mechanic-specific 3D objective prop
  const setpieceRoot = scene.children.find(c => c.name === 'saltline-campaign-v2-setpieces');
  const propGroup = setpieceRoot?.children?.find(c => typeof c.name === 'string' && c.name.startsWith('campaign-v2-prop-'));
  assert.ok(propGroup, 'Mechanic-specific 3D objective prop group should exist');
  const tallBeam = propGroup.children.find(m => m.scale && m.scale.y > 5);
  assert.equal(tallBeam, undefined, 'Must NOT render tall vertical light pillar beams for navigation');

  // Verify [H] NPC commands toggle and mission-driven AI gating (NO operate_objective stealing player tasks!)
  assert.equal(camp.npcCommands.toggle(), true);
  assert.equal(camp.npcCommands.presets.some(p => p.id === 'operate_objective'), false, 'NPCs must NOT complete player objectives');
  const ord = camp.npcCommands.issueOrder('2'); // hold
  assert.equal(ord.id, 'hold');
  assert.ok(camp.charCtrl.cast.every(c => c.behavior === 'hold'), 'All squad NPCs should execute hold in free exploration phase');
  camp.npcCommands.issueOrder('radio_report');
  assert.ok(camp.charCtrl.cast.every(c => c.behavior === 'radio_report'), 'All squad NPCs should execute radio_report');

  // Verify scripted driving/puzzle missions gate manual player [H] commands (mission-driven AI!)
  camp.startChapter('ch03', { skipCutscene: true });
  assert.equal(camp.npcCommands.isCommandAllowed(), false, 'Scripted driving mission must keep NPC movement mission-driven');
  assert.equal(camp.npcCommands.issueOrder('hold'), null, 'Manual [H] order must be refused during scripted driving phase');

  // Verify 3 showcase chapters (Ch03 city_gridlock, Ch06 rising_water_drydock, Ch10 offshore_platform) + story brief
  assert.equal(camp.setPieces.state.preset, 'city_gridlock');
  const brief03 = sandbox.SaltlineCampaignV2.getChapterStoryBrief('ch03');
  assert.ok(brief03.whatHappened && brief03.whyItMatters && brief03.keyPeople && brief03.yourRole);

  camp.startChapter('ch10', { skipCutscene: true });
  assert.equal(camp.setPieces.state.platformTiltDeg > 0, true, 'Offshore platform starts tilted before ballast stabilization');
  camp.advanceObjective();
  assert.equal(camp.setPieces.state.platformBallastBalanced, true, 'Completing Deck 1 ballast valves must stabilize platform');
  assert.equal(camp.setPieces.state.platformTiltDeg, 0);
  camp.stop();
});

test('SaltlineCampaignV2: 7 genuinely distinct interactive mechanics across all 42 objectives (Zero generic console)', () => {
  const { sandbox } = makeSandbox();
  loadBrowserScript('saltline-campaign-core.js', sandbox);
  const C = sandbox.SaltlineCampaignV2;

  const seenMechanics = new Set();
  for (const ch of C.SALTLINE_CHAPTERS) {
    for (const obj of ch.objectives) {
      const m = C.resolveObjectiveMechanic(obj.action);
      assert.ok(m, `Objective ${obj.id} (${obj.action}) must resolve to a valid mechanic`);
      seenMechanics.add(m);
    }
  }
  for (const expected of ['dialogue', 'driving_gates', 'survivor_rescue', 'multi_switch_puzzle', 'storm_climb_traversal', 'branch_choice', 'hold_repair']) {
    assert.ok(seenMechanics.has(expected), `Campaign must actively use mechanic "${expected}"`);
  }

  class Vec3 {
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
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
  let driving = false;
  let dialogueOpened = 0;
  let tunerOpened = 0;
  const world = {
    THREE: mockTHREE,
    scene,
    camera: { position: new Vec3(), lookAt() {} },
    player: { pos: new Vec3(), vel: new Vec3() },
    vehicle: { get driving() { return driving; } },
    storyDirector: {
      openDialogue(opts) { dialogueOpened++; opts.onComplete?.(); },
      openSignalTuner(opts) { tunerOpened++; opts.onSuccess?.(); },
    },
  };

  const camp = C.createSaltlineCampaignV2(world);

  // 1. Driving gates (ch03 obj 0: drive_route -> 3 physical gates auto-triggered by driving)
  camp.startChapter('ch03', { skipCutscene: true });
  assert.equal(camp.getObjectiveState().mechanic, 'driving_gates');
  assert.equal(camp.getObjectiveState().totalSteps, 3);
  driving = true;
  for (let g = 0; g < 3; g++) {
    const t = camp.getActiveWaypointTarget();
    const res = camp.tickInteraction(0.1, { x: t[0], y: t[1], z: t[2] }, false);
    if (g < 2) assert.equal(res.subStepAdvanced, true, `Driving gate ${g + 1}/3 should advance sub-step`);
    else assert.equal(res.objectiveIdx, 1, 'Passing 3rd driving gate should advance to next objective');
  }
  driving = false;

  // 2. Survivor rescue (ch03 obj 1: assist_npc -> 3 individual survivors rescued one by one)
  assert.equal(camp.getObjectiveState().mechanic, 'survivor_rescue');
  assert.equal(camp.getObjectiveState().totalSteps, 3);
  for (let s = 0; s < 3; s++) {
    const t = camp.getActiveWaypointTarget();
    camp.tickInteraction(1.0, { x: t[0], y: t[1], z: t[2] }, false);
    const res = camp.tickInteraction(0.1, { x: t[0], y: t[1], z: t[2] }, true);
    if (s < 2) assert.equal(res.subStepAdvanced, true);
    else assert.equal(res.objectiveIdx, 2);
  }

  // 3. Multi-switch puzzle + Signal Tuner mini-game (ch05 obj 0: power_puzzle -> 3 switches + tuner on final)
  camp.startChapter('ch05', { skipCutscene: true });
  assert.equal(camp.getObjectiveState().mechanic, 'multi_switch_puzzle');
  assert.equal(camp.getObjectiveState().totalSteps, 3);
  for (let k = 0; k < 3; k++) {
    const t = camp.getActiveWaypointTarget();
    camp.tickInteraction(1.0, { x: t[0], y: t[1], z: t[2] }, false);
    camp.tickInteraction(0.1, { x: t[0], y: t[1], z: t[2] }, true);
  }
  assert.equal(tunerOpened, 1, 'Final power_puzzle switch must launch openSignalTuner mini-game');

  // 4. Dialogue mechanic (ch01 obj 0: reach_and_talk -> opens face-to-face openDialogue)
  camp.startChapter('ch01', { skipCutscene: true });
  assert.equal(camp.getObjectiveState().mechanic, 'dialogue');
  const dT = camp.getActiveWaypointTarget();
  camp.tickInteraction(0.1, { x: dT[0], y: dT[1], z: dT[2] }, true);
  assert.equal(dialogueOpened, 1, 'Dialogue objective must open face-to-face storyDirector.openDialogue');

  // 5. Hold-to-repair mechanic (ch02 obj 0: repair -> requires holding [E] for 2.0s)
  camp.startChapter('ch02', { skipCutscene: true });
  assert.equal(camp.getObjectiveState().mechanic, 'hold_repair');
  const rT = camp.getActiveWaypointTarget();
  assert.equal(camp.tickInteraction(0.5, { x: rT[0], y: rT[1], z: rT[2] }, true), null, 'Short tap must NOT finish hold_repair');
  const holdDone = camp.tickInteraction(1.6, { x: rT[0], y: rT[1], z: rT[2] }, true);
  assert.equal(holdDone.objectiveIdx, 1, 'Holding [E] for 2.0s should complete hold_repair');

  // 6. Branch choice mechanic (ch08 obj 2: branch_choice -> records choice in save manager)
  camp.startChapter('ch08', { objectiveIndex: 2, skipCutscene: true });
  assert.equal(camp.getObjectiveState().mechanic, 'branch_choice');
  const cT = camp.getActiveWaypointTarget();
  camp.tickInteraction(0.1, { x: cT[0], y: cT[1], z: cT[2] }, true);
  assert.equal(camp.saveMgr.getSlot().choices.ch08, 'public_truth', 'branch_choice must persist decision');

  // 7. Storm/climb traversal with rising-water elevation check (ch06 obj 1: multilevel_climb)
  camp.startChapter('ch06', { objectiveIndex: 1, skipCutscene: true });
  assert.equal(camp.getObjectiveState().mechanic, 'storm_climb_traversal');
  const clT = camp.getActiveWaypointTarget();
  let promptMsg = '';
  assert.equal(camp.tickInteraction(0.1, { x: clT[0], y: 0.5, z: clT[2] }, false, { setPrompt: (m) => { promptMsg = m || ''; } }), null, 'Low elevation must warn instead of advancing multilevel_climb');
  assert.ok(promptMsg.includes('攀升'), 'Should warn player to climb above rising water');
  const climbed = camp.tickInteraction(0.1, { x: clT[0], y: 3.8, z: clT[2] }, false);
  assert.equal(climbed.subStepAdvanced, true, 'Elevated catwalk traversal should advance step');

  camp.stop();
});
