// =============================================================================
// server/game.js — simulación AUTORITATIVA.
//
// Milestone 02: movimiento + colisiones.
// Milestone 03: despensa, agarrar/soltar, carga de la olla, cocción y puntaje.
// Milestone 04: tomatazo, stun, robar, contaminar la olla rival, volcar y aceite.
//
// Puro y determinista: `step(dt)` avanza la simulación. El transporte lo llama a
// 20 Hz. Sin red, sin timers -> testeable con `node --test`.
//
// Orden por tick:
//   1. timers (cooldown tomate, stun, resbalón)
//   2. integrar movimiento (normalizado, respetando stun/resbalón)
//   3. límites del mapa
//   4. colisión contra mesadas
//   5. colisión contra ollas (círculos)
//   6. colisión entre jugadores
//   7. re-clamp de límites
//   8. detección de charcos (resbalón)
//   9. tomates (mover + impactar)
//  10. cocción de cada olla (sirve plato + avanza comanda)
//  11. volcado/vaciado (hold 2 s)
//  12. aceite (spawn) + decaimiento de charcos
//  13. despensa (spawn por timer + disponibilidad garantizada)
// =============================================================================

import {
  PLAYER_SPEED,
  PLAYER_RADIUS,
  COOK_SECONDS,
  COOK_SECONDS_SMALL_TEAM,
  INGREDIENT_SPAWN_EVERY,
  MAX_FLOOR_INGREDIENTS,
  INGREDIENT_MIN_SPACING,
  POT_INTERACT_RADIUS,
  ITEM_INTERACT_RADIUS,
  POT_RADIUS,
  HOLD_SECONDS,
  MATCH_SECONDS,
  TOMATO_COOLDOWN,
  STUN_SECONDS,
  TOMATO_SPEED,
  TOMATO_RADIUS,
  TOMATO_MAX_LIFE,
  OIL_SPAWN_EVERY,
  OIL_PUDDLE_SECONDS,
  SLIP_SECONDS,
  OIL_RADIUS,
} from '../shared/constants.js';
import { MAP, SPAWNS, POTS, PANTRY, PANTRY_SPOTS, OIL_SPAWN } from '../shared/map.js';
import { clamp, resolveCircleRect, circleIntersectsRect } from './geometry.js';
import { recipeForOrder, INGREDIENT_KINDS } from './recipes.js';
import { createPot, insert, empty, advance, progress, stealLast } from './pot.js';

const TEAMS = ['red', 'blue'];
const OIL = 'aceite';

function dist2(ax, ay, bx, by) {
  return (ax - bx) ** 2 + (ay - by) ** 2;
}

export class Game {
  constructor({ map = MAP, spawns = SPAWNS, pots = POTS, rng = Math.random } = {}) {
    this.map = map;
    this.spawns = spawns;
    this.potPositions = pots;
    this.rng = rng;

    /** @type {Map<string, object>} */ this.players = new Map();
    this.tick = 0;
    this._spawnIndex = { red: 0, blue: 0 };

    // --- Cocina (milestone 03) ---
    this.pots = { red: createPot('red'), blue: createPot('blue') };
    this.orders = { red: 0, blue: 0 };
    this.score = { red: 0, blue: 0 };
    this.ingredients = [];
    this._ingredientSeq = 0;
    this._spawnTimer = 0;

    // --- Partida (milestone 05) ---
    this.timeLeft = MATCH_SECONDS;   // reloj autoritativo
    this.phase = 'playing';          // 'playing' | 'sudden_death' | 'game_over'
    this.winner = null;              // 'red' | 'blue' | null

    // --- Sabotaje (milestone 04) ---
    this.tomatoes = [];
    this._tomatoSeq = 0;
    this.oilItem = null;              // power-up en el piso
    this._oilTimer = 0;
    this.puddles = [];                // charcos de aceite
    this._puddleSeq = 0;
  }

  // --- Jugadores -------------------------------------------------------------

  addPlayer(id, { name = 'Jugador', team = 'red', x, y } = {}) {
    let pos = { x, y };
    if (pos.x === undefined || pos.y === undefined) {
      const list = this.spawns[team] || this.spawns.red;
      const idx = this._spawnIndex[team] ?? 0;
      pos = list[idx % list.length];
      this._spawnIndex[team] = idx + 1;
    }

    const player = {
      id,
      name,
      team,
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      dir: { x: 1, y: 0 },   // hacia dónde mira (para el tomatazo)
      input: {},
      connected: true,
      carrying: null,        // una sola cosa a la vez (ingrediente o 'aceite')
      stunned: 0,            // segundos de aturdimiento restantes
      slipping: 0,           // segundos de resbalón restantes
      slipVx: 0,
      slipVy: 0,
      tomatoCooldown: 0,
      tomatoesHit: 0,
      dumping: null,         // { team, own, progress } | null
    };
    this.players.set(id, player);
    return player;
  }

