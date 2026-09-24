# SPEC 05 — «ROCAS» jugable: el Asteroids de referencia dentro del reproductor

**Estado:** Implementado
**Depende de:** SPEC 01
**Fecha:** 2026-09-24

**Objetivo:** Portar el juego de `references/RRO5vePTlqkYrGHjYdtf_started-games/02-asteroids/game.js` a un motor TypeScript que el reproductor monte en `/juegos/rocas/jugar`, junto al registro de motores que decidirá, para cualquier juego, si hay partida real o cartel de «próximamente».

---

## 1. Alcance

### Dentro

- **Motor portado** a `lib/games/asteroides/`, en TypeScript estricto y **sin globals**: nada de `document.getElementById`, ni variables de módulo con el estado de la partida, ni `requestAnimationFrame` al cargar el fichero. El comportamiento del juego se porta **1:1** (física, envolvimiento toroidal, tamaños de asteroide, puntuación, 3 vidas, invencibilidad al reaparecer, partículas, power-up de triple disparo).
- **Interfaz común de motores** en `lib/games/types.ts` y **registro** en `lib/games/registry.ts`: `rocas` → fábrica del motor; el resto del catálogo, sin motor.
- **`GamePlayer` reescrito** para elegir entre tres ramas:
  | Situación                            | Qué se ve                                            |
  | ------------------------------------ | ---------------------------------------------------- |
  | Hay motor para el `id` y hay teclado | Canvas jugable dentro del marco CRT                  |
  | Hay motor pero el puntero es táctil  | Aviso tematizado «REQUIERE TECLADO» dentro del marco |
  | No hay motor (los otros 7 juegos)    | Cartel tematizado «PRÓXIMAMENTE»                     |
- **Los dos HUD a la vez**: el canvas conserva el suyo (SCORE, NIVEL, iconos de vida, contador del power-up) y además el motor emite su estado para alimentar el HUD de React que ya existe (Jugador · Puntuación · Vidas · Nivel).
- **Repintado con la paleta del Vault**: nave en cian, balas en amarillo, asteroides en tinta tenue, power-up y propulsor en magenta, texto del HUD del canvas con los tokens del tema.
- **Escalado 4:3**: el canvas sigue siendo de 800×600 por dentro (coordenadas y física intactas) y se estira por CSS hasta llenar el marco CRT conservando la proporción.
- **Controles**: `←` `→` rotar, `↑` propulsar, `Espacio` disparar; **`P`** pausa/reanuda y **`Escape`** sale al detalle del juego, además de los botones PAUSA / FIN / SALIR que ya existen. Mientras la partida está montada, flechas y espacio **no** hacen scroll de la página.
- **Fin de partida**: al agotar las vidas manda el **`GameOverModal` de la plataforma** —guardar la marca en `localStorage['av_scores']`, REINICIAR, SALIR—. El overlay «GAME OVER» del canvas se conserva de fondo, pero el motor **deja de reiniciar con Espacio**: quien reinicia es el modal.
- **Limpieza al desmontar**: se cancela el bucle, se retiran los oyentes de teclado y se descarta el estado de la partida al salir de la ruta.

### Fuera (explícitamente)

- **Los otros siete motores.** Este spec solo integra `rocas`. Los demás pasan a «PRÓXIMAMENTE» y esperan su turno.
- **La simulación de marcador actual.** Se retira: el `setInterval` que subía puntos solo era el relleno de SPEC 01. Nadie la hereda.
- **Persistencia remota de las marcas.** La partida guarda en `localStorage['av_scores']` como hasta ahora; Supabase llegará en su propio spec.
- **Controles táctiles.** Ni botones en pantalla, ni giroscopio, ni gestos. En táctil se ve el aviso y no se juega.
- **Sonido.** El juego de referencia no tiene, y no se inventa.
- **Cambios de balance o contenido nuevo.** Ni niveles distintos, ni OVNIs, ni power-ups adicionales, ni ajustes de dificultad. Lo que hay en `game.js` es lo que habrá.
- **Cambios en el catálogo.** `lib/data.ts` no se toca: `rocas` conserva id, título, portada, copy, `best` y `plays`. Biblioteca, detalle y Salón de la Fama siguen igual.
- **Tabla de récords dentro del juego.** El canvas no pinta rankings; eso es del detalle y del salón.
- **Editar el juego de referencia.** `references/RRO5vePTlqkYrGHjYdtf_started-games/02-asteroids/` se porta, no se modifica.
- **Tests.** Sigue sin haber runner configurado.

---

## 2. Modelo de datos

No hay persistencia nueva: las marcas siguen guardándose con `saveScore()` de `lib/local-scores.ts`, con `game: "rocas"`. Lo que sí es nuevo son los tipos que enlazan motor y reproductor.

