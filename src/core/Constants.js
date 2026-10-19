// =============================================================================
// src/core/Constants.js — constantes de PRESENTACIÓN del cliente (Phaser).
// Los números de juego viven en /shared/constants.js y se re-exportan acá para
// que el cliente y el servidor hablen exactamente el mismo idioma.
// =============================================================================

import { GAME_WIDTH, GAME_HEIGHT, POT_RADIUS, OIL_RADIUS } from '../../shared/constants.js';

export * from '../../shared/constants.js';

// --- Display (retina / escalado) --------------------------------------------
// DPR capado a 2 por performance en GPUs integradas.
export const DPR = Math.min(window.devicePixelRatio || 1, 2);

// Espacio de diseño lógico fijo (16:9). El servidor simula en estas unidades.
const _designW = GAME_WIDTH;   // 1280
const _designH = GAME_HEIGHT;  // 720
const _designAspect = _designW / _designH;

// Resolución real del canvas = área del device, manteniendo el aspecto de diseño.
const _deviceW = window.innerWidth * DPR;
const _deviceH = window.innerHeight * DPR;

let _canvasW, _canvasH;
if (_deviceW / _deviceH > _designAspect) {
  _canvasW = _deviceW;
  _canvasH = Math.round(_deviceW / _designAspect);
} else {
  _canvasW = Math.round(_deviceH * _designAspect);
  _canvasH = _deviceH;
}

// PX = píxeles de canvas por unidad de diseño.
export const PX = _canvasW / _designW;

export const GAME = {
  WIDTH: _canvasW,
  HEIGHT: _canvasH,
  DESIGN_WIDTH: _designW,
  DESIGN_HEIGHT: _designH,
  GRAVITY: 0, // top-down: sin gravedad
};

// --- Safe Zone ---------------------------------------------------------------
// Sin Play.fun: no hay insets. Se mantiene el objeto para que cualquier UI use
// SAFE_ZONE y para satisfacer validate-architecture.mjs.
export const SAFE_ZONE = {
  TOP: 0,
  BOTTOM: 0,
  LEFT: 0,
  RIGHT: 0,
};

// --- Paleta ------------------------------------------------------------------
export const COLORS = {
  // Equipos
  TEAM_RED: 0xd62828,
  TEAM_BLUE: 0x1d6fb8,
  // Zonas del mapa (tintes claros sobre el piso blanco)
  KITCHEN_RED: 0xff8a80,
  KITCHEN_BLUE: 0x7fb0ff,
  PANTRY: 0xcfcabb,
  COUNTER: 0x6b5b4a,
  FLOOR: 0x1a1a1f,
  // Cocina (milestone 03)
  POT_RED: 0x8a1f1f,
  POT_BLUE: 0x154a7a,
  POT_RIM: 0x2b2b33,
  SMOKE: 0x6fdc6f,
  BAR_BG: 0x000000,
  BAR_FILL: 0xffd166,
  // Sabotaje (milestone 04)
  TOMATO: 0xe63946,
  OIL_ITEM: 0xd9a521,
  PUDDLE: 0x5a4718,
  STUN: 0xffffff,
  STUN_STAR: 0xffd166,
  STOVE_GLOW: 0xff9a3c,
  // Juice (milestone 06)
  PLATE: 0xffd166,
  STEAM: 0xb9c7da,
  TIP: 0x9c7a4a,
  // UI
  UI_TEXT: '#ffffff',
  UI_MUTED: '#9aa0b5',
  UI_SHADOW: '#000000',
  ACCENT: '#ffd700',
  // Botones
  PANEL: 0x141420,
  BTN_PRIMARY: 0x6c63ff,  BTN_PRIMARY_HOVER: 0x857dff,
  BTN_PRIMARY_PRESS: 0x5a52d5,
  BTN_DISABLED: 0x3a3a4a,
  BTN_TEXT: '#ffffff',
};

// --- Ingredientes (color por tipo, sólo presentación) ------------------------
export const INGREDIENT_COLORS = {
  masa: 0xe8d9a0,
  tomate: 0xe63946,
  queso: 0xf4d35e,
  pan: 0xc98c4a,
  carne: 0x8d3b3b,
  lechuga: 0x57cc63,
  papa: 0xcbb27a,
  huevo: 0xf5f0e1,
  aceite: 0xd9a521,
};

// --- Medidas de cocina (unidades de diseño, se escalan con PX) ---------------
export const COOKING = {
  INGREDIENT_RADIUS: 14,
  SMOKE_RADIUS: 26,
  BAR_W: 56,
  BAR_H: 8,
  CARRIED_OFFSET: 28,
  CARRIED_RADIUS: 9,
  CONTENT_RADIUS: 7,
  CONTENT_GAP: 18,
  BAR_OFFSET: 34,
  BAR_GAP: 12,
  CONTENT_SCALE: 0.62,
  CONTENT_Y_RATIO: 0.12,   // respecto al radio de la olla (caldo un poco arriba)
  OIL_ITEM_RADIUS: 20,
};

