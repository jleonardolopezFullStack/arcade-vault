# GAME JAM «RANARIA» · SPEC 2/3 — «RANARIA» jugable: la rana que cruza carretera y río hasta los nenúfares

**Estado:** Implementado
**Depende de:** SPEC 05, SPEC 06, `specs/game-jam/ranaria/01-catalogo-y-leaderboard-ranaria.md`
**Tema:** «Ranaria» — juego estilo Frogger (rana que cruza carretera y río hasta los nenúfares).
**Fecha:** 2026-10-09

**Objetivo:** Construir un motor TypeScript en `lib/games/rana/` que el reproductor monte en `/juegos/ranaria/jugar`: una rana de rejilla con tres vidas y un temporizador por viaje que cruza cinco carriles de tráfico y cinco de río hasta llenar cinco nenúfares, dibujada con primitivas y la paleta del Vault.

---

## 0. Terreno que este spec da por hecho

SPEC 06 está **implementado** y el SPEC 1/3 de este paquete **aplicado**: la ficha `ranaria` en `public.games`, su tabla `scores_ranaria`, **su rama en la vista `leaderboard`** y su `max_score` ya en `999999`. **Este spec no toca Supabase.**

Lo que eso le regala a RANARIA sin escribir una línea: el guardado real de la marca por la Server Action `submitScore`, el ranking de `/juegos/ranaria` y su pestaña en `/salon` leyendo de `top_scores()`, y el modal de fin de partida con sus tres estados. El reproductor es compartido, así que el motor hereda todo eso por el hecho de registrarse.

Si el SPEC 1/3 no estuviera aplicado, el juego funcionaría igual —`max_score` seguiría en `10 000 000` y admitiría cualquier marca del motor—; solo el tope del ranking quedaría desalineado con `SCORE_CAP`. **El paso 0 del plan lo comprueba.**

---

## 1. Alcance

### Dentro

- **Motor nuevo** en `lib/games/rana/`, en TypeScript estricto y **sin globals**: nada de `document.getElementById`, ni variables de módulo con el estado de la partida, ni `requestAnimationFrame` al cargar el fichero. **No es un porte**: en `references/RRO5vePTlqkYrGHjYdtf_started-games/` no hay frogger —solo `02-asteroids`, `03-tetris` y `04-arkanoid`, los tres ya portados—, así que la mecánica se escribe desde cero contra el copy de la ficha y los invariantes de SPEC 05.
- **Rejilla de 19 columnas × 13 filas de 40 px** dentro del lienzo de 800 × 600, con banda de HUD de 40 px arriba y banda de tiempo de 40 px abajo. Ninguna coordenada se recalcula al escalar.
- **Trece filas con papel fijo**: la orilla de los **cinco nenúfares** arriba, **cinco carriles de río** con troncos y tortugas, una **mediana segura**, **cinco carriles de carretera** y la **acera de salida** abajo.
- **Movimiento por saltos**: cada flecha es **un salto de una celda**. La fila es entera; la columna es continua en píxeles, porque los troncos arrastran a la rana.
- **Colisiones con reglas cerradas**: en la carretera, tocar un vehículo mata; en el río, **la rana viaja con la plataforma que tiene debajo** y muere si no hay ninguna o si la arrastran fuera del tablero; en la orilla, solo un nenúfar libre es seguro.
- **Temporizador por viaje**: 30 s que se **reinician en cada vida y en cada llegada**; al agotarse se pierde una vida. Se mide con el acumulador del bucle, así que la pausa lo congela.
- **Puntuación por avance, nenúfar y tiempo**: `+10` por cada fila nueva alcanzada en el viaje, `+50` por nenúfar, `+10` por segundo entero que sobre, y `+1 000` al llenar los cinco.
- **Niveles infinitos**: llenar los cinco nenúfares sube el nivel, los vacía y acelera los carriles un 10 % por nivel, con tope en el doble. **No hay victoria.**
- **Sistema de vidas, como el resto de la plataforma.** Tres vidas; cada muerte cuesta una y la rana reaparece en la salida con el reloj lleno, conservando puntuación, nivel y nenúfares ocupados.
- **Sin binarios.** `start()` sigue siendo **sincrónico y sin fase de carga**: ni imágenes, ni audio, ni fuentes propias, ni una sola petición de red. Rana, vehículos, troncos, tortugas y nenúfares se dibujan con primitivas de canvas.
- **Repintado con la paleta del Vault**: rana en verde con glow, coches en cian, amarillo y magenta, camiones en tinta tenue, troncos en bronce, tortugas en oro, agua cian apenas insinuada, mediana y salida en magenta tenue.
- **Controles**: `←` `→` `↑` `↓`, por `e.code`, **un salto por pulsación**. **`P` y `Escape` siguen siendo de la plataforma**; el motor no las reclama.
- **El HUD de React no cambia.** El motor emite `score`, `lives` y `level`. **No se emite `lines`.**
- **Registro** en `lib/games/registry.ts`: una línea, `ranaria: createRanaEngine`.
- **Fin de partida**: al agotar las vidas manda el `GameOverModal` de la plataforma, con el guardado por `submitScore` de SPEC 06.
- **Limpieza al desmontar**: se cancela el bucle, se retiran los oyentes de teclado y se descarta el estado de la partida.

### Fuera (explícitamente)

- **Supabase.** Ni migración, ni tabla, ni rama de vista, ni fila de catálogo, ni tipos regenerados. Lo hizo SPEC 06, y el tope lo alineó el SPEC 1/3.
- **`submit_score`, `top_scores` y `game_stats`.** Están dirigidos por el catálogo y un motor nuevo no los cambia. No se editan.
- **`lib/games/types.ts`.** El contrato no se amplía: el juego cabe en `score`, `lives` y `level`. El tiempo restante vive solo en la banda del canvas.
- **`components/player/game-player.tsx`.** No se toca: el HUD de vidas con corazones ya existe y no hay nada que cargar.
- **El copy y la portada de la ficha.** El `long` y `cover-rana` ya describen este juego.
- **Lo que trae el SPEC 3/3** —«Río vivo»—: **tortugas que se sumergen, la mosca de bonificación en un nenúfar, el cocodrilo y la vida extra**. Aquí todas las tortugas flotan siempre, no hay mosca ni cocodrilo y las vidas no suben nunca. El juego de este spec es **mínimo, jugable y completo** sin ellos.
- **Nutrias, serpientes en la mediana, rana hembra que escoltar y cocodrilos dentro de los nenúfares.** Contenido del Frogger original que no entra ni en el 3/3.
- **Multiplicador de puntos por nivel.** Los puntos son fijos; lo que sube es la dificultad.
- **Salto mantenido.** Mantener una flecha no repite saltos: hay que pulsar otra vez.
- **Sonido.** Ni ficheros ni síntesis. Ningún motor del Vault suena y el reproductor no tiene conmutador de silencio.
- **WASD, ratón y controles táctiles.** Solo flechas; en táctil se ve «REQUIERE TECLADO».
- **Escribir nada dentro de `references/`.** La carpeta es de solo lectura.
- **Los otros motores.** `gloton`, `invasores` y `duelo-pixel` siguen en «PRÓXIMAMENTE»; `asteroides`, `piezas`, `ladrillos` y `serpiente` no se tocan.
- **Tests.** Sigue sin haber runner configurado.

