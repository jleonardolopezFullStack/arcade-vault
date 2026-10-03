"use server";
import { revalidatePath } from "next/cache";
import { allowScore, clientIp } from "@/lib/rate-limit";
import {
  normalizeAlias,
  SUBMIT_SCORE_ERROR_MESSAGES,
  type SubmitScoreErrorCode,
  type SubmitScoreState,
} from "@/lib/submit-score";
import { createClient } from "@/lib/supabase/server";
/**
 * Guardar la marca de una partida.
 *
 * Es la única puerta de escritura desde la aplicación, y escribe llamando a
 * `public.submit_score`, que es `security definer`: RLS deniega el `insert`
 * directo a `anon` en las ocho tablas de marcas, así que ni esta acción ni la
 * consola del navegador pueden saltarse la validación de la función.
 *
 * No tiene la forma de `useActionState` como el contacto: el modal de fin de
 * partida no es un formulario y necesita reintentar con los mismos argumentos.
 */
/** Códigos que `submit_score` lanza cuando los datos no le valen. */
const INPUT_ERROR_CODES = new Set([
  "22023", // juego desconocido, o alias vacío
  "22003", // puntuación fuera de rango (negativa o mayor que max_score)
]);
function fail(code: SubmitScoreErrorCode): SubmitScoreState {
  return { status: "error", code, message: SUBMIT_SCORE_ERROR_MESSAGES[code] };
}
export async function submitScore(
  gameId: string,
  rawName: string,
  score: number,
): Promise<SubmitScoreState> {
  // 1. Validación. La base valida lo mismo; esto evita el viaje de ida.
  const name = normalizeAlias(rawName);
  if (!gameId.trim() || name === "") {
    return fail("validation");
  }
  if (!Number.isInteger(score) || score < 0) {
    return fail("validation");
  }
  // 2. Límite por IP: 20 marcas cada 10 minutos, cubo propio.
  if (!allowScore(await clientIp())) {
    return fail("rate_limit");
  }
  // 3. Escritura.
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("submit_score", {
      p_game: gameId,
      p_name: name,
      p_score: score,
    });
    // El detalle de Postgres se queda en el servidor; al cliente va el mensaje.
    if (error) {
      console.error("[submitScore] la base rechazó la marca:", error);
      return fail(
        INPUT_ERROR_CODES.has(error.code) ? "validation" : "provider",
      );
    }
  } catch (cause) {
    console.error("[submitScore] fallo inesperado al guardar:", cause);
    return fail("provider");
  }
  // 4. Las dos pantallas que muestran rankings están prerrenderizadas, así que
  //    sin esto la marca no se vería hasta el siguiente despliegue.
  revalidatePath("/salon");
  revalidatePath("/juegos/[id]", "page");
  return { status: "ok" };
}
