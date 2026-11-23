# Saltline — Fable 5.2 FPS

A small browser first-person shooter set in a rainy industrial port. Cut three uplink relays and uncover the order that sealed the harbor while drones ("Gulls") and robot dogs ("Hounds") hunt you.
<img width="1685" height="906" alt="image" src="https://github.com/user-attachments/assets/8dd32149-90f4-4d69-a573-4411a49a9ba9" />


## Saltline fork 0.6.0

- **Campaign** opens the ordered story and shows your next chapter.
- **Multiplayer** opens a separate page for local AI battles and LAN staging. Choose **Port Conquest** to capture objectives and drain opposing tickets, or **Port Breakthrough** to secure three sectors in order. The LAN staging room is available when launched with the local server.
- Set enemy pressure, starting tickets and the time limit before deploying. These settings apply only to port battles.
- Choose Support, Medic, Recon or Engineer before entering an AI battle. Activate their abilities with **X** or the on-screen button.
- Press **M** for the tactical map. Spend support points with **5** for recon, **6** for reinforcement at a nearby objective, or **7** for field supplies. Safe captured ground can provide forward redeployment.
- Press **Q** to pause and open Requisition. Select an objective for smoke or artillery. Smoke blocks enemy line of sight for 22 seconds. Artillery strikes an objective that is not held by Blue four times after a five-second warning. Walls provide cover from the strikes.
- Hold **Tab** for the battle scoreboard. It shows time, tickets or remaining sectors, kills, deaths, captures and support points.
- The interface defaults to Simplified Chinese, with English available in Settings.
- See the [operations report](docs/PORT_OPERATIONS_020.docx) for scope, controls and verification.

The battle settings, requisition menu and scoreboard adapt systems from [IRONFRONT 0.21.0](https://github.com/YunfanShi/IRONFRONT/tree/1afb5fae0be9dc5770778d952b65d43875064ab9) for Saltline's port. Vehicles, larger coordinated squads and networked combat are pending.

## Campaign

Choose **Campaign → Start campaign** to deploy at Berth 4. Chapters unlock in story order after extraction. Choose **Continue story** from the debrief or Campaign page to start the next chapter. Progress is saved in this browser. After the relays, archive recovery, and upload, checkpoints save automatically. Retry or choose **Resume from checkpoint** on the Campaign page to pick up the current chapter. **Restart chapter** clears that chapter's checkpoint. Completed chapters can be replayed from the beginning.

Cut the three uplinks, then follow **LOG** to the shed and hold **E** to download the dispatch archive. Follow **TX** to the quay beacon and start the upload with **E**. Stay within range for 18 seconds while machines converge. The transfer pauses when you leave the area and resumes when you return. Once Control confirms receipt, follow **EX** to the boat at the south quay ladder.

The second chapter, **Rail Inspection Yard**, unlocks after you complete Berth 4. Follow the shore dispatch signature into the port’s inland rail district. Its three routes link the tracks, truck weighbridge and covered examination bay. Recover the signed original in **LOG**, hold **TX** for 22 seconds, then follow **EX** to the service gate. The district uses Saltline’s own materials, weather and props.

## Multiplayer

Run `node server/lan.cjs` and open the address printed by the terminal. Open **Multiplayer → LAN staging room** to create a room or join one shared by another computer on the same network. The ready roster supports 2–4 players, host transfer and brief reconnects. Once everyone is ready, the host can start the three-second roster lock countdown. This release provides room preparation. Cooperative movement, combat and shared mission state are still in development. See the [server notes](server/README.md).

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

The shared renderer is bundled in `index.html`. The campaign rules, rail district, AI battle modules, LAN staging room and localization load as separate local assets. Fonts use Google Fonts with local fallbacks.

Run the campaign, battle and class rule checks with `node --test tests/*.test.cjs`.
