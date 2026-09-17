"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { buttonStyles } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { GAMES } from "@/lib/data";
import { formatDate, formatScore } from "@/lib/format";
import { bestScoreFor, type SavedScore } from "@/lib/local-scores";
import { hallSeed, seededScores } from "@/lib/scores";
import { useSession } from "@/lib/session-context";

const ROWS = 12;
const STAGGER_MS = 50;

const ROW = "grid grid-cols-[70px_1fr_1fr_140px] items-center gap-2.5 px-[18px] py-3 max-[720px]:grid-cols-[50px_1fr_90px_90px] max-[720px]:px-3 max-[720px]:py-2.5";
const ROW_TEXT = "font-mono text-[13px] max-[720px]:text-xs";

// Oro, plata y bronce para las tres primeras filas de la tabla.
const MEDALS = [
  "text-gold [text-shadow:0_0_6px_rgba(255,207,58,0.6)]",
  "text-silver",
  "text-bronze",
] as const;

const SLOTS = [
  { index: 1, rank: "02", border: "border-silver", ink: "text-silver", glow: "" },
  {
    index: 0,
    rank: "01",
    border: "border-gold",
    ink: "text-gold",
    glow: "shadow-[0_0_22px_rgba(255,207,58,0.35)]",
  },
  { index: 2, rank: "03", border: "border-bronze", ink: "text-bronze", glow: "" },
] as const;

export function HallOfFame() {
  const [tab, setTab] = useState(GAMES[0].id);
  const { user } = useSession();

  // localStorage solo tras montar: durante la hidratación no hay marca propia.
  const [myBest, setMyBest] = useState<SavedScore | null>(null);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setMyBest(bestScoreFor(tab));
  }, [tab]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const rows = useMemo(() => seededScores(hallSeed(tab), ROWS), [tab]);
  const game = GAMES.find((g) => g.id === tab);

  // Posición real de la marca propia entre las de la pestaña, no un número inventado.
  const myRank =
    myBest === null
      ? null
      : rows.filter((r) => r.score > myBest.score).length + 1;

  return (
    <div className="fade-in mx-auto mt-8 mb-20 max-w-[1200px] px-8 max-[720px]:px-4">
      <header className="mb-7 text-center">
        <h1 className="m-0 bg-[linear-gradient(180deg,var(--yellow),var(--magenta))] bg-clip-text font-pixel text-[clamp(24px,4.5vw,44px)] tracking-[0.08em] text-transparent drop-shadow-[0_0_14px_rgba(245,255,0,0.4)]">
          SALÓN DE LA FAMA
        </h1>
        <p className="font-pixel uppercase leading-[1.25] mt-3 mb-0 text-[10px] tracking-[0.1em] text-ink-dim">
          LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
        </p>
      </header>

      <div className="mb-[22px] flex flex-wrap justify-center gap-1.5">
        {GAMES.map((g) => (
          <Chip key={g.id} active={tab === g.id} onClick={() => setTab(g.id)}>
            {g.title}
          </Chip>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-[1fr_1.2fr_1fr] items-end gap-3.5 max-[720px]:grid-cols-1">
        {SLOTS.map(({ index, rank, border, ink, glow }) => {
          const row = rows[index];
          const champion = index === 0;
          return (
            <div
              key={rank}
              className={`relative border bg-bg-2 px-3.5 pt-[18px] pb-4 text-center ${border} ${glow}`}
            >
              {champion && (
                <div className="font-pixel uppercase leading-[1.25] text-[9px] tracking-[0.18em] text-gold">
                  CAMPEÓN
                </div>
              )}
              <div
                className={`font-pixel [text-shadow:0_0_12px_currentColor] ${ink} ${
                  champion ? "mt-1 text-4xl" : "text-[28px]"
                }`}
              >
                {rank}
              </div>
              <div className="mt-2 font-pixel text-xs tracking-[0.06em]">
                {row.name}
              </div>
              <div
                className={`mt-2 font-pixel text-cyan [text-shadow:0_0_8px_rgba(0,245,255,0.5)] ${
                  champion ? "text-xl" : "text-base"
                }`}
              >
                {formatScore(row.score)}
              </div>
              <div className="mt-1.5 font-mono text-[11px] tracking-[0.12em] text-ink-faint">
                {row.date}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border border-line bg-bg-2">
        <div
          className={`${ROW} border-b border-line font-pixel text-[10px] tracking-[0.16em] text-ink-faint max-[720px]:text-[10px]`}
        >
          <div>RANGO</div>
          <div>JUGADOR</div>
          <div>PUNTUACIÓN</div>
          <div>FECHA</div>
        </div>

        {rows.map((row, i) => {
          const medal = MEDALS[i];
          return (
            <div
              key={`${row.name}${i}`}
              style={{ animationDelay: `${i * STAGGER_MS}ms` }}
              className={`${ROW} ${ROW_TEXT} animate-rise border-b border-line-2 opacity-0`}
            >
              <div className={`font-pixel text-[11px] ${medal ?? "text-ink-dim"}`}>
                #{String(row.rank).padStart(2, "0")}
              </div>
              <div className="text-ink">{row.name}</div>
              <div
                className={`font-pixel text-xs ${
                  medal ?? "text-cyan [text-shadow:0_0_6px_rgba(0,245,255,0.4)]"
                }`}
              >
                {formatScore(row.score)}
              </div>
              <div className="text-ink-faint">{row.date}</div>
            </div>
          );
        })}

        {user && myBest && myRank !== null && game && (
          <>
            <div className="border-b border-line-2 bg-yellow/4 px-[18px] py-2 font-pixel text-[9px] tracking-[0.16em] text-yellow max-[720px]:px-3">
              ▸ TU MEJOR MARCA EN {game.title}
            </div>
            <div
              style={{ animationDelay: `${(rows.length + 1) * STAGGER_MS}ms` }}
              className={`${ROW} ${ROW_TEXT} animate-rise border-b border-line-2 border-l-[3px] border-l-yellow bg-yellow/5 pl-[15px] opacity-0 max-[720px]:pl-2.5`}
            >
              <div className="font-pixel text-[11px] text-yellow">
                #{String(myRank).padStart(2, "0")}
              </div>
              <div className="text-yellow">{myBest.name}</div>
              <div className="font-pixel text-xs text-yellow [text-shadow:0_0_6px_rgba(245,255,0,0.5)]">
                {formatScore(myBest.score)}
              </div>
              <div className="text-ink-faint">{formatDate(myBest.at)}</div>
            </div>
          </>
        )}
      </div>

      <div className="mt-8 text-center">
        <Link href="/biblioteca" className={buttonStyles({ size: "lg" })}>
          VOLVER A LA BIBLIOTECA
        </Link>
      </div>
    </div>
  );
}
