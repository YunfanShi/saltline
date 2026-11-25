/* WorldEngine/Terrain/TerrainGenerator.js
 * Unified Continuous World Heightfield, Eroded Stratified Escarpment,
 * Slope-Blended Terrain Patches & Multi-Species Ecological Vegetation
 * (Coastal Pine, Tapered Cypress & Broadleaf Coastal Shrubs with GPU Wind Sway). */
(() => {
  const WE = (window.WorldEngine = window.WorldEngine || {});

  function createTerrainGenerator(THREE, matLib) {
    const { Mesh, BufferGeometry, Float32BufferAttribute, ConeGeometry, DodecahedronGeometry, InstancedMesh, Object3D, MeshStandardMaterial } = THREE;
    const geos = [];
    const mats = [];

    // Unified deterministic continuous heightfield with ridge + erosion approximation
    function sampleHeight(x, z) {
      const fbm = Math.sin(x * 0.045 + z * 0.032) * 1.65 +
        Math.cos(x * 0.11 - z * 0.085) * 0.82 +
        Math.sin(x * 0.23 + z * 0.19) * 0.34;
      const ridge = 1.0 - Math.abs(Math.sin(z * 0.025 + x * 0.018));
      const erosion = Math.max(0, Math.sin(z * 0.14) * Math.cos(x * 0.09)) * 0.85;
      // Western highland escarpment rises smoothly west of x = -216
      const westSlope = Math.max(0, Math.min(1, (-216 - x) / 16));
      const smoothWest = westSlope * westSlope * (3 - 2 * westSlope);
      const baseEscarp = z < -28 ? 14.2 : (z < 46 ? 12.6 : 10.8);
      return 0.16 + smoothWest * (baseEscarp + fbm + ridge * 1.4 - erosion);
    }

    // Continuous multi-strata cliff escarpment with hydraulic-erosion gullies & slope-blended vertex colors
    function buildStratifiedCliff(parent, {
      crestX = -224, zMin = -128, zMax = 144, zSteps = 64, layers = 7,
      heightFn = z => (z < -28 ? 14.4 : (z < 46 ? 12.8 : 11.0)),
    } = {}) {
      const verts = [], uvs = [], colors = [];
      const sample = (i, j) => {
        const t = i / zSteps;
        const z = zMin + t * (zMax - zMin);
        const f = j / layers;
        const baseH = heightFn(z);
        const fbm = Math.sin(z * 0.085) * 1.45 + Math.cos(z * 0.21) * 0.72 + Math.sin(z * 0.49) * 0.34;
        const gully = Math.pow(Math.max(0, Math.sin(z * 0.17 + 0.6)), 2) * (1 - f) * 1.6;
        const strataStep = Math.sin(f * Math.PI * 3.5) * 0.44;
        const y = (baseH + fbm) * f;
        const toeReach = (1 - f) * (8.6 + Math.sin(z * 0.14 + j * 0.9) * 2.0 - gully) + strataStep;
        const x = crestX + toeReach;
        let r, g, b;
        if (f < 0.20) {
          r = 0.23; g = 0.25; b = 0.24; // Damp basalt toe
        } else if (f > 0.80) {
          const gt = (f - 0.80) / 0.20;
          r = 0.35 * (1 - gt) + 0.19 * gt;
          g = 0.37 * (1 - gt) + 0.30 * gt;
          b = 0.33 * (1 - gt) + 0.18 * gt; // Mossy coastal grass crest
        } else {
          const rockShade = 0.33 + 0.08 * Math.sin(z * 0.31 + f * 7.5) - gully * 0.025;
          r = rockShade; g = rockShade * 1.03; b = rockShade * 0.95;
        }
        return { pos: [x, y, z], col: [r, g, b] };
      };

      for (let i = 0; i < zSteps; i++) {
        for (let j = 0; j < layers; j++) {
          const a = sample(i, j), b = sample(i + 1, j), c = sample(i, j + 1), d = sample(i + 1, j + 1);
          for (const v of [a, c, b, b, c, d]) {
            verts.push(...v.pos);
            uvs.push(v.pos[2] / 4.0, v.pos[1] / 4.0);
            colors.push(...v.col);
          }
        }
      }

      const geo = new BufferGeometry();
      geo.setAttribute('position', new Float32BufferAttribute(verts, 3));
      geo.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
      geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
      geo.computeVertexNormals();
      geos.push(geo);

      const baseRock = matLib.get('cliff_stone');
      const cliffMat = baseRock.clone ? baseRock.clone() : new MeshStandardMaterial({ color: 0x565b55, roughness: 0.92 });
      cliffMat.vertexColors = true;
      cliffMat.side = THREE.DoubleSide;
      mats.push(cliffMat);

      const mesh = new Mesh(geo, cliffMat);
      mesh.receiveShadow = true;
      mesh.matrixAutoUpdate = false; mesh.updateMatrix();
      parent.add(mesh);
      return mesh;
    }

    // Multi-Species Ecological Wind-Animated Forest (Coastal Pine + Tapered Cypress + Broadleaf Shrubs!)
    function buildWindPineForest(parent, crownGeo, trunkGeo, trunkMat, positions, updaters) {
      if (!positions.length || typeof InstancedMesh !== 'function' || typeof Object3D !== 'function') return null;
      const windUniform = { value: 0 };
      const makeWindMat = (hex, swayFactor = 0.055) => {
        const mat = new MeshStandardMaterial({ color: hex, roughness: 0.88, metalness: 0.02, side: THREE.DoubleSide });
        mat.onBeforeCompile = shader => {
          shader.uniforms.uWindTime = windUniform;
          shader.vertexShader = 'uniform float uWindTime;\n' + shader.vertexShader.replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>
            float swayAmt = max(0.0, (position.y - 1.2) * ${swayFactor.toFixed(4)});
            float phase = uWindTime * 1.45 + instanceMatrix[3][0] * 0.13 + instanceMatrix[3][2] * 0.11;
            transformed.x += sin(phase) * swayAmt;
            transformed.z += cos(phase * 0.82) * swayAmt * 0.72;`
          );
        };
        mats.push(mat);
        return mat;
      };

      const pineMat = makeWindMat(0x1f3624, 0.055);
      const cypressMat = makeWindMat(0x28422b, 0.042);
      const shrubMat = makeWindMat(0x36522e, 0.028);

      const cypressGeo = typeof ConeGeometry === 'function' ? new ConeGeometry(1.15, 5.4, 8) : crownGeo;
      if (cypressGeo !== crownGeo) { cypressGeo.translate(0, 3.6, 0); geos.push(cypressGeo); }
      const shrubGeo = typeof DodecahedronGeometry === 'function' ? new DodecahedronGeometry(1.1, 0) : crownGeo;
      if (shrubGeo !== crownGeo) { shrubGeo.scale(1.25, 0.68, 1.15); shrubGeo.translate(0, 0.65, 0); geos.push(shrubGeo); }

      const pines = [], cypresses = [], shrubs = [];
      for (let i = 0; i < positions.length; i++) {
        const p = positions[i];
        if (i % 5 === 2) cypresses.push(p);
        else pines.push(p);
        // Ecological understory coastal shrub clustered near tree bases
        if (i % 2 === 0) shrubs.push([p[0] + Math.sin(i * 2.1) * 1.9, p[1] - 0.1, p[2] + Math.cos(i * 1.7) * 1.9, 0.75 + (i % 3) * 0.22]);
      }

      const dummy = new Object3D();
      const buildSpecies = (list, geo, mat, hasTrunk) => {
        if (!list.length) return null;
        const cInst = new InstancedMesh(geo, mat, list.length);
        const tInst = hasTrunk ? new InstancedMesh(trunkGeo, trunkMat, list.length) : null;
        for (let i = 0; i < list.length; i++) {
          const [px, py, pz, sc] = list[i];
          dummy.position.set(px, py, pz);
          dummy.rotation.set(0, (i * 1.73) % 6.28, 0);
          dummy.scale.setScalar(sc);
          dummy.updateMatrix();
          cInst.setMatrixAt(i, dummy.matrix);
          if (tInst) {
            dummy.position.set(px, py + 2.3 * sc, pz);
            dummy.scale.set(0.14 * sc, 4.6 * sc, 0.14 * sc);
            dummy.updateMatrix();
            tInst.setMatrixAt(i, dummy.matrix);
          }
        }
        cInst.receiveShadow = true;
        parent.add(cInst);
        if (tInst) { tInst.receiveShadow = true; parent.add(tInst); }
        return cInst;
      };

      const pineInst = buildSpecies(pines, crownGeo, pineMat, true);
      const cypressInst = buildSpecies(cypresses, cypressGeo, cypressMat, true);
      const shrubInst = buildSpecies(shrubs, shrubGeo, shrubMat, false);

      if (Array.isArray(updaters)) {
        updaters.push(dt => { windUniform.value += dt; });
      }
      return { pineInst, cypressInst, shrubInst };
    }

    function dispose() {
      for (const g of geos) g.dispose?.();
      for (const m of mats) m.dispose?.();
    }

    return { sampleHeight, buildStratifiedCliff, buildWindPineForest, dispose };
  }

  WE.createTerrainGenerator = createTerrainGenerator;
})();
