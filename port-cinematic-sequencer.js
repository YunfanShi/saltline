/* Reusable AAA Cinematic Timeline & Set-Piece Sequencer.
 * Coordinates multi-beat scripted events (vehicles, structural collapses, lighting,
 * dialogue, camera feel, and environmental reactions) while keeping player agency intact. */
(() => {
  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  const smoothstep = t => {
    const x = clamp(t);
    return x * x * (3 - 2 * x);
  };

  window.createCinematicSequencer = () => {
    const active = [];

    function play({ id, duration, cues = [], tracks = [], onComplete = null }) {
      if (!Number.isFinite(duration) || duration <= 0) return null;
      // Prevent duplicate concurrent plays of the same sequence ID
      if (id && active.some(s => s.id === id)) return null;
      const run = {
        id: id ?? ('seq-' + Date.now()),
        duration,
        elapsed: 0,
        cues: cues.map(c => ({ ...c, fired: false })),
        tracks,
        onComplete,
        done: false,
      };
      active.push(run);
      return run;
    }

    function update(dt) {
      if (!Number.isFinite(dt) || dt <= 0) return;
      for (let i = active.length - 1; i >= 0; i--) {
        const run = active[i];
        const prev = run.elapsed;
        run.elapsed = Math.min(run.duration, run.elapsed + dt);
        for (const cue of run.cues) {
          if (!cue.fired && run.elapsed >= cue.at) {
            cue.fired = true;
            try { cue.run?.(run.elapsed); } catch (e) { console.error('[sequencer] cue error', e); }
          }
        }
        for (const track of run.tracks) {
          const start = track.start ?? 0;
          const end = track.end ?? run.duration;
          if (run.elapsed >= start && prev <= end) {
            const span = Math.max(.0001, end - start);
            const raw = clamp((run.elapsed - start) / span);
            try { track.update?.(raw, smoothstep(raw), dt, run.elapsed); }
            catch (e) { console.error('[sequencer] track error', e); }
          }
        }
        if (run.elapsed >= run.duration) {
          run.done = true;
          active.splice(i, 1);
          try { run.onComplete?.(); } catch (e) { console.error('[sequencer] complete error', e); }
        }
      }
    }

    function stopAll() {
      active.length = 0;
    }

    return {
      play, update, stopAll,
      isPlaying(id) { return id ? active.some(s => s.id === id) : active.length > 0; },
      smoothstep, clamp,
    };
  };
})();
