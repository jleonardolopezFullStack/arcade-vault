// Utilidades del motor, portadas de game.js sin cambios de comportamiento.

export type Point = { x: number; y: number };

/** Envolvimiento toroidal: salir por un borde es entrar por el opuesto. */
export const wrap = (v: number, max: number) => ((v % max) + max) % max;
export const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export const rand = (min: number, max: number) => min + Math.random() * (max - min);
export const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
