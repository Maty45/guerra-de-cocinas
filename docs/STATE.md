# Session state

> Updated at the end of each session that made progress. Read first at the start of each session.

## Last updated

2026-10-19 by opencode (DeepSeek)

## Current phase

development

## Current milestone

**Milestone 06 — Pulido, sprites, audio y QA: 🔄 en curso.**
Hecho: **sprites**, **audio procedural**, **diseño/juice** y **suite E2E liviana**. Pendiente: **cierre de QA con playtest del usuario**.

## Last action

**README para publicar en GitHub.**
- `README.md` con pitch, captura (`docs/img/gameplay.png`), reglas, controles, stack, cómo correr en LAN, scripts, arquitectura, tests y links a `docs/`. (No se agregó LICENSE: queda "todos los derechos reservados" hasta que el usuario decida.)
- Auditoría previa de privacidad/secretos: sin keys, emails, IPs ni rutas absolutas; `.gitignore` cubre `node_modules/`, `dist/`, `output/`, `.env`, `test-results/`.

**Comanda con papel + decoración del escenario (pedido del usuario).**
- **Comanda del HUD:** la receta ya no es texto suelto; cada equipo tiene un **ticket de papel** colgado con cinta (`TICKET` en `Constants.js`): cabecera del color del equipo con `COMANDA` + `ROJO/AZUL`, nombre del plato e **iconos de los 3 ingredientes** (se actualizan cuando cambia la comanda). Reemplaza `orderRed`/`orderBlue` por `this._tickets[team]` (`_createTicket` / `_updateHud`).
- **Decoración:** props sobre las mesadas (`_decorateCounters`): **tabla de picar + cuchillo** en las mesadas de arriba (espejadas por equipo), **fuente con cuchara** (color del equipo) abajo, **pila de 3 platos** en la despensa y **planta aromática** en la isla central. **Alfombra del color del equipo** bajo cada cocina (`STAGE.RUG_*`). **Piso con juntas**: el tile de piso tiene grilla cada 32 px (antes sólo motas) para leerse como cerámica de cocina.
- **Verificado:** `npm test` **86/86** · arquitectura 5/5 sin warnings · E2E **29/29 en 1.9 min**. Captura: `output/iterate/m06-comanda.png` (detalles: `crop-comanda.png`, `crop-stove.png`).

**Controles, cocinas con hornalla y efecto de aturdimiento (pedidos del usuario).**
- **Flechas del teclado:** `KEY_TO_DIR` ahora mapea `ArrowUp/Down/Left/Right` además de WASD (y se hace `preventDefault` para que no scrolleen la página). Textos de ayuda del lobby, del HUD y del cartel de inicio actualizados a "WASD o flechas". E2E nuevo en `movement.spec.js`: mueve con `ArrowLeft`, verifica desplazamiento y que al soltar se detiene.
- **Ollas y mesadas con volumen (referencia de cocina cozy):** la olla de cobre (20×20) se apoya sobre una **cocina/hornalla** (sprite 28×20: hornalla de hierro, borde cromado, panel de esmalte crema y 3 perillas), con sombra de contacto. Las mesadas ahora muestran **tapa de madera + frente con tablas verticales + sombra**, en vez de un rectángulo plano. Mientras cocina, la hornalla emite un **resplandor cálido aditivo** (verde si está contaminada). Constantes en `STAGE` (`src/core/Constants.js`) y `SPRITE_SIZES.POT` 2.5.
- **Aturdimiento por tomatazo:** además del impacto/partículas, el chef aturdido muestra **3 estrellitas doradas girando sobre la cabeza**, **tambaleo** (rotación ±9°) y un **halo dorado** en el anillo; el tinte suave (0xffd6d6) deja ver el sprite (antes era una silueta blanca). Al terminar el stun se limpian estrellas, tweens, rotación y tinte. E2E de `sabotage.spec.js` verifica estrellas/tweens visibles y su limpieza.
- **Verificado:** `npm test` **86/86** · arquitectura 5/5 sin warnings · build OK · E2E **29/29 en 1.9 min**. Capturas: `output/iterate/m06-cocinas.png` (cocinas/mesadas) y `output/iterate/m06-stun.png`.

