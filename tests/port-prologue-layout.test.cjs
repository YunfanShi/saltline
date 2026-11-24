const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const html = readFileSync(require.resolve('../index.html'), 'utf8');
const engineStart = html.indexOf('var _M=Object.defineProperty');
const bootStart = html.indexOf('var gM=', engineStart);
assert.ok(engineStart >= 0 && bootStart > engineStart, 'Find the bundled level builder');
const scope = vm.createContext({ window: {}, performance, AbortController, console });
vm.runInContext(html.slice(engineStart, bootStart) + '\nwindow.engine = { d3, lt, ob };', scope);
vm.runInContext(readFileSync(require.resolve('../port-prologue-layout.js'), 'utf8'), scope);
const { createPortPrologueLayout, createPortTransportVisual, engine } = scope.window;
const { d3, lt: THREE, ob } = engine;
const vector = (x, y, z) => new THREE.Vector3(x, y, z);
const cache = new Map();
function material(key) {
  if (!cache.has(key)) cache.set(key, new THREE.MeshStandardMaterial());
  return cache.get(key);
}
const mats = { get: material, emissive: material, label: key => ({ aspect: 3, material: material(key) }) };

function buildHeadquarters() {
  const world = { mats };
  const physics = world.physics = d3(world);
  const builder = ob(world);
  const layout = createPortPrologueLayout(builder, vector);
  physics.build();
  return { physics, layout };
}

test('HQ doors connect the duty office, briefing, covered range, and boarding pad', () => {
  const { physics, layout } = buildHeadquarters();
  const { duty, briefing, range, ammo, trainingExit, boarding } = layout.points;
  assert.ok(layout.playerStart.pos.equals(duty));
  assert.equal(layout.enemySpawns.length, 0);
  for (const [start, end] of [[duty, briefing], [briefing, range], [range, ammo],
    [ammo, trainingExit], [trainingExit, boarding]]) {
    assert.ok(physics.nav.isWalkable(end.x, end.z), end.toArray().join(', '));
    assert.ok(physics.nav.findPath(start, end), `${start.toArray()} → ${end.toArray()}`);
  }
  const walk = (x, z, dx, dz) => {
    const pos = vector(x, 0, z);
    for (let step = 0; step < 80; step++) physics.moveCapsule(pos, vector(dx, -.1, dz), 1 / 30);
    return pos;
  };
  assert.ok(walk(-20.3, 1, 0, 2.4).z > 6.5, 'Both open doors fit the player capsule');
  assert.ok(walk(-24, 1, 0, 2.4).z < 2, 'The wall beside the doorway is solid');
  assert.ok(walk(-7.55, 3.55, 0, -2.4).z < -2, 'The range has its own door');
  assert.ok(walk(-2.25, 3.55, 0, -2.4).z > 2.2, 'The range wall separates the corridor');
  assert.ok(walk(9.4, 3.4, 2.4, 0).x > 15, 'The corridor opens onto the apron');
});

test('both practice targets can be hit from the marked line and reset their impact indication', () => {
  const { physics, layout } = buildHeadquarters();
  const eye = layout.points.range.clone().add(vector(0, 1.65, 0));
  assert.deepEqual(Array.from(layout.targets, target => target.id), ['close', 'middle']);
  for (const target of layout.targets) {
    const aim = target.center.clone().sub(eye).normalize();
    assert.equal(physics.raycast(eye, aim, 25)?.box.tag, target.id);
    const lastMesh = target.object.children.at(-1);
    const off = lastMesh.material;
    target.setHit(true);
    assert.notEqual(lastMesh.material, off);
    target.setHit(false);
    assert.equal(lastMesh.material, off);
  }
});

test('the rescue visual has an animated door, fixed cabin anchors, rotors and a retracting cable', () => {
  const parent = new THREE.Group();
  const aircraft = createPortTransportVisual({ THREE, mats }, parent);
  const { root, door, mainRotor, tailRotor, anchors } = aircraft;
  assert.equal(root.parent, parent);
  assert.ok(anchors.seat.x > 0 && anchors.door.x < 0 && anchors.cable.y > anchors.door.y);
  const closed = door.position.clone();
  aircraft.setDoor(1);
  assert.ok(door.position.z > closed.z + 1.8);
  aircraft.setDoor(0);
  assert.ok(door.position.equals(closed));
  aircraft.spin(.1);
  assert.ok(mainRotor.rotation.y > 0 && tailRotor.rotation.x > 0);
  const rope = root.getObjectByName('rescue-cinematic-cable');
  assert.equal(rope.visible, false);
  aircraft.setCable(4.5);
  assert.equal(rope.visible, true);
  assert.equal(rope.children.at(-1).position.y, -4.5);
  aircraft.setCable(0);
  assert.equal(rope.visible, false);

  function opaqueHits(eye, target) {
    root.updateMatrixWorld(true);
    const ray = new THREE.Raycaster(eye, target.clone().sub(eye).normalize());
    return ray.intersectObject(root, true).filter(({ object }) => !object.material.transparent);
  }
  assert.equal(opaqueHits(anchors.seat, vector(-2.2, 2.02, -6)).length, 0,
    'The forward cabin view clears the cockpit bulkhead and looks through glazing');
  assert.equal(opaqueHits(anchors.seat, vector(-3.2, 2.02, -6)).length, 0,
    'The departure glance clears the outer window framing');
  aircraft.setDoor(1);
  const openDoorView = anchors.seat.clone().lerp(anchors.door, .72);
  assert.equal(opaqueHits(openDoorView, vector(-36, -12, 13)).length, 0,
    'The camera sees through the open side doorway');
});
