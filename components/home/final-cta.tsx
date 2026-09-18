import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";

// Los dos filetes de neón que enmarcan el bloque, arriba y abajo.
const HAIRLINES = [
  "before:absolute before:top-[30px] before:left-1/2 before:h-px before:w-[60%] before:-translate-x-1/2 before:bg-[linear-gradient(90deg,transparent,var(--cyan),transparent)] before:opacity-50 before:content-['']",
  "after:absolute after:bottom-[30px] after:left-1/2 after:h-px after:w-[60%] after:-translate-x-1/2 after:bg-[linear-gradient(90deg,transparent,var(--cyan),transparent)] after:opacity-50 after:content-['']",
].join(" ");

export function FinalCta() {
  return (
    <div
      className={`relative mx-auto max-w-[900px] px-8 pt-25 pb-30 text-center ${HAIRLINES}`}
    >
      <h2 className="grad-text grad-yellow m-0 mb-9 font-pixel text-[clamp(22px,4vw,40px)] leading-[1.25] tracking-[0.08em] uppercase">
        ¿LISTO PARA JUGAR?
      </h2>

      <Link
        href="/biblioteca"
        className={buttonStyles({
          size: "xl",
          pulse: true,
          className: "px-11 py-6 text-[14px] tracking-[0.2em]",
        })}
      >
        INSERTAR MONEDA →
      </Link>

      <div className="mt-7 text-[13px] tracking-[0.06em] text-ink-dim">
        Gratis. Sin registro obligatorio. Empieza en segundos.
      </div>
    </div>
  );
}
