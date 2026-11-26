/* Active Companion AI System (SAR-04 Strike Team: Mara Chen & Kai).
 * Follows the player across terrain, avoids obstacles, takes cover & fires suppressive
 * tracer bursts with 3D rifle muzzle flashes, heals injured players, and delivers lively banter. */
(() => {
  window.createPortCompanionAI = (world, {
    name = 'Mara Chen',
    displayName = '玛拉·陈',
    role = 'medic',
    coat = 0x4b7874,
    variation = 1,
    modelType = null,
    flankOffset = [2.2, -1.8],
    canHeal = true,
    fireRate = 1.05,
    startPos,
    onSpeak = null,
  } = {}) => {
    const { THREE, scene, physics, fx, audio } = world;
    const { Group, Mesh, CylinderGeometry, MeshBasicMaterial, Vector3 } = THREE;

    const root = new Group();
    root.name = 'companion-ai-' + role + '-' + name.replace(/\s+/g, '-').toLowerCase();
    scene.add(root);

    let human = null;
    if (window.createSaltlineHuman) {
      human = window.createSaltlineHuman(THREE, { name: root.name, role, coat, variation, armed: true, modelType });
      root.add(human.actor);
    }
    let talking = false;

    const tracerMat = new MeshBasicMaterial({ color: role === 'medic' ? 0x7ef0ff : 0xffd36e, transparent: true, opacity: .9 });
    const tracerGeo = new CylinderGeometry(.016, .016, 1, 6);
    const tracers = [];

    const pos = startPos ? startPos.clone() : new Vector3(-30, 0, 7.5);
    root.position.copy(pos);
    let yaw = -Math.PI / 2;
    let stride = 0, age = 0;
    let fireCooldown = 0, calloutCooldown = 0, healCooldown = 0, muzzleFlashTimer = 0;
    let mode = 'stand';
    let seatedInVehicle = false;
    let overrideTarget = null;
    const stepVec = new Vector3(), probe = new Vector3(), up = new Vector3(0, 1, 0);
    const [flankX, flankZ] = flankOffset;

    function speak(zh, en = zh, priority = false) {
      if (!priority && calloutCooldown > 0) return;
      calloutCooldown = priority ? 5.5 : 11.0;
      if (onSpeak) onSpeak(en, zh);
      else world.tactical?.notify?.(zh, en, false, 5.2);
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
      let best = null, bestDist = 36;
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
        pos.y = physics.groundHeight(pos.x, pos.z, pos.y + 1.2);
      }
      const targetYaw = Math.atan2(moveX, moveZ);
      const diff = Math.atan2(Math.sin(targetYaw - yaw), Math.cos(targetYaw - yaw));
      yaw += diff * Math.min(1, dt * 8);
      stride += travel * 5.2;
      return true;
    }

    function healPlayer(player, amount = 28) {
      if (!canHeal || !player?.alive || healCooldown > 0) return false;
      healCooldown = 18;
      player.heal?.(amount);
      fx?.sparks?.(player.pos, up, 10);
      speak(`${displayName}：「接着这支战地肾上腺素！+${amount} HP，别一个人硬扛！」`, `${name}: "Catch this stim! +${amount} HP!"`, true);
      return true;
    }

    function update(dt, player) {
      if (!Number.isFinite(dt) || dt <= 0) return;
      age += dt;
      if (fireCooldown > 0) fireCooldown -= dt;
      if (calloutCooldown > 0) calloutCooldown -= dt;
      if (healCooldown > 0) healCooldown -= dt;
      if (muzzleFlashTimer > 0) {
        muzzleFlashTimer -= dt;
        if (muzzleFlashTimer <= 0) human?.flashMuzzle?.(false);
      }

      for (let i = tracers.length - 1; i >= 0; i--) {
        tracers[i].life -= dt;
        tracers[i].mesh.material.opacity = Math.max(0, tracers[i].life / .11);
        if (tracers[i].life <= 0) {
          scene.remove(tracers[i].mesh);
          tracers[i].mesh.material.dispose();
          tracers.splice(i, 1);
        }
      }

      if (seatedInVehicle) {
        mode = 'seated';
        root.position.copy(pos);
        root.rotation.y = yaw;
        human?.pose('seated', 0, age, false);
        return;
      }

      if (!player?.alive || !player.pos) return;

      if (talking) {
        const lookDx = player.pos.x - pos.x, lookDz = player.pos.z - pos.z;
        const faceYaw = Math.atan2(lookDx, lookDz);
        const diff = Math.atan2(Math.sin(faceYaw - yaw), Math.cos(faceYaw - yaw));
        yaw += diff * Math.min(1, dt * 8);
        root.position.copy(pos);
        root.rotation.y = yaw;
        human?.pose('talk', 0, age, false, dt);
        return;
      }

      // Auto-heal player when HP drops low
      if (canHeal && player.health < 58 && healCooldown <= 0 && pos.distanceTo(player.pos) < 22) {
        healPlayer(player, 28);
      }

      // Teleport catch-up if player drove or fast-traveled far away (> 34m)
      const playerDist = pos.distanceTo(player.pos);
      if (playerDist > 34 && !overrideTarget) {
        const backYaw = player.yaw ?? 0;
        pos.set(
          player.pos.x + Math.sin(backYaw) * 2.8 + flankX * .7,
          player.pos.y,
          player.pos.z + Math.cos(backYaw) * 2.8 + flankZ * .7
        );
        if (typeof physics?.groundHeight === 'function') pos.y = physics.groundHeight(pos.x, pos.z, pos.y + 1.5);
      }

      const hostile = findNearestHostile();
      let moving = false;

      if (overrideTarget) {
        moving = steerToward(overrideTarget, dt, 5.2);
        if (pos.distanceTo(overrideTarget) < 1.8) overrideTarget = null;
      } else if (playerDist > 4.4) {
        const flank = new Vector3(player.pos.x + flankX, player.pos.y, player.pos.z + flankZ);
        const runSpeed = playerDist > 10 ? 6.4 : 4.2;
        moving = steerToward(flank, dt, runSpeed);
      }

      if (hostile) {
        mode = moving ? 'aim' : 'crouch';
        const lookDx = hostile.pos.x - pos.x, lookDz = hostile.pos.z - pos.z;
        const aimYaw = Math.atan2(lookDx, lookDz);
        const diff = Math.atan2(Math.sin(aimYaw - yaw), Math.cos(aimYaw - yaw));
        yaw += diff * Math.min(1, dt * 10);

        if (fireCooldown <= 0) {
          fireCooldown = fireRate;
          const muzzle = pos.clone().add(new Vector3(0, mode === 'crouch' ? 1.1 : 1.42, 0));
          spawnTracer(muzzle, hostile.pos);
          human?.flashMuzzle?.(true);
          muzzleFlashTimer = .08;
          hostile.damage?.(22, hostile.pos, hostile.pos.clone().sub(muzzle).normalize(), 'companion');
          fx?.sparks?.(hostile.pos, up, 5);
          audio?.play?.('sidearm_shot', { pos: muzzle, ref: 12, gain: .42, jitter: .05 });
          if (calloutCooldown <= 0) {
            const callouts = role === 'medic'
              ? [
                [`${displayName}：「头顶有海鸥无人机！我帮你压制火力！」`, 'Mara: "Gull drone overhead! Covering fire!"'],
                [`${displayName}：「猎犬在包抄，我拖住它，你打弱点！」`, 'Mara: "Hound flanking us—focus fire!"'],
              ]
              : [
                [`${displayName}：「交给我！尝尝 SAR 突击步枪的火力压制！」`, 'Kai: "Suppressing fire on target!"'],
                [`${displayName}：「这群铁砧铁皮狗真难缠，打爆它们回头我请喝热咖啡！」`, 'Kai: "Anvil drones down—coffee is on me!"'],
              ];
            const pick = callouts[hostile.type === 'gull' ? 0 : 1];
            speak(pick[0], pick[1]);
          }
        }
      } else {
        mode = 'stand';
      }

      root.position.copy(pos);
      root.rotation.y = yaw;
      human?.pose(mode, stride, age, moving, dt);
    }

    function moveTo(targetPos) { overrideTarget = targetPos ? targetPos.clone() : null; }
    function setPosition(newPos) {
      if (!newPos) return;
      pos.copy(newPos);
      if (typeof physics?.groundHeight === 'function') pos.y = physics.groundHeight(pos.x, pos.z, pos.y + 1.5);
      root.position.copy(pos);
      overrideTarget = null;
    }
    function setSeated(isSeated, seatPos, seatYaw) {
      seatedInVehicle = !!isSeated;
      if (seatPos) { pos.copy(seatPos); root.position.copy(pos); }
      if (Number.isFinite(seatYaw)) { yaw = seatYaw; root.rotation.y = yaw; }
      mode = seatedInVehicle ? 'seated' : 'stand';
      overrideTarget = null;
      human?.pose(mode, 0, age, false, 0.016);
    }
    function setTalking(isTalking) {
      talking = !!isTalking;
      if (talking) overrideTarget = null;
    }
    function dispose() {
      for (const tr of tracers) { scene.remove(tr.mesh); tr.mesh.material.dispose(); }
      tracers.length = 0;
      root.removeFromParent();
    }

    return {
      update, speak, moveTo, setPosition, setSeated, setTalking, healPlayer, dispose,
      get pos() { return pos; },
      get root() { return root; },
      get human() { return human; },
      get name() { return name; },
      get displayName() { return displayName; },
      get seated() { return seatedInVehicle; },
    };
  };
})();
