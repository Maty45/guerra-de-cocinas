// =============================================================================
// src/core/Effects.js — "juice" visual: partículas, anillos, texto flotante y
// sacudida de cámara. Todo se arma con círculos/textos + tweens (sin plugins).
//
// La escena le pasa los eventos que devuelve `fx.js` y acá se traducen a
// efectos concretos. Los números viven en Constants.js (FX).
// =============================================================================

import { FX, COLORS, DEPTH, UI } from './Constants.js';

const TAU = Math.PI * 2;

export class Effects {
  constructor(scene) {
    this.scene = scene;
    this._nextSteam = { red: 0, blue: 0 };
  }

  /** Traduce una lista de eventos de `diffFx` a efectos en pantalla. */
  handle(events, sx, sy) {
    for (const e of events) {
      const x = e.x * sx;
      const y = e.y * sy;
      switch (e.type) {
        case 'serve':
          this.burst(x, y, COLORS.PLATE, FX.BURST_COUNT, FX.BURST_SPEED);
          this.ring(x, y, COLORS.PLATE);
          this.floatText(x, y, e.text || '+1', COLORS.PLATE);
          this.shake(FX.SHAKE_SERVE);
          break;
        case 'impact':
          this.burst(x, y, COLORS.STUN, FX.SPLASH_COUNT, FX.BURST_SPEED);
          this.ring(x, y, COLORS.TOMATO);
          this.shake(FX.SHAKE_HIT);
          break;
        case 'splash':
          this.burst(x, y, COLORS.TOMATO, FX.SPLASH_COUNT, FX.BURST_SPEED * 0.7, FX.SPLASH_GRAVITY);
          break;
        case 'contaminate':
          this.burst(x, y, COLORS.SMOKE, FX.BURST_COUNT, FX.BURST_SPEED * 0.8);
          this.ring(x, y, COLORS.SMOKE);
          this.shake(FX.SHAKE_CONTAMINATE);
          break;
        case 'tip':
          this.burst(x, y, COLORS.TIP, FX.BURST_COUNT, FX.BURST_SPEED * 0.9);
          this.shake(FX.SHAKE_TIP);
          break;
        case 'slip':
          this.burst(x, y, COLORS.OIL_ITEM, FX.SPLASH_COUNT, FX.BURST_SPEED * 0.6);
          break;
        case 'cookstart':
          this.burst(x, y - FX.STEAM_RISE, COLORS.STEAM, FX.SPLASH_COUNT, FX.BURST_SPEED * 0.5);
          break;
        default:
          break;
      }
    }
  }

  /** Vapor continuo de las ollas que están cocinando (o humo si contaminadas). */
  updateSteam(time, pots, sx, sy) {
    if (!pots) return;
    for (const team of ['red', 'blue']) {
      const pot = pots[team];
      if (!pot) continue;
      const active = pot.cooking || pot.contaminated;
      if (!active) continue;
      if (time < this._nextSteam[team]) continue;
      this._nextSteam[team] = time + FX.STEAM_INTERVAL;

      const color = pot.contaminated ? COLORS.SMOKE : COLORS.STEAM;
      this.steam(pot.x * sx, pot.y * sy - FX.STEAM_RISE, color);
    }
  }

  // --- Primitivas -----------------------------------------------------------

  steam(x, y, color) {
    const p = this.scene.add.circle(
      x + (Math.random() - 0.5) * FX.STEAM_SIZE * 2,
      y,
      FX.STEAM_SIZE,
      color,
      FX.STEAM_ALPHA
    ).setDepth(DEPTH.FX);

    this.scene.tweens.add({
      targets: p,
      y: y - FX.STEAM_RISE,
      alpha: 0,
      scale: FX.BURST_SCALE + 0.4,
      duration: FX.STEAM_LIFE,
      ease: 'Sine.easeOut',
      onComplete: () => p.destroy(),
    });
  }

  burst(x, y, color, count = FX.BURST_COUNT, speed = FX.BURST_SPEED, gravity = 0) {
    for (let i = 0; i < count; i += 1) {
      const angle = (TAU * i) / count + Math.random() * 0.3;
      const v = speed + Math.random() * FX.BURST_SPEED_RANDOM;
      const dx = Math.cos(angle) * v;
      const dy = Math.sin(angle) * v + gravity;
      const p = this.scene.add
        .circle(x, y, FX.BURST_RADIUS, color, 1)
        .setDepth(DEPTH.FX);

      this.scene.tweens.add({
        targets: p,
        x: x + dx,
        y: y + dy,
        alpha: 0,
        scale: FX.BURST_SCALE,
        duration: FX.BURST_LIFE + Math.random() * FX.BURST_LIFE_RANDOM,
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy(),
      });
    }
  }

  ring(x, y, color) {
    const r = this.scene.add.circle(x, y, FX.RING_RADIUS)
      .setStrokeStyle(3, color, 1)
      .setFillStyle(color, 0)
      .setDepth(DEPTH.FX);

    this.scene.tweens.add({
      targets: r,
      scale: (FX.RING_RADIUS + FX.RING_GROW) / FX.RING_RADIUS,
      alpha: 0,
      duration: FX.RING_LIFE,
      ease: 'Quad.easeOut',
      onComplete: () => r.destroy(),
    });
  }

  floatText(x, y, text, color) {
    const label = this.scene.add.text(x, y, text, {
      fontFamily: UI.FONT,
      fontSize: `${FX.FLOAT_SIZE * (this.scene._sx || 1)}px`,
      color: typeof color === 'number' ? `#${color.toString(16).padStart(6, '0')}` : color,
      fontStyle: 'bold',
      stroke: COLORS.UI_SHADOW,
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(DEPTH.FLOAT);

    this.scene.tweens.add({
      targets: label,
      y: y - FX.FLOAT_RISE,
      alpha: 0,
      duration: FX.FLOAT_LIFE,
      ease: 'Quad.easeOut',
      onComplete: () => label.destroy(),
    });
  }

  /** Pulso corto del HUD cuando cambia el marcador. */
  pulse(target) {
    this.scene.tweens.add({
      targets: target,
      scale: FX.HUD_POP_SCALE,
      duration: FX.HUD_POP_LIFE,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  shake(intensity = FX.SHAKE_HIT, duration = FX.SHAKE_DURATION) {
    this.scene.cameras.main.shake(duration, intensity, false);
  }
}
