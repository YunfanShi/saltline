const test = require('node:test');
const assert = require('node:assert/strict');
const { createState } = require('../train-slice.js');

test('ten runs stay on connected roofs, hit distinct targets, restore a checkpoint and complete', () => {
  for (let run=0; run<10; run++) {
    const game=createState();
    for(let i=0;i<301;i++) game.update(.05,{side:1});
    assert.equal(game.snapshot.phase,'contact');
    assert.equal(game.snapshot.x,1.3);
    assert.equal(game.hit(0),true);
    assert.equal(game.hit(0),false);
    assert.equal(game.hit(1),true);
    assert.equal(game.snapshot.phase,'pursuit');
    const checkpoint=game.checkpoint;
    game.pause(true);
    for(let i=0;i<200;i++) game.update(.05,{forward:1});
    assert.deepEqual(game.snapshot,checkpoint);
    game.pause(false);
    for(let i=0;i<900;i++) game.update(.05,{forward:1});
    assert.ok(['bridge','derail','complete'].includes(game.snapshot.phase));
    assert.ok(game.snapshot.z>=-16.4 && game.snapshot.z<=16.4);
    game.retry();
    assert.deepEqual(game.snapshot,checkpoint);
    for(let i=0;i<1100;i++) game.update(.05,{forward:1});
    assert.equal(game.snapshot.phase,'complete');
  }
});

test('distance and phases agree at 30 and 60 frames per second', () => {
  function run(dt) { const g=createState(); for(let t=0;t<30/dt;t++)g.update(dt); return g.snapshot; }
  const a=run(1/30), b=run(1/60);
  assert.ok(Math.abs(a.distance-b.distance)<.01);
  assert.equal(a.phase,b.phase);
});
