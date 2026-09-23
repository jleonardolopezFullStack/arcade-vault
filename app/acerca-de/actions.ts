"use server";

import { headers } from "next/headers";

import { ContactMessage } from "@/emails/contact-message";
import {
  CONTACT_ERROR_MESSAGES,
  contactSchema,
  type ContactErrorCode,
  type ContactState,
} from "@/lib/contact";
import { allowContact } from "@/lib/rate-limit";

/**
 * Envío del formulario de contacto de /acerca-de.
 *
 * Es una Server Action y no un Route Handler a propósito: no hay endpoint
 * público que endurecer y la API key nunca cruza al cliente.
 *
 * Sin RESEND_API_KEY entra en modo simulación: no llama a Resend, vuelca el
 * mensaje por consola y devuelve éxito marcado como simulado.
 */

/** Respaldos en código: con solo poner la API key ya se envían correos reales. */
const DEFAULT_TO = "jleonardolopez@hotmail.com";
const DEFAULT_FROM = "Arcade Vault <onboarding@resend.dev>";

function fail(code: ContactErrorCode, message?: string): ContactState {
  return { status: "error", code, message: message ?? CONTACT_ERROR_MESSAGES[code] };
}

/** Primer valor de x-forwarded-for; "unknown" comparte cubo si no hay cabecera. */
async function clientIp(): Promise<string> {
  const forwarded = (await headers()).get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    msg: String(formData.get("msg") ?? ""),
    website: String(formData.get("website") ?? ""),
  };

  // 1. Honeypot. Éxito fingido: un error le diría al bot qué campo evitar.
  if (raw.website.trim() !== "") {
    return { status: "ok", name: raw.name.trim(), simulated: false };
  }

  // 2. Validación. El cliente valida lo mismo, pero se puede sortear.
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return fail("validation", parsed.error.issues[0]?.message);
  }
  const { name, email, msg } = parsed.data;

  // 3. Límite de envíos por IP.
  if (!allowContact(await clientIp())) {
    return fail("rate_limit");
  }

  // 4. Sin API key: modo simulación.
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info(
      `[contacto] MODO SIMULACIÓN — no se envió ningún correo.\n` +
        `  nombre:  ${name}\n` +
        `  correo:  ${email}\n` +
        `  mensaje: ${msg}`,
    );
    return { status: "ok", name, simulated: true };
  }

  // 5. Envío real. El cliente de Resend se instancia aquí, no en el módulo,
  //    para que el import no falle en build sin variables de entorno.
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM,
      to: process.env.CONTACT_TO_EMAIL || DEFAULT_TO,
      replyTo: email,
      subject: `[Arcade Vault] Mensaje de ${name}`,
      react: ContactMessage({ name, email, msg, sentAt: new Date() }),
    });

    // 6. El detalle del proveedor se queda en el servidor: al cliente solo va
    //    un mensaje genérico, sin texto crudo ni configuración.
    if (error) {
      console.error("[contacto] Resend rechazó el envío:", error);
      return fail("provider");
    }

    return { status: "ok", name, simulated: false };
  } catch (err) {
    console.error("[contacto] Fallo inesperado al enviar:", err);
    return fail("unknown");
  }
}
