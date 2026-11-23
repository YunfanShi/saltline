/* Inland annexes use the same construction kit as the original levels. */
(() => {
  window.createPortExpansion = (builder, vector, { rail }) => {
    const { box, col, cyl, decal, ibeam, label, place, slab, stack } = builder;
    const turn = Math.PI / 2;
    let seed = rail ? 1100 : 1000;
    const prop = (name, x, z, yaw = 0, options = {}, y = 0, placement = {}) =>
      place(name, x, z, yaw, { seed: seed++, ...options }, y, placement);

    function solid(material, x0, y0, z0, x1, y1, z1, surface = 'metal', options = {}) {
      slab(material, x0, y0, z0, x1, y1, z1, { bevel: .02 });
      col(x0, y0, z0, x1, y1, z1, surface, options);
    }

    function fence(x0, z0, x1, z1) {
      const length = Math.hypot(x1 - x0, z1 - z0);
      const count = Math.max(1, Math.round(length / 3));
      const yaw = x0 === x1 ? turn : 0;
      for (let index = 0; index < count; index++) {
        const fraction = (index + .5) / count;
        const end = index === count - 1;
        const panel = prop('fence_panel', x0 + (x1 - x0) * fraction, z0 + (z1 - z0) * fraction,
          yaw, { posts: end ? 'both' : yaw ? 'right' : 'left' }, 0, { noCol: true });
        panel.scale.x = length / (3 * count);
      }
      col(x0 - .05, 0, z0 - .05, x1 + .05, 2.4, z1 + .05, 'metal');
      col(x0 - .2, 0, z0 - .2, x1 + .2, 7, z1 + .2, 'metal', { playerOnly: true });
    }

    function canopy(x, z, width, depth, title) {
      const x0 = x - width / 2;
      const x1 = x + width / 2;
      const z0 = z - depth / 2;
      const z1 = z + depth / 2;
      const roof = 4.35;
      for (const postX of [x0, x1]) {
        for (const postZ of [z0, z1]) {
          solid('concrete', postX - .23, 0, postZ - .23, postX + .23, .55, postZ + .23, 'concrete');
          ibeam('steel_galv', 'y', roof - .45, postX, (roof + .45) / 2, postZ,
            { depth: .19, width: .19 });
          col(postX - .11, .55, postZ - .11, postX + .11, roof, postZ + .11, 'metal');
          box('hazard_stripes', .25, .34, .25, postX, .72, postZ);
        }
      }
      for (const beamZ of [z0, z, z1]) {
        ibeam('steel_galv', 'x', width + .4, x, roof - .13, beamZ, { depth: .26, width: .16 });
      }
      solid('corrugated_roof', x0 - .46, roof, z0 - .46, x1 + .46, roof + .09, z1 + .46,
        'metal', { noNav: true });
      box('steel_dark', width + .92, .36, .09, x, roof - .03, z1 + .46);
      label(title, .22, x, roof - .018, z1 + .506, 'z+', { color: 'white', font: 'stencil', distress: .16 });
      box('steel_dark', .78, .1, .21, x, roof - .31, z);
      box(builder.G.mats.emissive(0xffe7bd, 2), .66, .024, .15, x, roof - .372, z);
      slab('concrete', x0 - .25, -.12, z0 - .25, x1 + .25, .022, z1 + .25);
      return { min: vector(x0, 0, z0), max: vector(x1, roof, z1) };
    }

    function bufferStop(x, z) {
      for (const side of [-1, 1]) {
        const railZ = z + side * .75;
        builder.rod('steel_rust', [x - .8, .15, railZ], [x, .95, railZ], .08);
        builder.rod('steel_rust', [x + .6, .15, railZ], [x, .95, railZ], .08);
      }
      solid('steel_dark', x - .14, .83, z - 1, x + .14, 1.09, z + 1);
      box('paint_red', .015, .19, 1.9, x - .149, .96, z);
    }

    function siding(z, end) {
      const start = -106.3;
      const center = (start + end) / 2;
      const length = end - start - .5;
      slab('concrete_dirty', start, -.06, z - 1.45, end, .012, z + 1.45);
      for (let x = start + .45; x < end - .35; x += .7) {
        box('wood_dark', .22, .085, 2.48, x, .047, z);
      }
      for (const side of [-1, 1]) {
        const railZ = z + side * .75;
        ibeam('steel_rust', 'x', length, center, .1, railZ, { depth: .13, width: .13, tf: .022, tw: .047 });
        box('steel_dark', length, .022, .075, center, .174, railZ);
      }
      bufferStop(end - 1.15, z);
    }

    function inspectionCar(x, z) {
      solid('steel_dark', x - 6.55, .62, z - 1.25, x + 6.55, 1.02, z + 1.25);
      prop('container40', x, z, 0, { color: 'white', wear: .81 }, 1.02);
      for (const axle of [-5.18, -4.02, 4.02, 5.18]) {
        cyl('steel_dark', .073, 1.66, x + axle, .51, z, { axis: 'z' });
        for (const side of [-1, 1]) {
          const wheel = z + side * .75;
          cyl('steel_dark', .34, .15, x + axle, .51, wheel, { axis: 'z', seg: 16 });
          cyl('steel_galv', .11, .17, x + axle, .51, wheel, { axis: 'z' });
        }
      }
      for (const side of [-1, 1]) {
        box('steel_rust', 12.9, .23, .1, x, .79, z + side * 1.29);
        for (const end of [-1, 1]) box('paint_yellow', .6, .085, .018, x + end * 5.85, .84, z + side * 1.35);
      }
    }

    function roadLane(z, west = -103.5) {
      for (const edge of [z - 2.25, z + 2.25]) {
        for (let x = west; x <= -39.5; x += 3.45) box('paint_white', 1.7, .008, .105, x, .026, edge);
      }
      for (const x of [-46, -70, -97]) {
        if (x >= west) decal('arrow', 2.1, x, .032, z, 'y+', 0);
      }
    }

    function terminalFurniture(x, z) {
      prop('toolbox_cart', x + 1.6, z - 1.2, .06);
      prop('crate_wood', x - 1.6, z - 1.65, -.08);
      prop('floodlight_stand', x + 2.2, z - 1.6, Math.PI);
    }

    function shiftOffice() {
      const west = -105;
      const east = -99;
      const front = 20.2;
      const back = 26.1;
      const ceiling = 3.02;
      const wall = 'corrugated_roof';
      const frame = 'steel_galv';
      slab('concrete_dirty', west, -.08, front, east, .02, back);
      solid(wall, west, 0, front, west + .14, ceiling, back);
      solid(wall, east - .14, 0, front, east, ceiling, back);
      solid(wall, west, 0, back - .14, east, ceiling, back);
      solid(wall, west, 0, front, -104.55, ceiling, front + .14);
      solid(wall, -102.55, 0, front, east, 1.03, front + .14);
      solid(wall, -104.55, 2.31, front, east, ceiling, front + .14);
      solid('glass_dirty', -102.42, 1.03, front + .05, east - .14, 2.31, front + .10, 'glass');
      for (const x of [-104.55, -102.52, -101.28, -100.12, east - .14]) {
        solid(frame, x - .035, x === -104.55 || x === -102.52 ? 0 : 1.01, front - .02,
          x + .035, 2.34, front + .16);
      }
      box(frame, 3.58, .1, .2, -100.77, 1.05, front + .04);
      box(frame, 5.56, .1, .2, -101.77, 2.31, front + .04);
      solid('corrugated_roof', west - .22, ceiling, front - .35, east + .22, ceiling + .1, back + .22,
        'metal', { noNav: true });
      box('steel_dark', 1.91, .26, .04, -103.5, 2.69, front - .025);
      label('SHIFT OFFICE', .17, -103.5, 2.69, front - .047, 'z-', { color: 'white', font: 'stencil' });

      // The last shift left its dispatch log next to a closed reserve locker.
      solid('steel_dark', -102.6, 0, 25.22, -100.13, .99, 25.9);
      box('wood_dark', 2.53, .09, .72, -101.37, 1.005, 25.55);
      for (const y of [.23, .48, .74]) {
        box(frame, 2.35, .012, .025, -101.36, y, 25.21);
        box(frame, .28, .047, .06, -100.41, y + .09, 25.19);
      }
      box('paint_white', .43, .04, .32, -101.27, 1.065, 25.31, { r: [0, -.14, 0] });
      box('steel_dark', .42, .09, .29, -100.95, 1.085, 25.66);
      box('rubber', .4, .07, .09, -100.95, 1.16, 25.59);
      prop('crate_wood', -103.69, 25.18, turn);
      box(frame, 1.28, .09, .27, -102, 2.87, 23.7);
      box(builder.G.mats.emissive(0xffe0ad, 2.3), 1.18, .025, .20, -102, 2.81, 23.7);
      return {
        interior: { min: vector(west, 0, front), max: vector(east, ceiling, back) },
        exploration: {
          id: 'night-shift-record',
          pos: vector(-101.25, 0, 24.4),
          ammo: 60,
          soundPos: vector(-100.95, 1.05, 24.8),
        },
      };
    }

    // Meet the existing perimeter at its actual corner on each chapter.
    const seamX = rail ? -37.6 : -38;
    const north = rail ? -27.5 : -30;
    const south = rail ? 27.5 : 28;
    fence(-106.7, north, seamX, north);
    fence(-106.7, south, seamX, south);
    fence(-106.7, north, -106.7, south);
    roadLane(5, rail ? -62 : undefined);
    if (!rail) roadLane(-16, -54.4);
    roadLane(19.5, -43.7);
    for (const [x, z] of [[-102, 2], [-88, rail ? 12.3 : 8.5], [-67, 1.6], [-47, 9.1]]) prop('light_mast', x, z);
    for (const [x, z] of [[-101, 7.8], [-85, 7.8], [-64, 2.15], [-48, 1.85]]) prop('jersey_barrier', x, z);
    for (const [x, z] of [[-40.5, 2.25], [-40.5, 7.75], [-45.5, 2.25], [-45.5, 7.75]]) prop('bollard_post', x, z);

    const base = (archive, beacon, supplies, shelters, groundEnemies, airEnemies, cover) => ({
      campaignPoints: beacon
        ? { archive: vector(...archive), beacon: vector(...beacon) }
        : { archive: vector(...archive) },
      supplies: supplies.map(([kind, x, z]) => ({ kind, pos: vector(x, 0, z) })),
      interiorBoxes: shelters,
      enemySpawns: [
        ...groundEnemies.map(([zone, x, z]) => ({ zone, pos: vector(x, 0, z), type: 'ground' })),
        ...airEnemies.map(([zone, x, z]) => ({ zone, pos: vector(x, 10, z), type: 'air' })),
      ],
      coverPoints: cover.map(([x, z]) => vector(x, 0, z)),
    });

    if (rail) {
      const apron = { x: -77, north: -7.35, south: 7.55 };
      const service = { north: 8.15, south: 12.6, center: 10.3 };
      fence(apron.x, north, apron.x, apron.north);
      fence(apron.x, apron.south, apron.x, service.north);
      fence(apron.x, service.south, apron.x, south);

      // Runway edges and the independently routed service road through the customs boundary.
      slab('asphalt', -101, -.045, apron.north + .25, -66, .014, apron.south - .25);
      for (let x = -100; x < -66; x += 4) {
        box('paint_white', 2.2, .008, .13, x, .024, .6);
      }
      for (const x of [-89, -84, -81, -72, -68]) {
        for (const z of [apron.north + .48, apron.south - .48]) {
          box('paint_yellow', 1.85, .01, .12, x, .025, z);
        }
      }
      for (let x = -89; x < -62; x += 2.75) {
        for (const z of [service.north + .4, service.south - .4]) {
          box('paint_white', 1.65, .008, .105, x, .025, z);
        }
      }
      for (const [z, title] of [[apron.north, 'AIR PICKUP'], [service.south, 'SERVICE ROAD']]) {
        for (const x of [apron.x - .05, apron.x + .05]) {
          label(title, .21, x, 1.7, z + (z === apron.north ? -1.7 : 1.7),
            x < apron.x ? 'x-' : 'x+', { color: 'white', font: 'stencil', distress: .14 });
        }
        box('steel_dark', .09, .41, 2.5, apron.x, 1.7, z + (z === apron.north ? -1.7 : 1.7));
      }
      siding(-24.25, -78.6);
      inspectionCar(-87, -24.25);
      const manifest = canopy(-94, 15.5, 12, 7.5, 'RAIL CUSTOMS / MANIFESTS');
      const power = canopy(-57, -16, 8, 6, 'GATE POWER');
      const records = shiftOffice();
      terminalFurniture(-94, 14);
      terminalFurniture(-57, -16);
      prop('generator', -54.4, -17.45, .06);
      prop('guard_booth', -101.8, 12.4, turn, { color: 'grey' });
      prop('sign_post', -48.4, 10.1, Math.PI, { sign: 'hazard_general', text: 'CUSTOMS EXAMINATION' });
      prop('sign_post', -63.3, -13.4, 0, { sign: 'hazard_voltage', text: 'GATE CONTROL' });
      prop('forklift', -87, 18.5, -.2, { forksUp: .16 });
      prop('forklift', -74.3, -13.5, Math.PI, { forksUp: .1 });
      prop('pipe_stack', -72, 20.3, -.01);
      prop('tarp_cargo', -65.3, 16.1, .2);
      prop('tarp_cargo', -82, -17, .08);
      prop('crate_stack', -99, -11);
      prop('pallet_stack', -85.75, 14.35);
      prop('pallet_stack', -76.3, -11.8);
      prop('barrel', -70.9, 19.2, .2, { color: 'blue' });
      for (const [x, z, color] of [
        [-95, -8, 'white'], [-83, -8.1, 'grey'], [-68.5, -6.5, 'green'],
        [-70.1, 14, 'blue'], [-55.3, 11.1, 'orange'], [-47.5, 16.75, 'grey'],
      ]) stack(x, z, [[20, color]], 0, .1);
      for (const x of [-101, -97, -93, -89, -85]) box('paint_yellow', .1, .012, 3.8, x, .029, -17.3);
      for (const [x, z] of [[-101.5, 16.05], [-89, 20.1], [-80.3, -11.5], [-51.4, -12.85]]) {
        prop('jersey_barrier', x, z);
      }
      const layout = base([-94, 0, 14], [-57, 0, -16], [
        ['ammo', -91, 16.9], ['health', -59, -15.15],
      ], [manifest, power, records.interior], [
        ['yard', -91, -17], ['yard', -80, -12.4], ['yard', -61, -14.1], ['yard', -50, -9.3],
        ['shed', -97.6, 17.9], ['shed', -83.55, 19.5], ['shed', -67, 18.9], ['shed', -49, 12.1],
      ], [['yard', -77, -16], ['shed', -92, 19], ['shed', -53, 18]], [
        [-100.3, 16.9], [-95.5, 18], [-90.1, 19.2], [-86.3, 17.55], [-83.35, -10],
        [-80.4, -12.3], [-69.8, -7.9], [-65.1, 15.45], [-58.9, -17.35],
        [-52.8, -15.4], [-51, -12.1], [-46.25, 16.25],
      ]);
      const bounds = (x0, y0, z0, x1, y1, z1) => ({ min: vector(x0, y0, z0), max: vector(x1, y1, z1) });
      return {
        ...layout,
        exploration: records.exploration,
        pickup: {
          impact: vector(apron.x, .94, .6),
          approach: { west: vector(-85, 0, .6), east: vector(-69, 0, .6) },
          diversion: { west: vector(-85, 0, service.center), east: vector(-69, 0, service.center) },
          closure: { ...bounds(-77.8, 0, apron.north, -76.2, 2.5, apron.south), playerOnly: true },
          debris: [
            bounds(-79.8, 0, -.72, -73.04, 2.05, 1.91),
            bounds(-83.56, .06, -1.74, -80.35, 3.17, 2.27),
            bounds(-80.94, .06, -6.73, -76.63, 2.48, -.73),
            bounds(-77.83, .06, 1.15, -74.43, 2.64, 7.1),
          ],
        },
      };
    }

    const dispatch = canopy(-88.5, -11.7, 11.3, 7.6, 'BERTH DISPATCH / CARGO RELEASE');
    const supply = canopy(-64.5, 16.1, 10.1, 7.2, 'YARD EQUIPMENT');
    terminalFurniture(-87, -11);
    prop('guard_booth', -95.36, -7.25, turn, { color: 'teal' });
    prop('sign_post', -45.5, .55, 0, { sign: 'berth4', text: 'BERTH DISPATCH' });
    prop('sign_post', -94.45, -3.55, 0, { sign: 'hazard_general', text: 'CARGO RELEASE' });
    prop('forklift', -68.1, 15.95, -.12, { forksUp: .16 });
    prop('forklift', -97.5, 14.2, Math.PI, { forksUp: .22 });
    prop('dumpster', -82.4, -9, .09);
    prop('pallet_stack', -63, 18.05);
    prop('ibc_tote', -66.6, 17.7);
    prop('crate_stack', -89.35, 15.25);
    prop('tarp_cargo', -57.4, 13.5, -.06);
    for (const [x, z, layers] of [
      [-96, -22.3, [[40, 'blue'], [20, 'grey']]],
      [-79.8, -20.2, [[40, 'orange'], [40, 'teal']]],
      [-64, -22.3, [[40, 'green'], [20, 'orange']]],
      [-49.6, -22.3, [[40, 'grey']]],
      [-95.8, 22.5, [[40, 'teal'], [20, 'white']]],
      [-80, 22.5, [[40, 'red']]],
      [-50.5, 22.5, [[40, 'blue'], [20, 'yellow']]],
      [-73, -7.4, [[20, 'red']]],
      [-56.4, -7.2, [[20, 'white']]],
      [-77.8, 11.55, [[20, 'blue']]],
    ]) stack(x, z, layers, 0, .2);
    for (const [x, z] of [[-101.5, 12.5], [-88, 11.3], [-80, -13.5], [-67.3, -9.8], [-51.2, -8.9]]) {
      prop('jersey_barrier', x, z);
    }
    return base([-87, 0, -11], null, [['ammo', -62.2, 15.2], ['health', -90.85, -10.1]],
      [dispatch, supply], [
        ['yard', -96, -17.7], ['yard', -81, -12.4], ['yard', -70, -11.7], ['yard', -54, -13.2],
        ['shed', -101.2, 16.6], ['shed', -85.3, 16.4], ['shed', -63, 20.3], ['shed', -54, 16.8],
      ], [['yard', -90, -13], ['shed', -75, 17], ['yard', -56, -15]], [
        [-100.7, 13.4], [-96.2, 14.85], [-91.1, -13.65], [-88, 12.2], [-84.35, -10.6],
        [-80.6, -12.6], [-77.35, 13.5], [-71.2, -9.05], [-66.7, -10.75], [-63.65, 17.1],
        [-57.1, 14.35], [-52.1, -9.7],
      ]);
  };
})();
