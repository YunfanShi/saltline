/* SALTLINE — Product-Grade Campaign Main Menu (9 Complete Sections),
 * Chapter Transition Cards, Story Recap, Multi-Slot Save Manager,
 * Accessibility Panel, Difficulty Selector & Focused Campaign HUD. */
(() => {
  'use strict';

  const local = (en, zh) => window.SaltlineLocale?.t(en, zh) ?? zh;

  function injectStyles() {
    if (document.getElementById('saltline-campaign-v2-style')) return;
    const style = document.createElement('style');
    style.id = 'saltline-campaign-v2-style';
    style.textContent = `
      .sl-camp2-shell{display:grid;grid-template-columns:240px 1fr;gap:18px;width:min(1140px,95vw);max-height:84vh;margin:0 auto;color:#edf5f8;font-family:system-ui,-apple-system,sans-serif}
      @media(max-width:860px){.sl-camp2-shell{grid-template-columns:1fr;max-height:88vh;overflow:auto}}
      .sl-camp2-nav{display:flex;flex-direction:column;gap:8px;background:rgba(10,16,22,.88);border:1px solid rgba(110,185,220,.26);border-radius:8px;padding:14px}
      .sl-camp2-brand{font-size:11px;font-weight:800;letter-spacing:.22em;color:#f2c45a;margin-bottom:2px}
      .sl-camp2-title{font-size:21px;font-weight:800;margin:0 0 10px;color:#fff}
      .sl-camp2-navbtn{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:6px;color:#dceaf0;font:700 13px/1.2 system-ui,sans-serif;cursor:pointer;text-align:left;transition:background .15s,border-color .15s}
      .sl-camp2-navbtn:hover{background:rgba(102,217,240,.14);border-color:rgba(102,217,240,.45)}
      .sl-camp2-navbtn.active{background:rgba(242,196,90,.2);border-color:#f2c45a;color:#fff7df}
      .sl-camp2-navbtn.primary{background:#f2c45a;border-color:#f2c45a;color:#0b1116}
      .sl-camp2-navbtn:disabled{opacity:.42;cursor:not-allowed}
      .sl-camp2-panel{background:rgba(10,16,22,.9);border:1px solid rgba(110,185,220,.26);border-radius:8px;padding:18px 20px;overflow-y:auto;max-height:84vh}
      .sl-camp2-chgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;margin-top:12px}
      .sl-camp2-chcard{background:rgba(18,28,38,.85);border:1px solid rgba(130,190,220,.2);border-radius:7px;overflow:hidden;display:flex;flex-direction:column;cursor:pointer;transition:transform .15s,border-color .15s}
      .sl-camp2-chcard:hover{transform:translateY(-2px);border-color:#66d9f0}
      .sl-camp2-chcard.selected{border-color:#f2c45a;box-shadow:0 0 0 1px #f2c45a}
      .sl-camp2-chcard img{width:100%;height:108px;object-fit:cover;display:block;background:#0a141d}
      .sl-camp2-chbody{padding:10px 12px;display:flex;flex-direction:column;gap:5px;flex:1}
      .sl-camp2-chmeta{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#8cb8c8;font-weight:700}
      .sl-camp2-chname{font-size:14px;font-weight:800;color:#f5f9fb}
      .sl-camp2-chdesc{font-size:12px;line-height:1.45;color:#b4ccd6;margin:0}
      .sl-camp2-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:auto;padding-top:4px}
      .sl-camp2-tag{font-size:10.5px;padding:2px 6px;border-radius:4px;background:rgba(102,217,240,.14);color:#8ce5f8}
      .sl-camp2-pill{font-size:10.5px;padding:2px 7px;border-radius:99px;background:rgba(255,255,255,.1);color:#d7e7ee}
      .sl-camp2-pill.done{background:rgba(52,211,153,.22);color:#7cf0be}
      .sl-camp2-pill.next{background:rgba(242,196,90,.24);color:#ffe08a}
      .sl-camp2-row{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:12px 14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:7px;margin-bottom:10px}
      .sl-camp2-btn{padding:8px 15px;border-radius:6px;border:1px solid rgba(102,217,240,.45);background:rgba(102,217,240,.16);color:#e4f9ff;font:700 12.5px/1 system-ui,sans-serif;cursor:pointer}
      .sl-camp2-btn.gold{background:#f2c45a;border-color:#f2c45a;color:#0b1116}
      .sl-camp2-btn.danger{background:rgba(239,68,68,.18);border-color:rgba(248,113,113,.5);color:#fecaca}

      /* Focused Campaign V2 HUD */
      .sl-chud{position:fixed;left:18px;top:16px;z-index:21;width:min(350px,42vw);background:rgba(8,14,20,.86);border:1px solid rgba(110,196,225,.34);border-left:3px solid #f2c45a;border-radius:6px;padding:10px 14px;color:#edf5f8;font-family:system-ui,-apple-system,sans-serif;pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,.45);display:none}
      .sl-chud.on{display:block}
      .sl-chud-kicker{font:800 10.5px/1 ui-monospace,monospace;letter-spacing:.14em;color:#f2c45a;margin-bottom:4px}
      .sl-chud-obj{font:700 14px/1.35 system-ui,sans-serif;color:#fff;margin-bottom:4px}
      .sl-chud-opt{font:500 11.5px/1.35 system-ui,sans-serif;color:#9cd8ea;margin-bottom:4px}
      .sl-chud-dir{font:700 11.5px/1 ui-monospace,monospace;color:#7ee8aa}
      .sl-high-contrast .sl-chud{background:#000;border-color:#fff;border-left-color:#ffd700}

      /* Chapter Transition Overlay */
      .sl-trans{position:fixed;inset:0;z-index:58;background:rgba(5,9,14,.92);display:none;align-items:center;justify-content:center;padding:24px;color:#f2f7fa;font-family:system-ui,-apple-system,sans-serif}
      .sl-trans.on{display:flex}
      .sl-trans-card{width:min(640px,92vw);background:#0d161f;border:1px solid rgba(242,196,90,.45);border-top:3px solid #f2c45a;border-radius:8px;padding:24px 28px;box-shadow:0 24px 60px rgba(0,0,0,.78)}
      .sl-trans-k{font:800 11px/1 ui-monospace,monospace;letter-spacing:.2em;color:#f2c45a;margin-bottom:8px}
      .sl-trans-h{font:800 24px/1.2 system-ui,sans-serif;margin:0 0 10px}
      .sl-trans-p{font:500 14.5px/1.65 system-ui,sans-serif;color:#c3dae4;margin:0 0 18px}
    `;
    document.head.appendChild(style);
  }

  function formatPlayTime(sec) {
    const s = Math.max(0, Math.round(sec || 0));
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}m ${rem}s`;
  }

  function mountCampaignMenuV2(root, { campaignV2, onLaunchChapter, onLaunchTraining, onLaunchFreeRoam } = {}) {
    if (!root || !campaignV2) return null;
    injectStyles();

    // Hide legacy simplified cover/list cleanly while keeping DOM intact for legacy queries
    for (const oldEl of root.querySelectorAll('.campaign-cover, .campaign-chapter-list, .campaign-range-link')) {
      oldEl.style.display = 'none';
    }

    let container = root.querySelector('.sl-camp2-shell');
    if (!container) {
      container = document.createElement('div');
      container.className = 'sl-camp2-shell';
      root.appendChild(container);
    }

    let activeTab = 'chapters'; // chapters | difficulty | saves | accessibility | recap | characters
    let selectedChapterId = campaignV2.saveMgr.getSlot().currentChapterId || 'ch01';

    function render() {
      const slotId = campaignV2.saveMgr.getActiveSlotId();
      const slot = campaignV2.saveMgr.getSlot(slotId);
      const hasProgress = Boolean(slot.createdAt);
      const completedSet = new Set(slot.completedChapters || []);
      const curCh = campaignV2.chapters.find(c => c.id === slot.currentChapterId) || campaignV2.chapters[0];
      const matrix = campaignV2.matrixValidation;

      container.innerHTML = `
        <aside class="sl-camp2-nav">
          <div class="sl-camp2-brand">SALTLINE CRISIS · 14 CHAPTERS</div>
          <h2 class="sl-camp2-title">${local('Saltline Crisis', '《盐线危机》战役')}</h2>
          <button type="button" class="sl-camp2-navbtn primary" data-act="continue" ${hasProgress ? '' : 'disabled'}>
            <span>${local('Continue Campaign', '继续战役')}</span>
            <span>${curCh ? 'CH ' + String(curCh.number).padStart(2, '0') : ''}</span>
          </button>
          <button type="button" class="sl-camp2-navbtn" data-act="new">
            <span>${local('New Campaign', '开始新战役')}</span><span>▶</span>
          </button>
          <button type="button" class="sl-camp2-navbtn ${activeTab === 'chapters' ? 'active' : ''}" data-tab="chapters">
            <span>${local('Chapter Select', '章节选择')}</span><span>${completedSet.size}/${campaignV2.chapters.length}</span>
          </button>
          <button type="button" class="sl-camp2-navbtn ${activeTab === 'characters' ? 'active' : ''}" data-tab="characters">
            <span>${local('Characters', '主要角色')}</span><span>${campaignV2.characters.length}</span>
          </button>
          <button type="button" class="sl-camp2-navbtn ${activeTab === 'difficulty' ? 'active' : ''}" data-tab="difficulty">
            <span>${local('Difficulty', '难度设置')}</span><span>${(campaignV2.difficulties[slot.difficulty] || campaignV2.difficulties.tactical).nameZh}</span>
          </button>
          <button type="button" class="sl-camp2-navbtn ${activeTab === 'saves' ? 'active' : ''}" data-tab="saves">
            <span>${local('Save Management', '存档管理')}</span><span>槽位 ${slotId + 1}</span>
          </button>
          <button type="button" class="sl-camp2-navbtn ${activeTab === 'accessibility' ? 'active' : ''}" data-tab="accessibility">
            <span>${local('Accessibility', '无障碍辅助')}</span><span>⚙</span>
          </button>
          <button type="button" class="sl-camp2-navbtn ${activeTab === 'recap' ? 'active' : ''}" data-tab="recap">
            <span>${local('Story Recap', '剧情回顾')}</span><span>📖</span>
          </button>
          <button type="button" class="sl-camp2-navbtn" data-act="training">
            <span>${local('Training', '应急训练场')}</span><span>🎯</span>
          </button>
          <button type="button" class="sl-camp2-navbtn" data-act="freeroam" ${slot.freeRoamUnlocked ? '' : 'title="通关第十四章后正式解锁，亦可随时试玩自由探索"'}>
            <span>${local('Post-Campaign Free Roam', '战役后自由探索')}</span><span>${slot.freeRoamUnlocked ? '🔓' : '🌏'}</span>
          </button>
          <div style="margin-top:auto;font-size:11px;color:#84a7b5;line-height:1.45;padding-top:8px;border-top:1px solid rgba(255,255,255,.1)">
            预计首次完整时长：约 ${matrix.totalEstHours} 小时（${matrix.chapterCount} 章独立关卡）
          </div>
        </aside>
        <section class="sl-camp2-panel" data-panel></section>
      `;

      const panel = container.querySelector('[data-panel]');
      if (activeTab === 'chapters') {
        const sel = campaignV2.chapters.find(c => c.id === selectedChapterId) || campaignV2.chapters[0];
        panel.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.12)">
            <div style="flex:1;min-width:260px">
              <div style="font-size:11px;font-weight:800;letter-spacing:.18em;color:#f2c45a">CHAPTER ${String(sel.number).padStart(2, '0')} · ${sel.locationZh}</div>
              <h3 style="margin:4px 0 6px;font-size:20px">${local(sel.titleEn, sel.titleZh)}</h3>
              <p style="margin:0 0 10px;font-size:13px;line-height:1.6;color:#c2dae3">${local(sel.descriptionEn, sel.descriptionZh)}</p>
              <div style="font-size:12px;color:#93c5d6">地标场景：${sel.landmarkZh} · 预计 ${sel.estMinutes} 分钟 · 已游玩 ${formatPlayTime(slot.playTimeSec?.[sel.id])}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
              <button type="button" class="sl-camp2-btn gold" data-play-selected>${local('Deploy Chapter', '进入本章节')}</button>
            </div>
          </div>
          <div class="sl-camp2-chgrid">
            ${campaignV2.chapters.map((ch, idx) => {
              const done = completedSet.has(ch.id);
              const isCur = ch.id === slot.currentChapterId;
              const badge = done ? `<span class="sl-camp2-pill done">已完成</span>` : isCur ? `<span class="sl-camp2-pill next">当前进度</span>` : `<span class="sl-camp2-pill">第 ${idx + 1} 章</span>`;
              return `
                <article class="sl-camp2-chcard ${ch.id === sel.id ? 'selected' : ''}" data-ch="${ch.id}">
                  <img src="${ch.art}" alt="${ch.shortZh}" loading="lazy">
                  <div class="sl-camp2-chbody">
                    <div class="sl-camp2-chmeta"><span>CH ${String(ch.number).padStart(2, '0')} · ${ch.estMinutes}m</span>${badge}</div>
                    <div class="sl-camp2-chname">${ch.shortZh}</div>
                    <p class="sl-camp2-chdesc">${ch.landmarkZh}</p>
                    <div class="sl-camp2-tags">${ch.gameplayTagsZh.map(t => `<span class="sl-camp2-tag">${t}</span>`).join('')}</div>
                  </div>
                </article>`;
            }).join('')}
          </div>`;
        panel.querySelector('[data-play-selected]')?.addEventListener('click', () => {
          onLaunchChapter?.(sel.id, { objectiveIndex: 0 });
        });
        panel.querySelectorAll('[data-ch]').forEach(el => {
          el.addEventListener('click', () => { selectedChapterId = el.dataset.ch; render(); });
        });
      } else if (activeTab === 'characters') {
        panel.innerHTML = `
          <h3 style="margin:0 0 12px;font-size:18px">《盐线危机》六位核心角色档案</h3>
          ${campaignV2.characters.map(c => `
            <div class="sl-camp2-row" style="flex-direction:column;align-items:stretch;gap:6px">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <strong style="font-size:15px;color:#fff">${c.nameZh}（${c.nameEn}）</strong>
                <span class="sl-camp2-tag">${c.roleZh}</span>
              </div>
              <div style="font-size:12.5px;color:#c7dee6;line-height:1.55"><strong>性格与特征：</strong>${c.personalityZh} ${c.signatureTraitZh}</div>
              <div style="font-size:12px;color:#9cc4d4;line-height:1.5"><strong>个人目标：</strong>${c.goalZh} ｜ <strong>成长弧光：</strong>${c.arcZh}</div>
            </div>`).join('')}`;
      } else if (activeTab === 'difficulty') {
        panel.innerHTML = `
          <h3 style="margin:0 0 12px;font-size:18px">战役难度设置（影响提示频率、检查点密度、解谜容错与灾害强度）</h3>
          ${Object.values(campaignV2.difficulties).map(d => `
            <div class="sl-camp2-row">
              <div>
                <strong style="font-size:15px;color:${slot.difficulty === d.id ? '#f2c45a' : '#fff'}">${d.nameZh} · ${d.nameEn}</strong>
                <div style="font-size:12.5px;color:#b8d1dc;margin-top:4px">${d.descZh}</div>
                <div style="font-size:11.5px;color:#84aebf;margin-top:4px">提示间隔 ${d.hintIntervalSec}s · 灾害倍率 ${d.hazardMultiplier}x · 容错系数 ${d.puzzleTolerance}x</div>
              </div>
              <button type="button" class="sl-camp2-btn ${slot.difficulty === d.id ? 'gold' : ''}" data-set-diff="${d.id}">
                ${slot.difficulty === d.id ? '当前启用' : '选择'}
              </button>
            </div>`).join('')}`;
        panel.querySelectorAll('[data-set-diff]').forEach(btn => {
          btn.addEventListener('click', () => {
            campaignV2.saveMgr.updateSlot(slotId, s => { s.difficulty = btn.dataset.setDiff; });
            render();
          });
        });
      } else if (activeTab === 'saves') {
        const allSlots = campaignV2.saveMgr.readAll();
        panel.innerHTML = `
          <h3 style="margin:0 0 12px;font-size:18px">多槽位存档管理</h3>
          ${allSlots.map(s => {
            const ch = campaignV2.chapters.find(c => c.id === s.currentChapterId) || campaignV2.chapters[0];
            return `
              <div class="sl-camp2-row">
                <div>
                  <strong style="font-size:15px;color:${s.slotId === slotId ? '#f2c45a' : '#fff'}">存档槽位 ${s.slotId + 1} ${s.slotId === slotId ? '（当前）' : ''}</strong>
                  <div style="font-size:12.5px;color:#b8d1dc;margin-top:4px">
                    ${s.createdAt ? `当前进度：${ch.titleZh} · 已完成 ${s.completedChapters.length}/14 章 · 累计游玩 ${formatPlayTime(s.totalPlayTimeSec)}` : '空存档槽'}
                  </div>
                </div>
                <div style="display:flex;gap:8px">
                  <button type="button" class="sl-camp2-btn ${s.slotId === slotId ? 'gold' : ''}" data-use-slot="${s.slotId}">切换</button>
                  <button type="button" class="sl-camp2-btn danger" data-del-slot="${s.slotId}">清空</button>
                </div>
              </div>`;
          }).join('')}`;
        panel.querySelectorAll('[data-use-slot]').forEach(b => b.addEventListener('click', () => {
          campaignV2.saveMgr.setActiveSlotId(Number(b.dataset.useSlot));
          selectedChapterId = campaignV2.saveMgr.getSlot().currentChapterId || 'ch01';
          render();
        }));
        panel.querySelectorAll('[data-del-slot]').forEach(b => b.addEventListener('click', () => {
          campaignV2.saveMgr.deleteSlot(Number(b.dataset.delSlot));
          render();
        }));
      } else if (activeTab === 'accessibility') {
        const acc = campaignV2.saveMgr.getAccessibility();
        panel.innerHTML = `
          <h3 style="margin:0 0 12px;font-size:18px">无障碍与舒适度设置</h3>
          <div class="sl-camp2-row">
            <div><strong>双语字幕显示</strong><div style="font-size:12px;color:#a5c2ce">过场与角色交谈同时支持中英文清晰字幕</div></div>
            <button type="button" class="sl-camp2-btn ${acc.bilingualSubtitles ? 'gold' : ''}" data-acc="bilingualSubtitles">${acc.bilingualSubtitles ? '已开启' : '已关闭'}</button>
          </div>
          <div class="sl-camp2-row">
            <div><strong>高对比度战役 HUD</strong><div style="font-size:12px;color:#a5c2ce">在雨夜与风暴场景中增强目标文字对比度</div></div>
            <button type="button" class="sl-camp2-btn ${acc.highContrastHud ? 'gold' : ''}" data-acc="highContrastHud">${acc.highContrastHud ? '已开启' : '已关闭'}</button>
          </div>
          <div class="sl-camp2-row">
            <div><strong>减弱镜头震动</strong><div style="font-size:12px;color:#a5c2ce">降低滑移、雷暴与爆炸场景的画面晃动幅度</div></div>
            <button type="button" class="sl-camp2-btn ${acc.reduceShake ? 'gold' : ''}" data-acc="reduceShake">${acc.reduceShake ? '已开启' : '已关闭'}</button>
          </div>
          <div class="sl-camp2-row">
            <div><strong>方向指引增强</strong><div style="font-size:12px;color:#a5c2ce">始终在 HUD 显示主目标方位角与距离</div></div>
            <button type="button" class="sl-camp2-btn ${acc.navAssist ? 'gold' : ''}" data-acc="navAssist">${acc.navAssist ? '已开启' : '已关闭'}</button>
          </div>`;
        panel.querySelectorAll('[data-acc]').forEach(b => b.addEventListener('click', () => {
          const k = b.dataset.acc;
          campaignV2.saveMgr.setAccessibility({ [k]: !acc[k] });
          render();
        }));
      } else if (activeTab === 'recap') {
        const recap = campaignV2.saveMgr.buildStoryRecap(slotId);
        panel.innerHTML = `
          <h3 style="margin:0 0 8px;font-size:18px">《盐线危机》剧情回顾（已完成 ${recap.completedCount}/${recap.totalChapters} 章）</h3>
          <p style="font-size:13px;color:#a5c4d1;margin:0 0 14px">中途离开游戏后，可在此快速回顾已发生的剧情脉络与你的关键抉择。</p>
          ${recap.entries.length ? recap.entries.map(e => `
            <div class="sl-camp2-row" style="flex-direction:column;align-items:stretch;gap:4px">
              <strong style="color:#f2c45a">${e.titleZh}</strong>
              <div style="font-size:13px;color:#d6e8f0;line-height:1.55">${e.recapZh}</div>
              ${e.choiceMade ? `<div style="font-size:11.5px;color:#7ee8aa">关键抉择记录：${e.choiceMade}</div>` : ''}
            </div>`).join('') : '<div class="sl-camp2-row">尚未完成任何章节。点击左侧「开始新战役」即可从第一章《最后一个正常的早晨》启程。</div>'}`;
      }

      container.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => {
        activeTab = b.dataset.tab;
        render();
      }));
      container.querySelector('[data-act="continue"]')?.addEventListener('click', () => {
        const s = campaignV2.saveMgr.getSlot();
        onLaunchChapter?.(s.currentChapterId || 'ch01', { objectiveIndex: s.currentObjectiveIdx || 0 });
      });
      container.querySelector('[data-act="new"]')?.addEventListener('click', () => {
        const s = campaignV2.saveMgr.startNewCampaign(slotId, slot.difficulty);
        selectedChapterId = s.currentChapterId;
        onLaunchChapter?.('ch01', { objectiveIndex: 0 });
      });
      container.querySelector('[data-act="training"]')?.addEventListener('click', () => onLaunchTraining?.());
      container.querySelector('[data-act="freeroam"]')?.addEventListener('click', () => onLaunchFreeRoam?.());
    }

    // Focused HUD & Chapter Transition Card
    let hudEl = document.querySelector('.sl-chud');
    if (!hudEl) {
      hudEl = document.createElement('div');
      hudEl.className = 'sl-chud';
      hudEl.innerHTML = `<div class="sl-chud-kicker"></div><div class="sl-chud-obj"></div><div class="sl-chud-opt"></div><div class="sl-chud-dir"></div>`;
      document.body.appendChild(hudEl);
    }
    let transEl = document.querySelector('.sl-trans');
    if (!transEl) {
      transEl = document.createElement('div');
      transEl.className = 'sl-trans';
      transEl.innerHTML = `<div class="sl-trans-card"><div class="sl-trans-k"></div><h2 class="sl-trans-h"></h2><p class="sl-trans-p"></p><button type="button" class="sl-camp2-btn gold" data-trans-go>继续行动 [Space]</button></div>`;
      document.body.appendChild(transEl);
    }

    function showTransition(chapter, onContinue) {
      if (document.body.classList.contains('audit-clean')) { onContinue?.(); return; }
      transEl.querySelector('.sl-trans-k').textContent = `CHAPTER ${String(chapter.number).padStart(2, '0')} · ${chapter.locationZh}`;
      transEl.querySelector('.sl-trans-h').textContent = local(chapter.titleEn, chapter.titleZh);
      transEl.querySelector('.sl-trans-p').textContent = local(chapter.transitionEn, chapter.transitionZh);
      transEl.classList.add('on');
      const finish = () => {
        transEl.classList.remove('on');
        onContinue?.();
      };
      const btn = transEl.querySelector('[data-trans-go]');
      btn.onclick = finish;
      setTimeout(() => { if (transEl.classList.contains('on')) finish(); }, 6500);
    }

    function updateHud(playerPos) {
      if (!campaignV2.active || !campaignV2.currentChapter || document.body.classList.contains('audit-clean')) {
        hudEl.classList.remove('on');
        return;
      }
      const ch = campaignV2.currentChapter;
      const obj = campaignV2.currentObjective;
      hudEl.classList.add('on');
      hudEl.querySelector('.sl-chud-kicker').textContent = `CH ${String(ch.number).padStart(2, '0')} · ${ch.shortZh} (${campaignV2.currentObjectiveIdx + 1}/${ch.objectives.length})`;
      hudEl.querySelector('.sl-chud-obj').textContent = obj?.titleZh || '';
      hudEl.querySelector('.sl-chud-opt').textContent = obj?.optionalZh ? `可选：${obj.optionalZh}` : '';
      if (playerPos && obj?.target) {
        const dx = obj.target[0] - playerPos.x, dz = obj.target[2] - playerPos.z;
        const dist = Math.round(Math.hypot(dx, dz));
        hudEl.querySelector('.sl-chud-dir').textContent = `🧭 目标距离：${dist}m · 场景：${ch.landmarkZh}`;
      }
    }

    render();
    return { render, showTransition, updateHud };
  }

  window.mountSaltlineCampaignMenuV2 = mountCampaignMenuV2;
})();
