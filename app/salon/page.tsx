import type { Metadata } from "next";
import { HallOfFame } from "@/components/hall/hall-of-fame";
import { SignalLost } from "@/components/ui/signal-lost";
import { listGames } from "@/lib/catalog";
import { allTopScores } from "@/lib/leaderboard";
export const metadata: Metadata = {
  title: "Salón de la Fama · Arcade Vault",
  description: "Las mejores puntuaciones de cada juego del Arcade Vault.",
};
export default async function HallPage() {
  // Los ocho rankings en una sola llamada: `top_scores()` sin argumento los
  // devuelve todos ya numerados. Por eso cambiar de pestaña no va a la red.
  const [gamesResult, boardsResult] = await Promise.all([
    listGames(),
    allTopScores(),
  ]);
  if (!gamesResult.ok) {
    return <SignalLost message={gamesResult.error} retryHref="/salon" />;
  }
  if (!boardsResult.ok) {
    return <SignalLost message={boardsResult.error} retryHref="/salon" />;
  }
  return <HallOfFame games={gamesResult.data} boards={boardsResult.data} />;
}
