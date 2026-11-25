/* Camera cues for the fictional SAR transport and the playable Berth 4 arrival. */
(() => {
  window.createPortFlightClock = (now = () => performance.now()) => {
    let last = now();
    return {
      reset() { last = now(); },
      step(visible) {
        const current = now();
        const delta = Math.max(0, (current - last) / 1000);
        last = current;
        return visible ? delta : 0;
      },
    };
  };

  window.createPortPrologueFlight = (world, aircraft, landing) => {
    const { THREE } = world;
    const { root, anchors } = aircraft;
    const pad = root.position.clone();
    const stableRotation = root.rotation.clone();
    const eye = new THREE.Vector3(), target = new THREE.Vector3(), exit = new THREE.Vector3();
    const touchdown = landing?.clone().add(new THREE.Vector3(0, 1.62, 0));
    const harbor = landing?.clone().add(new THREE.Vector3(36, .6, -13));
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const smooth = (from, to, time) => {
      const t = Math.max(0, Math.min(1, (time - from) / (to - from)));
      return t * t * (3 - 2 * t);
    };
    function point(key, out) {
      const anchor = anchors[key];
      if (anchor.isObject3D) return anchor.getWorldPosition(out);
      return root.localToWorld(out.copy(anchor));
    }
    function cabin(lookAhead, camera) {
      point('seat', eye);
      root.localToWorld(target.set(lookAhead, 2.02, -6));
      camera(eye, target, 66);
    }
    function hover(inbound = 0) {
      root.rotation.set(0, Math.PI, 0);
      root.position.set(landing.x + anchors.cable.x, landing.y + 20 + inbound * 1.5,
        landing.z + anchors.cable.z + inbound * 16);
    }
    function stow() {
      root.position.copy(pad);
      root.rotation.copy(stableRotation);
      aircraft.setDoor(1);
      aircraft.setCable(0);
    }
    return {
      flightSeconds: 12.3,
      approachSeconds: 5.5,
      descentSeconds: 7.2,
      departure(time, dt, camera) {
        const lifting = smooth(2.1, 7.2, time);
        const travel = smooth(3.7, 12.3, time);
        root.position.set(pad.x + travel * 9, pad.y + lifting * 17, pad.z - travel * 36);
        root.rotation.set(.09 * Math.sin(lifting * Math.PI), stableRotation.y, reduced ? 0 : Math.sin(time * .35) * .017);
        aircraft.setDoor(1 - smooth(.15, 1.7, time));
        aircraft.spin(dt, .35 + .65 * smooth(0, 4, time));
        cabin(-2.2 - lifting, camera);
      },
      approach(time, dt, camera) {
        root.visible = true;
        hover(1 - smooth(0, 3.6, time));
        aircraft.setDoor(smooth(1.6, 4.4, time));
        aircraft.spin(dt, 1);
        point('seat', eye);
        root.localToWorld(target.set(-8, -.6, -1));
        camera(eye, target, 70);
      },
      wait(dt, camera) {
        root.visible = true;
        hover();
        aircraft.setDoor(1);
        aircraft.setCable(21.5);
        aircraft.spin(dt, 1);
        point('seat', eye);
        point('door', exit);
        eye.lerp(exit, .72);
        target.copy(harbor).y = landing.y + 8;
        camera(eye, target, 70);
      },
      descend(time, dt, camera) {
        hover();
        aircraft.setDoor(1);
        const reach = smooth(0, 1.2, time);
        const lowering = smooth(1.1, 6.85, time);
        point('seat', eye);
        point('cable', exit);
        exit.y -= 1.35;
        eye.lerp(exit, reach);
        eye.lerp(touchdown, lowering);
        eye.z += .34 * reach * (1 - smooth(5.8, 6.85, time));
        if (!reduced) {
          const sway = Math.sin(Math.PI * lowering);
          eye.x += Math.sin(time * 2.6) * sway * .07;
          eye.z += Math.cos(time * 2.1) * sway * .07;
        }
        aircraft.setCable(21.5);
        aircraft.spin(dt, 1);
        target.copy(harbor).y = landing.y + 1.6 + 6.5 * (1 - lowering);
        camera(eye, target, 70);
      },
      hide() { aircraft.setCable(0); root.visible = false; },
      stow,
    };
  };
})();
