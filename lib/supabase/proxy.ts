import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { supabaseEnv } from "./env";
/**
 * Refresco de la cookie de sesión, invocado desde el `proxy.ts` de la raíz.
 *
 * NO redirige a nadie: todavía no hay pantallas protegidas (spec 04). Lo único
 * que hace es mantener viva la sesión para que servidor y navegador no se
 * desincronicen.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  // El cliente se crea en cada petición a propósito: guardarlo en una variable
  // de módulo mezclaría la sesión de unos usuarios con la de otros.
  const { url, publishableKey } = supabaseEnv();
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        supabaseResponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
        for (const [key, value] of Object.entries(headers)) {
          supabaseResponse.headers.set(key, value);
        }
      },
    },
  });
  // No metas código entre createServerClient y getClaims(): un despiste aquí
  // provoca cierres de sesión aleatorios, imposibles de depurar.
  await supabase.auth.getClaims();
  // Hay que devolver `supabaseResponse` tal cual. Si algún día se construye
  // otra respuesta, debe copiarle las cookies o el navegador y el servidor
  // acabarán desincronizados y la sesión se cerrará antes de tiempo.
  return supabaseResponse;
}