### `lib/games/types.ts` — contrato de todos los motores

```ts
/** Lo que el motor publica hacia el HUD de React. */
export type GameSnapshot = {
  score: number;
  lives: number;
  level: number;
};

export type GameEngine = {
  /** Arranca el bucle y engancha el teclado. */
  start(): void;
  /** Congela el bucle sin perder la partida. */
  pause(): void;
  resume(): void;
  /** Vuelve a empezar de cero (lo llama el modal de game over). */
  restart(): void;
  /** Cancela el bucle, retira oyentes y libera el canvas. */
  destroy(): void;
};

export type GameEngineHooks = {
  /** Solo se invoca cuando alguno de los tres valores cambia. */
  onSnapshot(snapshot: GameSnapshot): void;
  /** Vidas agotadas. El reproductor abre el modal. */
  onGameOver(finalScore: number): void;
};

export type GameEngineFactory = (
  canvas: HTMLCanvasElement,
  hooks: GameEngineHooks,
) => GameEngine;
```

### `lib/games/registry.ts` — qué juego tiene motor

```ts
import type { GameEngineFactory } from "./types";
import { createAsteroidesEngine } from "./asteroides";

// Clave = Game["id"] de lib/data.ts. Los ids ausentes muestran «PRÓXIMAMENTE».
const ENGINES: Record<string, GameEngineFactory> = {
  rocas: createAsteroidesEngine,
};

export function getEngineFactory(id: string): GameEngineFactory | null;
```

### `lib/games/asteroides/` — el motor

Constantes portadas literalmente de `game.js`, sin cambiar un número:

| Constante                                                                    | Valor                                                      |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `W` × `H`                                                                    | `800` × `600` (mundo interno; el escalado es cosa del CSS) |
| `RADII`                                                                      | `[0, 16, 30, 50]` por tamaño 1/2/3                         |
| `SPEEDS`                                                                     | `[0, 85, 55, 32]`                                          |
| `POINTS`                                                                     | `[0, 100, 50, 20]`                                         |
| `POWERUP_DROP_CHANCE` · `POWERUP_DURATION` · `POWERUP_TTL` · `TRIPLE_SPREAD` | `0.15` · `5` · `12` · `0.18`                               |
| Vidas iniciales · asteroides del nivel 1 · `dt` máximo                       | `3` · `4` · `50 ms`                                        |

Estado interno de la partida (`ship`, `bullets`, `asteroids`, `particles`, `powerUps`, `score`, `lives`, `level`, `status`, `deadTimer`) vive **dentro de la instancia** que devuelve la fábrica, nunca en variables de módulo: dos pantallas montadas a la vez no se pisan.

`status` conserva los tres valores del original: `"playing" | "dead" | "gameover"`.

### Paleta del canvas

```ts
const PALETTE = {
  bg: "#0a0a0f", // --bg
  ship: "#00f5ff", // --cyan
  bullet: "#f5ff00", // --yellow
  rock: "#8a8fb5", // --ink-dim
  thrust: "#ff006e", // --magenta
  powerUp: "#ff006e", // --magenta
  hud: "#e6e9ff", // --ink
} as const;
```

Los valores se escriben literales en el motor: `ctx` no entiende variables CSS, y leerlas con `getComputedStyle` en cada fotograma sería caro.

---

## 3. Plan de implementación

Cada paso deja el proyecto compilando; hasta el 6 la aplicación se comporta exactamente como hoy.

1. **Contrato y registro.** Crear `lib/games/types.ts` con los tipos de arriba y `lib/games/registry.ts` con el mapa vacío y `getEngineFactory()`. Nadie los usa todavía.

2. **Portar el motor.** Traducir `game.js` a TypeScript en `lib/games/asteroides/` (clases `Bullet`, `Asteroid`, `Ship`, `Particle`, `PowerUp` y las utilidades `wrap`, `dist`, `rand`, `randInt`). Cada clase recibe el `ctx` y las dimensiones en vez de leerlos del ámbito global. Sin bucle, sin teclado, sin efectos al importar: solo lógica.

3. **Fábrica y bucle.** `createAsteroidesEngine(canvas, hooks)` en `lib/games/asteroides/index.ts`: monta el estado, expone `start` / `pause` / `resume` / `restart` / `destroy`, corre el `requestAnimationFrame` con el `dt` capado a 50 ms, engancha `keydown` / `keyup` con `preventDefault` en flechas y espacio, emite `onSnapshot` **solo cuando cambia** alguno de los tres valores y llama a `onGameOver(score)` al agotar las vidas. Se retira el reinicio con Espacio del estado `gameover`.

