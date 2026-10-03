/**
 * El catálogo, leído de Supabase.
 *
 * Sustituye a `lib/data.ts`, donde los ocho juegos estaban escritos a mano.
 * La fuente de verdad es ahora la tabla `public.games` (SPEC 06).
 *
 * Las lecturas devuelven `Result` en vez de lanzar: una pantalla sin base de
 * datos tiene que poder pintar «SEÑAL PERDIDA», no reventar.
 */
import type { Database } from "@/lib/database.types";
import { readFailed, type Result } from "@/lib/result";
import { createReadClient } from "@/lib/supabase/read";
// Los enums de Postgres ya son estas uniones; no se redeclaran a mano. Si
// mañana se añade una categoría en la base, `generate_typescript_types` la trae
// y el compilador marca todos los sitios que hay que tocar.
export type GameCategory = Database["public"]["Enums"]["game_category"];
export type GameColor = Database["public"]["Enums"]["game_color"];
export type Game = {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string;
  color: GameColor;
  /** Cabecera de la tabla de puntuaciones: «PUNTOS», «SEGUNDOS»… */
  scoreLabel: string;
};
export type GameStats = {
  /** Número de marcas registradas. 0 si nadie ha jugado. */
  plays: number;
  /** La mejor marca según el `score_order` del juego, o null si no hay ninguna. */
  best: number | null;
};
export type GameWithStats = Game & GameStats;
export const CATS = [
  "TODOS",
  "ARCADE",
  "PUZZLE",
  "SHOOTER",
  "VERSUS",
] as const satisfies readonly ["TODOS", ...GameCategory[]];
export type CatFilter = (typeof CATS)[number];
export type CatalogFilter = {
  /** "TODOS" o vacío no filtra. */
  cat?: string;
  /** Búsqueda por título, sin distinguir mayúsculas. */
  q?: string;
};
/** Columnas de `games` que necesita la interfaz. `sort_order` solo para ordenar. */
const GAME_COLUMNS = "id, title, short, long, cat, cover, color, score_label";
type GameRow = Pick<
  Database["public"]["Tables"]["games"]["Row"],
  "id" | "title" | "short" | "long" | "cat" | "cover" | "color" | "score_label"
>;
function toGame(row: GameRow): Game {
  return {
    id: row.id,
    title: row.title,
    short: row.short,
    long: row.long,
    cat: row.cat,
    cover: row.cover,
    color: row.color,
    scoreLabel: row.score_label,
  };
}
/** `%` y `_` son comodines de `ilike`: un título con ellos buscaría de más. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}
/**
 * Los ocho juegos, en el orden del catálogo.
 *
 * El filtrado se resuelve en la consulta y no en memoria: con ocho filas da
 * igual, pero es la forma que no hay que reescribir cuando sean cien.
 */
export async function listGames(
  filter: CatalogFilter = {},
): Promise<Result<Game[]>> {
  try {
    const supabase = createReadClient();
    let query = supabase.from("games").select(GAME_COLUMNS).order("sort_order");
    if (filter.cat && filter.cat !== "TODOS") {
      // Un valor que no sea del enum haría fallar la consulta entera, así que
      // se comprueba antes: una categoría inventada en la URL es una búsqueda
      // sin resultados, no un error de servidor.
      if (!CATS.includes(filter.cat as CatFilter)) {
        return { ok: true, data: [] };
      }
      query = query.eq("cat", filter.cat as GameCategory);
    }
    const needle = filter.q?.trim();
    if (needle) {
      query = query.ilike("title", `%${escapeLike(needle)}%`);
    }
    const { data, error } = await query;
    if (error) return readFailed("catalog.listGames", error);
    return { ok: true, data: data.map(toGame) };
  } catch (cause) {
    return readFailed("catalog.listGames", cause);
  }
}
/**
 * Lo mismo, con `plays` y `best` reales.
 *
 * Son dos consultas y no un join porque `game_stats` es una vista sin relación
 * declarada: PostgREST no sabe enlazarla con `games`. Se piden en paralelo y se
 * cruzan aquí —ocho filas contra ocho—.
 */
