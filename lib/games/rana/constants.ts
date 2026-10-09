// Constantes de RANARIA. **No hay original del que portarlas**: en
// references/RRO5vePTlqkYrGHjYdtf_started-games/ no hay frogger, así que estos
// números son el diseño y no la copia de nadie. Ajustar la dificultad es
// cambiarlos aquí; no hay ninguno suelto en el resto del motor.
/** Mundo interno. El escalado a pantalla es cosa del CSS, no de las coordenadas. */
export const W = 800;
export const H = 600;
// ── Reparto del lienzo ───────────────────────────────────────────────────────
// Banda de HUD arriba, tablero de 19 × 13 en medio y banda de tiempo abajo, con
// 20 px de margen a cada lado. El margen no es decorativo: el borde del tablero
// es el límite que mata al ser arrastrado, y pegado al bisel de .crt-screen no
// se vería. Diecinueve columnas —impar— para que exista una columna central
// donde la rana sale alineada con el nenúfar del medio.
/** Banda superior con puntuación, nivel y vidas. */
export const HUD_H = 40;
export const CELL = 40;
export const COLS = 19;
export const ROWS = 13;
/** Rectángulo del tablero en píxeles, derivado de la rejilla. */
export const BOARD = {
  x: (W - COLS * CELL) / 2,
  y: HUD_H,
  w: COLS * CELL,
  h: ROWS * CELL,
} as const;
/** La barra de tiempo, en la banda inferior bajo el tablero. */
export const TIME_BAND = { x: 20, y: 568, w: 760, h: 16 } as const;
/** Columna central: su centro es x = 400, alineado con el nenúfar del medio. */
export const START_COL = Math.floor(COLS / 2);
// ── Filas por papel (numeradas de arriba abajo) ──────────────────────────────
/** Orilla de los nenúfares; fuera de las bahías, mata. */
export const HOME_ROW = 0;
/** Río: troncos y tortugas; el agua mata. */
export const RIVER_ROWS: readonly number[] = [1, 2, 3, 4, 5];
/** Mediana segura. */
export const MEDIAN_ROW = 6;
/** Carretera: el asfalto es seguro, los vehículos no. */
export const ROAD_ROWS: readonly number[] = [7, 8, 9, 10, 11];
/** Acera de salida, donde aparece la rana. */
export const START_ROW = 12;
/** Columnas de las cinco bahías: centros en x = 80, 240, 400, 560, 720. */
export const HOME_COLS: readonly number[] = [1, 5, 9, 13, 17];
// ── Partida ──────────────────────────────────────────────────────────────────
/**
 * dt máximo en segundos, el invariante del contrato.
 *
 * **Acota el túnel.** El carril más rápido es el deportivo, a
 * 160 × SPEED_MAX_MULT = 320 px/s; con el dt capado avanza como mucho
 * 320 × 0,05 = 16 px por fotograma. Para pasar de un lado a otro de la rana
 * sin que ningún fotograma los muestre solapados tendría que moverse más que
 * la suma de las dos cajas —24 de la rana + 34 del coche más corto = 58 px—.
 * 16 ≤ 58 con holgura. Si alguien sube una velocidad base, SPEED_MAX_MULT o
 * este tope hasta que vmax × MAX_DT se acerque a 58, el túnel aparece en
 * silencio.
 */
export const MAX_DT = 0.05;
export const START_LIVES = 3;
/**
 * Tiempo mínimo entre dos saltos.
 *
 * **HOP_ANIM tiene que seguir siendo menor.** La animación de un salto termina
 * antes de que se acepte el siguiente, así que el dibujo nunca interpola desde
 * una posición que ya no existe.
 */
