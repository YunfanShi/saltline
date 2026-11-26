# Saltline LAN Multiplayer Server (Protocol v2 · 20Hz Authoritative)

Run `node server/lan.cjs` from the repository root. Open the printed local address on the host computer and share the printed LAN URL (or room invite link) with up to **8 players** on the same network. Set `PORT` to change the listening port (default `7878`).

## Supported Modes & Maps

- **5 Modes**:
  1. `conquest` — Port Conquest (multi-point ticket battle, Blue vs Red or Co-op vs AI)
  2. `breakthrough` — Port Breakthrough (sector-by-sector assault & defense)
  3. `coop_rescue` — Co-op Coastal Rescue (2–4P Blue team cooperative rescue vs AI)
  4. `coop_campaign` — Co-op Campaign (2–4P shared open-world campaign progression)
  5. `sandbox` — Open World Sandbox (up to 8P free-roam exploration, vehicles & disasters)
- **5 Playable Theater Maps**:
  - `coastal_quarter` (Coastal Quarter & Precinct 04)
  - `port_rail` (Berth 4 & West Rail Yard)
  - `mountain_forest` (West Mountain Ridge +14m & Pine Forest)
  - `old_harbor` (South Drydock, Tide Gate & 22m Lighthouse)
  - `coastal_industrial` (SW Cold Storage & Field Clinic)

## HTTP & WebSocket API (Protocol v2)

| Method and path | JSON input | Success response |
|---|---|---|
| `GET /api/lan/status` | — | `200 {version, protocolVersion: 2, maps, modes, rooms}` |
| `POST /api/lan/rooms` | `{name, protocolVersion: 2, maxPlayers, settings}` | `201 {token, room}` |
| `POST /api/lan/rooms/:code/join` | `{name, protocolVersion: 2}` | `201 {token, room}` |
| `GET /api/lan/rooms/:code` | — | `200 {room}` |
| `POST /api/lan/rooms/:code/ready` | `{ready}` | `200 {room}` |
| `POST /api/lan/rooms/:code/settings` | `{mapId, mode, difficulty, ...}` (host only) | `200 {room}` |
| `POST /api/lan/rooms/:code/team` | `{playerId, team}` (host only) | `200 {room}` |
| `POST /api/lan/rooms/:code/start` | `{}` (host only) | `200 {room}` |
| `POST /api/lan/rooms/:code/rematch` | `{}` (host only — returns match to lobby) | `200 {room}` |
| `POST /api/lan/rooms/:code/leave` | `{}` | `200 {ok: true}` |
| `WS /api/lan/ws?room=:code&token=:token` | 20Hz `state`, `event`, `conquest`, `vehicles` | 20Hz authoritative `snapshot` |

## Reliability Features
- **Protocol version check** (`426 protocol_mismatch` on stale clients).
- **Mid-match join** (`allowMidJoin: true` by default).
- **30-second disconnect seat reservation** with automatic **host authority migration** if the host disconnects or leaves.
- **Consecutive match loop** via `POST /api/lan/rooms/:code/rematch`.

## Verification Tests
- Run `node --test tests/lan-multiplayer-e2e.test.cjs` for dual-client sync, protocol check, mid-join, host migration, rematch, and 8-player concurrent WebSocket stress tests.
- Run `node --test tests/port-mp-ironfront.test.cjs` for settings normalization, commander AI, vehicle fleet, and RFC 6455 framing tests.
