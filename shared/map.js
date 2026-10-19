// =============================================================================
// shared/map.js — layout del mapa (unidades de diseño 1280×720).
// Lo usan el SERVIDOR (colisiones) y el CLIENTE (render). Sin dependencias.
//
// Rectángulos en formato top-left: { id, x, y, w, h }.
// =============================================================================

import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';

const ZONE_W = GAME_WIDTH / 3;

export const ZONES = [
  { id: 'red', x: 0, w: ZONE_W },
  { id: 'pantry', x: ZONE_W, w: ZONE_W },
  { id: 'blue', x: ZONE_W * 2, w: ZONE_W },
];

export const COUNTERS = [
  // Cocina ROJA
  { id: 'red-top', x: 40, y: 60, w: 140, h: 36 },
  { id: 'red-bottom', x: 40, y: 624, w: 140, h: 36 },
  // Cocina AZUL
  { id: 'blue-top', x: 1100, y: 60, w: 140, h: 36 },
  { id: 'blue-bottom', x: 1100, y: 624, w: 140, h: 36 },
  // Despensa
  { id: 'pantry-top', x: 560, y: 120, w: 160, h: 36 },
  { id: 'pantry-bottom', x: 560, y: 564, w: 160, h: 36 },
  // Isla central
  { id: 'center', x: 580, y: 342, w: 120, h: 36 },
];

export const MAP = {
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  zones: ZONES,
  counters: COUNTERS,
};

// Ollas: una por equipo, en su cocina.
export const POTS = {
  red: { x: 110, y: 440 },
  blue: { x: 1170, y: 440 },
};

// Zona de la despensa: donde caen los ingredientes del piso.
export const PANTRY = { x: 460, y: 180, w: 360, h: 360 };

// Punto del centro donde aparece el power-up de aceite (accesible, no sobre la isla).
export const OIL_SPAWN = { x: 640, y: 470 };

// Puntos de la despensa garantizados libres de mesadas (reparto de ingredientes).
export const PANTRY_SPOTS = [
  { x: 500, y: 220 },
  { x: 780, y: 220 },
  { x: 500, y: 500 },
  { x: 780, y: 500 },
  { x: 480, y: 360 },
  { x: 800, y: 360 },
  { x: 640, y: 220 },
  { x: 640, y: 500 },
];

// Puntos de aparición por equipo (hasta 4 por lado).
export const SPAWNS = {
  red: [
    { x: 110, y: 200 },
    { x: 110, y: 360 },
    { x: 300, y: 200 },
    { x: 300, y: 360 },
  ],
  blue: [
    { x: 1170, y: 200 },
    { x: 1170, y: 360 },
    { x: 980, y: 200 },
    { x: 980, y: 360 },
  ],
};
