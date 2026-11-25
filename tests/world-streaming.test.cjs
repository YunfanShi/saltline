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

test('all textures and buffers of shipped glTF models resolve locally',()=>{
  const path=require('node:path');
  const root=path.join(__dirname,'../assets/models');
  for (const entry of fs.readdirSync(root,{withFileTypes:true}).filter(e=>e.isDirectory())) {
    const dir=path.join(root,entry.name);
    const gltf=JSON.parse(fs.readFileSync(path.join(dir,'scene.gltf')));
    for (const ref of [...gltf.images,...gltf.buffers]){
      const file=path.join(dir,ref.uri);
      assert.ok(fs.statSync(file).size>0,file);
      if(ref.byteLength) assert.equal(fs.statSync(file).size,ref.byteLength,file);
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
