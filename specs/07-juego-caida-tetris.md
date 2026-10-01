# SPEC 07 — «CAÍDA» jugable: el tetris de referencia dentro del reproductor

**Estado:** Borrador
**Depende de:** SPEC 05, SPEC 06 (pendiente de terminar)
**Fecha:** 2026-10-01

**Objetivo:** Portar el juego de `references/RRO5vePTlqkYrGHjYdtf_started-games/03-tetris/game.js` a un motor TypeScript en `lib/games/piezas/` que el reproductor monte en `/juegos/caida/jugar`, ampliando el contrato con una métrica de líneas que el HUD de la plataforma sepa pintar.

---

## 0. Requisito previo

Las tres migraciones de SPEC 06 están aplicadas (`catalogo_y_marcadores`, `siembra_catalogo`, `vistas_y_funciones`) y la ficha `caida` existe en `public.games` con su tabla `scores_caida`, su rama en la vista `leaderboard` y sus reglas. **Este spec no toca Supabase.**

Lo que sigue pendiente de SPEC 06 son sus pasos 8 a 14: el detalle, el reproductor, la Server Action de guardado, el Salón de la Fama, la home, el estado de error y la retirada de `lib/data.ts`, `lib/scores.ts` y `lib/local-scores.ts`. Hoy solo `/biblioteca` lee del catálogo.

Consecuencias concretas para este spec:

- **El guardado de la marca sigue siendo `localStorage['av_scores']`**, porque es lo que hace hoy `components/player/game-player.tsx` con `saveScore()`. Cuando SPEC 06 remate sus pasos 9 y 10, `caida` hereda la Server Action sin tocar una línea de este motor: el reproductor es compartido.
- **Dos criterios de aceptación son inverificables hasta entonces** y están marcados como tales en el apartado 4: que la marca aparezca en el ranking de `/juegos/caida` y en la pestaña CAÍDA de `/salon`. Hoy esas dos pantallas pintan `seededScores()`, no la base.

No se remata SPEC 06 aquí. Su plan ya está escrito y aprobado.

---

## 1. Alcance

### Dentro

- **Motor portado** a `lib/games/piezas/`, en TypeScript estricto y **sin globals**: nada de `document.getElementById`, ni variables de módulo con el estado de la partida, ni `requestAnimationFrame` al cargar el fichero. El comportamiento se porta **1:1**: ocho tipos de pieza —incluida la «tuerca»—, rotación horaria con empujes de pared, pieza fantasma, bloqueo, limpieza de líneas, puntuación por líneas multiplicada por nivel, caída dura y blanda, y la curva de velocidad cada diez líneas.
- **Un solo canvas.** El original usa dos (`#board` de 300×600 y `#next-canvas` de 120×120). Aquí el tablero se dibuja centrado dentro de los 800×600 del reproductor y la previsualización de la pieza siguiente ocupa un panel a su derecha, **en el mismo canvas**. `components/player/game-player.tsx` no gana ningún elemento.
- **Ampliación del contrato**: `GameSnapshot` gana `lines?: number`, **opcional**. El HUD de React pinta «Líneas» cuando el campo llega y conserva «Vidas» cuando no. `lib/games/asteroides/` no se toca y sigue compilando.
- **Emisión sincrónica del primer estado**: `start()` y `restart()` llaman a `emitSnapshot()` antes de pedir el primer fotograma, para que el HUD no pinte el estado inicial equivocado durante un fotograma.
- **Registro** en `lib/games/registry.ts`: una línea, `caida: createPiezasEngine`.
- **Repintado con la paleta del Vault**: ocho tonos derivados de los cuatro acentos del tema más `--ink-dim` para la tuerca, la rejilla con el token `--line` en literal, y el HUD del canvas con las tipografías del tema.
- **Escalado 4:3**: el canvas sigue siendo de 800×600 por dentro y se estira por CSS hasta llenar el marco CRT. Ninguna coordenada se recalcula.
- **Controles**: `←` `→` mover, `↓` caída blanda, `↑` y `X` rotar, `Espacio` caída dura. `P` y `Escape` siguen siendo de la plataforma.
- **Fin de partida**: cuando una pieza nueva aparece colisionada manda el `GameOverModal` de la plataforma. El overlay «GAME OVER» del canvas se conserva de fondo, sin su línea de reinicio.
- **Limpieza al desmontar**: se cancela el bucle, se retiran los oyentes y se descarta el estado de la partida.

