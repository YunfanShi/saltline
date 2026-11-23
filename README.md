# Saltline — Fable 5.2 FPS

A small browser first-person shooter: one level in a rainy container port. Cut three uplink relays while drones ("Gulls") and robot dogs ("Hounds") hunt you.
<img width="1685" height="906" alt="image" src="https://github.com/user-attachments/assets/8dd32149-90f4-4d69-a573-4411a49a9ba9" />


## Saltline fork 0.3.0

- **BATTLE** opens the original single-player relay sabotage campaign.
- **MULTIPLE** opens the AI battle menu. Choose **Port Conquest** to capture objectives and drain opposing tickets, or **Port Breakthrough** to secure three sectors in order. LAN multiplayer is planned.
- Choose Support, Medic, Recon or Engineer before entering an AI battle. Activate their abilities with **X** or the on-screen button.
- Press **M** for the tactical map. Spend support points with **5** for recon, **6** for reinforcement at a nearby objective, or **7** for field supplies. Safe captured ground can provide forward redeployment.
- The interface defaults to Simplified Chinese, with English available in Settings.
- See the [operations report](docs/PORT_OPERATIONS_020.docx) for scope, controls and verification.

## Developer menu

During the campaign, Port Conquest or Port Breakthrough, press **~** (the backtick key below Esc on a US keyboard) to pause and open the developer menu. Press it again, or select **Resume**, to continue.

- **Flight** uses WASD to move, Space to ascend, C to descend and Shift to boost. Terrain and walls still collide with the player.
- **Invulnerability**, **Disable enemies** and **Infinite magazine** let you test combat and objectives independently. Disabling enemies removes existing units and cancels queued spawns. Re-enabling enemies deploys a fresh patrol.
- Restore health, refill ammunition, spawn a Gull or Hound, or cut the next campaign relay. The panel shows your coordinates, health, ammo and active enemy count.
- **Reset switches** disables all toggles. Starting or restarting a match also resets them.

## Original demo
https://realcodebear.github.io/saltline-fable-5.2/

## Where it comes from

- Built by **Claude Fable 5.2**. The run was set up by Felix Rieseberg (Anthropic) and shared on X on 2026-11-09:
  https://x.com/felixrieseberg/status/2119925633564463609
- Original playable artifact: https://claude.ai/artifact/BGY1SztrAYcJQHSsnHHGmp
- Per his post: one prompt, no human feedback, about 8 hours, about 2.7M output and 445M input tokens (heavily cached), about $550 at API pricing. Models, sounds and textures are all made in code. These numbers are his own and not checked here.

The original game is credited to its author. This fork adds Port Conquest and localization on top of the original mirror. If you are the author and want it taken down, open an issue.

## Mirror baseline

The original mirror kept the gameplay intact. The claude.ai frame-runtime scripts were removed from `<head>`, and a doctype, charset and viewport tag were added so the file runs as a plain web page.

## Run it

```sh
python3 -m http.server 8731
```

Then open http://localhost:8731 and click the page to capture the mouse and start the sound.

The original renderer and mission are bundled in `index.html`. The AI battle rules, tactical map, class abilities and language layer load as separate local assets. Fonts use Google Fonts with local fallbacks.

Run the battle and class rule checks with `node --test tests/*.test.cjs`.
