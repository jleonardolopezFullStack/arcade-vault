// Constantes de RANARIA. **No hay original del que portarlas**: en
// references/RRO5vePTlqkYrGHjYdtf_started-games/ no hay frogger, así que estos
// números son el diseño y no la copia de nadie. Ajustar la dificultad es
// cambiarlos aquí; no hay ninguno suelto en el resto del motor.
import type { Palettes } from "../types";
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
// ── Río vivo (SPEC 3/3) ──────────────────────────────────────────────────────
/** Nivel a partir del cual bucean las tortugas. */
export const DIVE_FROM_LEVEL = 2;
/** Filas de tortugas con grupos buceadores (solo los de índice impar). */
export const DIVE_ROWS: readonly number[] = [2, 5];
/** Tiempo a flote, plataforma plena. */
export const DIVE_SURFACE = 3.0;
/** Aviso: medio hundidas y parpadeando; **siguen siendo plataforma**. */
export const DIVE_WARN = 0.8;
/**
 * Bajo el agua: **no son plataforma**.
 *
 * Es diez veces HOP_COOLDOWN a propósito: entre el final del aviso y el
 * hundimiento la rana tiene tiempo de sobra para saltar fuera, así que morir
 * sobre una tortuga que se hunde es siempre un error del jugador, no del motor.
 */
export const DIVE_UNDER = 1.2;
/** Duración del ciclo de buceo: 3,0 + 0,8 + 1,2 = 5,0 s. */
export const DIVE_CYCLE = DIVE_SURFACE + DIVE_WARN + DIVE_UNDER;
/**
 * Desfase entre los dos grupos buceadores de un carril.
 *
 * **Tiene que seguir siendo la mitad de DIVE_CYCLE.** Así los dos buceadores
 * nunca están bajo el agua a la vez —DIVE_UNDER es menor que medio ciclo— y
 * siempre queda a flote, como mínimo, uno de ellos más los dos que no bucean.
 * Si alguien cambia los tiempos del ciclo, esto se recalcula solo.
 */
export const DIVE_PHASE = DIVE_CYCLE / 2;
/** Espera, sorteada en este intervalo, entre una mosca y la siguiente. */
export const FLY_DELAY_MIN = 8;
export const FLY_DELAY_MAX = 12;
/** Lo que dura la mosca en su nenúfar. */
export const FLY_TTL = 5;
/** Bonus por llegar a su nenúfar mientras está. */
export const FLY_POINTS = 200;
/** Nivel a partir del cual aparece el cocodrilo. */
export const CROC_FROM_LEVEL = 3;
/** Fila del cocodrilo: sustituye al objeto 0 de su carril. */
export const CROC_ROW = 1;
/**
 * Celdas totales: tres de lomo y una de cabeza. Igual que el `len` del tronco
 * al que sustituye, así que el invariante de envolvimiento de su carril no
 * cambia.
 */
export const CROC_LEN = 4;
/**
 * Puntos a los que se gana la vida extra, una sola vez por partida. Máximo por
 * nivel con los extras: 5 × (470 + 200) + 1 000 = 4 350; SCORE_CAP sigue un
 * orden de magnitud por encima de una partida excepcional.
 */
