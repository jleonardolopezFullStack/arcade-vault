// Lógica de rejilla de SERPENTINA: reglas del tablero, sin dibujo y sin bucle.
//
// No hay original del que traducirla —no existe un snake en references/—, así
// que estas funciones son la mecánica misma. Todas reciben los datos que
// necesitan como argumentos: sin estado de módulo, sin `ctx` y sin efectos al
// importar, para que dos partidas montadas a la vez no se pisen.
import {
  COLS,
  FRUIT_SHAPES,
  FRUITS_PER_LEVEL,
  RARE_CHANCE,
  RARE_TTL,
  ROWS,
  START_COL,
  START_LENGTH,
  START_ROW,
  TICK_BASE,
  TICK_MIN,
  TICK_STEP,
  type FruitShape,
} from "./constants";
/** Una casilla de la rejilla. Nunca píxeles: eso lo traduce `draw.ts`. */
export type Cell = { col: number; row: number };
/** Dirección de avance en celdas por paso. `null` = parada. */
export type Dir = { dc: number; dr: number };
export type Fruit = {
  col: number;
  row: number;
  shape: FruitShape;
  rare: boolean;
  /** Segundos que le quedan. Solo cuenta si `rare`. */
  ttl: number;
};
export const UP: Dir = { dc: 0, dr: -1 };
export const DOWN: Dir = { dc: 0, dr: 1 };
export const LEFT: Dir = { dc: -1, dr: 0 };
export const RIGHT: Dir = { dc: 1, dr: 0 };
/** Segundos por paso según el nivel. El suelo lo pone `TICK_MIN`. */
export function tickFor(level: number): number {
  return Math.max(TICK_MIN, TICK_BASE - (level - 1) * TICK_STEP);
}
/** Nivel a partir de las frutas comidas. Empieza en 1, no en 0. */
export function levelFor(eaten: number): number {
  return Math.floor(eaten / FRUITS_PER_LEVEL) + 1;
}
/**
 * La serpiente de salida: longitud `START_LENGTH` en el centro, **la cabeza en
 * el índice 0** y el cuerpo extendido hacia la izquierda.
 *
 * Nace sin dirección —quien la llama pone `dir = null`—, así que el cuerpo
 * hacia la izquierda no condiciona nada: el primer movimiento es el que elija
 * el jugador, incluido subir o bajar.
 */
export function startSnake(): Cell[] {
  return Array.from({ length: START_LENGTH }, (_, i) => ({
    col: START_COL - i,
    row: START_ROW,
  }));
}
export function sameCell(a: Cell, b: Cell): boolean {
  return a.col === b.col && a.row === b.row;
}
/** La celda a la que avanzaría la cabeza. No comprueba nada: solo suma. */
export function nextHead(head: Cell, dir: Dir): Cell {
  return { col: head.col + dir.dc, row: head.row + dir.dr };
}
/** ¿Se sale de la rejilla? Las paredes matan: no hay envolvimiento. */
export function isWall(cell: Cell): boolean {
  return cell.col < 0 || cell.col >= COLS || cell.row < 0 || cell.row >= ROWS;
}
/**
 * ¿Se muerde a sí misma al pisar `cell`?
 *
 * `tailVacates` es la sutileza del snake de rejilla: en un paso que **no**
 * alarga, la cola abandona su casilla en el mismo instante en que la cabeza
 * entra en la nueva, así que meterse donde estaba la punta de la cola es
 * legal. En un paso que alarga, la cola se queda donde está y sí mata.
 * Pasarlo siempre a `false` haría morir al jugador por una celda que ve
 * vaciarse delante de él.
 */
export function hitsSelf(
  snake: readonly Cell[],
  cell: Cell,
  tailVacates: boolean,
): boolean {
  const last = tailVacates ? snake.length - 1 : snake.length;
  for (let i = 0; i < last; i++) {
    if (sameCell(snake[i], cell)) return true;
  }
  return false;
}
/** ¿Son opuestas? Dos direcciones cuya suma es el vector cero. */
export function isOpposite(a: Dir, b: Dir): boolean {
  return a.dc + b.dc === 0 && a.dr + b.dr === 0;
}
export function isSameDir(a: Dir, b: Dir): boolean {
  return a.dc === b.dc && a.dr === b.dr;
}
/**
 * ¿Se acepta girar a `next` viniendo de `from`?
 *
 * **`from` tiene que ser la dirección del último paso dado, nunca la última
 * tecla encolada.** Es el fallo clásico del snake con búfer de entrada: si se
 * valida contra lo encolado, pulsar `arriba` y `abajo` dentro del mismo tick
 * cuela las dos y la serpiente se invierte sobre su propio cuello, matando al
 * jugador por un movimiento que nunca vio en pantalla.
 *
 * Con la serpiente parada (`from === null`) vale cualquier dirección. La misma
 * dirección en la que ya se va también se descarta: no es un giro, y encolarla
 * gastaría un hueco de los dos que hay.
 */
export function isValidTurn(from: Dir | null, next: Dir): boolean {
  if (from === null) return true;
  return !isOpposite(from, next) && !isSameDir(from, next);
}
/**
 * Las celdas que la serpiente no ocupa.
 *
 * Se construye la lista entera —988 celdas, es barato— en vez de sortear al
 * azar y reintentar si está ocupada: ese reintento funciona con la serpiente
 * corta y degenera cuando ocupa media rejilla, y con el tablero lleno no
 * termina nunca.
 */
export function freeCells(snake: readonly Cell[]): Cell[] {
  const taken = new Set<number>();
  for (const cell of snake) taken.add(cell.row * COLS + cell.col);
  const free: Cell[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (!taken.has(row * COLS + col)) free.push({ col, row });
    }
  }
  return free;
}
/**
 * Una fruta nueva en una celda libre, o `null` si no queda ninguna —el tablero
 * lleno, que quien llama trata como victoria—.
 *
 * No es pura: usa `Math.random()`, igual que `randomPiece()` en CAÍDA. La
 * silueta se sortea entre las cinco y **no afecta al valor**; lo que decide
 * puntos y crecimiento es `rare`. `forceCommon` sirve para la rara que caduca:
 * su relevo nunca vuelve a salir rara.
 */
export function spawnFruit(
  snake: readonly Cell[],
  forceCommon = false,
): Fruit | null {
  const free = freeCells(snake);
  if (free.length === 0) return null;
  const cell = free[Math.floor(Math.random() * free.length)];
  const shape = FRUIT_SHAPES[Math.floor(Math.random() * FRUIT_SHAPES.length)];
  const rare = !forceCommon && Math.random() < RARE_CHANCE;
  return {
    col: cell.col,
    row: cell.row,
    shape,
    rare,
    ttl: rare ? RARE_TTL : 0,
  };
}
