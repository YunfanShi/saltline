/* IRONFRONT-ported Multiplayer Battlefield Gadgets:
 * - Parabolic Throwable Frag (G) & Smoke (4) Grenades with bounce & 2.4s fuse
 * - Physical 3D Ammo Crates (7m auto-refill, max 2 per player, 180s TTL)
 * - Tactical Deploy Point Selector (HQ, safe Blue objectives, safe squadmates)
 * - Multiplayer SAR 4x4 Vehicle Integration & Q-Menu Vehicle Airdrop */
(() => {
  'use strict';

  const GRENADE_FUSE_S = 2.4;
  const GRENADE_GRAVITY = 18.5;
  const SMOKE_DURATION_S = 16;
  const SMOKE_RADIUS = 6.5;
  const AMMO_BOX_RADIUS = 7.0;
  const AMMO_BOX_TTL_S = 180;
  const AMMO_BOX_MAX = 2;

  function createPortMultiplayerGadgets(world, { getConquest, getSquad, onRemoteEvent } = {}) {
    const { THREE, scene, physics, fx, audio } = world;
    const { Group, Mesh, BoxGeometry, CylinderGeometry, SphereGeometry, MeshStandardMaterial, Vector3 } = THREE;
    const t = (en, zh) => window.SaltlineLocale?.t(en, zh) ?? en;

    const root = new Group();
    root.name = 'port-mp-gadgets';
    scene.add(root);

    const fragMat = new MeshStandardMaterial({ color: 0x3b4a3a, roughness: 0.55, metalness: 0.4 });
    const smokeMat = new MeshStandardMaterial({ color: 0x7c8a91, roughness: 0.5, metalness: 0.45 });
    const crateBodyMat = new MeshStandardMaterial({ color: 0x384b44, roughness: 0.65, metalness: 0.25 });
    const crateTrimMat = new MeshStandardMaterial({ color: 0xe6a639, roughness: 0.45, metalness: 0.35 });
    const grenGeo = new CylinderGeometry(0.055, 0.055, 0.14, 10);
    const boxGeo = new BoxGeometry(0.68, 0.34, 0.46);
    const stripeGeo = new BoxGeometry(0.7, 0.06, 0.48);

    const grenades = [];
    const smokes = [];
    const ammoBoxes = [];
    let fragCount = 2;
    let smokeCount = 2;
    let throwCooldown = 0;
    let active = false;
    let deployCallback = null;
    let mpVehicle = null;
    let vehicleDropCooldown = 0;

    // Compact Gadget HUD badge (Grenades + Ammo Box)
    const hud = document.createElement('div');
    hud.className = 'port-mp-gadgets-hud';
    hud.dataset.noLocalize = '';
    hud.hidden = true;
    hud.style.cssText = 'position:fixed;right:18px;bottom:118px;z-index:20;display:flex;gap:8px;font:600 12px/1.2 system-ui,-apple-system,sans-serif;color:#e8e4da;pointer-events:none;';
    const fragChip = document.createElement('span');
    const smokeChip = document.createElement('span');
    for (const el of [fragChip, smokeChip]) {
      el.style.cssText = 'background:rgba(10,16,22,.82);border:1px solid #586c76;padding:4px 8px;';
    }
    hud.append(fragChip, smokeChip);

    // Tactical Deploy Selector overlay
    const deployDialog = document.createElement('dialog');
    deployDialog.className = 'developer-menu port-mp-deploy';
    deployDialog.dataset.noLocalize = '';
    deployDialog.innerHTML = `
      <header><h2 data-deploy-title></h2></header>
      <p data-deploy-sub></p>
      <div class="developer-actions" data-deploy-list style="display:grid;gap:8px;margin-top:10px;"></div>
    `;
    const appEl = document.getElementById('app');
    if (appEl) appEl.append(hud, deployDialog);

    function renderHud() {
      if (!active) return;
      fragChip.textContent = t(`[G] Frag ×${fragCount}`, `[G] 手雷 ×${fragCount}`);
      smokeChip.textContent = t(`[4] Smoke ×${smokeCount}`, `[4] 烟雾弹 ×${smokeCount}`);
    }

    function resetInventory() {
      fragCount = 2;
      smokeCount = 2;
      renderHud();
    }

    function start(startPos, bevelBox) {
      active = true;
      hud.hidden = false;
      throwCooldown = 0;
      vehicleDropCooldown = 0;
      resetInventory();
      // Spawn a drivable SAR 4x4 at Blue HQ for multiplayer combat (if available)
      if (!mpVehicle && window.createPortDrivableVehicle && startPos) {
        const vehPos = new Vector3(startPos.x + 4.5, startPos.y ?? 0, startPos.z - 4.0);
        if (typeof physics?.groundHeight === 'function') {
          vehPos.y = physics.groundHeight(vehPos.x, vehPos.z, 1.5);
        }
        mpVehicle = window.createPortDrivableVehicle(world, { startPos: vehPos, startYaw: 0, bevelBox });
        world.vehicle = mpVehicle;
      }
    }

    function stop() {
      active = false;
      hud.hidden = true;
      if (deployDialog.open) deployDialog.close();
      for (const g of grenades) root.remove(g.mesh);
      grenades.length = 0;
      smokes.length = 0;
      for (const b of ammoBoxes) root.remove(b.group);
      ammoBoxes.length = 0;
      if (mpVehicle) {
        mpVehicle.dispose?.();
        if (world.vehicle === mpVehicle) world.vehicle = null;
        mpVehicle = null;
      }
    }

    function throwGrenade(kind, origin, direction, fromRemote = false) {
      if (!active) return false;
      if (!fromRemote) {
        if (throwCooldown > 0) return false;
        if (kind === 'frag' && fragCount <= 0) return false;
        if (kind === 'smoke' && smokeCount <= 0) return false;
        if (kind === 'frag') fragCount--;
        else smokeCount--;
        throwCooldown = 0.65;
        renderHud();
        onRemoteEvent?.('grenade', {
          kind,
          origin: [origin.x, origin.y, origin.z],
          dir: [direction.x, direction.y, direction.z],
        });
      }
      const mesh = new Mesh(grenGeo, kind === 'smoke' ? smokeMat : fragMat);
      mesh.position.copy(origin);
      mesh.castShadow = true;
      root.add(mesh);
      const speed = kind === 'smoke' ? 15.5 : 18.0;
      const vel = direction.clone().normalize().multiplyScalar(speed);
      vel.y += 4.2;
      grenades.push({ kind, mesh, pos: origin.clone(), vel, fuse: GRENADE_FUSE_S, fromRemote });
      return true;
    }

    function placeAmmoBox(pos, fromRemote = false) {
      if (!active) return false;
      const conquest = getConquest?.();
      const now = conquest?.elapsed ?? 0;
      const group = new Group();
      const body = new Mesh(boxGeo, crateBodyMat);
      body.position.y = 0.17;
      body.castShadow = true;
      const stripe = new Mesh(stripeGeo, crateTrimMat);
      stripe.position.y = 0.24;
      group.add(body, stripe);
      const y = typeof physics?.groundHeight === 'function' ? physics.groundHeight(pos.x, pos.z, (pos.y ?? 0) + 1) : (pos.y ?? 0);
      group.position.set(pos.x, y, pos.z);
      root.add(group);
      ammoBoxes.push({ group, pos: new Vector3(pos.x, y, pos.z), expiresAt: now + AMMO_BOX_TTL_S, nextTick: now + 0.5 });
      while (ammoBoxes.length > AMMO_BOX_MAX) {
        const old = ammoBoxes.shift();
        root.remove(old.group);
      }
      if (!fromRemote) {
        world.hud?.message?.(t('Ammo crate deployed (7 m auto-refill)', '已放置实体弹药箱（7 米内自动补给）'), 2.4);
        onRemoteEvent?.('ammoBox', { pos: [pos.x, y, pos.z] });
      }
      return true;
    }

    function airdropVehicle(player) {
      if (!active || !player?.pos || vehicleDropCooldown > 0) return false;
      if (!mpVehicle && window.createPortDrivableVehicle) {
        mpVehicle = window.createPortDrivableVehicle(world, { startPos: player.pos.clone(), startYaw: player.yaw ?? 0 });
        world.vehicle = mpVehicle;
      }
      mpVehicle?.summonNear?.(player);
      if (mpVehicle?.pos) {
        fx?.smoke?.(mpVehicle.pos, { size: 4.5, life: 2.5, rise: 0.35, count: 4, alpha: 0.65 });
      }
      vehicleDropCooldown = 45;
      world.hud?.message?.(
        t('SAR 4x4 airdropped nearby! Press [F] to drive', 'SAR 四驱战术车已空投至附近！按 [F] 登车驾驶'),
        3.0
      );
      return true;
    }

    /** Check if any active smoke grenade blocks line of sight between from and to */
    function smokeBlocks(from, to) {
      const conquest = getConquest?.();
      const now = conquest?.elapsed ?? 0;
      for (const s of smokes) {
        if (now >= s.until) continue;
        const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
        const lenSq = dx * dx + dy * dy + dz * dz;
        const h = s.pos.y + 1.4;
        const proj = lenSq ? ((s.pos.x - from.x) * dx + (h - from.y) * dy + (s.pos.z - from.z) * dz) / lenSq : 0;
        const clamped = Math.min(1, Math.max(0, proj));
        const d = Math.hypot(
          from.x + clamped * dx - s.pos.x,
          from.y + clamped * dy - h,
          from.z + clamped * dz - s.pos.z
        );
        if (d < SMOKE_RADIUS) return true;
      }
      return false;
    }

    /** Show IRONFRONT-style tactical deploy point selector */
    function openDeploySelector(baseSpawn, onChoose) {
      const conquest = getConquest?.();
      const squad = getSquad?.();
      const enemies = (world.enemies?.list ?? []).filter(u => u?.alive && u.pos);
      const isSafe = pos => enemies.every(u => Math.hypot(u.pos.x - pos.x, u.pos.z - pos.z) >= 10);

      const options = [{
        id: 'hq',
        label: t('HQ Base (Safe)', '蓝方基地（安全）'),
        spawn: baseSpawn,
      }];

      if (conquest) {
        for (const p of conquest.points) {
          if (p.owner === 'blue' || p.secured) {
            const safe = isSafe(p.pos);
            options.push({
              id: p.id,
              label: t(
                `Objective ${p.short}${safe ? ' (Safe)' : ' (Perimeter)'}`,
                `据点 ${p.short}${safe ? '（安全）' : '（外围部署）'}`
              ),
              spawn: {
                pos: new Vector3(p.pos.x + (safe ? 1.5 : 5.5), p.pos.y, p.pos.z + (safe ? 1.5 : 5.5)),
                yaw: baseSpawn.yaw ?? 0,
              },
            });
          }
        }
      }

      if (squad?.allies) {
        for (const ally of squad.allies) {
          if (ally.alive && isSafe(ally.pos)) {
            options.push({
              id: ally.id,
              label: t(`Squadmate ${ally.callsign} (${ally.role})`, `队友 ${ally.callsign}（安全）`),
              spawn: {
                pos: new Vector3(ally.pos.x + 1.4, ally.pos.y, ally.pos.z + 1.4),
                yaw: ally.yaw ?? 0,
              },
            });
          }
        }
      }

      // If only HQ is available, deploy immediately without blocking flow
      if (options.length <= 1) {
        onChoose(baseSpawn);
        return;
      }

      deployCallback = onChoose;
      deployDialog.querySelector('[data-deploy-title]').textContent = t('Tactical Deploy', '选择部署位置');
      deployDialog.querySelector('[data-deploy-sub]').textContent = t(
        'Choose HQ, a captured sector, or a safe squadmate to redeploy.',
        '可选择基地、已占领据点或未交战队友附近重新部署。'
      );
      const list = deployDialog.querySelector('[data-deploy-list]');
      list.replaceChildren(...options.map(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = opt.label;
        btn.addEventListener('click', () => {
          const cb = deployCallback;
          deployCallback = null;
          deployDialog.close();
          cb?.(opt.spawn);
        });
        return btn;
      }));
      if (!deployDialog.open) deployDialog.showModal();
    }

    const onKeyDown = e => {
      if (!active || e.repeat || e.ctrlKey || e.altKey || e.metaKey ||
        /^(INPUT|SELECT|TEXTAREA)$/.test(e.target?.tagName)) return;
      if (world.game?.state !== 'playing' || !world.player?.alive || world.vehicle?.driving) return;
      if (document.querySelector('.developer-menu[open]')) return;
      if (e.code === 'KeyG' || e.code === 'Digit4') {
        e.preventDefault();
        const kind = e.code === 'Digit4' ? 'smoke' : 'frag';
        const p = world.player;
        const yaw = p.yaw ?? 0;
        const pitch = p.pitch ?? 0;
        const dir = new Vector3(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
        const origin = p.pos.clone().add(new Vector3(0, 1.5, 0)).addScaledVector(dir, 0.5);
        throwGrenade(kind, origin, dir, false);
      }
    };
    window.addEventListener('keydown', onKeyDown, { signal: world.chapterSignal });

    function update(dt, player, enemies) {
      if (!active || !(dt > 0)) return;
      const conquest = getConquest?.();
      const now = conquest?.elapsed ?? 0;
      if (throwCooldown > 0) throwCooldown = Math.max(0, throwCooldown - dt);
      if (vehicleDropCooldown > 0) vehicleDropCooldown = Math.max(0, vehicleDropCooldown - dt);

      // Update multiplayer SAR 4x4 vehicle
      if (mpVehicle && player) {
        mpVehicle.update(dt, player);
      }

      // Update parabolic grenades with ground bounce
      for (let i = grenades.length - 1; i >= 0; i--) {
        const g = grenades[i];
        g.fuse -= dt;
        g.vel.y -= GRENADE_GRAVITY * dt;
        g.pos.addScaledVector(g.vel, dt);
        const floorY = typeof physics?.groundHeight === 'function' ? physics.groundHeight(g.pos.x, g.pos.z, g.pos.y + 0.8) : 0;
        if (g.pos.y <= floorY + 0.08) {
          g.pos.y = floorY + 0.08;
          g.vel.y = Math.abs(g.vel.y) * 0.35;
          g.vel.x *= 0.65;
          g.vel.z *= 0.65;
        }
        g.mesh.position.copy(g.pos);
        g.mesh.rotation.x += dt * 9;
        g.mesh.rotation.z += dt * 6;

        if (g.fuse <= 0) {
          root.remove(g.mesh);
          grenades.splice(i, 1);
          if (g.kind === 'smoke') {
            smokes.push({ pos: g.pos.clone(), until: now + SMOKE_DURATION_S, nextPuff: now });
            fx?.smoke?.(g.pos, { size: 5.5, life: 3.0, rise: 0.2, count: 4, alpha: 0.68 });
          } else {
            fx?.explosion?.(g.pos, 1.35);
            audio?.play?.('rail_touchdown', { pos: g.pos, ref: 16, gain: 0.85, jitter: 0.05 });
            if (player?.pos && player.pos.distanceTo(g.pos) < 14) player.addShake?.(0.32);
            for (const e of [...(enemies ?? [])]) {
              if (!e?.alive || !e.pos) continue;
              const d = g.pos.distanceTo(e.pos);
              if (d < 8.5) {
                e.damage?.(115 * (1 - d / 8.5) + 15, e.pos, e.pos.clone().sub(g.pos).normalize(), 'grenade');
              }
            }
          }
        }
      }

      // Emit ongoing smoke puffs
      for (let i = smokes.length - 1; i >= 0; i--) {
        const s = smokes[i];
        if (now >= s.until) {
          smokes.splice(i, 1);
          continue;
        }
        if (now >= s.nextPuff) {
          s.nextPuff = now + 0.7;
          fx?.smoke?.(s.pos, { size: 5.0, life: 2.6, rise: 0.22, count: 2, alpha: 0.56 });
        }
      }

      // Ammo boxes auto-refill player within 7 m
      for (let i = ammoBoxes.length - 1; i >= 0; i--) {
        const box = ammoBoxes[i];
        if (now >= box.expiresAt) {
          root.remove(box.group);
          ammoBoxes.splice(i, 1);
          continue;
        }
        if (player?.alive && player.pos && now >= box.nextTick && player.pos.distanceTo(box.pos) <= AMMO_BOX_RADIUS) {
          box.nextTick = now + 2.0;
          const w = world.weapon;
          let refilled = false;
          if (w && w.reserve < w.magSize * 5) {
            w.addAmmo?.(Math.min(w.magSize, w.magSize * 5 - w.reserve));
            refilled = true;
          }
          if (fragCount < 2) { fragCount++; refilled = true; }
          if (smokeCount < 2) { smokeCount++; refilled = true; }
          if (refilled) renderHud();
        }
      }
    }

    return {
      start,
      stop,
      update,
      resetInventory,
      throwGrenade,
      placeAmmoBox,
      airdropVehicle,
      smokeBlocks,
      openDeploySelector,
      get active() { return active; },
      get fragCount() { return fragCount; },
      get smokeCount() { return smokeCount; },
      get ammoBoxes() { return ammoBoxes; },
      get vehicleDropCooldown() { return vehicleDropCooldown; },
      get deployOpen() { return deployDialog.open; },
    };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createPortMultiplayerGadgets };
  } else {
    globalThis.createPortMultiplayerGadgets = createPortMultiplayerGadgets;
  }
})();