**Fixes de juego + pasada de detalle de texturas (pedidos del usuario).**
- **Soltar ingredientes (bug):** con la despensa llena (caso normal: `_ensureAvailability` la mantiene en 8) el tap se ignoraba y quedabas pegado al ingrediente. Ahora `_dropCarried()` **siempre** suelta: `_makeRoomFor()` libera un slot (primero algo que ninguna comanda pide, después un duplicado) y, si todo es único y necesario, deja la despensa en 8+1 (el spawner se frena solo). Tests: `tests/server/drop.test.js` (piso lleno + carga en olla propia) y el E2E de cocina espera a que la despensa se rellene antes de soltar.
- **Hit area de EMPEZAR (bug):** en Phaser 4 el rectángulo interactivo del Container se mide desde su origen local. Con `Rectangle(-w/2, -h/2, w, h)` el área clickeable quedaba corrida **media caja arriba-izquierda**. Ahora es `Rectangle(0, 0, w, h)` en `LobbyScene` y `GameOverScene`. El E2E clickea el borde superior-izquierdo visible y verifica que un click **fuera** no arranca.
- **Texturas con más detalle:** ingredientes redibujados con brillo arriba-izquierda + sombra abajo-derecha (y `ITEM_SCALE` 3 → 4, textura 48 px para que no se vea borrosa); olla nueva de **20×20** (asas, remaches, borde de acero y caldo cálido, `POT_SCALE` 5); mesadas de madera clara con veta y borde iluminado; chef con gorro sombreado, mentón y delantal con brillo/sombra (el azul se recolorea completo: base, brillo y sombra). La paleta sumó las sombras de cada material (`DOUGH_*`, `POTATO_*`, `CRUST_*`, `YELLOW_*`, `GREEN_*`, `RED_*`, `MEAT_*`, `GOLD_*`, `STEEL_SH`, `WOOD_HL`, `BROTH*`).
- **Ingredientes sin amontonarse:** `_randomPantrySpot()` prueba hasta 12 posiciones y respeta `INGREDIENT_MIN_SPACING = 72`, así los nombres no se pisan.
- **Verificado:** `npm test` **86/86** · arquitectura 5/5 sin warnings · build OK · E2E **28/28 en 1.7 min**. Captura: `output/iterate/m06-detalle.png`.

**Legibilidad del campo (pedido del usuario): ingredientes identificables + pisos claros.**
- **Piso blanco:** la paleta de tiles pasa de casi negro (`0x1a1a1f`) a blanco cocina (`0xefede6` / junta `0xe0ddd3`). Las zonas ahora son tintes pastel (`KITCHEN_RED 0xff8a80`, `KITCHEN_BLUE 0x7fb0ff`, `PANTRY 0xcfcabb`) en vez de rojo/azul oscuros. Todo el texto sobre el campo pasó a colores oscuros (`UI.FIELD_TEXT` / `FIELD_MUTED`) para seguir legible: HUD (timer conserva el stroke), pedidos, marcador, estado, mute, etiquetas de zona y de olla.
- **Ingredientes:** cada ítem del piso se dibuja como **container sprite + nombre** (`MASA`, `PAPA`, `PAN`…), más grandes (`SPRITE_SIZES.INGREDIENT` 2.2 → 2.8) y con etiqueta de 16 px. Arte más distinguible: `masa` ahora es una masa crema tostada (`0xe6cd98`), `papa` es marrón con **brote verde y ojos**, `pan` es una baguette con cortes de harina. Se agregaron `DOUGH`, `POTATO` y `CRUST` a la paleta.
- Ajustes menores: vapor más oscuro (`0xb9c7da`) para que se vea sobre el piso claro; `visual.spec` lee `_items` como containers.
- **Verificado:** `npm test` 84/84 · arquitectura 5/5 sin warnings · E2E **28/28 en 1.7 min**. Captura: `output/iterate/m06-piso-claro.png`.

**Fix de usabilidad del lobby (reporte del usuario: "el botón EMPEZAR no me deja apretarlo").**
- Causa: con **1 solo jugador** el botón se ve (el host lo ve siempre) pero está **deshabilitado** (`canStart` exige ≥2 conectados) y el único aviso era el texto chico del pie → parecía roto. El click sí funcionaba con 2+ (verificado con un click real en Playwright).
- Ahora: texto **dorado pegado al botón** con el motivo (`Faltan jugadores: 1/2 conectados`), cursor `not-allowed`, y al clickearlo deshabilitado el botón **se sacude** y el aviso **pulsa**. El estado del pie pasó a "Esperando jugadores…" para no duplicar el mensaje.
- De paso: las instrucciones del lobby ya no se desbordan del panel ni chocan con el roster (líneas más cortas + `wordWrap`).
- Cobertura nueva: `lobby.spec.js` ahora **clickea el botón de verdad** (antes sólo se usaba `__NET__.start()` por API, por eso el bug de UX no se detectó) y verifica el aviso con 1 jugador.
- **Verificado:** `npm test` 84/84 · `validate-architecture` 5/5 sin warnings · E2E **28/28 en 1.7 min**. Captura: `output/iterate/m06-lobby-1p.png`.

