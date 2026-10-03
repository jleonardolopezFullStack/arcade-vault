/**
 * Límites de envío por IP, en memoria del proceso.
 *
 * Es deliberadamente modesto: corta el abuso trivial sin añadir servicios
 * externos ni variables de entorno. NO es una protección seria — el contador se
 * pierde en cada reinicio y no se comparte entre instancias serverless, donde
 * cada invocación puede arrancar en frío. Si llega abuso de verdad, esto hay que
 * moverlo a un almacén compartido o a la propia base (riesgo 1 del spec 03,
 * riesgo 7 del spec 06).
 *
 * Cada cubo tiene su propio símbolo y sus propios límites: los mensajes de
 * contacto y las marcas de juego no se comen la cuota mutuamente.
 */
import { headers } from "next/headers";
/** Ventana deslizante, común a los dos cubos. */
const WINDOW_MS = 10 * 60 * 1000;
/**
 * Los Map cuelgan de globalThis con un símbolo propio para sobrevivir al hot
 * reload de `next dev`, que reevalúa el módulo y perdería un `const` normal.
 */
const CONTACT_STORE = Symbol.for("arcade-vault.contact-rate-limit");
const SCORE_STORE = Symbol.for("arcade-vault.score-rate-limit");
type Bucket = typeof CONTACT_STORE | typeof SCORE_STORE;
type RateLimitGlobal = typeof globalThis & {
  [key: symbol]: Map<string, number[]> | undefined;
};
function hits(bucket: Bucket): Map<string, number[]> {
  const g = globalThis as RateLimitGlobal;
  g[bucket] ??= new Map<string, number[]>();
  return g[bucket];
}
/**
 * ¿Puede esta IP gastar un envío más de este cubo?
 *
 * Devuelve `true` y anota el envío, o `false` si ya gastó su cupo. Las marcas
 * caducadas se purgan en cada consulta: no hay temporizador que limpiar.
 */
function allow(bucket: Bucket, ip: string, maxHits: number): boolean {
  const store = hits(bucket);
  const now = Date.now();
  const fresh = (store.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (fresh.length >= maxHits) {
    // Se reescribe igualmente para no dejar marcas caducadas en el cubo.
    store.set(ip, fresh);
    return false;
  }
  fresh.push(now);
  store.set(ip, fresh);
  return true;
}
/** Mensajes del formulario de contacto: 3 cada 10 minutos. */
export function allowContact(ip: string): boolean {
  return allow(CONTACT_STORE, ip, 3);
}
/** Marcas guardadas al terminar una partida: 20 cada 10 minutos. */
export function allowScore(ip: string): boolean {
  return allow(SCORE_STORE, ip, 20);
}
/**
 * Primer valor de x-forwarded-for; "unknown" comparte cubo si no hay cabecera.
 *
 * Vive aquí y no en cada Server Action porque las dos que limitan por IP tienen
 * que keyear el cubo exactamente igual.
 */
export async function clientIp(): Promise<string> {
  const forwarded = (await headers()).get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
