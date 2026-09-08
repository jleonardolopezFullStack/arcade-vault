"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Chip } from "@/components/ui/chip";
import { CATS } from "@/lib/data";

const DEBOUNCE_MS = 250;

export function LibraryFilters({ q, cat }: { q: string; cat: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // El input es controlado en cliente; la URL va detrás, con debounce.
  const [draft, setDraft] = useState(q);
  const timer = useRef<number | undefined>(undefined);
  const typing = useRef(false);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Navegación externa (botón atrás, chip de categoría): resincroniza el input.
  useEffect(() => {
    if (!typing.current) setDraft(q);
  }, [q]);

  // `q` vacío y `cat=TODOS` se omiten de la URL para no ensuciarla.
  //
  // Los chips navegan con push: son acciones discretas y el botón atrás debe
  // deshacerlas. El buscador usa replace, para no dejar una entrada de
  // historial por cada tecla al escribir.
  const buildHref = (next: { q?: string; cat?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextQ = next.q ?? q;
    const nextCat = next.cat ?? cat;

    if (nextQ) params.set("q", nextQ);
    else params.delete("q");

    if (nextCat && nextCat !== "TODOS") params.set("cat", nextCat);
    else params.delete("cat");

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const onSearchChange = (value: string) => {
    setDraft(value);
    typing.current = true;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      typing.current = false;
      router.replace(buildHref({ q: value }), { scroll: false });
    }, DEBOUNCE_MS);
  };

  return (
    <div className="mx-auto mt-8 flex max-w-[1320px] flex-wrap gap-3 px-8 max-[720px]:px-4">
      <div className="relative flex h-12 min-w-[220px] flex-1 items-center gap-2.5 border border-line bg-bg-2 px-4 font-mono focus-within:border-cyan focus-within:shadow-[0_0_12px_rgba(0,245,255,0.35)]">
        <span aria-hidden="true" className="font-pixel text-[11px] text-cyan">
          ⌕
        </span>
        <input
          value={draft}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar un juego por nombre…"
          aria-label="Buscar un juego por nombre"
          className="flex-1 border-0 bg-transparent text-[13px] tracking-[0.04em] text-ink outline-0 placeholder:text-ink-faint"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {CATS.map((c) => (
          <Chip
            key={c}
            active={cat === c}
            onClick={() =>
              router.push(buildHref({ cat: c }), { scroll: false })
            }
          >
            {c}
          </Chip>
        ))}
      </div>
    </div>
  );
}
