/* Objective progression for the single-player Saltline campaign. */
(() => {
  const CHAPTERS = ['berth', 'rail'];
  const CHECKPOINTS = ['archive', 'lookout', 'detour', 'beacon', 'extract'];
  const SAVE_PHASES = {
    berth: ['extract'],
    rail: ['lookout', 'search', 'locate', 'choose', 'escort'],
  };
  const saveKey = id => 'saltline.campaign.completed.' + id;
  const legacyCheckpointKey = id => 'saltline.campaign.checkpoint.' + id;
  const checkpointKey = id => 'saltline.campaign.checkpoint.v2.' + id;

  function readSnapshot(id, state) {
    if (!state || !SAVE_PHASES[id]?.includes(state.phase)) return null;
    const { phase } = state;
    if (id === 'berth') {
      const { alarm, gateOpen, reinforcementCalled } = state;
      if (typeof alarm !== 'boolean' || typeof gateOpen !== 'boolean' ||
          typeof reinforcementCalled !== 'boolean' || (reinforcementCalled && !alarm)) return null;
      return Object.freeze({ phase, alarm, gateOpen, reinforcementCalled });
    }
    if (phase === 'escort') {
      const { route } = state;
      if (route !== 'ramp' && route !== 'maintenance') return null;
      return Object.freeze({ phase, route });
    }
    return Object.freeze({ phase });
  }

  window.createPortCampaignProgress = (storage) => {
    let completed = 0;
    try { storage ??= window.localStorage; }
    catch { /* Progress is still available in this page. */ }
    function readProgress() {
      try {
        while (completed < CHAPTERS.length && storage?.getItem(saveKey(CHAPTERS[completed])) === '1') completed++;
      } catch { /* Keep the progress already known to this page. */ }
    }
    const checkpoints = new Map();
    const cleared = new Set();
    function stage(id, snapshot) {
      return SAVE_PHASES[id].indexOf(snapshot?.phase);
    }
    function checkpoint(id) {
      readProgress();
      if (!id || id !== CHAPTERS[completed]) return null;
      if (!cleared.has(id)) {
        try {
          const raw = storage?.getItem(checkpointKey(id));
          const saved = raw && readSnapshot(id, JSON.parse(raw));
          if (stage(id, saved) > stage(id, checkpoints.get(id))) checkpoints.set(id, saved);
        } catch { /* Use the checkpoint already available in this page. */ }
      }
      return checkpoints.get(id) ?? null;
    }
    function clearCheckpoint(id) {
      if (!CHAPTERS.includes(id)) return;
      checkpoints.delete(id);
      try {
        storage?.removeItem(legacyCheckpointKey(id));
        storage?.removeItem(checkpointKey(id));
      } catch { cleared.add(id); }
    }

    return {
      get next() {
        readProgress();
        return CHAPTERS[completed] ?? null;
      },
      status(id) {
        readProgress();
        const index = CHAPTERS.indexOf(id);
        if (index === -1 || index > completed) return 'locked';
        return index < completed ? 'complete' : 'next';
      },
      checkpoint,
      legacyRestart(id) {
        if (checkpoint(id) || !id || id !== CHAPTERS[completed] || cleared.has(id)) return false;
        try { return CHECKPOINTS.includes(storage?.getItem(legacyCheckpointKey(id))); }
        catch { return false; }
      },
      saveCheckpoint(id, snapshot) {
        const previous = checkpoint(id);
        if (!id || id !== CHAPTERS[completed]) return false;
        const next = readSnapshot(id, snapshot);
        if (!next || stage(id, next) <= stage(id, previous)) return false;
        checkpoints.set(id, next);
        try { storage?.setItem(checkpointKey(id), JSON.stringify(next)); }
        catch { /* The player can still retry from this checkpoint in this page. */ }
        return true;
      },
      clearCheckpoint,
      finish(id) {
        readProgress();
        if (!id || id !== CHAPTERS[completed]) return false;
        completed++;
        clearCheckpoint(id);
        try { storage?.setItem(saveKey(id), '1'); }
        catch { /* Keep the current page playable if storage is denied. */ }
        return true;
      },
    };
  };

  function inside(position, target, radius, height) {
    return Math.abs(position.y - target.y) <= height &&
      Math.hypot(position.x - target.x, position.z - target.z) <= radius;
  }

  window.createRailCampaignPrelude = ({ archive, initialCheckpoint, recoverySeconds = 1.1 }) => {
    const saved = readSnapshot('rail', initialCheckpoint);
    let phase = !saved ? 'archive' : saved.phase === 'lookout' ? 'lookout' : 'rescue';
    let held = 0;

    return {
      get phase() { return phase; },
      get snapshot() { return phase === 'lookout' ? { phase } : null; },
      transportCrashed() {
        if (phase !== 'lookout') return false;
        phase = 'rescue';
        return true;
      },
      rescueComplete() {
        if (phase !== 'rescue') return false;
        phase = 'complete';
        return true;
      },
      update(dt, player, interact, { canInteract = true } = {}) {
        if (phase !== 'archive' || !Number.isFinite(dt) || dt <= 0) return null;
        const accessible = player.alive && canInteract && inside(player.pos, archive, 2.4, 1.8);
        held = accessible && interact ? held + dt : 0;
        if (!accessible) return null;
        if (interact && held >= recoverySeconds) {
          phase = 'lookout';
          return null;
        }
        return { prompt: 'recover', progress: held / recoverySeconds };
      },
    };
  };

  window.createPortCinematicDirector = () => {
    let active = null;
    function finish(reason) {
      if (!active) return false;
      const { sequence } = active;
      active = null;
      sequence.onFinish(reason);
      return true;
    }

    return {
      get active() { return active !== null; },
      get id() { return active?.sequence.id ?? null; },
      get time() { return active?.elapsed ?? 0; },
      play(sequence) {
        if (active || !(Number.isFinite(sequence.duration) && sequence.duration > 0)) return false;
        active = { sequence, elapsed: 0 };
        sequence.onFrame(0, 0);
        return true;
      },
      update(dt) {
        if (!active || !Number.isFinite(dt) || dt <= 0) return;
        const run = active;
        const before = run.elapsed;
        run.elapsed = Math.min(run.elapsed + dt, run.sequence.duration);
        run.sequence.onFrame(run.elapsed, run.elapsed - before);
        if (active === run && run.elapsed === run.sequence.duration) finish('complete');
      },
      skip() { return finish('skip'); },
      cancel() { return finish('cancel'); },
    };
  };

  window.createCampaignSupplies = (sites, { reserveCap = 150, radius = 1.7, height = 1.8 } = {}) => {
    const caches = sites.map(({ id, pos, rounds }) => ({ id, pos, rounds, used: false }));

    return {
      caches,
      collect(player, reserve, { canCollect = () => true } = {}) {
        if (!player.alive || !Number.isFinite(reserve) || reserve >= reserveCap) return null;
        const cache = caches.find(entry => !entry.used && inside(player.pos, entry.pos, radius, height) && canCollect(entry));
        const rounds = cache && Math.min(cache.rounds, reserveCap - reserve);
        if (!(rounds > 0)) return null;
        cache.used = true;
        return { id: cache.id, rounds };
      },
    };
  };

  window.createCampaignTerminals = ({ THREE, scene }, points) => {
    const cabinet = new THREE.BoxGeometry(.65, .94, .48);
    const panel = new THREE.BoxGeometry(.49, .19, .04);
    const body = new THREE.MeshStandardMaterial({ color: 0x23323a, roughness: .8, metalness: .45 });
    const terminals = Object.fromEntries(Object.entries(points).map(([name, pos]) => {
      const unit = new THREE.Group();
      unit.name = 'campaign-' + name;
      unit.position.copy(pos);
      unit.visible = false;
      const housing = new THREE.Mesh(cabinet, body);
      housing.position.y = .47;
      const color = name === 'archive' ? 0xffb347 : 0x64d5ff;
      const screen = new THREE.Mesh(panel, new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: 1.35,
      }));
      screen.position.set(0, .76, .25);
      unit.add(housing, screen);
      scene.add(unit);
      return [name, unit];
    }));
    return phase => {
      terminals.archive.visible = phase === 'archive';
      terminals.beacon.visible = phase === 'beacon' || phase === 'defend' || phase === 'extract';
    };
  };
})();
