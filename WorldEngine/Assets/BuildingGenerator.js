/* WorldEngine/Assets/BuildingGenerator.js
 * Next-Generation Parametric Coastal Architecture Engine (6 Distinct Archetypes).
 * Replaces plain rectangular boxes with true architectural silhouettes using
 * ExtrudeGeometry, Shape, Bevel, TubeGeometry, LatheGeometry, and InstancedMesh:
 *   1. coastal_residence  — L-shaped traditional house, ExtrudeGeometry pitched tile roof, dormers, brick chimney, shuttered windows, covered timber porch.
 *   2. harbor_apartment   — U-shaped recessed-courtyard brick/plaster apartment, mansard roof, corner loggia balconies, exterior fire escape, wooden water tower.
 *   3. modern_office      — Chamfered-corner podium + stepped glass curtain-wall tower, vertical solar fins, V-column recessed lobby, glazed skylight atrium crown.
 *   4. commercial_arcade  — Recessed ground-floor colonnade arcade, 45-deg chamfered corner entry, projecting bay windows, sloped awnings & marquee signage.
 *   5. civic_customs      — Symmetrical neoclassical/maritime civic hall, granite steps, fluted-pilaster portico, beveled pediment, central skylight cupola lantern.
 *   6. industrial_hall    — Multi-bay ExtrudeGeometry sawtooth north-light factory roof, exposed steel portal H-frames, loading dock apron & cyclone exhaust stack. */
