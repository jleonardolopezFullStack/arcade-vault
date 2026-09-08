"use client";

import Link from "next/link";
import { useRef } from "react";

import { buttonStyles, type ButtonVariant } from "@/components/ui/button";
import type { Game } from "@/lib/data";
import { formatScore } from "@/lib/format";

// El prototipo solo tiene variantes magenta y amarilla; el resto cae en cian.
function playVariant(color: Game["color"]): ButtonVariant {
  return color === "magenta" || color === "yellow" ? color : "cyan";
}

export function GameCard({ game }: { game: Game }) {
  const tiltRef = useRef<HTMLAnchorElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = tiltRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `translateY(-6px) rotateX(${-py * 6}deg) rotateY(${px * 8}deg)`;
  };

  const onLeave = () => {
    const el = tiltRef.current;
    if (el) el.style.transform = "";
  };

  return (
    <Link
      ref={tiltRef}
      href={`/juegos/${game.id}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="group relative flex flex-col gap-[14px] border border-line bg-[linear-gradient(180deg,var(--bg-2),var(--bg-3))] p-[14px] [transform-style:preserve-3d] transition-[transform,box-shadow,border-color] duration-200 ease-out will-change-transform hover:border-cyan hover:shadow-[0_18px_40px_-10px_rgba(0,245,255,0.4),0_0_0_1px_rgba(0,245,255,0.3)] before:pointer-events-none before:absolute before:-inset-px before:bg-[linear-gradient(135deg,transparent_60%,rgba(0,245,255,0.4))] before:opacity-0 before:transition-opacity before:duration-[180ms] hover:before:opacity-50"
    >
      <div className="relative aspect-4/3 overflow-hidden border border-line-2">
        <div className={`cover-bg ${game.cover}`} />
        <div className="absolute bottom-2 left-2 z-2 border border-line bg-black/60 px-1.5 py-1 font-pixel text-[8px] text-cyan">
          {game.cat}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="font-pixel text-[13px] tracking-[0.06em] text-ink">
          {game.title}
        </div>
        <div className="min-h-9 text-xs text-ink-dim">{game.short}</div>

        <div className="mt-1 flex items-center justify-between gap-2.5">
          <div className="flex flex-col font-mono text-[10px] tracking-[0.08em] text-ink-faint uppercase">
            <span>MEJOR PUNTUACIÓN</span>
            <b className="font-pixel text-xs tracking-[0.06em] text-yellow [text-shadow:0_0_6px_rgba(245,255,0,0.6)]">
              {formatScore(game.best)}
            </b>
          </div>
          <span className={buttonStyles({ variant: playVariant(game.color) })}>
            JUGAR
          </span>
        </div>
      </div>
    </Link>
  );
}
