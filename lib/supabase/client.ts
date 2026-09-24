import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { supabaseEnv } from "./env";
/**
 * Cliente de Supabase para componentes cliente.
 *
 * `createBrowserClient` ya memoiza la instancia por proceso, así que llamar a
 * esta función en cada componente no abre conexiones nuevas. La sesión vive en
 * cookies, no en localStorage: el mismo estado que lee el servidor.
 */
export function createClient() {
  const { url, publishableKey } = supabaseEnv();
  return createBrowserClient<Database>(url, publishableKey);
}
