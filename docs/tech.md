# Tech stack

## Engine / runtime

- **Engine (cliente):** Phaser 4 (`^4.1.0`)
- **Engine (cliente):** Phaser 4 (`^4.1.0`)
- **Runtime (servidor):** Node.js (probado en v24.12.0) + `ws`
- **Language(s):** JavaScript ES Modules (sin TypeScript — el repo de la skill mezcla TS/JS; acá se fija JS ESM para compartir módulos entre server y cliente sin build)
- **Target platforms:** Web, **desktop** (7 PCs en LAN). Mobile fuera de alcance.

## Architecture (resumen — detalle en ADR 0002)

- **Servidor autoritativo**: el servidor Node simula TODO (movimiento, colisiones, tomates, ollas, puntaje) a **20 ticks/s** y en cada tick manda el **estado completo** a todos.
- **Cliente delgado**: Phaser 3 solo envía el estado de las teclas **cuando cambia** y dibuja el estado que recibe, **interpolando** posiciones. La lógica de juego **no** vive en el cliente.
- **Un solo puerto**: el server sirve el cliente compilado (`dist/`) **y** el WebSocket en el **mismo puerto 3000**. `npm start` imprime `http://<IP-LAN>:3000`.
- **Constantes compartidas**: todos los números del juego viven en `shared/constants.js`, importado por server y cliente.

## Libraries / frameworks

| Library | Version | Purpose |
|---------|---------|---------|
| phaser | ^4.1.0 | Render 2D e input del cliente |
| ws | ^8.18.0 | WebSocket del servidor autoritativo |
| vite | ^7.3.1 | Bundler/dev server del cliente |
| @playwright/test | ^1.58.0 | QA E2E, incluido multi-contexto (7 pestañas) |
| (node:test) | built-in | Tests unitarios de la lógica de olla/recetas (sin navegador) |

## Tooling

- **Package manager:** npm
- **Build:** Vite (`npm run build` → `dist/`)
- **Testing:** `node --test` para unit del servidor; Playwright para E2E (incluye un runner multi-contexto para 7 jugadores)
- **Linting / formatting:** n/a por ahora (agregar ESLint+Prettier si el ruido lo justifica)
- **Asset / binary storage:** n/a (sprites y audio procedurales; sin binarios en git)

## Project layout

```
guerra-de-cocinas/
├── docs/                          # gameplan, tech, ADRs, milestones, STATE, backlog
├── shared/
│   └── constants.js               # ÚNICA fuente de los números del juego (§8)
├── server/
│   ├── index.js                   # http + ws + estáticos + imprime IP LAN
│   ├── lobby.js                   # nombres, host, sorteo de equipos, reconexión
│   ├── game.js                    # simulación a 20 Hz (tick), colisiones, timer, puntaje
│   ├── pot.js                     # lógica PURA de olla/receta (testeable con node --test)
│   ├── recipes.js                 # recetas + secuencia de comandas
│   └── map.js                     # 1280×720, zonas y mesadas
├── src/                           # CLIENTE Phaser (lo valida validate-architecture.mjs)
│   ├── core/
│   │   ├── EventBus.js            # pub/sub singleton, eventos domain:action
│   │   ├── GameState.js           # estado central, alimentado desde los mensajes del server
│   │   ├── Constants.js           # re-exporta shared/constants.js (+ SAFE_ZONE, GAME dims)
│   │   └── NetworkManager.js      # WS: envía input al cambiar, recibe estado
│   ├── scenes/                    # Lobby, Game, GameOver
│   ├── entities/                  # Player, Tomato, Ingredient, Oil, names
│   ├── systems/                   # interpolación, fondo, partículas
│   └── main.js                    # entry + window.render_game_to_text()
├── tests/
│   ├── pot.test.js                # node --test: receta ok / contaminar / volcar
│   └── e2e/                       # Playwright (multi-contexto)
├── index.html                     # entrada de Vite (raíz)
├── vite.config.js
├── playwright.config.js
└── package.json
```

> `client/` se descartó: Vite necesita `index.html` en la raíz y `validate-architecture.mjs` busca `src/`. El código del cliente vive en `src/`, el server en `server/`.

## Conventions

- **Code naming:** `camelCase` funciones/variables, `PascalCase` clases/escenas, `SCREAMING_SNAKE_CASE` constantes. Archivos de clase en `PascalCase.js`, módulos utilitarios en `lowercase.js`.
- **State machines:** estado de la partida y del jugador (idle / carrying / cooking / stunned / slipping) por máquina de estados en el **servidor**.
- **Asset naming:** n/a (procedural).
- **File-per-component:** un archivo por entidad/escena/sistema.
- **Comunicación:** EventBus singleton; los módulos **no** se importan entre sí para comunicarse.
- **Cero números mágicos:** todo valor va a `shared/constants.js`.

## Out-of-scope dependencies

- **`@strudel/web`** — AGPL-3.0; se evita para no forzar licencia AGPL. Audio con Web Audio API.
- **Play.fun / `monetize-game`** — sin monetización.
- **PartyKit / Cloudflare (`add-multiplayer`)** — el multiplayer es Node + `ws` propio en LAN.
- **Playwright MCP / here.now / deploy** — fuera de alcance.
- **TypeScript** — se fija JS ESM para compartir `shared/constants.js` sin build entre server y cliente.
