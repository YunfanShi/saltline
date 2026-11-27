const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const scope = {window:{}};
vm.runInNewContext(fs.readFileSync(require.resolve('../port-crash-rescue-slice.js'),'utf8'),scope);
function setup() {
  const calls = [];
  const point = {distanceTo: other => other.distance};
  const crash = { viewingSpot: point, phase:'idle',
    launch(options){calls.push(['launch',options]);this.phase='approach'},
    skip(options){calls.push(['skip',options]);this.phase='wreck'},
    update(){this.phase='wreck'}, reset(){this.phase='idle'} };
  const rescue = {phase:'inactive',snapshot:null, objective:['Locate','定位'],markers:[{id:'locator'}],resumePosition:point,
    start(){this.phase='search';this.snapshot={phase:'search'};return ['Search','搜索']},
    reset(snapshot){this.snapshot=snapshot||null;this.phase=snapshot?.phase||'inactive'},
    update(dt,player,interact){if(!interact)return {prompt:['Read','读取'],progress:0};
      if(this.phase==='search'){this.phase='escort';this.snapshot={phase:'escort',route:'ramp'};return {changed:true,radio:['Escort','护送']}}
      this.phase='complete';return {changed:true,complete:true}} };
  const slice=scope.window.createCrashRescueSlice({crash,rescue,onWreck:v=>calls.push(['wreck',v]),onRadio:v=>calls.push(['radio',v])});
  const player={alive:true,pos:{distance:5,distanceTo:other=>player.pos.distance}};
  return {slice,crash,rescue,calls,player};
}
test('lookout triggers crash then playable search and escort while wreck remains',()=>{
 const {slice,crash,calls,player}=setup();slice.start();
 assert.equal(slice.phase,'lookout');assert.equal(slice.markers[0].id,'crash-lookout');
 slice.update(.1,player);assert.equal(slice.phase,'lookout');
 player.pos.distance=1;slice.update(.1,player);assert.equal(slice.phase,'crash');
 slice.update(.1,player);assert.equal(slice.phase,'rescue');assert.equal(crash.phase,'wreck');
 assert.equal(slice.markers[0].id,'locator');assert.ok(slice.update(.1,player,false).prompt);
 slice.update(.6,player,true);assert.equal(slice.snapshot.route,'ramp');
 assert.equal(slice.update(.6,player,true).complete,true);assert.equal(slice.phase,'complete');
 assert.ok(calls.some(c=>c[0]==='wreck'&&c[1]));
 slice.dispose();assert.equal(crash.phase,'idle');assert.equal(calls.at(-1)[1],false);
});
test('death restores rescue checkpoint and silently reconstructs the wreck',()=>{
 const {slice,crash,rescue,calls,player}=setup();slice.start();player.pos.distance=1;
 slice.update(.1,player);slice.update(.1,player);slice.update(.6,player,true);
 player.alive=false;assert.equal(slice.update(.1,player).failed,true);assert.equal(slice.phase,'failed');
 player.alive=true;assert.equal(slice.restore(),true);assert.equal(rescue.phase,'escort');assert.equal(crash.phase,'wreck');
 assert.equal(calls.filter(c=>c[0]==='skip').length,1);assert.equal(calls.find(c=>c[0]==='skip')[1].silent,true);
});
test('failure before the crash restarts at the lookout',()=>{
 const {slice,player}=setup();slice.start();player.alive=false;slice.update(.1,player);
 assert.equal(slice.restore(),true);assert.equal(slice.phase,'lookout');assert.equal(slice.snapshot,null);
});
