/**
 * Los rankings, leídos de Supabase.
 *
 * Sustituye a las puntuaciones que se fabricaban con una
 * semilla. Ahora salen de `public.top_scores()`, que ya aplica el orden y el
 * tamaño de ranking propios de cada juego: aquí no se ordena ni se recorta
 * nada, porque hacerlo otra vez en JavaScript sería una segunda verdad que
 * podría discrepar de la primera.
 */
import { readFailed, type Result } from "@/lib/result";
import { createReadClient } from "@/lib/supabase/read";
export type ScoreRow = {
  rank: number;
  name: string;
  score: number;
  /** Milisegundos, como los espera `formatDate()`. */
  at: number;
};
/** Rankings de los ocho juegos, indexados por `game_id`. */
export type LeaderboardsByGame = Record<string, ScoreRow[]>;
/**
 * El ranking de un juego. Vacío es un resultado legítimo: nadie ha jugado
 * todavía, y la pantalla lo pinta como «SÉ EL PRIMERO».
 */
export async function topScores(gameId: string): Promise<Result<ScoreRow[]>> {
  try {
    const supabase = createReadClient();
    const { data, error } = await supabase.rpc("top_scores", {
      p_game: gameId,
    });
    if (error) return readFailed("leaderboard.topScores", error);
    return { ok: true, data: data.map(toScoreRow) };
  } catch (cause) {
    return readFailed("leaderboard.topScores", cause);
  }
}
/**
 * Los ocho rankings de una vez, para el Salón de la Fama.
 *
 * Una sola llamada en lugar de ocho: `top_scores()` sin argumento los devuelve
 * todos ya numerados por juego. Así cambiar de pestaña no va a la red.
 *
 * Devuelve una entrada por juego que tenga marcas; un juego sin ninguna
 * simplemente no aparece en el mapa, y `scoresFor()` lo resuelve como lista
 * vacía.
 */
export async function allTopScores(): Promise<Result<LeaderboardsByGame>> {
  try {
    const supabase = createReadClient();
    const { data, error } = await supabase.rpc("top_scores");
    if (error) return readFailed("leaderboard.allTopScores", error);
    const byGame: LeaderboardsByGame = {};
    for (const row of data) {
      (byGame[row.game_id] ??= []).push(toScoreRow(row));
    }
    return { ok: true, data: byGame };
  } catch (cause) {
    return readFailed("leaderboard.allTopScores", cause);
  }
}
/** Lista vacía en vez de `undefined`: el juego existe, sus marcas aún no. */
export function scoresFor(
  boards: LeaderboardsByGame,
  gameId: string,
): ScoreRow[] {
  return boards[gameId] ?? [];
}
type TopScoresRow = {
  game_id: string;
  rank: number;
  name: string;
  score: number;
  created_at: string;
};
function toScoreRow(row: TopScoresRow): ScoreRow {
  return {
    rank: row.rank,
    name: row.name,
    score: row.score,
    at: Date.parse(row.created_at),
  };
}
