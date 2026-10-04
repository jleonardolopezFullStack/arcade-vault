# SPEC 08 — «BLOQUE BUSTER» jugable: el arkanoid de referencia dentro del reproductor

**Estado:** Aprobado
**Depende de:** SPEC 05, SPEC 06
**Fecha:** 2026-10-04

**Objetivo:** Portar el juego de `references/RRO5vePTlqkYrGHjYdtf_started-games/04-arkanoid/` a un motor TypeScript en `lib/games/ladrillos/` que el reproductor monte en `/juegos/bloque-buster/jugar`, redibujando sus sprites con primitivas y la paleta del Vault.

---

## 1. Alcance

### Dentro

- **Motor portado** a `lib/games/ladrillos/`, en TypeScript estricto y **sin globals**: nada de `document.getElementById`, ni variables de módulo con el estado de la partida, ni `requestAnimationFrame` al cargar el fichero. El comportamiento se porta **1:1**: velocidad de la paleta, rebotes contra paredes, paleta y bloques, pérdida de pelota, tres vidas, diez puntos por bloque y los cinco niveles con su multiplicador de velocidad.
- **Los cinco trazados** de `levels.js`, portados como **funciones generadoras**, no como listas expandidas: el original los construye con bucles —muro lleno, pirámide, damero, huecos por fila, marco con cruz— y copiar el resultado perdería la intención.
- **Sin binarios.** El spritesheet PNG desaparece: bloques, paleta y pelota se dibujan con primitivas de canvas y la paleta del Vault, y la explosión de cuatro fotogramas se sustituye por un **destello que crece y se apaga** en los mismos 150 ms.
- **Entrada por teclado y ratón.** `←` `→` mueven la paleta; el ratón la arrastra sobre el canvas, **con corrección de escala** vía `getBoundingClientRect()`, porque el reproductor estira el lienzo por CSS. El teclado es la base, así que el aviso «REQUIERE TECLADO» en táctil sigue siendo cierto.
- **La victoria es un fin de partida.** Al vaciar el quinto nivel el canvas pinta «¡COMPLETADO!» y el motor llama a `onGameOver(score)`, igual que al agotar las vidas: la marca se guarda, que es lo que le importa al ranking.
- **Escalado 4:3**: el canvas del original ya es 800×600, el mismo del reproductor. Ninguna coordenada se recalcula.
- **El HUD de React no cambia.** Este juego emite `score`, `lives` y `level`, que es exactamente lo que el hueco central pinta con corazones desde SPEC 07. No se emite `lines`.
- **Registro** en `lib/games/registry.ts`: una línea, `"bloque-buster": createLadrillosEngine`.
- **Limpieza al desmontar**: se cancela el bucle, se retiran los oyentes de teclado y de ratón y se descarta el estado de la partida.

### Fuera (explícitamente)

- **Supabase.** Ni migración, ni tabla, ni rama de vista, ni fila de catálogo, ni tipos regenerados. `bloque-buster` ya está sembrada y sus reglas (`score_order` `desc`, `score_label` `PUNTOS`, `leaderboard_size` 12, `max_score` 10 000 000) son las correctas para un marcador de puntos: **no hay micro-migración**.
- **`submit_score`, `top_scores` y `game_stats`.** Están dirigidos por el catálogo y un motor nuevo no los cambia. No se editan.
- **`components/player/game-player.tsx`.** No se toca: el HUD que necesita este juego ya existe.
- **El spritesheet y los dos MP3.** `assets/spritesheet-breakout.png`, `ball-bounce.mp3` y `break-sound.mp3` no se copian a `public/`, no se incrustan y no se cargan. Con ellos se va el arranque asíncrono `loadSpritesheet(cb)`.
- **Sonido.** Ni ficheros ni síntesis. Ningún motor del Vault suena y el reproductor no tiene conmutador de silencio; inventarlo es diseño nuevo.
- **La pausa propia del original en `p` / `P` / `Escape`**: la pierde. La de la plataforma hace lo mismo.
- **Los botones de salto de nivel** que el original dibuja en el canvas durante la pausa y atiende con `click`. Son una herramienta de depuración, no mecánica de juego.
- **Los otros cinco motores.** `serpentina`, `gloton`, `invasores`, `ranaria` y `duelo-pixel` siguen en «PRÓXIMAMENTE».
- **Editar el juego de referencia.** `references/RRO5vePTlqkYrGHjYdtf_started-games/04-arkanoid/` se porta, no se modifica.
- **Cambios de balance o contenido.** Ni niveles nuevos, ni power-ups, ni bloques de varios golpes, ni ángulo de rebote según el punto de impacto en la paleta. Lo que hay en `game.js` es lo que habrá.
- **Controles táctiles.** En táctil se ve «REQUIERE TECLADO» y no se juega.
- **Tests.** Sigue sin haber runner configurado.