---

## 2. Modelo de datos

**No hay persistencia nueva.** La marca la guarda la Server Action `submitScore` de SPEC 06 con `game: "ranaria"`, igual que ROCAS, CAÍDA, BLOQUE BUSTER y SERPENTINA. Lo nuevo son las constantes de la mecánica, la tabla de carriles y el reparto de color.

### 2.1 Lo que la base ya tiene

Leído con `execute_sql` sobre `public.games` y con `pg_get_viewdef('public.leaderboard')`, y ajustado por el SPEC 1/3. **Este spec no toca Supabase.**

| Columna         | Valor                                                                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `id`            | `ranaria`                                                                                                                                 |
| `title`         | `RANARIA`                                                                                                                                 |
| `short`         | «Cruza la autopista de pixeles.»                                                                                                          |
| `long`          | «Salta entre carriles de coches a toda velocidad y troncos a la deriva en el río. Llega a los nenúfares antes de que se acabe el tiempo.» |
| `cat` · `color` | `ARCADE` · `green`                                                                                                                        |
| `cover`         | `cover-rana` —la clase ya existe en `app/globals.css`—                                                                                    |
| `sort_order`    | `7`                                                                                                                                       |
| `scores_table`  | `scores_ranaria`, con su índice, su RLS, su política de lectura y **su rama en `leaderboard`**                                            |
| Reglas          | `desc` · `PUNTOS` · `12` · `999 999` —tras el SPEC 1/3—                                                                                   |

La ruta `/juegos/ranaria` y su `/jugar` **ya resuelven**: `generateStaticParams` sale de `listGameIds()` y la ficha está sembrada desde SPEC 06. Hoy el reproductor pinta «PRÓXIMAMENTE» porque `getEngineFactory('ranaria')` devuelve `null`; este spec solo rellena ese hueco.

### 2.2 El reparto del lienzo

| Constante       | Valor                                                                    |
| --------------- | ------------------------------------------------------------------------ |
| `W` × `H`       | `800` × `600` — el mundo interno del reproductor                         |
| `HUD_H`         | `40` px, banda superior: puntuación, nivel y vidas                       |
| `CELL`          | `40` px                                                                  |
| `COLS` × `ROWS` | `19` × `13`                                                              |
| `BOARD`         | `{ x: 20, y: 40, w: 760, h: 520 }`                                       |
| `TIME_BAND`     | `{ x: 20, y: 568, w: 760, h: 16 }` — la barra de tiempo, bajo el tablero |
| `START_COL`     | `9` — la columna central; su centro es `x = 400`                         |

**Diecinueve columnas, no veinte**, y por dos razones: el margen de 20 px a cada lado separa el tablero del bisel redondeado de `.crt-screen` —el borde del tablero es el límite que mata al ser arrastrado y tiene que verse—, y con un número impar de columnas **existe una columna central** donde la rana sale alineada con el nenúfar del medio.

Las filas se numeran de arriba abajo, `row = 0 … 12`, y la `y` de una fila es `BOARD.y + row × CELL`:

| Fila     | Papel                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| `0`      | Orilla de los nenúfares: cinco bahías en las columnas `1`, `5`, `9`, `13`, `17`; el resto es orilla que mata |
| `1`–`5`  | Río: troncos y tortugas; el agua mata                                                                        |
| `6`      | Mediana: segura                                                                                              |
| `7`–`11` | Carretera: vehículos; el asfalto es seguro, los vehículos no                                                 |
| `12`     | Acera de salida: segura, donde aparece la rana                                                               |

Los centros de las bahías son `x = 80, 240, 400, 560, 720`: simétricos respecto al centro del lienzo.

### 2.3 Las constantes de la mecánica

No hay original del que copiarlas, así que estos números **son el diseño** y están calibrados para que la primera partida dure un par de minutos y el nivel 11 sea exigente pero jugable.

| Constante          | Valor     | Qué hace                                                                 |
| ------------------ | --------- | ------------------------------------------------------------------------ |
| `MAX_DT`           | `0.05` s  | Tope del `dt`, el invariante del contrato                                |
| `START_LIVES`      | `3`       | Vidas iniciales                                                          |
| `HOP_COOLDOWN`     | `0.12` s  | Tiempo mínimo entre dos saltos                                           |
| `HOP_ANIM`         | `0.10` s  | Duración de la animación del salto —solo dibujo—                         |
| `DEATH_TIME`       | `1.2` s   | Pausa tras una muerte, con el marcador de la causa, antes de reaparecer  |
| `TIME_LIMIT`       | `30` s    | Reloj de cada viaje                                                      |
| `TIME_WARN`        | `8` s     | Por debajo, la barra pasa a magenta y parpadea                           |
| `POINTS_ROW`       | `10`      | Por cada fila nueva alcanzada en el viaje                                |
| `POINTS_HOME`      | `50`      | Por llegar a un nenúfar libre                                            |
| `TIME_BONUS_PER_S` | `10`      | Por cada segundo entero que sobre al llegar: `10 × floor(timeLeft)`      |
| `POINTS_ALL_HOMES` | `1000`    | Al ocupar el quinto nenúfar                                              |
| `HOMES`            | `5`       | Nenúfares por nivel                                                      |
| `HOME_TOLERANCE`   | `14` px   | Distancia máxima entre el centro de la rana y el de la bahía para entrar |
| `SPEED_STEP`       | `0.10`    | Aceleración de los carriles por nivel: `mult = 1 + 0.10 × (level − 1)`   |
| `SPEED_MAX_MULT`   | `2.0`     | Tope del multiplicador, alcanzado en el nivel 11                         |
| `FROG_INSET`       | `8` px    | Margen de la caja de la rana: ocupa 24 × 24 dentro de su celda           |
| `VEHICLE_INSET`    | `3` px    | Margen de la caja de un vehículo por cada lado horizontal                |
| `LEVEL_BANNER`     | `1.5` s   | Cartel «NIVEL N» tras llenar los nenúfares; no detiene el juego          |
| `SCORE_CAP`        | `999_999` | Saturación del marcador. **Igual a `games.max_score`** (SPEC 1/3)        |