4. **Repintado.** Sustituir los colores del original (`#fff`, `#0ff`, `rgba(255,130,0,…)`) por `PALETTE`, y el HUD del canvas por su versión con los tokens del tema. El dibujo del overlay «GAME OVER» se mantiene, sin la línea de «ESPACIO PARA REINICIAR».

5. **Registrar el juego.** Añadir `rocas: createAsteroidesEngine` al mapa de `registry.ts`.

6. **Reescribir `GamePlayer`.** Sustituir la simulación por: `<canvas width={800} height={600}>` con escalado CSS 4:3 dentro de `.crt-screen`, montaje del motor en un efecto con su `destroy()` en la limpieza, HUD alimentado por `onSnapshot`, botones PAUSA / FIN / SALIR conectados al motor, y atajos `P` y `Escape`.

7. **Rama sin motor.** Cuando `getEngineFactory(id)` devuelve `null`, pintar el cartel «PRÓXIMAMENTE» tematizado dentro del marco CRT (mismo lenguaje visual que el overlay de pausa), sin HUD vivo ni botones de partida.

8. **Rama táctil.** Si el puntero es grueso (`matchMedia("(pointer: coarse)")`), mostrar el aviso «REQUIERE TECLADO» en lugar de arrancar el motor. La comprobación se hace tras montar, nunca durante el render del servidor.

9. **Fin de partida.** `onGameOver` abre el `GameOverModal` que ya existe: `onSave` sigue llamando a `saveScore({ game: game.id, name, score })`, `onRestart` llama a `engine.restart()` y `onExit` navega a `/biblioteca`.

10. **Cierre.** `npm run lint` y `npm run build` limpios; partida real en `/juegos/rocas/jugar` (disparar, partir asteroides, coger el power-up, perder las tres vidas, guardar la marca y reiniciar); comprobar una ruta sin motor y el resto de pantallas.

---

## 4. Criterios de aceptación

- [ ] En `/juegos/rocas/jugar` se juega de verdad: la nave rota, propulsa y dispara con teclado, y los asteroides grandes se parten en medianos y estos en pequeños.
- [ ] La puntuación sube 20 / 50 / 100 por asteroide grande / mediano / pequeño.
- [ ] Al chocar se pierde una vida, la nave reaparece parpadeando y con tres choques la partida termina.
- [ ] El HUD de React (Puntuación, Vidas, Nivel) cambia a la vez que el del canvas, sin desfase perceptible.
- [ ] Al superar el último asteroide sube el nivel y aparecen más rocas.
- [ ] PAUSA congela el juego y REANUDAR lo sigue donde estaba; `P` hace lo mismo.
- [ ] `Escape` y SALIR llevan a `/juegos/rocas`; FIN abre el modal de game over.
- [ ] El modal guarda la marca: reaparece en «TU MEJOR MARCA» del salón.
- [ ] ~~Reaparece también en el detalle de `rocas`.~~ **Aplazado a su propio spec.** `components/detail/` nunca ha leído `av_scores` —su tabla de puntuaciones la fabrica `seededScores()`— y el apartado «Fuera» de este spec prohíbe tocar esa pantalla. El criterio se contradecía con su propio alcance; la marca propia en el detalle se diseña aparte.
- [ ] REINICIAR en el modal arranca una partida nueva con 0 puntos, 3 vidas y nivel 1.
- [ ] Mientras se juega, las flechas y el espacio **no** hacen scroll de la página.
- [ ] Al salir de la ruta el bucle se detiene: no hay fotogramas ni oyentes de teclado vivos (verificable en el panel de rendimiento, o porque teclear en otra pantalla no provoca nada).
- [ ] El canvas mantiene la proporción 4:3 a cualquier ancho y no desborda el marco CRT en móvil.
- [ ] Con puntero táctil se ve el aviso «REQUIERE TECLADO» y no arranca el motor.
- [ ] Los otros siete juegos muestran «PRÓXIMAMENTE» y ya no simulan puntuación.
- [ ] El juego se pinta con la paleta del Vault: nave cian, balas amarillas, asteroides en tinta tenue, power-up magenta.
- [ ] `lib/data.ts`, `lib/local-scores.ts` y las pantallas de biblioteca, detalle y salón están sin tocar.
- [ ] `references/RRO5vePTlqkYrGHjYdtf_started-games/02-asteroids/` no tiene ningún cambio.
- [ ] `npm run lint` y `npm run build` terminan sin errores ni avisos nuevos.

---

## 5. Decisiones tomadas y descartadas

