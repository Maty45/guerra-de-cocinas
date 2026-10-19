// =============================================================================
// tests/fx.test.js — Milestone 06 (juice)
// Detección PURA de eventos visuales comparando dos snapshots del servidor.
// =============================================================================

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { diffFx } from '../src/core/fx.js';

const pot = (over = {}) => ({
  contents: [],
  contaminated: false,
  cooking: false,
  progress: 0,
  x: 110,
  y: 440,
  ...over,
});

const snap = (over = {}) => ({
  score: { red: 0, blue: 0 },
  pots: { red: pot(), blue: pot({ x: 1170 }) },
  players: {},
  tomatoes: [],
  ...over,
});

test('sin snapshot anterior no hay eventos', () => {
  assert.deepEqual(diffFx(null, snap()), []);
  assert.deepEqual(diffFx(snap(), null), []);
});

test('sin cambios no hay eventos', () => {
  assert.deepEqual(diffFx(snap(), snap()), []);
});

test('un plato servido emite serve con la posición de la olla', () => {
  const prev = snap({ pots: { red: pot({ contents: ['masa'] }), blue: pot({ x: 1170 }) } });
  const next = snap({ score: { red: 1, blue: 0 }, pots: { red: pot(), blue: pot({ x: 1170 }) } });
  const fx = diffFx(prev, next);
  assert.equal(fx.length, 1);
  assert.equal(fx[0].type, 'serve');
  assert.equal(fx[0].team, 'red');
  assert.equal(fx[0].text, '+1');
  assert.equal(fx[0].x, 110);
  assert.equal(fx[0].y, 440);
});

test('vaciar la olla sin sumar plato emite tip', () => {
  const prev = snap({ pots: { red: pot({ contents: ['masa', 'queso'], cooking: true }), blue: pot({ x: 1170 }) } });
  const next = snap({ pots: { red: pot(), blue: pot({ x: 1170 }) } });
  const fx = diffFx(prev, next);
  assert.equal(fx.length, 1);
  assert.equal(fx[0].type, 'tip');
});

test('contaminar emite contaminate', () => {
  const prev = snap();
  const next = snap({ pots: { red: pot({ contaminated: true }), blue: pot({ x: 1170 }) } });
  const fx = diffFx(prev, next);
  assert.deepEqual(fx.map((e) => e.type), ['contaminate']);
});

test('arrancar la cocción emite cookstart', () => {
  const prev = snap();
  const next = snap({ pots: { red: pot({ contents: ['masa'], cooking: true }), blue: pot({ x: 1170 }) } });
  const fx = diffFx(prev, next);
  assert.deepEqual(fx.map((e) => e.type), ['cookstart']);
});

test('un tomate que desaparece emite splash donde estaba', () => {
  const prev = snap({ tomatoes: [{ id: 't1', x: 400, y: 300, team: 'red' }] });
  const next = snap();
  const fx = diffFx(prev, next);
  assert.equal(fx.length, 1);
  assert.equal(fx[0].type, 'splash');
  assert.equal(fx[0].x, 400);
  assert.equal(fx[0].y, 300);
});

test('aturdir y resbalar emiten impacto / resbalón', () => {
  const prev = snap({ players: { p1: { x: 10, y: 20, stunned: 0, slipping: 0 } } });
  const next = snap({ players: { p1: { x: 10, y: 20, stunned: 1.5, slipping: 1 } } });
  const fx = diffFx(prev, next);
  assert.deepEqual(fx.map((e) => e.type).sort(), ['impact', 'slip']);
});
