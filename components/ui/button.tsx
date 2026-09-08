import type { ButtonHTMLAttributes } from "react";

/**
 * Botón arcade. Concentra aquí los efectos que el prototipo tenía en `.btn`:
 * la esquina recortada (clip-path), el marco interior `::before` y el
 * resplandor de hover por color. Portado de styles.css sin cambios visuales.
 */

export type ButtonVariant = "cyan" | "magenta" | "yellow" | "ghost";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

// Esquina superior izquierda e inferior derecha recortadas a 8px.
// Los "_" son espacios: es la sintaxis de valores arbitrarios de Tailwind.
const CLIP =
  "[clip-path:polygon(8px_0,100%_0,100%_calc(100%_-_8px),calc(100%_-_8px)_100%,0_100%,0_8px)]";

const BASE = [
  "relative inline-flex items-center justify-center gap-[10px]",
  "font-pixel bg-transparent text-ink border cursor-pointer",
  CLIP,
  "transition-[transform,box-shadow,color] duration-150 ease-out",
  "active:translate-y-px active:scale-[0.98]",
  "disabled:opacity-45 disabled:cursor-not-allowed disabled:shadow-none",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan",
  // marco interior a 3px, hereda el recorte de esquinas
  "before:content-[''] before:absolute before:inset-[3px] before:pointer-events-none",
  "before:border before:border-[rgba(0,245,255,0.25)] before:[clip-path:inherit]",
].join(" ");

const VARIANTS: Record<ButtonVariant, string> = {
  cyan: "border-cyan hover:text-cyan hover:shadow-[0_0_14px_rgba(0,245,255,0.55),inset_0_0_8px_rgba(0,245,255,0.35)]",
  magenta:
    "border-magenta hover:text-magenta hover:shadow-[0_0_14px_rgba(255,0,110,0.55),inset_0_0_8px_rgba(255,0,110,0.35)]",
  yellow:
    "border-yellow hover:text-yellow hover:shadow-[0_0_14px_rgba(245,255,0,0.6),inset_0_0_8px_rgba(245,255,0,0.35)]",
  ghost:
    "border-ink-faint text-ink-dim hover:text-ink hover:border-ink-dim hover:shadow-none",
};

const SIZES: Record<ButtonSize, string> = {
  // sm es el botón compacto de la fila social de /acceso (.social .btn del prototipo).
  sm: "p-3 text-[9px] tracking-[0.16em]",
  md: "px-5 py-3 text-[10px] tracking-[0.16em]",
  lg: "px-7 py-4 text-[12px] tracking-[0.16em]",
  xl: "px-9 py-5 text-[14px] tracking-[0.2em]",
};

type StyleOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  pulse?: boolean;
  className?: string;
};

/** Clases del botón, para reutilizarlas en un <Link> o un <a>. */
export function buttonStyles({
  variant = "cyan",
  size = "md",
  pulse = false,
  className,
}: StyleOptions = {}): string {
  return [
    BASE,
    VARIANTS[variant],
    SIZES[size],
    pulse ? "animate-pulse-neon" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & StyleOptions;

export function Button({
  variant,
  size,
  pulse,
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, pulse, className })}
      {...rest}
    />
  );
}
