// =============================================================================
// tests/server/collision.test.js — Milestone 02
// Colisiones autoritativas: jugadores entre sí y jugadores contra mesadas.
// =============================================================================

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Game } from '../../server/game.js';
import { circleIntersectsRect } from '../../server/geometry.js';
import { MAP } from '../../shared/map.js';
import { PLAYER_RADIUS, TICK_MS } from '../../shared/constants.js';

const DT = TICK_MS / 1000;

test('dos jugadores que van de frente no se solapan', () => {
  const game = new Game();
  game.addPlayer('p1', { name: 'Ana', team: 'red', x: 450, y: 200 });
  game.addPlayer('p2', { name: 'Beto', team: 'blue', x: 750, y: 200 });

  game.setInput('p1', { right: true });
  game.setInput('p2', { left: true });
  for (let i = 0; i < 40; i += 1) game.step(DT); // 2 s

  const a = game.getPlayer('p1');
  const b = game.getPlayer('p2');
  const dist = Math.hypot(a.x - b.x, a.y - b.y);

  assert.ok(
    dist >= 2 * PLAYER_RADIUS - 0.5,
    `quedaron solapados: distancia=${dist}, mínimo=${2 * PLAYER_RADIUS}`
  );
  assert.ok(a.x < b.x, 'no se atravesaron');
});

test('un jugador no atraviesa una mesada', () => {
  const counter = MAP.counters.find((c) => c.id === 'center') ?? MAP.counters[0];
  const cx = counter.x + counter.w / 2;

  const game = new Game();
  // Arranca arriba de la mesada y camina hacia abajo.
  game.addPlayer('p1', { name: 'Ana', team: 'red', x: cx, y: counter.y - PLAYER_RADIUS - 60 });

  game.setInput('p1', { down: true });
  for (let i = 0; i < 60; i += 1) game.step(DT); // 3 s

  const p = game.getPlayer('p1');
  assert.equal(
    circleIntersectsRect(p.x, p.y, PLAYER_RADIUS, counter),
    false,
    `quedó dentro de la mesada: (${p.x}, ${p.y})`
  );
  assert.ok(
    p.y <= counter.y - PLAYER_RADIUS + 0.5,
    `debería haberse frenado arriba de la mesada (y=${p.y}, tope=${counter.y})`
  );
});

test('un jugador puede pasar por al lado de una mesada', () => {
  const counter = MAP.counters.find((c) => c.id === 'center') ?? MAP.counters[0];
  const game = new Game();
  // Camina por debajo de la mesada, sin tocarla.
  const y = counter.y + counter.h + PLAYER_RADIUS + 30;
  game.addPlayer('p1', { name: 'Ana', team: 'red', x: counter.x - 100, y });

  game.setInput('p1', { right: true });
  for (let i = 0; i < 40; i += 1) game.step(DT);

  const p = game.getPlayer('p1');
  assert.ok(p.x > counter.x + counter.w, 'debería haber pasado de largo');
  assert.equal(circleIntersectsRect(p.x, p.y, PLAYER_RADIUS, counter), false);
});
