const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const assert = require('node:assert/strict');
const test = require('node:test');

const browser = { window: {} };
runInNewContext(readFileSync(require.resolve('../port-conquest.js'), 'utf8'), browser);

const at = (x, y = 0) => ({ x, y, z: 0 });
const unit = (x, y) => ({ alive: true, pos: at(x, y) });
function start() {
  return browser.window.createPortConquest([0, 30, 60].map((x, index) => ({
    id: 'relay-' + index, short: 'ABC'[index], o: { pos: at(x) }
  })));
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