**Máximo por nivel.** Un viaje vale como mucho `12 × 10 + 50 + 10 × 30 = 470`, y un nivel `5 × 470 + 1 000 = 3 350`. Con un viaje realista de 10-15 s sobran ~15-20 s, así que un nivel bueno ronda los 2 700. Una partida excepcional de 25-30 niveles queda en 70-100 k: `SCORE_CAP` está un orden de magnitud por encima y solo una sesión maratoniana de cientos de niveles lo tocaría. Si lo toca, el marcador **satura** en `999 999` y la marca entra igual, porque el tope de la base es inclusivo.

**Tres invariantes entre estas constantes**, que el comentario de `constants.ts` tiene que repetir:

- **`HOP_ANIM < HOP_COOLDOWN`.** La animación de un salto termina antes de que se acepte el siguiente, así que el dibujo nunca interpola desde una posición que ya no existe.
- **Ningún vehículo atraviesa a la rana entre dos fotogramas.** El carril más rápido es el deportivo, a `160 × SPEED_MAX_MULT = 320 px/s`; con el `dt` capado, avanza como mucho `320 × 0,05 = 16 px` por fotograma, **muy por debajo de una celda de 40 px**. Para que un vehículo pasara de un lado a otro de la rana sin que ningún fotograma los muestre solapados tendría que moverse más que la suma de los dos anchos de caja —`24 + 34 = 58 px`—. **16 ≤ 58 con holgura.** Si alguien sube una velocidad base o `SPEED_MAX_MULT` hasta que `vmax × MAX_DT` se acerque a 58, el túnel aparece en silencio.
- **Un salto lateral no salta por encima de un coche.** El salto mueve 40 px y se comprueba en la posición de llegada; con la caja de la rana de 24 px y la del coche más corto de 34, cualquier coche que estuviera «en medio» solapa con la posición de llegada, porque `40 < 58`.

**Todos los tiempos —reloj, cooldown, muerte, cartel— se miden con acumuladores en segundos, nunca con `setTimeout`**: así la pausa de la plataforma los congela de verdad.

### 2.4 Los carriles

Cada carril es una cinta circular de longitud `ring = count × gap` celdas, por la que circulan `count` objetos de `len` celdas separados `gap` celdas entre sus inicios. El carril guarda un único `offset` en píxeles que avanza `dir × speed × mult × dt`; la `x` izquierda de cada objeto se deriva:

```ts
x = BOARD.x + mod(offset + i × gap × CELL, ring × CELL) − len × CELL;
```

| Fila | Tipo      | Dir | `count` | `len` | `gap` | `speed` (px/s) | `ring` ≥ `COLS + len` |
| ---- | --------- | --- | ------- | ----- | ----- | -------------- | --------------------- |
| `1`  | tronco    | →   | 3       | 4     | 8     | 60             | 24 ≥ 23               |
| `2`  | tortugas  | ←   | 4       | 2     | 6     | 70             | 24 ≥ 21               |
| `3`  | tronco    | →   | 2       | 6     | 13    | 90             | 26 ≥ 25               |
| `4`  | tronco    | →   | 3       | 3     | 8     | 50             | 24 ≥ 22               |
| `5`  | tortugas  | ←   | 4       | 3     | 6     | 60             | 24 ≥ 22               |
| `7`  | camión    | ←   | 3       | 2     | 7     | 70             | 21 ≥ 21               |
| `8`  | deportivo | →   | 2       | 1     | 10    | 160            | 20 ≥ 20               |
| `9`  | coche     | ←   | 3       | 1     | 7     | 100            | 21 ≥ 20               |
| `10` | coche     | →   | 3       | 1     | 7     | 80             | 21 ≥ 20               |
| `11` | coche     | ←   | 3       | 1     | 7     | 60             | 21 ≥ 20               |

**El invariante de la última columna, `count × gap ≥ COLS + len`, es lo que hace invisible el envolvimiento**: un objeto sale entero por un lado antes de reaparecer por el otro, porque la cinta es más larga que el tablero más el propio objeto. Si alguien baja un `gap`, los objetos aparecerán de golpe en mitad del tablero. Con él se cumple también otra cosa: **una rana subida a un tronco siempre sale del tablero —y muere— antes de que su tronco llegue al punto de envolvimiento**, así que nunca hay que arrastrarla «a través» del salto modular.

El dibujo se recorta con `ctx.clip()` al rectángulo del tablero: los objetos que entran y salen se ven cortados por el borde, no pintados sobre el margen.

Los `offset` iniciales se fijan en la tabla —no al azar— para que la primera partida sea siempre la misma, y se conservan al subir de nivel; solo cambia `mult`.

### 2.5 Colisiones y muertes

La posición de la rana es `{ x, row }`: `x` es el **centro** en píxeles, continuo; `row` es entera. La caja de colisión es `CELL − 2 × FROG_INSET = 24 px` centrada en `x`.

**Orden de un fotograma en `status === "playing"`**, siempre el mismo:

1. **Plataforma.** Si la rana está en una fila de río, se busca **antes de mover nada** la plataforma cuya extensión horizontal `[x, x + len × CELL]` contiene el **centro** de la rana. Se guarda su velocidad `vx`, o `null`.
2. **Carriles.** Avanzan todos los `offset`.
3. **Arrastre.** Si había plataforma, `frog.x += vx × dt`: la rana se mueve **exactamente** lo mismo que su tronco o sus tortugas, así que no se desliza sobre ellos ni se queda atrás.
4. **Salto**, si hay uno pendiente y el cooldown lo permite (§2.6). Cambia la posición lógica en el acto; la animación es solo de dibujo.
5. **Comprobación**, en la posición final:
   - **Carretera** (filas 7-11): si la caja de la rana solapa la de algún vehículo —el vehículo con `VEHICLE_INSET` de margen horizontal— → muerte **«ATROPELLADA»**.
   - **Río** (filas 1-5): si no hay plataforma bajo el centro —recalculada si la rana acaba de saltar a esta fila o dentro de ella— → **«AL AGUA»**. Si el centro sale de `[BOARD.x, BOARD.x + BOARD.w]` → **«ARRASTRADA»**.
   - **Orilla** (fila 0): se resuelve en el mismo salto que la alcanza. Si el centro está a `≤ HOME_TOLERANCE` del centro de una bahía **libre**, la rana la ocupa —se coloca en su centro— y puntúa (§2.7). Si la bahía está ocupada, o la rana cae en la orilla entre bahías → **«AL AGUA»**.
   - **Mediana, carretera fuera de vehículos y salida**: seguras.
