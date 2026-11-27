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
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  return sandbox;
}

function makeMockThree() {
  class Vector3 {
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
  }
  class Object3D {
    constructor() {
      this.position = new Vector3();
      this.rotation = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } };
      this.scale = new Vector3(1, 1, 1);
      this.children = [];
      this.userData = {};
      this.parent = null;
      this.matrix = { clone: () => ({}) };
    }
    add(c) { this.children.push(c); c.parent = this; }
    remove(c) { this.children = this.children.filter((x) => x !== c); if (c.parent === this) c.parent = null; }
    removeFromParent() { if (this.parent) this.parent.remove(this); }
    updateMatrix() {}
    traverse(fn) { fn(this); for (const c of this.children) if (c.traverse) c.traverse(fn); }
  }
  class Group extends Object3D {}
  class BoxGeometry { constructor() { this.disposed = false; } dispose() { this.disposed = true; } }
  class CylinderGeometry extends BoxGeometry {}
  class ConeGeometry extends BoxGeometry {}
  class PlaneGeometry extends BoxGeometry {
    constructor(w = 1, h = 1, sw = 1, sh = 1) {
      super();
      const pts = [];
      for (let iz = 0; iz <= sh; iz++) for (let ix = 0; ix <= sw; ix++) {
        pts.push(-w / 2 + (w * ix) / Math.max(1, sw), 0, -h / 2 + (h * iz) / Math.max(1, sh));
      }
      this.attributes = {
        position: {
          count: pts.length / 3,
          getX: (i) => pts[i * 3],
          getY: (i) => pts[i * 3 + 1],
          getZ: (i) => pts[i * 3 + 2],
          setY: (i, v) => { pts[i * 3 + 1] = v; },
        },
      };
    }
    rotateX() {}
    computeVertexNormals() {}
  }
  class MeshStandardMaterial { constructor(opts) { Object.assign(this, opts); this.userData = {}; this.disposed = false; } dispose() { this.disposed = true; } }
  class MeshBasicMaterial extends MeshStandardMaterial {}
  class Mesh extends Object3D {
    constructor(geo, mat) { super(); this.geometry = geo; this.material = mat; this.isMesh = true; }
  }
  class InstancedMesh extends Mesh {
    constructor(geo, mat, count) {
      super(geo, mat);
      this.isInstancedMesh = true;
      this.count = count;
      this.instanceMatrix = { needsUpdate: false };
    }
    setMatrixAt() {}
    computeBoundingSphere() {}
    dispose() { this.disposed = true; }
  }
  class DirectionalLight extends Object3D {}
  return {
    Vector3, Object3D, Group, BoxGeometry, CylinderGeometry, ConeGeometry, PlaneGeometry,
    MeshStandardMaterial, MeshBasicMaterial, Mesh, InstancedMesh, DirectionalLight,
  };
}

