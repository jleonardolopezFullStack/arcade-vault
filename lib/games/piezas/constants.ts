// Constantes portadas literalmente de
// references/RRO5vePTlqkYrGHjYdtf_started-games/03-tetris/game.js.
// Ningún número de la mecánica cambia: la puntuación, la curva de velocidad y
// los empujes de rotación están calibrados tal cual.
//
// Lo que sí es nuevo aquí es el reparto del lienzo (LAYOUT): el original usaba
// dos canvas y una barra lateral en DOM, y la plataforma solo da uno.
import type { Palettes } from "../types";

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

// ── Paletas y tipografías ────────────────────────────────────────────────────
// Seis paletas, `PALETTES[skin][mode]`, todas con las mismas claves. Los
// valores van literales: `ctx` no entiende variables CSS, y el original leía
// la rejilla con getComputedStyle en cada fotograma, que es caro. Los alfas
// van ya mezclados sobre el fondo, salvo los que de verdad son un velo
// (`overlay`, `highlight`), en hex de ocho cifras. Contrastes medidos en
// specs/skins/README.md.

/**
 * Marca interior de un bloque. Solo la usa `retro`: con dos tonos de LCD no
 * hay ocho colores, así que las piezas se distinguen por su dibujo, como en
 * el tetris de Game Boy.
 *
 * 0 liso · 1 agujero central · 2 hueco con borde · 3 hueco con punto.
 */
export type BlockMark = 0 | 1 | 2 | 3;

export type Palette = {
  bg: string;
  /** Rejilla interior, marco del tablero y caja de la siguiente pieza. */
  grid: string;
  hud: string;
  hudLabel: string;
  /** Velo del fin de partida, con alfa. */
  overlay: string;
  gameOver: string;
  /** Brillo superior de cada bloque, 4 px, con alfa. */
  highlight: string;
  /** Las ocho piezas, indexadas desde 1; el 0 es «celda vacía». */
  pieces: readonly [null, ...string[]];
  /** Marca de cada pieza, con el mismo índice que `pieces`. */
  marks: readonly BlockMark[];
};

const SIN_MARCAS: readonly BlockMark[] = [0, 0, 0, 0, 0, 0, 0, 0, 0];

/**
 * Las marcas de `retro`: tono claro y tono oscuro se alternan, y cada par
 * comparte marca. Ninguna pieza repite tono y marca a la vez.
 */
const MARCAS_LCD: readonly BlockMark[] = [0, 0, 0, 1, 1, 2, 2, 3, 3];

/**
 * El look del Vault (SPEC 07): ocho piezas sobre cuatro acentos, cada token
 * con un tono pleno y otro atenuado, y la tuerca en --ink-dim. Se respeta la
 * familia de color del original —la T morada pasa a magenta, la Z roja a
 * magenta atenuado, la J azul pálido a cian atenuado, la L naranja a
 * amarillo atenuado— para que las piezas sigan siendo reconocibles.
 */
const NEON_DARK: Palette = {
  bg: "#0a0a0f", // --bg
  grid: "#08343a", // --line (cian al 18 %) mezclado sobre --bg
  hud: "#e6e9ff", // --ink
  // Era --ink-faint (#4a4f70): 2,49:1, por debajo del 4,5 de un rótulo.
  hudLabel: "#8a8fb5", // --ink-dim
  overlay: "#0a0a0fb8", // --bg al 72 %
  gameOver: "#ff006e", // --magenta
  highlight: "#ffffff1f", // blanco al 12 %, como el original
  pieces: [
    null,
    "#00f5ff", // 1 · I — --cyan
    "#f5ff00", // 2 · O — --yellow
    "#ff006e", // 3 · T — --magenta
    "#00ff88", // 4 · S — --green
    // Era #8c003c (magenta al 55 %): 2,05:1 sobre --bg, no llegaba a 3.
    "#bd0052", // 5 · Z — --magenta al 74 %
    "#00878c", // 6 · J — --cyan al 55 %
    "#878c00", // 7 · L — --yellow al 55 %
    "#8a8fb5", // 8 · N tuerca — --ink-dim
  ],
  marks: SIN_MARCAS,
};

