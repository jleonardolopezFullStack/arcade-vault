# Arcade Vault — To Do de sugerencias de juegos

> Mantenido por el agente `game-planner`. Marca `[x]` o mueve entradas a mano; el agente lo respeta.
> Última actualización: 2026-10-06

## ⭐ Recomendado ahora

- [ ] **INVASORES** (`invasores`) — MOTOR · esfuerzo M — ficha, tabla `scores_invasores` y `.cover-invaders` ya existen (sin migración); encaja 1:1 en `{score, lives, level}`; refuerza SHOOTER y la IA es una formación determinista (bajo riesgo)
  - Siguiente paso: `/spec-game "dar motor a la ficha invasores, desde cero"`

## 💡 Sugeridos

- [ ] **RANARIA** (`ranaria`) — MOTOR · esfuerzo M — puntuación clara por avance/nenúfares + bonus de tiempo; riesgo: colisiones con troncos y temporizador por vida · sugerido 2026-10-06
- [ ] **DUELO PIXEL** (`duelo-pixel`) — MOTOR · esfuerzo S — única ficha VERSUS; motor trivial pero la puntuación de ranking es débil (Pong contra CPU) y el modo 2 jugadores locales no genera marca; habría que redefinir qué se puntúa · sugerido 2026-10-06
- [ ] **GLOTÓN** (`gloton`) — MOTOR · esfuerzo L — muy reconocible, pero laberinto + IA de 4 fantasmas con estados es el mayor riesgo del catálogo; mejor después de INVASORES · sugerido 2026-10-06

### Conceptos nuevos (requieren migración: `scores_<slug>` + rama en `leaderboard` + fila en `games` + `.cover-*`)

#### SHOOTER

- [ ] **MISILES** (`misiles`) — CONCEPTO NUEVO · esfuerzo S — Missile Command; ciudades = vidas, física trivial, primer motor con ratón; riesgo: mapeo del ratón al canvas CRT · sugerido 2026-10-06
- [ ] **CIEMPIÉS** (`ciempies`) — CONCEPTO NUEVO · esfuerzo M — Centipede; rejilla de setas, puntuación clara por segmento/seta/araña; riesgo: partir el ciempiés en segmentos · sugerido 2026-10-06
- [ ] **ARENA NEÓN** (`arena-neon`) — CONCEPTO NUEVO · esfuerzo M-L — Robotron, twin-stick por oleadas; riesgo: rendimiento con muchas entidades, IA variada, ghosting de teclado · sugerido 2026-10-06
- [ ] **INCURSIÓN** (`incursion`) — CONCEPTO NUEVO · esfuerzo L — Scramble, scroll lateral + combustible; riesgo: terreno procedural, colisión fina, fuel fuera del snapshot · sugerido 2026-10-06
- [ ] **TÚNEL** (`tunel`) — CONCEPTO NUEVO · esfuerzo L — Tempest vectorial pseudo-3D; riesgo: proyección del túnel y legibilidad · sugerido 2026-10-06

#### PUZZLE

- [ ] **JOYERO** (`joyero`) — CONCEPTO NUEVO · esfuerzo M — Columns; caída de gemas con combos, `lines` = gemas eliminadas; riesgo: cadenas por gravedad y diagonales · sugerido 2026-10-06
- [ ] **FUSIÓN** (`fusion`) — CONCEPTO NUEVO · esfuerzo S — 2048 neón, motor mínimo; riesgo: poco ritmo arcade · sugerido 2026-10-06
- [ ] **BURBUJAS** (`burbujas`) — CONCEPTO NUEVO · esfuerzo L — Puzzle Bobble; riesgo: rejilla hexagonal, rebotes, burbujas sueltas · sugerido 2026-10-06
- [ ] **TUBERÍAS** (`tuberias`) — CONCEPTO NUEVO · esfuerzo M — Pipe Mania con presión de tiempo; riesgo: flujo animado y conexiones · sugerido 2026-10-06
- [ ] **BUSCAMINAS** (`buscaminas`) — CONCEPTO NUEVO · esfuerzo S — Minesweeper contrarreloj, primer ranking `asc`; riesgo: validar `asc` de punta a punta · sugerido 2026-10-06

#### ARCADE (habilidad)

- [ ] **CORREDOR** (`corredor`) — CONCEPTO NUEVO · esfuerzo S — runner de un botón, ranking por distancia; riesgo: generación procedural justa y tope de `max_score` · sugerido 2026-10-06
- [ ] **ATRAPABOMBAS** (`atrapabombas`) — CONCEPTO NUEVO · esfuerzo S — Kaboom!, reflejos en un eje; riesgo: ratón trivializa, curva de dificultad · sugerido 2026-10-06
- [ ] **PIRÁMIDE** (`piramide`) — CONCEPTO NUEVO · esfuerzo M — Q*bert isométrico; riesgo: controles diagonales con teclado · sugerido 2026-10-06
- [ ] **ALUNIZAJE** (`alunizaje`) — CONCEPTO NUEVO · esfuerzo M — Lunar Lander, reutiliza vectorial de rocas; riesgo: colisión con terreno, combustible fuera del HUD · sugerido 2026-10-06
- [ ] **ESCALERAS** (`escaleras`) — CONCEPTO NUEVO · esfuerzo L — Donkey Kong, único plataformas clásico; riesgo: física de salto/escaleras, rampas · sugerido 2026-10-06

#### VERSUS (contra CPU; el enum `game_category` no tiene DEPORTES/CARRERAS)

- [ ] **ESTELA** (`estela`) — CONCEPTO NUEVO · esfuerzo S — Tron light cycles vs CPU, patrón de rejilla de `serpiente`; riesgo: IA de esquiva, parecido a serpentina · sugerido 2026-10-06
- [ ] **HOCKEY NEÓN** (`hockey-neon`) — CONCEPTO NUEVO · esfuerzo M — air hockey vs CPU; riesgo: colisión círculo-círculo y tunneling · sugerido 2026-10-06
- [ ] **AUTOPISTA** (`autopista`) — CONCEPTO NUEVO · esfuerzo M — Road Fighter/Spy Hunter; riesgo: rivales que parezcan tráfico y no versus · sugerido 2026-10-06
- [ ] **CUADRILÁTERO** (`cuadrilatero`) — CONCEPTO NUEVO · esfuerzo M-L — Punch-Out!! por patrones; riesgo: animación procedural y timing · sugerido 2026-10-06
- [ ] **CIRCUITO** (`circuito`) — CONCEPTO NUEVO · esfuerzo L — Super Sprint, marca `asc` en centésimas; riesgo: derrape, IA por waypoints, `asc` sin probar · sugerido 2026-10-06

## 📝 En spec

- _(ninguno)_

## ✅ Implementados

- [x] **ROCAS** (`rocas`) — motor `lib/games/asteroides/` · SPEC 05
- [x] **CAÍDA** (`caida`) — motor `lib/games/piezas/` · SPEC 07
- [x] **BLOQUE BUSTER** (`bloque-buster`) — motor `lib/games/ladrillos/` · SPEC 08
- [x] **SERPENTINA** (`serpentina`) — motor `lib/games/serpiente/` · SPEC 09

## ❌ Descartados

- _(ninguno)_
