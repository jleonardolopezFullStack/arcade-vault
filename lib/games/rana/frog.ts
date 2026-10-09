// Rana y colisiones de RANARIA: lógica pura. Funciones sobre los datos que
// reciben; sin ctx, sin estado de módulo y sin efectos al importar.
import {
  BOARD,
  CELL,
  COLS,
  FROG_INSET,
  HOME_COLS,
  HOME_ROW,
  HOME_TOLERANCE,
  HOP_ANIM,
  HOP_COOLDOWN,
  type HopDir,
  RIVER_ROWS,
  ROAD_ROWS,
  START_COL,
  START_ROW,
  VEHICLE_INSET,
} from "./constants";
import {
  advanceLanes,
  type Lane,
  laneAt,
  objectsOf,
  platformUnder,
  speedMult,
} from "./lanes";
/**
 * La rana. `x` es el **centro** en píxeles, continuo, porque los troncos la
 * arrastran; `row` es entera. `prevX`/`prevRow` y `hopT` solo sirven para
 * interpolar el dibujo del salto.
 */
export type Frog = {
  x: number;
  row: number;
  prevX: number;
  prevRow: number;
  /** Segundos que le quedan a la animación del salto. */
  hopT: number;
  /** Segundos hasta que se acepta el siguiente salto. */
  cooldown: number;
  facing: HopDir;
};
export type DeathCause = "atropellada" | "agua" | "arrastrada" | "tiempo";
/** Lo que `resolveFrame` necesita y modifica de la partida. */
export type FrameState = {
  frog: Frog;
  lanes: Lane[];
  homes: boolean[];
  level: number;
  timeLeft: number;
  bestRow: number;
  /** Un solo hueco de búfer: la última flecha durante el cooldown gana. */
  queuedHop: HopDir | null;
};
/** Lo que ha pasado en el fotograma, para que la fábrica puntúe y reaccione. */
export type FrameResult = {
  /** Filas nuevas alcanzadas en este fotograma (0 o 1). */
  newRows: number;
  death: DeathCause | null;
  /** Índice del nenúfar ocupado en este fotograma, o null. */
  home: number | null;
};
/** Centro en x de una columna de la rejilla. */
export function colCenter(col: number): number {
  return BOARD.x + col * CELL + CELL / 2;
}
/** Centro en x de la columna más cercana a `x`, dentro del tablero. */
function snapToColumn(x: number): number {
  const col = Math.round((x - BOARD.x - CELL / 2) / CELL);
  return colCenter(Math.min(Math.max(col, 0), COLS - 1));
}
/** Rana nueva en la columna central de la acera de salida. */
export function createFrog(): Frog {
  const x = colCenter(START_COL);
  return {
    x,
    row: START_ROW,
    prevX: x,
    prevRow: START_ROW,
    hopT: 0,
    cooldown: 0,
    facing: "up",
  };
}
const isRiver = (row: number) => RIVER_ROWS.includes(row);
const isRoad = (row: number) => ROAD_ROWS.includes(row);
/**
 * Intenta un salto de una celda. Devuelve `false` si no se acepta: `↓` en la
 * salida, o un salto lateral cuyo centro de llegada saldría del tablero —no se
 * puede salir saltando; solo el arrastre saca a la rana, y eso mata—.
 *
 * El salto cambia la posición lógica **en el acto**; la animación es solo de
 * dibujo. Al caer en una fila que no es de río ni la orilla, la `x` se encaja
 * al centro de columna más cercano: sin ese encaje, una rana que bajara del
 * río desalineada no podría volver a encarar un nenúfar con precisión.
 */
export function tryHop(frog: Frog, dir: HopDir): boolean {
  let { x, row } = frog;
  if (dir === "up") row -= 1;
  else if (dir === "down") row += 1;
  else x += dir === "left" ? -CELL : CELL;
  if (row > START_ROW || row < HOME_ROW) return false;
  const minX = BOARD.x + CELL / 2;
  const maxX = BOARD.x + BOARD.w - CELL / 2;
  if (x < minX || x > maxX) return false;
  if (!isRiver(row) && row !== HOME_ROW) x = snapToColumn(x);
  frog.prevX = frog.x;
  frog.prevRow = frog.row;
  frog.x = x;
  frog.row = row;
  frog.hopT = HOP_ANIM;
  frog.cooldown = HOP_COOLDOWN;
  frog.facing = dir;
  return true;
}
/**
 * ¿La caja de la rana solapa algún vehículo de su fila? En la carretera se usa
 * la caja, no el centro: cualquier roce mata.
 */
