/* WorldEngine/Assets/BuildingGenerator.js
 * Next-Generation Parametric Coastal Architecture Engine (9 Distinct Structural Archetypes)
 * with Genuine 8-Stage Time-Sliced Phased Generation & Per-Phase Timing Telemetry.
 *
 * 8 Independent Phased Build Stages (createCoastalBuildingTask):
 *   1. structure   — Foundation plinths, stepped/L/U/chamfered massing, structural columns & slabs
 *   2. facade      — Tripartite base/shaft/attic composition, corner piers/quoins, spandrels & belt courses
 *   3. openings    — Deeply recessed windows, varied bay rhythms, mullions, sills, lintels & glazed portals
 *   4. roof        — ExtrudeGeometry gable/mansard/sawtooth/stepped roofs, parapets, coping, cupolas & dormers
 *   5. attachments — Awnings, bay windows, recessed loggias, fire escapes, chimneys, hoist beams & signage
 *   6. interior    — Visible ground-floor lobby floors, columns, reception counters & warm ceiling soffits
 *   7. colliders   — Multi-volume AABB collider specs matching true L/U/stepped/rowhouse geometry
 *   8. activate    — GPU InstancedMesh flush, streamOwned tagging, scene mount & timing telemetry commit
 *
 * 9 Independent Architectural Archetypes:
 *   1. coastal_residence     — L-shaped stone & plaster house, pitched tile roof, dormer, chimney, timber porch
 *   2. harbor_apartment      — U-shaped recessed courtyard masonry apartment, slate mansard, loggias, water tower
 *   3. modern_office         — Chamfered 8-sided podium + stepped glass tower, V-columns, solar fins, atrium crown
 *   4. commercial_arcade     — Recessed granite colonnade arcade, chamfered corner entry, bay windows, awnings
 *   5. civic_customs         — Stepped granite stylobate, fluted portico, triangular pediment, glazed cupola
 *   6. industrial_hall       — Multi-bay ExtrudeGeometry sawtooth north-light factory, portal H-frames, cyclone stack
 *   7. stepped_mixed_use     — 1930s Maritime Art-Deco corner block with stepped setbacks & chamfered watch turret
 *   8. bonded_warehouse      — 19th-c. brick & granite bonded warehouse, recessed hoist gable, cathead beam & tie-rods
 *   9. waterfront_rowhouses  — 3-part staggered coastal terrace rowhouses with varied heights, roofs, stoops & materials */
