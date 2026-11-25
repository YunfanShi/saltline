const test = require('node:test');
const assert = require('node:assert/strict');
const { createPortMultiplayerSync } = require('../port-mp-sync.js');

test('stale sockets and reconnect timers cannot affect a replacement LAN session', async t => {
  const originals = { window: global.window, document: global.document, location: global.location, WebSocket: global.WebSocket, setTimeout: global.setTimeout };
  t.after(() => Object.assign(global, originals));
  const timers = [];
  const sockets = [];
  global.window = { addEventListener() {} };
  global.location = { origin: 'http://localhost' };
  global.document = { createElement: () => ({ style: {}, dataset: {}, remove() {} }), getElementById: () => ({ append() {} }) };
  global.setTimeout = fn => { timers.push(fn); };
  global.WebSocket = class {
    constructor(url) { this.url = url; sockets.push(this); }
    close() {}
  };
  class Group { add() {} removeFromParent() {} }
  class Material { constructor() {} }
  class Vector3 { constructor() {} }
  const world = { THREE: { Group, Mesh: class {}, BoxGeometry: class {}, CylinderGeometry: class {}, MeshBasicMaterial: Material, MeshStandardMaterial: Material, Vector3 }, scene: { add() {} } };
  const sync = createPortMultiplayerSync(world);
  sync.connect({ code: 'AAAAAA', token: 'first' });
  sockets[0].onclose();
  assert.equal(timers.length, 1);
  sync.connect({ code: 'BBBBBB', token: 'second' });
  sockets[0].onopen();
  sockets[0].onmessage({ data: JSON.stringify({ type: 'welcome', room: { yourId: 'old' } }) });
  assert.equal(sync.connected, false);
  assert.equal(sync.session.yourId, undefined);
  timers.shift()();
  await Promise.resolve();
  assert.equal(sockets.length, 2);
  sockets[1].onopen();
  assert.equal(sync.connected, true);
  sync.dispose();
});

test('host publishes a winner immediately and promoted guest applies the last shared state', t => {
  const originals = { window: global.window, document: global.document, location: global.location, WebSocket: global.WebSocket, performance: global.performance };
  t.after(() => Object.assign(global, originals));
  let now = 200;
  global.performance = { now: () => now };
  global.window = { addEventListener() {} };
  global.location = { origin: 'http://localhost' };
  global.document = { createElement: () => ({ style: {}, dataset: {}, remove() {} }), getElementById: () => ({ append() {} }) };
  const sockets = [];
  global.WebSocket = class {
    static OPEN = 1;
    constructor() { this.readyState = 1; this.sent = []; sockets.push(this); }
    send(message) { this.sent.push(JSON.parse(message)); }
    close() {}
  };
  class Group { add() {} removeFromParent() {} }
  const world = { THREE: { Group, Mesh: class {}, BoxGeometry: class {}, CylinderGeometry: class {}, MeshBasicMaterial: class {}, MeshStandardMaterial: class {}, Vector3: class {} }, scene: { add() {} } };
  let applied;
  const conquest = { winner: null, exportSharedState() { return { winner: this.winner }; }, applySharedState(state) { applied = state; } };
  const sync = createPortMultiplayerSync(world, { getConquest: () => conquest });
  sync.connect({ code: 'AAAAAA', token: 'first', yourId: 'me', hostId: 'me' });
  const socket = sockets[0];
  socket.onopen();
  const player = { alive: true, pos: { x: 0, y: 0, z: 0 } };
  sync.update(0, player);
  now = 210;
  conquest.winner = 'blue';
  sync.update(0, player);
  const snapshots = socket.sent.filter(message => message.type === 'conquest');
  assert.deepEqual(snapshots.map(message => message.conquest.winner), [null, 'blue']);
  sync.connect({ code: 'BBBBBB', token: 'second', yourId: 'me', hostId: 'old' });
  sockets[1].onmessage({ data: JSON.stringify({ type: 'snapshot', hostId: 'me', players: [], conquest: { elapsed: 30 } }) });
  assert.deepEqual(applied, { elapsed: 30 });
  sync.dispose();
});
