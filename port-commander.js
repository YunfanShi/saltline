(() => {
  const locale = voice => voice.lang.toLowerCase().replaceAll('_', '-');
  const voiceKey = voice => voice.voiceURI || voice.name;
  const isMicrosoftNatural = voice => /microsoft.*online.*natural/i.test(voice.name);

  function quality(voice) {
    const natural = /natural|neural|premium|enhanced/i.test(voice.name);
    const englishUS = locale(voice) === 'en-us';
    return (isMicrosoftNatural(voice) ? 100 : natural ? 40 : 0) +
      (englishUS ? 10 : 0) + (voice.localService ? 4 : 0) + (voice.default ? 1 : 0);
  }

  window.createPortCommander = () => {
    const synth = window.speechSynthesis;
    const Utterance = window.SpeechSynthesisUtterance;
    const queue = [];
    const unavailable = new Set();
    let active;
    let volume = 1;
    if (synth && Utterance) synth.getVoices();

    function selectVoice(localOnly) {
      return synth.getVoices()
        .filter(voice => (!localOnly || voice.localService) &&
          /^en(?:-|$)/.test(locale(voice)) && !unavailable.has(voiceKey(voice)))
        .sort((left, right) => quality(right) - quality(left))[0];
    }

    function finish(item, reason) {
      if (active !== item) return;
      clearTimeout(item.timer);
      active = undefined;
      if (item.started) item.onEnd?.(item.line, reason);
      next();
    }

    function showCaption(item, reason) {
      item.started = true;
      item.onStart?.(item.line, reason);
    }

    function captionOnly(item) {
      item.utterance = undefined;
      if (item.shouldStart?.() === false) return finish(item, 'stale');
      if (!item.onStart) return finish(item, 'unavailable');
      showCaption(item, 'fallback');
      if (active !== item) return;
      const duration = Math.min(4500, Math.max(1500, item.line.english.length * 53));
      item.timer = setTimeout(() => finish(item, 'fallback'), duration);
    }

    function play(item, localOnly = false) {
      if (item.shouldStart?.() === false) return finish(item, 'stale');
      const voice = volume && synth && Utterance ? selectVoice(localOnly) : undefined;
      if (!voice) return captionOnly(item);
      const utterance = new Utterance(item.line.english);
      item.utterance = utterance;
      utterance.lang = voice.lang;
      utterance.voice = voice;
      utterance.volume = volume;
      const current = () => active === item && item.utterance === utterance;
      const failure = ({ error } = {}) => {
        if (!current()) return;
        clearTimeout(item.timer);
        item.utterance = undefined;
        if (item.started) return finish(item, 'error');
        if (error === 'not-allowed' || error === 'canceled' || error === 'interrupted') return captionOnly(item);
        unavailable.add(voiceKey(voice));
        if (localOnly || voice.localService) return captionOnly(item);
        play(item, true);
      };
      utterance.onstart = () => {
        if (!current() || item.started) return;
        clearTimeout(item.timer);
        if (item.shouldStart?.() === false) {
          item.utterance = undefined;
          synth.cancel();
          return finish(item, 'stale');
        }
        showCaption(item, 'speech');
        if (!current()) return;
        item.timer = setTimeout(() => {
          if (!current()) return;
          item.utterance = undefined;
          synth.cancel();
          finish(item, 'timeout');
        }, 15000);
      };
      utterance.onend = () => { if (current()) item.started ? finish(item, 'speech') : failure(); };
      utterance.onerror = failure;
      item.timer = setTimeout(() => {
        if (!current()) return;
        item.utterance = undefined;
        synth.cancel();
        unavailable.add(voiceKey(voice));
        if (localOnly || voice.localService) captionOnly(item);
        else play(item, true);
      }, 1600);
      try { synth.speak(utterance); } catch { failure(); }
    }

    function next() {
      if (active || !queue.length) return;
      active = queue.shift();
      play(active);
    }

    function stop() {
      queue.length = 0;
      if (!active) return;
      const item = active;
      active = undefined;
      clearTimeout(item.timer);
      if (item.utterance) synth.cancel();
      if (item.started) item.onEnd?.(item.line, 'cancel');
    }

    return {
      speak(line, { onStart, onEnd, shouldStart } = {}) {
        if (typeof line === 'string') line = { english: line.trim() };
        if (!line?.english?.trim()) return;
        queue.push({ line, onStart, onEnd, shouldStart });
        next();
      },
      stop,
      setVolume(value) {
        if (!Number.isFinite(value)) return;
        const wasAudible = volume > 0;
        volume = Math.min(1, Math.max(0, value));
        if (!volume && wasAudible && active?.utterance) {
          const item = active;
          item.utterance = undefined;
          clearTimeout(item.timer);
          synth.cancel();
          if (active === item) {
            if (item.started) {
              item.timer = setTimeout(() => finish(item, 'fallback'), 1300);
            } else captionOnly(item);
          }
        }
      },
    };
  };
})();
