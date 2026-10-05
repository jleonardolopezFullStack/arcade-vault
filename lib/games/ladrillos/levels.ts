// Los cinco niveles de
// references/RRO5vePTlqkYrGHjYdtf_started-games/04-arkanoid/levels.js.
//
// Se portan como **generadores**, no como listas expandidas: el original los
// construye con bucles, y volcar el resultado perdería la intención de cada
// trazado —se vería una lista de 60 coordenadas en vez de «damero»—.
import { BLOCK_COLS, BLOCK_ROWS, type BlockColor } from "./constants";
/** Una celda ocupada de la rejilla. La conversión a píxeles la hace el motor. */
export type BlockSpec = {
  col: number;
  row: number;
  color: BlockColor;
};
export type Level = {
  /** Multiplica la velocidad base de la pelota. */
  speed: number;
  blocks: readonly BlockSpec[];
};
// Repartos de color por fila, literales del original.
const COLORES_1: readonly BlockColor[] = [
  "red",
  "yellow",
  "cyan",
  "magenta",
  "hotpink",
  "green",
];
const COLORES_2: readonly BlockColor[] = [
  "gray",
  "cyan",
  "hotpink",
  "yellow",
  "magenta",
  "green",
];
const COLORES_4: readonly BlockColor[] = [
  "cyan",
  "magenta",
  "green",
  "yellow",
  "hotpink",
  "red",
];
/** Nivel 1 — muro lleno, un color por fila. */
function muroLleno(): BlockSpec[] {
  const blocks: BlockSpec[] = [];
  for (let row = 0; row < BLOCK_ROWS; row++) {
    for (let col = 0; col < BLOCK_COLS; col++) {
      blocks.push({ col, row, color: COLORES_1[row] });
    }
  }
  return blocks;
}
/** Nivel 2 — pirámide invertida: cada fila es más ancha que la de arriba. */
function piramide(): BlockSpec[] {
  const desde = [4, 3, 2, 1, 0, 0];
  const hasta = [5, 6, 7, 8, 9, 9];
  const blocks: BlockSpec[] = [];
  for (let row = 0; row < BLOCK_ROWS; row++) {
    for (let col = desde[row]; col <= hasta[row]; col++) {
      blocks.push({ col, row, color: COLORES_2[row] });
    }
  }
  return blocks;
}
/** Nivel 3 — damero: solo las celdas de paridad par. */
function damero(): BlockSpec[] {
  const blocks: BlockSpec[] = [];
  for (let row = 0; row < BLOCK_ROWS; row++) {
    for (let col = 0; col < BLOCK_COLS; col++) {
      if ((col + row) % 2 === 0) {
        blocks.push({ col, row, color: row < 3 ? "yellow" : "magenta" });
      }
    }
  }
  return blocks;
}
/** Nivel 4 — muro lleno con huecos distintos en cada fila. */
function conHuecos(): BlockSpec[] {
  const huecos = [
    [2, 5, 8],
    [0, 4, 7, 9],
    [1, 3, 6],
    [2, 5, 8, 9],
    [0, 4, 7],
    [1, 3, 6, 9],
  ];
  const blocks: BlockSpec[] = [];
  for (let row = 0; row < BLOCK_ROWS; row++) {
    for (let col = 0; col < BLOCK_COLS; col++) {
      if (!huecos[row].includes(col)) {
        blocks.push({ col, row, color: COLORES_4[row] });
      }
    }
  }
  return blocks;
}
/** Nivel 5 — marco exterior más una cruz; la cruz va en otro color. */
function marcoConCruz(): BlockSpec[] {
  const blocks: BlockSpec[] = [];
  for (let row = 0; row < BLOCK_ROWS; row++) {
    for (let col = 0; col < BLOCK_COLS; col++) {
      const esMarco =
        col === 0 ||
        col === BLOCK_COLS - 1 ||
        row === 0 ||
        row === BLOCK_ROWS - 1;
      const esCruz = col === 4 || row === 2;
      if (esMarco || esCruz) {
        blocks.push({
          col,
          row,
          color: esCruz && !esMarco ? "hotpink" : "cyan",
        });
      }
    }
  }
  return blocks;
}
/**
 * Los cinco niveles, en orden. Las velocidades son las del original y suben
 * aproximadamente un 10 % por nivel.
 */
export const LEVELS: readonly Level[] = [
  { speed: 1.0, blocks: muroLleno() },
  { speed: 1.1, blocks: piramide() },
  { speed: 1.21, blocks: damero() },
  { speed: 1.33, blocks: conHuecos() },
  { speed: 1.46, blocks: marcoConCruz() },
];
export const LAST_LEVEL = LEVELS.length;
