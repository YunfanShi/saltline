/* WorldEngine/Environment/AtmosphereSystem.js
 * Dynamic GLSL Drifting Cloud Canopy synced with LightingSystem presets.
 * Untextured sky dust Points were removed to prevent translucent grey squares in the sky. */
(() => {
  const WE = (window.WorldEngine = window.WorldEngine || {});

  function createAtmosphereSystem(THREE, parent, updaters) {
    const { Group, Mesh, PlaneGeometry, ShaderMaterial, Color } = THREE;
    const g = new Group();
    g.name = 'world-engine-atmosphere';
    const geos = [];
    const mats = [];

    // Custom GLSL Procedural Drifting Cloud Canopy overhead (y = 148m, zero occlusion of gameplay)
    let cloudMat = null;
    if (typeof PlaneGeometry === 'function' && typeof ShaderMaterial === 'function') {
      const cloudGeo = new PlaneGeometry(1200, 1200, 1, 1);
      geos.push(cloudGeo);
      cloudMat = new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uCloudColor: { value: new Color(0xdce6ee) },
          uShadowColor: { value: new Color(0x6c8090) },
          uOpacity: { value: 0.42 },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uCloudColor;
          uniform vec3 uShadowColor;
          uniform float uOpacity;
          varying vec2 vUv;
          float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float noise(vec2 p) {
            vec2 i = floor(p), f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                       mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
          }
          float fbm(vec2 p) {
            float v = 0.0, a = 0.5;
            for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
            return v;
          }
          void main() {
            vec2 centered = (vUv - 0.5) * 2.0;
            float radial = 1.0 - smoothstep(0.45, 0.98, length(centered));
            vec2 drift = vUv * 5.2 + vec2(uTime * 0.012, uTime * 0.005);
            float n = fbm(drift);
            float cov = smoothstep(0.42, 0.78, n);
            vec3 col = mix(uShadowColor, uCloudColor, smoothstep(0.45, 0.85, n));
            float alpha = cov * radial * uOpacity;
            if (alpha < 0.01) discard;
            gl_FragColor = vec4(col, alpha);
          }
        `,
      });
      mats.push(cloudMat);
      const cloudMesh = new Mesh(cloudGeo, cloudMat);
      cloudMesh.rotation.x = Math.PI / 2;
      cloudMesh.position.set(-95, 148, -35);
      cloudMesh.renderOrder = -1;
      cloudMesh.matrixAutoUpdate = false; cloudMesh.updateMatrix();
      g.add(cloudMesh);
    }

    parent.add(g);

    let clock = 0;
    if (Array.isArray(updaters)) {
      updaters.push(dt => {
        clock += dt;
        if (cloudMat) cloudMat.uniforms.uTime.value = clock;
      });
    }

    function syncPreset(presetId) {
      if (!cloudMat) return;
      if (presetId === 'noon') {
        cloudMat.uniforms.uCloudColor.value.setHex(0xffffff);
        cloudMat.uniforms.uShadowColor.value.setHex(0x9cb9d1);
        cloudMat.uniforms.uOpacity.value = 0.55;
      } else if (presetId === 'sunset') {
        cloudMat.uniforms.uCloudColor.value.setHex(0xffb88c);
        cloudMat.uniforms.uShadowColor.value.setHex(0x6e424a);
        cloudMat.uniforms.uOpacity.value = 0.52;
      } else if (presetId === 'moonlit') {
        cloudMat.uniforms.uCloudColor.value.setHex(0x527399);
        cloudMat.uniforms.uShadowColor.value.setHex(0x162436);
        cloudMat.uniforms.uOpacity.value = 0.36;
      } else {
        cloudMat.uniforms.uCloudColor.value.setHex(0xd4dfe6);
        cloudMat.uniforms.uShadowColor.value.setHex(0x647785);
        cloudMat.uniforms.uOpacity.value = 0.44;
      }
    }

    function dispose() {
      for (const geo of geos) geo.dispose?.();
      for (const m of mats) m.dispose?.();
      g.removeFromParent?.();
    }

    function syncDaylight(p) {
      if (!cloudMat || !p) return;
      cloudMat.uniforms.uCloudColor.value.setHex(p.hemiSky);
      cloudMat.uniforms.uShadowColor.value.setHex(p.fog);
      cloudMat.uniforms.uOpacity.value = .32 + p.hemiInt*.16;
    }
    return { group: g, syncPreset, syncDaylight, dispose };
  }

  WE.createAtmosphereSystem = createAtmosphereSystem;
})();
