import type { Metadata } from "next";
import { Suspense } from "react";
import { GameCard } from "@/components/library/game-card";
import { LibraryFilters } from "@/components/library/library-filters";
import { SignalLost } from "@/components/ui/signal-lost";
import { listGamesWithStats } from "@/lib/catalog";
export const metadata: Metadata = {
  title: "Biblioteca · Arcade Vault",
  description:
    "El catálogo completo de Arcade Vault: busca por nombre o filtra por categoría.",
};
function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}
/** Reconstruye la URL actual, para que REINTENTAR conserve búsqueda y filtro. */
function retryHref(q: string, cat: string): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (cat && cat !== "TODOS") params.set("cat", cat);
  const query = params.toString();
  return query ? `/biblioteca?${query}` : "/biblioteca";
}
export default async function Library({
  searchParams,
}: PageProps<"/biblioteca">) {
  // En Next 16 searchParams es una Promise.
  const params = await searchParams;
  const q = first(params.q);
  const cat = first(params.cat) || "TODOS";
  // El filtrado lo resuelve la consulta, no un `.filter()` en memoria.
  const result = await listGamesWithStats({ q, cat });
  return (
    <div className="fade-in">
      <section className="mx-auto max-w-[1320px] px-8 pt-16 pb-8 text-center max-[720px]:px-4 max-[720px]:pt-9 max-[720px]:pb-4">
        <h1 className="flicker m-0 bg-[linear-gradient(180deg,#fff_0%,var(--cyan)_60%,var(--magenta)_110%)] bg-clip-text font-pixel text-[clamp(28px,6vw,64px)] tracking-[0.06em] text-transparent drop-shadow-[0_0_12px_rgba(0,245,255,0.4)]">
          ARCADE VAULT
        </h1>
        <div className="mt-[18px] font-pixel text-[clamp(10px,1.6vw,14px)] tracking-[0.2em] text-yellow">
          INSERTA UNA MONEDA PARA JUGAR <span className="blink">_</span>
        </div>
      </section>
      {!result.ok ? (
        <SignalLost message={result.error} retryHref={retryHref(q, cat)} />
      ) : (
        <>
          <Suspense fallback={null}>
            <LibraryFilters q={q} cat={cat} />
          </Suspense>
          <div className="mx-auto mt-8 mb-20 grid max-w-[1320px] grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-[22px] px-8 max-[720px]:px-4">
            {result.data.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
            {result.data.length === 0 && (
              <div className="col-span-full p-20 text-center text-ink-faint">
                <div className="font-pixel uppercase leading-[1.25] mb-3 text-sm tracking-[0.04em] text-magenta">
                  NO HAY RESULTADOS
                </div>
                <div>Intenta otra búsqueda o categoría.</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
