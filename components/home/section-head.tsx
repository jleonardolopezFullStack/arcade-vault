import type { GameColor } from "@/lib/data";

/** Caja de las secciones con ancho contenido (`.home-section` del prototipo). */
export const HOME_SECTION = "mx-auto my-20 max-w-[1320px] px-8";

const KICKER: Record<GameColor, string> = {
  cyan: "neon-cyan",
  magenta: "neon-magenta",
  yellow: "neon-yellow",
  green: "neon-green",
};

type SectionHeadProps = {
  /** El «// 01» del prototipo. */
  kicker: string;
  title: string;
  color: GameColor;
};

export function SectionHead({ kicker, title, color }: SectionHeadProps) {
  return (
    <div className="mb-9 flex items-center gap-[18px]">
      <div
        className={`${KICKER[color]} font-pixel text-[11px] leading-[1.25] tracking-[0.22em] uppercase`}
      >
        {kicker}
      </div>
      <h2 className="m-0 font-pixel text-[clamp(18px,2.8vw,28px)] tracking-[0.06em] text-ink">
        {title}
      </h2>
      <div className="h-px flex-1 bg-[linear-gradient(90deg,var(--line),transparent)]" />
    </div>
  );
}
