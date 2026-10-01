import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { supabaseEnv } from "./env";
/**
 * Cliente de Supabase para datos PÚBLICOS, sin cookies.
 *
 * PARA QUÉ ES
 *   El catálogo y los rankings: `games`, `game_stats` y `top_scores()`. Son
 *   datos que RLS concede a `anon`, iguales para todo el mundo, y que no
 *   dependen de quién los pida.
 *
 *   También es el único que sirve en `generateStaticParams()`, que corre en
 *   build y no tiene petición de la que sacar cookies: llamar allí al cliente
 *   de `server.ts` rompe la compilación.
 *
 * PARA QUÉ NO ES
 *   Cualquier cosa que dependa de la sesión. Este cliente lee siempre como
 *   anónimo, así que cuando exista auth de verdad devolvería datos de invitado
 *   aunque el usuario tuviera sesión abierta, **sin dar ningún error**: el
 *   fallo se vería como datos ajenos, no como una excepción.
 *   Para eso está `server.ts` (con cookies) o `client.ts` (en el navegador).
 *
 * Se crea uno nuevo en cada llamada. No guarda estado ni sesión —`persistSession`
 * va a false—, así que no hay nada que compartir entre peticiones y sí hay algo
 * que evitar: una instancia de módulo viva entre renders del servidor.
 */
export function createReadClient() {
  const { url, publishableKey } = supabaseEnv();
  return createSupabaseClient<Database>(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