---

## 2. Modelo de datos

No hay persistencia nueva: la marca la guarda la Server Action `submitScore` de SPEC 06 con `game: "bloque-buster"`, igual que ROCAS y CAÍDA. Lo nuevo son las constantes portadas y el reparto de color.

### 2.1 Lo que la base ya tiene

Desde SPEC 06, sin tocar nada:

| Columna         | Valor                                                                                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`            | `bloque-buster`                                                                                                                                            |
| `title`         | `BLOQUE BUSTER`                                                                                                                                            |
| `short`         | «Rebota la pelota y destruye muros de neón.»                                                                                                               |
| `long`          | «Pilota una nave-paleta y rebota un núcleo de plasma para pulverizar muros de bloques cromáticos. Cada nivel reorganiza la grilla en patrones imposibles.» |
| `cat` · `color` | `ARCADE` · `cyan`                                                                                                                                          |
| `cover`         | `cover-bricks` —la clase ya existe en `app/globals.css`—                                                                                                   |
| `sort_order`    | 1                                                                                                                                                          |
| `scores_table`  | `scores_bloque_buster`, con su índice, su RLS, su política de lectura y su rama en `leaderboard`                                                           |
| Reglas          | `desc` · `PUNTOS` · `12` · `10000000`                                                                                                                      |

La frase «cada nivel reorganiza la grilla en patrones imposibles» describe exactamente los cinco trazados de `levels.js`: el copy del catálogo ya se escribió para este juego. **No se reescribe.**

### 2.2 Constantes portadas

Copiadas de `game.js` **sin cambiar un número**:

| Constante                       | Valor                                                    |
| ------------------------------- | -------------------------------------------------------- |
| Lienzo                          | `800 × 600` — el mismo del reproductor                   |
| `PADDLE_SPEED`                  | `400` px/s                                               |
| Paleta                          | `81 × 14`, fija en `y = 560`                             |
| Pelota                          | `16 × 16`                                                |
| `BASE_BALL_VX` · `BASE_BALL_VY` | `200` · `-300`, multiplicados por la velocidad del nivel |
| Rejilla de bloques              | `10 × 6` de `64 × 24`                                    |
| Origen de la rejilla            | `x = (800 − 10 × 64) / 2 = 80`, `y = 80`                 |
| Puntuación                      | **`+10` por bloque**, sin bonus de nivel                 |
| Vidas iniciales                 | `3`                                                      |
| `EXPLOSION_DURATION`            | `150` ms                                                 |
| `dt` máximo                     | `50 ms` (`MAX_DT = 0.05`), que el original no tenía      |

Tres detalles del original que es fácil perder al portar y hay que conservar:

- **La tolerancia de 8 px en el rebote de paleta.** El original acepta el golpe mientras `ball.y + ball.h <= paddle.y + paddle.h + 8`. Sin ese margen, a velocidades altas la pelota atraviesa la paleta entre un fotograma y el siguiente.
- **Un bloque por fotograma.** El bucle de colisiones hace `break` tras el primer impacto. Quitarlo permitiría romper dos bloques con un solo contacto y cambiaría la puntuación.
- **El rebote contra bloque solo invierte `vy`.** No hay cálculo de cara golpeada. Es simplista y es lo que hay.

El `dt` del original va **en segundos pero sin tope**. El motor nuevo conserva los segundos y añade el tope de `MAX_DT`: un salto de pestaña no debe teletransportar la pelota al otro lado del muro.

### 2.3 Los cinco niveles

Portados como generadores, con su multiplicador de velocidad:

| Nivel | Velocidad | Trazado                                                                             |
| ----- | --------- | ----------------------------------------------------------------------------------- |
| 1     | `1.00`    | Muro lleno, 10 × 6, un color por fila                                               |
| 2     | `1.10`    | Pirámide: columnas `[4,5] [3,6] [2,7] [1,8] [0,9] [0,9]` por fila                   |
| 3     | `1.21`    | Damero `(col + row) % 2 === 0`; amarillo las tres filas de arriba, magenta abajo    |
| 4     | `1.33`    | Muro lleno menos los huecos `[2,5,8] [0,4,7,9] [1,3,6] [2,5,8,9] [0,4,7] [1,3,6,9]` |
| 5     | `1.46`    | Marco exterior más una cruz en la columna 4 y la fila 2                             |

Los tres repartos de color por fila del original se conservan literalmente:

```ts
const COLORES_1 = ["red", "yellow", "cyan", "magenta", "hotpink", "green"];
const COLORES_2 = ["gray", "cyan", "hotpink", "yellow", "magenta", "green"];
const COLORES_4 = ["cyan", "magenta", "green", "yellow", "hotpink", "red"];
```

### 2.4 Paleta y repintado

Los siete colores de bloque del spritesheet se reparten sobre los cuatro acentos del tema, igual que hizo SPEC 07 con las piezas. Los valores van literales: `ctx` no entiende variables CSS.

```ts
export const BLOCK_COLORS = {
  cyan: "#00f5ff", // --cyan
  magenta: "#ff006e", // --magenta
  yellow: "#f5ff00", // --yellow
  green: "#00ff88", // --green
  red: "#8c003c", // --magenta al 55 %
  hotpink: "#ff73a5", // --magenta aclarado
  gray: "#8a8fb5", // --ink-dim
} as const;

