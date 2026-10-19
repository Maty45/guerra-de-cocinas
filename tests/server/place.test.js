// =============================================================================
// tests/server/place.test.js — Milestone 06 (hook de test)
//
// `placePlayer` es el hook que usa el E2E para posicionar jugadores sin
// caminar (baja muchísimo el costo de los tests). Acá verificamos que mueve,
// limpia el input y no toca el resto del estado del jugador.
// =============================================================================

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Game } from '../../server/game.js';

test('placePlayer mueve al jugador y corta el input', () => {
  const game = new Game();
  game.addPlayer('p1', { name: 'Ana', team: 'red', x: 100, y: 200 });

  game.setInput('p1', { right: true, down: true });
  game.placePlayer('p1', 640, 300);

  const p = game.getPlayer('p1');
  assert.equal(p.x, 640);
  assert.equal(p.y, 300);
  assert.deepEqual(p.input, { up: false, down: false, left: false, right: false });
});

test('placePlayer conserva lo que el jugador lleva en la mano', () => {
  const game = new Game();
  game.addPlayer('p1', { name: 'Ana', team: 'red', x: 100, y: 200 });
  game.getPlayer('p1').carrying = 'masa';

  game.placePlayer('p1', 500, 300);
  assert.equal(game.getPlayer('p1').carrying, 'masa');
});

test('placePlayer con un id inexistente no rompe', () => {
  const game = new Game();
  assert.equal(game.placePlayer('nadie', 10, 10), null);
});
