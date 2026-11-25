const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');

test('an escort follows the player along a leg longer than both proximity radii', () => {
  const window = { SaltlineCampaign: { createEvidence: () => ({}) } };
  vm.runInNewContext(readFileSync(require.resolve('../port-campaign-continuation.js'), 'utf8'), { window });
  class Vector {
    constructor(x = 0, y = 0, z = 0) { Object.assign(this, { x, y, z }); }
    copy(other) { Object.assign(this, other); return this; }
    subVectors(a, b) { return this.copy({ x: a.x-b.x, y: a.y-b.y, z: a.z-b.z }); }
    length() { return Math.hypot(this.x, this.y, this.z); }
    distanceTo(other) { return Math.hypot(this.x-other.x, this.y-other.y, this.z-other.z); }
    addScaledVector(other, scale) {
      this.x += other.x*scale;
      this.y += other.y*scale;
      this.z += other.z*scale;
      return this;
    }
  }
  const light = () => ({ userData: {} });
  const nurse = { position: new Vector(), rotation: {}, userData: {} };
  const point = new Vector(28, 0, 0);
  const layout = {
    id: 'return-harbor',
    model: {},
    points: { nurse: new Vector(), 'light-a': new Vector(29, 0, 0) },
    objects: { nurse, 'light-west': light(), 'light-pumps': light(), 'light-cross': light() },
    routes: { west: [point] },
  };
  const world = { THREE: { Vector3: Vector }, physics: { lineOfSight: () => true } };
  const mission = window.createPortContinuationChapter(world, layout);
  mission.show(true);
  mission.reset({ phase: 'west', stage: 1 });
  const pos = new Vector(5, 0, 0);
  const player = { pos, eye: new Vector(5, 1.5, 0), alive: true };
  assert.ok(pos.distanceTo(point) > 20);
  for (let frame = 0; frame < 12; frame++) mission.update(.1, player, false);
  assert.ok(nurse.position.x > 2.5);
  player.pos.x = 20;
  const stoppedAt = nurse.position.x;
  mission.update(.1, player, false);
  assert.equal(nurse.position.x, stoppedAt);
});

test('resuming a partially completed pilot handoff restores the escort at the table', () => {
  const window = { SaltlineCampaign: { createEvidence: () => ({ snapshot: {} }) } };
  vm.runInNewContext(readFileSync(require.resolve('../port-campaign-continuation.js'), 'utf8'), { window });
  class Vector {
    constructor(x = 0, y = 0, z = 0) { Object.assign(this, { x, y, z }); }
    copy(other) { Object.assign(this, other); return this; }
    subVectors(a, b) { return this.copy({ x:a.x-b.x, y:a.y-b.y, z:a.z-b.z }); }
    length() { return Math.hypot(this.x, this.y, this.z); }
    distanceTo(other) { return Math.hypot(this.x-other.x, this.y-other.y, this.z-other.z); }
    addScaledVector(other, scale) { this.x += other.x*scale; this.y += other.y*scale; this.z += other.z*scale; return this; }
  }
  const harris = { name:'harris', position:new Vector(), rotation:{}, userData:{} };
  const table = new Vector(30, 0, 0);
  const layout = { id:'last-pilot', model:{}, points:{ harris:new Vector(), 'harris-handoff':table },
    objects:{ harris }, routes:{ bridge:[new Vector(10, 0, 0), table] } };
  const mission = window.createPortContinuationChapter({ THREE:{ Vector3:Vector }, physics:{ lineOfSight:() => true } }, layout);
  mission.reset({ phase:'escort', stage:5, resume:'harris-handoff', route:'bridge', handoffStep:1 });
  mission.show(true);
  const player = { alive:true, pos:table, eye:new Vector(30, 1, 0) };
  const result = mission.update(.6, player, true);
  assert.equal(harris.position.x, 30);
  assert.equal(result.checkpointChanged, true);
  assert.equal(mission.checkpoint.handoffStep, 2);
});
