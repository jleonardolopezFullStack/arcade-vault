// Skins y modo de color de los motores: lo que el reproductor ofrece y guarda.
// Las paletas viven en el `constants.ts` de cada motor; aquí solo está el
// catálogo de skins y su persistencia.
import type { ColorMode, SkinId } from "./types";
/** Orden del selector. `clasico` va primero porque es el default. */
export const SKINS: readonly { id: SkinId; label: string; hint: string }[] = [
  { id: "clasico", label: "CLÁSICO", hint: "Los colores del arcade original" },
  { id: "neon", label: "NEÓN", hint: "El look del Vault" },
  { id: "retro", label: "RETRO", hint: "Fósforo de CRT, sin brillo" },
];
export const DEFAULT_SKIN: SkinId = "clasico";
export function isSkinId(value: unknown): value is SkinId {
  return SKINS.some((s) => s.id === value);
}
export function isColorMode(value: unknown): value is ColorMode {
  return value === "dark" || value === "light";
}
/** La skin se recuerda por juego: cada uno tiene su favorita. */
export function skinStorageKey(gameId: string): string {
  return `av_skin_${gameId}`;
}
