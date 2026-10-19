# Guerra de Cocinas

## Pitch

Arcade 2D top-down para **7 jugadores** en red local: dos equipos (4 vs 3) comparten una sola cocina, cada uno con su olla. Cocinate los platos de tu comanda y saboteá la olla rival. Gana el que más platos sirva en **5 minutos**.

## Core gameplay loop

Los verbos, de principio a fin de una sesión:

1. **Moverse** (WASD) por la cocina y chocar contra rivales, compañeros y mesadas.
2. **Agarrar / soltar** (Espacio, tap) un ingrediente de la despensa. Se lleva **una sola cosa a la vez**.
3. **Cargar la olla** propia (Espacio tap cerca de la olla) con los 3 ingredientes de la **comanda actual**.
4. **Cocinar** automáticamente: con los 3 correctos la olla cocina sola; al terminar suma **1 plato** y sale la comanda siguiente.
5. **Sabotear** al rival: tomatazo (E), robar el último ingrediente, contaminar la olla, volcarla mientras cocina, y tirar aceite para que resbalen.
6. **Repetir** hasta que expire el timer. Empate → muerte súbita.

## Game rules

### Equipos y lobby
- 7 jugadores, cada uno en su PC, misma partida.
- Al abrir el juego se ingresa un **nombre** y se cae en el lobby.
- El **primero en entrar es el host**; ve el botón **Empezar** (mínimo 2 jugadores).
- Los equipos se sortean **al azar en cada partida**, lo más parejo posible (con 7 → 4 y 3).
- Al terminar se muestra el ganador y el host tiene **Revancha**, que vuelve a sortear.

### Mapa
- Pantalla fija **1280×720**, escalada a la ventana. Todos ven el mapa completo.
- Tres zonas: **Cocina ROJA** (izq, olla roja) · **DESPENSA** (centro, ingredientes) · **Cocina AZUL** (der, olla azul).
- Hay mesadas como obstáculos; los jugadores **chocan entre sí** (sirve para bloquear/defender la olla).

### Controles
- **WASD**: moverse.
- **Espacio** (se decide **al soltar**):
  - tap (**< 2 s**) → agarrar/soltar ingrediente, cargar la olla propia, robar de la olla rival, agarrar/soltar aceite (contextual, según dónde estés parado).
  - hold (**≥ 2 s**) → **vaciar** la olla propia o **volcar** la olla rival (con barra de progreso visible).
- **E**: tirar un tomate hacia donde mira el personaje.

### Recetas (3 ingredientes cada una)
- Pizza: masa, tomate, queso
- Hamburguesa: pan, carne, lechuga
- Tortilla: papa, huevo, queso
- Ensalada: lechuga, tomate, huevo

### Comandas
- Cada equipo ve **su comanda actual** en pantalla.
- La **secuencia de comandas es la misma para los dos equipos** (justo). Cada equipo avanza su propio índice a su ritmo.
- La olla cocina cuando tiene los **3 ingredientes correctos en cualquier orden** (matching por conjunto).
- **Tiempo de cocción: 5 s.** Si los equipos quedan desparejos, **el equipo más chico cocina en 4 s**.

### Despensa
- Aparece **1 ingrediente cada 2 s**, máximo **8** en el piso.
- Siempre debe haber disponible al menos **1 ingrediente de los que necesita cada comanda actual**.

### Juego sucio
| Acción | Cómo | Efecto |
|---|---|---|
| Tomatazo | E | Proyectil recto. Aturde 1,5 s y el rival suelta lo que lleva. **Sin fuego amigo** (atraviesa compañeros). 3 s de enfriamiento |
| Robar | Espacio tap en la olla rival (si **no** está cocinando) | Te llevás el **último ingrediente** que pusieron (requiere manos vacías) |
| Contaminar | Meter un ingrediente equivocado en la olla rival | Olla contaminada (humo verde): no cocina hasta que ese equipo la vacíe (hold 2 s, se pierde el contenido) |
| Volcar | Hold 2 s en la olla rival **mientras cocina** | Pierden el plato en curso. Si te aturden, se corta |
| Aceite | Power-up que aparece en el centro cada 30 s | Se agarra/suelta con Espacio; deja un charco 10 s. Quien lo pisa resbala 1 s sin control |

- Meter un ingrediente equivocado (o **repetido**, ej. tomate×2 en pizza) en la olla **propia** también la contamina.

### Desconexiones
- Si alguien se desconecta, su personaje **queda quieto** (no desaparece).
- Si vuelve a entrar **con el mismo nombre**, recupera su personaje.
- Si el host se cae, el **siguiente jugador más antiguo** pasa a ser host.

## Win / lose conditions

- La partida dura **5:00** (300 s). Gana el equipo con más platos.
- **Empate → muerte súbita**: gana el primer plato que se termine.
- Pantalla final: ganador, platos de cada equipo, y el **"saboteador del partido"** (jugador con más tomatazos acertados).

## Art style

- **2D top-down**, pixel art de cocina.
- Paleta con colores **bien distintos** por equipo (rojo vs azul) para leer el bando de un vistazo.
- El **nombre de cada jugador** se dibuja sobre su personaje.
- Mesadas y ollas legibles como obstáculos; humo verde para olla contaminada; charco de aceite reconocible.
- Base procedural al inicio (formas) y sprites pixel art en el milestone de pulido.

## Audio direction

- Chiptune procedural vía **Web Audio API** (cero dependencias). Música de fondo en loop + SFX para: cocinar, plato servido, tomatazo, stun, resbalón, contaminación, volcar, fin de partida.
- **No** usar `@strudel/web` (AGPL-3.0) para no forzar licencia AGPL del proyecto.

## Player goals

- **Corto plazo:** completar la comanda actual y sabotear al rival sin descuidar tu propia olla.
- **Largo plazo (por sesión):** encadenar platos, ganar la partida y quedar como saboteador del partido.

## Anti-goals

- Sin cuentas, sin login, sin persistencia entre sesiones.
- Sin soporte de celular (7 PCs en LAN con teclado).
- Sin monetización, sin Play.fun, sin leaderboards online.
- No es un juego competitivo serio/matchmaking: es una partida casual en LAN.

## References

- **Overcooked** — cocina cooperativa, comandas y presión de tiempo (acá es PvP con sabotaje).
- **Bomberman** — arena chica, colisiones, ritmo arcade top-down.
- **Mario Party (minijuegos)** — partidas cortas, pantalla de resultado con "premio" (saboteador del partido).

## Open questions

- (Resueltas en el Milestone 0 — ver ADR 0002 y las AC de cada milestone.) Ninguna pendiente que bloquee el arranque.
