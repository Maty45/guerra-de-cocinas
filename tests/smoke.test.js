// Smoke test del scaffold: valida que las constantes compartidas cargan bien
// en Node y que los valores base del spec están presentes y son coherentes.
// (Los tests de juego reales viven en los milestones 01+.)

import { test } from 'node:test';
import assert from 'node:assert/strict';

import * as C from '../shared/constants.js';

test('las constantes de partida siguen el spec (§8)', () => {
  assert.equal(C.MATCH_SECONDS, 300);
  assert.equal(C.TICK_RATE, 20);
  assert.equal(C.COOK_SECONDS, 5);
  assert.equal(C.COOK_SECONDS_SMALL_TEAM, 4);
  assert.equal(C.HOLD_SECONDS, 2);
  assert.equal(C.TOMATO_COOLDOWN, 3);
  assert.equal(C.STUN_SECONDS, 1.5);
  assert.equal(C.OIL_SPAWN_EVERY, 30);
  assert.equal(C.OIL_PUDDLE_SECONDS, 10);
  assert.equal(C.SLIP_SECONDS, 1);
  assert.equal(C.INGREDIENT_SPAWN_EVERY, 2);
  assert.equal(C.MAX_FLOOR_INGREDIENTS, 8);
});

test('el mapa y la red tienen valores coherentes', () => {
  assert.equal(C.GAME_WIDTH, 1280);
  assert.equal(C.GAME_HEIGHT, 720);
  assert.equal(C.TICK_MS, 1000 / C.TICK_RATE);
  assert.equal(C.DEFAULT_PORT, 3000);
  assert.equal(C.WS_PATH, '/ws');
  assert.ok(C.MIN_PLAYERS >= 2);
  assert.ok(C.EXPECTED_PLAYERS >= C.MIN_PLAYERS);
});

test('las constantes no tocan el DOM (deben cargar en Node)', () => {
  // Si este archivo importa sin explotar, no referencia window/document.
  assert.equal(typeof globalThis.window, 'undefined');
});
