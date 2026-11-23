/* Aircraft flyover and runway incident for the Saltline rail campaign. */
(() => {
  const DAMAGE_SECONDS = 1.15;
  const MISSILE_SECONDS = .35;
  const TURN_SECONDS = 4.1;
  const FLIGHT_SECONDS = 6.4;
  const SLIDE_SECONDS = 1.8;
  const IMPACT_SECONDS = FLIGHT_SECONDS + SLIDE_SECONDS;
  const WRECK_SECONDS = 105;
  const DISC_ROTATION = Math.PI * 2;

  window.createCampaignCrash = (world) => {
    const { THREE, scene, fx, events } = world;
    const { BoxGeometry, BufferGeometry, CubicBezierCurve3, CylinderGeometry,
      DoubleSide, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial,
      RingGeometry, Vector3 } = THREE;
    const point = (x, y, z) => new Vector3(x, y, z);
    const viewingSpot = point(-94, 0, 9.5);
    const focus = point(-100, 8, .6);
    const contact = point(-85.5, 1.12, .6);
    const impact = point(-77, .94, .6);
    const turnIn = point(-105, 11.8, -10.4);
    const approach = new CubicBezierCurve3(
      point(-153, 39, -16), point(-125, 33, -21), point(-114, 20.215, -12.17), turnIn,
    );
    const descent = new CubicBezierCurve3(
      turnIn, point(-99, 6.19, -9.22), point(-92.75, 1.76, .6), contact,
    );
    const sample = new Vector3();
    const direction = new Vector3(1, 0, 0);
    const target = new Vector3();
    const effectPosition = new Vector3();
    const groundNormal = point(0, 1, 0);
    const transport = new Group();
    transport.name = 'rail-campaign-aircraft';
    const missile = new Group();
    missile.name = 'rail-campaign-missile';
    const trail = new Mesh(new CylinderGeometry(.04, .16, 1, 8),
      new MeshBasicMaterial({ color: 0xffae47 }));
    const flare = new Mesh(new CylinderGeometry(.055, .11, .65, 8),
      new MeshBasicMaterial({ color: 0xffefd5 }));
    missile.add(trail, flare);
    const hitPose = new Group();
    const missileStart = new Vector3();
    const missileHit = new Vector3();
    const trailEnd = new Vector3();
    const missileHeading = new Vector3();
    let nextMissileSmoke = 0;
    let aircraft = null;
    let nextTrail = 0;
    let elapsed = 0;
    let emitters = [];

    function buildAircraft(state) {
      const root = new Group();
      root.name = `aircraft-model-${state}`;
      const wrecked = state === 'wreck';
      const materials = [];
      function material(options, unlit = false) {
        const surface = unlit ? new MeshBasicMaterial(options) : new MeshStandardMaterial(options);
        materials.push(surface);
        return surface;
      }
      const paint = (color, roughness = .72, metalness = .22) => material({ color, roughness, metalness });
      const skin = paint(0x65716e);
      const wingSkin = paint(0x53635e);
      const panel = paint(0x43524e);
      const belly = paint(0x565d59);
      const trim = paint(0xcba56a);
      const stencil = paint(0xa2a391);
      const metal = paint(0x828781, .48, .53);
      const steel = paint(0x36403d, .57, .58);
      const rubber = paint(0x242624, .91, .03);
      const glass = material({ color: 0x263d4a, roughness: .24, metalness: .36,
        emissive: 0x263d4a, emissiveIntensity: .23 });
      const portLight = material({ color: 0xff624a }, true);
      const starboardLight = material({ color: 0x94e9b1 }, true);
      const blur = material({ color: 0x9da39a, transparent: true, opacity: .105,
        depthWrite: false, side: DoubleSide }, true);
      const tipBlur = material({ color: 0xd7ba7e, transparent: true, opacity: .11,
        depthWrite: false, side: DoubleSide }, true);
      const wreck = material({ color: 0x3c362b, roughness: .95, metalness: .09 });
      const finishes = [skin, wingSkin, panel, belly];
      const originalFinishes = finishes.map(surface => surface.color.clone());
      const soot = new THREE.Color(0x302924);

      function mesh(geometry, surface, x, y, z, parent = root, castsShadow = true) {
        const piece = new Mesh(geometry, surface);
        piece.position.set(x, y, z);
        piece.castShadow = castsShadow;
        piece.receiveShadow = castsShadow;
        parent.add(piece);
        return piece;
      }

      function group(name, x, y, z, parent = root) {
        const node = new Group();
        node.name = name;
        node.position.set(x, y, z);
        parent.add(node);
        return node;
      }

      function block(w, h, d, x, y, z, surface, parent = root) {
        return mesh(new BoxGeometry(w, h, d), surface, x, y, z, parent);
      }

      function cylinder(front, back, length, x, y, z, surface, parent = root) {
        const shape = mesh(new CylinderGeometry(front, back, length, 20), surface, x, y, z, parent);
        shape.rotation.x = Math.PI / 2;
        return shape;
      }

      // Connect elliptical cross sections to give the fuselage and flight surfaces real volume.
      function loft(sections, sampleSection, surface, parent, segments = 28, start = 0,
        span = DISC_ROTATION, reverse = false) {
        const vertices = [];
        const uv = [];
        const indices = [];
        const stride = segments + 1;
        for (const [row, section] of sections.entries()) {
          for (let index = 0; index <= segments; index++) {
            const angle = start + span * index / segments;
            vertices.push(...sampleSection(section, Math.cos(angle), Math.sin(angle)));
            uv.push(index / segments, row / (sections.length - 1));
          }
        }
        for (let row = 0; row < sections.length - 1; row++) {
          for (let segment = 0; segment < segments; segment++) {
            const a = row * stride + segment;
            const b = a + 1;
            const c = a + stride;
            const d = c + 1;
            if (reverse) indices.push(a, c, b, b, c, d);
            else indices.push(a, b, c, b, d, c);
          }
        }
        const geometry = new BufferGeometry();
        geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        return mesh(geometry, surface, 0, 0, 0, parent);
      }

      const tornEdge = (cosine, sine) => {
        const angle = Math.atan2(sine, cosine);
        return .13 * Math.sin(angle * 7) + .071 * Math.sin(angle * 11 + .4) - .051 * Math.cos(angle * 4);
      };
      const bodyPoint = ([z, centerY, radiusX, radiusY, seam = 0], cosine, sine) =>
        [radiusX * cosine, centerY + radiusY * sine, z + seam * tornEdge(cosine, sine)];
      const cabin = [
        [-2.44, .03, .86, .88, 1], [-2.05, .02, 1.0, 1.01],
        [-1.34, 0, 1.02, 1.035], [1.45, 0, 1.02, 1.035],
        [2.05, -.005, .995, 1.02], [2.42, -.025, .945, .97],
        [2.88, -.075, .828, .852], [3.25, -.15, .69, .67],
        [3.62, -.22, .50, .45], [3.91, -.23, .29, .26], [4.03, -.23, .008, .008],
      ];
      const body = group('aircraft-fuselage', 0, 0, 0);
      const lowerSurface = loft(cabin.map(([z, y, x, h, seam]) => [z, y, x + .006, h + .008, seam]),
        bodyPoint, belly, body, 14, Math.PI + .27, Math.PI - .54);
      lowerSurface.name = 'aircraft-belly';
      loft(cabin, bodyPoint, skin, body);
      loft(cabin.slice(-3).map(([z, y, x, h]) => [z, y, x + .003, h + .003]),
        bodyPoint, panel, body);
      const doorOutline = [[-2.015, .02, 1.008, 1.018], [-1.3, 0, 1.028, 1.043]];
      for (const base of [-.03, Math.PI - .42]) {
        for (const edge of [0, .42]) {
          loft(doorOutline, bodyPoint, panel, body, 2, base + edge, .016);
        }
        for (const [z, y, x, h] of doorOutline) {
          loft([[z, y, x, h], [z + .022, y, x, h]],
            bodyPoint, panel, body, 6, base, .436);
        }
      }
      const tail = group('aircraft-tail-section', 0, .03, -2.44);
      loft([
        [-2.64, .27, .014, .014], [-2.46, .24, .18, .20], [-2.12, .20, .31, .31],
        [-1.55, .14, .51, .47], [-.80, .064, .73, .67], [0, 0, .86, .88, 1],
      ], bodyPoint, skin, tail);
      if (wrecked) {
        const tornBulkhead = group('aircraft-fractured-cabin', 0, .03, -2.44, body);
        loft([[0, 0, .86, .88, 1], [.17, 0, .80, .82, .32], [.38, 0, .80, .82], [.46, 0, .024, .024]],
          bodyPoint, wreck, tornBulkhead, 28, 0, DISC_ROTATION, true);
        const tailBulkhead = group('aircraft-fractured-tail', 0, 0, 0, tail);
        loft([[-.48, .05, .022, .022], [-.39, .045, .75, .69], [-.12, 0, .78, .81, .35], [0, 0, .86, .88, 1]],
          bodyPoint, steel, tailBulkhead, 28, 0, DISC_ROTATION, true);
        for (const [x, y, length, angle] of [
          [-.54, -.17, .61, -.42], [-.26, -.48, .50, -.62], [.24, -.59, .49, .48],
          [.56, .31, .66, .68], [.17, .69, .45, .17],
        ]) {
          const stringer = block(.075, .065, length, x, y, -.05, metal, tornBulkhead);
          stringer.rotation.set(x, angle, .22);
          const fold = block(.16, .024, .21, x * 1.18, y * 1.16, -.23, belly, tornBulkhead);
          fold.rotation.set(angle * 1.6, x, -.7);
        }
        for (const y of [-.55, -.34, .32]) {
          const rib = block(1.42, .063, .083, 0, y, -.13, metal, tailBulkhead);
          rib.rotation.set(y, .19, .15 + y * .29);
        }

      }

      const foilPoint = ([span, centerY, centerZ, halfChord, thickness], cosine, sine) =>
        [span, centerY + thickness * sine * (1 + .23 * cosine), centerZ + halfChord * cosine];
      const mainFoil = [
        [0, 0, .06, 1.58, .24], [1.1, .025, .01, 1.47, .215],
        [2.32, .10, -.06, 1.32, .176], [4.13, .20, -.16, .99, .127],
        [5.27, .29, -.28, .75, .08], [5.80, .33, -.51, .37, .047],
        [5.92, .34, -.55, .034, .008],
      ];
      const tailFoil = [
        [0, 0, 0, .67, .095], [.8, .024, -.14, .54, .073],
        [1.72, .093, -.44, .31, .045], [2.17, .125, -.53, .20, .028],
        [2.23, .13, -.55, .025, .006],
      ];
      const fin = group('aircraft-vertical-stabilizer', 0, .30, -1.55, tail);
      fin.rotation.z = Math.PI / 2;
      loft([
        [0, 0, .01, 1.11, .15], [.39, 0, -.12, .93, .13], [1.0, 0, -.35, .63, .10],
        [1.66, 0, -.61, .36, .064], [1.89, 0, -.65, .23, .039], [1.94, 0, -.68, .022, .006],
      ], foilPoint, panel, fin, 22, 0, DISC_ROTATION, true);

      const wings = [];
      const wheels = [];
      function strut(parent, x, y, z, dual) {
        const bay = group('aircraft-landing-gear', x, y, z, parent);
        const leg = new CylinderGeometry(.052, .072, .44, 12);
        mesh(leg, metal, 0, -.22, 0, bay);
        const brace = mesh(new CylinderGeometry(.025, .035, .33, 9), steel, 0, -.15, -.11, bay);
        brace.rotation.x = .68;
        for (const axle of dual ? [-.099, .099] : [0]) {
          const wheel = mesh(new CylinderGeometry(.199, .199, dual ? .142 : .125, 18),
            rubber, axle, -.49, 0, bay);
          wheel.rotation.z = Math.PI / 2;
          const hub = mesh(new CylinderGeometry(.089, .089, .025, 16),
            metal, axle * 1.7, -.49, 0, bay);
          hub.rotation.z = Math.PI / 2;
        }
        wheels.push(bay);
      }

      strut(body, 0, -.43, 2.97, false);
      for (const side of [-1, 1]) {
        const isRight = side > 0;
        const damagedWing = isRight && state === 'damaged';
        const horizontal = group('aircraft-horizontal-stabilizer', 0, .29, -1.87, tail);
        horizontal.scale.x = side;
        loft(tailFoil, foilPoint, wingSkin, horizontal, 20, 0, DISC_ROTATION, true);

        for (const [start, span] of (isRight ? [[.28, .30], [.64, .34], [1.04, .40]] :
          [[Math.PI - .58, .30], [Math.PI - .98, .34], [Math.PI - 1.44, .40]])) {
          const windowSections = cabin.slice(5, 8).map(([z, y, x, h]) => [z, y, x + .014, h + .014]);
          loft(windowSections, bodyPoint, glass, body, 5, start, span);
        }
        for (const z of [-1.62, -.98, -.34, .30, .94, 1.59]) {
          const pane = cylinder(.108, .111, .045, side * .982, .235, z, glass, body);
          pane.rotation.set(0, 0, Math.PI / 2);
          pane.scale.x = 1.25;
        }
        for (const y of [-.35, -.52]) {
          const marking = block(.011, .072, .59, side * Math.sqrt(1 - y * y) * 1.02, y, -1.17,
            trim, body);
          marking.rotation.z = Math.asin(y) * side;
        }

        const wing = group(isRight ? 'aircraft-starboard-wing' : 'aircraft-port-wing',
          side * .42, .64, .30);
        wing.scale.x = side;
        const fairing = [
          [0, -.085, .03, 1.71, .36], [.4, -.025, .04, 1.63, .27],
          [.85, .022, .025, 1.50, .21],
        ];
        loft(fairing, foilPoint, skin, wing, 24, 0, DISC_ROTATION, true);
        if (damagedWing) {
          const tornTip = ([span, y, z, chord, thickness, torn = 0], cosine, sine) =>
            [span + torn * (.25 * cosine + .12 * Math.sin(Math.atan2(sine, cosine) * 5)),
              y + thickness * sine * (1 + .23 * cosine), z + chord * cosine];
          loft([...mainFoil.slice(0, 5), [5.37, .31, -.32, .57, .071, 1]],
            tornTip, wingSkin, wing, 24, 0, DISC_ROTATION, true);
          loft([[5.21, .27, -.30, .49, .025], [5.37, .31, -.32, .57, .071, 1]],
            tornTip, wreck, wing, 24, 0, DISC_ROTATION);
          for (const [z, angle] of [[-.63, -.23], [-.21, .18], [.14, .30]]) {
            const spar = block(.45, .057, .079, 5.35, .3, z, metal, wing);
            spar.rotation.y = angle;
          }
        } else {
          loft(mainFoil, foilPoint, wingSkin, wing, 24, 0, DISC_ROTATION, true);
        }
        const wingStencil = [[4.41, .222, -.19, .94, .126], [4.62, .244, -.21, .897, .117]];
        loft(wingStencil, foilPoint, stencil, wing, 16, .48, 2.08, true);
        const aileronSeam = mainFoil.slice(3, 6).map(([x, y, z, chord, thickness]) =>
          [x, y, z - .008, chord, thickness + .006]);
        if (!damagedWing) {
          loft(aileronSeam, foilPoint, panel, wing, 2, 2.50, .045, true);
        }
        loft(mainFoil.slice(2, 5).map(([x, y, z, chord, thickness]) => [x, y - .009, z - .008,
          chord + .02, thickness + .006]), foilPoint, panel, wing, 8, 2.58, 1.18, true);
        if (!damagedWing) {
          mesh(new THREE.SphereGeometry(.105, 12, 8), isRight ? starboardLight : portLight,
            5.75, .334, -.326, wing, false).scale.set(1.05, .54, 1.13);
        }

        const engine = group('aircraft-engine-nacelle', 2.36, -.30, .07, wing);
        const nacelle = [
          [-1.71, .18, .045, .05], [-1.44, .15, .23, .22], [-1.11, .08, .42, .39],
          [-.57, .017, .51, .52], [.48, 0, .53, .565], [.93, 0, .516, .51],
          [1.09, 0, .456, .451], [1.11, 0, .295, .295], [1.02, 0, .22, .22],
        ];
        if (damagedWing) {
          loft(nacelle, bodyPoint, panel, engine, 28, .87, DISC_ROTATION - 1.32);
          loft(nacelle.map(([z, y, x, h]) => [z, y, x * .84, h * .70]),
            bodyPoint, wreck, engine, 12, -.45, 1.32);
          const peeledCowling = loft(nacelle.slice(3, 6), bodyPoint, metal, engine, 10, -.19, .57);
          peeledCowling.rotation.z = .38;
          peeledCowling.position.set(.12, .08, -.14);
          for (const z of [-.37, -.1, .16, .42]) {
            cylinder(.454, .454, .024, 0, 0, z, steel, engine).scale.z = .91;
          }
        } else {
          loft(nacelle, bodyPoint, panel, engine);
        }
        cylinder(.395, .423, .105, 0, 0, .976, steel, engine);
        cylinder(.28, .37, .079, 0, 0, 1.037, metal, engine);
        cylinder(.27, .30, .37, .27, -.38, -.83, steel, engine).scale.set(.33, 1, .44);
        strut(engine, 0, -.43, -.23, true);
        const propeller = group('aircraft-propeller', 0, 0, 1.15, engine);
        cylinder(.072, .218, .365, 0, 0, .135, metal, propeller);
        const blades = group('aircraft-propeller-blades', 0, 0, 0, propeller);
        for (let index = 0; index < (damagedWing ? 3 : 4); index++) {
          const blade = group('aircraft-propeller-blade', 0, 0, 0, blades);
          blade.rotation.z = index * DISC_ROTATION / 4;
          const bladeSpar = block(.144, 1.02, .035, .052, .641, -.015, steel, blade);
          bladeSpar.rotation.z = -.095;
          const tip = block(.126, .136, .038, .104, 1.198, -.015, trim, blade);
          tip.rotation.z = -.095;
        }
        const disc = group('aircraft-propeller-disc', 0, 0, 0, propeller);
        mesh(new RingGeometry(.18, 1.26, 36), blur, 0, 0, -.005, disc, false);
        mesh(new RingGeometry(1.13, 1.26, 36), tipBlur, 0, 0, .002, disc, false);
        wings.push({ wing, propeller, disc, blades });
      }

      const fragments = [];
      for (let index = 0; wrecked && index < 13; index++) {
        const fragment = group('aircraft-skin-fragment', 0, 0, 0);
        const angle = index * 2.399963;
        const width = .095 + (index % 4) * .09;
        const length = .23 + (index % 5) * .112;
        const folded = block(width, .03, length, 0, 0, 0, index % 3 === 0 ? metal : wreck, fragment);
        folded.rotation.y = .29;
        const flange = block(width * .7, .027, length * .6, width * .41, .038, -.06, wreck, fragment);
        flange.rotation.z = -.56;
        fragment.position.set(Math.cos(angle) * (1.3 + index % 5 * .81), -.8,
          -.72 + Math.sin(angle) * (1.2 + index % 4 * .79));
        fragment.rotation.set(index * .35, index * 1.21 + 4.5, 0);
        fragments.push(fragment);
      }
      const sootAmount = state === 'wreck' ? .66 : state === 'damaged' ? .19 : 0;
      finishes.forEach((surface, index) => surface.color.copy(originalFinishes[index]).lerp(soot, sootAmount));
      return { root, materials, state, wheels, wings, tail, fragments };
    }

    function stopEffects() {
      for (const { handle, position, kind } of emitters) {
        // The engine can reuse an emitter after its lifetime ends.
        if (!handle.pos || (handle.kind === kind && handle.pos.equals(position))) handle.stop?.();
      }
      emitters = [];
    }

    function startEffect(position, kind, life, scale, wreckAge) {
      const ttl = life - wreckAge;
      if (ttl <= 0) return;
      const handle = fx?.addEmitter?.(position, kind, { ttl, scale });
      if (handle) emitters.push({ handle, position, kind });
    }

    function showAircraft(state) {
      if (aircraft?.state === state) return;
      const next = buildAircraft(state);
      releaseAircraft();
      aircraft = next;
      transport.add(aircraft.root);
    }

    function releaseAircraft() {
      if (!aircraft) return;
      transport.remove(aircraft.root);
      aircraft.root.traverse(piece => piece.geometry?.dispose());
      aircraft.materials.forEach(surface => surface.dispose());
      aircraft = null;
    }

    function reset() {
      stopEffects();
      scene.remove(missile);
      scene.remove(transport);
      releaseAircraft();
      elapsed = 0;
      nextTrail = 0;
      nextMissileSmoke = 0;
      direction.set(1, 0, 0);
    }

    function launch() {
      if (aircraft) return false;
      flightPose(hitPose, DAMAGE_SECONDS);
      missileHit.copy(hitPose.localToWorld(point(2.83, .20, -.89)));
      missileStart.copy(missileHit).add(point(13, 3, 14));
      showAircraft('intact');
      scene.add(transport);
      fly(0);
      return true;
    }

    const clamp = n => Math.min(1, Math.max(0, n));
    const smooth = n => clamp(n) ** 2 * (3 - 2 * clamp(n));

    function aim(root, heading) {
      root.lookAt(target.copy(root.position).add(heading));
    }

    function setPropeller(engine, angle, running) {
      engine.propeller.rotation.z = angle;
      engine.disc.visible = running;
      engine.blades.visible = !running;
    }

    function flightPose(root,time) {
      const progress = time / FLIGHT_SECONDS;
      const turning = time < TURN_SECONDS;
      const segment = turning ? approach : descent;
      const segmentProgress = turning ? time / TURN_SECONDS : (time - TURN_SECONDS) / (FLIGHT_SECONDS - TURN_SECONDS);
      segment.getPoint(segmentProgress, sample);
      segment.getTangent(segmentProgress, direction);
      root.position.copy(sample);
      aim(root, direction);
      const bank = -.58 * (Math.sin(Math.PI * progress) ** 2) + .17 * Math.sin(progress * DISC_ROTATION);
      root.rotateZ(bank - .072 * smooth((progress - .84) / .16));
      root.rotateX(-.142 * smooth((progress - .78) / .22));
    }

    function fly(time) {
      const progress = time / FLIGHT_SECONDS;
      showAircraft(time < DAMAGE_SECONDS ? 'intact' : 'damaged');
      const { wheels, wings } = aircraft;
      flightPose(transport,time);
      setPropeller(wings[0], time * 86, true);
      const fade = smooth((time - 2.85) / 2.1);
      setPropeller(wings[1], -time * (81 - 67 * fade), aircraft.state === 'intact');
      for (const wheel of wheels) {
        wheel.rotation.x = -1.57 * (1 - smooth((progress - .54) / .37));
      }
    }

    function incomingMissile(time) {
      if (time < MISSILE_SECONDS || time >= DAMAGE_SECONDS) return;
      if (!missile.parent) scene.add(missile);
      const progress = (time - MISSILE_SECONDS) / (DAMAGE_SECONDS - MISSILE_SECONDS);
      flare.position.lerpVectors(missileStart, missileHit, progress);
      trailEnd.lerpVectors(missileStart, missileHit, Math.max(0, progress - .34));
      missileHeading.subVectors(flare.position, trailEnd);
      const length = missileHeading.length();
      trail.position.lerpVectors(flare.position, trailEnd, .5);
      trail.scale.y = Math.max(.001, length);
      if (length > .001) {
        flare.quaternion.setFromUnitVectors(groundNormal, missileHeading.normalize());
        trail.quaternion.copy(flare.quaternion);
      }
      if (time < nextMissileSmoke) return;
      nextMissileSmoke = time + .047;
      fx?.smoke?.(trailEnd, { size: .62, life: 1.5, color: 0xa8aaa4, alpha: .63, count: 3 });
    }

    function airburst() {
      scene.remove(missile);
      if (fx?.explosion && !fx.stub) fx.explosion(missileHit, 1.4);
      else events?.emit?.('explosion', { pos: missileHit.clone(), size: 1.4 });
      fx?.sparks?.(missileHit, point(-1, -.2, -.15), 20);
    }

    function slide(time) {
      const progress = clamp(time / SLIDE_SECONDS);
      const travel = 1 - (1 - progress) ** 2.3;
      const breakup = smooth((progress - .16) / .84);
      const { wings, wheels, tail } = aircraft;
      const root = transport;
      const wrecked = aircraft.state === 'wreck';
      root.position.lerpVectors(contact, impact, travel);
      root.position.y += .36 * Math.sin(Math.PI * clamp(progress / .54));
      direction.subVectors(impact, contact).setY(-.75 * (1 - smooth(progress / .6))).normalize();
      aim(root, direction);
      root.rotateY(.16 * breakup);
      root.rotateX(-.142 + .099 * smooth(progress / .36) + .17 * Math.sin(progress * Math.PI * 2) * (1 - progress) + .086 * breakup);
      root.rotateZ(-.072 + .14 * Math.sin(progress * Math.PI * 2) * (1 - progress) + .21 * breakup);

      for (const [index, engine] of wings.entries()) {
        const side = index === 0 ? -1 : 1;
        const separation = wrecked ? 1 : smooth((progress - .26) / .74) * .08;
        engine.wing.position.set(side * (.42 + (index === 0 ? .36 : 1.62) * separation),
          .64 + (index === 0 ? -.28 : -.98) * separation,
          .30 + (index === 0 ? .47 : -1.2) * separation);
        engine.wing.rotation.set(.18 * separation, side * .16 * separation, -side * .17 * separation);
        setPropeller(engine, index === 0 ? FLIGHT_SECONDS * 86 + 13 * travel :
          -FLIGHT_SECONDS * 14 - 1.8 * travel, index === 0 && progress < .29);
      }
      if (wrecked) {
        tail.position.set(.58, -.31, -3.51);
        tail.rotation.set(-.01, -.37, .28);
      }
      for (const [index, wheel] of wheels.entries()) {
        wheel.rotation.x = .96 * travel;
        wheel.rotation.z = (index === 1 ? .54 : -.75) * breakup;
      }
      if (progress > .37) settleLooseParts(aircraft, smooth((progress - .37) / .22));
    }

    // Keep torn pieces above the surface as they roll away from the fuselage.
    const partBounds = new THREE.Box3();
    const meshBounds = new THREE.Box3();
    const groundShift = new Vector3();
    function settleLooseParts(model, weight) {
      transport.updateMatrixWorld(true);
      for (const part of [model.tail, ...model.wings.map(engine => engine.wing), ...model.fragments]) {
        partBounds.makeEmpty();
        part.traverseVisible(piece => {
          if (!piece.geometry) return;
          if (!piece.geometry.boundingBox) piece.geometry.computeBoundingBox();
          partBounds.union(meshBounds.copy(piece.geometry.boundingBox).applyMatrix4(piece.matrixWorld));
        });
        const lift = (.06 - partBounds.min.y) * weight;
        if (lift <= 0) continue;
        part.getWorldPosition(groundShift);
        groundShift.y += lift;
        model.root.worldToLocal(groundShift);
        part.position.copy(groundShift);
      }
    }

    function emitFlightTrail(time) {
      if (time < DAMAGE_SECONDS || time < nextTrail) return;
      nextTrail = time + .085;
      const progress = time / FLIGHT_SECONDS;
      transport.localToWorld(effectPosition.set(2.83, .20, -.89));
      fx?.smoke?.(effectPosition, {
        size: .80 + 1.46 * progress, life: 3.9, color: 0x1a2023, alpha: .66,
        rise: .42, count: 3, vel: sample.set(-1.2, .08, -.13),
      });
      if (progress > .55 && Math.floor(time / .085) % 4 === 0) {
        fx?.sparks?.(effectPosition, sample.set(-1, -.24, .32), 5);
      }
    }

    function emitScrape(time) {
      if (time < nextTrail) return;
      nextTrail = time + .085;
      transport.localToWorld(effectPosition.set(1.04, -.92, .78));
      effectPosition.y = .24;
      fx?.sparks?.(effectPosition, sample.set(-1, .48, .30), 11);
      fx?.dust?.(effectPosition, sample.set(-.8, .46, -.14), 2.15, .52, .47, .40);
      fx?.smoke?.(effectPosition, {
        size: 1.9, life: 2.7, color: 0x4d4941, alpha: .59, rise: .18,
        count: 3, vel: sample.set(-2, .25, .4),
      });
    }

    function touchdown() {
      const touchdownPoint = point(contact.x, .22, contact.z);
      fx?.debris?.(touchdownPoint, { mat: 'steel_galv', speed: 8, count: 19, size: .12 });
      fx?.dust?.(touchdownPoint, groundNormal, 3.3, .53, .49, .42);
      fx?.sparks?.(touchdownPoint, point(-1, .4, 0), 26);
      events?.emit?.('campaign:aircraft-touchdown', { pos: touchdownPoint, size: 1.55 });
    }

    function burst() {
      const epicenter = point(impact.x + .46, .65, impact.z - 1.34);
      if (fx?.explosion && !fx.stub) fx.explosion(epicenter, 3.7);
      else events?.emit?.('explosion', { pos: epicenter, size: 3.7 });
      for (const side of [-1, 1]) {
        const origin = point(impact.x - .75, .26, impact.z + side * 2.7);
        fx?.dust?.(origin, point(-.28, .50, side), 3, .56, .50, .42);
        fx?.debris?.(origin, { mat: 'steel_rust', speed: 12, count: 19, size: .14 });
      }
    }

    function startWreck(wreckAge) {
      startEffect(point(impact.x + .95, .89, impact.z - 2.98), 'fire', 36, 1.7, wreckAge);
      startEffect(point(impact.x - 1.26, .98, impact.z + .18), 'fire', 20, 1.2, wreckAge);
      startEffect(point(impact.x + .78, 1.27, impact.z - 3.2), 'smolder', 85, 2.35, wreckAge);
      startEffect(point(impact.x - 2.33, 1.1, impact.z + .07), 'smolder', 72, 1.78, wreckAge);
      startEffect(point(impact.x + .95, .89, impact.z - 2.9), 'embers', 43, 1.5, wreckAge);
    }

    function skip({ silent = false } = {}) {
      if (!aircraft || elapsed >= IMPACT_SECONDS) return false;
      scene.remove(missile);
      elapsed = IMPACT_SECONDS;
      showAircraft('wreck');
      slide(SLIDE_SECONDS);
      if (!silent) burst();
      startWreck(0);
      return true;
    }

    function update(dt) {
      if (!aircraft || !Number.isFinite(dt) || dt <= 0) return;
      const previous = elapsed;
      elapsed += dt;
      if (previous < DAMAGE_SECONDS && elapsed >= DAMAGE_SECONDS) {
        showAircraft('damaged');
        airburst();
      }
      if (elapsed < FLIGHT_SECONDS) {
        fly(elapsed);
        incomingMissile(elapsed);
        emitFlightTrail(elapsed);
        return;
      }

      const slideTime = elapsed - FLIGHT_SECONDS;
      if (slideTime < SLIDE_SECONDS) {
        showAircraft('damaged');
        if (previous < FLIGHT_SECONDS) {
          nextTrail = 0;
          touchdown();
        }
        slide(slideTime);
        emitScrape(slideTime);
        return;
      }

      const wreckAge = elapsed - IMPACT_SECONDS;
      if (previous < IMPACT_SECONDS) {
        showAircraft('wreck');
        slide(SLIDE_SECONDS);
        burst();
        if (wreckAge < WRECK_SECONDS) startWreck(wreckAge);
      }
      if (wreckAge >= WRECK_SECONDS) reset();
    }

    return {
      launch, update, reset, skip,
      get active() { return aircraft !== null; },
      get duration() { return IMPACT_SECONDS; },
      get elapsed() { return elapsed; },
      get modelState() { return aircraft?.state ?? 'idle'; },
      get missileVisible() { return missile.parent !== null; },
      get phase() {
        if (!aircraft) return 'idle';
        if (elapsed < TURN_SECONDS) return 'approach';
        if (elapsed < FLIGHT_SECONDS) return 'descent';
        if (elapsed < IMPACT_SECONDS) return 'slide';
        return 'wreck';
      },
      get impact() { return impact.clone(); },
      get viewingSpot() { return viewingSpot.clone(); },
      get focus() { return focus.clone(); },
      get position() { return aircraft ? transport.position : focus; },
      get forward() { return direction.clone(); },
    };
  };
})();
