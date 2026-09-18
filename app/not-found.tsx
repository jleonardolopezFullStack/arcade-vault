import type { Metadata } from "next";
import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Cartucho no encontrado · Arcade Vault",
};

export default function NotFound() {
  return (
    <div className="fade-in mx-auto flex max-w-[1320px] flex-col items-center px-8 py-24 text-center max-[720px]:px-4 max-[720px]:py-16">
      <h1 className="neon-magenta m-0 font-pixel text-[clamp(28px,6vw,56px)] tracking-[0.08em]">
        GAME OVER
      </h1>

      <div className="mt-5 font-pixel text-sm tracking-[0.2em] text-yellow">
        ERROR 404
      </div>

      <p className="mt-4 mb-0 font-mono text-[13px] tracking-[0.14em] text-ink-dim">
        CARTUCHO NO ENCONTRADO<span className="blink">_</span>
      </p>

      <Link
        href="/biblioteca"
        className={buttonStyles({ size: "lg", className: "mt-10" })}
      >
        VOLVER AL VAULT
      </Link>
    </div>
  );
}
