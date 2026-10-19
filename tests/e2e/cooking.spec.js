// =============================================================================
// tests/e2e/cooking.spec.js — Milestone 03
//
//   - un jugador lleva UNA sola cosa a la vez
//   - juntando los 3 correctos, la olla cocina y suma 1 plato (+ comanda nueva)
//   - un ingrediente repetido contamina la olla propia (humo verde)
//   - dos pestañas enfrentadas ven la misma comanda y los mismos platos
//
// No hay bots: el test maneja al jugador leyendo el estado AUTORITATIVO del
// servidor y mandando input (como haría una persona con WASD).
// =============================================================================

import { test, expect } from '@playwright/test';
import { openPages, placeNear, placeAt, waitForGameScene } from './helpers.js';

test.describe.configure({ timeout: 120000 });

let seq = 0;
function uniqueName(prefix = 'C') {
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
  for (let i = 0; i < n; i += 1) await join(pages[i], uniqueName(`J${i}`));

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

/** Estado del jugador propio según el servidor. */
function me(page) {
  return page.evaluate(() => {
    const s = window.__GAME_STATE__;
    return s.players[s.selfId];
  });
}

/**
 * Camina hacia (tx,ty) mandando input, hasta quedar a `tol` del objetivo.
 * No hay pathfinding: si se traba contra una mesada, costea en perpendicular
 * (alternando el lado) hasta destrabarse.
 * Devuelve true si llegó.
 */
// En los E2E posicionamos con el hook de test en vez de caminar: mismo
// resultado observable, muchísimo menos CPU (los bots eran el 90% del tiempo).
async function walkTo(page, tx, ty, tol = 30) {
  await placeNear(page, tx, ty, tol);
  return true;
}

/** Tap de Espacio (agarrar / cargar / soltar). */
async function tap(page) {
  await page.evaluate(() => window.__NET__.sendAction('tap'));
  await page.waitForTimeout(120); // dejar procesar el tick
}

/** Levanta del piso el ingrediente `kind` más cercano (con reintentos). */
async function pickUp(page, kind) {
  for (let intento = 0; intento < 3; intento += 1) {
    const target = await page.evaluate((k) => {
      const s = window.__GAME_STATE__;
      const yo = s.players[s.selfId];
      const items = s.ingredients.filter((i) => i.kind === k);
      if (items.length === 0) return null;
      items.sort(
        (a, b) => Math.hypot(a.x - yo.x, a.y - yo.y) - Math.hypot(b.x - yo.x, b.y - yo.y)
      );
      return { x: items[0].x, y: items[0].y };
    }, kind);

    if (!target) {
      await page.waitForTimeout(500); // puede tardar en reaparecer
      continue;
    }

    await placeAt(page, target.x, target.y);
    await tap(page);

    try {
      await page.waitForFunction(
        (k) => {
          const s = window.__GAME_STATE__;
          return s.players[s.selfId].carrying === k;
        },
        kind,
        { timeout: 3000 }
      );
      return true;
    } catch {
      // Reintentar (quizá quedó trabado contra una mesada).
    }
  }
  return false;
}

/**
 * Carga en la olla propia lo que lleva en la mano.
 * Verifica que la olla REALMENTE ganó un ingrediente (si no, reintenta).
 */
async function loadHeld(page) {
  const info = await page.evaluate(() => {
    const s = window.__GAME_STATE__;
    const team = s.players[s.selfId].team;
    return { team, n: s.pots[team].contents.length, x: s.pots[team].x, y: s.pots[team].y };
  });

  for (let intento = 0; intento < 3; intento += 1) {
    // 64 > distancia de colisión de la olla (60) y < radio de interacción (80).
    const llego = await walkTo(page, info.x, info.y, 64);
    if (!llego) continue;

    await tap(page);
    try {
      await page.waitForFunction(
        ([t, n]) => {
          const pot = window.__GAME_STATE__.pots[t];
          return pot.contents.length > n || pot.contaminated;
        },
        [info.team, info.n],
        { timeout: 2000 }
      );
      return true;
    } catch {
      // Reintentar.
    }
  }
  return false;
}

// ---------------------------------------------------------------------------

test('un jugador lleva una sola cosa a la vez', async ({ browser }) => {
  const { contexts, pages } = await startMatch(browser, 2);
  try {
    const page = pages[0];
    const team = (await me(page)).team;
    const recipe = await page.evaluate((t) => window.__GAME_STATE__.order[t].ingredients, team);
    const kind = recipe[0];

    // Levanta: ahora lleva exactamente un ingrediente (un string, no una lista).
    expect(await pickUp(page, kind)).toBe(true);
    let carrying = (await me(page)).carrying;
    expect(typeof carrying).toBe('string');
    expect(carrying).toBe(kind);

    // Tap de nuevo con las manos llenas (lejos de la olla): lo suelta.
    // Esperamos a que la despensa se rellene (vuelve a 8): con el piso lleno
    // el drop igual tiene que funcionar (antes se ignoraba y quedabas pegado).
    await page.waitForTimeout(1200);
    await tap(page);
    await page.waitForFunction(() => {
      const s = window.__GAME_STATE__;
      return s.players[s.selfId].carrying === null;
    });
    expect((await me(page)).carrying).toBe(null);

    // Y puede volver a levantar (siempre de a una).
    expect(await pickUp(page, kind)).toBe(true);
    carrying = (await me(page)).carrying;
    expect(typeof carrying).toBe('string');
  } finally {
    for (const c of contexts) await c.close();
  }
});

test('juntar los 3 correctos cocina y suma un plato', async ({ browser }) => {
  const { contexts, pages } = await startMatch(browser, 2);
  try {
    const page = pages[0];
    const team = (await me(page)).team;
    const recipe = await page.evaluate((t) => window.__GAME_STATE__.order[t], team);

    expect(recipe.id).toBe('pizza'); // primera comanda para ambos equipos
    const scoreAntes = await page.evaluate((t) => window.__GAME_STATE__.score[t], team);

    // Levanta y carga los 3 ingredientes, uno por uno.
    for (const kind of recipe.ingredients) {
      const ok = await pickUp(page, kind);
      expect(ok, `debería poder levantar ${kind} (la despensa lo garantiza)`).toBe(true);
      expect(await loadHeld(page), `debería poder cargar ${kind} en la olla`).toBe(true);
    }

    // La olla quedó cocinando.
    await page.waitForFunction(
      (t) => window.__GAME_STATE__.pots[t].cooking === true,
      team,
      { timeout: 5000 }
    );

    // Tras la cocción (5 s), suma 1 plato y sale la comanda siguiente.
    await page.waitForFunction(
      ([t, antes]) => window.__GAME_STATE__.score[t] === antes + 1,
      [team, scoreAntes],
      { timeout: 15000 }
    );

    const order = await page.evaluate((t) => window.__GAME_STATE__.order[t], team);
    const pot = await page.evaluate((t) => window.__GAME_STATE__.pots[t], team);
    expect(order.id).not.toBe('pizza');
    expect(pot.contents).toEqual([]);
    expect(pot.cooking).toBe(false);
  } finally {
    for (const c of contexts) await c.close();
  }
});

test('un ingrediente repetido contamina la olla propia (humo verde)', async ({ browser }) => {
  const { contexts, pages } = await startMatch(browser, 2);
  try {
    const page = pages[0];
    const team = (await me(page)).team;

    // Pizza = masa, tomate, queso -> metemos queso dos veces.
    expect(await pickUp(page, 'queso')).toBe(true);
    expect(await loadHeld(page)).toBe(true);
    await page.waitForFunction(
      (t) => window.__GAME_STATE__.pots[t].contents.includes('queso'),
      team,
      { timeout: 5000 }
    );

    expect(await pickUp(page, 'queso')).toBe(true);
    expect(await loadHeld(page)).toBe(true);
    await page.waitForFunction(
      (t) => window.__GAME_STATE__.pots[t].contaminated === true,
      team,
      { timeout: 5000 }
    );

    const pot = await page.evaluate((t) => window.__GAME_STATE__.pots[t], team);
    expect(pot.contaminated).toBe(true);
    expect(pot.cooking).toBe(false);

    // Y el humo verde está visible en el render.
    const humo = await page.evaluate(
      (t) => window.__GAME__.scene.getScene('GameScene')._pots[t].smoke.visible,
      team
    );
    expect(humo).toBe(true);
  } finally {
    for (const c of contexts) await c.close();
  }
});

test('comanda y platos son consistentes en dos pestañas enfrentadas', async ({ browser }) => {
  const { contexts, pages } = await startMatch(browser, 2);
  try {
    const [p1, p2] = pages;
    await p1.waitForFunction(() => window.__GAME_STATE__.order.red !== null);

    const snap = (p) => p.evaluate(() => ({
      order: window.__GAME_STATE__.order,
      score: window.__GAME_STATE__.score,
      ingredients: window.__GAME_STATE__.ingredients.length,
    }));

    const a = await snap(p1);
    const b = await snap(p2);

    expect(a.order).toEqual(b.order);
    expect(a.score).toEqual(b.score);
    // Misma cantidad de ingredientes en el piso (mismo estado autoritativo).
    expect(Math.abs(a.ingredients - b.ingredients)).toBeLessThanOrEqual(1);

    // Ambos equipos arrancan con la MISMA comanda (secuencia compartida).
    expect(a.order.red.id).toBe(a.order.blue.id);
  } finally {
    for (const c of contexts) await c.close();
  }
});
