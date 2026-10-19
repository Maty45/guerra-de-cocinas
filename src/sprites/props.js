// =============================================================================
// src/sprites/props.js — olla, mesadas y piso (tiles de fondo).
// =============================================================================

import { IDX } from './palette.js';

const {
  OUTLINE: O, SHADOW: S, STEEL: T, STEEL_LIGHT: L, BROTH: B, BROTH_HL: BH,
  COUNTER: C, FLOOR: F, FLOOR_VAR: F2, STEEL_SH: ST, WOOD_HL: WH,
  WOOD: WD, WOOD_SH: S2, IRON: D, COPPER: P, COPPER_HL: PH, COPPER_SH: PS,
  ENAMEL: E, ENAMEL_SH: ES, CHROME: CH, GOLD: G, YELLOW: Y,
} = IDX;

// --- Olla de cobre (20x20) — vista 3/4: borde brillante, asas y caldo --------
export const POT_PIXELS = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, O, O, O, O, O, O, O, O, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, O, PH, PH, PH, PH, PH, PH, PH, PH, O, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, O, PH, PH, PH, PH, PH, PH, PH, PH, PH, PH, O, 0, 0, 0, 0],
  [0, 0, 0, O, P, P, PH, PH, PH, PH, PH, PH, PH, PH, P, P, O, 0, 0, 0],
  [0, 0, 0, O, P, B, B, B, B, B, B, B, B, B, B, P, O, 0, 0, 0],
  [0, 0, 0, O, P, BH, B, B, B, B, B, B, B, B, B, P, O, 0, 0, 0],
  [0, 0, 0, O, PH, BH, BH, B, B, B, B, B, B, B, B, PH, O, 0, 0, 0],
  [0, O, O, O, P, BH, BH, B, B, B, B, B, B, B, B, P, O, O, O, 0],
  [0, O, PH, O, P, B, B, B, B, B, B, B, B, B, B, P, O, PH, O, 0],
  [0, O, O, O, P, B, B, B, B, B, B, B, B, B, B, P, O, O, O, 0],
  [0, 0, 0, O, P, B, B, B, B, B, B, B, B, B, B, P, O, 0, 0, 0],
  [0, 0, 0, O, P, B, B, B, B, B, B, B, B, B, B, P, O, 0, 0, 0],
  [0, 0, 0, O, P, P, P, P, P, P, P, P, P, P, P, P, O, 0, 0, 0],
  [0, 0, 0, 0, O, P, P, P, P, P, P, P, P, P, P, O, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, O, PS, PS, PS, PS, PS, PS, PS, PS, O, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, O, O, O, O, O, O, O, O, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

const _floorRow = (arr) => arr;

// --- Piso (16x16) — dos variantes de motas para romper la repetición
export const FLOOR_A = [
  _floorRow([F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F2]),
  _floorRow([F, F, F, F2, F, F, F, F, F, F, F, F, F, F2, F, F2]),
  _floorRow([F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F2]),
  _floorRow([F, F, F, F, F, F2, F, F, F, F, F, F, F, F, F, F2]),
  _floorRow([F, F2, F, F, F, F, F, F, F, F, F, F, F, F, F, F2]),
  _floorRow([F, F, F, F, F, F, F, F, F, F, F2, F, F, F, F, F2]),
  _floorRow([F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F2]),
  _floorRow([F, F, F, F, F, F, F, F, F, F, F, F, F2, F, F, F2]),
  _floorRow([F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F2]),
  _floorRow([F, F, F, F2, F, F, F, F, F, F, F, F, F, F, F, F2]),
  _floorRow([F, F, F, F, F, F, F, F, F, F2, F, F, F, F, F, F2]),
  _floorRow([F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F2]),
  _floorRow([F, F, F, F, F, F2, F, F, F, F, F, F, F, F, F, F2]),
  _floorRow([F, F, F, F, F, F, F, F, F, F, F, F, F, F, F2, F2]),
  _floorRow([F2, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F2]),
  _floorRow([F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F2]),
];

export const FLOOR_B = [
  _floorRow([F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F2]),
  _floorRow([F, F, F, F, F, F, F, F, F, F2, F, F, F, F, F, F2]),
  _floorRow([F, F, F2, F, F, F, F, F, F, F, F, F, F, F, F, F2]),
  _floorRow([F, F, F, F, F, F, F, F, F, F, F, F, F2, F, F, F2]),
  _floorRow([F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F2]),
  _floorRow([F, F2, F, F, F, F, F, F, F, F, F, F, F, F, F, F2]),
  _floorRow([F, F, F, F, F, F, F, F, F2, F, F, F, F, F, F, F2]),
  _floorRow([F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F2]),
  _floorRow([F, F, F, F, F, F2, F, F, F, F, F, F, F, F, F, F2]),
  _floorRow([F, F, F, F, F, F, F, F, F, F, F, F, F, F2, F, F2]),
  _floorRow([F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F2]),
  _floorRow([F, F2, F, F, F, F, F, F, F2, F, F, F, F, F, F, F2]),
  _floorRow([F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F2]),
  _floorRow([F, F, F, F, F, F, F, F, F, F, F2, F, F, F, F, F2]),
  _floorRow([F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F2]),
  _floorRow([F2, F2, F2, F2, F2, F2, F2, F2, F2, F2, F2, F2, F2, F2, F2, F2]),
];

// --- Mesada (16x16) — tabla de cocina clara con veta y borde iluminado ------
export const COUNTER_A = [
  [WH, WH, WH, WH, WH, WH, WH, WH, WH, WH, WH, WH, WH, WH, WH, WH],
  [C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C],
  [C, C, C, S, C, C, C, C, C, C, C, C, C, C, C, C],
  [C, C, C, C, C, C, S, S, C, C, C, C, C, C, C, C],
  [C, C, C, C, C, C, C, C, C, C, C, S, C, C, C, C],
  [S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S],
  [C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C],
  [C, C, C, C, C, C, S, C, C, C, C, C, C, S, C, C],
  [C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C],
  [C, C, S, C, C, C, C, C, C, C, S, S, C, C, C, C],
  [C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C],
  [S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S],
  [C, C, C, C, C, S, C, C, C, C, C, C, C, C, C, C],
  [C, C, C, C, C, C, C, C, C, S, C, C, C, C, C, C],
  [C, C, C, C, C, C, C, C, C, C, C, C, C, C, C, C],
  [S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S],
];

export const FLOOR_TILES = [FLOOR_A, FLOOR_B];
export const COUNTER_TILES = [COUNTER_A];
export const TILE_GRID = 16;

// --- Frente de mesada (16x16) — tablas verticales con junta y sombra ---------
export const COUNTER_FACE_A = [
  [WH, WH, WH, WH, WH, WH, WH, WH, WH, WH, WH, WH, WH, WH, WH, WH],
  [WD, WD, WD, WD, WD, S2, WD, WD, WD, WD, WD, S2, WD, WD, WD, WD],
  [WD, WD, WD, WD, WD, S2, WD, WD, WD, WD, WD, S2, WD, WD, WD, WD],
  [WD, WD, WD, WD, WD, S2, WD, WD, WD, WD, WD, S2, WD, WD, WD, WD],
  [WD, WD, WD, WD, WD, S2, WD, WD, WD, WD, WD, S2, WD, WD, WD, WD],
  [WD, WD, WD, WD, WD, S2, WD, WD, WD, WD, WD, S2, WD, WD, WD, WD],
  [WD, WD, WD, WD, WD, S2, WD, WD, WD, WD, WD, S2, WD, WD, WD, WD],
  [WD, WD, WD, WD, WD, S2, WD, WD, WD, WD, WD, S2, WD, WD, WD, WD],
  [WD, WD, WD, WD, WD, S2, WD, WD, WD, WD, WD, S2, WD, WD, WD, WD],
  [WD, WD, WD, WD, WD, S2, WD, WD, WD, WD, WD, S2, WD, WD, WD, WD],
  [WD, WD, WD, WD, WD, S2, WD, WD, WD, WD, WD, S2, WD, WD, WD, WD],
  [WD, WD, WD, WD, WD, S2, WD, WD, WD, WD, WD, S2, WD, WD, WD, WD],
  [WD, WD, WD, WD, WD, S2, WD, WD, WD, WD, WD, S2, WD, WD, WD, WD],
  [WD, WD, WD, WD, WD, S2, WD, WD, WD, WD, WD, S2, WD, WD, WD, WD],
  [WD, WD, WD, WD, WD, S2, WD, WD, WD, WD, WD, S2, WD, WD, WD, WD],
  [S2, S2, S2, S2, S2, S2, S2, S2, S2, S2, S2, S2, S2, S2, S2, S2],
];

export const COUNTER_FACE_TILES = [COUNTER_FACE_A];

// --- Cocina/hornalla bajo la olla (28x20) ------------------------------------
// Vista 3/4: hornalla de hierro, borde cromado y panel de esmalte con perillas.
const stoveRow = (vals) => vals;

export const STOVE_PIXELS = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, O, O, O, O, O, O, O, O, O, O, O, O, O, O, O, O, O, O, O, O, O, O, 0, 0, 0],
  [0, 0, O, CH, CH, CH, CH, CH, CH, CH, CH, CH, CH, CH, CH, CH, CH, CH, CH, CH, CH, CH, CH, CH, CH, O, 0, 0],
  [0, O, CH, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, CH, O, 0],
  [0, O, CH, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, CH, O, 0],
  [0, O, CH, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, CH, O, 0],
  [0, O, CH, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, CH, O, 0],
  [0, O, CH, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, CH, O, 0],
  [0, O, CH, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, CH, O, 0],
  [0, O, CH, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, CH, O, 0],
  [0, O, CH, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, CH, O, 0],
  [0, O, CH, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, D, CH, O, 0],
  [0, O, CH, CH, CH, CH, CH, CH, CH, CH, CH, CH, CH, CH, CH, CH, CH, CH, CH, CH, CH, CH, CH, CH, CH, CH, O, 0],
  [0, O, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, O, 0],
  [0, O, E, E, E, E, E, D, D, E, E, E, E, E, D, D, E, E, E, E, E, D, D, E, E, E, O, 0],
  [0, O, E, E, E, E, E, D, D, E, E, E, E, E, D, D, E, E, E, E, E, D, D, E, E, E, O, 0],
  [0, O, ES, ES, ES, ES, ES, ES, ES, ES, ES, ES, ES, ES, ES, ES, ES, ES, ES, ES, ES, ES, ES, ES, ES, ES, O, 0],
  [0, 0, 0, O, O, O, O, O, O, O, O, O, O, O, O, O, O, O, O, O, O, O, O, O, O, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

// --- Estrellitas de aturdimiento (7x7) ---------------------------------------
export const STAR_PIXELS = [
  [0, 0, 0, G, 0, 0, 0],
  [0, 0, G, Y, G, 0, 0],
  [G, G, Y, Y, Y, G, G],
  [0, G, Y, Y, Y, G, 0],
  [0, 0, Y, Y, Y, 0, 0],
  [0, G, Y, 0, Y, G, 0],
  [0, G, 0, 0, 0, G, 0],
];

// --- Humo verde (contaminación) — 12x12, se dibuja translúcido
export const SMOKE_PIXELS = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 10, 10, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 10, 10, 10, 10, 0, 0, 0, 0, 0],
  [0, 0, 10, 10, 10, 10, 10, 10, 0, 0, 0, 0],
  [0, 10, 10, 10, 10, 10, 10, 10, 10, 0, 0, 0],
  [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 0, 0],
  [0, 10, 10, 10, 10, 10, 10, 10, 10, 0, 0, 0],
  [0, 0, 10, 10, 10, 10, 10, 10, 0, 0, 0, 0],
  [0, 0, 0, 10, 10, 10, 10, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 10, 10, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

// --- Charco de aceite — 16x16, oscuro con reflejos dorados
export const PUDDLE_PIXELS = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0],
  [0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0],
  [0, 2, 2, 2, 12, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0],
  [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 12, 2, 2, 2, 2, 0],
  [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0],
  [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0],
  [0, 2, 2, 2, 2, 12, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0],
  [0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0],
  [0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0],
  [0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

export const SMOKE_GRID = 12;
export const PUDDLE_GRID = 16;
