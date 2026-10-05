// Motor de SERPENTINA, contra el contrato de `lib/games/types.ts`.
//
// **No es un porte**: no hay snake en references/, así que no existe un
// original con el que comparar esto. Lo que sí hereda son los invariantes de
// los otros tres motores:
//
// - Todo el estado vive en la clausura de la fábrica, no en variables de
//   módulo: dos pantallas montadas a la vez no se pisan.
// - `dt` en segundos, capado a MAX_DT, y `lastTime = null` como centinela.
// - `start()` es síncrono: no se carga ninguna imagen ni ningún sonido.
// - Pausa, reinicio y fin de partida los gobierna la plataforma; el motor no
//   reclama `P` ni `Escape`.
//
// Lo propio de un juego de rejilla, y por tanto lo que hay que entender aquí,
// es que el movimiento **no es continuo**: el bucle corre a 60 fps para
// dibujar, pero la serpiente solo avanza cuando el acumulador llena un tick.
import { isTypingTarget } from "@/lib/games/input";
import type {
  GameEngine,
  GameEngineHooks,
  GameSnapshot,
} from "@/lib/games/types";
import {
  DOWN,
  LEFT,
  RIGHT,
  UP,
  isValidTurn,
  isWall,
  hitsSelf,
  levelFor,
  nextHead,
  sameCell,
  spawnFruit,
  startSnake,
  tickFor,
  type Cell,
  type Dir,
  type Fruit,
} from "./board";
import {
  GROW_COMMON,
  GROW_RARE,
  MAX_DT,
  POINTS_COMMON,
  POINTS_RARE,
  RESPAWN_DELAY,
  START_LIVES,
  TURN_QUEUE_MAX,
} from "./constants";
import {
  clear,
  drawBoard,
  drawFruit,
  drawHud,
  drawOverlay,
  drawSnake,
} from "./draw";
/**
 * Teclas que el motor consume y que, sin `preventDefault`, harían scroll.
 * `KeyP` y `Escape` **no** están: son de la plataforma.
 */
