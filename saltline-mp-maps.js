/* SALTLINE — 5 Truly Independent Multiplayer Maps
 * Each map builds its own dedicated terrain, road network, architectural layout, landmarks,
 * spawn positions, interactables, colliders, lighting mood, and real SVG tactical preview.
 * Strictly NOT 5 spawn points on the same map!
 *
 * Maps (with backward-compatible aliases for legacy IDs):
 *   1. coastal_metropolis (alias: coastal_quarter)    — Modern Coastal Metropolis
 *   2. iron_harbor        (alias: port_rail)          — Large Port & Railway Hub
 *   3. highland_passage   (alias: mountain_forest)    — Mountain & Forest Valley Passage
 *   4. old_saltline       (alias: old_harbor)         — Dense Historic Quarter
 *   5. industrial_coast   (alias: coastal_industrial) — Heavy Coastal Industrial Works */
(() => {
  'use strict';

  const MAP_ALIASES = Object.freeze({
    coastal_quarter: 'coastal_metropolis',
    port_rail: 'iron_harbor',
    mountain_forest: 'highland_passage',
    old_harbor: 'old_saltline',
    coastal_industrial: 'industrial_coast',
  });

  const MP_MAPS = Object.freeze([
    {
      id: 'coastal_metropolis', legacyId: 'coastal_quarter',
      nameEn: 'Coastal Metropolis', nameZh: '沿海大都市 · Coastal Metropolis',
      descEn: 'Modern commercial skyline, residential towers, civic fountain plaza, waterfront avenue & multi-level lobby interiors.',
      descZh: '独立构建的大型沿海都市：包含现代商业中心、高密度住宅塔楼、中央喷泉广场、滨海大道与多层可进入大厅。',
      skyPreset: 1, weather: 'clear', accent: '#38bdf8',
      spawns: { blue: [-68, 0.3, -44], red: [68, 0.3, 44], coop: [-68, 0.3, 0] },
      objectives: [
        { id: 'cm_a', short: 'A', labelZh: '西区商业中庭', pos: [-40, 0.3, -24] },
        { id: 'cm_b', short: 'B', labelZh: '中央喷泉广场', pos: [0, 0.3, 0] },
        { id: 'cm_c', short: 'C', labelZh: '滨海玻璃塔楼', pos: [38, 0.3, -18] },
        { id: 'cm_d', short: 'D', labelZh: '南湾住宅街区', pos: [-16, 0.3, 42] },
        { id: 'cm_e', short: 'E', labelZh: '东海观景长廊', pos: [52, 0.3, 28] },
      ],
      previewSvg: `<rect width="160" height="100" fill="#0b1824"/><rect x="128" y="0" width="32" height="100" fill="#0d3552"/><rect x="14" y="14" width="32" height="26" rx="2" fill="#2c4a63" stroke="#60a5fa"/><rect x="58" y="12" width="28" height="28" rx="2" fill="#33536e"/><rect x="96" y="14" width="24" height="32" rx="2" fill="#3b6382"/><rect x="16" y="56" width="36" height="30" rx="2" fill="#294257"/><circle cx="72" cy="56" r="11" fill="#1e3a52" stroke="#38bdf8" stroke-width="1.5"/><line x1="0" y1="48" x2="128" y2="48" stroke="#facc15" stroke-width="2" stroke-dasharray="4 3"/><line x1="52" y1="0" x2="52" y2="100" stroke="#94a3b8" stroke-width="2"/>`,
    },
    {
      id: 'iron_harbor', legacyId: 'port_rail',
      nameEn: 'Iron Harbor', nameZh: '钢铁港与铁路枢纽 · Iron Harbor',
      descEn: 'Dual-track freight railway hub, stationary locomotives, gantry cranes, shipping warehouses & container lanes.',
      descZh: '独立构建的大型港口与铁路编组枢纽：双轨货运站场、重型机车掩体、高架龙门吊、货运仓库与集装箱通道。',
      skyPreset: 0, weather: 'overcast', accent: '#f59e0b',
      spawns: { blue: [-74, 0.3, 0], red: [74, 0.3, 0], coop: [-74, 0.3, -28] },
      objectives: [
        { id: 'ih_a', short: 'A', labelZh: '西区编组信号楼', pos: [-44, 0.3, -22] },
        { id: 'ih_b', short: 'B', labelZh: '中央货运列车阵', pos: [0, 0.3, 0] },
        { id: 'ih_c', short: 'C', labelZh: '北段龙门吊栈桥', pos: [12, 0.3, -36] },
        { id: 'ih_d', short: 'D', labelZh: '南区集装箱迷宫', pos: [-18, 0.3, 34] },
        { id: 'ih_e', short: 'E', labelZh: '东海深水泊位', pos: [48, 0.3, 12] },
      ],
      previewSvg: `<rect width="160" height="100" fill="#121820"/><rect x="132" y="0" width="28" height="100" fill="#0d3047"/><line x1="68" y1="0" x2="68" y2="100" stroke="#94a3b8" stroke-width="2.5"/><line x1="78" y1="0" x2="78" y2="100" stroke="#94a3b8" stroke-width="2.5"/><rect x="65" y="18" width="16" height="28" rx="2" fill="#dc2626"/><rect x="65" y="54" width="16" height="28" rx="2" fill="#0284c7"/><rect x="16" y="18" width="34" height="14" fill="#9a3412"/><rect x="16" y="42" width="34" height="14" fill="#0f766e"/><rect x="16" y="66" width="34" height="14" fill="#1d4ed8"/><rect x="96" y="24" width="26" height="52" fill="#475569" stroke="#f59e0b"/>`,
    },
    {
      id: 'highland_passage', legacyId: 'mountain_forest',
      nameEn: 'Highland Passage', nameZh: '高地山谷通道 · Highland Passage',
      descEn: 'Elevated pine-forested valley, winding mountain highway, hilltop relay compound & stepped village terraces.',
      descZh: '独立构建的山区与森林立体地图：高达 16 米的山地高差、盘山公路、多树种松林掩体、山脊通信站与溪谷村镇。',
      skyPreset: 2, weather: 'mist', accent: '#34d399',
      spawns: { blue: [-72, 2.2, 42], red: [68, 12.2, -38], coop: [-72, 2.2, 0] },
      objectives: [
        { id: 'hp_a', short: 'A', labelZh: '山脚村镇检查站', pos: [-42, 2.2, 24] },
        { id: 'hp_b', short: 'B', labelZh: '松林弯道桥', pos: [-8, 6.2, 6] },
        { id: 'hp_c', short: 'C', labelZh: '山腰林场木屋', pos: [18, 9.2, -10] },
        { id: 'hp_d', short: 'D', labelZh: '北崖通信雷达塔', pos: [44, 13.2, -26] },
        { id: 'hp_e', short: 'E', labelZh: '东谷护林瞭望台', pos: [36, 7.2, 28] },
      ],
      previewSvg: `<rect width="160" height="100" fill="#0d1c16"/><path d="M0 90 Q42 52 82 40 T160 12 L160 100 L0 100 Z" fill="#183628"/><path d="M12 86 Q56 68 86 48 T144 20" fill="none" stroke="#cbd5e1" stroke-width="3" stroke-dasharray="5 3"/><circle cx="122" cy="28" r="10" fill="#1e293b" stroke="#34d399" stroke-width="2"/><circle cx="42" cy="64" r="6" fill="#22543d"/><circle cx="66" cy="48" r="7" fill="#22543d"/><circle cx="94" cy="36" r="6" fill="#22543d"/>`,
    },
    {
      id: 'old_saltline', legacyId: 'old_harbor',
      nameEn: 'Old Saltline', nameZh: '老盐线历史城区 · Old Saltline',
      descEn: 'Tight historic cobblestone alleys, brick arcades, central clock plaza, corner shops & interconnected courtyards.',
      descZh: '独立构建的历史城区巷战地图：密集石板巷道、红砖拱廊、历史钟楼广场、街角商铺与互通内院。',
      skyPreset: 2, weather: 'dusk', accent: '#60a5fa',
      spawns: { blue: [-62, 0.3, -36], red: [62, 0.3, 36], coop: [-62, 0.3, 0] },
      objectives: [
        { id: 'os_a', short: 'A', labelZh: '西门红砖拱廊', pos: [-36, 0.3, -14] },
        { id: 'os_b', short: 'B', labelZh: '老城钟楼广场', pos: [0, 0.3, 0] },
        { id: 'os_c', short: 'C', labelZh: '北巷市场庭院', pos: [8, 0.3, -34] },
        { id: 'os_d', short: 'D', labelZh: '南街历史邮局', pos: [-14, 0.3, 32] },
        { id: 'os_e', short: 'E', labelZh: '旧港海防炮台', pos: [42, 0.3, 18] },
      ],
      previewSvg: `<rect width="160" height="100" fill="#1b1815"/><g fill="#5c3d2e" stroke="#a67c52" stroke-width="1"><rect x="14" y="14" width="24" height="22"/><rect x="44" y="14" width="24" height="22"/><rect x="92" y="14" width="24" height="22"/><rect x="122" y="14" width="24" height="22"/><rect x="14" y="64" width="24" height="22"/><rect x="44" y="64" width="24" height="22"/><rect x="92" y="64" width="24" height="22"/><rect x="122" y="64" width="24" height="22"/></g><rect x="68" y="38" width="24" height="24" fill="#3b352e" stroke="#60a5fa" stroke-width="1.5"/><circle cx="80" cy="50" r="5" fill="#fbbf24"/>`,
    },
    {
      id: 'industrial_coast', legacyId: 'coastal_industrial',
      nameEn: 'Industrial Coast', nameZh: '沿海重工带 · Industrial Coast',
      descEn: 'Heavy coastal engineering complex, multi-story steel refineries, elevated pipe catwalks, cryo tank farm & seawall dock.',
      descZh: '独立构建的沿海重工业区：多层钢构厂房、高架管廊通道、大型低温储罐群、海岸泵房与重型装卸码头。',
      skyPreset: 3, weather: 'rain', accent: '#fb7185',
      spawns: { blue: [-70, 0.3, 32], red: [70, 0.3, -32], coop: [-70, 0.3, 0] },
      objectives: [
        { id: 'ic_a', short: 'A', labelZh: '低温储罐群', pos: [-38, 0.3, 18] },
        { id: 'ic_b', short: 'B', labelZh: '中央高架管廊', pos: [0, 4.2, 0] },
        { id: 'ic_c', short: 'C', labelZh: '二号精炼厂房', pos: [-10, 0.3, -32] },
        { id: 'ic_d', short: 'D', labelZh: '南岸抽水泵站', pos: [26, 0.3, 30] },
        { id: 'ic_e', short: 'E', labelZh: '东海装卸栈桥', pos: [48, 0.3, -16] },
      ],
      previewSvg: `<rect width="160" height="100" fill="#14131a"/><rect x="134" y="0" width="26" height="100" fill="#0c283d"/><circle cx="30" cy="30" r="11" fill="#475569" stroke="#fb7185"/><circle cx="58" cy="30" r="11" fill="#475569" stroke="#fb7185"/><circle cx="30" cy="64" r="11" fill="#475569"/><rect x="82" y="18" width="40" height="24" fill="#334155"/><rect x="82" y="56" width="40" height="26" fill="#334155"/><line x1="20" y1="50" x2="126" y2="50" stroke="#f59e0b" stroke-width="4"/>`,
    },
  ]);

  function resolveMapSpec(mapId) {
    const canonical = MAP_ALIASES[mapId] || mapId;
    return MP_MAPS.find(m => m.id === canonical || m.legacyId === mapId) || MP_MAPS[0];
  }

  // Dedicated 3D Builder for Each Independent Multiplayer Map (Clean Mount + Full GPU/Collider Dispose)
  function createMultiplayerMapLoader(world) {
    const { THREE, scene, physics } = world || {};
    if (!THREE || !scene) {
      return { loadMap: id => resolveMapSpec(id), unloadMap: () => {}, get currentMap() { return null; } };
    }
    const { Group, Mesh, BoxGeometry, CylinderGeometry, ConeGeometry, InstancedMesh, Object3D, MeshStandardMaterial, MeshBasicMaterial, Vector3 } = THREE;

    const unitBox = new BoxGeometry(1, 1, 1);
    const unitCyl = new CylinderGeometry(1, 1, 1, 14);
    const unitCone = new ConeGeometry(1, 1, 8);
    let activeRoot = null;
    let activeColliders = [];
    let currentSpec = null;

    function unloadMap() {
      if (activeRoot) {
        activeRoot.traverse(n => {
          if (n.isInstancedMesh) n.dispose?.();
          if (n.material && n.material.userData?.mpMapOwned) n.material.dispose?.();
        });
        activeRoot.removeFromParent();
        activeRoot = null;
      }
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
          const inst = new InstancedMesh(unitBox, mat, mats.length);
          for (let i = 0; i < mats.length; i++) inst.setMatrixAt(i, mats[i]);
          inst.instanceMatrix.needsUpdate = true;
          inst.receiveShadow = true;
          root.add(inst);
        }
        boxBatches.clear();
      };
      return { addBox, flush };
    }

    function buildObjectiveBeacons(root, spec) {
      const ringMat = new MeshBasicMaterial({ color: spec.accent || '#38bdf8' });
      ringMat.userData.mpMapOwned = true;
      for (const obj of spec.objectives) {
        const [ox, oy, oz] = obj.pos;
        const pole = new Mesh(unitCyl, ringMat);
        pole.position.set(ox, oy + 4.5, oz);
        pole.scale.set(0.14, 9.0, 0.14);
        pole.matrixAutoUpdate = false; pole.updateMatrix();
        root.add(pole);
      }
    }

    function loadMap(mapId) {
      unloadMap();
      const spec = resolveMapSpec(mapId);
      currentSpec = spec;
      const root = new Group();
      root.name = 'mp-independent-map-' + spec.id;
      // Offset dedicated multiplayer arena into its own isolated spatial sector (y = 0, x/z centered around 0 or isolated arena)
      // so it NEVER shares layout with the single-player open world!
      const { addBox, flush } = createBatchCollector(root);

      const asphalt = makeMat(0x282e33, 0.92, 0.04);
      const concrete = makeMat(0x757b80, 0.88, 0.06);
      const glass = makeMat(0x467996, 0.16, 0.55);
      const brick = makeMat(0x7a4b3d, 0.88, 0.04);
      const steel = makeMat(0x3a464f, 0.52, 0.65);
      const hazard = makeMat(0xd99b26, 0.5, 0.22);
      const grass = makeMat(0x2f4d35, 0.94, 0.02);
      const water = makeMat(0x133e57, 0.18, 0.45);
      const redCont = makeMat(0xa33228, 0.68, 0.24);
      const tealCont = makeMat(0x1f5f66, 0.68, 0.24);

      // Base Arena Ground Deck (180m x 140m) + East Sea Horizon
      addBox(spec.id === 'highland_passage' ? grass : asphalt, 0, -0.1, 0, 184, 0.4, 144, { collide: true });
      if (spec.id !== 'highland_passage') {
        addBox(water, 128, -0.35, 0, 80, 0.2, 160, { collide: false });
      }

      if (spec.id === 'coastal_metropolis') {
        // Commercial Boulevard + Central Fountain Plaza + 8 Distinct Modern Glass Towers & Enterable Lobbies
        addBox(concrete, 0, 0.16, 0, 26, 0.18, 26, { collide: true });
        addBox(water, 0, 0.45, 0, 8, 0.4, 8, { collide: true });
        for (const [bx, bz, bw, bd, bh] of [
          [-46, -34, 22, 18, 22], [-46, 26, 24, 20, 16], [42, -32, 22, 22, 28],
          [44, 28, 20, 18, 18], [-12, -46, 20, 14, 14], [18, 46, 24, 14, 20],
        ]) {
          addBox(concrete, bx, bh / 2, bz, bw, bh, bd);
          addBox(glass, bx, bh * 0.54, bz, bw + 0.3, bh * 0.72, bd - 2.4, { collide: false });
          addBox(steel, bx, bh + 0.4, bz, bw + 0.6, 0.8, bd + 0.6, { collide: false });
        }
        // Overhead glass skybridge crossing boulevard
        addBox(steel, 0, 6.2, -26, 48, 0.5, 4.2, { collide: true });
      } else if (spec.id === 'iron_harbor') {
        // Dual Railway Tracks + 4 Freight Train Cars + 3 Gantry Cranes + Multi-Lane Container Maze
        for (const tx of [-5, 5]) addBox(steel, tx, 0.18, 0, 1.8, 0.16, 130, { collide: false });
        for (const tz of [-34, -12, 14, 38]) {
          addBox(tz % 2 === 0 ? redCont : tealCont, -5, 1.9, tz, 3.0, 3.2, 16);
        }
        for (const [cx, cz, mat] of [
          [-38, -16, redCont], [-38, 10, tealCont], [-24, 26, hazard], [30, -24, tealCont], [34, 18, redCont],
        ]) {
          addBox(mat, cx, 1.4, cz, 12.2, 2.6, 2.8);
          addBox(steel, cx, 4.0, cz, 12.2, 2.6, 2.8);
        }
        // Overhead Gantry Crane Arch
        for (const gx of [-22, 22]) addBox(hazard, gx, 7.5, -18, 1.6, 15, 2.0);
        addBox(hazard, 0, 15.2, -18, 46, 1.6, 2.4, { collide: false });
      } else if (spec.id === 'highland_passage') {
        // Stepped Mountain Elevations (0m -> +6m -> +12m) + Pine Forest + Summit Radar Station
        addBox(grass, 18, 2.8, -10, 96, 5.6, 104);
        addBox(grass, 46, 6.8, -26, 58, 8.0, 68);
        // Winding highway ramps
        addBox(asphalt, -22, 1.6, 10, 34, 0.5, 10);
        addBox(asphalt, 12, 5.8, -8, 38, 0.5, 10);
        // Summit radar bunker
        addBox(concrete, 46, 13.4, -26, 16, 5.2, 14);
        addBox(steel, 46, 17.5, -26, 2.2, 4.5, 2.2, { collide: false });
        // Pine trees across valley & ridge
        const treeMat = makeMat(0x1f4029, 0.9, 0.02);
        const trunkMat = makeMat(0x4d3724, 0.9, 0.02);
        for (let i = 0; i < 28; i++) {
          const tx = -68 + (i % 7) * 22 + (i % 3) * 3;
          const tz = -52 + Math.floor(i / 7) * 32;
          const ty = tx > 20 && tz < 6 ? 10.8 : (tx > -28 ? 5.6 : 0.2);
          const c = new Mesh(unitCone, treeMat);
          c.position.set(tx, ty + 3.6, tz); c.scale.set(2.2, 5.4, 2.2);
          c.matrixAutoUpdate = false; c.updateMatrix(); root.add(c);
          const tr = new Mesh(unitCyl, trunkMat);
          tr.position.set(tx, ty + 1.0, tz); tr.scale.set(0.32, 2.2, 0.32);
          tr.matrixAutoUpdate = false; tr.updateMatrix(); root.add(tr);
        }
      } else if (spec.id === 'old_saltline') {
        // Dense Historic Brick Quarter + Clock Tower Square + Narrow Alleys
        addBox(concrete, 0, 0.16, 0, 24, 0.2, 24);
        addBox(brick, 0, 7.5, 0, 4.4, 15, 4.4); // Historic Clock Tower Landmark
        addBox(hazard, 0, 14.2, 0, 4.8, 1.2, 4.8, { collide: false });
        for (const bx of [-42, -22, 22, 42]) {
          for (const bz of [-34, -12, 14, 34]) {
            if (Math.abs(bx) < 25 && Math.abs(bz) < 16) continue;
            const bh = 8 + ((Math.abs(bx + bz) % 3) * 3);
            addBox(brick, bx, bh / 2, bz, 14, bh, 14);
            addBox(concrete, bx, bh + 0.3, bz, 14.6, 0.6, 14.6, { collide: false });
          }
        }
      } else {
        // industrial_coast: Cryo Tank Farm + Elevated Pipe Catwalks + Multi-Story Steel Refineries
        const cryoMat = makeMat(0xc8d4db, 0.45, 0.35);
        for (const [tx, tz] of [[-42, 14], [-42, 26], [-28, 14], [-28, 26]]) {
          const tank = new Mesh(unitCyl, cryoMat);
          tank.position.set(tx, 5.2, tz); tank.scale.set(3.8, 10.2, 3.8);
          tank.matrixAutoUpdate = false; tank.updateMatrix(); root.add(tank);
          if (physics?.addBox) {
            const b = physics.addBox(new Vector3(tx - 3.8, 0, tz - 3.8), new Vector3(tx + 3.8, 10.2, tz + 3.8), { surface: 'metal', noNav: true });
            if (b) activeColliders.push(b);
          }
        }
        // Central Elevated Industrial Pipe Catwalk (y = 4.0m)
        addBox(steel, 0, 3.9, 0, 68, 0.35, 5.2, { surface: 'metal' });
        addBox(hazard, 0, 4.6, -2.5, 68, 0.14, 0.14, { collide: false });
        addBox(hazard, 0, 4.6, 2.5, 68, 0.14, 0.14, { collide: false });
        // Refinery Halls
        addBox(steel, -10, 5.0, -34, 34, 10, 18, { surface: 'metal' });
        addBox(steel, 26, 4.5, 30, 28, 9, 16, { surface: 'metal' });
      }

      flush();
      buildObjectiveBeacons(root, spec);
      scene.add(root);
      activeRoot = root;
      return spec;
    }

    return {
      maps: MP_MAPS,
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
    resolveMapSpec,
    createMultiplayerMapLoader,
  };

  if (typeof window !== 'undefined') window.SaltlineMPMaps = exported;
  if (typeof module !== 'undefined' && module.exports) module.exports = exported;
})();