export const HOP_COOLDOWN = 0.12;
/** Duración de la animación del salto: solo dibujo, la lógica salta en el acto. */
export const HOP_ANIM = 0.1;
/** Pausa tras una muerte, con el marcador de la causa, antes de reaparecer. */
export const DEATH_TIME = 1.2;
/** Reloj de cada viaje; se reinicia al reaparecer y al llegar a un nenúfar. */
export const TIME_LIMIT = 30;
/** Por debajo, la barra pasa a magenta y parpadea. */
export const TIME_WARN = 8;
// ── Puntuación ───────────────────────────────────────────────────────────────
/** Por cada fila nueva alcanzada en el viaje (12 por viaje completo). */
export const POINTS_ROW = 10;
/** Por llegar a un nenúfar libre. */
export const POINTS_HOME = 50;
/** Por cada segundo entero que sobre al llegar: 10 × floor(timeLeft). */
export const TIME_BONUS_PER_S = 10;
/** Al ocupar el quinto nenúfar. Máximo por nivel: 5 × 470 + 1 000 = 3 350. */
export const POINTS_ALL_HOMES = 1000;
export const HOMES = 5;
/** Distancia máxima entre el centro de la rana y el de la bahía para entrar. */
export const HOME_TOLERANCE = 14;
/**
 * Saturación del marcador: un contador de seis cifras de recreativa.
 *
 * **Tiene que valer lo mismo que `games.max_score` de `ranaria`** —fijado en
 * supabase/migrations/20261009035917_reglas_ranaria.sql—. Si se suben por
 * separado, o el motor produce marcas que submit_score rechaza con 22003, o
 * la base admite marcas que el motor nunca daría.
 */
export const SCORE_CAP = 999_999;
// ── Niveles ──────────────────────────────────────────────────────────────────
/** Aceleración de los carriles por nivel: mult = 1 + 0,10 × (level − 1). */
export const SPEED_STEP = 0.1;
/** Tope del multiplicador, alcanzado en el nivel 11. */
export const SPEED_MAX_MULT = 2.0;
/** Cartel «NIVEL N» tras llenar los nenúfares; no detiene el juego. */
export const LEVEL_BANNER = 1.5;
// ── Cajas de colisión ────────────────────────────────────────────────────────
/** Margen de la caja de la rana: ocupa 24 × 24 dentro de su celda. */
export const FROG_INSET = 8;
/** Margen de la caja de un vehículo por cada lado horizontal. */
export const VEHICLE_INSET = 3;
// ── Carriles ─────────────────────────────────────────────────────────────────
export type LaneKind = "log" | "turtle" | "car" | "sport" | "truck";
export type CarColor = "car1" | "car2" | "car3" | "sport" | "truck";
export type LaneDef = {
  row: number;
  kind: LaneKind;
  /** +1 hacia la derecha, −1 hacia la izquierda. */
  dir: 1 | -1;
  /** Objetos en la cinta. */
  count: number;
  /** Largo de cada objeto, en celdas. */
  len: number;
  /** Celdas entre los inicios de dos objetos consecutivos. */
  gap: number;
  /** Velocidad base en px/s, antes del multiplicador de nivel. */
  speed: number;
  /** Desplazamiento inicial en px: fijo para que la primera partida sea siempre la misma. */
  offset: number;
  /** Color de los vehículos; los troncos y las tortugas tienen el suyo. */
  color?: CarColor;
};
/**
 * Los diez carriles. Cada uno es una cinta circular de `count × gap` celdas.
 *
 * **Invariante: `count × gap ≥ COLS + len`.** Es lo que hace invisible el
 * envolvimiento: un objeto sale entero por un lado antes de reaparecer por el
 * otro, porque la cinta es más larga que el tablero más el propio objeto. Con
 * él, además, una rana subida a un tronco siempre sale del tablero —y muere—
 * antes de que su tronco llegue al punto de envolvimiento. Si alguien baja un
 * `gap`, los objetos aparecerán de golpe en mitad del tablero.
 */
