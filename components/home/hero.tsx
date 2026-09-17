import Link from "next/link";

import { FloatingSilhouettes } from "@/components/home/floating-silhouettes";
import { buttonStyles } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative flex min-h-[calc(100vh-60px)] items-center justify-center overflow-hidden px-8 pt-20 pb-15">
      <FloatingSilhouettes />

      <div className="relative z-[3] max-w-[1100px] text-center">
        <div className="neon-yellow mb-6 font-pixel text-[11px] leading-[1.25] tracking-[0.24em] uppercase">
          ▸ INSERTA UNA MONEDA<span className="blink">_</span>
        </div>

        <h1 className="m-0 flex flex-col gap-2 font-pixel text-[clamp(32px,7vw,88px)] leading-[1.05] tracking-[0.04em]">
          <span className="text-white [text-shadow:0_0_14px_rgba(255,255,255,0.4)]">
            EL ARCADE
          </span>
          <span className="grad-text grad-cyan">CLÁSICO ESTÁ</span>
          <span className="grad-text grad-magenta">DE VUELTA</span>
        </h1>

        <p className="mx-auto mt-7 mb-9 max-w-[640px] text-[15px] leading-[1.7] tracking-[0.04em] text-ink-dim">
          Juega los mejores clásicos directamente en tu navegador.
          <br />
          Sin descargas. Sin costo. Solo diversión.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/biblioteca"
            className={buttonStyles({ size: "xl", pulse: true })}
          >
            ▶ EXPLORAR JUEGOS
          </Link>
          <Link
            href="/acceso"
            className={buttonStyles({ variant: "magenta", size: "xl" })}
          >
            ✦ CREAR CUENTA
          </Link>
        </div>

        <div
          aria-hidden="true"
          className="absolute bottom-[-20px] left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 font-pixel text-[9px] tracking-[0.2em] text-ink-faint"
        >
          <span>DESLIZA</span>
          <span className="text-cyan [animation:bounce_1.6s_ease-in-out_infinite]">
            ▼
          </span>
        </div>
      </div>
    </section>
  );
}
