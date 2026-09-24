import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
/**
 * Diagnóstico de la conexión con Supabase.
 *
 * `getClaims()` sirve de prueba de vida sin depender del esquema: verifica que
 * la URL y la publishable key son válidas aunque no exista ni una tabla.
 *
 * La respuesta nunca incluye la URL del proyecto, la clave ni datos del
 * usuario: solo si la conexión responde y si la petición traía sesión.
 */
export const dynamic = "force-dynamic";
type HealthOk = { ok: true; hasSession: boolean };
type HealthError = { ok: false; error: string };
export async function GET(): Promise<NextResponse<HealthOk | HealthError>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok: true, hasSession: data?.claims != null });
  } catch (cause) {
    // Incluye el error de configuración de supabaseEnv() cuando falta una
    // variable de entorno.
    const error = cause instanceof Error ? cause.message : "Error desconocido";
    return NextResponse.json({ ok: false, error }, { status: 503 });
  }
}
