// Dibujo de SERPENTINA con la paleta del Vault.
//
// **No se carga ninguna imagen.** El pack de sprites de frutas se descartó a
// propósito —SPEC 09 §1, igual que SPEC 08 hizo con el spritesheet del
// arkanoid—: las cinco siluetas son primitivas de canvas, así que `start()`
// sigue siendo sincrónico y el motor no tiene fase de carga.
//
// Cada función recibe el `ctx`; ninguna lo lee del ámbito.
import { formatScore } from "@/lib/format";
import type { Cell, Dir, Fruit } from "./board";
import {
  BOARD,
  CELL,
  COLS,
  FONT_MONO,
  FONT_PIXEL,
  FRUIT_R,
  H,
  HUD_H,
  PALETTE,
  RARE_TTL,
  ROWS,
  W,
  type FruitShape,
} from "./constants";
/** Centro en píxeles de una celda de la rejilla. */
function center(cell: Cell): { x: number; y: number } {
  return {
    x: BOARD.x + cell.col * CELL + CELL / 2,
    y: BOARD.y + cell.row * CELL + CELL / 2,
  };
}
/** Interpolación lineal entre dos colores `#rrggbb`. */
function mixHex(a: string, b: string, t: number): string {
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const at = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `rgb(${at(r1, r2)}, ${at(g1, g2)}, ${at(b1, b2)})`;
}
/** Fondo del lienzo, antes de todo lo demás. */
export function clear(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, W, H);
}
/**
 * El tablero: fondo, rejilla y marco.
 *
 * **La rejilla se traza como líneas, no como 988 rectángulos.** Son dos
 * recorridos de `COLS` y `ROWS` en un solo `stroke()`, porque esto se redibuja
 * sesenta veces por segundo dentro de un marco con scanlines y filtros CSS.
 *
 * El marco es el límite que mata, así que se pinta: sin él, chocar contra una
 * pared invisible parecería un fallo.
 */
export function drawBoard(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = PALETTE.boardFill;
  ctx.fillRect(BOARD.x, BOARD.y, BOARD.w, BOARD.h);
  ctx.strokeStyle = PALETTE.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let col = 1; col < COLS; col++) {
    const x = BOARD.x + col * CELL + 0.5;
    ctx.moveTo(x, BOARD.y);
    ctx.lineTo(x, BOARD.y + BOARD.h);
  }
  for (let row = 1; row < ROWS; row++) {
    const y = BOARD.y + row * CELL + 0.5;
    ctx.moveTo(BOARD.x, y);
    ctx.lineTo(BOARD.x + BOARD.w, y);
  }
  ctx.stroke();
  ctx.strokeStyle = PALETTE.frame;
  ctx.lineWidth = 2;
  ctx.strokeRect(BOARD.x - 1, BOARD.y - 1, BOARD.w + 2, BOARD.h + 2);
}
/**
 * La serpiente: cuerpo verde con glow, cabeza cian con dos ojos y los últimos
 * segmentos degradados hacia tinta tenue para que se lea dónde acaba.
 *
 * Se recorre de la cola a la cabeza para que la cabeza quede encima en los
 * cruces visuales de un giro cerrado.
 */