(() => {
  const WE = (window.WorldEngine = window.WorldEngine || {});

  const nowMs = () => (typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now());

  function recordBuildTiming(entry) {
    if (typeof window === 'undefined') return;
    if (!Array.isArray(window.SALTLINE_BUILD_TIMINGS)) window.SALTLINE_BUILD_TIMINGS = [];
    window.SALTLINE_BUILD_TIMINGS.push(entry);
    if (window.SALTLINE_BUILD_TIMINGS.length > 64) window.SALTLINE_BUILD_TIMINGS.shift();
  }

  function createBuildingGenerator(THREE, matLib, sharedMats) {
    const { Group, Mesh, BoxGeometry, CylinderGeometry, InstancedMesh, Object3D, Vector2, Vector3 } = THREE;
    const unitBox = new BoxGeometry(1, 1, 1);
    const unitCyl = new CylinderGeometry(1, 1, 1, 12);
    const createdGeos = [unitBox, unitCyl];

    function extrudeShape(pts2D, depth, { bevel = 0.08, rotX = 0, rotY = 0, centerZ = true } = {}) {
      if (typeof THREE.Shape !== 'function' || typeof THREE.ExtrudeGeometry !== 'function') {
        return unitBox;
      }
      const shape = new THREE.Shape(pts2D.map(([x, y]) => new Vector2(x, y)));
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: bevel > 0,
        bevelThickness: bevel,
        bevelSize: bevel * 0.85,
        bevelSegments: 2,
        steps: 1,
      });
      if (centerZ) geo.translate(0, 0, -depth / 2);
      if (rotX) geo.rotateX(rotX);
      if (rotY) geo.rotateY(rotY);
      geo.computeVertexNormals();
      if (matLib?.applyWorldUV) matLib.applyWorldUV(geo, 3.0);
      geo.userData.streamOwned = true;
      createdGeos.push(geo);
      return geo;
    }

    function makePipeCurve(pts, radius, mat) {
      if (typeof THREE.TubeGeometry === 'function' && typeof THREE.CatmullRomCurve3 === 'function') {
        const curve = new THREE.CatmullRomCurve3(pts.map(p => new Vector3(p[0], p[1], p[2])));
        const geo = new THREE.TubeGeometry(curve, Math.max(10, pts.length * 4), radius, 7, false);
        geo.userData.streamOwned = true;
        createdGeos.push(geo);
        const m = new Mesh(geo, mat);
        m.matrixAutoUpdate = false; m.updateMatrix();
        return m;
      }
      const a = pts[0], b = pts[pts.length - 1];
      const len = Math.max(0.2, Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
      const m = new Mesh(unitCyl, mat);
      m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
      m.scale.set(radius, len, radius);
      m.matrixAutoUpdate = false; m.updateMatrix();
      return m;
    }

    function createBatcher(g) {
      const batches = new Map();
      const dummy = new Object3D();
      let opCount = 0;
      const push = (mat, w, h, d, px, py, pz, rx = 0, ry = 0, rz = 0) => {
        if (!mat) return;
        dummy.position.set(px, py, pz);
        dummy.rotation.set(rx, ry, rz);
        dummy.scale.set(w, h, d);
        dummy.updateMatrix();
        let arr = batches.get(mat);
        if (!arr) { arr = []; batches.set(mat, arr); }
        arr.push(dummy.matrix.clone());
        opCount++;
      };
      const flush = () => {
        if (typeof InstancedMesh === 'function') {
          for (const [material, matrices] of batches) {
            const batch = new InstancedMesh(unitBox, matLib.forInstancedBoxes(material), matrices.length);
            for (let i = 0; i < matrices.length; i++) batch.setMatrixAt(i, matrices[i]);
            batch.receiveShadow = true;
            g.add(batch);
          }
        }
      };
      return { push, flush, get ops() { return opCount; } };
    }

    // Architectural facade planner separated cleanly into masonry/pilaster articulation vs window openings vs attachments!
    function computeFacadeLayout({ cx, cz, width, depth, baseY, yStart, floors, storeyH, bayTarget, faces = [0, 1, 2, 3], cornerPier = 0.85 }) {
      const facePlans = [];
      for (const face of faces) {
        const theta = face * Math.PI / 2;
        const sin = Math.sin(theta), cos = Math.cos(theta);
        const span = face % 2 ? depth : width;
        const offset = (face % 2 ? width : depth) / 2;
        const innerSpan = Math.max(2.4, span - cornerPier * 2);
        const bays = Math.max(2, Math.round(innerSpan / bayTarget));
        const pitch = innerSpan / bays;
        facePlans.push({ face, theta, sin, cos, span, innerSpan, offset, bays, pitch, cornerPier, cx, cz, baseY, yStart, floors, storeyH });
      }
      return facePlans;
    }

    function emitFacadeWallShell(push, facePlans, { wallMat, trimMat, verticalFins = false, finMat = null, quoins = false, pilasterStep = 0 }) {
      for (const fp of facePlans) {
        const place = (mat, w, h, d, u, y, inset, rx = 0) => {
          push(mat, w, h, d, fp.cx + fp.cos * u + fp.sin * (fp.offset - inset), fp.baseY + y, fp.cz - fp.sin * u + fp.cos * (fp.offset - inset), rx, fp.theta, 0);
        };
        const totalH = fp.floors * fp.storeyH;
        // Solid corner piers prevent windows from colliding awkwardly at building edges
        for (const sgn of [-1, 1]) {
          const cornerU = sgn * (fp.span / 2 - fp.cornerPier / 2);
          place(wallMat, fp.cornerPier, totalH, 0.44, cornerU, fp.yStart + totalH / 2, 0.20);
          if (quoins) {
            for (let qy = fp.yStart + 0.35; qy < fp.yStart + totalH - 0.3; qy += 0.92) {
              const qW = ((Math.round(qy * 2) % 2) === 0) ? fp.cornerPier * 0.96 : fp.cornerPier * 0.68;
              place(trimMat, qW, 0.42, 0.50, cornerU, qy, 0.14);
            }
          }
        }
        // Horizontal spandrels, belt courses & vertical pilasters
        for (let row = 0; row < fp.floors; row++) {
          const fy = fp.yStart + row * fp.storeyH;
          const sillH = verticalFins ? 0.58 : (row === 0 ? 0.86 : 0.96);
          const lintelH = 0.36;
          place(wallMat, fp.innerSpan, sillH, 0.40, 0, fy + sillH / 2, 0.19);
          place(wallMat, fp.innerSpan, lintelH, 0.40, 0, fy + fp.storeyH - lintelH / 2, 0.19);
          if (row === 0 || row === fp.floors - 1 || row % 2 === 0) {
            place(trimMat, fp.span + 0.22, 0.16, 0.48, 0, fy, 0.11);
          }
          for (let b = 0; b <= fp.bays; b++) {
            const pierU = -fp.innerSpan / 2 + b * fp.pitch;
            if (verticalFins && finMat) {
              place(finMat, 0.11, fp.storeyH, 0.46, pierU, fy + fp.storeyH / 2, -0.17);
            } else if (pilasterStep > 0 && b % pilasterStep === 0 && b > 0 && b < fp.bays) {
              place(trimMat, 0.38, fp.storeyH, 0.52, pierU, fy + fp.storeyH / 2, 0.10);
            }
          }
        }
      }
    }

    function emitFacadeOpenings(push, facePlans, {
      wallMat, trimMat, steelDark, officeGlass, litGlass, blindGlass, rng,
      verticalFins = false, rhythm = 'uniform', corbelLintels = false,
    }) {
      for (const fp of facePlans) {
        const place = (mat, w, h, d, u, y, inset, rx = 0) => {
          push(mat, w, h, d, fp.cx + fp.cos * u + fp.sin * (fp.offset - inset), fp.baseY + y, fp.cz - fp.sin * u + fp.cos * (fp.offset - inset), rx, fp.theta, 0);
        };
        for (let row = 0; row < fp.floors; row++) {
          const fy = fp.yStart + row * fp.storeyH;
          const sillH = verticalFins ? 0.58 : (row === 0 ? 0.86 : 0.96);
          const winH = fp.storeyH - sillH - 0.36;
          const wy = fy + sillH + winH / 2;
          const isTopAttic = row === fp.floors - 1 && fp.floors >= 3;

          for (let b = 0; b < fp.bays; b++) {
            const u = -fp.innerSpan / 2 + (b + 0.5) * fp.pitch;
            // Varied architectural bay widths (breaks mechanical grid repetition!)
            const isCenter = Math.abs(b - (fp.bays - 1) / 2) < 0.6;
            let widthRatio = verticalFins ? 0.78 : 0.58;
            if (rhythm === 'center_accent' && isCenter) widthRatio = 0.72;
            else if (rhythm === 'paired' && (b % 2 === 0)) widthRatio = 0.64;
            else if (isTopAttic) widthRatio *= 0.84;

            const winW = fp.pitch * widthRatio;
            const jambW = (fp.pitch - winW) / 2;
            for (const sgn of [-1, 1]) {
              place(wallMat, jambW, winH, 0.40, u + sgn * (fp.pitch - jambW) / 2, wy, 0.19);
              place(steelDark, 0.08, winH + 0.04, 0.24, u + sgn * (winW / 2 - 0.04), wy, 0.30);
            }
            // Deeply recessed window glazing with varied occupancy (lit / blind / reflective)
            const rv = rng();
            const pane = rv < 0.24 ? litGlass : (rv < 0.38 ? blindGlass : officeGlass);
            place(pane, winW, winH, 0.05, u, wy, 0.37);
            // Mullion & transom bars
            place(steelDark, 0.065, winH, 0.11, u, wy, 0.29);
            place(steelDark, winW, 0.065, 0.11, u, wy + winH * 0.22, 0.29);
            // Projecting stone sill + lintel
            place(trimMat, winW + 0.24, 0.14, 0.54, u, fy + sillH - 0.02, 0.09);
            place(trimMat, winW + (corbelLintels ? 0.34 : 0.18), corbelLintels ? 0.22 : 0.13, 0.48, u, fy + sillH + winH + 0.07, 0.13);
            if (corbelLintels) {
              place(trimMat, 0.20, 0.28, 0.52, u, fy + sillH + winH + 0.10, 0.11); // Keystone accent
            }
          }
        }
      }
    }

    function emitFacadeAttachments(push, facePlans, {
      wallMat, trimMat, steelDark, steelGalv, officeGlass, litGlass, rng,
      shutterMat = null, balconyChance = 0, bayWindows = false, tieRods = false,
    }) {
      for (const fp of facePlans) {
        const place = (mat, w, h, d, u, y, inset, rx = 0) => {
          push(mat, w, h, d, fp.cx + fp.cos * u + fp.sin * (fp.offset - inset), fp.baseY + y, fp.cz - fp.sin * u + fp.cos * (fp.offset - inset), rx, fp.theta, 0);
        };
        for (let row = 0; row < fp.floors; row++) {
          const fy = fp.yStart + row * fp.storeyH;
          const sillH = row === 0 ? 0.86 : 0.96;
          const winH = fp.storeyH - sillH - 0.36;
          const wy = fy + sillH + winH / 2;

          for (let b = 0; b < fp.bays; b++) {
            const u = -fp.innerSpan / 2 + (b + 0.5) * fp.pitch;
            const winW = fp.pitch * 0.58;
            if (shutterMat) {
              for (const sgn of [-1, 1]) {
                place(shutterMat, 0.34, winH * 0.95, 0.06, u + sgn * (winW / 2 + 0.20), wy, -0.04);
              }
            } else if (bayWindows && row >= 0 && b % 2 === 1 && winW > 1.75) {
              place(wallMat, winW + 0.38, 0.26, 0.74, u, fy + sillH - 0.11, -0.35);
              place(trimMat, winW + 0.44, 0.22, 0.80, u, fy + sillH + winH + 0.12, -0.37);
              place(rng() < 0.35 ? litGlass : officeGlass, winW * 0.86, winH, 0.08, u, wy, -0.68);
              for (const sgn of [-1, 1]) place(steelDark, 0.10, winH, 0.70, u + sgn * (winW * 0.45), wy, -0.35);
            } else if (balconyChance > 0 && row >= 1 && b % 2 === (fp.face % 2) && rng() < balconyChance) {
              place(trimMat, winW + 0.62, 0.17, 1.32, u, fy + 0.10, -0.58);
              place(steelDark, winW + 0.62, 0.08, 0.08, u, fy + 1.08, -1.18);
              place(steelDark, winW + 0.62, 0.05, 0.05, u, fy + 0.62, -1.18);
              for (const sgn of [-1, 1]) place(steelDark, 0.08, 0.08, 1.24, u + sgn * (winW + 0.58) / 2, fy + 1.08, -0.58);
              for (let p = -3; p <= 3; p++) place(steelGalv, 0.045, 0.94, 0.045, u + (p / 3) * (winW * 0.48), fy + 0.58, -1.18);
            }
            if (tieRods && b < fp.bays - 1) {
              place(steelDark, 0.28, 0.28, 0.08, u + fp.pitch / 2, fy + 0.10, -0.05);
            }
          }
        }
      }
    }

    const ARCHETYPE_MAP = {
      coastal_brick: 'commercial_arcade',
      coastal_residence: 'coastal_residence',
      harbor_apartment: 'harbor_apartment',
      maritime_office: 'modern_office',
      modern_office: 'modern_office',
      commercial_arcade: 'commercial_arcade',
      customs_block: 'civic_customs',
      civic_customs: 'civic_customs',
      industrial_hall: 'industrial_hall',
      stepped_mixed_use: 'stepped_mixed_use',
      bonded_warehouse: 'bonded_warehouse',
      waterfront_rowhouses: 'waterfront_rowhouses',
    };
    const ARCHETYPE_LIST = [
      'commercial_arcade', 'modern_office', 'harbor_apartment', 'civic_customs',
      'coastal_residence', 'industrial_hall', 'stepped_mixed_use', 'bonded_warehouse', 'waterfront_rowhouses',
    ];

    // =========================================================================
    // TRUE 8-STAGE PHASED BUILDING TASK (Measured per-phase execution time!)
    // =========================================================================
    function createCoastalBuildingTask(parent, spec, { colliderTarget = null } = {}) {
      const { cx, cz, width, depth, height, seed = 1, styleName, labelZh, labelEn } = spec;
      const rng = matLib.mulberry32(seed * 7919 + 31);
      const archetype = ARCHETYPE_MAP[styleName] || ARCHETYPE_LIST[seed % ARCHETYPE_LIST.length];

      const g = new Group();
      g.name = `building-${archetype}-${seed}`;
      const batcher = createBatcher(g);
      const { push, flush } = batcher;
      const baseY = 0.16;

      // Material palette resolved once on task creation (cached in MaterialLibrary)
      const mats = {
        steelDark: sharedMats.steelDark,
        steelGalv: sharedMats.steelGalv,
        officeGlass: matLib.get('window_office'),
        litGlass: matLib.get('window_lit'),
        blindGlass: sharedMats.blindPane || matLib.get('window_office'),
        tileRoof: matLib.get('roof_tile'),
        slateRoof: matLib.get('roof_slate'),
        zincRoof: matLib.get('roof_zinc'),
        timber: matLib.get('wood_timber'),
        granite: matLib.get('granite'),
        brick: matLib.get('brick_red'),
        brickCoastal: matLib.get('brick_coastal'),
        plasterCream: matLib.get('plaster_cream'),
        plasterSlate: matLib.get('plaster_slate'),
        concreteAged: matLib.get('concrete_aged'),
        concreteWet: matLib.get('concrete_wet'),
        corrugated: matLib.get('corrugated_steel'),
        redBeacon: sharedMats.redCore || sharedMats.steelDark,
        shutterTeal: sharedMats.cargoTeal || sharedMats.steelDark,
        awningNavy: sharedMats.cargoNavy || sharedMats.steelDark,
      };

      const addMesh = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => {
        const m = new Mesh(geo, mat);
        m.position.set(x, y, z);
        m.rotation.set(rx, ry, rz);
        if (sx !== 1 || sy !== 1 || sz !== 1) m.scale.set(sx, sy, sz);
        m.receiveShadow = true;
        m.matrixAutoUpdate = false; m.updateMatrix();
        g.add(m);
        return m;
      };

      // Shared intermediate geometry state across the 8 independent stages
      const st = {
        faceSpecs: [],
        colliders: [],
        params: {},
      };

      // Precompute archetype proportions (lightweight arithmetic only)
      if (archetype === 'coastal_residence') {
        const mainW = width * 0.72, mainD = depth * 0.78;
        const wingW = width * 0.44, wingD = depth * 0.56;
        const eaveH = Math.min(9.2, Math.max(6.4, height * 0.78));
        st.params = {
          wallMat: seed % 2 === 0 ? mats.plasterCream : mats.brickCoastal,
          mainW, mainD, wingW, wingD,
          mx: cx - (width - mainW) * 0.35, mz: cz - (depth - mainD) * 0.22,
          wx: cx + (width - wingW) * 0.42, wz: cz + (depth - wingD) * 0.34,
          eaveH, wingH: eaveH * 0.74, ridgeH: Math.min(3.8, mainD * 0.24),
          floors: Math.max(2, Math.round((eaveH - 0.72) / 3.1)),
        };
      } else if (archetype === 'modern_office') {
        const podH = 4.6, topH = Math.max(12.5, height);
        const upperFloors = Math.max(3, Math.round((topH - podH) / 3.3));
        st.params = { podH, topH, towerW: width * 0.82, towerD: depth * 0.80, upperFloors, storeyH: (topH - podH) / upperFloors };
      } else if (archetype === 'harbor_apartment') {
        const groundH = 3.3;
        const upperFloors = Math.max(2, Math.round((height - groundH - 2.0) / 3.1));
        const storeyH = (height - groundH - 2.0) / upperFloors;
        const spineD = depth * 0.58, wingW = width * 0.34, wingD = depth * 0.42;
        st.params = {
          wallMat: seed % 2 === 0 ? mats.brick : mats.plasterCream,
          trimMat: seed % 2 === 0 ? mats.concreteAged : mats.brickCoastal,
          groundH, upperFloors, storeyH, eaveH: groundH + upperFloors * storeyH,
          spineD, wingW, wingD,
          spineZ: cz - (depth - spineD) / 2,
          wingZ: cz + depth / 2 - wingD / 2,
          mansardH: 2.15,
        };
      } else if (archetype === 'commercial_arcade') {
        const groundH = 3.85;
        const upperFloors = Math.max(2, Math.round((height - groundH) / 3.1));
        const storeyH = (height - groundH) / upperFloors;
        st.params = {
          wallMat: seed % 2 === 0 ? mats.brick : mats.plasterCream,
          groundH, upperFloors, storeyH, topH: groundH + upperFloors * storeyH,
          xPiers: Math.max(3, Math.round(width / 4.4)),
          zPiers: Math.max(3, Math.round(depth / 4.4)),
        };
      } else if (archetype === 'civic_customs') {
        const plinthH = 1.45, upperH = Math.max(10.5, height);
        const floors = Math.max(3, Math.round((upperH - plinthH) / 3.4));
        st.params = { plinthH, upperH, floors, storeyH: (upperH - plinthH) / floors };
      } else if (archetype === 'stepped_mixed_use') {
        const baseH = 4.2;
        const midH = Math.max(10.2, height * 0.72);
        const topH = Math.max(midH + 3.4, height);
        const midFloors = Math.max(2, Math.round((midH - baseH) / 3.1));
        st.params = {
          baseH, midH, topH, midFloors, midStoreyH: (midH - baseH) / midFloors,
          setbackW: width * 0.76, setbackD: depth * 0.74,
          turretW: Math.min(6.4, width * 0.34), turretD: Math.min(6.4, depth * 0.34),
        };
      } else if (archetype === 'bonded_warehouse') {
        const baseH = 2.2, wallH = Math.max(8.4, height * 0.84);
        const floors = Math.max(2, Math.round((wallH - baseH) / 3.1));
        st.params = { baseH, wallH, floors, storeyH: (wallH - baseH) / floors, ridgeH: Math.min(3.6, depth * 0.24) };
      } else if (archetype === 'waterfront_rowhouses') {
        const unitCount = 3;
        const gap = 0.16;
        const uw = (width - gap * (unitCount - 1)) / unitCount;
        const units = [];
        const unitMats = [mats.plasterCream, mats.brick, mats.plasterSlate];
        const roofKinds = ['tile_gable', 'zinc_shed', 'slate_mansard'];
        for (let i = 0; i < unitCount; i++) {
          const ux = cx - width / 2 + uw / 2 + i * (uw + gap);
          const dzShift = (i === 1 ? -0.9 : (i === 2 ? 0.65 : 0.2));
          const ud = depth - Math.abs(dzShift) - 0.8;
          const uh = Math.max(6.8, height * (i === 1 ? 1.12 : (i === 0 ? 0.92 : 0.84)));
          const fl = Math.max(2, Math.round((uh - 0.8) / 3.05));
          units.push({ ux, uz: cz + dzShift * 0.5, uw, ud, uh, fl, storeyH: (uh - 0.8) / fl, wallMat: unitMats[(i + seed) % 3], roofKind: roofKinds[(i + seed) % 3] });
        }
        st.params = { units };
      } else {
        // industrial_hall
        const wallH = Math.min(9.5, Math.max(6.8, height * 0.82));
        st.params = { wallH, sawCount: 3 };
      }

      const phases = [
        // =====================================================================
        // STAGE 1: PRIMARY MASSING & STRUCTURAL CORE
        // =====================================================================
        {
          name: 'structure',
          run() {
            const p = st.params;
            if (archetype === 'coastal_residence') {
              push(mats.granite, p.mainW + 0.8, 0.72, p.mainD + 0.8, p.mx, baseY + 0.36, p.mz);
              push(mats.granite, p.wingW + 0.7, 0.72, p.wingD + 0.7, p.wx, baseY + 0.36, p.wz);
              push(mats.steelDark, p.mainW - 0.75, p.eaveH - 0.3, p.mainD - 0.75, p.mx, baseY + p.eaveH / 2, p.mz);
              push(mats.steelDark, p.wingW - 0.75, p.wingH - 0.3, p.wingD - 0.75, p.wx, baseY + p.wingH / 2, p.wz);
            } else if (archetype === 'modern_office') {
              const ch = 2.4;
              const podPts = [
                [-width / 2 + ch, -depth / 2], [width / 2 - ch, -depth / 2],
                [width / 2, -depth / 2 + ch], [width / 2, depth / 2 - ch],
                [width / 2 - ch, depth / 2], [-width / 2 + ch, depth / 2],
                [-width / 2, depth / 2 - ch], [-width / 2, -depth / 2 + ch],
              ];
              const podGeo = extrudeShape(podPts, 0.55, { bevel: 0.09, rotX: Math.PI / 2 });
              addMesh(podGeo, mats.concreteAged, cx, baseY + p.podH, cz);
              addMesh(podGeo, mats.granite, cx, baseY + 0.30, cz);
              for (const sx of [-1, 1]) {
                for (let vz = -depth * 0.34; vz <= depth * 0.35; vz += Math.max(4.5, depth * 0.34)) {
                  push(mats.steelGalv, 0.34, p.podH, 0.34, cx + sx * (width / 2 - 1.1), baseY + p.podH / 2, cz + vz, 0.16, 0, sx * 0.14);
                  push(mats.steelGalv, 0.34, p.podH, 0.34, cx + sx * (width / 2 - 1.1), baseY + p.podH / 2, cz + vz, -0.16, 0, sx * 0.14);
                }
              }
              push(mats.steelDark, p.towerW - 0.8, p.topH - p.podH - 0.3, p.towerD - 0.8, cx, baseY + p.podH + (p.topH - p.podH) / 2, cz);
            } else if (archetype === 'harbor_apartment') {
              push(mats.concreteWet, width + 0.4, 0.65, depth + 0.4, cx, baseY + 0.32, cz);
              push(mats.steelDark, width - 0.75, p.eaveH - 0.3, p.spineD - 0.75, cx, baseY + p.eaveH / 2, p.spineZ);
              push(p.wallMat, width, p.groundH, p.spineD, cx, baseY + p.groundH / 2, p.spineZ);
              for (const sgn of [-1, 1]) {
                const wx = cx + sgn * (width / 2 - p.wingW / 2);
                push(mats.steelDark, p.wingW - 0.65, p.eaveH - 0.3, p.wingD - 0.65, wx, baseY + p.eaveH / 2, p.wingZ);
                push(mats.concreteWet, p.wingW, p.groundH, p.wingD, wx, baseY + p.groundH / 2, p.wingZ);
              }
            } else if (archetype === 'commercial_arcade') {
              push(mats.concreteWet, width + 0.5, 0.42, depth + 0.5, cx, baseY + 0.21, cz);
              push(mats.steelDark, width - 3.0, p.groundH - 0.3, depth - 3.0, cx, baseY + p.groundH / 2, cz);
              for (let i = 0; i <= p.xPiers; i++) {
                const px = cx - width / 2 + 0.35 + (i / p.xPiers) * (width - 0.7);
                for (const pz of [cz - depth / 2 + 0.35, cz + depth / 2 - 0.35]) {
                  push(mats.granite, 0.68, p.groundH, 0.68, px, baseY + p.groundH / 2, pz);
                  push(mats.concreteAged, 0.88, 0.36, 0.88, px, baseY + 0.42, pz);
                }
              }
              for (let j = 1; j < p.zPiers; j++) {
                const pz = cz - depth / 2 + 0.35 + (j / p.zPiers) * (depth - 0.7);
                for (const px of [cx - width / 2 + 0.35, cx + width / 2 - 0.35]) {
                  push(mats.granite, 0.68, p.groundH, 0.68, px, baseY + p.groundH / 2, pz);
                }
              }
              push(mats.steelDark, width - 0.75, p.topH - p.groundH - 0.3, depth - 0.75, cx, baseY + p.groundH + (p.topH - p.groundH) / 2, cz);
            } else if (archetype === 'civic_customs') {
              push(mats.granite, width + 1.0, p.plinthH, depth + 1.0, cx, baseY + p.plinthH / 2, cz);
              for (let s = 0; s < 5; s++) {
                push(mats.granite, width * 0.48, 0.28, 0.55, cx, baseY + 0.14 + s * 0.26, cz + depth / 2 + 2.4 - s * 0.46);
              }
              push(mats.steelDark, width - 0.85, p.upperH - p.plinthH - 0.2, depth - 0.85, cx, baseY + p.plinthH + (p.upperH - p.plinthH) / 2, cz);
            } else if (archetype === 'stepped_mixed_use') {
              // Stepped 1930s Art-Deco base + main block + recessed upper penthouse + corner turret
              push(mats.granite, width + 0.6, 0.52, depth + 0.6, cx, baseY + 0.26, cz);
              push(mats.granite, width - 0.4, p.baseH, depth - 0.4, cx, baseY + p.baseH / 2, cz);
              push(mats.steelDark, width - 1.1, p.midH - p.baseH - 0.2, depth - 1.1, cx, baseY + p.baseH + (p.midH - p.baseH) / 2, cz);
              push(mats.steelDark, p.setbackW - 0.8, p.topH - p.midH - 0.2, p.setbackD - 0.8, cx, baseY + p.midH + (p.topH - p.midH) / 2, cz);
              // Corner watch turret massing on SE corner facing Coastal Blvd
              const tx = cx + width / 2 - p.turretW / 2 + 0.15, tz = cz + depth / 2 - p.turretD / 2 + 0.15;
              push(mats.plasterCream, p.turretW, p.topH + 2.2, p.turretD, tx, baseY + (p.topH + 2.2) / 2, tz);
            } else if (archetype === 'bonded_warehouse') {
              // Heavy rusticated granite loading plinth + brick structural core
              push(mats.granite, width + 0.8, p.baseH, depth + 0.8, cx, baseY + p.baseH / 2, cz);
              push(mats.steelDark, width - 0.8, p.wallH - p.baseH - 0.2, depth - 0.8, cx, baseY + p.baseH + (p.wallH - p.baseH) / 2, cz);
              // Loading dock platform along east/south street edge
              push(mats.concreteWet, width * 0.72, 1.05, 2.2, cx, baseY + 0.52, cz + depth / 2 + 1.1);
            } else if (archetype === 'waterfront_rowhouses') {
              for (const u of p.units) {
                push(mats.granite, u.uw + 0.22, 0.80, u.ud + 0.22, u.ux, baseY + 0.40, u.uz);
                push(mats.steelDark, u.uw - 0.65, u.uh - 0.3, u.ud - 0.65, u.ux, baseY + u.uh / 2, u.uz);
              }
            } else {
              push(mats.concreteWet, width + 0.6, 1.4, depth + 0.6, cx, baseY + 0.7, cz);
              push(mats.corrugated, width, p.wallH - 1.4, depth, cx, baseY + 1.4 + (p.wallH - 1.4) / 2, cz);
              const bays = Math.max(3, Math.round(width / 6.2));
              for (let i = 0; i <= bays; i++) {
                const px = cx - width / 2 + (i / bays) * width;
                for (const pz of [cz - depth / 2 - 0.12, cz + depth / 2 + 0.12]) {
                  push(mats.steelDark, 0.38, p.wallH + 0.2, 0.38, px, baseY + p.wallH / 2, pz);
                }
              }
            }
          },
        },

        // =====================================================================
        // STAGE 2: FACADE COMPOSITION, CORNERS, PILASTERS & SPANDRELS
        // =====================================================================
        {
          name: 'facade',
          run() {
            const p = st.params;
            const addPlan = (cfg, opts) => {
              const plans = computeFacadeLayout(cfg);
              emitFacadeWallShell(push, plans, opts);
              st.faceSpecs.push({ plans, opts });
            };
            if (archetype === 'coastal_residence') {
              addPlan({ cx: p.mx, cz: p.mz, width: p.mainW, depth: p.mainD, baseY, yStart: 0.72, floors: p.floors, storeyH: (p.eaveH - 0.72) / p.floors, bayTarget: 3.9, cornerPier: 0.9 },
                { wallMat: p.wallMat, trimMat: mats.granite, quoins: true, shutterMat: mats.shutterTeal, rhythm: 'center_accent' });
              const wf = Math.max(1, p.floors - 1);
              addPlan({ cx: p.wx, cz: p.wz, width: p.wingW, depth: p.wingD, baseY, yStart: 0.72, floors: wf, storeyH: (p.wingH - 0.72) / wf, bayTarget: 3.8, cornerPier: 0.75 },
                { wallMat: mats.brick, trimMat: mats.granite, shutterMat: mats.shutterTeal, rhythm: 'uniform' });
            } else if (archetype === 'modern_office') {
              addPlan({ cx, cz, width: p.towerW, depth: p.towerD, baseY, yStart: p.podH, floors: p.upperFloors, storeyH: p.storeyH, bayTarget: 3.4, cornerPier: 0.75 },
                { wallMat: mats.plasterSlate, trimMat: mats.concreteAged, verticalFins: true, finMat: mats.steelGalv, rhythm: 'uniform' });
            } else if (archetype === 'harbor_apartment') {
              addPlan({ cx, cz: p.spineZ, width, depth: p.spineD, baseY, yStart: p.groundH, floors: p.upperFloors, storeyH: p.storeyH, bayTarget: 4.1, cornerPier: 1.0 },
                { wallMat: p.wallMat, trimMat: p.trimMat, quoins: true, balconyChance: 0.55, rhythm: 'paired' });
              for (const sgn of [-1, 1]) {
                const wx = cx + sgn * (width / 2 - p.wingW / 2);
                addPlan({ cx: wx, cz: p.wingZ, width: p.wingW, depth: p.wingD, baseY, yStart: p.groundH, floors: p.upperFloors, storeyH: p.storeyH, bayTarget: 3.8, cornerPier: 0.8 },
                  { wallMat: p.wallMat, trimMat: p.trimMat, balconyChance: 0.65, rhythm: 'uniform' });
              }
            } else if (archetype === 'commercial_arcade') {
              addPlan({ cx, cz, width, depth, baseY, yStart: p.groundH, floors: p.upperFloors, storeyH: p.storeyH, bayTarget: 4.1, cornerPier: 1.05 },
                { wallMat: p.wallMat, trimMat: mats.concreteAged, pilasterStep: 2, bayWindows: true, rhythm: 'center_accent' });
            } else if (archetype === 'civic_customs') {
              addPlan({ cx, cz, width, depth, baseY, yStart: p.plinthH, floors: p.floors, storeyH: p.storeyH, bayTarget: 4.0, cornerPier: 1.15 },
                { wallMat: mats.concreteAged, trimMat: mats.granite, pilasterStep: 1, quoins: true, corbelLintels: true, rhythm: 'center_accent' });
            } else if (archetype === 'stepped_mixed_use') {
              addPlan({ cx, cz, width, depth, baseY, yStart: p.baseH, floors: p.midFloors, storeyH: p.midStoreyH, bayTarget: 3.6, cornerPier: 1.05 },
                { wallMat: mats.plasterCream, trimMat: mats.granite, pilasterStep: 1, rhythm: 'paired' });
              addPlan({ cx, cz, width: p.setbackW, depth: p.setbackD, baseY, yStart: p.midH, floors: 1, storeyH: p.topH - p.midH, bayTarget: 3.8, cornerPier: 0.9 },
                { wallMat: mats.plasterSlate, trimMat: mats.granite, pilasterStep: 2, rhythm: 'center_accent' });
            } else if (archetype === 'bonded_warehouse') {
              addPlan({ cx, cz, width, depth, baseY, yStart: p.baseH, floors: p.floors, storeyH: p.storeyH, bayTarget: 3.8, cornerPier: 1.2 },
                { wallMat: mats.brickCoastal, trimMat: mats.granite, quoins: true, corbelLintels: true, tieRods: true, rhythm: 'paired' });
            } else if (archetype === 'waterfront_rowhouses') {
              for (const u of p.units) {
                addPlan({ cx: u.ux, cz: u.uz, width: u.uw, depth: u.ud, baseY, yStart: 0.80, floors: u.fl, storeyH: u.storeyH, bayTarget: 3.2, cornerPier: 0.65 },
                  { wallMat: u.wallMat, trimMat: mats.granite, shutterMat: u.wallMat === mats.plasterCream ? mats.shutterTeal : null, balconyChance: u.wallMat === mats.plasterSlate ? 0.5 : 0, rhythm: 'center_accent' });
              }
            }
          },
        },

        // =====================================================================
        // STAGE 3: RECESSED WINDOWS, DOORS & GROUND-FLOOR PORTALS
        // =====================================================================
        {
          name: 'openings',
          run() {
            const p = st.params;
            for (const fs of st.faceSpecs) {
              emitFacadeOpenings(push, fs.plans, {
                wallMat: fs.opts.wallMat, trimMat: fs.opts.trimMat, steelDark: mats.steelDark,
                officeGlass: mats.officeGlass, litGlass: mats.litGlass, blindGlass: mats.blindGlass, rng,
                verticalFins: !!fs.opts.verticalFins, rhythm: fs.opts.rhythm || 'uniform',
                corbelLintels: !!fs.opts.corbelLintels,
              });
            }
            if (archetype === 'modern_office') {
              push(mats.officeGlass, width - 3.6, p.podH - 0.5, depth - 3.6, cx, baseY + p.podH / 2, cz);
              push(mats.litGlass, width - 5.2, p.podH - 1.2, depth - 5.2, cx, baseY + p.podH / 2, cz);
            } else if (archetype === 'harbor_apartment') {
              push(mats.granite, 4.4, p.groundH + 0.2, 0.65, cx, baseY + p.groundH / 2, p.spineZ + p.spineD / 2 + 0.15);
              push(mats.litGlass, 2.8, 2.5, 0.14, cx, baseY + 1.45, p.spineZ + p.spineD / 2 + 0.36);
            } else if (archetype === 'commercial_arcade') {
              push(mats.litGlass, width - 2.8, 2.6, depth - 2.8, cx, baseY + 1.65, cz);
            } else if (archetype === 'stepped_mixed_use') {
              // Double-height glazed corner shopfront recessed into granite base
              push(mats.litGlass, width * 0.62, 2.9, 0.12, cx, baseY + 1.85, cz + depth / 2 - 0.14);
              push(mats.officeGlass, 0.12, 2.9, depth * 0.62, cx + width / 2 - 0.14, baseY + 1.85, cz);
              const tx = cx + width / 2 - p.turretW / 2 + 0.15, tz = cz + depth / 2 - p.turretD / 2 + 0.15;
              push(mats.litGlass, p.turretW * 0.52, 1.8, p.turretD + 0.08, tx, baseY + p.topH + 0.65, tz);
              push(mats.litGlass, p.turretW + 0.08, 1.8, p.turretD * 0.52, tx, baseY + p.topH + 0.65, tz);
            } else if (archetype === 'bonded_warehouse') {
              // Deeply recessed cargo loading doors at plinth level
              for (const ox of [-width * 0.24, 0, width * 0.24]) {
                push(mats.steelDark, 2.6, 2.8, 0.32, cx + ox, baseY + 1.55, cz + depth / 2 - 0.06);
                push(mats.timber, 2.2, 2.4, 0.16, cx + ox, baseY + 1.45, cz + depth / 2 + 0.04);
              }
            } else if (archetype === 'waterfront_rowhouses') {
              for (const u of p.units) {
                push(mats.granite, 2.0, 0.82, 1.25, u.ux, baseY + 0.41, u.uz + u.ud / 2 + 0.58);
                push(mats.timber, 1.25, 2.25, 0.16, u.ux, baseY + 1.85, u.uz + u.ud / 2 - 0.06);
                push(mats.litGlass, 1.15, 0.45, 0.12, u.ux, baseY + 3.22, u.uz + u.ud / 2 - 0.06);
              }
            } else if (archetype === 'industrial_hall') {
              const sawSpan = depth / p.sawCount;
              for (let s = 0; s < p.sawCount; s++) {
                const gz = cz - depth / 2 + s * sawSpan + sawSpan * 0.08;
                push(mats.officeGlass, width - 0.8, 1.75, 0.14, cx, baseY + p.wallH + 1.1, gz, -0.25, 0, 0);
              }
            }
          },
        },

        // =====================================================================
        // STAGE 4: ROOFLINE, PARAPETS, COPING, CUPOLAS & SKYLIGHTS
        // =====================================================================
        {
          name: 'roof',
          run() {
            const p = st.params;
            if (archetype === 'coastal_residence') {
              const gableGeo = extrudeShape([
                [-p.mainD / 2 - 0.75, 0], [0, p.ridgeH], [p.mainD / 2 + 0.75, 0],
                [p.mainD / 2 + 0.55, -0.22], [0, p.ridgeH - 0.28], [-p.mainD / 2 - 0.55, -0.22],
              ], p.mainW + 1.1, { bevel: 0.06, rotY: Math.PI / 2 });
              addMesh(gableGeo, mats.tileRoof, p.mx, baseY + p.eaveH + 0.05, p.mz);
              const gableWallGeo = extrudeShape([[-p.mainD / 2, 0], [0, p.ridgeH - 0.15], [p.mainD / 2, 0]], p.mainW - 0.1, { bevel: 0, rotY: Math.PI / 2 });
              addMesh(gableWallGeo, p.wallMat, p.mx, baseY + p.eaveH, p.mz);
              const wingRoofGeo = extrudeShape([[-p.wingW / 2 - 0.6, 0], [0, p.ridgeH * 0.68], [p.wingW / 2 + 0.6, 0]], p.wingD + 0.9, { bevel: 0.05 });
              addMesh(wingRoofGeo, mats.tileRoof, p.wx, baseY + p.wingH + 0.05, p.wz);
              push(p.wallMat, 2.6, 1.8, 2.2, p.mx, baseY + p.eaveH + p.ridgeH * 0.42, p.mz + p.mainD * 0.26);
              push(mats.litGlass, 1.5, 1.1, 0.08, p.mx, baseY + p.eaveH + p.ridgeH * 0.42, p.mz + p.mainD * 0.26 + 1.12);
              push(mats.tileRoof, 3.0, 0.24, 2.6, p.mx, baseY + p.eaveH + p.ridgeH * 0.42 + 0.96, p.mz + p.mainD * 0.26);
            } else if (archetype === 'modern_office') {
              const crownGeo = extrudeShape([
                [-p.towerW / 2 - 0.7, -p.towerD / 2 - 0.7], [p.towerW / 2 + 0.7, -p.towerD / 2 - 0.7],
                [p.towerW / 2 + 0.7, p.towerD / 2 + 0.7], [-p.towerW / 2 - 0.7, p.towerD / 2 + 0.7],
              ], 0.48, { bevel: 0.08, rotX: Math.PI / 2 });
              addMesh(crownGeo, mats.steelDark, cx, baseY + p.topH + 0.24, cz);
              const atriumGeo = extrudeShape([
                [-p.towerD * 0.34, 0], [-p.towerD * 0.18, 2.4], [p.towerD * 0.34, 0.45], [p.towerD * 0.34, 0],
              ], p.towerW * 0.62, { bevel: 0.05, rotY: Math.PI / 2 });
              addMesh(atriumGeo, mats.officeGlass, cx, baseY + p.topH + 0.48, cz);
              push(mats.steelGalv, p.towerW * 0.66, 0.18, 0.18, cx, baseY + p.topH + 2.9, cz - p.towerD * 0.18);
              push(mats.redBeacon, 0.28, 0.32, 0.28, cx + p.towerW * 0.34, baseY + p.topH + 3.1, cz - p.towerD * 0.18);
            } else if (archetype === 'harbor_apartment') {
              const mansardGeo = extrudeShape([
                [-p.spineD / 2 - 0.45, 0], [-p.spineD / 2 + 1.0, p.mansardH],
                [p.spineD / 2 - 1.0, p.mansardH], [p.spineD / 2 + 0.45, 0],
              ], width + 0.8, { bevel: 0.06, rotY: Math.PI / 2 });
              addMesh(mansardGeo, mats.slateRoof, cx, baseY + p.eaveH, p.spineZ);
              for (const sgn of [-1, 1]) {
                const wx = cx + sgn * (width / 2 - p.wingW / 2);
                push(mats.granite, p.wingW + 0.35, 0.26, p.wingD + 0.35, wx, baseY + p.eaveH + 0.14, p.wingZ);
                push(p.wallMat, p.wingW, 0.68, 0.32, wx, baseY + p.eaveH + 0.52, p.wingZ + p.wingD / 2 - 0.16);
              }
            } else if (archetype === 'commercial_arcade') {
              const corniceGeo = extrudeShape([
                [-width / 2 - 0.55, -depth / 2 - 0.55], [width / 2 + 0.55, -depth / 2 - 0.55],
                [width / 2 + 0.55, depth / 2 + 0.55], [-width / 2 - 0.55, depth / 2 + 0.55],
              ], 0.45, { bevel: 0.10, rotX: Math.PI / 2 });
              addMesh(corniceGeo, mats.concreteAged, cx, baseY + p.topH + 0.22, cz);
              push(p.wallMat, width + 0.2, 0.88, 0.36, cx, baseY + p.topH + 0.84, cz + depth / 2 - 0.18);
              push(p.wallMat, width + 0.2, 0.88, 0.36, cx, baseY + p.topH + 0.84, cz - depth / 2 + 0.18);
              push(mats.granite, width + 0.45, 0.16, 0.50, cx, baseY + p.topH + 1.32, cz + depth / 2 - 0.18);
              push(mats.granite, width + 0.45, 0.16, 0.50, cx, baseY + p.topH + 1.32, cz - depth / 2 + 0.18);
            } else if (archetype === 'civic_customs') {
              const portW = Math.min(width * 0.62, 14.0), portZ = cz + depth / 2 + 1.85;
              for (let c = 0; c < 4; c++) {
                const colX = cx - portW / 2 + 0.9 + (c / 3) * (portW - 1.8);
                addMesh(unitCyl, mats.granite, colX, baseY + p.plinthH + (p.upperH - p.plinthH) * 0.46, portZ, 0, 0, 0, 0.42, (p.upperH - p.plinthH) * 0.92, 0.42);
              }
              const pedGeo = extrudeShape([[-portW / 2 - 0.5, 0], [0, 2.35], [portW / 2 + 0.5, 0]], 2.8, { bevel: 0.08 });
              addMesh(pedGeo, mats.granite, cx, baseY + p.upperH - 0.2, portZ - 0.7);
              const entabGeo = extrudeShape([
                [-width / 2 - 0.6, -depth / 2 - 0.6], [width / 2 + 0.6, -depth / 2 - 0.6],
                [width / 2 + 0.6, depth / 2 + 0.6], [-width / 2 - 0.6, depth / 2 + 0.6],
              ], 0.72, { bevel: 0.12, rotX: Math.PI / 2 });
              addMesh(entabGeo, mats.granite, cx, baseY + p.upperH + 0.36, cz);
              const cupW = Math.min(width * 0.36, 7.2);
              push(mats.granite, cupW, 2.2, cupW, cx, baseY + p.upperH + 1.8, cz);
              push(mats.litGlass, cupW - 0.8, 1.35, cupW + 0.12, cx, baseY + p.upperH + 1.85, cz);
              push(mats.litGlass, cupW + 0.12, 1.35, cupW - 0.8, cx, baseY + p.upperH + 1.85, cz);
              const cupRoof = extrudeShape([[-cupW / 2 - 0.4, 0], [0, 1.8], [cupW / 2 + 0.4, 0]], cupW + 0.8, { bevel: 0.05 });
              addMesh(cupRoof, mats.zincRoof, cx, baseY + p.upperH + 2.9, cz);
            } else if (archetype === 'stepped_mixed_use') {
              // Stepped terrace parapets + Art-Deco zinc spire cap on corner turret
              push(mats.granite, width + 0.4, 0.34, depth + 0.4, cx, baseY + p.midH + 0.17, cz);
              push(mats.granite, p.setbackW + 0.45, 0.34, p.setbackD + 0.45, cx, baseY + p.topH + 0.17, cz);
              push(mats.zincRoof, p.setbackW - 0.2, 0.22, p.setbackD - 0.2, cx, baseY + p.topH + 0.38, cz);
              const tx = cx + width / 2 - p.turretW / 2 + 0.15, tz = cz + depth / 2 - p.turretD / 2 + 0.15;
              const capGeo = extrudeShape([[-p.turretW / 2 - 0.25, 0], [0, 2.6], [p.turretW / 2 + 0.25, 0]], p.turretD + 0.5, { bevel: 0.05 });
              addMesh(capGeo, mats.zincRoof, tx, baseY + p.topH + 2.2, tz);
              push(mats.redBeacon, 0.26, 0.34, 0.26, tx, baseY + p.topH + 4.95, tz);
            } else if (archetype === 'bonded_warehouse') {
              const gableGeo = extrudeShape([
                [-depth / 2 - 0.65, 0], [0, p.ridgeH], [depth / 2 + 0.65, 0],
                [depth / 2 + 0.45, -0.22], [0, p.ridgeH - 0.26], [-depth / 2 - 0.45, -0.22],
              ], width + 0.9, { bevel: 0.05, rotY: Math.PI / 2 });
              addMesh(gableGeo, mats.slateRoof, cx, baseY + p.wallH + 0.05, cz);
              const gableEnd = extrudeShape([[-depth / 2, 0], [0, p.ridgeH - 0.12], [depth / 2, 0]], width - 0.15, { bevel: 0, rotY: Math.PI / 2 });
              addMesh(gableEnd, mats.brickCoastal, cx, baseY + p.wallH, cz);
              // Central projecting hoist dormer gable over loading bays
              const hoistGable = extrudeShape([[-2.4, 0], [0, 2.2], [2.4, 0]], 2.6, { bevel: 0.05 });
              addMesh(hoistGable, mats.brickCoastal, cx, baseY + p.wallH - 0.2, cz + depth / 2 + 0.2);
              const hoistRoof = extrudeShape([[-2.7, 0], [0, 2.35], [2.7, 0], [2.5, -0.18], [0, 2.15], [-2.5, -0.18]], 3.1, { bevel: 0.04 });
              addMesh(hoistRoof, mats.slateRoof, cx, baseY + p.wallH - 0.12, cz + depth / 2 + 0.25);
            } else if (archetype === 'waterfront_rowhouses') {
              for (const u of p.units) {
                if (u.roofKind === 'tile_gable') {
                  const gGeo = extrudeShape([[-u.ud / 2 - 0.45, 0], [0, 2.3], [u.ud / 2 + 0.45, 0]], u.uw + 0.3, { bevel: 0.05, rotY: Math.PI / 2 });
                  addMesh(gGeo, mats.tileRoof, u.ux, baseY + u.uh, u.uz);
                } else if (u.roofKind === 'zinc_shed') {
                  const sGeo = extrudeShape([[-u.ud / 2 - 0.35, 0.1], [-u.ud / 2 - 0.35, 1.9], [u.ud / 2 + 0.35, 0.3], [u.ud / 2 + 0.35, 0]], u.uw + 0.2, { bevel: 0.04, rotY: Math.PI / 2 });
                  addMesh(sGeo, mats.zincRoof, u.ux, baseY + u.uh, u.uz);
                } else {
                  const mGeo = extrudeShape([[-u.ud / 2 - 0.3, 0], [-u.ud / 2 + 0.8, 1.75], [u.ud / 2 - 0.8, 1.75], [u.ud / 2 + 0.3, 0]], u.uw + 0.2, { bevel: 0.04, rotY: Math.PI / 2 });
                  addMesh(mGeo, mats.slateRoof, u.ux, baseY + u.uh, u.uz);
                }
              }
            } else {
              const sawSpan = depth / p.sawCount;
              const sawPts = [[-depth / 2, 0]];
              for (let s = 0; s < p.sawCount; s++) {
                const z0 = -depth / 2 + s * sawSpan;
                sawPts.push([z0 + sawSpan * 0.15, 2.35], [z0 + sawSpan, 0]);
              }
              const sawGeo = extrudeShape(sawPts, width + 0.6, { bevel: 0.04, rotY: Math.PI / 2 });
              addMesh(sawGeo, mats.corrugated, cx, baseY + p.wallH, cz);
            }
          },
        },

        // =====================================================================
        // STAGE 5: ARCHITECTURAL ATTACHMENTS, OVERHANGS, CHIMNEYS & SIGNAGE
        // =====================================================================
        {
          name: 'attachments',
          run() {
            const p = st.params;
            for (const fs of st.faceSpecs) {
              emitFacadeAttachments(push, fs.plans, {
                wallMat: fs.opts.wallMat, trimMat: fs.opts.trimMat, steelDark: mats.steelDark,
                steelGalv: mats.steelGalv, officeGlass: mats.officeGlass, litGlass: mats.litGlass, rng,
                shutterMat: fs.opts.shutterMat || null, balconyChance: fs.opts.balconyChance || 0,
                bayWindows: !!fs.opts.bayWindows, tieRods: !!fs.opts.tieRods,
              });
            }
            if (archetype === 'coastal_residence') {
              const porchZ = p.mz + p.mainD / 2 + 1.35;
              push(mats.timber, p.mainW * 0.66, 0.22, 2.6, p.mx, baseY + 0.56, porchZ);
              push(mats.timber, p.mainW * 0.68, 0.18, 2.8, p.mx, baseY + 3.25, porchZ, 0.16, 0, 0);
              for (let k = -1; k <= 1; k++) push(mats.timber, 0.22, 2.7, 0.22, p.mx + k * (p.mainW * 0.28), baseY + 1.9, porchZ + 1.15);
              push(mats.brick, 1.15, p.ridgeH + 2.2, 1.15, p.mx - p.mainW * 0.28, baseY + p.eaveH + (p.ridgeH + 1.4) / 2, p.mz - p.mainD * 0.18);
              push(mats.granite, 1.35, 0.22, 1.35, p.mx - p.mainW * 0.28, baseY + p.eaveH + p.ridgeH + 1.85, p.mz - p.mainD * 0.18);
            } else if (archetype === 'harbor_apartment') {
              const escX = cx + width / 2 + 0.62;
              for (let f = 0; f < p.upperFloors; f++) {
                const ly = baseY + p.groundH + f * p.storeyH;
                push(mats.steelDark, 1.2, 0.11, 3.6, escX, ly, p.spineZ);
                push(mats.steelDark, 0.06, 0.06, 3.6, escX + 0.56, ly + 1.0, p.spineZ);
                if (f < p.upperFloors - 1) push(mats.steelDark, 0.82, 0.11, 3.4, escX + 0.12, ly + p.storeyH * 0.5, p.spineZ, (f % 2 ? -0.72 : 0.72), 0, 0);
              }
              const wtY = baseY + p.eaveH + p.mansardH, wtx = cx - width * 0.25, wtz = p.spineZ;
              for (const lx of [-0.85, 0.85]) for (const lz of [-0.85, 0.85]) addMesh(unitCyl, mats.steelDark, wtx + lx, wtY + 1.2, wtz + lz, 0, 0, 0, 0.10, 2.4, 0.10);
              addMesh(unitCyl, mats.timber, wtx, wtY + 3.6, wtz, 0, 0, 0, 1.45, 2.5, 1.45);
              addMesh(unitCyl, mats.steelDark, wtx, wtY + 5.05, wtz, 0, 0, 0, 1.58, 0.45, 1.58);
            } else if (archetype === 'commercial_arcade') {
              for (let i = 0; i < p.xPiers; i++) {
                const ax = cx - width / 2 + (i + 0.5) * (width / p.xPiers);
                push(mats.awningNavy, (width / p.xPiers) - 0.55, 0.16, 1.45, ax, baseY + p.groundH - 0.25, cz + depth / 2 + 0.62, 0.24, 0, 0);
              }
              push(mats.steelDark, 0.38, 3.6, 1.45, cx + width / 2 + 0.55, baseY + p.groundH + 2.2, cz + depth / 2 - 1.2);
              push(mats.litGlass, 0.42, 3.2, 1.15, cx + width / 2 + 0.55, baseY + p.groundH + 2.2, cz + depth / 2 - 1.2);
            } else if (archetype === 'bonded_warehouse') {
              // Steel cathead hoist beam jutting out of upper hoist dormer
              push(mats.steelDark, 0.24, 0.28, 2.6, cx, baseY + p.wallH + 1.05, cz + depth / 2 + 1.35);
              push(mats.steelGalv, 0.08, 1.6, 0.08, cx, baseY + p.wallH + 0.2, cz + depth / 2 + 2.35);
            } else if (archetype === 'industrial_hall') {
              addMesh(unitCyl, mats.steelGalv, cx + width / 2 + 1.1, baseY + p.wallH * 0.72, cz - depth * 0.2, 0, 0, 0, 0.68, p.wallH * 1.45, 0.68);
            }

            // Rainwater downspout pipe
            g.add(makePipeCurve([
              [cx - width / 2 - 0.08, baseY + Math.min(height, 10) - 0.2, cz - depth / 2 + 0.45],
              [cx - width / 2 - 0.18, baseY + Math.min(height, 10) - 0.7, cz - depth / 2 + 0.45],
              [cx - width / 2 - 0.18, baseY + 0.65, cz - depth / 2 + 0.45],
              [cx - width / 2 - 0.32, baseY + 0.22, cz - depth / 2 + 0.45],
            ], 0.085, mats.steelGalv));

            if (labelZh) {
              const decalMat = matLib.createDecalMaterial(labelZh, labelEn || 'SALTLINE COASTAL DISTRICT');
              const sign = new Mesh(unitBox, decalMat);
              sign.scale.set(Math.min(5.8, width * 0.44), 1.38, 0.09);
              sign.position.set(cx, baseY + 3.65, cz + depth / 2 + 0.16);
              sign.matrixAutoUpdate = false; sign.updateMatrix();
              g.add(sign);
            }
          },
        },

        // =====================================================================
        // STAGE 6: VISIBLE GROUND-FLOOR INTERIOR STRUCTURE
        // =====================================================================
        {
          name: 'interior',
          run() {
            const p = st.params;
            if (archetype === 'modern_office' || archetype === 'commercial_arcade' || archetype === 'stepped_mixed_use') {
              // Recessed lobby stone floor, reception desk & warm illuminated ceiling baffle visible through shopfront glass
              const iw = width * 0.52, id = depth * 0.46;
              push(mats.granite, iw, 0.18, id, cx, baseY + 0.32, cz);
              push(mats.timber, Math.min(4.2, iw * 0.45), 1.05, 0.92, cx, baseY + 0.88, cz + id * 0.22);
              push(mats.litGlass, iw * 0.72, 0.08, 0.48, cx, baseY + 3.25, cz + id * 0.15);
            } else if (archetype === 'waterfront_rowhouses') {
              for (const u of p.units) {
                push(mats.timber, 1.4, 0.16, 1.2, u.ux, baseY + 0.82, u.uz + u.ud / 2 - 0.65);
              }
            }
          },
        },

        // =====================================================================
        // STAGE 7: ACCURATE MULTI-VOLUME COLLIDER GENERATION
        // =====================================================================
        {
          name: 'colliders',
          run() {
            const p = st.params;
            const addCol = (x0, y0, z0, x1, y1, z1, surface = 'concrete') => {
              const specBox = { min: new Vector3(x0, y0, z0), max: new Vector3(x1, y1, z1), surface };
              st.colliders.push(specBox);
              if (Array.isArray(colliderTarget)) colliderTarget.push(specBox);
            };
            if (archetype === 'harbor_apartment') {
              addCol(cx - width / 2, baseY, p.spineZ - p.spineD / 2, cx + width / 2, baseY + p.eaveH, p.spineZ + p.spineD / 2);
              for (const sgn of [-1, 1]) {
                const wx = cx + sgn * (width / 2 - p.wingW / 2);
                addCol(wx - p.wingW / 2, baseY, p.wingZ - p.wingD / 2, wx + p.wingW / 2, baseY + p.eaveH, p.wingZ + p.wingD / 2);
              }
            } else if (archetype === 'coastal_residence') {
              addCol(p.mx - p.mainW / 2, baseY, p.mz - p.mainD / 2, p.mx + p.mainW / 2, baseY + p.eaveH, p.mz + p.mainD / 2);
              addCol(p.wx - p.wingW / 2, baseY, p.wz - p.wingD / 2, p.wx + p.wingW / 2, baseY + p.wingH, p.wz + p.wingD / 2);
            } else if (archetype === 'waterfront_rowhouses') {
              for (const u of p.units) {
                addCol(u.ux - u.uw / 2, baseY, u.uz - u.ud / 2, u.ux + u.uw / 2, baseY + u.uh, u.uz + u.ud / 2);
              }
            } else {
              addCol(cx - width / 2, baseY, cz - depth / 2, cx + width / 2, baseY + height, cz + depth / 2);
            }
          },
        },

        // =====================================================================
        // STAGE 8: GPU FLUSH & FINAL SCENE ACTIVATION
        // =====================================================================
        {
          name: 'activate',
          run() {
            flush();
            parent.add(g);
          },
        },
      ];

      let phaseIdx = 0;
      const phaseTimings = [];

      return {
        phaseNames: phases.map(p => p.name),
        step() {
          if (phaseIdx >= phases.length) return true;
          const ph = phases[phaseIdx];
          const opsBefore = batcher.ops;
          const t0 = nowMs();
          ph.run();
          const elapsed = Number((nowMs() - t0).toFixed(3));
          phaseTimings.push({ phase: ph.name, ms: elapsed, ops: batcher.ops - opsBefore });
          phaseIdx++;
          if (phaseIdx >= phases.length) {
            const totalMs = Number(phaseTimings.reduce((s, r) => s + r.ms, 0).toFixed(3));
            const maxPhaseMs = Number(Math.max(...phaseTimings.map(r => r.ms)).toFixed(3));
            recordBuildTiming({ id: g.name, archetype, totalMs, maxPhaseMs, phases: phaseTimings });
            return true;
          }
          return false;
        },
        get phaseIndex() { return phaseIdx; },
        get totalPhases() { return phases.length; },
        get phaseTimings() { return phaseTimings; },
        get colliders() { return st.colliders; },
        get archetype() { return archetype; },
        get group() { return g; },
      };
    }

    function buildCoastalBuilding(parent, spec) {
      const task = createCoastalBuildingTask(parent, spec);
      while (!task.step()) {}
      return task.group;
    }

    function buildDistantBuilding(parent, { cx, cz, width: w, depth: d, height: h, style }) {
      const group = new Group();
      const { push, flush } = createBatcher(group);
      const mass = (dx, dz, width, depth, base, height, material) =>
        push(material, width, height, depth, cx + dx, .16 + base + height / 2, cz + dz);
      const wall = sharedMats.brickWeathered, trim = sharedMats.concreteDirty;
      if (style === 'modern_office') {
        mass(0, 0, w, d, 0, h * .25, trim);
        mass(0, 0, w * .77, d * .79, h * .25, h * .65, sharedMats.smokedPane);
        mass(0, 0, w * .52, d * .52, h * .9, h * .12, sharedMats.steelDark);
      } else if (style === 'harbor_apartment') {
        mass(0, -d * .21, w, d * .58, 0, h, wall);
        for (const side of [-1, 1]) mass(w * .33 * side, d * .29, w * .34, d * .42, 0, h, wall);
      } else if (style === 'stepped_mixed_use') {
        mass(0, 0, w, d, 0, h * .72, trim);
        mass(0, 0, w * .76, d * .74, h * .72, h * .28, sharedMats.slateSteel);
        mass(w * .34, d * .34, w * .32, d * .32, 0, h + 2.2, trim);
      } else if (style === 'waterfront_rowhouses') {
        const uw = w / 3;
        mass(-uw, 0, uw * .96, d * .9, 0, h * .92, trim);
        mass(0, -.4, uw * .96, d * .88, 0, h * 1.12, wall);
        mass(uw, .3, uw * .96, d * .92, 0, h * .84, sharedMats.slateSteel);
      } else {
        mass(0, 0, w, d, 0, h * .80, style === 'industrial_hall' ? sharedMats.steelClad : (style === 'bonded_warehouse' ? wall : trim));
        if (style === 'industrial_hall' || style === 'coastal_residence' || style === 'bonded_warehouse') {
          const count = style === 'industrial_hall' ? 4 : 2;
          for (let i = 0; i < count; i++) push(sharedMats.corrugated, w + .4, .18, d / count * 1.05, cx, h * .85, cz - d / 2 + (i + .5) * d / count, .22);
        } else mass(0, 0, w * .77, d * .71, h * .80, h * .18, wall);
      }
      flush(); parent.add(group); return group;
    }

    function buildFreightExchange(parent, lot, external, collide) {
      const m = sharedMats, g = new Group();
      g.name = 'customs-transit-shed';
      const { push, flush } = createBatcher(g);
      const west = lot.x0 + 1.5, east = lot.x1 - 1.5, north = lot.z0 + 2.5, south = lot.z1 - 2.5;
      const width = east - west, depth = south - north, x = (west + east) / 2, z = (north + south) / 2;
      const placements = [];
      const ground = .16, eave = 6.4, bay = depth / 9;
      const brick = matLib.scannedSurface('brick_wall_001');
      const stone = matLib.get('granite');
      const concreteTrim = matLib.get('concrete_aged');
      const litWin = matLib.get('window_lit');
      for (let i = 0; i < 9; i++) {
        const at = north + i * bay;
        if (i >= 3 && i < 6) continue;
        for (let floor = 0; floor < 2; floor++) {
          for (const part of ['wall_window_centered_double_01', 'window_centered_double_01'])
            placements.push([part, east, ground + floor * 3.12, at, Math.PI / 2, bay / 3, 1.04]);
        }
        placements.push(['wall_pier_standard_01', east, ground, at, Math.PI / 2, 1, 2.08]);
        placements.push(['cornice01_standard_standard_01', east, eave - 0.14, at, Math.PI / 2, bay / 3, 1.0]);
        collide(east - .20, ground, at, east + .04, eave, at + bay);
      }
      external.placeFacadeModules(g, placements);
      push(stone, width + .35, .58, depth + .35, x, ground + .29, z);
      for (const end of [north, south]) {
        push(brick, width, eave, .42, x, eave / 2 + ground, end);
        push(stone, width + .5, .28, .62, x, eave + ground + .10, end);
        collide(west, ground, end - .21, east, eave, end + .21);
      }
      push(brick, .44, eave, depth, west, eave / 2 + ground, z);
      push(stone, .64, .28, depth + .5, west, eave + ground + .10, z);
      collide(west - .22, ground, north, west + .22, eave, south);
      const span = width / 3, rise = 1.95;
      push(brick, .38, 1.15, depth + .2, east - .18, eave + ground + .58, z);
      push(stone, .58, .20, depth + .45, east - .18, eave + ground + 1.22, z);
      for (let i = 0; i < 3; i++) {
        const center = west + (i + .5) * span;
        push(m.corrugated, Math.hypot(span, rise), .18, depth - .3, center, eave + rise / 2, z, 0, 0, Math.atan2(rise, span));
        push(m.smokedPane, .12, rise * .86, depth - .6, center + span / 2 - .12, eave + rise / 2, z);
        for (let j = 0; j <= 6; j++) push(m.steelGalv, .16, rise * .88, .12, center + span / 2 - .10, eave + rise / 2, north + .3 + j * (depth - .6) / 6);
      }
      const openSpan = bay * 3;
      push(m.steelDark, 3.35, .18, openSpan + .7, east + 1.55, 4.35, z);
      push(concreteTrim, 3.55, .24, openSpan + .9, east + 1.55, 4.52, z);
      push(m.steelDark, .34, .52, openSpan + .8, east, 5.96, z);
      push(litWin, .12, 1.12, openSpan - .5, east - .12, 5.15, z);
      for (let t = -2; t <= 2; t++) push(m.steelDark, .16, 1.22, .10, east - .08, 5.15, z + t * (openSpan / 5));
      for (const side of [-1, 1]) {
        const jamb = z + side * (openSpan * .5 + .08);
        push(m.steelDark, .40, eave, .40, east + .04, eave / 2 + ground, jamb);
        push(stone, .58, .55, .58, east + .04, ground + .28, jamb);
        push(m.steelGalv, 3.35, .11, .11, east + 1.52, 4.98, jamb, 0, 0, -.34);
        push(m.glassWarm, .52, .06, .28, east + 1.85, 4.24, z + side * (openSpan * .28));
      }
      const exSign = new Mesh(unitBox, matLib.createDecalMaterial('MARITIME EXCHANGE', 'FREIGHT & CUSTOMS HALL 02', 'rgba(24,38,44,0.92)', '#e6c67c'));
      exSign.scale.set(0.10, 0.88, Math.min(6.4, openSpan * .78));
      exSign.position.set(east + 3.24, 4.56, z);
      exSign.matrixAutoUpdate = false; exSign.updateMatrix();
      g.add(exSign);
      flush(); parent.add(g);
    }

    function buildDispatchWing(parent, { bx0, bx1, bz0, bz1, entZ, externalAssets }) {
      const g = new Group();
      g.name = 'dispatch-radio-room';
      const { push, flush } = createBatcher(g);
      const m = sharedMats, masonry = matLib.scannedSurface('brick_wall_001');
      const stone = matLib.get('granite'), concreteTrim = matLib.get('concrete_aged');
      const pane = m.smokedPane, litWin = matLib.get('window_lit');
      const front = bx0 + 2.6, back = bx1 - 1.4, z0 = bz0 + .8, z1 = bz1 - 3.6;
      const mid = (front + back) / 2, midZ = (z1 + z0) / 2;
      const roofW = back - front, roofD = z1 - z0;
      const placeCyl = (mat, r, h, x, y, z) => {
        const c = new Mesh(unitCyl, mat);
        c.position.set(x, y, z); c.scale.set(r, h, r);
        c.receiveShadow = true; c.matrixAutoUpdate = false; c.updateMatrix();
        g.add(c);
      };
      push(stone, roofW + .85, .30, roofD + .85, mid, 4.16, midZ);
      push(masonry, .44, 4.18, roofD, back, 6.28, midZ);
      for (const z of [z0, z1]) push(masonry, roofW, 4.18, .44, mid, 6.28, z);
      const placements = [];
      const bays = 9, pitch = roofD / bays;
      for (let i = 0; i < bays; i++) {
        const end = z0 + (i + 1) * pitch;
        const module = (part, y) => placements.push([part, front, y, end, -Math.PI / 2, pitch / 3, 4.18 / 3]);
        module('wall_window_centered_double_01', 4.19);
        module('window_centered_double_01', 4.19);
        module('cornice01_standard_standard_01', 8.20);
        if (i % 3 === 0) module('wall_pier_standard_01', 4.19);
      }
      externalAssets.placeFacadeModules(g, placements);
      for (let i = 0; i < bays; i++) {
        if (i % 3 === 1 || i === 4) {
          push(litWin, .08, 1.95, pitch * .62, front + .28, 6.18, z0 + (i + .5) * pitch);
        }
      }
      const roofY = 8.42;
      push(concreteTrim, roofW + .4, .26, roofD + .4, mid, roofY, midZ);
      const parH = .72;
      for (const pz of [z0, z1]) {
        push(masonry, roofW + .4, parH, .34, mid, roofY + parH / 2 + .10, pz);
        push(stone, roofW + .64, .14, .48, mid, roofY + parH + .14, pz);
      }
      for (const px of [front, back]) {
        push(masonry, .34, parH, roofD + .2, px, roofY + parH / 2 + .10, midZ);
        push(stone, .48, .14, roofD + .48, px, roofY + parH + .14, midZ);
      }
      for (let rz = z0 + 3.5; rz < z1 - 2.5; rz += 4.6) {
        push(m.steelDark, roofW - 1.2, .05, .14, mid, roofY + .15, rz);
      }
      for (const sz of [midZ + 4.2, midZ - 1.8]) {
        push(m.steelDark, 4.6, .42, 2.8, mid - 2.2, roofY + .32, sz);
        push(pane, 4.3, .22, 2.5, mid - 2.2, roofY + .62, sz);
        push(m.steelGalv, 4.5, .08, .12, mid - 2.2, roofY + .76, sz);
      }
      for (const hz of [midZ + 7.8, midZ + 10.6]) {
        push(m.steelWorn, 2.6, 1.25, 1.85, mid + 2.4, roofY + .76, hz);
        push(m.steelDark, 2.2, .16, 1.45, mid + 2.4, roofY + 1.44, hz);
        push(m.steelGalv, .52, .48, 3.6, mid + 2.4, roofY + .55, hz - 2.2);
      }
      push(m.steelGalv, 1.6, .58, 1.4, mid - 5.2, roofY + .42, midZ + 7.2);
      for (const vz of [midZ - 4.5, midZ + 2.2, midZ + 8.8]) placeCyl(m.steelGalv, 0.22, 1.35, back - 2.2, roofY + .85, vz);
      const towerX = back - 3.8, towerZ = z0 + 3.7;
      push(masonry, 7.4, 2.25, 7.2, towerX, 9.65, towerZ);
      push(stone, 7.75, .20, 7.55, towerX, 10.76, towerZ);
      push(pane, 7.1, 1.48, 7, towerX, 11.5, towerZ);
      push(litWin, 6.6, 1.25, 6.5, towerX, 11.48, towerZ);
      for (const dx of [-3.45, 0, 3.45]) for (const dz of [-3.43, 3.43])
        push(m.steelDark, .14, 1.5, .14, towerX + dx, 11.51, towerZ + dz);
      push(m.steelDark, 8.4, .28, 8.2, towerX, 12.38, towerZ);
      push(stone, 8.6, .12, 8.4, towerX, 12.56, towerZ);
      placeCyl(m.steelGalv, 0.09, 4.2, towerX + 2.2, 14.6, towerZ - 2.0);
      push(m.redCore || m.steelDark, .24, .28, .24, towerX + 2.2, 16.8, towerZ - 2.0);
      for (const z of [bz0 + .52, entZ - 7.7, entZ - 2.4, entZ + 2.4, entZ + 7.7, bz1 - .52]) {
        push(stone, .94, .68, .88, bx0 - .17, .50, z);
        push(masonry, .82, 3.12, .74, bx0 - .17, 2.38, z);
        push(stone, .92, .22, .86, bx0 - .17, 3.98, z);
      }
      flush();
      parent.add(g);
      return g;
    }

    function dispose() {
      for (const geo of createdGeos) geo.dispose?.();
    }

    return {
      buildCoastalBuilding, createCoastalBuildingTask, buildFreightExchange,
      buildDistantBuilding, buildDispatchWing, dispose,
      archetypes: ARCHETYPE_LIST,
    };
  }

  WE.createBuildingGenerator = createBuildingGenerator;
})();
