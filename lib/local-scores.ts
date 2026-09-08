// Marcas guardadas del usuario. localStorage['av_scores'].
// Sin versionado de esquema: si el JSON.parse falla, se trata como lista vacía
// (los datos son desechables).

const KEY = "av_scores";

export type SavedScore = {
  game: string;
  name: string;
  score: number;
  at: number;
};

function isSavedScore(v: unknown): v is SavedScore {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.game === "string" &&
    typeof o.name === "string" &&
    typeof o.score === "number" &&
    typeof o.at === "number"
  );
}

export function readScores(): SavedScore[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter(isSavedScore) : [];
  } catch {
    return [];
  }
}

export function saveScore(entry: Omit<SavedScore, "at">): void {
  if (typeof window === "undefined") return;
  try {
    const all = readScores();
    all.push({ ...entry, at: Date.now() });
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // almacenamiento lleno o bloqueado: la marca se pierde, no rompemos la UI
  }
}

export function bestScoreFor(gameId: string): SavedScore | null {
  return readScores()
    .filter((s) => s.game === gameId)
    .reduce<SavedScore | null>(
      (best, s) => (best === null || s.score > best.score ? s : best),
      null,
    );
}
