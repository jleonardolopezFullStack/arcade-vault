"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { formatScore } from "@/lib/format";

type Props = {
  score: number;
  defaultName: string;
  onSave: (name: string) => void;
  onRestart: () => void;
  onExit: () => void;
};

export function GameOverModal({
  score,
  defaultName,
  onSave,
  onRestart,
  onExit,
}: Props) {
  const [name, setName] = useState(defaultName);
  const [saved, setSaved] = useState(false);

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/70 p-5">
      <Panel
        tone="magenta"
        glow
        inner
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-over-title"
        className="w-[min(480px,96vw)] p-8 text-center"
      >
        <h2
          id="game-over-title"
          className="m-0 mb-[18px] font-pixel text-[22px] tracking-[0.12em] text-magenta [text-shadow:0_0_12px_rgba(255,0,110,0.7)]"
        >
          FIN DEL JUEGO
        </h2>

        <div className="font-mono text-[11px] tracking-[0.2em] text-ink-faint uppercase">
          PUNTUACIÓN FINAL
        </div>
        <div className="mt-4 mb-1.5 font-pixel text-4xl text-yellow [text-shadow:0_0_16px_rgba(245,255,0,0.6)]">
          {formatScore(score)}
        </div>

        {saved ? (
          <div className="mt-3.5 inline-block w-0 overflow-hidden border-r-2 border-green font-pixel text-[11px] whitespace-nowrap text-green [animation:typewriter_1.6s_steps(22)_forwards,caret_0.8s_steps(1)_infinite] [text-shadow:0_0_8px_var(--green)]">
            ▸ PUNTUACIÓN GUARDADA_
          </div>
        ) : (
          <div className="mt-[22px] mb-3 flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase().slice(0, 10))}
              placeholder="TUS INICIALES"
              aria-label="Tus iniciales"
              className="h-11 flex-1 border border-line bg-bg px-3 font-mono outline-0 focus:border-cyan focus:shadow-[0_0_10px_rgba(0,245,255,0.35)]"
            />
            <Button
              variant="yellow"
              onClick={() => {
                onSave(name);
                setSaved(true);
              }}
            >
              GUARDAR PUNTUACIÓN
            </Button>
          </div>
        )}

        <div className="mt-[18px] flex flex-wrap justify-center gap-2.5">
          <Button onClick={onRestart}>JUGAR DE NUEVO</Button>
          <Button variant="magenta" onClick={onExit}>
            VOLVER AL VAULT
          </Button>
        </div>
      </Panel>
    </div>
  );
}
