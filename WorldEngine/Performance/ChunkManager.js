/* WorldEngine/Performance/ChunkManager.js
 * True Open-World Chunk Streaming Engine:
 *   - Chunk Lifecycle State Machine: UNLOADED -> QUEUED -> ACTIVE (LOD0/LOD1/LOD2) -> DORMANT -> UNLOADED
 *   - Distance Hysteresis (prevents boundary thrashing/pop-in)
 *   - Priority Queue & Time-Sliced Incremental Activation (budgetMs per frame)
 *   - Resource Reference Counting & Real GPU Geometry/Material Disposal on Unload
 *   - Quality Presets (low / medium / high / ultra) + Dynamic Resolution Scaler + Real Telemetry Stats */
(() => {
  const WE = (window.WorldEngine = window.WorldEngine || {});

  const QUALITY_PRESETS = {
    low:    { streamMul: 0.72, detailMul: 0.62, maxDprScale: 0.80, minDprScale: 0.62, budgetMs: 2.5 },
    medium: { streamMul: 0.88, detailMul: 0.80, maxDprScale: 0.92, minDprScale: 0.70, budgetMs: 3.5 },
    high:   { streamMul: 1.00, detailMul: 1.00, maxDprScale: 1.00, minDprScale: 0.75, budgetMs: 4.5 },
    ultra:  { streamMul: 1.25, detailMul: 1.25, maxDprScale: 1.00, minDprScale: 0.85, budgetMs: 6.0 },
  };

  function createChunkManager({
    renderer, sectors = [], syncColliders, targetFps = 55, quality = 'high',
    hysteresis = 22, dormantTtlSec = 12,
  } = {}) {
    const baseDpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    let preset = QUALITY_PRESETS[quality] || QUALITY_PRESETS.high;
    let currentQuality = QUALITY_PRESETS[quality] ? quality : 'high';
    let currentScale = preset.maxDprScale;
    let fpsEma = 60;
    let frameMsEma = 16.6;
    let evalClock = 0;
    let lastStreamingMs = 0;
    let totalDisposals = 0;

    // Resource reference table for genuine GPU lifecycle tracking
    const resourceRefs = new Map();
    function trackObjectResources(rootObj, delta) {
      if (!rootObj?.traverse) return;
      rootObj.traverse(node => {
        if (node.geometry) {
          const next = (resourceRefs.get(node.geometry) || 0) + delta;
          if (next <= 0) {
            resourceRefs.delete(node.geometry);
            if (node.geometry.userData?.streamOwned) { node.geometry.dispose?.(); totalDisposals++; }
          } else resourceRefs.set(node.geometry, next);
        }
        if (node.material) {
          const mats = Array.isArray(node.material) ? node.material : [node.material];
          for (const m of mats) {
            const next = (resourceRefs.get(m) || 0) + delta;
            if (next <= 0) {
              resourceRefs.delete(m);
              if (m.userData?.streamOwned) { m.dispose?.(); totalDisposals++; }
            } else resourceRefs.set(m, next);
          }
        }
      });
    }

    // Initialize per-chunk streaming metadata on each sector
    const chunks = sectors.map(sec => ({
      sec,
      state: sec.loaded ? 'ACTIVE' : 'UNLOADED', // UNLOADED | QUEUED | ACTIVE | DORMANT
      lod: sec.detailed ? 0 : (sec.loaded ? 1 : 2),
      dormantClock: 0,
      lastDist: 999,
      priority: 0,
    }));

    function activateChunk(chunk) {
      const { sec } = chunk;
      if (typeof sec.onBuild === 'function' && !sec._built) {
        sec._started = true;
        if (sec.onBuild() === false) return false;
        sec._built = true;
      }
      if (!sec.loaded) {
        sec.loaded = true;
        if (sec.shell) sec.shell.visible = true;
        syncColliders?.(sec, true);
        trackObjectResources(sec.shell, 1);
        trackObjectResources(sec.detail, 1);
      }
      chunk.state = 'ACTIVE';
      chunk.dormantClock = 0;
    }

    function unloadChunk(chunk) {
      const { sec } = chunk;
      if (sec.detailed) {
        sec.detailed = false;
        if (sec.detail) sec.detail.visible = false;
      }
      if (sec.loaded) {
        sec.loaded = false;
        if (sec.shell) sec.shell.visible = false;
        syncColliders?.(sec, false);
        trackObjectResources(sec.shell, -1);
        trackObjectResources(sec.detail, -1);
      }
      if (typeof sec.onUnload === 'function' && sec._started) {
        sec.onUnload();
        sec._built = false;
        sec._started = false;
      }
      chunk.state = 'UNLOADED';
      chunk.lod = 2;
      chunk.dormantClock = 0;
    }

    function setQuality(qName) {
      if (!QUALITY_PRESETS[qName]) return currentQuality;
      currentQuality = qName;
      preset = QUALITY_PRESETS[qName];
      currentScale = Math.min(currentScale, preset.maxDprScale);
      if (renderer?.setPixelRatio) {
        try { renderer.setPixelRatio(Math.max(0.65, baseDpr * currentScale)); } catch {}
      }
      return currentQuality;
    }

    const nowMs = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());

    function update(dt, playerPos, cameraDir = null) {
      if (!(dt > 0)) return getStats();
      const t0 = nowMs();
      const instFps = 1 / Math.max(0.004, dt);
      fpsEma = fpsEma * 0.90 + instFps * 0.10;
      frameMsEma = frameMsEma * 0.90 + (dt * 1000) * 0.10;

      const queue = [];
      for (const ch of chunks) {
        const { sec } = ch;
        const dist = playerPos ? playerPos.distanceTo(sec.center) : 999;
        ch.lastDist = dist;

        const loadR = (sec.streamRadius || 275) * preset.streamMul;
        const unloadR = loadR + hysteresis;
        const detailInR = (sec.detailRadius || 195) * preset.detailMul;
        const detailOutR = detailInR + hysteresis * 0.8;

        // Forward-view bias boosts priority for chunks in front of camera
        let viewBonus = 0;
        if (cameraDir && playerPos) {
          const dx = sec.center.x - playerPos.x, dz = sec.center.z - playerPos.z;
          const inv = 1 / Math.max(1, Math.hypot(dx, dz));
          viewBonus = Math.max(0, (dx * cameraDir.x + dz * cameraDir.z) * inv) * 45;
        }
        ch.priority = dist - viewBonus;

        if (dist <= loadR) {
          if (ch.state === 'UNLOADED' || ch.state === 'QUEUED') {
            ch.state = 'QUEUED';
            queue.push(ch);
          } else if (ch.state === 'DORMANT') {
            activateChunk(ch);
          }
          // LOD0 <-> LOD1 hysteresis switching on active chunks
          if (ch.state === 'ACTIVE') {
            if (!sec.detailed && dist <= detailInR) {
              sec.detailed = true;
              if (sec.detail) sec.detail.visible = true;
              ch.lod = 0;
            } else if (sec.detailed && dist > detailOutR) {
              sec.detailed = false;
              if (sec.detail) sec.detail.visible = false;
              ch.lod = 1;
            }
          }
        } else if (dist > unloadR) {
          if (ch.state === 'ACTIVE') {
            // Transition to DORMANT first so rapid camera turn-backs don't thrash GPU
            ch.state = 'DORMANT';
            ch.dormantClock = 0;
            if (sec.detailed) {
              sec.detailed = false;
              if (sec.detail) sec.detail.visible = false;
            }
            ch.lod = 1;
          } else if (ch.state === 'DORMANT') {
            ch.dormantClock += dt;
            if (ch.dormantClock >= dormantTtlSec) unloadChunk(ch);
          } else if (ch.state === 'QUEUED') {
            unloadChunk(ch);
          }
        }
      }

      // Priority-sorted time-sliced incremental activation (prevents frame hitches!)
      if (queue.length) {
        queue.sort((a, b) => a.priority - b.priority);
        const deadline = t0 + preset.budgetMs;
        for (let i = 0; i < queue.length; i++) {
          if (activateChunk(queue[i]) === false) {
            if (nowMs() >= deadline) break;
            continue;
          }
          if (queue[i].lastDist <= (queue[i].sec.detailRadius || 195) * preset.detailMul) {
            queue[i].sec.detailed = true;
            if (queue[i].sec.detail) queue[i].sec.detail.visible = true;
            queue[i].lod = 0;
          }
          if (nowMs() >= deadline && i >= 0) break;
        }
      }

      // Adaptive Dynamic Resolution Scaler (respects user quality preset bounds)
      evalClock += dt;
      if (evalClock >= 2.2 && renderer?.setPixelRatio) {
        evalClock = 0;
        let nextScale = currentScale;
        if (fpsEma < targetFps - 10 && currentScale > preset.minDprScale) {
          nextScale = Math.max(preset.minDprScale, currentScale - 0.06);
        } else if (fpsEma > targetFps + 3 && currentScale < preset.maxDprScale) {
          nextScale = Math.min(preset.maxDprScale, currentScale + 0.04);
        }
        if (Math.abs(nextScale - currentScale) > 0.01) {
          currentScale = nextScale;
          try { renderer.setPixelRatio(Math.max(0.65, baseDpr * currentScale)); } catch {}
        }
      }

      lastStreamingMs = nowMs() - t0;
      return getStats();
    }

    function getStats() {
      let loadedCount = 0, detailedCount = 0, dormantCount = 0, unloadedCount = 0;
      for (const ch of chunks) {
        if (ch.state === 'ACTIVE') loadedCount++;
        else if (ch.state === 'DORMANT') dormantCount++;
        else unloadedCount++;
        if (ch.sec.detailed) detailedCount++;
      }
      const info = renderer?.info;
      return {
        loadedCount,
        detailedCount,
        dormantCount,
        unloadedCount,
        fps: Math.round(fpsEma),
        frameTimeMs: Number(frameMsEma.toFixed(2)),
        streamingMs: Number(lastStreamingMs.toFixed(2)),
        dprScale: Number(currentScale.toFixed(2)),
        quality: currentQuality,
        trackedResources: resourceRefs.size,
        totalDisposals,
        drawCalls: info?.render?.calls ?? 0,
        triangles: info?.render?.triangles ?? 0,
        gpuGeometries: info?.memory?.geometries ?? 0,
        gpuTextures: info?.memory?.textures ?? 0,
      };
    }

    function dispose() {
      for (const ch of chunks) unloadChunk(ch);
      resourceRefs.clear();
      if (renderer?.setPixelRatio) {
        try { renderer.setPixelRatio(baseDpr); } catch {}
      }
    }

    return {
      update,
      setQuality,
      getStats,
      dispose,
      get fps() { return Math.round(fpsEma); },
      get quality() { return currentQuality; },
    };
  }

  WE.createChunkManager = createChunkManager;
})();
