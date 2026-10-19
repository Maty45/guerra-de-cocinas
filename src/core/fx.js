// =============================================================================
// src/core/fx.js — detección PURA de eventos visuales (juice) a partir de dos
// snapshots consecutivos del servidor.
//
// Igual que `audio/cues.js`: sin Phaser ni DOM, testeable con `node --test`.
// El cliente recibe el estado completo a 20 Hz; acá derivamos qué efecto
// corresponde mirando QUÉ CAMBIÓ entre el snapshot anterior y el nuevo.
//
// Devuelve descriptors en coordenadas LÓGICAS del servidor (1280x720); la
// escena los escala al dibujar.
// =============================================================================

const TEAMS = ['red', 'blue'];

/**
 * @param {object|null} prev  snapshot anterior del servidor
 * @param {object|null} next  snapshot nuevo
 * @returns {Array<{type:string, x:number, y:number, team?:string, text?:string}>}
 */
export function diffFx(prev, next) {
  const out = [];
  if (!prev || !next) return out;

  const pp = prev.players || {};
  const np = next.players || {};
  const ps = prev.score || {};
  const ns = next.score || {};

  // --- Ollas: plato servido, volcado, contaminación y arranque de cocción ---
  for (const team of TEAMS) {
    const pot = next.pots?.[team];
    if (!pot) continue;
    const before = prev.pots?.[team];
    const served = (ns[team] || 0) > (ps[team] || 0);

    if (served) {
      out.push({ type: 'serve', team, x: pot.x, y: pot.y, text: '+1' });
    } else if (before && before.contents.length > 0 && pot.contents.length === 0) {
      // Se vació sin sumar plato: alguien la volcó (hold) o se descartó.
      out.push({ type: 'tip', team, x: pot.x, y: pot.y });
    }

    if (pot.contaminated && !before?.contaminated) {
      out.push({ type: 'contaminate', team, x: pot.x, y: pot.y });
    }
    if (pot.cooking && !before?.cooking) {
      out.push({ type: 'cookstart', team, x: pot.x, y: pot.y });
    }
  }

  // --- Tomates: impacto (desaparece el proyectil) ---------------------------
  const nextTom = new Set((next.tomatoes || []).map((t) => t.id));
  for (const t of prev.tomatoes || []) {
    if (nextTom.has(t.id)) continue;
    out.push({ type: 'splash', x: t.x, y: t.y });
  }

  // --- Jugadores: aturdido y resbalón ---------------------------------------
  for (const id of Object.keys(np)) {
    const p = np[id];
    const before = pp[id];
    if (!before) continue;
    if (p.stunned && !before.stunned) out.push({ type: 'impact', x: p.x, y: p.y });
    if (p.slipping && !before.slipping) out.push({ type: 'slip', x: p.x, y: p.y });
  }

  return out;
}
