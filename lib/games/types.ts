// Contrato común de todos los motores de juego. El reproductor
// (/juegos/[id]/jugar) solo conoce esta interfaz: nada de la implementación
// de cada juego se filtra hasta React.
/** Lo que el motor publica hacia el HUD de React. */
export type GameSnapshot = {
  score: number;
  lives: number;
  level: number;
  /**
   * Métrica propia de los juegos que cuentan líneas en vez de vidas.
   * Cuando llega, el HUD pinta «Líneas» en lugar de «Vidas».
   *
   * Es opcional a propósito: así los motores que no la emiten —`asteroides`—
   * no cambian, y el HUD no necesita una tabla de rótulos por juego.
   */
  lines?: number;
};
/** Las tres skins que todo juego jugable debe traer. La primera es el default. */
export type SkinId = "clasico" | "neon" | "retro";
/** Modo de color de la app; el motor pinta su tablero en el mismo. */
export type ColorMode = "dark" | "light";
/** Cómo se pinta la partida. Cambiarla no toca el estado del juego. */
export type Appearance = { skin: SkinId; mode: ColorMode };
/**
 * Las seis paletas de un motor: `PALETTES[skin][mode]`. Todas comparten las
 * claves de `P`, así que el dibujo no distingue una skin de otra.
 */
export type Palettes<P> = Record<SkinId, Record<ColorMode, P>>;
export type GameEngine = {
  /** Arranca el bucle y engancha el teclado. */
  start(): void;
  /** Congela el bucle sin perder la partida. */
  pause(): void;
  resume(): void;
  /** Vuelve a empezar de cero (lo llama el modal de game over). */
  restart(): void;
  /** Cancela el bucle, retira oyentes y libera el canvas. */
  destroy(): void;
  /**
   * Cambia skin o modo en caliente: repinta con la paleta nueva sin reiniciar
   * la partida ni tocar la puntuación, también en pausa o tras el fin.
   */
  setAppearance(appearance: Appearance): void;
};
export type GameEngineHooks = {
  /** Solo se invoca cuando alguno de los valores del snapshot cambia. */
  onSnapshot(snapshot: GameSnapshot): void;
  /** Vidas agotadas. El reproductor abre el modal. */
  onGameOver(finalScore: number): void;
};
export type GameEngineFactory = (
  canvas: HTMLCanvasElement,
  hooks: GameEngineHooks,
  /** Apariencia con la que se pinta el primer fotograma. */
  appearance: Appearance,
) => GameEngine;
