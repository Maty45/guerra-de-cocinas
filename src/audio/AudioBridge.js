// =============================================================================
// src/audio/AudioBridge.js — cablea el EventBus con el motor de audio.
//
// Es el ÚNICO punto que traduce eventos del juego a sonido. Los módulos no
// conocen el audio: sólo emiten eventos (regla de arquitectura del proyecto).
// =============================================================================

import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { audioManager } from './AudioManager.js';
import { menuBGM, gameplayBGM, gameOverBGM } from './music.js';
import {
  plateSfx, throwSfx, hitSfx, pickupSfx, dropSfx, contaminateSfx, stunSfx, startSfx,
} from './sfx.js';
import { diffCues } from './cues.js';

// Sonidos por cue derivado del estado.
const CUE_SFX = {
  plate: plateSfx,
  throw: throwSfx,
  hit: hitSfx,
  contaminate: contaminateSfx,
  stun: stunSfx,
};

let _inited = false;
let _prevState = null;

/**
 * Inicializa el puente de audio. Idempotente.
 */
export function initAudioBridge() {
  if (_inited) return;
  _inited = true;

  // En los E2E (Playwright) el audio se apaga para no gastar CPU sintetizando
  // sonido que nadie escucha. `audio.spec.js` lo reactiva con `__AUDIO_ALWAYS__`.
  const automated = typeof navigator !== 'undefined' && navigator.webdriver;
  if (automated && !window.__AUDIO_ALWAYS__) return;

  // El AudioContext requiere un gesto del usuario (política de autoplay).
  const unlock = () => { audioManager.init(); audioManager.resume(); };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });

  eventBus.on(Events.AUDIO_INIT, () => { audioManager.init(); audioManager.resume(); });

  // --- Mute (tecla M global + evento) con persistencia -----------------------
  audioManager.setMuted(gameState.isMuted);
  const toggleMute = () => {
    gameState.isMuted = !gameState.isMuted;
    try { localStorage.setItem('muted', String(gameState.isMuted)); } catch (_) { /* noop */ }
    audioManager.setMuted(gameState.isMuted);
    eventBus.emit(Events.AUDIO_TOGGLE_MUTE, gameState.isMuted);
  };
  window.addEventListener('keydown', (e) => {
    // En el lobby el nombre se escribe con el teclado: no interceptamos M ahí.
    if (gameState.selfId && e.key && e.key.toLowerCase() === 'm') toggleMute();
  });

  // --- Música de fondo -------------------------------------------------------
  eventBus.on(Events.MUSIC_MENU, () => audioManager.playMusic(menuBGM));
  eventBus.on(Events.MUSIC_GAMEPLAY, () => audioManager.playMusic(gameplayBGM));
  eventBus.on(Events.MUSIC_GAMEOVER, () => audioManager.playMusic(gameOverBGM));
  eventBus.on(Events.MUSIC_STOP, () => audioManager.stopMusic());

  // --- Fanfarria de arranque -------------------------------------------------
  eventBus.on(Events.NET_MATCH_START, () => startSfx());

  // --- Sonidos derivados del estado (20 Hz): comparamos snapshots ------------
  eventBus.on(Events.NET_STATE, (state) => {
    const cues = diffCues(_prevState, state);
    for (const cue of cues) {
      const fn = CUE_SFX[cue];
      if (fn) fn();
    }

    // Feedback inmediato del jugador local al agarrar / soltar.
    const me = state.players?.[gameState.selfId];
    const prevMe = _prevState?.players?.[gameState.selfId];
    if (me && prevMe) {
      if (!prevMe.carrying && me.carrying) pickupSfx();
      else if (prevMe.carrying && !me.carrying) dropSfx();
    }

    _prevState = state;
  });
}
