// Motor de BLOQUE BUSTER: el arkanoid de
// references/RRO5vePTlqkYrGHjYdtf_started-games/04-arkanoid/, portado al
// contrato de `lib/games/types.ts`.
//
// Lo que se cambió a propósito respecto al original, para que una comparación
// futura no confunda un porte con un fallo:
//
// - Todo el estado vive en la clausura de la fábrica, no en variables de
//   módulo: dos pantallas montadas a la vez no se pisan.
// - `dt` sigue en segundos pero se capa a MAX_DT; el original no tenía tope.
// - Desaparecen el spritesheet, los dos MP3 y su arranque asíncrono: aquí todo
//   se dibuja con primitivas y `start()` es síncrono.
// - Desaparecen su pausa en `p`/`P`/`Escape` y su fila de botones de salto de
//   nivel, que era depuración. Pausa, reinicio y fin de partida los gobierna
//   la plataforma.
// - El estado `'win'` del original no es un estado aparte: completar el quinto
//   nivel termina la partida como agotar las vidas, y solo cambia el texto.

import { isTypingTarget } from "@/lib/games/input";
import type {
  GameEngine,
  GameEngineHooks,
  GameSnapshot,
} from "@/lib/games/types";

import {
  BALL_SIZE,
  BASE_BALL_VX,
  BASE_BALL_VY,
  BLOCKS_ORIGIN_X,
  BLOCKS_ORIGIN_Y,
  BLOCK_H,
  BLOCK_W,
  FLASH_DURATION,
  H,
  INITIAL_LIVES,
  MAX_DT,
  PADDLE_H,
  PADDLE_W,
  PADDLE_Y,
  POINTS_PER_BLOCK,
  W,
} from "./constants";
import {
  clear,
  drawBall,
  drawBlocks,
  drawFlashes,
  drawHud,
  drawOverlay,
  drawPaddle,
  type Flash,
} from "./draw";
import { LAST_LEVEL, LEVELS } from "./levels";
import {
  advanceBall,
  bouncePaddle,
  bounceWalls,
  centerPaddleAt,
  firstHitBlock,
  isBallLost,
  movePaddle,
  type Ball,
  type Block,
  type Paddle,
} from "./physics";

/**
 * Teclas que el motor consume y que, sin `preventDefault`, moverían la página.
 * `KeyP` y `Escape` **no** están: son de la plataforma.
 */
const CAPTURED_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
]);

