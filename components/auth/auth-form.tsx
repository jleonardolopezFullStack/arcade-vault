"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { useSession } from "@/lib/session-context";

type Tab = "in" | "up";

const TAB = "cursor-pointer border-0 bg-transparent p-3 font-pixel text-[9px] tracking-[0.14em] transition-colors";
const TAB_ON =
  "bg-cyan/8 text-cyan [text-shadow:0_0_6px_rgba(0,245,255,0.5)]";
const FIELD = "flex flex-col gap-1.5";
const LABEL =
  "font-mono text-[10px] tracking-[0.16em] text-ink-faint uppercase";
const INPUT =
  "h-11 border border-line bg-bg px-3 font-mono outline-0 transition-[border-color,box-shadow] duration-150 placeholder:text-ink-faint focus:border-cyan focus:shadow-[0_0_12px_rgba(0,245,255,0.35)]";

export function AuthForm() {
  const router = useRouter();
  const { signIn, signOut } = useSession();

  const [tab, setTab] = useState<Tab>("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Sin backend: no se valida nada, solo se abre la sesión falsa.
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn(name || "PLAYER1");
    router.push("/biblioteca");
  };

  const playAsGuest = () => {
    signOut();
    router.push("/biblioteca");
  };

  return (
    <div className="fade-in flex items-center justify-center px-5 py-15">
      <Panel glow inner className="w-[min(440px,100%)] p-7">
        <div className="mb-[18px] text-center">
          <div
            aria-hidden="true"
            className="mx-auto mb-3 size-14 border border-white/20 bg-[linear-gradient(45deg,var(--magenta)_0_50%,transparent_50%),linear-gradient(-45deg,var(--cyan)_0_50%,transparent_50%)] bg-blend-screen shadow-[0_0_16px_rgba(0,245,255,0.55),inset_0_0_8px_rgba(255,0,110,0.5)]"
          />
          <h2 className="neon-cyan mt-1 mb-0 font-pixel text-base tracking-[0.1em]">
            ARCADE VAULT
          </h2>
          <div className="font-mono mt-1.5 text-[11px] tracking-[0.16em] text-ink-faint">
            ACCESO AL SISTEMA · v2.6
          </div>
        </div>

        <div className="my-[18px] grid grid-cols-2 border border-line">
          <button
            type="button"
            aria-pressed={tab === "in"}
            onClick={() => setTab("in")}
            className={`${TAB} ${tab === "in" ? TAB_ON : "text-ink-dim"}`}
          >
            INICIAR SESIÓN
          </button>
          <button
            type="button"
            aria-pressed={tab === "up"}
            onClick={() => setTab("up")}
            className={`${TAB} ${tab === "up" ? TAB_ON : "text-ink-dim"}`}
          >
            CREAR CUENTA
          </button>
        </div>

        <form onSubmit={submit}>
          <div className={`${FIELD} mb-3`}>
            <label className={LABEL} htmlFor="auth-user">
              Usuario
            </label>
            <input
              id="auth-user"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="px_kai"
              className={INPUT}
            />
          </div>

          {tab === "up" && (
            <div className={`${FIELD} slide-in mb-3`}>
              <label className={LABEL} htmlFor="auth-email">
                Correo electrónico
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jugador@vault.gg"
                className={INPUT}
              />
            </div>
          )}

          <div className={`${FIELD} mb-3`}>
            <label className={LABEL} htmlFor="auth-password">
              Contraseña
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={INPUT}
            />
          </div>

          <Button type="submit" size="lg" className="mt-2 w-full">
            {tab === "in" ? "ENTRAR AL VAULT" : "CREAR Y JUGAR"}
          </Button>
        </form>

        <Button variant="ghost" className="mt-2.5 w-full" onClick={playAsGuest}>
          JUGAR COMO INVITADO
        </Button>

        <div className="my-4 flex items-center gap-3 font-pixel text-[8px] tracking-[0.16em] text-ink-faint before:h-px before:flex-1 before:bg-line before:content-[''] after:h-px after:flex-1 after:bg-line after:content-['']">
          O CONTINÚA CON
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Button variant="ghost" size="sm">
            ◆ GOOGLE
          </Button>
          <Button variant="ghost" size="sm">
            ▣ GITHUB
          </Button>
        </div>

        <div className="mt-[18px] text-center text-[11px] tracking-[0.1em] text-ink-faint">
          AL ENTRAR ACEPTAS LOS TÉRMINOS DEL SALÓN ARCADE
        </div>
      </Panel>
    </div>
  );
}
