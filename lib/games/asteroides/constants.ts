// Constantes portadas literalmente de
// references/RRO5vePTlqkYrGHjYdtf_started-games/02-asteroids/game.js.
// Ningún número cambia: la física y los spawns están calibrados para este lienzo.
import type { Palettes } from "../types";

/** Mundo interno. El escalado a pantalla es cosa del CSS, no de las coordenadas. */
export const W = 800;
export const H = 600;

/** Radio por tamaño de asteroide 1, 2, 3. */
export const RADII = [0, 16, 30, 50] as const;
/** Velocidad base por tamaño. */
export const SPEEDS = [0, 85, 55, 32] as const;
/** Puntos por tamaño. */
export const POINTS = [0, 100, 50, 20] as const;

export const POWERUP_DROP_CHANCE = 0.15;
export const POWERUP_DURATION = 5;
export const POWERUP_TTL = 12;
export const TRIPLE_SPREAD = 0.18;

export const INITIAL_LIVES = 3;
/** Asteroides del nivel 1. Los siguientes: 3 + level. */
export const LEVEL_1_ASTEROIDS = 4;
/** dt máximo en segundos: un salto de pestaña no debe teleportar la nave. */
export const MAX_DT = 0.05;

// ── Paletas y tipografías del canvas ──────────────────────────────────────────
// Seis paletas, `PALETTES[skin][mode]`, todas con las mismas claves. Los
// valores van literales: `ctx` no entiende variables CSS y leerlas con
// getComputedStyle en cada fotograma sería caro. Contrastes medidos en
// specs/skins/README.md.

export type Palette = {
  bg: string;
  ship: string;
  bullet: string;
  rock: string;
  thrust: string;
  powerUp: string;
  hud: string;
  /** Subtítulo del cartel de fin de partida. */
  hudDim: string;
  /** Estelas de la explosión; el alfa variable lo pone `globalAlpha`. */
  particle: string;
};

/** El look del Vault: el repintado de SPEC 05, intacto. */
const NEON_DARK: Palette = {
  bg: "#0a0a0f", // --bg
  ship: "#00f5ff", // --cyan
  bullet: "#f5ff00", // --yellow
  rock: "#8a8fb5", // --ink-dim
  thrust: "#ff006e", // --magenta
  powerUp: "#ff006e", // --magenta
  hud: "#e6e9ff", // --ink
  hudDim: "#8a8fb5", // --ink-dim
  particle: "#e6e9ff", // --ink
};

export const PALETTES: Palettes<Palette> = {
  // El vectorial blanco de game.js: todo #fff, el power-up en #0ff y el
  // propulsor naranja rgba(255,130,0,.85), aquí ya mezclado sobre el fondo.
  clasico: {
    dark: {
      bg: "#0a0a0f", // --bg
      ship: "#ffffff",
      bullet: "#ffffff",
      rock: "#ffffff",
      thrust: "#da7002",
      powerUp: "#00ffff",
      hud: "#ffffff",
      hudDim: "#a9a9ab", // rgba(255,255,255,.65) mezclado
      particle: "#ffffff",
    },
    // Tinta de plotter sobre papel: el negro ocupa el sitio del blanco.
    light: {
      bg: "#f4f5f7",
      ship: "#111111",
      bullet: "#111111",
      rock: "#111111",
      thrust: "#a34b00",
      powerUp: "#00727a",
      hud: "#111111",
      hudDim: "#555555",
      particle: "#111111",
    },
  },
  neon: {
    dark: NEON_DARK,
    light: {
      bg: "#eef0f7", // --bg claro
      ship: "#00666f", // --cyan claro
      bullet: "#615d00", // --yellow claro
      rock: "#454a6b", // --ink-dim claro
      thrust: "#bc0057", // --magenta claro
      powerUp: "#bc0057", // --magenta claro
      hud: "#11131f", // --ink claro
      hudDim: "#454a6b", // --ink-dim claro
      particle: "#11131f", // --ink claro
    },
  },
  // Monitor de fósforo verde (P1): un solo tono en tres luminancias. La nave
  // y las balas van al máximo; las rocas, un escalón por debajo; el power-up
  // se distingue por su rombo y su «3x», no por el color.
  retro: {
    dark: {
      bg: "#050c07",
      ship: "#4dff7c",
      bullet: "#c8ffd6",
      rock: "#22a046",
      thrust: "#c8ffd6",
      powerUp: "#c8ffd6",
      hud: "#4dff7c",
      hudDim: "#22a046",
      particle: "#4dff7c",
    },
    light: {
      bg: "#e4efe4",
      ship: "#0a4019",
      bullet: "#0a4019",
      rock: "#2f6a3e",
      thrust: "#0a4019",
      powerUp: "#0a4019",
      hud: "#0a4019",
      hudDim: "#2f6a3e",
      particle: "#0a4019",
    },
  },
};

/** Mismas familias que --mono y --pixel de globals.css (cargadas por next/font). */
export const FONT_MONO = '"JetBrains Mono", "Courier New", monospace';
export const FONT_PIXEL = '"Press Start 2P", system-ui, monospace';
