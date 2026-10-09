# GAME JAM «RANARIA» · SPEC 1/3 — Catálogo y leaderboard de RANARIA: la ficha sembrada, con su tope de marca alineado con el motor

**Estado:** Implementado
**Depende de:** SPEC 05, SPEC 06
**Tema:** «Ranaria» — juego estilo Frogger (rana que cruza carretera y río hasta los nenúfares).
**Fecha:** 2026-10-09

**Objetivo:** Dejar la ficha `ranaria` de `public.games` lista para recibir marcas del motor del SPEC 2/3 con una sola micro-migración que baja su `max_score` de `10 000 000` a `999 999`, el tope del contador del juego, verificando que su tabla y su rama de la vista `leaderboard` ya existen.

---

## 1. Por qué existe este spec

El agente `game-jam` recibió el tema «Ranaria» y la primera lectura del catálogo cambió la forma del paquete: **la ficha ya existe**. SPEC 06 sembró ocho juegos, y `ranaria` es uno de los cuatro que todavía muestran «PRÓXIMAMENTE». Su copy —«Salta entre carriles de coches a toda velocidad y troncos a la deriva en el río. Llega a los nenúfares antes de que se acabe el tiempo.»— describe palabra por palabra el Frogger que pide el tema. Así que este paquete no crea un juego nuevo en la base de datos: **le da motor a una ficha que ya tiene catálogo, tabla y rama**.

Eso vacía casi entero el spec de leaderboard habitual. Añadir un juego son tres piezas —la tabla `scores_<slug>`, **la rama de la vista `leaderboard`** y la fila de `games`—, y la que se olvida es la segunda: sin ella el juego existe, se juega, `submit_score` escribe la fila correctamente… y su ranking sale vacío para siempre sin ningún error en ninguna capa. Aquí las tres están puestas desde SPEC 06, y este spec **lo comprueba en vez de suponerlo**. Lo único que cambia son las reglas de puntuación: el motor del SPEC 2/3 satura su marcador en `999 999` —un contador de seis cifras de recreativa—, y `max_score` se alinea con ese tope para que `submit_score` rechace con `22003` cualquier marca que el juego no pueda producir. Es la micro-migración que describe `.claude/skills/spec-game/migracion.md` §6.

---

## 2. Alcance

### Dentro

- **Una sola micro-migración** `reglas_ranaria`, aplicada **de verdad** con `mcp__supabase__apply_migration` sobre el proyecto `ekcduxcscntnisfhbiqc`: una guarda que aborta si `scores_ranaria` ya tuviera marcas por encima del nuevo tope, y el `update public.games set max_score = 999999 where id = 'ranaria'`. Atómica: o entra entera o no entra.
- **Copia versionada** en `supabase/migrations/<timestamp>_reglas_ranaria.sql`, con el nombre exacto que devuelva `list_migrations`.
- **Reversión escrita antes de aplicar**: `supabase/rollback/004_reglas_ranaria.down.sql`, que devuelve `max_score` a `10000000`.
- **Comprobación de las tres piezas** que SPEC 06 dejó puestas: la fila `ranaria`, la tabla `scores_ranaria` con RLS y una sola política de `select`, y **la rama `'ranaria'` en `leaderboard`**, releída con `pg_get_viewdef` antes de aplicar.
- **Una línea en `supabase/README.md`**, en «Si algo va mal», diciendo que `004` es inocua —solo restaura un número— y que se aplica antes que `003`.
- **Asesores** revisados con `mcp__supabase__get_advisors`: ningún aviso nuevo.

### Fuera (explícitamente)

