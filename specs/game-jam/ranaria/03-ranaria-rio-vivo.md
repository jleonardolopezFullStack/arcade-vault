# GAME JAM «RANARIA» · SPEC 3/3 — «Río vivo»: tortugas que se sumergen, mosca, cocodrilo y vida extra

**Estado:** Implementado
**Depende de:** SPEC 05, SPEC 06, `specs/game-jam/ranaria/02-juego-ranaria-rana.md`
**Tema:** «Ranaria» — juego estilo Frogger (rana que cruza carretera y río hasta los nenúfares).
**Fecha:** 2026-10-09

**Objetivo:** Ampliar el motor `lib/games/rana/` del SPEC 2/3 con los cuatro extras que su `### Fuera` dejó nombrados —tortugas que se sumergen, mosca de bonificación, cocodrilo y una vida extra— sin tocar el contrato, el reproductor ni Supabase.

---

## 0. Terreno que este spec da por hecho

El SPEC 2/3 está **implementado**: `/juegos/ranaria/jugar` se juega, `lib/games/rana/` tiene `constants.ts`, `lanes.ts`, `frog.ts`, `draw.ts` e `index.ts`, y el registro lleva `ranaria: createRanaEngine`. El SPEC 1/3 dejó `max_score` en `999 999`. **Este spec no toca Supabase.**

Todo lo que sigue se añade sobre la estructura del 2/3 —el orden de resolución de §2.5, los acumuladores en segundos, la bandera `paused`, `addScore()` con `SCORE_CAP`— y no la cambia. Si el 2/3 no está implementado, este spec no se empieza.

---

## 1. Alcance

### Dentro

- **Tortugas que se sumergen.** En las filas de tortugas (`2` y `5`), los grupos de índice impar bucean a partir del **nivel 2**: flotan, avisan hundiéndose a medias y desaparecen bajo el agua un rato. Sumergidas **no son plataforma**: la rana que esté encima cae al agua.
- **Mosca de bonificación.** Cada 8-12 s aparece una mosca en un nenúfar **libre** y se queda 5 s. Llegar a ese nenúfar mientras está la mosca suma `+200` además de lo habitual.
- **Cocodrilo a partir del nivel 3.** En la fila `1` el primer tronco se sustituye por un cocodrilo de 4 celdas: las tres traseras son plataforma; **la cabeza mata** con la causa nueva «MORDIDA».
- **Una vida extra** al llegar a 10 000 puntos, una sola vez por partida. El HUD de React la pinta como un cuarto corazón y el del canvas como una cuarta rana pequeña.
- **Todo con primitivas y la paleta del Vault**, como el 2/3: sin imágenes, sin audio, `start()` sincrónico.
- **Todos los temporizadores nuevos con acumuladores en segundos**, congelados por la pausa.

### Fuera (explícitamente)

- **Supabase.** Ni migración, ni tabla, ni vista, ni tipos. El tope de `999 999` del SPEC 1/3 sigue cubriendo: el máximo por nivel sube a ~4 350 (§2.5) y una partida excepcional sigue un orden de magnitud por debajo.
- **`submit_score`, `top_scores` y `game_stats`.** Dirigidos por el catálogo; no se editan.
- **`lib/games/types.ts` y `components/player/game-player.tsx`.** Sin cambios: el HUD de corazones ya pinta cuatro.
- **El copy y la portada.** `cover-rana` y el `long` de la ficha no se tocan.
- **Nutrias, serpientes en la mediana, la rana hembra que escoltar y cocodrilos dentro de los nenúfares.** Contenido del Frogger original que queda fuera del Vault.
- **Más de una vida extra**, o vidas por nivel. Una sola, a 10 000.
- **Cambios en la carretera.** Los cinco carriles de vehículos quedan como en el 2/3.
- **Sonido, WASD, ratón y táctil.** Igual que en el 2/3.
- **`references/`.** Es de solo lectura; este spec no lo lee siquiera.
- **Los otros motores.** No se tocan.
- **Tests.** Sigue sin haber runner configurado.

---

## 2. Modelo de datos

**No hay persistencia nueva.** Lo nuevo son constantes, tres campos de estado y una causa de muerte.

### 2.1 Las constantes nuevas

Se añaden a `lib/games/rana/constants.ts`, en su propio bloque «Río vivo»:

