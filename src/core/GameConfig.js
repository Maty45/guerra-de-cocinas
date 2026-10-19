import Phaser from 'phaser';
import { GAME, COLORS, DPR, AUTOMATION } from './Constants.js';
import { LobbyScene } from '../scenes/LobbyScene.js';
import { GameScene } from '../scenes/GameScene.js';
import { GameOverScene } from '../scenes/GameOverScene.js';

// En automatización (Playwright) el cliente corre a 20 fps: los tests verifican
// estado autoritativo, no animación, y así no se satura la máquina.
const AUTOMATED = typeof navigator !== 'undefined' && navigator.webdriver;

export const GameConfig = {
  type: Phaser.AUTO,
  width: GAME.WIDTH,
  height: GAME.HEIGHT,
  parent: 'game-container',
  backgroundColor: COLORS.FLOOR,
  roundPixels: true,
  antialias: true,
  ...(AUTOMATED ? { fps: { target: AUTOMATION.RENDER_FPS, forceSetTimeOut: true } } : {}),
  render: {
    preserveDrawingBuffer: true, // necesario para screenshots de iterate-client
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: 1 / DPR,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: GAME.GRAVITY }, // top-down: 0
      debug: false,
    },
  },
  scene: [LobbyScene, GameScene, GameOverScene],
};
