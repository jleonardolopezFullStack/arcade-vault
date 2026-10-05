# SPEC 09 — «SERPENTINA» jugable: la serpiente de rejilla con vidas y frutas de neón

**Estado:** Implementado
**Depende de:** SPEC 05, SPEC 06
**Fecha:** 2026-10-05

**Objetivo:** Construir un motor TypeScript en `lib/games/serpiente/` que el reproductor monte en `/juegos/serpentina/jugar`: una serpiente de rejilla con tres vidas, paredes mortales y frutas dibujadas con primitivas y la paleta del Vault.

---

## 1. Alcance

### Dentro

- **Motor nuevo** en `lib/games/serpiente/`, en TypeScript estricto y **sin globals**: nada de `document.getElementById`, ni variables de módulo con el estado de la partida, ni `requestAnimationFrame` al cargar el fichero. **No es un porte**: en `references/RRO5vePTlqkYrGHjYdtf_started-games/` no hay snake —solo `02-asteroids`, `03-tetris` y `04-arkanoid`—, así que la mecánica se escribe desde cero contra el copy de la ficha y los invariantes de SPEC 05.
- **Rejilla de 38 × 26 celdas de 20 px** dentro del lienzo de 800 × 600 del reproductor, con banda de HUD de 40 px arriba. Ninguna coordenada se recalcula al escalar.
- **Sistema de vidas, como el resto de la plataforma.** Tres vidas; chocar contra la pared o contra la propia cola cuesta una, la serpiente reaparece en el centro con longitud 3 y parada, y se conservan puntuación y nivel. Con tres choques, fin de partida.
- **Paredes mortales**, con el marco del tablero pintado para que el límite se vea. **No hay envolvimiento toroidal.**
- **Sin binarios.** `start()` sigue siendo **sincrónico y sin fase de carga**, igual que en los tres motores que ya existen: ni imágenes, ni audio, ni fuentes propias, ni una sola petición de red. Todo se dibuja con primitivas de canvas y la paleta del Vault, como hizo SPEC 08 con el spritesheet del arkanoid.
- **Cinco siluetas de fruta** —manzana, racimo, baya, rodaja y estrella—, dibujadas con primitivas. **La forma se sortea en cada aparición y no significa nada; el color sí**: magenta la fruta común, amarillo la rara.
- **Fruta común y fruta rara.** La común vale `10 × nivel` y alarga 1 segmento; una de cada seis apariciones sale rara, vale `50 × nivel`, alarga 3 segmentos, lleva un **anillo que se consume** y caduca a los 8 s.
- **Nivel y aceleración**: el nivel es `floor(frutas / 5) + 1` y el tick baja de 140 ms a 60 ms, 8 ms por nivel.
- **Repintado con la paleta del Vault**: cuerpo en verde con glow, cabeza en cian con dos ojos, cola degradada hacia tinta tenue, marco del tablero en verde tenue, frutas en magenta y amarillo.
- **Controles**: `←` `→` `↑` `↓`, por `e.code`, con cola de giros de dos entradas. **`P` y `Escape` siguen siendo de la plataforma**; el motor no las reclama.
- **El HUD de React no cambia.** El motor emite `score`, `lives` y `level`, que es exactamente lo que el hueco central pinta con corazones desde SPEC 07. **No se emite `lines`.**
- **Registro** en `lib/games/registry.ts`: una línea, `serpentina: createSerpienteEngine`.
- **Fin de partida**: al agotar las vidas —o al llenar el tablero— manda el `GameOverModal` de la plataforma, con el guardado por `submitScore` de SPEC 06.
- **Limpieza al desmontar**: se cancela el bucle, se retiran los oyentes de teclado y se descarta el estado de la partida.

### Fuera (explícitamente)

