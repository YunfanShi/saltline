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
    if (!lines && chapter !== 'reopen' && chapter !== 'rail' && chapter !== 'tidegate') return null;
    const {Group,Mesh,MeshStandardMaterial,MeshBasicMaterial,PlaneGeometry,BoxGeometry,
      CanvasTexture,SRGBColorSpace} = world.THREE;
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
        const hand=add(root,model.fabric,fabric,side*.092,-.055,.065);
        hand.rotation.set(.27,-side*.38,side*.57);
      }
    }
    root.traverse(node=>node.layers.set(layer));
    root.visible=false;
    world.camera.add(root);
    return {
      update(time,duration) {
        const ease=x=>{const value=Math.min(1,Math.max(0,x));return value*value*(3-2*value)};
        const raise=ease((time-4)/1.7)*(1-ease((time-(duration-5))/1.2));
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

  window.SaltlineHandoffs = handoffs;
  window.createSaltlineHandoffVisual = createHandoffVisual;
})();