  getPlayer(id) {
    return this.players.get(id);
  }

  disconnect(id) {
    const p = this.players.get(id);
    if (!p) return null;
    p.connected = false;
    p.input = {};
    p.vx = 0;
    p.vy = 0;
    p.dumping = null;
    return p;
  }

  setInput(id, input) {
    const p = this.players.get(id);
    if (!p) return;
    p.input = {
      up: !!input?.up,
      down: !!input?.down,
      left: !!input?.left,
      right: !!input?.right,
    };
  }

  /**
   * Hook de test: teletransporta a un jugador (sin caminar). Sólo lo usa el E2E
   * vía `MSG.TEST { action:'place' }` con `ALLOW_TEST_HOOKS`. En producción no
   * existe camino para llegar acá.
   */
  placePlayer(id, x, y) {
    const p = this.players.get(id);
    if (!p) return null;
    p.x = x;
    p.y = y;
    p.vx = 0;
    p.vy = 0;
    this.setInput(id, {});
    return p;
  }

  // --- Comandas / cocina -----------------------------------------------------

  currentRecipe(team) {
    return recipeForOrder(this.orders[team]);
  }

  cookSecondsFor(team) {
    const counts = this._teamCounts();
    const other = team === 'red' ? 'blue' : 'red';
    if (counts.red === counts.blue) return COOK_SECONDS;
    return counts[team] < counts[other] ? COOK_SECONDS_SMALL_TEAM : COOK_SECONDS;
  }

  _teamCounts() {
    const counts = { red: 0, blue: 0 };
    for (const p of this.players.values()) {
      if (counts[p.team] !== undefined) counts[p.team] += 1;
    }
    return counts;
  }

  /** Carga un ingrediente en la olla del equipo indicado. */
  loadPot(team, kind) {
    const recipe = this.currentRecipe(team);
    return insert(this.pots[team], kind, recipe.ingredients, this.cookSecondsFor(team));
  }

  // --- Acciones del jugador --------------------------------------------------

  setAction(id, kind) {
    const p = this.players.get(id);
    if (!p || !p.connected) return;
    if (p.stunned > 0 || p.slipping > 0) return; // aturdido/resbalando no actúa

    if (kind === 'tap') this._tap(p);
    else if (kind === 'hold') this._hold(p);        // se mantiene Espacio: arranca el volcado/vaciado
    else if (kind === 'holdStop') p.dumping = null; // se soltó antes de tiempo: se corta
    else if (kind === 'throw') this.throwTomato(id);
  }

  _near(p, point, radius) {
    if (!point) return false;
    return dist2(p.x, p.y, point.x, point.y) <= radius ** 2;
  }

  _rivalTeam(team) {
    return team === 'red' ? 'blue' : 'red';
  }

  _tap(p) {
    p.dumping = null; // un tap cancela cualquier volcado en curso
    const rivalTeam = this._rivalTeam(p.team);
    const ownPos = this.potPositions[p.team];
    const rivalPos = this.potPositions[rivalTeam];

    // 1) Con algo en la mano: cargar en la olla propia o en la rival, o soltarlo.
    if (p.carrying) {
      if (p.carrying === OIL) {
        this._dropCarried(p); // el aceite suelta -> charco
        return;
      }
      if (this._near(p, ownPos, POT_INTERACT_RADIUS)) {
        if (this.loadPot(p.team, p.carrying).ok) p.carrying = null;
        return;
      }
      if (this._near(p, rivalPos, POT_INTERACT_RADIUS)) {
        // Meter algo en la olla rival: la contamina (o la ayuda, si acierta).
        if (this.loadPot(rivalTeam, p.carrying).ok) p.carrying = null;
        return;
      }
      // Soltar en el piso SIEMPRE funciona: antes, con la despensa llena, el
      // tap se ignoraba y el jugador quedaba pegado al ingrediente.
      this._dropCarried(p);
      return;
    }

    // 2) Manos vacías: robar de la olla rival.
    const rivalPot = this.pots[rivalTeam];
    if (
      this._near(p, rivalPos, POT_INTERACT_RADIUS) &&
      !rivalPot.cooking &&
      !rivalPot.contaminated &&
      rivalPot.contents.length > 0
    ) {
      const kind = stealLast(rivalPot);
      if (kind) p.carrying = kind;
      return;
    }

    // 3) Levantar el aceite del piso.
    if (this.oilItem && this._near(p, this.oilItem, ITEM_INTERACT_RADIUS)) {
      p.carrying = OIL;
      this.oilItem = null;
      return;
    }

    // 4) Levantar el ingrediente más cercano.
    let best = null;
    let bestD = Infinity;
    for (const ing of this.ingredients) {
      const d = dist2(p.x, p.y, ing.x, ing.y);
      if (d <= ITEM_INTERACT_RADIUS ** 2 && d < bestD) {
        best = ing;
        bestD = d;
      }
    }
    if (best) {
      this.ingredients.splice(this.ingredients.indexOf(best), 1);
      p.carrying = best.kind;
      this._ensureAvailability();
    }
  }

