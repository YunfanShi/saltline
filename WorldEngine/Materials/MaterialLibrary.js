/* WorldEngine/Materials/MaterialLibrary.js
 * Procedural PBR Material Library & Decal System for Saltline Open World.
 * Generates deterministic FBM + Voronoi Albedo, Sobel Normal, and Roughness maps
 * with configurable weathering, wetness, and zero-flicker DecalSystem support. */
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

  function hexToRgb(hex) {
    return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
  }

  function clamp255(v) { return v < 0 ? 0 : (v > 255 ? 255 : v | 0); }

  function createMaterialLibrary(THREE, worldMats) {
    const cache = new Map();
    const textures = [];
    const materials = [];
    const canBake = typeof document !== 'undefined' && typeof THREE.CanvasTexture === 'function';

    function bakePBRSet(key, opts) {
      const {
        baseHex = 0x6f7370, accentHex = 0x4b4e4b, kind = 'concrete',
        weathering = 0.45, wetness = 0.25, roughness = 0.84, metalness = 0.08,
        repeat = 1, seed = 101, normalStrength = 2.4,
      } = opts;
      if (!canBake) {
        const mat = new THREE.MeshStandardMaterial({ color: baseHex, roughness, metalness });
        materials.push(mat);
        return mat;
      }
      const size = 256;
      const cCol = document.createElement('canvas'); cCol.width = cCol.height = size;
      const cRgh = document.createElement('canvas'); cRgh.width = cRgh.height = size;
      const cNrm = document.createElement('canvas'); cNrm.width = cNrm.height = size;
      const ctxC = cCol.getContext?.('2d');
      const ctxR = cRgh.getContext?.('2d');
      const ctxN = cNrm.getContext?.('2d');
      if (!ctxC || !ctxR || !ctxN) {
        const mat = new THREE.MeshStandardMaterial({ color: baseHex, roughness, metalness });
        materials.push(mat);
        return mat;
      }
      const imgC = ctxC.createImageData(size, size);
      const imgR = ctxR.createImageData(size, size);
      const imgN = ctxN.createImageData(size, size);
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

          if (kind === 'brick') {
            const rows = 12, cols = 6;
            const row = Math.floor(v * rows);
            const bv = (v * rows) % 1;
            const bu = ((u * cols) + (row % 2 ? 0.5 : 0)) % 1;
            const mortar = bv < 0.11 || bu < 0.065;
            const tileTone = hash2(Math.floor((u * cols + (row % 2 ? 0.5 : 0)) % cols), row, seed + 19);
            if (mortar) {
              h = 0.18 + fine * 0.1;
              mix = 0.65;
              rough = 0.94;
            } else {
              h = 0.65 + (tileTone - 0.5) * 0.12 + fine * 0.18;
              mix = (tileTone - 0.5) * 0.45 + (streak - 0.5) * weathering * 0.5;
              rough = roughness + (tileTone - 0.5) * 0.12;
            }
          } else if (kind === 'concrete_cracked' || kind === 'stone') {
            const edge = voronoiEdge2D(u, v, kind === 'stone' ? 6 : 4, seed + 41);
            const crack = edge < 0.045 ? (1 - edge / 0.045) : 0;
            h -= crack * 0.55;
            mix += crack * 0.65;
            rough += crack * 0.18;
          } else if (kind === 'metal_rusted') {
            const rustMask = Math.max(0, Math.min(1, (fbm + streak * 0.45 - (0.95 - weathering * 0.55)) * 2.8));
            const seam = (y % 64 < 2 || x % 128 < 2) ? 0.35 : 0;
            h = 0.55 - seam + rustMask * 0.25 + fine * 0.1;
            mix = rustMask;
            rough = roughness * (1 - rustMask) + 0.92 * rustMask;
          } else if (kind === 'asphalt') {
            const agg = hash2(x, y, seed + 13);
            h = 0.5 + (agg - 0.5) * 0.32 + (fbm - 0.5) * 0.25;
            const puddle = wetness > 0.1 ? Math.max(0, Math.min(1, (fbm - (0.72 - wetness * 0.35)) * 4.2)) : 0;
            rough = roughness * (1 - puddle) + 0.14 * puddle;
            mix = (agg - 0.5) * 0.2 - puddle * 0.25;
          } else if (kind === 'plaster') {
            const panelSeam = (y % 64 < 2) ? 0.28 : 0;
            const drip = Math.max(0, streak - 0.55) * weathering * (1 - v * 0.35);
            h = 0.55 - panelSeam + fine * 0.16;
            mix = drip * 1.15 + (fbm - 0.5) * 0.35;
            rough = roughness - drip * 0.12;
          } else if (kind === 'corrugated') {
            const rib = Math.sin(u * Math.PI * 32) * 0.5 + 0.5;
            const boltRow = (y % 64 < 3) ? 0.25 : 0;
            const rustMask = Math.max(0, Math.min(1, (fbm + streak * 0.4 - 0.78) * 3.0)) * weathering;
            h = 0.28 + rib * 0.52 - boltRow + fine * 0.08;
            mix = rustMask * 0.85 + (1 - rib) * 0.18;
            rough = roughness * (1 - rustMask) + 0.90 * rustMask;
          } else if (kind === 'window_glass') {
            const blind = Math.sin(v * Math.PI * 26) * 0.5 + 0.5;
            const grad = 0.35 + 0.65 * (1 - v);
            const roomDepth = fbm2D(u * 2.0, v * 2.0, 4, 3, seed + 55);
            h = 0.5 + blind * 0.08;
            mix = (grad * 0.55 + roomDepth * 0.35 - 0.45) + (v < 0.32 ? blind * 0.22 : 0);
            rough = 0.10 + (1 - grad) * 0.12;
          }

          // Coastal dampness lowers roughness and darkens albedo slightly
          const damp = wetness * Math.max(0, 0.7 - fbm * 0.5);
          rough = Math.max(0.12, Math.min(0.98, rough - damp * 0.28));
          heights[idx] = h;

          const t = Math.max(0, Math.min(1, 0.5 + mix));
          const shade = 1 - damp * 0.18;
          const p = idx * 4;
          imgC.data[p] = clamp255((br * (1 - t) + ar * t) * shade);
          imgC.data[p + 1] = clamp255((bg * (1 - t) + ag * t) * shade);
          imgC.data[p + 2] = clamp255((bb * (1 - t) + ab * t) * shade);
          imgC.data[p + 3] = 255;

          const rv = clamp255(rough * 255);
          imgR.data[p] = imgR.data[p + 1] = imgR.data[p + 2] = rv;
          imgR.data[p + 3] = 255;
        }
      }

      // Sobel height-to-normal baking
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

      const prepTex = (canvas, isColor) => {
        const tex = new THREE.CanvasTexture(canvas);
        if (THREE.RepeatWrapping !== undefined) {
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        }
        if (tex.repeat?.set) tex.repeat.set(repeat, repeat);
        if (isColor && THREE.SRGBColorSpace && 'colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
        textures.push(tex);
        return tex;
      };

      const map = prepTex(cCol, true);
      const roughnessMap = prepTex(cRgh, false);
      const normalMap = prepTex(cNrm, false);
      const mat = new THREE.MeshStandardMaterial({
        map, roughnessMap, normalMap,
        roughness: 1.0,
        metalness,
      });
      materials.push(mat);
      cache.set(key, mat);
      return mat;
    }

    const presets = {
      concrete_dry: { baseHex: 0x7a7d79, accentHex: 0x5c5f5c, kind: 'concrete', weathering: 0.35, wetness: 0.05, roughness: 0.88, metalness: 0.04, seed: 11 },
      concrete_wet: { baseHex: 0x5d615e, accentHex: 0x3b3f3d, kind: 'concrete', weathering: 0.55, wetness: 0.65, roughness: 0.72, metalness: 0.06, seed: 22 },
      concrete_aged: { baseHex: 0x6f6e67, accentHex: 0x45443e, kind: 'concrete_cracked', weathering: 0.68, wetness: 0.25, roughness: 0.88, metalness: 0.04, seed: 33 },
      brick_red: { baseHex: 0x7b473a, accentHex: 0x4a342c, kind: 'brick', weathering: 0.55, wetness: 0.18, roughness: 0.86, metalness: 0.04, seed: 44 },
      brick_coastal: { baseHex: 0x6b5447, accentHex: 0x403732, kind: 'brick', weathering: 0.62, wetness: 0.25, roughness: 0.88, metalness: 0.04, seed: 55 },
      plaster_cream: { baseHex: 0x9b9587, accentHex: 0x69645a, kind: 'plaster', weathering: 0.52, wetness: 0.20, roughness: 0.84, metalness: 0.03, seed: 66 },
      plaster_slate: { baseHex: 0x778085, accentHex: 0x4c5459, kind: 'plaster', weathering: 0.58, wetness: 0.28, roughness: 0.80, metalness: 0.06, seed: 77 },
      metal_rusted: { baseHex: 0x4c565c, accentHex: 0x733a22, kind: 'metal_rusted', weathering: 0.72, wetness: 0.22, roughness: 0.52, metalness: 0.68, seed: 88 },
      metal_painted: { baseHex: 0x3a4d59, accentHex: 0x26323a, kind: 'metal_rusted', weathering: 0.35, wetness: 0.20, roughness: 0.46, metalness: 0.58, seed: 99 },
      corrugated_steel: { baseHex: 0x435058, accentHex: 0x6b3e28, kind: 'corrugated', weathering: 0.52, wetness: 0.24, roughness: 0.56, metalness: 0.55, seed: 105, normalStrength: 3.4 },
      window_office: { baseHex: 0x263945, accentHex: 0x698899, kind: 'window_glass', weathering: 0.15, wetness: 0.1, roughness: 0.14, metalness: 0.62, seed: 108, normalStrength: 0.6 },
      window_lit: { baseHex: 0x9c7b48, accentHex: 0xf2d29b, kind: 'window_glass', weathering: 0.1, wetness: 0.0, roughness: 0.22, metalness: 0.22, seed: 109, normalStrength: 0.5 },
      road_asphalt: { baseHex: 0x2d3236, accentHex: 0x1b1e21, kind: 'asphalt', weathering: 0.50, wetness: 0.45, roughness: 0.86, metalness: 0.05, seed: 111 },
      cliff_stone: { baseHex: 0x545952, accentHex: 0x333732, kind: 'stone', weathering: 0.72, wetness: 0.30, roughness: 0.92, metalness: 0.04, seed: 123 },
    };

    function get(name, overrideOpts) {
      const key = overrideOpts ? `${name}:${JSON.stringify(overrideOpts)}` : name;
      if (cache.has(key)) return cache.get(key);
      if (!overrideOpts && worldMats?.get) {
        const nativeHit = worldMats.get(name);
        if (nativeHit) return nativeHit;
      }
      const spec = { ...(presets[name] || presets.concrete_aged), ...(overrideOpts || {}) };
      return bakePBRSet(key, spec);
    }

    // DecalSystem: weathered industrial stencil / grime streak decals with polygonOffset (ZERO Z-fighting!)
    function createDecalMaterial(text, subText, bgColor = 'rgba(22,30,36,0.78)', fgColor = '#e9d399') {
      if (!canBake) {
        const m = new THREE.MeshStandardMaterial({ color: 0x263038, roughness: 0.8 });
        materials.push(m);
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
        // Subtle weathering scratches
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
      return mat;
    }

    function dispose() {
      for (const t of textures) t.dispose?.();
      for (const m of materials) m.dispose?.();
      cache.clear();
    }

    return { get, createDecalMaterial, mulberry32, fbm2D, dispose };
  }

  WE.createMaterialLibrary = createMaterialLibrary;
})();
