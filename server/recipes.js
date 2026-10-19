// =============================================================================
// server/recipes.js — las 4 recetas y la secuencia de comandas COMPARTIDA.
//
// La secuencia es una sola y la misma para los dos equipos (gameplan: "justo").
// Cada equipo avanza su propio índice a su ritmo.
//
//   Pizza:       masa,  tomate, queso
//   Hamburguesa: pan,   carne,  lechuga
//   Tortilla:    papa,  huevo,  queso
//   Ensalada:    lechuga, tomate, huevo
// =============================================================================

export const RECIPES = [
  { id: 'pizza', name: 'Pizza', ingredients: ['masa', 'tomate', 'queso'] },
  { id: 'hamburguesa', name: 'Hamburguesa', ingredients: ['pan', 'carne', 'lechuga'] },
  { id: 'tortilla', name: 'Tortilla', ingredients: ['papa', 'huevo', 'queso'] },
  { id: 'ensalada', name: 'Ensalada', ingredients: ['lechuga', 'tomate', 'huevo'] },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

/** Los 8 ingredientes distintos (deduplicados y en orden de aparición). */
export const INGREDIENT_KINDS = [...new Set(RECIPES.flatMap((r) => r.ingredients))];

/** Secuencia compartida de comandas (se repite en ciclo). */
export const ORDER_SEQUENCE = RECIPES.map((r) => r.id);

/** Receta correspondiente al índice de comanda `index` (cíclico). */
export function recipeForOrder(index) {
  const i = ((index % ORDER_SEQUENCE.length) + ORDER_SEQUENCE.length) % ORDER_SEQUENCE.length;
  return RECIPE_BY_ID[ORDER_SEQUENCE[i]];
}
