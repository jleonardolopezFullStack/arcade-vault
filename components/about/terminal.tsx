import type { ReactNode } from "react";

/**
 * Terminal VAULT-OS: la respuesta del formulario de contacto, en verde cuando
 * el mensaje sale y en magenta —el rojo del tema— cuando falla.
 *
 * Las líneas entran escalonadas por CSS (`.term-lines` en globals.css), no con
 * temporizadores: aquí no hay estado.
 */

export type TerminalVariant = "ok" | "error";

const FRAME: Record<TerminalVariant, string> = {
  ok: "border-green shadow-[0_0_22px_rgba(0,255,136,0.25)]",
  error: "border-magenta shadow-[0_0_22px_rgba(255,0,110,0.28)]",
};

const RESULT: Record<TerminalVariant, string> = {
  ok: "text-green [text-shadow:0_0_6px_rgba(0,255,136,0.45)]",
  error: "text-magenta [text-shadow:0_0_6px_rgba(255,0,110,0.45)]",
};

type TerminalProps = {
  variant: TerminalVariant;
  /** Lo que se «teclea» tras el prompt. */
  command: string;
  /** Líneas de progreso, ya con su prefijo [OK] o [ERROR]. */
  steps: readonly string[];
  /** Línea final, la que lleva el caret. */
  result: string;
  /** Línea extra bajo el resultado, p. ej. el aviso de modo simulación. */
  note?: string;
  /** Botón de salida del estado. Va fuera del escalonado: aparece desde el principio. */
  children?: ReactNode;
};

export function Terminal({
  variant,
  command,
  steps,
  result,
  note,
  children,
}: TerminalProps) {
  return (
    <div
      // El resultado sustituye al formulario: hay que anunciarlo. Un fallo
      // interrumpe; un acuse de recibo, no.
      role={variant === "error" ? "alert" : "status"}
      className={`overflow-hidden border bg-black font-mono ${FRAME[variant]}`}
    >
      <div className="flex items-center gap-2 border-b border-line bg-bg px-3 py-2">
        <span aria-hidden="true" className="size-2.5 rounded-full bg-[#ff5f56]" />
        <span aria-hidden="true" className="size-2.5 rounded-full bg-[#ffbd2e]" />
        <span aria-hidden="true" className="size-2.5 rounded-full bg-[#27c93f]" />
        <span className="ml-2 font-pixel text-[9px] tracking-[0.14em] text-ink-faint">
          VAULT-OS // TERMINAL
        </span>
      </div>

      <div className="px-[18px] pt-[18px] pb-[22px] text-[13px] leading-[1.8]">
        <div className="term-lines">
          <div className="text-green">
            <span className="mr-2 text-cyan">vault@arcade:~$</span>
            {command}
          </div>
          {steps.map((step) => (
            <div key={step} className="text-ink-dim">
              {step}
            </div>
          ))}
          <div className={`mt-3 font-bold whitespace-pre-wrap ${RESULT[variant]}`}>
            {result}
            <span aria-hidden="true" className="animate-blink">
              _
            </span>
          </div>
          {note ? <div className="mt-1.5 text-yellow">{note}</div> : null}
        </div>

        {children ? <div className="mt-[18px]">{children}</div> : null}
      </div>
    </div>
  );
}
