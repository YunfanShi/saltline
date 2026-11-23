/* Objective progression for the single-player Saltline campaign. */
(() => {
  const RECOVERY_SECONDS = 3;
  const UPLOAD_SECONDS = 18;
  const CHAPTERS = ['berth', 'rail'];
  const CHECKPOINTS = ['archive', 'beacon', 'extract'];
  const saveKey = id => 'saltline.campaign.completed.' + id;
  const checkpointKey = id => 'saltline.campaign.checkpoint.' + id;

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
    function checkpoint(id) {
      readProgress();
      if (!id || id !== CHAPTERS[completed]) return null;
      try {
        const saved = storage?.getItem(checkpointKey(id));
        if (CHECKPOINTS.indexOf(saved) > CHECKPOINTS.indexOf(checkpoints.get(id))) checkpoints.set(id, saved);
      } catch { /* Use the checkpoint already available in this page. */ }
      return checkpoints.get(id) ?? null;
    }
    function clearCheckpoint(id) {
      checkpoints.delete(id);
      try { storage?.removeItem(checkpointKey(id)); }
      catch { /* Clear the in-page checkpoint even when storage is denied. */ }
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
      saveCheckpoint(id, phase) {
        const previous = checkpoint(id);
        if (!id || id !== CHAPTERS[completed] || CHECKPOINTS.indexOf(phase) <= CHECKPOINTS.indexOf(previous)) return;
        checkpoints.set(id, phase);
        try { storage?.setItem(checkpointKey(id), phase); }
        catch { /* The player can still retry from this checkpoint in this page. */ }
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

  window.createPortCampaign = ({
    archive, beacon, extraction,
    recoverySeconds = RECOVERY_SECONDS, uploadSeconds = UPLOAD_SECONDS, initialPhase,
  }) => {
    let phase = CHECKPOINTS.includes(initialPhase) ? initialPhase : 'relays';
    let recovered = 0;
    let uploaded = 0;

    return {
      get phase() { return phase; },
      get uploadSeconds() { return uploadSeconds; },
      relaysCut() {
        if (phase !== 'relays') return false;
        phase = 'archive';
        return true;
      },
      update(dt, player, interact, { canInteract = true } = {}) {
        if (!player.alive || !Number.isFinite(dt) || dt <= 0) return null;
        const pos = player.pos;
        if (phase === 'archive') {
          const accessible = canInteract && inside(pos, archive, 2.4, 1.8);
          recovered = accessible && interact ? Math.min(recoverySeconds, recovered + dt) : 0;
          if (recovered >= recoverySeconds) phase = 'beacon';
          else if (accessible) return { prompt: 'recover', progress: recovered / recoverySeconds };
        } else if (phase === 'beacon') {
          if (canInteract && inside(pos, beacon, 2.4, 1.8)) {
            if (interact) phase = 'defend';
            else return { prompt: 'start', progress: 0 };
          }
        } else if (phase === 'defend') {
          const inRange = inside(pos, beacon, 6.5, 2.2);
          if (inRange) uploaded = Math.min(uploadSeconds, uploaded + dt);
          if (uploaded >= uploadSeconds) phase = 'extract';
          else return { uploading: inRange, seconds: Math.ceil(uploadSeconds - uploaded) };
        } else if (phase === 'extract' && inside(pos, extraction.pos, extraction.radius, 3.5)) {
          phase = 'complete';
        }
        return null;
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
