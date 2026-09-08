import type { ElementType, HTMLAttributes } from "react";

/**
 * Caja base del tema: fondo `bg-bg-2` y borde de un color del sistema.
 * Sirve de base a tarjetas, leaderboard, modal y tarjeta de acceso.
 *
 * Esquinas rectas, como en el prototipo: el recorte de 8px es exclusivo del
 * botón.
 *
 * `inner` añade el marco punteado interior que el prototipo tenía en
 * `.modal::before` y `.auth-card::before`.
 */

export type PanelTone = "line" | "cyan" | "magenta";

const BASE = "relative bg-bg-2 border";

const TONES: Record<PanelTone, string> = {
  line: "border-line",
  cyan: "border-cyan",
  magenta: "border-magenta",
};

const GLOWS: Record<PanelTone, string> = {
  line: "shadow-[0_0_30px_rgba(0,245,255,0.18)]",
  cyan: "shadow-[0_0_30px_rgba(0,245,255,0.18)]",
  magenta:
    "shadow-[0_0_30px_rgba(255,0,110,0.4),inset_0_0_16px_rgba(255,0,110,0.18)]",
};

const INNERS: Record<PanelTone, string> = {
  line: "before:border-[rgba(0,245,255,0.18)]",
  cyan: "before:border-[rgba(0,245,255,0.18)]",
  magenta: "before:border-[rgba(255,0,110,0.4)]",
};

const INNER_BASE =
  "before:content-[''] before:absolute before:inset-[4px] before:pointer-events-none before:border before:border-dashed";

type StyleOptions = {
  tone?: PanelTone;
  glow?: boolean;
  inner?: boolean;
  className?: string;
};

/** Clases del panel, para aplicarlas a un elemento propio (p. ej. un <article>). */
export function panelStyles({
  tone = "line",
  glow = false,
  inner = false,
  className,
}: StyleOptions = {}): string {
  return [
    BASE,
    TONES[tone],
    glow ? GLOWS[tone] : "",
    inner ? `${INNER_BASE} ${INNERS[tone]}` : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

type PanelProps = HTMLAttributes<HTMLElement> &
  StyleOptions & {
    as?: ElementType;
  };

export function Panel({
  as: Tag = "div",
  tone,
  glow,
  inner,
  className,
  ...rest
}: PanelProps) {
  return (
    <Tag className={panelStyles({ tone, glow, inner, className })} {...rest} />
  );
}
