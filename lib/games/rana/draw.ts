// Dibujo de RANARIA con la paleta del Vault.
//
// **No se carga ninguna imagen.** Rana, vehículos, troncos, tortugas y
// nenúfares son primitivas de canvas, así que `start()` sigue siendo
// sincrónico y el motor no tiene fase de carga. Ninguna función llama a la
// API de imágenes del canvas.
//
// Cada función recibe el `ctx`; ninguna lo lee del ámbito.
import { formatScore } from "@/lib/format";
import {
  BOARD,
  CELL,
  type CarColor,
  FONT_MONO,
  FONT_PIXEL,
  H,
  HOME_COLS,
  HOME_ROW,
  HOP_ANIM,
  HUD_H,
  type HopDir,
  INK_RGB,
  MEDIAN_ROW,
  PALETTE,
  RIVER_ROWS,
  ROAD_ROWS,
  START_ROW,
  TIME_BAND,
  TIME_LIMIT,
  TIME_WARN,
  W,
} from "./constants";
import type { DeathCause, Frog } from "./frog";
import { colCenter } from "./frog";
import {
  crocHead,
  type DivePhase,
  divePhase,
  isCroc,
  type Lane,
  type LaneObject,
  objectsOf,
} from "./lanes";
/** y del borde superior de una fila. */
const rowTop = (row: number) => BOARD.y + row * CELL;
/** y del centro de una fila. */
const rowMid = (row: number) => rowTop(row) + CELL / 2;
/** Ángulo de la figura según hacia dónde mira: 0 es hacia arriba. */
const FACING_ANGLE: Record<HopDir, number> = {
  up: 0,
  right: Math.PI / 2,
  down: Math.PI,
  left: -Math.PI / 2,
};
/** Rótulo de cada causa de muerte, centrado sobre el tablero. */
export const DEATH_LABEL: Record<DeathCause, string> = {
  atropellada: "ATROPELLADA",
  agua: "AL AGUA",
  arrastrada: "ARRASTRADA",
  tiempo: "¡TIEMPO!",
  mordida: "MORDIDA",
};
/** Fondo del lienzo, antes de todo lo demás. */
export function clear(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, W, H);
}
/**
 * El tablero por filas: orilla, río, mediana, carretera con sus marcas
 * discontinuas y salida, más el borde. El borde es el límite que mata al ser
 * arrastrado, así que se pinta.
 */
