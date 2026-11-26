const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const scope = vm.createContext({window:{}, performance});
for (const file of ['Terrain/TerrainGenerator','Performance/ChunkManager','Assets/UrbanPlanningSystem'])
  vm.runInContext(fs.readFileSync(require.resolve('../WorldEngine/'+file+'.js'),'utf8'),scope);
const engine = scope.window.WorldEngine;

test('surveyed land is continuous through the old escarpment seams and leaves the dock open',()=>{
  const terrain = engine.createTerrainGenerator({},{});
  for(const z of [-28,46]) assert.ok(Math.abs(terrain.floorAt(-234,z+.0001)-terrain.floorAt(-234,z-.0001)) < .001);
  assert.equal(terrain.floorAt(8,91),undefined);
  for(const lot of engine.planCoastalQuarter({}).lots) assert.equal(terrain.floorAt(lot.cx,lot.cz),.16);
});

test('a dormant chunk retains shared geometry until the last reference unloads',()=>{
  let disposals=0, builds=0, unloads=0;
  const geometry={userData:{streamOwned:true},dispose(){disposals++}};
  const sectors=[0,16].map(center=>({center,streamRadius:10,detailRadius:3,
    shell:{traverse(fn){fn({geometry})}},detail:{traverse(){}},
    onBuild(){builds++},onUnload(){unloads++}}));
  const manager=engine.createChunkManager({sectors,hysteresis:2,dormantTtlSec:1});
  const move=x=>manager.update(1,{distanceTo:center=>Math.abs(x-center)});
  move(8); move(0); move(8); move(0); move(0);
  assert.equal(disposals,0); assert.equal(unloads,1);
  move(40); move(40);
  assert.equal(disposals,1); assert.equal(builds,2); assert.equal(unloads,2);
  assert.equal(manager.getStats().trackedResources,0);
});

test('quality LOD changes preserve loaded collision and leave renderer resolution to its owner',()=>{
  let colliders = 0, pixelChanges = 0;
  const shell = { visible:false }, detail = { visible:false };
  const skyline = { visible:true };
  const sector = { center:0, streamRadius:200, detailRadius:100, shell, detail,
    onLodChange(loaded, detailed, quality) {
      const full = loaded && (detailed || !['low','medium'].includes(quality));
      shell.visible = full;
      skyline.visible = !full;
    } };
  const mgr = engine.createChunkManager({ sectors:[sector], quality:'low',
    renderer:{ setPixelRatio(){ pixelChanges++; } }, manageResolution:false,
    syncColliders(sec, enabled){ colliders += enabled ? 1 : -1; } });
  const move = distance => mgr.update(.016,{ distanceTo:()=>distance });
  move(80);
  assert.equal(sector.loaded,true);
  assert.equal(colliders,1);
  assert.equal(shell.visible,false);
  assert.equal(skyline.visible,true);
  move(20);
  assert.equal(shell.visible,true);
  assert.equal(skyline.visible,false);
  move(120);
  assert.equal(shell.visible,false);
  mgr.setQuality('high');
  move(120);
  assert.equal(shell.visible,true);
  assert.equal(colliders,1);
  mgr.dispose();
  assert.equal(colliders,0);
  assert.equal(pixelChanges,0);
});

test('all textures and buffers of shipped glTF models resolve locally',()=>{
  const path=require('node:path');
  const root=path.join(__dirname,'../assets/models');
  for (const entry of fs.readdirSync(root,{withFileTypes:true}).filter(e=>e.isDirectory())) {
    const dir=path.join(root,entry.name);
    const gltfPath=path.join(dir,'scene.gltf');
    if (fs.existsSync(gltfPath)) {
      const gltf=JSON.parse(fs.readFileSync(gltfPath));
      for (const ref of [...gltf.images,...gltf.buffers]){
        const file=path.join(dir,ref.uri);
        assert.ok(fs.statSync(file).size>0,file);
        if(ref.byteLength) assert.equal(fs.statSync(file).size,ref.byteLength,file);
      }
    } else {
      const glbs=fs.readdirSync(dir).filter(f=>f.endsWith('.glb'));
      assert.ok(glbs.length>0,dir);
      for (const g of glbs) {
        const buf=fs.readFileSync(path.join(dir,g));
        assert.ok(buf.byteLength>12 && buf.readUInt32LE(0)===0x46546c67,path.join(dir,g));
      }
    }
  }
});

