// =============================================================================
// src/core/PixelRenderer.js — render de pixel art 100% en código.
//
// Una matriz 2D de índices de paleta se dibuja a un canvas offscreen y se
// registra como textura de Phaser. No hay archivos de imagen externos.
// Índice 0 = transparente. Ver src/sprites/palette.js.
// =============================================================================

/**
 * Dibuja una matriz de píxeles a una textura de Phaser.
 * @param {Phaser.Scene} scene
 * @param {number[][]} pixels  matriz [y][x] de índices de paleta (0 = transparente)
 * @param {(number|null)[]} palette  colores hex por índice
 * @param {string} key  clave de textura
 * @param {number} scale  escala de píxel (cada píxel = scale x scale)
 */
export function renderPixelArt(scene, pixels, palette, key, scale = 2) {
  if (scene.textures.exists(key)) return;

  const h = pixels.length;
  const w = pixels[0].length;
  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d');

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const idx = pixels[y][x];
      if (idx === 0 || palette[idx] == null) continue;
      const color = palette[idx];
      const r = (color >> 16) & 0xff;
      const g = (color >> 8) & 0xff;
      const b = color & 0xff;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }

  scene.textures.addCanvas(key, canvas);
}

/**
 * Dibuja varios frames como un spritesheet (una sola fila horizontal).
 * @param {Phaser.Scene} scene
 * @param {number[][][]} frames  matrices (una por frame, mismo tamaño)
 * @param {(number|null)[]} palette
 * @param {string} key
 * @param {number} scale
 */
export function renderSpriteSheet(scene, frames, palette, key, scale = 2) {
  if (scene.textures.exists(key)) return;

  const h = frames[0].length;
  const w = frames[0][0].length;
  const frameW = w * scale;
  const frameH = h * scale;
  const canvas = document.createElement('canvas');
  canvas.width = frameW * frames.length;
  canvas.height = frameH;
  const ctx = canvas.getContext('2d');

  frames.forEach((pixels, fi) => {
    const offsetX = fi * frameW;
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const idx = pixels[y][x];
        if (idx === 0 || palette[idx] == null) continue;
        const color = palette[idx];
        const r = (color >> 16) & 0xff;
        const g = (color >> 8) & 0xff;
        const b = color & 0xff;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(offsetX + x * scale, y * scale, scale, scale);
      }
    }
  });

  scene.textures.addSpriteSheet(key, canvas, { frameWidth: frameW, frameHeight: frameH });
}

/**
 * Recolorea una matriz cambiando un índice de paleta por otro.
 * Sirve para generar variantes (p. ej. equipo rojo → azul) sin duplicar arte.
 * @param {number[][]} frame
 * @param {number} from
 * @param {number} to
 * @returns {number[][]}
 */
export function recolor(frame, from, to) {
  return frame.map((row) => row.map((v) => (v === from ? to : v)));
}
