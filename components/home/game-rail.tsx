import Link from "next/link";
import { MiniCard } from "@/components/home/mini-card";
import { HOME_SECTION, SectionHead } from "@/components/home/section-head";
import { buttonStyles } from "@/components/ui/button";
import type { Game } from "@/lib/catalog";
export function GameRail({ games }: { games: readonly Game[] }) {
  return (
    <div className={HOME_SECTION}>
      <SectionHead
        kicker="// 02"
        title="JUEGOS DISPONIBLES AHORA"
        color="cyan"
      />
      {games.length === 0 ? (
        // La landing no lleva «SEÑAL PERDIDA»: si el archivo no contesta se
        // calla el rail, pero el resto del escaparate sigue en pie.
        <p className="py-10 text-center font-mono text-[13px] text-ink-faint">
          El catálogo no está disponible ahora mismo.
        </p>
      ) : (
        <div className="grid grid-cols-6 gap-4 max-[1100px]:grid-cols-3 max-[600px]:grid-cols-2">
          {games.map((game) => (
            <MiniCard key={game.id} game={game} />
          ))}
        </div>
      )}
      <div className="mt-6 text-center">
        <Link href="/biblioteca" className={buttonStyles({ size: "lg" })}>
          VER TODOS LOS JUEGOS →
        </Link>
      </div>
    </div>
  );
}
