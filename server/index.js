// =============================================================================
// server/index.js — servidor autoritativo.
//
// Un SOLO puerto sirve:
//   1) el cliente compilado (dist/) por HTTP
//   2) el WebSocket del juego (mismo puerto)
//
// Milestone 01: lobby (nombres, host, sorteo de equipos, reconexión).
// La simulación (20 Hz, movimiento, ollas, sabotajes) llega en 02–05.
// =============================================================================

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

import { DEFAULT_PORT, WS_PATH, TICK_RATE, TICK_MS } from '../shared/constants.js';
import { MSG } from '../shared/protocol.js';
import { Lobby } from './lobby.js';
import { Game } from './game.js';
import { createLoop } from './loop.js';
import { lanAddress } from './net.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');

// --- Puerto: --port <n> > env PORT > DEFAULT_PORT ---------------------------
function resolvePort() {
  const i = process.argv.indexOf('--port');
  if (i !== -1 && process.argv[i + 1]) return Number(process.argv[i + 1]);
  if (process.env.PORT) return Number(process.env.PORT);
  return DEFAULT_PORT;
}
const PORT = resolvePort();

// --- Estáticos --------------------------------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
};

function serveStatic(req, res) {
  if (!fs.existsSync(DIST_DIR)) {
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('dist/ no existe todavía. Corré `npm run build` (o usá `npm start`).\n');
    return;
  }

  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  let filePath = path.join(DIST_DIR, urlPath === '/' ? 'index.html' : urlPath);

  if (!filePath.startsWith(DIST_DIR)) { // anti path-traversal
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html'); // fallback SPA
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer(serveStatic);

// --- Lobby + partida + WebSocket --------------------------------------------
const lobby = new Lobby();
const wss = new WebSocketServer({ server, path: WS_PATH });
let socketSeq = 0;

let game = null;   // simulación activa (Milestone 02+)
let loop = null;   // loop a 20 Hz

function dtSeconds() {
  return TICK_MS / 1000;
}

function send(socket, obj) {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(obj));
}

function broadcast(obj) {
  const data = JSON.stringify(obj);
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) client.send(data);
  }
}

function broadcastRoster() {
  broadcast({
    type: MSG.ROSTER,
    roster: lobby.roster(),
    hostId: lobby.host?.id ?? null,
    canStart: lobby.canStart(),
  });
}

/**
 * Termina la partida en curso: para el loop, descarta la simulación y vacía la
 * sala. Se llama cuando ya no quedan jugadores suficientes para seguir jugando.
 */
function endMatch() {
  if (loop) {
    loop.stop();
    loop = null;
  }
  game = null;
  lobby.reset();
}

/**
 * (Re)arranca una partida: vuelve a sortear equipos, crea la simulación y la
 * pone en marcha. Lo usan EMPEZAR y REVANCHA.
 */
function beginMatch() {
  const teams = lobby.assignTeams();

  game = new Game();
  for (const p of lobby.connectedPlayers) {
    game.addPlayer(p.id, { name: p.name, team: p.team });
  }
  if (loop) loop.stop();
  loop = createLoop(() => {
    game.step(dtSeconds());
    broadcast({ type: MSG.STATE, ...game.snapshot() });
  }, TICK_MS);
  loop.start();

  broadcast({ type: MSG.MATCH_START, teams });
  broadcastRoster();
  return teams;
}

wss.on('connection', (socket) => {
  socket.id = `s${++socketSeq}`;
  send(socket, { type: MSG.HELLO, tickRate: TICK_RATE });

  socket.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    switch (msg.type) {
      case MSG.JOIN: {
        const res = lobby.addPlayer(socket.id, msg.name);
        if (res.error) {
          send(socket, { type: MSG.ERROR, code: res.error });
          return;
        }

        // Reconexión a una partida en curso: vuelve al mapa con su equipo.
        const inMatch = !!(game && res.player.team);
        if (inMatch && !game.getPlayer(res.player.id)) {
          game.addPlayer(res.player.id, { name: res.player.name, team: res.player.team });
        }

        send(socket, {
          type: MSG.WELCOME,
          you: { id: res.player.id, name: res.player.name },
          isHost: lobby.host?.id === res.player.id,
          canStart: lobby.canStart(),
          roster: lobby.roster(),
          hostId: lobby.host?.id ?? null,
          mode: inMatch ? 'playing' : 'menu',
        });
        broadcastRoster();
        break;
      }

      case MSG.START:
      case MSG.REMATCH: {
        const player = lobby.findBySocket(socket.id);
        if (!player || lobby.host?.id !== player.id) {
          send(socket, { type: MSG.ERROR, code: 'not_host' });
          break;
        }
        if (!lobby.canStart()) {
          send(socket, { type: MSG.ERROR, code: 'not_enough_players' });
          break;
        }
        beginMatch();
        break;
      }

      case MSG.TEST: {
        // Hook de test: sólo con ALLOW_TEST_HOOKS (nunca en producción).
        if (!process.env.ALLOW_TEST_HOOKS) break;
        const player = lobby.findBySocket(socket.id);
        if (!player) break;

        // `place`: recoloca a un jugador para que el E2E no tenga que caminar.
        if (msg.action === 'place' && game) {
          let targetId = player.id;
          if (msg.target) {
            for (const p of game.players.values()) {
              if (p.id === msg.target || p.name === msg.target) { targetId = p.id; break; }
            }
          }
          game.placePlayer(targetId, msg.x, msg.y);
          break;
        }

        // El resto de los hooks, sólo el host.
        if (lobby.host?.id !== player.id) break;
        if (msg.action === 'endMatch' && game) game.forceEnd(msg.winner || 'red');
        break;
      }

      case MSG.INPUT: {
        const player = lobby.findBySocket(socket.id);
        if (player && game) game.setInput(player.id, msg.keys);
        break;
      }

      case MSG.ACTION: {
        const player = lobby.findBySocket(socket.id);
        if (player && game) game.setAction(player.id, msg.kind);
        break;
      }

      default:
        break;
    }
  });

  socket.on('close', () => {
    const player = lobby.findBySocket(socket.id);
    lobby.disconnect(socket.id);
    if (game && player) game.disconnect(player.id);
    // Se quedó sin nadie conectado: termina la partida y vuelve al lobby.
    // (Con 1 jugador la partida sigue viva para permitir la reconexión.)
    if (game && lobby.connectedPlayers.length === 0) endMatch();
    broadcastRoster();
  });
});

// --- Arranque ---------------------------------------------------------------
server.listen(PORT, () => {
  const ip = lanAddress();
  if (PORT !== DEFAULT_PORT) {
    console.log(`Guerra de Cocinas — servidor (modo dev)\n  WS: ws://localhost:${PORT}${WS_PATH}`);
  } else {
    console.log('Guerra de Cocinas — servidor');
    console.log(`  Jugá en:  http://${ip}:${PORT}`);
    console.log(`  Local:    http://localhost:${PORT}`);
  }
});
