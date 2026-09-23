"use client";

import { useActionState, useState } from "react";

import { sendContactMessage } from "@/app/acerca-de/actions";
import { Terminal } from "@/components/about/terminal";
import { Button } from "@/components/ui/button";
import { panelStyles } from "@/components/ui/panel";
import { CONTACT_IDLE, CONTACT_LIMITS, type ContactState } from "@/lib/contact";

/**
 * El único componente cliente de /acerca-de.
 *
 * Cuatro vistas: formulario, envío en curso, terminal verde y terminal magenta.
 * El estado del envío lo lleva useActionState; `dismissed` es lo que permite
 * volver al formulario sin perder —o perdiendo, según el botón— lo escrito.
 */

const FIELD = "flex flex-col gap-1.5";
const LABEL = "font-mono text-[10px] tracking-[0.16em] text-ink-faint uppercase";
const CONTROL =
  "border border-line bg-bg px-3 font-mono text-ink outline-0 transition-[border-color,box-shadow] duration-150 placeholder:text-ink-faint focus:border-cyan focus:shadow-[0_0_12px_rgba(0,245,255,0.35)] read-only:text-ink-dim";

/** La línea [ERROR] cae sobre el paso que realmente falló. */
const STEPS_BY_CODE: Record<string, readonly string[]> = {
  validation: ["[OK] Conectando con servidor…", "[ERROR] Validando contenido…"],
  rate_limit: [
    "[OK] Conectando con servidor…",
    "[OK] Validando contenido…",
    "[ERROR] Límite de transmisiones alcanzado.",
  ],
  provider: [
    "[OK] Conectando con servidor…",
    "[OK] Validando contenido…",
    "[ERROR] Transmitiendo paquete…",
  ],
  unknown: ["[OK] Conectando con servidor…", "[ERROR] Transmisión interrumpida."],
};

const OK_STEPS = [
  "[OK] Conectando con servidor…",
  "[OK] Validando contenido…",
  "[OK] Transmitiendo paquete…",
] as const;

export function ContactForm() {
  const [state, formAction, pending] = useActionState<ContactState, FormData>(
    sendContactMessage,
    CONTACT_IDLE,
  );

  // Controlados para que «REINTENTAR» pueda devolver lo escrito: al montar el
  // terminal el formulario se desmonta y el DOM perdería los valores.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const [shake, setShake] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Mientras hay un envío en vuelo, `state` aún es el resultado anterior: si no
  // se oculta, al reenviar reaparecería el terminal viejo en vez de TRANSMITIENDO.
  const result = dismissed || pending || state.status === "idle" ? null : state;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Igual que el prototipo: un campo vacío agita el formulario y no llega a
    // llamar al servidor. El servidor valida de nuevo, por si se sortea esto.
    if (!name.trim() || !email.trim() || !msg.trim()) {
      e.preventDefault();
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    setDismissed(false);
  };

  const startOver = () => {
    setName("");
    setEmail("");
    setMsg("");
    setDismissed(true);
  };

  // noValidate: la validación la hace Zod y se pinta en el terminal. El globo
  // nativo del navegador cortaría el envío antes y rompería la estética.
  return (
    <form
      action={formAction}
      onSubmit={onSubmit}
      noValidate
      className={panelStyles({ inner: true, className: `p-7 ${shake ? "shake" : ""}` })}
    >
      {/* Trampa para bots: fuera de pantalla, nunca enfocable, nunca anunciada. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] size-px opacity-0"
      />

      {result === null ? (
        <div className="flex flex-col gap-3">
          <div className={FIELD}>
            <label className={LABEL} htmlFor="contact-name">
              Nombre
            </label>
            <input
              id="contact-name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              readOnly={pending}
              maxLength={CONTACT_LIMITS.nameMax}
              autoComplete="name"
              placeholder="px_kai"
              className={`${CONTROL} h-11`}
            />
          </div>

          <div className={FIELD}>
            <label className={LABEL} htmlFor="contact-email">
              Correo electrónico
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly={pending}
              maxLength={CONTACT_LIMITS.emailMax}
              autoComplete="email"
              placeholder="jugador@vault.gg"
              className={`${CONTROL} h-11`}
            />
          </div>

          <div className={FIELD}>
            <label className={LABEL} htmlFor="contact-msg">
              Mensaje
            </label>
            <textarea
              id="contact-msg"
              name="msg"
              rows={5}
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              readOnly={pending}
              maxLength={CONTACT_LIMITS.msgMax}
              placeholder="Cuéntanos qué tienes en mente…"
              className={`${CONTROL} min-h-[110px] resize-y py-3`}
            />
          </div>

          <Button type="submit" size="xl" disabled={pending} className="w-full">
            {pending ? "▶  TRANSMITIENDO…" : "▶  ENVIAR MENSAJE"}
          </Button>
        </div>
      ) : result.status === "ok" ? (
        <Terminal
          variant="ok"
          command="./send_message --to=team"
          steps={OK_STEPS}
          result={`> MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, ${result.name.toUpperCase()}.`}
          note={
            result.simulated
              ? "[SIM] MODO SIMULACIÓN — NO SE ENVIÓ NINGÚN CORREO"
              : undefined
          }
        >
          <Button variant="ghost" onClick={startOver}>
            ENVIAR OTRO MENSAJE
          </Button>
        </Terminal>
      ) : (
        <Terminal
          variant="error"
          command="./send_message --to=team"
          steps={STEPS_BY_CODE[result.code] ?? STEPS_BY_CODE.unknown}
          result={`> ${result.message}`}
        >
          {/* Vuelve al formulario con lo escrito intacto: perderlo tras un
              fallo de red sería el peor resultado posible. */}
          <Button variant="magenta" onClick={() => setDismissed(true)}>
            REINTENTAR
          </Button>
        </Terminal>
      )}
    </form>
  );
}
