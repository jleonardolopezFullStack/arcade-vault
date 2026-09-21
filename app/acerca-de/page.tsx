import type { Metadata } from "next";

import { AboutDivider } from "@/components/about/about-divider";
import { AboutHero } from "@/components/about/about-hero";
import { ContactSection } from "@/components/about/contact-section";
import { Reveal } from "@/components/home/reveal";

export const metadata: Metadata = {
  title: "Acerca de · Arcade Vault",
  description:
    "Por qué existe Arcade Vault y cómo escribirnos: sugerencias, propuestas de juegos o simplemente saludar.",
};

// El hero no lleva reveal: es lo primero que se ve, igual que en la landing.
export default function AboutPage() {
  return (
    <div className="fade-in">
      <AboutHero />

      <Reveal>
        <AboutDivider />
      </Reveal>

      <Reveal>
        <ContactSection />
      </Reveal>
    </div>
  );
}
