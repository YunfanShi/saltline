const assert = require('node:assert/strict');
const test = require('node:test');
const createPortLoadout = require('../port-loadout.js');

function start(role) {
  const game = {
    game: {state: 'title', conquest: {}},
    player: {
      alive: true,
      health: 100,
      maxHealth: 100,
      heal(amount) { this.health += amount; },
      damage(amount) { this.health -= amount; }
    },
    weapon: {magSize: 30, reserve: 150, addAmmo(amount) { this.reserve += amount; }},
    enemies: {list: []}
  };
  const loadout = createPortLoadout(game, null);
  assert.equal(loadout.select(role), true);
  loadout.reset();
  game.game.state = 'playing';
  return {game, loadout};
}

test('medic spends cooldown only when healing, and cannot heal past max health', () => {
  const {game, loadout} = start('medic');
  assert.equal(loadout.activate(), false);
  assert.equal(loadout.cooldown, 0);
  game.player.damage(60);
  assert.equal(loadout.activate(), true);
  assert.equal(game.player.health, 80);
  assert.equal(loadout.activate(), false);
  loadout.update(24);
  assert.equal(loadout.activate(), true);
  assert.equal(game.player.health, 100);
});

test('support refills reserve without modifying the loaded magazine', () => {
  const {game, loadout} = start('support');
  game.weapon.reserve = 68;
  game.weapon.ammo = 12;
  assert.equal(loadout.activate(), true);
  assert.equal(game.weapon.reserve, 128);
  assert.equal(game.weapon.ammo, 12);
  loadout.update(20);
  assert.equal(loadout.activate(), true);
  assert.equal(game.weapon.reserve, 150);
});

test('engineer protection pauses with gameplay and clears on redeployment', () => {
  const {game, loadout} = start('engineer');
  assert.equal(loadout.activate(), true);
  game.player.damage(20);
  assert.equal(game.player.health, 90);
  game.game.state = 'paused';
  loadout.update(10);
  assert.equal(loadout.cooldown, 26);
  game.game.state = 'playing';
  game.player.damage(20);
  assert.equal(game.player.health, 80);
  loadout.update(8);
  game.player.damage(20);
  assert.equal(game.player.health, 60);
  loadout.reset();
  assert.equal(loadout.cooldown, 0);
  game.player.damage(20);
  assert.equal(game.player.health, 40);
});

test('recon can scan an empty area and respects deployment boundaries', () => {
  const {game, loadout} = start('recon');
  assert.equal(loadout.select('medic'), false);
  assert.equal(loadout.activate(), true);
  assert.equal(loadout.cooldown, 22);
  assert.equal(loadout.activate(), false);
  loadout.update(22);
  game.player.alive = false;
  assert.equal(loadout.activate(), false);
  game.game.state = 'title';
  assert.equal(loadout.select('constructor'), false);
  assert.equal(loadout.select('medic'), true);
  assert.equal(loadout.role, 'recon');
  loadout.reset();
  assert.equal(loadout.role, 'medic');
});

test('campaign gameplay keeps original damage and receives no abilities', () => {
  const {game, loadout} = start('engineer');
  game.game.conquest = null;
  assert.equal(loadout.activate(), false);
  game.player.damage(20);
  assert.equal(game.player.health, 80);
});
