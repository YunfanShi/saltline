(() => {
  window.createPortCommander = () => {
    const synth = window.speechSynthesis;
    const Utterance = window.SpeechSynthesisUtterance;
    const queue = [];
    let voice;
    let active;
    let volume = 1;

    function selectVoice() {
      const language = candidate => candidate.lang.toLowerCase().replaceAll('_', '-');
      const english = synth.getVoices().filter(candidate =>
        candidate.localService && /^en(?:-|$)/.test(language(candidate)));
      const american = english.filter(candidate => language(candidate) === 'en-us');
      return american.find(candidate => candidate.default) ?? american[0] ??
        english.find(candidate => candidate.default) ?? english[0];
    }

    // Browsers may populate the local voice list after the game has started.
    if (synth && Utterance) voice = selectVoice();

    function next() {
      if (active || !queue.length) return;
      const utterance = new Utterance(queue.shift());
      utterance.lang = voice.lang;
      utterance.voice = voice;
      utterance.volume = volume;
      active = utterance;
      const finish = () => {
        if (active !== utterance) return;
        active = undefined;
        next();
      };
      utterance.onend = finish;
      utterance.onerror = finish;
      try {
        synth.speak(utterance);
      } catch {
        finish();
      }
    }

    function stop() {
      queue.length = 0;
      if (!active) return;
      active = undefined;
      synth.cancel();
    }

    return {
      speak(english) {
        const line = typeof english === 'string' ? english.trim() : '';
        if (!line || !volume || !synth || !Utterance) return;
        voice ??= selectVoice();
        if (!voice) return;
        queue.push(line);
        next();
      },
      stop,
      setVolume(value) {
        if (!Number.isFinite(value)) return;
        volume = Math.min(1, Math.max(0, value));
        if (!volume) stop();
      },
    };
  };
})();
