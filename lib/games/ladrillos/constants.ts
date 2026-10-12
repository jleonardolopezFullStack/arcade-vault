// Constantes portadas literalmente de
// references/RRO5vePTlqkYrGHjYdtf_started-games/04-arkanoid/game.js.
// Ningún número de la mecánica cambia.
//
// Lo único nuevo es el color: el original dibujaba con un spritesheet PNG y
// aquí todo se redibuja con primitivas y la paleta de la skin activa.
import type { Palettes } from "../types";
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
// Seis paletas, `PALETTES[skin][mode]`, todas con las mismas claves. Los
// valores van literales: `ctx` no entiende variables CSS. Los alfas van en hex
// de ocho cifras solo donde de verdad son un velo (`overlay`, `highlight`).
// Contrastes medidos en specs/skins/README.md.

/** Los siete nombres de color de bloque del original, que usan los niveles. */
export type BlockColor =
  | "cyan"
  | "magenta"
  | "yellow"
  | "green"
  | "red"
  | "hotpink"
  | "gray";

export type Palette = {
  bg: string;
  paddle: string;
  ball: string;
  hud: string;
  hudLabel: string;
  /** Velo del cartel final, con alfa. */
  overlay: string;
  gameOver: string;
  win: string;
  /** Brillo superior de bloques y paleta, con alfa. */
  highlight: string;
  blocks: Record<BlockColor, string>;
};

/**
 * El look del Vault (SPEC 08): los siete colores de bloque del original
 * repartidos sobre los cuatro acentos del tema.
 */
const NEON_DARK: Palette = {
  bg: "#0a0a0f", // --bg
  paddle: "#00f5ff", // --cyan
  ball: "#f5ff00", // --yellow
  hud: "#e6e9ff", // --ink
  // Era --ink-faint (#4a4f70): 2,49:1, por debajo del 4,5 de un rótulo.
  hudLabel: "#8a8fb5", // --ink-dim
  overlay: "#0a0a0fb8", // --bg al 72 %
  gameOver: "#ff006e", // --magenta
  win: "#00ff88", // --green
  highlight: "#ffffff1f", // blanco al 12 %, el mismo de CAÍDA
  blocks: {
    cyan: "#00f5ff", // --cyan
    magenta: "#ff006e", // --magenta
    yellow: "#f5ff00", // --yellow
    green: "#00ff88", // --green
    // Era #8c003c (magenta al 55 %): 2,05:1 sobre --bg, no llegaba a 3.
    red: "#bd0052", // --magenta al 74 %
    hotpink: "#ff73a5", // --magenta aclarado
    gray: "#8a8fb5", // --ink-dim
  },
};

/** Velo sin alfa útil: retro no lleva brillo en los bloques. */
const SIN_BRILLO = "#00000000";

export const PALETTES: Palettes<Palette> = {
  // Los colores reales del spritesheet-breakout.png, muestreados píxel a
  // píxel. Ojo: los nombres del original no coinciden con lo que pinta su
  // hoja —`green` es azul, `magenta` es violeta y `hotpink` es naranja—, y
  // aquí manda lo que se veía.
  clasico: {
    dark: {
      bg: "#0a0a0f", // --bg (el original era #000)
      paddle: "#babac5", // cuerpo plateado de la paleta
      ball: "#f6f2f2",
      hud: "#ffffff", // el «Score» blanco del original
      hudLabel: "#a9a9ab", // blanco al 65 % mezclado
      overlay: "#0a0a0f99", // rgba(0,0,0,.6) del original
      gameOver: "#ff4545", // el rojo de los remates de la paleta
      win: "#4fc99c",
      highlight: "#ffffff1f",
      blocks: {
        red: "#c02a3e",
        cyan: "#4fc99c", // verde azulado en la hoja
        green: "#44aaf3", // azul en la hoja
        magenta: "#632ff4", // violeta en la hoja
        yellow: "#d9bd4c",
        hotpink: "#fc7d1c", // naranja en la hoja
        gray: "#646373", // ladrillo de piedra
      },
    },
    light: {
      bg: "#f4f5f7",
      paddle: "#5c5c6e",
      ball: "#2b2b33",
      hud: "#111111",
      hudLabel: "#555555",
      overlay: "#f4f5f7c7",
      gameOver: "#c62828",
      win: "#1e7d5c",
      highlight: "#ffffff38",
      blocks: {
        red: "#a3202f",
        cyan: "#1e7d5c",
        green: "#1c6fb0",
        magenta: "#5326d6",
        yellow: "#7d6a12",
        hotpink: "#b0520a",
        gray: "#55546a",
      },
    },
  },
  neon: {
    dark: NEON_DARK,
    light: {
      bg: "#eef0f7", // --bg claro
      paddle: "#00666f", // --cyan claro
      ball: "#615d00", // --yellow claro
      hud: "#11131f", // --ink claro
      hudLabel: "#454a6b", // --ink-dim claro
      overlay: "#eef0f7c7",
      gameOver: "#bc0057", // --magenta claro
      win: "#00703d", // --green claro
      highlight: "#ffffff38",
      blocks: {
        cyan: "#00666f", // --cyan claro
        magenta: "#bc0057", // --magenta claro
        yellow: "#615d00", // --yellow claro
        green: "#00703d", // --green claro
        red: "#7a0035", // magenta hondo
        hotpink: "#d4337f", // magenta aclarado
        gray: "#454a6b", // --ink-dim claro
      },
    },
  },
  // Monitor de fósforo ámbar (P3): un tono en tres luminancias, sin brillo.
  // Paleta y pelota van al máximo para que nunca se pierdan entre bloques.
  retro: {
    dark: {
      bg: "#0f0a04",
      paddle: "#ffcc4d",
      ball: "#ffcc4d",
      hud: "#ffb000",
      hudLabel: "#c07a00",
      overlay: "#0f0a04c7",
      gameOver: "#ffcc4d",
      win: "#ffcc4d",
      highlight: SIN_BRILLO,
      blocks: {
        red: "#9a6200",
        yellow: "#ffb000",
        cyan: "#c07a00",
        magenta: "#9a6200",
        hotpink: "#ffb000",
        green: "#c07a00",
        gray: "#9a6200",
      },
    },
    light: {
      bg: "#f3e7cf",
      paddle: "#3d2400",
      ball: "#3d2400",
      hud: "#3d2400",
      hudLabel: "#7a4a00",
      overlay: "#f3e7cfd9",
      gameOver: "#3d2400",
      win: "#3d2400",
      highlight: SIN_BRILLO,
      blocks: {
        red: "#a86a10",
        yellow: "#5a3500",
        cyan: "#8a5200",
        magenta: "#a86a10",
        hotpink: "#5a3500",
        green: "#8a5200",
        gray: "#a86a10",
      },
    },
  },
};

export const HIGHLIGHT_H = 4;

/** Mismas familias que --mono y --pixel de globals.css (cargadas por next/font). */
export const FONT_MONO = '"JetBrains Mono", "Courier New", monospace';
export const FONT_PIXEL = '"Press Start 2P", system-ui, monospace';
