/* Headquarters prologue and training progression. */
(() => {
  const PROLOGUE_KEY = 'saltline.campaign.prologue.v1';
  const phases = ['unstarted', 'briefed', 'boarding', 'landed'];
  const modes = ['story', 'replay', 'range'];
  const lessons = ['move', 'aim', 'switch', 'reload', 'terminal'];

  const objectives = {
    briefing: ['Report to the briefing room', '前往简报室报到'],
    briefed: ['Board at the helipad. Training is available in the west lane.', '前往停机坪登机。可先去西侧靶道训练。'],
    boarding: ['Board the rescue helicopter', '登上海事应急直升机'],
    complete: ['Range session complete', '靶场练习结束'],
  };
  const hints = {
    move: ['Move around the firing line', '在射击线附近移动'],
    aim: ['Aim and hit the close and middle targets', '瞄准并命中近距靶和中距靶'],
    switch: ['Switch between the pistol and rifle', '在手枪和步枪之间切换'],
    reload: ['Reload a weapon', '给一把武器换弹'],
    terminal: ['Open the field terminal', '打开战术终端'],
    complete: ['Training complete. Resupply at the bench.', '训练完成，可在补给台补弹。'],
  };
  const briefing = [
    'Berth Four went dark at five thirty-seven. Dispatch says seventeen night workers left, but the last call reports people still inside. Lynn, confirm the count and recover the originals. If the roster disagrees with the scene, trust the scene.',
    '四号泊位在五点三十七分断讯。调度说十七名夜班工人已经撤离，可最后一通电话里说还有人留在里面。林恩，你去核对人数，把原始记录带回来。如果名单和现场对不上，以现场为准。',
  ];

  function readPhase(storage) {
    try {
      const record = JSON.parse(storage?.getItem(PROLOGUE_KEY) ?? 'null');
      return record?.version === 1 && phases.includes(record.phase) ? record.phase : 'unstarted';
    } catch {
      return 'unstarted';
    }
  }

  function existingCampaign(campaign) {
    return campaign.next !== 'berth' || campaign.checkpoint('berth') != null ||
      campaign.pendingEnding?.('berth') != null || campaign.legacyRestart?.('berth') === true;
  }

  window.createPortPrologueProgress = (campaign, storage) => {
    try { storage ??= window.localStorage; }
    catch { /* Continue in the current page when storage is not available. */ }
    let phase = 'unstarted';

    function sync() {
      const persisted = readPhase(storage);
      if (phases.indexOf(persisted) > phases.indexOf(phase)) phase = persisted;
      return phase;
    }

    return {
      get phase() { return sync(); },
      get needsPrologue() { return sync() !== 'landed' && !existingCampaign(campaign); },
      record(next) {
        if (existingCampaign(campaign) || phases.indexOf(next) !== phases.indexOf(sync()) + 1) return false;
        phase = next;
        try { storage?.setItem(PROLOGUE_KEY, JSON.stringify({ version: 1, phase })); }
        catch { /* The state remains available until this page is closed. */ }
        return true;
      },
    };
  };

  function near(a, b, radius, height = 1.6) {
    return a && b && Math.abs(a.y - b.y) < height && Math.hypot(a.x - b.x, a.z - b.z) < radius;
  }

  function validVector(value) {
    return value && [value.x, value.y, value.z].every(Number.isFinite);
  }

  window.createPortPrologueChapter = (world, layout, { progress, mode = 'story' } = {}) => {
    const { points, targets = [] } = layout;
    const shots = new Set();
    const completed = new Set();
    let phase, boardSent, active, rangeStart, held, holding, dirty, exitSent, resupplySent;

    function reset(nextMode = mode) {
      if (modes.includes(nextMode)) mode = nextMode;
      const saved = mode === 'story' ? progress?.phase : 'unstarted';
      phase = mode === 'range' ? 'range' :
        saved === 'boarding' ? 'boarding' : saved === 'briefed' ? 'briefed' : 'briefing';
      boardSent = exitSent = resupplySent = active = dirty = false;
      rangeStart = holding = null;
      held = 0;
      shots.clear();
      completed.clear();
      for (const target of targets) target.setHit?.(false);
    }

    function nextLesson() {
      for (const lesson of lessons) {
        if (!completed.has(lesson) || (lesson === 'aim' && shots.size < targets.length)) return lesson;
      }
      return 'complete';
    }

    function note(action) {
      if (!active || !lessons.includes(action) || completed.has(action)) return false;
      completed.add(action);
      dirty = true;
      return true;
    }

    function trainingHit({ origin, dir } = {}) {
      if (!canTrain() || !near(origin, points.range, 8, 3) ||
          !validVector(origin) || !validVector(dir)) return false;
      const length = Math.hypot(dir.x, dir.y, dir.z);
      if (!length) return false;
      const direction = { x: dir.x / length, y: dir.y / length, z: dir.z / length };
      let nearest = null;
      let distance = 60;
      for (const target of targets) {
        if (shots.has(target.id)) continue;
        const { center, radius = .4 } = target;
        const x = center.x - origin.x, y = center.y - origin.y, z = center.z - origin.z;
        const along = x * direction.x + y * direction.y + z * direction.z;
        if (along <= 0 || along >= distance) continue;
        const missDistance = Math.hypot(x - direction.x * along, y - direction.y * along, z - direction.z * along);
        if (missDistance > radius) continue;
        const wall = world.physics?.raycast?.(origin, direction, along);
        if (wall && wall.box?.tag !== target.id) continue;
        nearest = target;
        distance = along;
      }
      if (!nearest) return false;
      shots.add(nearest.id);
      nearest.setHit?.(true);
      dirty = true;
      return true;
    }

    function canTrain() { return phase === 'range' || phase === 'briefed'; }

    function updateRange(player) {
      const inside = canTrain() && near(player.pos, points.range, 7);
      if (inside !== active) {
        active = Boolean(inside);
        dirty = true;
      }
      if (!active || completed.has('move')) return;
      if (!rangeStart) rangeStart = { x: player.pos.x, z: player.pos.z };
      if (Math.hypot(player.pos.x - rangeStart.x, player.pos.z - rangeStart.z) >= 1.4) note('move');
    }

    function interaction(player) {
      if (phase === 'briefing' && near(player.pos, points.briefing, 2.3)) return {
        id: 'brief', prompt: ['Read the dispatch record and call Ward', '查看调度记录并联络沃德'], seconds: .65,
      };
      if ((phase === 'briefed' || phase === 'boarding') && !boardSent && near(player.pos, points.boarding, 2.5)) return {
        id: 'board', prompt: ['Board the rescue helicopter', '登上海事应急直升机'], seconds: .65,
      };
      if (canTrain() && !resupplySent && near(player.pos, points.ammo, 2)) return {
        id: 'resupply', prompt: ['Resupply training ammunition', '补充训练弹药'], seconds: .5,
      };
      if (phase === 'range' && !exitSent && near(player.pos, points.trainingExit, 2.4)) return {
        id: 'exit', prompt: ['Leave the training range', '离开训练场'], seconds: .45,
      };
      return null;
    }

    function update(dt, player, interact) {
      if (!player?.alive || !Number.isFinite(dt) || dt <= 0) return null;
      updateRange(player);
      if (!interact) resupplySent = false;
      const action = interaction(player);
      if (!interact || action?.id !== holding) held = 0;
      holding = action?.id;
      if (action && interact) held += dt;
      let event, radio;
      if (action && held >= action.seconds) {
        held = 0;
        if (action.id === 'brief') {
          if (mode === 'story') progress?.record('briefed');
          phase = 'briefed';
          event = 'briefed';
          radio = briefing;
        } else if (action.id === 'board') {
          if (mode === 'story') progress?.record('boarding');
          phase = 'boarding';
          boardSent = true;
          event = 'board';
        } else if (action.id === 'resupply') {
          resupplySent = true;
          event = 'resupply';
        } else {
          phase = 'complete';
          exitSent = true;
          event = 'exit';
        }
        dirty = true;
      }
      const changed = dirty;
      dirty = false;
      return changed || action ? {
        changed, event, radio,
        prompt: event ? null : action?.prompt ?? null,
        progress: event || !action ? 0 : Math.min(held / action.seconds, 1),
      } : null;
    }

    function markers() {
      if (phase === 'briefing') return [{ id: 'briefing', pos: points.briefing, short: 'HQ', kind: 'story' }];
      if (phase === 'boarding') return [{ id: 'boarding', pos: points.boarding, short: 'AIR', kind: 'extract' }];
      if (phase === 'briefed') return [
        { id: 'range', pos: points.range, short: 'RNG', kind: 'story' },
        { id: 'boarding', pos: points.boarding, short: 'AIR', kind: 'extract' },
      ];
      if (phase === 'range') return [
        { id: 'range', pos: points.range, short: 'RNG', kind: 'story' },
        { id: 'training-exit', pos: points.trainingExit, short: 'EXIT', kind: 'extract' },
      ];
      return [];
    }

    reset();
    return {
      reset, update, markers, trainingHit, note,
      get mode() { return mode; },
      get phase() { return phase; },
      get training() {
        const step = nextLesson();
        return { active, step, hits: shots.size, total: targets.length, complete: step === 'complete', hint: hints[step] };
      },
      get objective() {
        if (phase === 'range' || (phase === 'briefed' && active)) return hints[nextLesson()];
        return objectives[phase];
      },
      get resumePosition() {
        return phase === 'range' ? points.range : phase === 'boarding' ? points.boarding :
          phase === 'briefed' ? points.briefing : null;
      },
    };
  };
})();
