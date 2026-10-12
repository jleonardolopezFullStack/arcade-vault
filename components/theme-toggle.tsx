"use client";
import { useCallback, useEffect, useState } from "react";
import type { ColorMode } from "@/lib/games/types";
// El modo vive en `data-theme` de <html>, que fija el script de app/layout.tsx
// antes del primer pintado. Este módulo solo lo lee y lo cambia: no hay
// contexto de React, así que el reproductor y la nav no se pisan.
const KEY = "av_theme";
function readMode(): ColorMode {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}
/**
 * Modo de color actual. `null` hasta montar: el servidor no sabe qué eligió el
 * usuario, así que nada que dependa del modo se pinta en el primer render.
 */
export function useColorMode(): ColorMode | null {
  const [mode, setMode] = useState<ColorMode | null>(null);
  // Hidratación: el modo es estado externo del navegador, igual que la sesión
  // en lib/session-context.tsx, y solo se lee al montar.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const root = document.documentElement;
    setMode(readMode());
    const observer = new MutationObserver(() => setMode(readMode()));
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    // Sin preferencia guardada, el sistema manda también en caliente.
    const query = window.matchMedia("(prefers-color-scheme: light)");
    const follow = () => {
      try {
        if (window.localStorage.getItem(KEY)) return;
      } catch {}
      root.dataset.theme = query.matches ? "light" : "dark";
    };
    query.addEventListener("change", follow);
    return () => {
      observer.disconnect();
      query.removeEventListener("change", follow);
    };
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  return mode;
}
/** Conmutador NOCHE / DÍA de la nav. Pulsarlo guarda la elección. */
export function ThemeToggle({
  className = "",
  tabIndex,
}: {
  className?: string;
  /** -1 dentro del menú lateral cerrado, como sus enlaces. */
  tabIndex?: number;
}) {
  const mode = useColorMode();
  const light = mode === "light";
  const toggle = useCallback(() => {
    const next: ColorMode = readMode() === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem(KEY, next);
    } catch {}
  }, []);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={light}
      aria-label="Modo claro"
      tabIndex={tabIndex}
      title={light ? "Apagar las luces" : "Encender las luces"}
      onClick={toggle}
      // Antes de montar no se sabe el modo: se reserva el hueco sin mentir.
      className={`inline-flex h-[30px] items-center gap-2 border border-line px-2.5 font-pixel text-[8px] tracking-[0.16em] text-ink-dim transition-colors duration-150 hover:border-ink-dim hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan ${mode === null ? "invisible" : ""} ${className}`}
    >
      {/* Luna: un círculo vaciado con una sombra interior. Sol: disco lleno con
          un anillo. Dibujados en CSS porque Press Start 2P no trae ☾ ni ☀. */}
      <span
        aria-hidden="true"
        className={
          light
            ? "size-2 rounded-full bg-yellow shadow-[0_0_0_2px_var(--bg),0_0_0_3px_var(--yellow)]"
            : "size-2.5 rounded-full shadow-[inset_-3px_-1px_0_0_var(--cyan)] -scale-x-100"
        }
      />
      <span>{light ? "DÍA" : "NOCHE"}</span>
    </button>
  );
}
