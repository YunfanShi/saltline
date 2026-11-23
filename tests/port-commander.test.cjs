const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const source = readFileSync(require.resolve('../port-commander.js'), 'utf8');
const localVoice = (lang, name, isDefault = false) => ({ lang, name, localService: true, default: isDefault });

function mock(voices = []) {
  const spoken = [];
  let cancels = 0;
  const speechSynthesis = {
    getVoices: () => voices,
    speak: utterance => spoken.push(utterance),
    cancel: () => cancels++,
  };
  class Utterance {
    constructor(text) { this.text = text; }
  }
  const window = { speechSynthesis, SpeechSynthesisUtterance: Utterance };
  vm.runInNewContext(source, { window });
  return { commander: window.createPortCommander(), spoken, cancels: () => cancels };
}

test('commander speech keeps one local English voice and reads lines in order', () => {
  const preferred = localVoice('en-US', 'US voice');
  const { commander, spoken } = mock([
    localVoice('zh-CN', 'Chinese default', true),
    localVoice('en-GB', 'English default', true),
    preferred,
    { ...localVoice('en-US', 'Remote default', true), localService: false },
  ]);
  commander.speak(' First line ');
  commander.speak('Second line');
  commander.setVolume(.4);
  assert.deepEqual(spoken.map(item => item.text), ['First line']);
  assert.equal(spoken[0].voice, preferred);
  assert.equal(spoken[0].lang, 'en-US');
  spoken[0].onend();
  assert.deepEqual(spoken.map(item => item.text), ['First line', 'Second line']);
  assert.equal(spoken[1].voice, preferred);
  assert.equal(spoken[1].volume, .4);
});

test('commander cancellation prevents stale callbacks and mute clears remaining lines', () => {
  const { commander, spoken, cancels } = mock([localVoice('en-US', 'US voice')]);
  commander.speak('Before reset');
  commander.speak('Queued before reset');
  commander.stop();
  commander.speak('After reset');
  spoken[0].onerror();
  commander.speak('Queued after reset');
  assert.deepEqual(spoken.map(item => item.text), ['Before reset', 'After reset']);
  commander.setVolume(0);
  commander.speak('Muted');
  spoken[1].onend();
  assert.equal(cancels(), 2);
  assert.equal(spoken.length, 2);
});

test('unsupported or missing local English speech falls back silently and can pick up a late voice', () => {
  const window = {};
  vm.runInNewContext(source, { window });
  assert.doesNotThrow(() => {
    const commander = window.createPortCommander();
    commander.speak('Subtitle only');
    commander.stop();
  });

  const voices = [{ ...localVoice('en-US', 'Remote voice'), localService: false }];
  const { commander, spoken } = mock(voices);
  commander.speak('Subtitle only');
  assert.equal(spoken.length, 0);
  const lateVoice = localVoice('en-GB', 'Available English voice');
  voices.push(lateVoice);
  commander.speak('Now audible');
  assert.deepEqual(spoken.map(item => item.text), ['Now audible']);
  assert.equal(spoken[0].voice, lateVoice);
});