// --- Jugador (presentación) --------------------------------------------------
// El radio real de colisión lo define el servidor; esto es solo el tamaño visual.
export const PLAYER = {
  RADIUS: GAME.DESIGN_WIDTH * 0.022,
  COLOR: COLORS.TEAM_BLUE,
};

// --- Tamaño de display de los sprites de pixel art (unidades de diseño) ------
// Se multiplican por PX/sx al dibujar. Factores respecto a los radios de juego
// para que el arte quede proporcionado a la caja de colisión.
export const SPRITE_SIZES = {
  PLAYER: PLAYER.RADIUS * 2.3,
  INGREDIENT: COOKING.INGREDIENT_RADIUS * 2.8,
  TOMATO: COOKING.INGREDIENT_RADIUS * 1.6,
  OIL: OIL_RADIUS * 2.0,
  POT: POT_RADIUS * 2.5,
  CARRIED: COOKING.CARRIED_RADIUS * 2.4,
  PUDDLE: OIL_RADIUS * 2.0,
};

// --- Comanda del HUD (ticket de papel con la receta) ------------------------
export const TICKET = {
  W: 320,
  H: 52,
  MARGIN: 16,
  TOP: 10,
  HEADER_H: 16,
  RADIUS: 6,
  BORDER: 2,
  PAPER: 0xfdf6e3,
  LINE: 0x8a6a45,
  SHADOW_ALPHA: 0.16,
  SHADOW_OFFSET: 3,
  TAPE_W: 52,
  TAPE_H: 10,
  TAPE_ROT: -4,
  TAPE_COLOR: 0xffe9a8,
  TITLE_SIZE: 13,
  NAME_SIZE: 19,
  NAME_X: 10,
  NAME_Y: 19,
  ICON_SIZE: 24,
  ICON_GAP: 8,
  ICON_X: 170,
  ICON_Y: 33,
  MAX_ICONS: 3,
  TEXT_X: 10,
  DASH_Y: 4,
  DASH_STEP: 12,
  DASH_LEN: 6,
  DASH_PAD: 8,
};

// --- Decoración del escenario (props sobre las mesadas) ---------------------
export const DECOR = {
  BOARD_W: 52,
  BOARD_H: 18,
  BOARD_ROT: -4,
  BOARD_COLOR: 0xc98a4b,
  BOARD_EDGE: 0x8a5a2e,
  KNIFE_W: 28,
  KNIFE_H: 5,
  KNIFE_COLOR: 0xdfe6ee,
  KNIFE_EDGE: 0x9aa6b2,
  KNIFE_HANDLE_W: 10,
  KNIFE_HANDLE_COLOR: 0x4a3b2a,
  BOWL_W: 34,
  BOWL_H: 18,
  BOWL_COLOR: 0xdfe6ee,
  BOWL_EDGE: 0x9aa6b2,
  BOWL_INNER: 0.58,
  BOWL_STEW: 0x8a4a24,
  BOWL_SPOON_ROT: -24,
  PLATE_W: 34,
  PLATE_H: 10,
  PLATE_COUNT: 3,
  PLATE_STEP: 5,
  PLATE_COLOR: 0xeef2f6,
  PLATE_EDGE: 0x9aa6b2,
  HERB_POT_W: 24,
  HERB_POT_H: 16,
  HERB_POT_COLOR: 0xb5653a,
  HERB_POT_EDGE: 0x7a3f22,
  HERB_LEAF: 9,
  HERB_LEAF_Y: 1.1,
  HERB_COLOR: 0x4e8f4a,
  HERB_COLOR2: 0x6fb35a,
  SHADOW_ALPHA: 0.12,
  SHADOW_W: 1.08,
  SHADOW_H: 0.5,
  SHADOW_DY: 0.4,
};

// --- Sombras de contacto (profundidad) --------------------------------------
export const SHADOW = {
  ALPHA: 0.22,
  POT_W: 1.5,   // respecto al tamaño de la olla
  POT_H: 0.5,
  POT_Y: 0.42,
  AVATAR_W: 0.62, // respecto al tamaño del avatar
  AVATAR_H: 0.22,
  AVATAR_Y: 0.36,
};

// --- Escenario con volumen (cocinas y mesadas) ------------------------------
// La olla se apoya sobre una hornalla y las mesadas muestran su frente de
// madera, para que el campo se lea como una cocina y no como cajas planas.
export const STAGE = {
  STOVE_Y_RATIO: 0.26,       // respecto al tamaño de la olla
  STOVE_W_RATIO: 1.45,
  STOVE_H_RATIO: 1.05,
  GLOW_Y_RATIO: 0.16,
  GLOW_SIZE_RATIO: 0.62,
  GLOW_ALPHA: 0.22,
  GLOW_PULSE: 0.06,
  COUNTER_FACE_RATIO: 0.38,
  COUNTER_SHADOW_Y: 4,
  COUNTER_SHADOW_H: 0.16,
  COUNTER_SHADOW_ALPHA: 0.12,
  COUNTER_LINE: 2,
  COUNTER_LINE_ALPHA: 0.4,
  RUG_W_RATIO: 1.7,
  RUG_H_RATIO: 0.7,
  RUG_ALPHA: 0.2,
};

