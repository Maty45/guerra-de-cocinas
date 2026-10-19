// =============================================================================
// tests/server/steal.test.js — Milestone 04
// Robar de la olla rival: sólo con las manos vacías y si NO está cocinando.
// =============================================================================

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Game } from '../../server/game.js';

/** Ladrón rojo parado junto a la olla azul (rival). */
function setup() {
  const g = new Game({ rng: () => 0.5 });
  const thief = g.addPlayer('t', { name: 'T', team: 'red', x: 1110, y: 440 });
  return { g, thief };
}

test('robar solo si no cocina', () => {
  const { g, thief } = setup();
  const recetaAzul = g.currentRecipe('blue');
  g.loadPot('blue', recetaAzul.ingredients[0]);
  assert.equal(g.pots.blue.contents.length, 1);
  assert.equal(g.pots.blue.cooking, false);

  g.setAction('t', 'tap');

  assert.equal(thief.carrying, recetaAzul.ingredients[0], 'se lleva el último ingrediente puesto');
  assert.equal(g.pots.blue.contents.length, 0, 'la olla rival queda sin ese ingrediente');

  // Con la olla COCINANDO no se puede robar.
  const { g: g2, thief: t2 } = setup();
  for (const k of g2.currentRecipe('blue').ingredients) g2.loadPot('blue', k);
  assert.equal(g2.pots.blue.cooking, true);

  g2.setAction('t', 'tap');

  assert.equal(t2.carrying, null, 'no se roba de una olla que está cocinando');
  assert.equal(g2.pots.blue.contents.length, 3, 'la olla rival sigue intacta');
});

test('robar requiere manos vacías (con algo en la mano contamina en vez de robar)', () => {
  const { g, thief } = setup();
  g.loadPot('blue', 'queso'); // pizza lleva queso
  thief.carrying = 'carne';   // ajeno a la pizza -> contamina

  g.setAction('t', 'tap');

  assert.equal(g.pots.blue.contents.length, 2, 'no roba: mete lo que lleva');
  assert.equal(g.pots.blue.contaminated, true, 'y la olla rival queda contaminada');
  assert.equal(thief.carrying, null, 'entregó lo que llevaba');
});

test('lejos de la olla rival el tap no roba', () => {
  const g = new Game({ rng: () => 0.5 });
  const thief = g.addPlayer('t', { name: 'T', team: 'red', x: 640, y: 360 }); // despensa
  g.loadPot('blue', 'queso');

  g.setAction('t', 'tap');

  assert.equal(thief.carrying, null, 'no roba a distancia');
  assert.equal(g.pots.blue.contents.length, 1, 'la olla rival no cambia');
});