| Constante                         | Valor        | Qué hace                                                          |
| --------------------------------- | ------------ | ----------------------------------------------------------------- |
| `DIVE_FROM_LEVEL`                 | `2`          | Nivel a partir del cual bucean las tortugas                       |
| `DIVE_ROWS`                       | `[2, 5]`     | Filas de tortugas con grupos buceadores                           |
| `DIVE_SURFACE`                    | `3.0` s      | Tiempo a flote, plataforma plena                                  |
| `DIVE_WARN`                       | `0.8` s      | Aviso: medio hundidas, parpadeando; **siguen siendo plataforma**  |
| `DIVE_UNDER`                      | `1.2` s      | Bajo el agua: **no son plataforma**                               |
| `DIVE_PHASE`                      | `2.5` s      | Desfase entre los dos grupos buceadores de un carril              |
| `FLY_DELAY_MIN` · `FLY_DELAY_MAX` | `8` · `12` s | Espera, sorteada en ese intervalo, entre una mosca y la siguiente |
| `FLY_TTL`                         | `5` s        | Lo que dura la mosca en su nenúfar                                |
| `FLY_POINTS`                      | `200`        | Bonus por llegar a su nenúfar mientras está                       |
| `CROC_FROM_LEVEL`                 | `3`          | Nivel a partir del cual aparece el cocodrilo                      |
| `CROC_ROW`                        | `1`          | Fila del cocodrilo                                                |
| `CROC_LEN`                        | `4`          | Celdas totales: tres de lomo y una de cabeza                      |
| `EXTRA_LIFE_AT`                   | `10_000`     | Puntos a los que se gana la vida extra, una vez                   |

**El ciclo de buceo dura `3,0 + 0,8 + 1,2 = 5,0` s y `DIVE_PHASE` es la mitad.** Así los dos grupos buceadores de un carril nunca están bajo el agua a la vez: siempre hay, como mínimo, los dos grupos que no bucean y uno de los buceadores a flote. Si alguien cambia los tiempos del ciclo, `DIVE_PHASE` debe seguir siendo la mitad del total.

**`DIVE_UNDER` (1,2 s) es mayor que `HOP_COOLDOWN` (0,12 s) por un factor de diez**, y eso es a propósito: entre el final del aviso y el hundimiento la rana tiene tiempo de sobra para saltar fuera, así que morir sobre una tortuga que se hunde es siempre un error del jugador, no del motor.

### 2.2 Tortugas que se sumergen

Cada carril de `DIVE_ROWS` gana un acumulador `diveAcc`, que avanza con `dt` en `"playing"` y en `"dead"` —el río no se para porque la rana haya muerto— y se congela con `paused`. La fase de un grupo `i` es:

```ts
const t = mod(
  diveAcc + ((i - 1) / 2) * DIVE_PHASE,
  DIVE_SURFACE + DIVE_WARN + DIVE_UNDER,
);
phase =
  t < DIVE_SURFACE
    ? "surface"
    : t < DIVE_SURFACE + DIVE_WARN
      ? "warn"
      : "under";
```

Solo bucean los grupos de índice **impar** (`1` y `3`); los pares flotan siempre. Por debajo de `DIVE_FROM_LEVEL` todos flotan y `diveAcc` no avanza.

`platformUnder()` del 2/3 aprende a **saltarse los grupos en fase `"under"`**. No cambia nada más del orden de §2.5 del 2/3: si una tortuga se hunde con la rana encima, en el paso 1 del fotograma siguiente no hay plataforma y en el paso 5 la rana muere «AL AGUA». No hace falta ninguna rama especial.

### 2.3 La mosca

Estado nuevo: `fly` (`{ home, ttl } | null`) y `flyWait`, la espera sorteada hasta la próxima.

- `flyWait` se descuenta en `"playing"`. Al llegar a 0, si hay algún nenúfar libre, la mosca aparece en uno de ellos sorteado uniformemente, con `ttl = FLY_TTL`; si no hay ninguno libre, se vuelve a sortear la espera sin aparecer.
- `fly.ttl` se descuenta en `"playing"`; a 0 la mosca desaparece y se sortea la siguiente espera.
- Si la rana llega al nenúfar de la mosca: `addScore(FLY_POINTS)` además del nenúfar y del bonus de tiempo; la mosca desaparece y se sortea la siguiente espera.
- Al subir de nivel la mosca desaparece y la espera se vuelve a sortear.
- El sorteo usa `Math.random()` desde dentro de la instancia; no hay generador de módulo.

### 2.4 El cocodrilo

A partir de `CROC_FROM_LEVEL`, el objeto `0` del carril de la fila `1` —un tronco de 4 celdas en el 2/3— pasa a ser un cocodrilo de `CROC_LEN = 4` celdas. Como la fila `1` va hacia la derecha, **la cabeza es la celda delantera, la de la derecha**.

