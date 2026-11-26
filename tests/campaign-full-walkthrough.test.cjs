const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const rootDir = path.resolve(__dirname, '..');

function createElement(tag) {
  const listeners = new Map();
  const classSet = new Set();
  const el = {
    tagName: String(tag || 'div').toUpperCase(),
    id: '',
    style: {},
    dataset: {},
    hidden: false,
    isConnected: true,
    children: [],
    parentElement: null,
    _innerHTML: '',
    textContent: '',
    width: 256,
    height: 256,
    classList: {
      add: (...cs) => cs.forEach(c => classSet.add(c)),
      remove: (...cs) => cs.forEach(c => classSet.delete(c)),
      contains: c => classSet.has(c),
      toggle: (c, f) => (f === undefined ? (classSet.has(c) ? classSet.delete(c) : classSet.add(c)) : (f ? classSet.add(c) : classSet.delete(c))),
    },
    get className() { return [...classSet].join(' '); },
    set className(v) { classSet.clear(); String(v || '').split(/\s+/).filter(Boolean).forEach(c => classSet.add(c)); },
    set innerHTML(v) { el._innerHTML = String(v || ''); },
    get innerHTML() { return el._innerHTML; },
    append(...nodes) { for (const n of nodes) { if (n && typeof n === 'object') { n.parentElement = el; el.children.push(n); } } },
    appendChild(n) { if (n && typeof n === 'object') { n.parentElement = el; el.children.push(n); } return n; },
    remove() { el.isConnected = false; },
    setAttribute() {},
    getAttribute() { return null; },
    hasAttribute() { return false; },
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(fn); },
    removeEventListener(type, fn) { const a = listeners.get(type); if (a) { const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); } },
    getContext: () => ({
      fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '', textBaseline: '',
      fillRect() {}, strokeRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {},
      fill() {}, arc() {}, fillText() {}, clearRect() {},
      createLinearGradient: () => ({ addColorStop() {} }),
      createRadialGradient: () => ({ addColorStop() {} }),
      createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
      getImageData: () => ({ data: new Uint8ClampedArray(256 * 256 * 4) }),
      putImageData() {},
    }),
    querySelector(sel) {
      if (!el._q) el._q = new Map();
      if (!el._q.has(sel)) el._q.set(sel, createElement('div'));
      return el._q.get(sel);
    },
    querySelectorAll() { return []; },
  };
  return el;
}

