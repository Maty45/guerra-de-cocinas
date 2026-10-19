// =============================================================================
// server/lobby.js — roster, host, reconexión y sorteo de equipos.
//
// Lógica pura (sin sockets): el transporte la usa desde server/index.js. Así se
// puede testear con `node --test` sin abrir un servidor.
//
// Identidad: un jugador se identifica por NOMBRE normalizado (trim +
// case-insensitive). Al reconectar con el mismo nombre recupera su slot y su
// equipo.
// =============================================================================

import { MIN_PLAYERS } from '../shared/constants.js';

/** Normaliza un nombre para comparar identidades. */
export function normalizeName(name) {
  return String(name ?? '').trim().toLowerCase();
}

/** Fisher-Yates sobre una copia (no muta el input). */
export function shuffle(array, rng = Math.random) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Reparte nombres en dos equipos lo más parejo posible.
 * Con un total impar, el equipo "red" se queda con el jugador extra (7 -> 4 y 3).
 */
export function splitTeams(names, rng = Math.random) {
  const shuffled = shuffle(names, rng);
  const redCount = Math.ceil(shuffled.length / 2);
  return {
    red: shuffled.slice(0, redCount),
    blue: shuffled.slice(redCount),
  };
}

export class Lobby {
  constructor({ rng = Math.random } = {}) {
    this.rng = rng;
    /** @type {Array<{id,name,normName,team,connected,socketId,joinedAt}>} en orden de ingreso */
    this.players = [];
    this._joinedCounter = 0;
  }

  /** Solo los conectados. */
  get connectedPlayers() {
    return this.players.filter((p) => p.connected);
  }

  /** El host = jugador conectado más antiguo. */
  get host() {
    const connected = this.connectedPlayers;
    if (connected.length === 0) return null;
    return connected.reduce((a, b) => (a.joinedAt <= b.joinedAt ? a : b));
  }

  findByName(name) {
    const n = normalizeName(name);
    return this.players.find((p) => p.normName === n) || null;
  }

  findBySocket(socketId) {
    return this.players.find((p) => p.socketId === socketId) || null;
  }

  /**
   * Alta o reconexión.
   * @returns {{ player?: object, reconnected?: boolean, error?: string }}
   */
  addPlayer(socketId, name) {
    const cleaned = String(name ?? '').trim();
    if (!cleaned) return { error: 'name_required' };

    const existing = this.findByName(cleaned);
    if (existing) {
      // Reconexión: recupera su slot y conserva su equipo.
      existing.socketId = socketId;
      existing.connected = true;
      return { player: existing, reconnected: true };
    }

    this._joinedCounter += 1;
    const player = {
      id: `p${this._joinedCounter}`,
      name: cleaned,
      normName: normalizeName(cleaned),
      team: null,
      connected: true,
      socketId,
      joinedAt: this._joinedCounter,
    };
    this.players.push(player);
    return { player, reconnected: false };
  }

  /**
   * Marca a un jugador como desconectado (NO lo saca del roster).
   * @returns {{ player: object|null, hostChanged: boolean, host: object|null }}
   */
  disconnect(socketId) {
    const player = this.findBySocket(socketId);
    if (!player) return { player: null, hostChanged: false, host: this.host };

    const wasHost = this.host?.id === player.id;
    player.connected = false;
    player.socketId = null;

    return { player, hostChanged: wasHost, host: this.host };
  }

  canStart() {
    return this.connectedPlayers.length >= MIN_PLAYERS;
  }

  /** Termina la sesión: vacía el roster (ya no queda nadie en la sala). */
  reset() {
    this.players = [];
    this._joinedCounter = 0;
  }

  /** Sortea equipos entre los conectados y los persiste en cada jugador. */
  assignTeams() {
    const names = this.connectedPlayers.map((p) => p.name);
    const { red, blue } = splitTeams(names, this.rng);
    const redSet = new Set(red);
    for (const p of this.players) {
      if (!p.connected) continue;
      p.team = redSet.has(p.name) ? 'red' : 'blue';
    }
    return { red, blue };
  }

  /** Snapshot serializable para el cliente. */
  roster() {
    const hostId = this.host?.id ?? null;
    return this.players.map((p) => ({
      id: p.id,
      name: p.name,
      team: p.team,
      connected: p.connected,
      isHost: p.id === hostId,
    }));
  }
}