export function hitsVehicle(lanes: readonly Lane[], frog: Frog): boolean {
  const lane = laneAt(lanes, frog.row);
  if (!lane || lane.kind === "log" || lane.kind === "turtle") return false;
  const half = CELL / 2 - FROG_INSET;
  const left = frog.x - half;
  const right = frog.x + half;
  for (const obj of objectsOf(lane)) {
    const vl = obj.x + VEHICLE_INSET;
    const vr = obj.x + obj.w - VEHICLE_INSET;
    if (left < vr && right > vl) return true;
  }
  return false;
}
/**
 * Índice de la bahía cuyo centro está a ≤ HOME_TOLERANCE del centro de la
 * rana, o -1 si la rana cae en la orilla entre bahías. No mira si está libre:
 * eso lo decide `resolveFrame` con `homes`.
 */
export function homeAt(x: number): number {
  return HOME_COLS.findIndex(
    (col) => Math.abs(colCenter(col) - x) <= HOME_TOLERANCE,
  );
}
/**
 * Un fotograma de juego con `status === "playing"`, **siempre en este orden**
 * (§2.5):
 *
 * 1. Plataforma bajo el centro, **antes** de mover nada.
 * 2. Carriles.
 * 3. Arrastre: la rana se mueve exactamente lo mismo que su plataforma.
 * 4. Salto pendiente, si el cooldown lo permite.
 * 5. Comprobación en la posición final.
 * 6. Reloj.
 *
 * Resolver la plataforma antes de mover los carriles es lo que impide que una
 * rana en el borde trasero de un tronco muera «al agua» estando visualmente
 * encima. Muta `state` y devuelve lo ocurrido; la puntuación es de la fábrica.
 */
export function resolveFrame(state: FrameState, dt: number): FrameResult {
  const { frog, lanes } = state;
  const mult = speedMult(state.level);
  const result: FrameResult = { newRows: 0, death: null, home: null };
  // 1) Plataforma.
  const vx = isRiver(frog.row)
    ? platformUnder(lanes, frog.row, frog.x, mult)
    : null;
  // 2) Carriles.
  advanceLanes(lanes, mult, dt);
  // 3) Arrastre.
  if (vx !== null) {
    frog.x += vx * dt;
    frog.prevX += vx * dt;
  }
  // 4) Salto.
  frog.hopT = Math.max(0, frog.hopT - dt);
  frog.cooldown = Math.max(0, frog.cooldown - dt);
  let hopped = false;
  if (state.queuedHop && frog.cooldown <= 0) {
    hopped = tryHop(frog, state.queuedHop);
    state.queuedHop = null;
  }
  // 5) Comprobación.
  if (frog.row === HOME_ROW) {
    const idx = homeAt(frog.x);
    if (idx < 0 || state.homes[idx]) {
      result.death = "agua";
      return result;
    }
    // Llegada válida: la fila 0 cuenta como fila nueva solo aquí.
    if (frog.row < state.bestRow) result.newRows = 1;
    frog.x = colCenter(HOME_COLS[idx]);
    result.home = idx;
    return result;
  }
  if (hopped && frog.row < state.bestRow) {
    result.newRows = 1;
    state.bestRow = frog.row;
  }
  if (isRoad(frog.row) && hitsVehicle(lanes, frog)) {
    result.death = "atropellada";
    return result;
  }
  if (isRiver(frog.row)) {
    // Recién saltada a la fila (o dentro de ella), se busca la plataforma en
    // la posición de llegada; si no, vale la resuelta en el paso 1.
    const under = hopped ? platformUnder(lanes, frog.row, frog.x, mult) : vx;
    if (under === null) {
      result.death = "agua";
      return result;
    }
    if (frog.x < BOARD.x || frog.x > BOARD.x + BOARD.w) {
      result.death = "arrastrada";
      return result;
    }
  }
  // 6) Reloj.
  state.timeLeft -= dt;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    result.death = "tiempo";
  }
  return result;
}
