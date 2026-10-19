// =============================================================================
// tests/server/recipes.test.js — Milestone 03
// Las 4 recetas y la secuencia de comandas COMPARTIDA entre equipos.
// =============================================================================

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { RECIPES, RECIPE_BY_ID, INGREDIENT_KINDS, ORDER_SEQUENCE, recipeForOrder } from '../../server/recipes.js';
import { Game } from '../../server/game.js';
import { INGREDIENTS_PER_RECIPE } from '../../shared/constants.js';

test('hay 4 recetas y todas tienen 3 ingredientes distintos', () => {
  assert.equal(RECIPES.length, 4);
  for (const r of RECIPES) {
    assert.equal(r.ingredients.length, INGREDIENTS_PER_RECIPE, `${r.name} debe tener 3 ingredientes`);
    assert.equal(new Set(r.ingredients).size, r.ingredients.length, `${r.name} no debe repetir ingredientes`);
  }
});

test('las recetas son las del gameplan', () => {
  assert.deepEqual(RECIPE_BY_ID.pizza.ingredients, ['masa', 'tomate', 'queso']);
  assert.deepEqual(RECIPE_BY_ID.hamburguesa.ingredients, ['pan', 'carne', 'lechuga']);
  assert.deepEqual(RECIPE_BY_ID.tortilla.ingredients, ['papa', 'huevo', 'queso']);
  assert.deepEqual(RECIPE_BY_ID.ensalada.ingredients, ['lechuga', 'tomate', 'huevo']);
});

test('hay 8 ingredientes distintos en total', () => {
  assert.equal(INGREDIENT_KINDS.length, 8);
});

test('comandas iguales: ambos equipos arrancan con la misma receta', () => {
  const game = new Game();
  assert.equal(game.currentRecipe('red').id, game.currentRecipe('blue').id);
  assert.equal(game.currentRecipe('red').id, ORDER_SEQUENCE[0]);
});

test('comandas iguales: la secuencia es la misma para los dos equipos', () => {
  const game = new Game();
  // Avanzar el índice de un equipo no cambia la secuencia del otro.
  game.orders.red = 2;

  assert.equal(game.currentRecipe('red').id, ORDER_SEQUENCE[2]);
  assert.equal(game.currentRecipe('blue').id, ORDER_SEQUENCE[0]);

  // Y la receta de un índice dado es la misma sin importar el equipo.
  assert.equal(recipeForOrder(1).id, ORDER_SEQUENCE[1]);
  assert.deepEqual(recipeForOrder(1), recipeForOrder(1));
});

test('la secuencia de comandas es cíclica', () => {
  const n = ORDER_SEQUENCE.length;
  assert.equal(recipeForOrder(n).id, recipeForOrder(0).id);
  assert.equal(recipeForOrder(n + 1).id, recipeForOrder(1).id);
});
