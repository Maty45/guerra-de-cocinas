// =============================================================================
// tests/e2e/gameover.spec.js — Milestone 05
//
//   - pantalla final con ganador, platos y saboteador del partido
//   - solo el host ve el botón REVANCHA
//   - revancha reinicia con puntajes en 0 (y equipos resorteádo)
//   - reiniciar 3 veces seguidas no deja estado colgado
//
// Para no esperar los 5:00 reales, el spec usa el hook del servidor
// `window.__NET__.testEndMatch(...)` (habilitado con ALLOW_TEST_HOOKS en
// playwright.config.js). El saboteador, en cambio, se genera con juego REAL
// (un tomatazo que impacta).
// =============================================================================

import { test, expect } from '@playwright/test';
import { openPages, placeNear, placeAt, waitForGameScene } from './helpers.js';

test.describe.configure({ timeout: 120000 });

let seq = 0;
function uniqueName(prefix = 'G') {
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

async function startMatch(browser, n) {
  const { context, pages } = await openPages(browser, n);
  const contexts = [context];
  for (const page of pages) await boot(page);
  for (let i = 0; i < n; i += 1) await join(pages[i], uniqueName(`G${i}`));

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

function me(page) {
  return page.evaluate(() => {
    const s = window.__GAME_STATE__;
    return s.players[s.selfId];
  });
}

// En los E2E posicionamos con el hook de test en vez de caminar.
async function walkTo(page, tx, ty, tol = 30) {
  await placeNear(page, tx, ty, tol);
  return true;
}

/** Ubica al `thrower` y a `victim` en el pasillo y le tira un tomate. */
async function hitWithTomato(thrower, victim) {
  const victimId = await victim.evaluate(() => window.__GAME_STATE__.selfId);
  await placeAt(thrower, 400, 300);
  await placeAt(victim, 760, 300);

  await thrower.evaluate(() => window.__NET__.sendInput({ right: true }));
  await thrower.waitForTimeout(150);
  await thrower.evaluate(() => window.__NET__.sendInput({}));
  await thrower.keyboard.press('e');

  try {
    await thrower.waitForFunction(
      (id) => window.__GAME_STATE__.players[id]?.stunned === true,
      victimId,
      { timeout: 5000 }
    );
    return true;
  } catch {
    return false;
  }
}

/** Fuerza el fin de la partida (hook de test) con ganador decisivo. */
async function endMatchNow(page, winner = 'red') {
  await page.evaluate((w) => window.__NET__.testEndMatch(w), winner);
  await page.waitForFunction(() => window.__GAME_STATE__.mode === 'game_over', null, { timeout: 5000 });
}

/** Pide la revancha y espera a que la partida nueva esté en marcha y en cero. */
async function rematchNow(page) {
  await page.evaluate(() => window.__NET__.rematch());
  await page.waitForFunction(
    () => {
      const s = window.__GAME_STATE__;
      return s.mode === 'playing' && s.score.red === 0 && s.score.blue === 0 && s.tick > 0;
    },
    null,
    { timeout: 8000 }
  );
}

const activeScene = (page) =>
  page.evaluate(() => window.__GAME__.scene.getScenes(true).map((s) => s.scene.key));

// ---------------------------------------------------------------------------

test('pantalla final con ganador, platos, saboteador y solo el host revancha', async ({ browser }) => {
  const { contexts, pages } = await startMatch(browser, 2);
  try {
    const [host, guest] = pages;
    const hostTeam = (await me(host)).team;
    const hostId = await host.evaluate(() => window.__GAME_STATE__.selfId);

    // El saboteador se genera con juego REAL: un tomatazo que impacta.
    expect(await hitWithTomato(host, guest), 'el tomatazo debería impactar').toBe(true);
    await host.waitForFunction(
      (id) => window.__GAME_STATE__.players[id]?.tomatoesHit >= 1,
      hostId,
      { timeout: 3000 }
    );

    // Terminar la partida ya (gana el equipo del host).
    await endMatchNow(host, hostTeam);

    for (const p of pages) {
      await p.waitForFunction(() => window.__GAME_STATE__.mode === 'game_over');
    }
    for (const p of pages) {
      await p.waitForFunction(() => window.__GAME__.scene.getScenes(true).some((s) => s.scene.key === 'GameOverScene'));
    }

    expect(await host.evaluate(() => window.__GAME_STATE__.winner)).toBe(hostTeam);
    expect(await host.evaluate(() => window.__GAME_STATE__.saboteur)).toBe(hostId);
    expect(await activeScene(host)).toContain('GameOverScene');
    expect(await activeScene(guest)).toContain('GameOverScene');

    // Sólo el host ve el botón REVANCHA.
    const hostBtn = await host.evaluate(() => window.__GAME__.scene.getScene('GameOverScene').rematchButton.visible);
    const guestBtn = await guest.evaluate(() => window.__GAME__.scene.getScene('GameOverScene').rematchButton.visible);
    expect(hostBtn).toBe(true);
    expect(guestBtn).toBe(false);

    // Y la revancha arranca una partida nueva en cero.
    await rematchNow(host);
    await guest.waitForFunction(() => window.__GAME_STATE__.mode === 'playing');
    expect(await host.evaluate(() => window.__GAME_STATE__.score)).toEqual({ red: 0, blue: 0 });
  } finally {
    for (const c of contexts) await c.close();
  }
});

test('reiniciar 3 veces seguidas deja todo limpio (sin estado colgado)', async ({ browser }) => {
  const { contexts, pages } = await startMatch(browser, 2);
  try {
    const [host, guest] = pages;

    for (let i = 0; i < 3; i += 1) {
      await endMatchNow(host, 'red');
      await host.waitForFunction(() => window.__GAME_STATE__.mode === 'game_over');
      expect(await host.evaluate(() => window.__GAME_STATE__.winner)).toBe('red');

      await rematchNow(host);

      // La partida nueva NO arrastra nada de la anterior.
      const snap = await host.evaluate(() => {
        const s = window.__GAME_STATE__;
        return {
          mode: s.mode,
          score: s.score,
          timeLeft: s.timeLeft,
          tomatoes: s.tomatoes.length,
          puddles: s.puddles.length,
          oil: s.oil,
          cooking: [s.pots.red?.cooking, s.pots.blue?.cooking],
          winner: s.winner,
          phase: s.phase,
        };
      });
      expect(snap.mode).toBe('playing');
      expect(snap.score).toEqual({ red: 0, blue: 0 });
      expect(snap.timeLeft).toBeGreaterThan(290);
      expect(snap.tomatoes).toBe(0);
      expect(snap.puddles).toBe(0);
      expect(snap.oil).toBe(null);
      expect(snap.cooking).toEqual([false, false]);
      expect(snap.winner).toBe(null);
      expect(snap.phase).toBe('playing');

      await guest.waitForFunction(() => window.__GAME_STATE__.mode === 'playing');
    }
  } finally {
    for (const c of contexts) await c.close();
  }
});
