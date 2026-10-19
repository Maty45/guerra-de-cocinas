// =============================================================================
// tests/e2e/lobby.spec.js — Milestone 01
//
// E2E del lobby con Playwright. Usa los hooks de test expuestos por el cliente:
//   window.__NET__        -> NetworkManager (connect/join/start)
//   window.__GAME_STATE__ -> estado del cliente (roster, isHost, canStart, mode)
//
// El servidor + cliente corren en un solo puerto (3000) vía `npm start`
// (levantado por playwright.config.js -> webServer).
// =============================================================================

import { test, expect } from '@playwright/test';
import { openPages } from './helpers.js';

let seq = 0;
/** Nombre único por corrida para no chocar con reconexiones previas. */
function uniqueName(prefix = 'P') {
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

const connectedCount = (page) =>
  page.evaluate(() => window.__GAME_STATE__.roster.filter((p) => p.connected).length);

/** Click en coordenadas lógicas del juego, mapeadas al canvas escalado. */
async function clickCanvas(page, x, y) {
  const box = await page.locator('canvas').boundingBox();
  const size = await page.evaluate(() => ({
    w: window.__GAME__.scale.width,
    h: window.__GAME__.scale.height,
  }));
  await page.mouse.click(
    box.x + (x / size.w) * box.width,
    box.y + (y / size.h) * box.height
  );
}

/** Posición lógica del botón EMPEZAR y tamaño lógico de la escena. */
function startButtonPos(page) {
  return page.evaluate(() => {
    const s = window.__GAME__.scene.getScene('LobbyScene');
    return {
      x: s.startButton.container.x,
      y: s.startButton.container.y,
      bw: s.startButton.container.width,
      bh: s.startButton.container.height,
      w: window.__GAME__.scale.width,
      h: window.__GAME__.scale.height,
    };
  });
}

test('sirve el cliente en el puerto 3000', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle('Guerra de Cocinas');
});

test('un jugador entra con un nombre y aparece en el roster', async ({ page }) => {
  await boot(page);
  const name = uniqueName('Ana');
  await join(page, name);

  const state = await page.evaluate(() => window.__GAME_STATE__);
  expect(state.connected).toBe(true);
  expect(state.roster.some((p) => p.name === name && p.connected)).toBe(true);
});

test('el primero en entrar es el host y solo el host ve empezar', async ({ browser }) => {
  const c1 = await browser.newContext();
  const c2 = await browser.newContext();
  try {
    const p1 = await c1.newPage();
    const p2 = await c2.newPage();
    await boot(p1);
    await boot(p2);

    await join(p1, uniqueName('Host'));
    await join(p2, uniqueName('Otro'));
    await p1.waitForFunction(() => window.__GAME_STATE__.roster.filter((p) => p.connected).length === 2);
    await p2.waitForFunction(() => window.__GAME_STATE__.roster.filter((p) => p.connected).length === 2);

    expect(await p1.evaluate(() => window.__GAME_STATE__.isHost)).toBe(true);
    expect(await p2.evaluate(() => window.__GAME_STATE__.isHost)).toBe(false);

    // Solo el host ve el botón EMPEZAR.
    const lobby = await p1.evaluate(() => window.__GAME__.scene.getScene('LobbyScene').startButton.container.visible);
    expect(lobby).toBe(true);
    await p2.waitForFunction(() => !window.__GAME_STATE__.isHost);
    const noBtn = await p2.evaluate(() => window.__GAME__.scene.getScene('LobbyScene').startButton.container.visible);
    expect(noBtn).toBe(false);
  } finally {
    await c1.close();
    await c2.close();
  }
});

test('empezar requiere un mínimo de 2 jugadores', async ({ browser }) => {  const c1 = await browser.newContext();
  const c2 = await browser.newContext();
  try {
    const p1 = await c1.newPage();
    const p2 = await c2.newPage();
    await boot(p1);
    await boot(p2);

    await join(p1, uniqueName('Solo'));
    expect(await connectedCount(p1)).toBe(1);
    expect(await p1.evaluate(() => window.__GAME_STATE__.canStart)).toBe(false);

    await join(p2, uniqueName('Dos'));
    await p1.waitForFunction(() => window.__GAME_STATE__.canStart === true);
    expect(await p1.evaluate(() => window.__GAME_STATE__.canStart)).toBe(true);
  } finally {
    await c1.close();
    await c2.close();
  }
});

