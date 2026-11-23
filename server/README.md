# Saltline LAN lobby

Run `node server/lan.cjs` from the repository. Open the printed local address on the host computer, then share the printed LAN address with players on the same network. Set the `PORT` environment variable to use a different port. The server provides the Saltline page and the lobby API from the same origin.

Rooms hold two to four players and live in memory until everyone leaves or their seats expire. The host can lock the roster once all seats are connected and ready. The server records the locked room state. Cooperative movement, combat and objectives are still in development.

## HTTP API

| Method and path | JSON input | Success response |
|---|---|---|
| `POST /api/lan/rooms` | `{name}` | `201 {token, room}` |
| `POST /api/lan/rooms/:code/join` | `{name}` | `201 {token, room}` |
| `GET /api/lan/rooms/:code` | — | `200 {room}` |
| `POST /api/lan/rooms/:code/ready` | `{ready}` | `200 {room}` |
| `POST /api/lan/rooms/:code/start` | — | `200 {room}` |
| `POST /api/lan/rooms/:code/leave` | — | `200 {ok: true}` |

Send JSON as `application/json`. Send `Authorization: Bearer <token>` when polling or acting on a room after the initial create or join. Share only the six-character room code or a link with that code. The bearer token remains private to the player. Error responses contain an `error` code.

Clients poll about once a second. After six seconds without an authenticated request, the seat shows as disconnected. The token restores that seat and its ready state during the next 30 seconds. If the host leaves or the reservation expires, the earliest remaining connected player takes over. Stopping the server clears all rooms.

Run the HTTP integration tests with `node --test tests/lan.test.cjs`. They use an ephemeral loopback port.
