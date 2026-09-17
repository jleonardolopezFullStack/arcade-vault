import Link from "next/link";

import { HOME_SECTION, SectionHead } from "@/components/home/section-head";
import { Panel } from "@/components/ui/panel";
import type { GameColor } from "@/lib/data";
import { formatScore } from "@/lib/format";
import { ACTIVITY, TOP_PLAYERS } from "@/lib/home-data";

const NEON: Record<GameColor, string> = {
  cyan: "neon-cyan",
  magenta: "neon-magenta",
  yellow: "neon-yellow",
  green: "neon-green",
};

const CARD_HEAD =
  "flex min-w-0 items-center justify-between gap-[10px] border-b border-line px-[14px] py-3";
const CARD_TITLE =
  "min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-pixel text-[10px] leading-[1.25] tracking-[0.1em] text-cyan uppercase [text-shadow:0_0_8px_rgba(0,245,255,0.5)]";

// Barra de relleno de cada puesto: se tiñe con el metal del podio y se
// desvanece hacia la derecha.
const BAR_TINT = [
  "bg-[linear-gradient(90deg,rgba(255,207,58,0.14),transparent)]",
  "bg-[linear-gradient(90deg,rgba(199,208,224,0.10),transparent)]",
  "bg-[linear-gradient(90deg,rgba(217,122,58,0.10),transparent)]",
] as const;
const BAR_REST = "bg-[linear-gradient(90deg,rgba(0,245,255,0.06),transparent)]";

const RANK_TINT = [
  "text-gold [text-shadow:0_0_6px_rgba(255,207,58,0.6)]",
  "text-silver",
  "text-bronze",
] as const;
const RANK_REST = "text-ink-faint";
const SCORE_REST = "text-cyan [text-shadow:0_0_6px_rgba(0,245,255,0.4)]";

export function Activity() {
  return (
    <div className={HOME_SECTION}>
      <SectionHead kicker="// 03" title="ACTIVIDAD EN VIVO" color="yellow" />

      <div className="grid grid-cols-[1.2fr_1fr] gap-[18px] max-[900px]:grid-cols-1">
        <Panel>
          <div className={CARD_HEAD}>
            <div className={CARD_TITLE}>▸ ÚLTIMAS PUNTUACIONES</div>
          </div>

          <div className="max-h-[360px] overflow-hidden py-1.5">
            {ACTIVITY.map((row, i) => (
              <div
                key={`${row.player}-${row.game}`}
                style={{ animationDelay: `${i * 60}ms` }}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-b border-line-2 px-[18px] py-[11px] font-mono text-[13px] opacity-0 [animation:tickin_360ms_ease-out_forwards] max-[520px]:grid-cols-[1fr_auto] max-[520px]:gap-y-1"
              >
                <span
                  className={`${NEON[row.color]} font-pixel text-[10px] tracking-[0.06em]`}
                >
                  {row.player}
                </span>
                <span className="text-[12px] text-ink-dim max-[520px]:col-span-full">
                  ▸ {row.game}
                </span>
                <span className="font-pixel text-[11px] text-yellow [text-shadow:0_0_6px_rgba(245,255,0,0.5)]">
                  +{formatScore(row.score)}
                </span>
                <span className="text-[11px] tracking-[0.08em] text-ink-faint max-[520px]:col-span-full">
                  {row.when}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className={CARD_HEAD}>
            <div className={CARD_TITLE}>▸ TOP JUGADORES · HOY</div>
            <Link
              href="/salon"
              className="border border-line px-[10px] py-1.5 font-pixel text-[9px] tracking-[0.14em] text-ink-dim hover:border-magenta hover:text-magenta hover:shadow-[0_0_8px_rgba(255,0,110,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
            >
              VER SALÓN →
            </Link>
          </div>

          <div className="flex flex-col gap-[10px] px-[18px] pt-[10px] pb-[18px]">
            {TOP_PLAYERS.map((row, i) => (
              <div
                key={row.player}
                className="relative grid grid-cols-[36px_1fr_auto] items-center gap-[10px] py-2 font-mono"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-0 left-9 z-0"
                >
                  <span
                    style={{ width: `${100 - i * 16}%` }}
                    className={`block h-full ${BAR_TINT[i] ?? BAR_REST}`}
                  />
                </span>

                <span
                  className={`relative z-[1] font-pixel text-[10px] ${RANK_TINT[i] ?? RANK_REST}`}
                >
                  #{String(row.rank).padStart(2, "0")}
                </span>
                <span className="relative z-[1] font-pixel text-[11px] tracking-[0.06em] text-ink">
                  {row.player}
                </span>
                <span
                  className={`relative z-[1] font-pixel text-[11px] ${RANK_TINT[i] ?? SCORE_REST}`}
                >
                  {formatScore(row.score)}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