### Fuera (explícitamente)

- **Supabase.** Ni migración, ni tabla, ni rama de vista, ni fila de catálogo, ni tipos regenerados. `caida` ya está sembrada y sus reglas (`score_order` `desc`, `score_label` `PUNTOS`, `leaderboard_size` 12, `max_score` 10 000 000) son las correctas para un marcador de puntos: **no hay micro-migración**.
- **`submit_score`, `top_scores` y `game_stats`.** Están dirigidos por el catálogo y un motor nuevo no los cambia. No se editan.
- **Rematar SPEC 06.** Sus pasos 8 a 14 son suyos.
- **Los otros seis motores.** `bloque-buster`, `serpentina`, `gloton`, `invasores`, `ranaria` y `duelo-pixel` siguen en «PRÓXIMAMENTE».
- **Editar el juego de referencia.** `references/RRO5vePTlqkYrGHjYdtf_started-games/03-tetris/` se porta, no se modifica.
- **El conmutador de tema y su `localStorage['tetris-theme']`** del original: es contaminación de plataforma y desaparece en el porte.
- **El overlay propio del original y su botón `#restart-btn`**: los sustituyen el modal de la plataforma y `restart()`.
- **La pausa propia del original en `KeyP`**: la pierde. La de la plataforma hace lo mismo.
- **Cambios de balance o contenido.** Ni piezas distintas, ni otra curva de velocidad, ni quitar la tuerca, ni «hold», ni bolsa de siete. Lo que hay en `game.js` es lo que habrá.
- **Controles táctiles.** En táctil se ve «REQUIERE TECLADO» y no se juega.
- **Sonido.** El juego de referencia no tiene, y no se inventa.
- **Tests.** Sigue sin haber runner configurado.

---

## 2. Modelo de datos

No hay persistencia nueva: la marca se sigue guardando con `saveScore()` y `game: "caida"`. Lo que sí cambia es el contrato, y lo que es nuevo son las constantes portadas.

### 2.1 Lo que la base ya tiene

Desde SPEC 06, sin tocar nada:

