// =============================================================================
// tests/e2e/helpers.js — utilidades compartidas por los E2E.
//
// PESO: usamos UN solo browserContext con N páginas. Cada pestaña abre su
// propio WebSocket contra el servidor, así que el aislamiento del test se
// mantiene, pero nos ahorramos N perfiles incógnito de Chromium (los tests de
// 7 jugadores son los que más calientan la máquina).
// =============================================================================

/** Abre un contexto y `n` páginas dentro de él. */
export async function openPages(browser, n = 1) {
  const context = await browser.newContext();
  const pages = [];
  for (let i = 0; i < n; i += 1) pages.push(await context.newPage());
  return { context, pages };
}

/**
 * Espera a que la escena de partida esté ACTIVA. Con el fade de transición,
 * `mode === 'playing'` llega antes de que `GameScene.create()` monte el
 * listener de teclado: los tests que aprietan teclas tienen que esperar esto.
 */
export async function waitForGameScene(page) {
  await page.waitForFunction(() => {
    const g = window.__GAME__;
    return !!g && g.scene.isActive('GameScene');
  });
}

/**
 * Coloca al jugador propio exactamente en (x,y) con el hook de test
 * (`__NET__.testPlace`, activo sólo con ALLOW_TEST_HOOKS). Espera a que el
 * snapshot del servidor refleje la nueva posición.
 */
export async function placeAt(page, x, y) {
  await page.evaluate(([px, py]) => window.__NET__.testPlace(null, px, py), [x, y]);
  await page.waitForFunction(
    ([px, py]) => {
      const s = window.__GAME_STATE__;
      const me = s.players[s.selfId];
      return Math.hypot(me.x - px, me.y - py) <= 8;
    },
    [x, y]
  );
}

/**
 * Coloca al jugador propio a `tol` del punto (tx,ty), del lado desde el que
 * viene (así no queda dentro de una olla/mesada). Reemplaza las caminatas
 * largas de los E2E, que son lo que más CPU consume.
 */
export async function placeNear(page, tx, ty, tol = 30) {
  await page.evaluate(([x, y, t]) => {
    const s = window.__GAME_STATE__;
    const me = s.players[s.selfId];
    const dx = me.x - x;
    const dy = me.y - y;
    const d = Math.hypot(dx, dy) || 1;
    window.__NET__.testPlace(null, x + (dx / d) * t, y + (dy / d) * t);
  }, [tx, ty, tol]);
  await page.waitForFunction(
    ([x, y, t]) => {
      const s = window.__GAME_STATE__;
      const me = s.players[s.selfId];
      return Math.hypot(me.x - x, me.y - y) <= t + 10;
    },
    [tx, ty, tol]
  );
}
