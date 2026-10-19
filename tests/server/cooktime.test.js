// =============================================================================
// tests/server/cooktime.test.js — Milestone 03
// Con equipos desparejos, el equipo MÁS CHICO cocina en 4 s y el grande en 5 s.
// =============================================================================

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Game } from '../../server/game.js';
import { COOK_SECONDS, COOK_SECONDS_SMALL_TEAM, TICK_MS } from '../../shared/constants.js';

const DT = TICK_MS / 1000;

/** Carga la receta actual del equipo, completa y en orden. */
function cargarReceta(game, team) {
  const recipe = game.currentRecipe(team);
  for (const kind of recipe.ingredients) {
    game.loadPot(team, kind);
  }
  return recipe;
}

function steps(seconds) {
  return Math.round(seconds / DT);
}

test('equipo chico cocina en 4 y el grande en 5 (4 vs 3)', () => {
  const game = new Game();
  for (let i = 0; i < 4; i += 1) game.addPlayer(`r${i}`, { name: `R${i}`, team: 'red' });
  for (let i = 0; i < 3; i += 1) game.addPlayer(`b${i}`, { name: `B${i}`, team: 'blue' });

  assert.equal(game.cookSecondsFor('red'), COOK_SECONDS, 'rojo (4) cocina en 5 s');
  assert.equal(game.cookSecondsFor('blue'), COOK_SECONDS_SMALL_TEAM, 'azul (3) cocina en 4 s');

  cargarReceta(game, 'red');
  cargarReceta(game, 'blue');
  assert.equal(game.pots.red.cooking, true);
  assert.equal(game.pots.blue.cooking, true);

  // A los 4 s: azul ya sirvió, rojo todavía no.
  for (let i = 0; i < steps(COOK_SECONDS_SMALL_TEAM); i += 1) game.step(DT);
  assert.equal(game.score.blue, 1, 'azul debería haber servido a los 4 s');
  assert.equal(game.score.red, 0, 'rojo no debería haber servido todavía');

  // A los 5 s: rojo también sirvió.
  for (let i = 0; i < steps(COOK_SECONDS - COOK_SECONDS_SMALL_TEAM); i += 1) game.step(DT);
  assert.equal(game.score.red, 1, 'rojo debería haber servido a los 5 s');
});

test('con equipos parejos ambos cocinan en 5', () => {
  const game = new Game();
  for (let i = 0; i < 2; i += 1) game.addPlayer(`r${i}`, { team: 'red' });
  for (let i = 0; i < 2; i += 1) game.addPlayer(`b${i}`, { team: 'blue' });

  assert.equal(game.cookSecondsFor('red'), COOK_SECONDS);
  assert.equal(game.cookSecondsFor('blue'), COOK_SECONDS);
});

test('al servir, suma 1 plato y sale la comanda siguiente', () => {
  const game = new Game();
  game.addPlayer('r1', { team: 'red' });
  game.addPlayer('b1', { team: 'blue' });

  const primera = game.currentRecipe('red');
  cargarReceta(game, 'red');

  for (let i = 0; i < steps(COOK_SECONDS); i += 1) game.step(DT);

  assert.equal(game.score.red, 1);
  assert.notEqual(game.currentRecipe('red').id, primera.id, 'debe avanzar la comanda');
  assert.deepEqual(game.pots.red.contents, [], 'la olla queda vacía para la próxima');
  assert.equal(game.pots.red.cooking, false);
});
