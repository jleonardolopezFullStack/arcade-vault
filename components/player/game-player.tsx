"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { GameOverModal } from "@/components/player/game-over-modal";
import { Button } from "@/components/ui/button";
import type { Game } from "@/lib/data";
import { formatScore } from "@/lib/format";
import { saveScore } from "@/lib/local-scores";
import { useSession } from "@/lib/session-context";

// Simulación visual, no un juego: el marcador sube solo a ritmo fijo.
const TICK_MS = 220;
const POINTS_PER_LEVEL = 2500;
const LIVES = 3; // decorativas: ni el prototipo ni este spec las descuentan

const HUD_LABEL =
  "font-mono text-[10px] tracking-[0.14em] text-ink-faint uppercase";
const HUD_VALUE = "font-pixel text-base";

export function GamePlayer({ game }: { game: Game }) {
  const router = useRouter();
  const { user } = useSession();

  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);

  // El nivel se deriva de la puntuación: sube cada 2500 puntos.
  const level = Math.floor(score / POINTS_PER_LEVEL) + 1;

  useEffect(() => {
    if (over || paused) return;
    const t = setInterval(
      () => setScore((s) => s + Math.floor(10 + Math.random() * 90)),
      TICK_MS,
    );
    return () => clearInterval(t);
  }, [over, paused]);

  const restart = () => {
    setScore(0);
    setPaused(false);
    setOver(false);
  };

  return (
    <div className="fade-in mx-auto my-8 max-w-[1100px] px-6 pb-16 max-[720px]:px-4 max-[720px]:pb-8">
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-4 border border-line bg-bg-2 px-[18px] py-[14px]">
        <div className="flex flex-wrap gap-6">
          <div className="flex flex-col gap-1">
            <div className={HUD_LABEL}>Jugador</div>
            <div className={`${HUD_VALUE} text-ink`}>
              {user ? user.name : "INVITADO"}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className={HUD_LABEL}>Puntuación</div>
            <div
              className={`${HUD_VALUE} text-cyan [text-shadow:0_0_6px_rgba(0,245,255,0.5)]`}
            >
              {formatScore(score)}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className={HUD_LABEL}>Vidas</div>
            <div
              className={`${HUD_VALUE} text-magenta [text-shadow:0_0_6px_rgba(255,0,110,0.5)]`}
            >
              {"♥ ".repeat(LIVES).trim()}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className={HUD_LABEL}>Nivel</div>
            <div
              className={`${HUD_VALUE} text-yellow [text-shadow:0_0_6px_rgba(245,255,0,0.5)]`}
            >
              {String(level).padStart(2, "0")}
            </div>
          </div>
        </div>

        <div className="flex gap-2.5">
          <Button variant="yellow" onClick={() => setPaused((p) => !p)}>
            {paused ? "REANUDAR" : "PAUSA"}
          </Button>
          <Button variant="magenta" onClick={() => setOver(true)}>
            FIN
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push(`/juegos/${game.id}`)}
          >
            SALIR
          </Button>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          <div className="game-arena">
            <div className="grid-floor" />
            <div className="enemy e1" />
            <div className="enemy e2" />
            <div className="enemy e3" />
            <div className="player-ship" />
          </div>

          {paused && (
            <div className="crt-content z-5 bg-black/60">
              <div>
                <div className="font-pixel uppercase leading-[1.25] neon-yellow text-[22px] tracking-[0.04em]">EN PAUSA</div>
                <div className="font-mono mt-2.5 text-[11px] tracking-[0.16em] text-ink-dim">
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>

      {over && (
        <GameOverModal
          score={score}
          defaultName={user ? user.name : "INVITADO"}
          onSave={(name) => saveScore({ game: game.id, name, score })}
          onRestart={restart}
          onExit={() => router.push("/")}
        />
      )}
    </div>
  );
}
