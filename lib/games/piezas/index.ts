// Motor de CAÍDA: el tetris de
// references/RRO5vePTlqkYrGHjYdtf_started-games/03-tetris/game.js, portado al
// contrato de `lib/games/types.ts`.
//
// Lo que se cambió a propósito respecto al original, para que una comparación
// futura no confunda un porte con un fallo:
//
// - Todo el estado vive en la clausura de la fábrica, no en variables de
//   módulo: dos pantallas montadas a la vez no se pisan.
// - `dt` va en segundos y capado a MAX_DT; el original medía en milisegundos
//   y sin tope. La cadencia de caída no cambia: cambia la unidad.
// - Desaparecen su pausa en `KeyP`, su overlay propio, su botón de reinicio y
//   su conmutador de tema con localStorage. Pausa, reinicio y fin de partida
//   los gobierna la plataforma.
// - Los colores son los del Vault (ver PIECE_COLORS en ./constants).
import { isTypingTarget } from "@/lib/games/input";
import type {
  GameEngine,
  GameEngineHooks,
  GameSnapshot,
} from "@/lib/games/types";
import {
  clearLines,
  collide,
  createBoard,
  ghostY,
  merge,
  randomPiece,
  tryRotate,
  type Board,
  type Piece,
} from "./board";
import {
  dropIntervalMs,
  HARD_DROP_POINTS,
  levelFor,
  LINE_SCORES,
  MAX_DT,
  SOFT_DROP_POINTS,
} from "./constants";
import {
  clear,
  drawBoard,
  drawGhost,
  drawGrid,
  drawHud,
  drawNextPanel,
  drawOverlay,
  drawPiece,
} from "./draw";
/**
 * Teclas que el motor consume y que, sin `preventDefault`, harían scroll de la
 * página. `KeyP` y `Escape` **no** están: son de la plataforma.
 */
