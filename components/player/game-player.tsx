"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { submitScore } from "@/app/juegos/[id]/jugar/actions";
import { GameOverModal } from "@/components/player/game-over-modal";
import { SkinPicker } from "@/components/player/skin-picker";
import { useColorMode } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import type { Game } from "@/lib/catalog";
import { formatScore } from "@/lib/format";
import { DEFAULT_SKIN, isSkinId, skinStorageKey } from "@/lib/games/appearance";
import { isTypingTarget } from "@/lib/games/input";
import { getEngineFactory } from "@/lib/games/registry";
import type {
  Appearance,
  GameEngine,
  GameSnapshot,
  SkinId,
} from "@/lib/games/types";
import { useSession } from "@/lib/session-context";
import { SUBMIT_SCORE_IDLE, type SubmitScoreState } from "@/lib/submit-score";
// El HUD arranca con el estado inicial de una partida; el motor lo corrige en
// su primer fotograma.
const INITIAL_SNAPSHOT: GameSnapshot = { score: 0, lives: 3, level: 1 };
const HUD_LABEL =
  "font-mono text-[10px] tracking-[0.14em] text-ink-faint uppercase";
const HUD_VALUE = "font-pixel text-base";
/** Cartel dentro de la pantalla: mismos roles tipográficos que «EN PAUSA». */
function CrtNotice({
  eyebrow,
  title,
  tone,
  children,
}: {
  eyebrow: string;
  title: string;
  tone: "cyan" | "magenta";
  children: React.ReactNode;
}) {
  return (
    <div className="crt-content">
      <div className="max-w-[86%]">
        <div className="font-mono text-[9px] tracking-[0.3em] text-ink-faint uppercase">
          {eyebrow}
        </div>
        <div
          className={`font-pixel mt-3.5 text-[14px] leading-[1.4] tracking-[0.1em] min-[520px]:text-[22px] min-[520px]:leading-[1.25] uppercase ${
            tone === "cyan" ? "neon-cyan" : "neon-magenta"
          }`}
        >
          {title}
        </div>
        <div className="mx-auto mt-4 mb-3.5 h-px w-16 bg-line" />
        <div className="font-mono text-[11px] leading-[1.7] tracking-[0.12em] text-ink-dim">
          {children}
        </div>
      </div>
    </div>
  );
}
export function GamePlayer({ game }: { game: Game }) {
  const router = useRouter();
  const { user } = useSession();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [snapshot, setSnapshot] = useState<GameSnapshot>(INITIAL_SNAPSHOT);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  // Guardar la marca ya no es instantáneo: hay que pintar guardando, guardado
  // y error con reintento.
  const [saveState, setSaveState] =
    useState<SubmitScoreState>(SUBMIT_SCORE_IDLE);
  // null mientras no se sabe: la consulta es de cliente, nunca del render del
  // servidor.
  const [coarsePointer, setCoarsePointer] = useState<boolean | null>(null);
  // Skin por juego, guardada en localStorage. null hasta leerla: como la
  // sesión, solo se lee tras montar para no romper la hidratación.
  const [skin, setSkin] = useState<SkinId | null>(null);
  const mode = useColorMode();
  // El motor se monta una sola vez con la apariencia de ese momento; los
  // cambios posteriores le llegan por setAppearance, sin remontar.
  const appearanceRef = useRef<Appearance | null>(null);
  const factory = getEngineFactory(game.id);
  const playable = factory !== null && coarsePointer === false;
  const ready = playable && skin !== null && mode !== null;
  useEffect(() => {
    const query = window.matchMedia("(pointer: coarse)");
    const sync = () => setCoarsePointer(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let saved: unknown = null;
    try {
      saved = window.localStorage.getItem(skinStorageKey(game.id));
    } catch {
      // sin almacenamiento: se queda la skin por defecto
    }
    setSkin(isSkinId(saved) ? saved : DEFAULT_SKIN);
  }, [game.id]);
  /* eslint-enable react-hooks/set-state-in-effect */
  const chooseSkin = useCallback(
    (next: SkinId) => {
      setSkin(next);
      try {
        window.localStorage.setItem(skinStorageKey(game.id), next);
      } catch {}
    },
    [game.id],
  );
  // Skin o modo cambiados con la partida en marcha, en pausa o terminada: el
  // motor repinta sin tocar la puntuación.
  useEffect(() => {
    if (skin === null || mode === null) return;
    const next = { skin, mode };
    appearanceRef.current = next;
    engineRef.current?.setAppearance(next);
  }, [skin, mode]);
  // Montaje del motor. Pausa y game over se manejan con métodos, nunca
  // remontando (remontar perdería la partida).
  useEffect(() => {
    const canvas = canvasRef.current;
    const initial = appearanceRef.current;
    if (!factory || !ready || !canvas || !initial) return;
    const engine = factory(
      canvas,
      {
        onSnapshot: setSnapshot,
        onGameOver: (score) => {
          setFinalScore(score);
          setSaveState(SUBMIT_SCORE_IDLE);
          setOver(true);
        },
      },
      initial,
    );
    engineRef.current = engine;
    engine.start();
    // Imprescindible: sin esto el doble montaje de React en modo estricto deja
    // dos bucles y dos juegos de oyentes de teclado vivos.
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [factory, ready]);
  const exit = useCallback(() => {
    router.push(`/juegos/${game.id}`);
  }, [router, game.id]);
  const togglePause = useCallback(() => {
    if (over) return;
    const engine = engineRef.current;
    if (paused) {
      engine?.resume();
      setPaused(false);
    } else {
      engine?.pause();
      setPaused(true);
    }
  }, [over, paused]);
  const end = useCallback(() => {
    engineRef.current?.pause();
    setFinalScore(snapshot.score);
    setSaveState(SUBMIT_SCORE_IDLE);
    setOver(true);
  }, [snapshot.score]);
  const restart = useCallback(() => {
    setSnapshot(INITIAL_SNAPSHOT);
    setFinalScore(0);
    setSaveState(SUBMIT_SCORE_IDLE);
    setPaused(false);
    setOver(false);
    engineRef.current?.restart();
  }, []);
  /**
   * Manda la marca a la base. El reintento vuelve a entrar por aquí con el
   * alias que haya en el modal, así que un fallo no pierde la puntuación.
   */
  const save = useCallback(
    async (name: string) => {
      setSaveState({ status: "saving" });
      setSaveState(await submitScore(game.id, name, finalScore));
    },
    [game.id, finalScore],
  );
  // Atajos de la plataforma. Las teclas de juego (flechas y espacio) las
  // captura el motor, no este componente.
  useEffect(() => {
    if (!playable) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.code === "KeyP") {
        e.preventDefault();
        togglePause();
      } else if (e.code === "Escape") {
        e.preventDefault();
        exit();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [playable, togglePause, exit]);
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
          {playable && (
            <>
              <div className="flex flex-col gap-1">
                <div className={HUD_LABEL}>Puntuación</div>
                <div
                  className={`${HUD_VALUE} text-cyan [text-shadow:0_0_6px_rgba(0,245,255,0.5)] in-data-[theme=light]:[text-shadow:none]`}
                >
                  {formatScore(snapshot.score)}
                </div>
              </div>
              {/* El hueco central lo decide el motor: quien cuenta líneas y no
                  vidas —CAÍDA— emite `lines` y el rótulo cambia con él. */}
              <div className="flex flex-col gap-1">
                <div className={HUD_LABEL}>
                  {snapshot.lines === undefined ? "Vidas" : "Líneas"}
                </div>
                <div
                  className={`${HUD_VALUE} text-magenta [text-shadow:0_0_6px_rgba(255,0,110,0.5)] in-data-[theme=light]:[text-shadow:none]`}
                >
                  {snapshot.lines !== undefined
                    ? formatScore(snapshot.lines)
                    : snapshot.lives > 0
                      ? "♥ ".repeat(snapshot.lives).trim()
                      : "—"}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className={HUD_LABEL}>Nivel</div>
                <div
                  className={`${HUD_VALUE} text-yellow [text-shadow:0_0_6px_rgba(245,255,0,0.5)] in-data-[theme=light]:[text-shadow:none]`}
                >
                  {String(snapshot.level).padStart(2, "0")}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-2.5">
          {playable && (
            <>
              {skin !== null && (
                <SkinPicker value={skin} onChange={chooseSkin} />
              )}
              <Button variant="yellow" onClick={togglePause}>
                {paused ? "REANUDAR" : "PAUSA"}
              </Button>
              <Button variant="magenta" onClick={end}>
                FIN
              </Button>
            </>
          )}
          <Button variant="ghost" onClick={exit}>
            SALIR
          </Button>
        </div>
      </div>
      <div className="crt">
        <div className="crt-screen">
          {!factory ? (
            // Sin motor no hay partida que simular: el gabinete está, la placa
            // no.
            <CrtNotice
              eyebrow="PLACA NO INSTALADA"
              title="PRÓXIMAMENTE"
              tone="cyan"
            >
              {game.title} todavía no se juega aquí. Pulsa SALIR para volver a
              su ficha.
            </CrtNotice>
          ) : coarsePointer ? (
            // Puntero grueso: el motor ni se monta. Los controles táctiles son
            // diseño nuevo y tienen su propio spec.
            <CrtNotice
              eyebrow="SIN TECLADO"
              title="REQUIERE TECLADO"
              tone="magenta"
            >
              {game.title} se juega con las flechas y la barra espaciadora. Abre
              esta pantalla en un ordenador para jugar.
            </CrtNotice>
          ) : (
            // El lienzo interno es 800×600 (4:3) y .crt-screen también, así que
            // estirarlo al 100% conserva la proporción sin tocar una coordenada.
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              aria-label={`Área de juego de ${game.title}`}
              className="absolute inset-0 block h-full w-full"
            />
          )}
          {paused && (
            <div className="crt-content z-5 bg-black/60 in-data-[theme=light]:bg-bg/80">
              <div>
                <div className="font-pixel neon-yellow text-[22px] leading-[1.25] tracking-[0.04em] uppercase">
                  EN PAUSA
                </div>
                <div className="font-mono mt-2.5 text-[11px] tracking-[0.16em] text-ink-dim">
                  PULSA REANUDAR O «P» PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          {playable ? (
            <span className="led">SEÑAL OK</span>
          ) : (
            <span>SIN SEÑAL</span>
          )}
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>
      {over && (
        <GameOverModal
          score={finalScore}
          defaultName={user ? user.name : "INVITADO"}
          state={saveState}
          onSave={save}
          onRestart={restart}
          onExit={() => router.push("/biblioteca")}
        />
      )}
    </div>
  );
}
