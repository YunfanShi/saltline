const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const source = readFileSync(require.resolve('../port-commander.js'), 'utf8');
const voice = (lang, name, localService = true) => ({ lang, name, localService });

function mock(voices = [], supported = true) {
  const spoken = [];
  const timers = new Map();
  let cancels = 0;
  const speechSynthesis = {
    getVoices: () => voices,
    speak: utterance => spoken.push(utterance),
    cancel: () => cancels++,
  };
  class Utterance {
    constructor(text) { this.text = text; }
  }
  const window = supported ? { speechSynthesis, SpeechSynthesisUtterance: Utterance } : {};
  vm.runInNewContext(source, {
    window,
    setTimeout(fn) { const timer = Symbol(); timers.set(timer, fn); return timer; },
    clearTimeout(timer) { timers.delete(timer); },
  });
  return {
    commander: window.createPortCommander(),
    spoken,
    cancels: () => cancels,
    expire() {
      const [timer, fn] = timers.entries().next().value;
      timers.delete(timer);
      fn();
    },
  };
}

function record(events) {
  return {
    onStart(line, source) { events.push(['start', line.chinese, source]); },
    onEnd(line, reason) { events.push(['end', line.chinese, reason]); },
  };
}

test('prefers Edge Natural English and pairs a Chinese caption with actual utterance lifetime', () => {
  const preferred = voice('en-US', 'Microsoft Andrew Online (Natural)', false);
  const { commander, spoken } = mock([
    voice('zh-CN', 'Microsoft Xiaoxiao Online (Natural)', false),
    voice('en-US', 'English Premium'),
    voice('en-US', 'System default'),
    preferred,
  ]);
  const events = [];
  const callbacks = record(events);
  commander.speak({ english: 'Hold position.', chinese: '原地待命。' }, callbacks);
  commander.speak({ english: 'Engine hit.', chinese: '引擎中弹。' }, callbacks);
  commander.setVolume(.4);
  assert.equal(spoken.length, 1);
  assert.equal(spoken[0].text, 'Hold position.');
  assert.equal(spoken[0].voice, preferred);
  assert.deepEqual(events, []);

  spoken[0].onstart();
  assert.deepEqual(events, [['start', '原地待命。', 'speech']]);
  spoken[0].onend();
  assert.equal(spoken.length, 2);
  assert.equal(spoken[1].volume, .4);
  spoken[1].onstart();
  spoken[1].onend();
  assert.deepEqual(events, [
    ['start', '原地待命。', 'speech'],
    ['end', '原地待命。', 'speech'],
    ['start', '引擎中弹。', 'speech'],
    ['end', '引擎中弹。', 'speech'],
  ]);
});

test('online synthesis failure tries local enhanced English without starting an early caption', () => {
  const offline = voice('en-GB', 'English Enhanced');
  const { commander, spoken } = mock([voice('en-US', 'Microsoft Andrew Online (Natural)', false), offline]);
  const events = [];
  commander.speak({ english: 'Fall back.', chinese: '撤退。' }, record(events));
  spoken[0].onerror({ error: 'network' });
  assert.deepEqual(events, []);
  assert.equal(spoken[1].voice, offline);
  spoken[0].onstart();
  spoken[1].onstart();
  spoken[1].onerror({ error: 'audio-hardware' });
  assert.deepEqual(events, [['start', '撤退。', 'speech'], ['end', '撤退。', 'error']]);
});

test('cancellation hides the caption and stale speech callbacks cannot affect the new line', () => {
  const { commander, spoken, cancels } = mock([voice('en-US', 'US voice')]);
  const events = [];
  const callbacks = record(events);
  commander.speak({ english: 'Before reset', chinese: '重置前' }, callbacks);
  spoken[0].onstart();
  commander.speak('Queued before reset');
  commander.stop();
  commander.speak({ english: 'After reset', chinese: '重置后' }, callbacks);
  spoken[0].onend();
  spoken[1].onstart();
  spoken[1].onend();
  assert.equal(cancels(), 1);
  assert.deepEqual(spoken.map(item => item.text), ['Before reset', 'After reset']);
  assert.deepEqual(events, [
    ['start', '重置前', 'speech'], ['end', '重置前', 'cancel'],
    ['start', '重置后', 'speech'], ['end', '重置后', 'speech'],
  ]);
});

test('missing synthesis and stalled startup both deliver a bounded caption-only fallback', () => {
  for (const supported of [false, true]) {
    const { commander, spoken, expire } = mock([voice('en-US', 'US voice')], supported);
    const events = [];
    commander.speak({ english: 'Clear the runway.', chinese: '离开跑道。' }, record(events));
    if (supported) {
      assert.deepEqual(events, []);
      expire();
      spoken[0].onstart();
    }
    assert.deepEqual(events, [['start', '离开跑道。', 'fallback']]);
    expire();
    assert.deepEqual(events, [['start', '离开跑道。', 'fallback'], ['end', '离开跑道。', 'fallback']]);
  }
});

test('a browser gesture rejection permits a later speech attempt', () => {
  const { commander, spoken } = mock([voice('en-US', 'US voice')]);
  commander.speak('Requires a gesture');
  spoken[0].onerror({ error: 'not-allowed' });
  commander.speak('Gesture now granted');
  assert.equal(spoken[1].text, 'Gesture now granted');
});

test('a scene change drops a queued stale line without interrupting speech in progress', () => {
  const { commander, spoken } = mock([voice('en-US', 'US voice')]);
  let shot = 'first';
  const events = [];
  const callbacks = record(events);
  commander.speak({ english: 'Transport inbound.', chinese: '运输机进场。' }, callbacks);
  spoken[0].onstart();
  shot = 'missile';
  commander.speak('Missile!', { shouldStart: () => shot === 'missile' });
  shot = 'hit';
  commander.speak({ english: 'Engine hit.', chinese: '引擎中弹。' }, callbacks);
  assert.deepEqual(events, [['start', '运输机进场。', 'speech']]);
  spoken[0].onend();
  assert.deepEqual(spoken.map(item => item.text), ['Transport inbound.', 'Engine hit.']);
});
