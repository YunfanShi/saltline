/* SALTLINE — 5 Independent Multiplayer GameMode Controllers
 * Each mode implements a dedicated controller with full lifecycle:
 *   init() -> configurePlayers() -> update(dt, ctx) -> handleEvent(ev) ->
 *   getScoreboard() -> checkVictory() -> getSettlement() -> resetForLobby()
 * Modes:
 *   1. conquest        — Team territory control & ticket bleed
 *   2. breakthrough    — Sequential sector assault & defense
 *   3. coop_rescue     — Role-differentiated cooperative civilian rescue & facility recovery
 *   4. coop_campaign   — 2–4P synchronized 14-chapter Saltline Crisis campaign with shared checkpoints
 *   5. sandbox         — Host-configurable open-world multiplayer sandbox with live world events */
(() => {
  'use strict';

  const MODE_META = Object.freeze({
    conquest: {
      id: 'conquest', nameEn: 'Conquest', nameZh: '港口征服',
      summaryEn: 'Capture and hold 5 tactical objectives across the map to bleed enemy tickets.',
      summaryZh: '争夺全图 5 处战略据点，维持多数控制持续消耗敌方兵力票，率先归零或限时领先获胜。',
      teamMode: 'versus', minPlayers: 2, maxPlayers: 8, defaultDuration: 300, defaultTickets: 60,
    },
    breakthrough: {
      id: 'breakthrough', nameEn: 'Breakthrough', nameZh: '战区突破',
      summaryEn: 'Attackers push sequentially through 4 fortified sectors while defenders hold the line.',
      summaryZh: '攻方按顺序逐区突破 4 道防线，每夺取一区补充兵力并解锁下一防线；守方耗尽攻方兵力或守满时间获胜。',
      teamMode: 'versus', minPlayers: 2, maxPlayers: 8, defaultDuration: 360, defaultTickets: 55,
    },
    coop_rescue: {
      id: 'coop_rescue', nameEn: 'Co-op Rescue', nameZh: '合作应急搜救',
      summaryEn: 'Coordinate distinct roles (Medic/Engineer/Recon/Assault) to repair power, locate & evacuate stranded citizens.',
      summaryZh: '2–8 人明确职责分工（医疗 2x 救护、工程 2x 修复设施、侦察标记幸存者、突击清障护航），修复应急设施并护送全部受困市民撤离。',
      teamMode: 'coop', minPlayers: 2, maxPlayers: 8, defaultDuration: 420, defaultTickets: 45,
    },
    coop_campaign: {
      id: 'coop_campaign', nameEn: 'Cooperative Campaign', nameZh: '合作战役（2-4人）',
      summaryEn: 'Play through the redesigned 14-chapter Saltline Crisis story together with shared objectives, puzzles & checkpoints.',
      summaryZh: '支持 2–4 名玩家共同推进重制后的 14 章《盐线危机》剧情，共享章节状态、多人协作解谜、共享检查点与断线恢复。',
      teamMode: 'coop', minPlayers: 2, maxPlayers: 4, defaultDuration: 900, defaultTickets: 60,
    },
    sandbox: {
      id: 'sandbox', nameEn: 'Open World Sandbox', nameZh: '自由探索沙盒',
      summaryEn: 'Free exploration, shared vehicles, dynamic host-triggered weather/world events & custom rules.',
      summaryZh: '无限制自由探索、多人共享载具与乘坐、房主实时触发天气/灾害/AI 事件与自定义规则。',
      teamMode: 'coop', minPlayers: 1, maxPlayers: 8, defaultDuration: 1800, defaultTickets: 999,
    },
  });

  function dist2D(a, b) {
    if (!a || !b) return Infinity;
    const ax = Array.isArray(a) ? a[0] : a.x, az = Array.isArray(a) ? a[2] : a.z;
    const bx = Array.isArray(b) ? b[0] : b.x, bz = Array.isArray(b) ? b[2] : b.z;
    return Math.hypot(ax - bx, az - bz);
  }

  class BaseGameModeController {
    constructor(modeId, config = {}) {
      this.modeId = modeId;
      this.meta = MODE_META[modeId] || MODE_META.conquest;
      this.config = {
        duration: Number(config.duration) || this.meta.defaultDuration,
        startingTickets: Number(config.startingTickets) || this.meta.defaultTickets,
        difficulty: config.difficulty || 'normal',
        weather: config.weather || 'overcast',
        timeOfDay: config.timeOfDay || 'day',
        aiEnabled: config.aiEnabled !== false,
        customRules: config.customRules || {},
        mapSpec: config.mapSpec || null,
      };
      this.stateSeq = 0;
      this.elapsed = 0;
      this.winner = null;
      this.endedReason = '';
      this.players = new Map(); // id -> { id, name, team, role, kills, deaths, captures, rescues, repairs, score }
      this.objectives = [];
      this.eventsLog = [];
    }

    init(playersList = []) {
      this.elapsed = 0;
      this.winner = null;
      this.endedReason = '';
      this.stateSeq = 1;
      this.eventsLog = [];
      this.configurePlayers(playersList);
      this.initObjectives();
    }

    configurePlayers(playersList = []) {
      this.players.clear();
      for (const p of playersList) {
        this.players.set(p.id, {
          id: p.id,
          name: p.name || 'Operator',
          team: this.meta.teamMode === 'coop' ? 'blue' : (p.team === 'red' ? 'red' : 'blue'),
          role: p.role || 'medic',
          kills: 0, deaths: 0, captures: 0, rescues: 0, repairs: 0, score: 0,
        });
      }
    }

    initObjectives() {
      const pts = this.config.mapSpec?.objectives || [
        { id: 'obj_a', short: 'A', labelZh: '北广场', pos: [-26, 0, -40] },
        { id: 'obj_b', short: 'B', labelZh: '中央枢纽', pos: [0, 0, 0] },
        { id: 'obj_c', short: 'C', labelZh: '南码头', pos: [24, 0, 36] },
        { id: 'obj_d', short: 'D', labelZh: '西高地', pos: [-38, 4, 10] },
        { id: 'obj_e', short: 'E', labelZh: '东海堤', pos: [36, 0, -24] },
      ];
      this.objectives = pts.map((o, idx) => ({
        id: o.id || `obj_${idx}`,
        short: o.short || String.fromCharCode(65 + idx),
        labelZh: o.labelZh || o.label || `目标 ${idx + 1}`,
        pos: o.pos,
        owner: null,
        control: 0,
        contested: false,
        locked: false,
        secured: false,
        progress: 0,
      }));
    }

    recordStat(playerId, field, delta = 1, scoreDelta = 0) {
      const p = this.players.get(playerId);
      if (!p) return;
      if (field in p) p[field] += delta;
      p.score += scoreDelta;
    }

    handleEvent(ev) {
      if (!ev || this.winner) return false;
      if (ev.kind === 'kill') {
        this.recordStat(ev.from, 'kills', 1, 100);
        if (ev.targetId) this.recordStat(ev.targetId, 'deaths', 1, 0);
        return true;
      }
      return false;
    }

    getScoreboard() {
      return [...this.players.values()].sort((a, b) => b.score - a.score || b.kills - a.kills);
    }

    checkVictory() {
      return this.winner;
    }

    getSettlement() {
      return {
        mode: this.modeId,
        modeNameZh: this.meta.nameZh,
        modeNameEn: this.meta.nameEn,
        winner: this.winner,
        reason: this.endedReason,
        elapsed: Math.round(this.elapsed),
        scoreboard: this.getScoreboard(),
      };
    }

    exportState() {
      this.stateSeq++;
      return {
        stateSeq: this.stateSeq,
        mode: this.modeId,
        elapsed: Number(this.elapsed.toFixed(2)),
        duration: this.config.duration,
        winner: this.winner,
        endedReason: this.endedReason,
        objectives: this.objectives.map(o => ({
          id: o.id, short: o.short, owner: o.owner, control: Math.round(o.control),
          contested: o.contested, locked: o.locked, secured: o.secured, progress: Number((o.progress || 0).toFixed(2)),
        })),
        scoreboard: this.getScoreboard(),
      };
    }

    applyState(remote) {
      if (!remote || remote.mode !== this.modeId) return false;
      // Monotonic stateSeq guard prevents stale packets from overwriting newer state!
      if (Number.isFinite(remote.stateSeq) && remote.stateSeq < this.stateSeq) return false;
      if (Number.isFinite(remote.stateSeq)) this.stateSeq = remote.stateSeq;
      if (Number.isFinite(remote.elapsed)) this.elapsed = remote.elapsed;
      this.winner = remote.winner ?? null;
      this.endedReason = remote.endedReason || '';
      if (Array.isArray(remote.objectives) && remote.objectives.length === this.objectives.length) {
        for (let i = 0; i < this.objectives.length; i++) {
          Object.assign(this.objectives[i], remote.objectives[i]);
        }
      }
      return true;
    }

    resetForLobby() {
      this.elapsed = 0;
      this.winner = null;
      this.endedReason = '';
      this.eventsLog = [];
      for (const p of this.players.values()) {
        p.kills = p.deaths = p.captures = p.rescues = p.repairs = p.score = 0;
      }
      this.initObjectives();
      this.stateSeq++;
    }
  }

  // 1. CONQUEST CONTROLLER
  class ConquestController extends BaseGameModeController {
    constructor(config) {
      super('conquest', config);
      this.tickets = { blue: this.config.startingTickets, red: this.config.startingTickets };
    }
    init(playersList) {
      super.init(playersList);
      this.tickets = { blue: this.config.startingTickets, red: this.config.startingTickets };
    }
    update(dt, { units = [] } = {}) {
      if (this.winner || !(dt > 0)) return null;
      this.elapsed = Math.min(this.config.duration, this.elapsed + dt);
      for (const obj of this.objectives) {
        let blueCount = 0, redCount = 0, capPlayerId = null;
        for (const u of units) {
          if (!u.alive || dist2D(u.pos, obj.pos) > 8.5) continue;
          if (u.team === 'red') redCount++;
          else { blueCount++; if (!capPlayerId && u.isPlayer) capPlayerId = u.id; }
        }
        obj.contested = blueCount > 0 && redCount > 0;
        if (!obj.contested && (blueCount > 0 || redCount > 0)) {
          const prevOwner = obj.owner;
          const delta = (blueCount - redCount) * 16 * dt;
          obj.control = Math.max(-100, Math.min(100, obj.control + delta));
          if (obj.control >= 100) obj.owner = 'blue';
          else if (obj.control <= -100) obj.owner = 'red';
          else if ((prevOwner === 'blue' && obj.control <= 0) || (prevOwner === 'red' && obj.control >= 0)) obj.owner = null;
          if (obj.owner && obj.owner !== prevOwner && capPlayerId) {
            this.recordStat(capPlayerId, 'captures', 1, 250);
          }
        }
      }
      const diff = this.objectives.reduce((s, o) => s + (o.owner === 'blue' ? 1 : o.owner === 'red' ? -1 : 0), 0);
      if (diff > 0) this.tickets.red = Math.max(0, this.tickets.red - diff * 0.9 * dt);
      if (diff < 0) this.tickets.blue = Math.max(0, this.tickets.blue + diff * 0.9 * dt);
      return this.checkVictory();
    }
    checkVictory() {
      if (this.tickets.blue <= 0 && this.tickets.red <= 0) { this.winner = 'draw'; this.endedReason = '双方兵力同时耗尽'; }
      else if (this.tickets.red <= 0) { this.winner = 'blue'; this.endedReason = '蓝方完全压制并耗尽红方兵力'; }
      else if (this.tickets.blue <= 0) { this.winner = 'red'; this.endedReason = '红方守住防线并耗尽蓝方兵力'; }
      else if (this.elapsed >= this.config.duration) {
        this.winner = this.tickets.blue === this.tickets.red ? 'draw' : (this.tickets.blue > this.tickets.red ? 'blue' : 'red');
        this.endedReason = '对局时间结束，按剩余兵力结算';
      }
      return this.winner;
    }
    exportState() { return { ...super.exportState(), tickets: { ...this.tickets } }; }
    applyState(r) {
      if (!super.applyState(r)) return false;
      if (r.tickets) this.tickets = { blue: r.tickets.blue, red: r.tickets.red };
      return true;
    }
    resetForLobby() { super.resetForLobby(); this.tickets = { blue: this.config.startingTickets, red: this.config.startingTickets }; }
  }

  // 2. BREAKTHROUGH CONTROLLER
  class BreakthroughController extends BaseGameModeController {
    constructor(config) {
      super('breakthrough', config);
      this.sector = 0;
      this.tickets = { blue: this.config.startingTickets, red: 4 };
    }
    initObjectives() {
      super.initObjectives();
      this.objectives = this.objectives.slice(0, 4);
      this.objectives.forEach((o, i) => {
        o.owner = 'red'; o.control = -100; o.locked = i > 0; o.secured = false;
      });
      this.sector = 0;
      this.tickets = { blue: this.config.startingTickets, red: this.objectives.length };
    }
    update(dt, { units = [] } = {}) {
      if (this.winner || !(dt > 0)) return null;
      this.elapsed = Math.min(this.config.duration, this.elapsed + dt);
      const active = this.objectives[this.sector];
      if (active) {
        let blue = 0, red = 0, capId = null;
        for (const u of units) {
          if (!u.alive || dist2D(u.pos, active.pos) > 9.0) continue;
          if (u.team === 'red') red++;
          else { blue++; if (!capId && u.isPlayer) capId = u.id; }
        }
        active.contested = blue > 0 && red > 0;
        if (!active.contested && blue > 0) {
          active.control = Math.min(100, active.control + blue * 18 * dt);
          if (active.control >= 100) {
            active.owner = 'blue';
            active.secured = true;
            this.sector++;
            this.tickets.blue += 15; // Attacker reinforcement bonus on sector breakthrough!
            this.tickets.red = Math.max(0, this.objectives.length - this.sector);
            if (this.objectives[this.sector]) this.objectives[this.sector].locked = false;
            if (capId) this.recordStat(capId, 'captures', 1, 350);
          }
        }
      }
      return this.checkVictory();
    }
    checkVictory() {
      if (this.sector >= this.objectives.length) { this.winner = 'blue'; this.endedReason = '攻方成功突破全部防线！'; }
      else if (this.tickets.blue <= 0 || this.elapsed >= this.config.duration) { this.winner = 'red'; this.endedReason = '守方成功守住最后防线！'; }
      return this.winner;
    }
    exportState() { return { ...super.exportState(), sector: this.sector, tickets: { ...this.tickets } }; }
    applyState(r) {
      if (!super.applyState(r)) return false;
      if (Number.isInteger(r.sector)) this.sector = r.sector;
      if (r.tickets) this.tickets = { blue: r.tickets.blue, red: r.tickets.red };
      return true;
    }
  }

  // 3. CO-OP RESCUE CONTROLLER (Role-Differentiated Teamwork!)
  class CoopRescueController extends BaseGameModeController {
    constructor(config) {
      super('coop_rescue', config);
      this.rescued = 0;
      this.rescueTarget = 6;
      this.facilitiesRepaired = 0;
      this.facilityTarget = 2;
      this.tickets = { blue: this.config.startingTickets, red: this.rescueTarget };
    }
    initObjectives() {
      super.initObjectives();
      this.rescued = 0;
      this.facilitiesRepaired = 0;
      this.objectives.forEach((o, i) => {
        o.kind = i < 2 ? 'facility_repair' : 'civilian_rescue';
        o.progress = 0;
        o.secured = false;
      });
      this.tickets = { blue: this.config.startingTickets, red: this.rescueTarget };
    }
    update(dt, { units = [] } = {}) {
      if (this.winner || !(dt > 0)) return null;
      this.elapsed = Math.min(this.config.duration, this.elapsed + dt);
      for (const obj of this.objectives) {
        if (obj.secured) continue;
        let speed = 0, helperId = null;
        for (const u of units) {
          if (!u.alive || u.team !== 'blue' || dist2D(u.pos, obj.pos) > 7.5) continue;
          // Role differentiation: Engineers repair 2x faster, Medics rescue 2x faster, Recon gives +30% aura!
          const roleMul = (obj.kind === 'facility_repair' && u.role === 'engineer') ? 2.0
            : (obj.kind === 'civilian_rescue' && u.role === 'medic') ? 2.0
            : (u.role === 'recon' ? 1.3 : 1.0);
          speed += 0.16 * roleMul;
          if (!helperId && u.isPlayer) helperId = u.id;
        }
        if (speed > 0) {
          obj.progress = Math.min(1, obj.progress + speed * dt);
          if (obj.progress >= 1) {
            obj.secured = true;
            obj.owner = 'blue';
            if (obj.kind === 'facility_repair') {
              this.facilitiesRepaired++;
              if (helperId) this.recordStat(helperId, 'repairs', 1, 300);
            } else {
              this.rescued = Math.min(this.rescueTarget, this.rescued + 2);
              if (helperId) this.recordStat(helperId, 'rescues', 2, 400);
            }
            this.tickets.red = Math.max(0, this.rescueTarget - this.rescued);
          }
        }
      }
      return this.checkVictory();
    }
    checkVictory() {
      if (this.rescued >= this.rescueTarget && this.facilitiesRepaired >= this.facilityTarget) {
        this.winner = 'blue';
        this.endedReason = `全部 ${this.rescueTarget} 名受困市民安全撤离，应急设施恢复运转！`;
      } else if (this.tickets.blue <= 0 || this.elapsed >= this.config.duration) {
        this.winner = 'red';
        this.endedReason = '搜救窗口超时或救援队全员失去行动能力。';
      }
      return this.winner;
    }
    exportState() {
      return {
        ...super.exportState(),
        rescued: this.rescued, rescueTarget: this.rescueTarget,
        facilitiesRepaired: this.facilitiesRepaired, facilityTarget: this.facilityTarget,
        tickets: { ...this.tickets },
      };
    }
    applyState(r) {
      if (!super.applyState(r)) return false;
      if (Number.isFinite(r.rescued)) this.rescued = r.rescued;
      if (Number.isFinite(r.facilitiesRepaired)) this.facilitiesRepaired = r.facilitiesRepaired;
      if (r.tickets) this.tickets = { blue: r.tickets.blue, red: r.tickets.red };
      return true;
    }
  }

  // 4. COOPERATIVE CAMPAIGN CONTROLLER (2–4P Shared 14-Chapter Progression)
  class CoopCampaignController extends BaseGameModeController {
    constructor(config) {
      super('coop_campaign', config);
      this.chapterIndex = Number(config.startChapterIndex) || 0;
      this.objectiveIndex = 0;
      this.sharedCheckpoint = null;
      this.coopHoldProgress = 0;
      this.choices = {};
    }
    getChapters() {
      return (typeof window !== 'undefined' && window.SaltlineCampaignV2?.SALTLINE_CHAPTERS) || [];
    }
    init(playersList) {
      super.init(playersList);
      this.objectiveIndex = 0;
      this.coopHoldProgress = 0;
      this.syncChapterObjectives();
    }
    syncChapterObjectives() {
      const chapters = this.getChapters();
      const ch = chapters[this.chapterIndex];
      if (!ch) return;
      this.objectives = ch.objectives.map((o, i) => ({
        id: o.id, short: `S${i + 1}`, labelZh: o.titleZh, pos: o.target,
        owner: i < this.objectiveIndex ? 'blue' : null,
        control: i < this.objectiveIndex ? 100 : 0,
        contested: false, locked: i > this.objectiveIndex, secured: i < this.objectiveIndex,
        progress: i < this.objectiveIndex ? 1 : 0,
      }));
      this.sharedCheckpoint = { chapterId: ch.id, chapterIndex: this.chapterIndex, objectiveIndex: this.objectiveIndex };
    }
    update(dt, { units = [] } = {}) {
      if (this.winner || !(dt > 0)) return null;
      this.elapsed += dt;
      const activeObj = this.objectives[this.objectiveIndex];
      if (!activeObj) return this.checkVictory();
      // Require cooperative presence: scales dynamically with active player count (1+ players near objective, faster with 2-4!)
      const activePlayers = units.filter(u => u.alive && u.isPlayer);
      const nearPlayers = activePlayers.filter(u => dist2D(u.pos, activeObj.pos) <= 9.0);
      if (nearPlayers.length > 0) {
        const coopBonus = 1 + (nearPlayers.length - 1) * 0.55;
        activeObj.progress = Math.min(1, activeObj.progress + 0.25 * coopBonus * dt);
        if (activeObj.progress >= 1) {
          activeObj.secured = true;
          activeObj.owner = 'blue';
          for (const p of nearPlayers) this.recordStat(p.id, 'captures', 1, 200);
          this.objectiveIndex++;
          if (this.objectives[this.objectiveIndex]) {
            this.objectives[this.objectiveIndex].locked = false;
            this.sharedCheckpoint = { chapterIndex: this.chapterIndex, objectiveIndex: this.objectiveIndex };
          } else {
            this.winner = 'blue';
            this.endedReason = `合作完成章节 ${this.chapterIndex + 1}！全员共享检查点已保存，可加载下一章。`;
          }
        }
      }
      return this.checkVictory();
    }
    advanceToNextChapter() {
      const chapters = this.getChapters();
      if (this.chapterIndex + 1 < chapters.length) {
        this.chapterIndex++;
        this.objectiveIndex = 0;
        this.winner = null;
        this.endedReason = '';
        this.syncChapterObjectives();
        this.stateSeq++;
        return true;
      }
      return false;
    }
    exportState() {
      return {
        ...super.exportState(),
        chapterIndex: this.chapterIndex,
        objectiveIndex: this.objectiveIndex,
        sharedCheckpoint: this.sharedCheckpoint,
        choices: this.choices,
      };
    }
    applyState(r) {
      if (!super.applyState(r)) return false;
      if (Number.isInteger(r.chapterIndex) && r.chapterIndex !== this.chapterIndex) {
        this.chapterIndex = r.chapterIndex;
        this.syncChapterObjectives();
      }
      if (Number.isInteger(r.objectiveIndex)) this.objectiveIndex = r.objectiveIndex;
      if (r.sharedCheckpoint) this.sharedCheckpoint = r.sharedCheckpoint;
      if (r.choices) this.choices = { ...r.choices };
      return true;
    }
  }

  // 5. OPEN WORLD SANDBOX CONTROLLER (Host Rules + World Events + Free Exploration)
  class SandboxController extends BaseGameModeController {
    constructor(config) {
      super('sandbox', config);
      this.worldState = {
        weather: this.config.weather || 'clear',
        timeOfDay: this.config.timeOfDay || 'day',
        aiWaves: Boolean(this.config.customRules?.aiWaves),
        infiniteAmmo: this.config.customRules?.infiniteAmmo !== false,
        activeEvent: null,
      };
    }
    triggerWorldEvent(eventName) {
      this.worldState.activeEvent = { name: eventName, triggeredAt: Math.round(this.elapsed) };
      this.eventsLog.push(this.worldState.activeEvent);
      this.stateSeq++;
      return this.worldState.activeEvent;
    }
    update(dt) {
      if (this.winner || !(dt > 0)) return null;
      this.elapsed += dt;
      return null;
    }
    endSandboxSession() {
      this.winner = 'blue';
      this.endedReason = '房主结束了自由沙盒探索会话。';
      this.stateSeq++;
      return this.getSettlement();
    }
    exportState() { return { ...super.exportState(), worldState: { ...this.worldState } }; }
    applyState(r) {
      if (!super.applyState(r)) return false;
      if (r.worldState) this.worldState = { ...r.worldState };
      return true;
    }
  }

  function createGameModeController(modeId, config = {}) {
    switch (modeId) {
      case 'breakthrough': return new BreakthroughController(config);
      case 'coop_rescue': return new CoopRescueController(config);
      case 'coop_campaign': return new CoopCampaignController(config);
      case 'sandbox': return new SandboxController(config);
      case 'conquest':
      default: return new ConquestController(config);
    }
  }

  const exported = {
    MODE_META,
    ConquestController,
    BreakthroughController,
    CoopRescueController,
    CoopCampaignController,
    SandboxController,
    createGameModeController,
  };

  if (typeof window !== 'undefined') window.SaltlineMPModes = exported;
  if (typeof module !== 'undefined' && module.exports) module.exports = exported;
})();
