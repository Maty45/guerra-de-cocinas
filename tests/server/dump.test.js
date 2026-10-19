// =============================================================================
// tests/server/dump.test.js — Milestone 04
// Volcar (Espacio hold 2 s) la olla rival mientras cocina -> pierde el plato.
// Vaciar la olla propia (hold) limpia contaminación. El stun corta el volcado.
// =============================================================================

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Game } from '../../server/game.js';
import { HOLD_SECONDS, STUN_SECONDS, TICK_MS } from '../../shared/constants.js';

const DT = TICK_MS / 1000;
const steps = (s) => Math.round(s / DT);

/** Saboteador rojo junto a la olla azul (rival), que está cocinando. */
function setupRivalCocinando() {
  const g = new Game({ rng: () => 0.5 });
  const s = g.addPlayer('s', { name: 'S', team: 'red', x: 1110, y: 440 });
  for (const k of g.currentRecipe('blue').ingredients) g.loadPot('blue', k);
  return { g, s };
}

test('volcar pierde el plato', () => {
  const { g, s } = setupRivalCocinando();
  assert.equal(g.pots.blue.cooking, true);

  g.setAction('s', 'hold');
  assert.ok(s.dumping, 'arranca el volcado');

  // Antes de los 2 s, la olla sigue cocinando.
  for (let i = 0; i < steps(HOLD_SECONDS - 0.5); i += 1) g.step(DT);
  assert.equal(g.pots.blue.cooking, true, 'todavía no volcó');

  // Pasados los 2 s, perdió el plato.
  for (let i = 0; i < steps(0.6); i += 1) g.step(DT);
  assert.equal(g.pots.blue.cooking, false, 'se perdió la cocción');
  assert.deepEqual(g.pots.blue.contents, [], 'se perdió el plato');
  assert.equal(g.score.blue, 0, 'no llegó a sumar el plato');
  assert.equal(s.dumping, null, 'el volcado terminó');
});

test('stun corta el volcado', () => {
  const { g, s } = setupRivalCocinando();

  g.setAction('s', 'hold');
  for (let i = 0; i < steps(1); i += 1) g.step(DT);
  assert.ok(s.dumping, 'a mitad de volcado');

  g.stunPlayer('s', STUN_SECONDS);
  g.step(DT);
  assert.equal(s.dumping, null, 'el stun corta el volcado');

  // Aunque pase el tiempo, la olla rival sigue cocinando.
  for (let i = 0; i < steps(2); i += 1) g.step(DT);
  assert.ok(
    g.pots.blue.cooking || g.score.blue === 1,
    'la olla rival siguió cocinando (o terminó su plato)'
  );
});

test('volcar una olla que NO está cocinando no hace nada', () => {
  const g = new Game({ rng: () => 0.5 });
  const s = g.addPlayer('s', { name: 'S', team: 'red', x: 1110, y: 440 });
  g.loadPot('blue', 'queso'); // 1 ingrediente, no cocina

  g.setAction('s', 'hold');
  assert.equal(s.dumping, null, 'no arranca volcado si no cocina');

  for (let i = 0; i < steps(HOLD_SECONDS + 0.5); i += 1) g.step(DT);
  assert.equal(g.pots.blue.contents.length, 1, 'la olla rival queda igual');
});

test('vaciar la olla propia (hold) limpia la contaminación', () => {
  const g = new Game({ rng: () => 0.5 });
  const p = g.addPlayer('p', { name: 'P', team: 'red', x: 170, y: 440 }); // junto a la olla roja
  g.loadPot('red', 'carne'); // contamina la propia
  assert.equal(g.pots.red.contaminated, true);

  g.setAction('p', 'hold');
  for (let i = 0; i < steps(HOLD_SECONDS + 0.3); i += 1) g.step(DT);

  assert.equal(g.pots.red.contaminated, false, 'se limpió');
  assert.deepEqual(g.pots.red.contents, [], 'se perdió el contenido');
});
