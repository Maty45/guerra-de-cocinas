// =============================================================================
// tests/server/match.test.js — Milestone 05
// Timer de 5:00, fin por tiempo, empate -> muerte súbita, saboteador del partido
// y revancha (reasignación de equipos + partida limpia). Lógica pura.
// =============================================================================

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Game } from '../../server/game.js';
import { Lobby } from '../../server/lobby.js';
import { MATCH_SECONDS, TICK_MS } from '../../shared/constants.js';

const DT = TICK_MS / 1000;
const steps = (s) => Math.round(s / DT);

function nuevo() {
  const g = new Game({ rng: () => 0.5 });
  g.addPlayer('a', { name: 'A', team: 'red' });
  g.addPlayer('b', { name: 'B', team: 'blue' });
  return g;
}

test('timer 300', () => {
  const g = nuevo();
  assert.equal(g.timeLeft, MATCH_SECONDS, 'arranca en 5:00');
  assert.equal(g.phase, 'playing');

  for (let i = 0; i < steps(1); i += 1) g.step(DT);

  assert.ok(
    Math.abs(g.timeLeft - (MATCH_SECONDS - 1)) < 0.06,
    `baja 1 s por segundo (timeLeft=${g.timeLeft})`
  );
  assert.equal(g.phase, 'playing');
  assert.equal(g.winner, null);
});

test('gana el de mas platos', () => {
  const g = nuevo();
  g.score.red = 3;
  g.score.blue = 1;
  g.timeLeft = DT;

  g.step(DT);

  assert.equal(g.phase, 'game_over');
  assert.equal(g.winner, 'red');

  // Congelado: en game_over no avanza la simulación.
  const t = g.tick;
  for (let i = 0; i < 5; i += 1) g.step(DT);
  assert.equal(g.tick, t, 'en game_over la simulación está congelada');
});

test('muerte subita', () => {
  const g = nuevo();
  g.score.red = 2;
  g.score.blue = 2;
  g.timeLeft = DT;

  g.step(DT);

  assert.equal(g.phase, 'sudden_death', 'empate -> muerte súbita');
  assert.equal(g.winner, null);
  assert.equal(g.timeLeft, 0, 'el reloj se detiene en la muerte súbita');

  // El PRIMER plato que se termine gana.
  const rec = g.currentRecipe('blue');
  for (const k of rec.ingredients) g.loadPot('blue', k);
  for (let i = 0; i < steps(6); i += 1) {
    g.step(DT);
    if (g.phase === 'game_over') break;
  }

  assert.equal(g.winner, 'blue', 'gana el que sirve el primer plato');
  assert.equal(g.phase, 'game_over');
  assert.equal(g.score.blue, 3);
});

test('saboteador del partido (mas tomatazos acertados)', () => {
  const g = nuevo();
  assert.equal(g.saboteurId(), null, 'sin impactos no hay saboteador');

  g.players.get('a').tomatoesHit = 2;
  g.players.get('b').tomatoesHit = 1;
  assert.equal(g.saboteurId(), 'a');

  g.players.get('b').tomatoesHit = 3;
  assert.equal(g.saboteurId(), 'b');
});

test('revancha resorteo', () => {
  let calls = 0;
  const rng = () => {
    calls += 1;
    return 0.42;
  };
  const lobby = new Lobby({ rng });
  for (const n of ['A', 'B', 'C', 'D']) lobby.addPlayer(`s${n}`, n);

  const t1 = lobby.assignTeams();
  assert.equal(t1.red.length + t1.blue.length, 4);
  const after1 = calls;
  assert.ok(after1 > 0, 'el primer sorteo usa azar');

  const t2 = lobby.assignTeams();
  assert.ok(calls > after1, 'la revancha vuelve a sortear');
  assert.equal(t2.red.length + t2.blue.length, 4);

  // La partida nueva arranca limpia.
  const g = new Game({ rng });
  for (const p of lobby.connectedPlayers) g.addPlayer(p.id, { name: p.name, team: p.team });
  assert.equal(g.score.red, 0);
  assert.equal(g.score.blue, 0);
  assert.equal(g.timeLeft, MATCH_SECONDS);
  assert.equal(g.phase, 'playing');
  assert.equal(g.winner, null);
});
