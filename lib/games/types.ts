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
) => GameEngine;
