# Milestone 05: Timer, muerte súbita, pantalla final y revancha

## Status

done — pendiente playtest del usuario (exit condition)

## Objective

Cerrar el ciclo completo de una partida: timer de 5:00 y puntaje visibles arriba, fin por tiempo, **muerte súbita** en caso de empate, pantalla final con ganador + platos + "saboteador del partido", y **Revancha** del host que vuelve a sortear equipos.

## Scope

- Timer autoritativo de **300 s** en el servidor, sincronizado y visible arriba junto al puntaje de ambos equipos.
- Fin de partida: gana el equipo con más platos; **empate → muerte súbita** (el primer plato que se termine gana).
- Pantalla final (`GameOver`): ganador, platos por equipo y **"saboteador del partido"** (jugador con más tomatazos acertados, acumulado en milestone 04).
- Botón **Revancha** (solo host) que reinicia la partida y **vuelve a sortear** los equipos.
- `GameState.reset()` que devuelve un estado limpio entre partidas (sin listeners/timers colgados).
- `shared/constants.js`: `MATCH_SECONDS=300`.

## Out of scope

- Pulido visual/sonoro final (milestone 06).

## Dependencies

- **Depends on:** milestone 04
- **Blocks:** milestone 06

## Acceptance criteria

- [x] El timer arranca en 5:00 y baja a 1 s por segundo en el servidor; se muestra arriba en todas las pestañas — test: `tests/server/match.test.js::timer 300`
- [x] Al llegar a 0 gana el equipo con más platos y se entra a la pantalla final — test: `tests/server/match.test.js::gana el de mas platos`
- [x] En empate se entra a **muerte súbita** y gana el **primer plato** que se termine — test: `tests/server/match.test.js::muerte subita`
- [x] La pantalla final muestra ganador, platos por equipo y el **saboteador del partido** (más tomatazos acertados) — test: `tests/e2e/gameover.spec.js::pantalla final con ganador, platos, saboteador y solo el host revancha`
- [x] Solo el host ve el botón **Revancha** — test: `tests/e2e/gameover.spec.js::pantalla final con ganador, platos, saboteador y solo el host revancha`
- [x] Revancha reinicia la partida con puntajes en 0 y **equipos resorteádo** — test: `tests/server/match.test.js::revancha resorteo`
- [x] Reiniciar 3 veces seguidas deja el comportamiento idéntico a la primera (sin estado colgado) — test: `tests/e2e/gameover.spec.js::reiniciar 3 veces seguidas deja todo limpio`
- [ ] La pantalla final y la transición a revancha se sienten claras y celebratorias — verified by user playtest

## Exit condition

User juega una partida completa de 5:00 hasta la pantalla final, ve ganador + platos + saboteador, y el host aprieta Revancha → arranca una partida nueva con equipos resorteádo y marcador en cero.

## Test plan

1. **Rojo primero:** `tests/server/match.test.js` (timer, gane/lose, empate→muerte súbita, revancha resorteo) y `tests/e2e/gameover.spec.js`.
2. **Verde:** implementar timer, resolución de fin, `GameState.reset()`.
3. **Regresión:** `node --test` completo + `npx playwright test tests/e2e/gameover.spec.js`.
4. **Manual:** forzar un empate (puntajes iguales) para validar la muerte súbita.

## Notes

- El "saboteador del partido" se calcula sobre los tomatazos **acertados** (impactos a rivales), no sobre los disparados.
- La muerte súbita detiene el timer y espera el primer plato.
- **Hook de test**: con `ALLOW_TEST_HOOKS=1` (que fija `playwright.config.js` al levantar el server) el host puede mandar `MSG.TEST { action: 'endMatch', winner }` (`window.__NET__.testEndMatch(...)`) para terminar la partida de inmediato sin esperar los 5:00. Sin esa variable el mensaje se ignora.
- Al terminar, el servidor **congela** la simulación (`phase='game_over'`) y sigue difundiendo el último estado para que todas las pestañas (y quien reconecte) vean el final.
- `Game` ahora tiene `timeLeft`, `phase` y `winner`; `snapshot()` incluye `mode`, `phase`, `winner`, `saboteur` y `timeLeft`.
