/* SALTLINE — Product-Grade Single-Player Campaign Core (14 Independent Chapters, 6 Active Characters,
 * Non-Repeating Chapter × Gameplay Matrix, Multi-Slot Saves, Difficulty Scaling, Dynamic Chapter Set-Pieces).
 * Story: 《盐线危机》(Saltline Crisis) — A cascading coastal infrastructure crisis across 14 distinct chapters. */
(() => {
  'use strict';

  const STORAGE_SLOTS_KEY = 'saltline.campaign.v2.slots';
  const STORAGE_ACCESS_KEY = 'saltline.campaign.v2.accessibility';
  const STORAGE_ACTIVE_SLOT_KEY = 'saltline.campaign.v2.activeSlot';

  // =========================================================================
  // 1. SIX MAJOR CHARACTERS WITH DISTINCT IDENTITIES, ARCS, STYLES & BEHAVIORS
  // =========================================================================
  const SALTLINE_CHARACTERS = Object.freeze([
    {
      id: 'lin',
      nameEn: 'Lin', nameZh: '林恩',
      roleEn: 'Emergency Response Specialist', roleZh: '城市应急行动队年轻成员',
      modelType: 'specops_male', armed: true, coat: 0x2c5c75,
      personalityZh: '专注、观察力敏锐、有责任感；从机械执行调度命令，逐步成长为敢于质疑并独立作出艰难判断的现场核心。',
      personalityEn: 'Observant and principled; evolves from following dispatch orders into making independent crisis decisions.',
      goalZh: '在通讯断绝与基础设施连锁崩溃中，找到失联人员、查清事故根源并守住城市底线。',
      relationToProtagonistZh: '主角本人（玩家视角）。',
      speechStyleZh: '简短直接、偏向现场确认与追问实质，不绕弯子。',
      signatureTraitZh: '始终随身携带应急手电与手写现场折页，习惯先确认人数再汇报。',
      arcZh: '序章听从指挥 → 中段发现隐瞒真相 → 终章在全城尺度下作出关乎未来的关键抉择。',
    },
    {
      id: 'mara',
      nameEn: 'Mara', nameZh: '玛拉',
      roleEn: 'Senior Port & Grid Infrastructure Engineer', roleZh: '港口与市政基础设施资深工程师',
      modelType: 'specops_female', armed: true, coat: 0x3b7a78,
      personalityZh: '冷静务实、技术过硬、对隐患零容忍；在高压现场总能把复杂工程故障拆解成可执行的步骤。',
      personalityEn: 'Pragmatic, technically sharp, zero tolerance for negligence; turns complex grid failures into actionable steps.',
      goalZh: '阻止海底沉降引发的港口、电网与地下管廊连锁坍塌，并公开被压下三年的工程预警报告。',
      relationToProtagonistZh: '林恩最信任的现场搭档与技术导师，几乎全程并肩行动。',
      speechStyleZh: '精准、带工程直觉但通俗易懂，关键时刻会用一针见血的比喻提醒林恩。',
      signatureTraitZh: '橙白反光工程背心与挂在胸前的防水平板，总在操作控制台前先敲两下外壳。',
      arcZh: '最初只想保住设备与工人 → 目睹系统性隐瞒后坚持公开真相 → 终章主导城市基础设施重建。',
    },
    {
      id: 'harris',
      nameEn: 'Harris', nameZh: '哈里斯',
      roleEn: 'Former Chief Municipal Engineer', roleZh: '前市政总工程师（核心知情者）',
      modelType: 'civilian_male', armed: false, coat: 0x6b5a48,
      personalityZh: '内敛、背负愧疚、极度谨慎；当年因妥协签下延期维修方案而引咎辞职，如今决心用行动赎罪。',
      personalityEn: 'Guilt-ridden yet resolute former chief engineer who knows the buried truth behind the infrastructure failure.',
      goalZh: '交出原始地质沉降监测数据，在地下管廊与外海平台彻底失控前补救当年的错误。',
      relationToProtagonistZh: '起初被怀疑与事故有关，随着同行调查逐渐成为林恩揭露真相的关键盟友。',
      speechStyleZh: '语速偏慢、措辞克制，常用“我当年签字的时候……”开场，关键数据记得一清二楚。',
      signatureTraitZh: '褪色的深棕防水工装外套与一套老式机械阀门扳手，熟悉全城所有老旧地下管井。',
      arcZh: '逃避与沉默 → 在铁路与地下设施中挺身协助 → 公开作证承担历史责任。',
    },
    {
      id: 'ward',
      nameEn: 'Ward', nameZh: '沃德',
      roleEn: 'Director of Emergency Operations', roleZh: '盐线市应急行动总负责人',
      modelType: 'commander', armed: true, coat: 0x2d3a45,
      personalityZh: '强硬、习惯从全局与次生灾害风险做冷酷权衡；并非纯粹反派，而是被困在安全、资源与政治压力间的指挥官。',
      personalityEn: 'Stern operations commander balancing public safety, scarce resources, and institutional pressure.',
      goalZh: '在有限救援力量下尽量压低伤亡、维持城市秩序，防止恐慌引发更大规模的踩踏与断电。',
      relationToProtagonistZh: '林恩的直属上司；与林恩在“稳定优先”还是“彻底公开与冒险救援”上多次正面交锋。',
      speechStyleZh: '权威、克制、高频使用时间窗口与资源配比，极少流露私人情绪。',
      signatureTraitZh: '深灰指挥风衣与随时响起的双频加密电台，说话时习惯背手看地图。',
      arcZh: '坚持封控与保密 → 在外海平台与黑暗城区危机中被现实震撼 → 终章与林恩达成艰难和解并支持真相公开。',
    },
    {
      id: 'chen',
      nameEn: 'Chen', nameZh: '陈明',
      roleEn: 'Rail & Transit Operations Chief', roleZh: '西区铁路与城市交通调度主管',
      modelType: 'worker_male', armed: false, coat: 0x8a5b32,
      personalityZh: '经验老到、嘴硬心软、在混乱中自带冷幽默；把每一列火车和每一位乘客都当成自己的责任。',
      personalityEn: 'Veteran rail dispatcher with dry humor who treats every train and commuter as his personal charge.',
      goalZh: '疏通断裂的铁路与高架撤离走廊，把滞留乘客与救援物资送出危险区。',
      relationToProtagonistZh: '第三、四章起加入协作的可靠前辈，为林恩提供交通改道、列车操控与重型物资支援。',
      speechStyleZh: '接地气、节奏明快，爱拿老旧信号灯和市政预算开玩笑。',
      signatureTraitZh: '黄色高能见度铁路马甲和挂在腰间的老式铜哨，总能在混乱现场吼出秩序。',
      arcZh: '坚守铁路枢纽 → 协助打通全城疏散动脉 → 危机后主持重建盐线城际快线。',
    },
    {
      id: 'linwan',
      nameEn: 'Lin Wan', nameZh: '林婉',
      roleEn: 'Lead Field Medic & Evacuation Coordinator', roleZh: '前线医疗与市民疏散协调官',
      modelType: 'medic_female', armed: false, coat: 0x457c79,
      personalityZh: '温柔却极其果断、面对危重伤员和恐慌人群从不退缩；代表普通盐线市民最直接的生命诉求。',
      personalityEn: 'Compassionate yet decisive field medic who represents the human stakes of every crisis choice.',
      goalZh: '维持停电与洪峰中的临时诊所运作，确保船坞、外海平台与夜城居民全部安全转移。',
      relationToProtagonistZh: '在城区与船坞危机中与林恩建立深厚信任，是林恩做出人道抉择的重要声音。',
      speechStyleZh: '清晰安抚、直指人命与现实需求，能在三句话内稳住恐慌的市民。',
      signatureTraitZh: '青白救援医疗外套与肩头的便携式脉冲分诊灯，随时记住每位被救者的名字。',
      arcZh: '独自支撑临时救护站 → 随林恩登上外海平台参与大撤离 → 终章见证新清晨下的社区重生。',
    },
  ]);

  // =========================================================================
  // 2. DIFFICULTY PRESETS (Not just numbers — affects hints, checkpoints,
  //    tolerance, and environmental hazard intensity)
  // =========================================================================
  const DIFFICULTY_PRESETS = Object.freeze({
    story: {
      id: 'story', nameEn: 'Story Focus', nameZh: '剧情体验',
      descEn: 'Frequent guidance prompts, generous checkpoints, forgiving puzzle windows, moderate hazards.',
      descZh: '高频方向与操作提示、密集自动检查点、宽容的解谜与救援时间窗、温和的环境灾害强度。',
      hintIntervalSec: 12,
      checkpointEveryStage: true,
      hazardMultiplier: 0.65,
      puzzleTolerance: 1.35,
      enemyDamageMul: 0.7,
    },
    tactical: {
      id: 'tactical', nameEn: 'Standard Crisis', nameZh: '标准危机',
      descEn: 'Balanced field prompts, chapter-phase checkpoints, authentic weather & water hazards.',
      descZh: '适中的现场指引、关键阶段检查点、真实水位与风暴挑战，推荐首次完整游玩。',
      hintIntervalSec: 26,
      checkpointEveryStage: true,
      hazardMultiplier: 1.0,
      puzzleTolerance: 1.0,
      enemyDamageMul: 1.0,
    },
    crisis: {
      id: 'crisis', nameEn: 'Extreme Emergency', nameZh: '极限应急',
      descEn: 'Minimal HUD hints, stricter checkpoints, faster rising water & storm gusts, tight rescue margins.',
      descZh: '精简提示频率、仅在主要节点存档、更快的涨水与风暴压迫、更紧凑的救援与设施修复容错。',
      hintIntervalSec: 55,
      checkpointEveryStage: false,
      hazardMultiplier: 1.4,
      puzzleTolerance: 0.78,
      enemyDamageMul: 1.35,
    },
  });

  // =========================================================================
  // 3. COMPLETE 14-CHAPTER CAMPAIGN WITH STRICT CHAPTER × GAMEPLAY MATRIX
  //    Target Playtime: 295 minutes (~4.9 hours, squarely within 4-6h goal)
  //    Strict Rule: NO consecutive chapters share the same primaryGameplay!
  // =========================================================================
  const SALTLINE_CHAPTERS = Object.freeze([
    {
      id: 'ch01', number: 1,
      titleEn: 'Chapter 01 — The Last Normal Day',
      titleZh: '第一章 · 最后一个正常的早晨',
      shortZh: '最后一个正常的早晨',
      estMinutes: 18,
      primaryGameplay: 'city_exploration',
      secondaryGameplay: 'character_interaction',
      gameplayTagsZh: ['城市生活探索', '角色互动', '自然操作教学'],
      locationZh: '盐线现代沿海城区 · 公共交通站 · 应急行动总部',
      locationEn: 'Coastal City Center · Transit Station · Emergency HQ',
      art: './art/v2-street.jpg',
      skyPreset: 1, weather: 'clear_morning',
      landmarkZh: '晨光中的沿海钟楼广场与警务应急总部',
      spawn: [-26, 0.25, -42],
      scenePreset: 'morning_city',
      characters: ['lin', 'mara', 'ward'],
      transitionZh: '07:40，盐线市像往常一样苏醒。你在上班途中顺路巡查滨海广场，却注意到地底传来的低频震动与交通信号灯的异常闪烁。',
      transitionEn: '07:40 AM. Saltline wakes as usual, until subtle ground tremors and flickering transit signals hint that something beneath the city is failing.',
      descriptionZh: '在正常的沿海城市早晨熟悉操作，与玛拉、沃德及通勤市民交谈，观察广场与车站的异常征兆，亲历第一次全城大停电与交通中断。',
      descriptionEn: 'Experience normal morning life in Saltline, meet Mara and Ward, inspect subtle anomalies at the transit hub, and witness the first citywide blackout.',
      objectives: [
        { id: 'c1_walk', titleZh: '沿沿海大道步行至应急总部，途中观察广场异常震动', optionalZh: '与广场通勤市民交流（0/2）', target: [-16, 0.25, -55], action: 'reach_and_talk' },
        { id: 'c1_brief', titleZh: '进入应急总部与玛拉、沃德汇合，领取现场应急装备', optionalZh: '测试手电与无线电频道', target: [-8, 0.25, -56], action: 'dialogue' },
        { id: 'c1_blackout', titleZh: '赶往公交总站协助突发停电后的市民疏散，目击港区电网崩溃', optionalZh: '安抚滞留乘客', target: [-26, 0.25, -84], action: 'event_trigger' },
      ],
      cutscene: {
        tag: 'CHAPTER 01 · 序章',
        lines: [
          { at: 0.4, speaker: '玛拉', tone: 'ally', line: '林恩，你也感觉到了吧？刚才那下不是货轮靠泊，是滨海变电站主母线的共振。' },
          { at: 4.5, speaker: '沃德', tone: 'ally', line: '刚接到报告，四号泊位全区失联。先别对外发布警报，你们俩立刻下港核实情况。' },
        ],
      },
      recapZh: '一个原本平静的清晨被突如其来的地下震动与停电打破。你与工程师玛拉在应急负责人沃德的派遣下，前往彻底失联的四号泊位查明原因。',
    },
    {
      id: 'ch02', number: 2,
      titleEn: 'Chapter 02 — The Silent Harbor',
      titleZh: '第二章 · 沉默的港口',
      shortZh: '沉默的港口',
      estMinutes: 22,
      primaryGameplay: 'story_investigation',
      secondaryGameplay: 'facility_repair',
      gameplayTagsZh: ['港口现场调查', '角色陪同勘察', '设施检修'],
      locationZh: '四号泊位大型港区 · 港务大楼 · 仓库与海岸道路',
      locationEn: 'Expanded Berth 4 · Harbor Authority · Warehouses',
      art: './art/v2-coastline.jpg',
      skyPreset: 0, weather: 'overcast_mist',
      landmarkZh: '四号泊位双层港务指挥楼与停摆的巨型岸桥',
      spawn: [-26, 0.25, -24],
      scenePreset: 'silent_harbor',
      characters: ['lin', 'mara', 'harris'],
      transitionZh: '港口陷入诡异的死寂：龙门吊悬在半空，广播全部静默。玛拉陪你深入四号泊位，寻找失联的值班人员与事故真相。',
      transitionEn: 'Berth 4 stands eerily silent with cranes frozen mid-lift. Mara joins you to locate missing dock staff and trace the outage.',
      descriptionZh: '与玛拉共同勘察扩建后的四号泊位与港务大楼，重启备用照明，在仓库区遇见前总工哈里斯，发现停电并非偶然，并亲历码头岸桥滑移事故。',
      descriptionEn: 'Investigate the expanded Berth 4 docks alongside Mara, restore backup power, encounter former chief engineer Harris, and survive a gantry shift.',
      objectives: [
        { id: 'c2_dock', titleZh: '与玛拉一起检查停摆的岸桥配电箱，恢复泊位应急照明', optionalZh: '查看岸边被遗弃的救援艇', target: [-4, 0.25, -8], action: 'repair' },
        { id: 'c2_harris', titleZh: '进入港务大楼二层控制室，与现身的前总工哈里斯对质', optionalZh: '检查码头沉降监测仪', target: [-45, 3.85, -20], action: 'dialogue' },
        { id: 'c2_event', titleZh: '泊位东侧发生地基滑移！掩护哈里斯与玛拉撤离塌陷区', optionalZh: '关闭主油管紧急截断阀', target: [14, 0.25, 10], action: 'escape_event' },
      ],
      cutscene: {
        tag: 'CHAPTER 02 · 沉默的港口',
        lines: [
          { at: 0.4, speaker: '哈里斯', tone: 'ally', line: '别再查线路短路了！三年前我就警告过他们——盐线东岸的海底软土层正在下沉。' },
          { at: 4.8, speaker: '玛拉', tone: 'ally', line: '整座泊位都在往东海倾斜！先撤回城区主干道，必须立刻通知交通和铁路系统停运！' },
        ],
      },
      recapZh: '在失联的四号泊位，你与玛拉遇到了前总工哈里斯。他揭露事故源头是隐瞒多年的海底地基沉降，随即码头发生剧烈滑移，你们被迫撤回城区。',
    },
    {
      id: 'ch03', number: 3,
      titleEn: 'Chapter 03 — Across the City',
      titleZh: '第三章 · 穿越城市',
      shortZh: '穿越城市',
      estMinutes: 22,
      primaryGameplay: 'driving',
      secondaryGameplay: 'traffic_event',
      gameplayTagsZh: ['城市驾驶', '动态交通改道', '市民交流'],
      locationZh: '商业中心 · 住宅区 · 高架道路 · 城市广场',
      locationEn: 'Downtown Commercial · Residential · Overpass · Plaza',
      art: './art/v2-plaza.jpg',
      skyPreset: 0, weather: 'light_rain',
      landmarkZh: '拥堵改道的沿海高架与滨海商业长廊',
      spawn: [-26, 0.25, -36],
      scenePreset: 'city_gridlock',
      characters: ['lin', 'mara', 'linwan', 'chen'],
      transitionZh: '全城交通信号失灵，商业中心与住宅区陷入混乱。你驾驶应急四驱车穿越不断改道的街区，选择不同路线打通前往铁路枢纽的通道。',
      transitionEn: 'Traffic signals fail across downtown. Drive the SAR 4x4 through dynamic detours, talk to stranded residents, and choose your route to the rail hub.',
      descriptionZh: '驾驶应急车辆穿越商业中心与住宅街区，根据路况在滨海主道与老城巷道间自主选路，协助林婉建立临时市民救护点，并清理高架路障。',
      descriptionEn: 'Drive across changing downtown neighborhoods, choose between coastal avenue or residential bypasses, assist medic Lin Wan, and clear traffic blockages.',
      objectives: [
        { id: 'c3_drive', titleZh: '驾驶 SAR 四驱车穿越沿海商业区，避开塌陷路段并选择改道路线', optionalZh: '沿途向市民广播避险指引', target: [-26, 0.25, -84], action: 'drive_route' },
        { id: 'c3_clinic', titleZh: '在滨海广场协助林婉搭建临时急救站，安抚受困居民', optionalZh: '运送广场备用医疗箱', target: [-6, 0.28, -149], action: 'assist_npc' },
        { id: 'c3_railgate', titleZh: '与铁路主管陈明取得联络，驾车突破高架拥堵抵达西区铁路入口', optionalZh: '拖离挡路故障货车', target: [-112, 0.25, 5], action: 'drive_route' },
      ],
      cutscene: {
        tag: 'CHAPTER 03 · 穿越城市',
        lines: [
          { at: 0.4, speaker: '林婉', tone: 'ally', line: '谢谢你们把药箱送过来！西区还有一列满载通勤市民的早班列车卡在断裂带里，陈主管正急着找支援。' },
          { at: 4.8, speaker: '陈明', tone: 'ally', line: '林恩对吧？快把车开到西区编组站，高架桥下那段路基已经开始错位了！' },
        ],
      },
      recapZh: '你驾车穿越断电与交通瘫痪的商业与住宅区，协助林婉安顿受困市民，随后应铁路主管陈明的紧急求援赶往西区铁路枢纽。',
    },
    {
      id: 'ch04', number: 4,
      titleEn: 'Chapter 04 — The Broken Railway',
      titleZh: '第四章 · 断裂的铁路',
      shortZh: '断裂的铁路',
      estMinutes: 24,
      primaryGameplay: 'search_and_rescue',
      secondaryGameplay: 'environmental_puzzle',
      gameplayTagsZh: ['搜索与救援', '列车内部探索', '铁路道岔解谜'],
      locationZh: '大型铁路枢纽 · 车站 · 铁路维修设施 · 列车内部',
      locationEn: 'Rail Hub · Station · Maintenance Shed · Train Interior',
      art: './art/v2-coastline.jpg',
      skyPreset: 0, weather: 'overcast_rain',
      landmarkZh: '双孔山地铁路隧道口与脱轨迫停的城际列车',
      spawn: [-124, 0.25, 5],
      scenePreset: 'broken_railway',
      characters: ['lin', 'chen', 'harris'],
      transitionZh: '西区铁路枢纽多处铁轨变形，一列通勤列车被迫停在隧道口外。你需要登上倾斜车厢搜寻失联乘客，并与陈明协作切换道岔恢复救援专线。',
      transitionEn: 'Warped tracks trap a commuter train outside the mountain tunnel. Search the carriages for trapped passengers and solve the switching puzzle with Chen.',
      descriptionZh: '探索大型铁路枢纽、维修厂与倾斜列车车厢，搜救被困乘客，通过南北两座物理道岔与供电联锁解谜开通应急救援轨道，规避失控货运溜车。',
      descriptionEn: 'Search trapped train cars, evacuate stranded passengers, solve the dual track-switch interlock puzzle, and handle a runaway freight car event.',
      objectives: [
        { id: 'c4_search', titleZh: '进入受困列车车厢搜索并引导 3 组滞留乘客撤至站台安全区', optionalZh: '取回列车黑匣子行车记录', target: [-133, 0.25, -18], action: 'rescue_group' },
        { id: 'c4_switch', titleZh: '按正确顺序扳动南北两处铁路道岔与信号联锁，开通应急救援支线', optionalZh: '检查铁路维修厂液压千斤顶', target: [-127.5, 0.25, -46], action: 'puzzle_switches' },
        { id: 'c4_runaway', titleZh: '处理突发溜车险情：在信号塔启动紧急止轮闸护送救援专列发车', optionalZh: '确认全员登车', target: [-198, 0.25, 5], action: 'dynamic_rail_event' },
      ],
      cutscene: {
        tag: 'CHAPTER 04 · 断裂的铁路',
        lines: [
          { at: 0.4, speaker: '陈明', tone: 'ally', line: '好险！要不是你及时切开北岔道，那节失控平板车就直接撞进站台了。' },
          { at: 4.8, speaker: '哈里斯', tone: 'ally', line: '乘客都安全了，但城市主电缆廊就在我们脚下十五米深的地方——如果不下去手动分流，整座城今晚就会彻底停水停电。' },
        ],
      },
      recapZh: '在西区铁路枢纽，你与陈明成功救出滞留列车的全部乘客并化解溜车险情；哈里斯指出必须深入地下公共管廊抢修城市主供电系统。',
    },
    {
      id: 'ch05', number: 5,
      titleEn: 'Chapter 05 — Beneath Saltline',
      titleZh: '第五章 · 盐线之下',
      shortZh: '盐线之下',
      estMinutes: 18,
      primaryGameplay: 'environmental_puzzle',
      secondaryGameplay: 'environment_state_management',
      gameplayTagsZh: ['独立地下空间探索', '分区电力路由解谜', '逐区恢复照明'],
      locationZh: '地下公共设施 · 维护通道 · 主供电枢纽',
      locationEn: 'Underground Utility Tunnels · Maintenance Corridors · Power Vault',
      art: './art/v2-interior.jpg',
      skyPreset: 3, weather: 'underground_humid',
      landmarkZh: '西区地下管廊地面检修枢纽与中央高压配电区',
      spawn: [-60, 0.25, -62],
      scenePreset: 'underground_vault',
      characters: ['lin', 'mara', 'harris'],
      transitionZh: '穿过铁路枢纽旁的地下检修井口，你沿着横跨大世界城区的三座市政高压配电枢纽逐区合闸，排查盐线地底隐藏的沉降裂痕。',
      transitionEn: 'Follow Saltline’s subterranean utility corridor across three open-world power substations to restore lighting and uncover the structural fault.',
      descriptionZh: '在大世界城区西侧的三座地下管廊配电枢纽间穿梭，完成三区负载均衡电力解谜，看着整片街区与监测站逐段亮起，并揭开被封锁的地质监测室。',
      descriptionEn: 'Traverse three connected utility substations across the open world, solve the 3-sector power routing puzzle, and uncover the sealed geological station.',
      objectives: [
        { id: 'c5_bay1', titleZh: '前往西侧 A 区管廊配电枢纽，恢复地下通道与街区基础照明', optionalZh: '排查渗水阀门压力表', target: [-74, 0.25, -62], action: 'power_puzzle' },
        { id: 'c5_bay2', titleZh: '平衡东侧 B/C 两区高压母线负载，避免变压器过载跳闸', optionalZh: '打开密封地质观测门', target: [-46, 0.25, -62], action: 'power_puzzle' },
        { id: 'c5_reveal', titleZh: '抵达北侧被封锁的地质监测室，与哈里斯核实沉降加速的真正原因', optionalZh: '导出地下监测曲线', target: [-60, 0.25, -78], action: 'story_reveal' },
      ],
      cutscene: {
        tag: 'CHAPTER 05 · 盐线之下',
        lines: [
          { at: 0.4, speaker: '玛拉', tone: 'ally', line: '灯亮起来了……天哪，林恩你看那堵承重墙！三年前的加固工程根本没浇筑到位，有人偷换了标号！' },
          { at: 5.0, speaker: '哈里斯', tone: 'ally', line: '不止如此——主排水泵站的数据线被人为切成了离线状态，南港船坞此刻正在倒灌海水！' },
        ],
      },
      recapZh: '深入盐线地下供电管廊并逐区恢复照明后，你们发现三年前的防沉降加固工程遭到偷工减料，且南港船坞的排水预警被刻意屏蔽，海水正急速倒灌。',
    },
    {
      id: 'ch06', number: 6,
      titleEn: 'Chapter 06 — Rising Water',
      titleZh: '第六章 · 不断上涨的水位',
      shortZh: '不断上涨的水位',
      estMinutes: 25,
      primaryGameplay: 'water_level_change',
      secondaryGameplay: 'multilevel_exploration',
      gameplayTagsZh: ['动态水位上涨', '多层立体空间移动', '船坞搜救'],
      locationZh: '南港大型船坞 · 海岸工程设施 · 多层维护建筑',
      locationEn: 'South Drydock · Coastal Engineering Works · Multi-Story Pump House',
      art: './art/v2-coastline.jpg',
      skyPreset: 0, weather: 'heavy_rain',
      landmarkZh: '真实水位持续攀升的巨型干船坞与多层钢架泵房',
      spawn: [-26, 0.25, 68],
      scenePreset: 'rising_water_drydock',
      characters: ['lin', 'mara', 'linwan'],
      transitionZh: '南港船坞防潮底阀破裂，海水以肉眼可见的速度吞没底层通道。原本可通行的地面路线正逐分钟被淹没，你必须向高层钢架转移并救出被困维修工。',
      transitionEn: 'The drydock floor valves fail as seawater rises rapidly. Lower routes flood in real time—climb multi-level structures to rescue trapped crews.',
      descriptionZh: '在真实 3D 水位不断上涨的南港船坞中展开立体搜救：底层被淹后路线动态切换至二层检修廊与龙门架，关闭两处液压泄压阀稳住主闸。',
      descriptionEn: 'Navigate a drydock where real rising water physically alters traversal routes, climb catwalks to rescue engineers, and seal two hydraulic flood valves.',
      objectives: [
        { id: 'c6_low', titleZh: '趁水位淹没底层前，救出船坞底部的 2 名维修技师并引导上行', optionalZh: '抢救船坞防水蓝图', target: [-10, 0.5, 86], action: 'flood_rescue' },
        { id: 'c6_climb', titleZh: '底层已淹没！攀登多层泵房钢梯与高空连廊，绕行至防潮闸控制平台', optionalZh: '与林婉汇合转移伤员', target: [-16, 4.2, 74], action: 'multilevel_climb' },
        { id: 'c6_valves', titleZh: '在防潮闸双塔关闭东西液压泄压阀，将水位锁定在安全线以下', optionalZh: '启动船坞应急抽水泵', target: [-26, 4.2, 96], action: 'valve_lock' },
      ],
      cutscene: {
        tag: 'CHAPTER 06 · 不断上涨的水位',
        lines: [
          { at: 0.4, speaker: '玛拉', tone: 'ally', line: '水位稳住了！再晚三十秒，整个南港工业区就会被海水倒灌！' },
          { at: 4.8, speaker: '林婉', tone: 'ally', line: '所有工人都救上来了。但全城通信塔全部掉线，如果不翻过西山恢复高地主中继，外面根本不知道盐线发生了什么！' },
        ],
      },
      recapZh: '你在不断上涨的洪水中攀登多层船坞设施救出被困工人并锁死防潮闸，暂时守住了南港，但全城与外界的通信已完全中断。',
    },
    {
      id: 'ch07', number: 7,
      titleEn: 'Chapter 07 — Beyond the Hills',
      titleZh: '第七章 · 越过山脊',
      shortZh: '越过山脊',
      estMinutes: 22,
      primaryGameplay: 'natural_exploration',
      secondaryGameplay: 'driving',
      gameplayTagsZh: ['山区盘山驾驶', '自然森林探索', '高地通信塔修复'],
      locationZh: '西岸山区 · 海岸松林 · 盘山公路 · 山脊通信设施',
      locationEn: 'West Highlands · Coastal Pine Forest · Switchback Road · Ridge Relay',
      art: './art/v2-terrain.jpg',
      skyPreset: 2, weather: 'mountain_mist_sunset',
      landmarkZh: '黄昏云海之上的 +14m 盘山公路与海岸松林山脊',
      spawn: [-112, 0.25, -78],
      scenePreset: 'highland_ridge',
      characters: ['lin', 'mara', 'chen'],
      transitionZh: '告别钢筋水泥与港口油污，你驶上西岸盘山公路，穿行在黄昏雾气缭绕的松林山谷之间，前往俯瞰整座城市与东海的山脊中继站。',
      transitionEn: 'Leave the harbor behind and climb the winding mountain road through dusk-lit pine forests to restore the highland relay overlooking Saltline.',
      descriptionZh: '在视觉风格截然不同的山区与森林环境中驾驶与徒步探索，穿行于风吹松林、岩壁与溪谷之间，排除山体滑坡阻断并校准两座山脊定向天线。',
      descriptionEn: 'Experience a dramatic visual shift into misty coastal mountains and pine forests; drive the switchback ridge, clear debris, and align two ridge relays.',
      objectives: [
        { id: 'c7_climb', titleZh: '沿盘山公路驾车越过铁路高架与松林弯道，抵达西岸山脊入口', optionalZh: '在观景台俯瞰停电中的盐线全城', target: [-168, 14.1, -78], action: 'mountain_drive' },
        { id: 'c7_forest', titleZh: '徒步穿行海岸松林小径，检修南北两座受损的山脊定向中继塔', optionalZh: '查看森林气象站风速仪', target: [-218, 12.2, -56], action: 'nature_explore' },
        { id: 'c7_dish', titleZh: '抵达山顶掩体，为通信中心主供电线路接通备用柴油机组', optionalZh: '开启山脊航空障碍灯', target: [-187, 14.1, -73.5], action: 'facility_restore' },
      ],
      cutscene: {
        tag: 'CHAPTER 07 · 越过山脊',
        lines: [
          { at: 0.4, speaker: '陈明', tone: 'ally', line: '从山顶往下看才真切感受到——半座盐线市都黑了，只有医院和码头还亮着几盏应急灯。' },
          { at: 4.8, speaker: '玛拉', tone: 'ally', line: '山脊中继通电了！现在进主通信中心大厅，沃德和外海平台的求救频道都在等着接通。' },
        ],
      },
      recapZh: '你穿越黄昏松林与盘山公路登上西岸山脊，修复了山林中继天线并为山顶通信中心重新供电，俯瞰危机笼罩下的整座盐线市。',
    },
    {
      id: 'ch08', number: 8,
      titleEn: 'Chapter 08 — The Last Connection',
      titleZh: '第八章 · 最后的连接',
      shortZh: '最后的连接',
      estMinutes: 18,
      primaryGameplay: 'story_choice',
      secondaryGameplay: 'coop_interaction',
      gameplayTagsZh: ['多角色协作操作', '核心剧情对峙', '影响后续章节的抉择'],
      locationZh: '大型通信中心 · 控制大厅 · 卫星上行机房',
      locationEn: 'Highland Comms Center · Control Hall · Satellite Uplink',
      art: './art/v2-rooftop.jpg',
      skyPreset: 2, weather: 'dusk_clearing',
      landmarkZh: '全景落地窗卫星控制大厅与巨型旋转雷达盘',
      spawn: [-194, 14.1, -78],
      scenePreset: 'comms_center',
      characters: ['lin', 'mara', 'harris', 'ward'],
      transitionZh: '通信中心主大厅终于重新亮起。沃德赶到现场，而残存带宽只够优先保障一条应急链路——你的决定将直接改写第 11 章与结局的走向。',
      transitionEn: 'The comms hall powers up as Ward arrives. Limited bandwidth forces a pivotal choice that shapes Chapters 11, 13, and the finale.',
      descriptionZh: '与玛拉、哈里斯协同完成多阶段卫星上行校准，截获外海平台发来的紧急求救信号；随后面对沃德的施压，决定将优先频段分配给“公开危机真相与市民预警”还是“静默直连外海救援专网”。',
      descriptionEn: 'Coordinate multi-stage uplink calibration with Mara and Harris, receive the offshore platform distress call, and make a major choice confronting Ward.',
      objectives: [
        { id: 'c8_sync', titleZh: '与玛拉分工同步主控大厅三组天线阵列与解码服务器', optionalZh: '查看被封存的市政通讯日志', target: [-198, 14.1, -78], action: 'coop_console' },
        { id: 'c8_distress', titleZh: '接收外海工程平台 17 名技术员的求救信号，确认风暴将在 2 小时内过境', optionalZh: '回放平台最后一次水文报告', target: [-192, 14.1, -74], action: 'story_dialogue' },
        { id: 'c8_choice', titleZh: '关键抉择：决定主信道优先用于【公开全城预警与真相】还是【加密直连外海搜救专网】', optionalZh: '听取沃德与哈里斯各自立场', target: [-190, 14.1, -78], action: 'branch_choice', choices: [
          { id: 'public_truth', labelZh: '公开全城预警与隐患真相（市民提前有序避险，但市政高层将中断官方授权）', labelEn: 'Broadcast Public Truth & Alert' },
          { id: 'rescue_priority', labelZh: '优先加密直连外海搜救专网（更快调动海上救援力量，但城区公众暂不知情）', labelEn: 'Prioritize Encrypted Offshore Rescue Net' },
        ] },
      ],
      cutscene: {
        tag: 'CHAPTER 08 · 最后的连接',
        lines: [
          { at: 0.4, speaker: '沃德', tone: 'ally', line: '林恩，你想清楚——现在把未核实的沉降报告直接广播给全城，会立刻引发恐慌，也可能拖慢外海平台的救援调度。' },
          { at: 5.0, speaker: '林恩', tone: 'ally', line: '人们有权知道脚下的土地正在发生什么，但外海平台上的十七个人也等不了。这是我的决定。' },
        ],
      },
      recapZh: '在山顶通信中心，你与众人接通了外海平台的求救信号，并在沃德面前作出了决定全城预警与救援优先级的关键抉择。',
    },
    {
      id: 'ch09', number: 9,
      titleEn: 'Chapter 09 — Into the Storm',
      titleZh: '第九章 · 进入风暴',
      shortZh: '进入风暴',
      estMinutes: 22,
      primaryGameplay: 'dynamic_weather_challenge',
      secondaryGameplay: 'search_and_rescue',
      gameplayTagsZh: ['大型风暴天气演出', '海岸大桥推进', '海上转运救援'],
      locationZh: '海岸大桥 · 港口外海 · 海上交通设施',
      locationEn: 'Coastal Bridge · Outer Harbor · Maritime Ferry Terminal',
      art: './art/v2-alley.jpg',
      skyPreset: 3, weather: 'severe_storm',
      landmarkZh: '狂风暴雨中的海岸大桥与巨浪拍岸的外海渡口',
      spawn: [-26, 0.25, 108],
      scenePreset: 'storm_bridge',
      characters: ['lin', 'mara', 'chen', 'linwan'],
      transitionZh: '强台风锋面正面登陆盐线海岸。能见度骤降、横风肆虐，你必须顶着狂风巨浪穿过海岸大桥与灯塔渡口，抢救受困桥面的救援车并登艇驶向外海平台。',
      transitionEn: 'A fierce coastal storm slams Saltline. Battle gale-force gusts and surging waves across the coastal bridge to rescue a stranded team and launch offshore.',
      descriptionZh: '在雷电、横风与真实巨浪压迫下穿越海岸大桥，利用桥墩掩体规避强阵风，救出被困在受损救援车里的林婉小队，随后点亮 22 米岸角灯塔并登艇驶向外海。',
      descriptionEn: 'Cross the storm-lashed coastal bridge using windbreaks, rescue Lin Wan’s trapped van, relight the 22m headland lighthouse, and launch the rescue boat.',
      objectives: [
        { id: 'c9_bridge', titleZh: '在周期性超强横风中利用桥墩掩体穿越海岸大桥', optionalZh: '固定松动的桥面警示浮标', target: [-10, 0.5, 118], action: 'storm_traverse' },
        { id: 'c9_van', titleZh: '撬开受损医疗车门，护送林婉与伤员撤至灯塔避风廊', optionalZh: '抢救车内便携除颤仪', target: [4, 0.5, 126], action: 'storm_rescue' },
        { id: 'c9_beacon', titleZh: '启动 22 米岸角灯塔强光引航，登上外海交通艇驶向风暴中心', optionalZh: '与陈明确认海上航线', target: [14, 0.5, 134], action: 'boat_launch' },
      ],
      cutscene: {
        tag: 'CHAPTER 09 · 进入风暴',
        lines: [
          { at: 0.4, speaker: '林婉', tone: 'ally', line: '风力超过十级了！灯塔终于重新亮起来了，救援艇能看清外海航道了！' },
          { at: 4.8, speaker: '林恩', tone: 'ally', line: '抓稳扶手——外海平台就在前方三海里，我们绝不把任何一个人留在海上。' },
        ],
      },
      recapZh: '你冒着十级风暴穿越海岸大桥救出林婉小队，重启 22 米岸角灯塔并乘艇冲入外海巨浪，驶向危在旦夕的外海工程平台。',
    },
    {
      id: 'ch10', number: 10,
      titleEn: 'Chapter 10 — The Offshore Platform',
      titleZh: '第十章 · 外海平台',
      shortZh: '外海平台',
      estMinutes: 28,
      primaryGameplay: 'multilevel_exploration',
      secondaryGameplay: 'coop_interaction',
      gameplayTagsZh: ['独立大型多层海上平台', '多角色协作疏散', '设施状态变化'],
      locationZh: '盐线外海工程平台（主甲板 · 机械舱 · 生活区 · 直升机坪）',
      locationEn: 'Saltline Offshore Platform (Main Deck · Machinery · Quarters · Helipad)',
      art: './art/v2-skyline.jpg',
      skyPreset: 3, weather: 'offshore_gale',
      landmarkZh: '四层立体钢结构外海工程平台（独立完整场景）',
      spawn: [96, 4.2, 60],
      scenePreset: 'offshore_platform',
      characters: ['lin', 'mara', 'linwan', 'harris'],
      transitionZh: '盐线外海监测平台是一座拥有四层甲板、机械舱、生活区和顶层直升机坪的庞大海上建筑。底柱已经倾斜，必须逐层搜寻并分批疏散全部 17 名技术员。',
      transitionEn: 'Board the multi-deck Saltline Offshore Platform—complete with machinery bay, crew quarters, and helipad—to stabilize its ballast and evacuate all 17 staff.',
      descriptionZh: '探索独立构建的大型多层外海平台：先与玛拉在底层机械舱平衡压载水舱延缓倾斜，再与林婉深入生活区组织 17 名受困人员分批登艇，最后在顶层停机坪完成撤离。',
      descriptionEn: 'Explore a full multi-story offshore platform: balance ballast tanks in the machinery deck, evacuate all 17 crew from living quarters, and clear the helipad.',
      objectives: [
        { id: 'c10_ballast', titleZh: '进入外海平台一层机械舱，与玛拉协同调整压载舱阀门稳住平台倾角', optionalZh: '关闭主甲板高压蒸汽管', target: [108, 4.2, 60], action: 'platform_ballast' },
        { id: 'c10_quarters', titleZh: '登上二层生活区与医疗舱，与林婉集合全部 17 名被困技术员并分批引导至救生艇', optionalZh: '取回平台海底地质采样箱', target: [108, 8.2, 68], action: 'evacuate_crew' },
        { id: 'c10_helipad', titleZh: '登上顶层直升机坪发射撤离信标，在平台主吊臂倾覆前完成最后登艇', optionalZh: '清点 17 人最终名单', target: [108, 12.2, 60], action: 'platform_finale' },
      ],
      cutscene: {
        tag: 'CHAPTER 10 · 外海平台',
        lines: [
          { at: 0.4, speaker: '林婉', tone: 'ally', line: '十六、十七——外海平台全部十七名技术员一个不少，全部安全登艇！' },
          { at: 4.8, speaker: '玛拉', tone: 'ally', line: '但你看平台刚才传回的最后一组海底传感器数据：沉降已经把海底高压电缆拉断了，整座盐线城区此刻陷入彻底黑暗！' },
        ],
      },
      recapZh: '在倾斜的多层外海平台上，你与玛拉、林婉稳住压载舱并成功疏散全部 17 名技术员，但海底主电缆断裂使盐线城区彻底陷入黑暗。',
    },
    {
      id: 'ch11', number: 11,
      titleEn: 'Chapter 11 — A City in Darkness',
      titleZh: '第十一章 · 黑暗中的城市',
      shortZh: '黑暗中的城市',
      estMinutes: 22,
      primaryGameplay: 'environment_state_management',
      secondaryGameplay: 'facility_repair',
      gameplayTagsZh: ['夜间城市电力分配', '角色关系发展', '抉择后果呈现'],
      locationZh: '夜间商业中心 · 公共建筑 · 停电城市街道',
      locationEn: 'Blackout Downtown · Civic Buildings · Night Streets',
      art: './art/v2-night.jpg',
      skyPreset: 3, weather: 'night_drizzle',
      landmarkZh: '伸手不见五指却随你恢复供电而逐区亮起的夜间盐线城',
      spawn: [-26, 0.25, -48],
      scenePreset: 'city_darkness',
      characters: ['lin', 'mara', 'ward', 'linwan'],
      transitionZh: '风暴渐弱，但夜色中的盐线市彻底断电。第 8 章的抉择此刻显现出不同后果——你必须在有限的备用发电容量下，决定先点亮哪些街区并恢复核心公共设施。',
      transitionEn: 'Saltline lies in total darkness. Your Chapter 8 choice shapes how residents react as you allocate scarce backup power across downtown.',
      descriptionZh: '在漆黑的夜间城区探索并修复三处变电节点，真实看着整条沿海大道、医院与住宅区在你眼前逐片亮起；与沃德深入对话，理解他在危机中的真实处境。',
      descriptionEn: 'Restore three night-time substation nodes to watch downtown districts light up one by one, while your Chapter 8 choice shapes dialogue with Ward and citizens.',
      objectives: [
        { id: 'c11_grid1', titleZh: '在黑暗城区重启沿海大道备用配电柜，恢复主干道与应急照明', optionalZh: '查看第 8 章抉择引发的市民公告板', target: [-36.2, 0.25, -74], action: 'restore_district_power' },
        { id: 'c11_priority', titleZh: '在市政配电枢纽分配有限电力：优先保障【战地医院与避难所】或【港口抽水与防潮系统】', optionalZh: '听取林婉与玛拉的建议', target: [-10, 0.25, -56], action: 'power_allocation' },
        { id: 'c11_ward', titleZh: '在夜间广场与沃德长谈，消除隔阂并获得进入市政档案中心的授权密钥', optionalZh: '巡视点亮后的滨海街区', target: [-26, 0.25, -110], action: 'relationship_beat' },
      ],
      cutscene: {
        tag: 'CHAPTER 11 · 黑暗中的城市',
        lines: [
          { at: 0.4, speaker: '沃德', tone: 'ally', line: '外海平台十七个人都活着回来了……林恩，我承认我低估了你们。市政档案中心的权限密钥给你，去把整件事的根子查清楚。' },
          { at: 5.0, speaker: '林恩', tone: 'ally', line: '灯已经重新亮起来了。明天太阳升起之前，我们要给整座城市一个交代。' },
        ],
      },
      recapZh: '你逐区恢复了黑暗城区的应急供电并合理分配了紧缺电力；沃德认可了你的判断，交出市政档案中心权限密钥，支持你查清隐瞒真相。',
    },
    {
      id: 'ch12', number: 12,
      titleEn: 'Chapter 12 — The Truth',
      titleZh: '第十二章 · 真相',
      shortZh: '真相',
      estMinutes: 20,
      primaryGameplay: 'character_interaction',
      secondaryGameplay: 'story_investigation',
      gameplayTagsZh: ['多角色现场对质', '真相整合', '解决人物矛盾'],
      locationZh: '大型公共档案建筑 · 市政管理中心 · 听证大厅',
      locationEn: 'Civic Archive Building · Municipal Admin Center · Hearing Hall',
      art: './art/v2-interior.jpg',
      skyPreset: 3, weather: 'calm_night',
      landmarkZh: '市政清关与档案大厅及三层调度中枢',
      spawn: [0, 0.25, -104],
      scenePreset: 'civic_archive',
      characters: ['lin', 'mara', 'harris', 'ward', 'chen'],
      transitionZh: '这不是枯燥地翻阅文件——所有关键人物齐聚市政管理中心。你需要用前十一章亲眼见证的事实，在现场化解哈里斯、沃德与玛拉之间的尖锐矛盾。',
      transitionEn: 'All key characters converge at the Civic Archive. Confront the buried truth through live character interplay rather than passive document reading.',
      descriptionZh: '在市政管理中心整合地下管廊、外海平台与港口沉降的实测证据，主持玛拉、哈里斯与沃德之间的公开对质，揭露市政基建压缩维护经费的完整链条，并敲定最终抢险方案。',
      descriptionEn: 'Bring together physical evidence from the harbor, vault, and offshore platform in a live confrontation between Mara, Harris, and Ward to finalize the rescue plan.',
      objectives: [
        { id: 'c12_hall', titleZh: '进入东海市政管理中心主厅，接入外海平台与地下管廊的实测地质模型', optionalZh: '查看盐线百年建港历史展墙', target: [0, 0.25, -106], action: 'present_evidence' },
        { id: 'c12_confront', titleZh: '在听证大厅调解沃德与哈里斯的激烈冲突，揭露三年来隐瞒沉降报告的完整真相', optionalZh: '征询陈明关于全城疏散通道的意见', target: [-8, 0.25, -104], action: 'character_confrontation' },
        { id: 'c12_plan', titleZh: '最后警报响起：主防潮枢纽与城北高压站同时告急！与全队制定终章联合作战计划', optionalZh: '分配每位队友的终章岗位', target: [-14, 0.25, -96], action: 'briefing_lock' },
      ],
      cutscene: {
        tag: 'CHAPTER 12 · 真相',
        lines: [
          { at: 0.4, speaker: '哈里斯', tone: 'ally', line: '当年是我软弱签了延期维修。今天这份实测数据加上外海传感记录，谁也再压不住了。' },
          { at: 4.8, speaker: '沃德', tone: 'ally', line: '账可以天亮后再算——现在南港主防潮闸和机场应急供电同时出现临界警报，全队按方案分头行动！' },
        ],
      },
      recapZh: '在市政管理中心，众人彻底揭开了隐瞒三年的基础设施失修真相并冰释前嫌。正当此时，城市防潮与主电网同时逼近临界点，最终决战迫在眉睫。',
    },
    {
      id: 'ch13', number: 13,
      titleEn: 'Chapter 13 — The Turning Point',
      titleZh: '第十三章 · 转折点',
      shortZh: '转折点',
      estMinutes: 30,
      primaryGameplay: 'coop_interaction',
      secondaryGameplay: 'driving',
      gameplayTagsZh: ['跨区域最终大关卡', '多角色联合协作', '多阶段动态环境变化与终极抉择'],
      locationZh: '横跨港口防潮枢纽 · 铁路动脉 · 海岸应急机场的联动战区',
      locationEn: 'Multi-District Finale: Tide Gate · Rail Artery · Coastal Airfield',
      art: './art/v2-skyline.jpg',
      skyPreset: 2, weather: 'pre_dawn_storm_break',
      landmarkZh: '全城联动抢险：防潮大闸 + 铁路物资专列 + 海岸应急机场跑道',
      spawn: [-26, 0.25, 86],
      scenePreset: 'turning_point_finale',
      characters: ['lin', 'mara', 'harris', 'ward', 'chen', 'linwan'],
      transitionZh: '黎明前最危险的一小时。六位核心角色各就各位，你需要横跨南港防潮枢纽、西区铁路与海岸机场三个区域，综合运用驾驶、解谜、协作与救援能力，守住整座盐线市。',
      transitionEn: 'The decisive hour before dawn. Coordinate with all five allies across the tide gate, rail corridor, and airfield in a multi-stage finale.',
      descriptionZh: '横跨三大区域的高规格最终章：先与哈里斯在南港防潮闸手动泄压保住堤岸，再与陈明护送满载备用变压器的铁路专列穿行，最后在海岸机场启动全城应急并网，并作出决定城市未来重建方向的终极抉择。',
      descriptionEn: 'Combine every skill learned across three connected districts: relieve tide-gate pressure with Harris, escort Chen’s transformer train, and synchronize the city grid at the airfield.',
      objectives: [
        { id: 'c13_gate', titleZh: '阶段一（南港防潮枢纽）：与哈里斯同步操作双塔泄压阀，化解最后一次风暴潮冲击', optionalZh: '确保南港泵房排水正常', target: [-26, 0.25, 96], action: 'finale_stage1' },
        { id: 'c13_convoy', titleZh: '阶段二（沿海与铁路动脉）：驾车护送陈明的应急变压器专列穿越塌方路段抵达北城', optionalZh: '为林婉的医疗转运车开辟通道', target: [-112, 0.25, -125], action: 'finale_stage2' },
        { id: 'c13_grid', titleZh: '阶段三（海岸应急机场）：与玛拉、沃德启动全城主电网并网，作出盐线重建终极抉择', optionalZh: '向全城广播危机解除通知', target: [-166, 0.25, -186], action: 'finale_choice', choices: [
          { id: 'open_inquiry', labelZh: '全面公开调查报告并由市民监督重建（彻底透明，重塑信任）', labelEn: 'Full Public Inquiry & Citizen Oversight' },
          { id: 'rapid_rebuild', labelZh: '启动跨部门快速重建法案优先恢复民生与港口（快速复苏）', labelEn: 'Rapid Joint Infrastructure Reconstruction' },
        ] },
      ],
      cutscene: {
        tag: 'CHAPTER 13 · 转折点',
        lines: [
          { at: 0.4, speaker: '玛拉', tone: 'ally', line: '主并网同步率 100%！全城防潮闸、医院、铁路和港口电网全部恢复稳定！' },
          { at: 5.0, speaker: '沃德', tone: 'ally', line: '风暴云层正在散开……全体应急队员，干得漂亮。盐线市挺过来了。' },
        ],
      },
      recapZh: '在黎明前的最终大抢险中，六位伙伴跨越三大区域协力稳住防潮大闸、打通铁路动脉并重启全城主电网，彻底扭转了盐线危机。',
    },
    {
      id: 'ch14', number: 14,
      titleEn: 'Chapter 14 — A New Morning',
      titleZh: '第十四章 · 新的清晨',
      shortZh: '新的清晨',
      estMinutes: 14,
      primaryGameplay: 'city_exploration',
      secondaryGameplay: 'character_interaction',
      gameplayTagsZh: ['可操作尾声', '城市状态变化展示', '角色结局与自由探索解锁'],
      locationZh: '危机结束、阳光洒满的盐线沿海城市与滨海长廊',
      locationEn: 'Post-Crisis Saltline City & Sunlit Waterfront Promenade',
      art: './art/v2-rooftop.jpg',
      skyPreset: 1, weather: 'clear_dawn',
      landmarkZh: '晴空晨曦下焕然一新的盐线港与重开的滨海钟楼广场',
      spawn: [19.5, 0.30, -96],
      scenePreset: 'new_morning_epilogue',
      characters: ['lin', 'mara', 'harris', 'ward', 'chen', 'linwan'],
      transitionZh: '危机过去后的第一个晴朗清晨。阳光照亮重新运转的港口、列车与滨海广场。你可以自由漫步其中，与每一位并肩作战的伙伴告别，并见证你的选择如何改变了盐线。',
      transitionEn: 'The first clear morning after the crisis. Walk through a recovering Saltline, speak with every ally, see the outcome of your choices, and unlock Free Roam.',
      descriptionZh: '完全可操作的温暖尾声：漫步晴朗的滨海长廊与广场，查看城市设施恢复变化，与玛拉、哈里斯、沃德、陈明、林婉逐一对话触发对应抉择结局，并永久解锁战役后自由探索。',
      descriptionEn: 'A playable sunlit epilogue showcasing city recovery, personalized character endings reacting to your choices, and unlocking Post-Campaign Free Roam.',
      objectives: [
        { id: 'c14_walk', titleZh: '沿晴朗的东海滨海长廊漫步，见证重新通航的港口与恢复运转的城市', optionalZh: '在滨海望远镜前眺望晴空东海', target: [19.5, 0.30, -56], action: 'epilogue_walk' },
        { id: 'c14_allies', titleZh: '在滨海钟楼广场与玛拉、哈里斯、沃德、陈明、林婉交谈，聆听各自的新开始', optionalZh: '查看盐线市公开重建公告牌', target: [-6, 0.30, -149], action: 'epilogue_farewell' },
        { id: 'c14_end', titleZh: '前往四号泊位观景台完成《盐线危机》尾声，解锁全城自由探索模式', optionalZh: '合影留念（按 V 进入摄影模式）', target: [-26, 0.25, -24], action: 'epilogue_complete' },
      ],
      cutscene: {
        tag: 'CHAPTER 14 · 新的清晨',
        lines: [
          { at: 0.4, speaker: '玛拉', tone: 'ally', line: '听见港口的汽笛声了吗？四号泊位刚才重新开航了，这次每一处地基传感器都连在公开监测网上。' },
          { at: 5.0, speaker: '林恩', tone: 'ally', line: '从第一个停电的早晨走到今天，谢谢你们每一个人。欢迎回到新的盐线市。' },
        ],
      },
      recapZh: '风暴散尽，盐线市迎来新的清晨。所有伙伴因你的选择迎来了各自的结局，城市进入公开重建阶段，并解锁了完整的自由探索模式。',
    },
  ]);

  // Verify Chapter × Gameplay Matrix has ZERO consecutive duplicate primary mechanics
  function validateGameplayMatrix(chapters = SALTLINE_CHAPTERS) {
    const violations = [];
    for (let i = 1; i < chapters.length; i++) {
      if (chapters[i].primaryGameplay === chapters[i - 1].primaryGameplay) {
        violations.push({
          prev: chapters[i - 1].id,
          curr: chapters[i].id,
          gameplay: chapters[i].primaryGameplay,
        });
      }
    }
    const totalEstMinutes = chapters.reduce((sum, c) => sum + (c.estMinutes || 0), 0);
    return {
      valid: violations.length === 0 && chapters.length >= 12,
      chapterCount: chapters.length,
      totalEstMinutes,
      totalEstHours: Number((totalEstMinutes / 60).toFixed(2)),
      violations,
    };
  }

  // =========================================================================
  // 4. MULTI-SLOT SAVE & CHECKPOINT MANAGER + ACCESSIBILITY SETTINGS
  // =========================================================================
  function createEmptySlot(slotId, difficulty = 'tactical') {
    return {
      slotId,
      createdAt: null,
      updatedAt: null,
      difficulty: DIFFICULTY_PRESETS[difficulty] ? difficulty : 'tactical',
      currentChapterId: 'ch01',
      currentObjectiveIdx: 0,
      unlockedIndex: 0,
      completedChapters: [],
      playTimeSec: {}, // chapterId -> seconds played
      totalPlayTimeSec: 0,
      choices: {}, // e.g. { ch08: 'public_truth', ch13: 'open_inquiry' }
      campaignCompleted: false,
      freeRoamUnlocked: false,
      checkpoint: null, // { chapterId, objectiveIdx, pos:[x,y,z], savedAt }
    };
  }

  function createCampaignSaveManager(storage = typeof localStorage !== 'undefined' ? localStorage : null) {
    function readAll() {
      try {
        const raw = storage?.getItem?.(STORAGE_SLOTS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length === 3) return parsed;
        }
      } catch {}
      return [createEmptySlot(0), createEmptySlot(1), createEmptySlot(2)];
    }
    function writeAll(slots) {
      try { storage?.setItem?.(STORAGE_SLOTS_KEY, JSON.stringify(slots)); } catch {}
    }
    function getActiveSlotId() {
      try {
        const v = Number(storage?.getItem?.(STORAGE_ACTIVE_SLOT_KEY));
        if (v === 0 || v === 1 || v === 2) return v;
      } catch {}
      return 0;
    }
    function setActiveSlotId(id) {
      if (id !== 0 && id !== 1 && id !== 2) return;
      try { storage?.setItem?.(STORAGE_ACTIVE_SLOT_KEY, String(id)); } catch {}
    }
    function getSlot(id = getActiveSlotId()) {
      const slots = readAll();
      return slots[id] || slots[0];
    }
    function updateSlot(id, mutator) {
      const slots = readAll();
      const idx = (id === 0 || id === 1 || id === 2) ? id : 0;
      const next = { ...slots[idx] };
      mutator(next);
      next.updatedAt = new Date().toISOString();
      if (!next.createdAt) next.createdAt = next.updatedAt;
      slots[idx] = next;
      writeAll(slots);
      return next;
    }
    function startNewCampaign(slotId = getActiveSlotId(), difficulty = 'tactical') {
      setActiveSlotId(slotId);
      const slots = readAll();
      const fresh = createEmptySlot(slotId, difficulty);
      fresh.createdAt = fresh.updatedAt = new Date().toISOString();
      slots[slotId] = fresh;
      writeAll(slots);
      return fresh;
    }
    function saveCheckpoint(chapterId, objectiveIdx, posArr, slotId = getActiveSlotId()) {
      return updateSlot(slotId, s => {
        s.currentChapterId = chapterId;
        s.currentObjectiveIdx = objectiveIdx;
        s.checkpoint = { chapterId, objectiveIdx, pos: posArr || null, savedAt: new Date().toISOString() };
        const chIdx = SALTLINE_CHAPTERS.findIndex(c => c.id === chapterId);
        if (chIdx >= 0) s.unlockedIndex = Math.max(s.unlockedIndex || 0, chIdx);
      });
    }
    function recordChoice(chapterId, choiceId, slotId = getActiveSlotId()) {
      return updateSlot(slotId, s => {
        s.choices = { ...(s.choices || {}), [chapterId]: choiceId };
      });
    }
    function addPlayTime(chapterId, deltaSec, slotId = getActiveSlotId()) {
      if (!(deltaSec > 0)) return getSlot(slotId);
      return updateSlot(slotId, s => {
        s.playTimeSec = { ...(s.playTimeSec || {}) };
        s.playTimeSec[chapterId] = Math.round((s.playTimeSec[chapterId] || 0) + deltaSec);
        s.totalPlayTimeSec = Math.round((s.totalPlayTimeSec || 0) + deltaSec);
      });
    }
    function completeChapter(chapterId, slotId = getActiveSlotId()) {
      const idx = SALTLINE_CHAPTERS.findIndex(c => c.id === chapterId);
      if (idx < 0) return getSlot(slotId);
      return updateSlot(slotId, s => {
        const done = new Set(s.completedChapters || []);
        done.add(chapterId);
        s.completedChapters = [...done];
        const nextIdx = Math.min(SALTLINE_CHAPTERS.length - 1, idx + 1);
        s.unlockedIndex = Math.max(s.unlockedIndex || 0, nextIdx);
        if (idx === SALTLINE_CHAPTERS.length - 1) {
          s.campaignCompleted = true;
          s.freeRoamUnlocked = true;
          s.currentChapterId = chapterId;
          s.currentObjectiveIdx = 0;
        } else {
          s.currentChapterId = SALTLINE_CHAPTERS[nextIdx].id;
          s.currentObjectiveIdx = 0;
        }
        s.checkpoint = null;
      });
    }
    function deleteSlot(slotId) {
      const slots = readAll();
      slots[slotId] = createEmptySlot(slotId);
      writeAll(slots);
      return slots[slotId];
    }
    function getAccessibility() {
      try {
        const raw = storage?.getItem?.(STORAGE_ACCESS_KEY);
        if (raw) return { subtitleScale: 'normal', highContrastHud: false, reduceShake: false, navAssist: true, bilingualSubtitles: true, ...JSON.parse(raw) };
      } catch {}
      return { subtitleScale: 'normal', highContrastHud: false, reduceShake: false, navAssist: true, bilingualSubtitles: true };
    }
    function setAccessibility(patch) {
      const next = { ...getAccessibility(), ...patch };
      try { storage?.setItem?.(STORAGE_ACCESS_KEY, JSON.stringify(next)); } catch {}
      if (typeof document !== 'undefined') {
        document.documentElement.dataset.subtitleScale = next.subtitleScale;
        document.documentElement.classList.toggle('sl-high-contrast', !!next.highContrastHud);
      }
      return next;
    }
    function buildStoryRecap(slotId = getActiveSlotId()) {
      const slot = getSlot(slotId);
      const completedSet = new Set(slot.completedChapters || []);
      const curIdx = Math.max(0, SALTLINE_CHAPTERS.findIndex(c => c.id === slot.currentChapterId));
      const entries = [];
      for (let i = 0; i < SALTLINE_CHAPTERS.length; i++) {
        const ch = SALTLINE_CHAPTERS[i];
        if (completedSet.has(ch.id) || i < curIdx) {
          entries.push({
            id: ch.id,
            number: ch.number,
            titleZh: ch.titleZh,
            titleEn: ch.titleEn,
            recapZh: ch.recapZh,
            choiceMade: slot.choices?.[ch.id] || null,
          });
        }
      }
      return {
        slotId,
        currentChapter: SALTLINE_CHAPTERS[curIdx] || SALTLINE_CHAPTERS[0],
        completedCount: completedSet.size,
        totalChapters: SALTLINE_CHAPTERS.length,
        choices: slot.choices || {},
        entries,
      };
    }

    return {
      readAll, getActiveSlotId, setActiveSlotId, getSlot, updateSlot,
      startNewCampaign, saveCheckpoint, recordChoice, addPlayTime, completeChapter, deleteSlot,
      getAccessibility, setAccessibility, buildStoryRecap,
    };
  }

  // =========================================================================
  // 5. CHAPTER 3D SET-PIECE BUILDER (Unique Underground Vault, Rising Water,
  //    Multi-Deck Offshore Platform, Storm Bridge & Sunlit Morning Recovery)
  // =========================================================================
  function createChapterSetPieceManager(world) {
    const { THREE, scene, physics } = world || {};
    if (!THREE || !scene) return { activate: () => {}, setObjectiveBeacon: () => {}, update: () => {}, dispose: () => {}, get state() { return null; } };
    const { Group, Mesh, BoxGeometry, CylinderGeometry, PlaneGeometry, MeshStandardMaterial, MeshBasicMaterial, PointLight, Vector3 } = THREE;

    const root = new Group();
    root.name = 'saltline-campaign-v2-setpieces';
    scene.add(root);

    const boxGeo = new BoxGeometry(1, 1, 1);
    const cylGeo = new CylinderGeometry(1, 1, 1, 16);
    const activeColliders = [];
    let activePreset = null;
    let waterMesh = null;
    let waterLevel = -0.6;
    let waterRising = false;
    let waterLocked = false;
    let vaultLights = [];
    let stormWindClock = 0;
    let currentGust = 0;

    function clearCurrent() {
      while (root.children.length) root.remove(root.children[0]);
      if (physics?.removeBox) {
        for (const c of activeColliders.splice(0)) physics.removeBox(c);
      } else activeColliders.length = 0;
      waterMesh = null;
      waterRising = false;
      waterLocked = false;
      vaultLights = [];
      activePreset = null;
    }

    function addSolid(parent, mat, x, y, z, w, h, d, surface = 'concrete', collide = true) {
      const m = new Mesh(boxGeo, mat);
      m.position.set(x, y, z);
      m.scale.set(w, h, d);
      m.receiveShadow = true;
      m.matrixAutoUpdate = false;
      m.updateMatrix();
      parent.add(m);
      if (collide && physics?.addBox) {
        const b = physics.addBox(
          new Vector3(x - w / 2, y - h / 2, z - d / 2),
          new Vector3(x + w / 2, y + h / 2, z + d / 2),
          { surface, noNav: true }
        );
        if (b) activeColliders.push(b);
      }
      return m;
    }

    function buildUndergroundVault() {
      const g = new Group();
      g.name = 'setpiece-underground-vault';
      const concrete = new MeshStandardMaterial({ color: 0x3f464a, roughness: 0.92, metalness: 0.08 });
      const darkSteel = new MeshStandardMaterial({ color: 0x1d2429, roughness: 0.55, metalness: 0.65 });
      const hazard = new MeshStandardMaterial({ color: 0xd99b26, roughness: 0.5, metalness: 0.25 });
      const cableMat = new MeshStandardMaterial({ color: 0x7c3128, roughness: 0.65, metalness: 0.2 });

      // Independent subterranean floor & ceiling at y = -8.0 .. -3.4 (completely separate spatial volume!)
      addSolid(g, concrete, -60, -8.2, -66, 42, 0.4, 34, 'concrete', true);
      addSolid(g, concrete, -60, -3.2, -66, 42, 0.4, 34, 'concrete', true);
      addSolid(g, concrete, -81, -5.7, -66, 0.6, 5.2, 34, 'concrete', true);
      addSolid(g, concrete, -39, -5.7, -66, 0.6, 5.2, 34, 'concrete', true);
      addSolid(g, concrete, -60, -5.7, -83, 42, 5.2, 0.6, 'concrete', true);
      addSolid(g, concrete, -60, -5.7, -49, 42, 5.2, 0.6, 'concrete', true);

      // Structural arched ribs & heavy power conduits along the tunnel
      for (let x = -76; x <= -44; x += 6.4) {
        addSolid(g, darkSteel, x, -5.7, -51.5, 0.55, 4.8, 0.55, 'metal', true);
        addSolid(g, darkSteel, x, -5.7, -80.5, 0.55, 4.8, 0.55, 'metal', true);
        addSolid(g, darkSteel, x, -3.55, -66, 0.48, 0.42, 30, 'metal', false);
      }
      addSolid(g, cableMat, -60, -4.1, -54, 36, 0.26, 0.26, 'metal', false);
      addSolid(g, hazard, -60, -7.95, -62, 32, 0.04, 2.2, 'concrete', false);

      // Progressive zone lights (initially dim, lit up as player solves power routing!)
      for (const [lx, lz] of [[-74, -62], [-60, -62], [-46, -62], [-60, -76]]) {
        const pt = new PointLight(0xffe0a3, 1.5, 22, 1.5);
        pt.position.set(lx, -4.2, lz);
        g.add(pt);
        vaultLights.push(pt);
      }
      root.add(g);
    }

    let platformGroup = null;
    let platformTiltDeg = 0;
    let platformBallastBalanced = false;

    function buildCityGridlockSetPiece() {
      const g = new Group();
      g.name = 'setpiece-city-gridlock';
      const concrete = new MeshStandardMaterial({ color: 0x6f757a, roughness: 0.88, metalness: 0.06 });
      const orange = new MeshStandardMaterial({ color: 0xe66a1f, roughness: 0.48, metalness: 0.18 });
      const white = new MeshStandardMaterial({ color: 0xeaf0f4, roughness: 0.74, metalness: 0.08 });
      const redCross = new MeshStandardMaterial({ color: 0xd93838, roughness: 0.42, metalness: 0.15 });
      const steel = new MeshStandardMaterial({ color: 0x333f48, roughness: 0.52, metalness: 0.64 });
      const beaconMat = new MeshBasicMaterial({ color: 0xff9b26 });
      for (const [bx, bz] of [[-29, -62], [-23, -62], [-26, -65]]) {
        addSolid(g, concrete, bx, 0.55, bz, 3.4, 0.95, 0.72, 'concrete', true);
        addSolid(g, orange, bx, 1.12, bz, 2.6, 0.22, 0.22, 'metal', false);
        addSolid(g, beaconMat, bx, 1.38, bz, 0.24, 0.24, 0.24, 'metal', false);
      }
      addSolid(g, steel, -32, 2.5, -58, 0.35, 5.0, 0.35, 'metal', true);
      addSolid(g, steel, -20, 2.5, -58, 0.35, 5.0, 0.35, 'metal', true);
      addSolid(g, orange, -26, 4.8, -58, 12.6, 0.85, 0.28, 'metal', false);
      const mx = -6, mz = -149;
      addSolid(g, concrete, mx, 0.24, mz, 11.5, 0.28, 8.5, 'concrete', true);
      addSolid(g, white, mx, 3.35, mz, 10.6, 0.24, 7.6, 'metal', false);
      for (const sx of [-4.9, 4.9]) for (const sz of [-3.4, 3.4]) {
        addSolid(g, steel, mx + sx, 1.8, mz + sz, 0.22, 3.1, 0.22, 'metal', true);
      }
      addSolid(g, redCross, mx, 3.55, mz + 3.85, 1.8, 0.42, 0.14, 'metal', false);
      addSolid(g, redCross, mx, 3.55, mz + 3.85, 0.42, 1.4, 0.14, 'metal', false);
      for (const [cx, cz] of [[-3.2, -1.8], [-1.8, -1.8], [3.1, 1.6]]) {
        addSolid(g, white, mx + cx, 0.78, mz + cz, 1.15, 0.78, 0.85, 'metal', true);
        addSolid(g, redCross, mx + cx, 1.19, mz + cz, 0.38, 0.06, 0.14, 'metal', false);
      }
      const medLight = new PointLight(0xfff1d6, 18, 28, 1.4);
      medLight.position.set(mx, 3.0, mz);
      g.add(medLight);
      root.add(g);
    }

    function buildRisingWaterDrydock() {
      const g = new Group();
      g.name = 'setpiece-rising-water';
      const waterMat = new MeshStandardMaterial({
        color: 0x15445c, roughness: 0.16, metalness: 0.42, transparent: true, opacity: 0.82,
      });
      waterMesh = new Mesh(new PlaneGeometry(120, 120), waterMat);
      waterMesh.rotation.x = -Math.PI / 2;
      waterLevel = -0.35;
      waterMesh.position.set(-22, waterLevel, 88);
      g.add(waterMesh);
      waterRising = true;
      waterLocked = false;

      const steel = new MeshStandardMaterial({ color: 0x3b4852, roughness: 0.52, metalness: 0.66 });
      const rail = new MeshStandardMaterial({ color: 0xe2a82e, roughness: 0.48, metalness: 0.22 });
      const concrete = new MeshStandardMaterial({ color: 0x5c6469, roughness: 0.88, metalness: 0.08 });
      const valveRed = new MeshStandardMaterial({ color: 0xc93b2b, roughness: 0.45, metalness: 0.32 });
      const glass = new MeshStandardMaterial({ color: 0x62b4cf, roughness: 0.16, metalness: 0.45, transparent: true, opacity: 0.45 });
      addSolid(g, steel, -16, 3.6, 82, 3.0, 0.24, 30, 'metal', true);
      addSolid(g, steel, -22, 3.6, 96, 14.0, 0.24, 4.2, 'metal', true);
      addSolid(g, rail, -17.4, 4.2, 82, 0.1, 1.0, 30, 'metal', false);
      addSolid(g, rail, -14.6, 4.2, 82, 0.1, 1.0, 30, 'metal', false);
      for (let i = 0; i < 12; i++) {
        addSolid(g, steel, -16, 0.45 + i * 0.28, 65.5 + i * 0.72, 2.8, 0.20, 0.88, 'metal', true);
      }
      addSolid(g, concrete, -12, 5.2, 74, 5.2, 3.2, 5.6, 'concrete', true);
      addSolid(g, glass, -14.65, 5.3, 74, 0.14, 1.6, 4.2, 'glass', false);
      for (const vx of [-28.5, -23.5]) {
        addSolid(g, steel, vx, 5.1, 96, 1.6, 3.0, 1.6, 'metal', true);
        addSolid(g, valveRed, vx, 5.0, 95.1, 0.9, 0.9, 0.22, 'metal', false);
      }
      const dockLight = new PointLight(0xffd28a, 18, 36, 1.4);
      dockLight.position.set(-16, 7.2, 82);
      g.add(dockLight);
      root.add(g);
    }

    function buildOffshorePlatform() {
      const g = new Group();
      g.name = 'setpiece-offshore-platform';
      platformGroup = g;
      platformTiltDeg = 3.2;
      platformBallastBalanced = false;
      const steel = new MeshStandardMaterial({ color: 0x334049, roughness: 0.56, metalness: 0.64 });
      const deckMat = new MeshStandardMaterial({ color: 0x4b5358, roughness: 0.82, metalness: 0.18 });
      const orange = new MeshStandardMaterial({ color: 0xd96226, roughness: 0.48, metalness: 0.22 });
      const white = new MeshStandardMaterial({ color: 0xdbe2e6, roughness: 0.72, metalness: 0.08 });
      const yellow = new MeshStandardMaterial({ color: 0xe6b422, roughness: 0.5, metalness: 0.2 });
      const glass = new MeshStandardMaterial({ color: 0x5ba2bd, roughness: 0.14, metalness: 0.45, transparent: true, opacity: 0.42 });
      const screenGlow = new MeshBasicMaterial({ color: 0x38d9f5 });

      const ox = 108, oz = 60;
      for (const lx of [-14, 14]) for (const lz of [-12, 12]) {
        const leg = new Mesh(cylGeo, orange);
        leg.position.set(ox + lx, 1.5, oz + lz);
        leg.scale.set(2.2, 16, 2.2);
        leg.matrixAutoUpdate = false; leg.updateMatrix();
        g.add(leg);
      }
      addSolid(g, deckMat, ox, 3.8, oz, 36, 0.45, 30, 'metal', true);
      addSolid(g, steel, ox - 8, 5.8, oz - 6, 12, 3.6, 10, 'metal', true);
      addSolid(g, orange, ox + 10, 5.6, oz - 7, 8, 3.2, 6, 'metal', true);
      for (const tz of [-3, 1, 5]) {
        const tank = new Mesh(cylGeo, yellow);
        tank.position.set(ox + 9, 5.4, oz + tz); tank.scale.set(1.1, 2.8, 1.1);
        tank.matrixAutoUpdate = false; tank.updateMatrix(); g.add(tank);
      }
      addSolid(g, orange, ox + 4, 4.6, oz + 1, 9.5, 0.36, 0.36, 'metal', false);
      addSolid(g, deckMat, ox, 7.8, oz + 2, 26, 0.4, 20, 'metal', true);
      addSolid(g, white, ox - 4, 9.8, oz + 0.2, 16, 3.6, 0.32, 'concrete', true);
      addSolid(g, white, ox - 12, 9.8, oz + 5.1, 0.32, 3.6, 10, 'concrete', true);
      addSolid(g, white, ox + 4, 9.8, oz + 5.1, 0.32, 3.6, 10, 'concrete', true);
      addSolid(g, white, ox - 8.5, 9.8, oz + 10.0, 7.0, 3.6, 0.32, 'concrete', true);
      addSolid(g, white, ox + 1.2, 9.8, oz + 10.0, 5.5, 3.6, 0.32, 'concrete', true);
      addSolid(g, white, ox - 4, 11.55, oz + 5.1, 16.4, 0.26, 10.2, 'concrete', true);
      addSolid(g, glass, ox - 8.5, 10.0, oz + 10.18, 5.4, 1.4, 0.12, 'glass', false);
      addSolid(g, steel, ox - 7, 8.5, oz + 4, 2.4, 0.9, 1.2, 'metal', true);
      addSolid(g, white, ox - 7, 9.0, oz + 4, 2.2, 0.12, 1.1, 'metal', false);
      addSolid(g, steel, ox - 1, 8.6, oz + 2.5, 2.6, 1.1, 0.9, 'metal', true);
      addSolid(g, screenGlow, ox - 1, 9.3, oz + 2.5, 1.4, 0.65, 0.10, 'metal', false);
      const interiorLight = new PointLight(0xffe8c2, 14, 22, 1.4);
      interiorLight.position.set(ox - 4, 10.9, oz + 5);
      g.add(interiorLight);
      addSolid(g, steel, ox, 11.8, oz, 20, 0.4, 18, 'metal', true);
      addSolid(g, yellow, ox, 12.04, oz, 8, 0.05, 8, 'metal', false);
      addSolid(g, orange, ox - 8, 14.0, oz - 6, 6, 3.8, 6, 'metal', true);
      addSolid(g, glass, ox - 8, 14.4, oz - 2.95, 5.2, 1.4, 0.14, 'glass', false);
      addSolid(g, steel, ox - 8, 17.5, oz - 6, 0.36, 3.8, 0.36, 'metal', false);
      for (let i = 0; i < 12; i++) {
        addSolid(g, steel, ox + 14.5, 4.1 + i * 0.33, oz - 4 + i * 0.9, 2.4, 0.18, 1.0, 'metal', true);
        addSolid(g, steel, ox + 10.5, 8.1 + i * 0.33, oz + 8 - i * 0.85, 2.2, 0.18, 0.95, 'metal', true);
      }
      addSolid(g, orange, ox - 16.5, 5.2, oz + 8, 2.6, 1.8, 7.2, 'metal', true);
      const beacon = new PointLight(0xffb85c, 24, 48, 1.4);
      beacon.position.set(ox, 16.5, oz);
      g.add(beacon);
      root.add(g);
    }

    // Mechanic-Specific 3D Interactive Props (NO single generic console box across 42 objectives!)
    let beaconGroup = null;
    let activeConsoleButtonMat = null;
    let activeConsoleScreenMat = null;
    let activeSubNodes = [];
    let consolePulseClock = 0;
    function setObjectiveBeacon(targetPos, actionType = 'console', opts = {}) {
      if (beaconGroup) { root.remove(beaconGroup); beaconGroup = null; activeConsoleButtonMat = null; activeConsoleScreenMat = null; }
      for (const sn of activeSubNodes) sn.human?.actor?.removeFromParent?.();
      activeSubNodes = [];
      if (!targetPos || !Array.isArray(targetPos)) return [];
      const mechanic = opts.mechanic || resolveObjectiveMechanic(actionType);
      beaconGroup = new Group();
      beaconGroup.name = `campaign-v2-prop-${mechanic}`;
      const tx = targetPos[0], ty = targetPos[1] || 0, tz = targetPos[2];
      const bodyMat = new MeshStandardMaterial({ color: 0x26313a, roughness: 0.52, metalness: 0.64 });
      const trimMat = new MeshStandardMaterial({ color: 0xd99b26, roughness: 0.48, metalness: 0.28 });

      if (mechanic === 'dialogue' || mechanic === 'branch_choice') {
        const haloMat = new MeshBasicMaterial({ color: 0xf3d284, transparent: true, opacity: 0.55, depthWrite: false });
        const halo = new Mesh(cylGeo, haloMat);
        halo.scale.set(2.1, 0.05, 2.1);
        halo.position.set(tx, ty + 0.05, tz);
        beaconGroup.add(halo);
        activeConsoleButtonMat = haloMat;
        activeSubNodes.push({ id: 'talk_0', pos: [tx, ty, tz], labelZh: mechanic === 'branch_choice' ? '关键抉择现场' : '对话人物', done: false, lampMat: haloMat });
      } else if (mechanic === 'driving_gates') {
        const start = opts.originPos || [tx, ty, tz + 36];
        [0.35, 0.68, 1.0].forEach((f, idx) => {
          const gx = start[0] + (tx - start[0]) * f;
          const gy = (start[1] || ty) + (ty - (start[1] || ty)) * f;
          const gz = start[2] + (tz - start[2]) * f;
          const lampMat = new MeshBasicMaterial({ color: idx === 0 ? 0xf3d284 : 0x38c7e8, transparent: true, opacity: 0.88 });
          const gate = new Group();
          gate.position.set(gx, gy, gz);
          const pL = new Mesh(boxGeo, trimMat); pL.scale.set(0.45, 5.2, 0.45); pL.position.set(-4.2, 2.6, 0);
          const pR = new Mesh(boxGeo, trimMat); pR.scale.set(0.45, 5.2, 0.45); pR.position.set(4.2, 2.6, 0);
          const bar = new Mesh(boxGeo, lampMat); bar.scale.set(9.0, 0.38, 0.45); bar.position.set(0, 5.1, 0);
          gate.add(pL, pR, bar);
          beaconGroup.add(gate);
          activeSubNodes.push({ id: `gate_${idx}`, pos: [gx, gy, gz], labelZh: `驾驶检查点 ${idx + 1}/3`, done: false, lampMat, mesh: gate });
        });
        activeConsoleButtonMat = activeSubNodes[0]?.lampMat || null;
      } else if (mechanic === 'survivor_rescue') {
        const offsets = [[-4.5, 0, -2.5], [4.2, 0, 1.8], [0.5, 0, 5.4]];
        offsets.forEach(([ox, oy, oz], idx) => {
          const sx = tx + ox, sy = ty + oy, sz = tz + oz;
          const ringMat = new MeshBasicMaterial({ color: 0x5ce094, transparent: true, opacity: 0.68, depthWrite: false });
          const ring = new Mesh(cylGeo, ringMat);
          ring.scale.set(1.5, 0.05, 1.5); ring.position.set(sx, sy + 0.05, sz);
          beaconGroup.add(ring);
          let human = null;
          if (typeof window !== 'undefined' && typeof window.createSaltlineHuman === 'function') {
            human = window.createSaltlineHuman(THREE, {
              name: `survivor-${idx}`,
              role: idx === 2 ? 'worker' : 'engineer',
              modelType: idx === 0 ? 'civilian_female' : (idx === 1 ? 'civilian_male' : 'worker_male'),
              armed: false,
              variation: idx,
            });
            human.actor.position.set(sx, sy, sz);
            scene.add(human.actor);
          }
          activeSubNodes.push({ id: `surv_${idx}`, pos: [sx, sy, sz], labelZh: `受困人员 ${idx + 1}/3`, done: false, lampMat: ringMat, human });
        });
        activeConsoleButtonMat = activeSubNodes[0]?.lampMat || null;
      } else if (mechanic === 'multi_switch_puzzle') {
        const isValve = /valve|ballast|gate|finale_stage1/i.test(String(actionType));
        const offsets = [[-6.5, 0, -2.0], [0, 0, 0], [6.5, 0, 2.2]];
        offsets.forEach(([ox, oy, oz], idx) => {
          const nx = tx + ox, ny = ty + oy, nz = tz + oz;
          const lampMat = new MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.92 });
          const ped = new Mesh(boxGeo, bodyMat); ped.scale.set(0.85, 1.15, 0.58); ped.position.set(nx, ny + 0.58, nz);
          const actuator = new Mesh(isValve ? cylGeo : boxGeo, trimMat);
          if (isValve) { actuator.scale.set(0.36, 0.09, 0.36); actuator.rotation.x = Math.PI / 2; }
          else { actuator.scale.set(0.12, 0.42, 0.12); actuator.rotation.x = -0.45; }
          actuator.position.set(nx, ny + 1.15, nz + 0.32);
          const lamp = new Mesh(boxGeo, lampMat); lamp.scale.set(0.28, 0.18, 0.12); lamp.position.set(nx, ny + 1.32, nz + 0.22);
          beaconGroup.add(ped, actuator, lamp);
          activeSubNodes.push({
            id: `node_${idx}`, pos: [nx, ny, nz],
            labelZh: isValve ? `液压泄压阀 ${idx + 1}/3` : `配电/道岔联锁 ${idx + 1}/3`,
            done: false, lampMat, actuator,
          });
        });
        activeConsoleButtonMat = activeSubNodes[0]?.lampMat || null;
      } else if (mechanic === 'storm_climb_traversal') {
        const start = opts.originPos || [tx, ty, tz + 24];
        [0.38, 0.70, 1.0].forEach((f, idx) => {
          const cx = start[0] + (tx - start[0]) * f;
          const cy = (start[1] || ty) + (ty - (start[1] || ty)) * f;
          const cz = start[2] + (tz - start[2]) * f;
          const ringMat = new MeshBasicMaterial({ color: 0xf3d284, transparent: true, opacity: 0.65, depthWrite: false });
          const ring = new Mesh(cylGeo, ringMat);
          ring.scale.set(2.4, 0.06, 2.4); ring.position.set(cx, cy + 0.06, cz);
          beaconGroup.add(ring);
          activeSubNodes.push({ id: `trav_${idx}`, pos: [cx, cy, cz], labelZh: `推进节点 ${idx + 1}/3`, done: false, lampMat: ringMat });
        });
        activeConsoleButtonMat = activeSubNodes[0]?.lampMat || null;
      } else {
        const ringMat = new MeshBasicMaterial({ color: 0x66d9f0, transparent: true, opacity: 0.58, depthWrite: false });
        const ring = new Mesh(cylGeo, ringMat); ring.scale.set(1.9, 0.06, 1.9); ring.position.set(tx, ty + 0.05, tz);
        activeConsoleScreenMat = new MeshBasicMaterial({ color: 0x38c7e8 });
        activeConsoleButtonMat = new MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.95 });
        const cabinet = new Mesh(boxGeo, bodyMat); cabinet.scale.set(1.25, 1.55, 0.78); cabinet.position.set(tx, ty + 0.78, tz);
        const trim = new Mesh(boxGeo, trimMat); trim.scale.set(1.30, 0.12, 0.82); trim.position.set(tx, ty + 0.14, tz);
        const screen = new Mesh(boxGeo, activeConsoleScreenMat); screen.scale.set(0.76, 0.36, 0.06); screen.position.set(tx, ty + 1.24, tz + 0.40);
        const lamp = new Mesh(boxGeo, activeConsoleButtonMat); lamp.scale.set(0.28, 0.14, 0.14); lamp.position.set(tx, ty + 1.64, tz);
        beaconGroup.add(ring, cabinet, trim, screen, lamp);
        activeSubNodes.push({ id: 'repair_0', pos: [tx, ty, tz], labelZh: '长按 [E] 检修/启动设备', done: false, lampMat: activeConsoleButtonMat });
      }
      root.add(beaconGroup);
      return activeSubNodes;
    }

    function markSubNodeDone(idx) {
      const sn = activeSubNodes[idx];
      if (!sn) return;
      sn.done = true;
      if (sn.lampMat?.color) sn.lampMat.color.setHex(0x5ce094);
      if (sn.actuator) sn.actuator.rotation.z += Math.PI * 0.65;
    }

    function markConsoleActivated() {
      if (activeConsoleButtonMat?.color) activeConsoleButtonMat.color.setHex(0x66d9f0);
      if (activeConsoleScreenMat?.color) activeConsoleScreenMat.color.setHex(0x88ffaa);
    }

    // =========================================================================
    // 5B. REAL 3D OPEN-WORLD AIRCRAFT CRASH SET-PIECE (Flying -> Smoke -> Crash -> Wreckage)
    // =========================================================================
    let crashState = null;
    let crashRoot = null;
    function triggerAircraftCrash(impactArr = [-18, 0.25, -64]) {
      if (crashRoot) { root.remove(crashRoot); crashRoot = null; }
      const ix = impactArr[0], iy = impactArr[1] || 0.25, iz = impactArr[2];
      crashRoot = new Group();
      crashRoot.name = 'setpiece-aircraft-crash';

      const planeGroup = new Group();
      const hullMat = new MeshStandardMaterial({ color: 0x3b4954, roughness: 0.46, metalness: 0.58 });
      const stripeMat = new MeshStandardMaterial({ color: 0xd96226, roughness: 0.45, metalness: 0.22 });
      const glassMat = new MeshStandardMaterial({ color: 0x1b2f3d, roughness: 0.15, metalness: 0.8 });
      const propMat = new MeshStandardMaterial({ color: 0x181b1e, roughness: 0.5, metalness: 0.7 });

      const fuselage = new Mesh(boxGeo, hullMat);
      fuselage.scale.set(2.4, 2.2, 13.5);
      const nose = new Mesh(boxGeo, stripeMat);
      nose.scale.set(1.8, 1.5, 2.8);
      nose.position.set(0, -0.15, 7.6);
      const cockpit = new Mesh(boxGeo, glassMat);
      cockpit.scale.set(1.9, 0.85, 2.2);
      cockpit.position.set(0, 0.82, 5.4);
      const wings = new Mesh(boxGeo, hullMat);
      wings.scale.set(18.5, 0.32, 3.2);
      wings.position.set(0, 0.45, 0.6);
      const tailFin = new Mesh(boxGeo, stripeMat);
      tailFin.scale.set(0.28, 3.6, 2.8);
      tailFin.position.set(0, 2.2, -5.8);
      const tailWing = new Mesh(boxGeo, hullMat);
      tailWing.scale.set(6.4, 0.22, 1.5);
      tailWing.position.set(0, 0.9, -6.0);

      const propL = new Mesh(boxGeo, propMat);
      propL.scale.set(2.6, 0.16, 0.12);
      propL.position.set(-4.6, 0.2, 2.5);
      const propR = new Mesh(boxGeo, propMat);
      propR.scale.set(2.6, 0.16, 0.12);
      propR.position.set(4.6, 0.2, 2.5);

      const fireMat = new MeshBasicMaterial({ color: 0xff6a1a, transparent: true, opacity: 0.0 });
      const fireCore = new Mesh(cylGeo, fireMat);
      fireCore.scale.set(2.4, 3.2, 2.4);
      fireCore.position.set(0, 1.2, 0);

      planeGroup.add(fuselage, nose, cockpit, wings, tailFin, tailWing, propL, propR, fireCore);
      crashRoot.add(planeGroup);
      root.add(crashRoot);

      const startPos = new Vector3(ix + 115, iy + 68, iz - 95);
      const impactPos = new Vector3(ix, iy + 0.95, iz);
      planeGroup.position.copy(startPos);
      planeGroup.lookAt(impactPos);

      crashState = {
        planeGroup, propL, propR, fireCore, fireMat,
        startPos, impactPos,
        elapsed: 0,
        flightDur: 3.2,
        impacted: false,
        smokeTick: 0,
      };
      world?.audioV2?.playAircraftCrash?.(3.2);
      return { impactPos: [ix, iy, iz], flightDur: 3.2 };
    }

    function getAircraftPosition() {
      if (!crashState?.planeGroup?.position) return null;
      const p = crashState.planeGroup.position;
      return [p.x, p.y, p.z];
    }

    function activate(preset) {
      clearCurrent();
      activePreset = preset;
      crashState = null;
      crashRoot = null;
      platformGroup = null;
      platformTiltDeg = 0;
      platformBallastBalanced = false;
      if (preset === 'city_gridlock') buildCityGridlockSetPiece();
      else if (preset === 'rising_water_drydock') buildRisingWaterDrydock();
      else if (preset === 'offshore_platform') buildOffshorePlatform();
    }

    function setVaultZoneLit(zoneIdx) {
      if (vaultLights[zoneIdx]) vaultLights[zoneIdx].intensity = 18;
    }

    function lockWaterLevel() {
      waterLocked = true;
      waterRising = false;
    }

    function stabilizePlatformBallast() {
      platformBallastBalanced = true;
      platformTiltDeg = 0;
      if (platformGroup) platformGroup.rotation.z = 0;
    }

    function update(dt, difficultyId = 'tactical') {
      if (!(dt > 0)) return;
      consolePulseClock += dt;
      if (activeConsoleButtonMat && activeConsoleButtonMat.color) {
        activeConsoleButtonMat.opacity = 0.55 + 0.45 * Math.sin(consolePulseClock * 4.5);
      }
      if (crashState) {
        crashState.elapsed += dt;
        const { planeGroup, propL, propR, fireCore, fireMat, startPos, impactPos, flightDur } = crashState;
        if (!crashState.impacted) {
          const t = Math.min(1, crashState.elapsed / flightDur);
          const ease = t * (0.45 + 0.55 * t);
          planeGroup.position.lerpVectors(startPos, impactPos, ease);
          planeGroup.lookAt(impactPos);
          planeGroup.rotation.z += Math.sin(t * Math.PI * 1.4) * 0.55 + t * 0.35;
          propL.rotation.z += dt * 36;
          propR.rotation.z -= dt * 18;
          crashState.smokeTick += dt;
          if (crashState.smokeTick >= 0.08) {
            crashState.smokeTick = 0;
            world?.fx?.smoke?.(planeGroup.position, { size: 3.4, life: 3.2, color: 0x221f1c, alpha: 0.72, rise: 1.1, count: 2 });
          }
          if (t >= 1) {
            crashState.impacted = true;
            planeGroup.position.copy(impactPos);
            planeGroup.rotation.set(0.18, 0.72, 0.42);
            fireMat.opacity = 0.82;
            world?.disasters?.spawnFireballExplosion?.(impactPos, 2.4);
            world?.fx?.smoke?.(impactPos, { size: 9.5, life: 9.0, color: 0x1a1715, alpha: 0.85, rise: 2.2, count: 14 });
            world?.fx?.sparks?.(impactPos, new Vector3(0, 1, 0), 48);
            world?.player?.addShake?.(0.75);
          }
        } else {
          const flicker = 0.75 + 0.25 * Math.sin(crashState.elapsed * 14);
          fireCore.scale.set(2.2 * flicker, 3.0 * flicker, 2.2 * flicker);
          fireMat.opacity = 0.65 + 0.2 * flicker;
          crashState.smokeTick += dt;
          if (crashState.smokeTick >= 0.45) {
            crashState.smokeTick = 0;
            world?.fx?.smoke?.(impactPos, { size: 5.5, life: 4.5, color: 0x1e1b18, alpha: 0.65, rise: 1.8, count: 2 });
          }
        }
      }
      if (!activePreset) return;
      const diff = DIFFICULTY_PRESETS[difficultyId] || DIFFICULTY_PRESETS.tactical;
      if (activePreset === 'rising_water_drydock' && waterMesh && waterRising && !waterLocked) {
        waterLevel = Math.min(2.85, waterLevel + dt * 0.045 * diff.hazardMultiplier);
        waterMesh.position.y = waterLevel;
      }
      if (activePreset === 'storm_bridge') {
        stormWindClock += dt;
        currentGust = Math.max(0, Math.sin(stormWindClock * 0.55)) * diff.hazardMultiplier;
      } else {
        currentGust = 0;
      }
    }

    return {
      activate,
      setObjectiveBeacon,
      markSubNodeDone,
      markConsoleActivated,
      triggerAircraftCrash,
      getAircraftPosition,
      setVaultZoneLit,
      lockWaterLevel,
      stabilizePlatformBallast,
      update,
      dispose: () => {
        for (const sn of activeSubNodes) sn.human?.actor?.removeFromParent?.();
        activeSubNodes = [];
        beaconGroup = null;
        crashState = null;
        crashRoot = null;
        platformGroup = null;
        clearCurrent();
      },
      get subNodes() { return activeSubNodes; },
      get state() {
        return {
          preset: activePreset,
          waterLevel: Number(waterLevel.toFixed(2)),
          waterLocked,
          platformTiltDeg: Number(platformTiltDeg.toFixed(2)),
          platformBallastBalanced,
          currentGust: Number(currentGust.toFixed(2)),
          aircraftCrashActive: !!crashState,
          aircraftImpacted: !!crashState?.impacted,
        };
      },
    };
  }

  // =========================================================================
  // 5C. 3D-TO-2D GOLDEN TACTICAL WAYPOINT MARKER (Ring + Star + Arrow + Distance)
  // =========================================================================
  function createWaypointOverlay(world) {
    let el = null;
    let distEl = null;
    let arrowEl = null;
    let labelEl = null;
    let lastState = { visible: false, x: 0, y: 0, distM: 0, offscreen: false };

    function ensureDom() {
      if (el || typeof document === 'undefined') return el;
      el = document.createElement('div');
      el.id = 'sl-v2-waypoint';
      el.style.cssText = 'position:fixed;left:0;top:0;z-index:26;pointer-events:none;display:none;transform:translate(-50%,-50%);will-change:transform;';
      el.innerHTML = `
        <div style="position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;">
          <div style="position:relative;width:34px;height:34px;display:flex;align-items:center;justify-content:center;">
            <svg width="34" height="34" viewBox="0 0 34 34" style="filter:drop-shadow(0 0 6px rgba(247,214,116,.85));">
              <circle cx="17" cy="17" r="11.5" fill="rgba(24,18,6,.36)" stroke="#f6d876" stroke-width="2.2"/>
              <path d="M17 8.5 L19.2 14.8 L25.5 17 L19.2 19.2 L17 25.5 L14.8 19.2 L8.5 17 L14.8 14.8 Z" fill="#fff2b8"/>
            </svg>
            <div data-wp-arrow style="position:absolute;inset:-8px;display:none;align-items:center;justify-content:flex-end;">
              <svg width="12" height="14" viewBox="0 0 12 14" style="filter:drop-shadow(0 0 4px rgba(0,0,0,.9));">
                <path d="M2 2 L10 7 L2 12 L4.5 7 Z" fill="#f6d876"/>
              </svg>
            </div>
          </div>
          <div data-wp-dist style="font:700 12px/1 'IBM Plex Mono',ui-monospace,monospace;color:#fff6d1;text-shadow:0 1px 4px rgba(0,0,0,.95),0 0 8px rgba(0,0,0,.85);background:rgba(10,14,18,.58);padding:2px 6px;border-radius:999px;border:1px solid rgba(246,216,118,.42);">0m</div>
          <div data-wp-label style="font:600 10px/1.15 system-ui,-apple-system,sans-serif;color:rgba(246,238,214,.86);text-shadow:0 1px 4px rgba(0,0,0,.95);max-width:150px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></div>
        </div>`;
      document.body.appendChild(el);
      distEl = el.querySelector('[data-wp-dist]');
      arrowEl = el.querySelector('[data-wp-arrow]');
      labelEl = el.querySelector('[data-wp-label]');
      return el;
    }

    function update(targetArr, playerPos, labelText = '') {
      const dom = ensureDom();
      const cam = world?.camera;
      if (!targetArr || !playerPos || !cam) {
        if (dom) dom.style.display = 'none';
        lastState.visible = false;
        return lastState;
      }
      const tx = targetArr[0], ty = (targetArr[1] || 0) + 1.85, tz = targetArr[2];
      const distM = Math.max(0, Math.round(Math.hypot(tx - playerPos.x, tz - playerPos.z)));
      const vw = (typeof window !== 'undefined' && window.innerWidth) || 1280;
      const vh = (typeof window !== 'undefined' && window.innerHeight) || 720;

      let sx = vw * 0.5, sy = vh * 0.45, offscreen = false, angleRad = 0;
      if (world?.THREE?.Vector3 && typeof cam.updateMatrixWorld === 'function') {
        const v = new world.THREE.Vector3(tx, ty, tz);
        v.project(cam);
        const behind = v.z > 1;
        let nx = behind ? -v.x : v.x;
        let ny = behind ? -v.y : v.y;
        offscreen = behind || Math.abs(nx) > 0.92 || Math.abs(ny) > 0.88;
        if (offscreen) {
          const maxC = Math.max(Math.abs(nx), Math.abs(ny), 0.001);
          nx = (nx / maxC) * 0.88;
          ny = (ny / maxC) * 0.82;
          angleRad = Math.atan2(-ny, nx);
        }
        sx = (nx * 0.5 + 0.5) * vw;
        sy = (-ny * 0.5 + 0.5) * vh;
      }

      lastState = { visible: true, x: Math.round(sx), y: Math.round(sy), distM, offscreen };
      if (dom) {
        dom.style.display = 'block';
        dom.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) translate(-50%, -50%)`;
        if (distEl) distEl.textContent = `${distM}m`;
        if (labelEl) {
          labelEl.textContent = offscreen ? '' : (labelText || '').slice(0, 16);
          labelEl.style.display = offscreen ? 'none' : 'block';
        }
        if (arrowEl) {
          arrowEl.style.display = offscreen ? 'flex' : 'none';
          if (offscreen) arrowEl.style.transform = `rotate(${angleRad.toFixed(3)}rad)`;
        }
      }
      return lastState;
    }

    function hide() {
      if (el) el.style.display = 'none';
      lastState.visible = false;
    }

    function dispose() {
      if (el) { el.remove(); el = null; distEl = null; arrowEl = null; labelEl = null; }
      lastState.visible = false;
    }

    return { update, hide, dispose, get state() { return lastState; } };
  }

  // =========================================================================
  // 5D. CAMPAIGN CINEMATIC DIRECTOR (Smooth Easing, Dynamic FOV & 3D Tracking)
  // =========================================================================
  function createCampaignCinematicDirector(world) {
    let activeShot = null;
    let overlayEl = null;
    let savedFov = null;

    function ensureOverlay() {
      if (overlayEl || typeof document === 'undefined') return overlayEl;
      overlayEl = document.createElement('div');
      overlayEl.id = 'sl-v2-cinematic-overlay';
      overlayEl.style.cssText = 'position:fixed;inset:0;z-index:42;pointer-events:none;display:none;transition:opacity .35s ease;';
      overlayEl.innerHTML = `
        <div style="position:absolute;left:0;right:0;top:0;height:56px;background:linear-gradient(180deg,rgba(4,8,12,.94),rgba(4,8,12,0));"></div>
        <div style="position:absolute;left:0;right:0;bottom:0;height:102px;background:linear-gradient(0deg,rgba(4,8,12,.95),rgba(4,8,12,0));display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:18px;gap:6px;">
          <div data-cine-tag style="font:700 11px/1 system-ui;letter-spacing:.26em;text-transform:uppercase;color:#f2c45a;"></div>
          <div data-cine-sub style="font:600 15px/1.35 system-ui;color:#eef5f7;text-shadow:0 2px 10px rgba(0,0,0,.9);max-width:740px;text-align:center;padding:0 18px;"></div>
          <div style="font:500 11px/1 system-ui;color:rgba(216,232,238,.58);letter-spacing:.12em;">按 SPACE 或 ESC 跳过过场动画</div>
        </div>`;
      document.body.appendChild(overlayEl);
      return overlayEl;
    }

    function playShot({
      tag = '', subtitle = '', from, to, lookAtFrom, lookAtTo,
      getFocusPos = null, fovFrom = null, fovTo = null, duration = 4.0, onComplete = null,
    } = {}) {
      const cam = world?.camera;
      if (cam && typeof cam.fov === 'number' && savedFov === null) savedFov = cam.fov;
      activeShot = {
        tag, subtitle,
        from: from || [0, 12, 0],
        to: to || [0, 2, 0],
        lookAtFrom: lookAtFrom || [0, 1.5, -10],
        lookAtTo: lookAtTo || lookAtFrom || [0, 1.5, -10],
        getFocusPos,
        fovFrom: fovFrom ?? (savedFov ? savedFov - 6 : null),
        fovTo: fovTo ?? savedFov,
        duration: Math.max(1.2, duration),
        elapsed: 0,
        onComplete,
      };
      const el = ensureOverlay();
      if (el) {
        el.style.display = 'block';
        const tagEl = el.querySelector('[data-cine-tag]');
        const subEl = el.querySelector('[data-cine-sub]');
        if (tagEl) tagEl.textContent = tag;
        if (subEl) subEl.textContent = subtitle;
      }
      return true;
    }

    function playChapterIntro(chapter, onComplete = null) {
      if (!chapter) return false;
      const sp = chapter.spawn || [-26, 0.25, -42];
      const tgt = chapter.objectives?.[0]?.target || [sp[0], sp[1], sp[2] - 18];
      world?.audioV2?.playChapterIntro?.(chapter.number || 1);
      return playShot({
        tag: `${chapter.titleZh} · 入场镜头`,
        subtitle: chapter.transitionZh || chapter.landmarkZh || '',
        from: [sp[0] + 24, (sp[1] || 0) + 19, sp[2] + 26],
        to: [sp[0], (sp[1] || 0) + 1.65, sp[2]],
        lookAtFrom: [tgt[0], (tgt[1] || 0) + 3.0, tgt[2]],
        lookAtTo: [tgt[0], (tgt[1] || 0) + 1.4, tgt[2]],
        duration: 4.5,
        onComplete,
      });
    }

    function playStoryEventCutscene({ tag, subtitle, focusPos, getFocusPos = null, duration = 3.8, onComplete = null } = {}) {
      const fp = focusPos || [0, 1.5, 0];
      return playShot({
        tag: tag || '剧情事件',
        subtitle: subtitle || '',
        from: [fp[0] + 16, (fp[1] || 0) + 10, fp[2] + 18],
        to: [fp[0] - 9, (fp[1] || 0) + 6.5, fp[2] + 15],
        lookAtFrom: [fp[0], (fp[1] || 0) + 2.4, fp[2]],
        lookAtTo: [fp[0], (fp[1] || 0) + 1.5, fp[2]],
        getFocusPos,
        duration,
        onComplete,
      });
    }

    function restoreFov() {
      const cam = world?.camera;
      if (cam && savedFov !== null && typeof cam.fov === 'number') {
        cam.fov = savedFov;
        cam.updateProjectionMatrix?.();
        savedFov = null;
      }
    }

    function skip() {
      if (!activeShot) return false;
      const cb = activeShot.onComplete;
      activeShot = null;
      restoreFov();
      if (overlayEl) overlayEl.style.display = 'none';
      if (typeof cb === 'function') { try { cb(); } catch {} }
      return true;
    }

    function update(dt) {
      if (!activeShot || !(dt > 0)) return false;
      activeShot.elapsed += dt;
      const t = Math.min(1, activeShot.elapsed / activeShot.duration);
      // Quintic smootherstep for cinema-grade acceleration/deceleration
      const ease = t * t * t * (t * (t * 6 - 15) + 10);
      const cam = world?.camera;
      if (cam?.position && cam?.lookAt) {
        const lerp = (a, b) => a + (b - a) * ease;
        const swayX = Math.sin(activeShot.elapsed * 1.4) * 0.14 * (1 - t);
        const swayY = Math.cos(activeShot.elapsed * 1.1) * 0.10 * (1 - t);
        cam.position.set(
          lerp(activeShot.from[0], activeShot.to[0]) + swayX,
          lerp(activeShot.from[1], activeShot.to[1]) + swayY,
          lerp(activeShot.from[2], activeShot.to[2])
        );
        const dynFocus = typeof activeShot.getFocusPos === 'function' ? activeShot.getFocusPos() : null;
        if (dynFocus) {
          cam.lookAt(dynFocus[0], dynFocus[1], dynFocus[2]);
        } else {
          cam.lookAt(
            lerp(activeShot.lookAtFrom[0], activeShot.lookAtTo[0]),
            lerp(activeShot.lookAtFrom[1], activeShot.lookAtTo[1]),
            lerp(activeShot.lookAtFrom[2], activeShot.lookAtTo[2])
          );
        }
        if (activeShot.fovFrom !== null && activeShot.fovTo !== null && typeof cam.fov === 'number') {
          cam.fov = lerp(activeShot.fovFrom, activeShot.fovTo);
          cam.updateProjectionMatrix?.();
        }
      }
      if (t >= 1) skip();
      return !!activeShot;
    }

    function dispose() {
      activeShot = null;
      restoreFov();
      if (overlayEl) { overlayEl.remove(); overlayEl = null; }
    }

    return {
      playShot,
      playChapterIntro,
      playStoryEventCutscene,
      skip,
      update,
      dispose,
      get active() { return !!activeShot; },
    };
  }

  // =========================================================================
  // 5E. [H] NPC TACTICAL COMMAND PANEL (Order Squad NPCs to Follow, Operate,
  //     Hold, Patrol, or Radio Report + Point Way)
  // =========================================================================
  // Tactical Squad Commands (NPCs NEVER complete mission objectives for the player; only tactical/free-mission roles!)
  const NPC_COMMAND_PRESETS = Object.freeze([
    { id: 'follow', key: '1', labelZh: '跟随掩护', descZh: '紧跟主角推进并随时警戒', behavior: 'follow', voiceId: 'cmd_follow' },
    { id: 'hold', key: '2', labelZh: '原地待命警戒', descZh: '在当前位置警戒防守', behavior: 'hold', voiceId: 'cmd_hold' },
    { id: 'patrol_area', key: '3', labelZh: '周边巡逻侦察', descZh: '在附近区域自主巡逻侦察', behavior: 'patrol_area', voiceId: 'cmd_patrol' },
    { id: 'radio_report', key: '4', labelZh: '电台汇报指路', descZh: '电台回报局势并指向任务点', behavior: 'radio_report', voiceId: 'cmd_report' },
  ]);

  const TACTICAL_FREE_ACTIONS = new Set([
    'reach_and_talk', 'escape_event', 'nature_explore', 'storm_traverse',
    'finale_stage1', 'finale_stage2', 'epilogue_walk', 'epilogue_complete',
  ]);
  function isTacticalCommandAllowed(chapter, objective) {
    if (!chapter || !objective) return true;
    return TACTICAL_FREE_ACTIONS.has(String(objective.action || ''))
      || chapter.primaryGameplay === 'city_exploration'
      || chapter.primaryGameplay === 'natural_exploration';
  }

  function createNpcCommandController(world, charCtrl, getMissionContext = null) {
    let open = false;
    let lastOrderId = 'follow';
    let panelEl = null;
    function isCommandAllowed() {
      const ctx = typeof getMissionContext === 'function' ? getMissionContext() : null;
      if (!ctx) return true;
      return isTacticalCommandAllowed(ctx.chapter, ctx.objective);
    }

    function ensurePanel() {
      if (panelEl || typeof document === 'undefined') return panelEl;
      panelEl = document.createElement('div');
      panelEl.id = 'sl-v2-npc-cmd';
      panelEl.style.cssText = 'position:fixed;right:3.5vw;top:50%;transform:translateY(-50%);z-index:38;width:min(340px,42vw);padding:0;color:#f4f7fa;font-family:system-ui,-apple-system,"PingFang SC",sans-serif;display:none;pointer-events:auto;';
      panelEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 14px;margin-bottom:8px;background:linear-gradient(90deg,rgba(10,15,24,.84) 0%,rgba(10,15,24,.48) 78%,rgba(10,15,24,0) 100%);border-left:2px solid #f3d284;border-bottom:1px solid rgba(243,210,132,.28);backdrop-filter:blur(10px);">
          <div style="font-size:12.5px;font-weight:700;letter-spacing:.14em;color:#f3d284;">◆ 战术小队指令</div>
          <div style="font-size:11px;color:rgba(224,234,244,.66);">[1-4] / [H] 关闭</div>
        </div>
        <div data-cmd-list style="display:flex;flex-direction:column;gap:8px;"></div>
        <div data-cmd-status style="margin-top:9px;padding:5px 12px;font-size:11px;color:#f3d284;letter-spacing:.05em;background:linear-gradient(90deg,rgba(10,15,24,.68) 0%,rgba(10,15,24,0) 100%);"></div>`;
      const list = panelEl.querySelector('[data-cmd-list]');
      for (const cmd of NPC_COMMAND_PRESETS) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.npcOrder = cmd.id;
        btn.style.cssText = 'display:flex;align-items:center;gap:11px;width:100%;text-align:left;padding:10px 14px;background:linear-gradient(90deg,rgba(12,17,26,.86) 0%,rgba(12,17,26,.64) 74%,rgba(12,17,26,.16) 100%);backdrop-filter:blur(10px);border:none;border-top:1px solid rgba(255,255,255,.18);border-bottom:1px solid rgba(255,255,255,.14);border-left:2px solid rgba(243,210,132,.48);color:#f3f6fa;cursor:pointer;font-size:13px;transition:transform .16s ease,background .16s ease,border-color .16s ease;box-shadow:0 6px 20px rgba(0,0,0,.34);';
        btn.innerHTML = `<span data-cmd-key style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:3px;background:rgba(255,255,255,.92);color:#0b1018;font-weight:800;font-size:11.5px;flex:none;">${cmd.key}</span><span style="flex:1;"><strong style="display:block;font-size:13px;font-weight:600;letter-spacing:.04em;">${cmd.labelZh}</strong><span style="font-size:11px;color:rgba(218,230,240,.68);">${cmd.descZh}</span></span>`;
        btn.addEventListener('mouseenter', () => {
          btn.style.transform = 'translateX(-7px)';
          btn.style.borderLeftColor = '#f3d284';
          btn.style.borderTopColor = 'rgba(243,210,132,.78)';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.transform = 'translateX(0)';
          refreshStatus();
        });
        btn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          issueOrder(cmd.id);
          setOpen(false);
        });
        list.appendChild(btn);
      }
      document.body.appendChild(panelEl);
      return panelEl;
    }

    function refreshStatus() {
      if (!panelEl) return;
      const st = panelEl.querySelector('[data-cmd-status]');
      const cast = charCtrl?.cast || [];
      const allowed = isCommandAllowed();
      const orderMeta = NPC_COMMAND_PRESETS.find(c => c.id === lastOrderId);
      if (st) {
        st.textContent = !allowed
          ? '◆ 当前为剧情/专属任务阶段，队友由任务路线自动协同（自由/防守阶段可指挥）'
          : (cast.length ? `◆ 当前小队 (${cast.length}人) · 执行中：${orderMeta?.labelZh || lastOrderId}` : '当前章节暂无可指挥队友');
      }
      for (const btn of panelEl.querySelectorAll('[data-npc-order]')) {
        const active = btn.dataset.npcOrder === lastOrderId;
        btn.style.opacity = allowed ? '1' : '0.45';
        btn.style.borderLeftColor = active ? '#f3d284' : 'rgba(243,210,132,.42)';
        btn.style.borderTopColor = active ? 'rgba(243,210,132,.75)' : 'rgba(255,255,255,.18)';
        btn.style.borderBottomColor = active ? 'rgba(243,210,132,.65)' : 'rgba(255,255,255,.14)';
        btn.style.background = active
          ? 'linear-gradient(90deg,rgba(243,210,132,.26) 0%,rgba(22,30,42,.80) 76%,rgba(12,17,26,.22) 100%)'
          : 'linear-gradient(90deg,rgba(12,17,26,.86) 0%,rgba(12,17,26,.64) 74%,rgba(12,17,26,.16) 100%)';
        const keyBadge = btn.querySelector('[data-cmd-key]');
        if (keyBadge) keyBadge.style.background = active ? '#f3d284' : 'rgba(255,255,255,.92)';
      }
    }

    function setOpen(nextOpen) {
      open = !!nextOpen;
      const dom = ensurePanel();
      if (dom) {
        dom.style.display = open ? 'block' : 'none';
        if (open) refreshStatus();
      }
      if (open) world?.audioV2?.playButtonPress?.();
      return open;
    }

    function toggle() {
      return setOpen(!open);
    }

    function issueOrder(orderId) {
      if (!isCommandAllowed()) {
        world?.tactical?.notify?.('当前为剧情任务阶段，队友按任务路线协同行动', 'Mission-driven AI', true, 2.6);
        return null;
      }
      const cmd = NPC_COMMAND_PRESETS.find(c => c.id === orderId || c.key === String(orderId));
      if (!cmd) return null;
      lastOrderId = cmd.id;
      charCtrl?.issueSquadOrder?.(cmd.behavior);
      world?.audioV2?.playButtonPress?.();
      if (world?.voiceMgr) {
        world.voiceMgr.playLine(cmd.voiceId);
      } else {
        world?.tactical?.notify?.(`队友指令：${cmd.labelZh}`, cmd.labelZh, true, 3.0);
      }
      refreshStatus();
      return cmd;
    }

    function dispose() {
      open = false;
      if (panelEl) { panelEl.remove(); panelEl = null; }
    }

    return {
      presets: NPC_COMMAND_PRESETS,
      isCommandAllowed,
      toggle,
      setOpen,
      issueOrder,
      dispose,
      get open() { return open; },
      get lastOrderId() { return lastOrderId; },
    };
  }

  // =========================================================================
  // 6. ACTIVE CHARACTER BEHAVIOR CONTROLLER (Autonomous Patrol, Console Work,
  //    Pointing, Waving, Radio Calls & Player [H] Tactical Orders)
  // =========================================================================
  function createCharacterBehaviorController(world) {
    const activeActors = new Map();

    function spawnChapterCast(chapter) {
      disposeCast();
      if (!world?.THREE || !world?.scene || typeof window.createSaltlineHuman !== 'function') return;
      const castIds = (chapter.characters || []).filter(id => id !== 'lin');
      const [sx, sy, sz] = chapter.spawn || [0, 0.25, 0];
      const obj0 = chapter.objectives?.[0]?.target || [sx, sy, sz - 12];
      castIds.forEach((cid, i) => {
        const meta = SALTLINE_CHARACTERS.find(c => c.id === cid);
        if (!meta) return;
        const human = window.createSaltlineHuman(world.THREE, {
          name: `cast-${cid}`,
          role: meta.id === 'linwan' ? 'medic' : meta.id === 'chen' ? 'worker' : (meta.id === 'mara' || meta.id === 'ward') ? 'operator' : 'engineer',
          armed: Boolean(meta.armed),
          modelType: meta.modelType,
          coat: meta.coat,
          variation: i % 3,
        });
        const angle = (i - (castIds.length - 1) / 2) * 0.9;
        if (i === 1) {
          human.actor.position.set(obj0[0] + 1.6, obj0[1] || sy, obj0[2] + 1.4);
        } else {
          human.actor.position.set(sx + 3.0 + Math.cos(angle) * 1.4, sy, sz - 3.2 + Math.sin(angle) * 1.4);
        }
        human.actor.rotation.y = Math.atan2(obj0[0] - human.actor.position.x, obj0[2] - human.actor.position.z);
        world.scene.add(human.actor);
        activeActors.set(cid, {
          meta,
          human,
          behavior: i === 0 ? 'follow' : (i === 1 ? 'inspect_console' : 'patrol_area'),
          emotion: 'focused',
          homePos: { x: human.actor.position.x, z: human.actor.position.z },
          actionTimer: 2.5 + i * 1.4,
          ackTimer: 0,
          ackAnim: null,
          patrolAngle: i * 1.6,
          currentAnim: 'aim_guard',
          inVehicle: false,
          age: i * 1.3,
          stride: 0,
        });
      });
    }

    function setBehavior(charId, behavior, emotion = 'focused') {
      const rec = activeActors.get(charId);
      if (!rec) return;
      rec.behavior = behavior;
      rec.emotion = emotion;
      if (behavior === 'patrol_area' || behavior === 'hold') {
        rec.homePos = { x: rec.human.actor.position.x, z: rec.human.actor.position.z };
      }
    }

    const ORDER_ACK_ANIMS = {
      follow: 'wave_follow',
      operate_objective: 'point_ahead',
      hold: 'salute',
      patrol_area: 'radio_call',
      radio_report: 'radio_call',
    };

    function issueSquadOrder(behavior) {
      let count = 0;
      for (const rec of activeActors.values()) {
        rec.behavior = behavior;
        rec.actionTimer = 0;
        rec.ackTimer = 1.65;
        rec.ackAnim = ORDER_ACK_ANIMS[behavior] || 'salute';
        rec.currentAnim = rec.ackAnim;
        if (behavior === 'patrol_area' || behavior === 'hold') {
          rec.homePos = { x: rec.human.actor.position.x, z: rec.human.actor.position.z };
        }
        count++;
      }
      return count;
    }

    function update(dt, playerPos, objectivePos) {
      if (!playerPos || !(dt > 0)) return;
      const veh = world?.vehicle;
      const playerDriving = Boolean(veh?.driving);
      let seatIdx = 0;
      let exitIdx = 0;
      for (const rec of activeActors.values()) {
        rec.age += dt;
        rec.actionTimer -= dt;
        const pos = rec.human.actor.position;

        // Automatically board SAR 4x4 passenger seats when player drives
        if (playerDriving && rec.behavior !== 'hold') {
          const seat = typeof veh?.getPassengerSeat === 'function'
            ? veh.getPassengerSeat(seatIdx++)
            : { pos: { x: playerPos.x + 0.5, y: playerPos.y + 0.33, z: playerPos.z }, yaw: (world?.player?.yaw || 0) + Math.PI };
          rec.inVehicle = true;
          pos.set(seat.pos.x, seat.pos.y, seat.pos.z);
          rec.human.actor.rotation.y = seat.yaw;
          rec.currentAnim = 'seated';
          rec.human.pose('seated', 0, rec.age, false, dt);
          continue;
        } else if (rec.inVehicle) {
          rec.inVehicle = false;
          const exitPos = typeof veh?.getExitPos === 'function'
            ? veh.getExitPos(exitIdx++)
            : { x: playerPos.x + 2.2, y: playerPos.y, z: playerPos.z };
          pos.set(exitPos.x, exitPos.y, exitPos.z);
          rec.human.actor.rotation.y = veh?.yaw ?? 0;
          rec.currentAnim = 'aim_guard';
          rec.human.pose('aim_guard', 0, rec.age, false, dt);
          continue;
        }

        // Immediate visible tactical hand-signal acknowledgment on [H] squad order
        if (rec.ackTimer > 0 && rec.ackAnim) {
          rec.ackTimer -= dt;
          rec.currentAnim = rec.ackAnim;
          if (rec.ackAnim === 'point_ahead' && objectivePos) {
            rec.human.actor.rotation.y = Math.atan2(objectivePos.x - pos.x, objectivePos.z - pos.z);
          } else {
            rec.human.actor.rotation.y = Math.atan2(playerPos.x - pos.x, playerPos.z - pos.z);
          }
          rec.human.pose(rec.currentAnim, 0, rec.age, false, dt);
          continue;
        }

        const distPlayer = Math.hypot(playerPos.x - pos.x, playerPos.z - pos.z);
        let target = null;

        if (rec.behavior === 'follow') {
          if (distPlayer > 4.2) target = playerPos;
        } else if ((rec.behavior === 'lead' || rec.behavior === 'operate_objective') && objectivePos) {
          target = objectivePos;
        } else if (rec.behavior === 'patrol_area') {
          rec.patrolAngle = (rec.patrolAngle || 0) + dt * 0.42;
          const px = rec.homePos.x + Math.cos(rec.patrolAngle) * 6.5;
          const pz = rec.homePos.z + Math.sin(rec.patrolAngle) * 6.5;
          if (Math.hypot(px - pos.x, pz - pos.z) > 0.45) target = { x: px, z: pz };
        }

        if (target) {
          const dx = target.x - pos.x, dz = target.z - pos.z;
          const d = Math.hypot(dx, dz);
          const stopDist = rec.behavior === 'patrol_area' ? 0.35 : 2.1;
          if (d > stopDist) {
            const run = rec.behavior === 'operate_objective' ? d > 4.5 : d > 8.0;
            const spd = Math.min(d - stopDist * 0.5, dt * (run ? 5.6 : 3.2));
            pos.x += (dx / d) * spd;
            pos.z += (dz / d) * spd;
            rec.human.actor.rotation.y = Math.atan2(dx, dz);
            rec.stride += spd * 4.5;
            rec.currentAnim = run ? 'run' : 'walk';
            rec.human.pose(rec.currentAnim, rec.stride, rec.age, true, dt);
            continue;
          }
        }

        if (rec.behavior === 'talk') {
          rec.currentAnim = 'talk';
        } else if (rec.behavior === 'hold') {
          rec.currentAnim = 'aim_guard';
        } else if (rec.behavior === 'radio_report') {
          rec.currentAnim = Math.floor(rec.age / 2.4) % 2 === 0 ? 'radio_call' : 'point_ahead';
        } else if (rec.behavior === 'inspect_console' || rec.behavior === 'operate_objective') {
          if (distPlayer < 5.5 && rec.actionTimer <= 0) {
            rec.currentAnim = rec.currentAnim === 'point_ahead' ? 'inspect_console' : 'point_ahead';
            rec.actionTimer = 4.0;
          } else if (distPlayer >= 5.5 || rec.behavior === 'operate_objective') {
            rec.currentAnim = 'inspect_console';
          }
        } else if (rec.behavior === 'follow') {
          if (rec.actionTimer <= 0) {
            const pool = ['aim_guard', 'aim_guard', 'radio_call', 'point_ahead'];
            rec.currentAnim = pool[Math.floor((rec.age * 10) % pool.length)];
            rec.actionTimer = 3.8 + (rec.age % 2.8);
          }
        } else if (rec.actionTimer <= 0) {
          const pool = distPlayer < 7 ? ['wave_follow', 'point_ahead', 'radio_call', 'aim_guard'] : ['aim_guard', 'radio_call'];
          rec.currentAnim = pool[Math.floor((rec.age * 10) % pool.length)];
          rec.actionTimer = 4.2 + (rec.age % 3.0);
        }

        if (rec.behavior === 'talk') {
          rec.human.actor.rotation.y = Math.atan2(playerPos.x - pos.x, playerPos.z - pos.z);
        } else if (objectivePos) {
          // Face forward toward the mission objective / tactical perimeter instead of staring at the player!
          const objYaw = Math.atan2(objectivePos.x - pos.x, objectivePos.z - pos.z);
          const scan = rec.currentAnim === 'aim_guard' ? Math.sin(rec.age * 0.55) * 0.22 : 0;
          rec.human.actor.rotation.y = objYaw + scan;
        }
        rec.human.pose(rec.currentAnim, 0, rec.age, false, dt);
      }
    }

    function disposeCast() {
      for (const rec of activeActors.values()) {
        rec.human?.actor?.removeFromParent?.();
      }
      activeActors.clear();
    }

    return {
      spawnChapterCast,
      setBehavior,
      issueSquadOrder,
      update,
      disposeCast,
      get cast() { return [...activeActors.values()].map(r => ({ id: r.meta.id, behavior: r.behavior, anim: r.currentAnim, emotion: r.emotion })); },
    };
  }

  // =========================================================================
  // 6B. TRUE 7-MECHANIC OBJECTIVE DIFFERENTIATION ENGINE (Zero Generic Console)
  // =========================================================================
  const OBJECTIVE_MECHANIC_MAP = Object.freeze({
    reach_and_talk: 'dialogue',
    dialogue: 'dialogue',
    story_dialogue: 'dialogue',
    story_reveal: 'dialogue',
    relationship_beat: 'dialogue',
    character_confrontation: 'dialogue',
    epilogue_farewell: 'dialogue',
    drive_route: 'driving_gates',
    mountain_drive: 'driving_gates',
    finale_stage2: 'driving_gates',
    assist_npc: 'survivor_rescue',
    rescue_group: 'survivor_rescue',
    flood_rescue: 'survivor_rescue',
    storm_rescue: 'survivor_rescue',
    evacuate_crew: 'survivor_rescue',
    puzzle_switches: 'multi_switch_puzzle',
    power_puzzle: 'multi_switch_puzzle',
    valve_lock: 'multi_switch_puzzle',
    coop_console: 'multi_switch_puzzle',
    platform_ballast: 'multi_switch_puzzle',
    finale_stage1: 'multi_switch_puzzle',
    escape_event: 'storm_climb_traversal',
    multilevel_climb: 'storm_climb_traversal',
    nature_explore: 'storm_climb_traversal',
    storm_traverse: 'storm_climb_traversal',
    epilogue_walk: 'storm_climb_traversal',
    branch_choice: 'branch_choice',
    power_allocation: 'branch_choice',
    finale_choice: 'branch_choice',
    event_trigger: 'hold_repair',
    repair: 'hold_repair',
    dynamic_rail_event: 'hold_repair',
    facility_restore: 'hold_repair',
    boat_launch: 'hold_repair',
    platform_finale: 'hold_repair',
    restore_district_power: 'hold_repair',
    present_evidence: 'hold_repair',
    briefing_lock: 'hold_repair',
    epilogue_complete: 'hold_repair',
  });

  function resolveObjectiveMechanic(action) {
    return OBJECTIVE_MECHANIC_MAP[String(action || '')] || 'hold_repair';
  }

  // =========================================================================
  // 7. UNIFIED CAMPAIGN CONTROLLER (Bridges 14 Chapters into Saltline Runtime)
  // =========================================================================
  function getChapterStoryBrief(chapterId) {
    const ch = SALTLINE_CHAPTERS.find(c => c.id === chapterId) || SALTLINE_CHAPTERS[0];
    const people = (ch.characters || []).map(id => SALTLINE_CHARACTERS.find(c => c.id === id)?.nameZh).filter(Boolean).join('、');
    return {
      chapterId: ch.id,
      titleZh: ch.titleZh,
      whatHappened: ch.transitionZh,
      whyItMatters: ch.descriptionZh,
      keyPeople: people || '林恩、玛拉',
      yourRole: ch.objectives?.[0]?.titleZh || ch.shortZh,
    };
  }

  function createSaltlineCampaignV2(world, { storage } = {}) {
    const saveMgr = createCampaignSaveManager(storage);
    const setPieces = createChapterSetPieceManager(world);
    const waypoint = createWaypointOverlay(world);
    const cinematics = createCampaignCinematicDirector(world);
    const charCtrl = createCharacterBehaviorController(world);

    let activeChapter = null;
    let objectiveIdx = 0;
    const npcCommands = createNpcCommandController(world, charCtrl, () => ({
      chapter: activeChapter,
      objective: activeChapter?.objectives?.[objectiveIdx] || null,
    }));
    let active = false;
    let sessionTimeAccum = 0;
    let objState = null;
    let choiceOverlayEl = null;
    const listeners = new Set();

    function emit(event, payload) {
      for (const fn of listeners) {
        try { fn(event, payload); } catch {}
      }
    }

    function closeChoiceOverlay() {
      if (choiceOverlayEl) { choiceOverlayEl.remove(); choiceOverlayEl = null; }
    }

    function openBranchChoiceOverlay(ch, obj, onPick) {
      const choices = Array.isArray(obj.choices) && obj.choices.length ? obj.choices : [
        { id: 'priority_civic', labelZh: '优先保障战地医院与市民避难所供电' },
        { id: 'priority_harbor', labelZh: '优先保障港口防潮抽水与基础设施稳定' },
      ];
      if (typeof document === 'undefined') { onPick(choices[0].id); return; }
      closeChoiceOverlay();
      try { document.exitPointerLock?.(); } catch {}
      if (world?.player) world.player.enabled = false;
      choiceOverlayEl = document.createElement('div');
      choiceOverlayEl.id = 'sl-v2-branch-choice';
      choiceOverlayEl.style.cssText = 'position:fixed;inset:0;z-index:54;background:linear-gradient(180deg,rgba(6,9,15,.42) 0%,rgba(6,9,15,.88) 100%);backdrop-filter:blur(6px);display:flex;flex-direction:column;justify-content:flex-end;align-items:center;padding:42px 24px 48px;color:#f5f7fa;font-family:system-ui,-apple-system,"PingFang SC",sans-serif;';
      choiceOverlayEl.innerHTML = `
        <div style="text-align:center;max-width:740px;margin-bottom:24px;">
          <div style="font-size:12px;font-weight:700;letter-spacing:.22em;color:#f3d284;margin-bottom:6px;">◆ ${ch.titleZh} · 关键剧情抉择</div>
          <div style="width:240px;height:1px;background:linear-gradient(90deg,transparent,#f3d284,transparent);margin:0 auto 12px;"></div>
          <div style="font-size:18px;font-weight:600;line-height:1.6;">${obj.titleZh}</div>
        </div>
        <div data-bc-list style="width:min(580px,90vw);display:flex;flex-direction:column;gap:12px;"></div>`;
      const list = choiceOverlayEl.querySelector('[data-bc-list]');
      choices.forEach((c, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.style.cssText = 'display:flex;align-items:center;gap:14px;padding:15px 18px;background:linear-gradient(90deg,rgba(12,17,26,.92) 0%,rgba(12,17,26,.72) 82%,rgba(12,17,26,.28) 100%);border:none;border-top:1px solid rgba(255,255,255,.22);border-bottom:1px solid rgba(255,255,255,.18);border-left:3px solid #f3d284;color:#f7f9fc;font-size:14.5px;text-align:left;cursor:pointer;transition:transform .16s ease,background .16s ease;';
        btn.innerHTML = `<span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:4px;background:#f3d284;color:#0b1018;font-weight:800;flex:none;">${idx + 1}</span><span>${c.labelZh}</span>`;
        btn.addEventListener('mouseenter', () => { btn.style.transform = 'translateX(-8px)'; });
        btn.addEventListener('mouseleave', () => { btn.style.transform = 'translateX(0)'; });
        btn.addEventListener('click', () => {
          closeChoiceOverlay();
          if (world?.player) world.player.enabled = true;
          try { world?.input?.requestLock?.(); } catch {}
          onPick(c.id);
        });
        list.appendChild(btn);
      });
      document.body.appendChild(choiceOverlayEl);
    }

    function setupObjectiveMechanic(ch, obj, originPos = null) {
      closeChoiceOverlay();
      if (!obj) { objState = null; return null; }
      const mechanic = resolveObjectiveMechanic(obj.action);
      const nodes = setPieces.setObjectiveBeacon?.(obj.target, obj.action, { mechanic, originPos }) || [
        { id: 'node_0', pos: obj.target, labelZh: obj.titleZh, done: false },
      ];
      objState = {
        objectiveId: obj.id,
        action: obj.action,
        mechanic,
        nodes,
        stepIdx: 0,
        totalSteps: nodes.length,
        holdSec: 0,
        holdTarget: mechanic === 'hold_repair' ? 2.0 : 0,
        cooldown: 0,
        pendingModal: false,
      };
      return objState;
    }

    function getActiveWaypointTarget() {
      const curObj = activeChapter?.objectives?.[objectiveIdx];
      if (!curObj) return null;
      const node = objState?.nodes?.[objState.stepIdx];
      return node?.pos || curObj.target || null;
    }

    function startChapter(chapterId, { objectiveIndex = 0, slotId = saveMgr.getActiveSlotId(), skipCutscene = false } = {}) {
      const ch = SALTLINE_CHAPTERS.find(c => c.id === chapterId) || SALTLINE_CHAPTERS[0];
      activeChapter = ch;
      objectiveIdx = Math.max(0, Math.min(ch.objectives.length - 1, objectiveIndex));
      active = true;
      sessionTimeAccum = 0;
      saveMgr.setActiveSlotId(slotId);
      saveMgr.saveCheckpoint(ch.id, objectiveIdx, ch.spawn, slotId);

      setPieces.activate(ch.scenePreset);
      const firstObj = ch.objectives?.[objectiveIdx];
      setupObjectiveMechanic(ch, firstObj, ch.spawn);
      world?.audioV2?.setAmbience?.(ch.weather || 'overcast_mist');
      if (world?.openWorld?.setSkyPreset) world.openWorld.setSkyPreset(ch.skyPreset, true);
      if (world?.player?.pos && ch.spawn) {
        world.player.pos.set(ch.spawn[0], ch.spawn[1], ch.spawn[2]);
        world.player.vel?.set?.(0, 0, 0);
        world.openWorld?.warmUpSync?.(world.player.pos);
      }
      charCtrl.spawnChapterCast(ch);
      if (!skipCutscene) {
        cinematics.playChapterIntro(ch);
      }
      emit('chapter:start', { chapter: ch, objectiveIdx, skipCutscene });
      return { chapter: ch, objectiveIdx };
    }

    function advanceObjective({ choiceId = null } = {}) {
      if (!active || !activeChapter) return null;
      const curObj = activeChapter.objectives[objectiveIdx];
      if (choiceId) saveMgr.recordChoice(activeChapter.id, choiceId);

      setPieces.markConsoleActivated?.();
      const act = String(curObj?.action || '');
      if (/valve|ballast|flood/i.test(act)) world?.audioV2?.playValveTurn?.();
      else if (/power|repair|restore|grid/i.test(act)) world?.audioV2?.playBreakerThrow?.();
      else world?.audioV2?.playButtonPress?.();

      if (activeChapter.scenePreset === 'underground_vault') setPieces.setVaultZoneLit(objectiveIdx);
      if (activeChapter.scenePreset === 'rising_water_drydock' && objectiveIdx >= 2) setPieces.lockWaterLevel();
      if (activeChapter.scenePreset === 'offshore_platform' && objectiveIdx === 0) setPieces.stabilizePlatformBallast?.();

      // Trigger dramatic story-driven open-world Aircraft Crash & dynamic tracking cutscene
      let triggeredEvent = null;
      if ((activeChapter.id === 'ch01' && objectiveIdx === 2) || (activeChapter.id === 'ch02' && objectiveIdx === 1) || (activeChapter.id === 'ch09' && objectiveIdx === 0)) {
        const crashPoint = [
          (curObj?.target?.[0] || -20) + 18,
          0.25,
          (curObj?.target?.[2] || -60) - 22,
        ];
        setPieces.triggerAircraftCrash(crashPoint);
        cinematics.playStoryEventCutscene({
          tag: '突发空难 · 应急运输机迫降坠毁',
          subtitle: '盐线沿海空域一架应急运输机受电磁干扰失控坠毁在前方街区！',
          focusPos: crashPoint,
          getFocusPos: () => setPieces.getAircraftPosition() || crashPoint,
          duration: 4.8,
        });
        triggeredEvent = 'aircraft_crash';
      } else if (curObj?.target) {
        world?.audioV2?.playObjectiveComplete?.();
        cinematics.playStoryEventCutscene({
          tag: `${activeChapter.shortZh} · 剧情推进`,
          subtitle: `已完成：${curObj.titleZh}`,
          focusPos: curObj.target,
          duration: 2.6,
        });
      }

      if (objectiveIdx + 1 < activeChapter.objectives.length) {
        const prevPos = curObj?.target || activeChapter.spawn;
        objectiveIdx++;
        const nextObj = activeChapter.objectives[objectiveIdx];
        setupObjectiveMechanic(activeChapter, nextObj, prevPos);
        saveMgr.saveCheckpoint(activeChapter.id, objectiveIdx, nextObj.target);
        emit('objective:advance', { chapter: activeChapter, objectiveIdx, objective: nextObj, triggeredEvent });
        return { completedChapter: false, chapter: activeChapter, objectiveIdx, objective: nextObj, triggeredEvent };
      }

      world?.audioV2?.playChapterComplete?.();
      const finished = activeChapter;
      const updatedSlot = saveMgr.completeChapter(finished.id);
      const nextIdx = SALTLINE_CHAPTERS.findIndex(c => c.id === finished.id) + 1;
      const nextChapter = SALTLINE_CHAPTERS[nextIdx] || null;
      objState = null;
      emit('chapter:complete', { chapter: finished, nextChapter, slot: updatedSlot, triggeredEvent });
      return { completedChapter: true, chapter: finished, nextChapter, slot: updatedSlot, triggeredEvent };
    }

    function tickInteraction(dt, playerPos, interactDown, { setPrompt = null, onAdvance = null } = {}) {
      if (!active || !activeChapter || !objState || !playerPos) {
        setPrompt?.(null);
        return null;
      }
      if (objState.cooldown > 0) objState.cooldown = Math.max(0, objState.cooldown - dt);
      if (objState.pendingModal) { setPrompt?.(null); return null; }
      const curObj = activeChapter.objectives[objectiveIdx];
      const node = objState.nodes[objState.stepIdx];
      if (!curObj || !node) { setPrompt?.(null); return null; }

      const dist = Math.hypot(node.pos[0] - playerPos.x, node.pos[2] - playerPos.z);
      const finishStepOrObj = (choiceId = null) => {
        setPieces.markSubNodeDone?.(objState.stepIdx);
        if (objState.stepIdx + 1 < objState.totalSteps) {
          objState.stepIdx++;
          objState.holdSec = 0;
          objState.cooldown = 0.55;
          world?.audioV2?.playButtonPress?.();
          world?.tactical?.notify?.(`✓ 完成 ${node.labelZh}（${objState.stepIdx}/${objState.totalSteps}）`, `Step ${objState.stepIdx}/${objState.totalSteps}`, true, 2.4);
          return { subStepAdvanced: true, stepIdx: objState.stepIdx, totalSteps: objState.totalSteps };
        }
        objState.cooldown = 1.1;
        const res = advanceObjective({ choiceId });
        onAdvance?.(res);
        return res;
      };

      const m = objState.mechanic;
      if (m === 'driving_gates') {
        const isDriving = Boolean(world?.vehicle?.driving);
        if (dist <= 9.5 && isDriving) return finishStepOrObj();
        if (dist <= 10.5 && !isDriving) {
          setPrompt?.(`[F] 请驾驶 SAR 四驱车高速穿过 ${node.labelZh}（或按 [E] 步行确认）`, 0);
          if (interactDown && objState.cooldown <= 0) return finishStepOrObj();
        } else {
          setPrompt?.(null);
        }
        return null;
      }

      if (m === 'storm_climb_traversal') {
        if (curObj.action === 'multilevel_climb' && dist <= 7.5 && playerPos.y < 2.6) {
          setPrompt?.(`⚠ 水位持续上涨！请沿钢梯攀升至二层检修廊 (${node.labelZh})`, 0);
          return null;
        }
        if (dist <= 6.2) return finishStepOrObj();
        setPrompt?.(null);
        return null;
      }

      if (m === 'dialogue') {
        const leadChar = SALTLINE_CHARACTERS.find(c => c.id !== 'lin' && (activeChapter.characters || []).includes(c.id)) || SALTLINE_CHARACTERS[1];
        if (dist <= 7.0) {
          setPrompt?.(`[E] 与 ${leadChar.nameZh} 面对面交谈 · ${curObj.titleZh.slice(0, 22)}`, 0);
          if (interactDown && objState.cooldown <= 0) {
            if (world?.storyDirector?.openDialogue) {
              objState.pendingModal = true;
              const pages = (activeChapter.cutscene?.lines || []).map(l => l.line);
              if (!pages.length) pages.push(activeChapter.transitionZh || curObj.titleZh);
              world.storyDirector.openDialogue({
                speaker: leadChar.nameZh,
                role: leadChar.roleZh,
                tone: 'ally',
                pages,
                choices: [{ label: '立刻推进当前行动方案', reply: `明白，${leadChar.nameZh}已经同步坐标，我们按计划行动！` }],
                onComplete: () => { if (objState) objState.pendingModal = false; finishStepOrObj(); },
              });
              return { modalOpened: 'dialogue' };
            }
            return finishStepOrObj();
          }
        } else setPrompt?.(null);
        return null;
      }

      if (m === 'branch_choice') {
        if (dist <= 7.5) {
          setPrompt?.(`[E] 作出关键剧情抉择 · ${activeChapter.shortZh}`, 0);
          if (interactDown && objState.cooldown <= 0) {
            objState.pendingModal = true;
            openBranchChoiceOverlay(activeChapter, curObj, (choiceId) => {
              if (objState) objState.pendingModal = false;
              finishStepOrObj(choiceId);
            });
            return { modalOpened: 'branch_choice' };
          }
        } else setPrompt?.(null);
        return null;
      }

      if (m === 'survivor_rescue') {
        if (dist <= 5.5) {
          setPrompt?.(`[E] 护送撤离 ${node.labelZh}（${objState.stepIdx + 1}/${objState.totalSteps}）`, 0);
          if (interactDown && objState.cooldown <= 0) {
            if (node.human) node.human.pose?.('wave_follow', 0, 1, false, 0.016);
            return finishStepOrObj();
          }
        } else setPrompt?.(null);
        return null;
      }

      if (m === 'multi_switch_puzzle') {
        if (dist <= 5.5) {
          setPrompt?.(`[E] 操作 ${node.labelZh}（${objState.stepIdx + 1}/${objState.totalSteps}）`, 0);
          if (interactDown && objState.cooldown <= 0) {
            const isFinalTuner = (objState.stepIdx + 1 >= objState.totalSteps) && (curObj.action === 'coop_console' || curObj.action === 'power_puzzle');
            if (isFinalTuner && world?.storyDirector?.openSignalTuner) {
              objState.pendingModal = true;
              world.storyDirector.openSignalTuner({
                title: curObj.titleZh.slice(0, 24),
                subtitle: '将指针锁定在金色频段完成最终同步',
                locksNeeded: 3,
                onSuccess: () => { if (objState) objState.pendingModal = false; finishStepOrObj(); },
                onCancel: () => { if (objState) objState.pendingModal = false; },
              });
              return { modalOpened: 'signal_tuner' };
            }
            return finishStepOrObj();
          }
        } else setPrompt?.(null);
        return null;
      }

      if (dist <= 6.2) {
        if (interactDown) {
          objState.holdSec = Math.min(objState.holdTarget, objState.holdSec + dt);
          const prog = objState.holdTarget > 0 ? objState.holdSec / objState.holdTarget : 1;
          setPrompt?.(`长按 [E] 检修/启动中 ${Math.round(prog * 100)}% · ${curObj.titleZh.slice(0, 20)}`, prog);
          if (objState.holdSec >= objState.holdTarget && objState.cooldown <= 0) {
            return finishStepOrObj();
          }
        } else {
          objState.holdSec = Math.max(0, objState.holdSec - dt * 1.5);
          setPrompt?.(`长按 [E] 检修/启动设备 · ${curObj.titleZh.slice(0, 22)}`, objState.holdSec / Math.max(0.1, objState.holdTarget));
        }
      } else {
        objState.holdSec = 0;
        setPrompt?.(null);
      }
      return null;
    }

    function update(dt) {
      if (!active || !activeChapter || !(dt > 0)) return;
      const slot = saveMgr.getSlot();
      setPieces.update(dt, slot.difficulty);
      if (objState?.mechanic === 'survivor_rescue') {
        for (let idx = 0; idx < objState.nodes.length; idx++) {
          const sn = objState.nodes[idx];
          if (sn.human) sn.human.pose?.(sn.done ? 'salute' : 'wave_follow', 0, sessionTimeAccum + idx, false, dt);
        }
      }
      const isCine = cinematics.update(dt);
      const curObj = activeChapter.objectives[objectiveIdx];
      const wpTarget = getActiveWaypointTarget();
      const objPos = wpTarget ? { x: wpTarget[0], y: wpTarget[1], z: wpTarget[2] } : null;
      const wpLabel = objState && objState.totalSteps > 1
        ? `${curObj?.titleZh || ''} (${objState.stepIdx + 1}/${objState.totalSteps})`
        : (curObj?.titleZh || '');
      if (isCine) waypoint.hide();
      else waypoint.update(wpTarget, world?.player?.pos, wpLabel);
      charCtrl.update(dt, world?.player?.pos, objPos);
      sessionTimeAccum += dt;
      if (sessionTimeAccum >= 10) {
        saveMgr.addPlayTime(activeChapter.id, sessionTimeAccum);
        sessionTimeAccum = 0;
      }
    }

    function stop() {
      if (sessionTimeAccum > 1 && activeChapter) {
        saveMgr.addPlayTime(activeChapter.id, sessionTimeAccum);
        sessionTimeAccum = 0;
      }
      closeChoiceOverlay();
      objState = null;
      active = false;
      waypoint.dispose();
      npcCommands.dispose();
      cinematics.dispose();
      setPieces.dispose();
      charCtrl.disposeCast();
      world?.audioV2?.stopAmbience?.();
      world?.voiceMgr?.stopCurrent?.();
    }

    return {
      chapters: SALTLINE_CHAPTERS,
      characters: SALTLINE_CHARACTERS,
      difficulties: DIFFICULTY_PRESETS,
      saveMgr,
      setPieces,
      waypoint,
      cinematics,
      npcCommands,
      charCtrl,
      startChapter,
      advanceObjective,
      tickInteraction,
      getObjectiveState: () => objState,
      getActiveWaypointTarget,
      update,
      stop,
      on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
      get active() { return active; },
      get currentChapter() { return activeChapter; },
      get currentObjective() { return activeChapter?.objectives?.[objectiveIdx] || null; },
      get currentObjectiveIdx() { return objectiveIdx; },
      get matrixValidation() { return validateGameplayMatrix(SALTLINE_CHAPTERS); },
    };
  }

  const exported = {
    SALTLINE_CHAPTERS,
    SALTLINE_CHARACTERS,
    DIFFICULTY_PRESETS,
    NPC_COMMAND_PRESETS,
    isTacticalCommandAllowed,
    getChapterStoryBrief,
    OBJECTIVE_MECHANIC_MAP,
    resolveObjectiveMechanic,
    validateGameplayMatrix,
    createCampaignSaveManager,
    createChapterSetPieceManager,
    createWaypointOverlay,
    createCampaignCinematicDirector,
    createNpcCommandController,
    createCharacterBehaviorController,
    createSaltlineCampaignV2,
  };

  if (typeof window !== 'undefined') {
    window.SaltlineCampaignV2 = exported;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exported;
  }
})();
