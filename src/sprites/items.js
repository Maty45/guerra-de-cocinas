// =============================================================================
// src/sprites/items.js — ingredientes, tomate (proyectil) y aceite.
// Todo 12x12 a escala 4 (48 px): entra 1:1 en el tamaño de display del juego.
// Cada ingrediente tiene silueta propia + brillo arriba-izquierda y sombra
// abajo-derecha para que se lea el volumen.
// =============================================================================

import { IDX } from './palette.js';

const {
  OUTLINE: O, SHADOW: S, RED: R, YELLOW: Y, WHITE: W, BROWN: N, GREEN: G,
  BEIGE: B, GOLD: D, DARK_RED: D2, EGG: E,
  DOUGH: DG, POTATO: PT, CRUST: CR,
  DOUGH_HL: DH, DOUGH_SH: DS,
  POTATO_HL: PH, POTATO_SH: PS,
  CRUST_HL: CH, CRUST_SH: CS,
  YELLOW_HL: YH, YELLOW_SH: YS,
  GREEN_HL: GH, GREEN_SH: GS,
  RED_HL: RH, RED_SH: RS,
  MEAT_HL: MH, MEAT_SH: MS,
  EGG_SH: ES,
  GOLD_HL: DH2, GOLD_SH: DS2,
} = IDX;

const MASA = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, O, O, O, O, O, O, 0, 0],
  [0, 0, 0, O, DH, DG, DG, DG, DG, DG, O, 0],
  [0, 0, O, DH, DH, DG, DG, DG, DG, DS, O, 0],
  [0, O, DH, DH, DG, W, DG, DG, DG, DS, DS, O],
  [0, O, DH, DG, DG, DG, DG, DG, DG, DG, DS, O],
  [0, O, DG, DG, DG, DG, DG, DG, DG, DG, DS, O],
  [0, O, DG, DG, DG, DG, W, DG, DG, DS, DS, O],
  [0, 0, O, DG, DG, DG, DG, DG, DS, DS, O, 0],
  [0, 0, 0, O, DS, DS, DS, DS, DS, DS, O, 0],
  [0, 0, 0, 0, O, O, O, O, O, O, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

const TOMATE = [
  [0, 0, 0, 0, 0, G, G, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, G, GS, G, G, 0, 0, 0, 0],
  [0, 0, O, O, O, O, O, O, O, O, 0, 0],
  [0, O, RH, RH, R, R, R, R, R, RS, O, 0],
  [O, RH, RH, R, W, R, R, R, R, R, RS, O],
  [O, RH, R, R, R, R, R, R, R, R, RS, O],
  [O, RH, R, R, R, R, R, R, R, R, RS, O],
  [O, R, R, R, R, R, R, R, R, R, RS, O],
  [O, R, R, R, R, R, R, R, R, RS, RS, O],
  [0, O, R, R, R, R, R, R, RS, RS, O, 0],
  [0, 0, O, R, R, R, R, RS, RS, O, 0, 0],
  [0, 0, 0, O, O, O, O, O, O, 0, 0, 0],
];

const QUESO = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, O, O, O, O, O, O, 0, 0],
  [0, 0, 0, O, YH, Y, Y, Y, Y, Y, O, 0],
  [0, 0, O, YH, YH, Y, Y, Y, Y, YS, O, 0],
  [0, O, YH, YH, S, Y, Y, Y, Y, YS, YS, O],
  [0, O, YH, Y, Y, Y, Y, Y, Y, YS, YS, O],
  [0, O, Y, Y, Y, Y, S, Y, Y, YS, YS, O],
  [0, O, Y, Y, S, Y, Y, Y, Y, YS, YS, O],
  [0, 0, O, Y, Y, Y, Y, Y, YS, YS, O, 0],
  [0, 0, 0, O, YS, YS, YS, YS, YS, YS, O, 0],
  [0, 0, 0, 0, O, O, O, O, O, O, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

const PAN = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, O, O, O, O, O, O, O, O, 0],
  [0, 0, O, CH, CR, CR, CR, CR, CR, CR, CS, O],
  [0, O, CH, CH, CR, CR, CR, CR, CR, CR, CS, O],
  [0, O, CH, CR, CR, B, CR, CR, B, CR, CS, O],
  [0, O, CR, CR, B, CR, CR, B, CR, CR, CS, O],
  [0, O, CR, B, CR, CR, B, CR, CR, CR, CS, O],
  [0, O, CR, CR, CR, CR, CR, CR, CR, CR, CS, O],
  [0, 0, O, CR, CR, CR, CR, CR, CR, CS, CS, O],
  [0, 0, 0, O, CS, CS, CS, CS, CS, CS, O, 0],
  [0, 0, 0, 0, O, O, O, O, O, O, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

const CARNE = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, O, O, O, O, O, O, 0, 0, 0],
  [0, 0, O, MH, D2, W, D2, D2, D2, O, 0, 0],
  [0, O, MH, MH, D2, D2, D2, D2, D2, MS, O, 0],
  [0, O, MH, D2, D2, D2, W, D2, D2, MS, O, 0],
  [0, O, D2, D2, D2, D2, D2, D2, D2, MS, O, 0],
  [0, O, D2, W, D2, D2, D2, D2, D2, MS, O, 0],
  [0, O, D2, D2, D2, D2, D2, W, D2, MS, O, 0],
  [0, O, D2, D2, D2, D2, D2, D2, D2, MS, O, 0],
  [0, 0, O, D2, D2, D2, D2, D2, MS, MS, O, 0],
  [0, 0, 0, O, MS, MS, MS, MS, MS, O, 0, 0],
  [0, 0, 0, 0, O, O, O, O, O, 0, 0, 0],
];