| Columna         | Valor                                                                                                                                                     |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`            | `caida`                                                                                                                                                   |
| `title`         | `CAÍDA`                                                                                                                                                   |
| `short`         | «Encaja las piezas antes de que el techo te aplaste.»                                                                                                     |
| `long`          | «Piezas geométricas descienden desde la oscuridad. Rótalas, encástralas y limpia líneas para sobrevivir. La velocidad aumenta sin piedad cada 10 líneas.» |
| `cat` · `color` | `PUZZLE` · `magenta`                                                                                                                                      |
| `cover`         | `cover-tetro` —la clase ya existe en `app/globals.css`—                                                                                                   |
| `sort_order`    | 2                                                                                                                                                         |
| `scores_table`  | `scores_caida`, con su índice, su RLS, su política de lectura y su rama en `leaderboard`                                                                  |
| Reglas          | `desc` · `PUNTOS` · `12` · `10000000`                                                                                                                     |

La frase «la velocidad aumenta sin piedad cada 10 líneas» describe literalmente el `level = Math.floor(lines / 10) + 1` del original: el copy del catálogo ya se escribió para este juego. **No se reescribe.**

### 2.2 El contrato ampliado

`lib/games/types.ts` gana un campo **opcional**. Nada más:

```ts
/** Lo que el motor publica hacia el HUD de React. */
export type GameSnapshot = {
  score: number;
  lives: number;
  level: number;
  /**
   * Métrica propia de los juegos que cuentan líneas en vez de vidas.
   * Cuando llega, el HUD pinta «Líneas» en lugar de «Vidas».
   */
  lines?: number;
};
```

Por qué opcional y no sustituyendo a `lives`: así `lib/games/asteroides/` compila sin tocarse y el HUD no necesita una tabla de rótulos por juego. El coste es que el reproductor tiene una rama más.

`caida` emite `lives: 0` siempre —no tiene vidas— y `lines` con el recuento real. El HUD, en su hueco central:

- si `snapshot.lines !== undefined` → rótulo «Líneas» y el valor formateado;
- si no → rótulo «Vidas» y los corazones de siempre, con «—» cuando llega a cero.

`INITIAL_SNAPSHOT` sigue siendo `{ score: 0, lives: 3, level: 1 }` y no se toca; lo que evita que CAÍDA parpadee «♥♥♥» en su primer fotograma es la emisión sincrónica del apartado 2.5.

### 2.3 Constantes portadas

Copiadas de `game.js` **sin cambiar un número**:

| Constante                 | Valor                                                                 |
| ------------------------- | --------------------------------------------------------------------- |
| `COLS` × `ROWS`           | `10` × `20`                                                           |
| `BLOCK`                   | `30` px — el tablero mide 300×600                                     |
| `PIECES`                  | 8 tipos, índices 1 a 8; el 8 es la tuerca `[[8,8,8],[8,0,8],[8,8,8]]` |
| `LINE_SCORES`             | `[0, 100, 300, 500, 800]`, multiplicado por el nivel                  |
| Caída dura · caída blanda | `+2` por celda recorrida · `+1` por fila                              |
| Nivel                     | `Math.floor(lines / 10) + 1`                                          |
| `dropInterval`            | `Math.max(100, 1000 - (level - 1) * 90)` ms, arranca en `1000`        |
| Empujes de rotación       | `[0, -1, 1, -2, 2]`, el primero que no colisiona                      |
| Pieza fantasma            | el mismo dibujo con `globalAlpha = 0.2`                               |
| Brillo del bloque         | `rgba(255, 255, 255, 0.12)`, 4 px en el borde superior                |
| Inserción del bloque      | `fillRect(x * size + 1, y * size + 1, size - 2, size - 2)`            |

**La tuerca se conserva.** Es un anillo 3×3 que no existe en ningún tetris estándar, sale una vez de cada ocho y es lo que hace a este juego más difícil que el clásico. Es porte 1:1 y además es su rasgo distintivo.

El `dt` del original va **en milisegundos y sin tope**. El motor nuevo trabaja en segundos con `MAX_DT = 0.05`, y el acumulador compara contra `dropInterval / 1000`. La cadencia de caída no cambia: cambia la unidad y se añade el tope que impide que un salto de pestaña vacíe media partida de golpe.

### 2.4 Composición del lienzo y paleta

El original reparte el juego entre dos canvas y una barra lateral en DOM. Aquí todo cabe en los 800×600, en tres columnas:

| Zona                         | Caja                                                       |
| ---------------------------- | ---------------------------------------------------------- |
| HUD del canvas               | `x` 20–230, puntuación, líneas y nivel apilados            |
| Tablero                      | `x` 250–550, `y` 0–600 — los 300×600 del original intactos |
| Previsualización de la pieza | `x` 570–780, rejilla 4×4 de 30 px con su rótulo encima     |

El tablero mantiene su tamaño y su proporción 1:2; las dos columnas laterales ocupan el lienzo ancho que de otro modo quedaría vacío.

Las ocho piezas se repintan con tonos derivados de los cuatro acentos del tema, respetando la familia de color del original —la T morada pasa a magenta, la Z roja a magenta atenuado, la J azul pálido a cian atenuado, la L naranja a amarillo atenuado y la tuerca gris a `--ink-dim`—:

```ts
/**
 * Ocho piezas sobre cuatro acentos: cada token da un tono pleno y otro
 * atenuado al 55 %, y la tuerca va en --ink-dim. Los valores van literales:
 * `ctx` no entiende variables CSS y leerlas con getComputedStyle en cada
 * fotograma sería caro —el original lo hace para la rejilla—.
 */
export const PIECE_COLORS = [
  null,
  "#00f5ff", // 1 · I — --cyan
  "#f5ff00", // 2 · O — --yellow
  "#ff006e", // 3 · T — --magenta
  "#00ff88", // 4 · S — --green
  "#8c003c", // 5 · Z — --magenta al 55 %
  "#00878c", // 6 · J — --cyan al 55 %
  "#878c00", // 7 · L — --yellow al 55 %
  "#8a8fb5", // 8 · N tuerca — --ink-dim
] as const;

