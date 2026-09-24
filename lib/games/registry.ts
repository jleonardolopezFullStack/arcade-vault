// Qué juego del catálogo tiene motor jugable. Los ids ausentes muestran
// «PRÓXIMAMENTE» en el reproductor.

import { createAsteroidesEngine } from "./asteroides";
import type { GameEngineFactory } from "./types";

// Clave = Game["id"] de lib/data.ts.
const ENGINES: Record<string, GameEngineFactory> = {
  rocas: createAsteroidesEngine,
};

export function getEngineFactory(id: string): GameEngineFactory | null {
  return ENGINES[id] ?? null;
}