  _hold(p) {
    const rivalTeam = this._rivalTeam(p.team);
    const ownPos = this.potPositions[p.team];
    const rivalPos = this.potPositions[rivalTeam];

    if (this._near(p, ownPos, POT_INTERACT_RADIUS)) {
      // Vaciar la olla propia (limpia contaminación / descarta contenido).
      p.dumping = { team: p.team, own: true, progress: 0 };
      return;
    }
    if (this._near(p, rivalPos, POT_INTERACT_RADIUS) && this.pots[rivalTeam].cooking) {
      // Volcar la olla rival mientras cocina -> pierde el plato.
      p.dumping = { team: rivalTeam, own: false, progress: 0 };
    }
  }

  throwTomato(id) {
    const p = this.players.get(id);
    if (!p || !p.connected) return;
    if (p.stunned > 0 || p.slipping > 0) return;
    if (p.tomatoCooldown > 0) return;

    p.tomatoCooldown = TOMATO_COOLDOWN;
    const len = Math.hypot(p.dir.x, p.dir.y) || 1;
    this._tomatoSeq += 1;
    this.tomatoes.push({
      id: `t${this._tomatoSeq}`,
      team: p.team,
      ownerId: id,
      x: p.x,
      y: p.y,
      vx: (p.dir.x / len) * TOMATO_SPEED,
      vy: (p.dir.y / len) * TOMATO_SPEED,
      life: TOMATO_MAX_LIFE,
    });
  }

  /** Aturde a un jugador: pierde el control, suelta lo que lleva y corta el volcado. */
  stunPlayer(id, seconds = STUN_SECONDS) {
    const p = this.players.get(id);
    if (!p) return;
    p.stunned = Math.max(p.stunned, seconds);
    p.dumping = null;
    this._dropCarried(p);
  }

  _dropCarried(p) {
    if (!p.carrying) return;
    if (p.carrying === OIL) {
      this._spillOil(p.x, p.y);
    } else {
      this._makeRoomFor();
      this._pushIngredient(p.carrying, p.x, p.y);
    }
    p.carrying = null;
  }

  /**
   * Libera un slot de la despensa si está llena: primero saca algo que ninguna
   * comanda pide, después un duplicado. Si todo es único y necesario deja el
   * piso en MAX+1 (el spawner se frena solo hasta que baje).
   */
  _makeRoomFor() {
    if (this.ingredients.length < MAX_FLOOR_INGREDIENTS) return;
    const needed = this._neededKinds();
    let idx = this.ingredients.findIndex((i) => !needed.has(i.kind));
    if (idx === -1) {
      const counts = this._floorCounts();
      idx = this.ingredients.findIndex((i) => (counts[i.kind] || 0) > 1);
    }
    if (idx !== -1) this.ingredients.splice(idx, 1);
  }

  _spillOil(x, y) {
    this._puddleSeq += 1;
    this.puddles.push({
      id: `o${this._puddleSeq}`,
      x,
      y,
      remaining: OIL_PUDDLE_SECONDS,
    });
  }

  // --- Despensa --------------------------------------------------------------

  _pushIngredient(kind, x, y) {
    this._ingredientSeq += 1;
    this.ingredients.push({
      id: `i${this._ingredientSeq}`,
      kind,
      x: clamp(x, 20, this.map.width - 20),
      y: clamp(y, 20, this.map.height - 20),
    });
  }

