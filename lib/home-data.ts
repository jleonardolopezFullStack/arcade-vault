import type { GameColor } from "@/lib/data";

/**
 * Contenido de escaparate de la landing, portado 1:1 de
 * references/templates/home-about/home.jsx.
 *
 * Son constantes fijas a propósito: el ticker y el top de jugadores no leen de
 * localStorage, ni de seededScores, ni de ningún backend. Cuando haya datos
 * reales, este es el único archivo que hay que tocar.
 *
 * Los seis juegos del rail no se duplican aquí: salen de GAMES.slice(0, 6).
 */

export type FeatureIconKind = "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET";

export type HomeFeature = {
  icon: FeatureIconKind;
  title: string;
  desc: string;
  color: GameColor;
};

export type ActivityRow = {
  player: string;
  game: string; // texto libre, no un Game["id"]
  score: number;
  when: string; // ya formateado
  color: GameColor;
};

export type TopPlayerRow = {
  rank: number;
  player: string;
  score: number;
};

export type HomeStat = {
  n: string;
  unit: string;
  sub: string;
};

export type FaqItem = { q: string; a: string };

export const FEATURES: readonly HomeFeature[] = [
  {
    icon: "GAMEPAD",
    title: "JUEGOS CLÁSICOS",
    desc: "Arkanoid, Tetris, Snake y muchos más. Los mejores arcades de todos los tiempos en un solo lugar.",
    color: "cyan",
  },
  {
    icon: "FREE",
    title: "100% GRATIS",
    desc: "Sin suscripciones, sin pagos ocultos. Todos los juegos disponibles de forma gratuita.",
    color: "yellow",
  },
  {
    icon: "TROPHY",
    title: "LADDER BOARDS",
    desc: "Compite con jugadores de todo el mundo. Escala el ranking y demuestra quién es el mejor.",
    color: "magenta",
  },
  {
    icon: "ROCKET",
    title: "SIEMPRE CRECIENDO",
    desc: "Agregamos nuevos juegos constantemente. Vuelve seguido, siempre habrá algo nuevo que jugar.",
    color: "green",
  },
];

// Cifras de escaparate: no se ajustan al catálogo real (8 juegos) por decisión
// del spec 02.
export const HOME_STATS: readonly HomeStat[] = [
  { n: "12+", unit: "JUEGOS", sub: "Y CONTANDO" },
  { n: "MILES", unit: "DE PARTIDAS", sub: "JUGADAS CADA DÍA" },
  { n: "GLOBAL", unit: "RANKING", sub: "COMPITE CON EL MUNDO" },
];

export const ACTIVITY: readonly ActivityRow[] = [
  {
    player: "NEONFOX",
    game: "Caída",
    score: 184220,
    when: "hace 2 min",
    color: "magenta",
  },
  {
    player: "PX_KAI",
    game: "Glotón",
    score: 96400,
    when: "hace 5 min",
    color: "yellow",
  },
  {
    player: "Z3R0COOL",
    game: "Invasores",
    score: 54190,
    when: "hace 8 min",
    color: "green",
  },
  {
    player: "VAULT_07",
    game: "Rocas",
    score: 41200,
    when: "hace 12 min",
    color: "cyan",
  },
  {
    player: "GLITCHA",
    game: "Bloque Buster",
    score: 28450,
    when: "hace 18 min",
    color: "cyan",
  },
  {
    player: "ARKADYA",
    game: "Serpentina",
    score: 7820,
    when: "hace 24 min",
    color: "green",
  },
  {
    player: "CYBER_LU",
    game: "Ranaria",
    score: 18900,
    when: "hace 31 min",
    color: "yellow",
  },
];

export const TOP_PLAYERS: readonly TopPlayerRow[] = [
  { rank: 1, player: "NEONFOX", score: 312840 },
  { rank: 2, player: "PX_KAI", score: 248110 },
  { rank: 3, player: "M00NRYU", score: 196720 },
  { rank: 4, player: "VAULT_07", score: 154300 },
  { rank: 5, player: "GLITCHA", score: 138900 },
];

export const PLAN_FEATURES: readonly string[] = [
  "✔ Acceso a todos los juegos",
  "✔ Ranking global y salón de la fama",
  "✔ Sin anuncios entre partidas",
  "✔ Guarda tus puntuaciones",
  "✔ Nuevos juegos cada mes",
  "✔ Funciona en cualquier navegador",
];

export const FAQ: readonly FaqItem[] = [
  {
    q: "¿REALMENTE ES GRATIS?",
    a: 'Sí. Arcade Vault es un proyecto sin fines de lucro hecho por amor a los clásicos. No hay versión "premium" escondida.',
  },
  {
    q: "¿NECESITO CREAR CUENTA?",
    a: "No. Puedes jugar como invitado. Si quieres guardar tu puntuación y aparecer en el ranking, regístrate en 10 segundos.",
  },
  {
    q: "¿CÓMO SOBREVIVEN SIN COBRAR?",
    a: "Es un proyecto comunitario. Si te gusta, compártelo. Esa es toda la moneda que aceptamos.",
  },
];
