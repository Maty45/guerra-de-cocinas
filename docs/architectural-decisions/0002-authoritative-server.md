# ADR 0002: Servidor autoritativo, puerto único y constantes compartidas

## Status

accepted

## Date

2026-10-16

## Context

El juego es multijugador en tiempo real (7 jugadores, LAN) con colisiones entre jugadores, proyectiles, ollas y sabotajes. Si cada cliente simulara por su cuenta, cualquier desincronización rompería la partida (dos personas viendo cosas distintas en la olla). Además, `game-creator` / `add-multiplayer` propone **PartyKit (Cloudflare)** y asumimos que no aplica (sin cuenta Cloudflare, y el objetivo es una partida en LAN). Hay que decidir dónde vive la autoridad del juego y cómo se comparte el estado.

## Decision

- **El servidor Node + `ws` es autoritativo**: simula TODO (movimiento, colisiones, tomates, ollas, recetas, puntaje y timer) a **20 ticks/s**. En cada tick manda el **estado completo** a todos los clientes.
- **El cliente es delgado**: solo envía el **estado de las teclas cuando cambia** y dibuja el estado recibido, **interpolando** posiciones entre ticks. Cero lógica de juego en el cliente.
- **Un solo puerto (3000)**: el mismo servidor sirve el cliente compilado (`dist/`) por HTTP **y** el WebSocket. `npm start` imprime `http://<IP-LAN>:3000` para compartir.
- **Constantes compartidas** en `shared/constants.js`, importadas por `server/` y `src/`.
- **La lógica de la olla (`server/pot.js`) es pura y sin dependencias de red**, para poder testearla con `node --test` sin navegador.

## Consequences

### Positive

- Una sola verdad de estado: imposible que dos clientes vean ollas distintas.
- Con 7 jugadores y estado chico, mandar el estado completo a 20 Hz es simple y suficiente (sin delta compression ni predicción).
- Puerto único = fricción mínima para arrancar y compartir en LAN.
- La olla testeable sin navegador habilita TDD rápido (requisito del §11 del spec).
- El cliente reusa el `EventBus`/`GameState` de la skill alimentándolos desde los mensajes del server.

### Negative

- Latencia de input = hasta un tick (50 ms) + RTT (LAN ≈ 0–2 ms). Aceptable para el género.
- Sin predicción, hay un pequeño "lag" perceptible en el propio movimiento; se mitiga con interpolación de render.
- El servidor es el cuello de botella y punto único de falla (ok para LAN casual).

## Alternatives considered

- **P2P / WebRTC:** rechazado — complejidad de NAT y sin autoridad clara para las ollas.
- **PartyKit / Cloudflare Durable Objects (`add-multiplayer`):** rechazado — requiere cuenta Cloudflare, despliega en el edge y contradice "un solo puerto LAN".
- **Cliente autoritativo con reconciliación:** rechazado — fácil de desincronizar y anti-cheat imposible.
- **Estado delta en vez de estado completo:** rechazado — optimización prematura para 7 jugadores.

## Related

- `docs/tech.md`
- ADR 0001 (engine/lenguaje)
- Milestones 01, 02, 03