  _randomPantrySpot() {
    // Varios intentos para no apilar ingredientes (las etiquetas se pisarían).
    let best = null;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const spot = PANTRY_SPOTS[Math.floor(this.rng() * PANTRY_SPOTS.length) % PANTRY_SPOTS.length];
      const jitter = 30;
      const pos = {
        x: clamp(spot.x + (this.rng() * 2 - 1) * jitter, PANTRY.x, PANTRY.x + PANTRY.w),
        y: clamp(spot.y + (this.rng() * 2 - 1) * jitter, PANTRY.y, PANTRY.y + PANTRY.h),
      };
      if (!best) best = pos;
      const libre = this.ingredients.every(
        (i) => Math.hypot(i.x - pos.x, i.y - pos.y) >= INGREDIENT_MIN_SPACING
      );
      if (libre) return pos;
    }
    return best;
  }

  _neededKinds() {
    const needed = new Set();
    for (const team of TEAMS) {
      for (const kind of this.currentRecipe(team).ingredients) needed.add(kind);
    }
    return needed;
  }

  _floorCounts() {
    const counts = {};
    for (const ing of this.ingredients) counts[ing.kind] = (counts[ing.kind] || 0) + 1;
    return counts;
  }

  _spawnIngredientOfKind(kind) {
    const pos = this._randomPantrySpot();
    this._pushIngredient(kind, pos.x, pos.y);
  }

  _tickSpawn(dt) {
    if (this.ingredients.length >= MAX_FLOOR_INGREDIENTS) return;
    this._spawnTimer += dt;
    while (
      this._spawnTimer >= INGREDIENT_SPAWN_EVERY &&
      this.ingredients.length < MAX_FLOOR_INGREDIENTS
    ) {
      this._spawnTimer -= INGREDIENT_SPAWN_EVERY;
      const needed = this._neededKinds();
      const counts = this._floorCounts();
      const missing = [...needed].filter((k) => (counts[k] || 0) === 0);
      const pool = missing.length ? missing : INGREDIENT_KINDS;
      const kind = pool[Math.min(pool.length - 1, Math.floor(this.rng() * pool.length))];
      this._spawnIngredientOfKind(kind);
    }
  }

  _ensureAvailability() {
    const needed = this._neededKinds();
    let guard = 0;
    while (guard < 16) {
      guard += 1;
      const counts = this._floorCounts();
      const missing = [...needed].find((k) => (counts[k] || 0) === 0);
      if (!missing) break;

      if (this.ingredients.length >= MAX_FLOOR_INGREDIENTS) {
        let idx = this.ingredients.findIndex((i) => !needed.has(i.kind));
        if (idx === -1) {
          const c = this._floorCounts();
          idx = this.ingredients.findIndex((i) => (c[i.kind] || 0) > 1);
        }
        if (idx === -1) break;
        this.ingredients.splice(idx, 1);
      }
      this._spawnIngredientOfKind(missing);
    }
  }

  // --- Simulación ------------------------------------------------------------

  step(dt) {
    // Partida terminada: la simulación queda congelada (se sigue difundiendo el
    // último estado para que las pestañas y los que reconectan vean el final).
    if (this.phase === 'game_over') return;

    this.tick += 1;

    // 1) Timers.
    for (const p of this.players.values()) {
      p.tomatoCooldown = Math.max(0, p.tomatoCooldown - dt);
      p.stunned = Math.max(0, p.stunned - dt);
      p.slipping = Math.max(0, p.slipping - dt);
    }

    // 2) Integrar movimiento.
    for (const p of this.players.values()) {
      if (!p.connected || p.stunned > 0) {
        p.vx = 0;
        p.vy = 0;
        continue;
      }
      if (p.slipping > 0) {
        // Sin control: sigue deslizando en la dirección del resbalón.
        p.vx = p.slipVx;
        p.vy = p.slipVy;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        continue;
      }
      let dx = (p.input.right ? 1 : 0) - (p.input.left ? 1 : 0);
      let dy = (p.input.down ? 1 : 0) - (p.input.up ? 1 : 0);
      const len = Math.hypot(dx, dy);
      if (len > 0) {
        dx /= len;
        dy /= len;
        p.dir = { x: dx, y: dy };
      }
      p.vx = dx * PLAYER_SPEED;
      p.vy = dy * PLAYER_SPEED;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    // 3) Límites.
    this._clampToBounds();

    // 4) Mesadas.
    for (const p of this.players.values()) {
      for (const counter of this.map.counters) {
        const r = resolveCircleRect(p.x, p.y, PLAYER_RADIUS, counter);
        p.x = r.x;
        p.y = r.y;
      }
    }

    // 5) Ollas (obstáculos circulares).
    const potMin = POT_RADIUS + PLAYER_RADIUS;
    for (const p of this.players.values()) {
      for (const team of TEAMS) {
        const pot = this.potPositions[team];
        if (!pot) continue;
        const dx = p.x - pot.x;
        const dy = p.y - pot.y;
        const d = Math.hypot(dx, dy);
        if (d === 0) {
          p.x = pot.x + potMin;
        } else if (d < potMin) {
          p.x = pot.x + (dx / d) * potMin;
          p.y = pot.y + (dy / d) * potMin;
        }
      }
    }

    // 6) Jugadores entre sí.
    const ids = [...this.players.keys()].sort();
    const minDist = PLAYER_RADIUS * 2;
    for (let i = 0; i < ids.length; i += 1) {
      for (let j = i + 1; j < ids.length; j += 1) {
        const a = this.players.get(ids[i]);
        const b = this.players.get(ids[j]);
        let ddx = b.x - a.x;
        let ddy = b.y - a.y;
        let d = Math.hypot(ddx, ddy);
        if (d === 0) {
          ddx = 1;
          ddy = 0;
          d = 1;
        }
        if (d < minDist) {
          const push = (minDist - d) / 2;
          const nx = ddx / d;
          const ny = ddy / d;
          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;
        }
      }
    }

    // 7) Re-clamp.
    this._clampToBounds();

    // 8) Charcos: quien los pisa resbala.
    for (const p of this.players.values()) {
      if (p.slipping > 0 || p.stunned > 0) continue;
      for (const pd of this.puddles) {
        if (dist2(p.x, p.y, pd.x, pd.y) <= (OIL_RADIUS + PLAYER_RADIUS) ** 2) {
          p.slipping = SLIP_SECONDS;
          p.slipVx = p.vx;
          p.slipVy = p.vy;
          break;
        }
      }
    }

    // 9) Tomates.
    this._stepTomatoes(dt);

    // 10) Cocción.
    for (const team of TEAMS) {
      const pot = this.pots[team];
      if (advance(pot, dt)) {
        this.score[team] += 1;
        this.orders[team] += 1;
        empty(pot);
        // Muerte súbita: el PRIMER plato servido define al ganador.
        if (this.phase === 'sudden_death') {
          this.winner = team;
          this.phase = 'game_over';
        }
      }
    }

    // 11) Volcado / vaciado.
    this._stepDumping(dt);

    // 12) Aceite + charcos.
    this._stepOil(dt);

    // 13) Despensa.
    this._tickSpawn(dt);
    this._ensureAvailability();

    // 14) Reloj de la partida.
    this._stepClock(dt);
  }

  // --- Resolución de la partida (milestone 05) --------------------------------

  _stepClock(dt) {
    if (this.phase !== 'playing') return;
    this.timeLeft = Math.max(0, this.timeLeft - dt);
    if (this.timeLeft === 0) this._resolveTime();
  }

  /** Fin por tiempo: gana el de más platos; empate -> muerte súbita. */
  _resolveTime() {
    if (this.score.red === this.score.blue) {
      this.phase = 'sudden_death';
      this.winner = null;
      return;
    }
    this.winner = this.score.red > this.score.blue ? 'red' : 'blue';
    this.phase = 'game_over';
  }

  /** Jugador con más tomatazos acertados (o null). */
  saboteurId() {
    let best = null;
    let bestHits = 0;
    for (const p of this.players.values()) {
      if (p.tomatoesHit > bestHits) {
        bestHits = p.tomatoesHit;
        best = p.id;
      }
    }
    return best;
  }

  /**
   * Termina la partida de inmediato con un ganador decisivo.
   * Sólo lo usa el hook de test (`ALLOW_TEST_HOOKS`) para no esperar 5 minutos.
   */
  forceEnd(winner = 'red') {
    const other = winner === 'red' ? 'blue' : 'red';
    if (this.score[winner] <= this.score[other]) this.score[winner] = this.score[other] + 1;
    this.timeLeft = 0;
    this._resolveTime();
  }

  _stepTomatoes(dt) {
    const vivos = [];
    for (const t of this.tomatoes) {
      t.life -= dt;
      t.x += t.vx * dt;
      t.y += t.vy * dt;

      if (
        t.life <= 0 ||
        t.x < -TOMATO_RADIUS ||
        t.y < -TOMATO_RADIUS ||
        t.x > this.map.width + TOMATO_RADIUS ||
        t.y > this.map.height + TOMATO_RADIUS
      ) {
        continue;
      }
      let choque = false;
      for (const counter of this.map.counters) {
        if (circleIntersectsRect(t.x, t.y, TOMATO_RADIUS, counter)) {
          choque = true;
          break;
        }
      }
      if (choque) continue;

      // Impacto: sólo rivales (sin fuego amigo).
      const alcance = (TOMATO_RADIUS + PLAYER_RADIUS) ** 2;
      let impacto = null;
      for (const p of this.players.values()) {
        if (p.team === t.team || !p.connected) continue;
        if (dist2(t.x, t.y, p.x, p.y) <= alcance) {
          impacto = p;
          break;
        }
      }
      if (impacto) {
        this.stunPlayer(impacto.id, STUN_SECONDS);
        const tirador = this.players.get(t.ownerId);
        if (tirador) tirador.tomatoesHit += 1;
        continue; // el tomate se consume
      }
      vivos.push(t);
    }
    this.tomatoes = vivos;
  }

  _stepDumping(dt) {
    for (const p of this.players.values()) {
      if (!p.dumping) continue;
      const pos = this.potPositions[p.dumping.team];
      if (p.stunned > 0 || !this._near(p, pos, POT_INTERACT_RADIUS)) {
        p.dumping = null;
        continue;
      }
      p.dumping.progress += dt;
      if (p.dumping.progress >= HOLD_SECONDS) {
        empty(this.pots[p.dumping.team]);
        p.dumping = null;
      }
    }
  }

  _stepOil(dt) {
    for (const pd of this.puddles) pd.remaining -= dt;
    this.puddles = this.puddles.filter((pd) => pd.remaining > 0);

    this._oilTimer += dt;
    if (!this.oilItem && this._oilTimer >= OIL_SPAWN_EVERY) {
      this._oilTimer = 0;
      this.oilItem = { x: OIL_SPAWN.x, y: OIL_SPAWN.y };
    }
  }

  _clampToBounds() {
    for (const p of this.players.values()) {
      p.x = clamp(p.x, PLAYER_RADIUS, this.map.width - PLAYER_RADIUS);
      p.y = clamp(p.y, PLAYER_RADIUS, this.map.height - PLAYER_RADIUS);
    }
  }

  // --- Snapshot --------------------------------------------------------------

  snapshot() {
    const players = {};
    for (const p of this.players.values()) {
      players[p.id] = {
        name: p.name,
        team: p.team,
        x: Number(p.x.toFixed(2)),
        y: Number(p.y.toFixed(2)),
        dirX: p.dir.x,
        dirY: p.dir.y,
        connected: p.connected,
        stunned: p.stunned > 0,
        slipping: p.slipping > 0,
        carrying: p.carrying,
        tomatoesHit: p.tomatoesHit,
        dumping: p.dumping
          ? { team: p.dumping.team, own: p.dumping.own, progress: Number((p.dumping.progress / HOLD_SECONDS).toFixed(3)) }
          : null,
      };
    }

    const order = {};
    const pots = {};
    for (const team of TEAMS) {
      const recipe = this.currentRecipe(team);
      order[team] = { id: recipe.id, name: recipe.name, ingredients: recipe.ingredients };
      const pot = this.pots[team];
      pots[team] = {
        contents: [...pot.contents],
        contaminated: pot.contaminated,
        cooking: pot.cooking,
        progress: Number(progress(pot).toFixed(3)),
        x: this.potPositions[team].x,
        y: this.potPositions[team].y,
      };
    }

    return {
      t: this.tick,
      mode: this.phase === 'game_over' ? 'game_over' : 'playing',
      phase: this.phase,
      winner: this.winner,
      saboteur: this.saboteurId(),
      timeLeft: Number(this.timeLeft.toFixed(2)),
      score: { ...this.score },
      order,
      pots,
      ingredients: this.ingredients.map((i) => ({ id: i.id, kind: i.kind, x: i.x, y: i.y })),
      tomatoes: this.tomatoes.map((t) => ({ id: t.id, x: Number(t.x.toFixed(2)), y: Number(t.y.toFixed(2)), team: t.team })),
      oil: this.oilItem,
      puddles: this.puddles.map((p) => ({ id: p.id, x: p.x, y: p.y, remaining: Number(p.remaining.toFixed(2)) })),
      players,
    };
  }
}