- **El lomo** —las tres celdas traseras— es plataforma con la misma `vx` del carril: `platformUnder()` lo devuelve como cualquier tronco.
- **La cabeza** no es plataforma: si el centro de la rana cae en ella, la muerte es **«MORDIDA»**, una causa nueva en `deathCause` (`"mordida"`).
- El paso 5 de §2.5 del 2/3 gana esta comprobación **antes** de la de «AL AGUA», para que caer en la cabeza se rotule como mordisco.

Mismo `len` que el tronco al que sustituye, así que **el invariante `count × gap ≥ COLS + len` del carril no cambia** y el envolvimiento sigue siendo invisible.

### 2.5 La vida extra y el nuevo máximo

`extraLifeGiven` se pone a `true` la primera vez que `score` cruza `EXTRA_LIFE_AT` dentro de `addScore()`, y entonces `lives += 1` en ese mismo fotograma —el snapshot cambia y el HUD de React pinta el cuarto corazón—. No vuelve a ocurrir en la partida; `restart()` lo devuelve a `false`.

**Máximo por nivel con los extras**: `5 × (470 + 200) + 1 000 = 4 350`. Una partida excepcional de 25-30 niveles se queda en ~110-130 k, y `SCORE_CAP = 999 999` —igual que `games.max_score`— sigue un orden de magnitud por encima. **No hace falta micro-migración.**

### 2.6 Las figuras y la paleta

`PALETTE` gana cuatro entradas:

```ts
croc: "#8a8fb5", // --ink-dim, el lomo
crocHead: "#ff006e", // --magenta, la cabeza que mata
fly: "#f5ff00", // --yellow
flyWing: "rgba(230, 233, 255, 0.6)", // --ink con alfa
```

- **Tortugas en aviso**: el mismo dibujo del 2/3 a la mitad de alfa y parpadeando a 6 Hz. **Bajo el agua**: solo un anillo tenue en `ripple` donde estaban, para que el hueco se lea como «aquí había algo».
- **Cocodrilo**: lomo como un tronco en `croc` con tres crestas triangulares; cabeza en `crocHead`, rectángulo redondeado con un ojo en `bg` y la mandíbula marcada. **La cabeza es magenta como los coches**: magenta significa «esto mata» en todo el tablero.
- **Mosca**: un círculo de 4 px en `fly` con dos alas en `flyWing`, sobre el nenúfar, temblando ±1 px.
- **«MORDIDA»**: el aspa de `death`, como «ATROPELLADA».

Ningún elemento nuevo es verde: el verde sigue siendo solo la rana y sus nenúfares.

### 2.7 Estado interno añadido

Dentro de la instancia, como todo lo del 2/3: `diveAcc` por carril de buceo, `fly`, `flyWait`, `extraLifeGiven`. `deathCause` gana `"mordida"`. Nada en variables de módulo.

---

## 3. Plan de implementación

Cada paso deja el proyecto compilando y el juego jugable; cada extra entra apagado hasta su paso.

1. **Constantes.** El bloque «Río vivo» de §2.1 en `lib/games/rana/constants.ts`, con el comentario de `DIVE_PHASE` como mitad del ciclo y el de `DIVE_UNDER ≫ HOP_COOLDOWN`, y las cuatro entradas nuevas de `PALETTE`.

2. **Tortugas que se sumergen.** `lib/games/rana/lanes.ts`: `diveAcc` en los carriles de `DIVE_ROWS`, `divePhase(lane, i)` y el salto de los grupos `"under"` en `platformUnder()`. `draw.ts`: los estados de aviso y bajo el agua. Activo a partir de `DIVE_FROM_LEVEL`.

3. **Cocodrilo.** `lanes.ts`: el objeto `0` de la fila `1` marcado como cocodrilo a partir de `CROC_FROM_LEVEL`, `crocHeadAt(lanes, x)` y el lomo como plataforma. `frog.ts`: la comprobación de la cabeza antes de «AL AGUA» y la causa `"mordida"`. `draw.ts`: lomo, crestas, cabeza y rótulo «MORDIDA».

4. **Mosca.** `frog.ts` / `index.ts`: `fly`, `flyWait`, el sorteo sobre nenúfares libres, la caducidad, el bonus al llegar y la limpieza al subir de nivel. `draw.ts`: la mosca.

5. **Vida extra.** `addScore()` en `index.ts`: `extraLifeGiven` y `lives += 1` al cruzar `EXTRA_LIFE_AT`; `restart()` lo reinicia. El HUD del canvas pinta hasta cuatro ranas.

