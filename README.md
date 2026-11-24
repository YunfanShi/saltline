# Saltline — Fable 5.2 FPS

A small browser first-person shooter set in a rainy industrial port. Recover evidence from a sealed harbor and search a wrecked transport while drones ("Gulls") and robot dogs ("Hounds") patrol the docks.
<img width="1685" height="906" alt="image" src="https://github.com/user-attachments/assets/8dd32149-90f4-4d69-a573-4411a49a9ba9" />


## Saltline fork 0.12.0

- **Campaign** opens the ordered story and shows your next chapter.
- **Multiplayer** opens a mode gallery with artwork captured in the game. Select a mode to reveal its setup and deployment action. Choose **Port Conquest** to capture objectives and drain opposing tickets, or **Port Breakthrough** to secure four sectors in order, beginning at West Dispatch. The LAN staging room is available when launched with the local server.
- Set enemy pressure, starting tickets and the time limit before deploying. These settings apply only to port battles.
- Choose Support, Medic, Recon or Engineer before entering an AI battle. Activate their abilities with **X** or the on-screen button.
- Press **M** for the tactical map. Spend support points with **5** for recon, **6** for reinforcement at a nearby objective, or **7** for field supplies. Safe captured ground can provide forward redeployment.
- Press **Q** to pause and open Requisition. Select an objective for smoke or artillery. Smoke blocks enemy line of sight for 22 seconds. Artillery strikes an objective that is not held by Blue four times after a five-second warning. Walls provide cover from the strikes.
- The AI side can announce a counterattack or incoming bombardment. Watch the tactical map for the affected objective and move to cover.
- Hold **Tab** for the battle scoreboard. It shows time, tickets or remaining sectors, kills, deaths, captures and support points.
- The interface defaults to Simplified Chinese, with English available in Settings.
- See the [operations report](docs/PORT_OPERATIONS_020.docx) for scope, controls and verification.

The battle settings, requisition menu and scoreboard adapt systems from [IRONFRONT 0.21.0](https://github.com/YunfanShi/IRONFRONT/tree/1afb5fae0be9dc5770778d952b65d43875064ab9) for Saltline's port. Vehicles, larger coordinated squads and networked combat are pending.

## Campaign

**The Missing List** follows the hunt for seventeen workers whose port records show them already evacuated. Open **Campaign** to start or continue. A chapter ends with a first-person handoff and advances automatically in the same page. From the campaign menu, select a completed chapter to replay it without changing the story save.

The game saves mission checkpoints and chapter handoffs separately. If you leave during a handoff, **Continue campaign** resumes the ending and then loads the next chapter. Already finished chapters from earlier versions remain unlocked.

| Chapter | Main task |
| --- | --- |
| Berth 4 | Practice at the optional range, check the duty board, cross to West Dispatch and confirm the conflicting records before returning to the boat. |
| Rail Inspection Yard | Reach the lookout, track the wreck survivor and escort him via the cargo ramp or maintenance lane. |
| Old Drydock | Reconstruct the tug route and climb out as the dock floods. |
| Tide Gate | Cross the exposed gantry and reunite with Mara after the barge collision. |
| Outer Anchorage | Board the listing platform and evacuate all seventeen workers in groups. |
| Return to Harbor | Guide the nurse from the cold store to the improvised clinic. |
| Night Shift Record | Find the night-shift evidence and put the calls in order. |
| Last Pilotage | Get Harris and the evidence across the cut-off pier to the pilot station. |
| Reopening | Walk the original quay, return the boots and cast off. |

Berth 4 starts at the original port entrance. The training lane has three reactive targets, with the rifle and sidearm available from the start. You can practice switching, aiming and reloading or head straight for the duty board.

At Berth 4, hold **Tab** to open the field terminal. Use the arrow keys to highlight a document, **Space** to select it and **Enter** to compare the pair. Touch users can open **Evidence** and tap the documents. The game continues while the terminal is open.

Commander speech uses the best English voice offered by the browser. On desktop Microsoft Edge it prefers Microsoft Natural voices when available. The browser may use its online speech service for those voices. The game sends only its fixed campaign lines to the browser speech API. If speech is unavailable, captions still follow the interface language. With speech enabled, captions appear when the utterance starts and clear when it ends. Master volume controls narration and scene audio.

In the west rail annex, follow the southern service lane to the night-shift office. Hold **E** at the log to read the evacuation note and collect up to 60 rounds, depending on reserve capacity. The inspection is optional and can be repeated after redeployment.

Press **1** for the PAC-9 or **2** for the Tern S12 sidearm. Touch players can use the weapon switch button. The sidearm has its own 12-round magazine and 36 starting spare rounds.

Walk up to marked ammunition crates to top up reserves, including the caches on both Berth 4 approaches. When running low, **AM** points to an available crate nearby.

## Multiplayer

Run `node server/lan.cjs` and open the address printed by the terminal. Open **Multiplayer → LAN staging room** to create a room or join one shared by another computer on the same network. The ready roster supports 2–4 players, host transfer and brief reconnects. Once everyone is ready, the host can start the three-second roster lock countdown. This release provides room preparation. Cooperative movement, combat and shared mission state are still in development. See the [server notes](server/README.md).

## Developer menu

During the campaign, Port Conquest or Port Breakthrough, press **~** (the backtick key below Esc on a US keyboard) to pause and open the developer menu. Press it again, or select **Resume**, to continue.

- **Flight** uses WASD to move, Space to ascend, C to descend and Shift to boost. Terrain and walls still collide with the player.
- **Invulnerability**, **Disable enemies** and **Infinite magazine** let you test combat and objectives independently. Disabling enemies removes existing units and cancels queued spawns. Re-enabling enemies deploys a fresh patrol.
- Restore health, refill ammunition, or spawn a Gull or Hound. The panel shows your coordinates, health, ammo and active enemy count.
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
