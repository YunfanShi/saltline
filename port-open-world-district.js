/* Saltline Realistic Coastal City Open World & 8-Act 《失联名单》 Campaign.
 * Strict Coastal Geography (ZERO buildings in the East Sea x > +26!):
 *   - Real Coastline: x = +26 running North–South. East of x = +26 is 100% PURE OPEN EAST SEA.
 *   - All 7 Districts sit on ONE contiguous inland landmass (x: -225..+26, z: -225..+148):
 *       01 Berth 4 Core Harbor         (x: -107..+26,  z:  -30..+28)  [Original weathered PBR core]
 *       02 Coastal City & Promenade    (x: -107..+24,  z: -145..-30)  [Urban blocks + x=+24 seafront]
 *       03 Mountain Comms (+14m)       (x: -220..-110, z: -120..-35)  [Inland west ridge overlooking sea!]
 *       04 Coastal Emergency Airfield  (x: -220..-110, z: -225..-120) [NW plateau, runway, hangar, ATC]
 *       05 West Rail Freight Yard      (x: -220..-107, z:  -35..+35)  [Seamless west extension of Berth 4]
 *       06 South Drydock & Lighthouse  (x: -107..+24,  z:  +28..+145) [Peninsula drydock + 22m headland lighthouse]
 *       07 SW Cold-Storage & Clinic    (x: -220..-107, z:  +35..+145) [Industrial cryo depot + 2F triage clinic]
 *   - Road Grid (Two Vertical + Three Horizontal, ZERO floating sea roads):
 *       V1: Coastal Blvd (x = -26)  |  V2: West Inland Ave (x = -112)
 *       H1: North Blvd (z = -125)   |  H2: West Gate Freight Rd (z = +5)  |  H3: South Harbor Rd (z = +42)
 *   - Realistic Weathered PBR Aesthetic (matches Berth 4, no cartoony blocks) + Interactive [E] Doors,
 *     Medical Triage, Ammo Lockers, Stealth Indicator, 8-Act 《失联名单》 Campaign & Free-Roam Sightseeing. */
(() => {
  const OPEN_WORLD_STORAGE_KEY = 'saltline.openworld.campaign.v1';
  const OPEN_WORLD_ACTS = Object.freeze([
    {
      id: 'ow-0', stage: 0, art: './art/campaign-berth.jpg',
      title: ['Act I · The 05:31 Blackout', '第一幕 · 05:31 停电疑云'],
      description: [
        'Triangulate and decode the hidden Anvil black-box at Berth 4, uncover the 17 missing Petrel crewmen, and break the jammer lockdown.',
        '在四号泊位追踪加密信标并解码黑匣子，揭开「海燕号」17 名船员被扣真相，摧毁 2 座干扰塔冲破封锁。'
      ]
    },
    {
      id: 'ow-1', stage: 1, art: './art/campaign-return-harbor.jpg',
      title: ['Act II · Precinct Archive Heist', '第二幕 · 沿海大道冲卡与警务调档'],
      description: [
        'Smash Anvil’s Coastal Boulevard roadblock in the SAR 4x4, then hold the Coastal Precinct Dispatch for 14s to mirror the crew transfer logs.',
        '驾驶 SAR 四驱车高速撞穿沿海大道封锁线，突入警务调度楼坚守 14 秒镜像下载船员转运档案。'
      ]
    },
    {
      id: 'ow-2', stage: 2, art: './art/campaign-night-record.jpg',
      title: ['Act III · The Seventeenth Name', '第三幕 · 西南冷雾库与第 17 人真相'],
      description: [
        'Follow the cold-chain manifest south, blow the cryo-locks in a lightning storm, and restore Thomas Vance’s damaged recorder at the clinic.',
        '顺着冷链运单南下西南冷雾库，在雷暴中破除锁控箱，并于战地诊所修复托马斯受损的录音芯片。'
      ]
    },
    {
      id: 'ow-3', stage: 3, art: './art/campaign-rail.jpg',
      title: ['Act IV · Halting the Manifest Train', '第四幕 · 西区铁路货场死线截车'],
      description: [
        'Blow two marshalling signal breakers to halt Anvil’s evidence train, then scan the manifest cars under fire to complete the 17-name dossier.',
        '炸毁西区铁路两处信号主控闸迫停证物专列，随后在车厢旁完成 12 秒货单扫描取证，集齐完整《失联名单》。'
      ]
    },
    {
      id: 'ow-4', stage: 4, art: './art/campaign-last-pilot.jpg',
      title: ['Act V · Hijacking the Maritime Broadcast', '第五幕 · 西岸山顶夺取全城广播'],
      description: [
        'Snipe three satellite cooling cores on the +14m ridge, tune the maritime frequency, and hold the uplink for 10s to expose Reed and Ward.',
        '登顶 +14m 西岸雷达站狙击 3 个散热芯，手动校准海事卫星频段并守住上行链路 10 秒，向全城广播铁证。'
      ]
    },
    {
      id: 'ow-5', stage: 5, art: './art/campaign-tidegate.jpg',
      title: ['Act VI · Zero-Hour Floodgate', '第六幕 · 零号泄洪与海啸坚守'],
      description: [
        'Ward detonated the South Tide Gate to erase the port. Survive 15 seconds on the +14m ridge as the 12m surge strikes and contact the rescue fleet.',
        '沃德狗急跳墙引爆南防潮闸！在 +14m 山顶死守 15 秒熬过 12 米东海巨浪，并接通雾墙外的东海救援舰队。'
      ]
    },
    {
      id: 'ow-6', stage: 6, art: './art/campaign-drydock.jpg',
      title: ['Act VII · Beacon Through the Fog', '第七幕 · 南港船坞炮火点灯'],
      description: [
        'Push through coastal artillery to clear two lighthouse power jammers, then calibrate the 22m optical lens to guide the rescue fleet into harbor.',
        '穿越炮火覆盖清除南港 2 座电源干扰器，随后手动校准 22 米岸角灯塔光学透镜，为救援舰队破雾引航。'
      ]
    },
    {
      id: 'ow-7', stage: 7, art: './art/campaign-reopen.jpg',
      title: ['Act VIII · Airfield Fuel & Blackbox', '第八幕 · 海岸应急机场油料与黑匣子夺取'],
      description: [
        'Race north under runway artillery to the NW Coastal Airfield hangar to secure the SAR fuel manifest and flight recorder.',
        '顶着跑道重炮与战机拦截冲入西北机场拱形机库，夺回搜救机燃油舱单与飞行记录仪。'
      ]
    },
    {
      id: 'ow-8', stage: 8, art: './art/campaign-anchorage.jpg',
      title: ['Act IX · Outer Anchorage Evacuation', '第九幕 · 外海锚地与码头疏散'],
      description: [
        'Return to South Quay to knock out two Anvil boarding jammers and hold the gangway perimeter while trapped Petrel crew evacuate.',
        '折返南港码头摧毁 2 座登船干扰器，并守住舷梯撤离走廊 10 秒掩护被困船员登艇。'
      ]
    },
    {
      id: 'ow-9', stage: 9, art: './art/campaign-night-record.jpg',
      title: ['Act X · Night Shift Precinct Lockdown', '第十幕 · 深夜档案封锁与反攻'],
      description: [
        'Break back into Precinct 04 under an Anvil counter-raid, decrypt Ward’s offshore ledger, and hold the precinct uplink.',
        '在铁砧反扑中重返沿海警务 04 号站，破译沃德离岸资金总账并坚守警务上行链路。'
      ]
    },
    {
      id: 'ow-10', stage: 10, art: './art/campaign-last-pilot.jpg',
      title: ['Act XI · Last Pilot Highway Escort', '第十一幕 · 最后引航与海岸公路护送'],
      description: [
        'Clear two Anvil SAM pods along North Coastal Boulevard and escort the final rescue convoy to the airfield approach.',
        '沿北段沿海大道摧毁 2 座铁砧防空导弹发射架，护送最后一批搜救车队冲抵机场跑道入口。'
      ]
    },
    {
      id: 'ow-11', stage: 11, art: './art/campaign-reopen.jpg',
      title: ['Act XII · Open Water Dawn', '第十二幕 · 晴海启航与真相尾声'],
      description: [
        'As dawn breaks over a cleared Saltline Harbor, board the SAR transport at the airfield hangar to seal the Missing Manifest case.',
        '风暴散尽、晨光照亮盐线港，登上机场拱形机库的救援运输机，见证你的抉择所改写的海港结局。'
      ]
    }
  ]);

  function createOpenWorldCampaignProgress(storage = typeof localStorage !== 'undefined' ? localStorage : null) {
    const clampStage = n => (Number.isInteger(n) && n >= 0 && n < OPEN_WORLD_ACTS.length) ? n : -1;
    const stageOf = id => {
      if (typeof id === 'number') return clampStage(id);
      if (typeof id === 'string') {
        const m = /^ow-(\d+)$/.exec(id);
        if (m) return clampStage(Number(m[1]));
      }
      return -1;
    };
    const read = () => {
      try {
        const raw = storage?.getItem?.(OPEN_WORLD_STORAGE_KEY);
        if (!raw) return { unlocked: 0, completed: [] };
        const parsed = JSON.parse(raw);
        const completed = Array.from(new Set((Array.isArray(parsed?.completed) ? parsed.completed : []).map(clampStage).filter(i => i >= 0))).sort((a, b) => a - b);
        const maxCompletedNext = completed.length ? Math.min(OPEN_WORLD_ACTS.length - 1, completed[completed.length - 1] + 1) : 0;
        const unlocked = Math.max(0, Math.min(OPEN_WORLD_ACTS.length - 1, Number.isInteger(parsed?.unlocked) ? parsed.unlocked : 0, OPEN_WORLD_ACTS.length - 1), maxCompletedNext);
        return { unlocked, completed };
      } catch {
        return { unlocked: 0, completed: [] };
      }
    };
    const write = state => {
      try { storage?.setItem?.(OPEN_WORLD_STORAGE_KEY, JSON.stringify(state)); } catch {}
    };
    const nextStageIndex = state => {
      for (let i = 0; i < OPEN_WORLD_ACTS.length; i++) {
        if (!state.completed.includes(i)) return Math.min(i, state.unlocked);
      }
      return OPEN_WORLD_ACTS.length;
    };
    return {
      acts: OPEN_WORLD_ACTS,
      stageOf,
      get unlocked() { return read().unlocked; },
      get completed() { return read().completed; },
      get completedCount() { return read().completed.length; },
      get nextIndex() { return nextStageIndex(read()); },
      get next() {
        const idx = nextStageIndex(read());
        return idx < OPEN_WORLD_ACTS.length ? `ow-${idx}` : null;
      },
      status(id) {
        const idx = stageOf(id);
        if (idx < 0) return 'locked';
        const state = read();
        if (state.completed.includes(idx)) return 'complete';
        const nextIdx = nextStageIndex(state);
        if (idx === nextIdx) return 'next';
        if (idx <= state.unlocked) return 'available';
        return 'locked';
      },
      completeStage(id) {
        const idx = stageOf(id);
        if (idx < 0) return read();
        const state = read();
        if (!state.completed.includes(idx)) state.completed = [...state.completed, idx].sort((a, b) => a - b);
        state.unlocked = Math.max(state.unlocked, Math.min(OPEN_WORLD_ACTS.length - 1, idx + 1));
        write(state);
        return state;
      },
      unlockUpTo(id) {
        const idx = stageOf(id);
        if (idx < 0) return read();
        const state = read();
        state.unlocked = Math.max(state.unlocked, idx);
        write(state);
        return state;
      },
      reset() {
        const state = { unlocked: 0, completed: [] };
        write(state);
        return state;
      },
    };
  }

  if (typeof window !== 'undefined') {
    window.SaltlineOpenWorldActs = OPEN_WORLD_ACTS;
    window.createOpenWorldCampaignProgress = createOpenWorldCampaignProgress;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OPEN_WORLD_ACTS, createOpenWorldCampaignProgress, OPEN_WORLD_STORAGE_KEY };
  }

  function injectStyles() {
    if (document.getElementById('saltline-world-perf-style')) return;
    const style = document.createElement('style');
    style.id = 'saltline-world-perf-style';
    style.textContent = `
      .sl-menu-hidden{display:none!important}
      .sl-world-hud{position:fixed;right:18px;top:16px;z-index:18;background:rgba(10,15,19,.86);border:1px solid rgba(130,205,222,.38);border-radius:6px;padding:8px 13px;color:#dfe9ec;font:600 11.5px/1.45 ui-monospace,SFMono-Regular,monospace;backdrop-filter:blur(6px);pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.42);max-width:405px;transition:opacity .25s}
      .sl-world-hud.photo-hidden{opacity:0}
      .sl-world-zone{color:#66d9f0;font-size:12.5px;margin-bottom:2px}
      .sl-world-op{color:#f0c46c;font:700 12px/1.38 system-ui,-apple-system,sans-serif;margin-top:4px;border-top:1px solid rgba(255,255,255,.12);padding-top:4px}
      .sl-world-hint{color:#9ab8c2;font-size:11px;margin-top:3px;opacity:.92}
      .sl-stealth-pill{display:inline-block;margin-top:4px;padding:2px 8px;border-radius:4px;font:700 10.5px/1.3 ui-monospace,monospace;background:rgba(46,204,113,.16);color:#75e8a6;border:1px solid rgba(117,232,166,.35)}
      .sl-stealth-pill.alert{background:rgba(235,88,68,.2);color:#ff9486;border-color:rgba(255,148,134,.45)}
      .sl-interact-prompt{position:fixed;left:50%;bottom:136px;transform:translateX(-50%);z-index:24;background:rgba(10,16,21,.92);border:1px solid rgba(240,196,108,.65);border-left:4px solid #f0c46c;border-radius:6px;padding:8px 16px;color:#f5f8fa;font:700 13px/1.3 system-ui,-apple-system,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.5);pointer-events:none;display:none}
      .sl-interact-prompt.on{display:block}
      .sl-finale-card{position:fixed;inset:0;z-index:62;background:rgba(5,10,15,.82);backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;color:#eef8fb}
      .sl-finale-card.open{display:flex}
      .sl-finale-inner{width:min(580px,92vw);background:rgba(11,18,25,.96);border:1px solid rgba(240,185,78,.55);border-radius:10px;padding:28px 32px;text-align:center;box-shadow:0 22px 54px rgba(0,0,0,.72)}
      .sl-finale-kicker{font:700 11.5px/1 ui-monospace,monospace;letter-spacing:.28em;color:#f0b94e;margin-bottom:10px}
      .sl-finale-title{font:800 28px/1.2 system-ui,sans-serif;color:#ffffff;margin-bottom:12px}
      .sl-finale-copy{font:500 14px/1.65 system-ui,sans-serif;color:#b8d7e0;margin-bottom:22px;text-align:left}
      .sl-finale-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
      .sl-finale-btn{background:rgba(102,217,240,.18);color:#dff8ff;border:1px solid rgba(102,217,240,.55);border-radius:6px;padding:9px 20px;font:700 13px/1 system-ui,sans-serif;cursor:pointer}
      .sl-finale-btn.primary{background:rgba(240,185,78,.24);color:#fff2cc;border-color:rgba(240,185,78,.72)}
      .sl-cod-hitmarker{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%) scale(.82);z-index:35;width:28px;height:28px;pointer-events:none;opacity:0;color:#ffffff;filter:drop-shadow(0 0 5px rgba(0,0,0,.85));transition:opacity .08s ease-out,transform .08s ease-out}
      .sl-cod-hitmarker.show{opacity:1;transform:translate(-50%,-50%) scale(1)}
      .sl-cod-hitmarker.kill{color:#ff7b42;filter:drop-shadow(0 0 8px rgba(255,123,66,.85));transform:translate(-50%,-50%) scale(1.22)}
      .sl-photo-pill{position:fixed;right:18px;bottom:16px;z-index:25;background:rgba(8,14,19,.72);border:1px solid rgba(255,255,255,.22);border-radius:99px;padding:5px 12px;color:#d6eef2;font:600 11px/1 system-ui,sans-serif;pointer-events:none;display:none}
      .sl-photo-pill.on{display:block}
      .sl-minimap{position:fixed;left:18px;bottom:92px;z-index:18;width:194px;background:rgba(8,14,20,.86);border:1.5px solid rgba(102,217,240,.42);border-radius:9px;padding:6px;box-shadow:0 8px 24px rgba(0,0,0,.5);backdrop-filter:blur(6px);transition:opacity .25s;pointer-events:auto;cursor:pointer}
      .sl-minimap.photo-hidden{opacity:0;pointer-events:none}
      .sl-minimap-head{display:flex;justify-content:space-between;align-items:center;font:700 10px/1 ui-monospace,monospace;color:#78e2f5;margin-bottom:4px;letter-spacing:.04em}
      .sl-minimap svg{width:100%;height:176px;display:block;border-radius:5px;background:#091924}
      .sl-pin-layer{position:fixed;inset:0;z-index:17;pointer-events:none;overflow:hidden;transition:opacity .25s}
      .sl-pin-layer.photo-hidden{opacity:0}
      .sl-pin{position:absolute;transform:translate(-50%,-100%);background:rgba(8,15,22,.76);border:1px solid rgba(102,217,240,.42);border-radius:99px;padding:3px 9px;color:#e8f6fa;font:600 11px/1.2 system-ui,-apple-system,sans-serif;white-space:nowrap;box-shadow:0 3px 12px rgba(0,0,0,.42);backdrop-filter:blur(4px);display:none}
      .sl-pin b{color:#66d9f0;margin-left:4px;font:600 10.5px/1 ui-monospace,monospace}
      .sl-obj-pin{position:fixed;z-index:22;transform:translate(-50%,-50%);color:rgba(255,232,168,.95);font:700 11px/1 ui-monospace,monospace;text-shadow:0 1px 6px rgba(0,0,0,.92);letter-spacing:.06em;white-space:nowrap;pointer-events:none;display:none}
      .sl-obj-pin b{color:#ffffff;margin-left:3px;font-weight:700}
      .sl-guide-strip{display:none!important}
      .sl-interact-prompt{background:rgba(8,12,16,.72)!important;border:none!important;border-left:2px solid rgba(255,255,255,.8)!important;border-radius:2px!important;padding:5px 12px!important;font:600 12.5px/1.3 system-ui,sans-serif!important;box-shadow:none!important}
      .sl-map-overlay{position:fixed;inset:0;z-index:60;background:rgba(6,11,16,.84);backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;color:#e6f4f7}
      .sl-map-overlay.open{display:flex}
      .sl-map-card{width:min(940px,94vw);background:rgba(12,19,25,.96);border:1px solid rgba(102,217,240,.42);border-radius:10px;padding:16px 18px;box-shadow:0 18px 48px rgba(0,0,0,.65);display:grid;grid-template-columns:1fr 290px;gap:16px}
      .sl-map-header{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px solid rgba(255,255,255,.12);padding-bottom:10px;flex-wrap:wrap}
      .sl-map-title{font-size:16px;font-weight:700;color:#66d9f0;letter-spacing:.3px}
      .sl-map-sub{font-size:12px;color:#9eb9c2;margin-top:2px}
      .sl-map-top-btns{display:flex;gap:8px;align-items:center}
      .sl-map-close{background:rgba(255,255,255,.08);color:#e6f4f7;border:1px solid rgba(255,255,255,.22);border-radius:6px;padding:5px 12px;cursor:pointer;font-weight:600;font-size:12px}
      .sl-map-close:hover{background:rgba(102,217,240,.2)}
      .sl-map-mode-btn{background:rgba(102,217,240,.18);color:#d7f9ff;border:1px solid rgba(102,217,240,.48);border-radius:6px;padding:5px 12px;cursor:pointer;font-weight:700;font-size:12px}
      .sl-map-mode-btn:hover{background:rgba(102,217,240,.32)}
      .sl-map-canvas{position:relative;aspect-ratio:310/400;max-height:530px;margin:0 auto;width:100%;background:#091924;border:1px solid rgba(102,217,240,.24);border-radius:8px;overflow:hidden}
      .sl-map-canvas svg{width:100%;height:100%;display:block}
      .sl-map-zone-btn{cursor:pointer;transition:opacity .15s,filter .15s}
      .sl-map-zone-btn:hover{filter:brightness(1.22)}
      .sl-map-side{display:flex;flex-direction:column;gap:8px;max-height:530px;overflow:auto}
      .sl-map-item{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.11);border-radius:7px;padding:8px 10px;display:flex;flex-direction:column;gap:5px}
      .sl-map-item.active{border-color:rgba(102,217,240,.65);background:rgba(102,217,240,.09)}
      .sl-map-item-top{display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:12.5px;font-weight:700}
      .sl-map-badge{font:600 10px/1 ui-monospace,monospace;padding:3px 6px;border-radius:99px;background:rgba(255,255,255,.09);color:#9ab2ba}
      .sl-map-badge.loaded{background:rgba(46,204,113,.22);color:#6df5a6;border:1px solid rgba(109,245,166,.4)}
      .sl-map-actions{display:flex;gap:6px}
      .sl-map-btn{flex:1;background:rgba(102,217,240,.14);color:#c9f6ff;border:1px solid rgba(102,217,240,.35);border-radius:5px;padding:4px 6px;font-size:11px;font-weight:600;cursor:pointer}
      .sl-map-btn:hover{background:rgba(102,217,240,.28)}
      .sl-map-btn.tp{background:rgba(255,196,76,.16);color:#ffe4a8;border-color:rgba(255,196,76,.4)}
      .sl-map-btn.tp:hover{background:rgba(255,196,76,.3)}
    `;
    document.head.appendChild(style);
  }

  if (typeof window !== 'undefined') window.createPortOpenWorld = (world, { chapterId = 'berth' } = {}) => {
    if (chapterId !== 'berth') return null;
    const { THREE, scene, physics, fx, audio } = world;
    const { Group, Mesh, BoxGeometry, CylinderGeometry, ConeGeometry, SphereGeometry,
      MeshStandardMaterial, MeshBasicMaterial, Color, Vector3 } = THREE;

    injectStyles();

    // Expand walking/driving bounds strictly over the real inland coastal city (x: -240..+32, z: -240..+165)
    if (physics?.bounds?.min && physics?.bounds?.max) {
      physics.bounds.min.set(-240, -12, -240);
      physics.bounds.max.set(32, 85, 165);
    }

    const legacySkyline = world.backdrop?.skyline ?? null;
    const legacyLamps = world.backdrop?.lamps ?? null;
    if (legacySkyline) legacySkyline.visible = false;
    if (legacyLamps) legacyLamps.visible = false;

    const root = new Group();
    root.name = 'saltline-open-world-root';
    scene.add(root);

    const horizonRoot = new Group();
    horizonRoot.name = 'saltline-horizon-city-grid';
    root.add(horizonRoot);
    const permanentColliders = [];

    // Claude's native Berth 4 PBR materials (NO object-space triplanar stretching; paired with world-meter UV geometry!)
    const pbr = (name, fallbackHex, roughness = .86, metalness = .08) => {
      try {
        const m = world.mats?.get?.(name);
        if (m) return m;
      } catch {}
      return new MeshStandardMaterial({ color: fallbackHex, roughness, metalness });
    };

    const M = {
      asphalt: pbr('asphalt', 0x262b2e, .94, .03),
      concrete: pbr('concrete', 0x6c706d, .90, .04),
      concreteDirty: pbr('concrete_dirty', 0x525654, .92, .05),
      corrugated: pbr('corrugated_roof', 0x3b4448, .66, .46), // Native Area-1 weathered corrugated steel
      steelClad: pbr('steel_worn', 0x384349, .68, .44),
      steelWorn: pbr('steel_worn', 0x3e464a, .58, .60),
      steelDark: pbr('steel_dark', 0x20262a, .52, .68),
      steelGalv: pbr('steel_galv', 0x6d777c, .44, .70),
      hazard: pbr('hazard_stripes', 0xb88424, .54, .20),
      glass: pbr('glass_dirty', 0x324957, .14, .58),
      wood: pbr('wood_dark', 0x4d3929, .86, .04),
      brickWeathered: pbr('brick', 0x63443a, .88, .05),
      plasterGrey: pbr('concrete', 0x76746b, .86, .05),
      slateSteel: pbr('steel_worn', 0x2e3940, .62, .42),
      cryoPanel: pbr('concrete', 0x8698a0, .60, .24),
      clinicPlaster: pbr('concrete', 0x9aa3a4, .78, .06),
      cargoRust: pbr('paint_red', 0x5c3325, .78, .30),
      cargoTeal: pbr('paint_teal', 0x234a50, .74, .26),
      cargoNavy: pbr('paint_blue', 0x223b54, .74, .26),
      rock: pbr('concrete_dirty', 0x444844, .94, .04),
      coastalGrass: new MeshStandardMaterial({ color: 0x2c3b2d, roughness: .94, metalness: .02 }),
      pineDark: new MeshStandardMaterial({ color: 0x1c3121, roughness: .90, metalness: .02 }),
      whitePaint: new MeshStandardMaterial({ color: 0xc8ccc8, roughness: .85, metalness: .02 }),
      yellowPaint: new MeshStandardMaterial({ color: 0xc29832, roughness: .82, metalness: .04 }),
      glassWarm: new MeshBasicMaterial({ color: 0xe6be7e }),
      glassCyan: new MeshBasicMaterial({ color: 0x56cfe6 }),
      greenSignal: new MeshBasicMaterial({ color: 0x42d982 }),
      redCore: new MeshBasicMaterial({ color: 0xd93824 }),
      blueTaxi: new MeshBasicMaterial({ color: 0x3b8fd9 }),
      beamGold: new MeshBasicMaterial({ color: 0xf5d993, transparent: true, opacity: .22, depthWrite: false }),
      sedanDark: new MeshStandardMaterial({ color: 0x1e2e3d, roughness: .22, metalness: .62, envMapIntensity: 1.45 }),
      sedanGrey: new MeshStandardMaterial({ color: 0x727b82, roughness: .24, metalness: .54, envMapIntensity: 1.40 }),
      sedanBurgundy: new MeshStandardMaterial({ color: 0x521d1c, roughness: .24, metalness: .58, envMapIntensity: 1.40 }),
      craneRed: new MeshStandardMaterial({ color: 0xb52922, roughness: .54, metalness: .34 }),
      craneWhite: new MeshStandardMaterial({ color: 0xd6dad6, roughness: .62, metalness: .16 }),
      safetyOrange: new MeshStandardMaterial({ color: 0xd66d18, roughness: .52, metalness: .24 }),
      coolingConcrete: new MeshStandardMaterial({ color: 0x787b75, roughness: .90, metalness: .04, side: THREE.DoubleSide }),
    };
    const customGeos = [];

    // High-res procedural weathered coastal building facade (crisp recessed windows, mullions, sills & rain streaks — slashes DC!)
    const lobbyGlass = new MeshStandardMaterial({color:0x9caeb0, transparent:true, opacity:.27, roughness:.19, metalness:.3, depthWrite:false});
    const smokedPane = new MeshStandardMaterial({ color: 0x38494d, metalness: .4, roughness: .24 });
    const blindPane = new MeshStandardMaterial({ color: 0x686356, metalness: .17, roughness: .52 });


    const hangarArchMat = M.corrugated.clone ? M.corrugated.clone() : new MeshStandardMaterial({ color: 0x3b464c, roughness: .68, metalness: .45 });
    hangarArchMat.side = THREE.DoubleSide;

    const boxGeo = new BoxGeometry(1, 1, 1);
    const cylGeo = new CylinderGeometry(1, 1, 1, 14);
    const coneGeo = new ConeGeometry(1, 1, 9);
    const sphGeo = new SphereGeometry(1, 14, 10);

    const sectors = [];
    const parcels = [];
    const updaters = [];
    const shootTargets = [];
    const roadblockProps = [];
    const interactables = []; // [E] Interactive Doors, Gates, Medical Triage, Resupply, Evidence Terminals!

    const externalAssets = typeof window.createSaltlineExternalAssets === 'function'
      ? window.createSaltlineExternalAssets(THREE) : null;
    const utilityPoles = [];
    const WE = window.WorldEngine || null;
    const matLib = WE?.createMaterialLibrary ? WE.createMaterialLibrary(THREE, world.mats) : null;
    const buildingGen = WE?.createBuildingGenerator && matLib ? WE.createBuildingGenerator(THREE, matLib, { ...M, smokedPane, blindPane }) : null;
    const terrainGen = WE?.createTerrainGenerator && matLib ? WE.createTerrainGenerator(THREE, matLib) : null;
    const lightingSys = WE?.createLightingSystem ? WE.createLightingSystem(THREE, world) : null;
    const industrialGen = WE?.createIndustrialGenerator && matLib ? WE.createIndustrialGenerator(THREE, matLib, M) : null;
    const atmosphereSys = WE?.createAtmosphereSystem ? WE.createAtmosphereSystem(THREE, root, updaters) : null;
    function addPermanentCollider(min, max, opts = { surface: 'concrete' }) {
      if (!physics?.addBox) return null;
      const b = physics.addBox(min, max, opts);
      if (b) permanentColliders.push(b);
      return b;
    }
    function findOwnerSector(parent) {
      for (let i = 0; i < sectors.length; i++) {
        if (sectors[i].shell === parent || sectors[i].detail === parent) return sectors[i];
      }
      return null;
    }
    function addColliderForParent(parent, x0, y0, z0, x1, y1, z1, surface = 'concrete') {
      const minV = new Vector3(Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1));
      const maxV = new Vector3(Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1));
      const sec = findOwnerSector(parent);
      if (sec) sec.colliderSpecs.push({ min: minV, max: maxV, surface });
      else addPermanentCollider(minV, maxV, { surface, noNav: true });
    }
    function addRotatedCollider(targetOrParent, cx, y0, cz, lx0, lx1, lz0, lz1, y1, yaw = 0, surface = 'metal') {
      const c = Math.cos(yaw), sn = Math.sin(yaw);
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      for (const lx of [lx0, lx1]) {
        for (const lz of [lz0, lz1]) {
          const wx = cx + lx * c + lz * sn;
          const wz = cz - lx * sn + lz * c;
          if (wx < minX) minX = wx; if (wx > maxX) maxX = wx;
          if (wz < minZ) minZ = wz; if (wz > maxZ) maxZ = wz;
        }
      }
      if (targetOrParent && Array.isArray(targetOrParent.colliderSpecs)) {
        targetOrParent.colliderSpecs.push({ min: new Vector3(minX, y0, minZ), max: new Vector3(maxX, y1, maxZ), surface });
      } else {
        addColliderForParent(targetOrParent, minX, y0, minZ, maxX, y1, maxZ, surface);
      }
    }
    function addDynamicCollider(min, max, opts = {}) {
      return addPermanentCollider(min, max, { surface: 'metal', noNav: true, ...opts });
    }
    function updateDynamicBox(box, x0, y0, z0, x1, y1, z1) {
      if (!box) return;
      if (typeof physics?.updateBox === 'function') physics.updateBox(box, x0, y0, z0, x1, y1, z1);
      else { box.min.set(x0, y0, z0); box.max.set(x1, y1, z1); }
    }
    function pushPlayerOutOfMovingBox(box) {
      if (!box || box.disabled) return;
      // Push drivable SAR 4x4 laterally if train or semi-truck hits it (driving OR parked!)
      const veh = world.vehicle;
      const vp = veh?.pos;
      if (vp) {
        const vx = 1.25, vz = 2.45;
        if (vp.y + 2.0 > box.min.y && vp.y < box.max.y &&
            vp.x + vx > box.min.x && vp.x - vx < box.max.x &&
            vp.z + vz > box.min.z && vp.z - vz < box.max.z) {
          const dL = Math.abs(vp.x - box.min.x), dR = Math.abs(box.max.x - vp.x);
          const nextX = dL < dR ? box.min.x - vx - 0.35 : box.max.x + vx + 0.35;
          veh.setPosition?.(new Vector3(nextX, vp.y, vp.z));
          if (veh.isDriving?.() && world.player?.pos) world.player.pos.x = nextX;
          world.player?.addShake?.(0.42);
          fx?.sparks?.(new Vector3(nextX, vp.y + 0.9, vp.z), new Vector3(0, 1, 0), 14);
        }
      }
      if (veh?.isDriving?.()) return;
      const pp = world.player?.pos;
      if (!pp) return;
      const r = 0.42;
      if (pp.y + 1.75 <= box.min.y || pp.y >= box.max.y) return;
      if (pp.x + r > box.min.x && pp.x - r < box.max.x && pp.z + r > box.min.z && pp.z - r < box.max.z) {
        const dL = Math.abs(pp.x - box.min.x), dR = Math.abs(box.max.x - pp.x);
        pp.x = dL < dR ? box.min.x - r - 0.14 : box.max.x + r + 0.14;
        world.player?.addShake?.(0.22);
      }
    }
    const EXTERNAL_COLLIDER_SPECS = {
      concrete_road_barrier: { hx: 1.15, hy: 0.96, hz: 0.34, surface: 'concrete' },
      portable_generator: { hx: 0.56, hy: 0.78, hz: 0.42, surface: 'metal' },
      utility_box_01: { hx: 0.54, hy: 1.48, hz: 0.36, surface: 'metal' },
      modular_industrial_pipes_01: { hx: 1.35, hy: 1.35, hz: 0.62, surface: 'metal' },
      modular_electricity_poles: { hx: 0.24, hy: 7.5, hz: 0.24, surface: 'wood' },
      painted_wooden_chair_02: { hx: 0.28, hy: 0.86, hz: 0.28, surface: 'wood' },
    };
    function placeExternal(parent, assetId, x, y, z, yaw = 0, scale = 1.0) {
      const prop = externalAssets?.place(parent, assetId, x, y, z, yaw, scale) ?? null;
      if (prop && assetId === 'modular_electricity_poles') utilityPoles.push(prop);
      if (assetId === 'overhead_crane') {
        for (const lx of [-3.6 * scale, 3.6 * scale]) {
          addRotatedCollider(parent, x, y, z, lx - 0.45 * scale, lx + 0.45 * scale, -0.55 * scale, 0.55 * scale, y + 6.2 * scale, yaw, 'metal');
        }
      } else {
        const spec = EXTERNAL_COLLIDER_SPECS[assetId];
        if (spec) {
          addRotatedCollider(parent, x, y, z, -spec.hx * scale, spec.hx * scale, -spec.hz * scale, spec.hz * scale, y + spec.hy * scale, yaw, spec.surface);
        }
      }
      return prop;
    }
    function streetDetailRange() {
      const quality = world.quality?.name;
      return quality === 'low' ? 45 : quality === 'medium' ? 70 : Infinity;
    }
    let poleCheckT = 0.2;
    updaters.push(dt => {
      poleCheckT += dt;
      if (poleCheckT < 0.2) return;
      poleCheckT = 0;
      const position = world.camera?.position;
      const radius = streetDetailRange();
      const rSq = radius * radius;
      for (const pole of utilityPoles) {
        pole.visible = !position || position.distanceToSquared(pole.position) <= rSq;
      }
    });

    function makeSector(id, nameZh, nameEn, center, streamRadius = 275) {
      const group = new Group();
      group.name = 'world-sector-' + id;
      const shell = new Group();
      const detail = new Group();
      shell.visible = false;
      detail.visible = false;
      group.add(shell, detail);
      root.add(group);
      const sec = {
        id, nameZh, nameEn,
        center: new Vector3(...center),
        streamRadius: Math.max(streamRadius, 275),
        detailRadius: 195,
        group, shell, detail,
        colliderSpecs: [],
        activeColliders: [],
        loaded: false,
        detailed: false,
      };
      sectors.push(sec);
      return sec;
    }

    function makeParcel(id, x, z, streamRadius, detailRadius) {
      const shell = new Group(), detail = new Group();
      shell.name = id;
      shell.visible = detail.visible = false;
      root.add(shell, detail);
      const parcel = { id, center: new Vector3(x, 0, z), streamRadius, detailRadius,
        shell, detail, colliderSpecs: [], activeColliders: [], loaded: false, detailed: false };
      parcels.push(parcel);
      return parcel;
    }

    // World-meter UV BoxGeometry cache so large roads/walls NEVER stretch textures (matches Claude's Berth 4 density!)
    const worldBoxCache = new Map();
    function getWorldBoxGeo(w, h, d, tile = 3.0) {
      const [rw, rh, rd] = [w, h, d];
      const key = `${w}_${h}_${d}_${tile}`;
      let g = worldBoxCache.get(key);
      if (g) return g;
      g = new BoxGeometry(rw, rh, rd);
      const uv = g.attributes.uv;
      if (uv && uv.count === 24) {
        const faceDims = [[rd, rh], [rd, rh], [rw, rd], [rw, rd], [rw, rh], [rw, rh]];
        for (let f = 0; f < 6; f++) {
          const [fu, fv] = faceDims[f];
          for (let v = 0; v < 4; v++) {
            const idx = f * 4 + v;
            uv.setXY(idx, uv.getX(idx) * (fu / tile), uv.getY(idx) * (fv / tile));
          }
        }
        uv.needsUpdate = true;
      }
      worldBoxCache.set(key, g);
      return g;
    }

    function addBox(parent, mat, w, h, d, x, y, z, shadow = false) {
      const useWorldUv = Math.max(w, h, d) > 2.2;
      const m = new Mesh(useWorldUv ? getWorldBoxGeo(w, h, d) : boxGeo, mat);
      m.position.set(x, y, z);
      if (!useWorldUv) m.scale.set(w, h, d);
      m.castShadow = shadow && mat !== M.glass;
      m.receiveShadow = true;
      m.matrixAutoUpdate = false;
      m.updateMatrix();
      m.userData.staticBatchable = true;
      parent.add(m);
      return m;
    }

    function addCyl(parent, mat, r, h, x, y, z, rx = 0, rz = 0) {
      const m = new Mesh(cylGeo, mat);
      m.position.set(x, y, z);
      m.scale.set(r, h, r);
      m.rotation.set(rx, 0, rz);
      m.receiveShadow = true;
      m.matrixAutoUpdate = false;
      m.updateMatrix();
      m.userData.staticBatchable = true;
      parent.add(m);
      return m;
    }

    function solidHorizon(mat, x0, y0, z0, x1, y1, z1, surface = 'concrete', collide = true) {
      const w = Math.abs(x1 - x0), h = Math.abs(y1 - y0), d = Math.abs(z1 - z0);
      addBox(horizonRoot, mat, w, h, d, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, false);
      if (collide && physics?.addBox) {
        permanentColliders.push(physics.addBox(
          new Vector3(Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1)),
          new Vector3(Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)),
          { surface },
        ));
      }
    }

    // Reuse Area 1 (Berth 4) native high-precision procedural asset library (world.props.build) with rotated AABB colliders!
    let propSeed = 4200;
    const propCells = new Map();
    function placePortProp(sec,parent,name,x,y,z,yaw=0,opts={},collide=true) {
      const seed = propSeed++;
      if (!sec || (parent !== sec.shell && parent !== sec.detail))
        return buildPortProp(sec,parent,name,x,y,z,yaw,{seed,...opts},collide);
      const gx = Math.floor(x / 24), gz = Math.floor(z / 24);
      const key = sec.id+'-'+gx+'-'+gz;
      let cell = propCells.get(key);
      if (!cell) {
        cell = makeParcel(key,(gx+.5)*24,(gz+.5)*24,120,78);
        cell.recipes=[];
        let next = 0;
        cell.onBuild = () => {
          cell.recipes[next++]();
          return next === cell.recipes.length;
        };
        cell.onUnload = () => {
          cell.shell.clear(); cell.detail.clear(); cell.colliderSpecs.length=0; next=0;
        };
        propCells.set(key,cell);
      }
      cell.recipes.push(() => {
        const obj = buildPortProp(cell,cell.shell,
          name,x,y,z,yaw,{seed,...opts},collide);
        // Native grouped geometry is generated per prop. Materials belong to the port library.
        obj?.traverse(node => {
          if (node.geometry) node.geometry.userData.streamOwned = true;
        });
      });
    }
    function buildPortProp(sec,parent,name,x,y,z,yaw,opts,collide) {
      if (!world.props?.build) return null;
      let obj = null;
      try { obj = world.props.build(name, opts); } catch { return null; }
      if (!obj) return null;
      obj.position.set(x, y, z);
      obj.rotation.y = yaw;
      obj.updateMatrixWorld?.(true);
      parent.add(obj);
      if (collide && sec && Array.isArray(obj.userData?.colliders)) {
        const c = Math.cos(yaw), s = Math.sin(yaw);
        for (const col of obj.userData.colliders) {
          if (!col?.min || !col?.max || col.bulletOnly) continue;
          const xs = [col.min[0], col.max[0]], zs = [col.min[2], col.max[2]];
          let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
          for (const lx of xs) for (const lz of zs) {
            const wx = x + lx * c + lz * s, wz = z - lx * s + lz * c;
            if (wx < minX) minX = wx; if (wx > maxX) maxX = wx;
            if (wz < minZ) minZ = wz; if (wz > maxZ) maxZ = wz;
          }
          sec.colliderSpecs.push({
            min: new Vector3(minX, y + col.min[1], minZ),
            max: new Vector3(maxX, y + col.max[1], maxZ),
            surface: col.surface || 'metal',
          });
        }
      }
      return obj;
    }

    function solid(sec, parent, mat, x0, y0, z0, x1, y1, z1, surface = 'concrete', collide = true) {
      const w = Math.abs(x1 - x0), h = Math.abs(y1 - y0), d = Math.abs(z1 - z0);
      addBox(parent, mat, w, h, d, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, false);
      if (collide) {
        sec.colliderSpecs.push({
          min: new Vector3(Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1)),
          max: new Vector3(Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)),
          surface,
        });
      }
    }

    // Interactive Animated Sliding Steel Blast Door (removes/restores collider cleanly — zero clipping!)
    function addInteractiveDoor(parent, { id, labelZh, x, y, z, width = 3.8, height = 3.4, axis = 'z', initiallyOpen = false }) {
      const frame = new Group();
      frame.position.set(x, y, z);
      const doorMat = matLib ? matLib.get('metal_painted') : M.steelWorn;
      const leaf = new Mesh(boxGeo, doorMat);
      const isX = axis === 'x';
      leaf.scale.set(isX ? width : .24, height, isX ? .24 : width);
      leaf.position.set(0, height / 2, 0);
      const railTop = new Mesh(boxGeo, M.steelDark);
      railTop.scale.set(isX ? width + .2 : .34, .18, isX ? .34 : width + .2);
      railTop.position.set(0, height - .06, 0);
      const visionGlass = new Mesh(boxGeo, smokedPane);
      visionGlass.scale.set(isX ? width * .46 : .28, .52, isX ? .28 : width * .46);
      visionGlass.position.set(0, height * .64, 0);
      const kickPlate = new Mesh(boxGeo, M.steelDark);
      kickPlate.scale.set(isX ? width * .96 : .28, .38, isX ? .28 : width * .96);
      kickPlate.position.set(0, .20, 0);
      const stripe = new Mesh(boxGeo, M.hazard);
      stripe.scale.set(isX ? width * .94 : .29, .14, isX ? .29 : width * .94);
      stripe.position.set(0, .96, 0);
      const lamp = new Mesh(boxGeo, initiallyOpen ? M.greenSignal : M.redCore);
      lamp.scale.set(.22, .22, .22);
      lamp.position.set(isX ? width / 2 + .3 : .35, 1.7, isX ? .35 : width / 2 + .3);
      const doorLeafGroup = new Group();
      doorLeafGroup.add(leaf, railTop, visionGlass, kickPlate, stripe);
      frame.add(doorLeafGroup, lamp);
      parent.add(frame);

      let open = initiallyOpen;
      let slideT = open ? 1 : 0;
      doorLeafGroup.position[isX ? 'x' : 'z'] = slideT * (width - .25);
      let colBox = null;

      function syncDoorCollider() {
        if (!physics?.addBox || !physics?.removeBox) return;
        if (!open && !colBox) {
          const hw = (isX ? width : .35) / 2;
          const hd = (isX ? .35 : width) / 2;
          colBox = physics.addBox(new Vector3(x - hw, y, z - hd), new Vector3(x + hw, y + height, z + hd), { surface: 'metal' });
        } else if (open && colBox) {
          physics.removeBox(colBox);
          colBox = null;
        }
      }
      syncDoorCollider();

      updaters.push(dt => {
        const target = open ? 1 : 0;
        if (Math.abs(slideT - target) > .005) {
          slideT += (target - slideT) * Math.min(1, dt * 6.5);
          if (isX) doorLeafGroup.position.x = slideT * (width - .25);
          else doorLeafGroup.position.z = slideT * (width - .25);
        }
      });

      const entry = {
        id, pos: new Vector3(x, y + 1.2, z), radius: 3.6,
        getPrompt: () => open ? `按 [E] 关闭「${labelZh}」` : `按 [E] 打开「${labelZh}」`,
        use() {
          open = !open;
          lamp.material = open ? M.greenSignal : M.redCore;
          syncDoorCollider();
          audio?.play?.('rail_touchdown', { pos: entry.pos, ref: 14, gain: .48, jitter: .06 });
          world.tactical?.notify?.(open ? `🚪 已开启：${labelZh}` : `🔒 已关闭：${labelZh}`, open ? `Opened ${id}` : `Closed ${id}`, false, 2.2);
        },
        cleanup() { if (colBox) { physics?.removeBox?.(colBox); colBox = null; } },
      };
      interactables.push(entry);
      return entry;
    }

    // Interactive Facility Terminal (Medical Triage / Armory Locker / 《失联名单》 Evidence Console)
    function addInteractiveTerminal(parent, { id, promptZh, x, y, z, colorMat = M.glassCyan, onUse }) {
      const g = new Group();
      g.position.set(x, y, z);
      addBox(g, M.steelDark, 1.1, 1.35, .65, 0, .675, 0);
      addBox(g, colorMat, .82, .46, .08, 0, 1.05, .34);
      addBox(g, M.hazard, 1.14, .16, .68, 0, .25, 0);
      g.matrixAutoUpdate = false; g.updateMatrix();
      parent.add(g);
      addColliderForParent(parent, x - 0.58, y, z - 0.36, x + 0.58, y + 1.38, z + 0.36, 'metal');
      const entry = {
        id, pos: new Vector3(x, y + 1.0, z), radius: 3.0,
        getPrompt: () => promptZh,
        use: onUse,
        cleanup() {},
      };
      interactables.push(entry);
      return entry;
    }

    // Each bough has a raised spine, drooping outer needles and a ragged tip.
    // Share the entire crown between trees to keep it to one draw per canopy.
    const needles = [];
    for (let tier = 0; tier < 8; tier++) {
      for (let branch = 0; branch < 9; branch++) {
        const angle = branch * 2.39996 + tier * .83;
        const reach = (1.84 - tier * .18) * (.87 + .13 * Math.sin(branch * 17 + tier));
        const base = 2.15 + tier * .45;
        const point = (r, side, dy) => [
          tier * .045 + r * Math.cos(angle) - side * Math.sin(angle),
          base + dy, r * Math.sin(angle) + side * Math.cos(angle),
        ];
        const spine = point(reach * .62, 0, .20);
        const stem = point(0, 0, .42);
        for (const side of [-1, 1]) {
          const edge = point(reach * .68, side * reach * .39, -.16);
          const tip = point(reach, side * reach * .12, -.20);
          const faces = [stem, spine, edge, spine, tip, edge];
          if (side < 0) faces.reverse();
          needles.push(...faces.flat());
        }
      }
    }
    const crown = new THREE.BufferGeometry();
    crown.setAttribute('position', new THREE.Float32BufferAttribute(needles, 3));
    crown.computeVertexNormals();
    M.pineDark.side = THREE.DoubleSide;
    const taperedTrunkGeo = new CylinderGeometry(.07, .21, 4.95, 9);
    customGeos.push(taperedTrunkGeo);
    function addPineTree(parent, x, y, z, scale = 1) {
      const g = new Group();
      g.position.set(x, y, z);
      const hVar = 0.88 + ((Math.abs(x * 17 + z * 23) % 28) / 100);
      g.scale.set(scale, scale * hVar, scale);
      g.rotation.y = (Math.abs(x * 13 + z * 7) % 628) / 100;
      g.rotation.z = (((Math.abs(x * 7 + z * 11) % 10) - 5) * 0.008);
      const trunk = new Mesh(taperedTrunkGeo, M.wood);
      trunk.position.set(.04, 2.44, 0);
      trunk.matrixAutoUpdate = false; trunk.updateMatrix();
      g.add(trunk);
      const canopy = new Mesh(crown, M.pineDark);
      canopy.matrixAutoUpdate = false; canopy.updateMatrix();
      g.add(canopy);
      parent.add(g);
      const tr = Math.max(0.22, 0.24 * scale);
      addColliderForParent(parent, x - tr, y, z - tr, x + tr, y + 4.6 * scale, z + tr, 'wood');
    }

    function addStreetLamp(parent, x, y, z, armDir = 1) {
      const pole = new Mesh(cylGeo, M.steelDark);
      pole.scale.set(.09, 6.2, .09);
      pole.position.set(x, y + 3.1, z);
      pole.matrixAutoUpdate = false; pole.updateMatrix();
      parent.add(pole);
      addBox(parent, M.steelDark, 1.7, .09, .11, x + armDir * .85, y + 6.1, z, false);
      addBox(parent, M.glassWarm, .52, .07, .20, x + armDir * 1.55, y + 6.02, z, false);
      addColliderForParent(parent, x - 0.14, y, z - 0.14, x + 0.14, y + 6.2, z + 0.14, 'metal');
    }

    let sedanBodyGeo = null, sedanCabinGeo = null;
    function getSedanGeos() {
      if (sedanBodyGeo && sedanCabinGeo) return [sedanBodyGeo, sedanCabinGeo];
      function makePanelGeo(outline, width, bevel) {
        const shape = new THREE.Shape(outline.map(([z, y]) => new THREE.Vector2(-z, y)));
        const shell = new THREE.ExtrudeGeometry(shape, {
          depth: width, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel,
          bevelSegments: 3, steps: 1, curveSegments: 12,
        });
        shell.translate(0, 0, -width / 2);
        shell.rotateY(Math.PI / 2);
        customGeos.push(shell);
        return shell;
      }
      sedanBodyGeo = makePanelGeo([[-2.05,.36],[-2.08,.66],[-1.75,.76],[-1.22,.79],[-.78,.83],
        [.85,.82],[1.65,.73],[2.08,.60],[2.09,.39],[1.73,.34],[1.67,.55],
        [1.51,.70],[1.26,.73],[1.03,.64],[.88,.42],[.84,.31],[-.85,.31],
        [-.94,.56],[-1.12,.70],[-1.37,.72],[-1.6,.62],[-1.73,.35]], 1.69, .036);
      sedanCabinGeo = makePanelGeo([[-1.32,.80],[-.73,1.24],[-.45,1.32],[.46,1.31],[.72,1.22],[1.22,.81]], 1.46, .055);
      return [sedanBodyGeo, sedanCabinGeo];
    }
    function addParkedSedan(parent, x, y, z, yaw, mat) {
      const g = new Group();
      g.position.set(x, y, z);
      g.rotation.y = yaw;
      const [bodyGeo, cabinGeo] = getSedanGeos();
      const bodyMesh = new Mesh(bodyGeo, mat);
      bodyMesh.matrixAutoUpdate = false; bodyMesh.updateMatrix(); bodyMesh.userData.staticBatchable = true;
      const cabinMesh = new Mesh(cabinGeo, smokedPane);
      cabinMesh.matrixAutoUpdate = false; cabinMesh.updateMatrix(); cabinMesh.userData.staticBatchable = true;
      g.add(bodyMesh, cabinMesh);
      addBox(g,mat,1.49,.075,1.07,0,1.355,-.04);
      for (const side of [-1,1]) {
        addBox(g,mat,.04,.49,.09,side*.79,1.07,-.04);
        addBox(g,M.steelGalv,.045,.035,2.45,side*.845,.82,-.04);
        for (const z of [-.78,.28]) addBox(g,M.steelDark,.04,.034,.18,side*.884,.74,z);
      }
      addBox(g, M.steelDark, 1.15, .14, .06, 0, .52, 2.115);
      for (const sx of [-.66, .66]) {
        addBox(g, M.glassWarm, .30, .14, .06, sx, .60, 2.15);
        addBox(g, M.redCore, .30, .14, .06, sx, .60, -2.15);
        addBox(g, M.steelDark, .14, .10, .08, sx * 1.38, .92, .62);
        for (const wz of [-1.28, 1.28]) {
          addCyl(g, M.steelDark, .34, .24, sx * 1.22, .34, wz, 0, Math.PI / 2);
          addCyl(g, M.steelGalv, .18, .26, sx * 1.22, .34, wz, 0, Math.PI / 2);
        }
      }
      g.matrixAutoUpdate = false; g.updateMatrix();
      parent.add(g);
      addRotatedCollider(parent, x, y, z, -0.96, 0.96, -2.18, 2.18, y + 1.44, yaw, 'metal');
    }

    function makeSignMat(topText, subText, bg = '#153b2f') {
      try {
        const c = document.createElement('canvas');
        c.width = 512; c.height = 144;
        const ctx = c.getContext?.('2d');
        if (ctx && THREE.CanvasTexture) {
          ctx.fillStyle = bg; ctx.fillRect(0, 0, 512, 144);
          ctx.strokeStyle = '#d4e2de'; ctx.lineWidth = 5; ctx.strokeRect(8, 8, 496, 128);
          ctx.fillStyle = '#f2f5f4'; ctx.font = 'bold 32px system-ui,sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(topText, 256, 66);
          ctx.fillStyle = '#e8c46b'; ctx.font = '600 21px ui-monospace,sans-serif';
          ctx.fillText(subText, 256, 110);
          const tex = new THREE.CanvasTexture(c);
          return new MeshBasicMaterial({ map: tex });
        }
      } catch {}
      return M.steelGalv;
    }

    function addHighwayGantry(x, z, yaw, topText, subText, span = 16, bg = '#153b2f') {
      const g = new Group();
      g.position.set(x, .16, z);
      g.rotation.y = yaw;
      const half = span / 2;
      addBox(g, M.concrete, 1.1, .75, 1.1, -half, .375, 0);
      addBox(g, M.concrete, 1.1, .75, 1.1, half, .375, 0);
      addRotatedCollider(horizonRoot, x, 0.16, z, -half - 0.58, -half + 0.58, -0.58, 0.58, 8.0, yaw, 'concrete');
      addRotatedCollider(horizonRoot, x, 0.16, z, half - 0.58, half + 0.58, -0.58, 0.58, 8.0, yaw, 'concrete');
      addBox(g, M.steelGalv, .42, 7.8, .42, -half, 4.0, 0);
      addBox(g, M.steelGalv, .42, 7.8, .42, half, 4.0, 0);
      addBox(g, M.steelDark, span + .5, .28, .32, 0, 7.85, 0);
      addBox(g, M.steelDark, span + .5, .28, .32, 0, 6.45, 0);
      const signW = Math.min(span - 3.2, 9.6);
      const signMat = makeSignMat(topText, subText, bg);
      const signBack = new Mesh(boxGeo, M.steelDark);
      signBack.scale.set(signW + .24, 2.15, .14); signBack.position.set(0, 7.15, .24);
      const signFace = new Mesh(boxGeo, signMat);
      signFace.scale.set(signW, 1.95, .06); signFace.position.set(0, 7.15, .32);
      const signFaceRear = new Mesh(boxGeo, signMat);
      signFaceRear.scale.set(signW, 1.95, .06); signFaceRear.position.set(0, 7.15, -.24);
      signFaceRear.rotation.y = Math.PI;
      g.add(signBack, signFace, signFaceRear);
      g.matrixAutoUpdate = false; g.updateMatrix();
      horizonRoot.add(g);
    }

    // Area-1-Grade Walkable & Furnished Industrial Building Builder (NOT an empty shell!)
    // Real 4-wall structure with 5.4m x 4.2m open drive/walk-in bay, interior concrete floor,
    // visible overhead steel roof trusses, glowing high-bay LED fixtures, pitched corrugated roof,
    // steel H-columns, recessed clerestory windows, and Area-1 world.props.build() interior & exterior furnishings!
    function addIndustrialFacility(sec, parent, {
      x0, z0, x1, z1, h = 7.6, wallMat = M.steelClad, roofMat = M.corrugated,
      title = 'SALTLINE FACILITY', doorSide = 'east', signBg = '#1a2b34', interiorKind = 'warehouse', flatRoof = false,
    }) {
      const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      const baseY = .16, t = .38, doorW = 5.4, doorH = 4.2;
      const isEast = doorSide === 'east', isWest = doorSide === 'west', isNorth = doorSide === 'north', isSouth = doorSide === 'south';

      // Interior concrete floor slab + perimeter foundation apron & concrete curb
      solid(sec, parent, M.concrete, x0 - .55, baseY - .16, z0 - .55, x1 + .55, baseY + .06, z1 + .55, 'concrete', true);

      // Build 4 real structural walls (with a true open 5.4m x 4.2m bay on doorSide so player can walk/drive right inside!)
      const buildWallWithOptionalDoor = (hasDoor, side) => {
        if (side === 'north' || side === 'south') {
          const wz0 = side === 'north' ? z0 : z1 - t;
          const wz1 = side === 'north' ? z0 + t : z1;
          if (!hasDoor) {
            solid(sec, parent, M.concreteDirty, x0, baseY, wz0, x1, baseY + 1.55, wz1, 'concrete', true);
            solid(sec, parent, wallMat, x0, baseY + 1.55, wz0, x1, baseY + h, wz1, 'metal', true);
          } else {
            const dx0 = cx - doorW / 2, dx1 = cx + doorW / 2;
            solid(sec, parent, M.concreteDirty, x0, baseY, wz0, dx0, baseY + 1.55, wz1, 'concrete', true);
            solid(sec, parent, wallMat, x0, baseY + 1.55, wz0, dx0, baseY + h, wz1, 'metal', true);
            solid(sec, parent, M.concreteDirty, dx1, baseY, wz0, x1, baseY + 1.55, wz1, 'concrete', true);
            solid(sec, parent, wallMat, dx1, baseY + 1.55, wz0, x1, baseY + h, wz1, 'metal', true);
            solid(sec, parent, wallMat, dx0, baseY + doorH, wz0, dx1, baseY + h, wz1, 'metal', true);
          }
        } else {
          const wx0 = side === 'west' ? x0 : x1 - t;
          const wx1 = side === 'west' ? x0 + t : x1;
          if (!hasDoor) {
            solid(sec, parent, M.concreteDirty, wx0, baseY, z0 + t, wx1, baseY + 1.55, z1 - t, 'concrete', true);
            solid(sec, parent, wallMat, wx0, baseY + 1.55, z0 + t, wx1, baseY + h, z1 - t, 'metal', true);
          } else {
            const dz0 = cz - doorW / 2, dz1 = cz + doorW / 2;
            solid(sec, parent, M.concreteDirty, wx0, baseY, z0 + t, wx1, baseY + 1.55, dz0, 'concrete', true);
            solid(sec, parent, wallMat, wx0, baseY + 1.55, z0 + t, wx1, baseY + h, dz0, 'metal', true);
            solid(sec, parent, M.concreteDirty, wx0, baseY, dz1, wx1, baseY + 1.55, z1 - t, 'concrete', true);
            solid(sec, parent, wallMat, wx0, baseY + 1.55, dz1, wx1, baseY + h, z1 - t, 'metal', true);
            solid(sec, parent, wallMat, wx0, baseY + doorH, dz0, wx1, baseY + h, dz1, 'metal', true);
          }
        }
      };
      buildWallWithOptionalDoor(isNorth, 'north');
      buildWallWithOptionalDoor(isSouth, 'south');
      buildWallWithOptionalDoor(isWest, 'west');
      buildWallWithOptionalDoor(isEast, 'east');

      // Exterior structural steel H-columns, horizontal steel girts, rainwater downspouts & interior roof trusses
      const bays = Math.max(3, Math.round(w / 6.8));
      for (let i = 0; i <= bays; i++) {
        const px = x0 + (w * i) / bays;
        for (const pz of [z0 - .10, z1 + .10]) {
          addBox(parent, M.steelDark, .38, h + .25, .38, px, baseY + h / 2, pz);
          addBox(parent, M.concrete, .54, .34, .54, px, baseY + .17, pz);
        }
        if (i > 0 && i < bays) {
          addBox(parent, M.steelDark, .24, .34, d - .6, px, baseY + h - .25, cz);
          addBox(parent, M.steelGalv, .95, .12, .28, px, baseY + h - .52, cz - d * .22);
          addBox(parent, M.glassWarm, .85, .04, .18, px, baseY + h - .60, cz - d * .22);
          addBox(parent, M.steelGalv, .95, .12, .28, px, baseY + h - .52, cz + d * .22);
          addBox(parent, M.glassWarm, .85, .04, .18, px, baseY + h - .60, cz + d * .22);
        }
      }
      for (const fz of [z0 - .08, z1 + .08]) {
        addBox(parent, M.concrete, w + .32, .16, .26, cx, baseY + 1.56, fz);
        addBox(parent, M.steelDark, w + .28, .14, .22, cx, baseY + h - .24, fz);
        addBox(parent, M.steelGalv, w + .6, .16, .24, cx, baseY + h + .04, fz + (fz < cz ? -.25 : .25));
      }
      const dBays = Math.max(2, Math.round(d / 6.8));
      for (let j = 1; j < dBays; j++) {
        const pz = z0 + (d * j) / dBays;
        for (const px of [x0 - .10, x1 + .10]) addBox(parent, M.steelDark, .36, h + .2, .36, px, baseY + h / 2, pz);
      }
      for (const [dxp, dzp] of [[x0 - .22, z0 - .22], [x1 + .22, z1 + .22]]) {
        addCyl(parent, M.steelGalv, .085, h, dxp, baseY + h / 2, dzp);
      }
      const ductX = isWest ? x1 + .42 : x0 - .42;
      addBox(parent, M.steelGalv, .62, h * .76, .62, ductX, baseY + h * .56, cz - d * .24);
      addBox(parent, M.steelDark, .78, .22, .78, ductX, baseY + h * .96, cz - d * .24);
      addBox(parent, M.steelGalv, .72, .72, 1.35, ductX, baseY + 1.65, cz - d * .24);

      if (flatRoof) {
        // Clean engineered flat parapet roof (for Field Triage Clinic & Substation — ZERO roof clipping!)
        solid(sec, parent, roofMat, x0 - .35, baseY + h - .10, z0 - .35, x1 + .35, baseY + h + .32, z1 + .35, 'concrete', true);
        addBox(parent, M.steelDark, w + .85, .18, d + .85, cx, baseY + h + .38, cz);
        for (const rz of [z0 - .25, z1 + .25]) addBox(parent, wallMat, w + .6, .75, .28, cx, baseY + h + .75, rz);
        for (const rx of [x0 - .25, x1 + .25]) addBox(parent, wallMat, .28, .75, d + .2, rx, baseY + h + .75, cz);
        addBox(parent, M.steelGalv, 2.8, 1.1, 1.8, cx - w * .26, baseY + h + .95, cz - d * .22);
      } else {
        // Pitched corrugated gable roof + monitor skylight lantern + spinning exhaust turbines + rooftop chiller
        const ridgeH = 1.75;
        const slopeHalf = (d / 2) + .82;
        const slopeLen = Math.hypot(slopeHalf, ridgeH);
        const slopeAng = Math.atan2(ridgeH, slopeHalf);
        for (const side of [-1, 1]) {
          const slope = new Mesh(getWorldBoxGeo(w + 1.3, .20, slopeLen, 3.0), roofMat);
          slope.position.set(cx, baseY + h + ridgeH / 2 + .06, cz + side * (slopeHalf / 2));
          slope.rotation.x = side * slopeAng;
          slope.receiveShadow = true; slope.matrixAutoUpdate = false; slope.updateMatrix();
          parent.add(slope);
        }
        addBox(parent, M.steelDark, w * .68, .86, 1.75, cx, baseY + h + ridgeH + .36, cz);
        addBox(parent, M.glass, w * .64, .44, 1.82, cx, baseY + h + ridgeH + .38, cz);
        addBox(parent, M.steelGalv, w * .72, .16, 2.05, cx, baseY + h + ridgeH + .84, cz);
        for (const tx of [cx - w * .28, cx + w * .28]) {
          addCyl(parent, M.steelGalv, .38, .65, tx, baseY + h + ridgeH + .28, cz);
          const turb = new Group(); turb.userData.noBatch = true; turb.position.set(tx, baseY + h + ridgeH + .74, cz);
          addCyl(turb, M.steelGalv, .52, .42, 0, 0, 0);
          addBox(turb, M.steelDark, 1.08, .32, .12, 0, 0, 0);
          addBox(turb, M.steelDark, .12, .32, 1.08, 0, 0, 0);
          parent.add(turb);
          updaters.push(dt => { turb.rotation.y += dt * 3.4; });
        }
        addBox(parent, M.steelGalv, 3.4, 1.35, 2.2, cx - w * .22, baseY + h + .92, cz - d * .18);
      }

      // Recessed clerestory multi-pane windows along north & south walls
      for (let wx = x0 + 3.8; wx < x1 - 3.2; wx += 5.4) {
        for (const fz of [z0 - .05, z1 + .05]) {
          addBox(parent, M.steelDark, 3.3, 1.36, .26, wx, baseY + h - 1.48, fz);
          addBox(parent, M.glass, 2.96, 1.06, .30, wx, baseY + h - 1.48, fz);
          addBox(parent, M.steelDark, .08, 1.06, .32, wx, baseY + h - 1.48, fz);
          addBox(parent, M.concrete, 3.5, .15, .38, wx, baseY + h - 2.18, fz);
        }
      }

      // Open loading-bay frame, rubber dock bumpers, tension-rod steel canopy, wall-pack lamps & crisp 1:1 signboard
      const dx = isEast ? x1 + .06 : (isNorth || isSouth ? cx : x0 - .06);
      const dz = isNorth ? z0 - .06 : (isSouth ? z1 + .06 : cz);
      const rotDoor = (isNorth || isSouth) ? 0 : Math.PI / 2;
      const doorG = new Group();
      doorG.position.set(dx, baseY, dz);
      doorG.rotation.y = rotDoor + (isNorth ? Math.PI : (isEast ? 0 : Math.PI));
      addBox(doorG, M.steelDark, .30, doorH + .24, .48, -doorW / 2 - .14, doorH / 2, 0);
      addBox(doorG, M.steelDark, .30, doorH + .24, .48, doorW / 2 + .14, doorH / 2, 0);
      addBox(doorG, M.steelGalv, doorW + .58, .66, .58, 0, doorH + .28, .08);
      addBox(doorG, M.hazard, doorW + .44, .24, .60, 0, doorH - .05, .10);
      addBox(doorG, M.steelDark, doorW + 1.6, .22, 2.45, 0, doorH + .68, 1.22);
      for (const bx of [-doorW / 2 - .45, doorW / 2 + .45]) {
        addCyl(doorG, M.yellowPaint, .12, 1.08, bx, .54, .92);
        addBox(doorG, M.steelDark, .26, .88, .32, bx * .92, .95, .28);
        const rod = addBox(doorG, M.steelGalv, .055, .055, 2.35, bx, doorH + 1.38, 1.15);
        rod.rotation.x = .54; rod.updateMatrix();
        addBox(doorG, M.glassWarm, .42, .22, .16, bx * 1.18, doorH + .15, .24);
      }
      const signM = new Mesh(boxGeo, makeSignMat(title, 'SALTLINE PORT AUTHORITY', signBg));
      signM.scale.set(Math.min(7.8, Math.max(5.0, (isNorth || isSouth ? w : d) * .48)), 1.08, .08);
      signM.position.set(0, h - .82, .20);
      doorG.add(signM);
      doorG.matrixAutoUpdate = false; doorG.updateMatrix();
      parent.add(doorG);

      // REAL FURNISHED INTERIOR using Area-1 world.props.build() assets (shelves, crates, forklifts, generators, workbenches!)
      const fy = baseY + .06;
      const propParent = sec.detail || parent;
      if (interiorKind === 'cold_storage') {
        placePortProp(sec, propParent, 'shelf_rack', x0 + 5.0, fy, z0 + 2.4, 0);
        placePortProp(sec, propParent, 'shelf_rack', x0 + 11.5, fy, z0 + 2.4, 0);
        placePortProp(sec, propParent, 'shelf_rack', x0 + 5.0, fy, z1 - 2.4, Math.PI);
        placePortProp(sec, propParent, 'shelf_rack', x0 + 11.5, fy, z1 - 2.4, Math.PI);
        placePortProp(sec, propParent, 'pallet_stack', cx - 2.5, fy, cz - 3.2, .12);
        placePortProp(sec, propParent, 'crate_stack', cx + 4.5, fy, z0 + 3.0, -.08);
        placePortProp(sec, propParent, 'ibc_tote', x0 + 3.2, fy, cz, .05);
        placePortProp(sec, propParent, 'forklift', cx + 7.5, fy, cz + 2.2, Math.PI * .78);
        placePortProp(sec, propParent, 'floodlight_stand', x1 - 4.2, fy, z0 + 2.6, Math.PI * .7);
        placePortProp(sec, propParent, 'reefer_unit', x0 - 1.6, baseY, cz, Math.PI / 2);
      } else if (interiorKind === 'clinic') {
        // Interior triage counter, partition wall, medical supply shelves, emergency generator & cots
        addBox(propParent, M.steelWorn, 6.5, 1.05, .95, cx - 4.0, fy + .52, cz + 1.5);
        addBox(propParent, M.glassCyan, 1.4, .55, .12, cx - 4.0, fy + 1.32, cz + 1.35);
        for (const bx of [cx + 5.5, cx + 10.5, cx + 15.5]) {
          addBox(propParent, M.steelGalv, 1.1, .68, 2.2, bx, fy + .34, z1 - 4.8);
          addBox(propParent, M.whitePaint, 1.02, .16, 2.1, bx, fy + .76, z1 - 4.8); // Triage beds
        }
        placePortProp(sec, propParent, 'shelf_rack', x0 + 4.5, fy, z1 - 2.6, Math.PI);
        placePortProp(sec, propParent, 'shelf_rack', x0 + 10.5, fy, z1 - 2.6, Math.PI);
        placePortProp(sec, propParent, 'cardboard_boxes', x0 + 3.5, fy, z0 + 3.5, .2);
        placePortProp(sec, propParent, 'floodlight_stand', cx + 2.0, fy, z0 + 4.0, .4);
        placePortProp(sec, propParent, 'generator', x0 - 2.4, baseY, cz, Math.PI / 2);
      } else {
        // Warehouse / Pump House / Marine Workshop interior: machinery, pipe stacks, shelves, forklift, tool carts & barrels
        placePortProp(sec, propParent, 'generator', x0 + 4.8, fy, z0 + 3.6, 0);
        placePortProp(sec, propParent, 'shelf_rack', cx - 2.0, fy, z0 + 2.4, 0);
        placePortProp(sec, propParent, 'shelf_rack', cx + 5.0, fy, z0 + 2.4, 0);
        placePortProp(sec, propParent, 'pipe_stack', x0 + 6.5, fy, z1 - 3.6, .04);
        placePortProp(sec, propParent, 'cable_reel', cx + 2.5, fy, z1 - 3.4, .5);
        placePortProp(sec, propParent, 'toolbox_cart', cx - 5.5, fy, cz + 1.5, .25);
        placePortProp(sec, propParent, 'forklift', cx + 6.0, fy, cz + 1.8, -Math.PI / 2);
        placePortProp(sec, propParent, 'barrel', x1 - 4.2, fy, z0 + 2.6, 0, { color: 'blue' });
        placePortProp(sec, propParent, 'barrel', x1 - 3.2, fy, z0 + 2.9, .4, { color: 'red' });
        placePortProp(sec, propParent, 'floodlight_stand', x1 - 4.5, fy, z1 - 3.0, Math.PI * 1.2);
      }

      // Reference Photo 3 Architectural Detail: bright orange steel service door + yellow exterior steel staircase with handrails
      const stSideZ = isNorth ? z1 + .05 : z0 - .05;
      const stSign = isNorth ? 1 : -1;
      const stX = x0 + Math.min(6.2, w * .26);
      addBox(parent, M.safetyOrange, 1.35, 2.35, .18, stX, baseY + 2.95, stSideZ);
      addBox(parent, M.steelDark, 1.55, .14, .26, stX, baseY + 4.18, stSideZ + stSign * .06);
      addBox(parent, M.steelGalv, 2.2, .14, 1.35, stX, baseY + 1.72, stSideZ + stSign * .72); // Upper landing
      addBox(parent, M.yellowPaint, 2.24, .08, .08, stX, baseY + 2.76, stSideZ + stSign * 1.36); // Top rail
      addBox(parent, M.yellowPaint, 2.24, .06, .06, stX, baseY + 2.26, stSideZ + stSign * 1.36); // Mid rail
      for (const sx of [-1.04, 1.04]) addBox(parent, M.yellowPaint, .08, 1.05, .08, stX + sx, baseY + 2.24, stSideZ + stSign * 1.36);
      for (let s = 0; s < 7; s++) {
        const sy = baseY + .24 + s * .22;
        const stepX = stX + 1.15 + (6 - s) * .36;
        addBox(parent, M.steelGalv, .34, .08, 1.15, stepX, sy, stSideZ + stSign * .68);
      }
      const railSlope = addBox(parent, M.yellowPaint, 2.95, .07, .07, stX + 2.35, baseY + 1.92, stSideZ + stSign * 1.24);
      railSlope.rotation.z = -.56; railSlope.updateMatrix();
      addBox(parent, M.yellowPaint, .08, 1.05, .08, stX + 3.55, baseY + .55, stSideZ + stSign * 1.24);
    }

    // =========================================================================
    // REAL-WORLD PORT REFERENCE LANDMARKS (4 Reference Photos):
    //   1. Red-and-White RTG Straddle Gantry Cranes + Semi-Trailer Container Trucks
    //   2. Red-and-White Lattice Ship-to-Shore (STS) Deep-Water Quay Cranes
    //   3. Triple Steel Exhaust Flue Stack Lattice Tower + Outdoor Chiller Fan Deck
    //   4. Hyperbolic Concrete Cooling Towers (LatheGeometry) + 38m Red/White Smokestacks + Conveyor Gallery
    // =========================================================================
    // Area-1-Grade Multi-Story Walkable Control Tower (replaces stacked-box ATC & Rail Signal Towers!)
    function addControlTower(sec, parent, {
      x, z, baseH = 11.0, cabW = 9.4, cabD = 9.4, title = 'CONTROL TOWER', signBg = '#1b303d', hasRadar = true,
    }) {
      const g = new Group();
      g.position.set(x, .16, z);
      const shaftW = cabW * .66, shaftD = cabD * .66;
      const hw = shaftW / 2, hd = shaftD / 2;
      addBox(g, M.concreteDirty, shaftW + 1.6, .75, shaftD + 1.6, 0, .375, 0);
      addBox(g, M.concrete, shaftW, baseH, shaftD, 0, baseH / 2, 0);
      for (const sx of [-hw, hw]) {
        for (const sz of [-hd, hd]) addBox(g, M.steelDark, .42, baseH + .4, .42, sx, baseH / 2, sz);
      }
      for (let fy = 3.4; fy < baseH - 1.2; fy += 3.4) {
        addBox(g, M.concreteDirty, shaftW + .36, .34, shaftD + .36, 0, fy, 0);
        for (const sx of [-hw - .04, hw + .04]) {
          addBox(g, M.steelDark, .16, 1.5, 1.9, sx, fy - 1.5, 0);
          addBox(g, smokedPane, .20, 1.28, 1.66, sx, fy - 1.5, 0);
        }
      }
      addBox(g, M.safetyOrange, 1.35, 2.35, .18, 0, 1.55, hd + .06);
      addBox(g, M.steelDark, 2.2, .16, 1.4, 0, 2.85, hd + .72);
      const flights = Math.max(2, Math.floor(baseH / 3.4));
      for (let f = 0; f < flights; f++) {
        const y0 = .4 + f * 3.2;
        const side = f % 2 === 0 ? 1 : -1;
        const stZ = side * (hd + .85);
        addBox(g, M.steelGalv, 1.6, .14, 1.4, side * (hw + .55), y0 + 3.0, stZ);
        addBox(g, M.yellowPaint, 1.65, .08, .08, side * (hw + .55), y0 + 4.05, stZ + side * .68);
        for (let s = 0; s < 6; s++) {
          const sx = -hw + (s / 5) * shaftW;
          addBox(g, M.steelGalv, .46, .08, 1.15, sx, y0 + .45 + s * .46, stZ);
        }
        const rail = addBox(g, M.yellowPaint, shaftW + .8, .08, .08, 0, y0 + 2.4, stZ + side * .56);
        rail.rotation.z = .42; rail.updateMatrix();
      }
      const deckW = cabW + 2.4, deckD = cabD + 2.4;
      addBox(g, M.steelDark, deckW, .45, deckD, 0, baseH + .22, 0);
      for (const sx of [-hw, hw]) {
        for (const sz of [-hd, hd]) {
          const brace = addBox(g, M.steelGalv, .28, 2.4, .28, sx * 1.18, baseH - .7, sz * 1.18);
          brace.rotation.set(sz > 0 ? .52 : -.52, 0, sx > 0 ? -.52 : .52); brace.updateMatrix();
        }
      }
      for (const rz of [-deckD / 2 + .08, deckD / 2 - .08]) {
        addBox(g, M.yellowPaint, deckW, .08, .08, 0, baseH + 1.42, rz);
        for (let px = -deckW / 2; px <= deckW / 2 + .01; px += 2.2) addBox(g, M.yellowPaint, .07, 1.05, .07, px, baseH + .92, rz);
      }
      for (const rx of [-deckW / 2 + .08, deckW / 2 - .08]) {
        addBox(g, M.yellowPaint, .08, .08, deckD, rx, baseH + 1.42, 0);
        for (let pz = -deckD / 2; pz <= deckD / 2 + .01; pz += 2.2) addBox(g, M.yellowPaint, .07, 1.05, .07, rx, baseH + .92, pz);
      }
      const cabY = baseH + .45, cabH = 3.4;
      addBox(g, M.concreteDirty, cabW, .92, cabD, 0, cabY + .46, 0);
      addBox(g, M.glass, cabW - .24, cabH - 1.1, cabD - .24, 0, cabY + .92 + (cabH - 1.1) / 2, 0);
      for (const sx of [-cabW / 2, 0, cabW / 2]) {
        for (const sz of [-cabD / 2, cabD / 2]) addBox(g, M.steelDark, .22, cabH, .22, sx, cabY + cabH / 2, sz);
      }
      for (const sz of [-cabD / 2, 0, cabD / 2]) {
        for (const sx of [-cabW / 2, cabW / 2]) addBox(g, M.steelDark, .22, cabH, .22, sx, cabY + cabH / 2, sz);
      }
      addBox(g, M.steelDark, cabW * .56, 1.05, 1.2, 0, cabY + .95, cabD * .18);
      addBox(g, M.glassCyan, cabW * .44, .52, .12, 0, cabY + 1.65, cabD * .18);
      addBox(g, M.glassWarm, cabW * .52, .08, cabD * .52, 0, cabY + cabH - .18, 0);
      const roofY = cabY + cabH;
      addBox(g, M.steelDark, cabW + 1.5, .52, cabD + 1.5, 0, roofY + .26, 0);
      addBox(g, M.steelGalv, cabW + 1.7, .16, cabD + 1.7, 0, roofY + .56, 0);
      const signM = new Mesh(boxGeo, makeSignMat(title, 'SALTLINE OPERATIONS', signBg));
      signM.scale.set(Math.min(6.4, cabW * .78), .82, .10);
      signM.position.set(0, baseH + .92, cabD / 2 + .12);
      g.add(signM);
      addBox(g, M.steelWorn, 2.2, 1.1, 1.8, -cabW * .26, roofY + 1.05, -cabD * .22);
      addCyl(g, M.steelGalv, .08, 4.2, cabW * .34, roofY + 2.5, -cabD * .32);
      const beacons = [];
      for (const [bx, bz] of [[-cabW / 2 - .5, -cabD / 2 - .5], [cabW / 2 + .5, -cabD / 2 - .5], [-cabW / 2 - .5, cabD / 2 + .5], [cabW / 2 + .5, cabD / 2 + .5]]) {
        const bMat = M.redCore.clone ? M.redCore.clone() : M.redCore;
        const bm = new Mesh(boxGeo, bMat);
        bm.scale.set(.34, .44, .34); bm.position.set(bx, roofY + .82, bz);
        g.add(bm); beacons.push(bm);
      }
      let radarBar = null;
      if (hasRadar) {
        addCyl(g, M.steelDark, .38, 1.5, 0, roofY + 1.2, 0);
        radarBar = new Group(); radarBar.userData.noBatch = true; radarBar.position.set(0, roofY + 2.1, 0);
        addBox(radarBar, M.craneWhite, 4.6, .36, .48, 0, 0, 0);
        addBox(radarBar, M.hazard, 4.7, .12, .52, 0, -.20, 0);
        g.add(radarBar);
      }
      let blinkT = (Math.abs(x) * .17) % 2;
      updaters.push(dt => {
        blinkT += dt;
        const on = Math.sin(blinkT * 3.8) > -.15;
        for (const bm of beacons) bm.visible = on;
        if (radarBar) radarBar.rotation.y += dt * 1.95;
      });
      parent.add(g);
      if (sec) {
        sec.colliderSpecs.push({
          min: new Vector3(x - hw - .8, .16, z - hd - .8),
          max: new Vector3(x + hw + .8, roofY + .6, z + hd + .8),
          surface: 'concrete',
        });
      }
    }

    function addRedWhiteRTGCrane(sec, parent, x, z, span = 14.0, height = 13.5, yaw = 0) {
      const g = new Group();
      g.position.set(x, .16, z);
      g.rotation.y = yaw;
      const hs = span / 2;
      for (const sx of [-hs, hs]) {
        addBox(g, M.craneRed, 1.15, 1.05, 8.6, sx, .95, 0);
        for (const wz of [-3.4, -1.6, 1.6, 3.4]) {
          addCyl(g, M.steelDark, .62, .48, sx, .62, wz, 0, Math.PI / 2);
          addCyl(g, M.steelGalv, .28, .52, sx, .62, wz, 0, Math.PI / 2);
        }
        for (const lz of [-2.4, 2.4]) addBox(g, M.craneWhite, .82, height - 2.4, .82, sx, 1.45 + (height - 2.4) / 2, lz);
        addBox(g, M.craneWhite, .72, .72, 5.4, sx, height * .56, 0);
        addBox(g, M.craneRed, 1.05, 1.15, 6.2, sx, height - .6, 0);
      }
      for (const gz of [-2.1, 2.1]) addBox(g, M.craneRed, span + 1.8, 1.35, .86, 0, height, gz);
      addBox(g, M.steelDark, span + 1.2, .16, 3.6, 0, height + .72, 0);
      for (const rz of [-2.55, 2.55]) {
        addBox(g, M.yellowPaint, span + 1.4, .08, .08, 0, height + 1.68, rz);
        for (let px = -hs; px <= hs; px += 2.6) addBox(g, M.yellowPaint, .08, .96, .08, px, height + 1.2, rz);
      }
      addCyl(g, M.yellowPaint, 1.25, .65, hs + .85, 3.6, -2.5, Math.PI / 2, 0);
      const trolley = new Group(); trolley.userData.noBatch = true;
      trolley.position.set(0, height - .85, 0);
      addBox(trolley, M.steelDark, 3.2, .95, 3.4, 0, 0, 0);
      addBox(trolley, M.craneWhite, 2.2, 1.75, 2.0, 0, -1.3, 2.2);
      addBox(trolley, M.glassCyan, 1.85, .92, .12, 0, -1.25, 3.22);
      const hoist = new Group();
      hoist.position.set(0, -4.4, 0);
      for (const cx of [-.8, .8]) addCyl(hoist, M.steelGalv, .05, 5.2, cx, 2.4, 0);
      addBox(hoist, M.hazard, 2.6, .55, 6.2, 0, 0, 0);
      addBox(hoist, ((Math.abs(x + z) | 0) % 2 === 0) ? M.cargoTeal : M.cargoNavy, 2.45, 2.4, 6.0, 0, -1.5, 0);
      trolley.add(hoist);
      g.add(trolley);
      let rtgClock = (Math.abs(x * .21 + z * .13)) % 12;
      const travel = Math.max(1.8, hs - 2.6);
      updaters.push(dt => {
        rtgClock += dt * .48;
        trolley.position.x = Math.sin(rtgClock) * travel;
        hoist.position.y = -4.2 + Math.cos(rtgClock * 2.0) * 1.15;
      });
      parent.add(g);
      if (sec) {
        const c = Math.cos(yaw), s = Math.sin(yaw);
        for (const sx of [-hs, hs]) {
          const wx = x + sx * c, wz = z - sx * s;
          sec.colliderSpecs.push({ min: new Vector3(wx - 1.1, .16, wz - 4.4), max: new Vector3(wx + 1.1, 4.5, wz + 4.4), surface: 'metal' });
        }
      }
    }

    function addRedWhiteSTSCrane(sec, parent, x, z) {
      const g = new Group();
      g.position.set(x, .16, z);
      for (const px of [-5.2, 5.2]) {
        addBox(g, M.craneRed, 1.6, 1.3, 13.8, px, .65, 0);
        for (const pz of [-5.2, 5.2]) addBox(g, M.craneRed, 1.15, 19.5, 1.15, px, 10.4, pz);
        addBox(g, M.craneWhite, .92, .92, 11.4, px, 11.2, 0);
        const br1 = addBox(g, M.craneWhite, .36, 11.5, .36, px, 15.0, 0);
        br1.rotation.x = .66; br1.updateMatrix();
        const br2 = addBox(g, M.craneWhite, .36, 11.5, .36, px, 15.0, 0);
        br2.rotation.x = -.66; br2.updateMatrix();
      }
      for (const pz of [-5.2, 5.2]) {
        addBox(g, M.craneRed, 11.8, 1.2, 1.1, 0, 19.8, pz);
        addBox(g, M.craneWhite, 11.2, .75, .75, 0, 12.2, pz);
      }
      addBox(g, M.craneWhite, 8.6, 4.4, 7.6, -1.8, 22.4, 0);
      addBox(g, M.steelDark, 8.8, .35, 7.8, -1.8, 24.75, 0);
      for (const pz of [-4.8, 4.8]) {
        const af1 = addBox(g, M.craneRed, .85, 14.5, .85, -1.6, 26.8, pz);
        af1.rotation.z = -.24; af1.updateMatrix();
        const af2 = addBox(g, M.craneRed, .85, 14.5, .85, 2.2, 26.8, pz);
        af2.rotation.z = .24; af2.updateMatrix();
      }
      addBox(g, M.craneRed, 1.4, 1.2, 11.0, .3, 33.4, 0);
      for (const bz of [-5.1, 5.1]) addBox(g, M.redCore, .42, .52, .42, .3, 34.3, bz);
      for (const bz of [-2.4, 2.4]) addBox(g, M.craneRed, 38.0, 1.35, .78, 8.0, 19.8, bz);
      for (let bx = -9; bx <= 25; bx += 4.2) addBox(g, M.craneWhite, .42, .42, 5.2, bx, 20.55, 0);
      const addStay = (x0, y0, x1, y1, zOff) => {
        const len = Math.hypot(x1 - x0, y1 - y0);
        const m = addBox(g, M.craneWhite, len, .26, .26, (x0 + x1) / 2, (y0 + y1) / 2, zOff);
        m.rotation.z = Math.atan2(y1 - y0, x1 - x0); m.updateMatrix();
      };
      for (const sz of [-2.4, 2.4]) {
        addStay(.3, 33.4, 24.0, 20.2, sz);
        addStay(.3, 33.4, 13.5, 20.2, sz);
        addStay(.3, 33.4, -10.0, 20.2, sz);
      }
      const stsTrolley = new Group(); stsTrolley.userData.noBatch = true;
      stsTrolley.position.set(12.5, 17.6, 0);
      addBox(stsTrolley, M.craneWhite, 3.2, 2.1, 2.6, 0, 0, 0);
      addBox(stsTrolley, M.glassCyan, 2.8, 1.0, 2.7, 0, -.1, 0);
      const stsHoist = new Group();
      stsHoist.position.set(0, -6.5, 0);
      for (const tz of [-1.8, 1.8]) addCyl(stsHoist, M.steelGalv, .06, 6.8, 0, 3.2, tz);
      addBox(stsHoist, M.hazard, 2.8, .65, 6.4, 0, 0, 0);
      addBox(stsHoist, M.safetyOrange, 2.5, 2.5, 6.1, 0, -1.55, 0);
      stsTrolley.add(stsHoist);
      g.add(stsTrolley);
      let stsClock = (Math.abs(z) * .11) % 10;
      updaters.push(dt => {
        stsClock += dt * .32;
        stsTrolley.position.x = 11.5 + Math.sin(stsClock) * 11.0;
        stsHoist.position.y = -6.2 + Math.cos(stsClock * 2.0) * 1.9;
      });
      parent.add(g);
      if (sec) {
        for (const px of [-5.2, 5.2]) {
          sec.colliderSpecs.push({ min: new Vector3(x + px - 1.1, .16, z - 6.8), max: new Vector3(x + px + 1.1, 5.0, z + 6.8), surface: 'metal' });
        }
      }
    }

    function addIndustrialExhaustTower(sec, parent, x, z, ductDir = -1) {
      const g = new Group();
      g.position.set(x, .16, z);
      addBox(g, M.concrete, 4.6, .45, 9.6, 0, .22, 0);
      for (const sz of [-3.0, 0, 3.0]) {
        addCyl(g, M.steelDark, .66, 17.5, 0, 9.1, sz);
        addCyl(g, M.craneWhite, .70, 2.6, 0, 19.0, sz);
        addCyl(g, M.steelDark, .68, 1.4, 0, 21.0, sz);
        addBox(g, M.steelGalv, 4.2, .95, .95, ductDir * 2.4, 2.8, sz);
      }
      for (const lx of [-1.75, 1.75]) {
        for (const lz of [-4.4, -1.5, 1.5, 4.4]) addBox(g, M.steelGalv, .18, 19.0, .18, lx, 9.6, lz);
      }
      for (const py of [6.2, 12.2, 18.0]) {
        addBox(g, M.steelDark, 3.8, .16, 9.2, 0, py, 0);
        for (const rx of [-1.85, 1.85]) addBox(g, M.yellowPaint, .09, .09, 9.2, rx, py + 1.05, 0);
        for (const rz of [-4.55, 4.55]) addBox(g, M.yellowPaint, 3.8, .09, .09, 0, py + 1.05, rz);
        for (const rx of [-1.85, 1.85]) for (const rz of [-4.55, 0, 4.55]) addBox(g, M.yellowPaint, .08, 1.05, .08, rx, py + .52, rz);
      }
      const chX = -ductDir * 5.8;
      addBox(g, M.concrete, 6.2, .35, 8.6, chX, .18, 0);
      if (sec) {
        sec.colliderSpecs.push({ min: new Vector3(x + chX - 3.1, 0, z - 4.35), max: new Vector3(x + chX + 3.1, 4.6, z + 4.35), surface: 'metal' });
        sec.colliderSpecs.push({ min: new Vector3(x + chX - 1.5, 0, z - 7.7), max: new Vector3(x + chX + 1.5, 7.8, z - 4.7), surface: 'metal' });
      }
      for (const cx of [chX - 2.6, chX + 2.6]) for (const cz of [-3.8, 0, 3.8]) addBox(g, M.steelGalv, .26, 3.6, .26, cx, 1.95, cz);
      addBox(g, M.steelWorn, 5.6, 1.25, 8.0, chX, 3.9, 0);
      const fans = [];
      for (const fx of [chX - 1.35, chX + 1.35]) {
        for (const fz of [-2.4, 0, 2.4]) {
          addCyl(g, M.steelDark, .82, .45, fx, 4.72, fz);
          const rotor = new Group(); rotor.userData.noBatch = true; rotor.position.set(fx, 4.86, fz);
          addBox(rotor, M.steelGalv, 1.42, .07, .18, 0, 0, 0);
          addBox(rotor, M.steelGalv, .18, .07, 1.42, 0, 0, 0);
          g.add(rotor); fans.push(rotor);
        }
      }
      updaters.push(dt => {
        for (let i = 0; i < fans.length; i++) fans[i].rotation.y += dt * (4.8 + (i % 3) * .6);
      });
      addCyl(g, M.craneWhite, 1.45, 7.6, chX, 3.9, -6.2);
      parent.add(g);
      if (sec) {
        sec.colliderSpecs.push({ min: new Vector3(x - 2.3, .16, z - 4.8), max: new Vector3(x + 2.3, 18.5, z + 4.8), surface: 'metal' });
      }
    }

    function addPowerPlantSkyline(sec, parent, x, z) {
      const g = new Group();
      g.position.set(x, .16, z);
      let coolingGeo = null;
      if (THREE.LatheGeometry && THREE.Vector2) {
        const pts = [];
        const towerH = 23.5;
        for (let i = 0; i <= 18; i++) {
          const t = i / 18;
          const r = 4.55 * Math.sqrt(1 + Math.pow((t - .72) / .44, 2));
          pts.push(new THREE.Vector2(r, 2.2 + t * towerH));
        }
        coolingGeo = new THREE.LatheGeometry(pts, 28);
        customGeos.push(coolingGeo);
      }
      // Soft radial-gradient volumetric steam sprite texture (replaces hard-edged geometric spheres!)
      let steamTex = null;
      try {
        const sc = document.createElement('canvas');
        sc.width = 128; sc.height = 128;
        const sctx = sc.getContext?.('2d');
        if (sctx && THREE.CanvasTexture) {
          sctx.clearRect(0, 0, 128, 128);
          const lobes = [[64,64,56,.42],[48,58,38,.28],[80,68,36,.26],[62,48,34,.24],[58,76,34,.22]];
          for (const [lx, ly, lr, la] of lobes) {
            const grd = sctx.createRadialGradient(lx, ly, 4, lx, ly, lr);
            grd.addColorStop(0, `rgba(224,233,238,${la})`);
            grd.addColorStop(0.55, `rgba(210,222,230,${la * .48})`);
            grd.addColorStop(1, 'rgba(200,214,224,0)');
            sctx.fillStyle = grd;
            sctx.fillRect(0, 0, 128, 128);
          }
          steamTex = new THREE.CanvasTexture(sc);
        }
      } catch {}
      const steamPuffs = [];
      for (const ox of [0, 21.5]) {
        if (coolingGeo) {
          const shell = new Mesh(coolingGeo, M.coolingConcrete);
          shell.position.set(ox, 0, 0);
          shell.receiveShadow = true; shell.matrixAutoUpdate = false; shell.updateMatrix();
          g.add(shell);
        } else {
          addCyl(g, M.coolingConcrete, 6.2, 24.0, ox, 13.5, 0);
        }
        addCyl(g, M.concreteDirty, 7.95, .65, ox, .32, 0);
        for (let k = 0; k < 12; k++) {
          const ang = (k / 12) * Math.PI * 2;
          const px = ox + Math.cos(ang) * 7.45, pz = Math.sin(ang) * 7.45;
          addBox(g, M.concrete, .38, 2.5, .38, px, 1.35, pz);
        }
        addCyl(g, M.concreteDirty, 5.45, .55, ox, 25.7, 0);
        for (let p = 0; p < 6; p++) {
          const mat = (THREE.SpriteMaterial && steamTex)
            ? new THREE.SpriteMaterial({ map: steamTex, transparent: true, opacity: .38, depthWrite: false })
            : new MeshBasicMaterial({ color: 0xdce6ec, transparent: true, opacity: .14, depthWrite: false });
          const puff = (THREE.Sprite && steamTex) ? new THREE.Sprite(mat) : new Mesh(sphGeo, mat);
          puff.position.set(ox, 26.2 + p * 3.0, 0);
          g.add(puff);
          steamPuffs.push({ mesh: puff, mat, ox, phase: p / 6 + (ox > 0 ? .09 : 0), driftZ: (p % 2 ? 1 : -1) * 1.6 });
        }
        if (sec) {
          sec.colliderSpecs.push({ min: new Vector3(x + ox - 7.8, .16, z - 7.8), max: new Vector3(x + ox + 7.8, 25.0, z + 7.8), surface: 'concrete' });
        }
      }
      updaters.push(dt => {
        for (const sp of steamPuffs) {
          sp.phase = (sp.phase + dt * .11) % 1;
          const t = sp.phase;
          sp.mesh.position.set(sp.ox + t * 11.5, 25.6 + t * 17.0, Math.sin(t * 4.2) * sp.driftZ);
          const sc = 8.5 + t * 15.5;
          sp.mesh.scale.set(sc, sc * .78, sc);
          sp.mat.opacity = Math.sin(t * Math.PI) * .46;
        }
      });
      const addStripedStack = (sx, sz, totalH = 38.0) => {
        addCyl(g, M.concreteDirty, 2.65, 3.2, sx, 1.6, sz);
        addCyl(g, M.concrete, 1.95, totalH * .60, sx, 3.2 + (totalH * .60) / 2, sz);
        const bandStart = 3.2 + totalH * .60;
        const bandH = (totalH * .32) / 5;
        for (let b = 0; b < 5; b++) {
          const r = 1.65 - b * .09;
          addCyl(g, b % 2 === 0 ? M.craneRed : M.craneWhite, r, bandH, sx, bandStart + (b + .5) * bandH, sz);
        }
        addBox(g, M.redCore, .46, .52, .46, sx, bandStart + 5 * bandH + .35, sz);
      };
      addStripedStack(31.5, -5.5, 36.0);
      addStripedStack(31.5, 5.5, 34.0);
      const conv = addBox(g, M.yellowPaint, 16.5, 2.0, 2.2, 32.0, 8.8, 8.5);
      conv.rotation.set(.32, Math.PI / 2, 0); conv.updateMatrix();
      addBox(g, M.steelGalv, .45, 7.6, .45, 32.0, 3.8, 3.0);
      addBox(g, M.steelGalv, .45, 11.2, .45, 32.0, 5.6, 12.2);
      parent.add(g);
    }

    function addSemiTrailerTruck(sec, parent, x, y, z, yaw, containerMat = M.craneRed) {
      const g = new Group();
      g.position.set(x, y, z);
      g.rotation.y = yaw;
      // Cab-over semi-tractor (front at +Z)
      addBox(g, M.craneWhite, 2.48, 2.35, 2.45, 0, 1.88, 6.25);
      addBox(g, smokedPane, 2.24, .92, .10, 0, 2.35, 7.49); // Windshield
      addBox(g, M.steelDark, 2.15, .62, .10, 0, 1.38, 7.49); // Radiator grille
      addBox(g, M.steelGalv, 2.52, .34, .28, 0, .62, 7.52);  // Front steel bumper
      for (const sx of [-.92, .92]) {
        addBox(g, M.glassWarm, .36, .18, .08, sx, .92, 7.52);
        addBox(g, M.steelDark, .12, .52, .12, sx * 1.48, 2.25, 7.15); // Side mirrors
      }
      addCyl(g, M.steelGalv, .09, 2.6, 1.24, 2.2, 4.95); // Vertical exhaust stack
      // Flatbed steel semi-trailer chassis + 40ft container load
      addBox(g, M.steelDark, 2.44, .32, 12.4, 0, 1.12, -.95);
      addBox(g, containerMat, 2.44, 2.58, 12.0, 0, 2.58, -1.05);
      addBox(g, M.hazard, 2.46, .20, .08, 0, 1.08, -7.16); // Rear safety bumper
      for (const wz of [6.4, 3.8, -4.6, -5.9]) {
        for (const sx of [-1.14, 1.14]) {
          addCyl(g, M.steelDark, .52, .36, sx, .52, wz, 0, Math.PI / 2);
          addCyl(g, M.steelGalv, .24, .39, sx, .52, wz, 0, Math.PI / 2);
        }
      }
      g.matrixAutoUpdate = false; g.updateMatrix();
      parent.add(g);
      addRotatedCollider(sec || parent, x, y, z, -1.30, 1.30, -7.20, 7.60, y + 3.90, yaw, 'metal');
    }

    // =========================================================================
    // HIGH-DENSITY MARITIME-INDUSTRIAL FILL BUILDERS (ZERO EMPTY CONCRETE SLABS!)
    // =========================================================================
    function addMooredContainerShip(parent, x, z) {
      const g = new Group();
      g.position.set(x, 0, z);
      // 112m Panamax Hull docked along East Quay under STS cranes (Reference Photo 2)
      addBox(g, M.cargoNavy, 22.0, 9.2, 92.0, 0, 2.2, 0);
      addBox(g, M.craneRed, 22.2, 2.6, 93.0, 0, -1.8, 0); // Boot-topping waterline band
      addBox(g, M.steelDark, 21.4, .45, 91.0, 0, 6.95, 0); // Main weather deck
      // Tapered Bow & Stern Forecastles
      addBox(g, M.cargoNavy, 16.5, 9.4, 12.0, 0, 2.4, -50.5);
      addBox(g, M.cargoNavy, 10.5, 9.6, 8.5, 0, 2.6, -59.5);
      addBox(g, M.craneWhite, 16.8, 1.3, 12.2, 0, 7.6, -50.5);
      addBox(g, M.cargoNavy, 19.5, 8.8, 10.0, 0, 2.0, 49.5);
      // 7-Deck White Aft Superstructure Bridge Tower + Wings + Funnel
      addBox(g, M.craneWhite, 18.6, 15.5, 11.5, 0, 14.5, 34.0);
      addBox(g, M.craneWhite, 25.4, 2.8, 4.2, 0, 22.8, 32.8); // Bridge wings
      addBox(g, smokedPane, 23.6, 1.35, .18, 0, 23.0, 30.65); // Bridge wrap windows
      addBox(g, M.craneRed, 4.2, 6.2, 5.4, 0, 24.5, 38.6); // Funnel casing
      addBox(g, M.steelDark, 4.4, 1.4, 5.6, 0, 28.0, 38.6); // Funnel exhaust cap
      addCyl(g, M.steelGalv, .28, 7.5, 0, 27.6, 33.2); // Radar mast
      addBox(g, M.steelGalv, 5.2, .22, .32, 0, 29.8, 33.2);
      // Dense 3-Tier Multi-Color Container Deck Cargo Bays (5 bays x 4 rows x 3 tiers)
      const deckMats = [M.craneRed, M.cargoTeal, M.cargoNavy, M.safetyOrange, M.craneWhite, M.cargoRust];
      for (let bay = 0; bay < 5; bay++) {
        const bz = -36 + bay * 14.2;
        for (let row = 0; row < 4; row++) {
          const bx = -7.2 + row * 4.8;
          const tiers = (bay + row) % 3 === 0 ? 2 : 3;
          for (let t = 0; t < tiers; t++) {
            const mat = deckMats[(bay * 5 + row * 3 + t * 2) % deckMats.length];
            addBox(g, mat, 4.35, 2.55, 12.2, bx, 8.35 + t * 2.62, bz);
          }
        }
      }
      g.matrixAutoUpdate = false; g.updateMatrix();
      parent.add(g);
      addPermanentCollider(new Vector3(x - 11.2, -2, z - 62), new Vector3(x + 11.2, 16, z + 55), { surface: 'metal', noNav: true });
    }

    function addContainerYardBlock(sec, parent, x0, z0, cols, rows, yaw = 0, reeferBias = false) {
      const palette = reeferBias
        ? ['white', 'white', 'teal', 'blue', 'grey', 'white']
        : ['red', 'teal', 'blue', 'orange', 'green', 'white', 'grey'];
      const c = Math.cos(yaw), s = Math.sin(yaw);
      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows; row++) {
          const lx = col * 13.4;
          const lz = row * 3.05;
          const wx = x0 + lx * c + lz * s;
          const wz = z0 - lx * s + lz * c;
          const idx = (col * 7 + row * 3) % palette.length;
          const color = palette[idx];
          placePortProp(sec, parent, 'container40', wx, .16, wz, yaw, { color, reefer: reeferBias && color === 'white' });
          if ((col + row) % 2 === 0) {
            const col2 = palette[(idx + 2) % palette.length];
            placePortProp(sec, parent, 'container40', wx, 2.76, wz, yaw, { color: col2, reefer: reeferBias && col2 === 'white' }, false);
            if ((col * 3 + row) % 4 === 0) {
              placePortProp(sec, parent, 'container20', wx, 5.36, wz, yaw, { color: palette[(idx + 4) % palette.length] }, false);
            }
          }
        }
      }
    }

    function addSubstationYard(sec, parent, x, z) {
      const g = new Group();
      g.position.set(x, .16, z);
      addBox(g, M.concreteDirty, 18.0, .28, 12.0, 0, .14, 0);
      // 3 High-Voltage Step-Up Transformers with radiator fins & ceramic bushings
      for (const tx of [-5.2, 0, 5.2]) {
        addBox(g, M.steelWorn, 3.0, 2.8, 2.4, tx, 1.65, -2.0);
        addBox(g, M.steelDark, 3.25, 2.2, .32, tx, 1.65, -.65);
        addBox(g, M.steelDark, 3.25, 2.2, .32, tx, 1.65, -3.35);
        for (const bx of [-.8, 0, .8]) {
          addCyl(g, M.craneWhite, .14, 1.35, tx + bx, 3.65, -2.0);
          addCyl(g, M.steelGalv, .22, .12, tx + bx, 3.55, -2.0);
        }
      }
      // Steel Busbar H-Frames & Perimeter Hazard Fence Posts
      for (const px of [-7.8, 0, 7.8]) {
        addBox(g, M.steelGalv, .26, 6.4, .26, px, 3.2, 2.6);
        addBox(g, M.steelGalv, .26, 6.4, .26, px, 3.2, -4.6);
      }
      addBox(g, M.steelGalv, 16.2, .22, .22, 0, 6.1, 2.6);
      addBox(g, M.steelGalv, 16.2, .22, .22, 0, 6.1, -4.6);
      for (const bx of [-5.2, 0, 5.2]) addBox(g, M.steelDark, .10, .10, 7.4, bx, 6.2, -1.0);
      addBox(g, M.hazard, 18.2, .32, .18, 0, .45, 5.9);
      g.matrixAutoUpdate = false; g.updateMatrix();
      parent.add(g);
      if (sec) {
        sec.colliderSpecs.push({ min: new Vector3(x - 9.0, .16, z - 6.0), max: new Vector3(x + 9.0, 5.5, z + 6.0), surface: 'metal' });
      }
    }

    function addBulkSiloBank(sec, parent, x, z, count = 4) {
      const g = new Group();
      g.position.set(x, .16, z);
      addBox(g, M.concrete, count * 5.8 + 2.4, .45, 7.2, 0, .22, 0);
      const startX = -((count - 1) * 5.6) / 2;
      for (let i = 0; i < count; i++) {
        const sx = startX + i * 5.6;
        addCyl(g, M.craneWhite, 2.35, 11.2, sx, 6.0, 0);
        addCyl(g, M.steelGalv, 2.48, .35, sx, 9.6, 0);
        addCyl(g, M.steelDark, 2.48, .35, sx, 2.4, 0);
        addCyl(g, M.steelGalv, 1.55, 1.4, sx, 12.2, 0);
      }
      // Overhead catwalk & yellow safety rails linking all silos
      addBox(g, M.steelDark, count * 5.6 + 1.2, .18, 1.4, 0, 12.9, 0);
      for (const rz of [-.68, .68]) addBox(g, M.yellowPaint, count * 5.6 + 1.2, .08, .08, 0, 13.85, rz);
      g.matrixAutoUpdate = false; g.updateMatrix();
      parent.add(g);
      if (sec) {
        sec.colliderSpecs.push({ min: new Vector3(x - count * 2.9, .16, z - 3.4), max: new Vector3(x + count * 2.9, 13.0, z + 3.4), surface: 'metal' });
      }
    }

    // Close-up Poly Haven CC0 PBR Industrial Assets at Berth 4 West Gate & North Entrance (well clear of Coastal Blvd lanes!)
    placeExternal(horizonRoot, 'concrete_road_barrier', -37.2, .16, -26.5, 0, 1.0);
    placeExternal(horizonRoot, 'concrete_road_barrier', -14.8, .16, -26.5, 0, 1.0);
    placeExternal(horizonRoot, 'portable_generator', -36.5, .16, -23.0, .35, 1.0);
    placeExternal(horizonRoot, 'utility_box_01', -15.5, .16, -25.0, Math.PI, 1.0);
    placeExternal(horizonRoot, 'modular_industrial_pipes_01', -103.5, .16, -8.0, Math.PI / 2, 1.0);
    placeExternal(horizonRoot, 'modular_electricity_poles', -105.0, .16, 12.0, 0, 1.0);
    placeExternal(horizonRoot, 'exterior_aircon_unit', -35.0, 1.6, -20.0, Math.PI / 2, 1.0);

    // =========================================================================
    // TIER 0 (ALWAYS VISIBLE): ZERO-OVERLAP GROUND TILES (y=0.16) + ELEVATED ROADS (y=0.205) + REAL RECESSED DRYDOCK
    // STRICTLY x <= +26! ZERO COPLANAR OVERLAPS = ZERO Z-FIGHTING / ZERO FLICKER!
    // =========================================================================
    const terrainSurface = M.concreteDirty.clone();
    terrainSurface.vertexColors = true;
    const hillsideSurface = matLib.scannedSurface('forest_floor').clone();
    hillsideSurface.vertexColors = true;
    const coarseTiles = [];
    physics.terrainHeight = terrainGen.floorAt;
    physics.terrainRay = terrainGen.intersectRay;
    for (const [west,north,east,south] of terrainGen.regions) {
      for (let x=west;x<east;x+=48) for (let z=north;z<south;z+=48) {
        const x1=Math.min(x+48,east), z1=Math.min(z+48,south);
        const tile=(spacing) => {
          const mesh = new Mesh(terrainGen.tileGeometry(x,z,x1,z1,spacing),x < -216 ? hillsideSurface : terrainSurface);
          mesh.receiveShadow = true;
          return mesh;
        };
        const coarse = tile(8);
        coarseTiles.push(coarse);
        root.add(coarse);
        // Inside the graded port all LODs are coplanar. Only the escarpment needs subdivision.
        if (x >= -216) continue;
        const parcel = makeParcel('terrain-'+x+'-'+z,(x+x1)/2,(z+z1)/2,116,82);
        parcel.onBuild = () => {
          const near = tile(2);
          near.geometry.userData.streamOwned = true;
          parcel.shell.add(near);
          coarse.visible = false;
        };
        parcel.onUnload = () => { parcel.shell.clear(); coarse.visible = true; };
      }
    }
    solidHorizon(M.concrete, 23.6, -2.5, -145, 25.4, 1.05, -30.2, 'concrete', true);
    solidHorizon(M.concrete, 23.6, -2.5, 28.2, 25.4, 1.05, 80.5, 'concrete', true);
    solidHorizon(M.concrete, 23.6, -2.5, 103.5, 25.4, 1.05, 148, 'concrete', true);
    solidHorizon(M.asphalt, -33, .165, -145, -19, .205, -30.2, 'concrete', false);
    solidHorizon(M.asphalt, -33, .165, 28.2, -19, .205, 145, 'concrete', false);
    solidHorizon(M.asphalt, -119, .165, -145, -105, .205, 135, 'concrete', false);
    solidHorizon(M.asphalt, -104.9, .165, -132, -33.1, .205, -118, 'concrete', false);
    solidHorizon(M.asphalt, -18.9, .165, -132, 22, .205, -118, 'concrete', false);
    solidHorizon(M.asphalt, -168, .165, 35, -150.5, .205, 49, 'concrete', false);
    solidHorizon(M.asphalt, -123.5, .165, 35, -119.1, .205, 49, 'concrete', false);
    solidHorizon(M.asphalt, -104.9, .165, 35, -33.1, .205, 49, 'concrete', false);
    solidHorizon(M.asphalt, -18.9, .165, 35, 20, .205, 49, 'concrete', false);
    solidHorizon(M.asphalt, -206, .165, 116, -159.6, .205, 128, 'concrete', false);
    solidHorizon(M.asphalt, -104.9, .165, 116, -33.1, .205, 128, 'concrete', false);
    for (let z = -138; z <= 128; z += 8) addBox(horizonRoot, M.yellowPaint, .18, .012, 3.6, -112, .222, z);
    for (let z = -126; z <= 120; z += 30) addStreetLamp(horizonRoot, -104.2, .205, z, -1);
    for (let x = -100; x <= -38; x += 8) addBox(horizonRoot, M.yellowPaint, 3.6, .012, .18, x, .222, -125);
    for (let x = -14; x <= 14; x += 8) addBox(horizonRoot, M.yellowPaint, 3.6, .012, .18, x, .222, -125);
    for (let x = -100; x <= -38; x += 8) addBox(horizonRoot, M.yellowPaint, 3.6, .012, .18, x, .222, 42);
    for (let x = -100; x <= -38; x += 8) addBox(horizonRoot, M.yellowPaint, 3.6, .012, .18, x, .222, 122);

    // CONTINUOUS WESTERN FORESTED CLIFF ESCARPMENT (Organic multi-elevation clusters — NO soldier-row spacing!)
    {
      const pinePositions = [];
      const rngForest = matLib?.mulberry32 ? matLib.mulberry32(7331) : (() => 0.5);
      for (let pz = -124; pz <= 140; pz += 6.2) {
        const z1 = pz + (rngForest() - 0.5) * 4.4;
        const x1 = -221.5 - rngForest() * 6.5;
        pinePositions.push([x1, terrainGen.sampleHeight(x1, z1), z1, 0.85 + rngForest() * 0.72]);
        if (rngForest() > 0.25) {
          const z2 = pz + (rngForest() - 0.5) * 5.2;
          const x2 = -227.5 - rngForest() * 9.5;
          pinePositions.push([x2, terrainGen.sampleHeight(x2, z2), z2, 1.05 + rngForest() * 0.68]);
        }
        if (rngForest() > 0.58) {
          const z3 = pz + (rngForest() - 0.5) * 4.0;
          const x3 = -217.8 - rngForest() * 3.4;
          pinePositions.push([x3, terrainGen.sampleHeight(x3, z3), z3, 0.68 + rngForest() * 0.42]);
        }
      }
      if (terrainGen) {
        terrainGen.buildWindPineForest(horizonRoot, crown, cylGeo, M.wood, pinePositions, updaters, {
          onCollider: (minArr, maxArr, surf) => addPermanentCollider(new Vector3(...minArr), new Vector3(...maxArr), { surface: surf, noNav: true }),
        });
      }
    }

    // LIVE PATROLLING PORT LOGISTICS TRUCKS (2 articulated semi-trucks continuously driving Coastal Blvd!)
    {
      const makeLiveTruck = (laneX, startZ, dir, contMat, minLoopZ, maxLoopZ) => {
        const tg = new Group(); tg.userData.noBatch = true;
        tg.position.set(laneX, .21, startZ);
        tg.rotation.y = dir > 0 ? 0 : Math.PI;
        addBox(tg, M.steelClad, 2.46, 2.3, 2.4, 0, 1.86, 6.2);
        addBox(tg, M.steelDark, 1.85, .62, .12, 0, 1.24, 7.42);
        addBox(tg, M.steelDark, 2.52, .26, .24, 0, .74, 7.44);
        addBox(tg, smokedPane, 2.2, .9, .10, 0, 2.34, 7.42);
        addBox(tg, M.glassWarm, .36, .18, .08, -.9, .92, 7.45);
        addBox(tg, M.glassWarm, .36, .18, .08, .9, .92, 7.45);
        addBox(tg, M.redCore, .32, .16, .08, -.92, 1.08, -7.06);
        addBox(tg, M.redCore, .32, .16, .08, .92, 1.08, -7.06);
        addBox(tg, M.steelDark, 2.42, .32, 12.2, 0, 1.12, -.95);
        addBox(tg, contMat, 2.42, 2.55, 11.8, 0, 2.55, -1.05);
        for (const wz of [6.3, 3.8, -4.6, -5.9]) {
          for (const sx of [-1.14, 1.14]) addCyl(tg, M.steelDark, .50, .34, sx, .50, wz, 0, Math.PI / 2);
        }
        horizonRoot.add(tg);
        const truckMinZ = dir > 0 ? -7.12 : -7.52;
        const truckMaxZ = dir > 0 ? 7.52 : 7.12;
        const truckBox = addDynamicCollider(
          new Vector3(laneX - 1.28, 0.21, startZ + truckMinZ),
          new Vector3(laneX + 1.28, 4.06, startZ + truckMaxZ),
          { surface: 'metal', tag: 'live-truck', noNav: true }
        );
        updaters.push(dt => {
          tg.position.z += dir * dt * 8.2;
          if (dir > 0 && tg.position.z > maxLoopZ) tg.position.z = minLoopZ;
          else if (dir < 0 && tg.position.z < minLoopZ) tg.position.z = maxLoopZ;
          if (truckBox) {
            const zc = tg.position.z;
            updateDynamicBox(truckBox, laneX - 1.28, 0.21, zc + truckMinZ, laneX + 1.28, 4.06, zc + truckMaxZ);
            pushPlayerOutOfMovingBox(truckBox);
          }
        });
      };
      // Strictly stay on clear Coastal City Blvd (-134..-42) and South Harbor Blvd (+42..+132) — NEVER clip Berth 4 containers!
      makeLiveTruck(-22.6, -90, -1, M.cargoTeal, -134, -42);
      makeLiveTruck(-29.4, 58, 1, M.craneRed, 42, 132);
    }

    // 6 Readable Overhead Highway Gantry Signs at the REAL Inland Intersections!
    addHighwayGantry(-26, -31.5, 0, '↑ 沿海城区 · 滨海长廊  ↖ 海岸机场', 'COASTAL CITY / PROMENADE / AIRFIELD', 16, '#153b2f');
    addHighwayGantry(-108.5, 5, Math.PI / 2, '← 西区铁路货场 · 山地卫星站 · 西南医院', 'WEST RAIL / MOUNTAIN +14M / CLINIC', 14, '#47311a');
    addHighwayGantry(-26, 30.5, 0, '↓ 南港旧船坞 · 防潮闸 · 22m 岸角灯塔', 'SOUTH DRYDOCK / TIDE GATE / LIGHTHOUSE', 15.5, '#16384d');
    addHighwayGantry(-112, -36, 0, '↑ 山地卫星站 (+14m) · 海岸应急机场', 'MOUNTAIN COMMS +14M / AIRFIELD', 14, '#1b402c');
    addHighwayGantry(-112, 34, 0, '↓ 西南冷雾库 · 战地分诊中心 · 停机坪', 'SW COLD STORAGE / FIELD CLINIC', 14, '#1a3f4a');
    addHighwayGantry(-104, -125, Math.PI / 2, '← 海岸应急机场 · 110m 跑道与拱形机库', 'COASTAL AIRFIELD & HANGAR', 14, '#24314f');

    // Interactive Berth 4 Armory Locker & 《失联名单》 Evidence Console right at West Dispatch!
    addInteractiveTerminal(horizonRoot, {
      id: 'berth-armory', promptZh: '按 [E] 港区军械箱补满弹药与副武器', x: -34, y: 0, z: -22, colorMat: M.glassWarm,
      onUse() {
        (world.weapon?.refill || world.weapon?.reset)?.call(world.weapon);
        audio?.play?.('rail_touchdown', { pos: new Vector3(-34, 1, -22), ref: 14, gain: .45, jitter: .05 });
        world.tactical?.notify?.('🔫 已在港区军械箱补满全部弹药！', '🔫 Ammunition refilled!', false, 2.8);
      },
    });
    // =========================================================================
    // BENCHMARK CHAPTER 1 INVESTIGATION SYSTEM (3 Environmental Clues + Branching Choice)
    // =========================================================================
    const ch1Clues = new Set();
    let ch1Branch = null; // 'broadcast' | 'stealth'
    function recordCh1Clue(clueId, titleZh, radioZh) {
      const isNew = !ch1Clues.has(clueId);
      ch1Clues.add(clueId);
      world.hud?.radio?.(radioZh, 7.2);
      world.tactical?.notify?.(
        `📁 线索 ${ch1Clues.size}/3：${titleZh}${ch1Clues.size >= 3 && !ch1Branch ? '（已集齐！按 [E] 在警务室证物板做出战术抉择）' : ''}`,
        `📁 Clue ${ch1Clues.size}/3: ${clueId}`,
        isNew, 5.2
      );
      audio?.play?.('rail_touchdown', { pos: world.player?.pos || new Vector3(0, 1, 0), ref: 18, gain: .42, jitter: .04 });
    }
    function chooseCh1Branch(branch) {
      ch1Branch = branch === 'stealth' ? 'stealth' : 'broadcast';
      if (ch1Branch === 'broadcast') {
        (world.weapon?.refill || world.weapon?.reset)?.call(world.weapon);
        if (world.player && typeof world.player.hp === 'number') world.player.hp = Math.min(100, Math.max(world.player.hp, 100));
        world.hud?.radio?.('玛拉：「全港民用频道已收到《失联名单》原始卷宗！码头工人为我们打开了补给通道，但铁砧正在全面封锁沿海大道！」', 7.5);
        world.tactical?.notify?.('📡 分支锁定【公开广播真相】：弹药生命已补满，城区进入全面戒备！', '📡 Branch: Broadcast Truth (Full Resupply + High Alert)', true, 5.5);
      } else {
        world.hud?.radio?.('玛拉：「静默克隆密钥完成！铁砧尚未察觉我们已经拿到沃德的召回录音，可以趁敌方巡逻空隙突袭西区！」', 7.5);
        world.tactical?.notify?.('🕵️ 分支锁定【静默截取密钥】：获得战术潜行窗口，后续巡逻警戒降低！', '🕵️ Branch: Silent Key Clone (Reduced Patrol Alert)', true, 5.5);
      }
      return ch1Branch;
    }
    const actMechanics = {
      act2PowerRestored: false,
      railSwitches: new Set(),
      cryoValvesClosed: new Set(),
      rescuedWorkers: new Set(),
      ridgeRelaysAligned: new Set(),
      tideGateValves: new Set(),
      lighthouseGenActive: false,
      airfieldFuelReady: false,
    };
    window.SALTLINE_CH1_BENCHMARK = {
      get cluesFound() { return [...ch1Clues]; },
      get clueCount() { return ch1Clues.size; },
      get branch() { return ch1Branch; },
      chooseBranch: chooseCh1Branch,
    };
    window.SALTLINE_CAMPAIGN_STATE = {
      get clues() { return [...ch1Clues]; },
      get branch() { return ch1Branch; },
      get act2PowerRestored() { return actMechanics.act2PowerRestored; },
      get railSwitchesCount() { return actMechanics.railSwitches.size; },
      get cryoValvesCount() { return actMechanics.cryoValvesClosed.size; },
      get rescuedWorkersCount() { return actMechanics.rescuedWorkers.size; },
      get ridgeRelaysCount() { return actMechanics.ridgeRelaysAligned.size; },
      get tideGateValvesCount() { return actMechanics.tideGateValves.size; },
      get lighthouseGenActive() { return actMechanics.lighthouseGenActive; },
      get airfieldFuelReady() { return actMechanics.airfieldFuelReady; },
      getEpilogueSummary() {
        const branchLabel = ch1Branch === 'stealth' ? '静默截取密钥（潜行突袭线）' : ch1Branch === 'broadcast' ? '公开广播真相（全港响应线）' : '标准突围线';
        return {
          branch: ch1Branch || 'standard',
          branchLabel,
          clues: ch1Clues.size,
          rescuedWorkers: actMechanics.rescuedWorkers.size,
          facilitiesRestored: (actMechanics.act2PowerRestored ? 1 : 0) + actMechanics.railSwitches.size + actMechanics.cryoValvesClosed.size + actMechanics.ridgeRelaysAligned.size + actMechanics.tideGateValves.size + (actMechanics.lighthouseGenActive ? 1 : 0) + (actMechanics.airfieldFuelReady ? 1 : 0),
        };
      },
    };

    // Act 2: Coastal Blvd Auxiliary Power Breaker (restores city grid after Anvil EMP blackout)
    addInteractiveTerminal(horizonRoot, {
      id: 'act2-power-breaker', promptZh: '按 [E] 合闸城区备用配电箱，恢复沿海大道夜间照明', x: -36.2, y: 0.16, z: -74.0, colorMat: M.glassWarm,
      onUse() {
        if (actMechanics.act2PowerRestored) return;
        actMechanics.act2PowerRestored = true;
        audio?.play?.('rail_touchdown', { pos: new Vector3(-36.2, 1, -74.0), ref: 20, gain: .5, jitter: .04 });
        world.hud?.radio?.('玛拉：「城区备用电网已重新上线！整条沿海大道的监控和照明恢复了，敌方伏兵无处可藏！」', 6.2);
        world.tactical?.notify?.('⚡ 沿海城区备用电网已恢复！', '⚡ Coastal City backup power restored!', true, 4.2);
      },
    });

    // Act 3: 2 Physical Rail Yard Track Switches (reroute emergency freight spur beside live train)
    for (const [swId, swLabel, swZ] of [
      ['rail-switch-north', '北段铁路道岔扳手', -46],
      ['rail-switch-south', '南段铁路道岔扳手', 18],
    ]) {
      addInteractiveTerminal(horizonRoot, {
        id: swId, promptZh: `按 [E] 扳动${swLabel}（切换应急救援支线）`, x: -127.5, y: 0.16, z: swZ, colorMat: M.hazard,
        onUse() {
          if (actMechanics.railSwitches.has(swId)) return;
          actMechanics.railSwitches.add(swId);
          audio?.play?.('rail_touchdown', { pos: new Vector3(-127.5, 1, swZ), ref: 22, gain: .55, jitter: .06 });
          world.tactical?.notify?.(`🚆 已切换${swLabel}（${actMechanics.railSwitches.size}/2）`, `🚆 Rail switch toggled (${actMechanics.railSwitches.size}/2)`, true, 4.0);
        },
      });
    }

    // Act 4: 2 Cryogenic Tank Pressure Relief Valves + 3 Stranded Dock Workers Rescue
    for (const [vId, vx, vz] of [['cryo-valve-1', -198.5, 74], ['cryo-valve-2', -209.5, 82]]) {
      addInteractiveTerminal(horizonRoot, {
        id: vId, promptZh: '按 [E] 关闭低温储罐泄压阀，切断毒雾泄漏', x: vx, y: 0.16, z: vz, colorMat: M.glassCyan,
        onUse() {
          if (actMechanics.cryoValvesClosed.has(vId)) return;
          actMechanics.cryoValvesClosed.add(vId);
          audio?.play?.('rail_touchdown', { pos: new Vector3(vx, 1, vz), ref: 18, gain: .48, jitter: .05 });
          world.tactical?.notify?.(`❄️ 低温储罐泄压阀已关闭（${actMechanics.cryoValvesClosed.size}/2）`, `❄️ Cryo tank valve sealed (${actMechanics.cryoValvesClosed.size}/2)`, true, 4.0);
        },
      });
    }
    for (const [wId, wName, wx, wz] of [
      ['rescue-worker-1', '夜班技师阿周', -176, 72],
      ['rescue-worker-2', '冷库班长老陈', -192, 86],
      ['rescue-worker-3', '分诊护士林岚', -158, 92],
    ]) {
      interactables.push({
        id: wId, pos: new Vector3(wx, 1.0, wz), radius: 3.6,
        getPrompt: () => actMechanics.rescuedWorkers.has(wId) ? `已护送${wName}撤离` : `按 [E] 搜救并引导${wName}撤往战地分诊中心`,
        use() {
          if (actMechanics.rescuedWorkers.has(wId)) return;
          actMechanics.rescuedWorkers.add(wId);
          audio?.play?.('rail_touchdown', { pos: new Vector3(wx, 1, wz), ref: 18, gain: .42, jitter: .04 });
          world.hud?.radio?.(`玛拉：「${wName}已安全进入撤离通道！（已营救 ${actMechanics.rescuedWorkers.size}/3 名失联工人）」`, 5.8);
          world.tactical?.notify?.(`🛟 已营救${wName}（${actMechanics.rescuedWorkers.size}/3）`, `🛟 Rescued worker (${actMechanics.rescuedWorkers.size}/3)`, true, 4.2);
        },
        cleanup() {},
      });
    }

    // Act 5: 2 West Mountain Ridge Directional Relay Towers
    for (const [rId, rx, ry, rz] of [['ridge-relay-n', -218, 12.2, -56], ['ridge-relay-s', -221, 11.4, -84]]) {
      addInteractiveTerminal(horizonRoot, {
        id: rId, promptZh: '按 [E] 校准西岸山脊定向中继天线', x: rx, y: ry, z: rz, colorMat: M.glassCyan,
        onUse() {
          if (actMechanics.ridgeRelaysAligned.has(rId)) return;
          actMechanics.ridgeRelaysAligned.add(rId);
          world.tactical?.notify?.(`📡 山脊中继天线已对齐（${actMechanics.ridgeRelaysAligned.size}/2）`, `📡 Ridge relay aligned (${actMechanics.ridgeRelaysAligned.size}/2)`, true, 4.0);
        },
      });
    }

    // Act 6: 2 South Tide Gate Hydraulic Pressure Valves
    for (const [gId, gx] of [['tidegate-valve-w', -35.5], ['tidegate-valve-e', -16.5]]) {
      addInteractiveTerminal(horizonRoot, {
        id: gId, promptZh: '按 [E] 关闭防潮闸液压泄压阀，稳固干船坞撤离通道', x: gx, y: 0.16, z: 93.0, colorMat: M.glassWarm,
        onUse() {
          if (actMechanics.tideGateValves.has(gId)) return;
          actMechanics.tideGateValves.add(gId);
          world.tactical?.notify?.(`🌊 防潮闸液压阀已锁定（${actMechanics.tideGateValves.size}/2）`, `🌊 Tide gate valve locked (${actMechanics.tideGateValves.size}/2)`, true, 4.0);
        },
      });
    }

    // Act 7: 22m Headland Lighthouse Auxiliary Diesel Generator
    addInteractiveTerminal(horizonRoot, {
      id: 'lighthouse-gen', promptZh: '按 [E] 启动 22 米灯塔备用柴油发电机', x: 9.5, y: 0.16, z: 134.0, colorMat: M.glassWarm,
      onUse() {
        if (actMechanics.lighthouseGenActive) return;
        actMechanics.lighthouseGenActive = true;
        audio?.play?.('rail_touchdown', { pos: new Vector3(9.5, 1, 134.0), ref: 24, gain: .55, jitter: .05 });
        world.hud?.radio?.('玛拉：「灯塔备用发电机轰鸣启动！现在去塔顶校准光学透镜，海上搜救艇就能看到我们的航标！」', 6.5);
        world.tactical?.notify?.('🔦 灯塔主供电已恢复！', '🔦 Lighthouse generator online!', true, 4.2);
      },
    });

    // Act 8: Coastal Airfield Aviation Fuel Pump
    addInteractiveTerminal(horizonRoot, {
      id: 'airfield-fuel-pump', promptZh: '按 [E] 启动机库航空燃油加注泵，为撤离运输机加注燃料', x: -186.0, y: 0.16, z: -186.0, colorMat: M.hazard,
      onUse() {
        if (actMechanics.airfieldFuelReady) return;
        actMechanics.airfieldFuelReady = true;
        audio?.play?.('rail_touchdown', { pos: new Vector3(-186, 1, -186), ref: 24, gain: .52, jitter: .04 });
        world.hud?.radio?.('玛拉：「航空燃油加注完毕！SAR 运输机双发随时可以点火升空，死守跑道！」', 6.5);
        world.tactical?.notify?.('✈️ 运输机燃油加注完成！', '✈️ Evacuation transport fueled!', true, 4.2);
      },
    });
    window.SALTLINE_CAMPAIGN_MATRIX = [
      { act: 1, id: 'ow-0', titleZh: '孤港迷雾 · 05:31 停电疑云', estMinutes: 22, coreLoop: ['环境探索', '多线索取证(3/3)', '分支抉择', '防空干扰破坏'], uniqueZone: '四号泊位 + 沿海警务04号站室内' },
      { act: 2, id: 'ow-1', titleZh: '沿海大道冲卡与警务调档', estMinutes: 20, coreLoop: ['四驱车高速追逐', '路障冲锋', '警务楼镜像防守'], uniqueZone: '沿海城区主干道 + 过街天桥' },
      { act: 3, id: 'ow-2', titleZh: '西南冷雾库与第 17 人真相', estMinutes: 22, coreLoop: ['低温储罐工业区搜救', '雷暴破锁', '战地诊所修复录音'], uniqueZone: '西南冷雾库 + 战地医院' },
      { act: 4, id: 'ow-3', titleZh: '西区铁路货场死线截车', estMinutes: 24, coreLoop: ['动态货运列车规避', '道岔信号破坏', '车厢货单扫描'], uniqueZone: '西区铁路货场 + 隧道口' },
      { act: 5, id: 'ow-4', titleZh: '西岸山顶夺取全城广播', estMinutes: 24, coreLoop: ['+14m 盘山公路攀爬', '卫星频段校准解谜', '制高点防守'], uniqueZone: '西岸山地 + 海岸松林' },
      { act: 6, id: 'ow-5', titleZh: '零号泄洪与海啸坚守', estMinutes: 22, coreLoop: ['12m 海啸灾难求生', '高地掩体坚守', '东海舰队通联'], uniqueZone: '西岸高地 + 南港防潮大闸' },
      { act: 7, id: 'ow-6', titleZh: '南港船坞炮火点灯', estMinutes: 22, coreLoop: ['夜间炮击规避', '干扰器清除', '22m 灯塔透镜校准'], uniqueZone: '南港旧船坞 + 22m 岸角灯塔' },
      { act: 8, id: 'ow-7', titleZh: '海岸应急机场油料与黑匣子夺取', estMinutes: 24, coreLoop: ['跑道炮火突击', '机库油泵抢修', '飞行记录仪回收'], uniqueZone: '海岸应急机场 + 110m 跑道' },
      { act: 9, id: 'ow-8', titleZh: '外海锚地与码头疏散', estMinutes: 24, coreLoop: ['登船干扰清除', '舷梯撤离防线', '被困船员护送'], uniqueZone: '南港外海锚地 + 集装箱泊位' },
      { act: 10, id: 'ow-9', titleZh: '深夜档案封锁与反攻', estMinutes: 24, coreLoop: ['铁砧反扑阻击', '离岸总账破译', '警务上行链路坚守'], uniqueZone: '沿海警务04号站 + 城区街区' },
      { act: 11, id: 'ow-10', titleZh: '最后引航与海岸公路护送', estMinutes: 25, coreLoop: ['北段防空阵地清除', '海岸公路高速护航', '机场入口汇合'], uniqueZone: '北段沿海大道 + 海岸公路' },
      { act: 12, id: 'ow-11', titleZh: '晴海启航与真相尾声', estMinutes: 18, coreLoop: ['晴空黎明港区巡礼', '救援机登机过场', '多分支结局结算'], uniqueZone: '盐线全港晴空 + 海岸应急机场' },
    ];

    addInteractiveTerminal(horizonRoot, {
      id: 'berth-evidence', promptZh: '按 [E] 线索1/3：核验老霍克 05:34 手写值班交接单', x: -85, y: 0, z: -11, colorMat: M.glassCyan,
      onUse() {
        recordCh1Clue('clue-berth-ledger', '老霍克 05:34 交接单', '玛拉：「核对成功——老霍克在 05:34 还签了值班交接条，但里德的封港系统却篡改他 05:31 已撤离！」');
      },
    });
    interactables.push({
      id: 'precinct-caseboard-clue', pos: new Vector3(-6.8, 1.4, -52.2), radius: 3.4,
      getPrompt: () => {
        if (!ch1Clues.has('clue-precinct-board')) return '按 [E] 线索2/3：检视警务04号站《失联名单》专案证物板';
        if (!ch1Branch) return '按 [E] 战术抉择：向全港广播《失联名单》真相（公开突围）';
        return `已执行战术分支：${ch1Branch === 'broadcast' ? '公开广播真相' : '静默截取密钥'}`;
      },
      use() {
        if (!ch1Clues.has('clue-precinct-board')) {
          recordCh1Clue('clue-precinct-board', '警务室《失联名单》原件', '玛拉：「名单上有 14 名泊位工人的名字被红笔划掉——这不是撤离失败，是蓄意封口！」');
        } else if (!ch1Branch) {
          chooseCh1Branch('broadcast');
        }
      },
      cleanup() {},
    });
    interactables.push({
      id: 'precinct-radio-clue', pos: new Vector3(-7.4, 1.2, -56.2), radius: 3.2,
      getPrompt: () => {
        if (!ch1Clues.has('clue-radio-tape')) return '按 [E] 线索3/3：回放调度台无线电加密录音（沃德 05:50）';
        if (!ch1Branch) return '按 [E] 战术抉择：静默克隆铁砧封锁密钥（潜行突袭）';
        return '加密录音已归档至任务卷宗';
      },
      use() {
        if (!ch1Clues.has('clue-radio-tape')) {
          recordCh1Clue('clue-radio-tape', '沃德 05:50 召回录音', '玛拉：「听见了吗？沃德在 05:50 亲自下令召回搜救艇——这下铁证如山。去证物板公开广播，或在电台静默克隆密钥！」');
        } else if (!ch1Branch) {
          chooseCh1Branch('stealth');
        }
      },
      cleanup() {},
    });

    // Armored Multi-HP Tactical Objective Builder
    function spawnShootTarget(parent, { id, stage, labelZh, pos, radius = 1.45, tall = true, maxHp = 3 }) {
      const g = new Group(); g.userData.noBatch = true;
      g.position.copy(pos);
      const rotor = new Group();
      if (tall) {
        addBox(g, M.concrete, 1.35, .42, 1.35, 0, .21, 0);
        addBox(g, M.steelDark, .82, 2.8, .82, 0, 1.6, 0);
        addBox(g, M.hazard, .96, .34, .96, 0, .65, 0);
        for (const [ax, az] of [[-.52, 0], [.52, 0], [0, -.52], [0, .52]]) addBox(g, M.steelGalv, .14, 2.2, .14, ax, 1.75, az);
        rotor.position.y = 3.25;
        const core = new Mesh(sphGeo, M.redCore); core.scale.set(.52, .52, .52);
        const fin1 = new Mesh(boxGeo, M.steelGalv); fin1.scale.set(1.5, .10, .18);
        const fin2 = new Mesh(boxGeo, M.steelGalv); fin2.scale.set(.18, .10, 1.5);
        rotor.add(core, fin1, fin2);
        g.add(rotor);
      } else {
        addBox(g, M.concrete, 1.3, .3, 1.3, 0, .15, 0);
        addBox(g, M.steelWorn, 1.05, 1.4, 1.05, 0, .85, 0);
        addBox(g, M.hazard, 1.12, .25, 1.12, 0, .42, 0);
        rotor.position.y = 1.85;
        const core = new Mesh(cylGeo, M.redCore); core.scale.set(.42, 1.1, .42);
        const cap = new Mesh(boxGeo, M.steelDark); cap.scale.set(.9, .14, .24); cap.position.y = .62;
        rotor.add(core, cap);
        g.add(rotor);
      }
      parent.add(g);
      updaters.push(dt => { if (g.visible) rotor.rotation.y += dt * 2.6; });
      const tBox = addDynamicCollider(
        new Vector3(pos.x - 0.72, pos.y, pos.z - 0.72),
        new Vector3(pos.x + 0.72, pos.y + (tall ? 3.7 : 2.3), pos.z + 0.72),
        { surface: 'metal', tag: 'shoot-target', noNav: true }
      );
      shootTargets.push({
        id, stage, labelZh, group: g, rotor, collider: tBox,
        pos: pos.clone().add(new Vector3(0, tall ? 2.5 : 1.4, 0)),
        radius, maxHp, hp: maxHp, alive: true,
      });
    }

    const jammerRoot = new Group();
    jammerRoot.name = 'anvil-jammer-towers';
    root.add(jammerRoot);
    spawnShootTarget(jammerRoot, { id: 'jammer-yard', stage: 0, labelZh: '货场防空干扰塔', pos: new Vector3(-4, 0, -8), tall: true, maxHp: 3 });
    spawnShootTarget(jammerRoot, { id: 'jammer-quay', stage: 0, labelZh: '码头防空干扰塔', pos: new Vector3(17.5, 0, 10.5), tall: true, maxHp: 3 });
    spawnShootTarget(jammerRoot, { id: 'anchor-jam-1', stage: 8, labelZh: '南锚地北舷干扰器', pos: new Vector3(12, 0, 74), tall: true, maxHp: 3 });
    spawnShootTarget(jammerRoot, { id: 'anchor-jam-2', stage: 8, labelZh: '南锚地南舷干扰器', pos: new Vector3(18, 0, 96), tall: true, maxHp: 3 });
    spawnShootTarget(jammerRoot, { id: 'highway-sam-1', stage: 10, labelZh: '北段海岸大道防空架 A', pos: new Vector3(-22, 0, -108), tall: true, maxHp: 3 });
    spawnShootTarget(jammerRoot, { id: 'highway-sam-2', stage: 10, labelZh: '北段海岸大道防空架 B', pos: new Vector3(-54, 0, -126), tall: true, maxHp: 3 });

    // =========================================================================
    // SECTOR 1 (NORTH): COASTAL CITY DOWNTOWN & EAST SEAFRONT PROMENADE (x: -107..+24, z: -145..-30)
    // =========================================================================
    const city = makeSector('city', '沿海城区与滨海长廊', 'Coastal City & Seafront', [-42, 0, -86], 155);
    const quarter = WE.planCoastalQuarter(M);
    const paverMat = matLib ? matLib.get('sidewalk_paver') : M.concrete;
    const curbStoneMat = matLib ? matLib.get('granite') : M.concreteDirty;
    const interiorWallMat = matLib ? matLib.get('plaster_interior') : M.plasterGrey;
    const facadeCleanMat = matLib ? matLib.get('plaster_cream') : M.plasterGrey;
    if (lightingSys && matLib) {
      lightingSys.registerEmissiveMaterial?.(matLib.get('window_lit'), { day: 0.28, night: 1.65 });
    }
    for (const [west, east, z, width] of quarter.crossStreets)
      addBox(city.shell, M.asphalt, east - west, .05, width, (west + east) / 2, .185, z);
    // Upgraded Coastal Quarter Sidewalks: stone-paver slabs + beveled granite curbs + dark gutter channel + cast-iron storm drains
    for (const [x0, z0, x1, z1] of quarter.sidewalks) {
      solid(city, city.shell, paverMat, x0, .15, z0, x1, .31, z1, 'concrete', true);
      const swW = x1 - x0, swD = z1 - z0;
      if (swD > swW) {
        const roadEdgeX = x0 < -26 ? x1 - .14 : x0 + .14;
        const gutterX = x0 < -26 ? x1 + .22 : x0 - .22;
        addBox(city.detail, curbStoneMat, .28, .20, swD, roadEdgeX, .24, (z0 + z1) / 2);
        addBox(city.detail, M.steelDark, .42, .02, swD, gutterX, .212, (z0 + z1) / 2);
        for (let dz = z0 + 5; dz < z1 - 3; dz += 12) {
          addBox(city.detail, M.steelWorn, .44, .026, .76, gutterX, .216, dz);
        }
      } else {
        const roadEdgeZ = z0 > -84 ? z0 + .14 : z1 - .14;
        addBox(city.detail, curbStoneMat, swW, .20, .28, (x0 + x1) / 2, .24, roadEdgeZ);
      }
    }
    // Multi-tier Urban Spatial Elements from UrbanPlanningSystem: Alleys, Civic Plazas & Green Planters
    const coastalGrassMat = matLib ? matLib.get('grass_coastal') : M.coastalGrass;
    const coastalSoilMat = matLib ? matLib.get('coastal_soil') : M.wood;
    for (const alley of (quarter.alleys || [])) {
      const aw = alley.x1 - alley.x0, ad = alley.z1 - alley.z0;
      const acx = (alley.x0 + alley.x1) / 2, acz = (alley.z0 + alley.z1) / 2;
      addBox(city.shell, paverMat, aw, .06, ad, acx, .19, acz);
      addBox(city.detail, M.steelDark, .36, .025, ad - 1.2, acx, .225, acz); // Center cobblestone drainage channel
      for (let dz = alley.z0 + 4; dz < alley.z1 - 3; dz += 9) addBox(city.detail, M.steelWorn, .38, .03, .62, acx, .23, dz);
      if (alley.hasArch) {
        const az = alley.z1 - 2.2;
        for (const sx of [alley.x0 + .32, alley.x1 - .32]) addBox(city.detail, M.steelDark, .26, 4.6, .26, sx, 2.46, az);
        addBox(city.detail, M.steelDark, aw - .4, .34, .28, acx, 4.72, az);
        addBox(city.detail, M.glassWarm, .48, .22, .22, acx, 4.46, az);
        const laneSign = new Mesh(boxGeo, makeSignMat(alley.label || 'HARBOR LANE', 'PEDESTRIAN PASSAGE', '#1c2c34'));
        laneSign.scale.set(Math.min(3.6, aw - 1.4), .56, .08);
        laneSign.position.set(acx, 4.98, az + .14);
        laneSign.matrixAutoUpdate = false; laneSign.updateMatrix();
        city.detail.add(laneSign);
      }
    }
    for (const plaza of (quarter.plazas || [])) {
      const pw = plaza.x1 - plaza.x0, pd = plaza.z1 - plaza.z0;
      const pcx = (plaza.x0 + plaza.x1) / 2, pcz = (plaza.z0 + plaza.z1) / 2;
      solid(city, city.shell, paverMat, plaza.x0, .15, plaza.z0, plaza.x1, .28, plaza.z1, 'concrete', true);
      addBox(city.detail, curbStoneMat, pw + .3, .16, .28, pcx, .26, plaza.z1);
      addBox(city.detail, curbStoneMat, pw + .3, .16, .28, pcx, .26, plaza.z0);
      if (plaza.kind === 'civic_forecourt') {
        for (const bx of [pcx - 5.5, pcx + 5.5]) {
          addBox(city.detail, curbStoneMat, 3.2, .44, .75, bx, .50, pcz + .4);
          addBox(city.detail, M.wood, 3.0, .08, .58, bx, .76, pcz + .4);
        }
      } else if (plaza.kind === 'promenade_square') {
        for (const bz of [pcz - 7.5, pcz + 7.5]) {
          addBox(city.detail, curbStoneMat, .72, .44, 3.0, pcx - .6, .50, bz);
          addBox(city.detail, M.wood, .56, .08, 2.8, pcx - .6, .76, bz);
        }
      } else if (plaza.kind === 'civic_plaza') {
        // North Civic Clock Plaza: stepped granite monument obelisk + illuminated lantern crown + benches
        addBox(city.detail, curbStoneMat, 4.4, .34, 4.4, pcx, .44, pcz);
        addBox(city.detail, curbStoneMat, 2.8, .52, 2.8, pcx, .86, pcz);
        addBox(city.detail, M.concrete, 1.35, 5.4, 1.35, pcx, 3.82, pcz);
        addBox(city.detail, M.glassWarm, 1.05, .95, 1.42, pcx, 6.15, pcz);
        addBox(city.detail, M.glassWarm, 1.42, .95, 1.05, pcx, 6.15, pcz);
        addBox(city.detail, M.steelDark, 1.65, .28, 1.65, pcx, 6.76, pcz);
        city.colliderSpecs.push({ min: new Vector3(pcx - 2.2, 0.16, pcz - 2.2), max: new Vector3(pcx + 2.2, 7.0, pcz + 2.2), surface: 'concrete' });
        for (const bx of [pcx - 6.2, pcx + 6.2]) {
          addBox(city.detail, curbStoneMat, 3.4, .44, .78, bx, .50, pcz);
          addBox(city.detail, M.wood, 3.2, .08, .60, bx, .76, pcz);
          city.colliderSpecs.push({ min: new Vector3(bx - 1.7, 0.16, pcz - 0.40), max: new Vector3(bx + 1.7, 0.85, pcz + 0.40), surface: 'concrete' });
        }
      } else if (plaza.kind === 'waterfront_promenade') {
        // Continuous coastal boardwalk: timber deck inlay, seawall steel railing & overlook benches
        addBox(city.detail, M.wood, pw - 1.2, .05, pd - 2.0, pcx, .30, pcz);
        addBox(city.detail, M.steelDark, .12, .10, pd - 1.0, plaza.x1 - .25, 1.24, pcz);
        addBox(city.detail, M.steelDark, .08, .06, pd - 1.0, plaza.x1 - .25, .78, pcz);
        city.colliderSpecs.push({ min: new Vector3(plaza.x1 - 0.36, 0.16, plaza.z0 + 0.5), max: new Vector3(plaza.x1 - 0.14, 1.32, plaza.z1 - 0.5), surface: 'metal' });
        for (let bz = plaza.z0 + 4; bz <= plaza.z1 - 4; bz += 8) {
          addCyl(city.detail, M.steelDark, .07, 1.02, plaza.x1 - .25, .74, bz);
          if (Math.round(bz) % 16 === 0) {
            addBox(city.detail, curbStoneMat, .72, .44, 2.8, pcx - .8, .50, bz);
            addBox(city.detail, M.wood, .56, .08, 2.6, pcx - .8, .76, bz);
            city.colliderSpecs.push({ min: new Vector3(pcx - 1.18, 0.16, bz - 1.42), max: new Vector3(pcx - 0.42, 0.85, bz + 1.42), surface: 'concrete' });
          }
        }
      }
    }
    for (const park of (quarter.parks || [])) {
      const pw = park.x1 - park.x0, pd = park.z1 - park.z0;
      const pcx = (park.x0 + park.x1) / 2, pcz = (park.z0 + park.z1) / 2;
      addBox(city.shell, coastalGrassMat, pw, .14, pd, pcx, .22, pcz);
      addBox(city.detail, paverMat, 3.2, .08, pd - 4.0, pcx + 1.5, .28, pcz);
      addBox(city.detail, curbStoneMat, pw + .4, .22, .32, pcx, .27, park.z0);
      addBox(city.detail, curbStoneMat, pw + .4, .22, .32, pcx, .27, park.z1);
      for (const bz of [pcz - 16, pcz, pcz + 16]) {
        addBox(city.detail, curbStoneMat, .75, .44, 2.8, pcx + 4.2, .48, bz);
        addBox(city.detail, M.wood, .58, .08, 2.6, pcx + 4.2, .74, bz);
        addBox(city.detail, M.concrete, 1.6, .85, 1.4, pcx - 5.2, .62, bz + 4);
      }
    }
    for (const gs of (quarter.greenSpaces || [])) {
      addBox(city.detail, curbStoneMat, gs.w, .30, gs.d, gs.x, .40, gs.z);
      addBox(city.detail, coastalSoilMat, gs.w - .38, .10, gs.d - .38, gs.x, .50, gs.z);
      addBox(city.detail, coastalGrassMat, gs.w - .54, .08, gs.d - .54, gs.x, .54, gs.z);
      addPineTree(city.detail, gs.x, .54, gs.z, gs.treeScale || .64);
    }
    for (const bz of [-45.5, -49.5, -60.5, -64.5]) {
      addCyl(city.detail, M.steelDark, .09, .86, -18.55, .74, bz);
      addCyl(city.detail, M.steelGalv, .10, .08, -18.55, 1.18, bz);
      addCyl(city.detail, M.steelDark, .09, .86, -33.45, .74, bz);
      addCyl(city.detail, M.steelGalv, .10, .08, -33.45, 1.18, bz);
    }
    // Keep road-marking batches local so the renderer can cull each stretch independently.
    const roadMarkings = new Map();
    function addRoadMarking(mat, w, d, x, z) {
      const key = `${mat === M.yellowPaint ? 'yellow' : 'white'}:${w}:${d}:${Math.floor(x / 24)}:${Math.floor(z / 24)}`;
      if (!roadMarkings.has(key)) roadMarkings.set(key, { mat, w, d, positions: [] });
      roadMarkings.get(key).positions.push([x, z]);
    }
    for (let z = -34; z >= -140; z -= 6.5) addRoadMarking(M.yellowPaint, .18, 3.2, -26, z);
    for (let x = -100; x <= 18; x += 6.5) {
      if (Math.abs(x + 26) < 9) continue;
      addRoadMarking(M.yellowPaint, 3.2, .18, x, -84);
    }
    for (let i = -3; i <= 3; i++) {
      addRoadMarking(M.whitePaint, .7, 3.2, -26 + i * 1.6, -74);
      addRoadMarking(M.whitePaint, .7, 3.2, -26 + i * 1.6, -94);
    }
    for (const { mat, w, d, positions } of roadMarkings.values()) {
      if (positions.length < 2 || typeof THREE.InstancedMesh !== 'function') {
        for (const [x, z] of positions) addBox(city.detail, mat, w, .015, d, x, .24, z);
        continue;
      }
      const mesh = new THREE.InstancedMesh(getWorldBoxGeo(w, .015, d), mat, positions.length);
      const transform = new THREE.Object3D();
      positions.forEach(([x, z], index) => {
        transform.position.set(x, .24, z);
        transform.updateMatrix();
        mesh.setMatrixAt(index, transform.matrix);
      });
      mesh.receiveShadow = true;
      city.detail.add(mesh);
    }
    // Downtown Traffic Signal Gantries & Seafront Promenade Balustrade + Benches
    for (const [tx, tz] of [[-35.5, -75.5], [-16.5, -92.5]]) {
      addCyl(city.detail, M.steelDark, .16, 6.8, tx, 3.4, tz);
      addBox(city.detail, M.steelDark, 6.4, .18, .18, tx + (tx < -26 ? 3.2 : -3.2), 6.5, tz);
      addBox(city.detail, M.steelDark, .45, 1.15, .36, tx + (tx < -26 ? 4.8 : -4.8), 6.1, tz);
      addBox(city.detail, M.greenSignal, .24, .24, .40, tx + (tx < -26 ? 4.8 : -4.8), 5.8, tz);
      addBox(city.detail, M.redCore, .24, .24, .40, tx + (tx < -26 ? 4.8 : -4.8), 6.4, tz);
    }
    for (let pz = -138; pz <= -36; pz += 12) {
      addBox(city.detail, M.wood, .7, .48, 2.4, 21.6, .24, pz);
      addBox(city.detail, M.steelGalv, .10, 1.05, 11.8, 23.4, 1.45, pz);
    }
    // Smashable Anvil Highway Roadblock at Downtown Intersection (-26, 0, -76)
    for (let i = -2; i <= 2; i++) {
      const b = new Mesh(boxGeo, i % 2 === 0 ? M.hazard : M.steelWorn);
      b.scale.set(2.1, 1.15, .55);
      b.position.set(-26 + i * 2.2, .62, -76);
      city.shell.add(b);
      roadblockProps.push({ mesh: b, intact: true });
    }
    // Showcase Coastal City District featuring ALL 6 distinct architectural archetypes (ZERO copy-pasted boxes!)
    const blocks = quarter.lots;
    for (const blk of blocks) {
      solid(city, city.shell, M.concreteDirty, blk.x0 - 2.0, -.04, blk.z0 - 2.0, blk.x1 + 2.0, .16, blk.z1 + 2.0, 'concrete', true);
      if (blk.facility) {
        buildingGen.buildFreightExchange(city.shell, blk, externalAssets, (x0, y0, z0, x1, y1, z1) =>
          city.colliderSpecs.push({ min: new Vector3(x0, y0, z0), max: new Vector3(x1, y1, z1), surface: 'concrete' }));
        for (const z of [blk.cz - 8, blk.cz + 8]) {
          placePortProp(city, city.detail, 'shelf_rack', blk.x0 + 4, .16, z, Math.PI / 2);
          placePortProp(city, city.detail, 'pallet_stack', blk.cx, .16, z, .13);
        }
        placePortProp(city, city.detail, 'forklift', blk.cx + 2, .16, blk.cz - 3, -.4);
        placePortProp(city, city.detail, 'guard_booth', blk.x1 + .6, .16, blk.z1 - 4.2, -Math.PI / 2);
        placePortProp(city, city.detail, 'jersey_barrier', blk.x1 + 1.4, .16, blk.z0 + 5.5, Math.PI / 2);
        placePortProp(city, city.detail, 'dumpster', blk.x0 - 1.8, .16, blk.z0 + 6.5, 0);
      } else if (blk.enterable) {
        const bx0 = blk.x0 + 1.5, bx1 = blk.x1 - 1.5, bz0 = blk.z0 + 1.5, bz1 = blk.z1 - 1.5;
        solid(city, city.shell, facadeCleanMat, bx0, .16, bz0, bx1, 3.8, bz0 + .5, 'concrete', true);
        solid(city, city.shell, facadeCleanMat, bx1 - .5, .16, bz0, bx1, 3.8, bz1, 'concrete', true);
        solid(city, city.shell, facadeCleanMat, bx0, .16, bz1 - .5, bx1, 3.8, bz1, 'concrete', true);
        const entZ = (bz0 + bz1) / 2;
        const windowBays = [bz0 + 5.2, bz0 + 10.2, bz1 - 10.2, bz1 - 5.2];
        for (const [low, high, glazed] of [[.16, 1.18, false], [1.18, 3.02, true],
          [3.02, 3.8, false]]) {
          const gaps = glazed ? windowBays.map(z => [z - 1.4, z + 1.4]) : [];
          if (low < 3.6) gaps.push([entZ - 2, entZ + 2]);
          let start = bz0;
          for (const [end, next] of [...gaps.sort((a, b) => a[0] - b[0]), [bz1, bz1]]) {
            if (end > start) solid(city, city.shell, low < 1.1 ? curbStoneMat : facadeCleanMat, bx0, low, start, bx0 + .5, high, end, 'concrete', true);
            start = next;
          }
        }
        solid(city, city.shell, M.concrete, bx0, 3.8, bz0, bx1, 4.1, bz1, 'concrete', true);
        buildingGen.buildDispatchWing(city.shell, { bx0, bx1, bz0, bz1, entZ, externalAssets });
        const precinctSign = new Mesh(boxGeo, makeSignMat('COASTAL PRECINCT 04', 'HARBOR DISPATCH HQ', '#182f42'));
        precinctSign.scale.set(5.0, .92, .12); precinctSign.position.set(bx0 - 2.65, 4.46, entZ);
        city.detail.add(precinctSign);
        precinctSign.rotation.y = -Math.PI / 2; precinctSign.updateMatrix();
        // Articulated entrance porch: granite threshold step + fascia canopy + diagonal steel tie-rods + recessed soffit lamps
        addBox(city.shell, curbStoneMat, 2.5, .26, 6.4, bx0 - 1.25, .15, entZ);
        addBox(city.shell, M.steelDark, 2.9, .24, 6.4, bx0 - 1.45, 3.88, entZ);
        addBox(city.detail, curbStoneMat, 3.05, .12, 6.55, bx0 - 1.45, 4.04, entZ);
        for (const sz of [entZ - 2.45, entZ + 2.45]) {
          addBox(city.detail, M.steelDark, .18, 3.7, .18, bx0 - 2.65, 2.02, sz);
          addBox(city.detail, curbStoneMat, .36, .48, .36, bx0 - 2.65, .44, sz);
          const brace = addBox(city.detail, M.steelGalv, 2.45, .07, .07, bx0 - 1.38, 4.32, sz);
          brace.rotation.z = .36; brace.updateMatrix();
        }
        for (const lz of [entZ - 1.4, entZ + 1.4]) addBox(city.detail, M.glassWarm, .48, .05, .24, bx0 - 1.5, 3.74, lz);
        for (const wy of [2.1]) {
          for (const wz of windowBays) {
            for (const side of [-1, 1]) addBox(city.detail, M.steelDark, .24, 1.84, .10, bx0 + .24, wy, wz + side * 1.36);
            solid(city, city.detail, lobbyGlass, bx0 + .28, wy - .92, wz - 1.36, bx0 + .31, wy + .92, wz + 1.36, 'glass', true);
            addBox(city.detail, M.steelDark, .12, 1.84, .065, bx0 + .21, wy, wz);
            addBox(city.detail, M.steelDark, .12, .065, 2.74, bx0 + .21, wy + .44, wz);
            addBox(city.detail, curbStoneMat, .52, .18, 3.12, bx0 - .14, wy - 1.02, wz);
            addBox(city.detail, curbStoneMat, .46, .14, 3.08, bx0 - .12, wy + 1.00, wz);
          }
        }
        // Short returns split public waiting, interview and radio operator spaces (clean interior plaster + timber wainscot!)
        for (const side of [-1, 1]) {
          const edge = entZ + side * 8;
          solid(city, city.shell, interiorWallMat, bx0 + 5, .16, edge, bx1 - .5, 3.8, edge + .22, 'concrete', true);
          solid(city, city.shell, interiorWallMat, bx0 + 12, .16, Math.min(edge, entZ + side * 3), bx0 + 12.25, 3.8, Math.max(edge, entZ + side * 3), 'concrete', true);
        }
        const floor = matLib.get('granite');
        solid(city, city.shell, floor, bx0 + .5, .16, bz0 + .5, bx1 - .5, .205, bz1 - .5, 'concrete', true);
        for (const z of [entZ - 3.7, entZ + 3.4]) {
          solid(city, city.shell, interiorWallMat, bx0 + 3.2, .205, z, bx0 + 8.8, 3.80, z + .18, 'concrete', true);
          addBox(city.detail, M.wood, 5.64, .14, .22, bx0 + 6, .28, z + .09);
          addBox(city.detail, M.steelDark, 5.64, .88, .21, bx0 + 6, .74, z + .09);
          addBox(city.detail, M.wood, 5.68, .08, .25, bx0 + 6, 1.22, z + .09);
        }
        // Exposed ceiling steel joists aligned cleanly BETWEEN light troffers (ZERO clipping!)
        for (const cxBeam of [bx0 + 3.4, bx0 + 7.6, bx0 + 10.8]) {
          addBox(city.detail, M.steelDark, .22, .22, 15.6, cxBeam, 3.69, entZ);
        }
        for (const fz of [entZ - 3.1, entZ - 2.3]) {
          addBox(city.detail, M.steelWorn, .68, 1.48, .54, bx0 + 11.4, .95, fz);
          addBox(city.detail, M.steelGalv, .05, .04, .22, bx0 + 11.04, 1.38, fz);
          addBox(city.detail, M.steelGalv, .05, .04, .22, bx0 + 11.04, .98, fz);
          addBox(city.detail, M.steelGalv, .05, .04, .22, bx0 + 11.04, .58, fz);
        }
        const chartBoard = new Mesh(boxGeo, makeSignMat('SALTLINE HARBOR CHART', 'BERTH 01–07  ·  TIDE & RADAR SECTOR', '#1c333b'));
        chartBoard.position.set(bx0 + 6.0, 2.22, entZ - 3.48);
        chartBoard.scale.set(2.4, 1.15, .05);
        city.detail.add(chartBoard);
        const stationX = bx0 + 5.4;
        const stationZ = entZ - 1.15;
        placeExternal(city.detail, 'metal_office_desk', stationX, .205, stationZ, -Math.PI / 2);
        placeExternal(city.detail, 'vintage_radio_transceiver', stationX, .993, stationZ - .48, -Math.PI / 2);
        placeExternal(city.detail, 'desk_lamp_arm_01', stationX + .15, .993, stationZ + .69, -.9);
        externalAssets.place(city.detail, 'office_notepads', stationX - .13, .994, stationZ + .14, -1.25, 1, 'office_notepads_a4_stack');
        placeExternal(city.detail, 'painted_wooden_chair_02', stationX + .91, .205, stationZ + .16, 1.35, .83);
        city.colliderSpecs.push({ min: new Vector3(stationX - .46, .16, stationZ - 1), max: new Vector3(stationX + .46, .978, stationZ + 1), surface: 'metal' });
        for (const dz of [-3.5, -2.68, 3.4]) placeExternal(city.detail, 'painted_wooden_chair_02', bx0 + 1.55, .205, entZ + dz, -1.56, .83);
        for (const dz of [-2.4, 2.4]) placeExternal(city.detail, 'industrial_wall_lamp', bx0 - .55, 2.75, entZ + dz, -Math.PI / 2);
        const secondX = stationX + 3.6, secondZ = entZ + 2.12;
        placeExternal(city.detail, 'metal_office_desk', secondX, .205, secondZ, Math.PI);
        placeExternal(city.detail, 'painted_wooden_chair_02', secondX + .18, .205, secondZ - .82, -.14, .83);
        placeExternal(city.detail, 'desk_lamp_arm_01', secondX + .68, .993, secondZ + .08, 2.64);
        externalAssets.place(city.detail, 'office_notepads', secondX - .38, .993, secondZ + .05, .17, 1, 'office_notepads_yellow_pad');
        city.colliderSpecs.push({ min: new Vector3(secondX - 1, .205, secondZ - .46), max: new Vector3(secondX + 1, .993, secondZ + .46), surface: 'metal' });
        // Grounded woven dispatch runner rug + warm desk contact pools
        addBox(city.detail, M.cargoNavy, 7.6, .016, 2.35, bx0 + 6.2, .213, entZ + .15);
        addBox(city.detail, M.hazard, 7.66, .014, .06, bx0 + 6.2, .214, entZ - 1.04);
        addBox(city.detail, M.hazard, 7.66, .014, .06, bx0 + 6.2, .214, entZ + 1.34);
        // 《失联名单》 Evidence Caseboard on south interior wall (cork frame + pinned manifests + red investigation pins)
        addBox(city.detail, M.wood, 2.68, 1.34, .07, bx0 + 6.0, 2.18, entZ + 3.34);
        addBox(city.detail, M.concreteDirty, 2.52, 1.18, .05, bx0 + 6.0, 2.18, entZ + 3.31);
        for (const [px, py, pw, ph, matP] of [
          [-0.78, 0.24, 0.44, 0.56, M.craneWhite], [-0.12, 0.18, 0.52, 0.38, M.glassWarm],
          [0.58, 0.26, 0.46, 0.50, M.craneWhite], [-0.45, -0.26, 0.48, 0.34, M.craneWhite],
          [0.24, -0.24, 0.54, 0.36, M.craneWhite], [0.88, -0.22, 0.34, 0.42, M.glassCyan],
        ]) {
          addBox(city.detail, matP, pw, ph, .025, bx0 + 6.0 + px, 2.18 + py, entZ + 3.28);
          addBox(city.detail, M.redCore, .04, .04, .035, bx0 + 6.0 + px, 2.18 + py + ph * 0.42, entZ + 3.26);
        }
        // Evidence locker bank & water dispenser along east return wall
        for (let lk = 0; lk < 3; lk++) {
          const lz = entZ + 1.15 + lk * 0.62;
          addBox(city.detail, M.steelDark, .58, 1.92, .56, bx0 + 11.45, 1.16, lz);
          addBox(city.detail, M.steelGalv, .04, .18, .38, bx0 + 11.15, 1.72, lz);
          addBox(city.detail, M.steelGalv, .04, .05, .14, bx0 + 11.15, 1.18, lz);
        }
        city.colliderSpecs.push({ min: new Vector3(bx0 + 11.1, .2, entZ + 0.8), max: new Vector3(bx0 + 11.8, 2.1, entZ + 2.75), surface: 'metal' });
        addBox(city.detail, M.craneWhite, .42, .96, .42, bx0 + 3.65, .68, entZ - 3.15);
        addCyl(city.detail, M.glassCyan, .15, .44, bx0 + 3.65, 1.38, entZ - 3.15);
        // Calibrated warm practical task lighting + warm-neutral overhead bounce (eliminates cold grey flatness!)
        const workLight = new THREE.PointLight(0xffd299, 15.5, 14, 1.65);
        workLight.position.set(stationX + .19, 2.15, stationZ + .56);
        city.detail.add(workLight);
        const desk2Light = new THREE.PointLight(0xffcf94, 10.5, 11, 1.75);
        desk2Light.position.set(secondX + .55, 2.05, secondZ + .05);
        city.detail.add(desk2Light);
        const lobbyFill = new THREE.PointLight(0xfff0dc, 9.5, 16, 1.5);
        lobbyFill.position.set(bx0 + 6.2, 3.25, entZ + .2);
        city.detail.add(lobbyFill);
        const board = new Mesh(boxGeo, makeSignMat('HARBOR DISPATCH', 'WATCH 04    /    COASTAL RADIO', '#243d3d'));
        board.position.set(bx0 + 12.05, 2.25, entZ);
        board.scale.set(4.5, .86, .06);
        board.rotation.y = -Math.PI / 2;
        city.detail.add(board);
        addBox(city.detail, M.wood, .24, 2.5, 5.5, bx0 + 12.25, 1.65, entZ);
        for (const dz of [-5, 0, 5]) {
          addBox(city.detail, M.steelDark, 3.1, .12, .52, bx0 + 5.5, 3.68, entZ + dz);
          addBox(city.detail, M.steelGalv, 3.16, .04, .58, bx0 + 5.5, 3.63, entZ + dz);
          addBox(city.detail, M.glassWarm, 2.86, .04, .34, bx0 + 5.5, 3.595, entZ + dz);
        }
        addInteractiveDoor(city.shell, { id: 'city-precinct-door', labelZh: '沿海警务调度楼防爆门', x: bx0 + .2, y: .16, z: (bz0 + bz1) / 2, width: 3.9, height: 3.4, axis: 'z', initiallyOpen: false });
        addInteractiveTerminal(city.shell, {
          id: 'city-garage-call', promptZh: '按 [E] 城区警务车库召唤 SAR 四驱车', x: bx0 - .62, y: .31, z: entZ + 3.1, colorMat: M.glassWarm,
          onUse() {
            world.vehicle?.setPosition?.(new Vector3(-22, .15, -56));
            audio?.play?.('rail_touchdown', { pos: new Vector3(-22, 1, -56), ref: 18, gain: .5, jitter: .05 });
            world.tactical?.notify?.('🚙 SAR 战术四驱车已调度至沿海大道旁！按 [F] 登车', '🚙 SAR 4x4 dispatched to Coastal Blvd! Press [F]', false, 3.2);
          },
        });
      } else {
        const lot = makeParcel(blk.style, blk.cx, blk.cz, 245, 190);
        const skyline = buildingGen.buildDistantBuilding(root, blk);
        // Permanent fallback building footprint collider active whenever detailed multi-volume colliders aren't loaded yet!
        const fallbackBox = addPermanentCollider(
          new Vector3(blk.cx - blk.width / 2, 0.16, blk.cz - blk.depth / 2),
          new Vector3(blk.cx + blk.width / 2, 0.16 + blk.height, blk.cz + blk.depth / 2),
          { surface: 'concrete', tag: 'building-footprint' }
        );
        lot.onLodChange = (loaded, detailed, quality) => {
          const showFull = loaded && (detailed || quality !== 'low');
          lot.shell.visible = showFull;
          skyline.visible = !showFull;
        };
        let buildTask = null;
        let buildGeoDone = false;
        lot.onBuild = () => {
          if (!buildTask) {
            lot.colliderSpecs.length = 0;
            buildGeoDone = false;
            buildTask = buildingGen.createCoastalBuildingTask(lot.shell, blk, { colliderTarget: lot.colliderSpecs });
          }
          if (!buildGeoDone) {
            buildGeoDone = buildTask.step();
            if (buildGeoDone) {
              skyline.visible = false;
              if (fallbackBox && lot.colliderSpecs.length > 0) fallbackBox.disabled = true;
              return false;
            }
            return false;
          }
          if (typeof batchStaticGroup === 'function') batchStaticGroup(lot.shell, 96);
          if (typeof mergeStaticByMaterial === 'function') mergeStaticByMaterial(lot.shell, 96);
          return true;
        };
        lot.onUnload = () => {
          buildTask?.cancel?.();
          buildTask = null;
          lot.shell.traverse(node => { if (node.isInstancedMesh) node.dispose(); });
          lot.shell.clear();
          lot.colliderSpecs.length = 0;
          skyline.visible = true;
          if (fallbackBox) fallbackBox.disabled = false;
        };
      }
    }
    // Seafront Promenade Streetlamps, Warm Night Streetlight Pools & Pines along Coastal Blvd + x = +21!
    for (const z of [-44, -66, -92, -114]) {
      addStreetLamp(city.detail, -36.5, .16, z, 1);
      addStreetLamp(city.detail, -15.5, .16, z, -1);
      addStreetLamp(city.detail, 22.0, .16, z, -1);
      addPineTree(city.detail, 19.2, .16, z + 8, .85);
      if (typeof THREE.PointLight === 'function') {
        const lampPool = new THREE.PointLight(0xffb86c, 0, 26, 1.55);
        lampPool.position.set(z % 4 === 0 ? -21.5 : -30.5, 5.7, z);
        city.detail.add(lampPool);
        lightingSys?.registerDynamicLight?.(lampPool, { dayIntensity: 0, nightIntensity: 28 });
      }
    }
    if (typeof THREE.PointLight === 'function') {
      const porchGlow = new THREE.PointLight(0xffd298, 2.5, 16, 1.6);
      porchGlow.position.set(-15.8, 3.6, -55.0);
      city.detail.add(porchGlow);
      lightingSys?.registerDynamicLight?.(porchGlow, { dayIntensity: 1.5, nightIntensity: 20 });
    }
    addParkedSedan(city.detail, -32.2, .18, -52, 0, M.sedanDark);
    addParkedSedan(city.detail, 18.2, .18, -64, Math.PI, M.sedanGrey);
    addParkedSedan(city.detail, -32.2, .18, -106, 0, M.sedanBurgundy);
    for (const mz of [-40, -58, -76, -98, -118, -136]) placePortProp(city, city.detail, 'bollard_mooring', 22.8, .16, mz, 0, {}, false);
    for (const [lx, lz] of [[-37, -42], [-15, -76], [-37, -112], [18, -56], [18, -104], [-68, -76]]) placePortProp(city, city.detail, 'light_mast', lx, .16, lz, 0);
    placePortProp(city, city.detail, 'container40', -72, .16, -75, 0, { color: 'blue', doors: .5 });
    placePortProp(city, city.detail, 'container20', -56, .16, -75, 0, { color: 'orange' });
    placePortProp(city, city.detail, 'forklift', -46, .16, -75.5, .35);
    placePortProp(city, city.detail, 'generator', -64, .16, -92.5, Math.PI / 2);
    placePortProp(city, city.detail, 'tarp_cargo', 6, .16, -75, .12);
    placePortProp(city, city.detail, 'cable_reel', 14, .16, -75.5, .4);
    // Articulated Steel-Truss & Mullioned Glass Pedestrian Skybridge at z = -104 & Off-Lane Transit Shelter
    addBox(horizonRoot, M.steelDark, 24.5, .42, 3.8, -26, 6.2, -104);
    addBox(horizonRoot, M.steelDark, 24.5, .36, 4.1, -26, 9.25, -104);
    // Full bridge span colliders (deck, roof & side glass walls — leaves 0..5.9m roadway underneath 100% clear!)
    addPermanentCollider(new Vector3(-38.25, 5.95, -105.95), new Vector3(-13.75, 6.45, -102.05), { surface: 'metal', tag: 'skybridge-deck', noNav: true });
    addPermanentCollider(new Vector3(-38.35, 9.05, -106.10), new Vector3(-13.65, 9.60, -101.90), { surface: 'metal', tag: 'skybridge-roof', noNav: true });
    addPermanentCollider(new Vector3(-37.80, 6.40, -105.85), new Vector3(-14.20, 9.10, -105.55), { surface: 'glass', tag: 'skybridge-wall', noNav: true });
    addPermanentCollider(new Vector3(-37.80, 6.40, -102.45), new Vector3(-14.20, 9.10, -102.15), { surface: 'glass', tag: 'skybridge-wall', noNav: true });
    addBox(horizonRoot, curbStoneMat, 24.8, .16, 4.25, -26, 9.48, -104);
    for (const sz of [-105.7, -102.3]) {
      addBox(horizonRoot, smokedPane, 23.6, 2.65, .14, -26, 7.7, sz);
      for (let mx = -36; mx <= -16; mx += 2.5) addBox(city.detail, M.steelGalv, .14, 2.75, .20, mx, 7.7, sz);
    }
    for (const sx of [-37.8, -14.2]) {
      addBox(horizonRoot, curbStoneMat, 1.8, 6.2, 4.0, sx, 3.1, -104);
      addBox(city.detail, M.steelGalv, 2.2, .18, 4.3, sx, 6.2, -104);
      addPermanentCollider(new Vector3(sx - 0.95, 0, -106.05), new Vector3(sx + 0.95, 6.3, -101.95), { surface: 'concrete' });
    }
    addBox(city.detail, M.steelDark, 1.8, .12, 5.6, -15.2, 2.82, -44);
    for (const z of [-46.5, -41.5]) addBox(city.detail, M.steelGalv, .09, 2.58, .09, -14.45, 1.57, z);
    addBox(city.detail, smokedPane, .10, 2.2, 5.2, -14.4, 1.56, -44);
    addBox(city.detail, M.wood, .55, .48, 3.8, -15.0, .50, -44);
    city.colliderSpecs.push({ min: new Vector3(-15.32, 0.16, -46.75), max: new Vector3(-14.30, 2.90, -41.25), surface: 'metal' });
    addParkedSedan(city.detail, 18.2, .18, -110, Math.PI, M.sedanDark);
    addParkedSedan(city.detail, -32.2, .18, -40, 0, M.sedanGrey);
    // Street-level urban life: fire hydrants, municipal litter bins, crosswalk stop bars & coastal bike rack
    for (const [hx, hz] of [[-15.4, -49.5], [-36.6, -63.5], [-15.4, -84.5], [-36.6, -98.5]]) {
      addCyl(city.detail, M.craneRed, .14, .72, hx, .54, hz);
      addCyl(city.detail, M.steelGalv, .16, .10, hx, .92, hz);
      addBox(city.detail, M.craneRed, .38, .12, .12, hx, .72, hz);
      city.colliderSpecs.push({ min: new Vector3(hx - .2, .16, hz - .2), max: new Vector3(hx + .2, 1.0, hz + .2), surface: 'metal' });
    }
    for (const [tx, tz] of [[-15.5, -59.5], [-36.5, -51.5], [-15.5, -94.5], [-36.5, -78.5], [14.6, -54.0], [14.6, -86.0]]) {
      addBox(city.detail, M.steelDark, .48, .88, .48, tx, .62, tz);
      addBox(city.detail, M.steelGalv, .52, .10, .52, tx, 1.08, tz);
      addBox(city.detail, M.hazard, .50, .08, .50, tx, .86, tz);
      city.colliderSpecs.push({ min: new Vector3(tx - .26, .16, tz - .26), max: new Vector3(tx + .26, 1.12, tz + .26), surface: 'metal' });
    }
    for (const cz of [-56, -96]) {
      addBox(city.detail, M.whitePaint, 13.5, .025, .42, -26, .205, cz - 3.2);
      addBox(city.detail, M.whitePaint, 13.5, .025, .42, -26, .205, cz + 3.2);
    }
    // Municipal steel bike rack outside Maritime Exchange (-36.4, -67)
    for (let bi = 0; bi < 4; bi++) {
      const bz = -68.6 + bi * 0.95;
      addBox(city.detail, M.steelGalv, .05, .72, .05, -36.5, .54, bz);
      addBox(city.detail, M.steelGalv, .05, .72, .05, -35.8, .54, bz);
      addBox(city.detail, M.steelGalv, .75, .05, .05, -36.15, .90, bz);
    }
    city.colliderSpecs.push({ min: new Vector3(-36.6, .16, -69.0), max: new Vector3(-35.7, .95, -65.4), surface: 'metal' });
    // Cleanly placed street utilities & AC units mounted on solid rear/side walls (ZERO glass window clipping!)
    placeExternal(city.detail, 'utility_box_01', -15.6, .31, -66.8, -Math.PI / 2, 1.0);
    placeExternal(city.detail, 'utility_box_01', -35.8, .16, -91.5, Math.PI / 2, 1.0);
    placeExternal(city.detail, 'portable_generator', -38.5, .16, -54.0, .4, 1.0);
    placeExternal(city.detail, 'exterior_aircon_unit', 14.8, 1.8, -62.5, Math.PI / 2, 1.0);
    placeExternal(city.detail, 'exterior_aircon_unit', 14.8, 1.8, -48.5, Math.PI / 2, 1.0);
    placeExternal(city.detail, 'modular_electricity_poles', -36.5, .16, -122.0, 0, 1.0);
    placeExternal(city.detail, 'modular_electricity_poles', -68.0, .16, -122.0, 0, 1.0);

    // =========================================================================
    // SECTOR 2 (INLAND WEST-CENTER): MOUNTAIN RIDGE & +14m SATELLITE COMMS
    // STRICTLY INLAND (x: -220..-110, z: -120..-35) — overlooks the City & East Sea!
    // =========================================================================
    const mountain = makeSector('mountain', '西岸山地卫星通信站 (+14m)', 'Mountain Ridge Comms (+14m)', [-168, 14, -78], 165);
    // Smooth 3-Segment Steel-Girder Railway Overpass Bridge + Mountain Approach Highway
    // ZERO steps poking above asphalt, ZERO blocks on railway tracks (x = -126..-147), >1.15m clearance above 3.98m freight train!
    const summitY = 14.0, bridgeY = 5.60;
    const addRampSpan = (xStart, yStart, xEnd, yEnd, steps) => {
      const dx = xStart - xEnd, dy = yEnd - yStart;
      const len = Math.hypot(dx, dy);
      const ang = -Math.atan2(dy, dx);
      const midX = (xStart + xEnd) / 2, midY = (yStart + yEnd) / 2;
      const addTilted = (mat, w, h, d, yOff, zPos) => {
        const m = new Mesh(getWorldBoxGeo(w, h, d, 3.0), mat);
        m.position.set(midX, midY + yOff, zPos); m.rotation.z = ang;
        m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix();
        horizonRoot.add(m); return m;
      };
      addTilted(M.asphalt, len + .4, .48, 14.2, -.24, -78);
      addTilted(M.yellowPaint, len - .8, .03, .22, .03, -78);
      addTilted(M.steelWorn, len + .4, .58, .36, .28, -85.25);
      addTilted(M.steelWorn, len + .4, .58, .36, .28, -70.75);
      addTilted(M.yellowPaint, len + .3, .08, .12, .92, -85.25);
      addTilted(M.yellowPaint, len + .3, .08, .12, .92, -70.75);
      // Smooth under-deck structural concrete beam strictly BELOW asphalt (never pokes through!)
      addTilted(M.concreteDirty, len, .72, 13.6, -.82, -78);
      for (let i = 0; i < steps; i++) {
        const f0 = i / steps, f1 = (i + 1) / steps;
        const sx0 = xStart + (xEnd - xStart) * f0;
        const sx1 = xStart + (xEnd - xStart) * f1;
        const sy = yStart + dy * f1;
        addPermanentCollider(new Vector3(Math.min(sx0, sx1) - .15, sy - 1.0, -85.1), new Vector3(Math.max(sx0, sx1) + .15, sy, -70.9), { surface: 'concrete', tag: 'bridge-ramp' });
      }
    };
    // Segment 1: East Approach Ramp (x: -112 -> -124, y: 0.21 -> 5.60, 26 fine 0.21m steps)
    addRampSpan(-112, .21, -124, bridgeY, 26);
    // Segment 2: Open-Span Steel-Girder Overpass Bridge over ALL 4 Rail Tracks (x: -124 -> -150, level y = 5.60, bottom y = 5.12)
    addBox(horizonRoot, M.asphalt, 26.4, .48, 14.2, -137, bridgeY - .24, -78);
    addBox(horizonRoot, M.yellowPaint, 25.0, .03, .22, -137, bridgeY + .03, -78);
    for (const gz of [-85.25, -70.75]) {
      addBox(horizonRoot, M.steelWorn, 26.6, .85, .42, -137, bridgeY + .18, gz); // Heavy riveted side steel girder
      addBox(horizonRoot, M.steelGalv, 26.6, .14, .56, -137, bridgeY + .64, gz);
      addBox(horizonRoot, M.yellowPaint, 26.4, .09, .12, -137, bridgeY + 1.18, gz); // Bridge top safety rail
      addPermanentCollider(new Vector3(-150.2, bridgeY, gz - .25), new Vector3(-123.8, bridgeY + 1.25, gz + .25), { surface: 'metal', tag: 'bridge-rail', noNav: true });
      for (let px = -149; px <= -125; px += 4.0) {
        addBox(horizonRoot, M.steelDark, .18, 1.15, .18, px, bridgeY + .62, gz);
      }
    }
    // Bridge piers placed strictly OUTSIDE the rail corridor (x = -121.8 and x = -151.6)
    for (const px of [-121.8, -151.6]) {
      addBox(horizonRoot, M.concrete, 1.8, .65, 14.6, px, bridgeY - .78, -78); // Crosshead cap beam
      for (const pz of [-84.0, -72.0]) {
        addBox(horizonRoot, M.concreteDirty, 1.6, bridgeY - .95, 1.8, px, (bridgeY - .95) / 2 + .16, pz);
        addPermanentCollider(new Vector3(px - .85, .16, pz - .95), new Vector3(px + .85, bridgeY - .6, pz + .95), { surface: 'concrete', tag: 'bridge-pier' });
      }
    }
    addPermanentCollider(new Vector3(-150.2, bridgeY - .55, -85.1), new Vector3(-123.8, bridgeY, -70.9), { surface: 'concrete', tag: 'bridge-deck' });
    // Segment 3: West Mountain Climb Ramp (x: -150 -> -168, y: 5.60 -> 14.0, 44 fine 0.19m steps)
    addRampSpan(-150, bridgeY, -168, summitY, 44);
    // Sloped rocky embankment piers ONLY under Segment 3 (west of x = -152, strictly below road surface)
    for (const [ex, eh] of [[-155, 6.2], [-160, 8.6], [-165, 11.0]]) {
      addBox(mountain.shell, M.concreteDirty, 4.6, eh, 13.4, ex, eh / 2 + .16, -78);
      addBox(mountain.shell, M.rock, 5.4, eh * .85, 8.5, ex, (eh * .85) / 2 + .16, -89.5);
      addBox(mountain.shell, M.rock, 5.4, eh * .85, 8.5, ex, (eh * .85) / 2 + .16, -66.5);
      addPineTree(mountain.detail, ex, eh * .85 + .16, -90.2, 1.05);
      addPineTree(mountain.detail, ex, eh * .85 + .16, -65.8, 1.0);
    }
    // Keep the surveyed summit and access road level. Along the exposed faces
    // the cliff breaks into inclined shelves, with smaller fractures between strata.
    const rockVertices = [], rockUvs = [];
    for (const [x0,z0,x1,z1,nx,nz] of [
      [-221,-119,-167,-119,0,-1],[-167,-37,-221,-37,0,1],
      [-221,-37,-221,-119,-1,0],[-167,-119,-167,-85,1,0],[-167,-71,-167,-37,1,0],
    ]) {
      const steps = Math.ceil(Math.hypot(x1-x0,z1-z0)/3);
      const sample = (i, layer) => {
        const t=i/steps, x=x0+t*(x1-x0), z=z0+t*(z1-z0);
        const noise=Math.sin(x*.63+z*.41)+.45*Math.cos(x*.27-z*.85);
        const reach=(1-layer/4)*(4.2+noise) + Math.sin(layer*Math.PI/4)*noise*.55;
        return [x+reach*nx, summitY*layer/4 + Math.sin(layer*Math.PI/4)*noise*.87, z+reach*nz];
      };
      for (let i=0;i<steps;i++) for (let j=0;j<4;j++) {
        const a=sample(i,j), b=sample(i+1,j), c=sample(i,j+1), d=sample(i+1,j+1);
        for (const v of [a,c,b,b,c,d]) {
          rockVertices.push(...v);
          rockUvs.push((nx ? v[2] : v[0])/3, v[1]/3);
        }
      }
    }
    const cliff = new THREE.BufferGeometry();
    cliff.setAttribute('position', new THREE.Float32BufferAttribute(rockVertices,3));
    cliff.setAttribute('uv', new THREE.Float32BufferAttribute(rockUvs,2));
    cliff.computeVertexNormals();
    const rockFace = M.rock.clone();
    rockFace.side = THREE.DoubleSide;
    mountain.shell.add(new Mesh(cliff,rockFace));
    addBox(mountain.shell, M.coastalGrass, 54, .25, 82, -194, summitY-.125, -78);
    mountain.colliderSpecs.push({ min: new Vector3(-221, 0, -119), max: new Vector3(-167, summitY, -37), surface: 'concrete' });
    solid(mountain, mountain.shell, M.asphalt, -214, summitY - .2, -98, -168, summitY + .06, -58, 'concrete', true);
    for (const [tx, tz, sc] of [
      [-174, -108, 1.25], [-192, -110, 1.35], [-212, -104, 1.2],
      [-214, -76, 1.3], [-210, -48, 1.2], [-184, -46, 1.15],
    ]) addPineTree(mountain.detail, tx, summitY, tz, sc);

    // Area-1-Grade Armored Mountain Comms Bunker (structural steel H-columns, recessed windows, roof parapet railings & HVAC)
    solid(mountain,mountain.shell,M.concrete,-206,summitY,-86,-205.5,summitY+7.2,-70);
    for (const edge of [-86,-70.5]) solid(mountain,mountain.shell,M.concrete,-206,summitY,edge,-190,summitY+7.2,edge+.5);
    for (const [lo,hi] of [[-86,-79.8],[-76.2,-70]]) solid(mountain,mountain.shell,M.concreteDirty,-190.5,summitY,lo,-190,summitY+7.2,hi);
    solid(mountain,mountain.shell,M.concrete,-190.5,summitY+3.2,-79.8,-190,summitY+7.2,-76.2);
    solid(mountain,mountain.shell,M.concreteDirty,-206.45,summitY+6.92,-86.45,-189.55,summitY+7.28,-69.55);
    // Corner pilasters, exterior steel H-columns, base plinth & roof parapet coping
    for (const px of [-206.05, -200.6, -195.3, -189.95]) {
      for (const pz of [-86.05, -69.95]) addBox(mountain.detail, M.steelDark, .44, 7.4, .44, px, summitY + 3.7, pz);
    }
    addBox(mountain.detail, M.concreteDirty, 16.8, .92, 16.8, -198, summitY + .46, -78);
    addBox(mountain.detail, M.steelDark, 16.9, .24, 16.9, -198, summitY + 7.36, -78);
    // Recessed armored observation windows on North & South bunker walls
    for (const wz of [-86.06, -69.94]) {
      for (const wx of [-203.2, -198.0, -192.8]) {
        addBox(mountain.detail, M.steelDark, 3.2, 1.55, .28, wx, summitY + 4.8, wz);
        addBox(mountain.detail, smokedPane, 2.86, 1.24, .32, wx, summitY + 4.8, wz);
        addBox(mountain.detail, M.concrete, 3.45, .18, .38, wx, summitY + 3.98, wz);
      }
    }
    // Rooftop perimeter yellow safety handrails & corner aviation strobes around antenna plinth
    for (const rz of [-86.1, -69.9]) {
      addBox(mountain.detail, M.yellowPaint, 16.2, .08, .08, -198, summitY + 8.35, rz);
      for (let rx = -205.8; rx <= -190.1; rx += 3.1) addBox(mountain.detail, M.steelGalv, .08, 1.05, .08, rx, summitY + 7.82, rz);
    }
    for (const rx of [-206.1, -189.9]) {
      addBox(mountain.detail, M.yellowPaint, .08, .08, 16.2, rx, summitY + 8.35, -78);
      for (let rz = -85.8; rz <= -70.1; rz += 3.1) addBox(mountain.detail, M.steelGalv, .08, 1.05, .08, rx, summitY + 7.82, rz);
    }
    for (const [bx, bz] of [[-206.0, -86.0], [-190.0, -86.0], [-206.0, -70.0], [-190.0, -70.0]]) {
      addBox(mountain.detail, M.redCore, .32, .40, .32, bx, summitY + 8.58, bz);
    }
    // Exterior HVAC unit & galvanized cable conduit trays
    addBox(mountain.detail, M.steelWorn, 2.6, 1.6, 1.8, -203.8, summitY + 8.08, -73.0);
    addBox(mountain.detail, M.steelGalv, 2.4, .22, 1.6, -203.8, summitY + 8.95, -73.0);
    for (const z of [-83.3,-72.6]) {
      addBox(mountain.detail,M.steelDark,.14,2.12,2.65,-189.91,summitY+4.55,z);
      for(let row=0;row<8;row++) {
        const louvre=addBox(mountain.detail,M.steelGalv,.21,.065,2.46,-189.82,summitY+3.78+row*.22,z);
        louvre.rotation.z=.32;
        louvre.updateMatrix();
      }
      addCyl(mountain.detail,M.steelWorn,.08,6.95,-189.86,summitY+3.51,z-1.53);
    }
    addBox(mountain.detail,M.steelDark,1.6,.13,4.4,-189.33,summitY+3.47,-78);
    const relaySign=addBox(mountain.detail,makeSignMat('RIDGE RELAY','MICROWAVE LINK   /   07','#38443e'),2.12,.79,.11,-189.87,summitY+2.47,-81.8);
    relaySign.rotation.y=Math.PI/2;
    relaySign.updateMatrix();
    for(const [x,z] of [[-205,-108],[-209,-112],[-181,-109],[-185,-45],[-177,-44],[-214,-51]]) {
      const outcrop=new Mesh(new THREE.DodecahedronGeometry(1,0),M.rock);
      outcrop.position.set(x,summitY+.26,z);
      outcrop.scale.set(1.7+Math.abs(x%3)*.35,.9,1.18);
      outcrop.rotation.set(.13,x*.21,.27);
      mountain.detail.add(outcrop);
      addPineTree(mountain.detail,x+1.8,summitY,z+.9,.56+Math.abs(z%4)*.13);
    }
    const dishBase = new Group();
    dishBase.position.set(-198, summitY + 7.2, -78);
    addCyl(dishBase,M.steelDark,.84,3.8,0,1.9,0);
    const dishHead = new Group(); dishHead.userData.noBatch = true; dishHead.position.y = 4.7;
    const reflector = new Group(); reflector.rotation.x = .94;
    const profile = Array.from({length:17}, (_,i) => {
      const r=i*4.8/16;
      return new THREE.Vector2(Math.max(.01,r), .061*r*r);
    });
    const dishMetal = M.steelGalv.clone();
    dishMetal.side = THREE.DoubleSide;
    const bowl = new Mesh(new THREE.LatheGeometry(profile,64),dishMetal);
    addCyl(reflector,M.steelDark,.24,.45,0,3.8,0);
    for (let arm=0; arm<3; arm++) {
      const angle=arm*Math.PI*2/3;
      const from=new Vector3(Math.cos(angle)*4.4,1.2,Math.sin(angle)*4.4);
      const direction=new Vector3(0,3.7,0).sub(from);
      const mid=from.clone().addScaledVector(direction,.5);
      const strut=addCyl(reflector,M.steelDark,.052,direction.length(),mid.x,mid.y,mid.z);
      strut.quaternion.setFromUnitVectors(new Vector3(0,1,0),direction.normalize());
      strut.updateMatrix();
    }
    reflector.add(bowl);
    dishHead.add(reflector);
    dishBase.add(dishHead);
    horizonRoot.add(dishBase);
    updaters.push(dt => { dishHead.rotation.y += dt * .55; });

    addInteractiveDoor(mountain.shell, { id: 'mountain-bunker-door', labelZh: '山顶卫星通信掩体闸门', x: -189.6, y: summitY, z: -78, width: 3.6, height: 3.2, axis: 'z', initiallyOpen: false });
    addInteractiveTerminal(mountain.shell, {
      id: 'mountain-radar-scan', promptZh: '按 [E] 启动 +14m 卫星全城雷达扫描', x: -187.2, y: summitY, z: -73.5, colorMat: M.glassCyan,
      onUse() {
        const enemiesAlive = world.enemies?.aliveCount?.() ?? 0;
        audio?.play?.('rail_touchdown', { pos: new Vector3(-187, summitY + 1, -73.5), ref: 20, gain: .5, jitter: .04 });
        world.tactical?.notify?.(`📡 卫星全城扫描完成：当前在线敌军 ${enemiesAlive} · 7 大港区岸线气象实时同步`, `📡 Citywide satellite scan complete: ${enemiesAlive} hostiles`, false, 4.2);
      },
    });

    spawnShootTarget(mountain.shell, { id: 'sat-core-1', stage: 4, labelZh: '北侧卫星散热芯', pos: new Vector3(-186, summitY, -84), tall: false, maxHp: 3 });
    spawnShootTarget(mountain.shell, { id: 'sat-core-2', stage: 4, labelZh: '中侧卫星散热芯', pos: new Vector3(-186, summitY, -72), tall: false, maxHp: 3 });
    spawnShootTarget(mountain.shell, { id: 'sat-core-3', stage: 4, labelZh: '南侧卫星散热芯', pos: new Vector3(-196, summitY, -66), tall: false, maxHp: 3 });

    // =========================================================================
    // SECTOR 3 (NORTHWEST): COASTAL AIRFIELD & ARCHED HANGAR (x: -222..-110, z: -225..-120)
    // =========================================================================
    const airfield = makeSector('airfield', '海岸应急机场与机库', 'Coastal Airfield & Hangar', [-166, 0, -172], 165);
    // Elevated Runway Deck (top y = +0.05m — cleanly above base land y=0.00m, ZERO Z-fighting!)
    addBox(airfield.shell, M.asphalt, 106, .05, 34, -166, .185, -172);
    for (let x = -214; x <= -118; x += 9) {
      addBox(airfield.detail, M.whitePaint, 4.6, .015, .45, x, .24, -172);
      addBox(airfield.detail, M.blueTaxi, .24, .32, .24, x, .20, -158);
      addBox(airfield.detail, M.blueTaxi, .24, .32, .24, x, .20, -186);
    }
    // Airfield Aviation Fuel Depot (3 horizontal cylindrical storage tanks on concrete cradles)
    for (const fz of [-198, -204, -210]) {
      addCyl(airfield.detail, M.steelGalv, 1.35, 8.5, -204, 1.85, fz, 0, Math.PI / 2);
      addBox(airfield.detail, M.concrete, .6, 1.2, 2.2, -207, .6, fz);
      addBox(airfield.detail, M.concrete, .6, 1.2, 2.2, -201, .6, fz);
    }
    const hx = -168, hz = -204;
    addBox(airfield.shell, M.asphalt, 68, .04, 24, hx - 15, .175, hz + 18);
    // Twin Side-by-Side Arched Quonset Hangars (Blueprint 07 海岸应急机场)
    for (const ahx of [hx, hx - 31]) {
      solid(airfield, airfield.shell, M.corrugated, ahx - 14, 0, hz - 11, ahx - 13.2, 8.2, hz + 11, 'metal', true);
      solid(airfield, airfield.shell, M.corrugated, ahx + 13.2, 0, hz - 11, ahx + 14, 8.2, hz + 11, 'metal', true);
      solid(airfield, airfield.shell, M.corrugated, ahx - 14, 0, hz - 11, ahx + 14, 8.2, hz - 10.2, 'metal', true);
      const archRoof = new Mesh(new CylinderGeometry(14.2, 14.2, 22, 24, 1, true, Math.PI / 2, Math.PI), hangarArchMat);
      archRoof.rotation.set(Math.PI / 2, 0, 0);
      archRoof.position.set(ahx, 8.0, hz);
      archRoof.matrixAutoUpdate = false; archRoof.updateMatrix();
      horizonRoot.add(archRoof);
      if (THREE.CircleGeometry) {
        const rearGable = new Mesh(new THREE.CircleGeometry(14.1, 24, 0, Math.PI), hangarArchMat);
        rearGable.position.set(ahx, 8.0, hz - 10.6);
        rearGable.matrixAutoUpdate = false; rearGable.updateMatrix();
        horizonRoot.add(rearGable);
      }
    }
    // Pine Forest Belt bordering Airfield Plateau (Blueprint NW Forest Rim)
    for (const [px, pz, sc] of [
      [-218, -216, 1.3], [-218, -196, 1.2], [-218, -172, 1.35], [-218, -148, 1.2],
      [-196, -220, 1.25], [-168, -220, 1.3], [-142, -220, 1.2], [-118, -212, 1.25],
      [-208, -126, 1.15], [-182, -126, 1.2], [-156, -126, 1.15],
    ]) addPineTree(airfield.detail, px, .16, pz, sc);
    // Runway piano-key threshold markings on BOTH ends & Parked Twin-Turboprop SAR Transport Aircraft
    for (let rz = -183; rz <= -161; rz += 3.6) {
      addBox(airfield.detail, M.whitePaint, 5.2, .03, 1.6, -116, .235, rz);
      addBox(airfield.detail, M.whitePaint, 5.2, .03, 1.6, -215, .235, rz);
    }
    addBox(airfield.detail, M.glassWarm, 8.0, .2, 1.4, hx, 9.2, hz);
    const parkedAircraft = window.createParkedTransport(THREE);
    const plane = parkedAircraft.root;
    plane.userData.noBatch = true;
    plane.scale.setScalar(1.8);
    plane.updateMatrixWorld(true);
    const gearBounds = new THREE.Box3().setFromObject(plane, true);
    plane.position.set(-172, .05 - gearBounds.min.y, -184);
    plane.rotation.y = .35;
    const planeBasePos = plane.position.clone();
    const planeBaseYaw = plane.rotation.y;
    const planeProps = [], planeBlades = [], planeDiscs = [];
    airfield.detail.add(plane);
    const rubber = new MeshStandardMaterial({color:0x262726,roughness:.94});
    const contactShade = document.createElement('canvas');
    contactShade.width=contactShade.height=64;
    const shadeCtx=contactShade.getContext('2d');
    const gradient=shadeCtx.createRadialGradient(32,32,2,32,32,31);
    gradient.addColorStop(0,'rgba(10,13,15,.49)');
    gradient.addColorStop(1,'rgba(10,13,15,0)');
    shadeCtx.fillStyle=gradient;
    shadeCtx.fillRect(0,0,64,64);
    const shadowMap=new THREE.CanvasTexture(contactShade);
    const shadow=new Mesh(new THREE.PlaneGeometry(12,17),new MeshBasicMaterial({
      map:shadowMap,transparent:true,depthWrite:false,
    }));
    shadow.rotation.set(-Math.PI/2,0,.35);
    shadow.position.set(-172,.074,-184);
    airfield.detail.add(shadow);
    for (const [x,z,w,d] of [[-8.1,-56.15,1.45,2.6],[-7.19,-55.99,.95,.95],
      [-11.95,-58.5,.86,.86],[-11.95,-57.68,.86,.86],[-11.95,-51.6,.86,.86]]) {
      const contact=new Mesh(shadow.geometry,shadow.material);
      contact.rotation.x=-Math.PI/2;
      contact.scale.set(w/12,d/17,1);
      contact.position.set(x,.209,z);
      city.detail.add(contact);
    }
    plane.updateMatrixWorld(true);
    plane.traverse(node=>{
      if (node.name==='aircraft-propeller') planeProps.push(node);
      else if (node.name==='aircraft-propeller-blades') planeBlades.push(node);
      else if (node.name==='aircraft-propeller-disc') planeDiscs.push(node);
      if (node.name!=='aircraft-landing-gear') return;
      const wheel=node.getWorldPosition(new Vector3());
      for(const side of [-1,1]) {
        const chock=addBox(airfield.detail,rubber,.64,.18,.21,wheel.x,.14,wheel.z+side*.38);
        chock.rotation.x=side*.24;
        chock.updateMatrix();
      }
    });
    const planeColliders = [];
    {
      const cA = Math.cos(planeBaseYaw), sA = Math.sin(planeBaseYaw);
      const makePlaneBox = (lx0, lx1, lz0, lz1, y0, y1) => {
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        for (const lx of [lx0, lx1]) for (const lz of [lz0, lz1]) {
          const wx = planeBasePos.x + lx * cA + lz * sA;
          const wz = planeBasePos.z - lx * sA + lz * cA;
          if (wx < minX) minX = wx; if (wx > maxX) maxX = wx;
          if (wz < minZ) minZ = wz; if (wz > maxZ) maxZ = wz;
        }
        const b = addDynamicCollider(new Vector3(minX, y0, minZ), new Vector3(maxX, y1, maxZ), { surface: 'metal', tag: 'parked-aircraft', noNav: true });
        if (b) planeColliders.push(b);
      };
      makePlaneBox(-2.1, 2.1, -9.8, 9.8, 0.2, 4.6); // Fuselage
      makePlaneBox(-10.8, 10.8, -2.3, 2.3, 1.2, 4.2); // Main wing + engine nacelles
    }
    let finaleClock = 0;
    function resetParkedAircraft() {
      finaleSpinActive = false;
      finaleClock = 0;
      plane.position.copy(planeBasePos);
      plane.rotation.set(0, planeBaseYaw, 0);
      shadow.position.set(-172, .074, -184);
      shadow.material.opacity = 1;
      for (const b of planeBlades) b.visible = true;
      for (const d of planeDiscs) d.visible = false;
      for (const b of planeColliders) b.disabled = false;
    }
    updaters.push(dt => {
      if (!finaleSpinActive) return;
      finaleClock += dt;
      const rpm = Math.min(30, 5 + finaleClock * 10);
      for (const p of planeProps) p.rotation.z += dt * rpm;
      const blurred = finaleClock > 1.2;
      for (const b of planeBlades) b.visible = !blurred;
      for (const d of planeDiscs) d.visible = blurred;
      if (finaleClock > 2.0) {
        for (const b of planeColliders) b.disabled = true;
        const tRoll = finaleClock - 2.0;
        const fwd = Math.min(26, tRoll * 11);
        plane.position.x -= Math.sin(planeBaseYaw) * fwd * dt;
        plane.position.z -= Math.cos(planeBaseYaw) * fwd * dt;
        shadow.position.x = plane.position.x;
        shadow.position.z = plane.position.z;
        if (tRoll > 1.35) {
          const climb = tRoll - 1.35;
          plane.position.y += Math.min(14, climb * 5.2) * dt;
          plane.rotation.x = Math.min(.22, climb * .09);
          shadow.material.opacity = Math.max(0, 1 - climb * .45);
        }
      }
    });
    for (const [hIdx, ahx] of [[0, hx], [1, hx - 31]]) {
      for (const side of [-1, 1]) {
        const x = ahx + side * 9.25;
        solid(airfield, airfield.shell, M.corrugated, x - 4.85, 0, hz + 10.5, x + 4.85, 6.65, hz + 10.82, 'metal', true);
        for (let dx = -4; dx <= 4; dx += 2) {
          addBox(airfield.detail, M.steelDark, 1.82, 1.22, .18, x + dx, 5.52, hz + 10.92);
          addBox(airfield.detail, smokedPane, 1.64, 1.05, .08, x + dx, 5.52, hz + 11.06);
        }
      }
      addBox(airfield.shell, M.steelWorn, 28, .42, .52, ahx, 6.85, hz + 10.75);
      addBox(airfield.detail, M.hazard, 10.2, .22, .56, ahx, 6.52, hz + 10.78);
      addBox(airfield.detail, makeSignMat(hIdx === 0 ? 'COASTAL AIR RESCUE' : 'AIRFRAME MAINTENANCE', hIdx === 0 ? 'FLIGHT OPERATIONS  /  01' : 'HANGAR BAY  /  02', hIdx === 0 ? '#354744' : '#263847'), 7.0, 1.38, .12, ahx, 7.72, hz + 10.95);
      addBox(airfield.detail, M.redCore, .36, .42, .36, ahx, 22.35, hz + 10.4);
      addBox(airfield.detail, M.glassWarm, 8.0, .2, 1.4, ahx, 9.2, hz);
      for (const dz of [-10.6, -4, 3, 10.6]) {
        const rib = new Mesh(new THREE.TorusGeometry(14.08, .15, 6, 40, Math.PI), M.steelGalv);
        rib.position.set(ahx, 8, hz + dz);
        airfield.detail.add(rib);
        for (const side of [-1, 1]) addBox(airfield.detail, M.steelDark, .36, 8, .42, ahx + side * 13.9, 4, hz + dz);
      }
    }
    placePortProp(airfield, airfield.detail, 'toolbox_cart', hx - 35, .16, hz - 3, .3);
    placePortProp(airfield, airfield.detail, 'generator', hx - 26, .16, hz - 4, Math.PI / 2);
    placePortProp(airfield, airfield.detail, 'shelf_rack', hx - 41, .16, hz, Math.PI / 2);
    addInteractiveDoor(airfield.shell, { id: 'hangar-shutter', labelZh: '应急机库安全卷帘闸', x: hx, y: 0, z: hz + 10.8, width: 8.5, height: 5.2, axis: 'x', initiallyOpen: true });
    addInteractiveTerminal(airfield.shell, {
      id: 'airfield-dispatch', promptZh: '按 [E] 机场机库调度四驱车并补满弹药', x: -158, y: 0, z: -195, colorMat: M.glassWarm,
      onUse() {
        world.vehicle?.setPosition?.(new Vector3(-156, .15, -186));
        (world.weapon?.refill || world.weapon?.reset)?.call(world.weapon);
        audio?.play?.('rail_touchdown', { pos: new Vector3(-158, 1, -195), ref: 18, gain: .5, jitter: .05 });
        world.tactical?.notify?.('✈️ 机场机库补给完成：弹药已满，SAR 四驱车已在跑道就位！', '✈️ Airfield resupply complete & 4x4 ready!', false, 3.4);
      },
    });

    // Area-1-Grade Airfield ATC Control Tower (walkable exterior stairs, mullioned glass, glowing consoles & rotating radar!)
    addControlTower(airfield, horizonRoot, { x: -134, z: -204, baseH: 11.6, cabW: 9.6, cabD: 9.6, title: 'AIRFIELD ATC TOWER 07', signBg: '#1d2d44', hasRadar: true });
    addCyl(airfield.detail, M.steelGalv, .10, 7.5, -148, 3.75, -190);
    addCyl(airfield.detail, M.hazard, .42, 2.2, -146.9, 7.1, -190, 0, Math.PI / 2);
    // High-Density Airfield Upgrade: 2nd Maintenance Hangar, Crash Fire Station, Weather Radar Dome & Ground Equipment
    addIndustrialFacility(airfield, airfield.shell, {
      x0: -214, z0: -152, x1: -182, z1: -134, h: 7.4,
      wallMat: M.steelClad, roofMat: M.corrugated, title: 'AIRFIELD MAINTENANCE HANGAR 02', doorSide: 'north', signBg: '#1c303d', interiorKind: 'workshop',
    });
    addIndustrialFacility(airfield, airfield.shell, {
      x0: -168, z0: -150, x1: -136, z1: -134, h: 6.4,
      wallMat: M.clinicPlaster, roofMat: M.corrugated, title: 'CRASH FIRE RESCUE STATION', doorSide: 'north', signBg: '#6b1f1a', interiorKind: 'warehouse',
    });
    // Geodesic Weather Radar Radome on Concrete Plinth
    addCyl(horizonRoot, M.concrete, 3.6, 5.2, -124, 2.75, -144);
    const radome = new Mesh(sphGeo, M.craneWhite);
    radome.scale.set(4.1, 4.1, 4.1); radome.position.set(-124, 8.2, -144);
    radome.matrixAutoUpdate = false; radome.updateMatrix(); horizonRoot.add(radome);
    airfield.colliderSpecs.push({ min: new Vector3(-128, .16, -148), max: new Vector3(-120, 12.2, -140), surface: 'concrete' });
    addSemiTrailerTruck(airfield, airfield.detail, -196, .21, -186, Math.PI / 2, M.craneWhite); // Aviation fuel tanker
    for (const [lx, lz] of [[-194, -156], [-152, -156], [-126, -156], [-194, -190], [-146, -190]]) {
      placePortProp(airfield, airfield.detail, 'light_mast', lx, .16, lz, 0);
    }
    placePortProp(airfield, airfield.detail, 'container20', -154, .16, -206, 0, { color: 'orange' });
    placePortProp(airfield, airfield.detail, 'container20', -154, .16, -210, 0, { color: 'blue' });
    placePortProp(airfield, airfield.detail, 'forklift', -160, .16, -192, .45);
    placePortProp(airfield, airfield.detail, 'pallet_stack', -188, .16, -194, .15);
    placePortProp(airfield, airfield.detail, 'barrel', -196, .16, -198, 0, { color: 'red' });
    placePortProp(airfield, airfield.detail, 'generator', -142, .16, -196, Math.PI / 2);
    placePortProp(airfield, airfield.detail, 'jersey_barrier', -132, .16, -154, 0);
    // Poly Haven CC0 PBR Airfield Apron Equipment
    placeExternal(airfield.detail, 'portable_generator', -162, .16, -194, .5, 1.0);
    placeExternal(airfield.detail, 'utility_box_01', -138, .16, -199, 0, 1.0);
    placeExternal(airfield.detail, 'concrete_road_barrier', -144, .16, -155, 0, 1.0);
    placeExternal(airfield.detail, 'concrete_road_barrier', -152, .16, -155, 0, 1.0);
    placeExternal(airfield.detail, 'modular_industrial_pipes_01', -204, .16, -194, 0, 1.0);

    // =========================================================================
    // SECTOR 4 (WEST): NORTH-SOUTH CENTRAL RAIL CORRIDOR, TWIN MOUNTAIN TUNNEL & LEVEL CROSSING (Blueprint 04)
    // =========================================================================
    const railWest = makeSector('rail_west', '西区铁路货场与编组站', 'West Rail Freight Yard', [-144, 0, 2], 275);
    // 4 Parallel North-South Freight Tracks (x = -126, -133, -140, -147) running from North Tunnel (-115) to South Crossing (+144)
    const railTracks = [-126, -133, -140, -147];
    for (const tx of railTracks) {
      const zStart = (tx === -133 || tx === -140) ? -114 : -48;
      const zEnd = (tx === -133 || tx === -140) ? 144 : 44;
      const zLen = zEnd - zStart, zMid = (zStart + zEnd) / 2;
      addBox(horizonRoot, M.concreteDirty, 3.6, .08, zLen, tx, .17, zMid);
      for (const ox of [-.82, .82]) addBox(horizonRoot, M.steelDark, .14, .16, zLen, tx + ox, .24, zMid);
      for (let z = zStart + 2; z <= zEnd - 2; z += 2.6) addBox(railWest.detail, M.wood, 2.45, .08, .24, tx, .21, z);
    }
    // Twin-Bore Arched Concrete Mountain Railway Tunnel Portal at North Valley End (x = -136.5, z = -115)
    const tunG = new Group(); tunG.position.set(-136.5, .16, -115);
    addBox(tunG, M.concrete, 22.0, 11.5, 4.2, 0, 5.75, 0); // Concrete headwall
    addBox(tunG, M.concreteDirty, 23.2, 1.0, 4.8, 0, 11.6, 0); // Headwall parapet
    for (const bx of [-3.6, 3.6]) {
      addBox(tunG, M.steelDark, 4.6, 6.2, 4.5, bx, 3.1, .05); // Dark twin tunnel bores
      addCyl(tunG, M.steelDark, 2.3, 4.5, bx, 6.1, .05, Math.PI / 2, 0);
      addBox(tunG, M.hazard, 4.8, .28, .22, bx, 8.35, 2.15);
    }
    addBox(tunG, M.rock, 28.0, 14.5, 16.0, 0, 7.2, -9.5); // Rocky mountain cliff above tunnel
    tunG.matrixAutoUpdate = false; tunG.updateMatrix(); horizonRoot.add(tunG);
    addPermanentCollider(new Vector3(-148, .16, -118), new Vector3(-125, 12.0, -112), { surface: 'concrete', tag: 'rail-tunnel-north' });
    // Yellow-Hatched Railway Level Crossing at South Perimeter Road (x = -136.5, z = 122) with AUTO-LOWERING GATES & FLASHING LAMPS!
    addBox(horizonRoot, M.asphalt, 46.0, .04, 12.0, -136.5, .185, 122);
    for (let gx = -148; gx <= -125; gx += 2.4) addBox(horizonRoot, M.yellowPaint, .42, .015, 10.6, gx, .228, 122);
    for (let gz = 117; gz <= 127; gz += 2.4) addBox(horizonRoot, M.yellowPaint, 24.0, .015, .42, -136.5, .228, gz);
    const crossingGates = [], crossingLamps = [];
    for (const [cx, cz, sign] of [[-145.5, 115.5, 1], [-122, 128.5, -1]]) {
      addCyl(horizonRoot, M.steelDark, .16, 3.8, cx, 2.0, cz);
      const armPivot = new Group(); armPivot.userData.noBatch = true; armPivot.position.set(cx, 1.35, cz);
      for (let seg = 0; seg < 5; seg++) {
        addBox(armPivot, seg % 2 === 0 ? M.craneRed : M.craneWhite, .16, .16, 1.15, 0, 0, sign * (.7 + seg * 1.15));
      }
      horizonRoot.add(armPivot);
      crossingGates.push({ pivot: armPivot, sign });
      const lampL = new Mesh(boxGeo, M.redCore); lampL.scale.set(.28, .28, .28); lampL.position.set(cx - .35, 3.55, cz);
      const lampR = new Mesh(boxGeo, M.redCore); lampR.scale.set(.28, .28, .28); lampR.position.set(cx + .35, 3.55, cz);
      horizonRoot.add(lampL, lampR);
      crossingLamps.push([lampL, lampR]);
    }
    for (const gz of [-34, -10, 14, 38]) {
      addBox(railWest.detail, M.steelGalv, .38, 7.8, .38, -150.5, 4.0, gz);
      addBox(railWest.detail, M.steelGalv, .38, 7.8, .38, -122.5, 4.0, gz);
      addBox(railWest.detail, M.steelGalv, 28.6, .32, .32, -136.5, 7.6, gz);
    }
    // Matching Twin-Bore Arched Concrete Southern Railway Tunnel Portal (x = -136.5, z = +144) so trains NEVER vanish in thin air!
    const tunSouth = new Group(); tunSouth.position.set(-136.5, .16, 144);
    addBox(tunSouth, M.concrete, 22.0, 11.5, 4.2, 0, 5.75, 0);
    addBox(tunSouth, M.concreteDirty, 23.2, 1.0, 4.8, 0, 11.6, 0);
    for (const bx of [-3.6, 3.6]) {
      addBox(tunSouth, M.steelDark, 4.6, 6.2, 4.5, bx, 3.1, -.05);
      addCyl(tunSouth, M.steelDark, 2.3, 4.5, bx, 6.1, -.05, Math.PI / 2, 0);
      addBox(tunSouth, M.hazard, 4.8, .28, .22, bx, 8.35, -2.15);
    }
    addBox(tunSouth, M.rock, 28.0, 13.5, 14.0, 0, 6.6, 8.5);
    tunSouth.matrixAutoUpdate = false; tunSouth.updateMatrix(); horizonRoot.add(tunSouth);
    addPermanentCollider(new Vector3(-148, .16, 141), new Vector3(-125, 12.0, 147), { surface: 'concrete', tag: 'rail-tunnel-south' });
    // LIVE MOVING ARTICULATED 5-CAR FREIGHT TRAIN on North-South Track 2 (x = -133)
    // Per-car tunnel visibility clipping ensures every car smoothly exits North Tunnel (-115) & enters South Tunnel (+144)!
    const liveTrain = new Group(); liveTrain.userData.noBatch = true;
    liveTrain.position.set(-133, .16, -24);
    const buildTrainLoco = () => {
      const lg = new Group(); lg.rotation.y = -Math.PI / 2;
      addBox(lg, M.steelDark, 14.8, .55, 2.95, 0, .92, 0);
      addBox(lg, M.cargoRust, 9.6, 2.35, 2.25, -1.8, 2.35, 0);
      addBox(lg, M.steelWorn, 3.4, 2.75, 2.75, 4.4, 2.55, 0);
      addBox(lg, M.glass, .16, 1.1, 2.35, 6.12, 3.15, 0);
      addBox(lg, M.hazard, 14.9, .24, 3.0, 0, 1.15, 0);
      addBox(lg, M.glassWarm, .18, .45, .72, 7.42, 1.85, 0);
      addCyl(lg, M.steelDark, .26, .95, -2.5, 3.95, 0);
      for (const ax of [-5.2, -3.6, 3.6, 5.2]) addCyl(lg, M.steelDark, .44, 2.4, ax, .44, 0, Math.PI / 2, 0);
      for (const side of [-1, 1]) {
        const z = side * 1.42;
        for (const truck of [-4.5, 4.5]) addBox(lg, M.steelDark, 2.6, .30, .19, truck, .53, z * .84);
        addBox(lg, M.steelGalv, 8.3, .048, .048, -1.92, 2.13, z);
        addBox(lg, smokedPane, 2.62, .89, .045, 4.4, 3.12, side * 1.39);
      }
      addBox(lg, M.steelDark, 3.7, .16, 3.03, 4.4, 3.98, 0);
      addBox(lg, M.cargoRust, 1.26, .99, 2.17, 6.72, 1.65, 0);
      return lg;
    };
    const trainUnits = [];
    const locoUnit = buildTrainLoco();
    liveTrain.add(locoUnit);
    trainUnits.push({
      group: locoUnit, offsetZ: 0, halfX: 1.54, halfZ: 7.48, maxY: 4.22,
      collider: addDynamicCollider(new Vector3(-133 - 1.54, 0.16, -32 - 7.48), new Vector3(-133 + 1.54, 4.22, -32 + 7.48), { surface: 'metal', tag: 'live-train', noNav: true }),
    });
    const trainCarMats = [M.cargoTeal, M.cargoNavy, M.safetyOrange, M.craneWhite];
    for (let i = 0; i < trainCarMats.length; i++) {
      const cz = -(i + 1) * 15.4;
      const carG = new Group();
      carG.position.set(0, 0, cz);
      addBox(carG, M.steelDark, 2.8, .42, 13.8, 0, .86, 0);
      addBox(carG, M.hazard, 2.84, .12, 13.85, 0, 1.06, 0);
      addBox(carG, trainCarMats[i], 2.58, 2.56, 12.6, 0, 2.38, 0);
      // Corrugated steel container ribs, corner posts & roof rails (no plain cubes!)
      for (const sx of [-1.29, 1.29]) {
        for (let rz = -5.6; rz <= 5.6; rz += 1.6) addBox(carG, M.steelDark, .06, 2.46, .14, sx, 2.38, rz);
        addBox(carG, M.steelGalv, .14, .14, 12.66, sx, 3.68, 0);
      }
      addBox(carG, M.steelGalv, .36, .28, 1.8, 0, .86, 7.6);
      for (const az of [-5.2, -3.8, 3.8, 5.2]) addCyl(carG, M.steelDark, .38, 2.2, 0, .42, az, 0, Math.PI / 2);
      liveTrain.add(carG);
      trainUnits.push({
        group: carG, offsetZ: cz, halfX: 1.44, halfZ: 6.96, maxY: 3.92,
        collider: addDynamicCollider(new Vector3(-133 - 1.44, 0.16, -32 + cz - 6.96), new Vector3(-133 + 1.44, 3.92, -32 + cz + 6.96), { surface: 'metal', tag: 'live-train', noNav: true }),
      });
    }
    horizonRoot.add(liveTrain);
    let trainZ = -32, gateAngle = 0, crossBlink = 0;
    updaters.push(dt => {
      trainZ += dt * 13.5;
      if (trainZ > 214) trainZ = -114;
      liveTrain.position.z = trainZ;
      for (const u of trainUnits) {
        const wz = trainZ + u.offsetZ;
        const vis = (wz >= -114.5 && wz <= 143.5);
        u.group.visible = vis;
        if (u.collider) {
          u.collider.disabled = !vis;
          if (vis) {
            updateDynamicBox(u.collider, -133 - u.halfX, 0.16, wz - u.halfZ, -133 + u.halfX, u.maxY, wz + u.halfZ);
            pushPlayerOutOfMovingBox(u.collider);
          }
        }
      }
      const trainNearCrossing = trainZ > 76 && trainZ < 196;
      const targetAngle = trainNearCrossing ? 0 : 1.32;
      gateAngle += (targetAngle - gateAngle) * Math.min(1, dt * 4.5);
      for (const cg of crossingGates) cg.pivot.rotation.x = -cg.sign * gateAngle;
      crossBlink += dt * 6.0;
      const alt = Math.sin(crossBlink) > 0;
      for (const [lL, lR] of crossingLamps) {
        lL.visible = trainNearCrossing && alt;
        lR.visible = trainNearCrossing && !alt;
      }
    });
    for (const [cx, cz, mat] of [
      [-140, -18, M.cargoNavy], [-140, -2, M.cargoRust], [-140, 14, M.craneWhite],
      [-147, -12, M.cargoRust], [-147, 6, M.cargoTeal],
      [-126, 8, M.cargoNavy], [-126, 24, M.cargoRust],
    ]) {
      solid(railWest, railWest.shell, M.steelDark, cx - 1.4, .65, cz - 6.8, cx + 1.4, 1.05, cz + 6.8, 'metal', true);
      solid(railWest, railWest.shell, mat, cx - 1.3, 1.05, cz - 6.2, cx + 1.3, 3.65, cz + 6.2, 'metal', true);
      for (const az of [-5.2, -3.9, 3.9, 5.2]) addCyl(railWest.detail, M.steelDark, .38, 2.2, cx, .42, cz + az, 0, Math.PI / 2);
    }
    addControlTower(railWest, horizonRoot, { x: -206, z: 5, baseH: 8.6, cabW: 10.6, cabD: 10.6, title: 'WEST RAIL SIGNAL TOWER', signBg: '#3d2c1b', hasRadar: false });
    let railSignalGreen = true;
    addInteractiveTerminal(railWest.shell, {
      id: 'rail-signal-switch', promptZh: '按 [E] 切换西区铁路编组信号闸', x: -198.2, y: 0, z: 5, colorMat: M.greenSignal,
      onUse() {
        railSignalGreen = !railSignalGreen;
        audio?.play?.('rail_touchdown', { pos: new Vector3(-198, 1, 5), ref: 20, gain: .55, jitter: .05 });
        world.tactical?.notify?.(railSignalGreen ? '🚂 铁路编组信号已切换为【放行绿灯】' : '🛑 铁路编组信号已切换为【紧急制动红灯】', railSignalGreen ? '🚂 Rail signal: GREEN' : '🛑 Rail signal: RED STOP', false, 3.0);
      },
    });
    addIndustrialFacility(railWest, railWest.shell, {
      x0: -194, z0: -14, x1: -162, z1: -2, h: 7.2,
      wallMat: M.steelClad, roofMat: M.corrugated, title: 'INTERMODAL RAIL FREIGHT SHED', doorSide: 'south', signBg: '#3a2b1c', interiorKind: 'warehouse',
    });
    addBulkSiloBank(railWest, horizonRoot, -176, -29, 4);
    addRedWhiteRTGCrane(railWest, horizonRoot, -136.5, -24, 15.0, 13.0, 0);
    // Move rail freight truck off West Inland Ave into freight shed loading apron
    addSemiTrailerTruck(railWest, railWest.detail, -178, .21, 14, Math.PI / 2, M.cargoTeal);
    for (const [lx, lz] of [[-120, -24], [-120, 16], [-156, -24], [-156, 16], [-186, 12]]) {
      placePortProp(railWest, railWest.detail, 'light_mast', lx, .16, lz, 0);
    }
    placePortProp(railWest, railWest.detail, 'forklift', -164, .16, 14, -.35);
    placePortProp(railWest, railWest.detail, 'pallet_stack', -174, .16, 14, .1);
    placePortProp(railWest, railWest.detail, 'pipe_stack', -194, .16, -8, Math.PI / 2);
    // Poly Haven CC0 PBR Rail Yard Infrastructure
    placeExternal(railWest.detail, 'modular_electricity_poles', -121, .16, -32, 0, 1.0);
    placeExternal(railWest.detail, 'modular_electricity_poles', -154, .16, -32, 0, 1.0);
    placeExternal(railWest.detail, 'utility_box_01', -196, .16, 10.5, Math.PI / 2, 1.0);
    placeExternal(railWest.detail, 'portable_generator', -194, .16, -2.5, .25, 1.0);
    placeExternal(railWest.detail, 'modular_industrial_pipes_01', -196, .16, -25, 0, 1.0);

    spawnShootTarget(railWest.shell, { id: 'rail-sig-1', stage: 3, labelZh: '东股道编组信号闸', pos: new Vector3(-148, 0, -12), tall: true, maxHp: 3 });
    spawnShootTarget(railWest.shell, { id: 'rail-sig-2', stage: 3, labelZh: '西塔台信号主控闸', pos: new Vector3(-194, 0, 8), tall: true, maxHp: 3 });

    // =========================================================================
    // SECTOR 5 (SOUTH PENINSULA): OLD DRYDOCK, TIDE GATE & 22m COASTAL HEADLAND LIGHTHOUSE
    // STRICTLY ON LAND (x: -107..+24, z: +28..+145) — flush with Berth 4's x=+26 coastline!
    // =========================================================================
    const southHarbor = makeSector('south_harbor', '南港旧船坞与岸角灯塔', 'South Drydock & Lighthouse', [-42, 0, 86], 160);
    for (let z = 34; z <= 138; z += 7.0) addBox(southHarbor.detail, M.yellowPaint, .18, .015, 3.4, -26, .24, z);
    addIndustrialFacility(southHarbor, southHarbor.shell, { x0: -92, z0: 54, x1: -50, z1: 76, h: 8.0, wallMat: M.steelClad, roofMat: M.corrugated, title: 'SOUTH DRYDOCK PUMP HOUSE 02', doorSide: 'east', signBg: '#1a3342', interiorKind: 'pump_house' });
    addIndustrialFacility(southHarbor, southHarbor.shell, { x0: -92, z0: 106, x1: -54, z1: 128, h: 7.6, wallMat: M.brickWeathered, roofMat: M.corrugated, title: 'MARINE ENGINEERING WORKSHOP', doorSide: 'east', signBg: '#3c2b22', interiorKind: 'workshop' });
    // Real Area-1 corrugated shipping containers (with ribs, corner castings, doors & decals!), light masts, bollards & port gear
    for (const [cx, cz, col, yaw] of [
      [-42, 60, 'teal', Math.PI / 2], [-42, 74, 'red', Math.PI / 2], [-42, 116, 'blue', Math.PI / 2],
      [-10, 62, 'orange', 0], [-10, 65.2, 'grey', 0], [8, 64, 'green', 0], [8, 76, 'white', Math.PI / 2],
    ]) {
      placePortProp(southHarbor, southHarbor.shell, 'container40', cx, .16, cz, yaw, { color: col, doors: col === 'orange' ? .6 : 0 });
    }
    placePortProp(southHarbor, southHarbor.shell, 'container20', -10, 2.75, 62, 0, { color: 'blue' });
    for (const [lx, lz] of [[-46, 50], [-46, 102], [-14, 52], [-14, 104], [14, 78]]) placePortProp(southHarbor, southHarbor.detail, 'light_mast', lx, .16, lz, 0);
    for (const mz of [42, 62, 82, 102, 122]) placePortProp(southHarbor, southHarbor.detail, 'bollard_mooring', 22.8, .16, mz, 0, {}, false);
    placePortProp(southHarbor, southHarbor.detail, 'guard_booth', -36, .16, 48, 0);
    placePortProp(southHarbor, southHarbor.detail, 'forklift', -45, .16, 86, .4);
    placePortProp(southHarbor, southHarbor.detail, 'pipe_stack', -72, .16, 84, 0);
    placePortProp(southHarbor, southHarbor.detail, 'cable_reel', -60, .16, 84, .6);
    placePortProp(southHarbor, southHarbor.detail, 'generator', -16, .16, 108, Math.PI / 2);
    // Reference Photo 1 & 2 Landmarks: Red-and-White RTG Straddle Cranes, Towering STS Quay Cranes & Off-Lane Yard Trucks!
    addRedWhiteRTGCrane(southHarbor, horizonRoot, -10, 64, 14.0, 13.5, Math.PI / 2);
    addRedWhiteRTGCrane(southHarbor, horizonRoot, -42, 67, 13.0, 13.0, 0);
    addRedWhiteSTSCrane(southHarbor, horizonRoot, 18.5, 76);
    addRedWhiteSTSCrane(southHarbor, horizonRoot, 18.5, 102);
    addIndustrialExhaustTower(southHarbor, southHarbor.shell, -96.5, 65, 1);
    addSemiTrailerTruck(southHarbor, southHarbor.detail, -44, .21, 84, Math.PI / 2, M.cargoTeal);
    addSemiTrailerTruck(southHarbor, southHarbor.detail, -44, .21, 104, Math.PI / 2, M.craneRed);
    // High-Density South Harbor Upgrade: 112m Moored Container Ship under STS Cranes + Multi-Tier Automated Container Yard + Substation
    addMooredContainerShip(horizonRoot, 39.5, 88.0);
    addContainerYardBlock(southHarbor, southHarbor.shell, -10, 82, 2, 3, 0, false);
    addContainerYardBlock(southHarbor, southHarbor.shell, -88, 82, 2, 2, 0, false);
    addIndustrialFacility(southHarbor, southHarbor.shell, {
      x0: -12, z0: 44, x1: 8, z1: 54, h: 5.8, flatRoof: true,
      wallMat: M.craneWhite, roofMat: M.steelDark, title: 'TERMINAL CONTROL SUBSTATION', doorSide: 'west', signBg: '#1b3545', interiorKind: 'warehouse',
    });
    // Poly Haven CC0 PBR Quay & Drydock Equipment (strictly off Coastal Blvd roadway!)
    placeExternal(southHarbor.detail, 'portable_generator', -44.0, .16, 98.0, .4, 1.0);
    placeExternal(southHarbor.detail, 'utility_box_01', -14.5, .16, 72.0, -Math.PI / 2, 1.0);
    placeExternal(southHarbor.detail, 'utility_box_01', 6.0, .16, 110.0, 0, 1.0);
    placeExternal(southHarbor.detail, 'modular_industrial_pipes_01', -95.0, .16, 84.0, Math.PI / 2, 1.0);
    placeExternal(southHarbor.detail, 'modular_electricity_poles', -46.0, .16, 132.0, 0, 1.0);
    placeExternal(southHarbor.detail, 'exterior_aircon_unit', -12.4, 2.1, 49.0, -Math.PI / 2, 1.0);
    placeExternal(southHarbor.detail, 'overhead_crane', -72.0, .16, 117.0, 0, 1.0);
    for (let lz = 44; lz <= 132; lz += 22) addStreetLamp(southHarbor.detail, -17.5, .21, lz, -1);
    for (const gx of [-84, -48]) solid(southHarbor, southHarbor.shell, M.steelWorn, gx - .6, 0, 92, gx + .6, 13.5, 93.2, 'metal', true);
    addBox(horizonRoot, M.hazard, 38, 1.3, 1.5, -66, 13.6, 92.6);
    addBox(southHarbor.detail, M.steelDark, 4.2, 2.4, 2.6, -66, 11.8, 92.6); // Crane operator cab
    addBox(southHarbor.detail, M.glassCyan, 3.6, 1.1, 2.7, -66, 12.0, 92.6);
    addCyl(southHarbor.detail, M.steelGalv, .08, 6.5, -66, 7.4, 92.6); // Hoist cable
    addBox(southHarbor.detail, M.hazard, 1.6, .65, 1.2, -66, 4.2, 92.6); // Lifting spreader
    // Area-1-Grade Hydraulic Tide Gate Arch spanning Coastal Blvd at z = 96 (suspended steel floodgate, catwalk, handrails & operator booth!)
    for (const px of [-37.5, -14.5]) {
      addBox(horizonRoot, M.concreteDirty, 4.8, 1.6, 5.0, px, .96, 96);
      addPermanentCollider(new Vector3(px - 2.45, 0, 93.4), new Vector3(px + 2.45, 14.2, 98.6), { surface: 'concrete' });
      addBox(horizonRoot, M.concrete, 4.0, 11.6, 4.0, px, 6.8, 96);
      for (const rz of [93.9, 98.1]) addBox(horizonRoot, M.steelDark, .34, 11.4, .28, px, 6.7, rz);
      addCyl(southHarbor.detail, M.steelGalv, .36, 9.2, px + (px < -26 ? 2.2 : -2.2), 7.6, 96);
      addBox(southHarbor.detail, M.redCore, .40, .42, .40, px, 14.6, 96);
    }
    addBox(horizonRoot, M.concrete, 27.6, 2.4, 3.4, -26, 12.1, 96);
    addPermanentCollider(new Vector3(-39.8, 7.6, 94.2), new Vector3(-12.2, 13.8, 97.8), { surface: 'concrete', tag: 'tidegate-span', noNav: true });
    addBox(horizonRoot, M.concreteDirty, 28.8, .55, 4.0, -26, 13.5, 96);
    addBox(horizonRoot, M.corrugated, 19.2, 3.1, .52, -26, 9.45, 96);
    addBox(horizonRoot, M.hazard, 19.4, .42, .62, -26, 7.85, 96);
    addBox(southHarbor.detail, M.steelDark, 26.8, .18, 2.2, -26, 13.85, 96);
    for (const rz of [94.9, 97.1]) {
      addBox(southHarbor.detail, M.yellowPaint, 26.8, .08, .08, -26, 14.95, rz);
      for (let gx = -38; gx <= -14; gx += 3.0) addBox(southHarbor.detail, M.yellowPaint, .08, 1.05, .08, gx, 14.42, rz);
    }
    addBox(southHarbor.detail, M.steelWorn, 3.6, 2.6, 3.2, -14.5, 15.1, 96);
    addBox(southHarbor.detail, smokedPane, 3.72, 1.15, 2.6, -14.5, 15.35, 96);
    for (let cx = -32; cx <= -20; cx += 2.0) addBox(southHarbor.detail, M.whitePaint, .85, .015, 3.4, cx, .225, 96);
    // REAL Recessed South Drydock Slipway Basin (notched out of South concrete slab so real East Sea water fills it!)
    solidHorizon(M.concrete, -6.2, -2.2, 79.8, 25.4, .52, 81.0, 'concrete', true);
    solidHorizon(M.concrete, -6.2, -2.2, 103.0, 25.4, .52, 104.2, 'concrete', true);
    solidHorizon(M.concrete, -7.2, -2.2, 79.8, -5.8, .52, 104.2, 'concrete', true);
    for (const bx of [-2, 6, 14, 22]) {
      placePortProp(southHarbor, southHarbor.detail, 'bollard_mooring', bx, .52, 80.4, 0, {}, false);
      placePortProp(southHarbor, southHarbor.detail, 'bollard_mooring', bx, .52, 103.6, 0, {}, false);
    }
    addRedWhiteRTGCrane(southHarbor, horizonRoot, -1.0, 109.0, 11.0, 11.5, 0);
    addRedWhiteRTGCrane(southHarbor, horizonRoot, 14.0, 109.0, 11.0, 11.5, 0);
    // High-Precision 22m Red-and-White Striped Coastal Headland Lighthouse on Rocky Cape (Blueprint 06)
    addCyl(horizonRoot, M.concreteDirty, 5.4, 2.2, 14, 1.1, 134);
    const lhBands = [
      [4.2, 3.2, 3.8, M.craneRed], [3.95, 3.2, 7.0, M.craneWhite],
      [3.7, 3.2, 10.2, M.craneRed], [3.45, 3.2, 13.4, M.craneWhite], [3.2, 3.2, 16.6, M.craneRed],
    ];
    for (const [r, h, cy, mat] of lhBands) addCyl(horizonRoot, mat, r, h, 14, cy, 134);
    addCyl(horizonRoot, M.steelDark, 4.35, .42, 14, 18.6, 134); // Observation gallery deck
    for (let a = 0; a < 10; a++) {
      const ang = (a / 10) * Math.PI * 2;
      addBox(southHarbor.detail, M.steelGalv, .12, 1.15, .12, 14 + Math.cos(ang) * 4.15, 19.35, 134 + Math.sin(ang) * 4.15);
    }
    for (const y of [19.1, 19.8]) {
      const rail = new Mesh(new THREE.TorusGeometry(4.15, .042, 6, 48), M.steelGalv);
      rail.rotation.x = Math.PI / 2; rail.position.set(14, y, 134);
      southHarbor.detail.add(rail);
    }
    for (let i = 0; i < 10; i++) {
      const a = i * Math.PI / 5;
      addBox(southHarbor.detail, M.steelDark, .095, 3.1, .095, 14 + 2.65 * Math.cos(a), 20.4, 134 + 2.65 * Math.sin(a));
    }
    addCyl(horizonRoot, M.glass, 2.65, 3.1, 14, 20.4, 134);
    addCyl(horizonRoot, M.glassWarm, 1.15, 1.6, 14, 20.4, 134); // Fresnel beacon optic
    addCyl(horizonRoot, M.craneRed, 3.1, 1.45, 14, 22.6, 134); // Red lantern dome
    // Rocky Southern Coastal Shoreline & Pine Tree Belt (Blueprint South Edge)
    for (const [rx, rz, sx, sy] of [
      [20, 140, 4.2, 2.4], [12, 143, 4.8, 2.2], [2, 144, 5.2, 2.0], [-10, 144, 4.6, 1.9],
      [-26, 144, 5.0, 2.1], [-46, 144, 5.2, 2.0], [-68, 144, 4.8, 1.8], [-90, 144, 5.0, 2.1],
    ]) {
      const boulder = new Mesh(new THREE.DodecahedronGeometry(1, 0), M.rock);
      boulder.position.set(rx, .4, rz); boulder.scale.set(sx, sy, 3.2);
      boulder.rotation.set(.15, rx * .17, .2); boulder.matrixAutoUpdate = false; boulder.updateMatrix();
      horizonRoot.add(boulder);
      addPermanentCollider(new Vector3(rx - sx * 0.78, 0, rz - 2.5), new Vector3(rx + sx * 0.78, sy + 0.6, rz + 2.5), { surface: 'stone', noNav: true });
      addPineTree(southHarbor.detail, rx - 2.5, .16, rz - 4.5, 1.05);
    }
    southHarbor.colliderSpecs.push({ min: new Vector3(10, 0, 130), max: new Vector3(18, 22, 138), surface: 'concrete' });
    const lighthouseRotor = new Group();
    lighthouseRotor.position.set(14, 20.6, 134);
    for (const dir of [-1, 1]) {
      const beam = new Mesh(coneGeo, M.beamGold);
      beam.scale.set(4.8, 42, 4.8);
      beam.rotation.z = dir * Math.PI / 2;
      beam.position.x = dir * 21;
      lighthouseRotor.add(beam);
    }
    horizonRoot.add(lighthouseRotor);
    let lighthouseOverdrive = false;
    addInteractiveTerminal(southHarbor.shell, {
      id: 'lighthouse-console', promptZh: '按 [E] 切换 22m 岸角灯塔强光频闪并召唤四驱车', x: 8.6, y: 0, z: 134, colorMat: M.glassWarm,
      onUse() {
        lighthouseOverdrive = !lighthouseOverdrive;
        world.vehicle?.setPosition?.(new Vector3(-18, .15, 132));
        audio?.play?.('rail_touchdown', { pos: new Vector3(8.6, 1, 134), ref: 22, gain: .55, jitter: .04 });
        world.tactical?.notify?.(lighthouseOverdrive ? '🗼 岸角灯塔已切换至【风暴强光频闪】！四驱车已调度至南港路旁' : '🗼 岸角灯塔已恢复常规巡航模式', lighthouseOverdrive ? '🗼 Lighthouse overdrive active!' : '🗼 Lighthouse standard mode', false, 3.6);
      },
    });
    updaters.push(dt => { lighthouseRotor.rotation.y += dt * (lighthouseOverdrive ? 2.1 : (freeRoam || stage >= 7 ? .95 : .35)); });

    spawnShootTarget(southHarbor.shell, { id: 'lh-jam-1', stage: 6, labelZh: '灯塔西侧电源干扰器', pos: new Vector3(4, 0, 132), tall: true, maxHp: 3 });
    spawnShootTarget(southHarbor.shell, { id: 'lh-jam-2', stage: 6, labelZh: '灯塔北侧电源干扰器', pos: new Vector3(14, 0, 122), tall: true, maxHp: 3 });

    // =========================================================================
    // SECTOR 6 (SOUTHWEST INLAND): COOLING TOWERS, TWIN COLD-STORAGE, RED-CROSS CLINIC & GREEN HELIPAD (Blueprint 03)
    // STRICTLY INLAND (x: -222..-152, z: +35..+145) — West of the North-South Rail Corridor!
    // =========================================================================
    const swClinic = makeSector('sw_clinic', '西南冷雾库与战地分诊中心', 'SW Cold-Storage & Field Clinic', [-186, 0, 92], 275);
    // North Quadrant of 03: Two 24m Hyperbolic Cooling Towers + Two Red-and-White Striped Smokestacks
    addPowerPlantSkyline(swClinic, horizonRoot, -202, 58);
    addIndustrialExhaustTower(swClinic, swClinic.shell, -162, 60, -1);
    addSubstationYard(swClinic, swClinic.shell, -204, 38);
    if (industrialGen) {
      industrialGen.buildCryoTankCluster(swClinic.shell, -204, 78, 3, 5.2, {
        onCollider: (minArr, maxArr, surf) => swClinic.colliderSpecs.push({ min: new Vector3(...minArr), max: new Vector3(...maxArr), surface: surf }),
      });
      const pipeCol = (minArr, maxArr, surf) => addPermanentCollider(new Vector3(...minArr), new Vector3(...maxArr), { surface: surf, noNav: true });
      industrialGen.buildOverheadPipeline(horizonRoot, [[-194, 5.2, 62], [-184, 7.6, 68], [-174, 7.6, 82], [-182, 5.6, 89]], { radius: 0.28, pipeCount: 2, spacing: 0.72, onCollider: pipeCol });
      industrialGen.buildOverheadPipeline(horizonRoot, [[-94, 5.4, 65], [-74, 8.2, 65], [-52, 6.2, 65]], { radius: 0.26, pipeCount: 2, spacing: 0.68, onCollider: pipeCol });
      industrialGen.buildReflectivePuddles(horizonRoot, [
        [-25.5, 0.214, -46, 3.2, 1.9, 0.25], [-27.2, 0.214, -70, 2.8, 1.6, -0.3],
        [-24.4, 0.214, -98, 3.6, 2.1, 0.15], [-26.8, 0.214, 44, 3.4, 1.8, 0.4],
        [-25.2, 0.214, 78, 2.9, 2.2, -0.2], [-26.5, 0.214, 114, 3.5, 1.7, 0.1],
        [-112.5, 0.214, -48, 3.0, 1.8, 0.3], [-111.2, 0.214, 18, 2.6, 1.7, -0.4],
        [-112.8, 0.214, 72, 3.2, 2.0, 0.2], [-58, 0.168, 42, 3.4, 2.2, 0.5],
        [8, 0.168, 56, 3.8, 2.4, -0.35], [-12, 0.168, 112, 3.1, 1.9, 0.22],
        [-174, 0.168, 76, 3.2, 2.1, -0.15], [-156, 0.168, 102, 2.8, 1.6, 0.45],
      ]);
    }
    // South-West Quadrant of 03: Two Side-by-Side Pitched-Roof Cold-Storage Warehouses (Blueprint 03)
    addIndustrialFacility(swClinic, swClinic.shell, { x0: -214, z0: 88, x1: -196, z1: 126, h: 7.4, wallMat: M.cryoPanel, roofMat: M.corrugated, title: 'COLD STORAGE UNIT 01', doorSide: 'south', signBg: '#153642', interiorKind: 'cold_storage' });
    addIndustrialFacility(swClinic, swClinic.shell, { x0: -192, z0: 88, x1: -174, z1: 126, h: 7.4, wallMat: M.cryoPanel, roofMat: M.corrugated, title: 'COLD STORAGE UNIT 02', doorSide: 'south', signBg: '#153642', interiorKind: 'cold_storage' });
    // East-Center Quadrant of 03: Compact White Field Triage Clinic with Clean Flat Parapet Roof & Rooftop Red Cross (+)
    addIndustrialFacility(swClinic, swClinic.shell, { x0: -170, z0: 78, x1: -152, z1: 94, h: 6.2, flatRoof: true, wallMat: M.craneWhite, roofMat: M.craneWhite, title: 'SALTLINE FIELD TRIAGE CLINIC', doorSide: 'south', signBg: '#5e1f1c', interiorKind: 'clinic' });
    addBox(horizonRoot, M.redCore, 6.2, .12, 2.0, -161, 6.72, 86); // Rooftop Red Cross horizontal bar (flush on parapet roof!)
    addBox(horizonRoot, M.redCore, 2.0, .12, 6.2, -161, 6.72, 86); // Rooftop Red Cross vertical bar
    addBox(swClinic.detail, M.redCore, 2.4, .65, .20, -161, 5.4, 94.15);
    addBox(swClinic.detail, M.redCore, .65, 2.4, .20, -161, 5.4, 94.15);
    // South-East Quadrant of 03: Iconic Green-and-Yellow Square Medical Helipad (H) (Blueprint 03)
    const heliGreenMat = new MeshStandardMaterial({ color: 0x2f7d46, roughness: .82, metalness: .04 });
    addBox(horizonRoot, heliGreenMat, 20.0, .12, 20.0, -161, .21, 112);
    addBox(horizonRoot, M.yellowPaint, 18.6, .04, .65, -161, .28, 102.8);
    addBox(horizonRoot, M.yellowPaint, 18.6, .04, .65, -161, .28, 121.2);
    addBox(horizonRoot, M.yellowPaint, .65, .04, 18.6, -170.2, .28, 112);
    addBox(horizonRoot, M.yellowPaint, .65, .04, 18.6, -151.8, .28, 112);
    addBox(horizonRoot, M.yellowPaint, 1.35, .05, 8.2, -164.0, .29, 112); // Yellow H left pillar
    addBox(horizonRoot, M.yellowPaint, 1.35, .05, 8.2, -158.0, .29, 112); // Yellow H right pillar
    addBox(horizonRoot, M.yellowPaint, 6.0, .05, 1.35, -161.0, .29, 112); // Yellow H crossbar
    for (const [bx, bz] of [[-170.5, 102.5], [-151.5, 102.5], [-170.5, 121.5], [-151.5, 121.5]]) {
      addBox(swClinic.detail, M.greenSignal, .36, .32, .36, bx, .36, bz);
    }
    // Interactive Clinic Door & Heal Terminal + Area-1 & Poly Haven Props + Southern Pine Belt
    addInteractiveDoor(swClinic.shell, { id: 'clinic-door', labelZh: '战地分诊中心隔离门', x: -161, y: .16, z: 94.1, width: 3.8, height: 3.3, axis: 'x', initiallyOpen: false });
    addInteractiveTerminal(swClinic.shell, {
      id: 'clinic-heal', promptZh: '按 [E] 战地急救台恢复 100% 生命值', x: -155, y: .16, z: 96.5, colorMat: M.greenSignal,
      onUse() {
        world.player?.heal?.(world.player?.maxHealth ?? 100);
        audio?.play?.('rail_touchdown', { pos: new Vector3(-155, 1, 96.5), ref: 14, gain: .42, jitter: .04 });
        world.tactical?.notify?.('🏥 战地急救完成！生命值已恢复至 100%', '🏥 Field triage complete! Health restored to 100%', false, 3.0);
      },
    });
    for (const [lx, lz] of [[-172, 74], [-172, 128], [-148, 98], [-216, 128]]) placePortProp(swClinic, swClinic.detail, 'light_mast', lx, .16, lz, 0);
    placePortProp(swClinic, swClinic.detail, 'forklift', -172, .16, 104, -.4);
    placePortProp(swClinic, swClinic.detail, 'pallet_stack', -172, .16, 114, .1);
    placePortProp(swClinic, swClinic.detail, 'ibc_tote', -194, .16, 82, 0);
    placePortProp(swClinic, swClinic.detail, 'gas_cylinders', -153.5, .16, 94.8, 0);
    placePortProp(swClinic, swClinic.detail, 'sandbags', -166, .16, 98, 0);
    addParkedSedan(swClinic.detail, -147.2, .18, 86, 0, M.whitePaint);
    placeExternal(swClinic.detail, 'modular_industrial_pipes_01', -172.0, .16, 56.0, 0, 1.0);
    placeExternal(swClinic.detail, 'portable_generator', -172.0, .16, 82.0, .6, 1.0);
    placeExternal(swClinic.detail, 'utility_box_01', -152.0, .16, 86.0, Math.PI / 2, 1.0);
    placeExternal(swClinic.detail, 'modular_electricity_poles', -216.0, .16, 78.0, 0, 1.0);
    placeExternal(swClinic.detail, 'concrete_road_barrier', -152.0, .16, 124.0, 0, 1.0);
    placeExternal(swClinic.detail, 'exterior_aircon_unit', -152.0, 2.2, 82.0, Math.PI / 2, 1.0);
    for (const px of [-216, -200, -184, -168, -154]) addPineTree(swClinic.detail, px, .16, 138, 1.15);
    for (const z of [56, 86, 116]) addStreetLamp(swClinic.detail, -142, .02, z, -1);

    spawnShootTarget(swClinic.shell, { id: 'cryo-lock-1', stage: 2, labelZh: '1 号冷雾库锁控箱', pos: new Vector3(-152, 0, 64), tall: false, maxHp: 3 });
    spawnShootTarget(swClinic.shell, { id: 'cryo-lock-2', stage: 2, labelZh: '2 号冷雾库锁控箱', pos: new Vector3(-152, 0, 88), tall: false, maxHp: 3 });

    // Station & Patrol High-Precision Realistic Human NPCs (createSaltlineHuman + GLB rigged models) across all Coastal City Districts
    window.SaltlineNpcModels?.preloadAll?.(THREE);
    if (typeof window.createSaltlineHuman === 'function') {
      const npcSpecs = [
        {
          parent: horizonRoot, name: 'city-npc-dock', role: 'worker', modelType: 'civilian', pos: [-31, 0, -21], yaw: .6, variation: 0, patrol: [0, 8],
          displayName: '老霍克', title: '四号泊位夜班值班员',
          pages: [
            '林恩，你终于来了！别听港务局长里德在广播里胡说——凌晨 05:31 全港断电根本不是什么线路老化！',
            '我亲眼看见「铁砧」的武装无人机封死了四号泊位，把「海燕号」上的 17 名船员押走了。他们还在 05:34 篡改了我的值班交接单，写成全员 05:31 已安全离港。',
            '「海燕号」的大副趁乱把加密黑匣子藏在了北侧货箱区（坐标 -20, -18）。你先过去按 [E] 用频谱仪解码黑匣子，拿到了铁证我们再往城区追查！'
          ],
          choices: [
            { label: '铁砧为什么要抓这 17 名船员？', reply: '「海燕号」上周在东海拖回了一批违规倾倒的工业沉箱，船员们拍下了水文坐标和里德签字的放行单。铁砧是里德雇来灭口的私兵。' },
            { label: '我现在具体该先做什么？', reply: '先往东北方向走到北侧货箱区的信号信标旁按 [E] 解码黑匣子，然后打爆泊位两座防空干扰塔，打通通讯后按 [G] 叫车北上警务 04 号站！随时按 [J] 也能回看案情。' }
          ]
        },
        {
          parent: city.shell, name: 'city-npc-precinct', role: 'operator', modelType: 'female', pos: [-16.8, .16, -50], yaw: -1.4, variation: 1, patrol: [0, -14],
          displayName: '苏珊', title: '沿海警务 04 号站调度员',
          pages: [
            '嘘——小声点，SAR-04！铁砧刚刚封锁了沿海大道十字路口，正在远程清空我们警务楼里的船员转运和体检档案。',
            '我把原始备份藏在了调度台主机里，但一旦启动镜像下载，警报会立刻把铁砧无人机引过来。你得在楼里守住 14 秒直到进度到 100%。'
          ],
          choices: [
            { label: '第 17 名失联者托马斯·万斯是谁？', reply: '他是玛拉·陈的哥哥，也是「海燕号」的水文测量师。里德在官方名单上把他的名字彻底抹掉了，仿佛船上只有 16 个人。' },
            { label: '档案指向盐线市哪里？', reply: '转运单显示，船员们的随身证物和托马斯的录音笔被贴上冷链封条，送去了西南冷雾库和战地分诊中心。' }
          ]
        },
        {
          parent: city.shell, name: 'city-npc-plaza', role: 'worker', modelType: 'civilian', pos: [-6, .28, -149], yaw: 1.57, variation: 2, patrol: [12, 0],
          displayName: '周先生', title: '滨海广场目击市民',
          pages: [
            '天亮前全城突然黑了一片，我从阳台上看见三辆没挂牌照的装甲卡车拉着封条货箱，一路从沿海大道冲向了西南冷雾库。',
            '后来西岸山顶的雷达大锅也停转了，手机一点信号都没有。你们搜救队一定要把真相传出去啊！'
          ],
          choices: [
            { label: '你有看到船员被带去哪里吗？', reply: '有一批人被押上了西区货场的铁路平板车，另一批好像留在了南港外海锚地的集装箱泊位。' }
          ]
        },
        {
          parent: city.shell, name: 'city-npc-promenade', role: 'operator', modelType: 'civilian', pos: [19.8, .30, -112], yaw: 0, variation: 0, patrol: [0, -24],
          displayName: '老赵', title: '盐线港资深引航员',
          pages: [
            '你看东海那道黑压压的风暴雾墙——东海救援舰队其实已经在雾墙外待命了，但南角 22 米灯塔被铁砧切断了电源。',
            '没有灯塔的光学聚光指引，大吨位救援舰根本不敢强闯暗礁区。等你们拿齐证据发出广播后，一定要去南港重新点亮灯塔！'
          ],
          choices: [
            { label: '南港防潮闸有什么危险？', reply: '那座防潮闸挡着东海 12 米风暴潮。如果沃德狗急跳墙引爆闸门，低洼港区会瞬间被淹，必须立刻撤上西岸 +14 米山顶高地避险！' }
          ]
        },
        {
          parent: swClinic.shell, name: 'city-npc-nurse', role: 'medic', modelType: 'female', pos: [-152, 0, 118], yaw: 1.5, variation: 2, patrol: [0, -8],
          displayName: '林婉', title: '西南战地分诊中心护士',
          pages: [
            '托马斯·万斯被铁砧押送路过这里时受了冻伤，趁看守换班，他偷偷把一块受损的水文录音芯片塞进了我的急救箱。',
            '铁砧发现后锁死了外面两台冷库配电锁控箱。你先把外面那两台锁控箱打爆，再进诊所急救台按 [E] 修复他的录音芯片！'
          ],
          choices: [
            { label: '录音芯片里记录了什么？', reply: '里面有托马斯的亲口证词，他说铁砧把 17 名船员的原始签收货单装上了西区货场的货运专列，准备开进北隧道彻底销毁。' }
          ]
        },
        {
          parent: railWest.shell, name: 'city-npc-rail', role: 'engineer', modelType: 'civilian', pos: [-196, 0, 7.5], yaw: 1.2, variation: 0, patrol: [8, 0],
          displayName: '陈师傅', title: '西区铁路编组站老扳道工',
          pages: [
            '铁砧半小时前强行征用了 3 号编组线的货运专列，把全港扣押的原始货单和证物箱全塞进了车厢。',
            '硬拦火车是不可能的，但只要你炸毁货场两处铁路信号主控闸，安全联锁会自动触发紧急制动把专列逼停，到时你就能靠近车厢扫描完整《失联名单》！'
          ],
          choices: [
            { label: '专列被逼停后还要注意什么？', reply: '货场旁边全是燃油储罐，信号闸短路可能会引发油罐连爆，扫描货单时记得找车厢掩体躲避无人机火力。' }
          ]
        },
        {
          parent: mountain.shell, name: 'city-npc-comms', role: 'engineer', modelType: 'soldier', pos: [-185, summitY, -75], yaw: 1.6, variation: 1,
          displayName: '陆工', title: '西岸山顶卫星站工程师',
          pages: [
            '这座 +14 米山顶雷达站是全盐线市唯一能穿透风暴层直连海事局公频的发射塔。',
            '沃德用三组外置散热芯把发射机锁在了静默模式。先狙击打爆 3 个散热芯，再在控制台按 [E] 校准海事频段，守住 10 秒就能把 17 人的真相广播给全城和救援舰队！'
          ],
          choices: [
            { label: '广播发出去以后沃德会怎么做？', reply: '我截获了他的备用加密指令——一旦公频接通，他就会引爆南港防潮闸制造 12 米海啸冲毁全港。千万别急着下山，先在山顶撑过 15 秒洪峰！' }
          ]
        },
        {
          parent: southHarbor.shell, name: 'city-npc-keeper', role: 'worker', modelType: 'civilian', pos: [7.5, 0, 131], yaw: -2.2, variation: 2,
          displayName: '老沈', title: '南角灯塔守塔人',
          pages: [
            '我守了三十年南角灯塔，头一回见人往灯塔电源上装军用干扰器。',
            '帮我清掉南港船坞那两座电源干扰器，然后到灯塔基座按 [E] 手动把光学透镜对齐海平线，救援舰队立刻就能看见航道强光！'
          ],
          choices: [
            { label: '灯塔点亮后怎么撤离？', reply: '救援舰队的先遣运输机已经降落在西北海岸应急机场了，你们先去机库拿回黑匣子与燃油舱单，再护送锚地幸存船员和车队一起撤离。' }
          ]
        },
      ];
      const cityNpcs = npcSpecs.map((sp, idx) => {
        const h = window.createSaltlineHuman(THREE, { name: sp.name, role: sp.role, modelType: sp.modelType, variation: sp.variation });
        h.actor.position.set(sp.pos[0], sp.pos[1], sp.pos[2]);
        h.actor.rotation.y = sp.yaw;
        h._baseX = sp.pos[0]; h._baseZ = sp.pos[2];
        h._patrol = sp.patrol || null;
        h._phase = idx * 1.7;
        h._parent = sp.parent;
        h._talking = false;
        h._collider = addDynamicCollider(
          new Vector3(sp.pos[0] - 0.34, sp.pos[1], sp.pos[2] - 0.34),
          new Vector3(sp.pos[0] + 0.34, sp.pos[1] + 1.75, sp.pos[2] + 0.34),
          { surface: 'concrete', tag: 'city-npc', noNav: true }
        );
        const talkPos = new Vector3(sp.pos[0], sp.pos[1] + 1.0, sp.pos[2]);
        h._talkPos = talkPos;
        interactables.push({
          id: `npc-talk-${sp.name}`,
          pos: talkPos,
          radius: 4.0,
          getPrompt: () => (h.actor.visible && sp.parent.visible && !storyDirector?.isDialogueOpen) ? `按 [E] 与 ${sp.displayName}（${sp.title}）面对面交谈` : '',
          use() {
            if (!storyDirector?.openDialogue) return;
            h._talking = true;
            if (world.player?.pos) {
              h.actor.rotation.y = Math.atan2(world.player.pos.x - h.actor.position.x, world.player.pos.z - h.actor.position.z);
            }
            storyDirector.openDialogue({
              speaker: sp.displayName,
              role: sp.title,
              tone: 'ally',
              pages: sp.pages,
              choices: sp.choices,
              npcActor: h.actor,
              npcHuman: h,
              onComplete: () => { h._talking = false; },
            });
          },
        });
        sp.parent.add(h.actor);
        return h;
      });
      let npcAge = 0;
      let npcVisTimer = 0.2;
      updaters.push(dt => {
        npcAge += dt;
        npcVisTimer += dt;
        const checkVis = npcVisTimer >= 0.2;
        let position = null, rSq = Infinity;
        if (checkVis) {
          npcVisTimer = 0;
          position = world.camera?.position;
          const radius = streetDetailRange();
          rSq = radius * radius;
        }
        for (let i = 0; i < cityNpcs.length; i++) {
          const npc = cityNpcs[i];
          if (checkVis) npc.actor.visible = !position || position.distanceToSquared(npc.actor.position) <= rSq;
          const activeNpc = npc.actor.visible && npc._parent.visible;
          if (npc._collider) npc._collider.disabled = !activeNpc;
          if (!activeNpc) continue;
          if (npc._talkPos) npc._talkPos.set(npc.actor.position.x, npc.actor.position.y + 1.0, npc.actor.position.z);
          if (npc._talking) {
            if (world.player?.pos) {
              const targetYaw = Math.atan2(world.player.pos.x - npc.actor.position.x, world.player.pos.z - npc.actor.position.z);
              const diff = Math.atan2(Math.sin(targetYaw - npc.actor.rotation.y), Math.cos(targetYaw - npc.actor.rotation.y));
              npc.actor.rotation.y += diff * Math.min(1, dt * 8);
            }
            npc.pose?.('talk', 0, npcAge + i * 1.1, false, dt);
            continue;
          }
          if (npc._patrol) {
            const [dx, dz] = npc._patrol;
            const dist = Math.max(1, Math.hypot(dx, dz));
            const cycle = (npcAge * 1.15 / dist + npc._phase) % 2.4;
            if (cycle < 1.0) {
              npc.actor.position.x = npc._baseX + dx * cycle;
              npc.actor.position.z = npc._baseZ + dz * cycle;
              npc.actor.rotation.y = Math.atan2(dx, dz);
              npc.pose('walk', npcAge * 5.2, npcAge + i * 1.1, true, dt);
              if (npc._collider) updateDynamicBox(npc._collider, npc.actor.position.x - 0.34, npc.actor.position.y, npc.actor.position.z - 0.34, npc.actor.position.x + 0.34, npc.actor.position.y + 1.75, npc.actor.position.z + 0.34);
            } else if (cycle < 1.2) {
              npc.pose('stand', 0, npcAge + i * 1.1, false, dt);
            } else if (cycle < 2.2) {
              const back = 1.0 - (cycle - 1.2);
              npc.actor.position.x = npc._baseX + dx * back;
              npc.actor.position.z = npc._baseZ + dz * back;
              npc.actor.rotation.y = Math.atan2(-dx, -dz);
              npc.pose('walk', npcAge * 5.2, npcAge + i * 1.1, true, dt);
              if (npc._collider) updateDynamicBox(npc._collider, npc.actor.position.x - 0.34, npc.actor.position.y, npc.actor.position.z - 0.34, npc.actor.position.x + 0.34, npc.actor.position.y + 1.75, npc.actor.position.z + 0.34);
            } else {
              npc.pose('stand', 0, npcAge + i * 1.1, false, dt);
            }
          } else {
            npc.pose('stand', 0, npcAge + i * 1.1, false, dt);
          }
        }
      });
    }

    // =========================================================================
    // ACTIVE AI SQUADMATES (MARA CHEN + KAI) & FUN PORT EASTER EGGS
    // =========================================================================
    const squadAllies = [];
    if (typeof window.createPortCompanionAI === 'function') {
      squadAllies.push(
        window.createPortCompanionAI(world, {
          name: 'Mara Chen', displayName: '玛拉·陈', role: 'medic', modelType: 'female', coat: 0x3b7a78, variation: 1,
          flankOffset: [2.4, -2.0], canHeal: true, fireRate: 1.05,
          startPos: new Vector3(-14, .16, -18),
          onSpeak: (_en, zh) => { storyDirector?.recordStoryEntry?.('玛拉·陈', zh); world.hud?.radio?.(zh, 6.5, null, { speaker: '玛拉·陈', side: 'ally' }); },
        }),
        window.createPortCompanionAI(world, {
          name: 'Kai', displayName: '凯尔', role: 'operator', modelType: 'soldier', coat: 0x364f6b, variation: 0,
          flankOffset: [-2.6, -2.2], canHeal: false, fireRate: 0.85,
          startPos: new Vector3(-18.5, .16, -18.5),
          onSpeak: (_en, zh) => { storyDirector?.recordStoryEntry?.('凯尔', zh); world.hud?.radio?.(zh, 6.5, null, { speaker: '凯尔', side: 'ally' }); },
        }),
      );
      const allyDialogs = [
        {
          ally: squadAllies[0], title: 'SAR-04 医疗官',
          pages: [
            '林恩，我哥哥托马斯就在「海燕号」那 17 个人里。只要你受伤了，我会第一时间冲过来给你打医疗针。',
            '记住按 [H] 可以把我和凯尔随时叫到你身边集结，我们一起把这份《失联名单》查个水落石出。'
          ],
          choices: [
            { label: '你哥哥最后联系你是什么时候？', reply: '凌晨五点零五分，他说四号泊位突然驶进了两艘无编号拖船，随后全港就断电失联了。' },
            { label: '帮我检查一下当前装备和状态', reply: '医疗包满载，随时准备就绪。你专心推进调查和压制无人机，后背交给我和凯尔。' }
          ]
        },
        {
          ally: squadAllies[1], title: 'SAR-04 火力支援手',
          pages: [
            '队长，铁砧这帮私兵的无人机看着唬人，但外壳护甲很薄，我会帮你吸引并压制它们的火力。',
            '路上看到老霍克、苏珊或者灯塔守塔人记得停下来按 [E] 聊聊，他们手里的线索比无线电里清楚得多！'
          ],
          choices: [
            { label: '遇到成群无人机怎么打最稳？', reply: '优先点掉空中的海鸥无人机和干扰塔，按 [G] 把四驱车叫出来用车载机枪扫射最解气。' }
          ]
        }
      ];
      for (const ad of allyDialogs) {
        const aPos = new Vector3();
        ad._talkPos = aPos;
        interactables.push({
          id: `ally-talk-${ad.ally.name.toLowerCase().replace(/\s+/g, '-')}`,
          pos: aPos,
          radius: 3.4,
          getPrompt: () => (!isMultiplayer() && !ad.ally.seated && !storyDirector?.isDialogueOpen) ? `按 [E] 与队友 ${ad.ally.displayName}（${ad.title}）交谈` : '',
          use() {
            if (!storyDirector?.openDialogue || ad.ally.seated) return;
            ad.ally.setTalking?.(true);
            storyDirector.openDialogue({
              speaker: ad.ally.displayName,
              role: ad.title,
              tone: 'ally',
              pages: ad.pages,
              choices: ad.choices,
              npcActor: ad.ally.root,
              npcHuman: ad.ally.human,
              onComplete: () => { ad.ally.setTalking?.(false); },
            });
          },
        });
      }
      updaters.push(() => {
        for (const ad of allyDialogs) ad._talkPos.set(ad.ally.pos.x, ad.ally.pos.y + 1.0, ad.ally.pos.z);
      });
      let banterClock = 18;
      let driveBanterCd = 0;
      const funBanter = [
        ['凯尔', '「说真的林恩，这趟差事干完，港务局至少得赔我们一人一杯双倍浓缩咖啡。」'],
        ['玛拉·陈', '「先活着把这 17 个人的名字送出去，回头我亲自给你们俩泡一壶。」'],
        ['凯尔', '「收到！不过按 [H] 随时喊我俩集结补血，别一个人冲太猛！」'],
        ['玛拉·陈', '「记住随时按 [J] 可以翻看案情日志，路边碰到老霍克或苏珊也可以按 [E] 聊聊。」'],
      ];
      let banterIdx = 0;
      updaters.push(dt => {
        if (isMultiplayer()) return;
        const p = world.player;
        for (let i = 0; i < squadAllies.length; i++) squadAllies[i].update(dt, p);
        if (driveBanterCd > 0) driveBanterCd -= dt;
        if (world.vehicle?.driving && driveBanterCd <= 0) {
          driveBanterCd = 28;
          squadAllies[0]?.speak?.('玛拉·陈：「林恩！你这四驱车漂移差点把我的急救箱甩进东海！稳一点！」', 'Mara: Easy on the drift!', true);
        }
        if (!freeRoam && cityCampaignActive && banterClock > 0) {
          banterClock -= dt;
          if (banterClock <= 0 && banterIdx < funBanter.length) {
            const [who, line] = funBanter[banterIdx++];
            const speakerAlly = who === '凯尔' ? squadAllies[1] : squadAllies[0];
            speakerAlly?.speak?.(`${who}：${line}`, line, true);
            banterClock = 38;
          }
        }
      });
    }
    interactables.push(
      {
        id: 'egg-berth-coffee', pos: new Vector3(-25.5, .6, -14.5), radius: 3.4,
        getPrompt: () => '按 [E] 港区自动咖啡机（喝一杯特浓美式 +25 HP）',
        use() {
          world.player?.heal?.(25);
          squadAllies[1]?.speak?.('凯尔：「天哪，这机器里的海盐美式比防潮闸的铁锈还苦……但确实提神！」', 'Kai: Strongest port coffee ever!', true);
          world.tactical?.notify?.('☕ 喝下港口特浓美式！生命值 +25', '☕ Harbor Espresso! +25 HP', false, 3.2);
        },
      },
      {
        id: 'egg-precinct-radio', pos: new Vector3(-8.5, .8, -55.0), radius: 3.4,
        getPrompt: () => '按 [E] 调试警务室海盗调频收音机（窃听铁砧吐槽频道）',
        use() {
          storyDirector?.openDialogue?.({
            speaker: '铁砧巡逻频道（窃听）', role: '加密串台', tone: 'hostile',
            pages: [
              '铁砧小兵 A：「喂，沃德指挥官说今天只是例行封港，怎么连 22 米灯塔和海啸闸都扯进来了？」',
              '铁砧小兵 B：「小声点！刚才那个 SAR 搜救员开着四驱车直接把咱们路障撞飞了，我加班费还没结呢！」'
            ],
            choices: [{ label: '插话吓唬他们一下', reply: '林恩：「SAR-04 收到，劝你们现在就投降，还能赶上早饭。」频道那头瞬间传来一阵慌乱的静电杂音。' }],
          });
        },
      },
      {
        id: 'egg-promenade-scope', pos: new Vector3(21.2, .9, -84.0), radius: 3.6,
        getPrompt: () => '按 [E] 滨海长廊高倍望远镜（远眺东海救援舰队）',
        use() {
          squadAllies[0]?.speak?.('玛拉·陈：「透过雾墙能看到东海救援舰队的探照灯剪影了！只要点亮灯塔，他们就能全速入港！」', 'Mara: I can see the rescue fleet beyond the fog!', true);
          world.tactical?.notify?.('🔭 东海雾墙外可见 3 艘救援舰轮廓正等待引航信号', '🔭 3 Rescue Fleet ships spotted beyond the fog wall', false, 4.2);
        },
      },
    );

    // =========================================================================
    // TIME-OF-DAY & PMREM LIGHTING SYSTEM ([T] KEY — powered by WorldEngine.LightingSystem)
    // =========================================================================
    const origFogColor = scene?.fog?.color?.getHex?.() ?? 0x768d9e;
    const origFogDensity = typeof scene?.fog?.density === 'number' ? scene.fog.density : .0008;
    const skyPresets = lightingSys ? lightingSys.presets : [
      { id: 'native', zh: '🌊 原版海港光影', en: 'Native Harbor', fog: origFogColor, density: Math.min(.0009, origFogDensity), sun: 0xffe0bd, sunInt: 2.4, hemiSky: 0xa8cde6, hemiGnd: 0x4a5459, hemiInt: 1.15 },
      { id: 'noon', zh: '☀️ 晴朗海湾（高细节无雾）', en: 'Clear Daylight', fog: 0x9ec4e2, density: .00035, sun: 0xfffaf0, sunInt: 3.1, hemiSky: 0xcce6ff, hemiGnd: 0x5c6b73, hemiInt: 1.42 },
      { id: 'sunset', zh: '🌇 晚霞黄昏', en: 'Crimson Sunset', fog: 0x9e6a56, density: .00075, sun: 0xffa060, sunInt: 2.65, hemiSky: 0xf4b68e, hemiGnd: 0x47363a, hemiInt: 1.15 },
      { id: 'moonlit', zh: '🌙 月夜清晰港', en: 'Moonlit Harbor', fog: 0x243952, density: .00085, sun: 0x9ec4f0, sunInt: 1.95, hemiSky: 0x5e86b8, hemiGnd: 0x253242, hemiInt: 1.08 },
    ];
    let skyIdx = 0;

    function applySkyPreset(idx, silent = false) {
      if (lightingSys) {
        const p = lightingSys.applyPreset(idx, silent);
        skyIdx = lightingSys.index;
        atmosphereSys?.syncPreset?.(p?.id);
        return p;
      }
      skyIdx = ((idx % skyPresets.length) + skyPresets.length) % skyPresets.length;
      const p = skyPresets[skyIdx];
      atmosphereSys?.syncPreset?.(p?.id);
      if (scene) {
        if (scene.fog) {
          scene.fog.color?.setHex?.(p.fog);
          if (typeof scene.fog.density === 'number') scene.fog.density = p.density;
        }
        scene.traverse?.(obj => {
          if (obj.isDirectionalLight) { obj.color?.setHex?.(p.sun); obj.intensity = p.sunInt; }
          else if (obj.isHemisphereLight) { obj.color?.setHex?.(p.hemiSky); obj.groundColor?.setHex?.(p.hemiGnd); obj.intensity = p.hemiInt; }
        });
      }
      if (!silent) world.tactical?.notify?.(`🌤️ 氛围光影已切换：${p.zh}（按 T 键随时切换）`, `🌤️ Atmosphere: ${p.en}`, false, 2.8);
      return p;
    }

    // =========================================================================
    // Campaign radio and completion screen
    // =========================================================================
    const finaleCard = document.createElement('div');
    finaleCard.className = 'sl-finale-card';
    finaleCard.innerHTML = `
      <div class="sl-finale-inner">
        <div class="sl-finale-kicker">SALTLINE: MISSING MANIFEST · 战役通关</div>
        <div class="sl-finale-title">《失联名单》真相已公之于众</div>
        <div class="sl-finale-copy">
          05:31 与 05:34 的伪造时间差、05:50 搜救艇召回令，以及第 17 名失联者托马斯·万斯的原始水文档案已通过山顶卫星与海岸机场全部回传海事局。随着 22 米南角灯塔重燃，东海救援舰队已突破风暴线入港，港务局长里德与铁砧指挥官沃德面临紧急通缉。
        </div>
        <div class="sl-finale-btns">
          <button class="sl-finale-btn primary" data-finale-roam>🌏 自由漫游盐线市 [M]</button>
          <button class="sl-finale-btn" data-finale-replay>🔄 从第一幕重玩</button>
        </div>
      </div>`;
    const codHitmarker = document.createElement('div');
    codHitmarker.className = 'sl-cod-hitmarker';
    codHitmarker.innerHTML = `<svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="4" y1="4" x2="10" y2="10"/><line x1="24" y1="4" x2="18" y2="10"/><line x1="4" y1="24" x2="10" y2="18"/><line x1="24" y1="24" x2="18" y2="18"/></svg>`;
    document.body.append(finaleCard, codHitmarker);
    let hitmarkerTimer = null;
    const storyTimers = [];
    let finaleSpinActive = false;

    function flashHitmarker(isKill = false) {
      if (freeRoam || isMultiplayer()) return;
      codHitmarker.classList.remove('show', 'kill');
      void codHitmarker.offsetWidth;
      codHitmarker.classList.add('show');
      if (isKill) codHitmarker.classList.add('kill');
      if (hitmarkerTimer) clearTimeout(hitmarkerTimer);
      hitmarkerTimer = setTimeout(() => codHitmarker.classList.remove('show', 'kill'), isKill ? 220 : 140);
    }

    function clearStoryTimers() {
      for (const id of storyTimers.splice(0)) clearTimeout(id);
    }

    function showStoryBeat({ speaker, line, tone, dur = 9200 }) {
      if (freeRoam || isMultiplayer()) return;
      const [name] = speaker.split(' · ');
      const names = {
        LIN: ['Lin', '林恩'], 'MARA CHEN': ['Mara Chen', '玛拉·陈'],
        'MARITIME RESCUE FLEET': ['Rescue Fleet', '救援舰队'], REED: ['Reed', '里德'], WARD: ['Ward', '沃德'],
      };
      const dispSpeaker = names[name] ? local(...names[name]) : name;
      storyDirector?.recordStoryEntry?.(dispSpeaker, line);
      world.hud?.radio?.(line, Math.max(8.5, dur / 1000), null, {
        speaker: dispSpeaker,
        side: tone === 'hostile' ? 'hostile' : 'ally',
      });
    }

    function playStorySequence(beats) {
      clearStoryTimers();
      if (!Array.isArray(beats) || freeRoam) return;
      for (let i = 0; i < beats.length; i++) {
        const b = beats[i];
        const delayMs = i === 0 ? Math.max(600, (b.at ?? 0.6) * 1000) : Math.max(9200 * i, (b.at ?? 0) * 1450);
        storyTimers.push(setTimeout(() => showStoryBeat(b), delayMs));
      }
    }

    finaleCard.querySelector('[data-finale-roam]').addEventListener('click', () => {
      finaleCard.classList.remove('open');
      setFreeRoam(true, true);
    });
    finaleCard.querySelector('[data-finale-replay]').addEventListener('click', () => {
      finaleCard.classList.remove('open');
      jumpToStage(0, { teleport: true, clearEnemies: true });
    });

    const actScripts = [
      {
        tag: 'ACT I · 调查开始', sub: '「海燕号」17 名船员离奇失联，先追踪四号泊位的加密黑匣子信标',
        beats: [
          { at: .4, speaker: 'MARA CHEN · SAR-04', tone: 'ally', line: '林恩，凌晨 05:31 全港断电后，「海燕号」17 名船员全部失联——港务局长里德却谎称全员已安全离港。' },
          { at: 6.2, speaker: 'MARA CHEN · SAR-04', tone: 'ally', line: '我刚截获一条来自四号泊位北侧货箱区的加密微弱信标！跟着左上角信号测向仪靠近，按 [E] 破解它！' },
        ],
        spawns: [['hound', -10, 0, -12], ['hound', 10, 0, 6]],
      },
      {
        tag: 'ACT II · 城区突围', sub: '铁砧正销毁船员体检记录，撞穿沿海大道封锁线并镜像警务楼档案',
        beats: [
          { at: .4, speaker: 'WARD · ANVIL COMMANDER（敌方频道）', tone: 'hostile', line: '黑匣子被破译了！立刻销毁警务调度楼的船员体检单，所有单位封死沿海大道十字路口！' },
          { at: 6.0, speaker: 'MARA CHEN · SAR-04', tone: 'ally', line: '按 [G] 召唤四驱车、[F] 登车，高速撞穿沿海大道路障！冲进去后立刻去东侧警务调度楼抢拷档案！' },
        ],
        spawns: [['hound', -22, 0, -68], ['hound', -30, 0, -82], ['gull', -26, 12, -74]],
      },
      {
        tag: 'ACT III · 冷链疑踪', sub: '警务档案指向西南冷雾库，那里封存着第 17 人托马斯的最后线索',
        beats: [
          { at: .4, speaker: 'MARA CHEN · SAR-04', tone: 'ally', line: '镜像档案解开了……我哥托马斯·万斯正是被抹掉的第 17 人！他的随身录音笔被封在西南冷雾库！' },
          { at: 6.2, speaker: 'WARD · ANVIL COMMANDER', tone: 'hostile', line: '锁死西南冷库外置配电！把那批冷链货箱和录音证物全部冻死在雷暴里！' },
        ],
        spawns: [['hound', -146, 0, 70], ['hound', -144, 0, 96], ['gull', -154, 12, 78]],
      },
      {
        tag: 'ACT IV · 死线截车', sub: '托马斯遗言揭露原始货单已装上货运专列，炸毁信号闸并登车扫描取证',
        beats: [
          { at: .4, speaker: 'MARA CHEN · SAR-04', tone: 'ally', line: '托马斯的录音救了我们——铁砧正把四号泊位全部原始货单装上西区货运专列，准备钻进山洞毁尸灭迹！' },
          { at: 6.2, speaker: 'LIN · SAR-04', tone: 'ally', line: '绝不让专列出谷！先炸毁东西两处铁路信号主控闸把火车逼停，再去车厢旁扫描完整货单！' },
        ],
        spawns: [['hound', -142, 0, -6], ['hound', -184, 0, 12], ['gull', -164, 13, 0]],
      },
      {
        tag: 'ACT V · 夺取公频', sub: '17 人铁证集齐，登顶 +14m 西岸雷达站校准卫星向全城公开广播',
        beats: [
          { at: .4, speaker: 'MARA CHEN · SAR-04', tone: 'ally', line: '全部 17 人的签收货单与扣押记录都扫描完毕了！冲上 +14m 西岸山顶，摧毁散热芯并校准卫星大锅公开广播！' },
          { at: 6.4, speaker: 'WARD · ANVIL COMMANDER', tone: 'hostile', line: '死守山顶雷达站！一旦他们连上海事局公频，立刻启动「零号泄洪」炸毁南防潮闸！' },
        ],
        spawns: [['hound', -180, 14, -84], ['hound', -182, 14, -70], ['gull', -190, 26, -78]],
      },
      {
        tag: 'ACT VI · 零号泄洪', sub: '南防潮闸已被引爆，在 +14m 山顶高地死守 15 秒等待东海救援舰队回电',
        beats: [
          { at: .4, speaker: 'WARD · ANVIL COMMANDER', tone: 'hostile', line: '既然藏不住，就让东海 12 米风暴潮把整座盐线港冲个干净！' },
          { at: 5.4, speaker: 'MARA CHEN · SAR-04', tone: 'ally', line: '《失联名单》已经发出去了！抓紧山顶掩体撑过这 15 秒，我正在等东海救援舰队的确认回电！' },
        ],
        spawns: [],
      },
      {
        tag: 'ACT VII · 破雾引航', sub: '救援舰队受困海雾，清除南港干扰器并校准 22 米灯塔透镜指引舰队入港',
        beats: [
          { at: .3, speaker: 'MARITIME RESCUE FLEET · 东海救援舰队', tone: 'rescue', line: 'SAR-04，已收到十七人《失联名单》铁证！舰队已抵雾墙外，但南角灯塔被干扰熄灭，请求立刻复明！' },
          { at: 6.2, speaker: 'MARA CHEN · SAR-04', tone: 'ally', line: '洪峰退了！冲下山道直奔南港旧船坞——清除 2 座电源干扰器，再去灯塔基座手动校准主透镜！' },
        ],
        spawns: [['hound', -14, 0, 118], ['hound', 6, 0, 126], ['gull', 0, 14, 130]],
      },
      {
        tag: 'ACT VIII · 机库夺证', sub: '舰队先遣运输机已在西北机场机库就位，冲过跑道炮火夺回搜救燃油舱单与黑匣子',
        beats: [
          { at: .3, speaker: 'MARITIME RESCUE FLEET · 东海救援舰队', tone: 'rescue', line: '已目视南角灯塔强光！先遣舰队正进港接管防务，请先冲入西北机场拱形机库确保起降油料与记录仪！' },
          { at: 6.0, speaker: 'MARA CHEN · SAR-04', tone: 'ally', line: '跑道被铁砧炮火封锁了！林恩，把油门踩到底冲进 110 米跑道尽头的拱形机库！' },
        ],
        spawns: [['hound', -154, 0, -174], ['gull', -168, 14, -182]],
      },
      {
        tag: 'ACT IX · 锚地疏散', sub: '南港外海锚地仍有被困船员待撤，摧毁 2 座登船干扰器并守住舷梯 10 秒',
        beats: [
          { at: .3, speaker: 'MARA CHEN · SAR-04', tone: 'ally', line: '机库黑匣子刚解码出一条紧急求救：南港锚地还有一批「海燕号」幸存船员被铁砧堵在泊位舷梯！' },
          { at: 6.0, speaker: 'MARITIME RESCUE FLEET · 东海救援舰队', tone: 'rescue', line: 'SAR-04，清除南港锚地 2 座登船干扰器并守住码头舷梯 10 秒，我们的气垫艇立刻靠泊接人！' },
        ],
        spawns: [['hound', 10, 0, 76], ['hound', 16, 0, 94], ['gull', 14, 14, 86]],
      },
      {
        tag: 'ACT X · 深夜反攻', sub: '铁砧残部突袭警务 04 号站企图毁账，破译沃德离岸资金总账并坚守链路 10 秒',
        beats: [
          { at: .3, speaker: 'WARD · ANVIL COMMANDER', tone: 'hostile', line: '绝不能让海事检察官拿到我的离岸资金总账！特种分队立刻夺回警务 04 号站，把服务器烧了！' },
          { at: 5.8, speaker: 'MARA CHEN · SAR-04', tone: 'ally', line: '锚地船员全部安全登艇了！快回沿海警务 04 号站按 [E] 破译沃德总账，别让铁砧把最后证据毁掉！' },
        ],
        spawns: [['hound', -16, 0, -52], ['hound', -6, 0, -62], ['gull', -12, 13, -56]],
      },
      {
        tag: 'ACT XI · 公路护航', sub: '摧毁北段沿海大道 2 座防空导弹发射架，护送最后搜救车队冲向西北机场入口',
        beats: [
          { at: .3, speaker: 'MARA CHEN · SAR-04', tone: 'ally', line: '沃德的离岸总账已上传至海事检察院！铁砧在北段沿海大道架起了 2 座防空导弹想击落我们的撤离运输机！' },
          { at: 6.0, speaker: 'LIN · SAR-04', tone: 'ally', line: '全速北上！把北段公路两座防空导弹发射架全打爆，护送车队到机场跑道入口！' },
        ],
        spawns: [['hound', -28, 0, -112], ['hound', -58, 0, -124], ['gull', -42, 14, -118]],
      },
      {
        tag: 'ACT XII · 晴海尾声', sub: '风暴散尽、黎明破晓，登上西北机场拱形机库的救援运输机见证盐线港的新生',
        beats: [
          { at: .3, speaker: 'MARITIME RESCUE FLEET · 东海救援舰队', tone: 'rescue', line: '防空威胁已全部肃清！风暴云层正在散去，请前往西北机场拱形机库登机，准备收官归航！' },
          { at: 5.8, speaker: 'MARA CHEN · SAR-04', tone: 'ally', line: '太阳出来了，林恩……十七个名字、托马斯的遗愿和整座盐线港，我们全都守住了。' },
        ],
        spawns: [],
      },
    ];

    const COD_STAMPS = [
      ['行动代号：失联名单 // OP: MISSING MANIFEST', '地点：盐线港四号泊位 · 「海燕号」货轮北侧', '时间：05:54:12 · 强风阵雨', '执行：林恩 · SAR-04 搜救特勤'],
      ['行动阶段 II // 沿海大道高速突围', '地点：盐线市主干道 → 沿海警务调度楼 04', '时间：06:11:40 · 铁砧全面封锁', '目标：撞穿路障并抢拷船员转运档案'],
      ['行动阶段 III // 第十七个名字', '地点：西南冷雾库 · 战地分诊中心', '时间：06:34:05 · 超级雷暴迫近', '目标：破除冷库锁控并修复托马斯录音芯片'],
      ['行动阶段 IV // 死线截停专列', '地点：西区铁路编组货场', '时间：07:02:18 · 货运专列已发车', '目标：炸毁信号闸并扫描 17 人原始货单'],
      ['行动阶段 V // 夺取海事公频', '地点：西岸高地雷达站 (+14m)', '时间：07:28:50 · 全城通讯静默', '目标：狙击散热芯并校准卫星公开广播'],
      ['紧急事态 // 零号泄洪协议已触发', '地点：西岸山顶高地 (+14m)', '时间：07:41:09 · 12米东海风暴潮袭港', '目标：坚守高地 15 秒并接通救援舰队'],
      ['行动阶段 VII // 破雾引航', '地点：南港旧船坞 → 22m 岸角灯塔', '时间：08:05:30 · 敌舰重炮覆盖', '目标：清除电源干扰并校准灯塔主透镜'],
      ['行动阶段 VIII // 机库黑匣子突击', '地点：西北海岸应急机场 · 110m 主跑道', '时间：08:29:44 · 敌方炮火压制', '目标：突破跑道冲入机库确保燃油与记录仪'],
      ['行动阶段 IX // 外海锚地疏散', '地点：南港锚地泊位 · 舷梯撤离点', '时间：08:47:15 · 幸存船员待撤', '目标：摧毁登船干扰器并守住撤离走廊'],
      ['行动阶段 X // 深夜档案保卫战', '地点：沿海警务调度楼 04 号站', '时间：09:08:22 · 铁砧残部反扑', '目标：破译沃德离岸总账并坚守上行链路'],
      ['行动阶段 XI // 最后引航护送', '地点：北段沿海大道 → 西北机场入口', '时间：09:26:50 · 防空阵地封锁', '目标：摧毁 2 座防空架护送车队抵近机场'],
      ['终章尾声 // 晴海启航', '地点：盐线港全区 · 西北机场拱形机库', '时间：09:50:00 · 晴空晨曦', '目标：登机归航并见证盐线港多分支结局'],
    ];
    function playActBriefing(idx) {
      const act = OPEN_WORLD_ACTS[idx];
      if (freeRoam || !act) return;
      const title = local(...act.title);
      const sc = actScripts[idx];
      world.hud?.showChapter?.(title.split(' · ').at(-1), sc?.sub || '', sc?.tag || `ACT ${idx + 1}`);
      if (COD_STAMPS[idx]) storyDirector?.showCodStamp?.(COD_STAMPS[idx], 5400);
      if (sc?.beats) playStorySequence(sc.beats);
    }

    function spawnStageDefenders(idx) {
      if (freeRoam || world.developer?.flags?.noEnemies) return;
      const sc = actScripts[idx];
      if (!sc?.spawns?.length || typeof world.enemies?.spawn !== 'function') return;
      sc.spawns.forEach(([type, x, y, z], i) => {
        storyTimers.push(setTimeout(() => {
          if (freeRoam || !cityCampaignActive || world.developer?.flags?.noEnemies) return;
          try {
            world.enemies.spawn(type, new Vector3(x, y, z), { state: 'alert', target: world.player?.pos ?? new Vector3(x, y, z) });
          } catch {}
        }, i * 240));
      });
    }

    // =========================================================================
    // DUAL MODE: OPEN WORLD SIGHTSEEING (freeRoam) <-> 8-ACT CITY CAMPAIGN
    // =========================================================================
    const owProgress = createOpenWorldCampaignProgress();
    const storyDirector = window.createOpenWorldStoryDirector ? window.createOpenWorldStoryDirector(world) : null;
    const isMultiplayer = () => Boolean(world.game?.conquest);
    let freeRoam = !!(window.SALTLINE_OPEN_WORLD_ROAM || world.params?.mode === 'openworld');
    let cityCampaignActive = !freeRoam; // Default to 8-Act Battlefield Open-World Campaign in mission mode!
    let photoMode = false;
    let lastMissionPropsVisible = null;
    function syncOpenWorldMissionProps(force = true) {
      const showProps = cityCampaignActive && !freeRoam && !isMultiplayer();
      if (!force && showProps === lastMissionPropsVisible) return;
      lastMissionPropsVisible = showProps;
      jammerRoot.visible = showProps;
      for (const t of shootTargets) {
        t.group.visible = showProps && t.alive;
        if (t.collider) t.collider.disabled = !t.group.visible;
      }
      for (const rb of roadblockProps) rb.mesh.visible = showProps && rb.intact;
    }
    syncOpenWorldMissionProps(true);

    const photoPill = document.createElement('div');
    photoPill.className = 'sl-photo-pill';
    photoPill.textContent = '📷 赏景摄影模式 · 按 [V] 恢复界面 · 按 [T] 切换天色';
    const interactPrompt = document.createElement('div');
    interactPrompt.className = 'sl-interact-prompt';
    document.body.append(photoPill, interactPrompt);

    function setPhotoMode(on) {
      photoMode = typeof on === 'boolean' ? on : !photoMode;
      minimap.classList.toggle('photo-hidden', photoMode);
      photoPill.classList.toggle('on', photoMode);
      const uiRoot = document.getElementById('ui');
      if (uiRoot) uiRoot.style.opacity = photoMode ? '0' : '1';
    }

    function setFreeRoam(enabled, announceChange = true) {
      freeRoam = !!enabled;
      window.SALTLINE_OPEN_WORLD_ROAM = freeRoam;
      if (freeRoam) {
        cityCampaignActive = false;
        storyDirector?.stopCutscene?.(false);
        storyDirector?.closeSignalTuner?.(false);
        storyDirector?.setTracker?.({ active: false });
        world.hud?.setObjective?.('');
        world.hud?.showChapter?.('');
        world.hud?.setMarkers?.([]);
        world.hud?.clearRadio?.();
        clearStoryTimers();
        syncOpenWorldMissionProps();
        world.enemies?.clear?.();
        if (world.developer?.flags) world.developer.flags.noEnemies = true;
      } else {
        cityCampaignActive = true;
        syncOpenWorldMissionProps();
        if (world.developer?.flags) world.developer.flags.noEnemies = false;
        if (announceChange) {
          playActBriefing(stage);
          spawnStageDefenders(stage);
        }
      }
      if (mapOpen) renderMapEntries(world.player?.pos);
    }

    // =========================================================================
    // 7-DISTRICT METADATA (STRICTLY x <= +26 REAL INLAND COASTAL CITY!)
    // =========================================================================
    const districts = [
      { id: 'berth', nameZh: '01 四号泊位核心港区', nameEn: 'Berth 4 Harbor', scenic: '真实岸线与集装箱货轮泊位', pos: new Vector3(-26, .1, -24), rect: [-107, -30, 133, 58], color: '#2b6d8a' },
      { id: 'city', nameZh: '02 沿海城区与滨海长廊', nameEn: 'Coastal City & Seafront', scenic: '东海观景长廊与可进入调度楼', pos: new Vector3(-26, .1, -68), rect: [-106, -145, 130, 115], color: '#355c75' },
      { id: 'sw_clinic', nameZh: '03 西南冷雾库·战地医院', nameEn: 'SW Cold-Storage & Clinic', scenic: '可开门分诊医院、急救台与停机坪', pos: new Vector3(-134, .1, 76), rect: [-222, 35, 115, 110], color: '#3e636b' },
      { id: 'rail_west', nameZh: '04 西区铁路货场编组站', nameEn: 'West Rail Freight Yard', scenic: '双轨货运专线与 12m 信号控制塔', pos: new Vector3(-130, .1, 5), rect: [-222, -35, 115, 70], color: '#6b4d38' },
      { id: 'mountain', nameZh: '05 西岸山地卫星站 (+14m)', nameEn: 'Mountain Comms (+14m)', scenic: '背山面海 +14m 制高点俯瞰全城东海', pos: new Vector3(-174, 14.1, -78), rect: [-221, -119, 111, 82], color: '#336145' },
      { id: 'south_harbor', nameZh: '06 南港旧船坞与岸角灯塔', nameEn: 'South Drydock & Lighthouse', scenic: '贴岸旧船坞、防潮闸与 22m 海角灯塔', pos: new Vector3(-26, .1, 116), rect: [-106, 28, 130, 117], color: '#2c5e69' },
      { id: 'airfield', nameZh: '07 海岸应急机场与机库', nameEn: 'Coastal Airfield', scenic: '西北跑道、航管塔台与可开闭机库', pos: new Vector3(-166, .1, -172), rect: [-222, -222, 112, 100], color: '#46506e' },
    ];

    const stageStarts = [
      { zh: '1/12 泊位破局 · 炸干扰塔+炮艇坍塌', en: '1/12 Berth 4 Jammers', pos: new Vector3(-16, .1, -16) },
      { zh: '2/12 城区撞卡 · 四驱车冲破路障', en: '2/12 City Roadblock', pos: new Vector3(-26, .1, -46) },
      { zh: '3/12 西南冷雾 · 解锁医疗样本+雷暴', en: '3/12 SW Cold Storage', pos: new Vector3(-138, .1, 74) },
      { zh: '4/12 西区货场 · 炸信号闸+油罐连爆', en: '4/12 West Rail Yard', pos: new Vector3(-124, .1, 5) },
      { zh: '5/12 西岸山顶 · 登+14m劫持大锅雷达', en: '5/12 Mountain Comms', pos: new Vector3(-172, 14.1, -78) },
      { zh: '6/12 洪峰求生 · 12米东海海啸避险', en: '6/12 Tsunami Survival', pos: new Vector3(-174, 14.1, -78) },
      { zh: '7/12 南港点灯 · 炮火下重启岸角灯塔', en: '7/12 Lighthouse Restore', pos: new Vector3(-26, .1, 108) },
      { zh: '8/12 机库夺证 · 冲进西北机场机库', en: '8/12 Airfield Hangar', pos: new Vector3(-130, .1, -172) },
      { zh: '9/12 锚地疏散 · 南港舷梯掩护撤离', en: '9/12 Outer Anchorage', pos: new Vector3(-8, .1, 82) },
      { zh: '10/12 深夜反攻 · 警务04号站保卫战', en: '10/12 Precinct Lockdown', pos: new Vector3(-24, .1, -56) },
      { zh: '11/12 公路护航 · 摧毁北段防空阵地', en: '11/12 Highway Escort', pos: new Vector3(-26, .1, -96) },
      { zh: '12/12 晴海尾声 · 黎明登机多分支结局', en: '12/12 Open Water Dawn', pos: new Vector3(-140, .1, -176) },
    ];

    let customGpsTarget = null;
    let mapOpen = false;
    let activeInteractable = null;
    const local = (en, zh) => window.SaltlineLocale?.t(en, zh) ?? zh;

    const mapOverlay = document.createElement('div');
    mapOverlay.className = 'sl-map-overlay';
    mapOverlay.innerHTML = `
      <div class="sl-map-card">
        <div class="sl-map-header">
          <div class="sl-map-title">${local('Coastal district map', '盐线地图')}</div>
          <div class="sl-map-top-btns">
            <button class="sl-map-mode-btn" data-toggle-mode></button>
            <button class="sl-map-close" data-sky-btn>${local('Time of day [T]', '天色 [T]')}</button>
            <button class="sl-map-close" data-close>${local('Close [M]', '关闭 [M]')}</button>
          </div>
        </div>
        <div class="sl-map-canvas">
          <svg viewBox="-236 -236 300 396" preserveAspectRatio="xMidYMid meet">
            <!-- Open East Sea on the right (x > +26) -->
            <rect x="26" y="-236" width="60" height="396" fill="#072233"/>
            <line x1="26" y1="-236" x2="26" y2="160" stroke="#5ccbe0" stroke-width="2" stroke-dasharray="6 4"/>
            <text x="45" y="-40" fill="#7b9396" font-size="10" font-weight="700" writing-mode="tb">${local('East Sea', '东海')}</text>
            <!-- North-South Central Rail Corridor & Twin Tunnel + South Drydock Basin -->
            <g stroke="#90a4ae" stroke-width="3" stroke-dasharray="5 3" fill="none" opacity="0.85">
              <line x1="-133" y1="-115" x2="-133" y2="144"/>
              <line x1="-140" y1="-115" x2="-140" y2="144"/>
            </g>
            <rect x="-6" y="80" width="32" height="24" fill="#072233" stroke="#5ccbe0" stroke-width="1.2"/>
            <!-- Coastal City Road Network & Level Crossing -->
            <g stroke="#d4aa4c" stroke-width="4.5" stroke-linecap="round" fill="none" opacity="0.82">
              <line x1="-26" y1="-140" x2="-26" y2="140"/>
              <line x1="-112" y1="-140" x2="-112" y2="132"/>
              <line x1="-170" y1="-125" x2="20" y2="-125"/>
              <line x1="-206" y1="5" x2="-26" y2="5"/>
              <line x1="-166" y1="42" x2="18" y2="42"/>
              <line x1="-200" y1="122" x2="-26" y2="122"/>
              <line x1="-112" y1="-78" x2="-174" y2="-78"/>
            </g>
            <g data-zones></g>
            <circle data-mission cx="0" cy="0" r="10" fill="none" stroke="#58e8ff" stroke-width="2.5" style="display:none"/>
            <circle data-gps cx="0" cy="0" r="8" fill="none" stroke="#ffd859" stroke-width="2.5" stroke-dasharray="4 3" style="display:none"/>
            <g data-player transform="translate(-26,-24)">
              <circle r="7" fill="rgba(88,232,255,0.28)"/>
              <circle r="3.6" fill="#58e8ff" stroke="#ffffff" stroke-width="1.4"/>
            </g>
          </svg>
        </div>
        <div class="sl-map-side" data-list></div>
      </div>
    `;
    document.body.appendChild(mapOverlay);
    const mapZonesG = mapOverlay.querySelector('[data-zones]');
    const mapListEl = mapOverlay.querySelector('[data-list]');
    const mapPlayerG = mapOverlay.querySelector('[data-player]');
    const mapMissionC = mapOverlay.querySelector('[data-mission]');
    const mapGpsC = mapOverlay.querySelector('[data-gps]');
    const mapModeBtn = mapOverlay.querySelector('[data-toggle-mode]');

    mapModeBtn.addEventListener('click', () => setFreeRoam(!freeRoam, true));
    mapOverlay.querySelector('[data-sky-btn]').addEventListener('click', () => applySkyPreset(skyIdx + 1));

    function isStandPosClear(x, y, z, radius = 0.45, height = 1.75) {
      const boxes = physics?.boxes;
      if (!Array.isArray(boxes)) return true;
      for (let i = 0; i < boxes.length; i++) {
        const b = boxes[i];
        if (!b || b.bulletOnly) continue;
        if (b.max.y <= y + 0.12 || b.min.y >= y + height) continue;
        if (x + radius > b.min.x && x - radius < b.max.x && z + radius > b.min.z && z - radius < b.max.z) {
          return false;
        }
      }
      return true;
    }

    function resolveSafeStandPos(pos) {
      const baseX = pos.x, baseY = pos.y, baseZ = pos.z;
      const sampleGround = (x, z) => {
        const gh = typeof physics?.groundHeight === 'function' ? physics.groundHeight(x, z, baseY + 2.5) : baseY;
        return Number.isFinite(gh) ? Math.max(baseY, gh) : baseY;
      };
      const g0 = sampleGround(baseX, baseZ);
      if (isStandPosClear(baseX, g0, baseZ)) return new Vector3(baseX, g0 + 0.05, baseZ);
      const rings = [1.8, 3.4, 5.2, 7.5];
      for (const r of rings) {
        for (let k = 0; k < 8; k++) {
          const ang = (k / 8) * Math.PI * 2;
          const cx = baseX + Math.cos(ang) * r;
          const cz = baseZ + Math.sin(ang) * r;
          const gy = sampleGround(cx, cz);
          if (isStandPosClear(cx, gy, cz)) return new Vector3(cx, gy + 0.05, cz);
        }
      }
      return new Vector3(baseX, g0 + 0.15, baseZ);
    }

    function movePlayerAndVehicle(pos, bringTruckNear = false) {
      const safePos = resolveSafeStandPos(pos);
      if (world.player?.pos) {
        world.player.pos.copy(safePos);
        if (world.player.vel) world.player.vel.set(0, 0, 0);
        world.player.enabled = true;
      }
      if (world.vehicle?.setPosition) {
        if (world.vehicle.driving) world.vehicle.setPosition(safePos);
        else if (bringTruckNear) {
          const truckPos = resolveSafeStandPos(new Vector3(safePos.x + 5.5, safePos.y, safePos.z + 3.5));
          world.vehicle.setPosition(truckPos);
        }
      }
      return safePos;
    }

    function teleportToSafeStart() {
      inspectLock = null;
      if (mapOpen) toggleMap(false);
      const safeStart = movePlayerAndVehicle(new Vector3(-26, 0.25, -36), true);
      if (world.player) {
        world.player.yaw = 0;
        world.player.pitch = 0;
        world.player.enabled = true;
      }
      world.input?.setGameplay?.(true);
      return safeStart;
    }

    function teleportToDistrict(d) {
      movePlayerAndVehicle(d.pos, true);
      chunkMgr?.warmUpSync?.(d.pos);
      toggleMap(false);
      world.tactical?.notify?.(`⚡ 已快速传送至：${d.nameZh}（四驱车已同步就位）`, `⚡ Fast-traveled to: ${d.nameEn}`, false, 3.2);
    }

    function setGpsDistrict(d) {
      customGpsTarget = d.pos.clone();
      toggleMap(false);
      world.tactical?.notify?.(`📍 GPS 导航光柱已锁定：${d.nameZh}`, `📍 GPS Beacon locked: ${d.nameEn}`, false, 3.8);
    }

    function renderMapEntries(playerPos) {
      mapModeBtn.textContent = freeRoam ? local('Switch to campaign', '切换到战役') : local('Switch to free roam', '切换到漫游');
      mapZonesG.innerHTML = '';
      mapListEl.innerHTML = '';
      for (const d of districts) {
        const sec = sectors.find(s => s.id === d.id);
        const isLoaded = d.id === 'berth' || !!sec?.loaded;
        const [rx, rz, rw, rh] = d.rect;
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'sl-map-zone-btn');
        g.innerHTML = `
          <rect x="${rx}" y="${rz}" width="${rw}" height="${rh}" rx="6"
            fill="${d.color}" fill-opacity="${isLoaded ? '0.48' : '0.22'}"
            stroke="rgba(219, 223, 213, .5)" stroke-width="1.2"/>
          <text x="${rx + rw / 2}" y="${rz + rh / 2 + 3}" text-anchor="middle" fill="#eef9fc" font-size="10.5" font-weight="700">${d.nameZh.slice(3, 10)}</text>
        `;
        g.addEventListener('click', () => setGpsDistrict(d));
        mapZonesG.appendChild(g);

        const item = document.createElement('div');
        item.className = 'sl-map-item' + (isLoaded ? ' active' : '');
        item.innerHTML = `
          <div class="sl-map-item-top">
            <span>${local(d.nameEn, d.nameZh.slice(3))}</span>
          </div>
          <div style="font-size:11px;color:#99b7c1">${d.scenic}</div>
          <div class="sl-map-actions">
            <button class="sl-map-btn" data-gps-btn>${local('Set GPS', '设 GPS')}</button>
            <button class="sl-map-btn tp" data-tp-btn>${local('Fast travel', '传送')}</button>
          </div>
        `;
        item.querySelector('[data-gps-btn]').addEventListener('click', () => setGpsDistrict(d));
        item.querySelector('[data-tp-btn]').addEventListener('click', () => teleportToDistrict(d));
        mapListEl.appendChild(item);
      }
      if (playerPos) mapPlayerG.setAttribute('transform', `translate(${playerPos.x.toFixed(1)},${playerPos.z.toFixed(1)})`);
      const mInfo = currentObjectiveInfo();
      if (!freeRoam && mInfo.pos) {
        mapMissionC.style.display = '';
        mapMissionC.setAttribute('cx', mInfo.pos.x.toFixed(1));
        mapMissionC.setAttribute('cy', mInfo.pos.z.toFixed(1));
      } else mapMissionC.style.display = 'none';
      if (customGpsTarget) {
        mapGpsC.style.display = '';
        mapGpsC.setAttribute('cx', customGpsTarget.x.toFixed(1));
        mapGpsC.setAttribute('cy', customGpsTarget.z.toFixed(1));
      } else mapGpsC.style.display = 'none';
    }

    function toggleMap(force, { restoreInput = true } = {}) {
      const nextOpen = typeof force === 'boolean' ? force : !mapOpen;
      if (nextOpen === mapOpen || (nextOpen && isMultiplayer())) return;
      mapOpen = nextOpen;
      mapOverlay.classList.toggle('open', mapOpen);
      if (mapOpen) {
        world.input?.setGameplay?.(false);
        try { document.exitPointerLock?.(); } catch {}
        renderMapEntries(world.player?.pos);
      } else if (restoreInput && (!world.game || world.game.state === 'playing')) {
        world.input?.setGameplay?.(true);
        try { world.input?.requestLock?.(); } catch {}
      }
    }
    mapOverlay.querySelector('[data-close]').addEventListener('click', () => toggleMap(false));

    // 6-Viewpoint Acceptance Inspection Tour ([B] key or automated CDP capture script)
    const inspectViews = [
      { id: 'view-1-day-street',       name: '1/6 白天城市街道',   pos: new Vector3(-26, 2.8, -42),  look: new Vector3(-26, 4.8, -108),  sky: 1 },
      { id: 'view-2-building-closeup', name: '2/6 建筑近距离细节', pos: new Vector3(-56, 4.4, -82),  look: new Vector3(-82, 7.6, -104),  sky: 1 },
      { id: 'view-3-skyline',          name: '3/6 城市天际线',     pos: new Vector3(19, 15.5, -34),  look: new Vector3(-58, 7.5, -98),   sky: 1 },
      { id: 'view-4-industrial',       name: '4/6 工业区域',       pos: new Vector3(-156, 8.2, 52),  look: new Vector3(-192, 6.5, 92),   sky: 1 },
      { id: 'view-5-terrain-forest',   name: '5/6 自然地形与森林', pos: new Vector3(-168, 17.5, -62), look: new Vector3(-218, 12.5, -88), sky: 1 },
      { id: 'view-6-night',            name: '6/6 夜间环境',       pos: new Vector3(-26, 3.6, -48),  look: new Vector3(-26, 5.2, -110),  sky: 3 },
    ];
    let inspectIdx = -1;
    let inspectLock = null;
    function resetView() {
      inspectLock = null;
      toggleMap(false, { restoreInput: false });
      setPhotoMode(false);
    }

    function jumpInspectView(idx, { photoClean = false } = {}) {
      inspectIdx = ((idx % inspectViews.length) + inspectViews.length) % inspectViews.length;
      const v = inspectViews[inspectIdx];
      if (!freeRoam) setFreeRoam(true, false);
      applySkyPreset(v.sky, true);
      movePlayerAndVehicle(v.pos, false);
      const dx = v.look.x - v.pos.x, dy = v.look.y - v.pos.y, dz = v.look.z - v.pos.z;
      const horiz = Math.max(0.001, Math.hypot(dx, dz));
      const yaw = Math.atan2(-dx, -dz);
      const pitch = Math.atan2(dy, horiz);
      if (world.player) {
        world.player.yaw = yaw;
        world.player.pitch = pitch;
      }
      if (photoClean) {
        inspectLock = { pos: v.pos.clone(), look: v.look.clone(), yaw, pitch };
        world.weapon?.setVisible?.(false);
        setPhotoMode(true);
        const menuEl = document.querySelector?.('.menu');
        if (menuEl) menuEl.classList.remove('open');
        if (world.game) world.game.state = 'playing';
      } else {
        inspectLock = null;
      }
      if (world.camera) {
        world.camera.position.copy(v.pos);
        world.camera.lookAt(v.look);
      }
      const st = chunkMgr?.getStats?.() || null;
      if (!photoClean) {
        const statsStr = st ? ` | ${st.fps} FPS (${st.frameTimeMs}ms) · DC ${st.drawCalls} · Tri ${st.triangles} · Geo ${st.gpuGeometries} · Tex ${st.gpuTextures}` : '';
        world.tactical?.notify?.(`📸 验收视角 ${v.name}${statsStr}`, `Inspect ${v.name}${statsStr}`, false, 5.5);
      }
      return { id: v.id, view: v.name, stats: st };
    }
    if (typeof window !== 'undefined') {
      window.SALTLINE_INSPECT_VIEW = jumpInspectView;
      window.SALTLINE_INSPECT_VIEWS = inspectViews.map(v => ({ id: v.id, name: v.name }));
      window.SALTLINE_GET_STATS = () => chunkMgr?.getStats?.() || null;
    }

    updaters.push(() => {
      if (!inspectLock) return;
      if (world.player?.pos) {
        world.player.pos.copy(inspectLock.pos);
        world.player.vel?.set?.(0, 0, 0);
        world.player.yaw = inspectLock.yaw;
        world.player.pitch = inspectLock.pitch;
      }
      if (world.camera) {
        world.camera.position.copy(inspectLock.pos);
        world.camera.lookAt(inspectLock.look);
      }
    });

    const onKeyDown = e => {
      if (world.game?.state !== 'playing' || isMultiplayer() ||
          world.game.cinematic?.active || world.game.arrival || world.developer?.open) return;
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.code === 'Escape' && mapOpen) {
        e.preventDefault();
        e.stopImmediatePropagation();
        toggleMap(false);
      } else if (e.code === 'KeyM' && !e.repeat) { e.preventDefault(); toggleMap(); }
      else if (e.code === 'KeyJ' && !e.repeat) {
        e.preventDefault();
        const act = OPEN_WORLD_ACTS[Math.min(stage, OPEN_WORLD_ACTS.length - 1)];
        const obj = currentObjectiveInfo();
        storyDirector?.toggleJournal?.(undefined, {
          title: act ? local(...act.title) : '《失联名单》案情简报',
          brief: `${act ? local(...act.description) : ''}${obj?.zh ? `\n当前目标：${obj.zh}` : ''}（提示：靠近四号泊位老霍克、警务室苏珊、战地护士林婉等任意 NPC 按 [E] 可面对面了解完整案情）`,
        });
      }
      else if (e.code === 'KeyH' && !e.repeat) {
        e.preventDefault();
        if (squadAllies.length && world.player?.pos) {
          for (const ally of squadAllies) ally.moveTo(world.player.pos);
          const healed = squadAllies[0]?.healPlayer?.(world.player, 35);
          if (!healed) squadAllies[1]?.speak?.('凯尔：「收到！小队正在向你靠拢，火力掩护马上就位！」', 'Kai: Regrouping on you!', true);
        }
      }
      else if (e.code === 'KeyU' && !e.repeat) {
        e.preventDefault();
        teleportToSafeStart();
        world.tactical?.notify?.('🧭 已一键脱困，传送至沿海大道开阔路面', '🧭 Unstuck to Coastal Blvd', false, 2.8);
      }
      else if (e.code === 'KeyT' && !e.repeat) { e.preventDefault(); applySkyPreset(skyIdx + 1); }
      else if (e.code === 'KeyV' && !e.repeat) { e.preventDefault(); setPhotoMode(); }
      else if (e.code === 'KeyB' && !e.repeat) { e.preventDefault(); jumpInspectView(inspectIdx + 1); }
      else if (e.code === 'KeyE' && !e.repeat && activeInteractable) { activeInteractable.use(); }
      else if (e.code === 'KeyZ' && !e.repeat) { callSupport('supply'); }
      else if (e.code === 'KeyX' && !e.repeat) { callSupport('artillery'); }
      else if (e.code === 'KeyK' && !e.repeat) { callSupport('smoke'); }
    };
    window.addEventListener('keydown', onKeyDown, true);

    // =========================================================================
    // 8-ACT CONNECTED COASTAL CITY CAMPAIGN ("盐线市·失联名单")
    // =========================================================================
    let stage = 0, subStage = 0, holdProgress = 0, satTuned = false, precinctWaveSpawned = false;
    let tsunamiSurviveClock = 0, runwayArtilleryClock = 0, bridgeBarrageTriggered = false, introActShown = false;
    let act2ChaseTriggered = false, act8RunwayPassTriggered = false;
    const rayOrigin = new Vector3(), rayDir = new Vector3(), toTgt = new Vector3(), up = new Vector3(0, 1, 0);

    const POS_BLACKBOX = new Vector3(-20, .5, -18);
    const POS_PRECINCT = new Vector3(-10, .5, -56);
    const POS_CLINIC_REC = new Vector3(-158, .5, 96);
    const POS_TRAIN_SCAN = new Vector3(-164, .5, 4);
    const POS_SAT_CONSOLE = new Vector3(-174, 14.5, -78);
    const POS_LIGHTHOUSE_LENS = new Vector3(14, .5, 128);
    const POS_ANCHORAGE_EVAC = new Vector3(16, .5, 86);
    const POS_HIGHWAY_CONVOY = new Vector3(-130, .5, -172);

    interactables.push(
      {
        id: 'story-precinct-ledger', pos: POS_PRECINCT, radius: 5.5,
        getPrompt: () => (stage === 9 && subStage === 0 && cityCampaignActive && !freeRoam) ? '按 [E] 破译沃德离岸资金总账并启动上行校验' : '',
        use() {
          if (!(stage === 9 && subStage === 0 && cityCampaignActive && !freeRoam)) return;
          const ok = storyDirector?.openSignalTuner?.({
            title: '破译沃德离岸资金总账',
            subtitle: '铁砧正在远程擦除账本密钥，连续锁定 3 次金色频段冻结服务器！',
            locksNeeded: 3, speed: 1.05, zoneWidth: 0.21,
            onSuccess() {
              subStage = 1;
              holdProgress = 0;
              world.tactical?.notify?.('🔐 离岸总账已解封！坚守警务 04 号站 10 秒完成海事检察院同步！', '🔐 Offshore ledger decrypted! Hold Precinct 04 for 10s!', true, 4.8);
              spawnStageDefenders(9);
            },
          });
          if (!ok) { subStage = 1; holdProgress = 0; spawnStageDefenders(9); }
        },
      },
      {
        id: 'story-berth-blackbox', pos: POS_BLACKBOX, radius: 4.5,
        getPrompt: () => (stage === 0 && subStage === 0 && cityCampaignActive && !freeRoam) ? '按 [E] 启动战术频谱仪解码「海燕号」加密黑匣子' : '',
        use() {
          if (!(stage === 0 && subStage === 0 && cityCampaignActive && !freeRoam)) return;
          const ok = storyDirector?.openSignalTuner?.({
            title: '解码「海燕号」加密黑匣子',
            subtitle: '拦截到的港务局加密信标正在跳频，连续锁定 3 次金色频段提取 05:31 扣押令！',
            locksNeeded: 3, speed: 0.95, zoneWidth: 0.22,
            onSuccess() {
              subStage = 1;
              storyDirector?.setTracker?.({ active: false });
              world.tactical?.notify?.('🔓 黑匣子解码成功！铁砧已警觉并开启 2 座防空干扰塔，立刻击毁它们！', '🔓 Black-box decoded! Destroy the 2 Berth 4 jammers!', true, 4.8);
              playStorySequence([
                { at: .2, speaker: 'REED · PORT DIRECTOR（截获频道）', tone: 'hostile', line: '有人破译了四号泊位加密信标！沃德，全功率启动干扰塔，绝不能让 SAR 把扣押令传出去！' },
                { at: 5.2, speaker: 'MARA CHEN · SAR-04', tone: 'ally', line: '实锤拿到了！快打爆货场与码头这两座干扰塔，打通频道我们立刻北上追查体检档案！' },
              ]);
              spawnStageDefenders(0);
            },
          });
          if (!ok) { subStage = 1; spawnStageDefenders(0); }
        },
        cleanup() {},
      },
      {
        id: 'story-clinic-recorder', pos: POS_CLINIC_REC, radius: 5.0,
        getPrompt: () => (stage === 2 && subStage === 1 && cityCampaignActive && !freeRoam) ? '按 [E] 启动频谱仪修复托马斯的受损录音芯片' : '',
        use() {
          if (!(stage === 2 && subStage === 1 && cityCampaignActive && !freeRoam)) return;
          const ok = storyDirector?.openSignalTuner?.({
            title: '修复托马斯·万斯的录音芯片',
            subtitle: '冷库低温导致磁道偏移，连续锁定 3 次频段还原第 17 人的最后留言！',
            locksNeeded: 3, speed: 1.05, zoneWidth: 0.20,
            onSuccess() {
              storyDirector?.setTracker?.({ active: false });
              world.tactical?.notify?.('🎙️ 托马斯录音已修复！铁砧正用西区货运专列转移全部原始货单！', '🎙️ Recording restored! Manifests are on the West Rail train!', true, 4.8);
              advanceToStage(3);
            },
          });
          if (!ok) advanceToStage(3);
        },
        cleanup() {},
      },
      {
        id: 'story-sat-uplink', pos: POS_SAT_CONSOLE, radius: 5.5,
        getPrompt: () => (stage === 4 && subStage === 1 && !satTuned && cityCampaignActive && !freeRoam) ? '按 [E] 校准西岸卫星天线频段，准备全城广播《失联名单》' : '',
        use() {
          if (!(stage === 4 && subStage === 1 && !satTuned && cityCampaignActive && !freeRoam)) return;
          const ok = storyDirector?.openSignalTuner?.({
            title: '海事卫星公频上行校准',
            subtitle: '散热芯已离线，锁定 3 次卫星同步频段后即可强行向东海救援舰队广播！',
            locksNeeded: 3, speed: 1.15, zoneWidth: 0.18,
            onSuccess() {
              satTuned = true;
              holdProgress = 0;
              world.tactical?.notify?.('🛰️ 卫星链路已接通！保持在雷达基座 12m 内守住 10 秒完成广播！', '🛰️ Uplink locked! Hold within 12m for 10s to broadcast!', true, 4.5);
            },
          });
          if (!ok) { satTuned = true; holdProgress = 0; }
        },
        cleanup() {},
      },
      {
        id: 'story-lighthouse-lens', pos: POS_LIGHTHOUSE_LENS, radius: 5.5,
        getPrompt: () => (stage === 6 && subStage === 1 && cityCampaignActive && !freeRoam) ? '按 [E] 手动校准 22 米南角灯塔光学透镜' : '',
        use() {
          if (!(stage === 6 && subStage === 1 && cityCampaignActive && !freeRoam)) return;
          const ok = storyDirector?.openSignalTuner?.({
            title: '校准 22 米南角灯塔主透镜',
            subtitle: '风暴震偏了聚光棱镜，锁定 3 次相位让强光穿透东海雾墙！',
            locksNeeded: 3, speed: 1.12, zoneWidth: 0.19,
            onSuccess() {
              lighthouseOverdrive = true;
              storyDirector?.setTracker?.({ active: false });
              world.disasters?.triggerVictoryFlareBarrage?.(new Vector3(14, 18, 134));
              world.tactical?.notify?.('🗼 22 米南角灯塔强光重燃！东海救援舰队已突破风暴线！', '🗼 22m Lighthouse relit! Rescue fleet inbound!', true, 5.2);
              const played = storyDirector?.playCutscene?.({
                id: 'cine-act6-lighthouse',
                tag: '剧情过场 · 破雾引航',
                title: '南角灯塔重燃',
                subtitle: '22 米强光穿透海雾，东海救援舰队全速驶入盐线港',
                duration: 5.2,
                camFrom: [-10, 12, 112], camTo: [4, 24, 108], lookAt: [14, 19, 134],
                lines: [
                  { at: .2, speaker: '东海救援舰队', tone: 'rescue', line: '已目视南角灯塔强光！先遣编队突破雾墙，正在进港接管防务！' },
                  { at: 2.8, speaker: '玛拉·陈 · SAR-04', tone: 'ally', line: '成功了！西北应急机场的救援运输机已起转引擎，林恩，我们撤离！' },
                ],
                onComplete: () => advanceToStage(7),
              });
              if (!played) advanceToStage(7);
            },
          });
          if (!ok) { lighthouseOverdrive = true; advanceToStage(7); }
        },
        cleanup() {},
      }
    );

    function advanceToStage(nextStage) {
      if (nextStage > stage) owProgress.completeStage(stage);
      stage = nextStage;
      subStage = 0;
      holdProgress = 0;
      satTuned = false;
      precinctWaveSpawned = false;
      storyDirector?.setTracker?.({ active: false });
      if (nextStage === 11) {
        world.disasters?.stopAllEvents?.();
        applySkyPreset(1, true);
      }
      if (nextStage < OPEN_WORLD_ACTS.length) {
        playActBriefing(nextStage);
        if (nextStage !== 0 && nextStage !== 11) spawnStageDefenders(nextStage);
      }
    }

    function jumpToStage(targetStage, { teleport = true, clearEnemies = true } = {}) {
      freeRoam = false;
      cityCampaignActive = true;
      introActShown = true;
      window.SALTLINE_OPEN_WORLD_ROAM = false;
      storyDirector?.stopCutscene?.(false);
      storyDirector?.closeSignalTuner?.(false);
      storyDirector?.setTracker?.({ active: false });
      if (world.developer?.flags) world.developer.flags.noEnemies = false;
      if (clearEnemies) world.enemies?.clear?.();
      const idx = Math.max(0, Math.min(OPEN_WORLD_ACTS.length - 1, Number(targetStage) || 0));
      stage = idx;
      subStage = 0;
      holdProgress = 0;
      satTuned = false;
      precinctWaveSpawned = false;
      customGpsTarget = null;
      bridgeBarrageTriggered = false;
      act2ChaseTriggered = false;
      act8RunwayPassTriggered = false;
      resetParkedAircraft();
      tsunamiSurviveClock = idx === 5 ? 15.0 : 0;
      for (const t of shootTargets) {
        t.alive = t.stage >= idx;
        t.hp = t.maxHp;
        t.group.visible = t.alive;
        if (t.collider) t.collider.disabled = !t.alive;
      }
      for (const rb of roadblockProps) {
        rb.intact = idx <= 1;
        rb.mesh.visible = rb.intact;
      }
      syncOpenWorldMissionProps();
      finaleCard.classList.remove('open');
      const st = stageStarts[idx];
      if (teleport && st) {
        movePlayerAndVehicle(st.pos, true);
        chunkMgr?.warmUpSync?.(st.pos);
      }
      if (idx === 5) {
        world.disasters?.triggerTideGateDemolition?.();
        world.disasters?.triggerTsunami?.();
      }
      if (idx === 6) world.disasters?.triggerArtilleryBarrage?.();
      if (idx === 11) {
        world.disasters?.stopAllEvents?.();
        applySkyPreset(1, true);
      }
      playActBriefing(idx);
      if (idx !== 0 && idx !== 11) spawnStageDefenders(idx);
    }

    function startFromLanding() {
      storyDirector?.resetPlayed?.();
      jumpToStage(0, { teleport: false, clearEnemies: true });
    }

    function restartCurrentStage() {
      jumpToStage(Math.min(stage, OPEN_WORLD_ACTS.length - 1), { teleport: true, clearEnemies: true });
    }

    function hitTarget(t) {
      if (!t.alive || freeRoam || !cityCampaignActive) return;
      if (stage === 0 && subStage === 0) {
        world.tactical?.notify?.('📡 请先在四号泊位北侧破解「海燕号」黑匣子信标（按 E）！', '📡 Decode the Berth 4 black-box first ([E])!', false, 2.8);
        return;
      }
      t.hp--;
      flashHitmarker(t.hp <= 0);
      fx?.sparks?.(t.pos, up, 20);
      audio?.play?.('rail_touchdown', { pos: t.pos, ref: 20, gain: .55, jitter: .1 });
      world.player?.addShake?.(.14);
      if (t.hp > 0) {
        fx?.smoke?.(t.pos, { size: 1.8, life: 2.5, color: 0x3b3530, alpha: .55, rise: .8, count: 3 });
        world.tactical?.notify?.(`🎯 命中「${t.labelZh}」装甲！（剩余耐久 ${t.hp}/${t.maxHp}）`, `🎯 Hit ${t.id}! Armor ${t.hp}/${t.maxHp}`, false, 2.0);
        return;
      }
      t.alive = false;
      t.group.visible = false;
      if (t.collider) t.collider.disabled = true;
      fx?.smoke?.(t.pos, { size: 4.6, life: 5.5, color: 0x26211d, alpha: .74, rise: 1.3, count: 10 });
      fx?.sparks?.(t.pos, up, 42);
      fx?.debris?.(t.pos, { count: 18 });
      audio?.play?.('rail_touchdown', { pos: t.pos, ref: 30, gain: .95, jitter: .05 });
      world.player?.addShake?.(.56);

      const rem = shootTargets.filter(x => x.stage === stage && x.alive).length;
      if (stage === 0) {
        if (rem > 0) world.tactical?.notify?.(`💥 ${t.labelZh}已摧毁！还剩 ${rem} 座干扰塔`, `💥 Jammer down! ${rem} left!`, true, 4.0);
        else {
          world.berthSlice?.triggerClimaxSetPiece?.();
          const played = storyDirector?.playCutscene?.({
            id: 'cine-act1-breach',
            tag: '剧情过场 · 封锁瓦解',
            title: '四号泊位突围',
            subtitle: '防空干扰已清除，铁砧紧急封锁沿海大道并企图销毁城区档案',
            duration: 5.0,
            camFrom: [-18, 12, -16], camTo: [-26, 15, -46], lookAt: [-26, 2.5, -76],
            lines: [
              { at: .2, speaker: '沃德 · 铁砧指挥官', tone: 'hostile', line: '干扰塔全毁！封死沿海大道十字路口，立刻清空警务调度楼里的船员体检记录！' },
              { at: 2.6, speaker: '玛拉·陈 · SAR-04', tone: 'ally', line: '林恩，按 [G] 召唤四驱车、[F] 登车，冲破前面路障去警务调度楼抢回档案！' },
            ],
            onComplete: () => advanceToStage(1),
          });
          if (!played) advanceToStage(1);
        }
      } else if (stage === 2) {
        if (rem > 0) world.tactical?.notify?.(`❄️ ${t.labelZh}已击毁！还剩 ${rem} 台！`, `❄️ Cryo-lock down! ${rem} left!`, false, 3.8);
        else {
          subStage = 1;
          world.disasters?.triggerLightningStorm?.();
          world.tactical?.notify?.('❄️ 冷库气密锁已解除！快去西南战地诊所（-158, 96）按 [E] 修复托马斯录音芯片！', '❄️ Cryo-locks broken! Repair Thomas’s recorder at SW Clinic ([E])!', true, 5.0);
        }
      } else if (stage === 3) {
        if (rem > 0) world.tactical?.notify?.(`🚂 ${t.labelZh}已炸毁！还剩 ${rem} 处！`, `🚂 Rail breaker down! ${rem} left!`, false, 3.8);
        else {
          subStage = 1;
          holdProgress = 0;
          world.disasters?.triggerFuelChainBlast?.();
          storyDirector?.playCutscene?.({
            id: 'cine-act3-train',
            tag: '剧情过场 · 专列迫停',
            title: '铁轨死线截车',
            subtitle: '油罐连爆迫停了铁砧证物专列，趁混乱靠近车厢扫描 17 人原始货单',
            duration: 4.8,
            camFrom: [-144, 14, -22], camTo: [-166, 10, 18], lookAt: [-164, 2.5, 4],
            lines: [
              { at: .2, speaker: '玛拉·陈 · SAR-04', tone: 'ally', line: '漂亮！信号闸瘫痪触发了紧急制动，整列货车都被逼停在编组站里了！' },
              { at: 2.5, speaker: '林恩 · SAR-04', tone: 'ally', line: '我这就靠近专列车厢扫描原始货单，把 17 个人的完整名单带出来！' },
            ],
          });
        }
      } else if (stage === 4) {
        if (rem > 0) world.tactical?.notify?.(`🎯 ${t.labelZh}已击毁！还剩 ${rem} 个！`, `🎯 Cooling core down! ${rem} left!`, false, 3.8);
        else {
          subStage = 1;
          satTuned = false;
          holdProgress = 0;
          world.tactical?.notify?.('🛰️ 散热芯全部离线！靠近山顶雷达主控台按 [E] 校准卫星公频！', '🛰️ Cooling cores down! Tune the satellite dish console ([E])!', true, 4.8);
        }
      } else if (stage === 6) {
        if (rem > 0) world.tactical?.notify?.(`🚨 ${t.labelZh}已摧毁！还剩 ${rem} 座！`, `🚨 Lighthouse jammer down! ${rem} left!`, false, 3.8);
        else {
          subStage = 1;
          world.tactical?.notify?.('🗼 干扰已清除！前往 22 米南角灯塔基座（14, 128）按 [E] 校准聚光透镜！', '🗼 Jammers cleared! Calibrate the 22m Lighthouse lens ([E])!', true, 4.8);
        }
      } else if (stage === 8) {
        if (rem > 0) world.tactical?.notify?.(`⚓ ${t.labelZh}已摧毁！还剩 ${rem} 座！`, `⚓ Boarding jammer down! ${rem} left!`, false, 3.8);
        else {
          subStage = 1;
          holdProgress = 0;
          world.tactical?.notify?.('🚤 登船干扰全部离线！守住南锚地舷梯（16, 86）10 秒掩护船员登艇！', '🚤 Jammers cleared! Hold South Quay gangway (16, 86) for 10s!', true, 4.8);
        }
      } else if (stage === 10) {
        if (rem > 0) world.tactical?.notify?.(`🚀 ${t.labelZh}已炸毁！还剩 ${rem} 座防空架！`, `🚀 SAM pod destroyed! ${rem} left!`, false, 3.8);
        else {
          subStage = 1;
          world.tactical?.notify?.('✈️ 海岸公路防空威胁已清除！护送车队冲向西北机场入口（-130, -172）！', '✈️ SAM pods cleared! Escort convoy to Airfield Approach!', true, 4.8);
        }
      }
    }

    function checkTargetShot(originVec, dirVec, maxDist = 160) {
      if (freeRoam || !cityCampaignActive) return;
      let best = null, bestDist = maxDist;
      for (const t of shootTargets) {
        if (!t.alive || t.stage !== stage) continue;
        toTgt.subVectors(t.pos, originVec);
        const proj = toTgt.dot(dirVec);
        if (proj < .5 || proj > bestDist) continue;
        const perpSq = toTgt.lengthSq() - proj * proj;
        if (perpSq <= t.radius * t.radius) { best = t; bestDist = proj; }
      }
      if (best) hitTarget(best);
    }
    world.events?.on?.('weapon:fire', () => {
      if (!world.camera || freeRoam || !cityCampaignActive) return;
      world.camera.getWorldPosition(rayOrigin);
      world.camera.getWorldDirection(rayDir);
      checkTargetShot(rayOrigin, rayDir, 120);
    });
    world.events?.on?.('vehicle:fire', ev => {
      if (!ev?.origin || !ev?.dir) return;
      checkTargetShot(ev.origin, ev.dir, 185);
    });

    // =========================================================================
    // BATTLEFIELD ELEMENTS IN CAMPAIGN: SUPPORT CALLS & DISTRICT OUTPOSTS
    // =========================================================================
    let supportPoints = 4;
    const SUPPORT_MAX = 12;
    const supportState = { supplyCd: 0, artilleryCd: 0, smokeCd: 0 };
    const awardSupport = amt => { supportPoints = Math.min(SUPPORT_MAX, supportPoints + amt); };

    const outposts = [
      { id: 'outpost-city', nameZh: '沿海警务广场据点', pos: new Vector3(-26, .22, -56), progress: 0, captured: false },
      { id: 'outpost-rail', nameZh: '西区编组站前哨', pos: new Vector3(-158, .22, 12), progress: 0, captured: false },
      { id: 'outpost-south', nameZh: '南港防潮闸前哨', pos: new Vector3(-26, .22, 88), progress: 0, captured: false },
    ].map(op => {
      const ringMat = new MeshBasicMaterial({ color: 0xf0b94e, transparent: true, opacity: .45, side: THREE.DoubleSide, depthWrite: false });
      const ring = new Mesh(new THREE.RingGeometry(5.2, 6.2, 32), ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(op.pos.x, op.pos.y + .06, op.pos.z);
      ring.visible = false;
      root.add(ring);
      return { ...op, ring, ringMat };
    });

    function callSupport(kind) {
      if (freeRoam || !cityCampaignActive || isMultiplayer() || mapOpen) return;
      if (world.game?.state !== 'playing') return;
      const pPos = world.player?.pos;
      if (!pPos) return;
      if (kind === 'supply') {
        if (supportState.supplyCd > 0) return;
        if (supportPoints < 2) { world.tactical?.notify?.('⚠️ 支援点不足（需要 2 点）[Z] 战术空投补给', '⚠️ Need 2 Support Points', false, 2.0); return; }
        supportPoints -= 2;
        supportState.supplyCd = 10;
        (world.weapon?.refill || world.weapon?.reset)?.call(world.weapon);
        world.player?.heal?.(45);
        fx?.smoke?.(pPos, { size: 3.0, life: 3.5, color: 0x3ec486, alpha: .55, rise: 1.2, count: 6 });
        fx?.sparks?.(pPos, up, 22);
        audio?.play?.('rail_touchdown', { pos: pPos, ref: 18, gain: .6, jitter: .05 });
        world.tactical?.notify?.('📦 战术空投补给已抵达！弹药已满 +45 生命值', '📦 Supply Drop delivered! Ammo full +45 HP', false, 3.2);
      } else if (kind === 'smoke') {
        if (supportState.smokeCd > 0) return;
        if (supportPoints < 3) { world.tactical?.notify?.('⚠️ 支援点不足（需要 3 点）[K] 烟雾掩护', '⚠️ Need 3 Support Points', false, 2.0); return; }
        supportPoints -= 3;
        supportState.smokeCd = 14;
        world.player?.heal?.(20);
        for (let s = 0; s < 6; s++) {
          const ang = (s / 6) * Math.PI * 2;
          const sp = new Vector3(pPos.x + Math.cos(ang) * 4.5, pPos.y + .4, pPos.z + Math.sin(ang) * 4.5);
          fx?.smoke?.(sp, { size: 5.5, life: 8.5, color: 0xd0dce2, alpha: .75, rise: .45, count: 4 });
        }
        audio?.play?.('rail_touchdown', { pos: pPos, ref: 18, gain: .5, jitter: .08 });
        world.tactical?.notify?.('💨 战术烟雾掩护已展开！(+20 生命值)', '💨 Tactical Smoke Screen deployed! (+20 HP)', false, 3.0);
      } else if (kind === 'artillery') {
        if (supportState.artilleryCd > 0) return;
        if (supportPoints < 5) { world.tactical?.notify?.('⚠️ 支援点不足（需要 5 点）[X] 重炮支援', '⚠️ Need 5 Support Points', false, 2.0); return; }
        supportPoints -= 5;
        supportState.artilleryCd = 18;
        let strikePos = null;
        if (world.camera) {
          world.camera.getWorldPosition(rayOrigin);
          world.camera.getWorldDirection(rayDir);
          const hit = physics?.raycast?.(rayOrigin, rayDir, 150);
          strikePos = hit?.point ? hit.point.clone() : rayOrigin.clone().addScaledVector(rayDir, 45);
        } else {
          strikePos = pPos.clone().add(new Vector3(0, 0, -25));
        }
        world.tactical?.notify?.('💥 重炮支援已锁定目标区域！3 发齐射来袭！', '💥 Artillery Strike inbound!', true, 3.5);
        for (let k = 0; k < 3; k++) {
          setTimeout(() => {
            const imp = new Vector3(strikePos.x + (k - 1) * 4.2, Math.max(.2, strikePos.y), strikePos.z + (k % 2 === 0 ? 2.5 : -2.5));
            fx?.smoke?.(imp, { size: 5.2, life: 5.0, color: 0x26211d, alpha: .78, rise: 1.5, count: 10 });
            fx?.sparks?.(imp, up, 42);
            fx?.debris?.(imp, { count: 16 });
            audio?.play?.('explosion', { pos: imp, ref: 36, gain: .95, jitter: .06 });
            world.player?.addShake?.(.45);
            for (const e of world.enemies?.list ?? []) {
              if (e?.alive && e.pos && e.pos.distanceTo(imp) < 12) {
                e.damage?.(135, imp, up, 'explosion');
              }
            }
            for (const t of shootTargets) {
              if (t.alive && t.stage === stage && t.pos.distanceTo(imp) < 11) hitTarget(t);
            }
          }, k * 420);
        }
      }
    }

    // Real Drone Explosion Splash Damage + Battlefield Support Point Award
    let droneBlastGuard = false;
    world.events?.on?.('enemy:killed', ev => {
      if (cityCampaignActive && !freeRoam) { awardSupport(1); flashHitmarker(true); }
      if (droneBlastGuard) return;
      const enemy = ev?.enemy;
      const type = ev?.type || enemy?.type;
      if (type === 'hound') return;
      const blastPos = ev?.pos || enemy?.pos;
      if (!blastPos) return;
      droneBlastGuard = true;
      try {
        const radius = 6.5;
        fx?.smoke?.(blastPos, { size: 3.6, life: 3.5, color: 0x26201c, alpha: .72, rise: 1.1, count: 8 });
        fx?.sparks?.(blastPos, up, 32);
        fx?.debris?.(blastPos, { count: 14 });
        audio?.play?.('explosion', { pos: blastPos, ref: 24, gain: .88, jitter: .08 });
        if (world.player?.alive && world.player.pos) {
          const pd = world.player.pos.distanceTo(blastPos);
          if (pd < radius) {
            const dmg = Math.round(32 * (1 - pd / radius));
            if (dmg > 2) world.player.damage?.(dmg, blastPos);
            world.player.addShake?.(Math.max(.18, (1 - pd / radius) * .55));
          }
        }
        for (const other of world.enemies?.list ?? []) {
          if (!other?.alive || other === enemy || !other.pos) continue;
          const ed = other.pos.distanceTo(blastPos);
          if (ed < radius) {
            const dmg = Math.round(65 * (1 - ed / radius));
            if (dmg > 4) other.damage?.(dmg, blastPos, up, 'explosion');
          }
        }
      } finally { droneBlastGuard = false; }
    });

    // Live GTA / 异环-Style Corner Minimap (Strict x <= +26 Coastline, hidden on Main Menu!)
    const minimap = document.createElement('div');
    minimap.className = 'sl-minimap sl-menu-hidden';
    minimap.title = '点击或按 [M] 打开全城战术大地图';
    minimap.innerHTML = `
      <div class="sl-minimap-head"><span>地图</span><span>[M]</span></div>
      <svg viewBox="-236 -236 300 396" preserveAspectRatio="xMidYMid meet">
        <rect x="26" y="-236" width="60" height="396" fill="#072233"/>
        <line x1="26" y1="-236" x2="26" y2="160" stroke="#5ccbe0" stroke-width="2.5"/>
        <g stroke="#d4aa4c" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.85">
          <line x1="-26" y1="-140" x2="-26" y2="140"/><line x1="-112" y1="-140" x2="-112" y2="132"/>
          <line x1="-170" y1="-125" x2="20" y2="-125"/><line x1="-206" y1="5" x2="-26" y2="5"/>
          <line x1="-166" y1="42" x2="18" y2="42"/><line x1="-112" y1="-78" x2="-174" y2="-78"/>
        </g>
        <g data-mm-zones></g>
        <line data-mm-route x1="0" y1="0" x2="0" y2="0" stroke="#58e8ff" stroke-width="4" stroke-dasharray="7 5" style="display:none"/>
        <circle data-mm-target cx="0" cy="0" r="9" fill="none" stroke="#ffd859" stroke-width="3.5" style="display:none"/>
        <g data-mm-player transform="translate(-26,-24)">
          <polygon points="0,-13 8,10 0,5 -8,10" fill="#58e8ff" stroke="#ffffff" stroke-width="2"/>
        </g>
      </svg>
    `;
    minimap.addEventListener('click', () => toggleMap(true));
    document.body.appendChild(minimap);
    const mmZonesG = minimap.querySelector('[data-mm-zones]');
    for (const d of districts) {
      const [rx, rz, rw, rh] = d.rect;
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', rx); rect.setAttribute('y', rz); rect.setAttribute('width', rw); rect.setAttribute('height', rh);
      rect.setAttribute('rx', 6); rect.setAttribute('fill', d.color); rect.setAttribute('fill-opacity', '0.36');
      rect.setAttribute('stroke', 'rgba(255,255,255,0.32)'); rect.setAttribute('stroke-width', '2');
      mmZonesG.appendChild(rect);
    }
    const mmPlayerG = minimap.querySelector('[data-mm-player]');
    const mmRouteL = minimap.querySelector('[data-mm-route]');
    const mmTargetC = minimap.querySelector('[data-mm-target]');

    if (freeRoam) setFreeRoam(true, false);

    let hudTimer = 0, aliveClock = 0;

    function syncColliders(sec, enable) {
      if (!physics?.addBox || !physics?.removeBox) return;
      if (enable && !sec.activeColliders.length) {
        for (const c of sec.colliderSpecs) sec.activeColliders.push(physics.addBox(c.min, c.max, { surface: c.surface }));
      } else if (!enable && sec.activeColliders.length) {
        for (const b of sec.activeColliders.splice(0)) physics.removeBox(b);
      }
    }

    // Spatially-chunked InstancedMesh batching for static addBox/addCyl/sedan meshes (cuts draw calls while preserving frustum culling & UVs)
    function batchStaticGroup(container, cellSize = 64) {
      if (!container || typeof THREE.InstancedMesh !== 'function' || typeof THREE.Matrix4 !== 'function') return;
      container.updateMatrixWorld(true);
      const invContainer = new THREE.Matrix4().copy(container.matrixWorld).invert();
      const geoIds = new WeakMap();
      const matIds = new WeakMap();
      let nextGeoId = 1, nextMatId = 1;
      const buckets = new Map();
      const collect = node => {
        if (!node || node.userData?.noBatch === true) return;
        if (node.isMesh && node.userData?.staticBatchable === true && node.geometry && node.material && !Array.isArray(node.material)) {
          let gId = geoIds.get(node.geometry);
          if (!gId) { gId = nextGeoId++; geoIds.set(node.geometry, gId); }
          let mId = matIds.get(node.material);
          if (!mId) { mId = nextMatId++; matIds.set(node.material, mId); }
          const localMat = new THREE.Matrix4().multiplyMatrices(invContainer, node.matrixWorld);
          const cx = Math.floor(localMat.elements[12] / cellSize);
          const cz = Math.floor(localMat.elements[14] / cellSize);
          const key = `${gId}|${mId}|${node.castShadow ? 1 : 0}|${node.receiveShadow ? 1 : 0}|${cx}|${cz}`;
          let b = buckets.get(key);
          if (!b) {
            b = { geo: node.geometry, mat: node.material, castShadow: !!node.castShadow, receiveShadow: !!node.receiveShadow, items: [] };
            buckets.set(key, b);
          }
          b.items.push({ mesh: node, matrix: localMat });
          return;
        }
        const children = node.children;
        if (children && children.length) {
          for (let i = 0; i < children.length; i++) collect(children[i]);
        }
      };
      collect(container);
      for (const b of buckets.values()) {
        if (b.items.length < 2) continue;
        const inst = new THREE.InstancedMesh(b.geo, b.mat, b.items.length);
        inst.castShadow = b.castShadow;
        inst.receiveShadow = b.receiveShadow;
        inst.matrixAutoUpdate = false;
        for (let i = 0; i < b.items.length; i++) {
          inst.setMatrixAt(i, b.items[i].matrix);
          const orig = b.items[i].mesh;
          if (orig.parent) orig.parent.remove(orig);
        }
        inst.instanceMatrix.needsUpdate = true;
        inst.updateMatrix();
        inst.computeBoundingSphere?.();
        container.add(inst);
      }
    }
    // Merge remaining single-instance static meshes (e.g. unique-size worldBoxGeo walls/slabs) per material & cell
    function mergeStaticByMaterial(container, cellSize = 128) {
      if (!container || typeof THREE.BufferGeometry !== 'function' || typeof THREE.Float32BufferAttribute !== 'function' || typeof THREE.Matrix3 !== 'function') return;
      container.updateMatrixWorld(true);
      const invContainer = new THREE.Matrix4().copy(container.matrixWorld).invert();
      const matIds = new WeakMap();
      let nextMatId = 1;
      const groups = new Map();
      const collect = node => {
        if (!node || node.userData?.noBatch === true || node.isInstancedMesh) return;
        if (node.isMesh && node.userData?.staticBatchable === true && node.geometry && node.material && !Array.isArray(node.material)) {
          const g = node.geometry;
          const posAttr = g.attributes?.position;
          const normAttr = g.attributes?.normal;
          const uvAttr = g.attributes?.uv;
          if (!posAttr || !normAttr || !uvAttr || g.attributes?.color) return;
          let mId = matIds.get(node.material);
          if (!mId) { mId = nextMatId++; matIds.set(node.material, mId); }
          const localMat = new THREE.Matrix4().multiplyMatrices(invContainer, node.matrixWorld);
          const cx = Math.floor(localMat.elements[12] / cellSize);
          const cz = Math.floor(localMat.elements[14] / cellSize);
          const key = `${mId}|${node.castShadow ? 1 : 0}|${node.receiveShadow ? 1 : 0}|${cx}|${cz}`;
          let entry = groups.get(key);
          if (!entry) {
            entry = { mat: node.material, castShadow: !!node.castShadow, receiveShadow: !!node.receiveShadow, items: [] };
            groups.set(key, entry);
          }
          entry.items.push({ mesh: node, matrix: localMat });
          return;
        }
        const ch = node.children;
        if (ch && ch.length) for (let i = 0; i < ch.length; i++) collect(ch[i]);
      };
      collect(container);
      const vTmp = new Vector3();
      const nTmp = new Vector3();
      const nMat = new THREE.Matrix3();
      for (const grp of groups.values()) {
        if (grp.items.length < 2) continue;
        let totalVerts = 0, totalIdx = 0;
        for (const it of grp.items) {
          const g = it.mesh.geometry;
          totalVerts += g.attributes.position.count;
          totalIdx += g.index ? g.index.count : g.attributes.position.count;
        }
        if (totalVerts === 0 || totalVerts > 115000) continue;
        const positions = new Float32Array(totalVerts * 3);
        const normals = new Float32Array(totalVerts * 3);
        const uvs = new Float32Array(totalVerts * 2);
        const indices = new Uint32Array(totalIdx);
        let vOff = 0, iOff = 0;
        for (const it of grp.items) {
          const g = it.mesh.geometry;
          const pA = g.attributes.position, nA = g.attributes.normal, uA = g.attributes.uv;
          const cnt = pA.count;
          nMat.getNormalMatrix(it.matrix);
          for (let v = 0; v < cnt; v++) {
            vTmp.set(pA.getX(v), pA.getY(v), pA.getZ(v)).applyMatrix4(it.matrix);
            positions[(vOff + v) * 3] = vTmp.x;
            positions[(vOff + v) * 3 + 1] = vTmp.y;
            positions[(vOff + v) * 3 + 2] = vTmp.z;
            nTmp.set(nA.getX(v), nA.getY(v), nA.getZ(v)).applyMatrix3(nMat).normalize();
            normals[(vOff + v) * 3] = nTmp.x;
            normals[(vOff + v) * 3 + 1] = nTmp.y;
            normals[(vOff + v) * 3 + 2] = nTmp.z;
            uvs[(vOff + v) * 2] = uA.getX(v);
            uvs[(vOff + v) * 2 + 1] = uA.getY(v);
          }
          if (g.index) {
            const idxArr = g.index.array;
            for (let k = 0; k < idxArr.length; k++) indices[iOff++] = idxArr[k] + vOff;
          } else {
            for (let k = 0; k < cnt; k++) indices[iOff++] = k + vOff;
          }
          vOff += cnt;
          if (it.mesh.parent) it.mesh.parent.remove(it.mesh);
        }
        const merged = new THREE.BufferGeometry();
        merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        merged.setIndex(new THREE.BufferAttribute(indices, 1));
        merged.computeBoundingSphere();
        customGeos.push(merged);
        const m = new Mesh(merged, grp.mat);
        m.castShadow = grp.castShadow;
        m.receiveShadow = grp.receiveShadow;
        m.matrixAutoUpdate = false;
        m.updateMatrix();
        container.add(m);
      }
    }
    batchStaticGroup(horizonRoot, 220);
    mergeStaticByMaterial(horizonRoot, 220);
    for (const sec of sectors) {
      batchStaticGroup(sec.shell, 160);
      mergeStaticByMaterial(sec.shell, 160);
      batchStaticGroup(sec.detail, 160);
      mergeStaticByMaterial(sec.detail, 160);
    }

    const chunkMgr = WE?.createChunkManager ? WE.createChunkManager({ renderer: world.renderer, sectors: [...sectors, ...parcels], quality: world.quality?.name || world.params?.q || 'high', syncColliders, targetFps: 55, manageResolution: false }) : null;

    const POS_ROADBLOCK_HIT = new Vector3(-26, 0, -76);
    const POS_AIRFIELD_EXFIL = new Vector3(-172, .2, -200);
    let cachedMenuEl = null, cachedDevMenuEl = null;
    let lastMenuHidden = null, lastInteractPrompt = '', interactPromptOn = false, lastObjectiveText = null;

    function currentObjectiveInfo() {
      if (freeRoam || !cityCampaignActive || isMultiplayer() || stage >= OPEN_WORLD_ACTS.length) {
        return currentObjectiveInfo._empty || (currentObjectiveInfo._empty = { pos: null, zh: '', en: '' });
      }
      const sub = typeof subStage === 'number' ? subStage : 0;
      const tuned = typeof satTuned === 'boolean' ? satTuned : false;
      const pct = typeof holdProgress === 'number' ? Math.min(100, Math.round(holdProgress * 100)) : 0;
      if (stage === 0) {
        if (sub === 0) return { pos: currentObjectiveInfo._bb || (currentObjectiveInfo._bb = new Vector3(-20, .5, -18)), zh: '① 追踪四号泊位加密信标，靠近按 [E] 解码黑匣子', en: '1. Locate & decode the Berth 4 black-box ([E])' };
        let next = null, aliveCount = 0;
        for (let i = 0; i < shootTargets.length; i++) { const t = shootTargets[i]; if (t.stage === 0 && t.alive) { if (!next) next = t; aliveCount++; } }
        const done = 2 - aliveCount;
        return { pos: next?.pos, zh: `② 击毁四号泊位防空干扰塔 (${done}/2)`, en: `2. Destroy Berth 4 Jammers (${done}/2)` };
      }
      if (stage === 1) {
        if (sub === 0) return { pos: currentObjectiveInfo._rb || (currentObjectiveInfo._rb = new Vector3(-26, .5, -76)), zh: '① 按 [G]/[F] 驾四驱车沿沿海大道撞穿路障', en: '1. Smash Coastal Blvd roadblock in 4x4 ([G]/[F])' };
        return { pos: currentObjectiveInfo._pr || (currentObjectiveInfo._pr = new Vector3(-10, .5, -56)), zh: `② 坚守沿海警务调度楼镜像船员档案 (${pct}%)`, en: `2. Hold Coastal Precinct to mirror logs (${pct}%)` };
      }
      if (stage === 2) {
        if (sub === 0) {
          let next = null, aliveCount = 0;
          for (let i = 0; i < shootTargets.length; i++) { const t = shootTargets[i]; if (t.stage === 2 && t.alive) { if (!next) next = t; aliveCount++; } }
          const done = 2 - aliveCount;
          return { pos: next?.pos, zh: `① 攻入西南冷雾库击毁外部锁控箱 (${done}/2)`, en: `1. Break SW Cryo-Locks (${done}/2)` };
        }
        return { pos: currentObjectiveInfo._cl || (currentObjectiveInfo._cl = new Vector3(-158, .5, 96)), zh: '② 前往西南战地诊所按 [E] 修复托马斯录音芯片', en: '2. Repair Thomas’s recorder at SW Clinic ([E])' };
      }
      if (stage === 3) {
        if (sub === 0) {
          let next = null, aliveCount = 0;
          for (let i = 0; i < shootTargets.length; i++) { const t = shootTargets[i]; if (t.stage === 3 && t.alive) { if (!next) next = t; aliveCount++; } }
          const done = 2 - aliveCount;
          return { pos: next?.pos, zh: `① 炸毁西区铁路两处信号主控闸迫停专列 (${done}/2)`, en: `1. Blow West Rail Breakers (${done}/2)` };
        }
        return { pos: currentObjectiveInfo._tr || (currentObjectiveInfo._tr = new Vector3(-164, .5, 4)), zh: `② 靠近停驶货运专列扫描 17 人原始货单 (${pct}%)`, en: `2. Scan manifest train cars (${pct}%)` };
      }
      if (stage === 4) {
        if (sub === 0) {
          let next = null, aliveCount = 0;
          for (let i = 0; i < shootTargets.length; i++) { const t = shootTargets[i]; if (t.stage === 4 && t.alive) { if (!next) next = t; aliveCount++; } }
          const done = 3 - aliveCount;
          return { pos: next?.pos, zh: `① 登 +14m 西岸山顶狙击卫星散热芯 (${done}/3)`, en: `1. Snipe Mountain Cores (${done}/3)` };
        }
        if (!tuned) return { pos: currentObjectiveInfo._sm || (currentObjectiveInfo._sm = new Vector3(-174, 14.5, -78)), zh: '② 前往山顶雷达主控台按 [E] 校准卫星公频', en: '2. Tune satellite broadcast dish ([E])' };
        return { pos: currentObjectiveInfo._sm || (currentObjectiveInfo._sm = new Vector3(-174, 14.5, -78)), zh: `③ 守住山顶雷达链路广播《失联名单》 (${pct}%)`, en: `3. Hold satellite uplink broadcast (${pct}%)` };
      }
      if (stage === 5) return { pos: currentObjectiveInfo._sm || (currentObjectiveInfo._sm = new Vector3(-174, 14.5, -78)), zh: `12米东海海啸袭港！死守山顶高地 (${Math.ceil(tsunamiSurviveClock)}s)`, en: `Hold mountain summit during tsunami (${Math.ceil(tsunamiSurviveClock)}s)` };
      if (stage === 6) {
        if (sub === 0) {
          let next = null, aliveCount = 0;
          for (let i = 0; i < shootTargets.length; i++) { const t = shootTargets[i]; if (t.stage === 6 && t.alive) { if (!next) next = t; aliveCount++; } }
          const done = 2 - aliveCount;
          return { pos: next?.pos, zh: `① 清除南港岸角灯塔电源干扰器 (${done}/2)`, en: `1. Destroy Lighthouse Jammers (${done}/2)` };
        }
        return { pos: currentObjectiveInfo._lh || (currentObjectiveInfo._lh = new Vector3(14, .5, 128)), zh: '② 前往 22m 灯塔基座按 [E] 校准光学聚光透镜', en: '2. Calibrate 22m Lighthouse lens ([E])' };
      }
      if (stage === 7) return { pos: currentObjectiveInfo._af || (currentObjectiveInfo._af = new Vector3(-172, .5, -200)), zh: '穿越跑道炮火，冲入西北机场拱形机库夺回黑匣子与燃油舱单', en: 'Race through runway fire to secure the airfield hangar manifest' };
      if (stage === 8) {
        if (sub === 0) {
          let next = null, aliveCount = 0;
          for (let i = 0; i < shootTargets.length; i++) { const t = shootTargets[i]; if (t.stage === 8 && t.alive) { if (!next) next = t; aliveCount++; } }
          const done = 2 - aliveCount;
          return { pos: next?.pos, zh: `① 摧毁南港外海锚地登船干扰器 (${done}/2)`, en: `1. Destroy South Quay Boarding Jammers (${done}/2)` };
        }
        return { pos: POS_ANCHORAGE_EVAC, zh: `② 守住南港锚地舷梯掩护幸存船员登艇 (${pct}%)`, en: `2. Hold South Quay gangway evacuation (${pct}%)` };
      }
      if (stage === 9) {
        if (sub === 0) return { pos: POS_PRECINCT, zh: '① 返回沿海警务 04 号站按 [E] 破译沃德离岸资金总账', en: '1. Return to Precinct 04 & decrypt Ward’s offshore ledger ([E])' };
        return { pos: POS_PRECINCT, zh: `② 击退铁砧反扑并坚守警务上行链路 (${pct}%)`, en: `2. Hold Precinct 04 uplink under counter-raid (${pct}%)` };
      }
      if (stage === 10) {
        if (sub === 0) {
          let next = null, aliveCount = 0;
          for (let i = 0; i < shootTargets.length; i++) { const t = shootTargets[i]; if (t.stage === 10 && t.alive) { if (!next) next = t; aliveCount++; } }
          const done = 2 - aliveCount;
          return { pos: next?.pos, zh: `① 沿北段沿海大道摧毁铁砧防空导弹发射架 (${done}/2)`, en: `1. Destroy North Blvd SAM Pods (${done}/2)` };
        }
        return { pos: POS_HIGHWAY_CONVOY, zh: '② 护送搜救车队冲抵西北机场跑道入口', en: '2. Escort rescue convoy to Airfield Approach' };
      }
      if (stage === 11) return { pos: currentObjectiveInfo._af || (currentObjectiveInfo._af = new Vector3(-172, .5, -200)), zh: '晴空黎明：前往西北机场拱形机库登上救援运输机', en: 'Dawn over Saltline: board the SAR transport at the airfield hangar' };
      return currentObjectiveInfo._empty || (currentObjectiveInfo._empty = { pos: null, zh: '', en: '' });
    }

    function update(dt, playerPos) {
      if (!(dt > 0)) return;
      if (!cachedMenuEl || !cachedMenuEl.isConnected) cachedMenuEl = document.querySelector('.menu');
      if (!cachedDevMenuEl || !cachedDevMenuEl.isConnected) cachedDevMenuEl = document.querySelector('.developer-menu');
      const menuOpen = Boolean((cachedMenuEl && cachedMenuEl.classList.contains('open')) || (cachedDevMenuEl && cachedDevMenuEl.hasAttribute('open')));
      const inGame = !menuOpen && !isMultiplayer() && (!world.game || world.game.state === 'playing');
      if (world.backdrop?.skyline?.visible) world.backdrop.skyline.visible = false;
      if (world.backdrop?.lamps?.visible) world.backdrop.lamps.visible = false;
      const hideMinimap = !inGame;
      if (hideMinimap !== lastMenuHidden) {
        lastMenuHidden = hideMinimap;
        minimap.classList.toggle('sl-menu-hidden', hideMinimap);
      }
      if (!inGame) {
        if (interactPromptOn) {
          interactPromptOn = false;
          interactPrompt.classList.remove('on');
        }
        return;
      }
      atmosphereSys?.syncDaylight(lightingSys?.advance(dt));
      if (lightingSys?.setInteriorFactor && playerPos) {
        const inPrecinct = playerPos.x > -13.2 && playerPos.x < 1.5 && playerPos.z > -63.5 && playerPos.z < -47.0 && playerPos.y < 4.2;
        lightingSys.setInteriorFactor(inPrecinct ? 1 : 0);
      }
      aliveClock += dt;
      for (const fn of updaters) fn(dt);
      storyDirector?.update?.(dt);

      syncOpenWorldMissionProps(false);
      if (!introActShown && cityCampaignActive && !freeRoam && aliveClock > 1.2) {
        introActShown = true;
        const played = storyDirector?.playCutscene?.({
          id: 'cine-act0-intro',
          tag: '序幕过场 · 盐线港 05:31',
          title: '《失联名单》',
          subtitle: '四号泊位突发全港停电，「海燕号」17 名船员神秘失踪',
          duration: 5.6,
          camFrom: [16, 15, 22], camTo: [-16, 10, -8], lookAt: [-20, 2.5, -18],
          lines: [
            { at: .2, speaker: '玛拉·陈 · SAR-04', tone: 'ally', line: '凌晨 05:31 全港断电，「海燕号」17 名船员集体失联，港务局长里德却强行封港称全员已离港。' },
            { at: 2.9, speaker: '林恩 · SAR-04', tone: 'ally', line: '老霍克 05:34 的交接条证明他在撒谎。北侧货箱区有加密信标——先去破解它，找出真相！' },
          ],
          onComplete: () => playActBriefing(0),
        });
        if (!played) playActBriefing(0);
      }

      if (chunkMgr) {
        const quality = world.quality?.name || world.params?.q;
        if (quality && quality !== chunkMgr.quality) chunkMgr.setQuality(quality);
        const streamAnchor = playerPos ? playerPos.clone() : null;
        if (streamAnchor && world.vehicle?.isDriving?.() && world.camera) {
          const fwd = new Vector3();
          world.camera.getWorldDirection(fwd);
          fwd.y = 0;
          if (fwd.lengthSq() > 0.01) {
            fwd.normalize();
            streamAnchor.addScaledVector(fwd, 72);
          }
        }
        chunkMgr.update(dt, streamAnchor || playerPos);
      } else {
        for (const sec of sectors) {
          const dist = playerPos ? playerPos.distanceTo(sec.center) : 999;
          const wantShell = dist <= sec.streamRadius;
          const wantDetail = dist <= sec.detailRadius;
          if (sec.loaded !== wantShell) {
            sec.loaded = wantShell;
            sec.shell.visible = wantShell;
            syncColliders(sec, wantShell);
          }
          if (sec.detailed !== wantDetail) {
            sec.detailed = wantDetail;
            sec.detail.visible = wantDetail;
          }
        }
      }

      // Check proximity to Interactive Doors, Medical Stations, Armory & Evidence Consoles ([E])
      activeInteractable = null;
      if (playerPos && !mapOpen && !photoMode) {
        let bestDSq = Infinity;
        for (let i = 0; i < interactables.length; i++) {
          const it = interactables[i];
          const dSq = playerPos.distanceToSquared(it.pos);
          if (dSq <= it.radius * it.radius && dSq < bestDSq) { bestDSq = dSq; activeInteractable = it; }
        }
      }
      const pText = activeInteractable ? activeInteractable.getPrompt() : '';
      if (pText) {
        if (pText !== lastInteractPrompt) { lastInteractPrompt = pText; interactPrompt.textContent = pText; }
        if (!interactPromptOn) { interactPromptOn = true; interactPrompt.classList.add('on'); }
      } else if (interactPromptOn) {
        interactPromptOn = false;
        interactPrompt.classList.remove('on');
      }

      if (customGpsTarget && playerPos && playerPos.distanceToSquared(customGpsTarget) < 144) {
        customGpsTarget = null;
      }

      if (cityCampaignActive && !freeRoam) {
        supportState.supplyCd = Math.max(0, supportState.supplyCd - dt);
        supportState.artilleryCd = Math.max(0, supportState.artilleryCd - dt);
        supportState.smokeCd = Math.max(0, supportState.smokeCd - dt);
        for (let i = 0; i < outposts.length; i++) {
          const op = outposts[i];
          if (!op.captured && playerPos && playerPos.distanceToSquared(op.pos) < 169) {
            op.progress = Math.min(100, op.progress + dt * 30);
            if (op.progress >= 100) {
              op.captured = true;
              op.ringMat.color.setHex(0x42d982);
              awardSupport(3);
              (world.weapon?.refill || world.weapon?.reset)?.call(world.weapon);
              world.player?.heal?.(40);
              audio?.play?.('rail_touchdown', { pos: op.pos, ref: 24, gain: .65, jitter: .04 });
              world.tactical?.notify?.(`🚩 已占领「${op.nameZh}」！+3 支援点 · 弹药已补满`, `🚩 Captured ${op.id}! +3 Support Pts`, false, 4.2);
            }
          }
        }
        if (stage === 1 && !act2ChaseTriggered && playerPos && playerPos.z < -48) {
          act2ChaseTriggered = true;
          world.disasters?.triggerSkyBattlePass?.({
            from: new Vector3(-26, 26, 8), to: new Vector3(-26, 20, -148),
            strafeTarget: new Vector3(-26, .6, -76), count: 2,
          });
          if (!world.developer?.flags?.noEnemies && typeof world.enemies?.spawn === 'function') {
            try {
              world.enemies.spawn('gull', new Vector3(-36, 13, -58), { state: 'alert', target: playerPos });
              world.enemies.spawn('gull', new Vector3(-16, 14, -62), { state: 'alert', target: playerPos });
            } catch {}
          }
          world.tactical?.notify?.('✈️ 敌方拦截机低空掠过沿海大道！追击无人机已锁定四驱车！', '✈️ Hostile jets overhead! Pursuit drones inbound!', true, 4.5);
        }
        if (stage === 0 && subStage === 0 && playerPos) {
          const dist = playerPos.distanceTo(POS_BLACKBOX);
          const strength = Math.max(0.08, Math.min(1, 1 - dist / 55));
          storyDirector?.setTracker?.({
            active: true,
            label: '📡 加密信标测向',
            value: dist <= 4.5 ? '已锁定 · 按 [E]' : `${Math.round(dist)}m`,
            detail: dist <= 4.5 ? '目标黑匣子就在身旁，按 [E] 启动频谱解码仪' : '跟随信号强度增强方向搜索四号泊位北侧货箱区',
            progress: strength,
            accent: dist <= 4.5 ? 'green' : 'amber',
          });
        } else if (stage === 1 && subStage === 0 && playerPos && playerPos.distanceToSquared(POS_ROADBLOCK_HIT) < 56.25) {
          for (const rb of roadblockProps) { rb.intact = false; rb.mesh.visible = false; }
          const hitPos = new Vector3(-26, 1.0, -76);
          world.disasters?.triggerHighwayAmbush?.(hitPos);
          subStage = 1;
          holdProgress = 0;
          world.tactical?.notify?.('💥 路障已撞穿！立刻前往东侧警务调度楼（-10, -56）坚守 14 秒镜像下载档案！', '💥 Roadblock breached! Hold Coastal Precinct for 14s to mirror logs!', true, 5.0);
        } else if (stage === 1 && subStage === 1 && playerPos) {
          const dSq = playerPos.distanceToSquared(POS_PRECINCT);
          const inside = dSq <= 100;
          if (inside) {
            holdProgress = Math.min(1, holdProgress + dt / 14);
            if (!precinctWaveSpawned && holdProgress >= 0.42) {
              precinctWaveSpawned = true;
              if (!world.developer?.flags?.noEnemies && typeof world.enemies?.spawn === 'function') {
                try {
                  world.enemies.spawn('gull', new Vector3(-20, 12, -48), { state: 'alert', target: playerPos });
                  world.enemies.spawn('hound', new Vector3(-24, 0, -58), { state: 'alert', target: playerPos });
                } catch {}
              }
              world.tactical?.notify?.('⚠️ 铁砧反侦察无人机正在逼近调度楼！守住信号圈！', '⚠️ Anvil drones closing on precinct! Hold the zone!', true, 3.8);
            }
          }
          storyDirector?.setTracker?.({
            active: true,
            label: '💾 警务档案镜像下载',
            value: `${Math.round(holdProgress * 100)}%`,
            detail: inside ? '正在高速拷取船员体检与冷链转运单，保持在信号圈内！' : '请靠近沿海警务调度楼（-10, -56）恢复镜像下载',
            progress: holdProgress,
            accent: inside ? 'green' : 'amber',
          });
          if (holdProgress >= 1) {
            storyDirector?.setTracker?.({ active: false });
            world.tactical?.notify?.('✅ 警务档案镜像完成！发现托马斯的冷链运单指向西南冷雾库！', '✅ Logs mirrored! Manifest points to SW Cryo Depot!', true, 4.8);
            advanceToStage(2);
          }
        } else if (stage === 3 && subStage === 1 && playerPos) {
          const dSq = playerPos.distanceToSquared(POS_TRAIN_SCAN);
          const inside = dSq <= 144;
          if (inside) holdProgress = Math.min(1, holdProgress + dt / 12);
          storyDirector?.setTracker?.({
            active: true,
            label: '🚂 货运专列货单扫描',
            value: `${Math.round(holdProgress * 100)}%`,
            detail: inside ? '正在扫描车厢内 17 名船员的原始签收单，注意警戒周围！' : '请靠近西区停驶的货运专列（-164, 4）继续扫描',
            progress: holdProgress,
            accent: inside ? 'green' : 'amber',
          });
          if (holdProgress >= 1) {
            storyDirector?.setTracker?.({ active: false });
            world.tactical?.notify?.('✅ 17 人《失联名单》原始铁证集齐！立刻冲上 +14m 西岸山顶劫持卫星广播！', '✅ Full 17-name manifest secured! Climb to the +14m ridge!', true, 5.0);
            advanceToStage(4);
          }
        } else if (stage === 4 && subStage === 1 && satTuned && playerPos) {
          const dSq = playerPos.distanceToSquared(POS_SAT_CONSOLE);
          const inside = dSq <= 144;
          if (inside) holdProgress = Math.min(1, holdProgress + dt / 10);
          storyDirector?.setTracker?.({
            active: true,
            label: '🛰️ 海事公频广播上行',
            value: `${Math.round(holdProgress * 100)}%`,
            detail: inside ? '正在向东海海事局与全城公频广播铁证，守住雷达站！' : '请回到山顶卫星天线 12m 内维持上行链路！',
            progress: holdProgress,
            accent: inside ? 'green' : 'amber',
          });
          if (holdProgress >= 1) {
            storyDirector?.setTracker?.({ active: false });
            tsunamiSurviveClock = 15.0;
            world.disasters?.triggerTideGateDemolition?.();
            world.disasters?.triggerTsunami?.();
            const played = storyDirector?.playCutscene?.({
              id: 'cine-act5-tsunami',
              tag: '剧情过场 · 零号泄洪',
              title: '12 米东海海啸袭港',
              subtitle: '《失联名单》已向全城公频广播——沃德引爆南防潮闸企图毁灭整座港区',
              duration: 5.5,
              camFrom: [-142, 26, -54], camTo: [-88, 22, 34], lookAt: [-26, 5, 96], lookAtEnd: [26, 6, 10],
              lines: [
                { at: .2, speaker: '沃德 · 铁砧指挥官', tone: 'hostile', line: '引爆南防潮闸！让 12 米东海风暴潮把整座盐线港冲个干净！' },
                { at: 2.8, speaker: '玛拉·陈 · SAR-04', tone: 'ally', line: '名单已经发给救援舰队了！林恩，死守 +14m 山顶高地 15 秒，千万别下山！' },
              ],
              onComplete: () => advanceToStage(5),
            });
            if (!played) advanceToStage(5);
          }
        } else if (stage === 5) {
          tsunamiSurviveClock -= dt;
          storyDirector?.setTracker?.({
            active: true,
            label: '🌊 东海海啸高地求生',
            value: `${Math.max(0, Math.ceil(tsunamiSurviveClock))}s`,
            detail: '保持在 +14m 西岸山顶等待洪峰退去并接收救援舰队回电',
            progress: Math.max(0, Math.min(1, 1 - tsunamiSurviveClock / 15)),
            accent: 'amber',
          });
          if (tsunamiSurviveClock <= 0) {
            storyDirector?.setTracker?.({ active: false });
            bridgeBarrageTriggered = false;
            advanceToStage(6);
          }
        } else {
          storyDirector?.setTracker?.({ active: false });
        }

        if (stage === 6 && !bridgeBarrageTriggered && playerPos && playerPos.z > 62) {
          bridgeBarrageTriggered = true;
          world.disasters?.triggerArtilleryBarrage?.();
          world.disasters?.triggerSkyBattlePass?.({
            from: new Vector3(44, 30, 60), to: new Vector3(-68, 22, 142),
            strafeTarget: new Vector3(-12, 1, 118), count: 2,
          });
        }
        if (stage === 7 && playerPos) {
          if (playerPos.z < -130 && playerPos.x < -110) {
            if (!act8RunwayPassTriggered) {
              act8RunwayPassTriggered = true;
              world.disasters?.triggerSkyBattlePass?.({
                from: new Vector3(-92, 24, -172), to: new Vector3(-232, 18, -172),
                strafeTarget: new Vector3(-168, .8, -172), count: 2,
              });
              if (!world.developer?.flags?.noEnemies && typeof world.enemies?.spawn === 'function') {
                try {
                  world.enemies.spawn('gull', new Vector3(-136, 14, -162), { state: 'alert', target: playerPos });
                  world.enemies.spawn('gull', new Vector3(-148, 15, -182), { state: 'alert', target: playerPos });
                } catch {}
              }
            }
            runwayArtilleryClock += dt;
            if (runwayArtilleryClock >= 1.85) {
              runwayArtilleryClock = 0;
              const blast = new Vector3(playerPos.x - 16, 1.0, -172 + (Math.random() - .5) * 24);
              world.disasters?.spawnFireballExplosion?.(blast, 1.35);
              fx?.smoke?.(blast, { size: 5.4, life: 4.8, color: 0x241f1c, alpha: .75, rise: 1.4, count: 9 });
              fx?.sparks?.(blast, up, 36);
              audio?.play?.('explosion', { pos: blast, ref: 38, gain: .92, jitter: .08 });
              world.player?.addShake?.(.46);
            }
          }
          if (playerPos.distanceToSquared(POS_AIRFIELD_EXFIL) < 156.25) {
            world.tactical?.notify?.('📦 已回收机场黑匣子与燃油舱单！南港外海锚地传来船员求救信号！', '📦 Airfield blackbox secured! Distress call from South Quay!', true, 5.2);
            advanceToStage(8);
          }
        } else if (stage === 8 && subStage === 1) {
          if (playerPos.distanceToSquared(POS_ANCHORAGE_EVAC) < 144) {
            holdProgress = Math.min(1, holdProgress + dt / 10);
            if (holdProgress >= 1) {
              world.tactical?.notify?.('🚤 外海锚地幸存船员已全部登艇撤离！铁砧残部正反扑警务 04 号站！', '🚤 South Quay survivors evacuated! Defend Precinct 04!', true, 5.0);
              advanceToStage(9);
            }
          }
        } else if (stage === 9 && subStage === 1) {
          if (playerPos.distanceToSquared(POS_PRECINCT) < 144) {
            holdProgress = Math.min(1, holdProgress + dt / 10);
            if (holdProgress >= 1) {
              world.tactical?.notify?.('📡 沃德离岸资金总账已上传海事检察院！北上清除海岸公路防空架！', '📡 Offshore ledger uploaded! Clear North Blvd SAM pods!', true, 5.0);
              advanceToStage(10);
            }
          }
        } else if (stage === 10 && subStage === 1) {
          if (playerPos.distanceToSquared(POS_HIGHWAY_CONVOY) < 225) {
            world.tactical?.notify?.('🌅 搜救车队已安全抵近西北机场！风暴云层散去，前往机库登机！', '🌅 Convoy reached Airfield! Storm clearing — board at the hangar!', true, 5.2);
            advanceToStage(11);
          }
        } else if (stage === 11) {
          if (playerPos.distanceToSquared(POS_AIRFIELD_EXFIL) < 156.25) {
            owProgress.completeStage(11);
            stage = OPEN_WORLD_ACTS.length;
            storyDirector?.setTracker?.({ active: false });
            world.hud?.setObjective?.('');
            world.hud?.showChapter?.('');
            world.hud?.setMarkers?.([]);
            world.hud?.clearRadio?.();
            finaleSpinActive = true;
            world.disasters?.stopAllEvents?.();
            world.disasters?.triggerVictoryFlareBarrage?.(new Vector3(-168, 2.5, -184));
            const epilogue = window.SALTLINE_CAMPAIGN_STATE?.getEpilogueSummary?.();
            const copyEl = finaleCard.querySelector('.sl-finale-copy');
            if (copyEl && epilogue) {
              copyEl.textContent = `05:31 与 05:34 的伪造时间差、05:50 搜救艇召回令，以及第 17 名失联者托马斯·万斯的原始水文档案已随沃德离岸总账全部回传海事局。${epilogue.branchNote}（共收集线索 ${epilogue.clues}/3，外海锚地与冷库幸存者均已安全获救）。`;
            }
            const openFinale = () => {
              finaleCard.classList.add('open');
              try { document.exitPointerLock?.(); } catch {}
            };
            const played = storyDirector?.playCutscene?.({
              id: 'cine-act12-finale',
              tag: '第十二幕终章过场 · 真相昭雪',
              title: '盐线港重归黎明',
              subtitle: '救援运输机沿跑道腾空而起，十七个名字重见天日',
              duration: 6.2,
              camFrom: [-144, 6, -166], camTo: [-128, 20, -142], lookAt: [-172, 4, -184], lookAtEnd: [-192, 16, -184],
              lines: [
                { at: .3, speaker: '玛拉·陈 · SAR-04', tone: 'ally', line: '我们做到了，林恩！运输机螺旋桨已经起转，十七个人的名字一个都不会被抹掉！' },
                { at: 3.1, speaker: '东海救援舰队', tone: 'rescue', line: '全港区已由救援舰队接管，里德与沃德的通缉令已下达。欢迎归队，SAR-04。' },
              ],
              onComplete: openFinale,
            });
            if (!played) {
              playStorySequence([
                { at: .2, speaker: 'MARA CHEN · SAR-04', tone: 'ally', line: '我们做到了，林恩！运输机螺旋桨已经起转，十七个人的名字一个都不会被抹掉！' },
                { at: 4.4, speaker: 'MARITIME RESCUE FLEET · 东海救援舰队', tone: 'rescue', line: '全港区已由救援舰队接管，里德与沃德的通缉令已下达。欢迎归队，SAR-04。' },
              ]);
              storyTimers.push(setTimeout(openFinale, 5200));
            }
          }
        }
      }

      const info = currentObjectiveInfo();
      const objText = local(info.en, info.zh);
      if (objText !== lastObjectiveText) {
        lastObjectiveText = objText;
        world.hud?.setObjective?.(objText);
      }
      const beaconTarget = customGpsTarget || info.pos;
      if (!update._navBeacon) {
        const g = new Group();
        g.name = 'ow-destination-beacon';
        const beamMat = new MeshBasicMaterial({ color: 0x58e8ff, transparent: true, opacity: .24, depthWrite: false });
        const beam = new Mesh(new CylinderGeometry(.32, .85, 42, 10, 1, true), beamMat);
        beam.position.y = 21;
        const ringMat = new MeshBasicMaterial({ color: 0xffd859, transparent: true, opacity: .72, side: THREE.DoubleSide, depthWrite: false });
        const ring = new Mesh(new THREE.RingGeometry(1.4, 2.0, 24), ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = .25;
        g.add(beam, ring);
        g.userData = { beamMat, ring };
        g.visible = false;
        root.add(g);
        update._navBeacon = g;
      }
      const navBeacon = update._navBeacon;
      if (beaconTarget && !isMultiplayer()) {
        navBeacon.visible = true;
        navBeacon.position.set(beaconTarget.x, beaconTarget.y || 0, beaconTarget.z);
        const pulse = 1 + Math.sin(performance.now() * .005) * .16;
        navBeacon.userData.ring.scale.set(pulse, pulse, 1);
        navBeacon.userData.beamMat.color.setHex(customGpsTarget ? 0xffd859 : 0x58e8ff);
      } else if (navBeacon.visible) {
        navBeacon.visible = false;
      }
      hudTimer += dt;
      if (hudTimer >= .25) {
        hudTimer = 0;

        if (!isMultiplayer() && typeof world.hud?.setMarkers === 'function') {
          const markers = [];
          if (info.pos && !freeRoam) {
            markers.push({ id: 'ow-mission', short: '★', kind: 'extract', label: '目的地', pos: info.pos });
          }
          if (customGpsTarget) {
            markers.push({ id: 'ow-gps', short: 'GPS', kind: 'relay', label: '导航点', pos: customGpsTarget });
          }
          if (playerPos && typeof interactables !== 'undefined') {
            let bestNpc = null, bestD2 = 42 * 42;
            for (let i = 0; i < interactables.length; i++) {
              const it = interactables[i];
              if (!it.id?.startsWith('npc-talk-')) continue;
              const d2 = playerPos.distanceToSquared(it.pos);
              if (d2 < bestD2 && it.getPrompt?.()) { bestD2 = d2; bestNpc = it; }
            }
            if (bestNpc) {
              markers.push({ id: bestNpc.id, short: '💬', kind: 'relay', label: 'NPC', pos: bestNpc.pos });
            }
          }
          for (let i = 0; i < squadAllies.length; i++) {
            const ally = squadAllies[i];
            if (ally?.pos) markers.push({ id: 'ow-ally-' + i, short: i === 0 ? '玛' : '凯', kind: 'relay', label: ally.displayName || ally.name, pos: ally.pos });
          }
          world.hud.setMarkers(markers);
        }

        if (playerPos) {
          const deg = -((world.player?.yaw ?? 0) * 180 / Math.PI);
          mmPlayerG.setAttribute('transform', `translate(${playerPos.x.toFixed(1)},${playerPos.z.toFixed(1)}) rotate(${deg.toFixed(0)})`);
          if (beaconTarget) {
            mmRouteL.style.display = '';
            mmRouteL.setAttribute('x1', playerPos.x.toFixed(1)); mmRouteL.setAttribute('y1', playerPos.z.toFixed(1));
            mmRouteL.setAttribute('x2', beaconTarget.x.toFixed(1)); mmRouteL.setAttribute('y2', beaconTarget.z.toFixed(1));
            mmTargetC.style.display = '';
            mmTargetC.setAttribute('cx', beaconTarget.x.toFixed(1)); mmTargetC.setAttribute('cy', beaconTarget.z.toFixed(1));
          } else {
            mmRouteL.style.display = 'none';
            mmTargetC.style.display = 'none';
          }
        }

      }
    }

    function dispose() {
      window.removeEventListener('keydown', onKeyDown, true);
      for (const ally of squadAllies.splice(0)) ally.dispose?.();
      storyDirector?.dispose?.();
      if (window.SALTLINE_INSPECT_VIEW === jumpInspectView) {
        delete window.SALTLINE_INSPECT_VIEW;
        delete window.SALTLINE_INSPECT_VIEWS;
        delete window.SALTLINE_GET_STATS;
      }
      for (const it of interactables) it.cleanup?.();
      for (const sec of sectors) syncColliders(sec, false);
      for (const parcel of parcels) syncColliders(parcel, false);
      for (const b of permanentColliders.splice(0)) physics?.removeBox?.(b);
      parkedAircraft.dispose();
      crown.dispose();
      rubber.dispose();
      shadowMap.dispose();
      shadow.material.dispose();
      cliff.dispose();
      rockFace.dispose();
      dishMetal.dispose();
      bowl.geometry.dispose();
      for (const g of customGeos) g.dispose?.();
      externalAssets?.dispose?.();
      industrialGen?.dispose?.();
      atmosphereSys?.dispose?.();
      chunkMgr?.dispose?.();
      buildingGen?.dispose?.();
      if (physics.terrainHeight === terrainGen.floorAt) { delete physics.terrainHeight; delete physics.terrainRay; }
      for (const mesh of coarseTiles) mesh.geometry.dispose();
      terrainSurface.dispose();
      hillsideSurface.dispose();
      terrainGen?.dispose?.();
      lightingSys?.dispose?.();
      matLib?.dispose?.();
      lobbyGlass.dispose();
      smokedPane.dispose();
      blindPane.dispose();
      root.traverse(node => { if (node.isInstancedMesh) node.dispose(); });
      for (const geo of worldBoxCache.values()) geo.dispose();
      clearStoryTimers();
      if (hitmarkerTimer) clearTimeout(hitmarkerTimer);
      root.removeFromParent();
      minimap.remove();
      finaleCard.remove();
      codHitmarker.remove();
      photoPill.remove();
      if (legacySkyline) legacySkyline.visible = true;
      if (legacyLamps) legacyLamps.visible = true;
      interactPrompt.remove();
      mapOverlay.remove();
      const uiRoot = document.getElementById('ui');
      if (uiRoot) uiRoot.style.opacity = '1';
    }

    return {
      update, dispose, toggleMap, jumpToStage, startFromLanding, restartCurrentStage, setFreeRoam, setPhotoMode,
      teleportToSafeStart, resetView,
      warmUpSync(anchorPos, maxSteps = 260) {
        const anchor = anchorPos || world.player?.pos || stageStarts[0].pos;
        return chunkMgr?.warmUpSync?.(anchor, maxSteps) ?? { built: 0, total: 0, loadedCount: 0 };
      },
      warmUpAsync(anchorPos, opts = {}) {
        const anchor = anchorPos || world.player?.pos || stageStarts[0].pos;
        return chunkMgr?.warmUpAsync?.(anchor, opts) ?? Promise.resolve({ built: 0, total: 0, loadedCount: 0 });
      },
      cycleSky() { return applySkyPreset(skyIdx + 1); },
      setSkyPreset(idx, instant = false) { return applySkyPreset(idx, instant); },
      stageStarts, interactables, progress: owProgress,
      rainShelters: blocks.filter(b => b.facility || b.enterable).map(b => ({
        min:new Vector3(b.x0+1.5,.16,b.z0+1.5),max:new Vector3(b.x1-1.5,b.enterable?3.8:7.8,b.z1-1.5)
      })),
      get mapOpen() { return mapOpen; },
      get tunerOpen() { return Boolean(storyDirector?.isTunerOpen); },
      get cutsceneActive() { return Boolean(storyDirector?.isPlayingCutscene); },
      get dialogueOpen() { return Boolean(storyDirector?.isDialogueOpen); },
      get journalOpen() { return Boolean(storyDirector?.isJournalOpen); },
      get finaleOpen() { return finaleCard.classList.contains('open'); },
      get freeRoam() { return freeRoam; },
      get activeCampaign() { return cityCampaignActive && !freeRoam && !isMultiplayer(); },
      get stage() { return stage; },
      get currentObjective() { return currentObjectiveInfo(); },
      get currentStageStart() { return stageStarts[Math.min(stage, OPEN_WORLD_ACTS.length - 1)] ?? stageStarts[0]; },
      waypoints: districts.map(d => ({ label: d.nameEn, zh: d.nameZh, pos: d.pos.clone() })),
    };
  };
})();
