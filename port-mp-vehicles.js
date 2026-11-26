/* IRONFRONT v0.20.0 Heavy Content Port for Saltline Multiplayer:
 * - All 8 Vehicle Classes (T90 Tank, V12 IFV, A40 AA, R4 Scout, U8 Transport, M2 Motorcycle, H8 Helicopter, J20 Jet)
 * - High-Precision Realistic Industrial-Military 3D Models (PBR riveted armor skins, LatheGeometry treaded tires,
 *   lofted stealth jet fuselage/airfoils, and Saltline's native realistic SAR helicopter hull)
 * - Exact Flight.ts Jet Banking & Helicopter Hover Physics + Parachute High-Altitude Ejection
 * - Exact guideMissile() Homing Seeker (77 deg cone, 1.25 rad/s turn), 2-Stage Missile Warning HUD & [X] Flares
 * - Infantry Anti-Armor Rocket [Z] & Anti-Air Guided Stinger [B] */
(() => {
  'use strict';

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  const VEHICLE_SPECS = Object.freeze({
    tank:       { name: 'T90 BASTION',    zh: 'T90 主战坦克',   maxHp: 820, radius: 3.3, maxForward: 10, maxReverse: 4,  accel: 5.5,  brake: 10, turnRate: 0.8,  damage: 145, interval: 2.2, range: 220, projSpeed: 180, gravity: 1.4, blast: 4.2, seats: 4, rp: 8,  cd: 65, respawn: 110, airborne: false, hasMissile: false, hasCoax: true },
    ifv:        { name: 'V12 LANCER',     zh: 'V12 步战车',     maxHp: 420, radius: 2.9, maxForward: 14, maxReverse: 6,  accel: 8.5,  brake: 11, turnRate: 1.15, damage: 74,  interval: 0.9, range: 175, projSpeed: 140, gravity: 3.0, blast: 3.8, seats: 4, rp: 6,  cd: 50, respawn: 85,  airborne: false, hasMissile: false, hasCoax: true },
    aa:         { name: 'A40 WATCHTOWER', zh: 'A40 防空车',     maxHp: 320, radius: 2.8, maxForward: 16, maxReverse: 6,  accel: 9.0,  brake: 11, turnRate: 1.25, damage: 30,  interval: 0.22,range: 320, projSpeed: 210, gravity: 1.2, blast: 2.2, seats: 4, rp: 6,  cd: 45, respawn: 85,  airborne: false, hasMissile: true,  hasCoax: false },
    scout:      { name: 'R4 SCOUT',       zh: 'R4 侦察车',      maxHp: 180, radius: 2.0, maxForward: 22, maxReverse: 9,  accel: 13.5, brake: 14, turnRate: 1.7,  damage: 22,  interval: 0.18,range: 120, projSpeed: 260, gravity: 0.2, blast: 0,   seats: 2, rp: 4,  cd: 35, respawn: 65,  airborne: false, hasMissile: false, hasCoax: false },
    transport:  { name: 'U8 ROVER',       zh: 'U8 武装运输车',  maxHp: 140, radius: 1.9, maxForward: 25, maxReverse: 10, accel: 15.0, brake: 15, turnRate: 1.9,  damage: 18,  interval: 0.12,range: 110, projSpeed: 260, gravity: 0.2, blast: 0,   seats: 4, rp: 3,  cd: 28, respawn: 55,  airborne: false, hasMissile: false, hasCoax: false },
    motorcycle: { name: 'M2 COURIER',     zh: 'M2 双座摩托车',  maxHp: 85,  radius: 0.9, maxForward: 33, maxReverse: 5,  accel: 20.0, brake: 18, turnRate: 2.6,  damage: 0,   interval: 99,  range: 0,   projSpeed: 0,   gravity: 0,   blast: 0,   seats: 2, rp: 2,  cd: 20, respawn: 45,  airborne: false, hasMissile: false, hasCoax: false },
    helicopter: { name: 'H8 KESTREL',     zh: 'H8 武装直升机',  maxHp: 260, radius: 3.1, maxForward: 38, maxReverse: 16, accel: 22.0, brake: 22, turnRate: 1.5,  damage: 55,  interval: 0.42,range: 250, projSpeed: 115, gravity: 2.2, blast: 5.0, seats: 4, rp: 8,  cd: 60, respawn: 90,  airborne: true,  hasMissile: true,  hasCoax: false },
    jet:        { name: 'J20 STRATUS',    zh: 'J20 战斗机',     maxHp: 220, radius: 3.8, maxForward: 65, maxReverse: 0,  accel: 22.0, brake: 22, turnRate: 0.9,  damage: 36,  interval: 0.16,range: 380, projSpeed: 280, gravity: 0.6, blast: 2.4, seats: 1, rp: 9,  cd: 70, respawn: 95,  airborne: true,  hasMissile: true,  hasCoax: false },
  });

  function controlFlight(v, throttle, side, dt, viewYaw, pitch = 0, boost = false, brake = false) {
    const jet = v.kind === 'jet';
    const delta = viewYaw === undefined ? 0 : Math.atan2(Math.sin(viewYaw + Math.PI - v.yaw), Math.cos(viewYaw + Math.PI - v.yaw));
    if (jet) {
      const bank = clamp(side * 0.95 + delta * 0.45, -1.1, 1.1);
      if (boost && Math.abs(side) > 0.7) {
        v.roll += side * 2.8 * dt;
      } else {
        const wrapped = Math.atan2(Math.sin(v.roll), Math.cos(v.roll));
        v.roll = wrapped + (bank - wrapped) * (1 - Math.exp(-dt * 5));
      }
      v.flightPitch += (clamp(pitch, -0.85, 0.85) - v.flightPitch) * (1 - Math.exp(-dt * 3));
      v.yaw += (Math.sin(v.roll) * 1.8 + clamp(delta, -0.5, 0.5) * 0.3) * dt;
      const target = brake ? 32 : boost ? 92 : clamp(52 + throttle * 23, 29, 75);
      v.speed += clamp(target - v.speed, -22 * dt, 18 * dt);
    } else {
      v.yaw += clamp(viewYaw === undefined ? side * 2.2 : delta, -2.2 * dt, 2.2 * dt);
      const target = clamp(throttle, -1, 1) * (boost ? 48 : 38);
      v.speed += clamp(target - v.speed, -22 * dt, 22 * dt);
      v.roll += (clamp(-side * 0.4, -0.4, 0.4) - v.roll) * (1 - Math.exp(-dt * 5));
      v.flightPitch += (-throttle * 0.12 - v.flightPitch) * (1 - Math.exp(-dt * 4));
    }
    return {
      dx: Math.sin(v.yaw) * v.speed * dt * Math.cos(jet ? v.flightPitch : 0) + (jet ? 0 : Math.cos(v.yaw) * side * 19 * dt),
      dz: Math.cos(v.yaw) * v.speed * dt * Math.cos(jet ? v.flightPitch : 0) - (jet ? 0 : Math.sin(v.yaw) * side * 19 * dt),
    };
  }

  function guideMissile(velocity, delta, speed, dt) {
    const vl = Math.hypot(velocity.x, velocity.y, velocity.z) || 1;
    const dl = Math.hypot(delta.x, delta.y, delta.z) || 1;
    const a = { x: velocity.x / vl, y: velocity.y / vl, z: velocity.z / vl };
    const b = { x: delta.x / dl, y: delta.y / dl, z: delta.z / dl };
    const angle = Math.acos(clamp(a.x * b.x + a.y * b.y + a.z * b.z, -1, 1));
    if (angle > 1.35) return false;
    const t = angle < 0.00001 ? 1 : Math.min(1, (dt * 1.25) / angle);
    const sin = Math.sin(angle);
    const wa = t === 1 ? 0 : Math.sin((1 - t) * angle) / sin;
    const wb = t === 1 ? 1 : Math.sin(t * angle) / sin;
    velocity.x = (a.x * wa + b.x * wb) * speed;
    velocity.y = (a.y * wa + b.y * wb) * speed;
    velocity.z = (a.z * wa + b.z * wb) * speed;
    return true;
  }

  const skinCache = new Map();
  function getArmorMaterial(THREE, baseHex, roughness = 0.56, metalness = 0.44) {
    const key = `${baseHex}-${roughness}-${metalness}`;
    if (skinCache.has(key)) return skinCache.get(key);
    const size = 256;
    const color = new Uint8Array(size * size * 4);
    const bump = new Uint8Array(size * size * 4);
    const base = new THREE.Color(baseHex);
    const r0 = Math.round(base.r * 255), g0 = Math.round(base.g * 255), b0 = Math.round(base.b * 255);
    let seed = (baseHex ^ 0x5bd1e995) >>> 0;
    const cell = 64;
    const tones = Array.from({ length: 16 }, () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return ((seed >>> 24) / 255 - 0.5) * 14;
    });
    for (let y = 0; y < size; y++) {
      const ly = y % cell;
      const seamY = ly < 2 || ly > cell - 2;
      const rivetY = (ly >= 5 && ly <= 6) || (ly >= cell - 7 && ly <= cell - 6);
      for (let x = 0; x < size; x++) {
        const lx = x % cell;
        const seamX = lx < 2 || lx > cell - 2;
        const rivetX = (lx >= 5 && lx <= 6) || (lx >= cell - 7 && lx <= cell - 6);
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const grain = ((seed >>> 24) / 255 - 0.5) * 9;
        const isSeam = seamX || seamY;
        const isRivet = !isSeam && ((rivetY && x % 10 < 2) || (rivetX && y % 10 < 2));
        const streak = Math.max(0, Math.sin(x * 0.19 + Math.cos(y * 0.06))) ** 5 * 8;
        const tone = tones[Math.floor(y / cell) * 4 + Math.floor(x / cell)];
        let d = tone + grain - streak + (isSeam ? -24 : isRivet ? 11 : 0);
        const idx = (y * size + x) * 4;
        color[idx] = clamp(Math.round(r0 + d), 0, 255);
        color[idx + 1] = clamp(Math.round(g0 + d), 0, 255);
        color[idx + 2] = clamp(Math.round(b0 + d), 0, 255);
        color[idx + 3] = 255;
        bump[idx] = isSeam ? 76 : isRivet ? 185 : clamp(Math.round(128 + grain * 2), 0, 255);
        bump[idx + 1] = clamp(Math.round(roughness * 255 + (isSeam ? 45 : streak * 3)), 40, 245);
        bump[idx + 2] = 255;
        bump[idx + 3] = 255;
      }
    }
    const mk = (buf, cs) => {
      const tex = new THREE.DataTexture(buf, size, size);
      if (cs) tex.colorSpace = cs;
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 2);
      tex.magFilter = THREE.LinearFilter;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.generateMipmaps = true;
      tex.needsUpdate = true;
      return tex;
    };
    const mat = new THREE.MeshStandardMaterial({
      map: mk(color, THREE.SRGBColorSpace),
      bumpMap: mk(bump, THREE.NoColorSpace),
      roughnessMap: mk(bump, THREE.NoColorSpace),
      bumpScale: 0.012,
      roughness: 1.0,
      metalness,
    });
    skinCache.set(key, mat);
    return mat;
  }

  function createLoftedShell(THREE, material, stations, segs = 28) {
    const verts = [], uvs = [], idx = [];
    const cols = segs + 1;
    const zMin = stations[0][0], zSpan = Math.max(0.01, stations[stations.length - 1][0] - zMin);
    for (const [z, w, y, h, chine = 0] of stations) {
      const v = (z - zMin) / zSpan;
      for (let i = 0; i <= segs; i++) {
        const u = i / segs;
        const a = u * Math.PI * 2;
        const sx = Math.sin(a), cy = Math.cos(a);
        const rx = Math.sign(sx) * Math.pow(Math.abs(sx), 1 - chine * 0.35) * w;
        const ry = y + cy * h;
        verts.push(rx, ry, z);
        uvs.push(u * 2, v * 2);
      }
    }
    for (let r = 0; r < stations.length - 1; r++) {
      for (let i = 0; i < segs; i++) {
        const a = r * cols + i, b = a + 1, c = a + cols, d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, material);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  function createAirfoil(THREE, material, sections, axis = 'x', segs = 14) {
    const verts = [], uvs = [], idx = [];
    const cols = segs + 1;
    for (let r = 0; r < sections.length; r++) {
      const [span, cA, cB, halfChord, halfThick] = sections[r];
      for (let i = 0; i <= segs; i++) {
        const th = (i / segs) * Math.PI * 2;
        const cPos = halfChord * Math.cos(th);
        const tPos = halfThick * Math.sin(th) * (1 + 0.25 * Math.cos(th));
        if (axis === 'x') verts.push(span, cA + tPos, cB + cPos);
        else verts.push(cA + tPos, span, cB + cPos);
        uvs.push(i / segs, r / (sections.length - 1));
      }
    }
    for (let r = 0; r < sections.length - 1; r++) {
      for (let i = 0; i < segs; i++) {
        const a = r * cols + i, b = a + 1, c = a + cols, d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, material);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  function buildDetailedWheel(THREE, radius, width, tireMat, rimMat, boltMat) {
    const g = new THREE.Group();
    const hw = width * 0.5;
    const prof = [
      [radius * 0.52, -hw * 0.78], [radius * 0.65, -hw], [radius * 0.88, -hw],
      [radius, -hw * 0.72], [radius, hw * 0.72], [radius * 0.88, hw],
      [radius * 0.65, hw], [radius * 0.52, hw * 0.78], [radius * 0.52, -hw * 0.78],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    const tire = new THREE.Mesh(new THREE.LatheGeometry(prof, 28), tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    tire.receiveShadow = true;
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.54, radius * 0.54, width * 0.76, 16), rimMat);
    rim.rotation.z = Math.PI / 2;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.24, radius * 0.24, width * 0.88, 12), boltMat);
    hub.rotation.z = Math.PI / 2;
    g.add(tire, rim, hub);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const lug = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.045, radius * 0.045, width * 0.86, 6), boltMat);
      lug.rotation.z = Math.PI / 2;
      lug.position.set(0, Math.cos(a) * radius * 0.36, Math.sin(a) * radius * 0.36);
      g.add(lug);
    }
    return g;
  }

  function buildVehicleMesh(THREE, world, kind, team) {
    const { Group, Mesh, BoxGeometry, CylinderGeometry, SphereGeometry, MeshStandardMaterial, MeshBasicMaterial } = THREE;
    const root = new Group();
    const hull = new Group();
    const turret = new Group();
    const barrel = new Group();
    const rotors = [];
    const wheels = [];
    root.add(hull);
    hull.add(turret);
    turret.add(barrel);

    // Helicopter directly reuses Saltline's museum-grade SAR transport visual + tactical rocket pods
    if (kind === 'helicopter' && typeof window.createPortTransportVisual === 'function' && world?.mats) {
      const heli = window.createPortTransportVisual({ THREE, mats: world.mats }, hull);
      heli.root.rotation.y = Math.PI;
      heli.setDoor?.(0);
      const pylonMat = getArmorMaterial(THREE, team === 'red' ? 0x58322c : 0x2f4148, 0.46, 0.52);
      const darkSteel = new MeshStandardMaterial({ color: 0x1d2328, roughness: 0.42, metalness: 0.76 });
      const wing = new Mesh(new BoxGeometry(4.2, 0.14, 0.72), pylonMat);
      wing.position.set(0, 1.38, 0.2);
      wing.castShadow = true;
      hull.add(wing);
      for (const sx of [-1.85, 1.85]) {
        const pod = new Mesh(new CylinderGeometry(0.22, 0.22, 1.35, 16), darkSteel);
        pod.rotation.x = Math.PI / 2;
        pod.position.set(sx, 1.12, 0.35);
        pod.castShadow = true;
        hull.add(pod);
      }
      rotors.push({ obj: heli.mainRotor, axis: 'y', speed: 17 });
      rotors.push({ obj: heli.tailRotor, axis: 'x', speed: 46 });
      return { root, hull, turret, barrel, rotors, wheels };
    }

    const armorMat = getArmorMaterial(THREE, team === 'red' ? 0x5c3630 : 0x3b4d52, 0.54, 0.42);
    const armorSecondary = getArmorMaterial(THREE, team === 'red' ? 0x472924 : 0x2c3a3f, 0.60, 0.48);
    const accentMat = getArmorMaterial(THREE, team === 'red' ? 0xb54434 : 0x3486a8, 0.44, 0.30);
    const steelMat = new MeshStandardMaterial({ color: 0x252d32, roughness: 0.42, metalness: 0.78 });
    const gunmetalMat = new MeshStandardMaterial({ color: 0x1c2125, roughness: 0.34, metalness: 0.84 });
    const rubberMat = new MeshStandardMaterial({ color: 0x151718, roughness: 0.94, metalness: 0.04 });
    const rimMat = new MeshStandardMaterial({ color: 0x4b5456, roughness: 0.48, metalness: 0.72 });
    const glassMat = new MeshStandardMaterial({ color: 0x5d8ea6, roughness: 0.10, metalness: 0.52, transparent: true, opacity: 0.42 });
    const lampMat = new MeshBasicMaterial({ color: 0xfff0c8 });
    const tailLampMat = new MeshBasicMaterial({ color: 0xff3b28 });
    const burnerMat = new MeshBasicMaterial({ color: 0xffa64d });

    const box = (p, w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) => {
      const m = new Mesh(new BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.rotation.set(rx, ry, rz);
      m.castShadow = true;
      m.receiveShadow = true;
      p.add(m);
      return m;
    };
    const cyl = (p, rt, rb, h, seg, mat, x, y, z, rx = 0, ry = 0, rz = 0) => {
      const m = new Mesh(new CylinderGeometry(rt, rb, h, seg), mat);
      m.position.set(x, y, z);
      m.rotation.set(rx, ry, rz);
      m.castShadow = true;
      p.add(m);
      return m;
    };

    if (kind === 'tank') {
      box(hull, 2.72, 0.72, 6.1, armorSecondary, 0, 0.78, 0);
      box(hull, 3.24, 0.34, 5.4, armorMat, 0, 1.24, -0.2);
      box(hull, 3.16, 0.36, 1.65, armorMat, 0, 1.06, 2.75, 0.44, 0, 0);
      for (let ix = -1.25; ix <= 1.25; ix += 0.5) {
        box(hull, 0.42, 0.12, 0.52, armorSecondary, ix, 1.26, 2.82, 0.44, 0, 0);
      }
      for (const sx of [-1.52, 1.52]) {
        box(hull, 0.54, 0.10, 5.85, rubberMat, sx, 0.06, 0);
        box(hull, 0.54, 0.09, 5.75, rubberMat, sx, 0.86, 0);
        box(hull, 0.14, 0.58, 6.15, armorMat, sx * 1.19, 0.88, 0);
        for (let z = -2.4; z <= 2.4; z += 0.8) {
          box(hull, 0.06, 0.50, 0.72, armorSecondary, sx * 1.24, 0.88, z);
        }
        for (let i = 0; i < 6; i++) {
          const wz = -2.15 + i * 0.86;
          const rw = buildDetailedWheel(THREE, 0.36, 0.44, rubberMat, rimMat, steelMat);
          rw.position.set(sx, 0.40, wz);
          hull.add(rw);
          wheels.push(rw);
        }
        cyl(hull, 0.32, 0.32, 0.46, 16, steelMat, sx, 0.62, 2.86, 0, 0, Math.PI / 2);
        cyl(hull, 0.34, 0.34, 0.46, 16, steelMat, sx, 0.62, -2.86, 0, 0, Math.PI / 2);
        box(hull, 0.24, 0.14, 0.12, lampMat, sx * 0.72, 1.34, 3.22);
        box(hull, 0.24, 0.12, 0.08, tailLampMat, sx * 0.78, 1.24, -3.12);
      }
      for (let gx = -0.9; gx <= 0.9; gx += 0.3) box(hull, 0.22, 0.06, 1.35, gunmetalMat, gx, 1.43, -2.05);
      for (const sx of [-0.72, 0.72]) cyl(hull, 0.24, 0.24, 0.88, 16, armorSecondary, sx, 1.22, -3.28, 0, 0, Math.PI / 2);

      turret.position.set(0, 1.44, 0.15);
      box(turret, 2.38, 0.64, 2.75, armorMat, 0, 0.34, -0.1);
      for (const sx of [-1, 1]) {
        box(turret, 0.68, 0.56, 1.35, armorMat, sx * 1.06, 0.32, 0.95, 0, sx * -0.46, 0);
        for (let t = 0; t < 4; t++) {
          cyl(turret, 0.042, 0.042, 0.34, 8, gunmetalMat, sx * (1.24 + t * 0.05), 0.42 + t * 0.04, 0.52, -0.6, sx * 0.3, 0);
        }
      }
      box(turret, 2.24, 0.38, 0.72, steelMat, 0, 0.36, -1.75);
      box(turret, 2.42, 0.16, 0.36, accentMat, 0, 0.56, -1.28);
      cyl(turret, 0.42, 0.46, 0.18, 16, armorSecondary, 0.58, 0.74, -0.25);
      cyl(turret, 0.16, 0.18, 0.28, 12, gunmetalMat, -0.58, 0.78, 0.35);
      box(turret, 0.18, 0.14, 0.06, glassMat, -0.58, 0.82, 0.50);
      cyl(turret, 0.014, 0.02, 2.2, 6, steelMat, -0.95, 1.72, -1.05);

      barrel.position.set(0, 0.38, 1.25);
      box(barrel, 0.68, 0.42, 0.48, armorSecondary, 0, 0, 0.12);
      cyl(barrel, 0.095, 0.125, 4.9, 16, gunmetalMat, 0, 0, 2.55, Math.PI / 2, 0, 0);
      cyl(barrel, 0.165, 0.165, 0.72, 16, armorMat, 0, 0, 2.15, Math.PI / 2, 0, 0);
      cyl(barrel, 0.115, 0.115, 0.22, 12, steelMat, 0, 0, 4.95, Math.PI / 2, 0, 0);
      cyl(barrel, 0.032, 0.032, 1.65, 8, gunmetalMat, 0.42, -0.04, 0.95, Math.PI / 2, 0, 0);

    } else if (kind === 'ifv') {
      box(hull, 2.38, 0.82, 5.75, armorSecondary, 0, 0.98, 0);
      box(hull, 2.52, 0.44, 5.25, armorMat, 0, 1.48, -0.2);
      box(hull, 2.46, 0.52, 1.48, armorMat, 0, 1.22, 2.75, 0.48, 0, 0);
      box(hull, 2.28, 0.18, 0.55, steelMat, 0, 1.38, 3.42, -0.35, 0, 0);
      for (const sx of [-1.32, 1.32]) {
        box(hull, 0.14, 0.48, 5.1, armorMat, sx, 1.44, -0.1);
        for (const wz of [-2.05, -0.68, 0.68, 2.05]) {
          const w = buildDetailedWheel(THREE, 0.52, 0.36, rubberMat, rimMat, steelMat);
          w.position.set(sx * 0.98, 0.52, wz);
          hull.add(w);
          wheels.push(w);
        }
        box(hull, 0.22, 0.14, 0.10, lampMat, sx * 0.74, 1.38, 3.35);
        box(hull, 0.22, 0.14, 0.08, tailLampMat, sx * 0.78, 1.44, -2.92);
      }
      box(hull, 1.65, 1.02, 0.14, armorSecondary, 0, 1.15, -2.92, -0.12, 0, 0);
      turret.position.set(0, 1.72, 0.25);
      box(turret, 1.62, 0.56, 2.05, armorMat, 0, 0.28, 0);
      box(turret, 1.68, 0.14, 0.38, accentMat, 0, 0.46, -0.82);
      box(turret, 0.46, 0.42, 1.45, armorSecondary, 1.05, 0.36, -0.05);
      for (const dy of [-0.1, 0.1]) cyl(turret, 0.085, 0.085, 1.52, 12, gunmetalMat, 1.05, 0.36 + dy, -0.05, Math.PI / 2, 0, 0);
      barrel.position.set(0, 0.32, 0.95);
      cyl(barrel, 0.055, 0.075, 2.95, 12, gunmetalMat, 0, 0, 1.48, Math.PI / 2, 0, 0);
      cyl(barrel, 0.085, 0.085, 0.26, 10, steelMat, 0, 0, 2.95, Math.PI / 2, 0, 0);

    } else if (kind === 'aa') {
      box(hull, 2.65, 0.78, 5.5, armorSecondary, 0, 0.85, 0);
      box(hull, 2.86, 0.34, 5.2, armorMat, 0, 1.32, 0);
      for (const sx of [-1.42, 1.42]) {
        box(hull, 0.46, 0.10, 5.3, rubberMat, sx, 0.06, 0);
        box(hull, 0.12, 0.52, 5.4, armorMat, sx * 1.15, 0.82, 0);
        for (let i = 0; i < 6; i++) {
          const rw = buildDetailedWheel(THREE, 0.34, 0.38, rubberMat, rimMat, steelMat);
          rw.position.set(sx, 0.38, -1.95 + i * 0.78);
          hull.add(rw);
          wheels.push(rw);
        }
      }
      turret.position.set(0, 1.50, 0);
      box(turret, 2.05, 0.76, 2.25, armorMat, 0, 0.38, 0);
      box(turret, 2.12, 0.16, 0.42, accentMat, 0, 0.62, -0.88);
      const radar = new Group();
      radar.position.set(0, 0.92, -0.72);
      cyl(radar, 0.12, 0.14, 0.36, 10, steelMat, 0, 0.12, 0);
      box(radar, 1.65, 0.46, 0.10, armorSecondary, 0, 0.44, 0, -0.22, 0, 0);
      box(radar, 1.52, 0.36, 0.06, accentMat, 0, 0.44, 0.06, -0.22, 0, 0);
      turret.add(radar);
      rotors.push({ obj: radar, axis: 'y', speed: 4.8 });
      const dome = new Mesh(new SphereGeometry(0.32, 16, 12), armorSecondary);
      dome.position.set(0, 0.86, 0.62);
      turret.add(dome);
      barrel.position.set(0, 0.42, 0.92);
      for (const sx of [-0.72, 0.72]) {
        box(barrel, 0.32, 0.36, 0.92, armorSecondary, sx, 0, 0.25);
        cyl(barrel, 0.052, 0.068, 2.95, 12, gunmetalMat, sx, 0, 1.62, Math.PI / 2, 0, 0);
        cyl(barrel, 0.095, 0.095, 1.15, 10, steelMat, sx * 1.38, 0.22, 0.15, Math.PI / 2, 0, 0);
      }

    } else if (kind === 'jet') {
      const fuselage = createLoftedShell(THREE, armorMat, [
        [-5.6, 0.76, 1.25, 0.46, 0.4], [-4.2, 0.96, 1.28, 0.56, 0.6], [-1.8, 1.06, 1.30, 0.62, 0.7],
        [1.2, 0.98, 1.32, 0.60, 0.7], [3.6, 0.74, 1.26, 0.46, 0.6], [5.8, 0.42, 1.18, 0.28, 0.4],
        [7.4, 0.04, 1.14, 0.04, 0.2],
      ], 24);
      hull.add(fuselage);
      const canopy = createLoftedShell(THREE, glassMat, [
        [1.2, 0.06, 1.78, 0.06], [1.9, 0.44, 1.88, 0.32], [2.9, 0.48, 1.92, 0.36],
        [3.9, 0.36, 1.80, 0.24], [4.7, 0.05, 1.62, 0.05],
      ], 20);
      hull.add(canopy);
      const mainWing = createAirfoil(THREE, armorMat, [
        [-5.2, 1.18, -3.4, 0.85, 0.06], [-3.2, 1.20, -2.5, 1.75, 0.09],
        [-1.0, 1.22, -1.6, 2.65, 0.13], [1.0, 1.22, -1.6, 2.65, 0.13],
        [3.2, 1.20, -2.5, 1.75, 0.09], [5.2, 1.18, -3.4, 0.85, 0.06],
      ], 'x', 14);
      hull.add(mainWing);
      const canards = createAirfoil(THREE, accentMat, [
        [-2.1, 1.26, 2.2, 0.35, 0.035], [-0.95, 1.28, 2.6, 0.72, 0.05],
        [0.95, 1.28, 2.6, 0.72, 0.05], [2.1, 1.26, 2.2, 0.35, 0.035],
      ], 'x', 12);
      hull.add(canards);
      for (const sx of [-1, 1]) {
        const fin = createAirfoil(THREE, accentMat, [
          [1.35, sx * 0.95, -4.4, 1.05, 0.05], [2.85, sx * 1.48, -5.0, 0.42, 0.03],
        ], 'y', 10);
        hull.add(fin);
        box(hull, 0.52, 0.56, 2.2, armorSecondary, sx * 1.02, 1.16, 1.2);
        cyl(hull, 0.30, 0.34, 0.78, 16, gunmetalMat, sx * 0.44, 1.22, -5.78, Math.PI / 2, 0, 0);
        cyl(hull, 0.22, 0.22, 0.12, 14, burnerMat, sx * 0.44, 1.22, -6.16, Math.PI / 2, 0, 0);
      }
      for (const [lx, lz] of [[0, 3.8], [-1.35, -1.8], [1.35, -1.8]]) {
        cyl(hull, 0.05, 0.05, 0.75, 8, steelMat, lx, 0.52, lz);
        const lw = buildDetailedWheel(THREE, 0.22, 0.14, rubberMat, rimMat, steelMat);
        lw.position.set(lx, 0.22, lz);
        hull.add(lw);
      }

    } else if (kind === 'motorcycle') {
      for (const wz of [-0.76, 0.80]) {
        const w = buildDetailedWheel(THREE, 0.38, 0.16, rubberMat, rimMat, steelMat);
        w.position.set(0, 0.38, wz);
        hull.add(w);
        wheels.push(w);
      }
      box(hull, 0.28, 0.34, 0.62, gunmetalMat, 0, 0.52, 0.04);
      const tank = createLoftedShell(THREE, armorMat, [
        [-0.08, 0.18, 0.88, 0.12], [0.22, 0.24, 0.94, 0.15], [0.50, 0.16, 0.92, 0.11],
      ], 16);
      hull.add(tank);
      box(hull, 0.30, 0.12, 0.84, rubberMat, 0, 0.84, -0.42);
      box(hull, 0.24, 0.10, 0.48, accentMat, 0, 0.92, -0.78, 0.22, 0, 0);
      for (const sx of [-0.13, 0.13]) cyl(hull, 0.032, 0.032, 0.88, 10, steelMat, sx, 0.78, 0.64, -0.35, 0, 0);
      cyl(hull, 0.022, 0.022, 0.84, 8, steelMat, 0, 1.16, 0.48, 0, 0, Math.PI / 2);
      cyl(hull, 0.10, 0.09, 0.12, 14, lampMat, 0, 0.98, 0.78, Math.PI / 2, 0, 0);
      cyl(hull, 0.055, 0.045, 0.92, 10, steelMat, 0.22, 0.48, -0.38, 1.42, 0, 0);

    } else {
      const isScout = kind === 'scout';
      const len = isScout ? 4.35 : 4.95;
      const w = isScout ? 1.98 : 2.15;
      box(hull, w * 0.82, 0.28, len * 0.94, steelMat, 0, 0.46, 0);
      box(hull, w, 0.68, len * 0.66, armorMat, 0, 0.94, -0.25);
      box(hull, w * 0.94, 0.48, 1.38, armorMat, 0, 1.02, len * 0.34, 0.12, 0, 0);
      box(hull, w * 0.64, 0.32, 0.10, gunmetalMat, 0, 0.94, len * 0.49);
      box(hull, w * 1.02, 0.18, 0.24, steelMat, 0, 0.62, len * 0.50);
      box(hull, w * 0.94, 0.62, 0.08, glassMat, 0, 1.56, len * 0.14, -0.26, 0, 0);
      box(hull, w * 0.96, 0.12, isScout ? 1.85 : 2.55, armorMat, 0, 1.88, isScout ? -0.45 : -0.62);
      box(hull, w * 1.02, 0.14, 1.45, accentMat, 0, 1.04, -0.25);
      for (const sx of [-w * 0.54, w * 0.54]) {
        for (const wz of [-len * 0.32, len * 0.31]) {
          const wh = buildDetailedWheel(THREE, 0.46, 0.32, rubberMat, rimMat, steelMat);
          wh.position.set(sx, 0.46, wz);
          hull.add(wh);
          wheels.push(wh);
        }
        box(hull, 0.24, 0.14, 0.10, lampMat, sx * 0.72, 0.96, len * 0.50);
        box(hull, 0.24, 0.14, 0.08, tailLampMat, sx * 0.78, 0.98, -len * 0.48);
      }
      turret.position.set(0, 1.96, -0.25);
      cyl(turret, 0.46, 0.48, 0.12, 16, steelMat, 0, 0.06, 0);
      box(turret, 0.62, 0.42, 0.08, armorSecondary, 0, 0.32, 0.38);
      barrel.position.set(0, 0.32, 0.32);
      cyl(barrel, 0.032, 0.04, 1.38, 10, gunmetalMat, 0, 0, 0.68, Math.PI / 2, 0, 0);
      box(barrel, 0.16, 0.18, 0.24, armorSecondary, 0.16, -0.04, 0.12);
    }

    return { root, hull, turret, barrel, rotors, wheels };
  }

  function createPortHeavyVehicles(world, { getConquest, onRemoteEvent } = {}) {
    const { THREE, scene, physics, fx, audio } = world;
    const { Group, Mesh, SphereGeometry, CylinderGeometry, ConeGeometry, MeshBasicMaterial, MeshStandardMaterial, Vector3 } = THREE;
    const t = (en, zh) => window.SaltlineLocale?.t(en, zh) ?? en;

    const root = new Group();
    root.name = 'port-mp-heavy-vehicles';
    scene.add(root);

    const vehicles = [];
    const projectiles = [];
    let nextId = 1;
    let active = false;
    let playerVehicle = null;
    let thirdPerson = true;
    let weaponSlot = 0;
    let parachuting = false;
    let atAmmo = 2;
    let aaAmmo = 2;
    let infantryCooldown = 0;
    const keys = { w: false, s: false, a: false, d: false, shift: false, space: false, ctrl: false, fire: false };

    const chuteGroup = new Group();
    const chuteCanopy = new Mesh(
      new ConeGeometry(2.1, 1.1, 12, 1, true),
      new MeshStandardMaterial({ color: 0xd9e1e6, roughness: 0.85, side: THREE.DoubleSide })
    );
    chuteCanopy.position.y = 3.2;
    chuteGroup.add(chuteCanopy);
    chuteGroup.visible = false;
    root.add(chuteGroup);

    const shellGeo = new SphereGeometry(0.14, 8, 8);
    const missileGeo = new CylinderGeometry(0.06, 0.08, 0.95, 8);
    missileGeo.rotateX(Math.PI / 2);
    const shellMat = new MeshBasicMaterial({ color: 0xffd36e });
    const missileMat = new MeshBasicMaterial({ color: 0xff6b47 });

    const hud = document.createElement('div');
    hud.className = 'port-heavy-veh-hud';
    hud.dataset.noLocalize = '';
    hud.hidden = true;
    hud.style.cssText = 'position:fixed;bottom:22px;left:50%;transform:translateX(-50%);z-index:25;background:rgba(8,13,18,.88);border:1px solid #5c7886;border-top:3px solid #64d5ff;padding:8px 16px;color:#edf6f8;font:600 12px/1.4 system-ui,-apple-system,sans-serif;display:flex;gap:16px;align-items:center;pointer-events:none;white-space:nowrap;';

    const warnBanner = document.createElement('div');
    warnBanner.className = 'port-missile-warning';
    warnBanner.dataset.noLocalize = '';
    warnBanner.hidden = true;
    warnBanner.style.cssText = 'position:fixed;top:14%;left:50%;transform:translateX(-50%);z-index:30;padding:10px 26px;font:900 38px/1.1 system-ui,-apple-system,sans-serif;letter-spacing:.12em;text-align:center;pointer-events:none;border:3px solid #ff3b28;background:rgba(45,6,6,.88);color:#ff5a40;text-shadow:0 2px 12px #000;';

    const promptEl = document.createElement('div');
    promptEl.dataset.noLocalize = '';
    promptEl.hidden = true;
    promptEl.style.cssText = 'position:fixed;bottom:108px;left:50%;transform:translateX(-50%);z-index:21;background:rgba(10,16,22,.86);border-left:3px solid #64d5ff;padding:6px 14px;color:#edf7fa;font:700 13px/1.3 system-ui,sans-serif;pointer-events:none;';

    const launcherHud = document.createElement('div');
    launcherHud.dataset.noLocalize = '';
    launcherHud.hidden = true;
    launcherHud.style.cssText = 'position:fixed;right:18px;bottom:146px;z-index:20;display:flex;gap:8px;font:600 12px/1.2 system-ui,sans-serif;color:#e8e4da;pointer-events:none;';
    const atChip = document.createElement('span');
    const aaChip = document.createElement('span');
    for (const el of [atChip, aaChip]) el.style.cssText = 'background:rgba(10,16,22,.82);border:1px solid #586c76;padding:4px 8px;';
    launcherHud.append(atChip, aaChip);

    const appEl = document.getElementById('app');
    if (appEl) appEl.append(hud, warnBanner, promptEl, launcherHud);

    function renderLauncherHud() {
      if (!active) return;
      atChip.textContent = t(`[Z] AT Rocket ×${atAmmo}`, `[Z] 反装甲火箭 ×${atAmmo}`);
      aaChip.textContent = t(`[B] AA Stinger ×${aaAmmo}`, `[B] 防空导弹 ×${aaAmmo}`);
    }

    function spawnVehicle(kind, pos, { team = 'blue', yaw = 0, requisitioned = false, id = null } = {}) {
      const spec = VEHICLE_SPECS[kind];
      if (!spec) return null;
      const vid = id ?? nextId++;
      const existing = vehicles.find(v => v.id === vid);
      if (existing) return existing;
      const model = buildVehicleMesh(THREE, world, kind, team);
      const baseY = pos.y ?? 0;
      let sx = pos.x, sz = pos.z;
      let y = typeof physics?.groundHeight === 'function' ? physics.groundHeight(sx, sz, baseY + 1.5) : baseY;
      // Avoid spawning ground/helipad vehicles on top of building roofs or floating high above road level
      if (typeof physics?.groundHeight === 'function' && y > baseY + 2.2) {
        const offsets = [[0, 6], [6, 0], [-6, 0], [0, -6], [10, 0], [-10, 0]];
        for (const [ox, oz] of offsets) {
          const gy = physics.groundHeight(sx + ox, sz + oz, baseY + 1.5);
          if (gy <= baseY + 2.0) { sx += ox; sz += oz; y = gy; break; }
        }
        if (y > baseY + 2.2) y = baseY;
      }
      const startPos = new Vector3(sx, y, sz);
      model.root.position.copy(startPos);
      model.root.rotation.y = yaw;
      root.add(model.root);

      const v = {
        id: vid, kind, spec, team, requisitioned,
        spawn: startPos.clone(), pos: startPos, altitude: 0,
        yaw, turretYaw: yaw, turretPitch: 0, roll: 0, flightPitch: 0, speed: 0,
        hp: spec.maxHp, maxHp: spec.maxHp, alive: true,
        wreckUntil: 0, respawnAt: 0, driverId: null,
        nextShot: 0, nextMissile: 0, flareUntil: 0, nextFlare: 0,
        warningUntil: 0, incomingUntil: 0, model,
      };
      vehicles.push(v);
      return v;
    }

    function start(basePos) {
      stop();
      active = true;
      atAmmo = 2;
      aaAmmo = 2;
      launcherHud.hidden = false;
      renderLauncherHud();

      const origin = basePos ? basePos.clone() : new Vector3(-26, 0, -20);
      const pool = [
        ['tank',       -10, -8],
        ['ifv',        -18, -8],
        ['aa',         -26, -8],
        ['motorcycle', -6,  -15],
        ['helicopter', -20, -22],
        ['jet',        -38, -26],
      ];
      for (const [kind, dx, dz] of pool) {
        spawnVehicle(kind, new Vector3(origin.x + dx, origin.y, origin.z + dz), { team: 'blue', yaw: 0 });
      }
    }

    function stop() {
      active = false;
      if (playerVehicle) world.weapon?.setVisible?.(true);
      playerVehicle = null;
      for (const key of Object.keys(keys)) keys[key] = false;
      parachuting = false;
      chuteGroup.visible = false;
      hud.hidden = true;
      warnBanner.hidden = true;
      promptEl.hidden = true;
      launcherHud.hidden = true;
      for (const v of vehicles) root.remove(v.model.root);
      vehicles.length = 0;
      for (const p of projectiles) root.remove(p.mesh);
      projectiles.length = 0;
    }

    function airdrop(kind, player) {
      if (!active || !player?.pos || !VEHICLE_SPECS[kind]) return null;
      const yaw = player.yaw ?? 0;
      const dropPos = new Vector3(player.pos.x - Math.sin(yaw) * 7.5, player.pos.y, player.pos.z - Math.cos(yaw) * 7.5);
      const v = spawnVehicle(kind, dropPos, { team: 'blue', yaw, requisitioned: true });
      if (v) {
        fx?.smoke?.(v.pos, { size: 5.0, life: 2.8, rise: 0.35, count: 4, alpha: 0.65 });
        world.hud?.message?.(
          t(`${v.spec.name} airdropped nearby! Press [F] to board`, `${v.spec.zh} 已空投至附近！按 [F] 登车`),
          3.0
        );
        onRemoteEvent?.('vehicleSpawn', { id: v.id, kind: v.kind, pos: [v.pos.x, v.pos.y, v.pos.z], yaw });
      }
      return v;
    }

    function damageVehicle(v, amount, fromRemote = false) {
      if (!v || !v.alive) return;
      v.hp = Math.max(0, v.hp - amount);
      if (v === playerVehicle) {
        world.player?.addShake?.(clamp(amount / v.maxHp * 1.1, 0.12, 0.45));
        world.hud?.message?.(t(`-${Math.round(amount)} ARMOR`, `装甲受损 -${Math.round(amount)}`), 1.3);
      }
      if (!fromRemote) onRemoteEvent?.('vehicleHit', { id: v.id, damage: amount });
      if (v.hp <= 0) {
        v.alive = false;
        v.speed = 0;
        const now = getConquest?.()?.elapsed ?? 0;
        v.wreckUntil = now + 12;
        v.respawnAt = v.requisitioned ? Infinity : now + v.spec.respawn;
        fx?.explosion?.(v.pos.clone().add(new Vector3(0, v.altitude + 1.2, 0)), 2.2);
        audio?.play?.('rail_touchdown', { pos: v.pos, ref: 24, gain: 0.95, jitter: 0.04 });
        if (v === playerVehicle) {
          exitVehicle(true);
          world.player?.damage?.(999, v.pos, new Vector3(0, 1, 0), 'vehicle-explosion');
        }
      }
    }

    function enterVehicle(v) {
      if (!v || !v.alive || playerVehicle || world.vehicle?.driving || world.mpGadgets?.driving) return false;
      playerVehicle = v;
      v.driverId = 'local';
      weaponSlot = 0;
      world.weapon?.setVisible?.(false);
      hud.hidden = false;
      promptEl.hidden = true;
      world.hud?.message?.(
        v.spec.airborne
          ? t(`Piloting ${v.spec.name} · Space/Ctrl Alt · [1/2] Weapons · [X] Flares · [V] Cam · [F] Eject`,
              `正在驾驶 ${v.spec.zh} · 空格/Ctrl 升降 · [1/2] 武器 · [X] 热诱弹 · [V] 视角 · [F] 跳伞`)
          : t(`Driving ${v.spec.name} · [1/2] Weapons · [X] Countermeasure · [V] Cam · [F] Exit`,
              `正在驾驶 ${v.spec.zh} · [1/2] 武器 · [X] 反制/烟幕 · [V] 视角 · [F] 下车`),
        3.6
      );
      return true;
    }

    function exitVehicle(killed = false) {
      if (!playerVehicle) return;
      const v = playerVehicle;
      v.driverId = null;
      playerVehicle = null;
      hud.hidden = true;
      warnBanner.hidden = true;
      const p = world.player;
      if (p && !killed) {
        p.pos.set(v.pos.x + Math.cos(v.yaw) * (v.spec.radius + 1.2), v.pos.y + v.altitude + 0.5, v.pos.z - Math.sin(v.yaw) * (v.spec.radius + 1.2));
        if (v.altitude > 6) {
          parachuting = true;
          chuteGroup.visible = true;
          world.hud?.message?.(t('Parachute deployed (5 m/s descent)', '高空跳伞已开伞（5 m/s 安全降落）'), 2.5);
        }
        world.weapon?.setVisible?.(true);
      }
    }

    function fireProjectile({ origin, dir, speed, gravity, damage, blast, homingTarget = null, isMissile = false, ownerTeam = 'blue', fromRemote = false }) {
      const mesh = new Mesh(isMissile ? missileGeo : shellGeo, isMissile ? missileMat : shellMat);
      mesh.position.copy(origin);
      root.add(mesh);
      const vel = dir.clone().normalize().multiplyScalar(speed);
      projectiles.push({
        mesh, pos: origin.clone(), vel, speed, gravity, damage, blast,
        homingTarget, isMissile, ownerTeam, life: isMissile ? 7.0 : 3.2,
      });
      if (!fromRemote) {
        onRemoteEvent?.('heavyShot', {
          origin: [origin.x, origin.y, origin.z],
          dir: [dir.x, dir.y, dir.z],
          speed, gravity, damage, blast, isMissile,
        });
      }
    }

    function triggerCountermeasure(v) {
      const now = getConquest?.()?.elapsed ?? 0;
      if (!v || now < v.nextFlare) return;
      if (v.kind === 'scout') {
        v.nextFlare = now + 20;
        world.hud?.message?.(t('R4 Radar Scan active (12s)', 'R4 侦察车雷达扫描已开启（12 秒）'), 2.2);
        return;
      }
      if (v.kind === 'transport') {
        v.nextFlare = now + 24;
        world.mpGadgets?.placeAmmoBox?.(v.pos);
        return;
      }
      v.flareUntil = now + 5;
      v.nextFlare = now + 24;
      v.warningUntil = 0;
      v.incomingUntil = 0;
      for (const p of projectiles) {
        if (p.isMissile && p.homingTarget === v) p.homingTarget = null;
      }
      for (let i = 0; i < 4; i++) {
        const puff = v.pos.clone().add(new Vector3((Math.random() - 0.5) * 3, v.altitude + 1.2, (Math.random() - 0.5) * 3));
        fx?.smoke?.(puff, { size: 3.5, life: 2.2, rise: -0.2, count: 2, alpha: 0.7 });
      }
      world.hud?.message?.(t('Flares / Countermeasures deployed (5s)', '热诱弹 / 干扰烟幕已释放（5 秒免疫锁定）'), 2.2);
    }

    function findMissileTarget(origin, dir, airOnly) {
      let best = null;
      let bestScore = 0.78;
      for (const v of vehicles) {
        if (!v.alive || v === playerVehicle || v.team === 'blue') continue;
        if (airOnly && !v.spec.airborne) continue;
        const delta = v.pos.clone().add(new Vector3(0, v.altitude + 1.2, 0)).sub(origin);
        const d = delta.length();
        if (d > 380 || d < 8) continue;
        const dot = delta.normalize().dot(dir);
        if (dot > bestScore) { bestScore = dot; best = v; }
      }
      if (!best) {
        for (const e of world.enemies?.list ?? []) {
          if (!e?.alive || !e.pos) continue;
          if (airOnly && e.type !== 'gull') continue;
          const delta = e.pos.clone().sub(origin);
          const d = delta.length();
          if (d > 260 || d < 6) continue;
          const dot = delta.normalize().dot(dir);
          if (dot > bestScore) { bestScore = dot; best = e; }
        }
      }
      return best;
    }

    function fireVehicleWeapon(v) {
      const now = getConquest?.()?.elapsed ?? 0;
      const spec = v.spec;
      if (spec.damage <= 0) return;
      const yaw = v.spec.airborne ? v.yaw : v.turretYaw;
      const pitch = v.spec.airborne ? v.flightPitch : v.turretPitch;
      const dir = new Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).normalize();
      const origin = v.pos.clone().add(new Vector3(0, v.altitude + (v.spec.airborne ? 1.4 : 2.1), 0)).addScaledVector(dir, v.spec.radius + 0.8);

      if (weaponSlot === 1 && spec.hasMissile) {
        if (now < v.nextMissile) return;
        v.nextMissile = now + 7.0;
        const target = findMissileTarget(origin, dir, v.kind === 'aa');
        fireProjectile({ origin, dir, speed: 95, gravity: 0, damage: 135, blast: 5.5, homingTarget: target, isMissile: true });
        audio?.play?.('rail_missile_pass', { pos: origin, ref: 18, gain: 0.75, jitter: 0.04 });
        return;
      }
      if (weaponSlot === 1 && spec.hasCoax) {
        if (now < v.nextShot) return;
        v.nextShot = now + 0.11;
        fireProjectile({ origin, dir, speed: 260, gravity: 0.15, damage: 22, blast: 0, isMissile: false });
        audio?.play?.('sidearm_shot', { pos: origin, ref: 14, gain: 0.45, jitter: 0.04 });
        return;
      }
      if (now < v.nextShot) return;
      v.nextShot = now + spec.interval;
      fireProjectile({ origin, dir, speed: spec.projSpeed, gravity: spec.gravity, damage: spec.damage, blast: spec.blast, isMissile: false });
      audio?.play?.('rail_touchdown', { pos: origin, ref: 20, gain: 0.7, jitter: 0.05 });
    }

    function onKey(e, down) {
      if (!active) return;
      if (down && (world.game?.state !== 'playing' || document.querySelector('.developer-menu[open]') || document.querySelector('.menu.open'))) return;
      if (e.code === 'KeyW') keys.w = down;
      else if (e.code === 'KeyS') keys.s = down;
      else if (e.code === 'KeyA') keys.a = down;
      else if (e.code === 'KeyD') keys.d = down;
      else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = down;
      else if (e.code === 'Space') keys.space = down;
      else if (e.code === 'ControlLeft' || e.code === 'KeyC') keys.ctrl = down;
      else if (down && !e.repeat && e.code === 'KeyF') {
        if (playerVehicle) {
          e.saltlineVehicleHandled = true;
          exitVehicle(false);
        } else if (!world.vehicle?.driving && !world.mpGadgets?.driving && world.player?.alive) {
          const near = vehicles.find(v => v.alive && v.pos.distanceTo(world.player.pos) <= v.spec.radius + 3.2);
          if (near && enterVehicle(near)) e.saltlineVehicleHandled = true;
        }
      } else if (down && !e.repeat && e.code === 'KeyV' && playerVehicle) {
        thirdPerson = !thirdPerson;
      } else if (down && !e.repeat && e.code === 'Digit1' && playerVehicle) {
        weaponSlot = 0;
      } else if (down && !e.repeat && e.code === 'Digit2' && playerVehicle) {
        if (playerVehicle.spec.hasMissile || playerVehicle.spec.hasCoax) weaponSlot = 1;
      } else if (down && !e.repeat && e.code === 'KeyX' && playerVehicle) {
        e.preventDefault();
        triggerCountermeasure(playerVehicle);
      } else if (down && !e.repeat && !playerVehicle && !world.vehicle?.driving && !world.mpGadgets?.driving && world.player?.alive && infantryCooldown <= 0) {
        if (e.code === 'KeyZ' && atAmmo > 0) {
          e.preventDefault();
          atAmmo--;
          infantryCooldown = 1.4;
          renderLauncherHud();
          const p = world.player;
          const dir = new Vector3(-Math.sin(p.yaw) * Math.cos(p.pitch), Math.sin(p.pitch), -Math.cos(p.yaw) * Math.cos(p.pitch)).normalize();
          const origin = p.pos.clone().add(new Vector3(0, 1.5, 0)).addScaledVector(dir, 0.8);
          fireProjectile({ origin, dir, speed: 85, gravity: 1.5, damage: 135, blast: 5.0, isMissile: true });
          audio?.play?.('rail_missile_pass', { pos: origin, ref: 16, gain: 0.72, jitter: 0.04 });
        } else if (e.code === 'KeyB' && aaAmmo > 0) {
          e.preventDefault();
          aaAmmo--;
          infantryCooldown = 1.6;
          renderLauncherHud();
          const p = world.player;
          const dir = new Vector3(-Math.sin(p.yaw) * Math.cos(p.pitch), Math.sin(p.pitch), -Math.cos(p.yaw) * Math.cos(p.pitch)).normalize();
          const origin = p.pos.clone().add(new Vector3(0, 1.55, 0)).addScaledVector(dir, 0.8);
          const target = findMissileTarget(origin, dir, true);
          fireProjectile({ origin, dir, speed: 105, gravity: 0, damage: 135, blast: 4.5, homingTarget: target, isMissile: true });
          audio?.play?.('rail_missile_pass', { pos: origin, ref: 16, gain: 0.75, jitter: 0.04 });
        }
      }
    }
    const onMouseDown = e => { if (e.button === 0 && playerVehicle) keys.fire = true; };
    const onMouseUp = e => { if (e.button === 0) keys.fire = false; };
    const onKeyDown = e => onKey(e, true);
    const onKeyUp = e => onKey(e, false);
    window.addEventListener('keydown', onKeyDown, { signal: world.chapterSignal });
    window.addEventListener('keyup', onKeyUp, { signal: world.chapterSignal });
    window.addEventListener('mousedown', onMouseDown, { signal: world.chapterSignal });
    window.addEventListener('mouseup', onMouseUp, { signal: world.chapterSignal });

    const tmpA = new Vector3();
    const tmpB = new Vector3();
    let lastHudText = '';
    let lastWarnText = '';
    let lastPromptText = '';

    function update(dt, player, enemies) {
      if (!active || !(dt > 0)) return;
      const conquest = getConquest?.();
      const now = conquest?.elapsed ?? 0;
      if (infantryCooldown > 0) infantryCooldown = Math.max(0, infantryCooldown - dt);

      if (parachuting && player?.pos) {
        const floor = typeof physics?.groundHeight === 'function' ? physics.groundHeight(player.pos.x, player.pos.z, player.pos.y + 1) : 0;
        if (player.pos.y <= floor + 0.35) {
          player.pos.y = floor;
          parachuting = false;
          chuteGroup.visible = false;
        } else {
          player.pos.y = Math.max(floor, player.pos.y - 5.0 * dt);
          if (player.vel) player.vel.y = 0;
          chuteGroup.position.copy(player.pos);
        }
      }

      let nearestPrompt = null;
      for (const v of vehicles) {
        if (!v.alive) {
          v.model.root.visible = now < v.wreckUntil;
          if (now >= v.respawnAt) {
            v.alive = true;
            v.hp = v.maxHp;
            v.pos.copy(v.spawn);
            v.altitude = 0;
            v.speed = 0;
            v.roll = 0;
            v.flightPitch = 0;
            v.model.root.visible = true;
          }
          continue;
        }

        for (const r of v.model.rotors) {
          const mult = v.spec.airborne ? (v === playerVehicle || v.altitude > 0.5 ? 1 : 0.15) : 1;
          r.obj.rotation[r.axis] += r.speed * mult * dt;
        }
        for (const w of v.model.wheels) {
          w.rotation.x += v.speed * dt * 1.4;
        }

        if (v === playerVehicle && player) {
          const throttle = (keys.w ? 1 : 0) - (keys.s ? 1 : 0);
          const side = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
          const upInput = (keys.space ? 1 : 0) - (keys.ctrl ? 1 : 0);

          if (v.spec.airborne) {
            const move = controlFlight(v, throttle, side, dt, player.yaw, player.pitch, keys.shift, keys.ctrl);
            v.pos.x = clamp(v.pos.x + move.dx, -220, 45);
            v.pos.z = clamp(v.pos.z + move.dz, -220, 140);
            if (v.kind === 'jet') {
              v.altitude = clamp(v.altitude + Math.sin(v.flightPitch) * v.speed * dt + upInput * 12 * dt, 0, 110);
            } else {
              v.altitude = clamp(v.altitude + upInput * 15 * dt, 0, 85);
            }
          } else {
            const targetSpd = throttle >= 0 ? throttle * v.spec.maxForward : throttle * v.spec.maxReverse;
            const rate = throttle !== 0 ? v.spec.accel : v.spec.brake;
            v.speed += clamp(targetSpd - v.speed, -rate * dt, rate * dt);
            v.yaw -= side * v.spec.turnRate * (Math.abs(v.speed) > 0.4 ? Math.sign(v.speed) : 1) * dt;
            v.pos.x = clamp(v.pos.x + Math.sin(v.yaw) * v.speed * dt, -215, 28);
            v.pos.z = clamp(v.pos.z + Math.cos(v.yaw) * v.speed * dt, -215, 138);
            v.turretYaw = (player.yaw ?? 0) + Math.PI;
            v.turretPitch = clamp(player.pitch ?? 0, -0.25, 0.55);
          }

          const g = typeof physics?.groundHeight === 'function' ? physics.groundHeight(v.pos.x, v.pos.z, v.pos.y + 1.5) : 0;
          v.pos.y = g;
          if (keys.fire) fireVehicleWeapon(v);

          player.pos.set(v.pos.x, v.pos.y + v.altitude + 1.0, v.pos.z);
          if (world.camera) {
            const camYaw = v.spec.airborne ? v.yaw : v.turretYaw;
            if (thirdPerson) {
              const dist = v.kind === 'jet' ? 14 : v.spec.airborne ? 11.5 : 8.5;
              const hOff = v.spec.airborne ? 4.4 : 3.6;
              world.camera.position.set(
                v.pos.x - Math.sin(camYaw) * dist,
                v.pos.y + v.altitude + hOff,
                v.pos.z - Math.cos(camYaw) * dist
              );
              world.camera.lookAt(v.pos.x + Math.sin(camYaw) * 14, v.pos.y + v.altitude + 1.8, v.pos.z + Math.cos(camYaw) * 14);
            } else {
              world.camera.position.set(v.pos.x, v.pos.y + v.altitude + 2.35, v.pos.z);
              world.camera.lookAt(v.pos.x + Math.sin(camYaw) * 20, v.pos.y + v.altitude + 2.35 + Math.sin(v.turretPitch) * 10, v.pos.z + Math.cos(camYaw) * 20);
            }
          }

          const weaponName = weaponSlot === 1
            ? (v.spec.hasMissile ? t('Guided Missile', '制导导弹') : t('Coax MG', '同轴机枪'))
            : t('Primary Cannon', '主武器');
          const cmReady = now >= v.nextFlare ? t('[X] Ready', '[X] 就绪') : `${Math.ceil(v.nextFlare - now)}s`;
          const nextHud = `${t(v.spec.name, v.spec.zh)} · HP ${Math.ceil(v.hp)}/${v.maxHp} · ${Math.round(Math.abs(v.speed) * 3.6)} KM/H${v.spec.airborne ? ` · ALT ${Math.round(v.altitude)}m` : ''} · ${weaponName} · CM ${cmReady}`;
          if (nextHud !== lastHudText) { lastHudText = nextHud; hud.textContent = nextHud; }

          if (now < v.incomingUntil) {
            warnBanner.hidden = false;
            warnBanner.style.borderColor = '#ff3b28';
            warnBanner.style.color = '#ff5a40';
            const nextWarn = t('MISSILE INCOMING — PRESS [X] FLARES', '导弹来袭 — 按 [X] 释放热诱弹');
            if (nextWarn !== lastWarnText) { lastWarnText = nextWarn; warnBanner.textContent = nextWarn; }
          } else if (now < v.warningUntil) {
            warnBanner.hidden = false;
            warnBanner.style.borderColor = '#ffb347';
            warnBanner.style.color = '#ffd27d';
            const nextWarn = t('LOCK WARNING', '正在被雷达锁定');
            if (nextWarn !== lastWarnText) { lastWarnText = nextWarn; warnBanner.textContent = nextWarn; }
          } else if (!warnBanner.hidden) {
            warnBanner.hidden = true;
          }
        } else {
          if (v.spec.airborne && v.altitude > 0) {
            v.altitude = Math.max(0, v.altitude - 9.8 * dt);
          }
          if (!playerVehicle && !world.vehicle?.driving && !world.mpGadgets?.driving && player?.alive && player.pos.distanceTo(v.pos) <= v.spec.radius + 3.2) {
            nearestPrompt = t(`[F] Board ${v.spec.name}`, `[F] 驾驶 ${v.spec.zh}`);
          }
        }

        v.model.root.position.set(v.pos.x, v.pos.y + v.altitude, v.pos.z);
        v.model.root.rotation.set(v.flightPitch, v.yaw, v.roll, 'YXZ');
        if (!v.spec.airborne) {
          v.model.turret.rotation.y = v.turretYaw - v.yaw;
          v.model.barrel.rotation.x = -v.turretPitch;
        }
      }

      promptEl.hidden = !nearestPrompt;
      if (nearestPrompt && nearestPrompt !== lastPromptText) {
        lastPromptText = nearestPrompt;
        promptEl.textContent = nearestPrompt;
      }

      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.life -= dt;
        if (p.isMissile && p.homingTarget) {
          const tgt = p.homingTarget;
          if (!tgt.alive || (tgt.flareUntil && now < tgt.flareUntil)) {
            p.homingTarget = null;
          } else {
            if (tgt.incomingUntil !== undefined) tgt.incomingUntil = now + 0.6;
            tmpA.set(tgt.pos.x - p.pos.x, tgt.pos.y + (tgt.altitude ?? 0) + 1.0 - p.pos.y, tgt.pos.z - p.pos.z);
            if (!guideMissile(p.vel, tmpA, p.speed, dt)) p.homingTarget = null;
          }
        } else {
          p.vel.y -= p.gravity * dt;
        }
        p.pos.addScaledVector(p.vel, dt);
        p.mesh.position.copy(p.pos);
        if (p.isMissile) {
          tmpA.copy(p.pos).add(p.vel);
          p.mesh.lookAt(tmpA);
        }

        const groundY = typeof physics?.groundHeight === 'function' ? physics.groundHeight(p.pos.x, p.pos.z, p.pos.y + 1) : 0;
        let exploded = p.life <= 0 || p.pos.y <= groundY + 0.1;

        if (!exploded) {
          const hitR = p.isMissile ? 2.2 : 1.5;
          const hitR2 = hitR * hitR;
          for (const e of enemies ?? []) {
            if (!e?.alive || !e.pos) continue;
            if (p.pos.distanceToSquared(e.pos) < hitR2) {
              tmpB.copy(p.vel).normalize();
              e.damage?.(p.damage, e.pos, tmpB, 'vehicle');
              exploded = true;
              break;
            }
          }
        }
        if (!exploded) {
          for (const v of vehicles) {
            if (!v.alive || v === playerVehicle) continue;
            tmpA.set(v.pos.x, v.pos.y + v.altitude + 1.2, v.pos.z);
            const vr = v.spec.radius + 0.8;
            if (p.pos.distanceToSquared(tmpA) < vr * vr) {
              damageVehicle(v, p.damage);
              exploded = true;
              break;
            }
          }
        }

        if (exploded) {
          if (p.blast > 0) {
            fx?.explosion?.(p.pos, Math.min(2.0, p.blast * 0.35));
            const blast2 = p.blast * p.blast;
            for (const e of [...(enemies ?? [])]) {
              if (!e?.alive || !e.pos) continue;
              const d2 = p.pos.distanceToSquared(e.pos);
              if (d2 < blast2) {
                const d = Math.sqrt(d2);
                tmpB.subVectors(e.pos, p.pos).normalize();
                e.damage?.(p.damage * (1 - d / p.blast), e.pos, tmpB, 'vehicle-blast');
              }
            }
          }
          root.remove(p.mesh);
          projectiles.splice(i, 1);
        }
      }
    }

    function applyRemoteVehicles(list) {
      if (!active || !Array.isArray(list)) return;
      for (const rv of list) {
        let v = vehicles.find(entry => entry.id === rv.id);
        if (!v && VEHICLE_SPECS[rv.kind]) {
          v = spawnVehicle(rv.kind, new Vector3(...(rv.pos ?? [0, 0, 0])), { team: rv.team ?? 'blue', yaw: rv.yaw ?? 0, id: rv.id });
        }
        if (!v || v === playerVehicle) continue;
        if (Array.isArray(rv.pos)) v.pos.set(rv.pos[0], rv.pos[1], rv.pos[2]);
        if (typeof rv.altitude === 'number') v.altitude = rv.altitude;
        if (typeof rv.yaw === 'number') v.yaw = rv.yaw;
        if (typeof rv.turretYaw === 'number') v.turretYaw = rv.turretYaw;
        if (typeof rv.roll === 'number') v.roll = rv.roll;
        if (typeof rv.flightPitch === 'number') v.flightPitch = rv.flightPitch;
        if (typeof rv.hp === 'number') v.hp = rv.hp;
        if (typeof rv.alive === 'boolean') v.alive = rv.alive;
      }
    }

    function exportVehicles() {
      return vehicles.map(v => ({
        id: v.id, kind: v.kind, team: v.team,
        pos: [v.pos.x, v.pos.y, v.pos.z],
        altitude: v.altitude, yaw: v.yaw, turretYaw: v.turretYaw,
        roll: v.roll, flightPitch: v.flightPitch,
        hp: Math.round(v.hp), alive: v.alive,
      }));
    }

    function dispose() {
      stop();
      window.removeEventListener?.('keydown', onKeyDown);
      window.removeEventListener?.('keyup', onKeyUp);
      window.removeEventListener?.('mousedown', onMouseDown);
      window.removeEventListener?.('mouseup', onMouseUp);
      root.removeFromParent();
      hud.remove();
      warnBanner.remove();
      promptEl.remove();
      launcherHud.remove();
    }

    return {
      start, stop, update, airdrop, damageVehicle, fireProjectile,
      applyRemoteVehicles, exportVehicles, dispose,
      get active() { return active; },
      get driving() { return Boolean(playerVehicle); },
      get currentVehicle() { return playerVehicle; },
      get vehicles() { return vehicles; },
      get parachuting() { return parachuting; },
    };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VEHICLE_SPECS, controlFlight, guideMissile, createPortHeavyVehicles };
  } else {
    globalThis.IRONFRONT_VEHICLE_SPECS = VEHICLE_SPECS;
    globalThis.createPortHeavyVehicles = createPortHeavyVehicles;
  }
})();
