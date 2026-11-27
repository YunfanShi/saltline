/* Isolated rail crash/rescue flow. This controller does not access campaign saves. */
(() => {
  window.createCrashRescueSlice = ({ crash, rescue, onWreck = () => {}, onRadio = () => {} }) => {
    if (!crash || !rescue) throw new Error('Crash and rescue controllers are required');
    let phase = 'inactive';
    let checkpoint = null;

    function setWreck(visible) { onWreck(visible); }
    function start() {
      crash.reset();
      rescue.reset();
      setWreck(false);
      checkpoint = null;
      phase = 'lookout';
    }
    function restore() {
      if (phase !== 'failed') return false;
      if (!checkpoint) { start(); return true; }
      crash.reset();
      crash.launch({ silent: true });
      crash.skip({ silent: true });
      setWreck(true);
      rescue.reset(checkpoint);
      phase = 'rescue';
      return true;
    }
    function update(dt, player, interact = false) {
      if (!(dt > 0) || !Number.isFinite(dt) || phase === 'inactive' || phase === 'failed' || phase === 'complete') return null;
      if (!player?.alive) {
        if (phase === 'rescue') checkpoint = rescue.snapshot;
        phase = 'failed';
        return { changed: true, failed: true };
      }
      if (phase === 'lookout') {
        if (player.pos.distanceTo(crash.viewingSpot) < 2.8) {
          crash.launch();
          phase = 'crash';
          return { changed: true };
        }
        return null;
      }
      crash.update(dt);
      if (phase === 'crash' && crash.phase === 'wreck') {
        setWreck(true);
        const line = rescue.start();
        if (line) onRadio(line);
        checkpoint = rescue.snapshot;
        phase = 'rescue';
        return { changed: true };
      }
      if (phase === 'rescue') {
        const result = rescue.update(dt, player, interact);
        if (result?.radio) onRadio(result.radio);
        if (result?.changed) checkpoint = rescue.snapshot;
        if (result?.complete) phase = 'complete';
        return result;
      }
      return null;
    }
    function dispose() {
      crash.reset();
      rescue.reset();
      setWreck(false);
      checkpoint = null;
      phase = 'inactive';
    }
    return {
      start, update, restore, dispose,
      get phase() { return phase; },
      get objective() {
        if (phase === 'lookout') return ['Reach the crash lookout', '前往坠机观景点'];
        if (phase === 'crash') return ['Watch the approaching aircraft', '观察接近中的运输机'];
        if (phase === 'rescue') return rescue.objective;
        if (phase === 'failed') return ['Retry the rescue', '重试救援'];
        return null;
      },
      get markers() { return phase === 'rescue' ? rescue.markers : phase === 'lookout'
        ? [{ id: 'crash-lookout', short: 'OBS', pos: crash.viewingSpot, kind: 'story' }] : []; },
      get resumePosition() { return phase === 'failed' && checkpoint ? rescue.resumePosition : crash.viewingSpot; },
      get snapshot() { return checkpoint ? { ...checkpoint } : null; },
    };
  };
})();
