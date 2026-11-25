/* Tactical FPS Sandbox: Q-Pulse Scanner, Explosive Fuel Barrels, EMP Fuse Boxes,
 * 12 Campaign Collectibles, Cross-Chapter Choices, Active Overclock Mini-Game,
 * and COD/Battlefield-style Dynamic Set-Piece Events. */
(() => {
  const COLLECTIBLE_KEY = 'saltline.campaign.collectibles.v1';
  const CHOICE_KEY = 'saltline.campaign.choices.v1';

  const COLLECTIBLES = [
    { id: 'c01', chapter: 'prologue', pos: [-2.2, 0, -3.5], title: ['Ward’s Encrypted Memo', '01 · 沃德的加密备忘录'],
      note: ['05:37 blackout was logged 9 minutes before the official alert.', '凌晨 05:37 断讯比官方上报早了整整九分钟。'] },
    { id: 'c02', chapter: 'berth', pos: [-4.8, .03, -21.5], title: ['Warehouse 1 Night Roster', '02 · 1 号货仓夜班点名表'],
      note: ['Seventeen helmets checked out; zero returned to the rack.', '十七顶安全帽登记领出，无一归还货架。'] },
    { id: 'c03', chapter: 'berth', pos: [12.4, 2.59, 12.4], title: ['Catwalk Spotter Log', '03 · 高架猫道瞭望日志'],
      note: ['Tug engine heard departing Berth 4 with running lights killed.', '目击拖轮熄灭航行灯驶离四号泊位。'] },
    { id: 'c04', chapter: 'berth', pos: [-63.2, 0, 17.5], title: ['West Yard Lockdown Order', '04 · 西区设备棚封锁令'],
      note: ['Anvil contractors ordered the west gate sealed at 05:35.', '铁砧承包商于 05:35 下令封锁西区大门。'] },
    { id: 'c05', chapter: 'rail', pos: [-101.8, 0, 23.2], title: ['Inquiry Flight Manifest', '05 · 独立调查组登机名单'],
      note: ['Harris carried original manifests from the port inspector.', '哈里斯随身携带着港务检查员签发的原始货单。'] },
    { id: 'c06', chapter: 'rail', pos: [-66.5, 0, 14.5], title: ['Interceptor Missile Fin', '06 · 拦截导弹残片编号'],
      note: ['Serial matches Anvil coastal defense battery.', '弹体编号归属铁砧海岸防卫连。'] },
    { id: 'c07', chapter: 'drydock', pos: [-52, 0, 5], title: ['Tug Fuel Drain Receipt', '07 · 拖轮抽油记录单'],
      note: ['Fuel was siphoned to fake a departure while the crew stayed inside.', '燃油被提前抽干以伪造出港假象。'] },
    { id: 'c08', chapter: 'tidegate', pos: [-78, 0, 11], title: ['Tide Gate Crack Inspection', '08 · 防潮闸裂缝巡检单'],
      note: ['Night crew begged to halt traffic at 05:21; Reed overruled.', '夜班 05:21 请求停航，被里德强行驳回。'] },
    { id: 'c09', chapter: 'anchorage', pos: [4, 2.35, 6], title: ['Old Hawk’s Addendum', '09 · 老霍克的撤离回执附页'],
      note: ['Second boat was struck from the roster after Hawk signed.', '老霍克签字后，第二艘接应艇被人为划掉。'] },
    { id: 'c10', chapter: 'return-harbor', pos: [-54, .03, -4], title: ['Ward’s 05:50 Recall Tape', '10 · 沃德 05:50 取消搜救原带'],
      note: ['Ward recalled the first rescue cutter despite unresolved counts.', '人数未核清前，沃德下令召回了首艘搜救艇。'] },
    { id: 'c11', chapter: 'night-record', pos: [-14, 0, 4], title: ['Reed–Anvil NDA', '11 · 里德与铁砧保密协议'],
      note: ['Indemnity clause shifts liability onto night-shift contractors.', '免责条款试图将全部事故责任转嫁给夜班工人。'] },
    { id: 'c12', chapter: 'last-pilot', pos: [-66, 0, 12], title: ['Seventeen Signatures', '12 · 十七名夜班工人联名录'],
      note: ['Every survivor signed the harbor inquiry docket.', '十七名幸存夜班工人在调查卷宗上逐一签名。'] },
  ];

  const PROP_LAYOUTS = {
    berth: [
      { type: 'barrel', pos: [-5.5, .03, -17.5] },
      { type: 'barrel', pos: [3.6, .03, -16.8] },
      { type: 'emp', pos: [-9.2, .03, -14.2] },
      { type: 'barrel', pos: [5.4, 0, 9.6] },
      { type: 'barrel', pos: [12.1, 0, 6.2] },
      { type: 'emp', pos: [17.8, 0, -4.6] },
      { type: 'barrel', pos: [21.6, 0, 1.4] },
      { type: 'barrel', pos: [25.2, 0, 8.8] },
      { type: 'emp', pos: [-58.5, 0, -8.5] },
      { type: 'barrel', pos: [-72.4, 0, -10.8] },
      { type: 'barrel', pos: [-81.5, 0, -14.2] },
    ],
    rail: [
      { type: 'barrel', pos: [-82.5, 0, 7.6] },
      { type: 'barrel', pos: [-72.2, 0, 11.4] },
      { type: 'emp', pos: [-79.8, 0, 14.2] },
      { type: 'barrel', pos: [-66.5, 0, 16.2] },
      { type: 'barrel', pos: [-88.5, 0, 13.4] },
      { type: 'emp', pos: [-58.4, 0, -13.2] },
    ],
    drydock: [
      { type: 'barrel', pos: [-74, .03, 9] },
      { type: 'emp', pos: [-58, .03, 2] },
      { type: 'barrel', pos: [-49, .03, -1] },
    ],
    tidegate: [
      { type: 'barrel', pos: [-74, 0, 11] },
      { type: 'emp', pos: [-58, 0, 6] },
      { type: 'barrel', pos: [-42, 0, 0] },
    ],
    anchorage: [
      { type: 'barrel', pos: [-26, 0, 11] },
      { type: 'emp', pos: [0, 2.35, 3] },
      { type: 'barrel', pos: [14, 2.35, 1] },
    ],
    'return-harbor': [
      { type: 'barrel', pos: [-64, .03, 4] },
      { type: 'emp', pos: [-38, .03, -2] },
      { type: 'barrel', pos: [-14, .03, 7] },
    ],
    'night-record': [
      { type: 'barrel', pos: [-44, 0, 9] },
      { type: 'emp', pos: [-20, 0, 5] },
      { type: 'barrel', pos: [-6, 0, 8] },
    ],
    'last-pilot': [
      { type: 'barrel', pos: [-78, 0, 11] },
      { type: 'emp', pos: [-62, 0, 14] },
      { type: 'barrel', pos: [-38, 0, 16] },
    ],
  };

  function readJson(key, fallback) {
    try { return JSON.parse(window.localStorage?.getItem(key) || 'null') ?? fallback; }
    catch { return fallback; }
  }
  function writeJson(key, value) {
    try { window.localStorage?.setItem(key, JSON.stringify(value)); } catch {}
  }

  function injectStyles() {
    if (document.getElementById('saltline-tactical-style')) return;
    const style = document.createElement('style');
    style.id = 'saltline-tactical-style';
    style.textContent = `
      .sl-tac-hud{position:fixed;left:18px;bottom:20px;z-index:18;display:flex;flex-direction:column;gap:8px;pointer-events:none;font:600 12px/1.35 system-ui,-apple-system,sans-serif;color:#e7f2f4}
      .sl-tac-row{display:flex;gap:8px;align-items:center}
      .sl-tac-pill{background:rgba(12,18,22,.78);border:1px solid rgba(110,220,245,.32);border-radius:6px;padding:6px 10px;backdrop-filter:blur(6px);display:flex;align-items:center;gap:7px;box-shadow:0 4px 14px rgba(0,0,0,.35)}
      .sl-tac-pill.is-ready{border-color:rgba(92,235,210,.7)}
      .sl-tac-pill.is-active{border-color:#58e8ff;background:rgba(16,46,56,.88);box-shadow:0 0 18px rgba(88,232,255,.35)}
      .sl-tac-key{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.28);border-radius:4px;padding:1px 6px;font-size:11px;color:#fff}
      .sl-tac-toast{position:fixed;top:92px;left:50%;transform:translateX(-50%);z-index:22;background:rgba(11,17,22,.9);border:1px solid rgba(100,228,255,.55);border-left:4px solid #58e8ff;color:#eef9fb;padding:10px 18px;border-radius:6px;font:600 13px/1.45 system-ui,-apple-system,sans-serif;max-width:520px;text-align:center;box-shadow:0 8px 26px rgba(0,0,0,.45);transition:opacity .25s ease;pointer-events:none}
      .sl-tac-toast.is-alert{border-color:rgba(255,105,65,.75);border-left-color:#ff5b33;background:rgba(32,12,10,.92)}
      .sl-tac-toast[hidden]{display:none}
      .sl-overclock{position:fixed;left:50%;bottom:136px;transform:translateX(-50%);z-index:21;width:240px;background:rgba(10,16,20,.88);border:1px solid rgba(120,220,255,.45);border-radius:6px;padding:7px 10px;pointer-events:none;color:#e7f6f8;font:600 11px/1.2 system-ui,sans-serif;text-align:center}
      .sl-overclock[hidden]{display:none}
      .sl-oc-track{position:relative;height:10px;background:rgba(255,255,255,.12);border-radius:4px;margin-top:6px;overflow:hidden}
      .sl-oc-zone{position:absolute;top:0;bottom:0;left:40%;width:22%;background:rgba(76,245,168,.55);border-left:2px solid #6cffbe;border-right:2px solid #6cffbe}
      .sl-oc-needle{position:absolute;top:-1px;bottom:-1px;width:4px;background:#fff;box-shadow:0 0 8px #58e8ff;left:0}
      .sl-flash{position:fixed;inset:0;z-index:16;pointer-events:none;background:#fff;opacity:0;transition:opacity .08s linear}
    `;
    document.head.appendChild(style);
  }

  window.createPortTacticalSandbox = (world, { chapterId, isMission = true } = {}) => {
    const { THREE, scene, physics, fx, audio } = world;
    const { Group, Mesh, CylinderGeometry, SphereGeometry, BoxGeometry, TorusGeometry,
      MeshStandardMaterial, MeshBasicMaterial, PointLight, Vector3 } = THREE;
    const local = (en, zh) => window.SaltlineLocale?.t(en, zh) ?? zh;

    injectStyles();
    const root = new Group();
    root.name = 'tactical-sandbox-root';
    scene.add(root);

    // Persistent collectibles & cross-chapter choices
    const collected = new Set(readJson(COLLECTIBLE_KEY, []));
    const choices = readJson(CHOICE_KEY, { drydockWorkersSaved: false, lastPilotWorkersSaved: false });

    // HUD elements
    const hud = document.createElement('div');
    hud.className = 'sl-tac-hud';
    hud.innerHTML = `
      <div class="sl-tac-row">
        <div class="sl-tac-pill is-ready" data-tac-scan><span class="sl-tac-key">Q</span><span data-scan-lbl>战术脉冲扫描 · 就绪</span></div>
        <div class="sl-tac-pill" data-tac-col><span data-col-lbl>失联证物 ${collected.size}/12</span></div>
      </div>`;
    const toast = document.createElement('div');
    toast.className = 'sl-tac-toast';
    toast.hidden = true;
    const ocEl = document.createElement('div');
    ocEl.className = 'sl-overclock';
    ocEl.hidden = true;
    ocEl.innerHTML = `<div><span class="sl-tac-key">SPACE</span> 绿区精准超频（提速解锁）</div><div class="sl-oc-track"><div class="sl-oc-zone"></div><div class="sl-oc-needle"></div></div>`;
    const flashEl = document.createElement('div');
    flashEl.className = 'sl-flash';

    if (isMission) {
      document.body.append(hud, toast, ocEl, flashEl);
    }

    const scanPill = hud.querySelector('[data-tac-scan]');
    const scanLbl = hud.querySelector('[data-scan-lbl]');
    const colLbl = hud.querySelector('[data-col-lbl]');
    const ocNeedle = ocEl.querySelector('.sl-oc-needle');

    let toastTimer = 0;
    function notify(zh, en = zh, alert = false, seconds = 4.5) {
      toast.textContent = local(en, zh);
      toast.classList.toggle('is-alert', !!alert);
      toast.hidden = false;
      toast.style.opacity = '1';
      toastTimer = seconds;
    }

    function flashScreen(color = '#ffffff', opacity = .55) {
      flashEl.style.background = color;
      flashEl.style.opacity = String(opacity);
      setTimeout(() => { flashEl.style.opacity = '0'; }, 90);
    }

    // Build tactical destructible props (Explosive Fuel Drums & EMP Fuse Boxes)
    const props = [];
    const propSpecs = PROP_LAYOUTS[chapterId] ?? [];
    const redMat = new MeshStandardMaterial({ color: 0xb8291e, roughness: .46, metalness: .35 });
    const hoopMat = new MeshStandardMaterial({ color: 0x262a2d, roughness: .55, metalness: .62 });
    const hazardMat = new MeshStandardMaterial({ color: 0xe6b422, roughness: .42, metalness: .18 });
    const empBodyMat = new MeshStandardMaterial({ color: 0x2a353c, roughness: .48, metalness: .64 });
    const empGlowMat = new MeshBasicMaterial({ color: 0x4ae8ff });
    const beaconRingGeo = new TorusGeometry(.52, .03, 8, 24);
    const ringCyanMat = new MeshBasicMaterial({ color: 0x58e8ff, transparent: true, opacity: .88 });
    const ringRedMat = new MeshBasicMaterial({ color: 0xff5a36, transparent: true, opacity: .88 });

    function spawnProp({ type, pos }) {
      const g = new Group();
      g.position.set(pos[0], pos[1], pos[2]);
      const ring = new Mesh(beaconRingGeo, type === 'barrel' ? ringRedMat : ringCyanMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 1.45;
      ring.visible = false;
      g.add(ring);

      if (type === 'barrel') {
        const body = new Mesh(new CylinderGeometry(.32, .32, .94, 18), redMat);
        body.position.y = .47;
        body.castShadow = body.receiveShadow = true;
        g.add(body);
        for (const ry of [.14, .47, .80]) {
          const hoop = new Mesh(new TorusGeometry(.33, .018, 8, 18), hoopMat);
          hoop.rotation.x = Math.PI / 2;
          hoop.position.y = ry;
          g.add(hoop);
        }
        const band = new Mesh(new CylinderGeometry(.326, .326, .16, 18), hazardMat);
        band.position.y = .56;
        g.add(band);
      } else {
        const cab = new Mesh(new BoxGeometry(.58, 1.08, .40), empBodyMat);
        cab.position.y = .54;
        cab.castShadow = cab.receiveShadow = true;
        const coil = new Mesh(new CylinderGeometry(.14, .14, .42, 14), empGlowMat);
        coil.position.set(0, 1.24, 0);
        const panel = new Mesh(new BoxGeometry(.42, .22, .04), empGlowMat);
        panel.position.set(0, .72, .21);
        g.add(cab, coil, panel);
      }
      root.add(g);
      props.push({ type, group: g, ring, pos: g.position.clone(), hp: type === 'barrel' ? 1 : 1, intact: true, pendingDelay: -1 });
    }
    if (isMission) propSpecs.forEach(spawnProp);

    // Build chapter collectibles (12 total across campaign)
    const chapterCollectibles = [];
    const padMat = new MeshStandardMaterial({ color: 0x1e2b33, roughness: .35, metalness: .65 });
    const padScreenMat = new MeshBasicMaterial({ color: 0x5bffd6 });
    if (isMission) {
      for (const spec of COLLECTIBLES) {
        if (spec.chapter !== chapterId || collected.has(spec.id)) continue;
        const g = new Group();
        g.position.set(spec.pos[0], spec.pos[1] + .48, spec.pos[2]);
        const pad = new Mesh(new BoxGeometry(.34, .04, .24), padMat);
        const scr = new Mesh(new BoxGeometry(.28, .045, .18), padScreenMat);
        const halo = new Mesh(new TorusGeometry(.30, .016, 8, 20), ringCyanMat);
        halo.rotation.x = Math.PI / 2;
        g.add(pad, scr, halo);
        root.add(g);
        chapterCollectibles.push({ spec, group: g, halo, baseY: spec.pos[1] + .48, taken: false });
      }
    }

    // Visual effects pools (expanding spheres for Explosion / EMP / Q-Scan)
    const bursts = [];
    function spawnBurst(pos, color, startR, endR, duration, lightPower = 35, wireframe = false) {
      const mat = new MeshBasicMaterial({ color, transparent: true, opacity: .68, wireframe, depthWrite: false });
      const mesh = new Mesh(new SphereGeometry(1, 20, 14), mat);
      mesh.position.copy(pos);
      mesh.scale.setScalar(startR);
      const light = lightPower > 0 ? new PointLight(color, lightPower, endR * 2.2, 1.4) : null;
      if (light) { light.position.copy(pos); light.position.y += 1.2; root.add(light); }
      root.add(mesh);
      bursts.push({ mesh, light, startR, endR, duration, age: 0, lightPower });
    }

    // EMP & Explosion logic
    const empStunned = new Map();
    function triggerEmpBurst(center, radius = 16) {
      spawnBurst(center, 0x4ae8ff, .5, radius * .65, .75, 45, true);
      fx?.sparks?.(center, new Vector3(0, 1, 0), 26);
      audio?.play?.('rail_touchdown', { pos: center, ref: 14, gain: .55, jitter: 0 });
      world.player?.addShake?.(.28);
      let hitCount = 0;
      for (const enemy of world.enemies?.list ?? []) {
        if (!enemy?.alive || !enemy.pos) continue;
        if (enemy.pos.distanceTo(center) <= radius) {
          enemy.damage?.(45, enemy.pos, new Vector3(0, 1, 0), 'emp');
          empStunned.set(enemy, 6.0);
          hitCount++;
        }
      }
      flashScreen('#58e8ff', .24);
      if (hitCount > 0) notify(`⚡ 电磁脉冲生效：瘫痪并重创 ${hitCount} 个敌方单位！`, `EMP burst disrupted ${hitCount} hostile(s)!`);
    }

    function detonateProp(item) {
      if (!item.intact) return;
      item.intact = false;
      item.group.visible = false;
      const c = item.pos.clone();
      c.y += .6;
      if (item.type === 'emp') {
        triggerEmpBurst(c, 16);
        return;
      }
      // Explosive fuel drum!
      spawnBurst(c, 0xff6b22, .6, 5.2, .62, 65, false);
      fx?.smoke?.(c, { size: 3.4, life: 4.0, color: 0x38322c, alpha: .62, rise: .9, count: 9 });
      fx?.sparks?.(c, new Vector3(0, 1.4, 0), 34);
      fx?.debris?.(c, { count: 14 });
      audio?.play?.('rail_touchdown', { pos: c, ref: 24, gain: .95, jitter: .05 });
      const pDist = world.player?.pos ? world.player.pos.distanceTo(c) : 20;
      world.player?.addShake?.(Math.max(.18, .82 * (1 - pDist / 38)));
      flashScreen('#ff8833', Math.max(.08, .42 * (1 - pDist / 32)));
      let kills = 0;
      for (const enemy of world.enemies?.list ?? []) {
        if (!enemy?.alive || !enemy.pos) continue;
        if (enemy.pos.distanceTo(c) <= 9.5) {
          enemy.damage?.(180, enemy.pos, enemy.pos.clone().sub(c).normalize().multiplyScalar(2), 'explosion');
          kills++;
        }
      }
      // Chain reaction on nearby barrels
      for (const other of props) {
        if (other.intact && other !== item && other.pos.distanceTo(item.pos) <= 5.8) {
          other.pendingDelay = .18;
        }
      }
      notify(kills > 0 ? `💥 高爆燃料桶引爆！一举摧毁 ${kills} 个敌方目标！` : '💥 高爆燃料桶引爆！',
        kills > 0 ? `Fuel drum detonated! ${kills} hostile(s) eliminated!` : 'Fuel drum detonated!', true, 3.2);
    }

    // Ray-sphere check on weapon fire so shooting barrels/EMP boxes works natively!
    const rayOrigin = new Vector3(), rayDir = new Vector3(), toTarget = new Vector3();
    function onWeaponFire() {
      if (!isMission || !world.camera) return;
      world.camera.getWorldPosition(rayOrigin);
      world.camera.getWorldDirection(rayDir);
      let best = null, bestDist = 90;
      for (const item of props) {
        if (!item.intact) continue;
        const center = item.pos.clone();
        center.y += .58;
        toTarget.subVectors(center, rayOrigin);
        const proj = toTarget.dot(rayDir);
        if (proj < .5 || proj > bestDist) continue;
        const perpSq = toTarget.lengthSq() - proj * proj;
        if (perpSq <= .72 * .72) {
          if (!physics?.lineOfSight || physics.lineOfSight(rayOrigin, center)) {
            best = item;
            bestDist = proj;
          }
        }
      }
      if (best) detonateProp(best);
    }
    world.events?.on?.('weapon:fire', onWeaponFire);

    // Tactical Pulse Scanner (Q key)
    let scanActive = 0, scanCooldown = 0;
    function triggerScan(free = false) {
      if (!isMission) return false;
      if (!free && scanCooldown > 0) return false;
      scanActive = 7.5;
      if (!free) scanCooldown = 12;
      const origin = world.player?.pos ? world.player.pos.clone() : new Vector3();
      origin.y += 1.1;
      spawnBurst(origin, 0x58e8ff, 1.0, 52, 1.35, 18, true);
      audio?.play?.('rail_log_radio', { pos: origin, ref: 10, gain: .45, jitter: 0 });
      const activeEnemies = (world.enemies?.list ?? []).filter(e => e?.alive).length;
      const intactProps = props.filter(p => p.intact).length;
      const remCols = chapterCollectibles.filter(c => !c.taken).length;
      notify(`📡 战术脉冲扫描：探测到 ${activeEnemies} 名敌方 · ${intactProps} 处可爆物 · ${remCols} 份失联证物`,
        `Tactical Scan: ${activeEnemies} hostiles · ${intactProps} hazards · ${remCols} intel`, false, 4.0);
      return true;
    }

    // Active Overclock Mini-Game state
    let ocPos = 0, ocDir = 1, ocBoost = 0, ocShowing = false;
    function handleKeyDown(e) {
      if (!isMission) return;
      if (document.querySelector('.developer-menu[open]') || document.querySelector('.menu.open')) return;
      if (e.code === 'KeyQ' && !e.repeat) {
        triggerScan(false);
      } else if (e.code === 'Space' && !e.repeat && ocShowing) {
        if (ocPos >= .38 && ocPos <= .64) {
          ocBoost = .45;
          flashScreen('#5bffd6', .18);
          audio?.play?.('rail_log_radio', { gain: .42, jitter: 0 });
          notify('⚡ 完美超频校准！互动效率大幅提升！', 'Perfect overclock! Speed boosted!', false, 2.0);
        } else {
          ocBoost = 0;
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown, { signal: world.chapterSignal });

    // COD / Battlefield Set-Piece Director
    let lastPhase = null;
    const firedEvents = new Set();
    const scheduledBlasts = [];
    let stormClock = 0;

    function queueArtillery(points, headlineZh, headlineEn) {
      notify(headlineZh, headlineEn, true, 5.5);
      points.forEach((p, i) => {
        scheduledBlasts.push({ delay: i * 1.45, pos: new Vector3(p[0], p[1], p[2]) });
      });
    }

    function updateSetPieces(dt, chapterPhase) {
      if (!isMission || !chapterPhase) return;
      if (chapterPhase !== lastPhase) {
        lastPhase = chapterPhase;
        // Chapter 1: Berth 4 Extraction Lockdown Bombardment!
        if (chapterId === 'berth' && chapterPhase === 'extract' && !firedEvents.has('berth-extract')) {
          firedEvents.add('berth-extract');
          queueArtillery([
            [14, .8, 16], [19, .8, 4], [24, .8, 12],
          ], '🚨 港区封锁炮火袭来！油罐区连环爆燃，全速冲向南端接应艇！',
          '🚨 PORT LOCKDOWN BOMBARDMENT! Sprint to the south ladder boat!');
        }
        // Chapter 2: Rail secondary fuel cook-off!
        if (chapterId === 'rail' && chapterPhase === 'rescue' && !firedEvents.has('rail-cookoff')) {
          firedEvents.add('rail-cookoff');
          scheduledBlasts.push({ delay: 5.5, pos: new Vector3(-77, 1.4, .6) });
          notify('🔥 警告：运输机副油箱即将二次殉爆，注意掩体！', '🔥 WARNING: Secondary transport fuel cook-off imminent!', true, 4.5);
        }
        // Chapter 3: Drydock flood surge
        if (chapterId === 'drydock' && chapterPhase === 'flood' && !firedEvents.has('drydock-flood')) {
          firedEvents.add('drydock-flood');
          world.player?.addShake?.(.58);
          flashScreen('#66c8ff', .25);
          notify('🌊 坞门爆裂！海水倒灌，立刻沿高处楼梯撤离并营救维修工！', '🌊 DRYDOCK GATE BREACHED! Climb stairs & rescue the stranded workers!', true, 5.5);
        }
        // Chapter 4: Cross-chapter Mara callback if player saved drydock workers
        if (chapterId === 'tidegate' && chapterPhase === 'reunion' && !firedEvents.has('tidegate-mara')) {
          firedEvents.add('tidegate-mara');
          if (choices.drydockWorkersSaved) {
            notify('📻 玛拉：「你把旧船坞那两个伙计带出来了，林恩。这次我完全信你。」',
              '📻 Mara: "You pulled those workers out of the drydock, Lin. I trust you now."', false, 6.0);
          }
        }
        // Chapter 5: Anchorage crane collapse fireballs
        if (chapterId === 'anchorage' && chapterPhase === 'crane' && !firedEvents.has('anchorage-crane')) {
          firedEvents.add('anchorage-crane');
          queueArtillery([[2, 2.5, 6], [-3, 2.5, 8]],
            '💥 吊臂砸断高压管线！左舷栈道起火，改道护送最后六人登艇！',
            '💥 CRANE RUPTURED HIGH-PRESSURE LINE! Take port catwalk for final 6!');
        }
        // Chapter 8: Ship impact set-piece
        if (chapterId === 'last-pilot' && chapterPhase === 'route' && !firedEvents.has('pilot-ship')) {
          firedEvents.add('pilot-ship');
          queueArtillery([[0, 1.5, 4], [6, 1.5, 8]],
            '🚢 巨轮失控撞断主岸道！快决定走高架引航桥或先救出避险棚工人！',
            '🚢 FREIGHTER SEVERED CAUSEWAY! Take upper bridge or rescue workers!');
        }
        // Chapter 9: Reopen campaign summary toast
        if (chapterId === 'reopen' && !firedEvents.has('reopen-summary')) {
          firedEvents.add('reopen-summary');
          const rescuedStr = choices.drydockWorkersSaved ? '旧船坞维修工已生还' : '主线全员撤离';
          notify(`⚓ 《重新开航》· 失联证物已收集 ${collected.size}/12 · 跨章抉择：${rescuedStr}`,
            `⚓ Open Water · Collectibles ${collected.size}/12 · Choice: ${rescuedStr}`, false, 7.0);
        }
      }

      // Chapter 4 Tidegate periodic lightning storm flashes
      if (chapterId === 'tidegate' && (chapterPhase === 'wind' || chapterPhase === 'barge')) {
        stormClock += dt;
        if (stormClock > 11) {
          stormClock = 0;
          flashScreen('#d8ecff', .48);
          world.player?.addShake?.(.28);
        }
      }

      // Execute scheduled set-piece blasts
      for (let i = scheduledBlasts.length - 1; i >= 0; i--) {
        scheduledBlasts[i].delay -= dt;
        if (scheduledBlasts[i].delay <= 0) {
          const { pos } = scheduledBlasts.splice(i, 1)[0];
          spawnBurst(pos, 0xff5a1f, .9, 6.8, .75, 70, false);
          fx?.smoke?.(pos, { size: 4.5, life: 5.5, color: 0x2c2825, alpha: .65, rise: 1.2, count: 10 });
          fx?.sparks?.(pos, new Vector3(0, 2, 0), 30);
          audio?.play?.('rail_touchdown', { pos, ref: 30, gain: .92, jitter: .06 });
          world.player?.addShake?.(.58);
          flashScreen('#ff7b2a', .26);
        }
      }
    }

    function recordChoice(key, value = true) {
      choices[key] = value;
      writeJson(CHOICE_KEY, choices);
    }

    function update(dt, { player, interact, chapterPhase, promptProgress = 0 } = {}) {
      if (!isMission || !(dt > 0)) return 0;

      // Toast fade
      if (toastTimer > 0) {
        toastTimer -= dt;
        if (toastTimer <= 0) {
          toast.style.opacity = '0';
          setTimeout(() => { if (toastTimer <= 0) toast.hidden = true; }, 260);
        }
      }

      // Scan cooldown & active beacon rings
      if (scanCooldown > 0) scanCooldown = Math.max(0, scanCooldown - dt);
      if (scanActive > 0) scanActive = Math.max(0, scanActive - dt);
      scanPill.classList.toggle('is-active', scanActive > 0);
      scanPill.classList.toggle('is-ready', scanCooldown <= 0 && scanActive <= 0);
      scanLbl.textContent = scanActive > 0
        ? local(`Pulse active ${scanActive.toFixed(1)}s`, `脉冲扫描生效 ${scanActive.toFixed(1)}s`)
        : scanCooldown > 0
          ? local(`Scanner ${Math.ceil(scanCooldown)}s`, `战术扫描冷却 ${Math.ceil(scanCooldown)}s`)
          : local('Tactical Pulse · Ready', '战术脉冲扫描 · 就绪');

      for (const item of props) {
        if (!item.intact) continue;
        item.ring.visible = scanActive > 0;
        if (item.ring.visible) item.ring.rotation.z += dt * 3;
        if (item.pendingDelay >= 0) {
          item.pendingDelay -= dt;
          if (item.pendingDelay <= 0) detonateProp(item);
        }
      }

      // EMP stunned enemy freeze
      for (const [enemy, remaining] of empStunned.entries()) {
        if (!enemy?.alive || remaining <= dt) {
          empStunned.delete(enemy);
        } else {
          empStunned.set(enemy, remaining - dt);
          if (enemy.vel) enemy.vel.multiplyScalar(.2);
        }
      }

      // Collectibles float & pickup
      const now = performance.now() * .001;
      for (const item of chapterCollectibles) {
        if (item.taken) continue;
        item.group.position.y = item.baseY + Math.sin(now * 2.4) * .06;
        item.group.rotation.y += dt * 1.4;
        item.halo.scale.setScalar(scanActive > 0 ? 1.85 : 1.0);
        if (player?.alive && player.pos && player.pos.distanceTo(item.group.position) < 2.35 && interact) {
          item.taken = true;
          item.group.visible = false;
          collected.add(item.spec.id);
          writeJson(COLLECTIBLE_KEY, [...collected]);
          colLbl.textContent = local(`Intel ${collected.size}/12`, `失联证物 ${collected.size}/12`);
          audio?.play?.('rail_log_radio', { gain: .5, jitter: 0 });
          notify(`📂 已收集【${item.spec.title[1]}】— ${item.spec.note[1]}`,
            `📂 Collected [${item.spec.title[0]}] — ${item.spec.note[0]}`, false, 5.5);
        }
      }

      // Expanding visual bursts
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        b.age += dt;
        const t = Math.min(1, b.age / b.duration);
        const r = b.startR + (b.endR - b.startR) * (1 - (1 - t) * (1 - t));
        b.mesh.scale.setScalar(r);
        b.mesh.material.opacity = .65 * (1 - t);
        if (b.light) b.light.intensity = b.lightPower * (1 - t);
        if (t >= 1) {
          root.remove(b.mesh);
          b.mesh.geometry.dispose();
          b.mesh.material.dispose();
          if (b.light) root.remove(b.light);
          bursts.splice(i, 1);
        }
      }

      // Overclock mini-game bar
      ocShowing = promptProgress > .04 && promptProgress < .96;
      ocEl.hidden = !ocShowing;
      if (ocShowing) {
        ocPos += dt * 1.35 * ocDir;
        if (ocPos >= 1) { ocPos = 1; ocDir = -1; }
        else if (ocPos <= 0) { ocPos = 0; ocDir = 1; }
        ocNeedle.style.left = `${(ocPos * 96).toFixed(1)}%`;
      } else {
        ocPos = 0;
        ocDir = 1;
      }

      // Update COD/Battlefield Set-Pieces
      updateSetPieces(dt, chapterPhase);

      const bonus = ocBoost;
      ocBoost = 0;
      return bonus;
    }

    function dispose() {
      root.removeFromParent();
      hud.remove();
      toast.remove();
      ocEl.remove();
      flashEl.remove();
    }

    return {
      update, notify, triggerScan, triggerEmpBurst, recordChoice, dispose,
      get collectedCount() { return collected.size; },
    };
  };
})();
