const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const html = readFileSync(require.resolve('../index.html'), 'utf8');
const element = () => ({ style: {}, querySelector: () => ({}), remove() {} });
const listeners = {};
const scope = vm.createContext({
  window: { addEventListener: (event, handler) => { listeners[event] = handler; } },
  document: { body: { append() {} }, querySelector: () => null, getElementById: () => true, createElement: element },
  performance, console, AbortController,
});
vm.runInContext(html.slice(html.indexOf('var _M=Object.defineProperty'), html.indexOf('var oi=')) + '\nwindow.THREE=lt;', scope);
for (const file of ['port-campaign-runtime', 'port-drivable-vehicle', 'port-campaign-events']) {
  vm.runInContext(readFileSync(require.resolve('../' + file + '.js'), 'utf8'), scope);
}
const { THREE, createSaltlineHuman, createPortDrivableVehicle, createParkedTransport } = scope.window;

test('both ascending torso and descending limb sections face outward', () => {
  const human = createSaltlineHuman(THREE, {role:'engineer'});
  for (const joint of [human.torso, human.limbs[0].elbow, human.limbs[1].hip]) {
    const loft = joint.children.find(node => node.geometry?.type === 'BufferGeometry');
    const { position, normal } = loft.geometry.attributes;
    let right = 0;
    for (let i = 1; i < position.count; i++) if (position.getX(i) > position.getX(right)) right = i;
    assert.ok(normal.getX(right) > .5, joint.name);
  }
});

test('roof whip is vertical, mounted on the cab, and blocked driver exit uses the passenger side', () => {
  const physics = { boxes: [], groundHeight: () => 0 };
  const player = { alive:true, pos:new THREE.Vector3(), vel:new THREE.Vector3() };
  const truck = createPortDrivableVehicle({ THREE, physics, player, scene:new THREE.Scene(), game:{state:'playing'} },
    { startPos:new THREE.Vector3() });
  const antenna = truck.mesh.getObjectByName('roof-whip');
  const bounds = new THREE.Box3().setFromObject(antenna);
  assert.ok(bounds.min.y > 1.8 && bounds.max.x < 1 && bounds.min.x > -1);
  assert.ok(bounds.max.z - bounds.min.z < .04 && bounds.max.y - bounds.min.y > 1);
  const use = () => listeners.keydown({code:'KeyF'});
  use();
  assert.ok(truck.driving);
  physics.boxes.push({ min:new THREE.Vector3(-4,0,-3), max:new THREE.Vector3(-1.4,3,3) });
  use();
  assert.ok(!truck.driving && player.pos.x > 1.4);
  truck.dispose();
});

test('vehicle deactivation and disposal release driving and input ownership', () => {
  const registered = new Map();
  scope.window.addEventListener = (type, handler) => registered.set(type, handler);
  scope.window.removeEventListener = (type, handler) => {
    if (registered.get(type) === handler) registered.delete(type);
  };
  const player = { alive:true, pos:new THREE.Vector3(), vel:new THREE.Vector3() };
  let visible = true;
  const world = { THREE, physics:{ boxes:[], groundHeight:() => 0 }, player,
    scene:new THREE.Scene(), game:{state:'playing'}, weapon:{setVisible: value => { visible = value; }} };
  const truck = createPortDrivableVehicle(world, { startPos:new THREE.Vector3() });
  registered.get('keydown')({code:'KeyF'});
  assert.equal(truck.driving, true);
  assert.equal(visible, false);
  truck.setActive(false);
  assert.equal(truck.driving, false);
  assert.equal(truck.mesh.visible, false);
  assert.equal(visible, true);
  registered.get('keydown')({code:'KeyF'});
  assert.equal(truck.driving, false);
  truck.setActive(true);
  registered.get('keydown')({code:'KeyF', saltlineVehicleHandled:true});
  assert.equal(truck.driving, false);
  truck.dispose();
  assert.equal(registered.size, 0);
});

test('parked aircraft has stationary blades and independently disposable finishes', () => {
  const plane = createParkedTransport(THREE);
  const discs = [], blades = [];
  plane.root.traverse(node => {
    if (node.name === 'aircraft-propeller-disc') discs.push(node);
    if (node.name === 'aircraft-propeller-blades') blades.push(node);
  });
  assert.equal(blades.length,2);
  assert.equal(discs.length,2);
  assert.ok(blades.every(node => node.visible));
  assert.ok(discs.every(node => !node.visible));
  plane.root.traverse(node => {
    if (node.name === 'aircraft-landing-gear') {
      assert.ok(Math.abs(new THREE.Box3().setFromObject(node,true).min.y + 1.55) < .0001);
    }
  });
  plane.dispose();
});
