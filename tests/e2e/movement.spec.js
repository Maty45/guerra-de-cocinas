// =============================================================================
// tests/e2e/movement.spec.js — Milestone 02
//
//  - el cliente manda `input` SÓLO cuando cambia el conjunto de teclas
//  - con 7 clientes, todos ven la misma posición (estado autoritativo)
//  - el mapa 1280×720 escala sin deformar
// =============================================================================

import { test, expect } from '@playwright/test';
import { openPages, waitForGameScene, placeAt } from './helpers.js';

let seq = 0;
function uniqueName(prefix = 'M') {
  seq += 1;
  return `${prefix}${Date.now().toString(36).slice(-4)}${seq}`;
}

async function boot(page) {
  await page.goto('/');
  await page.waitForFunction(() => !!window.__GAME_STATE__ && !!window.__NET__);
}

async function join(page, name) {
  await page.evaluate((n) => window.__NET__.join(n), name);
  await page.waitForFunction(
    (n) => window.__GAME_STATE__.roster.some((p) => p.name === n && p.connected),
    name
  );
}

/** Levanta `n` clientes, los une y arranca la partida. Devuelve las páginas. */
async function startMatch(browser, n) {
  const { context, pages } = await openPages(browser, n);
  const contexts = [context];
  for (const page of pages) await boot(page);
  for (let i = 0; i < n; i += 1) {
    await join(pages[i], uniqueName(`J${i}`));
  }
  await pages[0].waitForFunction(
    (count) => window.__GAME_STATE__.roster.filter((p) => p.connected).length === count,
    n
  );
  await pages[0].evaluate(() => window.__NET__.start());
  for (const p of pages) {
    await p.waitForFunction(() => window.__GAME_STATE__.mode === 'playing');
    await p.waitForFunction(() => window.__GAME_STATE__.tick > 0);
    await waitForGameScene(p);
  }
  return { contexts, pages };
}

test('la posición se interpola: el cliente recibe estado autoritativo', async ({ browser }) => {
  const { contexts, pages } = await startMatch(browser, 2);
  try {
    const p0 = pages[0];
    const selfId = await p0.evaluate(() => window.__GAME_STATE__.selfId);

    // El jugador existe en el estado del servidor y tiene spawn válido.
    const me = await p0.evaluate((id) => window.__GAME_STATE__.players[id], selfId);
    expect(me).toBeTruthy();
    expect(typeof me.x).toBe('number');
    expect(typeof me.y).toBe('number');

    // Se mueve: manda input y la posición del servidor cambia.
    const x0 = me.x;
    await p0.evaluate(() => window.__NET__.sendInput({ right: true }));
    await p0.waitForFunction(
      ([id, x]) => window.__GAME_STATE__.players[id].x > x + 20,
      [selfId, x0]
    );
    await p0.evaluate(() => window.__NET__.sendInput({}));
  } finally {
    for (const c of contexts) await c.close();
  }
});

test('las flechas del teclado también mueven al jugador', async ({ browser }) => {
  const { contexts, pages } = await startMatch(browser, 2);
  try {
    const p0 = pages[0];
    const selfId = await p0.evaluate(() => window.__GAME_STATE__.selfId);

    // Pasillo libre, lejos de paredes y mesadas.
    await placeAt(p0, 400, 430);
    const x0 = await p0.evaluate((id) => window.__GAME_STATE__.players[id].x, selfId);
    await p0.keyboard.down('ArrowLeft');
    await p0.waitForFunction(
      ([id, x]) => window.__GAME_STATE__.players[id].x < x - 20,
      [selfId, x0]
    );
    await p0.keyboard.up('ArrowLeft');
    await p0.waitForTimeout(150);

    // Al soltar, el jugador se detiene (no queda "pegado" andando).
    const after = await p0.evaluate((id) => window.__GAME_STATE__.players[id].x, selfId);
    await p0.waitForTimeout(300);
    expect(await p0.evaluate((id) => window.__GAME_STATE__.players[id].x, selfId)).toBeCloseTo(after, 0);
  } finally {
    for (const c of contexts) await c.close();
  }
});

