// Constantes portadas literalmente de
// references/RRO5vePTlqkYrGHjYdtf_started-games/02-asteroids/game.js.
// Ningún número cambia: la física y los spawns están calibrados para este lienzo.

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

// ── Paleta y tipografías del canvas ───────────────────────────────────────────
// Repintado del original (blanco sobre negro) con los tokens del Vault. Los
// valores van literales: `ctx` no entiende variables CSS y leerlas con
// getComputedStyle en cada fotograma sería caro.
export const PALETTE = {
  bg: "#0a0a0f", // --bg
  ship: "#00f5ff", // --cyan
  bullet: "#f5ff00", // --yellow
  rock: "#8a8fb5", // --ink-dim
  thrust: "#ff006e", // --magenta
  powerUp: "#ff006e", // --magenta
  hud: "#e6e9ff", // --ink
} as const;

/** Componentes de --ink, para las estelas de partículas con alfa variable. */
export const INK_RGB = "230, 233, 255";

/** Mismas familias que --mono y --pixel de globals.css (cargadas por next/font). */
export const FONT_MONO = '"JetBrains Mono", "Courier New", monospace';
export const FONT_PIXEL = '"Press Start 2P", system-ui, monospace';
