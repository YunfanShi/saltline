const assert = require('node:assert/strict');
const test = require('node:test');
const {createSidearmAction, createCampaignWeapons} = require('../port-sidearm.js');

test('sidearm fires once per press and observes its own cooldown', () => {
  const sidearm = createSidearmAction(() => {});
  assert.equal(sidearm.update(.016, {trigger:true}), true);
  assert.equal(sidearm.update(.22, {trigger:true}), false);
  assert.equal(sidearm.ammo, 11);
  sidearm.update(.016);
  assert.equal(sidearm.update(.016, {tapped:true}), true);
  assert.equal(sidearm.update(.016, {tapped:true}), false);
  assert.equal(sidearm.update(.18, {trigger:true, infinite:true}), true);
  assert.equal(sidearm.ammo, 10);
});

test('sidearm empty reload uses its own reserve and releases the slide after insertion', () => {
  const events = [];
  const sidearm = createSidearmAction((name, data) => events.push([name,data.phase]));
  assert.equal(sidearm.reloadNow(), false);
  for (let round = 0; round < 12; round++) assert.equal(sidearm.update(.2, {tapped:true}), true);
  assert.equal(sidearm.ammo, 0);
  assert.equal(sidearm.slideLocked, true);
  assert.equal(sidearm.update(.2, {trigger:true}), false);
  assert.equal(sidearm.update(.2, {trigger:true}), false);
  assert.deepEqual(events, [['weapon:dry',undefined]]);
  assert.equal(sidearm.reloadNow(), true);
  assert.equal(sidearm.reloadNow(), false);
  assert.equal(sidearm.update(.4), false);
  assert.equal(sidearm.ammo, 0);
  assert.equal(sidearm.update(.7), false);
  assert.equal(sidearm.ammo, 12);
  assert.equal(sidearm.reserve, 24);
  assert.equal(sidearm.slideLocked, true);
  assert.equal(sidearm.update(.6, {trigger:true}), false);
  assert.equal(sidearm.slideLocked, false);
  assert.equal(sidearm.update(.2, {trigger:true}), false);
  assert.deepEqual(events.slice(1).map(([,phase]) => phase), ['start','magout','magin','bolt','done']);
});

test('tactical reload tops up only the rounds spent', () => {
  const phases = [];
  const sidearm = createSidearmAction((name, event) => phases.push(event.phase));
  sidearm.update(.2, {tapped:true});
  sidearm.update(.2, {tapped:true});
  sidearm.reloadNow();
  sidearm.update(1.4);
  assert.equal(sidearm.ammo, 12);
  assert.equal(sidearm.reserve, 34);
  assert.deepEqual(phases, ['start','magout','magin','done']);
});

function mockWeapon(name, magSize, reserve) {
  return {
    name, magSize, debug:{noFire:false}, ammo:magSize, reserve, visible:true,
    frames:[],
    reset() { this.ammo = magSize; this.reserve = reserve; },
    setVisible(visible) { this.visible = visible; },
    addAmmo(rounds) { this.reserve += rounds; },
    setWetness(wetness) { this.wetness = wetness; },
    update(time, blocked) { this.frames.push([time, !!blocked || this.debug.noFire]); }
  };
}

test('campaign switches independent inventories and rifle mode stays native', () => {
  let pressing = '';
  let made = 0;
  const events = new Map();
  const game = {
    player:{enabled:true, alive:true},
    game:{state:'playing',campaign:null,conquest:{}},
    input:{fire:false, pressed:action => action === pressing, setCampaignWeapons(enabled) { this.campaignWeapons = enabled; }},
    events:{on(name, listener) { events.set(name, listener); }, emit(name, data) { events.get(name)?.(data); }}
  };
  const rifle = mockWeapon('PAC-9 Longshore',30,150);
  const pistol = mockWeapon('Tern S12',12,36);
  const weapons = createCampaignWeapons(game,rifle,() => { made++; return pistol; });
  pressing = 'sidearm';
  weapons.update(.01);
  assert.equal(made,0);
  assert.equal(weapons.slot,'rifle');
  assert.deepEqual(rifle.frames, [[.01,false]]);
  rifle.ammo = 14;
  game.game.campaign = {};
  game.game.conquest = null;
  game.events.emit('game:state');
  assert.equal(game.input.campaignWeapons,true);
  game.input.fire = true;
  weapons.update(.02);
  assert.equal(made,1);
  assert.equal(weapons.slot,'sidearm');
  assert.equal(weapons.magSize,12);
  assert.equal(rifle.visible,false);
  assert.equal(pistol.visible,true);
  assert.deepEqual(pistol.frames,[[.02,true]]);
  weapons.addAmmo(3);
  assert.equal(pistol.reserve,39);
  assert.equal(rifle.reserve,150);
  pressing = '';
  game.input.fire = false;
  weapons.update(.03);
  assert.deepEqual(pistol.frames.at(-1), [.03,false]);
  pistol.ammo = 5;
  pressing = 'swapWeapon';
  weapons.update(.04);
  assert.equal(weapons.ammo,14);
  game.input.fire = true;
  weapons.update(.05);
  assert.equal(weapons.ammo,5);
  assert.equal(weapons.reserve,39);
  assert.equal(made,1);
  weapons.refill();
  assert.equal(weapons.slot,'sidearm');
  assert.equal(weapons.ammo,12);
  assert.equal(rifle.ammo,14);
  game.game.state = 'paused';
  assert.equal(weapons.select('rifle'),false);
  game.game.campaign = null;
  game.game.conquest = {};
  weapons.reset();
  assert.equal(weapons.ammo,30);
  assert.equal(weapons.reserve,150);
  assert.equal(pistol.visible,false);
  assert.equal(game.input.campaignWeapons,false);
});
