const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { performance } = require('node:perf_hooks');
const test = require('node:test');
const vm = require('node:vm');

const html = readFileSync(require.resolve('../index.html'), 'utf8');
const engine = html.slice(html.indexOf('var _M=Object.defineProperty'), html.indexOf('var oi='));
const scope = vm.createContext({ window: {}, console, performance, AbortController });
vm.runInContext(engine + '\nwindow.THREE=lt;', scope);
vm.runInContext(readFileSync(require.resolve('../port-campaign-events.js'), 'utf8'), scope);
const { THREE, createCampaignCrash } = scope.window;

test('the transport levels continuously into touchdown and emits one final impact', () => {
  const scene = new THREE.Scene();
  const impacts = [];
  const crash = createCampaignCrash({
    THREE, scene, mats: { get: () => new THREE.MeshStandardMaterial() },
    fx: { explosion(pos, size) { impacts.push({ y: pos.y, size }); } },
  });
  assert.equal(crash.launch(), true);
  assert.equal(crash.launch(), false);
  const transport = scene.getObjectByName('rail-campaign-aircraft');
  const previous = new THREE.Quaternion();
  for (let tick = 0; tick < 420; tick++) {
    previous.copy(transport.quaternion);
    crash.update(.02);
    if (tick >= 316 && tick <= 322) assert.ok(previous.angleTo(transport.quaternion) < .035);
  }
  assert.equal(impacts.length, 2);
  assert.ok(impacts[0].y > 10 && impacts[0].size < impacts[1].size);
  assert.ok(impacts[1].y < 1);
  assert.ok(transport.position.distanceTo(crash.impact) < .001);
  assert.equal(crash.active, true);
});

test('skipping a frame past the wreck lifetime still delivers the impact and allows replay', () => {
  const scene = new THREE.Scene();
  let impacts = 0;
  const crash = createCampaignCrash({
    THREE, scene, mats: { get: () => new THREE.MeshStandardMaterial() },
    fx: { explosion() { impacts++; } },
  });
  crash.launch();
  crash.update(120);
  assert.equal(impacts, 2);
  assert.equal(crash.active, false);
  assert.equal(scene.children.length, 0);
  assert.equal(crash.launch(), true);
  crash.reset();
  assert.equal(crash.active, false);
  assert.equal(scene.children.length, 0);
});

test('the flight banks across the turn, levels and deploys its wheels by touchdown', () => {
  const scene = new THREE.Scene();
  const crash = createCampaignCrash({ THREE, scene });
  crash.launch();
  const transport = scene.getObjectByName('rail-campaign-aircraft');
  const parts = name => {
    const matching = [];
    transport.traverse(piece => {
      if (piece.name === name) matching.push(piece);
    });
    return matching;
  };
  const gear = () => parts('aircraft-landing-gear');
  const props = () => parts('aircraft-propeller-disc');
  assert.equal(crash.phase, 'approach');
  assert.equal(gear().length, 3);
  assert.equal(props().length, 2);
  assert.ok(gear().every(piece => piece.rotation.x < -1.5));
  assert.ok(props().every(piece => piece.visible));

  crash.update(3.9);
  const bank = new THREE.Vector3(1, 0, 0).applyQuaternion(transport.quaternion).y;
  assert.ok(Math.abs(bank) > .4);
  crash.update(.19);
  const beforeTurn = transport.quaternion.clone();
  crash.update(.02);
  assert.equal(crash.phase, 'descent');
  assert.ok(beforeTurn.angleTo(transport.quaternion) < .035);
  crash.update(2.3);
  assert.equal(crash.phase, 'slide');
  assert.ok(gear().every(piece => Math.abs(piece.rotation.x) < .05));
  assert.equal(props().filter(piece => piece.visible).length, 1);
});

test('normal play and silent checkpoint restore settle into the same lasting wreck', () => {
  const scene = new THREE.Scene();
  const impacts = [];
  const emitters = [];
  const crash = createCampaignCrash({
    THREE, scene,
    fx: {
      explosion(pos, size) { impacts.push({ pos, size }); },
      addEmitter(pos, kind, options) {
        const handle = { pos: pos.clone(), kind, options, stop() { this.stopped = true; } };
        emitters.push(handle);
        return handle;
      },
    },
  });
  const getWreck = () => {
    const transport = scene.getObjectByName('rail-campaign-aircraft');
    transport.updateMatrixWorld(true);
    return transport.children.filter(piece => piece.visible).map(piece => piece.matrixWorld.toArray());
  };

  crash.launch();
  crash.update(crash.duration);
  const playedWreck = getWreck();
  assert.equal(crash.phase, 'wreck');
  assert.equal(impacts.length, 2);
  assert.ok(impacts[1].size >= 3);
  assert.equal(emitters.length, 5);
  assert.equal(crash.skip(), false);
  crash.update(70);
  assert.equal(crash.phase, 'wreck');
  crash.reset();
  assert.ok(emitters.every(handle => handle.stopped));
  assert.equal(crash.phase, 'idle');

  crash.launch();
  assert.equal(crash.skip({ silent: true }), true);
  assert.equal(crash.phase, 'wreck');
  assert.equal(crash.elapsed, crash.duration);
  assert.equal(impacts.length, 2);
  assert.deepEqual(getWreck(), playedWreck);
  assert.equal(emitters.length, 10);
});

test('a large update expires old fire instead of starting it at full duration', () => {
  const scene = new THREE.Scene();
  const events = [];
  const emitters = [];
  const crash = createCampaignCrash({
    THREE, scene,
    events: { emit(name) { events.push(name); } },
    fx: { addEmitter(pos, kind, options) { emitters.push({ kind, ...options }); } },
  });
  crash.launch();
  crash.update(crash.duration + 74);
  assert.deepEqual(events, ['explosion', 'explosion']);
  assert.deepEqual(emitters, [{ kind: 'smolder', ttl: 11, scale: 2.35 }]);
  assert.equal(crash.phase, 'wreck');
});

test('a visible incoming missile swaps the intact model only when it hits', () => {
  const scene = new THREE.Scene();
  const bursts = [];
  const crash = createCampaignCrash({ THREE, scene, fx: {
    explosion(pos, size) { bursts.push({ pos: pos.clone(), size }); },
  } });
  crash.launch();
  const transport = scene.getObjectByName('rail-campaign-aircraft');
  assert.equal(transport.children[0].name, 'aircraft-model-intact');
  crash.update(.6);
  assert.equal(crash.missileVisible, true);
  assert.equal(crash.modelState, 'intact');
  assert.equal(bursts.length, 0);

  crash.update(.6);
  assert.equal(crash.missileVisible, false);
  assert.equal(transport.children[0].name, 'aircraft-model-damaged');
  assert.equal(bursts.length, 1);
  assert.ok(bursts[0].pos.y > 10);
  crash.update(5.6);
  assert.equal(crash.modelState, 'damaged');
  assert.equal(crash.phase, 'slide');
  assert.equal(bursts.length, 1);

  crash.update(1.45);
  assert.equal(transport.children[0].name, 'aircraft-model-wreck');
  assert.ok(bursts[1].size > bursts[0].size);
});