6. **El reproductor y el contrato no se tocan.** `components/player/game-player.tsx` y `lib/games/types.ts` quedan como están.

7. **Recorrido completo.** Partida real en `/juegos/ranaria/jugar`: en el nivel 1 ninguna tortuga bucea; en el 2 ver el aviso y caer al agua quedándose encima; en el 3 ver el cocodrilo, montar en su lomo y morir con «MORDIDA» en su cabeza; esperar una mosca, llegar a su nenúfar y comprobar los `+200`; cruzar los 10 000 puntos y ver el cuarto corazón en los dos HUD; pausar con una tortuga en aviso y comprobar que al reanudar sigue en aviso. Después `npm run lint` y `npm run build` limpios, y `git status` sin cambios fuera de `lib/games/rana/`.

---

## 4. Criterios de aceptación

- [ ] En el nivel 1 **ninguna tortuga bucea**.
- [ ] Desde el nivel 2, en las filas 2 y 5, los grupos de índice impar pasan por flotar, aviso y hundimiento en un ciclo de ~5 s; los de índice par flotan siempre.
- [ ] El aviso se ve —medio hundidas y parpadeando— y **durante el aviso siguen sosteniendo a la rana**.
- [ ] Una rana sobre un grupo que se hunde muere con «AL AGUA» en el fotograma en que desaparece.
- [ ] **Los dos grupos buceadores de un carril nunca están bajo el agua a la vez.**
- [ ] Saltar a un hueco de tortugas sumergidas mata con «AL AGUA», aunque el anillo tenue se vea.
- [ ] Desde el nivel 3 hay un cocodrilo en la fila 1, con la cabeza magenta en el lado hacia el que avanza.
- [ ] El lomo del cocodrilo arrastra a la rana como un tronco; caer en la cabeza mata con el rótulo «MORDIDA».
- [ ] El cocodrilo entra y sale del tablero recortado por el borde, sin aparecer de golpe.
- [ ] Cada 8-12 s aparece una mosca amarilla en un nenúfar **libre** y desaparece a los 5 s.
- [ ] **La mosca nunca aparece en un nenúfar ocupado**, y con los cinco ocupados no aparece.
- [ ] Llegar al nenúfar de la mosca suma `200` más los puntos normales de llegada; la mosca desaparece.
- [ ] Al subir de nivel no queda ninguna mosca en el tablero.
- [ ] Al cruzar 10 000 puntos se gana **una** vida: el HUD de React pinta cuatro corazones y el canvas cuatro ranas, en el mismo fotograma.
- [ ] Pasar de 20 000 puntos **no** da una segunda vida extra; REINICIAR permite volver a ganarla.
- [ ] **Con el juego en pausa no avanzan ni el buceo, ni la mosca, ni su espera**: al reanudar cada cosa sigue en la misma fase.
- [ ] El marcador sigue saturando en `999 999`.
- [ ] Ningún elemento nuevo es verde; la cabeza del cocodrilo es magenta.
- [ ] **No se carga ninguna imagen** y `drawImage` sigue sin aparecer en `lib/games/rana/`.
- [ ] No suena nada.
- [ ] El motor **no** reclama `P` ni `Escape`, y `P`, `Escape`, SALIR y FIN siguen haciendo lo suyo.
- [ ] Al salir de la ruta no queda bucle ni oyentes vivos, y el doble montaje en modo estricto no dobla la velocidad del ciclo de buceo ni de la mosca.
- [ ] `lib/games/types.ts` y `components/player/game-player.tsx` están **sin tocar**; los otros cuatro motores tampoco cambian.
- [ ] **`references/` no tiene ningún cambio**, `public/` no gana ficheros y no hay ninguna migración nueva en `supabase/migrations/`.
- [ ] `npm run lint` y `npm run build` terminan sin errores ni avisos nuevos.

---

## 5. Decisiones tomadas y descartadas

