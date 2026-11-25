/* Multi-Story Chapter Architecture & COD-Scale Sector Streaming System.
 * Builds walkable 2–3 story functional buildings, staircases, interiors, radar towers,
 * fuel farms, clinics, and chart halls for all 9 chapters, with distance-based
 * sector streaming (shell vs. interior LOD) for smooth performance on large maps. */
(() => {
  const CHAPTER_BUILDINGS = {
    berth: [
      { id: 'berth-ops-tower', kind: 'ops_tower', title: ['2F Port Ops Tower', '四号泊位 · 双层联合作战指挥楼'], pos: [-45, 0, -20], yaw: 0 },
    ],
    rail: [
      { id: 'rail-signal-tower', kind: 'signal_tower', title: ['2F Rail Signal Tower', '铁路货场 · 双层编组信号楼'], pos: [-48, 0, -22], yaw: 0 },
      { id: 'rail-fuel-farm', kind: 'fuel_farm', title: ['Rail Diesel Depot', '铁路货场 · 柴油补给罐区'], pos: [-102, 0, -22], yaw: Math.PI / 2 },
    ],
    drydock: [
      { id: 'drydock-pumphouse', kind: 'pump_house', title: ['2F Drydock Pump House', '旧船坞 · 双层巨型泵房与检修廊'], pos: [-16, 0, -14], yaw: 0 },
    ],
    tidegate: [
      { id: 'tidegate-bastion', kind: 'tide_bastion', title: ['2F Tide Gate Bastion', '防潮闸 · 双层液压控制堡垒'], pos: [-56, 0, -14], yaw: 0 },
    ],
    anchorage: [
      { id: 'anchorage-platform', kind: 'offshore_deck', title: ['2F Offshore Control Deck', '外锚地 · 双层维修平台指挥甲板'], pos: [14, 0, -10], yaw: 0 },
    ],
    'return-harbor': [
      { id: 'clinic-building', kind: 'field_clinic', title: ['2F Cold Storage & Field Clinic', '归港 · 双层冷雾库与战地分诊楼'], pos: [-18, 0, -14], yaw: 0 },
    ],
    'night-record': [
      { id: 'dispatch-tower-3f', kind: 'dispatch_tower', title: ['3F Harbor Dispatch Tower', '夜班录音 · 三层港务主调度塔'], pos: [14, 0, -14], yaw: 0 },
    ],
    'last-pilot': [
      { id: 'pilot-station-2f', kind: 'pilot_station', title: ['2F Outer Pilot Station', '最后一班引航 · 双层外港引航站'], pos: [16, 0, -12], yaw: 0 },
    ],
    reopen: [
      { id: 'reopen-lighthouse', kind: 'lighthouse', title: ['Harbor Reopen Beacon & Arch', '重新开航 · 港区重开灯塔与迎航拱门'], pos: [-44, 0, -18], yaw: 0 },
    ],
  };

  window.createPortChapterArchitecture = (world, { chapterId = 'berth' } = {}) => {
    const { THREE, scene, physics } = world;
    const { Group, Mesh, BoxGeometry, CylinderGeometry, SphereGeometry, TorusGeometry,
      MeshStandardMaterial, MeshBasicMaterial, PointLight, Vector3 } = THREE;

    const root = new Group();
    root.name = 'chapter-architecture-root';
    scene.add(root);

    // Shared architectural PBR materials
    const M = {
      concrete: world.mats?.get?.('concrete') ?? new MeshStandardMaterial({ color: 0x6f7370, roughness: .88, metalness: .06 }),
      concreteDark: world.mats?.get?.('concrete_dirty') ?? new MeshStandardMaterial({ color: 0x484d4b, roughness: .9, metalness: .08 }),
      steel: world.mats?.get?.('steel_dark') ?? new MeshStandardMaterial({ color: 0x434d52, roughness: .52, metalness: .66 }),
      steelLight: world.mats?.get?.('steel_galv') ?? new MeshStandardMaterial({ color: 0x778287, roughness: .42, metalness: .72 }),
      corrugated: world.mats?.get?.('steel_worn') ?? new MeshStandardMaterial({ color: 0x3b484f, roughness: .62, metalness: .45 }),
      wallPaint: new MeshStandardMaterial({ color: 0xb7b9b2, roughness: .78, metalness: .06 }),
      hazard: new MeshStandardMaterial({ color: 0xd99b26, roughness: .48, metalness: .22 }),
      red: new MeshStandardMaterial({ color: 0xa83226, roughness: .52, metalness: .25 }),
      glass: new MeshStandardMaterial({ color: 0x6ba0b8, roughness: .12, metalness: .35, transparent: true, opacity: .38 }),
      wood: world.mats?.get?.('wood_dark') ?? new MeshStandardMaterial({ color: 0x6e533c, roughness: .78, metalness: .04 }),
      whiteCloth: new MeshStandardMaterial({ color: 0xdce2e4, roughness: .82, metalness: .02 }),
      darkTrim: new MeshStandardMaterial({ color: 0x1e2427, roughness: .55, metalness: .52 }),
      glowWarm: new MeshBasicMaterial({ color: 0xffe4b5 }),
      glowCyan: new MeshBasicMaterial({ color: 0x58e8ff }),
      glowGreen: new MeshBasicMaterial({ color: 0x5bffa8 }),
      glowRed: new MeshBasicMaterial({ color: 0xff4c33 }),
    };

    const boxGeo = new BoxGeometry(1, 1, 1);
    const cylGeo = new CylinderGeometry(1, 1, 1, 20);
    const sphGeo = new SphereGeometry(1, 16, 12);

    const sectors = [];
    const updaters = [];
    let streamingMode = 'standard'; // 'compact' (75m) | 'standard' (140m) | 'full' (999m)
    const STREAM_DIST = {
      compact: { shell: 80, interior: 42 },
      standard: { shell: 145, interior: 78 },
      full: { shell: 9999, interior: 9999 },
    };

    function createBuilder(sector, origin, yaw) {
      const cos = Math.cos(yaw), sin = Math.sin(yaw);
      const toWorld = (lx, ly, lz) => new Vector3(
        origin.x + lx * cos + lz * sin,
        origin.y + ly,
        origin.z - lx * sin + lz * cos,
      );

      function addMesh(parent, geo, mat, sx, sy, sz, x, y, z, shadow = false) {
        const m = new Mesh(geo, mat);
        m.position.set(x, y, z);
        m.scale.set(sx, sy, sz);
        m.castShadow = shadow && mat !== M.glass;
        m.receiveShadow = true;
        m.matrixAutoUpdate = false;
        m.updateMatrix();
        parent.add(m);
        return m;
      }

      function addCollider(x0, y0, z0, x1, y1, z1, surface = 'concrete') {
        const p0 = toWorld(x0, y0, z0);
        const p1 = toWorld(x1, y1, z1);
        const min = new Vector3(Math.min(p0.x, p1.x), Math.min(p0.y, p1.y), Math.min(p0.z, p1.z));
        const max = new Vector3(Math.max(p0.x, p1.x), Math.max(p0.y, p1.y), Math.max(p0.z, p1.z));
        sector.colliderSpecs.push({ min, max, surface });
      }

      function solid(parent, mat, x0, y0, z0, x1, y1, z1, surface = 'concrete', collide = true) {
        const w = Math.abs(x1 - x0), h = Math.abs(y1 - y0), d = Math.abs(z1 - z0);
        addMesh(parent, boxGeo, mat, w, h, d, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
        if (collide) addCollider(x0, y0, z0, x1, y1, z1, surface);
      }

      // Walkable industrial steel staircase (14 individual treads + side stringers + safety handrails)
      function addStaircase(parent, x, y0, z0, height, runZ, width = 1.6) {
        const steps = Math.max(10, Math.round(height / .26));
        const stepH = height / steps;
        const stepD = runZ / steps;
        for (let i = 0; i < steps; i++) {
          const sy = y0 + (i + 1) * stepH;
          const sz = z0 + i * stepD;
          solid(parent, M.steel, x - width / 2, sy - .08, sz, x + width / 2, sy, sz + stepD + .04, 'metal', true);
        }
        // Handrails along both sides
        for (const side of [-1, 1]) {
          const rx = x + side * (width / 2 - .04);
          for (let i = 0; i <= 4; i++) {
            const f = i / 4;
            addMesh(parent, boxGeo, M.hazard, .05, .95, .05, rx, y0 + f * height + .48, z0 + f * runZ);
          }
          const rail = addMesh(parent, boxGeo, M.hazard, .05, .05, Math.hypot(height, runZ),
            rx, y0 + height / 2 + .95, z0 + runZ / 2);
          rail.rotation.x = -Math.atan2(height, runZ);
        }
      }

      function addRailing(parent, x0, z0, x1, z1, y) {
        const len = Math.hypot(x1 - x0, z1 - z0);
        const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
        const ang = Math.atan2(x1 - x0, z1 - z0);
        for (const ry of [y + .52, y + 1.02]) {
          const bar = addMesh(parent, boxGeo, M.hazard, .045, .045, len, mx, ry, mz);
          bar.rotation.y = ang;
        }
        const posts = Math.max(2, Math.round(len / 2.2) + 1);
        for (let i = 0; i < posts; i++) {
          const f = i / (posts - 1);
          addMesh(parent, boxGeo, M.steel, .05, 1.04, .05, x0 + (x1 - x0) * f, y + .52, z0 + (z1 - z0) * f);
        }
        const pad = .08;
        addCollider(Math.min(x0, x1) - pad, y, Math.min(z0, z1) - pad, Math.max(x0, x1) + pad, y + 1.1, Math.max(z0, z1) + pad, 'metal');
      }

      function addGlassBand(parent, x0, y0, z0, x1, y1, z1) {
        solid(parent, M.glass, x0, y0, z0, x1, y1, z1, 'glass', true);
        const isX = Math.abs(x1 - x0) >= Math.abs(z1 - z0);
        const span = isX ? Math.abs(x1 - x0) : Math.abs(z1 - z0);
        const count = Math.max(2, Math.round(span / 1.8));
        for (let i = 0; i <= count; i++) {
          const f = i / count;
          const mx = x0 + (x1 - x0) * f, mz = z0 + (z1 - z0) * f;
          addMesh(parent, boxGeo, M.steelLight, .07, y1 - y0, .07, mx, (y0 + y1) / 2, mz);
        }
      }

      function addConsoleDesk(parent, x, y, z, accentMat = M.glowCyan) {
        addMesh(parent, boxGeo, M.steel, 2.2, .86, .75, x, y + .43, z);
        addMesh(parent, boxGeo, M.wood, 2.32, .06, .84, x, y + .89, z);
        for (const ox of [-.55, .55]) {
          addMesh(parent, boxGeo, M.darkTrim, .64, .42, .06, x + ox, y + 1.22, z - .18);
          addMesh(parent, boxGeo, accentMat, .56, .34, .02, x + ox, y + 1.22, z - .14);
        }
      }

      function addServerRack(parent, x, y, z) {
        addMesh(parent, boxGeo, M.darkTrim, .82, 2.15, .74, x, y + 1.08, z);
        for (let i = 0; i < 5; i++) {
          addMesh(parent, boxGeo, i % 2 ? M.glowGreen : M.glowCyan, .54, .05, .02, x, y + .42 + i * .34, z + .38);
        }
      }

      function addRadarMast(parent, x, y, z) {
        addMesh(parent, cylGeo, M.steelLight, .14, 3.2, .14, x, y + 1.6, z);
        const dishGroup = new Group();
        dishGroup.position.set(x, y + 3.25, z);
        addMesh(dishGroup, boxGeo, M.whiteCloth, 2.6, .24, .34, 0, 0, 0);
        addMesh(dishGroup, sphGeo, M.glowRed, .11, .11, .11, 0, .28, 0);
        parent.add(dishGroup);
        updaters.push(dt => { dishGroup.rotation.y += dt * 1.4; });
      }

      function addCeilingLight(parent, x, y, z) {
        addMesh(parent, boxGeo, M.darkTrim, 1.4, .08, .28, x, y - .04, z);
        addMesh(parent, boxGeo, M.glowWarm, 1.25, .03, .20, x, y - .09, z);
      }

      return { addMesh, addCollider, solid, addStaircase, addRailing, addGlassBand, addConsoleDesk, addServerRack, addRadarMast, addCeilingLight, toWorld };
    }

    // Multi-story architectural templates
    function buildTwoStoryControl(b, shell, interior, { floors = 2, style = 'ops' } = {}) {
      const W = 11.6, D = 8.4, H = 3.6;
      const x0 = -W / 2, x1 = W / 2, z0 = -D / 2, z1 = D / 2;

      // Ground concrete apron pad (expanded walkable foundation)
      b.solid(shell, M.concreteDark, x0 - 3.6, -.12, z0 - 2.6, x1 + 3.6, .04, z1 + 3.4, 'concrete', true);

      for (let f = 0; f < floors; f++) {
        const y0 = f * H;
        const y1 = y0 + H;
        // Floor slab (with exterior balcony on upper floors!)
        if (f > 0) {
          b.solid(shell, M.concrete, x0 - 2.4, y0 - .18, z0 - .2, x1 + .2, y0 + .04, z1 + 2.2, 'concrete', true);
          // Upper balcony safety railings (leave staircase landing open at x0 - 1.6, z1)
          b.addRailing(shell, x0 - 2.3, z1 + 2.1, x1 + .1, z1 + 2.1, y0);
          b.addRailing(shell, x1 + .1, z0, x1 + .1, z1 + 2.1, y0);
          b.addRailing(shell, x0 - 2.3, z0, x0 - 2.3, z0 + 2.2, y0);
        }
        // Corner structural I-beam columns
        for (const cx of [x0, x1]) for (const cz of [z0, z1]) {
          b.solid(shell, M.steel, cx - .22, y0, cz - .22, cx + .22, y1, cz + .22, 'metal', true);
        }
        // Back & right walls
        b.solid(shell, M.corrugated, x0, y0, z0, x1, y1, z0 + .22, 'metal', true);
        b.solid(shell, M.concrete, x1 - .22, y0, z0, x1, y1, z1, 'concrete', true);
        // Left wall with wide walk-in doorway on every floor (z from -1.2 to +1.4)
        b.solid(shell, M.concrete, x0, y0, z0, x0 + .22, y1, -1.2, 'concrete', true);
        b.solid(shell, M.concrete, x0, y0, 1.4, x0 + .22, y1, z1, 'concrete', true);
        b.solid(shell, M.steel, x0, y0 + 2.45, -1.2, x0 + .22, y1, 1.4, 'metal', true);
        // Front panoramic glass curtain wall + lower concrete parapet
        b.solid(shell, M.concrete, x0, y0, z1 - .22, x1, y0 + 1.05, z1, 'concrete', true);
        b.addGlassBand(shell, x0 + .22, y0 + 1.05, z1 - .14, x1 - .22, y1 - .25, z1 - .06);
        b.solid(shell, M.steel, x0, y1 - .25, z1 - .22, x1, y1, z1, 'metal', true);

        // Exterior walkable steel staircase connecting floor f to f+1
        if (f < floors - 1) {
          b.addStaircase(shell, x0 - 1.35, y0, z0 + 1.4, H, D - 1.2, 1.75);
        }

        // Rich interior details (streamed by interiorRadius!)
        b.addCeilingLight(interior, 0, y1 - .1, 0, style === 'clinic' && f === 1 ? 0xdff8ff : 0xffe4b5);
        if (f === 0) {
          b.addConsoleDesk(interior, 1.8, y0, z0 + 1.2, M.glowCyan);
          b.addServerRack(interior, 4.4, y0, z0 + 1.1);
          b.addServerRack(interior, 4.4, y0, z0 + 2.2);
          if (style === 'pump') {
            // Twin giant centrifugal pump turbines
            for (const px of [-2.2, .4]) {
              const pump = b.addMesh(interior, cylGeo, M.hazard, .85, 2.2, .85, px, y0 + 1.05, 1.2);
              pump.rotation.z = Math.PI / 2;
              b.addMesh(interior, cylGeo, M.steelLight, .28, 3.2, .28, px, y0 + 2.2, 1.2);
            }
          }
        } else if (style === 'clinic' && f === 1) {
          // 2F Field Clinic: 4 triage beds & medical monitors
          for (let i = 0; i < 4; i++) {
            const bx = -3.4 + i * 2.2;
            b.addMesh(interior, boxGeo, M.steelLight, 1.1, .55, 2.1, bx, y0 + .28, z0 + 1.8);
            b.addMesh(interior, boxGeo, M.whiteCloth, 1.04, .18, 2.02, bx, y0 + .64, z0 + 1.8);
            b.addMesh(interior, boxGeo, M.glowCyan, .28, .22, .05, bx + .52, y0 + 1.25, z0 + 1.1);
          }
        } else {
          // 2F / 3F Command Deck: central tactical harbor map table + dual workstations
          b.addMesh(interior, boxGeo, M.steel, 3.4, .88, 1.9, 0, y0 + .44, .4);
          b.addMesh(interior, boxGeo, M.glowCyan, 2.9, .05, 1.45, 0, y0 + .91, .4);
          b.addConsoleDesk(interior, -2.8, y0, z0 + 1.2, M.glowGreen);
          b.addConsoleDesk(interior, 2.6, y0, z0 + 1.2, M.glowCyan);
          if (f === 1 && style === 'dispatch') {
            for (let r = 0; r < 4; r++) b.addServerRack(interior, 4.2, y0, z0 + 1.1 + r * 1.15);
          }
        }
      }

      // Roof slab, HVAC units, perimeter parapet & rotating radar mast
      const topY = floors * H;
      b.solid(shell, M.corrugated, x0 - .4, topY, z0 - .4, x1 + .4, topY + .24, z1 + .4, 'metal', true);
      b.addMesh(shell, boxGeo, M.steelLight, 2.2, 1.1, 1.6, 2.4, topY + .78, -1.2);
      const y = topY + .24;
      if (style === 'pump' || style === 'lock') {
        for (const x of [-3.2, 0, 3.2]) {
          const height = style === 'lock' ? 3.4 : 1.9;
          b.addMesh(shell,cylGeo,M.steel,.52,height,.52,x,y+height/2,1.4);
          for (const h of [.28,height-.14]) b.addMesh(shell,cylGeo,M.steelLight,.65,.13,.65,x,y+h,1.4);
          b.addMesh(shell,cylGeo,M.darkTrim,.41,.06,.41,x,y+height,1.4);
        }
        if (style === 'lock') b.addMesh(shell,boxGeo,M.hazard,8,.64,.95,0,y+3.26,1.4);
      } else if (style === 'clinic') {
        for (const x of [-3.5,-.8]) {
          b.addMesh(shell,boxGeo,M.steelLight,2.4,1.4,2.0,x,y+.7,1.2);
          for (let j=0;j<5;j++) b.addMesh(shell,boxGeo,M.darkTrim,2.06,.095,.08,x,y+.35+j*.19,2.22);
        }
        b.addMesh(shell,boxGeo,M.whiteCloth,.10,2.4,2.4,x0-.12,y-1.3,-2.8);
        b.addMesh(shell,boxGeo,M.red,.12,.46,1.7,x0-.22,y-1.3,-2.8);
        b.addMesh(shell,boxGeo,M.red,.13,1.7,.46,x0-.22,y-1.3,-2.8);
      } else {
        b.addRadarMast(shell, -2.5, y, 0);
        if (style === 'dispatch' || style === 'platform' || style === 'pilot') {
          const mastHeight = style === 'dispatch' ? 6.8 : 3.8;
          b.addMesh(shell,cylGeo,M.steelLight,.10,mastHeight,.10,2.5,y+mastHeight/2,1.7);
          for (const h of [.45,.72,.94]) b.addMesh(shell,boxGeo,M.steel,2.2*(1.3-h),.065,.065,2.5,y+mastHeight*h,1.7);
          if (style === 'pilot') {
            b.addMesh(shell,cylGeo,M.glowWarm,.42,.74,.42,2.5,y+mastHeight,1.7);
            b.addMesh(shell,cylGeo,M.darkTrim,.52,.14,.52,2.5,y+mastHeight+.42,1.7);
          }
        }
      }
    }

    function buildFuelFarm(b, shell, interior) {
      b.solid(shell, M.concreteDark, -9.5, -.12, -6.5, 9.5, .06, 6.5, 'concrete', true);
      // 3 giant horizontal cylindrical storage tanks + elevated maintenance catwalk
      for (const tx of [-5.5, 0, 5.5]) {
        const tank = b.addMesh(shell, cylGeo, M.wallPaint, 2.1, 8.2, 2.1, tx, 2.6, 0);
        tank.rotation.x = Math.PI / 2;
        b.addMesh(shell, boxGeo, M.red, 4.3, .22, .65, tx, 2.6, 3.2);
        b.addCollider(tx - 2.1, 0, -4.1, tx + 2.1, 4.7, 4.1, 'metal');
        for (const sz of [-2.8, 2.8]) {
          b.solid(shell, M.concrete, tx - 1.6, 0, sz - .4, tx + 1.6, 1.2, sz + .4, 'concrete', true);
        }
      }
      // Elevated catwalk bridge spanning across the tanks
      b.solid(shell, M.steel, -8.8, 4.7, -1.1, 8.8, 4.86, 1.1, 'metal', true);
      b.addStaircase(shell, -8.0, 0, 1.1, 4.7, 5.2, 1.4);
      b.addRailing(shell, -8.8, -1.05, 8.8, -1.05, 4.86);
      b.addRailing(shell, -7.2, 1.05, 8.8, 1.05, 4.86);
      b.addCeilingLight(interior, 0, 6.6, 0, 0xffc880);
    }

    function buildLighthouse(b, shell, interior) {
      b.solid(shell, M.concreteDark, -6, -.12, -6, 6, .08, 6, 'concrete', true);
      // Striped beacon tower
      for (let i = 0; i < 4; i++) {
        b.addMesh(shell, cylGeo, i % 2 ? M.red : M.whiteCloth, 2.4 - i * .22, 3.2, 2.4 - i * .22, 0, 1.6 + i * 3.2, 0);
      }
      b.addCollider(-2.4, 0, -2.4, 2.4, 13.5, 2.4, 'concrete');
      const lantern = new Group();
      lantern.position.set(0, 13.8, 0);
      b.addMesh(lantern, cylGeo, M.glass, 1.5, 1.8, 1.5, 0, 0, 0);
      const beam = b.addMesh(lantern, boxGeo, M.glowWarm, 18, .65, .65, 9, 0, 0);
      beam.material = new MeshBasicMaterial({ color: 0xffe7ad, transparent: true, opacity: .35 });
      const pt = new PointLight(0xffe4a8, 40, 45, 1.4);
      lantern.add(pt);
      shell.add(lantern);
      updaters.push(dt => { lantern.rotation.y += dt * .85; });
      // Welcome arch gantry
      b.solid(interior, M.steel, -5.2, 0, 4.5, -4.6, 5.8, 5.1, 'metal', true);
      b.solid(interior, M.steel, 4.6, 0, 4.5, 5.2, 5.8, 5.1, 'metal', true);
      b.solid(interior, M.hazard, -5.4, 5.4, 4.4, 5.4, 6.2, 5.2, 'metal', true);
    }

    function spawnBuilding(spec) {
      const group = new Group();
      group.name = 'arch-' + spec.id;
      group.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
      group.rotation.y = spec.yaw ?? 0;
      const shell = new Group();
      const interior = new Group();
      shell.visible = false;
      interior.visible = false;
      group.add(shell, interior);
      root.add(group);

      const sector = {
        id: spec.id,
        title: spec.title,
        origin: new Vector3(spec.pos[0], spec.pos[1], spec.pos[2]),
        secondFloor: new Vector3(spec.pos[0] - 1.5, spec.pos[1] + 3.85, spec.pos[2] + 3.2),
        group, shell, interior,
        colliderSpecs: [],
        activeColliders: [],
        shellLoaded: false,
        interiorLoaded: false,
      };
      const b = createBuilder(sector, sector.origin, spec.yaw ?? 0);

      if (spec.kind === 'ops_tower') buildTwoStoryControl(b, shell, interior, { floors: 2, style: 'ops' });
      else if (spec.kind === 'signal_tower') buildTwoStoryControl(b, shell, interior, { floors: 2, style: 'signal' });
      else if (spec.kind === 'pump_house') buildTwoStoryControl(b, shell, interior, { floors: 2, style: 'pump' });
      else if (spec.kind === 'tide_bastion') buildTwoStoryControl(b, shell, interior, { floors: 2, style: 'lock' });
      else if (spec.kind === 'offshore_deck') buildTwoStoryControl(b, shell, interior, { floors: 2, style: 'platform' });
      else if (spec.kind === 'field_clinic') buildTwoStoryControl(b, shell, interior, { floors: 2, style: 'clinic' });
      else if (spec.kind === 'dispatch_tower') buildTwoStoryControl(b, shell, interior, { floors: 3, style: 'dispatch' });
      else if (spec.kind === 'pilot_station') buildTwoStoryControl(b, shell, interior, { floors: 2, style: 'pilot' });
      else if (spec.kind === 'fuel_farm') buildFuelFarm(b, shell, interior);
      else if (spec.kind === 'lighthouse') buildLighthouse(b, shell, interior);

      // Builders rotate several pieces after creation, then freeze the finished local transforms.
      group.traverse(node => { if (!node.matrixAutoUpdate) node.updateMatrix(); });
      sectors.push(sector);
      return sector;
    }

    // Spawn all buildings for the current chapter
    const specs = CHAPTER_BUILDINGS[chapterId] ?? [];
    specs.forEach(spawnBuilding);

    function syncColliders(sector, enable) {
      if (!physics?.addBox || !physics?.removeBox) return;
      if (enable && !sector.activeColliders.length) {
        for (const c of sector.colliderSpecs) {
          sector.activeColliders.push(physics.addBox(c.min, c.max, { surface: c.surface }));
        }
      } else if (!enable && sector.activeColliders.length) {
        for (const box of sector.activeColliders.splice(0)) physics.removeBox(box);
      }
    }

    function update(dt, playerPos) {
      for (const fn of updaters) fn(dt);
      const limits = STREAM_DIST[streamingMode] ?? STREAM_DIST.standard;
      for (const sector of sectors) {
        const dist = playerPos ? playerPos.distanceTo(sector.origin) : 0;
        const wantShell = dist <= limits.shell;
        const wantInterior = dist <= limits.interior;
        if (sector.shellLoaded !== wantShell) {
          sector.shellLoaded = wantShell;
          sector.shell.visible = wantShell;
          syncColliders(sector, wantShell);
        }
        if (sector.interiorLoaded !== wantInterior) {
          sector.interiorLoaded = wantInterior;
          sector.interior.visible = wantInterior;
        }
      }
    }

    // Spawn an Expo Gallery of ALL 9 chapters' multi-story buildings on demand (from Dev Menu!)
    let expoSpawned = false;
    function spawnAllChaptersExpo(anchorPos) {
      if (expoSpawned) return sectors.length;
      expoSpawned = true;
      const base = anchorPos ? anchorPos.clone() : new Vector3(0, 0, -48);
      const allKinds = [
        { id: 'expo-ops', kind: 'ops_tower', title: ['Expo · 2F Port Ops Tower', '展台 · 双层作战控制楼'] },
        { id: 'expo-pump', kind: 'pump_house', title: ['Expo · 2F Drydock Pump House', '展台 · 双层船坞泵房'] },
        { id: 'expo-clinic', kind: 'field_clinic', title: ['Expo · 2F Field Clinic', '展台 · 双层战地分诊楼'] },
        { id: 'expo-dispatch3f', kind: 'dispatch_tower', title: ['Expo · 3F Dispatch Tower', '展台 · 三层港务调度塔'] },
        { id: 'expo-fuel', kind: 'fuel_farm', title: ['Expo · Fuel Tank Farm', '展台 · 高压燃料罐区'] },
        { id: 'expo-lighthouse', kind: 'lighthouse', title: ['Expo · Reopen Lighthouse', '展台 · 重开港区灯塔'] },
      ];
      allKinds.forEach((item, i) => {
        spawnBuilding({
          ...item,
          pos: [base.x + (i - 2.5) * 22, 0, base.z - 22],
          yaw: 0,
        });
      });
      update(0, anchorPos);
      return sectors.length;
    }

    function dispose() {
      for (const sector of sectors) syncColliders(sector, false);
      root.removeFromParent();
    }

    return {
      update, dispose, spawnAllChaptersExpo,
      setStreamingMode(mode) { if (STREAM_DIST[mode]) streamingMode = mode; },
      get streamingMode() { return streamingMode; },
      get waypoints() {
        const list = [];
        for (const s of sectors) {
          list.push({ label: s.title[0], zh: s.title[1] + ' (1F)', pos: s.origin.clone().add(new Vector3(-7.5, 0, 5.5)) });
          if (s.id !== 'reopen-lighthouse' && !s.id.includes('lighthouse')) {
            list.push({ label: s.title[0] + ' 2F', zh: s.title[1] + ' (二层平台)', pos: s.secondFloor.clone() });
          }
        }
        return list;
      },
      getStats() {
        const loaded = sectors.filter(s => s.shellLoaded).length;
        const detailed = sectors.filter(s => s.interiorLoaded).length;
        return { total: sectors.length, loaded, detailed, mode: streamingMode };
      },
    };
  };
})();
