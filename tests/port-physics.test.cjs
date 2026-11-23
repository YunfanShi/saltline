const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { performance } = require('node:perf_hooks');
const test = require('node:test');
const vm = require('node:vm');

const html = readFileSync(require.resolve('../index.html'), 'utf8');
const engineStart = html.indexOf('var _M=Object.defineProperty');
const worldStart = html.indexOf('var oi=', engineStart);
const worldEnd = html.indexOf(',Mn=', worldStart);
const physicsStart = html.indexOf('var u1=', worldEnd);
const physicsEnd = html.indexOf('var $g=', physicsStart);
assert.ok(engineStart >= 0 && worldStart > engineStart && worldEnd > worldStart &&
  physicsStart > worldEnd && physicsEnd > physicsStart, 'Find the bundled physics and its dependencies');

const scope = vm.createContext({ window: {}, console, performance, AbortController });
vm.runInContext(html.slice(engineStart, worldEnd) + ';\n' + html.slice(physicsStart, physicsEnd) +
  '\nwindow.physics = { Vector3: W, create: d3 };', scope);
const { Vector3, create } = scope.window.physics;
const vector = (x, y, z) => new Vector3(x, y, z);

test('a capsule contacts a wall across a spatial column boundary', () => {
  const physics = create({});
  const boundary = physics.bounds.min.x + 8;
  const wall = boundary + .1;
  physics.addBox([wall, 0, -1], [wall + .25, 2.4, 1]);
  physics.build();

  const position = vector(boundary - 1, 0, 0);
  const result = physics.moveCapsule(position, vector(4, 0, 0), .5);
  assert.equal(result.hitWall, true);
  assert.ok(Math.abs(position.x - (wall - .32)) < 1e-8);
});

test('capsule movement finds a floor in the column it moves into', () => {
  const physics = create({});
  const boundary = physics.bounds.min.x + 8;
  physics.addBox([boundary + .8, 0, -1], [boundary + 2, .3, 1], { surface: 'metal' });
  physics.build();

  const position = vector(boundary - .6, 0, 0);
  const result = physics.moveCapsule(position, vector(4, 0, 0), .5);
  assert.equal(result.onGround, true);
  assert.equal(result.surface, 'metal');
  assert.equal(position.y, .3);
  assert.equal(physics.groundHeight(position.x, position.z), .3);
});

test('a rail gate added after build blocks movement and navigation until removed', () => {
  const physics = create({});
  physics.build();
  const crossGate = () => {
    const position = vector(25, 0, 22);
    const result = physics.moveCapsule(position, vector(0, 0, 5), .5);
    return { position, result };
  };

  assert.equal(crossGate().result.hitWall, false);
  assert.equal(physics.nav.isWalkable(25, 23.05), true);

  const gate = physics.addBox([23.15, 0, 22.98], [26.85, 4, 23.12]);
  const closed = crossGate();
  assert.equal(closed.result.hitWall, true);
  assert.ok(closed.position.z < 22.98);
  assert.equal(physics.nav.isWalkable(25, 23.05), false);

  physics.removeBox(gate);
  const opened = crossGate();
  assert.equal(opened.result.hitWall, false);
  assert.ok(opened.position.z > 24);
  assert.equal(physics.nav.isWalkable(25, 23.05), true);
});
