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

  function createAirframe(THREE, state, finishesByPart) {
    const { BoxGeometry, BufferGeometry, CylinderGeometry, DataTexture, DoubleSide,
      Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, RingGeometry, Vector3 } = THREE;
    // The UVs follow the skin around each cross-section, then along the airframe or span.
    // Paint, the tiny joint relief, and the change in gloss therefore stay registered.
    function airframeFinish(kind) {
      const width = kind === 'fuselage' ? 512 : 256;
      const height = width;
      const color = new Uint8Array(width * height * 4);
      const surface = new Uint8Array(color.length);
      const intervals = kind === 'fuselage'
        ? [[.17, .0, 1], [.29, .27, .73], [.39, .02, .98], [.55, .19, .81], [.72, 0, 1], [.93, 0, 1]]
        : kind === 'wing'
          ? [[.246, .055, .94], [.52, .12, .87], [.738, .10, .91], [.865, .2, .80]]
          : [[.21, .032, .967], [.39, 0, 1], [.71, .04, .96], [.875, 0, 1]];
      const serial = [
        '111 100 000 111 111', '100 100 000 001 001', '111 100 111 111 010',
        '001 100 000 100 010', '111 111 000 111 100',
      ].map(row => row.replaceAll(' ', '0'));
      let seed = 1142;
      for (let y = 0; y < height; y++) {
        const v = (y + .5) / height;
        const joint = intervals.find(([station]) => Math.abs(v - station) < .005);
        for (let x = 0; x < width; x++) {
          const u = (x + .5) / width;
          const side = Math.sin(u * DISC_ROTATION);
          const sideUV = u < .25 || u > .75 ? u > .75 ? u - 1 : u : .5 - u;
          const camber = Math.min(u, 1 - u);
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
          const grain = (seed >>> 24) / 255 - .5;
          const crossSeam = joint && u >= joint[1] && u < joint[2] ? Math.abs(v - joint[0]) : 1;
          const alongSeam = kind === 'fuselage' ? Math.min(Math.abs(u - .185), Math.abs(u - .315),
            Math.abs(u - .618), Math.abs(u - .882)) : kind === 'wing' ? Math.min(
            Math.abs(camber - .105), v > .28 && v < .949 ? Math.abs(camber - .347) : 1)
            : Math.min(Math.abs(u - .125), Math.abs(u - .385), Math.abs(u - .615), Math.abs(u - .875));
          const lateralJoint = kind === 'fuselage' && (v < .24 || v > .81) ? 1 : alongSeam;
          const seam = Math.min(crossSeam * height, lateralJoint * width);
          const rivet = (crossSeam * height > 1.4 && crossSeam * height < 2.7 && x % 9 < 2) ||
            (lateralJoint * width > 1.1 && lateralJoint * width < 2.2 && y % 8 < 2);
          let pigment;
          let roughness;
          if (kind === 'fuselage') {
            const upsweep = .30 * Math.max(0, (1 - v * 6)) ** 2;
            const waterline = -.35 + upsweep - .20 * Math.max(0, (v - .87) / .13) ** 1.6;
            pigment = side < waterline - .08 ? [61, 85, 88] :
              side < waterline ? [180, 107, 49] : [194, 200, 185];
            roughness = side < waterline - .08 ? 185 : 163;
            if (v > .977) pigment = [67, 78, 76];
            if (v > .364 && v < .557 && sideUV > -.041 && sideUV < -.003) {
              const letter = serial[Math.floor((sideUV + .041) / .038 * 5)];
              const along = (v - .364) / .193;
              const column = Math.floor((u > .25 && u < .75 ? along : 1 - along) * 19);
              if (letter?.[column] === '1') pigment = [64, 82, 80];
            }
          } else if (kind === 'wing') {
            pigment = camber < .054 ? [142, 156, 150] : u < .5 ? [182, 189, 176] : [151, 166, 158];
            if (v > .86 && v < .895 && camber > .082 && camber < .352) pigment = [177, 106, 50];
            roughness = camber < .054 ? 128 : 172;
          } else {
            pigment = v > .917 ? [133, 148, 144] : side < -.3 ? [74, 97, 99] : [181, 188, 176];
            const slots = v > .47 && v < .69 && Math.abs(sideUV) < .076 && y % 7 < 3;
            if (slots) pigment = [71, 80, 69];
            roughness = v > .917 ? 125 : 166;
          }
          const wear = Math.sin(u * 111 + Math.sin(v * 76)) * Math.sin(v * 143 + Math.cos(u * 64));
          const streak = Math.max(0, Math.sin(u * 179 + Math.cos(u * 50))) ** 8 *
            Math.max(0, Math.sin(v * 50 + 1.7)) ** 3;
          // Subtle per-panel aluminum tonal variation so riveted skin sheets read individually.
          const panelId = Math.floor(v * 7) * 13 + Math.floor(u * 6);
          const panelTone = (Math.sin(panelId * 12.9898) * 43758.5453 % 1 - .5) * 9;
          // Wing NO STEP walkway border & fuselage cheatline trim
          if (kind === 'wing' && u < .5 && v > .18 && v < .76) {
            const onBorder = (Math.abs(camber - .16) < .007 || Math.abs(camber - .31) < .007) && (y % 6 < 4);
            if (onBorder) pigment = [176, 112, 52];
          }
          if (kind === 'fuselage' && v > .24 && v < .80 && Math.abs(side - .19) < .014) {
            pigment = [72, 92, 94];
          }
          const weather = grain * 10 + wear * 4 + panelTone - streak * (kind === 'nacelle' ? 18 : 9);
          const change = weather - (seam < .8 ? 22 : 0) + (rivet ? 11 : 0);
          const offset = (y * width + x) * 4;
          color[offset] = Math.max(0, Math.min(255, pigment[0] + change));
          color[offset + 1] = Math.max(0, Math.min(255, pigment[1] + change - streak * 2));
          color[offset + 2] = Math.max(0, Math.min(255, pigment[2] + change - streak * 4));
          color[offset + 3] = 255;
          surface[offset] = seam < .8 ? 96 : rivet ? 160 : 128 + grain * 8;
          surface[offset + 1] = Math.max(30, Math.min(245, roughness + wear * 16 + streak * 22));
          surface[offset + 2] = 255;
          surface[offset + 3] = 255;
        }
      }

      function texture(pixels, colorSpace) {
        const result = new DataTexture(pixels, width, height);
        result.colorSpace = colorSpace;
        result.wrapS = THREE.RepeatWrapping;
        result.magFilter = THREE.LinearFilter;
        result.minFilter = THREE.LinearMipmapLinearFilter;
        result.generateMipmaps = true;
        result.anisotropy = 4;
        result.needsUpdate = true;
        return result;
      }

      const map = texture(color, THREE.SRGBColorSpace);
      const bumpMap = texture(surface, THREE.NoColorSpace);
      return { map, bumpMap, roughnessMap: bumpMap, bumpScale: .0045 };
    }

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
      function finish(kind, color) {
        if (!finishesByPart.has(kind)) finishesByPart.set(kind, airframeFinish(kind));
        return material({ ...finishesByPart.get(kind), color, roughness: .84, metalness: .18 });
      }
      const skin = finish('fuselage', 0x7e8982);
      const wingSkin = finish('wing', 0x718077);
      const cowl = finish('nacelle', 0x697870);
      const panel = paint(0x43524e);
      const belly = paint(0x565d59);
      const trim = paint(0xcba56a);
      const stencil = paint(0xa2a391);
      const metal = paint(0x828781, .48, .53);
      const steel = paint(0x36403d, .57, .58);
      const rubber = paint(0x242624, .91, .03);
      // Deep reflective tinted armored aviation glass instead of flat bright cyan
      const glass = material({ color: 0x0c1820, roughness: .08, metalness: .88,
        emissive: 0x07131b, emissiveIntensity: .16 });
      const portLight = material({ color: 0xff624a }, true);
      const starboardLight = material({ color: 0x94e9b1 }, true);
      const landingLight = material({ color: 0xfff0d4 }, true);
      const blur = material({ color: 0x9da39a, transparent: true, opacity: .105,
        depthWrite: false, side: DoubleSide }, true);
      const tipBlur = material({ color: 0xd7ba7e, transparent: true, opacity: .11,
        depthWrite: false, side: DoubleSide }, true);
      const wreck = material({ color: 0x3c362b, roughness: .95, metalness: .09 });
      const finishes = [skin, wingSkin, cowl, panel, belly];
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
        span = DISC_ROTATION, reverse = false, uvRange = null) {
        const vertices = [];
        const uv = [];
        const indices = [];
        const stride = segments + 1;
        for (const [row, section] of sections.entries()) {
          for (let index = 0; index <= segments; index++) {
            const angle = start + span * index / segments;
            vertices.push(...sampleSection(section, Math.cos(angle), Math.sin(angle)));
            const ordinate = section[0];
            if (uvRange) {
              uv.push(angle / DISC_ROTATION, (ordinate - uvRange[0]) / (uvRange[1] - uvRange[0]));
            } else {
              uv.push(index / segments, row / (sections.length - 1));
            }
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
        if (span === DISC_ROTATION) {
          // Keep separate UVs at the wrap while lighting both copies of the edge equally.
          const normals = geometry.attributes.normal;
          const first = new Vector3();
          const last = new Vector3();
          for (let row = 0; row < sections.length; row++) {
            const a = row * stride;
            const b = a + segments;
            first.fromBufferAttribute(normals, a).add(last.fromBufferAttribute(normals, b)).normalize();
            normals.setXYZ(a, first.x, first.y, first.z);
            normals.setXYZ(b, first.x, first.y, first.z);
          }
        }
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
        [3.51, -.20, .557, .516], [3.62, -.22, .50, .45],
        [3.77, -.228, .411, .367], [3.91, -.23, .29, .26],
        [3.978, -.23, .195, .174], [4.012, -.23, .113, .101],
        [4.026, -.23, .045, .04], [4.03, -.23, .008, .008],
      ];
      const cockpit = cabin.filter(([z]) => z >= 2.42 && z <= 3.51);
      const body = group('aircraft-fuselage', 0, 0, 0);
      const lowerSurface = loft(cabin.map(([z, y, x, h, seam]) => [z, y, x + .006, h + .008, seam]),
        bodyPoint, belly, body, 14, Math.PI + .27, Math.PI - .54);
      lowerSurface.name = 'aircraft-belly';
      loft(cabin, bodyPoint, skin, body, 64, 0, DISC_ROTATION, false, [-2.44, 4.03]);
      // Nose weather-radar radome cap, SATCOM fairing, VHF blade antennas & belly beacon
      loft(cabin.slice(-6).map(([z, y, x, h]) => [z + .008, y, x + .005, h + .005]),
        bodyPoint, steel, body, 24, 0, DISC_ROTATION);
      const satcom = mesh(new THREE.SphereGeometry(.26, 16, 10), panel, 0, 1.01, -.55, body);
      satcom.scale.set(.78, .36, 1.9);
      const dorsalBeacon = mesh(new THREE.SphereGeometry(.055, 10, 8), portLight, 0, 1.06, .62, body, false);
      dorsalBeacon.scale.set(1, .8, 1.2);
      const bellyBeacon = mesh(new THREE.SphereGeometry(.055, 10, 8), portLight, 0, -1.03, -.45, body, false);
      bellyBeacon.scale.set(1, .75, 1.2);
      const aftAntenna = block(.032, .18, .17, 0, 1.05, -1.65, steel, body);
      aftAntenna.rotation.x = -.45;

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
      ], bodyPoint, skin, tail, 64, 0, DISC_ROTATION, false, [-5.08, 1.39]);
      // Swept dorsal fin fillet fairing blending the tailcone into the vertical stabilizer
      const dorsalFillet = block(.13, .42, 1.24, 0, .55, -.74, panel, tail);
      dorsalFillet.rotation.x = .34;
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
        [0, -.067, .045, 1.69, .324], [.42, -.02, .04, 1.61, .273],
        [.82, .012, .025, 1.51, .235], [1.1, .025, .01, 1.47, .215],
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
      const finFoil = [
        [0, 0, .01, 1.11, .15], [.39, 0, -.12, .93, .13], [1.0, 0, -.35, .63, .10],
        [1.66, 0, -.61, .36, .064], [1.89, 0, -.65, .23, .039], [1.94, 0, -.68, .022, .006],
      ];
      loft(finFoil, foilPoint, wingSkin, fin, 32, 0, DISC_ROTATION, true, [0, 1.94]);
      const rudder = finFoil.slice(1, 5).map(([x, y, z, chord, thickness]) =>
        [x, y, z - .01, chord + .008, thickness + .005]);
      loft(rudder, foilPoint, panel, fin, 12, 2.67, .94, true);
      loft([
        [1.47, 0, -.535, .442, .081], [1.61, 0, -.590, .386, .074],
      ], foilPoint, stencil, fin, 32, 0, DISC_ROTATION, true);
      // Tail strobe light at fin tip
      mesh(new THREE.SphereGeometry(.045, 10, 8), landingLight, 1.93, 0, -.68, fin, false);
      const antenna = block(.042, .15, .23, 0, 1.06, 1.32, panel, body);
      antenna.rotation.x = -.52;

      const wings = [];
      const wheels = [];
      function strut(parent, x, y, z, dual) {
        const bay = group('aircraft-landing-gear', x, y, z, parent);
        const leg = new CylinderGeometry(.052, .072, .44, 12);
        mesh(leg, steel, 0, -.18, 0, bay);
        mesh(new CylinderGeometry(.036, .036, .24, 12), metal, 0, -.36, 0, bay);
        const rocker = block(.135, .055, .06, 0, -.32, .039, metal, bay);
        rocker.rotation.x = -.48;
        const fork = mesh(new CylinderGeometry(.051, .051, dual ? .35 : .13, 14),
          steel, 0, -.49, 0, bay);
        fork.rotation.z = Math.PI / 2;
        const brace = mesh(new CylinderGeometry(.025, .035, .33, 9), steel, 0, -.15, -.11, bay);
        brace.rotation.x = .68;
        if (!dual) {
          // Twin taxi/landing lamps mounted on nose gear strut
          for (const lx of [-.07, .07]) {
            cylinder(.032, .032, .04, lx, -.26, .075, landingLight, bay);
          }
        }
        for (const axle of dual ? [-.099, .099] : [0]) {
          const wheel = mesh(new CylinderGeometry(.199, .199, dual ? .142 : .125, 18),
            rubber, axle, -.49, 0, bay);
          wheel.rotation.z = Math.PI / 2;
          const hub = mesh(new CylinderGeometry(.089, .089, .025, 16),
            metal, axle * 1.7, -.49, 0, bay);
          hub.rotation.z = Math.PI / 2;
          const side = axle < 0 ? -1 : 1;
          const inset = mesh(new CylinderGeometry(.054, .054, .022, 12), steel,
            axle + side * (dual ? .083 : .069), -.49, 0, bay);
          inset.rotation.z = Math.PI / 2;
        }
        wheels.push(bay);
      }

      strut(body, 0, -.43, 2.97, false);
      for (const side of [-1, 1]) {
        const isRight = side > 0;
        const damagedWing = isRight && state === 'damaged';
        const horizontal = group('aircraft-horizontal-stabilizer', 0, .29, -1.87, tail);
        horizontal.scale.x = side;
        loft(tailFoil, foilPoint, wingSkin, horizontal, 20, 0, DISC_ROTATION, true, [0, 2.23]);
        // Elevator trim panel seam on horizontal stabilizer
        loft(tailFoil.slice(1, 4).map(([x, y, z, chord, thickness]) =>
          [x, y, z - .006, chord + .005, thickness + .004]), foilPoint, panel, horizontal, 8, 2.65, .92, true);

        // Pitot static probes on nose sides
        cylinder(.011, .014, .26, side * .64, -.16, 3.36, metal, body);

        for (const [first, last, start, span] of [[0, 2, .39, .34], [1, 3, .79, .33], [1, 3, 1.18, .33]]) {
          const angle = isRight ? start : Math.PI - start - span;
          const profiles = cockpit.slice(first, last + 1);
          const raised = lift => profiles.map(([z, y, x, h]) => [z, y, x + lift, h + lift]);
          loft(raised(.016), bodyPoint, steel, body, 10, angle - .028, span + .056);
          const glazing = loft(raised(.021), bodyPoint, glass, body, 10, angle, span);
          glazing.name = 'aircraft-cockpit-glazing';
        }
        // Dual windscreen wipers & nose radome service detail
        const wiper = block(.022, .022, .34, side * .24, .31, 3.24, steel, body);
        wiper.rotation.set(.42, side * .35, 0);
        for (const z of [-1.62, -.98, -.34, .30, .94, 1.59]) {
          // Metallic window surround bezel + recessed glass porthole
          const bezel = cylinder(.126, .129, .032, side * .978, .235, z, steel, body);
          bezel.rotation.set(0, 0, Math.PI / 2);
          bezel.scale.x = 1.24;
          const pane = cylinder(.108, .111, .045, side * .984, .235, z, glass, body);
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
        if (damagedWing) {
          const tornTip = ([span, y, z, chord, thickness, torn = 0], cosine, sine) =>
            [span + torn * (.25 * cosine + .12 * Math.sin(Math.atan2(sine, cosine) * 5)),
              y + thickness * sine * (1 + .23 * cosine), z + chord * cosine];
          loft([...mainFoil.slice(0, -2), [5.37, .31, -.32, .57, .071, 1]],
            tornTip, wingSkin, wing, 40, 0, DISC_ROTATION, true, [0, 5.92]);
          loft([[5.21, .27, -.30, .49, .025], [5.37, .31, -.32, .57, .071, 1]],
            tornTip, wreck, wing, 24, 0, DISC_ROTATION);
          for (const [z, angle] of [[-.63, -.23], [-.21, .18], [.14, .30]]) {
            const spar = block(.45, .057, .079, 5.35, .3, z, metal, wing);
            spar.rotation.y = angle;
          }
        } else {
          loft(mainFoil, foilPoint, wingSkin, wing, 40, 0, DISC_ROTATION, true, [0, 5.92]);
          // Subtle aerodynamic wingtip endplate fairing
          const tipCap = block(.04, .22, .66, 5.84, .36, -.52, panel, wing);
          tipCap.rotation.z = -.24;
        }
        // Streamlined under-wing flap-track fairings (canoe pods) & inboard landing light
        for (const [fx, fy, fz] of [[1.42, -.08, -.92], [3.35, .06, -.96], [4.58, .16, -.86]]) {
          if (damagedWing && fx > 4.4) continue;
          const pod = mesh(new THREE.SphereGeometry(.095, 12, 8), panel, fx, fy, fz, wing);
          pod.scale.set(.72, .85, 4.6);
        }
        mesh(new THREE.SphereGeometry(.065, 10, 8), landingLight, 1.38, .03, 1.44, wing, false).scale.set(1.3, .7, .6);
        const wingStencil = [[4.41, .222, -.19, .94, .126], [4.62, .244, -.21, .897, .117]];
        loft(wingStencil, foilPoint, stencil, wing, 16, .48, 2.08, true);
        const aileronSeam = mainFoil.slice(-4, -1).map(([x, y, z, chord, thickness]) =>
          [x, y, z - .008, chord, thickness + .006]);
        if (!damagedWing) {
          loft(aileronSeam, foilPoint, panel, wing, 2, 2.50, .045, true);
        }
        loft(mainFoil.slice(-5, -2).map(([x, y, z, chord, thickness]) => [x, y - .009, z - .008,
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
          loft(nacelle, bodyPoint, cowl, engine, 40, .87, DISC_ROTATION - 1.32, false, [-1.71, 1.11]);
          loft(nacelle.map(([z, y, x, h]) => [z, y, x * .84, h * .70]),
            bodyPoint, wreck, engine, 12, -.45, 1.32);
          const peeledCowling = loft(nacelle.slice(3, 6), bodyPoint, metal, engine, 10, -.19, .57);
          peeledCowling.rotation.z = .38;
          peeledCowling.position.set(.12, .08, -.14);
          for (const z of [-.37, -.1, .16, .42]) {
            cylinder(.454, .454, .024, 0, 0, z, steel, engine).scale.z = .91;
          }
        } else {
          loft(nacelle, bodyPoint, cowl, engine, 48, 0, DISC_ROTATION, false, [-1.71, 1.11]);
        }
        // Dorsal oil-cooler intake scoop on nacelle top & recessed turbine compressor fan
        block(.22, .11, .56, 0, .54, .32, panel, engine);
        cylinder(.395, .423, .105, 0, 0, .976, steel, engine);
        cylinder(.28, .37, .079, 0, 0, 1.037, metal, engine);
        for (let b = 0; b < 8; b++) {
          const vane = block(.032, .34, .018, 0, 0, 1.01, steel, engine);
          vane.rotation.z = b * Math.PI / 4;
        }
        const exhaustSide = .37;
        cylinder(.19, .15, .53, exhaustSide, -.32, -.86, metal, engine).scale.set(.57, 1, .77);
        cylinder(.107, .13, .028, exhaustSide, -.32, -1.135, steel, engine).scale.set(.59, 1, .77);
        strut(engine, 0, -.43, -.23, true);
        const propeller = group('aircraft-propeller', 0, 0, 1.15, engine);
        cylinder(.072, .218, .365, 0, 0, .135, metal, propeller);
        const blades = group('aircraft-propeller-blades', 0, 0, 0, propeller);
        for (let index = 0; index < (damagedWing ? 3 : 4); index++) {
          const blade = group('aircraft-propeller-blade', 0, 0, 0, blades);
          blade.rotation.z = index * DISC_ROTATION / 4;
          const bladeSections = [
            [.15, .008, .014, .091, .032], [.33, .018, .025, .133, .039],
            [.70, .052, .019, .112, .028], [1.04, .096, .008, .083, .018],
            [1.17, .119, .006, .057, .013], [1.26, .129, .01, .009, .005],
          ];
          const bladePoint = ([radius, x, z, chord, thickness], cosine, sine) =>
            [x + chord * cosine, radius, z + thickness * sine - chord * cosine * (.39 - radius * .23)];
          loft(bladeSections.slice(0, 5), bladePoint, steel, blade, 12, 0, DISC_ROTATION, true);
          loft(bladeSections.slice(-2), bladePoint, trim, blade, 12, 0, DISC_ROTATION, true);
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

    return buildAircraft(state);
  }

  window.createParkedTransport = THREE => {
    const finishes = new Map();
    const model = createAirframe(THREE, 'intact', finishes);
    for (const wing of model.wings) wing.disc.visible = false;
    model.root.updateMatrixWorld(true);
    for (const gear of model.wheels) {
      const bottom = new THREE.Box3().setFromObject(gear, true).min.y;
      const extension = bottom + 1.55;
      for (const part of gear.children) {
        if (part.position.y < -.25) part.position.y -= extension;
      }
      const piston = new THREE.Mesh(new THREE.CylinderGeometry(.041,.041,extension+.08,16), gear.children[0].material);
      piston.position.y = -.30-extension/2;
      gear.add(piston);
    }
    model.root.updateMatrixWorld(true);
    return {
      root: model.root,
      dispose() {
        model.root.traverse(node => node.geometry?.dispose());
        model.materials.forEach(material => material.dispose());
        for (const { map, bumpMap } of finishes.values()) { map.dispose(); bumpMap.dispose(); }
      },
    };
  };

  window.createCampaignCrash = (world, { retainWreck = false } = {}) => {
    const { THREE, scene, fx, events } = world;
    const { BoxGeometry, BufferGeometry, CubicBezierCurve3, CylinderGeometry,
      DataTexture, DoubleSide, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial,
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
    const trail = new Mesh(new CylinderGeometry(.028, .17, 1, 12),
      new MeshBasicMaterial({ color: 0xffb34d, transparent: true, opacity: .82 }));
    const flare = new Mesh(new CylinderGeometry(.045, .11, .52, 12),
      new MeshBasicMaterial({ color: 0xfff3db }));
    // Attach sculpted missile fuselage, warhead band, nose cone, and cruciform fins to `flare`.
    const missileBodyMat = new MeshStandardMaterial({ color: 0xd4d8d2, roughness: .42, metalness: .35 });
    const missileDarkMat = new MeshStandardMaterial({ color: 0x2c3336, roughness: .48, metalness: .55 });
    const missileBandMat = new MeshStandardMaterial({ color: 0xd94b2b, roughness: .45, metalness: .2 });
    const missileTube = new Mesh(new CylinderGeometry(.082, .082, 1.38, 14), missileBodyMat);
    missileTube.position.y = .72;
    const missileBand = new Mesh(new CylinderGeometry(.084, .084, .18, 14), missileBandMat);
    missileBand.position.y = 1.12;
    const missileNose = new Mesh(new CylinderGeometry(.006, .082, .42, 14), missileDarkMat);
    missileNose.position.y = 1.62;
    const missileNozzle = new Mesh(new CylinderGeometry(.065, .084, .16, 12), missileDarkMat);
    missileNozzle.position.y = -.02;
    flare.add(missileTube, missileBand, missileNose, missileNozzle);
    for (let i = 0; i < 4; i++) {
      const fin = new Mesh(new BoxGeometry(.016, .34, .28), missileDarkMat);
      const angle = i * Math.PI / 2;
      fin.position.set(Math.cos(angle) * .15, .24, Math.sin(angle) * .15);
      fin.rotation.y = -angle;
      const canard = new Mesh(new BoxGeometry(.012, .14, .14), missileDarkMat);
      canard.position.set(Math.cos(angle) * .11, 1.24, Math.sin(angle) * .11);
      canard.rotation.y = -angle;
      flare.add(fin, canard);
    }
    missile.add(trail, flare);
    // Parachuting pilot / loadmaster bailout visual drifting into the playable rescue yard.
    const parachute = new Group();
    parachute.name = 'rail-campaign-parachute';
    const chuteCanopy = new Group();
    const canopyOrange = new MeshStandardMaterial({ color: 0xe45a28, roughness: .78, side: DoubleSide });
    const canopyWhite = new MeshStandardMaterial({ color: 0xe6e4dc, roughness: .82, side: DoubleSide });
    const chuteLineMat = new MeshBasicMaterial({ color: 0x2a2f2e });
    const pilotSuitMat = new MeshStandardMaterial({ color: 0x3f4a44, roughness: .88 });
    const pilotVestMat = new MeshStandardMaterial({ color: 0xd45b28, roughness: .75 });
    for (let i = 0; i < 8; i++) {
      const gore = new Mesh(
        new THREE.SphereGeometry(1.55, 4, 8, i * Math.PI / 4, Math.PI / 4, 0, Math.PI * .46),
        i % 2 === 0 ? canopyOrange : canopyWhite,
      );
      gore.scale.set(1, .68, 1);
      chuteCanopy.add(gore);
      const ang = (i + .5) * Math.PI / 4;
      const shroud = new Mesh(new CylinderGeometry(.008, .008, 2.35, 4), chuteLineMat);
      shroud.position.set(Math.cos(ang) * .68, -.95, Math.sin(ang) * .68);
      shroud.rotation.set(Math.sin(ang) * .54, 0, -Math.cos(ang) * .54);
      chuteCanopy.add(shroud);
    }
    chuteCanopy.position.y = 2.4;
    let pilotBody;
    if (window.createSaltlineHuman) {
      const h = window.createSaltlineHuman(THREE, { name: 'rail-bailout-pilot', role: 'pilot', variation: 0 });
      h.pose('parachute', 0, 0, false);
      pilotBody = h.actor;
      pilotBody.position.y = -.95;
    } else {
      pilotBody = new Group();
      const pilotTorso = new Mesh(new CylinderGeometry(.16, .14, .56, 10), pilotVestMat);
      pilotTorso.position.y = .32;
      const pilotHead = new Mesh(new THREE.SphereGeometry(.11, 10, 8), chuteLineMat);
      pilotHead.position.y = .72;
      for (const sx of [-.09, .09]) {
        const leg = new Mesh(new CylinderGeometry(.065, .055, .68, 8), pilotSuitMat);
        leg.position.set(sx, -.26, 0);
        pilotBody.add(leg);
      }
      pilotBody.add(pilotTorso, pilotHead);
    }
    parachute.add(chuteCanopy, pilotBody);
    const bailoutOrigin = new Vector3();
    const bailoutLanding = point(-87.3, .2, 9.85);
    const explosionFlash = new THREE.PointLight(0xff9b3d, 0, 58, 1.4);
    explosionFlash.name = 'rail-explosion-flash';
    let flashEnergy = 0;
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
    const finishesByPart = new Map();

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
      const next = createAirframe(THREE, state, finishesByPart);
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
      scene.remove(parachute);
      scene.remove(explosionFlash);
      scene.remove(transport);
      flashEnergy = 0;
      explosionFlash.intensity = 0;
      releaseAircraft();
      for (const { map, bumpMap } of finishesByPart.values()) {
        map.dispose();
        bumpMap.dispose();
      }
      finishesByPart.clear();
      elapsed = 0;
      nextTrail = 0;
      nextMissileSmoke = 0;
      direction.set(1, 0, 0);
    }

    function launch({ silent = false } = {}) {
      if (aircraft) return false;
      flightPose(hitPose, DAMAGE_SECONDS);
      missileHit.copy(hitPose.localToWorld(point(2.83, .20, -.89)));
      missileStart.copy(missileHit).add(point(13, 3, 14));
      showAircraft('intact');
      scene.add(transport);
      fly(0);
      if (!silent) events?.emit?.('campaign:aircraft-approach', { pos: transport.position.clone() });
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

    function triggerFlash(pos, strength) {
      if (!explosionFlash.parent) scene.add(explosionFlash);
      explosionFlash.position.copy(pos);
      explosionFlash.position.y += 1.6;
      flashEnergy = Math.max(flashEnergy, strength);
      explosionFlash.intensity = flashEnergy;
    }

    function updateParachute(time) {
      const bailStart = DAMAGE_SECONDS + .45;
      const bailDuration = IMPACT_SECONDS + 2.2 - bailStart;
      if (time < bailStart || time > bailStart + bailDuration) {
        if (parachute.parent) scene.remove(parachute);
        return;
      }
      if (!parachute.parent) {
        bailoutOrigin.copy(missileHit).add(point(2, 3.2, 2));
        scene.add(parachute);
      }
      const p = clamp((time - bailStart) / bailDuration);
      const deploy = smooth(p / .16);
      chuteCanopy.scale.set(Math.max(.08, deploy), Math.max(.2, deploy), Math.max(.08, deploy));
      parachute.position.lerpVectors(bailoutOrigin, bailoutLanding, p);
      parachute.position.y += Math.sin(p * Math.PI) * 4.5;
      parachute.rotation.z = Math.sin(time * 2.6) * .16 * (1 - p);
      parachute.rotation.x = Math.cos(time * 2.1) * .09 * (1 - p);
    }

    function airburst() {
      scene.remove(missile);
      triggerFlash(missileHit, 95);
      events?.emit?.('campaign:missile-hit', { pos: missileHit.clone() });
      if (fx?.explosion && !fx.stub) fx.explosion(missileHit, 1.8);
      else events?.emit?.('explosion', { pos: missileHit.clone(), size: 1.8 });
      fx?.sparks?.(missileHit, point(-1, -.2, -.15), 26);
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
      triggerFlash(epicenter, 180);
      events?.emit?.('campaign:aircraft-impact', { pos: epicenter.clone() });
      if (fx?.explosion && !fx.stub) fx.explosion(epicenter, 4.4);
      else events?.emit?.('explosion', { pos: epicenter, size: 4.4 });
      fx?.sparks?.(epicenter, point(0, 1.1, 0), 34);
      for (const side of [-1, 1]) {
        const origin = point(impact.x - .75, .26, impact.z + side * 2.7);
        fx?.dust?.(origin, point(-.28, .50, side), 3.4, .56, .50, .42);
        fx?.debris?.(origin, { mat: 'steel_rust', speed: 13, count: 22, size: .15 });
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
      scene.remove(parachute);
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
      if (flashEnergy > .1) {
        flashEnergy *= Math.exp(-dt * 4.2);
        explosionFlash.intensity = flashEnergy;
      } else if (explosionFlash.parent) {
        explosionFlash.intensity = 0;
        scene.remove(explosionFlash);
      }
      updateParachute(elapsed);
      if (previous < MISSILE_SECONDS && elapsed >= MISSILE_SECONDS) {
        events?.emit?.('campaign:missile-launch', { pos: missileStart.clone() });
      }
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
      if (wreckAge >= WRECK_SECONDS && !retainWreck) reset();
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
