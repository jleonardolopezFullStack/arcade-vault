"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { buttonStyles } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import type { Game } from "@/lib/catalog";
import { formatDate, formatScore } from "@/lib/format";
import { scoresFor, type LeaderboardsByGame } from "@/lib/leaderboard";
import { useSession } from "@/lib/session-context";
import { normalizeAlias } from "@/lib/submit-score";
const STAGGER_MS = 50;
const ROW =
  "grid grid-cols-[70px_1fr_1fr_140px] items-center gap-2.5 px-[18px] py-3 max-[720px]:grid-cols-[50px_1fr_90px_90px] max-[720px]:px-3 max-[720px]:py-2.5";
const ROW_TEXT = "font-mono text-[13px] max-[720px]:text-xs";
// Oro, plata y bronce para las tres primeras filas de la tabla.
const MEDALS = [
  "text-gold [text-shadow:0_0_6px_rgba(255,207,58,0.6)]",
  "text-silver",
  "text-bronze",
] as const;
const SLOTS = [
  {
    index: 1,
    rank: "02",
    border: "border-silver",
    ink: "text-silver",
    glow: "",
  },
  {
    index: 0,
    rank: "01",
    border: "border-gold",
    ink: "text-gold",
    glow: "shadow-[0_0_22px_rgba(255,207,58,0.35)]",
  },
  {
    index: 2,
    rank: "03",
    border: "border-bronze",
    ink: "text-bronze",
    glow: "",
  },
] as const;
/**
 * El Salón de la Fama.
 *
 * Sigue siendo cliente porque las pestañas son interacción, pero ya no consulta
 * nada: recibe los ocho rankings cargados por el servidor. Cambiar de pestaña
 * es cambiar de índice en un objeto que ya está en memoria.
 *
 * No hay bloque «tu mejor marca»: sin autenticación, «tuyo» solo significa «el
 * alias coincide», así que lo proporcionado es resaltar esa fila y llevar el
 * scroll hasta ella, no fabricar un apartado aparte.
 */
export function HallOfFame({
  games,
  boards,
}: {
  games: readonly Game[];
  boards: LeaderboardsByGame;
}) {
  const [tab, setTab] = useState(games[0]?.id ?? "");
  const { user } = useSession();
  const myRowRef = useRef<HTMLDivElement | null>(null);
  const game = games.find((g) => g.id === tab);
  const rows = scoresFor(boards, tab);
  // El alias se guarda normalizado en la base; se compara igual o nunca casa.
  const myAlias = user ? normalizeAlias(user.name) : null;
  // Llevar la vista hasta la fila propia al cambiar de pestaña. Si el alias no
  // está en este ranking, la ref es null y no se mueve nada.
  useEffect(() => {
    myRowRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [tab]);
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
        {games.map((g) => (
          <Chip key={g.id} active={tab === g.id} onClick={() => setTab(g.id)}>
            {g.title}
          </Chip>
        ))}
      </div>
      {rows.length === 0 ? (
        <div className="border border-line bg-bg-2 px-8 py-16 text-center">
          <div className="font-pixel text-[clamp(14px,3vw,20px)] tracking-[0.1em] text-cyan [text-shadow:0_0_10px_rgba(0,245,255,0.5)]">
            SÉ EL PRIMERO
          </div>
          <p className="mt-4 mb-0 text-sm leading-[1.7] text-ink-dim">
            Nadie ha dejado su marca en {game ? game.title : "este juego"}{" "}
            todavía.
          </p>
          {game && (
            <div className="mt-7">
              <Link
                href={`/juegos/${game.id}/jugar`}
                className={buttonStyles({ size: "lg", pulse: true })}
              >
                ▶ JUGAR AHORA
              </Link>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-[1fr_1.2fr_1fr] items-end gap-3.5 max-[720px]:grid-cols-1">
            {SLOTS.map(({ index, rank, border, ink, glow }) => {
              const row = rows[index];
              const champion = index === 0;
              return (
                <div
                  key={rank}
                  className={`relative border bg-bg-2 px-3.5 pt-[18px] pb-4 text-center ${border} ${glow} ${
                    row ? "" : "opacity-40"
                  }`}
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
                  {/* Un podio puede estar incompleto: dos marcas no inventan un tercero. */}
                  <div className="mt-2 font-pixel text-xs tracking-[0.06em]">
                    {row ? row.name : "—"}
                  </div>
                  <div
                    className={`mt-2 font-pixel text-cyan [text-shadow:0_0_8px_rgba(0,245,255,0.5)] ${
                      champion ? "text-xl" : "text-base"
                    }`}
                  >
                    {row ? formatScore(row.score) : "—"}
                  </div>
                  <div className="mt-1.5 font-mono text-[11px] tracking-[0.12em] text-ink-faint">
                    {row ? formatDate(row.at) : ""}
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
              <div>{game ? game.scoreLabel : "PUNTUACIÓN"}</div>
              <div>FECHA</div>
            </div>
            {rows.map((row, i) => {
              const medal = MEDALS[i];
              const mine = myAlias !== null && row.name === myAlias;
              return (
                <div
                  key={row.name}
                  ref={mine ? myRowRef : undefined}
                  style={{ animationDelay: `${i * STAGGER_MS}ms` }}
                  className={`${ROW} ${ROW_TEXT} animate-rise border-b border-line-2 opacity-0 ${
                    mine
                      ? "border-l-[3px] border-l-yellow bg-yellow/5 pl-[15px] max-[720px]:pl-2.5"
                      : ""
                  }`}
                >
                  <div
                    className={`font-pixel text-[11px] ${medal ?? "text-ink-dim"}`}
                  >
                    #{String(row.rank).padStart(2, "0")}
                  </div>
                  <div className={mine ? "text-yellow" : "text-ink"}>
                    {row.name}
                    {mine && (
                      <span className="ml-2 font-pixel text-[9px] tracking-[0.16em] text-yellow">
                        ▸ TÚ
                      </span>
                    )}
                  </div>
                  <div
                    className={`font-pixel text-xs ${
                      medal ??
                      "text-cyan [text-shadow:0_0_6px_rgba(0,245,255,0.4)]"
                    }`}
                  >
                    {formatScore(row.score)}
                  </div>
                  <div className="text-ink-faint">{formatDate(row.at)}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
      <div className="mt-8 text-center">
        <Link href="/biblioteca" className={buttonStyles({ size: "lg" })}>
          VOLVER A LA BIBLIOTECA
        </Link>
      </div>
    </div>
  );
}