export function drawSnake(
  ctx: CanvasRenderingContext2D,
  snake: readonly Cell[],
  dir: Dir | null,
): void {
  const size = CELL - 4;
  // Cuántos segmentos del final se apagan. **Solo a partir de cierto largo**:
  // con la serpiente de salida, degradar 2 de sus 3 segmentos la hacía nacer
  // gris en vez de verde. El degradado sirve para leer dónde acaba una
  // serpiente larga; en una corta se ve entera de un vistazo.
  const fade = Math.min(5, Math.max(0, snake.length - 4));
  ctx.shadowColor = PALETTE.snake;
  ctx.shadowBlur = 8;
  for (let i = snake.length - 1; i >= 1; i--) {
    // `from` es la distancia a la punta de la cola: 0 es el último segmento.
    const from = snake.length - 1 - i;
    // El 0,8 evita que la punta llegue a tinta pura y parezca otra cosa.
    const t = fade > 0 && from < fade ? (1 - from / fade) * 0.8 : 0;
    ctx.fillStyle = mixHex(PALETTE.snake, PALETTE.snakeTail, t);
    const c = center(snake[i]);
    ctx.fillRect(c.x - size / 2, c.y - size / 2, size, size);
  }
  const head = center(snake[0]);
  ctx.fillStyle = PALETTE.head;
  ctx.shadowColor = PALETTE.head;
  ctx.fillRect(head.x - size / 2, head.y - size / 2, size, size);
  ctx.shadowBlur = 0;
  // Los ojos miran hacia donde se va. Con la serpiente parada todavía no hay
  // dirección, así que se deduce del cuerpo: cabeza menos segundo segmento.
  const look =
    dir ??
    (snake.length > 1
      ? { dc: snake[0].col - snake[1].col, dr: snake[0].row - snake[1].row }
      : { dc: 1, dr: 0 });
  // Perpendicular a la mirada: separa los dos ojos.
  const px = look.dr;
  const py = look.dc;
  const eye = 3;
  ctx.fillStyle = PALETTE.eye;
  for (const side of [-1, 1]) {
    const ex = head.x + look.dc * 3 + px * side * 3;
    const ey = head.y + look.dr * 3 + py * side * 3;
    ctx.fillRect(ex - eye / 2, ey - eye / 2, eye, eye);
  }
}
/** Las cinco siluetas, solo con arcos, elipses y trazos. Cero sprites. */
function shape(
  ctx: CanvasRenderingContext2D,
  kind: FruitShape,
  x: number,
  y: number,
  r: number,
): void {
  switch (kind) {
    case "manzana": {
      ctx.beginPath();
      ctx.arc(x, y + r * 0.1, r * 0.9, 0, Math.PI * 2);
      ctx.fill();
      // Tallo y hoja, lo único que la distingue de la baya a este tamaño.
      ctx.fillRect(x - 0.5, y - r, 1, r * 0.4);
      ctx.beginPath();
      ctx.ellipse(x + r * 0.4, y - r * 0.8, r * 0.35, r * 0.18, -0.5, 0, 7);
      ctx.fill();
      break;
    }
    case "racimo": {
      const rr = r * 0.5;
      for (const [dx, dy] of [
        [-0.5, -0.4],
        [0.5, -0.4],
        [0, 0.55],
      ]) {
        ctx.beginPath();
        ctx.arc(x + dx * r, y + dy * r, rr, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "baya": {
      ctx.beginPath();
      ctx.ellipse(x, y, r * 0.62, r, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "rodaja": {
      // Media luna con el lado plano arriba. **Sin gajos recortados**: tres
      // líneas de 1 px sobre 14 px de fruta con glow se ven como una mancha
      // sucia, no como una rodaja. A este tamaño gana la silueta limpia.
      ctx.beginPath();
      ctx.arc(x, y - r * 0.35, r, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "estrella": {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const ang = (Math.PI / 5) * i - Math.PI / 2;
        const rad = i % 2 === 0 ? r : r * 0.45;
        const fx = x + Math.cos(ang) * rad;
        const fy = y + Math.sin(ang) * rad;
        if (i === 0) ctx.moveTo(fx, fy);
        else ctx.lineTo(fx, fy);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
  }
}
/**
 * La fruta.
 *
 * **La silueta es adorno y el color es la información**: magenta vale
 * `POINTS_COMMON`, amarillo vale `POINTS_RARE`. La rara lleva además un anillo
 * que se consume con su `ttl`, así se ve que caduca sin escribir un número en
 * el tablero; es lo que hace innecesario distinguir una baya de una manzana a
 * 14 px.
 */
export function drawFruit(ctx: CanvasRenderingContext2D, fruit: Fruit): void {
  const { x, y } = center(fruit);
  const color = fruit.rare ? PALETTE.fruitRare : PALETTE.fruit;
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  shape(ctx, fruit.shape, x, y, FRUIT_R);
  if (fruit.rare) {
    ctx.shadowBlur = 0;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const sweep = Math.PI * 2 * Math.max(0, Math.min(1, fruit.ttl / RARE_TTL));
    ctx.arc(x, y, FRUIT_R + 3, -Math.PI / 2, -Math.PI / 2 + sweep);
    ctx.stroke();
  }
  ctx.restore();
}
/**
 * HUD del canvas, dentro de la banda de `HUD_H`: puntuación a la izquierda,
 * nivel centrado y vidas a la derecha, una cabeza por vida.
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
  ctx.fillText("PUNTUACIÓN", BOARD.x, 8);
  ctx.textAlign = "center";
  ctx.fillText("NIVEL", W / 2, 8);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = `16px ${FONT_PIXEL}`;
  ctx.textAlign = "left";
  ctx.fillText(formatScore(stats.score), BOARD.x, 22);
  ctx.textAlign = "center";
  ctx.fillText(String(stats.level).padStart(2, "0"), W / 2, 22);
  const pip = 12;
  const gap = 5;
  for (let i = 0; i < stats.lives; i++) {
    const x = W - BOARD.x - (stats.lives - i) * (pip + gap);
    ctx.fillStyle = PALETTE.head;
    ctx.fillRect(x, (HUD_H - pip) / 2, pip, pip);
  }
}
/**
 * Los carteles de la partida: «VIDA PERDIDA» entre vidas, «GAME OVER» al
 * agotarlas y «¡TABLERO COMPLETO!» al no quedar celda libre.
 *
 * **Sin la línea de "pulsa espacio para reiniciar" del snake de toda la vida**:
 * quien reinicia es el `GameOverModal` de la plataforma.
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
  ctx.font = `30px ${FONT_PIXEL}`;
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = `18px ${FONT_MONO}`;
  ctx.fillText(sub, W / 2, H / 2 + 22);
}
