import Phaser from 'phaser';
import { GAME, COLORS, UI, TRANSITION } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { networkManager } from '../core/NetworkManager.js';

// =============================================================================
// GameOverScene — Milestone 05: ganador, platos por equipo, saboteador del
// partido (más tomatazos acertados) y botón REVANCHA (sólo el host).
// =============================================================================

const CENTER = 0.5;

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.FLOOR);

    const cx = GAME.WIDTH * CENTER;

    this.add.text(cx, GAME.HEIGHT * 0.16, 'FIN DE PARTIDA', {
      fontFamily: UI.FONT,
      fontSize: `${GAME.HEIGHT * UI.HEADING_RATIO}px`,
      color: COLORS.UI_TEXT,
      fontStyle: 'bold',
      stroke: COLORS.UI_SHADOW,
      strokeThickness: UI.TEXT_STROKE,
    }).setOrigin(CENTER);

    // --- Ganador ---
    const winner = gameState.winner;
    const winnerLabel = winner === 'red' ? 'GANA ROJO' : winner === 'blue' ? 'GANA AZUL' : 'EMPATE';
    const winnerColor = winner === 'red' ? '#ff8a8a' : winner === 'blue' ? '#8ab6ff' : COLORS.UI_TEXT;
    this.winnerText = this.add.text(cx, GAME.HEIGHT * 0.3, winnerLabel, {
      fontFamily: UI.FONT,
      fontSize: `${GAME.HEIGHT * UI.TITLE_RATIO * 0.7}px`,
      color: winnerColor,
      fontStyle: 'bold',
      stroke: COLORS.UI_SHADOW,
      strokeThickness: UI.TEXT_STROKE,
    }).setOrigin(CENTER);

    // --- Platos por equipo ---
    const score = gameState.score || { red: 0, blue: 0 };
    this.scoreText = this.add.text(cx, GAME.HEIGHT * 0.44, `ROJO ${score.red}  —  ${score.blue} AZUL`, {
      fontFamily: UI.FONT,
      fontSize: `${GAME.HEIGHT * UI.HEADING_RATIO * 0.8}px`,
      color: COLORS.UI_TEXT,
      fontStyle: 'bold',
    }).setOrigin(CENTER);

    // --- Saboteador del partido ---
    this.saboteurText = this.add.text(cx, GAME.HEIGHT * 0.54, this._saboteurLine(), {
      fontFamily: UI.FONT,
      fontSize: `${GAME.HEIGHT * UI.SMALL_RATIO}px`,
      color: COLORS.UI_MUTED,
    }).setOrigin(CENTER);

    // --- Revancha (solo host) ---
    const isHost = !!gameState.isHost;
    this.rematchButton = this._createButton(
      cx,
      GAME.HEIGHT * 0.7,
      'REVANCHA',
      isHost,
      () => networkManager.rematch()
    );

    this.hintText = this.add.text(
      cx,
      GAME.HEIGHT * 0.86,
      isHost ? 'Sos el host: podés arrancar la revancha' : 'Esperando a que el host arranque la revancha…',
      {
        fontFamily: UI.FONT,
        fontSize: `${GAME.HEIGHT * UI.SMALL_RATIO * 0.8}px`,
        color: COLORS.UI_MUTED,
      }
    ).setOrigin(CENTER);

    // --- Revancha arrancó: volver a la partida ---
    this._onMatchStart = () => this._fadeTo('GameScene');
    eventBus.on(Events.NET_MATCH_START, this._onMatchStart);

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      eventBus.off(Events.NET_MATCH_START, this._onMatchStart);
    });

    this.cameras.main.fadeIn(TRANSITION.FADE_DURATION, 0, 0, 0);
    this._leaving = false;

    // --- Audio: tema de fin de partida ---------------------------------------
    eventBus.emit(Events.MUSIC_GAMEOVER);
  }

  _saboteurLine() {
    const id = gameState.saboteur;
    if (!id) return 'Saboteador del partido: — (nadie acertó un tomatazo)';
    const p = gameState.players?.[id];
    const name = p?.name ?? '—';
    const hits = p?.tomatoesHit ?? 0;
    return `Saboteador del partido: ${name} (${hits} tomatazo${hits === 1 ? '' : 's'})`;
  }

  _createButton(x, y, label, enabled, onClick) {
    const w = GAME.WIDTH * UI.BTN_W_RATIO;
    const h = GAME.HEIGHT * UI.BTN_H_RATIO;

    const container = this.add.container(x, y);
    const gfx = this.add.graphics();
    const fill = enabled ? COLORS.BTN_PRIMARY : COLORS.BTN_DISABLED;
    gfx.fillStyle(fill, 1);
    gfx.fillRoundedRect(-w / 2, -h / 2, w, h, UI.BTN_RADIUS);
    container.add(gfx);

    const text = this.add.text(0, 0, label, {
      fontFamily: UI.FONT,
      fontSize: `${h * 0.42}px`,
      color: COLORS.BTN_TEXT,
      fontStyle: 'bold',
    }).setOrigin(CENTER);
    container.add(text);

    container.setVisible(enabled);
    if (enabled) {
      container.setSize(w, h);
      // Phaser 4: el hit area del Container se mide desde su origen local (0,0).
      container.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
      container.on('pointerdown', () => onClick());
    }

    return container;
  }

  /** Fundido a negro antes de cambiar de escena (transición suave). */
  _fadeTo(key) {
    if (this._leaving) return;
    this._leaving = true;
    this.cameras.main.fadeOut(TRANSITION.FADE_DURATION, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(key);
    });
  }
}