- **Supabase.** Ni migración, ni tabla, ni rama de vista, ni fila de catálogo, ni tipos regenerados. `serpentina` está sembrada desde SPEC 06 con su tabla `scores_serpentina`, su índice, su RLS, su política y **su rama en la vista `leaderboard`**; y sus reglas (`desc` · `PUNTOS` · `12` · `10 000 000`) son las correctas para un marcador de puntos. **No hay micro-migración.**
- **El pack de assets.** `references/Assets/snake-assets/fruits.png` y `sprites.js` **no se copian a `public/`, no se incrustan y no se cargan**. Con ellos se va el atlas de 22 recortes, la bandera `atlasReady`, el camino de respaldo y el oyente `img.onload`. `public/` no gana ningún fichero en este spec.
- **El copy de la ficha.** El `long` dice «buscando núcleos magenta» y eso es exactamente lo que habrá: no se toca.
- **`submit_score`, `top_scores` y `game_stats`.** Están dirigidos por el catálogo y un motor nuevo no los cambia. No se editan.
- **`lib/games/types.ts`.** El contrato no se amplía: este juego cabe en los tres números que ya existen.
- **`components/player/game-player.tsx`.** No se toca: el HUD que necesita este juego ya existe y no hay nada que cargar, así que tampoco hace falta un estado «CARGANDO» que hoy no existe.
- **Escribir nada dentro de `references/`.** Ni un prototipo HTML en `references/RRO5vePTlqkYrGHjYdtf_started-games/05-snake/`, ni un reformateo de `snake-assets/`. La carpeta es de solo lectura: se lee y no se edita.
- **Sonido.** Ni ficheros ni síntesis. Ningún motor del Vault suena y el reproductor no tiene conmutador de silencio; inventarlo es diseño nuevo.
- **Obstáculos dentro del tablero**, power-ups, portales, modo a dos jugadores y tabla de valores por fruta. Contenido nuevo que habría que calibrar nivel a nivel.
- **Interpolación entre ticks.** La serpiente salta de celda a celda, como el snake clásico. Mover el cuerpo suavemente entre dos celdas es animación nueva.
- **WASD y ratón.** Solo flechas: ningún otro motor del Vault acepta WASD, y en un juego de rejilla por ticks el ratón no tiene nada que arrastrar.
- **Controles táctiles.** En táctil se ve «REQUIERE TECLADO» y no se juega.
- **Los otros cuatro motores.** `gloton`, `invasores`, `ranaria` y `duelo-pixel` siguen en «PRÓXIMAMENTE».
- **Tests.** Sigue sin haber runner configurado.

---

## 2. Modelo de datos

**No hay persistencia nueva.** La marca la guarda la Server Action `submitScore` de SPEC 06 con `game: "serpentina"`, igual que ROCAS, CAÍDA y BLOQUE BUSTER. Lo nuevo son las constantes de la mecánica y el reparto de color.

### 2.1 Lo que la base ya tiene

Leído con `execute_sql` sobre `public.games` y con `pg_get_viewdef('public.leaderboard')`. **Este spec no toca Supabase.**

| Columna         | Valor                                                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`            | `serpentina`                                                                                                                                                 |
| `title`         | `SERPENTINA`                                                                                                                                                 |
| `short`         | «Crece sin morder tu propia cola.»                                                                                                                           |
| `long`          | «Una serpiente de luz recorre la grilla buscando núcleos magenta. Cada bocado la alarga y la hace más veloz. Un movimiento en falso y se devora a sí misma.» |
| `cat` · `color` | `ARCADE` · `green`                                                                                                                                           |
| `cover`         | `cover-snake` —la clase ya existe en `app/globals.css`—                                                                                                      |
| `sort_order`    | 3                                                                                                                                                            |
| `scores_table`  | `scores_serpentina`, con su índice, su RLS, su política de lectura y **su rama en `leaderboard`** ya creadas                                                 |
| Reglas          | `score_order` `desc` · `score_label` `PUNTOS` · `leaderboard_size` `12` · `max_score` `10 000 000`                                                           |

La ruta `/juegos/serpentina` y su `/jugar` **ya resuelven**: `generateStaticParams` sale de `listGameIds()` y la ficha está sembrada desde SPEC 06. Hoy el reproductor pinta «PRÓXIMAMENTE» porque `getEngineFactory('serpentina')` devuelve `null`; este spec solo rellena ese hueco.

El copy describe el juego palabra por palabra —alargarse, acelerar, devorarse— y, al dibujar la fruta común en magenta, **los «núcleos magenta» son literalmente lo que se ve**. No se reescribe.

### 2.2 El reparto del lienzo

El lienzo del reproductor es 800 × 600 y el juego lo divide en banda de HUD y tablero. Van como constantes nombradas, no como números sueltos en el dibujo.

| Constante       | Valor                                               |
| --------------- | --------------------------------------------------- |
| `W` × `H`       | `800` × `600` — el mundo interno del reproductor    |
| `HUD_H`         | `40` px, banda superior                             |
| `CELL`          | `20` px                                             |
| `COLS` × `ROWS` | `38` × `26` → 988 celdas                            |
| `BOARD`         | `{ x: 20, y: 60, w: 760, h: 520 }`                  |
| `FRUIT_R`       | `7` px — la fruta ocupa 14 px centrados en la celda |

El margen de 20 px a cada lado y los 20 px entre la banda del HUD y el tablero no son decorativos: el marco del tablero tiene que separarse del borde redondeado de `.crt-screen`, o la línea queda comida por el bisel.

### 2.3 Las constantes de la mecánica

No hay original del que copiarlas, así que estos números **son el diseño** y están calibrados para que la primera partida dure algo y la décima no sea injugable.

| Constante                       | Valor       | Qué hace                                            |
| ------------------------------- | ----------- | --------------------------------------------------- |
| `MAX_DT`                        | `0.05` s    | Tope del `dt`, el invariante del contrato           |
| `TICK_BASE`                     | `0.140` s   | Tick del nivel 1                                    |
| `TICK_STEP`                     | `0.008` s   | Lo que baja el tick por nivel                       |
| `TICK_MIN`                      | `0.060` s   | Suelo del tick, alcanzado en el nivel 11            |
| `FRUITS_PER_LEVEL`              | `5`         | `level = floor(frutas / 5) + 1`                     |
| `START_LENGTH`                  | `3`         | Longitud al empezar y al reaparecer                 |
| `START_LIVES`                   | `3`         | Vidas iniciales                                     |
| `RESPAWN_DELAY`                 | `1.5` s     | Margen tras perder una vida, antes de poder moverse |
| `POINTS_COMMON` · `POINTS_RARE` | `10` · `50` | Multiplicados por el nivel al comer                 |
| `GROW_COMMON` · `GROW_RARE`     | `1` · `3`   | Segmentos que añade cada fruta                      |
| `RARE_CHANCE`                   | `1 / 6`     | Probabilidad de que la fruta que aparece sea rara   |
| `RARE_TTL`                      | `8` s       | Caducidad de la fruta rara                          |
| `TURN_QUEUE_MAX`                | `2`         | Giros encolados como máximo                         |

**`MAX_DT` (0,05 s) es menor que `TICK_MIN` (0,06 s), y eso es a propósito.** El bucle acumula el `dt` y avanza un paso cada vez que el acumulador llena un tick; con el `dt` capado por debajo del tick más corto, **nunca puede avanzar dos pasos en un fotograma**, así que volver a una pestaña dormida no teletransporta la serpiente dentro de su propia cola. Si alguien baja `TICK_MIN` por debajo de `MAX_DT`, ese invariante se rompe en silencio.

La cuenta atrás de la reaparición y la caducidad de la fruta rara se miden **con el mismo acumulador en segundos, nunca con `setTimeout`**: así la pausa de la plataforma las congela de verdad.

### 2.4 Las frutas, con primitivas

Cinco siluetas, todas dibujables con `arc`, `ellipse`, `moveTo` / `lineTo` y `fill`. **Ninguna es un sprite y ninguna se carga de ningún sitio.**

```ts
export type FruitShape = "manzana" | "racimo" | "baya" | "rodaja" | "estrella";

