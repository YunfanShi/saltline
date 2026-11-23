(() => {
  'use strict';

  const storageKey = 'saltline-language';
  const translations = new Map(Object.entries({
    'Port Authority Breach Unit': '港务突击队',
    'Saltline Terminal · 05:42': '盐线码头 · 05:42',
    'Saltline Terminal · Berth 4 · 05:42': '盐线码头 · 4 号泊位 · 05:42',
    'Port Authority Breach Unit — one breacher, no backup': '港务突击队 · 单人行动，无后援',
    'The harbor stopped answering at 05:37. Cut its three uplinks and find out who ordered the lockdown.':
      '05:37，港口失去联络。切断三座通信中继，查明谁下令封锁码头。',
    '05:58. The boat clears Berth 4. The recovered log traces the lockdown to shore dispatch. Control forwards the dispatcher’s signature to the harbor inquiry.':
      '05:58，撤离船驶离 4 号泊位。调度记录显示，封锁令来自岸上调度室。指挥中心将签发记录移交港口调查组。',
    'Every surface, machine and sound is generated in your browser. Nothing is downloaded.':
      '场景、机器和音效均由浏览器生成。',
    'Deploy': '部署',
    'Port Conquest': '港口征服',
    'Port Breakthrough': '港口突破',
    'Breakthrough': '突破',
    'Conquest': '征服',
    'Class': '兵种',
    'Select class': '选择兵种',
    'Assault': '突击兵',
    'Medic': '医疗兵',
    'Engineer': '工程兵',
    'Recon': '侦察兵',
    'Support': '支援',
    'BATTLE': 'BATTLE · 战役',
    'MULTIPLE': 'MULTIPLE · 多人／AI 对战',
    'AI Conquest': 'AI 港口征服',
    'AI Breakthrough': 'AI 港口突破',
    'Return to title': '返回主菜单',
    'Back': '返回',
    'AI battles': 'AI 对战',
    'Single-player campaign': '单人战役',
    'Port battles': 'AI 港口战斗',
    'Local network': '局域网',
    'LAN staging room': '局域网准备室',
    'Rail Inspection Yard': '铁路货检区',
    'Rail Inspection Yard · Debrief': '铁路货检区 · 行动简报',
    'Berth 4': '4 号泊位',
    'Continue to the rail yard': '前往铁路货检区',
    'Trace the lockdown order through the rail inspection yard and get the original records out.':
      '沿着封锁令的线索进入铁路货检区，带出原始调度记录。',
    'The inquiry brings the lockdown order and the amended manifest together. Berth 4 is reopened under manual control.':
      '调查组将封锁令和篡改后的装运清单比对。4 号泊位恢复人工调度，重新开放。',
    'Original Mission': '原版任务',
    'Settings': '设置',
    'Controls': '操作指南',
    'Controls at a glance': '操作速览',
    'Operation on hold': '行动暂停',
    'Paused': '已暂停',
    'Resume': '继续',
    'Restart mission': '重新开始',
    'Breacher down': '突击队员倒下',
    'Signal lost': '信号丢失',
    'Time survived': '存活时间',
    'Relays cut': '已切断中继',
    'Retry': '重试',
    'Debrief': '任务结算',
    'Berth 4 · Debrief': '4 号泊位 · 任务结算',
    'Saltline is dark': '中继已断开',
    'Rating': '评级',
    'Messy': '混乱',
    'Loud': '强攻',
    'Steady': '稳健',
    'Clean': '利落',
    'Sharp': '精准',
    'Surgical': '完美执行',
    'Time': '用时',
    'Accuracy': '命中率',
    'Machines destroyed': '击毁机器',
    'Retries': '重试次数',
    'Redeploy': '重新部署',
    'Settings and controls': '设置与操作指南',
    'Close': '关闭',
    'Graphics quality': '画质',
    'low': '低',
    'medium': '中',
    'high': '高',
    'ultra': '极高',
    'Mouse sensitivity': '鼠标灵敏度',
    'Invert Y': '反转垂直视角',
    'Master volume': '总音量',
    'Field of view': '视野范围',
    'On': '开',
    'Off': '关',
    'Display': '显示',
    'Enter fullscreen': '进入全屏',
    'Exit fullscreen': '退出全屏',
    'Fullscreen is not available here': '当前浏览器无法进入全屏',
    'Quality changes apply at once; shadows and reflections may take a moment to rebuild.':
      '画质调整立即生效，阴影和反射可能需要片刻重新生成。',
    'Keyboard · Mouse': '键盘与鼠标',
    'Touch': '触屏',
    'Gamepad': '手柄',
    'Move': '移动',
    'Look': '转动视角',
    'Fire': '开火',
    'Aim': '瞄准',
    'Reload': '换弹',
    'Cut relay': '切断中继',
    'Jump': '跳跃',
    'Sprint': '冲刺',
    'Crouch': '蹲伏',
    'Melee': '近战',
    'Pause': '暂停',
    'Mouse': '鼠标',
    'Left button': '鼠标左键',
    'Right button': '鼠标右键',
    'Hold': '按住',
    'or': '或',
    'Left thumb moves': '左侧拇指控制移动',
    'Right thumb looks': '右侧拇指控制视角',
    'Fire · Aim · Reload · Jump on screen': '开火、瞄准、换弹、跳跃均有屏幕按钮',
    'Left thumb, anywhere': '用左侧拇指移动',
    'Drag the right side': '拖动屏幕右侧',
    'Hold FIRE, drag to track': '按住开火按钮，拖动可追踪目标',
    'AIM toggles': '轻触瞄准按钮切换',
    'FIRE': '开火',
    'AIM': '瞄准',
    'RLD': '换弹',
    'JUMP': '跳跃',
    'USE': '互动',
    'Hold USE at a relay': '靠近中继后按住互动按钮',
    'Push the stick fully forward': '将摇杆向前推到底',
    'If the browser will not capture the mouse, hold a mouse button and drag to look (left also fires, right also aims). Arrow keys or':
      '若浏览器无法锁定鼠标，可按住鼠标键并拖动视角（左键同时开火，右键同时瞄准）。方向键或',
    'turn,': '可转动视角，',
    'fires.': '可开火。',
    'Sticks move and look · RT fire · LT aim · A jump · B crouch · X reload · Y cut relay · L3 sprint · Start pause.':
      '摇杆控制移动和视角 · RT 开火 · LT 瞄准 · A 跳跃 · B 蹲伏 · X 换弹 · Y 切断中继 · L3 冲刺 · Start 暂停',
    'Objective': '目标',
    'Relays': '中继',
    'Vitals': '生命体征',
    'Ammo': '弹药',
    'Reserve': '备弹',
    'Get to the boat': '前往撤离船',
    'Cut the three uplink relays': '切断三座通信中继',
    'Cut the last relay': '切断最后一座中继',
    'Relays still live — the boat will not wait under fire': '中继仍在运行。撤离船不会冒着火力等待。',
    'Hauled out of the water': '已被救出水面',
    'Touch controls active': '触屏操作已启用',
    'Mouse capture unavailable — move the mouse to look, rest it at a screen edge to keep turning · click fires · arrows or IJKL also turn':
      '鼠标锁定不可用。移动鼠标可转动视角，贴近屏幕边缘可继续转动。点击开火，也可用方向键或 IJKL 转动。',
    'Mouse captured — Esc releases it': '鼠标已锁定，按 Esc 释放',
    'Click the view to capture the mouse': '点击画面锁定鼠标',
    'Resume recaptures the mouse.': '继续游戏时会重新锁定鼠标。',
    'Breacher, this is Control. The Harbormaster holds the berth. Cut its three uplinks — yard, shed, quay.':
      '突击队员，这里是指挥中心。港口管理员控制着泊位。切断堆场、仓棚和码头的三座中继。',
    'It has seen you. Gulls fly, Hounds walk. Put them down.':
      '它发现你了。海鸥无人机在空中，猎犬机器人在地面。消灭它们。',
    'First relay down. It logged the last order before the blackout. That order came from shore.':
      '第一座中继已断开。它记下了失联前的最后一条命令，命令来自岸上。',
    'Second relay down. The emergency gate was held shut even after the crew called for help.':
      '第二座中继已断开。船员发出求救以后，紧急通道仍然处于封锁状态。',
    'You are hit hard. Get behind steel and breathe.': '你伤得很重。先到钢制掩体后喘口气。',
    'Breacher is aboard. The archive made it out with you.': '突击队员已登船，调度记录也带出来了。',
    'Raising the terminal': '正在初始化码头',
    'Waking the renderer': '正在启动渲染器',
    'Mixing paint, rust and rain': '正在加载材质与雨效',
    'Stacking containers': '正在布置集装箱',
    'Raising the cranes': '正在布置起重机',
    'Flooding the apron': '正在加载码头积水',
    'Loading tracers and smoke': '正在加载曳光和烟雾',
    'Checking the rifle': '正在准备步枪',
    'Waking the Harbormaster': '正在启动港口安防系统',
    'Waiting for first light': '正在等待天亮',
    'Ready': '准备就绪',
  }));
  const directions = new Map(Object.entries({
    NORTH: '北', 'NORTH-EAST': '东北', EAST: '东', 'SOUTH-EAST': '东南',
    SOUTH: '南', 'SOUTH-WEST': '西南', WEST: '西', 'NORTH-WEST': '西北',
  }));

  let language = 'zh-CN';
  try {
    if (localStorage.getItem(storageKey) === 'en') language = 'en';
  } catch { /* browser storage may be unavailable */ }

  function chineseText(text) {
    const key = text.trim();
    if (!key) return text;
    let translated = translations.get(key);
    if (translated === undefined && key.startsWith('Cut ')) {
      const moreRelays = /^Cut the remaining (\d+) relays$/.exec(key);
      const cutRelay = /^Cut relay ([A-Z0-9]+)$/.exec(key);
      if (moreRelays) translated = '切断剩余 ' + moreRelays[1] + ' 座中继';
      if (cutRelay) translated = '切断 ' + cutRelay[1] + ' 号中继';
    }
    if (translated === undefined) {
      const prompt = /^Hold (E|USE|Y) — (下载调度记录|开始上传)$/.exec(key);
      if (prompt) translated = '按住 ' + prompt[1] + ' · ' + prompt[2];
    }
    if (translated === undefined && key.startsWith('Contact — ')) {
      const direction = directions.get(key.slice('Contact — '.length));
      if (direction) translated = '发现敌人 · ' + direction;
    }
    if (translated === undefined && key.startsWith('Quality was picked for this device')) {
      translated = '已为此设备自动选择画质。若画面卡顿，请调低画质。';
    }
    if (translated === undefined) return text;
    return translated === key ? text : text.replace(key, translated);
  }

  function translate(english, chinese) {
    return language === 'en' ? english : chinese ?? chineseText(english);
  }

  const textSources = new WeakMap();
  const labelSources = new WeakMap();

  function localizeText(node) {
    const current = node.data;
    const previous = textSources.get(node);
    const original = previous && current === previous.localized ? previous.original : current;
    const localized = translate(original);
    if (original !== localized) textSources.set(node, {original, localized});
    else textSources.delete(node);
    if (current !== localized) node.data = localized;
  }

  function localizeLabel(element) {
    const current = element.getAttribute('aria-label');
    if (current === null) return;
    const previous = labelSources.get(element);
    const original = previous && current === previous.localized ? previous.original : current;
    const localized = translate(original);
    if (original !== localized) labelSources.set(element, {original, localized});
    else labelSources.delete(element);
    if (current !== localized) element.setAttribute('aria-label', localized);
  }

  function localizeTree(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      localizeText(node);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE || node.closest('[data-no-localize]')) return;
    if (node.hasAttribute('aria-label')) localizeLabel(node);
    node.querySelectorAll('[aria-label]').forEach(localizeLabel);
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
      acceptNode: text => text.parentElement?.closest('[data-no-localize]') ?
        NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    });
    while (walker.nextNode()) localizeText(walker.currentNode);
  }

  function addLanguageControl(settings) {
    if (!settings || settings.querySelector('#saltline-locale')) return;
    const row = document.createElement('div');
    row.className = 'row';
    row.dataset.noLocalize = '';
    const label = document.createElement('label');
    label.htmlFor = 'saltline-locale';
    label.textContent = '语言 / Language';
    const select = document.createElement('select');
    select.id = label.htmlFor;
    select.className = 'btn small';
    select.style.cssText = 'background:#0b0d0f;color:#e8e4da;font:inherit';
    for (const [value, name] of [['zh-CN', '简体中文'], ['en', 'English']]) {
      select.add(new Option(name, value));
    }
    select.value = language;
    select.addEventListener('change', () => setLanguage(select.value));
    row.append(label, select);
    settings.prepend(row);
  }

  const scopes = [];
  function setLanguage(value) {
    language = value === 'en' ? 'en' : 'zh-CN';
    document.documentElement.lang = language;
    try { localStorage.setItem(storageKey, language); } catch { /* browser storage may be unavailable */ }
    for (const scope of scopes) localizeTree(scope);
    const select = document.getElementById('saltline-locale');
    if (select) select.value = language;
    document.dispatchEvent(new CustomEvent('saltline:localechange', {detail: language}));
  }

  window.SaltlineLocale = Object.freeze({
    t: translate,
    get language() { return language; },
  });
  document.documentElement.lang = language;

  function init() {
    const ui = document.getElementById('ui');
    const boot = document.getElementById('boot-msg');
    scopes.push(...[ui, boot].filter(Boolean));
    const observer = new MutationObserver(records => {
      for (const record of records) {
        const element = record.target.nodeType === Node.ELEMENT_NODE ? record.target : record.target.parentElement;
        if (element?.closest('[data-no-localize]')) continue;
        if (record.type === 'characterData') localizeText(record.target);
        else if (record.type === 'attributes') localizeLabel(record.target);
        else for (const added of record.addedNodes) {
          localizeTree(added);
          if (added.nodeType === Node.ELEMENT_NODE) {
            addLanguageControl(added.matches('[data-pane="settings"]') ?
              added : added.querySelector('[data-pane="settings"]'));
          }
        }
      }
    });
    for (const scope of scopes) {
      localizeTree(scope);
      observer.observe(scope, {
        childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['aria-label'],
      });
    }
    addLanguageControl(ui?.querySelector('[data-pane="settings"]'));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once: true});
  else init();
})();
