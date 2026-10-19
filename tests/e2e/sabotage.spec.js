// =============================================================================
// tests/e2e/sabotage.spec.js — Milestone 04
//
//   - el tomatazo (E) aturde al rival (sin fuego amigo)
//   - robar de la olla rival con las manos vacías
//   - contaminar la olla rival (humo verde)
//   - volcar la cocción rival con Espacio mantenido
//
// Igual que cooking.spec.js: no hay bots, el test maneja a los jugadores
// leyendo el estado AUTORITATIVO del servidor. El tomatazo y el hold se
// disparan con TECLADO REAL para validar el input del cliente.
// =============================================================================

import { test, expect } from '@playwright/test';
import { openPages, placeNear, placeAt, waitForGameScene } from './helpers.js';

test.describe.configure({ timeout: 120000 });

let seq = 0;
function uniqueName(prefix = 'S') {
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
  for (let i = 0; i < n; i += 1) await join(pages[i], uniqueName(`S${i}`));

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

/** Equipo rival del jugador propio. */
function rival(page) {
  return page.evaluate(() => {
    const s = window.__GAME_STATE__;
    const team = s.players[s.selfId].team;
    return team === 'red' ? 'blue' : 'red';
  });
}

// En los E2E posicionamos con el hook de test en vez de caminar.
async function walkTo(page, tx, ty, tol = 30) {
  await placeNear(page, tx, ty, tol);
  return true;
}

async function tap(page) {
  await page.evaluate(() => window.__NET__.sendAction('tap'));
  await page.waitForTimeout(120);
}

async function pickUp(page, kind) {
  for (let intento = 0; intento < 4; intento += 1) {
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
      await page.waitForTimeout(500);
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
      // reintentar
    }
  }
  return false;
}

/** Carga en la olla PROPIA lo que lleva en la mano. */
async function loadOwnPot(page) {
  const info = await page.evaluate(() => {
    const s = window.__GAME_STATE__;
    const team = s.players[s.selfId].team;
    return { team, n: s.pots[team].contents.length, x: s.pots[team].x, y: s.pots[team].y };
  });

  for (let intento = 0; intento < 3; intento += 1) {
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
      // reintentar
    }
  }
  return false;
}

/** Posición de la olla rival. */
function rivalPot(page) {
  return page.evaluate(() => {
    const s = window.__GAME_STATE__;
    const mine = s.players[s.selfId].team;
    const r = mine === 'red' ? 'blue' : 'red';
    return { team: r, x: s.pots[r].x, y: s.pots[r].y, contents: s.pots[r].contents.length };
  });
}

/** Deja a la víctima con 1 ingrediente en su olla. Devuelve { team, kind }. */
async function seedVictimPot(victim) {
  const team = (await me(victim)).team;
  const rec = await victim.evaluate((t) => window.__GAME_STATE__.order[t], team);
  const kind = rec.ingredients[0];
  expect(await pickUp(victim, kind), `la víctima levanta ${kind}`).toBe(true);
  expect(await loadOwnPot(victim), 'la víctima carga su olla').toBe(true);
  await victim.waitForFunction(
    ([t, k]) => window.__GAME_STATE__.pots[t].contents.includes(k),
    [team, kind],
    { timeout: 5000 }
  );
  return { team, kind };
}

// ---------------------------------------------------------------------------

test('el tomatazo (E) aturde al rival', async ({ browser }) => {
  const { contexts, pages } = await startMatch(browser, 2);
  try {
    const [tirador, rivalPage] = pages;
    const rivalId = await rivalPage.evaluate(() => window.__GAME_STATE__.selfId);

    // Los ubico en un pasillo despejado (y=300, arriba de la isla central).
    await placeAt(tirador, 400, 300);
    await placeAt(rivalPage, 760, 300);

    // El tirador se orienta hacia la derecha (caminando) y dispara con E.
    await tirador.evaluate(() => window.__NET__.sendInput({ right: true }));
    await tirador.waitForTimeout(150);
    await tirador.evaluate(() => window.__NET__.sendInput({}));
    await tirador.keyboard.press('e');

    await tirador.waitForFunction(
      () => (window.__GAME_STATE__.tomatoes || []).length >= 1,
      null,
      { timeout: 2000 }
    );

    await tirador.waitForFunction(
      (id) => window.__GAME_STATE__.players[id]?.stunned === true,
      rivalId,
      { timeout: 5000 }
    );
    expect(await tirador.evaluate((id) => window.__GAME_STATE__.players[id].stunned, rivalId)).toBe(true);

    // Efecto visual del aturdimiento: estrellitas girando + tambaleo.
    const stunFx = await rivalPage.evaluate((id) => {
      const scene = window.__GAME__.scene.getScene('GameScene');
      const av = scene._avatars.get(id);
      return av ? { stars: av.stars.visible, spin: !!av.stunSpin, wobble: !!av.stunWobble } : null;
    }, rivalId);
    expect(stunFx?.stars).toBe(true);
    expect(stunFx?.spin).toBe(true);
    expect(stunFx?.wobble).toBe(true);

    // Al pasar el aturdimiento, las estrellitas desaparecen y el avatar se endereza.
    await rivalPage.waitForFunction((id) => {
      const scene = window.__GAME__.scene.getScene('GameScene');
      const av = scene._avatars.get(id);
      return av && !av.stars.visible && av.body.angle === 0;
    }, rivalId, { timeout: 5000 });
  } finally {
    for (const c of contexts) await c.close();
  }
});

