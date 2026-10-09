// Motor de RANARIA, contra el contrato de `lib/games/types.ts`.
//
// **No es un porte**: no hay frogger en references/, así que no existe un
// original con el que comparar esto. Lo que sí hereda son los invariantes de
// los otros cuatro motores:
//
// - Todo el estado vive en la clausura de la fábrica, no en variables de
//   módulo: dos pantallas montadas a la vez no se pisan.
// - `dt` en segundos, capado a MAX_DT, y `lastTime = null` como centinela.
// - `start()` es síncrono: no se carga ninguna imagen ni ningún sonido.
// - Pausa, reinicio y fin de partida los gobierna la plataforma; el motor no
//   reclama `P` ni `Escape`.
//
// Todos los tiempos —reloj, cooldown, muerte, cartel— son acumuladores en
// segundos que solo avanzan dentro del bucle, nunca `setTimeout`: así la pausa
// de la plataforma los congela de verdad.
import { isTypingTarget } from "@/lib/games/input";
import type {
  GameEngine,
  GameEngineHooks,
  GameSnapshot,
} from "@/lib/games/types";
import {
  CAPTURED_KEYS,
  DEATH_TIME,
  EXTRA_LIFE_AT,
  FLY_DELAY_MAX,
  FLY_DELAY_MIN,
  FLY_POINTS,
  FLY_TTL,
  HOMES,
  type HopDir,
  LEVEL_BANNER,
  MAX_DT,
  PALETTE,
  POINTS_ALL_HOMES,
  POINTS_HOME,
  POINTS_ROW,
  SCORE_CAP,
  START_LIVES,
  START_ROW,
  TIME_BONUS_PER_S,
  TIME_LIMIT,
} from "./constants";
import {
  clear,
  DEATH_LABEL,
  drawBoard,
  drawDeath,
  drawFly,
  drawFrog,
  drawHomes,
  drawHud,
  drawLanes,
  drawOverlay,
  drawTimeBar,
} from "./draw";
import {
  createFrog,
  type DeathCause,
  type FrameState,
  resolveFrame,
} from "./frog";
import { advanceLanes, createLanes } from "./lanes";
export function createRanaEngine(
  canvas: HTMLCanvasElement,
  hooks: GameEngineHooks,
): GameEngine {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("RANARIA: el canvas no da contexto 2d");
  // El narrowing de arriba no sobrevive dentro de las clausuras.
  const ctx: CanvasRenderingContext2D = context;
  // ── Estado de la partida ───────────────────────────────────────────────────
  /** Lo que `resolveFrame` lee y modifica: rana, carriles, nenúfares, reloj. */
  let game: FrameState = freshGame();
  let score = 0;
  let lives = START_LIVES;
  let status: "playing" | "dead" | "gameover" = "playing";
  let deathCause: DeathCause | null = null;
  let deathAt = { x: 0, row: START_ROW };
  /** Segundos acumulados de la pausa tras una muerte. */
  let deathAcc = 0;
  /** Segundos que le quedan al cartel «NIVEL N». */
  let bannerAcc = 0;
  /** Tiempo de juego acumulado, para el parpadeo de la barra y la mosca. */
  let clock = 0;
  /** La mosca de bonificación: en qué nenúfar está y cuánto le queda. */
  let fly: { home: number; ttl: number } | null = null;
  /** Espera sorteada hasta la próxima mosca. */
  let flyWait = rollFlyWait();
  /** La vida extra se da una sola vez por partida; `restart()` la repone. */
  let extraLifeGiven = false;
  // ── Contabilidad del bucle ─────────────────────────────────────────────────
  let rafId: number | null = null;
  let lastTime: number | null = null;
  let destroyed = false;
  let listening = false;
  /**
   * La pausa la gobierna el reproductor y no toca `status`, pero tiene que
   * cortar **también la entrada**. Sin esto, con el lienzo congelado las
   * flechas seguirían guardando un salto que se aplicaría al reanudar,
   * posiblemente bajo un coche.
   */
  let paused = false;
  /** null para que el primer snapshot se emita siempre. */
  let lastSnapshot: GameSnapshot | null = null;
  function freshGame(): FrameState {
    return {
      frog: createFrog(),
      lanes: createLanes(),
      homes: Array.from({ length: HOMES }, () => false),
      level: 1,
      timeLeft: TIME_LIMIT,
      bestRow: START_ROW,
      queuedHop: null,
    };
  }
  function clearInput(): void {
    game.queuedHop = null;
  }
  function initGame(): void {
    game = freshGame();
    score = 0;
    lives = START_LIVES;
    status = "playing";
    deathCause = null;
    deathAcc = 0;
    bannerAcc = 0;
    clock = 0;
    fly = null;
    flyWait = rollFlyWait();
    extraLifeGiven = false;
    paused = false;
    lastSnapshot = null;
  }
  /** Espera hasta la próxima mosca, sorteada en [FLY_DELAY_MIN, FLY_DELAY_MAX]. */
  function rollFlyWait(): number {
    return FLY_DELAY_MIN + Math.random() * (FLY_DELAY_MAX - FLY_DELAY_MIN);
  }
  /** Quita la mosca del tablero y sortea la siguiente espera. */
  function clearFly(): void {
    fly = null;
    flyWait = rollFlyWait();
  }
  /**
   * La mosca solo corre en `"playing"`. Al vencer la espera aparece en un
   * nenúfar **libre** sorteado; si no hay ninguno, se vuelve a sortear la
   * espera sin aparecer. Al caducar, desaparece y se sortea la siguiente.
   */
  function updateFly(dt: number): void {
    if (fly) {
      fly.ttl -= dt;
      if (fly.ttl <= 0) clearFly();
      return;
    }
    flyWait -= dt;
    if (flyWait > 0) return;
    const free = game.homes.flatMap((taken, i) => (taken ? [] : [i]));
    if (free.length === 0) {
      flyWait = rollFlyWait();
      return;
    }
    fly = {
      home: free[Math.floor(Math.random() * free.length)],
      ttl: FLY_TTL,
    };
  }
  /**
   * Toda suma pasa por aquí: el marcador satura en SCORE_CAP, y la primera vez
   * que cruza EXTRA_LIFE_AT da la vida extra. Va antes de `emitSnapshot()` en
   * el mismo fotograma, así que el cuarto corazón de React y la cuarta rana
   * del canvas llegan a la vez.
   */
  function addScore(n: number): void {
    score = Math.min(score + n, SCORE_CAP);
    if (!extraLifeGiven && score >= EXTRA_LIFE_AT) {
      extraLifeGiven = true;
      lives += 1;
    }
  }
  /**
   * La rana vuelve a la salida con el reloj lleno. Se usa al reaparecer tras
   * una muerte y tras cada llegada; puntuación, nivel y nenúfares se conservan.
   */
  function resetTrip(): void {
    game.frog = createFrog();
    game.timeLeft = TIME_LIMIT;
    game.bestRow = START_ROW;
    clearInput();
  }
  /**
   * `lives` baja en el mismo fotograma de la muerte, y el snapshot sale en ese
   * mismo fotograma: los corazones de React y las ranas del canvas no
   * discrepan justo cuando el jugador mira.
   */
  function die(cause: DeathCause): void {
    lives--;
    deathCause = cause;
    deathAt = { x: game.frog.x, row: game.frog.row };
    deathAcc = 0;
    clearInput();
    if (lives <= 0) {
      lives = 0;
      status = "gameover";
      hooks.onGameOver(score);
      return;
    }
    status = "dead";
  }
  function arrive(home: number): void {
    game.homes[home] = true;
    addScore(POINTS_HOME + TIME_BONUS_PER_S * Math.floor(game.timeLeft));
    if (fly?.home === home) {
      addScore(FLY_POINTS);
      clearFly();
    }
    if (game.homes.every(Boolean)) {
      addScore(POINTS_ALL_HOMES);
      game.level++;
      game.homes = game.homes.map(() => false);
      bannerAcc = LEVEL_BANNER;
      // Al subir de nivel no queda ninguna mosca en el tablero.
      clearFly();
    }
    resetTrip();
  }
  // ── Entrada ────────────────────────────────────────────────────────────────
  function onKeyDown(e: KeyboardEvent): void {
    if (isTypingTarget(e.target)) return;
    const dir: HopDir | undefined = CAPTURED_KEYS[e.code];
    if (!dir) return;
    // El preventDefault se mantiene en pausa: las flechas no deben mover la
    // página mientras el reproductor está montado.
    e.preventDefault();
    // Una pulsación, un salto: mantener la flecha no encadena saltos.
    if (e.repeat || paused || status !== "playing") return;
    // Un solo hueco de búfer: la última gana. Lo aplica `resolveFrame` en
    // cuanto el cooldown lo permite.
    game.queuedHop = dir;
  }
  /**
   * Las flechas tampoco hacen scroll al soltarlas. No hay teclas mantenidas
   * que registrar —cada salto sale del `keydown`—, así que nada puede
   * quedarse pegado al perder el foco.
   */
  function onKeyUp(e: KeyboardEvent): void {
    if (isTypingTarget(e.target)) return;
    if (CAPTURED_KEYS[e.code]) e.preventDefault();
  }
  // ── Bucle ──────────────────────────────────────────────────────────────────
  function update(dt: number): void {
    if (status === "gameover") return;
    clock += dt;
    bannerAcc = Math.max(0, bannerAcc - dt);
    if (status === "dead") {
      // Los carriles siguen moviéndose; el reloj no corre y las flechas no
      // hacen nada.
      advanceLanes(game.lanes, game.level, dt);
      deathAcc += dt;
      if (deathAcc >= DEATH_TIME) {
        resetTrip();
        deathCause = null;
        status = "playing";
      }
      return;
    }
    const result = resolveFrame(game, dt);
    if (result.newRows > 0) addScore(result.newRows * POINTS_ROW);
    if (result.home !== null) arrive(result.home);
    else if (result.death) die(result.death);
    if (status === "playing") updateFly(dt);
  }
  function draw(): void {
    clear(ctx);
    drawBoard(ctx);
    drawHomes(ctx, game.homes);
    if (fly) drawFly(ctx, fly.home, clock);
    drawLanes(ctx, game.lanes, game.level);
    if (status === "playing") drawFrog(ctx, game.frog);
    else if (deathCause) {
      drawDeath(ctx, deathCause, deathAt, Math.min(1, deathAcc / DEATH_TIME));
    }
    drawHud(ctx, { score, level: game.level, lives });
    drawTimeBar(ctx, game.timeLeft, clock);
    if (status === "gameover") {
      drawOverlay(ctx, "GAME OVER", PALETTE.gameOver, {
        dim: true,
        sub: `NIVEL ${game.level} · ${score} PUNTOS`,
      });
    } else if (status === "dead" && deathCause) {
      drawOverlay(ctx, DEATH_LABEL[deathCause], PALETTE.death);
    } else if (bannerAcc > 0) {
      drawOverlay(ctx, `NIVEL ${game.level}`, PALETTE.banner);
    }
  }
  /** Solo avisa al HUD cuando alguno de los tres valores cambia de verdad. */
  function emitSnapshot(): void {
    if (
      lastSnapshot !== null &&
      lastSnapshot.score === score &&
      lastSnapshot.lives === lives &&
      lastSnapshot.level === game.level
    ) {
      return;
    }
    // Sin `lines`: el HUD de la plataforma pinta «Vidas» con corazones.
    lastSnapshot = { score, lives, level: game.level };
    hooks.onSnapshot(lastSnapshot);
  }
  function frame(ts: number): void {
    const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, MAX_DT);
    lastTime = ts;
    update(dt);
    draw();
    emitSnapshot();
    // Al acabar se deja de pedir fotogramas: el cartel ya está pintado y quien
    // reinicia es el modal de la plataforma.
    rafId = status === "gameover" ? null : requestAnimationFrame(frame);
  }
  function runLoop(): void {
    if (rafId !== null || status === "gameover" || destroyed) return;
    lastTime = null; // el primer fotograma tras arrancar o reanudar avanza 0
    rafId = requestAnimationFrame(frame);
  }
  function stopLoop(): void {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
  }
  return {
    start() {
      if (destroyed) return;
      if (!listening) {
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
        listening = true;
      }
      initGame();
      // Antes de pedir fotograma, para que el HUD no pinte un estado que no es.
      draw();
      emitSnapshot();
      runLoop();
    },
    pause() {
      paused = true;
      clearInput();
      stopLoop();
    },
    resume() {
      paused = false;
      runLoop();
    },
    restart() {
      if (destroyed) return;
      stopLoop();
      initGame();
      draw();
      emitSnapshot();
      runLoop();
    },
    destroy() {
      destroyed = true;
      stopLoop();
      if (listening) {
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
        listening = false;
      }
      clearInput();
      game.lanes = [];
      lastSnapshot = null;
    },
  };
}
