/* WorldEngine/Materials/MaterialLibrary.js
 * Next-Generation Procedural PBR Material Library & Decal System for Saltline Open World.
 *   - Tiered Texture Resolution (128 / 256 / 512) based on asset importance & quality tier
 *   - Full PBR Channel Generation: Base Color, Sobel Normal, Roughness, Metalness & Ambient Occlusion (AO)
 *   - World-Space Box-Projected Texel Density helper (applyWorldUV) eliminating wall/brick stretching
 *   - Complete Architectural & Natural Presets: brick, plaster, concrete, corrugated steel, terracotta roof tiles,
 *     carved granite, weathered timber, reflective/lit office glass, asphalt, cliff stone, coastal grass & wet sand. */
(() => {
  const WE = (window.WorldEngine = window.WorldEngine || {});

  function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hash2(ix, iy, seed) {
    let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1442695041);
    n = (n ^ (n >>> 13)) * 1274126177;
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  function valueNoise2D(x, y, period, seed) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const x0 = ((xi % period) + period) % period;
    const y0 = ((yi % period) + period) % period;
    const x1 = (x0 + 1) % period, y1 = (y0 + 1) % period;
    const a = hash2(x0, y0, seed), b = hash2(x1, y0, seed);
    const c = hash2(x0, y1, seed), d = hash2(x1, y1, seed);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  function fbm2D(u, v, baseFreq, octaves, seed) {
    let sum = 0, amp = 0.5, freq = baseFreq, norm = 0;
    for (let o = 0; o < octaves; o++) {
      sum += amp * valueNoise2D(u * freq, v * freq, freq, seed + o * 97);
      norm += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return sum / norm;
  }

  function voronoiEdge2D(u, v, cells, seed) {
    const gx = u * cells, gy = v * cells;
    const ix = Math.floor(gx), iy = Math.floor(gy);
    let d1 = 9, d2 = 9;
    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        const cx = ((ix + ox) % cells + cells) % cells;
        const cy = ((iy + oy) % cells + cells) % cells;
        const px = ix + ox + hash2(cx, cy, seed);
        const py = iy + oy + hash2(cx, cy, seed + 53);
        const dx = gx - px, dy = gy - py;
        const dist = Math.hypot(dx, dy);
        if (dist < d1) { d2 = d1; d1 = dist; }
        else if (dist < d2) { d2 = dist; }
      }
    }
    return d2 - d1;
  }

  function hexToRgb(hex) { return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255]; }
  function clamp255(v) { return v < 0 ? 0 : (v > 255 ? 255 : v | 0); }

  function createMaterialLibrary(THREE, worldMats, { quality = 'high' } = {}) {
    const cache = new Map();
    const textures = [];
    const materials = [];
    const canBake = typeof document !== 'undefined' && typeof THREE.CanvasTexture === 'function';
    const qualityResMul = quality === 'low' ? 0.5 : (quality === 'ultra' ? 1.0 : 1.0);

    // Unified World-Space Box-Projected Texel Density UV mapper for ExtrudeGeometry / BufferGeometry
    function applyWorldUV(geo, tileMeters = 3.0) {
      const pos = geo?.attributes?.position;
      const nrm = geo?.attributes?.normal;
      const uv = geo?.attributes?.uv;
      if (!pos || !uv) return geo;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const nx = nrm ? Math.abs(nrm.getX(i)) : 0;
        const ny = nrm ? Math.abs(nrm.getY(i)) : 1;
        const nz = nrm ? Math.abs(nrm.getZ(i)) : 0;
        if (ny >= nx && ny >= nz) uv.setXY(i, x / tileMeters, z / tileMeters);
        else if (nx >= nz) uv.setXY(i, z / tileMeters, y / tileMeters);
        else uv.setXY(i, x / tileMeters, y / tileMeters);
      }
      uv.needsUpdate = true;
      return geo;
    }

    function bakePBRSet(key, opts) {
      const {
        baseHex = 0x6f7370, accentHex = 0x4b4e4b, kind = 'concrete',
        weathering = 0.45, wetness = 0.25, roughness = 0.84, metalness = 0.08,
        repeat = 1, seed = 101, normalStrength = 2.4, resolution = 256,
      } = opts;
      if (!canBake) {
        const mat = new THREE.MeshStandardMaterial({ color: baseHex, roughness, metalness });
        materials.push(mat);
        cache.set(key, mat);
        return mat;
      }
      const size = Math.max(128, Math.min(1024, Math.round(resolution * qualityResMul)));
      const makeCanvas = () => { const c = document.createElement('canvas'); c.width = c.height = size; return c; };
      const cCol = makeCanvas(), cRgh = makeCanvas(), cNrm = makeCanvas(), cAo = makeCanvas();
      const ctxC = cCol.getContext?.('2d'), ctxR = cRgh.getContext?.('2d'), ctxN = cNrm.getContext?.('2d'), ctxA = cAo.getContext?.('2d');
      if (!ctxC || !ctxR || !ctxN || !ctxA) {
        const mat = new THREE.MeshStandardMaterial({ color: baseHex, roughness, metalness });
        materials.push(mat);
        cache.set(key, mat);
        return mat;
      }
      const imgC = ctxC.createImageData(size, size);
      const imgR = ctxR.createImageData(size, size);
      const imgN = ctxN.createImageData(size, size);
      const imgA = ctxA.createImageData(size, size);
      const heights = new Float32Array(size * size);
      const [br, bg, bb] = hexToRgb(baseHex);
      const [ar, ag, ab] = hexToRgb(accentHex);

      for (let y = 0; y < size; y++) {
        const v = y / size;
        for (let x = 0; x < size; x++) {
          const u = x / size;
          const idx = y * size + x;
          const fbm = fbm2D(u, v, 6, 4, seed);
          const fine = fbm2D(u, v, 24, 2, seed + 311);
          const streak = fbm2D(u * 3.0, v * 0.45, 4, 3, seed + 701);
          let h = fbm * 0.65 + fine * 0.35;
          let mix = (fbm - 0.5) * weathering * 1.1;
          let rough = roughness + (fine - 0.5) * 0.16;
          let ao = 0.85 + fbm * 0.15;

          if (kind === 'brick') {
            const rows = 12, cols = 6;
            const row = Math.floor(v * rows);
            const bv = (v * rows) % 1;
            const bu = ((u * cols) + (row % 2 ? 0.5 : 0)) % 1;
            const mortar = bv < 0.11 || bu < 0.065;
            const tileTone = hash2(Math.floor((u * cols + (row % 2 ? 0.5 : 0)) % cols), row, seed + 19);
            if (mortar) { h = 0.16 + fine * 0.08; mix = 0.68; rough = 0.95; ao = 0.52; }
            else { h = 0.68 + (tileTone - 0.5) * 0.12 + fine * 0.18; mix = (tileTone - 0.5) * 0.48 + (streak - 0.5) * weathering * 0.55; rough = roughness + (tileTone - 0.5) * 0.12; ao = 0.92; }
          } else if (kind === 'roof_tile') {
            const rows = 10, cols = 8;
            const bv = (v * rows) % 1;
            const bu = (u * cols) % 1;
            const scallop = Math.sin(bu * Math.PI);
            const overlap = bv < 0.14 ? 0.25 : 0.72;
            const tileVar = hash2(Math.floor(u * cols), Math.floor(v * rows), seed + 71);
            h = overlap * (0.45 + 0.55 * scallop) + fine * 0.08;
            mix = (tileVar - 0.5) * 0.42 + (1 - bv) * 0.18 + (streak - 0.5) * weathering * 0.4;
            rough = roughness + (1 - scallop) * 0.12;
            ao = bv < 0.16 ? 0.48 : 0.88 + scallop * 0.12;
          } else if (kind === 'granite') {
            const rows = 6, cols = 4;
            const bv = (v * rows) % 1, bu = ((u * cols) + (Math.floor(v * rows) % 2 ? 0.5 : 0)) % 1;
            const joint = bv < 0.045 || bu < 0.03;
            const grain = hash2(x, y, seed + 29);
            h = joint ? 0.20 : 0.66 + (grain - 0.5) * 0.14 + fbm * 0.16;
            mix = joint ? 0.55 : (fbm - 0.5) * 0.38 + (grain - 0.5) * 0.18;
            rough = joint ? 0.94 : roughness + (grain - 0.5) * 0.14;
            ao = joint ? 0.54 : 0.92;
          } else if (kind === 'wood') {
            const planks = 8;
            const bv = (v * planks) % 1;
            const woodGrain = fbm2D(u * 2.0, v * 16.0, 4, 3, seed + 91);
            const seam = bv < 0.05;
            h = seam ? 0.18 : 0.58 + woodGrain * 0.28;
            mix = seam ? 0.7 : (woodGrain - 0.5) * 0.65;
            rough = seam ? 0.95 : roughness + (woodGrain - 0.5) * 0.16;
            ao = seam ? 0.50 : 0.86 + woodGrain * 0.12;
          } else if (kind === 'concrete_cracked' || kind === 'stone') {
            const edge = voronoiEdge2D(u, v, kind === 'stone' ? 6 : 4, seed + 41);
            const crack = edge < 0.045 ? (1 - edge / 0.045) : 0;
            h -= crack * 0.55; mix += crack * 0.65; rough += crack * 0.18; ao = 0.92 - crack * 0.45;
          } else if (kind === 'metal_rusted') {
            const rustMask = Math.max(0, Math.min(1, (fbm + streak * 0.45 - (0.95 - weathering * 0.55)) * 2.8));
            const seam = (y % 64 < 2 || x % 128 < 2) ? 0.35 : 0;
            h = 0.55 - seam + rustMask * 0.25 + fine * 0.1;
            mix = rustMask; rough = roughness * (1 - rustMask) + 0.92 * rustMask;
            ao = seam > 0 ? 0.58 : 0.92 - rustMask * 0.18;
          } else if (kind === 'corrugated') {
            const rib = Math.sin(u * Math.PI * 32) * 0.5 + 0.5;
            const boltRow = (y % 64 < 3) ? 0.25 : 0;
            const rustMask = Math.max(0, Math.min(1, (fbm + streak * 0.4 - 0.78) * 3.0)) * weathering;
            h = 0.28 + rib * 0.52 - boltRow + fine * 0.08;
            mix = rustMask * 0.85 + (1 - rib) * 0.18;
            rough = roughness * (1 - rustMask) + 0.90 * rustMask;
            ao = 0.62 + rib * 0.38;
          } else if (kind === 'window_glass') {
            const blind = Math.sin(v * Math.PI * 26) * 0.5 + 0.5;
            const grad = 0.35 + 0.65 * (1 - v);
            const roomDepth = fbm2D(u * 2.0, v * 2.0, 4, 3, seed + 55);
            h = 0.5 + blind * 0.08;
            mix = (grad * 0.55 + roomDepth * 0.35 - 0.45) + (v < 0.32 ? blind * 0.22 : 0);
            rough = 0.10 + (1 - grad) * 0.12;
            ao = 0.95;
          } else if (kind === 'asphalt') {
            const agg = hash2(x, y, seed + 13);
            h = 0.5 + (agg - 0.5) * 0.32 + (fbm - 0.5) * 0.25;
            const puddle = wetness > 0.1 ? Math.max(0, Math.min(1, (fbm - (0.72 - wetness * 0.35)) * 4.2)) : 0;
            rough = roughness * (1 - puddle) + 0.14 * puddle;
            mix = (agg - 0.5) * 0.2 - puddle * 0.25;
          } else if (kind === 'plaster') {
            const panelSeam = (y % 64 < 2) ? 0.24 : 0;
            const drip = Math.max(0, streak - 0.58) * weathering * (1 - v * 0.42);
            h = 0.56 - panelSeam + fine * 0.14;
            mix = drip * 0.85 + (fbm - 0.5) * 0.26;
            rough = roughness - drip * 0.10;
            ao = panelSeam > 0 ? 0.68 : 0.94 - drip * 0.14;
          } else if (kind === 'sidewalk_paver') {
            const rows = 4, cols = 4;
            const bv = (v * rows) % 1, bu = (u * cols) % 1;
            const joint = bv < 0.035 || bu < 0.035;
            const slabTone = hash2(Math.floor(u * cols), Math.floor(v * rows), seed + 83);
            h = joint ? 0.18 : 0.66 + (slabTone - 0.5) * 0.08 + fine * 0.14;
            mix = joint ? 0.62 : (slabTone - 0.5) * 0.24 + (fbm - 0.5) * 0.22;
            rough = joint ? 0.96 : roughness + (slabTone - 0.5) * 0.10;
            ao = joint ? 0.46 : 0.92 - (fbm * 0.08);
          } else if (kind === 'tank_industrial') {
            const weldH = (y % 64 < 2) ? 0.36 : 0;
            const weldV = (x % 128 < 2) ? 0.30 : 0;
            const rivet = ((y % 64 === 4 || y % 64 === 60) && (x % 16 < 2)) ? 0.22 : 0;
            const rustStreak = Math.max(0, streak - 0.62) * weathering * 1.45;
            const panelVar = hash2(Math.floor(u * 2), Math.floor(v * 4), seed + 47);
            h = 0.56 - weldH - weldV + rivet + fine * 0.12;
            mix = rustStreak + weldH * 0.55 + (panelVar - 0.5) * 0.18 + (fbm - 0.5) * 0.22;
            rough = roughness * (1 - rustStreak * 0.5) + 0.92 * (rustStreak * 0.5) + (fine - 0.5) * 0.14;
            ao = (weldH > 0 || weldV > 0) ? 0.56 : 0.92 - rustStreak * 0.20;
          } else if (kind === 'plaster_interior') {
            const fineGrain = (fine - 0.5) * 0.12 + (fbm - 0.5) * 0.10;
            h = 0.55 + fineGrain;
            mix = fineGrain * 0.65;
            rough = roughness + (fine - 0.5) * 0.08;
            ao = 0.94 + (fbm - 0.5) * 0.06;
          }

          const damp = wetness * Math.max(0, 0.7 - fbm * 0.5);
          rough = Math.max(0.10, Math.min(0.98, rough - damp * 0.28));
          heights[idx] = h;

          const t = Math.max(0, Math.min(1, 0.5 + mix));
          const shade = (1 - damp * 0.18) * (0.78 + ao * 0.22);
          const p = idx * 4;
          imgC.data[p] = clamp255((br * (1 - t) + ar * t) * shade);
          imgC.data[p + 1] = clamp255((bg * (1 - t) + ag * t) * shade);
          imgC.data[p + 2] = clamp255((bb * (1 - t) + ab * t) * shade);
          imgC.data[p + 3] = 255;

          const rv = clamp255(rough * 255);
          imgR.data[p] = imgR.data[p + 1] = imgR.data[p + 2] = rv;
          imgR.data[p + 3] = 255;

          const av = clamp255(ao * 255);
          imgA.data[p] = imgA.data[p + 1] = imgA.data[p + 2] = av;
          imgA.data[p + 3] = 255;
        }
      }

      for (let y = 0; y < size; y++) {
        const ym = (y - 1 + size) % size, yp = (y + 1) % size;
        for (let x = 0; x < size; x++) {
          const xm = (x - 1 + size) % size, xp = (x + 1) % size;
          const dx = (heights[y * size + xp] - heights[y * size + xm]) * normalStrength;
          const dy = (heights[yp * size + x] - heights[ym * size + x]) * normalStrength;
          const inv = 1 / Math.hypot(dx, dy, 1);
          const p = (y * size + x) * 4;
          imgN.data[p] = clamp255((-dx * inv * 0.5 + 0.5) * 255);
          imgN.data[p + 1] = clamp255((-dy * inv * 0.5 + 0.5) * 255);
          imgN.data[p + 2] = clamp255((inv * 0.5 + 0.5) * 255);
          imgN.data[p + 3] = 255;
        }
      }

      ctxC.putImageData(imgC, 0, 0);
      ctxR.putImageData(imgR, 0, 0);
      ctxN.putImageData(imgN, 0, 0);
      ctxA.putImageData(imgA, 0, 0);

      const prepTex = (canvas, isColor) => {
        const tex = new THREE.CanvasTexture(canvas);
        if (THREE.RepeatWrapping !== undefined) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        if (tex.repeat?.set) tex.repeat.set(repeat, repeat);
        if (isColor && THREE.SRGBColorSpace && 'colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
        textures.push(tex);
        return tex;
      };

      const map = prepTex(cCol, true);
      const roughnessMap = prepTex(cRgh, false);
      const normalMap = prepTex(cNrm, false);
      const aoMap = prepTex(cAo, false);
      const matOpts = {
        map, roughnessMap, normalMap, aoMap, aoMapIntensity: 0.72,
        roughness: 1.0, metalness,
      };
      if (opts.emissiveHex !== undefined) {
        matOpts.emissive = new THREE.Color(opts.emissiveHex);
        matOpts.emissiveMap = map;
        matOpts.emissiveIntensity = opts.emissiveIntensity ?? 0.45;
      }
      const mat = new THREE.MeshStandardMaterial(matOpts);
      if (opts.nightEmissive) mat.userData.nightEmissive = opts.nightEmissive;
      materials.push(mat);
      cache.set(key, mat);
      return mat;
    }

    const presets = {
      concrete_dry:     { baseHex: 0x7c7f7b, accentHex: 0x5c5f5c, kind: 'concrete', weathering: 0.28, wetness: 0.05, roughness: 0.88, metalness: 0.04, seed: 11, resolution: 256 },
      concrete_wet:     { baseHex: 0x5d615e, accentHex: 0x3b3f3d, kind: 'concrete', weathering: 0.45, wetness: 0.58, roughness: 0.72, metalness: 0.06, seed: 22, resolution: 256 },
      concrete_aged:    { baseHex: 0x74736c, accentHex: 0x4c4b45, kind: 'concrete_cracked', weathering: 0.55, wetness: 0.22, roughness: 0.86, metalness: 0.04, seed: 33, resolution: 512 },
      sidewalk_paver:   { baseHex: 0x8a8c88, accentHex: 0x555855, kind: 'sidewalk_paver', weathering: 0.44, wetness: 0.28, roughness: 0.84, metalness: 0.04, seed: 37, resolution: 512, normalStrength: 2.8 },
      tank_industrial:  { baseHex: 0xc8cbc6, accentHex: 0x6f5542, kind: 'tank_industrial', weathering: 0.58, wetness: 0.18, roughness: 0.52, metalness: 0.34, seed: 39, resolution: 512, normalStrength: 2.6 },
      plaster_interior: { baseHex: 0x9fa39e, accentHex: 0x7c827e, kind: 'plaster_interior', weathering: 0.18, wetness: 0.0, roughness: 0.88, metalness: 0.02, seed: 41, resolution: 256, normalStrength: 1.2 },
      brick_red:        { baseHex: 0x7e483a, accentHex: 0x4a342c, kind: 'brick', weathering: 0.55, wetness: 0.18, roughness: 0.86, metalness: 0.04, seed: 44, resolution: 512 },
      brick_coastal:    { baseHex: 0x6d5548, accentHex: 0x403732, kind: 'brick', weathering: 0.62, wetness: 0.25, roughness: 0.88, metalness: 0.04, seed: 55, resolution: 512 },
      roof_tile:        { baseHex: 0x7f4432, accentHex: 0x4e291e, kind: 'roof_tile', weathering: 0.50, wetness: 0.22, roughness: 0.78, metalness: 0.05, seed: 59, resolution: 512, normalStrength: 3.2 },
      granite:          { baseHex: 0x898a84, accentHex: 0x595b57, kind: 'granite', weathering: 0.42, wetness: 0.15, roughness: 0.80, metalness: 0.06, seed: 62, resolution: 512 },
      wood_timber:      { baseHex: 0x6b4e38, accentHex: 0x3e2d1f, kind: 'wood', weathering: 0.58, wetness: 0.20, roughness: 0.84, metalness: 0.03, seed: 64, resolution: 256 },
      plaster_cream:    { baseHex: 0x9b9587, accentHex: 0x69645a, kind: 'plaster', weathering: 0.46, wetness: 0.18, roughness: 0.84, metalness: 0.03, seed: 66, resolution: 512 },
      plaster_slate:    { baseHex: 0x757f85, accentHex: 0x4a5358, kind: 'plaster', weathering: 0.50, wetness: 0.24, roughness: 0.80, metalness: 0.06, seed: 77, resolution: 512 },
      metal_rusted:     { baseHex: 0x4c565c, accentHex: 0x733a22, kind: 'metal_rusted', weathering: 0.72, wetness: 0.22, roughness: 0.52, metalness: 0.68, seed: 88, resolution: 256 },
      metal_painted:    { baseHex: 0x3a4d59, accentHex: 0x26323a, kind: 'metal_rusted', weathering: 0.35, wetness: 0.20, roughness: 0.46, metalness: 0.58, seed: 99, resolution: 256 },
      corrugated_steel: { baseHex: 0x435058, accentHex: 0x6b3e28, kind: 'corrugated', weathering: 0.52, wetness: 0.24, roughness: 0.56, metalness: 0.55, seed: 105, resolution: 512, normalStrength: 3.4 },
      window_office:    { baseHex: 0x263945, accentHex: 0x698899, kind: 'window_glass', weathering: 0.15, wetness: 0.1, roughness: 0.14, metalness: 0.65, seed: 108, resolution: 256, normalStrength: 0.6 },
      window_lit:       { baseHex: 0xb89054, accentHex: 0xffe0a8, kind: 'window_glass', weathering: 0.08, wetness: 0.0, roughness: 0.20, metalness: 0.18, seed: 109, resolution: 256, normalStrength: 0.5, emissiveHex: 0xffc978, emissiveIntensity: 0.42, nightEmissive: { day: 0.28, night: 1.55 } },
      road_asphalt:     { baseHex: 0x2d3236, accentHex: 0x1b1e21, kind: 'asphalt', weathering: 0.50, wetness: 0.45, roughness: 0.86, metalness: 0.05, seed: 111, resolution: 512 },
      cliff_stone:      { baseHex: 0x545952, accentHex: 0x333732, kind: 'stone', weathering: 0.72, wetness: 0.30, roughness: 0.92, metalness: 0.04, seed: 123, resolution: 512 },
      grass_coastal:    { baseHex: 0x354a33, accentHex: 0x223020, kind: 'concrete', weathering: 0.62, wetness: 0.22, roughness: 0.94, metalness: 0.02, seed: 131, resolution: 256 },
    };

    function get(name, overrideOpts) {
      const key = overrideOpts ? `${name}:${JSON.stringify(overrideOpts)}` : name;
      if (cache.has(key)) return cache.get(key);
      if (!overrideOpts && !presets[name] && worldMats?.get) {
        const nativeHit = worldMats.get(name);
        if (nativeHit) return nativeHit;
      }
      const spec = { ...(presets[name] || presets.concrete_aged), ...(overrideOpts || {}) };
      return bakePBRSet(key, spec);
    }

    function scannedSurface(id) {
      if (cache.has(id)) return cache.get(id);
      const loader = new THREE.TextureLoader();
      function load(file, color) {
        const texture = loader.load('./assets/surfaces/' + id + '/' + file + '.jpg');
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.anisotropy = 4;
        if (color) texture.colorSpace = THREE.SRGBColorSpace;
        textures.push(texture);
        return texture;
      }
      const arm = load('arm',false);
      const mat = new THREE.MeshStandardMaterial({map:load('Diffuse',true),normalMap:load('nor_gl',false),
        roughnessMap:arm,aoMap:arm,roughness:1,metalness:0});
      materials.push(mat); cache.set(id,mat);
      return mat;
    }
    const metricMaterials = new Map();
    // A unit cube may represent a 90 mm mullion or a 20 m wall within the same draw.
    function forInstancedBoxes(source) {
      if (!source.map && !source.normalMap && !source.roughnessMap && !source.aoMap) return source;
      if (metricMaterials.has(source)) return metricMaterials.get(source);
      const m = source.clone();
      m.onBeforeCompile = shader => {
        const maps = [['USE_MAP','vMapUv'],['USE_NORMALMAP','vNormalMapUv'],
          ['USE_ROUGHNESSMAP','vRoughnessMapUv'],['USE_AOMAP','vAoMapUv']];
        const scaleUvs = maps.map(([flag, varying]) =>
          '#ifdef ' + flag + '\n' + varying + ' *= meters / 3.0;\n#endif').join('\n');
        shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>',
          `#include <uv_vertex>
          #ifdef USE_INSTANCING
          vec3 dims = vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));
          vec2 meters = abs(normal.x) > .5 ? dims.zy : (abs(normal.y) > .5 ? dims.xz : dims.xy);
          ${scaleUvs}
          #endif`);
      };
      materials.push(m);
      metricMaterials.set(source, m);
      return m;
    }

    function createDecalMaterial(text, subText, bgColor = 'rgba(22,30,36,0.78)', fgColor = '#e9d399') {
      const key = JSON.stringify([text, subText, bgColor, fgColor]);
      if (cache.has(key)) return cache.get(key);
      if (!canBake) {
        const m = new THREE.MeshStandardMaterial({ color: 0x263038, roughness: 0.8 });
        materials.push(m);
        cache.set(key,m);
        return m;
      }
      const c = document.createElement('canvas'); c.width = 512; c.height = 192;
      const ctx = c.getContext?.('2d');
      if (ctx) {
        ctx.fillStyle = bgColor; ctx.fillRect(0, 0, 512, 192);
        ctx.strokeStyle = fgColor; ctx.lineWidth = 6; ctx.strokeRect(10, 10, 492, 172);
        ctx.fillStyle = '#f2f6f8'; ctx.font = 'bold 46px system-ui,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(text, 256, 88);
        ctx.fillStyle = fgColor; ctx.font = '700 24px ui-monospace,monospace';
        ctx.fillText(subText, 256, 142);
        const rng = mulberry32(text.length * 913 + 7);
        ctx.fillStyle = 'rgba(20,24,26,0.28)';
        for (let i = 0; i < 24; i++) ctx.fillRect(rng() * 500, rng() * 185, 6 + rng() * 28, 2 + rng() * 4);
      }
      const tex = new THREE.CanvasTexture(c);
      textures.push(tex);
      const mat = new THREE.MeshBasicMaterial({
        map: tex, transparent: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      });
      materials.push(mat);
      cache.set(key,mat);
      return mat;
    }

    function dispose() {
      for (const t of textures) t.dispose?.();
      for (const m of materials) m.dispose?.();
      cache.clear();
    }

    return { get, scannedSurface, forInstancedBoxes, applyWorldUV, createDecalMaterial, mulberry32, fbm2D, dispose };
  }

  WE.createMaterialLibrary = createMaterialLibrary;
})();
