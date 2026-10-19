// =============================================================================
// tests/e2e/visual.spec.js — Milestone 06 (QA visual)
//
//  - todas las texturas de pixel art se generan en runtime
//  - las entidades (jugadores, ollas, ingredientes) USAN esos sprites,
//    no formas geométricas crudas
//  - la partida corre sin errores de consola
//  - deja un screenshot en output/iterate/ para inspección humana
// =============================================================================

import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { waitForGameScene } from './helpers.js';

const TEXTURES = [
  'player-red', 'player-blue',
  'item-masa', 'item-tomate', 'item-queso', 'item-pan',
  'item-carne', 'item-lechuga', 'item-papa', 'item-huevo', 'item-aceite',
  'sprite-tomato', 'sprite-oil', 'sprite-pot', 'sprite-smoke', 'sprite-puddle',
  'tile-floor-0', 'tile-floor-1', 'tile-counter-0',
];

let seq = 0;
function uniqueName(prefix = 'V') {
  seq += 1;
  return `${prefix}${Date.now().toString(36).slice(-4)}${seq}`;
}

async function boot(page) {
  await page.goto('/');
  await page.waitForFunction(() => !!window.__GAME_STATE__ && !!window.__NET__ && !!window.__GAME__);
}

async function join(page, name) {
  await page.evaluate((n) => window.__NET__.join(n), name);
  await page.waitForFunction(
    (n) => window.__GAME_STATE__.roster.some((p) => p.name === n && p.connected),
    name
  );
}

test('todas las texturas de pixel art se generan y las entidades las usan', async ({ browser }) => {
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  try {
    await boot(page);

    // Mismo contexto, dos pestañas (cada una abre su propio WebSocket).
    const page2 = await ctx.newPage();
    await boot(page2);

    await join(page, uniqueName('A'));
    await join(page2, uniqueName('B'));
    await page.evaluate(() => window.__NET__.start());
    await page.waitForFunction(() => window.__GAME_STATE__.mode === 'playing' && window.__GAME_STATE__.tick > 0);
    await waitForGameScene(page);

    // Esperamos a que aparezca al menos un ingrediente en el piso.
    await page.waitForFunction(() => (window.__GAME_STATE__.ingredients || []).length > 0, null, { timeout: 8000 });

    const report = await page.evaluate((keys) => {
      const game = window.__GAME__;
      const scene = game.scene.keys.GameScene;

      const missing = keys.filter((k) => !game.textures.exists(k));

      const avatars = [...scene._avatars.values()].map((av) => ({
        type: av.body.type,
        texture: av.body.texture.key,
        frames: av.body.texture.frameTotal - 1,
      }));

      const potTextures = Object.values(scene._pots).map((p) => p.pot.texture.key);

      const items = [...scene._items.values()].map((v) => ({
        type: v.img.type,
        texture: v.img.texture.key,
      }));

      return {
        missing,
        avatars,
        potTextures,
        items,
        walkRed: game.anims.exists('walk-red'),
        walkBlue: game.anims.exists('walk-blue'),
      };
    }, TEXTURES);

    // 1) Ninguna textura faltante.
    expect(report.missing).toEqual([]);

    // 2) Los avatares son Sprites con textura de equipo y 4 frames (idle/walk).
    expect(report.avatars.length).toBeGreaterThan(0);
    for (const av of report.avatars) {
      expect(av.type).toBe('Sprite');
      expect(['player-red', 'player-blue']).toContain(av.texture);
      expect(av.frames).toBe(4);
    }

    // 3) Las ollas usan el sprite de olla.
    expect(report.potTextures.length).toBe(2);
    for (const t of report.potTextures) expect(t).toBe('sprite-pot');

    // 4) Los ingredientes del piso son imágenes con textura item-*.
    expect(report.items.length).toBeGreaterThan(0);
    for (const it of report.items) {
      expect(it.type).toBe('Image');
      expect(it.texture.startsWith('item-')).toBe(true);
    }

    // 5) Las animaciones de caminata existen por equipo.
    expect(report.walkRed).toBe(true);
    expect(report.walkBlue).toBe(true);

    // 6) Sin errores de consola.
    expect(errors).toEqual([]);

    // 7) Screenshot para inspección humana (con el fade-in ya terminado).
    await page.waitForFunction(() => {
      const s = window.__GAME__.scene.keys.GameScene;
      return s && s.cameras.main.fadeEffect.isRunning === false;
    });
    mkdirSync('output/iterate', { recursive: true });
    await page.screenshot({ path: 'output/iterate/m06-sprites.png' });
  } finally {
    await ctx.close();
  }
});
