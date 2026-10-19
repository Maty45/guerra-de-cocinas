// =============================================================================
// NetworkManager — capa de red del cliente.
//
// Sólo TRANSPORTA: conecta el WebSocket, manda mensajes y traduce lo que llega
// a eventos del EventBus + estado en GameState. Cero lógica de juego.
//
// Para el render suave guarda los dos últimos snapshots (prev/curr) y una marca
// de tiempo, para que el cliente INTERPOLE entre ticks.
// =============================================================================

import { eventBus, Events } from './EventBus.js';
import { gameState } from './GameState.js';
import { WS_PATH, TICK_MS } from './Constants.js';
import { MSG } from '../../shared/protocol.js';

class NetworkManager {
  constructor() {
    this.socket = null;
    this.name = null;
    this._pendingJoin = null;

    // Interpolación (Milestone 02)
    this.prev = null;      // snapshot anterior de jugadores
    this.curr = null;      // snapshot actual
    this.currAt = 0;       // performance.now() al recibir `curr`
    this.serverTick = 0;

    // Diagnóstico / tests
    this.inputSends = 0;   // cuántos `input` se mandaron (debe ser ~1 por cambio)
    this.actionSends = 0;  // cuántas acciones de Espacio se mandaron
    this._matchEndEmitted = false;
  }

  connect() {
    if (this.socket &&
        (this.socket.readyState === WebSocket.OPEN ||
         this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${proto}://${location.host}${WS_PATH}`;
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      gameState.connected = true;
      eventBus.emit(Events.NET_CONNECTED);
      if (this._pendingJoin) {
        this._send({ type: MSG.JOIN, name: this._pendingJoin });
        this._pendingJoin = null;
      }
    };
    this.socket.onclose = () => {
      gameState.connected = false;
      eventBus.emit(Events.NET_DISCONNECTED);
    };
    this.socket.onerror = () => eventBus.emit(Events.NET_ERROR, { code: 'socket_error' });
    this.socket.onmessage = (e) => this._onMessage(e.data);
  }

  join(name) {
    const clean = String(name ?? '').trim();
    if (!clean) return;
    this.connect();
    this.name = clean;
    gameState.selfName = clean;
    if (this.socket?.readyState === WebSocket.OPEN) {
      this._send({ type: MSG.JOIN, name: clean });
    } else {
      this._pendingJoin = clean; // se manda al abrir
    }
  }

  start() {
    this._send({ type: MSG.START });
  }

  /** Revancha (solo el host): el servidor reinicia y vuelve a sortear equipos. */
  rematch() {
    this._send({ type: MSG.REMATCH });
  }

  /** Hook de test (ALLOW_TEST_HOOKS en el server): termina la partida ya. */
  testEndMatch(winner = 'red') {
    this._send({ type: MSG.TEST, action: 'endMatch', winner });
  }

  /** Hook de test: teletransporta a un jugador (por nombre/id; null = uno mismo). */
  testPlace(target, x, y) {
    this._send({ type: MSG.TEST, action: 'place', target, x, y });
  }

  /** Manda el estado de las teclas SÓLO cuando cambia (lo decide el que llama). */
  sendInput(keys) {
    this.inputSends += 1;
    this._send({
      type: MSG.INPUT,
      keys: {
        up: !!keys?.up,
        down: !!keys?.down,
        left: !!keys?.left,
        right: !!keys?.right,
      },
    });
  }

  /** Manda una acción de Espacio (decidida al soltar: tap u hold). */
  sendAction(kind) {
    this.actionSends += 1;
    this._send({ type: MSG.ACTION, kind });
  }

  _send(obj) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(obj));
    }
  }

  _enterMatch() {
    gameState.started = true;
    gameState.mode = 'playing';
    eventBus.emit(Events.NET_MATCH_START);
  }

  _onMessage(raw) {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    switch (msg.type) {
      case MSG.HELLO:
        break;

      case MSG.WELCOME:
        gameState.selfId = msg.you?.id ?? null;
        gameState.selfName = msg.you?.name ?? gameState.selfName;
        gameState.isHost = !!msg.isHost;
        gameState.canStart = !!msg.canStart;
        if (msg.roster) gameState.setRoster(msg.roster);
        eventBus.emit(Events.LOBBY_JOINED, msg);
        // Reconexión con partida en curso: entrar directo a la partida.
        if (msg.mode === 'playing') this._enterMatch();
        break;

      case MSG.ROSTER:
        gameState.canStart = !!msg.canStart;
        gameState.setRoster(msg.roster);
        if (msg.hostId) gameState.isHost = msg.roster.some((p) => p.id === msg.hostId && p.id === gameState.selfId);
        eventBus.emit(Events.NET_ROSTER, msg);
        break;

      case MSG.MATCH_START:
        gameState.resetMatch();
        gameState.teams = msg.teams;
        this._matchEndEmitted = false;
        this._enterMatch();
        break;

      case MSG.STATE:
        this.prev = this.curr;
        this.curr = msg.players;
        this.currAt = performance.now();
        this.serverTick = msg.t ?? this.serverTick + 1;
        gameState.applyServerState(msg);
        eventBus.emit(Events.NET_STATE, msg);
        if (gameState.mode === 'game_over' && !this._matchEndEmitted) {
          this._matchEndEmitted = true;
          eventBus.emit(Events.NET_MATCH_END, msg);
        }
        break;

      case MSG.ERROR:
        console.warn('[net] error del servidor:', msg.code);
        eventBus.emit(Events.NET_ERROR, msg);
        break;

      default:
        break;
    }
  }

  /**
   * Posiciones interpoladas para renderizar: mezcla prev->curr según el tiempo
   * transcurrido desde que llegó `curr`.
   * @returns {Record<string, {x:number,y:number}>}
   */
  interpolated(now = performance.now()) {
    if (!this.curr) return {};
    const alpha = Math.min(1, (now - this.currAt) / TICK_MS);
    const out = {};
    for (const id of Object.keys(this.curr)) {
      const c = this.curr[id];
      const p = this.prev?.[id] ?? c;
      out[id] = {
        x: p.x + (c.x - p.x) * alpha,
        y: p.y + (c.y - p.y) * alpha,
      };
    }
    return out;
  }
}

export const networkManager = new NetworkManager();
