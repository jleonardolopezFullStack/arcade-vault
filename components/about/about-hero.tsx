import { HighlightIcon } from "@/components/about/highlight-icon";
import { ABOUT_MISSION, HIGHLIGHTS, type AboutHighlight } from "@/lib/about-data";

/** El color tiñe icono y borde de hover, vía currentColor. */
const TONE: Record<AboutHighlight["color"], string> = {
  cyan: "text-cyan",
  magenta: "text-magenta",
  green: "text-green",
};

export function AboutHero() {
  return (
    <section className="mx-auto max-w-[1100px] px-8 pt-20 pb-10 text-center">
      <div className="neon-yellow mb-[18px] font-pixel text-[11px] tracking-[0.24em] uppercase">
        ▸ ACERCA DE
      </div>

      <h1 className="grad-text grad-about m-0 font-pixel text-[clamp(26px,5vw,52px)] tracking-[0.06em]">
        ACERCA DE ARCADE VAULT
      </h1>

      <p className="mx-auto mt-7 max-w-[720px] text-[15px] leading-[1.8] tracking-[0.03em] text-ink-dim">
        {ABOUT_MISSION}
      </p>

      {/* Tres columnas por encima de 820px, una desde 820px incluido: la media
          query del prototipo es max-width, que incluye el límite; max-[820px]
          de Tailwind 4 sería `width < 820px`. */}
      <div className="mt-13 grid grid-cols-3 gap-[18px] [@media(max-width:820px)]:grid-cols-1">
        {HIGHLIGHTS.map((highlight) => (
          <div
            key={highlight.text}
            className={`${TONE[highlight.color]} flex items-center gap-4 border border-line bg-bg-2 px-5 py-[18px] text-left transition-[transform,border-color,box-shadow] duration-[220ms] hover:-translate-y-[3px] hover:border-current hover:shadow-[0_12px_28px_-14px_currentColor]`}
          >
            <HighlightIcon kind={highlight.icon} />
            <div className="font-pixel text-[10px] leading-[1.5] tracking-[0.1em] text-ink">
              {highlight.text}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
