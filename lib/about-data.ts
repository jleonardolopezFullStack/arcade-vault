import type { GameColor } from "@/lib/data";

/**
 * Contenido estático de /acerca-de, portado 1:1 de
 * references/templates/home-about/about.jsx.
 *
 * Aquí no hay datos de usuario ni nada que venga de un backend: son los textos
 * de la pantalla. El formulario de contacto vive en lib/contact.ts.
 */

export type HighlightIconKind = "HEART" | "BROWSER" | "PLANT";

export type AboutHighlight = {
  icon: HighlightIconKind;
  text: string;
  color: Extract<GameColor, "magenta" | "cyan" | "green">;
};

export type ContactTip = { text: string; led: "green" | "yellow" | "magenta" };

export const ABOUT_MISSION =
  "ARCADE VAULT nació del amor por los videojuegos clásicos. Nuestra misión es preservar y celebrar " +
  "los arcades que definieron una generación, haciéndolos accesibles para todos, en cualquier lugar " +
  "y sin costo.";

export const HIGHLIGHTS: readonly AboutHighlight[] = [
  { icon: "HEART", text: "HECHO CON ❤️ PARA JUGADORES", color: "magenta" },
  { icon: "BROWSER", text: "JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR", color: "cyan" },
  { icon: "PLANT", text: "PROYECTO EN CONSTANTE CRECIMIENTO", color: "green" },
];

export const CONTACT_SUB =
  "¿Tienes alguna sugerencia, quieres proponer un juego, o simplemente quieres saludar? Escríbenos.";

export const CONTACT_TIPS: readonly ContactTip[] = [
  { text: "RESPUESTA EN 24-48H", led: "green" },
  { text: "SUGERENCIAS BIENVENIDAS", led: "yellow" },
  { text: "SIN SPAM, JAMÁS", led: "magenta" },
];

/** Los 24 píxeles parpadeantes de la banda divisoria. */
export const DIVIDER_PIXELS = 24;