**Milestone 06 — partes 3 y 4: diseño/juice + tests livianos.**
- **Juice:** `src/core/fx.js` (detección **PURA** de eventos visuales por diff de snapshots, testeada con `node --test`) + `src/core/Effects.js` (partículas por tweens, anillos, texto flotante, shake, vapor continuo, pulso del HUD). Se dispara: **plato servido** (estallido dorado + anillo + `+1` + shake + pop del marcador), **volcado** (estallido marrón + shake), **contaminación** (humo verde + anillo + shake), **tomatazo** (splash rojo + impacto blanco + shake), **resbalón**, **inicio de cocción** y **vapor** mientras la olla cocina. Transiciones: fundido de salida en Lobby→Partida, Partida→Fin y Fin→Revancha (`FADE_OUT_COMPLETE`). Olla: interior con color de caldo, alfombra del color del equipo y latido al cocinar; contenidos escalados dentro de la olla; etiquetas de zona movidas para no chocar con la barra de estado. Todo configurables desde `FX`, `SHADOW` y `COOKING` en `Constants.js`.
- **Tests livianos (pedido explícito del usuario por el calor de la máquina):**
  - Hook de test del servidor `MSG.TEST {action:'place', target?, x, y}` → `Game.placePlayer()` (sólo con `ALLOW_TEST_HOOKS`). El cliente lo expone como `__NET__.testPlace()`. Mueve al jugador sin caminar.
  - `tests/e2e/helpers.js`: `openPages` (**un** contexto con N pestañas en vez de N contextos), `placeAt` / `placeNear` (posicionamiento con el hook) y `waitForGameScene` (con los fades, `mode === 'playing'` llega antes de que `GameScene.create()` monte el teclado).
  - `playwright.config.js`: 1 worker (ya estaba), args `--mute-audio --disable-dev-shm-usage`.
  - Cliente en automatización (`navigator.webdriver`): Phaser a **20 fps** (`AUTOMATION.RENDER_FPS`) y **audio apagado** (salvo en `audio.spec`, que activa `window.__AUDIO_ALWAYS__`).
  - Resultado: la suite E2E completa corre **26/26 en ~1.4 min** de punta a punta (antes fallaba por timeouts y consumía mucho más CPU). `npm test` **84/84**.
- **Onboarding:** panel **"CÓMO SE JUEGA"** en el lobby (columna izquierda: objetivo + WASD/Espacio/2 s/E/M) y recordatorio breve **"¡A COCINAR!"** al empezar cada partida, que se desvanece solo (`ONBOARDING.LINGER` + `FADE`) y **no bloquea input**. Capturas: `output/iterate/m06-lobby.png` y `m06-hint.png`.
- **Regresión M05 (cerrada):** `MATCH_START` hacía `gameState.teams = msg.teams` y enseguida `resetMatch()` (que vaciaba `teams`); ahora `resetMatch()` corre **antes** de asignar equipos.
- **Verificado:** `npm test` 84/84 · `validate-architecture` 5/5 sin warnings · `npm run build` OK · E2E completo 26/26 (1.4 min). Capturas en `output/iterate/m06-sprites.png` y `output/iterate/m06-juice.png`.

## Next step

**Playtest del usuario** (los ACs de "feel" siguen pendientes de validación humana; ver el milestone 06). Correr `npm start` y probar en LAN con 2+ PCs: legibilidad del lobby, nombres en partida, suavidad de interpolación, feel de cocina/tomatazo, juice (partículas/shake/transiciones) y pantalla final + revancha. **Ojo: para arrancar hacen falta ≥2 jugadores conectados** (2 pestañas del mismo navegador sirven para probar). Después: cerrar el milestone 06 y actualizar este archivo.

## Blockers

none

## Notes for next session