6. **Reloj.** `timeLeft -= dt`; a `≤ 0` → muerte **«¡TIEMPO!»**.

**Por qué la plataforma se resuelve antes de mover los carriles**: si se resolviera después, una rana en el borde trasero de un tronco que avanza quedaría fuera de su extensión en el mismo fotograma en que el tronco la deja atrás, y moriría «al agua» estando visualmente encima. Resolver primero y heredar después hace que lo que se ve y lo que cuenta coincidan.

**Por qué se usa el centro y no la caja** en el río: la caja exigiría la rana entera sobre el tronco y castigaría aterrizar en el extremo; el centro es lo que el jugador percibe como «estar encima». En la carretera es al revés: se usa la caja, porque ahí cualquier roce debe matar.

**Saltos que no se aceptan.** `↓` en la salida y cualquier salto lateral cuyo centro de llegada quedara fuera de `[BOARD.x + CELL / 2, BOARD.x + BOARD.w − CELL / 2]` **se ignoran**: no se puede salir del tablero saltando. Solo el arrastre puede sacar a la rana, y eso mata.

**Encaje a la rejilla.** Al saltar a una fila que no es de río —mediana, carretera, salida— la `x` se **redondea al centro de columna más cercano**. Sin ese encaje, una rana que bajara del río a la mediana desalineada recorrería la carretera entre columnas y no podría volver a encarar un nenúfar con precisión. En el río no se encaja: ahí la `x` es la del tronco.

**Al morir**: `lives -= 1` en el mismo fotograma —el HUD de React lo refleja ya—, se guarda `deathCause` y la posición del marcador. Si quedan vidas, `status = "dead"` durante `DEATH_TIME`; los carriles **siguen moviéndose** pero el reloj no corre y las flechas no hacen nada; después la rana reaparece en `START_COL`, fila 12, con `timeLeft = TIME_LIMIT` y `bestRow = 12`. Si era la última, `status = "gameover"`, el canvas pinta «GAME OVER» y se llama a `onGameOver(score)` en ese mismo fotograma.

### 2.6 Entrada y saltos

- **Una pulsación, un salto.** El `keydown` con `e.repeat === true` se ignora: mantener la flecha no encadena saltos.
- **Un hueco de búfer.** Si llega una flecha durante el cooldown, se guarda en `queuedHop` —un solo hueco, la última gana— y se aplica en cuanto el cooldown expira. Así un jugador rápido no pierde el segundo salto de una ráfaga, y una ráfaga no programa varios saltos por delante.
- **Con `paused`, o con `status !== "playing"`**, las flechas no se guardan.
- `facing` recuerda la dirección del último salto, solo para dibujar la rana orientada.

### 2.7 La puntuación

| Evento                           | Puntos                                                      |
| -------------------------------- | ----------------------------------------------------------- |
| Fila nueva alcanzada en el viaje | `+10` —solo si `row < bestRow`, y entonces `bestRow = row`— |
| Llegar a un nenúfar libre        | `+50` más `10 × floor(timeLeft)`                            |
| Ocupar el quinto nenúfar         | `+1 000`, nivel `+1`                                        |

`bestRow` se reinicia a `12` en cada reaparición y en cada llegada: **volver a pisar una fila ya pisada no puntúa**, así que bajar y subir no es una forma de sumar. Alcanzar la fila 0 cuenta como fila nueva —son 12 avances por viaje— solo si la llegada es válida; una muerte en la orilla no suma ese avance.

Tras cada llegada la rana reaparece en la salida con el reloj lleno. Al ocupar el quinto nenúfar se suman los `1 000`, sube el nivel, los cinco nenúfares se vacían en ese fotograma, `mult` se recalcula y se muestra «NIVEL N» durante `LEVEL_BANNER` sin detener el juego.

Toda suma pasa por `addScore(n)`, que hace `score = Math.min(score + n, SCORE_CAP)`.

### 2.8 Las figuras, con primitivas

Ninguna es un sprite y **ninguna llama a `drawImage`**:

- **Rana**: elipse de 26 × 24 px en `frog` con `shadowBlur`, cuatro patas como trazos de 3 px, dos ojos —círculos en `frog` con pupila en `eye`— hacia `facing`. Se dibuja rotando el `ctx` según `facing`. Durante `HOP_ANIM` la posición dibujada interpola desde la celda anterior y la figura se estira un 15 % en la dirección del salto.
- **Coche**: rectángulo redondeado de `CELL − 6` × 26 px en el color del carril, con dos faros —cuadrados de 4 px en `ink`— en la cara delantera y cuatro ruedas en `bg`.
- **Deportivo**: igual que el coche, más bajo (20 px) y con una franja central en `bg`.
- **Camión**: caja de dos celdas en `truck` y cabina de 12 px en `cyan` en la cara delantera.
- **Tronco**: rectángulo redondeado de `len × CELL − 4` × 28 px en `log`, con los extremos como círculos en `logEnd` y tres vetas horizontales en `logGrain`.
- **Tortugas**: un círculo de 15 px de radio por celda en `turtle`, con caparazón marcado por un hexágono interior en `turtleShell` y cuatro patas cortas.
- **Nenúfar**: círculo de 16 px en `lily` con una cuña recortada; ocupado, lleva encima una rana pequeña en `frogHome`.
- **Marcadores de muerte**, durante `DEATH_TIME`: una aspa en `death` para «ATROPELLADA»; tres anillos concéntricos que crecen en `ripple` para «AL AGUA» y «ARRASTRADA»; un reloj —círculo y dos manecillas— en `death` para «¡TIEMPO!». El rótulo de la causa se pinta centrado sobre el tablero.

### 2.9 La paleta del canvas

Literales con el token en comentario, el mismo criterio que `lib/games/serpiente/constants.ts`: `ctx` no entiende variables CSS y leerlas con `getComputedStyle` en cada fotograma sería caro.