| Decisión                                           | Alternativa descartada                                                | Motivo                                                                                                                                                                                                                       |
| -------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El juego vive en la ficha **`rocas`**              | Crear una entrada `asteroides`, o renombrar `rocas`                   | La ficha ya describe este juego («Pulveriza asteroides en gravedad cero»), con portada, categoría y ruta. Renombrar rompería enlaces, `generateStaticParams` y las marcas ya guardadas.                                      |
| Motor **portado a TypeScript**                     | Copiar `game.js` a `public/` con `<script>`, o meterlo en un `iframe` | Es lo único que permite que el HUD, la pausa y el game over de la plataforma controlen la partida. El `<script>` seguiría en globals de `window`; el `iframe` incomunica todo salvo por `postMessage` y duplicaría el marco. |
| **Los dos HUD**                                    | Solo el de React, o solo el del canvas                                | Decisión del usuario: el canvas conserva su carácter de recreativa y el HUD de la plataforma mantiene la coherencia con el resto del Vault. Coste asumido: la misma cifra aparece dos veces.                                 |
| **Registro genérico ya**, con un solo motor        | Esperar al segundo juego para abstraer                                | Decisión del usuario. Con el registro, `/juegos/[id]/jugar` deja de tratar todos los juegos igual y añadir el siguiente motor es una línea.                                                                                  |
| **«PRÓXIMAMENTE»** para los juegos sin motor       | Conservar la simulación de SPEC 01                                    | Decisión del usuario: siete pantallas que fingen una partida engañan más de lo que aportan ahora que existe una de verdad.                                                                                                   |
| Manda el **modal de la plataforma** al morir       | El overlay del canvas con Espacio para reiniciar                      | Es el único camino por el que la marca se guarda. El overlay se queda de fondo, pero sin el reinicio con Espacio, que competiría con el modal.                                                                               |
| Canvas interno **800×600 escalado por CSS**        | Canvas fijo, o mundo que se recalcula al redimensionar                | La física, el envolvimiento de bordes y los spawns están calibrados para ese lienzo. Escalar por CSS no toca una sola coordenada; recalcular el mundo obligaría a revalidarlo entero.                                        |
| **`P` y `Escape`** además de los botones           | Solo los botones                                                      | Decisión del usuario: son los atajos que cualquiera prueba en una recreativa.                                                                                                                                                |
| **Repintado con la paleta del Vault**              | Portar el blanco sobre negro del original                             | Decisión del usuario: integrado con el marco CRT y el resto de la plataforma. Coste: el motor se separa visualmente de su versión de referencia.                                                                             |
| Teclado **activo al montar**, con `preventDefault` | Exigir clic en el canvas para activarlo                               | Entras a jugar, juegas. El secuestro de teclas se limita a la pantalla del reproductor y se retira al desmontar.                                                                                                             |
| Aviso **«requiere teclado»** en táctil             | Controles en pantalla, o montarlo igual                               | Los controles táctiles son diseño nuevo y merecen su propio spec; montarlo sin controles sería una nave quieta esperando a morir.                                                                                            |

---

## 6. Riesgos identificados

1. **Dos HUD con la misma cifra.** Es una decisión consciente, pero si el puente `onSnapshot` se retrasa un fotograma, se verá un número distinto en cada sitio durante un instante. Mitigación: emitir en el mismo fotograma en que cambia el estado, no con un temporizador aparte.
2. **Doble montaje en desarrollo.** React monta y desmonta los efectos dos veces en modo estricto. Si `destroy()` no cancela el `requestAnimationFrame` y los oyentes, quedan dos bucles corriendo y el juego va al doble de velocidad. Es el fallo más probable de todo el spec.
3. **Secuestro del teclado.** `preventDefault` en flechas y espacio impide el scroll mientras juegas. Si un oyente sobrevive al desmontaje, la página entera se queda sin scroll: el mismo síntoma del riesgo 2, con otra cara.
4. **Nitidez al escalar.** En pantallas grandes, 800×600 estirados se ven blandos. Aceptado a cambio de no tocar la física; si molesta, se revisa con `devicePixelRatio` en otro spec.
5. **Deriva respecto al original.** Al repintar y reestructurar, el motor deja de ser comparable línea a línea con `game.js`. Conviene anotar en el código qué se cambió a propósito (colores, ausencia de globals, reinicio) para que la próxima comparación no confunda un port con un fallo.
6. **Retirar la simulación.** Siete pantallas dejan de «jugarse». Es lo pedido, pero es una pérdida de funcionalidad aparente respecto a la demo actual; conviene tenerlo presente al enseñar el proyecto.
7. **Rendimiento en equipos modestos.** El original no se probó dentro de un marco con scanlines, ruido y filtros CSS. Si el reproductor va a tirones, el sospechoso es el efecto CRT, no el juego.
