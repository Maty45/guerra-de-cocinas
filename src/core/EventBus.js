// =============================================================================
// EventBus — singleton pub/sub. Todos los módulos se comunican por acá.
// Nombres de evento con formato `domain:action`.
// =============================================================================

export const Events = {
  // Red (NetworkManager -> resto)
  NET_CONNECTED: 'net:connected',
  NET_DISCONNECTED: 'net:disconnected',
  NET_ERROR: 'net:error',
  NET_ROSTER: 'net:roster',
  NET_MATCH_START: 'net:match-start',
  NET_STATE: 'net:state',
  NET_MATCH_END: 'net:match-end',

  // Lobby
  LOBBY_JOINED: 'lobby:joined',
  LOBBY_HOST_CHANGED: 'lobby:host-changed',

  // Ciclo de juego
  GAME_START: 'game:start',
  GAME_OVER: 'game:over',
  GAME_RESTART: 'game:restart',
  SCORE_CHANGED: 'score:changed',

  // Partículas / efectos
  PARTICLES_EMIT: 'particles:emit',

  // Spectacle (hooks visuales — la pasada de diseño engancha efectos)
  SPECTACLE_ENTRANCE: 'spectacle:entrance',
  SPECTACLE_ACTION: 'spectacle:action',
  SPECTACLE_HIT: 'spectacle:hit',
  SPECTACLE_COMBO: 'spectacle:combo',
  SPECTACLE_STREAK: 'spectacle:streak',
  SPECTACLE_NEAR_MISS: 'spectacle:near_miss',

  // Audio (los usa la pasada de audio)
  AUDIO_INIT: 'audio:init',
  MUSIC_MENU: 'music:menu',
  MUSIC_GAMEPLAY: 'music:gameplay',
  MUSIC_GAMEOVER: 'music:gameover',
  MUSIC_STOP: 'music:stop',
  AUDIO_TOGGLE_MUTE: 'audio:toggleMute',
};

class EventBus {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return this;
  }

  off(event, callback) {
    if (!this.listeners[event]) return this;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    return this;
  }

  emit(event, data) {
    if (!this.listeners[event]) return this;
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        console.error(`EventBus error in ${event}:`, err);
      }
    });
    return this;
  }

  removeAll() {
    this.listeners = {};
    return this;
  }
}

export const eventBus = new EventBus();