| Decisión                                                   | Alternativa descartada                     | Motivo                                                                                                                                                                                                    |
| ---------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Los extras en un spec aparte**                           | Meterlos en el SPEC 2/3                    | Decisión autónoma (game jam). El 2/3 ya es esfuerzo M; las tortugas buceadoras complican la colisión del río y conviene verificar primero la versión en que todas flotan. Coste: un spec más que aprobar. |
| **Bucean solo los grupos impares, desde el nivel 2**       | Todos los grupos, o desde el nivel 1       | Decisión autónoma (game jam). Con todos buceando hay momentos sin ninguna plataforma; desde el nivel 1, quien empieza muere sin entender por qué. Coste: el río del nivel 1 es igual que el del 2/3.      |
| **Aviso de 0,8 s que sigue siendo plataforma**             | Hundimiento sin aviso                      | Un hundimiento sin aviso es una muerte injusta. Con el aviso, y con `DIVE_UNDER` diez veces el cooldown, morir es siempre evitable.                                                                       |
| **`DIVE_PHASE` = medio ciclo**                             | Desfase aleatorio por grupo                | Determinista y verificable: los dos buceadores nunca coinciden bajo el agua. Aleatorio podría alinearlos y dejar el carril casi vacío.                                                                    |
| **La mosca solo en nenúfares libres, con espera sorteada** | Mosca fija en un nenúfar, o en uno ocupado | Decisión autónoma (game jam). En uno ocupado sería inalcanzable; fija sería trivial. Sortear la espera evita que se aprenda el ritmo.                                                                     |
| **Cocodrilo que sustituye a un tronco existente**          | Un objeto nuevo en el carril               | Conserva `count`, `len` y `gap` de la fila 1, así que el invariante de envolvimiento del 2/3 no se toca.                                                                                                  |
| **Cabeza siempre mortal**                                  | Boca que se abre y se cierra               | Decisión autónoma (game jam). Una boca con ciclo es otro temporizador que leer; la cabeza magenta siempre letal se entiende de un vistazo y es coherente con «magenta mata».                              |
| **Una sola vida extra a 10 000**                           | Una cada 10 000, o una por nivel           | Decisión autónoma (game jam). Varias vidas extra con niveles infinitos alargarían las partidas sin límite y desequilibrarían el ranking. 10 000 llega hacia el nivel 3-4.                                 |
| **Sin micro-migración**                                    | Subir `max_score`                          | El máximo por nivel pasa de ~3 350 a ~4 350; `999 999` sigue cubriendo de sobra.                                                                                                                          |
| **El río sigue vivo con la rana muerta**                   | Congelar los carriles durante `DEATH_TIME` | Coherente con el 2/3: solo la pausa congela el mundo. El buceo avanza igual que el resto de carriles.                                                                                                     |

---

## 6. Riesgos identificados

1. **Doble montaje en desarrollo.** Con más acumuladores, un segundo bucle vivo se nota en más sitios: tortugas que bucean al doble de ritmo, moscas que caducan a media vida. **Mitigación:** las mismas guardas `destroyed` y `listening` del 2/3, y el criterio que lo comprueba a mano.

2. **La tortuga que se hunde bajo los pies.** Si `platformUnder()` no salta los grupos `"under"`, la rana camina sobre el agua; si los salta también en `"warn"`, muere durante el aviso. **Mitigación:** la fase se calcula en una sola función, `divePhase()`, y hay criterios para los dos lados.

3. **La cabeza del cocodrilo en el lado equivocado.** Si la fila 1 cambiara de dirección y nadie actualizara la cabeza, el cocodrilo mordería con la cola. **Mitigación:** la cabeza se deriva del signo de `dir`, nunca de un índice fijo.

4. **El orden de las comprobaciones en el río.** Si «AL AGUA» se comprueba antes que la cabeza, caer en la boca se rotula como chapuzón. **Mitigación:** el orden queda escrito en §2.4 y tiene criterio propio.

5. **Temporizadores que no se congelan.** `diveAcc`, `flyWait` y `fly.ttl` son tres acumuladores más, y basta que uno se descuente fuera de la rama `!paused` para que la pausa deje de ser pausa. **Mitigación:** un solo bloque del bucle descuenta todos los acumuladores, detrás de la misma guarda.

6. **La vida extra y el HUD.** Si `lives += 1` no emite snapshot en el mismo fotograma, el cuarto corazón llega tarde o no llega. **Mitigación:** se hace dentro de `addScore()`, antes de `emitSnapshot()`.

7. **Los números no vienen calibrados.** Ciclo de 5 s, mosca cada 8-12 s, `+200`, vida a 10 000 y niveles de entrada son una primera apuesta. **Mitigación:** todos en el bloque «Río vivo» de `constants.ts`.

8. **El río se vuelve ilegible.** Tortugas parpadeando, anillos de hundimiento, cocodrilo y mosca a la vez pueden saturar la mitad superior dentro del CRT. **Mitigación:** el aviso usa alfa y parpadeo, no un color nuevo; si aun así se ve confuso, se baja `DIVE_ROWS` a una sola fila.

9. **Rendimiento dentro del marco CRT.** Más figuras y más estados por fotograma bajo scanlines y filtros. **Mitigación:** ningún `shadowBlur` en los elementos nuevos.
