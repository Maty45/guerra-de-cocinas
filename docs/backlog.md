# Backlog

> Out-of-scope ideas, feature requests, and follow-ups captured during sessions but **not** worked on in the session that captured them. Read at the start of every milestone-creation conversation. Append-only — promoted items get a checkbox tick and a link to the milestone that absorbed them, not a deletion.
>
> If an item turns out to be wrong / no longer wanted, mark it `~~struck through~~` with a one-line reason rather than removing it; future sessions need to see that it was considered and rejected.

## How to write a backlog entry

```
- [ ] <short title> — <one-sentence description of the desired behavior or change>
  - Source: <session date or user message that introduced it>
  - Rough size: <S | M | L> · Rough value: <S | M | L>
  - Notes: <optional — constraints, dependencies, related milestones, references>
```

## Gameplay & features

- [ ] Cantidad de jugadores configurable por el host — permitir partidas con menos de 7 y balancear equipos distinto de 4/3.
  - Source: 2026-10-16 · spec (§3/§8 solo define 7)
  - Rough size: S · Rough value: M
  - Notes: hoy el sorteo asume 7; generalizar el reparto parejo.
- [ ] Más recetas / recetas de 4 ingredientes — ampliar el pool de comandas.
  - Source: 2026-10-16 · spec (§6 define 4 recetas de 3)
  - Rough size: S · Rough value: S

## Polish & juice

- [ ] Sprites pixel art reales (reemplazar formas) — milestone 06 vía `add-assets`.
- [ ] Audio procedural — milestone 06 vía `game-audio` (Web Audio, sin Strudel).
- [ ] Animaciones de cocción / humo verde / charco de aceite más expresivos — milestone 06 vía `design-game`.

## Tech & refactors

- [x] ~~Reponer el estado de partida al reconectar~~ — resuelto en el Milestone 02: `WELCOME` ahora incluye `mode`, y el loop difunde `STATE` a todos, así que el que reconecta entra directo a la partida. Test: `tests/e2e/movement.spec.js::reconectar con la partida en curso vuelve a la partida`.
  - Source: 2026-10-16 · Milestone 01 (nota)
  - Promovido: Milestone 02
- [ ] Interpolación con buffer de 2 ticks — suavizar el render del propio jugador si el lag molesta.
  - Source: 2026-10-16 · ADR 0002 (consecuencia negativa)
  - Rough size: S · Rough value: M
- [ ] ESLint + Prettier — cuando el código pase de ~1.5k líneas.

## Tooling & QA

- [ ] Runner E2E multi-contexto de 7 pestañas como script reutilizable — parte del QA de cada milestone multijugador.
- [ ] Test de reconexión / migración de host automatizado.
- [ ] E2E del aceite (spawn 30 s / charco / resbalón) — hoy sólo cubierto por unit tests (`tests/server/oil.test.js`); un e2e exigiría esperar 30 s reales o un hook de test para forzar el spawn.
  - Source: 2026-10-16 · Milestone 04
  - Rough size: S · Rough value: S

## Open questions

- (ninguna pendiente que bloquee el arranque)