- **El motor.** Ni `lib/games/rana/`, ni la línea del registro. Tras este spec `/juegos/ranaria/jugar` **sigue mostrando «PRÓXIMAMENTE»** con su ranking vacío y «SÉ EL PRIMERO» en `/juegos/ranaria`: es un estado válido y deseado del reproductor. El motor es el SPEC 2/3.
- **La tabla, la rama de la vista y la fila.** Existen desde SPEC 06. **No hay `create table`, ni `create or replace view`, ni `insert`.** Reescribir la vista sin necesidad es exactamente la operación en la que se pierde una rama.
- **La portada.** `cover-rana` ya existe en `app/globals.css` —agua a franjas cian y una rana verde— y encaja con el juego. `app/globals.css` no se toca.
- **El copy de la ficha.** `title`, `short` y `long` describen ya este juego. No se reescriben.
- **`score_label`, `score_order` y `leaderboard_size`.** Siguen en `PUNTOS`, `desc` y `12`, que son los correctos.
- **`submit_score`, `top_scores` y `game_stats`.** Están dirigidos por el catálogo: `submit_score` lee `max_score` de `games` en cada llamada, así que el tope nuevo rige desde que se aplica la migración sin tocar la función. No se editan.
- **`lib/database.types.ts`.** El esquema no cambia —solo un dato—, así que no se regenera (`migracion.md` §6).
- **El CLI de Supabase, Docker, `db push` y las ramas de Supabase.** Igual que en SPEC 06: MCP directo sobre el proyecto, que está en el plan Free.
- **Autenticación.** El alias sigue siendo el de `localStorage['av_user']`.
- **`references/`.** Es de solo lectura y este spec no lo lee siquiera.

---

## 3. Modelo de datos

### 3.1 Lo que la base ya tiene

Leído el 2026-10-09 con `mcp__supabase__execute_sql` sobre `public.games` y `public.scores_ranaria`:

| Columna         | Valor                                                                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `id`            | `ranaria`                                                                                                                                 |
| `title`         | `RANARIA`                                                                                                                                 |
| `short`         | «Cruza la autopista de pixeles.»                                                                                                          |
| `long`          | «Salta entre carriles de coches a toda velocidad y troncos a la deriva en el río. Llega a los nenúfares antes de que se acabe el tiempo.» |
| `cat` · `color` | `ARCADE` · `green`                                                                                                                        |
| `cover`         | `cover-rana` —la clase existe en `app/globals.css`—                                                                                       |
| `sort_order`    | `7`                                                                                                                                       |
| `scores_table`  | `scores_ranaria` —**0 filas**, `max(score)` nulo—                                                                                         |
| Reglas hoy      | `desc` · `PUNTOS` · `12` · **`10000000`**                                                                                                 |
| Reglas tras 1/3 | `desc` · `PUNTOS` · `12` · **`999999`**                                                                                                   |

`specs/game-jam/` estaba vacío al escribir este paquete: no hay jams pendientes con ids, tablas, portadas ni `sort_order` reservados. Este paquete **no reserva ninguno nuevo**: usa los de la ficha sembrada.

### 3.2 La rama de la vista

`pg_get_viewdef('public.leaderboard'::regclass, true)` devolvió el 2026-10-09 estas ocho ramas, **con `ranaria` en séptimo lugar**:

```sql
 SELECT 'bloque-buster'::text AS game_id, scores_bloque_buster.id, scores_bloque_buster.name, scores_bloque_buster.score, scores_bloque_buster.created_at
   FROM scores_bloque_buster
UNION ALL
 SELECT 'caida'::text AS game_id, scores_caida.id, scores_caida.name, scores_caida.score, scores_caida.created_at
   FROM scores_caida
UNION ALL
 SELECT 'serpentina'::text AS game_id, scores_serpentina.id, scores_serpentina.name, scores_serpentina.score, scores_serpentina.created_at
   FROM scores_serpentina
UNION ALL
 SELECT 'gloton'::text AS game_id, scores_gloton.id, scores_gloton.name, scores_gloton.score, scores_gloton.created_at
   FROM scores_gloton
UNION ALL
 SELECT 'invasores'::text AS game_id, scores_invasores.id, scores_invasores.name, scores_invasores.score, scores_invasores.created_at
   FROM scores_invasores
UNION ALL
 SELECT 'rocas'::text AS game_id, scores_rocas.id, scores_rocas.name, scores_rocas.score, scores_rocas.created_at
   FROM scores_rocas
UNION ALL
 SELECT 'ranaria'::text AS game_id, scores_ranaria.id, scores_ranaria.name, scores_ranaria.score, scores_ranaria.created_at
   FROM scores_ranaria
UNION ALL
 SELECT 'duelo-pixel'::text AS game_id, scores_duelo_pixel.id, scores_duelo_pixel.name, scores_duelo_pixel.score, scores_duelo_pixel.created_at
   FROM scores_duelo_pixel;
```

