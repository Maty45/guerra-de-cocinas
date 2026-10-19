import { defineConfig, devices } from '@playwright/test';

// QA E2E del cliente. El servidor autoritativo y el cliente viven en el mismo
// puerto (3000) vía `npm start`, así que Playwright lo levanta solo.
//
// Para los tests multijugador (7 jugadores) se usan varios `browserContext`
// dentro de un mismo test — ver tests/e2e/ en cada milestone.

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // el estado de partida es compartido entre contextos
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list']],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Menos peso por navegador: sin salida de audio y sin /dev/shm compartido.
    launchOptions: {
      args: ['--mute-audio', '--disable-dev-shm-usage'],
    },
  },

  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 200,
      threshold: 0.3,
    },
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
    // Habilita el hook de test del servidor (acortar el reloj de 5:00 en e2e).
    env: { ALLOW_TEST_HOOKS: '1' },
  },
});
