// =============================================================================
// src/audio/sfx.js — efectos de sonido (one-shot) con Web Audio API.
//
// Cada SFX arma osciladores + gain + filtro y se autodestruye. Sin archivos.
// Si no hay AudioContext (o está suspendido) no hace nada: nunca rompe el juego.
// =============================================================================

import { audioManager } from './AudioManager.js';

const NOTES = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99,
};

/** Una nota corta. */
function playTone(freq, type, duration, gain = 0.3, filterFreq = 4000) {
  const ctx = audioManager.getCtx();
  const dest = audioManager.getMaster();
  if (!ctx || !dest) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + duration);

  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(filterFreq, now);

  osc.connect(f).connect(g).connect(dest);
  osc.start(now);
  osc.stop(now + duration);
}

/** Una secuencia de notas (melodía corta). */
function playNotes(notes, type, noteDuration, gap, gain = 0.3, filterFreq = 4000) {
  const ctx = audioManager.getCtx();
  const dest = audioManager.getMaster();
  if (!ctx || !dest) return;
  const now = ctx.currentTime;

  notes.forEach((freq, i) => {
    const start = now + i * gap;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);

    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + noteDuration);

    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(filterFreq, start);

    osc.connect(f).connect(g).connect(dest);
    osc.start(start);
    osc.stop(start + noteDuration);
  });
}

/** Ruido filtrado (impactos, splashes). */
function playNoise(duration, gain = 0.2, lpfFreq = 4000, hpfFreq = 0) {
  const ctx = audioManager.getCtx();
  const dest = audioManager.getMaster();
  if (!ctx || !dest) return;
  const now = ctx.currentTime;
  const size = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < size; i += 1) data[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + duration);

  const lpf = ctx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.setValueAtTime(lpfFreq, now);

  let chain = src.connect(lpf).connect(g);
  if (hpfFreq > 0) {
    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.setValueAtTime(hpfFreq, now);
    src.disconnect();
    chain = src.connect(hpf).connect(lpf).connect(g);
  }
  chain.connect(dest);
  src.start(now);
  src.stop(now + duration);
}

// --- SFX del juego -----------------------------------------------------------

/** Plato servido: arpegio ascendente y brillante. */
export function plateSfx() {
  playNotes([NOTES.C5, NOTES.E5, NOTES.G5], 'square', 0.12, 0.06, 0.28, 6000);
}

/** Tomate lanzado: whoosh de aire. */
export function throwSfx() {
  playNoise(0.16, 0.12, 6000, 900);
}

/** Tomatazo que impacta: golpe grave + splash de ruido. */
export function hitSfx() {
  playTone(90, 'square', 0.16, 0.3, 700);
  playNoise(0.14, 0.22, 1400, 300);
}

/** Levantar ingrediente: click corto y agudo. */
export function pickupSfx() {
  playTone(660, 'square', 0.06, 0.16, 5000);
}

/** Soltar / tirar: click más grave. */
export function dropSfx() {
  playTone(330, 'triangle', 0.07, 0.16, 4000);
}

/** Olla contaminada: descenso disonante. */
export function contaminateSfx() {
  playNotes([220, 185, 155], 'sawtooth', 0.16, 0.08, 0.22, 900);
}

/** Aturdido: buzz grave. */
export function stunSfx() {
  playTone(120, 'sawtooth', 0.2, 0.24, 800);
}

/** Arranque de partida: fanfarria corta. */
export function startSfx() {
  playNotes([NOTES.C4, NOTES.E4, NOTES.G4, NOTES.C5], 'square', 0.14, 0.09, 0.3, 6000);
}

/** Click de UI. */
export function clickSfx() {
  playTone(NOTES.C5, 'sine', 0.06, 0.2, 5000);
}

export { NOTES };
