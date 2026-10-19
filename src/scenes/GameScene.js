import Phaser from 'phaser';
import {
  GAME,
  COLORS,
  UI,
  COOKING,
  SPRITE_SIZES,
  SPRITE_ANIM,
  SHADOW,
  DEPTH,
  FX,
  ONBOARDING,
  TRANSITION,
  STAGE,
  STUN_FX,
  TICKET,
  DECOR,
  HOLD_SECONDS,
  GAME_WIDTH,
  GAME_HEIGHT,
} from '../core/Constants.js';
import { ZONES, COUNTERS, POTS } from '../../shared/map.js';
import { renderPixelArt, renderSpriteSheet } from '../core/PixelRenderer.js';
import { PALETTE } from '../sprites/palette.js';
import { PLAYER_FRAMES_RED, PLAYER_FRAMES_BLUE, PLAYER_SCALE } from '../sprites/player.js';
import { ITEM_PIXELS, TOMATO_PIXELS, OIL_PIXELS, ITEM_SCALE } from '../sprites/items.js';
import {
  POT_PIXELS,
  STOVE_PIXELS,
  STAR_PIXELS,
  FLOOR_TILES,
  COUNTER_TILES,
  COUNTER_FACE_TILES,
  SMOKE_PIXELS,
  PUDDLE_PIXELS,
} from '../sprites/props.js';
import { gameState } from '../core/GameState.js';
import { networkManager } from '../core/NetworkManager.js';
import { eventBus, Events } from '../core/EventBus.js';
import { Effects } from '../core/Effects.js';
import { diffFx } from '../core/fx.js';

// =============================================================================
// GameScene — Milestone 02: mapa + jugadores con movimiento autoritativo.
// Milestone 03: despensa, ollas, comanda actual, platos y humo de contaminación.
// Milestone 06: todo el arte es pixel art (sprites generados en código).
//
// El cliente NO simula: manda teclas/acciones y dibuja el estado del servidor
// interpolando entre los dos últimos snapshots.
// =============================================================================

const NEUTRAL_KEYS = { up: false, down: false, left: false, right: false };
const KEY_TO_DIR = {
  w: 'up', a: 'left', s: 'down', d: 'right',
  arrowup: 'up', arrowleft: 'left', arrowdown: 'down', arrowright: 'right',
};

// Claves de textura.
const PLAYER_TEX = { red: 'player-red', blue: 'player-blue' };
const TEX = {
  tomato: 'sprite-tomato',
  oil: 'sprite-oil',
  pot: 'sprite-pot',
  stove: 'sprite-stove',
  star: 'sprite-star',
  smoke: 'sprite-smoke',
  puddle: 'sprite-puddle',
};
const TILE_SCALE = 2;
const POT_SCALE = 5;
const STOVE_SCALE = 5;
const STAR_SCALE = 3;

