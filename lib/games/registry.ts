// Qué juego del catálogo tiene motor jugable. Los ids ausentes muestran
// «PRÓXIMAMENTE» en el reproductor.
import { createAsteroidesEngine } from "./asteroides";
import { createPiezasEngine } from "./piezas";
import type { GameEngineFactory } from "./types";
// Clave = Game["id"] del catálogo (@/lib/catalog). La carpeta del motor nombra
// el concepto, no el slug: `asteroides` para `rocas`, `piezas` para `caida`.
const ENGINES: Record<string, GameEngineFactory> = {
  rocas: createAsteroidesEngine,
  caida: createPiezasEngine,
};
export function getEngineFactory(id: string): GameEngineFactory | null {
  return ENGINES[id] ?? null;
}
