/**
 * Contrato compartido entre el modal de fin de partida y su Server Action.
 *
 * Mismo reparto que `lib/contact.ts` en SPEC 03: el tipo del resultado y los
 * mensajes viven aquí para que el componente de cliente los importe sin tocar
 * el módulo `"use server"`.
 *
 * Los límites repiten lo que ya obliga la base: `char_length(name) between 1
 * and 10` en las ocho tablas de marcas, y el recorte a mayúsculas que hace
 * `public.submit_score`. Se validan aquí también porque el cliente se puede
 * sortear y porque es mejor decirle «ese alias está vacío» que esperar a que
 * Postgres lance una excepción.
 */
export const SCORE_LIMITS = {
  nameMin: 1,
  nameMax: 10,
} as const;
export type SubmitScoreErrorCode =
  | "validation" // alias vacío, o puntuación que no es un entero válido
  | "rate_limit" // demasiadas marcas desde la misma IP
  | "provider"; // la base rechazó la escritura o no contestó
export type SubmitScoreState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "ok" }
  | { status: "error"; code: SubmitScoreErrorCode; message: string };
/**
 * Mensajes por defecto de cada código. Ninguno menciona a Postgres, ni códigos
 * de error, ni nombres de tabla: lo que se filtre aquí acaba en pantalla.
 */
export const SUBMIT_SCORE_ERROR_MESSAGES: Record<SubmitScoreErrorCode, string> =
  {
    validation: "Esa marca no es válida. Revisa el alias.",
    rate_limit:
      "Demasiadas marcas seguidas. Espera unos minutos antes de reintentar.",
    provider: "No se pudo guardar la marca en el archivo del Vault.",
  };
export const SUBMIT_SCORE_IDLE: SubmitScoreState = { status: "idle" };
/** Lo mismo que hace `submit_score` en la base, para no enviar basura. */
export function normalizeAlias(raw: string): string {
  return raw.trim().toUpperCase().slice(0, SCORE_LIMITS.nameMax);
}
