/* IRONFRONT-ported Real-Time LAN WebSocket Sync & 3D Remote Player Renderer.
 * Connects to /api/lan/ws, syncs 20Hz player movement, combat tracers, PvP damage,
 * teammate medic revives, grenades, ammo boxes, and shared conquest state. */
(() => {
  'use strict';

  const SEND_INTERVAL_MS = 50; // 20 Hz matching IRONFRONT
  const RECONNECT_DELAYS = [250, 500, 1000, 1500, 2500, 3500, 4500];

  function createPortMultiplayerSync(world, { getConquest, getSquad, getGadgets, getVehicles } = {}) {
    const { THREE, scene, fx, audio } = world;
    const { Group, Mesh, BoxGeometry, CylinderGeometry, MeshBasicMaterial, MeshStandardMaterial, Vector3 } = THREE;
    const t = (en, zh) => window.SaltlineLocale?.t(en, zh) ?? en;

    const root = new Group();
    root.name = 'port-mp-remote-players';
    scene.add(root);

    const tracerGeo = new CylinderGeometry(0.016, 0.016, 1, 6);
    const blueTracerMat = new MeshBasicMaterial({ color: 0x64d5ff, transparent: true, opacity: 0.9 });
    const redTracerMat = new MeshBasicMaterial({ color: 0xff6b57, transparent: true, opacity: 0.9 });
    const up = new Vector3(0, 1, 0);
    const tracers = [];
    const remotes = new Map(); // id -> { group, human, labelEl, pos, targetPos, yaw, targetYaw, team, role, hp, alive, downed, name, stride, age }
    const srvEnemies = new Map(); // enemyId -> { mesh, pos, targetPos, type, hp, alive }

    const netBadge = document.createElement('div');
    netBadge.className = 'port-mp-net-badge';
    netBadge.dataset.noLocalize = '';
    netBadge.hidden = true;
    netBadge.style.cssText = 'position:fixed;left:16px;bottom:82px;z-index:22;background:rgba(10,16,22,.84);border:1px solid #586c76;color:#d6e9ef;padding:4px 10px;font:600 12px/1.3 system-ui,-apple-system,sans-serif;pointer-events:none;';
    const appEl = document.getElementById('app');
    if (appEl) appEl.append(netBadge);

    let ws = null;
    let session = null; // { code, token, yourId, hostId, team, settings, origin }
    let connected = false;
    let reconnecting = false;
    let closedByUser = false;
    let connectionGeneration = 0;
    let lastSendAt = 0;
    let lastConquestSendAt = 0;
    let sentWinner = null;
    let pendingPromotion = false;

    function spawnTracer(fromArr, dirArr, team) {
      const from = new Vector3(fromArr[0], fromArr[1], fromArr[2]);
      const dir = new Vector3(dirArr[0], dirArr[1], dirArr[2]).normalize();
      const to = from.clone().addScaledVector(dir, 28);
      const beam = new Mesh(tracerGeo, (team === 'red' ? redTracerMat : blueTracerMat).clone());
      beam.position.lerpVectors(from, to, 0.5);
      beam.scale.set(1, 28, 1);
      beam.quaternion.setFromUnitVectors(up, dir);
      scene.add(beam);
      tracers.push({ mesh: beam, life: 0.1 });
    }

    function ensureRemote(entry) {
      let r = remotes.get(entry.id);
      if (r) return r;
      const group = new Group();
      group.name = 'lan-player-' + entry.id;
      const coat = entry.team === 'red' ? 0x7c2d26 : 0x2a5a78;
      let human = null;
      if (window.createSaltlineHuman) {
        human = window.createSaltlineHuman(THREE, {
          name: 'lan-' + entry.id,
          role: entry.role === 'medic' ? 'medic' : entry.role === 'recon' ? 'scout' : 'engineer',
          coat,
          variation: Math.abs(entry.id.charCodeAt(0)) % 3,
        });
        group.add(human.actor);
      }
      root.add(group);
      const labelEl = document.createElement('div');
      labelEl.style.cssText = 'position:fixed;z-index:19;transform:translate(-50%,-100%);padding:2px 7px;border-radius:3px;font:700 11px/1.2 system-ui,sans-serif;pointer-events:none;white-space:nowrap;display:none;background:rgba(8,14,18,.82);';
      if (appEl) appEl.append(labelEl);
      r = {
        id: entry.id,
        name: entry.name,
        team: entry.team,
        role: entry.role,
        group,
        human,
        labelEl,
        pos: new Vector3(...(entry.state?.pos ?? [0, 0, 0])),
        targetPos: new Vector3(...(entry.state?.pos ?? [0, 0, 0])),
        yaw: entry.state?.yaw ?? 0,
        targetYaw: entry.state?.yaw ?? 0,
        hp: entry.state?.hp ?? 100,
        alive: entry.state?.alive !== false,
        downed: Boolean(entry.state?.downed),
        crouch: Boolean(entry.state?.crouch),
        stride: 0,
        age: 0,
      };
      remotes.set(entry.id, r);
      return r;
    }

    function removeRemote(id) {
      const r = remotes.get(id);
      if (!r) return;
      root.remove(r.group);
      r.labelEl.remove();
      remotes.delete(id);
    }

    function clearRemotes() {
      for (const id of [...remotes.keys()]) removeRemote(id);
    }

    function send(obj) {
      if (ws?.readyState === WebSocket.OPEN) {
        try { ws.send(JSON.stringify(obj)); } catch {}
      }
    }

    function sendEvent(kind, payload = {}) {
      if (!session || !connected) return;
      send({ type: 'event', kind, payload });
    }

    function handleIncomingEvent(ev) {
      if (!session || ev.from === session.yourId) return;
      const payload = ev.payload || {};
      if (ev.kind === 'shot' && Array.isArray(payload.origin) && Array.isArray(payload.dir)) {
        spawnTracer(payload.origin, payload.dir, ev.team);
        audio?.play?.('sidearm_shot', { pos: new Vector3(...payload.origin), ref: 14, gain: 0.35, jitter: 0.05 });
      } else if (ev.kind === 'hit' && payload.targetId === session.yourId) {
        const dmg = Number(payload.damage) || 0;
        if (dmg > 0 && world.player?.alive) {
          world.player.damage?.(dmg, world.player.pos, new Vector3(0, 0, 0), 'lan-pvp');
        }
      } else if (ev.kind === 'revive' && payload.targetId === session.yourId) {
        getSquad?.()?.revivePlayer?.(ev.fromName || 'Teammate');
      } else if (ev.kind === 'grenade' && Array.isArray(payload.origin) && Array.isArray(payload.dir)) {
        getGadgets?.()?.throwGrenade?.(
          payload.kind === 'smoke' ? 'smoke' : 'frag',
          new Vector3(...payload.origin),
          new Vector3(...payload.dir),
          true
        );
      } else if (ev.kind === 'ammoBox' && Array.isArray(payload.pos)) {
        getGadgets?.()?.placeAmmoBox?.(new Vector3(...payload.pos), true);
      } else if (ev.kind === 'heavyShot' && Array.isArray(payload.origin) && Array.isArray(payload.dir)) {
        getVehicles?.()?.fireProjectile?.({
          origin: new Vector3(...payload.origin),
          dir: new Vector3(...payload.dir),
          speed: payload.speed || 140,
          gravity: payload.gravity ?? 1,
          damage: payload.damage || 30,
          blast: payload.blast || 0,
          isMissile: Boolean(payload.isMissile),
          fromRemote: true,
        });
      } else if (ev.kind === 'vehicleHit' && payload.id != null) {
        const v = getVehicles?.()?.vehicles?.find(x => x.id === payload.id);
        if (v) getVehicles?.()?.damageVehicle?.(v, Number(payload.damage) || 0, true);
      } else if (ev.kind === 'enemyKilled') {
        getConquest?.()?.killedMachine?.({ affectsTickets: session.yourId === session.hostId });
      }
    }

    function applySnapshot(msg) {
      if (!session) return;
      const promoted = pendingPromotion || session.hostId !== session.yourId && msg.hostId === session.yourId;
      pendingPromotion = false;
      session.hostId = msg.hostId;
      const seen = new Set();
      for (const entry of msg.players ?? []) {
        if (entry.id === session.yourId) {
          session.team = entry.team;
          continue;
        }
        seen.add(entry.id);
        const r = ensureRemote(entry);
        r.name = entry.name;
        r.team = entry.team;
        r.role = entry.role;
        const st = entry.state || {};
        if (Array.isArray(st.pos) && st.pos.length === 3) {
          r.targetPos.set(st.pos[0], st.pos[1], st.pos[2]);
        }
        if (typeof st.yaw === 'number') r.targetYaw = st.yaw;
        if (typeof st.hp === 'number') r.hp = st.hp;
        r.alive = st.alive !== false && entry.connected !== false;
        r.downed = Boolean(st.downed);
        r.crouch = Boolean(st.crouch);
      }
      for (const id of [...remotes.keys()]) {
        if (!seen.has(id)) removeRemote(id);
      }

      // Only the host advances the shared match; guests apply its complete snapshot.
      const conquest = getConquest?.();
      if (conquest && msg.conquest && (session.yourId !== session.hostId || promoted)) {
        conquest.applySharedState?.(msg.conquest);
      }

      // Sync shared IRONFRONT vehicles from server
      if (Array.isArray(msg.vehicles)) {
        getVehicles?.()?.applyRemoteVehicles?.(msg.vehicles);
      }

      // Sync server-authoritative AI enemies across all LAN players
      if (Array.isArray(msg.enemies)) {
        for (const se of msg.enemies) {
          let entry = srvEnemies.get(se.id);
          if (!entry) {
            const isGull = se.type === 'gull';
            const mesh = new Mesh(
              isGull ? new BoxGeometry(0.95, 0.35, 1.1) : new BoxGeometry(0.65, 0.72, 1.25),
              new MeshStandardMaterial({ color: isGull ? 0x6b2824 : 0x452c28, roughness: 0.48, metalness: 0.65 })
            );
            mesh.castShadow = true;
            root.add(mesh);
            entry = { id: se.id, type: se.type, mesh, pos: new Vector3(...se.pos), targetPos: new Vector3(...se.pos), hp: se.hp, alive: se.alive };
            srvEnemies.set(se.id, entry);
          }
          entry.targetPos.set(se.pos[0], se.pos[1] + (se.type === 'hound' ? 0.45 : 0), se.pos[2]);
          entry.hp = se.hp;
          entry.alive = se.alive;
          entry.mesh.visible = se.alive;
        }
      }

      for (const ev of msg.events ?? []) handleIncomingEvent(ev);
    }

    function openSocket() {
      if (!session || closedByUser) return;
      const base = new URL(session.origin || location.origin);
      const wsUrl = new URL('/api/lan/ws', base);
      wsUrl.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl.searchParams.set('room', session.code);
      wsUrl.searchParams.set('token', session.token);

      const previousSocket = ws;
      ws = null;
      if (previousSocket) {
        try { previousSocket.close(); } catch {}
      }
      const sock = new WebSocket(wsUrl);
      ws = sock;
      sock.onopen = () => {
        if (ws !== sock || closedByUser) return;
        connected = true;
        reconnecting = false;
        updateBadge();
      };
      sock.onmessage = event => {
        if (ws !== sock || closedByUser) return;
        let msg;
        try { msg = JSON.parse(event.data); } catch { return; }
        if (msg.type === 'welcome' && msg.room) {
          pendingPromotion = session.hostId !== msg.room.yourId && msg.room.hostId === msg.room.yourId;
          session.yourId = msg.room.yourId;
          session.hostId = msg.room.hostId;
        } else if (msg.type === 'snapshot') {
          applySnapshot(msg);
        }
      };
      sock.onclose = () => {
        if (ws !== sock || closedByUser) return;
        connected = false;
        updateBadge();
        attemptReconnect();
      };
      sock.onerror = () => {};
    }

    async function attemptReconnect() {
      if (reconnecting || closedByUser || !session) return;
      reconnecting = true;
      const generation = connectionGeneration;
      updateBadge();
      for (const delay of RECONNECT_DELAYS) {
        await new Promise(r => setTimeout(r, delay));
        if (generation !== connectionGeneration || closedByUser || !session || connected) return;
        openSocket();
        await new Promise(r => setTimeout(r, 400));
        if (generation !== connectionGeneration || connected) return;
      }
      reconnecting = false;
      updateBadge();
    }

    function updateBadge() {
      if (!session) {
        netBadge.hidden = true;
        return;
      }
      netBadge.hidden = false;
      const count = remotes.size + 1;
      const teamLabel = session.team === 'red' ? t('Red', '红方') : t('Blue', '蓝方');
      const stateText = connected
        ? t(`LAN ${session.code} · ${count}P · ${teamLabel}`, `局域网 ${session.code} · ${count}人在线 · ${teamLabel}`)
        : reconnecting
          ? t(`LAN ${session.code} · Reconnecting…`, `局域网 ${session.code} · 正在重连…`)
          : t(`LAN ${session.code} · Disconnected`, `局域网 ${session.code} · 连接已断开`);
      netBadge.textContent = stateText;
      netBadge.style.borderColor = connected ? '#6df5a6' : '#ffb347';
    }

    function connect(nextSession) {
      disconnect();
      closedByUser = false;
      session = { ...nextSession };
      lastSendAt = 0;
      lastConquestSendAt = 0;
      sentWinner = null;
      pendingPromotion = false;
      openSocket();
      updateBadge();
    }

    function disconnect() {
      connectionGeneration++;
      closedByUser = true;
      connected = false;
      reconnecting = false;
      session = null;
      if (ws) {
        try { ws.close(); } catch {}
        ws = null;
      }
      clearRemotes();
      netBadge.hidden = true;
    }

    // Listen for local player weapon fire to broadcast tracers & check PvP hits against enemy humans
    world.events?.on?.('weapon:fire', shot => {
      if (!session || !connected || !world.player?.pos) return;
      const p = world.player;
      const yaw = p.yaw ?? 0;
      const pitch = p.pitch ?? 0;
      const dir = new Vector3(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)).normalize();
      const origin = p.pos.clone().add(new Vector3(0, 1.55, 0));
      sendEvent('shot', { origin: [origin.x, origin.y, origin.z], dir: [dir.x, dir.y, dir.z] });

      // Check ray hit against opposing-team remote human players
      for (const r of remotes.values()) {
        if (!r.alive || r.team === session.team) continue;
        const center = r.pos.clone().add(new Vector3(0, 1.15, 0));
        const toTarget = center.sub(origin);
        const along = toTarget.dot(dir);
        if (along < 0.5 || along > 120) continue;
        const perpSq = toTarget.lengthSq() - along * along;
        if (perpSq <= 0.42 * 0.42) {
          sendEvent('hit', { targetId: r.id, damage: shot?.weapon === 'sidearm' ? 22 : 28 });
          world.hud?.hit?.(false, false);
          break;
        }
      }
      // Check ray hit against server-authoritative shared AI enemies
      for (const se of srvEnemies.values()) {
        if (!se.alive) continue;
        const toTarget = se.pos.clone().sub(origin);
        const along = toTarget.dot(dir);
        if (along < 0.5 || along > 140) continue;
        const perpSq = toTarget.lengthSq() - along * along;
        if (perpSq <= 0.85 * 0.85) {
          sendEvent('enemyHit', { enemyId: se.id, damage: shot?.weapon === 'sidearm' ? 26 : 34 });
          world.hud?.hit?.(false, false);
          break;
        }
      }
    });

    // Press E near a downed LAN teammate to revive them
    window.addEventListener('keydown', e => {
      if (!session || !connected || e.repeat || e.code !== 'KeyE') return;
      if (!world.player?.alive || !world.player.pos) return;
      for (const r of remotes.values()) {
        if (r.team === session.team && r.downed && r.pos.distanceTo(world.player.pos) <= 3.2) {
          sendEvent('revive', { targetId: r.id });
          world.hud?.message?.(t(`Revived ${r.name}!`, `已救起队友 ${r.name}！`), 2.2);
          break;
        }
      }
    }, { signal: world.chapterSignal });

    const projVec = new Vector3();

    function update(dt, player) {
      // Update remote shot tracers
      for (let i = tracers.length - 1; i >= 0; i--) {
        tracers[i].life -= dt;
        tracers[i].mesh.material.opacity = Math.max(0, tracers[i].life / 0.1);
        if (tracers[i].life <= 0) {
          scene.remove(tracers[i].mesh);
          tracers[i].mesh.material.dispose();
          tracers.splice(i, 1);
        }
      }

      if (!session) return;

      const now = performance.now();
      const conquest = getConquest?.();
      if (connected && player?.pos && now - lastSendAt >= SEND_INTERVAL_MS) {
        lastSendAt = now;
        const squad = getSquad?.();
        send({
          type: 'state',
          state: {
            pos: [player.pos.x, player.pos.y, player.pos.z],
            yaw: player.yaw ?? 0,
            pitch: player.pitch ?? 0,
            hp: Math.round(player.health ?? 100),
            alive: Boolean(player.alive),
            downed: Boolean(squad?.downed),
            crouch: Boolean(player.crouching),
            driving: Boolean(world.vehicle?.driving || world.mpGadgets?.driving || world.mpVehicles?.driving),
            role: world.loadout?.role ?? 'medic',
            kills: conquest?.kills ?? 0,
            deaths: conquest?.deaths ?? 0,
            captures: conquest?.captures ?? 0,
          },
        });
      }
      if (connected && conquest && session.yourId === session.hostId &&
        (now - lastConquestSendAt >= 200 || conquest.winner && conquest.winner !== sentWinner)) {
        lastConquestSendAt = now;
        sentWinner = conquest.winner;
        send({ type: 'conquest', conquest: conquest.exportSharedState() });
        const vehList = getVehicles?.()?.exportVehicles?.();
        if (vehList?.length) send({ type: 'vehicles', vehicles: vehList });
      }

      updateBadge();

      // Interpolate server-authoritative AI enemies
      for (const se of srvEnemies.values()) {
        if (!se.alive) continue;
        se.pos.lerp(se.targetPos, 1 - Math.exp(-dt * 12));
        se.mesh.position.copy(se.pos);
      }

      // Interpolate remote human players & project floating nameplates
      const cam = world.camera;
      const w = window.innerWidth;
      const h = window.innerHeight;
      for (const r of remotes.values()) {
        r.age += dt;
        const prevX = r.pos.x, prevZ = r.pos.z;
        const lerp = 1 - Math.exp(-dt * 14);
        r.pos.lerp(r.targetPos, lerp);
        const yawDiff = Math.atan2(Math.sin(r.targetYaw - r.yaw), Math.cos(r.targetYaw - r.yaw));
        r.yaw += yawDiff * lerp;
        const moved = Math.hypot(r.pos.x - prevX, r.pos.z - prevZ);
        r.stride += moved * 5.2;
        r.group.visible = r.alive;
        r.group.position.copy(r.pos);
        r.group.rotation.y = r.yaw + Math.PI;
        r.human?.pose(r.downed || r.crouch ? 'crouch' : 'stand', r.stride, r.age, moved > 0.015);

        if (r.alive && cam) {
          projVec.set(r.pos.x, r.pos.y + 2.05, r.pos.z).project(cam);
          if (projVec.z > -1 && projVec.z < 1) {
            const sx = (projVec.x * 0.5 + 0.5) * w;
            const sy = (-projVec.y * 0.5 + 0.5) * h;
            r.labelEl.style.display = 'block';
            r.labelEl.style.left = sx + 'px';
            r.labelEl.style.top = sy + 'px';
            const friendly = r.team === session.team;
            r.labelEl.style.color = friendly ? '#7ae4ff' : '#ff8c7a';
            r.labelEl.style.border = `1px solid ${friendly ? '#64d5ff' : '#ff5a40'}`;
            r.labelEl.textContent = r.downed && friendly
              ? `${r.name} · ${t('[E] Revive', '[E] 救援')}`
              : `${r.name} · ${Math.round(r.hp)} HP`;
          } else {
            r.labelEl.style.display = 'none';
          }
        } else {
          r.labelEl.style.display = 'none';
        }
      }
    }

    function dispose() {
      disconnect();
      for (const tr of tracers) {
        scene.remove(tr.mesh);
        tr.mesh.material.dispose();
      }
      tracers.length = 0;
      root.removeFromParent();
      netBadge.remove();
    }

    return {
      connect,
      disconnect,
      sendEvent,
      updateConquest(dt, player, enemies, allies = []) {
        const conquest = getConquest?.();
        if (!session || !conquest) return null;
        if (session.yourId !== session.hostId) return conquest.updateGuest(dt);
        const blue = [...allies];
        const red = [...enemies];
        for (const remote of remotes.values()) {
          const unit = { alive: remote.alive && !remote.downed, pos: remote.targetPos };
          (remote.team === 'red' ? red : blue).push(unit);
        }
        if (session.team === 'red') {
          red.push(player);
          return conquest.update(dt, { alive: false }, red, blue);
        }
        return conquest.update(dt, player, red, blue);
      },
      update,
      dispose,
      get active() { return Boolean(session); },
      get connected() { return connected; },
      get session() { return session; },
      get remoteCount() { return remotes.size; },
    };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createPortMultiplayerSync };
  } else {
    globalThis.createPortMultiplayerSync = createPortMultiplayerSync;
  }
})();
