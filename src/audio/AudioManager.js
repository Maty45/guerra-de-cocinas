// =============================================================================
// src/audio/AudioManager.js — dueño del AudioContext y del master gain.
//
// Todo el audio (música + SFX) pasa por un único GainNode: subir/bajar el
// volumen o mutear es cambiar `masterGain.gain.value`. Sin dependencias.
//
// IMPORTANTE: el AudioContext nace 'suspended' hasta que haya un gesto real del
// usuario. No arrancamos el secuenciador hasta que esté 'running' (si no,
// gastaríamos CPU agendando notas que no suenan).
// =============================================================================

class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.currentBgm = null;
    this._lastMusicFn = null;
    this._pendingMusicFn = null;
    this.muted = false;
  }

  /** Crea el AudioContext + master gain. Idempotente; seguro si no hay Web Audio. */
  init() {
    if (this.ctx) return;
    const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
    if (!AC) return;
    try {
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 1;
      this.masterGain.connect(this.ctx.destination);
    } catch (err) {
      console.warn('[audio] no se pudo crear el AudioContext:', err);
      this.ctx = null;
    }
  }

  /** Reanuda el contexto (política de autoplay: requiere un gesto del usuario). */
  resume() {
    if (!this.ctx) return;
    const after = () => this._startPending();
    if (this.ctx.state === 'suspended') {
      const p = this.ctx.resume();
      if (p && typeof p.then === 'function') p.then(after).catch(() => {});
      else after();
    } else {
      after();
    }
  }

  getCtx() {
    if (!this.ctx) this.init();
    return this.ctx;
  }

  getMaster() {
    if (!this.masterGain) this.init();
    return this.masterGain;
  }

  /** Arranca una pista de fondo (fn = (ctx, dest) => { stop() }). */
  playMusic(fn) {
    this._lastMusicFn = fn;
    if (this.muted) return;
    this.stopMusic();
    if (!this.ctx || this.ctx.state !== 'running') {
      // El contexto aún no está activo: queda pendiente hasta `resume()`.
      this._pendingMusicFn = fn;
      return;
    }
    this._startMusic(fn);
  }

  _startMusic(fn) {
    const ctx = this.getCtx();
    const dest = this.getMaster();
    if (!ctx || !dest) return;
    this._pendingMusicFn = null;
    try {
      this.currentBgm = fn(ctx, dest);
    } catch (err) {
      console.warn('[audio] error de BGM:', err);
    }
  }

  _startPending() {
    if (this.muted) return;
    const fn = this._pendingMusicFn;
    if (!fn) return;
    if (!this.ctx || this.ctx.state !== 'running') return;
    this.stopMusic();
    this._startMusic(fn);
  }

  stopMusic() {
    if (this.currentBgm) {
      try { this.currentBgm.stop(); } catch (_) { /* noop */ }
      this.currentBgm = null;
    }
  }

  setMuted(muted) {
    this.muted = !!muted;
    if (this.masterGain) this.masterGain.gain.value = this.muted ? 0 : 1;
    // Mutear detiene la música (ahorra CPU); al desmutear se reanuda la última.
    if (this.muted) this.stopMusic();
    else if (this._lastMusicFn) this.playMusic(this._lastMusicFn);
  }
}

export const audioManager = new AudioManager();
