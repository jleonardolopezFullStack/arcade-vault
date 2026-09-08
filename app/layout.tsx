import type { Metadata } from "next";
import { Courier_Prime, JetBrains_Mono, Press_Start_2P } from "next/font/google";
import { Nav } from "@/components/nav";
import { SiteFooter } from "@/components/site-footer";
import { SessionProvider } from "@/lib/session-context";
import "./globals.css";

// Mismas familias que references/templates/Arcade Vault.html.
//
// next/font añade a cada variable una fallback escalada por métricas
// ("Press Start 2P Fallback", size-adjust: 224%). Las pilas de globals.css
// nombran las familias directamente para no arrastrarla: ver --pixel/--mono.
const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const courierPrime = Courier_Prime({
  variable: "--font-courier-prime",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arcade Vault",
  description: "Juega clásicos arcade online y compite por el récord mundial.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${pressStart.variable} ${jetBrainsMono.variable} ${courierPrime.variable}`}
    >
      <body>
        {/* capas de fondo del tema: rejilla + scanlines + grano */}
        <div className="av-bg" aria-hidden="true" />
        <div className="av-noise" aria-hidden="true" />
        <SessionProvider>
          <div className="av-shell">
            <Nav />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
