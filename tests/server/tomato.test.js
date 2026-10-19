// =============================================================================
// tests/server/tomato.test.js — Milestone 04
// Tomatazo (E): aturde 1,5 s, hace soltar lo que lleva, SIN fuego amigo,
// con enfriamiento de 3 s. Lógica pura del servidor (sin navegador).
// =============================================================================

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Game } from '../../server/game.js';
import { TOMATO_COOLDOWN, STUN_SECONDS, TICK_MS } from '../../shared/constants.js';

const DT = TICK_MS / 1000;
const steps = (s) => Math.round(s / DT);

/** A (rojo) mira a la derecha; B (azul) está a 200 unidades a la derecha. */
function setup() {
  const g = new Game({ rng: () => 0.5 });
  const a = g.addPlayer('a', { name: 'A', team: 'red', x: 200, y: 300 });
  const b = g.addPlayer('b', { name: 'B', team: 'blue', x: 400, y: 300 });
  a.dir = { x: 1, y: 0 };
  return { g, a, b };
}

const ids = (g) => g.tomatoes.map((t) => t.id).join(',');

test('aturde y suelta', () => {
  const { g, a, b } = setup();
  b.carrying = 'masa';

  g.setAction('a', 'throw');
  assert.equal(g.tomatoes.length, 1, 'debería crear un tomate');

  // Avanzar hasta el impacto.
  let impacto = -1;
  for (let i = 0; i < steps(1); i += 1) {
    g.step(DT);
    if (b.stunned > 0) {
      impacto = i;
      break;
    }
  }

  assert.ok(impacto >= 0, 'el tomate debería impactar a B');
  assert.ok(b.stunned > STUN_SECONDS - 0.2, `B aturdido ~${STUN_SECONDS}s (stun=${b.stunned})`);
  assert.equal(b.carrying, null, 'B debería soltar lo que llevaba');
  assert.equal(a.tomatoesHit, 1, 'el tomatazo acertado se contabiliza');
  assert.equal(g.tomatoes.length, 0, 'el tomate se consume al impactar');
});

test('sin fuego amigo', () => {
  const g = new Game({ rng: () => 0.5 });
  const a = g.addPlayer('a', { name: 'A', team: 'red', x: 200, y: 300 });
  const mate = g.addPlayer('m', { name: 'M', team: 'red', x: 320, y: 300 }); // en el camino
  const enem = g.addPlayer('e', { name: 'E', team: 'blue', x: 500, y: 300 });
  a.dir = { x: 1, y: 0 };

  g.setAction('a', 'throw');
  for (let i = 0; i < steps(1); i += 1) g.step(DT);

  assert.equal(mate.stunned, 0, 'al compañero lo atraviesa (no lo aturde)');
  assert.ok(enem.stunned > 0, 'al rival sí lo aturde');
});

test('enfriamiento 3s', () => {
  const { g, a } = setup();

  g.setAction('a', 'throw');
  assert.ok(a.tomatoCooldown > 0, 'queda en enfriamiento');
  const ids1 = ids(g);

  g.setAction('a', 'throw');
  assert.equal(ids(g), ids1, 'no puede tirar otro tomate durante el enfriamiento');

  for (let i = 0; i < steps(TOMATO_COOLDOWN + 0.1); i += 1) g.step(DT);
  assert.equal(a.tomatoCooldown, 0, 'el enfriamiento se agota');

  g.setAction('a', 'throw');
  assert.notEqual(ids(g), ids1, 'tras el enfriamiento sí sale un tomate nuevo');
});

test('vuelve en la dirección en la que mira el personaje', () => {
  const g = new Game({ rng: () => 0.5 });
  const a = g.addPlayer('a', { name: 'A', team: 'red', x: 400, y: 300 });
  a.dir = { x: 0, y: 1 }; // mira hacia abajo

  g.setAction('a', 'throw');
  const t = g.tomatoes[0];
  assert.ok(t, 'debería haber un tomate');
  assert.ok(t.vy > 0, 'debería ir hacia abajo');
  assert.equal(Math.round(t.vx), 0, 'sin componente horizontal');
});