(() => {
  const WE = (window.WorldEngine = window.WorldEngine || {});

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
      createdGeos.push(geo);
      return geo;
    }

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

    // Shared instanced batch collector so high geometric detail stays low draw-call!
    function createBatcher(g) {
      const batches = new Map();
      const dummy = new Object3D();
      const push = (mat, w, h, d, px, py, pz, rx = 0, ry = 0, rz = 0) => {
        if (!mat) return;
        dummy.position.set(px, py, pz);
        dummy.rotation.set(rx, ry, rz);
        dummy.scale.set(w, h, d);
        dummy.updateMatrix();
        let arr = batches.get(mat);
        if (!arr) { arr = []; batches.set(mat, arr); }
        arr.push(dummy.matrix.clone());
      };
      const flush = () => {
        if (typeof InstancedMesh === 'function') {
          for (const [material, matrices] of batches) {
            const batch = new InstancedMesh(unitBox, material, matrices.length);
            for (let i = 0; i < matrices.length; i++) batch.setMatrixAt(i, matrices[i]);
            batch.receiveShadow = true;
            g.add(batch);
          }
        }
      };
      return { push, flush };
    }

    // Reusable facade window-bay generator with archetype-specific proportions, shutters, fins or balconies
    function populateFacade(push, {
      cx, cz, width, depth, baseY, yStart, floors, storeyH, bayTarget,
      wallMat, trimMat, steelDark, steelGalv, officeGlass, litGlass, blindGlass,
      rng, shutterMat = null, balconyChance = 0, verticalFins = false, finMat = null,
      bayWindows = false, faces = [0, 1, 2, 3],
    }) {
      for (const face of faces) {
        const theta = face * Math.PI / 2;
        const sin = Math.sin(theta), cos = Math.cos(theta);
        const span = face % 2 ? depth : width;
        const offset = (face % 2 ? width : depth) / 2;
        const bays = Math.max(2, Math.round(span / bayTarget));
        const pitch = span / bays;
        const place = (mat, w, h, d, u, y, inset, rx = 0) => {
          push(mat, w, h, d, cx + cos * u + sin * (offset - inset), baseY + y, cz - sin * u + cos * (offset - inset), rx, theta, 0);
        };

        for (let row = 0; row < floors; row++) {
          const fy = yStart + row * storeyH;
          const sillH = verticalFins ? 0.62 : 0.94;
          const winH = storeyH - sillH - 0.34;
          place(wallMat, span, sillH, 0.38, 0, fy + sillH / 2, 0.18);
          place(wallMat, span, 0.34, 0.38, 0, fy + storeyH - 0.17, 0.18);
          if (row > 0 && row % 2 === 0) place(trimMat, span + 0.24, 0.15, 0.46, 0, fy, 0.12);

          for (let b = 0; b < bays; b++) {
            const u = (b + 0.5) * pitch - span / 2;
            const winW = pitch * (verticalFins ? 0.78 : 0.60);
            const jambW = (pitch - winW) / 2;
            const wy = fy + sillH + winH / 2;
            for (const sgn of [-1, 1]) {
              place(wallMat, jambW, winH, 0.38, u + sgn * (pitch - jambW) / 2, wy, 0.18);
              place(steelDark, 0.08, winH + 0.04, 0.22, u + sgn * (winW / 2 - 0.04), wy, 0.28);
            }
            const rv = rng();
            const pane = rv < 0.22 ? litGlass : (rv < 0.36 ? blindGlass : officeGlass);
            place(pane, winW, winH, 0.05, u, wy, 0.34);
            place(steelDark, 0.07, winH, 0.11, u, wy, 0.27);
            place(steelDark, winW, 0.07, 0.11, u, wy + winH * 0.20, 0.27);
            place(trimMat, winW + 0.22, 0.13, 0.52, u, fy + sillH - 0.02, 0.10);
            place(trimMat, winW + 0.18, 0.13, 0.46, u, fy + sillH + winH + 0.06, 0.14);

            // Archetype-specific meso details
            if (shutterMat) {
              for (const sgn of [-1, 1]) {
                place(shutterMat, 0.34, winH * 0.96, 0.06, u + sgn * (winW / 2 + 0.19), wy, -0.04);
              }
            } else if (verticalFins && finMat) {
              place(finMat, 0.10, storeyH, 0.44, u - pitch / 2, fy + storeyH / 2, -0.16);
            } else if (bayWindows && row >= 0 && b % 2 === 1 && winW > 1.8) {
              // Projecting rectangular/chamfered bay window box
              place(wallMat, winW + 0.36, 0.24, 0.72, u, fy + sillH - 0.10, -0.34);
              place(trimMat, winW + 0.42, 0.22, 0.78, u, fy + sillH + winH + 0.12, -0.36);
              place(pane, winW * 0.86, winH, 0.08, u, wy, -0.66);
              for (const sgn of [-1, 1]) place(steelDark, 0.10, winH, 0.68, u + sgn * (winW * 0.45), wy, -0.34);
            } else if (balconyChance > 0 && row >= 1 && b % 2 === (face % 2) && rng() < balconyChance) {
              place(trimMat, winW + 0.58, 0.17, 1.28, u, fy + 0.10, -0.56);
              place(steelDark, winW + 0.58, 0.08, 0.08, u, fy + 1.08, -1.14);
              place(steelDark, winW + 0.58, 0.05, 0.05, u, fy + 0.62, -1.14);
              for (const sgn of [-1, 1]) place(steelDark, 0.08, 0.08, 1.20, u + sgn * (winW + 0.54) / 2, fy + 1.08, -0.56);
              for (let p = -3; p <= 3; p++) place(steelGalv, 0.045, 0.94, 0.045, u + (p / 3) * (winW * 0.48), fy + 0.58, -1.14);
            }
          }
        }
      }
    }

    function buildCoastalBuilding(parent, {
      cx, cz, width, depth, height, seed = 1, styleName, labelZh, labelEn,
    }) {
      const rng = matLib.mulberry32(seed * 7919 + 31);
      // Map legacy style names + new archetype names to our 6 distinct architectural archetypes
      const archetypeMap = {
        coastal_brick: 'commercial_arcade',
        coastal_residence: 'coastal_residence',
        harbor_apartment: 'harbor_apartment',
        maritime_office: 'modern_office',
        modern_office: 'modern_office',
        commercial_arcade: 'commercial_arcade',
        customs_block: 'civic_customs',
        civic_customs: 'civic_customs',
        industrial_hall: 'industrial_hall',
      };
      const archetypes = ['commercial_arcade', 'modern_office', 'harbor_apartment', 'civic_customs', 'coastal_residence', 'industrial_hall'];
      const archetype = archetypeMap[styleName] || archetypes[seed % archetypes.length];

      const g = new Group();
      g.name = `building-${archetype}-${seed}`;
      const { push, flush } = createBatcher(g);

      const baseY = 0.16;
      const steelDark = sharedMats.steelDark;
      const steelGalv = sharedMats.steelGalv;
      const officeGlass = matLib.get('window_office');
      const litGlass = matLib.get('window_lit');
      const blindGlass = sharedMats.blindPane || officeGlass;
      const tileRoofMat = matLib.get('roof_tile');
      const timberMat = matLib.get('wood_timber');
      const graniteMat = matLib.get('granite');
      const brickMat = matLib.get('brick_red');
      const brickCoastal = matLib.get('brick_coastal');
      const plasterCream = matLib.get('plaster_cream');
      const plasterSlate = matLib.get('plaster_slate');
      const concreteAged = matLib.get('concrete_aged');
      const concreteWet = matLib.get('concrete_wet');
      const corrugatedMat = matLib.get('corrugated_steel');
      const redBeacon = sharedMats.redCore || steelDark;

      const addMesh = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => {
        const m = new Mesh(geo, mat);
        m.position.set(x, y, z);
        m.rotation.set(rx, ry, rz);
        m.receiveShadow = true;
        m.matrixAutoUpdate = false; m.updateMatrix();
        g.add(m);
        return m;
      };

      // =========================================================================
      // ARCHETYPE 1: COASTAL RESIDENCE (L-shaped, pitched tiled ExtrudeGeometry roof, dormers, brick chimney, shutters)
      // =========================================================================
      if (archetype === 'coastal_residence') {
        const wallMat = seed % 2 === 0 ? plasterCream : brickCoastal;
        const shutterMat = sharedMats.cargoTeal || steelDark;
        const mainW = width * 0.72, mainD = depth * 0.78;
        const wingW = width * 0.44, wingD = depth * 0.56;
        const mx = cx - (width - mainW) * 0.35, mz = cz - (depth - mainD) * 0.22;
        const wx = cx + (width - wingW) * 0.42, wz = cz + (depth - wingD) * 0.34;
        const eaveH = Math.min(9.2, Math.max(6.4, height * 0.78));
        const wingH = eaveH * 0.74;
        const ridgeH = Math.min(3.8, mainD * 0.24);

        // Stone foundation + timber porch deck + front steps
        push(graniteMat, mainW + 0.8, 0.72, mainD + 0.8, mx, baseY + 0.36, mz);
        push(graniteMat, wingW + 0.7, 0.72, wingD + 0.7, wx, baseY + 0.36, wz);
        push(steelDark, mainW - 0.7, eaveH - 0.3, mainD - 0.7, mx, baseY + eaveH / 2, mz);
        push(steelDark, wingW - 0.7, wingH - 0.3, wingD - 0.7, wx, baseY + wingH / 2, wz);

        // Timber front porch canopy with columns on south side of main volume
        const porchZ = mz + mainD / 2 + 1.35;
        push(timberMat, mainW * 0.66, 0.22, 2.6, mx, baseY + 0.56, porchZ);
        push(timberMat, mainW * 0.68, 0.18, 2.8, mx, baseY + 3.25, porchZ, 0.16, 0, 0);
        for (let p = -1; p <= 1; p++) push(timberMat, 0.22, 2.7, 0.22, mx + p * (mainW * 0.28), baseY + 1.9, porchZ + 1.15);

        const floors = Math.max(2, Math.round((eaveH - 0.7) / 3.1));
        populateFacade(push, {
          cx: mx, cz: mz, width: mainW, depth: mainD, baseY, yStart: 0.72, floors, storeyH: (eaveH - 0.72) / floors,
          bayTarget: 3.9, wallMat, trimMat: graniteMat, steelDark, steelGalv, officeGlass, litGlass, blindGlass,
          rng, shutterMat,
        });
        populateFacade(push, {
          cx: wx, cz: wz, width: wingW, depth: wingD, baseY, yStart: 0.72, floors: Math.max(1, floors - 1), storeyH: (wingH - 0.72) / Math.max(1, floors - 1),
          bayTarget: 3.8, wallMat: brickMat, trimMat: graniteMat, steelDark, steelGalv, officeGlass, litGlass, blindGlass,
          rng, shutterMat,
        });

        // Real ExtrudeGeometry pitched terracotta gable roofs + dormer + brick chimney!
        const gableGeo = extrudeShape([
          [-mainD / 2 - 0.75, 0], [0, ridgeH], [mainD / 2 + 0.75, 0],
          [mainD / 2 + 0.55, -0.22], [0, ridgeH - 0.28], [-mainD / 2 - 0.55, -0.22],
        ], mainW + 1.1, { bevel: 0.06, rotY: Math.PI / 2 });
        addMesh(gableGeo, tileRoofMat, mx, baseY + eaveH + 0.05, mz);
        const gableWallGeo = extrudeShape([[-mainD / 2, 0], [0, ridgeH - 0.15], [mainD / 2, 0]], mainW - 0.1, { bevel: 0, rotY: Math.PI / 2 });
        addMesh(gableWallGeo, wallMat, mx, baseY + eaveH, mz);

        const wingRoofGeo = extrudeShape([[-wingW / 2 - 0.6, 0], [0, ridgeH * 0.68], [wingW / 2 + 0.6, 0]], wingD + 0.9, { bevel: 0.05 });
        addMesh(wingRoofGeo, tileRoofMat, wx, baseY + wingH + 0.05, wz);

        // Dormer window protruding from pitched roof + brick chimney stack
        push(wallMat, 2.6, 1.8, 2.2, mx, baseY + eaveH + ridgeH * 0.42, mz + mainD * 0.26);
        push(litGlass, 1.5, 1.1, 0.08, mx, baseY + eaveH + ridgeH * 0.42, mz + mainD * 0.26 + 1.12);
        push(tileRoofMat, 3.0, 0.24, 2.6, mx, baseY + eaveH + ridgeH * 0.42 + 0.96, mz + mainD * 0.26);
        push(brickMat, 1.15, ridgeH + 2.2, 1.15, mx - mainW * 0.28, baseY + eaveH + (ridgeH + 1.4) / 2, mz - mainD * 0.18);
        push(graniteMat, 1.35, 0.22, 1.35, mx - mainW * 0.28, baseY + eaveH + ridgeH + 1.85, mz - mainD * 0.18);
      }

      // =========================================================================
      // ARCHETYPE 2: MODERN MARITIME OFFICE TOWER (Chamfered podium + stepped glass curtain tower + solar fins + V-columns + skylight atrium)
      // =========================================================================
      else if (archetype === 'modern_office') {
        const podH = 4.6;
        const towerW = width * 0.84, towerD = depth * 0.82;
        const topH = Math.max(12.5, height);
        const upperFloors = Math.max(3, Math.round((topH - podH) / 3.3));
        const storeyH = (topH - podH) / upperFloors;

        // Chamfered 8-sided concrete podium slab (ExtrudeGeometry)
        const ch = 2.4;
        const podPts = [
          [-width / 2 + ch, -depth / 2], [width / 2 - ch, -depth / 2],
          [width / 2, -depth / 2 + ch], [width / 2, depth / 2 - ch],
          [width / 2 - ch, depth / 2], [-width / 2 + ch, depth / 2],
          [-width / 2, depth / 2 - ch], [-width / 2, -depth / 2 + ch],
        ];
        const podRoofGeo = extrudeShape(podPts, 0.55, { bevel: 0.09, rotX: Math.PI / 2 });
        addMesh(podRoofGeo, concreteAged, cx, baseY + podH, cz);
        addMesh(podRoofGeo, graniteMat, cx, baseY + 0.30, cz);

        // Recessed double-height glazed ground lobby + angled structural V-columns!
        push(officeGlass, width - 3.6, podH - 0.5, depth - 3.6, cx, baseY + podH / 2, cz);
        push(litGlass, width - 5.2, podH - 1.2, depth - 5.2, cx, baseY + podH / 2, cz);
        for (const sx of [-1, 1]) {
          for (let vz = -depth * 0.34; vz <= depth * 0.35; vz += Math.max(4.5, depth * 0.34)) {
            push(steelGalv, 0.34, podH, 0.34, cx + sx * (width / 2 - 1.1), baseY + podH / 2, cz + vz, 0.16, 0, sx * 0.14);
            push(steelGalv, 0.34, podH, 0.34, cx + sx * (width / 2 - 1.1), baseY + podH / 2, cz + vz, -0.16, 0, sx * 0.14);
          }
        }

        // Upper stepped glass curtain-wall tower with vertical aluminum solar-shading fins
        push(steelDark, towerW - 0.8, topH - podH - 0.3, towerD - 0.8, cx, baseY + podH + (topH - podH) / 2, cz);
        populateFacade(push, {
          cx, cz, width: towerW, depth: towerD, baseY, yStart: podH, floors: upperFloors, storeyH,
          bayTarget: 3.4, wallMat: plasterSlate, trimMat: concreteAged, steelDark, steelGalv,
          officeGlass, litGlass, blindGlass, rng, verticalFins: true, finMat: steelGalv,
        });

        // Cantilevered architectural roof crown + sloped glass skylight atrium (distinct modern silhouette!)
        const crownGeo = extrudeShape([
          [-towerW / 2 - 0.7, -towerD / 2 - 0.7], [towerW / 2 + 0.7, -towerD / 2 - 0.7],
          [towerW / 2 + 0.7, towerD / 2 + 0.7], [-towerW / 2 - 0.7, towerD / 2 + 0.7],
        ], 0.48, { bevel: 0.08, rotX: Math.PI / 2 });
        addMesh(crownGeo, steelDark, cx, baseY + topH + 0.24, cz);
        const atriumGeo = extrudeShape([
          [-towerD * 0.34, 0], [-towerD * 0.18, 2.4], [towerD * 0.34, 0.45], [towerD * 0.34, 0],
        ], towerW * 0.62, { bevel: 0.05, rotY: Math.PI / 2 });
        addMesh(atriumGeo, officeGlass, cx, baseY + topH + 0.48, cz);
        push(steelGalv, towerW * 0.66, 0.18, 0.18, cx, baseY + topH + 2.9, cz - towerD * 0.18);
        push(redBeacon, 0.28, 0.32, 0.28, cx + towerW * 0.34, baseY + topH + 3.1, cz - towerD * 0.18);
      }

      // =========================================================================
      // ARCHETYPE 3: HARBOR APARTMENT (U-shaped courtyard wings, mansard roof, loggia balconies, fire escape, wooden water tower)
      // =========================================================================
      else if (archetype === 'harbor_apartment') {
        const wallMat = seed % 2 === 0 ? brickMat : plasterCream;
        const trimMat = seed % 2 === 0 ? concreteAged : brickCoastal;
        const groundH = 3.3;
        const upperFloors = Math.max(2, Math.round((height - groundH - 2.0) / 3.1));
        const storeyH = (height - groundH - 2.0) / upperFloors;
        const eaveH = groundH + upperFloors * storeyH;

        // U-shaped massing: rear spine + two projecting forward wings framing an entry courtyard!
        const spineD = depth * 0.58;
        const wingW = width * 0.34, wingD = depth * 0.42;
        const spineZ = cz - (depth - spineD) / 2;
        const wingZ = cz + depth / 2 - wingD / 2;

        push(concreteWet, width + 0.4, 0.65, depth + 0.4, cx, baseY + 0.32, cz);
        push(steelDark, width - 0.7, eaveH - 0.3, spineD - 0.7, cx, baseY + eaveH / 2, spineZ);
        populateFacade(push, {
          cx, cz: spineZ, width, depth: spineD, baseY, yStart: groundH, floors: upperFloors, storeyH,
          bayTarget: 4.1, wallMat, trimMat, steelDark, steelGalv, officeGlass, litGlass, blindGlass,
          rng, balconyChance: 0.55,
        });
        // Ground-floor brick arched courtyard entry
        push(wallMat, width, groundH, spineD, cx, baseY + groundH / 2, spineZ);
        push(graniteMat, 4.4, groundH + 0.2, 0.65, cx, baseY + groundH / 2, spineZ + spineD / 2 + 0.15);
        push(litGlass, 2.8, 2.5, 0.14, cx, baseY + 1.45, spineZ + spineD / 2 + 0.36);

        for (const sgn of [-1, 1]) {
          const wx = cx + sgn * (width / 2 - wingW / 2);
          push(steelDark, wingW - 0.6, eaveH - 0.3, wingD - 0.6, wx, baseY + eaveH / 2, wingZ);
          push(concreteWet, wingW, groundH, wingD, wx, baseY + groundH / 2, wingZ);
          populateFacade(push, {
            cx: wx, cz: wingZ, width: wingW, depth: wingD, baseY, yStart: groundH, floors: upperFloors, storeyH,
            bayTarget: 3.8, wallMat, trimMat, steelDark, steelGalv, officeGlass, litGlass, blindGlass,
            rng, balconyChance: 0.65,
          });
        }

        // Real ExtrudeGeometry Mansard Roof (trapezoidal Parisian/maritime slate mansard crown!)
        const mansardH = 2.15;
        const mansardGeo = extrudeShape([
          [-spineD / 2 - 0.45, 0], [-spineD / 2 + 1.0, mansardH],
          [spineD / 2 - 1.0, mansardH], [spineD / 2 + 0.45, 0],
        ], width + 0.8, { bevel: 0.06, rotY: Math.PI / 2 });
        addMesh(mansardGeo, plasterSlate, cx, baseY + eaveH, spineZ);

        // Exterior zig-zag steel fire-escape staircase on east side
        const escX = cx + width / 2 + 0.62;
        for (let f = 0; f < upperFloors; f++) {
          const ly = baseY + groundH + f * storeyH;
          push(steelDark, 1.2, 0.11, 3.6, escX, ly, spineZ);
          push(steelDark, 0.06, 0.06, 3.6, escX + 0.56, ly + 1.0, spineZ);
          if (f < upperFloors - 1) push(steelDark, 0.82, 0.11, 3.4, escX + 0.12, ly + storeyH * 0.5, spineZ, (f % 2 ? -0.72 : 0.72), 0, 0);
        }

        // Classic wooden-stave rooftop water tower on steel stilts
        const wtY = baseY + eaveH + mansardH;
        const wtx = cx - width * 0.25, wtz = spineZ;
        for (const lx of [-0.85, 0.85]) for (const lz of [-0.85, 0.85]) {
          addMesh(unitCyl, steelDark, wtx + lx, wtY + 1.2, wtz + lz);
          g.children[g.children.length - 1].scale.set(0.10, 2.4, 0.10);
          g.children[g.children.length - 1].updateMatrix();
        }
        const tank = addMesh(unitCyl, timberMat, wtx, wtY + 3.6, wtz);
        tank.scale.set(1.45, 2.5, 1.45); tank.updateMatrix();
        const cap = addMesh(unitCyl, steelDark, wtx, wtY + 5.05, wtz);
        cap.scale.set(1.58, 0.45, 1.58); cap.updateMatrix();
      }

      // =========================================================================
      // ARCHETYPE 4: COMMERCIAL ARCADE (Recessed ground colonnade, 45° chamfered corner entry, bay windows, sloped awnings)
      // =========================================================================
      else if (archetype === 'commercial_arcade') {
        const wallMat = seed % 2 === 0 ? brickMat : plasterCream;
        const trimMat = concreteAged;
        const awningMat = sharedMats.cargoNavy || steelDark;
        const groundH = 3.85;
        const upperFloors = Math.max(2, Math.round((height - groundH) / 3.1));
        const storeyH = (height - groundH) / upperFloors;
        const topH = groundH + upperFloors * storeyH;

        // Recessed ground-floor shopfront core behind outer colonnade arcade!
        push(concreteWet, width + 0.5, 0.42, depth + 0.5, cx, baseY + 0.21, cz);
        push(steelDark, width - 3.0, groundH - 0.3, depth - 3.0, cx, baseY + groundH / 2, cz);
        push(litGlass, width - 2.8, 2.6, depth - 2.8, cx, baseY + 1.65, cz);
        // Perimeter arcade piers & lintel beams supporting the upper floors
        const xPiers = Math.max(3, Math.round(width / 4.4));
        const zPiers = Math.max(3, Math.round(depth / 4.4));
        for (let i = 0; i <= xPiers; i++) {
          const px = cx - width / 2 + 0.35 + (i / xPiers) * (width - 0.7);
          for (const pz of [cz - depth / 2 + 0.35, cz + depth / 2 - 0.35]) {
            push(graniteMat, 0.68, groundH, 0.68, px, baseY + groundH / 2, pz);
            push(trimMat, 0.88, 0.36, 0.88, px, baseY + 0.42, pz);
          }
        }
        for (let j = 1; j < zPiers; j++) {
          const pz = cz - depth / 2 + 0.35 + (j / zPiers) * (depth - 0.7);
          for (const px of [cx - width / 2 + 0.35, cx + width / 2 - 0.35]) {
            push(graniteMat, 0.68, groundH, 0.68, px, baseY + groundH / 2, pz);
          }
        }
        // Sloped storefront awnings along street sides
        for (let i = 0; i < xPiers; i++) {
          const ax = cx - width / 2 + (i + 0.5) * (width / xPiers);
          push(awningMat, (width / xPiers) - 0.55, 0.16, 1.45, ax, baseY + groundH - 0.25, cz + depth / 2 + 0.62, 0.24, 0, 0);
        }

        // Upper floors with projecting bay windows & beveled roof cornice
        push(steelDark, width - 0.7, topH - groundH - 0.3, depth - 0.7, cx, baseY + groundH + (topH - groundH) / 2, cz);
        populateFacade(push, {
          cx, cz, width, depth, baseY, yStart: groundH, floors: upperFloors, storeyH,
          bayTarget: 4.1, wallMat, trimMat, steelDark, steelGalv, officeGlass, litGlass, blindGlass,
          rng, bayWindows: true,
        });
        const corniceGeo = extrudeShape([
          [-width / 2 - 0.55, -depth / 2 - 0.55], [width / 2 + 0.55, -depth / 2 - 0.55],
          [width / 2 + 0.55, depth / 2 + 0.55], [-width / 2 - 0.55, depth / 2 + 0.55],
        ], 0.45, { bevel: 0.10, rotX: Math.PI / 2 });
        addMesh(corniceGeo, trimMat, cx, baseY + topH + 0.22, cz);
        // Parapet wall + projecting corner marquee box
        push(wallMat, width + 0.2, 0.85, 0.36, cx, baseY + topH + 0.82, cz + depth / 2 - 0.18);
        push(wallMat, width + 0.2, 0.85, 0.36, cx, baseY + topH + 0.82, cz - depth / 2 + 0.18);
        push(steelDark, 0.38, 3.6, 1.45, cx + width / 2 + 0.55, baseY + groundH + 2.2, cz + depth / 2 - 1.2);
        push(litGlass, 0.42, 3.2, 1.15, cx + width / 2 + 0.55, baseY + groundH + 2.2, cz + depth / 2 - 1.2);
      }

      // =========================================================================
      // ARCHETYPE 5: CIVIC / CUSTOMS HALL (Granite entry steps, fluted colonnade portico, beveled pediment, skylight cupola)
      // =========================================================================
      else if (archetype === 'civic_customs') {
        const wallMat = concreteAged;
        const trimMat = graniteMat;
        const plinthH = 1.45;
        const upperH = Math.max(10.5, height);
        const floors = Math.max(3, Math.round((upperH - plinthH) / 3.4));
        const storeyH = (upperH - plinthH) / floors;

        // Stepped granite stylobate + grand entrance stairflight on south side
        push(trimMat, width + 1.0, plinthH, depth + 1.0, cx, baseY + plinthH / 2, cz);
        for (let s = 0; s < 5; s++) {
          push(trimMat, width * 0.48, 0.28, 0.55, cx, baseY + 0.14 + s * 0.26, cz + depth / 2 + 2.4 - s * 0.46);
        }
        // Main civic massing + tall classical fluted pilasters along all 4 sides
        push(steelDark, width - 0.8, upperH - plinthH - 0.2, depth - 0.8, cx, baseY + plinthH + (upperH - plinthH) / 2, cz);
        populateFacade(push, {
          cx, cz, width, depth, baseY, yStart: plinthH, floors, storeyH,
          bayTarget: 4.0, wallMat, trimMat, steelDark, steelGalv, officeGlass, litGlass, blindGlass, rng,
        });
        // Projecting front colonnade portico (4 tall columns supporting a real ExtrudeGeometry triangular pediment!)
        const portW = Math.min(width * 0.62, 14.0);
        const portZ = cz + depth / 2 + 1.85;
        for (let c = 0; c < 4; c++) {
          const colX = cx - portW / 2 + 0.9 + (c / 3) * (portW - 1.8);
          const col = addMesh(unitCyl, trimMat, colX, baseY + plinthH + (upperH - plinthH) * 0.46, portZ);
          col.scale.set(0.42, (upperH - plinthH) * 0.92, 0.42); col.updateMatrix();
        }
        const pedGeo = extrudeShape([
          [-portW / 2 - 0.5, 0], [0, 2.35], [portW / 2 + 0.5, 0],
        ], 2.8, { bevel: 0.08 });
        addMesh(pedGeo, trimMat, cx, baseY + upperH - 0.2, portZ - 0.7);
        // Heavy beveled entablature + central glazed roof cupola lantern
        const entabGeo = extrudeShape([
          [-width / 2 - 0.6, -depth / 2 - 0.6], [width / 2 + 0.6, -depth / 2 - 0.6],
          [width / 2 + 0.6, depth / 2 + 0.6], [-width / 2 - 0.6, depth / 2 + 0.6],
        ], 0.72, { bevel: 0.12, rotX: Math.PI / 2 });
        addMesh(entabGeo, trimMat, cx, baseY + upperH + 0.36, cz);
        const cupW = Math.min(width * 0.36, 7.2);
        push(trimMat, cupW, 2.2, cupW, cx, baseY + upperH + 1.8, cz);
        push(litGlass, cupW - 0.8, 1.35, cupW + 0.12, cx, baseY + upperH + 1.85, cz);
        push(litGlass, cupW + 0.12, 1.35, cupW - 0.8, cx, baseY + upperH + 1.85, cz);
        const cupRoof = extrudeShape([[-cupW / 2 - 0.4, 0], [0, 1.8], [cupW / 2 + 0.4, 0]], cupW + 0.8, { bevel: 0.05 });
        addMesh(cupRoof, steelDark, cx, baseY + upperH + 2.9, cz);
      }

      // =========================================================================
      // ARCHETYPE 6: SAWTOOTH INDUSTRIAL HALL (ExtrudeGeometry serrated north-light roof, portal H-frames, cyclone stack)
      // =========================================================================
      else {
        const wallH = Math.min(9.5, Math.max(6.8, height * 0.82));
        push(concreteWet, width + 0.6, 1.4, depth + 0.6, cx, baseY + 0.7, cz);
        push(corrugatedMat, width, wallH - 1.4, depth, cx, baseY + 1.4 + (wallH - 1.4) / 2, cz);
        const bays = Math.max(3, Math.round(width / 6.2));
        for (let i = 0; i <= bays; i++) {
          const px = cx - width / 2 + (i / bays) * width;
          for (const pz of [cz - depth / 2 - 0.12, cz + depth / 2 + 0.12]) {
            push(steelDark, 0.38, wallH + 0.2, 0.38, px, baseY + wallH / 2, pz);
          }
        }
        // Multi-bay serrated Sawtooth Roof profile via ExtrudeGeometry!
        const sawCount = 3;
        const sawSpan = depth / sawCount;
        const sawPts = [[-depth / 2, 0]];
        for (let s = 0; s < sawCount; s++) {
          const z0 = -depth / 2 + s * sawSpan;
          sawPts.push([z0 + sawSpan * 0.15, 2.35], [z0 + sawSpan, 0]);
        }
        const sawGeo = extrudeShape(sawPts, width + 0.6, { bevel: 0.04, rotY: Math.PI / 2 });
        addMesh(sawGeo, corrugatedMat, cx, baseY + wallH, cz);
        for (let s = 0; s < sawCount; s++) {
          const gz = cz - depth / 2 + s * sawSpan + sawSpan * 0.08;
          push(officeGlass, width - 0.8, 1.75, 0.14, cx, baseY + wallH + 1.1, gz, -0.25, 0, 0);
        }
        // Exterior steel cyclone dust collector & exhaust stack
        const stack = addMesh(unitCyl, steelGalv, cx + width / 2 + 1.1, baseY + wallH * 0.72, cz - depth * 0.2);
        stack.scale.set(0.68, wallH * 1.45, 0.68); stack.updateMatrix();
      }

      flush();

      // Corner TubeGeometry rainwater downspouts
      g.add(makePipeCurve([
        [cx - width / 2 - 0.08, baseY + Math.min(height, 10) - 0.2, cz - depth / 2 + 0.45],
        [cx - width / 2 - 0.18, baseY + Math.min(height, 10) - 0.7, cz - depth / 2 + 0.45],
        [cx - width / 2 - 0.18, baseY + 0.65, cz - depth / 2 + 0.45],
        [cx - width / 2 - 0.32, baseY + 0.22, cz - depth / 2 + 0.45],
      ], 0.085, steelGalv));

      // Ground-floor weathered facade signage Decal
      if (labelZh) {
        const decalMat = matLib.createDecalMaterial(labelZh, labelEn || 'SALTLINE COASTAL DISTRICT');
        const sign = new Mesh(unitBox, decalMat);
        sign.scale.set(Math.min(5.8, width * 0.44), 1.38, 0.09);
        sign.position.set(cx, baseY + 3.65, cz + depth / 2 + 0.14);
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