export function drawBoard(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = PALETTE.bank;
  ctx.fillRect(BOARD.x, rowTop(HOME_ROW), BOARD.w, CELL);
  ctx.fillStyle = PALETTE.water;
  ctx.fillRect(
    BOARD.x,
    rowTop(RIVER_ROWS[0]),
    BOARD.w,
    RIVER_ROWS.length * CELL,
  );
  // Las bahías son agua que entra en la orilla.
  for (const col of HOME_COLS) {
    ctx.fillRect(BOARD.x + col * CELL, rowTop(HOME_ROW), CELL, CELL);
  }
  ctx.fillStyle = PALETTE.safe;
  ctx.fillRect(BOARD.x, rowTop(MEDIAN_ROW), BOARD.w, CELL);
  ctx.fillRect(BOARD.x, rowTop(START_ROW), BOARD.w, CELL);
  ctx.fillStyle = PALETTE.road;
  ctx.fillRect(BOARD.x, rowTop(ROAD_ROWS[0]), BOARD.w, ROAD_ROWS.length * CELL);
  // Marcas discontinuas entre carriles: un solo stroke.
  ctx.strokeStyle = PALETTE.laneLine;
  ctx.lineWidth = 2;
  ctx.setLineDash([14, 12]);
  ctx.beginPath();
  for (let i = 1; i < ROAD_ROWS.length; i++) {
    const y = rowTop(ROAD_ROWS[i]);
    ctx.moveTo(BOARD.x, y);
    ctx.lineTo(BOARD.x + BOARD.w, y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = PALETTE.frame;
  ctx.lineWidth = 2;
  ctx.strokeRect(BOARD.x - 1, BOARD.y - 1, BOARD.w + 2, BOARD.h + 2);
}
/** Rectángulo redondeado relleno. */
function fillRound(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}
/** Coche o deportivo: carrocería, faros en la cara delantera y cuatro ruedas. */
function drawCar(
  ctx: CanvasRenderingContext2D,
  x: number,
  row: number,
  dir: 1 | -1,
  color: string,
  sport: boolean,
): void {
  const w = CELL - 6;
  const h = sport ? 20 : 26;
  const left = x + 3;
  const top = rowMid(row) - h / 2;
  ctx.fillStyle = PALETTE.bg;
  for (const wx of [left + 4, left + w - 10]) {
    ctx.fillRect(wx, top - 2, 6, 3);
    ctx.fillRect(wx, top + h - 1, 6, 3);
  }
  ctx.fillStyle = color;
  fillRound(ctx, left, top, w, h, 5);
  if (sport) {
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(left + 4, rowMid(row) - 1.5, w - 8, 3);
  }
  ctx.fillStyle = PALETTE.hud;
  const fx = dir === 1 ? left + w - 5 : left + 1;
  ctx.fillRect(fx, top + 3, 4, 4);
  ctx.fillRect(fx, top + h - 7, 4, 4);
}
/** Camión: caja de dos celdas y cabina cian en la cara delantera. */
function drawTruck(
  ctx: CanvasRenderingContext2D,
  x: number,
  row: number,
  dir: 1 | -1,
  w: number,
): void {
  const h = 28;
  const top = rowMid(row) - h / 2;
  const left = x + 3;
  const bodyW = w - 6;
  const cab = 12;
  ctx.fillStyle = PALETTE.truck;
  fillRound(ctx, left, top, bodyW, h, 3);
  ctx.fillStyle = PALETTE.car1;
  const cx = dir === 1 ? left + bodyW - cab : left;
  fillRound(ctx, cx, top + 2, cab, h - 4, 3);
}
/** Tronco: cuerpo bronce, extremos redondos y tres vetas. */
function drawLog(
  ctx: CanvasRenderingContext2D,
  x: number,
  row: number,
  w: number,
): void {
  const h = 28;
  const top = rowMid(row) - h / 2;
  const left = x + 2;
  const bodyW = w - 4;
  ctx.fillStyle = PALETTE.log;
  fillRound(ctx, left, top, bodyW, h, h / 2);
  ctx.fillStyle = PALETTE.logEnd;
  for (const ex of [left + h / 2, left + bodyW - h / 2]) {
    ctx.beginPath();
    ctx.arc(ex, rowMid(row), h / 2 - 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = PALETTE.logGrain;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const dy of [-7, 0, 7]) {
    ctx.moveTo(left + h, rowMid(row) + dy);
    ctx.lineTo(left + bodyW - h, rowMid(row) + dy);
  }
  ctx.stroke();
}
/**
 * Cocodrilo: lomo como un tronco en `croc` con tres crestas triangulares, y la
 * cabeza en `crocHead` —magenta, como los coches: magenta significa «esto
 * mata» en todo el tablero— con un ojo y la mandíbula marcada. La cabeza va
 * en la cara delantera, la que da `crocHead()`.
 */
function drawCroc(
  ctx: CanvasRenderingContext2D,
  lane: Lane,
  obj: LaneObject,
): void {
  const cy = rowMid(lane.row);
  const h = 26;
  const top = cy - h / 2;
  const head = crocHead(lane, obj);
  const bodyX = lane.dir === 1 ? obj.x + 2 : head.x + head.w;
  const bodyW = obj.w - CELL - 2;
  ctx.fillStyle = PALETTE.croc;
  fillRound(ctx, bodyX, top, bodyW, h, 8);
  // Tres crestas sobre el lomo.
  ctx.fillStyle = PALETTE.bg;
  for (let k = 0; k < 3; k++) {
    const cx = bodyX + (bodyW * (k + 0.5)) / 3;
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy);
    ctx.lineTo(cx, cy - 8);
    ctx.lineTo(cx + 7, cy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.crocHead;
  fillRound(ctx, head.x + 1, top + 2, head.w - 3, h - 4, 6);
  // Ojo hacia atrás de la cabeza y mandíbula a lo largo, hacia delante.
  const back = lane.dir === 1 ? head.x + 10 : head.x + head.w - 10;
  const front = lane.dir === 1 ? head.x + head.w - 3 : head.x + 2;
  ctx.fillStyle = PALETTE.bg;
  ctx.beginPath();
  ctx.arc(back, top + 8, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.bg;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(back, cy + 3);
  ctx.lineTo(front, cy + 3);
  ctx.stroke();
}
/** Un hexágono centrado. */
function hexagon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
): void {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}
/**
 * Grupo de tortugas: una por celda, con caparazón y cuatro patas cortas.
 *
 * En aviso, el mismo dibujo a media alfa y parpadeando a 6 Hz —medio
 * hundidas—; bajo el agua, solo un anillo tenue donde estaban, para que el
 * hueco se lea como «aquí había algo». El parpadeo sale de `blink`, el
 * acumulador del ciclo de buceo, así que la pausa también lo congela.
 */
function drawTurtles(
  ctx: CanvasRenderingContext2D,
  x: number,
  row: number,
  len: number,
  phase: DivePhase,
  blink: number,
): void {
  const cy = rowMid(row);
  if (phase === "under") {
    ctx.save();
    ctx.strokeStyle = PALETTE.ripple;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 2;
    for (let i = 0; i < len; i++) {
      ctx.beginPath();
      ctx.arc(x + i * CELL + CELL / 2, cy, 12, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  ctx.save();
  if (phase === "warn") {
    ctx.globalAlpha = Math.floor(blink * 12) % 2 === 0 ? 0.5 : 0.2;
  }
  for (let i = 0; i < len; i++) {
    const cx = x + i * CELL + CELL / 2;
    ctx.fillStyle = PALETTE.turtle;
    for (const [dx, dy] of [
      [-12, -11],
      [12, -11],
      [-12, 11],
      [12, 11],
    ]) {
      ctx.fillRect(cx + dx - 2.5, cy + dy - 2.5, 5, 5);
    }
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.turtleShell;
    hexagon(ctx, cx, cy, 8);
  }
  ctx.restore();
}
/**
 * Los diez carriles, recortados al tablero: los objetos que entran y salen se
 * ven cortados por el borde, no pintados sobre el margen. `level` decide si
 * las tortugas bucean.
 */
export function drawLanes(
  ctx: CanvasRenderingContext2D,
  lanes: readonly Lane[],
  level: number,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(BOARD.x, BOARD.y, BOARD.w, BOARD.h);
  ctx.clip();
  for (const lane of lanes) {
    const objects = objectsOf(lane);
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      if (obj.x > BOARD.x + BOARD.w || obj.x + obj.w < BOARD.x) continue;
      switch (lane.kind) {
        case "log":
          if (isCroc(lane, i, level)) {
            drawCroc(ctx, lane, obj);
          } else {
            drawLog(ctx, obj.x, lane.row, obj.w);
          }
          break;
        case "turtle":
          drawTurtles(
            ctx,
            obj.x,
            lane.row,
            lane.len,
            divePhase(lane, i, level),
            lane.diveAcc,
          );
          break;
        case "truck":
          drawTruck(ctx, obj.x, lane.row, lane.dir, obj.w);
          break;
        case "car":
        case "sport":
          drawCar(
            ctx,
            obj.x,
            lane.row,
            lane.dir,
            PALETTE[lane.color as CarColor],
            lane.kind === "sport",
          );
          break;
      }
    }
  }
  ctx.restore();
}
/**
 * La figura de la rana en el origen, mirando hacia arriba: elipse con patas y
 * dos ojos. El llamador traslada y rota el `ctx`.
 */
function frogShape(
  ctx: CanvasRenderingContext2D,
  color: string,
  scale: number,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3 * scale;
  ctx.lineCap = "round";
  ctx.beginPath();
  for (const side of [-1, 1]) {
    ctx.moveTo(side * 8 * scale, -6 * scale);
    ctx.lineTo(side * 14 * scale, -12 * scale);
    ctx.moveTo(side * 8 * scale, 6 * scale);
    ctx.lineTo(side * 14 * scale, 12 * scale);
  }
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, 13 * scale, 12 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const side of [-1, 1]) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(side * 6 * scale, -9 * scale, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.eye;
    ctx.beginPath();
    ctx.arc(side * 6 * scale, -10 * scale, 2 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
}
/**
 * Los cinco nenúfares. Uno ocupado lleva encima una rana pequeña en cian, con
 * glow: es lo único, junto a la rana viva, que brilla.
 */
export function drawHomes(
  ctx: CanvasRenderingContext2D,
  homes: readonly boolean[],
): void {
  const cy = rowMid(HOME_ROW);
  HOME_COLS.forEach((col, i) => {
    const cx = colCenter(col);
    ctx.fillStyle = PALETTE.lily;
    ctx.globalAlpha = homes[i] ? 0.5 : 0.8;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, 16, -Math.PI / 2 + 0.35, -Math.PI / 2 - 0.35 + Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    if (homes[i]) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.shadowColor = PALETTE.frogHome;
      ctx.shadowBlur = 10;
      frogShape(ctx, PALETTE.frogHome, 0.7);
      ctx.restore();
    }
  });
}
/**
 * La mosca de bonificación sobre su nenúfar: cuerpo amarillo y dos alas en
 * tinta translúcida, temblando ±1 px. `clock` es el tiempo de juego, así que
 * en pausa se queda quieta. Sin glow: ningún elemento nuevo brilla.
 */
export function drawFly(
  ctx: CanvasRenderingContext2D,
  home: number,
  clock: number,
): void {
  const cx = colCenter(HOME_COLS[home]) + Math.round(Math.sin(clock * 37));
  const cy = rowMid(HOME_ROW) - 2 + Math.round(Math.cos(clock * 29));
  ctx.fillStyle = PALETTE.flyWing;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + side * 5, cy - 3, 5, 3, side * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.fly;
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();
}
/**
 * La rana viva, con glow, orientada según el último salto. Durante HOP_ANIM la
 * posición dibujada interpola desde la celda anterior y la figura se estira un
 * 15 % en la dirección del salto.
 */
export function drawFrog(ctx: CanvasRenderingContext2D, frog: Frog): void {
  const t = frog.hopT > 0 ? 1 - frog.hopT / HOP_ANIM : 1;
  const x = frog.prevX + (frog.x - frog.prevX) * t;
  const y =
    rowMid(frog.prevRow) + (rowMid(frog.row) - rowMid(frog.prevRow)) * t;
  const stretch = frog.hopT > 0 ? 1 + 0.15 * Math.sin(Math.PI * t) : 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(FACING_ANGLE[frog.facing]);
  ctx.scale(1, stretch);
  ctx.shadowColor = PALETTE.frog;
  ctx.shadowBlur = 12;
  frogShape(ctx, PALETTE.frog, 1);
  ctx.restore();
}
/**
 * Marcador de muerte en el sitio donde cayó la rana, durante DEATH_TIME:
 * aspa para el atropello, anillos que crecen para el agua y el arrastre, y un
 * reloj para el tiempo. `t` va de 0 a 1.
 */
export function drawDeath(
  ctx: CanvasRenderingContext2D,
  cause: DeathCause,
  at: { x: number; row: number },
  t: number,
): void {
  const x = Math.min(
    Math.max(at.x, BOARD.x + CELL / 2),
    BOARD.x + BOARD.w - CELL / 2,
  );
  const y = rowMid(at.row);
  ctx.save();
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  if (cause === "atropellada" || cause === "mordida") {
    ctx.strokeStyle = PALETTE.death;
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 12);
    ctx.lineTo(x + 12, y + 12);
    ctx.moveTo(x + 12, y - 12);
    ctx.lineTo(x - 12, y + 12);
    ctx.stroke();
  } else if (cause === "tiempo") {
    ctx.strokeStyle = PALETTE.death;
    ctx.beginPath();
    ctx.arc(x, y, 13, 0, Math.PI * 2);
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 9);
    ctx.moveTo(x, y);
    ctx.lineTo(x + 7, y);
    ctx.stroke();
  } else {
    ctx.strokeStyle = PALETTE.ripple;
    for (let i = 0; i < 3; i++) {
      const r = 4 + (t * 18 + i * 6);
      ctx.globalAlpha = Math.max(0, 1 - t) * (1 - i * 0.25);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}
/**
 * HUD del canvas: puntuación a la izquierda, nivel centrado y las vidas a la
 * derecha como ranas pequeñas. Usa `formatScore` —el mismo que el HUD de
 * React— para que las dos cifras coincidan.
 */
export function drawHud(
  ctx: CanvasRenderingContext2D,
  stats: { score: number; level: number; lives: number },
): void {
  ctx.textBaseline = "top";
  ctx.fillStyle = PALETTE.hudLabel;
  ctx.font = `10px ${FONT_MONO}`;
  ctx.textAlign = "left";
  ctx.fillText("PUNTUACIÓN", BOARD.x, 4);
  ctx.textAlign = "center";
  ctx.fillText("NIVEL", W / 2, 4);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = `14px ${FONT_PIXEL}`;
  ctx.textAlign = "left";
  ctx.fillText(formatScore(stats.score), BOARD.x, 18);
  ctx.textAlign = "center";
  ctx.fillText(String(stats.level).padStart(2, "0"), W / 2, 18);
  const step = 22;
  for (let i = 0; i < stats.lives; i++) {
    const x = W - BOARD.x - 10 - (stats.lives - 1 - i) * step;
    ctx.save();
    ctx.translate(x, HUD_H / 2);
    frogShape(ctx, PALETTE.frog, 0.5);
    ctx.restore();
  }
}
/**
 * Banda inferior: rótulo «TIEMPO» y la barra, que se vacía de derecha a
 * izquierda. Por debajo de TIME_WARN pasa a magenta y parpadea a 4 Hz; `clock`
 * es el tiempo de juego acumulado, así que en pausa el parpadeo se congela.
 */
export function drawTimeBar(
  ctx: CanvasRenderingContext2D,
  timeLeft: number,
  clock: number,
): void {
  const frac = Math.max(0, Math.min(1, timeLeft / TIME_LIMIT));
  const warn = timeLeft < TIME_WARN;
  ctx.fillStyle = `rgba(${INK_RGB}, 0.06)`;
  ctx.fillRect(TIME_BAND.x, TIME_BAND.y, TIME_BAND.w, TIME_BAND.h);
  const visible = !warn || Math.floor(clock * 8) % 2 === 0;
  if (visible) {
    ctx.fillStyle = warn ? PALETTE.timeWarn : PALETTE.timeBar;
    ctx.fillRect(TIME_BAND.x, TIME_BAND.y, TIME_BAND.w * frac, TIME_BAND.h);
  }
  ctx.textBaseline = "top";
  ctx.font = `10px ${FONT_MONO}`;
  ctx.fillStyle = PALETTE.hudLabel;
  ctx.textAlign = "left";
  ctx.fillText("TIEMPO", TIME_BAND.x, TIME_BAND.y + TIME_BAND.h + 3);
  ctx.textAlign = "right";
  ctx.fillStyle = warn ? PALETTE.timeWarn : PALETTE.hudLabel;
  ctx.fillText(
    `${Math.ceil(timeLeft)} s`,
    TIME_BAND.x + TIME_BAND.w,
    TIME_BAND.y + TIME_BAND.h + 3,
  );
}
/**
 * Rótulo centrado sobre el tablero: la causa de una muerte, «NIVEL N» o
 * «GAME OVER». Con `dim` se oscurece el tablero detrás, para el final.
 */
export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  title: string,
  color: string,
  opts: { dim?: boolean; sub?: string } = {},
): void {
  if (opts.dim) {
    ctx.fillStyle = PALETTE.overlay;
    ctx.fillRect(BOARD.x, BOARD.y, BOARD.w, BOARD.h);
  }
  const cy = BOARD.y + BOARD.h / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `26px ${FONT_PIXEL}`;
  ctx.lineWidth = 6;
  ctx.strokeStyle = PALETTE.bg;
  ctx.strokeText(title, W / 2, cy);
  ctx.fillStyle = color;
  ctx.fillText(title, W / 2, cy);
  if (opts.sub) {
    ctx.font = `16px ${FONT_MONO}`;
    ctx.fillStyle = PALETTE.hud;
    ctx.fillText(opts.sub, W / 2, cy + 36);
  }
}
