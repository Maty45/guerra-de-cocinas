# Milestone 01: Servidor y lobby

## Status

done (una AC queda pendiente de playtest del usuario)

## Objective

Poner de pie el esqueleto de red: un servidor Node+`ws` que sirve el cliente compilado en un **solo puerto** y maneja el **lobby** (nombres, host, sorteo de equipos, botón Empezar), incluyendo reconexión y migración de host. Al terminar, 7 pestañas pueden entrar, verse en la lista y el host puede empezar.

## Scope

- `server/index.js`: `http` que sirve `dist/` + servidor WebSocket en el mismo puerto 3000; imprime `http://<IP-LAN>:3000` al arrancar.
- Protocolo de mensajes base (join, roster, start, disconnect, reconnect) bajo `shared/constants.js`.
- `server/lobby.js`: roster de jugadores por nombre; host = primero conectado; botón **Empezar** visible solo para el host y con mínimo 2 jugadores.
- **Sorteo aleatorio** de equipos lo más parejo posible (7 → 4 y 3).
- **Reconexión**: si alguien se cae, su personaje queda en el roster (quieto); al volver con el mismo nombre, recupera su slot.
- **Migración de host**: si el host se cae, pasa al siguiente jugador más antiguo.
- Escena `Lobby` en Phaser (input de nombre, lista, botón Empezar solo-host).
- Scaffolding: `package.json`, `vite.config.js`, `index.html`, `src/main.js` con `window.__GAME__` y `window.render_game_to_text()`.

## Out of scope

- Movimiento y simulación de juego (milestone 02).
- Contenido de gameplay (ingredientes, ollas, sabotajes).

## Dependencies

- **Depends on:** ADR 0001, ADR 0002
- **Blocks:** milestone 02

## Acceptance criteria

> AC verificables por test llevan `— test: <path>::<name>`. Lo que solo se juzga jugando va taggeado `— verified by user playtest`.

- [x] `npm start` levanta un solo proceso y sirve la página del cliente por HTTP en el puerto 3000 — test: `tests/e2e/lobby.spec.js::sirve el cliente en el puerto 3000`
- [x] Al arrancar, la consola imprime `http://<IP-LAN>:3000` con la IP de la interfaz de red (no `localhost`) — test: `tests/server/lobby.test.js::lanAddress devuelve una IPv4 no interna (o localhost como fallback)`
- [x] Un jugador entra con un nombre y aparece en la lista del lobby de todos — test: `tests/e2e/lobby.spec.js::un jugador entra con un nombre y aparece en el roster`
- [x] El primero en entrar es el host y ve el botón Empezar; los demás no lo ven — test: `tests/e2e/lobby.spec.js::el primero en entrar es el host y solo el host ve empezar`
- [x] Con menos de 2 jugadores, el botón Empezar está deshabilitado — test: `tests/e2e/lobby.spec.js::empezar requiere un mínimo de 2 jugadores`
- [x] Con 7 jugadores, el sorteo reparte 4 y 3 de forma aleatoria — test: `tests/server/lobby.test.js::sortea 4 y 3 con 7 jugadores` (+ `tests/e2e/lobby.spec.js::7 jugadores: el sorteo reparte 4 y 3 y todos entran a la partida`)
- [x] Cerrar una pestaña deja el jugador en el roster (quieto) y volver a entrar con el mismo nombre recupera su slot — test: `tests/e2e/lobby.spec.js::reconexión por nombre: recupera su slot`
- [x] Si se cae el host, el siguiente jugador más antiguo pasa a ser host — test: `tests/server/lobby.test.js::migración de host: al caerse el host pasa al siguiente más antiguo`
- [x] Al empezar, todos los clientes reciben el roster con equipos y arrancan la escena de juego — test: `tests/e2e/lobby.spec.js::al empezar, todos los clientes reciben los equipos`
- [ ] La pantalla del lobby se ve legible y el nombre sobre cada jugador (en la partida) es claro en ambas pantallas — verified by user playtest

## Exit condition

User abre 7 pestañas contra `http://localhost:3000`, carga 7 nombres, ve la lista completa y el host aprieta Empezar → las 7 pestañas entran juntas a la partida con los equipos ya sorteados.

## Test plan

1. **Rojo primero:** escribir `tests/server/lobby.test.js` (sorteo 4/3, migración de host) y `tests/e2e/lobby.spec.js` (socket + roster) antes de implementar; confirmar que fallan por la razón correcta.
2. **Verde:** implementar `server/index.js`, `server/lobby.js`, escena `Lobby`.
3. **Regresión:** `node --test` y `npx playwright test tests/e2e/lobby.spec.js`.
4. **Manual:** 7 pestañas; cerrar la del host y confirmar que otro pasa a host; reconectar por nombre.

## Notes

- El escaneo de IP LAN vive en `server/net.js` (`lanAddress()`), testeable sin sockets.
- El roster se identifica por nombre normalizado (trim + case-insensitive) para la reconexión.
- El protocolo de mensajes se factorizó en **`shared/protocol.js`** (`MSG`) en vez de `shared/constants.js`, para no mezclar números de balance con el protocolo de red.
- Los tests E2E usan los hooks `window.__NET__` / `window.__GAME_STATE__` (expuestos en `src/main.js`) y el patrón multi-contexto de Playwright para 2 y 7 jugadores.
- Ver `docs/architectural-decisions/0002-authoritative-server.md`.
