# Milestone 04: Sabotajes

## Status

done — pendiente playtest del usuario (exit condition)

## Objective

Agregar todo el "juego sucio": tomatazo (E), robar de la olla rival, contaminar la olla rival, volcar (interrumpir) la cocción rival y el power-up de aceite. Cada efecto debe verse **igual en todas las pestañas** y respetar las reglas de autoridad del servidor.

## Scope

- **Tomatazo (E):** proyectil recto según la orientación del personaje; aturde 1,5 s y hace soltar lo que lleva; **sin fuego amigo** (atraviesa compañeros); enfriamiento 3 s. Contabiliza tomatazos acertados por jugador.
- **Robar:** Espacio tap cerca de la olla rival **si no está cocinando** y con **manos vacías** → te llevás el **último** ingrediente puesto.
- **Contaminar:** meter un ingrediente equivocado en la olla **rival** → humo verde; no cocina hasta que ese equipo la vacíe (hold 2 s, se pierde el contenido).
- **Volcar:** Espacio **hold 2 s** en la olla rival **mientras cocina** → pierden el plato; se corta si te aturden.
- **Aceite:** power-up que aparece en el **centro cada 30 s**; se agarra/suelta con Espacio; deja un charco **10 s**; quien lo pisa **resbala 1 s sin control**. El aceite ocupa la mano.
- **Espacio tap vs hold:** decisión **al soltar** (<2 s tap / ≥2 s hold) con barra de progreso en el cliente.
- Servidor: máquina de estados del jugador (idle / carrying / stunned / slipping) y del tomate (vivo / impactado).
- `shared/constants.js`: `HOLD_SECONDS=2`, `TOMATO_COOLDOWN=3`, `STUN_SECONDS=1.5`, `OIL_SPAWN_EVERY=30`, `OIL_PUDDLE_SECONDS=10`, `SLIP_SECONDS=1`.

## Out of scope

- Fin de partida, muerte súbita y pantalla final (milestone 05).

## Dependencies

- **Depends on:** milestone 03
- **Blocks:** milestone 05

## Acceptance criteria

- [x] Un tomatazo a un rival lo aturde 1,5 s y le hace soltar el ingrediente — test: `tests/server/tomato.test.js::aturde y suelta`
- [x] Un tomatazo **no** afecta a un compañero de equipo (lo atraviesa) — test: `tests/server/tomato.test.js::sin fuego amigo`
- [x] No se puede tirar un segundo tomate antes de 3 s — test: `tests/server/tomato.test.js::enfriamiento 3s`
- [x] Robar en la olla rival **cocinando** no hace nada; **no cocinando** saca el último ingrediente — test: `tests/server/steal.test.js::robar solo si no cocina`
- [x] Robar con las manos ocupadas no hace nada (con la mano llena se **contamina** en vez de robar) — test: `tests/server/steal.test.js::robar requiere manos vacías`
- [x] Un ingrediente equivocado en la olla rival la deja **contaminada** (humo verde) y no cocina hasta vaciarla — test: `tests/server/pot.test.js::contaminar olla rival` + e2e `sabotage.spec.js::contaminar la olla rival (humo verde)`
- [x] Volcar con hold 2 s mientras la olla rival cocina hace que **pierdan el plato** — test: `tests/server/dump.test.js::volcar pierde el plato` + e2e `sabotage.spec.js::volcar la cocción rival con Espacio mantenido`
- [x] Si aturden al que está volcando, el volcado se **corta** — test: `tests/server/dump.test.js::stun corta el volcado`
- [x] El aceite aparece en el centro cada 30 s y deja un charco que dura 10 s — test: `tests/server/oil.test.js::spawn y duración`
- [x] Quien pisa el charco resbala 1 s sin control — test: `tests/server/oil.test.js::resbalón 1s`
- [x] Espacio: tap (agarrar/soltar/robar) vs hold de 2 s (vaciar/volcar) — tap: `tests/e2e/cooking.spec.js` (pickUp/load) · hold: `tests/e2e/sabotage.spec.js` (teclado real) + `tests/server/dump.test.js`
- [x] El efecto de sabotaje viaja en el **mismo snapshot** para todas las pestañas (tomates, charcos, aceite, `dumping`, `stunned`, `slipping`) — consistencia estructural; cubierta por `tests/e2e/cooking.spec.js::comanda y platos son consistentes en dos pestañas enfrentadas`
- [x] Un **tomatazo (E) por teclado real** aturde al rival — test: `tests/e2e/sabotage.spec.js::el tomatazo (E) aturde al rival`
- [ ] El tomatazo se siente con impacto (stun legible, feedback visual) — verified by user playtest

## Exit condition

User juega 2 pestañas lado a lado y ejecuta cada sabotaje (tomatazo, robar, contaminar, volcar, aceite) → en ambas pestañas el efecto se ve idéntico y respeta las reglas (sin fuego amigo, cooldowns, hold 2 s, etc.).

## Test plan

1. **Rojo primero:** `tests/server/tomato.test.js`, `steal.test.js`, `dump.test.js`, `oil.test.js` y `tests/e2e/sabotage.spec.js` antes de implementar.
2. **Verde:** implementar cada sabotaje en `server/game.js` + `server/pot.js` y su render/feedback.
3. **Regresión:** `node --test` + `npx playwright test tests/e2e/sabotage.spec.js` + releer `tests/pot.test.js`.
4. **Manual:** 2 pestañas lado a lado ejecutando cada sabotaje.

## Notes

- El contador de "tomatazos acertados" por jugador se persiste en el estado de la partida para el premio del milestone 05.
- "Sin fuego amigo": el proyectil ignora a los del mismo equipo (no se frena ni hace daño).