const itemTex = (kind) => `item-${kind}`;

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this._avatars = new Map();
    this._items = new Map();
    this._tomatoes = new Map();
    this._puddles = new Map();
    this._oilCircle = null;
    this._keys = { ...NEUTRAL_KEYS };
    this._sentKeys = { ...NEUTRAL_KEYS };
    this._spaceDownAt = 0;
    // Juice: se comparan snapshots consecutivos para disparar efectos.
    this._fx = null;
    this._prevFx = null;
    this._prevScore = null;
    this._lastFxTick = -1;
    this._leaving = false;
  }

  create() {
    this._sx = GAME.WIDTH / GAME.DESIGN_WIDTH;
    this._sy = GAME.HEIGHT / GAME.DESIGN_HEIGHT;

    this._renderTextures();
    this._drawMap();
    this._decorateCounters();
    this._createPots();
    this._createHud();
    this._fx = new Effects(this);

    this._onKeyDown = (e) => this._keyDown(e);
    this._onKeyUp = (e) => this._keyUp(e);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('keydown', this._onKeyDown);
      window.removeEventListener('keyup', this._onKeyUp);
      for (const av of this._avatars.values()) av.container.destroy();
      for (const it of this._items.values()) it.container.destroy();
      for (const t of this._tomatoes.values()) t.destroy();
      for (const pd of this._puddles.values()) pd.destroy();
      this._avatars.clear();
      this._items.clear();
      this._tomatoes.clear();
      this._puddles.clear();
      this._pots = {};
      this._oilCircle = null;
    });

    this.cameras.main.fadeIn(TRANSITION.FADE_DURATION, 0, 0, 0);
    this._showStartHint();

    // --- Audio: música de partida --------------------------------------------
    eventBus.emit(Events.MUSIC_GAMEPLAY);
  }

  // --- Texturas de pixel art ------------------------------------------------
  // Se generan una sola vez por escena; si la textura ya existe, se reutiliza.
  _renderTextures() {
    renderSpriteSheet(this, PLAYER_FRAMES_RED, PALETTE, PLAYER_TEX.red, PLAYER_SCALE);
    renderSpriteSheet(this, PLAYER_FRAMES_BLUE, PALETTE, PLAYER_TEX.blue, PLAYER_SCALE);
    for (const team of ['red', 'blue']) {
      const animKey = `walk-${team}`;
      if (!this.anims.exists(animKey)) {
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNumbers(PLAYER_TEX[team], {
            start: 0,
            end: PLAYER_FRAMES_RED.length - 1,
          }),
          frameRate: SPRITE_ANIM.WALK_FPS,
          repeat: -1,
        });
      }
    }

    for (const [kind, pixels] of Object.entries(ITEM_PIXELS)) {
      renderPixelArt(this, pixels, PALETTE, itemTex(kind), ITEM_SCALE);
    }
    renderPixelArt(this, TOMATO_PIXELS, PALETTE, TEX.tomato, ITEM_SCALE);
    renderPixelArt(this, OIL_PIXELS, PALETTE, TEX.oil, ITEM_SCALE);
    renderPixelArt(this, SMOKE_PIXELS, PALETTE, TEX.smoke, ITEM_SCALE);
    renderPixelArt(this, POT_PIXELS, PALETTE, TEX.pot, POT_SCALE);
    renderPixelArt(this, STOVE_PIXELS, PALETTE, TEX.stove, STOVE_SCALE);
    renderPixelArt(this, STAR_PIXELS, PALETTE, TEX.star, STAR_SCALE);
    renderPixelArt(this, PUDDLE_PIXELS, PALETTE, TEX.puddle, TILE_SCALE);

    FLOOR_TILES.forEach((t, i) => renderPixelArt(this, t, PALETTE, `tile-floor-${i}`, TILE_SCALE));
    COUNTER_TILES.forEach((t, i) => renderPixelArt(this, t, PALETTE, `tile-counter-${i}`, TILE_SCALE));
    COUNTER_FACE_TILES.forEach((t, i) => renderPixelArt(this, t, PALETTE, `tile-counter-face-${i}`, TILE_SCALE));
  }

  // --- Mapa -----------------------------------------------------------------
  _drawMap() {
    const { _sx: sx, _sy: sy } = this;

    // Piso de pixel art (repetido con un solo TileSprite: barato y sin costuras).
    this.add.tileSprite(0, 0, GAME.WIDTH, GAME.HEIGHT, 'tile-floor-0')
      .setOrigin(0, 0)
      .setDepth(DEPTH.FLOOR);

    for (const zone of ZONES) {
      const color = zone.id === 'red' ? COLORS.KITCHEN_RED
        : zone.id === 'blue' ? COLORS.KITCHEN_BLUE
        : COLORS.PANTRY;
      this.add.rectangle(
        (zone.x + zone.w / 2) * sx,
        (GAME_HEIGHT / 2) * sy,
        zone.w * sx,
        GAME_HEIGHT * sy,
        color,
        0.45
      ).setDepth(DEPTH.ZONE);
      this.add.text((zone.x + zone.w / 2) * sx, GAME_HEIGHT * 0.905, zone.id.toUpperCase(), {
        fontFamily: UI.FONT,
        fontSize: `${GAME.HEIGHT * UI.SMALL_RATIO}px`,
        color: zone.id === 'red' ? '#a3241c'
          : zone.id === 'blue' ? '#12457a'
          : UI.FIELD_TEXT,
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(DEPTH.ZONE_LABEL);
    }

    // Mesadas: tapa de madera + frente con tablas + sombra (volumen 3/4).
    for (const c of COUNTERS) {
      const x = c.x * sx;
      const y = c.y * sy;
      const w = c.w * sx;
      const h = c.h * sy;
      const faceH = h * STAGE.COUNTER_FACE_RATIO;
      const topH = h - faceH;

      // Sombra que apoya la mesada en el piso.
      this.add.rectangle(
        x + w / 2,
        y + h + STAGE.COUNTER_SHADOW_Y,
        w,
        h * STAGE.COUNTER_SHADOW_H,
        0x000000,
        STAGE.COUNTER_SHADOW_ALPHA
      ).setDepth(DEPTH.COUNTER);

      this.add.tileSprite(x + w / 2, y + topH / 2, w, topH, 'tile-counter-0')
        .setDepth(DEPTH.COUNTER);
      this.add.tileSprite(x + w / 2, y + topH + faceH / 2, w, faceH, 'tile-counter-face-0')
        .setDepth(DEPTH.COUNTER);
      this.add.rectangle(x + w / 2, y + h / 2, w, h)
        .setStrokeStyle(STAGE.COUNTER_LINE, COLORS.COUNTER, STAGE.COUNTER_LINE_ALPHA)
        .setDepth(DEPTH.COUNTER);
    }
  }

  // --- Decoración del escenario ---------------------------------------------
  // Props apoyados sobre las mesadas (tabla de picar, fuente, platos, planta).
  // Son puramente visuales: el servidor no los conoce y no colisionan.
  _decorateCounters() {
    for (const c of COUNTERS) {
      const cx = (c.x + c.w / 2) * this._sx;
      // Sobre la tapa (la parte de arriba de la mesada), no sobre el frente.
      const cy = (c.y + c.h * (1 - STAGE.COUNTER_FACE_RATIO) / 2) * this._sy;
      const depth = DEPTH.COUNTER + 1;

      switch (c.id) {
        case 'red-top':
          this._decorBoard(cx, cy, depth, false);
          break;
        case 'blue-top':
          this._decorBoard(cx, cy, depth, true);
          break;
        case 'red-bottom':
        case 'blue-bottom':
          this._decorBowl(cx, cy, depth, c.id === 'red-bottom' ? COLORS.TEAM_RED : COLORS.TEAM_BLUE);
          break;
        case 'pantry-top':
        case 'pantry-bottom':
          this._decorPlates(cx, cy, depth);
          break;
        case 'center':
          this._decorHerbPot(cx, cy, depth);
          break;
        default:
          break;
      }
    }
  }

  _decorShadow(w, h, depth) {
    return this.add.ellipse(0, h * DECOR.SHADOW_DY, w * DECOR.SHADOW_W, h * DECOR.SHADOW_H, 0x000000, DECOR.SHADOW_ALPHA)
      .setDepth(depth);
  }

  // Tabla de picar con cuchillo.
  _decorBoard(x, y, depth, mirrored = false) {
    const w = DECOR.BOARD_W * this._sx;
    const h = DECOR.BOARD_H * this._sy;
    const board = this.add.container(x - w * 0.06, y).setDepth(depth)
      .setAngle(mirrored ? -DECOR.BOARD_ROT : DECOR.BOARD_ROT);

    const shadow = this._decorShadow(w, h, depth);
    const top = this.add.rectangle(0, 0, w, h, DECOR.BOARD_COLOR)
      .setStrokeStyle(2, DECOR.BOARD_EDGE);
    const hole = this.add.circle(-w * 0.4, 0, h * 0.16, DECOR.BOARD_EDGE);
    const blade = this.add.rectangle(w * 0.06, 0, DECOR.KNIFE_W * this._sx, DECOR.KNIFE_H * this._sy, DECOR.KNIFE_COLOR)
      .setStrokeStyle(1, DECOR.KNIFE_EDGE);
    const handle = this.add.rectangle(
      w * 0.06 + DECOR.KNIFE_W * this._sx * 0.5 + DECOR.KNIFE_HANDLE_W * this._sx * 0.5,
      0,
      DECOR.KNIFE_HANDLE_W * this._sx,
      DECOR.KNIFE_H * this._sy,
      DECOR.KNIFE_HANDLE_COLOR
    );

    board.add([shadow, top, hole, blade, handle]);
  }

  // Fuente de guiso (color del equipo) con cuchara.
  _decorBowl(x, y, depth, soupColor) {
    const w = DECOR.BOWL_W * this._sx;
    const h = DECOR.BOWL_H * this._sy;
    const bowl = this.add.container(x, y).setDepth(depth);
    const shadow = this._decorShadow(w, h, depth);
    const dish = this.add.ellipse(0, 0, w, h, DECOR.BOWL_COLOR).setStrokeStyle(2, DECOR.BOWL_EDGE);
    const soup = this.add.ellipse(0, 0, w * DECOR.BOWL_INNER, h * DECOR.BOWL_INNER, soupColor);
    const spoon = this.add.rectangle(w * 0.34, -h * 0.16, w * 0.42, h * 0.16, DECOR.KNIFE_COLOR)
      .setAngle(DECOR.BOWL_SPOON_ROT);

    bowl.add([shadow, dish, soup, spoon]);
  }

  // Pila de platos limpios.
  _decorPlates(x, y, depth) {
    const w = DECOR.PLATE_W * this._sx;
    const h = DECOR.PLATE_H * this._sy;
    const plates = this.add.container(x, y).setDepth(depth);
    const shadow = this._decorShadow(w, h, depth);
    plates.add(shadow);

    for (let i = 0; i < DECOR.PLATE_COUNT; i += 1) {
      const plate = this.add.ellipse(
        0,
        -i * DECOR.PLATE_STEP * this._sy,
        w,
        h,
        DECOR.PLATE_COLOR
      ).setStrokeStyle(1, DECOR.PLATE_EDGE);
      plates.add(plate);
    }
  }

  // Planta aromática en la isla central.
  _decorHerbPot(x, y, depth) {
    const w = DECOR.HERB_POT_W * this._sx;
    const h = DECOR.HERB_POT_H * this._sy;
    const plant = this.add.container(x, y).setDepth(depth);
    const shadow = this._decorShadow(w, h, depth);
    const pot = this.add.rectangle(0, 0, w, h, DECOR.HERB_POT_COLOR)
      .setStrokeStyle(2, DECOR.HERB_POT_EDGE);
    const leafL = this.add.circle(-w * 0.28, -h * 0.8, DECOR.HERB_LEAF * this._sx, DECOR.HERB_COLOR);
    const leafC = this.add.circle(0, -h * DECOR.HERB_LEAF_Y, DECOR.HERB_LEAF * this._sx, DECOR.HERB_COLOR2);
    const leafR = this.add.circle(w * 0.3, -h * 0.78, DECOR.HERB_LEAF * this._sx, DECOR.HERB_COLOR);

    plant.add([shadow, pot, leafL, leafC, leafR]);
  }

  // --- Ollas ----------------------------------------------------------------
  _createPots() {
    this._pots = {};
    const potSize = SPRITE_SIZES.POT * this._sx;
    const ingSize = SPRITE_SIZES.INGREDIENT * this._sx;

    for (const team of ['red', 'blue']) {
      const pos = POTS[team];

      const container = this.add.container(pos.x * this._sx, pos.y * this._sy).setDepth(DEPTH.POT);
      // Alfombra del equipo: da identidad y calidez al piso de la cocina.
      const rug = this.add.ellipse(
        0,
        potSize * SHADOW.POT_Y,
        potSize * STAGE.RUG_W_RATIO,
        potSize * STAGE.RUG_H_RATIO,
        team === 'red' ? COLORS.KITCHEN_RED : COLORS.KITCHEN_BLUE,
        STAGE.RUG_ALPHA
      );
      // Sombra de contacto: apoya la cocina en el piso.
      const mat = this.add.ellipse(
        0,
        potSize * SHADOW.POT_Y,
        potSize * SHADOW.POT_W,
        potSize * SHADOW.POT_H,
        0x000000,
        SHADOW.ALPHA
      );
      const pot = this.add.image(0, 0, TEX.pot).setDisplaySize(potSize, potSize);

      // La olla se apoya en una cocina (hornalla) para leerse como cocina real.
      const stove = this.add.image(0, potSize * STAGE.STOVE_Y_RATIO, TEX.stove)
        .setDisplaySize(potSize * STAGE.STOVE_W_RATIO, potSize * STAGE.STOVE_H_RATIO);
      // Resplandor cálido cuando está cocinando (aditivo: no tapa el dibujo).
      const glow = this.add.circle(
        0,
        potSize * STAGE.GLOW_Y_RATIO,
        potSize * STAGE.GLOW_SIZE_RATIO,
        COLORS.STOVE_GLOW,
        0
      ).setBlendMode(Phaser.BlendModes.ADD).setVisible(false);

      // Hasta 3 ingredientes visibles dentro.
      const contents = [];
      for (let i = 0; i < 3; i += 1) {
        const c = this.add.image(0, 0, itemTex('masa'))
          .setDisplaySize(ingSize, ingSize)
          .setVisible(false);
        contents.push(c);
      }

      const smoke = this.add.image(0, 0, TEX.smoke)
        .setDisplaySize(ingSize, ingSize)
        .setVisible(false);
      const bar = this.add.graphics();

      container.add([rug, mat, stove, glow, pot, ...contents, smoke, bar]);

      this._pots[team] = {
        container, pot, stove, glow, contents, smoke, bar,
        r: potSize / 2,
        label: this.add.text(pos.x * this._sx, (pos.y + SPRITE_SIZES.POT * 0.82) * this._sy, team.toUpperCase(), {
          fontFamily: UI.FONT,
          fontSize: `${GAME.HEIGHT * UI.SMALL_RATIO * 0.8}px`,
          color: UI.FIELD_MUTED,
          fontStyle: 'bold',
        }).setOrigin(0.5, 0).setDepth(DEPTH.POT),
      };
    }
  }

  _updatePots(time) {
    const pots = gameState.pots;
    if (!pots) return;

    const ingSize = SPRITE_SIZES.INGREDIENT * COOKING.CONTENT_SCALE * this._sx;

    for (const team of ['red', 'blue']) {
      const state = pots[team];
      const view = this._pots[team];
      if (!state || !view) continue;

      // Contenido.
      for (let i = 0; i < view.contents.length; i += 1) {
        const img = view.contents[i];
        if (i < state.contents.length) {
          img.setVisible(true);
          img.setTexture(itemTex(state.contents[i]));
          img.setDisplaySize(ingSize, ingSize);
          img.setPosition(
            (i - 1) * COOKING.CONTENT_GAP * this._sx,
            -view.r * COOKING.CONTENT_Y_RATIO
          );
        } else {
          img.setVisible(false);
        }
      }

      // Humo verde si está contaminada (parpadeo).
      view.smoke.setVisible(!!state.contaminated);
      if (state.contaminated) {
        view.smoke.setDisplaySize(ingSize, ingSize);
        view.smoke.setAlpha(0.35 + 0.2 * Math.abs(Math.sin(time * 0.005)));
        view.smoke.setPosition(0, -view.r * 0.7);
      }

      // Barra de progreso de cocción.
      view.bar.clear();
      if (state.cooking) {
        const w = COOKING.BAR_W * this._sx;
        const h = COOKING.BAR_H * this._sx;
        const y = -view.r - COOKING.BAR_GAP * this._sx;
        view.bar.fillStyle(COLORS.BAR_BG, 0.7);
        view.bar.fillRect(-w / 2, y, w, h);
        view.bar.fillStyle(COLORS.BAR_FILL, 1);
        view.bar.fillRect(-w / 2, y, w * Math.max(0, Math.min(1, state.progress)), h);
      }

      // Hornalla: resplandor cálido al cocinar, verde si está contaminada.
      if (state.cooking) {
        view.glow.setVisible(true);
        view.glow.setFillStyle(
          COLORS.STOVE_GLOW,
          STAGE.GLOW_ALPHA + Math.sin(time * FX.POT_PULSE_SPEED) * STAGE.GLOW_PULSE
        );
      } else if (state.contaminated) {
        view.glow.setVisible(true);
        view.glow.setFillStyle(COLORS.SMOKE, STAGE.GLOW_ALPHA);
      } else {
        view.glow.setVisible(false);
      }

      // La olla late suavemente si está cocinando.
      view.container.setAlpha(state.cooking ? 1 : 0.9);
      view.container.setScale(
        state.cooking ? 1 + Math.sin(time * FX.POT_PULSE_SPEED) * FX.POT_PULSE_AMOUNT : 1
      );
    }
  }

  // --- HUD ------------------------------------------------------------------
  _createHud() {
    const style = {
      fontFamily: UI.FONT,
      fontSize: `${GAME.HEIGHT * UI.SMALL_RATIO}px`,
      fontStyle: 'bold',
    };

    this._tickets = {};
    for (const team of ['red', 'blue']) {
      this._tickets[team] = this._createTicket(team);
    }
    this.scoreText = this.add.text(GAME.WIDTH * 0.5, GAME.HEIGHT * 0.09, '', {
      ...style, color: UI.FIELD_TEXT,
    }).setOrigin(0.5, 0).setDepth(DEPTH.HUD);
    this.timerText = this.add.text(GAME.WIDTH * 0.5, GAME.HEIGHT * 0.02, '', {
      fontFamily: UI.FONT,
      fontSize: `${GAME.HEIGHT * UI.HEADING_RATIO}px`,
      color: COLORS.ACCENT,
      fontStyle: 'bold',
      stroke: COLORS.UI_SHADOW,
      strokeThickness: UI.TEXT_STROKE,
    }).setOrigin(0.5, 0).setDepth(DEPTH.HUD);
    this.statusText = this.add.text(GAME.WIDTH * 0.5, GAME.HEIGHT * 0.97, '', {
      fontFamily: UI.FONT,
      fontSize: `${GAME.HEIGHT * UI.SMALL_RATIO * 0.8}px`,
      color: UI.FIELD_MUTED,
    }).setOrigin(0.5, 1).setDepth(DEPTH.HUD);

    this.muteText = this.add.text(GAME.WIDTH * 0.98, GAME.HEIGHT * 0.965, '', {
      fontFamily: UI.FONT,
      fontSize: `${GAME.HEIGHT * UI.SMALL_RATIO * 0.8}px`,
      color: UI.FIELD_MUTED,
    }).setOrigin(1, 1).setDepth(DEPTH.HUD);
  }

  // Comanda de papel: cabecera con el color del equipo, nombre del plato e
  // iconos de los ingredientes que faltan.
  _createTicket(team) {
    const s = this._sx;
    const w = TICKET.W * s;
    const h = TICKET.H * this._sy;
    const x = team === 'red' ? TICKET.MARGIN * s : GAME.WIDTH - (TICKET.MARGIN + TICKET.W) * s;
    const color = team === 'red' ? COLORS.TEAM_RED : COLORS.TEAM_BLUE;

    const container = this.add.container(x, TICKET.TOP * this._sy).setDepth(DEPTH.HUD);
    const gfx = this.add.graphics();

    // Sombra y papel.
    gfx.fillStyle(0x000000, TICKET.SHADOW_ALPHA);
    gfx.fillRoundedRect(TICKET.SHADOW_OFFSET * s, TICKET.SHADOW_OFFSET * s, w, h, TICKET.RADIUS * s);
    gfx.fillStyle(TICKET.PAPER, 1);
    gfx.fillRoundedRect(0, 0, w, h, TICKET.RADIUS * s);
    // Cabecera del equipo.
    gfx.fillStyle(color, 1);
    gfx.fillRoundedRect(0, 0, w, TICKET.HEADER_H * this._sy, {
      tl: TICKET.RADIUS * s,
      tr: TICKET.RADIUS * s,
      bl: 0,
      br: 0,
    });
    // Línea de corte punteada.
    gfx.lineStyle(1, TICKET.LINE, 0.5);
    const dashY = (TICKET.HEADER_H + TICKET.DASH_Y) * this._sy;
    for (let dx = TICKET.DASH_PAD * s; dx < w - TICKET.DASH_PAD * s; dx += TICKET.DASH_STEP * s) {
      gfx.lineBetween(dx, dashY, dx + TICKET.DASH_LEN * s, dashY);
    }
    gfx.lineStyle(TICKET.BORDER, TICKET.LINE, 0.9);
    gfx.strokeRoundedRect(0, 0, w, h, TICKET.RADIUS * s);

    const headerStyle = {
      fontFamily: UI.FONT,
      fontSize: `${TICKET.TITLE_SIZE * s}px`,
      fontStyle: 'bold',
      color: '#ffffff',
    };
    const title = this.add.text(TICKET.TEXT_X * s, (TICKET.HEADER_H / 2) * this._sy, 'COMANDA', headerStyle)
      .setOrigin(0, 0.5);
    const teamLabel = this.add.text(
      w - TICKET.TEXT_X * s,
      (TICKET.HEADER_H / 2) * this._sy,
      team === 'red' ? 'ROJO' : 'AZUL',
      headerStyle
    ).setOrigin(1, 0.5);

    const name = this.add.text(TICKET.NAME_X * s, TICKET.NAME_Y * this._sy, '', {
      fontFamily: UI.FONT,
      fontSize: `${TICKET.NAME_SIZE * s}px`,
      fontStyle: 'bold',
      color: '#3a2f24',
    });

    const icons = [];
    for (let i = 0; i < TICKET.MAX_ICONS; i += 1) {
      icons.push(this.add.image(
        (TICKET.ICON_X + i * (TICKET.ICON_SIZE + TICKET.ICON_GAP)) * s,
        TICKET.ICON_Y * this._sy,
        itemTex('masa')
      ).setDisplaySize(TICKET.ICON_SIZE * s, TICKET.ICON_SIZE * s).setVisible(false));
    }

    // Cinta adhesiva: la comanda parece colgada de la pared.
    const tape = this.add.rectangle(
      w / 2,
      -TICKET.TAPE_H * 0.5 * this._sy,
      TICKET.TAPE_W * s,
      TICKET.TAPE_H * this._sy,
      TICKET.TAPE_COLOR,
      0.85
    ).setAngle(TICKET.TAPE_ROT);

    container.add([gfx, name, ...icons, title, teamLabel, tape]);
    return { container, name, icons };
  }

  _updateHud() {
    const order = gameState.order;
    const score = gameState.score;

    for (const team of ['red', 'blue']) {
      const ticket = this._tickets[team];
      const current = order?.[team];
      ticket.name.setText(current?.name ?? '—');
      const kinds = current?.ingredients ?? [];
      ticket.icons.forEach((icon, i) => {
        if (i < kinds.length) {
          icon.setTexture(itemTex(kinds[i])).setVisible(true);
        } else {
          icon.setVisible(false);
        }
      });
    }

    this.scoreText.setText(`ROJO ${score?.red ?? 0}  —  ${score?.blue ?? 0} AZUL`);

    if (gameState.phase === 'sudden_death') {
      this.timerText.setText('MUERTE SÚBITA');
    } else {
      const t = gameState.timeLeft;
      if (t == null) {
        this.timerText.setText('—:—');
      } else {
        const seg = Math.max(0, Math.ceil(t));
        const mm = Math.floor(seg / 60);
        const ss = String(seg % 60).padStart(2, '0');
        this.timerText.setText(`${mm}:${ss}`);
      }
    }

    const n = Object.keys(gameState.players || {}).length;
    this.statusText.setText(
      `tick ${gameState.tick} · jugadores ${n} · Espacio = agarrar/soltar · E = tomate · WASD/flechas = moverse`
    );
    this.muteText.setText(`M = sonido: ${gameState.isMuted ? 'OFF' : 'ON'}`);
  }

  // --- Input ----------------------------------------------------------------
  _keyDown(e) {
    if (e.repeat) return;
    const key = e.key?.toLowerCase();
    // Evita que las flechas (y Espacio) scrolleen la página durante la partida.
    if (key === ' ' || key?.startsWith('arrow')) e.preventDefault();

    if (key === ' ') {
      // Al apretar arranca el "hold" (el SERVIDOR mide los 2 s de forma autoritativa).
      if (this._spaceDownAt === 0) {
        this._spaceDownAt = performance.now();
        networkManager.sendAction('hold');
      }
      return;
    }
    if (key === 'e') {
      networkManager.sendAction('throw');
      return;
    }
    const dir = KEY_TO_DIR[key];
    if (dir) {
      this._keys[dir] = true;
      this._maybeSendInput();
    }
  }

  _keyUp(e) {
    const key = e.key?.toLowerCase();

    if (key === ' ') {
      if (this._spaceDownAt === 0) return;
      const held = performance.now() - this._spaceDownAt;
      this._spaceDownAt = 0;
      // Se decide AL SOLTAR: si fue corto es un tap (y el servidor corta el volcado);
      // si llegó a los 2 s, el servidor ya hizo el vaciado/volcado -> sólo se avisa.
      networkManager.sendAction(held >= HOLD_SECONDS * 1000 ? 'holdStop' : 'tap');
      return;
    }
    const dir = KEY_TO_DIR[key];
    if (dir) {
      this._keys[dir] = false;
      this._maybeSendInput();
    }
  }

  /** Manda input SÓLO si cambió el conjunto de teclas. */
  _maybeSendInput() {
    const changed = Object.keys(NEUTRAL_KEYS).some((k) => this._keys[k] !== this._sentKeys[k]);
    if (!changed) return;
    this._sentKeys = { ...this._keys };
    networkManager.sendInput(this._keys);
  }

  // --- Jugadores ------------------------------------------------------------
  _createAvatar(id, info) {
    const size = SPRITE_SIZES.PLAYER * this._sx;
    const texKey = info.team === 'blue' ? PLAYER_TEX.blue : PLAYER_TEX.red;

    const container = this.add.container(0, 0).setDepth(DEPTH.PLAYER);
    const shadow = this.add.ellipse(
      0,
      size * SHADOW.AVATAR_Y,
      size * SHADOW.AVATAR_W,
      size * SHADOW.AVATAR_H,
      0x000000,
      SHADOW.ALPHA
    );
    const body = this.add.sprite(0, 0, texKey).setDisplaySize(size, size);
    body.play(`walk-${info.team}`);
    const ring = this.add.circle(0, 0, size * 0.42).setStrokeStyle(2, 0x000000, 0.7);
    const label = this.add.text(0, -size * 0.5 - UI.AVATAR_NAME_OFFSET, info.name || '', {
      fontFamily: UI.FONT,
      fontSize: `${Math.round(size * 0.48)}px`,
      color: COLORS.UI_TEXT,
      fontStyle: 'bold',
      stroke: COLORS.UI_SHADOW,
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Lo que lleva en la mano.
    const carried = this.add.image(
      0,
      -size * 0.5 - COOKING.CARRIED_OFFSET * this._sx,
      itemTex('masa')
    ).setDisplaySize(SPRITE_SIZES.CARRIED * this._sx, SPRITE_SIZES.CARRIED * this._sx).setVisible(false);

    container.add([shadow, body, ring, label, carried]);

    // Estrellitas de aturdimiento: orbitan sobre la cabeza mientras dura el stun.
    const stars = this.add.container(0, -size * STUN_FX.STAR_Y);
    for (let i = 0; i < STUN_FX.STARS; i += 1) {
      const a = (Math.PI * 2 * i) / STUN_FX.STARS;
      const star = this.add.image(
        Math.cos(a) * size * STUN_FX.STAR_ORBIT,
        Math.sin(a) * size * STUN_FX.STAR_ORBIT * STUN_FX.STAR_SQUASH,
        TEX.star
      ).setDisplaySize(size * STUN_FX.STAR_SIZE, size * STUN_FX.STAR_SIZE);
      stars.add(star);
    }
    stars.setVisible(false);
    container.add(stars);
    if (id === gameState.selfId) ring.setStrokeStyle(3, 0xffffff, 0.9);

    // Barra de progreso del volcado/vaciado (hold 2 s), sobre el avatar.
    const dumpBar = this.add.graphics();
    container.add(dumpBar);

    return {
      container, body, ring, label, carried, dumpBar,
      stunned: false, stars, stunSpin: null, stunWobble: null,
      lastX: null, lastY: null,
    };
  }

  _startStun(av) {
    av.stunned = true;
    av.stars.setVisible(true).setScale(STUN_FX.POP_SCALE);
    this.tweens.add({
      targets: av.stars,
      scale: 1,
      duration: STUN_FX.POP_MS,
      ease: 'Back.easeOut',
    });
    av.stunSpin = this.tweens.add({
      targets: av.stars,
      angle: STUN_FX.SPIN_DEG,
      duration: STUN_FX.SPIN_MS,
      repeat: -1,
    });
    av.stunWobble = this.tweens.add({
      targets: av.body,
      angle: { from: -STUN_FX.WOBBLE_DEG, to: STUN_FX.WOBBLE_DEG },
      duration: STUN_FX.WOBBLE_MS,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  _stopStun(av) {
    av.stunned = false;
    av.stars.setVisible(false);
    if (av.stunSpin) av.stunSpin.remove();
    if (av.stunWobble) av.stunWobble.remove();
    av.stunSpin = null;
    av.stunWobble = null;
    av.body.setAngle(0);
    av.body.clearTint();
  }

  _updatePlayers() {
    const players = networkManager.curr;
    if (!players) return;

    const positions = networkManager.interpolated();

    for (const [id, av] of this._avatars) {
      if (!players[id]) {
        if (av.stunned) this._stopStun(av);
        av.container.destroy();
        this._avatars.delete(id);
      }
    }

    for (const id of Object.keys(players)) {
      const info = players[id];
      let av = this._avatars.get(id);
      if (!av) {
        av = this._createAvatar(id, info);
        this._avatars.set(id, av);
      }
      const pos = positions[id] || info;
      const px = pos.x * this._sx;
      const py = pos.y * this._sy;
      av.container.setPosition(px, py);

      // Animación de caminata: se activa sólo cuando el avatar se movió.
      const moved = av.lastX !== null && Math.hypot(px - av.lastX, py - av.lastY) > 0.5;
      if (moved) {
        if (!av.body.anims.isPlaying) av.body.play(`walk-${info.team}`);
      } else if (av.body.anims.isPlaying) {
        av.body.anims.stop();
        av.body.setFrame(0);
      }
      av.lastX = px;
      av.lastY = py;

      // Ingrediente llevado (o el aceite).
      av.carried.setVisible(!!info.carrying);
      if (info.carrying) av.carried.setTexture(itemTex(info.carrying));

      // Aturdido: estrellitas girando + tambaleo + tinte suave (el detalle del
      // sprite se sigue viendo). Resbalando: halo dorado.
      if (info.stunned) {
        if (!av.stunned) this._startStun(av);
        av.body.setTint(0xffd6d6);
      } else if (av.stunned) {
        this._stopStun(av);
      }
      if (info.stunned) {
        av.ring.setStrokeStyle(3, COLORS.STUN_STAR, 1);
      } else if (info.slipping) {
        av.ring.setStrokeStyle(3, COLORS.OIL_ITEM, 1);
      } else {
        av.ring.setStrokeStyle(2, 0x000000, 0.7);
      }

      // Barra de volcado/vaciado.
      av.dumpBar.clear();
      if (info.dumping) {
        const w = COOKING.BAR_W * this._sx;
        const h = COOKING.BAR_H * this._sx;
        const y = -SPRITE_SIZES.PLAYER * this._sx * 0.5 - COOKING.BAR_OFFSET * this._sx;
        av.dumpBar.fillStyle(COLORS.BAR_BG, 0.75);
        av.dumpBar.fillRect(-w / 2, y, w, h);
        av.dumpBar.fillStyle(COLORS.TOMATO, 1);
        av.dumpBar.fillRect(-w / 2, y, w * Math.max(0, Math.min(1, info.dumping.progress)), h);
      }
    }
  }

  // --- Ingredientes del piso ------------------------------------------------
  _updateItems() {
    const items = gameState.ingredients || [];
    const size = SPRITE_SIZES.INGREDIENT * this._sx;
    const labelSize = Math.round(GAME.HEIGHT * UI.ITEM_LABEL_RATIO);

    for (const [id, view] of this._items) {
      if (!items.some((i) => i.id === id)) {
        view.container.destroy();
        this._items.delete(id);
      }
    }

    for (const item of items) {
      let view = this._items.get(item.id);
      if (!view) {
        // Sprite + nombre: con 8 ingredientes distintos, el texto evita dudas
        // sobre qué es cada cosa (masa y papa se parecían demasiado).
        const img = this.add.image(0, 0, itemTex(item.kind)).setDisplaySize(size, size);
        const label = this.add.text(0, size * UI.ITEM_LABEL_OFFSET, item.kind.toUpperCase(), {
          fontFamily: UI.FONT,
          fontSize: `${labelSize}px`,
          color: UI.FIELD_TEXT,
          fontStyle: 'bold',
        }).setOrigin(0.5, 0);
        const container = this.add.container(0, 0, [img, label]).setDepth(DEPTH.ITEM);
        view = { container, img, label };
        this._items.set(item.id, view);
      }
      view.container.setPosition(item.x * this._sx, item.y * this._sy);
    }
  }

  // --- Tomates (proyectil) --------------------------------------------------
  _updateTomatoes() {
    const tomatoes = gameState.tomatoes || [];
    const size = SPRITE_SIZES.TOMATO * this._sx;

    for (const [id, img] of this._tomatoes) {
      if (!tomatoes.some((t) => t.id === id)) {
        img.destroy();
        this._tomatoes.delete(id);
      }
    }

    for (const t of tomatoes) {
      let img = this._tomatoes.get(t.id);
      if (!img) {
        img = this.add.image(0, 0, TEX.tomato).setDisplaySize(size, size).setDepth(DEPTH.TOMATO);
        this._tomatoes.set(t.id, img);
      }
      img.setPosition(t.x * this._sx, t.y * this._sy);
    }
  }

  // --- Aceite (power-up) y charcos ------------------------------------------
  _updateOil() {
    const oil = gameState.oil;
    if (!oil) {
      if (this._oilCircle) {
        this._oilCircle.destroy();
        this._oilCircle = null;
      }
      return;
    }
    if (!this._oilCircle) {
      const size = SPRITE_SIZES.OIL * this._sx;
      this._oilCircle = this.add.image(0, 0, TEX.oil).setDisplaySize(size, size).setDepth(DEPTH.OIL);
    }
    this._oilCircle.setPosition(oil.x * this._sx, oil.y * this._sy);
  }

  _updatePuddles() {
    const puddles = gameState.puddles || [];
    const size = SPRITE_SIZES.PUDDLE * this._sx;

    for (const [id, img] of this._puddles) {
      if (!puddles.some((p) => p.id === id)) {
        img.destroy();
        this._puddles.delete(id);
      }
    }

    for (const p of puddles) {
      let img = this._puddles.get(p.id);
      if (!img) {
        img = this.add.image(0, 0, TEX.puddle).setDisplaySize(size, size).setAlpha(0.75).setDepth(DEPTH.PUDDLE);
        this._puddles.set(p.id, img);
      }
      img.setPosition(p.x * this._sx, p.y * this._sy);
    }
  }

  // --- Onboarding -----------------------------------------------------------
  // Recordatorio breve al empezar; se va solo. No bloquea input (no interactivo).
  _showStartHint() {
    const w = GAME.WIDTH * 0.56;
    const h = GAME.HEIGHT * 0.15;
    const box = this.add.container(GAME.WIDTH / 2, GAME.HEIGHT * 0.3).setDepth(DEPTH.OVERLAY);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.55);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, UI.BTN_RADIUS);

    const title = this.add.text(0, -h * 0.18, '¡A COCINAR!', {
      fontFamily: UI.FONT,
      fontSize: `${GAME.HEIGHT * UI.HEADING_RATIO * 0.7}px`,
      color: COLORS.ACCENT,
      fontStyle: 'bold',
      stroke: COLORS.UI_SHADOW,
      strokeThickness: UI.TEXT_STROKE,
    }).setOrigin(0.5);

    const sub = this.add.text(0, h * 0.2, 'WASD o flechas: mover  ·  ESPACIO: cargar (2 s = volcar)  ·  E: tomate', {
      fontFamily: UI.FONT,
      fontSize: `${GAME.HEIGHT * UI.SMALL_RATIO * 0.9}px`,
      color: COLORS.UI_TEXT,
    }).setOrigin(0.5);

    box.add([bg, title, sub]);
    this.tweens.add({
      targets: box,
      alpha: 0,
      delay: ONBOARDING.LINGER,
      duration: ONBOARDING.FADE,
      onComplete: () => box.destroy(),
    });
  }

  // --- Juice -----------------------------------------------------------------
  // Se diffea por TICK (no por frame): el estado sólo cambia cuando llega un
  // snapshot nuevo del servidor.
  _updateFx(time) {
    const tick = gameState.tick;

    if (tick !== this._lastFxTick) {
      const snap = {
        pots: gameState.pots,
        players: gameState.players,
        tomatoes: gameState.tomatoes,
        score: gameState.score,
      };

      if (this._prevFx) this._fx.handle(diffFx(this._prevFx, snap), this._sx, this._sy);

      const changedScore = this._prevScore
        && (this._prevScore.red !== gameState.score.red || this._prevScore.blue !== gameState.score.blue);
      if (changedScore) this._fx.pulse(this.scoreText);

      this._prevFx = snap;
      this._prevScore = { ...gameState.score };
      this._lastFxTick = tick;
    }

    this._fx.updateSteam(time, gameState.pots, this._sx, this._sy);
  }

  // --- Loop -----------------------------------------------------------------
  update(time) {
    // La partida terminó: fundido a negro y recién ahí la pantalla final.
    if (gameState.mode === 'game_over') {
      if (!this._leaving) {
        this._leaving = true;
        this.cameras.main.fadeOut(FX.GAME_OVER_FADE, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.start('GameOverScene');
        });
      }
      return;
    }
    this._updatePlayers();
    this._updateItems();
    this._updateTomatoes();
    this._updateOil();
    this._updatePuddles();
    this._updatePots(time);
    this._updateHud();
    this._updateFx(time);
  }
}
