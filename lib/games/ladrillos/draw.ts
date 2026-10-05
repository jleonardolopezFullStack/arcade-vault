// Dibujo de BLOQUE BUSTER, repintado con la paleta del Vault.
//
// El original dibujaba todo con un spritesheet PNG; aquí no se carga ninguna
// imagen y cada pieza son primitivas de canvas. La explosión de cuatro
// fotogramas se sustituye por un destello que crece y se apaga en los mismos
// 150 ms.
//
// Cada función recibe el `ctx`; ninguna lo lee del ámbito.
import { formatScore } from "@/lib/format";
import {
  BALL_SIZE,
  BLOCK_COLORS,
  FLASH_DURATION,
  FLASH_GROW,
  FONT_MONO,
  FONT_PIXEL,
  H,
  HIGHLIGHT,
  HIGHLIGHT_H,
  PALETTE,
  W,
  type BlockColor,
} from "./constants";
import type { Ball, Block, Paddle } from "./physics";
/** Un bloque roto, apagándose. */
export type Flash = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: BlockColor;
  /** Milisegundos desde que se rompió. */
  elapsed: number;
};
/** Fondo del lienzo, antes de todo lo demás. */
export function clear(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, W, H);
}
/** Rectángulo con el brillo superior que comparten bloques y paleta. */
function brick(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = HIGHLIGHT;
  ctx.fillRect(x + 1, y + 1, w - 2, HIGHLIGHT_H);
}
export function drawBlocks(
  ctx: CanvasRenderingContext2D,
  blocks: readonly Block[],
): void {
  for (const b of blocks) {
    if (b.alive) brick(ctx, b.x, b.y, b.w, b.h, BLOCK_COLORS[b.color]);
  }
}
/**
 * Los destellos de los bloques rotos: el rectángulo crece hacia fuera mientras
 * su opacidad cae a cero.
 */
export function drawFlashes(
  ctx: CanvasRenderingContext2D,
  flashes: readonly Flash[],
): void {
  for (const f of flashes) {
    const t = Math.min(f.elapsed / FLASH_DURATION, 1);
    const grow = FLASH_GROW * t;
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = BLOCK_COLORS[f.color];
    ctx.fillRect(f.x - grow, f.y - grow, f.w + grow * 2, f.h + grow * 2);
  }
  // Si esto no vuelve a 1, todo lo que se dibuje después sale fantasma.
  ctx.globalAlpha = 1;
}
export function drawPaddle(
  ctx: CanvasRenderingContext2D,
  paddle: Paddle,
): void {
  brick(ctx, paddle.x, paddle.y, paddle.w, paddle.h, PALETTE.paddle);
}
export function drawBall(ctx: CanvasRenderingContext2D, ball: Ball): void {
  ctx.fillStyle = PALETTE.ball;
  ctx.fillRect(ball.x, ball.y, ball.w, ball.h);
}
/**
 * HUD del canvas, con el mismo reparto del original: puntuación a la
 * izquierda, nivel centrado y vidas como pelotas a la derecha.
 *
 * Usa `formatScore` —el mismo que el HUD de React— para que las dos cifras
 * sean idénticas carácter a carácter, no solo iguales de valor.
 */
export function drawHud(
  ctx: CanvasRenderingContext2D,
  stats: { score: number; level: number; lives: number },
): void {
  ctx.textBaseline = "top";
  ctx.fillStyle = PALETTE.hudLabel;
  ctx.font = `10px ${FONT_MONO}`;
  ctx.textAlign = "left";
  ctx.fillText("PUNTUACIÓN", 14, 14);
  ctx.textAlign = "center";
  ctx.fillText("NIVEL", W / 2, 14);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = `16px ${FONT_PIXEL}`;
  ctx.textAlign = "left";
  ctx.fillText(formatScore(stats.score), 14, 32);
  ctx.textAlign = "center";
  ctx.fillText(String(stats.level).padStart(2, "0"), W / 2, 32);
  // Vidas como pelotas, pegadas al borde derecho, igual que el original.
  const gap = 4;
  for (let i = 0; i < stats.lives; i++) {
    const x = W - 14 - (stats.lives - i) * (BALL_SIZE + gap);
    ctx.fillStyle = PALETTE.ball;
    ctx.fillRect(x, 18, BALL_SIZE, BALL_SIZE);
  }
}
/**
 * El cartel de fin de partida. Se conserva del original **sin** su overlay de
 * pausa ni su fila de botones de salto de nivel: la pausa es de la plataforma
 * y los botones eran depuración.
 */
export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  title: string,
  sub: string,
  tone: "gameOver" | "win",
): void {
  ctx.fillStyle = PALETTE.overlay;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = PALETTE[tone];
  ctx.font = `34px ${FONT_PIXEL}`;
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = `18px ${FONT_MONO}`;
  ctx.fillText(sub, W / 2, H / 2 + 22);
}
