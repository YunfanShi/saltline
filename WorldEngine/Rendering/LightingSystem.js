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
    function buildProceduralEnvMap(topHex, horizonHex, seaHex, sunHex = 0xfff2d6, sunElev = 0.55) {
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
        sunMesh.position.set(16 * Math.cos(sunElev), 16 * Math.sin(sunElev), -9);
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
        fog: 0x0f1a29, density: 0.00078,
        sun: 0x7aa4d6, sunInt: 1.05, hemiSky: 0x334d70, hemiGnd: 0x111924, hemiInt: 0.58,
        envTop: 0x060d18, envHor: 0x172840, envSea: 0x050b14, sunElev: 0.62, exposure: 0.90,
      },
    ];

    let currentIdx = 0;
    let timeOfDay = presets[0].hour;

    function applySunAngle(hour) {
      if (!scene) return;
      const elev = Math.max(0.14, Math.sin(((hour - 6) / 12) * Math.PI) * 1.15);
      const azim = ((hour - 6) / 12) * Math.PI - Math.PI * 0.35;
      scene.traverse?.(obj => {
        if (obj.isDirectionalLight && obj.position?.set) {
          obj.position.set(Math.cos(azim) * 95, Math.max(22, Math.sin(elev) * 110), Math.sin(azim) * 95);
        }
      });
    }

    function applyPreset(idx, silent = false) {
      currentIdx = ((idx % presets.length) + presets.length) % presets.length;
      const p = presets[currentIdx];
      timeOfDay = p.hour;
      if (scene) {
        if (scene.fog) {
          scene.fog.color?.setHex?.(p.fog);
          if (typeof scene.fog.density === 'number') scene.fog.density = p.density;
        }
        scene.traverse?.(obj => {
          if (obj.isDirectionalLight) { obj.color?.setHex?.(p.sun); obj.intensity = p.sunInt; }
          else if (obj.isHemisphereLight) { obj.color?.setHex?.(p.hemiSky); obj.groundColor?.setHex?.(p.hemiGnd); obj.intensity = p.hemiInt; }
        });
      }
      applySunAngle(timeOfDay);
      if (renderer && 'toneMappingExposure' in renderer) renderer.toneMappingExposure = p.exposure;
      buildProceduralEnvMap(p.envTop, p.envHor, p.envSea, p.sun, p.sunElev);
      if (!silent) world.tactical?.notify?.(`🌤️ 氛围光影已切换：${p.zh}（按 T 键随时切换）`, `🌤️ Atmosphere: ${p.en}`, false, 2.8);
      return p;
    }

    buildProceduralEnvMap(presets[0].envTop, presets[0].envHor, presets[0].envSea, presets[0].sun, presets[0].sunElev);

    function dispose() {
      if (envRT) { envRT.dispose?.(); envRT = null; }
    }

    return {
      presets,
      applyPreset,
      cycle: () => applyPreset(currentIdx + 1),
      setTimeOfDay(hour) {
        timeOfDay = ((Number(hour) || 0) % 24 + 24) % 24;
        if (timeOfDay >= 20 || timeOfDay < 5.5) return applyPreset(3, true);
        if (timeOfDay >= 16.5) return applyPreset(2, true);
        if (timeOfDay >= 11 && timeOfDay < 16.5) return applyPreset(1, true);
        return applyPreset(0, true);
      },
      get current() { return presets[currentIdx]; },
      get index() { return currentIdx; },
      get timeOfDay() { return timeOfDay; },
      dispose,
    };
  }

  WE.createLightingSystem = createLightingSystem;
})();
