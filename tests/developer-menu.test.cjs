const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = readFileSync(path.join(__dirname, '../developer-menu.js'), 'utf8');

function setup() {
  function element() {
    return {
      open: false,
      append() {},
      setAttribute() {},
      querySelector: element,
      addEventListener() {},
      showModal() { this.open = true; },
      close() { this.open = false; },
    };
  }
  const calls = [];
  let capture;
  let playing = true;
  const window = {
    addEventListener(type, listener, useCapture) {
      assert.equal(type, 'keydown');
      assert.equal(useCapture, true);
      capture = listener;
    },
  };
  const document = { createElement: element, getElementById: element, addEventListener() {} };
  vm.runInNewContext(source, { window, document });
  const menu = window.createDeveloperMenu({
    world: {
      player: { pos: { x: 0, y: 0, z: 0 }, health: 100 },
      weapon: { ammo: 30, reserve: 120 },
      enemies: { aliveCount: () => 3 },
      input: { locked: true },
    },
    canOpen: () => playing,
    isCampaign: () => true,
    onOpen: () => calls.push('pause'),
    onClose: recapture => calls.push(['resume', recapture]),
  });
  function press(code, options = {}) {
    const result = { prevented: false, stopped: false };
    capture({
      code, ...options,
      preventDefault() { result.prevented = true; },
      stopImmediatePropagation() { result.stopped = true; },
    });
    return result;
  }
  return { menu, calls, press, stopPlaying: () => { playing = false; } };
}

test('Escape closes the developer menu and does not reach the game pause handler', () => {
  const { menu, calls, press } = setup();
  assert.deepEqual(press('Backquote'), { prevented: true, stopped: true });
  assert.equal(menu.open, true);
  assert.deepEqual(press('KeyM'), { prevented: false, stopped: true });
  assert.deepEqual(press('Escape'), { prevented: true, stopped: true });
  assert.equal(menu.open, false);
  assert.deepEqual(calls, ['pause', ['resume', true]]);
  assert.deepEqual(press('Escape'), { prevented: false, stopped: false });
});

test('the shortcut ignores repeats and does not open outside an active match', () => {
  const { menu, calls, press, stopPlaying } = setup();
  press('Backquote');
  press('Backquote', { repeat: true });
  assert.equal(menu.open, true);
  press('Backquote');
  assert.equal(menu.open, false);
  stopPlaying();
  assert.deepEqual(press('Backquote'), { prevented: false, stopped: false });
  assert.deepEqual(calls, ['pause', ['resume', true]]);
});
