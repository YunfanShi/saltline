/* SALTLINE — Procedural Web Audio API Soundscape, Foley & Cinematic SFX Engine (v2).
 * Zero external audio file dependencies; unlocks safely on first user gesture.
 * Provides layered coastal ambience (surf, wind, rain, foghorn), tactile console/valve/breaker foley,
 * radio PTT squelch, cinematic chapter swells, storm thunder, and multi-stage aircraft crash audio. */
(() => {
  'use strict';

  function createSaltlineAudioV2() {
    let ctx = null;
    let masterGain = null;
    let ambGain = null;
    let sfxGain = null;
    let noiseBuffer = null;
    let unlocked = false;
    let muted = false;
    let masterVolume = 0.72;

    // Continuous ambience nodes
    let currentWeather = null;
    let ambNodes = null;
    let foghornTimer = null;

    function ensureContext() {
      if (ctx) {
        if (ctx.state === 'suspended') {
          try { ctx.resume(); } catch {}
        }
        return ctx;
      }
      const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
      if (!AC) return null;
      try {
        ctx = new AC();
        masterGain = ctx.createGain();
        masterGain.gain.value = muted ? 0 : masterVolume;
        masterGain.connect(ctx.destination);

        ambGain = ctx.createGain();
        ambGain.gain.value = 0.42;
        ambGain.connect(masterGain);

        sfxGain = ctx.createGain();
        sfxGain.gain.value = 0.85;
        sfxGain.connect(masterGain);

        // Pre-bake 3 seconds of smooth white/pink-ish noise for wind, surf, rain, explosions & squelch
        const sr = ctx.sampleRate || 44100;
        const len = sr * 3;
        noiseBuffer = ctx.createBuffer(1, len, sr);
        const data = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < len; i++) {
          const w = Math.random() * 2 - 1;
          b0 = 0.997 * b0 + w * 0.029;
          b1 = 0.985 * b1 + w * 0.032;
          b2 = 0.950 * b2 + w * 0.048;
          data[i] = Math.max(-1, Math.min(1, (b0 + b1 + b2 + w * 0.18) * 1.45));
        }
        unlocked = true;
      } catch {
        ctx = null;
      }
      return ctx;
    }

    function unlock() {
      const c = ensureContext();
      if (c && c.state === 'suspended') {
        try { c.resume(); } catch {}
      }
      return !!c;
    }

    function setVolume(vol) {
      masterVolume = Math.max(0, Math.min(1, Number(vol) || 0));
      if (masterGain && ctx) {
        masterGain.gain.setTargetAtTime(muted ? 0 : masterVolume, ctx.currentTime, 0.05);
      }
    }

    function setMuted(isMuted) {
      muted = !!isMuted;
      if (masterGain && ctx) {
        masterGain.gain.setTargetAtTime(muted ? 0 : masterVolume, ctx.currentTime, 0.05);
      }
    }

    function stopAmbience() {
      if (foghornTimer) { clearInterval(foghornTimer); foghornTimer = null; }
      if (!ambNodes) return;
      for (const n of ambNodes) {
        try { n.stop?.(); } catch {}
        try { n.disconnect?.(); } catch {}
      }
      ambNodes = null;
      currentWeather = null;
    }

    function playFoghorn(gainLevel = 0.14) {
      const c = ensureContext();
      if (!c || !sfxGain) return;
      const now = c.currentTime;
      const out = c.createGain();
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(310, now);
      lp.Q.value = 1.8;
      out.gain.setValueAtTime(0.0001, now);
      out.gain.exponentialRampToValueAtTime(gainLevel, now + 0.45);
      out.gain.setValueAtTime(gainLevel * 0.92, now + 1.9);
      out.gain.exponentialRampToValueAtTime(0.0001, now + 3.4);
      lp.connect(out);
      out.connect(ambGain);

      for (const [freq, detune] of [[92.5, 0], [138.6, 4], [185.0, -5]]) {
        const osc = c.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime(detune, now);
        osc.connect(lp);
        osc.start(now);
        osc.stop(now + 3.5);
      }
    }

    function setAmbience(weather = 'overcast_mist') {
      if (currentWeather === weather && ambNodes) return;
      stopAmbience();
      currentWeather = weather;
      const c = ensureContext();
      if (!c || !noiseBuffer || !ambGain) return;

      const isStorm = /storm|gale|heavy_rain/i.test(weather);
      const isRain = isStorm || /rain|drizzle/i.test(weather);
      const isUnderground = /underground/i.test(weather);
      const isClear = /clear/i.test(weather);

      const nodes = [];
      const now = c.currentTime;

      // Layer 1: Ocean Surf / Deep Subterranean Hum
      const surfSrc = c.createBufferSource();
      surfSrc.buffer = noiseBuffer;
      surfSrc.loop = true;
      const surfFilter = c.createBiquadFilter();
      surfFilter.type = 'lowpass';
      surfFilter.frequency.value = isUnderground ? 130 : (isStorm ? 420 : 260);
      const surfGain = c.createGain();
      surfGain.gain.value = isUnderground ? 0.16 : (isStorm ? 0.34 : 0.22);

      // Slow wave-breaking LFO
      const lfo = c.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = isStorm ? 0.22 : 0.12;
      const lfoDepth = c.createGain();
      lfoDepth.gain.value = isUnderground ? 18 : 110;
      lfo.connect(lfoDepth);
      lfoDepth.connect(surfFilter.frequency);
      lfo.start(now);

      surfSrc.connect(surfFilter);
      surfFilter.connect(surfGain);
      surfGain.connect(ambGain);
      surfSrc.start(now);
      nodes.push(surfSrc, surfFilter, surfGain, lfo, lfoDepth);

      // Layer 2: Coastal Wind Bed
      if (!isUnderground) {
        const windSrc = c.createBufferSource();
        windSrc.buffer = noiseBuffer;
        windSrc.loop = true;
        const windBp = c.createBiquadFilter();
        windBp.type = 'bandpass';
        windBp.frequency.value = isStorm ? 680 : (isClear ? 380 : 510);
        windBp.Q.value = isStorm ? 2.4 : 1.6;
        const windGain = c.createGain();
        windGain.gain.value = isStorm ? 0.26 : (isClear ? 0.06 : 0.12);

        const wLfo = c.createOscillator();
        wLfo.type = 'sine';
        wLfo.frequency.value = isStorm ? 0.35 : 0.17;
        const wDepth = c.createGain();
        wDepth.gain.value = isStorm ? 260 : 90;
        wLfo.connect(wDepth);
        wDepth.connect(windBp.frequency);
        wLfo.start(now);

        windSrc.connect(windBp);
        windBp.connect(windGain);
        windGain.connect(ambGain);
        windSrc.start(now);
        nodes.push(windSrc, windBp, windGain, wLfo, wDepth);
      }

      // Layer 3: Crisp Rain Patter
      if (isRain) {
        const rainSrc = c.createBufferSource();
        rainSrc.buffer = noiseBuffer;
        rainSrc.loop = true;
        const rainHp = c.createBiquadFilter();
        rainHp.type = 'highpass';
        rainHp.frequency.value = 1800;
        const rainGain = c.createGain();
        rainGain.gain.value = isStorm ? 0.20 : 0.09;
        rainSrc.connect(rainHp);
        rainHp.connect(rainGain);
        rainGain.connect(ambGain);
        rainSrc.start(now);
        nodes.push(rainSrc, rainHp, rainGain);
      }

      ambNodes = nodes;

      // Occasional distant harbor foghorn for coastal immersion
      if (!isUnderground) {
        foghornTimer = setInterval(() => {
          if (!muted && ctx && ctx.state === 'running' && Math.random() < 0.45) {
            playFoghorn(isStorm ? 0.16 : 0.09);
          }
        }, 26000);
      }
    }

    // Tactile console button press + digital confirmation chime
    function playButtonPress() {
      const c = ensureContext();
      if (!c || !sfxGain) return;
      const now = c.currentTime;

      // Mechanical switch click
      const clickOsc = c.createOscillator();
      const clickGain = c.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(1400, now);
      clickOsc.frequency.exponentialRampToValueAtTime(220, now + 0.032);
      clickGain.gain.setValueAtTime(0.32, now);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      clickOsc.connect(clickGain);
      clickGain.connect(sfxGain);
      clickOsc.start(now);
      clickOsc.stop(now + 0.045);

      // Dual confirmation tone
      for (const [delay, freq] of [[0.035, 660], [0.11, 990]]) {
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);
        g.gain.setValueAtTime(0.0001, now + delay);
        g.gain.linearRampToValueAtTime(0.18, now + delay + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.24);
        osc.connect(g);
        g.connect(sfxGain);
        osc.start(now + delay);
        osc.stop(now + delay + 0.26);
      }
    }

    // Hydraulic valve turn + steam/pressure release hiss
    function playValveTurn() {
      const c = ensureContext();
      if (!c || !sfxGain || !noiseBuffer) return;
      const now = c.currentTime;

      // Metallic groan
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(145, now);
      osc.frequency.linearRampToValueAtTime(98, now + 0.48);
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 320;
      bp.Q.value = 4.0;
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.26, now + 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
      osc.connect(bp); bp.connect(g); g.connect(sfxGain);
      osc.start(now); osc.stop(now + 0.55);

      // Pressurized hydraulic hiss
      const hiss = c.createBufferSource();
      hiss.buffer = noiseBuffer;
      const hp = c.createBiquadFilter();
      hp.type = 'bandpass';
      hp.frequency.setValueAtTime(2400, now + 0.12);
      hp.frequency.exponentialRampToValueAtTime(950, now + 0.72);
      const hg = c.createGain();
      hg.gain.setValueAtTime(0.0001, now + 0.12);
      hg.gain.linearRampToValueAtTime(0.24, now + 0.2);
      hg.gain.exponentialRampToValueAtTime(0.0001, now + 0.78);
      hiss.connect(hp); hp.connect(hg); hg.connect(sfxGain);
      hiss.start(now + 0.12); hiss.stop(now + 0.8);
    }

    // Heavy breaker throw + transformer power-up hum
    function playBreakerThrow() {
      const c = ensureContext();
      if (!c || !sfxGain) return;
      const now = c.currentTime;

      // Heavy metal clunk
      const clunk = c.createOscillator();
      const cg = c.createGain();
      clunk.type = 'square';
      clunk.frequency.setValueAtTime(190, now);
      clunk.frequency.exponentialRampToValueAtTime(48, now + 0.08);
      cg.gain.setValueAtTime(0.36, now);
      cg.gain.exponentialRampToValueAtTime(0.0001, now + 0.095);
      clunk.connect(cg); cg.connect(sfxGain);
      clunk.start(now); clunk.stop(now + 0.11);

      // Electrical hum rising to 100Hz/200Hz
      for (const [f0, f1, amp] of [[52, 100, 0.2], [104, 200, 0.11]]) {
        const hum = c.createOscillator();
        const hg = c.createGain();
        hum.type = 'sawtooth';
        hum.frequency.setValueAtTime(f0, now + 0.06);
        hum.frequency.exponentialRampToValueAtTime(f1, now + 0.65);
        const lp = c.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 420;
        hg.gain.setValueAtTime(0.001, now + 0.06);
        hg.gain.linearRampToValueAtTime(amp, now + 0.22);
        hg.gain.exponentialRampToValueAtTime(0.001, now + 1.15);
        hum.connect(lp); lp.connect(hg); hg.connect(sfxGain);
        hum.start(now + 0.06); hum.stop(now + 1.2);
      }
    }

    // Authentic handheld VHF radio PTT squelch chirp
    function playRadioSquelch(opening = true) {
      const c = ensureContext();
      if (!c || !sfxGain || !noiseBuffer) return;
      const now = c.currentTime;

      const burst = c.createBufferSource();
      burst.buffer = noiseBuffer;
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 2100;
      bp.Q.value = 3.2;
      const bg = c.createGain();
      bg.gain.setValueAtTime(0.16, now);
      bg.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);
      burst.connect(bp); bp.connect(bg); bg.connect(sfxGain);
      burst.start(now); burst.stop(now + 0.085);

      const chirp = c.createOscillator();
      const cg = c.createGain();
      chirp.type = 'sine';
      chirp.frequency.setValueAtTime(opening ? 1320 : 980, now);
      chirp.frequency.setValueAtTime(opening ? 1760 : 720, now + 0.032);
      cg.gain.setValueAtTime(0.12, now);
      cg.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
      chirp.connect(cg); cg.connect(sfxGain);
      chirp.start(now); chirp.stop(now + 0.075);
    }

    // Multi-stage cinematic Aircraft Crash audio (Doppler engine roar -> stall alarm -> massive impact & fire!)
    function playAircraftCrash(impactDelaySec = 3.2) {
      const c = ensureContext();
      if (!c || !sfxGain || !noiseBuffer) return;
      const now = c.currentTime;
      const tImpact = now + Math.max(0.8, impactDelaySec);

      // 1. Approaching twin-engine turboprop roar with Doppler drop
      const engOsc = c.createOscillator();
      const engSub = c.createOscillator();
      const engLp = c.createBiquadFilter();
      const engGain = c.createGain();
      engOsc.type = 'sawtooth';
      engSub.type = 'triangle';
      engOsc.frequency.setValueAtTime(165, now);
      engOsc.frequency.exponentialRampToValueAtTime(215, now + impactDelaySec * 0.55);
      engOsc.frequency.exponentialRampToValueAtTime(68, tImpact);
      engSub.frequency.setValueAtTime(82, now);
      engSub.frequency.exponentialRampToValueAtTime(34, tImpact);
      engLp.type = 'lowpass';
      engLp.frequency.setValueAtTime(520, now);
      engLp.frequency.exponentialRampToValueAtTime(1400, now + impactDelaySec * 0.7);
      engLp.frequency.exponentialRampToValueAtTime(220, tImpact + 0.15);
      engGain.gain.setValueAtTime(0.001, now);
      engGain.gain.linearRampToValueAtTime(0.32, now + impactDelaySec * 0.65);
      engGain.gain.linearRampToValueAtTime(0.42, tImpact - 0.05);
      engGain.gain.exponentialRampToValueAtTime(0.0001, tImpact + 0.2);
      engOsc.connect(engLp); engSub.connect(engLp); engLp.connect(engGain); engGain.connect(sfxGain);
      engOsc.start(now); engSub.start(now);
      engOsc.stop(tImpact + 0.25); engSub.stop(tImpact + 0.25);

      // 2. Jet/airframe wind howl
      const howl = c.createBufferSource();
      howl.buffer = noiseBuffer;
      howl.loop = true;
      const howlBp = c.createBiquadFilter();
      howlBp.type = 'bandpass';
      howlBp.frequency.setValueAtTime(980, now);
      howlBp.frequency.exponentialRampToValueAtTime(360, tImpact);
      howlBp.Q.value = 3.5;
      const howlGain = c.createGain();
      howlGain.gain.setValueAtTime(0.001, now);
      howlGain.gain.linearRampToValueAtTime(0.28, tImpact - 0.1);
      howlGain.gain.exponentialRampToValueAtTime(0.0001, tImpact + 0.15);
      howl.connect(howlBp); howlBp.connect(howlGain); howlGain.connect(sfxGain);
      howl.start(now); howl.stop(tImpact + 0.2);

      // 3. Massive Sub-Bass Impact Boom + Metallic Crunch
      const subBoom = c.createOscillator();
      const subGain = c.createGain();
      subBoom.type = 'sine';
      subBoom.frequency.setValueAtTime(110, tImpact);
      subBoom.frequency.exponentialRampToValueAtTime(24, tImpact + 1.65);
      subGain.gain.setValueAtTime(0.001, tImpact);
      subGain.gain.linearRampToValueAtTime(0.75, tImpact + 0.03);
      subGain.gain.exponentialRampToValueAtTime(0.0001, tImpact + 2.2);
      subBoom.connect(subGain); subGain.connect(sfxGain);
      subBoom.start(tImpact); subBoom.stop(tImpact + 2.3);

      const blastNoise = c.createBufferSource();
      blastNoise.buffer = noiseBuffer;
      const blastLp = c.createBiquadFilter();
      blastLp.type = 'lowpass';
      blastLp.frequency.setValueAtTime(1800, tImpact);
      blastLp.frequency.exponentialRampToValueAtTime(190, tImpact + 2.4);
      const blastGain = c.createGain();
      blastGain.gain.setValueAtTime(0.001, tImpact);
      blastGain.gain.linearRampToValueAtTime(0.68, tImpact + 0.025);
      blastGain.gain.exponentialRampToValueAtTime(0.0001, tImpact + 2.8);
      blastNoise.connect(blastLp); blastLp.connect(blastGain); blastGain.connect(sfxGain);
      blastNoise.start(tImpact); blastNoise.stop(tImpact + 2.9);
    }

    // Cinematic chapter intro harmonic swell
    function playChapterIntro(chapterNum = 1) {
      const c = ensureContext();
      if (!c || !sfxGain) return;
      const now = c.currentTime;
      const rootFreq = chapterNum === 14 ? 146.83 : (chapterNum >= 9 ? 110.0 : 123.47); // D3 warm dawn vs A2/B2 tension
      const intervals = chapterNum === 14 ? [1, 1.25, 1.5, 2.25] : [1, 1.2, 1.5, 1.875];
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(280, now);
      lp.frequency.exponentialRampToValueAtTime(980, now + 1.6);
      lp.frequency.exponentialRampToValueAtTime(340, now + 4.2);
      const padGain = c.createGain();
      padGain.gain.setValueAtTime(0.0001, now);
      padGain.gain.linearRampToValueAtTime(0.24, now + 1.3);
      padGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);
      lp.connect(padGain); padGain.connect(sfxGain);

      for (const ratio of intervals) {
        const osc = c.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(rootFreq * ratio, now);
        osc.connect(lp);
        osc.start(now);
        osc.stop(now + 4.6);
      }
    }

    function playObjectiveComplete() {
      const c = ensureContext();
      if (!c || !sfxGain) return;
      const now = c.currentTime;
      for (const [delay, freq] of [[0, 523.25], [0.09, 659.25], [0.18, 783.99]]) {
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + delay);
        g.gain.setValueAtTime(0.0001, now + delay);
        g.gain.linearRampToValueAtTime(0.18, now + delay + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.35);
        osc.connect(g); g.connect(sfxGain);
        osc.start(now + delay); osc.stop(now + delay + 0.38);
      }
    }

    function playChapterComplete() {
      const c = ensureContext();
      if (!c || !sfxGain) return;
      const now = c.currentTime;
      for (const [delay, freq] of [[0, 261.63], [0.08, 329.63], [0.16, 392.0], [0.24, 587.33]]) {
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + delay);
        g.gain.setValueAtTime(0.0001, now + delay);
        g.gain.linearRampToValueAtTime(0.18, now + delay + 0.06);
        g.gain.exponentialRampToValueAtTime(0.0001, now + delay + 1.8);
        osc.connect(g); g.connect(sfxGain);
        osc.start(now + delay); osc.stop(now + delay + 1.85);
      }
    }

    function playThunder() {
      const c = ensureContext();
      if (!c || !sfxGain || !noiseBuffer) return;
      const now = c.currentTime;
      const src = c.createBufferSource();
      src.buffer = noiseBuffer;
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(920, now);
      lp.frequency.exponentialRampToValueAtTime(85, now + 2.4);
      const g = c.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.55, now + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 2.7);
      src.connect(lp); lp.connect(g); g.connect(sfxGain);
      src.start(now); src.stop(now + 2.8);
    }

    function playFootstep(surface = 'concrete') {
      const c = ensureContext();
      if (!c || !sfxGain || !noiseBuffer) return;
      const now = c.currentTime;
      const src = c.createBufferSource();
      src.buffer = noiseBuffer;
      const filt = c.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.value = surface === 'metal' ? 1450 : (surface === 'water' ? 920 : 480);
      filt.Q.value = surface === 'metal' ? 4.2 : 1.5;
      const g = c.createGain();
      g.gain.setValueAtTime(0.09, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + (surface === 'water' ? 0.14 : 0.07));
      src.connect(filt); filt.connect(g); g.connect(sfxGain);
      src.start(now, Math.random() * 1.5, 0.16);
    }

    function dispose() {
      stopAmbience();
      if (ctx) {
        try { ctx.close(); } catch {}
        ctx = null;
      }
    }

    return {
      unlock,
      setVolume,
      setMuted,
      setAmbience,
      stopAmbience,
      playFoghorn,
      playButtonPress,
      playValveTurn,
      playBreakerThrow,
      playRadioSquelch,
      playAircraftCrash,
      playChapterIntro,
      playObjectiveComplete,
      playChapterComplete,
      playThunder,
      playFootstep,
      dispose,
      get unlocked() { return unlocked; },
      get weather() { return currentWeather; },
      get muted() { return muted; },
    };
  }

  const exported = { createSaltlineAudioV2 };
  if (typeof window !== 'undefined') {
    window.SaltlineAudioV2 = exported;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exported;
  }
})();
