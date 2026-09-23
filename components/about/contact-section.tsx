import { ContactForm } from "@/components/about/contact-form";
import { CONTACT_SUB, CONTACT_TIPS, type ContactTip } from "@/lib/about-data";

/** Color del LED de cada tip. */
const LED: Record<ContactTip["led"], string> = {
  green: "bg-green shadow-[0_0_6px_var(--green)]",
  yellow: "bg-yellow shadow-[0_0_6px_var(--yellow)]",
  magenta: "bg-magenta shadow-[0_0_6px_var(--magenta)]",
};

export function ContactSection() {
  return (
    <div className="mx-auto mb-20 max-w-[1200px] px-8">
      {/* Texto y formulario a dos columnas; apilados desde 900px incluido, como
          el max-width del prototipo (max-[900px] de Tailwind 4 excluiría el 900). */}
      <div className="grid grid-cols-[1fr_1.2fr] items-start gap-10 [@media(max-width:900px)]:grid-cols-1 [@media(max-width:900px)]:gap-6">
        <div>
          <div className="neon-cyan mb-3.5 font-pixel text-[11px] tracking-[0.24em] uppercase">
            ▸ CONTACTO
          </div>

          <h2 className="m-0 font-pixel text-[clamp(22px,3.5vw,36px)] tracking-[0.06em] text-cyan [text-shadow:0_0_12px_rgba(0,245,255,0.4)]">
            CONTÁCTANOS
          </h2>

          <p className="mt-[18px] mb-6 text-[14px] leading-[1.7] text-ink-dim">
            {CONTACT_SUB}
          </p>

          <div className="flex flex-col gap-2.5">
            {CONTACT_TIPS.map((tip) => (
              <div
                key={tip.text}
                className="flex items-center gap-2.5 font-pixel text-[9px] tracking-[0.14em] text-ink-dim"
              >
                <span aria-hidden="true" className={`size-2 rounded-full ${LED[tip.led]}`} />
                {tip.text}
              </div>
            ))}
          </div>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
