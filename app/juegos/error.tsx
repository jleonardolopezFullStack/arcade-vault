"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { SignalLost } from "@/components/ui/signal-lost";
import { SIGNAL_LOST } from "@/lib/result";
/**
 * Red de seguridad de las rutas de juego.
 *
 * El detalle y el reproductor ya tratan el `Result` fallido con «SEÑAL
 * PERDIDA», pero hay un fallo que ocurre **antes** de llegar a ese código:
 * `generateStaticParams` llama a `listGameIds()`, que lanza a propósito si no
 * puede leer el catálogo, y con `dynamicParams = false` Next tiene que resolver
 * los params antes de renderizar nada. Sin este límite de error, eso es un 500
 * crudo en vez del panel del Vault.
 *
 * El boundary es de cliente por obligación de Next; `SignalLost` no usa nada de
 * servidor, así que se pinta aquí tal cual, y REINTENTAR vuelve a pedir la
 * misma ruta —que es literalmente reintentar la lectura—.
 */
export default function GamesError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  const pathname = usePathname();
  useEffect(() => {
    // El detalle crudo se queda en la consola; a pantalla solo va el mensaje
    // en español, sin nombres de tabla ni de proveedor.
    console.error("[juegos] fallo al resolver la ruta del juego:", error);
  }, [error]);
  return <SignalLost message={SIGNAL_LOST} retryHref={pathname} />;
}
