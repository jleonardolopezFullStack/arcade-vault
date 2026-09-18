import Link from "next/link";

import type { Game } from "@/lib/data";

export function MiniCard({ game }: { game: Game }) {
  return (
    <Link
      href={`/juegos/${game.id}`}
      className="block border border-line bg-bg-2 transition-[transform,border-color] duration-[180ms] hover:-translate-y-1 hover:border-cyan focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
    >
      <div className="relative aspect-square overflow-hidden">
        <div className={`cover-bg ${game.cover}`} />
      </div>
      <div className="px-3 py-[10px]">
        <div className="font-pixel text-[10px] tracking-[0.06em]">
          {game.title}
        </div>
        <div className="mt-1 font-mono text-[10px] tracking-[0.14em] text-ink-faint">
          {game.cat}
        </div>
      </div>
    </Link>
  );
}
