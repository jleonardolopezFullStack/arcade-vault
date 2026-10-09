// Carriles de RANARIA: lógica pura. Sin ctx, sin estado de módulo y sin
// efectos al importar; todo opera sobre los datos que recibe.
import {
  BOARD,
  CELL,
  CROC_FROM_LEVEL,
  CROC_ROW,
  DIVE_CYCLE,
  DIVE_FROM_LEVEL,
  DIVE_PHASE,
  DIVE_ROWS,
  DIVE_SURFACE,
  DIVE_WARN,
  LANES,
  type LaneDef,
  SPEED_MAX_MULT,
  SPEED_STEP,
} from "./constants";
/**
 * Un carril vivo: su definición más el desplazamiento que va avanzando y, en
 * las filas de buceo, el acumulador del ciclo de las tortugas.
 */
export type Lane = Omit<LaneDef, "offset"> & {
  offset: number;
  diveAcc: number;
};
/** Fase de un grupo de tortugas: a flote, avisando o bajo el agua. */
export type DivePhase = "surface" | "warn" | "under";
/** Caja horizontal de un objeto del carril, en píxeles del lienzo. */
export type LaneObject = { x: number; w: number };
/** Copia fresca de la tabla, con los desplazamientos iniciales. */
export function createLanes(): Lane[] {
  return LANES.map((def) => ({ ...def, diveAcc: 0 }));
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
/** ¿Bucean las tortugas de este carril en este nivel? */
function dives(lane: Lane, level: number): boolean {
  return level >= DIVE_FROM_LEVEL && DIVE_ROWS.includes(lane.row);
}
/**
 * Avanza todos los carriles y, desde DIVE_FROM_LEVEL, el ciclo de buceo. Es el
 * **único** sitio que mueve el río, así que lo llaman igual el fotograma de
 * juego y el de la rana muerta —el río no se para porque la rana muera— y la
 * pausa, que corta el bucle, lo congela todo a la vez.
 *
 * El `offset` y `diveAcc` se normalizan a su ciclo para que no crezcan sin fin
 * en una partida larga; la posición y la fase derivadas son las mismas.
 */
export function advanceLanes(lanes: Lane[], level: number, dt: number): void {
  const mult = speedMult(level);
  for (const lane of lanes) {
    lane.offset = mod(lane.offset + laneVx(lane, mult) * dt, ringPx(lane));
    if (dives(lane, level)) lane.diveAcc = mod(lane.diveAcc + dt, DIVE_CYCLE);
  }
}
/**
 * Fase del grupo `i` de un carril. Solo bucean los grupos de índice impar de
 * las filas de DIVE_ROWS, y solo desde DIVE_FROM_LEVEL; el resto flota
 * siempre. Los dos buceadores van desfasados medio ciclo, así que nunca están
 * bajo el agua a la vez. **Un solo sitio calcula la fase**: el dibujo y la
 * colisión no pueden discrepar.
 */
export function divePhase(lane: Lane, i: number, level: number): DivePhase {
  if (lane.kind !== "turtle" || i % 2 === 0 || !dives(lane, level)) {
    return "surface";
  }
  const t = mod(lane.diveAcc + ((i - 1) / 2) * DIVE_PHASE, DIVE_CYCLE);
  if (t < DIVE_SURFACE) return "surface";
  if (t < DIVE_SURFACE + DIVE_WARN) return "warn";
  return "under";
}
/** El carril de una fila, si la fila tiene carril. */
export function laneAt(lanes: readonly Lane[], row: number): Lane | undefined {
  return lanes.find((lane) => lane.row === row);
}
/**
 * ¿Es el objeto `i` de este carril el cocodrilo? Desde CROC_FROM_LEVEL, el
 * objeto 0 de la fila CROC_ROW —un tronco del mismo `len`— pasa a serlo, así
 * que el invariante de envolvimiento del carril no cambia.
 */
export function isCroc(lane: Lane, i: number, level: number): boolean {
  return lane.row === CROC_ROW && i === 0 && level >= CROC_FROM_LEVEL;
}
/**
 * Extensión horizontal de la cabeza del cocodrilo: la celda **delantera**. Se
 * deriva del signo de `dir`, nunca de un índice fijo: si la fila cambiara de
 * sentido, la cabeza seguiría yendo delante.
 */
export function crocHead(lane: Lane, obj: LaneObject): LaneObject {
  const x = lane.dir === 1 ? obj.x + obj.w - CELL : obj.x;
  return { x, w: CELL };
}
/** ¿Cae el centro `x` en la cabeza del cocodrilo de la fila CROC_ROW? */
export function crocHeadAt(
  lanes: readonly Lane[],
  x: number,
  level: number,
): boolean {
  const lane = laneAt(lanes, CROC_ROW);
  if (!lane || !isCroc(lane, 0, level)) return false;
  const head = crocHead(lane, objectsOf(lane)[0]);
  return x >= head.x && x <= head.x + head.w;
}
/**
 * La velocidad de la plataforma cuya extensión contiene el **centro** de la
 * rana, o `null` si debajo solo hay agua. Se llama **antes** de mover los
 * carriles (§2.5): así lo que se ve y lo que cuenta coinciden.
 *
 * Las tortugas en fase `"under"` no son plataforma; en `"warn"` todavía sí.
 * Si un grupo se hunde con la rana encima, el fotograma siguiente no encuentra
 * plataforma y la rana cae «AL AGUA» sin ninguna rama especial.
 *
 * Del cocodrilo solo el lomo es plataforma: la cabeza no, y quien caiga en ella
 * muere «MORDIDA» (lo decide `resolveFrame`, antes que «AL AGUA»).
 */
export function platformUnder(
  lanes: readonly Lane[],
  row: number,
  x: number,
  level: number,
): number | null {
  const lane = laneAt(lanes, row);
  if (!lane || (lane.kind !== "log" && lane.kind !== "turtle")) return null;
  const objects = objectsOf(lane);
  for (let i = 0; i < objects.length; i++) {
    const obj = objects[i];
    if (x < obj.x || x > obj.x + obj.w) continue;
    if (divePhase(lane, i, level) === "under") continue;
    if (isCroc(lane, i, level)) {
      const head = crocHead(lane, obj);
      if (x >= head.x && x <= head.x + head.w) continue;
    }
    return laneVx(lane, speedMult(level));
  }
  return null;
}
