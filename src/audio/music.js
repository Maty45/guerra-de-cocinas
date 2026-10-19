// =============================================================================
// src/audio/music.js — música de fondo procedural (secuenciador Web Audio API).
//
// Un step-sequencer agenda notas por adelantado (look-ahead) → timing estable
// sin drift. Sin Strudel, sin dependencias, sin archivos.
// Cada patrón devuelve { stop() }.
// =============================================================================

const NOTES = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99,
  R: 0,
};

const SCHEDULE_AHEAD = 0.1;   // segundos que se agendan por adelantado
const SCHEDULE_POLL = 25;     // ms entre chequeos del scheduler
const INITIAL_BUFFER = 0.05;  // pequeño colchón inicial

/** Convierte "C4 R E4 G4" en objetos de nota. */
function parsePattern(str, type = 'square', gain = 0.15, lpf = 3000) {
  return str.split(' ').filter(Boolean).map((n) => {
    if (n === 'R' || n === '~') return { freq: 0 };
    return { freq: NOTES[n] || 0, type, gain, lpf };
  });
}

/**
 * Secuenciador por pasos.
 * @param {AudioContext} ctx
 * @param {GainNode} dest
 * @param {Array<Array<{freq:number,type?:string,gain?:number,lpf?:number}>>} layers
 * @param {number} bpm
 * @param {number} stepsPerBeat
 */
function sequencer(ctx, dest, layers, bpm, stepsPerBeat = 2) {
  const stepDuration = 60 / bpm / stepsPerBeat;
  let nextStepTime = ctx.currentTime + INITIAL_BUFFER;
  let stepIndex = 0;
  let stopped = false;
  let timerId = null;

  function scheduleStep() {
    if (stopped) return;
    while (nextStepTime < ctx.currentTime + SCHEDULE_AHEAD) {
      for (const layer of layers) {
        const note = layer[stepIndex % layer.length];
        if (note && note.freq > 0) {
          const osc = ctx.createOscillator();
          osc.type = note.type || 'square';
          osc.frequency.setValueAtTime(note.freq, nextStepTime);

          const g = ctx.createGain();
          const noteGain = note.gain ?? 0.15;
          g.gain.setValueAtTime(noteGain, nextStepTime);
          g.gain.exponentialRampToValueAtTime(0.001, nextStepTime + stepDuration * 0.9);

          const f = ctx.createBiquadFilter();
          f.type = 'lowpass';
          f.frequency.setValueAtTime(note.lpf || 3000, nextStepTime);

          osc.connect(f).connect(g).connect(dest);
          osc.start(nextStepTime);
          osc.stop(nextStepTime + stepDuration);
        }
      }
      stepIndex += 1;
      nextStepTime += stepDuration;
    }
    timerId = setTimeout(scheduleStep, SCHEDULE_POLL);
  }

  scheduleStep();
  return { stop() { stopped = true; if (timerId) clearTimeout(timerId); } };
}

// --- Pistas ------------------------------------------------------------------

/** Lobby: tranquila y expectante. */
export function menuBGM(ctx, dest) {
  return sequencer(ctx, dest, [
    parsePattern('C4 R E4 R G4 R E4 R F4 R A4 R G4 R E4 R', 'triangle', 0.12, 2400),
    parsePattern('C3 R R R G3 R R R F3 R R R C3 R R R', 'sine', 0.16, 600),
    parsePattern('C5 R G5 R E5 R C5 R F4 R A4 R G4 R E4 R', 'sine', 0.04, 1400),
  ], 112, 2);
}

/** Partida: enérgica, tipo arcade de cocina. */
export function gameplayBGM(ctx, dest) {
  return sequencer(ctx, dest, [
    parsePattern('C4 E4 G4 E4 C4 D4 E4 C4 D4 F4 A4 F4 D4 E4 F4 D4', 'square', 0.13, 2200),
    parsePattern('C3 R C3 R G3 R G3 R F3 R F3 R C3 R C3 R', 'triangle', 0.18, 500),
    parsePattern('C5 E5 G5 E5 C5 E5 G5 E5 D5 F4 A4 F4 D5 F4 A4 F4', 'square', 0.04, 1000),
    parsePattern('C3 R R R C3 R R R C3 R R R C3 R R R', 'sine', 0.22, 200),
  ], 132, 2);
}

/** Fin de partida: lenta y descendente. */
export function gameOverBGM(ctx, dest) {
  return sequencer(ctx, dest, [
    parsePattern('B4 R A4 R G4 R E4 R D4 R C4 R R R R R', 'triangle', 0.18, 1800),
    parsePattern('A3 A3 A3 A3 A3 A3 A3 A3 A3 A3 A3 A3 A3 A3 A3 A3', 'sine', 0.1, 1200),
  ], 60, 2);
}
