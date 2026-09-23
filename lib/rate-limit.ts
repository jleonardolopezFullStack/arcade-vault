/**
 * Límite de envíos del formulario de contacto, en memoria del proceso.
 *
 * Es deliberadamente modesto: corta el abuso trivial sin añadir servicios
 * externos ni variables de entorno. NO es una protección seria — el contador se
 * pierde en cada reinicio y no se comparte entre instancias serverless, donde
 * cada invocación puede arrancar en frío. Si el formulario recibe abuso de
 * verdad, esto hay que moverlo a un almacén compartido (riesgo 1 del spec 03).
 */

/** Ventana deslizante. */
const WINDOW_MS = 10 * 60 * 1000;

/** Envíos aceptados por IP dentro de la ventana. */
const MAX_HITS = 3;

/**
 * El Map cuelga de globalThis con un símbolo propio para sobrevivir al hot
 * reload de `next dev`, que reevalúa el módulo y perdería un `const` normal.
 */
const STORE = Symbol.for("arcade-vault.contact-rate-limit");

type RateLimitGlobal = typeof globalThis & {
  [STORE]?: Map<string, number[]>;
};

function hits(): Map<string, number[]> {
  const g = globalThis as RateLimitGlobal;
  g[STORE] ??= new Map<string, number[]>();
  return g[STORE];
}

/**
 * ¿Puede esta IP enviar un mensaje más?
 *
 * Devuelve `true` y anota el envío, o `false` si ya gastó su cupo. Las marcas
 * caducadas se purgan en cada consulta: no hay temporizador que limpiar.
 */
export function allowContact(ip: string): boolean {
  const store = hits();
  const now = Date.now();
  const fresh = (store.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);

  if (fresh.length >= MAX_HITS) {
    // Se reescribe igualmente para no dejar marcas caducadas en el cubo.
    store.set(ip, fresh);
    return false;
  }

  fresh.push(now);
  store.set(ip, fresh);
  return true;
}
