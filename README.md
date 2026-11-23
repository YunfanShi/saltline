# Saltline — Fable 5.2 FPS

A small browser first-person shooter: one level in a rainy container port. Cut three uplink relays while drones ("Gulls") and robot dogs ("Hounds") hunt you.
<img width="1685" height="906" alt="image" src="https://github.com/user-attachments/assets/8dd32149-90f4-4d69-a573-4411a49a9ba9" />


## Saltline fork 0.1.0

- **港口征服 / Port Conquest** uses the original port and machine enemies with IRONFRONT-style territory control and team tickets. Approach a relay to capture it, clear machines from contested points, and hold more points to drain the opposing team. The round starts at 40 tickets per side and runs for at most four minutes.
- **部署 / Deploy** opens the original relay sabotage mission. The menus and common prompts default to Chinese. Switch back to English in Settings.
- See [the integration report](docs/PORT_CONQUEST_010.docx) for scope and verification.

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

The original renderer and mission are bundled in `index.html`. Port Conquest and the language layer load from `port-conquest.js` and `zh.js`. Fonts use Google Fonts with local fallbacks.

Run the conquest rule checks with `node --test tests/port-conquest.test.cjs`.
