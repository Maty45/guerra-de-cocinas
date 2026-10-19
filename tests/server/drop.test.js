// =============================================================================
// tests/server/drop.test.js — Milestone 03/06
// Soltar un ingrediente con Espacio tiene que funcionar SIEMPRE, incluso con la
// despensa llena (bug reportado: quedabas pegado al ingrediente).
// =============================================================================

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Game } from '../../server/game.js';
import { MAX_FLOOR_INGREDIENTS, POT_RADIUS, TICK_MS } from '../../shared/constants.js';
import { POTS } from '../../shared/map.js';

const DT = TICK_MS / 1000;

/** Deja la despensa llena. */
function llenarDespensa(game) {
  for (let i = 0; i < Math.round(60 / DT); i += 1) game.step(DT);
  assert.equal(game.ingredients.length, MAX_FLOOR_INGREDIENTS);
}

test('soltar un ingrediente funciona con la despensa llena', () => {
  const game = new Game({ rng: () => 0.5 });
  llenarDespensa(game);

  const kind = game.ingredients[0].kind;
  const x = 400;
  const y = 300;
  const p = game.addPlayer('p', { name: 'P', team: 'red', x, y });
  p.carrying = kind;

  game.setAction('p', 'tap');

  assert.equal(p.carrying, null, 'el tap debe vaciar la mano');
  const soltado = game.ingredients.find(
    (i) => i.kind === kind && Math.abs(i.x - x) < 20 && Math.abs(i.y - y) < 20
  );
  assert.ok(soltado, 'el ingrediente queda en el piso, donde se soltó');
  assert.ok(
    game.ingredients.length <= MAX_FLOOR_INGREDIENTS + 1,
    `a lo sumo un ítem extra (${game.ingredients.length})`
  );
});

test('soltar cerca de la olla propia la carga en vez de tirarla', () => {
  const game = new Game({ rng: () => 0.5 });
  llenarDespensa(game);

  const pot = POTS.red;
  const p = game.addPlayer('p', {
    name: 'P',
    team: 'red',
    x: pot.x + POT_RADIUS + 10,
    y: pot.y,
  });
  const kind = game.currentRecipe('red').ingredients[0];
  p.carrying = kind;

  game.setAction('p', 'tap');

  assert.equal(p.carrying, null);
  assert.ok(
    game.pots.red.contents.includes(kind),
    'cargó el ingrediente en la olla propia'
  );
});