export const LANES: readonly LaneDef[] = [
  // Río
  {
    row: 1,
    kind: "log",
    dir: 1,
    count: 3,
    len: 4,
    gap: 8,
    speed: 60,
    offset: 120,
  }, // 24 ≥ 23
  {
    row: 2,
    kind: "turtle",
    dir: -1,
    count: 4,
    len: 2,
    gap: 6,
    speed: 70,
    offset: 40,
  }, // 24 ≥ 21
  {
    row: 3,
    kind: "log",
    dir: 1,
    count: 2,
    len: 6,
    gap: 13,
    speed: 90,
    offset: 320,
  }, // 26 ≥ 25
  {
    row: 4,
    kind: "log",
    dir: 1,
    count: 3,
    len: 3,
    gap: 8,
    speed: 50,
    offset: 200,
  }, // 24 ≥ 22
  {
    row: 5,
    kind: "turtle",
    dir: -1,
    count: 4,
    len: 3,
    gap: 6,
    speed: 60,
    offset: 160,
  }, // 24 ≥ 22
  // Carretera
  {
    row: 7,
    kind: "truck",
    dir: -1,
    count: 3,
    len: 2,
    gap: 7,
    speed: 70,
    offset: 80,
    color: "truck",
  }, // 21 ≥ 21
  {
    row: 8,
    kind: "sport",
    dir: 1,
    count: 2,
    len: 1,
    gap: 10,
    speed: 160,
    offset: 240,
    color: "sport",
  }, // 20 ≥ 20
  {
    row: 9,
    kind: "car",
    dir: -1,
    count: 3,
    len: 1,
    gap: 7,
    speed: 100,
    offset: 120,
    color: "car1",
  }, // 21 ≥ 20
  {
    row: 10,
    kind: "car",
    dir: 1,
    count: 3,
    len: 1,
    gap: 7,
    speed: 80,
    offset: 200,
    color: "car2",
  }, // 21 ≥ 20
  {
    row: 11,
    kind: "car",
    dir: -1,
    count: 3,
    len: 1,
    gap: 7,
    speed: 60,
    offset: 40,
    color: "car3",
  }, // 21 ≥ 20
] as const;
// ── Entrada ──────────────────────────────────────────────────────────────────
export type HopDir = "up" | "down" | "left" | "right";
/** Las cuatro flechas, por e.code. P y Escape son del reproductor. */
export const CAPTURED_KEYS: Readonly<Record<string, HopDir>> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};
// ── Paleta y tipografías del canvas ───────────────────────────────────────────
// Los valores van literales: `ctx` no entiende variables CSS y leerlas con
// getComputedStyle en cada fotograma sería caro. **Verde es la rana, y solo la
// rana y su destino**: ningún obstáculo es verde, así que se encuentra de un
// vistazo en cualquier fila.
export const PALETTE = {
  bg: "#0a0a0f", // --bg
  water: "rgba(0, 245, 255, 0.08)", // --cyan, el río
  bank: "rgba(0, 255, 136, 0.10)", // --green, la orilla de los nenúfares
  road: "#15151f", // --bg-3, el asfalto
  laneLine: "#4a4f70", // --ink-faint, las marcas discontinuas
  safe: "rgba(255, 0, 110, 0.10)", // --magenta, mediana y salida
  frame: "rgba(0, 245, 255, 0.18)", // --line, el borde del tablero
  frog: "#00ff88", // --green
  eye: "#0a0a0f", // --bg
  frogHome: "#00f5ff", // --cyan, la rana ya a salvo en su nenúfar
  lily: "#00ff88", // --green
  car1: "#00f5ff", // --cyan
  car2: "#f5ff00", // --yellow
  car3: "#ff006e", // --magenta
  sport: "#ff006e", // --magenta
  truck: "#8a8fb5", // --ink-dim
  log: "#d97a3a", // --bronze
  logEnd: "#8a4d25", // --bronze al 64 %
  logGrain: "rgba(10, 10, 15, 0.35)", // --bg con alfa
  turtle: "#ffcf3a", // --gold
  turtleShell: "#8a6f1f", // --gold al 54 %
  ripple: "#00f5ff", // --cyan
  death: "#ff006e", // --magenta
  timeBar: "#00ff88", // --green
  timeWarn: "#ff006e", // --magenta
  hud: "#e6e9ff", // --ink
  hudLabel: "#4a4f70", // --ink-faint
  overlay: "rgba(10, 10, 15, 0.72)", // --bg con alfa
  gameOver: "#ff006e", // --magenta
  banner: "#f5ff00", // --yellow, el cartel de nivel
} as const;
/** Componentes de --ink, para textos con alfa variable. */
export const INK_RGB = "230, 233, 255";
/** Mismas familias que --mono y --pixel de globals.css (cargadas por next/font). */
export const FONT_MONO = '"JetBrains Mono", "Courier New", monospace';
export const FONT_PIXEL = '"Press Start 2P", system-ui, monospace';