test('el botón EMPEZAR arranca la partida con un click real', async ({ browser }) => {
  const { context, pages } = await openPages(browser, 2);
  try {
    const [p1, p2] = pages;
    await boot(p1);
    await boot(p2);
    await join(p1, uniqueName('ClickHost'));
    await join(p2, uniqueName('ClickGuest'));
    await p1.waitForFunction(() => window.__GAME_STATE__.canStart === true);
    await p1.waitForFunction(
      () => window.__GAME__.scene.getScene('LobbyScene').startButton.container.visible
    );

    const pos = await startButtonPos(p1);

    // Un click FUERA del botón no debe arrancar nada.
    await clickCanvas(p1, pos.x + pos.bw * 0.7, pos.y);
    await p1.waitForTimeout(250);
    expect(await p1.evaluate(() => window.__GAME_STATE__.mode)).toBe('menu');

    // Click cerca del borde superior-izquierdo VISIBLE: el hit area tiene que
    // coincidir con el dibujo (en Phaser 4 estaba corrido media caja).
    await clickCanvas(p1, pos.x - pos.bw * 0.42, pos.y - pos.bh * 0.3);

    await p1.waitForFunction(() => window.__GAME_STATE__.mode === 'playing');
    await p2.waitForFunction(() => window.__GAME_STATE__.mode === 'playing');
  } finally {
    await context.close();
  }
});

test('con un solo jugador, EMPEZAR explica que faltan jugadores', async ({ page }) => {
  await boot(page);
  await join(page, uniqueName('Lonely'));
  await page.waitForFunction(() => window.__GAME_STATE__.canStart === false);

  const hint = await page.evaluate(
    () => window.__GAME__.scene.getScene('LobbyScene').startHint.text
  );
  expect(hint).toContain('Faltan jugadores');

  // El botón se ve (es host) pero sigue apagado: el click no arranca nada.
  const visible = await page.evaluate(
    () => window.__GAME__.scene.getScene('LobbyScene').startButton.container.visible
  );
  expect(visible).toBe(true);

  const pos = await startButtonPos(page);
  await clickCanvas(page, pos.x, pos.y);
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.__GAME_STATE__.mode)).toBe('menu');
});

test('al empezar, todos los clientes reciben los equipos', async ({ browser }) => {
  const c1 = await browser.newContext();
  const c2 = await browser.newContext();
  try {
    const p1 = await c1.newPage();
    const p2 = await c2.newPage();
    await boot(p1);
    await boot(p2);

    await join(p1, uniqueName('Rino'));
    await join(p2, uniqueName('Bela'));
    await p1.waitForFunction(() => window.__GAME_STATE__.canStart === true);

    // El host arranca la partida.
    await p1.evaluate(() => window.__NET__.start());

    await p1.waitForFunction(() => window.__GAME_STATE__.mode === 'playing');
    await p2.waitForFunction(() => window.__GAME_STATE__.mode === 'playing');

    const teams1 = await p1.evaluate(() => window.__GAME_STATE__.teams);
    const teams2 = await p2.evaluate(() => window.__GAME_STATE__.teams);

    // Mismos equipos en ambas pestañas y repartidos entre los jugadores.
    expect(teams1).toEqual(teams2);
    const all = [...teams1.red, ...teams1.blue];
    expect(all.length).toBe(2);
    expect(new Set(all).size).toBe(2);

    // La escena cambió a la partida (la transición ocurre en el siguiente frame).
    await p1.waitForFunction(() =>
      window.__GAME__.scene.getScenes(true).some((s) => s.scene.key === 'GameScene')
    );
    const scene = await p1.evaluate(() => window.__GAME__.scene.getScenes(true).map((s) => s.scene.key));
    expect(scene).toContain('GameScene');
  } finally {
    await c1.close();
    await c2.close();
  }
});