export const PALETTE = {
  bg: "#0a0a0f", // --bg
  paddle: "#00f5ff", // --cyan
  ball: "#f5ff00", // --yellow
  hud: "#e6e9ff", // --ink
  hudLabel: "#4a4f70", // --ink-faint
  overlay: "rgba(10, 10, 15, 0.72)",
  gameOver: "#ff006e", // --magenta
  win: "#00ff88", // --green
} as const;
```

El **destello** sustituye a los cuatro fotogramas de explosión: el rectángulo del bloque crece hacia fuera unos pocos píxeles mientras su opacidad cae de 1 a 0, en el color del bloque y en los mismos 150 ms. Una primitiva, sin binarios, y encaja con el neón del resto.

Las tipografías del canvas repiten las familias de `--mono` y `--pixel`, como en `lib/games/asteroides/constants.ts` y `lib/games/piezas/constants.ts`.

### 2.5 Estado interno de la partida

Todo vive **dentro de la instancia** que devuelve la fábrica, nunca en variables de módulo: dos pantallas montadas a la vez no se pisan y el doble montaje en modo estricto no arranca dos bucles.

`paddle`, `ball`, `blocks` (con su `alive`), `flashes`, `score`, `lives`, `level`, `status` y la contabilidad del bucle (`rafId`, `lastTime`, `destroyed`, `listening`, `paused`, `lastSnapshot`).

`status` se reduce a `"playing" | "gameover"`. El `'win'` del original **no es un estado más**: al vaciar el quinto nivel se pone `status = "gameover"` con una bandera `completado` que solo cambia el texto del overlay.

**La bandera `paused` entra desde el primer momento.** La pausa la gobierna el reproductor y no toca `status`, así que sin ella las teclas —y aquí también el ratón— seguirían jugando con el lienzo congelado. Es el fallo que apareció implementando SPEC 07, y con ratón sería peor: bastaría mover el puntero por encima del canvas.

---

## 3. Plan de implementación

Cada paso deja el proyecto compilando. Hasta el paso 6 la aplicación se comporta exactamente como hoy.

1. **Constantes.** `lib/games/ladrillos/constants.ts`: lienzo, geometría de paleta, pelota y rejilla, velocidades, puntuación, `MAX_DT`, `EXPLOSION_DURATION`, `BLOCK_COLORS`, `PALETTE` y las dos familias tipográficas.

2. **Niveles.** `lib/games/ladrillos/levels.ts`: los cinco generadores y su `speed`, con los tres repartos de color. Funciones puras que devuelven la lista de `{ col, row, color }`; la conversión a píxeles la hace quien carga el nivel.

3. **Lógica pura.** `lib/games/ladrillos/physics.ts`: `collideAABB(ball, block)`, los rebotes contra pared, el rebote de paleta **con su tolerancia de 8 px**, y el avance de la pelota. Funciones sobre los datos que reciben, sin `ctx`, sin estado de módulo y sin efectos al importar.

4. **Dibujo.** `lib/games/ladrillos/draw.ts`: `clear`, bloques, paleta, pelota, destello, HUD del canvas —puntuación a la izquierda, nivel centrado, vidas como pelotas a la derecha, como el original— y `drawOverlay`. Cada función recibe el `ctx`; ninguna lo lee del ámbito.

5. **Fábrica y bucle.** `lib/games/ladrillos/index.ts` con `createLadrillosEngine(canvas, hooks): GameEngine`: monta el estado, expone `start` / `pause` / `resume` / `restart` / `destroy`, corre el `requestAnimationFrame` con el `dt` en segundos capado a `MAX_DT`, engancha `keydown` y `keyup` en `window` por `e.code` con `CAPTURED_KEYS` y `preventDefault`, engancha `mousemove` **en el canvas** con corrección de escala, pasa todo por la guarda `isTypingTarget` y por la bandera `paused`, emite `onSnapshot` solo cuando cambia alguno de los tres valores, y llama a `onGameOver(score)` tanto al agotar vidas como al completar el quinto nivel. Oyentes enganchados una sola vez con `listening` y retirados en `destroy()`, guardas sobre `destroyed`. **No engancha `KeyP` ni `Escape`.** `start()` y `restart()` emiten el primer estado antes de pedir fotograma.

6. **Registrar.** Una línea en `lib/games/registry.ts`: `"bloque-buster": createLadrillosEngine`. Las comillas son obligatorias: el id lleva guion.

7. **Recorrido completo.** Partida real en `/juegos/bloque-buster/jugar`: mover con flechas y con el ratón, romper bloques y ver el destello, comprobar los 10 puntos, vaciar un nivel y notar que la pelota acelera, perder las tres vidas, guardar la marca y reiniciar desde el modal. Comprobar `P`, `Escape`, los tres botones y una ruta sin motor.

8. **Cierre.** `npm run lint` y `npm run build` limpios, `git status` sin cambios en `references/` ni en los otros motores.

---

## 4. Criterios de aceptación

- [ ] En `/juegos/bloque-buster/jugar` se juega de verdad: la pelota sale de la paleta, rebota en las tres paredes y en la paleta, y rompe bloques.
- [ ] `←` y `→` mueven la paleta, y **el ratón también**, arrastrándola sobre el canvas.
- [ ] **El ratón acierta aunque el canvas esté escalado**: a anchos distintos de 800 la paleta sigue el puntero sin desfase.
- [ ] La paleta no se sale por ninguno de los dos lados.
- [ ] Romper un bloque suma **10 puntos** y lanza el destello, que se apaga en 150 ms.
- [ ] Un solo contacto rompe **un solo bloque**, aunque la pelota toque dos a la vez.
- [ ] La pelota no atraviesa la paleta a la velocidad del nivel 5: la tolerancia de 8 px está puesta.
- [ ] Al vaciar un nivel se carga el siguiente y **la pelota va más rápida**.
- [ ] Al vaciar el quinto nivel el canvas pinta «¡COMPLETADO!» y se abre el `GameOverModal`.
- [ ] Perder la pelota resta una vida y la repone sobre la paleta; con tres pérdidas la partida termina y el canvas pinta «GAME OVER».
- [ ] Los cinco trazados coinciden con los del original: muro lleno, pirámide, damero, huecos por fila, y marco con cruz.
- [ ] El HUD de React muestra **«Vidas»** con corazones, no «Líneas», y su cifra coincide con la del HUD del canvas sin desfase perceptible.
- [ ] El HUD del canvas mantiene el reparto del original: puntuación a la izquierda, nivel centrado y vidas como pelotas a la derecha.
- [ ] `P` pausa y reanuda; `Escape` y SALIR llevan a `/juegos/bloque-buster`; FIN abre el modal.
- [ ] **Con el juego en pausa, ni las flechas ni el ratón mueven la paleta**, y al reanudar no aparece ninguna jugada que no se viera.
- [ ] El motor **no** reclama `P` ni `Escape`.
- [ ] Las flechas no hacen scroll de la página mientras se juega.
- [ ] Escribir las iniciales en el modal no mueve la paleta.
- [ ] REINICIAR en el modal arranca una partida nueva con 0 puntos, 3 vidas y nivel 1.
- [ ] Al salir de la ruta no queda bucle ni oyentes vivos —ni de teclado ni de ratón—, y el doble montaje en modo estricto no arranca dos bucles ni duplica la velocidad de la pelota.
- [ ] Con puntero táctil se ve «REQUIERE TECLADO» y el motor no arranca.
- [ ] Los bloques, la paleta y la pelota se pintan con la paleta del Vault, no con los colores del original, y **no se carga ninguna imagen**.
- [ ] No suena nada.
- [ ] No queda ni rastro del spritesheet, de los MP3, del arranque asíncrono, de la pausa propia ni de los botones de salto de nivel.
- [ ] `getEngineFactory('bloque-buster')` devuelve la fábrica; los otros cinco juegos sin motor siguen mostrando «PRÓXIMAMENTE».
- [ ] `lib/games/asteroides/` y `lib/games/piezas/` no tienen ningún cambio.
- [ ] `references/RRO5vePTlqkYrGHjYdtf_started-games/04-arkanoid/` no tiene ningún cambio.
- [ ] No hay ninguna migración nueva en `supabase/migrations/`, y `select count(*) from public.games` sigue devolviendo 8.
- [ ] La marca guardada aparece en el ranking de `/juegos/bloque-buster` y en la pestaña BLOQUE BUSTER de `/salon`, resaltada si coincide con el alias de sesión.
- [ ] `npm run lint` y `npm run build` terminan sin errores ni avisos nuevos.

---

## 5. Decisiones tomadas y descartadas

| Decisión                                               | Alternativa descartada                                 | Motivo                                                                                                                                                                                                          |
| ------------------------------------------------------ | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El juego vive en la ficha **`bloque-buster`**          | Crear una ficha nueva y dejarla en «PRÓXIMAMENTE»      | Decisión del usuario. El copy la describe hasta el detalle de los niveles, y su tabla, su rama de vista y su portada existen desde SPEC 06. Una ficha nueva costaría una migración para duplicar lo que ya hay. |
| **Porte 1:1 con repintado**                            | Reajustar la dificultad, o reinterpretar               | Decisión del usuario, y es lo que se hizo con ROCAS y CAÍDA. Las velocidades por nivel están calibradas; tocarlas obligaría a revalidar los cinco.                                                              |
| **Los cinco niveles**                                  | Solo el primero, o reciclar el último en bucle         | Decisión del usuario. Es porte 1:1 y es lo que promete el copy de la ficha.                                                                                                                                     |
| **Sin binarios**: todo con primitivas                  | Copiar el PNG a `public/`, o incrustarlo como data URI | Decisión del usuario. Cargar el spritesheet obligaría a ampliar `start()` con una fase asíncrona y a diseñar un estado de «cargando» en el reproductor. Coste: el resultado se aleja visualmente del original.  |
| **Destello** en lugar de los 4 fotogramas de explosión | Fragmentos como los de ROCAS, o ningún efecto          | Decisión del usuario. Una sola primitiva, respeta los 150 ms del original y conserva la intención de su spec 02. Quitar el efecto habría tirado por la borda un spec entero del juego de referencia.            |
| **Sin sonido**                                         | Los MP3 en `public/`, o síntesis con WebAudio          | Decisión del usuario, y coherente con el «no tiene, y no se inventa» de SPEC 05. Cualquier sonido necesita arrancar silenciado y un conmutador, y el único sitio sería `GamePlayer`, que este spec no toca.     |
| **Teclado + ratón**                                    | Solo teclado, o ratón obligatorio                      | Decisión del usuario. El teclado como base mantiene cierto el aviso «REQUIERE TECLADO»; el ratón es como mejor se juega un breakout. Obliga a corregir la escala, porque el lienzo se estira por CSS.           |
| **Victoria tratada como fin de partida**               | Añadir `onWin?()` al contrato, o niveles en bucle      | Decisión del usuario. La marca se guarda igual, que es lo que le importa al ranking, y no se amplía un contrato que comparten los nueve juegos. Coste: fuera del canvas, ganar y morir son indistinguibles.     |
| **Carpeta `lib/games/ladrillos/`**                     | `paleta/`, o `arkanoid/`                               | Decisión del usuario. Mantiene el precedente de `asteroides` para `rocas` y `piezas` para `caida`: la carpeta nombra el concepto en español, así que la ficha puede renombrarse sin tocar el motor.             |
| **La pausa del original desaparece**                   | Conservar su `p`/`P`/`Escape` y su overlay             | `P` y `Escape` son de la plataforma, y dos pausas compitiendo por la misma tecla es un fallo garantizado.                                                                                                       |
| **Los botones de salto de nivel se retiran**           | Conservarlos durante la pausa                          | Son depuración, no mecánica: permiten saltar a cualquier nivel y falsearían cualquier marca del ranking.                                                                                                        |
| **Bandera `paused` desde el primer momento**           | Confiar en que detener el bucle baste                  | En SPEC 07 no bastó: con el juego congelado las teclas seguían jugando a escondidas. Con ratón sería aún más fácil de provocar.                                                                                 |
| **`dt` capado a `MAX_DT`**                             | Conservar el `dt` sin tope del original                | Es el invariante del contrato. Sin tope, volver a una pestaña dormida teletransporta la pelota al otro lado del muro.                                                                                           |

---

## 6. Riesgos identificados

1. **El ratón y el escalado por CSS.** El reproductor estira el lienzo de 800×600 hasta llenar el marco CRT, así que un `offsetX` crudo estaría desplazado a cualquier ancho que no sea 800. **Mitigación:** la corrección con `getBoundingClientRect()` es obligatoria, y hay un criterio de aceptación que exige probarla a varios anchos.

2. **Doble montaje en desarrollo.** React monta y desmonta los efectos dos veces en modo estricto. Si `destroy()` no cancela el `requestAnimationFrame` y **los dos tipos de oyente** —teclado en `window`, ratón en el canvas—, quedan dos bucles y la pelota va al doble de velocidad. Es el fallo más probable del spec, y aquí hay un oyente más que olvidar que en ROCAS o CAÍDA. **Mitigación:** las guardas `destroyed` y `listening`, y el criterio que lo comprueba a mano.

3. **Redibujar sin spritesheet aleja el resultado del original.** Los bloques, la paleta, la pelota y la explosión pasan a ser primitivas, así que no hay con qué comparar el resultado salvo el recuerdo. **Mitigación:** conservar la geometría exacta —`64 × 24`, origen en `(80, 80)`— para que al menos la composición sea la misma.

4. **La tolerancia de 8 px es fácil de perder.** Es una línea discreta dentro de la condición del rebote de paleta, y sin ella la pelota se cuela a las velocidades de los últimos niveles: un fallo que solo aparece jugando bien. **Mitigación:** queda citada en §2.2 y tiene su propio criterio de aceptación.

5. **Ganar y morir son indistinguibles fuera del canvas.** El modal de fin de partida dice lo mismo tanto si completaste los cinco niveles como si perdiste la última vida. Es lo aceptado al no ampliar el contrato, pero conviene no prometer una pantalla de victoria que no existe.

6. **El rebote contra bloque solo invierte `vy`.** El original no mira qué cara golpeó, así que un impacto lateral rebota de forma poco intuitiva. Es fiel al original y por tanto correcto, pero quien lo pruebe sin leer esto lo tomará por un fallo del porte.

7. **Rendimiento dentro del marco CRT.** Se redibujan hasta sesenta bloques, la paleta, la pelota y los destellos activos en cada fotograma, bajo scanlines, ruido y filtros CSS. Si va a tirones, el sospechoso es el efecto CRT, no el juego.