test('SaltlineMPModes: 5 independent controllers with distinct rules & monotonic stateSeq', () => {
  const sandbox = makeSandbox();
  loadBrowserScript('saltline-campaign-core.js', sandbox);
  loadBrowserScript('saltline-mp-modes.js', sandbox);
  const M = sandbox.SaltlineMPModes;
  assert.ok(M, 'SaltlineMPModes should attach to window');

  const expectedModes = ['conquest', 'breakthrough', 'coop_rescue', 'coop_campaign', 'sandbox'];
  assert.equal(Object.keys(M.MODE_META).length, 5, 'Should define 5 multiplayer modes');
  for (const id of expectedModes) {
    assert.ok(M.MODE_META[id], `Missing mode metadata for ${id}`);
  }

  // 1. Conquest: ticket bleed & objective capture
  const conq = M.createGameModeController('conquest', {
    startingTickets: 100,
    mapSpec: {
      objectives: [
        { id: 'A', pos: [0, 0, 0] },
        { id: 'B', pos: [50, 0, 0] },
        { id: 'C', pos: [100, 0, 0] },
      ],
    },
  });
  conq.init([{ id: 'p1', name: 'P1', team: 'blue' }]);
  const seq0 = conq.exportState().stateSeq;
  for (let i = 0; i < 30; i++) {
    conq.update(0.5, { units: [{ id: 'p1', team: 'blue', pos: [0, 0, 0], alive: true, isPlayer: true }] });
  }
  const snapConq = conq.exportState();
  assert.ok(snapConq.stateSeq > seq0, 'Conquest stateSeq must monotonically increase');
  assert.equal(snapConq.objectives[0].owner, 'blue', 'Blue team should capture objective A');

  // 2. Breakthrough: sequential sector unlocking
  const bt = M.createGameModeController('breakthrough', {
    startingTickets: 120,
    mapSpec: {
      objectives: [
        { id: 'S1', pos: [0, 0, 0] },
        { id: 'S2', pos: [60, 0, 0] },
      ],
    },
  });
  bt.init([{ id: 'atk1', name: 'Atk1', team: 'blue' }]);
  const s0Sector = bt.exportState().sector ?? 0;
  for (let i = 0; i < 40; i++) {
    bt.update(0.5, { units: [{ id: 'atk1', team: 'blue', pos: [0, 0, 0], alive: true, isPlayer: true }] });
  }
  const s1State = bt.exportState();
  assert.ok((s1State.sector ?? 0) > s0Sector || s1State.objectives[0].secured, 'Breakthrough should advance sector after sector 0 capture');

  // 3. Co-op Rescue: role-differentiated facility repair & survivor extraction
  const rescue = M.createGameModeController('coop_rescue', {
    mapSpec: {
      objectives: [
        { id: 'F1', pos: [10, 0, 10] },
        { id: 'F2', pos: [30, 0, 10] },
        { id: 'R1', pos: [50, 0, 10] },
      ],
    },
  });
  rescue.init([{ id: 'c1', name: 'C1', team: 'blue', role: 'engineer' }]);
  for (let i = 0; i < 20; i++) {
    rescue.update(0.5, { units: [{ id: 'c1', team: 'blue', role: 'engineer', pos: [10, 0, 10], alive: true, isPlayer: true }] });
  }
  const rSnap = rescue.exportState();
  assert.ok(rSnap.facilitiesRepaired >= 1 || rSnap.objectives[0].progress > 0, 'Co-op rescue should progress facility repair');

  // 4. Co-op Campaign: shared 14-chapter progression
  const coop = M.createGameModeController('coop_campaign', { startChapterIndex: 1 });
  coop.init([{ id: 'p1', name: 'P1', team: 'blue' }]);
  assert.equal(coop.exportState().chapterIndex, 1);
  assert.equal(coop.advanceToNextChapter(), true);
  assert.equal(coop.exportState().chapterIndex, 2);

  // 5. Sandbox: free roam & world events without match termination
  const sb = M.createGameModeController('sandbox', {});
  sb.init([{ id: 's1', name: 'S1', team: 'blue' }]);
  sb.triggerWorldEvent('storm_surge');
  sb.update(1.0);
  assert.equal(sb.exportState().winner, null, 'Sandbox should not prematurely terminate');

  // Anti-rollback: older stateSeq must be ignored by applyState
  const newerSeq = conq.exportState().stateSeq + 10;
  conq.applyState({ ...conq.exportState(), stateSeq: newerSeq, tickets: { blue: 88, red: 77 } });
  assert.equal(conq.exportState().tickets.blue, 88);
  conq.applyState({ ...conq.exportState(), stateSeq: newerSeq - 5, tickets: { blue: 10, red: 10 } });
  assert.equal(conq.exportState().tickets.blue, 88, 'Stale stateSeq snapshot must be rejected');
});

