// =============================================================================
// tests/server/lobby.test.js — Milestone 01
//
// Tests de la lógica del lobby (sin red, sin navegador):
//  - sorteo de equipos lo más parejo posible (7 -> 4 y 3)
//  - migración de host al desconectarse el host
//  - reconexión por nombre (recupera slot y equipo)
//  - mínimo de jugadores para empezar
//  - la IP LAN se resuelve a una IPv4 no interna
// =============================================================================

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Lobby, splitTeams, normalizeName } from '../../server/lobby.js';
import { lanAddress } from '../../server/net.js';
import { MIN_PLAYERS } from '../../shared/constants.js';

// RNG determinista para que el sorteo sea reproducible en el test.
function seededRng(seed = 42) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

test('sortea 4 y 3 con 7 jugadores', () => {
  const names = ['ana', 'beto', 'carla', 'dani', 'eze', 'flor', 'gaby'];
  const { red, blue } = splitTeams(names, seededRng(7));

  const sizes = [red.length, blue.length].sort((a, b) => a - b);
  assert.deepEqual(sizes, [3, 4], 'debe repartir 4 y 3');

  // Sin jugadores repetidos ni perdidos.
  const all = [...red, ...blue].sort();
  assert.deepEqual(all, [...names].sort());
});

test('el sorteo es aleatorio (no siempre el mismo reparto)', () => {
  const names = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
  const results = new Set();
  for (let i = 0; i < 25; i++) {
    const { red } = splitTeams(names, seededRng(i + 1));
    results.add([...red].sort().join(','));
  }
  assert.ok(results.size > 1, 'el reparto debe variar entre partidas');
});

test('el host es el primero en entrar', () => {
  const lobby = new Lobby();
  lobby.addPlayer('s1', 'Ana');
  lobby.addPlayer('s2', 'Beto');
  lobby.addPlayer('s3', 'Carla');

  assert.equal(lobby.host.name, 'Ana');
});

test('migración de host: al caerse el host pasa al siguiente más antiguo', () => {
  const lobby = new Lobby();
  lobby.addPlayer('s1', 'Ana');
  lobby.addPlayer('s2', 'Beto');
  lobby.addPlayer('s3', 'Carla');

  const { hostChanged } = lobby.disconnect('s1');
  assert.equal(hostChanged, true);
  assert.equal(lobby.host.name, 'Beto');

  // El jugador caído sigue en el roster, pero desconectado.
  const ana = lobby.players.find(p => p.name === 'Ana');
  assert.equal(ana.connected, false);
});

test('reconexión por nombre: recupera su slot y su equipo', () => {
  const lobby = new Lobby();
  lobby.addPlayer('s1', 'Ana');
  lobby.addPlayer('s2', 'Beto');
  lobby.addPlayer('s3', 'Carla');

  lobby.assignTeams();
  const ana = lobby.players.find(p => p.name === 'Ana');
  const teamAntes = ana.team;

  lobby.disconnect('s1');
  const { player, reconnected } = lobby.addPlayer('s9', '  aNa  '); // nombre sucio + mayúsculas

  assert.equal(reconnected, true);
  assert.equal(player.id, ana.id, 'mismo slot de jugador');
  assert.equal(player.team, teamAntes, 'conserva el equipo');
  assert.equal(player.connected, true);
  assert.equal(lobby.players.length, 3, 'no se duplica el jugador');
});

test('empezar requiere un mínimo de jugadores', () => {
  const lobby = new Lobby();
  assert.equal(lobby.canStart(), false);

  lobby.addPlayer('s1', 'Ana');
  assert.equal(lobby.canStart(), false, `con 1 jugador (< ${MIN_PLAYERS}) no se puede`);

  lobby.addPlayer('s2', 'Beto');
  assert.equal(lobby.canStart(), true);
});

test('reset() vacía la sala (el servidor vuelve al lobby limpio)', () => {
  const lobby = new Lobby();
  lobby.addPlayer('s1', 'Ana');
  lobby.addPlayer('s2', 'Beto');
  lobby.disconnect('s1');

  lobby.reset();

  assert.deepEqual(lobby.players, [], 'no debe quedar ningún jugador');
  assert.equal(lobby.host, null, 'sin jugadores no hay host');
  assert.equal(lobby.canStart(), false);
  assert.deepEqual(lobby.roster(), []);

  // Y la sala queda usable de cero (host = primero en entrar).
  const { player } = lobby.addPlayer('s7', 'Nueva');
  assert.equal(lobby.host.id, player.id);
});

test('normalizeName limpia y unifica mayúsculas', () => {
  assert.equal(normalizeName('  Ana  '), 'ana');
  assert.equal(normalizeName('ANA'), normalizeName('ana'));
});

test('lanAddress devuelve una IPv4 no interna (o localhost como fallback)', () => {
  const ip = lanAddress();
  assert.match(ip, /^\d{1,3}(\.\d{1,3}){3}$/, 'debe ser una IPv4');
});
