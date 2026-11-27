/* Saltline Open-World Cinematic Cutscene Director, Interactive Signal Tuner,
 * NPC Face-to-Face Dialogue System, [J] Story Journal & Tactical Progress Tracker. */
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
      .sl-cine-caption{position:fixed;left:0;right:0;bottom:0;z-index:43;padding:42px 24px 28px;background:linear-gradient(180deg,rgba(6,9,15,0) 0%,rgba(6,9,15,.62) 42%,rgba(5,8,13,.94) 100%);color:#f5f7fa;font:500 clamp(15px,1.55vw,17px)/1.65 system-ui,-apple-system,sans-serif;text-align:center;opacity:0;transition:opacity .28s ease;pointer-events:none}
      .sl-cine-caption.on{opacity:1}
      .sl-cine-who{display:block;margin:0 0 6px;font:700 17px/1.2 system-ui,-apple-system,sans-serif;letter-spacing:.10em;color:#f3d284;text-shadow:0 2px 10px rgba(0,0,0,.95)}
      .sl-cine-who.hostile{color:#ff8f82}
      .sl-cine-who.rescue{color:#8be8b4}
      .sl-cine-line{display:inline-block;max-width:min(820px,88vw);text-shadow:0 2px 12px rgba(0,0,0,.95)}
      .sl-cine-skip{position:fixed;right:26px;top:24px;z-index:45;padding:7px 16px;border-radius:999px;border:1px solid rgba(255,255,255,.22);background:rgba(10,14,22,.62);backdrop-filter:blur(10px);color:#f4f0e2;font:600 12px/1.2 system-ui,sans-serif;letter-spacing:.08em;cursor:pointer;transition:all .18s ease}
      .sl-cine-skip:hover{background:rgba(243,210,132,.18);border-color:rgba(243,210,132,.75);color:#fff6dc}

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

      .sl-cod-stamp{position:fixed;left:28px;bottom:calc(12vh + 16px);z-index:44;pointer-events:none;font:700 13px/1.68 'SFMono-Regular',Menlo,Consolas,monospace;letter-spacing:.08em;color:#d6f5d6;text-shadow:0 1px 10px rgba(0,0,0,.95),0 0 12px rgba(92,224,148,.35);opacity:0;transform:translateY(8px);transition:opacity .35s ease,transform .35s ease}
      .sl-cod-stamp.on{opacity:1;transform:translateY(0)}
      .sl-cod-stamp-line{display:block;white-space:pre-wrap}
      .sl-cod-stamp-line:first-child{color:#f2c45a;font-size:14px;letter-spacing:.14em}

      /* Wuthering Waves (鸣潮)-Inspired Frameless Dialogue Stage & HUD Suppression */
      body.sl-dialogue-active #ui,
      body.sl-dialogue-active .sl-chud,
      body.sl-dialogue-active #sl-v2-waypoint,
      body.sl-dialogue-active .sl-minimap,
      body.sl-dialogue-active .sl-world-hud,
      body.sl-dialogue-active .sl-interact-prompt,
      body.sl-dialogue-active #sl-v2-npc-cmd{opacity:0!important;pointer-events:none!important;transition:opacity .22s ease}

      @keyframes sl-wuwa-pulse{0%,100%{transform:translateY(0);opacity:.72}50%{transform:translateY(4px);opacity:1}}
      .sl-dlg-bars{position:fixed;inset:0;z-index:46;pointer-events:none;opacity:0;transition:opacity .32s ease}
      .sl-dlg-bars.on{opacity:1}
      .sl-dlg-top-vignette{position:fixed;top:0;left:0;right:0;height:14vh;background:linear-gradient(180deg,rgba(5,8,13,.64) 0%,rgba(5,8,13,0) 100%);pointer-events:none}
      .sl-dlg-top-tools{position:fixed;top:22px;right:28px;z-index:52;display:flex;align-items:center;gap:10px;pointer-events:auto}
      .sl-dlg-tool-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:999px;background:rgba(10,15,24,.58);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.20);color:rgba(242,245,250,.92);font:600 12px/1 system-ui,-apple-system,sans-serif;letter-spacing:.06em;cursor:pointer;transition:all .18s ease}
      .sl-dlg-tool-btn:hover{background:rgba(243,210,132,.18);border-color:rgba(243,210,132,.76);color:#fff6dc}

      .sl-dlg-wrap{position:fixed;left:0;right:0;bottom:0;z-index:49;display:none;padding:64px 28px 26px;background:linear-gradient(180deg,rgba(6,9,15,0) 0%,rgba(6,9,15,.58) 38%,rgba(6,9,15,.88) 76%,rgba(5,8,13,.95) 100%);color:#f5f7fa;font-family:system-ui,-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;cursor:pointer;user-select:none}
      .sl-dlg-wrap.on{display:block}
      .sl-dlg-stage{max-width:min(820px,88vw);margin:0 auto;text-align:center;display:flex;flex-direction:column;align-items:center}
      .sl-dlg-who{font-size:19px;font-weight:700;color:#f3d284;letter-spacing:.10em;text-shadow:0 2px 12px rgba(0,0,0,.95);margin-bottom:3px}
      .sl-dlg-who.ally{color:#f3d284}
      .sl-dlg-who.hostile{color:#ff8f82}
      .sl-dlg-role{font-size:11.5px;font-weight:500;color:rgba(218,228,238,.68);letter-spacing:.14em;margin-bottom:8px;text-shadow:0 1px 6px rgba(0,0,0,.9)}
      .sl-dlg-hairline{width:min(300px,54vw);height:1px;background:linear-gradient(90deg,rgba(243,210,132,0) 0%,rgba(243,210,132,.68) 50%,rgba(243,210,132,0) 100%);margin:0 auto 12px}
      .sl-dlg-text{font-size:clamp(15.5px,1.55vw,17.5px);line-height:1.78;color:#f7f9fc;min-height:48px;margin:0 0 12px;text-shadow:0 2px 10px rgba(0,0,0,.96);max-width:760px}
      .sl-dlg-next-wrap{display:inline-flex;align-items:center;gap:8px;color:rgba(243,210,132,.86);font-size:11.5px;letter-spacing:.12em}
      .sl-dlg-diamond{display:inline-block;color:#f3d284;font-size:14px;animation:sl-wuwa-pulse 1.55s ease-in-out infinite;text-shadow:0 0 10px rgba(243,210,132,.75)}
      .sl-dlg-page{color:rgba(220,230,240,.54);font-size:11px;letter-spacing:.08em}

      .sl-dlg-choices{position:fixed;right:4.5vw;bottom:24vh;z-index:51;width:min(410px,46vw);display:none;flex-direction:column;gap:9px;pointer-events:auto}
      .sl-dlg-choices.on{display:flex}
      .sl-dlg-choice{position:relative;display:flex;align-items:center;gap:11px;width:100%;padding:11px 16px;background:linear-gradient(90deg,rgba(12,17,26,.84) 0%,rgba(12,17,26,.64) 72%,rgba(12,17,26,.16) 100%);backdrop-filter:blur(10px);border:none;border-top:1px solid rgba(255,255,255,.20);border-bottom:1px solid rgba(255,255,255,.16);border-left:2px solid rgba(243,210,132,.52);color:#f3f6fa;font:500 14px/1.4 system-ui,-apple-system,sans-serif;cursor:pointer;text-align:left;transition:transform .18s cubic-bezier(.22,1,.36,1),background .18s ease,border-color .18s ease;box-shadow:0 8px 24px rgba(0,0,0,.38)}
      .sl-dlg-choice:hover{transform:translateX(-8px);background:linear-gradient(90deg,rgba(243,210,132,.26) 0%,rgba(28,36,48,.78) 76%,rgba(12,17,26,.22) 100%);border-top-color:rgba(243,210,132,.82);border-bottom-color:rgba(243,210,132,.72);border-left-color:#f3d284;color:#fff8e6}
      .sl-dlg-choice-key{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:3px;background:rgba(255,255,255,.92);color:#0c111a;font:800 11.5px/1 system-ui,sans-serif;flex:none;box-shadow:0 1px 4px rgba(0,0,0,.45)}
      .sl-dlg-choice:hover .sl-dlg-choice-key{background:#f3d284;color:#0b1018}
      .sl-dlg-choice-ico{width:16px;height:16px;flex:none;opacity:.88;color:#f3d284}
      .sl-dlg-choice-txt{flex:1;text-shadow:0 1px 4px rgba(0,0,0,.85)}
      .sl-dlg-btn{padding:8px 16px;border:1px solid rgba(243,210,132,.55);background:#c89835;color:#0b1114;font:800 13px/1 system-ui,sans-serif;cursor:pointer}
      .sl-dlg-btn.ghost{background:rgba(16,22,32,.78);color:#dbe8ee;border-color:rgba(255,255,255,.24)}

      .sl-journal-bg{position:fixed;inset:0;z-index:49;display:none;align-items:center;justify-content:center;background:rgba(5,10,14,.78);backdrop-filter:blur(4px);font-family:system-ui,-apple-system,sans-serif}
      .sl-journal-bg.on{display:flex}
      .sl-journal-card{width:min(680px,92vw);max-height:82vh;display:flex;flex-direction:column;background:#0e171e;border:1px solid rgba(110,210,240,.45);border-top:3px solid #f2c45a;color:#eef5f7;padding:20px 22px;box-shadow:0 20px 56px rgba(0,0,0,.78)}
      .sl-journal-brief{background:rgba(26,44,56,.62);border-left:3px solid #f2c45a;padding:11px 14px;margin:10px 0 14px;font-size:13.5px;line-height:1.65;color:#e6f2f6}
      .sl-journal-list{overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:8px;padding-right:4px;margin-bottom:14px}
      .sl-journal-item{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);padding:8px 11px;font-size:13px;line-height:1.55}
      .sl-journal-item b{color:#7ee4ff;margin-right:6px}
      @media (max-width:760px){.sl-tracker{top:calc(206px + var(--sat, 0px));width:min(280px,68vw)}.sl-cod-stamp{left:14px;bottom:10vh;font-size:11px}}
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
        <div class="sl-tuner-status">指针进入金色频段时按 [空格] 或 [E] 锁定</div>
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

    // 4. Call of Duty Tactical Typewriter Mission Stamp DOM
    const stampEl = document.createElement('div');
    stampEl.className = 'sl-cod-stamp';
    document.body.appendChild(stampEl);
    let stampTimer = null, stampFadeTimer = null;

    // 5. Interactive NPC Face-to-Face Dialogue (Wuthering Waves Frameless Vignette + Floating Ribbons)
    const dlgBars = document.createElement('div');
    dlgBars.className = 'sl-dlg-bars';
    dlgBars.innerHTML = `
      <div class="sl-dlg-top-vignette"></div>
      <div class="sl-dlg-top-tools">
        <button type="button" class="sl-dlg-tool-btn" data-dlg-log><span>记录</span><span style="opacity:.6">[J]</span></button>
        <button type="button" class="sl-dlg-tool-btn" data-dlg-close><span>离开</span><span style="opacity:.6">[ESC]</span></button>
      </div>
    `;
    document.body.appendChild(dlgBars);

    let dlgKeyLight = null;
    if (world.THREE?.PointLight && world.scene) {
      dlgKeyLight = new world.THREE.PointLight(0xfff1dc, 0, 6.2, 1.5);
      world.scene.add(dlgKeyLight);
    }
    const tmpDlgHead = world.THREE ? new world.THREE.Vector3() : null;
    const tmpDlgFwd = world.THREE ? new world.THREE.Vector3() : null;
    const tmpDlgRight = world.THREE ? new world.THREE.Vector3() : null;
    const tmpDlgCamCur = world.THREE ? new world.THREE.Vector3() : null;
    const tmpDlgLookCur = world.THREE ? new world.THREE.Vector3() : null;
    const tmpDlgSway = world.THREE ? new world.THREE.Vector3() : null;

    const dlgWrap = document.createElement('div');
    dlgWrap.className = 'sl-dlg-wrap';
    dlgWrap.innerHTML = `
      <div class="sl-dlg-stage">
        <div class="sl-dlg-who"></div>
        <div class="sl-dlg-role"></div>
        <div class="sl-dlg-hairline"></div>
        <p class="sl-dlg-text"></p>
        <div class="sl-dlg-next-wrap">
          <span class="sl-dlg-diamond">✦</span>
          <span class="sl-dlg-page"></span>
        </div>
      </div>
    `;
    document.body.appendChild(dlgWrap);
    const dlgChoices = document.createElement('div');
    dlgChoices.className = 'sl-dlg-choices';
    document.body.appendChild(dlgChoices);
    const dlgWho = dlgWrap.querySelector('.sl-dlg-who');
    const dlgRole = dlgWrap.querySelector('.sl-dlg-role');
    const dlgPage = dlgWrap.querySelector('.sl-dlg-page');
    const dlgText = dlgWrap.querySelector('.sl-dlg-text');
    const dlgLogBtn = dlgBars.querySelector('[data-dlg-log]');
    const dlgCloseBtn = dlgBars.querySelector('[data-dlg-close]');

    // 6. Story Case Journal & Dialogue History Drawer ([J])
    const journalBg = document.createElement('div');
    journalBg.className = 'sl-journal-bg';
    journalBg.innerHTML = `
      <div class="sl-journal-card">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div><div style="font-size:11px;font-weight:800;letter-spacing:.18em;color:#f2c45a;">SAR-04 · 《失联名单》案情日志</div><h3 style="margin:4px 0 0;font-size:20px;" data-j-title></h3></div>
          <button type="button" class="sl-dlg-btn ghost" data-j-close>关闭 [J / Esc]</button>
        </div>
        <div class="sl-journal-brief" data-j-brief></div>
        <div style="font-size:12px;font-weight:700;color:#9cb8c4;margin-bottom:6px;">电台与 NPC 访谈记录（随时按 [J] 回看）</div>
        <div class="sl-journal-list" data-j-list></div>
      </div>
    `;
    document.body.appendChild(journalBg);
    const jTitle = journalBg.querySelector('[data-j-title]');
    const jBrief = journalBg.querySelector('[data-j-brief]');
    const jList = journalBg.querySelector('[data-j-list]');
    const jCloseBtn = journalBg.querySelector('[data-j-close]');

    function clearCodStamp() {
      clearInterval(stampTimer); clearTimeout(stampFadeTimer);
      stampTimer = stampFadeTimer = null;
      stampEl.classList.remove('on');
    }

    function showCodStamp(lines = [], holdMs = 7200) {
      if (!Array.isArray(lines) || !lines.length || document.body.classList.contains('audit-clean')) return;
      clearCodStamp();
      stampEl.innerHTML = '';
      const els = lines.map(() => {
        const s = document.createElement('span');
        s.className = 'sl-cod-stamp-line';
        stampEl.appendChild(s);
        return s;
      });
      stampEl.classList.add('on');
      let li = 0, ci = 0;
      stampTimer = setInterval(() => {
        if (li >= lines.length) {
          clearInterval(stampTimer); stampTimer = null;
          stampFadeTimer = setTimeout(() => stampEl.classList.remove('on'), holdMs);
          return;
        }
        const target = lines[li];
        ci += 2;
        els[li].textContent = target.slice(0, ci) + (ci < target.length ? '▌' : '');
        if (ci >= target.length) { li++; ci = 0; }
      }, 32);
    }

    // State
    let activeCine = null;
    let savedPlayerEnabled = true;
    let savedPlayerInvuln = false;
    const tmpCamPos = new Vector3();
    const tmpLookAt = new Vector3();
    const playedCutscenes = new Set();

    let activeTuner = null;
    let activeDialogue = null;
    let journalOpen = false;
    const storyLog = [];
    let lastTrackerKey = '';

    function recordStoryEntry(speaker, line) {
      if (!line) return;
      const cleanWho = String(speaker || 'SAR-04').trim();
      const cleanLine = String(line).trim();
      const last = storyLog[storyLog.length - 1];
      if (last && last.speaker === cleanWho && last.line === cleanLine) return;
      storyLog.push({ speaker: cleanWho, line: cleanLine });
      if (storyLog.length > 40) storyLog.shift();
    }

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
      duration = 9.0, camFrom, camTo, lookAt, lookAtEnd = null,
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
      for (const ln of lines) recordStoryEntry(ln.speaker, ln.line);
      // Give players comfortable reading time (min 8.5s, still skippable via Space anytime)
      const slowDuration = Math.max(8.5, duration * 1.45);
      const scaledLines = lines.map((ln, idx) => ({
        ...ln,
        at: idx === 0 ? Math.max(0.4, ln.at ?? 0.4) : Math.max(4.4 * idx, (ln.at ?? 0) * 1.45),
      }));
      activeCine = {
        id,
        duration: slowDuration,
        elapsed: 0,
        camFrom: camFrom ? new Vector3(camFrom[0], camFrom[1], camFrom[2]) : null,
        camTo: camTo ? new Vector3(camTo[0], camTo[1], camTo[2]) : null,
        lookAt: lookAt ? new Vector3(lookAt[0], lookAt[1], lookAt[2]) : null,
        lookAtEnd: lookAtEnd ? new Vector3(lookAtEnd[0], lookAtEnd[1], lookAtEnd[2]) : null,
        lines: scaledLines,
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
      try { world.input?.requestLock?.(); } catch {}
      if (cancelled) t.onCancel?.();
    }

    function openSignalTuner({
      title = '频谱解码', subtitle = '', locksNeeded = 3, speed = 1.05, zoneWidth = 0.20,
      onSuccess = null, onCancel = null,
    }) {
      if (activeTuner) return false;
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
      tuStatus.textContent = `指针进入金色频段时按 [空格] / [E] 或点击锁定（0/${locksNeeded}）`;
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
      try { document.exitPointerLock?.(); } catch {}
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

    function computeDialogueShot(d, shotIndex = 0) {
      if (!d || !world.THREE || (!d.npcHuman && !d.npcActor)) return false;
      const head = tmpDlgHead;
      if (d.npcHuman?.getHeadWorldPos) {
        d.npcHuman.getHeadWorldPos(head);
      } else if (d.npcActor?.getWorldPosition) {
        d.npcActor.updateMatrixWorld(true);
        d.npcActor.getWorldPosition(head);
        head.y += 1.56;
      } else {
        return false;
      }
      let yaw = d.npcActor?.rotation?.y ?? 0;
      if (world.player?.pos && d.npcActor?.getWorldPosition) {
        const actorPos = d.npcActor.getWorldPosition(tmpDlgFwd);
        yaw = Math.atan2(world.player.pos.x - actorPos.x, world.player.pos.z - actorPos.z);
      }
      tmpDlgFwd.set(Math.sin(yaw), 0, Math.cos(yaw)).normalize();
      tmpDlgRight.set(tmpDlgFwd.z, 0, -tmpDlgFwd.x).normalize();
      const side = (shotIndex % 2 === 0) ? 1 : -1;
      const dist = (shotIndex % 3 === 1) ? 1.44 : 1.62;
      const lat = side * 0.34;
      const camY = (shotIndex % 3 === 2) ? head.y + 0.04 : head.y - 0.03;
      d.camTarget.set(
        head.x + tmpDlgFwd.x * dist + tmpDlgRight.x * lat,
        camY,
        head.z + tmpDlgFwd.z * dist + tmpDlgRight.z * lat
      );
      // Frame NPC eyes cleanly in upper-middle third above dialogue box
      d.lookTarget.set(
        head.x - tmpDlgRight.x * (side * 0.07),
        head.y - 0.10,
        head.z - tmpDlgRight.z * (side * 0.07)
      );
      if (dlgKeyLight) {
        dlgKeyLight.position.set(
          head.x + tmpDlgFwd.x * 1.15 - tmpDlgRight.x * (side * 0.65),
          head.y + 0.48,
          head.z + tmpDlgFwd.z * 1.15 - tmpDlgRight.z * (side * 0.65)
        );
      }
      return true;
    }

    function selectDialogueChoice(idx) {
      if (!activeDialogue || activeDialogue.replyText) return false;
      const d = activeDialogue;
      const isLast = d.page >= d.pages.length - 1;
      if (!isLast || !Array.isArray(d.choices) || !d.choices[idx]) return false;
      const ch = d.choices[idx];
      recordStoryEntry(d.speaker, ch.reply);
      activeDialogue.replyText = ch.reply;
      activeDialogue.shotIndex = (activeDialogue.shotIndex || 0) + 1;
      computeDialogueShot(activeDialogue, activeDialogue.shotIndex);
      ch.onSelect?.();
      renderDialogue();
      return true;
    }

    function renderDialogue() {
      if (!activeDialogue) return;
      const d = activeDialogue;
      dlgWho.textContent = d.speaker;
      dlgWho.className = 'sl-dlg-who' + (d.tone ? ' ' + d.tone : '');
      dlgRole.textContent = d.role || '';
      dlgRole.style.display = d.role ? 'block' : 'none';
      if (d.replyText) {
        dlgPage.textContent = '点击或按 [Space] 返回';
        dlgText.textContent = d.replyText;
        dlgChoices.innerHTML = '';
        dlgChoices.classList.remove('on');
        return;
      }
      const total = d.pages.length;
      const isLast = d.page >= total - 1;
      dlgText.textContent = d.pages[d.page] || '';
      dlgChoices.innerHTML = '';
      if (isLast && Array.isArray(d.choices) && d.choices.length) {
        d.choices.forEach((ch, idx) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'sl-dlg-choice';
          btn.innerHTML = `
            <span class="sl-dlg-choice-key">${idx + 1}</span>
            <svg class="sl-dlg-choice-ico" viewBox="0 0 20 20" fill="currentColor"><path d="M3 4.5A2.5 2.5 0 0 1 5.5 2h9A2.5 2.5 0 0 1 17 4.5v6A2.5 2.5 0 0 1 14.5 13H9.2l-3.4 2.7A.75.75 0 0 1 4.6 15v-2.1A2.5 2.5 0 0 1 3 10.5v-6Z"/></svg>
            <span class="sl-dlg-choice-txt"></span>
          `;
          btn.querySelector('.sl-dlg-choice-txt').textContent = ch.label;
          btn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            selectDialogueChoice(idx);
          });
          dlgChoices.appendChild(btn);
        });
        dlgChoices.classList.add('on');
        dlgPage.textContent = `${d.page + 1} / ${total} · 按 [1-${d.choices.length}] 选择或点击继续`;
      } else {
        dlgChoices.classList.remove('on');
        dlgPage.textContent = isLast ? `${d.page + 1} / ${total} · 点击或按 [Space] 结束` : `${d.page + 1} / ${total}`;
      }
    }

    function closeDialogue() {
      if (!activeDialogue) return;
      const d = activeDialogue;
      const cb = d.onComplete;
      activeDialogue = null;
      document.body.classList.remove('sl-dialogue-active');
      dlgWrap.classList.remove('on');
      dlgBars.classList.remove('on');
      dlgChoices.classList.remove('on');
      if (dlgKeyLight) dlgKeyLight.intensity = 0;
      if (d.hasCam && world.camera) {
        if (d.savedPos && world.camera.position?.copy) world.camera.position.copy(d.savedPos);
        if (d.savedQuat && world.camera.quaternion?.copy) world.camera.quaternion.copy(d.savedQuat);
        if (Number.isFinite(d.savedFov) && world.camera.fov !== d.savedFov) {
          world.camera.fov = d.savedFov;
          world.camera.updateProjectionMatrix?.();
        }
      }
      if (d.weaponRoot && d.savedWeaponVis !== null) d.weaponRoot.visible = d.savedWeaponVis;
      if (world.player) {
        world.player.enabled = true;
        if (d.savedInvuln !== null) world.player.invulnerable = d.savedInvuln;
      }
      try { world.input?.requestLock?.(); } catch {}
      cb?.();
    }

    function openDialogue({ speaker = 'NPC', role = '', tone = 'ally', pages = [], choices = [], npcActor = null, npcHuman = null, onComplete = null } = {}) {
      if (activeDialogue || activeTuner || !pages.length) return false;
      const savedInvuln = world.player ? !!world.player.invulnerable : null;
      if (world.player) {
        world.player.enabled = false;
        world.player.invulnerable = true;
        if (world.player.vel) world.player.vel.set(0, 0, 0);
      }
      const weaponRoot = world.weapon?.root || world.sidearm?.root || null;
      const savedWeaponVis = weaponRoot ? weaponRoot.visible : null;
      if (weaponRoot) weaponRoot.visible = false;
      for (const p of pages) recordStoryEntry(speaker, p);
      const camTarget = world.THREE ? new world.THREE.Vector3() : null;
      const lookTarget = world.THREE ? new world.THREE.Vector3() : null;
      const d = {
        speaker, role, tone, pages, choices, page: 0, replyText: null, onComplete,
        npcActor, npcHuman, shotIndex: 0, elapsed: 0, hasCam: false,
        camTarget, lookTarget,
        savedPos: world.camera?.position?.clone?.() || null,
        savedQuat: world.camera?.quaternion?.clone?.() || null,
        savedFov: world.camera?.fov,
        savedInvuln, weaponRoot, savedWeaponVis,
      };
      if (world.camera && computeDialogueShot(d, 0)) {
        d.hasCam = true;
        if (tmpDlgCamCur && world.camera.position) tmpDlgCamCur.copy(world.camera.position);
        if (tmpDlgLookCur) {
          if (world.camera.quaternion && world.camera.position) {
            const fwd = new world.THREE.Vector3(0, 0, -1).applyQuaternion(world.camera.quaternion);
            tmpDlgLookCur.copy(world.camera.position).addScaledVector(fwd, 2.2);
          } else {
            tmpDlgLookCur.copy(d.lookTarget);
          }
        }
      }
      activeDialogue = d;
      document.body.classList.add('sl-dialogue-active');
      renderDialogue();
      dlgWrap.classList.add('on');
      dlgBars.classList.add('on');
      try { document.exitPointerLock?.(); } catch {}
      return true;
    }

    function advanceDialogue() {
      if (!activeDialogue) return;
      if (activeDialogue.replyText) {
        activeDialogue.replyText = null;
        activeDialogue.shotIndex = (activeDialogue.shotIndex || 0) + 1;
        computeDialogueShot(activeDialogue, activeDialogue.shotIndex);
        renderDialogue();
        return;
      }
      if (activeDialogue.page + 1 < activeDialogue.pages.length) {
        activeDialogue.page++;
        activeDialogue.shotIndex = (activeDialogue.shotIndex || 0) + 1;
        computeDialogueShot(activeDialogue, activeDialogue.shotIndex);
        renderDialogue();
      } else {
        closeDialogue();
      }
    }

    dlgWrap.addEventListener('click', advanceDialogue);
    dlgCloseBtn.addEventListener('click', (ev) => { ev.stopPropagation(); closeDialogue(); });
    dlgLogBtn.addEventListener('click', (ev) => { ev.stopPropagation(); toggleJournal(true); });

    function toggleJournal(force, { title = '当前案情简报', brief = '' } = {}) {
      const next = force !== undefined ? Boolean(force) : !journalOpen;
      journalOpen = next;
      if (!journalOpen) {
        journalBg.classList.remove('on');
        if (world.player && !activeDialogue && !activeTuner && !activeCine) world.player.enabled = true;
        try { world.input?.requestLock?.(); } catch {}
        return false;
      }
      if (world.player) {
        world.player.enabled = false;
        if (world.player.vel) world.player.vel.set(0, 0, 0);
      }
      jTitle.textContent = title;
      jBrief.textContent = brief || '沿着左侧目标指引推进主线，或靠近港区任意 NPC 按 [E] 对话了解《失联名单》背后的来龙去脉。';
      jList.innerHTML = storyLog.length
        ? storyLog.slice().reverse().map(it => `<div class="sl-journal-item"><b>${String(it.speaker).replace(/[<>&]/g, '')}：</b>${String(it.line).replace(/[<>&]/g, '')}</div>`).join('')
        : '<div class="sl-journal-item">暂无通话记录，靠近码头老霍克或推进任务后将自动记录全部对白。</div>';
      journalBg.classList.add('on');
      try { document.exitPointerLock?.(); } catch {}
      return true;
    }

    jCloseBtn.addEventListener('click', () => toggleJournal(false));

    function onKeyDown(e) {
      if (journalOpen) {
        if ((e.code === 'Escape' || e.code === 'KeyJ') && !e.repeat) {
          e.preventDefault();
          e.stopImmediatePropagation();
          toggleJournal(false);
        }
        return;
      }
      if (activeDialogue) {
        if (/^Digit[1-4]$/.test(e.code) && !e.repeat) {
          const idx = Number(e.code.slice(5)) - 1;
          if (selectDialogueChoice(idx)) {
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
          }
        }
        if ((e.code === 'Space' || e.code === 'KeyE' || e.code === 'KeyF') && !e.repeat) {
          e.preventDefault();
          e.stopImmediatePropagation();
          advanceDialogue();
        } else if (e.code === 'KeyJ' && !e.repeat) {
          e.preventDefault();
          e.stopImmediatePropagation();
          toggleJournal(true);
        } else if (e.code === 'Escape' && !e.repeat) {
          e.preventDefault();
          e.stopImmediatePropagation();
          closeDialogue();
        }
        return;
      }
      if (activeTuner) {
        if ((e.code === 'Space' || e.code === 'KeyE') && !e.repeat) {
          e.preventDefault();
          e.stopImmediatePropagation();
          attemptTunerLock();
        } else if (e.code === 'Escape' && !e.repeat) {
          e.preventDefault();
          e.stopImmediatePropagation();
          closeSignalTuner(true);
        }
        return;
      }
      if (activeCine && (e.code === 'Space' || e.code === 'Escape') && !e.repeat) {
        e.preventDefault();
        e.stopImmediatePropagation();
        stopCutscene(true);
      }
    }
    window.addEventListener('keydown', onKeyDown, true);

    function update(dt) {
      if (!(dt > 0)) return;
      if (activeDialogue && activeDialogue.hasCam && world.camera && tmpDlgCamCur && tmpDlgLookCur) {
        activeDialogue.elapsed += dt;
        computeDialogueShot(activeDialogue, activeDialogue.shotIndex);
        const smooth = 1 - Math.exp(-Math.min(dt, 0.08) * 5.4);
        tmpDlgCamCur.lerp(activeDialogue.camTarget, smooth);
        tmpDlgLookCur.lerp(activeDialogue.lookTarget, smooth);
        const t = activeDialogue.elapsed;
        tmpDlgSway.set(Math.sin(t * 0.95) * 0.014, Math.cos(t * 1.25) * 0.010, Math.sin(t * 0.7) * 0.008);
        world.camera.position.copy(tmpDlgCamCur).add(tmpDlgSway);
        world.camera.lookAt(tmpDlgLookCur);
        if (Number.isFinite(world.camera.fov)) {
          const nextFov = world.camera.fov + (44 - world.camera.fov) * smooth;
          if (Math.abs(nextFov - world.camera.fov) > 0.02) {
            world.camera.fov = nextFov;
            world.camera.updateProjectionMatrix?.();
          }
        }
        if (dlgKeyLight) {
          dlgKeyLight.intensity += (1.45 - dlgKeyLight.intensity) * smooth;
        }
      }
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
      clearCodStamp();
      stopCutscene(false);
      closeSignalTuner(false);
      closeDialogue();
      toggleJournal(false);
      if (dlgKeyLight) dlgKeyLight.removeFromParent();
      cineRoot.remove();
      trackerEl.remove();
      tunerBg.remove();
      stampEl.remove();
      document.body.classList.remove('sl-dialogue-active');
      dlgBars.remove();
      dlgWrap.remove();
      dlgChoices.remove();
      journalBg.remove();
    }

    return {
      playCutscene,
      stopCutscene,
      openSignalTuner,
      closeSignalTuner,
      openDialogue,
      closeDialogue,
      recordStoryEntry,
      toggleJournal,
      setTracker,
      showCodStamp,
      clearCodStamp,
      resetPlayed,
      update,
      dispose,
      get isPlayingCutscene() { return !!activeCine; },
      get isTunerOpen() { return !!activeTuner; },
      get isDialogueOpen() { return !!activeDialogue; },
      get isJournalOpen() { return !!journalOpen; },
    };
  };
})();
