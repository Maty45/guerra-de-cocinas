// =============================================================================
// tests/pot.test.js — Milestone 03
//
// Lógica de la olla PURA (sin red, sin navegador) — requisito §11 del spec.
//   - los 3 correctos en cualquier orden -> cocinando (matching por CONJUNTO)
//   - ingrediente equivocado -> contaminada
//   - ingrediente repetido -> contaminada
//   - empty() limpia la contaminación y pierde el contenido
//   - SANITY: un matcher roto (que no exige el conjunto correcto) hace FALLAR
//     la aserción -> prueba que el test detecta el bug.
// =============================================================================

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createPot, insert, empty, matchesRecipe, advance, progress } from '../server/pot.js';
import { RECIPES } from '../server/recipes.js';
import { COOK_SECONDS } from '../shared/constants.js';

const PIZZA = RECIPES.find((r) => r.id === 'pizza');
const HAMBURGUESA = RECIPES.find((r) => r.id === 'hamburguesa');
const TORTILLA = RECIPES.find((r) => r.id === 'tortilla');
const ENSALADA = RECIPES.find((r) => r.id === 'ensalada');

// --- Aserciones reutilizables (matcher inyectable para el test de sanidad) ---
function esperarCocina(pot, recipe, matcher = matchesRecipe) {
  assert.ok(pot.cooking, `la olla debería estar cocinando ${recipe.name}`);
  assert.equal(
    matcher(pot.contents, recipe.ingredients),
    true,
    `[${pot.contents}] debería matchear ${recipe.name}`
  );
}

function esperarNoCocina(pot, recipe, matcher = matchesRecipe) {
  assert.equal(
    matcher(pot.contents, recipe.ingredients),
    false,
    `[${pot.contents}] NO debería matchear ${recipe.name}`
  );
}

// Un matcher deliberadamente ROTO: dice que cualquier contenido matchea.
const brokenMatcher = () => true;

// ---------------------------------------------------------------------------

test('receta correcta cocina (los 3 en orden)', () => {
  const pot = createPot('red');
  for (const kind of PIZZA.ingredients) {
    insert(pot, kind, PIZZA.ingredients, COOK_SECONDS);
  }
  assert.equal(pot.contaminated, false);
  esperarCocina(pot, PIZZA);
  assert.equal(pot.cookRemaining, COOK_SECONDS);
});

test('receta correcta cocina en cualquier orden (matching por conjunto)', () => {
  // Todas las recetas, con su lista de ingredientes invertida.
  for (const recipe of [PIZZA, HAMBURGUESA, TORTILLA, ENSALADA]) {
    const pot = createPot();
    const desordenados = [...recipe.ingredients].reverse();
    for (const kind of desordenados) {
      insert(pot, kind, recipe.ingredients, COOK_SECONDS);
    }
    assert.equal(pot.contaminated, false, `${recipe.name} no debería contaminarse`);
    esperarCocina(pot, recipe);
  }
});

test('ingrediente equivocado contamina y no cocina', () => {
  const pot = createPot('red');
  insert(pot, PIZZA.ingredients[0], PIZZA.ingredients, COOK_SECONDS);
  insert(pot, PIZZA.ingredients[1], PIZZA.ingredients, COOK_SECONDS);
  // En vez del 3º correcto, mete uno ajeno a la receta.
  insert(pot, 'carne', PIZZA.ingredients, COOK_SECONDS);

  assert.equal(pot.contaminated, true);
  assert.equal(pot.cooking, false);
  esperarNoCocina(pot, PIZZA);
});

test('ingrediente repetido contamina (tomate x2 en pizza)', () => {
  const pot = createPot('red');
  insert(pot, 'masa', PIZZA.ingredients, COOK_SECONDS);
  insert(pot, 'tomate', PIZZA.ingredients, COOK_SECONDS);
  insert(pot, 'tomate', PIZZA.ingredients, COOK_SECONDS); // repetido

  assert.equal(pot.contaminated, true);
  assert.equal(pot.cooking, false);
  esperarNoCocina(pot, PIZZA);
});

