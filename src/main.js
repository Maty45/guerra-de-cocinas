import Phaser from 'phaser';
import { GameConfig } from './core/GameConfig.js';
import { eventBus, Events } from './core/EventBus.js';
import { gameState } from './core/GameState.js';
import { networkManager } from './core/NetworkManager.js';
import { initAudioBridge } from './audio/AudioBridge.js';
import { audioManager } from './audio/AudioManager.js';

const game = new Phaser.Game(GameConfig);

// --- Audio: cablea EventBus -> Web Audio (música + SFX) ----------------------
initAudioBridge();

// --- Exposición para Playwright / agentes -----------------------------------
window.__GAME__ = game;
window.__GAME_STATE__ = gameState;
window.__EVENT_BUS__ = eventBus;
window.__EVENTS__ = Events;
window.__NET__ = networkManager;
window.__AUDIO__ = audioManager;

// --- Snapshot de estado legible por agentes (sin mirar píxeles) --------------
window.render_game_to_text = () => {
  if (!game || !gameState) return JSON.stringify({ error: 'not_ready' });

  const activeScenes = game.scene.getScenes(true).map(s => s.scene.key);
  const payload = {
    // Sistema de coordenadas: origen arriba-izquierda, x hacia la derecha, y hacia abajo
    coords: 'origin:top-left x:right y:down',
    mode: gameState.gameOver ? 'game_over' : gameState.started ? 'playing' : 'menu',
    scene: activeScenes[0] || null,
    scenes: activeScenes,
    connected: gameState.connected,
    selfId: gameState.selfId,
    selfName: gameState.selfName,
    isHost: gameState.isHost,
    canStart: gameState.canStart,
    roster: gameState.roster.map(p => ({ name: p.name, team: p.team, connected: p.connected, isHost: p.isHost })),
    score: gameState.score,
    timeLeft: gameState.timeLeft,
    phase: gameState.phase,
    winner: gameState.winner,
    saboteur: gameState.saboteur,
    tick: gameState.tick,
    order: gameState.order,
    pots: gameState.pots,
    ingredients: gameState.ingredients,
    tomatoes: gameState.tomatoes,
    oil: gameState.oil,
    puddles: gameState.puddles,
    players: gameState.players,
  };

  return JSON.stringify(payload);
};

// --- Hook de avance determinista para scripts de test ------------------------
window.advanceTime = (ms) => {
  return new Promise((resolve) => {
    const start = performance.now();
    function step() {
      if (performance.now() - start >= ms) return resolve();
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
};