const LECHUGA = [
  [0, 0, 0, 0, O, O, O, O, 0, 0, 0, 0],
  [0, 0, O, O, GH, G, G, G, O, O, 0, 0],
  [0, O, GH, GH, G, G, G, G, G, G, O, 0],
  [O, GH, GH, G, G, G, G, G, G, G, GS, O],
  [O, GH, G, G, O, G, G, O, G, G, GS, O],
  [O, GH, G, G, G, G, G, G, G, G, GS, O],
  [O, G, G, O, G, G, G, G, O, G, GS, O],
  [O, G, G, G, G, G, G, G, G, G, GS, O],
  [0, O, G, G, G, G, G, G, GS, GS, O, 0],
  [0, 0, O, G, G, G, G, GS, GS, O, 0, 0],
  [0, 0, 0, O, GS, GS, GS, GS, O, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

const PAPA = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, G, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, O, G, O, 0, 0, 0, 0, 0],
  [0, 0, 0, O, PH, PT, PT, O, 0, 0, 0, 0],
  [0, 0, O, PH, PH, PT, PT, PS, O, 0, 0, 0],
  [0, O, PH, PH, PT, PT, PT, PT, PS, O, 0, 0],
  [0, O, PH, PT, N, PT, PT, PT, PS, PS, O, 0],
  [0, O, PT, PT, PT, PT, PT, PT, PT, PS, O, 0],
  [0, O, PT, PT, PT, PT, PT, N, PS, PS, O, 0],
  [0, 0, O, PT, PT, PT, PT, PS, PS, O, 0, 0],
  [0, 0, 0, O, PS, PS, PS, PS, O, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

const HUEVO = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, O, O, O, O, O, O, O, 0, 0],
  [0, 0, O, E, E, E, E, E, E, E, O, 0],
  [0, O, E, E, Y, Y, Y, Y, E, E, ES, O],
  [0, O, E, Y, YH, Y, Y, Y, E, ES, ES, O],
  [0, O, E, Y, Y, Y, Y, Y, E, E, ES, O],
  [0, O, E, E, Y, Y, Y, Y, E, ES, ES, O],
  [0, O, E, E, E, E, E, E, E, ES, ES, O],
  [0, 0, O, E, E, E, E, E, ES, ES, O, 0],
  [0, 0, 0, O, ES, ES, ES, ES, ES, ES, O, 0],
  [0, 0, 0, 0, O, O, O, O, O, O, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

const ACEITE = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, O, O, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, O, DH2, D, O, 0, 0, 0, 0],
  [0, 0, 0, 0, O, D, D, O, 0, 0, 0, 0],
  [0, 0, 0, O, DH2, D, D, DS2, O, 0, 0, 0],
  [0, 0, O, DH2, D, D, D, DS2, DS2, O, 0, 0],
  [0, 0, O, DH2, D, D, D, D, DS2, O, 0, 0],
  [0, 0, O, DH2, D, D, W, D, DS2, O, 0, 0],
  [0, 0, O, D, D, D, D, D, DS2, O, 0, 0],
  [0, 0, O, D, D, D, D, D, DS2, O, 0, 0],
  [0, 0, 0, O, DS2, DS2, DS2, DS2, O, 0, 0, 0],
  [0, 0, 0, 0, O, O, O, O, 0, 0, 0, 0],
];

/** Píxeles por tipo de ingrediente (incluye el aceite, que se puede llevar). */
export const ITEM_PIXELS = {
  masa: MASA,
  tomate: TOMATE,
  queso: QUESO,
  pan: PAN,
  carne: CARNE,
  lechuga: LECHUGA,
  papa: PAPA,
  huevo: HUEVO,
  aceite: ACEITE,
};

export const TOMATO_PIXELS = TOMATE;
export const OIL_PIXELS = ACEITE;

export const ITEM_GRID = 12;
export const ITEM_SCALE = 4;