export const FRUIT_SHAPES: readonly FruitShape[] = [
  "manzana", // círculo con tallo y hoja
  "racimo", // tres círculos de r × 0,5 en triángulo
  "baya", // óvalo alargado en vertical
  "rodaja", // semicírculo con tres gajos marcados
  "estrella", // cinco puntas
] as const;
```

**Dos ejes, separados a propósito:**

- **La forma se sortea** en cada aparición, uniformemente entre las cinco. Es variedad visual y **no significa nada**: no hay que aprenderse nada.
- **El color dice el valor.** Magenta `--magenta` la común; amarillo `--yellow` la rara, además con el anillo que se consume con su `RARE_TTL`.

Separarlos es lo que hace el juego legible a 14 px: distinguir cinco siluetas sería una trampa, distinguir magenta de amarillo no. Una sola función dibuja todas:

```ts
drawFruit(ctx, shape, cx, cy, FRUIT_R, color, rare, ttlRatio);
```

### 2.5 La paleta del canvas

Los valores van literales con el token en comentario: `ctx` no entiende variables CSS y leerlas con `getComputedStyle` en cada fotograma sería caro. Mismo criterio que `lib/games/asteroides/constants.ts`, `lib/games/piezas/constants.ts` y `lib/games/ladrillos/constants.ts`.

```ts
export const PALETTE = {
  bg: "#0a0a0f", // --bg
  boardFill: "rgba(0, 255, 136, 0.05)", // --green, fondo del tablero
  frame: "rgba(0, 255, 136, 0.35)", // --green, el marco que mata
  grid: "rgba(0, 245, 255, 0.06)", // --line, la rejilla apenas insinuada
  snake: "#00ff88", // --green
  snakeTail: "#8a8fb5", // --ink-dim
  head: "#00f5ff", // --cyan
  eye: "#0a0a0f", // --bg
  fruit: "#ff006e", // --magenta, la fruta común: los «núcleos» del copy
  fruitRare: "#f5ff00", // --yellow, la fruta rara
  hud: "#e6e9ff", // --ink
  hudLabel: "#4a4f70", // --ink-faint
  overlay: "rgba(10, 10, 15, 0.72)", // --bg con alfa
  gameOver: "#ff006e", // --magenta
  win: "#00ff88", // --green
} as const;

