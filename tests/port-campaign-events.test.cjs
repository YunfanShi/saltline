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
  let impacts = 0;
  const crash = createCampaignCrash({
    THREE, scene, mats: { get: () => new THREE.MeshStandardMaterial() },
    fx: { explosion() { impacts++; } },
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
  assert.equal(impacts, 1);
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
  crash.update(45);
  assert.equal(impacts, 1);
  assert.equal(crash.active, false);
  assert.equal(scene.children.length, 0);
  assert.equal(crash.launch(), true);
  crash.reset();
  assert.equal(crash.active, false);
  assert.equal(scene.children.length, 0);
});