test('el cliente manda input solo al cambiar el conjunto de teclas', async ({ browser }) => {
  const { contexts, pages } = await startMatch(browser, 2);
  try {
    const p0 = pages[0];
    const base = await p0.evaluate(() => window.__NET__.inputSends);

    await p0.keyboard.down('d');
    await p0.waitForFunction((b) => window.__NET__.inputSends === b + 1, base);

    // Mantener apretada la misma tecla NO manda de nuevo.
    await p0.waitForTimeout(250);
    expect(await p0.evaluate(() => window.__NET__.inputSends)).toBe(base + 1);

    // Cambia el conjunto (agrego 'w') -> un envío más.
    await p0.keyboard.down('w');
    await p0.waitForFunction((b) => window.__NET__.inputSends === b + 2, base);

    // Suelto 'd' -> cambia el conjunto -> otro envío.
    await p0.keyboard.up('d');
    await p0.waitForFunction((b) => window.__NET__.inputSends === b + 3, base);

    await p0.keyboard.up('w');
    await p0.waitForFunction((b) => window.__NET__.inputSends === b + 4, base);
  } finally {
    for (const c of contexts) await c.close();
  }
});

test('7 clientes ven la misma posición (consistencia)', async ({ browser }) => {
  const { contexts, pages } = await startMatch(browser, 7);
  try {
    const selfId = await pages[0].evaluate(() => window.__GAME_STATE__.selfId);

    // Muevo al jugador 0.
    const x0 = await pages[0].evaluate((id) => window.__GAME_STATE__.players[id].x, selfId);
    await pages[0].evaluate(() => window.__NET__.sendInput({ right: true }));
    await pages[0].waitForFunction(
      ([id, x]) => window.__GAME_STATE__.players[id].x > x + 30,
      [selfId, x0]
    );

    // Frenar antes de comparar (si sigue moviéndose, cada lectura secuencial
    // cae en un tick distinto y las posiciones no coinciden por un tick).
    await pages[0].evaluate(() => window.__NET__.sendInput({}));
    await pages[0].waitForTimeout(250);

    // Todos los clientes deben coincidir en la posición de ese jugador.
    const positions = [];
    for (const p of pages) {
      positions.push(await p.evaluate((id) => {
        const me = window.__GAME_STATE__.players[id];
        return { x: me.x, y: me.y };
      }, selfId));
    }
    for (const pos of positions) {
      expect(pos.x).toBeCloseTo(positions[0].x, 2);
      expect(pos.y).toBeCloseTo(positions[0].y, 2);
    }
    expect(positions[0].x).toBeGreaterThan(x0);
  } finally {
    for (const c of contexts) await c.close();
  }
});

test('reconectar con la partida en curso vuelve a la partida', async ({ browser }) => {
  const c1 = await browser.newContext();
  const c2 = await browser.newContext();
  const c3 = await browser.newContext();
  try {
    const p1 = await c1.newPage();
    const p2 = await c2.newPage();
    await boot(p1);
    await boot(p2);
    await join(p1, uniqueName('Host'));
    const name = uniqueName('Recon');
    await join(p2, name);
    await p1.waitForFunction(() => window.__GAME_STATE__.canStart === true);
    await p1.evaluate(() => window.__NET__.start());
    await p1.waitForFunction(() => window.__GAME_STATE__.mode === 'playing');
    await p2.waitForFunction(() => window.__GAME_STATE__.mode === 'playing');

    const idAntes = await p2.evaluate(() => window.__GAME_STATE__.selfId);
    await c2.close();

    // Vuelve con el mismo nombre: entra directo a la partida (no al lobby).
    const p3 = await c3.newPage();
    await boot(p3);
    await join(p3, name);

    await p3.waitForFunction(() => window.__GAME_STATE__.mode === 'playing');
    await p3.waitForFunction(() => window.__GAME_STATE__.tick > 0);
    expect(await p3.evaluate(() => window.__GAME_STATE__.selfId)).toBe(idAntes);

    const jugadores = await p3.evaluate(() => Object.keys(window.__GAME_STATE__.players));
    expect(jugadores).toContain(idAntes);
  } finally {
    await c1.close();
    await c3.close();
  }
});

test('el mapa 1280x720 escala sin deformar', async ({ page }) => {
  await boot(page);
  const { w, h } = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    return { w: c.width, h: c.height };
  });
  expect(Math.abs(w / h - 16 / 9)).toBeLessThan(0.02);
});
