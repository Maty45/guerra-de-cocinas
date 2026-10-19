// =============================================================================
// src/sprites/player.js — chef top-down por equipo.
//
// Vista frontal estilizada: gorro blanco de cocinero + delantal del color del
// equipo. 16x16 a escala 4. Los frames son [idle, walk1, idle, walk2]; el azul
// se genera recoloreando el rojo (base, brillo y sombra), así el arte se escribe
// una sola vez.
// =============================================================================

import { IDX } from './palette.js';
import { recolor } from '../core/PixelRenderer.js';

const {
  OUTLINE: O, SHADOW: S, RED: R, RED_HL: RH, RED_SH: RS,
  SKIN: K, SKIN_SH: KS, WHITE: W, HAT_SH: HS,
} = IDX;

const IDLE = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, O, O, O, O, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, O, W, W, W, W, O, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, O, W, W, W, W, W, W, O, 0, 0, 0, 0],
  [0, 0, 0, 0, O, HS, HS, HS, HS, HS, HS, O, 0, 0, 0, 0],
  [0, 0, 0, 0, O, K, K, K, K, K, K, O, 0, 0, 0, 0],
  [0, 0, 0, 0, O, K, O, K, K, O, K, O, 0, 0, 0, 0],
  [0, 0, 0, 0, O, K, KS, K, K, KS, K, O, 0, 0, 0, 0],
  [0, 0, 0, O, RH, R, R, R, R, R, R, RS, O, 0, 0, 0],
  [0, 0, O, RH, R, R, K, R, R, K, R, R, RS, O, 0, 0],
  [0, 0, O, RH, R, R, R, R, R, R, R, RS, RS, O, 0, 0],
  [0, 0, O, R, R, R, R, W, W, R, R, RS, RS, O, 0, 0],
  [0, 0, 0, O, R, R, R, R, R, R, RS, RS, O, 0, 0, 0],
  [0, 0, 0, 0, O, S, S, 0, 0, S, S, O, 0, 0, 0, 0],
  [0, 0, 0, 0, O, S, S, 0, 0, S, S, O, 0, 0, 0, 0],
  [0, 0, 0, 0, O, O, O, 0, 0, O, O, O, 0, 0, 0, 0],
];

const WALK1 = [
  ...IDLE.slice(0, 13),
  [0, 0, 0, O, O, S, S, 0, 0, S, S, O, 0, 0, 0, 0],
  [0, 0, 0, O, S, S, 0, 0, 0, S, S, O, 0, 0, 0, 0],
  [0, 0, O, O, O, 0, 0, 0, 0, O, O, O, 0, 0, 0, 0],
];

const WALK2 = [
  ...IDLE.slice(0, 13),
  [0, 0, 0, O, S, S, 0, 0, S, S, O, O, 0, 0, 0, 0],
  [0, 0, 0, O, S, S, 0, 0, 0, S, S, O, 0, 0, 0, 0],
  [0, 0, 0, O, O, O, 0, 0, 0, 0, O, O, O, 0, 0, 0],
];

/** Azul = mismo arte con la base, el brillo y la sombra del delantal. */
const aAzul = (frame) =>
  recolor(recolor(recolor(frame, R, IDX.BLUE), RH, IDX.BLUE_HL), RS, IDX.BLUE_SH);

export const PLAYER_FRAMES_RED = [IDLE, WALK1, IDLE, WALK2];
export const PLAYER_FRAMES_BLUE = PLAYER_FRAMES_RED.map(aAzul);

export const PLAYER_GRID = 16;
export const PLAYER_SCALE = 4;
export const PLAYER_FRAME_COUNT = PLAYER_FRAMES_RED.length;
