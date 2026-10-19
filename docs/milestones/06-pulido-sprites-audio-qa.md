# Milestone 06: Pulido con la skill (sprites, audio y QA)

## Status

in progress — sprites, audio, juice y QA automática listos; falta el **playtest del usuario** (ACs de "feel").

## Objective

Última pasada de presentación y calidad: reemplazar las formas geométricas por **pixel art** legible, agregar **audio procedural**, pulir el "feel" (partículas, feedback de cocción/sabotaje, transiciones) y dejar el proyecto con **QA Playwright** completo, usando las skills `add-assets`, `game-designer`, `game-audio` y `qa-game`.

## Scope

- **Sprites (skill `add-assets`):** `src/core/PixelRenderer.js`, `src/sprites/palette.js` y matrices para jugadores (por equipo), tomates, ingredientes (8 tipos), ollas, mesadas, charco de aceite. Paleta distinta rojo/azul.
- **Audio (skill `game-audio`, Web Audio API, **sin Strudel**):** `src/audio/{AudioManager,music,sfx,AudioBridge}.js` + mute (tecla M) y persistencia de mute.
- **Polish (skill `game-designer`):** partículas de cocción, humo verde, splash de tomatazo, shake en plato servido/volcado, transiciones Lobby→Game→GameOver. Respetar el EventBus (`SPECTACLE_*` donde aplique).
- **QA (skill `qa-game`):** `playwright.config.js`, `tests/fixtures`, `tests/e2e/{game,visual,perf}.spec.js` + runner multi-contexto de 7 pestañas; baselines visuales de escenas estables.
- Verificación con `scripts/verify-runtime.mjs` (sin errores de consola/WebGL) y `scripts/validate-architecture.mjs` (EventBus/GameState/Constants/`render_game_to_text`).

## Out of scope

- Nuevas mecánicas de juego (cualquier idea nueva → `docs/backlog.md`).
- Deploy / monetización.

## Dependencies

- **Depends on:** milestone 05
- **Blocks:** none

## Acceptance criteria

- [x] Ninguna entidad usa formas geométricas crudas: todas usan `renderPixelArt()` / `renderSpriteSheet()` — test: `tests/e2e/visual.spec.js::todas las texturas de pixel art se generan y las entidades las usan`
- [ ] Un jugador distingue a qué equipo pertenece cada personaje y quién es por el nombre — verified by user playtest
- [x] Hay música de fondo en loop y SFX para cocinar, plato, tomatazo, stun, resbalón, fin de partida — test: `tests/e2e/audio.spec.js::la música de fondo arranca con la partida`
- [x] El mute (tecla M) silencia todo y persiste entre recargas — test: `tests/e2e/audio.spec.js::el audio se inicializa con un gesto y M mutea/desmutea (con persistencia)`
- [x] Existe una toggle de mute visible (indicador `M = sonido: ON/OFF` en lobby y partida)
- [x] `node scripts/validate-architecture.mjs` pasa EventBus/GameState/Constants/`render_game_to_text` — 5/5, 0 warnings
- [x] La suite completa de Playwright (incluido el runner de 7 pestañas) pasa en verde — 26/26 en ~1.4 min
- [x] Hay feedback visual en cada acción clave: plato servido (estallido + `+1` + shake), volcado, contaminación, tomatazo, resbalón, cocción (vapor + latido), transiciones — test unitario: `tests/fx.test.js`
- [x] Hay instrucciones claras al principio: panel "CÓMO SE JUEGA" en el lobby + recordatorio "¡A COCINAR!" al empezar (se desvanece solo)
- [ ] El juego "se siente" pulido — verified by user playtest

## Exit condition

User ejecuta `npm run build && npm start`, abre 7 pestañas y juega una partida completa viendo sprites pixel art, música/SFX con mute funcionando, y `npx playwright test` queda en verde.

## Test plan

1. **Rojo primero:** escribir los specs de QA (`game`, `visual`, `perf`, `audio`) contra el estado pre-pulido (esperando fallar en "sin pixel art" / "sin audio").
2. **Verde:** correr `add-assets` → `game-designer` → `game-audio` → `qa-game`; regenerar baselines visuales.
3. **Regresión:** `node --test` + `npx playwright test` + `verify-runtime.mjs` + `validate-architecture.mjs`.
4. **Manual:** playtest de 7 jugadores y juicio de "se siente bien".

## Notes

- Audio con Web Audio API puro (sin `@strudel/web`) por la licencia AGPL — ver `docs/tech.md`.
- Este es el único milestone donde se corre `/qa-game` como cierre, tal como pide el spec (§0).
- Verificación manual de `verify-runtime.mjs` / `validate-architecture.mjs` (se ejecutan desde la raíz del proyecto).
- **QA liviana:** el hook `MSG.TEST {action:'place'}` (sólo `ALLOW_TEST_HOOKS`) permite posicionar jugadores en los E2E sin caminar; `helpers.js` comparte un solo contexto por test. En automatización el cliente corre a 20 fps y sin audio para no calentar la máquina. La suite completa tarda ~1.4 min.
- **Arranque con 1 jugador (fix de usabilidad):** `EMPEZAR` sólo se habilita con ≥2 conectados. Antes, un host solo veía un botón gris sin explicación. Ahora muestra "Faltan jugadores: N/2 conectados", sacude al clickearlo y usa cursor `not-allowed`. `lobby.spec.js` cubre el **click real** del botón (antes sólo se probaba `__NET__.start()`).
- **Legibilidad del campo (pedido del usuario):** piso claro tipo cocina (blanco crema + juntas), zonas con tintes pastel y texto del campo oscuro. Cada ingrediente del piso lleva su **nombre debajo** y los sprites son más grandes; `masa`, `papa` y `pan` se rediseñaron para no confundirse entre sí. Captura: `output/iterate/m06-piso-claro.png`.
- **Soltar + hit areas + detalle (bugs y pedido del usuario):** soltar un ingrediente ya no falla con la despensa llena (`_makeRoomFor`); el botón EMPEZAR usa `Rectangle(0,0,w,h)` (Phaser 4) y el área clickeable coincide con el dibujo; ingredientes con brillo/sombra y textura 48 px, olla 20×20 con asas/remaches/caldo, mesadas claras y chef sombreado. Captura: `output/iterate/m06-detalle.png`.
- **Controles + cocina cozy + aturdimiento (pedido del usuario):** flechas del teclado además de WASD (con `preventDefault` para no scrollear); la olla de cobre se apoya en una hornalla (hierro + cromo + panel de esmalte con perillas) y las mesadas muestran tapa + frente de tablas + sombra; al cocinar, la hornalla brilla en cálido (verde si está contaminada). El aturdido muestra estrellitas doradas girando, tambaleo y halo dorado, y se limpia al terminar. Capturas: `output/iterate/m06-cocinas.png` y `output/iterate/m06-stun.png`.
- **Comanda + decoración (pedido del usuario):** la receta del HUD es un **ticket de papel** (cabecera del color del equipo, nombre del plato e iconos de ingredientes) y el escenario sumó props sobre las mesadas (tabla de picar, fuente, platos, planta), alfombra de equipo bajo la cocina y juntas de cerámica en el piso. Constantes en `TICKET`/`DECOR`/`STAGE` (`src/core/Constants.js`). Captura: `output/iterate/m06-comanda.png`.
