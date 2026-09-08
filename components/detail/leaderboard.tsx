import { Panel } from "@/components/ui/panel";
import { formatScore } from "@/lib/format";
import type { ScoreRow } from "@/lib/scores";

// Oro, plata y bronce para el podio; el resto en cian.
const MEDALS = [
  "text-gold [text-shadow:0_0_6px_rgba(255,207,58,0.6)]",
  "text-silver [text-shadow:0_0_6px_rgba(199,208,224,0.5)]",
  "text-bronze [text-shadow:0_0_6px_rgba(217,122,58,0.5)]",
] as const;

export function Leaderboard({ rows }: { rows: readonly ScoreRow[] }) {
  return (
    <Panel as="section" aria-labelledby="leaderboard-title">
      <h3
        id="leaderboard-title"
        className="m-0 border-b border-line px-4 py-[14px] font-pixel text-[11px] tracking-[0.14em] text-magenta [text-shadow:0_0_8px_rgba(255,0,110,0.5)]"
      >
        MEJORES PUNTUACIONES
      </h3>

      {rows.map((row, i) => {
        const medal = MEDALS[i];
        return (
          <div
            key={row.name}
            className="grid grid-cols-[36px_1fr_110px] items-center gap-2.5 border-b border-line-2 px-4 py-2.5 font-mono text-[13px]"
          >
            <div
              className={`font-pixel text-[11px] ${medal ?? "text-ink-faint"}`}
            >
              #{String(row.rank).padStart(2, "0")}
            </div>
            <div className="text-ink">
              {row.name}
              <div className="text-[10px] tracking-[0.1em] text-ink-faint">
                {row.date}
              </div>
            </div>
            <div
              className={`text-right font-pixel text-xs ${medal ?? "text-cyan"}`}
            >
              {formatScore(row.score)}
            </div>
          </div>
        );
      })}
    </Panel>
  );
}