test('a descending ray intersects the rendered escarpment and misses the drydock void',()=>{
  const terrain=engine.createTerrainGenerator({},{});
  const distance=terrain.intersectRay({x:-232,y:25,z:52},{x:0,y:-1,z:0},30);
  assert.ok(Math.abs(distance-(25-terrain.sampleHeight(-232,52)))<.003);
  assert.equal(terrain.intersectRay({x:10,y:8,z:92},{x:0,y:-1,z:0},12),null);
});

test('leaving a partially built cell cancels it, disposes streamOwned GPU assets, and re-entry builds cleanly',()=>{
  let step=0,unloads=0,disposals=0;
  const builtGeos=[];
  const sector={center:0,streamRadius:9,
    shell:{traverse(fn){for(const g of builtGeos) fn({geometry:g});}},
    detail:{traverse(){}},
    onBuild(){
      builtGeos.push({userData:{streamOwned:true},dispose(){disposals++}});
      return ++step===2;
    },
    onUnload(){builtGeos.length=0;step=0;unloads++}};
  const mgr=engine.createChunkManager({sectors:[sector],hysteresis:1});
  const move=x=>mgr.update(.016,{distanceTo:()=>x});
  assert.equal(move(1).loadedCount,0);
  assert.equal(builtGeos.length,1);
  // Leaving before step 2 completes MUST dispose the partially built streamOwned geometry (no GPU leak!)
  move(15);
  assert.equal(unloads,1);
  assert.equal(disposals,1);
  assert.equal(move(1).loadedCount,0);
  assert.equal(move(1).loadedCount,1);
  mgr.dispose();
  assert.equal(unloads,2);
  assert.equal(disposals,3);
});

test('LightingSystem invalidates stale light cache and modulates dynamic night lights + emissive windows',()=>{
  const scopeL = vm.createContext({window:{}, performance});
  vm.runInContext(fs.readFileSync(require.resolve('../WorldEngine/Rendering/LightingSystem.js'),'utf8'),scopeL);
  class FakeColor { constructor(h=0){this.h=h;} setHex(h){this.h=h;return this;} lerp(){return this;} getHex(){return this.h;} }
  class FakeVec3 { constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;} copy(v){Object.assign(this,v);return this;} multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this;} }
  const scene = { children: [], fog: { color: new FakeColor(), density: 0.001 }, traverse(fn){ for(const c of this.children) fn(c); } };
  const sunA = { isDirectionalLight: true, parent: scene, position: new FakeVec3(), color: new FakeColor(), intensity: 1 };
  scene.children.push(sunA);
  const ls = scopeL.window.WorldEngine.createLightingSystem({ Color: FakeColor, Vector3: FakeVec3 }, { scene, renderer: {} });
  const lamp = { parent: scene, intensity: 0 };
  const winMat = { emissiveIntensity: 0 };
  ls.registerDynamicLight(lamp, { dayIntensity: 0, nightIntensity: 24 });
  ls.registerEmissiveMaterial(winMat, { day: 0.25, night: 1.6 });

  ls.setTimeOfDay(13.0); // Noon
  assert.equal(lamp.intensity, 0);
  assert.ok(Math.abs(winMat.emissiveIntensity - 0.25) < 0.01);

  // Dynamically add a second light to the scene — cache must refresh automatically!
  const sunB = { isDirectionalLight: true, parent: scene, position: new FakeVec3(), color: new FakeColor(), intensity: 0 };
  scene.children.push(sunB);
  ls.setTimeOfDay(23.0); // Night
  assert.ok(sunB.intensity > 0.5, 'newly added directional light should be updated after cache refresh');
  assert.equal(lamp.intensity, 24);
  assert.ok(Math.abs(winMat.emissiveIntensity - 1.6) < 0.01);
  ls.dispose();
});

