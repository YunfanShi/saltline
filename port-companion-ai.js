/* Active Companion AI System (Mara Chen / SAR Wingman).
 * Follows the player across terrain, avoids obstacles, takes cover & fires suppressive
 * tracer bursts at nearby hostiles, and delivers contextual traversal banter. */
(() => {
  window.createPortCompanionAI = (world, {
    name = 'Mara Chen',
    role = 'engineer',
    startPos,
    onSpeak = null,
  } = {}) => {
    const { THREE, scene, physics, fx, audio } = world;
    const { Group, Mesh, CylinderGeometry, MeshBasicMaterial, MeshStandardMaterial, Vector3 } = THREE;

    const root = new Group();
    root.name = 'companion-ai-' + role;
    scene.add(root);

    let human = null;
    if (window.createSaltlineHuman) {
      human = window.createSaltlineHuman(THREE, { name: 'companion-mara', role, coat: 0x3b6866, variation: 1 });
      root.add(human.actor);
    }

    // Compact shoulder status beacon & tactical carbine slung/held for companion silhouette
    const beaconMat = new MeshBasicMaterial({ color: 0x58e8ff });
    const beacon = new Mesh(new CylinderGeometry(.045, .045, .04, 10), beaconMat);
    beacon.position.set(.18, 1.56, -.05);
    root.add(beacon);

    // Suppressive tracer pool so Mara visibly fights alongside the player
    const tracerMat = new MeshBasicMaterial({ color: 0xffd36e, transparent: true, opacity: .9 });
    const tracerGeo = new CylinderGeometry(.016, .016, 1, 6);
    const tracers = [];

    const pos = startPos ? startPos.clone() : new Vector3(-30, 0, 7.5);
    root.position.copy(pos);
    let yaw = -Math.PI / 2;
    let stride = 0, age = 0;
    let fireCooldown = 0, calloutCooldown = 0;
    let mode = 'stand'; // 'stand' | 'crouch'
    let overrideTarget = null;
    const stepVec = new Vector3(), probe = new Vector3(), up = new Vector3(0, 1, 0);

    function speak(zh, en = zh, priority = false) {
      if (!priority && calloutCooldown > 0) return;
      calloutCooldown = priority ? 5.5 : 9.0;
      if (onSpeak) onSpeak(en, zh);
      else world.tactical?.notify?.(zh, en, false, 4.8);
    }

    function spawnTracer(from, to) {
      const dir = to.clone().sub(from);
      const len = Math.max(.2, dir.length());
      const beam = new Mesh(tracerGeo, tracerMat.clone());
      beam.position.lerpVectors(from, to, .5);
      beam.scale.set(1, len, 1);
      beam.quaternion.setFromUnitVectors(up, dir.normalize());
      scene.add(beam);
      tracers.push({ mesh: beam, life: .11 });
    }

    function findNearestHostile() {
      let best = null, bestDist = 28;
      for (const e of world.enemies?.list ?? []) {
        if (!e?.alive || !e.pos) continue;
        const d = e.pos.distanceTo(pos);
        if (d < bestDist && (!physics?.lineOfSight || physics.lineOfSight(pos.clone().add(new Vector3(0, 1.45, 0)), e.pos))) {
          best = e;
          bestDist = d;
        }
      }
      return best;
    }

    function steerToward(target, dt, speed) {
      stepVec.subVectors(target, pos);
      stepVec.y = 0;
      const dist = stepVec.length();
      if (dist < .25) return false;
      stepVec.divideScalar(dist);

      // Obstacle-aware flank steering (probe forward, then +/- 42 deg if blocked)
      let moveX = stepVec.x, moveZ = stepVec.z;
      if (physics?.nav?.clearLine) {
        probe.set(pos.x + moveX * 1.1, pos.y, pos.z + moveZ * 1.1);
        if (!physics.nav.clearLine(pos, probe)) {
          let found = false;
          for (const ang of [.72, -.72, 1.25, -1.25]) {
            const cx = moveX * Math.cos(ang) - moveZ * Math.sin(ang);
            const cz = moveX * Math.sin(ang) + moveZ * Math.cos(ang);
            probe.set(pos.x + cx * 1.1, pos.y, pos.z + cz * 1.1);
            if (physics.nav.clearLine(pos, probe)) {
              moveX = cx; moveZ = cz; found = true; break;
            }
          }
          if (!found) return false;
        }
      }

      const travel = Math.min(dist, speed * dt);
      pos.x += moveX * travel;
      pos.z += moveZ * travel;
      if (typeof physics?.groundHeight === 'function') {
        pos.y = physics.groundHeight(pos.x, pos.z, .6);
      }
      const targetYaw = Math.atan2(moveX, moveZ);
      const diff = Math.atan2(Math.sin(targetYaw - yaw), Math.cos(targetYaw - yaw));
      yaw += diff * Math.min(1, dt * 8);
      stride += travel * 5.2;
      return true;
    }

    function update(dt, player) {
      if (!Number.isFinite(dt) || dt <= 0) return;
      age += dt;
      if (fireCooldown > 0) fireCooldown -= dt;
      if (calloutCooldown > 0) calloutCooldown -= dt;

      // Update active tracers
      for (let i = tracers.length - 1; i >= 0; i--) {
        tracers[i].life -= dt;
        tracers[i].mesh.material.opacity = Math.max(0, tracers[i].life / .11);
        if (tracers[i].life <= 0) {
          scene.remove(tracers[i].mesh);
          tracers[i].mesh.material.dispose();
          tracers.splice(i, 1);
        }
      }

      if (!player?.alive || !player.pos) return;

      // Teleport catch-up if player used fast travel / climbed far away (> 36m)
      const playerDist = pos.distanceTo(player.pos);
      if (playerDist > 36 && !overrideTarget) {
        const backYaw = player.yaw ?? 0;
        pos.set(player.pos.x + Math.sin(backYaw) * 2.8 + 1.4, player.pos.y, player.pos.z + Math.cos(backYaw) * 2.8);
        if (typeof physics?.groundHeight === 'function') pos.y = physics.groundHeight(pos.x, pos.z, .8);
      }

      const hostile = findNearestHostile();
      let moving = false;

      if (overrideTarget) {
        moving = steerToward(overrideTarget, dt, 4.6);
        if (pos.distanceTo(overrideTarget) < 1.5) overrideTarget = null;
      } else if (playerDist > 4.2) {
        // Keep a natural flanking offset slightly behind-right of the player
        const flank = new Vector3(player.pos.x + 2.2, player.pos.y, player.pos.z - 1.8);
        const runSpeed = playerDist > 9 ? 5.6 : 3.9;
        moving = steerToward(flank, dt, runSpeed);
      }

      // Engage nearby hostiles with suppressive fire & combat callouts
      if (hostile) {
        mode = moving ? 'stand' : 'crouch';
        const lookDx = hostile.pos.x - pos.x, lookDz = hostile.pos.z - pos.z;
        const aimYaw = Math.atan2(lookDx, lookDz);
        const diff = Math.atan2(Math.sin(aimYaw - yaw), Math.cos(aimYaw - yaw));
        yaw += diff * Math.min(1, dt * 10);

        if (fireCooldown <= 0) {
          fireCooldown = 1.15;
          const muzzle = pos.clone().add(new Vector3(0, mode === 'crouch' ? 1.1 : 1.4, 0));
          spawnTracer(muzzle, hostile.pos);
          hostile.damage?.(18, hostile.pos, hostile.pos.clone().sub(muzzle).normalize(), 'companion');
          fx?.sparks?.(hostile.pos, up, 5);
          audio?.play?.('sidearm_shot', { pos: muzzle, ref: 10, gain: .45, jitter: .04 });
          if (calloutCooldown <= 0) {
            const label = hostile.type === 'gull'
              ? ['玛拉：「头顶有海鸥侦察机！我帮你压制火力！」', 'Mara: "Gull drone overhead! Covering fire!"']
              : ['玛拉：「猎犬正在包抄，打爆它旁边的油桶或跟我集火！」', 'Mara: "Hound flanking us—shoot the fuel drum or focus fire!"'];
            speak(label[0], label[1]);
          }
        }
      } else {
        mode = 'stand';
      }

      root.position.copy(pos);
      root.rotation.y = yaw;
      human?.pose(mode, stride, age, moving);
    }

    function moveTo(targetPos) {
      overrideTarget = targetPos ? targetPos.clone() : null;
    }

    function setPosition(newPos) {
      if (!newPos) return;
      pos.copy(newPos);
      root.position.copy(pos);
      overrideTarget = null;
    }

    function dispose() {
      for (const tr of tracers) { scene.remove(tr.mesh); tr.mesh.material.dispose(); }
      tracers.length = 0;
      root.removeFromParent();
    }

    return {
      update, speak, moveTo, setPosition, dispose,
      get pos() { return pos; },
      get name() { return name; },
    };
  };
})();
