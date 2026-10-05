// Constantes portadas literalmente de
// references/RRO5vePTlqkYrGHjYdtf_started-games/04-arkanoid/game.js.
// Ningún número de la mecánica cambia.
//
// Lo único nuevo es el color: el original dibujaba con un spritesheet PNG y
// aquí todo se redibuja con primitivas y los tokens del Vault.
/** Mundo interno. Coincide con el del original y con el del reproductor. */
export const W = 800;
export const H = 600;
// ── Paleta del jugador ───────────────────────────────────────────────────────
export const PADDLE_SPEED = 400;
export const PADDLE_W = 81;
export const PADDLE_H = 14;
export const PADDLE_Y = 560;
/**
 * Margen por debajo del borde superior de la paleta en el que el rebote sigue
 * contando.
 *
 * **No se puede quitar.** A la velocidad de los últimos niveles la pelota
 * recorre más que su propio alto entre dos fotogramas, y sin este margen pasa
 * de estar encima de la paleta a estar debajo sin haberla tocado nunca.
 */
export const PADDLE_BOUNCE_TOLERANCE = 8;
// ── Pelota ───────────────────────────────────────────────────────────────────
export const BALL_SIZE = 16;
export const BASE_BALL_VX = 200;
export const BASE_BALL_VY = -300;
// ── Rejilla de bloques ───────────────────────────────────────────────────────
export const BLOCK_COLS = 10;
export const BLOCK_ROWS = 6;
export const BLOCK_W = 64;
export const BLOCK_H = 24;
export const BLOCKS_ORIGIN_X = (W - BLOCK_COLS * BLOCK_W) / 2;
export const BLOCKS_ORIGIN_Y = 80;
// ── Partida ──────────────────────────────────────────────────────────────────
export const POINTS_PER_BLOCK = 10;
export const INITIAL_LIVES = 3;
/**
 * dt máximo en segundos. El original trabaja en segundos pero sin tope; sin
 * él, volver a una pestaña dormida teletransporta la pelota al otro lado del
 * muro.
 */
export const MAX_DT = 0.05;
// ── Destello al romper un bloque ─────────────────────────────────────────────
// Sustituye a los cuatro fotogramas de explosión del spritesheet: el
// rectángulo crece hacia fuera y se apaga en el mismo tiempo que el original.
export const FLASH_DURATION = 150;
/** Píxeles que el destello crece por cada lado al final de su vida. */
export const FLASH_GROW = 6;
// ── Color ────────────────────────────────────────────────────────────────────
// Los siete colores de bloque del original repartidos sobre los cuatro acentos
// del tema. Los valores van literales: `ctx` no entiende variables CSS.
export const BLOCK_COLORS = {
  cyan: "#00f5ff", // --cyan
  magenta: "#ff006e", // --magenta
  yellow: "#f5ff00", // --yellow
  green: "#00ff88", // --green
  red: "#8c003c", // --magenta al 55 %
  hotpink: "#ff73a5", // --magenta aclarado
  gray: "#8a8fb5", // --ink-dim
} as const;
export type BlockColor = keyof typeof BLOCK_COLORS;
export const PALETTE = {
  bg: "#0a0a0f", // --bg
  paddle: "#00f5ff", // --cyan
  ball: "#f5ff00", // --yellow
  hud: "#e6e9ff", // --ink
  hudLabel: "#4a4f70", // --ink-faint
  overlay: "rgba(10, 10, 15, 0.72)",
  gameOver: "#ff006e", // --magenta
  win: "#00ff88", // --green
} as const;
/** Brillo superior de bloques y paleta, el mismo 12 % de blanco que CAÍDA. */
export const HIGHLIGHT = "rgba(255, 255, 255, 0.12)";
export const HIGHLIGHT_H = 4;
/** Mismas familias que --mono y --pixel de globals.css (cargadas por next/font). */
export const FONT_MONO = '"JetBrains Mono", "Courier New", monospace';
export const FONT_PIXEL = '"Press Start 2P", system-ui, monospace';
