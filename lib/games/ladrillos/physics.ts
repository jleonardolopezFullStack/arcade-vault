// Física del juego, traducida de
// references/RRO5vePTlqkYrGHjYdtf_started-games/04-arkanoid/game.js.
//
// Lo único que cambia respecto al original es de dónde salen los datos: allí
// `ball`, `paddle` y `canvas` eran globales que estas funciones leían del
// ámbito; aquí se reciben como argumentos. Ninguna regla se toca.
//
// Sin estado de módulo, sin `ctx` y sin efectos al importar.
import {
  PADDLE_BOUNCE_TOLERANCE,
  PADDLE_SPEED,
  W,
  type BlockColor,
} from "./constants";
export type Ball = {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
};
export type Paddle = { x: number; y: number; w: number; h: number };
export type Block = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: BlockColor;
  alive: boolean;
};
/** Avanza la pelota un fotograma. **Muta** la pelota. */
export function advanceBall(ball: Ball, dt: number): void {
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
}
/**
 * Rebotes contra las paredes izquierda, derecha y superior. **Muta** la
 * pelota y devuelve si rebotó.
 *
 * Fija la posición al borde antes de invertir, y **fuerza el signo con
 * `Math.abs` en vez de negar**: si dos fotogramas seguidos detectan el mismo
 * borde, negar dejaría la pelota vibrando dentro de la pared.
 */
export function bounceWalls(ball: Ball): boolean {
  let bounced = false;
  if (ball.x <= 0) {
    ball.x = 0;
    ball.vx = Math.abs(ball.vx);
    bounced = true;
  }
  if (ball.x + ball.w >= W) {
    ball.x = W - ball.w;
    ball.vx = -Math.abs(ball.vx);
    bounced = true;
  }
  if (ball.y <= 0) {
    ball.y = 0;
    ball.vy = Math.abs(ball.vy);
    bounced = true;
  }
  return bounced;
}
/**
 * Rebote contra la paleta. **Muta** la pelota y devuelve si rebotó.
 *
 * Solo cuenta si la pelota va bajando (`vy > 0`) y si su borde inferior está
 * entre el borde superior de la paleta y ese borde más la tolerancia. Ese
 * margen es lo que evita que a velocidad alta la pelota pase de estar encima a
 * estar debajo sin haber tocado nunca.
 */
export function bouncePaddle(ball: Ball, paddle: Paddle): boolean {
  const seSolapaEnX =
    ball.x + ball.w > paddle.x && ball.x < paddle.x + paddle.w;
  const tocaPorArriba =
    ball.y + ball.h >= paddle.y &&
    ball.y + ball.h <= paddle.y + paddle.h + PADDLE_BOUNCE_TOLERANCE;
  if (ball.vy > 0 && seSolapaEnX && tocaPorArriba) {
    ball.y = paddle.y - ball.h;
    ball.vy = -Math.abs(ball.vy);
    return true;
  }
  return false;
}
/** Solapamiento de rectángulos alineados a los ejes. */
export function collideAABB(ball: Ball, block: Block): boolean {
  return (
    ball.x < block.x + block.w &&
    ball.x + ball.w > block.x &&
    ball.y < block.y + block.h &&
    ball.y + ball.h > block.y
  );
}
/**
 * El primer bloque vivo que toca la pelota, o `null`.
 *
 * **Uno por fotograma, a propósito**: el original corta el bucle en el primer
 * impacto. Romper dos bloques con un solo contacto cambiaría la puntuación.
 */
export function firstHitBlock(ball: Ball, blocks: Block[]): Block | null {
  for (const block of blocks) {
    if (!block.alive) continue;
    if (collideAABB(ball, block)) return block;
  }
  return null;
}
/** La pelota se escapó por abajo. */
export function isBallLost(ball: Ball, worldH: number): boolean {
  return ball.y > worldH;
}
/** Mueve la paleta con el teclado, sin salirse del mundo. **Muta** la paleta. */
export function movePaddle(
  paddle: Paddle,
  direction: -1 | 1,
  dt: number,
): void {
  const next = paddle.x + direction * PADDLE_SPEED * dt;
  paddle.x = Math.max(0, Math.min(W - paddle.w, next));
}
/**
 * Centra la paleta en una coordenada del mundo, sin salirse. **Muta** la
 * paleta. Lo usa el ratón, que apunta a un punto, no a una dirección.
 */
export function centerPaddleAt(paddle: Paddle, worldX: number): void {
  paddle.x = Math.max(0, Math.min(W - paddle.w, worldX - paddle.w / 2));
}
