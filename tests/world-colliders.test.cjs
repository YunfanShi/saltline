const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const rootDir = path.resolve(__dirname, '..');

function createRealHarness() {
  const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const noopEl = () => ({
    style: {},
    classList: { add() {}, remove() {}, toggle() {} },
    querySelector: () => noopEl(),
    querySelectorAll: () => [],
    appendChild() {}, append() {}, remove() {}, addEventListener() {}, removeEventListener() {},
    setAttribute() {},
    width: 256, height: 256,
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
  });
  const scope = vm.createContext({
    window: {},
    document: {
      createElementNS: () => noopEl(),
      createElement: () => noopEl(),
      getElementById: () => null,
      querySelector: () => null,
      body: { appendChild() {}, append() {} },
      head: { appendChild() {} },
    },
    localStorage: { getItem: () => null, setItem() {} },
    addEventListener() {}, removeEventListener() {},
    requestAnimationFrame() {}, cancelAnimationFrame() {},
    setTimeout: () => 0, clearTimeout() {},
    performance, console, AbortController,
    Math, Date, Set, Map, WeakMap, Array, Object, Number, String, Boolean, JSON, Promise, Uint8Array, Uint8ClampedArray, Float32Array,
  });
  scope.window = scope;

  // Load real bundled Three.js from index.html
  const threeChunk = html.slice(html.indexOf('var _M=Object.defineProperty'), html.indexOf('var oi='));
  vm.runInContext(threeChunk + '\nwindow.THREE = lt;', scope);

  // Extract real physics engine d3(i) from index.html
  const start = html.indexOf('var u1=.42,Ls=.5,Ya=oi.min.x');
  assert.ok(start > 0, 'physics block must exist in index.html');
  const fnStart = html.indexOf('function d3(i){', start);
  let depth = 0, fnEnd = -1;
  for (let i = fnStart; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') { depth--; if (depth === 0) { fnEnd = i + 1; break; } }
  }
  assert.ok(fnEnd > fnStart, 'd3(i) closing brace must be found');
  const physSrc = `
    var oi = { min: new THREE.Vector3(-244, 0, -226), max: new THREE.Vector3(56, 40, 148), groundY: 0.16, seaY: -1.5, quayX: 25 };
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
    'port-drivable-vehicle.js',
    'port-open-world-district.js',
  ]) {
    vm.runInContext(fs.readFileSync(path.join(rootDir, rel), 'utf8'), scope, { filename: rel });
  }
  return scope;
}

const scope = createRealHarness();
const { THREE } = scope;

test('Real index.html physics supports updateBox and disabled across raycast, groundHeight, and moveCapsule', () => {
  const physics = scope.createRealPhysics();
  assert.equal(typeof physics.updateBox, 'function');

  const b = physics.addBox([-134.5, 0.16, -20], [-131.5, 4.2, -6], { surface: 'metal', tag: 'live-train', noNav: true });
  const hit1 = physics.raycast(new THREE.Vector3(-140, 2, -13), new THREE.Vector3(1, 0, 0), 50);
  assert.ok(hit1 && hit1.box === b, 'raycast should hit active train collider');

  physics.updateBox(b, -134.5, 0.16, 10, -131.5, 4.2, 24);
  assert.equal(physics.raycast(new THREE.Vector3(-140, 2, -13), new THREE.Vector3(1, 0, 0), 50), null);
  const hitNew = physics.raycast(new THREE.Vector3(-140, 2, 17), new THREE.Vector3(1, 0, 0), 50);
  assert.ok(hitNew && hitNew.box === b, 'raycast should hit moved train collider');

  const pos = new THREE.Vector3(-135.0, 0.16, 17);
  const res = physics.moveCapsule(pos, new THREE.Vector3(6, 0, 0), 0.25, 0.35, 1.8, true);
  assert.equal(res.hitWall, true, 'capsule should collide with active train wall');
  assert.ok(pos.x <= -134.5);

  b.disabled = true;
  assert.equal(physics.raycast(new THREE.Vector3(-140, 2, 17), new THREE.Vector3(1, 0, 0), 50), null);
  assert.ok(physics.groundHeight(-133, 17, 10) < 1.0);
  const pos2 = new THREE.Vector3(-135.0, 0.16, 17);
  assert.equal(physics.moveCapsule(pos2, new THREE.Vector3(6, 0, 0), 0.25, 0.35, 1.8, true).hitWall, false);
});

test('Real Three.js: open-world creates dynamic train/truck/aircraft/NPC/target + static colliders, sweeps player, and disposes cleanly', () => {
  const physics = scope.createRealPhysics();
  scope.createParkedTransport = () => ({ root: new THREE.Group(), dispose() {} });
  scope.createSaltlineHuman = () => ({ actor: new THREE.Group(), limbs: [], pose() {} });

  const playerPos = new THREE.Vector3(-26, 0.16, -20);
  const world = {
    THREE,
    scene: new THREE.Scene(),
    physics,
    camera: { position: new THREE.Vector3(-26, 2, -20) },
    player: { pos: playerPos, vel: new THREE.Vector3(), alive: true, addShake() {} },
    game: { state: 'playing' },
    quality: { name: 'high' },
  };

  const district = scope.createPortOpenWorld(world);
  assert.ok(district);

  const trainBoxes = physics.boxes.filter(b => b.tag === 'live-train');
  const truckBoxes = physics.boxes.filter(b => b.tag === 'live-truck');
  const planeBoxes = physics.boxes.filter(b => b.tag === 'parked-aircraft');
  const npcBoxes = physics.boxes.filter(b => b.tag === 'city-npc');
  const targetBoxes = physics.boxes.filter(b => b.tag === 'shoot-target');

  assert.equal(trainBoxes.length, 5, '5-car moving train must have 5 dynamic colliders');
  assert.equal(truckBoxes.length, 2, '2 moving semi-trucks must have 2 dynamic colliders');
  assert.equal(planeBoxes.length, 2, 'parked transport aircraft must have fuselage + wing colliders');
  assert.equal(npcBoxes.length, 8, '8 patrolling city NPCs must have dynamic colliders');
  assert.ok(targetBoxes.length >= 10, 'shoot targets must have dynamic colliders');
  assert.ok(physics.boxes.length > 180, `expected comprehensive world collider coverage, got ${physics.boxes.length}`);

  // Verify moving train & truck colliders advance with dt
  const trainZ0 = trainBoxes[0].min.z;
  const truckZ0 = truckBoxes[0].min.z;
  district.update(1.0);
  assert.ok(Math.abs((trainBoxes[0].min.z - trainZ0) - 13.5) < 0.05, 'train collider moves +13.5 m/s');
  assert.ok(Math.abs((truckBoxes[0].min.z - truckZ0) - (-8.2)) < 0.05, 'northbound truck collider moves -8.2 m/s');

  // Verify moving train sweeps overlapping player laterally off track
  const locoMidZ = (trainBoxes[0].min.z + trainBoxes[0].max.z) * 0.5;
  playerPos.set(-133.0, 0.2, locoMidZ + 1.35);
  district.update(0.1);
  assert.ok(Math.abs(playerPos.x - (-133.0)) > 1.54, 'moving train sweeps overlapping player off track');

  // Verify moving truck sweeps overlapping player laterally off lane
  const truckMidZ = (truckBoxes[0].min.z + truckBoxes[0].max.z) * 0.5;
  playerPos.set(-22.6, 0.25, truckMidZ - 0.82);
  district.update(0.1);
  assert.ok(Math.abs(playerPos.x - (-22.6)) > 1.28, 'moving truck sweeps overlapping player off lane');

  // Verify dispose() leaves 0 leaked colliders
  district.dispose();
  assert.equal(physics.boxes.length, 0, `dispose() must remove all colliders, left ${physics.boxes.length}`);
});

test('Real Three.js: drivable SAR 4x4 registers parked collider, syncs on setPosition, disables on setActive(false), and removes on dispose', () => {
  const physics = scope.createRealPhysics();
  scope.createSaltlineHuman = () => ({ actor: new THREE.Group(), limbs: [], pose() {} });
  const world = {
    THREE,
    scene: new THREE.Scene(),
    physics,
    camera: { position: new THREE.Vector3(-26, 2, -20) },
    player: { pos: new THREE.Vector3(-26, 0.16, -25), vel: new THREE.Vector3(), alive: true },
    game: { state: 'playing' },
    quality: { name: 'high' },
  };
  const veh = scope.createPortDrivableVehicle(world, { startPos: new THREE.Vector3(-26, 0.16, -20), startYaw: 0 });
  const vBox = physics.boxes.find(b => b.tag === 'sar-4x4');
  assert.ok(vBox && !vBox.disabled, 'parked SAR 4x4 must have active collider');
  assert.ok(vBox.min.x < -26 && vBox.max.x > -26 && vBox.min.z < -20 && vBox.max.z > -20);

  veh.setPosition(new THREE.Vector3(-50, 18, -60));
  assert.ok(veh.pos.y <= 1.0, `setPosition must clamp floating vehicle to ground, got y=${veh.pos.y}`);
  assert.ok(vBox.min.x < -50 && vBox.max.x > -50 && vBox.min.z < -60 && vBox.max.z > -60);

  veh.setActive(false);
  assert.equal(vBox.disabled, true, 'inactive 4x4 collider must be disabled');

  veh.dispose();
  assert.equal(physics.boxes.length, 0, 'dispose() must remove 4x4 collider');
});

test('Real index.html physics spatial grid covers west open-world (x < -108) buildings & overpass bridge', () => {
  const physics = scope.createRealPhysics();
  // West Cold-Storage building collider at x = -214..-196, z = 88..126
  const westWall = physics.addBox([-214, 0, 88], [-196, 7.4, 126], { surface: 'metal', tag: 'west-cold-storage' });
  // Overpass bridge deck at x = -150..-124, y = 5.05..5.60, z = -85..-71
  const bridgeDeck = physics.addBox([-150.2, 5.05, -85.1], [-123.8, 5.60, -70.9], { surface: 'concrete', tag: 'bridge-deck' });
  physics.build();

  const nearWest = physics.nearby(-205, 0.4);
  assert.ok(nearWest.includes(westWall), 'west-side building collider (x < -108) must be indexed in spatial columns');

  const p = new THREE.Vector3(-195.5, 0.2, 105);
  const res = physics.moveCapsule(p, new THREE.Vector3(-12, 0, 0), 0.2, 0.35, 1.8, true);
  assert.equal(res.hitWall, true, 'player moving into west-side building must collide');
  assert.ok(p.x >= -196.0, `player must not pass through west wall, got x=${p.x}`);

  const nearBridge = physics.nearby(-137, 0.4);
  assert.ok(nearBridge.includes(bridgeDeck), 'overpass bridge deck collider must be indexed in spatial columns');
  assert.ok(Math.abs(physics.groundHeight(-137, -78, 6.5) - 5.60) < 0.01, 'bridge deck groundHeight must return 5.60m');
});
