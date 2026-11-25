/* WorldEngine/Assets/IndustrialGenerator.js
 * Parametric Industrial Infrastructure Generator using CatmullRomCurve3 + TubeGeometry
 * (overhead steam/cryo pipelines & catenary cables), LatheGeometry (domed cryo/fuel tanks),
 * and InstancedMesh (reflective road puddles, safety bollards & structural flanges). */
(() => {
  const WE = (window.WorldEngine = window.WorldEngine || {});

  function createIndustrialGenerator(THREE, matLib, sharedMats) {
    const { Group, Mesh, BoxGeometry, CylinderGeometry, Vector2, Vector3, InstancedMesh, Object3D, MeshStandardMaterial } = THREE;
    const geos = [];
    const mats = [];

    // 1. Overhead Multi-Pipe Industrial Bridge (CatmullRomCurve3 + TubeGeometry + steel support trestles)
    function buildOverheadPipeline(parent, points, {
      radius = 0.28, pipeCount = 2, spacing = 0.72, pipeMat, supportMat, hazardMat,
    } = {}) {
      if (!points || points.length < 2) return null;
      const g = new Group();
      const pMat = pipeMat || matLib.get('metal_painted');
      const sMat = supportMat || sharedMats.steelGalv;
      const hMat = hazardMat || sharedMats.hazard;
      const vecs = points.map(p => new Vector3(p[0], p[1], p[2]));

      for (let k = 0; k < pipeCount; k++) {
        const off = (k - (pipeCount - 1) / 2) * spacing;
        const shifted = vecs.map(v => new Vector3(v.x + off, v.y, v.z + off * 0.35));
        if (typeof THREE.CatmullRomCurve3 === 'function' && typeof THREE.TubeGeometry === 'function') {
          const curve = new THREE.CatmullRomCurve3(shifted, false, 'catmullrom', 0.12);
          const tubeGeo = new THREE.TubeGeometry(curve, Math.max(16, points.length * 10), radius, 10, false);
          geos.push(tubeGeo);
          const m = new Mesh(tubeGeo, pMat);
          m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix();
          g.add(m);
        } else {
          // Graceful fallback for headless tests without TubeGeometry
          for (let i = 0; i < shifted.length - 1; i++) {
            const a = shifted[i], b = shifted[i + 1];
            const len = a.distanceTo(b);
            const seg = new Mesh(new CylinderGeometry(radius, radius, len, 8), pMat);
            seg.position.copy(a).add(b).multiplyScalar(0.5);
            g.add(seg);
          }
        }
      }

      // Steel H-frame support trestles & yellow hazard collars along interior waypoints
      const boxG = new BoxGeometry(1, 1, 1);
      geos.push(boxG);
      for (let i = 0; i < vecs.length; i++) {
        const v = vecs[i];
        if (v.y <= 1.2) continue;
        const legH = v.y - 0.16;
        const span = Math.max(1.4, pipeCount * spacing + 0.8);
        for (const sgn of [-0.5, 0.5]) {
          const leg = new Mesh(boxG, sMat);
          leg.scale.set(0.24, legH, 0.24);
          leg.position.set(v.x + sgn * span, 0.16 + legH / 2, v.z);
          leg.matrixAutoUpdate = false; leg.updateMatrix();
          g.add(leg);
        }
        const beam = new Mesh(boxG, hMat);
        beam.scale.set(span + 0.5, 0.28, 0.32);
        beam.position.set(v.x, v.y - radius - 0.16, v.z);
        beam.matrixAutoUpdate = false; beam.updateMatrix();
        g.add(beam);
      }

      parent.add(g);
      return g;
    }

    // 2. LatheGeometry Domed Cryogenic / Pressurized Chemical Tank Cluster
    function buildCryoTankCluster(parent, x, z, count = 3, spacing = 5.4) {
      const g = new Group();
      g.position.set(x, 0.16, z);
      const tankMat = sharedMats.craneWhite || matLib.get('metal_painted');
      const bandMat = sharedMats.steelGalv;
      const darkMat = sharedMats.steelDark;

      let tankGeo = null;
      if (typeof THREE.LatheGeometry === 'function' && typeof Vector2 === 'function') {
        const pts = [
          new Vector2(0.05, 0.9),
          new Vector2(1.45, 0.95),
          new Vector2(1.85, 1.55),
          new Vector2(1.92, 2.2),
          new Vector2(1.92, 8.2),
          new Vector2(1.82, 9.0),
          new Vector2(1.25, 9.65),
          new Vector2(0.45, 9.95),
          new Vector2(0.05, 10.0),
        ];
        tankGeo = new THREE.LatheGeometry(pts, 20);
        geos.push(tankGeo);
      }
      const padGeo = new BoxGeometry(count * spacing + 2.4, 0.42, 5.6);
      const legGeo = new CylinderGeometry(0.14, 0.18, 1.8, 8);
      const ringGeo = new CylinderGeometry(2.02, 2.02, 0.24, 16);
      geos.push(padGeo, legGeo, ringGeo);

      const pad = new Mesh(padGeo, matLib.get('concrete_aged'));
      pad.position.set(0, 0.21, 0);
      pad.receiveShadow = true; pad.matrixAutoUpdate = false; pad.updateMatrix();
      g.add(pad);

      const startX = -((count - 1) * spacing) / 2;
      for (let i = 0; i < count; i++) {
        const tx = startX + i * spacing;
        const body = tankGeo
          ? new Mesh(tankGeo, tankMat)
          : new Mesh(new CylinderGeometry(1.9, 1.9, 8.8, 14), tankMat);
        body.position.set(tx, tankGeo ? 0.35 : 5.2, 0);
        body.receiveShadow = true; body.matrixAutoUpdate = false; body.updateMatrix();
        g.add(body);
        for (const ry of [3.2, 7.6]) {
          const ring = new Mesh(ringGeo, ry > 5 ? bandMat : darkMat);
          ring.position.set(tx, ry, 0);
          ring.matrixAutoUpdate = false; ring.updateMatrix();
          g.add(ring);
        }
        for (let l = 0; l < 4; l++) {
          const ang = (l / 4) * Math.PI * 2 + 0.4;
          const leg = new Mesh(legGeo, darkMat);
          leg.position.set(tx + Math.cos(ang) * 1.42, 1.15, Math.sin(ang) * 1.42);
          leg.matrixAutoUpdate = false; leg.updateMatrix();
          g.add(leg);
        }
      }
      parent.add(g);
      return g;
    }

    // 3. InstancedMesh Reflective Wet Puddles (catches PMREM sky reflection on harbor concrete & asphalt!)
    function buildReflectivePuddles(parent, puddleSpecs) {
      if (!puddleSpecs?.length || typeof InstancedMesh !== 'function' || typeof Object3D !== 'function') return null;
      const discGeo = new CylinderGeometry(1, 1, 0.012, 18);
      geos.push(discGeo);
      const puddleMat = new MeshStandardMaterial({
        color: 0x1e2c36, roughness: 0.06, metalness: 0.82,
        transparent: true, opacity: 0.54, depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
      });
      mats.push(puddleMat);
      const inst = new InstancedMesh(discGeo, puddleMat, puddleSpecs.length);
      const dummy = new Object3D();
      for (let i = 0; i < puddleSpecs.length; i++) {
        const [x, y, z, rx, rz, yaw = 0] = puddleSpecs[i];
        dummy.position.set(x, y, z);
        dummy.rotation.set(0, yaw, 0);
        dummy.scale.set(rx, 1, rz);
        dummy.updateMatrix();
        inst.setMatrixAt(i, dummy.matrix);
      }
      inst.receiveShadow = true;
      parent.add(inst);
      return inst;
    }

    function dispose() {
      for (const g of geos) g.dispose?.();
      for (const m of mats) m.dispose?.();
    }

    return { buildOverheadPipeline, buildCryoTankCluster, buildReflectivePuddles, dispose };
  }

  WE.createIndustrialGenerator = createIndustrialGenerator;
})();
