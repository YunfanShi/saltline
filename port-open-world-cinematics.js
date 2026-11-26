/* Saltline Open-World Cinematic Cutscene Director, Interactive Signal Tuner & Tactical Progress Tracker.
 * Provides letterbox camera cutscenes (skippable via Space), frequency-lock decoding mini-games,
 * and live signal/hold progress tracking without per-frame allocations or DOM thrashing. */
(() => {
  function injectStyles() {
    if (document.getElementById('saltline-cinematics-style')) return;
    const style = document.createElement('style');
    style.id = 'saltline-cinematics-style';
    style.textContent = `
      .sl-cine-root{position:fixed;inset:0;z-index:42;pointer-events:none;opacity:0;transition:opacity .35s ease}
      .sl-cine-root.on{opacity:1;pointer-events:auto}
      .sl-cine-bar{position:fixed;left:0;right:0;height:9.5vh;min-height:46px;max-height:84px;background:#05080b;transition:transform .45s cubic-bezier(.22,1,.36,1)}
      .sl-cine-bar.top{top:0;transform:translateY(-100%);border-bottom:1px solid rgba(242,196,90,.28)}
      .sl-cine-bar.bot{bottom:0;transform:translateY(100%);border-top:1px solid rgba(242,196,90,.28)}
      .sl-cine-root.on .sl-cine-bar{transform:translateY(0)}
      .sl-cine-head{position:fixed;top:calc(9.5vh + 16px);left:28px;display:flex;flex-direction:column;gap:4px;max-width:min(520px,78vw);text-shadow:0 2px 12px rgba(0,0,0,.92)}
      .sl-cine-tag{font:800 11px/1 system-ui,sans-serif;letter-spacing:.22em;color:#f2c45a;text-transform:uppercase}
      .sl-cine-title{font:800 clamp(20px,2.8vw,32px)/1.15 system-ui,sans-serif;color:#f8f4e8}
      .sl-cine-sub{font:500 14px/1.4 system-ui,sans-serif;color:#c9dde4}
      .sl-cine-caption{position:fixed;left:50%;bottom:calc(9.5vh + 18px);transform:translateX(-50%);max-width:min(760px,86vw);padding:11px 20px;background:rgba(6,11,15,.86);border:1px solid rgba(242,196,90,.35);border-left:3px solid #f2c45a;color:#f4f2ea;font:500 clamp(14px,1.55vw,17px)/1.55 system-ui,sans-serif;text-align:left;box-shadow:0 10px 28px rgba(0,0,0,.6);opacity:0;transition:opacity .25s ease}
      .sl-cine-caption.on{opacity:1}
      .sl-cine-who{display:inline-block;margin-right:8px;font-weight:800;color:#8ed4f0}
      .sl-cine-who.hostile{color:#ff867c}
      .sl-cine-who.rescue{color:#7ee5a8}
      .sl-cine-skip{position:fixed;right:24px;bottom:calc(4.75vh - 15px);z-index:43;padding:6px 14px;border:1px solid rgba(242,196,90,.48);background:rgba(14,22,28,.88);color:#f2e6c8;font:700 12px/1.2 system-ui,sans-serif;letter-spacing:.08em;cursor:pointer}
      .sl-cine-skip:hover{background:#23323d;border-color:#ffd778}

      .sl-tracker{position:fixed;top:calc(238px + var(--sat, 0px));left:var(--gl, 18px);z-index:20;width:min(350px,46vw);padding:9px 12px;background:rgba(9,16,22,.88);border:1px solid rgba(112,214,242,.42);border-left:4px solid #59d2f2;color:#eef7fa;font:600 12px/1.4 system-ui,sans-serif;box-shadow:0 8px 22px rgba(0,0,0,.48);pointer-events:none;opacity:0;transform:translateY(-6px);transition:opacity .2s ease,transform .2s ease}
      .sl-tracker.on{opacity:1;transform:translateY(0)}
      .sl-tracker.amber{border-color:rgba(242,196,90,.48);border-left-color:#f2c45a}
      .sl-tracker.green{border-color:rgba(92,224,148,.48);border-left-color:#5ce094}
      .sl-tracker-row{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px}
      .sl-tracker-lbl{font-weight:800;color:#f6f3e8;letter-spacing:.03em}
      .sl-tracker-val{font-variant-numeric:tabular-nums;color:#8de3f8;font-weight:800}
      .sl-tracker.amber .sl-tracker-val{color:#f5cf72}
      .sl-tracker.green .sl-tracker-val{color:#7ee8aa}
      .sl-tracker-bar{height:7px;background:rgba(255,255,255,.12);overflow:hidden}
      .sl-tracker-fill{height:100%;width:0%;background:linear-gradient(90deg,#3bb7e0,#96ecff);transition:width .12s linear}
      .sl-tracker.amber .sl-tracker-fill{background:linear-gradient(90deg,#d99b2e,#ffe084)}
      .sl-tracker.green .sl-tracker-fill{background:linear-gradient(90deg,#2fb872,#8cf2b8)}
      .sl-tracker-sub{margin-top:5px;font-size:11px;color:#b7cbd2;font-weight:500}

      .sl-tuner-backdrop{position:fixed;inset:0;z-index:48;display:none;align-items:center;justify-content:center;background:rgba(4,9,13,.76)}
      .sl-tuner-backdrop.on{display:flex}
      .sl-tuner-card{width:min(500px,92vw);padding:20px 22px;background:#0e171e;border:1px solid rgba(242,196,90,.5);border-top:3px solid #f2c45a;color:#f4f2e8;box-shadow:0 18px 50px rgba(0,0,0,.72);font-family:system-ui,-apple-system,sans-serif}
      .sl-tuner-tag{font-size:11px;font-weight:800;letter-spacing:.2em;color:#f2c45a;margin-bottom:4px}
      .sl-tuner-title{font-size:20px;font-weight:800;margin:0 0 6px}
      .sl-tuner-sub{font-size:13px;color:#b9ced6;margin:0 0 16px;line-height:1.45}
      .sl-tuner-pips{display:flex;gap:8px;margin-bottom:14px}
      .sl-tuner-pip{flex:1;height:8px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.16);transition:background .2s ease}
      .sl-tuner-pip.ok{background:#5ce094;border-color:#9cf7c2;box-shadow:0 0 10px rgba(92,224,148,.55)}
      .sl-tuner-track{position:relative;height:42px;background:linear-gradient(90deg,#081016,#12222c,#081016);border:1px solid rgba(130,196,218,.35);margin-bottom:14px;overflow:hidden}
      .sl-tuner-zone{position:absolute;top:0;bottom:0;background:rgba(242,196,90,.30);border-left:2px solid #f5cf72;border-right:2px solid #f5cf72;transition:left .22s ease,width .22s ease}
      .sl-tuner-needle{position:absolute;top:-2px;bottom:-2px;width:4px;margin-left:-2px;background:#7ef0ff;box-shadow:0 0 12px #7ef0ff}
      .sl-tuner-status{min-height:20px;font-size:13px;font-weight:700;color:#dbe8ec;margin-bottom:14px}
      .sl-tuner-status.ok{color:#7ee8aa}
      .sl-tuner-status.err{color:#ff867c}
      .sl-tuner-actions{display:flex;gap:10px;justify-content:flex-end}
      .sl-tuner-btn{padding:9px 18px;border:1px solid rgba(242,196,90,.55);background:#26332f;color:#faf6ea;font:700 13px/1 system-ui,sans-serif;cursor:pointer}
      .sl-tuner-btn.primary{background:#c89835;color:#0b1114;border-color:#ffe08a}
      .sl-tuner-btn:hover{filter:brightness(1.12)}
      @media (max-width:760px){.sl-tracker{top:calc(206px + var(--sat, 0px));width:min(280px,68vw)}}
    `;
    document.head.appendChild(style);
  }

  window.createOpenWorldStoryDirector = (world) => {
    const { THREE, audio } = world;
    const { Vector3 } = THREE;
    injectStyles();

    // 1. Cutscene DOM
    const cineRoot = document.createElement('div');
    cineRoot.className = 'sl-cine-root';
    cineRoot.innerHTML = `
      <div class="sl-cine-bar top"></div>
      <div class="sl-cine-bar bot"></div>
      <div class="sl-cine-head">
        <div class="sl-cine-tag"></div>
        <div class="sl-cine-title"></div>
        <div class="sl-cine-sub"></div>
      </div>
      <div class="sl-cine-caption"><span class="sl-cine-who"></span><span class="sl-cine-line"></span></div>
      <button type="button" class="sl-cine-skip">[Space] 跳过过场</button>
    `;
    document.body.appendChild(cineRoot);
    const cineTag = cineRoot.querySelector('.sl-cine-tag');
    const cineTitle = cineRoot.querySelector('.sl-cine-title');
    const cineSub = cineRoot.querySelector('.sl-cine-sub');
    const cineCap = cineRoot.querySelector('.sl-cine-caption');
    const cineWho = cineRoot.querySelector('.sl-cine-who');
    const cineLine = cineRoot.querySelector('.sl-cine-line');
    const cineSkipBtn = cineRoot.querySelector('.sl-cine-skip');

    // 2. Tactical Signal / Hold Progress Tracker DOM
    const trackerEl = document.createElement('div');
    trackerEl.className = 'sl-tracker';
    trackerEl.innerHTML = `
      <div class="sl-tracker-row"><span class="sl-tracker-lbl"></span><span class="sl-tracker-val"></span></div>
      <div class="sl-tracker-bar"><div class="sl-tracker-fill"></div></div>
      <div class="sl-tracker-sub"></div>
    `;
    document.body.appendChild(trackerEl);
    const trLbl = trackerEl.querySelector('.sl-tracker-lbl');
    const trVal = trackerEl.querySelector('.sl-tracker-val');
    const trFill = trackerEl.querySelector('.sl-tracker-fill');
    const trSub = trackerEl.querySelector('.sl-tracker-sub');

    // 3. Interactive Signal Tuner Mini-Game DOM
    const tunerBg = document.createElement('div');
    tunerBg.className = 'sl-tuner-backdrop';
    tunerBg.innerHTML = `
      <div class="sl-tuner-card">
        <div class="sl-tuner-tag">SAR-04 · 战术频谱解码仪</div>
        <h3 class="sl-tuner-title"></h3>
        <p class="sl-tuner-sub"></p>
        <div class="sl-tuner-pips"></div>
        <div class="sl-tuner-track">
          <div class="sl-tuner-zone"></div>
          <div class="sl-tuner-needle"></div>
        </div>
        <div class="sl-tuner-status">指针进入金色频段时按 [空格] 或点击「锁定频段」</div>
        <div class="sl-tuner-actions">
          <button type="button" class="sl-tuner-btn" data-tuner-cancel>取消 [Esc]</button>
          <button type="button" class="sl-tuner-btn primary" data-tuner-lock>锁定频段 [Space]</button>
        </div>
      </div>
    `;
    document.body.appendChild(tunerBg);
    const tuTitle = tunerBg.querySelector('.sl-tuner-title');
    const tuSub = tunerBg.querySelector('.sl-tuner-sub');
    const tuPips = tunerBg.querySelector('.sl-tuner-pips');
    const tuZone = tunerBg.querySelector('.sl-tuner-zone');
    const tuNeedle = tunerBg.querySelector('.sl-tuner-needle');
    const tuStatus = tunerBg.querySelector('.sl-tuner-status');
    const tuLockBtn = tunerBg.querySelector('[data-tuner-lock]');
    const tuCancelBtn = tunerBg.querySelector('[data-tuner-cancel]');

    // State
    let activeCine = null;
    let savedPlayerEnabled = true;
    let savedPlayerInvuln = false;
    const tmpCamPos = new Vector3();
    const tmpLookAt = new Vector3();
    const playedCutscenes = new Set();

    let activeTuner = null;
    let lastTrackerKey = '';

    function stopCutscene(runCallback = true) {
      if (!activeCine) return;
      const doneCb = activeCine.onComplete;
      activeCine = null;
      cineRoot.classList.remove('on');
      cineCap.classList.remove('on');
      if (world.player) {
        world.player.enabled = savedPlayerEnabled;
        world.player.invulnerable = savedPlayerInvuln;
      }
      world.weapon?.setVisible?.(true);
      if (runCallback && typeof doneCb === 'function') {
        try { doneCb(); } catch {}
      }
    }

    function playCutscene({
      id, tag = '剧情演出 · CINEMATIC', title = '', subtitle = '',
      duration = 5.5, camFrom, camTo, lookAt, lookAtEnd = null,
      lines = [], once = true, onComplete = null,
    }) {
      if (document.body.classList.contains('audit-clean')) {
        onComplete?.();
        return false;
      }
      if (once && id && playedCutscenes.has(id)) {
        onComplete?.();
        return false;
      }
      if (id) playedCutscenes.add(id);
      if (activeCine) stopCutscene(false);
      savedPlayerEnabled = world.player ? world.player.enabled !== false : true;
      savedPlayerInvuln = world.player ? !!world.player.invulnerable : false;
      if (world.player) {
        world.player.enabled = false;
        world.player.invulnerable = true;
        if (world.player.vel) world.player.vel.set(0, 0, 0);
      }
      world.weapon?.setVisible?.(false);
      cineTag.textContent = tag;
      cineTitle.textContent = title;
      cineSub.textContent = subtitle;
      cineCap.classList.remove('on');
      cineRoot.classList.add('on');
      activeCine = {
        id,
        duration: Math.max(2.0, duration),
        elapsed: 0,
        camFrom: camFrom ? new Vector3(camFrom[0], camFrom[1], camFrom[2]) : null,
        camTo: camTo ? new Vector3(camTo[0], camTo[1], camTo[2]) : null,
        lookAt: lookAt ? new Vector3(lookAt[0], lookAt[1], lookAt[2]) : null,
        lookAtEnd: lookAtEnd ? new Vector3(lookAtEnd[0], lookAtEnd[1], lookAtEnd[2]) : null,
        lines,
        lastLineIdx: -1,
        onComplete,
      };
      return true;
    }

    cineSkipBtn.addEventListener('click', () => stopCutscene(true));

    function setTracker({ active = false, label = '', value = '', detail = '', progress = 0, accent = '' } = {}) {
      const pct = Math.max(0, Math.min(100, Math.round(progress * 100)));
      const key = `${active ? 1 : 0}|${label}|${value}|${detail}|${pct}|${accent}`;
      if (key === lastTrackerKey) return;
      lastTrackerKey = key;
      trackerEl.className = 'sl-tracker' + (active ? ' on' : '') + (accent ? ' ' + accent : '');
      if (!active) return;
      trLbl.textContent = label;
      trVal.textContent = value || `${pct}%`;
      trFill.style.width = `${pct}%`;
      trSub.textContent = detail;
    }

    function placeTunerZone(tuner) {
      tuner.zoneStart = 0.14 + Math.random() * (0.72 - tuner.zoneWidth);
      tuZone.style.left = `${(tuner.zoneStart * 100).toFixed(1)}%`;
      tuZone.style.width = `${(tuner.zoneWidth * 100).toFixed(1)}%`;
    }

    function closeSignalTuner(cancelled = false) {
      if (!activeTuner) return;
      const t = activeTuner;
      activeTuner = null;
      tunerBg.classList.remove('on');
      if (world.player) world.player.enabled = true;
      if (cancelled) t.onCancel?.();
    }

    function openSignalTuner({
      title = '频谱解码', subtitle = '', locksNeeded = 3, speed = 1.05, zoneWidth = 0.20,
      onSuccess = null, onCancel = null,
    }) {
      if (activeTuner) return false;
      try { document.exitPointerLock?.(); } catch {}
      if (world.player) {
        world.player.enabled = false;
        if (world.player.vel) world.player.vel.set(0, 0, 0);
      }
      tuTitle.textContent = title;
      tuSub.textContent = subtitle;
      tuPips.innerHTML = '';
      const pips = [];
      for (let i = 0; i < locksNeeded; i++) {
        const el = document.createElement('div');
        el.className = 'sl-tuner-pip';
        tuPips.appendChild(el);
        pips.push(el);
      }
      tuStatus.className = 'sl-tuner-status';
      tuStatus.textContent = `指针进入金色频段时按 [空格] 或点击锁定（0/${locksNeeded}）`;
      activeTuner = {
        locksNeeded,
        locks: 0,
        pos: 0.08,
        dir: 1,
        speed,
        zoneWidth,
        zoneStart: 0.35,
        pips,
        finishing: false,
        onSuccess,
        onCancel,
      };
      placeTunerZone(activeTuner);
      tunerBg.classList.add('on');
      return true;
    }

    function attemptTunerLock() {
      if (!activeTuner || activeTuner.finishing) return;
      const t = activeTuner;
      const inZone = t.pos >= t.zoneStart - 0.025 && t.pos <= t.zoneStart + t.zoneWidth + 0.025;
      if (inZone) {
        t.pips[t.locks]?.classList.add('ok');
        t.locks++;
        audio?.play?.('rail_touchdown', { pos: world.player?.pos ?? new Vector3(), ref: 20, gain: .55, jitter: .04 });
        if (t.locks >= t.locksNeeded) {
          t.finishing = true;
          tuStatus.className = 'sl-tuner-status ok';
          tuStatus.textContent = '✅ 频段同步完成！信号已完全解码';
          const cb = t.onSuccess;
          setTimeout(() => {
            closeSignalTuner(false);
            cb?.();
          }, 420);
        } else {
          tuStatus.className = 'sl-tuner-status ok';
          tuStatus.textContent = `✓ 已锁定第 ${t.locks}/${t.locksNeeded} 频段，继续校准下一通道！`;
          t.speed = Math.min(1.65, t.speed + 0.14);
          placeTunerZone(t);
        }
      } else {
        tuStatus.className = 'sl-tuner-status err';
        tuStatus.textContent = `✕ 频段偏移！等待指针回到金色窗口再按 [空格]（已锁定 ${t.locks}/${t.locksNeeded}）`;
      }
    }

    tuLockBtn.addEventListener('click', attemptTunerLock);
    tuCancelBtn.addEventListener('click', () => closeSignalTuner(true));

    function onKeyDown(e) {
      if (activeTuner) {
        if (e.code === 'Space' && !e.repeat) {
          e.preventDefault();
          e.stopPropagation();
          attemptTunerLock();
        } else if (e.code === 'Escape' && !e.repeat) {
          e.preventDefault();
          e.stopPropagation();
          closeSignalTuner(true);
        }
        return;
      }
      if (activeCine && (e.code === 'Space' || e.code === 'Escape') && !e.repeat) {
        e.preventDefault();
        e.stopPropagation();
        stopCutscene(true);
      }
    }
    window.addEventListener('keydown', onKeyDown, true);

    function update(dt) {
      if (!(dt > 0)) return;
      if (activeTuner && !activeTuner.finishing) {
        activeTuner.pos += activeTuner.dir * activeTuner.speed * dt;
        if (activeTuner.pos >= 0.98) { activeTuner.pos = 0.98; activeTuner.dir = -1; }
        else if (activeTuner.pos <= 0.02) { activeTuner.pos = 0.02; activeTuner.dir = 1; }
        tuNeedle.style.left = `${(activeTuner.pos * 100).toFixed(2)}%`;
      }
      if (activeCine) {
        activeCine.elapsed += dt;
        const t = Math.min(1, activeCine.elapsed / activeCine.duration);
        const ease = t * t * (3 - 2 * t);
        if (world.camera && activeCine.camFrom && activeCine.camTo && activeCine.lookAt) {
          tmpCamPos.lerpVectors(activeCine.camFrom, activeCine.camTo, ease);
          world.camera.position.copy(tmpCamPos);
          if (activeCine.lookAtEnd) {
            tmpLookAt.lerpVectors(activeCine.lookAt, activeCine.lookAtEnd, ease);
            world.camera.lookAt(tmpLookAt);
          } else {
            world.camera.lookAt(activeCine.lookAt);
          }
        }
        let lineIdx = -1;
        for (let i = 0; i < activeCine.lines.length; i++) {
          if (activeCine.elapsed >= (activeCine.lines[i].at ?? 0)) lineIdx = i;
        }
        if (lineIdx !== activeCine.lastLineIdx) {
          activeCine.lastLineIdx = lineIdx;
          const entry = activeCine.lines[lineIdx];
          if (entry) {
            cineWho.textContent = (entry.speaker || 'SAR-04') + '：';
            cineWho.className = 'sl-cine-who' + (entry.tone ? ' ' + entry.tone : '');
            cineLine.textContent = entry.line || '';
            cineCap.classList.add('on');
          } else {
            cineCap.classList.remove('on');
          }
        }
        if (activeCine.elapsed >= activeCine.duration) stopCutscene(true);
      }
    }

    function resetPlayed() {
      playedCutscenes.clear();
    }

    function dispose() {
      window.removeEventListener('keydown', onKeyDown, true);
      stopCutscene(false);
      closeSignalTuner(false);
      cineRoot.remove();
      trackerEl.remove();
      tunerBg.remove();
    }

    return {
      playCutscene,
      stopCutscene,
      openSignalTuner,
      closeSignalTuner,
      setTracker,
      resetPlayed,
      update,
      dispose,
      get isPlayingCutscene() { return !!activeCine; },
      get isTunerOpen() { return !!activeTuner; },
    };
  };
})();
