// Dibujo del tablero con la paleta de la skin activa.
//
// Dos diferencias deliberadas con el original:
//
// 1. El original leía el color de la rejilla con `getComputedStyle` en cada
//    fotograma. Aquí es un literal de la paleta: `ctx` no entiende variables
//    CSS y consultarlas 60 veces por segundo es caro.
// 2. El HUD y la pieza siguiente se pintan **en el canvas**, no en DOM: la
//    plataforma da un solo lienzo, así que ocupan las dos bandas que deja el
//    tablero (ver `LAYOUT` en ./constants).
//
// Cada función recibe el `ctx` y la paleta activa `pal`; ninguna los lee
// del ámbito.
import { formatScore } from "@/lib/format";
import {
  BLOCK,
  BLOCK_HIGHLIGHT_H,
  COLS,
  FONT_MONO,
  FONT_PIXEL,
  GHOST_ALPHA,
  H,
  LAYOUT,
  NEXT_GRID_X,
  NEXT_GRID_Y,
  ROWS,
  W,
  type Palette,
} from "./constants";
import type { Board, Piece, Shape } from "./board";
/**
 * Un bloque en coordenadas de rejilla, no de lienzo.
 *
 * Quien lo llama coloca el origen con `translate`, igual que en el original,
 * donde el canvas del tablero empezaba en (0, 0).
 */
export function drawBlock(
  ctx: CanvasRenderingContext2D,
  pal: Palette,
  col: number,
  row: number,
  colorIndex: number,
  size: number,
  alpha?: number,
): void {
  if (!colorIndex) return;
  const color = pal.pieces[colorIndex];
  if (!color) return;
  ctx.globalAlpha = alpha ?? 1;
  ctx.fillStyle = color;
  ctx.fillRect(col * size + 1, row * size + 1, size - 2, size - 2);
  // Brillo superior: el mismo 12 % de blanco del original (nulo en retro).
  ctx.fillStyle = pal.highlight;
  ctx.fillRect(col * size + 1, row * size + 1, size - 2, BLOCK_HIGHLIGHT_H);
  drawMark(ctx, pal, col * size + 1, row * size + 1, size - 2, colorIndex);
  ctx.globalAlpha = 1;
}
/**
 * La marca interior de `retro`, recortada con el color del fondo: es lo que
 * distingue dos piezas del mismo tono de LCD. En las otras skins es 0.
 */
