// Qué juego del catálogo tiene motor jugable. Los ids ausentes muestran
// «PRÓXIMAMENTE» en el reproductor.
import { createAsteroidesEngine } from "./asteroides";
import { createLadrillosEngine } from "./ladrillos";
import { createPiezasEngine } from "./piezas";
import { createSerpienteEngine } from "./serpiente";
import type { GameEngineFactory } from "./types";
// Clave = Game["id"] del catálogo (@/lib/catalog). La carpeta del motor nombra
// el concepto, no el slug: `asteroides` para `rocas`, `piezas` para `caida`,
// `ladrillos` para `bloque-buster`, `serpiente` para `serpentina`. El id con
// guion necesita comillas.
const ENGINES: Record<string, GameEngineFactory> = {
  rocas: createAsteroidesEngine,
  caida: createPiezasEngine,
  "bloque-buster": createLadrillosEngine,
  serpentina: createSerpienteEngine,
};
export function getEngineFactory(id: string): GameEngineFactory | null {
  return ENGINES[id] ?? null;
}
