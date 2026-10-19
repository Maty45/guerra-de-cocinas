import Phaser from 'phaser';
import { GAME, COLORS, UI, TRANSITION, MIN_PLAYERS } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { networkManager } from '../core/NetworkManager.js';

// =============================================================================
// LobbyScene — Milestone 01.
// Ingreso de nombre (teclado), roster en vivo, y botón EMPEZAR sólo para el host.
// Toda la UI se deriva de gameState (que llena NetworkManager desde el server).
// =============================================================================

const MAX_NAME_LEN = UI.NAME_MAX_LEN;

export class LobbyScene extends Phaser.Scene {
  constructor() {
    super('LobbyScene');
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.FLOOR);
    this._typed = '';

    const cx = GAME.WIDTH / 2;

    this.add.text(cx, GAME.HEIGHT * 0.16, 'GUERRA DE COCINAS', {
      fontFamily: UI.FONT,
      fontSize: `${GAME.HEIGHT * UI.TITLE_RATIO}px`,
      color: COLORS.UI_TEXT,
      fontStyle: 'bold',
      stroke: COLORS.UI_SHADOW,
      strokeThickness: UI.TEXT_STROKE,
    }).setOrigin(0.5);

    // --- Ingreso de nombre ---
    this.nameText = this.add.text(cx, GAME.HEIGHT * 0.36, '', {
      fontFamily: UI.FONT,
      fontSize: `${GAME.HEIGHT * UI.HEADING_RATIO * 0.7}px`,
      color: COLORS.ACCENT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.hintText = this.add.text(cx, GAME.HEIGHT * 0.44, 'Escribí tu nombre y presioná ENTER', {
      fontFamily: UI.FONT,
      fontSize: `${GAME.HEIGHT * UI.SMALL_RATIO}px`,
      color: COLORS.UI_MUTED,
    }).setOrigin(0.5);

    // --- Roster ---
    this.rosterTitle = this.add.text(cx, GAME.HEIGHT * 0.54, '', {
      fontFamily: UI.FONT,
      fontSize: `${GAME.HEIGHT * UI.SMALL_RATIO}px`,
      color: COLORS.UI_TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.rosterText = this.add.text(cx, GAME.HEIGHT * 0.62, '', {
      fontFamily: UI.FONT,
      fontSize: `${GAME.HEIGHT * UI.SMALL_RATIO}px`,
      color: COLORS.UI_MUTED,
      align: 'center',
      lineSpacing: UI.LINE_SPACING,
    }).setOrigin(0.5, 0);

    // --- Botón EMPEZAR (solo host) ---
    this.startButton = this._createButton(cx, GAME.HEIGHT * 0.86, 'EMPEZAR');

    // Motivo visible cuando el botón está deshabilitado (ej: falta gente). Va
    // pegado al botón: el texto de estado del pie se lee poco.
    this.startHint = this.add.text(cx, GAME.HEIGHT * UI.HINT_Y_RATIO, '', {
      fontFamily: UI.FONT,
      fontSize: `${GAME.HEIGHT * UI.HINT_RATIO}px`,
      color: COLORS.ACCENT,
      align: 'center',
    }).setOrigin(0.5);

    // --- Instrucciones (panel lateral) ---
    this._createInstructions();

    // --- Estado de conexión ---
    this.statusText = this.add.text(cx, GAME.HEIGHT * 0.96, '', {
      fontFamily: UI.FONT,
      fontSize: `${GAME.HEIGHT * UI.SMALL_RATIO * 0.8}px`,
      color: COLORS.UI_MUTED,
    }).setOrigin(0.5);

    // --- Input de teclado ---
    this._onKeyDown = (e) => this._handleKey(e);
    window.addEventListener('keydown', this._onKeyDown);

    // --- Reacciones a la red ---
    this._refresh = () => this._render();
    eventBus.on(Events.NET_CONNECTED, this._refresh);
    eventBus.on(Events.NET_DISCONNECTED, this._refresh);
    eventBus.on(Events.NET_ROSTER, this._refresh);
    eventBus.on(Events.LOBBY_JOINED, this._refresh);
    this._onMatchStart = () => this._fadeTo('GameScene');
    eventBus.on(Events.NET_MATCH_START, this._onMatchStart);

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('keydown', this._onKeyDown);
      eventBus.off(Events.NET_CONNECTED, this._refresh);
      eventBus.off(Events.NET_DISCONNECTED, this._refresh);
      eventBus.off(Events.NET_ROSTER, this._refresh);
      eventBus.off(Events.LOBBY_JOINED, this._refresh);
      eventBus.off(Events.NET_MATCH_START, this._onMatchStart);
      eventBus.off(Events.AUDIO_TOGGLE_MUTE, this._onMute);
    });

    this._render();
    networkManager.connect();

    // --- Audio: música del lobby + indicador de mute -------------------------
    eventBus.emit(Events.MUSIC_MENU);
    this.muteText = this.add.text(cx, GAME.HEIGHT * 0.995, '', {
      fontFamily: UI.FONT,
      fontSize: `${GAME.HEIGHT * UI.SMALL_RATIO * 0.7}px`,
      color: COLORS.UI_MUTED,
    }).setOrigin(0.5, 1);
    this._onMute = () => this.muteText.setText(`M = sonido: ${gameState.isMuted ? 'OFF' : 'ON'}`);
    eventBus.on(Events.AUDIO_TOGGLE_MUTE, this._onMute);
    this._onMute();

    this.cameras.main.fadeIn(TRANSITION.FADE_DURATION, 0, 0, 0);
    this._leaving = false;
  }

  _handleKey(e) {
    if (gameState.selfId) return; // ya entró al lobby

    if (e.key === 'Enter') {
      if (this._typed.trim().length > 0) networkManager.join(this._typed);
      return;
    }
    if (e.key === 'Backspace') {
      this._typed = this._typed.slice(0, -1);
      this._render();
      return;
    }
    if (e.key.length === 1 && this._typed.length < MAX_NAME_LEN) {
      this._typed += e.key;
      this._render();
    }
  }

  _render() {
    const joined = !!gameState.selfId;

    // Nombre / hint
    if (joined) {
      this.nameText.setText(gameState.selfName || '');
      this.hintText.setText(gameState.isHost ? 'Sos el host' : 'Esperando al host…');
    } else {
      this.nameText.setText(this._typed ? `${this._typed}▊` : '▊');
      this.hintText.setText('Escribí tu nombre y presioná ENTER');
    }

    // Roster
    const roster = gameState.roster;
    this.rosterTitle.setText(roster.length ? `JUGADORES (${roster.length})` : '');
    this.rosterText.setText(
      roster.map((p) => {
        const host = p.isHost ? ' (host)' : '';
        const off = p.connected ? '' : ' — desconectado';
        return `${p.name}${host}${off}`;
      }).join('\n')
    );

    // Botón: sólo el host lo ve; habilitado cuando hay jugadores suficientes.
    const showButton = joined && gameState.isHost;
    this.startButton.container.setVisible(showButton);
    this._startEnabled = showButton && gameState.canStart;
    this.startButton.draw(this._startEnabled ? COLORS.BTN_PRIMARY : COLORS.BTN_DISABLED);
    this.startButton.container.input.cursor = this._startEnabled ? 'pointer' : 'not-allowed';
    this._updateStartHint(showButton);

    // Estado
    if (!gameState.connected) {
      this.statusText.setText('Conectando…');
    } else if (!joined) {
      this.statusText.setText('Conectado');
    } else if (!gameState.isHost) {
      this.statusText.setText('Esperando a que el host empiece…');
    } else {
      this.statusText.setText(
        gameState.canStart ? 'Listo para empezar' : 'Esperando jugadores…'
      );
    }
  }

  /**
   * Explica por qué EMPEZAR está gris. Sin esto, un host solo ve un botón
   * apagado que no responde y parece roto.
   */
  _updateStartHint(showButton) {
    if (!showButton || gameState.canStart) {
      this.startHint.setText('');
      return;
    }
    const connected = gameState.roster.filter((p) => p.connected).length;
    this.startHint.setText(
      `Faltan jugadores: ${connected}/${MIN_PLAYERS} conectados`
    );
  }

  /** Sacudida corta cuando se clickea EMPEZAR deshabilitado. */
  _nudgeStart() {
    const c = this.startButton.container;
    const baseX = GAME.WIDTH / 2;
    this.tweens.killTweensOf(c);
    this.tweens.add({
      targets: c,
      x: { from: baseX - UI.BTN_SHAKE_OFFSET, to: baseX },
      duration: UI.BTN_SHAKE_DURATION,
      yoyo: true,
      repeat: UI.BTN_SHAKE_REPEAT,
      onComplete: () => {
        c.x = baseX;
      },
    });
    this.tweens.killTweensOf(this.startHint);
    this.startHint.setScale(1);
    this.tweens.add({
      targets: this.startHint,
      scale: { from: UI.HINT_PULSE_SCALE, to: 1 },
      duration: UI.HINT_PULSE_DURATION,
    });
  }

  // Instrucciones compactas para el que entra por primera vez. Van en la
  // columna izquierda para no chocar con el roster (centrado) ni el botón.
  _createInstructions() {
    const w = GAME.WIDTH * 0.34;
    const h = GAME.HEIGHT * 0.37;
    const x = GAME.WIDTH * 0.24;
    const y = GAME.HEIGHT * 0.69;

    const panel = this.add.graphics();
    panel.fillStyle(COLORS.PANEL, 0.55);
    panel.fillRoundedRect(x - w / 2, y - h / 2, w, h, UI.BTN_RADIUS);

    const left = x - w / 2 + GAME.WIDTH * 0.018;
    const top = y - h / 2 + GAME.HEIGHT * 0.022;

    this.add.text(left, top, 'CÓMO SE JUEGA', {
      fontFamily: UI.FONT,
      fontSize: `${GAME.HEIGHT * UI.SMALL_RATIO}px`,
      color: COLORS.ACCENT,
      fontStyle: 'bold',
    }).setOrigin(0, 0);

    this.add.text(left, top + GAME.HEIGHT * 0.052, [
      'Cociná los 3 ingredientes de tu comanda.',
      'Saboteá la del rival. Más platos en 5:00.',
      '',
      'WASD o flechas  ·  moverse',
      'ESPACIO  ·  agarrar / cargar / soltar',
      'ESPACIO 2 s  ·  vaciar / volcar la olla',
      'E  ·  tirar tomate        M  ·  sonido',
    ].join('\n'), {
      fontFamily: UI.FONT,
      fontSize: `${GAME.HEIGHT * UI.SMALL_RATIO * 0.9}px`,
      color: COLORS.UI_MUTED,
      lineSpacing: UI.LINE_SPACING,
      wordWrap: { width: w - GAME.WIDTH * 0.036 },
    }).setOrigin(0, 0);
  }

  // Patrón obligatorio: Container + Graphics + Text.
  _createButton(x, y, label) {
    const w = GAME.WIDTH * UI.BTN_W_RATIO;
    const h = GAME.HEIGHT * UI.BTN_H_RATIO;

    const container = this.add.container(x, y).setVisible(false);
    const gfx = this.add.graphics();
    const text = this.add.text(0, 0, label, {
      fontFamily: UI.FONT,
      fontSize: `${h * 0.42}px`,
      color: COLORS.BTN_TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add([gfx, text]);
    container.setSize(w, h);
    // OJO: en Phaser 4 el hit area del Container arranca en su origen local,
    // no en (-w/2,-h/2). Con valores negativos el área clickeable quedaba
    // corrida media caja hacia arriba-izquierda (bug reportado en el lobby).
    container.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, w, h),
      Phaser.Geom.Rectangle.Contains
    );

    const draw = (fill) => {
      gfx.clear();
      gfx.fillStyle(fill, 1);
      gfx.fillRoundedRect(-w / 2, -h / 2, w, h, UI.BTN_RADIUS);
    };

    container.on('pointerover', () => {
      if (this._startEnabled) draw(COLORS.BTN_PRIMARY_HOVER);
    });
    container.on('pointerout', () => {
      draw(this._startEnabled ? COLORS.BTN_PRIMARY : COLORS.BTN_DISABLED);
    });
    container.on('pointerdown', () => {
      if (!this._startEnabled) {
        this._nudgeStart();
        return;
      }
      eventBus.emit(Events.AUDIO_INIT);
      networkManager.start();
    });

    return { container, draw };
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
