/* WorldEngine/Terrain/TerrainGenerator.js
 * Continuous FBM Heightmap Cliff Escarpment with Vertex-Color Splat Blending
 * + Wind-Swaying InstancedMesh Vegetation (GPU Vertex Shader). */
(() => {
  const WE = (window.WorldEngine = window.WorldEngine || {});

  function createTerrainGenerator(THREE, matLib) {
    const { Mesh, BufferGeometry, Float32BufferAttribute, InstancedMesh, Object3D, MeshStandardMaterial } = THREE;
    const geos = [];
    const mats = [];

    // Builds a continuous multi-strata cliff escarpment with vertex-color splat blending:
    // dark wet basalt at toe -> weathered coastal granite on slope -> mossy grass on summit rim.
    function buildStratifiedCliff(parent, {
      crestX = -224, zMin = -128, zMax = 144, zSteps = 56, layers = 6,
      heightFn = z => (z < -28 ? 14.4 : (z < 46 ? 12.8 : 11.0)),
    } = {}) {
      const verts = [], uvs = [], colors = [];
      const sample = (i, j) => {
        const t = i / zSteps;
        const z = zMin + t * (zMax - zMin);
        const f = j / layers;
        const baseH = heightFn(z);
        const fbm = Math.sin(z * 0.085) * 1.45 + Math.cos(z * 0.21) * 0.72 + Math.sin(z * 0.49) * 0.34;
        const strataStep = Math.sin(f * Math.PI * 3.0) * 0.42;
        const y = (baseH + fbm) * f;
        const toeReach = (1 - f) * (8.2 + Math.sin(z * 0.14 + j * 0.9) * 1.9) + strataStep;
        const x = crestX + toeReach;
        // Splat-style vertex color blend: damp dark toe -> granite mid -> mossy green rim
        let r, g, b;
        if (f < 0.22) {
          r = 0.24; g = 0.26; b = 0.25;
        } else if (f > 0.82) {
          const gt = (f - 0.82) / 0.18;
          r = 0.36 * (1 - gt) + 0.19 * gt;
          g = 0.38 * (1 - gt) + 0.29 * gt;
          b = 0.34 * (1 - gt) + 0.18 * gt;
        } else {
          const rockShade = 0.34 + 0.07 * Math.sin(z * 0.31 + f * 7.0);
          r = rockShade; g = rockShade * 1.03; b = rockShade * 0.96;
        }
        return { pos: [x, y, z], col: [r, g, b] };
      };

      for (let i = 0; i < zSteps; i++) {
        for (let j = 0; j < layers; j++) {
          const a = sample(i, j), b = sample(i + 1, j), c = sample(i, j + 1), d = sample(i + 1, j + 1);
          for (const v of [a, c, b, b, c, d]) {
            verts.push(...v.pos);
            uvs.push(v.pos[2] / 4.2, v.pos[1] / 4.2);
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

    // Wind-Animated InstancedMesh Pine Forest (injects gentle vertex-shader wind sway on canopy!)
    function buildWindPineForest(parent, crownGeo, trunkGeo, trunkMat, positions, updaters) {
      if (!positions.length || typeof InstancedMesh !== 'function' || typeof Object3D !== 'function') return null;
      const windUniform = { value: 0 };
      const canopyMat = new MeshStandardMaterial({
        color: 0x1e3523, roughness: 0.88, metalness: 0.02, side: THREE.DoubleSide,
      });
      canopyMat.onBeforeCompile = shader => {
        shader.uniforms.uWindTime = windUniform;
        shader.vertexShader = 'uniform float uWindTime;\n' + shader.vertexShader.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
          float swayAmt = max(0.0, (position.y - 1.6) * 0.055);
          float phase = uWindTime * 1.45 + instanceMatrix[3][0] * 0.13 + instanceMatrix[3][2] * 0.11;
          transformed.x += sin(phase) * swayAmt;
          transformed.z += cos(phase * 0.82) * swayAmt * 0.72;`
        );
      };
      mats.push(canopyMat);

      const dummy = new Object3D();
      const crownInst = new InstancedMesh(crownGeo, canopyMat, positions.length);
      const trunkInst = new InstancedMesh(trunkGeo, trunkMat, positions.length);
      for (let i = 0; i < positions.length; i++) {
        const [px, py, pz, sc] = positions[i];
        dummy.position.set(px, py, pz);
        dummy.rotation.set(0, (i * 1.73) % 6.28, 0);
        dummy.scale.setScalar(sc);
        dummy.updateMatrix();
        crownInst.setMatrixAt(i, dummy.matrix);
        dummy.position.set(px, py + 2.4 * sc, pz);
        dummy.scale.set(0.15 * sc, 4.8 * sc, 0.15 * sc);
        dummy.updateMatrix();
        trunkInst.setMatrixAt(i, dummy.matrix);
      }
      crownInst.receiveShadow = true;
      trunkInst.receiveShadow = true;
      parent.add(crownInst, trunkInst);
      if (Array.isArray(updaters)) {
        updaters.push(dt => { windUniform.value += dt; });
      }
      return { crownInst, trunkInst };
    }

    function dispose() {
      for (const g of geos) g.dispose?.();
      for (const m of mats) m.dispose?.();
    }

    return { buildStratifiedCliff, buildWindPineForest, dispose };
  }

  WE.createTerrainGenerator = createTerrainGenerator;
})();