function drawMark(
  ctx: CanvasRenderingContext2D,
  pal: Palette,
  x: number,
  y: number,
  s: number,
  colorIndex: number,
): void {
  const mark = pal.marks[colorIndex] ?? 0;
  if (!mark) return;
  ctx.fillStyle = pal.bg;
  if (mark === 1) {
    const h = Math.round(s / 3);
    ctx.fillRect(x + (s - h) / 2, y + (s - h) / 2, h, h);
    return;
  }
  const b = Math.max(3, Math.round(s / 5));
  ctx.fillRect(x + b, y + b, s - 2 * b, s - 2 * b);
  if (mark === 3) {
    const color = pal.pieces[colorIndex];
    if (!color) return;
    const d = Math.max(2, Math.round(s / 6));
    ctx.fillStyle = color;
    ctx.fillRect(x + (s - d) / 2, y + (s - d) / 2, d, d);
  }
}
/** Lleva el origen al tablero, ejecuta el dibujo y lo devuelve a su sitio. */
function onBoard(ctx: CanvasRenderingContext2D, paint: () => void): void {
  ctx.save();
  ctx.translate(LAYOUT.board.x, LAYOUT.board.y);
  paint();
  ctx.restore();
}
/** Rejilla interior y marco del tablero. */
export function drawGrid(ctx: CanvasRenderingContext2D, pal: Palette): void {
  onBoard(ctx, () => {
    ctx.strokeStyle = pal.grid;
    ctx.lineWidth = 0.5;
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * BLOCK, 0);
      ctx.lineTo(c * BLOCK, ROWS * BLOCK);
      ctx.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * BLOCK);
      ctx.lineTo(COLS * BLOCK, r * BLOCK);
      ctx.stroke();
    }
    // El marco sustituye al borde que el original ponía por CSS.
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, COLS * BLOCK - 1, ROWS * BLOCK - 1);
  });
}
/** Las piezas ya fijadas. */
export function drawBoard(
  ctx: CanvasRenderingContext2D,
  pal: Palette,
  board: Board,
): void {
  onBoard(ctx, () => {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        drawBlock(ctx, pal, c, r, board[r][c], BLOCK);
      }
    }
  });
}
/** La silueta de dónde caería la pieza, atenuada. */
export function drawGhost(
  ctx: CanvasRenderingContext2D,
  pal: Palette,
  piece: Piece,
  gy: number,
): void {
  onBoard(ctx, () => {
    paintShape(ctx, pal, piece.shape, piece.x, gy, BLOCK, GHOST_ALPHA);
  });
}
/** La pieza que cae. */
export function drawPiece(
  ctx: CanvasRenderingContext2D,
  pal: Palette,
  piece: Piece,
): void {
  onBoard(ctx, () => {
    paintShape(ctx, pal, piece.shape, piece.x, piece.y, BLOCK);
  });
}
function paintShape(
  ctx: CanvasRenderingContext2D,
  pal: Palette,
  shape: Shape,
  ox: number,
  oy: number,
  size: number,
  alpha?: number,
): void {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      drawBlock(ctx, pal, ox + c, oy + r, shape[r][c], size, alpha);
    }
  }
}
/** Rótulo y rejilla 4×4 con la pieza que viene, a la derecha del tablero. */
export function drawNextPanel(
  ctx: CanvasRenderingContext2D,
  pal: Palette,
  next: Piece,
): void {
  const { block, cells } = LAYOUT.next;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = pal.hudLabel;
  ctx.font = `10px ${FONT_MONO}`;
  ctx.fillText("SIGUIENTE", NEXT_GRID_X, LAYOUT.next.y + 12);
  ctx.save();
  ctx.translate(NEXT_GRID_X, NEXT_GRID_Y);
  ctx.strokeStyle = pal.grid;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, cells * block - 1, cells * block - 1);
  // Centrado dentro de la rejilla, con el mismo cálculo del original.
  const offX = Math.floor((cells - next.shape[0].length) / 2);
  const offY = Math.floor((cells - next.shape.length) / 2);
  paintShape(ctx, pal, next.shape, offX, offY, block);
  ctx.restore();
}
/**
 * Puntuación, líneas y nivel apilados a la izquierda.
 *
 * Usa `formatScore` —el mismo que el HUD de React— para que las dos cifras
 * sean idénticas carácter a carácter, no solo iguales de valor.
 */
export function drawHud(
  ctx: CanvasRenderingContext2D,
  pal: Palette,
  stats: { score: number; lines: number; level: number },
): void {
  const entries: ReadonlyArray<[string, string]> = [
    ["PUNTUACIÓN", formatScore(stats.score)],
    ["LÍNEAS", formatScore(stats.lines)],
    ["NIVEL", String(stats.level).padStart(2, "0")],
  ];
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  entries.forEach(([label, value], i) => {
    const y = LAYOUT.hud.y + i * LAYOUT.hud.lineHeight;
    ctx.fillStyle = pal.hudLabel;
    ctx.font = `10px ${FONT_MONO}`;
    ctx.fillText(label, LAYOUT.hud.x, y);
    ctx.fillStyle = pal.hud;
    ctx.font = `16px ${FONT_PIXEL}`;
    ctx.fillText(value, LAYOUT.hud.x, y + 26);
  });
}
/** Fondo del lienzo, antes de todo lo demás. */
export function clear(ctx: CanvasRenderingContext2D, pal: Palette): void {
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, W, H);
}
/**
 * El cartel de fin de partida, que se conserva del original **sin** su línea
 * de «pulsa para reiniciar»: quien reinicia es el modal de la plataforma.
 */
export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  pal: Palette,
  title: string,
  sub: string,
): void {
  ctx.fillStyle = pal.overlay;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.fillStyle = pal.gameOver;
  ctx.font = `34px ${FONT_PIXEL}`;
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.fillStyle = pal.hud;
  ctx.font = `18px ${FONT_MONO}`;
  ctx.fillText(sub, W / 2, H / 2 + 22);
}