// --- Aturdimiento (tomatazo) ------------------------------------------------
export const STUN_FX = {
  STARS: 3,
  STAR_SIZE: 0.36,      // respecto al tamaño del avatar
  STAR_ORBIT: 0.5,
  STAR_SQUASH: 0.45,
  STAR_Y: 1.02,
  POP_MS: 160,
  POP_SCALE: 0.4,
  SPIN_MS: 1300,
  SPIN_DEG: 360,
  WOBBLE_DEG: 9,
  WOBBLE_MS: 130,
};

// --- Animación de sprites ----------------------------------------------------
export const SPRITE_ANIM = {
  WALK_FPS: 8,
};

// --- Modo automatización (Playwright) ---------------------------------------
// En E2E el cliente renderiza a baja frecuencia: los tests verifican estado,
// no animación, y así no se satura la máquina.
export const AUTOMATION = {
  RENDER_FPS: 20,
};

// --- Profundidades de render (draw order) ------------------------------------
export const DEPTH = {
  FLOOR: -10,
  ZONE: -9,
  ZONE_LABEL: -8,
  COUNTER: -5,
  PUDDLE: 1,
  ITEM: 2,
  OIL: 2,
  POT: 3,
  TOMATO: 4,
  PLAYER: 5,
  FX: 6,
  FLOAT: 7,
  HUD: 10,
  OVERLAY: 20,
};

// --- Onboarding (instrucciones al principio) ---------------------------------
export const ONBOARDING = {
  LINGER: 5200, // ms que queda visible el recordatorio al empezar la partida
  FADE: 600,
};

// --- Juice (partículas, shake, texto flotante) ------------------------------
// Todos los números de los efectos viven acá (la lógica sólo los consume).
export const FX = {
  // Estallido radial de partículas
  BURST_COUNT: 10,
  BURST_RADIUS: 3,
  BURST_SPEED: 90,
  BURST_SPEED_RANDOM: 60,
  BURST_LIFE: 420,
  BURST_LIFE_RANDOM: 180,
  BURST_SCALE: 0.2,
  // Anillo que se expande
  RING_RADIUS: 16,
  RING_GROW: 40,
  RING_LIFE: 320,
  // Sacudida de cámara
  SHAKE_SERVE: 0.007,
  SHAKE_HIT: 0.005,
  SHAKE_TIP: 0.006,
  SHAKE_CONTAMINATE: 0.004,
  SHAKE_DURATION: 180,
  // Texto flotante (+1, ¡ZAS!)
  FLOAT_LIFE: 820,
  FLOAT_RISE: 36,
  FLOAT_SIZE: 26,
  // Vapor continuo mientras cocina
  STEAM_INTERVAL: 150,
  STEAM_RISE: 42,
  STEAM_LIFE: 780,
  STEAM_SIZE: 9,
  STEAM_ALPHA: 0.6,
  // Pulso del HUD al cambiar el marcador
  HUD_POP_SCALE: 1.16,
  HUD_POP_LIFE: 160,
  // Splash de tomate
  SPLASH_COUNT: 9,
  SPLASH_GRAVITY: 18,
  // Olla cocinando: latido suave
  POT_PULSE_SPEED: 0.006,
  POT_PULSE_AMOUNT: 0.03,
  // Transición de escena al terminar
  GAME_OVER_FADE: 420,
};


// --- UI ----------------------------------------------------------------------
export const UI = {
  FONT: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  TEXT_STROKE: 6,
  LINE_SPACING: 6,
  NAME_MAX_LEN: 12,
  AVATAR_NAME_OFFSET: 12,
  TITLE_RATIO: 0.1,
  HEADING_RATIO: 0.06,
  BODY_RATIO: 0.04,
  SMALL_RATIO: 0.028,
  BTN_W_RATIO: 0.4,
  BTN_H_RATIO: 0.09,
  BTN_RADIUS: 12 * PX,
  BTN_SHAKE_OFFSET: 10,
  BTN_SHAKE_DURATION: 60,
  BTN_SHAKE_REPEAT: 2,
  MIN_TOUCH: 44 * PX,
  // Texto de ayuda debajo de un botón deshabilitado (ej: "faltan jugadores").
  HINT_RATIO: 0.024,
  HINT_Y_RATIO: 0.925,
  HINT_PULSE_SCALE: 1.12,
  HINT_PULSE_DURATION: 180,
  // Etiqueta con el nombre del ingrediente en el piso.
  ITEM_LABEL_RATIO: 0.022,
  ITEM_LABEL_OFFSET: 0.62,
  // Texto sobre el piso claro.
  FIELD_TEXT: '#33333f',
  FIELD_MUTED: '#4a4a58',
};

// --- Transiciones ------------------------------------------------------------
export const TRANSITION = {
  FADE_DURATION: 350,
};
