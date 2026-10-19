// =============================================================================
// shared/constants.js — ÚNICA fuente de los números del juego.
// Importado por el SERVIDOR (Node) y el CLIENTE (Vite/Phaser).
// NO debe referenciar `window`, `document` ni nada del navegador.
// Cualquier ajuste de balance se hace acá y afecta a ambos lados.
// =============================================================================

// --- Partida ----------------------------------------------------------------
export const MATCH_SECONDS = 300;            // 5:00
export const TICK_RATE = 20;                 // simulación del servidor (Hz)
export const TICK_MS = 1000 / TICK_RATE;     // 50 ms

// --- Cocina -----------------------------------------------------------------
export const COOK_SECONDS = 5;               // tiempo de cocción (equipos parejos)
export const COOK_SECONDS_SMALL_TEAM = 4;    // equipo más chico cuando los equipos están desparejos
export const HOLD_SECONDS = 2;               // Espacio mantenido: vaciar propia / volcar rival
export const INGREDIENT_SPAWN_EVERY = 2;     // aparece 1 ingrediente cada 2 s
export const MAX_FLOOR_INGREDIENTS = 8;      // máximo de ingredientes en el piso
export const INGREDIENT_MIN_SPACING = 72;    // separación mínima entre ingredientes (etiquetas legibles)
export const INGREDIENTS_PER_RECIPE = 3;     // cada receta tiene 3 ingredientes
export const POT_RADIUS = 42;                // radio de la olla (unidades de diseño)
export const POT_INTERACT_RADIUS = 80;       // distancia (centro a centro) para cargar la olla
export const ITEM_INTERACT_RADIUS = 52;      // distancia (centro a centro) para levantar del piso

// --- Sabotaje ---------------------------------------------------------------
export const TOMATO_COOLDOWN = 3;            // espera entre tomatazos (s)
export const STUN_SECONDS = 1.5;             // duración del aturdimiento
export const TOMATO_SPEED = 600;             // velocidad del tomate (unidades/s)
export const TOMATO_RADIUS = 10;             // radio del tomate (unidades)
export const TOMATO_MAX_LIFE = 2;            // se descarta si no impacta (s)
export const OIL_SPAWN_EVERY = 30;           // aparición del power-up de aceite (s)
export const OIL_PUDDLE_SECONDS = 10;        // duración del charco (s)
export const SLIP_SECONDS = 1;               // resbalón al pisar el charco (s)
export const OIL_RADIUS = 40;                // radio del charco (unidades)

// --- Mapa -------------------------------------------------------------------
export const GAME_WIDTH = 1280;              // unidades lógicas del mapa (top-down)
export const GAME_HEIGHT = 720;

// --- Red --------------------------------------------------------------------
export const DEFAULT_PORT = 3000;            // un solo puerto: HTTP + WebSocket
export const WS_PATH = '/ws';

// --- Jugadores / equipos ----------------------------------------------------
export const MIN_PLAYERS = 2;
export const EXPECTED_PLAYERS = 7;
export const PLAYER_SPEED = 260;   // unidades de diseño por segundo
export const PLAYER_RADIUS = 18;   // radio de colisión (unidades de diseño)