test('una olla contaminada no acepta más ingredientes', () => {
  const pot = createPot();
  insert(pot, 'carne', PIZZA.ingredients, COOK_SECONDS); // ajeno -> contamina
  assert.equal(pot.contaminated, true);

  const res = insert(pot, 'masa', PIZZA.ingredients, COOK_SECONDS);
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'contaminated');
  assert.equal(pot.contents.length, 1, 'no debe cambiar el contenido');
});

test('vaciar limpia la contaminación y se pierde el contenido', () => {
  const pot = createPot('blue');
  insert(pot, 'carne', PIZZA.ingredients, COOK_SECONDS); // contamina
  assert.equal(pot.contaminated, true);

  empty(pot);

  assert.equal(pot.contaminated, false);
  assert.equal(pot.cooking, false);
  assert.deepEqual(pot.contents, []);
  assert.equal(pot.cookRemaining, 0);

  // Y queda usable de nuevo.
  for (const kind of PIZZA.ingredients) insert(pot, kind, PIZZA.ingredients, COOK_SECONDS);
  esperarCocina(pot, PIZZA);
});

test('una olla que ya está cocinando no acepta más ingredientes', () => {
  const pot = createPot();
  for (const kind of PIZZA.ingredients) insert(pot, kind, PIZZA.ingredients, COOK_SECONDS);
  const res = insert(pot, 'masa', PIZZA.ingredients, COOK_SECONDS);
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'cooking');
});

test('advance() cuenta el tiempo de cocción y avisa cuando termina', () => {
  const pot = createPot();
  for (const kind of PIZZA.ingredients) insert(pot, kind, PIZZA.ingredients, COOK_SECONDS);

  let terminado = false;
  const pasos = Math.round(COOK_SECONDS / 0.05);
  for (let i = 0; i < pasos; i += 1) {
    terminado = advance(pot, 0.05);
  }
  assert.equal(terminado, true, `debería terminar tras ${COOK_SECONDS}s`);

  // Recién armado, el progreso es 0; a mitad de cocción, ~0.5.
  const pot2 = createPot();
  for (const kind of PIZZA.ingredients) insert(pot2, kind, PIZZA.ingredients, 10);
  assert.equal(progress(pot2), 0);
  advance(pot2, 5);
  assert.ok(Math.abs(progress(pot2) - 0.5) < 0.01, `progress=${progress(pot2)}`);
});

test('contaminar olla rival', () => {
  // La olla propia va bien; a la rival (equipo opuesto) le metemos algo ajeno.
  const propia = createPot('red');
  const rival = createPot('blue');
  insert(propia, PIZZA.ingredients[0], PIZZA.ingredients, COOK_SECONDS);
  insert(propia, PIZZA.ingredients[1], PIZZA.ingredients, COOK_SECONDS);

  const res = insert(rival, 'carne', PIZZA.ingredients, COOK_SECONDS);

  assert.equal(res.ok, true, 'el sabotaje entra');
  assert.equal(rival.contaminated, true, 'la olla rival queda contaminada');
  assert.equal(rival.cooking, false);
  assert.equal(propia.contaminated, false, 'la olla propia no se toca');
});

test('SANITY — el test detecta un matcher roto', () => {
  const pot = createPot();
  insert(pot, 'masa', PIZZA.ingredients, COOK_SECONDS);
  insert(pot, 'masa', PIZZA.ingredients, COOK_SECONDS); // repetido -> NO cocina

  assert.equal(pot.cooking, false, 'la olla no debería estar cocinando');

  // Con el matcher real, la aserción pasa (correctamente detecta que no matchea)...
  assert.doesNotThrow(() => esperarNoCocina(pot, PIZZA));

  // ...pero con un matcher roto (que "matchea todo") la aserción DEBE fallar.
  // Si esto no fallara, el test de "receta correcta" sería inútil.
  assert.throws(
    () => esperarNoCocina(pot, PIZZA, brokenMatcher),
    'un matcher que ignora el conjunto debe hacer fallar la aserción'
  );
});
