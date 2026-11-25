/* WorldEngine/Rendering/LightingSystem.js
 * Procedural PMREM Environment Reflections + ACESFilmic Tone Mapping
 * + High-Visibility Day/Night Cycle Presets (Clear Daylight, Native Harbor, Sunset, Moonlit). */
(() => {
  const WE = (window.WorldEngine = window.WorldEngine || {});

  function createLightingSystem(THREE, world) {
    const { scene, renderer } = world;
    let envRT = null;

    // Configure ACESFilmic tone mapping & soft shadows when real WebGLRenderer is present
    if (renderer) {
      if (THREE.ACESFilmicToneMapping !== undefined && 'toneMapping' in renderer) {
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        if ('toneMappingExposure' in renderer) renderer.toneMappingExposure = 1.06;
      }
      if (renderer.shadowMap && THREE.PCFSoftShadowMap !== undefined) {
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }
    }

    // Bake a lightweight procedural sky-horizon-sea PMREM environment map for crisp metallic/glass reflections
    function buildProceduralEnvMap(topHex, horizonHex, seaHex) {
      if (!renderer || typeof THREE.PMREMGenerator !== 'function' || typeof THREE.Scene !== 'function') return;
      try {
        const pmrem = new THREE.PMREMGenerator(renderer);
        const envScene = new THREE.Scene();
        const skyGeo = new THREE.SphereGeometry(20, 16, 12);
        const pos = skyGeo.attributes.position;
        const cols = [];
        const cTop = new THREE.Color(topHex);
        const cHor = new THREE.Color(horizonHex);
        const cSea = new THREE.Color(seaHex);
        const tmp = new THREE.Color();
        for (let i = 0; i < pos.count; i++) {
          const ny = pos.getY(i) / 20;
          if (ny >= 0) tmp.copy(cHor).lerp(cTop, Math.pow(ny, 0.65));
          else tmp.copy(cHor).lerp(cSea, Math.min(1, -ny * 1.4));
          cols.push(tmp.r, tmp.g, tmp.b);
        }
        skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
        const skyMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide });
        envScene.add(new THREE.Mesh(skyGeo, skyMat));
        if (envRT) envRT.dispose?.();
        envRT = pmrem.fromScene(envScene, 0.04);
        if (scene && !scene.environment) scene.environment = envRT.texture;
        else if (scene) scene.environment = envRT.texture;
        skyGeo.dispose();
        skyMat.dispose();
        pmrem.dispose();
      } catch {}
    }

    const origFogColor = scene?.fog?.color?.getHex?.() ?? 0x768d9e;
    const origFogDensity = typeof scene?.fog?.density === 'number' ? scene.fog.density : 0.0008;

    const presets = [
      {
        id: 'native', zh: '🌊 原版海港光影', en: 'Native Harbor',
        fog: origFogColor, density: Math.min(0.00085, origFogDensity),
        sun: 0xffe0bd, sunInt: 2.45, hemiSky: 0xa8cde6, hemiGnd: 0x4a5459, hemiInt: 1.18,
        envTop: 0x3b6588, envHor: 0x8eaec2, envSea: 0x162d3c, exposure: 1.05,
      },
      {
        id: 'noon', zh: '☀️ 晴朗海湾（高细节无雾）', en: 'Clear Daylight',
        fog: 0x9ec4e2, density: 0.00035,
        sun: 0xfffaf0, sunInt: 3.1, hemiSky: 0xcce6ff, hemiGnd: 0x5c6b73, hemiInt: 1.42,
        envTop: 0x3c84c8, envHor: 0xc2def2, envSea: 0x1a4a66, exposure: 1.12,
      },
      {
        id: 'sunset', zh: '🌇 晚霞黄昏', en: 'Crimson Sunset',
        fog: 0x9e6a56, density: 0.00075,
        sun: 0xffa060, sunInt: 2.65, hemiSky: 0xf4b68e, hemiGnd: 0x47363a, hemiInt: 1.15,
        envTop: 0x423a63, envHor: 0xe69163, envSea: 0x262938, exposure: 1.06,
      },
      {
        id: 'moonlit', zh: '🌙 月夜清晰港', en: 'Moonlit Harbor',
        fog: 0x243952, density: 0.00085,
        sun: 0x9ec4f0, sunInt: 1.95, hemiSky: 0x5e86b8, hemiGnd: 0x253242, hemiInt: 1.08,
        envTop: 0x0d1b30, envHor: 0x2d4a6e, envSea: 0x091624, exposure: 1.0,
      },
    ];

    let currentIdx = 0;

    function applyPreset(idx, silent = false) {
      currentIdx = ((idx % presets.length) + presets.length) % presets.length;
      const p = presets[currentIdx];
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
      if (renderer && 'toneMappingExposure' in renderer) renderer.toneMappingExposure = p.exposure;
      buildProceduralEnvMap(p.envTop, p.envHor, p.envSea);
      if (!silent) world.tactical?.notify?.(`🌤️ 氛围光影已切换：${p.zh}（按 T 键随时切换）`, `🌤️ Atmosphere: ${p.en}`, false, 2.8);
      return p;
    }

    // Initialize subtle PMREM environment reflections immediately for native harbor
    buildProceduralEnvMap(presets[0].envTop, presets[0].envHor, presets[0].envSea);

    function dispose() {
      if (envRT) { envRT.dispose?.(); envRT = null; }
    }

    return {
      presets,
      applyPreset,
      cycle: () => applyPreset(currentIdx + 1),
      get current() { return presets[currentIdx]; },
      get index() { return currentIdx; },
      dispose,
    };
  }

  WE.createLightingSystem = createLightingSystem;
})();
