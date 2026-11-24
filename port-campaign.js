/* Objective progression for the single-player Saltline campaign. */
(() => {
  function chapter(id, en, zh, location, time, minutes, summary) {
    return Object.freeze({
      id, title: Object.freeze([en, zh]), location: Object.freeze(location),
      time, minutes, description: Object.freeze(summary),
    });
  }

  const chapters = Object.freeze([
    chapter('berth', 'Berth 4', '四号泊位', ['Saltline Terminal', 'Saltline 港区'], '05:37', 30,
      ['Start at the port entrance, cross the yard and check the records at West Dispatch.', '从港区入口出发，横穿货场到西调度站核对记录。']),
    chapter('rail', 'Rail Yard', '铁路货场', ['West rail yard', '西区铁路货场'], '06:12', 35,
      ['Check the manifest and meet the incoming transport.', '核验签发货单，在铁路货场接应运输机。']),
    chapter('drydock', 'Old Drydock', '旧船坞', ['Old drydock', '旧船坞'], '06:33', 35,
      ['Find Mara and trace the tugboat’s route.', '找到玛拉，拼出拖轮航线。']),
    chapter('tidegate', 'Tide Gate', '防潮闸', ['South tide gate', '南防潮闸'], '07:12', 30,
      ['Cross the storm-battered flood barrier and reach the pilot station.', '顶着风浪穿过高架，抵达引航站。']),
    chapter('anchorage', 'Outer Anchorage', '外锚地', ['Outer roads', '外锚地'], '08:06', 45,
      ['Board the damaged service platform and evacuate the crew.', '登上受损维修平台，分批撤离工人。']),
    chapter('return-harbor', 'Return to Harbor', '归港', ['Cold storage quay', '冷藏码头'], '09:42', 25,
      ['Slip into port and bring a nurse to the casualty handoff.', '隐蔽靠岸，把护士带到伤员交接点。']),
    chapter('night-record', 'Night Shift Record', '夜班录音', ['Harbor dispatch tower', '港务调度塔'], '19:05', 30,
      ['Find the archivist and reconstruct what happened during the blackout.', '找到记录员，复原封港当班的录音。']),
    chapter('last-pilot', 'Last Pilot', '最后一班引航', ['Outer pilot station', '外港引航站'], '21:18', 30,
      ['Escort Harris and deliver the original records to the investigator.', '护送哈里斯，将原始证物交给调查员。']),
    chapter('reopen', 'Open Water', '重新开航', ['Saltline Terminal', 'Saltline 港区'], '05:48', 10,
      ['Return to Berth 4 for the first departure of the morning.', '回到四号泊位，迎接当天第一班出港船。']),
  ]);
  const CHAPTERS = chapters.map(({ id }) => id);
  const CHECKPOINTS = ['archive', 'lookout', 'detour', 'beacon', 'extract'];
  const SAVE_PHASES = {
    berth: ['archive', 'verify', 'extract'],
    rail: ['lookout', 'search', 'locate', 'choose', 'escort'],
  };
  const PROGRESS_KEY = 'saltline.campaign.progress.v3';
  const saveKey = id => 'saltline.campaign.completed.' + id;
  const legacyCheckpointKey = id => 'saltline.campaign.checkpoint.' + id;
  const checkpointKey = id => 'saltline.campaign.checkpoint.v2.' + id;

  function freezeCopy(value) {
    for (const child of Object.values(value)) {
      if (child && typeof child === 'object') freezeCopy(child);
    }
    return Object.freeze(value);
  }

  function readSnapshot(id, state) {
    if (!CHAPTERS.includes(id) || !state || typeof state !== 'object' || Array.isArray(state)) return null;
    const { phase } = state;
    if (Object.hasOwn(SAVE_PHASES, id) && !SAVE_PHASES[id].includes(phase)) return null;
    if (id === 'berth') {
      const { alarm, gateOpen, reinforcementCalled } = state;
      if (typeof alarm !== 'boolean' || typeof gateOpen !== 'boolean' ||
          typeof reinforcementCalled !== 'boolean' || (reinforcementCalled && !alarm)) return null;
      return Object.freeze({ phase, alarm, gateOpen, reinforcementCalled });
    }
    if (id === 'rail') {
      if (phase !== 'escort') return Object.freeze({ phase });
      const { route } = state;
      if (route !== 'ramp' && route !== 'maintenance') return null;
      return Object.freeze({ phase, route });
    }
    const { stage } = state;
    if (typeof phase !== 'string' || !phase || !Number.isSafeInteger(stage) || stage < 0) return null;
    try {
      const json = JSON.stringify(state);
      if (json.length > 8192) return null;
      const snapshot = JSON.parse(json);
      if (snapshot.phase !== phase || snapshot.stage !== stage) return null;
      return freezeCopy(snapshot);
    } catch {
      return null;
    }
  }

  function stage(id, snapshot) {
    if (!snapshot) return -1;
    return Object.hasOwn(SAVE_PHASES, id) ? SAVE_PHASES[id].indexOf(snapshot.phase) : snapshot.stage;
  }

  function endingPose(snapshot) {
    if (!snapshot || !Array.isArray(snapshot.pos) || snapshot.pos.length !== 3 ||
        !Array.from(snapshot.pos).every(Number.isFinite) || !Number.isFinite(snapshot.yaw) ||
        !Number.isFinite(snapshot.pitch)) return null;
    return freezeCopy({ pos: [...snapshot.pos], yaw: snapshot.yaw, pitch: snapshot.pitch });
  }

  function readRecord(raw) {
    let data;
    try { data = JSON.parse(raw); }
    catch { return null; }
    if (data?.version !== 3 || !Number.isInteger(data.completed) ||
        data.completed < 0 || data.completed > CHAPTERS.length) return null;
    const { completed } = data;
    const id = CHAPTERS[completed];
    const ending = id && data.ending?.id === id ?
      Object.freeze({ id, snapshot: endingPose(data.ending.snapshot) }) : null;
    return { version: 3, completed, checkpoint: readSnapshot(id, data.checkpoint), ending };
  }

  window.createPortCampaignProgress = (storage) => {
    try { storage ??= window.localStorage; }
    catch { /* Progress is still available in this page. */ }
    let state = { version: 3, completed: 0, checkpoint: null, ending: null };
    let savedV3 = false;
    let storageBehind = false;

    function sync() {
      try {
        const persisted = storage?.getItem(PROGRESS_KEY);
        const record = persisted ? readRecord(persisted) : null;
        if (record) {
          if (record.completed > state.completed || (record.completed === state.completed && !storageBehind)) {
            state = record;
            storageBehind = false;
          }
          savedV3 = true;
        } else if (!savedV3 && !storageBehind) {
          let completed = 0;
          while (completed < 2 && storage?.getItem(saveKey(CHAPTERS[completed])) === '1') completed++;
          if (completed < state.completed) return;
          const id = CHAPTERS[completed];
          let checkpoint = null;
          try {
            const old = id && storage?.getItem(checkpointKey(id));
            if (old) checkpoint = readSnapshot(id, JSON.parse(old));
          } catch { /* Valid chapter unlocks survive an invalid legacy checkpoint. */ }
          state = { version: 3, completed, checkpoint, ending: null };
        }
      } catch { /* Keep the progress already known to this page. */ }
    }

    function commit(change) {
      state = { ...state, ...change };
      storageBehind = true;
      try {
        if (!storage) return;
        storage.setItem(PROGRESS_KEY, JSON.stringify(state));
        savedV3 = true;
        storageBehind = false;
      } catch { /* Keep playing when the browser denies persistent writes. */ }
    }

    function status(id) {
      sync();
      const index = CHAPTERS.indexOf(id);
      if (index === -1 || index > state.completed) return 'locked';
      return index < state.completed ? 'complete' : 'next';
    }

    return {
      get next() {
        sync();
        return CHAPTERS[state.completed] ?? null;
      },
      status,
      mode(id) {
        const result = status(id);
        return result === 'complete' ? 'replay' : result === 'next' ? 'story' : null;
      },
      checkpoint(id) {
        sync();
        return id && id === CHAPTERS[state.completed] ? state.checkpoint : null;
      },
      legacyRestart(id) {
        sync();
        if (savedV3 || storageBehind || state.checkpoint || !id || id !== CHAPTERS[state.completed]) return false;
        try { return CHECKPOINTS.includes(storage?.getItem(legacyCheckpointKey(id))); }
        catch { return false; }
      },
      saveCheckpoint(id, snapshot) {
        sync();
        if (!id || id !== CHAPTERS[state.completed] || state.ending) return false;
        const next = readSnapshot(id, snapshot);
        if (!next || stage(id, next) <= stage(id, state.checkpoint)) return false;
        commit({ checkpoint: next });
        return true;
      },
      clearCheckpoint(id) {
        sync();
        if (!id || id !== CHAPTERS[state.completed]) return false;
        commit({ checkpoint: null, ending: null });
        try {
          storage?.removeItem(legacyCheckpointKey(id));
          storage?.removeItem(checkpointKey(id));
        } catch { /* The authoritative record already marks the chapter as cleared. */ }
        return true;
      },
      pendingEnding(id) {
        sync();
        return id && id !== state.ending?.id ? null : state.ending;
      },
      beginEnding(id, snapshot = null) {
        sync();
        if (!id || id !== CHAPTERS[state.completed] || state.ending) return false;
        const pose = endingPose(snapshot);
        if (snapshot !== null && !pose) return false;
        commit({ ending: Object.freeze({ id, snapshot: pose }) });
        return true;
      },
      finish(id) {
        sync();
        if (!id || id !== CHAPTERS[state.completed]) return false;
        commit({ completed: state.completed + 1, checkpoint: null, ending: null });
        return true;
      },
    };
  };

  function clue(id, title, detail, time, identity) {
    return Object.freeze({
      id, title: Object.freeze(title), detail: Object.freeze(detail), time,
      ...(identity ? { identity: Object.freeze(identity) } : {}),
    });
  }

  const evidenceByChapter = {
    berth: {
      clues: [
        clue('evacuation', ['Evacuation receipt', '撤离回执'], [
          'Seventeen workers marked departed. Deck loader Eli Venn appears in the signed-off roster.',
          '十七名工人的状态写着「已离港」，签收名单中有装卸工伊莱·文恩。',
        ], '05:31', ['Eli Venn', '伊莱·文恩']),
        clue('shift-log', ['Shift handover', '值班交接条'], [
          'Eli Venn signed at the Berth 4 control building. The ink has run into the last box.',
          '伊莱·文恩在四号泊位控制楼签了字，墨水洇进了最后一栏。',
        ], '05:34', ['Eli Venn', '伊莱·文恩']),
      ],
      order: ['evacuation', 'shift-log'],
      ordered: false,
    },
    drydock: {
      clues: [
        clue('tug-south-lock', ['South lock recording', '南闸录音'], [
          'The tug enters the south reach. Its engine drops to idle at the gate.',
          '拖轮驶入南侧航段，在闸前降至怠速。',
        ], '06:46'),
        clue('tug-outer-roads', ['Outer roads recording', '外锚地录音'], [
          'The same engine fades toward the service platform beyond the barrier.',
          '同一台引擎的声音在闸外维修平台方向渐远。',
        ], '06:53'),
        clue('tug-drydock', ['Drydock recording', '船坞录音'], [
          'A distinctive uneven engine note leaves the drydock basin.',
          '一阵有明显顿挫的引擎声驶离船坞。',
        ], '06:41'),
      ],
      order: ['tug-drydock', 'tug-south-lock', 'tug-outer-roads'],
      ordered: true,
    },
    'night-record': {
      clues: [
        clue('search-cancelled', ['Search cancelled', '取消搜救'], [
          'Control calls the rescue boat back after receiving the departure count.',
          '指挥部收到离港人数后召回了搜救艇。',
        ], '05:46'),
        clue('crack-report', ['Crack report', '裂缝报告'], [
          'The night crew logs a visible crack and requests a halt at the gate.',
          '夜班记录闸门裂缝，并请求停止通行。',
        ], '05:21'),
        clue('transport-intercept', ['Transport call', '运输机通话'], [
          'A contractor confirms a witness is inbound, then orders the aircraft intercepted.',
          '承包方确认有证人正在进港，随后下令拦截飞机。',
        ], '06:13'),
        clue('transfer-order', ['Transfer authorization', '转移授权'], [
          'Dispatch acknowledges Reed’s signed authorization to move the seventeen workers.',
          '调度确认收到里德签发的十七名工人转移授权。',
        ], '05:28'),
      ],
      order: ['crack-report', 'transfer-order', 'search-cancelled', 'transport-intercept'],
      ordered: true,
    },
  };

  function createEvidence(id, saved) {
    const definition = Object.hasOwn(evidenceByChapter, id) ? evidenceByChapter[id] : null;
    const clues = definition ? Object.freeze([...definition.clues]) : Object.freeze([]);
    const required = definition?.order ?? [];
    const collected = new Set(Array.isArray(saved?.collected) ? saved.collected.filter(item => required.includes(item)) : []);
    let verified = Boolean(saved?.verified && required.length && collected.size === required.length);
    return {
      clues,
      get collected() { return [...collected]; },
      get verified() { return verified; },
      get snapshot() { return { collected: [...collected], verified }; },
      collect(clueId) {
        if (collected.has(clueId) || !required.includes(clueId)) return false;
        collected.add(clueId);
        return true;
      },
      verify(selection) {
        if (!required.length || !Array.isArray(selection) || selection.length !== required.length ||
            new Set(selection).size !== required.length || !selection.every(item => collected.has(item))) return false;
        if (definition.ordered && !required.every((item, index) => selection[index] === item)) return false;
        verified = true;
        return true;
      },
    };
  }

  window.SaltlineCampaign = Object.freeze({ chapters, createEvidence });

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