const TURN_KEYS: Record<string, Dir> = {
  ArrowUp: UP,
  ArrowDown: DOWN,
  ArrowLeft: LEFT,
  ArrowRight: RIGHT,
};
export function createSerpienteEngine(
  canvas: HTMLCanvasElement,
  hooks: GameEngineHooks,
): GameEngine {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("SERPENTINA: el canvas no da contexto 2d");
  // El narrowing de arriba no sobrevive dentro de las clausuras.
  const ctx: CanvasRenderingContext2D = context;
  // ── Estado de la partida ───────────────────────────────────────────────────
  let snake: Cell[] = startSnake();
  /** `null` = parada. Arranca así: el primer movimiento lo elige el jugador. */
  let dir: Dir | null = null;
  /** Giros pendientes, como mucho `TURN_QUEUE_MAX`. */
  let turns: Dir[] = [];
  /** Segmentos que faltan por añadir de la última fruta comida. */
  let pendingGrowth = 0;
  let fruit: Fruit | null = null;
  let score = 0;
  let lives = START_LIVES;
  let level = 1;
  let eaten = 0;
  let status: "playing" | "dead" | "gameover" = "playing";
  /** Solo cambia el texto del cartel: se acabó llenando el tablero, no muriendo. */
  let completado = false;
  /** Segundos acumulados hacia el siguiente paso de la serpiente. */
  let tickAcc = 0;
  /** Segundos acumulados de la espera tras perder una vida. */
  let respawnAcc = 0;
  // ── Contabilidad del bucle ─────────────────────────────────────────────────
  let rafId: number | null = null;
  let lastTime: number | null = null;
  let destroyed = false;
  let listening = false;
  /**
   * La pausa la gobierna el reproductor y no toca `status`, pero tiene que
   * cortar **también la entrada**. Sin esto, con el lienzo congelado las
   * flechas seguirían encolando giros que se aplicarían todos de golpe al
   * reanudar.
   */
  let paused = false;
  /** null para que el primer snapshot se emita siempre. */
  let lastSnapshot: GameSnapshot | null = null;
  function clearInput(): void {
    turns = [];
  }
  function initGame(): void {
    snake = startSnake();
    dir = null;
    pendingGrowth = 0;
    score = 0;
    lives = START_LIVES;
    level = 1;
    eaten = 0;
    status = "playing";
    completado = false;
    paused = false;
    tickAcc = 0;
    respawnAcc = 0;
    lastSnapshot = null;
    clearInput();
    fruit = spawnFruit(snake);
  }
  function endGame(ganando: boolean): void {
    completado = ganando;
    status = "gameover";
    hooks.onGameOver(score);
  }
  /**
   * Repone la serpiente tras perder una vida: longitud de salida, parada y en
   * el centro, **conservando puntuación y nivel**. La fruta se recoloca porque
   * la de antes podría haber quedado bajo el cuerpo nuevo.
   */
  function respawn(): void {
    snake = startSnake();
    dir = null;
    pendingGrowth = 0;
    tickAcc = 0;
    clearInput();
    fruit = spawnFruit(snake);
    status = "playing";
  }
  function loseLife(): void {
    lives--;
    if (lives <= 0) {
      lives = 0;
      endGame(false);
      return;
    }
    status = "dead";
    respawnAcc = 0;
  }
  function eat(): void {
    if (!fruit) return;
    // Los puntos se cobran al nivel en el que se comió, antes de que esta
    // misma fruta lo haga subir.
    score += (fruit.rare ? POINTS_RARE : POINTS_COMMON) * level;
    pendingGrowth += fruit.rare ? GROW_RARE : GROW_COMMON;
    eaten++;
    level = levelFor(eaten);
    fruit = spawnFruit(snake);
    // Sin celda libre no hay dónde poner la siguiente: el tablero está lleno y
    // eso es ganar. 988 celdas lo hacen casi inalcanzable, pero no puede petar.
    if (fruit === null) endGame(true);
  }
  /** Un paso de la serpiente. Solo lo llama el acumulador de ticks. */
  function step(): void {
    // El giro se valida **aquí**, contra la dirección que se lleva de verdad,
    // y no al encolarlo. Es la diferencia entre rechazar una inversión y
    // dejarla pasar: con la cola [arriba, abajo] viniendo de la derecha, el
    // primero entra y el segundo se descarta al tocarle el turno. Si se
    // validara al pulsar, los dos parecerían válidos contra «derecha» y la
    // serpiente se invertiría sobre su propio cuello un paso después.
    while (turns.length > 0) {
      const next = turns.shift();
      if (next && isValidTurn(dir, next)) {
        dir = next;
        break;
      }
    }
    if (dir === null) return;
    const head = nextHead(snake[0], dir);
    // En un paso que no alarga, la cola abandona su casilla a la vez que la
    // cabeza entra en la nueva: seguirse a sí misma es legal.
    const grows = pendingGrowth > 0;
    if (isWall(head) || hitsSelf(snake, head, !grows)) {
      loseLife();
      return;
    }
    snake.unshift(head);
    if (grows) pendingGrowth--;
    else snake.pop();
    if (fruit && sameCell(head, fruit)) eat();
  }
  // ── Entrada ────────────────────────────────────────────────────────────────
  function onKeyDown(e: KeyboardEvent): void {
    if (isTypingTarget(e.target)) return;
    // El preventDefault se mantiene en pausa: las flechas no deben mover la
    // página mientras el reproductor está montado.
    const turn = TURN_KEYS[e.code];
    if (!turn) return;
    e.preventDefault();
    // `repeat` fuera: mantener la flecha pulsada no debe rellenar la cola.
    if (e.repeat || paused || status !== "playing") return;
    if (turns.length < TURN_QUEUE_MAX) turns.push(turn);
  }
  // No hay oyente de `keyup` a propósito: este juego no guarda teclas
  // mantenidas —la serpiente no se mueve mientras pulsas, sino al tick—, así
  // que no hay ningún registro que pueda quedarse pegado al perder el foco.
  // ── Bucle ──────────────────────────────────────────────────────────────────
  function update(dt: number): void {
    if (status === "gameover") return;
    if (status === "dead") {
      respawnAcc += dt;
      if (respawnAcc >= RESPAWN_DELAY) respawn();
      return;
    }
    if (fruit?.rare) {
      fruit.ttl -= dt;
      if (fruit.ttl <= 0) {
        // Su relevo nunca vuelve a ser rara.
        fruit = spawnFruit(snake, true);
        if (fruit === null) {
          endGame(true);
          return;
        }
      }
    }
    // **Un paso por fotograma como máximo**, y por eso es un `if` y no un
    // `while`: `MAX_DT` (0,05 s) está por debajo de `TICK_MIN` (0,06 s), así
    // que el acumulador nunca puede llenar dos ticks seguidos. Con un `while`
    // recuperando el retraso, volver de una pestaña dormida teletransportaría
    // la cabeza media docena de celdas, probablemente dentro de su cola.
    const tick = tickFor(level);
    tickAcc += dt;
    if (tickAcc >= tick) {
      tickAcc -= tick;
      step();
    }
  }
  function draw(): void {
    clear(ctx);
    drawBoard(ctx);
    if (fruit) drawFruit(ctx, fruit);
    drawSnake(ctx, snake, dir);
    drawHud(ctx, { score, level, lives });
    if (status === "dead") {
      drawOverlay(
        ctx,
        "VIDA PERDIDA",
        lives === 1 ? "TE QUEDA 1 VIDA" : `TE QUEDAN ${lives} VIDAS`,
        "gameOver",
      );
    } else if (status === "gameover") {
      drawOverlay(
        ctx,
        completado ? "¡TABLERO COMPLETO!" : "GAME OVER",
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
    rafId = status === "gameover" ? null : requestAnimationFrame(frame);
  }
  function runLoop(): void {
    if (rafId !== null || status === "gameover") return;
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
        listening = false;
      }
      clearInput();
      snake = [];
      fruit = null;
      lastSnapshot = null;
    },
  };
}
