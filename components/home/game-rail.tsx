import Link from "next/link";

import { MiniCard } from "@/components/home/mini-card";
import { HOME_SECTION, SectionHead } from "@/components/home/section-head";
import { buttonStyles } from "@/components/ui/button";
import { GAMES } from "@/lib/data";

export function GameRail() {
  return (
    <div className={HOME_SECTION}>
      <SectionHead
        kicker="// 02"
        title="JUEGOS DISPONIBLES AHORA"
        color="cyan"
      />

      <div className="grid grid-cols-6 gap-4 max-[1100px]:grid-cols-3 max-[600px]:grid-cols-2">
        {GAMES.slice(0, 6).map((game) => (
          <MiniCard key={game.id} game={game} />
        ))}
      </div>

      <div className="mt-6 text-center">
        <Link href="/biblioteca" className={buttonStyles({ size: "lg" })}>
          VER TODOS LOS JUEGOS →
        </Link>
      </div>
    </div>
  );
}