test('reconexión por nombre: recupera su slot', async ({ browser }) => {
  const c1 = await browser.newContext();
  const c2 = await browser.newContext();
  const c3 = await browser.newContext();
  try {
    const p1 = await c1.newPage();
    const p2 = await c2.newPage();

    await boot(p1);
    await boot(p2);
    const hostName = uniqueName('Host');
    const name = uniqueName('Recon');
    await join(p1, hostName);
    await join(p2, name);

    const idAntes = await p2.evaluate(() => window.__GAME_STATE__.selfId);
    expect(idAntes).toBeTruthy();

    // Se cae el jugador.
    await c2.close();
    await p1.waitForFunction(
      (n) => window.__GAME_STATE__.roster.some((p) => p.name === n && !p.connected),
      name
    );

    // Vuelve a entrar con el mismo nombre -> mismo slot, sin duplicar.
    const p3 = await c3.newPage();
    await boot(p3);
    await join(p3, name);

    const idDespues = await p3.evaluate(() => window.__GAME_STATE__.selfId);
    expect(idDespues).toBe(idAntes);

    const entradas = await p3.evaluate(
      (n) => window.__GAME_STATE__.roster.filter((p) => p.name === n),
      name
    );
    expect(entradas.length).toBe(1);
    expect(entradas[0].connected).toBe(true);
  } finally {
    await c1.close();
    await c3.close();
  }
});

test('7 jugadores: el sorteo reparte 4 y 3 y todos entran a la partida', async ({ browser }) => {
  const { context, pages } = await openPages(browser, 7);
  const contexts = [context];
  try {
    for (const p of pages) await boot(p);

    const names = [];
    for (let i = 0; i < 7; i++) {
      const n = uniqueName(`J${i}`);
      names.push(n);
      await join(pages[i], n);
    }

    // El primero es host y hay 7 conectados.
    await pages[0].waitForFunction(() => window.__GAME_STATE__.roster.filter((p) => p.connected).length === 7);
    expect(await pages[0].evaluate(() => window.__GAME_STATE__.isHost)).toBe(true);

    await pages[0].evaluate(() => window.__NET__.start());
    await pages[0].waitForFunction(() => window.__GAME_STATE__.mode === 'playing');

    const teams = await pages[0].evaluate(() => window.__GAME_STATE__.teams);
    const sizes = [teams.red.length, teams.blue.length].sort((a, b) => a - b);
    expect(sizes).toEqual([3, 4]);

    // Los 7 quedaron repartidos, sin repetidos.
    const all = [...teams.red, ...teams.blue].sort();
    expect(all).toEqual([...names].sort());

    // Todos los clientes están en la partida.
    for (const p of pages) {
      await p.waitForFunction(() => window.__GAME_STATE__.mode === 'playing');
    }
  } finally {
    for (const c of contexts) await c.close();
  }
});

test('si se van todos, la partida termina y el servidor vuelve al lobby', async ({ browser }) => {
  // 1) Arrancar una partida de 2 y abandonarla por completo.
  const c1 = await browser.newContext();
  const c2 = await browser.newContext();
  const p1 = await c1.newPage();
  const p2 = await c2.newPage();
  await boot(p1);
  await boot(p2);
  await join(p1, uniqueName('AbandA'));
  await join(p2, uniqueName('AbandB'));
  await p1.waitForFunction(() => window.__GAME_STATE__.roster.filter((x) => x.connected).length === 2);
  await p1.evaluate(() => window.__NET__.start());
  await p1.waitForFunction(() => window.__GAME_STATE__.mode === 'playing');

  await c1.close();
  await c2.close();

  // 2) Alguien nuevo entra: debe ver el LOBBY (no un mapa huérfano) y la sala limpia.
  const c3 = await browser.newContext();
  const p3 = await c3.newPage();
  try {
    await boot(p3);
    await join(p3, uniqueName('Recien'));

    await p3.waitForFunction(() => window.__GAME_STATE__.mode === 'menu');
    await p3.waitForFunction(() => window.__GAME_STATE__.roster.length === 1);

    const roster = await p3.evaluate(() => window.__GAME_STATE__.roster);
    expect(roster.length).toBe(1, 'la sala abandonada debe quedar limpia');
    expect(roster[0].connected).toBe(true);
    expect(await p3.evaluate(() => window.__GAME_STATE__.isHost)).toBe(true);

    // Y el lobby está en pantalla (no el mapa), con 1 jugador: todavía no puede empezar.
    const escena = await p3.evaluate(() =>
      window.__GAME__.scene.getScenes(true).map((s) => s.scene.key)
    );
    expect(escena).toContain('LobbyScene');
    expect(await p3.evaluate(() => window.__GAME_STATE__.canStart)).toBe(false);
  } finally {
    await c3.close();
  }
});
