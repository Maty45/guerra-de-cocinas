# Milestone 02: Movimiento autoritativo con 7 clientes

## Status

done (la interpolación queda pendiente de playtest del usuario)

## Objective

Implementar el lazo autoritativo: el servidor simula a **20 ticks/s** el movimiento WASD, las colisiones (jugadores↔jugadores, jugadores↔mesadas, límites del mapa) y manda el estado completo; el cliente sólo envía las teclas al cambiar y **interpola** el render. Todos ven el mapa completo y consistente.

## Scope

- `server/game.js`: loop de tick a 20 Hz; integración de movimiento con `delta`; colisiones AABB/círculos; límites 1280×720.
- `server/map.js`: zonas (Cocina ROJA / DESPENSA / Cocina AZUL) y mesadas como obstáculos.
- `shared/constants.js`: `TICK_RATE=20`, velocidad de jugador, radio/tamaño, layout del mapa.
- Protocolo: cliente→servidor `input` (solo al cambiar teclas); servidor→cliente `state` (estado completo por tick).
- Cliente: `NetworkManager` (envía input por cambio, recibe `state`), interpolación entre el estado anterior y el nuevo; entidades `Player` con nombre encima y color de equipo.
- Exponer `window.render_game_to_text()` con posiciones actuales para inspección.

## Out of scope

- Ingredientes, ollas, recetas (milestone 03).
- Sabotajes (milestone 04).

## Dependencies

- **Depends on:** milestone 01, ADR 0002
- **Blocks:** milestone 03

## Acceptance criteria

- [x] El servidor corre la simulación a 20 ticks/s (medible por ticks emitidos en 1 s = 20 ± 1) — test: `tests/server/tick.test.js::20 ticks por segundo`
- [x] Un jugador que mantiene una dirección se mueve a velocidad constante y se detiene en el borde del mapa — test: `tests/server/movement.test.js::un jugador se mueve a velocidad constante` + `::el jugador se detiene en el borde del mapa`
- [x] Dos jugadores que caminan de frente **colisionan** y no se solapan — test: `tests/server/collision.test.js::dos jugadores que van de frente no se solapan`
- [x] Un jugador no atraviesa una mesada — test: `tests/server/collision.test.js::un jugador no atraviesa una mesada`
- [x] El cliente envía input **solo al cambiar** el conjunto de teclas (no en cada frame) — test: `tests/e2e/movement.spec.js::el cliente manda input solo al cambiar el conjunto de teclas`
- [x] Con 7 clientes conectados, todos reciben el estado de los 7 jugadores con la misma posición (consistencia entre pestañas) — test: `tests/e2e/movement.spec.js::7 clientes ven la misma posición (consistencia)`
- [x] Reconectar con la partida en curso devuelve al jugador al mapa (no queda en el lobby) — test: `tests/e2e/movement.spec.js::reconectar con la partida en curso vuelve a la partida`
- [ ] La posición renderizada se interpola (no salta) entre ticks — verified by user playtest
- [x] El mapa 1280×720 se escala a la ventana sin deformar y se ve el mapa completo — test: `tests/e2e/movement.spec.js::el mapa 1280x720 escala sin deformar`

## Exit condition

User abre 7 pestañas, mueve 7 personajes a la vez → en todas las pestañas los 7 personajes aparecen en la misma posición, chocan entre sí y con las mesadas, y el movimiento se ve fluido.

## Test plan

1. **Rojo primero:** `tests/server/movement.test.js`, `tests/server/collision.test.js`, `tests/server/tick.test.js`, `tests/e2e/movement.spec.js` (fallan por falta de simulación).
2. **Verde:** implementar `server/game.js`, `server/map.js`, `NetworkManager` e interpolación.
3. **Regresión:** `node --test` + `npx playwright test tests/e2e/movement.spec.js`.
4. **Manual:** mover 7 personajes simultáneos y verificar consistencia cruzada.

## Notes

- Módulos nuevos: `server/loop.js` (loop con `setInterval`, testeable con timers simulados), `server/geometry.js` (clamp y colisión círculo↔rect, puro) y `shared/map.js` (layout del mapa, compartido server/cliente).
- Protocolo nuevo en `shared/protocol.js`: **`INPUT`** (cliente→server, solo al cambiar) y **`STATE`** (server→cliente, snapshot completo cada tick).
- El snapshot incluye `t` (tick), `mode` y `players[id] = { name, team, x, y, connected, stunned, slipping, carrying }`.
- Interpolación: el cliente guarda los dos últimos snapshots (`prev`/`curr` en `NetworkManager`) y dibuja con `alpha = (now - currAt) / TICK_MS`.
- El movimiento diagonal se normaliza (no es más rápido que el recto).
- El orden de resolución por tick es: integrar → límites → mesadas → jugadores entre sí → re-clamp.
