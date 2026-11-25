/* Saltline Realistic Coastal City Open World & 8-Act 《失联名单》 Campaign.
 * Strict Coastal Geography (ZERO buildings in the East Sea x > +26!):
 *   - Real Coastline: x = +26 running North–South. East of x = +26 is 100% PURE OPEN EAST SEA.
 *   - All 7 Districts sit on ONE contiguous inland landmass (x: -225..+26, z: -225..+148):
 *       01 Berth 4 Core Harbor         (x: -107..+26,  z:  -30..+28)  [Original weathered PBR core]
 *       02 Coastal City & Promenade    (x: -107..+24,  z: -145..-30)  [Urban blocks + x=+24 seafront]
 *       03 Mountain Comms (+14m)       (x: -220..-110, z: -120..-35)  [Inland west ridge overlooking sea!]
 *       04 Coastal Emergency Airfield  (x: -220..-110, z: -225..-120) [NW plateau, runway, hangar, ATC]
 *       05 West Rail Freight Yard      (x: -220..-107, z:  -35..+35)  [Seamless west extension of Berth 4]
 *       06 South Drydock & Lighthouse  (x: -107..+24,  z:  +28..+145) [Peninsula drydock + 22m headland lighthouse]
 *       07 SW Cold-Storage & Clinic    (x: -220..-107, z:  +35..+145) [Industrial cryo depot + 2F triage clinic]
 *   - Road Grid (Two Vertical + Three Horizontal, ZERO floating sea roads):
 *       V1: Coastal Blvd (x = -26)  |  V2: West Inland Ave (x = -112)
 *       H1: North Blvd (z = -125)   |  H2: West Gate Freight Rd (z = +5)  |  H3: South Harbor Rd (z = +42)
 *   - Realistic Weathered PBR Aesthetic (matches Berth 4, no cartoony blocks) + Interactive [E] Doors,
 *     Medical Triage, Ammo Lockers, Stealth Indicator, 8-Act 《失联名单》 Campaign & Free-Roam Sightseeing. */
