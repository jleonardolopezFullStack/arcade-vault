import { z } from "zod";

/**
 * Contrato compartido entre el formulario de /acerca-de y su Server Action.
 *
 * El mismo esquema valida en cliente (antes de enviar) y en servidor (fuente de
 * verdad: el cliente se puede sortear). Los mensajes están en español porque son
 * exactamente lo que pinta el terminal rojo.
 */

export const CONTACT_LIMITS = {
  nameMin: 2,
  nameMax: 60,
  emailMax: 120,
  msgMin: 10,
  msgMax: 2000,
} as const;

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(CONTACT_LIMITS.nameMin, "El nombre debe tener al menos 2 caracteres.")
    .max(CONTACT_LIMITS.nameMax, "El nombre no puede pasar de 60 caracteres."),
  email: z
    .string()
    .trim()
    .max(CONTACT_LIMITS.emailMax, "El correo no puede pasar de 120 caracteres.")
    // En Zod 4 el validador de correo es z.email(); .pipe() conserva el .trim() previo.
    .pipe(z.email("Ese correo no tiene un formato válido.")),
  msg: z
    .string()
    .trim()
    .min(CONTACT_LIMITS.msgMin, "El mensaje debe tener al menos 10 caracteres.")
    .max(CONTACT_LIMITS.msgMax, "El mensaje no puede pasar de 2000 caracteres."),
  // Honeypot: debe llegar vacío. Si trae algo, es un bot.
  website: z.string().max(0).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

export type ContactErrorCode =
  | "validation" // algún campo no pasa el esquema
  | "rate_limit" // demasiados envíos desde la misma IP
  | "provider" // Resend respondió con error
  | "unknown";

export type ContactState =
  | { status: "idle" }
  | { status: "ok"; name: string; simulated: boolean }
  | { status: "error"; code: ContactErrorCode; message: string };

/**
 * Mensajes por defecto de cada código de error. El de `validation` lo suele
 * pisar el mensaje concreto del primer campo que falla.
 *
 * Ninguno menciona al proveedor, ni variables de entorno, ni direcciones de
 * configuración: lo que se filtra aquí acaba en pantalla.
 */
export const CONTACT_ERROR_MESSAGES: Record<ContactErrorCode, string> = {
  validation: "Revisa los datos del formulario.",
  rate_limit: "Demasiados mensajes seguidos. Espera unos minutos antes de reintentar.",
  provider: "No pudimos transmitir el mensaje. Inténtalo de nuevo en unos minutos.",
  unknown: "Algo salió mal al enviar el mensaje. Inténtalo de nuevo.",
};

export const CONTACT_IDLE: ContactState = { status: "idle" };
