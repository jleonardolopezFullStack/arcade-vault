import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
/**
 * En Next 16 este fichero se llama `proxy.ts`: la convención `middleware.ts`
 * está obsoleta y renombrada (ver la guía de `proxy` en node_modules/next/dist/docs).
 * Corre en runtime Node por defecto y no admite el ajuste `runtime`.
 *
 * Lo único que hace es refrescar la sesión de Supabase. No protege rutas.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}
export const config = {
  matcher: [
    /*
     * Todas las rutas menos los estáticos y las imágenes: ahí no hay sesión que
     * refrescar y sí latencia que ahorrar.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