(() => {
  function injectStyles() {
    if (document.getElementById('saltline-world-perf-style')) return;
    const style = document.createElement('style');
    style.id = 'saltline-world-perf-style';
    style.textContent = `
      .sl-menu-hidden{display:none!important}
      .sl-world-hud{position:fixed;right:18px;top:16px;z-index:18;background:rgba(10,15,19,.86);border:1px solid rgba(130,205,222,.38);border-radius:6px;padding:8px 13px;color:#dfe9ec;font:600 11.5px/1.45 ui-monospace,SFMono-Regular,monospace;backdrop-filter:blur(6px);pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.42);max-width:405px;transition:opacity .25s}
      .sl-world-hud.photo-hidden{opacity:0}
      .sl-world-zone{color:#66d9f0;font-size:12.5px;margin-bottom:2px}
      .sl-world-op{color:#f0c46c;font:700 12px/1.38 system-ui,-apple-system,sans-serif;margin-top:4px;border-top:1px solid rgba(255,255,255,.12);padding-top:4px}
      .sl-world-hint{color:#9ab8c2;font-size:11px;margin-top:3px;opacity:.92}
      .sl-stealth-pill{display:inline-block;margin-top:4px;padding:2px 8px;border-radius:4px;font:700 10.5px/1.3 ui-monospace,monospace;background:rgba(46,204,113,.16);color:#75e8a6;border:1px solid rgba(117,232,166,.35)}
      .sl-stealth-pill.alert{background:rgba(235,88,68,.2);color:#ff9486;border-color:rgba(255,148,134,.45)}
      .sl-interact-prompt{position:fixed;left:50%;bottom:136px;transform:translateX(-50%);z-index:24;background:rgba(10,16,21,.92);border:1px solid rgba(240,196,108,.65);border-left:4px solid #f0c46c;border-radius:6px;padding:8px 16px;color:#f5f8fa;font:700 13px/1.3 system-ui,-apple-system,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.5);pointer-events:none;display:none}
      .sl-interact-prompt.on{display:block}
      .sl-act-card{position:fixed;left:50%;top:19%;transform:translate(-50%,-10px);z-index:32;pointer-events:none;text-align:center;opacity:0;transition:opacity .45s ease,transform .45s ease;background:linear-gradient(90deg,rgba(8,14,19,0),rgba(8,14,19,.88) 18%,rgba(8,14,19,.88) 82%,rgba(8,14,19,0));padding:14px 48px;border-top:1px solid rgba(240,185,78,.58);border-bottom:1px solid rgba(240,185,78,.58)}
      .sl-act-card.show{opacity:1;transform:translate(-50%,0)}
      .sl-act-kicker{font:700 11px/1 ui-monospace,monospace;letter-spacing:.32em;color:#f0b94e;text-transform:uppercase;margin-bottom:6px}
      .sl-act-title{font:800 26px/1.15 system-ui,-apple-system,sans-serif;color:#f4fafc;letter-spacing:.08em;text-shadow:0 2px 14px rgba(0,0,0,.75)}
      .sl-act-sub{font:500 13px/1.35 system-ui,-apple-system,sans-serif;color:#a8dce8;margin-top:5px}
      .sl-photo-pill{position:fixed;right:18px;bottom:16px;z-index:25;background:rgba(8,14,19,.72);border:1px solid rgba(255,255,255,.22);border-radius:99px;padding:5px 12px;color:#d6eef2;font:600 11px/1 system-ui,sans-serif;pointer-events:none;display:none}
      .sl-photo-pill.on{display:block}
      .sl-minimap{position:fixed;left:18px;bottom:92px;z-index:18;width:194px;background:rgba(8,14,20,.86);border:1.5px solid rgba(102,217,240,.42);border-radius:9px;padding:6px;box-shadow:0 8px 24px rgba(0,0,0,.5);backdrop-filter:blur(6px);transition:opacity .25s;pointer-events:auto;cursor:pointer}
      .sl-minimap.photo-hidden{opacity:0;pointer-events:none}
      .sl-minimap-head{display:flex;justify-content:space-between;align-items:center;font:700 10px/1 ui-monospace,monospace;color:#78e2f5;margin-bottom:4px;letter-spacing:.04em}
      .sl-minimap svg{width:100%;height:176px;display:block;border-radius:5px;background:#091924}
      .sl-pin-layer{position:fixed;inset:0;z-index:17;pointer-events:none;overflow:hidden;transition:opacity .25s}
      .sl-pin-layer.photo-hidden{opacity:0}
      .sl-pin{position:absolute;transform:translate(-50%,-100%);background:rgba(8,15,22,.76);border:1px solid rgba(102,217,240,.42);border-radius:99px;padding:3px 9px;color:#e8f6fa;font:600 11px/1.2 system-ui,-apple-system,sans-serif;white-space:nowrap;box-shadow:0 3px 12px rgba(0,0,0,.42);backdrop-filter:blur(4px);display:none}
      .sl-pin b{color:#66d9f0;margin-left:4px;font:600 10.5px/1 ui-monospace,monospace}
      .sl-obj-pin{position:fixed;z-index:22;transform:translate(-50%,-50%);color:rgba(255,232,168,.95);font:700 11px/1 ui-monospace,monospace;text-shadow:0 1px 6px rgba(0,0,0,.92);letter-spacing:.06em;white-space:nowrap;pointer-events:none;display:none}
      .sl-obj-pin b{color:#ffffff;margin-left:3px;font-weight:700}
      .sl-guide-strip{display:none!important}
      .sl-world-hud,.sl-minimap,.sl-pin-layer{display:none!important}
      .sl-interact-prompt{background:rgba(8,12,16,.72)!important;border:none!important;border-left:2px solid rgba(255,255,255,.8)!important;border-radius:2px!important;padding:5px 12px!important;font:600 12.5px/1.3 system-ui,sans-serif!important;box-shadow:none!important}
      .sl-map-overlay{position:fixed;inset:0;z-index:60;background:rgba(6,11,16,.84);backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;color:#e6f4f7}
      .sl-map-overlay.open{display:flex}
      .sl-map-card{width:min(940px,94vw);background:rgba(12,19,25,.96);border:1px solid rgba(102,217,240,.42);border-radius:10px;padding:16px 18px;box-shadow:0 18px 48px rgba(0,0,0,.65);display:grid;grid-template-columns:1fr 290px;gap:16px}
      .sl-map-header{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px solid rgba(255,255,255,.12);padding-bottom:10px;flex-wrap:wrap}
      .sl-map-title{font-size:16px;font-weight:700;color:#66d9f0;letter-spacing:.3px}
      .sl-map-sub{font-size:12px;color:#9eb9c2;margin-top:2px}
      .sl-map-top-btns{display:flex;gap:8px;align-items:center}
      .sl-map-close{background:rgba(255,255,255,.08);color:#e6f4f7;border:1px solid rgba(255,255,255,.22);border-radius:6px;padding:5px 12px;cursor:pointer;font-weight:600;font-size:12px}
      .sl-map-close:hover{background:rgba(102,217,240,.2)}
      .sl-map-mode-btn{background:rgba(102,217,240,.18);color:#d7f9ff;border:1px solid rgba(102,217,240,.48);border-radius:6px;padding:5px 12px;cursor:pointer;font-weight:700;font-size:12px}
      .sl-map-mode-btn:hover{background:rgba(102,217,240,.32)}
      .sl-map-canvas{position:relative;aspect-ratio:310/400;max-height:530px;margin:0 auto;width:100%;background:#091924;border:1px solid rgba(102,217,240,.24);border-radius:8px;overflow:hidden}
      .sl-map-canvas svg{width:100%;height:100%;display:block}
      .sl-map-zone-btn{cursor:pointer;transition:opacity .15s,filter .15s}
      .sl-map-zone-btn:hover{filter:brightness(1.22)}
      .sl-map-side{display:flex;flex-direction:column;gap:8px;max-height:530px;overflow:auto}
      .sl-map-item{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.11);border-radius:7px;padding:8px 10px;display:flex;flex-direction:column;gap:5px}
      .sl-map-item.active{border-color:rgba(102,217,240,.65);background:rgba(102,217,240,.09)}
      .sl-map-item-top{display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:12.5px;font-weight:700}
      .sl-map-badge{font:600 10px/1 ui-monospace,monospace;padding:3px 6px;border-radius:99px;background:rgba(255,255,255,.09);color:#9ab2ba}
      .sl-map-badge.loaded{background:rgba(46,204,113,.22);color:#6df5a6;border:1px solid rgba(109,245,166,.4)}
      .sl-map-actions{display:flex;gap:6px}
      .sl-map-btn{flex:1;background:rgba(102,217,240,.14);color:#c9f6ff;border:1px solid rgba(102,217,240,.35);border-radius:5px;padding:4px 6px;font-size:11px;font-weight:600;cursor:pointer}
      .sl-map-btn:hover{background:rgba(102,217,240,.28)}
      .sl-map-btn.tp{background:rgba(255,196,76,.16);color:#ffe4a8;border-color:rgba(255,196,76,.4)}
      .sl-map-btn.tp:hover{background:rgba(255,196,76,.3)}
    `;
    document.head.appendChild(style);
  }

  window.createPortOpenWorld = (world, { chapterId = 'berth' } = {}) => {
    if (chapterId !== 'berth') return null;
    const { THREE, scene, physics, fx, audio } = world;
    const { Group, Mesh, BoxGeometry, CylinderGeometry, ConeGeometry, SphereGeometry,
      MeshStandardMaterial, MeshBasicMaterial, Color, Vector3 } = THREE;

    injectStyles();

    // Expand walking/driving bounds strictly over the real inland coastal city (x: -240..+32, z: -240..+165)
    if (physics?.bounds?.min && physics?.bounds?.max) {
      physics.bounds.min.set(-240, -12, -240);
      physics.bounds.max.set(32, 85, 165);
    }

    const legacySkyline = world.backdrop?.skyline ?? null;
    const legacyLamps = world.backdrop?.lamps ?? null;
    if (legacySkyline) legacySkyline.visible = false;
    if (legacyLamps) legacyLamps.visible = false;

    const root = new Group();
    root.name = 'saltline-open-world-root';
    scene.add(root);

    const horizonRoot = new Group();
    horizonRoot.name = 'saltline-horizon-city-grid';
    root.add(horizonRoot);
    const permanentColliders = [];

    // Claude's native Berth 4 PBR materials (NO object-space triplanar stretching; paired with world-meter UV geometry!)
    const pbr = (name, fallbackHex, roughness = .86, metalness = .08) => {
      try {
        const m = world.mats?.get?.(name);
        if (m) return m;
      } catch {}
      return new MeshStandardMaterial({ color: fallbackHex, roughness, metalness });
    };

    const M = {
      asphalt: pbr('asphalt', 0x262b2e, .94, .03),
      concrete: pbr('concrete', 0x6c706d, .90, .04),
      concreteDirty: pbr('concrete_dirty', 0x525654, .92, .05),
      corrugated: pbr('corrugated_roof', 0x3b4448, .66, .46), // Native Area-1 weathered corrugated steel
      steelClad: pbr('steel_worn', 0x384349, .68, .44),
      steelWorn: pbr('steel_worn', 0x3e464a, .58, .60),
      steelDark: pbr('steel_dark', 0x20262a, .52, .68),
      steelGalv: pbr('steel_galv', 0x6d777c, .44, .70),
      hazard: pbr('hazard_stripes', 0xb88424, .54, .20),
      glass: pbr('glass_dirty', 0x324957, .14, .58),
      wood: pbr('wood_dark', 0x4d3929, .86, .04),
      brickWeathered: pbr('brick', 0x63443a, .88, .05),
      plasterGrey: pbr('concrete', 0x76746b, .86, .05),
      slateSteel: pbr('steel_worn', 0x2e3940, .62, .42),
      cryoPanel: pbr('concrete', 0x8698a0, .60, .24),
      clinicPlaster: pbr('concrete', 0x9aa3a4, .78, .06),
      cargoRust: pbr('paint_red', 0x5c3325, .78, .30),
      cargoTeal: pbr('paint_teal', 0x234a50, .74, .26),
      cargoNavy: pbr('paint_blue', 0x223b54, .74, .26),
      rock: pbr('concrete_dirty', 0x444844, .94, .04),
      coastalGrass: new MeshStandardMaterial({ color: 0x2c3b2d, roughness: .94, metalness: .02 }),
      pineDark: new MeshStandardMaterial({ color: 0x1c3121, roughness: .90, metalness: .02 }),
      whitePaint: new MeshStandardMaterial({ color: 0xc8ccc8, roughness: .85, metalness: .02 }),
      yellowPaint: new MeshStandardMaterial({ color: 0xc29832, roughness: .82, metalness: .04 }),
      glassWarm: new MeshBasicMaterial({ color: 0xe6be7e }),
      glassCyan: new MeshBasicMaterial({ color: 0x56cfe6 }),
      greenSignal: new MeshBasicMaterial({ color: 0x42d982 }),
      redCore: new MeshBasicMaterial({ color: 0xd93824 }),
      blueTaxi: new MeshBasicMaterial({ color: 0x3b8fd9 }),
      beamGold: new MeshBasicMaterial({ color: 0xf5d993, transparent: true, opacity: .22, depthWrite: false }),
      sedanDark: new MeshStandardMaterial({ color: 0x243647, roughness: .38, metalness: .56 }),
      sedanGrey: new MeshStandardMaterial({ color: 0x7e858a, roughness: .42, metalness: .44 }),
      sedanBurgundy: new MeshStandardMaterial({ color: 0x592422, roughness: .42, metalness: .48 }),
      craneRed: new MeshStandardMaterial({ color: 0xb52922, roughness: .54, metalness: .34 }),
      craneWhite: new MeshStandardMaterial({ color: 0xd6dad6, roughness: .62, metalness: .16 }),
      safetyOrange: new MeshStandardMaterial({ color: 0xd66d18, roughness: .52, metalness: .24 }),
      coolingConcrete: new MeshStandardMaterial({ color: 0x787b75, roughness: .90, metalness: .04, side: THREE.DoubleSide }),
    };
    const customGeos = [];

    // High-res procedural weathered coastal building facade (crisp recessed windows, mullions, sills & rain streaks — slashes DC!)
    const smokedPane = new MeshStandardMaterial({ color: 0x38494d, metalness: .4, roughness: .24 });
    const blindPane = new MeshStandardMaterial({ color: 0x686356, metalness: .17, roughness: .52 });
    // Group identical components per building so rows of window reveals cost one draw per finish.
    function buildStreetBlock(blk, cx, cz, width, depth) {
      const batches = new Map();
      const transform = new THREE.Object3D();
      const floorCount = Math.max(2, Math.round((blk.h - 3.1) / 3.15));
      const storey = (blk.h - 3.1) / floorCount;
      for (let face = 0; face < 4; face++) {
        const theta = face * Math.PI / 2;
        const sin = Math.sin(theta), cos = Math.cos(theta);
        const span = face % 2 ? depth : width;
        const offset = (face % 2 ? width : depth) / 2;
        const bays = Math.max(2, Math.round(span / (blk.h > 13 ? 4.0 : 5.0)));
        const pitch = span / bays;
        function panel(material, w, h, d, u, y, inset) {
          transform.position.set(cx + cos*u + sin*(offset-inset), y, cz - sin*u + cos*(offset-inset));
          transform.rotation.y = theta;
          transform.scale.set(w,h,d);
          transform.updateMatrix();
          if (!batches.has(material)) batches.set(material, []);
          batches.get(material).push(transform.matrix.clone());
        }
        for (let row = 0; row < floorCount; row++) {
          const base = 3.1 + row * storey;
          const sill = blk.h > 13 ? 1.12 : .93;
          const glassHeight = storey - sill - .32;
          panel(blk.mat, span, sill, .36, 0, base + sill/2, .18);
          panel(blk.mat, span, .32, .36, 0, base + storey - .16, .18);
          for (let bay = 0; bay < bays; bay++) {
            const u = (bay + .5) * pitch - span/2;
            const opening = pitch * (blk.h > 13 ? .75 : .54);
            const jamb = (pitch-opening)/2;
            const y = base + sill + glassHeight/2;
            for (const sign of [-1,1]) panel(blk.mat, jamb, glassHeight, .36, u + sign*(pitch-jamb)/2, y, .18);
            panel((row*7+bay*3+face)%9 === 1 ? blindPane : smokedPane, opening, glassHeight, .045, u, y, .29);
            panel(M.steelDark, .055, glassHeight, .08, u + opening*.12, y, .24);
            panel(M.concreteDirty, opening+.15, .09, .47, u, base+sill, .15);
          }
        }
        panel(M.concreteDirty, span, .54, .42, 0, .43, .21);
        panel(blk.mat, span, .5, .38, 0, 2.85, .19);
        for (let bay=0; bay<bays; bay++) {
          const u=(bay+.5)*pitch-span/2;
          panel(M.steelDark, pitch, 1.9, .12, u, 1.65, .33);
          panel(smokedPane, pitch-.45, 1.72, .06, u, 1.66, .24);
          panel(blk.mat, .33, 2.0, .42, u-pitch/2+.165, 1.67, .21);
        }
      }
      for (const [material, matrices] of batches) {
        const batch = new THREE.InstancedMesh(boxGeo, material, matrices.length);
        matrices.forEach((matrix,index) => batch.setMatrixAt(index,matrix));
        batch.receiveShadow = true;
        horizonRoot.add(batch);
      }
    }

    const hangarArchMat = M.corrugated.clone ? M.corrugated.clone() : new MeshStandardMaterial({ color: 0x3b464c, roughness: .68, metalness: .45 });
    hangarArchMat.side = THREE.DoubleSide;

    const boxGeo = new BoxGeometry(1, 1, 1);
    const cylGeo = new CylinderGeometry(1, 1, 1, 14);
    const coneGeo = new ConeGeometry(1, 1, 9);
    const sphGeo = new SphereGeometry(1, 14, 10);

    const sectors = [];
    const updaters = [];
    const shootTargets = [];
    const roadblockProps = [];
    const interactables = []; // [E] Interactive Doors, Gates, Medical Triage, Resupply, Evidence Terminals!

    const externalAssets = typeof window.createSaltlineExternalAssets === 'function'
      ? window.createSaltlineExternalAssets(THREE) : null;
    const WE = window.WorldEngine || null;
    const matLib = WE?.createMaterialLibrary ? WE.createMaterialLibrary(THREE, world.mats) : null;
    const buildingGen = WE?.createBuildingGenerator && matLib ? WE.createBuildingGenerator(THREE, matLib, { ...M, smokedPane, blindPane }) : null;
    const terrainGen = WE?.createTerrainGenerator && matLib ? WE.createTerrainGenerator(THREE, matLib) : null;
    const lightingSys = WE?.createLightingSystem ? WE.createLightingSystem(THREE, world) : null;
    const industrialGen = WE?.createIndustrialGenerator && matLib ? WE.createIndustrialGenerator(THREE, matLib, M) : null;
    const atmosphereSys = WE?.createAtmosphereSystem ? WE.createAtmosphereSystem(THREE, root, updaters) : null;
    function placeExternal(parent, assetId, x, y, z, yaw = 0, scale = 1.0) {
      return externalAssets ? externalAssets.place(parent, assetId, x, y, z, yaw, scale) : null;
    }

    function makeSector(id, nameZh, nameEn, center, streamRadius = 275) {
      const group = new Group();
      group.name = 'world-sector-' + id;
      const shell = new Group();
      const detail = new Group();
      shell.visible = false;
      detail.visible = false;
      group.add(shell, detail);
      root.add(group);
      const sec = {
        id, nameZh, nameEn,
        center: new Vector3(...center),
        streamRadius: Math.max(streamRadius, 275),
        detailRadius: 195,
        group, shell, detail,
        colliderSpecs: [],
        activeColliders: [],
        loaded: false,
        detailed: false,
      };
      sectors.push(sec);
      return sec;
    }

    // World-meter UV BoxGeometry cache so large roads/walls NEVER stretch textures (matches Claude's Berth 4 density!)
    const worldBoxCache = new Map();
    function getWorldBoxGeo(w, h, d, tile = 3.0) {
      const [rw, rh, rd] = [w, h, d];
      const key = `${w}_${h}_${d}_${tile}`;
      let g = worldBoxCache.get(key);
      if (g) return g;
      g = new BoxGeometry(rw, rh, rd);
      const uv = g.attributes.uv;
      if (uv && uv.count === 24) {
        const faceDims = [[rd, rh], [rd, rh], [rw, rd], [rw, rd], [rw, rh], [rw, rh]];
        for (let f = 0; f < 6; f++) {
          const [fu, fv] = faceDims[f];
          for (let v = 0; v < 4; v++) {
            const idx = f * 4 + v;
            uv.setXY(idx, uv.getX(idx) * (fu / tile), uv.getY(idx) * (fv / tile));
          }
        }
        uv.needsUpdate = true;
      }
      worldBoxCache.set(key, g);
      return g;
    }

    function addBox(parent, mat, w, h, d, x, y, z, shadow = false) {
      const useWorldUv = Math.max(w, h, d) > 2.2;
      const m = new Mesh(useWorldUv ? getWorldBoxGeo(w, h, d) : boxGeo, mat);
      m.position.set(x, y, z);
      if (!useWorldUv) m.scale.set(w, h, d);
      m.castShadow = shadow && mat !== M.glass;
      m.receiveShadow = true;
      m.matrixAutoUpdate = false;
      m.updateMatrix();
      parent.add(m);
      return m;
    }

    function addCyl(parent, mat, r, h, x, y, z, rx = 0, rz = 0) {
      const m = new Mesh(cylGeo, mat);
      m.position.set(x, y, z);
      m.scale.set(r, h, r);
      m.rotation.set(rx, 0, rz);
      m.receiveShadow = true;
      m.matrixAutoUpdate = false;
      m.updateMatrix();
      parent.add(m);
      return m;
    }

    function solidHorizon(mat, x0, y0, z0, x1, y1, z1, surface = 'concrete', collide = true) {
      const w = Math.abs(x1 - x0), h = Math.abs(y1 - y0), d = Math.abs(z1 - z0);
      addBox(horizonRoot, mat, w, h, d, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, false);
      if (collide && physics?.addBox) {
        permanentColliders.push(physics.addBox(
          new Vector3(Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1)),
          new Vector3(Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)),
          { surface },
        ));
      }
    }

    // Reuse Area 1 (Berth 4) native high-precision procedural asset library (world.props.build) with rotated AABB colliders!
    let propSeed = 4200;
    function placePortProp(sec, parent, name, x, y, z, yaw = 0, opts = {}, collide = true) {
      if (!world.props?.build) return null;
      let obj = null;
      try { obj = world.props.build(name, { seed: propSeed++, ...opts }); } catch { return null; }
      if (!obj) return null;
      obj.position.set(x, y, z);
      obj.rotation.y = yaw;
      obj.updateMatrixWorld?.(true);
      parent.add(obj);
      if (collide && sec && Array.isArray(obj.userData?.colliders)) {
        const c = Math.cos(yaw), s = Math.sin(yaw);
        for (const col of obj.userData.colliders) {
          if (!col?.min || !col?.max || col.bulletOnly) continue;
          const xs = [col.min[0], col.max[0]], zs = [col.min[2], col.max[2]];
          let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
          for (const lx of xs) for (const lz of zs) {
            const wx = x + lx * c + lz * s, wz = z - lx * s + lz * c;
            if (wx < minX) minX = wx; if (wx > maxX) maxX = wx;
            if (wz < minZ) minZ = wz; if (wz > maxZ) maxZ = wz;
          }
          sec.colliderSpecs.push({
            min: new Vector3(minX, y + col.min[1], minZ),
            max: new Vector3(maxX, y + col.max[1], maxZ),
            surface: col.surface || 'metal',
          });
        }
      }
      return obj;
    }

    function solid(sec, parent, mat, x0, y0, z0, x1, y1, z1, surface = 'concrete', collide = true) {
      const w = Math.abs(x1 - x0), h = Math.abs(y1 - y0), d = Math.abs(z1 - z0);
      addBox(parent, mat, w, h, d, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, false);
      if (collide) {
        sec.colliderSpecs.push({
          min: new Vector3(Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1)),
          max: new Vector3(Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)),
          surface,
        });
      }
    }

    // Interactive Animated Sliding Steel Blast Door (removes/restores collider cleanly — zero clipping!)
    function addInteractiveDoor(parent, { id, labelZh, x, y, z, width = 3.8, height = 3.4, axis = 'z', initiallyOpen = false }) {
      const frame = new Group();
      frame.position.set(x, y, z);
      const leaf = new Mesh(boxGeo, M.steelWorn);
      const isX = axis === 'x';
      leaf.scale.set(isX ? width : .28, height, isX ? .28 : width);
      leaf.position.set(0, height / 2, 0);
      const stripe = new Mesh(boxGeo, M.hazard);
      stripe.scale.set(isX ? width * .92 : .32, .26, isX ? .32 : width * .92);
      stripe.position.set(0, 1.1, 0);
      const lamp = new Mesh(boxGeo, initiallyOpen ? M.greenSignal : M.redCore);
      lamp.scale.set(.26, .26, .26);
      lamp.position.set(isX ? width / 2 + .3 : .35, 1.7, isX ? .35 : width / 2 + .3);
      const doorLeafGroup = new Group();
      doorLeafGroup.add(leaf, stripe);
      frame.add(doorLeafGroup, lamp);
      parent.add(frame);

      let open = initiallyOpen;
      let slideT = open ? 1 : 0;
      doorLeafGroup.position[isX ? 'x' : 'z'] = slideT * (width - .25);
      let colBox = null;

      function syncDoorCollider() {
        if (!physics?.addBox || !physics?.removeBox) return;
        if (!open && !colBox) {
          const hw = (isX ? width : .35) / 2;
          const hd = (isX ? .35 : width) / 2;
          colBox = physics.addBox(new Vector3(x - hw, y, z - hd), new Vector3(x + hw, y + height, z + hd), { surface: 'metal' });
        } else if (open && colBox) {
          physics.removeBox(colBox);
          colBox = null;
        }
      }
      syncDoorCollider();

      updaters.push(dt => {
        const target = open ? 1 : 0;
        if (Math.abs(slideT - target) > .005) {
          slideT += (target - slideT) * Math.min(1, dt * 6.5);
          if (isX) doorLeafGroup.position.x = slideT * (width - .25);
          else doorLeafGroup.position.z = slideT * (width - .25);
        }
      });

      const entry = {
        id, pos: new Vector3(x, y + 1.2, z), radius: 3.6,
        getPrompt: () => open ? `按 [E] 关闭「${labelZh}」` : `按 [E] 打开「${labelZh}」`,
        use() {
          open = !open;
          lamp.material = open ? M.greenSignal : M.redCore;
          syncDoorCollider();
          audio?.play?.('rail_touchdown', { pos: entry.pos, ref: 14, gain: .48, jitter: .06 });
          world.tactical?.notify?.(open ? `🚪 已开启：${labelZh}` : `🔒 已关闭：${labelZh}`, open ? `Opened ${id}` : `Closed ${id}`, false, 2.2);
        },
        cleanup() { if (colBox) { physics?.removeBox?.(colBox); colBox = null; } },
      };
      interactables.push(entry);
      return entry;
    }

    // Interactive Facility Terminal (Medical Triage / Armory Locker / 《失联名单》 Evidence Console)
    function addInteractiveTerminal(parent, { id, promptZh, x, y, z, colorMat = M.glassCyan, onUse }) {
      const g = new Group();
      g.position.set(x, y, z);
      addBox(g, M.steelDark, 1.1, 1.35, .65, 0, .675, 0);
      addBox(g, colorMat, .82, .46, .08, 0, 1.05, .34);
      addBox(g, M.hazard, 1.14, .16, .68, 0, .25, 0);
      g.matrixAutoUpdate = false; g.updateMatrix();
      parent.add(g);
      const entry = {
        id, pos: new Vector3(x, y + 1.0, z), radius: 3.0,
        getPrompt: () => promptZh,
        use: onUse,
        cleanup() {},
      };
      interactables.push(entry);
      return entry;
    }

    // Each bough has a raised spine, drooping outer needles and a ragged tip.
    // Share the entire crown between trees to keep it to one draw per canopy.
    const needles = [];
    for (let tier = 0; tier < 8; tier++) {
      for (let branch = 0; branch < 9; branch++) {
        const angle = branch * 2.39996 + tier * .83;
        const reach = (1.84 - tier * .18) * (.87 + .13 * Math.sin(branch * 17 + tier));
        const base = 2.15 + tier * .45;
        const point = (r, side, dy) => [
          tier * .045 + r * Math.cos(angle) - side * Math.sin(angle),
          base + dy, r * Math.sin(angle) + side * Math.cos(angle),
        ];
        const spine = point(reach * .62, 0, .20);
        const stem = point(0, 0, .42);
        for (const side of [-1, 1]) {
          const edge = point(reach * .68, side * reach * .39, -.16);
          const tip = point(reach, side * reach * .12, -.20);
          const faces = [stem, spine, edge, spine, tip, edge];
          if (side < 0) faces.reverse();
          needles.push(...faces.flat());
        }
      }
    }
    const crown = new THREE.BufferGeometry();
    crown.setAttribute('position', new THREE.Float32BufferAttribute(needles, 3));
    crown.computeVertexNormals();
    M.pineDark.side = THREE.DoubleSide;
    function addPineTree(parent, x, y, z, scale = 1) {
      const g = new Group();
      g.position.set(x, y, z);
      g.scale.setScalar(scale);
      g.rotation.y = (Math.abs(x * 13 + z * 7) % 628) / 100;
      addCyl(g, M.wood, .14, 4.85, .08, 2.42, 0, 0, -.035);
      g.add(new Mesh(crown, M.pineDark));
      parent.add(g);
    }

    function addStreetLamp(parent, x, y, z, armDir = 1) {
      const pole = new Mesh(cylGeo, M.steelDark);
      pole.scale.set(.09, 6.2, .09);
      pole.position.set(x, y + 3.1, z);
      pole.matrixAutoUpdate = false; pole.updateMatrix();
      parent.add(pole);
      addBox(parent, M.steelDark, 1.7, .09, .11, x + armDir * .85, y + 6.1, z, false);
      addBox(parent, M.glassWarm, .52, .07, .20, x + armDir * 1.55, y + 6.02, z, false);
    }

    function addParkedSedan(parent, x, y, z, yaw, mat) {
      const g = new Group();
      g.position.set(x, y, z);
      g.rotation.y = yaw;
      // Shape side profiles in the longitudinal plane; bevel the sill and roof shoulders.
      function bodyPanel(outline, width, material, bevel) {
        const shape = new THREE.Shape(outline.map(([z,y]) => new THREE.Vector2(-z,y)));
        const shell = new THREE.ExtrudeGeometry(shape, {
          depth: width, bevelEnabled:true, bevelThickness:bevel, bevelSize:bevel,
          bevelSegments:3, steps:1, curveSegments:12,
        });
        shell.translate(0,0,-width/2);
        shell.rotateY(Math.PI/2);
        g.add(new Mesh(shell,material));
      }
      bodyPanel([[-2.05,.36],[-2.08,.66],[-1.75,.76],[-1.22,.79],[-.78,.83],
        [.85,.82],[1.65,.73],[2.08,.60],[2.09,.39],[1.73,.34],[1.67,.55],
        [1.51,.70],[1.26,.73],[1.03,.64],[.88,.42],[.84,.31],[-.85,.31],
        [-.94,.56],[-1.12,.70],[-1.37,.72],[-1.6,.62],[-1.73,.35]],1.69,mat,.036);
      bodyPanel([[-1.32,.80],[-.73,1.24],[-.45,1.32],[.46,1.31],[.72,1.22],[1.22,.81]],1.46,smokedPane,.055);
      addBox(g,mat,1.49,.075,1.07,0,1.355,-.04);
      for (const side of [-1,1]) {
        addBox(g,mat,.04,.49,.09,side*.79,1.07,-.04);
        addBox(g,M.steelGalv,.045,.035,2.45,side*.845,.82,-.04);
        for (const z of [-.78,.28]) addBox(g,M.steelDark,.04,.034,.18,side*.884,.74,z);
      }
      addBox(g, M.steelDark, 1.15, .14, .06, 0, .52, 2.115);
      for (const sx of [-.66, .66]) {
        addBox(g, M.glassWarm, .30, .14, .06, sx, .60, 2.15);
        addBox(g, M.redCore, .30, .14, .06, sx, .60, -2.15);
        addBox(g, M.steelDark, .14, .10, .08, sx * 1.38, .92, .62);
        for (const wz of [-1.28, 1.28]) {
          addCyl(g, M.steelDark, .34, .24, sx * 1.22, .34, wz, 0, Math.PI / 2);
          addCyl(g, M.steelGalv, .18, .26, sx * 1.22, .34, wz, 0, Math.PI / 2);
        }
      }
      g.matrixAutoUpdate = false; g.updateMatrix();
      parent.add(g);
    }

    function makeSignMat(topText, subText, bg = '#153b2f') {
      try {
        const c = document.createElement('canvas');
        c.width = 512; c.height = 144;
        const ctx = c.getContext?.('2d');
        if (ctx && THREE.CanvasTexture) {
          ctx.fillStyle = bg; ctx.fillRect(0, 0, 512, 144);
          ctx.strokeStyle = '#d4e2de'; ctx.lineWidth = 5; ctx.strokeRect(8, 8, 496, 128);
          ctx.fillStyle = '#f2f5f4'; ctx.font = 'bold 32px system-ui,sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(topText, 256, 66);
          ctx.fillStyle = '#e8c46b'; ctx.font = '600 21px ui-monospace,sans-serif';
          ctx.fillText(subText, 256, 110);
          const tex = new THREE.CanvasTexture(c);
          return new MeshBasicMaterial({ map: tex });
        }
      } catch {}
      return M.steelGalv;
    }

    function addHighwayGantry(x, z, yaw, topText, subText, span = 16, bg = '#153b2f') {
      const g = new Group();
      g.position.set(x, .16, z);
      g.rotation.y = yaw;
      const half = span / 2;
      addBox(g, M.concrete, 1.1, .75, 1.1, -half, .375, 0);
      addBox(g, M.concrete, 1.1, .75, 1.1, half, .375, 0);
      addBox(g, M.steelGalv, .42, 7.8, .42, -half, 4.0, 0);
      addBox(g, M.steelGalv, .42, 7.8, .42, half, 4.0, 0);
      addBox(g, M.steelDark, span + .5, .28, .32, 0, 7.85, 0);
      addBox(g, M.steelDark, span + .5, .28, .32, 0, 6.45, 0);
      const signW = Math.min(span - 3.2, 9.6);
      const signMat = makeSignMat(topText, subText, bg);
      const signBack = new Mesh(boxGeo, M.steelDark);
      signBack.scale.set(signW + .24, 2.15, .14); signBack.position.set(0, 7.15, .24);
      const signFace = new Mesh(boxGeo, signMat);
      signFace.scale.set(signW, 1.95, .06); signFace.position.set(0, 7.15, .32);
      const signFaceRear = new Mesh(boxGeo, signMat);
      signFaceRear.scale.set(signW, 1.95, .06); signFaceRear.position.set(0, 7.15, -.24);
      signFaceRear.rotation.y = Math.PI;
      g.add(signBack, signFace, signFaceRear);
      g.matrixAutoUpdate = false; g.updateMatrix();
      horizonRoot.add(g);
    }

    // Area-1-Grade Walkable & Furnished Industrial Building Builder (NOT an empty shell!)
    // Real 4-wall structure with 5.4m x 4.2m open drive/walk-in bay, interior concrete floor,
    // visible overhead steel roof trusses, glowing high-bay LED fixtures, pitched corrugated roof,
    // steel H-columns, recessed clerestory windows, and Area-1 world.props.build() interior & exterior furnishings!
    function addIndustrialFacility(sec, parent, {
      x0, z0, x1, z1, h = 7.6, wallMat = M.steelClad, roofMat = M.corrugated,
      title = 'SALTLINE FACILITY', doorSide = 'east', signBg = '#1a2b34', interiorKind = 'warehouse', flatRoof = false,
    }) {
      const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      const baseY = .16, t = .38, doorW = 5.4, doorH = 4.2;
      const isEast = doorSide === 'east', isWest = doorSide === 'west', isNorth = doorSide === 'north', isSouth = doorSide === 'south';

      // Interior concrete floor slab + perimeter foundation apron & concrete curb
      solid(sec, parent, M.concrete, x0 - .55, baseY - .16, z0 - .55, x1 + .55, baseY + .06, z1 + .55, 'concrete', true);

      // Build 4 real structural walls (with a true open 5.4m x 4.2m bay on doorSide so player can walk/drive right inside!)
      const buildWallWithOptionalDoor = (hasDoor, side) => {
        if (side === 'north' || side === 'south') {
          const wz0 = side === 'north' ? z0 : z1 - t;
          const wz1 = side === 'north' ? z0 + t : z1;
          if (!hasDoor) {
            solid(sec, parent, M.concreteDirty, x0, baseY, wz0, x1, baseY + 1.55, wz1, 'concrete', true);
            solid(sec, parent, wallMat, x0, baseY + 1.55, wz0, x1, baseY + h, wz1, 'metal', true);
          } else {
            const dx0 = cx - doorW / 2, dx1 = cx + doorW / 2;
            solid(sec, parent, M.concreteDirty, x0, baseY, wz0, dx0, baseY + 1.55, wz1, 'concrete', true);
            solid(sec, parent, wallMat, x0, baseY + 1.55, wz0, dx0, baseY + h, wz1, 'metal', true);
            solid(sec, parent, M.concreteDirty, dx1, baseY, wz0, x1, baseY + 1.55, wz1, 'concrete', true);
            solid(sec, parent, wallMat, dx1, baseY + 1.55, wz0, x1, baseY + h, wz1, 'metal', true);
            solid(sec, parent, wallMat, dx0, baseY + doorH, wz0, dx1, baseY + h, wz1, 'metal', true);
          }
        } else {
          const wx0 = side === 'west' ? x0 : x1 - t;
          const wx1 = side === 'west' ? x0 + t : x1;
          if (!hasDoor) {
            solid(sec, parent, M.concreteDirty, wx0, baseY, z0 + t, wx1, baseY + 1.55, z1 - t, 'concrete', true);
            solid(sec, parent, wallMat, wx0, baseY + 1.55, z0 + t, wx1, baseY + h, z1 - t, 'metal', true);
          } else {
            const dz0 = cz - doorW / 2, dz1 = cz + doorW / 2;
            solid(sec, parent, M.concreteDirty, wx0, baseY, z0 + t, wx1, baseY + 1.55, dz0, 'concrete', true);
            solid(sec, parent, wallMat, wx0, baseY + 1.55, z0 + t, wx1, baseY + h, dz0, 'metal', true);
            solid(sec, parent, M.concreteDirty, wx0, baseY, dz1, wx1, baseY + 1.55, z1 - t, 'concrete', true);
            solid(sec, parent, wallMat, wx0, baseY + 1.55, dz1, wx1, baseY + h, z1 - t, 'metal', true);
            solid(sec, parent, wallMat, wx0, baseY + doorH, dz0, wx1, baseY + h, dz1, 'metal', true);
          }
        }
      };
      buildWallWithOptionalDoor(isNorth, 'north');
      buildWallWithOptionalDoor(isSouth, 'south');
      buildWallWithOptionalDoor(isWest, 'west');
      buildWallWithOptionalDoor(isEast, 'east');

      // Exterior structural steel H-columns, horizontal steel girts, rainwater downspouts & interior roof trusses
      const bays = Math.max(3, Math.round(w / 6.8));
      for (let i = 0; i <= bays; i++) {
        const px = x0 + (w * i) / bays;
        for (const pz of [z0 - .10, z1 + .10]) {
          addBox(parent, M.steelDark, .38, h + .25, .38, px, baseY + h / 2, pz);
          addBox(parent, M.concrete, .54, .34, .54, px, baseY + .17, pz);
        }
        if (i > 0 && i < bays) {
          addBox(parent, M.steelDark, .24, .34, d - .6, px, baseY + h - .25, cz);
          addBox(parent, M.steelGalv, .95, .12, .28, px, baseY + h - .52, cz - d * .22);
          addBox(parent, M.glassWarm, .85, .04, .18, px, baseY + h - .60, cz - d * .22);
          addBox(parent, M.steelGalv, .95, .12, .28, px, baseY + h - .52, cz + d * .22);
          addBox(parent, M.glassWarm, .85, .04, .18, px, baseY + h - .60, cz + d * .22);
        }
      }
      for (const fz of [z0 - .08, z1 + .08]) {
        addBox(parent, M.concrete, w + .32, .16, .26, cx, baseY + 1.56, fz);
        addBox(parent, M.steelDark, w + .28, .14, .22, cx, baseY + h - .24, fz);
        addBox(parent, M.steelGalv, w + .6, .16, .24, cx, baseY + h + .04, fz + (fz < cz ? -.25 : .25));
      }
      const dBays = Math.max(2, Math.round(d / 6.8));
      for (let j = 1; j < dBays; j++) {
        const pz = z0 + (d * j) / dBays;
        for (const px of [x0 - .10, x1 + .10]) addBox(parent, M.steelDark, .36, h + .2, .36, px, baseY + h / 2, pz);
      }
      for (const [dxp, dzp] of [[x0 - .22, z0 - .22], [x1 + .22, z1 + .22]]) {
        addCyl(parent, M.steelGalv, .085, h, dxp, baseY + h / 2, dzp);
      }
      const ductX = isWest ? x1 + .42 : x0 - .42;
      addBox(parent, M.steelGalv, .62, h * .76, .62, ductX, baseY + h * .56, cz - d * .24);
      addBox(parent, M.steelDark, .78, .22, .78, ductX, baseY + h * .96, cz - d * .24);
      addBox(parent, M.steelGalv, .72, .72, 1.35, ductX, baseY + 1.65, cz - d * .24);

      if (flatRoof) {
        // Clean engineered flat parapet roof (for Field Triage Clinic & Substation — ZERO roof clipping!)
        solid(sec, parent, roofMat, x0 - .35, baseY + h - .10, z0 - .35, x1 + .35, baseY + h + .32, z1 + .35, 'concrete', true);
        addBox(parent, M.steelDark, w + .85, .18, d + .85, cx, baseY + h + .38, cz);
        for (const rz of [z0 - .25, z1 + .25]) addBox(parent, wallMat, w + .6, .75, .28, cx, baseY + h + .75, rz);
        for (const rx of [x0 - .25, x1 + .25]) addBox(parent, wallMat, .28, .75, d + .2, rx, baseY + h + .75, cz);
        addBox(parent, M.steelGalv, 2.8, 1.1, 1.8, cx - w * .26, baseY + h + .95, cz - d * .22);
      } else {
        // Pitched corrugated gable roof + monitor skylight lantern + spinning exhaust turbines + rooftop chiller
        const ridgeH = 1.75;
        const slopeHalf = (d / 2) + .82;
        const slopeLen = Math.hypot(slopeHalf, ridgeH);
        const slopeAng = Math.atan2(ridgeH, slopeHalf);
        for (const side of [-1, 1]) {
          const slope = new Mesh(getWorldBoxGeo(w + 1.3, .20, slopeLen, 3.0), roofMat);
          slope.position.set(cx, baseY + h + ridgeH / 2 + .06, cz + side * (slopeHalf / 2));
          slope.rotation.x = side * slopeAng;
          slope.receiveShadow = true; slope.matrixAutoUpdate = false; slope.updateMatrix();
          parent.add(slope);
        }
        addBox(parent, M.steelDark, w * .68, .86, 1.75, cx, baseY + h + ridgeH + .36, cz);
        addBox(parent, M.glass, w * .64, .44, 1.82, cx, baseY + h + ridgeH + .38, cz);
        addBox(parent, M.steelGalv, w * .72, .16, 2.05, cx, baseY + h + ridgeH + .84, cz);
        for (const tx of [cx - w * .28, cx + w * .28]) {
          addCyl(parent, M.steelGalv, .38, .65, tx, baseY + h + ridgeH + .28, cz);
          const turb = new Group(); turb.position.set(tx, baseY + h + ridgeH + .74, cz);
          addCyl(turb, M.steelGalv, .52, .42, 0, 0, 0);
          addBox(turb, M.steelDark, 1.08, .32, .12, 0, 0, 0);
          addBox(turb, M.steelDark, .12, .32, 1.08, 0, 0, 0);
          parent.add(turb);
          updaters.push(dt => { turb.rotation.y += dt * 3.4; });
        }
        addBox(parent, M.steelGalv, 3.4, 1.35, 2.2, cx - w * .22, baseY + h + .92, cz - d * .18);
      }

      // Recessed clerestory multi-pane windows along north & south walls
      for (let wx = x0 + 3.8; wx < x1 - 3.2; wx += 5.4) {
        for (const fz of [z0 - .05, z1 + .05]) {
          addBox(parent, M.steelDark, 3.3, 1.36, .26, wx, baseY + h - 1.48, fz);
          addBox(parent, M.glass, 2.96, 1.06, .30, wx, baseY + h - 1.48, fz);
          addBox(parent, M.steelDark, .08, 1.06, .32, wx, baseY + h - 1.48, fz);
          addBox(parent, M.concrete, 3.5, .15, .38, wx, baseY + h - 2.18, fz);
        }
      }

      // Open loading-bay frame, rubber dock bumpers, tension-rod steel canopy, wall-pack lamps & crisp 1:1 signboard
      const dx = isEast ? x1 + .06 : (isNorth || isSouth ? cx : x0 - .06);
      const dz = isNorth ? z0 - .06 : (isSouth ? z1 + .06 : cz);
      const rotDoor = (isNorth || isSouth) ? 0 : Math.PI / 2;
      const doorG = new Group();
      doorG.position.set(dx, baseY, dz);
      doorG.rotation.y = rotDoor + (isNorth ? Math.PI : (isEast ? 0 : Math.PI));
      addBox(doorG, M.steelDark, .30, doorH + .24, .48, -doorW / 2 - .14, doorH / 2, 0);
      addBox(doorG, M.steelDark, .30, doorH + .24, .48, doorW / 2 + .14, doorH / 2, 0);
      addBox(doorG, M.steelGalv, doorW + .58, .66, .58, 0, doorH + .28, .08);
      addBox(doorG, M.hazard, doorW + .44, .24, .60, 0, doorH - .05, .10);
      addBox(doorG, M.steelDark, doorW + 1.6, .22, 2.45, 0, doorH + .68, 1.22);
      for (const bx of [-doorW / 2 - .45, doorW / 2 + .45]) {
        addCyl(doorG, M.yellowPaint, .12, 1.08, bx, .54, .92);
        addBox(doorG, M.steelDark, .26, .88, .32, bx * .92, .95, .28);
        const rod = addBox(doorG, M.steelGalv, .055, .055, 2.35, bx, doorH + 1.38, 1.15);
        rod.rotation.x = .54; rod.updateMatrix();
        addBox(doorG, M.glassWarm, .42, .22, .16, bx * 1.18, doorH + .15, .24);
      }
      const signM = new Mesh(boxGeo, makeSignMat(title, 'SALTLINE PORT AUTHORITY', signBg));
      signM.scale.set(Math.min(7.8, Math.max(5.0, (isNorth || isSouth ? w : d) * .48)), 1.08, .08);
      signM.position.set(0, h - .82, .20);
      doorG.add(signM);
      doorG.matrixAutoUpdate = false; doorG.updateMatrix();
      parent.add(doorG);

      // REAL FURNISHED INTERIOR using Area-1 world.props.build() assets (shelves, crates, forklifts, generators, workbenches!)
      const fy = baseY + .06;
      const propParent = sec.detail || parent;
      if (interiorKind === 'cold_storage') {
        placePortProp(sec, propParent, 'shelf_rack', x0 + 5.0, fy, z0 + 2.4, 0);
        placePortProp(sec, propParent, 'shelf_rack', x0 + 11.5, fy, z0 + 2.4, 0);
        placePortProp(sec, propParent, 'shelf_rack', x0 + 5.0, fy, z1 - 2.4, Math.PI);
        placePortProp(sec, propParent, 'shelf_rack', x0 + 11.5, fy, z1 - 2.4, Math.PI);
        placePortProp(sec, propParent, 'pallet_stack', cx - 2.5, fy, cz - 3.2, .12);
        placePortProp(sec, propParent, 'crate_stack', cx + 4.5, fy, z0 + 3.0, -.08);
        placePortProp(sec, propParent, 'ibc_tote', x0 + 3.2, fy, cz, .05);
        placePortProp(sec, propParent, 'forklift', cx + 7.5, fy, cz + 2.2, Math.PI * .78);
        placePortProp(sec, propParent, 'floodlight_stand', x1 - 4.2, fy, z0 + 2.6, Math.PI * .7);
        placePortProp(sec, propParent, 'reefer_unit', x0 - 1.6, baseY, cz, Math.PI / 2);
      } else if (interiorKind === 'clinic') {
        // Interior triage counter, partition wall, medical supply shelves, emergency generator & cots
        addBox(propParent, M.steelWorn, 6.5, 1.05, .95, cx - 4.0, fy + .52, cz + 1.5);
        addBox(propParent, M.glassCyan, 1.4, .55, .12, cx - 4.0, fy + 1.32, cz + 1.35);
        for (const bx of [cx + 5.5, cx + 10.5, cx + 15.5]) {
          addBox(propParent, M.steelGalv, 1.1, .68, 2.2, bx, fy + .34, z1 - 4.8);
          addBox(propParent, M.whitePaint, 1.02, .16, 2.1, bx, fy + .76, z1 - 4.8); // Triage beds
        }
        placePortProp(sec, propParent, 'shelf_rack', x0 + 4.5, fy, z1 - 2.6, Math.PI);
        placePortProp(sec, propParent, 'shelf_rack', x0 + 10.5, fy, z1 - 2.6, Math.PI);
        placePortProp(sec, propParent, 'cardboard_boxes', x0 + 3.5, fy, z0 + 3.5, .2);
        placePortProp(sec, propParent, 'floodlight_stand', cx + 2.0, fy, z0 + 4.0, .4);
        placePortProp(sec, propParent, 'generator', x0 - 2.4, baseY, cz, Math.PI / 2);
      } else {
        // Warehouse / Pump House / Marine Workshop interior: machinery, pipe stacks, shelves, forklift, tool carts & barrels
        placePortProp(sec, propParent, 'generator', x0 + 4.8, fy, z0 + 3.6, 0);
        placePortProp(sec, propParent, 'shelf_rack', cx - 2.0, fy, z0 + 2.4, 0);
        placePortProp(sec, propParent, 'shelf_rack', cx + 5.0, fy, z0 + 2.4, 0);
        placePortProp(sec, propParent, 'pipe_stack', x0 + 6.5, fy, z1 - 3.6, .04);
        placePortProp(sec, propParent, 'cable_reel', cx + 2.5, fy, z1 - 3.4, .5);
        placePortProp(sec, propParent, 'toolbox_cart', cx - 5.5, fy, cz + 1.5, .25);
        placePortProp(sec, propParent, 'forklift', cx + 6.0, fy, cz + 1.8, -Math.PI / 2);
        placePortProp(sec, propParent, 'barrel', x1 - 4.2, fy, z0 + 2.6, 0, { color: 'blue' });
        placePortProp(sec, propParent, 'barrel', x1 - 3.2, fy, z0 + 2.9, .4, { color: 'red' });
        placePortProp(sec, propParent, 'floodlight_stand', x1 - 4.5, fy, z1 - 3.0, Math.PI * 1.2);
      }

      // Reference Photo 3 Architectural Detail: bright orange steel service door + yellow exterior steel staircase with handrails
      const stSideZ = isNorth ? z1 + .05 : z0 - .05;
      const stSign = isNorth ? 1 : -1;
      const stX = x0 + Math.min(6.2, w * .26);
      addBox(parent, M.safetyOrange, 1.35, 2.35, .18, stX, baseY + 2.95, stSideZ);
      addBox(parent, M.steelDark, 1.55, .14, .26, stX, baseY + 4.18, stSideZ + stSign * .06);
      addBox(parent, M.steelGalv, 2.2, .14, 1.35, stX, baseY + 1.72, stSideZ + stSign * .72); // Upper landing
      addBox(parent, M.yellowPaint, 2.24, .08, .08, stX, baseY + 2.76, stSideZ + stSign * 1.36); // Top rail
      addBox(parent, M.yellowPaint, 2.24, .06, .06, stX, baseY + 2.26, stSideZ + stSign * 1.36); // Mid rail
      for (const sx of [-1.04, 1.04]) addBox(parent, M.yellowPaint, .08, 1.05, .08, stX + sx, baseY + 2.24, stSideZ + stSign * 1.36);
      for (let s = 0; s < 7; s++) {
        const sy = baseY + .24 + s * .22;
        const stepX = stX + 1.15 + (6 - s) * .36;
        addBox(parent, M.steelGalv, .34, .08, 1.15, stepX, sy, stSideZ + stSign * .68);
      }
      const railSlope = addBox(parent, M.yellowPaint, 2.95, .07, .07, stX + 2.35, baseY + 1.92, stSideZ + stSign * 1.24);
      railSlope.rotation.z = -.56; railSlope.updateMatrix();
      addBox(parent, M.yellowPaint, .08, 1.05, .08, stX + 3.55, baseY + .55, stSideZ + stSign * 1.24);
    }

    // =========================================================================
    // REAL-WORLD PORT REFERENCE LANDMARKS (4 Reference Photos):
    //   1. Red-and-White RTG Straddle Gantry Cranes + Semi-Trailer Container Trucks
    //   2. Red-and-White Lattice Ship-to-Shore (STS) Deep-Water Quay Cranes
    //   3. Triple Steel Exhaust Flue Stack Lattice Tower + Outdoor Chiller Fan Deck
    //   4. Hyperbolic Concrete Cooling Towers (LatheGeometry) + 38m Red/White Smokestacks + Conveyor Gallery
    // =========================================================================
    // Area-1-Grade Multi-Story Walkable Control Tower (replaces stacked-box ATC & Rail Signal Towers!)
    function addControlTower(sec, parent, {
      x, z, baseH = 11.0, cabW = 9.4, cabD = 9.4, title = 'CONTROL TOWER', signBg = '#1b303d', hasRadar = true,
    }) {
      const g = new Group();
      g.position.set(x, .16, z);
      const shaftW = cabW * .66, shaftD = cabD * .66;
      const hw = shaftW / 2, hd = shaftD / 2;
      addBox(g, M.concreteDirty, shaftW + 1.6, .75, shaftD + 1.6, 0, .375, 0);
      addBox(g, M.concrete, shaftW, baseH, shaftD, 0, baseH / 2, 0);
      for (const sx of [-hw, hw]) {
        for (const sz of [-hd, hd]) addBox(g, M.steelDark, .42, baseH + .4, .42, sx, baseH / 2, sz);
      }
      for (let fy = 3.4; fy < baseH - 1.2; fy += 3.4) {
        addBox(g, M.concreteDirty, shaftW + .36, .34, shaftD + .36, 0, fy, 0);
        for (const sx of [-hw - .04, hw + .04]) {
          addBox(g, M.steelDark, .16, 1.5, 1.9, sx, fy - 1.5, 0);
          addBox(g, smokedPane, .20, 1.28, 1.66, sx, fy - 1.5, 0);
        }
      }
      addBox(g, M.safetyOrange, 1.35, 2.35, .18, 0, 1.55, hd + .06);
      addBox(g, M.steelDark, 2.2, .16, 1.4, 0, 2.85, hd + .72);
      const flights = Math.max(2, Math.floor(baseH / 3.4));
      for (let f = 0; f < flights; f++) {
        const y0 = .4 + f * 3.2;
        const side = f % 2 === 0 ? 1 : -1;
        const stZ = side * (hd + .85);
        addBox(g, M.steelGalv, 1.6, .14, 1.4, side * (hw + .55), y0 + 3.0, stZ);
        addBox(g, M.yellowPaint, 1.65, .08, .08, side * (hw + .55), y0 + 4.05, stZ + side * .68);
        for (let s = 0; s < 6; s++) {
          const sx = -hw + (s / 5) * shaftW;
          addBox(g, M.steelGalv, .46, .08, 1.15, sx, y0 + .45 + s * .46, stZ);
        }
        const rail = addBox(g, M.yellowPaint, shaftW + .8, .08, .08, 0, y0 + 2.4, stZ + side * .56);
        rail.rotation.z = .42; rail.updateMatrix();
      }
      const deckW = cabW + 2.4, deckD = cabD + 2.4;
      addBox(g, M.steelDark, deckW, .45, deckD, 0, baseH + .22, 0);
      for (const sx of [-hw, hw]) {
        for (const sz of [-hd, hd]) {
          const brace = addBox(g, M.steelGalv, .28, 2.4, .28, sx * 1.18, baseH - .7, sz * 1.18);
          brace.rotation.set(sz > 0 ? .52 : -.52, 0, sx > 0 ? -.52 : .52); brace.updateMatrix();
        }
      }
      for (const rz of [-deckD / 2 + .08, deckD / 2 - .08]) {
        addBox(g, M.yellowPaint, deckW, .08, .08, 0, baseH + 1.42, rz);
        for (let px = -deckW / 2; px <= deckW / 2 + .01; px += 2.2) addBox(g, M.yellowPaint, .07, 1.05, .07, px, baseH + .92, rz);
      }
      for (const rx of [-deckW / 2 + .08, deckW / 2 - .08]) {
        addBox(g, M.yellowPaint, .08, .08, deckD, rx, baseH + 1.42, 0);
        for (let pz = -deckD / 2; pz <= deckD / 2 + .01; pz += 2.2) addBox(g, M.yellowPaint, .07, 1.05, .07, rx, baseH + .92, pz);
      }
      const cabY = baseH + .45, cabH = 3.4;
      addBox(g, M.concreteDirty, cabW, .92, cabD, 0, cabY + .46, 0);
      addBox(g, M.glass, cabW - .24, cabH - 1.1, cabD - .24, 0, cabY + .92 + (cabH - 1.1) / 2, 0);
      for (const sx of [-cabW / 2, 0, cabW / 2]) {
        for (const sz of [-cabD / 2, cabD / 2]) addBox(g, M.steelDark, .22, cabH, .22, sx, cabY + cabH / 2, sz);
      }
      for (const sz of [-cabD / 2, 0, cabD / 2]) {
        for (const sx of [-cabW / 2, cabW / 2]) addBox(g, M.steelDark, .22, cabH, .22, sx, cabY + cabH / 2, sz);
      }
      addBox(g, M.steelDark, cabW * .56, 1.05, 1.2, 0, cabY + .95, cabD * .18);
      addBox(g, M.glassCyan, cabW * .44, .52, .12, 0, cabY + 1.65, cabD * .18);
      addBox(g, M.glassWarm, cabW * .52, .08, cabD * .52, 0, cabY + cabH - .18, 0);
      const roofY = cabY + cabH;
      addBox(g, M.steelDark, cabW + 1.5, .52, cabD + 1.5, 0, roofY + .26, 0);
      addBox(g, M.steelGalv, cabW + 1.7, .16, cabD + 1.7, 0, roofY + .56, 0);
      const signM = new Mesh(boxGeo, makeSignMat(title, 'SALTLINE OPERATIONS', signBg));
      signM.scale.set(Math.min(6.4, cabW * .78), .82, .10);
      signM.position.set(0, baseH + .92, cabD / 2 + .12);
      g.add(signM);
      addBox(g, M.steelWorn, 2.2, 1.1, 1.8, -cabW * .26, roofY + 1.05, -cabD * .22);
      addCyl(g, M.steelGalv, .08, 4.2, cabW * .34, roofY + 2.5, -cabD * .32);
      const beacons = [];
      for (const [bx, bz] of [[-cabW / 2 - .5, -cabD / 2 - .5], [cabW / 2 + .5, -cabD / 2 - .5], [-cabW / 2 - .5, cabD / 2 + .5], [cabW / 2 + .5, cabD / 2 + .5]]) {
        const bMat = M.redCore.clone ? M.redCore.clone() : M.redCore;
        const bm = new Mesh(boxGeo, bMat);
        bm.scale.set(.34, .44, .34); bm.position.set(bx, roofY + .82, bz);
        g.add(bm); beacons.push(bm);
      }
      let radarBar = null;
      if (hasRadar) {
        addCyl(g, M.steelDark, .38, 1.5, 0, roofY + 1.2, 0);
        radarBar = new Group(); radarBar.position.set(0, roofY + 2.1, 0);
        addBox(radarBar, M.craneWhite, 4.6, .36, .48, 0, 0, 0);
        addBox(radarBar, M.hazard, 4.7, .12, .52, 0, -.20, 0);
        g.add(radarBar);
      }
      let blinkT = (Math.abs(x) * .17) % 2;
      updaters.push(dt => {
        blinkT += dt;
        const on = Math.sin(blinkT * 3.8) > -.15;
        for (const bm of beacons) bm.visible = on;
        if (radarBar) radarBar.rotation.y += dt * 1.95;
      });
      parent.add(g);
      if (sec) {
        sec.colliderSpecs.push({
          min: new Vector3(x - hw - .8, .16, z - hd - .8),
          max: new Vector3(x + hw + .8, roofY + .6, z + hd + .8),
          surface: 'concrete',
        });
      }
    }

    function addRedWhiteRTGCrane(sec, parent, x, z, span = 14.0, height = 13.5, yaw = 0) {
      const g = new Group();
      g.position.set(x, .16, z);
      g.rotation.y = yaw;
      const hs = span / 2;
      for (const sx of [-hs, hs]) {
        addBox(g, M.craneRed, 1.15, 1.05, 8.6, sx, .95, 0);
        for (const wz of [-3.4, -1.6, 1.6, 3.4]) {
          addCyl(g, M.steelDark, .62, .48, sx, .62, wz, 0, Math.PI / 2);
          addCyl(g, M.steelGalv, .28, .52, sx, .62, wz, 0, Math.PI / 2);
        }
        for (const lz of [-2.4, 2.4]) addBox(g, M.craneWhite, .82, height - 2.4, .82, sx, 1.45 + (height - 2.4) / 2, lz);
        addBox(g, M.craneWhite, .72, .72, 5.4, sx, height * .56, 0);
        addBox(g, M.craneRed, 1.05, 1.15, 6.2, sx, height - .6, 0);
      }
      for (const gz of [-2.1, 2.1]) addBox(g, M.craneRed, span + 1.8, 1.35, .86, 0, height, gz);
      addBox(g, M.steelDark, span + 1.2, .16, 3.6, 0, height + .72, 0);
      for (const rz of [-2.55, 2.55]) {
        addBox(g, M.yellowPaint, span + 1.4, .08, .08, 0, height + 1.68, rz);
        for (let px = -hs; px <= hs; px += 2.6) addBox(g, M.yellowPaint, .08, .96, .08, px, height + 1.2, rz);
      }
      addCyl(g, M.yellowPaint, 1.25, .65, hs + .85, 3.6, -2.5, Math.PI / 2, 0);
      const trolley = new Group();
      trolley.position.set(0, height - .85, 0);
      addBox(trolley, M.steelDark, 3.2, .95, 3.4, 0, 0, 0);
      addBox(trolley, M.craneWhite, 2.2, 1.75, 2.0, 0, -1.3, 2.2);
      addBox(trolley, M.glassCyan, 1.85, .92, .12, 0, -1.25, 3.22);
      const hoist = new Group();
      hoist.position.set(0, -4.4, 0);
      for (const cx of [-.8, .8]) addCyl(hoist, M.steelGalv, .05, 5.2, cx, 2.4, 0);
      addBox(hoist, M.hazard, 2.6, .55, 6.2, 0, 0, 0);
      addBox(hoist, ((Math.abs(x + z) | 0) % 2 === 0) ? M.cargoTeal : M.cargoNavy, 2.45, 2.4, 6.0, 0, -1.5, 0);
      trolley.add(hoist);
      g.add(trolley);
      let rtgClock = (Math.abs(x * .21 + z * .13)) % 12;
      const travel = Math.max(1.8, hs - 2.6);
      updaters.push(dt => {
        rtgClock += dt * .48;
        trolley.position.x = Math.sin(rtgClock) * travel;
        hoist.position.y = -4.2 + Math.cos(rtgClock * 2.0) * 1.15;
      });
      parent.add(g);
      if (sec) {
        const c = Math.cos(yaw), s = Math.sin(yaw);
        for (const sx of [-hs, hs]) {
          const wx = x + sx * c, wz = z - sx * s;
          sec.colliderSpecs.push({ min: new Vector3(wx - 1.1, .16, wz - 4.4), max: new Vector3(wx + 1.1, 4.5, wz + 4.4), surface: 'metal' });
        }
      }
    }

    function addRedWhiteSTSCrane(sec, parent, x, z) {
      const g = new Group();
      g.position.set(x, .16, z);
      for (const px of [-5.2, 5.2]) {
        addBox(g, M.craneRed, 1.6, 1.3, 13.8, px, .65, 0);
        for (const pz of [-5.2, 5.2]) addBox(g, M.craneRed, 1.15, 19.5, 1.15, px, 10.4, pz);
        addBox(g, M.craneWhite, .92, .92, 11.4, px, 11.2, 0);
        const br1 = addBox(g, M.craneWhite, .36, 11.5, .36, px, 15.0, 0);
        br1.rotation.x = .66; br1.updateMatrix();
        const br2 = addBox(g, M.craneWhite, .36, 11.5, .36, px, 15.0, 0);
        br2.rotation.x = -.66; br2.updateMatrix();
      }
      for (const pz of [-5.2, 5.2]) {
        addBox(g, M.craneRed, 11.8, 1.2, 1.1, 0, 19.8, pz);
        addBox(g, M.craneWhite, 11.2, .75, .75, 0, 12.2, pz);
      }
      addBox(g, M.craneWhite, 8.6, 4.4, 7.6, -1.8, 22.4, 0);
      addBox(g, M.steelDark, 8.8, .35, 7.8, -1.8, 24.75, 0);
      for (const pz of [-4.8, 4.8]) {
        const af1 = addBox(g, M.craneRed, .85, 14.5, .85, -1.6, 26.8, pz);
        af1.rotation.z = -.24; af1.updateMatrix();
        const af2 = addBox(g, M.craneRed, .85, 14.5, .85, 2.2, 26.8, pz);
        af2.rotation.z = .24; af2.updateMatrix();
      }
      addBox(g, M.craneRed, 1.4, 1.2, 11.0, .3, 33.4, 0);
      for (const bz of [-5.1, 5.1]) addBox(g, M.redCore, .42, .52, .42, .3, 34.3, bz);
      for (const bz of [-2.4, 2.4]) addBox(g, M.craneRed, 38.0, 1.35, .78, 8.0, 19.8, bz);
      for (let bx = -9; bx <= 25; bx += 4.2) addBox(g, M.craneWhite, .42, .42, 5.2, bx, 20.55, 0);
      const addStay = (x0, y0, x1, y1, zOff) => {
        const len = Math.hypot(x1 - x0, y1 - y0);
        const m = addBox(g, M.craneWhite, len, .26, .26, (x0 + x1) / 2, (y0 + y1) / 2, zOff);
        m.rotation.z = Math.atan2(y1 - y0, x1 - x0); m.updateMatrix();
      };
      for (const sz of [-2.4, 2.4]) {
        addStay(.3, 33.4, 24.0, 20.2, sz);
        addStay(.3, 33.4, 13.5, 20.2, sz);
        addStay(.3, 33.4, -10.0, 20.2, sz);
      }
      const stsTrolley = new Group();
      stsTrolley.position.set(12.5, 17.6, 0);
      addBox(stsTrolley, M.craneWhite, 3.2, 2.1, 2.6, 0, 0, 0);
      addBox(stsTrolley, M.glassCyan, 2.8, 1.0, 2.7, 0, -.1, 0);
      const stsHoist = new Group();
      stsHoist.position.set(0, -6.5, 0);
      for (const tz of [-1.8, 1.8]) addCyl(stsHoist, M.steelGalv, .06, 6.8, 0, 3.2, tz);
      addBox(stsHoist, M.hazard, 2.8, .65, 6.4, 0, 0, 0);
      addBox(stsHoist, M.safetyOrange, 2.5, 2.5, 6.1, 0, -1.55, 0);
      stsTrolley.add(stsHoist);
      g.add(stsTrolley);
      let stsClock = (Math.abs(z) * .11) % 10;
      updaters.push(dt => {
        stsClock += dt * .32;
        stsTrolley.position.x = 11.5 + Math.sin(stsClock) * 11.0;
        stsHoist.position.y = -6.2 + Math.cos(stsClock * 2.0) * 1.9;
      });
      parent.add(g);
      if (sec) {
        for (const px of [-5.2, 5.2]) {
          sec.colliderSpecs.push({ min: new Vector3(x + px - 1.1, .16, z - 6.8), max: new Vector3(x + px + 1.1, 5.0, z + 6.8), surface: 'metal' });
        }
      }
    }

    function addIndustrialExhaustTower(sec, parent, x, z, ductDir = -1) {
      const g = new Group();
      g.position.set(x, .16, z);
      addBox(g, M.concrete, 4.6, .45, 9.6, 0, .22, 0);
      for (const sz of [-3.0, 0, 3.0]) {
        addCyl(g, M.steelDark, .66, 17.5, 0, 9.1, sz);
        addCyl(g, M.craneWhite, .70, 2.6, 0, 19.0, sz);
        addCyl(g, M.steelDark, .68, 1.4, 0, 21.0, sz);
        addBox(g, M.steelGalv, 4.2, .95, .95, ductDir * 2.4, 2.8, sz);
      }
      for (const lx of [-1.75, 1.75]) {
        for (const lz of [-4.4, -1.5, 1.5, 4.4]) addBox(g, M.steelGalv, .18, 19.0, .18, lx, 9.6, lz);
      }
      for (const py of [6.2, 12.2, 18.0]) {
        addBox(g, M.steelDark, 3.8, .16, 9.2, 0, py, 0);
        for (const rx of [-1.85, 1.85]) addBox(g, M.yellowPaint, .09, .09, 9.2, rx, py + 1.05, 0);
        for (const rz of [-4.55, 4.55]) addBox(g, M.yellowPaint, 3.8, .09, .09, 0, py + 1.05, rz);
        for (const rx of [-1.85, 1.85]) for (const rz of [-4.55, 0, 4.55]) addBox(g, M.yellowPaint, .08, 1.05, .08, rx, py + .52, rz);
      }
      const chX = -ductDir * 5.8;
      addBox(g, M.concrete, 6.2, .35, 8.6, chX, .18, 0);
      for (const cx of [chX - 2.6, chX + 2.6]) for (const cz of [-3.8, 0, 3.8]) addBox(g, M.steelGalv, .26, 3.6, .26, cx, 1.95, cz);
      addBox(g, M.steelWorn, 5.6, 1.25, 8.0, chX, 3.9, 0);
      const fans = [];
      for (const fx of [chX - 1.35, chX + 1.35]) {
        for (const fz of [-2.4, 0, 2.4]) {
          addCyl(g, M.steelDark, .82, .45, fx, 4.72, fz);
          const rotor = new Group(); rotor.position.set(fx, 4.86, fz);
          addBox(rotor, M.steelGalv, 1.42, .07, .18, 0, 0, 0);
          addBox(rotor, M.steelGalv, .18, .07, 1.42, 0, 0, 0);
          g.add(rotor); fans.push(rotor);
        }
      }
      updaters.push(dt => {
        for (let i = 0; i < fans.length; i++) fans[i].rotation.y += dt * (4.8 + (i % 3) * .6);
      });
      addCyl(g, M.craneWhite, 1.45, 7.6, chX, 3.9, -6.2);
      parent.add(g);
      if (sec) {
        sec.colliderSpecs.push({ min: new Vector3(x - 2.3, .16, z - 4.8), max: new Vector3(x + 2.3, 18.5, z + 4.8), surface: 'metal' });
      }
    }

    function addPowerPlantSkyline(sec, parent, x, z) {
      const g = new Group();
      g.position.set(x, .16, z);
      let coolingGeo = null;
      if (THREE.LatheGeometry && THREE.Vector2) {
        const pts = [];
        const towerH = 23.5;
        for (let i = 0; i <= 18; i++) {
          const t = i / 18;
          const r = 4.55 * Math.sqrt(1 + Math.pow((t - .72) / .44, 2));
          pts.push(new THREE.Vector2(r, 2.2 + t * towerH));
        }
        coolingGeo = new THREE.LatheGeometry(pts, 28);
        customGeos.push(coolingGeo);
      }
      const steamMat = new MeshBasicMaterial({ color: 0xdce6ec, transparent: true, opacity: .22, depthWrite: false });
      const steamPuffs = [];
      for (const ox of [0, 21.5]) {
        if (coolingGeo) {
          const shell = new Mesh(coolingGeo, M.coolingConcrete);
          shell.position.set(ox, 0, 0);
          shell.receiveShadow = true; shell.matrixAutoUpdate = false; shell.updateMatrix();
          g.add(shell);
        } else {
          addCyl(g, M.coolingConcrete, 6.2, 24.0, ox, 13.5, 0);
        }
        addCyl(g, M.concreteDirty, 7.95, .65, ox, .32, 0);
        for (let k = 0; k < 12; k++) {
          const ang = (k / 12) * Math.PI * 2;
          const px = ox + Math.cos(ang) * 7.45, pz = Math.sin(ang) * 7.45;
          addBox(g, M.concrete, .38, 2.5, .38, px, 1.35, pz);
        }
        addCyl(g, M.concreteDirty, 5.45, .55, ox, 25.7, 0);
        for (let p = 0; p < 4; p++) {
          const puff = new Mesh(sphGeo, steamMat);
          puff.position.set(ox, 26.2 + p * 3.8, 0);
          g.add(puff);
          steamPuffs.push({ mesh: puff, ox, phase: p * .25 + (ox > 0 ? .12 : 0) });
        }
        if (sec) {
          sec.colliderSpecs.push({ min: new Vector3(x + ox - 7.8, .16, z - 7.8), max: new Vector3(x + ox + 7.8, 25.0, z + 7.8), surface: 'concrete' });
        }
      }
      updaters.push(dt => {
        for (const sp of steamPuffs) {
          sp.phase = (sp.phase + dt * .16) % 1;
          const t = sp.phase;
          sp.mesh.position.set(sp.ox + t * 5.2, 25.8 + t * 15.5, Math.sin(t * 6.28) * 1.4);
          const sc = 3.2 + t * 4.4;
          sp.mesh.scale.set(sc, sc * .68, sc);
        }
      });
      const addStripedStack = (sx, sz, totalH = 38.0) => {
        addCyl(g, M.concreteDirty, 2.65, 3.2, sx, 1.6, sz);
        addCyl(g, M.concrete, 1.95, totalH * .60, sx, 3.2 + (totalH * .60) / 2, sz);
        const bandStart = 3.2 + totalH * .60;
        const bandH = (totalH * .32) / 5;
        for (let b = 0; b < 5; b++) {
          const r = 1.65 - b * .09;
          addCyl(g, b % 2 === 0 ? M.craneRed : M.craneWhite, r, bandH, sx, bandStart + (b + .5) * bandH, sz);
        }
        addBox(g, M.redCore, .46, .52, .46, sx, bandStart + 5 * bandH + .35, sz);
      };
      addStripedStack(31.5, -5.5, 36.0);
      addStripedStack(31.5, 5.5, 34.0);
      const conv = addBox(g, M.yellowPaint, 16.5, 2.0, 2.2, 32.0, 8.8, 8.5);
      conv.rotation.set(.32, Math.PI / 2, 0); conv.updateMatrix();
      addBox(g, M.steelGalv, .45, 7.6, .45, 32.0, 3.8, 3.0);
      addBox(g, M.steelGalv, .45, 11.2, .45, 32.0, 5.6, 12.2);
      parent.add(g);
    }

    function addSemiTrailerTruck(sec, parent, x, y, z, yaw, containerMat = M.craneRed) {
      const g = new Group();
      g.position.set(x, y, z);
      g.rotation.y = yaw;
      // Cab-over semi-tractor (front at +Z)
      addBox(g, M.craneWhite, 2.48, 2.35, 2.45, 0, 1.88, 6.25);
      addBox(g, smokedPane, 2.24, .92, .10, 0, 2.35, 7.49); // Windshield
      addBox(g, M.steelDark, 2.15, .62, .10, 0, 1.38, 7.49); // Radiator grille
      addBox(g, M.steelGalv, 2.52, .34, .28, 0, .62, 7.52);  // Front steel bumper
      for (const sx of [-.92, .92]) {
        addBox(g, M.glassWarm, .36, .18, .08, sx, .92, 7.52);
        addBox(g, M.steelDark, .12, .52, .12, sx * 1.48, 2.25, 7.15); // Side mirrors
      }
      addCyl(g, M.steelGalv, .09, 2.6, 1.24, 2.2, 4.95); // Vertical exhaust stack
      // Flatbed steel semi-trailer chassis + 40ft container load
      addBox(g, M.steelDark, 2.44, .32, 12.4, 0, 1.12, -.95);
      addBox(g, containerMat, 2.44, 2.58, 12.0, 0, 2.58, -1.05);
      addBox(g, M.hazard, 2.46, .20, .08, 0, 1.08, -7.16); // Rear safety bumper
      for (const wz of [6.4, 3.8, -4.6, -5.9]) {
        for (const sx of [-1.14, 1.14]) {
          addCyl(g, M.steelDark, .52, .36, sx, .52, wz, 0, Math.PI / 2);
          addCyl(g, M.steelGalv, .24, .39, sx, .52, wz, 0, Math.PI / 2);
        }
      }
      g.matrixAutoUpdate = false; g.updateMatrix();
      parent.add(g);
      if (sec) {
        const c = Math.cos(yaw), s = Math.sin(yaw);
        const minX = Math.min(x - 1.4 * Math.abs(c) - 7.6 * Math.abs(s), x - 1.4);
        const maxX = Math.max(x + 1.4 * Math.abs(c) + 7.6 * Math.abs(s), x + 1.4);
        const minZ = Math.min(z - 7.6 * Math.abs(c) - 1.4 * Math.abs(s), z - 1.4);
        const maxZ = Math.max(z + 7.6 * Math.abs(c) + 1.4 * Math.abs(s), z + 1.4);
        sec.colliderSpecs.push({ min: new Vector3(minX, y, minZ), max: new Vector3(maxX, y + 3.9, maxZ), surface: 'metal' });
      }
    }

    // =========================================================================
    // HIGH-DENSITY MARITIME-INDUSTRIAL FILL BUILDERS (ZERO EMPTY CONCRETE SLABS!)
    // =========================================================================
    function addMooredContainerShip(parent, x, z) {
      const g = new Group();
      g.position.set(x, 0, z);
      // 112m Panamax Hull docked along East Quay under STS cranes (Reference Photo 2)
      addBox(g, M.cargoNavy, 22.0, 9.2, 92.0, 0, 2.2, 0);
      addBox(g, M.craneRed, 22.2, 2.6, 93.0, 0, -1.8, 0); // Boot-topping waterline band
      addBox(g, M.steelDark, 21.4, .45, 91.0, 0, 6.95, 0); // Main weather deck
      // Tapered Bow & Stern Forecastles
      addBox(g, M.cargoNavy, 16.5, 9.4, 12.0, 0, 2.4, -50.5);
      addBox(g, M.cargoNavy, 10.5, 9.6, 8.5, 0, 2.6, -59.5);
      addBox(g, M.craneWhite, 16.8, 1.3, 12.2, 0, 7.6, -50.5);
      addBox(g, M.cargoNavy, 19.5, 8.8, 10.0, 0, 2.0, 49.5);
      // 7-Deck White Aft Superstructure Bridge Tower + Wings + Funnel
      addBox(g, M.craneWhite, 18.6, 15.5, 11.5, 0, 14.5, 34.0);
      addBox(g, M.craneWhite, 25.4, 2.8, 4.2, 0, 22.8, 32.8); // Bridge wings
      addBox(g, smokedPane, 23.6, 1.35, .18, 0, 23.0, 30.65); // Bridge wrap windows
      addBox(g, M.craneRed, 4.2, 6.2, 5.4, 0, 24.5, 38.6); // Funnel casing
      addBox(g, M.steelDark, 4.4, 1.4, 5.6, 0, 28.0, 38.6); // Funnel exhaust cap
      addCyl(g, M.steelGalv, .28, 7.5, 0, 27.6, 33.2); // Radar mast
      addBox(g, M.steelGalv, 5.2, .22, .32, 0, 29.8, 33.2);
      // Dense 3-Tier Multi-Color Container Deck Cargo Bays (5 bays x 4 rows x 3 tiers)
      const deckMats = [M.craneRed, M.cargoTeal, M.cargoNavy, M.safetyOrange, M.craneWhite, M.cargoRust];
      for (let bay = 0; bay < 5; bay++) {
        const bz = -36 + bay * 14.2;
        for (let row = 0; row < 4; row++) {
          const bx = -7.2 + row * 4.8;
          const tiers = (bay + row) % 3 === 0 ? 2 : 3;
          for (let t = 0; t < tiers; t++) {
            const mat = deckMats[(bay * 5 + row * 3 + t * 2) % deckMats.length];
            addBox(g, mat, 4.35, 2.55, 12.2, bx, 8.35 + t * 2.62, bz);
          }
        }
      }
      g.matrixAutoUpdate = false; g.updateMatrix();
      parent.add(g);
    }

    function addContainerYardBlock(sec, parent, x0, z0, cols, rows, yaw = 0, reeferBias = false) {
      const palette = reeferBias
        ? ['white', 'white', 'teal', 'blue', 'grey', 'white']
        : ['red', 'teal', 'blue', 'orange', 'green', 'white', 'grey'];
      const c = Math.cos(yaw), s = Math.sin(yaw);
      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows; row++) {
          const lx = col * 13.4;
          const lz = row * 3.05;
          const wx = x0 + lx * c + lz * s;
          const wz = z0 - lx * s + lz * c;
          const idx = (col * 7 + row * 3) % palette.length;
          const color = palette[idx];
          placePortProp(sec, parent, 'container40', wx, .16, wz, yaw, { color, reefer: reeferBias && color === 'white' });
          if ((col + row) % 2 === 0) {
            const col2 = palette[(idx + 2) % palette.length];
            placePortProp(sec, parent, 'container40', wx, 2.76, wz, yaw, { color: col2, reefer: reeferBias && col2 === 'white' }, false);
            if ((col * 3 + row) % 4 === 0) {
              placePortProp(sec, parent, 'container20', wx, 5.36, wz, yaw, { color: palette[(idx + 4) % palette.length] }, false);
            }
          }
        }
      }
    }

    function addSubstationYard(sec, parent, x, z) {
      const g = new Group();
      g.position.set(x, .16, z);
      addBox(g, M.concreteDirty, 18.0, .28, 12.0, 0, .14, 0);
      // 3 High-Voltage Step-Up Transformers with radiator fins & ceramic bushings
      for (const tx of [-5.2, 0, 5.2]) {
        addBox(g, M.steelWorn, 3.0, 2.8, 2.4, tx, 1.65, -2.0);
        addBox(g, M.steelDark, 3.25, 2.2, .32, tx, 1.65, -.65);
        addBox(g, M.steelDark, 3.25, 2.2, .32, tx, 1.65, -3.35);
        for (const bx of [-.8, 0, .8]) {
          addCyl(g, M.craneWhite, .14, 1.35, tx + bx, 3.65, -2.0);
          addCyl(g, M.steelGalv, .22, .12, tx + bx, 3.55, -2.0);
        }
      }
      // Steel Busbar H-Frames & Perimeter Hazard Fence Posts
      for (const px of [-7.8, 0, 7.8]) {
        addBox(g, M.steelGalv, .26, 6.4, .26, px, 3.2, 2.6);
        addBox(g, M.steelGalv, .26, 6.4, .26, px, 3.2, -4.6);
      }
      addBox(g, M.steelGalv, 16.2, .22, .22, 0, 6.1, 2.6);
      addBox(g, M.steelGalv, 16.2, .22, .22, 0, 6.1, -4.6);
      for (const bx of [-5.2, 0, 5.2]) addBox(g, M.steelDark, .10, .10, 7.4, bx, 6.2, -1.0);
      addBox(g, M.hazard, 18.2, .32, .18, 0, .45, 5.9);
      g.matrixAutoUpdate = false; g.updateMatrix();
      parent.add(g);
      if (sec) {
        sec.colliderSpecs.push({ min: new Vector3(x - 9.0, .16, z - 6.0), max: new Vector3(x + 9.0, 5.5, z + 6.0), surface: 'metal' });
      }
    }

    function addBulkSiloBank(sec, parent, x, z, count = 4) {
      const g = new Group();
      g.position.set(x, .16, z);
      addBox(g, M.concrete, count * 5.8 + 2.4, .45, 7.2, 0, .22, 0);
      const startX = -((count - 1) * 5.6) / 2;
      for (let i = 0; i < count; i++) {
        const sx = startX + i * 5.6;
        addCyl(g, M.craneWhite, 2.35, 11.2, sx, 6.0, 0);
        addCyl(g, M.steelGalv, 2.48, .35, sx, 9.6, 0);
        addCyl(g, M.steelDark, 2.48, .35, sx, 2.4, 0);
        addCyl(g, M.steelGalv, 1.55, 1.4, sx, 12.2, 0);
      }
      // Overhead catwalk & yellow safety rails linking all silos
      addBox(g, M.steelDark, count * 5.6 + 1.2, .18, 1.4, 0, 12.9, 0);
      for (const rz of [-.68, .68]) addBox(g, M.yellowPaint, count * 5.6 + 1.2, .08, .08, 0, 13.85, rz);
      g.matrixAutoUpdate = false; g.updateMatrix();
      parent.add(g);
      if (sec) {
        sec.colliderSpecs.push({ min: new Vector3(x - count * 2.9, .16, z - 3.4), max: new Vector3(x + count * 2.9, 13.0, z + 3.4), surface: 'metal' });
      }
    }

    // Close-up Poly Haven CC0 PBR Industrial Assets at Berth 4 West Gate & North Entrance (well clear of Coastal Blvd lanes!)
    placeExternal(horizonRoot, 'concrete_road_barrier', -37.2, .16, -26.5, 0, 1.0);
    placeExternal(horizonRoot, 'concrete_road_barrier', -14.8, .16, -26.5, 0, 1.0);
    placeExternal(horizonRoot, 'portable_generator', -36.5, .16, -23.0, .35, 1.0);
    placeExternal(horizonRoot, 'utility_box_01', -15.5, .16, -25.0, Math.PI, 1.0);
    placeExternal(horizonRoot, 'modular_industrial_pipes_01', -103.5, .16, -8.0, Math.PI / 2, 1.0);
    placeExternal(horizonRoot, 'modular_electricity_poles', -105.0, .16, 12.0, 0, 1.0);
    placeExternal(horizonRoot, 'exterior_aircon_unit', -35.0, 1.6, -20.0, Math.PI / 2, 1.0);

    // =========================================================================
    // TIER 0 (ALWAYS VISIBLE): ZERO-OVERLAP GROUND TILES (y=0.16) + ELEVATED ROADS (y=0.205) + REAL RECESSED DRYDOCK
    // STRICTLY x <= +26! ZERO COPLANAR OVERLAPS = ZERO Z-FIGHTING / ZERO FLICKER!
    // =========================================================================
    solidHorizon(M.concreteDirty, -226, -.50, -226, 25, .16, -30.2, 'concrete', true);
    solidHorizon(M.concreteDirty, -226, -.50, -30.15, -107.2, .16, 28.15, 'concrete', true);
    solidHorizon(M.concreteDirty, -226, -.50, 28.2, -6.2, .16, 148, 'concrete', true);
    solidHorizon(M.concreteDirty, -6.15, -.50, 28.2, 25, .16, 80.5, 'concrete', true);
    solidHorizon(M.concreteDirty, -6.15, -.50, 103.5, 25, .16, 148, 'concrete', true);
    solidHorizon(M.concrete, 23.6, -2.5, -145, 25.4, 1.05, -30.2, 'concrete', true);
    solidHorizon(M.concrete, 23.6, -2.5, 28.2, 25.4, 1.05, 80.5, 'concrete', true);
    solidHorizon(M.concrete, 23.6, -2.5, 103.5, 25.4, 1.05, 148, 'concrete', true);
    solidHorizon(M.asphalt, -33, .165, -145, -19, .205, -30.2, 'concrete', false);
    solidHorizon(M.asphalt, -33, .165, 28.2, -19, .205, 145, 'concrete', false);
    solidHorizon(M.asphalt, -119, .165, -145, -105, .205, 135, 'concrete', false);
    solidHorizon(M.asphalt, -104.9, .165, -132, -33.1, .205, -118, 'concrete', false);
    solidHorizon(M.asphalt, -18.9, .165, -132, 22, .205, -118, 'concrete', false);
    solidHorizon(M.asphalt, -168, .165, 35, -150.5, .205, 49, 'concrete', false);
    solidHorizon(M.asphalt, -123.5, .165, 35, -119.1, .205, 49, 'concrete', false);
    solidHorizon(M.asphalt, -104.9, .165, 35, -33.1, .205, 49, 'concrete', false);
    solidHorizon(M.asphalt, -18.9, .165, 35, 20, .205, 49, 'concrete', false);
    solidHorizon(M.asphalt, -206, .165, 116, -159.6, .205, 128, 'concrete', false);
    solidHorizon(M.asphalt, -104.9, .165, 116, -33.1, .205, 128, 'concrete', false);
    for (let z = -138; z <= 128; z += 8) addBox(horizonRoot, M.yellowPaint, .18, .012, 3.6, -112, .222, z);
    for (let z = -126; z <= 120; z += 30) addStreetLamp(horizonRoot, -104.2, .205, z, -1);
    for (let x = -100; x <= -38; x += 8) addBox(horizonRoot, M.yellowPaint, 3.6, .012, .18, x, .222, -125);
    for (let x = -14; x <= 14; x += 8) addBox(horizonRoot, M.yellowPaint, 3.6, .012, .18, x, .222, -125);
    for (let x = -100; x <= -38; x += 8) addBox(horizonRoot, M.yellowPaint, 3.6, .012, .18, x, .222, 42);
    for (let x = -100; x <= -38; x += 8) addBox(horizonRoot, M.yellowPaint, 3.6, .012, .18, x, .222, 122);

    // CONTINUOUS WESTERN FORESTED CLIFF ESCARPMENT (WorldEngine Stratified Vertex-Color Cliff + Wind-Swaying Instanced Pine Forest)
    {
      const zMin = -128, zMax = 144;
      if (terrainGen) {
        terrainGen.buildStratifiedCliff(horizonRoot, { crestX: -224.0, zMin, zMax, zSteps: 56, layers: 6 });
      }
      addBox(horizonRoot, M.coastalGrass, 16.0, .4, zMax - zMin + 4, -232.0, 12.6, (zMin + zMax) / 2);
      const pinePositions = [];
      for (let pz = -124; pz <= 140; pz += 8.5) {
        const py = (pz < -28 ? 14.0 : (pz < 46 ? 12.4 : 10.6)) + Math.sin(pz * .09) * .8;
        pinePositions.push([-225.5 + (Math.sin(pz * 1.3) * 1.6), py, pz, 1.15 + Math.abs(Math.sin(pz * .7)) * .45]);
        pinePositions.push([-231.5 + (Math.cos(pz * .9) * 2.0), py + .4, pz + 4.2, 1.3 + Math.abs(Math.cos(pz * .5)) * .35]);
      }
      if (terrainGen) {
        terrainGen.buildWindPineForest(horizonRoot, crown, cylGeo, M.wood, pinePositions, updaters);
      }
    }

    // LIVE PATROLLING PORT LOGISTICS TRUCKS (2 articulated semi-trucks continuously driving Coastal Blvd!)
    {
      const makeLiveTruck = (laneX, startZ, dir, contMat) => {
        const tg = new Group();
        tg.position.set(laneX, .21, startZ);
        tg.rotation.y = dir > 0 ? 0 : Math.PI;
        addBox(tg, M.craneWhite, 2.46, 2.3, 2.4, 0, 1.86, 6.2);
        addBox(tg, smokedPane, 2.2, .9, .10, 0, 2.34, 7.42);
        addBox(tg, M.glassWarm, .36, .18, .08, -.9, .92, 7.45);
        addBox(tg, M.glassWarm, .36, .18, .08, .9, .92, 7.45);
        addBox(tg, M.steelDark, 2.42, .32, 12.2, 0, 1.12, -.95);
        addBox(tg, contMat, 2.42, 2.55, 11.8, 0, 2.55, -1.05);
        for (const wz of [6.3, 3.8, -4.6, -5.9]) {
          for (const sx of [-1.14, 1.14]) addCyl(tg, M.steelDark, .50, .34, sx, .50, wz, 0, Math.PI / 2);
        }
        horizonRoot.add(tg);
        updaters.push(dt => {
          tg.position.z += dir * dt * 8.2;
          if (dir > 0 && tg.position.z > 134) tg.position.z = -134;
          else if (dir < 0 && tg.position.z < -134) tg.position.z = 134;
        });
      };
      makeLiveTruck(-22.6, -90, -1, M.cargoTeal);
      makeLiveTruck(-29.4, 58, 1, M.craneRed);
    }

    // 6 Readable Overhead Highway Gantry Signs at the REAL Inland Intersections!
    addHighwayGantry(-26, -31.5, 0, '↑ 沿海城区 · 滨海长廊  ↖ 海岸机场', 'COASTAL CITY / PROMENADE / AIRFIELD', 16, '#153b2f');
    addHighwayGantry(-108.5, 5, Math.PI / 2, '← 西区铁路货场 · 山地卫星站 · 西南医院', 'WEST RAIL / MOUNTAIN +14M / CLINIC', 14, '#47311a');
    addHighwayGantry(-26, 30.5, 0, '↓ 南港旧船坞 · 防潮闸 · 22m 岸角灯塔', 'SOUTH DRYDOCK / TIDE GATE / LIGHTHOUSE', 15.5, '#16384d');
    addHighwayGantry(-112, -36, 0, '↑ 山地卫星站 (+14m) · 海岸应急机场', 'MOUNTAIN COMMS +14M / AIRFIELD', 14, '#1b402c');
    addHighwayGantry(-112, 34, 0, '↓ 西南冷雾库 · 战地分诊中心 · 停机坪', 'SW COLD STORAGE / FIELD CLINIC', 14, '#1a3f4a');
    addHighwayGantry(-104, -125, Math.PI / 2, '← 海岸应急机场 · 110m 跑道与拱形机库', 'COASTAL AIRFIELD & HANGAR', 14, '#24314f');

    // Interactive Berth 4 Armory Locker & 《失联名单》 Evidence Console right at West Dispatch!
    addInteractiveTerminal(horizonRoot, {
      id: 'berth-armory', promptZh: '按 [E] 港区军械箱补满弹药与副武器', x: -34, y: 0, z: -22, colorMat: M.glassWarm,
      onUse() {
        (world.weapon?.refill || world.weapon?.reset)?.call(world.weapon);
        audio?.play?.('rail_touchdown', { pos: new Vector3(-34, 1, -22), ref: 14, gain: .45, jitter: .05 });
        world.tactical?.notify?.('🔫 已在港区军械箱补满全部弹药！', '🔫 Ammunition refilled!', false, 2.8);
      },
    });
    addInteractiveTerminal(horizonRoot, {
      id: 'berth-evidence', promptZh: '按 [E] 核验《失联名单》05:31 撤离回执（老霍克）', x: -85, y: 0, z: -11, colorMat: M.glassCyan,
      onUse() {
        world.hud?.radio?.('玛拉：「核对成功——老霍克在 05:34 还签了值班交接条，但里德的封港系统却篡改他 05:31 已撤离，且沃德在 05:50 召回了搜救艇！」', 7.5);
        world.tactical?.notify?.('📁 证物链锁定：老霍克 05:31/05:34 时间矛盾 + 沃德 05:50 召回记录', '📁 Evidence verified: Old Hawke 05:31/05:34 & Ward 05:50 recall', false, 5.5);
      },
    });

    // Armored Multi-HP Tactical Objective Builder
    function spawnShootTarget(parent, { id, stage, labelZh, pos, radius = 1.45, tall = true, maxHp = 3 }) {
      const g = new Group();
      g.position.copy(pos);
      const rotor = new Group();
      if (tall) {
        addBox(g, M.concrete, 1.35, .42, 1.35, 0, .21, 0);
        addBox(g, M.steelDark, .82, 2.8, .82, 0, 1.6, 0);
        addBox(g, M.hazard, .96, .34, .96, 0, .65, 0);
        for (const [ax, az] of [[-.52, 0], [.52, 0], [0, -.52], [0, .52]]) addBox(g, M.steelGalv, .14, 2.2, .14, ax, 1.75, az);
        rotor.position.y = 3.25;
        const core = new Mesh(sphGeo, M.redCore); core.scale.set(.52, .52, .52);
        const fin1 = new Mesh(boxGeo, M.steelGalv); fin1.scale.set(1.5, .10, .18);
        const fin2 = new Mesh(boxGeo, M.steelGalv); fin2.scale.set(.18, .10, 1.5);
        rotor.add(core, fin1, fin2);
        g.add(rotor);
      } else {
        addBox(g, M.concrete, 1.3, .3, 1.3, 0, .15, 0);
        addBox(g, M.steelWorn, 1.05, 1.4, 1.05, 0, .85, 0);
        addBox(g, M.hazard, 1.12, .25, 1.12, 0, .42, 0);
        rotor.position.y = 1.85;
        const core = new Mesh(cylGeo, M.redCore); core.scale.set(.42, 1.1, .42);
        const cap = new Mesh(boxGeo, M.steelDark); cap.scale.set(.9, .14, .24); cap.position.y = .62;
        rotor.add(core, cap);
        g.add(rotor);
      }
      parent.add(g);
      updaters.push(dt => { if (g.visible) rotor.rotation.y += dt * 2.6; });
      shootTargets.push({
        id, stage, labelZh, group: g, rotor,
        pos: pos.clone().add(new Vector3(0, tall ? 2.5 : 1.4, 0)),
        radius, maxHp, hp: maxHp, alive: true,
      });
    }

    const jammerRoot = new Group();
    jammerRoot.name = 'anvil-jammer-towers';
    root.add(jammerRoot);
    spawnShootTarget(jammerRoot, { id: 'jammer-yard', stage: 0, labelZh: '货场防空干扰塔', pos: new Vector3(-4, 0, -8), tall: true, maxHp: 3 });
    spawnShootTarget(jammerRoot, { id: 'jammer-quay', stage: 0, labelZh: '码头防空干扰塔', pos: new Vector3(17.5, 0, 10.5), tall: true, maxHp: 3 });

    // =========================================================================
    // SECTOR 1 (NORTH): COASTAL CITY DOWNTOWN & EAST SEAFRONT PROMENADE (x: -107..+24, z: -145..-30)
    // =========================================================================
    const city = makeSector('city', '沿海城区与滨海长廊', 'Coastal City & Seafront', [-42, 0, -86], 155);
    // Cross-street asphalt cleanly clipped outside V1 Coastal Blvd (ZERO overlap!)
    addBox(city.shell, M.asphalt, 71.8, .05, 14, -69, .185, -84);
    addBox(city.shell, M.asphalt, 38.8, .05, 14, .5, .185, -84);
    for (let z = -34; z >= -140; z -= 6.5) addBox(city.detail, M.yellowPaint, .18, .015, 3.2, -26, .24, z);
    for (let x = -100; x <= 18; x += 6.5) {
      if (Math.abs(x + 26) < 9) continue;
      addBox(city.detail, M.yellowPaint, 3.2, .015, .18, x, .24, -84);
    }
    for (let i = -3; i <= 3; i++) {
      addBox(city.detail, M.whitePaint, .7, .015, 3.2, -26 + i * 1.6, .24, -74);
      addBox(city.detail, M.whitePaint, .7, .015, 3.2, -26 + i * 1.6, .24, -94);
    }
    // Downtown Traffic Signal Gantries & Seafront Promenade Balustrade + Benches
    for (const [tx, tz] of [[-35.5, -75.5], [-16.5, -92.5]]) {
      addCyl(city.detail, M.steelDark, .16, 6.8, tx, 3.4, tz);
      addBox(city.detail, M.steelDark, 6.4, .18, .18, tx + (tx < -26 ? 3.2 : -3.2), 6.5, tz);
      addBox(city.detail, M.steelDark, .45, 1.15, .36, tx + (tx < -26 ? 4.8 : -4.8), 6.1, tz);
      addBox(city.detail, M.greenSignal, .24, .24, .40, tx + (tx < -26 ? 4.8 : -4.8), 5.8, tz);
      addBox(city.detail, M.redCore, .24, .24, .40, tx + (tx < -26 ? 4.8 : -4.8), 6.4, tz);
    }
    for (let pz = -138; pz <= -36; pz += 12) {
      addBox(city.detail, M.wood, .7, .48, 2.4, 21.6, .24, pz); // Seafront benches
      addBox(city.detail, M.steelGalv, .10, 1.05, 11.8, 23.4, 1.45, pz); // Seawall safety rail
    }
    // Smashable Anvil Highway Roadblock at Downtown Intersection (-26, 0, -76)
    for (let i = -2; i <= 2; i++) {
      const b = new Mesh(boxGeo, i % 2 === 0 ? M.hazard : M.steelWorn);
      b.scale.set(2.1, 1.15, .55);
      b.position.set(-26 + i * 2.2, .62, -76);
      city.shell.add(b);
      roadblockProps.push({ mesh: b, intact: true });
    }
    // Showcase Coastal City District featuring ALL 6 distinct architectural archetypes (ZERO copy-pasted boxes!)
    const blocks = [
      { x0: -98, z0: -72, x1: -66, z1: -38, mat: M.brickWeathered, h: 11.5, style: 'commercial_arcade', seed: 101, labelZh: '海事货运商业骑楼', labelEn: 'MARITIME COMMERCIAL ARCADE' },
      { x0: -62, z0: -72, x1: -37, z1: -38, mat: M.concrete, h: 8.2, facility: true },
      { x0: -15, z0: -72, x1: 16, z1: -38, mat: M.plasterGrey, h: 9.2, enterable: true },
      { x0: -98, z0: -115, x1: -68, z1: -93, mat: M.concreteDirty, h: 18.2, style: 'modern_office', seed: 202, labelZh: '盐线港务大厦', labelEn: 'SALTLINE PORT TOWER' },
      { x0: -64, z0: -115, x1: -37, z1: -93, mat: M.brickWeathered, h: 13.0, style: 'harbor_apartment', seed: 303, labelZh: '滨海船员公寓', labelEn: 'SEAFARER COURTYARD APTS' },
      { x0: -15, z0: -115, x1: 16, z1: -93, mat: M.concrete, h: 15.2, style: 'civic_customs', seed: 404, labelZh: '东海海关清关署', labelEn: 'EAST SEA CUSTOMS HALL' },
      { x0: -96, z0: -143, x1: -40, z1: -134, mat: M.brickWeathered, h: 9.4, style: 'industrial_hall', seed: 505, labelZh: '北港锯齿机电工坊', labelEn: 'NORTH PORT SAWTOOTH WORKS' },
      { x0: -15, z0: -143, x1: 16, z1: -134, mat: M.concreteDirty, h: 8.8, style: 'coastal_residence', seed: 606, labelZh: '东海海岸排屋民居', labelEn: 'COASTAL TERRACE RESIDENCE' },
    ];
    for (const blk of blocks) {
      solid(city, city.shell, M.concreteDirty, blk.x0 - 2.0, -.04, blk.z0 - 2.0, blk.x1 + 2.0, .16, blk.z1 + 2.0, 'concrete', true);
      if (blk.facility) {
        addIndustrialFacility(city, city.shell, {
          x0: blk.x0 + 1.5, z0: blk.z0 + 2.5, x1: blk.x1 - 1.5, z1: blk.z1 - 2.5,
          h: 8.0, wallMat: M.steelClad, roofMat: M.corrugated,
          title: 'COASTAL CUSTOMS FREIGHT HALL', doorSide: 'east', signBg: '#1c3240', interiorKind: 'warehouse',
        });
        placePortProp(city, city.detail, 'guard_booth', blk.x1 + .6, .16, blk.z1 - 4.2, -Math.PI / 2);
        placePortProp(city, city.detail, 'jersey_barrier', blk.x1 + 1.4, .16, blk.z0 + 5.5, Math.PI / 2);
        placePortProp(city, city.detail, 'dumpster', blk.x0 - 1.8, .16, blk.z0 + 6.5, 0);
      } else if (blk.enterable) {
        const bx0 = blk.x0 + 1.5, bx1 = blk.x1 - 1.5, bz0 = blk.z0 + 1.5, bz1 = blk.z1 - 1.5;
        solid(city, city.shell, blk.mat, bx0, .16, bz0, bx1, blk.h, bz0 + .5, 'concrete', true);
        solid(city, city.shell, blk.mat, bx1 - .5, .16, bz0, bx1, blk.h, bz1, 'concrete', true);
        solid(city, city.shell, blk.mat, bx0, .16, bz1 - .5, bx1, blk.h, bz1, 'concrete', true);
        const entZ = (bz0 + bz1) / 2;
        const windowBays = [bz0 + 5.2, bz0 + 10.2, bz1 - 10.2, bz1 - 5.2];
        for (const [low, high, glazed] of [[.16, 1.18, false], [1.18, 3.02, true],
          [3.02, 3.6, false], [3.6, 4.98, false], [4.98, 6.82, true], [6.82, blk.h, false]]) {
          const gaps = glazed ? windowBays.map(z => [z - 1.4, z + 1.4]) : [];
          if (low < 3.6) gaps.push([entZ - 2, entZ + 2]);
          let start = bz0;
          for (const [end, next] of [...gaps.sort((a, b) => a[0] - b[0]), [bz1, bz1]]) {
            if (end > start) solid(city, city.shell, blk.mat, bx0, low, start, bx0 + .5, high, end, 'concrete', true);
            start = next;
          }
        }
        solid(city, city.shell, M.concrete, bx0, 3.8, bz0, bx1, 4.1, bz1, 'concrete', true);
        solid(city, city.shell, M.steelDark, bx0 - .45, blk.h, bz0 - .45, bx1 + .45, blk.h + .44, bz1 + .45, 'metal', true);
        for (const px of [bx0 - .05, bx1 + .05]) {
          for (const pz of [bz0 - .05, bz1 + .05]) addBox(city.detail, M.concreteDirty, .68, blk.h + .6, .68, px, blk.h / 2 + .2, pz);
        }
        addBox(city.detail, M.concreteDirty, (bx1 - bx0) + .6, .28, (bz1 - bz0) + .6, (bx0 + bx1) / 2, 3.92, (bz0 + bz1) / 2);
        for (const rz of [bz0 - .15, bz1 + .15]) addBox(city.detail, blk.mat, (bx1 - bx0) + .4, .85, .32, (bx0 + bx1) / 2, blk.h + .82, rz);
        for (const rx of [bx0 - .15, bx1 + .15]) addBox(city.detail, blk.mat, .32, .85, (bz1 - bz0) + .4, rx, blk.h + .82, (bz0 + bz1) / 2);
        addBox(city.detail, M.steelGalv, 3.6, 1.45, 2.4, bx1 - 5.5, blk.h + 1.15, bz0 + 6.5);
        addCyl(city.detail, M.steelGalv, .12, 5.4, bx0 + 4.5, blk.h + 3.1, bz1 - 5.5);
        addBox(city.detail, M.redCore, .30, .34, .30, bx0 + 4.5, blk.h + 5.9, bz1 - 5.5);
        const precinctSign = addBox(city.detail, makeSignMat('COASTAL PRECINCT 04', 'HARBOR DISPATCH HQ', '#182f42'), 4.8, .92, .12, bx0 - 2.65, 4.42, entZ);
        precinctSign.rotation.y = Math.PI / 2; precinctSign.updateMatrix();
        addBox(city.shell, M.concrete, 2.4, .22, 6.2, bx0 - 1.2, .11, entZ);
        addBox(city.shell, M.steelDark, 2.8, .22, 6.2, bx0 - 1.4, 3.85, entZ);
        for (const sz of [entZ - 2.4, entZ + 2.4]) {
          addBox(city.detail, M.steelGalv, .14, 3.8, .14, bx0 - 2.6, 1.9, sz);
          addBox(city.detail, M.concreteDirty, .42, 3.6, .42, bx0 + .05, 1.96, sz);
        }
        for (const wy of [2.1, 5.9]) {
          for (const wz of windowBays) {
            for (const side of [-1, 1]) addBox(city.detail, M.steelDark, .20, 1.84, .08, bx0 + .26, wy, wz + side * 1.36);
            solid(city, city.detail, M.glass, bx0 + .28, wy - .92, wz - 1.36, bx0 + .31, wy + .92, wz + 1.36, 'glass', true);
            addBox(city.detail, M.steelDark, .10, 1.84, .055, bx0 + .23, wy, wz);
            addBox(city.detail, M.concrete, .48, .18, 3.05, bx0 - .14, wy - 1.02, wz);
            addBox(city.detail, M.steelWorn, .44, .12, 3.00, bx0 - .12, wy + 1.00, wz);
          }
        }
        for (const czPipe of [bz0 + .4, bz1 - .4]) addCyl(city.detail, M.steelGalv, .09, blk.h - .4, bx0 - .16, blk.h / 2, czPipe);
        for (const czCol of [bz0 + 6.5, bz1 - 6.5]) addBox(city.detail, M.concreteDirty, .65, 3.8, .65, bx0 + 5.2, 2.0, czCol);
        addBox(city.detail, M.steelWorn, 2.0, 1.1, 5.5, bx0 + 6.5, .75, entZ);
        addBox(city.detail, M.glassCyan, .35, .5, 2.4, bx0 + 6.5, 1.52, entZ);
        placePortProp(city, city.detail, 'shelf_rack', bx1 - 3.2, .16, bz0 + 4.5, Math.PI / 2);
        placePortProp(city, city.detail, 'shelf_rack', bx1 - 3.2, .16, bz1 - 4.5, Math.PI / 2);
        placePortProp(city, city.detail, 'crate_wood', bx0 + 9.5, .16, bz0 + 4.2, .15);
        placePortProp(city, city.detail, 'toolbox_cart', bx0 + 8.5, .16, bz1 - 4.8, -.2);
        placePortProp(city, city.detail, 'floodlight_stand', bx0 + 3.6, .16, bz0 + 3.6, .6);
        placePortProp(city, city.detail, 'guard_booth', bx0 - 2.6, .16, bz1 - 3.2, Math.PI / 2);
        placePortProp(city, city.detail, 'jersey_barrier', bx0 - 2.2, .16, bz0 + 3.5, Math.PI / 2);
        placePortProp(city, city.detail, 'sign_post', bx0 - 2.5, .16, entZ + 4.2, -Math.PI / 2, { sign: 'berth4' });
        addInteractiveDoor(city.shell, { id: 'city-precinct-door', labelZh: '沿海警务调度楼防爆门', x: bx0 + .2, y: .16, z: (bz0 + bz1) / 2, width: 3.9, height: 3.4, axis: 'z', initiallyOpen: false });
        addInteractiveTerminal(city.shell, {
          id: 'city-garage-call', promptZh: '按 [E] 城区警务车库召唤 SAR 四驱车', x: -16.5, y: .16, z: -56, colorMat: M.glassWarm,
          onUse() {
            world.vehicle?.setPosition?.(new Vector3(-22, .15, -56));
            audio?.play?.('rail_touchdown', { pos: new Vector3(-22, 1, -56), ref: 18, gain: .5, jitter: .05 });
            world.tactical?.notify?.('🚙 SAR 战术四驱车已调度至沿海大道旁！按 [F] 登车', '🚙 SAR 4x4 dispatched to Coastal Blvd! Press [F]', false, 3.2);
          },
        });
      } else {
        const bw = (blk.x1 - blk.x0) - 3.6, bd = (blk.z1 - blk.z0) - 3.6;
        const cx = (blk.x0 + blk.x1) / 2, cz = (blk.z0 + blk.z1) / 2;
        if (buildingGen) {
          buildingGen.buildCoastalBuilding(horizonRoot, {
            cx, cz, width: bw, depth: bd, height: blk.h,
            seed: blk.seed || 101, styleName: blk.style, labelZh: blk.labelZh, labelEn: blk.labelEn,
          });
        } else {
          buildStreetBlock(blk, cx, cz, bw, bd);
          addBox(horizonRoot, M.steelDark, bw + .8, .55, bd + .8, cx, blk.h + .26, cz);
        }
        city.colliderSpecs.push({
          min: new Vector3(blk.x0 + 1.8, .16, blk.z0 + 1.8),
          max: new Vector3(blk.x1 - 1.8, blk.h + .5, blk.z1 - 1.8),
          surface: 'concrete',
        });
      }
    }
    // Seafront Promenade Streetlamps & Pines along x = +21 facing the open East Sea!
    for (const z of [-44, -66, -92, -114]) {
      addStreetLamp(city.detail, -36.5, .16, z, 1);
      addStreetLamp(city.detail, -15.5, .16, z, -1);
      addStreetLamp(city.detail, 22.0, .16, z, -1);
      addPineTree(city.detail, 19.2, .16, z + 8, .85);
    }
    // Park sedans strictly off Coastal Blvd in side aprons so all traffic lanes (x: -33..-19) stay 100% unobstructed
    addParkedSedan(city.detail, -38.4, .18, -52, 0, M.sedanDark);
    addParkedSedan(city.detail, 17.5, .18, -64, Math.PI, M.sedanGrey);
    addParkedSedan(city.detail, -38.4, .18, -106, 0, M.sedanBurgundy);
    for (const mz of [-40, -58, -76, -98, -118, -136]) placePortProp(city, city.detail, 'bollard_mooring', 22.8, .16, mz, 0, {}, false);
    for (const [lx, lz] of [[-37, -42], [-15, -76], [-37, -112], [18, -56], [18, -104], [-68, -76]]) placePortProp(city, city.detail, 'light_mast', lx, .16, lz, 0);
    placePortProp(city, city.detail, 'container40', -72, .16, -75, 0, { color: 'blue', doors: .5 });
    placePortProp(city, city.detail, 'container20', -56, .16, -75, 0, { color: 'orange' });
    placePortProp(city, city.detail, 'forklift', -46, .16, -75.5, .35);
    placePortProp(city, city.detail, 'generator', -64, .16, -92.5, Math.PI / 2);
    placePortProp(city, city.detail, 'tarp_cargo', 6, .16, -75, .12);
    placePortProp(city, city.detail, 'cable_reel', 14, .16, -75.5, .4);
    // High-Density Downtown Upgrade: Elevated Glass Pedestrian Skybridge at z = -104 & Off-Lane Transit Shelter
    addBox(horizonRoot, M.steelDark, 24.5, .36, 3.6, -26, 6.2, -104);
    addBox(horizonRoot, M.steelDark, 24.5, .36, 3.6, -26, 9.2, -104);
    for (const sz of [-105.7, -102.3]) addBox(horizonRoot, smokedPane, 23.6, 2.65, .14, -26, 7.7, sz);
    for (const sx of [-37.8, -14.2]) {
      addBox(horizonRoot, M.concrete, 1.6, 6.2, 3.8, sx, 3.1, -104);
      addBox(city.detail, M.steelGalv, 2.2, .16, 4.2, sx, 6.2, -104);
    }
    addBox(city.detail, M.steelDark, 1.8, 2.6, 5.6, -15.2, 1.46, -44); // Coastal Blvd transit shelter
    addBox(city.detail, smokedPane, .10, 2.2, 5.2, -14.4, 1.56, -44);
    addBox(city.detail, M.wood, .55, .48, 3.8, -15.0, .50, -44);
    addParkedSedan(city.detail, 17.5, .18, -110, Math.PI, M.sedanDark);
    addParkedSedan(city.detail, -38.4, .18, -40, 0, M.sedanGrey);
    placeExternal(city.detail, 'utility_box_01', -16.2, .16, -61.5, -Math.PI / 2, 1.0);
    placeExternal(city.detail, 'utility_box_01', -35.8, .16, -91.5, Math.PI / 2, 1.0);
    placeExternal(city.detail, 'portable_generator', -38.5, .16, -54.0, .4, 1.0);
    placeExternal(city.detail, 'exterior_aircon_unit', -13.6, 2.2, -62.5, -Math.PI / 2, 1.0);
    placeExternal(city.detail, 'exterior_aircon_unit', -13.6, 2.2, -48.5, -Math.PI / 2, 1.0);
    placeExternal(city.detail, 'modular_electricity_poles', -36.5, .16, -122.0, 0, 1.0);
    placeExternal(city.detail, 'modular_electricity_poles', -68.0, .16, -122.0, 0, 1.0);

    // =========================================================================
    // SECTOR 2 (INLAND WEST-CENTER): MOUNTAIN RIDGE & +14m SATELLITE COMMS
    // STRICTLY INLAND (x: -220..-110, z: -120..-35) — overlooks the City & East Sea!
    // =========================================================================
    const mountain = makeSector('mountain', '西岸山地卫星通信站 (+14m)', 'Mountain Ridge Comms (+14m)', [-168, 14, -78], 165);
    // Smooth 3-Segment Steel-Girder Railway Overpass Bridge + Mountain Approach Highway
    // ZERO steps poking above asphalt, ZERO blocks on railway tracks (x = -126..-147), >1.15m clearance above 3.98m freight train!
    const summitY = 14.0, bridgeY = 5.60;
    const addRampSpan = (xStart, yStart, xEnd, yEnd, steps) => {
      const dx = xStart - xEnd, dy = yEnd - yStart;
      const len = Math.hypot(dx, dy);
      const ang = -Math.atan2(dy, dx);
      const midX = (xStart + xEnd) / 2, midY = (yStart + yEnd) / 2;
      const addTilted = (mat, w, h, d, yOff, zPos) => {
        const m = new Mesh(getWorldBoxGeo(w, h, d, 3.0), mat);
        m.position.set(midX, midY + yOff, zPos); m.rotation.z = ang;
        m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix();
        horizonRoot.add(m); return m;
      };
      addTilted(M.asphalt, len + .4, .48, 14.2, -.24, -78);
      addTilted(M.yellowPaint, len - .8, .03, .22, .03, -78);
      addTilted(M.steelWorn, len + .4, .58, .36, .28, -85.25);
      addTilted(M.steelWorn, len + .4, .58, .36, .28, -70.75);
      addTilted(M.yellowPaint, len + .3, .08, .12, .92, -85.25);
      addTilted(M.yellowPaint, len + .3, .08, .12, .92, -70.75);
      // Smooth under-deck structural concrete beam strictly BELOW asphalt (never pokes through!)
      addTilted(M.concreteDirty, len, .72, 13.6, -.82, -78);
      for (let i = 0; i < steps; i++) {
        const f0 = i / steps, f1 = (i + 1) / steps;
        const sx0 = xStart + (xEnd - xStart) * f0;
        const sx1 = xStart + (xEnd - xStart) * f1;
        const sy = yStart + dy * f1;
        mountain.colliderSpecs.push({ min: new Vector3(Math.min(sx0, sx1) - .15, sy - 1.0, -85.1), max: new Vector3(Math.max(sx0, sx1) + .15, sy, -70.9), surface: 'concrete' });
      }
    };
    // Segment 1: East Approach Ramp (x: -112 -> -124, y: 0.21 -> 5.60, 26 fine 0.21m steps)
    addRampSpan(-112, .21, -124, bridgeY, 26);
    // Segment 2: Open-Span Steel-Girder Overpass Bridge over ALL 4 Rail Tracks (x: -124 -> -150, level y = 5.60, bottom y = 5.12)
    addBox(horizonRoot, M.asphalt, 26.4, .48, 14.2, -137, bridgeY - .24, -78);
    addBox(horizonRoot, M.yellowPaint, 25.0, .03, .22, -137, bridgeY + .03, -78);
    for (const gz of [-85.25, -70.75]) {
      addBox(horizonRoot, M.steelWorn, 26.6, .85, .42, -137, bridgeY + .18, gz); // Heavy riveted side steel girder
      addBox(horizonRoot, M.steelGalv, 26.6, .14, .56, -137, bridgeY + .64, gz);
      addBox(horizonRoot, M.yellowPaint, 26.4, .09, .12, -137, bridgeY + 1.18, gz); // Bridge top safety rail
      for (let px = -149; px <= -125; px += 4.0) {
        addBox(horizonRoot, M.steelDark, .18, 1.15, .18, px, bridgeY + .62, gz);
      }
    }
    // Bridge piers placed strictly OUTSIDE the rail corridor (x = -121.8 and x = -151.6)
    for (const px of [-121.8, -151.6]) {
      addBox(horizonRoot, M.concrete, 1.8, .65, 14.6, px, bridgeY - .78, -78); // Crosshead cap beam
      for (const pz of [-84.0, -72.0]) {
        addBox(horizonRoot, M.concreteDirty, 1.6, bridgeY - .95, 1.8, px, (bridgeY - .95) / 2 + .16, pz);
        mountain.colliderSpecs.push({ min: new Vector3(px - .85, .16, pz - .95), max: new Vector3(px + .85, bridgeY - .6, pz + .95), surface: 'concrete' });
      }
    }
    mountain.colliderSpecs.push({ min: new Vector3(-150.2, bridgeY - .55, -85.1), max: new Vector3(-123.8, bridgeY, -70.9), surface: 'concrete' });
    // Segment 3: West Mountain Climb Ramp (x: -150 -> -168, y: 5.60 -> 14.0, 44 fine 0.19m steps)
    addRampSpan(-150, bridgeY, -168, summitY, 44);
    // Sloped rocky embankment piers ONLY under Segment 3 (west of x = -152, strictly below road surface)
    for (const [ex, eh] of [[-155, 6.2], [-160, 8.6], [-165, 11.0]]) {
      addBox(mountain.shell, M.concreteDirty, 4.6, eh, 13.4, ex, eh / 2 + .16, -78);
      addBox(mountain.shell, M.rock, 5.4, eh * .85, 8.5, ex, (eh * .85) / 2 + .16, -89.5);
      addBox(mountain.shell, M.rock, 5.4, eh * .85, 8.5, ex, (eh * .85) / 2 + .16, -66.5);
      addPineTree(mountain.detail, ex, eh * .85 + .16, -90.2, 1.05);
      addPineTree(mountain.detail, ex, eh * .85 + .16, -65.8, 1.0);
    }
    // Keep the surveyed summit and access road level. Along the exposed faces
    // the cliff breaks into inclined shelves, with smaller fractures between strata.
    const rockVertices = [], rockUvs = [];
    for (const [x0,z0,x1,z1,nx,nz] of [
      [-221,-119,-167,-119,0,-1],[-167,-37,-221,-37,0,1],
      [-221,-37,-221,-119,-1,0],[-167,-119,-167,-85,1,0],[-167,-71,-167,-37,1,0],
    ]) {
      const steps = Math.ceil(Math.hypot(x1-x0,z1-z0)/3);
      const sample = (i, layer) => {
        const t=i/steps, x=x0+t*(x1-x0), z=z0+t*(z1-z0);
        const noise=Math.sin(x*.63+z*.41)+.45*Math.cos(x*.27-z*.85);
        const reach=(1-layer/4)*(4.2+noise) + Math.sin(layer*Math.PI/4)*noise*.55;
        return [x+reach*nx, summitY*layer/4 + Math.sin(layer*Math.PI/4)*noise*.87, z+reach*nz];
      };
      for (let i=0;i<steps;i++) for (let j=0;j<4;j++) {
        const a=sample(i,j), b=sample(i+1,j), c=sample(i,j+1), d=sample(i+1,j+1);
        for (const v of [a,c,b,b,c,d]) {
          rockVertices.push(...v);
          rockUvs.push((nx ? v[2] : v[0])/3, v[1]/3);
        }
      }
    }
    const cliff = new THREE.BufferGeometry();
    cliff.setAttribute('position', new THREE.Float32BufferAttribute(rockVertices,3));
    cliff.setAttribute('uv', new THREE.Float32BufferAttribute(rockUvs,2));
    cliff.computeVertexNormals();
    const rockFace = M.rock.clone();
    rockFace.side = THREE.DoubleSide;
    mountain.shell.add(new Mesh(cliff,rockFace));
    addBox(mountain.shell, M.coastalGrass, 54, .25, 82, -194, summitY-.125, -78);
    mountain.colliderSpecs.push({ min: new Vector3(-221, 0, -119), max: new Vector3(-167, summitY, -37), surface: 'concrete' });
    solid(mountain, mountain.shell, M.asphalt, -214, summitY - .2, -98, -168, summitY + .06, -58, 'concrete', true);
    for (const [tx, tz, sc] of [
      [-174, -108, 1.25], [-192, -110, 1.35], [-212, -104, 1.2],
      [-214, -76, 1.3], [-210, -48, 1.2], [-184, -46, 1.15],
    ]) addPineTree(mountain.detail, tx, summitY, tz, sc);

    // Area-1-Grade Armored Mountain Comms Bunker (structural steel H-columns, recessed windows, roof parapet railings & HVAC)
    solid(mountain,mountain.shell,M.concrete,-206,summitY,-86,-205.5,summitY+7.2,-70);
    for (const edge of [-86,-70.5]) solid(mountain,mountain.shell,M.concrete,-206,summitY,edge,-190,summitY+7.2,edge+.5);
    for (const [lo,hi] of [[-86,-79.8],[-76.2,-70]]) solid(mountain,mountain.shell,M.concreteDirty,-190.5,summitY,lo,-190,summitY+7.2,hi);
    solid(mountain,mountain.shell,M.concrete,-190.5,summitY+3.2,-79.8,-190,summitY+7.2,-76.2);
    solid(mountain,mountain.shell,M.concreteDirty,-206.45,summitY+6.92,-86.45,-189.55,summitY+7.28,-69.55);
    // Corner pilasters, exterior steel H-columns, base plinth & roof parapet coping
    for (const px of [-206.05, -200.6, -195.3, -189.95]) {
      for (const pz of [-86.05, -69.95]) addBox(mountain.detail, M.steelDark, .44, 7.4, .44, px, summitY + 3.7, pz);
    }
    addBox(mountain.detail, M.concreteDirty, 16.8, .92, 16.8, -198, summitY + .46, -78);
    addBox(mountain.detail, M.steelDark, 16.9, .24, 16.9, -198, summitY + 7.36, -78);
    // Recessed armored observation windows on North & South bunker walls
    for (const wz of [-86.06, -69.94]) {
      for (const wx of [-203.2, -198.0, -192.8]) {
        addBox(mountain.detail, M.steelDark, 3.2, 1.55, .28, wx, summitY + 4.8, wz);
        addBox(mountain.detail, smokedPane, 2.86, 1.24, .32, wx, summitY + 4.8, wz);
        addBox(mountain.detail, M.concrete, 3.45, .18, .38, wx, summitY + 3.98, wz);
      }
    }
    // Rooftop perimeter yellow safety handrails & corner aviation strobes around antenna plinth
    for (const rz of [-86.1, -69.9]) {
      addBox(mountain.detail, M.yellowPaint, 16.2, .08, .08, -198, summitY + 8.35, rz);
      for (let rx = -205.8; rx <= -190.1; rx += 3.1) addBox(mountain.detail, M.steelGalv, .08, 1.05, .08, rx, summitY + 7.82, rz);
    }
    for (const rx of [-206.1, -189.9]) {
      addBox(mountain.detail, M.yellowPaint, .08, .08, 16.2, rx, summitY + 8.35, -78);
      for (let rz = -85.8; rz <= -70.1; rz += 3.1) addBox(mountain.detail, M.steelGalv, .08, 1.05, .08, rx, summitY + 7.82, rz);
    }
    for (const [bx, bz] of [[-206.0, -86.0], [-190.0, -86.0], [-206.0, -70.0], [-190.0, -70.0]]) {
      addBox(mountain.detail, M.redCore, .32, .40, .32, bx, summitY + 8.58, bz);
    }
    // Exterior HVAC unit & galvanized cable conduit trays
    addBox(mountain.detail, M.steelWorn, 2.6, 1.6, 1.8, -203.8, summitY + 8.08, -73.0);
    addBox(mountain.detail, M.steelGalv, 2.4, .22, 1.6, -203.8, summitY + 8.95, -73.0);
    for (const z of [-83.3,-72.6]) {
      addBox(mountain.detail,M.steelDark,.14,2.12,2.65,-189.91,summitY+4.55,z);
      for(let row=0;row<8;row++) {
        const louvre=addBox(mountain.detail,M.steelGalv,.21,.065,2.46,-189.82,summitY+3.78+row*.22,z);
        louvre.rotation.z=.32;
        louvre.updateMatrix();
      }
      addCyl(mountain.detail,M.steelWorn,.08,6.95,-189.86,summitY+3.51,z-1.53);
    }
    addBox(mountain.detail,M.steelDark,1.6,.13,4.4,-189.33,summitY+3.47,-78);
    const relaySign=addBox(mountain.detail,makeSignMat('RIDGE RELAY','MICROWAVE LINK   /   07','#38443e'),2.12,.79,.11,-189.87,summitY+2.47,-81.8);
    relaySign.rotation.y=Math.PI/2;
    relaySign.updateMatrix();
    for(const [x,z] of [[-205,-108],[-209,-112],[-181,-109],[-185,-45],[-177,-44],[-214,-51]]) {
      const outcrop=new Mesh(new THREE.DodecahedronGeometry(1,0),M.rock);
      outcrop.position.set(x,summitY+.26,z);
      outcrop.scale.set(1.7+Math.abs(x%3)*.35,.9,1.18);
      outcrop.rotation.set(.13,x*.21,.27);
      mountain.detail.add(outcrop);
      addPineTree(mountain.detail,x+1.8,summitY,z+.9,.56+Math.abs(z%4)*.13);
    }
    const dishBase = new Group();
    dishBase.position.set(-198, summitY + 7.2, -78);
    addCyl(dishBase,M.steelDark,.84,3.8,0,1.9,0);
    const dishHead = new Group(); dishHead.position.y = 4.7;
    const reflector = new Group(); reflector.rotation.x = .94;
    const profile = Array.from({length:17}, (_,i) => {
      const r=i*4.8/16;
      return new THREE.Vector2(Math.max(.01,r), .061*r*r);
    });
    const dishMetal = M.steelGalv.clone();
    dishMetal.side = THREE.DoubleSide;
    const bowl = new Mesh(new THREE.LatheGeometry(profile,64),dishMetal);
    addCyl(reflector,M.steelDark,.24,.45,0,3.8,0);
    for (let arm=0; arm<3; arm++) {
      const angle=arm*Math.PI*2/3;
      const from=new Vector3(Math.cos(angle)*4.4,1.2,Math.sin(angle)*4.4);
      const direction=new Vector3(0,3.7,0).sub(from);
      const mid=from.clone().addScaledVector(direction,.5);
      const strut=addCyl(reflector,M.steelDark,.052,direction.length(),mid.x,mid.y,mid.z);
      strut.quaternion.setFromUnitVectors(new Vector3(0,1,0),direction.normalize());
      strut.updateMatrix();
    }
    reflector.add(bowl);
    dishHead.add(reflector);
    dishBase.add(dishHead);
    horizonRoot.add(dishBase);
    updaters.push(dt => { dishHead.rotation.y += dt * .55; });

    addInteractiveDoor(mountain.shell, { id: 'mountain-bunker-door', labelZh: '山顶卫星通信掩体闸门', x: -189.6, y: summitY, z: -78, width: 3.6, height: 3.2, axis: 'z', initiallyOpen: false });
    addInteractiveTerminal(mountain.shell, {
      id: 'mountain-radar-scan', promptZh: '按 [E] 启动 +14m 卫星全城雷达扫描', x: -187.2, y: summitY, z: -73.5, colorMat: M.glassCyan,
      onUse() {
        const enemiesAlive = world.enemies?.aliveCount?.() ?? 0;
        audio?.play?.('rail_touchdown', { pos: new Vector3(-187, summitY + 1, -73.5), ref: 20, gain: .5, jitter: .04 });
        world.tactical?.notify?.(`📡 卫星全城扫描完成：当前在线敌军 ${enemiesAlive} · 7 大港区岸线气象实时同步`, `📡 Citywide satellite scan complete: ${enemiesAlive} hostiles`, false, 4.2);
      },
    });

    spawnShootTarget(mountain.shell, { id: 'sat-core-1', stage: 4, labelZh: '北侧卫星散热芯', pos: new Vector3(-186, summitY, -84), tall: false, maxHp: 3 });
    spawnShootTarget(mountain.shell, { id: 'sat-core-2', stage: 4, labelZh: '中侧卫星散热芯', pos: new Vector3(-186, summitY, -72), tall: false, maxHp: 3 });
    spawnShootTarget(mountain.shell, { id: 'sat-core-3', stage: 4, labelZh: '南侧卫星散热芯', pos: new Vector3(-196, summitY, -66), tall: false, maxHp: 3 });

    // =========================================================================
    // SECTOR 3 (NORTHWEST): COASTAL AIRFIELD & ARCHED HANGAR (x: -222..-110, z: -225..-120)
    // =========================================================================
    const airfield = makeSector('airfield', '海岸应急机场与机库', 'Coastal Airfield & Hangar', [-166, 0, -172], 165);
    // Elevated Runway Deck (top y = +0.05m — cleanly above base land y=0.00m, ZERO Z-fighting!)
    addBox(airfield.shell, M.asphalt, 106, .05, 34, -166, .185, -172);
    for (let x = -214; x <= -118; x += 9) {
      addBox(airfield.detail, M.whitePaint, 4.6, .015, .45, x, .24, -172);
      addBox(airfield.detail, M.blueTaxi, .24, .32, .24, x, .20, -158);
      addBox(airfield.detail, M.blueTaxi, .24, .32, .24, x, .20, -186);
    }
    // Airfield Aviation Fuel Depot (3 horizontal cylindrical storage tanks on concrete cradles)
    for (const fz of [-198, -204, -210]) {
      addCyl(airfield.detail, M.steelGalv, 1.35, 8.5, -204, 1.85, fz, 0, Math.PI / 2);
      addBox(airfield.detail, M.concrete, .6, 1.2, 2.2, -207, .6, fz);
      addBox(airfield.detail, M.concrete, .6, 1.2, 2.2, -201, .6, fz);
    }
    const hx = -168, hz = -204;
    addBox(airfield.shell, M.asphalt, 68, .04, 24, hx - 15, .175, hz + 18);
    // Twin Side-by-Side Arched Quonset Hangars (Blueprint 07 海岸应急机场)
    for (const ahx of [hx, hx - 31]) {
      solid(airfield, airfield.shell, M.corrugated, ahx - 14, 0, hz - 11, ahx - 13.2, 8.2, hz + 11, 'metal', true);
      solid(airfield, airfield.shell, M.corrugated, ahx + 13.2, 0, hz - 11, ahx + 14, 8.2, hz + 11, 'metal', true);
      solid(airfield, airfield.shell, M.corrugated, ahx - 14, 0, hz - 11, ahx + 14, 8.2, hz - 10.2, 'metal', true);
      const archRoof = new Mesh(new CylinderGeometry(14.2, 14.2, 22, 24, 1, true, Math.PI / 2, Math.PI), hangarArchMat);
      archRoof.rotation.set(Math.PI / 2, 0, 0);
      archRoof.position.set(ahx, 8.0, hz);
      archRoof.matrixAutoUpdate = false; archRoof.updateMatrix();
      horizonRoot.add(archRoof);
      if (THREE.CircleGeometry) {
        const rearGable = new Mesh(new THREE.CircleGeometry(14.1, 24, 0, Math.PI), hangarArchMat);
        rearGable.position.set(ahx, 8.0, hz - 10.6);
        rearGable.matrixAutoUpdate = false; rearGable.updateMatrix();
        horizonRoot.add(rearGable);
      }
    }
    // Pine Forest Belt bordering Airfield Plateau (Blueprint NW Forest Rim)
    for (const [px, pz, sc] of [
      [-218, -216, 1.3], [-218, -196, 1.2], [-218, -172, 1.35], [-218, -148, 1.2],
      [-196, -220, 1.25], [-168, -220, 1.3], [-142, -220, 1.2], [-118, -212, 1.25],
      [-208, -126, 1.15], [-182, -126, 1.2], [-156, -126, 1.15],
    ]) addPineTree(airfield.detail, px, .16, pz, sc);
    // Runway piano-key threshold markings on BOTH ends & Parked Twin-Turboprop SAR Transport Aircraft
    for (let rz = -183; rz <= -161; rz += 3.6) {
      addBox(airfield.detail, M.whitePaint, 5.2, .03, 1.6, -116, .235, rz);
      addBox(airfield.detail, M.whitePaint, 5.2, .03, 1.6, -215, .235, rz);
    }
    addBox(airfield.detail, M.glassWarm, 8.0, .2, 1.4, hx, 9.2, hz);
    const parkedAircraft = window.createParkedTransport(THREE);
    const plane = parkedAircraft.root;
    plane.scale.setScalar(1.8);
    plane.updateMatrixWorld(true);
    const gearBounds = new THREE.Box3().setFromObject(plane, true);
    plane.position.set(-172, .05 - gearBounds.min.y, -184);
    plane.rotation.y = .35;
    airfield.detail.add(plane);
    const rubber = new MeshStandardMaterial({color:0x262726,roughness:.94});
    const contactShade = document.createElement('canvas');
    contactShade.width=contactShade.height=64;
    const shadeCtx=contactShade.getContext('2d');
    const gradient=shadeCtx.createRadialGradient(32,32,2,32,32,31);
    gradient.addColorStop(0,'rgba(10,13,15,.49)');
    gradient.addColorStop(1,'rgba(10,13,15,0)');
    shadeCtx.fillStyle=gradient;
    shadeCtx.fillRect(0,0,64,64);
    const shadowMap=new THREE.CanvasTexture(contactShade);
    const shadow=new Mesh(new THREE.PlaneGeometry(12,17),new MeshBasicMaterial({
      map:shadowMap,transparent:true,depthWrite:false,
    }));
    shadow.rotation.set(-Math.PI/2,0,.35);
    shadow.position.set(-172,.074,-184);
    airfield.detail.add(shadow);
    plane.updateMatrixWorld(true);
    plane.traverse(node=>{
      if (node.name!=='aircraft-landing-gear') return;
      const wheel=node.getWorldPosition(new Vector3());
      for(const side of [-1,1]) {
        const chock=addBox(airfield.detail,rubber,.64,.18,.21,wheel.x,.14,wheel.z+side*.38);
        chock.rotation.x=side*.24;
        chock.updateMatrix();
      }
    });
    for (const [hIdx, ahx] of [[0, hx], [1, hx - 31]]) {
      for (const side of [-1, 1]) {
        const x = ahx + side * 9.25;
        solid(airfield, airfield.shell, M.corrugated, x - 4.85, 0, hz + 10.5, x + 4.85, 6.65, hz + 10.82, 'metal', true);
        for (let dx = -4; dx <= 4; dx += 2) {
          addBox(airfield.detail, M.steelDark, 1.82, 1.22, .18, x + dx, 5.52, hz + 10.92);
          addBox(airfield.detail, smokedPane, 1.64, 1.05, .08, x + dx, 5.52, hz + 11.06);
        }
      }
      addBox(airfield.shell, M.steelWorn, 28, .42, .52, ahx, 6.85, hz + 10.75);
      addBox(airfield.detail, M.hazard, 10.2, .22, .56, ahx, 6.52, hz + 10.78);
      addBox(airfield.detail, makeSignMat(hIdx === 0 ? 'COASTAL AIR RESCUE' : 'AIRFRAME MAINTENANCE', hIdx === 0 ? 'FLIGHT OPERATIONS  /  01' : 'HANGAR BAY  /  02', hIdx === 0 ? '#354744' : '#263847'), 7.0, 1.38, .12, ahx, 7.72, hz + 10.95);
      addBox(airfield.detail, M.redCore, .36, .42, .36, ahx, 22.35, hz + 10.4);
      addBox(airfield.detail, M.glassWarm, 8.0, .2, 1.4, ahx, 9.2, hz);
      for (const dz of [-10.6, -4, 3, 10.6]) {
        const rib = new Mesh(new THREE.TorusGeometry(14.08, .15, 6, 40, Math.PI), M.steelGalv);
        rib.position.set(ahx, 8, hz + dz);
        airfield.detail.add(rib);
        for (const side of [-1, 1]) addBox(airfield.detail, M.steelDark, .36, 8, .42, ahx + side * 13.9, 4, hz + dz);
      }
    }
    placePortProp(airfield, airfield.detail, 'toolbox_cart', hx - 35, .16, hz - 3, .3);
    placePortProp(airfield, airfield.detail, 'generator', hx - 26, .16, hz - 4, Math.PI / 2);
    placePortProp(airfield, airfield.detail, 'shelf_rack', hx - 41, .16, hz, Math.PI / 2);
    addInteractiveDoor(airfield.shell, { id: 'hangar-shutter', labelZh: '应急机库安全卷帘闸', x: hx, y: 0, z: hz + 10.8, width: 8.5, height: 5.2, axis: 'x', initiallyOpen: true });
    addInteractiveTerminal(airfield.shell, {
      id: 'airfield-dispatch', promptZh: '按 [E] 机场机库调度四驱车并补满弹药', x: -158, y: 0, z: -195, colorMat: M.glassWarm,
      onUse() {
        world.vehicle?.setPosition?.(new Vector3(-156, .15, -186));
        (world.weapon?.refill || world.weapon?.reset)?.call(world.weapon);
        audio?.play?.('rail_touchdown', { pos: new Vector3(-158, 1, -195), ref: 18, gain: .5, jitter: .05 });
        world.tactical?.notify?.('✈️ 机场机库补给完成：弹药已满，SAR 四驱车已在跑道就位！', '✈️ Airfield resupply complete & 4x4 ready!', false, 3.4);
      },
    });

    // Area-1-Grade Airfield ATC Control Tower (walkable exterior stairs, mullioned glass, glowing consoles & rotating radar!)
    addControlTower(airfield, horizonRoot, { x: -134, z: -204, baseH: 11.6, cabW: 9.6, cabD: 9.6, title: 'AIRFIELD ATC TOWER 07', signBg: '#1d2d44', hasRadar: true });
    addCyl(airfield.detail, M.steelGalv, .10, 7.5, -148, 3.75, -190);
    addCyl(airfield.detail, M.hazard, .42, 2.2, -146.9, 7.1, -190, 0, Math.PI / 2);
    // High-Density Airfield Upgrade: 2nd Maintenance Hangar, Crash Fire Station, Weather Radar Dome & Ground Equipment
    addIndustrialFacility(airfield, airfield.shell, {
      x0: -214, z0: -152, x1: -182, z1: -134, h: 7.4,
      wallMat: M.steelClad, roofMat: M.corrugated, title: 'AIRFIELD MAINTENANCE HANGAR 02', doorSide: 'north', signBg: '#1c303d', interiorKind: 'workshop',
    });
    addIndustrialFacility(airfield, airfield.shell, {
      x0: -168, z0: -150, x1: -136, z1: -134, h: 6.4,
      wallMat: M.clinicPlaster, roofMat: M.corrugated, title: 'CRASH FIRE RESCUE STATION', doorSide: 'north', signBg: '#6b1f1a', interiorKind: 'warehouse',
    });
    // Geodesic Weather Radar Radome on Concrete Plinth
    addCyl(horizonRoot, M.concrete, 3.6, 5.2, -124, 2.75, -144);
    const radome = new Mesh(sphGeo, M.craneWhite);
    radome.scale.set(4.1, 4.1, 4.1); radome.position.set(-124, 8.2, -144);
    radome.matrixAutoUpdate = false; radome.updateMatrix(); horizonRoot.add(radome);
    airfield.colliderSpecs.push({ min: new Vector3(-128, .16, -148), max: new Vector3(-120, 12.2, -140), surface: 'concrete' });
    addSemiTrailerTruck(airfield, airfield.detail, -196, .21, -186, Math.PI / 2, M.craneWhite); // Aviation fuel tanker
    for (const [lx, lz] of [[-194, -156], [-152, -156], [-126, -156], [-194, -190], [-146, -190]]) {
      placePortProp(airfield, airfield.detail, 'light_mast', lx, .16, lz, 0);
    }
    placePortProp(airfield, airfield.detail, 'container20', -154, .16, -206, 0, { color: 'orange' });
    placePortProp(airfield, airfield.detail, 'container20', -154, .16, -210, 0, { color: 'blue' });
    placePortProp(airfield, airfield.detail, 'forklift', -160, .16, -192, .45);
    placePortProp(airfield, airfield.detail, 'pallet_stack', -188, .16, -194, .15);
    placePortProp(airfield, airfield.detail, 'barrel', -196, .16, -198, 0, { color: 'red' });
    placePortProp(airfield, airfield.detail, 'generator', -142, .16, -196, Math.PI / 2);
    placePortProp(airfield, airfield.detail, 'jersey_barrier', -132, .16, -154, 0);
    // Poly Haven CC0 PBR Airfield Apron Equipment
    placeExternal(airfield.detail, 'portable_generator', -162, .16, -194, .5, 1.0);
    placeExternal(airfield.detail, 'utility_box_01', -138, .16, -199, 0, 1.0);
    placeExternal(airfield.detail, 'concrete_road_barrier', -144, .16, -155, 0, 1.0);
    placeExternal(airfield.detail, 'concrete_road_barrier', -152, .16, -155, 0, 1.0);
    placeExternal(airfield.detail, 'modular_industrial_pipes_01', -204, .16, -194, 0, 1.0);

    // =========================================================================
    // SECTOR 4 (WEST): NORTH-SOUTH CENTRAL RAIL CORRIDOR, TWIN MOUNTAIN TUNNEL & LEVEL CROSSING (Blueprint 04)
    // =========================================================================
    const railWest = makeSector('rail_west', '西区铁路货场与编组站', 'West Rail Freight Yard', [-144, 0, 2], 275);
    // 4 Parallel North-South Freight Tracks (x = -126, -133, -140, -147) running from North Tunnel (-115) to South Crossing (+144)
    const railTracks = [-126, -133, -140, -147];
    for (const tx of railTracks) {
      const zStart = (tx === -133 || tx === -140) ? -114 : -48;
      const zEnd = (tx === -133 || tx === -140) ? 144 : 44;
      const zLen = zEnd - zStart, zMid = (zStart + zEnd) / 2;
      addBox(horizonRoot, M.concreteDirty, 3.6, .08, zLen, tx, .17, zMid);
      for (const ox of [-.82, .82]) addBox(horizonRoot, M.steelDark, .14, .16, zLen, tx + ox, .24, zMid);
      for (let z = zStart + 2; z <= zEnd - 2; z += 2.6) addBox(railWest.detail, M.wood, 2.45, .08, .24, tx, .21, z);
    }
    // Twin-Bore Arched Concrete Mountain Railway Tunnel Portal at North Valley End (x = -136.5, z = -115)
    const tunG = new Group(); tunG.position.set(-136.5, .16, -115);
    addBox(tunG, M.concrete, 22.0, 11.5, 4.2, 0, 5.75, 0); // Concrete headwall
    addBox(tunG, M.concreteDirty, 23.2, 1.0, 4.8, 0, 11.6, 0); // Headwall parapet
    for (const bx of [-3.6, 3.6]) {
      addBox(tunG, M.steelDark, 4.6, 6.2, 4.5, bx, 3.1, .05); // Dark twin tunnel bores
      addCyl(tunG, M.steelDark, 2.3, 4.5, bx, 6.1, .05, Math.PI / 2, 0);
      addBox(tunG, M.hazard, 4.8, .28, .22, bx, 8.35, 2.15);
    }
    addBox(tunG, M.rock, 28.0, 14.5, 16.0, 0, 7.2, -9.5); // Rocky mountain cliff above tunnel
    tunG.matrixAutoUpdate = false; tunG.updateMatrix(); horizonRoot.add(tunG);
    railWest.colliderSpecs.push({ min: new Vector3(-148, .16, -118), max: new Vector3(-125, 12.0, -112), surface: 'concrete' });
    // Yellow-Hatched Railway Level Crossing at South Perimeter Road (x = -136.5, z = 122) with AUTO-LOWERING GATES & FLASHING LAMPS!
    addBox(horizonRoot, M.asphalt, 46.0, .04, 12.0, -136.5, .185, 122);
    for (let gx = -148; gx <= -125; gx += 2.4) addBox(horizonRoot, M.yellowPaint, .42, .015, 10.6, gx, .228, 122);
    for (let gz = 117; gz <= 127; gz += 2.4) addBox(horizonRoot, M.yellowPaint, 24.0, .015, .42, -136.5, .228, gz);
    const crossingGates = [], crossingLamps = [];
    for (const [cx, cz, sign] of [[-151, 115.5, 1], [-122, 128.5, -1]]) {
      addCyl(horizonRoot, M.steelDark, .16, 3.8, cx, 2.0, cz);
      const armPivot = new Group(); armPivot.position.set(cx, 1.35, cz);
      for (let seg = 0; seg < 5; seg++) {
        addBox(armPivot, seg % 2 === 0 ? M.craneRed : M.craneWhite, .16, .16, 1.15, 0, 0, sign * (.7 + seg * 1.15));
      }
      horizonRoot.add(armPivot);
      crossingGates.push({ pivot: armPivot, sign });
      const lampL = new Mesh(boxGeo, M.redCore); lampL.scale.set(.28, .28, .28); lampL.position.set(cx - .35, 3.55, cz);
      const lampR = new Mesh(boxGeo, M.redCore); lampR.scale.set(.28, .28, .28); lampR.position.set(cx + .35, 3.55, cz);
      horizonRoot.add(lampL, lampR);
      crossingLamps.push([lampL, lampR]);
    }
    for (const gz of [-34, -10, 14, 38]) {
      addBox(railWest.detail, M.steelGalv, .38, 7.8, .38, -150.5, 4.0, gz);
      addBox(railWest.detail, M.steelGalv, .38, 7.8, .38, -122.5, 4.0, gz);
      addBox(railWest.detail, M.steelGalv, 28.6, .32, .32, -136.5, 7.6, gz);
    }
    // Matching Twin-Bore Arched Concrete Southern Railway Tunnel Portal (x = -136.5, z = +144) so trains NEVER vanish in thin air!
    const tunSouth = new Group(); tunSouth.position.set(-136.5, .16, 144);
    addBox(tunSouth, M.concrete, 22.0, 11.5, 4.2, 0, 5.75, 0);
    addBox(tunSouth, M.concreteDirty, 23.2, 1.0, 4.8, 0, 11.6, 0);
    for (const bx of [-3.6, 3.6]) {
      addBox(tunSouth, M.steelDark, 4.6, 6.2, 4.5, bx, 3.1, -.05);
      addCyl(tunSouth, M.steelDark, 2.3, 4.5, bx, 6.1, -.05, Math.PI / 2, 0);
      addBox(tunSouth, M.hazard, 4.8, .28, .22, bx, 8.35, -2.15);
    }
    addBox(tunSouth, M.rock, 28.0, 13.5, 14.0, 0, 6.6, 8.5);
    tunSouth.matrixAutoUpdate = false; tunSouth.updateMatrix(); horizonRoot.add(tunSouth);
    railWest.colliderSpecs.push({ min: new Vector3(-148, .16, 141), max: new Vector3(-125, 12.0, 147), surface: 'concrete' });
    // LIVE MOVING ARTICULATED 5-CAR FREIGHT TRAIN on North-South Track 2 (x = -133)
    // Per-car tunnel visibility clipping ensures every car smoothly exits North Tunnel (-115) & enters South Tunnel (+144)!
    const liveTrain = new Group();
    liveTrain.position.set(-133, .16, -24);
    const buildTrainLoco = () => {
      const lg = new Group(); lg.rotation.y = -Math.PI / 2;
      addBox(lg, M.steelDark, 14.8, .55, 2.95, 0, .92, 0);
      addBox(lg, M.cargoRust, 9.6, 2.35, 2.25, -1.8, 2.35, 0);
      addBox(lg, M.steelWorn, 3.4, 2.75, 2.75, 4.4, 2.55, 0);
      addBox(lg, M.glass, .16, 1.1, 2.35, 6.12, 3.15, 0);
      addBox(lg, M.hazard, 14.9, .24, 3.0, 0, 1.15, 0);
      addBox(lg, M.glassWarm, .18, .45, .72, 7.42, 1.85, 0);
      addCyl(lg, M.steelDark, .26, .95, -2.5, 3.95, 0);
      for (const ax of [-5.2, -3.6, 3.6, 5.2]) addCyl(lg, M.steelDark, .44, 2.4, ax, .44, 0, Math.PI / 2, 0);
      for (const side of [-1, 1]) {
        const z = side * 1.42;
        for (const truck of [-4.5, 4.5]) addBox(lg, M.steelDark, 2.6, .30, .19, truck, .53, z * .84);
        addBox(lg, M.steelGalv, 8.3, .048, .048, -1.92, 2.13, z);
        addBox(lg, smokedPane, 2.62, .89, .045, 4.4, 3.12, side * 1.39);
      }
      addBox(lg, M.steelDark, 3.7, .16, 3.03, 4.4, 3.98, 0);
      addBox(lg, M.cargoRust, 1.26, .99, 2.17, 6.72, 1.65, 0);
      return lg;
    };
    const trainUnits = [];
    const locoUnit = buildTrainLoco();
    liveTrain.add(locoUnit);
    trainUnits.push({ group: locoUnit, offsetZ: 0 });
    const trainCarMats = [M.cargoTeal, M.cargoNavy, M.safetyOrange, M.craneWhite];
    for (let i = 0; i < trainCarMats.length; i++) {
      const cz = -(i + 1) * 15.4;
      const carG = new Group();
      carG.position.set(0, 0, cz);
      addBox(carG, M.steelDark, 2.8, .42, 13.8, 0, .86, 0);
      addBox(carG, M.hazard, 2.84, .12, 13.85, 0, 1.06, 0);
      addBox(carG, trainCarMats[i], 2.58, 2.56, 12.6, 0, 2.38, 0);
      // Corrugated steel container ribs, corner posts & roof rails (no plain cubes!)
      for (const sx of [-1.29, 1.29]) {
        for (let rz = -5.6; rz <= 5.6; rz += 1.6) addBox(carG, M.steelDark, .06, 2.46, .14, sx, 2.38, rz);
        addBox(carG, M.steelGalv, .14, .14, 12.66, sx, 3.68, 0);
      }
      addBox(carG, M.steelGalv, .36, .28, 1.8, 0, .86, 7.6);
      for (const az of [-5.2, -3.8, 3.8, 5.2]) addCyl(carG, M.steelDark, .38, 2.2, 0, .42, az, 0, Math.PI / 2);
      liveTrain.add(carG);
      trainUnits.push({ group: carG, offsetZ: cz });
    }
    horizonRoot.add(liveTrain);
    let trainZ = -32, gateAngle = 0, crossBlink = 0;
    updaters.push(dt => {
      trainZ += dt * 13.5;
      if (trainZ > 214) trainZ = -114;
      liveTrain.position.z = trainZ;
      for (const u of trainUnits) {
        const wz = trainZ + u.offsetZ;
        u.group.visible = (wz >= -114.5 && wz <= 143.5);
      }
      const trainNearCrossing = trainZ > 76 && trainZ < 196;
      const targetAngle = trainNearCrossing ? 0 : 1.32;
      gateAngle += (targetAngle - gateAngle) * Math.min(1, dt * 4.5);
      for (const cg of crossingGates) cg.pivot.rotation.x = -cg.sign * gateAngle;
      crossBlink += dt * 6.0;
      const alt = Math.sin(crossBlink) > 0;
      for (const [lL, lR] of crossingLamps) {
        lL.visible = trainNearCrossing && alt;
        lR.visible = trainNearCrossing && !alt;
      }
    });
    for (const [cx, cz, mat] of [
      [-140, -18, M.cargoNavy], [-140, -2, M.cargoRust], [-140, 14, M.craneWhite],
      [-147, -12, M.cargoRust], [-147, 6, M.cargoTeal],
      [-126, 8, M.cargoNavy], [-126, 24, M.cargoRust],
    ]) {
      solid(railWest, railWest.shell, M.steelDark, cx - 1.4, .65, cz - 6.8, cx + 1.4, 1.05, cz + 6.8, 'metal', true);
      solid(railWest, railWest.shell, mat, cx - 1.3, 1.05, cz - 6.2, cx + 1.3, 3.65, cz + 6.2, 'metal', true);
      for (const az of [-5.2, -3.9, 3.9, 5.2]) addCyl(railWest.detail, M.steelDark, .38, 2.2, cx, .42, cz + az, 0, Math.PI / 2);
    }
    addControlTower(railWest, horizonRoot, { x: -206, z: 5, baseH: 8.6, cabW: 10.6, cabD: 10.6, title: 'WEST RAIL SIGNAL TOWER', signBg: '#3d2c1b', hasRadar: false });
    let railSignalGreen = true;
    addInteractiveTerminal(railWest.shell, {
      id: 'rail-signal-switch', promptZh: '按 [E] 切换西区铁路编组信号闸', x: -198.2, y: 0, z: 5, colorMat: M.greenSignal,
      onUse() {
        railSignalGreen = !railSignalGreen;
        audio?.play?.('rail_touchdown', { pos: new Vector3(-198, 1, 5), ref: 20, gain: .55, jitter: .05 });
        world.tactical?.notify?.(railSignalGreen ? '🚂 铁路编组信号已切换为【放行绿灯】' : '🛑 铁路编组信号已切换为【紧急制动红灯】', railSignalGreen ? '🚂 Rail signal: GREEN' : '🛑 Rail signal: RED STOP', false, 3.0);
      },
    });
    addIndustrialFacility(railWest, railWest.shell, {
      x0: -194, z0: -14, x1: -162, z1: -2, h: 7.2,
      wallMat: M.steelClad, roofMat: M.corrugated, title: 'INTERMODAL RAIL FREIGHT SHED', doorSide: 'south', signBg: '#3a2b1c', interiorKind: 'warehouse',
    });
    addBulkSiloBank(railWest, horizonRoot, -176, -29, 4);
    addRedWhiteRTGCrane(railWest, horizonRoot, -136.5, -24, 15.0, 13.0, 0);
    // Move rail freight truck off West Inland Ave into freight shed loading apron
    addSemiTrailerTruck(railWest, railWest.detail, -178, .21, 14, Math.PI / 2, M.cargoTeal);
    for (const [lx, lz] of [[-120, -24], [-120, 16], [-156, -24], [-156, 16], [-186, 12]]) {
      placePortProp(railWest, railWest.detail, 'light_mast', lx, .16, lz, 0);
    }
    placePortProp(railWest, railWest.detail, 'forklift', -164, .16, 14, -.35);
    placePortProp(railWest, railWest.detail, 'pallet_stack', -174, .16, 14, .1);
    placePortProp(railWest, railWest.detail, 'pipe_stack', -194, .16, -8, Math.PI / 2);
    // Poly Haven CC0 PBR Rail Yard Infrastructure
    placeExternal(railWest.detail, 'modular_electricity_poles', -121, .16, -32, 0, 1.0);
    placeExternal(railWest.detail, 'modular_electricity_poles', -154, .16, -32, 0, 1.0);
    placeExternal(railWest.detail, 'utility_box_01', -196, .16, 10.5, Math.PI / 2, 1.0);
    placeExternal(railWest.detail, 'portable_generator', -194, .16, -2.5, .25, 1.0);
    placeExternal(railWest.detail, 'modular_industrial_pipes_01', -196, .16, -25, 0, 1.0);

    spawnShootTarget(railWest.shell, { id: 'rail-sig-1', stage: 3, labelZh: '东股道编组信号闸', pos: new Vector3(-148, 0, -12), tall: true, maxHp: 3 });
    spawnShootTarget(railWest.shell, { id: 'rail-sig-2', stage: 3, labelZh: '西塔台信号主控闸', pos: new Vector3(-194, 0, 8), tall: true, maxHp: 3 });

    // =========================================================================
    // SECTOR 5 (SOUTH PENINSULA): OLD DRYDOCK, TIDE GATE & 22m COASTAL HEADLAND LIGHTHOUSE
    // STRICTLY ON LAND (x: -107..+24, z: +28..+145) — flush with Berth 4's x=+26 coastline!
    // =========================================================================
    const southHarbor = makeSector('south_harbor', '南港旧船坞与岸角灯塔', 'South Drydock & Lighthouse', [-42, 0, 86], 160);
    for (let z = 34; z <= 138; z += 7.0) addBox(southHarbor.detail, M.yellowPaint, .18, .015, 3.4, -26, .24, z);
    addIndustrialFacility(southHarbor, southHarbor.shell, { x0: -92, z0: 54, x1: -50, z1: 76, h: 8.0, wallMat: M.steelClad, roofMat: M.corrugated, title: 'SOUTH DRYDOCK PUMP HOUSE 02', doorSide: 'east', signBg: '#1a3342', interiorKind: 'pump_house' });
    addIndustrialFacility(southHarbor, southHarbor.shell, { x0: -92, z0: 106, x1: -54, z1: 128, h: 7.6, wallMat: M.brickWeathered, roofMat: M.corrugated, title: 'MARINE ENGINEERING WORKSHOP', doorSide: 'east', signBg: '#3c2b22', interiorKind: 'workshop' });
    // Real Area-1 corrugated shipping containers (with ribs, corner castings, doors & decals!), light masts, bollards & port gear
    for (const [cx, cz, col, yaw] of [
      [-42, 60, 'teal', Math.PI / 2], [-42, 74, 'red', Math.PI / 2], [-42, 116, 'blue', Math.PI / 2],
      [-10, 62, 'orange', 0], [-10, 65.2, 'grey', 0], [8, 64, 'green', 0], [8, 76, 'white', Math.PI / 2],
    ]) {
      placePortProp(southHarbor, southHarbor.shell, 'container40', cx, .16, cz, yaw, { color: col, doors: col === 'orange' ? .6 : 0 });
    }
    placePortProp(southHarbor, southHarbor.shell, 'container20', -10, 2.75, 62, 0, { color: 'blue' });
    for (const [lx, lz] of [[-46, 50], [-46, 102], [-14, 52], [-14, 104], [14, 78]]) placePortProp(southHarbor, southHarbor.detail, 'light_mast', lx, .16, lz, 0);
    for (const mz of [42, 62, 82, 102, 122]) placePortProp(southHarbor, southHarbor.detail, 'bollard_mooring', 22.8, .16, mz, 0, {}, false);
    placePortProp(southHarbor, southHarbor.detail, 'guard_booth', -36, .16, 48, 0);
    placePortProp(southHarbor, southHarbor.detail, 'forklift', -45, .16, 86, .4);
    placePortProp(southHarbor, southHarbor.detail, 'pipe_stack', -72, .16, 84, 0);
    placePortProp(southHarbor, southHarbor.detail, 'cable_reel', -60, .16, 84, .6);
    placePortProp(southHarbor, southHarbor.detail, 'generator', -16, .16, 108, Math.PI / 2);
    // Reference Photo 1 & 2 Landmarks: Red-and-White RTG Straddle Cranes, Towering STS Quay Cranes & Off-Lane Yard Trucks!
    addRedWhiteRTGCrane(southHarbor, horizonRoot, -10, 64, 14.0, 13.5, Math.PI / 2);
    addRedWhiteRTGCrane(southHarbor, horizonRoot, -42, 67, 13.0, 13.0, 0);
    addRedWhiteSTSCrane(southHarbor, horizonRoot, 18.5, 76);
    addRedWhiteSTSCrane(southHarbor, horizonRoot, 18.5, 102);
    addIndustrialExhaustTower(southHarbor, southHarbor.shell, -96.5, 65, 1);
    addSemiTrailerTruck(southHarbor, southHarbor.detail, -44, .21, 84, Math.PI / 2, M.cargoTeal);
    addSemiTrailerTruck(southHarbor, southHarbor.detail, -44, .21, 104, Math.PI / 2, M.craneRed);
    // High-Density South Harbor Upgrade: 112m Moored Container Ship under STS Cranes + Multi-Tier Automated Container Yard + Substation
    addMooredContainerShip(horizonRoot, 39.5, 88.0);
    addContainerYardBlock(southHarbor, southHarbor.shell, -10, 82, 2, 3, 0, false);
    addContainerYardBlock(southHarbor, southHarbor.shell, -88, 82, 2, 2, 0, false);
    addIndustrialFacility(southHarbor, southHarbor.shell, {
      x0: -12, z0: 44, x1: 8, z1: 54, h: 5.8, flatRoof: true,
      wallMat: M.craneWhite, roofMat: M.steelDark, title: 'TERMINAL CONTROL SUBSTATION', doorSide: 'west', signBg: '#1b3545', interiorKind: 'warehouse',
    });
    // Poly Haven CC0 PBR Quay & Drydock Equipment (strictly off Coastal Blvd roadway!)
    placeExternal(southHarbor.detail, 'portable_generator', -44.0, .16, 98.0, .4, 1.0);
    placeExternal(southHarbor.detail, 'utility_box_01', -14.5, .16, 72.0, -Math.PI / 2, 1.0);
    placeExternal(southHarbor.detail, 'utility_box_01', 6.0, .16, 110.0, 0, 1.0);
    placeExternal(southHarbor.detail, 'modular_industrial_pipes_01', -95.0, .16, 84.0, Math.PI / 2, 1.0);
    placeExternal(southHarbor.detail, 'modular_electricity_poles', -46.0, .16, 132.0, 0, 1.0);
    placeExternal(southHarbor.detail, 'exterior_aircon_unit', -12.4, 2.1, 49.0, -Math.PI / 2, 1.0);
    placeExternal(southHarbor.detail, 'overhead_crane', -72.0, .16, 117.0, 0, 1.0);
    for (let lz = 44; lz <= 132; lz += 22) addStreetLamp(southHarbor.detail, -17.5, .21, lz, -1);
    for (const gx of [-84, -48]) solid(southHarbor, southHarbor.shell, M.steelWorn, gx - .6, 0, 92, gx + .6, 13.5, 93.2, 'metal', true);
    addBox(horizonRoot, M.hazard, 38, 1.3, 1.5, -66, 13.6, 92.6);
    addBox(southHarbor.detail, M.steelDark, 4.2, 2.4, 2.6, -66, 11.8, 92.6); // Crane operator cab
    addBox(southHarbor.detail, M.glassCyan, 3.6, 1.1, 2.7, -66, 12.0, 92.6);
    addCyl(southHarbor.detail, M.steelGalv, .08, 6.5, -66, 7.4, 92.6); // Hoist cable
    addBox(southHarbor.detail, M.hazard, 1.6, .65, 1.2, -66, 4.2, 92.6); // Lifting spreader
    // Area-1-Grade Hydraulic Tide Gate Arch spanning Coastal Blvd at z = 96 (suspended steel floodgate, catwalk, handrails & operator booth!)
    for (const px of [-37.5, -14.5]) {
      addBox(horizonRoot, M.concreteDirty, 4.8, 1.6, 5.0, px, .96, 96);
      addBox(horizonRoot, M.concrete, 4.0, 11.6, 4.0, px, 6.8, 96);
      for (const rz of [93.9, 98.1]) addBox(horizonRoot, M.steelDark, .34, 11.4, .28, px, 6.7, rz);
      addCyl(southHarbor.detail, M.steelGalv, .36, 9.2, px + (px < -26 ? 2.2 : -2.2), 7.6, 96);
      addBox(southHarbor.detail, M.redCore, .40, .42, .40, px, 14.6, 96);
    }
    addBox(horizonRoot, M.concrete, 27.6, 2.4, 3.4, -26, 12.1, 96);
    addBox(horizonRoot, M.concreteDirty, 28.8, .55, 4.0, -26, 13.5, 96);
    addBox(horizonRoot, M.corrugated, 19.2, 3.1, .52, -26, 9.45, 96);
    addBox(horizonRoot, M.hazard, 19.4, .42, .62, -26, 7.85, 96);
    addBox(southHarbor.detail, M.steelDark, 26.8, .18, 2.2, -26, 13.85, 96);
    for (const rz of [94.9, 97.1]) {
      addBox(southHarbor.detail, M.yellowPaint, 26.8, .08, .08, -26, 14.95, rz);
      for (let gx = -38; gx <= -14; gx += 3.0) addBox(southHarbor.detail, M.yellowPaint, .08, 1.05, .08, gx, 14.42, rz);
    }
    addBox(southHarbor.detail, M.steelWorn, 3.6, 2.6, 3.2, -14.5, 15.1, 96);
    addBox(southHarbor.detail, smokedPane, 3.72, 1.15, 2.6, -14.5, 15.35, 96);
    for (let cx = -32; cx <= -20; cx += 2.0) addBox(southHarbor.detail, M.whitePaint, .85, .015, 3.4, cx, .225, 96);
    // REAL Recessed South Drydock Slipway Basin (notched out of South concrete slab so real East Sea water fills it!)
    solidHorizon(M.concrete, -6.2, -2.2, 79.8, 25.4, .52, 81.0, 'concrete', true);
    solidHorizon(M.concrete, -6.2, -2.2, 103.0, 25.4, .52, 104.2, 'concrete', true);
    solidHorizon(M.concrete, -7.2, -2.2, 79.8, -5.8, .52, 104.2, 'concrete', true);
    for (const bx of [-2, 6, 14, 22]) {
      placePortProp(southHarbor, southHarbor.detail, 'bollard_mooring', bx, .52, 80.4, 0, {}, false);
      placePortProp(southHarbor, southHarbor.detail, 'bollard_mooring', bx, .52, 103.6, 0, {}, false);
    }
    addRedWhiteRTGCrane(southHarbor, horizonRoot, -1.0, 109.0, 11.0, 11.5, 0);
    addRedWhiteRTGCrane(southHarbor, horizonRoot, 14.0, 109.0, 11.0, 11.5, 0);
    // High-Precision 22m Red-and-White Striped Coastal Headland Lighthouse on Rocky Cape (Blueprint 06)
    addCyl(horizonRoot, M.concreteDirty, 5.4, 2.2, 14, 1.1, 134);
    const lhBands = [
      [4.2, 3.2, 3.8, M.craneRed], [3.95, 3.2, 7.0, M.craneWhite],
      [3.7, 3.2, 10.2, M.craneRed], [3.45, 3.2, 13.4, M.craneWhite], [3.2, 3.2, 16.6, M.craneRed],
    ];
    for (const [r, h, cy, mat] of lhBands) addCyl(horizonRoot, mat, r, h, 14, cy, 134);
    addCyl(horizonRoot, M.steelDark, 4.35, .42, 14, 18.6, 134); // Observation gallery deck
    for (let a = 0; a < 10; a++) {
      const ang = (a / 10) * Math.PI * 2;
      addBox(southHarbor.detail, M.steelGalv, .12, 1.15, .12, 14 + Math.cos(ang) * 4.15, 19.35, 134 + Math.sin(ang) * 4.15);
    }
    for (const y of [19.1, 19.8]) {
      const rail = new Mesh(new THREE.TorusGeometry(4.15, .042, 6, 48), M.steelGalv);
      rail.rotation.x = Math.PI / 2; rail.position.set(14, y, 134);
      southHarbor.detail.add(rail);
    }
    for (let i = 0; i < 10; i++) {
      const a = i * Math.PI / 5;
      addBox(southHarbor.detail, M.steelDark, .095, 3.1, .095, 14 + 2.65 * Math.cos(a), 20.4, 134 + 2.65 * Math.sin(a));
    }
    addCyl(horizonRoot, M.glass, 2.65, 3.1, 14, 20.4, 134);
    addCyl(horizonRoot, M.glassWarm, 1.15, 1.6, 14, 20.4, 134); // Fresnel beacon optic
    addCyl(horizonRoot, M.craneRed, 3.1, 1.45, 14, 22.6, 134); // Red lantern dome
    // Rocky Southern Coastal Shoreline & Pine Tree Belt (Blueprint South Edge)
    for (const [rx, rz, sx, sy] of [
      [20, 140, 4.2, 2.4], [12, 143, 4.8, 2.2], [2, 144, 5.2, 2.0], [-10, 144, 4.6, 1.9],
      [-26, 144, 5.0, 2.1], [-46, 144, 5.2, 2.0], [-68, 144, 4.8, 1.8], [-90, 144, 5.0, 2.1],
    ]) {
      const boulder = new Mesh(new THREE.DodecahedronGeometry(1, 0), M.rock);
      boulder.position.set(rx, .4, rz); boulder.scale.set(sx, sy, 3.2);
      boulder.rotation.set(.15, rx * .17, .2); boulder.matrixAutoUpdate = false; boulder.updateMatrix();
      horizonRoot.add(boulder);
      addPineTree(southHarbor.detail, rx - 2.5, .16, rz - 4.5, 1.05);
    }
    southHarbor.colliderSpecs.push({ min: new Vector3(10, 0, 130), max: new Vector3(18, 22, 138), surface: 'concrete' });
    const lighthouseRotor = new Group();
    lighthouseRotor.position.set(14, 20.6, 134);
    for (const dir of [-1, 1]) {
      const beam = new Mesh(coneGeo, M.beamGold);
      beam.scale.set(4.8, 42, 4.8);
      beam.rotation.z = dir * Math.PI / 2;
      beam.position.x = dir * 21;
      lighthouseRotor.add(beam);
    }
    horizonRoot.add(lighthouseRotor);
    let lighthouseOverdrive = false;
    addInteractiveTerminal(southHarbor.shell, {
      id: 'lighthouse-console', promptZh: '按 [E] 切换 22m 岸角灯塔强光频闪并召唤四驱车', x: 8.6, y: 0, z: 134, colorMat: M.glassWarm,
      onUse() {
        lighthouseOverdrive = !lighthouseOverdrive;
        world.vehicle?.setPosition?.(new Vector3(-18, .15, 132));
        audio?.play?.('rail_touchdown', { pos: new Vector3(8.6, 1, 134), ref: 22, gain: .55, jitter: .04 });
        world.tactical?.notify?.(lighthouseOverdrive ? '🗼 岸角灯塔已切换至【风暴强光频闪】！四驱车已调度至南港路旁' : '🗼 岸角灯塔已恢复常规巡航模式', lighthouseOverdrive ? '🗼 Lighthouse overdrive active!' : '🗼 Lighthouse standard mode', false, 3.6);
      },
    });
    updaters.push(dt => { lighthouseRotor.rotation.y += dt * (lighthouseOverdrive ? 2.1 : (freeRoam || stage >= 7 ? .95 : .35)); });

    spawnShootTarget(southHarbor.shell, { id: 'lh-jam-1', stage: 6, labelZh: '灯塔西侧电源干扰器', pos: new Vector3(4, 0, 132), tall: true, maxHp: 3 });
    spawnShootTarget(southHarbor.shell, { id: 'lh-jam-2', stage: 6, labelZh: '灯塔北侧电源干扰器', pos: new Vector3(14, 0, 122), tall: true, maxHp: 3 });

    // =========================================================================
    // SECTOR 6 (SOUTHWEST INLAND): COOLING TOWERS, TWIN COLD-STORAGE, RED-CROSS CLINIC & GREEN HELIPAD (Blueprint 03)
    // STRICTLY INLAND (x: -222..-152, z: +35..+145) — West of the North-South Rail Corridor!
    // =========================================================================
    const swClinic = makeSector('sw_clinic', '西南冷雾库与战地分诊中心', 'SW Cold-Storage & Field Clinic', [-186, 0, 92], 275);
    // North Quadrant of 03: Two 24m Hyperbolic Cooling Towers + Two Red-and-White Striped Smokestacks
    addPowerPlantSkyline(swClinic, horizonRoot, -202, 58);
    addIndustrialExhaustTower(swClinic, swClinic.shell, -162, 60, -1);
    addSubstationYard(swClinic, swClinic.shell, -204, 38);
    if (industrialGen) {
      industrialGen.buildCryoTankCluster(swClinic.shell, -204, 78, 3, 5.2);
      industrialGen.buildOverheadPipeline(horizonRoot, [[-194, 5.2, 62], [-184, 7.6, 68], [-174, 7.6, 82], [-182, 5.6, 89]], { radius: 0.28, pipeCount: 2, spacing: 0.72 });
      industrialGen.buildOverheadPipeline(horizonRoot, [[-94, 5.4, 65], [-74, 8.2, 65], [-52, 6.2, 65]], { radius: 0.26, pipeCount: 2, spacing: 0.68 });
      industrialGen.buildReflectivePuddles(horizonRoot, [
        [-25.5, 0.214, -46, 3.2, 1.9, 0.25], [-27.2, 0.214, -70, 2.8, 1.6, -0.3],
        [-24.4, 0.214, -98, 3.6, 2.1, 0.15], [-26.8, 0.214, 44, 3.4, 1.8, 0.4],
        [-25.2, 0.214, 78, 2.9, 2.2, -0.2], [-26.5, 0.214, 114, 3.5, 1.7, 0.1],
        [-112.5, 0.214, -48, 3.0, 1.8, 0.3], [-111.2, 0.214, 18, 2.6, 1.7, -0.4],
        [-112.8, 0.214, 72, 3.2, 2.0, 0.2], [-58, 0.168, 42, 3.4, 2.2, 0.5],
        [8, 0.168, 56, 3.8, 2.4, -0.35], [-12, 0.168, 112, 3.1, 1.9, 0.22],
        [-174, 0.168, 76, 3.2, 2.1, -0.15], [-156, 0.168, 102, 2.8, 1.6, 0.45],
      ]);
    }
    // South-West Quadrant of 03: Two Side-by-Side Pitched-Roof Cold-Storage Warehouses (Blueprint 03)
    addIndustrialFacility(swClinic, swClinic.shell, { x0: -214, z0: 88, x1: -196, z1: 126, h: 7.4, wallMat: M.cryoPanel, roofMat: M.corrugated, title: 'COLD STORAGE UNIT 01', doorSide: 'south', signBg: '#153642', interiorKind: 'cold_storage' });
    addIndustrialFacility(swClinic, swClinic.shell, { x0: -192, z0: 88, x1: -174, z1: 126, h: 7.4, wallMat: M.cryoPanel, roofMat: M.corrugated, title: 'COLD STORAGE UNIT 02', doorSide: 'south', signBg: '#153642', interiorKind: 'cold_storage' });
    // East-Center Quadrant of 03: Compact White Field Triage Clinic with Clean Flat Parapet Roof & Rooftop Red Cross (+)
    addIndustrialFacility(swClinic, swClinic.shell, { x0: -170, z0: 78, x1: -152, z1: 94, h: 6.2, flatRoof: true, wallMat: M.craneWhite, roofMat: M.craneWhite, title: 'SALTLINE FIELD TRIAGE CLINIC', doorSide: 'south', signBg: '#5e1f1c', interiorKind: 'clinic' });
    addBox(horizonRoot, M.redCore, 6.2, .12, 2.0, -161, 6.72, 86); // Rooftop Red Cross horizontal bar (flush on parapet roof!)
    addBox(horizonRoot, M.redCore, 2.0, .12, 6.2, -161, 6.72, 86); // Rooftop Red Cross vertical bar
    addBox(swClinic.detail, M.redCore, 2.4, .65, .20, -161, 5.4, 94.15);
    addBox(swClinic.detail, M.redCore, .65, 2.4, .20, -161, 5.4, 94.15);
    // South-East Quadrant of 03: Iconic Green-and-Yellow Square Medical Helipad (H) (Blueprint 03)
    const heliGreenMat = new MeshStandardMaterial({ color: 0x2f7d46, roughness: .82, metalness: .04 });
    addBox(horizonRoot, heliGreenMat, 20.0, .12, 20.0, -161, .21, 112);
    addBox(horizonRoot, M.yellowPaint, 18.6, .04, .65, -161, .28, 102.8);
    addBox(horizonRoot, M.yellowPaint, 18.6, .04, .65, -161, .28, 121.2);
    addBox(horizonRoot, M.yellowPaint, .65, .04, 18.6, -170.2, .28, 112);
    addBox(horizonRoot, M.yellowPaint, .65, .04, 18.6, -151.8, .28, 112);
    addBox(horizonRoot, M.yellowPaint, 1.35, .05, 8.2, -164.0, .29, 112); // Yellow H left pillar
    addBox(horizonRoot, M.yellowPaint, 1.35, .05, 8.2, -158.0, .29, 112); // Yellow H right pillar
    addBox(horizonRoot, M.yellowPaint, 6.0, .05, 1.35, -161.0, .29, 112); // Yellow H crossbar
    for (const [bx, bz] of [[-170.5, 102.5], [-151.5, 102.5], [-170.5, 121.5], [-151.5, 121.5]]) {
      addBox(swClinic.detail, M.greenSignal, .36, .32, .36, bx, .36, bz);
    }
    // Interactive Clinic Door & Heal Terminal + Area-1 & Poly Haven Props + Southern Pine Belt
    addInteractiveDoor(swClinic.shell, { id: 'clinic-door', labelZh: '战地分诊中心隔离门', x: -161, y: .16, z: 94.1, width: 3.8, height: 3.3, axis: 'x', initiallyOpen: false });
    addInteractiveTerminal(swClinic.shell, {
      id: 'clinic-heal', promptZh: '按 [E] 战地急救台恢复 100% 生命值', x: -155, y: .16, z: 96.5, colorMat: M.greenSignal,
      onUse() {
        world.player?.heal?.(world.player?.maxHealth ?? 100);
        audio?.play?.('rail_touchdown', { pos: new Vector3(-155, 1, 96.5), ref: 14, gain: .42, jitter: .04 });
        world.tactical?.notify?.('🏥 战地急救完成！生命值已恢复至 100%', '🏥 Field triage complete! Health restored to 100%', false, 3.0);
      },
    });
    for (const [lx, lz] of [[-172, 74], [-172, 128], [-150, 98], [-216, 128]]) placePortProp(swClinic, swClinic.detail, 'light_mast', lx, .16, lz, 0);
    placePortProp(swClinic, swClinic.detail, 'forklift', -172, .16, 104, -.4);
    placePortProp(swClinic, swClinic.detail, 'pallet_stack', -172, .16, 114, .1);
    placePortProp(swClinic, swClinic.detail, 'ibc_tote', -194, .16, 82, 0);
    placePortProp(swClinic, swClinic.detail, 'gas_cylinders', -154, .16, 98, 0);
    placePortProp(swClinic, swClinic.detail, 'sandbags', -166, .16, 98, 0);
    addParkedSedan(swClinic.detail, -153, .18, 98, Math.PI / 2, M.whitePaint);
    placeExternal(swClinic.detail, 'modular_industrial_pipes_01', -172.0, .16, 56.0, 0, 1.0);
    placeExternal(swClinic.detail, 'portable_generator', -172.0, .16, 82.0, .6, 1.0);
    placeExternal(swClinic.detail, 'utility_box_01', -152.0, .16, 86.0, Math.PI / 2, 1.0);
    placeExternal(swClinic.detail, 'modular_electricity_poles', -216.0, .16, 78.0, 0, 1.0);
    placeExternal(swClinic.detail, 'concrete_road_barrier', -152.0, .16, 124.0, 0, 1.0);
    placeExternal(swClinic.detail, 'exterior_aircon_unit', -152.0, 2.2, 82.0, Math.PI / 2, 1.0);
    for (const px of [-216, -200, -184, -168, -154]) addPineTree(swClinic.detail, px, .16, 138, 1.15);
    for (const z of [56, 86, 116]) addStreetLamp(swClinic.detail, -142, .02, z, -1);

    spawnShootTarget(swClinic.shell, { id: 'cryo-lock-1', stage: 2, labelZh: '1 号冷雾库锁控箱', pos: new Vector3(-152, 0, 64), tall: false, maxHp: 3 });
    spawnShootTarget(swClinic.shell, { id: 'cryo-lock-2', stage: 2, labelZh: '2 号冷雾库锁控箱', pos: new Vector3(-152, 0, 88), tall: false, maxHp: 3 });

    // Station High-Precision Realistic Human NPCs (createSaltlineHuman) across all Coastal City Districts
    if (typeof window.createSaltlineHuman === 'function') {
      const npcSpecs = [
        { parent: horizonRoot, name: 'city-npc-dock', role: 'worker', pos: [-31, 0, -21], yaw: .6, variation: 0 },
        { parent: city.shell, name: 'city-npc-precinct', role: 'operator', pos: [-14.5, .16, -52], yaw: -1.4, variation: 1 },
        { parent: swClinic.shell, name: 'city-npc-nurse', role: 'medic', pos: [-152, 0, 118], yaw: 1.5, variation: 2 },
        { parent: railWest.shell, name: 'city-npc-rail', role: 'engineer', pos: [-196, 0, 7.5], yaw: 1.2, variation: 0 },
        { parent: mountain.shell, name: 'city-npc-comms', role: 'engineer', pos: [-185, summitY, -75], yaw: 1.6, variation: 1 },
        { parent: southHarbor.shell, name: 'city-npc-keeper', role: 'worker', pos: [7.5, 0, 131], yaw: -2.2, variation: 2 },
      ];
      const cityNpcs = npcSpecs.map(sp => {
        const h = window.createSaltlineHuman(THREE, { name: sp.name, role: sp.role, variation: sp.variation });
        h.actor.position.set(sp.pos[0], sp.pos[1], sp.pos[2]);
        h.actor.rotation.y = sp.yaw;
        sp.parent.add(h.actor);
        return h;
      });
      let npcAge = 0;
      updaters.push(dt => {
        npcAge += dt;
        for (let i = 0; i < cityNpcs.length; i++) cityNpcs[i].pose('stand', 0, npcAge + i * 1.1, false);
      });
    }

    // =========================================================================
    // TIME-OF-DAY & PMREM LIGHTING SYSTEM ([T] KEY — powered by WorldEngine.LightingSystem)
    // =========================================================================
    const origFogColor = scene?.fog?.color?.getHex?.() ?? 0x768d9e;
    const origFogDensity = typeof scene?.fog?.density === 'number' ? scene.fog.density : .0008;
    const skyPresets = lightingSys ? lightingSys.presets : [
      { id: 'native', zh: '🌊 原版海港光影', en: 'Native Harbor', fog: origFogColor, density: Math.min(.0009, origFogDensity), sun: 0xffe0bd, sunInt: 2.4, hemiSky: 0xa8cde6, hemiGnd: 0x4a5459, hemiInt: 1.15 },
      { id: 'noon', zh: '☀️ 晴朗海湾（高细节无雾）', en: 'Clear Daylight', fog: 0x9ec4e2, density: .00035, sun: 0xfffaf0, sunInt: 3.1, hemiSky: 0xcce6ff, hemiGnd: 0x5c6b73, hemiInt: 1.42 },
      { id: 'sunset', zh: '🌇 晚霞黄昏', en: 'Crimson Sunset', fog: 0x9e6a56, density: .00075, sun: 0xffa060, sunInt: 2.65, hemiSky: 0xf4b68e, hemiGnd: 0x47363a, hemiInt: 1.15 },
      { id: 'moonlit', zh: '🌙 月夜清晰港', en: 'Moonlit Harbor', fog: 0x243952, density: .00085, sun: 0x9ec4f0, sunInt: 1.95, hemiSky: 0x5e86b8, hemiGnd: 0x253242, hemiInt: 1.08 },
    ];
    let skyIdx = 0;

    function applySkyPreset(idx, silent = false) {
      if (lightingSys) {
        const p = lightingSys.applyPreset(idx, silent);
        skyIdx = lightingSys.index;
        atmosphereSys?.syncPreset?.(p?.id);
        return p;
      }
      skyIdx = ((idx % skyPresets.length) + skyPresets.length) % skyPresets.length;
      const p = skyPresets[skyIdx];
      atmosphereSys?.syncPreset?.(p?.id);
      if (scene) {
        if (scene.fog) {
          scene.fog.color?.setHex?.(p.fog);
          if (typeof scene.fog.density === 'number') scene.fog.density = p.density;
        }
        scene.traverse?.(obj => {
          if (obj.isDirectionalLight) { obj.color?.setHex?.(p.sun); obj.intensity = p.sunInt; }
          else if (obj.isHemisphereLight) { obj.color?.setHex?.(p.hemiSky); obj.groundColor?.setHex?.(p.hemiGnd); obj.intensity = p.hemiInt; }
        });
      }
      if (!silent) world.tactical?.notify?.(`🌤️ 氛围光影已切换：${p.zh}（按 T 键随时切换）`, `🌤️ Atmosphere: ${p.en}`, false, 2.8);
      return p;
    }

    // =========================================================================
    // CINEMATIC COD-STYLE ACT TITLE CARD + 《失联名单》 RADIO DRAMA + GARRISON SQUADS
    // =========================================================================
    const actCard = document.createElement('div');
    actCard.className = 'sl-act-card';
    actCard.innerHTML = `<div class="sl-act-kicker" data-k></div><div class="sl-act-title" data-t></div><div class="sl-act-sub" data-s></div>`;
    document.body.appendChild(actCard);
    let actCardTimer = null;

    const actScripts = [
      {
        kicker: 'ACT I · 05:34 · BERTH 4 HARBOR',
        title: '四号泊位 · 失联名单',
        sub: '摧毁 2 座铁砧防空干扰塔，核验老霍克 05:31/05:34 篡改记录',
        radio: '玛拉：「林恩，老霍克 05:34 还签了值班条，里德却把回执改成 05:31 离港！先打爆两座干扰塔，我掩护你突围！」',
        spawns: [['hound', -10, 0, -12], ['hound', 10, 0, 6]],
      },
      {
        kicker: 'ACT II · COASTAL CITY BOULEVARD',
        title: '沿海城区 · 高速撞卡',
        sub: '驾驶 SAR 四驱车高速撞碎铁砧十字路口路障',
        radio: '沃德（敌方频道截获）：「05:50 搜救艇已召回！封死沿海主干道，绝不准他们把十七人名单带进市区！」',
        spawns: [['hound', -22, 0, -68], ['hound', -30, 0, -82], ['gull', -26, 12, -74]],
      },
      {
        kicker: 'ACT III · SW COLD-STORAGE & CLINIC',
        title: '西南冷雾库 · 雷暴急救',
        sub: '沿西线内陆大道南下，击毁 2 台冷库锁控箱解救医疗样本与第 17 人记录',
        radio: '玛拉：「我哥托马斯·万斯的名字单独登在第十七人档案里——就在西南冷雾库和战地分诊中心！快打掉冷库锁控箱！」',
        spawns: [['hound', -146, 0, 70], ['hound', -144, 0, 96], ['gull', -154, 12, 78]],
      },
      {
        kicker: 'ACT IV · WEST RAIL FREIGHT YARD',
        title: '西区铁路货场 · 截停专列',
        sub: '北上进入西区铁路货场，炸毁 2 处铁路编组信号闸迫停铁砧证物专列',
        radio: '玛拉：「铁砧下达了针对证人的拦截命令！货运专列正准备转移原始货单，炸毁两处信号闸拦停它！」',
        spawns: [['hound', -142, 0, -6], ['hound', -184, 0, 12], ['gull', -164, 13, 0]],
      },
      {
        kicker: 'ACT V · WEST MOUNTAIN RIDGE +14M',
        title: '西岸山地卫星站 · 登顶狙击',
        sub: '沿西线盘山公路爬升 +14m 登顶，狙击 3 个卫星散热芯劫持雷达',
        radio: '沃德：「你们已经无路可逃！山顶卫星正在向总部发送清场授权——全员守住雷达站！」',
        spawns: [['hound', -180, 14, -84], ['hound', -182, 14, -70], ['gull', -190, 26, -78]],
      },
      {
        kicker: 'ACT VI · EAST SEA STORM SURGE',
        title: '12 米海啸 · 高地求生',
        sub: '铁砧炸毁防潮闸！在 +14m 西岸山顶俯瞰 12 米东海巨浪吞没港区',
        radio: '玛拉：「他们炸了南防潮闸！12 米风暴潮正从东海扑向四号泊位——死守山顶高地 12 秒！」',
        spawns: [],
      },
      {
        kicker: 'ACT VII · SOUTH DRYDOCK & HEADLAND',
        title: '南港船坞 · 炮火点灯',
        sub: '顶着炮火南下旧船坞与南角灯塔，炸毁干扰器重启 22 米海湾灯塔',
        radio: '玛拉：「救援舰队已在东海雾外待命，但南角灯塔被铁砧切断了电源！冲向南港岸角重启灯塔！」',
        spawns: [['hound', -14, 0, 118], ['hound', 6, 0, 126], ['gull', 0, 14, 130]],
      },
      {
        kicker: 'ACT VIII · NW COASTAL AIRFIELD',
        title: '海岸应急机场 · 跑道撤离',
        sub: '全速北上西北机场，沿跑道穿过炮火冲进拱形机库完成撤离',
        radio: '玛拉：「灯塔亮了，十七人失联名单已传回海事局！油门踩到底，冲进西北机场拱形机库撤离！」',
        spawns: [['hound', -154, 0, -174], ['gull', -168, 14, -182]],
      },
    ];

    function showActCard(idx) {
      const sc = actScripts[idx];
      if (!sc || freeRoam) return;
      actCard.querySelector('[data-k]').textContent = sc.kicker;
      actCard.querySelector('[data-t]').textContent = sc.title;
      actCard.querySelector('[data-s]').textContent = sc.sub;
      actCard.classList.add('show');
      if (actCardTimer) clearTimeout(actCardTimer);
      actCardTimer = setTimeout(() => actCard.classList.remove('show'), 3800);
      if (sc.radio) {
        world.hud?.radio?.(sc.radio, 6.5);
        world.berthSlice?.companion?.speak?.(sc.radio, sc.radio, false);
      }
    }

    function spawnStageDefenders(idx) {
      if (freeRoam || world.developer?.flags?.noEnemies) return;
      const sc = actScripts[idx];
      if (!sc?.spawns?.length || typeof world.enemies?.spawn !== 'function') return;
      for (const [type, x, y, z] of sc.spawns) {
        try {
          world.enemies.spawn(type, new Vector3(x, y, z), { state: 'alert', target: world.player?.pos ?? new Vector3(x, y, z) });
        } catch {}
      }
    }

    // =========================================================================
    // DUAL MODE: OPEN WORLD SIGHTSEEING (freeRoam) <-> 8-ACT CITY CAMPAIGN
    // =========================================================================
    const urlParams = typeof location !== 'undefined' ? new URLSearchParams(location.search) : null;
    let freeRoam = !!(window.SALTLINE_OPEN_WORLD_ROAM || urlParams?.get('mode') === 'openworld');
    let cityCampaignActive = false; // Explicitly activated via [M] Map or Dev Menu; NEVER hijacks Berth 4 main story!
    let photoMode = false;
    const isMainStoryActive = () => !cityCampaignActive && !freeRoam && Boolean(world.game?.campaign);
    function syncOpenWorldMissionProps() {
      const showProps = cityCampaignActive && !freeRoam;
      jammerRoot.visible = showProps;
      for (const t of shootTargets) t.group.visible = showProps && t.alive;
      for (const rb of roadblockProps) rb.mesh.visible = showProps && rb.intact;
    }
    syncOpenWorldMissionProps();
    const discoveredLandmarks = new Set();

    const photoPill = document.createElement('div');
    photoPill.className = 'sl-photo-pill';
    photoPill.textContent = '📷 赏景摄影模式 · 按 [V] 恢复界面 · 按 [T] 切换天色';
    const interactPrompt = document.createElement('div');
    interactPrompt.className = 'sl-interact-prompt';
    document.body.append(photoPill, interactPrompt);

    function setPhotoMode(on) {
      photoMode = typeof on === 'boolean' ? on : !photoMode;
      hud.classList.toggle('photo-hidden', photoMode);
      minimap.classList.toggle('photo-hidden', photoMode);
      pinLayer.classList.toggle('photo-hidden', photoMode);
      guideStripEl.classList.toggle('photo-hidden', photoMode);
      photoPill.classList.toggle('on', photoMode);
      const uiRoot = document.getElementById('ui');
      if (uiRoot) uiRoot.style.opacity = photoMode ? '0' : '1';
    }

    function setFreeRoam(enabled, announceChange = true) {
      freeRoam = !!enabled;
      window.SALTLINE_OPEN_WORLD_ROAM = freeRoam;
      if (freeRoam) {
        cityCampaignActive = false;
        syncOpenWorldMissionProps();
        actCard.classList.remove('show');
        world.enemies?.clear?.();
        if (world.developer?.flags) world.developer.flags.noEnemies = true;
        if (announceChange) {
          world.tactical?.notify?.('🌏 已进入「开放世界·自由漫游」模式！[E] 交互 · [F] 开车 · [M] 地图',
            '🌏 Open World Free-Roam Active! [E] Interact · [F] Drive · [M] Map', false, 5.0);
        }
      } else {
        cityCampaignActive = true;
        syncOpenWorldMissionProps();
        if (world.developer?.flags) world.developer.flags.noEnemies = false;
        if (announceChange) {
          showActCard(stage);
          spawnStageDefenders(stage);
        }
      }
      if (mapOpen) renderMapEntries(world.player?.pos);
    }

    // =========================================================================
    // 7-DISTRICT METADATA (STRICTLY x <= +26 REAL INLAND COASTAL CITY!)
    // =========================================================================
    const districts = [
      { id: 'berth', nameZh: '01 四号泊位核心港区', nameEn: 'Berth 4 Harbor', scenic: '真实岸线与集装箱货轮泊位', pos: new Vector3(-26, .1, -24), rect: [-107, -30, 133, 58], color: '#2b6d8a' },
      { id: 'city', nameZh: '02 沿海城区与滨海长廊', nameEn: 'Coastal City & Seafront', scenic: '东海观景长廊与可进入调度楼', pos: new Vector3(-26, .1, -68), rect: [-106, -145, 130, 115], color: '#355c75' },
      { id: 'sw_clinic', nameZh: '03 西南冷雾库·战地医院', nameEn: 'SW Cold-Storage & Clinic', scenic: '可开门分诊医院、急救台与停机坪', pos: new Vector3(-134, .1, 76), rect: [-222, 35, 115, 110], color: '#3e636b' },
      { id: 'rail_west', nameZh: '04 西区铁路货场编组站', nameEn: 'West Rail Freight Yard', scenic: '双轨货运专线与 12m 信号控制塔', pos: new Vector3(-130, .1, 5), rect: [-222, -35, 115, 70], color: '#6b4d38' },
      { id: 'mountain', nameZh: '05 西岸山地卫星站 (+14m)', nameEn: 'Mountain Comms (+14m)', scenic: '背山面海 +14m 制高点俯瞰全城东海', pos: new Vector3(-174, 14.1, -78), rect: [-221, -119, 111, 82], color: '#336145' },
      { id: 'south_harbor', nameZh: '06 南港旧船坞与岸角灯塔', nameEn: 'South Drydock & Lighthouse', scenic: '贴岸旧船坞、防潮闸与 22m 海角灯塔', pos: new Vector3(-26, .1, 116), rect: [-106, 28, 130, 117], color: '#2c5e69' },
      { id: 'airfield', nameZh: '07 海岸应急机场与机库', nameEn: 'Coastal Airfield', scenic: '西北跑道、航管塔台与可开闭机库', pos: new Vector3(-166, .1, -172), rect: [-222, -222, 112, 100], color: '#46506e' },
    ];

    const stageStarts = [
      { zh: '1/8 泊位破局 · 炸干扰塔+炮艇坍塌', en: '1/8 Berth 4 Jammers', pos: new Vector3(-16, .1, -16) },
      { zh: '2/8 城区撞卡 · 四驱车冲破路障', en: '2/8 City Roadblock', pos: new Vector3(-26, .1, -46) },
      { zh: '3/8 西南冷雾 · 解锁医疗样本+雷暴', en: '3/8 SW Cold Storage', pos: new Vector3(-138, .1, 74) },
      { zh: '4/8 西区货场 · 炸信号闸+油罐连爆', en: '4/8 West Rail Yard', pos: new Vector3(-124, .1, 5) },
      { zh: '5/8 西岸山顶 · 登+14m劫持大锅雷达', en: '5/8 Mountain Comms', pos: new Vector3(-172, 14.1, -78) },
      { zh: '6/8 洪峰求生 · 12米东海海啸避险', en: '6/8 Tsunami Survival', pos: new Vector3(-174, 14.1, -78) },
      { zh: '7/8 南港点灯 · 炮火下重启岸角灯塔', en: '7/8 Lighthouse Restore', pos: new Vector3(-26, .1, 108) },
      { zh: '8/8 跑道撤离 · 冲进西北机场机库', en: '8/8 Airfield Exfil', pos: new Vector3(-130, .1, -172) },
    ];

    let customGpsTarget = null;
    let mapOpen = false;
    let activeInteractable = null;
    const local = (en, zh) => window.SaltlineLocale?.t(en, zh) ?? zh;

    const mapOverlay = document.createElement('div');
    mapOverlay.className = 'sl-map-overlay';
    mapOverlay.innerHTML = `
      <div class="sl-map-card">
        <div class="sl-map-header">
          <div>
            <div class="sl-map-title">盐线市海滨全城地图 [M] · 东海净空 / 西岸连续陆地</div>
            <div class="sl-map-sub">右侧深蓝为纯开放东海（零乱建）· 左侧为两纵三横 7 大连通区 · 点击任意区设 GPS 或快速传送</div>
          </div>
          <div class="sl-map-top-btns">
            <button class="sl-map-mode-btn" data-toggle-mode></button>
            <button class="sl-map-close" data-sky-btn>🌤️ 切天色 [T]</button>
            <button class="sl-map-close" data-close>关闭 [M]</button>
          </div>
        </div>
        <div class="sl-map-canvas">
          <svg viewBox="-236 -236 300 396" preserveAspectRatio="xMidYMid meet">
            <!-- Open East Sea on the right (x > +26) -->
            <rect x="26" y="-236" width="60" height="396" fill="#072233"/>
            <line x1="26" y1="-236" x2="26" y2="160" stroke="#5ccbe0" stroke-width="2" stroke-dasharray="6 4"/>
            <text x="45" y="-40" fill="#529ab0" font-size="10" font-weight="700" writing-mode="tb">东海航道 · 纯开放海域</text>
            <!-- North-South Central Rail Corridor & Twin Tunnel + South Drydock Basin -->
            <g stroke="#90a4ae" stroke-width="3" stroke-dasharray="5 3" fill="none" opacity="0.85">
              <line x1="-133" y1="-115" x2="-133" y2="144"/>
              <line x1="-140" y1="-115" x2="-140" y2="144"/>
            </g>
            <rect x="-6" y="80" width="32" height="24" fill="#072233" stroke="#5ccbe0" stroke-width="1.2"/>
            <!-- Coastal City Road Network & Level Crossing -->
            <g stroke="#d4aa4c" stroke-width="4.5" stroke-linecap="round" fill="none" opacity="0.82">
              <line x1="-26" y1="-140" x2="-26" y2="140"/>
              <line x1="-112" y1="-140" x2="-112" y2="132"/>
              <line x1="-170" y1="-125" x2="20" y2="-125"/>
              <line x1="-206" y1="5" x2="-26" y2="5"/>
              <line x1="-166" y1="42" x2="18" y2="42"/>
              <line x1="-200" y1="122" x2="-26" y2="122"/>
              <line x1="-112" y1="-78" x2="-174" y2="-78"/>
            </g>
            <g data-zones></g>
            <circle data-mission cx="0" cy="0" r="10" fill="none" stroke="#58e8ff" stroke-width="2.5" style="display:none"/>
            <circle data-gps cx="0" cy="0" r="8" fill="none" stroke="#ffd859" stroke-width="2.5" stroke-dasharray="4 3" style="display:none"/>
            <g data-player transform="translate(-26,-24)">
              <circle r="7" fill="rgba(88,232,255,0.28)"/>
              <circle r="3.6" fill="#58e8ff" stroke="#ffffff" stroke-width="1.4"/>
            </g>
          </svg>
        </div>
        <div class="sl-map-side" data-list></div>
      </div>
    `;
    document.body.appendChild(mapOverlay);
    const mapZonesG = mapOverlay.querySelector('[data-zones]');
    const mapListEl = mapOverlay.querySelector('[data-list]');
    const mapPlayerG = mapOverlay.querySelector('[data-player]');
    const mapMissionC = mapOverlay.querySelector('[data-mission]');
    const mapGpsC = mapOverlay.querySelector('[data-gps]');
    const mapModeBtn = mapOverlay.querySelector('[data-toggle-mode]');

    mapModeBtn.addEventListener('click', () => setFreeRoam(!freeRoam, true));
    mapOverlay.querySelector('[data-sky-btn]').addEventListener('click', () => applySkyPreset(skyIdx + 1));

    function movePlayerAndVehicle(pos, bringTruckNear = false) {
      if (world.player?.pos) {
        world.player.pos.copy(pos);
        if (world.player.vel) world.player.vel.set(0, 0, 0);
      }
      if (world.vehicle?.setPosition) {
        if (world.vehicle.driving) world.vehicle.setPosition(pos);
        else if (bringTruckNear) world.vehicle.setPosition(new Vector3(pos.x + 5.5, pos.y, pos.z + 3.5));
      }
    }

    function teleportToDistrict(d) {
      movePlayerAndVehicle(d.pos, true);
      toggleMap(false);
      world.tactical?.notify?.(`⚡ 已快速传送至：${d.nameZh}（四驱车已同步就位）`, `⚡ Fast-traveled to: ${d.nameEn}`, false, 3.2);
    }

    function setGpsDistrict(d) {
      customGpsTarget = d.pos.clone();
      toggleMap(false);
      world.tactical?.notify?.(`📍 GPS 导航光柱已锁定：${d.nameZh}`, `📍 GPS Beacon locked: ${d.nameEn}`, false, 3.8);
    }

    function renderMapEntries(playerPos) {
      mapModeBtn.textContent = freeRoam ? '🌏 当前：自由漫游（点此启动全城 8 幕战役）' : (cityCampaignActive ? '🔥 当前：全城 8 幕战役（点此切自由漫游）' : '🎬 当前：四号泊位主线剧情（点此切自由漫游）');
      mapZonesG.innerHTML = '';
      mapListEl.innerHTML = '';
      for (const d of districts) {
        const sec = sectors.find(s => s.id === d.id);
        const isLoaded = d.id === 'berth' || !!sec?.loaded;
        const [rx, rz, rw, rh] = d.rect;
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'sl-map-zone-btn');
        g.innerHTML = `
          <rect x="${rx}" y="${rz}" width="${rw}" height="${rh}" rx="6"
            fill="${d.color}" fill-opacity="${isLoaded ? '0.48' : '0.22'}"
            stroke="${isLoaded ? '#66d9f0' : 'rgba(255,255,255,0.28)'}" stroke-width="${isLoaded ? '2.2' : '1.2'}"/>
          <text x="${rx + rw / 2}" y="${rz + rh / 2 + 3}" text-anchor="middle" fill="#eef9fc" font-size="10.5" font-weight="700">${d.nameZh.slice(3, 10)}</text>
        `;
        g.addEventListener('click', () => setGpsDistrict(d));
        mapZonesG.appendChild(g);

        const item = document.createElement('div');
        item.className = 'sl-map-item' + (isLoaded ? ' active' : '');
        item.innerHTML = `
          <div class="sl-map-item-top">
            <span>${d.nameZh}</span>
            <span class="sl-map-badge ${isLoaded ? 'loaded' : ''}">${d.id === 'berth' ? '核心常驻' : (isLoaded ? '已加载' : '远景可见')}</span>
          </div>
          <div style="font-size:11px;color:#99b7c1">${d.scenic}</div>
          <div class="sl-map-actions">
            <button class="sl-map-btn" data-gps-btn>📍 设 GPS 导航</button>
            <button class="sl-map-btn tp" data-tp-btn>⚡ 快速传送</button>
          </div>
        `;
        item.querySelector('[data-gps-btn]').addEventListener('click', () => setGpsDistrict(d));
        item.querySelector('[data-tp-btn]').addEventListener('click', () => teleportToDistrict(d));
        mapListEl.appendChild(item);
      }
      if (playerPos) mapPlayerG.setAttribute('transform', `translate(${playerPos.x.toFixed(1)},${playerPos.z.toFixed(1)})`);
      const mInfo = currentObjectiveInfo();
      if (!freeRoam && mInfo.pos) {
        mapMissionC.style.display = '';
        mapMissionC.setAttribute('cx', mInfo.pos.x.toFixed(1));
        mapMissionC.setAttribute('cy', mInfo.pos.z.toFixed(1));
      } else mapMissionC.style.display = 'none';
      if (customGpsTarget) {
        mapGpsC.style.display = '';
        mapGpsC.setAttribute('cx', customGpsTarget.x.toFixed(1));
        mapGpsC.setAttribute('cy', customGpsTarget.z.toFixed(1));
      } else mapGpsC.style.display = 'none';
    }

    function toggleMap(force) {
      mapOpen = typeof force === 'boolean' ? force : !mapOpen;
      mapOverlay.classList.toggle('open', mapOpen);
      if (mapOpen) {
        try { document.exitPointerLock?.(); } catch {}
        renderMapEntries(world.player?.pos);
      }
    }
    mapOverlay.querySelector('[data-close]').addEventListener('click', () => toggleMap(false));

    // 6-Viewpoint Acceptance Inspection Tour ([B] key) with live FPS / Frame Time / Draw Calls / Triangles / GPU Memory report
    const inspectViews = [
      { name: '1/6 白天城市街道', pos: new Vector3(-26, 2.2, -58), sky: 1 },
      { name: '2/6 建筑近距离细节', pos: new Vector3(-34, 3.2, -96), sky: 1 },
      { name: '3/6 城市天际线', pos: new Vector3(20, 14.0, -34), sky: 1 },
      { name: '4/6 工业区域', pos: new Vector3(-164, 5.5, 74), sky: 1 },
      { name: '5/6 自然地形与森林', pos: new Vector3(-174, 15.2, -78), sky: 1 },
      { name: '6/6 夜间环境', pos: new Vector3(-26, 3.5, -72), sky: 3 },
    ];
    let inspectIdx = -1;
    function jumpInspectView(idx) {
      inspectIdx = ((idx % inspectViews.length) + inspectViews.length) % inspectViews.length;
      const v = inspectViews[inspectIdx];
      applySkyPreset(v.sky, true);
      movePlayerAndVehicle(v.pos, false);
      const st = chunkMgr?.getStats?.();
      const statsStr = st ? ` | ${st.fps} FPS (${st.frameTimeMs}ms) · DC ${st.drawCalls} · Tri ${st.triangles} · Geo ${st.gpuGeometries} · Tex ${st.gpuTextures}` : '';
      world.tactical?.notify?.(`📸 验收视角 ${v.name}${statsStr}`, `Inspect ${v.name}${statsStr}`, false, 5.5);
      return { view: v.name, stats: st };
    }
    if (typeof window !== 'undefined') window.SALTLINE_INSPECT_VIEW = jumpInspectView;

    const onKeyDown = e => {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.code === 'KeyM') { e.preventDefault(); toggleMap(); }
      else if (e.code === 'KeyT' && !e.repeat) { e.preventDefault(); applySkyPreset(skyIdx + 1); }
      else if (e.code === 'KeyV' && !e.repeat) { e.preventDefault(); setPhotoMode(); }
      else if (e.code === 'KeyB' && !e.repeat) { e.preventDefault(); jumpInspectView(inspectIdx + 1); }
      else if (e.code === 'KeyE' && !e.repeat && activeInteractable) { activeInteractable.use(); }
      else if (e.code === 'Escape' && mapOpen) { e.preventDefault(); toggleMap(false); }
    };
    window.addEventListener('keydown', onKeyDown);

    // =========================================================================
    // 8-ACT CONNECTED COASTAL CITY CAMPAIGN ("盐线市·失联名单")
    // =========================================================================
    const beaconMat = new MeshBasicMaterial({ color: 0x56cfe6, transparent: true, opacity: .28, depthWrite: false });
    const skyBeacon = new Mesh(new CylinderGeometry(.72, .72, 48, 12, 1, true), beaconMat);
    root.add(skyBeacon);

    let stage = 0;
    let tsunamiSurviveClock = 0, runwayArtilleryClock = 0, bridgeBarrageTriggered = false, introActShown = false;
    const rayOrigin = new Vector3(), rayDir = new Vector3(), toTgt = new Vector3(), up = new Vector3(0, 1, 0);

    function advanceToStage(nextStage) {
      stage = nextStage;
      if (nextStage < 8) {
        showActCard(nextStage);
        spawnStageDefenders(nextStage);
      }
    }

    function jumpToStage(targetStage) {
      freeRoam = false;
      cityCampaignActive = true;
      window.SALTLINE_OPEN_WORLD_ROAM = false;
      if (world.developer?.flags) world.developer.flags.noEnemies = false;
      const idx = Math.max(0, Math.min(7, Number(targetStage) || 0));
      stage = idx;
      customGpsTarget = null;
      bridgeBarrageTriggered = false;
      tsunamiSurviveClock = idx === 5 ? 12.0 : 0;
      for (const t of shootTargets) {
        t.alive = t.stage >= idx;
        t.hp = t.maxHp;
        t.group.visible = t.alive;
      }
      for (const rb of roadblockProps) {
        rb.intact = idx <= 1;
        rb.mesh.visible = rb.intact;
      }
      const st = stageStarts[idx];
      if (st) movePlayerAndVehicle(st.pos, true);
      if (idx === 5) world.disasters?.triggerTsunami?.();
      if (idx === 6) world.disasters?.triggerArtilleryBarrage?.();
      showActCard(idx);
      spawnStageDefenders(idx);
    }

    function hitTarget(t) {
      if (!t.alive || freeRoam || !cityCampaignActive) return;
      t.hp--;
      fx?.sparks?.(t.pos, up, 20);
      audio?.play?.('rail_touchdown', { pos: t.pos, ref: 20, gain: .55, jitter: .1 });
      world.player?.addShake?.(.14);
      if (t.hp > 0) {
        fx?.smoke?.(t.pos, { size: 1.8, life: 2.5, color: 0x3b3530, alpha: .55, rise: .8, count: 3 });
        world.tactical?.notify?.(`🎯 命中「${t.labelZh}」装甲！（剩余耐久 ${t.hp}/${t.maxHp}）`, `🎯 Hit ${t.id}! Armor ${t.hp}/${t.maxHp}`, false, 2.0);
        return;
      }
      t.alive = false;
      t.group.visible = false;
      fx?.smoke?.(t.pos, { size: 4.6, life: 5.5, color: 0x26211d, alpha: .74, rise: 1.3, count: 10 });
      fx?.sparks?.(t.pos, up, 42);
      fx?.debris?.(t.pos, { count: 18 });
      audio?.play?.('rail_touchdown', { pos: t.pos, ref: 30, gain: .95, jitter: .05 });
      world.player?.addShake?.(.56);

      const rem = shootTargets.filter(x => x.stage === stage && x.alive).length;
      if (stage === 0) {
        if (rem > 0) world.tactical?.notify?.(`💥 ${t.labelZh}已摧毁！还剩 ${rem} 座干扰塔`, `💥 Jammer down! ${rem} left!`, true, 4.0);
        else { advanceToStage(1); world.berthSlice?.triggerClimaxSetPiece?.(); }
      } else if (stage === 2) {
        if (rem > 0) world.tactical?.notify?.(`❄️ ${t.labelZh}已击毁！还剩 ${rem} 台！`, `❄️ Cryo-lock down! ${rem} left!`, false, 3.8);
        else { advanceToStage(3); world.disasters?.triggerLightningStorm?.(); }
      } else if (stage === 3) {
        if (rem > 0) world.tactical?.notify?.(`🚂 ${t.labelZh}已炸毁！还剩 ${rem} 处！`, `🚂 Rail breaker down! ${rem} left!`, false, 3.8);
        else { advanceToStage(4); world.disasters?.triggerFuelChainBlast?.(); }
      } else if (stage === 4) {
        if (rem > 0) world.tactical?.notify?.(`🎯 ${t.labelZh}已击毁！还剩 ${rem} 个！`, `🎯 Cooling core down! ${rem} left!`, false, 3.8);
        else { tsunamiSurviveClock = 12.0; advanceToStage(5); world.disasters?.triggerTsunami?.(); }
      } else if (stage === 6) {
        if (rem > 0) world.tactical?.notify?.(`🚨 ${t.labelZh}已摧毁！还剩 ${rem} 座！`, `🚨 Lighthouse jammer down! ${rem} left!`, false, 3.8);
        else advanceToStage(7);
      }
    }

    world.events?.on?.('weapon:fire', () => {
      if (!world.camera || freeRoam || !cityCampaignActive) return;
      world.camera.getWorldPosition(rayOrigin);
      world.camera.getWorldDirection(rayDir);
      let best = null, bestDist = 120;
      for (const t of shootTargets) {
        if (!t.alive || t.stage !== stage) continue;
        toTgt.subVectors(t.pos, rayOrigin);
        const proj = toTgt.dot(rayDir);
        if (proj < .5 || proj > bestDist) continue;
        const perpSq = toTgt.lengthSq() - proj * proj;
        if (perpSq <= t.radius * t.radius) { best = t; bestDist = proj; }
      }
      if (best) hitTarget(best);
    });

    // Real Drone Explosion Splash Damage (fixes drones exploding with zero damage!)
    let droneBlastGuard = false;
    world.events?.on?.('enemy:killed', ev => {
      if (droneBlastGuard) return;
      const enemy = ev?.enemy;
      const type = ev?.type || enemy?.type;
      if (type === 'hound') return;
      const blastPos = ev?.pos || enemy?.pos;
      if (!blastPos) return;
      droneBlastGuard = true;
      try {
        const radius = 6.5;
        fx?.smoke?.(blastPos, { size: 3.6, life: 3.5, color: 0x26201c, alpha: .72, rise: 1.1, count: 8 });
        fx?.sparks?.(blastPos, up, 32);
        fx?.debris?.(blastPos, { count: 14 });
        audio?.play?.('explosion', { pos: blastPos, ref: 24, gain: .88, jitter: .08 });
        if (world.player?.alive && world.player.pos) {
          const pd = world.player.pos.distanceTo(blastPos);
          if (pd < radius) {
            const dmg = Math.round(32 * (1 - pd / radius));
            if (dmg > 2) world.player.damage?.(dmg, blastPos);
            world.player.addShake?.(Math.max(.18, (1 - pd / radius) * .55));
          }
        }
        for (const other of world.enemies?.list ?? []) {
          if (!other?.alive || other === enemy || !other.pos) continue;
          const ed = other.pos.distanceTo(blastPos);
          if (ed < radius) {
            const dmg = Math.round(65 * (1 - ed / radius));
            if (dmg > 4) other.damage?.(dmg, blastPos, up, 'explosion');
          }
        }
      } finally { droneBlastGuard = false; }
    });

    // Start hidden until active gameplay (NEVER blocks the Main Title Menu!)
    const hud = document.createElement('div');
    hud.className = 'sl-world-hud sl-menu-hidden';
    hud.innerHTML = `<div class="sl-world-zone" data-zone>当前区域：四号泊位核心港区</div><div data-perf>FPS --</div><div class="sl-stealth-pill" data-stealth>🟢 隐蔽潜行 · 东海净空</div><div class="sl-world-op" data-op></div><div class="sl-world-hint">[E] 交互 · [G] 召唤四驱车 · [M] 地图 · [T] 光影</div>`;
    document.body.appendChild(hud);
    const zoneEl = hud.querySelector('[data-zone]');
    const perfEl = hud.querySelector('[data-perf]');
    const stealthEl = hud.querySelector('[data-stealth]');
    const opEl = hud.querySelector('[data-op]');

    // Live GTA / 异环-Style Corner Minimap (Strict x <= +26 Coastline, hidden on Main Menu!)
    const minimap = document.createElement('div');
    minimap.className = 'sl-minimap sl-menu-hidden';
    minimap.title = '点击或按 [M] 打开全城战术大地图';
    minimap.innerHTML = `
      <div class="sl-minimap-head"><span>盐线市雷达 (东海净空)</span><span>[M]</span></div>
      <svg viewBox="-236 -236 300 396" preserveAspectRatio="xMidYMid meet">
        <rect x="26" y="-236" width="60" height="396" fill="#072233"/>
        <line x1="26" y1="-236" x2="26" y2="160" stroke="#5ccbe0" stroke-width="2.5"/>
        <g stroke="#d4aa4c" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.85">
          <line x1="-26" y1="-140" x2="-26" y2="140"/><line x1="-112" y1="-140" x2="-112" y2="132"/>
          <line x1="-170" y1="-125" x2="20" y2="-125"/><line x1="-206" y1="5" x2="-26" y2="5"/>
          <line x1="-166" y1="42" x2="18" y2="42"/><line x1="-112" y1="-78" x2="-174" y2="-78"/>
        </g>
        <g data-mm-zones></g>
        <line data-mm-route x1="0" y1="0" x2="0" y2="0" stroke="#58e8ff" stroke-width="4" stroke-dasharray="7 5" style="display:none"/>
        <circle data-mm-target cx="0" cy="0" r="9" fill="none" stroke="#ffd859" stroke-width="3.5" style="display:none"/>
        <g data-mm-player transform="translate(-26,-24)">
          <polygon points="0,-13 8,10 0,5 -8,10" fill="#58e8ff" stroke="#ffffff" stroke-width="2"/>
        </g>
      </svg>
    `;
    minimap.addEventListener('click', () => toggleMap(true));
    document.body.appendChild(minimap);
    const mmZonesG = minimap.querySelector('[data-mm-zones]');
    for (const d of districts) {
      const [rx, rz, rw, rh] = d.rect;
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', rx); rect.setAttribute('y', rz); rect.setAttribute('width', rw); rect.setAttribute('height', rh);
      rect.setAttribute('rx', 6); rect.setAttribute('fill', d.color); rect.setAttribute('fill-opacity', '0.36');
      rect.setAttribute('stroke', 'rgba(255,255,255,0.32)'); rect.setAttribute('stroke-width', '2');
      mmZonesG.appendChild(rect);
    }
    const mmPlayerG = minimap.querySelector('[data-mm-player]');
    const mmRouteL = minimap.querySelector('[data-mm-route]');
    const mmTargetC = minimap.querySelector('[data-mm-target]');

    // 3D Horizon Landmark Pins (hidden on Main Menu!)
    const pinLayer = document.createElement('div');
    pinLayer.className = 'sl-pin-layer sl-menu-hidden';
    document.body.appendChild(pinLayer);
    const landmarkIcons = { berth: '⚓', city: '🏙️', sw_clinic: '🏥', rail_west: '🚂', mountain: '⛰️', south_harbor: '🗼', airfield: '✈️' };
    const landmarkPins = districts.map(d => {
      const el = document.createElement('div');
      el.className = 'sl-pin';
      el.innerHTML = `${landmarkIcons[d.id] || '📍'} ${d.nameZh.slice(3, 9)}<b data-dist></b>`;
      pinLayer.appendChild(el);
      const anchor = new Vector3(d.rect[0] + d.rect[2] / 2, d.id === 'mountain' || d.id === 'south_harbor' ? 24 : 16, d.rect[1] + d.rect[3] / 2);
      return { d, el, distEl: el.querySelector('[data-dist]'), anchor };
    });
    const projTmp = new Vector3();
    const objPinEl = document.createElement('div');
    objPinEl.className = 'sl-obj-pin sl-menu-hidden';
    const guideStripEl = document.createElement('div');
    guideStripEl.className = 'sl-guide-strip sl-menu-hidden';
    document.body.append(objPinEl, guideStripEl);

    if (freeRoam) setFreeRoam(true, false);

    let fpsSmooth = 60, hudTimer = 0, aliveClock = 0;

    function syncColliders(sec, enable) {
      if (!physics?.addBox || !physics?.removeBox) return;
      if (enable && !sec.activeColliders.length) {
        for (const c of sec.colliderSpecs) sec.activeColliders.push(physics.addBox(c.min, c.max, { surface: c.surface }));
      } else if (!enable && sec.activeColliders.length) {
        for (const b of sec.activeColliders.splice(0)) physics.removeBox(b);
      }
    }
    const chunkMgr = WE?.createChunkManager ? WE.createChunkManager({ renderer: world.renderer, sectors, syncColliders, targetFps: 55 }) : null;

    function detectZoneObj(pos) {
      if (!pos) return districts[0];
      if (pos.x < -107) {
        if (pos.z < -120) return districts[6]; // airfield
        if (pos.z < -35) return districts[4];  // mountain
        if (pos.z > 35) return districts[2];   // sw_clinic
        return districts[3];                   // rail_west
      }
      if (pos.z < -30) return districts[1];    // city
      if (pos.z > 28) return districts[5];     // south_harbor
      return districts[0];                     // berth
    }

    function currentObjectiveInfo() {
      if (freeRoam) {
        return { pos: null, zh: `🌏 开放世界自由漫游 · 天色：${skyPresets[skyIdx].zh} · 已探索 ${discoveredLandmarks.size}/7 区`, en: `🌏 Open World Free-Roam · ${skyPresets[skyIdx].en} · ${discoveredLandmarks.size}/7` };
      }
      if (stage === 0) {
        const next = shootTargets.find(t => t.stage === 0 && t.alive);
        const done = 2 - shootTargets.filter(t => t.stage === 0 && t.alive).length;
        return { pos: next?.pos, zh: `ACT I (1/8)：击毁四号泊位干扰塔 (${done}/2)`, en: `ACT I (1/8): Destroy Berth Jammers (${done}/2)` };
      }
      if (stage === 1) return { pos: new Vector3(-26, .5, -76), zh: 'ACT II (2/8)：北门按 [F] 开四驱车撞穿城区路障', en: 'ACT II (2/8): Smash City Roadblock in 4x4 (F)' };
      if (stage === 2) {
        const next = shootTargets.find(t => t.stage === 2 && t.alive);
        const done = 2 - shootTargets.filter(t => t.stage === 2 && t.alive).length;
        return { pos: next?.pos, zh: `ACT III (3/8)：攻入西南冷雾库击毁锁控箱 (${done}/2)`, en: `ACT III (3/8): Break SW Cryo-Locks (${done}/2)` };
      }
      if (stage === 3) {
        const next = shootTargets.find(t => t.stage === 3 && t.alive);
        const done = 2 - shootTargets.filter(t => t.stage === 3 && t.alive).length;
        return { pos: next?.pos, zh: `ACT IV (4/8)：西区铁路货场炸毁信号闸 (${done}/2)`, en: `ACT IV (4/8): Blow West Rail Breakers (${done}/2)` };
      }
      if (stage === 4) {
        const next = shootTargets.find(t => t.stage === 4 && t.alive);
        const done = 3 - shootTargets.filter(t => t.stage === 4 && t.alive).length;
        return { pos: next?.pos, zh: `ACT V (5/8)：登 +14m 西岸山顶狙击卫星散热芯 (${done}/3)`, en: `ACT V (5/8): Snipe Mountain Cores (${done}/3)` };
      }
      if (stage === 5) return { pos: new Vector3(-174, 14.5, -78), zh: `ACT VI (6/8)：12米东海海啸袭港！山顶避险 (${Math.ceil(tsunamiSurviveClock)}s)`, en: `ACT VI (6/8): Survive Tsunami (${Math.ceil(tsunamiSurviveClock)}s)` };
      if (stage === 6) {
        const next = shootTargets.find(t => t.stage === 6 && t.alive);
        const done = 2 - shootTargets.filter(t => t.stage === 6 && t.alive).length;
        return { pos: next?.pos, zh: `ACT VII (7/8)：南港岸角重启 22m 海湾灯塔 (${done}/2)`, en: `ACT VII (7/8): Restore South Lighthouse (${done}/2)` };
      }
      if (stage === 7) return { pos: new Vector3(-172, .5, -200), zh: 'ACT VIII (8/8)：全速冲进西北机场拱形机库撤离', en: 'ACT VIII (8/8): Race into Airfield Hangar' };
      return { pos: null, zh: '🏆 盐线市 8 幕全城战役全线通关！按 [M] 自由畅游全城', en: '🏆 All 8 City Campaign Acts Complete! Press [M] to roam' };
    }

    function update(dt, playerPos) {
      if (!(dt > 0)) return;
      const menuOpen = Boolean(document.querySelector('.menu.open') || document.querySelector('.developer-menu[open]'));
      const inGame = !menuOpen && (!world.game || world.game.state === 'playing');
      if (world.backdrop?.skyline?.visible) world.backdrop.skyline.visible = false;
      if (world.backdrop?.lamps?.visible) world.backdrop.lamps.visible = false;
      hud.classList.toggle('sl-menu-hidden', !inGame);
      minimap.classList.toggle('sl-menu-hidden', !inGame);
      pinLayer.classList.toggle('sl-menu-hidden', !inGame);
      objPinEl.classList.toggle('sl-menu-hidden', !inGame);
      guideStripEl.classList.toggle('sl-menu-hidden', !inGame);
      if (!inGame) {
        interactPrompt.classList.remove('on');
        actCard.classList.remove('show');
        objPinEl.style.display = 'none';
        return;
      }
      aliveClock += dt;
      fpsSmooth = fpsSmooth * .92 + (1 / Math.max(.004, dt)) * .08;
      for (const fn of updaters) fn(dt);

      syncOpenWorldMissionProps();
      if (!introActShown && cityCampaignActive && !freeRoam && aliveClock > 1.8) {
        introActShown = true;
        showActCard(0);
      }

      let loadedCount = 0;
      if (chunkMgr) {
        loadedCount = chunkMgr.update(dt, playerPos).loadedCount;
      } else {
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
      }

      // Check proximity to Interactive Doors, Medical Stations, Armory & Evidence Consoles ([E])
      activeInteractable = null;
      if (playerPos && !mapOpen && !photoMode) {
        let bestD = Infinity;
        for (const it of interactables) {
          const d = playerPos.distanceTo(it.pos);
          if (d <= it.radius && d < bestD) { bestD = d; activeInteractable = it; }
        }
      }
      if (activeInteractable) {
        interactPrompt.textContent = activeInteractable.getPrompt();
        interactPrompt.classList.add('on');
      } else {
        interactPrompt.classList.remove('on');
      }

      if (playerPos) {
        const zObj = detectZoneObj(playerPos);
        if (!discoveredLandmarks.has(zObj.id)) {
          discoveredLandmarks.add(zObj.id);
          if (freeRoam && discoveredLandmarks.size > 1) {
            world.tactical?.notify?.(`🏞️ 发现区域：${zObj.nameZh} — ${zObj.scenic} (${discoveredLandmarks.size}/7)`,
              `🏞️ Discovered: ${zObj.nameEn} (${discoveredLandmarks.size}/7)`, false, 4.2);
          }
        }
      }

      if (customGpsTarget && playerPos && playerPos.distanceTo(customGpsTarget) < 12) {
        customGpsTarget = null;
        world.tactical?.notify?.('📍 已抵达 GPS 目的地！', '📍 Arrived at GPS destination!', false, 2.5);
      }

      if (cityCampaignActive && !freeRoam) {
        if (stage === 1 && playerPos && playerPos.distanceTo(new Vector3(-26, 0, -76)) < 7.5) {
          for (const rb of roadblockProps) { rb.intact = false; rb.mesh.visible = false; }
          const hitPos = new Vector3(-26, 1.2, -76);
          fx?.sparks?.(hitPos, up, 36);
          fx?.debris?.(hitPos, { count: 18 });
          audio?.play?.('rail_touchdown', { pos: hitPos, ref: 24, gain: .95, jitter: .05 });
          world.player?.addShake?.(.58);
          advanceToStage(2);
        }
        if (stage === 5) {
          tsunamiSurviveClock -= dt;
          if (tsunamiSurviveClock <= 0) {
            bridgeBarrageTriggered = false;
            advanceToStage(6);
          }
        }
        if (stage === 6 && !bridgeBarrageTriggered && playerPos && playerPos.z > 62) {
          bridgeBarrageTriggered = true;
          world.disasters?.triggerArtilleryBarrage?.();
        }
        if (stage === 7 && playerPos) {
          if (playerPos.z < -130 && playerPos.x < -110) {
            runwayArtilleryClock += dt;
            if (runwayArtilleryClock >= 2.2) {
              runwayArtilleryClock = 0;
              const blast = new Vector3(playerPos.x - 16, 1.0, -172 + (Math.random() - .5) * 24);
              fx?.smoke?.(blast, { size: 4.5, life: 4.0, color: 0x2c2724, alpha: .65, rise: 1.2, count: 7 });
              fx?.sparks?.(blast, up, 28);
              audio?.play?.('rail_touchdown', { pos: blast, ref: 34, gain: .85, jitter: .08 });
              world.player?.addShake?.(.38);
            }
          }
          if (playerPos.distanceTo(new Vector3(-172, .2, -200)) < 12.5) {
            stage = 8;
            world.tactical?.notify?.('🏆 盐线市 8 幕《失联名单》全城战役通关！按 [M] 自由畅游全城！',
              '🏆 Saltline City 8-Act Campaign Complete! Press [M] to roam!', false, 8.5);
          }
        }
      }

      const info = currentObjectiveInfo();
      const mainStoryOwns = isMainStoryActive();
      const beaconTarget = customGpsTarget || (mainStoryOwns ? null : info.pos);
      if (beaconTarget) {
        skyBeacon.visible = true;
        skyBeacon.position.set(beaconTarget.x, beaconTarget.y + 24, beaconTarget.z);
        beaconMat.color.setHex(customGpsTarget ? 0xffd859 : 0x56cfe6);
        skyBeacon.rotation.y += dt * 1.5;
      } else {
        skyBeacon.visible = false;
      }

      if (!photoMode && !mapOpen && world.camera && playerPos && typeof window !== 'undefined' && window.innerWidth) {
        const w = window.innerWidth, h = window.innerHeight;
        for (const p of landmarkPins) {
          const dist = playerPos.distanceTo(p.anchor);
          if (dist < 48 || dist > 360) { p.el.style.display = 'none'; continue; }
          projTmp.copy(p.anchor).project(world.camera);
          if (projTmp.z >= 1 || projTmp.z <= -1 || Math.abs(projTmp.x) > .94 || Math.abs(projTmp.y) > .85) {
            p.el.style.display = 'none'; continue;
          }
          p.el.style.display = 'block';
          p.el.style.left = `${((projTmp.x * .5 + .5) * w).toFixed(0)}px`;
          p.el.style.top = `${((-projTmp.y * .5 + .5) * h).toFixed(0)}px`;
          p.distEl.textContent = `${Math.round(dist)}m`;
        }
        // High-visibility 3D screen-clamped Mission Objective Waypoint (always shows exact direction even if behind you!)
        if (beaconTarget) {
          const objDist = Math.round(playerPos.distanceTo(beaconTarget));
          projTmp.set(beaconTarget.x, beaconTarget.y + 3.0, beaconTarget.z).project(world.camera);
          const behind = projTmp.z > 1;
          let sx = behind ? -projTmp.x : projTmp.x;
          let sy = behind ? -projTmp.y : projTmp.y;
          const offEdge = behind || Math.abs(sx) > .88 || Math.abs(sy) > .82;
          if (offEdge) {
            const mag = Math.max(Math.abs(sx) / .88, Math.abs(sy) / .82, .001);
            sx /= mag; sy /= mag;
          }
          const arrow = offEdge ? (sx < -.45 ? '‹ ' : (sx > .45 ? '› ' : (sy > 0 ? 'ˆ ' : 'ˇ '))) : '◆ ';
          objPinEl.style.display = 'block';
          objPinEl.style.left = `${((sx * .5 + .5) * w).toFixed(0)}px`;
          objPinEl.style.top = `${((-sy * .5 + .5) * h).toFixed(0)}px`;
          objPinEl.innerHTML = `${arrow}<b>${objDist}m</b>`;
        } else {
          objPinEl.style.display = 'none';
        }
      } else {
        for (const p of landmarkPins) p.el.style.display = 'none';
        objPinEl.style.display = 'none';
      }

      hudTimer += dt;
      if (hudTimer >= .25) {
        hudTimer = 0;
        const zObj = detectZoneObj(playerPos);
        zoneEl.textContent = local('Zone: ', '当前区域：') + local(zObj.nameEn, zObj.nameZh);
        const calls = world.renderer?.info?.render?.calls;
        const dcStr = Number.isFinite(calls) ? ` · DC ${calls}` : '';
        perfEl.textContent = `${Math.round(fpsSmooth)} FPS${dcStr} · ${local('Streamed', '近景流式')} ${loadedCount}/${sectors.length}`;
        const aliveEnemies = world.enemies?.aliveCount?.() ?? 0;
        if (freeRoam) {
          stealthEl.className = 'sl-stealth-pill';
          stealthEl.textContent = '🌏 开放世界和平漫游 · 东海净空';
        } else if (aliveEnemies > 0) {
          stealthEl.className = 'sl-stealth-pill alert';
          stealthEl.textContent = `🔴 战术交火态 · 周边敌军 ${aliveEnemies}`;
        } else {
          stealthEl.className = 'sl-stealth-pill';
          stealthEl.textContent = '🟢 隐蔽潜行态 · 区域安全';
        }
        const distSuffix = beaconTarget && playerPos ? ` · ${Math.round(playerPos.distanceTo(beaconTarget))}m` : '';
        const objText = local(info.en, info.zh) + distSuffix;
        opEl.textContent = objText;

        if (playerPos) {
          const deg = -((world.player?.yaw ?? 0) * 180 / Math.PI);
          mmPlayerG.setAttribute('transform', `translate(${playerPos.x.toFixed(1)},${playerPos.z.toFixed(1)}) rotate(${deg.toFixed(0)})`);
          if (beaconTarget) {
            mmRouteL.style.display = '';
            mmRouteL.setAttribute('x1', playerPos.x.toFixed(1)); mmRouteL.setAttribute('y1', playerPos.z.toFixed(1));
            mmRouteL.setAttribute('x2', beaconTarget.x.toFixed(1)); mmRouteL.setAttribute('y2', beaconTarget.z.toFixed(1));
            mmTargetC.style.display = '';
            mmTargetC.setAttribute('cx', beaconTarget.x.toFixed(1)); mmTargetC.setAttribute('cy', beaconTarget.z.toFixed(1));
          } else {
            mmRouteL.style.display = 'none';
            mmTargetC.style.display = 'none';
          }
        }

        if (!mainStoryOwns) {
          const leftObjEl = document.querySelector?.('.h-obj-t');
          if (leftObjEl) leftObjEl.textContent = objText;
        }
        const stepHint = freeRoam ? '按 [G] 召唤四驱车 · [F] 上车 · [M] 打开全城地图传送'
          : stage === 0 ? '沿金色🎯标记推进，瞄准红色旋转核心开火摧毁防空干扰塔'
          : stage === 1 ? '按 [G] 召唤四驱车 → [F] 登车 → 沿大道向北撞碎路口路障'
          : stage === 2 ? '沿西线大道南下冷雾库，开火击毁 2 台红色锁控箱'
          : stage === 3 ? '北上西区铁路货场，摧毁 2 处编组信号闸截停专列'
          : stage === 4 ? '沿盘山公路登顶 +14m 西岸山顶，击毁 3 个卫星散热芯'
          : stage === 5 ? '留在 +14m 山顶高地躲避 12 米东海风暴海啸！'
          : stage === 6 ? '南下旧船坞与南角灯塔，摧毁 2 座电源干扰器'
          : stage === 7 ? '驱车全速冲进西北机场拱形机库完成最终撤离！'
          : '全线通关！按 [M] 切换开放世界自由畅游全城';
        guideStripEl.textContent = `▶ ${objText}  ｜  ${stepHint}`;
        if (mapOpen) renderMapEntries(playerPos);
      }
    }

    function dispose() {
      window.removeEventListener('keydown', onKeyDown);
      if (actCardTimer) clearTimeout(actCardTimer);
      for (const it of interactables) it.cleanup?.();
      for (const sec of sectors) syncColliders(sec, false);
      for (const b of permanentColliders.splice(0)) physics?.removeBox?.(b);
      parkedAircraft.dispose();
      crown.dispose();
      rubber.dispose();
      shadowMap.dispose();
      shadow.material.dispose();
      cliff.dispose();
      rockFace.dispose();
      dishMetal.dispose();
      bowl.geometry.dispose();
      for (const g of customGeos) g.dispose?.();
      externalAssets?.dispose?.();
      industrialGen?.dispose?.();
      atmosphereSys?.dispose?.();
      chunkMgr?.dispose?.();
      buildingGen?.dispose?.();
      terrainGen?.dispose?.();
      lightingSys?.dispose?.();
      matLib?.dispose?.();
      smokedPane.dispose();
      blindPane.dispose();
      horizonRoot.traverse(node => { if (node.isInstancedMesh) node.dispose(); });
      root.removeFromParent();
      hud.remove();
      minimap.remove();
      pinLayer.remove();
      actCard.remove();
      photoPill.remove();
      if (legacySkyline) legacySkyline.visible = true;
      if (legacyLamps) legacyLamps.visible = true;
      interactPrompt.remove();
      mapOverlay.remove();
      objPinEl.remove();
      guideStripEl.remove();
      const uiRoot = document.getElementById('ui');
      if (uiRoot) uiRoot.style.opacity = '1';
    }

    return {
      update, dispose, toggleMap, jumpToStage, setFreeRoam, setPhotoMode,
      cycleSky() { return applySkyPreset(skyIdx + 1); },
      stageStarts, interactables,
      get freeRoam() { return freeRoam; },
      get stage() { return stage; },
      waypoints: districts.map(d => ({ label: d.nameEn, zh: d.nameZh, pos: d.pos.clone() })),
    };
  };
})();