export const EXTRA_LIFE_AT = 10_000;
// ── Entrada ──────────────────────────────────────────────────────────────────
export type HopDir = "up" | "down" | "left" | "right";
/** Las cuatro flechas, por e.code. P y Escape son del reproductor. */
export const CAPTURED_KEYS: Readonly<Record<string, HopDir>> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};
// ── Paletas y tipografías del canvas ──────────────────────────────────────────
// Seis paletas, `PALETTES[skin][mode]`, todas con las mismas claves. Los
// valores van literales: `ctx` no entiende variables CSS y leerlas con
// getComputedStyle en cada fotograma sería caro. Las franjas translúcidas
// (agua, orilla, mediana) y los velos van en hex de ocho cifras para que se
// compongan igual que antes; los contrastes se midieron ya mezclados y están
// en specs/skins/README.md.
//
// **Invariantes de todas las skins:**
// - **Verde es la rana, y solo la rana y su destino**: ningún obstáculo ni
//   plataforma es verde, así que se encuentra de un vistazo en cualquier fila.
//   En `retro`, sin tonos que elegir, el papel lo hace la luminancia: el tono
//   extremo es solo de la rana y de los nenúfares.
// - **Lo que mata va en magenta** (el coche y el deportivo magentas, la
//   cabeza del cocodrilo, los marcadores de muerte). En `retro`, la cabeza
//   del cocodrilo se separa del lomo por luminancia además de por su ojo y
//   su mandíbula.
// - Las tortugas en aviso se pintan a media alfa: `turtle` tiene que seguir
//   llegando a 3:1 sobre el agua así mezclada.
export type Palette = {
  bg: string;
  /** El río; también rellena las bahías de la orilla. */
  water: string;
  /** La orilla de los nenúfares. */
  bank: string;
  road: string;
  laneLine: string;
  /** Mediana y salida. */
  safe: string;
  /** El borde que mata al ser arrastrado: un objeto, ≥ 3:1 sobre `bg`. */
  frame: string;
  frog: string;
  eye: string;
  frogHome: string;
  lily: string;
  car1: string;
  car2: string;
  car3: string;
  sport: string;
  truck: string;
  /** Ruedas de coches y deportivos. */
  wheel: string;
  /** Faros en la cara delantera. */
  headlight: string;
  log: string;
  logEnd: string;
  logGrain: string;
  turtle: string;
  turtleShell: string;
  /**
   * Alfa de las tortugas en aviso, en la fase visible del parpadeo. El neón
   * oscuro conserva la media alfa del SPEC 3/3; sobre papel o en LCD, media
   * alfa no llega a 3:1 sobre el agua y sube hasta que llega.
   */
  warnAlpha: number;
  ripple: string;
  death: string;
  timeBar: string;
  /** El carril vacío de la barra de tiempo. */
  timeTrack: string;
  timeWarn: string;
  hud: string;
  hudLabel: string;
  overlay: string;
  gameOver: string;
  banner: string;
  croc: string;
  crocHead: string;
  fly: string;
  /** Contorno de la mosca, que la separa del nenúfar. */
  flyEdge: string;
  flyWing: string;
  /** Halo (`shadowBlur`) en la rana. Solo el neón brilla. */
  glow: boolean;
};
/** El look del Vault (SPEC 2/3 y 3/3 de RANARIA). */
const NEON_DARK: Palette = {
  bg: "#0a0a0f", // --bg
  water: "#00f5ff14", // --cyan al 8 %, el río
  bank: "#00ff881a", // --green al 10 %, la orilla de los nenúfares
  road: "#15151f", // --bg-3, el asfalto
  laneLine: "#4a4f70", // --ink-faint, las marcas discontinuas
  safe: "#ff006e1a", // --magenta al 10 %, mediana y salida
  // Era --line (--cyan al 18 %): 1,47:1 sobre el fondo, y es el borde que
  // mata al ser arrastrado. Al 42 % mezclado llega a 3,24.
  frame: "#066d74", // --cyan al 42 % mezclado sobre --bg
  frog: "#00ff88", // --green
  eye: "#0a0a0f", // --bg
  frogHome: "#00f5ff", // --cyan, la rana ya a salvo en su nenúfar
  lily: "#00ff88", // --green
  car1: "#00f5ff", // --cyan
  car2: "#f5ff00", // --yellow
  car3: "#ff006e", // --magenta
  sport: "#ff006e", // --magenta
  truck: "#8a8fb5", // --ink-dim
  wheel: "#0a0a0f", // --bg
  headlight: "#e6e9ff", // --ink
  log: "#d97a3a", // --bronze
  logEnd: "#8a4d25", // --bronze al 64 %
  logGrain: "#0a0a0f59", // --bg al 35 %
  turtle: "#ffcf3a", // --gold
  turtleShell: "#8a6f1f", // --gold al 54 %
  warnAlpha: 0.5,
  ripple: "#00f5ff", // --cyan
  death: "#ff006e", // --magenta
  timeBar: "#00ff88", // --green
  timeTrack: "#e6e9ff0f", // --ink al 6 %
  timeWarn: "#ff006e", // --magenta
  hud: "#e6e9ff", // --ink
  // Era --ink-faint (#4a4f70): 2,49:1, por debajo del 4,5 de un rótulo.
  hudLabel: "#8a8fb5", // --ink-dim
  overlay: "#0a0a0fb8", // --bg al 72 %
  gameOver: "#ff006e", // --magenta
  banner: "#f5ff00", // --yellow, el cartel de nivel
  croc: "#8a8fb5", // --ink-dim, el lomo
  crocHead: "#ff006e", // --magenta, la cabeza que mata
  fly: "#f5ff00", // --yellow
  flyEdge: "#0a0a0f", // --bg
  flyWing: "#e6e9ff99", // --ink al 60 %
  glow: true,
};
export const PALETTES: Palettes<Palette> = {
  // No hay original en references/: la convención del Frogger de 1981. Río
  // azul marino, aceras moradas, troncos marrones, tortugas rojas y la rana
  // verde. El cocodrilo y el tractor del original eran verdes: aquí no, por
  // el invariante; el lomo va en gris y la cabeza en el rosa de lo que mata.
  clasico: {
    dark: {
      bg: "#0a0a0f", // --bg
      water: "#000047",
      bank: "#0a2a12",
      road: "#0a0a0f",
      laneLine: "#3a3a44",
      safe: "#2a1240",
      frame: "#9e9e9e",
      frog: "#3cdc3c",
      eye: "#0a0a0f",
      frogHome: "#c8ff8c",
      lily: "#2e9e3a",
      car1: "#5a8cff",
      car2: "#ffde00",
      car3: "#ff3cb4",
      sport: "#ff3cb4",
      truck: "#e0e0e0",
      wheel: "#0a0a0f",
      headlight: "#ffffff",
      log: "#b5651d",
      logEnd: "#6b3a12",
      logGrain: "#00000059",
      turtle: "#e83030",
      turtleShell: "#7a1010",
      warnAlpha: 0.85,
      ripple: "#9ec8ff",
      death: "#ff3cb4",
      timeBar: "#3cdc3c",
      timeTrack: "#ffffff0f",
      timeWarn: "#ff3cb4",
      hud: "#ffffff",
      hudLabel: "#a9a9ab",
      overlay: "#0a0a0fb8",
      gameOver: "#ff3cb4",
      banner: "#ffde00",
      croc: "#6e6e6e",
      crocHead: "#ff3cb4",
      fly: "#ffde00",
      flyEdge: "#0a0a0f",
      flyWing: "#ffffff99",
      glow: false,
    },
    light: {
      bg: "#f4f5f7",
      water: "#cddcf2",
      bank: "#dcefdc",
      road: "#e4e4e8",
      laneLine: "#b4b4bc",
      safe: "#eadcf2",
      frame: "#555555",
      frog: "#0f4d0f",
      eye: "#f4f5f7",
      frogHome: "#0b3d0b",
      lily: "#1b5e20",
      car1: "#1f4fbf",
      car2: "#8d6e00",
      car3: "#b0006a",
      sport: "#b0006a",
      truck: "#555555",
      wheel: "#111111",
      headlight: "#f4f5f7",
      log: "#a0622a",
      logEnd: "#5c3410",
      logGrain: "#00000040",
      turtle: "#d83a3a",
      turtleShell: "#6a1010",
      warnAlpha: 0.9,
      ripple: "#1f4fbf",
      death: "#b0006a",
      timeBar: "#2e7d32",
      timeTrack: "#1111110f",
      timeWarn: "#b0006a",
      hud: "#111111",
      hudLabel: "#555555",
      overlay: "#f4f5f7c7",
      gameOver: "#b0006a",
      banner: "#7a5f00",
      croc: "#7a7a7a",
      crocHead: "#8a0050",
      fly: "#fff59d",
      flyEdge: "#111111",
      flyWing: "#ffffffb3",
      glow: false,
    },
  },
  neon: {
    dark: NEON_DARK,
    // Sin halo: sobre papel, el brillo se lee como borrón. Los acentos son
    // los del --bg claro del Vault; la rana baja un punto más de luz para
    // separarse de troncos y tortugas, y la mosca conserva su amarillo vivo
    // sobre el nenúfar oscuro.
    light: {
      bg: "#eef0f7", // --bg claro
      water: "#00666f1a", // --cyan claro al 10 %
      bank: "#00703d1a", // --green claro al 10 %
      road: "#d9ddea", // --bg-3 claro
      laneLine: "#9a9fbd",
      safe: "#bc00571a", // --magenta claro al 10 %
      frame: "#00666f", // --cyan claro
      frog: "#00562f", // --green claro, más hondo
      eye: "#eef0f7", // --bg claro
      frogHome: "#003d42",
      lily: "#00703d", // --green claro
      car1: "#00666f", // --cyan claro
      car2: "#615d00", // --yellow claro
      car3: "#bc0057", // --magenta claro
      sport: "#bc0057", // --magenta claro
      truck: "#454a6b", // --ink-dim claro
      wheel: "#11131f", // --ink claro
      headlight: "#eef0f7", // --bg claro
      log: "#b0561a", // --bronze claro
      logEnd: "#5e2d0d",
      logGrain: "#11131f40",
      turtle: "#8d6800",
      turtleShell: "#3d2b00",
      warnAlpha: 0.85,
      ripple: "#00666f", // --cyan claro
      death: "#bc0057", // --magenta claro
      timeBar: "#00703d", // --green claro
      timeTrack: "#11131f0f", // --ink claro al 6 %
      timeWarn: "#bc0057", // --magenta claro
      hud: "#11131f", // --ink claro
      hudLabel: "#454a6b", // --ink-dim claro
      overlay: "#eef0f7c7",
      gameOver: "#bc0057", // --magenta claro
      banner: "#615d00", // --yellow claro
      croc: "#6a6f90", // --ink-dim claro
      crocHead: "#8a0040", // --magenta claro
      fly: "#f5ff00", // --yellow
      flyEdge: "#11131f", // --ink claro
      flyWing: "#ffffffb3",
      glow: false,
    },
  },
  // LCD de cuatro tonos en gris azulado, como una portátil de bolsillo: ni
  // el verde de ROCAS y SERPENTINA ni el ámbar de BLOQUE BUSTER, y sin un
  // verde que robe el papel de la rana. El tono extremo es solo de la rana y
  // los nenúfares; plataformas y coches van un escalón por debajo, y la
  // cabeza del cocodrilo uno más abajo que su lomo.
  retro: {
    dark: {
      bg: "#0b0d14",
      water: "#10141f",
      bank: "#141a26",
      road: "#0b0d14",
      laneLine: "#2c3448",
      safe: "#161b28",
      frame: "#6a7896",
      frog: "#eef2ff",
      eye: "#0b0d14",
      frogHome: "#eef2ff",
      lily: "#eef2ff",
      car1: "#9aa6c4",
      car2: "#9aa6c4",
      car3: "#9aa6c4",
      sport: "#9aa6c4",
      truck: "#6a7896",
      wheel: "#0b0d14",
      headlight: "#eef2ff",
      log: "#9aa6c4",
      logEnd: "#6a7896",
      logGrain: "#0b0d1459",
      turtle: "#9aa6c4",
      turtleShell: "#6a7896",
      warnAlpha: 0.65,
      ripple: "#9aa6c4",
      death: "#eef2ff",
      timeBar: "#9aa6c4",
      timeTrack: "#eef2ff0f",
      timeWarn: "#eef2ff",
      hud: "#eef2ff",
      hudLabel: "#9aa6c4",
      overlay: "#0b0d14c7",
      gameOver: "#eef2ff",
      banner: "#eef2ff",
      croc: "#9aa6c4",
      crocHead: "#6a7896",
      fly: "#6a7896",
      flyEdge: "#0b0d14",
      flyWing: "#0b0d1499",
      glow: false,
    },
    light: {
      bg: "#d8dee9",
      water: "#ccd3e0",
      bank: "#c4ccdb",
      road: "#d8dee9",
      laneLine: "#a8b1c4",
      safe: "#c8cfdc",
      frame: "#4a5672",
      frog: "#141a2b",
      eye: "#d8dee9",
      frogHome: "#141a2b",
      lily: "#141a2b",
      car1: "#3a4560",
      car2: "#3a4560",
      car3: "#3a4560",
      sport: "#3a4560",
      truck: "#5a6684",
      wheel: "#141a2b",
      headlight: "#d8dee9",
      log: "#3a4560",
      logEnd: "#5a6684",
      logGrain: "#d8dee959",
      turtle: "#3a4560",
      turtleShell: "#5a6684",
      warnAlpha: 0.75,
      ripple: "#3a4560",
      death: "#141a2b",
      timeBar: "#3a4560",
      timeTrack: "#141a2b0f",
      timeWarn: "#141a2b",
      hud: "#141a2b",
      hudLabel: "#3a4560",
      overlay: "#d8dee9d9",
      gameOver: "#141a2b",
      banner: "#141a2b",
      croc: "#3a4560",
      crocHead: "#5a6684",
      fly: "#d8dee9",
      flyEdge: "#141a2b",
      flyWing: "#d8dee999",
      glow: false,
    },
  },
};
/** Mismas familias que --mono y --pixel de globals.css (cargadas por next/font). */
export const FONT_MONO = '"JetBrains Mono", "Courier New", monospace';
export const FONT_PIXEL = '"Press Start 2P", system-ui, monospace';
