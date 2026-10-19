// =============================================================================
// src/sprites/palette.js — paleta ÚNICA del juego (arcade cocina).
//
// Todo el pixel art referencia estos índices; nunca hay hex sueltos en las
// matrices. El índice 0 es SIEMPRE transparente.
// =============================================================================

export const PALETTE = [
  null,       // 0  transparente
  0x1a1a2e,   // 1  contorno oscuro
  0x3a3a4a,   // 2  gris oscuro (sombra)
  0xd62828,   // 3  rojo (equipo rojo / tomate / carne)
  0xf4d35e,   // 4  amarillo (queso / yema)
  0xeec39a,   // 5  piel
  0x1d6fb8,   // 6  azul (equipo azul)
  0x5fcde4,   // 7  celeste
  0xffffff,   // 8  blanco
  0x8a5a2b,   // 9  marrón (pan)
  0x57cc63,   // 10 verde (lechuga / humo)
  0xe8d9a0,   // 11 beige (masa / papa)
  0xd9a521,   // 12 dorado (aceite)
  0x8d3b3b,   // 13 rojo oscuro (carne)
  0xf5f0e1,   // 14 blanco huevo
  0x6b5b4a,   // 15 marrón mesada
  0x2a2a2a,   // 16 gris despensa
  0x8899aa,   // 17 acero (borde de olla)
  0xb0c0cc,   // 18 acero claro
  0x000000,   // 19 negro
  0xefede6,   // 20 piso (claro, tipo cocina)
  0xe0ddd3,   // 21 piso (variante, junta/mota)
  0x3a1414,   // 22 cocina roja
  0x0f2440,   // 23 cocina azul
  0x2a2a2a,   // 24 despensa
  0x4a2a1e,   // 25 caldo (interior de la olla)
  0xe6cd98,   // 26 masa (crema tostado, contrasta con el piso)
  0xc98a4b,   // 27 papa (marrón anaranjado)
  0xd9a15e,   // 28 pan (corteza tostada)
  0xf7e9c9,   // 29 masa clara (brillo)
  0xc2a05f,   // 30 masa oscura (sombra)
  0xe8b57a,   // 31 papa clara (brillo)
  0x9a5a26,   // 32 papa oscura (sombra)
  0xf2c891,   // 33 pan claro (brillo)
  0xa8672c,   // 34 pan oscuro (sombra)
  0xfdf0a5,   // 35 queso claro (brillo)
  0xc79a1e,   // 36 queso oscuro (sombra)
  0x9ce89b,   // 37 lechuga clara (brillo)
  0x2e8a3a,   // 38 lechuga oscura (sombra)
  0xff7a72,   // 39 tomate claro (brillo)
  0x9c1a1a,   // 40 tomate oscuro (sombra)
  0xb85a5a,   // 41 carne clara (brillo)
  0x5c1d1d,   // 42 carne oscura (sombra)
  0xd8d1bd,   // 43 huevo oscuro (sombra)
  0xf3cf5c,   // 44 aceite claro (brillo)
  0xa87a12,   // 45 aceite oscuro (sombra)
  0x5d6b7a,   // 46 acero oscuro (sombra de olla)
  0xb08a5e,   // 47 madera clara (mesada)
  0x6e4632,   // 48 caldo claro (brillo)
  0x144a7e,   // 49 azul oscuro (sombra delantal azul)
  0xd8d8dc,   // 50 gris gorro (sombra)
  0xd9a06f,   // 51 piel en sombra
  0x3a8ed8,   // 52 azul claro (brillo delantal azul)
  0x8a6642,   // 53 madera oscura (frente de mesada)
  0x5c4026,   // 54 junta de madera (sombra)
  0x2f3038,   // 55 hierro de la cocina (horno)
  0xb5713c,   // 56 cobre de la olla
  0xdda06a,   // 57 cobre claro (brillo)
  0x7a4a24,   // 58 cobre oscuro (sombra)
  0xe9e3d6,   // 59 esmalte de la cocina (crema)
  0xc9c1b2,   // 60 esmalte en sombra
  0xa8b0b8,   // 61 cromo (bordes)
];

// Nombres para no leer números mágicos en las matrices.
export const IDX = {
  OUTLINE: 1,
  SHADOW: 2,
  RED: 3,
  YELLOW: 4,
  SKIN: 5,
  BLUE: 6,
  LIGHT_BLUE: 7,
  WHITE: 8,
  BROWN: 9,
  GREEN: 10,
  BEIGE: 11,
  GOLD: 12,
  DARK_RED: 13,
  EGG: 14,
  COUNTER: 15,
  PANTRY: 16,
  STEEL: 17,
  STEEL_LIGHT: 18,
  BLACK: 19,
  FLOOR: 20,
  FLOOR_VAR: 21,
  KITCHEN_RED: 22,
  KITCHEN_BLUE: 23,
  PANTRY_ZONE: 24,
  BROTH: 25,
  DOUGH: 26,
  POTATO: 27,
  CRUST: 28,
  DOUGH_HL: 29,
  DOUGH_SH: 30,
  POTATO_HL: 31,
  POTATO_SH: 32,
  CRUST_HL: 33,
  CRUST_SH: 34,
  YELLOW_HL: 35,
  YELLOW_SH: 36,
  GREEN_HL: 37,
  GREEN_SH: 38,
  RED_HL: 39,
  RED_SH: 40,
  MEAT_HL: 41,
  MEAT_SH: 42,
  EGG_SH: 43,
  GOLD_HL: 44,
  GOLD_SH: 45,
  STEEL_SH: 46,
  WOOD_HL: 47,
  BROTH_HL: 48,
  BLUE_SH: 49,
  HAT_SH: 50,
  SKIN_SH: 51,
  BLUE_HL: 52,
  WOOD: 53,
  WOOD_SH: 54,
  IRON: 55,
  COPPER: 56,
  COPPER_HL: 57,
  COPPER_SH: 58,
  ENAMEL: 59,
  ENAMEL_SH: 60,
  CHROME: 61,
};
