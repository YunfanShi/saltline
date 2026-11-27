/* Standalone two-train greybox. No persistent campaign state is modified. */
(function (root) {
  'use strict';
  const LENGTH = 90;
  function createState() {
    let state = { x:0, z:12, yaw:0, pitch:0, distance:0, phase:'approach', targetsRemaining:2, targetMask:3, carriage:0, branch:null, teammate:'rear', derailTime:0 };
    let checkpoint = { ...state };
    let paused = false;
    function update(dt, input = {}) {
      if (paused || state.phase === 'complete' || !(dt > 0)) return;
      dt = Math.min(dt, .05);
      if (state.phase === 'derail') {
        state.derailTime += dt;
        if (state.derailTime >= 3) state.phase = 'complete';
        return;
      }
      state.distance += dt * 24;
      const forward = Math.max(-1, Math.min(1, Number(input.forward) || 0));
      const side = Math.max(-1, Math.min(1, Number(input.side) || 0));
      const speed = 5.4 * dt;
      state.x += (Math.cos(state.yaw) * side - Math.sin(state.yaw) * forward) * speed;
      state.z -= (Math.cos(state.yaw) * forward + Math.sin(state.yaw) * side) * speed;
      // A continuous safety lip across the two connected carriage roofs avoids void falls.
      state.x = Math.max(-1.3, Math.min(1.3, state.x));
      state.z = Math.max(-16.4, Math.min(16.4, state.z));
      state.carriage = state.z < 0 ? 1 : 0;
      if (state.phase === 'approach' && state.distance >= 360) state.phase = 'contact';
      if (state.phase === 'pursuit' && state.z <= -9) { state.phase = 'bridge'; state.bridgeStart = state.distance; }
      if (state.phase === 'bridge' && state.z <= -12 && state.distance - state.bridgeStart >= 120) {
        state.phase = 'derail'; state.derailTime = 0;
      }
    }
    function hit(index) {
      if (paused || state.phase !== 'contact' || !Number.isInteger(index) || index < 0 || index > 1 || !(state.targetMask & (1 << index))) return false;
      state.targetMask &= ~(1 << index);
      state.targetsRemaining--;
      if (!state.targetsRemaining) { state.phase = 'pursuit'; state.teammate = 'front'; checkpoint = { ...state }; }
      return true;
    }
    return {
      update, hit,
      look(dx, dy) { if (!paused && state.phase !== 'complete') { state.yaw -= dx; state.pitch = Math.max(-1.15, Math.min(1.15, state.pitch - dy)); } },
      pause(value) { paused = Boolean(value); },
      retry() { state = { ...checkpoint }; paused = false; },
      get paused() { return paused; }, get snapshot() { return { ...state }; }, get checkpoint() { return { ...checkpoint }; },
    };
  }
  root.SaltlineTrainSlice = { createState, targetSeconds:LENGTH };
  if (typeof module !== 'undefined') module.exports = root.SaltlineTrainSlice;
})(typeof window === 'undefined' ? globalThis : window);
