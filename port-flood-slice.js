/* Independent service-tunnel flood scenario. Save data is isolated from campaign saves. */
(function (root) {
  'use strict';
  const KEY = 'saltline.slice.service-tunnel.v1';
  const points = Object.freeze({
    start: { x: 0, y: 0, z: 0 }, pump: { x: 0, y: 0, z: -5 },
    upper: { x: -5, y: 1.2, z: -10 }, lower: { x: 5, y: 0, z: -10 },
    valve: { x: -5, y: 1.2, z: -15 }, gate: { x: 5, y: 0, z: -15 },
    exit: { x: 0, y: 1.2, z: -20 },
  });
  const fresh = () => ({ version: 1, phase: 'pump', route: null, level: .15, npcReady: false, elapsed: 0 });
  function valid(s) {
    return s && s.version === 1 && ['pump', 'route', 'crossing', 'escape', 'complete'].includes(s.phase) &&
      (s.route === null || s.route === 'upper' || s.route === 'lower') &&
      Number.isFinite(s.level) && s.level >= 0 && s.level <= 2.8 &&
      Number.isFinite(s.elapsed) && s.elapsed >= 0 && typeof s.npcReady === 'boolean' &&
      (!['crossing', 'escape'].includes(s.phase) || s.npcReady && s.route !== null) &&
      (s.phase !== 'route' || s.npcReady) && (s.phase !== 'complete' || s.npcReady && s.route !== null);
  }
  function createServiceTunnelScenario({ storage = null, onSave = null } = {}) {
    let state = fresh(), checkpoint = fresh(), exposure = 0;
    function save() {
      checkpoint = { ...state };
      try { storage?.setItem(KEY, JSON.stringify(checkpoint)); } catch {}
      onSave?.({ ...checkpoint });
    }
    try { const loaded = JSON.parse(storage?.getItem(KEY) || 'null'); if (valid(loaded)) state = checkpoint = { ...loaded }; } catch {}
    const distance = (a, b) => a && Math.hypot(a.x - b.x, a.z - b.z) <= 2 && Math.abs(a.y - b.y) <= 1.6;
    function interact(player) {
      if (!player?.alive || !player.pos || state.phase === 'complete') return false;
      const pos = player.pos;
      if (state.phase === 'pump' && distance(pos, points.pump)) {
        state.npcReady = true; state.phase = 'route'; save(); return true;
      }
      if (state.phase === 'route') {
        const route = distance(pos, points.upper) ? 'upper' : distance(pos, points.lower) ? 'lower' : null;
        if (!route) return false;
        state.route = route; state.phase = 'crossing'; save(); return true;
      }
      const station = state.route === 'upper' ? points.valve : points.gate;
      if (state.phase === 'crossing' && distance(pos, station)) {
        state.phase = 'escape'; save(); return true;
      }
      if (state.phase === 'escape' && distance(pos, points.exit)) {
        state.phase = 'complete'; save(); return true;
      }
      return false;
    }
    function recover() { state = { ...checkpoint }; exposure = 0; return { ...points[state.phase === 'pump' ? 'start' : state.phase === 'route' ? 'pump' : state.phase === 'escape' ? (state.route === 'upper' ? 'valve' : 'gate') : state.route] }; }
    return {
      get state() { return { ...state }; }, points, interact, recover,
      update(dt, player) {
        if (!Number.isFinite(dt) || dt <= 0 || state.phase === 'complete') return { failed: false };
        dt = Math.min(dt, .1);
        state.elapsed += dt;
        // Mara holds the pump once activated; the upper valve and lower gate offer distinct paths.
        state.level = Math.min(2.8, state.level + dt * (state.npcReady ? .014 : .022));
        const submerged = player?.alive && player.pos && state.level > player.pos.y + 1.25;
        exposure = submerged ? exposure + dt : Math.max(0, exposure - dt * 2);
        if (exposure >= 4 || player?.alive === false) return { failed: true, respawn: recover() };
        return { failed: false };
      },
      reset() { state = fresh(); exposure = 0; save(); },
    };
  }
  function createServiceTunnelSlice(world, options = {}) {
    const scenario = createServiceTunnelScenario(options);
    const { THREE, scene } = world;
    const group = new THREE.Group(); group.name = 'service-tunnel-slice';
    const materials = [new THREE.MeshStandardMaterial({ color: 0x535e60, roughness: .9 }), new THREE.MeshStandardMaterial({ color: 0x367685, transparent: true, opacity: .6, roughness: .28 }), new THREE.MeshStandardMaterial({ color: 0xf0b34e })];
    const geometries = [];
    function box(x, y, z, w, h, d, mat) {
      const geo = new THREE.BoxGeometry(w, h, d); geometries.push(geo);
      const mesh = new THREE.Mesh(geo, mat); mesh.position.set(x, y, z); group.add(mesh); return mesh;
    }
    box(0, -.25, -10, 14, .5, 24, materials[0]);
    box(-7, 1.5, -10, .4, 3, 24, materials[0]); box(7, 1.5, -10, .4, 3, 24, materials[0]);
    box(-5, 1.05, -14, 2.5, .3, 10, materials[0]);
    for (let step = 0; step < 4; step++) {
      const top = (step + 1) * .3;
      box(-5, top / 2, -6.375 - step * .75, 2.5, top, .75, materials[0]);
    }
    const water = box(0, .15, -10, 13.5, .08, 23, materials[1]);
    const npc = box(.8, .8, -4.5, .55, 1.6, .55, materials[2]);
    npc.name = 'mara-pump-operator';
    for (const name of ['pump', 'upper', 'lower', 'valve', 'gate', 'exit']) {
      const p = points[name]; box(p.x, p.y + .5, p.z, .35, 1, .35, materials[2]);
    }
    scene.add(group);
    return { ...scenario, get state() { return scenario.state; }, update(dt, player) { const result = scenario.update(dt, player); water.position.y = scenario.state.level; return result; }, dispose() { group.removeFromParent(); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); } };
  }
  const api = { createServiceTunnelScenario, createServiceTunnelSlice, SERVICE_TUNNEL_SAVE_KEY: KEY };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  Object.assign(root, api);
})(typeof window !== 'undefined' ? window : globalThis);