export function createLadrillosEngine(
  canvas: HTMLCanvasElement,
  hooks: GameEngineHooks,
): GameEngine {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("BLOQUE BUSTER: el canvas no da contexto 2d");
  // El narrowing de arriba no sobrevive dentro de las clausuras.
  const ctx: CanvasRenderingContext2D = context;

  // ── Estado de la partida ───────────────────────────────────────────────────
  const paddle: Paddle = { x: 0, y: PADDLE_Y, w: PADDLE_W, h: PADDLE_H };
  const ball: Ball = {
    x: 0,
    y: 0,
    w: BALL_SIZE,
    h: BALL_SIZE,
    vx: BASE_BALL_VX,
    vy: BASE_BALL_VY,
  };
  let blocks: Block[] = [];
  let flashes: Flash[] = [];
  let score = 0;
  let lives = INITIAL_LIVES;
  let level = 1;
  let status: "playing" | "gameover" = "playing";
  /** Solo cambia el texto del cartel: se acabó ganando, no perdiendo. */
  let completado = false;

  // ── Contabilidad del bucle ─────────────────────────────────────────────────
  let rafId: number | null = null;
  let lastTime: number | null = null;
  let destroyed = false;
  let listening = false;
  /**
   * La pausa la gobierna el reproductor y no toca `status`, pero tiene que
   * cortar **también la entrada**. Sin esto, con el lienzo congelado las
   * flechas seguirían moviendo la paleta y el ratón la arrastraría con solo
   * pasar el puntero por encima.
   */
  let paused = false;
  /** null para que el primer snapshot se emita siempre. */
  let lastSnapshot: GameSnapshot | null = null;

  /** Flechas mantenidas. Aquí sí hacen falta: la paleta se mueve continuo. */
  const keys: Record<string, boolean> = {};

  function clearInput(): void {
    for (const k of Object.keys(keys)) keys[k] = false;
  }

  function resetBall(): void {
    const { speed } = LEVELS[level - 1];
    ball.x = paddle.x + (paddle.w - ball.w) / 2;
    ball.y = paddle.y - ball.h;
    ball.vx = BASE_BALL_VX * speed;
    ball.vy = BASE_BALL_VY * speed;
  }

  function loadLevel(n: number): void {
    level = n;
    blocks = LEVELS[n - 1].blocks.map((b) => ({
      x: BLOCKS_ORIGIN_X + b.col * BLOCK_W,
      y: BLOCKS_ORIGIN_Y + b.row * BLOCK_H,
      w: BLOCK_W,
      h: BLOCK_H,
      color: b.color,
      alive: true,
    }));
    flashes = [];
    resetBall();
  }

  function initGame(): void {
    paddle.x = (W - paddle.w) / 2;
    score = 0;
    lives = INITIAL_LIVES;
    status = "playing";
    completado = false;
    paused = false;
    lastSnapshot = null;
    clearInput();
    loadLevel(1);
  }

  function endGame(ganando: boolean): void {
    completado = ganando;
    status = "gameover";
    hooks.onGameOver(score);
  }

  // ── Entrada ────────────────────────────────────────────────────────────────
  function onKeyDown(e: KeyboardEvent): void {
    if (isTypingTarget(e.target)) return;
    // El preventDefault se mantiene en pausa: las flechas no deben mover la
    // página mientras el reproductor está montado.
    if (CAPTURED_KEYS.has(e.code)) e.preventDefault();
    if (paused || status !== "playing") return;
    if (e.code === "ArrowLeft" || e.code === "ArrowRight") keys[e.code] = true;
  }

  /** Se suelta siempre, aunque el foco haya saltado: si no, se queda pegada. */
  function onKeyUp(e: KeyboardEvent): void {
    if (e.code === "ArrowLeft" || e.code === "ArrowRight") keys[e.code] = false;
  }

  /**
   * El ratón apunta a un punto de pantalla; la paleta vive en coordenadas del
   * mundo. El reproductor estira el lienzo por CSS, así que sin esta
   * conversión la paleta iría desplazada a cualquier ancho que no sea 800.
   */
  function onMouseMove(e: MouseEvent): void {
    if (paused || status !== "playing") return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    const escala = canvas.width / rect.width;
    centerPaddleAt(paddle, (e.clientX - rect.left) * escala);
  }

  // ── Bucle ──────────────────────────────────────────────────────────────────
  function update(dt: number): void {
    if (status !== "playing") return;

    if (keys.ArrowLeft) movePaddle(paddle, -1, dt);
    if (keys.ArrowRight) movePaddle(paddle, 1, dt);

    advanceBall(ball, dt);
    bounceWalls(ball);
    bouncePaddle(ball, paddle);

    // Un bloque por fotograma, como el original.
    const hit = firstHitBlock(ball, blocks);
    if (hit) {
      hit.alive = false;
      flashes.push({
        x: hit.x,
        y: hit.y,
        w: hit.w,
        h: hit.h,
        color: hit.color,
        elapsed: 0,
      });
      score += POINTS_PER_BLOCK;
      // El original invierte sin mirar qué cara golpeó. Se porta tal cual.
      ball.vy = -ball.vy;
      if (blocks.every((b) => !b.alive)) {
        if (level < LAST_LEVEL) loadLevel(level + 1);
        else endGame(true);
      }
    }

    for (const f of flashes) f.elapsed += dt * 1000;
    flashes = flashes.filter((f) => f.elapsed < FLASH_DURATION);

    if (isBallLost(ball, H)) {
      lives--;
      if (lives <= 0) {
        lives = 0;
        endGame(false);
      } else {
        resetBall();
      }
    }
  }

  function draw(): void {
    clear(ctx);
    drawBlocks(ctx, blocks);
    drawFlashes(ctx, flashes);
    drawPaddle(ctx, paddle);
    drawBall(ctx, ball);
    if (status === "playing") {
      drawHud(ctx, { score, level, lives });
    } else {
      drawOverlay(
        ctx,
        completado ? "¡COMPLETADO!" : "GAME OVER",
        `NIVEL ${level} · ${score} PUNTOS`,
        completado ? "win" : "gameOver",
      );
    }
  }

  /** Solo avisa al HUD cuando alguno de los tres valores cambia de verdad. */
  function emitSnapshot(): void {
    if (
      lastSnapshot !== null &&
      lastSnapshot.score === score &&
      lastSnapshot.lives === lives &&
      lastSnapshot.level === level
    ) {
      return;
    }
    // Sin `lines`: el HUD de la plataforma pinta «Vidas» con corazones.
    lastSnapshot = { score, lives, level };
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
    rafId = status === "playing" ? requestAnimationFrame(frame) : null;
  }

  function runLoop(): void {
    if (rafId !== null || status !== "playing") return;
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
        canvas.addEventListener("mousemove", onMouseMove);
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
        canvas.removeEventListener("mousemove", onMouseMove);
        listening = false;
      }
      clearInput();
      blocks = [];
      flashes = [];
      lastSnapshot = null;
    },
  };
}
