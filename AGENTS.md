# AGENTS.md

> Lean enforcement file for any AI agent working in this repository. Read this file **first**, every session, before any other action. Cross-tool standard (Cursor, Aider, Codex, Claude, etc.). Claude users: `CLAUDE.md` points here.

This project follows the `make-game` pipeline. Do not improvise process — follow the rules below.

## Project overview

- **Title:** Guerra de Cocinas
- **Pitch:** Arcade 2D top-down para 7 jugadores en LAN; dos equipos (4 vs 3) cocinan platos en su olla y sabotean la del rival. Gana el que más platos sirve en 5 minutos.
- **Genre / type:** Arcade multijugador competitivo (cocina + sabotaje), top-down 2D.
- **Engine:** Phaser 4 `^4.1.0` (cliente) + Node/`ws` autoritativo (servidor).
- **Language:** JavaScript ES Modules.
- **Target platform:** Web, **desktop** (7 PCs en LAN). Mobile fuera de alcance.

## Hard gate: no code before plan

El plan ya existe (`docs/gameplan.md`, `docs/tech.md`, ADRs 0001–0002). **No** reabras la idea phase ni escribas fuente sin un milestone. Todo trabajo de feature se apoya en un doc de `docs/milestones/`.

## Mandatory: run the make-game skill

Cada sesión en este directorio **debe** correr el sub-pipeline session-start del skill `make-game` antes de cualquier trabajo: recuperar contexto (`docs/STATE.md` → `gameplan.md` → `tech.md` → milestones), determinar la fase y confirmar el próximo paso.

Si el skill no está instalado en tu entorno, aplicá las reglas de este archivo manualmente y avisá que falta el skill.

## Source-of-truth files

Leelos al inicio de sesión; **no** los edites unilateralmente — proponé cambios y pedí confirmación.

- `docs/STATE.md` — handoff de la última sesión. Se lee primero.
- `docs/gameplan.md` — definición del juego (loop, reglas, arte, audio, anti-goals).
- `docs/tech.md` — stack, tooling, convenciones.
- `docs/milestones/` — trabajo desglosado con acceptance criteria.
- `docs/architectural-decisions/` — decisiones top-level bloqueadas.

## Architecture rules

- **Servidor autoritativo (ADR 0002)** — el servidor Node+`ws` simula TODO a 20 ticks/s y manda el estado completo. El cliente **no** tiene lógica de juego.
- **EventBus singleton** — comunicación entre módulos del cliente por pub/sub, eventos `domain:action`. Ningún módulo importa a otro para comunicarse.
- **GameState singleton** — estado central del cliente, alimentado desde los mensajes del server; `reset()` restaura un estado limpio.
- **Constants compartidas** — `shared/constants.js` es la **única** fuente de números del juego, importada por `server/` y `src/`. Cero valores hardcodeados en la lógica.
- **Puerto único** — el server sirve `dist/` y el WebSocket en el **mismo puerto 3000**.
- **`window.render_game_to_text()`** — snapshot JSON del estado actual para inspección del agente sin screenshots.
- **Lógica de olla pura** — `server/pot.js` sin dependencias de red, testeable con `node --test`.
- **Errores del proyecto → `docs/backlog.md`**, nunca a la memoria de la conversación.

## Stack-specific commands

- **Dev server:** `npm run dev` (Vite en :3000, proxya `/ws` a :3001) + `npm run dev:server` (servidor WS en :3001)
- **Build:** `npm run build` (Vite → `dist/`)
- **Run (single port):** `npm start` (build + server Node en :3000, HTTP + WS)
- **Unit tests:** `npm test` (`node --test`)
- **E2E tests:** `npx playwright test`
- **Runtime check:** `node scripts/verify-runtime.mjs`
- **Arch check:** `node scripts/validate-architecture.mjs`
- **Lint / format:** n/a

## Live iterate (after every code change)

Después de cada cambio de código con sentido en la fase de desarrollo:

1. Confirmá que el server/ dev está vivo y la consola **sin errores**.
2. Llamá `render_game_to_text()` y verificá que el estado coincida con el cambio.
3. Para cambios dependientes del tiempo, avanzá con el tick del server y releé.
4. Si es visual, sacá screenshot y guardalo en `output/iterate/`.
5. Chequeá estado adyacente por regresiones.
6. Devolvé al usuario con un veredicto de una línea y una pregunta enfocada.

Un cambio **no está hecho** hasta que corrió este loop.

## Append vs spawn a new milestone

- **Append** una AC al milestone actual si es refinamiento in-scope.
- **Spawn** un milestone nuevo si es out-of-scope pero relacionado; usá `Depends on:`.
- **Inline** fixes triviales (typos, one-liners) en el milestone actual.

Ante la duda, preferí spawnear. No infles milestones.

## Minimum-viable doc mode

Si el usuario pide menos doc, bajá la densidad — **no** la saltees:

- Entrada de milestone de una línea (título + AC) es aceptable.
- `docs/STATE.md` sigue siendo obligatorio.
- `docs/gameplan.md` y `docs/tech.md` deben existir.
- Los ADRs de engine/lenguaje/stack no se saltean.

## Last regenerated

2026-10-16 by opencode (DeepSeek). Regenerar cuando cambie el engine, los comandos principales o las reglas de arquitectura.
