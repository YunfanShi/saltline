/* Berth control layout and mission flow. */
(() => {
  const archiveHold = 1.2;
  const consoleHold = .65;
  const exposureLimit = .8;
  const gateClearance = 2.16;
  const gateTravel = 3.25;
  const lampAngle = .19;
  const gateX = 21.25;
  const laneZ = -7.1;
  const objectiveText = {
    archive: ['Recover the freight dossier from port control', '从港口控制楼取回货运档案'],
    extract: ['Take the freight dossier to the boat at the south ladder', '带着货运档案到南端梯口登船'],
  };
  const markerText = {
    road: ['Loading road / guard console', '装卸车道／岗亭控制台'],
    water: ['Waterside maintenance entrance', '临水维修入口'],
    archive: ['Port control / freight dossier', '港口控制楼／货运档案'],
    extract: ['Boat / south ladder', '接应艇／南端梯口'],
  };
  const promptText = {
    gate: ['Open truck gate · triggers alarm', '开启货车闸门 · 将触发警报'],
    archive: ['Take the freight dossier', '取走货运档案'],
    light: ['Get clear of the searchlight', '离开探照灯照射范围'],
  };

  window.createPortBerthAlarmSound = rate => {
    const duration = 5.6;
    const signal = new Float32Array(Math.ceil(rate * duration));
    let phase = 0;
    for (let sample = 0; sample < signal.length; sample++) {
      const time = sample / rate;
      const cycle = time % 2.3;
      const swell = Math.sin(Math.PI * Math.min(1, cycle / 2.1));
      const speed = Math.min(1, time / .55) * Math.min(1, (duration - time) / .65);
      phase += 2 * Math.PI * (280 + 310 * swell) / rate;
      signal[sample] = Math.pow(swell, .7) * speed * (.55 * Math.sin(phase) + .21 * Math.sin(phase * 2) + .08 * Math.sin(phase * 3));
    }
    return signal;
  };

  window.createPortBerthLayout = (builder, vector, { extraction }) => {
    const { THREE, G, dynRoot, box, slab, cyl } = builder;
    const model = new THREE.Group();
    model.name = 'berth-port-control';
    model.visible = false;
    dynRoot.add(model);
    const gate = new THREE.Group();
    gate.name = 'berth-truck-gate';
    model.add(gate);
    const geometry = [];
    const point = (x, z, y = 0) => vector(x, y, z);
    const bounds = (x0, y0, z0, x1, y1, z1) => ({ min: vector(x0, y0, z0), max: vector(x1, y1, z1) });
    function solid(material, x0, y0, z0, x1, y1, z1, surface = 'metal', options = {}) {
      slab(material, x0, y0, z0, x1, y1, z1, { parent: model });
      geometry.push({ ...bounds(x0, y0, z0, x1, y1, z1), surface, ...options });
    }
    function piece(material, w, h, d, x, y, z, parent = model) {
      return box(material, w, h, d, x, y, z, { parent });
    }
    function cylinder(material, radius, height, x, y, z, options = {}) {
      return cyl(material, radius, height, x, y, z, { parent: model, ...options });
    }
    function sign(text, width, height, x, y, z, yaw) {
      const board = piece('steel_dark', width + .1, height + .075, .045, x, y, z);
      board.rotation.y = yaw;
      const texture = G.mats.label(text, { color: 'white', font: 'stencil', distress: .18 });
      const label = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(width, height * texture.aspect), height), texture.material);
      label.position.set(x + Math.sin(yaw) * .027, y, z + Math.cos(yaw) * .027);
      label.rotation.y = yaw;
      model.add(label);
    }

    const west = 22.8, east = 27.12, north = -7.99, south = -4.46, roof = 2.86;
    slab('concrete_dirty', gateX, -.08, -7.88, east, .016, south, { parent: model });
    solid('concrete_dirty', west, 0, north, east, .83, north + .18, 'concrete');
    solid('concrete_dirty', west, 0, south - .18, east, roof, south, 'concrete');
    solid('corrugated_roof', west, 2.17, north, east, roof, north + .18);
    solid('glass_dirty', west, .83, north + .07, east, 2.17, north + .115, 'glass');
    for (let x = west + .67; x < east; x += .69) piece('steel_galv', .054, 1.4, .19, x, 1.5, north + .09);
    for (const y of [.83, 2.17]) piece('steel_galv', east - west, .063, .21, (west + east) / 2, y, north + .09);
    for (const x of [west, east - .16]) {
      solid('concrete_dirty', x, 0, north, x + .16, roof, -7.73, 'concrete');
      solid('concrete_dirty', x, 0, -5.36, x + .16, roof, south, 'concrete');
      solid('corrugated_roof', x, 2.15, -7.73, x + .16, roof, -5.36);
      for (const z of [-7.72, -5.37]) piece('steel_galv', .22, 2.17, .09, x + .08, 1.085, z);
      piece('steel_galv', .22, .115, 2.44, x + .08, 2.15, -6.545);
    }
    solid('corrugated_roof', west - .16, roof, north - .19, east + .16, roof + .12, south + .23, 'metal', { noNav: true });
    piece('steel_worn', 4.08, .11, .11, (west + east) / 2, roof - .06, north - .19);
    piece('steel_dark', 1.82, .11, .26, 24.95, roof - .13, -6.15);
    piece(G.mats.emissive(0xffe6c6, 1.7), 1.7, .025, .2, 24.95, roof - .192, -6.15);
    for (const x of [23.12, 26.79]) piece('steel_galv', .095, .22, .095, x, roof + .2, -5);
    piece('steel_dark', 1.09, .49, .57, 24.8, roof + .25, -5);
    piece('steel_galv', 1.15, .055, .65, 24.8, roof + .505, -5);
    for (let x = 24.37; x <= 25.24; x += .095) piece('steel_galv', .032, .3, .035, x, roof + .25, -4.703);
    for (const yaw of [-Math.PI / 2, Math.PI / 2]) {
      const doorX = yaw < 0 ? west - .09 : east + .09;
      sign(yaw < 0 ? 'PORT CONTROL' : 'WATERSIDE SERVICE', 2.35, .195, doorX, 2.5, -6.55, yaw);
    }
    sign('PORT CONTROL 04', 3, .25, 24.96, 2.55, north - .035, Math.PI);
    const signYaw = -Math.PI / 2;
    sign('QUAY SERVICE', 1.37, .17, 20.53, 1.77, -8.91, signYaw);
    sign('LOADING ROAD', 1.37, .17, 20.53, 1.47, -8.91, signYaw);
    for (const [y, turn] of [[1.77, -1], [1.47, 1]]) {
      for (const diagonal of [-1, 1]) {
        const arrow = piece('paint_white', .105, .016, .008, 20.5, y + diagonal * .021, -8.91 + turn * .52);
        arrow.rotation.y = signYaw;
        arrow.rotateZ(diagonal * turn * .53);
      }
    }
    piece('steel_galv', .055, 1.89, .055, 20.53, .945, -8.91);

    // Open-front loading bay and motorized roller shutter.
    const gateNorth = -7.93, gateSouth = -4.53;
    for (const z of [gateNorth, gateSouth]) {
      solid('steel_dark', gateX - .13, 0, z - .12, gateX + .13, 3.38, z + .12);
      piece('hazard_stripes', .285, .7, .27, gateX, .48, z);
      cylinder('paint_yellow', .085, .87, gateX - .32, .435, z, { seg: 10 });
    }
    for (const z of [gateNorth, gateSouth]) {
      solid('steel_worn', gateX, 0, z - .06, west, 2.58, z + .06);
      for (let x = gateX + .19; x < west; x += .27) piece('steel_galv', .017, 2.49, .08, x, 1.27, z);
    }
    piece('steel_dark', .64, .49, gateSouth - gateNorth + .24, gateX, 3.48, (gateNorth + gateSouth) / 2);
    sign('LOADING 04', 2.32, .225, gateX - .331, 3.48, (gateNorth + gateSouth) / 2, -Math.PI / 2);
    piece('steel_worn', .14, gateTravel, gateSouth - gateNorth - .13, gateX, gateTravel / 2, (gateNorth + gateSouth) / 2, gate);
    for (let y = .17; y < gateTravel; y += .166) {
      piece('steel_galv', .157, .017, gateSouth - gateNorth - .11, gateX, y, (gateNorth + gateSouth) / 2, gate);
    }
    piece('hazard_stripes', .17, .11, gateSouth - gateNorth - .1, gateX, .078, (gateNorth + gateSouth) / 2, gate);
    for (const z of [-7.52, -6.8]) {
      for (const x of [19.53, 20.5, 21.91]) piece('paint_yellow', .63, .008, .075, x, .025, z);
    }
    // The guard console is reachable before the vehicle gate and has a clear status lamp.
    const consolePos = point(20.72, -7.63);
    solid('steel_dark', consolePos.x - .11, 0, consolePos.z - .11,
      consolePos.x + .11, .99, consolePos.z + .11);
    piece('steel_galv', .31, .275, .29, consolePos.x, .98, consolePos.z);
    piece('polymer_black', .038, .2, .216, consolePos.x - .16, 1.01, consolePos.z);
    const consoleMaterial = new THREE.MeshBasicMaterial({ color: 0xf0a04b });
    piece(consoleMaterial, .042, .055, .105, consolePos.x - .181, 1.045, consolePos.z);
    piece('paint_red', .045, .055, .04, consolePos.x - .181, .976, consolePos.z - .042);

    // Desk, shipping docket and window-facing watch console.
    solid('steel_dark', 23.39, 0, -5.06, 26.27, .81, -4.62);
    piece('wood_dark', 3.04, .067, .53, 24.83, .845, -4.86);
    piece('steel_worn', .32, .21, .28, 25.72, .963, -4.86);
    piece('polymer_black', .51, .29, .13, 25.72, 1.11, -4.75);
    piece(G.mats.emissive(0x88bbc1, .8), .43, .22, .015, 25.72, 1.12, -4.821);
    piece('steel_dark', .37, .06, .13, 25.86, .909, -5.005);
    for (let drawer = 0; drawer < 3; drawer++) {
      const y = .2 + drawer * .19;
      piece('steel_galv', .86, .021, .022, 23.93, y, -5.076);
      piece('steel_worn', .13, .028, .035, 23.93, y + .05, -5.09);
    }
    const dossier = new THREE.Group();
    dossier.name = 'berth-freight-dossier';
    model.add(dossier);
    piece('wood_pallet', .41, .034, .28, 24.72, .898, -4.98, dossier);
    piece('paint_white', .365, .021, .249, 24.72, .925, -4.98, dossier);
    piece('paint_orange', .374, .016, .251, 24.719, .943, -4.982, dossier).rotation.y = .07;
    piece('paint_white', .14, .007, .082, 24.7, .955, -4.955, dossier).rotation.y = .07;
    piece('steel_galv', .12, .014, .04, 24.72, .958, -5.092, dossier);
    sign('FREIGHT RECORDS', 1.55, .15, 24.82, 1.6, south - .19, Math.PI);

    for (const [x, z] of [[27.37, -7.99], [27.37, -5.27]]) {
      cylinder('paint_yellow', .079, .83, x, .415, z, { seg: 10 });
      cylinder('steel_dark', .125, .04, x, .02, z, { seg: 10 });
      geometry.push({ ...bounds(x - .08, 0, z - .08, x + .08, .83, z + .08), surface: 'metal' });
    }
    for (let z = -12.74; z < -5.5; z += .79) piece('paint_yellow', .084, .009, .41, 28.65, .027, z);
    slab('steel_worn', east - .025, -.02, -7.53, east + .63, .024, -5.58, { parent: model });
    for (let z = -7.43; z < -5.62; z += .12) piece('steel_dark', .53, .009, .02, east + .29, .024, z);

    const searchlights = [
      { origin: point(28.94, -8.63, 4.95), aim: point(28.13, -8), sweepX: .48, sweepZ: 4.25, period: 9.8, offset: .64 },
      { origin: point(29.1, 7.96, 5.8), aim: point(27.4, 5.18), sweepX: 1.25, sweepZ: 4.6, period: 11.6, offset: 2.1 },
    ];
    for (const { origin } of searchlights) {
      const { x, y, z } = origin;
      cylinder('steel_galv', .073, y - .2, x, (y - .2) / 2, z, { seg: 8 });
      cylinder('steel_dark', .17, .09, x, .045, z, { seg: 8 });
      piece('steel_galv', .33, .11, .28, x, y - .13, z);
      geometry.push({ ...bounds(x - .07, 0, z - .07, x + .07, y - .21, z + .07), surface: 'metal' });
    }
    const alarms = [point(24.89, north, roof + .29), point(29.2, 7.96, 5.72), point(26.63, 24.35, 5.7)];
    for (const { x, y, z } of alarms) {
      if (z > 20) cylinder('steel_galv', .074, y - .15, x, (y - .15) / 2, z, { seg: 8 });
      cylinder('steel_dark', .158, .12, x, y - .1, z, { seg: 10 });
    }

    return {
      model, gate, dossier, consoleMaterial, geometry, searchlights, alarms, extraction,
      gateBounds: { ...bounds(gateX - .1, 0, gateNorth + .1, gateX + .1, gateTravel, gateSouth - .1), surface: 'metal' },
      playerStart: { pos: point(19.1, -7.96), yaw: -Math.PI / 2 },
      archive: point(24.7, -5.87), archiveSight: point(24.72, -4.98, .955),
      routes: {
        road: { pos: consolePos, console: consolePos, threshold: point(gateX, laneZ),
          path: [point(19.1, -7.63), point(19.75, -7.42), point(gateX, laneZ), point(22.3, laneZ), point(24.7, -5.87)] },
        water: { pos: point(28.15, -6.4), threshold: point(east, -6.4),
          path: [point(21.15, -8.49), point(24, -8.53), point(26.6, -8.45), point(28.08, -8.35),
            point(28.08, -6.4), point(east, -6.4), point(24.7, -5.87)] },
      },
      supplies: [
        { id: 'berth-loading-ammo', pos: point(18.58, -5.12), rounds: 45 },
        { id: 'berth-maintenance-ammo', pos: point(27.16, -10.03), rounds: 45 },
      ],
      patrols: [
        { type: 'hound', pos: point(22, .71), options: { state: 'patrol', patrolLine: [point(22, .71), point(22.27, -2.22), point(23.1, -.35)] } },
        { type: 'gull', pos: point(26, 12.2, 6.8), options: { state: 'patrol', patrolRadius: 3.7, hover: 6.8 } },
      ],
      reinforcement: { type: 'hound', pos: point(18.1, 7.2) },
      interiorBoxes: [bounds(west, 0, north, east, roof, south)],
    };
  };

  function inReach(pos, destination, radius, height) {
    return Math.abs(pos.y - destination.y) <= height && Math.hypot(pos.x - destination.x, pos.z - destination.z) <= radius;
  }

  function searchlightVisual(THREE, parent, spec) {
    const joint = new THREE.Group();
    joint.position.copy(spec.origin);
    parent.add(joint);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(.43, .41, .39),
      new THREE.MeshStandardMaterial({ color: 0x3d4140, metalness: .55, roughness: .61 }));
    joint.add(lamp);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(.328, .245, .023),
      new THREE.MeshBasicMaterial({ color: 0xffecc3 }));
    glass.position.z = -.2;
    joint.add(glass);
    const length = 1;
    const beamShape = new THREE.ConeGeometry(Math.tan(lampAngle) * length, length, 24, 1, true);
    beamShape.translate(0, -length / 2, 0).rotateX(Math.PI / 2);
    const beam = new THREE.Mesh(beamShape, new THREE.ShaderMaterial({
      uniforms: { intensity: { value: .28 } },
      vertexShader: `varying vec2 beamUV;
        varying vec3 beamNormal;
        varying vec3 cameraDirection;
        void main() {
          beamUV = uv;
          vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
          beamNormal = normalize(normalMatrix * normal);
          cameraDirection = normalize(-viewPosition.xyz);
          gl_Position = projectionMatrix * viewPosition;
        }`,
      fragmentShader: `varying vec2 beamUV;
        varying vec3 beamNormal;
        varying vec3 cameraDirection;
        uniform float intensity;
        void main() {
          float falloff = smoothstep(0.0, 0.3, beamUV.y) * (1.0 - smoothstep(0.82, 1.0, beamUV.y));
          float thickness = smoothstep(0.0, 0.8, abs(dot(normalize(beamNormal), normalize(cameraDirection))));
          gl_FragColor = vec4(0.94, 0.8, 0.53, intensity * falloff * thickness);
        }`,
      transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    beam.position.z = -.2;
    joint.add(beam);
    const spot = new THREE.SpotLight(0xffe8bd, 19, 17, lampAngle, .78, 1.25);
    spot.position.copy(spec.origin);
    const aim = spot.target;
    parent.add(spot, aim);
    return { joint, beam, spot, aim, direction: new THREE.Vector3() };
  }

  window.createPortBerthChapter = (world, layout, { initialPhase, onAlarm = () => {} } = {}) => {
    const { THREE, physics } = world;
    const { model, gate, dossier, consoleMaterial, searchlights, routes, extraction } = layout;
    const lamps = searchlights.map(spec => searchlightVisual(THREE, model, spec));
    const green = 0x8fefba, amber = 0xf0a04b;
    const darkRed = 0x4e1b16, hotRed = 0xff512a;
    const color = new THREE.Color();
    const sirens = layout.alarms.map((position, index) => {
      const housing = new THREE.Mesh(new THREE.CylinderGeometry(.122, .145, .22, 12),
        new THREE.MeshBasicMaterial({ color: darkRed }));
      housing.position.copy(position);
      model.add(housing);
      const light = new THREE.PointLight(0xff452c, 0, index ? 13 : 9, 1.75);
      light.position.copy(position);
      light.position.y += .08;
      model.add(light);
      return { housing, light };
    });
    const sightPoint = new THREE.Vector3();
    const sightDirection = new THREE.Vector3();
    const consoleSight = routes.road.console.clone().add(new THREE.Vector3(-.19, 1.045, 0));
    let phase, alarmed, gateOpen, reinforcementCalled;
    let active = false, gateLift = 0, elapsed = 0, exposure = 0, held = 0, holding = null;
    let gateCollider = null;
    const colliders = [];

    function syncGate() {
      const closed = active && gateLift < gateClearance;
      if (closed && !gateCollider) {
        gateCollider = physics.addBox(layout.gateBounds.min, layout.gateBounds.max, { surface: layout.gateBounds.surface });
      } else if (!closed && gateCollider) {
        physics.removeBox(gateCollider);
        gateCollider = null;
      }
      gate.position.y = gateLift;
      gate.visible = gateLift < gateTravel;
      gate.scale.y = Math.max(.01, 1 - gateLift / gateTravel);
      consoleMaterial.color.setHex(gateOpen ? green : amber);
    }

    function updateBeacons() {
      for (const [index, { housing, light }] of sirens.entries()) {
        const flash = alarmed ? Math.pow(Math.max(0, Math.sin(elapsed * 7.4 - index * 1.32)), 5) : 0;
        housing.material.color.copy(color.setHex(darkRed)).lerp(color.setHex(hotRed), flash);
        light.intensity = flash * 55;
      }
    }

    function updateSearchlights() {
      for (const [index, spec] of searchlights.entries()) {
        const lamp = lamps[index];
        const angle = elapsed * Math.PI * 2 / spec.period + spec.offset;
        const sweep = Math.sin(angle * (alarmed ? 1.45 : 1));
        lamp.aim.position.set(spec.aim.x + spec.sweepX * sweep, spec.aim.y + .025, spec.aim.z + spec.sweepZ * sweep);
        lamp.joint.lookAt(lamp.aim.position);
        // Group.lookAt points its local positive Z at the target. The lens and cone face negative Z.
        lamp.joint.rotateY(Math.PI);
        lamp.direction.subVectors(lamp.aim.position, spec.origin);
        lamp.beam.scale.setScalar(lamp.direction.length() - .2);
        lamp.direction.normalize();
        lamp.beam.material.uniforms.intensity.value = alarmed ? .36 : .25;
        lamp.spot.intensity = alarmed ? 27 : 19;
      }
    }

    function alert() {
      if (!active || alarmed || phase === 'complete') return false;
      alarmed = true;
      reinforcementCalled = true;
      onAlarm({ target: extraction.pos, reinforcement: layout.reinforcement });
      return true;
    }

    function updateExposure(dt, player) {
      if (alarmed) return;
      sightPoint.copy(player.eye ?? player.pos);
      if (!player.eye) sightPoint.y += 1.4;
      const exposed = searchlights.some((spec, index) => {
        sightDirection.subVectors(sightPoint, spec.origin);
        const distance = sightDirection.length();
        return distance > 0 && distance <= 16 && sightDirection.divideScalar(distance).dot(lamps[index].direction) >= Math.cos(lampAngle) &&
          physics.lineOfSight(spec.origin, sightPoint);
      });
      exposure = exposed ? exposure + dt : Math.max(0, exposure - dt * 1.4);
      if (exposure >= exposureLimit) alert();
    }

    function reset(snapshot) {
      phase = snapshot === 'extract' || snapshot?.phase === 'extract' ? 'extract' : 'archive';
      alarmed = phase === 'extract' && !!snapshot?.alarm;
      gateOpen = phase === 'extract' && !!snapshot?.gateOpen;
      reinforcementCalled = phase === 'extract' && !!snapshot?.reinforcementCalled;
      held = exposure = elapsed = 0;
      holding = null;
      gateLift = gateOpen ? gateTravel : 0;
      dossier.visible = phase === 'archive';
      syncGate();
      updateBeacons();
      updateSearchlights();
    }
    reset(initialPhase);

    function update(dt, player, interact) {
      if (!active || !Number.isFinite(dt) || dt <= 0) return null;
      elapsed += dt;
      updateBeacons();
      updateSearchlights();
      if (gateOpen && gateLift < gateTravel) {
        gateLift = Math.min(gateTravel, gateLift + dt * 2.7);
        syncGate();
      }
      if (!player.alive || phase === 'complete') return null;
      if (phase === 'extract' && inReach(player.pos, extraction.pos, extraction.radius, 3.5)) {
        phase = 'complete';
        return null;
      }
      updateExposure(dt, player);
      const eye = player.eye ?? player.pos;
      let action = null;
      if (!gateOpen && inReach(player.pos, routes.road.console, 1.45, 1.7) && physics.lineOfSight(eye, consoleSight)) {
        action = 'gate';
      } else if (phase === 'archive' && inReach(player.pos, layout.archive, 1.5, 1.4) && physics.lineOfSight(eye, layout.archiveSight)) {
        action = 'archive';
      }
      if (action !== holding || !interact) held = 0;
      holding = action;
      if (action) {
        if (interact) held += dt;
        const span = action === 'gate' ? consoleHold : archiveHold;
        if (held >= span) {
          held = 0;
          if (action === 'gate') {
            gateOpen = true;
            syncGate();
            alert();
          } else {
            phase = 'extract';
            dossier.visible = false;
          }
          return null;
        }
        return { prompt: promptText[action], progress: held / span };
      }
      if (!alarmed && exposure > .13) return { prompt: promptText.light, progress: exposure / exposureLimit };
      return null;
    }

    function marker(id, short, pos, kind = 'story') {
      return { id, short, pos, kind, label: markerText[id] };
    }

    return {
      reset, update, alert,
      show(value) {
        if (active === value) return;
        active = value;
        model.visible = value;
        if (value) {
          for (const { min, max, ...options } of layout.geometry) colliders.push(physics.addBox(min, max, options));
        } else {
          for (const collider of colliders.splice(0)) physics.removeBox(collider);
        }
        syncGate();
      },
      get phase() { return phase; },
      get gateOpen() { return gateOpen; },
      get alarmed() { return alarmed; },
      get objective() { return objectiveText[phase]; },
      get resumePosition() { return phase === 'extract' ? layout.archive : null; },
      get checkpoint() {
        return phase === 'extract' ? { phase, alarm: alarmed, gateOpen, reinforcementCalled } : null;
      },
      markers() {
        const approaches = [marker('road', 'RD', routes.road.pos), marker('water', 'QY', routes.water.pos)];
        if (phase === 'archive') return [...approaches, marker('archive', 'LOG', layout.archive)];
        if (phase === 'extract') {
          const exit = marker('extract', 'EX', extraction.pos, 'extract');
          return alarmed ? [...approaches, exit] : [exit];
        }
        return [];
      },
    };
  };
})();
