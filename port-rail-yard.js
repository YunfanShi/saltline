/* Inland inspection district assembled with Saltline's level builder and prop catalog. */
(() => {
  window.createRailYardLayout = (builder, vector) => {
    const { box, col, cyl, decal, ibeam, label, place, slab } = builder;
    const halfTurn = Math.PI / 2;
    let seed = 100;
    const prop = (name, x, z, yaw = 0, options = {}, y = 0, placement = {}) =>
      place(name, x, z, yaw, { seed: seed++, ...options }, y, placement);

    function solid(material, x0, y0, z0, x1, y1, z1, surface = 'metal', options = {}) {
      slab(material, x0, y0, z0, x1, y1, z1, { bevel: .015 });
      col(x0, y0, z0, x1, y1, z1, surface, options);
    }

    function fence(x0, z0, x1, z1) {
      const length = Math.hypot(x1 - x0, z1 - z0);
      const count = Math.round(length / 3);
      const yaw = x0 === x1 ? halfTurn : 0;
      for (let index = 0; index < count; index++) {
        const fraction = (index + .5) / count;
        const panel = prop('fence_panel', x0 + (x1 - x0) * fraction, z0 + (z1 - z0) * fraction,
          yaw, { posts: index === count - 1 ? 'both' : yaw ? 'right' : 'left' }, 0, { noCol: true });
        panel.scale.x = length / (3 * count);
      }
      col(x0 - .06, 0, z0 - .06, x1 + .06, 2.4, z1 + .06, 'metal');
      col(x0 - .2, 0, z0 - .2, x1 + .2, 7, z1 + .2, 'metal', { playerOnly: true });
    }

    function track(z) {
      // The yard crossing has timber infill instead of exposed ties.
      slab('concrete', -37.7, -.1, z - 1.55, 28, .012, z + 1.55);
      for (let x = -37.3; x < 28; x += .68) {
        if ((x > -29 && x < -23) || (x > 8 && x < 14)) continue;
        box('wood_dark', .23, .09, 2.52, x, .046, z);
        for (const side of [-1, 1]) {
          box('steel_rust', .2, .02, .23, x, .1, z + side * .75);
        }
      }
      for (const side of [-1, 1]) {
        ibeam('steel_rust', 'x', 65.6, -4.8, .105, z + side * .75,
          { depth: .13, width: .13, tf: .024, tw: .047 });
        box('steel_dark', 65.6, .025, .075, -4.8, .18, z + side * .75);
      }
      for (const [x0, x1] of [[-29, -23], [8, 14]]) {
        for (const [z0, z1] of [[-1.52, -.85], [-.65, .65], [.85, 1.52]]) {
          slab('wood_pallet', x0, .008, z + z0, x1, .145, z + z1);
        }
        col(x0, 0, z - 1.52, x1, .145, z + 1.52, 'wood', { noNav: true });
      }
    }

    function flatcar(x, z, color, cargo) {
      const deck = 1.03;
      solid('steel_dark', x - 6.65, .6, z - 1.25, x + 6.65, deck, z + 1.25);
      for (const side of [-1, 1]) {
        box('steel_rust', 12.9, .25, .11, x, .77, z + side * 1.26);
        box('paint_yellow', .65, .09, .025, x - 5.9, .84, z + side * 1.321);
        box('paint_yellow', .65, .09, .025, x + 5.9, .84, z + side * 1.321);
      }
      for (const truck of [-4.65, 4.65]) {
        const truckX = x + truck;
        box('steel_dark', 1.95, .22, 1.74, truckX, .59, z);
        for (const wheelX of [truckX - .63, truckX + .63]) {
          cyl('steel_dark', .08, 1.65, wheelX, .48, z, { axis: 'z' });
          for (const side of [-1, 1]) {
            const wheelZ = z + side * .75;
            cyl('steel_dark', .34, .14, wheelX, .48, wheelZ, { axis: 'z', seg: 16 });
            cyl('steel_galv', .105, .13, wheelX, .48, wheelZ + side * .07, { axis: 'z' });
          }
        }
      }
      for (const end of [-1, 1]) box('steel_dark', .64, .24, .27, x + end * 6.78, .74, z);
      prop(cargo, x, z, 0, { color, wear: .78 }, deck);
    }

    function canopy(x0, x1, z0, z1, title) {
      const roof = 4.9;
      const x = (x0 + x1) / 2;
      const z = (z0 + z1) / 2;
      for (const postX of [x0, x1]) {
        for (const postZ of [z0, z1]) {
          solid('concrete', postX - .28, 0, postZ - .28, postX + .28, .68, postZ + .28, 'concrete');
          ibeam('steel_galv', 'y', roof - .65, postX, (roof + .65) / 2, postZ,
            { depth: .23, width: .2, tf: .023 });
          col(postX - .13, .68, postZ - .13, postX + .13, roof, postZ + .13, 'metal');
          box('hazard_stripes', .3, .42, .3, postX, .9, postZ);
        }
        ibeam('steel_galv', 'z', z1 - z0 + .6, postX, roof - .22, z);
      }
      for (const beamZ of [z0, z, z1]) {
        ibeam('steel_galv', 'x', x1 - x0 + .8, x, roof - .19, beamZ);
      }
      box('corrugated_roof', x1 - x0 + 1.1, .11, z1 - z0 + 1.15, x, roof, z);
      box('steel_dark', x1 - x0 + 1.1, .36, .095, x, roof - .1, z0 - .55);
      const sign = label(title, .24, x, roof - .085, z0 - .602,
        { color: 'white', font: 'stencil', distress: .18 });
      if (sign) sign.rotation.y = Math.PI;
      col(x0 - .55, roof - .07, z0 - .58, x1 + .55, roof + .07, z1 + .58, 'metal', { noNav: true });
      for (const lightX of [x0 + 1.35, x1 - 1.35]) {
        box('steel_dark', .8, .12, .22, lightX, roof - .36, z);
        box(builder.G.mats.emissive(0xffe7bd, 2.1), .68, .025, .14, lightX, roof - .437, z);
      }
    }

    function scaleLane(x0, x1, z) {
      slab('concrete', x0 - .85, -.03, z - 1.82, x1 + .85, .027, z + 1.82);
      slab('steel_dark', x0, .025, z - 1.56, x1, .039, z + 1.56);
      slab('diamond_plate', x0 + .08, .038, z - 1.46, x1 - .08, .06, z + 1.46);
      for (const side of [-1, 1]) {
        box('paint_yellow', x1 - x0, .014, .09, (x0 + x1) / 2, .067, z + side * 1.41);
        for (const x of [x0 - .9, x1 + .9]) prop('bollard_post', x, z + side * 1.72);
      }
    }

    function trailer(x, z) {
      solid('steel_dark', x - 6.18, .76, z - 1.28, x + 6.18, 1.22, z + 1.28);
      prop('container40', x, z, 0, { color: 'white', wear: .72 }, 1.22);
      for (const wheelX of [x + 3.75, x + 4.9]) {
        cyl('steel_dark', .075, 2.41, wheelX, .47, z, { axis: 'z' });
        for (const side of [-1, 1]) {
          const wheelZ = z + side * 1.02;
          cyl('rubber', .47, .34, wheelX, .47, wheelZ, { axis: 'z', seg: 18 });
          cyl('steel_galv', .245, .14, wheelX, .47, wheelZ + side * .15, { axis: 'z', seg: 12 });
        }
      }
      for (const side of [-1, 1]) {
        box('steel_galv', .12, .79, .13, x - 3.9, .4, z + side * .95);
        box('steel_dark', .24, .045, .23, x - 3.9, .027, z + side * .95);
      }
      box('paint_red', .09, .1, 1.9, x + 6.19, .69, z);
    }

    // The central truck road links two crossing roads around separate north and south work areas.
    fence(-37.6, -27.5, 28.5, -27.5);
    fence(-37.6, 27.5, 23.15, 27.5);
    fence(26.85, 27.5, 28.5, 27.5);
    fence(-37.6, -27.5, -37.6, 27.5);
    fence(28.5, -27.5, 28.5, 27.5);
    fence(23.15, 27.5, 26.85, 27.5);
    for (const x of [23.15, 26.85]) {
      solid('steel_dark', x - .12, 0, 27.38, x + .12, 3.04, 27.62);
    }
    box('steel_dark', 3.72, .39, .15, 25, 2.83, 27.5);
    const exitSign = label('SERVICE GATE', .24, 25, 2.83, 27.419,
      { color: 'white', font: 'stencil', distress: .16 });
    if (exitSign) exitSign.rotation.y = Math.PI;
    box(builder.G.mats.emissive(0xffe7bd, 2.1), .34, .12, .09, 25, 2.49, 27.377);

    for (const z of [-22, -17.4]) track(z);
    flatcar(-15.6, -22, 'blue', 'container40');
    flatcar(-1.75, -22, 'red', 'container40');
    flatcar(20.8, -22, 'grey', 'container20');

    // Rail inspection platform and waiting cargo.
    solid('concrete', -19.5, 0, -14.65, 6.8, .28, -12.05, 'concrete', { noNav: true });
    box('paint_yellow', 26.15, .019, .1, -6.35, .293, -14.5);
    for (const x of [-17.7, -8, 4.8]) prop('bollard_post', x, -13.05, 0, {}, .28);
    prop('container20', -16.8, -8.8, .03, { color: 'green', wear: .79 });
    prop('container20', -2.5, -8.65, -.02, { color: 'grey', wear: .68 });
    prop('forklift', -5.7, -11.15, Math.PI, { forksUp: .15 });
    prop('pallet_stack', -8.9, -9.1);
    prop('crate_wood', -11, -11.15);
    prop('tarp_cargo', 3.9, -9.5, -.1);
    prop('light_mast', 7.3, -13.8);

    // Truck arrival, weighbridge, and adjacent inspection bay.
    prop('guard_booth', -34.4, -.67, halfTurn, { color: 'grey' });
    prop('gate_arm', -30.1, 2.65, halfTurn, { open: .94 });
    prop('sign_post', -34.1, 6.45, halfTurn, { sign: 'hazard_general', text: 'RAIL FREIGHT INSPECTION' });
    for (const x of [-34.7, -30.7]) prop('jersey_barrier', x, 7.15);
    for (const z of [-2.4, 6.5]) {
      for (let x = -34; x <= 24; x += 3.35) box('paint_white', 1.65, .008, .105, x, .018, z);
    }
    decal('arrow', 2.6, -23.9, .023, 2.4, 'y+', 0);
    decal('arrow', 2.6, 1.5, .023, 2.4, 'y+', 0);
    for (const x of [-28, 11]) {
      for (let z = -15.25; z < -3.5; z += 2) box('paint_white', .11, .008, .95, x, .022, z);
    }
    canopy(13.5, 26.3, -5.2, 1.8, 'ROAD WEIGHBRIDGE');
    scaleLane(14.1, 25.7, -1.9);
    trailer(16.7, 9.2);
    prop('guard_booth', 24.4, 5.55, Math.PI, { color: 'white' });
    prop('sign_post', 25.8, 2.75, Math.PI, { sign: 'no_entry', text: 'HOLD FOR RELEASE' });
    for (const [x, z] of [[11.4, 7], [12.4, 7.7], [22.8, 7.65], [25.7, 7.5], [24.2, -.2]]) {
      prop('traffic_cone', x, z);
    }

    // Covered strip bay leads to a pedestrian lane along the southern boundary.
    canopy(-19.1, -.25, 14.1, 22.4, 'FREIGHT EXAMINATION');
    for (const [x0, x1] of [[-18.9, -15.9], [-9.1, -4.3], [3.6, 8.9], [14.6, 21.8]]) {
      solid('concrete', x0, 0, 25.92, x1, 1.03, 26.48, 'concrete');
    }
    prop('container20', -12.35, 19.15, Math.PI, { color: 'blue', doors: .78, wear: .7 });
    prop('container20', 5.6, 22.1, .01, { color: 'orange', wear: .62 });
    prop('container20', 19.4, 21.4, -.02, { color: 'teal', wear: .76 });
    prop('crate_stack', -8.45, 19.5);
    prop('pallet_stack', -6.15, 21.15);
    prop('forklift', -5.4, 16.1, Math.PI, { forksUp: .18 });
    prop('toolbox_cart', -10.2, 16.9, -.09);
    prop('tarp_cargo', 3.1, 16.6, .03);
    prop('light_mast', -22.65, 23.85);
    prop('light_mast', 25.7, 14.7);
    prop('dumpster', 16.2, 24.6, .05);
    prop('jersey_barrier', -17.5, 10.4, -.02);
    prop('jersey_barrier', -8, 7.7, .02);
    prop('jersey_barrier', 5.5, 7.5, -.06);
    prop('jersey_barrier', 8.1, -4.55, -.06);
    prop('sandbags', 19.2, 14.2, -.05);
    prop('pallet_stack', 22.8, 13.2);
    prop('crate_stack', -22.5, 16.7);
    prop('sign_post', 27.35, 24.85, Math.PI, { sign: 'no_entry', text: 'PERSONNEL EXIT' });

    const relay = (id, letter, name, zone, x, z, yaw) => ({
      id,
      label: 'Relay ' + letter + ' — ' + name,
      zone,
      pos: vector(x, 0, z),
      object: prop('relay_node', x, z, yaw, { id: letter }),
    });
    const objectives = [
      relay('relay_a', 'A', 'Rail Inspection', 'yard', -.25, -11.2, 0),
      relay('relay_b', 'B', 'Examination Bay', 'shed', -16.45, 17.1, Math.PI),
      relay('relay_c', 'C', 'Weighbridge', 'quay', 17.1, -3.95, Math.PI),
    ];

    const enemyPositions = [
      ['yard', -21, -8], ['yard', -12, -6], ['yard', 1.7, -11],
      ['yard', 5.8, -15.5], ['yard', 6.2, -24.1], ['yard', -20.5, -19.6],
      ['shed', -21.1, 15], ['shed', -10.3, 14], ['shed', -4.4, 23.4],
      ['shed', 1.7, 19.2], ['shed', 10.9, 23.3], ['shed', -25.8, 22],
      ['quay', 13.4, 11.2], ['quay', 21.8, 12], ['quay', 26.6, 8.5],
      ['quay', 25.2, -8.1], ['quay', 13.2, -10.2], ['quay', 24.4, 19.2],
    ];
    const coverPositions = [
      [-32.7, 6.35], [-29.3, 7.95], [-21.7, 16.2], [-16.65, 9.65], [-16.1, 18.3],
      [-14.6, -7.05], [-11.1, -10.1], [-8.25, -8.55], [-6.6, -10.65], [-7.55, 6.95],
      [-4.35, 16.5], [-4.2, 22], [-.3, -7.1], [3.4, -8.55], [3.15, 15.5], [5.7, 8.4],
      [6.7, -3.75], [8.75, 21.45], [15.25, 10.95], [18.7, 13.35], [21.9, 13.2],
      [23.5, 7.2], [24.35, 4.2], [25.2, -4.65],
    ];

    return {
      playerStart: { pos: vector(-35.3, 0, 3.35), yaw: -halfTurn },
      objectives,
      extraction: { pos: vector(25, 0, 24.65), radius: 2.4 },
      campaignPoints: { archive: vector(-6.8, 0, 18.6), beacon: vector(21.9, 0, 16.7) },
      enemySpawns: [
        ...enemyPositions.map(([zone, x, z]) => ({ pos: vector(x, 0, z), zone, type: 'ground' })),
        ...[
          ['yard', -16.5, 8.5, -14], ['yard', 2, 9.5, -17.5], ['yard', -24, 10, -7],
          ['shed', -16.2, 8.2, 18.5], ['shed', -5.5, 8.1, 21], ['shed', 7.3, 7, 20],
          ['quay', 16.7, 8, -4.8], ['quay', 20.3, 7.4, 12.8], ['quay', 23.2, 8.4, 20.2],
        ].map(([zone, x, y, z]) => ({ pos: vector(x, y, z), zone, type: 'air' })),
      ],
      coverPoints: coverPositions.map(([x, z]) => vector(x, 0, z)),
      cinematicPath: [
        { pos: [-35.3, 2.1, 3.35], look: [-22, 1.6, 2.3] },
        { pos: [-26.1, 2.6, -7.25], look: [-10.4, 2.35, -19.5] },
        { pos: [-14.6, 3.4, -14.1], look: [.3, 2.25, -18.8] },
        { pos: [4.45, 3.05, -10.9], look: [16, 2.4, -3.4] },
        { pos: [10.7, 2.35, 1.45], look: [18.8, 2.4, -.8] },
        { pos: [15.7, 2.6, 13.45], look: [5.7, 2.5, 21.4] },
        { pos: [24.25, 2.35, 19.5], look: [25, 2.4, 27.5] },
      ],
      zones: [
        { name: 'gate', min: [-38, -28], max: [-24, 28] },
        { name: 'yard', min: [-24, -28], max: [11.5, 8] },
        { name: 'shed', min: [-24, 8], max: [11.5, 28] },
        { name: 'quay', min: [11.5, -28], max: [29, 28] },
      ],
      interiorBoxes: [
        { min: vector(-19.1, 0, 14.1), max: vector(-.25, 4.94, 22.4) },
        { min: vector(13.5, 0, -5.2), max: vector(26.3, 4.94, 1.8) },
      ],
      skylights: [],
      shedLights: [],
      update() {},
    };
  };
})();
