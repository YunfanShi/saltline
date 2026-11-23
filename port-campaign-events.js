/* Cosmetic aircraft incident for the rail campaign. */
(() => {
  const FLIGHT_SECONDS = 6.4;
  const TURN_SECONDS = 4.1;
  const SLIDE_SECONDS = 1.8;
  const WRECK_SECONDS = 26;

  window.createCampaignCrash = (world) => {
    const { THREE, scene, mats, fx, events } = world;
    const { BoxGeometry, BufferGeometry, CubicBezierCurve3, CylinderGeometry, Float32BufferAttribute,
      Group, Mesh, Vector3 } = THREE;
    const point = (x, y, z) => new Vector3(x, y, z);
    const viewingSpot = point(-94, 0, 9.5);
    const focus = point(-100, 8, .6);
    const contact = point(-85.5, 1.12, .6);
    const impact = point(-77, .94, .6);
    const turnIn = point(-105, 11.8, -10.4);
    const approach = new CubicBezierCurve3(
      point(-137, 28, -18), point(-119, 22, -16), point(-115.7, 21.8, -12.5), turnIn,
    );
    const descent = new CubicBezierCurve3(
      turnIn, point(-99, 6.19, -9.22), point(-92.75, 1.76, .6), contact,
    );
    const sample = point(0, 0, 0);
    const forward = point(0, 0, 0);
    const target = point(0, 0, 0);
    const smokeOrigin = point(0, 0, 0);
    let aircraft = null;
    let smokeAt = 0;
    let elapsed = 0;
    let emitters = [];

    function buildAircraft() {
      const root = new Group();
      root.name = 'rail-campaign-aircraft';
      const skin = mats.get('paint_grey', { color: 0x555a53 });
      const panel = mats.get('paint_grey', { color: 0x444b46 });
      const wingSkin = mats.get('paint_grey', { color: 0x646960 });
      const dark = mats.get('steel_dark');
      const glass = mats.get('paint_grey', { color: 0x243037 });
      const bareMetal = mats.get('steel_galv');
      const demarcation = mats.get('paint_yellow');
      const wreckSkin = mats.get('steel_rust');

      function mesh(geometry, material, x, y, z, parent = root) {
        const piece = new Mesh(geometry, material);
        piece.position.set(x, y, z);
        piece.castShadow = true;
        piece.receiveShadow = true;
        parent.add(piece);
        return piece;
      }

      function block(w, h, d, x, y, z, material = skin, parent = root) {
        return mesh(new BoxGeometry(w, h, d), material, x, y, z, parent);
      }

      function cylinder(front, back, length, x, y, z, material, parent = root) {
        const shape = mesh(new CylinderGeometry(front, back, length, 12), material, x, y, z, parent);
        shape.rotation.x = Math.PI / 2;
        return shape;
      }

      function airfoil(outline, thickness, material, parent = root) {
        const geometry = new BufferGeometry();
        const edges = outline.length;
        const vertices = [];
        const uv = [];
        const indices = [];
        for (const y of [thickness / 2, -thickness / 2]) {
          for (const [x, z] of outline) {
            vertices.push(x, y, z);
            uv.push(x, z);
          }
        }
        for (let index = 1; index < edges - 1; index++) {
          indices.push(0, index, index + 1, edges, edges + index + 1, edges + index);
        }
        for (let index = 0; index < edges; index++) {
          const next = (index + 1) % edges;
          indices.push(index, next + edges, next, index, index + edges, next + edges);
        }
        geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        return mesh(geometry, material, 0, 0, 0, parent);
      }

      cylinder(.94, .94, 5.2, 0, 0, .08, skin).scale.z = .9;
      cylinder(.51, .94, 1.12, 0, 0, 3.24, skin).scale.z = .9;
      cylinder(.17, .51, .49, 0, 0, 4.045, dark).scale.z = .9;
      cylinder(.94, .29, 1.7, 0, .115, -3.37, skin).scale.z = .9;
      cylinder(.29, .13, .48, 0, .115, -4.46, panel);

      for (const side of [-1, 1]) {
        block(.078, .39, 1.33, side * .89, .165, .85, panel);
        for (const z of [-1.1, -.55, 0, .55, 1.1]) block(.07, .17, .24, side * .917, .32, z, glass);
        const pane = block(.52, .37, .065, side * .34, .42, 3.39, glass);
        pane.rotation.set(-.41, side * .35, side * -.16);
        block(.018, .17, .72, side * .942, -.27, -.65, demarcation);
      }

      const wings = [];
      const propellers = [];
      for (const side of [-1, 1]) {
        const wing = new Group();
        wing.position.set(side * .52, .54, .43);
        root.add(wing);
        const outline = [[0, .98], [5.78, .29], [5.63, -.72], [0, -1.42]];
        const foil = airfoil(outline, .19, wingSkin, wing);
        foil.scale.x = side;
        block(.44, .15, .48, side * 5.56, .012, -.31, demarcation, wing);
        const x = side * 2.38;
        cylinder(.48, .39, 1.64, x, -.23, .09, panel, wing);
        cylinder(.38, .48, .49, x, -.23, 1.155, bareMetal, wing);
        cylinder(.39, .27, .48, x, -.23, -.97, dark, wing);
        const hub = new Group();
        hub.position.set(x, -.23, 1.57);
        wing.add(hub);
        cylinder(.16, .22, .32, 0, 0, 0, dark, hub);
        for (let index = 0; index < 3; index++) {
          const blade = block(.145, 1.03, .07, 0, 0, -.115, dark, hub);
          const angle = index * Math.PI * 2 / 3;
          blade.rotation.z = angle;
          blade.position.x = -Math.sin(angle) * .69;
          blade.position.y = Math.cos(angle) * .69;
        }
        wings.push(wing);
        propellers.push(hub);
      }

      const tail = new Group();
      tail.position.set(0, .26, -3.75);
      root.add(tail);
      airfoil([[-2.24, -.27], [-.26, .6], [.26, .6], [2.24, -.27], [2.12, -.85], [-2.12, -.85]],
        .14, wingSkin, tail);
      const fin = airfoil([[0, .83], [1.65, -.53], [1.65, -.98], [0, -.88]], .15, panel, tail);
      fin.rotation.z = Math.PI / 2;
      const landingGear = new Group();
      landingGear.position.set(-.69, -.59, .59);
      root.add(landingGear);
      const strut = new Mesh(new CylinderGeometry(.055, .075, .44, 8), bareMetal);
      strut.position.y = -.14;
      strut.castShadow = true;
      landingGear.add(strut);
      const wheel = new Mesh(new CylinderGeometry(.175, .175, .14, 10), dark);
      wheel.position.y = -.36;
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      landingGear.add(wheel);
      const scorched = block(.5, .22, 1.34, 0, .81, -.15, wreckSkin);
      scorched.visible = false;
      return { root, wings, tail, propellers, landingGear, scorched };
    }

    function stopEffects() {
      for (const { handle, position, kind } of emitters) {
        // Saltline reuses emitter objects after their lifetimes end.
        if (!handle.pos || (handle.kind === kind && handle.pos.equals(position))) handle.stop?.();
      }
      emitters = [];
    }

    function startEffect(position, kind, ttl, scale) {
      const handle = fx?.addEmitter?.(position, kind, { ttl, scale });
      if (handle) emitters.push({ handle, position, kind });
    }

    function reset() {
      stopEffects();
      if (aircraft) {
        scene.remove(aircraft.root);
        aircraft.root.traverse(piece => piece.geometry?.dispose());
        aircraft = null;
      }
      elapsed = 0;
      smokeAt = 0;
    }

    function launch() {
      if (aircraft) return false;
      aircraft = buildAircraft();
      scene.add(aircraft.root);
      fly(0);
      return true;
    }

    function fly(time) {
      const progress = time / FLIGHT_SECONDS;
      const { root, propellers, landingGear } = aircraft;
      const turning = time < TURN_SECONDS;
      const segment = turning ? approach : descent;
      const segmentProgress = turning ? time / TURN_SECONDS : (time - TURN_SECONDS) / (FLIGHT_SECONDS - TURN_SECONDS);
      segment.getPoint(segmentProgress, sample);
      segment.getTangent(segmentProgress, forward);
      root.position.copy(sample);
      root.lookAt(target.copy(sample).add(forward));
      root.rotateZ(.24 * Math.sin(progress * Math.PI) - .08 * progress);
      propellers[0].rotation.z = time * 74;
      propellers[1].rotation.z = -time * (37 - 12 * progress);
      landingGear.rotation.x = -1.14 * Math.min(1, (1 - progress) * 5);
      if (time >= smokeAt && progress > .19) {
        smokeAt = time + .095;
        smokeOrigin.set(2.95, .3, -.65);
        root.localToWorld(smokeOrigin);
        fx?.smoke?.(smokeOrigin, {
          size: .9 + progress * .85, life: 3.6, color: 0x242629, alpha: .53, rise: .24, count: 2,
        });
      }
    }

    function slide(time) {
      const progress = time / SLIDE_SECONDS;
      const travel = 1 - (1 - progress) ** 2;
      const { root, wings, tail, propellers, landingGear, scorched } = aircraft;
      root.position.lerpVectors(contact, impact, travel);
      forward.subVectors(impact, contact);
      target.copy(root.position).add(forward);
      target.y = root.position.y;
      root.lookAt(target);
      root.rotateY(progress * .13);
      root.rotateX(.088 * (1 - travel) + Math.sin(progress * Math.PI * 2) * .075 * (1 - progress));
      root.rotateZ(-.08 + Math.sin(progress * Math.PI * 3) * .12 * (1 - progress) + .12 * travel);
      wings[0].rotation.z = .12 * travel;
      wings[1].rotation.z = -.2 * travel;
      wings[1].rotation.y = .22 * travel;
      tail.rotation.y = -.18 * progress;
      landingGear.rotation.x = travel * .97;
      propellers[0].rotation.z = FLIGHT_SECONDS * 74 + travel * 8;
      propellers[1].rotation.z = -FLIGHT_SECONDS * 25 - travel * 1.75;
      scorched.visible = progress > .15;
      if (time >= smokeAt) {
        smokeAt = time + .09;
        smokeOrigin.set(-.87, -.7, .4);
        root.localToWorld(smokeOrigin);
        smokeOrigin.y = .22;
        fx?.smoke?.(smokeOrigin, { size: 1.45, life: 2.2, color: 0x635f56, alpha: .54, rise: .28, count: 2 });
      }
    }

    function burst(position, size) {
      if (fx?.explosion && !fx.stub) fx.explosion(position, size);
      else events?.emit?.('explosion', { pos: position, size });
    }

    function update(dt) {
      if (!aircraft || !Number.isFinite(dt) || dt <= 0) return;
      const previous = elapsed;
      elapsed += dt;
      if (elapsed < FLIGHT_SECONDS) {
        fly(elapsed);
        return;
      }

      const slideTime = elapsed - FLIGHT_SECONDS;
      if (previous < FLIGHT_SECONDS) {
        smokeAt = 0;
        fx?.debris?.(point(contact.x, .25, contact.z), { mat: 'steel_rust', speed: 5, count: 15, size: .13 });
      }
      if (slideTime < SLIDE_SECONDS) {
        slide(slideTime);
        return;
      }

      if (previous < FLIGHT_SECONDS + SLIDE_SECONDS) {
        slide(SLIDE_SECONDS);
        burst(impact, 2.15);
        if (slideTime < SLIDE_SECONDS + WRECK_SECONDS) {
          startEffect(point(impact.x + .7, 1.25, impact.z + .35), 'smolder', 21, 1.7);
          startEffect(point(impact.x - .5, 1, impact.z - .6), 'fire', 10.5, 1.05);
          startEffect(point(impact.x + .65, 1.15, impact.z + .15), 'embers', 13, 1);
        }
      }
      if (slideTime >= SLIDE_SECONDS + WRECK_SECONDS) reset();
    }

    return {
      launch, update, reset,
      get active() { return aircraft !== null; },
      get impact() { return impact.clone(); },
      get viewingSpot() { return viewingSpot.clone(); },
      get focus() { return focus.clone(); },
      get position() { return aircraft?.root.position ?? focus; },
    };
  };
})();
