// Carriles de RANARIA: lógica pura. Sin ctx, sin estado de módulo y sin
// efectos al importar; todo opera sobre los datos que recibe.
import {
  BOARD,
  CELL,
  LANES,
  type LaneDef,
  SPEED_MAX_MULT,
  SPEED_STEP,
} from "./constants";
/** Un carril vivo: su definición más el desplazamiento que va avanzando. */
export type Lane = Omit<LaneDef, "offset"> & { offset: number };
/** Caja horizontal de un objeto del carril, en píxeles del lienzo. */
export type LaneObject = { x: number; w: number };
/** Copia fresca de la tabla, con los desplazamientos iniciales. */
export function createLanes(): Lane[] {
  return LANES.map((def) => ({ ...def }));
}
/** Multiplicador de velocidad del nivel, con tope en SPEED_MAX_MULT. */
export function speedMult(level: number): number {
  return Math.min(1 + SPEED_STEP * (level - 1), SPEED_MAX_MULT);
}
/** Módulo siempre positivo: el `%` de JS conserva el signo del dividendo. */
function mod(a: number, n: number): number {
  return ((a % n) + n) % n;
}
/** Longitud de la cinta circular del carril, en píxeles. */
function ringPx(lane: Lane): number {
  return lane.count * lane.gap * CELL;
}
/**
 * Las cajas de los objetos del carril, derivadas del `offset`:
 * x = BOARD.x + mod(offset + i × gap × CELL, ring × CELL) − len × CELL.
 */
export function objectsOf(lane: Lane): LaneObject[] {
  const ring = ringPx(lane);
  const w = lane.len * CELL;
  const objects: LaneObject[] = [];
  for (let i = 0; i < lane.count; i++) {
    const x = BOARD.x + mod(lane.offset + i * lane.gap * CELL, ring) - w;
    objects.push({ x, w });
  }
  return objects;
}
/** Velocidad efectiva del carril en px/s, con signo. */
export function laneVx(lane: Lane, mult: number): number {
  return lane.dir * lane.speed * mult;
}
/**
 * Avanza todos los carriles. El `offset` se normaliza a la cinta para que no
 * crezca sin fin en una partida larga; la posición derivada es la misma.
 */
export function advanceLanes(lanes: Lane[], mult: number, dt: number): void {
  for (const lane of lanes) {
    lane.offset = mod(lane.offset + laneVx(lane, mult) * dt, ringPx(lane));
  }
}
/** El carril de una fila, si la fila tiene carril. */
export function laneAt(lanes: readonly Lane[], row: number): Lane | undefined {
  return lanes.find((lane) => lane.row === row);
}
/**
 * La velocidad de la plataforma cuya extensión contiene el **centro** de la
 * rana, o `null` si debajo solo hay agua. Se llama **antes** de mover los
 * carriles (§2.5): así lo que se ve y lo que cuenta coinciden.
 */
export function platformUnder(
  lanes: readonly Lane[],
  row: number,
  x: number,
  mult: number,
): number | null {
  const lane = laneAt(lanes, row);
  if (!lane || (lane.kind !== "log" && lane.kind !== "turtle")) return null;
  for (const obj of objectsOf(lane)) {
    if (x >= obj.x && x <= obj.x + obj.w) return laneVx(lane, mult);
  }
  return null;
}