export const PALETTE = {
  bg: "#0a0a0f", // --bg
  grid: "rgba(0, 245, 255, 0.18)", // --line
  hud: "#e6e9ff", // --ink
  hudLabel: "#4a4f70", // --ink-faint
} as const;
```

Las tipografías del canvas repiten las familias de `--mono` y `--pixel`, igual que en `lib/games/asteroides/constants.ts`.

### 2.5 Estado interno de la partida

Todo vive **dentro de la instancia** que devuelve la fábrica, nunca en variables de módulo: dos pantallas montadas a la vez no se pisan y el doble montaje de React en modo estricto no arranca dos bucles.

`board` (matriz `ROWS × COLS` de índices de color, `0` vacío), `current` y `next` (`{ type, shape, x, y }`), `score`, `lines`, `level`, `dropAccum`, `dropInterval`, `status`, más la contabilidad del bucle (`rafId`, `lastTime`, `destroyed`, `listening`, `lastSnapshot`).

`status` se reduce a `"playing" | "gameover"`: el original no tiene estado de muerte temporal —no hay vidas— y su `paused` deja de ser estado del motor, porque la pausa la gobierna el reproductor llamando a `pause()` y `resume()`.

**La entrada es toda discreta.** El original no tiene `keyup`: cada pulsación mueve una vez y el repetido lo da el sistema operativo. El motor nuevo conserva ese comportamiento, así que no necesita registro de teclas mantenidas, solo el borde de pulsación. `CAPTURED_KEYS` cubre `ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown` y `Space` con `preventDefault()` para que no haya scroll de la página, con la guarda `isTypingTarget` por delante.

---

## 3. Plan de implementación

Cada paso deja el proyecto compilando. Hasta el paso 6 la aplicación se comporta exactamente como hoy.

1. **Contrato.** Añadir `lines?: number` a `GameSnapshot` en `lib/games/types.ts`, con su comentario. Nadie lo emite todavía y `asteroides` compila sin cambios.

2. **HUD del reproductor.** En `components/player/game-player.tsx`, el hueco central pasa a ser condicional: «Líneas» con el valor formateado cuando `snapshot.lines !== undefined`, «Vidas» con los corazones cuando no. Nada más cambia en ese fichero: ni el canvas, ni los botones, ni los atajos. Con `rocas` no debe notarse ninguna diferencia.

3. **Constantes.** `lib/games/piezas/constants.ts`: `W`/`H` a 800×600, `COLS`, `ROWS`, `BLOCK`, `PIECES`, `LINE_SCORES`, la curva de `dropInterval`, los empujes, `MAX_DT`, las tres cajas del apartado 2.4, `PIECE_COLORS`, `PALETTE` y las dos familias tipográficas.

4. **Lógica pura.** `lib/games/piezas/board.ts`: `createBoard()`, `collide(board, shape, ox, oy)`, `rotateCW(shape)`, `tryRotate(...)`, `merge(...)`, `clearLines(board)` devolviendo cuántas limpió, `ghostY(...)` y `randomPiece()`. Funciones sobre los datos que reciben, sin estado de módulo, sin `ctx` y sin efectos al importar. Es la traducción literal del original.

5. **Dibujo.** `lib/games/piezas/draw.ts`: `drawBlock(ctx, x, y, colorIndex, size, alpha?)` con su brillo superior, `drawGrid(ctx)` con el literal de `--line` —no con `getComputedStyle`—, `drawBoard`, `drawGhost`, `drawPiece`, `drawNextPanel` y `drawHud` con los tokens del tema. Cada función recibe el `ctx`; ninguna lo lee del ámbito.

6. **Fábrica y bucle.** `lib/games/piezas/index.ts` con `createPiezasEngine(canvas, hooks): GameEngine`: monta el estado, expone `start` / `pause` / `resume` / `restart` / `destroy`, corre el `requestAnimationFrame` con el `dt` en segundos capado a `MAX_DT`, acumula contra `dropInterval / 1000`, engancha `keydown` en `window` por `e.code` con `CAPTURED_KEYS` y `preventDefault`, pasa por `isTypingTarget`, emite `onSnapshot` **solo cuando cambia** alguno de los cuatro valores, llama a `onGameOver(score)` cuando una pieza nueva aparece colisionada, engancha los oyentes una sola vez con `listening` y los retira en `destroy()`, y guarda sobre `destroyed`. **No engancha `KeyP` ni `Escape`.** `start()` y `restart()` emiten el primer estado antes de pedir fotograma.

7. **Registrar.** Una línea en `lib/games/registry.ts`: `caida: createPiezasEngine`.

8. **Recorrido completo.** Partida real en `/juegos/caida/jugar`: mover, rotar contra la pared para ver los empujes, caída blanda y dura, limpiar una línea y comprobar los 100 × nivel, limpiar cuatro de golpe y comprobar los 800 × nivel, llegar a diez líneas y ver subir el nivel y acelerar la caída, verificar que la tuerca sale, llenar el tablero hasta el fin de partida, guardar la marca y reiniciar desde el modal. Comprobar `P`, `Escape`, los tres botones y una ruta sin motor.

9. **Cierre.** `npm run lint` y `npm run build` limpios, y `git status` sin cambios en `references/`.

---

## 4. Criterios de aceptación

- [ ] En `/juegos/caida/jugar` se juega de verdad: las piezas caen solas, `←` `→` mueven, `↑` y `X` rotan, `↓` baja una fila y `Espacio` suelta la pieza de golpe.
- [ ] Salen **ocho** tipos de pieza, incluida la tuerca: el anillo 3×3 con el hueco en el centro.
- [ ] La rotación junto a la pared empuja la pieza hacia dentro en vez de no hacer nada.
- [ ] La pieza fantasma se ve bajo la pieza activa, atenuada, en la columna donde va a caer.
- [ ] Limpiar 1 / 2 / 3 / 4 líneas suma 100 / 300 / 500 / 800 multiplicado por el nivel.
- [ ] La caída dura suma 2 por celda recorrida y la blanda 1 por fila.
- [ ] A las 10 líneas el nivel pasa a 2 y la caída se acelera; a las 20, a 3. La cadencia nunca baja de 100 ms.
- [ ] La partida termina cuando una pieza nueva no cabe, y entonces se abre el `GameOverModal`.
- [ ] El HUD de React muestra **«Líneas»**, no «Vidas», y su cifra coincide con la del HUD del canvas sin desfase perceptible.
- [ ] En `/juegos/rocas/jugar` el HUD sigue mostrando «Vidas» con sus corazones: la ampliación del contrato no cambió nada ahí.
- [ ] Al entrar en `/juegos/caida/jugar` el HUD **no** parpadea «♥♥♥» antes del primer fotograma.
- [ ] La previsualización de la pieza siguiente se ve dentro del canvas, a la derecha del tablero, y cambia al bloquearse cada pieza.
- [ ] El tablero conserva su proporción 1:2 y no se deforma: el lienzo interno sigue siendo 800×600 estirado por CSS.
- [ ] `P` pausa y reanuda; `Escape` y SALIR llevan a `/juegos/caida`; FIN abre el modal.
- [ ] El motor **no** reclama `P` ni `Escape`, y `X` sí rota.
- [ ] Las flechas y el espacio no hacen scroll de la página mientras se juega.
- [ ] Escribir las iniciales en el modal no mueve ninguna pieza ni pausa la partida.
- [ ] REINICIAR en el modal arranca una partida nueva con 0 puntos, 0 líneas y nivel 1.
- [ ] Al salir de la ruta no queda bucle ni oyentes vivos, y el doble montaje en modo estricto no arranca dos bucles ni duplica la velocidad de caída.
- [ ] Con puntero táctil se ve «REQUIERE TECLADO» y el motor no arranca.
- [ ] Las piezas se pintan con los ocho tonos derivados de la paleta del Vault, no con los colores del original, y la rejilla usa el tono de `--line`.
- [ ] No queda ni rastro del conmutador de tema, de `localStorage['tetris-theme']`, del overlay propio ni del botón de reinicio del original.
- [ ] `getEngineFactory('caida')` devuelve la fábrica; los otros seis juegos sin motor siguen mostrando «PRÓXIMAMENTE».
- [ ] `lib/games/asteroides/` no tiene ningún cambio.
- [ ] `references/RRO5vePTlqkYrGHjYdtf_started-games/03-tetris/` no tiene ningún cambio.
- [ ] No hay ninguna migración nueva en `supabase/migrations/`, y `select count(*) from public.games` sigue devolviendo 8.
- [ ] `/juegos/caida` resuelve **después de un `npm run build`**: la ruta sale de `generateStaticParams`, no del servidor de desarrollo.
- [ ] `npm run lint` y `npm run build` terminan sin errores ni avisos nuevos.
- [ ] **(Inverificable hasta que SPEC 06 remate sus pasos 8 a 11.)** La marca guardada aparece en el ranking de `/juegos/caida`.
- [ ] **(Inverificable hasta que SPEC 06 remate sus pasos 8 a 11.)** La marca guardada aparece en la pestaña CAÍDA de `/salon`.

---

## 5. Decisiones tomadas y descartadas

| Decisión                                                            | Alternativa descartada                                                   | Motivo                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| El juego vive en la ficha **`caida`**                               | Crear una ficha nueva y dejar `caida` en «PRÓXIMAMENTE»                  | Decisión del usuario. La ficha ya describe este juego hasta el detalle de las diez líneas, y su tabla, su rama de vista y su portada existen desde SPEC 06. Una ficha nueva costaría una migración, una rama de vista y una clase CSS para duplicar lo que ya hay. |
| **Un solo spec, sin SQL**                                           | Un spec de motor más otro de leaderboard                                 | No hay nada que migrar: las reglas sembradas (`desc`, `PUNTOS`, 12, 10 000 000) son las correctas para un marcador de puntos.                                                                                                                                      |
| **Escribirlo con SPEC 06 a medias**                                 | Esperar a que SPEC 06 termine, o rematarlo aquí                          | Decisión del usuario. El motor no depende de los pasos pendientes: guardar funciona hoy por `localStorage` y heredará la Server Action sin tocarse. Coste: dos criterios quedan aparcados.                                                                         |
| **Porte 1:1 con repintado**                                         | Reajustar la dificultad, o reinterpretar                                 | Decisión del usuario, y es lo que hizo SPEC 05 con ROCAS. La curva de velocidad y la puntuación están calibradas; tocarlas obligaría a revalidar el juego entero.                                                                                                  |
| **La tuerca se conserva**                                           | Siete piezas estándar                                                    | Decisión del usuario. Es porte 1:1 y es el rasgo que distingue a este tetris. Coste: el juego es más difícil que el clásico y quien lo pruebe puede tomarlo por un fallo.                                                                                          |
| `GameSnapshot` gana **`lines?` opcional**                           | Dejar las líneas solo en el canvas, o sustituir `lives` por `lines`      | Decisión del usuario. Es aditivo: `asteroides` no se toca y el HUD no necesita rótulos por juego. Lo descartado dejaba al HUD de React mintiendo, o obligaba a rotular los nueve juegos.                                                                           |
| **Un canvas con panel lateral**                                     | Ampliar `GamePlayer` con un segundo canvas, o quitar la previsualización | Decisión del usuario. El tablero es 1:2 y deja 500 px de lienzo sin usar: ahí caben el HUD y la pieza siguiente sin tocar el reproductor compartido. Quitar la previsualización cambiaría la estrategia del juego.                                                 |
| **Ocho tonos derivados de cuatro tokens**                           | Conservar los ocho colores del original, o repetir los cuatro acentos    | Decisión del usuario. Ocho piezas distinguibles sin salir de la paleta. Los colores originales desentonarían dentro del marco CRT; cuatro repetidos harían que dos pares de piezas se confundieran al encajar.                                                     |
| **Carpeta `lib/games/piezas/`**                                     | `tetris/`, o `caida/`                                                    | Decisión del usuario. Mantiene el precedente de `asteroides` para el slug `rocas`: la carpeta nombra el concepto en español, así que la ficha puede renombrarse sin tocar el motor. `tetris` metería un nombre comercial inglés.                                   |
| **`dt` en segundos con tope**                                       | Conservar los milisegundos sin tope del original                         | Es el invariante del contrato y evita que un salto de pestaña vacíe media partida de golpe. La cadencia de caída no cambia: cambia la unidad.                                                                                                                      |
| **La pausa del original desaparece**                                | Conservar su `KeyP` y su overlay                                         | `P` y `Escape` son de la plataforma, y dos pausas compitiendo por la misma tecla es un fallo garantizado. La de la plataforma hace exactamente lo mismo.                                                                                                           |
| **Entrada discreta, sin registro de teclas mantenidas**             | Añadir `keyup` y repetición propia                                       | El original no tiene `keyup`: el repetido lo da el sistema operativo. Añadirlo cambiaría la sensación de control, que es parte del porte 1:1.                                                                                                                      |
| **Emisión sincrónica del primer estado en `start()` y `restart()`** | Dejar que el primer fotograma lo emita                                   | Sin ella el HUD pinta `INITIAL_SNAPSHOT` —tres vidas— durante un fotograma en un juego sin vidas. Mitiga además el riesgo 1 de SPEC 05 para todos los motores.                                                                                                     |

---

## 6. Riesgos identificados

1. **Doble montaje en desarrollo.** React monta y desmonta los efectos dos veces en modo estricto. Si `destroy()` no cancela el `requestAnimationFrame` y los oyentes, quedan dos bucles y las piezas caen al doble de velocidad. Es el fallo más probable de todo el spec, igual que lo fue en SPEC 05. **Mitigación:** las guardas `destroyed` y `listening`, y el criterio de aceptación que lo comprueba a mano.

2. **El HUD compartido es el único fichero de riesgo.** `components/player/game-player.tsx` lo usan los nueve juegos; una rama mal escrita en el hueco central regresa `rocas`. **Mitigación:** el criterio que exige comprobar `/juegos/rocas/jugar` después del cambio, y que el campo nuevo sea opcional en vez de sustituir a `lives`.

3. **Dos HUD con la misma cifra.** Decisión heredada de SPEC 05: la puntuación, las líneas y el nivel se ven en el canvas y en React. Si el puente `onSnapshot` se retrasa un fotograma se verán cifras distintas un instante. **Mitigación:** emitir en el mismo fotograma en que cambia el estado, y sincrónicamente al arrancar.

4. **La tuerca parece un error.** Una pieza en anillo no está en ningún tetris y sale una de cada ocho veces. Quien pruebe el juego sin leer este spec pensará que el porte está roto. **Mitigación:** anotarlo en el código del motor junto a `PIECES`, y dejarlo escrito en la tabla de decisiones.

5. **La composición del lienzo no está en el original.** Las tres columnas de 2.4 son diseño nuevo: el original resolvía el HUD y la previsualización con DOM y CSS. Si el reparto queda mal centrado o el texto del HUD se sale de su columna, no hay nada con lo que compararlo. **Mitigación:** las cajas van como constantes nombradas, no como números sueltos repartidos por el dibujo.

6. **Nitidez al escalar.** 800×600 estirados en una pantalla grande se ven blandos, y una rejilla de líneas de 0,5 px lo acusa más que las naves de ROCAS. Aceptado a cambio de no tocar las coordenadas; si molesta, se revisa con `devicePixelRatio` en otro spec.

7. **Deriva respecto al original.** Al repartir `game.js` en cuatro ficheros, repintar las piezas y cambiar la unidad del `dt`, el motor deja de ser comparable línea a línea con su referencia. **Mitigación:** anotar en el código qué se cambió a propósito —colores, ausencia de globals, unidad del tiempo, pausa, reinicio— para que la próxima comparación no confunda un porte con un fallo.

8. **Guardar sigue siendo local.** Mientras SPEC 06 no remate sus pasos 9 y 10, la marca de CAÍDA vive en `localStorage['av_scores']` y se perderá al vaciar el almacenamiento —y además el paso 14 de SPEC 06 borra `lib/local-scores.ts`, que es quien la lee—. Es lo aceptado en el apartado 0, pero conviene no enseñar el juego prometiendo un ranking que todavía no persiste.

9. **Rendimiento dentro del marco CRT.** El original no se probó con scanlines, ruido y filtros CSS por encima, y aquí se redibujan 200 celdas, la rejilla y la pieza fantasma en cada fotograma. Si va a tirones, el sospechoso es el efecto CRT, no el juego.
