// =============================================================================
// tests/server/pantry.test.js — Milestone 03
// La despensa spawnea con cadencia y garantiza disponibilidad para las comandas.
// =============================================================================

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Game } from '../../server/game.js';
import { INGREDIENT_SPAWN_EVERY, MAX_FLOOR_INGREDIENTS, TICK_MS } from '../../shared/constants.js';

const DT = TICK_MS / 1000; // 0.05 s

function contar(ingredients) {
  const counts = {};
  for (const i of ingredients) counts[i.kind] = (counts[i.kind] || 0) + 1;
  return counts;
}

test('spawn y máximo 8', () => {
  const game = new Game({ rng: () => 0.5 });

  // Tras 1 s todavía no tocó el spawn por timer (sólo la disponibilidad inicial).
  for (let i = 0; i < Math.round(1 / DT); i += 1) game.step(DT);
  const n1 = game.ingredients.length;

  // Al llegar a 2 s aparece uno más.
  for (let i = 0; i < Math.round((INGREDIENT_SPAWN_EVERY - 1) / DT); i += 1) game.step(DT);
  assert.ok(
    game.ingredients.length >= n1 + 1,
    `debería spawnear al llegar a ${INGREDIENT_SPAWN_EVERY}s (antes ${n1}, ahora ${game.ingredients.length})`
  );

  // En 60 s nunca supera el máximo y lo alcanza.
  for (let i = 0; i < Math.round(60 / DT); i += 1) {
    game.step(DT);
    assert.ok(
      game.ingredients.length <= MAX_FLOOR_INGREDIENTS,
      `se pasó del máximo: ${game.ingredients.length}`
    );
  }
  assert.equal(game.ingredients.length, MAX_FLOOR_INGREDIENTS);
});

test('disponibilidad garantizada para cada comanda actual', () => {
  const game = new Game({ rng: () => 0.5 });

  for (let i = 0; i < Math.round(30 / DT); i += 1) {
    game.step(DT);
    const counts = contar(game.ingredients);

    for (const team of ['red', 'blue']) {
      const recipe = game.currentRecipe(team);
      for (const kind of recipe.ingredients) {
        assert.ok(
          (counts[kind] || 0) >= 1,
          `tick ${game.tick}: falta ${kind} para la comanda ${recipe.name} de ${team}`
        );
      }
    }
  }
});

test('si se lleva el único de un ingrediente necesario, reaparece', () => {
  const game = new Game({ rng: () => 0.5 });
  game.step(DT);

  // Las comandas actuales son Pizza (masa, tomate, queso) para ambos.
  const queso = game.ingredients.find((i) => i.kind === 'queso');
  assert.ok(queso, 'la disponibilidad inicial debería incluir los ingredientes de pizza');

  // Simular que alguien lo levanta.
  game.ingredients.splice(game.ingredients.indexOf(queso), 1);
  assert.equal(contar(game.ingredients).queso, undefined);

  game.step(DT);
  assert.ok(game.ingredients.some((i) => i.kind === 'queso'), 'debería reponer el queso faltante');
});

test('si el piso está lleno sólo de ingredientes necesarios y falta uno, igual hace lugar', () => {
  const game = new Game({ rng: () => 0.5 });
  game.step(DT);

  // Piso lleno (8) con SÓLO ingredientes necesarios y sin ningún queso:
  // el caso que rompe la garantía si "hacer lugar" no sabe sacar un duplicado.
  game.ingredients = [];
  for (let i = 0; i < 4; i += 1) game._pushIngredient('masa', 500, 220);
  for (let i = 0; i < 4; i += 1) game._pushIngredient('tomate', 780, 220);

  assert.equal(game.ingredients.length, MAX_FLOOR_INGREDIENTS);
  assert.equal(contar(game.ingredients).queso, undefined);

  game.step(DT);

  assert.ok(game.ingredients.some((i) => i.kind === 'queso'), 'debería reponer el queso');
  assert.ok(
    game.ingredients.length <= MAX_FLOOR_INGREDIENTS,
    `nunca debe pasarse del máximo (${game.ingredients.length})`
  );
});
