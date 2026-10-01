/**
 * Resultado de una lectura de Supabase.
 *
 * Existe para que las pantallas distingan «no hay datos» de «no pude
 * preguntar». Con un `T | null` las dos cosas serían el mismo valor, y un fallo
 * de red se vería como un catálogo vacío: la pantalla diría que no hay juegos
 * en vez de decir que no hay señal.
 *
 * El texto de `error` es para el usuario, en español y sin detalles del
 * proveedor. El error crudo se queda en el servidor, en `console.error`.
 */
export type Result<T> = { ok: true; data: T } | { ok: false; error: string };
export const SIGNAL_LOST = "No se pudo contactar con el archivo del Vault.";
/** Registra el error real en el servidor y devuelve el mensaje de pantalla. */
export function readFailed(where: string, cause: unknown): Result<never> {
  console.error(`[${where}] lectura de Supabase fallida:`, cause);
  return { ok: false, error: SIGNAL_LOST };
}
