"use client";
import { SKINS } from "@/lib/games/appearance";
import type { SkinId } from "@/lib/games/types";
/**
 * Selector de skin del reproductor, junto a PAUSA, FIN y SALIR.
 *
 * Es un grupo de radios con aspecto de fila de botones de mueble arcade. No
 * escucha teclas propias: `P` y `Escape` siguen siendo de la plataforma, y las
 * flechas y el espacio del motor.
 */
export function SkinPicker({
  value,
  onChange,
}: {
  value: SkinId;
  onChange: (skin: SkinId) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Skin del juego"
      className="flex items-stretch border border-line"
    >
      {SKINS.map(({ id, label, hint }) => {
        const active = id === value;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            title={hint}
            // Con el ratón no se queda el foco en el botón: si se quedara, el
            // espacio del juego volvería a pulsarlo.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onChange(id)}
            className={`px-3 font-pixel text-[9px] tracking-[0.14em] transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan ${
              active
                ? "bg-ink text-bg"
                : "text-ink-dim hover:bg-bg-3 hover:text-ink"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
