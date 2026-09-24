/**
 * Configuración de Supabase leída del entorno.
 *
 * Se invoca al crear cada cliente, nunca al cargar el módulo: la aplicación
 * tiene que seguir compilando y sirviendo /, /biblioteca o /acerca-de aunque
 * no exista .env.local. Quien pida un cliente sin configuración, se lleva un
 * error que dice exactamente qué falta (spec 04, decisión «fallo explícito»).
 *
 * Las dos variables se leen con acceso estático a `process.env.X`, y no con
 * `process.env[nombre]`: el bundler solo sustituye la forma literal, así que
 * con clave dinámica llegarían vacías al navegador.
 */
export type SupabaseEnv = {
  url: string;
  publishableKey: string;
};
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Falta ${name} en .env.local — ver .env.template`);
  }
  return value;
}
export function supabaseEnv(): SupabaseEnv {
  return {
    url: required(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    publishableKey: required(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
  };
}
