import type { ButtonHTMLAttributes } from "react";

/** Píldora de categoría (biblioteca) y de pestaña (salón). Portada de `.chip`. */

const BASE = [
  "px-[14px] py-3 font-pixel text-[9px] tracking-[0.12em]",
  "bg-bg-2 border cursor-pointer",
  "transition-[color,border-color,box-shadow] duration-150 ease-out",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan",
].join(" ");

const ACTIVE =
  "text-magenta border-magenta shadow-[0_0_10px_rgba(255,0,110,0.35)]";
const IDLE = "text-ink-dim border-line hover:text-ink";

export function chipStyles(active = false, className?: string): string {
  return [BASE, active ? ACTIVE : IDLE, className ?? ""]
    .filter(Boolean)
    .join(" ");
}

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function Chip({
  active = false,
  className,
  type = "button",
  ...rest
}: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={chipStyles(active, className)}
      {...rest}
    />
  );
}