```ts
export const PALETTE = {
  bg: "#0a0a0f", // --bg
  water: "rgba(0, 245, 255, 0.08)", // --cyan, el río
  bank: "rgba(0, 255, 136, 0.10)", // --green, la orilla de los nenúfares
  road: "#15151f", // --bg-3, el asfalto
  laneLine: "#4a4f70", // --ink-faint, las marcas discontinuas
  safe: "rgba(255, 0, 110, 0.10)", // --magenta, mediana y salida
  frame: "rgba(0, 245, 255, 0.18)", // --line, el borde del tablero
  frog: "#00ff88", // --green
  eye: "#0a0a0f", // --bg
  frogHome: "#00f5ff", // --cyan, la rana ya a salvo en su nenúfar
  lily: "#00ff88", // --green
  car1: "#00f5ff", // --cyan
  car2: "#f5ff00", // --yellow
  car3: "#ff006e", // --magenta
  sport: "#ff006e", // --magenta
  truck: "#8a8fb5", // --ink-dim
  log: "#d97a3a", // --bronze
  logEnd: "#8a4d25", // --bronze al 64 %
  logGrain: "rgba(10, 10, 15, 0.35)", // --bg con alfa
  turtle: "#ffcf3a", // --gold
  turtleShell: "#8a6f1f", // --gold al 54 %
  ripple: "#00f5ff", // --cyan
  death: "#ff006e", // --magenta
  timeBar: "#00ff88", // --green
  timeWarn: "#ff006e", // --magenta
  hud: "#e6e9ff", // --ink
  hudLabel: "#4a4f70", // --ink-faint
  overlay: "rgba(10, 10, 15, 0.72)", // --bg con alfa
  gameOver: "#ff006e", // --magenta
  banner: "#f5ff00", // --yellow, el cartel de nivel
} as const;

export const INK_RGB = "230, 233, 255";

/** Mismas familias que --mono y --pixel de globals.css. */
export const FONT_MONO = '"JetBrains Mono", "Courier New", monospace';
export const FONT_PIXEL = '"Press Start 2P", system-ui, monospace';
```

**Verde es la rana, y solo la rana y su destino.** Ningún obstáculo es verde: los coches son cian, amarillo y magenta; las plataformas, bronce y oro. Así la rana se encuentra de un vistazo en cualquier fila.

El HUD del canvas reparte la banda superior: puntuación a la izquierda, «NIVEL 01» centrado y las vidas a la derecha como ranas pequeñas. La banda inferior lleva el rótulo «TIEMPO» y la barra, que se vacía de derecha a izquierda en `timeBar` y pasa a `timeWarn`, parpadeando a 4 Hz, por debajo de `TIME_WARN`.

### 2.10 Estado interno de la partida

Todo vive **dentro de la instancia** que devuelve la fábrica, nunca en variables de módulo: dos pantallas montadas a la vez no se pisan y el doble montaje en modo estricto no arranca dos bucles.

`frog` (`{ x, row, prevX, prevRow, hopT, cooldown, facing }`), `queuedHop`, `lanes` (array de `{ row, kind, dir, count, len, gap, speed, offset }`), `homes` (array de cinco booleanos), `bestRow`, `timeLeft`, `score`, `lives`, `level`, `status`, `deathCause`, `deathAt`, `deathAcc`, `bannerAcc`, y la contabilidad del bucle (`rafId`, `lastTime`, `destroyed`, `listening`, `paused`, `lastSnapshot`).

`status` son tres valores: `"playing" | "dead" | "gameover"`. `deathCause` es `"atropellada" | "agua" | "arrastrada" | "tiempo" | null`.

**La bandera `paused` entra desde el primer momento.** La pausa la gobierna el reproductor y no toca `status`, así que sin ella las flechas seguirían guardando saltos con el lienzo congelado, que se aplicarían todos al reanudar. Es el fallo que apareció implementando SPEC 07 y que SPEC 08 y 09 ya previnieron.

**No hay victoria.** Los niveles son infinitos y la velocidad se estabiliza en el 11; el único final es agotar las vidas.

---

## 3. Plan de implementación

Cada paso deja el proyecto compilando. Hasta el paso 6 la aplicación se comporta exactamente como hoy.

0. **Comprobar el terreno.** `select max_score from public.games where id = 'ranaria'` devuelve `999999`. Si devuelve `10000000`, el SPEC 1/3 no está aplicado: avisar y ejecutarlo antes. Es solo lectura; este spec no aplica nada.

1. **Constantes.** `lib/games/rana/constants.ts`: `W`/`H`, `HUD_H`, `CELL`, `COLS`, `ROWS`, `BOARD`, `TIME_BAND`, `START_COL`, las filas por papel (`HOME_ROW`, `RIVER_ROWS`, `MEDIAN_ROW`, `ROAD_ROWS`, `START_ROW`), `HOME_COLS`, la tabla de §2.3, `LANES` con la tabla de §2.4, `PALETTE`, `INK_RGB`, `FONT_MONO` y `FONT_PIXEL`. Incluye los comentarios de los invariantes —`HOP_ANIM < HOP_COOLDOWN`, `vmax × MAX_DT` frente a 58 px, `count × gap ≥ COLS + len`— y el de `SCORE_CAP`, que cita `games.max_score`.

2. **Carriles, lógica pura.** `lib/games/rana/lanes.ts`: `speedMult(level)`, `objectsOf(lane)` —las `x` derivadas del `offset`—, `advanceLanes(lanes, mult, dt)` y `platformUnder(lanes, row, x)`, que devuelve la `vx` de la plataforma bajo el centro o `null`. Sin `ctx`, sin estado de módulo y sin efectos al importar.

3. **Rana y colisiones, lógica pura.** `lib/games/rana/frog.ts`: `tryHop(frog, dir)` con las reglas de saltos no aceptados y el encaje a la rejilla, `hitsVehicle(lanes, frog)`, `homeAt(x, homes)` y `resolveFrame(state, dt)`, que aplica **el orden de §2.5** y devuelve la causa de muerte o el evento de llegada. Funciones sobre los datos que reciben.

4. **Dibujo.** `lib/games/rana/draw.ts`: `clear`, fondo por filas, marcas de carril, `drawLane` con recorte al tablero, las figuras de §2.8, la rana con su interpolación de salto, los nenúfares, los marcadores de muerte, el HUD del canvas, la barra de tiempo con su parpadeo y `drawOverlay` para el rótulo de la causa, «NIVEL N» y «GAME OVER». Cada función recibe el `ctx`; ninguna lo lee del ámbito. **Ninguna llama a `drawImage`.**

