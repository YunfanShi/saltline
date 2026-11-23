(function () {
  'use strict';

  const spec = Object.freeze({name: 'Tern S12', magSize: 12, reserve: 36, damage: 21, range: 75, rpm: 390});
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const smooth = value => (value = clamp(value), value * value * (3 - 2 * value));
  const blend = (from, to, weight) => from + (to - from) * weight;
  const muzzleAt = [0, .018, -.179];
  const ejectAt = [.019, .035, -.045];
  const sightHeight = .045;

  function createSidearmAction(emit) {
    let ammo, reserve, cooldown, held, reload;
    const sidearm = {
      get ammo() { return ammo; },
      get reserve() { return reserve; },
      get reload() { return reload; },
      get slideLocked() { return reload?.empty ? reload.time < 1.34 : ammo === 0; },
      reset() {
        ammo = spec.magSize;
        reserve = spec.reserve;
        cooldown = 0;
        held = false;
        reload = null;
      },
      addAmmo(rounds) { reserve += rounds; },
      reloadNow() {
        if (reload || ammo === spec.magSize || reserve <= 0) return false;
        reload = {time: 0, empty: ammo === 0, removed: false, inserted: false, released: false};
        emit('weapon:reload', {phase: 'start', empty: reload.empty});
        return true;
      },
      update(dt, {trigger = false, tapped = false, ready = true, infinite = false} = {}) {
        const pressed = tapped || trigger && !held;
        held = trigger;
        cooldown = Math.max(0, cooldown - dt);
        if (reload) {
          reload.time += dt;
          function reach(phase, flag, time) {
            if (reload[flag] || reload.time + 1e-8 < time) return false;
            reload[flag] = true;
            emit('weapon:reload', {phase, empty: reload.empty});
            return true;
          }
          reach('magout', 'removed', .32);
          if (reach('magin', 'inserted', 1.02)) {
            const rounds = Math.min(spec.magSize - ammo, reserve);
            ammo += rounds;
            reserve -= rounds;
          }
          if (reload.empty) reach('bolt', 'released', 1.34);
          if (reload.time + 1e-8 >= (reload.empty ? 1.65 : 1.38)) {
            reload = null;
            emit('weapon:reload', {phase: 'done'});
          }
          return false;
        }
        if (!pressed || !ready || cooldown > 0) return false;
        if (!ammo) {
          emit('weapon:dry', {});
          return false;
        }
        if (!infinite) ammo--;
        cooldown = 60 / spec.rpm;
        return true;
      }
    };
    sidearm.reset();
    return sidearm;
  }

  function createModel(game, {profile, bevel, finish, batch, glove, flash, layer}) {
    const {Group, Mesh, MeshStandardMaterial, MeshBasicMaterial, CylinderGeometry, TorusGeometry,
      PlaneGeometry, CanvasTexture, SRGBColorSpace, Euler, Quaternion, Vector3} = game.THREE;
    const root = new Group();
    const slide = new Group();
    const magazine = new Group();
    root.name = 'viewmodel-tern-s12';
    slide.name = 'tern-slide';
    magazine.name = 'tern-magazine';
    root.add(slide, magazine);

    const white = [1, 1, 1];
    const surface = (color, roughness, metalness, kind) => {
      const material = new MeshStandardMaterial({color, roughness, metalness, vertexColors: true});
      return kind === undefined ? material : finish(material, kind);
    };
    const steel = surface(0x495252, .38, .62, 0);
    const machined = surface(0x808b88, .35, .7, 1);
    const polymer = surface(0x403e29, .69, .06, 2);
    const rubber = surface(0x22271f, .95, 0, 2);
    const shadows = surface(0x141821, .58, .35, 1);
    const accent = surface(0x955328, .62, .18);
    const brass = surface(0xb17c46, .4, .62);
    const sight = new MeshStandardMaterial({color: 0xf6b76a, emissive: 0xa46125, emissiveIntensity: .44, roughness: .63});
    const batches = new Map();
    function part(group, material, geometry) {
      if (!batches.has(group)) batches.set(group, new Map());
      const parts = batches.get(group);
      if (!parts.has(material)) parts.set(material, []);
      parts.get(material).push(geometry);
    }
    function panel(group, material, shape, left, right, radius, holes) {
      part(group, material, profile(shape, left, right, radius, white, .45, holes));
    }
    function box(group, material, size, at, radius = .001, rotation = null) {
      part(group, material, bevel(...size, radius, ...at, white, .4, rotation));
    }
    // Profiles read forward from the rear. The native extrusion maps forward to camera -Z.
    panel(slide, steel, [[-.043,.002],[.155,.002],[.177,.009],[.177,.026],[.163,.034],[-.034,.034],[-.043,.023]], -.017, -.009, .0016);
    panel(slide, steel, [[-.043,.002],[.155,.002],[.177,.009],[.177,.026],[.163,.034],[.081,.034],[.076,.015],[.034,.015],[.028,.034],[-.034,.034],[-.043,.023]], .009, .017, .0013);
    panel(slide, steel, [[-.042,.012],[.030,.012],[.030,.033],[-.034,.034],[-.043,.023]], -.011, .010, .0018);
    panel(slide, steel, [[.074,.009],[.172,.009],[.177,.026],[.163,.034],[.080,.034]], -.011, .010, .0018);
    box(slide, machined, [.026,.005,.042], [0,.031,.053], .0015);
    box(slide, shadows, [.027,.005,.012], [0,.008,.030]);
    box(slide, shadows, [.017,.006,.027], [0,.016,.054]);
    box(slide, machined, [.0045,.004,.027], [.016,.015,.055]);
    box(slide, shadows, [.003,.006,.018], [.017,.018,.035]);
    box(slide, machined, [.005,.004,.010], [.018,.018,.035]);

    function cylinder(group, material, radius, length, x, y, forward, axis = 'Z') {
      const cylinder = new CylinderGeometry(radius, radius, length, 12);
      if (axis === 'X') cylinder.rotateZ(Math.PI / 2);
      else cylinder.rotateX(Math.PI / 2);
      part(group, material, cylinder.translate(x, y, -forward));
    }
    // Dark recessed muzzle face, bright inner lip and a fixed lower guide cap.
    part(root, machined, new TorusGeometry(.0094, .00145, 6, 16).translate(...muzzleAt));
    part(root, steel, new TorusGeometry(.0124, .0019, 6, 16).translate(0, .018, -.176));
    cylinder(root, shadows, .0096, .003, 0, .018, .175);
    cylinder(root, machined, .0046, .002, 0, .005, .176);
    cylinder(root, shadows, .0028, .0024, 0, .005, .177);
    box(root, shadows, [.021,.013,.067], [0,.010,.148], .002);

    panel(root, polymer, [[-.047,-.002],[.155,-.002],[.164,-.01],[.155,-.02],[.093,-.024],[.049,-.066],[.012,-.108],[-.039,-.106],[-.038,-.064],[-.038,-.025],[-.052,-.02]], -.015, .015, .0022,
      [[[.022,-.027],[.076,-.029],[.057,-.048],[.039,-.055],[.016,-.048]]]);
    panel(root, shadows, [[-.050,-.003],[-.038,-.013],[.157,-.013],[.160,-.004]], -.0155, .0155, .0008);
    panel(root, machined, [[.017,-.020],[.030,-.022],[.031,-.028],[.024,-.031],[.022,-.040],[.022,-.048],[.017,-.045],[.015,-.035]], -.003, .003, .001);
    for (const side of [-1, 1]) {
      const outer = side * .0156;
      const span = [outer - .0028, outer + .0028];
      panel(root, rubber, [[-.037,-.093],[-.032,-.053],[-.022,-.033],[.005,-.035],[.014,-.051],[.004,-.095],[-.003,-.104],[-.027,-.104]], ...span, .0016);
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 6; col++) {
          box(root, rubber, [.0018,.0029,.0038], [side*.0182,-.049-row*.0056,-.024+col*.0048-(row%2)*.0019], .00045, [-.25,0,0]);
        }
      }
      box(root, shadows, [.003,.011,.026], [side*.017,-.008,.013], .001);
      box(root, machined, [.002,.005,.018], [side*.019,-.008,.013], .0008);
      box(root, accent, [.002,.004,.005], [side*.020,-.009,-.006], .0006);
      cylinder(root, machined, .0032, .0028, side*.0157, -.025, -.014, 'X');
      cylinder(root, shadows, .0013, .0033, side*.0163, -.025, -.014, 'X');
      for (let index = 0; index < 6; index++) {
        box(slide, shadows, [.002,.022,.0022], [side*.0167,.016,-.033+index*.007], .0004, [-.22,0,0]);
        box(slide, machined, [.0009,.020,.001], [side*.0171,.016,-.031+index*.007], .0003, [-.22,0,0]);
      }
      for (let index = 0; index < 5; index++) {
        box(slide, shadows, [.0017,.014,.0024], [side*.0167,.014,.110+index*.006], .0004, [-.22,0,0]);
      }
      box(slide, shadows, [.008,.010,.014], [side*.0105,.040,-.030], .0015);
      cylinder(slide, sight, .00175, .0015, side*.0105, sightHeight-.001, -.037);
    }
    for (let index = 0; index < 4; index++) {
      box(root, shadows, [.028,.0036,.0036], [0,-.019,.107+index*.011], .0007);
    }
    box(slide, shadows, [.031,.005,.019], [0,.034,-.030], .0013);
    box(slide, shadows, [.0065,.009,.016], [0,.041,.152], .0013);
    cylinder(slide, sight, .0023, .002, 0, sightHeight, .145);
    box(slide, machined, [.004,.003,.026], [0,.024,-.037], .0008);

    panel(magazine, machined, [[-.041,-.105],[.007,-.105],[.020,-.051],[-.026,-.046]], -.011, .011, .0015);
    panel(magazine, rubber, [[-.047,-.112],[.011,-.112],[.012,-.104],[-.042,-.101]], -.017, .017, .0019);
    box(magazine, accent, [.024,.002,.022], [0,-.111,-.013], .0008);
    for (let index = 0; index < 6; index++) {
      const at = -.087+index*.006;
      cylinder(magazine, shadows, .002, .024, 0, at, -.022+index*.0015, 'X');
    }
    for (const [group, parts] of batches) {
      for (const [material, geoms] of parts) {
        const mesh = new Mesh(batch(geoms), material);
        mesh.frustumCulled = false;
        group.add(mesh);
        geoms.forEach(geometry => geometry.dispose());
      }
    }
    const round = new Group();
    const roundCase = new Mesh(new CylinderGeometry(.004, .004, .016, 12).rotateX(Math.PI/2), brass);
    const roundTip = new Mesh(new CylinderGeometry(.0023, .004, .008, 12).rotateX(-Math.PI/2), machined);
    roundTip.position.z = -.012;
    round.add(roundCase, roundTip);
    round.position.set(0, -.044, .005);
    magazine.add(round);

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 96;
    const ink = canvas.getContext('2d');
    ink.fillStyle = '#b8b7a0';
    ink.font = 'bold 29px monospace';
    ink.fillText('TERN S12', 12, 33);
    ink.font = '12px monospace';
    ink.fillText('SALTLINE PORT AUTHORITY', 13, 53);
    ink.fillText('ISSUE 04  /  UNIT 0127', 13, 72);
    ink.fillStyle = '#ac6941';
    ink.fillRect(11, 77, 53, 3);
    const stamp = new CanvasTexture(canvas);
    stamp.colorSpace = SRGBColorSpace;
    const stampMaterial = new MeshBasicMaterial({map: stamp, transparent: true, depthWrite: false, opacity: .68});
    for (const side of [-1, 1]) {
      const mark = new Mesh(new PlaneGeometry(.069,.020), stampMaterial);
      mark.position.set(side*.0176,.018,side < 0 ? -.070 : -.112);
      mark.rotation.y = side*Math.PI/2;
      slide.add(mark);
    }

    const rotate = (x, y, z) => new Quaternion().setFromEuler(new Euler(x,y,z));
    const rightGrip = rotate(-.25,0,0).multiply(rotate(0,0,-Math.PI/2));
    const leftGrip = rotate(0,0,Math.PI/2).multiply(rotate(.1,0,0));
    function localVector(rotation, vector, mirror = false) {
      const result = new Vector3(...vector).normalize().applyQuaternion(rotation.clone().invert());
      if (mirror) result.x *= -1;
      return result.toArray();
    }
    const gloves = game.mats.get('glove_fabric', {triplanar:true, vertexColors:true, scale:3});
    const right = glove({mirror:false, fingers:[null,[.86,1.47,.8,0],[.97,1.46,.8,0],[1.07,1.4,.8,-.04]],
      indexPoses:[[.08,.19,.17,.05],[.57,1.2,.54,0]],
      thumb:[[-.86,.08,-.5],[-.5,.08,-.85],[-.05,-.1,-.99]].map(v => localVector(rightGrip,v)),
      forearm:localVector(rightGrip,[.45,-.24,.76]), sleeve:.23});
    const left = glove({mirror:true, fingers:[[1.17,1.43,.72,.01],[1.24,1.42,.75,0],[1.3,1.45,.75,-.02],[1.34,1.45,.75,-.05]],
      thumb:[[-.1,.25,-.96],[.02,.14,-.99],[0,0,-1]].map(v => localVector(leftGrip,v,true)),
      forearm:localVector(leftGrip,[-.54,-.32,.79],true), sleeve:.23});
    const rightHand = new Group();
    const leftHand = new Group();
    rightHand.quaternion.copy(rightGrip);
    rightHand.position.set(.013,-.059,.017).sub(new Vector3(.006,-.031,-.085).applyQuaternion(rightGrip));
    const fingerGeometry = right.index[0];
    fingerGeometry.morphAttributes.position = [right.index[1].attributes.position];
    fingerGeometry.morphAttributes.normal = [right.index[1].attributes.normal];
    const finger = new Mesh(fingerGeometry, gloves);
    finger.frustumCulled = false;
    rightHand.add(new Mesh(right.fabric, gloves), finger);
    leftHand.add(new Mesh(left.fabric, gloves));
    root.add(rightHand, leftHand);
    const leftPivot = new Vector3(0,-.015,-.055);
    const leftBase = new Vector3(-.022,-.072,-.012).sub(leftPivot.applyQuaternion(leftGrip));
    leftHand.position.copy(leftBase);
    leftHand.quaternion.copy(leftGrip);

    const flare = flash();
    flare.position.fromArray(muzzleAt);
    flare.scale.setScalar(.56);
    flare.visible = false;
    root.add(flare);
    root.traverse(child => child.layers.set(layer));
    game.camera.add(root);
    return {root, slide, magazine, round, flare, finger, leftHand, leftBase, leftGrip};
  }

  function createSidearm(game, assets) {
    const {Vector3} = game.THREE;
    const model = createModel(game, assets);
    const {root, slide, magazine, round, flare, finger, leftHand, leftBase, leftGrip} = model;
    const random = game.rng?.fork?.() || Math.random;
    const action = createSidearmAction((event, details) => game.events.emit(event, {...details, weapon: 'sidearm'}));
    const origin = new Vector3(), direction = new Vector3(), muzzle = new Vector3();
    const hitPoint = new Vector3(), shell = new Vector3(), velocity = new Vector3();
    const reloadOffset = new Vector3(), handOffset = new Vector3();
    let ads = 0, sprint = 0, age = 0, sinceShot = 1, spread = .017, equip = 0, fingerCurl = 0;
    let swayX = 0, swayY = 0;
    const worldAt = (local, out) => {
      const camera = game.camera;
      const scale = Math.tan(camera.fov*Math.PI/360)/Math.tan(game.viewCamera.fov*Math.PI/360);
      root.updateMatrix();
      out.fromArray(local).applyMatrix4(root.matrix);
      out.x *= scale;
      out.y *= scale;
      return out.applyQuaternion(camera.quaternion).add(camera.position);
    };
    const weapon = {
      ...spec,
      root,
      get ammo() { return action.ammo; },
      get reserve() { return action.reserve; },
      get ads() { return ads; },
      get spread() { return spread; },
      get state() { return action.reload ? 'reloading' : sinceShot < .12 ? 'firing' : sprint > .5 ? 'sprinting' : 'idle'; },
      addAmmo: action.addAmmo,
      reloadNow: action.reloadNow,
      muzzleWorld(out = new Vector3()) { return worldAt(muzzleAt, out); },
      setVisible(visible) { root.visible = !!visible; },
      equip() { equip = 1; },
      reset() {
        action.reset();
        age = ads = sprint = swayX = swayY = equip = fingerCurl = 0;
        sinceShot = 1;
        spread = .017;
        pose(0);
      },
      update(dt, blockTrigger = false) {
        const {input, player} = game;
        if (!player.alive) { flare.visible = false; return; }
        age += dt;
        sinceShot += dt;
        equip = Math.max(0, equip - dt*5);
        const held = root.visible && !blockTrigger && !!input.fire;
        const tapped = root.visible && !blockTrigger && !!input.pressed?.('fire');
        if (root.visible && input.pressed?.('reload')) action.reloadNow();
        sprint = blend(sprint, player.sprinting && !action.reload ? 1 : 0, 1-Math.exp(-dt*12));
        ads = clamp(ads + (input.ads && !action.reload && sprint<.35 ? dt : -dt)/.16);
        const bloom = Math.max(0, 1-sinceShot/.26);
        spread = blend(.017,.0026,smooth(ads)) + clamp(player.speed/5)*.012 + bloom*.008 + (player.onGround ? 0 : .013);
        swayX = blend(swayX, clamp(input.look?.dx || 0,-.12,.12), 1-Math.exp(-dt*16));
        swayY = blend(swayY, clamp(input.look?.dy || 0,-.12,.12), 1-Math.exp(-dt*16));
        fingerCurl = blend(fingerCurl, held && !action.reload ? 1 : 0, 1-Math.exp(-dt*34));
        const shot = action.update(dt, {trigger: held, tapped, ready: sprint<.55,
          infinite: game.developer?.flags.infiniteAmmo});
        pose();
        if (shot) shoot();
      }
    };

    function pose() {
      const {player} = game;
      const aim = smooth(ads);
      const bob = clamp(player.speed/5)*(1-aim*.87)*(player.onGround ? 1 : 0);
      const recoil = sinceShot<.28 ? Math.exp(-sinceShot*17)*Math.sin(.62+sinceShot*28) : 0;
      const slidePulse = sinceShot<.084 ? Math.sin(Math.PI*sinceShot/.084) : 0;
      const reload = action.reload;
      const time = reload?.time || 0;
      const transition = reload ? smooth(time/.25)*(1-smooth((time-(reload.empty ? 1.30 : 1.02))/.34)) : 0;
      const travel = reload && time>.32 && time<1.02 ? smooth((time-.32)/.27)*(1-smooth((time-.72)/.30)) : 0;
      const reach = reload ? smooth(time/.31)*(1-smooth((time-1.0)/.30)) : 0;
      const rack = reload?.empty ? smooth((time-1.05)/.18)*(1-smooth((time-1.34)/.24)) : 0;
      const draw = smooth(equip);
      root.position.set(blend(.091,0,aim)+Math.sin(age*9)*bob*.004-swayX*.07-transition*.031,
        blend(-.087,-sightHeight,aim)+Math.cos(age*18)*bob*.004+Math.sin(age*1.6)*.001*(1-aim)-sprint*.065-transition*.024-draw*.10,
        blend(-.227,-.152,aim)+recoil*.019+transition*.032+sprint*.035);
      root.rotation.set(transition*.29+recoil*.16-swayY*.35-sprint*.19-draw*.45, blend(.054,0,aim)+swayX*.65+transition*.27,
        -sprint*.33-transition*.49+recoil*.037, 'YXZ');
      slide.position.z = (action.slideLocked ? .039 : 0) + (action.slideLocked ? 0 : slidePulse*.035);
      reloadOffset.set(-.035,-.123,.041).multiplyScalar(travel);
      magazine.position.copy(reloadOffset);
      magazine.rotation.z = -travel*.24;
      round.visible = weapon.ammo > 0 || Boolean(reload && time > .71);
      handOffset.set(-.018,-.043,.027).multiplyScalar(reach).add(reloadOffset);
      handOffset.x -= rack*.012;
      handOffset.y += rack*.081;
      handOffset.z -= rack*.048;
      leftHand.position.copy(leftBase).add(handOffset);
      leftHand.quaternion.copy(leftGrip);
      leftHand.rotateZ(-travel*.22+rack*.54);
      finger.morphTargetInfluences[0] = fingerCurl;
      flare.visible = sinceShot < .046;
      flare.material.uniforms.uInt.value = flare.visible ? 7*Math.sqrt(1-sinceShot/.046) : 0;
      flare.material.uniforms.uHeat.value = 0;
    }

    function shoot() {
      const camera = game.camera;
      const angle = random()*Math.PI*2;
      const radius = Math.tan(spread)*Math.sqrt(random());
      origin.copy(game.player.eye || camera.position);
      direction.set(Math.cos(angle)*radius, Math.sin(angle)*radius, -1).normalize().applyQuaternion(camera.quaternion);
      const hit = game.combat.playerShot(origin, direction, {damage:spec.damage, range:spec.range});
      if (hit?.point) hitPoint.copy(hit.point);
      else hitPoint.copy(origin).addScaledVector(direction,spec.range);
      worldAt(muzzleAt, muzzle);
      game.fx?.tracer?.(muzzle,hitPoint,{color:0xffd9aa,width:.020});
      worldAt(ejectAt,shell);
      velocity.set(1.2+random(), .85+random(), .42).applyQuaternion(camera.quaternion);
      if (game.player.vel) velocity.add(game.player.vel);
      game.fx?.shell?.(shell,velocity);
      game.render?.lightPool?.flash(muzzle,0xffb660,26,6,.038);
      game.events.emit('weapon:fire', {weapon:'sidearm', origin, dir:direction, muzzle, ads});
      game.player.addRecoil?.(blend(.014,.008,ads), (random()-.5)*.004);
      game.player.addShake?.(.08);
      sinceShot = 0;
      flare.rotation.z = (random()-.5)*.7;
      flare.material.uniforms.uSeed.value = random()*100;
      flare.material.uniforms.uJet.value = .65;
      pose();
    }

    weapon.reset();
    return weapon;
  }

  function createCampaignWeapons(game, rifle, makeSidearm) {
    let sidearm;
    let active = rifle;
    let visible = true;
    let waitForRelease = false;
    let campaignControls = false;
    const isCampaign = () => Boolean(game.game?.campaign && !game.game.conquest);
    function setControls(enabled) {
      if (campaignControls === enabled) return;
      campaignControls = enabled;
      game.input.setCampaignWeapons?.(enabled);
    }
    game.events.on('game:state', () => setControls(isCampaign()));
    function select(slot) {
      if (!isCampaign() || game.game.state !== 'playing' || !game.player.enabled || !game.player.alive) return false;
      if (slot !== 'sidearm' && slot !== 'rifle') return false;
      const next = slot === 'sidearm' ? (sidearm ||= makeSidearm()) : rifle;
      if (next === active) return false;
      active.setVisible(false);
      active = next;
      active.equip?.();
      active.setVisible(visible);
      waitForRelease = !!game.input.fire;
      game.events.emit('weapon:switch', {weapon: slot});
      return true;
    }

    return {
      get slot() { return active === rifle ? 'rifle' : 'sidearm'; },
      get name() { return active.name; },
      get ammo() { return active.ammo; },
      get reserve() { return active.reserve; },
      get magSize() { return active.magSize; },
      get state() { return active.state; },
      get ads() { return active.ads; },
      get spread() { return active.spread; },
      get root() { return active.root; },
      select,
      addAmmo(rounds) { active.addAmmo(rounds); },
      refill() { active.reset(); },
      reloadNow() { return active.reloadNow(); },
      muzzleWorld(out) { return active.muzzleWorld(out); },
      setWetness(value) { rifle.setWetness(value); },
      setVisible(value) { visible = !!value; active.setVisible(visible); },
      reset() {
        sidearm?.setVisible(false);
        sidearm?.reset();
        rifle.reset();
        active = rifle;
        rifle.setVisible(visible);
        waitForRelease = false;
        setControls(isCampaign());
      },
      update(dt) {
        const input = game.input;
        const campaign = isCampaign();
        setControls(campaign);
        if (!campaign) {
          rifle.update(dt);
          return;
        }
        const pressed = action => input.pressed?.(action);
        let switched = false;
        if (pressed('rifle')) switched = select('rifle');
        else if (pressed('sidearm')) switched = select('sidearm');
        else if (pressed('swapWeapon')) switched = select(active === rifle ? 'sidearm' : 'rifle');
        if (waitForRelease && !input.fire) waitForRelease = false;
        if (active !== rifle) { active.update(dt, switched || waitForRelease); return; }
        if (!waitForRelease) { rifle.update(dt); return; }
        const noFire = rifle.debug.noFire;
        rifle.debug.noFire = true;
        try { active.update(dt); }
        finally { rifle.debug.noFire = noFire; }
      }
    };
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = {createSidearmAction, createCampaignWeapons};
  else globalThis.SaltlineSidearm = {createSidearm, createCampaignWeapons};
})();
