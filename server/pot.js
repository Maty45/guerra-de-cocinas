// =============================================================================
// server/pot.js — lógica de la olla PURA (sin red, sin timers, sin estado global).
//
// Requisito explícito §11 del spec: testeable con `node --test` sin navegador.
//
// Reglas:
//   - El contenido de la olla es una lista ordenada de hasta 3 ingredientes.
//   - Coincide con la receta si el CONJUNTO es igual (el orden no importa).
//   - Si aparece un ingrediente ajeno a la receta, o uno REPETIDO, la olla queda
//     CONTAMINADA y no cocina hasta que se vacíe.
//   - Una olla cocinando o contaminada no acepta más ingredientes.
// =============================================================================

import { COOK_SECONDS } from '../shared/constants.js';

const EPSILON = 1e-6;

function clamp01(v) {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

export function createPot(team = null) {
  return {
    team,
    contents: [],
    contaminated: false,
    cooking: false,
    cookRemaining: 0,
    cookTotal: 0,
  };
}

/**
 * ¿El contenido es un subconjunto VÁLIDO de la receta?
 * (todos los ingredientes pertenecen a la receta y ninguno se repite)
 */
export function isSubsetValid(contents, recipeIngredients) {
  const permitidos = new Set(recipeIngredients);
  const vistos = new Set();
  for (const kind of contents) {
    if (!permitidos.has(kind)) return false; // ingrediente ajeno
    if (vistos.has(kind)) return false;      // repetido
    vistos.add(kind);
  }
  return true;
}

/** ¿El contenido coincide EXACTAMENTE (como conjunto) con la receta? */
export function matchesRecipe(contents, recipeIngredients) {
  if (contents.length !== recipeIngredients.length) return false;
  if (!isSubsetValid(contents, recipeIngredients)) return false;
  return new Set(contents).size === new Set(recipeIngredients).size;
}

/**
 * Inserta un ingrediente y re-evalúa la olla.
 * @returns {{ ok:boolean, reason?:string, contaminated?:boolean, cooking?:boolean }}
 */
export function insert(pot, kind, recipeIngredients, cookSeconds = COOK_SECONDS) {
  if (pot.cooking) return { ok: false, reason: 'cooking' };
  if (pot.contaminated) return { ok: false, reason: 'contaminated' };
  if (typeof kind !== 'string' || kind.length === 0) return { ok: false, reason: 'invalid' };

  pot.contents.push(kind);

  if (!isSubsetValid(pot.contents, recipeIngredients)) {
    pot.contaminated = true;
    pot.cooking = false;
    pot.cookRemaining = 0;
    pot.cookTotal = 0;
    return { ok: true, contaminated: true, cooking: false };
  }

  if (matchesRecipe(pot.contents, recipeIngredients)) {
    pot.cooking = true;
    pot.cookRemaining = cookSeconds;
    pot.cookTotal = cookSeconds;
    return { ok: true, contaminated: false, cooking: true };
  }

  return { ok: true, contaminated: false, cooking: false };
}

/** Vacía la olla y limpia la contaminación (se pierde el contenido). */
export function empty(pot) {
  pot.contents = [];
  pot.contaminated = false;
  pot.cooking = false;
  pot.cookRemaining = 0;
  pot.cookTotal = 0;
}

/**
 * Avanza la cocción.
 * @returns {boolean} true si el plato TERMINÓ de cocinarse en este avance.
 */
export function advance(pot, dt) {
  if (!pot.cooking) return false;
  pot.cookRemaining -= dt;
  if (pot.cookRemaining <= EPSILON) {
    pot.cookRemaining = 0;
    return true;
  }
  return false;
}

/** Progreso de cocción [0..1]. */
export function progress(pot) {
  if (!pot.cooking || !pot.cookTotal) return 0;
  return clamp01(1 - pot.cookRemaining / pot.cookTotal);
}

/** Saca y devuelve el último ingrediente puesto (para robar — milestone 04). */
export function stealLast(pot) {
  if (pot.cooking) return null;
  return pot.contents.pop() ?? null;
}
