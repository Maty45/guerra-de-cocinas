// =============================================================================
// tests/audio/cues.test.js — Milestone 06 (audio)
// La detección de cues de audio es lógica pura: dos snapshots -> qué suena.
// =============================================================================

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { diffCues } from '../../src/audio/cues.js';

const base = () => ({
  score: { red: 0, blue: 0 },
  tomatoes: [],
  pots: { red: { contaminated: false }, blue: { contaminated: false } },
  players: { a: { tomatoesHit: 0, stunned: false } },
});

test('sin cambios: ningún cue', () => {
  const s = base();
  assert.deepEqual(diffCues(s, base()), []);
});

test('sin snapshot previo: ningún cue', () => {
  assert.deepEqual(diffCues(null, base()), []);
  assert.deepEqual(diffCues(base(), null), []);
});

test('sube el marcador -> plate', () => {
  const prev = base();
  const next = base();
  next.score.red = 1;
  assert.ok(diffCues(prev, next).includes('plate'));
});

test('aparece un tomate -> throw', () => {
  const prev = base();
  const next = base();
  next.tomatoes = [{ id: 1, x: 0, y: 0 }];
  assert.ok(diffCues(prev, next).includes('throw'));
});

test('tomate que impacta a un jugador -> hit', () => {
  const prev = base();
  prev.tomatoes = [{ id: 1, x: 0, y: 0 }];
  const next = base();
  next.tomatoes = [];
  next.players.a.tomatoesHit = 1;
  const cues = diffCues(prev, next);
  assert.ok(cues.includes('hit'));
});

test('tomate que desaparece sin pegar (fuera del mapa) -> NO hit', () => {
  const prev = base();
  prev.tomatoes = [{ id: 1, x: 0, y: 0 }];
  const next = base();
  next.tomatoes = [];
  // tomatoesHit no sube
  assert.ok(!diffCues(prev, next).includes('hit'));
});

test('olla contaminada -> contaminate', () => {
  const prev = base();
  const next = base();
  next.pots.red.contaminated = true;
  assert.ok(diffCues(prev, next).includes('contaminate'));
});

test('jugador aturdido -> stun', () => {
  const prev = base();
  const next = base();
  next.players.a.stunned = true;
  assert.ok(diffCues(prev, next).includes('stun'));
});

test('impulso de plato+impacto en el mismo tick devuelve ambos', () => {
  const prev = base();
  prev.tomatoes = [{ id: 1, x: 0, y: 0 }];
  const next = base();
  next.tomatoes = [];
  next.players.a.tomatoesHit = 1;
  next.score.blue = 1;
  const cues = diffCues(prev, next);
  assert.ok(cues.includes('hit'));
  assert.ok(cues.includes('plate'));
});
