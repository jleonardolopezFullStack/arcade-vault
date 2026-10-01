import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
/**
 * Lo que se ve cuando el archivo del Vault no contesta.
 *
 * No es lo mismo que una lista vacía: un catálogo sin juegos diría que no hay
 * nada que jugar, cuando lo que pasa es que no se pudo preguntar. Por eso las
 * lecturas devuelven `Result` y esta pantalla existe.
 *
 * El reintento es un enlace y no un botón con `onClick`: la página se renderiza
 * en el servidor, así que volver a pedirla es literalmente recargar la ruta, y
 * así el componente se queda sin JavaScript de cliente.
 */
export function SignalLost({
  message,
  retryHref,
}: {
  message: string;
  retryHref: string;
}) {
  return (
    <Panel
      as="section"
      tone="magenta"
      glow
      inner
      className="mx-auto my-16 max-w-[560px] px-8 py-12 text-center max-[720px]:my-8 max-[720px]:px-5"
      role="alert"
    >
      <div className="font-pixel text-[clamp(14px,3vw,20px)] tracking-[0.12em] text-magenta [text-shadow:0_0_10px_rgba(255,0,110,0.6)]">
        SEÑAL PERDIDA
      </div>
      <div className="mt-2 font-pixel text-[9px] tracking-[0.2em] text-ink-faint">
        ── ── ── <span className="blink">_</span>
      </div>
      <p className="mt-6 mb-0 text-sm leading-[1.7] text-ink-dim">{message}</p>
      <div className="mt-8">
        <Link href={retryHref} className={buttonStyles({ variant: "magenta" })}>
          REINTENTAR
        </Link>
      </div>
    </Panel>
  );
}