test('robar de la olla rival con las manos vacías', async ({ browser }) => {
  const { contexts, pages } = await startMatch(browser, 2);
  try {
    const [ladron, victima] = pages;
    const { team, kind } = await seedVictimPot(victima);

    const pot = await rivalPot(ladron);
    expect(pot.team).toBe(team);
    expect(pot.contents).toBe(1);
    expect(await walkTo(ladron, pot.x, pot.y, 64)).toBe(true);

    await tap(ladron);

    await ladron.waitForFunction(
      (t) => window.__GAME_STATE__.pots[t].contents.length === 0,
      team,
      { timeout: 3000 }
    );
    expect((await me(ladron)).carrying).toBe(kind);
    expect(await ladron.evaluate((t) => window.__GAME_STATE__.pots[t].contents.length, team)).toBe(0);
  } finally {
    for (const c of contexts) await c.close();
  }
});

test('contaminar la olla rival (humo verde)', async ({ browser }) => {
  const { contexts, pages } = await startMatch(browser, 2);
  try {
    const [saboteur, victima] = pages;
    const team = (await me(victima)).team;
    const rec = await victima.evaluate((t) => window.__GAME_STATE__.order[t], team);
    const kind = rec.ingredients[0]; // garantizado en la despensa
    const pot = await rivalPot(saboteur);

    // Meter el MISMO ingrediente dos veces -> repetido -> contaminada.
    for (let i = 0; i < 2; i += 1) {
      expect(await pickUp(saboteur, kind), `sabotea con ${kind}`).toBe(true);
      expect(await walkTo(saboteur, pot.x, pot.y, 64)).toBe(true);
      await tap(saboteur);
      await saboteur.waitForFunction(
        ([t, n]) => window.__GAME_STATE__.pots[t].contents.length >= n,
        [team, i + 1],
        { timeout: 3000 }
      );
    }

    await saboteur.waitForFunction(
      (t) => window.__GAME_STATE__.pots[t].contaminated === true,
      team,
      { timeout: 3000 }
    );
    const fin = await saboteur.evaluate((t) => window.__GAME_STATE__.pots[t], team);
    expect(fin.contaminated).toBe(true);
    expect(fin.cooking).toBe(false);

    const humo = await saboteur.evaluate(
      (t) => window.__GAME__.scene.getScene('GameScene')._pots[t].smoke.visible,
      team
    );
    expect(humo).toBe(true);

    // Y el rival NO puede robar de una olla contaminada.
    const antes = fin.contents.length;
    await victima.waitForFunction(() => window.__GAME_STATE__.mode === 'playing');
    expect(antes).toBe(2);
  } finally {
    for (const c of contexts) await c.close();
  }
});

test('volcar la cocción rival con Espacio mantenido', async ({ browser }) => {
  const { contexts, pages } = await startMatch(browser, 2);
  try {
    const [saboteur, victima] = pages;
    const team = (await me(victima)).team;
    const rec = await victima.evaluate((t) => window.__GAME_STATE__.order[t], team);
    const pot = await rivalPot(saboteur);

    // El saboteador se ubica junto a la olla rival ANTES de que empiece a cocinar.
    expect(await walkTo(saboteur, pot.x, pot.y, 64)).toBe(true);

    // La víctima carga los 3 ingredientes correctos -> la olla cocina.
    for (const kind of rec.ingredients) {
      expect(await pickUp(victima, kind), `la víctima levanta ${kind}`).toBe(true);
      expect(await loadOwnPot(victima), `la víctima carga ${kind}`).toBe(true);
    }
    await victima.waitForFunction(
      (t) => window.__GAME_STATE__.pots[t].cooking === true,
      team,
      { timeout: 5000 }
    );
    // La víctima pudo empujar al saboteador: lo reubico junto a la olla rival
    // (62 > radio de colisión 60, y con margen dentro del de interacción 80).
    expect(await walkTo(saboteur, pot.x, pot.y, 62)).toBe(true);
    const scoreAntes = await saboteur.evaluate((t) => window.__GAME_STATE__.score[t], team);

    // Volcar: mantener Espacio 2 s (teclado real -> input del cliente).
    await saboteur.keyboard.down('Space');
    await saboteur.waitForTimeout(2300);
    await saboteur.keyboard.up('Space');

    await saboteur.waitForFunction(
      (t) => window.__GAME_STATE__.pots[t].contents.length === 0,
      team,
      { timeout: 4000 }
    );
    const fin = await saboteur.evaluate((t) => window.__GAME_STATE__.pots[t], team);
    expect(fin.cooking).toBe(false);
    expect(await saboteur.evaluate((t) => window.__GAME_STATE__.score[t], team)).toBe(scoreAntes);
  } finally {
    for (const c of contexts) await c.close();
  }
});
