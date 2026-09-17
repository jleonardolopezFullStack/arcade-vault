import type { Metadata } from "next";

import { Activity } from "@/components/home/activity";
import { FeatureGrid } from "@/components/home/feature-grid";
import { FinalCta } from "@/components/home/final-cta";
import { GameRail } from "@/components/home/game-rail";
import { Hero } from "@/components/home/hero";
import { Pricing } from "@/components/home/pricing";
import { Reveal } from "@/components/home/reveal";
import { StatsBand } from "@/components/home/stats-band";

// La raíz es la landing: lleva el reclamo del hero en el título, no el
// patrón «<Página> · Arcade Vault» del resto de rutas.
export const metadata: Metadata = {
  title: "Arcade Vault · El arcade clásico está de vuelta",
  description:
    "Juega los mejores clásicos directamente en tu navegador. Sin descargas. Sin costo. Solo diversión.",
};

// El hero no lleva reveal: es lo primero que se ve.
export default function Home() {
  return (
    <div className="fade-in">
      <Hero />

      <Reveal>
        <FeatureGrid />
      </Reveal>

      <Reveal>
        <GameRail />
      </Reveal>

      <Reveal>
        <StatsBand />
      </Reveal>

      <Reveal>
        <Activity />
      </Reveal>

      <Reveal>
        <Pricing />
      </Reveal>

      <Reveal>
        <FinalCta />
      </Reveal>
    </div>
  );
}
