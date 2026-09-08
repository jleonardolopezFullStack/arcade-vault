"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const KEY = "av_user";

export type SessionUser = { name: string };

type SessionValue = {
  user: SessionUser | null;
  ready: boolean;
  signIn: (name: string) => void;
  signOut: () => void;
};

const SessionContext = createContext<SessionValue | null>(null);

function normalize(name: string): string {
  return name.toUpperCase().slice(0, 10);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // Arranca siempre en invitado: leer localStorage aquí rompería la hidratación.
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  // Hidratación: el primer pintado es siempre el de invitado (spec, riesgo 1).
  // set-state-in-effect no contempla leer estado externo del navegador al
  // montar, que es justo lo que el spec exige aquí para no romper la hidratación.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = JSON.parse(window.localStorage.getItem(KEY) ?? "null");
      if (raw && typeof raw === "object" && typeof raw.name === "string") {
        setUser({ name: normalize(raw.name) });
      }
    } catch {
      // sesión corrupta: seguimos como invitado
    }
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const signIn = useCallback((name: string) => {
    const next = { name: normalize(name) };
    setUser(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    try {
      window.localStorage.removeItem(KEY);
    } catch {}
  }, []);

  const value = useMemo<SessionValue>(
    () => ({ user, ready, signIn, signOut }),
    [user, ready, signIn, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession debe usarse dentro de <SessionProvider>");
  return ctx;
}
