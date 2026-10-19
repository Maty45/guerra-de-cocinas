// =============================================================================
// shared/protocol.js — tipos de mensaje del WebSocket.
// Compartido por el servidor (Node) y el cliente (Phaser). Sin dependencias.
// =============================================================================

export const MSG = {
  // --- cliente -> servidor ---
  JOIN: 'join',   // { name }
  START: 'start', // {} (solo el host)
  REMATCH: 'rematch', // {} (solo el host) — reinicia y vuelve a sortear
  INPUT: 'input', // { keys: { up, down, left, right } } — solo al cambiar
  ACTION: 'action', // { kind: 'tap' | 'hold' | 'holdStop' | 'throw' }
  TEST: 'test',   // { action } — sólo disponible con ALLOW_TEST_HOOKS

  // --- servidor -> cliente ---
  HELLO: 'hello',             // { tickRate }
  WELCOME: 'welcome',         // { you, isHost, canStart, roster, hostId, mode }
  ROSTER: 'roster',           // { roster, hostId, canStart }
  MATCH_START: 'match_start', // { teams: { red: [names], blue: [names] } }
  STATE: 'state',             // { t, mode, phase, winner, saboteur, timeLeft, players, ... }
  ERROR: 'error',             // { code }
};
