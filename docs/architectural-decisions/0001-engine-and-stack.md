# ADR 0001: Engine, lenguaje y estilo de arte

## Status

accepted

## Date

2026-10-16

## Context

Arranca un juego web 2D arcade para 7 jugadores simultáneos en LAN, con vista top-down de una cocina y necesidad de renderizar muchos sprites etiquetados (nombre sobre cada personaje) a pantalla fija 1280×720. La herramienta elegida para construir (`game-creator`) es opinionada sobre Phaser (2D) o Three.js (3D), y su template 2D actual apunta a **Phaser 4** (`^4.1.0`). Hay que fijar engine, versión, lenguaje y estilo de arte, y la forma de compartir constantes entre el servidor y el cliente.

## Decision

- **Engine cliente: Phaser 4** (`^4.1.0`), 2D top-down, escala `FIT` desde un espacio de diseño fijo **1280×720**.
- **Lenguaje: JavaScript ES Modules** (no TypeScript) en cliente y servidor, para poder importar `shared/constants.js` desde ambos sin paso de compilación ni duplicación.
- **Servidor: Node.js + `ws`** (ver ADR 0002).
- **Estilo de arte: pixel art de cocina top-down**, paleta distinta por equipo (rojo/azul) y nombre del jugador sobre cada personaje. Base procedural (formas) primero, sprites pixel art en el milestone de pulido.

## Consequences

### Positive

- Phaser 4 es el engine vigente del template de la skill: arcade physics, grupos/pooling y arquitectura de escenas que calza con `EventBus`/`GameState`/`Constants`.
- JS ESM evita la fricción de tipos en un proyecto donde el mismo archivo de constantes lo consume Node y el browser.
- Espacio de diseño fijo 1280×720 + escalado = una sola verdad de layout (todos ven lo mismo), ideal para 7 jugadores.
- Phaser 4 es WebGL-first: mejor rendimiento de dibujo que Phaser 3 en muchos sprites.

### Negative

- Renunciamos a la seguridad de tipos de TypeScript (aceptable por el tamaño del proyecto).
- Pixel art procedural en runtime implica trabajo manual de matrices; se difiere al milestone de pulido.

## Alternatives considered

- **Phaser 3 (`^3.90.0`):** es lo que declara el README de la skill (inconsistente con su propio template, que ya usa Phaser 4). Se priorizó el template vigente.
- **Three.js (3D):** rechazado — el juego es 2D top-down; 3D agrega costo sin aportar al loop.
- **TypeScript + plantilla `phaserjs/template-vite-ts`:** rechazado — complica compartir constantes sin build y no aporta valor para este alcance.
- **Godot/Unity:** rechazado — el juego es web/LAN, no necesita motor nativo ni export.

## Related

- `docs/tech.md`
- ADR 0002 (servidor autoritativo y puerto único)
- Milestones 02 y 06