**Esto es evidencia, no SQL que ejecutar.** La vista **no se reescribe** en este spec: la rama ya está. Lo que el plan exige es **releerla en el paso 1** y parar si `'ranaria'` no aparece —por ejemplo, porque alguien rehízo la vista desde el panel o porque otra jam aplicada antes la reescribió mal—. Nunca se da por buena la lista copiada aquí.

Si esa relectura revelara que falta la rama, este spec **no** la añade por su cuenta: para, y el arreglo es una migración aparte con el `create or replace view public.leaderboard with (security_invoker = on)` completo —todas las ramas vigentes más `ranaria`, solo la primera con `as game_id`— según `migracion.md` §2.

### 3.3 La migración

`supabase/migrations/<timestamp>_reglas_ranaria.sql`:

```sql
-- GAME JAM «RANARIA» · SPEC 1/3 — Reglas de RANARIA.
--
-- La ficha, su tabla scores_ranaria y su rama en la vista leaderboard existen
-- desde SPEC 06. Lo único que cambia es el tope de marca: el motor de
-- lib/games/rana/ satura su contador en 999 999 (SCORE_CAP), y max_score se
-- alinea con él para que submit_score rechace con 22003 cualquier marca que
-- el juego no pueda producir.

-- 1) Guarda: no se baja el tope por debajo de una marca ya guardada.
do $$
begin
  if exists (select 1 from public.scores_ranaria where score > 999999) then
    raise exception 'scores_ranaria tiene marcas por encima de 999999'
      using errcode = '23514';
  end if;
end
$$;

-- 2) El tope nuevo.
update public.games
   set max_score = 999999
 where id = 'ranaria';
```

La guarda va **dentro** de la migración y no solo como paso del plan: `apply_migration` es transaccional, así que si salta, el `update` no llega a aplicarse. Hoy `scores_ranaria` está vacía y la guarda pasa; existe para el caso en que alguien guarde una marca a mano entre la escritura de este spec y su aplicación.

### 3.4 Lo que no cambia

Para que nadie lo edite por iniciativa propia:

- **`public.submit_score`** resuelve la tabla desde `games.scores_table` con `format(..., %1$I, ...)` y compara contra `g.max_score` leído en cada llamada. El tope nuevo rige **sin tocar la función**.
- **`public.top_scores(p_game)`** ordena, rompe empates por antigüedad y recorta por `leaderboard_size`. No sabe nada de `max_score`.
- **`public.game_stats`** hace `left join` desde `games`: `ranaria` ya tiene fila con `plays = 0` y `best` nulo.
- **`public.leaderboard`**: ver §3.2. No se reescribe.
- **`lib/database.types.ts`**: `max_score` sigue siendo `number`. No se regenera.

### 3.5 Los ficheros de migración

```
supabase/
  migrations/
    20260926091434_catalogo_y_marcadores.sql
    20260926091607_siembra_catalogo.sql
    20260926091843_vistas_y_funciones.sql
    <timestamp>_reglas_ranaria.sql          ← nuevo
  rollback/
    001_catalogo_y_marcadores.down.sql
    002_siembra_catalogo.down.sql
    003_vistas_y_funciones.down.sql
    004_reglas_ranaria.down.sql             ← nuevo
  README.md                                 ← una línea en «Si algo va mal»
```

El nombre del fichero de `migrations/` **debe coincidir** con el que registre Supabase en `list_migrations`: es lo que permite contrastar repositorio y base de un vistazo.

### 3.6 La reversión

`supabase/rollback/004_reglas_ranaria.down.sql`:

```sql
-- Reversión de migrations/<timestamp>_reglas_ranaria.sql
--
-- Devuelve el tope de RANARIA al valor sembrado en SPEC 06. No toca la tabla,
-- ni la vista, ni ninguna marca: solo un número.

update public.games
   set max_score = 10000000
 where id = 'ranaria';
```

