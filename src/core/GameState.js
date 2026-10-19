// =============================================================================
// GameState — estado central del CLIENTE. Se alimenta de los mensajes del
// servidor (estado autoritativo). Nunca contiene lógica de juego.
// =============================================================================

class GameState {
  constructor() {
    this.isMuted = localStorage.getItem('muted') === 'true';
    this.reset();
  }

  reset() {
    // Conexión
    this.connected = false;

    // Identidad / lobby
    this.selfId = null;
    this.selfName = null;
    this.isHost = false;
    this.canStart = false;
    this.roster = [];        // [{ id, name, team, connected, isHost }]

    this.resetMatch();
  }

  /** Limpia SÓLO el estado de la partida (conserva identidad / conexión). */
  resetMatch() {
    this.started = false;
    this.gameOver = false;
    this.mode = 'menu';      // 'menu' | 'playing' | 'game_over'
    this.teams = { red: [], blue: [] };
    this.score = { red: 0, blue: 0 };
    this.timeLeft = null;    // segundos
    this.phase = 'playing';  // 'playing' | 'sudden_death' | 'game_over'
    this.winner = null;      // 'red' | 'blue' | null
    this.saboteur = null;    // id del que más acertó
    this.order = { red: null, blue: null };  // comanda actual por equipo

    // Entidades (pobladas por el estado del servidor)
    this.tick = 0;
    this.players = {};       // id -> { name, team, x, y, stunned, slipping, carrying }
    this.ingredients = [];   // [{ id, kind, x, y }]
    this.pots = { red: null, blue: null };  // { contents, contaminated, cooking, progress, x, y }
    this.tomatoes = [];      // [{ id, x, y, team }]
    this.oil = null;         // { x, y } | null (power-up en el piso)
    this.puddles = [];       // [{ id, x, y, remaining }]
  }

  setRoster(roster) {
    this.roster = Array.isArray(roster) ? roster : [];
    const me = this.roster.find((p) => p.id === this.selfId);
    if (me) this.isHost = !!me.isHost;
  }

  /** Aplica un snapshot de estado del servidor (milestone 02+). */
  applyServerState(state) {
    if (!state) return;
    if (typeof state.t === 'number') this.tick = state.t;
    if (state.score) this.score = state.score;
    if (typeof state.timeLeft === 'number') this.timeLeft = state.timeLeft;
    if (state.phase) this.phase = state.phase;
    if ('winner' in state) this.winner = state.winner;
    if ('saboteur' in state) this.saboteur = state.saboteur;
    if (state.order) this.order = state.order;
    if (state.players) this.players = state.players;
    if (state.ingredients) this.ingredients = state.ingredients;
    if (state.pots) this.pots = state.pots;
    if ('oil' in state) this.oil = state.oil;
    if (state.tomatoes) this.tomatoes = state.tomatoes;
    if (state.puddles) this.puddles = state.puddles;
    if (state.mode) {
      this.mode = state.mode;
      this.gameOver = state.mode === 'game_over';
      this.started = state.mode === 'playing';
    }
  }
}

export const gameState = new GameState();
