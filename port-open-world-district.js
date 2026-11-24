/* Expanded 360m x 260m Multi-Biome Coastal Open World & Real-Time Sector Streaming.
 * Connects seamlessly north from Berth 4 (z = -30) into 3 genuinely non-industrial environments:
 *   1. Coastal City Downtown (boulevards, intersections, urban plazas, enterable glass lobby, streetlights, trees)
 *   2. Mountain Ridge & Satellite Comms Station (drivable switchback road climbing to y = +14m summit with pine forest & rotating 12m radar dish)
 *   3. Coastal Airfield & Arched Hangar (130m lighted runway, drivable barrel-vault hangar, 4F ATC tower & parked SAR aircraft)
 * Includes distance-based sector streaming + live FPS/sector performance telemetry HUD. */
(() => {
  function injectStyles() {
    if (document.getElementById('saltline-world-perf-style')) return;
    const style = document.createElement('style');
    style.id = 'saltline-world-perf-style';
    style.textContent = `
      .sl-world-hud{position:fixed;right:18px;top:16px;z-index:18;background:rgba(10,16,21,.78);border:1px solid rgba(110,220,245,.32);border-radius:6px;padding:7px 12px;color:#dff3f6;font:600 11.5px/1.4 ui-monospace,SFMono-Regular,monospace;backdrop-filter:blur(6px);pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.35)}
      .sl-world-zone{color:#58e8ff;font-size:12.5px;margin-bottom:2px}
    `;
    document.head.appendChild(style);
  }

  window.createPortOpenWorld = (world, { chapterId = 'berth' } = {}) => {
    if (chapterId !== 'berth') return null;
    const { THREE, scene, physics, fx, audio } = world;
    const { Group, Mesh, BoxGeometry, CylinderGeometry, ConeGeometry, SphereGeometry, TorusGeometry,
      MeshStandardMaterial, MeshBasicMaterial, PointLight, Vector3 } = THREE;

    injectStyles();
    const root = new Group();
    root.name = 'saltline-open-world-root';
    scene.add(root);

    // Non-industrial urban, alpine mountain, and aviation PBR materials
    const M = {
      asphalt: new MeshStandardMaterial({ color: 0x2b3034, roughness: .92, metalness: .04 }),
      sidewalk: new MeshStandardMaterial({ color: 0x8d8f8b, roughness: .86, metalness: .04 }),
      whitePaint: new MeshBasicMaterial({ color: 0xe9ece8 }),
      yellowPaint: new MeshBasicMaterial({ color: 0xeab636 }),
      terracotta: new MeshStandardMaterial({ color: 0x9c5a44, roughness: .82, metalness: .05 }),
      sandstone: new MeshStandardMaterial({ color: 0xbba98e, roughness: .84, metalness: .04 }),
      slateFacade: new MeshStandardMaterial({ color: 0x45535e, roughness: .58, metalness: .28 }),
      whiteConcrete: new MeshStandardMaterial({ color: 0xcfd3ce, roughness: .76, metalness: .06 }),
      darkSteel: new MeshStandardMaterial({ color: 0x252c31, roughness: .50, metalness: .68 }),
      glassUrban: new MeshStandardMaterial({ color: 0x6ea6c2, roughness: .10, metalness: .42, transparent: true, opacity: .45 }),
      glassWarm: new MeshBasicMaterial({ color: 0xffd591 }),
      glassCyan: new MeshBasicMaterial({ color: 0x58e8ff }),
      rock: new MeshStandardMaterial({ color: 0x575b56, roughness: .94, metalness: .05 }),
      grass: new MeshStandardMaterial({ color: 0x354d38, roughness: .92, metalness: .02 }),
      pine: new MeshStandardMaterial({ color: 0x23422c, roughness: .88, metalness: .02 }),
      trunk: new MeshStandardMaterial({ color: 0x4f3a2a, roughness: .92, metalness: .02 }),
      hangarRoof: new MeshStandardMaterial({ color: 0x5e6b73, roughness: .55, metalness: .52 }),
      redBeacon: new MeshBasicMaterial({ color: 0xff4530 }),
      greenLight: new MeshBasicMaterial({ color: 0x4aff9b }),
      blueTaxi: new MeshBasicMaterial({ color: 0x3fa7ff }),
      sedanBlue: new MeshStandardMaterial({ color: 0x2b5075, roughness: .35, metalness: .55 }),
      sedanWhite: new MeshStandardMaterial({ color: 0xd8dce0, roughness: .38, metalness: .42 }),
      sedanRed: new MeshStandardMaterial({ color: 0x8f2d28, roughness: .38, metalness: .48 }),
    };

    const boxGeo = new BoxGeometry(1, 1, 1);
    const cylGeo = new CylinderGeometry(1, 1, 1, 16);
    const coneGeo = new ConeGeometry(1, 1, 10);
    const sphGeo = new SphereGeometry(1, 16, 12);

    const sectors = [];
    const updaters = [];
    const interactiveTerminals = [];

    function makeSector(id, nameZh, nameEn, center, streamRadius = 210) {
      const group = new Group();
      group.name = 'world-sector-' + id;
      const shell = new Group();
      const detail = new Group();
      group.add(shell, detail);
      root.add(group);
      const sec = {
        id, nameZh, nameEn,
        center: new Vector3(...center),
        streamRadius,
        detailRadius: streamRadius * .68,
        group, shell, detail,
        colliderSpecs: [],
        activeColliders: [],
        loaded: false,
        detailed: false,
      };
      sectors.push(sec);
      return sec;
    }

    function addBox(parent, mat, w, h, d, x, y, z, shadow = true) {
      const m = new Mesh(boxGeo, mat);
      m.position.set(x, y, z);
      m.scale.set(w, h, d);
      m.castShadow = shadow && mat !== M.glassUrban;
      m.receiveShadow = true;
      parent.add(m);
      return m;
    }

    function solid(sec, parent, mat, x0, y0, z0, x1, y1, z1, surface = 'concrete', collide = true) {
      const w = Math.abs(x1 - x0), h = Math.abs(y1 - y0), d = Math.abs(z1 - z0);
      addBox(parent, mat, w, h, d, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, h > .3);
      if (collide) {
        sec.colliderSpecs.push({
          min: new Vector3(Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1)),
          max: new Vector3(Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)),
          surface,
        });
      }
    }

    function addPineTree(parent, x, y, z, scale = 1) {
      const g = new Group();
      g.position.set(x, y, z);
      const trunk = new Mesh(cylGeo, M.trunk);
      trunk.scale.set(.24 * scale, 2.4 * scale, .24 * scale);
      trunk.position.y = 1.2 * scale;
      g.add(trunk);
      for (let i = 0; i < 3; i++) {
        const crown = new Mesh(coneGeo, M.pine);
        const r = (2.1 - i * .45) * scale;
        const h = (2.8 - i * .35) * scale;
        crown.scale.set(r, h, r);
        crown.position.y = (2.8 + i * 1.45) * scale;
        g.add(crown);
      }
      parent.add(g);
    }

    function addStreetLamp(parent, x, y, z, armDir = 1) {
      const pole = new Mesh(cylGeo, M.darkSteel);
      pole.scale.set(.10, 6.2, .10);
      pole.position.set(x, y + 3.1, z);
      const arm = addBox(parent, M.darkSteel, 1.8, .10, .12, x + armDir * .9, y + 6.1, z, false);
      const bulb = addBox(parent, M.glassWarm, .55, .08, .22, x + armDir * 1.65, y + 6.02, z, false);
      parent.add(pole, arm, bulb);
    }

    function addParkedSedan(parent, x, y, z, yaw, mat) {
      const g = new Group();
      g.position.set(x, y, z);
      g.rotation.y = yaw;
      addBox(g, mat, 1.85, .62, 4.3, 0, .58, 0);
      addBox(g, mat, 1.62, .56, 2.1, 0, 1.12, -.15);
      addBox(g, M.glassUrban, 1.56, .46, 2.16, 0, 1.12, -.15, false);
      for (const wx of [-.92, .92]) for (const wz of [-1.35, 1.35]) {
        const wheel = new Mesh(cylGeo, M.darkSteel);
        wheel.rotation.z = Math.PI / 2;
        wheel.scale.set(.34, .22, .34);
        wheel.position.set(wx, .34, wz);
        g.add(wheel);
      }
      parent.add(g);
    }

    // =========================================================================
    // SECTOR 1: COASTAL CITY DOWNTOWN (x: -95..+35, z: -30..-138)
    // =========================================================================
    const city = makeSector('city', '沿海城区主干道', 'Coastal City Downtown', [-26, 0, -84], 220);
    // Broad urban asphalt & sidewalk ground plane connecting directly through North Gate (x:-33..-19, z:-30)
    solid(city, city.shell, M.asphalt, -98, -.16, -142, 38, .02, -30, 'concrete', true);
    // Main North-South 4-lane Boulevard (x = -26, z = -30..-140) & East-West Coastal Avenue (z = -84, x = -98..+38)
    for (let z = -34; z >= -138; z -= 6.5) {
      addBox(city.detail, M.yellowPaint, .16, .02, 3.2, -26, .04, z, false);
    }
    for (let x = -92; x <= 32; x += 6.5) {
      if (Math.abs(x + 26) < 9) continue;
      addBox(city.detail, M.yellowPaint, 3.2, .02, .16, x, .04, -84, false);
    }
    // Crosswalks at the downtown intersection (-26, -84)
    for (let i = -3; i <= 3; i++) {
      addBox(city.detail, M.whitePaint, .7, .02, 3.2, -26 + i * 1.6, .045, -74, false);
      addBox(city.detail, M.whitePaint, .7, .02, 3.2, -26 + i * 1.6, .045, -94, false);
    }

    // Raised sidewalks & urban blocks on all 4 quadrants around the intersection
    const blocks = [
      { x0: -68, z0: -70, x1: -37, z1: -38, mat: M.terracotta, h: 11.5, name: 'Harborview Apartments' },
      { x0: -14, z0: -70, x1: 22, z1: -38, mat: M.sandstone, h: 9.2, enterable: true, name: 'Coastal Civic Plaza' },
      { x0: -68, z0: -132, x1: -37, z1: -98, mat: M.slateFacade, h: 15.0, name: 'Maritime Insurance Tower' },
      { x0: -14, z0: -132, x1: 22, z1: -98, mat: M.whiteConcrete, h: 12.5, name: 'Coastal News & Cafe Block' },
    ];
    for (const blk of blocks) {
      // Sidewalk apron
      solid(city, city.shell, M.sidewalk, blk.x0 - 2.4, -.04, blk.z0 - 2.4, blk.x1 + 2.4, .18, blk.z1 + 2.4, 'concrete', true);
      if (blk.enterable) {
        // Walk-in glass lobby building (Civic Plaza & Harbormaster Annex)
        const bx0 = blk.x0 + 2, bx1 = blk.x1 - 2, bz0 = blk.z0 + 2, bz1 = blk.z1 - 2;
        solid(city, city.shell, blk.mat, bx0, .18, bz0, bx1, blk.h, bz0 + .5, 'concrete', true);
        solid(city, city.shell, blk.mat, bx1 - .5, .18, bz0, bx1, blk.h, bz1, 'concrete', true);
        solid(city, city.shell, blk.mat, bx0, .18, bz1 - .5, bx1, blk.h, bz1, 'concrete', true);
        // West entrance with wide 4m doorway facing the boulevard
        solid(city, city.shell, blk.mat, bx0, .18, bz0, bx0 + .5, blk.h, (bz0 + bz1) / 2 - 2.2, 'concrete', true);
        solid(city, city.shell, blk.mat, bx0, .18, (bz0 + bz1) / 2 + 2.2, bx0 + .5, blk.h, bz1, 'concrete', true);
        solid(city, city.shell, blk.mat, bx0, 3.6, bz0, bx0 + .5, blk.h, bz1, 'concrete', true);
        // Ceiling & upper floor windows
        solid(city, city.shell, M.whiteConcrete, bx0, 3.8, bz0, bx1, 4.1, bz1, 'concrete', true);
        solid(city, city.shell, M.darkSteel, bx0 - .5, blk.h, bz0 - .5, bx1 + .5, blk.h + .4, bz1 + .5, 'metal', true);
        // Interior reception counter + glowing warm lobby lighting
        addBox(city.detail, M.sandstone, 2.2, 1.1, 6.0, bx0 + 7.5, .75, (bz0 + bz1) / 2);
        addBox(city.detail, M.glassCyan, .4, .55, 2.8, bx0 + 7.5, 1.55, (bz0 + bz1) / 2, false);
        const lobbyLight = new PointLight(0xffe2b0, 18, 22, 1.5);
        lobbyLight.position.set((bx0 + bx1) / 2, 3.3, (bz0 + bz1) / 2);
        city.detail.add(lobbyLight);
      } else {
        // Multi-story urban building with illuminated window rows
        solid(city, city.shell, blk.mat, blk.x0 + 2, .18, blk.z0 + 2, blk.x1 - 2, blk.h, blk.z1 - 2, 'concrete', true);
        for (let wy = 2.6; wy < blk.h - 1.2; wy += 3.0) {
          for (let wx = blk.x0 + 5; wx < blk.x1 - 4; wx += 4.6) {
            const lit = ((Math.round(wx + wy) % 3) !== 0) ? M.glassWarm : M.glassUrban;
            addBox(city.detail, lit, 2.4, 1.5, .12, wx, wy, blk.z1 - 1.92, false);
            addBox(city.detail, lit, 2.4, 1.5, .12, wx, wy, blk.z0 + 1.92, false);
          }
        }
      }
    }
    // Streetlights, trees & parked civilian cars along the downtown boulevard
    for (const z of [-44, -62, -104, -124]) {
      addStreetLamp(city.detail, -36.5, .18, z, 1);
      addStreetLamp(city.detail, -15.5, .18, z, -1);
      addPineTree(city.detail, -38.5, .18, z + 6, .75);
      addPineTree(city.detail, -13.5, .18, z - 6, .75);
    }
    addParkedSedan(city.detail, -33.2, .02, -52, 0, M.sedanBlue);
    addParkedSedan(city.detail, -18.8, .02, -64, Math.PI, M.sedanWhite);
    addParkedSedan(city.detail, -33.2, .02, -112, 0, M.sedanRed);
    addParkedSedan(city.detail, -18.8, .02, -120, Math.PI, M.sedanBlue);

    // =========================================================================
    // SECTOR 2: MOUNTAIN RIDGE & SATELLITE COMMS STATION (y = 0 -> +14m!)
    // =========================================================================
    const mountain = makeSector('mountain', '沿海山地卫星通信站', 'Mountain Ridge & Comms Station', [95, 14, -84], 240);
    // Smooth stepped drivable/walkable mountain road climbing from x=36 (y=0) up to x=106 (y=14m)
    const rampSteps = 28;
    const rampX0 = 36, rampX1 = 104, summitY = 14.0;
    for (let i = 0; i < rampSteps; i++) {
      const f0 = i / rampSteps, f1 = (i + 1) / rampSteps;
      const sx0 = rampX0 + (rampX1 - rampX0) * f0;
      const sx1 = rampX0 + (rampX1 - rampX0) * f1 + .35;
      const sy = summitY * f1;
      solid(mountain, mountain.shell, M.asphalt, sx0, sy - 1.2, -91, sx1, sy, -77, 'concrete', true);
      // Rocky mountain slope flanks & white guardrails
      addBox(mountain.shell, M.rock, sx1 - sx0 + .5, sy + 2.5, 14, (sx0 + sx1) / 2, (sy - 2.5) / 2, -98, false);
      addBox(mountain.shell, M.rock, sx1 - sx0 + .5, sy + 2.5, 14, (sx0 + sx1) / 2, (sy - 2.5) / 2, -70, false);
      if (i % 3 === 0) {
        addPineTree(mountain.detail, (sx0 + sx1) / 2, sy - .4, -95, 1.15);
        addPineTree(mountain.detail, (sx0 + sx1) / 2, sy - .4, -73, 1.05);
      }
    }
    // Summit Plateau (x: 104..152, z: -116..-52, elevation y = +14.0m!)
    solid(mountain, mountain.shell, M.grass, 102, 0, -118, 154, summitY, -50, 'concrete', true);
    solid(mountain, mountain.shell, M.asphalt, 104, summitY - .2, -104, 142, summitY + .06, -64, 'concrete', true);
    // Alpine pine forest around summit ridge
    for (const [tx, tz, sc] of [
      [108, -110, 1.3], [122, -112, 1.4], [140, -108, 1.25], [148, -94, 1.35],
      [148, -72, 1.2], [136, -56, 1.3], [116, -56, 1.15],
    ]) addPineTree(mountain.detail, tx, summitY, tz, sc);

    // 2-Story Mountain Satellite Communications Building + Giant Rotating 12m Parabolic Dish!
    solid(mountain, mountain.shell, M.whiteConcrete, 122, summitY, -98, 140, summitY + 7.2, -82, 'concrete', true);
    addBox(mountain.detail, M.glassUrban, 14.5, 2.2, .25, 131, summitY + 5.2, -81.9, false);
    addBox(mountain.detail, M.glassCyan, 4.5, 1.2, .12, 131, summitY + 2.1, -81.85, false);
    // Giant Rotating Radar / Satellite Dish on summit tower
    const dishBase = new Group();
    dishBase.position.set(131, summitY + 7.4, -90);
    const dishPedestal = new Mesh(cylGeo, M.darkSteel);
    dishPedestal.scale.set(1.3, 3.2, 1.3);
    dishPedestal.position.y = 1.6;
    const dishHead = new Group();
    dishHead.position.y = 3.8;
    const bowl = new Mesh(new SphereGeometry(5.2, 20, 12, 0, Math.PI * 2, 0, Math.PI * .36), M.whiteConcrete);
    bowl.rotation.x = Math.PI * .72;
    const feedHorn = new Mesh(cylGeo, M.redBeacon);
    feedHorn.scale.set(.24, 3.6, .24);
    feedHorn.position.set(0, 1.8, 2.2);
    feedHorn.rotation.x = .65;
    dishHead.add(bowl, feedHorn);
    dishBase.add(dishPedestal, dishHead);
    mountain.shell.add(dishBase);
    updaters.push(dt => { dishHead.rotation.y += dt * .55; });

    // Interactive Mountain Satellite Intercept Terminal (new objective/discovery at summit!)
    const satPos = new Vector3(120.5, summitY, -84);
    addBox(mountain.detail, M.darkSteel, .9, 1.4, .7, satPos.x, satPos.y + .7, satPos.z);
    addBox(mountain.detail, M.glassCyan, .65, .36, .08, satPos.x - .48, satPos.y + 1.05, satPos.z, false);
    interactiveTerminals.push({
      id: 'mountain-sat-intercept',
      pos: satPos,
      done: false,
      prompt: ['Intercept Ward & Reed’s mountain satellite relay', '截获山地卫星站中继的沃德与里德加密通话'],
      onActivate() {
        world.tactical?.notify?.('📡 山地卫星中继破解成功！截获沃德与铁砧 05:29 封港密令，并全图标记所有敌军！',
          '📡 Mountain satellite relay cracked! Intercepted Ward–Anvil 05:29 lockdown order!', false, 6.5);
        world.tactical?.triggerScan?.(true);
      },
    });

    // =========================================================================
    // SECTOR 3: COASTAL AIRFIELD & ARCHED HANGAR (x: -175..-65, z: -135..-225)
    // =========================================================================
    const airfield = makeSector('airfield', '海岸应急机场与机库', 'Coastal Airfield & Hangar', [-115, 0, -175], 240);
    // Connecting taxiway from City Avenue (x: -98..-68, z: -140..-155) + Massive 130m Runway Apron
    solid(airfield, airfield.shell, M.asphalt, -178, -.16, -222, -46, .02, -138, 'concrete', true);
    // Runway 09/27 markings & glowing blue/amber edge lights
    for (let x = -170; x <= -56; x += 9) {
      addBox(airfield.detail, M.whitePaint, 4.6, .025, .45, x, .045, -182, false);
      addBox(airfield.detail, M.blueTaxi, .26, .35, .26, x, .22, -166, false);
      addBox(airfield.detail, M.blueTaxi, .26, .35, .26, x, .22, -198, false);
    }
    // Giant Drivable Barrel-Vault Aviation Hangar (open front facing south toward runway!)
    const hx = -112, hz = -208;
    solid(airfield, airfield.shell, M.hangarRoof, hx - 14, 0, hz - 11, hx - 13.2, 8.2, hz + 11, 'metal', true);
    solid(airfield, airfield.shell, M.hangarRoof, hx + 13.2, 0, hz - 11, hx + 14, 8.2, hz + 11, 'metal', true);
    solid(airfield, airfield.shell, M.hangarRoof, hx - 14, 0, hz - 11, hx + 14, 8.2, hz - 10.2, 'metal', true);
    const archRoof = new Mesh(new CylinderGeometry(14.2, 14.2, 22, 20, 1, true, 0, Math.PI), M.hangarRoof);
    archRoof.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    archRoof.position.set(hx, 8.0, hz);
    airfield.shell.add(archRoof);
    const hangarLight = new PointLight(0xffe6ba, 26, 36, 1.4);
    hangarLight.position.set(hx, 9.5, hz);
    airfield.detail.add(hangarLight);

    // 4-Story Air Traffic Control Tower next to the hangar
    solid(airfield, airfield.shell, M.whiteConcrete, -80, 0, -210, -72, 12.0, -202, 'concrete', true);
    solid(airfield, airfield.shell, M.glassUrban, -81.5, 12.0, -211.5, -70.5, 15.2, -200.5, 'glass', true);
    solid(airfield, airfield.shell, M.darkSteel, -82, 15.2, -212, -70, 15.8, -200, 'metal', true);
    const atcRadar = addBox(airfield.detail, M.whiteConcrete, 4.2, .35, .45, -76, 17.2, -206, false);
    updaters.push(dt => { atcRadar.rotation.y += dt * 1.9; });

    // Live Performance & Sector Telemetry HUD
    const hud = document.createElement('div');
    hud.className = 'sl-world-hud';
    hud.innerHTML = `<div class="sl-world-zone" data-zone>当前区域：四号泊位港区</div><div data-perf>FPS -- · 开放扇区 0/3</div>`;
    document.body.appendChild(hud);
    const zoneEl = hud.querySelector('[data-zone]');
    const perfEl = hud.querySelector('[data-perf]');

    let fpsSmooth = 60, hudTimer = 0;
    const local = (en, zh) => window.SaltlineLocale?.t(en, zh) ?? zh;

    function syncColliders(sec, enable) {
      if (!physics?.addBox || !physics?.removeBox) return;
      if (enable && !sec.activeColliders.length) {
        for (const c of sec.colliderSpecs) sec.activeColliders.push(physics.addBox(c.min, c.max, { surface: c.surface }));
      } else if (!enable && sec.activeColliders.length) {
        for (const b of sec.activeColliders.splice(0)) physics.removeBox(b);
      }
    }

    function detectZone(pos) {
      if (!pos) return local('Berth 4 Harbor', '四号泊位港区');
      if (pos.x > 42 && pos.z < -45) return local('Mountain Comms Station (+14m)', '沿海山地卫星通信站 (+14m)');
      if (pos.z < -138) return local('Coastal Emergency Airfield', '海岸应急机场与机库');
      if (pos.z < -31) return local('Coastal City Downtown', '沿海城区主干道');
      return local('Berth 4 Harbor', '四号泊位港区');
    }

    function update(dt, playerPos, interact = false) {
      if (!(dt > 0)) return;
      fpsSmooth = fpsSmooth * .92 + (1 / Math.max(.004, dt)) * .08;
      for (const fn of updaters) fn(dt);

      let loadedCount = 0;
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
        if (sec.loaded) loadedCount++;
      }

      // Check summit terminal interaction
      if (playerPos && interact) {
        for (const term of interactiveTerminals) {
          if (!term.done && playerPos.distanceTo(term.pos) < 3.2) {
            term.done = true;
            term.onActivate();
          }
        }
      }

      hudTimer += dt;
      if (hudTimer >= .25) {
        hudTimer = 0;
        zoneEl.textContent = local('Zone: ', '当前区域：') + detectZone(playerPos);
        perfEl.textContent = `${Math.round(fpsSmooth)} FPS · ${local('Streamed', '流式扇区')} ${loadedCount}/${sectors.length}`;
      }
    }

    function dispose() {
      for (const sec of sectors) syncColliders(sec, false);
      root.removeFromParent();
      hud.remove();
    }

    return {
      update, dispose,
      waypoints: [
        { label: 'North City Highway Gate', zh: '北向沿海高速出口（四驱车旁）', pos: new Vector3(-26, 0, -25) },
        { label: 'Coastal City Downtown', zh: '新地貌 · 沿海城区十字路口', pos: new Vector3(-26, .1, -78) },
        { label: 'Coastal Civic Plaza (Interior)', zh: '新地貌 · 沿海市政玻璃大堂内部', pos: new Vector3(-6, .25, -54) },
        { label: 'Mountain Comms Summit (+14m)', zh: '新地貌 · 海拔+14m山地卫星通信站', pos: new Vector3(114, 14.1, -84) },
        { label: 'Coastal Airfield & Hangar', zh: '新地貌 · 海岸应急机场跑道与机库', pos: new Vector3(-112, .1, -182) },
      ],
    };
  };
})();
