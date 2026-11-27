/* SALTLINE — 5 Truly Independent Large-Scale Multiplayer Maps (360m × 320m)
 * Built with WorldEngine MaterialLibrary (PBR textures), BuildingGenerator (9 architectural archetypes),
 * and continuous displaced terrain meshes — ZERO boxy placeholder cubes!
 *
 * Maps (with backward-compatible aliases for legacy IDs):
 *   1. coastal_metropolis (alias: coastal_quarter)    — Modern Coastal Metropolis (360×320m)
 *   2. iron_harbor        (alias: port_rail)          — Large Port & Railway Hub (360×320m)
 *   3. highland_passage   (alias: mountain_forest)    — Mountain & Forest Valley Passage (360×320m)
 *   4. old_saltline       (alias: old_harbor)         — Dense Historic Quarter (360×320m)
 *   5. industrial_coast   (alias: coastal_industrial) — Heavy Coastal Industrial Works (360×320m) */
(() => {
  'use strict';

  const MAP_BOUNDS = Object.freeze({ width: 360, depth: 320 });

  const MAP_ALIASES = Object.freeze({
    coastal_quarter: 'coastal_metropolis',
    port_rail: 'iron_harbor',
    mountain_forest: 'highland_passage',
    old_harbor: 'old_saltline',
    coastal_industrial: 'industrial_coast',
  });

  function highlandElevation(x, z) {
    // Smooth continuous coastal valley rising from SW (-160, +130, y≈1.5m) to NE (+140, -120, y≈15.5m)
    const slope = Math.max(0, Math.min(1, ((x + 150) * 0.55 + (130 - z) * 0.45) / 280));
    const ridge = Math.sin(x * 0.022) * Math.cos(z * 0.024) * 2.6;
    const knoll = Math.sin((x + z) * 0.04) * 0.85;
    return Number((1.2 + slope * 13.8 + ridge + knoll).toFixed(2));
  }

  const MP_MAPS = Object.freeze([
    {
      id: 'coastal_metropolis', legacyId: 'coastal_quarter',
      nameEn: 'Coastal Metropolis', nameZh: '沿海大都市 · Coastal Metropolis',
      descEn: 'Large 360×320m coastal skyline built with WorldEngine architectural towers, commercial arcades, civic fountain plaza, glass skybridges & waterfront promenade.',
      descZh: '独立构建的 360×320m 大型沿海都市：采用 WorldEngine 建筑引擎打造现代办公塔楼、商业拱廊、中央喷泉广场、高空连廊与东海观景大道。',
      bounds: MAP_BOUNDS,
      skyPreset: 1, weather: 'clear', accent: '#38bdf8',
      spawns: { blue: [-136, 0.3, -86], red: [136, 0.3, 86], coop: [-136, 0.3, 0] },
      objectives: [
        { id: 'cm_a', short: 'A', labelZh: '西区商业拱廊', pos: [-78, 0.3, -48] },
        { id: 'cm_b', short: 'B', labelZh: '中央喷泉广场', pos: [0, 0.3, 0] },
        { id: 'cm_c', short: 'C', labelZh: '滨海玻璃塔楼', pos: [74, 0.3, -38] },
        { id: 'cm_d', short: 'D', labelZh: '南湾海景住宅区', pos: [-34, 0.3, 82] },
        { id: 'cm_e', short: 'E', labelZh: '东海观景长廊', pos: [104, 0.3, 56] },
      ],
      previewSvg: `<rect width="160" height="100" fill="#0b1824"/><rect x="128" y="0" width="32" height="100" fill="#0d3552"/><rect x="14" y="14" width="32" height="26" rx="2" fill="#2c4a63" stroke="#60a5fa"/><rect x="58" y="12" width="28" height="28" rx="2" fill="#33536e"/><rect x="96" y="14" width="24" height="32" rx="2" fill="#3b6382"/><rect x="16" y="56" width="36" height="30" rx="2" fill="#294257"/><circle cx="72" cy="56" r="11" fill="#1e3a52" stroke="#38bdf8" stroke-width="1.5"/><line x1="0" y1="48" x2="128" y2="48" stroke="#facc15" stroke-width="2" stroke-dasharray="4 3"/><line x1="52" y1="0" x2="52" y2="100" stroke="#94a3b8" stroke-width="2"/>`,
    },
    {
      id: 'iron_harbor', legacyId: 'port_rail',
      nameEn: 'Iron Harbor', nameZh: '钢铁港与铁路枢纽 · Iron Harbor',
      descEn: 'Large 360×320m freight railway & deepwater port with bonded brick warehouses, sawtooth industrial halls, dual freight trains & overhead gantry cranes.',
      descZh: '独立构建的 360×320m 大型港口与铁路枢纽：双轨货运编组站、锯齿天窗工业厂房、红砖保税仓库、龙门吊栈桥与集装箱巷道。',
      bounds: MAP_BOUNDS,
      skyPreset: 0, weather: 'overcast', accent: '#f59e0b',
      spawns: { blue: [-142, 0.3, 0], red: [142, 0.3, 0], coop: [-142, 0.3, -54] },
      objectives: [
        { id: 'ih_a', short: 'A', labelZh: '西区编组信号楼', pos: [-86, 0.3, -44] },
        { id: 'ih_b', short: 'B', labelZh: '中央货运列车阵', pos: [0, 0.3, 0] },
        { id: 'ih_c', short: 'C', labelZh: '北段龙门吊栈桥', pos: [26, 0.3, -72] },
        { id: 'ih_d', short: 'D', labelZh: '南区集装箱迷宫', pos: [-38, 0.3, 68] },
        { id: 'ih_e', short: 'E', labelZh: '东海深水泊位', pos: [96, 0.3, 28] },
      ],
      previewSvg: `<rect width="160" height="100" fill="#121820"/><rect x="132" y="0" width="28" height="100" fill="#0d3047"/><line x1="68" y1="0" x2="68" y2="100" stroke="#94a3b8" stroke-width="2.5"/><line x1="78" y1="0" x2="78" y2="100" stroke="#94a3b8" stroke-width="2.5"/><rect x="65" y="18" width="16" height="28" rx="2" fill="#dc2626"/><rect x="65" y="54" width="16" height="28" rx="2" fill="#0284c7"/><rect x="16" y="18" width="34" height="14" fill="#9a3412"/><rect x="16" y="42" width="34" height="14" fill="#0f766e"/><rect x="16" y="66" width="34" height="14" fill="#1d4ed8"/><rect x="96" y="24" width="26" height="52" fill="#475569" stroke="#f59e0b"/>`,
    },
    {
      id: 'highland_passage', legacyId: 'mountain_forest',
      nameEn: 'Highland Passage', nameZh: '高地山谷通道 · Highland Passage',
      descEn: 'Large 360×320m sculpted coastal mountain valley with continuous displaced terrain, dense pine forest, coastal residences & summit radar compound.',
      descZh: '独立构建的 360×320m 山区与松林立体地形：连续起伏曲面山地、盘山公路、海岸坡顶民居、密林掩体与山顶雷达通信站。',
      bounds: MAP_BOUNDS,
      skyPreset: 2, weather: 'mist', accent: '#34d399',
      spawns: { blue: [-136, highlandElevation(-136, 84) + 0.4, 84], red: [128, highlandElevation(128, -76) + 0.4, -76], coop: [-136, highlandElevation(-136, 0) + 0.4, 0] },
      objectives: [
        { id: 'hp_a', short: 'A', labelZh: '山脚村镇检查站', pos: [-82, highlandElevation(-82, 48) + 0.4, 48] },
        { id: 'hp_b', short: 'B', labelZh: '松林弯道桥', pos: [-16, highlandElevation(-16, 12) + 0.4, 12] },
        { id: 'hp_c', short: 'C', labelZh: '山腰林场木屋', pos: [36, highlandElevation(36, -20) + 0.4, -20] },
        { id: 'hp_d', short: 'D', labelZh: '北崖通信雷达塔', pos: [88, highlandElevation(88, -52) + 0.4, -52] },
        { id: 'hp_e', short: 'E', labelZh: '东谷护林瞭望台', pos: [72, highlandElevation(72, 56) + 0.4, 56] },
      ],
      previewSvg: `<rect width="160" height="100" fill="#0d1c16"/><path d="M0 90 Q42 52 82 40 T160 12 L160 100 L0 100 Z" fill="#183628"/><path d="M12 86 Q56 68 86 48 T144 20" fill="none" stroke="#cbd5e1" stroke-width="3" stroke-dasharray="5 3"/><circle cx="122" cy="28" r="10" fill="#1e293b" stroke="#34d399" stroke-width="2"/><circle cx="42" cy="64" r="6" fill="#22543d"/><circle cx="66" cy="48" r="7" fill="#22543d"/><circle cx="94" cy="36" r="6" fill="#22543d"/>`,
    },
    {
      id: 'old_saltline', legacyId: 'old_harbor',
      nameEn: 'Old Saltline', nameZh: '老盐线历史城区 · Old Saltline',
      descEn: 'Large 360×320m historic brick quarter featuring waterfront rowhouses, harbor courtyard apartments, civic customs clock tower & cobblestone plazas.',
      descZh: '独立构建的 360×320m 历史城区巷战地图：错落海滨联排老宅、U型内院红砖公寓、历史海关钟楼广场与纵横石板巷道。',
      bounds: MAP_BOUNDS,
      skyPreset: 2, weather: 'dusk', accent: '#60a5fa',
      spawns: { blue: [-124, 0.3, -72], red: [124, 0.3, 72], coop: [-124, 0.3, 0] },
      objectives: [
        { id: 'os_a', short: 'A', labelZh: '西门红砖拱廊', pos: [-72, 0.3, -28] },
        { id: 'os_b', short: 'B', labelZh: '老城钟楼广场', pos: [0, 0.3, 0] },
        { id: 'os_c', short: 'C', labelZh: '北巷市场庭院', pos: [18, 0.3, -68] },
        { id: 'os_d', short: 'D', labelZh: '南街历史邮局', pos: [-28, 0.3, 64] },
        { id: 'os_e', short: 'E', labelZh: '旧港海防炮台', pos: [84, 0.3, 36] },
      ],
      previewSvg: `<rect width="160" height="100" fill="#1b1815"/><g fill="#5c3d2e" stroke="#a67c52" stroke-width="1"><rect x="14" y="14" width="24" height="22"/><rect x="44" y="14" width="24" height="22"/><rect x="92" y="14" width="24" height="22"/><rect x="122" y="14" width="24" height="22"/><rect x="14" y="64" width="24" height="22"/><rect x="44" y="64" width="24" height="22"/><rect x="92" y="64" width="24" height="22"/><rect x="122" y="64" width="24" height="22"/></g><rect x="68" y="38" width="24" height="24" fill="#3b352e" stroke="#60a5fa" stroke-width="1.5"/><circle cx="80" cy="50" r="5" fill="#fbbf24"/>`,
    },
    {
      id: 'industrial_coast', legacyId: 'coastal_industrial',
      nameEn: 'Industrial Coast', nameZh: '沿海重工带 · Industrial Coast',
      descEn: 'Large 360×320m coastal refinery & engineering complex with sawtooth industrial halls, cryo tank farms, elevated steel pipe catwalks & seawall docks.',
      descZh: '独立构建的 360×320m 沿海重工业区：锯齿天窗精炼厂房、大型低温储罐群、高架钢构管廊、海岸泵房与重型装卸码头。',
      bounds: MAP_BOUNDS,
      skyPreset: 3, weather: 'rain', accent: '#fb7185',
      spawns: { blue: [-138, 0.3, 64], red: [138, 0.3, -64], coop: [-138, 0.3, 0] },
      objectives: [
        { id: 'ic_a', short: 'A', labelZh: '低温储罐群', pos: [-76, 0.3, 36] },
        { id: 'ic_b', short: 'B', labelZh: '中央高架管廊', pos: [0, 4.2, 0] },
        { id: 'ic_c', short: 'C', labelZh: '二号精炼厂房', pos: [-22, 0.3, -64] },
        { id: 'ic_d', short: 'D', labelZh: '南岸抽水泵站', pos: [52, 0.3, 60] },
        { id: 'ic_e', short: 'E', labelZh: '东海装卸栈桥', pos: [96, 0.3, -32] },
      ],
      previewSvg: `<rect width="160" height="100" fill="#14131a"/><rect x="134" y="0" width="26" height="100" fill="#0c283d"/><circle cx="30" cy="30" r="11" fill="#475569" stroke="#fb7185"/><circle cx="58" cy="30" r="11" fill="#475569" stroke="#fb7185"/><circle cx="30" cy="64" r="11" fill="#475569"/><rect x="82" y="18" width="40" height="24" fill="#334155"/><rect x="82" y="56" width="40" height="26" fill="#334155"/><line x1="20" y1="50" x2="126" y2="50" stroke="#f59e0b" stroke-width="4"/>`,
    },
  ]);

  function resolveMapSpec(mapId) {
    const canonical = MAP_ALIASES[mapId] || mapId;
    return MP_MAPS.find(m => m.id === canonical || m.legacyId === mapId) || MP_MAPS[0];
  }

  // Dedicated 3D Builder for Each Independent Large-Scale Multiplayer Map
  // Leverages WorldEngine MaterialLibrary + BuildingGenerator + Displaced Terrain Meshes!
  function createMultiplayerMapLoader(world) {
    const { THREE, scene, physics } = world || {};
    if (!THREE || !scene) {
      return {
        maps: MP_MAPS,
        resolveMapSpec,
        loadMap: id => { const spec = resolveMapSpec(id); return { ...spec, meta: spec, bounds: MAP_BOUNDS, usesWorldEngine: false }; },
        unloadMap: () => {},
        get currentMap() { return null; },
        get colliderCount() { return 0; },
      };
    }
    const { Group, Mesh, BoxGeometry, CylinderGeometry, ConeGeometry, PlaneGeometry, InstancedMesh, Object3D, MeshStandardMaterial, MeshBasicMaterial, Vector3 } = THREE;

    const unitBox = new BoxGeometry(1, 1, 1);
    const unitCyl = new CylinderGeometry(1, 1, 1, 14);
    const unitCone = new ConeGeometry(1, 1, 8);
    let activeRoot = null;
    let activeColliders = [];
    let currentSpec = null;
    let ownedMatLib = null;
    let ownedBldgGen = null;
    let ownedGeos = [];

    function unloadMap() {
      if (activeRoot) {
        activeRoot.traverse(n => {
          if (n.isInstancedMesh) n.dispose?.();
          if (n.material && n.material.userData?.mpMapOwned) n.material.dispose?.();
        });
        activeRoot.removeFromParent();
        activeRoot = null;
      }
      for (const g of ownedGeos.splice(0)) g.dispose?.();
      if (ownedBldgGen) { ownedBldgGen.dispose?.(); ownedBldgGen = null; }
      if (ownedMatLib) { ownedMatLib.dispose?.(); ownedMatLib = null; }
      if (physics?.removeBox) {
        for (const c of activeColliders.splice(0)) physics.removeBox(c);
      } else activeColliders = [];
      currentSpec = null;
    }

    function makeMat(hex, roughness = 0.84, metalness = 0.08) {
      const m = new MeshStandardMaterial({ color: hex, roughness, metalness });
      m.userData.mpMapOwned = true;
      return m;
    }

    function initWorldEngineKit() {
      const WE = (typeof window !== 'undefined' && window.WorldEngine) || null;
      if (!WE?.createMaterialLibrary || !WE?.createBuildingGenerator) return { matLib: null, bldgGen: null };
      ownedMatLib = WE.createMaterialLibrary(THREE, world?.mats, { quality: 'high' });
      const sharedMats = {
        steelDark: makeMat(0x242c32, 0.48, 0.68),
        steelGalv: makeMat(0x7c878e, 0.36, 0.72),
        steelWorn: makeMat(0x4b555c, 0.62, 0.52),
        steelClad: ownedMatLib.get('corrugated_steel'),
        corrugated: ownedMatLib.get('corrugated_steel'),
        brickWeathered: ownedMatLib.get('brick_coastal'),
        concreteDirty: ownedMatLib.get('concrete_aged'),
        smokedPane: ownedMatLib.get('window_office'),
        blindPane: makeMat(0x31404a, 0.42, 0.25),
        slateSteel: ownedMatLib.get('roof_slate'),
        cargoTeal: makeMat(0x1f5f66, 0.66, 0.24),
        cargoNavy: makeMat(0x1e354d, 0.68, 0.22),
        redCore: makeMat(0xe04838, 0.35, 0.15),
        glassWarm: ownedMatLib.get('window_lit'),
      };
      ownedBldgGen = WE.createBuildingGenerator(THREE, ownedMatLib, sharedMats);
      return { matLib: ownedMatLib, bldgGen: ownedBldgGen };
    }

    function createBatchCollector(root) {
      const boxBatches = new Map();
      const dummy = new Object3D();
      const addBox = (mat, x, y, z, w, h, d, { collide = true, surface = 'concrete', ry = 0 } = {}) => {
        dummy.position.set(x, y, z);
        dummy.rotation.set(0, ry, 0);
        dummy.scale.set(w, h, d);
        dummy.updateMatrix();
        let arr = boxBatches.get(mat);
        if (!arr) { arr = []; boxBatches.set(mat, arr); }
        arr.push(dummy.matrix.clone());
        if (collide && physics?.addBox) {
          const b = physics.addBox(
            new Vector3(x - w / 2, y - h / 2, z - d / 2),
            new Vector3(x + w / 2, y + h / 2, z + d / 2),
            { surface, noNav: true }
          );
          if (b) activeColliders.push(b);
        }
      };
      const flush = () => {
        for (const [mat, mats] of boxBatches) {
          const instMat = ownedMatLib?.forInstancedBoxes ? ownedMatLib.forInstancedBoxes(mat) : mat;
          const inst = new InstancedMesh(unitBox, instMat, mats.length);
          for (let i = 0; i < mats.length; i++) inst.setMatrixAt(i, mats[i]);
          inst.instanceMatrix.needsUpdate = true;
          inst.receiveShadow = true;
          root.add(inst);
        }
        boxBatches.clear();
      };
      return { addBox, flush };
    }

    function placeArchitecturalBuilding(root, bldgGen, addBox, fallbackMat, spec) {
      if (bldgGen?.createCoastalBuildingTask) {
        const colSpecs = [];
        const task = bldgGen.createCoastalBuildingTask(root, spec, { colliderTarget: colSpecs });
        while (!task.step()) {}
        if (spec.baseYOffset && task.group) task.group.position.y += spec.baseYOffset;
        if (physics?.addBox) {
          for (const cs of colSpecs) {
            const minV = cs.min.clone();
            const maxV = cs.max.clone();
            if (spec.baseYOffset) { minV.y += spec.baseYOffset; maxV.y += spec.baseYOffset; }
            const b = physics.addBox(minV, maxV, { surface: cs.surface || 'concrete', noNav: true });
            if (b) activeColliders.push(b);
          }
        }
        return task.group;
      }
      addBox(fallbackMat, spec.cx, (spec.baseYOffset || 0) + spec.height / 2, spec.cz, spec.width, spec.height, spec.depth);
      return null;
    }

    function buildObjectiveBeacons(root, spec) {
      const ringMat = new MeshBasicMaterial({ color: spec.accent || '#38bdf8' });
      ringMat.userData.mpMapOwned = true;
      for (const obj of spec.objectives) {
        const [ox, oy, oz] = obj.pos;
        const pole = new Mesh(unitCyl, ringMat);
        pole.position.set(ox, oy + 5.0, oz);
        pole.scale.set(0.16, 10.0, 0.16);
        pole.matrixAutoUpdate = false; pole.updateMatrix();
        root.add(pole);
      }
    }

    function buildHighlandDisplacedTerrain(root, grassMat) {
      if (typeof PlaneGeometry !== 'function') return false;
      const geo = new PlaneGeometry(MAP_BOUNDS.width, MAP_BOUNDS.depth, 48, 44);
      geo.rotateX(-Math.PI / 2);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i), vz = pos.getZ(i);
        pos.setY(i, highlandElevation(vx, vz));
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals?.();
      ownedMatLib?.applyWorldUV?.(geo, 8.0);
      ownedGeos.push(geo);
      const mesh = new Mesh(geo, grassMat);
      mesh.receiveShadow = true;
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      root.add(mesh);
      // Sampled ground collider tiles so players can walk smoothly over the sculpted valley
      if (physics?.addBox) {
        for (let gx = -160; gx <= 160; gx += 40) {
          for (let gz = -140; gz <= 140; gz += 40) {
            const hy = highlandElevation(gx, gz);
            const b = physics.addBox(new Vector3(gx - 20, hy - 3, gz - 20), new Vector3(gx + 20, hy, gz + 20), { surface: 'grass', noNav: true });
            if (b) activeColliders.push(b);
          }
        }
      }
      return true;
    }

    function loadMap(mapId) {
      unloadMap();
      const spec = resolveMapSpec(mapId);
      currentSpec = spec;
      const root = new Group();
      root.name = 'mp-independent-map-' + spec.id;
      const { matLib, bldgGen } = initWorldEngineKit();
      const { addBox, flush } = createBatchCollector(root);

      const asphalt = matLib ? matLib.get('road_asphalt') : makeMat(0x282e33, 0.92, 0.04);
      const paver = matLib ? matLib.get('sidewalk_paver') : makeMat(0x757b80, 0.88, 0.06);
      const concrete = matLib ? matLib.get('concrete_aged') : makeMat(0x757b80, 0.88, 0.06);
      const granite = matLib ? matLib.get('granite') : makeMat(0x888b86, 0.82, 0.06);
      const brick = matLib ? matLib.get('brick_red') : makeMat(0x7a4b3d, 0.88, 0.04);
      const steel = matLib ? matLib.get('metal_rusted') : makeMat(0x3a464f, 0.52, 0.65);
      const tankMat = matLib ? matLib.get('tank_industrial') : makeMat(0xc8d4db, 0.45, 0.35);
      const hazard = makeMat(0xd99b26, 0.5, 0.22);
      const grass = matLib ? matLib.get('grass_coastal') : makeMat(0x2f4d35, 0.94, 0.02);
      const water = makeMat(0x0f3b54, 0.12, 0.56);
      const shallowWater = makeMat(0x1e6b7e, 0.16, 0.42);
      const foamEdge = makeMat(0xc4dce3, 0.72, 0.08);
      const redCont = makeMat(0xa33228, 0.68, 0.24);
      const tealCont = makeMat(0x1f5f66, 0.68, 0.24);

      let buildingCount = 0;
      const addArch = (cfg) => { buildingCount++; return placeArchitecturalBuilding(root, bldgGen, addBox, concrete, cfg); };

      // 360m × 320m Large-Scale Arena Ground + Layered Coastal Water & Shoreline Seawall
      if (spec.id === 'highland_passage') {
        if (!buildHighlandDisplacedTerrain(root, grass)) {
          addBox(grass, 0, -0.1, 0, MAP_BOUNDS.width, 0.4, MAP_BOUNDS.depth, { collide: true });
        }
      } else {
        addBox(asphalt, 0, -0.1, 0, MAP_BOUNDS.width, 0.4, MAP_BOUNDS.depth, { collide: true });
        addBox(paver, 0, 0.14, 0, 340, 0.14, 18, { collide: false });
        addBox(paver, 0, 0.14, 0, 18, 0.14, 300, { collide: false });
        addBox(granite, 179.5, 0.55, 0, 2.2, 1.1, 322, { collide: true });
        addBox(foamEdge, 182.2, -0.22, 0, 3.2, 0.12, 360, { collide: false });
        addBox(shallowWater, 198, -0.28, 0, 30, 0.16, 380, { collide: false });
        addBox(water, 260, -0.36, 0, 110, 0.2, 380, { collide: false });
      }

      if (spec.id === 'coastal_metropolis') {
        addBox(granite, 0, 0.20, 0, 44, 0.24, 44, { collide: true });
        addBox(shallowWater, 0, 0.54, 0, 14, 0.42, 14, { collide: true });
        const layouts = [
          { cx: -86, cz: -64, width: 32, depth: 24, height: 24, styleName: 'modern_office', seed: 11, labelZh: '盐线海事金融中心', labelEn: 'MARITIME TOWER' },
          { cx: -86, cz: 58, width: 30, depth: 24, height: 18, styleName: 'commercial_arcade', seed: 12, withInterior: true, labelZh: '西区商业拱廊', labelEn: 'WEST ARCADE' },
          { cx: 82, cz: -60, width: 30, depth: 26, height: 28, styleName: 'modern_office', seed: 13, labelZh: '东海国际大厦', labelEn: 'EAST SEA PLAZA' },
          { cx: 86, cz: 56, width: 28, depth: 22, height: 20, styleName: 'stepped_mixed_use', seed: 14, labelZh: '滨海艺术中心', labelEn: 'WATERFRONT HALL' },
          { cx: -26, cz: -96, width: 28, depth: 20, height: 16, styleName: 'civic_customs', seed: 15, withInterior: true, labelZh: '市政应急大楼', labelEn: 'CIVIC HQ' },
          { cx: 34, cz: 96, width: 32, depth: 22, height: 21, styleName: 'harbor_apartment', seed: 16 },
          { cx: -124, cz: 4, width: 24, depth: 22, height: 15, styleName: 'waterfront_rowhouses', seed: 17 },
          { cx: 122, cz: 0, width: 26, depth: 20, height: 19, styleName: 'modern_office', seed: 18 },
        ];
        for (const cfg of layouts) addArch(cfg);
        addBox(steel, 0, 6.8, -56, 130, 0.55, 5.2, { collide: true, surface: 'metal' });
        addBox(concrete, -38, 3.8, 72, 26, 0.4, 18, { collide: true });
        for (let r = 0; r < 8; r++) addBox(concrete, -54 + r * 1.1, 0.4 + r * 0.42, 72, 1.4, 0.24, 5.0, { collide: true });
      } else if (spec.id === 'iron_harbor') {
        // Dual Freight Tracks + 6 Freight Cars + 2 Overhead Gantry Cranes + WorldEngine Warehouses & Industrial Halls
        for (const tx of [-8, 8]) addBox(steel, tx, 0.18, 0, 2.0, 0.16, 290, { collide: false });
        for (const tz of [-92, -52, -16, 22, 62, 98]) {
          addBox(tz % 4 === 0 ? redCont : tealCont, -8, 1.9, tz, 3.2, 3.2, 18);
        }
        const layouts = [
          { cx: -92, cz: -66, width: 36, depth: 22, height: 13, styleName: 'bonded_warehouse', seed: 21, labelZh: '一号保税仓库', labelEn: 'BONDED WAREHOUSE 01' },
          { cx: -92, cz: 66, width: 38, depth: 24, height: 12, styleName: 'industrial_hall', seed: 22, labelZh: '西区机车检修厂', labelEn: 'LOCOMOTIVE SHED' },
          { cx: 88, cz: -68, width: 34, depth: 22, height: 13, styleName: 'industrial_hall', seed: 23, labelZh: '北段货运中转库', labelEn: 'NORTH FREIGHT HALL' },
          { cx: 92, cz: 66, width: 32, depth: 22, height: 15, styleName: 'bonded_warehouse', seed: 24, labelZh: '四号泊位港务楼', labelEn: 'BERTH 4 AUTHORITY' },
          { cx: -46, cz: -102, width: 24, depth: 18, height: 14, styleName: 'civic_customs', seed: 25 },
        ];
        for (const cfg of layouts) addArch(cfg);
        for (const [cx, cz, mat] of [
          [-54, -22, redCont], [-54, 18, tealCont], [-34, 52, hazard], [48, -32, tealCont], [52, 24, redCont], [46, -8, hazard],
        ]) {
          addBox(mat, cx, 1.4, cz, 12.2, 2.6, 2.8);
          addBox(steel, cx, 4.0, cz, 12.2, 2.6, 2.8);
        }
        for (const gz of [-44, 38]) {
          for (const gx of [-30, 30]) addBox(hazard, gx, 8.5, gz, 1.8, 17, 2.2);
          addBox(hazard, 0, 17.2, gz, 64, 1.8, 2.6, { collide: false });
        }
      } else if (spec.id === 'highland_passage') {
        // Real Sculpted Valley + Coastal Residences & Summit Radar Compound + 56 Pine Trees
        const layouts = [
          { cx: -86, cz: 54, width: 22, depth: 18, height: 10, styleName: 'coastal_residence', seed: 31, baseYOffset: highlandElevation(-86, 54) - 0.5 },
          { cx: -52, cz: 78, width: 24, depth: 18, height: 10, styleName: 'coastal_residence', seed: 32, baseYOffset: highlandElevation(-52, 78) - 0.5 },
          { cx: 36, cz: -24, width: 24, depth: 18, height: 11, styleName: 'bonded_warehouse', seed: 33, baseYOffset: highlandElevation(36, -24) - 0.6 },
          { cx: 92, cz: -56, width: 26, depth: 20, height: 14, styleName: 'civic_customs', seed: 34, labelZh: '西岸高地雷达站', labelEn: 'HIGHLAND RELAY', baseYOffset: highlandElevation(92, -56) - 0.6 },
        ];
        for (const cfg of layouts) addArch(cfg);
        const treeMat = makeMat(0x1e4028, 0.9, 0.02);
        const trunkMat = makeMat(0x4d3724, 0.9, 0.02);
        for (let i = 0; i < 56; i++) {
          const tx = -148 + (i % 8) * 40 + ((i * 7) % 15) - 7;
          const tz = -124 + Math.floor(i / 8) * 38 + ((i * 11) % 13) - 6;
          const ty = highlandElevation(tx, tz);
          const sc = 0.85 + (i % 4) * 0.22;
          const c = new Mesh(unitCone, treeMat);
          c.position.set(tx, ty + 3.8 * sc, tz); c.scale.set(2.4 * sc, 5.8 * sc, 2.4 * sc);
          c.matrixAutoUpdate = false; c.updateMatrix(); root.add(c);
          const tr = new Mesh(unitCyl, trunkMat);
          tr.position.set(tx, ty + 1.1 * sc, tz); tr.scale.set(0.34 * sc, 2.4 * sc, 0.34 * sc);
          tr.matrixAutoUpdate = false; tr.updateMatrix(); root.add(tr);
        }
      } else if (spec.id === 'old_saltline') {
        // Dense Historic Brick Quarter built with Waterfront Rowhouses, Harbor Apartments, Commercial Arcades & Clock Tower
        addBox(granite, 0, 0.20, 0, 42, 0.24, 42, { collide: true });
        addBox(brick, 0, 10.0, 0, 5.4, 20, 5.4);
        addBox(hazard, 0, 19.2, 0, 6.0, 1.4, 6.0, { collide: false });
        const layouts = [
          { cx: -78, cz: -54, width: 28, depth: 20, height: 14, styleName: 'waterfront_rowhouses', seed: 41 },
          { cx: -78, cz: 54, width: 28, depth: 22, height: 15, styleName: 'harbor_apartment', seed: 42 },
          { cx: 78, cz: -54, width: 28, depth: 20, height: 15, styleName: 'commercial_arcade', seed: 43, labelZh: '老盐线拱廊市集', labelEn: 'OLD ARCADE' },
          { cx: 78, cz: 54, width: 28, depth: 22, height: 14, styleName: 'waterfront_rowhouses', seed: 44 },
          { cx: 0, cz: -88, width: 32, depth: 22, height: 16, styleName: 'civic_customs', seed: 45, labelZh: '旧港海事档案局', labelEn: 'OLD CUSTOMS' },
          { cx: 0, cz: 88, width: 30, depth: 22, height: 15, styleName: 'harbor_apartment', seed: 46 },
          { cx: -116, cz: 0, width: 24, depth: 24, height: 13, styleName: 'coastal_residence', seed: 47 },
          { cx: 116, cz: 0, width: 24, depth: 24, height: 15, styleName: 'stepped_mixed_use', seed: 48 },
        ];
        for (const cfg of layouts) addArch(cfg);
      } else {
        // industrial_coast: Cryo Tank Farm + Elevated Pipe Catwalks + WorldEngine Sawtooth Refineries & Bonded Warehouses
        for (const [tx, tz] of [[-86, 26], [-86, 52], [-60, 26], [-60, 52], [-86, -42], [-60, -42]]) {
          const tank = new Mesh(unitCyl, tankMat);
          tank.position.set(tx, 6.2, tz); tank.scale.set(5.2, 12.4, 5.2);
          tank.matrixAutoUpdate = false; tank.updateMatrix(); root.add(tank);
          if (physics?.addBox) {
            const b = physics.addBox(new Vector3(tx - 5.2, 0, tz - 5.2), new Vector3(tx + 5.2, 12.4, tz + 5.2), { surface: 'metal', noNav: true });
            if (b) activeColliders.push(b);
          }
        }
        addBox(steel, 0, 4.0, 0, 148, 0.42, 6.4, { surface: 'metal' });
        addBox(hazard, 0, 4.8, -3.1, 148, 0.16, 0.16, { collide: false });
        addBox(hazard, 0, 4.8, 3.1, 148, 0.16, 0.16, { collide: false });
        const layouts = [
          { cx: -22, cz: -78, width: 42, depth: 26, height: 14, styleName: 'industrial_complex', seed: 51, labelZh: '二号沿海精炼厂', labelEn: 'REFINERY COMPLEX 02' },
          { cx: 64, cz: 74, width: 36, depth: 24, height: 13, styleName: 'industrial_complex', seed: 52, labelZh: '南岸主抽水泵站', labelEn: 'SOUTH PUMP STATION' },
          { cx: 88, cz: -66, width: 34, depth: 22, height: 14, styleName: 'bonded_warehouse', seed: 53, withInterior: true },
          { cx: -24, cz: 82, width: 32, depth: 22, height: 13, styleName: 'industrial_hall', seed: 54 },
        ];
        for (const cfg of layouts) addArch(cfg);
      }

      flush();
      buildObjectiveBeacons(root, spec);
      scene.add(root);
      activeRoot = root;
      return { ...spec, meta: spec, bounds: MAP_BOUNDS, usesWorldEngine: Boolean(bldgGen), buildingCount };
    }

    return {
      maps: MP_MAPS,
      bounds: MAP_BOUNDS,
      resolveMapSpec,
      loadMap,
      unloadMap,
      get currentMap() { return currentSpec; },
      get colliderCount() { return activeColliders.length; },
    };
  }

  const exported = {
    MP_MAPS,
    MAP_ALIASES,
    MAP_BOUNDS,
    highlandElevation,
    resolveMapSpec,
    createMultiplayerMapLoader,
  };

  if (typeof window !== 'undefined') window.SaltlineMPMaps = exported;
  if (typeof module !== 'undefined' && module.exports) module.exports = exported;
})();
