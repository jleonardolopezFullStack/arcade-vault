// Traducción literal de la lógica de tablero de
// references/RRO5vePTlqkYrGHjYdtf_started-games/03-tetris/game.js.
//
// Lo único que cambia respecto al original es de dónde salen los datos: allí
// `board` y `current` eran variables globales que estas funciones leían del
// ámbito; aquí se reciben como argumentos. Ni una regla del juego se toca.
//
// Sin estado de módulo, sin `ctx` y sin efectos al importar: dos partidas
// montadas a la vez no se pisan.
import { COLS, PIECE_TYPES, PIECES, ROWS, WALL_KICKS } from "./constants";
/** 0 es celda vacía; 1..8 es el índice de color de la pieza que la ocupa. */
export type Cell = number;
export type Board = Cell[][];
export type Shape = Cell[][];
export type Piece = {
  type: number;
  shape: Shape;
  x: number;
  y: number;
};
/** Tablero vacío de ROWS × COLS. */
export function createBoard(): Board {
  return Array.from({ length: ROWS }, () => new Array<Cell>(COLS).fill(0));
}
/**
 * Una pieza al azar de los ocho tipos, centrada arriba.
 *
 * No es pura —usa `Math.random()`—, igual que en el original. La forma se
 * copia en profundidad porque `tryRotate` devuelve matrices nuevas y las de
 * `PIECES` son la plantilla compartida: mutarlas estropearía el juego entero.
 */
export function randomPiece(): Piece {
  const type = Math.floor(Math.random() * PIECE_TYPES) + 1;
  const template = PIECES[type];
  if (!template) throw new Error(`PIEZAS: tipo desconocido ${type}`);
  const shape: Shape = template.map((row) => [...row]);
  return {
    type,
    shape,
    x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
    y: 0,
  };
}
/**
 * ¿Choca esta forma colocada en (ox, oy)?
 *
 * Las filas por encima del tablero (`ny < 0`) no chocan: una pieza puede
 * asomar antes de entrar del todo.
 */
export function collide(
  board: Board,
  shape: Shape,
  ox: number,
  oy: number,
): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}
/** Giro horario: transponer y voltear. Devuelve una matriz nueva. */
export function rotateCW(shape: Shape): Shape {
  const rows = shape.length;
  const cols = shape[0].length;
  const result: Shape = Array.from({ length: cols }, () =>
    new Array<Cell>(rows).fill(0),
  );
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      result[c][rows - 1 - r] = shape[r][c];
    }
  }
  return result;
}
/**
 * Rota aplicando el primer empuje de pared que no choque.
 *
 * Devuelve una pieza nueva si alguno cuela, o **la misma instancia** si
 * ninguno: así quien llama puede comparar por identidad para saber si giró.
 */
export function tryRotate(board: Board, piece: Piece): Piece {
  const rotated = rotateCW(piece.shape);
  for (const kick of WALL_KICKS) {
    if (!collide(board, rotated, piece.x + kick, piece.y)) {
      return { ...piece, shape: rotated, x: piece.x + kick };
    }
  }
  return piece;
}
/** Fija la pieza en el tablero. **Muta** el tablero que recibe. */
export function merge(board: Board, piece: Piece): void {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      const value = piece.shape[r][c];
      if (!value) continue;
      const ny = piece.y + r;
      const nx = piece.x + c;
      // Una pieza bloqueada asomando por arriba no escribe fuera del tablero.
      if (ny < 0 || ny >= ROWS || nx < 0 || nx >= COLS) continue;
      board[ny][nx] = value;
    }
  }
}
/**
 * Retira las filas completas y devuelve cuántas eran. **Muta** el tablero.
 *
 * Recorre de abajo arriba y, al quitar una fila, repite el mismo índice —el
 * `r++` del original compensa el `r--` del bucle—, porque lo que había encima
 * ha bajado una posición.
 */
export function clearLines(board: Board): number {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every((v) => v !== 0)) {
      board.splice(r, 1);
      board.unshift(new Array<Cell>(COLS).fill(0));
      cleared++;
      r++;
    }
  }
  return cleared;
}
/** Fila en la que caería la pieza si se soltara ahora: la pieza fantasma. */
export function ghostY(board: Board, piece: Piece): number {
  let gy = piece.y;
  while (!collide(board, piece.shape, piece.x, gy + 1)) gy++;
  return gy;
}