5. **Fábrica y bucle.** `lib/games/rana/index.ts` con `createRanaEngine(canvas, hooks): GameEngine`: monta el estado, expone `start` / `pause` / `resume` / `restart` / `destroy`, corre el `requestAnimationFrame` con el `dt` en segundos capado a `MAX_DT` y `lastTime = null` como centinela, engancha `keydown` y `keyup` en `window` por `e.code` con `CAPTURED_KEYS` (`ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`) y `preventDefault`, ignora `e.repeat`, pasa todo por `isTypingTarget` y por la bandera `paused`, `clearInput()` —vacía `queuedHop`— en `pause()` / `restart()` / `destroy()`, emite `onSnapshot` solo cuando cambia alguno de los tres valores y en el mismo fotograma, y llama a `onGameOver(score)` al agotar las vidas. Oyentes enganchados una sola vez con `listening` y retirados en `destroy()`, guardas sobre `destroyed`. **`start()` es sincrónico.** **No engancha `KeyP` ni `Escape`.** `start()` y `restart()` emiten el primer estado antes de pedir fotograma.

6. **Registrar.** Una línea en `lib/games/registry.ts`: `ranaria: createRanaEngine`, sin comillas —el id no lleva guion—, y `rana` para `ranaria` en el comentario que lista las carpetas. Añadir la fila `ranaria` · `rana` a la tabla de juegos de `CLAUDE.md`.

7. **El reproductor no se toca.** `components/player/game-player.tsx` se queda como está.

8. **Recorrido completo.** Partida real en `/juegos/ranaria/jugar`: cruzar la carretera esquivando los cinco carriles, dejarse atropellar, saltar a un tronco y comprobar que arrastra a la rana, caer al agua, dejarse arrastrar fuera por el borde, agotar el reloj quieto en la salida, llegar a un nenúfar con tiempo de sobra y comprobar el bonus, intentar entrar en un nenúfar ocupado, llenar los cinco y ver «NIVEL 02» con los carriles más rápidos, gastar las tres vidas, guardar la marca y reiniciar desde el modal. Comprobar `P` —el reloj se congela—, `Escape`, los tres botones y una ruta sin motor. Después `npm run lint` y `npm run build` limpios, y `git status` sin cambios en `references/`, en `public/`, en `supabase/` ni en los otros cuatro motores.

---

## 4. Criterios de aceptación

- [ ] En `/juegos/ranaria/jugar` se juega de verdad: la rana aparece en la columna central de la acera de salida con 3 vidas, nivel 1 y el reloj lleno.
- [ ] Cada flecha hace **un salto de una celda**; mantenerla pulsada **no** encadena saltos.
- [ ] Dos flechas pulsadas en ráfaga dan dos saltos seguidos; una tercera dentro del mismo cooldown sustituye a la segunda, no se suma.
- [ ] `↓` en la acera de salida no hace nada, y **ningún salto lateral saca a la rana del tablero**.
- [ ] Tocar cualquier vehículo de las filas 7-11 cuesta una vida con el rótulo «ATROPELLADA».
- [ ] **Ningún vehículo atraviesa a la rana sin matarla**, tampoco el deportivo a nivel 11, ni volviendo de una pestaña dormida.
- [ ] Un salto lateral **no salta por encima de un coche**: si había un coche en medio, la rana muere.
- [ ] Sobre un tronco o unas tortugas, **la rana se desplaza exactamente con ellos**: no resbala ni se queda atrás, y puede saltar lateralmente sobre el mismo tronco.
- [ ] Saltar a una fila de río sin plataforma bajo el centro de la rana cuesta una vida con «AL AGUA»; aterrizar en el extremo de un tronco, con el centro encima, **no** mata.
- [ ] Un tronco que arrastra a la rana fuera del borde del tablero la mata con «ARRASTRADA».
- [ ] Llegar a un nenúfar libre lo deja ocupado con una rana cian y suma `50 + 10 × segundos enteros restantes`; saltar a uno ocupado o a la orilla entre bahías mata con «AL AGUA».
- [ ] Cada fila nueva del viaje suma 10 puntos; **bajar y volver a subir no suma** otra vez.
- [ ] Al ocupar el quinto nenúfar se suman 1 000 puntos, aparece «NIVEL 02», los nenúfares se vacían y **los carriles van perceptiblemente más rápidos**; a partir del nivel 11 la velocidad deja de subir.
- [ ] El reloj marca 30 s, **se reinicia al reaparecer y al llegar a un nenúfar**, pasa a magenta y parpadea por debajo de 8 s, y al llegar a 0 cuesta una vida con «¡TIEMPO!».
- [ ] Tras una muerte la rana reaparece en la salida a los ~1,2 s, **conservando puntuación, nivel y nenúfares ocupados**.
- [ ] Con tres muertes la partida termina, el canvas pinta «GAME OVER» y se abre el `GameOverModal`.
- [ ] Los objetos de los carriles **entran y salen del tablero recortados por su borde**, y ninguno aparece de golpe en mitad del tablero.
- [ ] El HUD de React muestra **«Vidas»** con corazones, no «Líneas», y sus tres cifras coinciden con las del HUD del canvas sin desfase perceptible.
- [ ] El HUD del canvas reparte puntuación a la izquierda, nivel centrado y vidas a la derecha, y la barra de tiempo ocupa la banda inferior.
- [ ] `P` pausa y reanuda; `Escape` y SALIR llevan a `/juegos/ranaria`; FIN abre el modal.
- [ ] **Con el juego en pausa las flechas no guardan saltos y el reloj no corre**: al reanudar quedan los mismos segundos y la rana no salta sola.
- [ ] El motor **no** reclama `P` ni `Escape`.
- [ ] Las flechas no hacen scroll de la página mientras se juega.
- [ ] Escribir las iniciales en el modal no mueve la rana, y soltar una tecla con el foco en el campo no deja nada pegado.
- [ ] REINICIAR en el modal arranca una partida nueva con 0 puntos, 3 vidas, nivel 1, nenúfares vacíos y el reloj lleno.
- [ ] Al salir de la ruta no queda bucle ni oyentes vivos, y el doble montaje en modo estricto **no arranca dos bucles ni dobla la velocidad** de los carriles ni del reloj.
- [ ] Con puntero táctil se ve «REQUIERE TECLADO» y el motor no arranca.
- [ ] El canvas mantiene 4:3 a cualquier ancho y no desborda el marco CRT en móvil; el borde del tablero se ve entero, sin que lo coma el bisel.
- [ ] El juego se pinta con la paleta del Vault: rana verde con glow, coches cian, amarillo y magenta, troncos bronce, tortugas oro; **ningún obstáculo es verde**.
- [ ] **No se carga ninguna imagen**: el panel de red no registra peticiones al entrar a jugar, y `drawImage` no aparece en `lib/games/rana/`.
- [ ] `start()` es sincrónico: no hay `async`, ni promesas, ni callbacks de carga en `lib/games/rana/`.
- [ ] No suena nada.
- [ ] El marcador **satura en 999 999** —comprobable bajando `SCORE_CAP` en local y devolviéndolo— y esa marca se guarda sin `22003`.
- [ ] `getEngineFactory('ranaria')` devuelve la fábrica; `gloton`, `invasores` y `duelo-pixel` siguen mostrando «PRÓXIMAMENTE».
- [ ] `lib/games/types.ts` y `components/player/game-player.tsx` están **sin tocar**, y `lib/games/asteroides/`, `piezas/`, `ladrillos/` y `serpiente/` no tienen ningún cambio.
- [ ] **`references/` no tiene ningún cambio** y `public/` no gana ningún fichero; `git status` lo confirma.
- [ ] No hay ninguna migración nueva en `supabase/migrations/` respecto al SPEC 1/3, y `select count(*) from public.games` sigue devolviendo 8.
- [ ] La marca guardada aparece en el ranking de `/juegos/ranaria` y en la pestaña RANARIA de `/salon`, resaltada si coincide con el alias de sesión.
- [ ] `/juegos/ranaria` y `/juegos/ranaria/jugar` resuelven **después de un `npm run build`**. Aquí ya existían: la ficha está sembrada desde SPEC 06.
- [ ] `npm run lint` y `npm run build` terminan sin errores ni avisos nuevos.

