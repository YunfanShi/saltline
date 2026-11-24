/* Individual port districts and working sets for the second half of the campaign. */
(() => {
  const ids = ['drydock', 'tidegate', 'anchorage', 'return-harbor', 'night-record', 'last-pilot', 'reopen'];
  const paint = {
    warm: 0xffd6a0, teal: 0x73e6db, red: 0xff643e, blue: 0x82afe0,
  };

  function createSet(builder, vector, id) {
    const { THREE, G, dynRoot, box, slab, cyl, col, rod } = builder;
    const root = new THREE.Group();
    const moving = new THREE.Group();
    const scenery = new THREE.Group();
    root.name = id + '-district';
    moving.name = id + '-moving';
    scenery.name = id + '-buildings';
    root.add(scenery, moving);
    dynRoot.add(root);

    const points = {};
    const objects = {};
    const switches = {};
    const routes = {};
    const interiorBoxes = [];
    const point = (x, z, y = 0) => vector(x, y, z);
    const positions = coordinates => coordinates.map(([x, z, y]) => point(x, z, y));
    const group = (name, parent, x = 0, y = 0, z = 0) => {
      const node = new THREE.Group();
      node.name = name;
      node.position.set(x, y, z);
      parent.add(node);
      return node;
    };
    const piece = (mat, w, h, d, x, y, z, parent = scenery) =>
      box(mat, w, h, d, x, y, z, { parent });
    function solid(mat, x0, y0, z0, x1, y1, z1, surface = 'metal', options = {}) {
      slab(mat, x0, y0, z0, x1, y1, z1, { parent: scenery });
      col(x0, y0, z0, x1, y1, z1, surface, options);
    }
    function rail(x0, z0, x1, z1, y = 0) {
      const length = Math.hypot(x1 - x0, z1 - z0);
      for (const level of [.49, .98]) {
        rod('steel_galv', [x0, y + level, z0], [x1, y + level, z1], .039, { parent: scenery });
      }
      const posts = Math.ceil(length / 2.3);
      for (let i = 0; i <= posts; i++) {
        const x = x0 + (x1 - x0) * i / posts;
        const z = z0 + (z1 - z0) * i / posts;
        piece('steel_galv', .074, 1.03, .074, x, y + .515, z);
      }
      col(Math.min(x0, x1) - .04, y, Math.min(z0, z1) - .04,
        Math.max(x0, x1) + .04, y + 1.04, Math.max(z0, z1) + .04, 'metal');
    }
    function label(text, x, y, z, width = 2.9, yaw = 0, parent = scenery) {
      const texture = G.mats.label(text, { color: 'white', font: 'stencil', distress: .14 });
      const h = Math.min(.27, width / texture.aspect);
      const plate = piece('steel_dark', width + .09, h + .13, .044, x, y, z, parent);
      plate.rotation.y = yaw;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, h), texture.material);
      mesh.position.set(x + .026 * Math.sin(yaw), y, z + .026 * Math.cos(yaw));
      mesh.rotation.y = yaw;
      parent.add(mesh);
    }
    function striped(x, z, length, alongX = true, y = .022) {
      for (let offset = .3; offset < length - .1; offset += .8) {
        piece('paint_yellow', alongX ? .48 : .11, .012, alongX ? .11 : .48,
          x + (alongX ? offset : 0), y, z + (alongX ? 0 : offset));
      }
    }
    function deck(x0, z0, x1, z1, y) {
      solid('steel_worn', x0, y - .22, z0, x1, y, z1, 'metal', { noNav: true });
      for (let x = x0 + .42; x < x1 - .25; x += .72) {
        piece('steel_dark', .04, .012, z1 - z0 - .13, x, y + .005, (z0 + z1) / 2);
      }
      for (let x = x0 + .41; x < x1 - .3; x += 4.2) {
        piece('steel_dark', .2, y - .28, .24, x, (y - .28) / 2, z0 + .2);
        piece('steel_dark', .2, y - .28, .24, x, (y - .28) / 2, z1 - .2);
      }
    }
    function steps(x, z, length, width, y0, y1, axis = 'x', visual = true) {
      const count = Math.ceil(Math.abs(y1 - y0) / .23);
      for (let i = 0; i < count; i++) {
        const from = length * i / count;
        const to = length * (i + 1) / count;
        const height = y0 + (y1 - y0) * (i + (y1 > y0 ? 1 : 0)) / count;
        const bounds = axis === 'x' ? [x + from, height - .26, z, x + to, height, z + width] :
          [x, height - .26, z + from, x + width, height, z + to];
        if (visual) solid('steel_worn', ...bounds, 'metal', { noNav: true });
        else col(...bounds, 'metal', { noNav: true });
      }
    }
    function perimeter(x0, z0, x1, z1, labelText) {
      for (const z of [z0, z1]) {
        solid('concrete_dirty', x0, 0, z - .19, x1, 1.54, z + .19, 'concrete');
        piece('steel_galv', x1 - x0, .08, .46, (x1 + x0) / 2, 1.54, z);
        for (let x = x0 + 1; x < x1; x += 3.8) piece('steel_dark', .18, 1.8, .24, x, .9, z);
      }
      for (const x of [x0, x1]) solid('concrete_dirty', x - .19, 0, z0, x + .19, 1.55, z1, 'concrete');
      label(labelText, x0 + 4, 1.15, z0 + .22, 3.8);
    }
    function crate(x, z, w, h, d, y = 0, material = 'wood_pallet') {
      solid(material, x - w / 2, y, z - d / 2, x + w / 2, y + h, z + d / 2, 'wood');
      for (const offset of [-.38, .38]) {
        piece('steel_worn', .08, h + .06, d + .035, x + offset * w, y + h / 2, z);
      }
      piece('paint_white', .18, .12, .014, x + .18 * w, y + h * .65, z + d / 2 + .01);
    }
    function cargo(x0, z0, x1, z1, metal = 'corrugated_roof', top = 2.65) {
      solid(metal, x0, 0, z0, x1, top, z1);
      for (const z of [z0 - .018, z1 + .018]) {
        for (let x = x0 + .15; x < x1; x += .28) piece('steel_worn', .055, top, .052, x, top / 2, z);
      }
      for (const y of [.14, top - .13]) {
        piece('steel_dark', x1 - x0 + .11, .12, z1 - z0 + .14, (x0 + x1) / 2, y, (z0 + z1) / 2);
      }
    }
    function shed(name, x0, z0, x1, z1, y = 0) {
      solid('concrete_dirty', x0, y, z0, x1, y + 2.6, z0 + .18, 'concrete');
      solid('corrugated_roof', x0 - .15, y + 2.65, z0 - .23, x1 + .15, y + 2.8, z1 + .19);
      for (const x of [x0, x1]) {
        solid('steel_dark', x - .08, y, z0, x + .08, y + 2.68, z0 + .22);
        solid('steel_dark', x - .08, y, z1 - .15, x + .08, y + 2.68, z1 + .12);
      }
      for (let x = x0 + 1; x < x1; x += 1.25) {
        piece('steel_worn', .075, .07, z1 - z0, x, y + 2.66, (z0 + z1) / 2);
      }
      label(name, (x0 + x1) / 2, y + 2.41, z1 + .018, Math.min(x1 - x0 - .5, 3.5));
      interiorBoxes.push({
        min: point(x0, z0, y), max: point(x1, z1, y + 2.78),
      });
    }
    const glows = Object.fromEntries(Object.entries(paint).map(([name, color]) => [name, G.mats.emissive(color, 1.25)]));
    function lamp(x, z, y = 3.4, color = 'warm', powered = true) {
      const stand = group('work-light', moving, x, 0, z);
      cyl('steel_dark', .07, y, x, y / 2, z, { parent: scenery });
      piece('steel_dark', .46, .22, .31, 0, y, 0, stand);
      piece(glows[color], .39, .071, .22, 0, y - .118, .03, stand);
      const light = new THREE.PointLight(paint[color], powered ? 14 : 0, 10, 2);
      light.position.set(0, y - .27, 0);
      stand.add(light);
      return light;
    }
    function control(id, text, at, { yaw = 0, hint = true, low = false } = {}) {
      const { x, y, z } = at;
      const unit = group(id, moving, x, y, z);
      unit.rotation.y = yaw;
      const h = low ? .51 : .95;
      piece('steel_dark', .078, h, .075, 0, h / 2, 0, unit);
      piece('steel_galv', .45, .25, .33, 0, h, 0, unit);
      piece('polymer_black', .361, .169, .018, 0, h + .01, .17, unit);
      const screen = piece(glows.warm, .29, .05, .024, 0, h + .036, .181, unit);
      piece('paint_orange', .069, .04, .031, .111, h - .035, .186, unit);
      if (hint) label(text, 0, h + .34, 0, Math.min(1.85, Math.max(.7, text.length * .095)), 0, unit);
      switches[id] = { unit, screen, glow: tint => { screen.material = glows[tint]; } };
      points[id] = at;
      return unit;
    }
    function actor(id, at, coat = 0xc27037, seated = false, variation = 0) {
      const { x, y, z } = at;
      const figure = group(id, moving, x, y, z);
      const cloth = new THREE.MeshStandardMaterial({ color: coat, roughness: .94 });
      const skin = new THREE.MeshStandardMaterial({
        color: [0x96684e, 0x69483b, 0xb3856b][variation % 3], roughness: .81,
      });
      const core = group('body', figure);
      const limbMaterial = G.mats.get('steel_dark');
      const sphere = new THREE.SphereGeometry(1, 12, 7);
      const oval = (material, x, y, z, sx, sy, sz, parent) => {
        const mesh = new THREE.Mesh(sphere, material);
        mesh.position.set(x, y, z);
        mesh.scale.set(sx, sy, sz);
        mesh.castShadow = true;
        parent.add(mesh);
      };
      piece(cloth, .388, .43, .241, 0, 1.17, 0, core);
      for (const x of [-.095, .095]) piece('paint_white', .024, .32, .016, x, 1.23, .126, core);
      piece(limbMaterial, .321, .063, .25, 0, .985, 0, core);
      oval(skin, 0, 1.52, .018, .098, .132, .1, core);
      oval(limbMaterial, 0, 1.598, -.001, .101, .065, .102, core);
      piece(limbMaterial, .14, .018, .046, 0, 1.56, .102, core);
      const limbs = [-1, 1].map(sign => {
        const hip = group('hip', core, sign * .09, .95, 0);
        const arm = group('shoulder', core, sign * .207, 1.35, 0);
        piece(limbMaterial, .148, .8, .155, 0, -.42, 0, hip);
        piece('polymer_black', .151, .121, .246, 0, -.863, .044, hip);
        piece(cloth, .119, .36, .127, 0, -.163, 0, arm);
        piece(skin, .079, .116, .077, 0, -.378, .014, arm);
        return { hip, arm, sign };
      });
      figure.userData.pose = (age, walk) => {
        core.position.y = seated ? -.31 : Math.abs(Math.sin(age * 7)) * (walk ? .039 : .009);
        core.rotation.x = seated ? .12 : walk ? .07 : .028;
        for (const { hip, arm, sign } of limbs) {
          const swing = walk ? sign * .45 * Math.sin(age * 8) : 0;
          hip.rotation.x = seated ? -.88 : swing;
          arm.rotation.x = -swing - (seated ? .6 : .03);
          arm.rotation.z = sign * .11;
        }
      };
      figure.userData.pose(0, false);
      objects[id] = figure;
      points[id] = at;
      return figure;
    }
    function boat(name, x, z, y, length = 8, tint = 'steel_worn') {
      const boat = group(name, moving, x, y, z);
      piece(tint, length * .78, .94, 3.35, -.32, -.23, 0, boat);
      piece('steel_dark', length * .81, .14, 3.39, -.35, -.59, 0, boat);
      const prow = piece(tint, 2.3, .8, 2.37, length * .35, -.2, 0, boat);
      prow.rotation.y = Math.PI / 4;
      piece('steel_galv', length * .82, .13, 3.13, -.29, .3, 0, boat);
      for (const z of [-1.58, 1.58]) piece('steel_dark', length * .78, .32, .08, -.35, .43, z, boat);
      piece('corrugated_roof', 1.86, 1.51, 2.27, .87, 1.03, 0, boat);
      piece('glass_dirty', .023, .57, 1.97, 1.808, 1.304, 0, boat);
      for (const z of [-1.148, 1.148]) piece('glass_dirty', 1.44, .58, .024, .86, 1.29, z, boat);
      piece('steel_dark', 2.12, .16, 2.54, .8, 1.85, 0, boat);
      piece('steel_dark', .08, .92, .08, .8, 2.34, 0, boat);
      piece(glows.red, .12, .12, .12, .8, 2.833, -.14, boat);
      piece(glows.teal, .12, .12, .12, .8, 2.833, .14, boat);
      for (let x = -length * .39; x < length * .17; x += 1.25) {
        for (const side of [-1, 1]) {
          cyl('polymer_black', .23, .15, x, -.035, side * 1.7, { axis: 'z', parent: boat });
          piece('paint_white', .7, .054, .031, x, .085, side * 1.693, boat);
        }
      }
      objects[name] = boat;
      return boat;
    }
    function gate(id, x0, y0, z0, x1, y1, z1) {
      const unit = group(id, moving, (x0 + x1) / 2, y0, (z0 + z1) / 2);
      const w = x1 - x0, h = y1 - y0, d = z1 - z0;
      piece('steel_worn', w, h, d, 0, h / 2, 0, unit);
      piece('hazard_stripes', w + .025, .17, d + .025, 0, h - .15, 0, unit);
      for (let y = .22; y < h - .14; y += .22) {
        piece('steel_galv', w + .03, .035, d + .025, 0, y, 0, unit);
      }
      objects[id] = unit;
      unit.userData.closedY = y0;
      unit.userData.bounds = { min: point(x0, z0, y0), max: point(x1, z1, y1) };
      return unit;
    }
    function addPoints(labels) {
      for (const [name, position] of Object.entries(labels)) points[name] = positions([position])[0];
    }
    function path(name, route) { routes[name] = positions(route); }
    return {
      point, positions, piece, solid, rail, label, striped, deck, steps, perimeter, crate, cargo, shed, lamp, control,
      actor, boat, gate, addPoints, path, points, objects, switches, routes, interiorBoxes, root, scenery, moving,
    };
  }

  function drydock(set) {
    const { piece, solid, rail, label, striped, deck, steps, perimeter, crate, cargo, shed, lamp,
      control, actor, boat, addPoints, path, objects, moving, root, point } = set;
    perimeter(-101, -21, -32, 19, 'OLD DRYDOCK');
    solid('concrete_dirty', -98, -.07, -19, -33, .026, 17, 'concrete');
    shed('PUMP HOUSE', -98, 5.1, -89, 11.3);
    shed('TUG SERVICE', -68, -18.65, -54, -13.8);
    cargo(-89, -3.8, -81, .2, 'steel_worn');
    cargo(-67, 5.5, -61.3, 12.8);
    cargo(-53, -15.8, -48, -12.2, 'steel_worn');
    for (const [x, z] of [[-94, 16], [-82, 5], [-73, -10], [-58, -15], [-39, -7]]) crate(x, z, 1.58, 1.14, .9);
    const tug = boat('tug-on-blocks', -70, .3, 2.15, 13, 'paint_orange');
    tug.rotation.y = -.09;
    solid('steel_dark', -77.3, 0, -1.8, -62.3, 2.62, 2.1);
    for (let x = -76.4; x < -64; x += 2.3) {
      piece('steel_dark', .91, .89, 3.2, x, .55, .09);
      piece('paint_yellow', .97, .1, 3.22, x, .64, .09);
    }
    striped(-94, 14.1, 19);
    striped(-70, -7.3, 21);
    for (const [id, title, x, z] of [
      ['tug-drydock', 'A / DOCK', -82.6, 8.4], ['tug-south-lock', 'B / LOCK', -61.4, -11.8],
      ['tug-outer-roads', 'C / ROADS', -43.9, -6.1],
    ]) control(id, title, point(x, z));
    lamp(-83, 7.7); lamp(-60.4, -12); lamp(-44, -6.8, 3, 'teal');
    steps(-46.8, -1.3, 7.6, 2.63, .026, 3.05, 'z');
    deck(-46.8, 6.3, -34.2, 11.2, 3.05);
    rail(-44.14, 6.34, -34.2, 6.34, 3.05);
    rail(-46.8, 11.2, -34.2, 11.2, 3.05);
    rail(-46.8, 6.3, -46.8, 11.2, 3.05);
    shed('UPPER LANDING', -39.4, 6.52, -34.4, 10.68, 3.05);
    lamp(-35.1, 10.1, 5.45, 'teal');
    label('HIGH GROUND +3.05', -45.48, 2.78, 5.85, 2.3, Math.PI);
    actor('flood-worker', point(-44.9, 3.31, 1.84), 0xce7433, true);
    addPoints({ start: [-96, 14, .026], stair: [-45.5, -.72, .26], landing: [-45.4, 8.13, 3.05], exit: [-35.65, 9.47, 3.05] });
    const water = new set.root.constructor();
    water.name = 'rising-drydock-water';
    const material = new set.materials.MeshStandardMaterial({
      color: 0x263f43, roughness: .24, metalness: .4, opacity: .78, transparent: true, depthWrite: false,
    });
    piece(material, 68.54, .037, 39.54, -66.5, 0, -1, water);
    const foamMaterial = new set.materials.MeshBasicMaterial({ color: 0x9cbbc0, transparent: true, opacity: .28 });
    for (let i = 0; i < 23; i++) {
      const x = -96 + (i * 11 % 57), z = -19 + (i * 19 % 34);
      piece(foamMaterial, 1.7 + (i % 7) * .35, .011, .045, x, .028, z, water);
    }
    water.visible = false;
    moving.add(water);
    objects.flood = water;
    path('intro', [[-100, 15, 1], [-97.4, 14.9, .4], [-96, 14, .026]]);
    path('outro', [[-35.65, 9.47, 3.05], [-34.8, 9.56, 3.9], [-33.4, 10.25, 6.2]]);
    return { yaw: -Math.PI / 2 };
  }

  function tidegate(set) {
    const { piece, solid, rail, label, striped, deck, steps, perimeter, crate, shed, lamp,
      control, actor, boat, gate, addPoints, path, point, objects, moving } = set;
    perimeter(-96, -17, -22, 17, 'SOUTH TIDE GATE');
    shed('LOCK OFFICE', -95, 8.6, -84, 14.1);
    shed('LEE SHELTER', -78, 5.1, -72.6, 9.6);
    solid('concrete_dirty', -88, 0, -16.65, -82.3, 5.15, 5.5, 'concrete');
    solid('concrete_dirty', -88, 0, 15.1, -82.3, 5.15, 16.9, 'concrete');
    gate('tide-shutter', -83.4, 0, 5.5, -83.1, 3.1, 15.1);
    control('lock-control', 'LOCK CONTROL', point(-85.15, 10.2));
    striped(-82.2, 10.5, 36);
    solid('concrete_dirty', -80, 0, -.4, -51.2, 1.51, .1, 'concrete');
    solid('concrete_dirty', -70.2, 0, 14.7, -62.8, 1.52, 15.3, 'concrete');
    solid('concrete_dirty', -64.05, 0, 2.1, -62.8, 1.65, 8.9, 'concrete');
    solid('concrete_dirty', -63.9, 0, 12.15, -62.8, 2, 17, 'concrete');
    gate('wind-latch', -63.9, 0, 8.9, -63.65, 2.38, 12.15);
    control('gust-latch', 'LEE LATCH', point(-65.1, 10.72), { yaw: -Math.PI / 2 });
    lamp(-65.9, 8.4, 3, 'blue');
    for (const x of [-76, -69, -59]) {
      const flag = piece('paint_orange', .034, .35, 1.25, x, 2.11, 14.37, moving);
      flag.userData.restZ = flag.position.z;
      objects['flag-' + x] = flag;
      piece('steel_galv', .056, 2.35, .056, x, 1.175, 15);
    }
    const barge = boat('loose-barge', -54, 15.2, .56, 12, 'steel_worn');
    barge.rotation.y = Math.PI / 2;
    solid('concrete_dirty', -53.1, 0, -16.9, -51.2, 2.35, -3.25, 'concrete');
    solid('concrete_dirty', -53.1, 0, .4, -51.2, 2.35, 4.9, 'concrete');
    solid('concrete_dirty', -53.1, 0, 15.27, -51.2, 2.35, 17, 'concrete');
    gate('barge-wreck', -53.1, 0, 4.9, -51.2, 2.38, 15.27);
    gate('floodway-door', -53.1, 0, -3.25, -51.2, 2.4, .4);
    control('bypass-control', 'FLOODWAY', point(-55.2, -1.4));
    steps(-49.8, -3.27, 5.1, 3.85, 0, 1.62);
    deck(-44.7, -3.27, -30.3, .58, 1.62);
    rail(-44.68, -3.27, -30.31, -3.27, 1.62);
    rail(-44.68, .58, -30.31, .58, 1.62);
    steps(-30.3, -3.27, 4.35, 3.85, 1.62, 0);
    shed('EAST LOCK / RELIEF', -36.7, 4, -23.4, 12.8);
    crate(-38, 11.3, 1.42, 1.3, 1);
    actor('mara-tidegate', point(-27.25, 8.2), 0x956a3f);
    lamp(-52.6, -4.21, 3, 'teal'); lamp(-25.74, 8, 3.1, 'warm');
    addPoints({ start: [-93, 12.6], bargeImpact: [-55.6, 9.9], detour: [-46, -1.2, 1.3],
      farBank: [-25.95, -.8], exit: [-24.05, 10.4] });
    path('bypass', [[-57.2, 7.8], [-57.2, -1.7], [-52, -1.7], [-50.6, -1.7], [-46, -1.7, 1.2],
      [-42, -1.7, 1.62], [-30.6, -1.7, 1.62], [-25.7, -1.7], [-25.7, 6.2], [-27.25, 8.2]]);
    path('intro', [[-95, 14.2, .8], [-93, 12.6]]);
    path('outro', [[-24.05, 10.4], [-23.7, 7.2, 1.1], [-22.3, 5.2, 4.2]]);
    return { yaw: -Math.PI / 2 };
  }

  function anchorage(set) {
    const { piece, solid, rail, label, striped, deck, steps, perimeter, crate, shed, lamp,
      control, actor, boat, gate, addPoints, path, point, objects, moving } = set;
    perimeter(-47.5, -23, 28.5, 24, 'OUTER ANCHORAGE');
    shed('PILOT SHED', -45.8, 9, -34.4, 16.6);
    crate(-39, 5.1, 1.5, 1.22, 1.16);
    control('pilot-radio', 'PILOT RADIO', point(-39.6, 14.2));
    solid('concrete_dirty', -33, 0, -22.7, -29.8, 2.28, 4.15, 'concrete');
    solid('concrete_dirty', -33, 0, 8.9, -29.8, 2.28, 23.9, 'concrete');
    gate('pilot-gate', -32, 0, 4.15, -31.72, 2.8, 8.9);
    rail(-29.8, 3.9, -15.1, 3.9);
    rail(-29.8, 9.1, -15.1, 9.1);
    striped(-29.6, 6.61, 13.8);
    steps(-15.2, 3.88, 10.6, 5.23, 0, 2.35, 'x', false);
    const slope = piece('steel_worn', 10.9, .155, 5.23, -9.91, 1.10, 6.495, moving);
    slope.rotation.z = Math.atan2(2.35, 10.6);
    for (let x = -14.75; x < -5; x += .51) {
      piece('steel_dark', .079, .032, 5.22, x, (x + 15.2) * 2.35 / 10.6 + .036, 6.495, moving);
    }
    for (const z of [3.88, 9.11]) {
      for (const y of [.48, 1.02]) {
        const railing = piece('steel_worn', 10.9, .069, .08, -9.91, 1.17 + y, z);
        railing.rotation.z = slope.rotation.z;
      }
      for (let x = -15; x < -4.6; x += 1.3) {
        const y = (x + 15.2) * 2.35 / 10.6;
        piece('steel_galv', .075, 1.08, .075, x, y + .54, z);
        solid('steel_dark', x - .04, y, z - .04, x + .04, y + 1.08, z + .04);
      }
    }
    deck(-4.6, 3.88, 13.1, 9.11, 2.35);
    rail(-4.58, 3.88, 4.3, 3.88, 2.35);
    rail(-4.58, 9.11, -.6, 9.11, 2.35);
    rail(6.7, 9.11, 13.1, 9.11, 2.35);
    const cutter = boat('pilot-cutter', -1, 16, 1.15, 10, 'steel_galv');
    cutter.rotation.y = -.3;
    shed('FORWARD MUSTER / A', -3.9, 4.2, 4.05, 8.65, 2.35);
    control('approach-boat', 'BOAT WINCH', point(-2.6, 7.7, 2.35));
    control('muster-a', 'MUSTER A', point(2.5, 7.65, 2.35));
    deck(4.22, -5.4, 13.1, 3.88, 2.35);
    rail(4.22, -5.4, 4.22, 3.68, 2.35);
    rail(4.25, -5.4, 13.1, -5.4, 2.35);
    shed('MIDSHIP MUSTER / B', 4.55, -4.95, 11.75, -.74, 2.35);
    control('muster-b', 'MUSTER B', point(8.2, -1.43, 2.35));
    steps(13.1, 4.06, 5.3, 2.78, 2.35, 0);
    gate('ladder-wreck', 12.74, 0, 3.81, 13.06, 4.32, 7);
    gate('crane-route', 12.73, 2.35, -4.95, 13.11, 4.45, -.68);
    deck(13.1, -4.95, 21.2, -.68, 2.35);
    steps(21.2, -4.95, 6.7, 4.27, 2.35, 0);
    rail(13.15, -4.95, 21.2, -4.95, 2.35);
    rail(13.15, -.68, 21.2, -.68, 2.35);
    solid('steel_dark', 12.95, 0, -.6, 14, 7.8, .35);
    const crane = piece('steel_worn', 11.8, .46, .52, 16.9, 7.87, 2.95, moving);
    crane.rotation.y = -1.28;
    objects.crane = crane;
    piece('steel_worn', 1.4, .95, 1.3, 13.56, 7.84, .32);
    for (let y = 1.2; y < 7.6; y += 1.1) {
      const brace = piece('paint_orange', .07, 1.44, .065, 13.407, y, .385);
      brace.rotation.z = (Math.round(y) % 2 ? 1 : -1) * .62;
    }
    shed('AFT MUSTER / C', 20.7, 9.4, 28, 14.9);
    control('muster-c', 'MUSTER C', point(23.25, 13.6));
    control('departure-radio', 'HEAD COUNT', point(23.2, 19.65));
    for (const [id, count, x, y, z] of [['a', 5, -.16, 2.35, 4.64], ['b', 6, 6.24, 2.35, -4.5], ['c', 6, 21.46, 0, 10.23]]) {
      for (let i = 0; i < count; i++) {
        const coat = [0xc38948, 0x606851, 0x8b6450, 0xb96442][i % 4];
        const worker = actor('muster-' + id + '-' + i, point(x + i % 3 * .93, z + Math.floor(i / 3) * .78, y), coat, i % 2 === 0, i);
        worker.rotation.y = .53 - i * .29;
      }
    }
    lamp(-38, 15.1); lamp(-3.6, 8.4, 5.2, 'teal'); lamp(8.4, -3.7, 5.2, 'warm');
    lamp(23.95, 14.2, 3.28, 'warm'); lamp(22.6, 19.79, 3.9, 'teal');
    addPoints({ start: [-45.4, 13.8], gangway: [-14.7, 6.6, .2], craneDetour: [18.1, -2.57, 2.35], aftDeck: [26.67, 2.35],
      exit: [24.1, 20.1] });
    path('high', [[-30.5, 6.63], [-16.1, 6.63], [-11.4, 6.63, .86], [-6.2, 6.63, 2.04],
      [-4.21, 6.63, 2.35], [-2.6, 7.7, 2.35], [2.5, 7.65, 2.35]]);
    path('detour', [[10.9, -2.35, 2.35], [15.6, -2.35, 2.35], [21.04, -2.35, 2.35],
      [25.1, -2.35, 1.12], [27.35, -2.35, .27], [27.1, 1.3], [27.1, 8.3], [23.25, 13.6]]);
    path('intro', [[-46.8, 16.1, .75], [-45.4, 13.8]]);
    path('outro', [[24.1, 20.1], [26.81, 21, 1.25], [30.14, 23.2, 2.1]]);
    return { yaw: -Math.PI / 2 };
  }

  function returnHarbor(set) {
    const { piece, solid, rail, label, striped, perimeter, crate, cargo, shed, lamp, control, actor,
      boat, gate, addPoints, path, point, objects } = set;
    perimeter(-92, -17.5, 21.5, 22, 'RETURN HARBOR');
    solid('concrete_dirty', -91.6, 0, -17, 21.1, .026, 21.6, 'concrete');
    shed('TRIAGE / WEST', -90.65, 7.3, -81.8, 16.5, .026);
    actor('nurse', point(-84.6, 14.6, .026), 0x557a76, false, 2);
    const patientCutter = boat('incoming-rescue-boat', -86.2, 19, .07, 8.2, 'paint_orange');
    patientCutter.rotation.y = Math.PI;
    label('RESCUE', -85.6, 1.76, 16.53, 1.6, Math.PI);
    for (const [x0, z0, x1, z1] of [
      [-90, -16.4, -70, 4.8], [-79, 9.6, -69, 13.2], [-62.5, 2.1, -56, 20.55],
      [-52, -16.8, -40, -8.6], [-41, -3.7, -32, 20.9], [-31, -16.8, -22.6, -8.8],
      [-17.5, -16.4, -12.9, 6.5], [-5.6, 10.9, 7.3, 19.1],
    ]) cargo(x0, z0, x1, z1, 'steel_worn');
    shed('PUMP BREAKER', -55.56, -7.6, -48.7, -1.65, .026);
    shed('MEDICAL SUPPLY', -32.7, -8.1, -23.3, -3.6, .026);
    shed('RECEIVING / EAST', 10.2, .1, 20.45, 9.1, .026);
    solid('concrete_dirty', -68.2, .026, -16.9, -66.8, 2.1, 5.8, 'concrete');
    solid('concrete_dirty', -68.2, .026, 8.9, -66.8, 2.1, 21.6, 'concrete');
    gate('work-gate-a', -67.82, .026, 5.8, -67.56, 2.56, 8.9);
    control('light-a', 'WEST FEED', point(-70.5, 7.08, .026));
    solid('concrete_dirty', -45.82, .026, -17.18, -44.48, 2.12, -8.54, 'concrete');
    solid('concrete_dirty', -45.82, .026, -3.74, -44.48, 2.12, 21.6, 'concrete');
    gate('work-gate-b', -45.44, .026, -8.54, -45.19, 2.5, -3.74);
    control('light-b', 'PUMP FEED', point(-49.82, -5.64, .026));
    solid('concrete_dirty', -8.96, .026, -17.18, -7.7, 2.12, 7.41, 'concrete');
    solid('concrete_dirty', -8.96, .026, 11.47, -7.7, 2.12, 21.6, 'concrete');
    gate('work-gate-c', -8.73, .026, 7.41, -8.45, 2.46, 11.47);
    control('light-c', 'EAST FEED', point(-10.64, 9.49, .026));
    control('triage-ledger', 'ARRIVAL REGISTER', point(17.6, 5.3, .026));
    const lines = [
      ['west', [[-80.7, 14], [-80, 7.22], [-72.3, 7.22], [-69.2, 7.22]]],
      ['pumps', [[-65.4, 7.22], [-63.91, 7.22], [-63.9, -.92], [-56.4, -.92], [-55.3, -5.62], [-47.25, -5.62]]],
      ['cross', [[-43.34, -6.09], [-20, -6.09], [-19.85, 9.45], [-11.3, 9.45], [-9.65, 9.45]]],
      ['triage', [[-6.63, 9.45], [8.87, 9.45], [9, 5.69], [16.33, 5.69], [17.6, 5.3]]],
    ];
    for (const [name, route] of lines) path(name, route.map(([x, z]) => [x, z, .026]));
    for (const [id, x, z, tint] of [
      ['west', -66.2, 6.4, 'teal'], ['pumps', -43.25, -8.1, 'warm'], ['cross', -6.8, 9.9, 'teal'],
    ]) objects['light-' + id] = lamp(x, z, 3.28, tint, false);
    lamp(-87.2, 13.34, 3.18, 'warm');
    lamp(19.3, 5.4, 2.45, 'teal');
    for (const [x, z] of [[-82, 16.8], [-54, -3.1], [-24, -7.7], [11.9, 1.2]]) {
      crate(x, z, .84, .61, .66);
      piece('paint_white', .29, .049, .016, x, .44, z + .337);
    }
    striped(-68.6, 7.24, 3.1); striped(-46.6, -6.1, 3); striped(-9.5, 9.47, 4);
    for (let x = -84; x < 15; x += 3.4) piece('paint_white', .16, .013, .31, x, .043, 20.91);
    addPoints({ start: [-90.45, 14.4, .026], exit: [19.1, 5.55, .026] });
    path('intro', [[-91, 17.33, .73], [-90.45, 14.4, .026]]);
    path('outro', [[19.1, 5.55, .026], [18.4, 7.49, .76], [19.6, 8.75, 2.6]]);
    return { yaw: -Math.PI / 2, atmosphere: 'night' };
  }

  function nightRecord(set) {
    const { piece, solid, rail, label, striped, deck, steps, perimeter, crate, cargo, shed, lamp,
      control, gate, addPoints, path, point, objects, moving } = set;
    perimeter(-75.5, -20.7, 13.6, 20.6, 'NIGHT WATCH / SIGNAL TOWER');
    shed('TRANSFORMER RECESS', -74.1, 9.8, -65.1, 16.33);
    cargo(-67, -7.8, -56.3, 3.8, 'steel_worn');
    cargo(-57.35, 10.2, -49, 18.85);
    cargo(-45, -16.7, -33.18, -6, 'steel_worn');
    cargo(-38.05, 10.22, -31.01, 16.64);
    cargo(-39, .5, -35, 5.21, 'steel_worn');
    for (const [x, z] of [[-68, 14.2], [-53, -7.7], [-54.5, 8.7], [-43.9, 13.3], [-27, -13]]) crate(x, z, 1.2, 1.05, 1);
    const wallX = -23.7, west = -22.9, east = 3.1;
    for (const [z0, z1] of [[-20.5, -13.7], [-10.7, -.95], [2.9, 12.2], [15.8, 20.4]]) {
      solid('concrete_dirty', wallX - .65, 0, z0, wallX + .28, 4.8, z1, 'concrete');
    }
    gate('watch-door', wallX - .45, 0, -.95, wallX - .14, 3.1, 2.9);
    gate('cable-door', wallX - .45, 0, 12.2, wallX - .14, 1.31, 15.8);
    gate('service-door', wallX - .45, 2.42, -13.7, wallX - .14, 5.1, -10.7);
    solid('steel_dark', wallX - .64, 1.31, 12.2, wallX + .32, 4.8, 15.8);
    solid('steel_dark', wallX - .64, 0, -13.7, wallX + .32, 2.42, -10.7);
    solid('steel_dark', wallX - .64, 3.1, -.95, wallX + .32, 4.8, 2.9);
    steps(-32.2, -13.88, 6.1, 3.33, 0, 2.42);
    deck(-26.1, -13.88, -15.38, -10.55, 2.42);
    rail(-26.08, -13.88, -15.4, -13.88, 2.42);
    rail(-26.08, -10.55, -15.4, -10.55, 2.42);
    steps(-15.38, -13.88, 5.9, 3.33, 2.42, 0);
    piece('hazard_stripes', 1.7, .062, 3.38, wallX - 1.8, .037, 13.93);
    control('entry-watch', 'WATCH FIRE DOOR', point(-26.55, 1.06));
    control('entry-cable', 'CABLE SCUTTLE', point(-26.49, 14.33), { low: true });
    control('entry-service', 'SERVICE KEYBOX', point(-25.63, -12.22, 2.42));
    label('SIGNAL TOWER', wallX - .66, 4.29, 1.08, 3.8, -Math.PI / 2);
    shed('WATCH FLOOR', west, -6.9, -13.1, 4.45);
    shed('LOCKER 12', -10.05, 9.2, -.9, 15.2);
    control('crack-report', 'INSPECTION LOG', point(-18.23, 2.48));
    control('transfer-order', 'CARGO ORDER', point(-3.7, 13.4));
    control('search-cancelled', 'SEARCH CHANNEL', point(-3.55, -8.54, 2.84));
    control('transport-intercept', 'SIGNAL PRINTER', point(-9.5, -10.72));
    shed('SIGNAL SHOP', -13.15, -15.49, -6.38, -8.4);
    solid('steel_worn', -6.64, 0, -13.67, -5.9, 2.82, -7.98);
    deck(-6.39, -13.67, east, -5.85, 2.84);
    rail(-6.38, -13.67, east, -13.67, 2.84);
    rail(-6.38, -5.85, east, -5.85, 2.84);
    rail(-6.38, -13.64, -6.38, -5.88, 2.84);
    rail(east, -13.67, east, -11.86, 2.84);
    rail(east, -8.66, east, -5.85, 2.84);
    steps(3.1, -11.86, 6.87, 3.22, 2.84, 0);
    shed('RECORDS / ASSEMBLY', -.71, -13.42, 2.72, -8.43, 2.84);
    for (const [id, stamp, x] of [
      ['search-cancelled', '05:46', -.08], ['crack-report', '05:21', .67],
      ['transport-intercept', '06:13', 1.42], ['transfer-order', '05:28', 2.17],
    ]) control('order-' + id, stamp, point(x, -12.63, 2.84), { low: true });
    for (const [id, x, z] of [
      ['mast-a', -2.15, -10.7], ['mast-b', -4.63, -7.1], ['mast-c', 2.44, -6.65],
    ]) {
      const mast = piece('steel_dark', .23, 9.36, .23, x, 7.49, z, moving);
      objects[id] = mast;
      for (let h = 6; h < 12; h += 1.26) piece('steel_galv', 1.45, .054, .054, x, h, z);
    }
    lamp(-31.4, -13.48, 3.82, 'blue'); lamp(-26.4, 13.54, 2.51, 'warm'); lamp(-25.7, 1.95);
    lamp(-19.07, 2.01, 3, 'teal'); lamp(-8, -10.7, 3.87, 'blue'); lamp(.52, -11.9, 5.09, 'teal');
    lamp(10.81, -7.23, 3.7, 'warm');
    control('record-upload', 'RECORD TRANSMITTER', point(11.35, -9.2));
    striped(-44, 7.13, 19.2);
    addPoints({ start: [-72.9, 14.55], fork: [-34.52, 6.72], console: [1.6, -11.4, 2.84],
      towerStairs: [9.95, -10.15], exit: [11.92, -9.12] });
    path('watch', [[-60.3, 8.2], [-47.3, 7.14], [-35, 7.02], [-28.75, 1.22], [-25.1, 1.09], [-19.04, 1.08]]);
    path('cable', [[-60.3, 8.2], [-47.3, 7.14], [-40.1, 17.4], [-27.18, 14.12], [-23.66, 14.02], [-19.04, 14]]);
    path('service', [[-60.3, 8.2], [-47.3, 7.14], [-47, -9.8], [-31.86, -12.3, .22], [-26.62, -12.2, 2.2],
      [-22.23, -12.2, 2.42], [-15.62, -12.2, 2.42], [-9.58, -12.2, .23]]);
    path('intro', [[-74.8, 16.51, 1.23], [-72.9, 14.55]]);
    path('outro', [[11.92, -9.12], [10.7, -10.32, .95], [7.4, -12.49, 3.7]]);
    return { yaw: -Math.PI / 2, atmosphere: 'night' };
  }

  function lastPilot(set) {
    const { piece, solid, rail, label, striped, deck, steps, perimeter, crate, cargo, shed, lamp,
      control, actor, boat, gate, addPoints, path, point, objects } = set;
    perimeter(-100.3, -24, -8.1, 23, 'PILOT CORRIDOR / EAST BERTH');
    shed('PILOT OFFICE', -99, 7.9, -88.4, 14.8);
    actor('harris', point(-70.26, 9.73), 0x54666c, false, 1);
    cargo(-87.8, -21.3, -77.3, -5.3);
    cargo(-86.2, 9.61, -82.1, 20.4, 'steel_worn');
    shed('BRIDGE HOUSE', -72.8, 12.2, -66.2, 16.7);
    crate(-74.8, 5.8, 1.35, 1.31, 1.13);
    control('causeway-call', 'EAST BERTH SIGNAL', point(-69.55, 9.98));
    const ferry = boat('crossing-freighter', -55.18, 20.5, -.14, 18, 'steel_worn');
    ferry.rotation.y = Math.PI / 2;
    solid('concrete_dirty', -61.95, 0, -23.9, -60.2, 2.65, -11.75, 'concrete');
    solid('concrete_dirty', -61.95, 0, -7.18, -60.2, 2.65, 5.9, 'concrete');
    solid('concrete_dirty', -61.95, 0, 11.48, -60.2, 2.65, 16.4, 'concrete');
    solid('concrete_dirty', -61.95, 0, 20.48, -60.2, 2.65, 22.8, 'concrete');
    gate('causeway-wreck', -61.95, 0, 5.9, -60.2, 3.15, 11.48);
    gate('upper-bridge-door', -61.49, 2.72, -11.75, -61.16, 4.97, -7.18);
    gate('worker-door', -61.49, 0, 16.4, -61.16, 2.85, 20.48);
    const gapDeck = piece('steel_worn', 8.6, .27, 5.48, -58.68, .121, 8.7);
    objects.causeway = gapDeck;
    control('pick-bridge', 'BRIDGE DRIVE', point(-64.16, -9.73, 2.72));
    control('rescue-workers', 'UNLOCK SHELTER', point(-65.05, 18.57));
    actor('stranded-worker-1', point(-59.1, 17.34), 0x996b4c, true, 1);
    actor('stranded-worker-2', point(-58.32, 19.62), 0xc17638, true, 2);
    actor('stranded-worker-3', point(-57.3, 17.21), 0x7f7762, true, 0);
    control('open-worker-route', 'SERVICE LOCK', point(-54.4, 18.89));
    steps(-73.58, -11.9, 7.5, 4.82, 0, 2.72);
    deck(-66.08, -11.9, -33.1, -7.08, 2.72);
    rail(-66.06, -11.9, -33.12, -11.9, 2.72);
    rail(-66.06, -7.08, -33.12, -7.08, 2.72);
    steps(-33.1, -11.9, 7.49, 4.82, 2.72, 0);
    solid('concrete_dirty', -58.75, 0, 15.1, -38.1, 2.5, 15.47, 'concrete');
    solid('concrete_dirty', -57.8, 0, 21.25, -43.7, 1.64, 21.57, 'concrete');
    gate('service-lock', -53.08, 0, 15.47, -52.82, 2.85, 21.28);
    shed('WORKERS / MUSTER', -51.4, 16.01, -44.1, 20.7);
    cargo(-39.1, 9.7, -31.1, 15.6, 'steel_worn');
    cargo(-27, -5.8, -17.6, 4);
    shed('PILOT TRANSFER', -18.13, 12.67, -9.9, 20.95);
    control('harris-handoff', 'PILOT TRANSFER', point(-12.66, 18.77));
    lamp(-91, 14.32); lamp(-68.65, 8.38, 3.2, 'blue');
    lamp(-62.2, -9.47, 5.3, 'teal'); lamp(-57.9, 18.3, 3, 'warm'); lamp(-11.4, 18.62, 3.65, 'teal');
    striped(-86, 7.9, 15);
    addPoints({ start: [-97.6, 13.1], impact: [-58.6, 8.83], fork: [-68.4, 10.1],
      workerRamp: [-73.55, -9.8], exit: [-10.86, 18.9] });
    path('meet', [[-88.3, 13.5], [-88.2, 7.82], [-78.1, 7.82], [-70.26, 9.73]]);
    path('bridge', [[-74.9, 9.74], [-75.6, -9.5], [-73.34, -9.5, .23], [-66.2, -9.5, 2.72],
      [-63.94, -9.5, 2.72], [-58.8, -9.5, 2.72], [-46.1, -9.5, 2.72], [-33.2, -9.5, 2.72],
      [-25.78, -9.5, .23], [-16.25, -9.5], [-16.25, 9.21], [-17.2, 18.35], [-12.66, 18.77]]);
    path('workers', [[-65.3, 10.65], [-65.3, 18.6], [-62.53, 18.6], [-59.8, 18.6], [-54.96, 18.6],
      [-51.26, 18.6], [-43.43, 18.6], [-36.15, 19.15], [-25, 18.97], [-12.66, 18.77]]);
    path('intro', [[-98.72, 15.55, .72], [-97.6, 13.1]]);
    path('outro', [[-10.86, 18.9], [-9.48, 19.1, 1.48], [-8.81, 21.7, 3.37]]);
    return { yaw: -Math.PI / 2 };
  }

  function reopen(set, { berthStart, extraction }) {
    const { piece, lamp, label, control, actor, boat, addPoints, path, point } = set;
    const start = berthStart?.pos ?? point(19.1, -7.96);
    const exit = extraction?.pos ?? point(28.9, 19.4);
    const mara = actor('mara-reopen', point(19.8, -9.94), 0x956a3f);
    mara.rotation.y = -.81;
    const boots = new set.root.constructor();
    boots.name = 'dockwork-boots';
    boots.position.set(19.55, .785, -9.28);
    set.moving.add(boots);
    for (const x of [-.102, .102]) {
      piece('wood_dark', .159, .274, .17, x, .152, -.047, boots);
      piece('polymer_black', .169, .049, .285, x, .024, .009, boots);
      piece('wood_dark', .161, .112, .153, x, .089, .072, boots);
      for (let y = .13; y < .27; y += .039) piece('steel_dark', .108, .012, .014, x, y, .052, boots);
    }
    piece('steel_worn', .77, .734, .554, 19.55, .37, -9.28);
    set.objects.boots = boots;
    lamp(19.35, -9.75, 3.06, 'warm');
    label('BERTH 4 / OPEN', 19.62, 2.25, -9.21, 1.85);
    control('cast-off', 'BOW LINE', point(exit.x - .81, exit.z - .55, exit.y));
    lamp(exit.x - .51, exit.z - 1.1, 3.35, 'teal');
    const launch = boat('berth-launch', 32.27, exit.z + 1.2, -.72, 7.6, 'steel_galv');
    launch.rotation.y = Math.PI / 2;
    addPoints({ start: [start.x, start.z, start.y], boots: [19.31, -9.03], exit: [exit.x, exit.z, exit.y] });
    path('quay', [[21.15, -8.55], [26.6, -8.5], [28.1, -8.35], [27.93, -2.1], [27.79, .5],
      [28.42, 5.9], [28.4, 15], [exit.x - .81, exit.z - .55, exit.y]]);
    path('intro', [[start.x - 3.83, start.z + 1.8, .99], [start.x, start.z, start.y]]);
    path('outro', [[exit.x, exit.z, exit.y], [32.27, exit.z + .8, .47], [35.25, exit.z + 6.2, 1.3]]);
    return { yaw: berthStart?.yaw ?? -Math.PI / 2 };
  }

  const builds = [drydock, tidegate, anchorage, returnHarbor, nightRecord, lastPilot, reopen];
  const patrolLocations = {
    anchorage: [[18, 9.65, 7.2, 'gull']],
    'night-record': [[-19, 5.9, 6.8, 'gull']],
    'last-pilot': [[-45.8, 8.3, 7.8, 'gull']],
  };
  window.createPortContinuationLayout = (builder, vector, id, options = {}) => {
    const build = builds[ids.indexOf(id)];
    if (!build) return null;
    const set = createSet(builder, vector, id);
    set.materials = builder.THREE;
    const { yaw, atmosphere } = build(set, options);
    const { root, scenery, moving, points, objects, switches, routes, interiorBoxes } = set;
    const enemySpawns = (patrolLocations[id] ?? []).map(([x,z,y,type]) => ({ type, pos: vector(x,y,z) }));
    const supplyPoint = id === 'anchorage' ? points['pilot-radio'] :
      id === 'night-record' ? points['entry-watch'] : id === 'last-pilot' ? points.fork : null;
    const supplies = supplyPoint ? [{ id: id + '-field-ammo', pos: supplyPoint.clone().add(vector(-1.8,0,0)),
      rounds: 65 }] : [];
    return {
      id, model: root, scenery, moving, points, objects, switches, routes, atmosphere,
      playerStart: { pos: points.start, yaw },
      extraction: { pos: points.exit, radius: 1.75 },
      introPath: routes.intro,
      outroPath: routes.outro,
      interiorBoxes, enemySpawns, supplies, geometry: [],
    };
  };
})();
