// =============================================================================
// tests/e2e/audio.spec.js — Milestone 06 (audio)
//
//  - el AudioContext se crea con el primer gesto del usuario
//  - M mutea/desmutea y el master gain refleja el estado (con persistencia)
//  - la música de fondo arranca con la partida
//  - sin errores de consola
// =============================================================================

import { test, expect } from '@playwright/test';

let seq = 0;
function uniqueName(prefix = 'Au') {
  seq += 1;
  return `${prefix}${Date.now().toString(36).slice(-4)}${seq}`;
}

async function boot(page) {
  await page.goto('/');
  await page.waitForFunction(() => !!window.__GAME_STATE__ && !!window.__NET__ && !!window.__AUDIO__);
}

test('el audio se inicializa con un gesto y M mutea/desmutea (con persistencia)', async ({ browser }) => {
  const errors = [];
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => { window.__AUDIO_ALWAYS__ = true; });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  try {
    await boot(page);

    // Primer gesto -> se crea el AudioContext.
    await page.keyboard.press('a');
    await page.waitForFunction(() => !!window.__AUDIO__.ctx);
    expect(await page.evaluate(() => window.__AUDIO__.masterGain.gain.value)).toBeCloseTo(1, 5);

    // Unirse: la tecla M sólo actúa una vez que hay identidad (en el lobby se
    // usa el teclado para escribir el nombre).
    await page.evaluate((n) => window.__NET__.join(n), uniqueName());
    await page.waitForFunction(() => !!window.__GAME_STATE__.selfId);

    // M -> silencio.
    await page.keyboard.press('m');
    await page.waitForFunction(() => window.__GAME_STATE__.isMuted === true);
    expect(await page.evaluate(() => window.__AUDIO__.masterGain.gain.value)).toBeCloseTo(0, 5);
    expect(await page.evaluate(() => localStorage.getItem('muted'))).toBe('true');

    // M -> vuelve el sonido.
    await page.keyboard.press('m');
    await page.waitForFunction(() => window.__GAME_STATE__.isMuted === false);
    expect(await page.evaluate(() => window.__AUDIO__.masterGain.gain.value)).toBeCloseTo(1, 5);
    expect(await page.evaluate(() => localStorage.getItem('muted'))).toBe('false');

    expect(errors).toEqual([]);
  } finally {
    await ctx.close();
  }
});

test('la música de fondo arranca con la partida', async ({ browser }) => {
  const c1 = await browser.newContext();
  const c2 = await browser.newContext();
  await c1.addInitScript(() => { window.__AUDIO_ALWAYS__ = true; });
  await c2.addInitScript(() => { window.__AUDIO_ALWAYS__ = true; });
  const p1 = await c1.newPage();
  const p2 = await c2.newPage();
  try {
    await boot(p1);
    await boot(p2);

    // Gesto real -> reanuda el AudioContext (si no, la música queda pendiente).
    await p1.keyboard.press('a');
    await p2.keyboard.press('a');

    await p1.evaluate((n) => window.__NET__.join(n), uniqueName('H'));
    await p2.evaluate((n) => window.__NET__.join(n), uniqueName('G'));
    await p1.waitForFunction(() => window.__GAME_STATE__.canStart === true);
    await p1.evaluate(() => window.__NET__.start());
    await p1.waitForFunction(() => window.__GAME_STATE__.mode === 'playing');

    await p1.waitForFunction(() => !!window.__AUDIO__.currentBgm);
    expect(await p1.evaluate(() => !!window.__AUDIO__.currentBgm)).toBe(true);
  } finally {
    await c1.close();
    await c2.close();
  }
});
