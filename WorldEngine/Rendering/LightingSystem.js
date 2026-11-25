/* WorldEngine/Rendering/LightingSystem.js
 * Scene-Aware PMREM Environment Reflections (Sky + Solar Disc + East Sea + Distant Skyline)
 * + ACESFilmic Tone Mapping + Continuous Day-Night Solar Arc + Calibrated Daylight & True Night Presets. */
(() => {
  const WE = (window.WorldEngine = window.WorldEngine || {});

  function createLightingSystem(THREE, world) {
    const { scene, renderer } = world;
    let envRT = null;

    if (renderer) {
      if (THREE.ACESFilmicToneMapping !== undefined && 'toneMapping' in renderer) {
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        if ('toneMappingExposure' in renderer) renderer.toneMappingExposure = 1.06;
      }
      if (renderer.shadowMap && THREE.PCFSoftShadowMap !== undefined) {
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }
    }

    // Scene-aware PMREM cubemap: sky gradient + glowing sun/moon disc + East Sea reflection plane + skyline silhouette
    function buildProceduralEnvMap(topHex, horizonHex, seaHex, sunHex = 0xfff2d6, sunElev = 0.55, direction) {
      if (!renderer || typeof THREE.PMREMGenerator !== 'function' || typeof THREE.Scene !== 'function') return;
      try {
        const pmrem = new THREE.PMREMGenerator(renderer);
        const envScene = new THREE.Scene();
        const skyGeo = new THREE.SphereGeometry(24, 20, 14);
        const pos = skyGeo.attributes.position;
        const cols = [];
        const cTop = new THREE.Color(topHex);
        const cHor = new THREE.Color(horizonHex);
        const cSea = new THREE.Color(seaHex);
        const tmp = new THREE.Color();
        for (let i = 0; i < pos.count; i++) {
          const ny = pos.getY(i) / 24;
          if (ny >= 0) tmp.copy(cHor).lerp(cTop, Math.pow(ny, 0.62));
          else tmp.copy(cHor).lerp(cSea, Math.min(1, -ny * 1.55));
          cols.push(tmp.r, tmp.g, tmp.b);
        }
        skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
        const skyMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide });
        envScene.add(new THREE.Mesh(skyGeo, skyMat));

        // Glowing solar/lunar disc in PMREM so glass & water catch crisp specular sun glints!
        const sunGeo = new THREE.SphereGeometry(2.1, 10, 8);
        const sunMat = new THREE.MeshBasicMaterial({ color: sunHex });
        const sunMesh = new THREE.Mesh(sunGeo, sunMat);
        sunMesh.position.copy(direction).multiplyScalar(18);
        envScene.add(sunMesh);

        // Distant coastal city silhouette ring along western horizon of reflection probe
        const bGeo = new THREE.BoxGeometry(1, 1, 1);
        const bMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(horizonHex).multiplyScalar(0.32) });
        for (let i = 0; i < 10; i++) {
          const ang = Math.PI * 0.58 + (i / 9) * Math.PI * 0.84;
          const b = new THREE.Mesh(bGeo, bMat);
          const bh = 2.2 + ((i * 7) % 5) * 0.9;
          b.scale.set(2.4, bh, 2.4);
          b.position.set(Math.cos(ang) * 18, bh * 0.4 - 1.2, Math.sin(ang) * 18);
          envScene.add(b);
        }

        if (envRT) envRT.dispose?.();
        envRT = pmrem.fromScene(envScene, 0.035);
        if (scene) scene.environment = envRT.texture;
        skyGeo.dispose(); skyMat.dispose();
        sunGeo.dispose(); sunMat.dispose();
        bGeo.dispose(); bMat.dispose();
        pmrem.dispose();
      } catch {}
    }

    const origFogColor = scene?.fog?.color?.getHex?.() ?? 0x768d9e;
    const origFogDensity = typeof scene?.fog?.density === 'number' ? scene.fog.density : 0.0008;

    const presets = [
      {
        id: 'native', zh: '🌊 原版海港光影', en: 'Native Harbor', hour: 9.5,
        fog: origFogColor, density: Math.min(0.00078, origFogDensity),
        sun: 0xffe2c2, sunInt: 2.55, hemiSky: 0xa8cde6, hemiGnd: 0x4a5459, hemiInt: 1.18,
        envTop: 0x3b6588, envHor: 0x8eaec2, envSea: 0x162d3c, sunElev: 0.48, exposure: 1.05,
      },
      {
        id: 'noon', zh: '☀️ 晴朗海湾（高细节无雾）', en: 'Clear Daylight', hour: 13.0,
        fog: 0xa2c8e6, density: 0.00028,
        sun: 0xfffbf2, sunInt: 3.15, hemiSky: 0xd0e9ff, hemiGnd: 0x5c6b73, hemiInt: 1.40,
        envTop: 0x357ec7, envHor: 0xc5e1f5, envSea: 0x194966, sunElev: 0.92, exposure: 1.10,
      },
      {
        id: 'sunset', zh: '🌇 晚霞黄昏', en: 'Crimson Sunset', hour: 18.2,
        fog: 0x9c6754, density: 0.00068,
        sun: 0xff9a54, sunInt: 2.65, hemiSky: 0xf4b68e, hemiGnd: 0x453438, hemiInt: 1.12,
        envTop: 0x3f3761, envHor: 0xe68d5e, envSea: 0x222536, sunElev: 0.16, exposure: 1.04,
      },
      {
        id: 'moonlit', zh: '🌙 真实夜色港', en: 'True Night Harbor', hour: 23.0,
        fog: 0x0e1a2b, density: 0.00072,
        sun: 0x86b2e6, sunInt: 1.32, hemiSky: 0x3b5880, hemiGnd: 0x141e2b, hemiInt: 0.72,
        envTop: 0x07101f, envHor: 0x1b304d, envSea: 0x060d18, sunElev: 0.62, exposure: 0.98,
      },
    ];

    let currentIdx = 0;
    let timeOfDay = presets[0].hour;

    const dayKeys = [{ ...presets[3], hour: 4.3 }, ...presets];
    const previousEnvironment = scene?.environment;
    let lights = null, skyUniforms = null, cachedSceneChildCount = -1, reflectionSlot, elapsed = 0;
    const dynamicLights = [];
    const emissiveMats = [];
    const mixed = new THREE.Color(), other = new THREE.Color();
    const blendColor = (a, b, t) => mixed.setHex(a).lerp(other.setHex(b), t).getHex();

    function invalidateLightCache() {
      lights = null;
      skyUniforms = null;
      cachedSceneChildCount = -1;
    }

    function registerDynamicLight(light, { dayIntensity = 0, nightIntensity = 14 } = {}) {
      if (!light) return null;
      const rec = { light, dayIntensity, nightIntensity };
      dynamicLights.push(rec);
      return rec;
    }

    function registerEmissiveMaterial(mat, { day = 0.28, night = 1.55 } = {}) {
      if (!mat) return null;
      const rec = { mat, day, night };
      emissiveMats.push(rec);
      return rec;
    }

    function computeNightFactor(hour) {
      if (hour >= 20.0 || hour < 5.0) return 1.0;
      if (hour >= 17.5 && hour < 20.0) return (hour - 17.5) / 2.5;
      if (hour >= 5.0 && hour < 7.5) return 1.0 - (hour - 5.0) / 2.5;
      return 0.0;
    }

    function syncSceneLightCache() {
      const childCount = scene?.children?.length ?? 0;
      const stale = !lights || childCount !== cachedSceneChildCount || lights.some(l => !l.parent);
      if (!stale) return;
      lights = [];
      skyUniforms = [];
      cachedSceneChildCount = childCount;
      scene?.traverse?.(node => {
        if (node.isDirectionalLight || node.isHemisphereLight) lights.push(node);
        const u = node.material?.uniforms;
        if (u?.uZen && u.uHor) skyUniforms.push(u);
      });
    }

    function setTimeOfDay(hour) {
      timeOfDay = (hour % 24 + 24) % 24;
      let end = dayKeys.findIndex(p => p.hour > timeOfDay);
      if (end < 0) end = 0;
      const a = dayKeys[(end + dayKeys.length - 1) % dayKeys.length], b = dayKeys[end];
      const t = ((timeOfDay - a.hour + 24) % 24) / ((b.hour - a.hour + 24) % 24);
      const p = {};
      for (const key of ['sun', 'fog', 'hemiSky', 'hemiGnd', 'envTop', 'envHor', 'envSea'])
        p[key] = blendColor(a[key], b[key], t);
      for (const key of ['density', 'sunInt', 'hemiInt', 'exposure', 'sunElev'])
        p[key] = a[key] + (b[key] - a[key]) * t;
      const rain = Math.max(0, Math.min(1, world.ground?.rainLevel ?? 0));
      p.sunInt *= 1 - .25 * rain;
      p.density += rain * .00016;
      p.hemiInt *= 1 - .08 * rain;
      syncSceneLightCache();
      const az = (timeOfDay - 6) * Math.PI / 12 - Math.PI * .35;
      const dir = new THREE.Vector3(Math.cos(az) * Math.cos(p.sunElev), Math.sin(p.sunElev), Math.sin(az) * Math.cos(p.sunElev));
      for (const light of lights) {
        if (light.isDirectionalLight) {
          light.position.copy(dir).multiplyScalar(110);
          light.color.setHex(p.sun); light.intensity = p.sunInt;
        } else {
          light.color.setHex(p.hemiSky); light.groundColor.setHex(p.hemiGnd); light.intensity = p.hemiInt;
        }
      }
      const nightFactor = computeNightFactor(timeOfDay);
      for (let i = dynamicLights.length - 1; i >= 0; i--) {
        const dl = dynamicLights[i];
        if (!dl.light.parent) { dynamicLights.splice(i, 1); continue; }
        dl.light.intensity = dl.dayIntensity + (dl.nightIntensity - dl.dayIntensity) * nightFactor;
      }
      for (const em of emissiveMats) {
        if ('emissiveIntensity' in em.mat) {
          em.mat.emissiveIntensity = em.day + (em.night - em.day) * nightFactor;
        }
      }
      for (const u of skyUniforms) {
        u.uZen.value.setHex(p.envTop); u.uHor.value.setHex(p.envHor);
        u.uHorAway?.value.setHex(p.fog); u.uSunDir?.value.copy(dir); u.uSunCol?.value.setHex(p.sun);
      }
      if (scene?.fog) {
        scene.fog.color.setHex(p.fog);
        if ('density' in scene.fog) scene.fog.density = p.density;
      }
      if (renderer) renderer.toneMappingExposure = p.exposure;
      const slot = Math.floor(timeOfDay * 2);
      if (reflectionSlot !== slot) {
        buildProceduralEnvMap(p.envTop, p.envHor, p.envSea, p.sun, p.sunElev, dir);
        reflectionSlot = slot;
      }
      p.nightFactor = nightFactor;
      return p;
    }
    function applyPreset(idx, silent = false) {
      currentIdx = ((idx % presets.length) + presets.length) % presets.length;
      const p = presets[currentIdx];
      setTimeOfDay(p.hour);
      if (!silent) world.tactical?.notify?.(p.zh, p.en, false, 2.8);
      return p;
    }
    function advance(dt) {
      elapsed += dt;
      if (elapsed < .5) return;
      const p = setTimeOfDay(timeOfDay + elapsed / 150);
      elapsed = 0;
      return p;
    }

    function dispose() {
      dynamicLights.length = 0;
      emissiveMats.length = 0;
      invalidateLightCache();
      if (scene?.environment === envRT?.texture && scene) scene.environment = previousEnvironment;
      if (envRT) { envRT.dispose?.(); envRT = null; }
    }

    return {
      presets,
      applyPreset,
      cycle: () => applyPreset(currentIdx + 1),
      setTimeOfDay, advance,
      invalidateLightCache,
      registerDynamicLight,
      registerEmissiveMaterial,
      get current() { return presets[currentIdx]; },
      get index() { return currentIdx; },
      get timeOfDay() { return timeOfDay; },
      dispose,
    };
  }

  WE.createLightingSystem = createLightingSystem;
})();
