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

test('leaving a partially built cell cancels it and re-entry builds from scratch',()=>{
  let step=0,unloads=0;
  const sector={center:0,streamRadius:9,shell:{},detail:{},
    onBuild(){return ++step===2},onUnload(){step=0;unloads++}};
  const mgr=engine.createChunkManager({sectors:[sector],hysteresis:1});
  const move=x=>mgr.update(.016,{distanceTo:()=>x});
  assert.equal(move(1).loadedCount,0);
  move(15); assert.equal(unloads,1);
  assert.equal(move(1).loadedCount,0); assert.equal(move(1).loadedCount,1);
  mgr.dispose(); assert.equal(unloads,2);
});