const CAPTURED_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Space",
]);
export function createPiezasEngine(
  canvas: HTMLCanvasElement,
  hooks: GameEngineHooks,
): GameEngine {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("CAÍDA: el canvas no da contexto 2d");
  // La narrowing de arriba no sobrevive dentro de las clausuras.
  const ctx: CanvasRenderingContext2D = context;
  // ── Estado de la partida ───────────────────────────────────────────────────
  let board: Board = createBoard();
  let current: Piece = randomPiece();
  let next: Piece = randomPiece();
  let score = 0;
  let lines = 0;
  let level = 1;
  let status: "playing" | "gameover" = "playing";
  /** Segundos acumulados desde la última bajada automática. */
  let dropAccum = 0;
  // ── Contabilidad del bucle ─────────────────────────────────────────────────
  let rafId: number | null = null;
  let lastTime: number | null = null;
  let destroyed = false;
  let listening = false;
  /**
   * La pausa la gobierna el reproductor, no el `status` de la partida, pero
   * tiene que cortar también la entrada: si no, con el juego congelado las
   * teclas seguirían moviendo y soltando piezas sin que nada se redibuje, y al
   * reanudar aparecerían jugadas que nadie vio. El original lo resolvía con
   * `if (paused || gameOver) return` en su manejador.
   */
  let paused = false;
  /** null para que el primer snapshot se emita siempre. */
  let lastSnapshot: GameSnapshot | null = null;
  function initGame(): void {
    board = createBoard();
    next = randomPiece();
    current = randomPiece();
    score = 0;
    lines = 0;
    level = 1;
    status = "playing";
    dropAccum = 0;
    paused = false;
    lastSnapshot = null;
  }
  /** La siguiente entra en juego; si no cabe, se acabó. */
  function spawn(): void {
    current = next;
    next = randomPiece();
    if (collide(board, current.shape, current.x, current.y)) {
      status = "gameover";
      hooks.onGameOver(score);
    }
  }
  function lockPiece(): void {
    merge(board, current);
    const cleared = clearLines(board);
    if (cleared) {
      lines += cleared;
      // El original puntúa con el nivel ANTERIOR y recalcula después.
      score += (LINE_SCORES[cleared] ?? 0) * level;
      level = levelFor(lines);
    }
    spawn();
  }
  function softDrop(): void {
    if (!collide(board, current.shape, current.x, current.y + 1)) {
      current.y++;
      score += SOFT_DROP_POINTS;
    } else {
      lockPiece();
    }
  }
  function hardDrop(): void {
    const gy = ghostY(board, current);
    score += (gy - current.y) * HARD_DROP_POINTS;
    current.y = gy;
    lockPiece();
  }
  function moveBy(dx: number): void {
    if (!collide(board, current.shape, current.x + dx, current.y)) {
      current.x += dx;
    }
  }
  // ── Entrada ────────────────────────────────────────────────────────────────
  // Toda discreta: el original no tiene `keyup` y el repetido lo da el sistema
  // operativo. Por eso no hay registro de teclas mantenidas.
  function onKeyDown(e: KeyboardEvent): void {
    if (isTypingTarget(e.target)) return;
    // El preventDefault se mantiene aunque esté en pausa: las flechas no deben
    // hacer scroll de la página mientras el reproductor está montado.
    if (CAPTURED_KEYS.has(e.code)) e.preventDefault();
    if (paused || status !== "playing") return;
    switch (e.code) {
      case "ArrowLeft":
        moveBy(-1);
        break;
      case "ArrowRight":
        moveBy(1);
        break;
      case "ArrowDown":
        softDrop();
        break;
      case "ArrowUp":
      case "KeyX":
        current = tryRotate(board, current);
        break;
      case "Space":
        hardDrop();
        break;
      default:
        return;
    }
  }
  // ── Bucle ──────────────────────────────────────────────────────────────────
  function update(dt: number): void {
    if (status !== "playing") return;
    dropAccum += dt;
    const intervalo = dropIntervalMs(level) / 1000;
    if (dropAccum >= intervalo) {
      dropAccum = 0;
      if (!collide(board, current.shape, current.x, current.y + 1)) {
        current.y++;
      } else {
        lockPiece();
      }
    }
  }
  function draw(): void {
    clear(ctx);
    drawGrid(ctx);
    drawBoard(ctx, board);
    if (status === "playing") {
      drawGhost(ctx, current, ghostY(board, current));
      drawPiece(ctx, current);
    }
    drawNextPanel(ctx, next);
    drawHud(ctx, { score, lines, level });
    if (status === "gameover")
      drawOverlay(ctx, "GAME OVER", `LÍNEAS: ${lines}`);
  }
  /** Solo avisa al HUD cuando alguno de los cuatro valores cambia de verdad. */
  function emitSnapshot(): void {
    if (
      lastSnapshot !== null &&
      lastSnapshot.score === score &&
      lastSnapshot.level === level &&
      lastSnapshot.lines === lines
    ) {
      return;
    }
    // `lives: 0` siempre: este juego no tiene vidas, y `lines` es lo que el
    // HUD de la plataforma pinta en su lugar.
    lastSnapshot = { score, lives: 0, level, lines };
    hooks.onSnapshot(lastSnapshot);
  }
  function frame(ts: number): void {
    const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, MAX_DT);
    lastTime = ts;
    update(dt);
    draw();
    emitSnapshot();
    // Al acabar la partida se deja de pedir fotogramas: el overlay ya está
    // pintado y quien reinicia es el modal de la plataforma.
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
        listening = true;
      }
      initGame();
      // Antes de pedir fotograma: si no, el HUD pinta el estado inicial
      // equivocado —«♥♥♥»— durante un fotograma.
      draw();
      emitSnapshot();
      runLoop();
    },
    pause() {
      paused = true;
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
      board = [];
      lastSnapshot = null;
    },
  };
}