export const INK_RGB = "230, 233, 255";

/** Mismas familias que --mono y --pixel de globals.css. */
export const FONT_MONO = '"JetBrains Mono", "Courier New", monospace';
export const FONT_PIXEL = '"Press Start 2P", system-ui, monospace';
```

El cuerpo son cuadrados de `CELL - 4` px centrados en la celda, en `snake` con `shadowBlur`; la cabeza en `head` con dos ojos de 3 px; los últimos segmentos interpolan hacia `snakeTail` para que la cola se lea.

### 2.6 Estado interno de la partida

Todo vive **dentro de la instancia** que devuelve la fábrica, nunca en variables de módulo: dos pantallas montadas a la vez no se pisan y el doble montaje en modo estricto no arranca dos bucles.

`snake` (array de `{ col, row }`, la cabeza en el índice 0), `dir` (`{ dc, dr }` o `null` cuando está parada), `turns` (la cola de giros), `pendingGrowth`, `fruit` (`{ col, row, shape, rare, ttl }`), `score`, `lives`, `level`, `eaten`, `status`, `tickAcc`, `respawnAcc`, `completado`, y la contabilidad del bucle (`rafId`, `lastTime`, `destroyed`, `listening`, `paused`, `lastSnapshot`).

`status` son tres valores: `"playing" | "dead" | "gameover"`. `"dead"` es la ventana de `RESPAWN_DELAY` tras perder una vida, el mismo papel que el `deadTimer` de `asteroides`.

**La bandera `paused` entra desde el primer momento.** La pausa la gobierna el reproductor y no toca `status`, así que sin ella las flechas seguirían encolando giros con el lienzo congelado. Es el fallo que apareció implementando SPEC 07 y que SPEC 08 ya previno.

**La victoria se trata como fin de partida**, igual que en BLOQUE BUSTER: si al comer no queda ninguna celda libre, el canvas pinta «¡TABLERO COMPLETO!», `status` pasa a `"gameover"` con la bandera `completado` y se llama a `onGameOver(score)`. Son 988 celdas y es prácticamente inalcanzable, pero la lista de celdas libres vacía **no puede petar**.

---

## 3. Plan de implementación

Cada paso deja el proyecto compilando. Hasta el paso 5 la aplicación se comporta exactamente como hoy.

1. **Constantes.** `lib/games/serpiente/constants.ts`: `W`/`H`, `HUD_H`, `CELL`, `COLS`, `ROWS`, `BOARD`, `FRUIT_R`, la tabla de §2.3, `FruitShape` con `FRUIT_SHAPES`, `PALETTE`, `INK_RGB`, `FONT_MONO` y `FONT_PIXEL`. Incluye el comentario que explica por qué `MAX_DT < TICK_MIN`.

2. **Lógica pura.** `lib/games/serpiente/board.ts`: `tickFor(level)`, `freeCells(snake)`, `spawnFruit(snake)`, `nextHead(head, dir)`, `isWall(cell)`, `hitsSelf(snake, cell)` y la validación del giro —**un giro se rechaza contra la dirección del último paso, no contra la última tecla encolada**—. Funciones sobre los datos que reciben, sin `ctx`, sin estado de módulo y sin efectos al importar.

3. **Dibujo.** `lib/games/serpiente/draw.ts`: `clear`, fondo y marco del tablero, rejilla, serpiente —cuerpo, cabeza con ojos y degradado de cola—, `drawFruit` con las **cinco siluetas** y el anillo de caducidad de la rara, el HUD del canvas —puntuación a la izquierda, nivel centrado, vidas a la derecha— y `drawOverlay` para «VIDA PERDIDA», «GAME OVER» y «¡TABLERO COMPLETO!». Cada función recibe el `ctx`; ninguna lo lee del ámbito. **Ninguna llama a `drawImage`.**

4. **Fábrica y bucle.** `lib/games/serpiente/index.ts` con `createSerpienteEngine(canvas, hooks): GameEngine`: monta el estado, expone `start` / `pause` / `resume` / `restart` / `destroy`, corre el `requestAnimationFrame` con el `dt` en segundos capado a `MAX_DT` y `lastTime = null` como centinela, acumula hasta el tick y avanza **un** paso, engancha `keydown` y `keyup` en `window` por `e.code` con `CAPTURED_KEYS` y `preventDefault`, pasa todo por `isTypingTarget` y por la bandera `paused`, `clearInput()` en `pause()` / `restart()` / `destroy()`, emite `onSnapshot` solo cuando cambia alguno de los tres valores, y llama a `onGameOver(score)` al agotar las vidas o al llenar el tablero. Oyentes enganchados una sola vez con `listening` y retirados en `destroy()`, guardas sobre `destroyed`. **`start()` es sincrónico: no hay nada que esperar.** **No engancha `KeyP` ni `Escape`.** `start()` y `restart()` emiten el primer estado antes de pedir fotograma.

5. **Registrar.** Una línea en `lib/games/registry.ts`: `serpentina: createSerpienteEngine`. Sin comillas: el id no lleva guion.

6. **El reproductor no se toca.** `components/player/game-player.tsx` se queda como está: el HUD de vidas con corazones ya existe y no hay fase de carga que anunciar.

7. **Recorrido completo.** Partida real en `/juegos/serpentina/jugar`: arrancar con una flecha, comer frutas comunes y ver crecer la serpiente, cazar una rara antes de que caduque, chocar contra la pared y contra la cola, gastar las tres vidas, guardar la marca y reiniciar desde el modal. Comprobar que a nivel alto la serpiente no puede girar 180°, que `P`, `Escape` y los tres botones hacen lo suyo, y que una ruta sin motor sigue en «PRÓXIMAMENTE».

8. **Cierre.** `npm run lint` y `npm run build` limpios; `git status` sin cambios en `references/`, sin ficheros nuevos en `public/` y sin tocar los otros tres motores.

---

## 4. Criterios de aceptación

- [ ] En `/juegos/serpentina/jugar` se juega de verdad: la serpiente arranca parada en el centro con longitud 3 y se mueve al pulsar la primera flecha.
- [ ] `←` `→` `↑` `↓` giran; **un giro de 180° se rechaza** y no se puede morder el cuello ni al tick de 60 ms.
- [ ] Dos flechas pulsadas rápido en el mismo tick **se encolan y se aplican en ticks seguidos**; la tercera se descarta.
- [ ] Comer la fruta común suma `10 × nivel`, alarga 1 segmento y hace aparecer otra fruta.
- [ ] La fruta rara sale aproximadamente una de cada seis, **es amarilla**, vale `50 × nivel`, alarga 3 segmentos, **lleva su anillo de caducidad** y a los 8 s es sustituida por una común en otra celda libre.
- [ ] Las **cinco siluetas** aparecen a lo largo de una partida, y la forma **no** cambia el valor: solo el color lo hace.
- [ ] **La fruta nunca aparece dentro de la serpiente**, ni con el cuerpo ocupando media rejilla.
- [ ] Cada 5 frutas sube el nivel y **la serpiente va perceptiblemente más rápida**; a partir del nivel 11 la velocidad deja de subir.
- [ ] Tocar cualquiera de las cuatro paredes cuesta una vida: **no hay envolvimiento por el borde**.
- [ ] Morderse la propia cola cuesta una vida.
- [ ] Al perder una vida la serpiente vuelve al centro con longitud 3 y parada, con ~1,5 s de margen, **conservando puntuación y nivel**, y la fruta se recoloca.
- [ ] Con tres choques la partida termina, el canvas pinta «GAME OVER» y se abre el `GameOverModal`.
- [ ] El HUD de React muestra **«Vidas»** con corazones, no «Líneas», y su cifra coincide con la del HUD del canvas sin desfase perceptible.
- [ ] El HUD del canvas reparte puntuación a la izquierda, nivel centrado y vidas a la derecha, dentro de la banda de 40 px.
- [ ] **No se carga ninguna imagen.** El panel de red del navegador no registra ninguna petición al entrar a jugar, y `drawImage` no aparece en todo `lib/games/serpiente/`.
- [ ] **`public/` no gana ningún fichero**: sigue teniendo solo los cinco SVG del andamio.
- [ ] `lib/games/types.ts` y `components/player/game-player.tsx` están **sin tocar**, y el reproductor no enseña ningún estado «CARGANDO».
- [ ] `start()` es sincrónico: no hay `async`, ni promesas, ni callbacks de carga en `lib/games/serpiente/`.
- [ ] `P` pausa y reanuda; `Escape` y SALIR llevan a `/juegos/serpentina`; FIN abre el modal.
- [ ] **Con el juego en pausa las flechas no encolan giros**, y la cuenta atrás de reaparición y la caducidad de la fruta rara **también se congelan**: al reanudar no ha pasado el tiempo.
- [ ] El motor **no** reclama `P` ni `Escape`.
- [ ] Las flechas no hacen scroll de la página mientras se juega.
- [ ] Escribir las iniciales en el modal no mueve la serpiente, y soltar una tecla con el foco en el campo no deja la tecla pegada.
- [ ] REINICIAR en el modal arranca una partida nueva con 0 puntos, 3 vidas, nivel 1 y longitud 3.
- [ ] Volver de una pestaña dormida **no avanza varios pasos de golpe**: la serpiente sigue donde estaba.
- [ ] Al salir de la ruta no queda bucle ni oyentes vivos, y el doble montaje en modo estricto no arranca dos bucles ni dobla la velocidad.
- [ ] Con puntero táctil se ve «REQUIERE TECLADO» y el motor no arranca.
- [ ] El canvas mantiene 4:3 a cualquier ancho y no desborda el marco CRT en móvil.
- [ ] El juego se pinta con la paleta del Vault: cuerpo verde con glow, cabeza cian con ojos, marco del tablero en verde tenue, fruta común magenta.
- [ ] No suena nada.
- [ ] `getEngineFactory('serpentina')` devuelve la fábrica; `gloton`, `invasores`, `ranaria` y `duelo-pixel` siguen mostrando «PRÓXIMAMENTE».
- [ ] `lib/games/asteroides/`, `lib/games/piezas/` y `lib/games/ladrillos/` no tienen ningún cambio.
- [ ] **`references/` no tiene ningún cambio**: ni `RRO5vePTlqkYrGHjYdtf_started-games/`, ni `Assets/snake-assets/`. `git status` lo confirma.
- [ ] No hay ninguna migración nueva en `supabase/migrations/`, y `select count(*) from public.games` sigue devolviendo 8.
- [ ] La marca guardada aparece en el ranking de `/juegos/serpentina` y en la pestaña SERPENTINA de `/salon`, resaltada si coincide con el alias de sesión.
- [ ] `/juegos/serpentina` y `/juegos/serpentina/jugar` resuelven **después de un `npm run build`** —`generateStaticParams` con `dynamicParams = false` significa que la ruta no existe hasta la siguiente compilación—. Aquí ya existían: la ficha está sembrada desde SPEC 06.
- [ ] `npm run lint` y `npm run build` terminan sin errores ni avisos nuevos.

---

## 5. Decisiones tomadas y descartadas

| Decisión                                                  | Alternativa descartada                                                                                                                                              | Motivo                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El juego vive en la ficha **`serpentina`**                | Crear una ficha nueva `snake`                                                                                                                                       | Decisión del usuario. Su copy describe este juego, y su tabla, su rama de vista, su portada y sus reglas existen desde SPEC 06. Una ficha nueva costaría dos specs y una migración para duplicar lo que ya hay.                                                                                                                                                                                                  |
| **Motor solo en `lib/games/serpiente/`**                  | Escribir el juego dentro de `references/.../05-snake/`, o un prototipo HTML aparte y luego portarlo                                                                 | Decisión del usuario. `references/` es de solo lectura por regla del proyecto y criterio de aceptación de SPEC 05, 07 y 08; el prototipo intermedio dobla el trabajo sin aportar nada que no dé el motor directamente.                                                                                                                                                                                           |
| **Carpeta `lib/games/serpiente/`**                        | `serpentina/` (igual al slug), o `gusano/`                                                                                                                          | Decisión del usuario. Mantiene el precedente de `asteroides` para `rocas`, `piezas` para `caida` y `ladrillos` para `bloque-buster`: la carpeta nombra el concepto, así que la ficha puede renombrarse sin tocar el motor.                                                                                                                                                                                       |
| **Juego escrito desde cero**                              | Porte 1:1 de un juego de referencia                                                                                                                                 | No hay snake en `references/RRO5vePTlqkYrGHjYdtf_started-games/`. Coste: los números de §2.3 no vienen calibrados de ningún sitio y habrá que ajustarlos jugando.                                                                                                                                                                                                                                                |
| **Sin binarios: frutas con primitivas**                   | El PNG en `public/` con carga asíncrona dentro del motor, que fue la primera decisión y se **revirtió**; incrustarlo como data URI; o ampliar `start()` a asíncrono | Decisión del usuario: **que todo el Hub se mueva igual**. Los tres motores existentes son sincrónicos y autocontenidos; el PNG metía en este una espera de red, una bandera `atlasReady`, un camino de respaldo y un oyente (`img.onload`) que sobrevive a `destroy()` y que ningún otro motor tiene. Mismo criterio que SPEC 08 con el spritesheet del arkanoid. Coste: el pack `snake-assets/` queda sin usar. |
| **El `long` de la ficha se deja tal cual**                | Micro-migración para cambiar «núcleos magenta»                                                                                                                      | Ya no hace falta justificarlo: al dibujar la fruta común en `--magenta`, los «núcleos magenta» del copy son literalmente lo que se ve.                                                                                                                                                                                                                                                                           |
| **Cinco siluetas sorteadas, y el color dice el valor**    | Una sola forma de fruta; una silueta por valor; o 22 valores distintos como en el atlas                                                                             | Conserva la variedad visual que aportaban los 22 sprites sin pedir que se distingan cinco formas a 14 px. Separar los ejes —la forma es adorno, el color es información— es lo que mantiene el juego legible dentro del marco CRT.                                                                                                                                                                               |
| **Tres vidas con reaparición a longitud 3**               | Conservar la longitud al reaparecer, o una sola vida como el snake clásico                                                                                          | Decisión del usuario: el sistema de vidas es explícito y es el que tiene el resto del HUB. Reaparecer largo en un tablero vacío haría casi imposible morir; una sola vida dejaría el hueco de corazones del HUD en un solo latido.                                                                                                                                                                               |
| **Paredes mortales**                                      | Envolvimiento toroidal, o paredes más obstáculos por nivel                                                                                                          | Decisión del usuario. Sin paredes el juego casi no tiene presión; los obstáculos son contenido nuevo que habría que calibrar nivel a nivel.                                                                                                                                                                                                                                                                      |
| **Nivel cada 5 frutas, tick 140 → 60 ms**                 | Acelerar 3 ms por fruta, o velocidad fija                                                                                                                           | Decisión del usuario. La curva se nota y cumple el «cada bocado la hace más veloz» del copy; acelerar por fruta es tan gradual que no se percibe, y la velocidad fija dejaría muerto el hueco de Nivel del HUD.                                                                                                                                                                                                  |
| **Solo flechas**                                          | Flechas + WASD, o flechas + ratón                                                                                                                                   | Decisión del usuario. Ningún otro motor del Vault acepta WASD y sería la excepción; en un juego de rejilla por ticks el ratón no tiene nada que arrastrar y solo añadiría un oyente más que olvidar en `destroy()`.                                                                                                                                                                                              |
| **Serpiente con primitivas y glow**                       | Cuerpo redondeado continuo estilo Google Snake, o cuadrados planos                                                                                                  | Decisión del usuario. El cuerpo continuo obliga a calcular codos por segmento e interpolar entre ticks, y los cuadrados planos se salen del neón del resto de la plataforma.                                                                                                                                                                                                                                     |
| **El contrato no se amplía**                              | Añadir un campo opcional a `GameSnapshot`                                                                                                                           | Este juego cabe en `score`, `lives` y `level`. La recomendación por defecto es la que no toca `lib/games/asteroides/`, y aquí se cumple sin esfuerzo.                                                                                                                                                                                                                                                            |
| **Victoria tratada como fin de partida**                  | Añadir `onWin?()` al contrato, o no contemplarla                                                                                                                    | Mismo criterio que BLOQUE BUSTER: la marca se guarda igual, que es lo que le importa al ranking. No contemplarla dejaría un `freeCells()` vacío sin rama, que es un fallo esperando.                                                                                                                                                                                                                             |
| **Giros en una cola de dos entradas**                     | Aplicar la tecla directamente al estado                                                                                                                             | A 60 ms por tick, dos giros humanos caen dentro del mismo tick y el primero se perdería. La cola los conserva; limitarla a dos evita que una ráfaga de teclas programe la partida.                                                                                                                                                                                                                               |
| **El giro se valida contra la dirección del último paso** | Validarlo contra la última entrada encolada                                                                                                                         | Es el fallo clásico del snake con búfer: encolar `arriba` y `abajo` en el mismo tick mata al jugador por una inversión que él no vio. Validar contra el paso real lo hace imposible.                                                                                                                                                                                                                             |
| **`MAX_DT` (0,05 s) por debajo de `TICK_MIN` (0,06 s)**   | Acumular el tiempo real y permitir varios pasos por fotograma                                                                                                       | Es lo que garantiza un paso por fotograma como máximo. Con recuperación de retraso, volver a una pestaña dormida avanzaría media docena de celdas de golpe, posiblemente dentro de la cola.                                                                                                                                                                                                                      |
| **Temporizadores con el acumulador, no con `setTimeout`** | `setTimeout` para la reaparición y la caducidad                                                                                                                     | `setTimeout` no sabe de la pausa de la plataforma: con el juego congelado, la fruta rara seguiría caducando y la reaparición seguiría corriendo.                                                                                                                                                                                                                                                                 |
| **Bandera `paused` desde el primer momento**              | Confiar en que detener el bucle baste                                                                                                                               | En SPEC 07 no bastó: con el juego congelado las teclas seguían jugando a escondidas. Aquí encolarían giros que se aplicarían todos al reanudar.                                                                                                                                                                                                                                                                  |
| **Rejilla 38 × 26 con margen de 20 px**                   | 40 × 28 a sangre, llenando los 800 × 560                                                                                                                            | El marco del tablero —el límite que mata— tiene que verse, y pegado al borde redondeado de `.crt-screen` lo come el bisel. Coste: 76 celdas menos de tablero.                                                                                                                                                                                                                                                    |
| **La pausa y la salida son de la plataforma**             | Que el motor se quede con `P` o `Escape`                                                                                                                            | `P` y `Escape` son del reproductor desde SPEC 05, y dos pausas compitiendo por la misma tecla es un fallo garantizado.                                                                                                                                                                                                                                                                                           |
| **Sin sonido**                                            | Síntesis con WebAudio para el bocado y el choque                                                                                                                    | Coherente con el «no tiene, y no se inventa» de SPEC 05 y con la decisión de no cargar binarios. Cualquier sonido necesita arrancar silenciado y un conmutador, y el único sitio sería `GamePlayer`, que este spec no toca.                                                                                                                                                                                      |

---

## 6. Riesgos identificados

1. **Doble montaje en desarrollo.** React monta y desmonta los efectos dos veces en modo estricto. Si `destroy()` no cancela el `requestAnimationFrame` y los oyentes de teclado, quedan dos bucles y la serpiente va al doble de velocidad. Es el fallo más probable de todo el spec. **Mitigación:** las guardas `destroyed` y `listening`, y el criterio de aceptación que lo comprueba a mano.

2. **El giro de 180° contra el cuello.** El bug clásico del snake con búfer de entrada: si el giro se valida contra la última tecla encolada en vez de contra la dirección del último paso, encolar `arriba` y `abajo` en el mismo tick mata al jugador por un movimiento que nunca vio en pantalla. **Mitigación:** está dicho en el paso 2 del plan y tiene su propio criterio de aceptación.

3. **La fruta dentro de la serpiente.** Sortear una celda al azar y reintentar si está ocupada funciona con la serpiente corta y degenera cuando ocupa media rejilla: en el caso límite del tablero lleno, el reintento no termina nunca. **Mitigación:** `freeCells(snake)` construye la lista de libres y se sortea sobre ella —988 celdas, es barato—, y la lista vacía tiene su rama de victoria.

4. **Los números de §2.3 no vienen calibrados de ningún sitio.** No hay original que replicar, así que 140 ms, 8 ms por nivel, 1 de cada 6 y 8 s de caducidad son una primera apuesta. **Mitigación:** van todos como constantes nombradas en un solo fichero, así que ajustarlos jugando es una línea cada uno y no una caza por el motor.

5. **Las cinco siluetas a 14 px pueden verse parecidas.** Una baya y una manzana en el mismo color y a ese tamaño son dos manchas redondas. **Mitigación:** por eso la forma **no** lleva información: el valor lo dice el color y el anillo de caducidad. Si aun así se ven pobres, la salida es subir `FRUIT_R` o reducir el repertorio a tres siluetas bien distintas, no rediseñar la rejilla.

6. **El pack de assets queda sin usar.** `references/Assets/snake-assets/` se aportó para este juego y el spec acaba no tocándolo, igual que SPEC 08 dejó el spritesheet del arkanoid sin usar. Es la decisión tomada, pero conviene recordarlo: la carpeta sigue en el repositorio sin que nada la referencie, y quien la encuentre dentro de seis meses pensará que falta código.

7. **Secuestro del teclado.** `preventDefault` en las cuatro flechas impide el scroll mientras se juega. Si un oyente sobrevive al desmontaje, la página entera se queda sin scroll con las flechas: el mismo síntoma del riesgo 1 con otra cara. **Mitigación:** el `keyup` libera **siempre** la tecla, aunque el foco haya saltado a un campo, y `clearInput()` se llama en pausa, reinicio y destrucción.

8. **Dos HUD con la misma cifra.** Es la decisión de SPEC 05, pero si `emitSnapshot()` se retrasa un fotograma se verá un número distinto en cada sitio durante un instante. **Mitigación:** emitir en el mismo fotograma en que cambia el estado, nunca con un temporizador aparte.

9. **Rendimiento dentro del marco CRT.** Son 988 celdas, y pintar la rejilla celda a celda con `shadowBlur` activo sería gratuito en un juego suelto y caro bajo scanlines, ruido y filtros CSS. **Mitigación:** la rejilla se traza como líneas, no como 988 rectángulos, y el `shadowBlur` se limita al cuerpo de la serpiente y a la fruta. Si aun así va a tirones, el sospechoso es el efecto CRT.

10. **Nitidez al escalar.** 800 × 600 estirados a una pantalla grande se ven blandos, y una rejilla de líneas de 1 px lo acusa más que las formas de ROCAS. Aceptado a cambio de no tocar las coordenadas; si molesta, se revisa con `devicePixelRatio` en otro spec.
