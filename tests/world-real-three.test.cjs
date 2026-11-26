const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadRealThreeWorldEngine() {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const scope = vm.createContext({
    window: {},
    document: {
      createElementNS: () => ({ addEventListener() {}, removeEventListener() {}, src: '' }),
      createElement: () => ({
        width: 256,
        height: 256,
        getContext: () => ({
          fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '', textBaseline: '',
          fillRect() {}, strokeRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {},
          fill() {}, arc() {}, fillText() {}, clearRect() {}, createLinearGradient: () => ({ addColorStop() {} }),
          createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
          getImageData: () => ({ data: new Uint8ClampedArray(256 * 256 * 4) }),
          putImageData() {},
        }),
      }),
    },
    performance,
    console,
    AbortController,
  });
  const threeChunk = html.slice(html.indexOf('var _M=Object.defineProperty'), html.indexOf('var oi='));
  vm.runInContext(threeChunk + '\nwindow.THREE=lt;', scope);
  for (const rel of [
    '../WorldEngine/Materials/MaterialLibrary.js',
    '../WorldEngine/Assets/BuildingGenerator.js',
    '../WorldEngine/Assets/UrbanPlanningSystem.js',
    '../WorldEngine/Terrain/TerrainGenerator.js',
    '../WorldEngine/Rendering/LightingSystem.js',
    '../WorldEngine/Performance/ChunkManager.js',
  ]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, rel), 'utf8'), scope);
  }
  return { THREE: scope.window.THREE, WE: scope.window.WorldEngine };
}

const { THREE, WE } = loadRealThreeWorldEngine();

test('Real Three.js: all 9 archetypes and structural variants build cleanly with valid geometry, Box3 bounds, and zero unload leaks', () => {
  const matLib = WE.createMaterialLibrary(THREE);
  const sharedMats = {
    steelDark: new THREE.MeshStandardMaterial({ color: 0x222a30 }),
    steelGalv: new THREE.MeshStandardMaterial({ color: 0x7c868e }),
    brickWeathered: new THREE.MeshStandardMaterial({ color: 0x6c4234 }),
    concreteDirty: new THREE.MeshStandardMaterial({ color: 0x8a8d87 }),
    slateSteel: new THREE.MeshStandardMaterial({ color: 0x3a4650 }),
    smokedPane: new THREE.MeshStandardMaterial({ color: 0x1c2c38 }),
    blindPane: new THREE.MeshStandardMaterial({ color: 0x5c6468 }),
    corrugated: new THREE.MeshStandardMaterial({ color: 0x3b4448 }),
    redCore: new THREE.MeshBasicMaterial({ color: 0xff3b2f }),
    cargoTeal: new THREE.MeshStandardMaterial({ color: 0x22555c }),
    cargoNavy: new THREE.MeshStandardMaterial({ color: 0x1d3448 }),
  };
  const gen = WE.createBuildingGenerator(THREE, matLib, sharedMats);
  assert.equal(gen.archetypes.length, 9);

  for (let i = 0; i < gen.archetypes.length; i++) {
    const styleName = gen.archetypes[i];
    for (const variant of [0, 1, 2]) {
      const parent = new THREE.Group();
      const colliders = [];
      const task = gen.createCoastalBuildingTask(parent, {
        cx: 0, cz: 0, width: 22, depth: 18, height: 13.5,
        seed: 100 + i * 7 + variant, styleName, variant,
      }, { colliderTarget: colliders });

      assert.equal(task.totalPhases, 8);
      assert.equal(task.variant, variant);
      let steps = 0;
      while (!task.step()) steps++;
      assert.equal(steps, 7);
      assert.ok(parent.children.length > 0, `${styleName} v${variant} mounted`);
      assert.ok(colliders.length > 0, `${styleName} v${variant} generated colliders`);

      let instCount = 0;
      parent.traverse(node => {
        if (node.isInstancedMesh) instCount += node.count;
      });
      assert.ok(instCount > 10, `${styleName} v${variant} has instanced geometry (${instCount})`);

      const box = new THREE.Box3().setFromObject(parent);
      assert.ok(!box.isEmpty(), `${styleName} v${variant} has non-empty Box3`);
      assert.ok(box.max.y > 5, `${styleName} v${variant} height > 5m`);

      // Cancel/unload must cleanly dispose per-building streamOwned geometries without throwing
      task.cancel();
      assert.equal(parent.children.length, 0);
    }
  }

  // Test mid-build cancellation (after 4 phases) + rebuild lifecycle
  const parcel = new THREE.Group();
  const partialTask = gen.createCoastalBuildingTask(parcel, {
    cx: 10, cz: -50, width: 20, depth: 16, height: 12, seed: 42, styleName: 'modern_office', variant: 1,
  });
  for (let s = 0; s < 4; s++) assert.equal(partialTask.step(), false);
  partialTask.cancel();
  assert.equal(partialTask.step(), true);
  assert.equal(parcel.children.length, 0);

  gen.dispose();
  matLib.dispose();
});

test('Real Three.js: UrbanPlanningSystem exposes 5 distinct inland districts, plazas, and coastal park', () => {
  const dummyMat = new THREE.MeshStandardMaterial({ color: 0x777777 });
  const quarter = WE.planCoastalQuarter({
    brickWeathered: dummyMat, concrete: dummyMat, plasterGrey: dummyMat, concreteDirty: dummyMat,
  });
  assert.ok(quarter.lots.length >= 12, 'Expanded beyond original 9 lots');
  assert.ok(quarter.districts.length >= 5, 'Includes residential, commercial plaza, promenade & park districts');
  assert.ok(quarter.parks.length >= 1, 'Includes coastal park transition zone');
  for (const lot of quarter.lots) {
    assert.ok(lot.x1 <= 24, `Lot ${lot.style} stays strictly inland (x1=${lot.x1})`);
    assert.ok(lot.width >= 8 && lot.depth >= 7.2);
  }
});

test('Real Three.js: TerrainGenerator builds multi-biome vertex-colored tiles, cliffs, and instanced multi-species forest', () => {
  const matLib = WE.createMaterialLibrary(THREE);
  const terrain = WE.createTerrainGenerator(THREE, matLib);
  const tileGeo = terrain.tileGeometry(-240, -60, -210, -30, 4);
  assert.ok(tileGeo.attributes.position.count > 40);
  assert.ok(tileGeo.attributes.color.count === tileGeo.attributes.position.count);
  assert.ok(tileGeo.attributes.normal.count === tileGeo.attributes.position.count);
  tileGeo.dispose();

  const root = new THREE.Group();
  const cliff = terrain.buildStratifiedCliff(root);
  assert.ok(cliff.geometry.attributes.position.count > 100);
  const updaters = [];
  const trunkGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3828 });
  const forest = terrain.buildWindPineForest(root, null, trunkGeo, trunkMat, [
    [-222, 8, -40, 1.0], [-226, 10, -20, 1.1], [-224, 9, 0, 0.95],
    [-225, 9, 20, 1.05], [-223, 8, 40, 1.0], [-227, 11, 60, 1.15],
  ], updaters);
  assert.ok(forest.pineInst.isInstancedMesh);
  assert.ok(forest.cypressInst.isInstancedMesh);
  assert.ok(forest.shrubInst.isInstancedMesh);
  assert.ok(forest.rockInst.isInstancedMesh);
  assert.ok(updaters.length === 1);

  trunkGeo.dispose();
  trunkMat.dispose();
  terrain.dispose();
  matLib.dispose();
});