---

## 5. Decisiones tomadas y descartadas

| Decisión                                                           | Alternativa descartada                                                                               | Motivo                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Concepto: Frogger clásico en la ficha `ranaria`**                | «Salto infinito»: una rana que sube sin fin por un mundo generado, estilo Crossy Road                | Decisión autónoma (game jam). Es esfuerzo L —generación procedural justa, cámara con scroll, tope de `max_score` incierto— y no es lo que promete la ficha, que habla de nenúfares y de tiempo. Coste: la versión clásica es más previsible.                                                       |
| **Concepto: Frogger clásico en la ficha `ranaria`**                | «Lengua rápida»: una rana fija en un nenúfar que caza moscas con la lengua, estilo _Frogs and Flies_ | Decisión autónoma (game jam). No es un cruce, que es lo que pide el tema; la mecánica es apuntar y medir el tiempo, y el ranking sería débil. Descartado sin coste.                                                                                                                                |
| **Escrito desde cero**                                             | Porte de un juego de referencia                                                                      | No hay frogger en `references/RRO5vePTlqkYrGHjYdtf_started-games/`. Coste: los números de §2.3 y §2.4 no vienen calibrados de ningún sitio y habrá que ajustarlos jugando.                                                                                                                         |
| **Carpeta `lib/games/rana/`**                                      | `ranaria/` (igual al slug), o `charca/`                                                              | Decisión autónoma (game jam). Mantiene el precedente de `asteroides` para `rocas`, `piezas`, `ladrillos` y `serpiente`: la carpeta nombra el concepto y no colisiona con ninguna existente.                                                                                                        |
| **Rejilla 19 × 13 de 40 px con margen de 20 px**                   | 20 × 14 a sangre, o celdas de 32 px                                                                  | Decisión autónoma (game jam). Columna central para alinear la salida con el nenúfar del medio, borde del tablero visible lejos del bisel, y celdas grandes para que la rana se lea dentro del CRT. Coste: una columna menos de tráfico.                                                            |
| **Fila entera, `x` continua**                                      | Rejilla estricta, con troncos que avanzan a saltos de celda                                          | Los troncos tienen que arrastrar suavemente a la rana; con rejilla estricta el río se movería a tirones y no se parecería a Frogger.                                                                                                                                                               |
| **Encaje a la columna al salir del río**                           | Dejar la `x` del tronco para siempre                                                                 | Sin encaje, tras un viaje por el río la rana quedaría desalineada de las columnas y de las bahías para el resto de la vida.                                                                                                                                                                        |
| **Plataforma resuelta por el centro, antes de mover los carriles** | Por la caja completa, o después de mover                                                             | Decisión autónoma (game jam). El centro es lo que el jugador percibe como «estar encima»; resolver antes y heredar `vx × dt` después hace que la rana nunca muera estando visualmente sobre el tronco. Coste: aterrizar con media rana fuera del tronco es válido, más indulgente que el original. |
| **Arrastrada fuera del tablero = muerte; salto fuera = ignorado**  | Que la rana choque con el borde y se quede, o envolverla al otro lado                                | Decisión autónoma (game jam). Es la regla de Frogger y es la que pide el tema. Ignorar el salto evita una muerte por una pulsación de más junto al borde.                                                                                                                                          |
| **Reloj de 30 s por viaje, reiniciado en cada vida y llegada**     | Reloj por nivel, o reloj que no se reinicia al morir                                                 | Decisión autónoma (game jam), y lo pide el tema. Por viaje es la regla del original y da un bonus por llegada fácil de leer; 30 s permiten esperar algún hueco sin dejar quedarse quieto.                                                                                                          |
| **Puntos fijos, sin multiplicador por nivel**                      | `× nivel` en avance, nenúfar o bonus                                                                 | Decisión autónoma (game jam). Con niveles infinitos, el multiplicador haría crecer la marca de forma cuadrática y obligaría a un `max_score` enorme. Lo que premia llegar lejos es acumular niveles. Coste: un nivel 20 vale lo mismo que un nivel 2.                                              |
| **Niveles infinitos, aceleración con tope en 2×**                  | Un número fijo de niveles y victoria                                                                 | Decisión autónoma (game jam). Un Frogger no se gana: se aguanta. El tope en el nivel 11 evita que el juego se vuelva imposible y, con él, el invariante anti-túnel queda acotado.                                                                                                                  |
| **`SCORE_CAP = 999 999`, igual que `max_score`**                   | Sin tope en el motor                                                                                 | Ningún motor debe producir una marca que `submit_score` rechace con `22003`. Saturar es el comportamiento de un contador de recreativa.                                                                                                                                                            |
| **Una pulsación, un salto, con un hueco de búfer**                 | Repetición al mantener; o sin búfer                                                                  | Mantener para avanzar convierte la carretera en una carrera ciega. Sin búfer, el segundo salto de una ráfaga se pierde dentro del cooldown y el control se siente sordo.                                                                                                                           |
| **Tres vidas, sin vida extra**                                     | Vida extra por puntos                                                                                | Decisión autónoma (game jam). La vida extra va al SPEC 3/3; aquí el HUD de corazones funciona igual que en el resto del Hub.                                                                                                                                                                       |
| **Todas las tortugas flotan siempre**                              | Tortugas que se sumergen desde el principio                                                          | Decisión autónoma (game jam). Es la pieza que más complica la colisión del río; separarla al SPEC 3/3 deja el 02 jugable y verificable antes.                                                                                                                                                      |
| **Sin binarios, figuras con primitivas**                           | Sprites en `public/` con carga asíncrona                                                             | Que todo el Hub se mueva igual: los cuatro motores existentes son sincrónicos y autocontenidos. Coste: más código de dibujo.                                                                                                                                                                       |
| **El contrato no se amplía**                                       | `time?: number` en `GameSnapshot` para pintar el reloj en el HUD de React                            | El reloj se ve en la banda del canvas; ampliar el contrato tocaría el HUD compartido por un dato que solo usa un juego.                                                                                                                                                                            |
| **Ningún obstáculo verde**                                         | Tortugas verdes, como en el original                                                                 | El verde es la rana; con tortugas verdes la rana desaparecería sobre ellas.                                                                                                                                                                                                                        |
| **Temporizadores con acumulador, no con `setTimeout`**             | `setTimeout` para el reloj, la muerte y el cartel                                                    | `setTimeout` no sabe de la pausa: el reloj seguiría corriendo con el juego congelado.                                                                                                                                                                                                              |
| **Bandera `paused` desde el primer momento**                       | Confiar en que detener el bucle baste                                                                | En SPEC 07 no bastó; aquí guardaría saltos que se ejecutarían al reanudar, posiblemente bajo un coche.                                                                                                                                                                                             |
| **La pausa y la salida son de la plataforma**                      | Que el motor se quede con `P` o `Escape`                                                             | Son del reproductor desde SPEC 05.                                                                                                                                                                                                                                                                 |
| **Sin sonido**                                                     | Síntesis con WebAudio para el salto y el chapuzón                                                    | Coherente con el resto del Vault: el reproductor no tiene conmutador de silencio.                                                                                                                                                                                                                  |