test('BuildingGenerator executes true 8-stage phased generation with per-phase timing across all 9 archetypes', () => {
  const scopeB = vm.createContext({ window: {}, performance });
  vm.runInContext(fs.readFileSync(require.resolve('../WorldEngine/Materials/MaterialLibrary.js'), 'utf8'), scopeB);
  vm.runInContext(fs.readFileSync(require.resolve('../WorldEngine/Assets/BuildingGenerator.js'), 'utf8'), scopeB);

  class Vec2 { constructor(x = 0, y = 0) { this.x = x; this.y = y; } }
  class Vec3 { constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; } }
  class Mat4 { clone() { return new Mat4(); } }
  class Obj3D {
    constructor() { this.children = []; this.position = { set() {} }; this.rotation = { set() {} }; this.scale = { set() {} }; this.matrix = new Mat4(); }
    add(...items) { this.children.push(...items); }
    updateMatrix() {}
  }
  class Geo {
    constructor() { this.userData = {}; }
    translate() {} rotateX() {} rotateY() {} computeVertexNormals() {} dispose() {}
  }
  class Inst extends Obj3D { constructor(geo, mat, count) { super(); this.geometry = geo; this.material = mat; this.count = count; this.isInstancedMesh = true; } setMatrixAt() {} dispose() {} }
  class Mat { constructor(o = {}) { Object.assign(this, o); this.userData = {}; } clone() { return new Mat(this); } dispose() {} }
  const FakeTHREE = {
    Group: Obj3D, Mesh: class extends Obj3D { constructor(g, m) { super(); this.geometry = g; this.material = m; } },
    BoxGeometry: Geo, CylinderGeometry: Geo, ExtrudeGeometry: Geo, Shape: class {},
    InstancedMesh: Inst, Object3D: Obj3D, Vector2: Vec2, Vector3: Vec3,
    MeshStandardMaterial: Mat, MeshBasicMaterial: Mat, Color: class {},
  };

  const matLib = scopeB.window.WorldEngine.createMaterialLibrary(FakeTHREE, {});
  const shared = { steelDark: new Mat(), steelGalv: new Mat(), blindPane: new Mat(), redCore: new Mat(), cargoTeal: new Mat(), cargoNavy: new Mat() };
  const gen = scopeB.window.WorldEngine.createBuildingGenerator(FakeTHREE, matLib, shared);

  assert.equal(gen.archetypes.length, 9);
  for (const style of gen.archetypes) {
    const parent = new Obj3D();
    const colliders = [];
    const task = gen.createCoastalBuildingTask(parent, { cx: -50, cz: -100, width: 24, depth: 18, height: 14, seed: 7, styleName: style, labelZh: '测试建筑' }, { colliderTarget: colliders });
    assert.deepEqual(Array.from(task.phaseNames), ['structure', 'facade', 'openings', 'roof', 'attachments', 'interior', 'colliders', 'activate']);
    let steps = 0, done = false;
    while (!done) {
      done = task.step();
      steps++;
      if (!done) assert.equal(parent.children.length, 0, `${style}: should not mount to parent before activate phase`);
    }
    assert.equal(steps, 8, `${style}: must take exactly 8 phased steps`);
    assert.equal(parent.children.length, 1, `${style}: must mount on final activate phase`);
    assert.equal(task.phaseTimings.length, 8);
    assert.ok(task.phaseTimings[0].ops > 0, `${style}: structure phase must perform real work`);
    assert.ok(colliders.length >= 1, `${style}: colliders phase must emit collider specs`);
    for (const pt of task.phaseTimings) assert.ok(pt.ms >= 0);
  }
  assert.equal(scopeB.window.SALTLINE_BUILD_TIMINGS.length, 9);
  gen.dispose();
  matLib.dispose();
});

test('UrbanPlanningSystem exposes irregular setbacks, alleys, plazas, and green spaces; MaterialLibrary fixes grass_coastal', () => {
  const quarter = engine.planCoastalQuarter({});
  assert.ok(quarter.lots.length >= 9);
  assert.ok(quarter.alleys.length >= 3);
  assert.ok(quarter.plazas.length >= 2);
  assert.ok(quarter.greenSpaces.length >= 6);
  const styles = new Set(quarter.lots.map(l => l.style));
  assert.ok(styles.has('stepped_mixed_use'));
  assert.ok(styles.has('bonded_warehouse'));
  assert.ok(styles.has('waterfront_rowhouses'));

  const matSrc = fs.readFileSync(require.resolve('../WorldEngine/Materials/MaterialLibrary.js'), 'utf8');
  assert.match(matSrc, /grass_coastal:\s*\{[^}]*kind:\s*'grass'/);
  assert.match(matSrc, /coastal_soil:\s*\{[^}]*kind:\s*'soil'/);
  assert.match(matSrc, /roof_slate:\s*\{[^}]*kind:\s*'roof_slate'/);
  assert.match(matSrc, /roof_zinc:\s*\{[^}]*kind:\s*'roof_zinc'/);
});

test('preloaded chunks retain shared owned resources until every chunk unloads',()=>{
  let disposals=0;
  const geometry={userData:{streamOwned:true},dispose(){disposals++}};
  const sectors=[0,16].map(center=>({center,streamRadius:10,loaded:true,
    shell:{traverse(fn){fn({geometry})}},detail:{traverse(){}}}));
  const manager=engine.createChunkManager({sectors,hysteresis:2,dormantTtlSec:1});
  const move=x=>manager.update(1,{distanceTo:center=>Math.abs(x-center)});
  move(0); move(0);
  assert.equal(disposals,0);
  move(40); move(40);
  assert.equal(disposals,1);
});
