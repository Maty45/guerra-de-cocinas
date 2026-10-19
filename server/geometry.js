// =============================================================================
// server/geometry.js — helpers geométricos puros (sin estado, sin red).
// =============================================================================

export function clamp(v, min, max) {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

/** ¿El círculo (cx,cy,r) se solapa con el rectángulo {x,y,w,h}? (test exacto) */
export function circleIntersectsRect(cx, cy, r, rect) {
  const nearestX = clamp(cx, rect.x, rect.x + rect.w);
  const nearestY = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < r * r;
}

/**
 * Empuja un círculo fuera de un rectángulo por la mínima traslación.
 * @returns {{ x:number, y:number, hit:boolean }}
 */
export function resolveCircleRect(cx, cy, r, rect) {
  const nearestX = clamp(cx, rect.x, rect.x + rect.w);
  const nearestY = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  const d2 = dx * dx + dy * dy;

  if (d2 >= r * r) return { x: cx, y: cy, hit: false };

  if (d2 > 1e-9) {
    const d = Math.sqrt(d2);
    return { x: nearestX + (dx / d) * r, y: nearestY + (dy / d) * r, hit: true };
  }

  // El centro está dentro del rectángulo: salir por el lado más cercano.
  const dl = cx - rect.x;
  const dr = rect.x + rect.w - cx;
  const dt = cy - rect.y;
  const db = rect.y + rect.h - cy;
  const m = Math.min(dl, dr, dt, db);
  if (m === dl) return { x: rect.x - r, y: cy, hit: true };
  if (m === dr) return { x: rect.x + rect.w + r, y: cy, hit: true };
  if (m === dt) return { x: cx, y: rect.y - r, hit: true };
  return { x: cx, y: rect.y + rect.h + r, hit: true };
}