El orden inverso de `migracion.md` §5 —vista, fila, tabla— **no aplica aquí**, porque esta migración no crea ninguna de las tres: deshacerla es restaurar un dato. Por la misma razón es inocua, y se puede aplicar en cualquier momento sin dependientes que romper. **No se aplica en el camino feliz.**

---

## 4. Plan de implementación

Los pasos 1 a 5 **leen o modifican el proyecto Supabase real** (`ekcduxcscntnisfhbiqc`). No hay entorno de pruebas.

> **Aviso para quien implemente:** el `allowed-tools` de `/spec-impl` no incluye los MCP de Supabase ni `Bash(npm:*)`. Si la herramienta queda bloqueada, los pasos 1 a 5 se ejecutan en una sesión normal, y después se vuelve a `/spec-impl` para el resto del plan.

0. **Escribir antes de aplicar.** `supabase/migrations/reglas_ranaria.sql` (provisional, se renombra en el paso 4) con el SQL de §3.3, y `supabase/rollback/004_reglas_ranaria.down.sql` con el de §3.6. Los dos, **antes** de tocar la base.

1. **Contrastar la vista con la realidad.** `select pg_get_viewdef('public.leaderboard'::regclass, true);` y comprobar que contiene la rama `'ranaria'::text AS game_id … FROM scores_ranaria`. **Si no está, parar y avisar**: el arreglo es otra migración (§3.2), no este spec. Nunca confiar en la lista copiada en §3.2: otra jam aplicada antes pudo cambiar la vista.

2. **Comprobar que no se pisa nada.** `mcp__supabase__list_tables` muestra `games` y las ocho `scores_*`, con `scores_ranaria` entre ellas y RLS activo; `list_migrations` devuelve las tres de SPEC 06 y **ninguna** `reglas_ranaria`; y `select max_score from public.games where id = 'ranaria'` devuelve `10000000`. Si ya fuera `999999`, la migración ya se aplicó: parar.

3. **Aplicar.** `mcp__supabase__apply_migration` con nombre `reglas_ranaria` y el SQL de §3.3.

4. **Renombrar la copia.** `mcp__supabase__list_migrations` y renombrar el fichero del repositorio al `<timestamp>_reglas_ranaria.sql` exacto que devuelva.

5. **Verificar de verdad**, con `mcp__supabase__execute_sql`:

   ```sql
   select max_score from public.games where id = 'ranaria';             -- 999999
   select count(*) from public.games;                                   -- sigue en 8
   select * from public.leaderboard where game_id = 'ranaria';          -- 0 filas, sin error
   select public.submit_score('ranaria', 'TEST', 999999);               -- entra: el tope es inclusivo
   select * from public.leaderboard where game_id = 'ranaria';          -- ← 1 fila: la rama funciona
   select * from public.game_stats where game_id = 'ranaria';           -- plays = 1, best = 999999
   select public.submit_score('ranaria', 'TEST', 1000000);              -- error 22003
   delete from public.scores_ranaria where name = 'TEST';               -- limpiar la prueba
   select count(*) from public.scores_ranaria;                          -- 0
   ```

   La quinta consulta es la que atrapa una rama perdida: si la marca de prueba entra pero `leaderboard` no la devuelve, la vista está rota y hay que parar.

6. **Asesores.** `mcp__supabase__get_advisors` de seguridad y de rendimiento. Solo los tres avisos documentados en `supabase/README.md`; un `update` de datos no puede añadir ninguno.

7. **README.** Una línea en «Si algo va mal» de `supabase/README.md`: las reversiones se aplican en orden inverso `004` → `003` → `002` → `001`, y `004` solo restaura `max_score` de `ranaria`.

8. **Cierre.** `npm run build` limpio —ninguna ruta cambia— y `/juegos/ranaria` sigue pintando la ficha con «SÉ EL PRIMERO», y `/juegos/ranaria/jugar` sigue en «PRÓXIMAMENTE». `git status` sin cambios en `lib/`, `app/`, `components/` ni `references/`.