export const PALETTES: Palettes<Palette> = {
  // Los colores y los dos temas de 03-tetris: PIECE_COLORS de game.js y las
  // variables de style.css (--canvas-bg, --grid-line, --text, --label).
  clasico: {
    dark: {
      bg: "#1a1a25", // --canvas-bg del original
      grid: "#22222e", // --grid-line del original
      hud: "#e0e0e0", // --text del original
      // El --label del original (#555570) da 2,4:1; se aclara en su tono.
      hudLabel: "#8a8aa8",
      overlay: "#0a0a14bf", // --overlay-bg del original
      gameOver: "#e57373", // el rojo del «GAME OVER» del original
      highlight: "#ffffff1f",
      pieces: [
        null,
        "#4dd0e1", // I — cian
        "#ffd54f", // O — amarillo
        "#ba68c8", // T — morado
        "#81c784", // S — verde
        "#e57373", // Z — rojo
        "#90caf9", // J — azul pálido
        "#ffb74d", // L — naranja
        "#9e9e9e", // N — tuerca, gris metálico
      ],
      marks: SIN_MARCAS,
    },
    // El tema claro del original, con las piezas oscurecidas en su tono: los
    // pasteles de game.js no llegan a 3:1 sobre #e4e4f0.
    light: {
      bg: "#e4e4f0", // --canvas-bg claro del original
      grid: "#c8c8dc", // --grid-line claro del original
      hud: "#1a1a2e", // --text claro del original
      hudLabel: "#6060a0", // --label claro del original
      overlay: "#d2d2e6d9", // --overlay-bg claro del original
      gameOver: "#b3261e",
      highlight: "#ffffff2e",
      pieces: [
        null,
        "#00838f", // I — cian
        "#8d6e00", // O — amarillo
        "#8e24aa", // T — morado
        "#2e7d32", // S — verde
        "#c62828", // Z — rojo
        "#1565c0", // J — azul
        "#b85600", // L — naranja
        "#616161", // N — tuerca
      ],
      marks: SIN_MARCAS,
    },
  },
  neon: {
    dark: NEON_DARK,
    // Los mismos ocho tonos, bajados de luz sobre el --bg claro del Vault.
    light: {
      bg: "#eef0f7", // --bg claro
      grid: "#abc9d1", // --line claro mezclado sobre --bg
      hud: "#11131f", // --ink claro
      hudLabel: "#454a6b", // --ink-dim claro
      overlay: "#eef0f7c7",
      gameOver: "#bc0057", // --magenta claro
      highlight: "#ffffff38",
      pieces: [
        null,
        "#00737d", // I — cian
        "#6e6900", // O — amarillo
        "#bc0057", // T — --magenta claro
        "#00804a", // S — verde
        "#7a0035", // Z — magenta hondo
        "#004d54", // J — cian hondo
        "#4a4700", // L — amarillo hondo
        "#454a6b", // N — --ink-dim claro
      ],
      marks: SIN_MARCAS,
    },
  },
  // LCD de Game Boy: fondo y dos tonos de verde guisante, sin brillo. Las
  // piezas se distinguen por tono y por marca (ver MARCAS_LCD).
  retro: {
    dark: {
      bg: "#0b130b",
      grid: "#1c2a17",
      hud: "#9bbc0f",
      hudLabel: "#7fa02a",
      overlay: "#0b130bc7",
      gameOver: "#9bbc0f",
      highlight: "#00000000",
      pieces: [
        null,
        "#9bbc0f",
        "#5f8a2a",
        "#9bbc0f",
        "#5f8a2a",
        "#9bbc0f",
        "#5f8a2a",
        "#9bbc0f",
        "#5f8a2a",
      ],
      marks: MARCAS_LCD,
    },
    light: {
      bg: "#c7d4a0",
      grid: "#adbb85",
      hud: "#0f380f",
      hudLabel: "#306230",
      overlay: "#c7d4a0d9",
      gameOver: "#0f380f",
      highlight: "#00000000",
      pieces: [
        null,
        "#0f380f",
        "#306230",
        "#0f380f",
        "#306230",
        "#0f380f",
        "#306230",
        "#0f380f",
        "#306230",
      ],
      marks: MARCAS_LCD,
    },
  },
};

/** Alto del brillo superior de cada bloque, como en el original. */
export const BLOCK_HIGHLIGHT_H = 4;

/** Opacidad de la pieza fantasma. */
export const GHOST_ALPHA = 0.2;

/** Mismas familias que --mono y --pixel de globals.css (cargadas por next/font). */
export const FONT_MONO = '"JetBrains Mono", "Courier New", monospace';
export const FONT_PIXEL = '"Press Start 2P", system-ui, monospace';