---

## 6. Riesgos identificados

1. **Doble montaje en desarrollo.** React monta y desmonta los efectos dos veces en modo estricto. Si `destroy()` no cancela el `requestAnimationFrame` y los oyentes de teclado, quedan dos bucles: los carriles van al doble de velocidad y **el reloj se gasta el doble de rápido**, un síntoma fácil de atribuir a la calibración. Es el fallo más probable del spec. **Mitigación:** las guardas `destroyed` y `listening`, y el criterio de aceptación que lo comprueba a mano.

2. **El orden de resolución en el río.** Si se mueven los carriles antes de buscar la plataforma, o se busca con la caja en vez del centro, la rana muere «al agua» estando encima de un tronco, sobre todo en sus extremos y a velocidad alta. Es el fallo que más frustra a un jugador de Frogger. **Mitigación:** el orden de §2.5 es parte del spec, `resolveFrame` lo implementa en un solo sitio, y hay un criterio que exige aterrizar en el extremo.

3. **Túnel a través de un vehículo.** Si alguien sube velocidades o `SPEED_MAX_MULT`, o quita el tope de `MAX_DT`, un vehículo puede pasar de un lado a otro de la rana entre dos fotogramas. **Mitigación:** el invariante `vmax × MAX_DT ≤ 16 px`, muy por debajo de los 58 px de cajas sumadas, escrito en el comentario de `constants.ts`.

4. **El envolvimiento visible.** Si un carril incumple `count × gap ≥ COLS + len`, los objetos aparecen de golpe en el tablero y una rana sobre un tronco podría «saltar» con él al otro lado. **Mitigación:** la columna de comprobación de la tabla de §2.4 y el comentario en `LANES`.

5. **El reloj que no se congela.** Si `timeLeft` se descuenta fuera de la rama `!paused && status === "playing"`, la pausa o la animación de muerte se comen el tiempo del viaje siguiente. **Mitigación:** un solo sitio descuenta el reloj, y un criterio lo comprueba pausando con poco tiempo.

6. **Los números no vienen calibrados de ningún sitio.** Velocidades, huecos, 30 s y bonus son una primera apuesta. **Mitigación:** van todos en `constants.ts` y en la tabla `LANES`, así que ajustarlos es tocar una cifra.

7. **El SPEC 1/3 sin aplicar.** El juego funciona, pero `max_score` seguiría en `10 000 000`, desalineado de `SCORE_CAP`. **Mitigación:** el paso 0 del plan lo comprueba antes de escribir código.

8. **Secuestro del teclado.** `preventDefault` en las cuatro flechas impide el scroll mientras se juega; si un oyente sobrevive al desmontaje, la página entera se queda sin scroll. **Mitigación:** `clearInput()` en pausa, reinicio y destrucción, y oyentes retirados en `destroy()`.

9. **Dos HUD con la misma cifra.** Si `emitSnapshot()` se retrasa un fotograma, las vidas del canvas y los corazones de React discrepan justo en el momento de morir, que es cuando el jugador mira. **Mitigación:** `lives -= 1` y la emisión en el mismo fotograma de la muerte.

10. **Rendimiento dentro del marco CRT.** Diez carriles con hasta cuatro objetos cada uno, glow en la rana y recorte al tablero, bajo scanlines, ruido y filtros CSS. **Mitigación:** `shadowBlur` solo en la rana y en los nenúfares ocupados; los obstáculos se pintan planos. Si va a tirones, el sospechoso es el efecto CRT.

11. **Nitidez al escalar.** 800 × 600 estirados a una pantalla grande se ven blandos, y las marcas de carril de 2 px lo acusan. Aceptado a cambio de no tocar las coordenadas; si molesta, se revisa con `devicePixelRatio` en otro spec.
