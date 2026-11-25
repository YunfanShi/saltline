/* WorldEngine/Assets/BuildingGenerator.js
 * 3-Tier Parametric Coastal Architecture Generator (Large / Medium / Micro).
 *   - Large: Stepped setbacks on tall towers, recessed ground arcades, corner stone pilasters,
 *            molded roof cornices, raised parapets, mechanical penthouses & rooftop water towers.
 *   - Medium: Deep recessed window reveals with sills, lintels, mullions, transoms, sloped
 *            storefront canopies with steel tension rods, cantilevered steel balconies with
 *            railings, exterior zig-zag steel fire-escape stairs, AC units, and TubeGeometry
 *            rainwater downspouts & rooftop HVAC ductwork.
 *   - Micro: Baked PBR Normal/Roughness brick, aged concrete, plaster, corrugated steel,
 *            reflective & warm-lit venetian-blind office glass, plus weathered signage decals. */
(() => {
  const WE = (window.WorldEngine = window.WorldEngine || {});

  function createBuildingGenerator(THREE, matLib, sharedMats) {
    const { Group, Mesh, BoxGeometry, CylinderGeometry, InstancedMesh, Object3D, Vector3 } = THREE;
    const unitBox = new BoxGeometry(1, 1, 1);
    const unitCyl = new CylinderGeometry(1, 1, 1, 12);
    const createdGeos = [unitBox, unitCyl];

    const styles = {
      coastal_brick: {
        wall: () => matLib.get('brick_red'),
        trim: () => matLib.get('concrete_aged'),
        plinth: () => matLib.get('concrete_wet'),
        awning: sharedMats.cargoNavy || sharedMats.steelDark,
        balconyChance: 0.48,
        bayTarget: 4.1,
        hasWaterTower: true,
      },
      maritime_office: {
        wall: () => matLib.get('plaster_slate'),
        trim: () => matLib.get('concrete_dry'),
        plinth: () => matLib.get('concrete_aged'),
        awning: sharedMats.cargoTeal || sharedMats.steelDark,
        balconyChance: 0.24,
        bayTarget: 3.7,
        hasWaterTower: false,
      },
      harbor_apartment: {
        wall: () => matLib.get('plaster_cream'),
        trim: () => matLib.get('brick_coastal'),
        plinth: () => matLib.get('concrete_aged'),
        awning: sharedMats.cargoRust || sharedMats.steelDark,
        balconyChance: 0.65,
        bayTarget: 4.4,
        hasWaterTower: true,
      },
      customs_block: {
        wall: () => matLib.get('concrete_aged'),
        trim: () => matLib.get('metal_rusted'),
        plinth: () => matLib.get('concrete_wet'),
        awning: sharedMats.steelDark,
        balconyChance: 0.30,
        bayTarget: 4.0,
        hasWaterTower: false,
      },
    };
    const styleKeys = Object.keys(styles);

    function makePipeCurve(pts, radius, mat) {
      if (typeof THREE.TubeGeometry === 'function' && typeof THREE.CatmullRomCurve3 === 'function') {
        const curve = new THREE.CatmullRomCurve3(pts.map(p => new Vector3(p[0], p[1], p[2])));
        const geo = new THREE.TubeGeometry(curve, Math.max(10, pts.length * 4), radius, 7, false);
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

    function buildCoastalBuilding(parent, {
      cx, cz, width, depth, height, seed = 1, styleName, labelZh, labelEn,
    }) {
      const rng = matLib.mulberry32(seed * 7919 + 31);
      const chosenStyle = styles[styleName] || styles[styleKeys[seed % styleKeys.length]];
      const wallMat = chosenStyle.wall();
      const trimMat = chosenStyle.trim();
      const plinthMat = chosenStyle.plinth();
      const corrugatedMat = matLib.get('corrugated_steel');
      const steelDark = sharedMats.steelDark;
      const steelGalv = sharedMats.steelGalv;
      const safetyYellow = sharedMats.yellowPaint || steelGalv;
      const officeGlass = matLib.get('window_office');
      const litGlass = matLib.get('window_lit');
      const blindGlass = sharedMats.blindPane || officeGlass;
      const redBeacon = sharedMats.redCore || steelDark;

      const g = new Group();
      const batches = new Map();
      const dummy = new Object3D();
      const pushInst = (mat, w, h, d, px, py, pz, rx = 0, ry = 0, rz = 0) => {
        if (!mat) return;
        dummy.position.set(px, py, pz);
        dummy.rotation.set(rx, ry, rz);
        dummy.scale.set(w, h, d);
        dummy.updateMatrix();
        let arr = batches.get(mat);
        if (!arr) { arr = []; batches.set(mat, arr); }
        arr.push(dummy.matrix.clone());
      };

      const baseY = 0.16;
      const groundH = 3.4;
      const totalFloors = Math.max(2, Math.round((height - groundH) / 3.15));
      // Tall buildings (>= 4 upper floors) get an authentic architectural upper setback!
      const hasSetback = totalFloors >= 4 && Math.min(width, depth) >= 16;
      const lowerFloors = hasSetback ? totalFloors - 1 : totalFloors;
      const storeyH = (height - groundH) / totalFloors;
      const mainH = groundH + lowerFloors * storeyH;

      // 1. LARGE STRUCTURE: Interior dark core, corner stone pilasters, stepped roof slab & molded parapet
      pushInst(steelDark, width - 0.85, mainH - 0.35, depth - 0.85, cx, baseY + (mainH - 0.35) / 2, cz);
      // Heavy architectural corner pilasters + quoin bands at all 4 corners
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const px = cx + sx * (width / 2 - 0.12);
          const pz = cz + sz * (depth / 2 - 0.12);
          pushInst(trimMat, 0.72, mainH + 0.55, 0.72, px, baseY + (mainH + 0.55) / 2, pz);
          pushInst(plinthMat, 0.92, 1.15, 0.92, px, baseY + 0.58, pz);
        }
      }
      // Molded projecting main roof cornice (2-tier stepped overhang) + 4-sided raised parapet wall + metal coping
      pushInst(trimMat, width + 0.72, 0.34, depth + 0.72, cx, baseY + mainH + 0.17, cz);
      pushInst(plinthMat, width + 0.96, 0.22, depth + 0.96, cx, baseY + mainH + 0.42, cz);
      const parapetY = baseY + mainH + 0.96;
      pushInst(wallMat, width + 0.16, 0.92, 0.38, cx, parapetY, cz - depth / 2 + 0.19);
      pushInst(wallMat, width + 0.16, 0.92, 0.38, cx, parapetY, cz + depth / 2 - 0.19);
      pushInst(wallMat, 0.38, 0.92, depth - 0.5, cx - width / 2 + 0.19, parapetY, cz);
      pushInst(wallMat, 0.38, 0.92, depth - 0.5, cx + width / 2 - 0.19, parapetY, cz);
      pushInst(steelDark, width + 0.28, 0.10, 0.46, cx, parapetY + 0.50, cz - depth / 2 + 0.19);
      pushInst(steelDark, width + 0.28, 0.10, 0.46, cx, parapetY + 0.50, cz + depth / 2 - 0.19);
      pushInst(steelDark, 0.46, 0.10, depth - 0.4, cx - width / 2 + 0.19, parapetY + 0.50, cz);
      pushInst(steelDark, 0.46, 0.10, depth - 0.4, cx + width / 2 - 0.19, parapetY + 0.50, cz);

      // Helper to build detailed facade bays for either main body or upper setback tier
      const buildFacadeTier = (tierW, tierD, yStart, floors, isGroundIncluded) => {
        for (let face = 0; face < 4; face++) {
          const theta = face * Math.PI / 2;
          const sin = Math.sin(theta), cos = Math.cos(theta);
          const span = face % 2 ? tierD : tierW;
          const offset = (face % 2 ? tierW : tierD) / 2;
          const bays = Math.max(2, Math.round(span / chosenStyle.bayTarget));
          const pitch = span / bays;
          const placeFace = (mat, w, h, d, u, y, inset, rx = 0) => {
            pushInst(mat, w, h, d, cx + cos * u + sin * (offset - inset), baseY + y, cz - sin * u + cos * (offset - inset), rx, theta, 0);
          };

          if (isGroundIncluded) {
            // Ground-floor stone plinth, recessed storefront glazing, structural piers & angled canopies with steel tie-rods
            placeFace(plinthMat, span, 0.62, 0.48, 0, 0.31, 0.18);
            placeFace(trimMat, span + 0.32, 0.42, 0.56, 0, groundH - 0.12, 0.12);
            for (let b = 0; b < bays; b++) {
              const u = (b + 0.5) * pitch - span / 2;
              const isDoorBay = (b === Math.floor(bays / 2));
              placeFace(trimMat, 0.48, groundH - 0.55, 0.52, u - pitch / 2 + 0.24, 1.88, 0.16);
              placeFace(steelDark, pitch - 0.48, 2.38, 0.14, u, 1.78, 0.38);
              placeFace(isDoorBay ? litGlass : officeGlass, pitch - 0.72, 2.12, 0.06, u, 1.78, 0.32);
              placeFace(steelGalv, 0.06, 2.12, 0.08, u, 1.78, 0.28);
              if (isDoorBay || rng() < 0.55) {
                // Projecting sloped storefront metal canopy + steel support tie-rods
                placeFace(chosenStyle.awning, pitch - 0.28, 0.16, 1.48, u, groundH - 0.26, -0.66, 0.22);
                placeFace(steelDark, pitch - 0.24, 0.18, 0.12, u, groundH - 0.42, -1.36);
                for (const sgn of [-1, 1]) {
                  placeFace(steelGalv, 0.045, 0.045, 1.35, u + sgn * (pitch * 0.38), groundH + 0.16, -0.58, -0.52);
                }
              }
            }
            placeFace(trimMat, 0.48, groundH - 0.55, 0.52, span / 2 - 0.24, 1.88, 0.16);
          }

          for (let row = 0; row < floors; row++) {
            const fy = yStart + row * storeyH;
            const sillH = 0.94;
            const winH = storeyH - sillH - 0.36;
            placeFace(wallMat, span, sillH, 0.40, 0, fy + sillH / 2, 0.18);
            placeFace(wallMat, span, 0.36, 0.40, 0, fy + storeyH - 0.18, 0.18);
            if (row > 0 && row % 2 === 0) {
              placeFace(trimMat, span + 0.26, 0.16, 0.48, 0, fy, 0.12); // Projecting horizontal belt course
            }
            for (let b = 0; b < bays; b++) {
              const u = (b + 0.5) * pitch - span / 2;
              const winW = pitch * 0.64;
              const jambW = (pitch - winW) / 2;
              const wy = fy + sillH + winH / 2;
              for (const sgn of [-1, 1]) {
                placeFace(wallMat, jambW, winH, 0.40, u + sgn * (pitch - jambW) / 2, wy, 0.18);
                // Recessed metallic window frame jambs
                placeFace(steelDark, 0.09, winH + 0.04, 0.22, u + sgn * (winW / 2 - 0.04), wy, 0.28);
              }
              const rVal = rng();
              const paneMat = rVal < 0.18 ? litGlass : (rVal < 0.34 ? blindGlass : officeGlass);
              placeFace(paneMat, winW, winH, 0.05, u, wy, 0.35);
              placeFace(steelDark, 0.075, winH, 0.12, u, wy, 0.28); // Vertical mullion
              placeFace(steelDark, winW, 0.075, 0.12, u, wy + winH * 0.20, 0.28); // Upper transom
              placeFace(trimMat, winW + 0.24, 0.13, 0.56, u, fy + sillH - 0.02, 0.10); // Deep concrete sill
              placeFace(trimMat, winW + 0.20, 0.14, 0.48, u, fy + sillH + winH + 0.06, 0.14); // Window header lintel

              // Seeded cantilevered steel balcony with concrete deck, steel posts & horizontal rails
              if ((row >= 1 || !isGroundIncluded) && b % 2 === (face % 2) && rng() < chosenStyle.balconyChance) {
                placeFace(trimMat, winW + 0.62, 0.18, 1.32, u, fy + 0.10, -0.58);
                placeFace(steelDark, winW + 0.62, 0.08, 0.08, u, fy + 1.10, -1.18);
                placeFace(steelDark, winW + 0.62, 0.05, 0.05, u, fy + 0.64, -1.18);
                placeFace(steelDark, 0.08, 0.08, 1.24, u - (winW + 0.58) / 2, fy + 1.10, -0.58);
                placeFace(steelDark, 0.08, 0.08, 1.24, u + (winW + 0.58) / 2, fy + 1.10, -0.58);
                for (let p = -3; p <= 3; p++) {
                  placeFace(steelGalv, 0.045, 0.96, 0.045, u + (p / 3) * (winW * 0.5), fy + 0.60, -1.18);
                }
              } else if (rng() < 0.28) {
                // Exterior wall-mounted AC compressor unit + bracket + fan grille
                placeFace(steelGalv, 0.78, 0.54, 0.38, u + winW * 0.30, fy + sillH - 0.38, -0.20);
                placeFace(steelDark, 0.40, 0.40, 0.07, u + winW * 0.30, fy + sillH - 0.38, -0.40);
                placeFace(steelDark, 0.08, 0.34, 0.38, u + winW * 0.30 - 0.26, fy + sillH - 0.64, -0.18);
                placeFace(steelDark, 0.08, 0.34, 0.38, u + winW * 0.30 + 0.26, fy + sillH - 0.64, -0.18);
              }
            }
          }
        }
      };

      buildFacadeTier(width, depth, groundH, lowerFloors, true);

      // 2. STEPPED UPPER SETBACK TOWER (for tall buildings >= 4 upper floors)
      let roofY = baseY + mainH + 0.52;
      let roofW = width, roofD = depth;
      if (hasSetback) {
        roofW = width - 4.4;
        roofD = depth - 4.4;
        pushInst(steelDark, roofW - 0.6, storeyH - 0.2, roofD - 0.6, cx, baseY + mainH + storeyH / 2, cz);
        buildFacadeTier(roofW, roofD, mainH, 1, false);
        roofY = baseY + mainH + storeyH + 0.42;
        pushInst(trimMat, roofW + 0.55, 0.36, roofD + 0.55, cx, roofY - 0.20, cz);
        pushInst(steelDark, roofW + 0.65, 0.14, roofD + 0.65, cx, roofY + 0.02, cz);
      }

      // 3. EXTERIOR ZIG-ZAG STEEL FIRE-ESCAPE STAIRCASE on side facade (classic port-city detail!)
      if (lowerFloors >= 2) {
        const escX = cx + width / 2 + 0.65;
        const escZ = cz - depth * 0.18;
        for (let f = 0; f < lowerFloors; f++) {
          const ly = baseY + groundH + f * storeyH;
          pushInst(steelDark, 1.25, 0.12, 3.8, escX, ly, escZ); // Steel grating landing
          pushInst(steelDark, 0.07, 0.07, 3.8, escX + 0.60, ly + 1.02, escZ); // Top handrail
          pushInst(steelGalv, 0.05, 0.98, 0.05, escX + 0.60, ly + 0.52, escZ - 1.85);
          pushInst(steelGalv, 0.05, 0.98, 0.05, escX + 0.60, ly + 0.52, escZ + 1.85);
          if (f < lowerFloors - 1) {
            const dir = f % 2 === 0 ? 1 : -1;
            const midY = ly + storeyH * 0.5;
            pushInst(steelDark, 0.85, 0.12, 3.6, escX + 0.12, midY, escZ, dir * 0.72, 0, 0);
          }
        }
      }

      // 4. ROOFTOP ARCHITECTURE: Louvered Mechanical Penthouse, Water Tower on Stilts, HVAC Chillers & Comms Mast
      const pw = Math.min(roofW * 0.44, 9.5), pd = Math.min(roofD * 0.40, 7.5);
      const px = cx - roofW * 0.16, pz = cz - roofD * 0.12;
      pushInst(corrugatedMat, pw, 2.9, pd, px, roofY + 1.45, pz);
      pushInst(steelDark, pw + 0.36, 0.26, pd + 0.36, px, roofY + 2.98, pz);
      // Penthouse louvers & access door
      pushInst(steelGalv, pw * 0.55, 1.1, 0.14, px, roofY + 1.85, pz + pd / 2 + 0.08);
      pushInst(steelDark, 1.15, 2.15, 0.14, px + pw * 0.34, roofY + 1.08, pz + pd / 2 + 0.08);
      // Rooftop HVAC chiller bank with dual fan shrouds
      const hx = cx + roofW * 0.22, hz = cz - roofD * 0.18;
      pushInst(steelGalv, 3.8, 1.45, 2.4, hx, roofY + 0.72, hz);
      pushInst(steelDark, 3.4, 0.22, 2.0, hx, roofY + 1.52, hz);
      pushInst(safetyYellow, 0.08, 0.08, 2.5, hx - 1.92, roofY + 1.15, hz);
      // Rooftop communication mast + red aviation strobe
      const mx = cx + roofW * 0.30, mz = cz + roofD * 0.26;
      pushInst(steelGalv, 0.16, 5.2, 0.16, mx, roofY + 2.6, mz);
      pushInst(steelGalv, 1.6, 0.09, 0.09, mx, roofY + 4.3, mz);
      pushInst(redBeacon, 0.28, 0.32, 0.28, mx, roofY + 5.35, mz);

      // Convert all accumulated instances into 1 InstancedMesh per material (minimal draw calls!)
      if (typeof InstancedMesh === 'function') {
        for (const [material, matrices] of batches) {
          const batch = new InstancedMesh(unitBox, material, matrices.length);
          for (let i = 0; i < matrices.length; i++) batch.setMatrixAt(i, matrices[i]);
          batch.receiveShadow = true;
          batch.castShadow = false;
          g.add(batch);
        }
      } else {
        const fallback = new Mesh(unitBox, wallMat);
        fallback.position.set(cx, baseY + height / 2, cz);
        fallback.scale.set(width, height, depth);
        g.add(fallback);
      }

      // 5. CYLINDRICAL ROOFTOP WATER TOWER ON STEEL STILTS (classic harbor-city skyline silhouette!)
      if (chosenStyle.hasWaterTower && roofW >= 12) {
        const wx = cx + roofW * 0.20, wz = cz + roofD * 0.18;
        for (const sx of [-0.9, 0.9]) {
          for (const sz of [-0.9, 0.9]) {
            const leg = new Mesh(unitCyl, steelDark);
            leg.position.set(wx + sx, roofY + 1.25, wz + sz);
            leg.scale.set(0.11, 2.5, 0.11);
            leg.matrixAutoUpdate = false; leg.updateMatrix();
            g.add(leg);
          }
        }
        const tank = new Mesh(unitCyl, trimMat);
        tank.position.set(wx, roofY + 3.9, wz);
        tank.scale.set(1.55, 2.8, 1.55);
        tank.matrixAutoUpdate = false; tank.updateMatrix();
        const cap = new Mesh(unitCyl, steelDark);
        cap.position.set(wx, roofY + 5.55, wz);
        cap.scale.set(1.68, 0.55, 1.68);
        cap.matrixAutoUpdate = false; cap.updateMatrix();
        g.add(tank, cap);
      }

      // 6. TUBEGEOMETRY RAINWATER DOWNSPOUTS & ROOFTOP HVAC DUCTWORK
      g.add(makePipeCurve([
        [cx - width / 2 - 0.08, baseY + mainH - 0.1, cz - depth / 2 + 0.45],
        [cx - width / 2 - 0.18, baseY + mainH - 0.6, cz - depth / 2 + 0.45],
        [cx - width / 2 - 0.18, baseY + 0.65, cz - depth / 2 + 0.45],
        [cx - width / 2 - 0.34, baseY + 0.25, cz - depth / 2 + 0.45],
      ], 0.09, steelGalv));
      g.add(makePipeCurve([
        [cx + width / 2 + 0.08, baseY + mainH - 0.1, cz + depth / 2 - 0.45],
        [cx + width / 2 + 0.18, baseY + mainH - 0.6, cz + depth / 2 - 0.45],
        [cx + width / 2 + 0.18, baseY + 0.65, cz + depth / 2 - 0.45],
        [cx + width / 2 + 0.34, baseY + 0.25, cz + depth / 2 - 0.45],
      ], 0.09, steelGalv));
      // Rooftop duct connecting penthouse to HVAC chiller
      g.add(makePipeCurve([
        [px + pw / 2, roofY + 1.2, pz],
        [(px + pw / 2 + hx) / 2, roofY + 1.6, (pz + hz) / 2],
        [hx - 1.6, roofY + 1.0, hz],
      ], 0.22, steelGalv));

      // Ground-floor weathered facade signage Decal
      if (labelZh) {
        const decalMat = matLib.createDecalMaterial(labelZh, labelEn || 'SALTLINE COASTAL DISTRICT');
        const sign = new Mesh(unitBox, decalMat);
        sign.scale.set(Math.min(5.8, width * 0.45), 1.42, 0.09);
        sign.position.set(cx, baseY + groundH + 0.36, cz + depth / 2 + 0.08);
        sign.matrixAutoUpdate = false; sign.updateMatrix();
        g.add(sign);
      }

      parent.add(g);
      return g;
    }

    function dispose() {
      for (const geo of createdGeos) geo.dispose?.();
    }

    return { buildCoastalBuilding, dispose };
  }

  WE.createBuildingGenerator = createBuildingGenerator;
})();
