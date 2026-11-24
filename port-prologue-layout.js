/* Headquarters scenery and the fictional Saltline rescue transport. */
(() => {
  function createPortTransportVisual({ THREE, mats }, parent) {
    const root = new THREE.Group();
    root.name = 'saltline-rescue-07';
    parent?.add(root);

    const group = (name, x, y, z) => {
      const node = new THREE.Group();
      node.name = name;
      node.position.set(x, y, z);
      root.add(node);
      return node;
    };
    const finish = (color, roughness = .58, metalness = .22) =>
      new THREE.MeshStandardMaterial({ color, roughness, metalness });
    const navy = finish(0x233343);
    const blueGrey = finish(0x465864, .43, .34);
    const ivory = finish(0xd4dad5, .55);
    const orange = finish(0xdc5c30, .43);
    const frame = finish(0x283740, .69);
    const panel = finish(0x5f6e71, .76);
    const padded = finish(0x4a4f3d, .99, 0);
    const glazing = new THREE.MeshStandardMaterial({ color: 0x7295a8, roughness: .16,
      metalness: .34, transparent: true, opacity: .36, depthWrite: false, side: THREE.DoubleSide });
    const rubber = mats.get('rubber');
    const steel = mats.get('steel_galv');
    const warm = mats.emissive(0xffc07b, 1.5);
    const red = mats.emissive(0xff5a42, 2);
    const green = mats.emissive(0x70e4bc, 2);
    const white = mats.emissive(0xffefe0, 2.1);
    const sphere = new THREE.SphereGeometry(1, 20, 12);
    const cylinder = new THREE.CylinderGeometry(1, 1, 1, 12);
    const cube = new THREE.BoxGeometry(1, 1, 1);
    function mesh(geometry, material, x, y, z, node = root, cast = true) {
      const item = new THREE.Mesh(geometry, material);
      item.position.set(x, y, z);
      item.castShadow = cast;
      item.receiveShadow = true;
      node.add(item);
      return item;
    }
    function piece(geometry, material, w, h, d, x, y, z, node, cast) {
      const item = mesh(geometry, material, x, y, z, node, cast);
      item.scale.set(w, h, d);
      return item;
    }
    const box = (...args) => piece(cube, ...args);
    const oval = (...args) => piece(sphere, ...args);
    const pipe = (material, radius, start, end, node = root) => {
      const a = new THREE.Vector3(...start);
      const b = new THREE.Vector3(...end);
      const displacement = b.clone().sub(a);
      const center = a.addScaledVector(displacement, .5);
      const item = piece(cylinder, material, radius, displacement.length(), radius,
        center.x, center.y, center.z, node);
      item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), displacement.normalize());
      return item;
    };
    function stencil(name, x, y, z, width, yaw, node = root) {
      const mark = mats.label(name, { color: 'white', font: 'stencil', distress: .12 });
      const print = mesh(new THREE.PlaneGeometry(width, width / mark.aspect), mark.material,
        x, y, z, node, false);
      print.rotation.y = yaw;
    }
    function shell(material, stations, arc = Math.PI * 2) {
      const vertices = [], triangles = [];
      const segments = 24;
      const columns = segments + (arc < Math.PI * 2 ? 1 : 0);
      for (const [z, width, y, height] of stations) {
        for (let i = 0; i < columns; i++) {
          const angle = (i / segments - .5) * arc;
          vertices.push(Math.sin(angle) * width, y + Math.cos(angle) * height, z);
        }
      }
      for (let ring = 0; ring < stations.length - 1; ring++) {
        for (let i = 0; i < segments; i++) {
          const here = ring * columns + i;
          const next = ring * columns + (i + 1) % columns;
          triangles.push(here, here + columns, next, next, here + columns, next + columns);
        }
      }
      const skin = new THREE.BufferGeometry();
      skin.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      skin.setIndex(triangles);
      skin.computeVertexNormals();
      return mesh(skin, material, 0, 0, 0, root, !material.transparent);
    }

    // Two continuous shells leave an unobstructed window and side-door band.
    const belly = shell(navy, [
      [-3.68, .018, 1.53, .022], [-3.47, .48, 1.49, .24], [-3.17, .83, 1.41, .41],
      [-2.69, 1.089, 1.23, .49], [-2.16, 1.23, 1.14, .52], [-1.25, 1.258, 1.11, .53],
      [.72, 1.251, 1.11, .53], [1.84, 1.22, 1.17, .51],
      [2.38, 1.09, 1.35, .52], [2.75, .83, 1.66, .52], [3.1, .5, 1.92, .31], [3.31, .2, 2.06, .18],
    ]);
    belly.name = 'rescue-lower-fuselage';
    const roofSkin = shell(ivory, [
      [-3.24, .28, 2.51, .051], [-2.96, .68, 2.61, .118], [-2.57, .946, 2.70, .161],
      [-2.05, 1.153, 2.76, .219], [-1.13, 1.234, 2.793, .245], [.71, 1.237, 2.795, .251],
      [1.68, 1.215, 2.76, .222], [2.22, 1.073, 2.65, .23], [2.74, .68, 2.45, .27], [3.1, .32, 2.19, .18],
    ]);
    roofSkin.name = 'rescue-upper-fuselage';
    const windscreen = shell(glazing, [
      [-3.56, .24, 1.72, .28], [-3.37, .57, 1.83, .405], [-3.12, .82, 1.82, .657],
      [-2.8, 1.011, 1.83, .73], [-2.46, 1.14, 1.78, .78], [-2.12, 1.19, 1.77, .824],
      [-1.91, 1.231, 1.78, .824],
    ], Math.PI * 1.085);
    windscreen.name = 'rescue-windscreen';
    pipe(frame, .026, [0, 2.62, -3.151], [0, 2.06, -3.585]);
    for (const side of [-1, 1]) {
      pipe(frame, .027, [side * .61, 2.52, -2.98], [side * .89, 1.96, -3.10]);
      pipe(blueGrey, .031, [side * .89, 1.96, -3.10], [side * 1.15, 1.87, -2.36]);
      pipe(navy, .032, [side * 1.214, 1.87, -2.36], [side * 1.245, 2.59, -1.93]);
      const noseStripe = box(orange, .034, .092, .58, side * 1.18, 1.72, -2.19);
      noseStripe.rotation.y = side * .22;
    }
    oval(blueGrey, 1.049, .227, 1.59, 0, 2.925, .23);
    box(panel, 2.27, .072, 4.06, 0, 1.255, .15);
    box(frame, 2.26, .08, 3.97, 0, 2.59, .14);
    box(frame, 2.21, 1.36, .12, 0, 1.94, 2.13);
    for (const x of [-1.105, 1.105]) box(panel, .159, 1.36, .13, x, 1.94, -1.91);
    box(panel, 2.11, .115, .13, 0, 2.53, -1.91);

    const door = group('rescue-sliding-door', -1.245, 0, .33);
    const sideSection = (x, z, depth, node = root) => {
      const outside = x < 0 || node === door ? -1 : 1;
      box(ivory, .14, .47, depth, x, 1.53, z, node);
      box(orange, .154, .19, depth, x, 1.8, z, node);
      for (const y of [1.944, 2.589]) box(ivory, .132, .121, depth, x, y, z, node);
      for (const edge of [-1, 1]) {
        box(ivory, .13, .585, .105, x, 2.263, z + edge * (depth / 2 - .0525), node);
        box(frame, .035, .543, .025, x + outside * .075, 2.257, z + edge * (depth / 2 - .113), node);
      }
      for (const y of [1.99, 2.524]) box(frame, .025, .033, depth - .202,
        x + outside * .075, y, z, node);
      const pane = box(glazing, .021, .502, depth - .225, x + outside * .069, 2.257, z, node, false);
      pane.name = 'rescue-cabin-window';
      for (let offset = .14; offset < depth - .09; offset += .27) {
        box(blueGrey, .014, .024, .022, x + outside * .074, 1.341, z - depth / 2 + offset, node, false);
      }
    };
    sideSection(1.19, -1.15, 1.59);
    sideSection(1.19, .48, 1.61);
    sideSection(1.19, 1.72, .84);
    sideSection(-1.19, -1.29, 1.3);
    sideSection(-1.19, 1.73, .83);
    sideSection(0, 0, 1.9, door);
    for (const z of [-.635, 1.295]) box(frame, .11, 1.4, .083, -1.22, 1.98, z);
    box(frame, .18, .105, 1.9, -1.26, 1.26, .33);
    box(steel, .22, .037, 1.9, -1.34, 1.232, .33);
    for (const z of [-.46, -.19, .08, .35, .62, .89, 1.16]) {
      box(blueGrey, .147, .012, .023, -1.362, 1.256, z, root, false);
    }
    box(frame, .044, .047, .173, -.101, 1.69, -.64, door);
    box(steel, .059, .048, 2.8, -1.22, 2.646, .74);
    stencil('SAR 07', -.085, 1.56, 0, .88, -Math.PI / 2, door);
    stencil('SALTLINE RESCUE', 1.272, 1.56, .49, 1.36, Math.PI / 2);
    stencil('07', -1.264, 1.557, -1.34, .42, -Math.PI / 2);

    // Webbed cabin seats, amber cabin lighting, and the ramp-side threshold.
    for (const z of [-.96, -.26, .44, 1.14, 1.84]) {
      box(frame, 2.16, .019, .057, 0, 1.301, z);
      box(padded, .45, .087, .51, .88, 1.62, z);
      box(padded, .086, .46, .51, 1.065, 1.87, z);
      pipe(frame, .018, [.71, 1.31, z], [1.04, 1.58, z]);
      box(rubber, .019, .41, .025, 1.017, 1.89, z + .143);
      box(steel, .04, .06, .067, 1.003, 1.72, z + .124);
      box(frame, 2.25, .114, .063, 0, 2.545, z);
    }
    for (const z of [-1.21, .95]) box(warm, .097, .034, .52, .51, 2.53, z);
    const cabinLight = new THREE.PointLight(0xffbc72, 7, 4.1, 2);
    cabinLight.position.set(.29, 2.43, .44);
    root.add(cabinLight);
    pipe(steel, .027, [-.94, 2.39, -1.85], [-.94, 2.39, 2.03]);
    box(rubber, .16, .05, .16, .78, 1.57, -1.67);
    box(orange, .34, .59, .18, -.63, 1.84, 1.972);
    box(ivory, .2, .05, .015, -.63, 1.94, 1.871);
    for (const x of [-.65, .65]) {
      box(padded, .47, .102, .41, x, 1.49, -2.19);
      box(frame, .438, .47, .112, x, 1.68, -2.03).rotation.x = -.1;
      box(steel, .032, .38, .04, x - .13, 1.68, -1.964);
      box(navy, .32, .09, .18, x, 1.39, -2.33);
    }
    box(frame, 1.68, .17, .35, 0, 1.63, -2.9).rotation.x = .2;
    for (const x of [-.54, -.26, .26, .54]) {
      box(x < 0 ? green : warm, .147, .04, .046, x, 1.719, -2.815).rotation.x = .2;
    }
    const cargoNet = group('rescue-cabin-cargo-net', .73, 1.97, 1.715);
    for (const i of [-1, 0, 1]) {
      box(padded, .023, .48, .025, i * .16, 0, 0, cargoNet).rotation.z = -.29;
      box(padded, .48, .023, .025, 0, i * .145, -.012, cargoNet).rotation.z = .18;
    }

    // The tail boom and landing gear carry the color bands around the aircraft.
    const boom = mesh(new THREE.CylinderGeometry(.26, .58, 4.38, 10), navy, 0, 2.21, 4.35);
    boom.rotation.x = 1.47;
    const stripe = piece(cylinder, orange, .32, .46, .32, 0, 2.41, 6.13);
    stripe.rotation.x = 1.47;
    const verticalFin = box(ivory, .13, 1.37, .77, 0, 2.97, 6.48);
    verticalFin.rotation.x = .33;
    const finStripe = box(orange, .144, .18, .77, 0, 3.25, 6.58);
    finStripe.rotation.x = .33;
    box(navy, 2.45, .079, .57, 0, 2.25, 5.37);
    box(red, .11, .055, .15, -1.2, 2.28, 5.39);
    box(green, .11, .055, .15, 1.2, 2.28, 5.39);
    box(white, .073, .09, .095, .01, 3.49, 6.63);
    for (const side of [-1, 1]) {
      pipe(steel, .071, [side * .9, 1.12, -1.66], [side * 1.46, .155, -1.08]);
      pipe(steel, .083, [side * .92, 1.1, 1.36], [side * 1.46, .155, 1.36]);
      pipe(navy, .079, [side * 1.46, .105, -2.27], [side * 1.46, .105, 2.24]);
      pipe(navy, .079, [side * 1.46, .105, -2.27], [side * 1.46, .43, -2.81]);
      oval(rubber, .107, .083, .45, side * 1.46, .081, 1.48);
      box(steel, .22, .058, .82, side * 1.44, .51, .28);
      box(side < 0 ? red : green, .076, .105, .154, side * 1.259, 1.77, -1.97);
      oval(white, .114, .095, .065, side * .54, 1.36, -3.355);
      const exhaust = piece(cylinder, frame, .168, .26, .132, side * .62, 2.94, 1.49);
      exhaust.rotation.x = 1.21;
      const vent = box(blueGrey, .052, .234, .62, side * .97, 2.949, .51);
      vent.rotation.z = -side * .29;
      for (const z of [.30, .40, .5, .60, .70]) {
        const opening = box(frame, .026, .143, .028, side * 1.008, 2.946, z, root, false);
        opening.rotation.z = -side * .29;
      }
      for (const z of [-1.82, -1.05, 1.39, 2.02]) {
        box(blueGrey, .018, .049, .145, side * 1.197, 1.195, z, root, false);
      }
    }
    stencil('07', -.074, 2.96, 6.52, .31, -Math.PI / 2);

    pipe(steel, .085, [0, 3.07, -.25], [0, 3.64, -.25]);
    const mainRotor = group('rescue-main-rotor', 0, 3.64, -.25);
    box(steel, .57, .086, .51, 0, 0, 0, mainRotor);
    for (let i = 0; i < 4; i++) {
      const blade = new THREE.Group();
      blade.rotation.y = i * Math.PI / 2;
      mainRotor.add(blade);
      box(frame, 4.91, .041, .226, 2.79, 0, 0, blade, false);
      box(ivory, .28, .039, .226, 5.385, 0, 0, blade, false);
      box(orange, .19, .039, .226, 5.62, 0, 0, blade, false);
    }
    const tailRotor = group('rescue-tail-rotor', -.34, 2.83, 6.53);
    pipe(steel, .066, [-.08, 0, 0], [.15, 0, 0], tailRotor);
    const tailBlade = box(frame, .041, .23, 1.66, -.068, 0, 0, tailRotor, false);
    tailBlade.rotation.x = .2;
    for (const end of [-1, 1]) box(ivory, .045, .21, .14, -.068, -.15 * end, .755 * end, tailRotor, false);

    const anchors = {
      seat: new THREE.Vector3(.6, 2.03, .94),
      door: new THREE.Vector3(-1.21, 2.02, .33),
      perch: new THREE.Vector3(-1.62, 1.43, .34),
      cable: new THREE.Vector3(-1.65, 2.74, .34),
    };
    const cable = group('rescue-cinematic-cable', anchors.cable.x, anchors.cable.y, anchors.cable.z);
    box(frame, .48, .17, .32, -1.442, 2.74, .34);
    box(orange, .175, .12, .23, -1.662, 2.703, .34);
    const line = piece(cylinder, steel, .016, 1, .016, 0, -.5, 0, cable, false);
    const end = box(orange, .076, .119, .073, 0, -1, 0, cable, false);
    function setCable(length) {
      cable.visible = length > 0;
      if (cable.visible) {
        line.scale.y = length;
        line.position.y = -length / 2;
        end.position.y = -length;
      }
    }
    setCable(0);

    return {
      root, door, mainRotor, tailRotor, anchors,
      setCable,
      setDoor(openFraction) {
        const open = Math.max(0, Math.min(1, openFraction));
        door.position.x = -1.245 - open * .154;
        door.position.z = .33 + open * 1.94;
      },
      spin(dt, speed = 1) {
        mainRotor.rotation.y = (mainRotor.rotation.y + dt * 17 * speed) % (Math.PI * 2);
        tailRotor.rotation.x = (tailRotor.rotation.x + dt * 47 * speed) % (Math.PI * 2);
      },
    };
  }

  function createPortPrologueLayout(builder, vector) {
    const { THREE, G, staticRoot, dynRoot, box, slab, col, cyl, rod, label, quad } = builder;
    const model = new THREE.Group();
    model.name = 'port-hq-moving';
    dynRoot.add(model);
    const interiors = [];
    const floorGlow = G.mats.emissive(0x76d6d1, 1.5);
    const warmGlow = G.mats.emissive(0xffd298, 1.48);
    const ceiling = new THREE.MeshStandardMaterial({ color: 0x9fa49b, roughness: .92 });
    const plaster = new THREE.MeshStandardMaterial({ color: 0x858d85, roughness: .9 });
    const trim = new THREE.MeshStandardMaterial({ color: 0x34474b, roughness: .7 });
    const paintedFloor = new THREE.MeshStandardMaterial({ color: 0x435e5f, roughness: .83 });
    const deskSurface = 'wood_dark';
    const points = {
      duty: vector(-24, 0, -3.2), briefing: vector(-19.5, 0, 9), range: vector(-7.2, 0, -8.1),
      ammo: vector(-8, 0, -5), trainingExit: vector(9.4, 0, 3.4), boarding: vector(26.65, 0, 5),
    };
    const poster = { color: 'white', font: 'stencil', distress: .09 };
    const sign = (name, h, x, y, z, face = 'z+') => label(name, h, x, y, z, face, poster);
    function solid(material, x0, y0, z0, x1, y1, z1, surface = 'concrete', opts) {
      slab(material, x0, y0, z0, x1, y1, z1);
      col(x0, y0, z0, x1, y1, z1, surface, opts);
    }
    function wall(x0, z0, x1, z1, height = 3.48, material = plaster) {
      solid(material, x0, 0, z0, x1, height, z1);
      slab(trim, x0 - .009, .015, z0 - .009, x1 + .009, .29, z1 + .009);
    }
    function roof(x0, z0, x1, z1, height = 3.48) {
      slab(ceiling, x0, height, z0, x1, height + .17, z1, { cast: false });
      col(x0, height, z0, x1, height + .17, z1, 'metal', { noNav: true });
      interiors.push({ min: vector(x0, 0, z0), max: vector(x1, height + .17, z1) });
    }
    function light(x, z, y, color, intensity) {
      const lit = new THREE.PointLight(color, intensity, 10, 2);
      lit.position.set(x, y - .34, z);
      model.add(lit);
      box(trim, 2.2, .08, .25, x, y, z);
      box(color === 0xffcd94 ? warmGlow : floorGlow, 2.03, .034, .15, x, y - .055, z);
    }
    function doorway(x, z, width, side) {
      const alongX = side === 'z+' || side === 'z-';
      const frame = (off, y, length, height, thickness) => box(trim,
        alongX ? length : thickness, height, alongX ? thickness : length,
        x + (alongX ? off : 0), y, z + (alongX ? 0 : off));
      for (const edge of [-1, 1]) frame(edge * width / 2, 1.43, .095, 2.86, .34);
      frame(0, 2.86, width + .09, .116, .34);
      frame(0, .033, width - .05, .035, .3);
    }
    function table(x, z, w, d, y = .82, material = deskSurface) {
      solid(material, x - w / 2, y - .071, z - d / 2, x + w / 2, y, z + d / 2, 'wood');
      for (const dx of [-1, 1]) for (const dz of [-1, 1]) {
        box(trim, .087, y, .087, x + dx * (w / 2 - .16), y / 2, z + dz * (d / 2 - .14));
      }
      col(x - w / 2 + .06, 0, z - d / 2 + .06, x + w / 2 - .06, y, z + d / 2 - .06, 'wood');
    }
    function seat(x, z, direction) {
      box(trim, .46, .08, .46, x, .45, z);
      box(trim, .46, .45, .07, x, .68, z + direction * .2);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        box('steel_dark', .027, .425, .027, x + sx * .18, .22, z + sz * .17);
      }
    }
    function cabinet(x, z, height, width = 1.83, depth = .54) {
      solid(trim, x - width / 2, 0, z - depth / 2, x + width / 2, height, z + depth / 2, 'metal');
      for (const dx of [-.31, 0, .31]) {
        box('steel_worn', width * .29, height - .11, .043, x + width * dx, height / 2, z + depth / 2);
        for (const dy of [.73, .79, .85]) box('steel_dark', width * .17, .019, .014,
          x + width * dx, height * dy, z + depth / 2 + .027);
        box('steel_galv', .025, .1, .035, x + width * (dx + .086), height * .49, z + depth / 2 + .033);
      }
    }
    function windowWall(x0, x1, z, height = 3.48) {
      wall(x0, z - .12, x1, z + .12, 1.1);
      solid(plaster, x0, 2.61, z - .12, x1, height, z + .12);
      solid('glass_dirty', x0, 1.1, z - .032, x1, 2.61, z + .032, 'glass');
      box(trim, x1 - x0 + .08, .074, .2, (x0 + x1) / 2, 1.11, z);
      box(trim, x1 - x0 + .08, .074, .2, (x0 + x1) / 2, 2.60, z);
      for (let x = x0; x <= x1 + .02; x += (x1 - x0) / 3) box(trim, .068, 1.51, .15, x, 1.857, z);
    }
    const dash = (x, z, w, d, material = 'paint_yellow') => box(material, w, .011, d, x, .039, z, { cast: false });

    solid('asphalt', -29, -.13, -17, 39, .023, 18, 'concrete', { noNav: true });
    slab(paintedFloor, -27.4, .023, -10.3, -11.85, .030, 15.8, { cast: false });
    slab('concrete_dirty', -28.8, .0235, 2.0, 16, .0308, 5.2, { cast: false });
    wall(-27.65, -10.55, -27.39, 15.95);
    wall(-12.05, -10.55, -11.79, 2.05);
    wall(-12.05, 5.08, -11.79, 15.95);
    wall(-27.47, -10.55, -25.08, -10.29);
    windowWall(-25.08, -20.25, -10.42);
    wall(-20.25, -10.55, -11.94, -10.29);
    wall(-27.53, 15.72, -11.91, 15.98);
    for (const z of [2.03, 5.10]) {
      wall(-27.55, z - .12, -21.99, z + .12);
      wall(-18.61, z - .12, -11.9, z + .12);
      solid(plaster, -21.99, 2.84, z - .12, -18.61, 3.48, z + .12);
      doorway(-20.30, z, 3.38, 'z+');
    }
    roof(-27.64, -10.56, -11.78, 15.98);
    for (const x of [-26.8, -22.65, -18.36, -13.96]) {
      box(trim, .16, .2, 26.59, x, 3.38, 2.71);
    }

    // Duty room, alarms and a wall of ordinary shift materials.
    light(-23.98, -5.37, 3.18, 0xffcd94, 27);
    light(-15.04, -4.54, 3.18, 0xffcd94, 21);
    sign('SALTLINE / PORT OPERATIONS', .24, -16.16, 2.49, -10.267);
    sign('DUTY OFFICE', .175, -20.3, 3.1, 2.182);
    table(-23.38, -8.84, 3.46, 1.02);
    table(-16.02, -7.18, 2.86, 1.33);
    seat(-24.31, -8, 1);
    seat(-17.06, -6.08, 1);
    seat(-15.04, -6.08, 1);
    cabinet(-14.7, -9.98, 1.93, 3.9);
    box(trim, .63, .36, .082, -23.98, 1.08, -9.09);
    box(floorGlow, .55, .28, .019, -23.98, 1.084, -9.039);
    box('steel_dark', .52, .045, .17, -23.98, .842, -8.799);
    box('steel_dark', .196, .096, .189, -22.36, .866, -9.04);
    box('paint_white', .66, .029, .405, -22.32, .845, -8.68).rotation.y = -.17;
    box('paint_white', .58, .018, .35, -16.37, .835, -7.4).rotation.y = -.41;
    box('steel_dark', 1.93, .92, .045, -26.14, 2.06, 1.892);
    sign('DAY WATCH', .104, -26.12, 2.37, 1.866, 'z-');
    for (let i = 0; i < 4; i++) box('paint_white', .25, .32, .017, -26.77 + i * .38, 2.035, 1.86);

    // Briefing room faces the central hall through an open doorway.
    light(-23.78, 9.66, 3.18, 0xffcd94, 25);
    light(-15.02, 11.03, 3.18, 0x97d5f7, 25);
    sign('INCIDENT BRIEFING', .186, -20.3, 3.1, 4.956, 'z-');
    table(-19.5, 11.3, 4.63, 1.64);
    for (const x of [-21.03, -19.5, -17.97]) seat(x, 12.57, 1);
    for (const x of [-21.13, -17.84]) seat(x, 10.09, -1);
    box(trim, 5.43, 1.76, .13, -19.5, 2.02, 15.61);
    box(paintedFloor, 5.16, 1.5, .036, -19.5, 2.04, 15.532);
    if (typeof document !== 'undefined') {
      const screen = document.createElement('canvas');
      screen.width = 1024;
      screen.height = 296;
      const context = screen.getContext('2d');
      context.fillStyle = '#111f25';
      context.fillRect(0, 0, 1024, 296);
      context.fillStyle = '#19353b';
      context.fillRect(0, 0, 1024, 54);
      context.fillStyle = '#bbcdca';
      context.font = '700 24px monospace';
      context.fillText('SAR DISPATCH  /  LAST CONTACT', 30, 36);
      context.fillStyle = '#e6b577';
      context.font = '700 62px monospace';
      context.fillText('05:37', 30, 128);
      context.font = '600 20px monospace';
      context.fillText('BERTH 04  ·  CONTACT LOST', 32, 168);
      context.fillStyle = '#90aead';
      context.font = '500 19px monospace';
      context.fillText('LAST REPORT: PERSONNEL STILL ON SITE.', 32, 209);
      context.fillText('DISPATCH ENTRY: 17 WORKERS DEPARTED.', 32, 241);
      context.strokeStyle = '#3e666b';
      context.lineWidth = 1.4;
      for (let x = 670; x < 991; x += 28) {
        context.beginPath(); context.moveTo(x, 76); context.lineTo(x, 271); context.stroke();
      }
      for (let y = 76; y < 272; y += 28) {
        context.beginPath(); context.moveTo(664, y); context.lineTo(988, y); context.stroke();
      }
      context.strokeStyle = '#92ae9f';
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(671, 246);
      for (const [x,y] of [[732,229],[736,197],[804,181],[810,149],[890,127],[891,108],[978,89]]) {
        context.lineTo(x,y);
      }
      context.stroke();
      context.fillStyle = '#e6b577';
      context.fillRect(794,174,11,11);
      const map = new THREE.CanvasTexture(screen);
      map.colorSpace = THREE.SRGBColorSpace;
      const display = new THREE.Mesh(new THREE.PlaneGeometry(5.12, 1.48),
        new THREE.MeshBasicMaterial({ map, toneMapped: false }));
      display.name = 'hq-last-contact-display';
      display.position.set(-19.5, 2.04, 15.501);
      display.rotation.y = Math.PI;
      model.add(display);
    } else {
      sign('05:37  /  CONTACT LOST', .22, -19.5, 2.57, 15.502, 'z-');
    }
    // Objects around the briefing table stay out of the walkthrough and share the port materials.
    const edge = box('steel_galv', 4.63, .026, .035, -19.5, .798, 10.478);
    edge.castShadow = false;
    for (const [x,z] of [[-20.72,10.91],[-18.13,11.62]]) {
      cyl('steel_worn', .042, .093, x, .863, z, { seg: 10 });
      cyl('polymer_black', .0435, .015, x, .909, z, { seg: 10 });
      box('paint_white', .227, .014, .301, x+.28, .827, z+.16).rotation.y = -.24;
    }
    box('steel_dark', .74, .104, .272, -20.53, .872, 11.71);
    for (let i = 0; i < 6; i++) box(trim, .054, .013, .045, -20.75+i*.083, .932, 11.69);
    box('polymer_black', 4.9, .014, 1.5, -19.5, .038, 8.45, { cast: false });
    for (let x = -21.75; x <= -17.26; x += .17) {
      box(trim, .014, .003, 1.37, x, .047, 8.45, { cast: false });
    }
    box('paint_white', .72, .017, .55, -19.43, .836, 10.83).rotation.y = -.12;
    box('paint_orange', .45, .021, .31, -18.86, .844, 10.96).rotation.y = .17;
    box('steel_dark', .29, .068, .191, -19.25, .86, 10.74);
    cabinet(-25.89, 5.66, 1.44, 1.91);
    sign('AUTHORIZED STAFF', .14, -24.8, 2.63, 5.25);

    // Covered corridor. The range is reached only through its own side entrance.
    wall(-27.64, 1.91, -27.38, 5.23);
    wall(-11.79, 1.91, -9.03, 2.17, 3.09);
    wall(-6.08, 1.91, 10.55, 2.17, 3.09);
    wall(-11.79, 4.98, 10.55, 5.22, 3.09);
    roof(-11.8, 1.92, 10.56, 5.23, 3.09);
    solid(plaster, -9.03, 2.84, 1.91, -6.08, 3.09, 2.17);
    doorway(-7.555, 2.05, 2.95, 'z+');
    for (const x of [-23.9, -15.2, -4.5, .3, 6.99]) light(x, 3.57, x < -12 ? 3.28 : 2.91, 0x97d5f7, 14);
    for (let x = -26.7; x < 9.8; x += 1.5) {
      dash(x, 3.22, .77, .055, 'paint_white');
      dash(x, 3.94, .77, .055, 'paint_white');
    }
    sign('TRAINING RANGE', .166, -7.555, 2.987, 2.185);
    sign('TRANSFER APRON', .182, 9.96, 2.36, 5.04, 'z-');
    sign('DUTY  /  BRIEFING', .174, -25.26, 2.36, 5.202, 'z-');
    box(floorGlow, .052, .057, .29, 10.58, 2.212, 2.187);
    box(floorGlow, .052, .057, .29, 10.58, 2.212, 5.211);

    wall(-10.77, -15.14, -10.51, 1.92, 3.33);
    wall(-10.61, -15.14, 10.53, -14.88, 3.33, 'concrete_dirty');
    wall(10.34, -15.12, 10.6, 1.93, 3.33, 'concrete_dirty');
    roof(-10.77, -14.96, -4.67, 1.92, 3.33);
    slab(paintedFloor, -10.5, .023, -11.98, -4.68, .030, -4.0, { cast: false });
    light(-7.83, -9.65, 3.09, 0x97d5f7, 22);
    light(-7.83, -3.81, 3.09, 0x97d5f7, 13);
    sign('CONTROLLED TRAINING', .172, -10.48, 2.71, -8.1, 'x+');
    for (const z of [-11.72, -4.18]) {
      for (let x = -8.7; x < 9.3; x += 1.4) dash(x, z, .78, .083);
    }
    dash(-6.27, -7.95, .11, 7.55, 'paint_white');
    for (let z = -10.78; z < -4.55; z += .52) dash(-6.58, z, .36, .12);
    for (const x of [.8, 4.25, 8.12]) {
      for (const z of [-11.44, -4.45]) dash(x, z, .078, .42, 'paint_white');
    }
    for (let z = -13.8; z < -2.05; z += 1.85) {
      box('steel_dark', .52, 2.59, 1.79, 10.04, 1.3, z);
      box('hazard_stripes', .024, .17, 1.75, 9.762, 2.43, z);
    }
    sign('RANGE BACKSTOP', .18, 9.745, 2.83, -8.12, 'x-');
    table(-9.5, -5.04, 1.43, .91, .88, 'steel_worn');
    box('paint_green', .62, .24, .39, -9.48, 1.0, -5.05, { bevel: .025 });
    box('steel_dark', .21, .049, .073, -9.48, 1.145, -5.05, { bevel: .012 });
    box('paint_yellow', .24, .079, .015, -9.48, 1.012, -4.849);
    sign('TRAINING SUPPLIES', .15, -10.48, 1.72, -5.05, 'x+');
    table(-9.5, -12.73, 1.38, .84, .84, 'steel_worn');
    box('paint_white', .54, .031, .39, -9.52, .855, -12.77).rotation.y = .17;
    cabinet(-9.49, -1.69, 1.38, 1.48, .48);

    const paper = new THREE.MeshStandardMaterial({ color: 0xdcd9bd, roughness: .93 });
    const bullseye = new THREE.MeshStandardMaterial({ color: 0xb46043, roughness: .86 });
    const targets = [
      { id: 'close', center: vector(-.65, 1.52, -9.4), radius: .39, title: 'CLOSE' },
      { id: 'middle', center: vector(7.9, 1.52, -6.45), radius: .44, title: 'MIDDLE' },
    ].map(({ id, center, radius, title }) => {
      const { x, y, z } = center;
      const object = new THREE.Group();
      object.name = `hq-range-${id}`;
      object.position.copy(center);
      model.add(object);
      box('steel_dark', .43, .074, .65, x + .19, .061, z);
      box('steel_galv', .093, 1.41, .09, x + .177, .746, z);
      box('steel_worn', .085, 2 * radius + .16, 2 * radius + .15, .11, 0, 0, { parent: object });
      for (const [index, factor] of [1, .83, .62, .43, .235].entries()) {
        cyl(index % 2 ? trim : paper, radius * factor, .012, .057 - index * .012, 0, 0,
          { axis: 'x', seg: 32, parent: object, cast: false });
      }
      const aim = cyl(bullseye, radius * .13, .013, -.006, 0, 0,
        { axis: 'x', seg: 20, parent: object, cast: false });
      const indicator = box(trim, .031, .083, .18, .051, radius + .027, 0, { parent: object });
      sign(title, .117, x + .064, y - radius - .12, z, 'x-');
      col(x - .01, y - radius, z - radius, x + .059, y + radius, z + radius, 'metal', { bulletOnly: true, tag: id });
      return {
        id, center, radius, object,
        setHit(hit) {
          aim.material = hit ? floorGlow : bullseye;
          indicator.material = hit ? floorGlow : trim;
        },
      };
    });

    // A low lit apron and a marked pedestrian route frame the parked aircraft.
    slab('concrete_dirty', 10.57, .024, -12.55, 38.74, .033, 16.7, { cast: false });
    for (const z of [2.26, 4.59]) for (let x = 10.66; x < 21.5; x += 1.42) {
      dash(x, z, .72, .09);
    }
    for (const [x, z, w, d] of [[28.8, -1.37, 11.19, .17], [28.8, 11.37, 11.19, .17],
      [23.23, 5, .17, 12.81], [34.37, 5, .17, 12.81]]) dash(x, z, w, d, 'paint_white');
    for (const x of [27.8, 30.18]) dash(x, 5, .28, 3.86, 'paint_white');
    dash(29, 5, 2.33, .29, 'paint_white');
    for (const x of [23.48, 26.2, 28.88, 31.56, 34.24]) {
      for (const z of [-1.57, 11.57]) box(floorGlow, .205, .044, .149, x, .074, z, { cast: false });
    }
    for (const x of [23.6, 24.23, 24.86, 25.49, 26.12]) dash(x, 5, .11, 1.47);
    for (const x of [12.4, 22.25, 36.8]) for (const z of [-10.2, 14.09]) {
      solid('concrete_dirty', x - .22, 0, z - .22, x + .22, .31, z + .22, 'concrete');
      cyl('steel_dark', .075, 4.02, x, 2.27, z);
      box('steel_worn', .77, .13, .34, x, 4.29, z);
      box(warmGlow, .66, .027, .23, x, 4.209, z, { cast: false });
    }
    for (const z of [-13.05, 16.88]) {
      wall(10.6, z - .11, 38.91, z + .11, .79, 'concrete_dirty');
      rod('steel_worn', [10.6, .89, z], [38.91, .89, z], .038);
    }
    wall(38.79, -13.15, 39.01, 17, 1.14, 'concrete_dirty');
    wall(-29, -17, 10.6, -16.76, 1.62, 'concrete_dirty');
    wall(-29, 17.76, 10.6, 18, 1.62, 'concrete_dirty');
    wall(-29, -17, -28.76, 18, 1.62, 'concrete_dirty');
    wall(10.53, -16.98, 10.79, -13.07, 1.6, 'concrete_dirty');
    wall(10.52, 16.9, 10.78, 18, 1.6, 'concrete_dirty');
    for (const x of [13.56, 14.5, 15.44]) {
      cyl('steel_dark', .08, 1.19, x, .6, 5.22);
      cyl('paint_yellow', .084, .19, x, .96, 5.22);
      cyl('paint_yellow', .084, .19, x, .58, 5.22);
      col(x - .084, 0, 5.137, x + .084, 1.2, 5.303, 'metal');
    }
    const signPlate = slab(trim, 12.72, 1.34, 5.29, 15.86, 2.04, 5.41);
    signPlate.name = 'hq-apron-sign';
    box('steel_galv', .09, 1.38, .09, 14.29, .69, 5.38);
    sign('TRANSFER APRON', .201, 14.29, 1.78, 5.281, 'z-');
    sign('RESCUE 07', .12, 14.29, 1.52, 5.281, 'z-');
    const equipment = [[17.5, -9.4], [19.44, -9.4], [17.53, -7.65]];
    for (const [x, z] of equipment) {
      solid('steel_worn', x - .83, 0, z - .54, x + .83, .79, z + .54, 'metal');
      for (const edge of [-1, 1]) box('steel_dark', .11, .843, 1.14, x + edge * .58, .42, z);
      box('hazard_stripes', .28, .125, .022, x, .49, z + .555);
    }
    quad(G.mats.label('07', poster).material, 1.17, .57, 21.52, .040, 3.45, 'y+', Math.PI / 2);

    const helicopter = createPortTransportVisual({ THREE, mats: G.mats }, model);
    helicopter.root.position.set(29, 0, 5);
    helicopter.setDoor(1);
    col(27.71, .28, 1.63, 30.28, 2.97, 7.86, 'metal');
    col(28.52, 1.71, 7.81, 29.49, 2.74, 11.65, 'metal');
    staticRoot.name = 'port-hq-buildings';
    return {
      id: 'hq', model, points, targets, helicopter,
      playerStart: { pos: points.duty, yaw: -.3 },
      extraction: { pos: points.boarding, radius: 1.6 },
      interiorBoxes: interiors, enemySpawns: [], geometry: [], supplies: [],
    };
  }

  window.createPortPrologueLayout = createPortPrologueLayout;
  window.createPortTransportVisual = createPortTransportVisual;
})();
