// Constantes de SERPENTINA. **No hay original del que portarlas**: en
// references/RRO5vePTlqkYrGHjYdtf_started-games/ no hay snake, así que estos
// números son el diseño y no la copia de nadie. Ajustar la dificultad es
// cambiarlos aquí; no hay ninguno suelto en el resto del motor.
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
// ── Paleta y tipografías del canvas ───────────────────────────────────────────
// Los valores van literales: `ctx` no entiende variables CSS y leerlas con
// getComputedStyle en cada fotograma sería caro.
export const PALETTE = {
  bg: "#0a0a0f", // --bg
  boardFill: "rgba(0, 255, 136, 0.05)", // --green, fondo del tablero
  frame: "rgba(0, 255, 136, 0.35)", // --green, el marco que mata
  grid: "rgba(0, 245, 255, 0.06)", // --line, la rejilla apenas insinuada
  snake: "#00ff88", // --green
  snakeTail: "#8a8fb5", // --ink-dim
  head: "#00f5ff", // --cyan
  eye: "#0a0a0f", // --bg
  fruit: "#ff006e", // --magenta, la común: los «núcleos» del copy de la ficha
  fruitRare: "#f5ff00", // --yellow, la rara
  hud: "#e6e9ff", // --ink
  hudLabel: "#4a4f70", // --ink-faint
  overlay: "rgba(10, 10, 15, 0.72)", // --bg con alfa
  gameOver: "#ff006e", // --magenta
  win: "#00ff88", // --green
} as const;
/** Componentes de --green, para el degradado de la cola con alfa variable. */
export const SNAKE_RGB = "0, 255, 136";
/** Mismas familias que --mono y --pixel de globals.css (cargadas por next/font). */
export const FONT_MONO = '"JetBrains Mono", "Courier New", monospace';
export const FONT_PIXEL = '"Press Start 2P", system-ui, monospace';
