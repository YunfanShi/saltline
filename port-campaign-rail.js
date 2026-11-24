/* Rail Customs rescue. The transport film hands back control before this scene begins. */
(() => {
  const objectives = {
    search: ['Trace the emergency locator near the runway', '追踪跑道旁的紧急定位信号'],
    locate: ['Find the survivor behind the south blast barrier', '在南侧防爆墙后找到幸存者'],
    choose: ['Choose the exposed cargo ramp or power the covered passage', '选择穿过开阔的货运坡道，或给有掩护的维修通道供电'],
    waiting: ['Return to the survivor so they can follow', '回到幸存者身边，带他们继续走'],
    blocked: ['The survivor is waiting for the passage to clear', '幸存者正在等待通道畅通'],
    ramp: ['Lead the survivor across the exposed cargo ramp', '带幸存者穿过开阔的货运坡道'],
    maintenance: ['Lead the survivor through the covered maintenance passage', '带幸存者穿过有掩护的维修通道'],
    handoff: ['Meet the survivor under the Ground Rescue canopy', '在地面救援棚下与幸存者会合'],
  };
  const prompts = {
    search: ['Read emergency locator', '读取紧急定位器'],
    locate: ['Help the survivor to their feet', '扶幸存者起身'],
    ramp: ['Signal to take the cargo ramp', '示意走货运坡道'],
    maintenance: ['Power the maintenance shutter', '给维修卷帘门供电'],
  };
  const dialogue = {
    search: ['Ground rescue is on the east side. A locator is chirping near the runway. Check it for survivors.',
      '地面救援队在东侧。跑道旁有定位器在响，过去看看有没有幸存者。'],
    locate: ['Control, this is the loadmaster. I made it out. I’m behind the south blast barrier.',
      '指挥部，我是装载员。我逃出来了，在南侧防爆墙后面。'],
    choose: ['I can walk if you stay close. The ramp is shortest. Get the maintenance shutter open and we can stay under cover.',
      '你别离我太远，我就能走。坡道最近。打开维修卷帘门，我们就能一路走在掩护下。'],
    ramp: ['I’ll follow you across the ramp. Keep moving when that searchlight sweeps past.',
      '我跟你过坡道。探照灯扫过去的时候，我们继续走。'],
    maintenance: ['The shutter’s coming up. Stay with me through the covered passage.',
      '卷帘门正在升起。我们一起从有掩护的通道过去。'],
    waiting: ['Hold up. Come back a little so I can catch up.', '等一下。回来一点，我才能跟上。'],
    blocked: ['I can’t get through yet. I’ll wait here until the way clears.', '现在还过不去。我在这儿等通道畅通。'],
    illuminated: ['The searchlight has us. Keep going to the rescue canopy.',
      '探照灯照到我们了。继续往救援棚走。'],
    complete: ['We have the loadmaster and the signed manifest. Ground rescue, clear the yard.',
      '装载员和签发货单都已接到。地面救援队，撤出货场。'],
  };
  const range = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const clamp = (value, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, value));
  const ease = value => {
    const t = clamp(value);
    return t * t * (3 - 2 * t);
  };

  function createSurvivor(parts) {
    const { group, block, oval, cylinder, surface } = parts;
    const actor = group('rail-loadmaster');
    // Realistic 1.80m human proportions (hip at 0.94m, shoulder at 1.47m, head center at 1.66m)
    const torso = group('loadmaster-body', actor, 0, .94);
    const flightSuit = surface(0x46514b, .10, .86);
    const pants = surface(0x3a4340, .08, .88);
    const bootMat = surface(0x1f2221, .16, .74);
    const harness = surface(0x282927, .14, .82);
    const vest = surface(0xc45828, .08, .76);
    const reflector = surface(0xe2d8b4, .25, .42);
    const skin = surface(0xb48367, .04, .78);
    const helmetMat = surface(0x2d3534, .28, .48);
    const visorMat = surface(0x141b20, .75, .18);
    const glove = surface(0x2e302c, .10, .85);
    const black = surface(0x15181b, .25, .62);

    // Pelvis, waist, contoured chest & tactical high-vis rescue vest
    cylinder(torso, pants, .155, .18, .115, 0, .04, 0);
    cylinder(torso, flightSuit, .145, .24, .11, 0, .22, 0);
    cylinder(torso, flightSuit, .178, .28, .122, 0, .40, 0);
    block(torso, vest, .34, .34, .24, 0, .38, .01);
    block(torso, harness, .32, .055, .24, 0, .14, .005);
    block(torso, black, .062, .05, .024, 0, .14, .125);
    block(torso, reflector, .345, .028, .014, 0, .31, .132);
    block(torso, reflector, .345, .028, .014, 0, .44, .132);
    // Parachute/survival pack & chest radio with whip antenna
    block(torso, harness, .25, .34, .12, 0, .39, -.16);
    block(torso, reflector, .18, .026, .012, 0, .35, -.222);
    block(torso, black, .055, .11, .042, -.11, .43, .14);
    cylinder(torso, black, .006, .16, .006, -.125, .56, .14);
    // Neck
    cylinder(torso, skin, .054, .09, .054, 0, .59, .01);

    const head = group('loadmaster-head', torso, 0, .71, .015);
    oval(head, skin, .092, .115, .10, 0, 0, .012);
    // Flight / SAR helmet with dark visor & comms earcups
    oval(head, helmetMat, .108, .095, .114, 0, .048, -.004);
    block(head, visorMat, .165, .052, .048, 0, .032, .092);
    oval(head, skin, .018, .026, .024, 0, -.018, .108);
    block(head, black, .045, .009, .014, 0, -.058, .102);
    for (const sign of [-1, 1]) {
      cylinder(head, black, .034, .024, .034, sign * .108, .005, 0).rotation.z = Math.PI / 2;
      block(torso, harness, .038, .35, .022, sign * .10, .39, .135);
    }

    const limbs = [-1, 1].map(sign => {
      const shoulder = group('loadmaster-shoulder', torso, sign * .215, .51, 0);
      shoulder.rotation.z = sign * .06;
      oval(shoulder, flightSuit, .068, .068, .068, 0, 0, 0);
      cylinder(shoulder, flightSuit, .054, .29, .056, 0, -.15, 0);
      const elbow = group('loadmaster-elbow', shoulder, 0, -.30, 0);
      cylinder(elbow, flightSuit, .046, .26, .048, 0, -.13, 0);
      cylinder(elbow, reflector, .050, .03, .050, 0, -.23, 0);
      oval(elbow, glove, .040, .062, .036, 0, -.29, .01);
      const hip = group('loadmaster-hip', actor, sign * .096, .94);
      cylinder(hip, pants, .078, .44, .082, 0, -.22, 0);
      const knee = group('loadmaster-knee', hip, 0, -.44, 0);
      oval(knee, harness, .064, .068, .066, 0, 0, .028);
      cylinder(knee, pants, .060, .40, .062, 0, -.20, 0);
      block(knee, bootMat, .102, .105, .245, 0, -.44, .045);
      block(knee, harness, .106, .025, .252, 0, -.49, .045);
      return { shoulder, elbow, hip, knee };
    });

    function pose(crouched, stride, age, moving) {
      torso.position.y = crouched ? .64 : .94 + Math.abs(Math.sin(stride)) * .022;
      torso.rotation.set(crouched ? .18 : .035, moving ? Math.sin(stride) * .04 : 0,
        crouched ? -.06 : Math.sin(age * 1.85) * .01);
      head.rotation.set(crouched ? -.14 : -.03, Math.sin(age * .82) * .16, 0);
      limbs.forEach(({ shoulder, elbow, hip, knee }, index) => {
        const swing = moving ? Math.sin(stride + index * Math.PI) : 0;
        shoulder.rotation.x = crouched ? (index === 0 ? -.42 : -.58) : swing * .34 - .04;
        elbow.rotation.x = crouched ? -.72 : -.16 - Math.max(swing, 0) * .22;
        hip.position.y = crouched ? .64 : .94;
        hip.rotation.x = crouched ? (index === 0 ? -1.18 : -.45) : -swing * .42;
        knee.rotation.x = crouched ? (index === 0 ? 1.48 : 1.25) : Math.max(swing, 0) * .72;
      });
    }

    return { actor, pose };
  }

  function createRailScene(world, layout) {
    const { THREE, scene, physics, fx, audio } = world;
    const { Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, BoxGeometry, SphereGeometry,
      CylinderGeometry, ConeGeometry, CircleGeometry, ShaderMaterial, AdditiveBlending, DoubleSide, Vector3 } = THREE;
    const root = new Group();
    root.name = 'rail-rescue-set';
    scene.add(root);
    const unitBox = new BoxGeometry(1, 1, 1);
    const unitSphere = new SphereGeometry(1, 10, 7);
    const unitCylinder = new CylinderGeometry(1, 1, 1, 10);
    const surface = (color, metalness = .08, roughness = .82) =>
      new MeshStandardMaterial({ color, metalness, roughness });
    const glow = color => new MeshBasicMaterial({ color });
    function group(name, parent = root, x = 0, y = 0, z = 0) {
      const node = new Group();
      node.name = name;
      node.position.set(x, y, z);
      parent.add(node);
      return node;
    }
    function mesh(parent, geometry, material, w, h, d, x, y, z) {
      const piece = new Mesh(geometry, material);
      piece.position.set(x, y, z);
      piece.scale.set(w, h, d);
      parent.add(piece);
      return piece;
    }
    const block = (parent, material, w, h, d, x, y, z) =>
      mesh(parent, unitBox, material, w, h, d, x, y, z);
    const oval = (parent, material, w, h, d, x, y, z) =>
      mesh(parent, unitSphere, material, w, h, d, x, y, z);
    const cylinder = (parent, material, w, h, d, x, y, z) =>
      mesh(parent, unitCylinder, material, w, h, d, x, y, z);
    const metal = surface(0x555a57, .62);
    const black = surface(0x222b27, .51);
    const safety = surface(0xba722a, .38);
    const ground = surface(0x757269);
    const warmLight = glow(0xffefc8);
    const redLight = glow(0xff5025);
    const tealLight = glow(0x5bffd6);
    const lampDark = surface(0x28282b, .32);
    const darkGlaze = surface(0x343735, .55);
    const locatorColor = surface(0x96783b, .18);

    const locator = group('rail-emergency-locator');
    locator.position.copy(layout.locator);
    block(locator, black, .52, .09, .36, 0, .06, 0);
    block(locator, locatorColor, .44, .18, .28, 0, .19, 0);
    for (const sx of [-.18, .18]) block(locator, black, .036, .19, .30, sx, .19, 0);
    block(locator, black, .265, .07, .028, 0, .20, .145);
    const locatorLamp = block(locator, redLight, .16, .035, .03, 0, .217, .16);
    cylinder(locator, metal, .012, .52, .012, -.16, .52, -.08).rotation.z = .18;
    cylinder(locator, safety, .042, .06, .042, .082, .29, .078);

    const survival = window.createSaltlineHuman
      ? (() => {
        const h = window.createSaltlineHuman(THREE, { name: 'rail-loadmaster', role: 'pilot', variation: 0 });
        root.add(h.actor);
        return {
          actor: h.actor,
          pose: (crouched, stride, age, moving) => h.pose(crouched ? 'crouch' : 'stand', stride, age, moving),
        };
      })()
      : createSurvivor({ group, block, oval, cylinder, surface });
    const { actor } = survival;
    actor.position.copy(layout.survivor);
    const flare = group('rail-rescue-flare', root, layout.survivor.x - .54, 0, layout.survivor.z - .54);
    cylinder(flare, safety, .042, .20, .042, 0, .1, 0).rotation.z = .44;
    const flareHead = oval(flare, redLight, .09, .1, .09, -.044, .21, 0);
    const locatorLight = oval(locator, redLight, .075, .05, .061, .082, .282, .078);

    const routeLamps = {};
    for (const [name, route] of [['ramp', layout.ramp], ['maintenance', layout.maintenance]]) {
      const station = group('rail-' + name + '-control');
      station.position.copy(route.signal);
      cylinder(station, black, .06, station.position.y, .06, 0, -station.position.y / 2, 0);
      block(station, metal, .38, .28, .22, 0, -.12, 0);
      block(station, darkGlaze, .28, .17, .035, 0, -.10, .124);
      const pilot = block(station, redLight, .18, .062, .044, 0, -.094, .145);
      routeLamps[name] = pilot;
    }

    const { min, max } = layout.door;
    const door = group('rail-maintenance-shutter');
    const closedY = (min.y + max.y) / 2;
    const width = max.z - min.z;
    door.position.set((min.x + max.x) / 2, closedY, (min.z + max.z) / 2);
    const doorBody = surface(0x545e5e, .57);
    block(door, doorBody, .14, max.y - min.y, width, 0, 0, 0);
    for (let y = -1.35; y < 1.43; y += .185) {
      block(door, metal, .18, .039, width, 0, y, 0);
    }
    block(door, safety, .21, .16, width, 0, -1.355, 0);
    const coverLamps = [-79.35, -74.9, -70.85].map(x => {
      block(root, black, 1.55, .12, .32, x, 4.01, 18.25);
      return block(root, lampDark, 1.4, .047, .25, x, 3.93, 18.25);
    });

    const lights = layout.floodlights.map((position, index) => {
      const mast = group('rail-freight-floodlight-' + index);
      mast.position.copy(position);
      if (index !== 3) {
        cylinder(mast, ground, .17, .29, .17, 0, -position.y + .15, 0);
        cylinder(mast, black, .065, position.y, .065, 0, -position.y / 2, 0);
        block(mast, metal, .11, .15, .5, 0, .11, -.03);
      }
      const housing = block(mast, black, .49, .262, .36, 0, 0, .12);
      housing.rotation.x = .26;
      const lamp = block(mast, warmLight, .402, .174, .031, 0, -.043, .297);
      lamp.rotation.x = .26;
      return lamp;
    });

    const transfer = group('rail-transfer-load');
    transfer.position.copy(layout.transfer);
    block(transfer, black, .62, .36, .61, 0, .25, 0);
    for (const side of [-1, 1]) {
      block(transfer, metal, .41, .104, .57, side * .21, .44, 0);
      block(transfer, black, .035, 3.05, .035, side * .33, -1.32, 0);
    }
    const load = group('rail-transfer-fallen-cradle', root);
    const cargoColor = surface(0x855535, .56);
    block(load, cargoColor, 2.52, .64, 1.25, 0, 0, 0);
    for (const sign of [-1, 1]) {
      block(load, black, 2.57, .06, .09, 0, -.33, sign * .55);
      block(load, safety, .2, .68, 1.29, sign * 1.05, 0, 0);
      block(load, metal, 2.04, .054, .068, 0, .204, sign * .655);
    }

    const search = group('rail-emergency-searchlight');
    search.position.copy(layout.searchlight);
    const searchHead = group('rail-searchlight-head', search);
    const drum = cylinder(searchHead, black, .24, .46, .24, 0, .03, 0);
    drum.rotation.x = Math.PI / 2;
    const hood = cylinder(searchHead, metal, .27, .14, .27, 0, .03, .26);
    hood.rotation.x = Math.PI / 2;
    const lens = cylinder(searchHead, warmLight, .20, .03, .20, 0, .03, .25);
    lens.rotation.x = Math.PI / 2;
    const lightMaterial = (fragment, opacity) => new ShaderMaterial({
      side: DoubleSide, transparent: true, blending: AdditiveBlending, depthWrite: false,
      uniforms: { opacity: { value: opacity } },
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: `uniform float opacity; varying vec2 vUv; void main(){${fragment}}`,
    });
    const beamMaterial = lightMaterial(
      'float a=smoothstep(0.0,0.25,vUv.y)*(0.37+0.63*vUv.y); gl_FragColor=vec4(0.71,0.81,0.67,a*opacity);', .16);
    const cone = new Mesh(new ConeGeometry(1, 1, 20, 1, true).translate(0, -.5, 0), beamMaterial);
    search.add(cone);
    const poolMaterial = lightMaterial(
      'float a=1.0-smoothstep(0.0,0.5,length(vUv-0.5)); gl_FragColor=vec4(0.81,0.85,0.59,a*opacity);', .29);
    const poolGeometry = new CircleGeometry(1, 24).rotateX(-Math.PI / 2);
    const pool = new Mesh(poolGeometry, poolMaterial);
    pool.name = 'rail-searchlight-footprint';
    root.add(pool);
    const floodPools = layout.floodlights.map(position => {
      const footprint = new Mesh(poolGeometry, poolMaterial);
      footprint.position.set(position.x, .039, position.z + 1.55);
      footprint.scale.set(3.55, 1, 2.4);
      root.add(footprint);
      return footprint;
    });
    const flarePool = new Mesh(poolGeometry, lightMaterial(
      'float a=1.0-smoothstep(0.04,0.5,length(vUv-0.5)); gl_FragColor=vec4(0.95,0.20,0.07,a*opacity);', .30));
    flarePool.position.set(flare.position.x, .035, flare.position.z);
    flarePool.scale.set(1.7, 1, 1.7);
    root.add(flarePool);

    const searchTarget = new Vector3();
    const direction = new Vector3();
    const down = new Vector3(0, -1, 0);
    const sparkDirection = new Vector3(.24, -.35, .28);
    const dustDirection = new Vector3(1, .48, .3);
    const rayEnd = new Vector3();
    const effectPoint = new Vector3();
    const land = new Vector3(layout.transfer.x + .08, .34, layout.transfer.z + .50);
    let blocker = null;
    let fallenLoad = null;
    let shutter = 0;
    let age = 0;
    let lastSpark = 0;
    let lastChirp = 0;
    let nextAlert = 0;
    let priorRoute = null;

    function shutterOpen(open) {
      if (open && blocker) {
        physics.removeBox(blocker);
        blocker = null;
      } else if (!open && !blocker) {
        blocker = physics.addBox(min, max, { surface: 'metal', tag: 'rail-maintenance-shutter' });
      }
    }

    function settleLoad(settled) {
      if (settled && !fallenLoad) {
        fallenLoad = physics.addBox([land.x - 1.19, 0, land.z - .59], [land.x + 1.19, .68, land.z + .59],
          { surface: 'metal', tag: 'rail-transfer-cradle' });
      } else if (!settled && fallenLoad) {
        physics.removeBox(fallenLoad);
        fallenLoad = null;
      }
    }

    function setLoad() {
      const fall = clamp((age - 1.16) / 1.44);
      transfer.rotation.x = -.09 * Math.sin(clamp(age / 1.5) * Math.PI);
      transfer.position.z = layout.transfer.z + .50 * ease(age / 1.12);
      load.position.set(land.x, 2.72 - 2.38 * fall ** 2, transfer.position.z);
      load.rotation.set(-.31 * fall * (1 - fall), .21 * fall, fall < 1 ? .18 * fall : .04);
    }

    function drawShutter() {
      const openFraction = ease(shutter);
      door.position.y = closedY * (1 + openFraction);
      door.scale.y = 1 - openFraction;
      door.visible = shutter < .997;
    }

    function reset(phase, route, playSetPiece) {
      age = playSetPiece || phase === 'inactive' ? 0 : 5;
      lastSpark = lastChirp = nextAlert = 0;
      priorRoute = route;
      shutter = route === 'maintenance' ? 1 : 0;
      shutterOpen(shutter === 1);
      settleLoad(age >= 2.6);
      drawShutter();
      actor.position.copy(layout.survivor);
      actor.rotation.y = -1.37;
      survival.pose(phase === 'search' || phase === 'locate', 0, 0, false);
      draw(phase, route);
    }

    function draw(phase, route) {
      const active = phase !== 'inactive';
      locator.visible = phase === 'search' || phase === 'locate';
      const locPulse = age % 2.2 < .24 || age % 2.2 > .38 && age % 2.2 < .56;
      locatorLamp.visible = locatorLight.visible = locPulse;
      actor.visible = active;
      flare.visible = flarePool.visible = phase === 'locate' || phase === 'choose';
      const flarePulse = .92 + Math.sin(age * 29) * .07 + Math.sin(age * 7) * .05;
      flareHead.scale.setScalar(.085 * flarePulse);
      flarePool.material.uniforms.opacity.value = .33 * flarePulse;
      const portablePower = route === 'maintenance';
      routeLamps.maintenance.material = portablePower ? tealLight : active ? redLight : lampDark;
      routeLamps.ramp.material = route === 'ramp' ? tealLight : active ? warmLight : lampDark;
      for (const lamp of coverLamps) lamp.material = portablePower ? warmLight : lampDark;
      lights.forEach((lamp, index) => {
        const cutoff = .22 + .22 * index;
        const powered = !active || age < cutoff || age - cutoff < .32 && Math.sin(age * 83 + index) > .3;
        lamp.material = powered ? warmLight : lampDark;
        floodPools[index].visible = active && powered;
      });
      search.visible = pool.visible = active && age >= 2.15;
      if (search.visible) {
        searchTarget.set(-77.4 + 7.75 * Math.sin(age * .63), .063, 10.24 + .48 * Math.sin(age * 1.26));
        direction.subVectors(searchTarget, search.position);
        cone.scale.set(2.62, direction.length(), 2.62);
        cone.quaternion.setFromUnitVectors(down, direction.normalize());
        searchHead.lookAt(searchTarget);
        pool.position.copy(searchTarget);
        pool.scale.set(2.72, 1, 1.95);
      }
      setLoad();
    }

    function update(dt, phase, route, player) {
      const before = age;
      age += dt;
      if (route === 'maintenance' && shutter < 1) {
        shutter = Math.min(1, shutter + dt / 2.35);
        drawShutter();
        if (shutter === 1) shutterOpen(true);
      }
      if (priorRoute !== route && route === 'maintenance') {
        audio?.play?.('rail_touchdown', { pos: routeLamps.maintenance.parent.position, ref: 6, gain: .36 });
        fx?.sparks?.(routeLamps.maintenance.parent.position, sparkDirection, 10);
      }
      priorRoute = route;
      if (before < .75 && age >= .75) {
        audio?.play?.('rail_touchdown', { pos: layout.floodlights[2], ref: 17, gain: .49, jitter: 0 });
      }
      if (before < 2.6 && age >= 2.6) {
        settleLoad(true);
        audio?.play?.('rail_touchdown', { pos: land, ref: 16, gain: .67, jitter: 0 });
        fx?.dust?.(land, dustDirection, 3.2, .62, .49, .38);
        fx?.smoke?.(land, { size: 2.9, life: 3.2, color: 0x716d60, alpha: .42, rise: .18, count: 5 });
        fx?.sparks?.(land, dustDirection, 24);
        if (range(land, player.pos) < 24) player.addShake?.(.12);
      }
      if (age < 4.3 && age >= lastSpark && age > .45) {
        const index = Math.min(lights.length - 1, Math.floor((age - .45) * 2.1));
        effectPoint.copy(layout.floodlights[index]);
        effectPoint.y -= .15;
        fx?.sparks?.(effectPoint, sparkDirection, age < 2.1 ? 13 : 6);
        lastSpark = age + .28;
      }
      if ((phase === 'search' || phase === 'locate') && age >= lastChirp) {
        const pos = phase === 'search' ? layout.locator : layout.survivor;
        if (range(player.pos, pos) < 18) audio?.play?.('rail_log_radio', { pos, ref: 3.4, gain: .38, jitter: 0 });
        lastChirp = age + (phase === 'search' ? 3.25 : 4.4);
      }
      draw(phase, route);
      if (phase !== 'escort' || route !== 'ramp' || !search.visible || age < nextAlert ||
        range(player.pos, searchTarget) > 2.7) return false;
      rayEnd.copy(player.pos).y += .9;
      if (!physics.lineOfSight(search.position, rayEnd)) return false;
      nextAlert = age + 5;
      world.enemies?.alert?.(player.pos, 34);
      return true;
    }

    return {
      actor, reset, update, pose: survival.pose,
      isDoorOpen: () => blocker === null,
    };
  }

  window.createRailRescue = (world, layout) => {
    const { THREE, physics } = world;
    const { actor, reset: resetScene, update: updateScene, pose, isDoorOpen } = createRailScene(world, layout);
    const trace = new THREE.Vector3();
    const ahead = new THREE.Vector3();
    const stepTo = new THREE.Vector3();
    const routes = {
      ramp: [...layout.ramp.waypoints, layout.handoff],
      maintenance: [...layout.maintenance.waypoints, layout.handoff],
    };
    let phase, route, held, holding, waypoint, status, age, stride, alerted, nextStatusRadio, statusSince;

    function reset(snapshot = null, { playSetPiece = false } = {}) {
      phase = ['search', 'locate', 'choose', 'escort'].includes(snapshot?.phase) ? snapshot.phase : 'inactive';
      route = phase === 'escort' && Object.hasOwn(routes, snapshot.route) ? snapshot.route : null;
      if (phase === 'escort' && !route) phase = 'choose';
      held = age = stride = waypoint = 0;
      holding = null;
      status = 'idle';
      alerted = false;
      statusSince = 0;
      nextStatusRadio = 5;
      resetScene(phase, route, playSetPiece);
    }

    function start() {
      if (phase !== 'inactive') return null;
      reset({ phase: 'search' }, { playSetPiece: true });
      return dialogue.search;
    }

    function visible(player, target, height, radius) {
      if (range(player.pos, target) > radius || Math.abs(player.pos.y - target.y) > 1.8) return false;
      trace.copy(target).y += height;
      return physics.lineOfSight(player.eye, trace);
    }

    function interactAt(player) {
      if (phase === 'search' && visible(player, layout.locator, .23, 2.35)) return 'search';
      if (phase === 'locate' && visible(player, actor.position, .74, 2.35)) return 'locate';
      if (phase === 'choose') {
        for (const name of ['ramp', 'maintenance']) {
          const { control } = layout[name];
          if (visible(player, control, 1.3, 2.05)) return name;
        }
      }
      return null;
    }

    function moveSurvivor(dt, player) {
      const path = routes[route];
      const next = path[waypoint];
      if (!next) return 'handoff';
      const gap = range(actor.position, player.pos);
      if (gap > (status === 'waiting' ? 5.75 : 7.5) || Math.abs(player.pos.y - actor.position.y) > 2.5) {
        return 'waiting';
      }
      const distance = range(actor.position, next);
      if (distance < .08) {
        waypoint++;
        return waypoint === path.length ? 'handoff' : 'moving';
      }
      const dx = (next.x - actor.position.x) / distance;
      const dz = (next.z - actor.position.z) / distance;
      const lead = (player.pos.x - actor.position.x) * dx + (player.pos.z - actor.position.z) * dz;
      const margin = range(player.pos, next) < (waypoint === path.length - 1 ? 2.2 : 2.65) ? -.03 : .86;
      const step = Math.min(distance, (route === 'ramp' ? 3.05 : 2.65) * dt,
        Math.max(0, lead - margin));
      ahead.set(actor.position.x + dx * Math.min(distance, .85), actor.position.y,
        actor.position.z + dz * Math.min(distance, .85));
      if (!physics.nav.clearLine(actor.position, ahead)) return 'blocked';
      if (step <= 0) return 'ready';
      stepTo.set(actor.position.x + dx * step, actor.position.y, actor.position.z + dz * step);
      if (!physics.nav.clearLine(actor.position, stepTo)) return 'blocked';
      actor.position.copy(stepTo);
      actor.position.y = physics.groundHeight(stepTo.x, stepTo.z, .48);
      const targetYaw = Math.atan2(dx, dz);
      const turn = Math.atan2(Math.sin(targetYaw - actor.rotation.y), Math.cos(targetYaw - actor.rotation.y));
      actor.rotation.y += turn * Math.min(1, dt * 8);
      stride += step * 5.4;
      return 'moving';
    }

    function update(dt, player, interact) {
      if (!player.alive || !Number.isFinite(dt) || dt <= 0 || phase === 'inactive' || phase === 'complete') return null;
      const previousPhase = phase;
      const previousStatus = status;
      const previousWaypoint = waypoint;
      age += dt;
      let radio = null;
      let target = interactAt(player);
      if (!interact || target !== holding) held = 0;
      holding = target;
      const duration = target === 'maintenance' ? 1.75 : target === 'locate' ? 1.2 : .6;
      if (target && interact) {
        held += dt;
        if (held >= duration) {
          if (target === 'search') phase = 'locate';
          else if (target === 'locate') phase = 'choose';
          else {
            route = target;
            phase = 'escort';
            nextStatusRadio = age + 5;
          }
          radio = dialogue[route ?? phase];
          target = holding = null;
          held = 0;
        }
      }
      const seen = updateScene(dt, phase, route, player);
      if (seen && !alerted) {
        alerted = true;
        radio ??= dialogue.illuminated;
      }
      if (phase === 'escort') {
        status = moveSurvivor(dt, player);
        if (previousStatus !== status) statusSince = age;
        if ((status === 'waiting' || status === 'blocked') && age - statusSince >= 1.15 &&
          age >= nextStatusRadio && !radio) {
          radio = dialogue[status];
          nextStatusRadio = age + 9;
        }
        if (status === 'handoff' && range(player.pos, layout.handoff) <= 2.25 &&
          Math.abs(player.pos.y - layout.handoff.y) <= 1.8) {
          phase = 'complete';
          radio = dialogue.complete;
        }
      }
      pose(phase === 'search' || phase === 'locate', stride, age, status === 'moving');
      return {
        changed: previousPhase !== phase || previousStatus !== status || previousWaypoint !== waypoint,
        prompt: target ? prompts[target] : null,
        progress: target ? held / duration : 0,
        radio,
        complete: phase === 'complete',
      };
    }

    const marker = (id, short, pos, kind = 'story') => ({ id: 'rail-' + id, short, pos, kind });
    const api = {
      reset, start, update,
      get phase() { return phase; },
      get route() { return route; },
      get status() { return status; },
      get survivor() { return actor.position; },
      get doorOpen() { return isDoorOpen(); },
      get snapshot() {
        if (phase === 'escort') return { phase, route };
        if (phase === 'search' || phase === 'locate' || phase === 'choose') return { phase };
        return null;
      },
      get resumePosition() {
        if (phase === 'search') return layout.start;
        if (phase === 'locate') return layout.locator;
        if (phase === 'choose' || phase === 'escort') return layout.survivor;
        return null;
      },
      get objective() {
        if (phase !== 'escort') return objectives[phase] ?? null;
        if (status === 'waiting' || status === 'blocked' || status === 'handoff') return objectives[status];
        return objectives[route];
      },
      get markers() {
        if (phase === 'search') return [marker('locator', 'ELT', layout.locator)];
        if (phase === 'locate') return [marker('survivor', 'SOS', actor.position)];
        if (phase === 'choose') return [marker('ramp', 'RMP', layout.ramp.control),
          marker('door', 'PWR', layout.maintenance.control)];
        if (phase !== 'escort') return [];
        const survivor = marker('survivor', 'SOS', actor.position);
        const next = routes[route][waypoint];
        const destination = !next || next === layout.handoff ? marker('handoff', 'EX', layout.handoff, 'extract') :
          marker('escort-next', route === 'ramp' ? 'RMP' : 'M04', next);
        return status === 'waiting' || status === 'blocked' ? [survivor, destination] : [destination, survivor];
      },
    };
    reset();
    return api;
  };
})();