test('Full 12-Act Campaign Walkthrough: [E] never pauses game & every act completes cleanly to finale', () => {
  const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  assert.ok(
    html.includes('i.openWorld?.tunerOpen||i.openWorld?.cutsceneActive||i.openWorld?.finaleOpen||i.openWorld?.dialogueOpen||i.openWorld?.journalOpen'),
    'index.html input:lock guard must allow tunerOpen, cutsceneActive, finaleOpen, dialogueOpen, and journalOpen without pausing'
  );

  const winListeners = new Map();
  let pointerLocked = true;
  let pausedByPointerUnlock = false;
  let openWorldRef = null;

  const doc = {
    body: createElement('body'),
    head: createElement('head'),
    get pointerLockElement() { return pointerLocked ? doc.body : null; },
    exitPointerLock() {
      if (!pointerLocked) return;
      pointerLocked = false;
      const blockedByOverlay = Boolean(openWorldRef?.mapOpen || openWorldRef?.tunerOpen || openWorldRef?.cutsceneActive || openWorldRef?.finaleOpen || openWorldRef?.dialogueOpen || openWorldRef?.journalOpen);
      if (!blockedByOverlay) pausedByPointerUnlock = true;
    },
    getElementById: () => null,
    querySelector: () => null,
    createElement: tag => createElement(tag),
    createElementNS: (_ns, tag) => createElement(tag),
  };

  const storageMap = new Map();
  const scope = vm.createContext({
    window: {},
    document: doc,
    localStorage: {
      getItem: k => (storageMap.has(k) ? storageMap.get(k) : null),
      setItem: (k, v) => storageMap.set(k, String(v)),
      removeItem: k => storageMap.delete(k),
    },
    addEventListener(type, fn) { if (!winListeners.has(type)) winListeners.set(type, []); winListeners.get(type).push(fn); },
    removeEventListener(type, fn) { const a = winListeners.get(type); if (a) { const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); } },
    dispatchKey(code) {
      let stopped = false;
      const ev = {
        code, repeat: false,
        preventDefault() {},
        stopPropagation() {},
        stopImmediatePropagation() { stopped = true; },
      };
      for (const fn of [...(winListeners.get('keydown') || [])]) {
        if (stopped) break;
        fn(ev);
      }
    },
    requestAnimationFrame() {},
    cancelAnimationFrame() {},
    setTimeout: fn => { if (typeof fn === 'function') fn(); return 1; },
    clearTimeout() {},
    setInterval: () => 1,
    clearInterval() {},
    performance, console, AbortController,
    Math, Date, Set, Map, WeakMap, Array, Object, Number, String, Boolean, JSON, Promise, Uint8Array, Uint8ClampedArray, Float32Array,
  });
  scope.window = scope;

  // Load real bundled Three.js + real index.html physics
  const threeChunk = html.slice(html.indexOf('var _M=Object.defineProperty'), html.indexOf('var oi='));
  vm.runInContext(threeChunk + '\nwindow.THREE = lt;', scope);

  const start = html.indexOf('var u1=.42,Ls=.5,Ya=oi.min.x');
  const fnStart = html.indexOf('function d3(i){', start);
  let depth = 0, fnEnd = -1;
  for (let i = fnStart; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') { depth--; if (depth === 0) { fnEnd = i + 1; break; } }
  }
  const physSrc = `
    var oi = { min: new THREE.Vector3(-108, 0, -30), max: new THREE.Vector3(40, 30, 30), groundY: 0.16, seaY: -1.5, quayX: 25 };
    var W = THREE.Vector3;
    var f3 = v => Array.isArray(v) ? new W(v[0], v[1], v[2]) : v.clone();
    ${html.slice(start, fnEnd)}
    window.createRealPhysics = () => d3({});
  `;
  vm.runInContext(physSrc, scope);

  for (const rel of [
    'WorldEngine/Materials/MaterialLibrary.js',
    'port-external-assets.js',
    'WorldEngine/Assets/BuildingGenerator.js',
    'WorldEngine/Assets/UrbanPlanningSystem.js',
    'WorldEngine/Assets/IndustrialGenerator.js',
    'WorldEngine/Terrain/TerrainGenerator.js',
    'WorldEngine/Rendering/LightingSystem.js',
    'WorldEngine/Performance/ChunkManager.js',
    'port-open-world-cinematics.js',
    'port-open-world-district.js',
  ]) {
    vm.runInContext(fs.readFileSync(path.join(rootDir, rel), 'utf8'), scope, { filename: rel });
  }

  const { THREE } = scope;
  scope.createParkedTransport = () => ({ root: new THREE.Group(), dispose() {} });
  scope.createSaltlineHuman = () => ({ actor: new THREE.Group(), limbs: [], pose() {} });

  const physics = scope.createRealPhysics();
  const eventHandlers = new Map();
  const playerPos = new THREE.Vector3(-16, 0.2, -16);
  const camPos = new THREE.Vector3(-16, 1.8, -16);
  const camDir = new THREE.Vector3(0, 0, -1);
  let driving4x4 = false;

  const world = {
    THREE,
    scene: new THREE.Scene(),
    physics,
    camera: {
      position: camPos,
      getWorldPosition(v) { return v.copy(camPos); },
      getWorldDirection(v) { return v.copy(camDir); },
      lookAt() {},
    },
    player: { pos: playerPos, vel: new THREE.Vector3(), yaw: 0, alive: true, enabled: true, health: 100, maxHealth: 100, heal() {}, addShake() {} },
    input: { requestLock() { pointerLocked = true; } },
    vehicle: { get driving() { return driving4x4; }, setPosition(p) { playerPos.copy(p); } },
    game: { state: 'playing', mode: 'mission' },
    hud: { setObjective() {}, showChapter() {}, setMarkers() {}, clearRadio() {}, radio() {} },
    tactical: { notify() {} },
    disasters: { triggerTsunami() {}, triggerTideGateDemolition() {}, triggerArtilleryBarrage() {}, triggerLightningStorm() {}, triggerFuelChainBlast() {}, triggerSkyBattlePass() {}, triggerVictoryFlareBarrage() {}, stopAllEvents() {} },
    events: {
      on(ev, fn) { if (!eventHandlers.has(ev)) eventHandlers.set(ev, []); eventHandlers.get(ev).push(fn); },
      emit(ev, payload) { for (const fn of (eventHandlers.get(ev) || [])) fn(payload); },
    },
    quality: { name: 'medium' },
  };

  const ow = scope.createPortOpenWorld(world);
  openWorldRef = ow;
  ow.startFromLanding();

  function solveTuner() {
    assert.equal(ow.tunerOpen, true, `Signal tuner must open at stage ${ow.stage}`);
    assert.equal(pausedByPointerUnlock, false, `Opening Signal Tuner via [E] at stage ${ow.stage} MUST NOT pause the game!`);
    for (let step = 0; step < 600 && ow.tunerOpen; step++) {
      ow.update(0.02, playerPos);
      scope.dispatchKey('Space');
    }
    assert.equal(ow.tunerOpen, false, `Signal tuner should close after 3 locks at stage ${ow.stage}`);
    assert.equal(pointerLocked, true, 'Pointer lock should be re-requested after tuner closes');
  }

  function destroyCurrentTarget() {
    const obj = ow.currentObjective;
    assert.ok(obj && obj.pos, `Expected shoot target objective at stage ${ow.stage}`);
    camPos.set(obj.pos.x, obj.pos.y, obj.pos.z + 6);
    camDir.set(0, 0, -1);
    for (let s = 0; s < 4; s++) world.events.emit('weapon:fire', {});
    ow.update(0.05, playerPos);
  }

  function skipAnyCutscene() {
    if (ow.cutsceneActive) scope.dispatchKey('Space');
  }

  // Verify NPC face-to-face dialogue ([E] near Old Hawke at Berth 4) & [J] Story Journal never pause the game!
  playerPos.set(-31, 0.2, -21);
  ow.update(0.25, playerPos);
  scope.dispatchKey('KeyE');
  assert.equal(ow.dialogueOpen, true, 'Pressing [E] near Berth 4 NPC Old Hawke must open face-to-face dialogue');
  assert.equal(pausedByPointerUnlock, false, 'Opening NPC dialogue MUST NOT pause the game');
  // Step through all 3 dialogue pages manually via Space
  scope.dispatchKey('Space');
  scope.dispatchKey('Space');
  scope.dispatchKey('Space');
  assert.equal(ow.dialogueOpen, false, 'Advancing past final dialogue page closes dialogue cleanly');
  assert.equal(pointerLocked, true, 'Closing NPC dialogue restores pointer lock');

  // Verify [J] Story Case Journal toggles cleanly without pausing
  scope.dispatchKey('KeyJ');
  assert.equal(ow.journalOpen, true, 'Pressing [J] must open Story Case Journal');
  assert.equal(pausedByPointerUnlock, false, 'Opening [J] Story Journal MUST NOT pause the game');
  scope.dispatchKey('KeyJ');
  assert.equal(ow.journalOpen, false, 'Pressing [J] again closes Story Case Journal');

  // ACT 1 (stage 0): Decode Berth 4 blackbox via [E] -> destroy 2 jammers
  assert.equal(ow.stage, 0);
  playerPos.set(-20, 0.2, -18);
  ow.update(0.05, playerPos);
  scope.dispatchKey('KeyE');
  solveTuner();
  destroyCurrentTarget();
  destroyCurrentTarget();
  skipAnyCutscene();
  assert.equal(ow.stage, 1, 'Act 1 should advance to Act 2 (stage 1)');

  // ACT 2 (stage 1): Drive through Coastal Blvd roadblock -> hold Precinct 04 (14s)
  driving4x4 = true;
  playerPos.set(-26, 0.2, -76);
  ow.update(0.1, playerPos);
  driving4x4 = false;
  playerPos.set(-10, 0.2, -56);
  for (let i = 0; i < 160; i++) ow.update(0.1, playerPos);
  skipAnyCutscene();
  assert.equal(ow.stage, 2, 'Act 2 should advance to Act 3 (stage 2)');

  // ACT 3 (stage 2): Destroy 2 cryo-locks -> repair recorder at SW Clinic via [E]
  destroyCurrentTarget();
  destroyCurrentTarget();
  playerPos.set(-158, 0.2, 96);
  ow.update(0.05, playerPos);
  scope.dispatchKey('KeyE');
  solveTuner();
  skipAnyCutscene();
  assert.equal(ow.stage, 3, 'Act 3 should advance to Act 4 (stage 3)');

  // ACT 4 (stage 3): Destroy 2 rail breakers -> scan manifest train (12s)
  destroyCurrentTarget();
  destroyCurrentTarget();
  skipAnyCutscene();
  playerPos.set(-164, 0.2, 4);
  for (let i = 0; i < 140; i++) ow.update(0.1, playerPos);
  skipAnyCutscene();
  assert.equal(ow.stage, 4, 'Act 4 should advance to Act 5 (stage 4)');

  // ACT 5 (stage 4): Destroy 3 cooling cores -> tune satellite dish via [E] -> hold uplink (10s)
  destroyCurrentTarget();
  destroyCurrentTarget();
  destroyCurrentTarget();
  playerPos.set(-174, 14.2, -78);
  ow.update(0.05, playerPos);
  scope.dispatchKey('KeyE');
  solveTuner();
  for (let i = 0; i < 120; i++) ow.update(0.1, playerPos);
  skipAnyCutscene();
  assert.equal(ow.stage, 5, 'Act 5 should advance to Act 6 (stage 5)');

  // ACT 6 (stage 5): Survive 15s tsunami on summit
  playerPos.set(-174, 14.2, -78);
  for (let i = 0; i < 160; i++) ow.update(0.1, playerPos);
  skipAnyCutscene();
  assert.equal(ow.stage, 6, 'Act 6 should advance to Act 7 (stage 6)');

  // ACT 7 (stage 6): Destroy 2 lighthouse jammers -> calibrate lens via [E]
  destroyCurrentTarget();
  destroyCurrentTarget();
  playerPos.set(14, 0.2, 128);
  ow.update(0.05, playerPos);
  scope.dispatchKey('KeyE');
  solveTuner();
  skipAnyCutscene();
  assert.equal(ow.stage, 7, 'Act 7 should advance to Act 8 (stage 7)');

  // ACT 8 (stage 7): Reach Airfield Hangar to secure manifest & blackbox
  playerPos.set(-172, 0.2, -200);
  ow.update(0.1, playerPos);
  skipAnyCutscene();
  assert.equal(ow.stage, 8, 'Act 8 should advance to Act 9 (stage 8)');

  // ACT 9 (stage 8): Destroy 2 South Quay boarding jammers -> hold gangway (10s)
  destroyCurrentTarget();
  destroyCurrentTarget();
  playerPos.set(16, 0.2, 86);
  for (let i = 0; i < 120; i++) ow.update(0.1, playerPos);
  skipAnyCutscene();
  assert.equal(ow.stage, 9, 'Act 9 should advance to Act 10 (stage 9)');

  // ACT 10 (stage 9): Decrypt Ward offshore ledger at Precinct 04 via [E] -> hold uplink (10s)
  playerPos.set(-10, 0.2, -56);
  ow.update(0.05, playerPos);
  scope.dispatchKey('KeyE');
  solveTuner();
  for (let i = 0; i < 120; i++) ow.update(0.1, playerPos);
  skipAnyCutscene();
  assert.equal(ow.stage, 10, 'Act 10 should advance to Act 11 (stage 10)');

  // ACT 11 (stage 10): Destroy 2 North Blvd SAM pods -> reach Airfield Approach
  destroyCurrentTarget();
  destroyCurrentTarget();
  playerPos.set(-130, 0.2, -172);
  ow.update(0.1, playerPos);
  skipAnyCutscene();
  assert.equal(ow.stage, 11, 'Act 11 should advance to Act 12 (stage 11)');

  // ACT 12 (stage 11): Board SAR transport at Airfield Hangar -> Finale!
  playerPos.set(-172, 0.2, -200);
  ow.update(0.1, playerPos);
  skipAnyCutscene();
  assert.equal(ow.stage, 12, 'Act 12 should complete the campaign (stage 12)');
  assert.equal(ow.progress.completedCount, 12, 'All 12 campaign acts must be marked complete');
  assert.equal(ow.finaleOpen, true, 'Finale card must open on campaign completion');
  assert.equal(pausedByPointerUnlock, false, 'No step in the entire 12-act campaign should pause the game via pointer unlock');

  ow.dispose();
});
