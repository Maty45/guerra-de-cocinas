// =============================================================================
// server/loop.js — loop de simulación temporal.
// Separado de la lógica para poder testearlo con timers simulados.
// =============================================================================

export function createLoop(fn, intervalMs) {
  let timer = null;

  return {
    start() {
      if (timer !== null) return; // no duplicar
      timer = setInterval(fn, intervalMs);
    },
    stop() {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    },
    get running() {
      return timer !== null;
    },
  };
}
