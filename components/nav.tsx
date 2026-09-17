"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button, buttonStyles } from "@/components/ui/button";
import { useSession } from "@/lib/session-context";

// El spec fija el colapso a 900px (el prototipo usaba 840px).
const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/biblioteca", label: "Biblioteca" },
  { href: "/salon", label: "Salón de la Fama" },
  { href: "/acerca-de", label: "Acerca de" },
] as const;

const DESKTOP_LINK =
  "relative px-[14px] py-[10px] font-pixel text-[9px] tracking-[0.16em] transition-colors duration-100";
const DESKTOP_ACTIVE =
  "text-cyan [text-shadow:0_0_8px_rgba(0,245,255,0.65)] after:content-[''] after:absolute after:left-[14px] after:right-[14px] after:bottom-1 after:h-0.5 after:bg-cyan after:shadow-[0_0_8px_var(--cyan),0_0_16px_var(--cyan)]";

export function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useSession();

  // «Inicio» es la landing y coincide exacto; un juego (detalle o reproductor)
  // mantiene «Biblioteca» como sección activa.
  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : href === "/biblioteca"
        ? pathname === "/biblioteca" || pathname.startsWith("/juegos")
        : pathname === href || pathname.startsWith(`${href}/`);

  const close = () => setOpen(false);

  return (
    <>
      <nav className="sticky top-0 z-50 flex items-center gap-6 border-b border-line bg-[linear-gradient(180deg,rgba(10,10,15,0.92),rgba(10,10,15,0.78))] px-8 py-[14px] backdrop-blur-[8px] max-[900px]:px-4 max-[900px]:py-3">
        <Link href="/" className="flex items-center gap-[10px]" onClick={close}>
          <span
            aria-hidden="true"
            className="size-7 border border-white/20 bg-[linear-gradient(45deg,var(--magenta)_0_50%,transparent_50%),linear-gradient(-45deg,var(--cyan)_0_50%,transparent_50%)] bg-blend-screen shadow-[0_0_12px_rgba(0,245,255,0.55),inset_0_0_6px_rgba(255,0,110,0.5)]"
          />
          <span className="neon-cyan font-pixel text-[12px] tracking-[0.12em]">
            ARCADE <span className="neon-magenta">VAULT</span>
          </span>
        </Link>

        <div className="ml-8 flex gap-1 max-[900px]:hidden">
          {LINKS.map(({ href, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`${DESKTOP_LINK} ${active ? DESKTOP_ACTIVE : "text-ink-dim hover:text-ink"}`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2 font-pixel text-[9px] text-yellow max-[900px]:hidden">
          <span
            aria-hidden="true"
            className="size-[14px] rounded-full bg-[radial-gradient(circle_at_35%_35%,#fff8b0,#f5ff00_60%,#b0b800)] shadow-[0_0_8px_var(--yellow)]"
          />
          <span>CRÉDITOS · 03</span>
        </div>

        {user ? (
          <Button variant="ghost" className="ml-4" onClick={signOut}>
            {user.name} ▾
          </Button>
        ) : (
          <Link
            href="/acceso"
            className={buttonStyles({ className: "ml-4" })}
            onClick={close}
          >
            Iniciar Sesión
          </Link>
        )}

        <span className="hidden max-[900px]:inline-flex">
          <Button
            variant="ghost"
            aria-label="Menú"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            ≡
          </Button>
        </span>
      </nav>

      <div
        aria-hidden="true"
        onClick={close}
        className={`fixed inset-0 z-[55] bg-black/60 transition-opacity duration-[180ms] ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-[60] flex w-[min(320px,86vw)] flex-col gap-2 border-l border-line bg-bg-2 px-5 py-6 transition-transform duration-[220ms] ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="font-pixel uppercase leading-[1.25] neon-cyan mb-4 text-[11px] tracking-[0.04em]">MENÚ</div>

        {LINKS.map(({ href, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              tabIndex={open ? undefined : -1}
              aria-current={active ? "page" : undefined}
              onClick={close}
              className={`border-b border-dashed border-line-2 px-3 py-[14px] font-pixel text-[11px] ${
                active ? "text-cyan" : "text-ink-dim"
              }`}
            >
              {label}
            </Link>
          );
        })}

        <Link
          href="/acceso"
          tabIndex={open ? undefined : -1}
          aria-current={pathname === "/acceso" ? "page" : undefined}
          onClick={close}
          className={`border-b border-dashed border-line-2 px-3 py-[14px] font-pixel text-[11px] ${
            pathname === "/acceso" ? "text-cyan" : "text-ink-dim"
          }`}
        >
          {user ? "Cuenta" : "Iniciar Sesión"}
        </Link>

        <div className="flex-1" />

        <div className="font-pixel uppercase leading-[1.25] text-[9px] tracking-[0.16em] text-ink-faint">
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
