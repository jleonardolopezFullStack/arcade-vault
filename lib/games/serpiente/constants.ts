// Constantes de SERPENTINA. **No hay original del que portarlas**: en
// references/RRO5vePTlqkYrGHjYdtf_started-games/ no hay snake, así que estos
// números son el diseño y no la copia de nadie. Ajustar la dificultad es
// cambiarlos aquí; no hay ninguno suelto en el resto del motor.
import type { Palettes } from "../types";
/** Mundo interno. El escalado a pantalla es cosa del CSS, no de las coordenadas. */
export const W = 800;
export const H = 600;
// ── Reparto del lienzo ───────────────────────────────────────────────────────
// Banda de HUD arriba y tablero debajo, con 20 px de margen a cada lado y 20 px
// entre ambos. El margen no es decorativo: el marco del tablero es el límite
// que mata, y pegado al borde redondeado de .crt-screen se lo come el bisel.
/** Banda superior con puntuación, nivel y vidas. */
export const HUD_H = 40;
export const CELL = 20;
export const COLS = 38;
export const ROWS = 26;
/** Rectángulo del tablero en píxeles, derivado de la rejilla. */
export const BOARD = {
  x: (W - COLS * CELL) / 2,
  y: HUD_H + 20,
  w: COLS * CELL,
  h: ROWS * CELL,
} as const;
/** Celda de salida: el centro de la rejilla, al empezar y al reaparecer. */
export const START_COL = Math.floor(COLS / 2);
export const START_ROW = Math.floor(ROWS / 2);
// ── Partida ──────────────────────────────────────────────────────────────────
export const START_LENGTH = 3;
export const START_LIVES = 3;
/** Segundos que la serpiente espera quieta tras perder una vida. */
export const RESPAWN_DELAY = 1.5;
/**
 * dt máximo en segundos.
 *
 * **Tiene que seguir siendo menor que `TICK_MIN`.** El bucle acumula el dt y
 * avanza un paso cada vez que el acumulador llena un tick; con el dt capado
 * por debajo del tick más corto, nunca puede avanzar dos pasos en el mismo
 * fotograma, así que volver a una pestaña dormida no teletransporta la cabeza
 * dentro de su propia cola. Si alguien baja TICK_MIN por debajo de este valor,
 * el invariante se rompe sin que nada falle.
 */
export const MAX_DT = 0.05;
// ── Velocidad ────────────────────────────────────────────────────────────────
/** Segundos por paso en el nivel 1. */
export const TICK_BASE = 0.14;
/** Lo que baja el tick por cada nivel. */
export const TICK_STEP = 0.008;
/** Suelo del tick, alcanzado en el nivel 11. */
export const TICK_MIN = 0.06;
/** Frutas que hacen subir un nivel: level = floor(frutas / 5) + 1. */
export const FRUITS_PER_LEVEL = 5;
// ── Frutas ───────────────────────────────────────────────────────────────────
export const POINTS_COMMON = 10;
export const POINTS_RARE = 50;
export const GROW_COMMON = 1;
export const GROW_RARE = 3;
/** Probabilidad de que la fruta que aparece sea la rara. */
export const RARE_CHANCE = 1 / 6;
/** Segundos que la rara aguanta antes de convertirse en una común. */
export const RARE_TTL = 8;
/** Radio de la fruta: 14 px de diámetro centrados en una celda de 20. */
export const FRUIT_R = 7;
/**
 * Las cinco siluetas, todas de primitivas: no hay sprites y no se carga nada.
 *
 * **La forma no lleva información.** Se sortea en cada aparición y solo aporta
 * variedad; el valor lo dice el color —magenta la común, amarillo la rara—.
 * Separar los dos ejes es lo que mantiene el juego legible a 14 px: distinguir
 * cinco siluetas a ese tamaño sería una trampa, distinguir dos colores no.
 */
export type FruitShape = "manzana" | "racimo" | "baya" | "rodaja" | "estrella";
export const FRUIT_SHAPES: readonly FruitShape[] = [
  "manzana", // círculo con tallo y hoja
  "racimo", // tres círculos de r × 0,5 en triángulo
  "baya", // óvalo alargado en vertical
  "rodaja", // semicírculo con tres gajos marcados
  "estrella", // cinco puntas
] as const;
// ── Entrada ──────────────────────────────────────────────────────────────────
/**
 * Giros encolados como máximo.
 *
 * A 60 ms por paso, dos giros humanos caen dentro del mismo tick y sin cola el
 * primero se perdería. El tope evita lo contrario: que una ráfaga de teclas
 * programe la partida varios pasos por delante.
 */
export const TURN_QUEUE_MAX = 2;
// ── Paletas y tipografías del canvas ──────────────────────────────────────────
// Seis paletas, `PALETTES[skin][mode]`, todas con las mismas claves. Los
// valores van literales: `ctx` no entiende variables CSS y leerlas con
// getComputedStyle en cada fotograma sería caro. Los alfas del original van
// ya mezclados sobre su fondo real, salvo el velo `overlay`, en hex de ocho
// cifras. Contrastes medidos en specs/skins/README.md.
//
// **Invariante de todas las skins**: la forma de la fruta no lleva
// información y el color dice su valor. `fruit` y `fruitRare` difieren al
// menos 1,5:1 en luminancia, también en `retro`, donde no hay dos tonos de
// color; la rara lleva además su anillo de caducidad.

