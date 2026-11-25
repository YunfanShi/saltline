const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function createDirector(freeRoam) {
  class Vec {
    constructor(x=0,y=0,z=0){this.set(x,y,z)}
    set(x,y,z){Object.assign(this,{x,y,z});return this}
    copy(v){return this.set(v.x,v.y,v.z)}
    clone(){return new Vec(this.x,this.y,this.z)}
    normalize(){return this}
    addScaledVector(v,n){this.x+=v.x*n;this.y+=v.y*n;this.z+=v.z*n;return this}
    distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z)}
  }
  class Node {
    constructor(geometry,material){this.geometry=geometry;this.material=material;this.children=[];this.position=new Vec();this.rotation=new Vec();this.scale=new Vec();this.quaternion={setFromUnitVectors(){}}}
    add(...nodes){this.children.push(...nodes)}
    remove(...nodes){this.children=this.children.filter(n=>!nodes.includes(n))}
    traverse(fn){fn(this);this.children.forEach(n=>n.traverse(fn))}
    removeFromParent(){}
  }
  class Geo {dispose(){}}
  class Material {constructor(options={}){Object.assign(this,options)} clone(){return new Material(this)} dispose(){}}
  const THREE={Group:Node,Mesh:Node,Vector3:Vec,BoxGeometry:Geo,CylinderGeometry:Geo,SphereGeometry:Geo,PlaneGeometry:Geo,RingGeometry:Geo,CircleGeometry:Geo,MeshStandardMaterial:Material,MeshBasicMaterial:Material};
  const element=()=>({style:{},remove(){}});
  const document={getElementById(){return null},createElement:element,head:{appendChild(){}},body:{append(){}}};
  const scope=vm.createContext({window:{},document,setTimeout,clearTimeout,Math});
  vm.runInContext(fs.readFileSync(require.resolve('../port-disaster-events.js'),'utf8'),scope);
  const player={alive:true,pos:new Vec(),vel:new Vec(),addShake(){}};
  const world={THREE,scene:new Node(),player,openWorld:{freeRoam}};
  return {director:scope.window.createPortDisasterEvents(world),world,player};
}

test('automatic random events run during free roam and pause during campaign',()=>{
  const {director,world,player}=createDirector(true);
  director.setAutoRandom(true);
  world.openWorld.freeRoam=false;
  director.update(46,player);
  assert.equal(director.active,false);
  world.openWorld.freeRoam=true;
  director.update(46,player);
  assert.equal(director.active,true);
  director.dispose();
});

test('stopping a tsunami resets the exposed flood level',()=>{
  const {director,player}=createDirector(true);
  director.triggerTsunami();
  director.update(13,player);
  assert.ok(director.waterLevel>1);
  director.stopAllEvents();
  assert.equal(director.waterLevel,-1);
  director.dispose();
});
