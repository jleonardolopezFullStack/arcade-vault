import Link from "next/link";

import { HOME_SECTION, SectionHead } from "@/components/home/section-head";
import { buttonStyles } from "@/components/ui/button";
import { FAQ, PLAN_FEATURES } from "@/lib/home-data";

// El borde izquierdo de cada pregunta rota entre los tres colores del tema.
const FAQ_ACCENT = ["border-l-cyan", "border-l-magenta", "border-l-yellow"];

export function Pricing() {
  return (
    <div className={HOME_SECTION}>
      <SectionHead kicker="// 04" title="PRECIOS" color="green" />

      <div className="grid grid-cols-2 items-stretch gap-6 max-[900px]:grid-cols-1">
        <div className="relative flex flex-col gap-[14px] border border-green bg-[linear-gradient(180deg,var(--bg-2),#0a0e16)] px-7 py-8 shadow-[0_0_28px_rgba(0,255,136,0.18),inset_0_0_14px_rgba(0,255,136,0.08)] before:pointer-events-none before:absolute before:inset-1 before:border before:border-dashed before:border-[rgba(0,255,136,0.3)] before:content-['']">
          <div className="font-pixel text-[9px] leading-[1.25] tracking-[0.22em] text-ink-dim uppercase">
            PLAN ÚNICO
          </div>
          <div className="font-pixel text-[16px] leading-[1.25] tracking-[0.08em] text-green uppercase [text-shadow:0_0_10px_rgba(0,255,136,0.5)]">
            JUGADOR VAULT
          </div>

          <div className="mt-1.5 flex items-baseline gap-[10px]">
            <span className="grad-text grad-green font-pixel text-[64px] tracking-[0.02em]">
              $0
            </span>
            <span className="font-pixel text-[11px] tracking-[0.16em] text-ink-dim">
              / SIEMPRE
            </span>
          </div>

          <div className="font-pixel text-[9px] leading-[1.25] tracking-[0.18em] text-yellow uppercase [text-shadow:0_0_6px_rgba(245,255,0,0.45)]">
            SIN TRUCOS · SIN LETRA PEQUEÑA
          </div>

          <ul className="mt-[10px] mb-1 flex list-none flex-col gap-2 p-0">
            {PLAN_FEATURES.map((line) => (
              <li
                key={line}
                className="font-mono text-[13px] tracking-[0.02em] text-ink first-letter:text-green"
              >
                {line}
              </li>
            ))}
          </ul>

          <Link
            href="/acceso"
            className={buttonStyles({
              size: "xl",
              pulse: true,
              className: "w-full",
            })}
          >
            EMPEZAR GRATIS →
          </Link>

          <div className="mt-1 text-center font-mono text-[11px] tracking-[0.1em] text-ink-faint">
            No pedimos tarjeta. Nunca lo haremos.
          </div>

          <div className="absolute -top-[18px] -right-[18px] z-[3] rotate-[14deg] border-2 border-magenta bg-[rgba(10,10,15,0.85)] px-[18px] py-[10px] text-center font-pixel text-[13px] leading-[1.15] tracking-[0.16em] text-magenta uppercase shadow-[0_0_14px_rgba(255,0,110,0.35),inset_0_0_8px_rgba(255,0,110,0.2)] [text-shadow:0_0_8px_rgba(255,0,110,0.6)]">
            FREE
            <br />
            PLAY
          </div>
        </div>

        <div className="flex flex-col justify-center gap-[14px]">
          {FAQ.map((item, i) => (
            <div
              key={item.q}
              className={`border border-line border-l-[3px] bg-bg-2 px-5 py-[18px] ${FAQ_ACCENT[i]}`}
            >
              <div className="mb-2 font-pixel text-[10px] leading-[1.25] tracking-[0.12em] text-ink uppercase">
                {item.q}
              </div>
              <div className="font-mono text-[13px] leading-[1.6] text-ink-dim">
                {item.a}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
