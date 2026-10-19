// =============================================================================
// src/audio/cues.js — detección PURA de "cues" de audio a partir de dos
// snapshots consecutivos del servidor.
//
// Sin Web Audio ni DOM: es lógica pura y se testea con `node --test`.
// El cliente recibe el estado completo a 20 Hz; acá derivamos qué sonidos
// corresponden comparando el snapshot anterior con el nuevo.
// =============================================================================

/**
 * @param {object|null} prev  snapshot anterior del servidor
 * @param {object|null} next  snapshot nuevo
 * @returns {string[]} lista de cues: 'plate' | 'throw' | 'hit' | 'contaminate' | 'stun'
 */
export function diffCues(prev, next) {
  const cues = [];
  if (!prev || !next) return cues;

  // Plato servido: subió el marcador de algún equipo.
  const ps = prev.score || {};
  const ns = next.score || {};
  if ((ns.red || 0) > (ps.red || 0) || (ns.blue || 0) > (ps.blue || 0)) cues.push('plate');

  // Tomate lanzado: apareció un id nuevo en el aire.
  const prevTom = new Set((prev.tomatoes || []).map((t) => t.id));
  const nextTom = new Set((next.tomatoes || []).map((t) => t.id));
  let appeared = false;
  for (const id of nextTom) {
    if (!prevTom.has(id)) { appeared = true; break; }
  }
  if (appeared) cues.push('throw');

  // Impacto: desapareció un tomate Y algún jugador sumó un acierto.
  let removed = false;
  for (const id of prevTom) {
    if (!nextTom.has(id)) { removed = true; break; }
  }
  let hit = false;
  const pp = prev.players || {};
  const np = next.players || {};
  for (const id of Object.keys(np)) {
    const before = pp[id]?.tomatoesHit ?? 0;
    const after = np[id]?.tomatoesHit ?? 0;
    if (after > before) { hit = true; break; }
  }
  if (removed && hit) cues.push('hit');

  // Olla contaminada: pasó de limpia a contaminada.
  for (const team of ['red', 'blue']) {
    if (next.pots?.[team]?.contaminated && !prev.pots?.[team]?.contaminated) cues.push('contaminate');
  }

  // Aturdido: algún jugador pasó a stunned.
  for (const id of Object.keys(np)) {
    if (np[id]?.stunned && !pp[id]?.stunned) cues.push('stun');
  }

  return cues;
}