- **Lógica de olla pura** en `server/pot.js` (sin red) — es el requisito explícito del §11 del spec.
- Protocolo en `shared/protocol.js` (`MSG`): `join, start, rematch, input, action, test` (cliente→server) · `hello, welcome, roster, match_start, state, error` (server→cliente). `action.kind` ∈ `tap | hold | holdStop | throw`.
- Snapshot del servidor: `{ t, mode, phase, winner, saboteur, timeLeft, score:{red,blue}, order:{red,blue}, pots:{red,blue}, ingredients:[], tomatoes:[], oil:{x,y}|null, puddles:[], players: { id: { name, team, x, y, dirX, dirY, connected, stunned, slipping, carrying, tomatoesHit, dumping:{team,own,progress}|null } } }`.
- Sabotaje (M04): Espacio keydown → `hold` (el servidor mide los 2 s de forma autoritativa con `p.dumping`); keyup → `tap` (<2 s) o `holdStop`. **E** → `throw`. La olla rival se contamina metiendo un ingrediente con tap estando cerca de ella.
- Fin de partida (M05): `timeLeft`/`phase`/`winner` en el `Game`; `game_over` congela la simulación. Revancha = `MSG.REMATCH` (host) → `beginMatch()` (re-sortea equipos). Hook de test `MSG.TEST {action:'endMatch'}` sólo con `ALLOW_TEST_HOOKS` (lo setea `playwright.config.js`).
- Hooks de test: `window.__NET__`, `window.__GAME_STATE__`, `window.__GAME__`, `window.render_game_to_text()`. `__NET__.inputSends` cuenta envíos de input; `__NET__.actionSends` cuenta acciones de Espacio.
- `_ensureAvailability()` mantiene ≥1 unidad de cada ingrediente que pide **cada comanda actual**; si el piso está lleno saca un no-necesario o, si todo es necesario, un duplicado.
- Mapa en `shared/map.js` (ZONES, COUNTERS con `id`, SPAWNS, POTS, PANTRY/PANTRY_SPOTS) en unidades de diseño 1280×720.
- Ciclo de vida del servidor: `start` crea `Game` + loop 20 Hz; si los conectados llegan a **0** → `endMatch()` (para el loop, descarta la simulación, `Lobby.reset()`). Con 1 jugador la partida sigue viva para permitir la reconexión.
- Comandos: `npm start` (single port 3000) · `npm test` · `npx playwright test` · `npm run build` · `node scripts/verify-runtime.mjs` · `node scripts/validate-architecture.mjs`.
- No usar `@strudel/web` (AGPL), Play.fun ni PartyKit.
- Arte (M06): todo el pixel art se genera en runtime. `renderPixelArt(scene, pixels, PALETTE, key, scale)` y `renderSpriteSheet(...)` en `src/core/PixelRenderer.js`; matrices en `src/sprites/*`. `palette.js` define `PALETTE` (índice 0 = transparente) e `IDX`. Los colores de equipo se generan por `recolor(frame, from, to)` (rojo→azul), sin duplicar arte. Claves de textura: `player-red|blue`, `item-<kind>`, `sprite-tomato|oil|pot|smoke|puddle`, `tile-floor-0|1`, `tile-counter-0`. Tamaños/`DEPTH`/`WALK_FPS` en `Constants.js`. El validador de arquitectura **ignora `src/sprites/` y `src/audio/`** (datos/síntesis, no números mágicos).
- Audio (M06): `src/audio/*`. `AudioManager` (dueño del `AudioContext` + master gain; el secuenciador no arranca hasta que el contexto esté `running`). `sfx.js` (one-shots), `music.js` (secuenciador por pasos), `cues.js` (**puro**, testeado con `node --test`). `AudioBridge` cablea EventBus→audio. `window.__AUDIO__` expuesto para tests. Mute con **M** (sólo con `selfId`, para no pisar el nombre en el lobby) + `localStorage.muted`.
- **PRESUPUESTO DE RECURSOS (pedido explícito del usuario):** la suite E2E ya está **aligerada** (un contexto por test, hook de posicionamiento `place`, 20 fps y audio off en automatización): corre completa en ~1.4 min y podés correrla entera. Igual, para cambios visuales puntuales preferí `npm test` + un solo spec, y limpiá `test-results/` después.
- **Juice (M06):** `src/core/fx.js` es **puro** (diff de snapshots → eventos `serve|tip|contaminate|cookstart|splash|impact|slip`) y tiene test propio (`tests/fx.test.js`). `src/core/Effects.js` los dibuja (círculos + tweens, sin plugins) y `GameScene._updateFx()` diffea **por tick** (no por frame). Todos los números en `FX`/`SHADOW` (Constants). `waitForGameScene()` en `tests/e2e/helpers.js` es obligatorio antes de apretar teclas: con los fundidos, la escena tarda un frame extra en montar el listener.
