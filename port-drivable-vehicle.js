/* Drivable Saltline SAR 4x4 Tactical Patrol Vehicle.
 * Full player driving physics (accelerate, reverse, speed-sensitive steering, handbrake drift,
 * turbo boost, high-beam headlights, mountain slope suspension, ramming combat,
 * 1st-person cockpit view, and Mara Chen companion passenger banter). */
(() => {
  function injectStyles() {
    if (document.getElementById('saltline-vehicle-style')) return;
    const style = document.createElement('style');
    style.id = 'saltline-vehicle-style';
    style.textContent = `
      .sl-veh-hud{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:20;background:rgba(10,16,22,.86);border:1px solid rgba(92,232,255,.5);border-radius:8px;padding:10px 20px;color:#e8f8fb;font:600 13px/1.35 system-ui,-apple-system,sans-serif;display:flex;align-items:center;gap:18px;backdrop-filter:blur(8px);box-shadow:0 8px 26px rgba(0,0,0,.45);pointer-events:none}
      .sl-veh-hud[hidden]{display:none}
      .sl-veh-spd{font:800 28px/1 ui-monospace,monospace;color:#58e8ff;min-width:86px;text-align:right}
      .sl-veh-keys{font-size:11.5px;color:#b8d3da}
      .sl-veh-prompt{position:fixed;bottom:92px;left:50%;transform:translateX(-50%);z-index:19;background:rgba(12,20,26,.88);border:1px solid rgba(92,232,255,.55);border-radius:6px;padding:7px 14px;color:#effbff;font:600 13px/1.3 system-ui,sans-serif;pointer-events:none}
      .sl-veh-prompt[hidden]{display:none}
    `;
    document.head.appendChild(style);
  }

  window.createPortDrivableVehicle = (world, { startPos, startYaw = 0 } = {}) => {
    const { THREE, scene, physics, fx, audio } = world;
    const { Group, Mesh, BoxGeometry, CylinderGeometry, SphereGeometry,
      MeshStandardMaterial, MeshBasicMaterial, SpotLight, PointLight, Vector3 } = THREE;

    injectStyles();
    const root = new Group();
    root.name = 'saltline-drivable-4x4';
    scene.add(root);

    const chassis = new Group();
    root.add(chassis);

    // Armored SAR 4x4 Utility Truck Geometry
    const bodyMat = new MeshStandardMaterial({ color: 0x2c3c42, roughness: .42, metalness: .52 });
    const trimMat = new MeshStandardMaterial({ color: 0x1c2124, roughness: .58, metalness: .55 });
    const stripeMat = new MeshStandardMaterial({ color: 0xd95626, roughness: .45, metalness: .22 });
    const tireMat = new MeshStandardMaterial({ color: 0x181a1b, roughness: .92, metalness: .06 });
    const rimMat = new MeshStandardMaterial({ color: 0x869094, roughness: .35, metalness: .78 });
    const glassMat = new MeshStandardMaterial({ color: 0x6ea4bc, roughness: .12, metalness: .4, transparent: true, opacity: .32 });
    const headGlow = new MeshBasicMaterial({ color: 0xfff3d1 });
    const tailGlow = new MeshBasicMaterial({ color: 0xff3b28 });
    const blueBar = new MeshBasicMaterial({ color: 0x38a8ff });
    const amberBar = new MeshBasicMaterial({ color: 0xffa828 });

    const boxGeo = new BoxGeometry(1, 1, 1);
    const cylGeo = new CylinderGeometry(1, 1, 1, 18);
    const add = (p, g, m, sx, sy, sz, x, y, z) => {
      const mesh = new Mesh(g, m);
      mesh.position.set(x, y, z);
      mesh.scale.set(sx, sy, sz);
      mesh.castShadow = m !== glassMat;
      mesh.receiveShadow = true;
      p.add(mesh);
      return mesh;
    };

    // Lower armored body, hood, cab roof, rear cargo bed & front bullbar (forward is -Z)
    add(chassis, boxGeo, bodyMat, 2.08, .66, 4.75, 0, .82, 0);
    add(chassis, boxGeo, stripeMat, 2.12, .14, 4.65, 0, .88, 0);
    add(chassis, boxGeo, bodyMat, 1.92, .74, 1.65, 0, 1.48, -.05); // Cab frame
    add(chassis, boxGeo, glassMat, 1.80, .54, .06, 0, 1.46, -.88); // Windshield
    add(chassis, boxGeo, trimMat, 2.16, .42, .26, 0, .74, -2.42); // Front bullbar
    add(chassis, boxGeo, trimMat, 1.98, .55, 1.68, 0, 1.35, 1.48); // Cargo bed walls
    // Emergency roof lightbar
    const leftBar = add(chassis, boxGeo, blueBar, .52, .12, .22, -.42, 1.92, -.12);
    const rightBar = add(chassis, boxGeo, amberBar, .52, .12, .22, .42, 1.92, -.12);
    // Headlights & taillights
    for (const sx of [-.74, .74]) {
      add(chassis, boxGeo, headGlow, .34, .16, .08, sx, .92, -2.38);
      add(chassis, boxGeo, tailGlow, .32, .16, .08, sx, .92, 2.38);
    }
    // Real high-beam headlight SpotLight
    const headlight = new SpotLight(0xfff1d6, 38, 72, .56, .48, 1.15);
    headlight.position.set(0, 1.08, -2.45);
    const lightTarget = new Group();
    lightTarget.position.set(0, -.5, -18);
    chassis.add(headlight, lightTarget);
    headlight.target = lightTarget;

    // 4 Articulated Wheels (front wheels steer!)
    const wheels = [];
    for (const [wx, wz, isFront] of [[-1.08, -1.52, true], [1.08, -1.52, true], [-1.08, 1.48, false], [1.08, 1.48, false]]) {
      const steerPivot = new Group();
      steerPivot.position.set(wx, .44, wz);
      const spinHub = new Group();
      const tire = new Mesh(cylGeo, tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.scale.set(.44, .32, .44);
      const rim = new Mesh(cylGeo, rimMat);
      rim.rotation.z = Math.PI / 2;
      rim.scale.set(.24, .34, .24);
      spinHub.add(tire, rim);
      steerPivot.add(spinHub);
      chassis.add(steerPivot);
      wheels.push({ steerPivot, spinHub, isFront });
    }

    // HUD & Enter Prompt
    const hud = document.createElement('div');
    hud.className = 'sl-veh-hud';
    hud.hidden = true;
    hud.innerHTML = `
      <div class="sl-veh-spd" data-spd>0 km/h</div>
      <div class="sl-veh-keys">W/S 加速倒车 · A/D 转向 · Shift 氮气 · Space 漂移 · L 远光灯 · <b>F 下车</b></div>`;
    const promptEl = document.createElement('div');
    promptEl.className = 'sl-veh-prompt';
    promptEl.hidden = true;
    promptEl.textContent = '按 [F] 驾驶 SAR 战术四驱巡逻车';
    document.body.append(hud, promptEl);
    const spdEl = hud.querySelector('[data-spd]');

    const pos = startPos ? startPos.clone() : new Vector3(-26, 0, -20);
    let yaw = startYaw;
    let speed = 0, steerAngle = 0, pitch = 0, roll = 0;
    let driving = false, lightsOn = true, clock = 0;
    const keys = { w: false, s: false, a: false, d: false, shift: false, space: false };
    const visitedZones = new Set();

    root.position.copy(pos);
    root.rotation.y = yaw;

    function toggleDrive(player) {
      if (!player?.alive) return;
      if (driving) {
        driving = false;
        speed *= .3;
        // Place player safely to the left of the truck
        const exitX = pos.x - Math.cos(yaw) * 2.4;
        const exitZ = pos.z + Math.sin(yaw) * 2.4;
        const exitY = typeof physics?.groundHeight === 'function' ? physics.groundHeight(exitX, exitZ, .6) : pos.y;
        player.pos.set(exitX, exitY + .05, exitZ);
        player.vel?.set?.(0, 0, 0);
        world.weapon?.setVisible?.(true);
        hud.hidden = true;
      } else if (player.pos.distanceTo(pos) <= 4.4) {
        driving = true;
        world.weapon?.setVisible?.(false);
        hud.hidden = false;
        promptEl.hidden = true;
        world.tactical?.notify?.('🚙 已进入 SAR 战术四驱车！向北冲出港区即可探索沿海城区、山地卫星站与海岸机场！',
          '🚙 Entered SAR 4x4! Drive north to explore Coastal City, Mountain Comms & Airfield!', false, 5.0);
      }
    }

    function onKey(e, down) {
      if (document.querySelector('.developer-menu[open]') || document.querySelector('.menu.open')) return;
      if (e.code === 'KeyW') keys.w = down;
      else if (e.code === 'KeyS') keys.s = down;
      else if (e.code === 'KeyA') keys.a = down;
      else if (e.code === 'KeyD') keys.d = down;
      else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = down;
      else if (e.code === 'Space') keys.space = down;
      else if (down && !e.repeat && e.code === 'KeyF') toggleDrive(world.player);
      else if (down && !e.repeat && e.code === 'KeyL' && driving) {
        lightsOn = !lightsOn;
        headlight.intensity = lightsOn ? 38 : 0;
      }
    }
    const kd = e => onKey(e, true);
    const ku = e => onKey(e, false);
    window.addEventListener('keydown', kd, { signal: world.chapterSignal });
    window.addEventListener('keyup', ku, { signal: world.chapterSignal });

    function summonNear(player) {
      if (!player?.pos) return;
      const pyaw = player.yaw ?? 0;
      pos.set(player.pos.x - Math.sin(pyaw) * 5.2, player.pos.y, player.pos.z - Math.cos(pyaw) * 5.2);
      if (typeof physics?.groundHeight === 'function') pos.y = physics.groundHeight(pos.x, pos.z, .6);
      yaw = pyaw;
      speed = 0;
      root.position.copy(pos);
      root.rotation.y = yaw;
    }

    function update(dt, player) {
      if (!(dt > 0)) return;
      clock += dt;

      // Emergency roof lightbar strobe
      const strobe = Math.sin(clock * 14) > 0;
      leftBar.visible = strobe;
      rightBar.visible = !strobe;

      if (!driving) {
        // Gentle idle coasting & show [F] enter prompt when player is nearby
        if (Math.abs(speed) > .05) {
          speed *= Math.exp(-dt * 4);
        } else speed = 0;
        const near = Boolean(player?.alive && player.pos && player.pos.distanceTo(pos) <= 4.4);
        promptEl.hidden = !near;
        return;
      }

      promptEl.hidden = true;
      const throttle = (keys.w ? 1 : 0) - (keys.s ? 1 : 0);
      const steerInput = (keys.a ? 1 : 0) - (keys.d ? 1 : 0);
      const maxSpd = keys.shift ? 36 : 25;
      const accel = keys.shift ? 26 : 18;

      if (throttle !== 0) {
        speed += throttle * accel * dt;
      } else {
        speed *= Math.exp(-dt * (keys.space ? 5.5 : 2.4));
      }
      if (keys.space) speed *= Math.exp(-dt * 2.8);
      speed = Math.max(-11, Math.min(maxSpd, speed));

      // Smooth steering & turn rate
      const targetSteer = steerInput * .52;
      steerAngle += (targetSteer - steerAngle) * Math.min(1, dt * 9);
      const turnFactor = Math.min(1, Math.abs(speed) / 4.5) * (speed >= 0 ? 1 : -1);
      const driftBoost = keys.space ? 1.45 : 1.0;
      yaw += steerAngle * turnFactor * driftBoost * 2.4 * dt;

      // Forward direction (-sin(yaw), -cos(yaw))
      const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
      const nextX = pos.x + fx * speed * dt;
      const nextZ = pos.z + fz * speed * dt;

      // Sample ground height ahead & behind for mountain climbing & suspension pitch
      const gNow = typeof physics?.groundHeight === 'function' ? physics.groundHeight(nextX, nextZ, 2.2) : pos.y;
      const gFront = typeof physics?.groundHeight === 'function' ? physics.groundHeight(nextX + fx * 1.6, nextZ + fz * 1.6, 2.2) : gNow;
      const gRear = typeof physics?.groundHeight === 'function' ? physics.groundHeight(nextX - fx * 1.6, nextZ - fz * 1.6, 2.2) : gNow;

      pos.set(nextX, gNow, nextZ);
      const targetPitch = Math.atan2(gFront - gRear, 3.2);
      const targetRoll = -steerAngle * Math.min(1, Math.abs(speed) / 20) * .12;
      pitch += (targetPitch - pitch) * Math.min(1, dt * 8);
      roll += (targetRoll - roll) * Math.min(1, dt * 8);

      root.position.copy(pos);
      root.rotation.set(pitch, yaw, roll, 'YXZ');

      // Spin & steer wheels
      for (const w of wheels) {
        w.spinHub.rotation.x -= (speed * dt) / .44;
        if (w.isFront) w.steerPivot.rotation.y = steerAngle;
      }

      // Sync player & camera into 1st-person driver cockpit!
      if (player?.pos) {
        player.pos.set(pos.x, pos.y + .42, pos.z);
        player.vel?.set?.(0, 0, 0);
        player.yaw = yaw;
        if (world.camera) {
          world.camera.position.set(
            pos.x - Math.cos(yaw) * .42 + fx * .18,
            pos.y + 1.56,
            pos.z + Math.sin(yaw) * .42 + fz * .18,
          );
          world.camera.rotation.set(pitch * .65, yaw, roll * .5, 'YXZ');
        }
      }

      // High-speed ramming combat against enemy Hounds!
      if (Math.abs(speed) > 9) {
        for (const e of world.enemies?.list ?? []) {
          if (!e?.alive || !e.pos) continue;
          if (e.pos.distanceTo(pos) < 2.6) {
            e.damage?.(200, e.pos, new Vector3(fx * 4, 2.2, fz * 4), 'ram');
            fx?.sparks?.(e.pos, new Vector3(0, 1, 0), 22);
            audio?.play?.('rail_touchdown', { pos: e.pos, ref: 14, gain: .75, jitter: .05 });
            player?.addShake?.(.35);
            world.tactical?.notify?.('💥 战术冲撞！已撞毁敌方地面单位！', '💥 Vehicle ram! Hostile unit destroyed!', false, 2.5);
          }
        }
      }

      // Mara companion contextual landmark callouts when entering new biomes
      const mara = world.berthSlice?.companion;
      if (mara) {
        mara.setPosition(new Vector3(pos.x + Math.cos(yaw) * .48, pos.y + .25, pos.z - Math.sin(yaw) * .48));
        if (pos.z < -42 && !visitedZones.has('city')) {
          visitedZones.add('city');
          mara.speak('玛拉：「冲出港区了！前面是沿海城区主干道——向右拐可以爬上海拔 14 米的山地卫星通信站，往西北直通海岸机场！」',
            'Mara: "Clear of the port! Coastal City Boulevard ahead—turn east for the Mountain Comms Summit, or northwest to the Airfield!"', true);
        } else if (pos.x > 60 && pos.z < -60 && !visitedZones.has('mountain')) {
          visitedZones.add('mountain');
          mara.speak('玛拉：「稳住方向盘，正在爬升盘山公路！山顶的卫星雷达站能截获沃德的加密频道！」',
            'Mara: "Hold steady up the ridge! The summit satellite station can intercept Ward’s encrypted feed!"', true);
        } else if (pos.z < -150 && !visitedZones.has('airfield')) {
          visitedZones.add('airfield');
          mara.speak('玛拉：「前面就是海岸应急机场跑道和拱形机库——可以把车直接开进机库掩体！」',
            'Mara: "Coastal Airfield runway and arched hangar ahead—you can drive straight inside!"', true);
        }
      }

      spdEl.textContent = `${Math.round(Math.abs(speed) * 3.6)} km/h`;
    }

    function dispose() {
      root.removeFromParent();
      hud.remove();
      promptEl.remove();
    }

    return {
      update, summonNear, dispose,
      get driving() { return driving; },
      get pos() { return pos; },
    };
  };
})();
