/* Story handoffs are timed independently of the playable chapters. */
(() => {
  const line = (english, chinese) => ({ english, chinese });
  const handoffs = Object.freeze({
    berth: [
      line('Boat has you. Set those sheets where I can see them.', '接应艇收到。把两张记录摊开给我看。'),
      line('Read me those times again. Five thirty-one, then five thirty-four.', '把时间再念一遍。五点三十一，然后五点三十四。'),
      line('West customs kept the signed copy. We are taking you to the rail yard.', '西区货检棚留着签发原件。我们送你去铁路货场。'),
    ],
    rail: [
      line('Easy, Harris. The stretcher is behind you.', '哈里斯，慢一点。担架就在你身后。'),
      line('That boat never left. I watched them take the fuel out.', '那艘船根本没出港。我亲眼看着他们把油抽掉。'),
      line('Mara is still on shift at the old dry dock. She can identify the tug.', '玛拉还在旧船坞值班。她能认出拖轮。'),
    ],
    drydock: [
      line('Give me your hand. I have the chart.', '手给我。我把引航图带上来了。'),
      line('That is the tug route. Follow the lights to the tide gate.', '这就是拖轮实际走的航线。沿工作灯往防潮闸走。'),
    ],
    tidegate: [
      line('Come in. The platform is still afloat. Take the side away from the swell.', '收到。平台还没沉。小艇要从背浪侧靠。'),
      line('Mara, clear the line. We have room to turn.', '玛拉，解开缆绳。外面有空间掉头。'),
    ],
    anchorage: [
      line('That is the last one. Keep him flat until we dock.', '最后一人上来了。靠岸前让他平躺。'),
      line('This was the second boat. Someone crossed it out after I signed.', '这是第二艘船。我签字以后，有人把它划掉了。'),
      line('Cold store dock is open. We have someone waiting with a stretcher.', '冷藏码头能靠。那里有人带着担架等我们。'),
    ],
    'return-harbor': [
      line('Sixteen. Wait. What is your name?', '十六。等一下，你叫什么？'),
      line('Seventeen. All confirmed.', '十七。全部确认。'),
      line('I told the first rescue boat to turn back. The call is on this tape. Keep it.', '第一艘搜救艇是我叫回来的。这盘带子录下了那次通话，留好。'),
    ],
    'night-record': [
      line('The last call is in the register. Check the number on the reel.', '最后一通电话在登记簿里。核对一下卷盘编号。'),
      line('Harris is at the outer harbor. The investigator is waiting at the pilot station.', '哈里斯在外港。调查员已经到了引航站。'),
    ],
    'last-pilot': [
      line('I signed the closure and the transfer. I knew they were still out there.', '封港和转移都是我签的。我知道他们当时还在外面。'),
      line('Put my recording with the others. I will sign the handover.', '我的录音和其他材料放在一起。我签交接。'),
      line('We have the originals. Berth Four can reopen at first light.', '原件收齐。四号泊位可以在天亮后开放。'),
    ],
    reopen: [
      line('Put the boots on the seat. He can get them when he comes home.', '工靴放在座位上吧。等他回家就能穿了。'),
      line('Berth Four, Control. I have all seventeen. You can take them home.', '四号泊位，指挥部收到。十七人全部确认。可以送他们回家了。'),
    ],
  });
  const forms = {
    berth: ['PORT AUTHORITY', 'EVACUATION RECEIPT', '05:31', 'SHIFT HANDOVER', '05:34'],
    drydock: ['SALTLINE PILOT SERVICE', 'TUG ROUTE', 'TIDE GATE', 'OUTER ROADS', 'SERVICE PLATFORM'],
    anchorage: ['FREIGHT ADDENDUM', 'FIRST BOAT · RELEASED', 'SECOND BOAT · CANCELLED', '17 CREW'],
    'return-harbor': ['DISPATCH REGISTER', 'RESCUE RECALL', 'WARD / ORIGINAL RECORDING'],
    'night-record': ['CALL REGISTER', 'NIGHT SHIFT', 'ORIGINAL REEL', 'REFERENCE 05:37'],
    'last-pilot': ['PORT INQUIRY', 'ORIGINAL RECORDS', 'RECEIPT 01 / AUDIO 04', 'SIGN ON TRANSFER'],
  };

  function createHandoffVisual(world, chapter, {glove,layer}) {
    const lines = forms[chapter];
    if (!lines && chapter !== 'reopen' && chapter !== 'rail' && chapter !== 'tidegate' && chapter !== 'descent') return null;
    const {Group,Mesh,MeshStandardMaterial,MeshBasicMaterial,PlaneGeometry,BoxGeometry,
      CanvasTexture,SRGBColorSpace,CylinderGeometry} = world.THREE;
    const root = new Group();
    root.name = 'chapter-handoff-' + chapter;
    const geometry = new Set(), materials = new Set(), textures = new Set();
    function add(parent, shape, material, x, y, z) {
      geometry.add(shape);
      const object = new Mesh(shape, material);
      object.position.set(x,y,z);
      object.frustumCulled = false;
      parent.add(object);
      return object;
    }
    function material(color, roughness=.77) {
      const finish = new MeshStandardMaterial({color, roughness});
      materials.add(finish);
      return finish;
    }
    function card(heading, contents) {
      const surface = document.createElement('canvas');
      surface.width = 512;
      surface.height = 336;
      const ctx = surface.getContext('2d');
      ctx.fillStyle = '#b6b39d';
      ctx.fillRect(0,0,512,336);
      ctx.fillStyle = '#75694f';
      ctx.fillRect(14,10,3,316);
      ctx.fillRect(30,77,450,2);
      ctx.font = '600 24px monospace';
      ctx.fillStyle = '#353831';
      ctx.fillText(heading,31,48);
      contents.forEach((text,index)=>{
        const row = 113+index*39;
        ctx.font = index%2 ? '700 28px monospace' : '500 23px monospace';
        ctx.fillText(text,32,row);
        ctx.fillStyle='#817963';
        ctx.fillRect(30,row+9,445,1);
        ctx.fillStyle='#33352e';
      });
      const texture = new CanvasTexture(surface);
      texture.colorSpace = SRGBColorSpace;
      textures.add(texture);
      const paper = new MeshBasicMaterial({map:texture,color:0xc0b59a});
      materials.add(paper);
      return paper;
    }
    const item = new Group();
    root.add(item);
    if (lines) {
      if (chapter === 'berth') {
        const lower = add(item,new PlaneGeometry(.167,.109),card(lines[0],lines.slice(3)),.022,-.017,-.012);
        lower.rotation.z=.14;
        const upper = add(item,new PlaneGeometry(.177,.116),card(lines[0],lines.slice(1,3)),-.024,.01,.001);
        upper.rotation.z=-.14;
      } else {
        add(item,new PlaneGeometry(.19,.125),card(lines[0],lines.slice(1)),0,0,0);
      }
    } else if (chapter === 'descent') {
      const ropeMat = material(0x2d322c, .92);
      const wrapMat = material(0xc48b35, .65);
      add(item, new CylinderGeometry(.024, .024, .62, 12), ropeMat, 0, .06, -.025);
      for (const ry of [-.14, -.02, .10, .22]) {
        add(item, new CylinderGeometry(.026, .026, .016, 12), wrapMat, 0, ry, -.025);
      }
    } else if(chapter === 'reopen') {
      const leather=material(0x3e3024),sole=material(0x22241f),lace=material(0x72715e);
      for(const x of [-.036,.036]){
        add(item,new BoxGeometry(.063,.024,.121),sole,x,-.045,.004).rotation.x=.35;
        add(item,new BoxGeometry(.059,.039,.104),leather,x,-.017,.003).rotation.x=.35;
        add(item,new BoxGeometry(.057,.056,.056),leather,x,.011,.031).rotation.x=.35;
        for(let index=0;index<3;index++)add(item,new BoxGeometry(.047,.003,.004),lace,x,-.003+index*.005,.001+index*.012);
      }
    } else {
      const finish=material(chapter==='rail'?0x575b4c:0x262d2e);
      add(item,new BoxGeometry(.19,.032,.014),finish,0,-.037,.016);
      if(chapter==='rail')add(item,new BoxGeometry(.165,.046,.026),material(0x756c58),0,-.013,.007);
    }
    if (glove) {
      const fabric=world.mats.get('glove_fabric',{triplanar:true,vertexColors:true,scale:3});
      for(const [side,mirror] of [[-1,true],[1,false]]){
        const model=glove({mirror,fingers:[[.9,1.4,.65,0],[.95,1.4,.65,0],[1.02,1.4,.65,0],[1.06,1.4,.65,0]],
          thumb:[[-.78,.06,-.6],[-.42,.1,-.9],[-.12,.02,-.99]],forearm:[.28,-.4,.85],sleeve:.21});
        const hand=add(root,model.fabric,fabric,side*(chapter==="descent"?.037:.092),-.055+
          (chapter==="descent"?side*.028:0),.065);
        hand.rotation.set(.27,-side*.38,side*.57);
      }
    }
    root.traverse(node=>node.layers.set(layer));
    root.visible=false;
    world.camera.add(root);
    return {
      update(time,duration) {
        const ease=x=>{const value=Math.min(1,Math.max(0,x));return value*value*(3-2*value)};
        const raise=chapter==='descent'?ease((time-.3)/.85)*(1-ease((time-(duration-.95))/.65)):
          ease((time-4)/1.7)*(1-ease((time-(duration-5))/1.2));
        root.visible=raise>.01;
        root.position.set(.035,-.20+.072*raise,-.33+.015*raise);
        root.rotation.set(-.18+(1-raise)*.4,.015,Math.sin(time*1.8)*.014);
        item.rotation.x=.09*Math.sin(time*.8);
      },
      dispose() {
        root.removeFromParent();
        geometry.forEach(value=>value.dispose());
        materials.forEach(value=>value.dispose());
        textures.forEach(value=>value.dispose());
      },
    };
  }

  // High-precision CSGO-style tactical human builder (lofted anatomy, 5-finger gloved hands,
  // ripstop PBR fabric textures, plate carriers, helmets/comms, and natural articulated poses).
  const clothCache = new Map();
  function createTacticalCloth(THREE, hex, roughness = .84, metalness = .06, weaveScale = 4) {
    const key = `${hex}_${roughness}_${metalness}_${weaveScale}`;
    if (clothCache.has(key)) return clothCache.get(key);
    const size = 128;
    const color = new Uint8Array(size * size * 4);
    const bump = new Uint8Array(size * size * 4);
    const base = new THREE.Color(hex);
    const r0 = Math.round(base.r * 255), g0 = Math.round(base.g * 255), b0 = Math.round(base.b * 255);
    let seed = (hex ^ 0x9e3779b9) >>> 0;
    for (let y = 0; y < size; y++) {
      const gridY = y % 8 === 0;
      for (let x = 0; x < size; x++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const n = ((seed >>> 24) / 255 - .5) * 14;
        const gridX = x % 8 === 0;
        const weave = ((x + y) % 2 === 0 ? 5 : -5) + (gridX || gridY ? -9 : 0);
        const crease = Math.sin(x * .14 + Math.cos(y * .09) * 1.4) * 7;
        const d = n + weave * .6 + crease;
        const idx = (y * size + x) * 4;
        color[idx] = Math.max(0, Math.min(255, r0 + d));
        color[idx + 1] = Math.max(0, Math.min(255, g0 + d));
        color[idx + 2] = Math.max(0, Math.min(255, b0 + d));
        color[idx + 3] = 255;
        bump[idx] = Math.max(0, Math.min(255, 128 + weave * 5 + crease * 3));
        bump[idx + 1] = Math.max(80, Math.min(248, Math.round(roughness * 255 - weave * 2 + n)));
        bump[idx + 2] = 255;
        bump[idx + 3] = 255;
      }
    }
    const makeTex = (buf, cs) => {
      const t = new THREE.DataTexture(buf, size, size);
      t.colorSpace = cs;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(weaveScale, weaveScale);
      t.magFilter = THREE.LinearFilter;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.generateMipmaps = true;
      t.needsUpdate = true;
      return t;
    };
    const map = makeTex(color, THREE.SRGBColorSpace);
    const bumpMap = makeTex(bump, THREE.NoColorSpace);
    const mat = new THREE.MeshStandardMaterial({
      map, bumpMap, roughnessMap: bumpMap, bumpScale: .007, roughness: 1, metalness,
    });
    clothCache.set(key, mat);
    return mat;
  }

  function loftOrganic(THREE, rings, segs = 28) {
    // Smooth Catmull-Rom ring subdivision for organic CS:GO-style rounded anatomy
    const smoothRings = [];
    for (let i = 0; i < rings.length - 1; i++) {
      const p0 = rings[Math.max(0, i - 1)];
      const p1 = rings[i];
      const p2 = rings[i + 1];
      const p3 = rings[Math.min(rings.length - 1, i + 2)];
      const steps = 2;
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const t2 = t * t, t3 = t2 * t;
        const interp = k => {
          const v0 = p0[k] ?? 0, v1 = p1[k] ?? 0, v2 = p2[k] ?? 0, v3 = p3[k] ?? 0;
          return .5 * ((2 * v1) + (-v0 + v2) * t + (2 * v0 - 5 * v1 + 4 * v2 - v3) * t2 + (-v0 + 3 * v1 - 3 * v2 + v3) * t3);
        };
        smoothRings.push([
          interp(0),
          Math.max(.003, interp(1)),
          Math.max(.003, interp(2)),
          interp(3),
          interp(4),
        ]);
      }
    }
    smoothRings.push(rings[rings.length - 1]);

    const verts = [], uvs = [], idx = [];
    const cols = segs + 1;
    for (let r = 0; r < smoothRings.length; r++) {
      const [y, rx, rz, ox = 0, oz = 0] = smoothRings[r];
      const v = r / (smoothRings.length - 1);
      for (let i = 0; i <= segs; i++) {
        const u = i / segs;
        const a = u * Math.PI * 2;
        verts.push(ox + Math.cos(a) * rx, y, oz + Math.sin(a) * rz);
        uvs.push(u, v);
      }
    }
    for (let r = 0; r < smoothRings.length - 1; r++) {
      for (let i = 0; i < segs; i++) {
        const a = r * cols + i, b = a + 1, c = a + cols, d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  }

  function createSaltlineHuman(THREE, {
    name = 'saltline-human',
    role = 'operator',
    coat = null,
    variation = 0,
  } = {}) {
    const { Group, Mesh, CylinderGeometry, SphereGeometry, CapsuleGeometry, TorusGeometry, MeshStandardMaterial } = THREE;
    const actor = new Group();
    actor.name = name;

    const palette = {
      pilot: { jacket: 0x3b4941, pants: 0x2f3934, vest: 0xc95524, helmet: 0x2a3331, trim: 0xe3d7b0 },
      operator: { jacket: 0x354249, pants: 0x293035, vest: 0x2c3533, helmet: 0x242c2e, trim: 0x8ea09c },
      engineer: { jacket: coat ?? 0x8f6237, pants: 0x2c3338, vest: 0x364044, helmet: 0x2e363a, trim: 0xdfd8bc },
      medic: { jacket: coat ?? 0x3d6d6b, pants: 0x273236, vest: 0x2c3c3e, helmet: 0xd8dcd8, trim: 0xe8e4d8 },
      worker: { jacket: coat ?? 0xc26c30, pants: 0x2a3136, vest: 0x383e40, helmet: 0xd99226, trim: 0xe4dcc0 },
    }[role] ?? { jacket: coat ?? 0x455258, pants: 0x2a3136, vest: 0x323836, helmet: 0x2a3134, trim: 0xdfd8bc };

    const jacketMat = createTacticalCloth(THREE, coat ?? palette.jacket, .82, .05, 4);
    const pantsMat = createTacticalCloth(THREE, palette.pants, .86, .04, 4);
    const vestMat = createTacticalCloth(THREE, palette.vest, .74, .08, 5);
    const gearMat = new MeshStandardMaterial({ color: 0x222629, roughness: .52, metalness: .30 });
    const metalMat = new MeshStandardMaterial({ color: 0x626b6e, roughness: .34, metalness: .76 });
    const bootMat = new MeshStandardMaterial({ color: 0x1c1f20, roughness: .62, metalness: .20 });
    const gloveMat = createTacticalCloth(THREE, 0x262a28, .76, .10, 6);
    const reflectorMat = new MeshStandardMaterial({ color: palette.trim, roughness: .28, metalness: .26 });
    const skinTone = [0xbe8d70, 0x93664c, 0xcda084][variation % 3];
    const skinMat = new MeshStandardMaterial({ color: skinTone, roughness: .66, metalness: .02 });
    const helmetMat = new MeshStandardMaterial({ color: palette.helmet, roughness: .32, metalness: .26 });
    const visorMat = new MeshStandardMaterial({ color: 0x0d1a24, roughness: .08, metalness: .92 });
    const hairMat = new MeshStandardMaterial({ color: [0x26201c, 0x1c1816, 0x3b2d23][variation % 3], roughness: .86 });

    const add = (parent, geo, mat, x = 0, y = 0, z = 0) => {
      const m = new Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      parent.add(m);
      return m;
    };
    const sphGeo = new SphereGeometry(1, 24, 18);
    const cylGeo = new CylinderGeometry(1, 1, 1, 20);
    const capGeo = CapsuleGeometry ? new CapsuleGeometry(.5, 1, 10, 18) : new SphereGeometry(.5, 18, 14);
    const rounded = (p, mat, sx, sy, sz, x, y, z) => {
      const m = add(p, capGeo, mat, x, y, z);
      m.scale.set(sx, sy, sz);
      return m;
    };

    // 1.80m realistic athletic CS:GO-style human proportions (pelvis at y=0.95m, shoulder at y=1.47m, head top at 1.80m)
    const torso = new Group();
    torso.name = 'human-torso';
    torso.position.set(0, .95, 0);
    actor.add(torso);

    // Smoothly lofted anatomical pelvis + tapered waist + chest + rounded trapezius/collar
    add(torso, loftOrganic(THREE, [
      [-.09, .142, .108, 0, -.002],
      [.01, .156, .118, 0, .004],
      [.14, .142, .108, 0, .006],
      [.28, .168, .124, 0, .014],
      [.41, .196, .132, 0, .012],
      [.50, .182, .116, 0, .005],
      [.55, .118, .092, 0, .006],
      [.58, .074, .072, 0, .006],
    ], 28), jacketMat);

    // Contoured rounded tactical plate carrier / SAR rescue vest
    add(torso, loftOrganic(THREE, [
      [.13, .160, .124, 0, .010],
      [.24, .178, .140, 0, .018],
      [.38, .184, .138, 0, .016],
      [.48, .154, .118, 0, .010],
      [.52, .115, .095, 0, .006],
    ], 26), vestMat);

    // Smooth rounded tactical belt (Torus) & metallic buckle
    if (TorusGeometry) {
      const belt = add(torso, new TorusGeometry(.148, .026, 12, 28), gearMat, 0, .08, .004);
      belt.rotation.x = Math.PI / 2;
      belt.scale.set(1.08, .84, 1);
    }
    rounded(torso, metalMat, .054, .024, .024, 0, .08, .134);

    // Rounded capsule MOLLE utility/mag pouches & reflective rescue trim
    for (const px of [-.086, 0, .086]) {
      rounded(torso, gearMat, .064, .065, .042, px, .22, .148);
      rounded(torso, vestMat, .058, .018, .045, px, .272, .150);
    }
    if (TorusGeometry) {
      for (const ry of [.33, .42]) {
        const band = add(torso, new TorusGeometry(.158, .011, 8, 28), reflectorMat, 0, ry, .015);
        band.rotation.x = Math.PI / 2;
        band.scale.set(1.08, .84, 1);
      }
    }
    // Rounded ergonomic trauma/survival backpack
    rounded(torso, gearMat, .22, .18, .11, 0, .34, -.162);
    rounded(torso, reflectorMat, .16, .014, .016, 0, .38, -.215);
    // Curved shoulder comms radio + flexible whip antenna
    rounded(torso, gearMat, .048, .058, .036, -.112, .41, .144);
    const ant = add(torso, cylGeo, metalMat, -.124, .55, .144);
    ant.scale.set(.0045, .20, .0045);
    // Rounded shoulder pads / harness straps
    for (const s of [-1, 1]) {
      const strap = rounded(torso, gearMat, .048, .092, .028, s * .116, .505, .012);
      strap.rotation.x = Math.PI / 2;
    }

    // Smooth neck + tactical collar/balaclava
    const neck = add(torso, cylGeo, role === 'operator' ? gearMat : skinMat, 0, .60, .008);
    neck.scale.set(.056, .11, .058);

    const head = new Group();
    head.name = 'human-head';
    head.position.set(0, .71, .012);
    torso.add(head);

    // High-segment organic sculpted cranium + smooth jawline + chin
    add(head, loftOrganic(THREE, [
      [-.102, .044, .052, 0, .020],
      [-.070, .068, .082, 0, .018],
      [-.022, .084, .098, 0, .010],
      [.032, .088, .102, 0, .004],
      [.082, .080, .094, 0, -.002],
      [.118, .048, .058, 0, -.004],
      [.130, .010, .012, 0, -.004],
    ], 28), skinMat);
    // Rounded nose, brows, eyes & ears
    const nose = add(head, sphGeo, skinMat, 0, -.006, .098);
    nose.scale.set(.016, .025, .022);
    for (const s of [-1, 1]) {
      rounded(head, hairMat, .026, .006, .012, s * .031, .026, .096).rotation.z = Math.PI / 2;
      const eye = add(head, sphGeo, gearMat, s * .031, .013, .094);
      eye.scale.set(.011, .008, .009);
      const ear = add(head, sphGeo, skinMat, s * .086, .002, -.004);
      ear.scale.set(.014, .028, .018);
    }
    if (role === 'pilot' || role === 'operator') {
      // Smooth rounded ballistic / HGU flight helmet + curved wrap visor + Peltor headset
      const shell = add(head, sphGeo, helmetMat, 0, .044, -.006);
      shell.scale.set(.106, .100, .116);
      if (role === 'pilot') {
        const brow = add(head, sphGeo, gearMat, 0, .072, .042);
        brow.scale.set(.094, .034, .084);
        const visor = add(head, sphGeo, visorMat, 0, .024, .024);
        visor.scale.set(.100, .046, .100);
        const mic = rounded(head, gearMat, .012, .038, .012, .046, -.054, .102);
        mic.rotation.set(0, -.35, Math.PI / 2);
      } else {
        // CS:GO CT FAST helmet + rounded tactical goggles + balaclava gaiter
        rounded(head, metalMat, .044, .032, .022, 0, .078, .110);
        const goggle = add(head, sphGeo, visorMat, 0, .020, .032);
        goggle.scale.set(.092, .034, .082);
        const gaiter = add(head, sphGeo, gearMat, 0, -.058, .012);
        gaiter.scale.set(.084, .064, .092);
      }
      for (const s of [-1, 1]) {
        const earcup = add(head, sphGeo, gearMat, s * .106, -.004, -.004);
        earcup.scale.set(.024, .040, .036);
      }
    } else {
      // Smooth hair + rounded harbor hard-hat / peaked cap
      const hair = add(head, sphGeo, hairMat, 0, .048, -.008);
      hair.scale.set(.092, .078, .104);
      const hat = add(head, sphGeo, helmetMat, 0, .072, -.004);
      hat.scale.set(.104, .066, .112);
      const brim = add(head, sphGeo, helmetMat, 0, .052, .078);
      brim.scale.set(.086, .012, .064);
    }

    // Smooth 5-finger CS:GO-style tactical gloved hand (100% rounded capsules & spheres)
    function buildGlovedHand(parent, sign) {
      const hand = new Group();
      hand.name = 'tactical-hand';
      hand.position.set(0, -.265, 0);
      parent.add(hand);
      const cuff = add(hand, cylGeo, gearMat, 0, .018, 0);
      cuff.scale.set(.042, .036, .038);
      const palm = add(hand, sphGeo, gloveMat, 0, -.042, .006);
      palm.scale.set(.040, .048, .022);
      const knuckle = rounded(hand, gearMat, .014, .042, .014, 0, -.072, -.008);
      knuckle.rotation.z = Math.PI / 2;
      for (let f = 0; f < 4; f++) {
        const fx = (f - 1.5) * .018 * sign;
        const len = f === 1 || f === 2 ? .034 : f === 0 ? .030 : .025;
        const finger = rounded(hand, gloveMat, .016, len, .016, fx, -.084 - len * .55, .014);
        finger.rotation.x = .38;
      }
      const thumb = rounded(hand, gloveMat, .018, .028, .018, -sign * .040, -.048, .022);
      thumb.rotation.set(.42, 0, sign * .55);
      return hand;
    }

    // Articulated smoothly lofted arms & legs with rounded joints, knee pads & combat boots
    const limbs = [-1, 1].map(sign => {
      const shoulder = new Group();
      shoulder.name = 'human-shoulder';
      shoulder.position.set(sign * .218, .49, .004);
      torso.add(shoulder);
      const delt = add(shoulder, sphGeo, jacketMat, 0, -.01, 0);
      delt.scale.set(.072, .076, .072);
      add(shoulder, loftOrganic(THREE, [
        [0, .064, .064], [-.10, .058, .060], [-.20, .052, .054], [-.29, .048, .048],
      ], 20), jacketMat);
      const patch = add(shoulder, sphGeo, reflectorMat, sign * .061, -.08, 0);
      patch.scale.set(.008, .026, .032);

      const elbow = new Group();
      elbow.name = 'human-elbow';
      elbow.position.set(0, -.29, 0);
      shoulder.add(elbow);
      const elbowJoint = add(elbow, sphGeo, jacketMat, 0, 0, 0);
      elbowJoint.scale.set(.050, .050, .050);
      add(elbow, loftOrganic(THREE, [
        [0, .048, .048], [-.08, .046, .046], [-.18, .040, .040], [-.26, .036, .035],
      ], 20), jacketMat);
      buildGlovedHand(elbow, sign);

      const hip = new Group();
      hip.name = 'human-hip';
      hip.position.set(sign * .096, .95, 0);
      actor.add(hip);
      const hipJoint = add(hip, sphGeo, pantsMat, 0, 0, 0);
      hipJoint.scale.set(.090, .086, .090);
      add(hip, loftOrganic(THREE, [
        [0, .090, .092], [-.14, .084, .086], [-.30, .072, .074], [-.44, .064, .066],
      ], 22), pantsMat);
      rounded(hip, sign > 0 ? gearMat : pantsMat, .028, .075, .058, sign * .082, -.20, .01);

      const knee = new Group();
      knee.name = 'human-knee';
      knee.position.set(0, -.44, 0);
      hip.add(knee);
      const pad = add(knee, sphGeo, gearMat, 0, -.01, .048);
      pad.scale.set(.058, .068, .038);
      if (TorusGeometry) {
        const strap = add(knee, new TorusGeometry(.064, .012, 8, 22), gearMat, 0, -.01, 0);
        strap.rotation.x = Math.PI / 2;
      }
      add(knee, loftOrganic(THREE, [
        [0, .064, .066], [-.12, .068, .070], [-.28, .054, .056], [-.40, .050, .052],
      ], 22), pantsMat);
      const bootShaft = add(knee, cylGeo, bootMat, 0, -.39, .004);
      bootShaft.scale.set(.056, .14, .062);
      const foot = rounded(knee, bootMat, .100, .112, .078, 0, -.458, .056);
      foot.rotation.x = Math.PI / 2;
      const sole = rounded(knee, gearMat, .106, .122, .028, 0, -.496, .056);
      sole.rotation.x = Math.PI / 2;

      return { shoulder, elbow, hip, knee, sign };
    });

    function pose(mode = 'stand', stride = 0, age = 0, moving = false) {
      const crouched = mode === 'crouch';
      const seated = mode === 'seated';
      const parachute = mode === 'parachute';
      torso.position.y = crouched ? .65 : seated ? .66 : parachute ? .95 : .95 + Math.abs(Math.sin(stride)) * .022;
      torso.rotation.set(
        crouched ? .18 : seated ? .08 : parachute ? .06 : .03,
        moving ? Math.sin(stride) * .045 : 0,
        crouched ? -.04 : Math.sin(age * 1.7) * .01,
      );
      head.rotation.set(
        crouched ? -.14 : parachute ? -.25 : -.03,
        Math.sin(age * .8) * .15,
        0,
      );
      limbs.forEach(({ shoulder, elbow, hip, knee, sign }, index) => {
        const swing = moving ? Math.sin(stride + index * Math.PI) : 0;
        if (parachute) {
          shoulder.rotation.set(-2.35, 0, sign * .28);
          elbow.rotation.set(-.55, 0, 0);
          hip.position.y = .95;
          hip.rotation.set(-.32, 0, sign * .06);
          knee.rotation.set(.58, 0, 0);
        } else {
          shoulder.rotation.set(
            crouched ? (index === 0 ? -.44 : -.62) : seated ? -.52 : swing * .34 - .05,
            0,
            sign * .07,
          );
          elbow.rotation.set(
            crouched ? -.78 : seated ? -.72 : -.18 - Math.max(swing, 0) * .24,
            0,
            0,
          );
          hip.position.y = crouched ? .65 : seated ? .66 : .95;
          hip.rotation.set(
            crouched ? (index === 0 ? -1.18 : -.45) : seated ? -1.35 : -swing * .44,
            0,
            0,
          );
          knee.rotation.set(
            crouched ? (index === 0 ? 1.48 : 1.25) : seated ? 1.38 : Math.max(swing, 0) * .72,
            0,
            0,
          );
        }
      });
    }

    pose('stand', 0, 0, false);
    return { actor, torso, head, limbs, pose };
  }

  window.SaltlineHandoffs = handoffs;
  window.createSaltlineHandoffVisual = createHandoffVisual;
  window.createSaltlineHuman = createSaltlineHuman;
})();