export async function listGamesWithStats(
  filter: CatalogFilter = {},
): Promise<Result<GameWithStats[]>> {
  try {
    const supabase = createReadClient();
    const [games, stats] = await Promise.all([
      listGames(filter),
      supabase.from("game_stats").select("game_id, plays, best"),
    ]);
    if (!games.ok) return games;
    if (stats.error)
      return readFailed("catalog.listGamesWithStats", stats.error);
    const byId = statsById(stats.data);
    return {
      ok: true,
      data: games.data.map((game) => ({ ...game, ...statsFor(byId, game.id) })),
    };
  } catch (cause) {
    return readFailed("catalog.listGamesWithStats", cause);
  }
}
/** Un juego con sus estadísticas. `null` significa «no existe», no «falló». */
export async function getGame(
  id: string,
): Promise<Result<GameWithStats | null>> {
  try {
    const supabase = createReadClient();
    const [game, stats] = await Promise.all([
      supabase.from("games").select(GAME_COLUMNS).eq("id", id).maybeSingle(),
      supabase
        .from("game_stats")
        .select("game_id, plays, best")
        .eq("game_id", id),
    ]);
    if (game.error) return readFailed("catalog.getGame", game.error);
    if (stats.error) return readFailed("catalog.getGame", stats.error);
    if (!game.data) return { ok: true, data: null };
    const byId = statsById(stats.data);
    return {
      ok: true,
      data: { ...toGame(game.data), ...statsFor(byId, game.data.id) },
    };
  } catch (cause) {
    return readFailed("catalog.getGame", cause);
  }
}
/**
 * Solo los ids, para `generateStaticParams()`.
 *
 * Corre en build, donde no hay petición: por eso usa el cliente sin cookies.
 *
 * **No lanza.** Lanzar era lo primero que se intentó —un build sin catálogo no
 * debería pasar desapercibido— pero la excepción sale de `buildAppStaticPaths`,
 * fuera del árbol de React, así que ni la rama de `SignalLost` de la página ni
 * un `error.tsx` del segmento llegan a verla: el detalle respondía 500 crudo.
 *
 * Devolver la lista vacía es lo que permite que la ruta se resuelva bajo
 * demanda (`dynamicParams = true`) y que la página pinte «SEÑAL PERDIDA» como
 * las demás. El fallo no es silencioso: queda en el log del build.
 */
export async function listGameIds(): Promise<string[]> {
  try {
    const supabase = createReadClient();
    const { data, error } = await supabase
      .from("games")
      .select("id")
      .order("sort_order");
    if (error) throw error;
    return data.map((row) => row.id);
  } catch (cause) {
    console.error(
      "[catalog.listGameIds] no se pudo leer el catálogo para prerrenderizar " +
        "las rutas de juego; se resolverán bajo demanda:",
      cause,
    );
    return [];
  }
}
// --- Estadísticas -----------------------------------------------------------
//
// La vista declara sus columnas como anulables porque Postgres no puede
// garantizar lo contrario a través de un `left join` sobre un `union all`.
// `best` null es real y significa «nadie ha jugado»; `game_id` y `plays` nulos
// no pueden ocurrir, y se normalizan aquí para no arrastrar imposibles hasta
// los componentes.
type StatsRow = Database["public"]["Views"]["game_stats"]["Row"];
function statsById(rows: StatsRow[]): Map<string, GameStats> {
  const map = new Map<string, GameStats>();
  for (const row of rows) {
    if (row.game_id === null) continue;
    map.set(row.game_id, { plays: row.plays ?? 0, best: row.best });
  }
  return map;
}
function statsFor(map: Map<string, GameStats>, id: string): GameStats {
  return map.get(id) ?? { plays: 0, best: null };
}