test('SaltlineMPMaps: 5 expanded 360x320m WorldEngine 3D maps with displaced terrain & clean GPU unload', () => {
  const sandbox = makeSandbox();
  let builtBuildings = 0;
  sandbox.WorldEngine = {
    createMaterialLibrary: (THREE) => ({
      get: () => new THREE.MeshStandardMaterial({ color: 0x556677 }),
      dispose: () => {},
    }),
    createBuildingGenerator: (THREE) => ({
      createCoastalBuildingTask: (root, cfg) => {
        builtBuildings++;
        const g = new THREE.Group();
        g.name = `bldg-${cfg.styleName}`;
        root.add(g);
        return { group: g, step: () => true };
      },
      dispose: () => {},
    }),
  };
  loadBrowserScript('saltline-mp-maps.js', sandbox);
  const Maps = sandbox.SaltlineMPMaps;
  assert.ok(Maps, 'SaltlineMPMaps should attach to window');
  assert.equal(Maps.MAP_BOUNDS.width, 360, 'MP maps must be expanded to 360m width');
  assert.equal(Maps.MAP_BOUNDS.depth, 320, 'MP maps must be expanded to 320m depth');
  assert.ok(Maps.highlandElevation(100, -70) > Maps.highlandElevation(-110, 70) + 4, 'Highland passage must have continuous multi-meter elevation slope');

  const requiredIds = ['coastal_metropolis', 'iron_harbor', 'highland_passage', 'old_saltline', 'industrial_coast'];
  assert.equal(Maps.MP_MAPS.length, 5, 'Should define 5 independent multiplayer maps');
  const objectiveSignatures = new Set();

  const THREE = makeMockThree();
  const scene = new THREE.Group();
  const loader = Maps.createMultiplayerMapLoader({ THREE, scene });

  for (const mapId of requiredIds) {
    const meta = Maps.resolveMapSpec(mapId);
    assert.ok(meta && meta.id === mapId, `Missing map metadata for ${mapId}`);
    assert.ok(typeof meta.previewSvg === 'string' && meta.previewSvg.includes('<rect'), `${mapId} needs preview SVG markup`);
    assert.ok(Array.isArray(meta.objectives) && meta.objectives.length >= 5, `${mapId} needs >=5 spread-out objectives`);
    objectiveSignatures.add(JSON.stringify(meta.objectives.map((o) => o.pos || [o.x, o.z])));

    const loaded = loader.loadMap(mapId);
    assert.ok(loaded, `loadMap(${mapId}) should return map handle`);
    assert.equal(loaded.id, mapId);
    assert.equal(loaded.meta.id, mapId, 'Must expose loaded.meta for index.html compatibility');
    assert.equal(loaded.usesWorldEngine, true, `${mapId} must use WorldEngine MaterialLibrary + BuildingGenerator`);
    assert.ok(loaded.buildingCount >= 4, `${mapId} must generate >=4 WorldEngine architectural buildings`);
    assert.equal(scene.children.length, 1, 'Only active map group should be mounted in scene');

    loader.unloadMap();
    assert.equal(scene.children.length, 0, `${mapId} unloadMap() must remove all scene children`);
  }

  assert.ok(builtBuildings >= 25, `Expected >=25 WorldEngine buildings across 5 maps, got ${builtBuildings}`);
  assert.equal(objectiveSignatures.size, 5, 'All 5 maps must have distinct spatial objective layouts');
});

test('server/lan.cjs & port-mp-sync.js: authority, stateSeq, vehicle locks, event dedup & rematch auth', () => {
  const lanSrc = fs.readFileSync(path.join(ROOT, 'server/lan.cjs'), 'utf8');
  const syncSrc = fs.readFileSync(path.join(ROOT, 'port-mp-sync.js'), 'utf8');
  const portLanSrc = fs.readFileSync(path.join(ROOT, 'port-lan.js'), 'utf8');

  for (const asset of ['saltline-campaign-core.js', 'saltline-campaign-menu.js', 'saltline-mp-modes.js', 'saltline-mp-maps.js']) {
    assert.ok(lanSrc.includes(asset), `server/lan.cjs ASSETS missing ${asset}`);
  }
  assert.ok(lanSrc.includes('stateSeq'), 'server/lan.cjs must maintain monotonic stateSeq');
  assert.ok(lanSrc.includes('vehicleLocks'), 'server/lan.cjs must maintain server-authoritative vehicleLocks');
  assert.ok(lanSrc.includes('seenEventIds'), 'server/lan.cjs must deduplicate events by eventId');
  assert.ok(lanSrc.includes('releasePlayerVehicleLocks'), 'server/lan.cjs must release vehicle locks on disconnect');

  assert.ok(syncSrc.includes('Authorization'), 'port-mp-sync.js must send Bearer auth header on rematch');
  assert.ok(syncSrc.includes('lastAppliedStateSeq'), 'port-mp-sync.js must guard against stale stateSeq rollback');
  assert.ok(syncSrc.includes('requestVehicleEnter'), 'port-mp-sync.js must expose vehicle lock API');

  assert.ok(portLanSrc.includes('coastal_metropolis') || portLanSrc.includes('SaltlineMPMaps'), 'port-lan.js must integrate SaltlineMPMaps');
  assert.ok(portLanSrc.includes('coop_campaign') || portLanSrc.includes('SaltlineMPModes'), 'port-lan.js must integrate SaltlineMPModes');
});
