import type { Metadata } from "next";

import { HallOfFame } from "@/components/hall/hall-of-fame";

export const metadata: Metadata = {
  title: "Salón de la Fama · Arcade Vault",
  description: "Las mejores puntuaciones de cada juego del Arcade Vault.",
};

export default function HallPage() {
  return <HallOfFame />;
}