---

## 5. Criterios de aceptación

- [ ] `select * from public.leaderboard where game_id = 'ranaria'` se ejecuta sin error, y tras la marca de prueba del paso 5 **devuelve esa fila**.
- [ ] `select max_score from public.games where id = 'ranaria'` devuelve `999999`.
- [ ] `submit_score('ranaria', 'TEST', 999999)` entra y `submit_score('ranaria', 'TEST', 1000000)` falla con `22003`.
- [ ] `select count(*) from public.games` sigue devolviendo `8`, y ninguna otra fila de `games` ha cambiado.
- [ ] `scores_ranaria` vuelve a estar vacía tras la limpieza del paso 5.
- [ ] `mcp__supabase__list_tables` muestra `scores_ranaria` con RLS activo y **una sola** política, de `select`.
- [ ] `mcp__supabase__list_migrations` devuelve cuatro migraciones, y `supabase/migrations/` contiene un `.sql` por cada una **con el mismo nombre**.
- [ ] `supabase/rollback/004_reglas_ranaria.down.sql` existe, se escribió antes de aplicar y restaura `max_score = 10000000` solo para `ranaria`.
- [ ] La vista `leaderboard` **no** se ha reescrito: `pg_get_viewdef` devuelve las mismas ocho ramas que antes de aplicar.
- [ ] `submit_score`, `top_scores` y `game_stats` no tienen ningún cambio.
- [ ] `mcp__supabase__get_advisors` no añade ningún aviso a los tres documentados en `supabase/README.md`.
- [ ] `lib/database.types.ts` no tiene ningún cambio.
- [ ] `app/globals.css` no tiene ningún cambio: `cover-rana` sigue siendo la portada.
- [ ] `/juegos/ranaria` muestra la ficha con su ranking vacío y «SÉ EL PRIMERO»; `/juegos/ranaria/jugar` sigue mostrando «PRÓXIMAMENTE».
- [ ] Desde la consola del navegador, un `insert` directo en `scores_ranaria` es rechazado por RLS y el `select` funciona.
- [ ] `references/` no tiene ningún cambio.
- [ ] `npm run lint` y `npm run build` terminan sin errores ni avisos nuevos.

---

## 6. Decisiones tomadas y descartadas

| Decisión                                   | Alternativa descartada                                                             | Motivo                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------ | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **El juego vive en la ficha `ranaria`**    | Una ficha nueva (`charca`, `rana-neon`) con tabla, rama, fila y `.cover-*` propias | Decisión autónoma (game jam). La ficha existe, su copy describe el tema palabra por palabra y su tabla, su rama y su portada están puestas desde SPEC 06; además el game-planner la sugirió por su id. Una ficha nueva duplicaría un Frogger en el catálogo y dejaría `ranaria` en «PRÓXIMAMENTE» para siempre. Coste: el paquete no sigue la forma «tres piezas» del spec 01 habitual, y este spec es casi todo verificación.                     |
| **Este spec va primero**                   | Escribir solo el motor y dejar las reglas como están                               | Decisión autónoma (game jam). Con el 01 aplicado, la primera marca que entre por el motor del 02 ya respeta el tope definitivo; al revés, habría una ventana en la que el ranking admitiría marcas que el motor no puede producir. Y la ruta en «PRÓXIMAMENTE» tras el 01 es un estado válido del reproductor.                                                                                                                                     |
| **`max_score = 999 999`**                  | Dejar `10 000 000`; o un tope más ajustado, como `200 000`                         | Decisión autónoma (game jam). Un nivel completo vale como mucho ~3 350 puntos (§2.3 del SPEC 2/3) y una partida excepcional de 25-30 niveles ronda 80-100 k: `999 999` deja un margen ×10 y coincide con el contador de seis cifras del canvas, que satura ahí. `10 M` es inalcanzable y no rechaza nada; `200 000` podría cortar una partida maratoniana legítima, porque los niveles son infinitos. Coste: una migración para cambiar un número. |
| **Guarda dentro de la migración**          | Comprobar las marcas solo como paso del plan                                       | Hace la migración segura por sí misma: si alguien guarda una marca alta entre la escritura y la aplicación, el `update` no entra. Cuesta un bloque `do`.                                                                                                                                                                                                                                                                                           |
| **No se reescribe la vista**               | Rehacer `leaderboard` «por si acaso» con todas las ramas                           | La rama está, leída con `pg_get_viewdef`. Reescribir una vista que funciona es la operación en la que se pierde una rama; aquí solo se relee y se para si falta.                                                                                                                                                                                                                                                                                   |
| **No se regeneran los tipos**              | Regenerar `lib/database.types.ts` como en cualquier migración                      | `migracion.md` §6: cambia un dato, no el esquema. Regenerar daría el mismo fichero, o uno con diferencias espurias de orden.                                                                                                                                                                                                                                                                                                                       |
| **Reversión `004` que restaura un número** | Reversión en orden inverso vista → fila → tabla                                    | Ese orden es para migraciones que crean las tres piezas; esta no crea ninguna. Borrar la fila o la tabla de `ranaria` sería destruir lo que sembró SPEC 06.                                                                                                                                                                                                                                                                                        |
| **El copy y la portada se dejan**          | Reescribir el `long` o diseñar una `.cover-*` nueva                                | El `long` promete coches, troncos, nenúfares y tiempo, que es exactamente lo que trae el SPEC 2/3. `cover-rana` —agua a franjas cian y una rana verde— encaja. Cambiarlos sería gusto, no necesidad.                                                                                                                                                                                                                                               |

