// Fábrica del motor de «ROCAS» (el Asteroids de
// references/RRO5vePTlqkYrGHjYdtf_started-games/02-asteroids/game.js).
//
// Diferencias deliberadas respecto al original (ver SPEC 05, riesgo 5):
//   - Todo el estado de la partida vive dentro de la instancia que devuelve la
//     fábrica: dos reproductores montados a la vez no se pisan.
//   - El bucle y el teclado se enganchan en start() y se retiran en destroy();
//     importar este módulo no tiene ningún efecto.
//   - Desde `gameover` ya no se reinicia con Espacio: reinicia el modal de la
//     plataforma a través de restart().
// La física, los tamaños, las velocidades y la puntuación son idénticos.
import type { GameEngine, GameEngineHooks, GameSnapshot } from "../types";
import {
  FONT_MONO,
  FONT_PIXEL,
  INITIAL_LIVES,
  LEVEL_1_ASTEROIDS,
  MAX_DT,
  PALETTE,
  POWERUP_DROP_CHANCE,
  POWERUP_DURATION,
  H,
  W,
} from "./constants";
import { isTypingTarget } from "../input";
import { Asteroid, Bullet, Particle, PowerUp, Ship } from "./entities";
import { dist, rand } from "./utils";
/** Teclas cuyo comportamiento por defecto (scroll) se anula mientras se juega. */
const CAPTURED_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Space",
]);
type Status = "playing" | "dead" | "gameover";
export function createAsteroidesEngine(
  canvas: HTMLCanvasElement,
  hooks: GameEngineHooks,
): GameEngine {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("ROCAS: el canvas no da contexto 2d");
  // Tipado aparte: el estrechamiento de `context` no viaja a los closures.
  const ctx: CanvasRenderingContext2D = context;
  // ── Entrada ───────────────────────────────────────────────────────────────
  const keys: Record<string, boolean> = {};
  const justPressed: Record<string, boolean> = {};
  const onKeyDown = (e: KeyboardEvent) => {
    // Escribir en un campo manda sobre el juego: el modal de fin de partida
    // pide el nombre, y ahí el espacio y las flechas son del teclado, no de
    // la nave.
    if (isTypingTarget(e.target)) return;
    if (CAPTURED_KEYS.has(e.code)) e.preventDefault();
    if (!keys[e.code]) justPressed[e.code] = true;
    keys[e.code] = true;
  };
  const onKeyUp = (e: KeyboardEvent) => {
    // La tecla se suelta siempre, aunque el foco haya saltado a un campo
    // mientras estaba pulsada: si no, se queda pegada.
    keys[e.code] = false;
    if (!isTypingTarget(e.target) && CAPTURED_KEYS.has(e.code))
      e.preventDefault();
  };
  function pressed(code: string) {
    const val = justPressed[code];
    justPressed[code] = false;
    return !!val;
  }
  function clearInput() {
    for (const code of Object.keys(keys)) keys[code] = false;
    for (const code of Object.keys(justPressed)) justPressed[code] = false;
  }
  // ── Estado de la partida ──────────────────────────────────────────────────
  let ship = new Ship();
  let bullets: Bullet[] = [];
  let asteroids: Asteroid[] = [];
  let particles: Particle[] = [];
  let powerUps: PowerUp[] = [];
  let score = 0;
  let lives = INITIAL_LIVES;
  let level = 1;
  let status: Status = "playing";
  let deadTimer = 0;
  let powerUpSpawned = false;
  let killsSinceSpawn = 0;
  // ── Bucle ─────────────────────────────────────────────────────────────────
  let rafId: number | null = null;
  let lastTime: number | null = null;
  let destroyed = false;
  let listening = false;
  /** null hasta el primer fotograma: así el HUD recibe el estado inicial. */
  let lastSnapshot: GameSnapshot | null = null;
  function spawnAsteroids(count: number) {
    const SAFE_DIST = 130;
    for (let i = 0; i < count; i++) {
      let x: number;
      let y: number;
      do {
        x = rand(0, W);
        y = rand(0, H);
      } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
      asteroids.push(new Asteroid(x, y, 3));
    }
  }
  function initGame() {
    ship = new Ship();
    bullets = [];
    asteroids = [];
    particles = [];
    powerUps = [];
    powerUpSpawned = false;
    killsSinceSpawn = 0;
    score = 0;
    lives = INITIAL_LIVES;
    level = 1;
    status = "playing";
    deadTimer = 0;
    spawnAsteroids(LEVEL_1_ASTEROIDS);
  }
  function nextLevel() {
    level++;
    bullets = [];
    particles = [];
    powerUps = [];
    powerUpSpawned = false;
    killsSinceSpawn = 0;
    ship.reset();
    spawnAsteroids(3 + level);
  }
  function explode(x: number, y: number, count = 8) {
    for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
  }
  function killShip() {
    explode(ship.x, ship.y, 14);
    ship.dead = true;
    lives--;
    if (lives <= 0) {
      status = "gameover";
      hooks.onGameOver(score);
    } else {
      status = "dead";
      deadTimer = 2;
    }
  }
  /** El HUD de React solo se avisa cuando cambia alguno de los tres valores. */
  function emitSnapshot() {
    if (
      lastSnapshot !== null &&
      lastSnapshot.score === score &&
      lastSnapshot.lives === lives &&
      lastSnapshot.level === level
    )
      return;
    lastSnapshot = { score, lives, level };
    hooks.onSnapshot(lastSnapshot);
  }
  // ── Update ────────────────────────────────────────────────────────────────
  function update(dt: number) {
    if (status === "gameover") {
      // Sin reinicio con Espacio: manda el modal de la plataforma.
      particles.forEach((p) => p.update(dt));
      particles = particles.filter((p) => !p.dead);
      return;
    }
    if (status === "dead") {
      deadTimer -= dt;
      particles.forEach((p) => p.update(dt));
      particles = particles.filter((p) => !p.dead);
      asteroids.forEach((a) => a.update(dt));
      if (deadTimer <= 0) {
        status = "playing";
        ship.reset();
      }
      return;
    }
    // Disparar
    if (pressed("Space")) {
      bullets.push(...ship.tryShoot());
    }
    ship.update(dt, keys);
    bullets.forEach((b) => b.update(dt));
    asteroids.forEach((a) => a.update(dt));
    particles.forEach((p) => p.update(dt));
    powerUps.forEach((p) => p.update(dt));
    bullets = bullets.filter((b) => !b.dead);
    particles = particles.filter((p) => !p.dead);
    powerUps = powerUps.filter((p) => !p.dead);
    for (const p of powerUps) {
      if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
        p.dead = true;
        ship.tripleShot = POWERUP_DURATION;
      }
    }
    // Bala vs asteroide
    const newAsteroids: Asteroid[] = [];
    for (const b of bullets) {
      for (const a of asteroids) {
        if (!a.dead && !b.dead && dist(b, a) < a.radius) {
          b.dead = true;
          a.dead = true;
          score += a.points;
          explode(a.x, a.y, a.size * 5);
          newAsteroids.push(...a.split());
          if (!powerUpSpawned) {
            killsSinceSpawn++;
            const guaranteed = killsSinceSpawn >= 5;
            if (guaranteed || Math.random() < POWERUP_DROP_CHANCE) {
              powerUps.push(new PowerUp(a.x, a.y));
              powerUpSpawned = true;
            }
          }
        }
      }
    }
    asteroids = asteroids.filter((a) => !a.dead).concat(newAsteroids);
    bullets = bullets.filter((b) => !b.dead);
    // Nave vs asteroide
    if (ship.invincible <= 0) {
      for (const a of asteroids) {
        if (dist(ship, a) < ship.radius + a.radius * 0.82) {
          killShip();
          break;
        }
      }
    }
    // Nivel completado
    if (asteroids.length === 0) nextLevel();
  }
  // ── Draw ──────────────────────────────────────────────────────────────────
  function drawLifeIcon(x: number, y: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 2);
    ctx.strokeStyle = PALETTE.ship;
    ctx.lineWidth = 1.2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-6, -5);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, 5);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
  function drawHUD() {
    ctx.fillStyle = PALETTE.hud;
    ctx.font = `15px ${FONT_MONO}`;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    ctx.fillText(`SCORE  ${score}`, 14, 26);
    ctx.textAlign = "center";
    ctx.fillText(`NIVEL ${level}`, W / 2, 26);
    for (let i = 0; i < lives; i++) drawLifeIcon(W - 16 - i * 22, 18);
    if (ship.tripleShot > 0) {
      ctx.textAlign = "left";
      ctx.fillStyle = PALETTE.powerUp;
      ctx.fillText(`3x  ${ship.tripleShot.toFixed(1)}s`, 14, 46);
    }
  }
  function drawOverlay(title: string, sub: string) {
    ctx.textAlign = "center";
    ctx.fillStyle = PALETTE.hud;
    ctx.font = `34px ${FONT_PIXEL}`;
    ctx.fillText(title, W / 2, H / 2 - 18);
    ctx.font = `18px ${FONT_MONO}`;
    ctx.fillStyle = PALETTE.rock;
    ctx.fillText(sub, W / 2, H / 2 + 22);
  }
  function draw() {
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, W, H);
    particles.forEach((p) => p.draw(ctx));
    asteroids.forEach((a) => a.draw(ctx));
    powerUps.forEach((p) => p.draw(ctx));
    bullets.forEach((b) => b.draw(ctx));
    ship.draw(ctx);
    drawHUD();
    if (status === "gameover") drawOverlay("GAME OVER", `PUNTAJE: ${score}`);
  }
  function frame(ts: number) {
    const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, MAX_DT);
    lastTime = ts;
    update(dt);
    draw();
    emitSnapshot();
    rafId = requestAnimationFrame(frame);
  }
  function runLoop() {
    if (rafId !== null || destroyed) return;
    lastTime = null; // el primer fotograma tras arrancar o reanudar avanza 0
    rafId = requestAnimationFrame(frame);
  }
  function stopLoop() {
    if (rafId === null) return;
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  return {
    start() {
      if (destroyed) return;
      if (!listening) {
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
        listening = true;
      }
      initGame();
      runLoop();
    },
    pause() {
      stopLoop();
      // Un keyup ocurrido en pausa no debe dejar la tecla pegada al reanudar.
      clearInput();
    },
    resume() {
      runLoop();
    },
    restart() {
      if (destroyed) return;
      clearInput();
      initGame();
      runLoop();
    },
    destroy() {
      destroyed = true;
      stopLoop();
      if (listening) {
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
        listening = false;
      }
      clearInput();
      bullets = [];
      asteroids = [];
      particles = [];
      powerUps = [];
      lastSnapshot = null;
    },
  };
}
