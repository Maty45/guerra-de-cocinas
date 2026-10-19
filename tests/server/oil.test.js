// =============================================================================
// tests/server/oil.test.js — Milestone 04
// Aceite: aparece en el centro cada 30 s, deja un charco que dura 10 s y quien
// lo pisa resbala 1 s sin control. Ocupa la mano.
// =============================================================================

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Game } from '../../server/game.js';
import { OIL_SPAWN } from '../../shared/map.js';
import {
  OIL_SPAWN_EVERY,
  OIL_PUDDLE_SECONDS,
  SLIP_SECONDS,
  TICK_MS,
} from '../../shared/constants.js';

const DT = TICK_MS / 1000;
const steps = (s) => Math.round(s / DT);

test('spawn y duración', () => {
  const g = new Game({ rng: () => 0.5 });
  assert.equal(g.oilItem, null, 'no hay aceite al arrancar');

  for (let i = 0; i < steps(OIL_SPAWN_EVERY); i += 1) g.step(DT);
  assert.ok(g.oilItem, `debería aparecer a los ${OIL_SPAWN_EVERY}s`);
  assert.equal(g.oilItem.x, OIL_SPAWN.x, 'aparece en el centro (x)');
  assert.equal(g.oilItem.y, OIL_SPAWN.y, 'aparece en el centro (y)');

  // Levantarlo ocupa la mano y lo saca del piso.
  const p = g.addPlayer('p', { name: 'P', team: 'red', x: g.oilItem.x, y: g.oilItem.y });
  g.setAction('p', 'tap');
  assert.equal(p.carrying, 'aceite', 'el aceite ocupa la mano');
  assert.equal(g.oilItem, null, 'ya no está en el piso');

  // Soltarlo deja un charco que dura 10 s.
  g.setAction('p', 'tap');
  assert.equal(p.carrying, null);
  assert.equal(g.puddles.length, 1, 'debería dejar un charco');

  for (let i = 0; i < steps(OIL_PUDDLE_SECONDS - 0.5); i += 1) g.step(DT);
  assert.equal(g.puddles.length, 1, 'el charco todavía no se secó');

  for (let i = 0; i < steps(0.7); i += 1) g.step(DT);
  assert.equal(g.puddles.length, 0, 'el charco se secó');
});

test('resbalón 1s', () => {
  const g = new Game({ rng: () => 0.5 });
  const p = g.addPlayer('p', { name: 'P', team: 'red', x: 400, y: 360 });

  // Se mueve hacia la derecha.
  g.setInput('p', { right: true });
  for (let i = 0; i < steps(0.2); i += 1) g.step(DT);
  const xAntes = p.x;

  // Pisa un charco.
  g.puddles.push({ id: 'x1', x: p.x, y: p.y, remaining: OIL_PUDDLE_SECONDS });
  g.step(DT);
  assert.ok(p.slipping > 0, 'pisa el charco y resbala ~1 s');

  // Durante el resbalón el input se ignora: sigue deslizando hacia la derecha.
  g.setInput('p', { left: true });
  for (let i = 0; i < steps(SLIP_SECONDS - 0.3); i += 1) g.step(DT);
  assert.ok(p.x > xAntes, 'sigue deslizando hacia la derecha (sin control)');

  // Al terminar el resbalón, vuelve a responder al input.
  g.puddles = []; // sacar el charco para no volver a pisarlo en el test
  const xResbalon = p.x;
  for (let i = 0; i < steps(0.5); i += 1) g.step(DT);
  assert.equal(p.slipping, 0, 'el resbalón termina');
  assert.ok(p.x < xResbalon, 'recuperó el control y va hacia la izquierda (input)');
});
