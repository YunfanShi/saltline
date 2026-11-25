/* Campaign browser and the field terminal. */
(() => {
  const local = (english, chinese) => window.SaltlineLocale?.t(english, chinese) ?? english;

  const gamepadButtons = () => Array.from(navigator.getGamepads?.() ?? []).find(Boolean)?.buttons;
  function edges(buttons, previous, id) {
    const pressed = buttons?.[id]?.pressed ?? false;
    const edge = pressed && !previous[id];
    previous[id] = pressed;
    return edge;
  }

  window.createCampaignOverview = (root, { progress, openWorldProgress, prologue, launch, initial, signal }) => {
    const intro = { id: 'prologue', art: './art/campaign-prologue.jpg', title: ['Prologue · Dispatch', '序章 · 出勤'],
      description: ['Report to SAR Headquarters, visit the range or head to the helipad.',
        '到应急救援总部听取简报，可先去训练场，再前往停机坪。'] };
    const useOpenWorld = Boolean(openWorldProgress && Array.isArray(window.SaltlineOpenWorldActs) && window.SaltlineOpenWorldActs.length);
    const actList = useOpenWorld ? window.SaltlineOpenWorldActs : window.SaltlineCampaign.chapters;
    const chapters = prologue ? [intro, ...actList] : actList;
    const activeProgress = useOpenWorld ? openWorldProgress : progress;
    const statusFor = id => id === 'prologue'
      ? prologue.needsPrologue ? 'next' : 'available'
      : useOpenWorld
        ? (prologue?.needsPrologue ? 'locked' : openWorldProgress.status(id))
        : (id === 'berth' && prologue?.needsPrologue ? 'locked' : progress.status(id));
    const art = root.querySelector('.campaign-cover-art');
    const title = root.querySelector('[data-campaign-location]');
    const description = root.querySelector('[data-preview-description]');
    const main = root.querySelector('[data-campaign-launch]');
    const range = root.querySelector('[data-campaign-range]');
    const list = root.querySelector('.campaign-chapter-list');
    const previous = [];
    if (prologue?.needsPrologue) initial = 'prologue';
    else if (useOpenWorld && !initial) initial = openWorldProgress.next ?? 'ow-0';
    let selected = chapters.findIndex(chapter => chapter.id === initial && statusFor(chapter.id) !== 'locked');
    const ui = chapters.map((chapter, index) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      const number = document.createElement('span');
      const name = document.createElement('span');
      const status = document.createElement('span');
      button.type = 'button';
      button.className = 'campaign-chapter-select';
      number.className = 'campaign-number';
      number.textContent = String(index + (prologue ? 0 : 1)).padStart(2, '0');
      name.className = 'campaign-menu-place';
      status.className = 'campaign-menu-state';
      button.append(number, name, status);
      item.append(button);
      list.append(item);
      button.addEventListener('click', () => choose(index, true), { signal });
      return { button, name, status };
    });

    function choose(index, focus = false) {
      selected = index;
      render();
      if (focus) {
        ui[index].button.focus({ preventScroll: true });
        ui[index].button.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }

    function render() {
      if (selected < 0) selected = activeProgress.next ? chapters.findIndex(chapter => chapter.id === activeProgress.next) : chapters.length - 1;
      if (selected < 0) selected = 0;
      const chapter = chapters[selected];
      const status = statusFor(chapter.id);
      if (art.dataset.chapter !== chapter.id) {
        art.src = chapter.art ?? ('./art/campaign-' + chapter.id + '.jpg');
        art.dataset.chapter = chapter.id;
      }
      title.textContent = local(...chapter.title);
      description.textContent = local(...chapter.description);
      main.disabled = status === 'locked';
      main.textContent = status === 'locked' ? local('Act locked', '章节未解锁') :
        chapter.id === 'prologue' ? status !== 'next' ? local('Replay prologue', '回放序章') :
          prologue.phase === 'unstarted' ? local('Start prologue', '开始序章') : local('Continue prologue', '继续序章') :
        status === 'complete' ? local('Replay act', '重玩本幕') :
        useOpenWorld
          ? (chapter.id === 'ow-0' && openWorldProgress.completedCount === 0 ? local('Start open-world campaign', '开始大地图战役') : local('Continue open-world campaign', '继续大地图战役'))
          : (chapter.id === 'berth' && !progress.checkpoint(chapter.id) && !progress.pendingEnding?.(chapter.id)
              ? local('Start campaign', '开始战役') : local('Continue campaign', '继续战役'));
      if (range) range.textContent = local('Training ground', '训练场');
      ui.forEach(({ button, name, status: label }, index) => {
        const entry = chapters[index];
        const availability = statusFor(entry.id);
        button.classList.toggle('is-selected', index === selected);
        button.setAttribute('aria-pressed', String(index === selected));
        button.dataset.progress = availability;
        name.textContent = local(...entry.title);
        label.textContent = availability === 'complete' ? local('Complete', '已完成') :
          availability === 'next' ? local('Current', '当前进度') : availability === 'available' ? local('Available', '可回放') : local('Locked', '未解锁');
      });
    }

    main.addEventListener('click', () => {
      if (!main.disabled) launch(chapters[selected].id);
    }, { signal });
    range?.addEventListener('click', () => launch('prologue', { range: true }), { signal });
    list.addEventListener('keydown', event => {
      const delta = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[event.key];
      if (delta === undefined) return;
      event.preventDefault();
      choose((selected + delta + chapters.length) % chapters.length, true);
    }, { signal });

    return {
      render,
      update() {
        if (root.closest('.menu')?.dataset.screen !== 'campaign') return;
        const buttons = gamepadButtons();
        const earlier = edges(buttons, previous, 12) | edges(buttons, previous, 14);
        const later = edges(buttons, previous, 13) | edges(buttons, previous, 15);
        if (earlier || later) choose((selected + later - earlier + chapters.length) % chapters.length, true);
        if (edges(buttons, previous, 0) && !main.disabled) main.click();
      },
    };
  };

  window.createPortEvidenceSlate = ({ parent, clues, available, verified, verify, onOpen, signal, practice = false }) => {
    const overlay = document.createElement('section');
    overlay.className = 'campaign-slate';
    overlay.hidden = true;
    overlay.innerHTML = `<div class="campaign-slate-heading"><h2></h2><button type="button" data-slate-close></button></div>
      <p data-slate-task></p><div class="campaign-slate-records"></div><p class="campaign-slate-feedback" role="status"></p>
      <button class="campaign-slate-confirm" type="button"></button><p class="campaign-slate-controls"></p>`;
    overlay.setAttribute('aria-label', local('Field terminal', '战术终端'));
    const touchOpen = document.createElement('button');
    touchOpen.type = 'button';
    touchOpen.className = 'campaign-slate-open';
    touchOpen.hidden = true;
    const close = overlay.querySelector('[data-slate-close]');
    const confirm = overlay.querySelector('.campaign-slate-confirm');
    const feedback = overlay.querySelector('.campaign-slate-feedback');
    const list = overlay.querySelector('.campaign-slate-records');
    const previous = [];
    const selected = new Set();
    const records = practice ? [
      { id: 'evacuation', time: '07:20', title: ['Training transport log', '训练运输记录'],
        detail: ['Operator Gray is marked off-site.', '格雷已离开训练基地。'] },
      { id: 'shift-log', time: '07:26', title: ['Training duty sheet', '训练值班表'],
        detail: ['Operator Gray signs at the exercise desk.', '格雷在训练值班台当面签字。'] },
      { id: 'radio', time: '07:30', title: ['Range signal check', '靶场信号检查'],
        detail: ['The training channel is clear.', '训练频道信号正常。'] },
    ] : [...clues, { id: 'radio', time: '05:37', title: ['Pilot radio log', '引航员电台日志'],
      detail: ['Radio contact with Berth 4 was lost.', '与四号泊位失去无线电联络。'] }];
    const options = records.map(({ id, time, title, detail }, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.innerHTML = '<time></time><b></b><span></span>';
      button.children[0].textContent = time;
      button.addEventListener('click', () => {
        if (verified()) return;
        if (selected.has(id)) selected.delete(id);
        else {
          if (selected.size === 2) selected.delete(selected.values().next().value);
          selected.add(id);
        }
        cursor = index;
        feedback.textContent = '';
        render();
      }, { signal });
      list.append(button);
      return { button, id, title, detail };
    });
    parent.append(overlay, touchOpen);
    let open = false, cursor = 0, held = false;

    function render() {
      const completed = verified();
      overlay.querySelector('h2').textContent = local('Field terminal', '战术终端');
      overlay.querySelector('[data-slate-task]').textContent = completed ?
        local('Discrepancy filed. Take the dossier to the boat.', '矛盾记录已确认。携档案登船。') :
        practice ? local('Training exercise. Select two records about the same worker.', '训练演习。选出关于同一名工人的两份记录。') :
          local('Select two records that place the same worker in different places.', '选出两份记载同一名工人在不同地点的证物。');
      close.textContent = local('Close', '关闭');
      touchOpen.textContent = local('Evidence', '证物');
      confirm.textContent = local('Compare records', '核验记录');
      overlay.querySelector('.campaign-slate-controls').textContent = local(
        'Arrow keys to browse · Space to select · Enter to compare', '方向键浏览 · 空格选择 · Enter 核验');
      confirm.hidden = completed;
      confirm.disabled = selected.size !== 2;
      options.forEach(({ button, id, title, detail }, index) => {
        button.children[1].textContent = local(...title);
        button.children[2].textContent = local(...detail);
        button.classList.toggle('is-cursor', index === cursor);
        button.setAttribute('aria-pressed', String(selected.has(id)));
      });
    }

    function show(value) {
      if (value === open || value && !available()) return;
      open = value;
      overlay.hidden = !value;
      onOpen(value);
      if (value) render();
      if (!value) held = false;
    }

    function submit() {
      if (selected.size !== 2 || verified()) return;
      if (verify([...selected])) {
        feedback.textContent = practice ? local('Exercise complete. This is a local training record.', '训练完成。这份记录仅供练习。') :
          local('05:31 and 05:34 cannot both be true. Control has a copy.', '05:31 和 05:34 的记录有矛盾。指挥部已收到副本。');
      } else {
        feedback.textContent = local('Check the worker’s name and signed time in both records.', '检查两份记录里的姓名和签字时间。');
      }
      render();
    }

    function move(delta) {
      cursor = (cursor + options.length + delta) % options.length;
      render();
    }
    close.addEventListener('click', () => show(false), { signal });
    confirm.addEventListener('click', submit, { signal });
    touchOpen.addEventListener('click', () => show(!open), { signal });
    window.addEventListener('keydown', event => {
      if (event.code === 'Tab' && (available() || open)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!event.repeat) {
          held = true;
          show(true);
        }
        return;
      }
      if (!open) return;
      if (event.code === 'Escape') show(false);
      else if (['ArrowUp', 'ArrowLeft'].includes(event.code)) move(-1);
      else if (['ArrowDown', 'ArrowRight'].includes(event.code)) move(1);
      else if (event.code === 'Space') options[cursor].button.click();
      else if (event.code === 'Enter') selected.size === 2 ? submit() : options[cursor].button.click();
      else return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, { signal, capture: true });
    window.addEventListener('keyup', event => {
      if (event.code === 'Tab' && held) show(false);
    }, { signal, capture: true });
    document.addEventListener('saltline:localechange', render, { signal });

    return {
      get open() { return open; },
      close() { show(false); },
      reset() { show(false); selected.clear(); cursor = 0; feedback.textContent = ''; },
      dispose() { overlay.remove(); touchOpen.remove(); },
      update() {
        const usable = available();
        touchOpen.hidden = !usable || open;
        if (!usable && open) show(false);
        if (!usable) return;
        const buttons = gamepadButtons();
        if (edges(buttons, previous, 12) && !open) show(true);
        if (!open) return;
        if (edges(buttons, previous, 13)) move(1);
        if (edges(buttons, previous, 14)) move(-1);
        if (edges(buttons, previous, 15)) move(1);
        if (edges(buttons, previous, 0)) options[cursor].button.click();
        if (edges(buttons, previous, 2)) submit();
        if (edges(buttons, previous, 1)) show(false);
      },
    };
  };
})();
