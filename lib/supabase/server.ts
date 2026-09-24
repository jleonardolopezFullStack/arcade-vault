import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import { supabaseEnv } from "./env";
/**
 * Cliente de Supabase para Server Components, Server Actions y route handlers.
 *
 * Es `async` porque en Next 16 `cookies()` se espera. Se crea uno nuevo por
 * petición: nunca se guarda en una variable de módulo, o una petición leería la
 * sesión de otra.
 */
export async function createClient() {
  const { url, publishableKey } = supabaseEnv();
  const cookieStore = await cookies();
  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Desde un Server Component no se pueden escribir cookies. No es un
          // fallo: el refresco de la sesión lo hace el proxy de la raíz.
        }
      },
    },
  });
}
