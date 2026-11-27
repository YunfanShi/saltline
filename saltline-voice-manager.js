/* SALTLINE — Campaign Voice-Over (VO) & Dialogue Audio Manager.
 * Data-driven manifest system designed for future real TTS / studio voice files (MP3/WAV/OGG).
 * Supports per-character voice profiles, automatic ambience ducking during playback,
 * synced subtitle callbacks, and graceful radio-squelch + subtitle fallback when audio files are not yet populated. */
(() => {
  'use strict';

  function createSaltlineVoiceManager({
    manifestUrl = './data/campaign-voice-manifest.json',
    audioV2 = null,
    onSubtitle = null,
  } = {}) {
    let manifest = { version: 1, audioEnabled: false, basePath: './assets/audio/vo/', voices: {}, lines: [] };
    let lineMap = new Map();
    let activeAudio = null;
    let activeTimer = null;
    let currentLineId = null;
    let voiceVolume = 0.92;
    let loaded = false;

    function indexManifest(data) {
      if (!data || typeof data !== 'object') return;
      manifest = {
        version: data.version || 1,
        audioEnabled: !!data.audioEnabled,
        basePath: data.basePath || './assets/audio/vo/',
        voices: data.voices || {},
        lines: Array.isArray(data.lines) ? data.lines : [],
      };
      lineMap = new Map();
      for (const ln of manifest.lines) {
        if (ln && ln.id) lineMap.set(ln.id, ln);
      }
      loaded = true;
    }

    async function loadManifest(overrideData = null) {
      if (overrideData) {
        indexManifest(overrideData);
        return manifest;
      }
      if (typeof fetch !== 'function') return manifest;
      try {
        const res = await fetch(manifestUrl);
        if (res.ok) {
          const json = await res.json();
          indexManifest(json);
        }
      } catch {}
      return manifest;
    }

    function stopCurrent() {
      if (activeTimer) { clearTimeout(activeTimer); activeTimer = null; }
      if (activeAudio) {
        try { activeAudio.pause(); activeAudio.currentTime = 0; } catch {}
        activeAudio = null;
      }
      currentLineId = null;
      audioV2?.setVolume?.(0.72); // Restore ambience volume after ducking
    }

    function resolveAudioPath(entry) {
      if (!entry?.audioFile) return null;
      if (/^(https?:|\/|\.\/)/.test(entry.audioFile)) return entry.audioFile;
      return `${manifest.basePath}${entry.audioFile}`;
    }

    function playLine(lineId, { onEnd = null, fallbackTextZh = null, fallbackSpeaker = null } = {}) {
      stopCurrent();
      const entry = lineMap.get(lineId) || (fallbackTextZh ? {
        id: lineId,
        speaker: fallbackSpeaker || '系统',
        textZh: fallbackTextZh,
        textEn: fallbackTextZh,
        durationSec: Math.max(2.6, Math.min(6.5, fallbackTextZh.length * 0.14)),
        ready: false,
      } : null);
      if (!entry) return false;

      currentLineId = entry.id;
      const durMs = Math.round((entry.durationSec || 4.0) * 1000);
      audioV2?.playRadioSquelch?.(true);

      if (typeof onSubtitle === 'function') {
        try {
          onSubtitle({
            id: entry.id,
            speaker: entry.speaker,
            textZh: entry.textZh,
            textEn: entry.textEn || entry.textZh,
            durationSec: entry.durationSec || 4.0,
          });
        } catch {}
      }

      const canPlayFile = !!(manifest.audioEnabled && entry.ready && typeof Audio !== 'undefined');
      const src = canPlayFile ? resolveAudioPath(entry) : null;

      if (src) {
        try {
          audioV2?.setVolume?.(0.32); // Duck coastal ambience during voice playback
          const el = new Audio(src);
          el.volume = voiceVolume;
          activeAudio = el;
          const finish = () => {
            if (activeAudio === el) stopCurrent();
            if (typeof onEnd === 'function') onEnd(entry);
          };
          el.onended = finish;
          el.onerror = finish;
          el.play().catch(finish);
          return true;
        } catch {}
      }

      // Graceful subtitle-only pacing until real TTS audio files are dropped into assets/audio/vo/
      activeTimer = setTimeout(() => {
        stopCurrent();
        if (typeof onEnd === 'function') onEnd(entry);
      }, durMs);
      return true;
    }

    function playChapterQueue(chapterId, { onComplete = null } = {}) {
      const lines = manifest.lines.filter(l => l.chapter === chapterId && l.trigger === 'intro');
      if (!lines.length) {
        if (typeof onComplete === 'function') onComplete();
        return 0;
      }
      let idx = 0;
      const next = () => {
        if (idx >= lines.length) {
          if (typeof onComplete === 'function') onComplete();
          return;
        }
        const ln = lines[idx++];
        playLine(ln.id, { onEnd: next });
      };
      next();
      return lines.length;
    }

    function getLine(lineId) {
      return lineMap.get(lineId) || null;
    }

    function listLines(filter = {}) {
      return manifest.lines.filter(l => {
        if (filter.chapter && l.chapter !== filter.chapter) return false;
        if (filter.speakerId && l.speakerId !== filter.speakerId) return false;
        if (filter.trigger && l.trigger !== filter.trigger) return false;
        return true;
      });
    }

    function setVoiceVolume(v) {
      voiceVolume = Math.max(0, Math.min(1, Number(v) || 0));
      if (activeAudio) activeAudio.volume = voiceVolume;
    }

    return {
      loadManifest,
      indexManifest,
      playLine,
      playChapterQueue,
      stopCurrent,
      getLine,
      listLines,
      setVoiceVolume,
      get loaded() { return loaded; },
      get currentLineId() { return currentLineId; },
      get manifest() { return manifest; },
    };
  }

  const exported = { createSaltlineVoiceManager };
  if (typeof window !== 'undefined') window.SaltlineVoiceManager = exported;
  if (typeof module !== 'undefined' && module.exports) module.exports = exported;
})();
