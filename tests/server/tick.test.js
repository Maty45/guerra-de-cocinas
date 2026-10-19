// =============================================================================
// tests/server/tick.test.js — Milestone 02
// El loop autoritativo debe correr a TICK_RATE (20) ticks por segundo.
// =============================================================================

import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

import { createLoop } from '../../server/loop.js';
import { TICK_RATE, TICK_MS } from '../../shared/constants.js';

test('20 ticks por segundo', () => {
  assert.equal(TICK_RATE, 20);
  assert.equal(TICK_MS, 1000 / TICK_RATE);

  mock.timers.enable({ apis: ['setInterval'] });
  try {
    let ticks = 0;
    const loop = createLoop(() => { ticks += 1; }, TICK_MS);

    loop.start();
    mock.timers.tick(1000); // 1 segundo
    loop.stop();

    assert.ok(
      Math.abs(ticks - TICK_RATE) <= 1,
      `se esperaban ~${TICK_RATE} ticks en 1 s, hubo ${ticks}`
    );
  } finally {
    mock.timers.reset();
  }
});

test('el loop no se duplica si se llama start() dos veces', () => {
  mock.timers.enable({ apis: ['setInterval'] });
  try {
    let ticks = 0;
    const loop = createLoop(() => { ticks += 1; }, TICK_MS);

    loop.start();
    loop.start();
    mock.timers.tick(TICK_MS * 3);
    loop.stop();

    assert.equal(ticks, 3, 'start() duplicado no debe crear dos intervalos');
  } finally {
    mock.timers.reset();
  }
});

test('stop() detiene el loop', () => {
  mock.timers.enable({ apis: ['setInterval'] });
  try {
    let ticks = 0;
    const loop = createLoop(() => { ticks += 1; }, TICK_MS);

    loop.start();
    mock.timers.tick(TICK_MS * 2);
    loop.stop();
    mock.timers.tick(TICK_MS * 10);

    assert.equal(ticks, 2);
  } finally {
    mock.timers.reset();
  }
});
