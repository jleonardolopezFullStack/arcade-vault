import { Panel } from "@/components/ui/panel";
import { formatDate, formatScore } from "@/lib/format";
import type { ScoreRow } from "@/lib/leaderboard";

// Oro, plata y bronce para el podio; el resto en cian.
const MEDALS = [
  "text-gold [text-shadow:0_0_6px_rgba(255,207,58,0.6)]",
  "text-silver [text-shadow:0_0_6px_rgba(199,208,224,0.5)]",
  "text-bronze [text-shadow:0_0_6px_rgba(217,122,58,0.5)]",
] as const;

const ROW_GRID = "grid grid-cols-[36px_1fr_110px] items-center gap-2.5 px-4";

/**
 * El ranking de un juego, tal como lo devuelve `top_scores()`.
 *
 * No ordena ni recorta: eso ya lo hizo la base con las reglas del juego. La
 * cabecera de la columna de marcas lleva el `score_label` del catálogo, porque
 * no todos los juegos puntúan en puntos.
 */
export function Leaderboard({
  rows,
  scoreLabel,
}: {
  rows: readonly ScoreRow[];
  scoreLabel: string;
}) {
  return (
    <Panel as="section" aria-labelledby="leaderboard-title">
      <h3
        id="leaderboard-title"
        className="m-0 border-b border-line px-4 py-[14px] font-pixel text-[11px] tracking-[0.14em] text-magenta [text-shadow:0_0_8px_rgba(255,0,110,0.5)]"
      >
        MEJORES PUNTUACIONES
      </h3>

      {rows.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <div className="font-pixel text-sm leading-[1.25] tracking-[0.04em] text-cyan [text-shadow:0_0_8px_rgba(0,245,255,0.5)]">
            SÉ EL PRIMERO
          </div>
          <p className="mt-3 mb-0 text-[13px] leading-[1.7] text-ink-faint">
            Nadie ha dejado su marca todavía.
          </p>
        </div>
      ) : (
        <>
          <div
            className={`${ROW_GRID} border-b border-line-2 py-2 font-mono text-[10px] tracking-[0.12em] text-ink-faint uppercase`}
          >
            <div>#</div>
            <div>Jugador</div>
            <div className="text-right">{scoreLabel}</div>
          </div>

          {rows.map((row, i) => {
            const medal = MEDALS[i];
            return (
              <div
                key={row.name}
                className={`${ROW_GRID} border-b border-line-2 py-2.5 font-mono text-[13px]`}
              >
                <div
                  className={`font-pixel text-[11px] ${medal ?? "text-ink-faint"}`}
                >
                  #{String(row.rank).padStart(2, "0")}
                </div>
                <div className="text-ink">
                  {row.name}
                  <div className="text-[10px] tracking-[0.1em] text-ink-faint">
                    {formatDate(row.at)}
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
        </>
      )}
    </Panel>
  );
}