export type Palette = {
  bg: string;
  boardFill: string;
  /** El marco que mata: un objeto de juego, ≥ 3:1 sobre `boardFill`. */
  frame: string;
  grid: string;
  snake: string;
  /** Hacia donde se degradan los últimos segmentos. */
  snakeTail: string;
  head: string;
  eye: string;
  fruit: string;
  fruitRare: string;
  hud: string;
  hudLabel: string;
  /** Velo de los carteles, con alfa. */
  overlay: string;
  gameOver: string;
  win: string;
  /** Halo (`shadowBlur`) en cuerpo y fruta. Solo el neón brilla. */
  glow: boolean;
};

/** El look del Vault (SPEC 09). */
const NEON_DARK: Palette = {
  bg: "#0a0a0f", // --bg
  boardFill: "#0a1615", // --green al 5 % mezclado sobre --bg
  // Era --green al 35 % (#076039): 2,41:1 sobre el tablero, y es la pared
  // que mata. Al 45 % llega a 3,32.
  frame: "#067845", // --green al 45 % mezclado sobre --bg
  grid: "#092323", // --line al 6 % mezclado sobre el tablero
  snake: "#00ff88", // --green
  snakeTail: "#8a8fb5", // --ink-dim
  head: "#00f5ff", // --cyan
  eye: "#0a0a0f", // --bg
  fruit: "#ff006e", // --magenta, la común: los «núcleos» del copy de la ficha
  fruitRare: "#f5ff00", // --yellow, la rara
  hud: "#e6e9ff", // --ink
  // Era --ink-faint (#4a4f70): 2,49:1, por debajo del 4,5 de un rótulo.
  hudLabel: "#8a8fb5", // --ink-dim
  overlay: "#0a0a0fb8", // --bg al 72 %
  gameOver: "#ff006e", // --magenta
  win: "#00ff88", // --green
  glow: true,
};

export const PALETTES: Palettes<Palette> = {
  // No hay original en references/: la convención del snake de toda la vida.
  // Serpiente verde sobre negro, manzana roja y la rara dorada, sin halo.
  clasico: {
    dark: {
      bg: "#0a0a0f", // --bg
      boardFill: "#0a0a0f",
      frame: "#9e9e9e",
      grid: "#141419",
      snake: "#4caf50",
      snakeTail: "#2e7d32",
      head: "#8bc34a",
      eye: "#0a0a0f",
      fruit: "#e53935",
      fruitRare: "#fdd835",
      hud: "#ffffff",
      hudLabel: "#a9a9ab",
      overlay: "#0a0a0fb8",
      gameOver: "#e53935",
      win: "#4caf50",
      glow: false,
    },
    light: {
      bg: "#f4f5f7",
      boardFill: "#ffffff",
      frame: "#555555",
      grid: "#eceef1",
      snake: "#2e7d32",
      snakeTail: "#5f7f60",
      head: "#1b5e20",
      eye: "#ffffff",
      fruit: "#9b1c1c",
      fruitRare: "#a07c00",
      hud: "#111111",
      hudLabel: "#555555",
      overlay: "#f4f5f7c7",
      gameOver: "#9b1c1c",
      win: "#2e7d32",
      glow: false,
    },
  },
  neon: {
    dark: NEON_DARK,
    // Sin halo: sobre papel, el brillo se lee como borrón. La común baja a
    // magenta hondo para separarse de la rara al menos 1,5:1.
    light: {
      bg: "#eef0f7", // --bg claro
      boardFill: "#e2eaee", // --green claro al 5 % mezclado sobre --bg
      frame: "#3f8a63",
      grid: "#d0dfe4", // --line claro al 8 % mezclado sobre el tablero
      snake: "#00703d", // --green claro
      snakeTail: "#454a6b", // --ink-dim claro
      head: "#00666f", // --cyan claro
      eye: "#eef0f7", // --bg claro
      fruit: "#8a0040", // magenta hondo
      fruitRare: "#6e6900", // amarillo bajado de luz
      hud: "#11131f", // --ink claro
      hudLabel: "#454a6b", // --ink-dim claro
      overlay: "#eef0f7c7",
      gameOver: "#bc0057", // --magenta claro
      win: "#00703d", // --green claro
      glow: false,
    },
  },
  // LCD de móvil de los 2000: un verde grisáceo en tres luminancias. La
  // serpiente y la rara van al tono máximo y la común un escalón por debajo;
  // la rara se separa además por su anillo.
  retro: {
    dark: {
      bg: "#0d140f",
      boardFill: "#0d140f",
      frame: "#7fa889",
      grid: "#152019",
      snake: "#c7f0d8",
      snakeTail: "#7fa889",
      head: "#c7f0d8",
      eye: "#0d140f",
      fruit: "#7fa889",
      fruitRare: "#c7f0d8",
      hud: "#c7f0d8",
      hudLabel: "#7fa889",
      overlay: "#0d140fc7",
      gameOver: "#c7f0d8",
      win: "#c7f0d8",
      glow: false,
    },
    light: {
      bg: "#c7f0d8",
      boardFill: "#c7f0d8",
      frame: "#5e7a55",
      grid: "#b5dcc4",
      snake: "#2b3a26",
      snakeTail: "#5e7a55",
      head: "#2b3a26",
      eye: "#c7f0d8",
      fruit: "#5e7a55",
      fruitRare: "#2b3a26",
      hud: "#2b3a26",
      hudLabel: "#43523d",
      overlay: "#c7f0d8d9",
      gameOver: "#2b3a26",
      win: "#2b3a26",
      glow: false,
    },
  },
};

/** Mismas familias que --mono y --pixel de globals.css (cargadas por next/font). */
export const FONT_MONO = '"JetBrains Mono", "Courier New", monospace';
export const FONT_PIXEL = '"Press Start 2P", system-ui, monospace';
