/* WorldEngine/Performance/ChunkManager.js
 * Distance-based Chunk Streaming, LOD Detail Switching & Adaptive Resolution Scaler
 * targeting smooth 60 FPS in browser Three.js WebGL open-world scenes. */
(() => {
  const WE = (window.WorldEngine = window.WorldEngine || {});

  function createChunkManager({ renderer, sectors, syncColliders, targetFps = 55 } = {}) {
    const baseDpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    let currentScale = 1.0;
    let fpsEma = 60;
    let evalClock = 0;

    function update(dt, playerPos) {
      if (!(dt > 0)) return { loadedCount: 0, detailedCount: 0, fps: Math.round(fpsEma), dprScale: currentScale };
      const instFps = 1 / Math.max(0.004, dt);
      fpsEma = fpsEma * 0.92 + instFps * 0.08;

      let loadedCount = 0, detailedCount = 0;
      if (Array.isArray(sectors)) {
        for (const sec of sectors) {
          const dist = playerPos ? playerPos.distanceTo(sec.center) : 999;
          const wantShell = dist <= sec.streamRadius;
          const wantDetail = dist <= sec.detailRadius;
          if (sec.loaded !== wantShell) {
            sec.loaded = wantShell;
            sec.shell.visible = wantShell;
            syncColliders?.(sec, wantShell);
          }
          if (sec.detailed !== wantDetail) {
            sec.detailed = wantDetail;
            sec.detail.visible = wantDetail;
          }
          if (sec.loaded) loadedCount++;
          if (sec.detailed) detailedCount++;
        }
      }

      // Dynamic resolution scaling (P1) — smoothly nudges DPR down under heavy load, recovers when > targetFps
      evalClock += dt;
      if (evalClock >= 2.5 && renderer?.setPixelRatio) {
        evalClock = 0;
        let nextScale = currentScale;
        if (fpsEma < targetFps - 12 && currentScale > 0.72) nextScale = Math.max(0.72, currentScale - 0.08);
        else if (fpsEma > targetFps + 3 && currentScale < 1.0) nextScale = Math.min(1.0, currentScale + 0.05);
        if (Math.abs(nextScale - currentScale) > 0.01) {
          currentScale = nextScale;
          try { renderer.setPixelRatio(Math.max(0.75, baseDpr * currentScale)); } catch {}
        }
      }

      return { loadedCount, detailedCount, fps: Math.round(fpsEma), dprScale: currentScale };
    }

    function dispose() {
      if (renderer?.setPixelRatio) {
        try { renderer.setPixelRatio(baseDpr); } catch {}
      }
    }

    return { update, dispose, get fps() { return Math.round(fpsEma); } };
  }

  WE.createChunkManager = createChunkManager;
})();
