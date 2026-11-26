/* Realistic, Oppressive COD / Battlefield 6-Style Major Disasters & Random Event Director:
 * - Dynamic Storm-Sky Darkening & Sea-Mist Fog Surge (restores cleanly after disaster ends)
 * - 12m Dark-Ocean Tsunami (deep slate-teal breaking wall, axial crestRoll, pre-impact sub-tremor)
 * - Coastal Supercell Lightning Storm (multi-forked bolts + realistic delayed rolling thunderclap)
 * - Anvil Artillery Barrage (red target rings -> 1.65s warning -> fiery blast + scorched crater decals)
 * - Harbor Fuel-Tank Chain Explosion (6-stage cascading dock detonation)
 * - Random Event Director (manual trigger + toggleable open-world auto-random mode). */
(() => {
  function injectStyles() {
    if (document.getElementById('saltline-disaster-style')) return;
    const style = document.createElement('style');
    style.id = 'saltline-disaster-style';
    style.textContent = `
      .sl-water-vignette{position:fixed;inset:0;z-index:15;pointer-events:none;background:radial-gradient(circle at 50% 50%,rgba(12,48,64,0) 38%,rgba(8,36,50,.78) 100%);opacity:0;transition:opacity .25s ease}
      .sl-storm-vignette{position:fixed;inset:0;z-index:14;pointer-events:none;background:radial-gradient(circle at 50% 35%,rgba(8,14,20,0) 45%,rgba(5,10,16,.58) 100%);opacity:0;transition:opacity 1.2s ease}
      .sl-storm-flash{position:fixed;inset:0;z-index:16;pointer-events:none;background:rgba(210,235,255,.78);opacity:0;transition:opacity .07s ease-out}
      .sl-blast-flash{position:fixed;inset:0;z-index:16;pointer-events:none;background:radial-gradient(circle at 50% 50%,rgba(255,218,138,.52) 0%,rgba(255,112,36,.28) 52%,rgba(255,64,18,0) 82%);opacity:0;transition:opacity .12s ease-out}
      .sl-disaster-banner{position:fixed;top:148px;left:50%;transform:translateX(-50%);z-index:21;background:rgba(10,16,22,.92);border:1px solid rgba(102,217,240,.65);border-left:4px solid #e85842;color:#eef6f8;padding:9px 18px;border-radius:6px;font:700 13px/1.4 system-ui,-apple-system,sans-serif;pointer-events:none;box-shadow:0 8px 26px rgba(0,0,0,.55)}
      .sl-disaster-banner[hidden]{display:none}
    `;
    document.head.appendChild(style);
  }

  window.createPortDisasterEvents = (world, { onRadio = null } = {}) => {
    const { THREE, scene, fx, audio } = world;
    const { Group, Mesh, BoxGeometry, CylinderGeometry, SphereGeometry, PlaneGeometry, RingGeometry, CircleGeometry,
      MeshStandardMaterial, MeshBasicMaterial, PointLight, DoubleSide, Vector3 } = THREE;

    injectStyles();
    const root = new Group();
    root.name = 'saltline-disaster-events-root';
    scene.add(root);

    // =========================================================================
    // 1. REALISTIC DARK-OCEAN 12m TSUNAMI WALL (deep slate-teal + axial foam roll)
    // =========================================================================
    const tsunamiRoot = new Group();
    tsunamiRoot.name = 'tsunami-root';
    tsunamiRoot.visible = false;
    root.add(tsunamiRoot);

    const waveGroup = new Group();
    waveGroup.name = 'tsunami-wave-wall';
    tsunamiRoot.add(waveGroup);

    // Procedural dark storm-ocean & turbulent sea-foam PBR textures (zero flat plastic boxes!)
    function makeOceanTex(baseHex, streakHex, repeatX, repeatY) {
      if (!THREE.DataTexture) return null;
      const sz = 128, buf = new Uint8Array(sz * sz * 4);
      const c0 = new THREE.Color(baseHex), c1 = new THREE.Color(streakHex);
      let s = (baseHex ^ 0x51a7c3) >>> 0;
      for (let y = 0; y < sz; y++) {
        for (let x = 0; x < sz; x++) {
          s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
          const n = (s >>> 24) / 255;
          const ripple = Math.sin(x * .22 + Math.cos(y * .14) * 2.2) * .5 + .5;
          const k = Math.min(1, Math.max(0, ripple * .55 + n * .45));
          const i = (y * sz + x) * 4;
          buf[i] = Math.round((c0.r * (1 - k) + c1.r * k) * 255);
          buf[i + 1] = Math.round((c0.g * (1 - k) + c1.g * k) * 255);
          buf[i + 2] = Math.round((c0.b * (1 - k) + c1.b * k) * 255);
          buf[i + 3] = 255;
        }
      }
      const tex = new THREE.DataTexture(buf, sz, sz);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeatX, repeatY);
      tex.needsUpdate = true;
      return tex;
    }
    const seaTex = makeOceanTex(0x071d27, 0x164152, 6, 3);
    const foamTex = makeOceanTex(0x88a8b4, 0xdbe8ec, 8, 2);

    const waveWaterMat = new MeshStandardMaterial({
      color: 0x0c2e3c, map: seaTex, bumpMap: seaTex, bumpScale: .18,
      roughness: .22, metalness: .38, transparent: true, opacity: .94, side: DoubleSide,
    });
    const foamMat = new MeshStandardMaterial({
      color: 0xc2d8df, map: foamTex, bumpMap: foamTex, bumpScale: .12,
      roughness: .66, metalness: .08, transparent: true, opacity: .86, side: DoubleSide,
    });

    // Real Continuous Curved Breaking-Wave Mesh + Custom GLSL Gerstner Wave / Fresnel / Foam Shader!
    const waveWidth = 340;
    const oceanUniforms = {
      uTime: { value: 0 },
      uDeepColor: { value: new THREE.Color(0x051822) },
      uShallowColor: { value: new THREE.Color(0x134a5c) },
      uFoamColor: { value: new THREE.Color(0xdcebf0) },
      uSkyColor: { value: new THREE.Color(0x6d8ea6) },
    };
    const makeWaveShaderMat = (isWall) => (typeof THREE.ShaderMaterial === 'function' ? new THREE.ShaderMaterial({
      uniforms: oceanUniforms,
      transparent: true,
      side: DoubleSide,
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying float vFoam;
        varying vec3 vWorldPos;
        varying vec3 vNormalW;
        void main() {
          vUv = uv;
          vec3 p = position;
          float w1 = sin(p.z * 0.085 + uTime * 3.1 + p.x * 0.14) * 0.55;
          float w2 = cos(p.z * 0.19 - uTime * 4.4 + p.x * 0.28) * 0.28;
          float w3 = sin((p.z + p.x) * 0.37 + uTime * 5.8) * 0.12;
          ${isWall
            ? 'p.x += (w1 + w2) * (0.4 + uv.y * 0.9); p.y += (w2 + w3) * 0.65; vFoam = smoothstep(0.52, 0.92, uv.y) + smoothstep(0.35, 0.85, w1 + w2) * 0.38;'
            : 'p.z += (w1 * 0.42 + w2 * 0.32 + w3 * 0.22); vFoam = smoothstep(0.18, 0.72, w1 + w2) * 0.55;'
          }
          vec4 wp = modelMatrix * vec4(p, 1.0);
          vWorldPos = wp.xyz;
          vNormalW = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uDeepColor;
        uniform vec3 uShallowColor;
        uniform vec3 uFoamColor;
        uniform vec3 uSkyColor;
        varying vec2 vUv;
        varying float vFoam;
        varying vec3 vWorldPos;
        varying vec3 vNormalW;
        void main() {
          vec3 V = normalize(cameraPosition - vWorldPos);
          float ripple = sin(vWorldPos.z * 0.9 + uTime * 4.2) * cos(vWorldPos.x * 0.7 - uTime * 3.5);
          vec3 N = normalize(vNormalW + vec3(ripple * 0.12, 0.0, ripple * 0.09));
          float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);
          float crestMix = clamp(vFoam + ripple * 0.16, 0.0, 1.0);
          vec3 waterCol = mix(uDeepColor, uShallowColor, clamp(vUv.y * 0.85 + 0.15, 0.0, 1.0));
          waterCol = mix(waterCol, uSkyColor, fresnel * 0.58);
          float foamNoise = smoothstep(0.25, 0.85, sin(vWorldPos.z * 1.4 - uTime * 5.0) * 0.5 + 0.5);
          vec3 col = mix(waterCol, uFoamColor, clamp(crestMix * (0.65 + 0.35 * foamNoise), 0.0, 0.95));
          float spec = pow(max(dot(reflect(-normalize(vec3(0.4, 0.75, 0.35)), N), V), 0.0), 36.0);
          col += vec3(0.85, 0.93, 1.0) * spec * 0.45;
          gl_FragColor = vec4(col, ${isWall ? '0.94' : '0.88'});
        }
      `,
    }) : waveWaterMat);

    const wallMat = makeWaveShaderMat(true);
    const floodShaderMat = makeWaveShaderMat(false);
    // Smooth 14-point breaking-curl cross-section extruded across 340m coastline (48 Z segments)
    const curlPts = [
      [11.0, 0.0], [8.2, 1.4], [5.4, 3.2], [3.0, 5.4], [1.1, 7.8],
      [-0.5, 10.1], [-2.1, 11.7], [-3.8, 12.1], [-5.2, 11.1], [-5.8, 9.2], [-5.3, 7.2],
    ];
    const zSegs = 48;
    const pSegs = curlPts.length - 1;
    const wPos = [], wNorm = [], wUv = [], wIdx = [];
    for (let zi = 0; zi <= zSegs; zi++) {
      const zf = zi / zSegs;
      const z = (zf - 0.5) * waveWidth;
      for (let pi = 0; pi <= pSegs; pi++) {
        const [px, py] = curlPts[pi];
        wPos.push(px, py, z);
        wNorm.push(-0.6, 0.8, 0);
        wUv.push(zf * 10, pi / pSegs);
      }
    }
    for (let zi = 0; zi < zSegs; zi++) {
      for (let pi = 0; pi < pSegs; pi++) {
        const a = zi * (pSegs + 1) + pi;
        const b = a + 1;
        const c = (zi + 1) * (pSegs + 1) + pi;
        const d = c + 1;
        wIdx.push(a, c, b, b, c, d);
      }
    }
    const waveWallGeo = new THREE.BufferGeometry();
    waveWallGeo.setAttribute('position', new THREE.Float32BufferAttribute(wPos, 3));
    waveWallGeo.setAttribute('normal', new THREE.Float32BufferAttribute(wNorm, 3));
    waveWallGeo.setAttribute('uv', new THREE.Float32BufferAttribute(wUv, 2));
    waveWallGeo.setIndex(wIdx);
    waveWallGeo.computeVertexNormals();
    const waveWallMesh = new Mesh(waveWallGeo, wallMat);
    waveGroup.add(waveWallMesh);
    const crestRoll = { rotation: { y: 0 } };

    const floodPlane = new Mesh(new PlaneGeometry(280, 340, 56, 48), floodShaderMat);
    floodPlane.rotation.x = -Math.PI / 2;
    floodPlane.position.set(-35, -1, 0);
    tsunamiRoot.add(floodPlane);

    const debrisItems = [];
    const crateMat = new MeshStandardMaterial({ color: 0x6b4d33, roughness: .88 });
    const contRed = new MeshStandardMaterial({ color: 0x6e271e, roughness: .72, metalness: .30 });
    const contBlue = new MeshStandardMaterial({ color: 0x1d3f59, roughness: .72, metalness: .30 });
    for (let i = 0; i < 14; i++) {
      const isCont = i < 5;
      const mesh = new Mesh(
        new BoxGeometry(isCont ? 5.6 : 1.5, isCont ? 2.2 : 1.1, isCont ? 2.3 : 1.4),
        isCont ? (i % 2 ? contRed : contBlue) : crateMat,
      );
      tsunamiRoot.add(mesh);
      debrisItems.push({
        mesh,
        startX: 34 + (i % 6) * 7,
        z: -115 + i * 18,
        speed: isCont ? 7.5 : 11.5 + (i % 3) * 2.2,
        spin: (i % 2 ? 1 : -1) * (isCont ? .35 : 1.1),
      });
    }

    // =========================================================================
    // 2. MULTI-FORK LIGHTNING, ARTILLERY TARGET RINGS & SCORCH CRATER DECALS
    // =========================================================================
    const fxRoot = new Group();
    fxRoot.name = 'disaster-fx-root';
    root.add(fxRoot);

    // =========================================================================
    // 1B. PERSISTENT ENVIRONMENTAL AFTERMATH (Building Collapse + Wrecked Cars + Flood Debris)
    // =========================================================================
    const aftermathRoot = new Group();
    aftermathRoot.name = 'disaster-aftermath-root';
    root.add(aftermathRoot);
    const aftermathColliders = [];
    const smokingWrecks = [];
    let buildingCollapsed = false;
    let vehiclesDamaged = false;
    let aftermathSmokeTick = 0;

    // Collapsible 4-Story Harbor Annex Tower at (-44, 0.16, 46) — intact until artillery/tsunami/demolition strikes!
    const collapseTower = new Group();
    collapseTower.position.set(-44, 0.16, 46);
    const towerConcreteMat = new MeshStandardMaterial({ color: 0x6f7476, roughness: .88, metalness: .08 });
    const towerCharredMat = new MeshStandardMaterial({ color: 0x262422, roughness: .94, metalness: .12 });
    const towerRebarMat = new MeshStandardMaterial({ color: 0x5c3626, roughness: .72, metalness: .65 });
    const tBody = new Mesh(new BoxGeometry(11.5, 14.0, 9.5), towerConcreteMat);
    tBody.position.set(0, 7.0, 0);
    const tRoof = new Mesh(new BoxGeometry(12.0, 0.8, 10.0), towerCharredMat);
    tRoof.position.set(0, 14.3, 0);
    collapseTower.add(tBody, tRoof);
    aftermathRoot.add(collapseTower);
    let collapseAnim = null;
    const towerCollider = world.physics?.addBox ? world.physics.addBox([-50, 0.16, 41], [-38, 14.8, 51], { surface: 'concrete', tag: 'collapsible-tower', noNav: true }) : null;
    if (towerCollider) aftermathColliders.push(towerCollider);

    function spawnWreckedVehicle(x, z, yaw, tiltZ = 0.55) {
      const wg = new Group();
      wg.position.set(x, 0.35, z);
      wg.rotation.set(0.18, yaw, tiltZ);
      const hull = new Mesh(new BoxGeometry(1.9, 0.95, 4.2), towerCharredMat);
      const cab = new Mesh(new BoxGeometry(1.65, 0.65, 2.1), towerCharredMat);
      cab.position.set(0, 0.72, -0.15);
      wg.add(hull, cab);
      aftermathRoot.add(wg);
      const b = world.physics?.addBox ? world.physics.addBox([x - 1.6, 0.16, z - 2.1], [x + 1.6, 1.75, z + 2.1], { surface: 'metal', tag: 'wrecked-vehicle', noNav: true }) : null;
      if (b) aftermathColliders.push(b);
      smokingWrecks.push(new Vector3(x, 1.1, z));
    }

    function triggerBuildingCollapse(reason = 'blast') {
      if (buildingCollapsed) return false;
      buildingCollapsed = true;
      collapseAnim = { age: 0, dur: 2.6 };
      // Spawn concrete rubble chunks + protruding rebar around tower base
      for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * Math.PI * 2;
        const rad = 3.2 + (i % 4) * 1.9;
        const rx = -44 + Math.cos(ang) * rad, rz = 46 + Math.sin(ang) * rad;
        const chunk = new Mesh(new BoxGeometry(1.8 + (i % 3) * 0.9, 0.9 + (i % 2) * 0.8, 1.6 + (i % 3) * 0.7), i % 3 === 0 ? towerCharredMat : towerConcreteMat);
        chunk.position.set(rx, 0.55, rz);
        chunk.rotation.set(i * 0.4, ang, i * 0.3);
        aftermathRoot.add(chunk);
        if (i % 2 === 0) {
          const bar = new Mesh(new BoxGeometry(0.08, 2.4, 0.08), towerRebarMat);
          bar.position.set(rx, 1.4, rz);
          bar.rotation.set(0.5, ang, -0.4);
          aftermathRoot.add(bar);
        }
      }
      if (towerCollider && typeof world.physics?.updateBox === 'function') {
        world.physics.updateBox(towerCollider, -52.5, 0.16, 38.5, -35.5, 4.4, 53.5);
      }
      smokingWrecks.push(new Vector3(-44, 2.8, 46));
      spawnFireballExplosion(new Vector3(-44, 5.5, 46), 2.4);
      fx?.smoke?.(new Vector3(-44, 4.0, 46), { size: 11, life: 10, color: 0x3a3733, alpha: .85, rise: 2.0, count: 16 });
      fx?.debris?.(new Vector3(-44, 5.0, 46), { count: 32 });
      world.player?.addShake?.(0.72);
      announce(
        '🏚️ 灾难破坏！南港滨海仓库大楼结构失稳坍塌，周边道路已被废墟阻断！',
        '🏚️ STRUCTURAL COLLAPSE! South Harbor Annex Tower has collapsed into rubble!',
        true
      );
      return true;
    }

    function applyVehicleAndStreetDamage(mode = 'tsunami') {
      if (vehiclesDamaged) return;
      vehiclesDamaged = true;
      // Overturned & scorched vehicles along coastal boulevard / south quay + washed-up debris
      spawnWreckedVehicle(-34.2, -48.5, 0.65, 0.85);
      spawnWreckedVehicle(-17.8, -82.0, -0.45, -0.52);
      spawnWreckedVehicle(-33.5, 62.0, 1.15, 2.75); // Upside-down car after storm surge!
      if (world.ground && typeof world.ground.rainLevel === 'number') {
        world.ground.rainLevel = Math.max(world.ground.rainLevel, mode === 'tsunami' ? 0.95 : 0.65);
      }
    }

    const boltMat = new MeshBasicMaterial({ color: 0xe6f6ff });
    const boltGeo = new BoxGeometry(.22, 1, .22);
    const ringMat = new MeshBasicMaterial({ color: 0xe83b28, transparent: true, opacity: .76, side: DoubleSide, depthWrite: false });
    const ringGeo = new RingGeometry(2.4, 3.1, 24);
    const scorchMat = new MeshBasicMaterial({ color: 0x161412, transparent: true, opacity: .72, side: DoubleSide, depthWrite: false });
    const scorchGeo = CircleGeometry ? new CircleGeometry(2.6, 14) : new PlaneGeometry(4.8, 4.8);
    const fireballGeo = new SphereGeometry(1, 14, 10);
    const shockGeo = new RingGeometry(.72, 1.0, 28);
    const blastCoreBase = new MeshBasicMaterial({ color: 0xfff0b8, transparent: true, opacity: .95, depthWrite: false });
    const blastOuterBase = new MeshBasicMaterial({ color: 0xff5a18, transparent: true, opacity: .82, depthWrite: false });
    const blastShockBase = new MeshBasicMaterial({ color: 0xffb357, transparent: true, opacity: .76, side: DoubleSide, depthWrite: false });
    const jetHullMat = new MeshStandardMaterial({ color: 0x1d262e, roughness: .42, metalness: .65 });
    const jetCanopyMat = new MeshStandardMaterial({ color: 0x3b6578, roughness: .15, metalness: .72 });
    const jetBurnerMat = new MeshBasicMaterial({ color: 0xff8a2b, transparent: true, opacity: .94 });
    const jetStrobeMat = new MeshBasicMaterial({ color: 0xff3b2f });
    const jetFuselageGeo = new BoxGeometry(1.35, .82, 8.6);
    const jetNoseGeo = new BoxGeometry(.82, .56, 2.4);
    const jetCanopyGeo = new BoxGeometry(.78, .48, 2.1);
    const jetWingGeo = new BoxGeometry(9.4, .18, 2.6);
    const jetTailGeo = new BoxGeometry(.16, 1.45, 1.7);
    const tracerMatOrange = new MeshBasicMaterial({ color: 0xff6229, transparent: true, opacity: .94 });
    const tracerMatGold = new MeshBasicMaterial({ color: 0xffcf5c, transparent: true, opacity: .94 });
    const tempBolts = [];
    const pendingShells = [];
    const scorchMarks = [];
    const activeBlasts = [];
    const activeFlares = [];
    const blastTimers = [];
    const activeFlyovers = [];
    const activeTracers = [];
    let blastFlashTimer = null;

    function spawnFireballExplosion(pos, scale = 1.0) {
      const coreMat = blastCoreBase.clone();
      const outerMat = blastOuterBase.clone();
      const shockMat = blastShockBase.clone();
      const core = new Mesh(fireballGeo, coreMat);
      const outer = new Mesh(fireballGeo, outerMat);
      const shock = new Mesh(shockGeo, shockMat);
      core.position.set(pos.x, pos.y + 1.1 * scale, pos.z);
      outer.position.set(pos.x, pos.y + 1.3 * scale, pos.z);
      shock.rotation.x = -Math.PI / 2;
      shock.position.set(pos.x, pos.y + .22, pos.z);
      const light = PointLight ? new PointLight(0xff7724, 55 * scale, 42 * scale, 1.4) : null;
      if (light) { light.position.set(pos.x, pos.y + 3.2 * scale, pos.z); fxRoot.add(light); }
      fxRoot.add(core, outer, shock);
      activeBlasts.push({ core, outer, shock, light, coreMat, outerMat, shockMat, age: 0, dur: .78, scale });
      const pPos = world.player?.pos;
      if (pPos) {
        const dist = pPos.distanceTo(pos);
        if (dist < 70) {
          const strength = Math.min(.78, (1 - dist / 70) * .68 * Math.min(1.5, scale));
          blastFlash.style.opacity = String(strength);
          clearTimeout(blastFlashTimer);
          blastFlashTimer = setTimeout(() => { blastFlash.style.opacity = '0'; }, 130);
        }
      }
    }

    function spawnSkyFlare(origin, vx, vy, vz, hex = 0xffc857) {
      const mat = new MeshBasicMaterial({ color: hex, transparent: true, opacity: .98 });
      const mesh = new Mesh(fireballGeo, mat);
      mesh.scale.setScalar(.36);
      mesh.position.copy(origin);
      const light = PointLight ? new PointLight(hex, 28, 36, 1.4) : null;
      if (light) { light.position.copy(origin); fxRoot.add(light); }
      fxRoot.add(mesh);
      activeFlares.push({ mesh, mat, light, vel: new Vector3(vx, vy, vz), age: 0, dur: 4.2, trailTick: 0 });
    }

    function addBranch(boltGroup, x0, y0, z0, x1, y1, z1, thickness = 1) {
      const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0;
      const len = Math.hypot(dx, dy, dz);
      const m = new Mesh(boltGeo, boltMat);
      m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      m.scale.set(thickness, len, thickness);
      m.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(dx, dy, dz).normalize());
      boltGroup.add(m);
    }

    let flashTimer, thunderTimer;
    function spawnLightningBolt(targetPos) {
      const boltGroup = new Group();
      let cx = targetPos.x, cz = targetPos.z;
      const segs = 8, topY = 52;
      for (let i = 0; i < segs; i++) {
        const y0 = topY * (1 - i / segs);
        const y1 = topY * (1 - (i + 1) / segs);
        const nx = i === segs - 1 ? targetPos.x : cx + (Math.random() - .5) * 5.2;
        const nz = i === segs - 1 ? targetPos.z : cz + (Math.random() - .5) * 5.2;
        addBranch(boltGroup, cx, y0, cz, nx, y1, nz, 1.15);
        // Realistic secondary fork off mid-air trunk
        if (i === 2 || i === 4) {
          addBranch(boltGroup, nx, y1, nz, nx + (Math.random() - .5) * 9, y1 - 8, nz + (Math.random() - .5) * 9, .52);
        }
        cx = nx; cz = nz;
      }
      fxRoot.add(boltGroup);
      tempBolts.push({ group: boltGroup, life: .18 });
      stormFlash.style.opacity = '.74';
      clearTimeout(flashTimer);
      flashTimer = setTimeout(() => { stormFlash.style.opacity = '0'; }, 85);
      fx?.sparks?.(targetPos, new Vector3(0, 1, 0), 38);
      // Realistic speed-of-sound delayed rolling thunderclap!
      const delayMs = 280 + Math.round(Math.random() * 380);
      clearTimeout(thunderTimer);
      thunderTimer = setTimeout(() => {
        audio?.play?.('rail_touchdown', { pos: targetPos, ref: 52, gain: .98, jitter: .14 });
        world.player?.addShake?.(.48);
      }, delayMs);
    }

    function dropArtilleryMarker(pos) {
      const ring = new Mesh(ringGeo, ringMat.clone());
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(pos.x, pos.y + .14, pos.z);
      fxRoot.add(ring);
      pendingShells.push({ ring, pos: pos.clone(), timer: 1.65 });
    }

    function addScorchCrater(pos) {
      const mark = new Mesh(scorchGeo, scorchMat);
      mark.rotation.x = -Math.PI / 2;
      mark.position.set(pos.x, pos.y + .06, pos.z);
      fxRoot.add(mark);
      scorchMarks.push(mark);
      if (scorchMarks.length > 14) {
        const old = scorchMarks.shift();
        fxRoot.remove(old);
      }
    }

    // Dynamic oppressive storm atmosphere controller (atmospheric without ever blinding visibility!)
    let savedFogDensity = null;
    function setOppressiveAtmosphere(active) {
      stormVignette.style.opacity = active ? '.35' : '0';
      if (scene?.fog && typeof scene.fog.density === 'number') {
        if (active) {
          if (savedFogDensity === null) savedFogDensity = scene.fog.density;
          scene.fog.density = Math.min(.0018, Math.max(savedFogDensity, .0014));
        } else if (savedFogDensity !== null) {
          scene.fog.density = savedFogDensity;
          savedFogDensity = null;
        }
      }
    }

    // HUD overlays
    const vignette = document.createElement('div');
    vignette.className = 'sl-water-vignette';
    const stormVignette = document.createElement('div');
    stormVignette.className = 'sl-storm-vignette';
    const stormFlash = document.createElement('div');
    stormFlash.className = 'sl-storm-flash';
    const blastFlash = document.createElement('div');
    blastFlash.className = 'sl-blast-flash';
    const banner = document.createElement('div');
    banner.className = 'sl-disaster-banner';
    banner.hidden = true;
    document.body.append(vignette, stormVignette, stormFlash, blastFlash, banner);

    const up = new Vector3(0, 1, 0);
    let tsunamiActive = false, tsunamiElapsed = 0, waterLevel = -1, sprayTick = 0, submergeDamageTick = 0;
    const TSUNAMI_DURATION = 32;

    let stormActive = false, stormElapsed = 0, stormBoltTick = 0;
    const STORM_DURATION = 20;

    let barrageActive = false, barrageElapsed = 0, barrageTick = 0;
    const BARRAGE_DURATION = 18;

    let chainActive = false, chainElapsed = 0, chainIndex = 0;
    let chainOrigin = new Vector3(), chainDir = new Vector3(1, 0, 0);

    // Linear campaign by default: disasters trigger strictly on story milestones or manual Dev Menu testing
    let autoRandom = false;
    let autoRandomTimer = 60;
    let lastRandomId = null;

    function announce(zh, en, urgent = true) {
      if (onRadio) onRadio([en, zh], 6.5);
      world.tactical?.notify?.(zh, en, urgent, 5.5);
    }

    function triggerTsunami() {
      tsunamiActive = true;
      tsunamiElapsed = 0;
      waterLevel = -.5;
      sprayTick = 0;
      submergeDamageTick = 0;
      tsunamiRoot.visible = true;
      waveGroup.visible = true;
      waveGroup.position.set(105, 0, 0);
      floodPlane.position.y = -.5;
      banner.hidden = false;
      setOppressiveAtmosphere(true);
      for (const d of debrisItems) {
        d.mesh.position.set(d.startX, .8, d.z);
        d.mesh.rotation.set(0, .2, 0);
      }
      audio?.play?.('berth_alarm', { pos: world.player?.pos ?? new Vector3(), ref: 24, gain: .95, jitter: 0 });
      announce(
        '🌊 海啸红色警报！12 米东海风暴潮正吞噬海堤！立刻撤往高架猫道或 +14m 西岸山顶！',
        'TSUNAMI WARNING! 12m East Sea storm surge inbound! Climb to high ground NOW!',
        true,
      );
      blastTimers.push(setTimeout(() => { applyVehicleAndStreetDamage('tsunami'); }, 5200));
      blastTimers.push(setTimeout(() => { triggerBuildingCollapse('tsunami'); }, 7500));
      return true;
    }

    function triggerLightningStorm() {
      stormActive = true;
      stormElapsed = 0;
      stormBoltTick = .35;
      banner.hidden = false;
      setOppressiveAtmosphere(true);
      announce(
        '⛈️ 强对流超级雷暴过境！海面能见度骤降，注意多叉落雷与强风震动！',
        '⛈️ SEVERE SUPERCELL LIGHTNING SQUALL! Visibility dropping across Saltline!',
        true,
      );
      return true;
    }

    function triggerArtilleryBarrage() {
      barrageActive = true;
      barrageElapsed = 0;
      barrageTick = .2;
      banner.hidden = false;
      audio?.play?.('berth_alarm', { pos: world.player?.pos ?? new Vector3(), ref: 28, gain: .88, jitter: 0 });
      announce(
        '💥 敌方重炮覆盖警报！铁砧海上炮艇正在向你所在街区齐射，立刻远离地面红圈！',
        '💥 INCOMING ARTILLERY BARRAGE! Evade the red impact zones!',
        true,
      );
      blastTimers.push(setTimeout(() => { triggerBuildingCollapse('artillery'); applyVehicleAndStreetDamage('artillery'); }, 4500));
      return true;
    }

    function triggerFuelChainBlast() {
      chainActive = true;
      chainElapsed = 0;
      chainIndex = 0;
      const p = world.player?.pos ?? new Vector3(0, 0, 0);
      const yaw = world.player?.yaw ?? 0;
      chainDir.set(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
      chainOrigin.copy(p).addScaledVector(chainDir, 12);
      banner.hidden = false;
      announce(
        '🔥 港区输油管线破裂！前方油罐发生 6 波次连锁大爆炸，注意冲击波与黑烟！',
        '🔥 HARBOR FUEL LINE RUPTURE! Cascading tank explosions ahead!',
        true,
      );
      return true;
    }

    function triggerTideGateDemolition() {
      const charges = [new Vector3(-34, 4.5, 96), new Vector3(-26, 6.2, 96), new Vector3(-18, 4.5, 96)];
      charges.forEach((pt, idx) => {
        blastTimers.push(setTimeout(() => {
          spawnFireballExplosion(pt, 2.2);
          fx?.smoke?.(pt, { size: 8.5, life: 9.0, color: 0x1b1815, alpha: .85, rise: 2.2, count: 14 });
          fx?.sparks?.(pt, up, 58);
          fx?.debris?.(pt, { count: 28 });
          audio?.play?.('explosion', { pos: pt, ref: 90, gain: 1.0, jitter: .05 });
          world.player?.addShake?.(.75);
        }, idx * 460));
      });
      return true;
    }

    function triggerHighwayAmbush(centerPos) {
      const c = centerPos ? centerPos.clone() : new Vector3(-26, .6, -76);
      const pts = [c, c.clone().add(new Vector3(-3.8, .4, -2.5)), c.clone().add(new Vector3(3.8, .4, -2.5))];
      pts.forEach((pt, idx) => {
        blastTimers.push(setTimeout(() => {
          spawnFireballExplosion(pt, 1.35);
          addScorchCrater(pt);
          fx?.smoke?.(pt, { size: 5.5, life: 6.0, color: 0x221d19, alpha: .78, rise: 1.5, count: 10 });
          fx?.sparks?.(pt, up, 40);
          fx?.debris?.(pt, { count: 22 });
          audio?.play?.('explosion', { pos: pt, ref: 36, gain: .95, jitter: .08 });
          world.player?.addShake?.(.58);
        }, idx * 140));
      });
      return true;
    }

    function triggerVictoryFlareBarrage(centerPos) {
      const c = centerPos ? centerPos.clone() : new Vector3(-168, 2.0, -188);
      const colors = [0xffcf5c, 0x58e8ff, 0xff7b42, 0xffcf5c, 0x58e8ff, 0xffd86e];
      colors.forEach((hex, idx) => {
        blastTimers.push(setTimeout(() => {
          const ang = (idx / colors.length) * Math.PI * 2;
          const origin = new Vector3(c.x + Math.cos(ang) * 8, c.y + 1.5, c.z + Math.sin(ang) * 8);
          spawnSkyFlare(origin, Math.cos(ang) * 4.5, 22 + (idx % 3) * 3.5, Math.sin(ang) * 4.5, hex);
          audio?.play?.('rail_touchdown', { pos: origin, ref: 40, gain: .55, jitter: .1 });
        }, idx * 240));
      });
      return true;
    }

    function buildInterceptorJet() {
      const g = new Group();
      const fuselage = new Mesh(jetFuselageGeo, jetHullMat);
      const nose = new Mesh(jetNoseGeo, jetHullMat);
      nose.position.set(0, -.04, 5.1);
      const canopy = new Mesh(jetCanopyGeo, jetCanopyMat);
      canopy.position.set(0, .52, 1.8);
      const wing = new Mesh(jetWingGeo, jetHullMat);
      wing.position.set(0, -.06, -.4);
      const tailL = new Mesh(jetTailGeo, jetHullMat);
      tailL.position.set(-.88, .72, -3.5); tailL.rotation.z = .24;
      const tailR = new Mesh(jetTailGeo, jetHullMat);
      tailR.position.set(.88, .72, -3.5); tailR.rotation.z = -.24;
      const burnL = new Mesh(fireballGeo, jetBurnerMat);
      burnL.scale.set(.38, .38, 1.35); burnL.position.set(-.42, 0, -4.85);
      const burnR = new Mesh(fireballGeo, jetBurnerMat);
      burnR.scale.set(.38, .38, 1.35); burnR.position.set(.42, 0, -4.85);
      const strobeL = new Mesh(fireballGeo, jetStrobeMat);
      strobeL.scale.setScalar(.22); strobeL.position.set(-4.65, 0, -.6);
      const strobeR = new Mesh(fireballGeo, jetStrobeMat);
      strobeR.scale.setScalar(.22); strobeR.position.set(4.65, 0, -.6);
      g.add(fuselage, nose, canopy, wing, tailL, tailR, burnL, burnR, strobeL, strobeR);
      return { group: g };
    }

    function spawnSkyTracer(origin, target) {
      const dir = target.clone().sub(origin);
      const dist = dir.length();
      if (dist < 1) return;
      dir.divideScalar(dist);
      const mat = Math.random() > .35 ? tracerMatOrange : tracerMatGold;
      const mesh = new Mesh(boltGeo, mat);
      mesh.scale.set(.42, 6.5, .42);
      mesh.position.copy(origin);
      mesh.quaternion.setFromUnitVectors(up, dir);
      fxRoot.add(mesh);
      activeTracers.push({ mesh, vel: dir.multiplyScalar(135), target: target.clone(), age: 0, dur: Math.min(.75, dist / 135) });
    }

    function triggerSkyBattlePass({ from, to, strafeTarget, count = 2 } = {}) {
      const startBase = from ? from.clone() : new Vector3(-26, 26, 20);
      const endBase = to ? to.clone() : new Vector3(-26, 20, -145);
      const tgtBase = strafeTarget ? strafeTarget.clone() : startBase.clone().lerp(endBase, .5).setY(.8);
      const n = Math.max(1, Math.min(3, count));
      for (let i = 0; i < n; i++) {
        blastTimers.push(setTimeout(() => {
          const lateral = (i - (n - 1) / 2) * 14;
          const f = startBase.clone().add(new Vector3(lateral, i * 2.4, 0));
          const t = endBase.clone().add(new Vector3(lateral * .7, i * 1.8, 0));
          const jet = buildInterceptorJet();
          jet.group.position.copy(f);
          jet.group.lookAt(t);
          fxRoot.add(jet.group);
          activeFlyovers.push({
            ...jet, from: f, to: t, strafeTarget: tgtBase.clone(),
            age: 0, dur: 3.6, strafeTick: .28, trailTick: 0, passBoomed: false, bankSign: i % 2 === 0 ? 1 : -1,
          });
          audio?.play?.('rail_touchdown', { pos: f, ref: 95, gain: .82, jitter: .08 });
        }, i * 550));
      }
      return true;
    }

    function triggerEvent(id) {
      if (id === 'tsunami') return triggerTsunami();
      if (id === 'lightning_storm') return triggerLightningStorm();
      if (id === 'artillery_barrage') return triggerArtilleryBarrage();
      if (id === 'fuel_chain_blast') return triggerFuelChainBlast();
      if (id === 'gunship_crane') return !!world.berthSlice?.triggerClimaxSetPiece?.();
      return false;
    }

    function triggerRandomEvent() {
      const pool = ['tsunami', 'lightning_storm', 'artillery_barrage', 'fuel_chain_blast'];
      if (world.berthSlice?.triggerClimaxSetPiece) pool.push('gunship_crane');
      const candidates = pool.filter(id => id !== lastRandomId);
      const pick = candidates[Math.floor(Math.random() * candidates.length)] || pool[0];
      lastRandomId = pick;
      triggerEvent(pick);
      return pick;
    }

    function stopAllEvents() {
      clearTimeout(flashTimer);
      clearTimeout(thunderTimer);
      clearTimeout(blastFlashTimer);
      for (const id of blastTimers.splice(0)) clearTimeout(id);
      tsunamiActive = false;
      waterLevel = -1;
      stormActive = false;
      barrageActive = false;
      chainActive = false;
      tsunamiRoot.visible = false;
      vignette.style.opacity = '0';
      stormFlash.style.opacity = '0';
      blastFlash.style.opacity = '0';
      banner.hidden = true;
      setOppressiveAtmosphere(false);
      for (const b of tempBolts.splice(0)) fxRoot.remove(b.group);
      for (const s of pendingShells.splice(0)) { fxRoot.remove(s.ring); s.ring.material.dispose(); }
      for (const m of scorchMarks.splice(0)) fxRoot.remove(m);
      for (const b of activeBlasts.splice(0)) {
        fxRoot.remove(b.core, b.outer, b.shock);
        if (b.light) fxRoot.remove(b.light);
        b.coreMat.dispose(); b.outerMat.dispose(); b.shockMat.dispose();
      }
      for (const f of activeFlares.splice(0)) {
        fxRoot.remove(f.mesh);
        if (f.light) fxRoot.remove(f.light);
        f.mat.dispose();
      }
      for (const j of activeFlyovers.splice(0)) fxRoot.remove(j.group);
      for (const tr of activeTracers.splice(0)) fxRoot.remove(tr.mesh);
    }

    function update(dt, player) {
      if (!(dt > 0)) return;
      oceanUniforms.uTime.value += dt;
      if (collapseAnim) {
        collapseAnim.age += dt;
        const f = Math.min(1, collapseAnim.age / collapseAnim.dur);
        const ease = f * f;
        collapseTower.rotation.z = ease * 0.48;
        collapseTower.rotation.x = ease * 0.22;
        collapseTower.position.y = 0.16 - ease * 10.2;
        if (f >= 1) collapseAnim = null;
      }
      if (smokingWrecks.length) {
        aftermathSmokeTick += dt;
        if (aftermathSmokeTick >= 0.85) {
          aftermathSmokeTick = 0;
          const pt = smokingWrecks[Math.floor(Math.random() * smokingWrecks.length)];
          fx?.smoke?.(pt, { size: 3.4, life: 3.8, color: 0x22201e, alpha: .52, rise: 1.35, count: 2 });
        }
      }

      for (let i = activeFlyovers.length - 1; i >= 0; i--) {
        const j = activeFlyovers[i];
        j.age += dt;
        const t = Math.min(1, j.age / j.dur);
        j.group.position.lerpVectors(j.from, j.to, t);
        j.group.lookAt(j.to);
        j.group.rotateZ(Math.sin(t * Math.PI) * .32 * j.bankSign);
        j.trailTick += dt;
        if (j.trailTick >= .14) {
          j.trailTick = 0;
          fx?.smoke?.(j.group.position, { size: 2.2, life: 1.9, color: 0xd6e2e8, alpha: .34, rise: .2, count: 1 });
        }
        j.strafeTick -= dt;
        if (j.strafeTick <= 0 && t > .12 && t < .82) {
          j.strafeTick = .16;
          const spread = new Vector3((Math.random() - .5) * 14, 0, (Math.random() - .5) * 14);
          spawnSkyTracer(j.group.position.clone().add(new Vector3(0, -.5, 0)), j.strafeTarget.clone().add(spread));
        }
        if (!j.passBoomed && t >= .45) {
          j.passBoomed = true;
          audio?.play?.('explosion', { pos: j.group.position, ref: 110, gain: .85, jitter: .1 });
          if (player?.pos && player.pos.distanceTo(j.group.position) < 95) player.addShake?.(.36);
        }
        if (j.age >= j.dur) {
          fxRoot.remove(j.group);
          activeFlyovers.splice(i, 1);
        }
      }

      for (let i = activeTracers.length - 1; i >= 0; i--) {
        const tr = activeTracers[i];
        tr.age += dt;
        tr.mesh.position.addScaledVector(tr.vel, dt);
        if (tr.age >= tr.dur) {
          fx?.sparks?.(tr.target, up, 12);
          fx?.smoke?.(tr.target, { size: 2.0, life: 1.6, color: 0x26211d, alpha: .55, rise: .9, count: 2 });
          fxRoot.remove(tr.mesh);
          activeTracers.splice(i, 1);
        }
      }

      for (let i = activeBlasts.length - 1; i >= 0; i--) {
        const b = activeBlasts[i];
        b.age += dt;
        const t = Math.min(1, b.age / b.dur);
        const ease = 1 - Math.pow(1 - t, 3);
        const rCore = (.8 + ease * 3.8) * b.scale;
        const rOuter = (1.1 + ease * 5.6) * b.scale;
        const rShock = (1.4 + ease * 11.5) * b.scale;
        b.core.scale.setScalar(rCore);
        b.outer.scale.setScalar(rOuter);
        b.shock.scale.set(rShock, rShock, 1);
        b.coreMat.opacity = Math.max(0, (1 - t) * .95);
        b.outerMat.opacity = Math.max(0, (1 - t) * .82);
        b.shockMat.opacity = Math.max(0, (1 - t) * .76);
        if (b.light) b.light.intensity = Math.max(0, (1 - t) * 55 * b.scale);
        if (b.age >= b.dur) {
          fxRoot.remove(b.core, b.outer, b.shock);
          if (b.light) fxRoot.remove(b.light);
          b.coreMat.dispose(); b.outerMat.dispose(); b.shockMat.dispose();
          activeBlasts.splice(i, 1);
        }
      }

      for (let i = activeFlares.length - 1; i >= 0; i--) {
        const f = activeFlares[i];
        f.age += dt;
        f.vel.y -= 6.8 * dt;
        f.mesh.position.addScaledVector(f.vel, dt);
        if (f.light) f.light.position.copy(f.mesh.position);
        f.trailTick += dt;
        if (f.trailTick >= .12) {
          f.trailTick = 0;
          fx?.smoke?.(f.mesh.position, { size: 1.4, life: 1.8, color: 0xe6eef2, alpha: .42, rise: .3, count: 1 });
        }
        const fade = Math.max(0, 1 - f.age / f.dur);
        f.mat.opacity = fade;
        if (f.light) f.light.intensity = fade * 28;
        if (f.age >= f.dur) {
          fxRoot.remove(f.mesh);
          if (f.light) fxRoot.remove(f.light);
          f.mat.dispose();
          activeFlares.splice(i, 1);
        }
      }

      for (let i = tempBolts.length - 1; i >= 0; i--) {
        tempBolts[i].life -= dt;
        if (tempBolts[i].life <= 0) {
          fxRoot.remove(tempBolts[i].group);
          tempBolts.splice(i, 1);
        }
      }

      for (let i = pendingShells.length - 1; i >= 0; i--) {
        const s = pendingShells[i];
        s.timer -= dt;
        const pulse = 1 + Math.sin(s.timer * 18) * .12;
        s.ring.scale.set(pulse, pulse, 1);
        if (s.timer <= 0) {
          fxRoot.remove(s.ring);
          s.ring.material.dispose();
          pendingShells.splice(i, 1);
          spawnFireballExplosion(s.pos, 1.15);
          addScorchCrater(s.pos);
          fx?.smoke?.(s.pos, { size: 6.2, life: 6.5, color: 0x1e1a17, alpha: .80, rise: 1.5, count: 12 });
          fx?.sparks?.(s.pos, up, 48);
          fx?.debris?.(s.pos, { count: 22 });
          audio?.play?.('explosion', { pos: s.pos, ref: 42, gain: .98, jitter: .1 });
          if (player?.pos) {
            const dist = player.pos.distanceTo(s.pos);
            if (dist < 32) player.addShake?.(Math.max(.22, (1 - dist / 32) * .78));
            if (dist < 4.5 && player.alive) player.damage?.(18, s.pos);
          }
        }
      }

      if (tsunamiActive) {
        tsunamiElapsed += dt;
        const waveProgress = Math.min(1, tsunamiElapsed / 13.0);
        const waveX = 105 - waveProgress * 195;
        waveGroup.position.set(waveX, Math.sin(tsunamiElapsed * 3.5) * .35, 0);
        crestRoll.rotation.y += dt * 5.2;
        waveGroup.visible = tsunamiElapsed < 14.5;

        // Pre-impact low-frequency ocean tremor builds oppression before the wave strikes!
        if (tsunamiElapsed < 4.5 && player?.addShake) player.addShake(.035);

        if (tsunamiElapsed < 4.5) waterLevel = -.4;
        else if (tsunamiElapsed < 12.0) {
          const f = (tsunamiElapsed - 4.5) / 7.5;
          waterLevel = -.4 + 2.55 * (f * f * (3 - 2 * f));
        } else if (tsunamiElapsed < 22.0) waterLevel = 2.15 + Math.sin(tsunamiElapsed * 2.1) * .12;
        else {
          const f = Math.min(1, (tsunamiElapsed - 22.0) / 10.0);
          waterLevel = 2.15 * (1 - f) - .5 * f;
        }
        floodPlane.position.y = waterLevel;

        sprayTick += dt;
        if (tsunamiElapsed > 3.2 && tsunamiElapsed < 13.8 && sprayTick >= .12) {
          sprayTick = 0;
          const p = new Vector3(waveX - 2, 2.4, (Math.random() - .5) * 38);
          fx?.smoke?.(p, { size: 5.2, life: 2.6, color: 0xc2d8df, alpha: .62, rise: 2.1, count: 5 });
          if (player?.pos && Math.abs(player.pos.x - waveX) < 42) {
            player.addShake?.(.30);
            audio?.play?.('rail_touchdown', { pos: p, ref: 34, gain: .72, jitter: .12 });
          }
        }

        for (const d of debrisItems) {
          if (tsunamiElapsed > 4.2) {
            const dtFlow = tsunamiElapsed - 4.2;
            d.mesh.position.x = d.startX - dtFlow * d.speed;
            d.mesh.position.y = Math.max(.4, waterLevel - .35 + Math.sin(tsunamiElapsed * 3 + d.z) * .28);
            d.mesh.rotation.y += d.spin * dt * .4;
            d.mesh.rotation.z = Math.sin(tsunamiElapsed * 2.4 + d.z) * .18;
          }
        }

        if (player?.alive && player.pos) {
          const depth = waterLevel - player.pos.y;
          const safe = depth < .35;
          vignette.style.opacity = safe ? '0' : String(Math.min(.92, depth * .62));
          if (depth >= .35) {
            if (player.vel) {
              player.vel.x -= Math.min(12, depth * 7.5) * dt;
              player.vel.x *= (1 - Math.min(.25, dt * 1.4));
              player.vel.z *= (1 - Math.min(.25, dt * 1.4));
            }
            submergeDamageTick += dt;
            if (depth > 1.25 && submergeDamageTick >= 1.2) {
              submergeDamageTick = 0;
              player.damage?.(12, player.pos);
              player.addShake?.(.34);
            }
            banner.textContent = `🌊 已被洪峰卷入（水深 ${depth.toFixed(1)}m）！快撤往高架猫道或西岸山顶！`;
          } else if (tsunamiElapsed < 4.5) {
            banner.textContent = `🌊 12 米东海海啸迫近！距离拍岸 ${Math.max(1, Math.ceil(4.5 - tsunamiElapsed))} 秒！`;
          } else if (waterLevel <= .2) {
            banner.textContent = '🌊 巨浪已撞击海堤！洪峰正在灌入港区！';
          } else {
            banner.textContent = `✅ 高地避险中 · 当前洪峰水位 ${waterLevel.toFixed(1)}m（退潮倒计时 ${Math.max(0, Math.ceil(TSUNAMI_DURATION - tsunamiElapsed))}s）`;
          }
        }

        if (tsunamiElapsed >= TSUNAMI_DURATION) {
          tsunamiActive = false;
          waterLevel = -1;
          tsunamiRoot.visible = false;
          vignette.style.opacity = '0';
          if (!stormActive) setOppressiveAtmosphere(false);
          world.tactical?.notify?.('🌊 东海风暴潮已退去，港区恢复通行！', '🌊 Storm surge receded!', false, 4.0);
        }
      }

      if (stormActive) {
        stormElapsed += dt;
        stormBoltTick -= dt;
        if (stormBoltTick <= 0 && player?.pos) {
          stormBoltTick = 1.5 + Math.random() * 1.6;
          const angle = Math.random() * Math.PI * 2;
          const dist = 14 + Math.random() * 28;
          spawnLightningBolt(new Vector3(player.pos.x + Math.cos(angle) * dist, player.pos.y, player.pos.z + Math.sin(angle) * dist));
        }
        if (!tsunamiActive) banner.textContent = `⛈️ 超级雷暴过境中（剩余 ${Math.max(0, Math.ceil(STORM_DURATION - stormElapsed))}s）· 注意规避落雷！`;
        if (stormElapsed >= STORM_DURATION) {
          stormActive = false;
          if (!tsunamiActive) setOppressiveAtmosphere(false);
          world.tactical?.notify?.('⛅ 雷暴云团已过境，海面能见度恢复。', '⛅ Lightning squall cleared.', false, 3.5);
        }
      }

      if (barrageActive) {
        barrageElapsed += dt;
        barrageTick -= dt;
        if (barrageTick <= 0 && player?.pos) {
          barrageTick = 1.35 + Math.random() * .8;
          const angle = Math.random() * Math.PI * 2;
          const dist = 6 + Math.random() * 18;
          dropArtilleryMarker(new Vector3(player.pos.x + Math.cos(angle) * dist, player.pos.y, player.pos.z + Math.sin(angle) * dist));
        }
        if (!tsunamiActive) banner.textContent = `💥 铁砧重炮齐射覆盖中（剩余 ${Math.max(0, Math.ceil(BARRAGE_DURATION - barrageElapsed))}s）· 远离地面红圈！`;
        if (barrageElapsed >= BARRAGE_DURATION) {
          barrageActive = false;
          world.tactical?.notify?.('🛡️ 敌方炮火覆盖结束！', '🛡️ Artillery barrage ended!', false, 3.5);
        }
      }

      if (chainActive) {
        chainElapsed += dt;
        const targetIdx = Math.floor(chainElapsed / .72);
        while (chainIndex <= targetIdx && chainIndex < 6) {
          const pos = chainOrigin.clone().addScaledVector(chainDir, chainIndex * 7.5);
          spawnFireballExplosion(pos, 1.45);
          addScorchCrater(pos);
          fx?.smoke?.(pos, { size: 6.5, life: 8.0, color: 0x1e1916, alpha: .82, rise: 1.7, count: 13 });
          fx?.sparks?.(pos, up, 52);
          fx?.debris?.(pos, { count: 24 });
          audio?.play?.('explosion', { pos, ref: 46, gain: 1.0, jitter: .06 });
          player?.addShake?.(.66);
          chainIndex++;
        }
        if (!tsunamiActive && !barrageActive) banner.textContent = `🔥 港区油罐连锁爆炸（第 ${Math.min(6, chainIndex)}/6 波次引爆）！`;
        if (chainElapsed >= 5.5) chainActive = false;
      }

      const anyActive = tsunamiActive || stormActive || barrageActive || chainActive;
      banner.hidden = !anyActive;

      if (autoRandom && !anyActive && player?.alive && world.openWorld?.freeRoam) {
        autoRandomTimer -= dt;
        if (autoRandomTimer <= 0) {
          autoRandomTimer = 55 + Math.random() * 30;
          triggerRandomEvent();
        }
      }
    }

    let disposed = false;
    function dispose() {
      if (disposed) return;
      disposed = true;
      stopAllEvents();
      const geometries = new Set([boltGeo,ringGeo,scorchGeo,fireballGeo,shockGeo,jetFuselageGeo,jetNoseGeo,jetCanopyGeo,jetWingGeo,jetTailGeo]);
      const surfaces = new Set([boltMat,ringMat,scorchMat,crateMat,contRed,contBlue,blastCoreBase,blastOuterBase,blastShockBase,jetHullMat,jetCanopyMat,jetBurnerMat,jetStrobeMat,tracerMatOrange,tracerMatGold]);
      root.traverse(node => {
        if (node.geometry) geometries.add(node.geometry);
        if (node.material) surfaces.add(node.material);
      });
      geometries.forEach(value => value.dispose());
      surfaces.forEach(value => value.dispose());
      seaTex?.dispose();
      foamTex?.dispose();
      for (const b of aftermathColliders.splice(0)) world.physics?.removeBox?.(b);
      root.removeFromParent();
      vignette.remove();
      stormVignette.remove();
      stormFlash.remove();
      blastFlash.remove();
      banner.remove();
    }

    return {
      triggerTsunami,
      triggerLightningStorm,
      triggerArtilleryBarrage,
      triggerFuelChainBlast,
      triggerTideGateDemolition,
      triggerBuildingCollapse,
      triggerHighwayAmbush,
      triggerVictoryFlareBarrage,
      triggerSkyBattlePass,
      spawnFireballExplosion,
      triggerEvent,
      triggerRandomEvent,
      stopAllEvents,
      setAutoRandom(v) { autoRandom = !!v; if (autoRandom) autoRandomTimer = Math.min(autoRandomTimer, 45); },
      get autoRandom() { return autoRandom; },
      update,
      dispose,
      get active() { return tsunamiActive || stormActive || barrageActive || chainActive; },
      get waterLevel() { return waterLevel; },
    };
  };
})();
