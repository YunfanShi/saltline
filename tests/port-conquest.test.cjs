const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const assert = require('node:assert/strict');
const test = require('node:test');

const browser = { window: {} };
runInNewContext(readFileSync(require.resolve('../port-conquest.js'), 'utf8'), browser);

const at = (x, y = 0) => ({ x, y, z: 0 });
const unit = (x, y) => ({ alive: true, pos: at(x, y) });
function start(options) {
  return browser.window.createPortConquest([0, 30, 60].map((x, index) => ({
    id: 'relay-' + index, short: 'ABC'[index], o: { pos: at(x) }
  })), options);
}

test('both factions contest the same floor and enemy ownership bleeds blue tickets', () => {
  const game = start();
  game.update(4, unit(0), [unit(0)]);
  assert.equal(game.points[0].contested, true);
  assert.equal(game.points[0].control, -100);
  assert.ok(game.tickets.blue < 40);
  game.update(8, unit(0, 4), []);
  assert.equal(game.points[0].control, -100);
  game.update(8, unit(0), []);
  assert.equal(game.points[0].owner, null);
  game.update(8, unit(0), []);
  assert.equal(game.points[0].owner, 'blue');
});

test('a solo capture can win through ticket bleed and a finished round stays finished', () => {
  const game = start();
  game.update(8, unit(30), []);
  game.update(8, unit(60), []);
  assert.equal(game.points[1].owner, 'blue');
  assert.equal(game.points[2].owner, 'blue');
  game.update(49, unit(60), []);
  assert.equal(game.winner, 'blue');
  assert.equal(game.tickets.red, 0);
  const { elapsed } = game;
  game.casualty();
  game.update(10, unit(60), []);
  assert.equal(game.elapsed, elapsed);
  assert.equal(game.deaths, 0);
});

test('a casualty costs tickets once and respawns after three seconds', () => {
  const game = start();
  game.casualty();
  game.casualty();
  assert.equal(game.tickets.blue, 36);
  assert.equal(game.deaths, 1);
  assert.equal(game.update(2.9, { alive: false }, []).respawn, false);
  assert.equal(game.update(.1, { alive: false }, []).respawn, true);
  assert.equal(game.respawning, false);
});

test('the clock resolves an otherwise balanced battle', () => {
  const game = start();
  game.update(8, unit(30), []);
  game.update(232, unit(125), []);
  assert.equal(game.winner, 'draw');
  assert.equal(game.remaining, 0);
});

test('Breakthrough advances one sector at a time and permanently secures captured ground', () => {
  const game = start({ mode: 'breakthrough' });
  const [first, second, third] = game.points;
  assert.equal(game.activePoint, first);
  assert.equal(second.locked, true);
  game.update(30, unit(30), []);
  assert.equal(second.control, -100);
  assert.equal(game.tickets.blue, 40);
  game.update(20, unit(0), [unit(0)]);
  assert.equal(first.contested, true);
  assert.equal(first.control, -100);
  assert.equal(game.update(16, unit(0), []).captures[0], first);
  assert.equal(first.secured, true);
  assert.equal(second.locked, false);
  assert.equal(game.activePoint, second);
  assert.equal(game.tickets.red, 2);
  game.update(16, unit(30), [unit(0)]);
  assert.equal(first.owner, 'blue');
  assert.equal(game.activePoint, third);
  assert.equal(game.winner, null);
  game.update(16, unit(60), []);
  assert.equal(game.tickets.red, 0);
  assert.equal(game.activePoint, null);
  assert.equal(game.winner, 'blue');
});

test('Breakthrough attackers lose when their time or reinforcements expire', () => {
  const timed = start({ mode: 'breakthrough' });
  timed.update(239, unit(120), []);
  timed.update(30, unit(0), []);
  assert.equal(timed.winner, 'red');
  assert.equal(timed.remaining, 0);
  assert.equal(timed.points[0].control, -87);

  const attrition = start({ mode: 'breakthrough' });
  for (let index = 0; index < 10; index++) {
    attrition.killedMachine();
    attrition.casualty();
    attrition.update(3, { alive: false }, []);
  }
  assert.equal(attrition.tickets.red, 3);
  assert.equal(attrition.winner, 'red');
  assert.equal(attrition.deaths, 10);
  assert.equal(attrition.useSupport('mark'), false);
});

test('allies help secure sectors and support calls spend earned points', () => {
  const game = start({ mode: 'breakthrough' });
  assert.equal(game.useSupport('mark'), true);
  assert.equal(game.support.markUntil, 15);
  assert.equal(game.useSupport('mark'), false);
  assert.equal(game.useSupport('supply'), false);
  assert.equal(game.supportPoints, 1);
  game.update(16, unit(120), [], [unit(0)]);
  assert.equal(game.points[0].secured, true);
  assert.equal(game.supportPoints, 4);
  assert.equal(game.useSupport('reinforce', at(60)), false);
  assert.equal(game.useSupport('reinforce', at(30, 4)), false);
  assert.equal(game.useSupport('reinforce', at(30)), true);
  assert.equal(game.support.reinforcePosition, game.points[1].pos);
  game.update(8, unit(120), [unit(30)]);
  assert.equal(game.points[1].contested, true);
  assert.equal(game.points[1].control, -100);
  game.update(20, unit(120), []);
  assert.equal(game.points[1].control, 30);

  for (let index = 0; index < 20; index++) game.killedMachine();
  assert.equal(game.supportPoints, 12);
  assert.equal(game.useSupport('supply'), true);
  assert.equal(game.support.supplyUntil, game.elapsed + 3);
  assert.equal(game.useSupport('supply'), false);
  game.casualty();
  assert.equal(game.useSupport('mark'), false);
});
