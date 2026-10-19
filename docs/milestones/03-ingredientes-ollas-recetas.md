# Milestone 03: Ingredientes, ollas, recetas, cocción y puntaje

## Status

done — pendiente playtest del usuario (exit condition)

## Objective

Implementar el corazón del juego: la despensa que spawnea ingredientes, el ciclo agarrar/soltar, la carga de la olla propia, el matching de recetas (por conjunto), la cocción con tiempo, el puntaje y el avance de comandas. La lógica de la olla debe ser **pura y testeable sin navegador** (requisito §11 del spec).

## Scope

- `server/recipes.js`: las 4 recetas (Pizza, Hamburguesa, Tortilla, Ensalada) + **secuencia de comandas compartida** entre equipos.
- `server/pot.js` (**puro**): estado de la olla (lista ordenada de hasta 3), `insert()`, detección de contaminación, matching por **conjunto**, estado de cocción, `empty()`.
- `server/game.js`: despensa (spawn cada 2 s, máx 8, garantía de disponibilidad de ingredientes de las comandas actuales), agarrar/soltar (Espacio tap), carga de olla propia, timer de cocción (5 s / **4 s para el equipo más chico**), `+1 plato` y avance de comanda por equipo.
- Cliente: render de ingredientes en el piso, ingredientes llevados, ollas con contenido, **comanda actual por equipo**, contador de platos y humo verde si está contaminada.
- `shared/constants.js`: `COOK_SECONDS=5`, `COOK_SECONDS_SMALL_TEAM=4`, `INGREDIENT_SPAWN_EVERY=2`, `MAX_FLOOR_INGREDIENTS=8`.

## Out of scope

- Sabotajes entre equipos (tomatazo, robar, contaminar la olla rival, volcar, aceite) → milestone 04.
- Timer de partida y muerte súbita → milestone 05.

## Dependencies

- **Depends on:** milestone 02, ADR 0002
- **Blocks:** milestone 04

## Acceptance criteria

### Lógica pura (node --test, sin navegador)
- [x] Poner los 3 ingredientes correctos de una receta, en **cualquier orden**, marca la olla como "cocinando" — test: `tests/pot.test.js::receta correcta cocina`
- [x] Poner un ingrediente **equivocado** deja la olla **contaminada** y no cocina — test: `tests/pot.test.js::ingrediente equivocado contamina`
- [x] Poner un ingrediente **repetido** (ej. tomate×2 en pizza) contamina — test: `tests/pot.test.js::ingrediente repetido contamina`
- [x] `empty()` sobre una olla contaminada la limpia y se pierde el contenido — test: `tests/pot.test.js::vaciar limpia la contaminación`
- [x] **Romper la regla a propósito** (matchear sin exigir el conjunto correcto) hace **fallar** el test de receta correcta — test: `tests/pot.test.js::sanity — el test detecta el bug`

### Integración
- [x] La despensa spawnea 1 ingrediente cada 2 s y nunca supera 8 en el piso — test: `tests/server/pantry.test.js::spawn y máximo 8`
- [x] Siempre hay al menos 1 ingrediente disponible de los que necesita **cada comanda actual** — test: `tests/server/pantry.test.js::disponibilidad garantizada`
- [x] Un jugador agarra con Espacio tap y lleva **una sola cosa** a la vez — test: `tests/e2e/cooking.spec.js::una cosa a la vez`
- [x] Al completar los 3 correctos, tras 5 s la olla suma **1 plato** y sale la comanda siguiente — test: `tests/e2e/cooking.spec.js::cocina suma un plato`
- [x] Con equipos desparejos (4 vs 3), el **equipo de 3 cocina en 4 s** y el de 4 en 5 s — test: `tests/server/cooktime.test.js::equipo chico cocina en 4`
- [x] La secuencia de comandas es **idéntica** para ambos equipos — test: `tests/server/recipes.test.js::comandas iguales`
- [x] La comanda y los platos se ven iguales en dos pestañas enfrentadas — test: `tests/e2e/cooking.spec.js::comanda y platos consistentes`

### Extras que salieron en el camino (in-scope, quedaron con test)
- [x] Las ollas son obstáculos circulares (se cargan desde `POT_INTERACT_RADIUS`) — cubierto por `tests/server/movement.test.js` + e2e
- [x] Si el piso está lleno sólo de ingredientes necesarios y falta uno, la despensa **hace lugar** igual — test: `tests/server/pantry.test.js::si el piso está lleno sólo de ingredientes necesarios y falta uno, igual hace lugar`
- [x] Si se van todos, la **partida termina y el servidor vuelve al lobby** (evita arrastrar estado entre sesiones) — tests: `tests/server/lobby.test.js::reset()` + `tests/e2e/lobby.spec.js::si se van todos...`

## Exit condition

User juega con otro equipo: carga los 3 ingredientes correctos, ve la olla cocinar 5 s (o 4 s si está en el equipo de 3), suma un plato y recibe la comanda siguiente; meter un ingrediente equivocado muestra humo verde.

## Test plan

1. **Rojo primero (TDD §11):** escribir `tests/pot.test.js` completo antes de `server/pot.js`; confirmar los fallos correctos. Incluir el test de sanidad que prueba que un matcher mal hecho falla.
2. **Verde:** implementar `server/pot.js`, `server/recipes.js`, la parte de despensa/cocción en `server/game.js` y el render.
3. **Regresión:** `node --test` (unit pot/pantry/recipes/cooktime) + `npx playwright test tests/e2e/cooking.spec.js`.
4. **Manual:** partida 4 vs 3 confirmando 4 s vs 5 s y comandas iguales.

## Notes

- Matching por **conjunto** (todas las recetas tienen ingredientes distintos): `set(pot) === set(recipe)`.
- Contaminación: si el multiset de la olla **no es subconjunto** de la receta actual → contaminada.
- "Equipo más chico" = equipo con menos jugadores; si están parejos, ambos 5 s.
