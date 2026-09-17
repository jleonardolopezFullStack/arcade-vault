import { FeatureIcon } from "@/components/home/feature-icon";
import { HOME_SECTION, SectionHead } from "@/components/home/section-head";
import type { GameColor } from "@/lib/data";
import { FEATURES } from "@/lib/home-data";

// El color tiñe el icono, el título y el borde/resplandor del hover, todos
// vía currentColor.
const CARD_COLOR: Record<GameColor, string> = {
  cyan: "text-cyan",
  magenta: "text-magenta",
  yellow: "text-yellow",
  green: "text-green",
};

export function FeatureGrid() {
  return (
    <div className={HOME_SECTION}>
      <SectionHead
        kicker="// 01"
        title="¿POR QUÉ ARCADE VAULT?"
        color="magenta"
      />

      <div className="grid grid-cols-4 gap-[18px] max-[980px]:grid-cols-2 max-[520px]:grid-cols-1">
        {FEATURES.map((feature, i) => (
          <div
            key={feature.title}
            style={{ transitionDelay: `${i * 80}ms` }}
            className={`${CARD_COLOR[feature.color]} relative flex flex-col gap-[14px] border border-line bg-[linear-gradient(180deg,var(--bg-2),var(--bg-3))] px-5 py-6 transition-[transform,box-shadow,border-color] duration-[220ms] ease-out hover:-translate-y-1.5 hover:border-current hover:shadow-[0_18px_40px_-16px_currentColor,0_0_0_1px_currentColor]`}
          >
            <FeatureIcon kind={feature.icon} />
            <div className="font-pixel text-[12px] leading-[1.25] tracking-[0.1em] text-current uppercase [text-shadow:0_0_8px_currentColor]">
              {feature.title}
            </div>
            <div className="text-[13px] leading-[1.6] text-ink-dim">
              {feature.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
