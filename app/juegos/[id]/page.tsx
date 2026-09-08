import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Leaderboard } from "@/components/detail/leaderboard";
import { buttonStyles } from "@/components/ui/button";
import { GAMES, getGame } from "@/lib/data";
import { formatScore } from "@/lib/format";
import { detailSeed, seededScores } from "@/lib/scores";

export function generateStaticParams() {
  return GAMES.map((game) => ({ id: game.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/juegos/[id]">): Promise<Metadata> {
  const { id } = await params;
  const game = getGame(id);
  if (!game) return {};

  return {
    title: `${game.title} · Arcade Vault`,
    description: game.short,
  };
}

const TAG = "border border-line px-2.5 py-1.5 font-pixel text-[9px] tracking-[0.12em] text-ink-dim";
const STAT_LABEL =
  "font-mono text-[10px] tracking-[0.12em] text-ink-faint uppercase";
const STAT_VALUE = "mt-1.5 font-pixel text-base";

export default async function GameDetailPage({
  params,
}: PageProps<"/juegos/[id]">) {
  const { id } = await params;
  const game = getGame(id);
  if (!game) notFound();

  // Puro y determinista: se puede renderizar en servidor sin desajuste al hidratar.
  const scores = seededScores(detailSeed(id), 10);

  return (
    <div className="fade-in mx-auto my-12 grid max-w-[1320px] grid-cols-[1.4fr_1fr] gap-8 px-8 max-[900px]:grid-cols-1 max-[720px]:my-6 max-[720px]:px-4">
      <div>
        <div className="relative aspect-16/10 overflow-hidden border border-line">
          <div className={`cover-bg ${game.cover}`} />
        </div>

        <div className="mt-5 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <span className={TAG}>{game.cat}</span>
            <span className={TAG}>1 JUGADOR</span>
            <span className={TAG}>TECLADO / TÁCTIL</span>
            <span className={TAG}>RETRO 1985</span>
          </div>

          <h2 className="neon-cyan m-0 font-pixel text-[clamp(20px,3vw,32px)] tracking-[0.06em]">
            {game.title}
          </h2>

          <p className="m-0 text-sm leading-[1.7] text-ink-dim">{game.long}</p>

          <div className="mt-2 grid grid-cols-3 gap-px border border-line bg-line">
            <div className="bg-bg-2 p-[14px]">
              <div className={STAT_LABEL}>Partidas</div>
              <div
                className={`${STAT_VALUE} text-cyan [text-shadow:0_0_6px_rgba(0,245,255,0.5)]`}
              >
                {game.plays}
              </div>
            </div>
            <div className="bg-bg-2 p-[14px]">
              <div className={STAT_LABEL}>Mejor global</div>
              <div
                className={`${STAT_VALUE} text-magenta [text-shadow:0_0_6px_rgba(255,0,110,0.5)]`}
              >
                {formatScore(game.best)}
              </div>
            </div>
            <div className="bg-bg-2 p-[14px]">
              <div className={STAT_LABEL}>Dificultad</div>
              <div
                className={`${STAT_VALUE} text-yellow [text-shadow:0_0_6px_rgba(245,255,0,0.5)]`}
              >
                ★ ★ ★ ☆ ☆
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={`/juegos/${game.id}/jugar`}
              className={buttonStyles({ size: "xl", pulse: true })}
            >
              ▶ JUGAR AHORA
            </Link>
            <Link href="/" className={buttonStyles({ variant: "ghost", size: "lg" })}>
              VOLVER AL VAULT
            </Link>
          </div>
        </div>
      </div>

      <aside>
        <Leaderboard rows={scores} />
      </aside>
    </div>
  );
}
