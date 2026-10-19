// =============================================================================
// tests/server/movement.test.js — Milestone 02
// Movimiento autoritativo: velocidad constante por eje y límites del mapa.
// =============================================================================

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Game } from '../../server/game.js';
import {
  PLAYER_SPEED,
  PLAYER_RADIUS,
  GAME_WIDTH,
  GAME_HEIGHT,
  TICK_MS,
} from '../../shared/constants.js';

const DT = TICK_MS / 1000; // 0.05 s

test('un jugador se mueve a velocidad constante', () => {
  const game = new Game();
  game.addPlayer('p1', { name: 'Ana', team: 'red', x: 100, y: 360 });

  game.setInput('p1', { right: true });
  const steps = 20; // 1 segundo
  for (let i = 0; i < steps; i += 1) game.step(DT);

  const p = game.getPlayer('p1');
  const esperado = PLAYER_SPEED * (steps * DT);
  assert.ok(
    Math.abs(p.x - (100 + esperado)) < 0.5,
    `se esperaba x≈${100 + esperado}, fue ${p.x}`
  );
  assert.equal(p.y, 360, 'no debe moverse en el eje Y sin input vertical');
});

test('sin input, el jugador no se mueve', () => {
  const game = new Game();
  game.addPlayer('p1', { name: 'Ana', team: 'red', x: 200, y: 300 });
  for (let i = 0; i < 20; i += 1) game.step(DT);
  const p = game.getPlayer('p1');
  assert.equal(p.x, 200);
  assert.equal(p.y, 300);
});

test('el movimiento diagonal no es más rápido que el recto', () => {
  const recto = new Game();
  recto.addPlayer('a', { name: 'A', team: 'red', x: 200, y: 360 });
  recto.setInput('a', { right: true });
  for (let i = 0; i < 20; i += 1) recto.step(DT);
  const distRecto = recto.getPlayer('a').x - 200;

  const diag = new Game();
  diag.addPlayer('b', { name: 'B', team: 'red', x: 200, y: 360 });
  diag.setInput('b', { right: true, down: true });
  for (let i = 0; i < 20; i += 1) diag.step(DT);
  const b = diag.getPlayer('b');
  const distDiag = Math.hypot(b.x - 200, b.y - 360);

  assert.ok(Math.abs(distDiag - distRecto) < 1, 'la diagonal debe recorrer lo mismo');
});

test('el jugador se detiene en el borde del mapa', () => {
  const game = new Game();
  game.addPlayer('p1', { name: 'Ana', team: 'blue', x: GAME_WIDTH - 60, y: 360 });

  game.setInput('p1', { right: true });
  for (let i = 0; i < 60; i += 1) game.step(DT); // 3 s, más que suficiente

  const p = game.getPlayer('p1');
  assert.ok(p.x <= GAME_WIDTH - PLAYER_RADIUS + 0.001, `x=${p.x} se pasó del borde derecho`);
  assert.ok(Math.abs(p.x - (GAME_WIDTH - PLAYER_RADIUS)) < 0.5, 'debe quedar pegado al borde');

  // Borde inferior.
  game.addPlayer('p2', { name: 'Beto', team: 'blue', x: 640, y: GAME_HEIGHT - 60 });
  game.setInput('p2', { down: true });
  for (let i = 0; i < 60; i += 1) game.step(DT);
  const q = game.getPlayer('p2');
  assert.ok(q.y <= GAME_HEIGHT - PLAYER_RADIUS + 0.001, `y=${q.y} se pasó del borde inferior`);
});

test('el estado del jugador aparece en el snapshot', () => {
  const game = new Game();
  game.addPlayer('p1', { name: 'Ana', team: 'red', x: 10, y: 20 });
  game.setInput('p1', { right: true });
  game.step(DT);

  const snap = game.snapshot();
  const p = snap.players.p1;
  assert.equal(p.name, 'Ana');
  assert.equal(p.team, 'red');
  assert.equal(typeof p.x, 'number');
  assert.equal(typeof p.y, 'number');
  assert.equal(typeof snap.t, 'number');
});
