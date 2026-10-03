// Constantes portadas literalmente de
// references/RRO5vePTlqkYrGHjYdtf_started-games/03-tetris/game.js.
// Ningún número de la mecánica cambia: la puntuación, la curva de velocidad y
// los empujes de rotación están calibrados tal cual.
//
// Lo que sí es nuevo aquí es el reparto del lienzo (LAYOUT): el original usaba
// dos canvas y una barra lateral en DOM, y la plataforma solo da uno.

/** Mundo interno del reproductor. El escalado a pantalla es cosa del CSS. */
export const W = 800;
export const H = 600;

/** Tablero: 10 × 20 celdas de 30 px → 300 × 600. */
export const COLS = 10;
export const ROWS = 20;
export const BLOCK = 30;

/**
 * Las ocho piezas, indexadas desde 1; el 0 es «celda vacía».
 *
 * La número 8 —la «tuerca»— no existe en ningún tetris estándar: es un anillo
 * 3×3 con el hueco en el centro, sale una vez de cada ocho y es lo que hace a
 * este juego más difícil que el clásico. **No es un error del porte**; viene
 * así del original y se conserva a propósito.
 */
export const PIECES: readonly (readonly (readonly number[])[] | null)[] = [
  null,
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ], // I
  [
    [2, 2],
    [2, 2],
  ], // O
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ], // T
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ], // S
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ], // Z
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ], // J
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ], // L
  [
    [8, 8, 8],
    [8, 0, 8],
    [8, 8, 8],
  ], // N — tuerca
];

/** Cuántos tipos puede devolver `randomPiece()`: 1..8. */
export const PIECE_TYPES = 8;

/** Puntos por 0/1/2/3/4 líneas limpiadas de golpe, multiplicados por el nivel. */
export const LINE_SCORES = [0, 100, 300, 500, 800] as const;

/** Caída dura: 2 por celda recorrida. Caída blanda: 1 por fila. */
export const HARD_DROP_POINTS = 2;
export const SOFT_DROP_POINTS = 1;

/** Empujes de pared al rotar; se aplica el primero que no colisione. */
export const WALL_KICKS = [0, -1, 1, -2, 2] as const;

// ── Curva de velocidad ───────────────────────────────────────────────────────
// Nivel y cadencia salen de las líneas limpiadas. El original lo calcula con
// estas tres constantes; aquí van con nombre para poder retocarlas de un sitio.

export const LINES_PER_LEVEL = 10;
export const DROP_BASE_MS = 1000;
export const DROP_STEP_MS = 90;
export const DROP_MIN_MS = 100;

/** `Math.floor(lines / 10) + 1`, como el original. */
export function levelFor(lines: number): number {
  return Math.floor(lines / LINES_PER_LEVEL) + 1;
}

/** `Math.max(100, 1000 - (level - 1) * 90)` en milisegundos. */
export function dropIntervalMs(level: number): number {
  return Math.max(DROP_MIN_MS, DROP_BASE_MS - (level - 1) * DROP_STEP_MS);
}

/**
 * dt máximo en segundos. El original trabaja en milisegundos y sin tope; aquí
 * se capa para que un salto de pestaña no vacíe media partida de golpe.
 */
export const MAX_DT = 0.05;

// ── Reparto del lienzo ───────────────────────────────────────────────────────
// Tres columnas dentro de los 800×600: el tablero conserva sus 300×600 en el
// centro, y las dos bandas que sobran alojan lo que el original resolvía con
// DOM. Van como constantes nombradas, no como números sueltos en el dibujo.

export const LAYOUT = {
  /** Puntuación, líneas y nivel, apilados a la izquierda. */
  hud: { x: 20, y: 60, width: 210, lineHeight: 64 },
  /** Los 300×600 del original, intactos. */
  board: { x: 250, y: 0 },
  /** Rótulo y rejilla 4×4 de la pieza siguiente, a la derecha. */
  next: { x: 570, y: 60, width: 210, cells: 4, block: 30 },
} as const;

/** Rejilla de la previsualización, centrada en su columna. */
export const NEXT_GRID_X =
  LAYOUT.next.x +
  (LAYOUT.next.width - LAYOUT.next.cells * LAYOUT.next.block) / 2;
export const NEXT_GRID_Y = LAYOUT.next.y + 34;

// ── Paleta y tipografías ─────────────────────────────────────────────────────
// Repintado del original con los tokens del Vault. Los valores van literales:
// `ctx` no entiende variables CSS, y el original leía la rejilla con
// getComputedStyle en cada fotograma, que es caro.

/**
 * Ocho piezas sobre cuatro acentos: cada token da un tono pleno y otro
 * atenuado al 55 %, y la tuerca va en --ink-dim. Se respeta la familia de
 * color del original —la T morada pasa a magenta, la Z roja a magenta
 * atenuado, la J azul pálido a cian atenuado, la L naranja a amarillo
 * atenuado— para que las piezas sigan siendo reconocibles.
 */
export const PIECE_COLORS = [
  null,
  "#00f5ff", // 1 · I — --cyan
  "#f5ff00", // 2 · O — --yellow
  "#ff006e", // 3 · T — --magenta
  "#00ff88", // 4 · S — --green
  "#8c003c", // 5 · Z — --magenta al 55 %
  "#00878c", // 6 · J — --cyan al 55 %
  "#878c00", // 7 · L — --yellow al 55 %
  "#8a8fb5", // 8 · N tuerca — --ink-dim
] as const;

export const PALETTE = {
  bg: "#0a0a0f", // --bg
  grid: "rgba(0, 245, 255, 0.18)", // --line
  hud: "#e6e9ff", // --ink
  hudLabel: "#4a4f70", // --ink-faint
  overlay: "rgba(10, 10, 15, 0.72)", // --bg con alfa, para el fin de partida
  gameOver: "#ff006e", // --magenta
} as const;

/** Brillo superior de cada bloque, 4 px, como en el original. */
export const BLOCK_HIGHLIGHT = "rgba(255, 255, 255, 0.12)";
export const BLOCK_HIGHLIGHT_H = 4;

/** Opacidad de la pieza fantasma. */
export const GHOST_ALPHA = 0.2;

/** Mismas familias que --mono y --pixel de globals.css (cargadas por next/font). */
export const FONT_MONO = '"JetBrains Mono", "Courier New", monospace';
export const FONT_PIXEL = '"Press Start 2P", system-ui, monospace';
