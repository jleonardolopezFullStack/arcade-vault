import { DIVIDER_PIXELS } from "@/lib/about-data";

/**
 * Banda decorativa entre «Acerca de» y «Contacto»: barra, 24 píxeles que
 * parpadean con retardo creciente, barra.
 *
 * El color de cada píxel sigue el patrón del prototipo (`:nth-child(3n)` y
 * `(5n)` sobre una base cian), aquí resuelto por índice para no añadir CSS.
 */

const BAR = "h-px flex-1";

function pixelTone(oneBased: number): string {
  if (oneBased % 5 === 0) return "bg-yellow shadow-[0_0_6px_var(--yellow)]";
  if (oneBased % 3 === 0) return "bg-magenta shadow-[0_0_6px_var(--magenta)]";
  return "bg-cyan shadow-[0_0_6px_var(--cyan)]";
}

export function AboutDivider() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto my-15 flex max-w-[1200px] items-center gap-4 px-8"
    >
      <div
        className={`${BAR} bg-[linear-gradient(90deg,transparent,var(--magenta),transparent)]`}
      />
      <div className="flex gap-1">
        {Array.from({ length: DIVIDER_PIXELS }, (_, i) => (
          <span
            key={i}
            style={{ animationDelay: `${i * 80}ms` }}
            className={`size-1.5 animate-[pxblink_2.4s_steps(2)_infinite] ${pixelTone(i + 1)}`}
          />
        ))}
      </div>
      <div
        className={`${BAR} bg-[linear-gradient(90deg,transparent,var(--magenta),transparent)]`}
      />
    </div>
  );
}