---

## 7. Riesgos identificados

1. **La rama olvidada, el fallo silencioso.** Aquí no se crea ninguna rama, pero el riesgo no desaparece: si alguien rehízo la vista desde el panel sin `ranaria`, el motor del 02 guardaría marcas que nunca se ven. **Mitigación:** el paso 1 relee `pg_get_viewdef` y para si falta, y el primer criterio de aceptación comprueba la rama con una marca real.

2. **Otra jam aplicada antes cambia la vista.** Si otro paquete de `specs/game-jam/` se implementa antes que este y reescribe `leaderboard`, la lista de §3.2 queda vieja, y una reescritura descuidada pudo perder `ranaria`. **Mitigación:** el paso 1 relee la vista y nunca confía en la lista del spec; este spec no la reescribe.

3. **No hay entorno de pruebas.** `apply_migration` va a la base que usa la aplicación. **Mitigación:** la migración es un `update` acotado por `id` con guarda, y la reversión está escrita antes de aplicar.

4. **La copia del repositorio puede quedarse atrás.** Si alguien ejecuta el `update` desde el panel sin copiarlo, `supabase/migrations/` miente. **Mitigación:** el paso 2 contrasta `list_migrations` con la carpeta, y el paso 4 renombra la copia al nombre registrado.

5. **El tope y el motor pueden desincronizarse.** `SCORE_CAP` del SPEC 2/3 y `max_score` deben valer lo mismo, y nada lo valida. Si alguien sube uno sin el otro, o el motor produce marcas que la base rechaza con `22003` —el modal enseñaría su estado de error—, o la base admite marcas que el motor nunca daría. **Mitigación:** el comentario de `SCORE_CAP` en `lib/games/rana/constants.ts` y el de esta migración se citan mutuamente.

6. **El alias es de quien lo escriba primero.** `unique (name)` sin autenticación: el primero que guarde como `PX_KAI` en RANARIA se queda el alias. Es la decisión de SPEC 06 y se revisa con el spec de auth.

7. **La marca de prueba se queda en el ranking.** Si el paso 5 se interrumpe antes del `delete`, `TEST` con `999 999` encabeza `/juegos/ranaria` y es imbatible. **Mitigación:** el `delete` acotado por `name = 'TEST'` y el criterio de que `scores_ranaria` vuelve a estar vacía.

8. **Un spec de base de datos sin efecto visible.** Tras aplicar, la aplicación se ve exactamente igual: la ruta sigue en «PRÓXIMAMENTE». Es lo previsto, pero puede parecer trabajo perdido. El efecto llega con el SPEC 2/3.
