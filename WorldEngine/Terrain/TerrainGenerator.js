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
      const baseEscarp = 12.5 - 1.7 * Math.tanh((z - 6) / 46);
      return 0.16 + smoothWest * (baseEscarp + fbm + ridge * 1.4 - erosion);
    }

    const regions = [
      [-244,-226,25,-30.2], [-244,-30.2,-107.2,28.2], [-244,28.2,-6.2,148],
      [-6.2,28.2,25,80.5], [-6.2,103.5,25,148]
    ];
    function floorAt(x,z) {
      for (const [west,north,east,south] of regions)
        if (x>=west && x<=east && z>=north && z<=south) return sampleHeight(x,z);
      return undefined;
    }

    function intersectRay(origin,dir,maxDist) {
      let hit=maxDist;
      for (const [west,north,east,south] of regions) {
        let lo=0,hi=hit;
        for (const [pos,delta,min,max] of [[origin.x,dir.x,west,east],[origin.z,dir.z,north,south]]) {
          if (Math.abs(delta)<1e-8) { if(pos<min || pos>max) hi=-1; continue; }
          const a=(min-pos)/delta,b=(max-pos)/delta;
          lo=Math.max(lo,Math.min(a,b)); hi=Math.min(hi,Math.max(a,b));
        }
        if (lo>hi) continue;
        const flat=dir.y<0 ? (.16-origin.y)/dir.y : Infinity;
        if (flat>=lo && flat<=hi && origin.x+dir.x*flat>=-216) hit=Math.min(hit,flat);
        if (dir.x>0) hi=Math.min(hi,(-216-origin.x)/dir.x);
        else if (dir.x<0) lo=Math.max(lo,(-216-origin.x)/dir.x);
        else if (origin.x>=-216) continue;
        if(lo>hi) continue;
        const above=t=>origin.y+dir.y*t-sampleHeight(origin.x+dir.x*t,origin.z+dir.z*t);
        const step=2/Math.max(.01,Math.hypot(dir.x,dir.z));
        for(let start=lo;start<hi;) {
          const end=Math.min(hi,start+step);
          if(above(start)>=0 && above(end)<=0) {
            let a=start,b=end;
            for(let i=0;i<14;i++){const mid=(a+b)/2;if(above(mid)>0)a=mid;else b=mid;}
            hit=Math.min(hit,b); break;
          }
          start=end;
        }
      }
      return hit<maxDist ? hit : null;
    }

    function tileGeometry(x0,z0,x1,z1,spacing) {
      const nx = Math.ceil((x1-x0)/spacing), nz = Math.ceil((z1-z0)/spacing);
      const positions=[],colors=[],uv=[],indices=[];
      for (let j=0;j<=nz;j++) for (let i=0;i<=nx;i++) {
        const x = x0+(x1-x0)*i/nx, z = z0+(z1-z0)*j/nz;
        const h = sampleHeight(x,z);
        positions.push(x,h,z);
        uv.push(x/3,z/3);
        const grade = Math.min(1,Math.hypot(sampleHeight(x+.5,z)-sampleHeight(x-.5,z),
          sampleHeight(x,z+.5)-sampleHeight(x,z-.5)));
        const inland = Math.min(1,Math.max(0,(-x-210)/12));
        const sod = inland*(1-grade)*(.81+.13*Math.sin(x*.53+z*.34));
        colors.push(1-.66*sod-.28*grade,1-.44*sod-.25*grade,1-.75*sod-.26*grade);
        if (i && j) {
          const d = j*(nx+1)+i, c=d-1,b=d-nx-1,a=b-1;
          indices.push(a,c,b,b,c,d);
        }
      }
      const geo = new BufferGeometry();
      geo.setAttribute('position',new Float32BufferAttribute(positions,3));
      geo.setAttribute('color',new Float32BufferAttribute(colors,3));
      geo.setAttribute('uv',new Float32BufferAttribute(uv,2));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      return geo;
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

      const pineMat = makeWindMat(0xffffff, .026);
      const loader = new THREE.TextureLoader();
      const foliageMaps = ['twig','alpha'].map(name => loader.load('./assets/surfaces/pine_tree_01/'+name+'.jpg'));
      pineMat.map = foliageMaps[0]; pineMat.map.colorSpace = THREE.SRGBColorSpace;
      pineMat.alphaMap = foliageMaps[1]; pineMat.alphaTest = .40;
      pineMat.userData.ownedMaps = foliageMaps;
      const vertices=[], uv=[];
      // This atlas has a vertical needle spray at its upper-left corner.
      for (let level=0;level<11;level++) {
        const y=1.2+level*.37, reach=1.82-level*.135;
        for (let j=0;j<10;j++) {
          const azimuth=j*2.39996+level*1.72;
          for (const split of [-.34,0,.34]) {
            const a=azimuth+split, dx=Math.cos(a), dz=Math.sin(a);
            const start=.15+Math.abs(split)*reach*.72, end=reach*(.91+.09*Math.cos(j*4.1));
            const w=(end-start)*.24;
            const tipY=y-.27+.13*Math.cos(level+j);
            const x=Math.cos(azimuth)*start,z=Math.sin(azimuth)*start;
            const tipX=x+dx*(end-start),tipZ=z+dz*(end-start);
            const v=[[x-dz*w,y,z+dx*w],[x+dz*w,y,z-dx*w],
              [tipX+dz*w,tipY,tipZ-dx*w],[tipX-dz*w,tipY,tipZ+dx*w]];
            for(const i of [0,1,2,0,2,3]) {
              vertices.push(...v[i]);
              uv.push(i===0||i===3?.014:.232,i<2?.56:.99);
            }
          }
        }
      }
      const foliage = new BufferGeometry();
      foliage.setAttribute('position',new Float32BufferAttribute(vertices,3));
      foliage.setAttribute('uv',new Float32BufferAttribute(uv,2));
      foliage.computeVertexNormals(); geos.push(foliage);
      const pines = [], cypresses = [], shrubs = [];
      for (let i = 0; i < positions.length; i++) {
        const p = positions[i];
        if (i % 5 === 2) cypresses.push(p);
        else pines.push(p);
        // Ecological understory coastal shrub clustered near tree bases
        if (i % 2 === 0) shrubs.push([p[0] + Math.sin(i * 2.1) * 1.9, sampleHeight(p[0] + Math.sin(i * 2.1) * 1.9, p[2] + Math.cos(i * 1.7) * 1.9), p[2] + Math.cos(i * 1.7) * 1.9, 0.75 + (i % 3) * 0.22]);
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

      const pineInst = buildSpecies(pines, foliage, pineMat, true);
      const cypressInst = buildSpecies(cypresses, foliage, pineMat, true);
      const shrubInst = buildSpecies(shrubs.map(([x, y, z, size]) => [x, y, z, size * .34]), foliage, pineMat, false);

      // Natural hillside fractured granite outcrops & slope-aligned fallen timber logs (ZERO floating saucers/logs!)
      let rockInst = null, logInst = null;
      if (typeof DodecahedronGeometry === 'function' && positions.length) {
        const rockGeo = new DodecahedronGeometry(1, 0);
        const rPos = rockGeo.attributes?.position;
        if (rPos) {
          for (let v = 0; v < rPos.count; v++) {
            const vx = rPos.getX(v), vy = rPos.getY(v), vz = rPos.getZ(v);
            const jag = 0.84 + 0.30 * Math.abs(Math.sin(vx * 5.3 + vy * 3.7 + vz * 4.1));
            rPos.setXYZ(v, vx * jag, vy * jag, vz * jag);
          }
          rockGeo.computeVertexNormals();
        }
        geos.push(rockGeo);
        const rockMat = matLib?.get ? matLib.get('granite') : new MeshStandardMaterial({ color: 0x6b6f69, roughness: 0.92 });
        const rockList = [];
        for (let i = 0; i < positions.length; i += 2) {
          const [px, , pz] = positions[i];
          const rx = px + Math.sin(i * 3.17) * 3.2;
          const rz = pz + Math.cos(i * 2.41) * 3.0;
          if (rx > -217.5) continue;
          const ry = sampleHeight(rx, rz);
          const sx = 0.75 + (i % 4) * 0.32;
          const sy = 0.65 + (i % 3) * 0.28;
          const sz = 0.72 + ((i * 3) % 4) * 0.28;
          const dhx = sampleHeight(rx + 1.0, rz) - sampleHeight(rx - 1.0, rz);
          const dhz = sampleHeight(rx, rz + 1.0) - sampleHeight(rx, rz - 1.0);
          rockList.push([rx, ry - sy * 0.42, rz, sx, sy, sz, Math.atan2(dhz, 2.0), i * 1.13, -Math.atan2(dhx, 2.0)]);
        }
        if (rockList.length) {
          rockInst = new InstancedMesh(rockGeo, rockMat, rockList.length);
          for (let i = 0; i < rockList.length; i++) {
            const [rx, ry, rz, sx, sy, sz, rotX, rotY, rotZ] = rockList[i];
            dummy.position.set(rx, ry, rz);
            dummy.rotation.set(rotX, rotY, rotZ);
            dummy.scale.set(sx, sy, sz);
            dummy.updateMatrix();
            rockInst.setMatrixAt(i, dummy.matrix);
          }
          rockInst.receiveShadow = true;
          parent.add(rockInst);
        }
      }
      if (trunkGeo && positions.length >= 6) {
        const logList = [];
        for (let i = 3; i < positions.length; i += 8) {
          const [px, , pz] = positions[i];
          const lx = px + 1.8, lz = pz + 1.5;
          if (lx > -218.0) continue;
          const len = 2.6 + (i % 3) * 0.55;
          const yA = sampleHeight(lx, lz - len * 0.45);
          const yB = sampleHeight(lx, lz + len * 0.45);
          const yMid = Math.min(sampleHeight(lx, lz), (yA + yB) * 0.5) + 0.04;
          const pitch = Math.atan2(yB - yA, len * 0.9);
          logList.push([lx, yMid, lz, 0.16 + (i % 3) * 0.03, len, pitch]);
        }
        if (logList.length) {
          logInst = new InstancedMesh(trunkGeo, trunkMat, logList.length);
          for (let i = 0; i < logList.length; i++) {
            const [lx, ly, lz, r, len, pitch] = logList[i];
            dummy.position.set(lx, ly, lz);
            dummy.rotation.set(Math.PI / 2 - pitch, 0, 0);
            dummy.scale.set(r, len, r);
            dummy.updateMatrix();
            logInst.setMatrixAt(i, dummy.matrix);
          }
          logInst.receiveShadow = true;
          parent.add(logInst);
        }
      }

      if (Array.isArray(updaters)) {
        updaters.push(dt => { windUniform.value += dt; });
      }
      return { pineInst, cypressInst, shrubInst, rockInst, logInst };
    }

    function dispose() {
      for (const g of geos) g.dispose?.();
      for (const m of mats) { for (const map of m.userData.ownedMaps || []) map.dispose(); m.dispose(); }
    }

    return { regions, floorAt, intersectRay, tileGeometry, sampleHeight, buildStratifiedCliff, buildWindPineForest, dispose };
  }

  WE.createTerrainGenerator = createTerrainGenerator;
})();
